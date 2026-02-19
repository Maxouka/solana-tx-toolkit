use anyhow::{bail, Context, Result};
use serde::{Deserialize, Serialize};
use solana_sdk::{
    pubkey::Pubkey,
    signature::Signature,
    transaction::Transaction,
};
use std::str::FromStr;
use std::time::Duration;
use tracing::{debug, error, info, warn};

use crate::config::{Config, JITO_TIP_ACCOUNTS};

/// Maximum number of transactions allowed in a single Jito bundle.
const MAX_BUNDLE_SIZE: usize = 5;

/// Default Jito tip in lamports (0.00001 SOL).
const DEFAULT_TIP_LAMPORTS: u64 = 10_000;

/// Bundle submission status returned by the Jito block engine.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BundleStatus {
    /// Bundle accepted and pending inclusion
    Accepted { bundle_id: String },
    /// Bundle successfully landed on-chain
    Landed {
        bundle_id: String,
        slot: u64,
    },
    /// Bundle was rejected by the block engine
    Rejected { reason: String },
    /// Bundle expired without being included
    Expired { bundle_id: String },
}

/// Result from a bundle submission attempt.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BundleSubmissionResult {
    pub status: BundleStatus,
    pub attempts: u8,
    pub elapsed_ms: u128,
}

/// Builder for constructing and submitting Jito bundles.
///
/// Jito bundles allow atomic execution of up to 5 transactions in a single slot,
/// which is essential for MEV strategies and complex DeFi operations.
///
/// # Example
/// ```no_run
/// use solana_tx_optimizer::bundle::JitoBundleBuilder;
/// use solana_tx_optimizer::config::Config;
///
/// let config = Config::from_env();
/// let mut builder = JitoBundleBuilder::new(&config);
/// // builder.add_transaction(tx1)?;
/// // builder.set_tip(50_000); // 0.00005 SOL tip
/// // let result = builder.submit().await?;
/// ```
pub struct JitoBundleBuilder {
    /// Serialized transactions in the bundle (base58-encoded)
    transactions: Vec<Vec<u8>>,
    /// Tip amount in lamports paid to Jito validators
    tip_lamports: u64,
    /// Jito block engine endpoint URL
    block_engine_url: String,
    /// Maximum retry attempts for submission
    max_retries: u8,
}

impl JitoBundleBuilder {
    /// Create a new bundle builder with the given configuration.
    pub fn new(config: &Config) -> Self {
        Self {
            transactions: Vec::with_capacity(MAX_BUNDLE_SIZE),
            tip_lamports: config.jito_tip_lamports,
            block_engine_url: config.jito_block_engine_url.clone(),
            max_retries: config.max_retries,
        }
    }

    /// Add a signed transaction to the bundle.
    ///
    /// Transactions execute in the order they are added.
    /// Returns an error if the bundle already contains the maximum number of transactions.
    pub fn add_transaction(&mut self, tx: &Transaction) -> Result<&mut Self> {
        if self.transactions.len() >= MAX_BUNDLE_SIZE {
            bail!(
                "Bundle already contains {} transactions (max {})",
                self.transactions.len(),
                MAX_BUNDLE_SIZE
            );
        }

        let serialized = bincode::serialize(tx)
            .context("Failed to serialize transaction")?;

        debug!(
            "Added transaction to bundle (size: {}/{})",
            self.transactions.len() + 1,
            MAX_BUNDLE_SIZE
        );

        self.transactions.push(serialized);
        Ok(self)
    }

    /// Set the tip amount in lamports paid to Jito validators.
    ///
    /// Higher tips increase the probability of bundle inclusion.
    /// The tip is paid to a randomly selected Jito tip account.
    pub fn set_tip(&mut self, lamports: u64) -> &mut Self {
        self.tip_lamports = lamports;
        info!("Bundle tip set to {} lamports ({} SOL)", lamports, lamports as f64 / 1e9);
        self
    }

