/**
 * GET /api/gpus
 *
 * Returns live GPU listings from Supabase.
 * Matches the API spec in context.md exactly.
 *
 * Query parameters (all optional):
 *   ?gpu=H100          — filter by GPU model (partial match, case-insensitive)
 *   ?provider=RunPod   — filter by provider (exact match, case-insensitive)
 *   ?type=spot         — filter by listing_type: "on-demand" | "spot" | "reserved"
 *   ?sort=price        — sort by price ascending (default)
 *
 * This same endpoint becomes the MCP server in Phase 5.
 * Keep it clean REST — no side effects, no auth required.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // ── Read query params ───────────────────────────────────────────
    const gpuFilter      = searchParams.get('gpu')       // e.g. "H100"
    const providerFilter = searchParams.get('provider')  // e.g. "RunPod"
    const typeFilter     = searchParams.get('type')      // e.g. "spot"
    const sortBy         = searchParams.get('sort')      // "price" (only supported value)

    // ── Build Supabase query ────────────────────────────────────────
    let query = supabase
      .from('gpu_listings')
      .select(
        'provider, gpu_model, vram_gb, price_per_hour, listing_type, is_available, region, link, updated_at'
      )
      // Only return available listings by default
      .eq('is_available', true)

    // ?gpu=H100 — partial, case-insensitive match on gpu_model
    // ilike is Supabase's case-insensitive LIKE
    if (gpuFilter) {
      query = query.ilike('gpu_model', `%${gpuFilter}%`)
    }

    // ?provider=RunPod — exact match (case-insensitive)
    if (providerFilter) {
      query = query.ilike('provider', providerFilter)
    }

    // ?type=spot — exact match on listing_type
    if (typeFilter) {
      query = query.eq('listing_type', typeFilter)
    }

    // ?sort=price — sort by price ascending (cheapest first)
    // Default is also price ascending — most useful for comparison
    if (!sortBy || sortBy === 'price') {
      query = query.order('price_per_hour', { ascending: true })
    }

    // ── Execute query ───────────────────────────────────────────────
    const { data, error } = await query

    if (error) {
      console.error('[/api/gpus] Supabase error:', error.message)
      return NextResponse.json(
        { error: 'Failed to fetch GPU listings', detail: error.message },
        { status: 500 }
      )
    }

    // ── Return response ─────────────────────────────────────────────
    // Add cache headers so the browser/CDN caches this for 5 minutes.
    // Revalidates in background — users always see fresh-ish data.
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    })
  } catch (err) {
    console.error('[/api/gpus] Unexpected error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
