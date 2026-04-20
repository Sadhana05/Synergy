"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { TokenCard } from "@/components/token-card"
import { FilterBar } from "@/components/filter-bar"
import { Button } from "@/components/ui/button"
import { getCreatedTokens, type CreatedToken } from "@/lib/token-storage"
import { Flame, Plus } from "lucide-react"

export default function TrendingPage() {
  const [tokens, setTokens] = useState<CreatedToken[]>([])
  
  useEffect(() => {
    const allTokens = getCreatedTokens()
    setTokens([...allTokens].sort((a, b) => b.volume24h - a.volume24h))
  }, [])

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-2">
        <Flame size={28} className="text-orange-400" />
        <h1 className="text-3xl font-bold text-white">Trending Tokens</h1>
      </div>
      <p className="text-gray-400 mb-8">Tokens with the highest trading volume in the last 24 hours</p>

      <div className="mb-6">
        <FilterBar />
      </div>

      {tokens.length > 0 ? (
        <>
          {/* Top 3 Featured */}
          {tokens.length >= 3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {tokens.slice(0, 3).map((token, i) => (
                <div key={token.id} className="relative">
                  <div className="absolute -top-2 -left-2 z-10 w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    {i + 1}
                  </div>
                  <Link href={`/tokens/${token.id}`}>
                    <TokenCard token={token} rank={i + 1} />
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Rest of Tokens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tokens.slice(tokens.length >= 3 ? 3 : 0).map((token, i) => (
              <Link key={token.id} href={`/tokens/${token.id}`}>
                <TokenCard token={token} rank={tokens.length >= 3 ? i + 4 : i + 1} />
              </Link>
            ))}
          </div>
        </>
      ) : (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Flame size={48} className="text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Trending Tokens</h3>
          <p className="text-gray-400 mb-6">Create a token to see it trending here!</p>
          <Link href="/create">
            <Button className="bg-[#9CFFBB] text-[#0A0A0A] hover:bg-[#5CFF71]">
              <Plus size={18} className="mr-2" />
              Create Token
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