    /// Get a random Jito tip account pubkey for the tip transfer.
    fn random_tip_account() -> Result<Pubkey> {
        let account_str = Config::random_tip_account();
        Pubkey::from_str(account_str)
            .context("Failed to parse Jito tip account pubkey")
    }

    /// Build the bundle payload for submission to the Jito block engine.
    ///
    /// Encodes all transactions as base58 strings in the format expected
    /// by the `sendBundle` JSON-RPC method.
    pub fn build(&self) -> Result<serde_json::Value> {
        if self.transactions.is_empty() {
            bail!("Cannot build an empty bundle");
        }

        let encoded_txs: Vec<String> = self
            .transactions
            .iter()
            .map(|tx_bytes| bs58::encode(tx_bytes).into_string())
            .collect();

        let payload = serde_json::json!({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "sendBundle",
            "params": [encoded_txs]
        });

        debug!("Built bundle with {} transactions", encoded_txs.len());
        Ok(payload)
    }

    /// Submit the bundle to the Jito block engine with retry logic.
    ///
    /// Uses exponential backoff on failure. Returns the bundle ID on success.
    pub async fn submit(&self) -> Result<BundleSubmissionResult> {
        let payload = self.build()?;
        let client = reqwest::Client::new();
        let start = std::time::Instant::now();

        let bundle_endpoint = format!("{}/api/v1/bundles", self.block_engine_url);

        for attempt in 1..=self.max_retries {
            info!(
                "Submitting bundle to {} (attempt {}/{})",
                self.block_engine_url, attempt, self.max_retries
            );

            match client
                .post(&bundle_endpoint)
                .json(&payload)
                .timeout(Duration::from_secs(10))
                .send()
                .await
            {
                Ok(response) => {
                    let status_code = response.status();
                    let body: serde_json::Value = response
                        .json()
                        .await
                        .context("Failed to parse bundle submission response")?;

                    if status_code.is_success() {
                        if let Some(result) = body.get("result") {
                            let bundle_id = result.as_str().unwrap_or("unknown").to_string();
                            info!("Bundle accepted: {bundle_id}");
                            return Ok(BundleSubmissionResult {
                                status: BundleStatus::Accepted { bundle_id },
                                attempts: attempt,
                                elapsed_ms: start.elapsed().as_millis(),
                            });
                        }
                    }

                    // Check for specific error codes
                    if let Some(error) = body.get("error") {
                        let reason = error
                            .get("message")
                            .and_then(|m| m.as_str())
                            .unwrap_or("Unknown error")
                            .to_string();

                        // Non-retryable errors
                        if reason.contains("already processed")
                            || reason.contains("blockhash not found")
                        {
                            return Ok(BundleSubmissionResult {
                                status: BundleStatus::Rejected { reason },
                                attempts: attempt,
                                elapsed_ms: start.elapsed().as_millis(),
                            });
                        }

                        warn!("Bundle submission error (retryable): {reason}");
                    }
                }
                Err(e) => {
                    error!("Bundle submission request failed: {e}");
                }
            }

            // Exponential backoff: 100ms, 200ms, 400ms, ...
            if attempt < self.max_retries {
                let backoff = Duration::from_millis(100 * 2u64.pow((attempt - 1) as u32));
                debug!("Retrying in {}ms", backoff.as_millis());
                tokio::time::sleep(backoff).await;
            }
        }

        Ok(BundleSubmissionResult {
            status: BundleStatus::Rejected {
                reason: "Max retries exceeded".to_string(),
            },
            attempts: self.max_retries,
            elapsed_ms: start.elapsed().as_millis(),
        })
    }

