# solana-tx-toolkit

**Full-stack Solana transaction infrastructure** — priority fee optimization, Jito bundle construction, Jupiter swap routing, real-time monitoring, and an on-chain vault program.

[![Rust](https://img.shields.io/badge/Rust-1.75+-orange?logo=rust)](https://www.rust-lang.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Solana](https://img.shields.io/badge/Solana-1.18-purple?logo=solana)](https://solana.com/)
[![Anchor](https://img.shields.io/badge/Anchor-0.30-5C7CFA)](https://www.anchor-lang.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[Live Dashboard](https://maxouka.github.io/solana-tx-toolkit/dashboard/) · [Documentation](https://maxouka.github.io/solana-tx-toolkit/) · [GitHub](https://github.com/Maxouka/solana-tx-toolkit)

---

## What This Demonstrates

| Skill | Implementation | Key Files |
|-------|---------------|-----------|
| **Rust backend** | Priority fee estimator, Jito bundle builder, CLI tool | `crates/tx-optimizer/src/` |
| **Solana transactions** | Dynamic fee optimization, bundle submission, compute budget | `crates/tx-optimizer/src/priority_fee.rs`, `bundle.rs` |
| **Anchor framework** | On-chain vault program with PDAs, CPI, events, batch operations | `programs/tx-vault/src/lib.rs` |
| **TypeScript SDK** | Jupiter V6 integration, transaction monitoring, typed API | `ts/src/` |
| **React dashboard** | Interactive visualization, real-time data, responsive UI | `dashboard/src/` |
| **Jito MEV** | Bundle construction, tip management, retry logic, status tracking | `crates/tx-optimizer/src/bundle.rs` |
| **Jupiter integration** | Route optimization, slippage management, multi-hop routing | `ts/src/jupiter-swap.ts` |

## Architecture

```
solana-tx-toolkit/
│
├── dashboard/                    # React dashboard (Vite + TailwindCSS)
│   └── src/
│       ├── components/           # Fee explorer, bundle builder, swap optimizer, tx monitor
│       └── data/                 # Realistic mock data
│
├── crates/tx-optimizer/          # Rust core library + CLI
│   └── src/
│       ├── priority_fee.rs       # Fee estimation (RPC + percentile math)
│       ├── bundle.rs             # Jito bundle builder & submitter
│       ├── config.rs             # Configuration (env vars, Jito endpoints)
│       └── main.rs               # CLI binary (clap)
│
├── programs/tx-vault/            # Anchor on-chain program
│   └── src/
│       └── lib.rs                # Vault: PDAs, CPI, events, batch execution
│
├── ts/                           # TypeScript SDK
│   └── src/
│       ├── jupiter-swap.ts       # Jupiter V6 swap optimizer
│       ├── monitor.ts            # Transaction confirmation monitor
│       └── types.ts              # Shared types + constants
│
├── examples/                     # Usage examples
│   ├── bundle-transactions.rs    # Jito bundle submission
│   └── optimize-swap.ts          # Jupiter swap with dynamic fees
│
└── docs/                         # Landing page + dashboard build
```

## Features

### Priority Fee Optimizer (Rust + TypeScript)
- Queries `getRecentPrioritizationFees` RPC method
- Computes percentile-based recommendations (p25/p50/p75/p90)
- Supports account-scoped fee estimation (e.g., Jupiter program fees)
- Configurable safety buffer multiplier for congested networks
- Generates `SetComputeUnitPrice` and `SetComputeUnitLimit` instructions

### Jito Bundle Builder (Rust)
- Constructs bundles of up to 5 atomic transactions
- Submits to Jito block engine with retry logic and exponential backoff
- Polls bundle status (accepted → landed / expired)
- Random tip account rotation across 8 official Jito accounts
- Configurable regional endpoints (NY, Amsterdam, Frankfurt, Tokyo)

### Jupiter Swap Optimizer (TypeScript)
- Integrates Jupiter V6 API for DEX aggregation
- Route comparison across multiple slippage levels
- Dynamic priority fee injection into swap transactions
- Versioned transaction support with proper serialization
- Jito MEV protection wrapper (planned)

### Transaction Monitor (TypeScript)
- Dual-mode: WebSocket subscriptions + RPC polling fallback
- Event-driven architecture with typed status events
- Concurrent multi-transaction tracking
- Configurable commitment levels and timeouts
- Abortable watches with proper cleanup

### On-Chain Vault (Anchor / Rust)
- PDA-based vault accounts with owner authentication
- SOL deposits via CPI to System Program
- Batch execution for multi-recipient transfers
- Custom error types with descriptive messages
- Anchor events for off-chain indexing

## Quick Start

### Rust CLI

```bash
git clone https://github.com/Maxouka/solana-tx-toolkit.git
cd solana-tx-toolkit
cargo build --release

# Estimate priority fees
export SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
cargo run -- estimate-fee --strategy fast --json

# Monitor a transaction
cargo run -- monitor <SIGNATURE>
```

### TypeScript SDK

```bash
cd ts && npm install

# Run optimized swap example
SOLANA_RPC_URL=https://your-rpc.com \
WALLET_PATH=~/.config/solana/id.json \
npx tsx ../examples/optimize-swap.ts
```

### Dashboard

```bash
cd dashboard && npm install && npm run dev
# Open http://localhost:5173
```

## Tech Stack

Rust · TypeScript · React · Solana · Anchor · Jupiter · Jito · Vite · TailwindCSS · Recharts

## License

MIT
