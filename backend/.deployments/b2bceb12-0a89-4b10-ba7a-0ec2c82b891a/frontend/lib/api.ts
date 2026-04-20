export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000'

export async function fetchCreator(creatorId: string) {
  const res = await fetch(`${API_BASE}/creator/${creatorId}`)
  return res.json()
}

export async function fetchZkAnonymous() {
  const res = await fetch(`${API_BASE}/zk/anonymous`)
  return res.json()
}

export async function postAiCalc(payload: any) {
  const res = await fetch(`${API_BASE}/ai/calc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return res.json()
}

export async function postTrustCalc(payload: any) {
  const res = await fetch(`${API_BASE}/trust/calc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return res.json()
}

export async function fetchTxs(userId: string) {
  const res = await fetch(`${API_BASE}/tx/${userId}`)
  return res.json()
}

export async function fetchMarketSummary() {
  const res = await fetch(`${API_BASE}/market/summary`)
  return res.json()
}

export async function fetchTokensList() {
  const res = await fetch(`${API_BASE}/tokens/list`)
  return res.json()
}

export async function fetchAnalytics(tokenId: string) {
  try {
    const res = await fetch(`${API_BASE}/analytics/${tokenId}`)
    if (!res.ok) return null
    return res.json()
  } catch (e) {
    return null
  }
}
