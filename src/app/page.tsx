"use client"

import { useState } from "react"
import GPUTable from "@/components/GPUTable"
import FilterBar, { FilterState } from "@/components/FilterBar"

const DEFAULT_FILTERS: FilterState = {
  gpu: "",
  provider: "",
  type: "",
  sort: "price_asc",
}

export default function Home() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)

  return (
    <main className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">GPU Compare</h1>
          <p className="mt-1 text-sm text-gray-500">
            Live GPU cloud pricing across RunPod, Vast.ai and more — updated hourly.
          </p>
        </div>
      </div>

      {/* ── Filters + Table ── */}
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        <FilterBar onChange={setFilters} />
        <GPUTable
          gpuFilter={filters.gpu}
          providerFilter={filters.provider}
          typeFilter={filters.type}
          sort={filters.sort}
        />
      </div>
    </main>
  )
}
