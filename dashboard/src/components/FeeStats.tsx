import type { FeeEstimate } from '../data/mockFees'

interface FeeStatsProps {
  estimate: FeeEstimate
}

export default function FeeStats({ estimate }: FeeStatsProps) {
  const networkLoad = Math.round((estimate.percentiles.p75 / estimate.percentiles.max) * 100)
  const estimatedCost = (estimate.recommendedFee * 200_000 / 1e9).toFixed(6)

  const loadColor =
    networkLoad >= 80
      ? 'text-red-400'
      : networkLoad >= 50
        ? 'text-yellow-400'
        : 'text-sol-green'

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Recommended Fee */}
      <div className="bg-sol-card/80 backdrop-blur-sm rounded-xl p-4 border border-sol-border">
        <span className="text-xs text-gray-500 font-medium">Recommended Fee</span>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-sol-green tabular-nums">
            {estimate.recommendedFee.toLocaleString()}
          </span>
          <span className="text-xs text-gray-600">&mu;L/CU</span>
        </div>
      </div>

      {/* Slots Sampled */}
      <div className="bg-sol-card/80 backdrop-blur-sm rounded-xl p-4 border border-sol-border">
        <span className="text-xs text-gray-500 font-medium">Slots Sampled</span>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-white tabular-nums">
            {estimate.slotsSampled}
          </span>
          <span className="text-xs text-gray-600">slots</span>
        </div>
      </div>

      {/* Network Load */}
      <div className="bg-sol-card/80 backdrop-blur-sm rounded-xl p-4 border border-sol-border">
        <span className="text-xs text-gray-500 font-medium">Network Load</span>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className={`text-2xl font-bold tabular-nums ${loadColor}`}>
            {networkLoad}%
          </span>
        </div>
      </div>

      {/* Estimated Cost */}
      <div className="bg-sol-card/80 backdrop-blur-sm rounded-xl p-4 border border-sol-border">
        <span className="text-xs text-gray-500 font-medium">Estimated Cost</span>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-white tabular-nums">
            {estimatedCost}
          </span>
          <span className="text-xs text-gray-600">SOL</span>
        </div>
      </div>
    </div>
  )
}
