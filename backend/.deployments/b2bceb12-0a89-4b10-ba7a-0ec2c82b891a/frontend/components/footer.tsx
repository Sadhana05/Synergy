import Link from "next/link"
import { Twitter, MessageCircle, Github } from "lucide-react"

export function Footer() {
  return (
    <footer className="glass border-t border-[#9CFFBB]/10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9CFFBB] to-[#5CFF71] flex items-center justify-center">
                <span className="text-xl font-bold text-[#0A0A0A]">M</span>
              </div>
              <span className="text-xl font-bold text-white">
                Miso<span className="text-[#9CFFBB]">.Tx</span>
              </span>
            </div>
            <p className="text-sm text-gray-400">The apex predator of meme token platforms on Midnight.</p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-[#9CFFBB] transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-[#9CFFBB] transition-colors">
                <MessageCircle size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-[#9CFFBB] transition-colors">
                <Github size={20} />
              </a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/tokens" className="text-gray-400 hover:text-[#9CFFBB]">
                  All Tokens
                </Link>
              </li>
              <li>
                <Link href="/create" className="text-gray-400 hover:text-[#9CFFBB]">
                  Create Token
                </Link>
              </li>
              <li>
                <Link href="/arena" className="text-gray-400 hover:text-[#9CFFBB]">
                  Battle Arena
                </Link>
              </li>
              <li>
                <Link href="/leaderboard" className="text-gray-400 hover:text-[#9CFFBB]">
                  Leaderboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources - updated links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/how-it-works" className="text-gray-400 hover:text-[#9CFFBB]">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-400 hover:text-[#9CFFBB]">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-gray-400 hover:text-[#9CFFBB]">
                  Categories
                </Link>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-[#9CFFBB]">
                  Documentation
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-[#9CFFBB]">
                  Terms of Use
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-[#9CFFBB]">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="text-gray-400 hover:text-[#9CFFBB]">
                  Risk Disclaimer
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#9CFFBB]/10 mt-8 pt-8 text-center text-sm text-gray-500">
          <p>&copy; 2025 Miso.Tx. All rights reserved. Built on Midnight.</p>
        </div>
      </div>
    </footer>
  )
}
