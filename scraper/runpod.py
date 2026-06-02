"""
runpod.py — Scrapes GPU listings from the RunPod GraphQL API
and upserts them into the Supabase gpu_listings table.

RunPod uses GraphQL (POST). An API key is required.
Add RUNPOD_API_KEY to your environment variables.

Key difference from Vast.ai:
- RunPod returns GPU *types* (e.g. "RTX 4090"), not individual machines.
- Each GPU type has up to 4 price points:
    securePrice        → Secure Cloud, on-demand
    communityPrice     → Community Cloud, on-demand
    secureSpotPrice    → Secure Cloud, spot (interruptible)
    communitySpotPrice → Community Cloud, spot (interruptible)
- We save each non-null price as a SEPARATE row in gpu_listings,
  so users can filter/compare all options side by side.
"""

import os
import sys
import requests
from supabase import create_client, Client
from datetime import datetime, timezone

# ─────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────

RUNPOD_GRAPHQL_URL = "https://api.runpod.io/graphql"

PROVIDER_NAME = "RunPod"

# ─────────────────────────────────────────────
# GRAPHQL QUERY
# ─────────────────────────────────────────────

GRAPHQL_QUERY = """
query GpuTypes {
  gpuTypes {
    id
    displayName
    memoryInGb
    secureCloud
    communityCloud
    securePrice
    communityPrice
    secureSpotPrice
    communitySpotPrice
    lowestPrice(input: { gpuCount: 1 }) {
      stockStatus
    }
  }
}
"""


# ─────────────────────────────────────────────
# HELPER: Connect to Supabase
# ─────────────────────────────────────────────

def get_supabase_client() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")

    if not url:
        print("ERROR: SUPABASE_URL environment variable is not set.")
        sys.exit(1)

    if not key:
        print("ERROR: SUPABASE_KEY environment variable is not set.")
        print("  Use the service_role key, not the anon key.")
        sys.exit(1)

    return create_client(url, key)


# ─────────────────────────────────────────────
# HELPER: Fetch GPU types from RunPod GraphQL
# ─────────────────────────────────────────────

def fetch_runpod_gpu_types() -> list[dict]:
    """
    Sends the GraphQL query to RunPod and returns the list of GPU type objects.

    RunPod requires an API key passed as a query parameter:
      POST https://api.runpod.io/graphql?api_key=YOUR_KEY

    Returns empty list on any error so the scraper fails gracefully.
    """
    api_key = os.environ.get("RUNPOD_API_KEY")

    if not api_key:
        print("ERROR: RUNPOD_API_KEY environment variable is not set.")
        print("  Get your key: runpod.io/console/user/settings -> API Keys")
        print("  Then: export RUNPOD_API_KEY='your-key-here'")
        sys.exit(1)

    url = f"{RUNPOD_GRAPHQL_URL}?api_key={api_key}"

    print(f"Fetching GPU types from RunPod GraphQL API ...")

    try:
        response = requests.post(
            url,
            json={"query": GRAPHQL_QUERY},
            headers={"Content-Type": "application/json"},
            timeout=30,
        )
        response.raise_for_status()

        body = response.json()

        # GraphQL errors come back HTTP 200 but have an "errors" key
        if "errors" in body:
            for err in body["errors"]:
                print(f"  X GraphQL error: {err.get('message')}")
            return []

        gpu_types = body.get("data", {}).get("gpuTypes", [])

        if gpu_types is None:
            print("  X RunPod returned null for gpuTypes. API key may be invalid.")
            return []

        print(f"  + Received {len(gpu_types)} GPU types from RunPod")
        return gpu_types

    except requests.exceptions.Timeout:
        print("  X Request timed out after 30 seconds.")
        return []

    except requests.exceptions.ConnectionError:
        print("  X Could not connect to RunPod API.")
        return []

    except requests.exceptions.HTTPError as e:
        print(f"  X RunPod API returned HTTP error: {e}")
        return []

    except Exception as e:
        print(f"  X Unexpected error: {e}")
        return []


# ─────────────────────────────────────────────
# HELPER: Transform one GPU type into multiple DB rows
# ─────────────────────────────────────────────

