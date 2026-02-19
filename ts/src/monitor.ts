import {
  Connection,
  SignatureStatus,
  TransactionConfirmationStatus,
} from "@solana/web3.js";
import { EventEmitter } from "events";
import type {
  TransactionUpdate,
  ConfirmationStatus,
  MonitorConfig,
} from "./types";

/** Default monitoring configuration */
const DEFAULT_MONITOR_CONFIG: MonitorConfig = {
  commitment: "confirmed",
  timeoutMs: 60_000,
  pollIntervalMs: 1_000,
};

/**
 * Real-time transaction monitor with event-driven architecture.
 *
 * Supports both WebSocket subscriptions and RPC polling for tracking
 * transaction confirmation status. Emits events as the status changes.
 *
 * @example
 * ```ts
 * const monitor = new TransactionMonitor(connection);
 *
 * monitor.on("statusChange", (update) => {
 *   console.log(`${update.signature}: ${update.status} (${update.elapsedMs}ms)`);
 * });
 *
 * monitor.on("confirmed", (update) => {
 *   console.log(`Transaction confirmed in slot ${update.slot}`);
 * });
 *
 * monitor.on("error", (update) => {
 *   console.error(`Transaction failed: ${update.error}`);
 * });
 *
 * await monitor.watchTransaction("5Uh4...");
 * ```
 */
export class TransactionMonitor extends EventEmitter {
  private connection: Connection;
  private config: MonitorConfig;
  private activeWatches: Map<string, AbortController> = new Map();

  constructor(connection: Connection, config?: Partial<MonitorConfig>) {
    super();
    this.connection = connection;
    this.config = { ...DEFAULT_MONITOR_CONFIG, ...config };
  }

  /**
   * Watch a transaction until it reaches the target confirmation status
   * or times out.
   *
   * Uses WebSocket subscription when available, falls back to polling.
   * Emits events as the transaction status changes.
   */
  async watchTransaction(
    signature: string,
    config?: Partial<MonitorConfig>
  ): Promise<TransactionUpdate> {
    const mergedConfig = { ...this.config, ...config };
    const startTime = Date.now();
    const controller = new AbortController();

    // Track this watch for potential cancellation
    this.activeWatches.set(signature, controller);

    console.log(
      `[Monitor] Watching ${signature.slice(0, 8)}... ` +
        `(target: ${mergedConfig.commitment}, timeout: ${mergedConfig.timeoutMs}ms)`
    );

    try {
      // Try WebSocket subscription first (faster, lower latency)
      const result = await Promise.race([
        this.watchViaWebSocket(signature, mergedConfig, startTime, controller.signal),
        this.watchViaPolling(signature, mergedConfig, startTime, controller.signal),
        this.createTimeout(signature, mergedConfig.timeoutMs, startTime),
      ]);

      return result;
    } finally {
      this.activeWatches.delete(signature);
    }
  }

  /**
   * Monitor a transaction via WebSocket signatureSubscribe.
   *
   * This provides the fastest confirmation notifications but may
   * not be available on all RPC providers.
   */
  private watchViaWebSocket(
    signature: string,
    config: MonitorConfig,
    startTime: number,
    signal: AbortSignal
  ): Promise<TransactionUpdate> {
    return new Promise((resolve, reject) => {
      let subscriptionId: number | undefined;

      // Listen for abort signal
      signal.addEventListener("abort", () => {
        if (subscriptionId !== undefined) {
          this.connection.removeSignatureListener(subscriptionId);
        }
        reject(new Error("Watch cancelled"));
      });

      this.connection.onSignature(
        signature,
        (result, context) => {
          const elapsedMs = Date.now() - startTime;
          const status: ConfirmationStatus = result.err ? "expired" : "confirmed";

          const update: TransactionUpdate = {
            signature,
            status,
            slot: context.slot,
            error: result.err ? JSON.stringify(result.err) : undefined,
            elapsedMs,
          };

          this.emitUpdate(update);
          resolve(update);
        },
        config.commitment
      );
    });
  }

