use anyhow::Result;
use clap::{Parser, Subcommand};
use solana_tx_optimizer::{
    bundle::JitoBundleBuilder,
    config::Config,
    priority_fee::{FeeStrategy, PriorityFeeEstimator},
};
use tracing::{info, Level};
use tracing_subscriber::EnvFilter;

#[derive(Parser)]
#[command(
    name = "tx-optimizer",
    about = "Solana Transaction Optimization CLI",
    long_about = "A toolkit for optimizing Solana transactions with dynamic priority fees and Jito bundle support.",
    version
)]
struct Cli {
    /// RPC endpoint URL (overrides SOLANA_RPC_URL env var)
    #[arg(long, global = true)]
    rpc_url: Option<String>,

    /// Log verbosity level
    #[arg(long, global = true, default_value = "info")]
    log_level: String,

    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Estimate optimal priority fee based on recent network activity
    EstimateFee {
        /// Fee strategy: economy, standard, fast, turbo
        #[arg(short, long, default_value = "standard")]
        strategy: String,

        /// Apply a safety buffer multiplier (e.g., 1.2 for 20% extra)
        #[arg(short, long)]
        buffer: Option<f64>,

        /// Scope estimation to transactions involving these program IDs (comma-separated)
        #[arg(long)]
        programs: Option<String>,

        /// Output as JSON
        #[arg(long)]
        json: bool,
    },

    /// Submit a Jito bundle (reads transactions from stdin)
    Bundle {
        /// Tip amount in lamports for Jito validators
        #[arg(short, long, default_value = "10000")]
        tip: u64,

        /// Wait for bundle confirmation
        #[arg(long)]
        confirm: bool,

        /// Confirmation timeout in seconds
        #[arg(long, default_value = "30")]
        timeout: u64,
    },

    /// Monitor a transaction's confirmation status
    Monitor {
        /// Transaction signature to monitor
        #[arg(required = true)]
        signature: String,

        /// Use WebSocket subscription instead of polling
        #[arg(long)]
        websocket: bool,
    },
}

fn parse_strategy(s: &str) -> Result<FeeStrategy> {
    match s.to_lowercase().as_str() {
        "economy" => Ok(FeeStrategy::Economy),
        "standard" => Ok(FeeStrategy::Standard),
        "fast" => Ok(FeeStrategy::Fast),
        "turbo" => Ok(FeeStrategy::Turbo),
        _ => anyhow::bail!(
            "Unknown strategy '{}'. Valid options: economy, standard, fast, turbo",
            s
        ),
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    let cli = Cli::parse();

    // Initialize tracing with env filter
    let filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new(&cli.log_level));

    tracing_subscriber::fmt()
        .with_env_filter(filter)
        .with_target(false)
        .init();

    // Load config from env, then apply CLI overrides
    let mut config = Config::from_env();
    if let Some(rpc_url) = cli.rpc_url {
        config.rpc_url = rpc_url;
    }

    match cli.command {
        Commands::EstimateFee {
            strategy,
            buffer,
            programs,
            json,
        } => {
            let strategy = parse_strategy(&strategy)?;
            let mut estimator = PriorityFeeEstimator::new(&config.rpc_url);

            // Optionally scope to specific program IDs
            if let Some(program_ids) = programs {
                let pubkeys: Vec<solana_sdk::pubkey::Pubkey> = program_ids
                    .split(',')
                    .map(|s| s.trim().parse())
                    .collect::<std::result::Result<Vec<_>, _>>()?;
                estimator = estimator.with_scoped_accounts(pubkeys);
            }

            let estimate = if let Some(buf) = buffer {
                estimator.estimate_with_buffer(strategy, buf)?
            } else {
                estimator.estimate(strategy)?
            };

            if json {
                println!("{}", serde_json::to_string_pretty(&estimate)?);
            } else {
                println!("Priority Fee Estimation");
                println!("=======================");
                println!("Strategy:        {}", estimate.strategy);
                println!(
                    "Recommended fee: {} microlamports/CU",
                    estimate.recommended_fee
                );
                println!("Slots sampled:   {}", estimate.slots_sampled);
                println!();
                println!("Percentile breakdown:");
                println!("  p25: {} microlamports/CU", estimate.percentiles.p25);
                println!("  p50: {} microlamports/CU", estimate.percentiles.p50);
                println!("  p75: {} microlamports/CU", estimate.percentiles.p75);
                println!("  p90: {} microlamports/CU", estimate.percentiles.p90);
                println!("  max: {} microlamports/CU", estimate.percentiles.max);
            }
        }

        Commands::Bundle { tip, confirm, timeout } => {
            info!("Building Jito bundle with {} lamports tip", tip);

            let mut builder = JitoBundleBuilder::new(&config);
            builder.set_tip(tip);

            // TODO: read serialized transactions from stdin or file
            // For now, this demonstrates the bundle builder API
            eprintln!("Reading base58-encoded transactions from stdin (one per line)...");
            eprintln!("Send EOF (Ctrl+D) when done.");

            let stdin = std::io::stdin();
            let mut line = String::new();
            while std::io::BufRead::read_line(&mut stdin.lock(), &mut line)? > 0 {
                let trimmed = line.trim();
                if trimmed.is_empty() {
                    break;
                }

                let tx_bytes = bs58::decode(trimmed)
                    .into_vec()
                    .map_err(|e| anyhow::anyhow!("Invalid base58: {e}"))?;
                let tx: solana_sdk::transaction::Transaction = bincode::deserialize(&tx_bytes)?;
                builder.add_transaction(&tx)?;

                line.clear();
            }

            if confirm {
                let timeout_duration = std::time::Duration::from_secs(timeout);
                let result = builder.submit_and_confirm(timeout_duration).await?;
                println!("{}", serde_json::to_string_pretty(&result)?);
            } else {
                let result = builder.submit().await?;
                println!("{}", serde_json::to_string_pretty(&result)?);
            }
        }

        Commands::Monitor { signature, websocket } => {
            info!("Monitoring transaction: {signature}");

            if websocket {
                // TODO: implement WebSocket-based monitoring via signatureSubscribe
                eprintln!("WebSocket monitoring not yet implemented, falling back to polling");
            }

            // Poll for transaction status using RPC
            let client = solana_client::rpc_client::RpcClient::new(&config.rpc_url);
            let sig: solana_sdk::signature::Signature = signature.parse()?;

            let status = client.get_signature_status(&sig)?;
            match status {
                Some(Ok(())) => println!("Transaction confirmed successfully"),
                Some(Err(e)) => println!("Transaction failed: {e}"),
                None => println!("Transaction not found or still pending"),
            }

            // TODO: add continuous polling with progress indicator
            // TODO: display transaction details (fee, CU consumed, logs) on confirmation
        }
    }

    Ok(())
}
