"use client"

import { Wallet, Copy, Shield, ShieldCheck, ShieldAlert } from "lucide-react"
import { useState } from "react"
import type { ZKPSession } from "@/lib/zkp-utils"

interface WalletAddressDisplayProps {
  address: string | null
  network?: string
  zkpSession?: ZKPSession | null
}

export function ZKPIdentityDisplay({ address, network, zkpSession }: WalletAddressDisplayProps) {
  const [copied, setCopied] = useState(false)
  const [showZKPDetails, setShowZKPDetails] = useState(false)

  if (!address) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyZKP = () => {
    if (zkpSession?.zkpId) {
      navigator.clipboard.writeText(zkpSession.zkpId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Format address for display
  const formatAddress = (addr: string) => {
    if (addr.length > 20) {
      return `${addr.slice(0, 12)}...${addr.slice(-8)}`
    }
    return addr
  }

  return (
    <div className="space-y-3">
      {/* ZKP Authentication Status */}
      {zkpSession && (
        <div className={`flex items-center gap-2 p-3 rounded-lg border ${
          zkpSession.proofValid 
            ? "bg-[#5CFF71]/10 border-[#5CFF71]/20" 
            : "bg-red-500/10 border-red-500/20"
        }`}>
          {zkpSession.proofValid ? (
            <>
              <ShieldCheck size={16} className="text-[#5CFF71]" />
              <div className="flex-1">
                <span className="text-sm text-[#5CFF71] font-medium">
                  {zkpSession.isReturningUser ? "Welcome back!" : "ZKP Verified"}
                </span>
                <p className="text-xs text-gray-400">
                  Zero-knowledge proof authenticated
                </p>
              </div>
            </>
          ) : (
            <>
              <ShieldAlert size={16} className="text-red-400" />
              <span className="text-sm text-red-400 font-medium">Proof verification failed</span>
            </>
          )}
        </div>
      )}

      {/* Wallet Address */}
      <div className="p-4 rounded-lg bg-[#9CFFBB]/5 border border-[#9CFFBB]/20">
        <p className="text-xs text-gray-400 mb-2">Wallet Address</p>
        <div className="flex items-center justify-between gap-2">
          <code className="text-sm font-mono text-[#9CFFBB] break-all">{formatAddress(address)}</code>
          <button onClick={handleCopy} className="p-2 rounded-lg hover:bg-white/5 transition-colors" title="Copy full address">
            <Copy size={14} className="text-gray-400 hover:text-white" />
          </button>
        </div>
        {copied && <p className="text-xs text-[#5CFF71] mt-2">Copied!</p>}
      </div>

      {/* ZKP ID (collapsible) */}
      {zkpSession?.zkpId && (
        <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
          <button 
            onClick={() => setShowZKPDetails(!showZKPDetails)}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-purple-400" />
              <p className="text-xs text-gray-400">Zero-Knowledge Identity</p>
            </div>
            <span className="text-xs text-purple-400">{showZKPDetails ? '▲' : '▼'}</span>
          </button>
          
          {showZKPDetails && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <code className="text-xs font-mono text-purple-400 break-all">{zkpSession.zkpId}</code>
                <button onClick={handleCopyZKP} className="p-1 rounded hover:bg-white/5 transition-colors" title="Copy ZKP ID">
                  <Copy size={12} className="text-gray-400 hover:text-white" />
                </button>
              </div>
              
              <div className="text-xs text-gray-500 space-y-1">
                <p>• Protocol: {zkpSession.proof?.protocol || 'miso-zkp-v1'}</p>
                <p>• Session: {zkpSession.sessionHash}</p>
                <p>• Created: {new Date(zkpSession.createdAt).toLocaleTimeString()}</p>
                <p>• Expires: {new Date(zkpSession.expiresAt).toLocaleTimeString()}</p>
              </div>
              
              <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-purple-500/10">
                Your ZKP ID proves wallet ownership without revealing your actual address on-chain.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Network info */}
      <p className="text-xs text-gray-500">
        Connected to Midnight Network{network ? ` (${network})` : ""}.
      </p>
    </div>
  )
}
