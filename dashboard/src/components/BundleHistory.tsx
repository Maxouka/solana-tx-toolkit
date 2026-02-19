import type { Bundle } from '../data/mockBundles'

interface BundleHistoryProps {
  bundles: Bundle[]
}

const statusColors: Record<Bundle['status'], string> = {
  building: 'bg-yellow-500/20 text-yellow-400',
  submitted: 'bg-purple-500/20 text-purple-400',
  landed: 'bg-green-500/20 text-green-400',
  accepted: 'bg-blue-500/20 text-blue-400',
  expired: 'bg-amber-500/20 text-amber-400',
  rejected: 'bg-red-500/20 text-red-400',
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function BundleHistory({ bundles }: BundleHistoryProps) {
  return (
    <div className="max-h-[520px] overflow-auto pr-1 space-y-1.5">
      {bundles.map((bundle, idx) => (
        <div
          key={bundle.bundleId}
          className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
            idx % 2 === 0 ? 'bg-white/[0.02]' : 'bg-white/[0.05]'
          }`}
        >
          {/* Left: ID + status */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-gray-400 font-mono shrink-0">
              {bundle.bundleId.slice(0, 8)}...
            </span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide shrink-0 ${
                statusColors[bundle.status]
              }`}
            >
              {bundle.status}
            </span>
          </div>

          {/* Right: tx count, tip, slot, time */}
          <div className="flex items-center gap-3 text-gray-500 shrink-0 ml-2">
            <span>{bundle.txCount} txs</span>
            <span className="text-gray-400">
              {(bundle.tipLamports / 1e9).toFixed(6)} SOL
            </span>
            <span className="w-24 text-right tabular-nums">
              {bundle.slot ? `#${bundle.slot.toLocaleString()}` : '--'}
            </span>
            <span className="w-14 text-right text-gray-600">
              {timeAgo(bundle.timestamp)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
