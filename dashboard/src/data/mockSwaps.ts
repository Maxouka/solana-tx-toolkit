// ---------------------------------------------------------------------------
// Mock Jupiter Swap Data
// ---------------------------------------------------------------------------

export type Token = {
  symbol: string;
  name: string;
  mint: string;
  decimals: number;
  logo: string;
  price: number;
};

export type RouteHop = {
  dex: string;
  dexColor: string;
  inputToken: string;
  outputToken: string;
  percentage: number;
};

export type SwapRoute = {
  inputToken: Token;
  outputToken: Token;
  inputAmount: number;
  outputAmount: number;
  priceImpact: number;
  hops: RouteHop[];
  minimumReceived: number;
  priorityFee: number;
  slippage: number;
};

export const TOKENS: Token[] = [
  { symbol: 'SOL', name: 'Solana', mint: 'So11111111111111111111111111111111111111112', decimals: 9, logo: 'S', price: 148.50 },
  { symbol: 'USDC', name: 'USD Coin', mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6, logo: '$', price: 1.00 },
  { symbol: 'USDT', name: 'Tether', mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', decimals: 6, logo: 'T', price: 1.00 },
  { symbol: 'JUP', name: 'Jupiter', mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', decimals: 6, logo: 'J', price: 0.82 },
  { symbol: 'BONK', name: 'Bonk', mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', decimals: 5, logo: 'B', price: 0.000018 },
  { symbol: 'WIF', name: 'dogwifhat', mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', decimals: 6, logo: 'W', price: 1.05 },
  { symbol: 'JTO', name: 'Jito', mint: 'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL', decimals: 9, logo: 'J', price: 2.95 },
  { symbol: 'PYTH', name: 'Pyth Network', mint: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwRbHJEi6dYG', decimals: 6, logo: 'P', price: 0.35 },
  { symbol: 'RAY', name: 'Raydium', mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', decimals: 6, logo: 'R', price: 1.88 },
];

export const DEX_LIST = [
  { name: 'Raydium', color: '#5ac4be' },
  { name: 'Orca', color: '#ffb347' },
  { name: 'Phoenix', color: '#ff6b6b' },
  { name: 'Lifinity', color: '#a78bfa' },
  { name: 'Meteora', color: '#38bdf8' },
];

export const SAMPLE_ROUTES: SwapRoute[] = [
  {
    inputToken: TOKENS[0],
    outputToken: TOKENS[1],
    inputAmount: 10,
    outputAmount: 1482.30,
    priceImpact: 0.05,
    hops: [
      { dex: 'Raydium', dexColor: '#5ac4be', inputToken: 'SOL', outputToken: 'USDC', percentage: 60 },
      { dex: 'Orca', dexColor: '#ffb347', inputToken: 'SOL', outputToken: 'USDC', percentage: 40 },
    ],
    minimumReceived: 1474.89,
    priorityFee: 15_000,
    slippage: 0.5,
  },
  {
    inputToken: TOKENS[0],
    outputToken: TOKENS[3],
    inputAmount: 5,
    outputAmount: 905.48,
    priceImpact: 0.12,
    hops: [
      { dex: 'Raydium', dexColor: '#5ac4be', inputToken: 'SOL', outputToken: 'USDC', percentage: 100 },
      { dex: 'Orca', dexColor: '#ffb347', inputToken: 'USDC', outputToken: 'JUP', percentage: 70 },
      { dex: 'Phoenix', dexColor: '#ff6b6b', inputToken: 'USDC', outputToken: 'JUP', percentage: 30 },
    ],
    minimumReceived: 900.95,
    priorityFee: 20_000,
    slippage: 0.5,
  },
  {
    inputToken: TOKENS[4],
    outputToken: TOKENS[0],
    inputAmount: 10_000_000,
    outputAmount: 1.21,
    priceImpact: 0.85,
    hops: [
      { dex: 'Raydium', dexColor: '#5ac4be', inputToken: 'BONK', outputToken: 'SOL', percentage: 50 },
      { dex: 'Orca', dexColor: '#ffb347', inputToken: 'BONK', outputToken: 'SOL', percentage: 30 },
      { dex: 'Meteora', dexColor: '#38bdf8', inputToken: 'BONK', outputToken: 'SOL', percentage: 20 },
    ],
    minimumReceived: 1.20,
    priorityFee: 25_000,
    slippage: 1.0,
  },
  {
    inputToken: TOKENS[5],
    outputToken: TOKENS[1],
    inputAmount: 500,
    outputAmount: 524.50,
    priceImpact: 0.32,
    hops: [
      { dex: 'Raydium', dexColor: '#5ac4be', inputToken: 'WIF', outputToken: 'SOL', percentage: 100 },
      { dex: 'Lifinity', dexColor: '#a78bfa', inputToken: 'SOL', outputToken: 'USDC', percentage: 55 },
      { dex: 'Phoenix', dexColor: '#ff6b6b', inputToken: 'SOL', outputToken: 'USDC', percentage: 45 },
    ],
    minimumReceived: 521.87,
    priorityFee: 18_000,
    slippage: 0.5,
  },
];

export function findRoute(input: string, output: string): SwapRoute | null {
  return SAMPLE_ROUTES.find(
    (r) => r.inputToken.symbol === input && r.outputToken.symbol === output,
  ) ?? null;
}
