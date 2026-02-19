import { useState, useEffect, useRef } from 'react'
import type { Transaction, TxStatus } from '../data/mockTransactions'

interface TxEventLogProps {
  transactions: Transaction[]
}

interface LogEntry {
  id: number
  time: string
  level: 'OK' | 'INFO' | 'WARN' | 'FAIL'
  message: string
}

const LEVEL_COLORS: Record<LogEntry['level'], string> = {
  OK: 'text-sol-green',
  INFO: 'text-sol-purple',
  WARN: 'text-yellow-400',
  FAIL: 'text-red-400',
}

function truncateSig(sig: string): string {
  return sig.slice(0, 8) + '...' + sig.slice(-4)
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleTimeString('en-US', { hour12: false })
}

function levelForStatus(status: TxStatus): LogEntry['level'] {
  switch (status) {
    case 'finalized':
      return 'OK'
    case 'confirmed':
    case 'processed':
      return 'INFO'
    case 'sent':
      return 'WARN'
    case 'failed':
    case 'dropped':
      return 'FAIL'
  }
}

export default function TxEventLog({ transactions }: TxEventLogProps) {
  const [entries, setEntries] = useState<LogEntry[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const entryIdRef = useRef(0)
  const txRef = useRef(transactions)

  // Keep txRef current without resetting the effect
  useEffect(() => { txRef.current = transactions }, [transactions])

  function buildLogEntry(tx: Transaction): LogEntry {
    const level = levelForStatus(tx.status)
    const sig = truncateSig(tx.signature)
    const slotStr = `slot: ${tx.slot.toLocaleString()}`
    return {
      id: ++entryIdRef.current,
      time: formatTime(Date.now()),
      level,
      message: `TX ${sig} — status: ${tx.status} (${slotStr})`,
    }
  }

  // Add a new log entry every 1.5 seconds
  useEffect(() => {
    if (txRef.current.length === 0) return

    // Seed with a couple of entries
    const initial = [
      buildLogEntry(txRef.current[0]),
      buildLogEntry(txRef.current[Math.min(1, txRef.current.length - 1)]),
    ]
    setEntries(initial)

    const interval = setInterval(() => {
      const list = txRef.current
      const randomTx = list[Math.floor(Math.random() * list.length)]
      setEntries((prev) => {
        const next = [...prev, buildLogEntry(randomTx)]
        if (next.length > 100) return next.slice(-100)
        return next
      })
    }, 1500)

    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    const el = scrollRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [entries])

  return (
    <div className="flex flex-col rounded-lg border border-sol-border overflow-hidden">
      {/* Terminal header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#161b22] border-b border-sol-border">
        <span className="w-3 h-3 rounded-full bg-red-500" />
        <span className="w-3 h-3 rounded-full bg-yellow-500" />
        <span className="w-3 h-3 rounded-full bg-green-500" />
        <span className="ml-2 text-xs text-gray-500 font-mono">tx-monitor.log</span>
      </div>

      {/* Log body */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="bg-[#0d1117] px-3 py-2 font-mono text-xs leading-relaxed max-h-48 overflow-auto"
        >
          {entries.map((e) => (
            <div key={e.id} className="whitespace-nowrap">
              <span className="text-gray-500">[{e.time}]</span>{' '}
              <span className={LEVEL_COLORS[e.level]}>[{e.level.padEnd(4)}]</span>{' '}
              <span className="text-gray-300">{e.message}</span>
            </div>
          ))}
          {entries.length === 0 && (
            <span className="text-gray-600">Waiting for transactions...</span>
          )}
        </div>

        {/* Gradient fade at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[#0d1117] to-transparent pointer-events-none" />
      </div>
    </div>
  )
}
