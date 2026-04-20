"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { TokenCard } from "@/components/token-card"
import { mockBattles } from "@/lib/mock-data"
import { getCreatedTokens, type CreatedToken } from "@/lib/token-storage"
import { ArrowRight, Zap, TrendingUp, Plus, Trophy, Sparkles } from "lucide-react"

export default function HomePage() {
  const [tokens, setTokens] = useState<CreatedToken[]>([])
  
  useEffect(() => {
    setTokens(getCreatedTokens())
  }, [])
  
  const trendingTokens = tokens.slice(0, 4)
  const topGainers = [...tokens].sort((a, b) => b.priceChange24h - a.priceChange24h).slice(0, 4)
  const newestTokens = [...tokens]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4)
  const activeBattle = mockBattles.find((b) => b.status === "active")

  return (
    <div className="flex-1">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#9CFFBB]/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-[#9CFFBB]/10 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-72 h-72 bg-[#5CFF71]/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <Link href="/ai-agents">
              <button className="group relative inline-flex items-center gap-3 px-6 py-3 mb-6 overflow-hidden rounded-full transition-all duration-500 hover:scale-105">
                {/* Animated gradient border */}
                <span className="absolute inset-0 rounded-full bg-gradient-to-r from-[#9CFFBB] via-[#5CFF71] to-[#9CFFBB] opacity-30 blur-sm group-hover:opacity-60 transition-opacity duration-500 animate-[spin_3s_linear_infinite]" style={{ backgroundSize: '200% 200%' }} />
                <span className="absolute inset-[1px] rounded-full bg-[#0A0A0A] z-0" />
                
                {/* Glow effect on hover */}
                <span className="absolute inset-0 rounded-full bg-gradient-to-r from-[#9CFFBB]/0 via-[#5CFF71]/20 to-[#9CFFBB]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                
                {/* Scanning line effect */}
                <span className="absolute inset-0 rounded-full overflow-hidden z-10">
                  <span className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-[#9CFFBB]/20 to-transparent group-hover:left-[100%] transition-all duration-1000 ease-in-out" />
                </span>
                
                {/* Content */}
                <span className="relative z-20 flex items-center justify-center gap-3">
                  <span className="relative flex h-8 w-8 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#9CFFBB]/40 opacity-75 group-hover:opacity-100" />
                    <span className="relative inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#9CFFBB] to-[#5CFF71]">
                      <Sparkles size={14} className="text-[#0A0A0A]" />
                    </span>
                  </span>
                  <span className="text-sm font-semibold text-[#9CFFBB] tracking-wide">Built on Midnight</span>
                  <span className="flex items-center gap-1 text-xs text-[#5CFF71] max-w-0 overflow-hidden group-hover:max-w-[100px] transition-all duration-500 ease-out">
                    <span className="whitespace-nowrap">AI Agents</span>
                    <ArrowRight size={14} className="animate-pulse" />
                  </span>
                </span>
              </button>
            </Link>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Create & Trade{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9CFFBB] to-[#5CFF71]">
                Meme Tokens
              </span>{" "}
              on Midnight
            </h1>

            <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
              The apex predator of meme token platforms. Launch your token in seconds with automatic bonding curve
              pricing. No liquidity needed.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/create">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-[#9CFFBB] to-[#5CFF71] text-[#0A0A0A] font-semibold hover:opacity-90 glow-mint"
                >
                  <Plus size={20} className="mr-2" />
                  Create Token
                </Button>
              </Link>
              <Link href="/tokens">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-[#9CFFBB]/30 text-white hover:bg-[#9CFFBB]/10 bg-transparent"
                >
                  Explore Tokens
                  <ArrowRight size={20} className="ml-2" />
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 max-w-lg mx-auto">
              <div>
                <p className="text-3xl font-bold text-[#9CFFBB]">$2.4M</p>
                <p className="text-sm text-gray-400 mt-1">Total Volume</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-[#9CFFBB]">1,234</p>
                <p className="text-sm text-gray-400 mt-1">Tokens Created</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-[#9CFFBB]">12.5K</p>
                <p className="text-sm text-gray-400 mt-1">Active Traders</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Active Battle Banner */}
      {activeBattle && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <Link href={`/arena/${activeBattle.id}`}>
            <div className="glass-card rounded-2xl p-6 border-[#9CFFBB]/30 hover:border-[#9CFFBB]/50 transition-all group">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#9CFFBB] to-[#5CFF71] flex items-center justify-center">
                    <Zap size={28} className="text-[#0A0A0A]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-[#5CFF71] text-[#0A0A0A] text-xs font-bold rounded-full animate-pulse">
                        LIVE
                      </span>
                      <h3 className="text-xl font-bold text-white">{activeBattle.name}</h3>
                    </div>
                    <p className="text-gray-400 text-sm">Battle Arena is live! Compete for the prize pool.</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[#9CFFBB]">{activeBattle.prizePool.toLocaleString()} ADA</p>
                    <p className="text-xs text-gray-400">Prize Pool</p>
                  </div>
                  <Button className="bg-[#9CFFBB] text-[#0A0A0A] hover:bg-[#5CFF71] group-hover:scale-105 transition-transform">
                    Join Battle
                    <ArrowRight size={18} className="ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Trending Tokens */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <TrendingUp size={24} className="text-[#9CFFBB]" />
            <h2 className="text-2xl font-bold text-white">Trending Tokens</h2>
          </div>
          <Link
            href="/trending"
            className="text-[#9CFFBB] hover:text-[#5CFF71] flex items-center gap-1 text-sm font-medium"
          >
            View All <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {trendingTokens.map((token, i) => (
            <TokenCard key={token.id} token={token} rank={i + 1} />
          ))}
        </div>
      </section>

      {/* Top Gainers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Trophy size={24} className="text-[#9CFFBB]" />
            <h2 className="text-2xl font-bold text-white">Top Gainers</h2>
          </div>
          <Link
            href="/tokens?filter=gainers"
            className="text-[#9CFFBB] hover:text-[#5CFF71] flex items-center gap-1 text-sm font-medium"
          >
            View All <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {topGainers.map((token) => (
            <TokenCard key={token.id} token={token} />
          ))}
        </div>
      </section>

      {/* Newest Tokens */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Sparkles size={24} className="text-[#9CFFBB]" />
            <h2 className="text-2xl font-bold text-white">Newest Tokens</h2>
          </div>
          <Link
            href="/tokens?filter=new"
            className="text-[#9CFFBB] hover:text-[#5CFF71] flex items-center gap-1 text-sm font-medium"
          >
            View All <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {newestTokens.map((token) => (
            <TokenCard key={token.id} token={token} />
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-white text-center mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: "1",
              title: "Create Your Token",
              description:
                "Set your token name, symbol, and bonding curve parameters. Launch in seconds with no upfront liquidity.",
            },
            {
              step: "2",
              title: "Trade Instantly",
              description:
                "Buy and sell tokens directly through the bonding curve. Price adjusts automatically based on supply and demand.",
            },
            {
              step: "3",
              title: "Earn & Compete",
              description:
                "Creators earn fees on every trade. Enter Battle Arena competitions to win additional prizes.",
            },
          ].map((item) => (
            <div key={item.step} className="glass-card rounded-2xl p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#9CFFBB] to-[#5CFF71] flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-[#0A0A0A]">{item.step}</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-gray-400 text-sm">{item.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
