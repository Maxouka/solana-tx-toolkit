import { useState, useEffect } from 'react'

export default function StatusBar() {
  const [slot, setSlot] = useState(310_482_117)

  useEffect(() => {
    const interval = setInterval(() => {
      setSlot((prev) => prev + 1)
    }, 400)
    return () => clearInterval(interval)
  }, [])

  return (
    <footer className="h-8 min-h-[32px] flex items-center justify-between px-6 bg-[#0d0d1a] border-t border-sol-border text-[11px] text-gray-500 select-none">
      {/* Left: Slot */}
      <span className="tabular-nums">
        Slot: {slot.toLocaleString()}
      </span>

      {/* Center: Block time */}
      <span>Block time: 0.4s</span>

      {/* Right: Network */}
      <div className="flex items-center gap-1.5">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-sol-green" />
        <span>Solana Mainnet</span>
      </div>
    </footer>
  )
}
