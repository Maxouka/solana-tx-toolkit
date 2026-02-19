import type { Transaction, TxStatus } from '../data/mockTransactions'

interface TxTableProps {
  transactions: Transaction[]
  selectedSig: string
  onSelect: (sig: string) => void
}

const STATUS_BADGE: Record<TxStatus, string> = {
  sent: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  processed: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  confirmed: 'bg-sol-purple/15 text-sol-purple border-sol-purple/30',
  finalized: 'bg-sol-green/15 text-sol-green border-sol-green/30',
  failed: 'bg-red-500/15 text-red-400 border-red-500/30',
  dropped: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
}

const PROGRAM_LABELS: Record<string, string> = {
  '11111111111111111111111111111111': 'System',
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA': 'Token',
  'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4': 'Jupiter',
  'jitoBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB': 'Jito',
  'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc': 'Orca',
  '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8': 'Raydium',
}

export function getProgramLabel(programIds: string[]): string {
  for (const id of programIds) {
    const label = PROGRAM_LABELS[id]
    if (label && label !== 'System') return label
  }
  return PROGRAM_LABELS[programIds[0]] ?? programIds[0].slice(0, 8) + '...'
}

function truncateSig(sig: string): string {
  return sig.slice(0, 8) + '...' + sig.slice(-4)
}

function formatFee(lamports: number): string {
  return (lamports / 1e9).toFixed(6)
}

function formatCU(cu: number): string {
  if (cu >= 1_000_000) return (cu / 1_000_000).toFixed(1) + 'M'
  if (cu >= 1_000) return (cu / 1_000).toFixed(0) + 'K'
  return cu.toString()
}

function relativeTime(ts: number): string {
  const diffSec = Math.floor((Date.now() - ts) / 1000)
  if (diffSec < 60) return `${diffSec}s ago`
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
  return `${Math.floor(diffSec / 3600)}h ago`
}

export default function TxTable({ transactions, selectedSig, onSelect }: TxTableProps) {
  // Sort by timestamp newest first
  const sorted = [...transactions].sort((a, b) => b.timestamp - a.timestamp)

  return (
    <div className="overflow-auto rounded-lg border border-sol-border">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="bg-[#0d0d1a] text-gray-500 text-xs uppercase tracking-wider">
            <th className="px-3 py-2.5 font-medium">Signature</th>
            <th className="px-3 py-2.5 font-medium">Status</th>
            <th className="px-3 py-2.5 font-medium">Program</th>
            <th className="px-3 py-2.5 font-medium text-right">Fee (SOL)</th>
            <th className="px-3 py-2.5 font-medium text-right">CU</th>
            <th className="px-3 py-2.5 font-medium text-right">Time</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((tx, i) => {
            const isSelected = tx.signature === selectedSig
            const rowBg = isSelected
              ? 'bg-sol-purple/10'
              : i % 2 === 0
                ? 'bg-sol-card/40'
                : 'bg-transparent'

            return (
              <tr
                key={tx.signature}
                onClick={() => onSelect(tx.signature)}
                className={`${rowBg} cursor-pointer hover:bg-sol-purple/5 transition-colors border-b border-sol-border/50 last:border-b-0`}
              >
                <td className="px-3 py-2 font-mono text-xs text-gray-300">
                  {truncateSig(tx.signature)}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium border capitalize ${STATUS_BADGE[tx.status]}`}
                  >
                    {tx.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-gray-400 whitespace-nowrap">{getProgramLabel(tx.programIds)}</td>
                <td className="px-3 py-2 text-gray-400 font-mono text-xs text-right tabular-nums">
                  {formatFee(tx.fee)}
                </td>
                <td className="px-3 py-2 text-gray-400 font-mono text-xs text-right tabular-nums">
                  {formatCU(tx.computeUnits)}
                </td>
                <td className="px-3 py-2 text-gray-500 text-xs text-right whitespace-nowrap">
                  {relativeTime(tx.timestamp)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
