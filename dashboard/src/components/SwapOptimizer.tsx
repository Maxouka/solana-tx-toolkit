import { useState, useMemo } from 'react'
import { ArrowRightLeft, AlertTriangle } from 'lucide-react'
import TokenSelector from './TokenSelector'
import RouteVisualizer from './RouteVisualizer'
import SwapDetails from './SwapDetails'
import { TOKENS, findRoute } from '../data/mockSwaps'

export default function SwapOptimizer() {
  const [inputToken, setInputToken] = useState('SOL')
  const [outputToken, setOutputToken] = useState('USDC')
  const [amount, setAmount] = useState('1.0')
  const [priorityFee, setPriorityFee] = useState(50_000)

  const currentRoute = useMemo(
    () => findRoute(inputToken, outputToken),
    [inputToken, outputToken],
  )

  function handleSwapTokens() {
    const prevInput = inputToken
    setInputToken(outputToken)
    setOutputToken(prevInput)
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      {/* Top section: Token pair selector + amount */}
      <div className="bg-sol-card rounded-xl border border-sol-border p-5">
        <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-4 font-medium">
          Token Pair
        </h3>

        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
          {/* Input token selector */}
          <div className="flex-1 min-w-0 w-full sm:w-auto">
            <TokenSelector
              tokens={TOKENS}
              selected={inputToken}
              onChange={setInputToken}
              label="From"
            />
          </div>

          {/* Swap direction button */}
          <button
            onClick={handleSwapTokens}
            className="self-center sm:self-end p-2 rounded-lg border border-sol-border hover:border-sol-purple/50 hover:bg-sol-purple/10 transition-colors mb-0 sm:mb-1"
            title="Swap direction"
          >
            <ArrowRightLeft size={18} className="text-sol-purple" />
          </button>

          {/* Output token selector */}
          <div className="flex-1 min-w-0 w-full sm:w-auto">
            <TokenSelector
              tokens={TOKENS}
              selected={outputToken}
              onChange={setOutputToken}
              label="To"
            />
          </div>
        </div>

        {/* Amount + Priority Fee inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">
              Amount
            </span>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-sol-dark border border-sol-border rounded-lg px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-sol-purple/50 transition-colors"
              placeholder="0.00"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">
              Priority Fee (microlamports/CU)
            </span>
            <input
              type="number"
              value={priorityFee}
              onChange={(e) => setPriorityFee(Number(e.target.value))}
              className="bg-sol-dark border border-sol-border rounded-lg px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-sol-purple/50 transition-colors"
              placeholder="50000"
            />
          </div>
        </div>
      </div>

      {/* Middle section: Route visualizer */}
      {currentRoute ? (
        <>
          <RouteVisualizer route={currentRoute} />
          <SwapDetails route={currentRoute} priorityFee={priorityFee} />
        </>
      ) : (
        <div className="bg-sol-card rounded-xl border border-sol-border p-8 flex flex-col items-center justify-center gap-3">
          <AlertTriangle size={32} className="text-yellow-500 opacity-60" />
          <p className="text-gray-400 text-sm">
            No route available for{' '}
            <span className="text-white font-medium">{inputToken}</span>
            {' -> '}
            <span className="text-white font-medium">{outputToken}</span>
          </p>
          <p className="text-gray-600 text-xs">
            Try a different token pair. Available routes include SOL/USDC, SOL/JUP, USDC/BONK, WIF/SOL, JUP/USDC.
          </p>
        </div>
      )}
    </div>
  )
}
