interface TipSliderProps {
  value: number
  onChange: (value: number) => void
}

const PRESETS = [
  { label: 'Min', value: 1_000 },
  { label: 'Standard', value: 10_000 },
  { label: 'Fast', value: 25_000 },
  { label: 'Max', value: 100_000 },
] as const

function tipColor(value: number): string {
  // Red at low values, yellow at mid, green at high
  const ratio = (value - 1_000) / (100_000 - 1_000)
  if (ratio < 0.33) return 'text-red-400'
  if (ratio < 0.66) return 'text-amber-400'
  return 'text-green-400'
}

export default function TipSlider({ value, onChange }: TipSliderProps) {
  const solEquivalent = value / 1e9

  return (
    <div className="space-y-3">
      {/* Label */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">
          Jito Tip
        </span>
        <span className={`text-sm font-bold tabular-nums ${tipColor(value)}`}>
          {value.toLocaleString()} lamports
        </span>
      </div>

      {/* Slider */}
      <input
        type="range"
        min={1_000}
        max={100_000}
        step={500}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer
          bg-gradient-to-r from-red-500 via-amber-500 to-green-500
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-4
          [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-sol-green
          [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(20,241,149,0.5)]
          [&::-webkit-slider-thumb]:border-2
          [&::-webkit-slider-thumb]:border-sol-dark
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-moz-range-thumb]:w-4
          [&::-moz-range-thumb]:h-4
          [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-sol-green
          [&::-moz-range-thumb]:border-2
          [&::-moz-range-thumb]:border-sol-dark
          [&::-moz-range-thumb]:cursor-pointer"
      />

      {/* SOL equivalent */}
      <div className="text-xs text-gray-500 text-right">
        {solEquivalent.toFixed(9)} SOL
      </div>

      {/* Preset buttons */}
      <div className="flex gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => onChange(preset.value)}
            className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer ${
              value === preset.value
                ? 'bg-sol-purple/20 text-sol-purple border border-sol-purple/40'
                : 'bg-white/5 text-gray-400 border border-sol-border hover:bg-white/10 hover:text-gray-300'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  )
}
