// Token storage utility for localStorage persistence
import type { Token } from "./types"

// CreatedToken extends Token with additional creation metadata
export interface CreatedToken extends Token {
  initialPrice: number
  initialLiquidity: number
}

const STORAGE_KEY = "miso_created_tokens"

/**
 * Get all created tokens from localStorage
 */
export function getCreatedTokens(): CreatedToken[] {
  if (typeof window === "undefined") return []
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored)
  } catch (error) {
    console.error("Error reading created tokens:", error)
    return []
  }
}

/**
 * Get tokens created by a specific creator (by ZKP ID or address)
 */
export function getTokensByCreator(creatorId: string): CreatedToken[] {
  const allTokens = getCreatedTokens()
  return allTokens.filter(token => token.creatorAddress === creatorId)
}

/**
 * Save a new token to localStorage
 */
export function saveCreatedToken(tokenData: {
  name: string
  symbol: string
  description: string
  image: string
  curveType: "linear" | "exponential" | "sigmoid"
  initialPrice: number
  creatorFee: number
  initialLiquidity: number
  creatorAddress: string
}): CreatedToken {
  const tokens = getCreatedTokens()
  
  // Generate a unique ID
  const id = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  const newToken: CreatedToken = {
    id,
    name: tokenData.name,
    symbol: tokenData.symbol,
    description: tokenData.description,
    image: tokenData.image,
    curveType: tokenData.curveType,
    creatorFee: tokenData.creatorFee,
    creatorAddress: tokenData.creatorAddress,
    initialPrice: tokenData.initialPrice,
    initialLiquidity: tokenData.initialLiquidity,
    createdAt: new Date().toISOString(),
    // Initialize with simulated trading data
    price: tokenData.initialPrice,
    priceChange24h: 0,
    marketCap: tokenData.initialPrice * 1000000, // Simulated initial market cap
    volume24h: 0,
    holders: 1, // Creator is first holder
    totalSupply: 1000000, // Initial supply
    reserveAda: tokenData.initialLiquidity,
    // Trust and Influence scores (start with base values, increase with activity)
    trustScore: Math.floor(Math.random() * 20) + 50, // Start between 50-70
    influenceScore: Math.floor(Math.random() * 15) + 30, // Start between 30-45
  }
  
  tokens.unshift(newToken) // Add to beginning
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens))
  } catch (error) {
    console.error("Error saving token:", error)
  }
  
  return newToken
}

/**
 * Get a specific token by ID
 */
export function getTokenById(id: string): CreatedToken | null {
  const tokens = getCreatedTokens()
  return tokens.find(token => token.id === id) || null
}

/**
 * Update a token's data (e.g., for simulated trading updates)
 */
export function updateToken(id: string, updates: Partial<CreatedToken>): CreatedToken | null {
  const tokens = getCreatedTokens()
  const index = tokens.findIndex(token => token.id === id)
  
  if (index === -1) return null
  
  tokens[index] = { ...tokens[index], ...updates }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens))
  } catch (error) {
    console.error("Error updating token:", error)
  }
  
  return tokens[index]
}

/**
 * Delete a token by ID
 */
export function deleteToken(id: string): boolean {
  const tokens = getCreatedTokens()
  const filtered = tokens.filter(token => token.id !== id)
  
  if (filtered.length === tokens.length) return false
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return true
  } catch (error) {
    console.error("Error deleting token:", error)
    return false
  }
}

/**
 * Clear all created tokens (useful for testing)
 */
export function clearAllTokens(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * Get total count of created tokens
 */
export function getTokenCount(): number {
  return getCreatedTokens().length
}
