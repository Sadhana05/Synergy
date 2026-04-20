import Image from "next/image"
import Link from "next/link"
import type { PortfolioHolding } from "@/lib/types"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PortfolioListProps {
  holdings: PortfolioHolding[]
}

export function PortfolioList({ holdings }: PortfolioListProps) {
  const totalValue = holdings.reduce((acc, h) => acc + h.currentValue, 0)
  const totalPnl = holdings.reduce((acc, h) => acc + h.pnl, 0)
  const totalPnlPercent = (totalPnl / (totalValue - totalPnl)) * 100

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-gray-400">Total Value</p>
          <p className="text-2xl font-bold text-white">{totalValue.toLocaleString()} ADA</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-gray-400">Total P&L</p>
          <p
            className={cn(
              "text-2xl font-bold flex items-center gap-2",
              totalPnl >= 0 ? "text-[#5CFF71]" : "text-red-400",
            )}
          >
            {totalPnl >= 0 ? "+" : ""}
            {totalPnl.toFixed(2)} ADA
            <span className="text-sm">
              ({totalPnlPercent >= 0 ? "+" : ""}
              {totalPnlPercent.toFixed(1)}%)
            </span>
          </p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-gray-400">Holdings</p>
          <p className="text-2xl font-bold text-white">{holdings.length} tokens</p>
        </div>
      </div>

      {/* Holdings List */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#9CFFBB]/10">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Token</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Amount</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-400 hidden sm:table-cell">
                Avg. Price
              </th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Value</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">P&L</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-400 hidden md:table-cell">Actions</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((holding) => (
              <tr key={holding.token.id} className="border-b border-[#9CFFBB]/5 hover:bg-[#9CFFBB]/5 transition-colors">
                <td className="py-4 px-4">
                  <Link href={`/tokens/${holding.token.id}`} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#1A1A1A]">
                      <Image
                        src={holding.token.image || "/placeholder.svg"}
                        alt={holding.token.name}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-white hover:text-[#9CFFBB] transition-colors">
                        {holding.token.name}
                      </p>
                      <p className="text-xs text-gray-500">{holding.token.symbol}</p>
                    </div>
                  </Link>
                </td>
                <td className="py-4 px-4 text-right text-white">{holding.amount.toLocaleString()}</td>
                <td className="py-4 px-4 text-right text-gray-400 hidden sm:table-cell">
                  {holding.avgBuyPrice.toFixed(6)} ADA
                </td>
                <td className="py-4 px-4 text-right text-white font-medium">{holding.currentValue.toFixed(2)} ADA</td>
                <td className="py-4 px-4 text-right">
                  <div
                    className={cn(
                      "flex items-center justify-end gap-1",
                      holding.pnl >= 0 ? "text-[#5CFF71]" : "text-red-400",
                    )}
                  >
                    {holding.pnl >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    <span className="font-medium">
                      {holding.pnl >= 0 ? "+" : ""}
                      {holding.pnl.toFixed(2)}
                    </span>
                    <span className="text-xs">
                      ({holding.pnlPercent >= 0 ? "+" : ""}
                      {holding.pnlPercent.toFixed(1)}%)
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4 text-right hidden md:table-cell">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-[#9CFFBB]/30 text-[#9CFFBB] hover:bg-[#9CFFBB]/10 bg-transparent"
                    >
                      Buy
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10 bg-transparent"
                    >
                      Sell
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
