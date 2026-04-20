"use client"

import Link from "next/link"
import Image from "next/image"
import type { Token } from "@/lib/types"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface TokenTableProps {
  tokens: Token[]
  showRank?: boolean
}

export function TokenTable({ tokens, showRank = true }: TokenTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#9CFFBB]/10">
            {showRank && <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">#</th>}
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Token</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Price</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">24h</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-gray-400 hidden sm:table-cell">Volume</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-gray-400 hidden md:table-cell">Market Cap</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-gray-400 hidden lg:table-cell">Holders</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((token, index) => {
            const isPositive = token.priceChange24h >= 0
            return (
              <tr
                key={token.id}
                className="border-b border-[#9CFFBB]/5 hover:bg-[#9CFFBB]/5 transition-colors cursor-pointer"
              >
                {showRank && <td className="py-4 px-4 text-sm text-gray-400">{index + 1}</td>}
                <td className="py-4 px-4">
                  <Link href={`/tokens/${token.id}`} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#1A1A1A] flex-shrink-0">
                      <Image
                        src={token.image || "/placeholder.svg"}
                        alt={token.name}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-white hover:text-[#9CFFBB] transition-colors">{token.name}</p>
                      <p className="text-xs text-gray-500">{token.symbol}</p>
                    </div>
                  </Link>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="font-medium text-white">
                    {token.price < 0.01 ? token.price.toFixed(6) : token.price.toFixed(4)}
                  </span>
                  <span className="text-gray-500 text-sm ml-1">ADA</span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span
                    className={cn(
                      "flex items-center justify-end gap-1 font-medium",
                      isPositive ? "text-[#5CFF71]" : "text-red-400",
                    )}
                  >
                    {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {Math.abs(token.priceChange24h).toFixed(1)}%
                  </span>
                </td>
                <td className="py-4 px-4 text-right text-gray-300 hidden sm:table-cell">
                  {(token.volume24h / 1000).toFixed(1)}K ADA
                </td>
                <td className="py-4 px-4 text-right text-gray-300 hidden md:table-cell">
                  {(token.marketCap / 1000).toFixed(1)}K ADA
                </td>
                <td className="py-4 px-4 text-right text-gray-300 hidden lg:table-cell">
                  {token.holders.toLocaleString()}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
