//! Example: Jito Bundle Submission
//!
//! Demonstrates how to construct and submit a Jito bundle containing
//! multiple transactions that execute atomically in a single slot.
//!
//! Use cases:
//! - Atomic arbitrage (swap A→B on DEX1, B→A on DEX2)
//! - MEV protection (bundle your swap with a tip to avoid sandwiching)
//! - Multi-step DeFi operations (deposit → stake → claim)
//!
//! Usage:
//!   SOLANA_RPC_URL=https://your-rpc.com \
//!   SOLANA_WALLET_PATH=~/.config/solana/id.json \
//!   cargo run --example bundle-transactions

use anyhow::Result;
use solana_sdk::{
    commitment_config::CommitmentConfig,
    instruction::Instruction,
    message::Message,
    native_token::LAMPORTS_PER_SOL,
    pubkey::Pubkey,
    signature::read_keypair_file,
    signer::Signer,
    system_instruction,
    transaction::Transaction,
};
use solana_client::rpc_client::RpcClient;
use solana_tx_optimizer::{
    bundle::{create_tip_instruction, JitoBundleBuilder},
    config::Config,
    priority_fee::{
        build_compute_unit_limit_instruction, build_priority_fee_instruction,
        FeeStrategy, PriorityFeeEstimator,
    },
};
use std::str::FromStr;
use std::time::Duration;

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize tracing for structured logging
    tracing_subscriber::fmt()
        .with_target(false)
        .with_level(true)
        .init();

    println!("=== Jito Bundle Submission Example ===\n");

    // --- Configuration ---
    let config = Config::from_env();
    let rpc_client = RpcClient::new_with_commitment(
        &config.rpc_url,
        CommitmentConfig::confirmed(),
    );

    // Load wallet
    let wallet_path = config
        .wallet_path
        .to_str()
        .expect("Invalid wallet path");
    let payer = read_keypair_file(wallet_path)
        .map_err(|e| anyhow::anyhow!("Failed to read wallet: {e}"))?;

    println!("Wallet:       {}", payer.pubkey());
    println!("RPC:          {}", config.rpc_url);
    println!("Jito engine:  {}\n", config.jito_block_engine_url);

    // --- Step 1: Estimate Priority Fee ---
    println!("--- Step 1: Estimating priority fee ---");
    let estimator = PriorityFeeEstimator::new(&config.rpc_url);
    let fee_estimate = estimator.estimate(FeeStrategy::Fast)?;

    println!(
        "Recommended fee: {} microlamports/CU ({})\n",
        fee_estimate.recommended_fee, fee_estimate.strategy
    );

    // --- Step 2: Build Transactions ---
    println!("--- Step 2: Building bundle transactions ---");

    // For this example, we build two simple transfer transactions.
    // In a real scenario, these would be swap/arb transactions.
    let recipient = Pubkey::from_str("11111111111111111111111111111111")?;
    let recent_blockhash = rpc_client.get_latest_blockhash()?;

    // Transaction 1: Transfer with priority fee
    let tx1 = {
        let instructions = vec![
            build_compute_unit_limit_instruction(50_000),
            build_priority_fee_instruction(fee_estimate.recommended_fee),
            system_instruction::transfer(&payer.pubkey(), &recipient, 1000),
        ];

        let message = Message::new(&instructions, Some(&payer.pubkey()));
        Transaction::new(&[&payer], message, recent_blockhash)
    };

    // Transaction 2: Another transfer + Jito tip (last tx in bundle must tip)
    let tx2 = {
        let tip_ix = create_tip_instruction(
            &payer.pubkey(),
            config.jito_tip_lamports,
        )?;

        let instructions = vec![
            build_compute_unit_limit_instruction(50_000),
            build_priority_fee_instruction(fee_estimate.recommended_fee),
            system_instruction::transfer(&payer.pubkey(), &recipient, 2000),
            tip_ix, // Jito tip — must be in the last transaction
        ];

        let message = Message::new(&instructions, Some(&payer.pubkey()));
        Transaction::new(&[&payer], message, recent_blockhash)
    };

    println!("Built 2 transactions for bundle\n");

    // --- Step 3: Build and Submit Bundle ---
    println!("--- Step 3: Submitting Jito bundle ---");

    let mut builder = JitoBundleBuilder::new(&config);
    builder
        .add_transaction(&tx1)?
        .add_transaction(&tx2)?
        .set_tip(config.jito_tip_lamports);

    // Submit and wait for confirmation (30s timeout)
    let result = builder
        .submit_and_confirm(Duration::from_secs(30))
        .await?;

    // --- Summary ---
    println!("\n=== Bundle Result ===");
    println!("{}", serde_json::to_string_pretty(&result)?);

    match &result.status {
        solana_tx_optimizer::BundleStatus::Landed { bundle_id, slot } => {
            println!("\nBundle {} landed in slot {}", bundle_id, slot);
        }
        solana_tx_optimizer::BundleStatus::Accepted { bundle_id } => {
            println!("\nBundle {} accepted, waiting for confirmation...", bundle_id);
        }
        solana_tx_optimizer::BundleStatus::Rejected { reason } => {
            println!("\nBundle rejected: {}", reason);
        }
        solana_tx_optimizer::BundleStatus::Expired { bundle_id } => {
            println!("\nBundle {} expired without landing", bundle_id);
        }
    }

    Ok(())
}
