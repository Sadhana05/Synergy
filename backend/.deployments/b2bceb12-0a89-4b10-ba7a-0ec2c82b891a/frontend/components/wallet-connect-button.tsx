"use client"

import { useMidnight } from "@/hooks/useMidnight"
import { useZKPIdentity } from "@/hooks/use-zkp-identity"
import { ZKPIdentityDisplay } from "@/components/zkp-identity-display"
import { Button } from "@/components/ui/button"
import { Wallet, ChevronDown, LogOut, Copy, ExternalLink, RefreshCw, AlertCircle, Download, Shield, ShieldCheck } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useState, useEffect } from "react"

const WALLET_INFO: Record<string, { name: string; icon: string; installUrl: string }> = {
  lace: {
    name: "Lace Midnight Preview",
    icon: "/placeholder-logo.svg",
    installUrl: "https://chromewebstore.google.com/detail/lace-midnight-preview/hgeekaiplokcnmakghbdfbgnlfheichg",
  },
}

export function WalletConnectButton() {
  const { wallet, isConnecting, connect, disconnect, error, availableWallets, refreshBalance, clearError } = useMidnight()
  const {
    zkpSession,
    isProcessing: isZKPProcessing,
    isAuthenticated,
    error: zkpError,
    connectWithZKP,
    checkExistingZKP,
    disconnectZKP,
    verifyCurrentSession,
  } = useZKPIdentity()
  const [copied, setCopied] = useState(false)
  const [showWalletDialog, setShowWalletDialog] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Initialize ZKP session when wallet connects
  useEffect(() => {
    const initZKP = async () => {
      if (wallet?.connected && wallet.address && wallet.coinPublicKey && !zkpSession) {
        console.log('[Wallet] Initializing ZKP session...')
        const existsLocally = checkExistingZKP(wallet.address)
        
        // Always create/refresh the ZKP session with proof
        await connectWithZKP(
          wallet.address, 
          wallet.coinPublicKey,
          undefined // No message signing for now (Midnight doesn't expose this via DApp connector)
        )
      }
    }
    
    initZKP()
  }, [wallet?.connected, wallet?.address, wallet?.coinPublicKey, zkpSession, checkExistingZKP, connectWithZKP])

  const copyZKPId = () => {
    if (zkpSession?.zkpId) {
      navigator.clipboard.writeText(zkpSession.zkpId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } else if (wallet?.address) {
      navigator.clipboard.writeText(wallet.address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshBalance()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  const handleConnect = async () => {
    if (!availableWallets?.includes("lace")) {
      window.open(WALLET_INFO.lace.installUrl, "_blank")
      return
    }
    await connect("lace")
    setShowWalletDialog(false)
  }

  const handleOpenDialog = () => {
    clearError?.()
    setShowWalletDialog(true)
  }

  const formatAddress = (addr: string) => {
    if (addr.startsWith("addr1")) {
      return `${addr.slice(0, 12)}...${addr.slice(-8)}`
    }
    return `addr1...${addr.slice(-8)}`
  }

  const shortAddress = wallet?.address ? formatAddress(wallet.address) : ""
  const hasAvailableWallets = availableWallets?.length > 0

  if (!wallet?.connected) {
    return (
      <>
        <Button
          onClick={handleOpenDialog}
          disabled={isConnecting}
          className="bg-gradient-to-r from-[#9CFFBB] to-[#5CFF71] text-[#0A0A0A] font-semibold hover:opacity-90 transition-opacity"
        >
          <Wallet size={18} className="mr-2" />
          {isConnecting ? "Connecting..." : "Connect Lace Midnight"}
        </Button>

        {/* Wallet Selection Dialog */}
        <Dialog open={showWalletDialog} onOpenChange={setShowWalletDialog}>
          <DialogContent className="glass-card border-[#9CFFBB]/20 bg-[#0A0A0A]/95 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white">Connect Lace Midnight Preview</DialogTitle>
              <DialogDescription className="text-gray-400">Connect your Lace Midnight Preview wallet to Miso.Tx</DialogDescription>
            </DialogHeader>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!hasAvailableWallets && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-[#9CFFBB]/5 border border-[#9CFFBB]/20">
                <Download size={20} className="text-[#9CFFBB] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-white">Lace Midnight Preview Not Detected</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Install the Lace Midnight Preview browser extension to connect to Miso.Tx.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2 mt-4">
              {/* Lace Wallet */}
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  availableWallets?.includes("lace")
                    ? "border-[#9CFFBB]/30 bg-[#9CFFBB]/5 hover:bg-[#9CFFBB]/10 hover:border-[#9CFFBB]/50"
                    : "border-[#9CFFBB]/20 bg-[#9CFFBB]/5 hover:bg-[#9CFFBB]/10"
                }`}
              >
                <img src={WALLET_INFO.lace.icon || "/placeholder.svg"} alt="Lace" className="w-10 h-10 rounded-lg" />
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">Lace Midnight Preview</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#9CFFBB]/20 text-[#9CFFBB]">Midnight Testnet</span>
                  </div>
                  <span className="text-sm text-gray-400">
                    {availableWallets?.includes("lace") ? "Click to connect" : "Click to install"}
                  </span>
                </div>
                {!availableWallets?.includes("lace") && <ExternalLink size={16} className="text-[#9CFFBB]" />}
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">By connecting, you agree to our Terms of Service</p>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="border-[#9CFFBB]/30 bg-[#9CFFBB]/5 text-[#9CFFBB] hover:bg-[#9CFFBB]/10 hover:text-[#9CFFBB]"
        >
          <div className="flex items-center gap-2">
            {/* ZKP Status Indicator */}
            {isAuthenticated ? (
              <ShieldCheck size={16} className="text-[#5CFF71]" />
            ) : isZKPProcessing ? (
              <Shield size={16} className="text-yellow-400 animate-pulse" />
            ) : (
              <div className="w-2 h-2 rounded-full bg-[#5CFF71] animate-pulse" />
            )}
            {/* Show ZKP ID instead of wallet address */}
            <span className="hidden sm:inline">
              {zkpSession?.zkpId 
                ? `${zkpSession.zkpId.slice(0, 8)}...${zkpSession.zkpId.slice(-4)}`
                : wallet.address 
                  ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` 
                  : "Connected"
              }
            </span>
            <span className="sm:hidden text-white/60">|</span>
            <span className="text-white">
              {wallet.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })} tDUST
            </span>
            <ChevronDown size={16} />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 glass-card border-[#9CFFBB]/20">
        <div className="px-3 py-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">Connected to Midnight Network</p>
            <span
              className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400"
            >
              {wallet.network}
            </span>
          </div>

          <div className="mt-3">
            <ZKPIdentityDisplay address={wallet.address} network={wallet.network} zkpSession={zkpSession} />
          </div>

          <p className="text-lg font-bold text-white mt-3">
            {wallet.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })} tDUST
          </p>
        </div>
        <DropdownMenuSeparator className="bg-[#9CFFBB]/10" />
        <DropdownMenuItem
          onClick={handleRefresh}
          className="cursor-pointer text-gray-300 hover:text-white focus:text-white focus:bg-[#9CFFBB]/10"
        >
          <RefreshCw size={16} className={`mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh Balance
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={copyZKPId}
          className="cursor-pointer text-gray-300 hover:text-white focus:text-white focus:bg-[#9CFFBB]/10"
        >
          <Copy size={16} className="mr-2" />
          {copied ? "Copied!" : "Copy ZKP ID"}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer text-gray-300 hover:text-white focus:text-white focus:bg-[#9CFFBB]/10"
          onClick={() => {
            // Midnight network doesn't have a public explorer yet
            // You can update this URL when a Midnight explorer becomes available
            const explorerUrl = `https://docs.midnight.network/`
            window.open(explorerUrl, "_blank")
          }}
        >
          <ExternalLink size={16} className="mr-2" />
          View Midnight Docs
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-[#9CFFBB]/10" />
        <DropdownMenuItem
          onClick={() => {
            disconnect()
            disconnectZKP()
          }}
          className="cursor-pointer text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-red-500/10"
        >
          <LogOut size={16} className="mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
