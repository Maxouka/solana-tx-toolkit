use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// Known Jito block engine endpoints by region.
/// See: https://jito-labs.gitbook.io/mev/
pub const JITO_BLOCK_ENGINE_MAINNET: &str = "https://mainnet.block-engine.jito.wtf";
pub const JITO_BLOCK_ENGINE_AMSTERDAM: &str = "https://amsterdam.mainnet.block-engine.jito.wtf";
pub const JITO_BLOCK_ENGINE_FRANKFURT: &str = "https://frankfurt.mainnet.block-engine.jito.wtf";
pub const JITO_BLOCK_ENGINE_NY: &str = "https://ny.mainnet.block-engine.jito.wtf";
pub const JITO_BLOCK_ENGINE_TOKYO: &str = "https://tokyo.mainnet.block-engine.jito.wtf";

/// Jito tip accounts — one is randomly selected per bundle.
/// These are the official Jito tip payment accounts on mainnet.
pub const JITO_TIP_ACCOUNTS: [&str; 8] = [
    "96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5",
    "HFqU5x63VTqvQss8hp11i4bVqkfRtQ7NmXwkiGNHoR5t",
    "Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY",
    "ADaUMid9yfUytqMBgopwjb2DTLSLVPDVnF8NfRUm7AEz",
    "DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh",
    "ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt",
    "DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL",
    "3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT",
];

/// Default priority fee in microlamports per compute unit.
pub const DEFAULT_PRIORITY_FEE_MICROLAMPORTS: u64 = 10_000;

/// Default compute unit limit for a standard transaction.
pub const DEFAULT_COMPUTE_UNIT_LIMIT: u32 = 200_000;

/// Application configuration loaded from environment or config file.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    /// Solana RPC endpoint URL
    pub rpc_url: String,

    /// WebSocket endpoint for real-time subscriptions
    pub ws_url: String,

    /// Jito block engine URL for bundle submission
    pub jito_block_engine_url: String,

    /// Path to the wallet keypair file
    pub wallet_path: PathBuf,

    /// Maximum priority fee the user is willing to pay (in microlamports/CU)
    pub max_priority_fee: u64,

    /// Default slippage tolerance in basis points (e.g., 50 = 0.5%)
    pub default_slippage_bps: u16,

    /// Jito tip amount in lamports
    pub jito_tip_lamports: u64,

    /// Number of retries for failed transactions
    pub max_retries: u8,

    /// Commitment level for transaction confirmation
    pub commitment: String,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            rpc_url: "https://api.mainnet-beta.solana.com".to_string(),
            ws_url: "wss://api.mainnet-beta.solana.com".to_string(),
            jito_block_engine_url: JITO_BLOCK_ENGINE_MAINNET.to_string(),
            wallet_path: PathBuf::from("~/.config/solana/id.json"),
            max_priority_fee: 500_000, // 0.5 SOL max
            default_slippage_bps: 50,  // 0.5%
            jito_tip_lamports: 10_000, // 0.00001 SOL
            max_retries: 3,
            commitment: "confirmed".to_string(),
        }
    }
}

impl Config {
    /// Load configuration from environment variables, falling back to defaults.
    pub fn from_env() -> Self {
        let default = Self::default();

        Self {
            rpc_url: std::env::var("SOLANA_RPC_URL").unwrap_or(default.rpc_url),
            ws_url: std::env::var("SOLANA_WS_URL").unwrap_or(default.ws_url),
            jito_block_engine_url: std::env::var("JITO_BLOCK_ENGINE_URL")
                .unwrap_or(default.jito_block_engine_url),
            wallet_path: std::env::var("SOLANA_WALLET_PATH")
                .map(PathBuf::from)
                .unwrap_or(default.wallet_path),
            max_priority_fee: std::env::var("MAX_PRIORITY_FEE")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(default.max_priority_fee),
            default_slippage_bps: std::env::var("DEFAULT_SLIPPAGE_BPS")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(default.default_slippage_bps),
            jito_tip_lamports: std::env::var("JITO_TIP_LAMPORTS")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(default.jito_tip_lamports),
            max_retries: std::env::var("MAX_RETRIES")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(default.max_retries),
            commitment: std::env::var("COMMITMENT_LEVEL").unwrap_or(default.commitment),
        }
    }

    /// Load configuration from a JSON file path.
    pub fn from_file(path: &std::path::Path) -> anyhow::Result<Self> {
        let contents = std::fs::read_to_string(path)?;
        let config: Self = serde_json::from_str(&contents)?;
        Ok(config)
    }

    /// Resolve the best Jito block engine URL based on latency.
    /// TODO: implement actual latency probing to each regional endpoint
    pub fn resolve_jito_endpoint(&self) -> &str {
        &self.jito_block_engine_url
    }

    /// Return a random Jito tip account pubkey string.
    pub fn random_tip_account() -> &'static str {
        use std::time::{SystemTime, UNIX_EPOCH};
        let nanos = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .subsec_nanos() as usize;
        JITO_TIP_ACCOUNTS[nanos % JITO_TIP_ACCOUNTS.len()]
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = Config::default();
        assert_eq!(config.default_slippage_bps, 50);
        assert_eq!(config.max_retries, 3);
        assert!(config.rpc_url.contains("mainnet"));
    }

    #[test]
    fn test_random_tip_account_is_valid() {
        let account = Config::random_tip_account();
        // All Jito tip accounts are base58-encoded 32-byte pubkeys
        assert!(account.len() >= 32 && account.len() <= 44);
    }
}
