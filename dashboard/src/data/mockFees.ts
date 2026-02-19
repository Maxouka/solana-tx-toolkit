// ---------------------------------------------------------------------------
// Mock Priority Fee Data
// Generates realistic Solana priority-fee history and per-strategy estimates.
// ---------------------------------------------------------------------------

export type FeeDataPoint = {
  slot: number;
  timestamp: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  max: number;
};

export type FeeEstimate = {
  strategy: string;
  recommendedFee: number;
  slotsSampled: number;
  percentiles: {
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    max: number;
  };
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Seed-friendly pseudo-random (deterministic feel, but uses Math.random). */
function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate `count` fee data-points that look like real Solana priority fees.
 *
 * - Slots start around 310 000 000 and increment by ~2-3 (realistic slot gap
 *   when polling every ~1 s).
 * - A slow sine wave simulates network congestion cycles.
 * - Each point has p25 < p50 < p75 < p90 < max with jitter.
 */
export function generateFeeHistory(count: number): FeeDataPoint[] {
  const points: FeeDataPoint[] = [];
  let slot = 310_000_000 + rand(0, 1_000);
  let ts = Date.now() - count * 400; // ~0.4 s per slot

  for (let i = 0; i < count; i++) {
    // Congestion wave: oscillates base between ~5 000 and ~50 000
    const wave = Math.sin(i / 20) * 0.5 + 0.5; // 0..1
    const base = 5_000 + wave * 45_000;

    // Add per-point noise (+/- 20 %)
    const noise = 1 + (Math.random() - 0.5) * 0.4;
    const b = Math.round(base * noise);

    const p25 = Math.max(1_000, b);
    const p50 = p25 + rand(2_000, 8_000);
    const p75 = p50 + rand(5_000, 20_000);
    const p90 = p75 + rand(10_000, 40_000);
    const max = p90 + rand(20_000, 100_000);

    points.push({ slot, timestamp: ts, p25, p50, p75, p90, max });

    slot += rand(2, 3);
    ts += rand(380, 420);
  }

  return points;
}

// ---------------------------------------------------------------------------
// Pre-generated history (150 data points)
// ---------------------------------------------------------------------------

export const feeHistory: FeeDataPoint[] = generateFeeHistory(150);

// ---------------------------------------------------------------------------
// Strategy-based fee estimate
// ---------------------------------------------------------------------------

const STRATEGY_PERCENTILE_MAP: Record<
  'economy' | 'standard' | 'fast' | 'turbo',
  { label: string; key: keyof Omit<FeeDataPoint, 'slot' | 'timestamp'> }
> = {
  economy: { label: 'Economy', key: 'p25' },
  standard: { label: 'Standard', key: 'p50' },
  fast: { label: 'Fast', key: 'p75' },
  turbo: { label: 'Turbo', key: 'p90' },
};

/**
 * Returns a fee estimate for the given strategy, computed from the tail of
 * `feeHistory` (last 20 data points).
 */
export function getCurrentFeeEstimate(
  strategy: 'economy' | 'standard' | 'fast' | 'turbo',
): FeeEstimate {
  const window = feeHistory.slice(-20);
  const slotsSampled = window.length;

  const avg = (key: keyof Omit<FeeDataPoint, 'slot' | 'timestamp'>): number =>
    Math.round(window.reduce((s, d) => s + d[key], 0) / slotsSampled);

  const percentiles = {
    p25: avg('p25'),
    p50: avg('p50'),
    p75: avg('p75'),
    p90: avg('p90'),
    max: avg('max'),
  };

  const { label, key } = STRATEGY_PERCENTILE_MAP[strategy];

  return {
    strategy: label,
    recommendedFee: avg(key),
    slotsSampled,
    percentiles,
  };
}
