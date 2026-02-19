import { useState, useEffect } from 'react'
import { Activity, Layers, ArrowLeftRight, Search, Target } from 'lucide-react'
import type { Tab } from '../types'

interface SidebarProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

const navItems: { key: Tab; label: string; icon: typeof Activity }[] = [
  { key: 'fees', label: 'Priority Fees', icon: Activity },
  { key: 'bundles', label: 'Bundles', icon: Layers },
  { key: 'swap', label: 'Swap Router', icon: ArrowLeftRight },
  { key: 'monitor', label: 'TX Monitor', icon: Search },
  { key: 'whyme', label: 'Why Me', icon: Target },
]

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [tps, setTps] = useState(3241)

  useEffect(() => {
    const interval = setInterval(() => {
      setTps((prev) => {
        const delta = Math.floor(Math.random() * 61) - 30 // -30 to +30
        const next = prev + delta
        if (next < 2000) return 2000
        if (next > 4000) return 4000
        return next
      })
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <aside className="relative w-[220px] min-w-[220px] h-screen flex flex-col bg-[#0d0d1a] border-r border-sol-border">
      {/* Subtle right-edge gradient overlay */}
      <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-sol-purple/20 via-transparent to-sol-green/10 pointer-events-none" />

      {/* Logo area */}
      <div className="px-5 py-5 flex items-center gap-3">
        <span className="text-sol-purple text-2xl font-bold leading-none select-none">&#9678;</span>
        <div className="flex flex-col">
          <span className="text-white text-sm font-bold tracking-tight leading-tight">TX Toolkit</span>
          <span className="text-gray-500 text-[10px] tracking-widest uppercase leading-tight">Solana</span>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-sol-border" />

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 px-3 py-4">
        {navItems.map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key
          return (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              className={`
                relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-200 group cursor-pointer
                ${isActive
                  ? 'bg-sol-purple/10 text-white'
                  : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
                }
              `}
            >
              {/* Active indicator bar */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-sol-purple" />
              )}

              <Icon
                size={18}
                className={`shrink-0 transition-colors duration-200 ${
                  isActive ? 'text-sol-purple' : 'text-gray-600 group-hover:text-gray-400'
                }`}
              />
              <span>{label}</span>
            </button>
          )
        })}
      </nav>

      {/* Network status */}
      <div className="px-5 py-4 border-t border-sol-border">
        <div className="flex items-center gap-2 mb-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sol-green opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-sol-green" />
          </span>
          <span className="text-xs text-gray-400 font-medium">Mainnet-beta</span>
        </div>
        <div className="flex items-center gap-1.5 pl-4">
          <span className="text-[11px] text-gray-600">TPS:</span>
          <span className="text-[11px] text-gray-400 font-semibold tabular-nums">
            {tps.toLocaleString()}
          </span>
        </div>
      </div>
    </aside>
  )
}
