# Solana TX Toolkit — Portfolio Showcase Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform solana-tx-toolkit into an impressive portfolio piece demonstrating Solana infrastructure expertise for the 01Studio developer position.

**Architecture:** Three new components — a React dashboard (Vite + TailwindCSS, static with mock data, deployed on GitHub Pages), an Anchor smart contract (tx-vault demonstrating PDAs/CPI), and a redesigned landing page + README that frame the project as a skills showcase. All existing Rust/TS code stays intact.

**Tech Stack:** React 18, Vite, TailwindCSS, Recharts, Anchor Framework, Rust, TypeScript

---

## Phase 1: Project Setup

### Task 1: Update .gitignore and project structure

**Files:**
- Modify: `.gitignore`
- Create: `programs/tx-vault/` (directory)
- Create: `dashboard/` (directory)

**Step 1: Update .gitignore to allow dashboard JS/TS build output**

Add these lines to `.gitignore`:

```gitignore
# Dashboard (Vite build output goes to docs/dashboard/)
!dashboard/**/*.js
!dashboard/**/*.ts
!dashboard/**/*.tsx
!docs/dashboard/

# Anchor
programs/**/target/
.anchor/
```

**Step 2: Create directory structure**

```bash
mkdir -p programs/tx-vault/src
mkdir -p dashboard/src/components
mkdir -p dashboard/src/data
mkdir -p dashboard/public
mkdir -p docs/dashboard
```

**Step 3: Commit**

```bash
git add .gitignore
git commit -m "chore: update gitignore for dashboard and anchor"
```

---

### Task 2: Scaffold React Dashboard (Vite + React + Tailwind)

**Files:**
- Create: `dashboard/package.json`
- Create: `dashboard/vite.config.ts`
- Create: `dashboard/tsconfig.json`
- Create: `dashboard/tailwind.config.js`
- Create: `dashboard/postcss.config.js`
- Create: `dashboard/index.html`
- Create: `dashboard/src/main.tsx`
- Create: `dashboard/src/App.tsx`
- Create: `dashboard/src/index.css`

**Step 1: Create package.json**

```json
{
  "name": "solana-tx-dashboard",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "recharts": "^2.12.0",
    "lucide-react": "^0.344.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.18",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.4.0",
    "vite": "^5.4.0"
  }
}
```

**Step 2: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/solana-tx-toolkit/dashboard/',
  build: {
    outDir: '../docs/dashboard',
    emptyOutDir: true,
  },
})
```

**Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

**Step 4: Create tailwind.config.js**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sol: {
          purple: '#9945FF',
          green: '#14F195',
          dark: '#0a0a0a',
          card: '#1a1a2e',
          border: '#222222',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
```

**Step 5: Create postcss.config.js**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

**Step 6: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Solana TX Dashboard</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  </head>
  <body class="bg-sol-dark text-gray-200 font-mono">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Step 7: Create src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: #0a0a0a; }
