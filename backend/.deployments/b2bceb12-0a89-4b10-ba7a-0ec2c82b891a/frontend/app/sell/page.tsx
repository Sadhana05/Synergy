"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { ArrowDownUp, TrendingUp, TrendingDown, Wallet, AlertCircle, Shield, Users, CheckCircle } from "lucide-react"
import { getPortfolio, removeFromPortfolio, PortfolioHolding } from "@/lib/portfolio-storage"
import { getCreatedTokens, getTokenById } from "@/lib/token-storage"
import { Token } from "@/lib/types"
import { useWallet } from "@/hooks/use-wallet"
import { useMidnight } from "@/hooks/useMidnight"

// Extended holding type with calculated values
interface ExtendedHolding extends PortfolioHolding {
  currentPrice: number
  currentValue: number
  pnl: number
  pnlPercent: number
  trustScore: number
  influenceScore: number
  token: Token | null
}

export default function SellPage() {
  const [holdings, setHoldings] = useState<ExtendedHolding[]>([])
  const [selectedHolding, setSelectedHolding] = useState<ExtendedHolding | null>(null)
  const [sellAmount, setSellAmount] = useState<string>("")
  const [sellPercent, setSellPercent] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isSelling, setIsSelling] = useState(false)
  const [sellSuccess, setSellSuccess] = useState(false)
  
  const { wallet } = useWallet()
  const { wallet: midnightWallet } = useMidnight()
  
  const isWalletConnected = wallet.connected || midnightWallet.connected
  const activeWalletAddress = wallet.address || midnightWallet.address

  // Helper to enrich holdings with current token data
  const enrichHoldings = (rawHoldings: PortfolioHolding[]): ExtendedHolding[] => {
    const tokens = getCreatedTokens()
    
    return rawHoldings.map((holding: PortfolioHolding) => {
      const token = tokens.find((t) => t.id === holding.tokenId) || null
      const currentPrice = token?.price || holding.avgBuyPrice
      const currentValue = holding.amount * currentPrice
      const totalCost = holding.amount * holding.avgBuyPrice
      const pnl = currentValue - totalCost
      const pnlPercent = totalCost > 0 ? (pnl / totalCost) * 100 : 0
      
      return {
        ...holding,
        currentPrice,
        currentValue,
        pnl,
        pnlPercent,
        trustScore: token?.trustScore || 50,
        influenceScore: token?.influenceScore || 30,
        token: token as Token | null
      }
    })
  }

  // Load and enrich portfolio holdings
  useEffect(() => {
    const loadHoldings = () => {
      setIsLoading(true)
      try {
        const rawHoldings = getPortfolio()
        const enrichedHoldings = enrichHoldings(rawHoldings)
        
        setHoldings(enrichedHoldings)
        
        // Auto-select first holding if none selected
        if (enrichedHoldings.length > 0 && !selectedHolding) {
          setSelectedHolding(enrichedHoldings[0])
        }
      } catch (error) {
        console.error("Error loading holdings:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadHoldings()
    
    // Refresh every 30 seconds for price updates
    const interval = setInterval(loadHoldings, 30000)
    return () => clearInterval(interval)
  }, [])

  // Update sell amount when percent changes
  useEffect(() => {
    if (selectedHolding && sellPercent > 0) {
      const amount = (selectedHolding.amount * sellPercent) / 100
      setSellAmount(amount.toFixed(4))
    }
  }, [sellPercent, selectedHolding])

  const handleSellAmountChange = (value: string) => {
    setSellAmount(value)
    if (selectedHolding && selectedHolding.amount > 0) {
      const numValue = parseFloat(value) || 0
      const percent = Math.min((numValue / selectedHolding.amount) * 100, 100)
      setSellPercent(percent)
    }
  }

  const handlePercentChange = (value: number[]) => {
    setSellPercent(value[0])
  }

  const calculateSellValue = () => {
    if (!selectedHolding || !sellAmount) return 0
    const amount = parseFloat(sellAmount) || 0
    return amount * selectedHolding.currentPrice
  }

  const handleSell = async () => {
    if (!selectedHolding || !sellAmount || parseFloat(sellAmount) <= 0) return
    if (!selectedHolding.token) {
      console.error("Token not found for holding")
      return
    }
    
    setIsSelling(true)
    setSellSuccess(false)
    
    try {
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const sellAmountNum = parseFloat(sellAmount)
      const txHash = `tx_${Date.now()}_${Math.random().toString(36).substring(7)}`
      
      // Remove from portfolio (requires Token object, amount, price, txHash)
      removeFromPortfolio(
        selectedHolding.token,
        sellAmountNum,
        selectedHolding.currentPrice,
        txHash
      )
      
      // Refresh holdings
      const rawHoldings = getPortfolio()
      const enrichedHoldings = enrichHoldings(rawHoldings)
      
      setHoldings(enrichedHoldings)
      
      // Update or clear selected holding
      const updatedHolding = enrichedHoldings.find(h => h.tokenId === selectedHolding.tokenId)
      if (updatedHolding) {
        setSelectedHolding(updatedHolding)
      } else {
        setSelectedHolding(enrichedHoldings[0] || null)
      }
      
      setSellAmount("")
      setSellPercent(0)
      setSellSuccess(true)
      
      // Clear success message after 3 seconds
      setTimeout(() => setSellSuccess(false), 3000)
    } catch (error) {
      console.error("Error selling:", error)
    } finally {
      setIsSelling(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400"
    if (score >= 60) return "text-teal-400"
    if (score >= 40) return "text-yellow-400"
    return "text-red-400"
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-500/20 border-green-500/30"
    if (score >= 60) return "bg-teal-500/20 border-teal-500/30"
    if (score >= 40) return "bg-yellow-500/20 border-yellow-500/30"
    return "bg-red-500/20 border-red-500/30"
  }

  if (!isWalletConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Wallet className="h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400 text-center max-w-md">
              Please connect your Midnight or Cardano wallet to view and sell your token holdings.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
            <span className="ml-3 text-gray-400">Loading your portfolio...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (holdings.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No Holdings Found</h2>
            <p className="text-gray-400 text-center max-w-md mb-4">
              You don&apos;t have any tokens in your portfolio yet. Start by buying some tokens!
            </p>
            <Button 
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
              onClick={() => window.location.href = "/buyt"}
            >
              Browse Tokens
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Sell Tokens</h1>
        <p className="text-gray-400">Sell tokens from your portfolio with ZKP privacy protection</p>
      </div>

      {sellSuccess && (
        <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-400" />
          <span className="text-green-400">Successfully sold tokens!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Holdings List */}
        <Card className="bg-gray-900/50 border-gray-800 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-white">Your Holdings</CardTitle>
            <CardDescription>Select a token to sell</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
            {holdings.map((holding) => (
              <div
                key={holding.tokenId}
                className={`p-4 rounded-lg cursor-pointer transition-all ${
                  selectedHolding?.tokenId === holding.tokenId
                    ? "bg-teal-500/20 border border-teal-500/50"
                    : "bg-gray-800/50 border border-gray-700 hover:border-gray-600"
                }`}
                onClick={() => {
                  setSelectedHolding(holding)
                  setSellAmount("")
                  setSellPercent(0)
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold">
                      {holding.tokenSymbol.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{holding.tokenSymbol}</div>
                      <div className="text-sm text-gray-400">{holding.tokenName}</div>
                    </div>
                  </div>
                  {holding.pnlPercent >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-green-400" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-400" />
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-gray-400">Amount</div>
                    <div className="text-white">{holding.amount.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Value</div>
                    <div className="text-white">${holding.currentValue.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">P&L</div>
                    <div className={holding.pnl >= 0 ? "text-green-400" : "text-red-400"}>
                      {holding.pnl >= 0 ? "+" : ""}{holding.pnl.toFixed(2)} ({holding.pnlPercent.toFixed(1)}%)
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">Price</div>
                    <div className="text-white">${holding.currentPrice.toFixed(6)}</div>
                  </div>
                </div>

                {/* Trust & Influence Scores */}
                <div className="flex gap-2 mt-3">
                  <Badge variant="outline" className={`text-xs ${getScoreBgColor(holding.trustScore)}`}>
                    <Shield className={`h-3 w-3 mr-1 ${getScoreColor(holding.trustScore)}`} />
                    <span className={getScoreColor(holding.trustScore)}>{holding.trustScore}</span>
                  </Badge>
                  <Badge variant="outline" className={`text-xs ${getScoreBgColor(holding.influenceScore)}`}>
                    <Users className={`h-3 w-3 mr-1 ${getScoreColor(holding.influenceScore)}`} />
                    <span className={getScoreColor(holding.influenceScore)}>{holding.influenceScore}</span>
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Sell Widget */}
        <Card className="bg-gray-900/50 border-gray-800 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <ArrowDownUp className="h-5 w-5 text-teal-400" />
              Sell {selectedHolding?.tokenSymbol || "Token"}
            </CardTitle>
            <CardDescription>
              Enter the amount you want to sell
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedHolding ? (
              <div className="space-y-6">
                {/* Selected Token Info */}
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                        {selectedHolding.tokenSymbol.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-white text-lg">{selectedHolding.tokenName}</div>
                        <div className="text-gray-400">{selectedHolding.tokenSymbol}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-400 text-sm">Current Price</div>
                      <div className="text-white font-semibold">${selectedHolding.currentPrice.toFixed(6)}</div>
                    </div>
                  </div>
                  
                  {/* Trust & Influence Badges */}
                  <div className="flex gap-3 mb-4">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${getScoreBgColor(selectedHolding.trustScore)}`}>
                      <Shield className={`h-4 w-4 ${getScoreColor(selectedHolding.trustScore)}`} />
                      <span className={`text-sm font-medium ${getScoreColor(selectedHolding.trustScore)}`}>
                        Trust: {selectedHolding.trustScore}
                      </span>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${getScoreBgColor(selectedHolding.influenceScore)}`}>
                      <Users className={`h-4 w-4 ${getScoreColor(selectedHolding.influenceScore)}`} />
                      <span className={`text-sm font-medium ${getScoreColor(selectedHolding.influenceScore)}`}>
                        Influence: {selectedHolding.influenceScore}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400">Your Balance</div>
                      <div className="text-white font-medium">{selectedHolding.amount.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Total Value</div>
                      <div className="text-white font-medium">${selectedHolding.currentValue.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Avg Buy Price</div>
                      <div className="text-white font-medium">${selectedHolding.avgBuyPrice.toFixed(6)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Total P&L</div>
                      <div className={`font-medium ${selectedHolding.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {selectedHolding.pnl >= 0 ? "+" : ""}${selectedHolding.pnl.toFixed(2)} ({selectedHolding.pnlPercent.toFixed(1)}%)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sell Amount Input */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="sellAmount" className="text-gray-300">Sell Amount</Label>
                    <div className="relative mt-1">
                      <Input
                        id="sellAmount"
                        type="number"
                        placeholder="0.00"
                        value={sellAmount}
                        onChange={(e) => handleSellAmountChange(e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white pr-20"
                        max={selectedHolding.amount}
                        min={0}
                        step="0.0001"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {selectedHolding.tokenSymbol}
                      </div>
                    </div>
                  </div>

                  {/* Percentage Slider */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label className="text-gray-300">Percentage</Label>
                      <span className="text-teal-400">{sellPercent.toFixed(0)}%</span>
                    </div>
                    <Slider
                      value={[sellPercent]}
                      onValueChange={handlePercentChange}
                      max={100}
                      step={1}
                      className="cursor-pointer"
                    />
                    <div className="flex justify-between mt-2">
                      {[25, 50, 75, 100].map((percent) => (
                        <Button
                          key={percent}
                          variant="outline"
                          size="sm"
                          className="text-xs border-gray-700 hover:border-teal-500 hover:text-teal-400"
                          onClick={() => setSellPercent(percent)}
                        >
                          {percent}%
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Estimated Value */}
                  <div className="p-4 bg-gray-800/50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">You will receive (est.)</span>
                      <span className="text-2xl font-bold text-white">
                        ${calculateSellValue().toFixed(2)}
                      </span>
                    </div>
                    {parseFloat(sellAmount) > 0 && (
                      <div className="mt-2 text-sm text-gray-400">
                        Selling {sellAmount} {selectedHolding.tokenSymbol} @ ${selectedHolding.currentPrice.toFixed(6)}
                      </div>
                    )}
                  </div>

                  {/* Sell Button */}
                  <Button
                    className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold py-6"
                    onClick={handleSell}
                    disabled={
                      !sellAmount || 
                      parseFloat(sellAmount) <= 0 || 
                      parseFloat(sellAmount) > selectedHolding.amount || 
                      isSelling ||
                      !selectedHolding.token
                    }
                  >
                    {isSelling ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Processing Sale...
                      </>
                    ) : (
                      <>Sell {selectedHolding.tokenSymbol}</>
                    )}
                  </Button>

                  {parseFloat(sellAmount) > selectedHolding.amount && (
                    <div className="flex items-center gap-2 text-red-400 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <span>Insufficient balance</span>
                    </div>
                  )}

                  {!selectedHolding.token && (
                    <div className="flex items-center gap-2 text-yellow-400 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <span>Token data unavailable - cannot sell</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-400">Select a token from your holdings to sell</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
