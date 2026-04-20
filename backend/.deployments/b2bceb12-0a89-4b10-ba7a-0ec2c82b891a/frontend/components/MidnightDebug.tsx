'use client'
import { useEffect } from "react"

export default function MidnightDebug() {
  useEffect(() => {
    const w = window as any
    console.log("MIDNIGHT PROVIDER:", w.midnight)
    console.log("CARDANO MIDNIGHT:", w.cardano?.midnight)
  }, [])

  return <div className="text-white">Debugging Midnight Provider... check console</div>
}
