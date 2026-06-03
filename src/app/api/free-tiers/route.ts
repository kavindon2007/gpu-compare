/**
 * GET /api/free-tiers
 * Returns all free compute tier platforms from Supabase.
 * No filters needed — there are only ~5 rows, always return all.
 */

import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("free_tiers")
      .select("platform, gpu_model, vram_gb, weekly_hours, notes, signup_link")
      .order("weekly_hours", { ascending: false }) // most hours first

    if (error) {
      console.error("[/api/free-tiers] Supabase error:", error.message)
      return NextResponse.json(
        { error: "Failed to fetch free tier data", detail: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data, {
      status: 200,
      headers: {
        // Cache for 1 hour — free tier data changes rarely
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=300",
      },
    })
  } catch (err) {
    console.error("[/api/free-tiers] Unexpected error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
