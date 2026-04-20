import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Navbar } from "@/components/navbar"
import { Sidebar } from "@/components/sidebar"
import { Footer } from "@/components/footer"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Miso.Tx | Create & Trade Meme Tokens on Midnight",
  description:
    "The apex predator of meme token platforms. Create, buy, sell, stake tokens, make predictions, and earn through zero knowledge proofs on Midnight.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/miso-logo.png",
        sizes: "32x32",
      },
      {
        url: "/miso-logo.png",
        sizes: "16x16",
      },
    ],
    apple: "/miso-logo.png",
    shortcut: "/miso-logo.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased bg-[#0A0A0A] text-white min-h-screen">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 lg:ml-64 pt-16 min-h-screen flex flex-col">
            {children}
            <Footer />
          </main>
        </div>
        <Analytics />
      </body>
    </html>
  )
}