    /// Check the status of a previously submitted bundle.
    ///
    /// Polls the Jito block engine to determine if the bundle has landed,
    /// is still pending, or has expired.
    ///
    /// TODO: implement WebSocket subscription for real-time bundle status updates
    pub async fn check_status(&self, bundle_id: &str) -> Result<BundleStatus> {
        let client = reqwest::Client::new();
        let status_endpoint = format!("{}/api/v1/bundles", self.block_engine_url);

        let payload = serde_json::json!({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getBundleStatuses",
            "params": [[bundle_id]]
        });

        let response: serde_json::Value = client
            .post(&status_endpoint)
            .json(&payload)
            .timeout(Duration::from_secs(10))
            .send()
            .await?
            .json()
            .await?;

        // Parse the status response
        if let Some(result) = response.get("result") {
            if let Some(statuses) = result.get("value").and_then(|v| v.as_array()) {
                if let Some(status) = statuses.first() {
                    let confirmation = status
                        .get("confirmation_status")
                        .and_then(|s| s.as_str())
                        .unwrap_or("unknown");

                    return match confirmation {
                        "confirmed" | "finalized" => {
                            let slot = status
                                .get("slot")
                                .and_then(|s| s.as_u64())
                                .unwrap_or(0);
                            Ok(BundleStatus::Landed {
                                bundle_id: bundle_id.to_string(),
                                slot,
                            })
                        }
                        _ => Ok(BundleStatus::Accepted {
                            bundle_id: bundle_id.to_string(),
                        }),
                    };
                }
            }
        }

        // TODO: differentiate between "not found" (expired) and "pending"
        Ok(BundleStatus::Expired {
            bundle_id: bundle_id.to_string(),
        })
    }

    /// Submit the bundle and wait for it to land on-chain.
    ///
    /// Polls bundle status with a timeout. Returns the final status.
    ///
    /// TODO: add configurable timeout and polling interval
    pub async fn submit_and_confirm(
        &self,
        timeout: Duration,
    ) -> Result<BundleSubmissionResult> {
        let result = self.submit().await?;

        let bundle_id = match &result.status {
            BundleStatus::Accepted { bundle_id } => bundle_id.clone(),
            _ => return Ok(result),
        };

        let start = std::time::Instant::now();
        let poll_interval = Duration::from_millis(500);

        while start.elapsed() < timeout {
            tokio::time::sleep(poll_interval).await;

            match self.check_status(&bundle_id).await {
                Ok(BundleStatus::Landed { slot, .. }) => {
                    info!("Bundle {bundle_id} landed in slot {slot}");
                    return Ok(BundleSubmissionResult {
                        status: BundleStatus::Landed {
                            bundle_id,
                            slot,
                        },
                        attempts: result.attempts,
                        elapsed_ms: start.elapsed().as_millis(),
                    });
                }
                Ok(BundleStatus::Expired { .. }) => {
                    warn!("Bundle {bundle_id} expired");
                    return Ok(BundleSubmissionResult {
                        status: BundleStatus::Expired { bundle_id },
                        attempts: result.attempts,
                        elapsed_ms: start.elapsed().as_millis(),
                    });
                }
                Ok(_) => {
                    debug!("Bundle {bundle_id} still pending...");
                }
                Err(e) => {
                    warn!("Error checking bundle status: {e}");
                }
            }
        }

        warn!("Bundle confirmation timed out after {}ms", timeout.as_millis());
        Ok(BundleSubmissionResult {
            status: BundleStatus::Expired { bundle_id },
            attempts: result.attempts,
            elapsed_ms: start.elapsed().as_millis(),
        })
    }
}

/// Create a tip transfer instruction to a random Jito tip account.
///
/// This should be added as the last instruction in the last transaction
/// of the bundle.
pub fn create_tip_instruction(
    payer: &Pubkey,
    tip_lamports: u64,
) -> Result<solana_sdk::instruction::Instruction> {
    let tip_account = JitoBundleBuilder::random_tip_account()?;

    Ok(solana_sdk::system_instruction::transfer(
        payer,
        &tip_account,
        tip_lamports,
    ))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_random_tip_account_parses() {
        let pubkey = JitoBundleBuilder::random_tip_account();
        assert!(pubkey.is_ok(), "Jito tip account should parse as valid Pubkey");
    }

    #[test]
    fn test_empty_bundle_fails() {
        let config = Config::default();
        let builder = JitoBundleBuilder::new(&config);
        assert!(builder.build().is_err(), "Empty bundle should fail to build");
    }
}
