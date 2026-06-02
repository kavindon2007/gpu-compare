"use client"

/**
 * FilterBar.tsx — Filter and sort controls for the GPU comparison table.
 *
 * All state lives HERE. This component calls its parent's onChange callback
 * whenever any filter changes, so the parent (Homepage) can pass the current
 * filter values down to GPUTable as props.
 *
 * Data flow:
 *   FilterBar (owns filter state)
 *       ↓ onChange(filters)
 *   page.tsx (passes filters down)
 *       ↓ gpuFilter, providerFilter, typeFilter, sort
 *   GPUTable (uses filters to build the /api/gpus fetch URL)
 */

import { useState } from "react"

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type FilterState = {
  gpu: string          // free text — partial match on gpu_model
  provider: string     // exact match: "RunPod" | "Vast.ai" | "" (all)
  type: string         // "on-demand" | "spot" | "" (all)
  sort: string         // "price_asc" | "price_desc"
}

type FilterBarProps = {
  /** Called every time any filter changes */
  onChange: (filters: FilterState) => void
  /** Optional initial state (useful for URL-driven filters later) */
  initial?: Partial<FilterState>
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const PROVIDERS = [
  { value: "",             label: "All Providers" },
  { value: "RunPod",       label: "RunPod" },
  { value: "Vast.ai",      label: "Vast.ai" },
  { value: "DigitalOcean", label: "DigitalOcean" },
  { value: "Lambda Labs",  label: "Lambda Labs" },
  { value: "TensorDock",   label: "TensorDock" },
]

const LISTING_TYPES = [
  { value: "",          label: "All Types" },
  { value: "on-demand", label: "On-demand" },
  { value: "spot",      label: "Spot" },
  { value: "reserved",  label: "Reserved" },
]

const SORT_OPTIONS = [
  { value: "price_asc",  label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
]

const DEFAULT_FILTERS: FilterState = {
  gpu:      "",
  provider: "",
  type:     "",
  sort:     "price_asc",
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED INPUT STYLES
// ─────────────────────────────────────────────────────────────────────────────

const inputClass =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm " +
  "text-gray-800 shadow-sm placeholder-gray-400 " +
  "focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"

const labelClass = "block text-xs font-medium text-gray-500 mb-1"

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function FilterBar({ onChange, initial = {} }: FilterBarProps) {
  const [filters, setFilters] = useState<FilterState>({
    ...DEFAULT_FILTERS,
    ...initial,
  })

  /** Updates one field and notifies parent immediately */
  function update(field: keyof FilterState, value: string) {
    const next = { ...filters, [field]: value }
    setFilters(next)
    onChange(next)
  }

  /** Resets everything back to defaults */
  function clearAll() {
    setFilters(DEFAULT_FILTERS)
    onChange(DEFAULT_FILTERS)
  }

  const hasActiveFilters =
    filters.gpu !== "" ||
    filters.provider !== "" ||
    filters.type !== "" ||
    filters.sort !== "price_asc"

  return (
    <div className="w-full rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      {/* ── Controls row ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">

        {/* GPU model search */}
        <div className="flex-1 min-w-[160px]">
          <label htmlFor="filter-gpu" className={labelClass}>
            GPU Model
          </label>
          <input
            id="filter-gpu"
            type="text"
            placeholder="e.g. H100, RTX 4090…"
            value={filters.gpu}
            onChange={(e) => update("gpu", e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Provider dropdown */}
        <div className="flex-1 min-w-[140px]">
          <label htmlFor="filter-provider" className={labelClass}>
            Provider
          </label>
          <select
            id="filter-provider"
            value={filters.provider}
            onChange={(e) => update("provider", e.target.value)}
            className={inputClass}
          >
            {PROVIDERS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Listing type dropdown */}
        <div className="flex-1 min-w-[130px]">
          <label htmlFor="filter-type" className={labelClass}>
            Type
          </label>
          <select
            id="filter-type"
            value={filters.type}
            onChange={(e) => update("type", e.target.value)}
            className={inputClass}
          >
            {LISTING_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort dropdown */}
        <div className="flex-1 min-w-[160px]">
          <label htmlFor="filter-sort" className={labelClass}>
            Sort By
          </label>
          <select
            id="filter-sort"
            value={filters.sort}
            onChange={(e) => update("sort", e.target.value)}
            className={inputClass}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Clear filters button — only shows when something is active */}
        {hasActiveFilters && (
          <div className="flex-shrink-0">
            <button
              onClick={clearAll}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150 whitespace-nowrap"
            >
              ✕ Clear
            </button>
          </div>
        )}
      </div>

      {/* ── Active filter chips ── */}
      {hasActiveFilters && (
        <div className="mt-3 flex flex-wrap gap-2">
          {filters.gpu && (
            <Chip label={`GPU: "${filters.gpu}"`} onRemove={() => update("gpu", "")} />
          )}
          {filters.provider && (
            <Chip label={`Provider: ${filters.provider}`} onRemove={() => update("provider", "")} />
          )}
          {filters.type && (
            <Chip label={`Type: ${filters.type}`} onRemove={() => update("type", "")} />
          )}
          {filters.sort !== "price_asc" && (
            <Chip label="Sort: Price High → Low" onRemove={() => update("sort", "price_asc")} />
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CHIP — removable active filter tag
// ─────────────────────────────────────────────────────────────────────────────

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-medium text-blue-700">
      {label}
      <button
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="ml-0.5 text-blue-400 hover:text-blue-700"
      >
        ×
      </button>
    </span>
  )
}
