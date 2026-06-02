import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
