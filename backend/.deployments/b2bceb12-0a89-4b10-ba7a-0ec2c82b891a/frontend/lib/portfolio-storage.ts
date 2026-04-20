// Portfolio storage utility for localStorage persistence
import type { Token } from "./types"

export interface PortfolioHolding {
  tokenId: string
  tokenSymbol: string
  tokenName: string
  tokenImage: string
  amount: number
  avgBuyPrice: number
  totalInvested: number
  purchasedAt: string
}

export interface Transaction {
  id: string
  type: "buy" | "sell" | "stake" | "unstake"
  tokenId: string
  tokenSymbol: string
  tokenName: string
  amount: number
  price: number
  totalAda: number
  txHash: string
  timestamp: string
  status: "pending" | "confirmed" | "failed"
}

export interface StakedPosition {
  id: string
  tokenId: string
  tokenSymbol: string
  tokenName: string
  amount: number
  stakeDuration: number // days
  startDate: string
  endDate: string
  apy: number
  estimatedRewards: number
  status: "active" | "completed" | "withdrawn"
}

const PORTFOLIO_KEY = "miso_portfolio"
const TRANSACTIONS_KEY = "miso_transactions"
const STAKING_KEY = "miso_staking"

/**
 * Get portfolio holdings from localStorage
 */
export function getPortfolio(): PortfolioHolding[] {
  if (typeof window === "undefined") return []
  
  try {
    const stored = localStorage.getItem(PORTFOLIO_KEY)
    if (!stored) return []
    return JSON.parse(stored)
  } catch (error) {
    console.error("Error reading portfolio:", error)
    return []
  }
}

/**
 * Add tokens to portfolio after a buy
 */
export function addToPortfolio(
  token: Token,
  amount: number,
  pricePerToken: number,
  txHash: string
): PortfolioHolding {
  const portfolio = getPortfolio()
  const existingIndex = portfolio.findIndex(h => h.tokenId === token.id)
  
  let holding: PortfolioHolding
  
  if (existingIndex >= 0) {
    // Update existing holding with weighted average
    const existing = portfolio[existingIndex]
    const totalAmount = existing.amount + amount
    const totalInvested = existing.totalInvested + (amount * pricePerToken)
    
    holding = {
      ...existing,
      amount: totalAmount,
      avgBuyPrice: totalInvested / totalAmount,
      totalInvested,
    }
    portfolio[existingIndex] = holding
  } else {
    // Create new holding
    holding = {
      tokenId: token.id,
      tokenSymbol: token.symbol,
      tokenName: token.name,
      tokenImage: token.image,
      amount,
      avgBuyPrice: pricePerToken,
      totalInvested: amount * pricePerToken,
      purchasedAt: new Date().toISOString(),
    }
    portfolio.push(holding)
  }
  
  // Record transaction
  addTransaction({
    type: "buy",
    tokenId: token.id,
    tokenSymbol: token.symbol,
    tokenName: token.name,
    amount,
    price: pricePerToken,
    totalAda: amount * pricePerToken,
    txHash,
  })
  
  try {
    localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(portfolio))
  } catch (error) {
    console.error("Error saving portfolio:", error)
  }
  
  return holding
}

/**
 * Remove tokens from portfolio after a sell
 */
export function removeFromPortfolio(
  token: Token,
  amount: number,
  pricePerToken: number,
  txHash: string
): PortfolioHolding | null {
  const portfolio = getPortfolio()
  const existingIndex = portfolio.findIndex(h => h.tokenId === token.id)
  
  if (existingIndex < 0) return null
  
  const existing = portfolio[existingIndex]
  const newAmount = existing.amount - amount
  
  // Record transaction
  addTransaction({
    type: "sell",
    tokenId: token.id,
    tokenSymbol: token.symbol,
    tokenName: token.name,
    amount,
    price: pricePerToken,
    totalAda: amount * pricePerToken,
    txHash,
  })
  
  if (newAmount <= 0) {
    // Remove holding entirely
    portfolio.splice(existingIndex, 1)
    try {
      localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(portfolio))
    } catch (error) {
      console.error("Error saving portfolio:", error)
    }
    return null
  }
  
  // Update holding
  const holding: PortfolioHolding = {
    ...existing,
    amount: newAmount,
    totalInvested: existing.avgBuyPrice * newAmount, // Keep avg buy price
  }
  portfolio[existingIndex] = holding
  
  try {
    localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(portfolio))
  } catch (error) {
    console.error("Error saving portfolio:", error)
  }
  
  return holding
}

/**
 * Get holding for a specific token
 */
export function getHolding(tokenId: string): PortfolioHolding | null {
  const portfolio = getPortfolio()
  return portfolio.find(h => h.tokenId === tokenId) || null
}

/**
 * Get total portfolio value (requires current prices)
 */
export function getPortfolioValue(currentPrices: Record<string, number>): number {
  const portfolio = getPortfolio()
  return portfolio.reduce((total, holding) => {
    const price = currentPrices[holding.tokenId] || holding.avgBuyPrice
    return total + (holding.amount * price)
  }, 0)
}

// --- Transactions ---

/**
 * Get all transactions
 */
