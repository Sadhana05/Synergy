"use client"

import { useState, useEffect, use } from "react"
import Image from "next/image"
import Link from "next/link"
import { mockTrades } from "@/lib/mock-data"
import { getTokenById, type CreatedToken } from "@/lib/token-storage"
import { TokenChart } from "@/components/token-chart"
import { BuyWidget } from "@/components/buy-widget"
import { SellWidget } from "@/components/sell-widget"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Users, Share2, ExternalLink, Clock, Activity, Info, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function TokenDetailsPage({ params }: PageProps) {
  const { id } = use(params)
  const [token, setToken] = useState<CreatedToken | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const foundToken = getTokenById(id)
    setToken(foundToken)
    setLoading(false)
  }, [id])
  
  if (loading) {
    return (
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-16 w-16 bg-gray-700 rounded-2xl mb-4"></div>
          <div className="h-8 w-64 bg-gray-700 rounded mb-2"></div>
          <div className="h-4 w-96 bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }
  
  if (!token) {
    return (
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/tokens" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6">
          <ArrowLeft size={18} />
          Back to Tokens
        </Link>
        <div className="glass-card rounded-2xl p-12 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Token Not Found</h2>
          <p className="text-gray-400 mb-6">The token you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Link href="/tokens">
            <Button className="bg-[#9CFFBB] text-[#0A0A0A] hover:bg-[#5CFF71]">Browse All Tokens</Button>
          </Link>
        </div>
      </div>
    )
  }
  
  const isPositive = token.priceChange24h >= 0

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#1A1A1A]">
            <Image
              src={token.image || "/placeholder.svg"}
              alt={token.name}
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white">{token.name}</h1>
              <span className="px-2 py-1 bg-[#1A1A1A] rounded-lg text-sm text-gray-400 uppercase">{token.symbol}</span>
            </div>
            <p className="text-gray-400 mt-1">{token.description}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            className="border-[#9CFFBB]/30 text-gray-400 hover:text-white bg-transparent"
          >
            <Share2 size={16} className="mr-2" />
            Share
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-[#9CFFBB]/30 text-gray-400 hover:text-white bg-transparent"
          >
            <ExternalLink size={16} className="mr-2" />
            Explorer
          </Button>
        </div>
      </div>

      {/* Price & Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="glass-card rounded-xl p-4 col-span-2">
          <p className="text-sm text-gray-400">Price</p>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-white">
              {token.price < 0.01 ? token.price.toFixed(6) : token.price.toFixed(4)} ADA
            </span>
            <span
              className={cn(
                "flex items-center gap-1 text-lg font-medium",
                isPositive ? "text-[#5CFF71]" : "text-red-400",
              )}
            >
              {isPositive ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
              {Math.abs(token.priceChange24h).toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-gray-400">Market Cap</p>
          <p className="text-xl font-bold text-white">{(token.marketCap / 1000).toFixed(1)}K ADA</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-gray-400">24h Volume</p>
          <p className="text-xl font-bold text-white">{(token.volume24h / 1000).toFixed(1)}K ADA</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-gray-400">Holders</p>
          <p className="text-xl font-bold text-white flex items-center gap-2">
            <Users size={18} className="text-[#9CFFBB]" />
            {token.holders.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart & Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chart */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Price Chart</h2>
              <div className="flex gap-2">
                {["1H", "24H", "7D", "30D", "ALL"].map((period) => (
                  <button
                    key={period}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-medium transition-colors",
                      period === "7D"
                        ? "bg-[#9CFFBB]/20 text-[#9CFFBB]"
                        : "text-gray-400 hover:text-white hover:bg-white/5",
                    )}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
            <TokenChart tokenId={token.id} height={350} />
          </div>

          {/* Curve Parameters */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Activity size={20} className="text-[#9CFFBB]" />
              Bonding Curve Parameters
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-400">Curve Type</p>
                <p className="text-sm font-medium text-white capitalize">{token.curveType}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Creator Fee</p>
                <p className="text-sm font-medium text-[#9CFFBB]">{token.creatorFee}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Reserve</p>
                <p className="text-sm font-medium text-white">{token.reserveAda.toLocaleString()} ADA</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Total Supply</p>
                <p className="text-sm font-medium text-white">{(token.totalSupply / 1000000).toFixed(1)}M</p>
              </div>
            </div>
          </div>

          {/* Recent Trades */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock size={20} className="text-[#9CFFBB]" />
              Recent Trades
            </h2>
            <div className="space-y-2">
              {mockTrades.map((trade) => (
                <div key={trade.id} className="flex items-center justify-between p-3 rounded-lg bg-[#1A1A1A]">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "px-2 py-1 rounded text-xs font-medium",
                        trade.type === "buy" ? "bg-[#5CFF71]/20 text-[#5CFF71]" : "bg-red-500/20 text-red-400",
                      )}
                    >
                      {trade.type.toUpperCase()}
                    </span>
                    <span className="text-sm text-white">
                      {trade.amount.toLocaleString()} {token.symbol}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white">{trade.totalAda.toFixed(2)} ADA</p>
                    <p className="text-xs text-gray-500">{new Date(trade.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trading Widgets */}
        <div className="space-y-6">
          <BuyWidget token={token} />
          <SellWidget token={token} />

          {/* Token Info */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Info size={20} className="text-[#9CFFBB]" />
              Token Info
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Created</span>
                <span className="text-white">{new Date(token.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Creator</span>
                <span className="text-[#9CFFBB] font-mono text-xs">
                  {token.creatorAddress.slice(0, 8)}...{token.creatorAddress.slice(-4)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Network</span>
                <span className="text-white">Midnight</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
