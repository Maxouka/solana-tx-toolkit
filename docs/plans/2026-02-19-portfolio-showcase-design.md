# Design: Solana TX Toolkit — Portfolio Showcase for 01Studio

**Date:** 2026-02-19
**Goal:** Transform the existing solana-tx-toolkit repo into an impressive portfolio piece that demonstrates mastery of the exact tech stack required by 01Studio.

## Target Job Requirements (01Studio)

- Rust backend development
- Solana transaction optimization (bundles, priority fees, CPI)
- SDKs: Solana web3.js, Jupiter, SPL Token, Jito
- On-chain programs in Rust / Anchor
- React dashboard
- PostgreSQL (shown in stack, not deployed)
- Git workflow

## Architecture

```
solana-tx-toolkit/
├── crates/tx-optimizer/          # Rust core (existing, enhanced)
├── programs/tx-vault/            # Anchor program (NEW)
│   ├── src/lib.rs
│   └── Cargo.toml
├── ts/                           # TypeScript SDK (existing)
├── dashboard/                    # React dashboard (NEW)
│   ├── src/
│   │   ├── components/
│   │   ├── data/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   └── package.json
├── docs/index.html               # Landing page (redesigned)
├── examples/                     # Examples (existing)
└── README.md                     # README (redesigned)
```

## Component Designs

### 1. Landing Page (docs/index.html) — Redesigned

**Angle:** "Here's what I can build for you" — not a generic tool page.

- **Hero:** "Solana Transaction Infrastructure" with professional subtitle
- **What I Built:** 4 feature cards (fee optimizer, Jito bundles, Jupiter routing, tx monitor) framed as demonstrated competencies
- **Live Demo:** Prominent link to the React dashboard on GitHub Pages
- **Tech Stack:** Badges matching the 01Studio job requirements exactly
- **Architecture:** Visual system diagram
- **Terminal:** Realistic transaction log simulation (kept from current)
- **No memes:** Professional crypto aesthetic. Dark theme, Solana colors.

### 2. React Dashboard (dashboard/)

Static SPA with Vite + React + TailwindCSS. Deployed on GitHub Pages.

**4 tabs:**

1. **Fee Explorer** — Real-time priority fee visualization with mock data
   - Bar chart: p25/p50/p75/p90 percentiles
   - Strategy selector (economy/standard/fast/turbo)
   - Historical trend line
   - Network congestion indicator

2. **Bundle Builder** — Visual Jito bundle construction
   - Add/remove transactions visually
   - Tip amount slider
   - Bundle status animation (submitted → accepted → landed)
   - Bundle size counter (max 5 txs)

3. **Swap Optimizer** — Jupiter route visualization
   - Token pair selector
   - Route path visualization (multi-hop)
   - Price impact display
   - Slippage configuration
   - Compare routes side-by-side

4. **Transaction Monitor** — Real-time tx tracking
   - Transaction timeline (pending → processed → confirmed → finalized)
   - WebSocket vs polling toggle
   - Event log with timestamps
   - Multiple transaction tracking

**Style:** Dark theme, Solana purple (#9945FF) + green (#14F195), glass morphism cards, subtle animations.

### 3. Anchor Program (programs/tx-vault/)

Minimal but demonstrative smart contract:

- `initialize_vault`: Creates a PDA vault for an owner
- `deposit`: Transfers SOL into the vault
- `execute_batch`: Executes a batch operation from vault (CPI to System Program)
- `close_vault`: Closes vault, returns funds to owner

**Demonstrates:** PDAs, CPI, account validation, custom errors, events, Anchor macros.

### 4. README.md — Redesigned

Structured as a skills showcase:
- Header with tech stack badges
- "What This Demonstrates" section mapping skills to job requirements
- Architecture diagram
- Quick start instructions
- Live demo link
- Code quality indicators (tests, types, documentation)

## Deployment

- Landing page: GitHub Pages from `docs/` directory
- Dashboard: Built to `docs/dashboard/` for same GitHub Pages deployment
- No backend needed — all mock data
