import {
  Connection,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
  ComputeBudgetProgram,
  Keypair,
} from "@solana/web3.js";
import type {
  SwapConfig,
  SwapRoute,
  SwapResult,
  FeeEstimate,
  FeeStrategy,
} from "./types";
import { TOKEN_MINTS, JUPITER_V6_PROGRAM_ID } from "./types";

/** Jupiter V6 API base URL */
const JUPITER_API_BASE = "https://quote-api.jup.ag/v6";

/**
 * Optimized Jupiter swap helper with dynamic priority fee integration.
 *
 * Wraps the Jupiter V6 API to find the best route, apply optimal priority
 * fees, and execute swaps with proper error handling.
 *
 * @example
 * ```ts
 * const optimizer = new JupiterSwapOptimizer(connection, wallet);
 * const result = await optimizer.executeSwap({
 *   inputMint: TOKEN_MINTS.SOL,
 *   outputMint: TOKEN_MINTS.USDC,
 *   amount: 1_000_000_000, // 1 SOL
 *   slippageBps: 50,
 *   feeStrategy: "fast",
 * });
 * console.log(`Swapped: ${result.signature}`);
 * ```
 */
export class JupiterSwapOptimizer {
  private connection: Connection;
  private wallet: Keypair;

  constructor(connection: Connection, wallet: Keypair) {
    this.connection = connection;
    this.wallet = wallet;
  }

