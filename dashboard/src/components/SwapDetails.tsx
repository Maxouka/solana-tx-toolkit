import type { SwapRoute } from '../data/mockSwaps'

interface SwapDetailsProps {
  route: SwapRoute
  priorityFee: number
}

function impactColor(pct: number): string {
  if (pct < 0.1) return 'text-sol-green'
  if (pct < 1) return 'text-yellow-400'
  return 'text-red-400'
}

function formatNum(num: number, maxDecimals: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(4)}M`
  if (num >= 1_000) return num.toLocaleString('en-US', { maximumFractionDigits: 4 })
  return num.toFixed(Math.min(maxDecimals, 6))
}

export default function SwapDetails({ route, priorityFee }: SwapDetailsProps) {
  const impact = route.priceImpact
  const slippagePct = route.slippage.toFixed(2)
  const estimatedCost = (priorityFee * 200_000 / 1e9).toFixed(6)
  const uniqueDexes = [...new Set(route.hops.map((h) => h.dex))]
  const hopCount = route.hops.length

  const rows: { label: string; value: React.ReactNode }[] = [
    {
      label: 'Price Impact',
      value: (
        <span className={`font-mono ${impactColor(impact)}`}>
          {impact.toFixed(2)}%
        </span>
      ),
    },
    {
      label: 'Minimum Received',
      value: (
        <span className="text-white font-mono">
          {formatNum(route.minimumReceived, route.outputToken.decimals)}
          {' '}{route.outputToken.symbol}
        </span>
      ),
    },
    {
      label: 'Expected Output',
      value: (
        <span className="text-white font-mono">
          {formatNum(route.outputAmount, route.outputToken.decimals)} {route.outputToken.symbol}
        </span>
      ),
    },
    {
      label: 'Slippage Tolerance',
      value: <span className="text-white font-mono">{slippagePct}%</span>,
    },
    {
      label: 'Priority Fee',
      value: (
        <span className="text-white font-mono">
          {priorityFee.toLocaleString()} <span className="text-gray-500 text-xs">microlamports/CU</span>
        </span>
      ),
    },
    {
      label: 'Estimated Cost',
      value: (
        <span className="text-sol-green font-mono">
          {estimatedCost} SOL
        </span>
      ),
    },
    {
      label: 'Route',
      value: (
        <span className="text-white">
          via {uniqueDexes.join(', ')}{' '}
          <span className="text-gray-500">
            ({hopCount} hop{hopCount !== 1 ? 's' : ''})
          </span>
        </span>
      ),
    },
  ]

  return (
    <div className="bg-sol-card rounded-xl border border-sol-border p-5">
      <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-4 font-medium">Swap Details</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-4 py-1">
            <span className="text-gray-400 text-sm shrink-0">{row.label}</span>
            <span className="text-sm text-right">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