def transform_gpu_type(gpu: dict) -> list[dict]:
    """
    RunPod returns one GPU type with multiple price points.
    We expand each price point into a separate row in gpu_listings.

    One GPU type can produce up to 4 rows:
      1. Secure Cloud,    on-demand  (securePrice)
      2. Community Cloud, on-demand  (communityPrice)
      3. Secure Cloud,    spot       (secureSpotPrice)
      4. Community Cloud, spot       (communitySpotPrice)

    We skip a variant if its price is None (GPU not available in that tier).

    RunPod field         DB column
    displayName       -> gpu_model      e.g. "RTX 4090"
    memoryInGb        -> vram_gb        already in GB, no conversion
    securePrice etc.  -> price_per_hour
    on-demand / spot  -> listing_type
    Secure/Community  -> region         (RunPod has no geographic regions)
    stockStatus       -> is_available   "None" = False, else True
    """
    gpu_model = gpu.get("displayName") or gpu.get("id") or "Unknown"
    vram_gb   = gpu.get("memoryInGb")
    gpu_id    = gpu.get("id", "")

    # stockStatus lives inside the lowestPrice sub-object
    lowest    = gpu.get("lowestPrice") or {}
    stock     = lowest.get("stockStatus", "None")
    has_stock = stock != "None"

    now = datetime.now(timezone.utc).isoformat()

    # All 4 possible price variants for this GPU type
    price_variants = [
        {
            "price":        gpu.get("securePrice"),
            "listing_type": "on-demand",
            "region":       "Secure Cloud",
            "available":    bool(gpu.get("secureCloud", False)) and has_stock,
        },
        {
            "price":        gpu.get("communityPrice"),
            "listing_type": "on-demand",
            "region":       "Community Cloud",
            "available":    bool(gpu.get("communityCloud", False)) and has_stock,
        },
        {
            "price":        gpu.get("secureSpotPrice"),
            "listing_type": "spot",
            "region":       "Secure Cloud",
            "available":    bool(gpu.get("secureCloud", False)) and has_stock,
        },
        {
            "price":        gpu.get("communitySpotPrice"),
            "listing_type": "spot",
            "region":       "Community Cloud",
            "available":    bool(gpu.get("communityCloud", False)) and has_stock,
        },
    ]

    rows = []
    for variant in price_variants:
        price = variant["price"]

        # Skip tiers where RunPod returns null
        if price is None:
            continue

        # Affiliate link — replace YOURREF after RunPod affiliate approval
        link = f"https://runpod.io/gpu-cloud?ref=YOURREF#{gpu_id}"

        rows.append({
            "provider":       PROVIDER_NAME,
            "gpu_model":      gpu_model.strip(),
            "vram_gb":        int(vram_gb) if vram_gb is not None else None,
            "price_per_hour": round(float(price), 4),
            "listing_type":   variant["listing_type"],
            "is_available":   variant["available"],
            "region":         variant["region"],
            "link":           link,
            "updated_at":     now,
        })

    return rows


# ─────────────────────────────────────────────
# MAIN: Scrape -> Transform -> Save
# ─────────────────────────────────────────────

def scrape_runpod():
    """
    Full pipeline:
    1. Connect to Supabase
    2. Fetch GPU types from RunPod GraphQL
    3. Transform each type into multiple rows (one per price point)
    4. DELETE old RunPod rows
    5. INSERT new rows in batches of 100
    """
    print("=" * 50)
    print("Starting RunPod scraper")
    print("=" * 50)

    supabase = get_supabase_client()
    print("+ Connected to Supabase")

    gpu_types = fetch_runpod_gpu_types()

    if not gpu_types:
        print("No data received from RunPod. Exiting.")
        return

    print(f"Transforming {len(gpu_types)} GPU types into price rows ...")
    all_rows = []

    for gpu in gpu_types:
        rows = transform_gpu_type(gpu)
        all_rows.extend(rows)

    print(f"  + {len(all_rows)} total price rows generated")

    if not all_rows:
        print("No valid rows to insert. Exiting.")
        return

    # Delete old RunPod rows (full refresh)
    print("Deleting old RunPod rows from database ...")
    try:
        supabase.table("gpu_listings").delete().eq("provider", PROVIDER_NAME).execute()
        print("  + Old rows deleted")
    except Exception as e:
        print(f"  X Failed to delete old rows: {e}")
        print("  Aborting to avoid duplicates.")
        sys.exit(1)

    # Insert in batches of 100
    print(f"Inserting {len(all_rows)} rows in batches of 100 ...")
    BATCH_SIZE = 100
    inserted_total = 0

    for i in range(0, len(all_rows), BATCH_SIZE):
        batch = all_rows[i : i + BATCH_SIZE]
        try:
            result = supabase.table("gpu_listings").insert(batch).execute()
            count  = len(result.data) if result.data else 0
            inserted_total += count
            print(f"  + Batch {i // BATCH_SIZE + 1}: inserted {count} rows")
        except Exception as e:
            print(f"  X Failed on batch {i // BATCH_SIZE + 1}: {e}")
            sys.exit(1)

    print("=" * 50)
    print(f"RunPod scraper complete. {inserted_total} rows saved.")
    print("=" * 50)


# ─────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────

if __name__ == "__main__":
    scrape_runpod()