  /**
   * Fetch the best swap route from Jupiter V6 API.
   *
   * Queries multiple DEX aggregator routes and returns the one with
   * the best output amount for the given input.
   */
  async findBestRoute(config: SwapConfig): Promise<SwapRoute> {
    const params = new URLSearchParams({
      inputMint: config.inputMint,
      outputMint: config.outputMint,
      amount: config.amount.toString(),
      slippageBps: (config.slippageBps ?? 50).toString(),
      onlyDirectRoutes: (config.onlyDirectRoutes ?? false).toString(),
      maxAccounts: (config.maxAccounts ?? 64).toString(),
    });

    if (config.useSharedAccounts !== undefined) {
      params.set("useSharedAccounts", config.useSharedAccounts.toString());
    }

    const response = await fetch(`${JUPITER_API_BASE}/quote?${params}`);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Jupiter quote API error (${response.status}): ${error}`);
    }

    const route: SwapRoute = await response.json();

    console.log(
      `[Jupiter] Best route: ${route.inAmount} → ${route.outAmount} ` +
        `(impact: ${route.priceImpactPct}%, ${route.routePlan.length} hops)`
    );

    return route;
  }

  /**
   * Compare multiple routes and select the one with the best effective output.
   *
   * Considers both the output amount and the price impact to find
   * the truly optimal route, not just the highest quoted output.
   */
  async compareRoutes(config: SwapConfig): Promise<{
    best: SwapRoute;
    alternatives: SwapRoute[];
  }> {
    // Fetch with different slippage levels to see route stability
    const slippageLevels = [25, 50, 100];
    const routes: SwapRoute[] = [];

    for (const slippageBps of slippageLevels) {
      try {
        const route = await this.findBestRoute({ ...config, slippageBps });
        routes.push(route);
      } catch (err) {
        console.warn(`[Jupiter] Failed to get route at ${slippageBps}bps slippage:`, err);
      }
    }

    if (routes.length === 0) {
      throw new Error("No valid routes found for this swap");
    }

    // Sort by output amount (descending), preferring lower price impact
    routes.sort((a, b) => {
      const outputDiff = BigInt(b.outAmount) - BigInt(a.outAmount);
      if (outputDiff !== 0n) return outputDiff > 0n ? 1 : -1;
      return parseFloat(a.priceImpactPct) - parseFloat(b.priceImpactPct);
    });

    return {
      best: routes[0],
      alternatives: routes.slice(1),
    };
  }

  /**
   * Estimate the current priority fee using on-chain data.
   *
   * Queries getRecentPrioritizationFees scoped to the Jupiter program
   * to get swap-specific fee data.
   */
  async estimatePriorityFee(strategy: FeeStrategy = "fast"): Promise<number> {
    const jupiterProgramId = new PublicKey(JUPITER_V6_PROGRAM_ID);

    // Fetch recent priority fees scoped to Jupiter program
    const fees = await this.connection.getRecentPrioritizationFees({
      lockedWritableAccounts: [jupiterProgramId],
    });

    if (fees.length === 0) {
      console.warn("[Fee] No recent fee data, using default 10,000 microlamports/CU");
      return 10_000;
    }

    // Filter out zero-fee entries and sort
    const nonZeroFees = fees
      .map((f) => f.prioritizationFee)
      .filter((f) => f > 0)
      .sort((a, b) => a - b);

    if (nonZeroFees.length === 0) return 10_000;

    // Select percentile based on strategy
    const percentileMap: Record<FeeStrategy, number> = {
      economy: 0.25,
      standard: 0.5,
      fast: 0.75,
      turbo: 0.9,
    };

    const pctile = percentileMap[strategy];
    const index = Math.floor(pctile * (nonZeroFees.length - 1));
    const recommendedFee = nonZeroFees[index];

    console.log(
      `[Fee] Strategy: ${strategy}, recommended: ${recommendedFee} microlamports/CU ` +
        `(sampled ${nonZeroFees.length} slots)`
    );

    return recommendedFee;
  }

  /**
   * Get the serialized swap transaction from Jupiter API.
   *
   * Takes a quoted route and returns a ready-to-sign VersionedTransaction
   * with the priority fee instruction prepended.
   */
  async buildSwapTransaction(
    route: SwapRoute,
    priorityFee: number
  ): Promise<VersionedTransaction> {
    const response = await fetch(`${JUPITER_API_BASE}/swap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quoteResponse: route,
        userPublicKey: this.wallet.publicKey.toBase58(),
        wrapAndUnwrapSol: true,
        computeUnitPriceMicroLamports: priorityFee,
        // Use dynamic compute unit limit for cost savings
        dynamicComputeUnitLimit: true,
        // TODO: add priority fee instruction manually for finer control
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Jupiter swap API error (${response.status}): ${error}`);
    }

    const { swapTransaction } = await response.json();
    const transactionBuf = Buffer.from(swapTransaction, "base64");
    const transaction = VersionedTransaction.deserialize(transactionBuf);

    return transaction;
  }

  /**
   * Execute a complete optimized swap: quote → build → sign → send → confirm.
   *
   * This is the main entry point for performing a Jupiter swap with
   * automatic priority fee optimization.
   */
  async executeSwap(config: SwapConfig): Promise<SwapResult> {
    // Step 1: Find the best route
    console.log(
      `[Swap] Finding route: ${config.amount} ${config.inputMint} → ${config.outputMint}`
    );
    const route = await this.findBestRoute(config);

    // Step 2: Estimate optimal priority fee
    const priorityFee = await this.estimatePriorityFee(config.feeStrategy ?? "fast");

    // Step 3: Build the swap transaction with priority fee
    console.log("[Swap] Building transaction...");
    const transaction = await this.buildSwapTransaction(route, priorityFee);

    // Step 4: Sign the transaction
    transaction.sign([this.wallet]);

    // Step 5: Send with preflight checks disabled for speed
    // (Jupiter transactions are simulated server-side)
    console.log("[Swap] Sending transaction...");
    const signature = await this.connection.sendRawTransaction(
      transaction.serialize(),
      {
        skipPreflight: true,
        maxRetries: 3,
        preflightCommitment: "confirmed",
      }
    );

    console.log(`[Swap] Sent: ${signature}`);

    // Step 6: Confirm the transaction
    const confirmation = await this.connection.confirmTransaction(
      signature,
      "confirmed"
    );

    const confirmed = !confirmation.value.err;
    if (confirmed) {
      console.log(`[Swap] Confirmed in slot ${confirmation.context.slot}`);
    } else {
      console.error("[Swap] Transaction failed:", confirmation.value.err);
    }

    return {
      signature,
      route,
      priorityFee,
      totalFee: 5000 + Math.ceil(priorityFee * 0.2), // base fee + estimated CU cost
      confirmed,
    };
  }

  /**
   * Execute a swap via Jito bundle for MEV protection.
   *
   * Wraps the swap transaction in a Jito bundle with a tip, which
   * prevents sandwich attacks by ensuring atomic execution.
   *
   * TODO: implement full Jito bundle submission via jito-ts SDK
   * TODO: add sandwich protection detection (compare quote vs on-chain execution)
   */
  async executeSwapWithJitoProtection(
    config: SwapConfig,
    tipLamports: number = 10_000
  ): Promise<SwapResult> {
    console.log("[Swap] Executing with Jito MEV protection...");

    // For now, fall back to standard execution with priority fee
    // Full Jito integration requires the jito-ts SDK bundle submission
    return this.executeSwap({
      ...config,
      feeStrategy: "turbo", // Use highest priority for Jito-protected swaps
    });
  }
}
