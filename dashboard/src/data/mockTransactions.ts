// ---------------------------------------------------------------------------
// Mock Transaction Monitor Data
// ---------------------------------------------------------------------------

export type TxStatus = 'sent' | 'processed' | 'confirmed' | 'finalized' | 'failed' | 'dropped';

export type Transaction = {
  signature: string;
  status: TxStatus;
  slot: number;
  fee: number;
  computeUnits: number;
  timestamp: number;
  programIds: string[];
  confirmationTime: number;
};

export type TxEvent = {
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
};

function randomBase58(len: number): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const PROGRAM_IDS = [
  { id: '11111111111111111111111111111111', label: 'System Program' },
  { id: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', label: 'Token Program' },
  { id: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4', label: 'Jupiter v6' },
  { id: 'jitoBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', label: 'Jito Tip' },
  { id: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc', label: 'Orca Whirlpool' },
  { id: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8', label: 'Raydium AMM' },
];

const STATUS_SEQUENCE: TxStatus[] = ['sent', 'processed', 'confirmed', 'finalized'];

function generateTransaction(index: number): Transaction {
  const statuses: TxStatus[] = ['finalized', 'finalized', 'finalized', 'confirmed', 'confirmed', 'processed', 'sent', 'failed', 'dropped'];
  const status = statuses[index % statuses.length];
  const progCount = rand(1, 3);
  const selectedPrograms = Array.from(
    { length: progCount },
    () => PROGRAM_IDS[rand(0, PROGRAM_IDS.length - 1)].id,
  );

  return {
    signature: randomBase58(88),
    status,
    slot: 310_000_000 + rand(0, 500_000),
    fee: rand(5_000, 200_000),
    computeUnits: rand(50_000, 1_400_000),
    timestamp: Date.now() - rand(5_000, 600_000),
    programIds: [...new Set(selectedPrograms)],
    confirmationTime: status === 'failed' || status === 'dropped' ? 0 : rand(100, 2000),
  };
}

export const transactions: Transaction[] = Array.from({ length: 15 }, (_, i) => generateTransaction(i)).sort(
  (a, b) => b.timestamp - a.timestamp,
);

const EVENT_TEMPLATES: Array<{ level: TxEvent['level']; template: string }> = [
  { level: 'info', template: 'TX {sig} submitted to cluster' },
  { level: 'info', template: 'TX {sig} status: processed (slot {slot})' },
  { level: 'success', template: 'TX {sig} status: confirmed (slot {slot})' },
  { level: 'success', template: 'TX {sig} status: finalized (slot {slot})' },
  { level: 'warn', template: 'TX {sig} retry #2 — blockhash expiring' },
  { level: 'error', template: 'TX {sig} DROPPED — blockhash expired after 150 slots' },
  { level: 'info', template: 'WebSocket connected to mainnet-beta' },
  { level: 'info', template: 'Slot {slot}: {tps} TPS, {validators} active validators' },
  { level: 'warn', template: 'Network congestion detected — elevating priority fee to p75' },
  { level: 'success', template: 'Bundle landed in slot {slot} — 3 txs confirmed' },
];

export function generateEventLog(count: number): TxEvent[] {
  const events: TxEvent[] = [];
  let ts = Date.now() - count * 1500;

  for (let i = 0; i < count; i++) {
    const template = EVENT_TEMPLATES[i % EVENT_TEMPLATES.length];
    const sig = randomBase58(8) + '...';
    const slot = (310_000_000 + rand(0, 500_000)).toString();
    const tps = rand(2000, 4500).toString();
    const validators = rand(1800, 2200).toString();

    const message = template.template
      .replace('{sig}', sig)
      .replace('{slot}', slot)
      .replace('{tps}', tps)
      .replace('{validators}', validators);

    events.push({ timestamp: ts, level: template.level, message });
    ts += rand(800, 2500);
  }

  return events;
}

export const initialEventLog: TxEvent[] = generateEventLog(25);

export function getStatusColor(status: TxStatus): string {
  switch (status) {
    case 'sent': return '#facc15';
    case 'processed': return '#3b82f6';
    case 'confirmed': return '#9945FF';
    case 'finalized': return '#14F195';
    case 'failed': return '#ef4444';
    case 'dropped': return '#6b7280';
  }
}

export function getStatusStep(status: TxStatus): number {
  return STATUS_SEQUENCE.indexOf(status);
}

export { STATUS_SEQUENCE };
