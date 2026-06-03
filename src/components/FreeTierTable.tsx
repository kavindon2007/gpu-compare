"use client"

/**
 * FreeTierTable.tsx — Free GPU compute options table.
 *
 * Reads from the `free_tiers` Supabase table via /api/free-tiers,
 * which we'll also create below. Static data seeded by the scraper.
 *
 * Columns: Platform | GPU | VRAM | Weekly Hours | Notes | Sign Up →
 */

import { useEffect, useState } from "react"
import AffiliateLink from "@/components/AffiliateLink"

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type FreeTier = {
  platform: string
  gpu_model: string | null
  vram_gb: number | null
  weekly_hours: number | null
  notes: string | null
  signup_link: string | null
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Weekly hours display: "30 hrs/wk" or "Limited" */
function formatHours(hours: number | null): string {
  if (!hours) return "Limited"
  return `${hours} hrs/wk`
}

/** VRAM display: "16 GB" or "Varies" */
function formatVram(vram: number | null): string {
  if (!vram) return "Varies"
  return `${vram} GB`
}

/** Platform icon/color mapping */
function PlatformBadge({ platform }: { platform: string }) {
  const styles: Record<string, { bg: string; text: string }> = {
    "Kaggle":             { bg: "bg-cyan-100",   text: "text-cyan-800" },
    "Google Colab":       { bg: "bg-amber-100",  text: "text-amber-800" },
    "Lightning AI":       { bg: "bg-yellow-100", text: "text-yellow-800" },
    "HuggingFace Spaces": { bg: "bg-orange-100", text: "text-orange-800" },
  }
  const s = styles[platform] ?? { bg: "bg-gray-100", text: "text-gray-700" }
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${s.bg} ${s.text}`}>
      {platform}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────────────────────────────────────

function FreeTierSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-10 bg-gray-100 rounded mb-1" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-3 py-3 border-b border-gray-100">
          <div className="h-5 bg-gray-100 rounded w-24" />
          <div className="h-5 bg-gray-100 rounded w-16 ml-2" />
          <div className="h-5 bg-gray-100 rounded w-12 ml-auto" />
          <div className="h-5 bg-gray-100 rounded w-20" />
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function FreeTierTable() {
  const [tiers, setTiers] = useState<FreeTier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTiers() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/free-tiers")
        if (!res.ok) throw new Error(`API returned ${res.status}`)
        const data: FreeTier[] = await res.json()
        setTiers(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load free tiers.")
      } finally {
        setLoading(false)
      }
    }
    fetchTiers()
  }, [])

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="w-full">
        <p className="text-sm text-gray-500 mb-3">Loading free compute options…</p>
        <FreeTierSkeleton />
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <p className="font-semibold mb-1">Could not load free tier data</p>
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    )
  }

  // ── Empty ──────────────────────────────────────────────────────────────────
  if (tiers.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
        No free tier data available yet.
      </div>
    )
  }

  // ── Table ──────────────────────────────────────────────────────────────────
  return (
    <div className="w-full">
      {/* Header callout */}
      <div className="mb-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
        <p className="text-sm font-medium text-green-800">
          🎓 Free compute — no credit card needed
        </p>
        <p className="mt-0.5 text-xs text-green-700">
          These platforms offer free GPU access with limits. Great for learning,
          experiments, and small models. All have session time limits and
          may disconnect idle notebooks.
        </p>
      </div>

      {/* Responsive scroll wrapper */}
      <div className="w-full overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm text-left">
          {/* ── Header ── */}
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 whitespace-nowrap">Platform</th>
              <th className="px-4 py-3 whitespace-nowrap">GPU</th>
              <th className="px-4 py-3 whitespace-nowrap">VRAM</th>
              <th className="px-4 py-3 whitespace-nowrap">Weekly Hours</th>
              <th className="px-4 py-3 whitespace-nowrap hidden md:table-cell">Notes</th>
              <th className="px-4 py-3 whitespace-nowrap text-right">Sign Up</th>
            </tr>
          </thead>

          {/* ── Body ── */}
          <tbody className="divide-y divide-gray-100 bg-white">
            {tiers.map((tier, i) => (
              <tr
                key={i}
                className="hover:bg-gray-50 transition-colors duration-100"
              >
                {/* Platform */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <PlatformBadge platform={tier.platform} />
                </td>

                {/* GPU model */}
                <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                  {tier.gpu_model ?? "CPU / varies"}
                </td>

                {/* VRAM */}
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                  {formatVram(tier.vram_gb)}
                </td>

                {/* Weekly hours */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`font-semibold ${
                      (tier.weekly_hours ?? 0) >= 30
                        ? "text-green-700"
                        : "text-amber-600"
                    }`}
                  >
                    {formatHours(tier.weekly_hours)}
                  </span>
                </td>

                {/* Notes — hidden on mobile */}
                <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell max-w-xs">
                  {tier.notes ?? "—"}
                </td>

                {/* Sign Up CTA */}
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {tier.signup_link ? (
                    <AffiliateLink
                      href={tier.signup_link}
                      showIcon={false}
                      className="inline-block rounded bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition-colors duration-150"
                    >
                      Try Free →
                    </AffiliateLink>
                  ) : (
                    <span className="text-gray-400 text-xs">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-xs text-gray-400">
        * Free tier limits change frequently. Verify current quotas on each platform's website.
      </p>
    </div>
  )
}
