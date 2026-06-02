/**
 * AffiliateLink.tsx — Wrapper for ALL outbound affiliate links.
 *
 * RULE: Every link to an external GPU provider must use this component.
 *       Never use a plain <a href="..."> for provider links.
 *
 * What this component does:
 *   1. Adds rel="noopener noreferrer sponsored" for security + SEO compliance
 *   2. Opens in a new tab (target="_blank") — standard for affiliate links
 *   3. Adds rel="sponsored" — required by Google for paid/affiliate links
 *      (failure to mark sponsored links can hurt your SEO ranking)
 *   4. Accepts a `provider` prop to auto-resolve the affiliate URL from
 *      affiliates.ts — so you never touch URLs in component code
 *   5. Falls back gracefully to a raw `href` if no affiliate mapping exists
 *   6. Shows a subtle external link icon so users know it opens a new tab
 *   7. Tracks clicks via a console event (replace with analytics later)
 */

import { getAffiliateLink } from "@/lib/affiliates"

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type AffiliateLinkProps = {
  /** Provider name from the DB (e.g. "RunPod", "Vast.ai") — auto-resolves URL */
  provider?: string

  /**
   * Raw href to use if no provider is specified, or as fallback.
   * Use this for links that already contain machine-specific affiliate URLs
   * from the scraper (e.g. Vast.ai listing-specific links).
   */
  href?: string

  /** Link label text or child elements */
  children: React.ReactNode

  /** Extra Tailwind classes to customize appearance */
  className?: string

  /** Whether to show the external link ↗ icon (default: true) */
  showIcon?: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function AffiliateLink({
  provider,
  href,
  children,
  className = "",
  showIcon = true,
}: AffiliateLinkProps) {
  // Resolve the final URL:
  // 1. If provider is given, look up its affiliate link from affiliates.ts
  // 2. Use `href` as fallback (e.g. machine-specific scraped links)
  // 3. If neither resolves, default to "#" (never broken links)
  const resolvedHref = provider
    ? getAffiliateLink(provider, href)
    : href ?? "#"

  // Track clicks — replace with your analytics provider later
  // (e.g. Plausible, Google Analytics, PostHog)
  function handleClick() {
    if (typeof window !== "undefined") {
      console.log(`[Affiliate Click] provider=${provider ?? "direct"} href=${resolvedHref}`)
      // Example with Plausible:
      // window.plausible?.("Affiliate Click", { props: { provider, href: resolvedHref } })
    }
  }

  return (
    <a
      href={resolvedHref}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={handleClick}
      className={`inline-flex items-center gap-1 ${className}`}
    >
      {children}
      {showIcon && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 12 12"
          width="10"
          height="10"
          fill="currentColor"
          aria-hidden="true"
          className="opacity-60 flex-shrink-0"
        >
          {/* External link arrow icon */}
          <path d="M3.5 3a.5.5 0 0 0 0 1H7.3L2.15 9.15a.5.5 0 0 0 .7.7L8 4.7V8.5a.5.5 0 0 0 1 0v-5a.5.5 0 0 0-.5-.5h-5Z" />
        </svg>
      )}
    </a>
  )
}