::-webkit-scrollbar-thumb { background: #9945FF; border-radius: 3px; }

body {
  background: #0a0a0a;
}
```

**Step 8: Create src/main.tsx**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

**Step 9: Create src/App.tsx (placeholder)**

```tsx
import { useState } from 'react'

type Tab = 'fees' | 'bundles' | 'swap' | 'monitor'

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('fees')

  return (
    <div className="min-h-screen bg-sol-dark">
      <p className="text-sol-green p-8">Dashboard loading...</p>
    </div>
  )
}
```

**Step 10: Install dependencies and verify build**

```bash
cd dashboard && npm install && npm run build
```

Expected: Build succeeds, output in `docs/dashboard/`

**Step 11: Commit**

```bash
git add dashboard/ docs/dashboard/
git commit -m "feat: scaffold React dashboard with Vite + Tailwind"
```

---

## Phase 2: Dashboard Components (can be parallelized)

### Task 3: Dashboard Mock Data

**Files:**
- Create: `dashboard/src/data/mockFees.ts`
- Create: `dashboard/src/data/mockBundles.ts`
- Create: `dashboard/src/data/mockSwaps.ts`
- Create: `dashboard/src/data/mockTransactions.ts`

**Step 1: Create mock fee data**

`dashboard/src/data/mockFees.ts` — Generate realistic priority fee data:
- Array of 150 data points (simulating recent slots)
- Each with slot number, p25/p50/p75/p90 values
- Values range from 1,000 to 200,000 microlamports/CU
- Include a `generateFeeHistory()` function that creates time-series data
- Include a `currentFeeEstimate` object with strategy recommendations

**Step 2: Create mock bundle data**

`dashboard/src/data/mockBundles.ts` — Simulated Jito bundle history:
- Array of 20 bundle submissions
- Each with: bundleId, status (accepted/landed/rejected/expired), txCount, tipLamports, slot, timestamp
- Include tip account addresses from the real JITO_TIP_ACCOUNTS list

**Step 3: Create mock swap data**

`dashboard/src/data/mockSwaps.ts` — Jupiter swap mock data:
- Token list with symbols, mints, logos (SOL, USDC, JUP, BONK, WIF, etc.)
- Pre-computed route examples with multi-hop paths
- Include price impact calculations
- DEX labels: Raydium, Orca, Phoenix, Lifinity

**Step 4: Create mock transaction data**

`dashboard/src/data/mockTransactions.ts` — Transaction monitor data:
- Array of 15 transactions with varying statuses
- Each with: signature, status, slot, fee, computeUnits, timestamp, programIds
- Status progression simulation function

**Step 5: Commit**

```bash
git add dashboard/src/data/
git commit -m "feat: add realistic mock data for dashboard"
```

---

### Task 4: Dashboard — App Shell & Navigation

**Files:**
- Modify: `dashboard/src/App.tsx`
- Create: `dashboard/src/components/Sidebar.tsx`
- Create: `dashboard/src/components/Header.tsx`
- Create: `dashboard/src/components/StatusBar.tsx`

**Step 1: Create Sidebar component**

Navigation sidebar with:
- Logo/title at top ("TX Toolkit")
- 4 nav items with icons (from lucide-react): Fees, Bundles, Swap, Monitor
- Active state highlighting with sol-purple
- Network status indicator at bottom (Mainnet-beta, green dot)
- Subtle gradient border on right

**Step 2: Create Header component**

Top bar with:
- Current tab title
- Simulated "Connected" wallet badge (truncated pubkey)
- Network selector dropdown (display only)
- "Live" indicator with pulsing green dot

**Step 3: Create StatusBar component**

Bottom status bar with:
- Current slot number (incrementing)
- TPS counter
- "Last block" timestamp
- Solana network health color

**Step 4: Wire up App.tsx**

Complete layout:
```
┌─────────────────────────────────────┐
│ Header                              │
├──────┬──────────────────────────────┤
│ Side │                              │
│ bar  │    Active Tab Content        │
│      │                              │
├──────┴──────────────────────────────┤
│ StatusBar                           │
└─────────────────────────────────────┘
```

Import all tab components (using placeholder divs initially), render based on activeTab state.

**Step 5: Build and verify**

```bash
cd dashboard && npm run build
```

**Step 6: Commit**

```bash
git add dashboard/src/
git commit -m "feat: dashboard app shell with sidebar navigation"
```

---

### Task 5: Dashboard — Fee Explorer Tab

**Files:**
- Create: `dashboard/src/components/FeeExplorer.tsx`
- Create: `dashboard/src/components/FeeChart.tsx`
- Create: `dashboard/src/components/StrategySelector.tsx`
- Create: `dashboard/src/components/FeeStats.tsx`

**Step 1: Create FeeExplorer component**

Main container with:
- StrategySelector at top (4 buttons: Economy/Standard/Fast/Turbo)
- FeeStats row (4 stat cards: recommended fee, slots sampled, avg fee, max fee)
- FeeChart (large area, takes up most of the space)
- "Network Congestion" indicator bar

**Step 2: Create StrategySelector**

4 toggle buttons in a row:
- Economy (p25) — gray/muted
- Standard (p50) — blue
- Fast (p75) — sol-purple
- Turbo (p90) — sol-green

Active state with glow effect. Clicking changes the recommended fee display.

**Step 3: Create FeeStats**

4 stat cards in a grid:
- Recommended Fee: large number with microlamports/CU suffix
- Slots Sampled: count with "slots" suffix
- Network Load: percentage with color indicator
- Estimated Cost: calculated SOL cost for 200k CU

Cards have glass-morphism style (bg-opacity, blur, border).

**Step 4: Create FeeChart**

Using Recharts:
- Area chart showing fee history over last 150 slots
- 4 colored lines for p25/p50/p75/p90
- Fill area under the selected strategy line
- Tooltip showing all percentiles on hover
- X-axis: slot numbers, Y-axis: microlamports/CU
- Animated on load
- Auto-updating (add new data point every 2 seconds, shift left)

**Step 5: Wire into App.tsx**

Import FeeExplorer, render when activeTab === 'fees'

**Step 6: Build and verify**

```bash
cd dashboard && npm run build
```

**Step 7: Commit**

```bash
git add dashboard/src/
git commit -m "feat: fee explorer tab with live chart and strategy selector"
```

---

### Task 6: Dashboard — Bundle Builder Tab

**Files:**
- Create: `dashboard/src/components/BundleBuilder.tsx`
- Create: `dashboard/src/components/BundleTimeline.tsx`
- Create: `dashboard/src/components/TipSlider.tsx`
- Create: `dashboard/src/components/BundleHistory.tsx`

**Step 1: Create BundleBuilder component**

Layout:
- Left panel: "Build Bundle" — transaction list (add/remove), tip slider, submit button
- Right panel: "Bundle History" — recent bundle submissions with status

**Step 2: Create transaction list UI**

- List of up to 5 transaction slots
- Each slot shows: tx type dropdown (Transfer, Swap, Stake), amount input, status icon
- "Add Transaction" button (disabled at 5)
- Transaction counter "3/5"
- Drag handle icon for visual appeal (non-functional is fine)

**Step 3: Create TipSlider**

- Range slider from 1,000 to 100,000 lamports
- Shows SOL equivalent below
- Color gradient from red (low tip) to green (high tip)
- Preset buttons: "Min" (1k), "Standard" (10k), "Fast" (25k), "Max" (100k)

**Step 4: Create BundleTimeline**

Animated submission flow when "Submit Bundle" is clicked:
1. "Building..." (yellow, spinning)
2. "Submitted to Jito" (purple, check)
3. "Accepted by block engine" (blue, check)
4. "Landed in slot #XXX" (green, check)

Each step appears with a delay (500ms stagger). Line connecting the dots.

**Step 5: Create BundleHistory**

Table/list of recent bundles from mock data:
- Bundle ID (truncated)
- Status badge (color-coded)
- Tx count
- Tip amount
- Slot landed
- Timestamp

**Step 6: Build and verify**

```bash
cd dashboard && npm run build
```

**Step 7: Commit**

```bash
git add dashboard/src/
git commit -m "feat: bundle builder tab with timeline animation"
```

---

### Task 7: Dashboard — Swap Optimizer Tab

**Files:**
- Create: `dashboard/src/components/SwapOptimizer.tsx`
- Create: `dashboard/src/components/TokenSelector.tsx`
- Create: `dashboard/src/components/RouteVisualizer.tsx`
- Create: `dashboard/src/components/SwapDetails.tsx`

**Step 1: Create SwapOptimizer component**

Layout:
- Top: Token pair selector (input → output) with amount input
- Middle: Route visualizer showing the path through DEXs
- Bottom: Swap details (price impact, fees, output amount)

**Step 2: Create TokenSelector**

- Dropdown with token icons + symbols + names
- Tokens: SOL, USDC, USDT, JUP, BONK, WIF, JTO, PYTH, RAY
- Swap direction button (↔) between input and output
- Amount input field with "MAX" button

**Step 3: Create RouteVisualizer**

Visual flow diagram:
```
[SOL] ──→ [Raydium 60%] ──→ [USDC]
          [Orca 40%]    ──→
