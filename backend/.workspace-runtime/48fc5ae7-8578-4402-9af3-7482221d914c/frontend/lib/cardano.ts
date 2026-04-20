// CIP-30 Cardano Wallet API Types
export interface CardanoWalletApi {
  getNetworkId(): Promise<number>
  getUtxos(): Promise<string[] | undefined>
  getBalance(): Promise<string>
  getUsedAddresses(): Promise<string[]>
  getUnusedAddresses(): Promise<string[]>
  getChangeAddress(): Promise<string>
  getRewardAddresses(): Promise<string[]>
  signTx(tx: string, partialSign?: boolean): Promise<string>
  signData(addr: string, payload: string): Promise<{ signature: string; key: string }>
  submitTx(tx: string): Promise<string>
}

export interface CardanoWallet {
  name: string
  icon: string
  apiVersion: string
  enable(): Promise<CardanoWalletApi>
  isEnabled(): Promise<boolean>
}

declare global {
  interface Window {
    cardano?: {
      lace?: CardanoWallet
      midnight?: CardanoWallet
      [key: string]: CardanoWallet | undefined
    }
  }
}

// Helper to decode CBOR hex to lovelace (simplified)
export function hexToLovelace(hex: string): number {
  try {
    // The balance is returned as CBOR encoded value
    // For simplicity, we parse the hex directly
    // In production, use a proper CBOR library like @emurgo/cardano-serialization-lib
    const bytes = hexToBytes(hex)
    if (bytes.length === 0) return 0

    // Simple CBOR integer decoding for common cases
    const firstByte = bytes[0]

    if (firstByte <= 0x17) {
      return firstByte
    } else if (firstByte === 0x18) {
      return bytes[1]
    } else if (firstByte === 0x19) {
      return (bytes[1] << 8) | bytes[2]
    } else if (firstByte === 0x1a) {
      return (bytes[1] << 24) | (bytes[2] << 16) | (bytes[3] << 8) | bytes[4]
    } else if (firstByte === 0x1b) {
      // 64-bit integer - use BigInt for accuracy
      let value = BigInt(0)
      for (let i = 1; i <= 8; i++) {
        value = (value << BigInt(8)) | BigInt(bytes[i] || 0)
      }
      return Number(value)
    }

    return 0
  } catch {
    return 0
  }
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(hex.substr(i, 2), 16)
  }
  return bytes
}

// Convert hex address to bech32 (simplified - shows hex for now)
export function hexToBech32(hex: string): string {
  // In production, use @emurgo/cardano-serialization-lib for proper bech32 encoding
  // For now, return a truncated version
  return `addr1${hex.slice(0, 50)}...`
}

export function isWalletAvailable(walletName: string): boolean {
  if (typeof window === "undefined") return false

  try {
    // Direct CIP-30 check - support Lace Midnight Preview (can inject as 'lace' or 'midnight')
    if (walletName === "lace") {
      // Check both 'lace' and 'midnight' keys as Lace Midnight Preview may use either
      const laceWallet = window.cardano?.lace || window.cardano?.midnight
      const isAvailable = !!laceWallet
      console.log("[v0] Lace Midnight Preview wallet available:", isAvailable)
      console.log("[v0] window.cardano keys:", window.cardano ? Object.keys(window.cardano) : [])
      if (laceWallet) {
        console.log("[v0] Lace Midnight Preview wallet object:", {
          hasEnable: typeof laceWallet.enable === "function",
          hasIsEnabled: typeof laceWallet.isEnabled === "function",
          hasName: !!laceWallet.name,
          name: laceWallet.name,
        })
      }
      return isAvailable
    }
  } catch (e) {
    console.log("[v0] Error checking wallet availability:", e)
  }

  return false
}

export function isTyphonAvailable(): boolean {
  return isWalletAvailable("lace")
}

export function getAvailableWallets(): string[] {
  if (typeof window === "undefined") return []

  try {
    const wallets: string[] = []

    // Check if cardano object exists
    console.log("[v0] window.cardano exists:", !!window.cardano)

    if (window.cardano) {
      console.log("[v0] window.cardano keys:", Object.keys(window.cardano))

      if (isWalletAvailable("lace")) {
        wallets.push("lace")
      }
    }

    console.log("[v0] Available wallets detected:", wallets)
    return wallets
  } catch (e) {
    console.log("[v0] Error getting available wallets:", e)
    return []
  }
}

export function waitForWallet(walletName: string, timeout = 10000): Promise<CardanoWallet | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(null)
      return
    }

    // Check if already available
    if (isWalletAvailable(walletName)) {
      const wallet = walletName === "lace" ? (window.cardano?.lace || window.cardano?.midnight) : null
      resolve(wallet || null)
      return
    }

    // Set up timeout
    const timeoutId = setTimeout(() => {
      window.removeEventListener("cardano#initialized", checkWallet)
      resolve(null)
    }, timeout)

    // Listen for wallet injection event
    const checkWallet = () => {
      if (isWalletAvailable(walletName)) {
        clearTimeout(timeoutId)
        window.removeEventListener("cardano#initialized", checkWallet)
        const wallet = walletName === "lace" ? (window.cardano?.lace || window.cardano?.midnight) : null
        resolve(wallet || null)
      }
    }

    window.addEventListener("cardano#initialized", checkWallet)
  })
}
