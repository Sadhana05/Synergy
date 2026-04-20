"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import type { Token } from "@/lib/types"
import { getTyphonProvider, type TyphonSwapParams } from "@/lib/typhon-provider"
import { useWallet } from "@/hooks/use-wallet"

interface SwapState {
  txHash: string | null
  isLoading: boolean
  error: string | null
  status: "idle" | "signing" | "submitted" | "confirmed" | "failed"
}

export function useTyphon() {
  const { wallet, walletApi } = useWallet()
  const [buyState, setBuyState] = useState<SwapState>({
    txHash: null,
    isLoading: false,
    error: null,
    status: "idle",
  })
  const [sellState, setSellState] = useState<SwapState>({
    txHash: null,
    isLoading: false,
    error: null,
    status: "idle",
  })

  const typhonRef = useRef(getTyphonProvider())

  // Initialize Typhon provider when wallet connects
  useEffect(() => {
    if (walletApi && wallet.connected) {
      typhonRef.current.initialize(walletApi).catch(console.error)
    }
  }, [walletApi, wallet.connected])

  const executeBuy = useCallback(
    async (token: Token, adaAmount: number, slippage = 2) => {
      if (!wallet.connected || !wallet.address || !walletApi) {
        setBuyState((prev) => ({
          ...prev,
          error: "Wallet not connected",
          status: "failed",
        }))
        return
      }

      setBuyState({
        txHash: null,
        isLoading: true,
        error: null,
        status: "signing",
      })

      try {
        const params: TyphonSwapParams = {
          walletAddress: wallet.address,
          tokenMint: token.id,
          tokenAmount: adaAmount / token.price,
          adaAmount: adaAmount,
          slippage: slippage,
          api: walletApi,
        }

        const txHash = await typhonRef.current.buyTokens(params)

        setBuyState({
          txHash: txHash,
          isLoading: false,
          error: null,
          status: "submitted",
        })

        // Simulate confirmation after 3 seconds
        setTimeout(() => {
          setBuyState((prev) => ({
            ...prev,
            status: "confirmed",
          }))
        }, 3000)

        return txHash
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to execute buy"
        setBuyState({
          txHash: null,
          isLoading: false,
          error: errorMessage,
          status: "failed",
        })
      }
    },
    [wallet.connected, wallet.address, walletApi],
  )

  const executeSell = useCallback(
    async (token: Token, tokenAmount: number, slippage = 2) => {
      if (!wallet.connected || !wallet.address || !walletApi) {
        setSellState((prev) => ({
          ...prev,
          error: "Wallet not connected",
          status: "failed",
        }))
        return
      }

      setSellState({
        txHash: null,
        isLoading: true,
        error: null,
        status: "signing",
      })

      try {
        const params: TyphonSwapParams = {
          walletAddress: wallet.address,
          tokenMint: token.id,
          tokenAmount: tokenAmount,
          adaAmount: tokenAmount * token.price * 0.97,
          slippage: slippage,
          api: walletApi,
        }

        const txHash = await typhonRef.current.sellTokens(params)

        setSellState({
          txHash: txHash,
          isLoading: false,
          error: null,
          status: "submitted",
        })

        // Simulate confirmation after 3 seconds
        setTimeout(() => {
          setSellState((prev) => ({
            ...prev,
            status: "confirmed",
          }))
        }, 3000)

        return txHash
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to execute sell"
        setSellState({
          txHash: null,
          isLoading: false,
          error: errorMessage,
          status: "failed",
        })
      }
    },
    [wallet.connected, wallet.address, walletApi],
  )

  const clearBuyState = useCallback(() => {
    setBuyState({
      txHash: null,
      isLoading: false,
      error: null,
      status: "idle",
    })
  }, [])

  const clearSellState = useCallback(() => {
    setSellState({
      txHash: null,
      isLoading: false,
      error: null,
      status: "idle",
    })
  }, [])

  return {
    wallet,
    isConnected: wallet.connected,
    buyState,
    sellState,
    executeBuy,
    executeSell,
    clearBuyState,
    clearSellState,
    getNetworkId: () => typhonRef.current.getNetworkId(),
  }
}
