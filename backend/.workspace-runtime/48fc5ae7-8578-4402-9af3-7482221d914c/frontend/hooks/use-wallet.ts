"use client"

import { useState, useCallback, useEffect } from "react"
import type { WalletState } from "@/lib/types"
import { type CardanoWalletApi, hexToLovelace, getAvailableWallets, waitForWallet } from "@/lib/cardano"

const initialState: WalletState = {
  connected: false,
  address: null,
  balance: 0,
  network: "preview",
}

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>(initialState)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [walletApi, setWalletApi] = useState<CardanoWalletApi | null>(null)
  const [availableWallets, setAvailableWallets] = useState<string[]>([])

  useEffect(() => {
    const checkWallets = async () => {
      console.log("[v0] Checking for available wallets...")
      let detected = getAvailableWallets()
      console.log("[v0] Detected wallets (immediate):", detected)

      // If no wallets detected, wait for async injection
      if (detected.length === 0) {
        console.log("[v0] No wallets detected immediately, waiting for async injection...")
        const laceWallet = await waitForWallet("lace", 3000)
        if (laceWallet) {
          detected = ["lace"]
          console.log("[v0] Lace Midnight Preview wallet detected after waiting")
        }
      }

      setAvailableWallets(detected)
    }

    // Check immediately and after multiple delays (wallets inject async)
    checkWallets()
    const timeout1 = setTimeout(checkWallets, 1000)
    const timeout2 = setTimeout(checkWallets, 2500)

    return () => {
      clearTimeout(timeout1)
      clearTimeout(timeout2)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const connect = useCallback(async (walletName = "lace") => {
    setIsConnecting(true)
    setError(null)

    try {
      console.log("[v0] Attempting to connect wallet:", walletName)

      if (typeof window === "undefined" || !window.cardano) {
        setError("No Cardano wallet detected. Please install Lace Midnight Preview extension.")
        setIsConnecting(false)
        return
      }

      // Try to get Lace Midnight Preview wallet (can be injected as 'lace' or 'midnight')
      const walletProvider = window.cardano?.lace || window.cardano?.midnight

      if (!walletProvider) {
        console.log("[v0] Lace Midnight Preview wallet not found")
        console.log("[v0] window.cardano keys:", Object.keys(window.cardano || {}))
        setError("Lace Midnight Preview wallet not found. Please install it from the Chrome Web Store.")
        setIsConnecting(false)
        return
      }

      console.log("[v0] Found Lace Midnight Preview wallet, attempting to enable...", walletProvider.name)

      // Enable the wallet (this prompts the user)
      const api = await walletProvider.enable()
      setWalletApi(api)
      console.log("[v0] Wallet enabled successfully")

      // Get network ID (0 = testnet/preview, 1 = mainnet)
      const networkId = await api.getNetworkId()
      const network = networkId === 1 ? "mainnet" : "preview"
      console.log("[v0] Network:", network, "Network ID:", networkId)

      // Get the first used address
      const usedAddresses = await api.getUsedAddresses()
      const unusedAddresses = await api.getUnusedAddresses()
      const address = usedAddresses[0] || unusedAddresses[0] || null
      console.log("[v0] Address retrieved:", address ? `${address.slice(0, 20)}...` : "none")

      // Get balance in lovelace
      const balanceHex = await api.getBalance()
      const balanceLovelace = hexToLovelace(balanceHex)
      const balanceAda = balanceLovelace / 1_000_000 // Convert lovelace to ADA
      console.log("[v0] Balance:", balanceAda, "ADA")

      setWallet({
        connected: true,
        address: address,
        balance: balanceAda,
        network: network as "mainnet" | "preview",
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to connect wallet"
      console.log("[v0] Wallet connection error:", message)
      console.log("[v0] Error details:", err)
      setError(message)
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    setWallet(initialState)
    setWalletApi(null)
    setError(null)
  }, [])

  // Refresh balance
  const refreshBalance = useCallback(async () => {
    if (!walletApi) return

    try {
      const balanceHex = await walletApi.getBalance()
      const balanceLovelace = hexToLovelace(balanceHex)
      const balanceAda = balanceLovelace / 1_000_000

      setWallet((prev) => ({ ...prev, balance: balanceAda }))
    } catch (err) {
      console.error("[v0] Failed to refresh balance:", err)
    }
  }, [walletApi])

  return {
    wallet,
    isConnecting,
    connect,
    disconnect,
    error,
    clearError,
    walletApi,
    availableWallets,
    refreshBalance,
    isTyphonAvailable: availableWallets.includes("lace"),
  }
}
