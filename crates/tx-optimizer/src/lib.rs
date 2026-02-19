//! # Solana Transaction Optimizer
//!
//! A toolkit for optimizing Solana transactions through dynamic priority fee
//! estimation and Jito bundle construction.
//!
//! ## Features
//!
//! - **Priority Fee Estimation**: Query recent on-chain fee data and compute
//!   percentile-based fee recommendations.
//! - **Jito Bundle Builder**: Construct, submit, and track Jito MEV bundles
//!   with retry logic and exponential backoff.
//! - **Configuration**: Flexible config via environment variables or JSON files.
//!
//! ## Quick Start
//!
//! ```no_run
//! use solana_tx_optimizer::priority_fee::{PriorityFeeEstimator, FeeStrategy};
//! use solana_tx_optimizer::bundle::JitoBundleBuilder;
//! use solana_tx_optimizer::config::Config;
//!
//! let config = Config::from_env();
//! let estimator = PriorityFeeEstimator::new(&config.rpc_url);
//! let fee = estimator.estimate(FeeStrategy::Fast).unwrap();
//! println!("Recommended fee: {} microlamports/CU", fee.recommended_fee);
//! ```

pub mod bundle;
pub mod config;
pub mod priority_fee;

// Re-export key types for ergonomic usage
pub use bundle::{BundleStatus, BundleSubmissionResult, JitoBundleBuilder};
pub use config::Config;
pub use priority_fee::{FeeEstimate, FeeStrategy, PriorityFeeEstimator};
