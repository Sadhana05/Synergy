'use client'
import { useEffect, useState } from 'react'

type MidnightAPI = {
  enable?: () => Promise<any>
  getUsedAddresses?: () => Promise<string[]>
}

export default function MidnightConnect() {
  const [provider, setProvider] = useState<MidnightAPI | null>(null)
  const [connected, setConnected] = useState(false)
  const [addresses, setAddresses] = useState<string[] | null>(null)

  // Detect Lace Midnight Provider
  useEffect(() => {
    const w = window as any
    const p = w.midnight || (w.cardano && w.cardano.midnight) || null
    setProvider(p)
  }, [])

  const connectWallet = async () => {
    if (!provider) {
      alert('Lace Midnight Preview Wallet not found.')
      return
    }

    try {
      const api = await provider.enable?.()
      setConnected(true)

      // Get addresses
      if (api?.getUsedAddresses) {
        const ads = await api.getUsedAddresses()
        setAddresses(ads)
      } else if (provider.getUsedAddresses) {
        const ads = await provider.getUsedAddresses()
        setAddresses(ads)
      } else {
        setAddresses(['Connected — but no address method found'])
      }
    } catch (e) {
      console.error(e)
      alert('Wallet connection cancelled or failed')
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Lace Midnight Wallet Connect</h2>
      <p>Provider: {provider ? 'Found' : 'Not Found'}</p>
      <p>Status: {connected ? 'Connected' : 'Not Connected'}</p>

      {!connected ? (
        <button
          style={{ padding: '8px 12px', cursor: 'pointer' }}
          onClick={connectWallet}
        >
          Connect Wallet
        </button>
      ) : (
        <div>
          <h4>Your Addresses:</h4>
          <pre>{JSON.stringify(addresses, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
