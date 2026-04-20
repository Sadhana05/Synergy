"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getCreatedTokens, type CreatedToken } from "@/lib/token-storage"
import { TrendingDown, TrendingUp, Lock, Plus } from "lucide-react"

export default function TradePage() {
  const [tokens, setTokens] = useState<CreatedToken[]>([])
  const [activeTab, setActiveTab] = useState("buy")
  const [selectedToken, setSelectedToken] = useState<CreatedToken | null>(null)
  const [amount, setAmount] = useState("")
  const [estimatedOutput, setEstimatedOutput] = useState("0")
  
  useEffect(() => {
    const allTokens = getCreatedTokens()
    setTokens(allTokens)
    if (allTokens.length > 0) {
      setSelectedToken(allTokens[0])
    }
  }, [])

  const handleAmountChange = (value: string) => {
    setAmount(value)
    // Dummy calculation for estimated output
    if (selectedToken) {
      const est = (Number.parseFloat(value) * selectedToken.price * 0.95).toFixed(2)
      setEstimatedOutput(est || "0")
    }
  }

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Trade Tokens</h1>
        <p className="text-gray-400">Buy, Sell, or Stake your tokens in one place</p>
      </div>

      {tokens.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <TrendingUp size={48} className="text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Tokens Available</h3>
          <p className="text-gray-400 mb-6">Create a token first to start trading!</p>
          <Link href="/create">
            <Button className="bg-[#9CFFBB] text-[#0A0A0A] hover:bg-[#5CFF71]">
              <Plus size={18} className="mr-2" />
              Create Token
            </Button>
          </Link>
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Token Selector */}
        <div className="lg:col-span-1">
          <Card className="bg-[#111111] border-[#9CFFBB]/10">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Select Token</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {tokens.slice(0, 10).map((token) => (
                  <button
                    key={token.id}
                    onClick={() => setSelectedToken(token)}
                    className={`w-full p-3 rounded-lg text-left transition-all ${
                      selectedToken?.id === token.id
                        ? "bg-[#9CFFBB]/20 border border-[#9CFFBB]"
                        : "bg-[#1a1a1a] border border-transparent hover:bg-[#1a1a1a]/80"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{token.name}</p>
                        <p className="text-xs text-gray-400">{token.symbol}</p>
                      </div>
                      <p className="text-sm font-semibold text-[#9CFFBB]">${token.price.toFixed(4)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Trading Interface */}
        <div className="lg:col-span-2">
          <Card className="bg-[#111111] border-[#9CFFBB]/10">
            <div className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6 bg-[#1a1a1a]">
                  <TabsTrigger value="buy" className="data-[state=active]:bg-[#9CFFBB]/20">
                    <TrendingUp size={18} className="mr-2" />
                    Buy
                  </TabsTrigger>
                  <TabsTrigger value="sell" className="data-[state=active]:bg-[#9CFFBB]/20">
                    <TrendingDown size={18} className="mr-2" />
                    Sell
                  </TabsTrigger>
                  <TabsTrigger value="stake" className="data-[state=active]:bg-[#9CFFBB]/20">
                    <Lock size={18} className="mr-2" />
                    Stake
                  </TabsTrigger>
                </TabsList>

                {/* Buy Tab */}
                <TabsContent value="buy" className="space-y-4">
                  <div>
                    <Label className="text-gray-300 mb-2 block">Amount (ADA)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      className="bg-[#1a1a1a] border-[#9CFFBB]/20 text-white"
                    />
                  </div>

                  <div className="bg-[#1a1a1a] p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400 text-sm">Price</span>
                      <span className="text-white font-medium">${selectedToken.price.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400 text-sm">Platform Fee (1%)</span>
                      <span className="text-white font-medium">
                        {(Number.parseFloat(amount) * 0.01).toFixed(4)} ADA
                      </span>
                    </div>
                    <div className="border-t border-[#9CFFBB]/10 pt-2 mt-2 flex justify-between items-center">
                      <span className="text-gray-300 font-medium">You get</span>
                      <span className="text-[#9CFFBB] font-bold text-lg">
                        {(Number.parseFloat(estimatedOutput) / selectedToken.price).toFixed(0)} {selectedToken.symbol}
                      </span>
                    </div>
                  </div>

                  <Button className="w-full bg-gradient-to-r from-[#9CFFBB] to-[#5CFF71] text-[#0A0A0A] font-semibold h-12">
                    Buy {selectedToken.symbol}
                  </Button>
                </TabsContent>

                {/* Sell Tab */}
                <TabsContent value="sell" className="space-y-4">
                  <div>
                    <Label className="text-gray-300 mb-2 block">Amount ({selectedToken.symbol})</Label>
                    <Input type="number" placeholder="0.00" className="bg-[#1a1a1a] border-[#9CFFBB]/20 text-white" />
                  </div>

                  <div className="bg-[#1a1a1a] p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400 text-sm">Price</span>
                      <span className="text-white font-medium">${selectedToken.price.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400 text-sm">Platform Fee (1%)</span>
                      <span className="text-white font-medium">- ADA</span>
                    </div>
                    <div className="border-t border-[#9CFFBB]/10 pt-2 mt-2 flex justify-between items-center">
                      <span className="text-gray-300 font-medium">You receive</span>
                      <span className="text-[#9CFFBB] font-bold text-lg">0.00 ADA</span>
                    </div>
                  </div>

                  <Button className="w-full bg-gradient-to-r from-[#5CFF71] to-[#3dd95a] text-[#0A0A0A] font-semibold h-12">
                    Sell {selectedToken.symbol}
                  </Button>
                </TabsContent>

                {/* Stake Tab */}
                <TabsContent value="stake" className="space-y-4">
                  <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#9CFFBB]/20 mb-4">
                    <p className="text-gray-400 text-sm mb-2">Staking APY</p>
                    <p className="text-3xl font-bold text-[#9CFFBB]">12.5%</p>
                  </div>

                  <div>
                    <Label className="text-gray-300 mb-2 block">Amount ({selectedToken.symbol})</Label>
                    <Input type="number" placeholder="0.00" className="bg-[#1a1a1a] border-[#9CFFBB]/20 text-white" />
                  </div>

                  <div className="bg-[#1a1a1a] p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400 text-sm">Annual Rewards (12.5%)</span>
                      <span className="text-white font-medium">0.00 {selectedToken.symbol}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Unlock Period</span>
                      <span className="text-white font-medium">30 days</span>
                    </div>
                  </div>

                  <Button className="w-full bg-gradient-to-r from-[#9CFFBB] to-[#5CFF71] text-[#0A0A0A] font-semibold h-12">
                    Stake Tokens
                  </Button>
                </TabsContent>
              </Tabs>
            </div>
          </Card>

          {/* Token Info */}
          {selectedToken && (
          <Card className="bg-[#111111] border-[#9CFFBB]/10 mt-6">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Token Information</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Market Cap</p>
                  <p className="text-white font-semibold">
                    ${selectedToken.marketCap.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">24h Volume</p>
                  <p className="text-white font-semibold">${selectedToken.volume24h.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Holders</p>
                  <p className="text-white font-semibold">{selectedToken.holders.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">24h Change</p>
                  <p
                    className={`font-semibold ${selectedToken.priceChange24h >= 0 ? "text-[#9CFFBB]" : "text-red-500"}`}
                  >
                    {selectedToken.priceChange24h > 0 ? "+" : ""}
                    {selectedToken.priceChange24h.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          </Card>
          )}
        </div>
      </div>
      )}
    </div>
  )
}
