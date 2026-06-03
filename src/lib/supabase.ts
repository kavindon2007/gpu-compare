import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy singleton — client is created on first use (at runtime), not at build time.
// This prevents Vercel build failures when env vars are only available at runtime.
let _client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (_client) return _client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel → Settings → Environment Variables.'
    )
  }

  _client = createClient(url, key)
  return _client
}

// Backwards-compatible named export used throughout the codebase
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as any)[prop]
  },
})

// Type definitions matching the database schema

export type GpuListing = {
  id: string
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

export type FreeTier = {
  id: string
  platform: string
  gpu_model: string | null
  weekly_hours: number | null
  vram_gb: number | null
  notes: string | null
  signup_link: string | null
  updated_at: string
}
