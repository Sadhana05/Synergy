"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Lock, CheckCircle2, Shield, Zap } from "lucide-react"

export default function ProofPage() {
  const [proofType, setProofType] = useState<"balance" | "transaction" | "identity">("balance")
  const [proofStatus, setProofStatus] = useState<"idle" | "generating" | "verified">("idle")
  const [proofData, setProofData] = useState("")
  const [verificationHash, setVerificationHash] = useState("")

  const handleGenerateProof = async () => {
    setProofStatus("generating")
    // Simulate proof generation
    setTimeout(() => {
      setProofStatus("verified")
      setVerificationHash(`0x${Math.random().toString(16).slice(2)}`)
      setProofData(`Zero Knowledge Proof for ${proofType} verification generated successfully`)
    }, 2000)
  }

  const PROOF_TYPES = [
    {
      id: "balance",
      title: "Balance Verification",
      description: "Prove you own tokens without revealing your balance",
      benefits: ["Privacy preserved", "No wallet exposure", "Instant verification"],
    },
    {
      id: "transaction",
      title: "Transaction History",
      description: "Prove trading history without exposing details",
      benefits: ["Selective disclosure", "Compliance ready", "Reputation proof"],
    },
    {
      id: "identity",
      title: "Identity Verification",
      description: "Prove identity without personal data exposure",
      benefits: ["Privacy first", "Regulatory compliant", "Decentralized"],
    },
  ]

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield size={32} className="text-[#9CFFBB]" />
          <div>
            <h1 className="text-4xl font-bold text-white">Zero Knowledge Proofs</h1>
            <p className="text-gray-400">Privacy-first verification using Midnight Protocol</p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <Card className="bg-blue-500/10 border-blue-500/20 mb-8">
        <div className="p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-blue-300 font-semibold mb-1">What are Zero Knowledge Proofs?</h3>
            <p className="text-blue-200 text-sm">
              ZK Proofs allow you to prove something is true without revealing the underlying information. On Miso.Tx,
              use them to verify your holdings and history while maintaining complete privacy.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {PROOF_TYPES.map((proof) => (
          <Card
            key={proof.id}
            onClick={() => setProofType(proof.id as typeof proofType)}
            className={`bg-[#111111] border-[#9CFFBB]/10 cursor-pointer transition-all hover:border-[#9CFFBB]/30 ${
              proofType === proof.id ? "border-[#9CFFBB]/50 ring-2 ring-[#9CFFBB]" : ""
            }`}
          >
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-2">{proof.title}</h3>
              <p className="text-gray-400 text-sm mb-4">{proof.description}</p>
              <div className="space-y-2">
                {proof.benefits.map((benefit, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#9CFFBB]" />
                    <span className="text-sm text-gray-300">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Proof Generator */}
        <div className="lg:col-span-2">
          <Card className="bg-[#111111] border-[#9CFFBB]/10">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Generate Proof</h2>

              <div className="space-y-6">
                {/* Proof Type Info */}
                <div className="bg-[#1a1a1a] p-4 rounded-lg">
                  <h3 className="text-white font-semibold mb-2">Selected: {proofType}</h3>
                  <p className="text-gray-400 text-sm">{PROOF_TYPES.find((p) => p.id === proofType)?.description}</p>
                </div>

                {/* Input Parameters */}
                {proofType === "balance" && (
                  <div>
                    <label className="text-gray-300 text-sm mb-2 block">Minimum Balance (ADA)</label>
                    <Input
                      type="number"
                      placeholder="Enter minimum balance to prove"
                      className="bg-[#1a1a1a] border-[#9CFFBB]/20 text-white"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Prove you hold at least this amount without revealing exact balance
                    </p>
                  </div>
                )}

                {proofType === "transaction" && (
                  <div>
                    <label className="text-gray-300 text-sm mb-2 block">Transaction Date Range</label>
                    <div className="grid grid-cols-2 gap-4">
                      <Input type="date" className="bg-[#1a1a1a] border-[#9CFFBB]/20 text-white" />
                      <Input type="date" className="bg-[#1a1a1a] border-[#9CFFBB]/20 text-white" />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Prove transaction history in this period without details
                    </p>
                  </div>
                )}

                {proofType === "identity" && (
                  <div>
                    <label className="text-gray-300 text-sm mb-2 block">Verification Level</label>
                    <select className="w-full bg-[#1a1a1a] border border-[#9CFFBB]/20 text-white rounded-lg p-2">
                      <option>Basic (Wallet verified)</option>
                      <option>Advanced (Multi-factor)</option>
                      <option>Enterprise (Full KYB)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-2">Choose verification level for compliance requirements</p>
                  </div>
                )}

                {/* Generate Button */}
                <Button
                  onClick={handleGenerateProof}
                  disabled={proofStatus === "generating"}
                  className="w-full bg-gradient-to-r from-[#9CFFBB] to-[#5CFF71] text-[#0A0A0A] font-semibold h-12"
                >
                  {proofStatus === "idle" && (
                    <>
                      <Zap size={18} className="mr-2" />
                      Generate Proof
                    </>
                  )}
                  {proofStatus === "generating" && "Generating..."}
                  {proofStatus === "verified" && (
                    <>
                      <CheckCircle2 size={18} className="mr-2" />
                      Proof Generated
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Proof Results */}
        <div className="lg:col-span-1">
          <Card className="bg-[#111111] border-[#9CFFBB]/10 sticky top-24">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Proof Status</h2>

              {proofStatus === "idle" ? (
                <div className="text-center py-8">
                  <Lock size={32} className="text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Generate a proof to see details</p>
                </div>
              ) : proofStatus === "generating" ? (
                <div className="text-center py-8">
                  <div className="inline-block p-2 rounded-full bg-[#9CFFBB]/20 animate-pulse mb-3">
                    <Zap size={24} className="text-[#9CFFBB]" />
                  </div>
                  <p className="text-gray-300 text-sm font-medium">Generating proof...</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-4 p-3 bg-[#9CFFBB]/10 rounded-lg">
                    <CheckCircle2 size={20} className="text-[#9CFFBB]" />
                    <span className="text-sm font-medium text-[#9CFFBB]">Verified</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Verification Hash</p>
                      <p className="text-xs font-mono text-gray-300 bg-[#1a1a1a] p-2 rounded break-all">
                        {verificationHash.slice(0, 20)}...
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400 mb-1">Proof Type</p>
                      <Badge className="bg-[#9CFFBB]/20 text-[#9CFFBB] capitalize">
                        <Lock size={12} className="mr-1" />
                        {proofType}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400 mb-1">Status</p>
                      <p className="text-sm font-medium text-[#9CFFBB]">✓ Valid</p>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full border-[#9CFFBB]/30 text-gray-300 hover:text-white mt-4 bg-transparent"
                    >
                      Copy Proof
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full border-[#9CFFBB]/30 text-gray-300 hover:text-white bg-transparent"
                    >
                      Export Proof
                    </Button>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* How It Works */}
      <Card className="bg-[#111111] border-[#9CFFBB]/10 mt-8">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-6">How Zero Knowledge Proofs Work</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                title: "Create Proof",
                desc: "Generate a cryptographic proof that proves something true without revealing details",
              },
              {
                step: "2",
                title: "Share Proof",
                desc: "Share the proof with anyone - they can verify it without accessing your private data",
              },
              {
                step: "3",
                title: "Stay Private",
                desc: "Your actual data remains private while proof of authenticity is public",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-[#9CFFBB]/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg font-bold text-[#9CFFBB]">{item.step}</span>
                </div>
                <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
