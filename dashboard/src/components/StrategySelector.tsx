import { DollarSign, Equal, Zap, Rocket } from 'lucide-react'

interface StrategySelectorProps {
  selected: string
  onChange: (strategy: string) => void
}

const strategies = [
  { key: 'economy', label: 'Economy', percentile: 'p25', icon: DollarSign },
  { key: 'standard', label: 'Standard', percentile: 'p50', icon: Equal },
  { key: 'fast', label: 'Fast', percentile: 'p75', icon: Zap },
  { key: 'turbo', label: 'Turbo', percentile: 'p90', icon: Rocket },
] as const

export default function StrategySelector({ selected, onChange }: StrategySelectorProps) {
  return (
    <div className="flex flex-row gap-2">
      {strategies.map(({ key, label, percentile, icon: Icon }) => {
        const isActive = selected === key
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
              transition-all duration-200 border cursor-pointer
              ${isActive
                ? 'bg-sol-purple/20 text-sol-purple border-sol-purple shadow-[0_0_12px_rgba(153,69,255,0.25)]'
                : 'bg-sol-card text-gray-500 border-sol-border hover:text-gray-300 hover:bg-white/5'
              }
            `}
          >
            <Icon size={16} />
            <span>{label}</span>
            <span className={`text-xs ${isActive ? 'text-sol-purple/70' : 'text-gray-600'}`}>
              ({percentile})
            </span>
          </button>
        )
      })}
    </div>
  )
}
