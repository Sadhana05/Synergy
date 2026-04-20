"use client"
import Link from "next/link"
import { mockPortfolio } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { TokenCard } from "@/components/token-card"
import {
  User,
  Wallet,
  Copy,
  ExternalLink,
  TrendingUp,
  Award,
  Coins,
  Check,
  Calendar,
  BarChart3,
  Zap,
  Shield,
  Star,
  Trophy,
  Target,
  Activity,
  ChevronRight,
} from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { getCreatedTokens, CreatedToken } from "@/lib/token-storage"

const recentActivity = [
  { id: 1, type: "buy", token: "SharkMoon", symbol: "SHRK", amount: 50000, value: 225, time: "2 hours ago" },
  { id: 2, type: "sell", token: "WhaleToken", symbol: "WHALE", amount: 10000, value: 89, time: "5 hours ago" },
  { id: 3, type: "create", token: "DegenFish", symbol: "DFISH", time: "2 days ago" },
  { id: 4, type: "battle_win", battle: "Ocean Rumble", prize: 5000, time: "3 days ago" },
  { id: 5, type: "buy", token: "KrakenKoin", symbol: "KRAK", amount: 25000, value: 390, time: "5 days ago" },
]

const achievements = [
  {
    id: 1,
    name: "First Trade",
    icon: Zap,
    description: "Complete your first trade",
    unlocked: true,
    date: "Jan 15, 2024",
  },
  {
    id: 2,
    name: "Token Creator",
    icon: Star,
    description: "Create your first token",
    unlocked: true,
    date: "Jan 18, 2024",
  },
  {
    id: 3,
    name: "Battle Champion",
    icon: Trophy,
    description: "Win a battle arena",
    unlocked: true,
    date: "Jan 20, 2024",
  },
  { id: 4, name: "Diamond Hands", icon: Shield, description: "Hold a token for 30 days", unlocked: false },
  { id: 5, name: "Whale Status", icon: Target, description: "Hold 1M+ tokens", unlocked: false },
]

