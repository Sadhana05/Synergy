import Link from "next/link"
import Image from "next/image"
import type { Battle } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Trophy, Clock, Users, Zap } from "lucide-react"

interface BattleCardProps {
  battle: Battle
}

export function BattleCard({ battle }: BattleCardProps) {
  const statusColors = {
    active: "bg-[#5CFF71] text-[#0A0A0A]",
    upcoming: "bg-yellow-500 text-[#0A0A0A]",
    ended: "bg-gray-500 text-white",
  }

  const getTimeRemaining = () => {
    const end = new Date(battle.endTime)
    const now = new Date()
    const diff = end.getTime() - now.getTime()

    if (diff <= 0) return "Ended"

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    return `${days}d ${hours}h left`
  }

  return (
    <Link href={`/arena/${battle.id}`}>
      <div className="glass-card rounded-2xl p-6 hover:border-[#9CFFBB]/30 transition-all group cursor-pointer">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap size={20} className="text-[#9CFFBB]" />
              <h3 className="text-lg font-bold text-white group-hover:text-[#9CFFBB] transition-colors">
                {battle.name}
              </h3>
            </div>
            <span className={cn("px-2 py-1 rounded-full text-xs font-medium", statusColors[battle.status])}>
              {battle.status.charAt(0).toUpperCase() + battle.status.slice(1)}
            </span>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Prize Pool</p>
            <p className="text-xl font-bold text-[#9CFFBB]">{battle.prizePool.toLocaleString()} ADA</p>
          </div>
        </div>

        {battle.status !== "upcoming" && battle.participants.length > 0 && (
          <div className="space-y-2 mb-4">
            {battle.participants.slice(0, 3).map((participant, index) => (
              <div key={participant.tokenId} className="flex items-center justify-between p-2 rounded-lg bg-[#1A1A1A]">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                      index === 0
                        ? "bg-yellow-500 text-[#0A0A0A]"
                        : index === 1
                          ? "bg-gray-400 text-[#0A0A0A]"
                          : "bg-amber-700 text-white",
                    )}
                  >
                    {index + 1}
                  </span>
                  <div className="w-6 h-6 rounded-full overflow-hidden">
                    <Image
                      src={participant.token.image || "/placeholder.svg"}
                      alt={participant.token.name}
                      width={24}
                      height={24}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-sm text-white">{participant.token.name}</span>
                </div>
                <span className="text-sm font-medium text-[#9CFFBB]">{participant.score.toLocaleString()} pts</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-[#9CFFBB]/10">
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <Users size={14} />
              {battle.participants.length} tokens
            </span>
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {getTimeRemaining()}
            </span>
          </div>
          <Trophy size={18} className="text-[#9CFFBB]" />
        </div>
      </div>
    </Link>
  )
}