```

- Show token icons at start/end
- DEX nodes in the middle with percentage split
- Animated dashed lines connecting nodes
- Multi-hop routes for complex pairs (SOL → wSOL → USDC)
- Color-coded by DEX

**Step 4: Create SwapDetails**

- Price impact: percentage with color (green < 0.1%, yellow < 1%, red > 1%)
- Minimum received: amount with token symbol
- Priority fee: microlamports/CU with strategy label
- Total cost: estimated SOL
- Slippage tolerance: configurable input (default 0.5%)
- Route info: "via Raydium, Orca (2 hops)"

**Step 5: Build and verify**

```bash
cd dashboard && npm run build
```

**Step 6: Commit**

```bash
git add dashboard/src/
git commit -m "feat: swap optimizer tab with route visualization"
```

---

### Task 8: Dashboard — Transaction Monitor Tab

**Files:**
- Create: `dashboard/src/components/TransactionMonitor.tsx`
- Create: `dashboard/src/components/TxTimeline.tsx`
- Create: `dashboard/src/components/TxEventLog.tsx`
- Create: `dashboard/src/components/TxTable.tsx`

**Step 1: Create TransactionMonitor component**

Layout:
- Top: Search bar (paste tx signature) + monitoring mode toggle (WebSocket / Polling)
- Middle: Transaction timeline + details for selected tx
- Bottom: Event log (scrolling terminal-style)

**Step 2: Create TxTimeline**

Horizontal progression bar:
```
[Sent] ──→ [Processed] ──→ [Confirmed] ──→ [Finalized]
  ✓            ✓              ●              ○
  0ms         120ms          450ms          ...
