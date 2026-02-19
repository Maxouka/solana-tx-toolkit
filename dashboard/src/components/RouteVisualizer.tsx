import type { SwapRoute, RouteHop } from '../data/mockSwaps'

function getDexColor(dex: string): string {
  const colors: Record<string, string> = {
    Raydium: '#5ac4be',
    Orca: '#ffb347',
    Phoenix: '#ff6b6b',
    Lifinity: '#a78bfa',
    Meteora: '#38bdf8',
  }
  return colors[dex] ?? '#9945FF'
}

function formatAmount(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`
  return num.toFixed(num < 1 ? 4 : 2)
}

interface RouteVisualizerProps {
  route: SwapRoute
}

/**
 * Group route hops by their inputToken to detect split routes (same input
 * going to multiple DEXes in parallel) vs sequential hops.
 */
function groupHops(hops: RouteHop[]): RouteHop[][] {
  const groups: RouteHop[][] = []
  let currentGroup: RouteHop[] = []
  let currentInput: string | null = null

  for (const hop of hops) {
    if (currentInput === null || hop.inputToken === currentInput) {
      currentGroup.push(hop)
      currentInput = hop.inputToken
    } else {
      groups.push(currentGroup)
      currentGroup = [hop]
      currentInput = hop.inputToken
    }
  }
  if (currentGroup.length > 0) groups.push(currentGroup)
  return groups
}

export default function RouteVisualizer({ route }: RouteVisualizerProps) {
  const groups = groupHops(route.hops)
  const inAmt = formatAmount(route.inputAmount)
  const outAmt = formatAmount(route.outputAmount)

  return (
    <div className="bg-sol-card rounded-xl border border-sol-border p-6 overflow-hidden">
      <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-5 font-medium">Route Path</h3>

      <div className="flex items-center gap-0 min-h-[120px]">
        {/* Input token */}
        <div className="flex flex-col items-center gap-1 shrink-0 min-w-[80px]">
          <span className="text-3xl">{route.inputToken.logo}</span>
          <span className="text-white font-semibold text-sm">{route.inputToken.symbol}</span>
          <span className="text-sol-green text-xs font-mono">{inAmt}</span>
        </div>

        {/* Route hops */}
        <div className="flex items-center flex-1 min-w-0">
          {groups.map((group, gi) => (
            <div key={gi} className="flex items-center flex-1">
              {/* Connecting line before */}
              <div className="flex-1 min-w-[24px]">
                <div className="route-line h-[2px] w-full" />
              </div>

              {/* DEX nodes for this group */}
              <div className="flex flex-col items-center gap-2 shrink-0">
                {group.map((hop, si) => (
                  <div
                    key={si}
                    className="flex items-center gap-2 rounded-full px-3 py-1.5 border"
                    style={{
                      borderColor: getDexColor(hop.dex),
                      backgroundColor: `${getDexColor(hop.dex)}15`,
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: getDexColor(hop.dex) }}
                    />
                    <span className="text-xs font-medium text-white whitespace-nowrap">
                      {hop.dex}
                    </span>
                    {hop.percentage < 100 && (
                      <span
                        className="text-[10px] font-mono opacity-70"
                        style={{ color: getDexColor(hop.dex) }}
                      >
                        {hop.percentage}%
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Connecting line after (only if not last group) */}
              {gi < groups.length - 1 && (
                <div className="flex-1 min-w-[24px]">
                  <div className="route-line h-[2px] w-full" />
                </div>
              )}
            </div>
          ))}

          {/* Final connecting line */}
          <div className="flex-1 min-w-[24px]">
            <div className="route-line h-[2px] w-full" />
          </div>
        </div>

        {/* Output token */}
        <div className="flex flex-col items-center gap-1 shrink-0 min-w-[80px]">
          <span className="text-3xl">{route.outputToken.logo}</span>
          <span className="text-white font-semibold text-sm">{route.outputToken.symbol}</span>
          <span className="text-sol-green text-xs font-mono">{outAmt}</span>
        </div>
      </div>

      {/* Hop count label */}
      <div className="mt-4 text-center">
        <span className="text-[10px] text-gray-600 uppercase tracking-widest">
          {route.hops.length} hop{route.hops.length !== 1 ? 's' : ''} via{' '}
          {[...new Set(route.hops.map((h) => h.dex))].join(', ')}
        </span>
      </div>

      {/* Inline style for animated dashed line */}
      <style>{`
        .route-line {
          background: repeating-linear-gradient(
            90deg,
            #9945FF 0px,
            #9945FF 6px,
            transparent 6px,
            transparent 12px
          );
          background-size: 200% 100%;
          animation: dashFlow 1.5s linear infinite;
        }
        @keyframes dashFlow {
          0% { background-position: 0% 0; }
          100% { background-position: -24px 0; }
        }
      `}</style>
    </div>
  )
}
