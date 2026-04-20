'use client'

import { useState, useEffect } from "react"

type MidnightProvider = {
  connect?: () => Promise<any>
  getAccounts?: () => Promise<any[]>
  getWalletInfo?: () => Promise<any>
  request?: (method: string, params?: any) => Promise<any>
}

export function useMidnightWallet() {
  const [provider, setProvider] = useState<MidnightProvider | null>(null)
  const [connected, setConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [network, setNetwork] = useState("midnight")
  const [balance, setBalance] = useState(0)

  // Detect provider injected by Lace Midnight
  useEffect(() => {
    const w = window as any
    const p = w.midnight || (w.cardano && w.cardano.midnight)
    setProvider(p || null)
  }, [])

  const connect = async () => {
    if (!provider) return false

    // Midnight uses provider.connect()
    const session = await connect()
    setConnected(true)

    // Get accounts
    const accounts = await provider.getAccounts?.()
    if (accounts && accounts.length > 0) {
      setAddress(accounts[0].address) // real Midnight address
    }

    setNetwork("midnight-testnet")
    setBalance(0) // We’ll add RPC later

    return true
  }

  const disconnect = () => {
    setConnected(false)
    setAddress(null)
  }

  return {
    provider,
    connected,
    address,
    balance,
    network,
    connect,
    disconnect,
  }
}
