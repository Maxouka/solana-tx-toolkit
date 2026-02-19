import { useState } from 'react'
import StrategySelector from './StrategySelector'
import FeeStats from './FeeStats'
import FeeChart from './FeeChart'
import { feeHistory, getCurrentFeeEstimate } from '../data/mockFees'

type Strategy = 'economy' | 'standard' | 'fast' | 'turbo'

export default function FeeExplorer() {
  const [strategy, setStrategy] = useState<Strategy>('fast')

  const estimate = getCurrentFeeEstimate(strategy)

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* Top row: strategy selector + stats */}
      <div className="flex flex-col gap-4">
        <StrategySelector selected={strategy} onChange={(s) => setStrategy(s as Strategy)} />
        <FeeStats estimate={estimate} />
      </div>

      {/* Bottom: fee chart */}
      <FeeChart data={feeHistory} selectedStrategy={strategy} />
    </div>
  )
}
