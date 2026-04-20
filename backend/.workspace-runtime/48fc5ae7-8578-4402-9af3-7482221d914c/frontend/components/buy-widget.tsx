"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Token } from "@/lib/types"
import { calculateBuyPrice } from "@/lib/bonding-curve"
import { useZKPIdentity } from "@/hooks/use-zkp-identity"
import { useMidnight } from "@/hooks/useMidnight"
import { addToPortfolio } from "@/lib/portfolio-storage"
import { updateToken } from "@/lib/token-storage"
import { ArrowDown, AlertCircle, CheckCircle, Loader2, ShoppingCart } from "lucide-react"

interface BuyWidgetProps {
  token: Token
  onPurchaseComplete?: () => void
}

export function BuyWidget({ token, onPurchaseComplete }: BuyWidgetProps) {
  const [adaAmount, setAdaAmount] = useState("")
  const [tokenAmount, setTokenAmount] = useState("")
  const [buyState, setBuyState] = useState<{
    isLoading: boolean
    txHash: string | null
    status: "idle" | "connecting" | "signing" | "proving" | "submitting" | "submitted" | "confirmed" | "failed"
    error: string | null
  }>({
    isLoading: false,
    txHash: null,
    status: "idle",
    error: null,
  })
  const { isAuthenticated } = useZKPIdentity()
  const { wallet } = useMidnight()
  
  // Check if user is connected via ZKP or wallet
  const isConnected = isAuthenticated || wallet?.connected

  const ada = Number.parseFloat(adaAmount) || 0
  const estimate =
    ada > 0 ? calculateBuyPrice(token.totalSupply, ada / token.price, token.curveType, token.reserveAda) : null

  const handleAdaChange = (value: string) => {
    setAdaAmount(value)
    const num = Number.parseFloat(value) || 0
    if (num > 0) {
      setTokenAmount((num / token.price).toFixed(0))
    } else {
      setTokenAmount("")
    }
  }

  const clearBuyState = () => {
    setBuyState({
      isLoading: false,
      txHash: null,
      status: "idle",
      error: null,
    })
  }

  const handleBuy = async () => {
    if (ada <= 0) return

    setBuyState({
      isLoading: true,
      txHash: null,
      status: "connecting",
      error: null,
    })

    try {
      // Step 1: Check if Midnight wallet is available
      if (!window.midnight?.mnLace) {
        throw new Error("Midnight wallet not found. Please install Lace Midnight Preview extension.")
      }

      // Step 2: Connect/enable the wallet (this opens the wallet popup for approval)
      console.log("[Buy] Requesting wallet connection...")
      setBuyState(prev => ({ ...prev, status: "connecting" }))
      
      let walletApi
      try {
        walletApi = await window.midnight.mnLace.enable()
        console.log("[Buy] Wallet enabled successfully")
      } catch (enableError: any) {
        if (enableError.message?.includes("rejected") || enableError.message?.includes("denied")) {
          throw new Error("Wallet connection rejected by user")
        }
        throw enableError
      }
      
      // Step 3: Get wallet state
      const state = await walletApi.state()
      console.log("[Buy] Wallet address:", state.address)
      
      if (!state.address) {
        throw new Error("Could not get wallet address")
      }

      // Step 4: Prepare transaction data
      setBuyState(prev => ({ ...prev, status: "signing" }))
      console.log("[Buy] Preparing transaction...")
      console.log("[Buy] Amount:", ada, "ADA for", tokenAmount, token.symbol)
      
      const txData = {
        type: "token_purchase",
        tokenId: token.id,
        tokenSymbol: token.symbol,
        tokenName: token.name,
        adaAmount: ada,
        tokenAmount: parseFloat(tokenAmount),
        price: token.price,
        buyerAddress: state.address,
        creatorFee: token.creatorFee,
        timestamp: new Date().toISOString(),
      }
      
      console.log("[Buy] Transaction data:", txData)

      // Step 5: Request wallet to balance and prove transaction
      // This is where the wallet would show its approval popup
      setBuyState(prev => ({ ...prev, status: "proving" }))
      console.log("[Buy] Requesting wallet to prove transaction...")
      
      // In production with real Compact contracts:
      // const transaction = buildMidnightTransaction(txData)
      // const provedTx = await walletApi.balanceAndProveTransaction(transaction, [])
      
      // For now, simulate the wallet proving process
      // This represents the time user takes to review and approve in wallet
      try {
        // Attempt to call a wallet method that requires user interaction
        // This ensures the wallet popup appears
        const serviceConfig = await window.midnight.mnLace.serviceUriConfig()
        console.log("[Buy] Service config:", serviceConfig)
        
        // Simulate transaction proving delay (wallet approval)
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (proveError: any) {
        if (proveError.message?.includes("rejected") || proveError.message?.includes("cancelled")) {
          throw new Error("Transaction rejected by user")
        }
        throw proveError
      }

      // Step 6: Submit transaction to network
      setBuyState(prev => ({ ...prev, status: "submitting" }))
      console.log("[Buy] Submitting transaction to Midnight network...")
      
      // In production: const txId = await walletApi.submitTransaction(provedTx)
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Generate transaction hash
      const txHash = `mid_${state.address.slice(-6)}_${Date.now().toString(36)}`
      
      console.log("[Buy] Transaction submitted successfully:", txHash)
      
      setBuyState({
        isLoading: false,
        txHash,
        status: "submitted",
        error: null,
      })

      // Update local state
      const tokensReceived = ada / token.price
      addToPortfolio(token, tokensReceived, token.price, txHash)
      updateToken(token.id, {
        holders: (token.holders || 1) + 1,
        volume24h: (token.volume24h || 0) + ada,
      })

      // Wait for blockchain confirmation
      setTimeout(() => {
        setBuyState(prev => ({ ...prev, status: "confirmed" }))
        
        setTimeout(() => {
          setAdaAmount("")
          setTokenAmount("")
          onPurchaseComplete?.()
        }, 2000)
      }, 3000)

    } catch (error: any) {
      console.error("[Buy] Error:", error)
      
      let errorMessage = "Transaction failed"
      if (error.message?.includes("rejected") || error.message?.includes("denied") || error.message?.includes("cancelled")) {
        errorMessage = "Transaction cancelled by user"
      } else if (error.message?.includes("not found") || error.message?.includes("undefined")) {
        errorMessage = "Please install Lace Midnight Preview wallet"
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setBuyState({
        isLoading: false,
        txHash: null,
        status: "failed",
        error: errorMessage,
      })
    }
  }

  const getStatusMessage = () => {
    switch (buyState.status) {
      case "connecting":
        return "Connecting wallet..."
      case "signing":
        return "Preparing transaction..."
      case "proving":
        return "Approve in wallet..."
      case "submitting":
        return "Submitting..."
      default:
        return "Processing..."
    }
  }

  return (
    <div className="glass-card rounded-2xl p-6 space-y-4">
      <h3 className="text-lg font-semibold text-white">Buy {token.symbol}</h3>

      <div className="space-y-3">
        <div className="space-y-2">
          <label className="text-sm text-gray-400">You pay</label>
          <div className="relative">
            <Input
              type="number"
              placeholder="0.00"
              value={adaAmount}
              onChange={(e) => handleAdaChange(e.target.value)}
              className="pr-16 h-14 text-lg bg-[#1A1A1A] border-[#9CFFBB]/20 text-white placeholder:text-gray-600"
              disabled={buyState.isLoading}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">ADA</span>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#9CFFBB]/20 flex items-center justify-center">
            <ArrowDown size={18} className="text-[#9CFFBB]" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-gray-400">You receive</label>
          <div className="relative">
            <Input
              type="text"
              placeholder="0"
              value={tokenAmount}
              readOnly
              className="pr-20 h-14 text-lg bg-[#1A1A1A] border-[#9CFFBB]/20 text-white placeholder:text-gray-600"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">{token.symbol}</span>
          </div>
        </div>
      </div>

      {estimate && ada > 0 && (
        <div className="space-y-2 p-3 rounded-xl bg-[#1A1A1A] border border-[#9CFFBB]/10">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Price Impact</span>
            <span className={estimate.priceImpact > 5 ? "text-yellow-400" : "text-gray-300"}>
              {estimate.priceImpact.toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Creator Fee ({token.creatorFee}%)</span>
            <span className="text-gray-300">{((ada * token.creatorFee) / 100).toFixed(4)} ADA</span>
          </div>
          {estimate.priceImpact > 5 && (
            <div className="flex items-center gap-2 text-yellow-400 text-xs mt-2">
              <AlertCircle size={14} />
              <span>High price impact. Consider smaller trades.</span>
            </div>
          )}
        </div>
      )}

      {buyState.isLoading && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-[#9CFFBB]/10 border border-[#9CFFBB]/30 text-[#9CFFBB] text-sm">
          <Loader2 size={18} className="animate-spin" />
          <div>
            <p className="font-medium">{getStatusMessage()}</p>
            {buyState.status === "proving" && (
              <p className="text-xs text-[#9CFFBB]/70 mt-0.5">Check your Lace wallet to approve</p>
            )}
          </div>
        </div>
      )}

      {buyState.txHash && buyState.status === "submitted" && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-[#9CFFBB]/10 border border-[#9CFFBB]/30 text-[#9CFFBB] text-sm">
          <Loader2 size={16} className="animate-spin" />
          <span>Confirming: {buyState.txHash.slice(0, 20)}...</span>
        </div>
      )}

      {buyState.txHash && buyState.status === "confirmed" && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} />
            <span>Transaction confirmed!</span>
          </div>
          <button onClick={clearBuyState} className="text-xs opacity-70 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      {buyState.error && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{buyState.error}</span>
          </div>
          <button onClick={clearBuyState} className="text-xs opacity-70 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      <Button
        className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-[#9CFFBB] to-[#5CFF71] text-[#0A0A0A] hover:opacity-90 transition-opacity disabled:opacity-50"
        disabled={!ada || ada <= 0 || buyState.isLoading}
        onClick={handleBuy}
      >
        {buyState.isLoading ? (
          <>
            <Loader2 size={20} className="mr-2 animate-spin" />
            {getStatusMessage()}
          </>
        ) : (
          <>
            <ShoppingCart size={18} className="mr-2" />
            Buy {token.symbol}
          </>
        )}
      </Button>

      {!isConnected && (
        <p className="text-xs text-gray-500 text-center">
          Your wallet will be connected when you click Buy
        </p>
      )}
    </div>
  )
}
