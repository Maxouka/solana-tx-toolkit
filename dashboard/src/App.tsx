import { useState } from 'react'
import type { Tab } from './types'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import StatusBar from './components/StatusBar'
import FeeExplorer from './components/FeeExplorer'
import BundleBuilder from './components/BundleBuilder'
import SwapOptimizer from './components/SwapOptimizer'
import TransactionMonitor from './components/TransactionMonitor'
import WhyMe from './components/WhyMe'

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('fees')

  return (
    <div className="h-screen flex bg-sol-dark overflow-hidden">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header activeTab={activeTab} />

        {/* Tab content */}
        <main className="flex-1 overflow-auto p-6">
          {activeTab === 'fees' && <FeeExplorer />}
          {activeTab === 'bundles' && <BundleBuilder />}
          {activeTab === 'swap' && <SwapOptimizer />}
          {activeTab === 'monitor' && <TransactionMonitor />}
          {activeTab === 'whyme' && <WhyMe onNavigate={setActiveTab} />}
        </main>

        <StatusBar />
      </div>
    </div>
  )
}
