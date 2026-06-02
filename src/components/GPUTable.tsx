"use client"

/**
 * GPUTable.tsx — Main GPU pricing comparison table.
 *
 * Fetches from /api/gpus on the client (so data is always fresh per visit).
 * Accepts filter props from FilterBar so the parent page controls the query.
 *
 * Columns: Provider | GPU Model | VRAM | $/hr | Type | Region | Rent →
 */

import { useEffect, useState } from "react"
import AffiliateLink from "@/components/AffiliateLink"
import { getProviderMeta } from "@/lib/affiliates"

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type GpuListing = {
  provider: string
  gpu_model: string
  vram_gb: number | null
  price_per_hour: number | null
  listing_type: string | null
  is_available: boolean
  region: string | null
  link: string | null
  updated_at: string
}

type GPUTableProps = {
  /** Filter by GPU model — passed as ?gpu= param */
  gpuFilter?: string
  /** Filter by provider — passed as ?provider= param */
  providerFilter?: string
  /** Filter by listing type: "on-demand" | "spot" — passed as ?type= param */
  typeFilter?: string
  /** Sort order — passed as ?sort= param (default: "price") */
  sort?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Formats price as "$1.93/hr" or "—" if null */
function formatPrice(price: number | null): string {
  if (price === null || price === undefined) return "—"
  return `$${price.toFixed(2)}/hr`
}

/** Badge color for listing type */
function listingTypeBadge(type: string | null) {
  if (type === "spot") {
    return (
      <span className="inline-block rounded px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800">
        Spot
      </span>
    )
  }
  if (type === "on-demand") {
    return (
      <span className="inline-block rounded px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800">
        On-demand
      </span>
    )
  }
  if (type === "reserved") {
    return (
      <span className="inline-block rounded px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
        Reserved
      </span>
    )
  }
  return (
    <span className="inline-block rounded px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600">
      {type ?? "—"}
    </span>
  )
}

/** Provider colored badge using metadata from affiliates.ts */
function ProviderBadge({ provider }: { provider: string }) {
  const meta = getProviderMeta(provider)
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${meta.color} ${meta.textColor}`}
    >
      {meta.displayName}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LOADING SKELETON
// ─────────────────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Skeleton header */}
      <div className="h-10 bg-gray-100 rounded mb-1" />
      {/* Skeleton rows */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-2 py-3 border-b border-gray-100">
          <div className="h-5 bg-gray-100 rounded w-20" />
          <div className="h-5 bg-gray-100 rounded w-32 ml-2" />
          <div className="h-5 bg-gray-100 rounded w-12 ml-auto" />
          <div className="h-5 bg-gray-100 rounded w-16" />
          <div className="h-5 bg-gray-100 rounded w-20" />
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function GPUTable({
  gpuFilter = "",
  providerFilter = "",
  typeFilter = "",
  sort = "price",
}: GPUTableProps) {
  const [listings, setListings] = useState<GpuListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Fetch whenever filters change ─────────────────────────────────────────
  useEffect(() => {
    async function fetchListings() {
      setLoading(true)
      setError(null)

      // Build query string from active filters
      const params = new URLSearchParams()
      if (gpuFilter)      params.set("gpu",      gpuFilter)
      if (providerFilter) params.set("provider", providerFilter)
      if (typeFilter)     params.set("type",     typeFilter)
      if (sort)           params.set("sort",     sort)

      const url = `/api/gpus${params.size > 0 ? `?${params}` : ""}`

      try {
        const res = await fetch(url)

        if (!res.ok) {
          throw new Error(`API returned ${res.status}: ${res.statusText}`)
        }

        const data: GpuListing[] = await res.json()
        setListings(data)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load GPU listings. Please refresh."
        )
      } finally {
        setLoading(false)
      }
    }

    fetchListings()
  }, [gpuFilter, providerFilter, typeFilter, sort])

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="w-full">
        <p className="text-sm text-gray-500 mb-3">Loading GPU listings…</p>
        <TableSkeleton />
      </div>
    )
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <p className="font-semibold mb-1">Could not load GPU listings</p>
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

  // ── Empty state ───────────────────────────────────────────────────────────
  if (listings.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
        <p className="text-gray-500 text-sm">
          No GPU listings found
          {gpuFilter || providerFilter || typeFilter
            ? " matching your filters."
            : ". The scraper may not have run yet."}
        </p>
        {(gpuFilter || providerFilter || typeFilter) && (
          <p className="mt-1 text-xs text-gray-400">
            Try clearing your filters to see all available GPUs.
          </p>
        )}
      </div>
    )
  }

  // ── Table ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full">
      {/* Row count + last-updated hint */}
      <p className="text-xs text-gray-400 mb-2">
        Showing {listings.length} listing{listings.length !== 1 ? "s" : ""}
        {listings[0]?.updated_at && (
          <> · Updated {new Date(listings[0].updated_at).toLocaleTimeString()}</>
        )}
      </p>

      {/* Responsive scroll wrapper — horizontal scroll on small screens */}
      <div className="w-full overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm text-left">
          {/* ── Header ── */}
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 whitespace-nowrap">Provider</th>
              <th className="px-4 py-3 whitespace-nowrap">GPU Model</th>
              <th className="px-4 py-3 whitespace-nowrap">VRAM</th>
              <th className="px-4 py-3 whitespace-nowrap">Price / hr</th>
              <th className="px-4 py-3 whitespace-nowrap">Type</th>
              <th className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                Region
              </th>
              <th className="px-4 py-3 whitespace-nowrap text-right">Rent</th>
            </tr>
          </thead>

          {/* ── Body ── */}
          <tbody className="divide-y divide-gray-100 bg-white">
            {listings.map((listing, i) => (
              <tr
                key={i}
                className="hover:bg-gray-50 transition-colors duration-100"
              >
                {/* Provider badge */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <ProviderBadge provider={listing.provider} />
                </td>

                {/* GPU model */}
                <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                  {listing.gpu_model}
                </td>

                {/* VRAM */}
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                  {listing.vram_gb ? `${listing.vram_gb} GB` : "—"}
                </td>

                {/* Price — highlighted in blue if cheapest */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`font-semibold ${
                      i === 0 ? "text-blue-600" : "text-gray-900"
                    }`}
                  >
                    {formatPrice(listing.price_per_hour)}
                  </span>
                  {i === 0 && (
                    <span className="ml-1 text-xs text-blue-500 font-normal">
                      cheapest
                    </span>
                  )}
                </td>

                {/* Listing type badge */}
                <td className="px-4 py-3 whitespace-nowrap">
                  {listingTypeBadge(listing.listing_type)}
                </td>

                {/* Region — hidden on mobile */}
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap hidden md:table-cell">
                  {listing.region ?? "—"}
                </td>

                {/* CTA Button */}
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <AffiliateLink
                    provider={listing.provider}
                    href={listing.link ?? undefined}
                    showIcon={false}
                    className="inline-block rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors duration-150"
                  >
                    Rent →
                  </AffiliateLink>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Affiliate disclosure — required by FTC + affiliate programs */}
      <p className="mt-2 text-xs text-gray-400">
        * Links are affiliate links. We may earn a commission at no extra cost to you.
        Prices are updated hourly and may differ at checkout.
      </p>
    </div>
  )
}
