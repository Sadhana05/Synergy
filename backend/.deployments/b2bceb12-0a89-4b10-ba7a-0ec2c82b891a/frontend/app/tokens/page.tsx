"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { TokenTable } from "@/components/token-table"
import { FilterBar } from "@/components/filter-bar"
import { Button } from "@/components/ui/button"
import { getCreatedTokens, type CreatedToken } from "@/lib/token-storage"
import { Coins, Plus } from "lucide-react"

export default function TokensPage() {
  const [tokens, setTokens] = useState<CreatedToken[]>([])
  
  useEffect(() => {
    setTokens(getCreatedTokens())
  }, [])
  
  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Coins size={28} className="text-[#9CFFBB]" />
          <h1 className="text-3xl font-bold text-white">All Tokens</h1>
        </div>
        <Link href="/create">
          <Button className="bg-[#9CFFBB] text-[#0A0A0A] hover:bg-[#5CFF71]">
            <Plus size={18} className="mr-2" />
            Create Token
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <FilterBar />
      </div>

      {tokens.length > 0 ? (
        <div className="glass-card rounded-2xl overflow-hidden">
          <TokenTable tokens={tokens} />
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Coins size={48} className="text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Tokens Yet</h3>
          <p className="text-gray-400 mb-6">Be the first to create a token on the platform!</p>
          <Link href="/create">
            <Button className="bg-[#9CFFBB] text-[#0A0A0A] hover:bg-[#5CFF71]">
              <Plus size={18} className="mr-2" />
              Create Your First Token
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
