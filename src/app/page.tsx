import GPUTable from "@/components/GPUTable"

export default function Home() {
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

      {/* ── Table ── */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <GPUTable />
      </div>
    </main>
  )
}