  /**
   * Monitor a transaction via RPC polling as a fallback.
   *
   * Polls getSignatureStatuses at regular intervals. Less efficient
   * than WebSocket but works with any RPC provider.
   */
  private async watchViaPolling(
    signature: string,
    config: MonitorConfig,
    startTime: number,
    signal: AbortSignal
  ): Promise<TransactionUpdate> {
    let lastStatus: ConfirmationStatus = "not_found";

    while (!signal.aborted) {
      const elapsedMs = Date.now() - startTime;

      if (elapsedMs >= config.timeoutMs) {
        const update: TransactionUpdate = {
          signature,
          status: "expired",
          elapsedMs,
        };
        this.emitUpdate(update);
        return update;
      }

      try {
        const statuses = await this.connection.getSignatureStatuses([signature]);
        const status = statuses.value[0];

        if (status) {
          const currentStatus = this.mapConfirmationStatus(status);

          // Emit event on status change
          if (currentStatus !== lastStatus) {
            const update: TransactionUpdate = {
              signature,
              status: currentStatus,
              slot: status.slot,
              error: status.err ? JSON.stringify(status.err) : undefined,
              elapsedMs,
            };

            this.emitUpdate(update);
            lastStatus = currentStatus;

            // Check if we've reached the target commitment
            if (this.hasReachedTarget(currentStatus, config.commitment)) {
              return update;
            }

            // Transaction failed
            if (status.err) {
              return update;
            }
          }
        }
      } catch (err) {
        console.warn(`[Monitor] Polling error for ${signature.slice(0, 8)}...:`, err);
      }

      // Wait before next poll
      await this.sleep(config.pollIntervalMs, signal);
    }

    throw new Error("Watch cancelled");
  }

  /**
   * Map Solana SDK confirmation status to our ConfirmationStatus type.
   */
  private mapConfirmationStatus(status: SignatureStatus): ConfirmationStatus {
    if (status.err) return "expired";
    if (!status.confirmationStatus) return "not_found";

    const mapping: Record<string, ConfirmationStatus> = {
      processed: "processed",
      confirmed: "confirmed",
      finalized: "finalized",
    };

    return mapping[status.confirmationStatus] ?? "not_found";
  }

  /**
   * Check if the current status has reached or exceeded the target commitment.
   */
  private hasReachedTarget(
    current: ConfirmationStatus,
    target: "processed" | "confirmed" | "finalized"
  ): boolean {
    const order: ConfirmationStatus[] = ["not_found", "processed", "confirmed", "finalized"];
    const currentIndex = order.indexOf(current);
    const targetIndex = order.indexOf(target);
    return currentIndex >= targetIndex && currentIndex > 0;
  }

  /**
   * Emit a typed update event and the appropriate named event.
   */
  private emitUpdate(update: TransactionUpdate): void {
    this.emit("statusChange", update);

    if (update.error) {
      this.emit("error", update);
    } else if (update.status === "confirmed" || update.status === "finalized") {
      this.emit("confirmed", update);
    } else if (update.status === "expired") {
      this.emit("expired", update);
    }

    console.log(
      `[Monitor] ${update.signature.slice(0, 8)}... → ${update.status}` +
        (update.slot ? ` (slot: ${update.slot})` : "") +
        ` [${update.elapsedMs}ms]`
    );
  }

  /**
   * Create a timeout promise that rejects after the specified duration.
   */
  private createTimeout(
    signature: string,
    timeoutMs: number,
    startTime: number
  ): Promise<TransactionUpdate> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const update: TransactionUpdate = {
          signature,
          status: "expired",
          elapsedMs: Date.now() - startTime,
        };
        this.emitUpdate(update);
        resolve(update);
      }, timeoutMs);
    });
  }

  /**
   * Abortable sleep helper.
   */
  private sleep(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, ms);
      signal?.addEventListener("abort", () => {
        clearTimeout(timer);
        reject(new Error("Aborted"));
      });
    });
  }

  /**
   * Cancel monitoring for a specific transaction.
   */
  cancelWatch(signature: string): void {
    const controller = this.activeWatches.get(signature);
    if (controller) {
      controller.abort();
      this.activeWatches.delete(signature);
      console.log(`[Monitor] Cancelled watch for ${signature.slice(0, 8)}...`);
    }
  }

  /**
   * Cancel all active watches.
   */
  cancelAll(): void {
    for (const [sig, controller] of this.activeWatches) {
      controller.abort();
      console.log(`[Monitor] Cancelled watch for ${sig.slice(0, 8)}...`);
    }
    this.activeWatches.clear();
  }

  /**
   * Get the number of currently active watches.
   */
  get activeWatchCount(): number {
    return this.activeWatches.size;
  }

  /**
   * Watch multiple transactions concurrently.
   *
   * Returns when all transactions have reached the target status or timed out.
   *
   * TODO: add batch status polling for efficiency (single RPC call for multiple signatures)
   */
  async watchMultiple(
    signatures: string[],
    config?: Partial<MonitorConfig>
  ): Promise<TransactionUpdate[]> {
    console.log(`[Monitor] Watching ${signatures.length} transactions...`);

    const results = await Promise.allSettled(
      signatures.map((sig) => this.watchTransaction(sig, config))
    );

    return results.map((result, i) => {
      if (result.status === "fulfilled") return result.value;
      return {
        signature: signatures[i],
        status: "expired" as ConfirmationStatus,
        elapsedMs: 0,
        error: result.reason?.message ?? "Unknown error",
      };
    });
  }
}
