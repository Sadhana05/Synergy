import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react"

interface CreatorStatsCardProps {
  title: string
  value: string | number
  change?: number
  icon: LucideIcon
  prefix?: string
  suffix?: string
}

export function CreatorStatsCard({
  title,
  value,
  change,
  icon: Icon,
  prefix = "",
  suffix = "",
}: CreatorStatsCardProps) {
  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-white">
            {prefix}
            {typeof value === "number" ? value.toLocaleString() : value}
            {suffix}
          </p>
          {change !== undefined && (
            <p className={cn("text-sm mt-2 flex items-center gap-1", change >= 0 ? "text-[#5CFF71]" : "text-red-400")}>
              {change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {change >= 0 ? "+" : ""}
              {change}% from last week
            </p>
          )}
        </div>
        <div className="w-12 h-12 rounded-xl bg-[#9CFFBB]/10 flex items-center justify-center">
          <Icon size={24} className="text-[#9CFFBB]" />
        </div>
      </div>
    </div>
  )
}
