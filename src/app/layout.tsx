import type { Metadata } from 'next'
import './globals.css'

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
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