export default function ProfilePage() {
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<"overview" | "tokens" | "activity" | "achievements">("overview")
  const [createdTokens, setCreatedTokens] = useState<CreatedToken[]>([])
  const [zkpId, setZkpId] = useState<string | null>(null)

  // Load created tokens from localStorage on mount
  useEffect(() => {
    const tokens = getCreatedTokens()
    setCreatedTokens(tokens)
    
    // Load ZKP ID from session
    try {
      const zkpSession = localStorage.getItem("zkp_session")
      if (zkpSession) {
        const session = JSON.parse(zkpSession)
        setZkpId(session.zkpId || null)
      }
    } catch {
      console.log("No ZKP session found")
    }
  }, [])

  const address = zkpId || "addr1qx2fxv2umyhttkxyxp8x0dlsdtqbcm3r2m4ddzrgdchpf"
  const balance = 5000
  const totalEarnings = 1250
  const totalTrades = 47
  const battleWins = 3
  const accountAge = "45 days"

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="relative mb-8">
        {/* Cover gradient */}
        <div className="h-32 rounded-t-2xl bg-gradient-to-r from-[#9CFFBB]/20 via-[#5CFF71]/10 to-[#9CFFBB]/20" />

        <div className="glass-card rounded-b-2xl px-4 sm:px-6 pb-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 -mt-12">
            <div className="flex items-end gap-4">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#9CFFBB] to-[#5CFF71] flex items-center justify-center border-4 border-[#0A0A0A] shadow-lg flex-shrink-0">
                <User size={48} className="text-[#0A0A0A]" />
              </div>
              <div className="pb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-white">Anonymous Shark</h1>
                  <div className="px-2 py-0.5 rounded-full bg-[#9CFFBB]/10 text-[#9CFFBB] text-xs font-medium">
                    Pro Trader
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-gray-400 font-mono text-sm">
                    {address?.slice(0, 12)}...{address?.slice(-6)}
                  </span>
                  <button onClick={copyAddress} className="text-gray-400 hover:text-white transition-colors">
                    {copied ? <Check size={14} className="text-[#9CFFBB]" /> : <Copy size={14} />}
                  </button>
                  <a
                    href={`https://Midnightscan.io/address/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    Joined {accountAge} ago
                  </span>
                  <span className="flex items-center gap-1">
                    <Activity size={12} />
                    {totalTrades} trades
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-3 pb-2 flex-wrap">
              <Link href="/create">
                <Button className="bg-gradient-to-r from-[#9CFFBB] to-[#5CFF71] text-[#0A0A0A] font-semibold">
                  <Coins size={16} className="mr-2" />
                  Create Token
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-1 bg-[#1A1A1A] rounded-xl p-1 mb-8 w-fit overflow-x-auto">
        {(["overview", "tokens", "activity", "achievements"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg transition-colors capitalize whitespace-nowrap",
              activeTab === tab ? "bg-[#9CFFBB]/20 text-[#9CFFBB]" : "text-gray-400 hover:text-white",
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#9CFFBB]/10 flex items-center justify-center flex-shrink-0">
                  <Wallet size={20} className="text-[#9CFFBB]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">Balance</p>
                  <p className="text-lg sm:text-xl font-bold text-white truncate">{balance.toLocaleString()} ADA</p>
                </div>
              </div>
            </div>
            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#9CFFBB]/10 flex items-center justify-center flex-shrink-0">
                  <Coins size={20} className="text-[#9CFFBB]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">Tokens Created</p>
                  <p className="text-lg sm:text-xl font-bold text-white">{createdTokens.length}</p>
                </div>
              </div>
            </div>
            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#9CFFBB]/10 flex items-center justify-center flex-shrink-0">
                  <TrendingUp size={20} className="text-[#9CFFBB]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">Total Earnings</p>
                  <p className="text-lg sm:text-xl font-bold text-[#9CFFBB]">{totalEarnings} ADA</p>
                </div>
              </div>
            </div>
            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#9CFFBB]/10 flex items-center justify-center flex-shrink-0">
                  <Award size={20} className="text-[#9CFFBB]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">Battle Wins</p>
                  <p className="text-lg sm:text-xl font-bold text-white">{battleWins}</p>
                </div>
              </div>
            </div>
            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#9CFFBB]/10 flex items-center justify-center flex-shrink-0">
                  <BarChart3 size={20} className="text-[#9CFFBB]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">Portfolio Value</p>
                  <p className="text-lg sm:text-xl font-bold text-white truncate">
                    {mockPortfolio.reduce((s, h) => s + h.currentValue, 0).toLocaleString()} ADA
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Created Tokens & Holdings */}
            <div className="lg:col-span-2 space-y-6">
              {/* Created Tokens */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">Tokens Created</h2>
                </div>
                {createdTokens.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {createdTokens.map((token) => (
                      <Link key={token.id} href={`/tokens/${token.id}`}>
                        <TokenCard token={token} />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="glass-card rounded-xl p-8 text-center">
                    <p className="text-gray-400 mb-4">You haven&apos;t created any tokens yet.</p>
                    <Link href="/create">
                      <Button className="bg-[#9CFFBB] text-[#0A0A0A]">Create Your First Token</Button>
                    </Link>
                  </div>
                )}
              </section>

              {/* Holdings Preview */}
              <section>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <h2 className="text-lg font-semibold text-white">Your Holdings</h2>
                  <Link
                    href="/portfolio"
                    className="text-[#9CFFBB] text-sm hover:text-[#5CFF71] flex items-center gap-1"
                  >
                    View Portfolio <ChevronRight size={14} />
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {mockPortfolio.slice(0, 4).map((holding) => (
                    <Link key={holding.token.id} href={`/tokens/${holding.token.id}`}>
                      <TokenCard token={holding.token} />
                    </Link>
                  ))}
                </div>
              </section>
            </div>

            <div className="space-y-6">
              {/* Recent Activity */}
              <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <h3 className="font-semibold text-white">Recent Activity</h3>
                  <Link href="/portfolio/history" className="text-xs text-[#9CFFBB] hover:text-[#5CFF71]">
                    View All
                  </Link>
                </div>
                <div className="space-y-3">
                  {recentActivity.slice(0, 5).map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                          activity.type === "buy"
                            ? "bg-[#5CFF71]/10"
                            : activity.type === "sell"
                              ? "bg-red-400/10"
                              : activity.type === "create"
                                ? "bg-blue-400/10"
                                : "bg-[#9CFFBB]/10",
                        )}
                      >
                        {activity.type === "buy" && <TrendingUp size={14} className="text-[#5CFF71]" />}
                        {activity.type === "sell" && <TrendingUp size={14} className="text-red-400 rotate-180" />}
                        {activity.type === "create" && <Star size={14} className="text-blue-400" />}
                        {activity.type === "battle_win" && <Trophy size={14} className="text-[#9CFFBB]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">
                          {activity.type === "buy" && `Bought ${activity.symbol}`}
                          {activity.type === "sell" && `Sold ${activity.symbol}`}
                          {activity.type === "create" && `Created ${activity.symbol}`}
                          {activity.type === "battle_win" && `Won ${activity.battle}`}
                        </p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                      {activity.value && (
                        <p
                          className={cn(
                            "text-sm font-medium whitespace-nowrap",
                            activity.type === "buy"
                              ? "text-[#5CFF71]"
                              : activity.type === "sell"
                                ? "text-red-400"
                                : "text-white",
                          )}
                        >
                          {activity.type === "buy" ? "-" : "+"}
                          {activity.value} ADA
                        </p>
                      )}
                      {activity.prize && (
                        <p className="text-sm font-medium text-[#9CFFBB] whitespace-nowrap">+{activity.prize} ADA</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Achievements Preview */}
              <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <h3 className="font-semibold text-white">Achievements</h3>
                  <span className="text-xs text-gray-400">
                    {achievements.filter((a) => a.unlocked).length}/{achievements.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {achievements.slice(0, 4).map((achievement) => (
                    <div
                      key={achievement.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg transition-colors",
                        achievement.unlocked ? "bg-[#9CFFBB]/5" : "bg-white/5 opacity-50",
                      )}
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                          achievement.unlocked ? "bg-[#9CFFBB]/20" : "bg-white/10",
                        )}
                      >
                        <achievement.icon
                          size={16}
                          className={achievement.unlocked ? "text-[#9CFFBB]" : "text-gray-500"}
                        />
                      </div>
                      <div className="flex-1">
                        <p className={cn("text-sm font-medium", achievement.unlocked ? "text-white" : "text-gray-500")}>
                          {achievement.name}
                        </p>
                        <p className="text-xs text-gray-500">{achievement.description}</p>
                      </div>
                      {achievement.unlocked && <Check size={14} className="text-[#9CFFBB] flex-shrink-0" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === "tokens" && (
        <div className="space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">Created Tokens</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {createdTokens.map((token) => (
                <Link key={token.id} href={`/tokens/${token.id}`}>
                  <TokenCard token={token} />
                </Link>
              ))}
            </div>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">Holdings</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {mockPortfolio.map((holding) => (
                <Link key={holding.token.id} href={`/tokens/${holding.token.id}`}>
                  <TokenCard token={holding.token} />
                </Link>
              ))}
            </div>
          </section>
        </div>
      )}

      {activeTab === "activity" && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-[#9CFFBB]/10">
            <h2 className="text-lg font-semibold text-white">All Activity</h2>
          </div>
          <div className="divide-y divide-[#9CFFBB]/5 overflow-x-auto">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                    activity.type === "buy"
                      ? "bg-[#5CFF71]/10"
                      : activity.type === "sell"
                        ? "bg-red-400/10"
                        : activity.type === "create"
                          ? "bg-blue-400/10"
                          : "bg-[#9CFFBB]/10",
                  )}
                >
                  {activity.type === "buy" && <TrendingUp size={18} className="text-[#5CFF71]" />}
                  {activity.type === "sell" && <TrendingUp size={18} className="text-red-400 rotate-180" />}
                  {activity.type === "create" && <Star size={18} className="text-blue-400" />}
                  {activity.type === "battle_win" && <Trophy size={18} className="text-[#9CFFBB]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">
                    {activity.type === "buy" && `Bought ${activity.amount?.toLocaleString()} ${activity.symbol}`}
                    {activity.type === "sell" && `Sold ${activity.amount?.toLocaleString()} ${activity.symbol}`}
                    {activity.type === "create" && `Created token ${activity.token}`}
                    {activity.type === "battle_win" && `Won battle ${activity.battle}`}
                  </p>
                  <p className="text-sm text-gray-500">{activity.time}</p>
                </div>
                {activity.value && (
                  <p
                    className={cn(
                      "text-lg font-semibold whitespace-nowrap",
                      activity.type === "buy" ? "text-[#5CFF71]" : "text-red-400",
                    )}
                  >
                    {activity.type === "buy" ? "-" : "+"}
                    {activity.value} ADA
                  </p>
                )}
                {activity.prize && (
                  <p className="text-lg font-semibold text-[#9CFFBB] whitespace-nowrap">+{activity.prize} ADA</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "achievements" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={cn(
                "glass-card rounded-2xl p-6 transition-colors",
                achievement.unlocked ? "border border-[#9CFFBB]/20" : "opacity-60",
              )}
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0",
                    achievement.unlocked ? "bg-[#9CFFBB]/20" : "bg-white/10",
                  )}
                >
                  <achievement.icon size={28} className={achievement.unlocked ? "text-[#9CFFBB]" : "text-gray-500"} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={cn("font-semibold", achievement.unlocked ? "text-white" : "text-gray-500")}>
                      {achievement.name}
                    </h3>
                    {achievement.unlocked && <Check size={16} className="text-[#9CFFBB]" />}
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{achievement.description}</p>
                  {achievement.date && (
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <Calendar size={10} />
                      Unlocked {achievement.date}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
