import { useState, useEffect, useCallback } from 'react'
import { Search, Radio, RefreshCw, Clock, Cpu, Coins, FileText } from 'lucide-react'
import { transactions as mockTxs } from '../data/mockTransactions'
import type { Transaction, TxStatus } from '../data/mockTransactions'
import TxTable, { getProgramLabel } from './TxTable'
import TxTimeline from './TxTimeline'
import TxEventLog from './TxEventLog'

type MonitorMode = 'websocket' | 'polling'

const STATUS_SEQUENCE: TxStatus[] = ['sent', 'processed', 'confirmed', 'finalized']

function advanceStatus(tx: Transaction): Transaction {
  const idx = STATUS_SEQUENCE.indexOf(tx.status)
  if (idx < 0 || idx >= STATUS_SEQUENCE.length - 1) return tx
  return { ...tx, status: STATUS_SEQUENCE[idx + 1] }
}

function formatFee(lamports: number): string {
  return (lamports / 1e9).toFixed(6)
}

function formatCU(cu: number): string {
  if (cu >= 1_000_000) return (cu / 1_000_000).toFixed(1) + 'M'
  if (cu >= 1_000) return (cu / 1_000).toFixed(0) + 'K'
  return cu.toString()
}

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

export default function TransactionMonitor() {
  const [txList, setTxList] = useState<Transaction[]>(() => [...mockTxs])
  const [selectedSig, setSelectedSig] = useState<string>(mockTxs[0]?.signature ?? '')
  const [monitorMode, setMonitorMode] = useState<MonitorMode>('websocket')
  const [searchValue, setSearchValue] = useState('')

  // Auto-advance a random sent/processed/confirmed transaction every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTxList((prev) => {
        const advanceable = prev.filter(
          (tx) => tx.status === 'sent' || tx.status === 'processed' || tx.status === 'confirmed',
        )
        if (advanceable.length === 0) return prev

        const target = advanceable[Math.floor(Math.random() * advanceable.length)]
        return prev.map((tx) =>
          tx.signature === target.signature ? advanceStatus(tx) : tx,
        )
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const handleSelect = useCallback((sig: string) => {
    setSelectedSig(sig)
  }, [])

  // Resolve selected transaction
  const selectedTx = txList.find((tx) => tx.signature === selectedSig) ?? txList[0]

  // Filter transactions based on search
  const displayTxs = searchValue.trim()
    ? txList.filter(
        (tx) =>
          tx.signature.toLowerCase().includes(searchValue.toLowerCase()) ||
          getProgramLabel(tx.programIds).toLowerCase().includes(searchValue.toLowerCase()),
      )
    : txList

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Top bar: Search + Monitor mode toggle */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Paste transaction signature to search..."
            className="w-full pl-9 pr-4 py-2 bg-sol-card border border-sol-border rounded-lg text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-sol-purple/50 transition-colors"
          />
        </div>

        {/* Monitor mode toggle */}
        <div className="flex items-center gap-1 p-1 bg-sol-card border border-sol-border rounded-lg">
          <button
            onClick={() => setMonitorMode('websocket')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              monitorMode === 'websocket'
                ? 'bg-sol-purple/20 text-sol-purple'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Radio size={13} />
            WebSocket
          </button>
          <button
            onClick={() => setMonitorMode('polling')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              monitorMode === 'polling'
                ? 'bg-sol-purple/20 text-sol-purple'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <RefreshCw size={13} />
            Polling
          </button>
        </div>
      </div>

      {/* Main content: Table (60%) + Details (40%) */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left: Transaction table */}
        <div className="w-[60%] min-w-0 overflow-auto">
          <TxTable
            transactions={displayTxs}
            selectedSig={selectedSig}
            onSelect={handleSelect}
          />
        </div>

        {/* Right: Selected transaction details */}
        <div className="w-[40%] min-w-0 flex flex-col gap-4">
          {selectedTx ? (
            <>
              {/* Detail card */}
              <div className="rounded-lg border border-sol-border bg-sol-card p-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white text-sm font-semibold">Transaction Details</h3>
                  <span className="text-[10px] text-gray-500 font-mono">
                    {selectedTx.signature.slice(0, 12)}...
                  </span>
                </div>

                {/* Timeline */}
                <div className="py-2">
                  <TxTimeline status={selectedTx.status} />
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-3">
                  <InfoItem
                    icon={<FileText size={14} />}
                    label="Program"
                    value={getProgramLabel(selectedTx.programIds)}
                  />
                  <InfoItem
                    icon={<Clock size={14} />}
                    label="Time"
                    value={formatTimestamp(selectedTx.timestamp)}
                  />
                  <InfoItem
                    icon={<Coins size={14} />}
                    label="Fee"
                    value={`${formatFee(selectedTx.fee)} SOL`}
                  />
                  <InfoItem
                    icon={<Cpu size={14} />}
                    label="Compute Units"
                    value={formatCU(selectedTx.computeUnits)}
                  />
                </div>

                {/* Slot */}
                <div className="flex items-center justify-between px-3 py-2 bg-[#0d1117] rounded-md">
                  <span className="text-xs text-gray-500">Slot</span>
                  <span className="text-xs text-gray-300 font-mono tabular-nums">
                    {selectedTx.slot.toLocaleString()}
                  </span>
                </div>

                {/* Confirmation time */}
                {selectedTx.confirmationTime > 0 && (
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Confirmed in {selectedTx.confirmationTime}ms
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
              Select a transaction to view details
            </div>
          )}
        </div>
      </div>

      {/* Bottom: Event log */}
      <TxEventLog transactions={txList} />
    </div>
  )
}

/** Small info-item used in the detail card grid. */
function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2 px-3 py-2 bg-[#0d1117] rounded-md">
      <span className="text-gray-500 mt-0.5">{icon}</span>
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</span>
        <span className="text-xs text-gray-300 truncate">{value}</span>
      </div>
    </div>
  )
}
