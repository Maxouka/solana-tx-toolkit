import { Check, X } from 'lucide-react'
import type { TxStatus } from '../data/mockTransactions'

interface TxTimelineProps {
  status: TxStatus
}

const STEPS = ['Sent', 'Processed', 'Confirmed', 'Finalized'] as const

/** Maps a transaction status to the zero-based step index that is "current". */
function stepIndex(status: TxStatus): number {
  switch (status) {
    case 'sent':
      return 0
    case 'processed':
      return 1
    case 'confirmed':
      return 2
    case 'finalized':
      return 3
    case 'failed':
    case 'dropped':
      return -1 // special handling
  }
}

/**
 * For failed/dropped transactions we show progress up to the last step that was
 * reached.  Since we don't track *where* it failed we assume it failed
 * at the "Processed" step (index 1) — just past "Sent".
 */
const FAILED_AT = 1

export default function TxTimeline({ status }: TxTimelineProps) {
  const isFailed = status === 'failed' || status === 'dropped'
  const currentIdx = isFailed ? FAILED_AT : stepIndex(status)

  return (
    <div className="flex items-center w-full gap-0">
      {STEPS.map((label, i) => {
        const isCompleted = !isFailed && i < currentIdx
        const isCurrent = i === currentIdx
        const isFuture = i > currentIdx

        // Connecting line (before each step except the first)
        const line = i > 0 && (
          <div
            className={`flex-1 h-0.5 mx-1 transition-colors duration-300 ${
              isFailed && i <= FAILED_AT
                ? 'bg-red-500'
                : isCompleted || isCurrent
                  ? 'bg-sol-green'
                  : 'border-t border-dashed border-gray-600 bg-transparent'
            }`}
          />
        )

        // Circle
        let circle: React.ReactNode
        if (isFailed && isCurrent) {
          circle = (
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-red-500/20 border-2 border-red-500">
              <X size={14} className="text-red-500" />
            </div>
          )
        } else if (isCompleted) {
          circle = (
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-sol-green/20 border-2 border-sol-green">
              <Check size={14} className="text-sol-green" />
            </div>
          )
        } else if (isCurrent) {
          circle = (
            <div className="relative flex items-center justify-center w-7 h-7">
              {/* Pulsing ring */}
              <span className="absolute inline-flex h-full w-full rounded-full bg-sol-purple opacity-30 animate-ping" />
              <span className="relative flex items-center justify-center w-7 h-7 rounded-full bg-sol-purple/20 border-2 border-sol-purple">
                <span className="w-2.5 h-2.5 rounded-full bg-sol-purple" />
              </span>
            </div>
          )
        } else {
          // Future
          circle = (
            <div className="flex items-center justify-center w-7 h-7 rounded-full border-2 border-gray-600 bg-transparent">
              <span className="w-2 h-2 rounded-full bg-gray-600" />
            </div>
          )
        }

        return (
          <div key={label} className="flex items-center flex-1 min-w-0" style={i === 0 ? { flex: '0 0 auto' } : undefined}>
            {line}
            <div className={`flex flex-col items-center gap-1.5 ${isFuture ? 'opacity-40' : ''}`}>
              {circle}
              <span
                className={`text-[10px] font-medium tracking-wide whitespace-nowrap ${
                  isFailed && isCurrent
                    ? 'text-red-400'
                    : isCompleted
                      ? 'text-sol-green'
                      : isCurrent
                        ? 'text-sol-purple'
                        : 'text-gray-500'
                }`}
              >
                {isFailed && isCurrent ? (status === 'dropped' ? 'Dropped' : 'Failed') : label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
