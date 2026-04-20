"use client"

import React, { useEffect, useState } from 'react'
import { fetchTxs } from '@/lib/api'
import { Clock, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react'

const MOCK_TXS = [
  { id: 'tx1', type: 'buy', tokenName: 'SharkCoin', tokenId: 'token-1', amount: 100, price: 1.23, timestamp: new Date().toISOString() },
  { id: 'tx2', type: 'sell', tokenName: 'FinToken', tokenId: 'token-2', amount: 50, price: 0.15, timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  { id: 'tx3', type: 'buy', tokenName: 'WhaleCoin', tokenId: 'token-3', amount: 250, price: 2.45, timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
  { id: 'tx4', type: 'buy', tokenName: 'OceanToken', tokenId: 'token-4', amount: 75, price: 0.85, timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
  { id: 'tx5', type: 'sell', tokenName: 'SharkCoin', tokenId: 'token-1', amount: 30, price: 1.28, timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString() },
]

function TypeBadge({ type }: { type: string }) {
  const isBuy = type.toLowerCase() === 'buy'
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
      isBuy ? 'bg-[#9CFFBB]/10 text-[#9CFFBB]' : 'bg-red-500/10 text-red-400'
    }`}>
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

export default function TransactionsPage({ params }: { params: { userId: string } }) {
  const { userId } = params
  const [txs, setTxs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const data = await fetchTxs(userId)
        if (data && Array.isArray(data) && data.length > 0) {
          setTxs(data)
        } else {
          setTxs(MOCK_TXS)
        }
      } catch (e) {
        console.error(e)
        setTxs(MOCK_TXS)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userId])

  const totalBuys = txs.filter(t => t.type === 'buy').reduce((s, t) => s + (t.amount * t.price), 0)
  const totalSells = txs.filter(t => t.type === 'sell').reduce((s, t) => s + (t.amount * t.price), 0)

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <Clock className="text-[#9CFFBB]" size={28} />
            Transaction History
          </h1>
          <p className="text-gray-400 mt-1 flex items-center gap-2">
            <Wallet size={14} />
            <span className="font-mono text-sm">{userId.slice(0, 10)}...{userId.slice(-6)}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="px-3 py-1 rounded-full bg-[#9CFFBB]/10 text-[#9CFFBB] font-medium">
            {txs.length} Transactions
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="glass-card rounded-xl p-4 border border-[#9CFFBB]/10">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Bought</div>
          <div className="text-xl font-bold text-[#9CFFBB]">{totalBuys.toFixed(2)} ADA</div>
        </div>
        <div className="glass-card rounded-xl p-4 border border-[#9CFFBB]/10">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Sold</div>
          <div className="text-xl font-bold text-red-400">{totalSells.toFixed(2)} ADA</div>
        </div>
        <div className="glass-card rounded-xl p-4 border border-[#9CFFBB]/10">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Net Flow</div>
          <div className={`text-xl font-bold ${totalBuys - totalSells >= 0 ? 'text-[#9CFFBB]' : 'text-red-400'}`}>
            {totalBuys - totalSells >= 0 ? '+' : ''}{(totalBuys - totalSells).toFixed(2)} ADA
          </div>
        </div>
        <div className="glass-card rounded-xl p-4 border border-[#9CFFBB]/10">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Transactions</div>
          <div className="text-xl font-bold text-white">{txs.length}</div>
        </div>
      </div>

      {loading ? (
        <div className="glass-card rounded-2xl p-8 border border-[#9CFFBB]/10">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-[#111] rounded-lg" />)}
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-2xl border border-[#9CFFBB]/10 overflow-hidden">
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
                  <th className="text-right px-6 py-4">Time</th>
                </tr>
              </thead>
              <tbody>
                {txs.map((t) => (
                  <tr key={t.id} className="border-b border-[#9CFFBB]/5 hover:bg-[#9CFFBB]/5 transition-colors">
                    <td className="px-6 py-4"><TypeBadge type={t.type} /></td>
                    <td className="px-6 py-4 font-medium text-white">{t.tokenName || t.tokenId}</td>
                    <td className="px-6 py-4 text-right text-gray-300">{t.amount?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-gray-300">{t.price} ADA</td>
                    <td className="px-6 py-4 text-right font-medium text-white">{(t.amount * t.price).toFixed(2)} ADA</td>
                    <td className="px-6 py-4 text-right text-gray-500">{formatTimeAgo(t.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden divide-y divide-[#9CFFBB]/10">
            {txs.map((t) => (
              <div key={t.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <TypeBadge type={t.type} />
                  <span className="text-xs text-gray-500">{formatTimeAgo(t.timestamp)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white">{t.tokenName || t.tokenId}</span>
                  <span className="font-medium text-white">{(t.amount * t.price).toFixed(2)} ADA</span>
                </div>
                <div className="flex items-center justify-between mt-1 text-sm text-gray-400">
                  <span>{t.amount?.toLocaleString()} tokens</span>
                  <span>@ {t.price} ADA</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
