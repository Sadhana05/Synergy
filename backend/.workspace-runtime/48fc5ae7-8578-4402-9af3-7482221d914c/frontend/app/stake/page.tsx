"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Lock, TrendingUp, Unlock, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { getPortfolio, getActiveStakes, stakeTokens, unstakeTokens, type PortfolioHolding, type StakedPosition } from "@/lib/portfolio-storage"
import { getCreatedTokens } from "@/lib/token-storage"
import { Card } from "@/components/ui/card"
import { useZKPIdentity } from "@/hooks/use-zkp-identity"
import { useMidnight } from "@/hooks/useMidnight"
import Link from "next/link"

export default function StakeTokensPage() {
  const [portfolio, setPortfolio] = useState<PortfolioHolding[]>([])
  const [activeStakes, setActiveStakes] = useState<StakedPosition[]>([])
  const [selectedHolding, setSelectedHolding] = useState<PortfolioHolding | null>(null)
  const [stakeAmount, setStakeAmount] = useState("")
  const [stakeDuration, setStakeDuration] = useState("30")
  const [isStaking, setIsStaking] = useState(false)
  const [stakeSuccess, setStakeSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { isAuthenticated } = useZKPIdentity()
  const { wallet } = useMidnight()
  
  // Check if user is connected via ZKP or wallet
  const isConnected = isAuthenticated || wallet?.connected

  const estimatedRewards = selectedHolding 
    ? Number.parseFloat(stakeAmount) * 0.08 * (Number.parseInt(stakeDuration) / 365) || 0
    : 0

  // Load portfolio and stakes
  useEffect(() => {
    const holdings = getPortfolio()
    const stakes = getActiveStakes()
    setPortfolio(holdings)
    setActiveStakes(stakes)
    if (holdings.length > 0 && !selectedHolding) {
      setSelectedHolding(holdings[0])
    }
  }, [])

  const handleStake = async () => {
    if (!selectedHolding || !stakeAmount) return
    
    const amount = parseFloat(stakeAmount)
    if (amount <= 0 || amount > selectedHolding.amount) {
      setError("Invalid stake amount")
      return
    }

    setIsStaking(true)
    setError(null)

    try {
      // Get full token data
      const tokens = getCreatedTokens()
      const token = tokens.find(t => t.id === selectedHolding.tokenId)
      
      if (!token) {
        setError("Token not found")
        setIsStaking(false)
        return
      }

      // Simulate staking delay
      await new Promise(resolve => setTimeout(resolve, 1500))

      const result = stakeTokens(token, amount, parseInt(stakeDuration))
      
      if (result) {
        setStakeSuccess(true)
        // Refresh data
        setPortfolio(getPortfolio())
        setActiveStakes(getActiveStakes())
        setStakeAmount("")
        
        setTimeout(() => {
          setStakeSuccess(false)
          // Update selected holding
          const updatedHolding = getPortfolio().find(h => h.tokenId === selectedHolding.tokenId)
          setSelectedHolding(updatedHolding || null)
        }, 2000)
      } else {
        setError("Failed to stake tokens")
      }
    } catch {
      setError("Staking failed")
    }
    
    setIsStaking(false)
  }

  const handleUnstake = async (positionId: string) => {
    try {
      unstakeTokens(positionId)
      setPortfolio(getPortfolio())
      setActiveStakes(getActiveStakes())
    } catch {
      setError("Failed to unstake")
    }
  }

  if (!isConnected) {
    return (
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Lock className="text-gray-600 mb-4" size={48} />
          <h2 className="text-2xl font-bold text-white mb-2">Connect Wallet to Stake</h2>
          <p className="text-gray-400 mb-6">Connect your wallet to view and stake your tokens</p>
        </div>
      </div>
    )
  }

  if (portfolio.length === 0) {
    return (
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Lock className="text-gray-600 mb-4" size={48} />
          <h2 className="text-2xl font-bold text-white mb-2">No Tokens to Stake</h2>
          <p className="text-gray-400 mb-6">Buy some tokens first to start staking and earning rewards</p>
          <Link href="/tokens">
            <Button className="bg-gradient-to-r from-[#9CFFBB] to-[#5CFF71] text-[#0A0A0A]">
              Browse Tokens
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Lock className="text-[#9CFFBB]" size={28} />
          <h1 className="text-3xl font-bold text-white">Stake Tokens</h1>
        </div>
        <p className="text-gray-400">Earn rewards by staking your tokens</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="glass-card border-[#9CFFBB]/20 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Select Token to Stake</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto mb-6">
              {portfolio.map((holding) => (
                <button
                  key={holding.tokenId}
                  onClick={() => {
                    setSelectedHolding(holding)
                    setStakeAmount("")
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                    selectedHolding?.tokenId === holding.tokenId
                      ? "border-[#9CFFBB]/50 bg-[#9CFFBB]/10"
                      : "border-[#9CFFBB]/20 bg-transparent hover:bg-white/5"
                  }`}
                >
                  <div className="text-left">
                    <p className="font-semibold text-white">{holding.tokenName}</p>
                    <p className="text-xs text-gray-400">APY: 8.0%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">{holding.amount.toLocaleString()} available</p>
                  </div>
                </button>
              ))}
            </div>

            {selectedHolding && (
              <div className="space-y-4 p-4 rounded-lg bg-[#9CFFBB]/5 border border-[#9CFFBB]/20">
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">Stake Amount</label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    className="bg-[#1A1A1A] border-[#9CFFBB]/20 text-white"
                    max={selectedHolding.amount}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Available: {selectedHolding.amount.toLocaleString()} {selectedHolding.tokenSymbol}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-white mb-2 block">Lock Duration (Days)</label>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {["7", "30", "90", "180"].map((days) => (
                      <button
                        key={days}
                        onClick={() => setStakeDuration(days)}
                        className={`p-2 rounded-lg text-sm font-medium transition-all ${
                          stakeDuration === days
                            ? "bg-[#9CFFBB] text-[#0A0A0A]"
                            : "bg-[#1A1A1A] text-gray-400 hover:text-white border border-[#9CFFBB]/20"
                        }`}
                      >
                        {days}d
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                {stakeSuccess && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
                    <CheckCircle size={16} />
                    <span>Tokens staked successfully!</span>
                  </div>
                )}

                <div className="pt-3 border-t border-[#9CFFBB]/20">
                  <div className="flex justify-between mb-3">
                    <span className="text-gray-400">APY:</span>
                    <span className="font-semibold text-[#5CFF71]">8.0%</span>
                  </div>
                  <div className="flex justify-between mb-4">
                    <span className="text-gray-400">Est. Rewards:</span>
                    <span className="font-semibold text-[#9CFFBB]">
                      {estimatedRewards.toFixed(2)} {selectedHolding.tokenSymbol}
                    </span>
                  </div>
                  <Button 
                    onClick={handleStake}
                    disabled={isStaking || !stakeAmount || parseFloat(stakeAmount) <= 0 || parseFloat(stakeAmount) > selectedHolding.amount}
                    className="w-full bg-gradient-to-r from-[#9CFFBB] to-[#5CFF71] text-[#0A0A0A] font-semibold disabled:opacity-50"
                  >
                    {isStaking ? (
                      <>
                        <Loader2 size={18} className="mr-2 animate-spin" />
                        Staking...
                      </>
                    ) : (
                      <>
                        <Lock size={18} className="mr-2" />
                        Stake Tokens
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="glass-card border-[#9CFFBB]/20 p-4">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <TrendingUp size={18} className="text-[#5CFF71]" />
              Staking Benefits
            </h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex gap-2">
                <span className="text-[#9CFFBB]">•</span>
                <span>Earn 8% annual yield on staked tokens</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#9CFFBB]">•</span>
                <span>Longer lock = higher rewards multiplier</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#9CFFBB]">•</span>
                <span>Rewards compound automatically</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#9CFFBB]">•</span>
                <span>Unstake anytime after lock period</span>
              </li>
            </ul>
          </Card>

          <Card className="glass-card border-[#9CFFBB]/20 p-4">
            <h3 className="font-semibold text-white mb-3">Your Active Stakes</h3>
            {activeStakes.length === 0 ? (
              <p className="text-sm text-gray-500">No active stakes yet</p>
            ) : (
              <div className="space-y-2">
                {activeStakes.map((stake) => {
                  const endDate = new Date(stake.endDate)
                  const now = new Date()
                  const canUnstake = now >= endDate
                  const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
                  
                  return (
                    <div key={stake.id} className="p-3 rounded-lg bg-[#1A1A1A] text-xs">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-400">Staked:</span>
                        <span className="text-white">{stake.amount.toLocaleString()} {stake.tokenSymbol}</span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-400">Est. Rewards:</span>
                        <span className="text-[#5CFF71]">{stake.estimatedRewards.toFixed(2)} {stake.tokenSymbol}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-400">Lock ends:</span>
                        <span className={canUnstake ? "text-[#9CFFBB]" : "text-yellow-400"}>
                          {canUnstake ? "Ready to claim" : `${daysLeft} days left`}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUnstake(stake.id)}
                        className={`w-full text-xs ${canUnstake 
                          ? "border-[#9CFFBB]/50 text-[#9CFFBB] hover:bg-[#9CFFBB]/10" 
                          : "border-gray-600 text-gray-400"
                        }`}
                      >
                        <Unlock size={14} className="mr-1" />
                        {canUnstake ? "Claim & Unstake" : "Early Withdraw"}
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
