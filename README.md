# solana-tx-toolkit

**Solana Transaction Optimization Toolkit**

[![Rust](https://img.shields.io/badge/Rust-1.75+-orange?logo=rust)](https://www.rust-lang.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Solana](https://img.shields.io/badge/Solana-1.18-purple?logo=solana)](https://solana.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A developer toolkit for optimizing Solana transactions — dynamic priority fee estimation, Jito bundle construction, and Jupiter swap route optimization.

Built from hands-on experience trading and using DeFi on Solana. Tired of transactions failing or getting sandwiched? This toolkit solves that.

## Features

- **Priority Fee Estimation** — Query `getRecentPrioritizationFees` and compute percentile-based recommendations (p25/p50/p75/p90)
- **Jito Bundle Builder** — Construct, submit, and track MEV bundles with retry logic and exponential backoff
- **Jupiter Swap Optimizer** — Find the best route across all DEXs, with dynamic priority fees and slippage optimization
- **Transaction Monitor** — Real-time WebSocket + polling confirmation tracker with event emitter pattern
- **CLI Tool** — `estimate-fee`, `bundle`, and `monitor` subcommands for quick terminal usage

## Architecture

```
solana-tx-toolkit/
│
├── crates/tx-optimizer/          # Rust core library + CLI
│   ├── src/
│   │   ├── priority_fee.rs       # Fee estimation (RPC + percentile math)
│   │   ├── bundle.rs             # Jito bundle builder & submitter
│   │   ├── config.rs             # Config (env vars, Jito endpoints, tip accounts)
│   │   ├── main.rs               # CLI binary (clap)
│   │   └── lib.rs                # Public API re-exports
│   └── Cargo.toml
│
├── ts/                           # TypeScript SDK
│   ├── src/
│   │   ├── jupiter-swap.ts       # Jupiter V6 API swap optimizer
│   │   ├── monitor.ts            # Transaction confirmation monitor
│   │   ├── types.ts              # Shared type definitions + constants
│   │   └── index.ts              # SDK exports
│   ├── package.json
│   └── tsconfig.json
│
└── examples/
    ├── optimize-swap.ts          # Jupiter swap with dynamic fees
    └── bundle-transactions.rs    # Jito bundle submission
```

## Quick Start

### Rust CLI

```bash
# Clone and build
git clone https://github.com/launo/solana-tx-toolkit.git
cd solana-tx-toolkit
cargo build --release

# Estimate priority fees for current network conditions
export SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
cargo run -- estimate-fee --strategy fast --json

# Estimate fees scoped to Jupiter program
cargo run -- estimate-fee --strategy turbo \
  --programs JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4

# Monitor a transaction
cargo run -- monitor <SIGNATURE>
```

### TypeScript SDK

```bash
cd ts
npm install

# Run the optimized swap example
SOLANA_RPC_URL=https://your-rpc.com \
WALLET_PATH=~/.config/solana/id.json \
npx tsx ../examples/optimize-swap.ts
```

### As a Library

**Rust:**
```rust
use solana_tx_optimizer::{PriorityFeeEstimator, FeeStrategy, JitoBundleBuilder, Config};

// Estimate optimal priority fee
let estimator = PriorityFeeEstimator::new("https://api.mainnet-beta.solana.com");
let fee = estimator.estimate(FeeStrategy::Fast)?;
println!("Recommended: {} microlamports/CU", fee.recommended_fee);

// Build a Jito bundle
let config = Config::from_env();
let mut bundle = JitoBundleBuilder::new(&config);
bundle.add_transaction(&tx1)?
      .add_transaction(&tx2)?
      .set_tip(25_000); // 0.000025 SOL tip
let result = bundle.submit_and_confirm(Duration::from_secs(30)).await?;
```

**TypeScript:**
```typescript
import { Connection, Keypair } from "@solana/web3.js";
import { JupiterSwapOptimizer, TransactionMonitor, TOKEN_MINTS } from "@solana-tx-toolkit/sdk";

const connection = new Connection("https://api.mainnet-beta.solana.com");
const optimizer = new JupiterSwapOptimizer(connection, wallet);

// Execute an optimized Jupiter swap
const result = await optimizer.executeSwap({
  inputMint: TOKEN_MINTS.SOL,
  outputMint: TOKEN_MINTS.USDC,
  amount: 1_000_000_000, // 1 SOL
  slippageBps: 50,
  feeStrategy: "fast",
});

// Monitor confirmation
const monitor = new TransactionMonitor(connection);
monitor.on("confirmed", (update) => console.log(`Confirmed in slot ${update.slot}`));
await monitor.watchTransaction(result.signature);
```

## Fee Strategies

| Strategy | Percentile | Use Case |
|----------|-----------|----------|
| `economy` | p25 | Non-urgent transactions, batch operations |
| `standard` | p50 | Normal usage, balanced cost/speed |
| `fast` | p75 | Time-sensitive swaps, DeFi interactions |
| `turbo` | p90 | Critical transactions, arbitrage, liquidations |

## Built With

- **Rust** — Core fee estimation and bundle building logic
- **[Solana SDK](https://docs.rs/solana-sdk)** — Transaction construction and signing
- **[Jupiter V6 API](https://station.jup.ag/docs/apis/swap-api)** — DEX aggregation and route optimization
- **[Jito](https://jito-labs.gitbook.io/mev/)** — MEV bundle submission and tip management
- **TypeScript / @solana/web3.js** — SDK and examples
- **clap** — CLI argument parsing
- **tokio** — Async runtime

## Roadmap

- [ ] WebSocket fallback for transaction monitoring
- [ ] Retry logic for failed Jito bundles with dynamic tip adjustment
- [ ] Sandwich attack detection (compare quote vs on-chain execution)
- [ ] Historical fee analytics and trend visualization
- [ ] Anchor framework integration for program-specific optimizations
- [ ] PostgreSQL storage for transaction history and fee metrics

## License

MIT
