import { useState, useEffect, useRef } from 'react'
import { Loader2, CheckCircle2 } from 'lucide-react'

interface BundleTimelineProps {
  active: boolean
}

interface Step {
  label: string
  dotColor: string
  icon: 'spin' | 'check' | 'dot'
}

const STEPS: Step[] = [
  { label: 'Building bundle...', dotColor: 'bg-yellow-400', icon: 'spin' },
  { label: 'Submitted to Jito block engine', dotColor: 'bg-purple-500', icon: 'dot' },
  { label: 'Accepted by validator', dotColor: 'bg-blue-500', icon: 'dot' },
  { label: 'Landed in slot #310,482,917', dotColor: 'bg-green-400', icon: 'check' },
]

export default function BundleTimeline({ active }: BundleTimelineProps) {
  const [visibleSteps, setVisibleSteps] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)
  const timeoutsRef = useRef<number[]>([])

  useEffect(() => {
    // Clear existing timeouts
    timeoutsRef.current.forEach((t) => clearTimeout(t))
    timeoutsRef.current = []

    if (!active) {
      setVisibleSteps(0)
      setShowSuccess(false)
      return
    }

    // Animate steps one by one
    for (let i = 0; i < STEPS.length; i++) {
      const t = window.setTimeout(() => {
        setVisibleSteps(i + 1)
      }, i * 800)
      timeoutsRef.current.push(t)
    }

    // Show success message after all steps
    const successTimeout = window.setTimeout(() => {
      setShowSuccess(true)
    }, STEPS.length * 800 + 400)
    timeoutsRef.current.push(successTimeout)

    return () => {
      timeoutsRef.current.forEach((t) => clearTimeout(t))
      timeoutsRef.current = []
    }
  }, [active])

  if (!active) return null

  return (
    <div className="mt-4 p-4 rounded-xl bg-white/[0.03] border border-sol-border">
      <div className="relative pl-6">
        {/* Connecting line */}
        <div
          className="absolute left-[9px] top-2 w-0.5 bg-gradient-to-b from-yellow-400 via-purple-500 to-green-400 transition-all duration-500 ease-out"
          style={{
            height: visibleSteps > 1 ? `${(visibleSteps - 1) * 40}px` : '0px',
          }}
        />

        {/* Steps */}
        {STEPS.map((step, idx) => {
          const visible = idx < visibleSteps
          const isLast = idx === STEPS.length - 1
          const isCurrent = idx === visibleSteps - 1

          return (
            <div
              key={idx}
              className={`relative flex items-center gap-3 h-10 transition-all duration-500 ease-out ${
                visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
              }`}
            >
              {/* Dot */}
              <div
                className={`absolute -left-6 top-1/2 -translate-y-1/2 w-[18px] h-[18px] rounded-full border-2 border-sol-dark flex items-center justify-center ${
                  step.dotColor
                } ${isLast && visible ? 'shadow-[0_0_12px_rgba(20,241,149,0.6)]' : ''}`}
              >
                {step.icon === 'spin' && isCurrent && (
                  <Loader2 size={10} className="text-sol-dark animate-spin" />
                )}
                {step.icon === 'check' && visible && (
                  <CheckCircle2 size={10} className="text-sol-dark" />
                )}
              </div>

              {/* Label */}
              <span
                className={`text-sm ${
                  isCurrent ? 'text-white font-medium' : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Success message */}
      {showSuccess && (
        <div className="mt-4 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-bold animate-pulse">
            <CheckCircle2 size={16} />
            Bundle Landed!
          </span>
        </div>
      )}
    </div>
  )
}
