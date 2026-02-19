import type { Tab } from '../types'

interface HeaderProps {
  activeTab: Tab
}

const tabTitles: Record<Tab, string> = {
  fees: 'Priority Fees',
  bundles: 'Bundle Tracker',
  swap: 'Swap Router',
  monitor: 'TX Monitor',
}

export default function Header({ activeTab }: HeaderProps) {
  return (
    <header className="h-14 min-h-[56px] flex items-center justify-between px-6 bg-[#0d0d1a]/80 backdrop-blur-xl border-b border-sol-border">
      {/* Left: Tab title */}
      <h2 className="text-white text-base font-semibold tracking-tight">
        {tabTitles[activeTab]}
      </h2>

      {/* Right section */}
      <div className="flex items-center gap-5">
        {/* Live indicator */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sol-green opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-sol-green" />
          </span>
          <span className="text-xs text-gray-400 font-medium">Live</span>
        </div>

        {/* Wallet badge */}
        <div className="flex items-center px-3 py-1.5 rounded-full border border-sol-purple/40 bg-sol-purple/5">
          <span className="text-xs text-gray-300 font-medium tracking-tight">
            7xK2...9fD3
          </span>
        </div>
      </div>
    </header>
  )
}