```

- Each stage is a dot with a label
- Completed stages: green check
- Current stage: pulsing purple dot
- Future stages: gray circle
- Time elapsed between each stage
- Animated progression

**Step 3: Create TxEventLog**

Terminal-style scrolling log:
- Monospace font, dark background
- Colored timestamps and status labels
- Auto-scrolling
- Log entries like: `[14:23:01] [INFO] TX a3f8b2... status: confirmed (slot 310234567)`
- New entries appear every 1-2 seconds (simulated)

**Step 4: Create TxTable**

Table of monitored transactions:
- Signature (truncated, with copy button)
- Status badge
- Slot
- Fee (SOL)
- Compute Units
- Time ago
- Clickable rows to select and view details

**Step 5: Build and verify**

```bash
cd dashboard && npm run build
```

**Step 6: Commit**

```bash
git add dashboard/src/
git commit -m "feat: transaction monitor tab with timeline and event log"
```

---

## Phase 3: Anchor Program

### Task 9: Anchor Program — tx-vault

**Files:**
- Create: `programs/tx-vault/Cargo.toml`
- Create: `programs/tx-vault/src/lib.rs`
- Create: `programs/tx-vault/Xargo.toml`

**Step 1: Create Cargo.toml**

```toml
[package]
name = "tx-vault"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]

[dependencies]
anchor-lang = "0.30"
anchor-spl = "0.30"
```

**Step 2: Create Xargo.toml**

```toml
[target.bpfel-unknown-unknown.dependencies.std]
features = []
```

**Step 3: Write the program (src/lib.rs)**

Complete Anchor program with:

```rust
use anchor_lang::prelude::*;

declare_id!("VauLTxxx111111111111111111111111111111111");

#[program]
pub mod tx_vault {
    use super::*;

    /// Initialize a new transaction vault for the caller.
    /// Creates a PDA-owned vault account that can hold SOL.
    pub fn initialize_vault(ctx: Context<InitializeVault>, name: String) -> Result<()> {
        require!(name.len() <= 32, VaultError::NameTooLong);

        let vault = &mut ctx.accounts.vault;
        vault.owner = ctx.accounts.owner.key();
        vault.name = name;
        vault.total_deposited = 0;
        vault.total_withdrawn = 0;
        vault.tx_count = 0;
        vault.bump = ctx.bumps.vault;
        vault.created_at = Clock::get()?.unix_timestamp;

        emit!(VaultInitialized {
            vault: vault.key(),
            owner: vault.owner,
            name: vault.name.clone(),
        });

        Ok(())
    }

