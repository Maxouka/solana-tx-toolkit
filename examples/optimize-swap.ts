/**
 * Example: Optimized Jupiter Swap with Dynamic Priority Fees
 *
 * Demonstrates how to use the SDK to perform a Jupiter swap with:
 * - Automatic route optimization (best price across all DEXs)
 * - Dynamic priority fee estimation from on-chain data
 * - Transaction confirmation monitoring
 *
 * Usage:
 *   SOLANA_RPC_URL=https://your-rpc.com \
 *   WALLET_PATH=~/.config/solana/id.json \
 *   npx tsx examples/optimize-swap.ts
 */

import { Connection, Keypair } from "@solana/web3.js";
import * as fs from "fs";
import {
  JupiterSwapOptimizer,
  TransactionMonitor,
  TOKEN_MINTS,
} from "../ts/src";

async function main() {
  // --- Configuration ---
  const rpcUrl = process.env.SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com";
  const walletPath = process.env.WALLET_PATH ?? `${process.env.HOME}/.config/solana/id.json`;

  console.log("=== Solana Optimized Swap Example ===\n");
  console.log(`RPC:    ${rpcUrl}`);
  console.log(`Wallet: ${walletPath}\n`);

  // Load wallet keypair
  const walletData = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
  const wallet = Keypair.fromSecretKey(Uint8Array.from(walletData));
  console.log(`Address: ${wallet.publicKey.toBase58()}\n`);

  // Initialize connection and SDK
  const connection = new Connection(rpcUrl, "confirmed");
  const optimizer = new JupiterSwapOptimizer(connection, wallet);
  const monitor = new TransactionMonitor(connection);

  // --- Step 1: Compare Routes ---
  console.log("--- Step 1: Finding best route ---");
  const swapConfig = {
    inputMint: TOKEN_MINTS.SOL,
    outputMint: TOKEN_MINTS.USDC,
    amount: 100_000_000, // 0.1 SOL
    slippageBps: 50,     // 0.5% slippage
    feeStrategy: "fast" as const,
  };

  const { best, alternatives } = await optimizer.compareRoutes(swapConfig);
  console.log(`\nBest route: ${best.inAmount} → ${best.outAmount} USDC`);
  console.log(`Price impact: ${best.priceImpactPct}%`);
  console.log(`Route hops: ${best.routePlan.length}`);
  best.routePlan.forEach((step, i) => {
    console.log(`  ${i + 1}. ${step.swapInfo.label} (${step.percent}%)`);
  });

  if (alternatives.length > 0) {
    console.log(`\n${alternatives.length} alternative routes found`);
  }

  // --- Step 2: Estimate Priority Fee ---
  console.log("\n--- Step 2: Estimating priority fee ---");
  const fee = await optimizer.estimatePriorityFee("fast");
  console.log(`Recommended fee: ${fee} microlamports/CU`);
  console.log(`Estimated cost:  ~${(fee * 200_000 / 1e9).toFixed(6)} SOL\n`);

  // --- Step 3: Execute Swap ---
  console.log("--- Step 3: Executing swap ---");

  // Set up monitoring events before executing
  monitor.on("statusChange", (update) => {
    console.log(`  [${update.elapsedMs}ms] Status: ${update.status}`);
  });

  monitor.on("confirmed", (update) => {
    console.log(`  Confirmed in slot ${update.slot}!`);
  });

  monitor.on("error", (update) => {
    console.error(`  Transaction failed: ${update.error}`);
  });

  const result = await optimizer.executeSwap(swapConfig);

  // --- Step 4: Monitor Confirmation ---
  console.log("\n--- Step 4: Monitoring confirmation ---");
  const monitorResult = await monitor.watchTransaction(result.signature, {
    commitment: "finalized",
    timeoutMs: 30_000,
  });

  // --- Summary ---
  console.log("\n=== Swap Summary ===");
  console.log(`Signature:    ${result.signature}`);
  console.log(`Status:       ${result.confirmed ? "SUCCESS" : "FAILED"}`);
  console.log(`Priority fee: ${result.priorityFee} microlamports/CU`);
  console.log(`Total fee:    ${result.totalFee} lamports`);
  console.log(`Final status: ${monitorResult.status}`);
  console.log(
    `Explorer:     https://solscan.io/tx/${result.signature}`
  );
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
