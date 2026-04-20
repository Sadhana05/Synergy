"use client"

import { useState, useCallback, useEffect } from "react"
import { 
  type ZKPSession, 
  type ZKProof,
  initializeZKPSession, 
  getExistingZKPId,
  checkReturningUser,
  isSessionValid,
  clearSessionData,
  generateChallenge,
  verifyProof
} from "@/lib/zkp-utils"

export interface UseZKPIdentityReturn {
  // Session state
  zkpSession: ZKPSession | null
  isProcessing: boolean
  isAuthenticated: boolean
  error: string | null
  
  // Actions
  connectWithZKP: (walletAddress: string, coinPublicKey: string, signMessage?: (msg: string) => Promise<string>) => Promise<ZKPSession | null>
  checkExistingZKP: (walletAddress: string) => boolean
  disconnectZKP: () => void
  refreshSession: (walletAddress: string, coinPublicKey: string) => Promise<void>
  
  // ZKP utilities
  getProof: () => ZKProof | null
  verifyCurrentSession: () => boolean
}

export function useZKPIdentity(): UseZKPIdentityReturn {
  const [zkpSession, setZKPSession] = useState<ZKPSession | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if currently authenticated
  const isAuthenticated = zkpSession !== null && zkpSession.proofValid

  /**
   * Connect wallet with ZKP authentication
   * Generates a zero-knowledge proof of wallet ownership
   */
  const connectWithZKP = useCallback(async (
    walletAddress: string, 
    coinPublicKey: string,
    signMessage?: (msg: string) => Promise<string>
  ): Promise<ZKPSession | null> => {
    setIsProcessing(true)
    setError(null)

    try {
      console.log('[ZKP] Starting ZKP authentication...')
      console.log('[ZKP] Wallet:', walletAddress.slice(0, 20) + '...')
      
      // Generate the ZKP session with proof
      const session = await initializeZKPSession(
        walletAddress,
        coinPublicKey,
        signMessage
      )
      
      console.log('[ZKP] Session created:', {
        zkpId: session.zkpId,
        proofValid: session.proofValid,
        isReturningUser: session.isReturningUser
      })
      
      if (!session.proofValid) {
        throw new Error('ZKP proof verification failed')
      }
      
      setZKPSession(session)
      setIsProcessing(false)
      
      return session
    } catch (err: any) {
      console.error('[ZKP] Authentication failed:', err)
      setError(err.message || 'ZKP authentication failed')
      setIsProcessing(false)
      return null
    }
  }, [])

  /**
   * Check if user has existing ZKP session
   */
  const checkExistingZKP = useCallback((walletAddress: string): boolean => {
    const exists = checkReturningUser(walletAddress)
    console.log('[ZKP] Checking existing session:', exists ? 'Found' : 'Not found')
    return exists
  }, [])

  /**
   * Disconnect and clear ZKP session
   */
  const disconnectZKP = useCallback(() => {
    if (zkpSession) {
      console.log('[ZKP] Disconnecting session:', zkpSession.zkpId)
    }
    setZKPSession(null)
    setError(null)
  }, [zkpSession])

  /**
   * Refresh the current session (re-authenticate)
   */
  const refreshSession = useCallback(async (
    walletAddress: string,
    coinPublicKey: string
  ): Promise<void> => {
    if (!walletAddress || !coinPublicKey) return
    
    console.log('[ZKP] Refreshing session...')
    await connectWithZKP(walletAddress, coinPublicKey)
  }, [connectWithZKP])

  /**
   * Get the current proof
   */
  const getProof = useCallback((): ZKProof | null => {
    return zkpSession?.proof || null
  }, [zkpSession])

  /**
   * Verify the current session is still valid
   */
  const verifyCurrentSession = useCallback((): boolean => {
    if (!zkpSession) return false
    return isSessionValid(zkpSession)
  }, [zkpSession])

  // Auto-verify session periodically
  useEffect(() => {
    if (!zkpSession) return

    const interval = setInterval(() => {
      if (!verifyCurrentSession()) {
        console.log('[ZKP] Session expired or invalid')
        setZKPSession(null)
        setError('Session expired. Please reconnect.')
      }
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [zkpSession, verifyCurrentSession])

  return {
    zkpSession,
    isProcessing,
    isAuthenticated,
    error,
    connectWithZKP,
    checkExistingZKP,
    disconnectZKP,
    refreshSession,
    getProof,
    verifyCurrentSession,
  }
}