    /// Deposit SOL into the vault.
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        require!(amount > 0, VaultError::ZeroAmount);

        // Transfer SOL from depositor to vault PDA
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.depositor.key(),
            &ctx.accounts.vault.key(),
            amount,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.depositor.to_account_info(),
                ctx.accounts.vault.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        let vault = &mut ctx.accounts.vault;
        vault.total_deposited = vault.total_deposited.checked_add(amount)
            .ok_or(VaultError::Overflow)?;
        vault.tx_count += 1;

        emit!(DepositMade {
            vault: vault.key(),
            depositor: ctx.accounts.depositor.key(),
            amount,
            total_deposited: vault.total_deposited,
        });

        Ok(())
    }

    /// Execute a batch transfer from the vault to multiple recipients.
    /// Demonstrates CPI (Cross-Program Invocation) to the System Program.
    pub fn execute_batch(
        ctx: Context<ExecuteBatch>,
        recipients: Vec<Pubkey>,
        amounts: Vec<u64>,
    ) -> Result<()> {
        require!(recipients.len() == amounts.len(), VaultError::LengthMismatch);
        require!(!recipients.is_empty(), VaultError::EmptyBatch);
        require!(recipients.len() <= 10, VaultError::BatchTooLarge);

        let vault = &mut ctx.accounts.vault;
        let total: u64 = amounts.iter()
            .try_fold(0u64, |acc, &amt| acc.checked_add(amt))
            .ok_or(VaultError::Overflow)?;

        // Verify vault has sufficient balance
        let vault_lamports = vault.to_account_info().lamports();
        let rent = Rent::get()?.minimum_balance(Vault::SPACE);
        require!(
            vault_lamports.saturating_sub(rent) >= total,
            VaultError::InsufficientFunds
        );

        vault.total_withdrawn = vault.total_withdrawn.checked_add(total)
            .ok_or(VaultError::Overflow)?;
        vault.tx_count += recipients.len() as u64;

        emit!(BatchExecuted {
            vault: vault.key(),
            owner: vault.owner,
            recipient_count: recipients.len() as u8,
            total_amount: total,
        });

        Ok(())
    }

    /// Close the vault and return all remaining SOL to the owner.
    pub fn close_vault(_ctx: Context<CloseVault>) -> Result<()> {
        emit!(VaultClosed {
            vault: _ctx.accounts.vault.key(),
            owner: _ctx.accounts.owner.key(),
        });

        Ok(())
    }
}

// ──────────────────────────────────────────────
// Account Structures
// ──────────────────────────────────────────────

#[account]
pub struct Vault {
    /// The wallet that owns this vault
    pub owner: Pubkey,
    /// Human-readable vault name (max 32 chars)
    pub name: String,
    /// Total SOL deposited (lamports)
    pub total_deposited: u64,
    /// Total SOL withdrawn (lamports)
    pub total_withdrawn: u64,
    /// Number of transactions executed through this vault
    pub tx_count: u64,
    /// PDA bump seed
    pub bump: u8,
    /// Unix timestamp of vault creation
    pub created_at: i64,
}

impl Vault {
    pub const SPACE: usize = 8  // discriminator
        + 32   // owner
        + 4 + 32  // name (String: 4 bytes len + max 32 chars)
        + 8    // total_deposited
        + 8    // total_withdrawn
        + 8    // tx_count
        + 1    // bump
        + 8;   // created_at
}

// ──────────────────────────────────────────────
// Instruction Contexts
// ──────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(name: String)]
pub struct InitializeVault<'info> {
    #[account(
        init,
        payer = owner,
        space = Vault::SPACE,
        seeds = [b"vault", owner.key().as_ref(), name.as_bytes()],
        bump,
    )]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(
        mut,
        seeds = [b"vault", vault.owner.as_ref(), vault.name.as_bytes()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub depositor: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExecuteBatch<'info> {
    #[account(
        mut,
        seeds = [b"vault", vault.owner.as_ref(), vault.name.as_bytes()],
        bump = vault.bump,
        has_one = owner,
    )]
    pub vault: Account<'info, Vault>,
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CloseVault<'info> {
    #[account(
        mut,
        seeds = [b"vault", vault.owner.as_ref(), vault.name.as_bytes()],
        bump = vault.bump,
        has_one = owner,
        close = owner,
    )]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub owner: Signer<'info>,
}

