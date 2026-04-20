import Image from "next/image"
import Link from "next/link"
import type { BattleParticipant } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Trophy } from "lucide-react"

interface LeaderboardTableProps {
  participants: BattleParticipant[]
  prizeDistribution?: number[]
}

export function LeaderboardTable({ participants, prizeDistribution = [50, 30, 20] }: LeaderboardTableProps) {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-[#9CFFBB]/10">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Trophy size={20} className="text-[#9CFFBB]" />
          Leaderboard
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#9CFFBB]/10">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Rank</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Token</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Score</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-400 hidden sm:table-cell">Volume</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-400 hidden md:table-cell">Buys</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-400 hidden lg:table-cell">
                New Holders
              </th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Prize</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((participant, index) => (
              <tr
                key={participant.tokenId}
                className={cn("border-b border-[#9CFFBB]/5 transition-colors", index < 3 && "bg-[#9CFFBB]/5")}
              >
                <td className="py-4 px-4">
                  <span
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm",
                      index === 0
                        ? "bg-yellow-500 text-[#0A0A0A]"
                        : index === 1
                          ? "bg-gray-400 text-[#0A0A0A]"
                          : index === 2
                            ? "bg-amber-700 text-white"
                            : "bg-[#1A1A1A] text-gray-400",
                    )}
                  >
                    {participant.rank}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <Link href={`/tokens/${participant.tokenId}`} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#1A1A1A]">
                      <Image
                        src={participant.token.image || "/placeholder.svg"}
                        alt={participant.token.name}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-white hover:text-[#9CFFBB] transition-colors">
                        {participant.token.name}
                      </p>
                      <p className="text-xs text-gray-500">{participant.token.symbol}</p>
                    </div>
                  </Link>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="font-bold text-[#9CFFBB]">{participant.score.toLocaleString()}</span>
                </td>
                <td className="py-4 px-4 text-right text-gray-300 hidden sm:table-cell">
                  {(participant.volume / 1000).toFixed(1)}K ADA
                </td>
                <td className="py-4 px-4 text-right text-gray-300 hidden md:table-cell">{participant.buyCount}</td>
                <td className="py-4 px-4 text-right text-gray-300 hidden lg:table-cell">+{participant.newHolders}</td>
                <td className="py-4 px-4 text-right">
                  {index < prizeDistribution.length ? (
                    <span className="text-[#9CFFBB] font-medium">{prizeDistribution[index]}%</span>
                  ) : (
                    <span className="text-gray-500">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
