"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Home,
  Coins,
  PlusCircle,
  Swords,
  TrendingUp,
  Flame,
  Sparkles,
  Layers,
  Trophy,
  User,
  BookOpen,
  Brain,
  Lock,
  ShoppingCart,
  TrendingDown,
  Clock,
  PieChart,
} from "lucide-react"

const sidebarLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/tokens", label: "All Tokens", icon: Coins },
  { href: "/create", label: "Create Token", icon: PlusCircle },
  { href: "/arena", label: "Battle Arena", icon: Swords },
  { divider: true },
  { href: "/portfolio", label: "Portfolio", icon: PieChart },
  { href: "/trending", label: "Trending", icon: Flame },
  { href: "/hot", label: "Hot Tokens", icon: TrendingUp },
  { href: "/new", label: "New Tokens", icon: Sparkles },
  { href: "/categories", label: "Categories", icon: Layers },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { divider: true },
  { href: "/summary", label: "Marketplace Summary", icon: Layers },
  { href: "/creator", label: "Creators", icon: User },
  { href: "/transactions", label: "Transactions", icon: Clock },
  { href: "/insights", label: "Insights", icon: Brain },
  { href: "/analytics", label: "Token Analytics", icon: TrendingUp },
  { href: "/buyt", label: "Buy Tokens", icon: ShoppingCart },
  { href: "/sell", label: "Sell Tokens", icon: TrendingDown },
  { href: "/stake", label: "Stake Tokens", icon: Lock },
  { href: "/predictions", label: "Predictions", icon: Brain },
  { href: "/profile", label: "Profile", icon: User },
  { divider: true },
  { href: "/docs", label: "Documentation", icon: BookOpen },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 glass border-r border-[#9CFFBB]/10 overflow-y-auto hidden lg:block">
      <div className="p-4 space-y-1">
        {sidebarLinks.map((link, i) => {
          if ("divider" in link) {
            return <div key={i} className="h-px bg-[#9CFFBB]/10 my-3" />
          }
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                pathname === link.href
                  ? "bg-[#9CFFBB]/10 text-[#9CFFBB]"
                  : "text-gray-400 hover:text-white hover:bg-white/5",
              )}
            >
              <Icon size={18} />
              {link.label}
            </Link>
          )
        })}
      </div>
    </aside>
  )
}
