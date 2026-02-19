use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use solana_client::rpc_client::RpcClient;
use solana_sdk::pubkey::Pubkey;
use tracing::{debug, info, warn};

/// Fee strategy presets that map to different percentile targets.
/// Users pick a strategy; the estimator translates it to the right fee level.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum FeeStrategy {
    /// p25 — cheapest, may take longer to land
    Economy,
    /// p50 — balanced cost/speed
    Standard,
    /// p75 — faster landing, higher cost
    Fast,
    /// p90 — near-guaranteed fast inclusion
    Turbo,
}

impl FeeStrategy {
    /// Returns the target percentile for this strategy.
    pub fn percentile(&self) -> usize {
        match self {
            FeeStrategy::Economy => 25,
            FeeStrategy::Standard => 50,
            FeeStrategy::Fast => 75,
            FeeStrategy::Turbo => 90,
        }
    }
}

impl std::fmt::Display for FeeStrategy {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            FeeStrategy::Economy => write!(f, "Economy (p25)"),
            FeeStrategy::Standard => write!(f, "Standard (p50)"),
            FeeStrategy::Fast => write!(f, "Fast (p75)"),
            FeeStrategy::Turbo => write!(f, "Turbo (p90)"),
        }
    }
}

/// Result of a priority fee estimation.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeeEstimate {
    /// Recommended priority fee in microlamports per compute unit
    pub recommended_fee: u64,
    /// The strategy used for estimation
    pub strategy: FeeStrategy,
    /// Number of recent slots sampled
    pub slots_sampled: usize,
    /// Fee percentile breakdown for transparency
    pub percentiles: FeePercentiles,
}

/// Breakdown of fee percentiles from recent slots.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeePercentiles {
    pub p25: u64,
    pub p50: u64,
    pub p75: u64,
    pub p90: u64,
    pub max: u64,
}

/// Raw response item from `getRecentPrioritizationFees` RPC method.
#[derive(Debug, Deserialize)]
pub struct PrioritizationFeeEntry {
    pub slot: u64,
    #[serde(rename = "prioritizationFee")]
    pub prioritization_fee: u64,
}

/// Estimates optimal priority fees by sampling recent on-chain data.
///
/// Uses the `getRecentPrioritizationFees` RPC method to collect fee data
/// from the last 150 slots, then computes percentiles to recommend a fee
/// based on the chosen [`FeeStrategy`].
pub struct PriorityFeeEstimator {
    rpc_client: RpcClient,
    /// Optional: scope fee estimation to specific accounts (e.g., program IDs).
    /// When provided, only fees from transactions touching these accounts are considered.
    scoped_accounts: Vec<Pubkey>,
}

impl PriorityFeeEstimator {
    /// Create a new estimator targeting the given RPC endpoint.
    pub fn new(rpc_url: &str) -> Self {
        Self {
            rpc_client: RpcClient::new(rpc_url.to_string()),
            scoped_accounts: Vec::new(),
        }
    }

    /// Scope fee estimation to transactions involving specific accounts.
    /// This is useful for getting more accurate fees for a particular program
    /// (e.g., pass the Jupiter program ID to get swap-specific fee data).
    pub fn with_scoped_accounts(mut self, accounts: Vec<Pubkey>) -> Self {
        self.scoped_accounts = accounts;
        self
    }

    /// Fetch recent prioritization fees from the RPC node.
    ///
    /// Calls `getRecentPrioritizationFees` which returns fee data from
    /// the last 150 confirmed slots.
    fn fetch_recent_fees(&self) -> Result<Vec<u64>> {
        // Build the RPC request params — if scoped_accounts is non-empty,
        // pass them to filter fees by relevant transactions.
        let params = if self.scoped_accounts.is_empty() {
            serde_json::json!([])
        } else {
            let accounts: Vec<String> = self
                .scoped_accounts
                .iter()
                .map(|pk| pk.to_string())
                .collect();
            serde_json::json!([accounts])
        };

        debug!("Fetching recent prioritization fees with params: {params}");

        // Use reqwest to call RPC directly since solana-client doesn't expose
        // getRecentPrioritizationFees as a typed method yet.
        let body = serde_json::json!({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getRecentPrioritizationFees",
            "params": params,
        });

        let response: serde_json::Value = reqwest::blocking::Client::new()
            .post(self.rpc_client.url())
            .json(&body)
            .send()
            .context("Failed to call getRecentPrioritizationFees")?
            .json()
            .context("Failed to parse RPC response")?;

        let entries: Vec<PrioritizationFeeEntry> =
            serde_json::from_value(response["result"].clone())
                .context("Failed to deserialize fee entries")?;

        // Filter out zero-fee entries (slots with no priority transactions)
        let fees: Vec<u64> = entries
            .into_iter()
            .map(|e| e.prioritization_fee)
            .filter(|&fee| fee > 0)
            .collect();

        info!("Collected {} non-zero fee samples", fees.len());
        Ok(fees)
    }

