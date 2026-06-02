"use client"

import FreeTierTable from "@/components/FreeTierTable"
import Link from "next/link"

export default function FreeComputePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">
            <span>🎁 Zero Cost</span>
            <span>•</span>
            <span>No Card Required</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
            Free GPU Compute Tiers
          </h1>
          <p className="mt-2 text-base text-gray-500 max-w-2xl">
            A curated list of cloud platforms offering free GPU notebooks and instances. Perfect for learning ML, running fast experiments, or hosting demos.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <FreeTierTable />
        </div>

        {/* Informational Box */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              💡 Tips for Free Tiers
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-600 list-disc list-inside">
              <li>Use Kaggle for standard 30-hour weekly limits.</li>
              <li>Save your notebook checkpoint frequently as sessions automatically shut down on idle.</li>
              <li>Google Colab offers T4 GPUs, but usage is dynamically capped via compute units.</li>
              <li>Lightning AI is great for fast setups and provides 22 free credits monthly.</li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              ⚡ Need More Power?
            </h3>
            <p className="mt-3 text-sm text-gray-600 leading-relaxed">
              If your models are too large for free tiers (e.g. training LLMs or large diffusion models), check out our paid GPU comparison.
            </p>
            <div className="mt-4">
              <Link
                href="/"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 transition duration-150"
              >
                Compare Paid GPUs →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
