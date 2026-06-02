/**
 * lib/affiliates.ts — Single source of truth for ALL affiliate links.
 *
 * RULE: Never hardcode a provider URL anywhere else in this codebase.
 *       Every outbound link to a GPU provider must come from this file.
 *
 * WHY THIS MATTERS:
 *   - Affiliate programs change their referral URL format without warning.
 *   - If a link is hardcoded in 12 components, you have to find & fix all 12.
 *   - With this file, you change ONE line and every link on the site updates.
 *   - Also makes it trivial to A/B test different ref codes in the future.
 *
 * HOW TO REPLACE PLACEHOLDERS:
 *   Search for "YOURREF" in this file and replace each one with your real
 *   referral code after you get approved by each affiliate program.
 *
 *   Apply order (fastest approval first):
 *     1. Amazon Associates  → affiliate-program.amazon.com (instant)
 *     2. DigitalOcean       → digitalocean.com/referral    (instant)
 *     3. Vast.ai            → vast.ai/affiliates            (after site is live)
 *     4. RunPod             → runpod.io/affiliates          (after site is live)
 *     5. Lambda Labs        → lambdalabs.com (footer link)  (after site is live)
 */

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER TYPE
// ─────────────────────────────────────────────────────────────────────────────

export type Provider = keyof typeof AFFILIATES

// ─────────────────────────────────────────────────────────────────────────────
// AFFILIATE LINKS
// Replace each YOURREF with your real referral code once approved.
// ─────────────────────────────────────────────────────────────────────────────

export const AFFILIATES = {
  // ── PRIMARY (GPU cloud — direct commission) ───────────────────────────────

  /** RunPod affiliate: $10–15 per signup. Apply: runpod.io/affiliates */
  runpod: "https://runpod.io/?ref=YOURREF",

  /** Vast.ai affiliate: 5% of user spend. Apply: vast.ai/affiliates */
  vastai: "https://vast.ai/?ref=YOURREF",

  /** DigitalOcean referral: $25 per signup. Apply: digitalocean.com/referral */
  digitalocean: "https://www.digitalocean.com/?refcode=YOURREF",

  /** Lambda Labs: commission varies. Apply via footer at lambdalabs.com */
  lambda: "https://lambdalabs.com/?ref=YOURREF",

  /** TensorDock: commission varies. Apply: tensordock.com */
  tensordock: "https://tensordock.com/?ref=YOURREF",

  // ── SECONDARY (Amazon Associates — books, accessories) ───────────────────

  /** Amazon India Associates: 3–5% per purchase. Apply: affiliate-program.amazon.in */
  amazon: "https://www.amazon.in/?tag=YOURREF",

  // ── FREE TIERS (no affiliate, but tracked for SEO value) ─────────────────

  /** Kaggle — free GPU notebooks (no affiliate program) */
  kaggle: "https://www.kaggle.com/",

  /** Google Colab — free/pro GPU notebooks (no affiliate program) */
  colab: "https://colab.research.google.com/",

  /** Lightning AI — free GPU compute studio (no affiliate program) */
  lightning: "https://lightning.ai/",

  /** HuggingFace Spaces — free ML demos (no affiliate program) */
  huggingface: "https://huggingface.co/spaces",
} as const

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Get affiliate link by provider name (from database row)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Maps a provider string from the database to its affiliate link.
 *
 * Usage:
 *   const link = getAffiliateLink("RunPod")
 *   // returns "https://runpod.io/?ref=YOURREF"
 *
 * Falls back to the raw link from the DB if provider not found here.
 * This handles scraped links that already contain machine-specific URLs.
 */
export function getAffiliateLink(
  provider: string,
  fallbackLink?: string | null
): string {
  const normalized = provider.toLowerCase().replace(/[\s.-]/g, "")

  const providerMap: Record<string, string> = {
    runpod:       AFFILIATES.runpod,
    vastai:       AFFILIATES.vastai,
    digitalocean: AFFILIATES.digitalocean,
    lambda:       AFFILIATES.lambda,
    lambdalabs:   AFFILIATES.lambda,
    tensordock:   AFFILIATES.tensordock,
    kaggle:       AFFILIATES.kaggle,
    colab:        AFFILIATES.colab,
    googlecolab:  AFFILIATES.colab,
    lightning:    AFFILIATES.lightning,
    lightningai:  AFFILIATES.lightning,
    huggingface:  AFFILIATES.huggingface,
  }

  return providerMap[normalized] ?? fallbackLink ?? "#"
}

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER METADATA (display names, colors for badges)
// ─────────────────────────────────────────────────────────────────────────────

export type ProviderMeta = {
  displayName: string
  color: string        // Tailwind background color class
  textColor: string    // Tailwind text color class
}

export const PROVIDER_META: Record<string, ProviderMeta> = {
  "RunPod": {
    displayName: "RunPod",
    color: "bg-violet-500",
    textColor: "text-white",
  },
  "Vast.ai": {
    displayName: "Vast.ai",
    color: "bg-blue-500",
    textColor: "text-white",
  },
  "DigitalOcean": {
    displayName: "DigitalOcean",
    color: "bg-sky-500",
    textColor: "text-white",
  },
  "Lambda Labs": {
    displayName: "Lambda",
    color: "bg-indigo-500",
    textColor: "text-white",
  },
  "TensorDock": {
    displayName: "TensorDock",
    color: "bg-orange-500",
    textColor: "text-white",
  },
  // Free tier platforms
  "Kaggle": {
    displayName: "Kaggle",
    color: "bg-cyan-500",
    textColor: "text-white",
  },
  "Google Colab": {
    displayName: "Colab",
    color: "bg-amber-500",
    textColor: "text-white",
  },
  "Lightning AI": {
    displayName: "Lightning",
    color: "bg-yellow-400",
    textColor: "text-gray-900",
  },
  "HuggingFace": {
    displayName: "HF Spaces",
    color: "bg-yellow-300",
    textColor: "text-gray-900",
  },
}

/**
 * Returns display metadata for a provider, with a safe fallback.
 */
export function getProviderMeta(provider: string): ProviderMeta {
  return PROVIDER_META[provider] ?? {
    displayName: provider,
    color: "bg-gray-500",
    textColor: "text-white",
  }
}
