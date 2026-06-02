"use client"

import { useState } from "react"
import GPUTable from "@/components/GPUTable"
import FilterBar, { FilterState } from "@/components/FilterBar"
import FreeTierTable from "@/components/FreeTierTable"

const DEFAULT_FILTERS: FilterState = {
  gpu: "",
  provider: "",
  type: "",
  sort: "price_asc",
}

export default function HomeClient() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)

  return (
    <main className="py-8 bg-gray-50">
      {/* Hero / Header Section */}
      <div className="max-w-6xl mx-auto px-4 mb-8">
        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
            Compare Cloud GPU Pricing
          </h1>
          <p className="mt-2 text-base text-gray-500 max-w-2xl">
            Aggregated hourly pricing for spot and on-demand GPU instances across multiple paid providers.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 space-y-12">
        {/* Paid GPU Listings Section */}
        <section className="space-y-4">
          <div className="border-b border-gray-200 pb-3 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Paid GPU Listings</h2>
            <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2.5 py-1 rounded-full">Real-time</span>
          </div>
          <FilterBar onChange={setFilters} />
          <GPUTable
            gpuFilter={filters.gpu}
            providerFilter={filters.provider}
            typeFilter={filters.type}
            sort={filters.sort}
          />
        </section>

        {/* Free GPU Compute Tiers Section */}
        <section className="space-y-4">
          <div className="border-b border-gray-200 pb-3 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Free GPU Compute Tiers</h2>
            <span className="text-xs text-green-600 font-medium bg-green-50 px-2.5 py-1 rounded-full">No Card Needed</span>
          </div>
          <FreeTierTable />
        </section>
      </div>
    </main>
  )
}
