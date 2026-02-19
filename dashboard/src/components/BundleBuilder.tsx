import { useState, useMemo } from 'react'
import { Layers, Plus, CheckCircle2 } from 'lucide-react'
import { bundleHistory } from '../data/mockBundles'
import TipSlider from './TipSlider'
import BundleTimeline from './BundleTimeline'
import BundleHistory from './BundleHistory'

type TxType = 'SOL Transfer' | 'Token Swap' | 'Stake' | 'Unstake' | 'Custom'

interface TxSlot {
  id: number
  type: TxType
  amount: number
}

const TX_TYPES: TxType[] = ['SOL Transfer', 'Token Swap', 'Stake', 'Unstake', 'Custom']

const MAX_TRANSACTIONS = 5

function randomAmount(): number {
  return parseFloat((Math.random() * 2 + 0.01).toFixed(4))
}

function randomType(): TxType {
  return TX_TYPES[Math.floor(Math.random() * TX_TYPES.length)]
}

export default function BundleBuilder() {
  const [transactions, setTransactions] = useState<TxSlot[]>([
    { id: 1, type: randomType(), amount: randomAmount() },
  ])
  const [tipValue, setTipValue] = useState(10_000)
  const [timelineActive, setTimelineActive] = useState(false)

  const sortedBundles = useMemo(
    () => [...bundleHistory].sort((a, b) => b.timestamp - a.timestamp),
    []
  )

  const canAdd = transactions.length < MAX_TRANSACTIONS

  function addTransaction() {
    if (!canAdd) return
    setTransactions((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        type: randomType(),
        amount: randomAmount(),
      },
    ])
  }

  function handleSubmit() {
    setTimelineActive(false)
    // Small delay to reset before re-triggering
    setTimeout(() => setTimelineActive(true), 50)
  }

  return (
    <div className="flex gap-6 h-full">
      {/* ── Left Panel: Build Bundle (60%) ── */}
      <div className="w-[60%] flex flex-col gap-5">
        <div className="bg-sol-card rounded-xl border border-sol-border p-5">
          <h2 className="text-white text-sm font-bold tracking-tight mb-4 flex items-center gap-2">
            <Layers size={16} className="text-sol-purple" />
            Build Bundle
          </h2>

          {/* Transaction slots */}
          <div className="space-y-2 mb-4">
            {transactions.map((tx, idx) => (
              <div
                key={tx.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-sol-border"
              >
                {/* Number */}
                <span className="text-sol-purple font-bold text-xs w-6 shrink-0">
                  #{idx + 1}
                </span>

                {/* Type dropdown (display only) */}
                <select
                  value={tx.type}
                  disabled
                  className="bg-transparent text-gray-300 text-xs font-medium border-none outline-none appearance-none cursor-default flex-1 min-w-0"
                >
                  {TX_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>

                {/* Amount */}
                <span className="text-gray-400 text-xs tabular-nums shrink-0">
                  {tx.amount} SOL
                </span>

                {/* Status icon */}
                <CheckCircle2 size={14} className="text-sol-green shrink-0" />
              </div>
            ))}
          </div>

          {/* Add Transaction button */}
          <button
            onClick={addTransaction}
            disabled={!canAdd}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer mb-5 ${
              canAdd
                ? 'bg-white/5 text-gray-300 border border-dashed border-sol-border hover:bg-white/10 hover:text-white'
                : 'bg-white/[0.02] text-gray-600 border border-sol-border cursor-not-allowed'
            }`}
          >
            {canAdd ? (
              <>
                <Plus size={14} />
                Add Transaction ({transactions.length}/{MAX_TRANSACTIONS})
              </>
            ) : (
              <span>{MAX_TRANSACTIONS}/{MAX_TRANSACTIONS} MAX</span>
            )}
          </button>

          {/* Tip Slider */}
          <TipSlider value={tipValue} onChange={setTipValue} />

          {/* Submit Bundle button */}
          <button
            onClick={handleSubmit}
            className="mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white cursor-pointer
              bg-gradient-to-r from-sol-purple to-purple-600
              hover:from-purple-600 hover:to-sol-purple
              shadow-[0_0_20px_rgba(153,69,255,0.3)]
              hover:shadow-[0_0_30px_rgba(153,69,255,0.5)]
              transition-all duration-200 active:scale-[0.98]"
          >
            <Layers size={16} />
            Submit Bundle
          </button>

          {/* Bundle Timeline */}
          <BundleTimeline active={timelineActive} />
        </div>
      </div>

      {/* ── Right Panel: Recent Bundles (40%) ── */}
      <div className="w-[40%] flex flex-col">
        <div className="bg-sol-card rounded-xl border border-sol-border p-5 flex-1 flex flex-col">
          <h2 className="text-white text-sm font-bold tracking-tight mb-4">
            Recent Bundles
          </h2>
          <div className="flex-1 min-h-0">
            <BundleHistory bundles={sortedBundles} />
          </div>
        </div>
      </div>
    </div>
  )
}