    /// Compute percentile value from a sorted list of fees.
    fn percentile(sorted_fees: &[u64], pct: usize) -> u64 {
        if sorted_fees.is_empty() {
            return 0;
        }
        let index = (pct as f64 / 100.0 * (sorted_fees.len() - 1) as f64).round() as usize;
        sorted_fees[index.min(sorted_fees.len() - 1)]
    }

    /// Estimate the optimal priority fee for the given strategy.
    ///
    /// # Example
    /// ```no_run
    /// use solana_tx_optimizer::priority_fee::{PriorityFeeEstimator, FeeStrategy};
    ///
    /// let estimator = PriorityFeeEstimator::new("https://api.mainnet-beta.solana.com");
    /// let estimate = estimator.estimate(FeeStrategy::Fast).unwrap();
    /// println!("Recommended fee: {} microlamports/CU", estimate.recommended_fee);
    /// ```
    pub fn estimate(&self, strategy: FeeStrategy) -> Result<FeeEstimate> {
        let mut fees = self.fetch_recent_fees()?;

        if fees.is_empty() {
            warn!("No recent priority fee data found, using default fallback");
            return Ok(FeeEstimate {
                recommended_fee: crate::config::DEFAULT_PRIORITY_FEE_MICROLAMPORTS,
                strategy,
                slots_sampled: 0,
                percentiles: FeePercentiles {
                    p25: 0,
                    p50: 0,
                    p75: 0,
                    p90: 0,
                    max: 0,
                },
            });
        }

        fees.sort_unstable();
        let slots_sampled = fees.len();

        let percentiles = FeePercentiles {
            p25: Self::percentile(&fees, 25),
            p50: Self::percentile(&fees, 50),
            p75: Self::percentile(&fees, 75),
            p90: Self::percentile(&fees, 90),
            max: *fees.last().unwrap_or(&0),
        };

        let recommended_fee = Self::percentile(&fees, strategy.percentile());

        info!(
            strategy = %strategy,
            recommended_fee,
            slots_sampled,
            "Fee estimation complete"
        );

        Ok(FeeEstimate {
            recommended_fee,
            strategy,
            slots_sampled,
            percentiles,
        })
    }

    /// Estimate fee and apply a multiplier for extra safety margin.
    /// Useful during network congestion where fees spike rapidly.
    pub fn estimate_with_buffer(
        &self,
        strategy: FeeStrategy,
        buffer_multiplier: f64,
    ) -> Result<FeeEstimate> {
        let mut estimate = self.estimate(strategy)?;
        estimate.recommended_fee = (estimate.recommended_fee as f64 * buffer_multiplier) as u64;
        debug!(
            "Applied {}x buffer: {} -> {} microlamports/CU",
            buffer_multiplier,
            estimate.recommended_fee as f64 / buffer_multiplier,
            estimate.recommended_fee
        );
        Ok(estimate)
    }
}

/// Build a `SetComputeUnitPrice` instruction for the given fee.
///
/// This is the instruction you prepend to your transaction to set priority fees.
pub fn build_priority_fee_instruction(microlamports_per_cu: u64) -> solana_sdk::instruction::Instruction {
    solana_sdk::compute_budget::ComputeBudgetInstruction::set_compute_unit_price(
        microlamports_per_cu,
    )
}

/// Build a `SetComputeUnitLimit` instruction.
///
/// Setting an accurate CU limit reduces wasted fees since priority fee = CU_price * CU_consumed.
pub fn build_compute_unit_limit_instruction(units: u32) -> solana_sdk::instruction::Instruction {
    solana_sdk::compute_budget::ComputeBudgetInstruction::set_compute_unit_limit(units)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_percentile_calculation() {
        let fees = vec![100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
        assert_eq!(PriorityFeeEstimator::percentile(&fees, 50), 600);
        assert_eq!(PriorityFeeEstimator::percentile(&fees, 90), 1000);
        assert_eq!(PriorityFeeEstimator::percentile(&fees, 0), 100);
    }

    #[test]
    fn test_percentile_empty() {
        let fees: Vec<u64> = vec![];
        assert_eq!(PriorityFeeEstimator::percentile(&fees, 50), 0);
    }

    #[test]
    fn test_fee_strategy_display() {
        assert_eq!(FeeStrategy::Turbo.to_string(), "Turbo (p90)");
        assert_eq!(FeeStrategy::Economy.percentile(), 25);
    }
}
