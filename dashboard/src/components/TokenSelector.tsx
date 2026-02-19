import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import type { Token } from '../data/mockSwaps'

interface TokenSelectorProps {
  tokens: Token[]
  selected: string
  onChange: (symbol: string) => void
  label: string
}

function truncateMint(mint: string): string {
  return `${mint.slice(0, 4)}...${mint.slice(-4)}`
}

export default function TokenSelector({ tokens, selected, onChange, label }: TokenSelectorProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = tokens.find((t) => t.symbol === selected)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="flex flex-col gap-1.5" ref={ref}>
      <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">{label}</span>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 bg-sol-card border border-sol-border rounded-lg px-4 py-3 hover:border-sol-purple/50 transition-colors cursor-pointer w-full"
      >
        {current && (
          <>
            <span className="text-xl">{current.logo}</span>
            <div className="flex flex-col items-start flex-1 min-w-0">
              <span className="text-white font-semibold text-sm">{current.symbol}</span>
              <span className="text-gray-500 text-xs truncate">{current.name}</span>
            </div>
          </>
        )}
        <ChevronDown
          size={16}
          className={`text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="relative z-50">
          <div className="absolute top-0 left-0 right-0 bg-sol-card border border-sol-border rounded-lg shadow-xl max-h-64 overflow-y-auto">
            {tokens.map((token) => {
              const isSelected = token.symbol === selected
              return (
                <button
                  key={token.symbol}
                  onClick={() => {
                    onChange(token.symbol)
                    setOpen(false)
                  }}
                  className={`flex items-center gap-3 w-full px-4 py-2.5 hover:bg-white/5 transition-colors text-left ${
                    isSelected ? 'bg-sol-purple/10 border-l-2 border-l-sol-purple' : 'border-l-2 border-l-transparent'
                  }`}
                >
                  <span className="text-lg">{token.logo}</span>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className={`text-sm font-medium ${isSelected ? 'text-sol-purple' : 'text-white'}`}>
                      {token.symbol}
                    </span>
                    <span className="text-xs text-gray-500">{token.name}</span>
                  </div>
                  <span className="text-[10px] text-gray-600 font-mono">{truncateMint(token.mint)}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
