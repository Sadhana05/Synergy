import { FileText, Shield, AlertTriangle, Scale } from "lucide-react"

export default function TermsPage() {
  return (
    <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-2">
        <FileText size={28} className="text-[#9CFFBB]" />
        <h1 className="text-3xl font-bold text-white">Terms of Use</h1>
      </div>
      <p className="text-gray-400 mb-8">Last updated: January 2025</p>

      <div className="glass-card rounded-2xl p-8 space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Scale size={20} className="text-[#9CFFBB]" />
            Acceptance of Terms
          </h2>
          <p className="text-gray-300 leading-relaxed">
            By accessing or using Miso.Tx, you agree to be bound by these Terms of Use and all applicable laws and
            regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this
            platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">Platform Usage</h2>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-[#9CFFBB] mt-2 shrink-0" />
              <span>You must be at least 18 years old to use this platform.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-[#9CFFBB] mt-2 shrink-0" />
              <span>You are responsible for maintaining the security of your wallet and private keys.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-[#9CFFBB] mt-2 shrink-0" />
              <span>You agree not to use the platform for any illegal or unauthorized purpose.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-[#9CFFBB] mt-2 shrink-0" />
              <span>You understand that all transactions on the blockchain are irreversible.</span>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-yellow-400" />
            Risk Disclosure
          </h2>
          <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-gray-300 leading-relaxed">
              Trading cryptocurrencies and meme tokens involves substantial risk and may result in the loss of your
              entire investment. Meme tokens are highly speculative and volatile. Past performance is not indicative of
              future results. Only invest what you can afford to lose.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">Token Creation</h2>
          <p className="text-gray-300 leading-relaxed mb-4">When creating a token on Miso.Tx, you acknowledge that:</p>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-[#9CFFBB] mt-2 shrink-0" />
              <span>You are solely responsible for the token you create and its use.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-[#9CFFBB] mt-2 shrink-0" />
              <span>You will not create tokens that infringe on intellectual property rights.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-[#9CFFBB] mt-2 shrink-0" />
              <span>You will not create tokens for fraudulent or malicious purposes.</span>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Shield size={20} className="text-[#9CFFBB]" />
            Limitation of Liability
          </h2>
          <p className="text-gray-300 leading-relaxed">
            Miso.Tx and its operators shall not be liable for any indirect, incidental, special, consequential, or
            punitive damages resulting from your use of the platform. We provide the platform &quot;as is&quot; without
            warranties of any kind.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">Contact</h2>
          <p className="text-gray-300">
            For questions about these terms, contact us at{" "}
            <a href="mailto:legal@miso.tx" className="text-[#9CFFBB] hover:underline">
              legal@miso.tx
            </a>
          </p>
        </section>
      </div>
    </div>
  )
}
