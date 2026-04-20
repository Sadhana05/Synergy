export interface Token {
  id: string
  name: string
  symbol: string
  image: string
  price: number
  priceChange24h: number
  volume24h: number
  marketCap: number
  holders: number
  curveType: "linear" | "exponential" | "sigmoid"
  creatorFee: number
  totalSupply: number
  reserveAda: number
  createdAt: string
  creatorAddress: string
  description?: string
  trustScore: number       // 0-100 score based on token activity and creator reputation
  influenceScore: number   // 0-100 score based on social reach and trading impact
}

export interface Trade {
  id: string
  tokenId: string
  type: "buy" | "sell"
  amount: number
  price: number
  totalAda: number
  trader: string
  timestamp: string
}

export interface Battle {
  id: string
  name: string
  status: "upcoming" | "active" | "ended"
  startTime: string
  endTime: string
  prizePool: number
  participants: BattleParticipant[]
  rules: string[]
}

export interface BattleParticipant {
  tokenId: string
  token: Token
  score: number
  rank: number
  volume: number
  buyCount: number
  newHolders: number
}

export interface PortfolioHolding {
  token: Token
  amount: number
  avgBuyPrice: number
  currentValue: number
  pnl: number
  pnlPercent: number
}

export interface CreatorStats {
  totalEarnings: number
  totalVolume: number
  totalHolders: number
  tokensCreated: number
  pendingWithdrawal: number
}

export interface WalletState {
  connected: boolean
  address: string | null
  balance: number
  network: "mainnet" | "preview"
}

export interface Category {
  id: string
  name: string
  icon: string
  tokenCount: number
  volume24h: number
}