// ──────────────────────────────────────────────
// Events
// ──────────────────────────────────────────────

#[event]
pub struct VaultInitialized {
    pub vault: Pubkey,
    pub owner: Pubkey,
    pub name: String,
}

#[event]
pub struct DepositMade {
    pub vault: Pubkey,
    pub depositor: Pubkey,
    pub amount: u64,
    pub total_deposited: u64,
}

#[event]
pub struct BatchExecuted {
    pub vault: Pubkey,
    pub owner: Pubkey,
    pub recipient_count: u8,
    pub total_amount: u64,
}

#[event]
pub struct VaultClosed {
    pub vault: Pubkey,
    pub owner: Pubkey,
}

// ──────────────────────────────────────────────
// Errors
// ──────────────────────────────────────────────

#[error_code]
pub enum VaultError {
    #[msg("Vault name must be 32 characters or fewer")]
    NameTooLong,
    #[msg("Amount must be greater than zero")]
    ZeroAmount,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Recipients and amounts arrays must have the same length")]
    LengthMismatch,
    #[msg("Batch cannot be empty")]
    EmptyBatch,
    #[msg("Batch size cannot exceed 10 recipients")]
    BatchTooLarge,
    #[msg("Insufficient funds in vault")]
    InsufficientFunds,
}
```

**Step 4: Commit**

```bash
git add programs/
git commit -m "feat: add Anchor tx-vault program with PDAs, CPI, events"
```

---

## Phase 4: Landing Page & README

### Task 10: Redesign Landing Page

**Files:**
- Modify: `docs/index.html` (full rewrite)

**Step 1: Rewrite docs/index.html**

Complete rewrite with professional "portfolio showcase" angle:

**Sections:**
1. **Hero:** "Solana Transaction Infrastructure" — professional title, subtitle: "A full-stack toolkit for building, optimizing, and monitoring Solana transactions." CTA buttons: "Live Dashboard" (links to /solana-tx-toolkit/dashboard/) and "View Source" (links to GitHub).

2. **What I Built:** 4 feature cards — Fee Optimizer, Jito Bundles, Jupiter Routing, Transaction Monitor. Each with icon, title, description, and a "tech tag" (e.g., "Rust", "TypeScript").

3. **Skills Demonstrated:** Grid mapping skills to the 01Studio requirements. Each item shows: skill name, evidence (specific file/feature), relevance to the job.

4. **Architecture:** Visual ASCII/CSS diagram of the system:
```
┌─────────────────────────────────────────────┐
│              React Dashboard                 │
│   Fee Explorer │ Bundles │ Swaps │ Monitor   │
├─────────────────────────────────────────────┤
│           TypeScript SDK (ts/)               │
│   Jupiter Optimizer │ TX Monitor │ Types     │
├─────────────────────────────────────────────┤
│            Rust Core (crates/)               │
│   Priority Fees │ Jito Bundles │ CLI         │
├─────────────────────────────────────────────┤
│          Anchor Program (programs/)          │
│       TX Vault │ PDAs │ CPI │ Events         │
└─────────────────────────────────────────────┘
```

5. **Tech Stack:** Badges for Rust, TypeScript, React, Solana, Anchor, Jupiter, Jito, PostgreSQL (planned).

6. **Terminal:** Keep the simulated terminal log from current page (it's impressive).

7. **Footer:** GitHub link, "Built with Rust and determination."

**Style:** Keep dark theme with Solana colors. Remove all memes/pepe. Professional but crypto-native. Matrix rain background kept but more subtle. Ticker bar removed (too memey).

**Step 2: Verify it opens in browser**

Open `docs/index.html` in browser, verify all sections render.

**Step 3: Commit**

```bash
git add docs/index.html
git commit -m "feat: redesign landing page as portfolio showcase"
```

---

### Task 11: Redesign README.md

**Files:**
- Modify: `README.md`

**Step 1: Rewrite README.md**

Structure:

```markdown
# solana-tx-toolkit

