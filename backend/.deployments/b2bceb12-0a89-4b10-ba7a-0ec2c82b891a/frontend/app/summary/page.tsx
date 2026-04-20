"use client"

import React, { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { getCreatedTokens, type CreatedToken } from '@/lib/token-storage'
import { TokenCard } from '@/components/token-card'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, Coins, Trophy, TrendingUp, Flame, Lock, Plus } from 'lucide-react'

function StatCard({ icon: Icon, label, value, color = 'text-[#9CFFBB]' }: { icon: React.ElementType; label: string; value: string | number; color?: string }) {
  return (
    <div className="glass-card rounded-xl p-4 sm:p-5 border border-[#9CFFBB]/10">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-[#111]">
          <Icon size={22} className={color} />
        </div>
        <div>
          <div className={`text-2xl font-bold ${color}`}>{value}</div>
          <div className="text-xs text-gray-500">{label}</div>
        </div>
      </div>
    </div>
  )
}

function LeaderCard({ title, icon: Icon, items, valueKey, valueLabel }: { title: string; icon: React.ElementType; items: { id: string; name: string; [key: string]: string | number }[]; valueKey: string; valueLabel: string }) {
  return (
    <div className="glass-card rounded-2xl border border-[#9CFFBB]/10 overflow-hidden">
      <div className="p-4 border-b border-[#9CFFBB]/10 flex items-center gap-2">
        <Icon size={18} className="text-[#9CFFBB]" />
        <h3 className="font-semibold text-white">{title}</h3>
      </div>
      <div className="divide-y divide-[#9CFFBB]/5">
        {items.map((item, idx) => (
          <div key={item.id} className="p-4 flex items-center justify-between hover:bg-[#9CFFBB]/5 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                idx === 0 ? 'bg-[#9CFFBB] text-[#0A0A0A]' : 'bg-[#111] text-gray-400'
              }`}>
                {idx + 1}
              </div>
              <span className="font-medium text-white">{item.name}</span>
            </div>
            <div className="text-right">
              <div className="font-semibold text-[#9CFFBB]">{item[valueKey]?.toLocaleString()}</div>
              <div className="text-xs text-gray-500">{valueLabel}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SummaryPage() {
  const [tokens, setTokens] = useState<CreatedToken[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load tokens from localStorage
    const allTokens = getCreatedTokens()
    setTokens(allTokens)
    setLoading(false)
  }, [])

  // Calculate summary data from localStorage tokens
  const data = useMemo(() => {
    if (tokens.length === 0) {
      return null
    }
    
    // Top token by market cap
    const topToken = [...tokens].sort((a, b) => b.marketCap - a.marketCap)[0]
    
    // Influence leaders (by holders)
    const influenceLeaders = [...tokens]
      .sort((a, b) => b.holders - a.holders)
      .slice(0, 3)
      .map(t => ({ id: t.id, name: t.name, score: t.holders * 10 }))
    
    // Most staked (simulated based on reserve)
    const mostStaked = [...tokens]
      .sort((a, b) => b.reserveAda - a.reserveAda)
      .slice(0, 3)
      .map(t => ({ id: t.id, name: t.name, staked: Math.floor(t.reserveAda * 0.3) }))
    
    // Most traded (by volume)
    const mostTraded = [...tokens]
      .sort((a, b) => b.volume24h - a.volume24h)
      .slice(0, 3)
      .map(t => ({ id: t.id, name: t.name, volume: t.volume24h }))
    
    return {
      totalTokens: tokens.length,
      topToken,
      influenceLeaders,
      mostStaked,
      mostTraded,
    }
  }, [tokens])

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <LayoutDashboard className="text-[#9CFFBB]" size={28} />
            Marketplace Summary
          </h1>
          <p className="text-gray-400 mt-1">Overview of the token marketplace</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="px-3 py-1 rounded-full bg-[#9CFFBB]/10 text-[#9CFFBB] font-medium">
            Live Data
          </span>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-[#111] rounded-xl" />)}
          </div>
        </div>
      ) : !data ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Coins size={48} className="text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Marketplace Data</h3>
          <p className="text-gray-400 mb-6">Create tokens to see marketplace summary and statistics!</p>
          <Link href="/create">
            <Button className="bg-[#9CFFBB] text-[#0A0A0A] hover:bg-[#5CFF71]">
              <Plus size={18} className="mr-2" />
              Create Your First Token
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
            <StatCard icon={Coins} label="Total Tokens" value={data.totalTokens} />
            <StatCard icon={TrendingUp} label="Influence Leaders" value={data.influenceLeaders.length} color="text-[#5CFF71]" />
            <StatCard icon={Lock} label="Most Staked" value={data.mostStaked.length} color="text-yellow-400" />
            <StatCard icon={Flame} label="Most Traded" value={data.mostTraded.length} color="text-orange-400" />
          </div>

          {/* Top Token */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Trophy size={20} className="text-[#9CFFBB]" />
              Top Token (Highest Market Cap)
            </h2>
            <Link href={`/tokens/${data.topToken.id}`} className="block max-w-md">
              <TokenCard token={data.topToken} rank={1} />
            </Link>
          </div>

          {/* Leaderboards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            <LeaderCard 
              title="Influence Leaders" 
              icon={TrendingUp} 
              items={data.influenceLeaders} 
              valueKey="score" 
              valueLabel="score" 
            />
            <LeaderCard 
              title="Most Staked Tokens" 
              icon={Lock} 
              items={data.mostStaked} 
              valueKey="staked" 
              valueLabel="ADA staked" 
            />
            <LeaderCard 
              title="Most Traded Tokens" 
              icon={Flame} 
              items={data.mostTraded} 
              valueKey="volume" 
              valueLabel="ADA volume" 
            />
          </div>
        </>
      )}
    </div>
  )
}
