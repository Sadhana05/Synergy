"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, ArrowUpRight, ArrowDownRight, Search, RefreshCw, AlertCircle } from 'lucide-react'
import { getTransactions, type Transaction } from '@/lib/portfolio-storage'

function TypeBadge({ type }: { type: string }) {
  const isBuy = type.toLowerCase() === 'buy'
  const isStake = type.toLowerCase() === 'stake'
  const isUnstake = type.toLowerCase() === 'unstake'
  
  let colorClass = isBuy ? 'bg-[#9CFFBB]/10 text-[#9CFFBB]' : 'bg-red-500/10 text-red-400'
  if (isStake) colorClass = 'bg-purple-500/10 text-purple-400'
  if (isUnstake) colorClass = 'bg-orange-500/10 text-orange-400'
  
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
      {isBuy ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
      {type.toUpperCase()}
    </span>
  )
}

function formatTimeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function TransactionsIndexPage() {
  const router = useRouter()
  const [id, setId] = useState('')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load transactions from localStorage
  useEffect(() => {
    const loadTransactions = () => {
      setIsLoading(true)
      try {
        const txs = getTransactions()
        // Sort by timestamp (newest first)
        txs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        setTransactions(txs)
      } catch (error) {
        console.error("Error loading transactions:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadTransactions()
    // Refresh every 5 seconds
    const interval = setInterval(loadTransactions, 5000)
    return () => clearInterval(interval)
  }, [])

  const refreshTransactions = () => {
    const txs = getTransactions()
    txs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    setTransactions(txs)
  }

  function go() {
    if (!id) return
    router.push(`/transactions/${encodeURIComponent(id)}`)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <Clock className="text-[#9CFFBB]" size={28} />
            Transactions
          </h1>
          <p className="text-gray-400 mt-1">View your transaction history</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <button 
            onClick={refreshTransactions}
            className="p-2 rounded-lg bg-[#111111]/60 border border-[#222222] hover:border-[#9CFFBB]/30 transition-colors"
          >
            <RefreshCw size={16} className="text-[#9CFFBB]" />
          </button>
          <span className="px-3 py-1 rounded-full bg-[#9CFFBB]/10 text-[#9CFFBB] font-medium">
            {transactions.length} Transactions
          </span>
        </div>
      </div>

      {/* Search Card */}
      <div className="glass-card rounded-2xl p-4 sm:p-6 border border-[#9CFFBB]/10 mb-8">
        <h2 className="text-lg font-semibold text-white mb-2">Find Transactions</h2>
        <p className="text-sm text-gray-400 mb-4">Enter a transaction hash to view details</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              value={id} 
              onChange={(e) => setId(e.target.value)} 
              placeholder="e.g. tx_1234..." 
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#9CFFBB]/20 bg-[#0A0A0A] text-white placeholder-gray-500 focus:outline-none focus:border-[#9CFFBB]/50 transition-colors" 
            />
          </div>
          <button 
            onClick={go} 
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#9CFFBB] to-[#5CFF71] text-[#0A0A0A] font-semibold hover:opacity-90 transition-opacity"
          >
            Search
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="glass-card rounded-2xl border border-[#9CFFBB]/10 p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[#9CFFBB] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Loading transactions...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && transactions.length === 0 && (
        <div className="glass-card rounded-2xl border border-[#9CFFBB]/10 p-8 text-center">
          <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Transactions Yet</h3>
          <p className="text-gray-400 mb-4">Your buy and sell transactions will appear here</p>
          <button 
            onClick={() => router.push('/buyt')}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#9CFFBB] to-[#5CFF71] text-[#0A0A0A] font-semibold hover:opacity-90 transition-opacity"
          >
            Buy Tokens
          </button>
        </div>
      )}

      {/* Transactions Table */}
      {!isLoading && transactions.length > 0 && (
        <div className="glass-card rounded-2xl border border-[#9CFFBB]/10 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-[#9CFFBB]/10">
            <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
            <p className="text-sm text-gray-400">Your buy, sell, and staking activity</p>
          </div>
          
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-[#9CFFBB]/10">
                  <th className="text-left px-6 py-4">Type</th>
                  <th className="text-left px-6 py-4">Token</th>
                  <th className="text-right px-6 py-4">Amount</th>
                  <th className="text-right px-6 py-4">Price</th>
                  <th className="text-right px-6 py-4">Total</th>
                  <th className="text-center px-6 py-4">Status</th>
                  <th className="text-right px-6 py-4">Time</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-b border-[#9CFFBB]/5 hover:bg-[#9CFFBB]/5 transition-colors">
                    <td className="px-6 py-4"><TypeBadge type={t.type} /></td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-white">{t.tokenSymbol}</div>
                        <div className="text-xs text-gray-500">{t.tokenName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-300">{t.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-gray-300">{t.price.toFixed(6)} ADA</td>
                    <td className="px-6 py-4 text-right font-medium text-white">{t.totalAda.toFixed(4)} ADA</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        t.status === 'confirmed' ? 'bg-green-500/10 text-green-400' :
                        t.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-red-500/10 text-red-400'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-500">{formatTimeAgo(t.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden divide-y divide-[#9CFFBB]/10">
            {transactions.map((t) => (
              <div key={t.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <TypeBadge type={t.type} />
                  <span className="text-xs text-gray-500">{formatTimeAgo(t.timestamp)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-white">{t.tokenSymbol}</span>
                    <span className="text-xs text-gray-500 ml-1">{t.tokenName}</span>
                  </div>
                  <span className="font-medium text-white">{t.totalAda.toFixed(4)} ADA</span>
                </div>
                <div className="flex items-center justify-between mt-1 text-sm text-gray-400">
                  <span>{t.amount.toLocaleString()} tokens</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    t.status === 'confirmed' ? 'bg-green-500/10 text-green-400' :
                    t.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                    'bg-red-500/10 text-red-400'
                  }`}>
                    {t.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