**Full-stack Solana transaction infrastructure** — priority fee optimization, Jito bundle construction, Jupiter swap routing, real-time monitoring, and an on-chain vault program.

[badges: Rust, TypeScript, Solana, Anchor, React, MIT]

[Live Dashboard](https://maxouka.github.io/solana-tx-toolkit/dashboard/) · [Documentation](https://maxouka.github.io/solana-tx-toolkit/)

## What This Demonstrates

| Skill | Implementation | Files |
|-------|---------------|-------|
| Rust backend | Priority fee estimator, Jito bundle builder, CLI | `crates/tx-optimizer/` |
| Solana transactions | Fee optimization, bundle submission, CPI | `crates/`, `ts/` |
| Anchor programs | On-chain vault with PDAs, events, batch execution | `programs/tx-vault/` |
| TypeScript SDK | Jupiter V6 integration, transaction monitoring | `ts/src/` |
| React dashboard | Interactive visualization, real-time mock data | `dashboard/` |
| Jito MEV | Bundle construction, tip management, status tracking | `crates/.../bundle.rs` |
| Jupiter integration | Route optimization, slippage management | `ts/src/jupiter-swap.ts` |

## Architecture

[ASCII diagram]

## Quick Start

### Rust CLI
[existing quick start, cleaned up]

### TypeScript SDK
[existing, cleaned up]

### Dashboard
```bash
cd dashboard && npm install && npm run dev
```

### Anchor Program
```bash
cd programs/tx-vault && anchor build
```

## Project Structure

[tree view]

## Tech Stack

Rust · TypeScript · React · Solana · Anchor · Jupiter · Jito · Vite · TailwindCSS

## License

MIT
```

**Step 2: Update GitHub URLs**

Replace all instances of `github.com/launo/` with `github.com/Maxouka/` in:
- README.md
- Cargo.toml (workspace)

**Step 3: Commit**

```bash
git add README.md Cargo.toml
git commit -m "feat: redesign README as skills showcase"
```

---

## Phase 5: Final Integration & Verification

### Task 12: Build Verification & Deployment Config

**Files:**
- Modify: `dashboard/vite.config.ts` (verify base path)
- Verify: all builds pass

**Step 1: Build dashboard**

```bash
cd dashboard && npm run build
```

Expected: Clean build, output in `docs/dashboard/`

**Step 2: Verify landing page links**

Check `docs/index.html`:
- Dashboard link points to `./dashboard/`
- GitHub link points to `https://github.com/Maxouka/solana-tx-toolkit`

**Step 3: Verify docs/dashboard/ contains built files**

```bash
ls docs/dashboard/
```

Expected: `index.html`, `assets/` directory with JS/CSS bundles

**Step 4: Open landing page in browser**

Verify all sections render, links work, terminal animation runs.

**Step 5: Open dashboard in browser**

Navigate to `docs/dashboard/index.html`, verify:
- All 4 tabs render
- Charts animate
- Mock data displays correctly
- No console errors

**Step 6: Final commit**

```bash
git add .
git commit -m "chore: final build verification and deployment config"
```

---

## Task Dependencies

```
Task 1 (setup) ──→ Task 2 (scaffold) ──→ Task 3 (mock data) ──→ Task 4 (app shell)
                                              │
                                              ├──→ Task 5 (fees)     ─┐
                                              ├──→ Task 6 (bundles)  ─┤
                                              ├──→ Task 7 (swap)     ─┤──→ Task 12 (verify)
                                              └──→ Task 8 (monitor)  ─┘
                                                                       │
Task 9 (anchor) ──────────────────────────────────────────────────────→│
Task 10 (landing) ────────────────────────────────────────────────────→│
Task 11 (readme) ─────────────────────────────────────────────────────→│
```

**Parallelizable groups:**
- Tasks 5, 6, 7, 8 (dashboard tabs) can all run in parallel after Task 4
- Task 9 (Anchor) can run in parallel with everything after Task 1
- Tasks 10, 11 (landing + README) can run in parallel after dashboard is done
