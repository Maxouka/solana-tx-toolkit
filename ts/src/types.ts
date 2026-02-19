import { PublicKey, TransactionInstruction } from "@solana/web3.js";

// ──────────────────────────────────────────────────────────────
// Fee Estimation
// ──────────────────────────────────────────────────────────────

export type FeeStrategy = "economy" | "standard" | "fast" | "turbo";

export interface FeeEstimate {
  /** Recommended priority fee in microlamports per compute unit */
  recommendedFee: number;
  /** Strategy used for estimation */
  strategy: FeeStrategy;
  /** Number of recent slots sampled */
  slotsSampled: number;
  /** Fee percentile breakdown */
  percentiles: {
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    max: number;
  };
}

// ──────────────────────────────────────────────────────────────
// Jupiter Swap
// ──────────────────────────────────────────────────────────────

export interface SwapRoute {
  /** Input token mint address */
  inputMint: string;
  /** Output token mint address */
  outputMint: string;
  /** Input amount in token base units (lamports for SOL) */
  inAmount: string;
  /** Expected output amount in token base units */
  outAmount: string;
  /** Minimum output amount after slippage */
  otherAmountThreshold: string;
  /** Swap mode: ExactIn or ExactOut */
  swapMode: "ExactIn" | "ExactOut";
  /** Slippage tolerance in basis points */
  slippageBps: number;
  /** Price impact as a percentage */
  priceImpactPct: string;
  /** Ordered list of DEX routes used */
  routePlan: RoutePlanStep[];
}

export interface RoutePlanStep {
  /** AMM/DEX label (e.g., "Raydium", "Orca", "Phoenix") */
  swapInfo: {
    ammKey: string;
    label: string;
    inputMint: string;
    outputMint: string;
    inAmount: string;
    outAmount: string;
    feeAmount: string;
    feeMint: string;
  };
  /** Percentage of the input amount routed through this step */
  percent: number;
}

export interface SwapConfig {
  /** Input token mint address */
  inputMint: string;
  /** Output token mint address */
  outputMint: string;
  /** Amount in base units */
  amount: number;
  /** Slippage tolerance in basis points (default: 50 = 0.5%) */
  slippageBps?: number;
  /** Priority fee strategy for the swap transaction */
  feeStrategy?: FeeStrategy;
  /** Use direct routes only (no intermediate hops) */
  onlyDirectRoutes?: boolean;
  /** Maximum number of accounts in the transaction (for CU optimization) */
  maxAccounts?: number;
  /** Whether to use shared accounts for fee savings */
  useSharedAccounts?: boolean;
}

export interface SwapResult {
  /** Transaction signature */
  signature: string;
  /** Route that was executed */
  route: SwapRoute;
  /** Actual priority fee applied (microlamports/CU) */
  priorityFee: number;
  /** Total transaction fee in lamports */
  totalFee: number;
  /** Confirmation status */
  confirmed: boolean;
}

// ──────────────────────────────────────────────────────────────
// Jito Bundle
// ──────────────────────────────────────────────────────────────

export interface BundleConfig {
  /** Tip amount in lamports for Jito validators */
  tipLamports: number;
  /** Jito block engine URL */
  blockEngineUrl: string;
  /** Maximum retry attempts */
  maxRetries: number;
}

export type BundleStatus =
  | { type: "accepted"; bundleId: string }
  | { type: "landed"; bundleId: string; slot: number }
  | { type: "rejected"; reason: string }
  | { type: "expired"; bundleId: string };

export interface BundleSubmissionResult {
  status: BundleStatus;
  attempts: number;
  elapsedMs: number;
}

// ──────────────────────────────────────────────────────────────
// Transaction Monitoring
// ──────────────────────────────────────────────────────────────

export type ConfirmationStatus =
  | "processed"
  | "confirmed"
  | "finalized"
  | "expired"
  | "not_found";

export interface TransactionUpdate {
  /** Transaction signature */
  signature: string;
  /** Current confirmation status */
  status: ConfirmationStatus;
  /** Slot the transaction was included in */
  slot?: number;
  /** Error message if the transaction failed */
  error?: string;
  /** Time elapsed since monitoring started (ms) */
  elapsedMs: number;
}

export interface MonitorConfig {
  /** Commitment level to wait for */
  commitment: "processed" | "confirmed" | "finalized";
  /** Timeout in milliseconds */
  timeoutMs: number;
  /** Polling interval in milliseconds (used when WebSocket is unavailable) */
  pollIntervalMs: number;
}

// ──────────────────────────────────────────────────────────────
// Well-known Token Mints
// ──────────────────────────────────────────────────────────────

/** Common Solana token mint addresses for convenience. */
export const TOKEN_MINTS = {
  SOL: "So11111111111111111111111111111111111111112",
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  JUP: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
  BONK: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
  JTO: "jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL",
  WIF: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
  PYTH: "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3",
  RNDR: "rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof",
  RAY: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
} as const;

/** Jupiter program IDs */
export const JUPITER_V6_PROGRAM_ID = "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4";

/** Known Jito tip accounts on mainnet */
export const JITO_TIP_ACCOUNTS = [
  "96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5",
  "HFqU5x63VTqvQss8hp11i4bVqkfRtQ7NmXwkiGNHoR5t",
  "Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY",
  "ADaUMid9yfUytqMBgopwjb2DTLSLVPDVnF8NfRUm7AEz",
  "DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh",
  "ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt",
  "DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL",
  "3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT",
] as const;