export function getTransactions(): Transaction[] {
  if (typeof window === "undefined") return []
  
  try {
    const stored = localStorage.getItem(TRANSACTIONS_KEY)
    if (!stored) return []
    return JSON.parse(stored)
  } catch (error) {
    console.error("Error reading transactions:", error)
    return []
  }
}

/**
 * Add a new transaction
 */
export function addTransaction(tx: Omit<Transaction, "id" | "timestamp" | "status">): Transaction {
  const transactions = getTransactions()
  
  const newTx: Transaction = {
    ...tx,
    id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    status: "confirmed", // Simplified - assume confirmed
  }
  
  transactions.unshift(newTx) // Add to beginning
  
  // Keep only last 100 transactions
  if (transactions.length > 100) {
    transactions.pop()
  }
  
  try {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions))
  } catch (error) {
    console.error("Error saving transaction:", error)
  }
  
  return newTx
}

/**
 * Get transactions for a specific token
 */
export function getTokenTransactions(tokenId: string): Transaction[] {
  return getTransactions().filter(tx => tx.tokenId === tokenId)
}

// --- Staking ---

/**
 * Get all staked positions
 */
export function getStakedPositions(): StakedPosition[] {
  if (typeof window === "undefined") return []
  
  try {
    const stored = localStorage.getItem(STAKING_KEY)
    if (!stored) return []
    return JSON.parse(stored)
  } catch (error) {
    console.error("Error reading staking:", error)
    return []
  }
}

/**
 * Stake tokens
 */
export function stakeTokens(
  token: Token,
  amount: number,
  durationDays: number,
  apy: number = 8
): StakedPosition | null {
  const portfolio = getPortfolio()
  const holdingIndex = portfolio.findIndex(h => h.tokenId === token.id)
  
  if (holdingIndex < 0 || portfolio[holdingIndex].amount < amount) {
    return null // Insufficient balance
  }
  
  // Deduct from portfolio
  portfolio[holdingIndex].amount -= amount
  if (portfolio[holdingIndex].amount <= 0) {
    portfolio.splice(holdingIndex, 1)
  }
  
  // Create staked position
  const startDate = new Date()
  const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000)
  const estimatedRewards = amount * (apy / 100) * (durationDays / 365)
  
  const position: StakedPosition = {
    id: `stake_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    tokenId: token.id,
    tokenSymbol: token.symbol,
    tokenName: token.name,
    amount,
    stakeDuration: durationDays,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    apy,
    estimatedRewards,
    status: "active",
  }
  
  const staking = getStakedPositions()
  staking.push(position)
  
  // Record transaction
  addTransaction({
    type: "stake",
    tokenId: token.id,
    tokenSymbol: token.symbol,
    tokenName: token.name,
    amount,
    price: token.price,
    totalAda: 0, // No ADA moved
    txHash: `stake_${position.id}`,
  })
  
  try {
    localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(portfolio))
    localStorage.setItem(STAKING_KEY, JSON.stringify(staking))
  } catch (error) {
    console.error("Error saving stake:", error)
    return null
  }
  
  return position
}

/**
 * Unstake tokens (withdraw)
 */
export function unstakeTokens(positionId: string): StakedPosition | null {
  const staking = getStakedPositions()
  const index = staking.findIndex(p => p.id === positionId)
  
  if (index < 0) return null
  
  const position = staking[index]
  position.status = "withdrawn"
  
  // Add back to portfolio (with rewards if completed)
  const portfolio = getPortfolio()
  const holdingIndex = portfolio.findIndex(h => h.tokenId === position.tokenId)
  
  const now = new Date()
  const endDate = new Date(position.endDate)
  const isCompleted = now >= endDate
  const totalReturn = position.amount + (isCompleted ? position.estimatedRewards : 0)
  
  if (holdingIndex >= 0) {
    portfolio[holdingIndex].amount += totalReturn
  } else {
    portfolio.push({
      tokenId: position.tokenId,
      tokenSymbol: position.tokenSymbol,
      tokenName: position.tokenName,
      tokenImage: "", // Will need to be fetched
      amount: totalReturn,
      avgBuyPrice: 0,
      totalInvested: 0,
      purchasedAt: new Date().toISOString(),
    })
  }
  
  // Record transaction
  addTransaction({
    type: "unstake",
    tokenId: position.tokenId,
    tokenSymbol: position.tokenSymbol,
    tokenName: position.tokenName,
    amount: totalReturn,
    price: 0,
    totalAda: 0,
    txHash: `unstake_${positionId}`,
  })
  
  // Remove from staking
  staking.splice(index, 1)
  
  try {
    localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(portfolio))
    localStorage.setItem(STAKING_KEY, JSON.stringify(staking))
  } catch (error) {
    console.error("Error unstaking:", error)
    return null
  }
  
  return position
}

/**
 * Get active staked positions
 */
export function getActiveStakes(): StakedPosition[] {
  return getStakedPositions().filter(p => p.status === "active")
}

/**
 * Get total staked value for a token
 */
export function getStakedAmount(tokenId: string): number {
  return getActiveStakes()
    .filter(p => p.tokenId === tokenId)
    .reduce((total, p) => total + p.amount, 0)
}

/**
 * Clear all portfolio data (for testing)
 */
export function clearPortfolio(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(PORTFOLIO_KEY)
  localStorage.removeItem(TRANSACTIONS_KEY)
  localStorage.removeItem(STAKING_KEY)
}
