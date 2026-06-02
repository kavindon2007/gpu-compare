import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GPU Compare — Live GPU Pricing & Free Compute Tracker',
  description: 'Compare real-time GPU cloud pricing across RunPod, Vast.ai and more. Track free compute options on Kaggle, Colab, and Lightning AI.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} flex flex-col min-h-screen bg-gray-50 text-gray-900 antialiased`}>
        {/* ── Navigation Header ── */}
        <header className="sticky top-0 z-40 w-full border-b border-gray-200/80 bg-white/80 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 text-xl font-bold tracking-tight text-gray-900 hover:opacity-90 transition">
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">GPU Compare</span>
            </Link>

            {/* Navigation links */}
            <nav className="flex space-x-1 sm:space-x-4">
              <Link
                id="nav-paid-gpus"
                href="/"
                className="px-3 py-2 text-sm font-semibold rounded-lg text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition"
              >
                Paid GPUs
              </Link>
              <Link
                id="nav-free-compute"
                href="/free-compute"
                className="px-3 py-2 text-sm font-semibold rounded-lg text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition"
              >
                Free Compute
              </Link>
              <Link
                id="nav-tutorials"
                href="/tutorials"
                className="px-3 py-2 text-sm font-semibold rounded-lg text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition"
              >
                Tutorials
              </Link>
            </nav>
          </div>
        </header>

        {/* ── Main Content ── */}
        <div className="flex-grow">
          {children}
        </div>

        {/* ── Footer ── */}
        <footer className="border-t border-gray-200 bg-white py-8">
          <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <div>
              <p className="font-semibold text-gray-700">GPU Compare © {new Date().getFullYear()}</p>
              <p className="mt-1 text-xs">Aggregating live GPU cloud pricing and free compute options hourly.</p>
            </div>
            <div className="flex space-x-6 text-xs">
              <Link href="/" className="hover:text-blue-600 transition">Paid GPUs</Link>
              <Link href="/free-compute" className="hover:text-blue-600 transition">Free Tiers</Link>
              <Link href="/tutorials" className="hover:text-blue-600 transition">Tutorials</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}

