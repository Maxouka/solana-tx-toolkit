import { useState, useEffect, useCallback } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { FeeDataPoint } from '../data/mockFees'
import { generateFeeHistory } from '../data/mockFees'

interface FeeChartProps {
  data: FeeDataPoint[]
  selectedStrategy: string
}

const STRATEGY_TO_KEY: Record<string, string> = {
  economy: 'p25',
  standard: 'p50',
  fast: 'p75',
  turbo: 'p90',
}

const PERCENTILE_COLORS: Record<string, string> = {
  p25: '#6b7280',
  p50: '#3b82f6',
  p75: '#9945FF',
  p90: '#14F195',
}

const PERCENTILE_LABELS: Record<string, string> = {
  p25: 'P25 (Economy)',
  p50: 'P50 (Standard)',
  p75: 'P75 (Fast)',
  p90: 'P90 (Turbo)',
}

function formatSlot(slot: number): string {
  const millions = slot / 1_000_000
  return `${millions.toFixed(1)}M`
}

function formatFee(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`
  return String(value)
}

interface TooltipPayloadEntry {
  dataKey: string
  value: number
  color: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadEntry[]
  label?: number
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !label) return null

  return (
    <div className="bg-[#12122a] border border-sol-border rounded-lg px-4 py-3 shadow-xl">
      <p className="text-xs text-gray-400 mb-2 font-medium">Slot {label.toLocaleString()}</p>
      <div className="flex flex-col gap-1">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-gray-400">
                {PERCENTILE_LABELS[entry.dataKey] ?? entry.dataKey}
              </span>
            </div>
            <span className="text-xs text-white font-semibold tabular-nums">
              {entry.value.toLocaleString()} &mu;L/CU
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function FeeChart({ data: initialData, selectedStrategy }: FeeChartProps) {
  const [chartData, setChartData] = useState<FeeDataPoint[]>(initialData)

  // Keep data in sync when initialData changes from parent
  useEffect(() => {
    setChartData(initialData)
  }, [initialData])

  // Live update: append a new point every 2 seconds
  const addPoint = useCallback(() => {
    setChartData((prev) => {
      const newPoints = generateFeeHistory(1)
      const lastSlot = prev[prev.length - 1]?.slot ?? 310_000_000
      // Ensure the new point has a slot after the last one
      const adjusted = newPoints.map((pt) => ({
        ...pt,
        slot: lastSlot + Math.floor(Math.random() * 2) + 2,
      }))
      const updated = [...prev, ...adjusted]
      // Keep only the last 150 points
      if (updated.length > 150) {
        return updated.slice(updated.length - 150)
      }
      return updated
    })
  }, [])

  useEffect(() => {
    const interval = setInterval(addPoint, 2000)
    return () => clearInterval(interval)
  }, [addPoint])

  const activeKey = STRATEGY_TO_KEY[selectedStrategy] ?? 'p75'

  // Build area configs with opacity based on selection
  const areas = [
    { key: 'p25', color: PERCENTILE_COLORS.p25 },
    { key: 'p50', color: PERCENTILE_COLORS.p50 },
    { key: 'p75', color: PERCENTILE_COLORS.p75 },
    { key: 'p90', color: PERCENTILE_COLORS.p90 },
  ]

  return (
    <div className="bg-sol-card rounded-xl border border-sol-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Fee Percentiles Over Time</h3>
        <div className="flex items-center gap-4">
          {areas.map(({ key, color }) => (
            <div key={key} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color, opacity: key === activeKey ? 1 : 0.4 }}
              />
              <span
                className="text-[11px] font-medium"
                style={{ color: key === activeKey ? color : '#6b7280' }}
              >
                {key.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              {areas.map(({ key, color }) => (
                <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={color}
                    stopOpacity={key === activeKey ? 0.3 : 0.05}
                  />
                  <stop
                    offset="100%"
                    stopColor={color}
                    stopOpacity={0}
                  />
                </linearGradient>
              ))}
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#222222"
              strokeOpacity={0.6}
              vertical={false}
            />

            <XAxis
              dataKey="slot"
              tickFormatter={formatSlot}
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={{ stroke: '#222222' }}
              tickLine={false}
              interval={Math.max(0, Math.floor(chartData.length / 7) - 1)}
            />

            <YAxis
              tickFormatter={formatFee}
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={50}
            />

            <Tooltip content={<CustomTooltip />} />

            {areas.map(({ key, color }) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={color}
                strokeWidth={key === activeKey ? 2.5 : 1}
                strokeOpacity={key === activeKey ? 1 : 0.3}
                fill={`url(#grad-${key})`}
                fillOpacity={1}
                animationDuration={800}
                dot={false}
                activeDot={key === activeKey ? { r: 4, fill: color, stroke: '#0a0a0a', strokeWidth: 2 } : false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
