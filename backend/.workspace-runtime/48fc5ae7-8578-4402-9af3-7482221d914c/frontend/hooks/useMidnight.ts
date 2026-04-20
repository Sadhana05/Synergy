'use client'
import { useEffect, useState, useCallback, useRef } from "react"
import type { DAppConnectorWalletAPI, DAppConnectorWalletState, ServiceUriConfig } from "@midnight-ntwrk/dapp-connector-api"
// Import to get the global Window type augmentation
import "@midnight-ntwrk/dapp-connector-api"

type WalletState = {
  connected: boolean
  address: string | null
  balance: number
  network: string
  coinPublicKey?: string | null
  encryptionPublicKey?: string | null
}

// GraphQL query to get balance from the indexer
const BALANCE_QUERY = `
  query GetBalance($address: String!) {
    coins(where: { address: { _eq: $address } }) {
      value
    }
  }
`

// Alternative query format for Midnight indexer
const COINS_BY_ADDRESS_QUERY = `
  query CoinsByAddress($coinPublicKey: String!) {
    coins(where: { coinPublicKey: { _eq: $coinPublicKey }, spent: { _is_null: true } }) {
      value
      tokenType
    }
  }
`

// Provide a hook with the same surface area the app expects (wallet, connect, etc.)
export function useMidnight() {
  const [api, setApi] = useState<DAppConnectorWalletAPI | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const apiRef = useRef<DAppConnectorWalletAPI | null>(null)
  const serviceConfigRef = useRef<ServiceUriConfig | null>(null)

  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    address: null,
    balance: 0,
    network: "midnight-testnet",
    coinPublicKey: null,
    encryptionPublicKey: null,
  })

  const [availableWallets, setAvailableWallets] = useState<string[]>([])

  // Helper function to fetch balance from indexer
  const fetchBalanceFromIndexer = useCallback(async (coinPublicKey: string, address?: string): Promise<number> => {
    try {
      // Get service config from wallet
      if (!window.midnight?.mnLace) {
        console.log("[Balance] No wallet available")
        return 0
      }
      
      const serviceConfig = await window.midnight.mnLace.serviceUriConfig()
      serviceConfigRef.current = serviceConfig
      
      console.log("[Balance] Service config:", serviceConfig)
      console.log("[Balance] Coin Public Key:", coinPublicKey)
      console.log("[Balance] Address:", address)
      
      // First, run introspection to discover the schema
      const introspectionQuery = `
        query IntrospectionQuery {
          __schema {
            queryType {
              fields {
                name
                args {
                  name
                  type {
                    name
                    kind
                  }
                }
              }
            }
          }
        }
      `
      
      try {
        console.log("[Balance] Running introspection query...")
        const introResponse = await fetch(serviceConfig.indexerUri, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: introspectionQuery })
        })
        const introData = await introResponse.json()
        console.log("[Balance] Schema introspection:", introData)
        
        if (introData?.data?.__schema?.queryType?.fields) {
          const fields = introData.data.__schema.queryType.fields
          console.log("[Balance] Available query fields:", fields.map((f: any) => f.name))
        }
      } catch (e) {
        console.log("[Balance] Introspection failed:", e)
      }

      // Try various query formats based on common Midnight indexer patterns
      // The indexer uses a Hasura-style GraphQL with specific table names
      const queries = [
        {
          name: "unshielded_utxo by address",
          query: `
            query GetUtxos($address: String!) {
              unshielded_utxo(where: {address: {_eq: $address}}) {
                value
                address
              }
            }
          `,
          variables: { address: address }
        },
        {
          name: "coin by coinPublicKey", 
          query: `
            query GetCoins($cpk: String!) {
              coin(where: {coin_public_key: {_eq: $cpk}}) {
                value
              }
            }
          `,
          variables: { cpk: coinPublicKey }
        },
        {
          name: "balance by address",
          query: `
            query GetBalance($addr: String!) {
              balance(where: {address: {_eq: $addr}}) {
                amount
                token_type
              }
            }
          `,
          variables: { addr: address }
        },
        {
          name: "utxo simple",
          query: `
            query GetUtxos {
              utxo(limit: 10) {
                value
                address
              }
            }
          `,
          variables: {}
        },
        {
          name: "shielded_utxo",
          query: `
            query GetShieldedUtxos($cpk: bytea!) {
              shielded_utxo(where: {coin_public_key: {_eq: $cpk}}) {
                value
              }
            }
          `,
          variables: { cpk: coinPublicKey }
        }
      ]
      
      for (const q of queries) {
        if (!q.variables || (Object.values(q.variables).some(v => v === undefined || v === null))) {
          console.log(`[Balance] Skipping ${q.name} - missing variables`)
          continue
        }
        
        try {
          console.log(`[Balance] Trying query: ${q.name}`)
          const response = await fetch(serviceConfig.indexerUri, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: q.query, variables: q.variables })
          })
          
          const data = await response.json()
          console.log(`[Balance] Response for ${q.name}:`, data)
          
          // Check all possible response shapes
          const possibleDataKeys = ['unshielded_utxo', 'coin', 'balance', 'utxo', 'shielded_utxo', 'coins']
          for (const key of possibleDataKeys) {
            if (data?.data?.[key] && Array.isArray(data.data[key]) && data.data[key].length > 0) {
              const items = data.data[key]
              const totalBalance = items.reduce((sum: number, item: any) => {
                const val = item.value || item.amount || 0
                const numVal = typeof val === 'string' ? parseInt(val) : val
                return sum + (numVal || 0)
              }, 0)
              
              if (totalBalance > 0) {
                console.log(`[Balance] Found balance in ${key}: ${totalBalance}`)
                // Return as-is first to see the raw value
                return totalBalance
              }
            }
          }
        } catch (queryErr) {
          console.log(`[Balance] Query ${q.name} failed:`, queryErr)
        }
      }
      
      console.log("[Balance] No balance found with any query")
      return 0
    } catch (err) {
      console.warn("[Balance] Error fetching balance from indexer:", err)
      return 0
    }
  }, [])

  // Check for available wallets on mount
  useEffect(() => {
    const checkWallets = () => {
      const wallets: string[] = []
      
      // Check if Lace Midnight Preview is available
      if (typeof window !== "undefined" && window.midnight?.mnLace) {
        wallets.push("lace")
      }
      
      setAvailableWallets(wallets)
    }

    // Check immediately
    checkWallets()

    // Also check after a short delay (wallet injection may be async)
    const timeout = setTimeout(checkWallets, 500)
    
    return () => clearTimeout(timeout)
  }, [])

  // Check if already connected on mount
  useEffect(() => {
    const checkExistingConnection = async () => {
      if (typeof window !== "undefined" && window.midnight?.mnLace) {
        try {
          const isEnabled = await window.midnight.mnLace.isEnabled()
          if (isEnabled) {
            // Re-enable to get the API
            const connectorApi = await window.midnight.mnLace.enable()
            setApi(connectorApi)
            apiRef.current = connectorApi

            // Get wallet state
            const state = await connectorApi.state()
            console.log("[Wallet] State from existing connection:", state)
            
            // Fetch balance from indexer
            const balance = state.coinPublicKey 
              ? await fetchBalanceFromIndexer(state.coinPublicKey, state.address || undefined)
              : 0
            
            setWallet({
              connected: true,
              address: state.address || null,
              balance,
              network: "midnight-testnet",
              coinPublicKey: state.coinPublicKey || null,
              encryptionPublicKey: state.encryptionPublicKey || null,
            })
          }
        } catch (err) {
          // Silently fail - user may not have authorized yet
          console.log("No existing wallet connection found")
        }
      }
    }

    checkExistingConnection()
  }, [fetchBalanceFromIndexer])

  const clearError = useCallback(() => setError(null), [])

  const connect = useCallback(async (walletName?: string) => {
    setIsConnecting(true)
    setError(null)

    try {
      // Check if Lace Midnight Preview is available
      if (typeof window === "undefined" || !window.midnight?.mnLace) {
        setError("Lace Midnight Preview wallet not detected. Please install the browser extension.")
        setIsConnecting(false)
        return false
      }

      // Enable the wallet - this prompts the user to authorize
      const connectorApi = await window.midnight.mnLace.enable()
      setApi(connectorApi)
      apiRef.current = connectorApi

      // Get wallet state (address and public keys)
      const state = await connectorApi.state()
      console.log("[Wallet] State from connect:", state)
      
      // Fetch balance from indexer
      const balance = state.coinPublicKey 
        ? await fetchBalanceFromIndexer(state.coinPublicKey, state.address || undefined)
        : 0
      
      setWallet({
        connected: true,
        address: state.address || null,
        balance,
        network: "midnight-testnet",
        coinPublicKey: state.coinPublicKey || null,
        encryptionPublicKey: state.encryptionPublicKey || null,
      })

      setIsConnecting(false)
      return true
    } catch (err: any) {
      const errorMessage = err?.message || String(err)
      
      // Handle common error cases
      if (errorMessage.includes("User rejected")) {
        setError("Connection rejected by user")
      } else if (errorMessage.includes("not found")) {
        setError("Lace Midnight Preview wallet not found")
      } else {
        setError(errorMessage)
      }
      
      setIsConnecting(false)
      return false
    }
  }, [fetchBalanceFromIndexer])

  const disconnect = useCallback(() => {
    setWallet({
      connected: false,
      address: null,
      balance: 0,
      network: "midnight-testnet",
      coinPublicKey: null,
      encryptionPublicKey: null,
    })
    setApi(null)
    apiRef.current = null
    serviceConfigRef.current = null
    setError(null)
  }, [])

  const refreshBalance = useCallback(async () => {
    if (!wallet.connected || !wallet.coinPublicKey) {
      console.log("[Balance] Cannot refresh - not connected or no coinPublicKey")
      return
    }
    
    try {
      console.log("[Balance] Refreshing balance...")
      const newBalance = await fetchBalanceFromIndexer(wallet.coinPublicKey, wallet.address || undefined)
      console.log("[Balance] New balance:", newBalance)
      setWallet(prev => ({ ...prev, balance: newBalance }))
    } catch (err) {
      console.warn("Failed to refresh balance:", err)
    }
  }, [wallet.connected, wallet.coinPublicKey, wallet.address, fetchBalanceFromIndexer])

  // Expose transaction methods from the API
  // These use 'any' types as the actual Transaction/CoinInfo types come from @midnight-ntwrk/zswap
  const balanceAndProveTransaction = useCallback(async (tx: any, newCoins: any[]) => {
    if (!apiRef.current) {
      throw new Error("Wallet not connected")
    }
    return apiRef.current.balanceAndProveTransaction(tx, newCoins)
  }, [])

  const submitTransaction = useCallback(async (tx: any) => {
    if (!apiRef.current) {
      throw new Error("Wallet not connected")
    }
    return apiRef.current.submitTransaction(tx)
  }, [])

  // Deprecated methods - kept for backwards compatibility
  const balanceTransaction = useCallback(async (tx: any, newCoins: any[]) => {
    if (!apiRef.current) {
      throw new Error("Wallet not connected")
    }
    // @ts-ignore - deprecated method
    return apiRef.current.balanceTransaction(tx, newCoins)
  }, [])

  const proveTransaction = useCallback(async (tx: any) => {
    if (!apiRef.current) {
      throw new Error("Wallet not connected")
    }
    // @ts-ignore - deprecated method
    return apiRef.current.proveTransaction(tx)
  }, [])

  return {
    wallet,
    isConnecting,
    connect,
    disconnect,
    error,
    clearError,
    availableWallets,
    refreshBalance,
    // Transaction methods
    balanceAndProveTransaction,
    submitTransaction,
    // Deprecated transaction methods (for backwards compatibility)
    balanceTransaction,
    proveTransaction,
    // Raw API access if needed
    api,
  }
}
