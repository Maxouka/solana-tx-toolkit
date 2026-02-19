// ---------------------------------------------------------------------------
// Mock Jito Bundle Data
// ---------------------------------------------------------------------------

export type BundleStatus = 'building' | 'submitted' | 'accepted' | 'landed' | 'rejected' | 'expired';

export type Bundle = {
  bundleId: string;
  status: BundleStatus;
  txCount: number;
  tipLamports: number;
  slot: number | null;
  timestamp: number;
  transactions: BundleTransaction[];
};

export type BundleTransaction = {
  type: 'transfer' | 'swap' | 'stake';
  amount: number;
  label: string;
};

export const JITO_TIP_ACCOUNTS = [
  '96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5',
  'HFqU5x63VTqvQss8hp11i4bVqkfRtQ7NmXwkiYKpAMDo',
  'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY',
  'ADaUMid9yfUC67HyGMNFkRSNBddMv4kanQwpLMBTWHDe',
  'DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh',
  'ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt',
  'DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL',
  '3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT',
];

function randomHex(len: number): string {
  const chars = '0123456789abcdef';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * 16)];
  return s;
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const TX_TYPES: BundleTransaction['type'][] = ['transfer', 'swap', 'stake'];
const TX_LABELS: Record<BundleTransaction['type'], string[]> = {
  transfer: ['SOL Transfer', 'Token Transfer', 'Multi-send'],
  swap: ['SOL → USDC', 'JUP → SOL', 'BONK → USDC'],
  stake: ['Stake SOL', 'Delegate Stake', 'Merge Stakes'],
};

function generateBundle(index: number): Bundle {
  const statusOptions: BundleStatus[] = ['landed', 'landed', 'landed', 'accepted', 'rejected', 'expired'];
  const status = statusOptions[index % statusOptions.length];
  const txCount = rand(2, 5);
  const transactions: BundleTransaction[] = Array.from({ length: txCount }, () => {
    const type = TX_TYPES[rand(0, 2)];
    return {
      type,
      amount: rand(100_000, 5_000_000_000),
      label: TX_LABELS[type][rand(0, TX_LABELS[type].length - 1)],
    };
  });

  return {
    bundleId: randomHex(64),
    status,
    txCount,
    tipLamports: rand(1_000, 100_000),
    slot: status === 'landed' || status === 'accepted' ? 310_000_000 + rand(0, 500_000) : null,
    timestamp: Date.now() - rand(60_000, 3_600_000),
    transactions,
  };
}

export const bundleHistory: Bundle[] = Array.from({ length: 20 }, (_, i) => generateBundle(i)).sort(
  (a, b) => b.timestamp - a.timestamp,
);

export function getStatusColor(status: BundleStatus): string {
  switch (status) {
    case 'building': return '#facc15';
    case 'submitted': return '#9945FF';
    case 'accepted': return '#3b82f6';
    case 'landed': return '#14F195';
    case 'rejected': return '#ef4444';
    case 'expired': return '#6b7280';
  }
}
