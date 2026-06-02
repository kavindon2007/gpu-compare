"""
vastai.py — Scrapes live GPU listings from the Vast.ai public API
and upserts them into the Supabase gpu_listings table.

No API key required for Vast.ai.
Requires: SUPABASE_URL and SUPABASE_KEY environment variables.
"""

import os                   # Read environment variables
import sys                  # Exit with error codes
import requests             # Make HTTP requests to Vast.ai API
from supabase import create_client, Client   # Supabase Python SDK
from datetime import datetime, timezone      # Timestamps in UTC

# ─────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────

# The Vast.ai public bundles endpoint — no auth needed
VASTAI_API_URL = "https://cloud.vast.ai/api/v0/bundles/"

# Query params to filter the Vast.ai response.
# "rentable=true" means only return GPUs that are actually available to rent.
# "type=on-demand" and "type=bid" will be handled in the scraper logic below.
VASTAI_PARAMS = {
    "q": '{"rentable":{"eq":true},"order":[["score","desc"]],"type":"on-demand"}',
}

# How many listings to save per run (to avoid blowing up the free Supabase tier)
MAX_LISTINGS = 200

# The provider name exactly as it will appear in the database
PROVIDER_NAME = "Vast.ai"


# ─────────────────────────────────────────────
# HELPER: Connect to Supabase
# ─────────────────────────────────────────────

def get_supabase_client() -> Client:
    """
    Reads SUPABASE_URL and SUPABASE_KEY from environment variables
    and returns an authenticated Supabase client.

    Note: The scraper uses SUPABASE_KEY (service_role key) NOT the anon key.
    The service_role key bypasses Row Level Security so the scraper
    can write to the database. Never expose this key in frontend code.
    """
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")

    # Fail loudly if environment variables are missing.
    # This surfaces the problem immediately instead of a confusing later error.
    if not url:
        print("ERROR: SUPABASE_URL environment variable is not set.")
        print("  Local:  export SUPABASE_URL='https://xxxx.supabase.co'")
        print("  GitHub: add it as a repository secret")
        sys.exit(1)

    if not key:
        print("ERROR: SUPABASE_KEY environment variable is not set.")
        print("  Local:  export SUPABASE_KEY='your-service-role-key'")
        print("  GitHub: add it as a repository secret")
        sys.exit(1)

    return create_client(url, key)


# ─────────────────────────────────────────────
# HELPER: Fetch data from Vast.ai API
# ─────────────────────────────────────────────

def fetch_vastai_listings() -> list[dict]:
    """
    Hits the Vast.ai public API and returns a list of raw offer objects.

    The API returns a JSON object with one key: "offers".
    Each offer is a dict with many fields (we only use a few of them).

    Returns empty list on network errors — scraper continues gracefully.
    """
    print(f"Fetching listings from {VASTAI_API_URL} ...")

    try:
        # Set a 30-second timeout so we don't hang forever
        response = requests.get(VASTAI_API_URL, params=VASTAI_PARAMS, timeout=30)

        # Raise an exception for HTTP errors (4xx, 5xx)
        response.raise_for_status()

        data = response.json()

        # The API returns: {"offers": [...]}
        offers = data.get("offers", [])
        print(f"  ✓ Received {len(offers)} raw listings from Vast.ai")
        return offers

    except requests.exceptions.Timeout:
        print("  ✗ Request timed out after 30 seconds. Skipping Vast.ai.")
        return []

    except requests.exceptions.ConnectionError:
        print("  ✗ Could not connect to Vast.ai API. Check your internet connection.")
        return []

    except requests.exceptions.HTTPError as e:
        print(f"  ✗ Vast.ai API returned an error: {e}")
        return []

    except Exception as e:
        print(f"  ✗ Unexpected error fetching Vast.ai data: {e}")
        return []


# ─────────────────────────────────────────────
# HELPER: Transform a raw Vast.ai offer into our DB schema
# ─────────────────────────────────────────────

def transform_offer(offer: dict) -> dict | None:
    """
    Maps a single raw Vast.ai API offer to the shape our gpu_listings table expects.

    API field   →   DB column
    ----------      ---------
    gpu_name    →   gpu_model      e.g. "RTX 4090", "H100 SXM"
    gpu_ram     →   vram_gb        API gives MB, we convert to GB
    dph_total   →   price_per_hour total $/hr (GPU + disk + network)
    is_bid      →   listing_type   True = "spot", False = "on-demand"
    rentable    →   is_available   True if the GPU is available right now
    geolocation →   region         Free-text location like "Florida, US"
    id          →   used to build the affiliate link

    Returns None if essential fields are missing — we skip that listing.
    """

    # Skip listings with no GPU model or no price (unusable data)
    gpu_model = offer.get("gpu_name")
    price_raw = offer.get("dph_total")

    if not gpu_model or price_raw is None:
        return None   # Drop this listing silently

    # gpu_ram is given in MB (e.g. 32768 MB = 32 GB)
    # We store it as whole GB in the database
    vram_mb = offer.get("gpu_ram")
    vram_gb = round(vram_mb / 1024) if vram_mb else None

    # is_bid=True means it's a spot (bid) instance, otherwise on-demand
    is_bid = offer.get("is_bid", False)
    listing_type = "spot" if is_bid else "on-demand"

    # rentable=True means the GPU is available to rent right now
    is_available = bool(offer.get("rentable", False))

    # geolocation is a free-text string like "Florida, US" or "Vietnam, VN"
    region = offer.get("geolocation") or None

    # Build the affiliate link using the listing ID.
    # Replace "YOURREF" with your actual Vast.ai referral code once approved.
    listing_id = offer.get("id")
    link = f"https://cloud.vast.ai/?ref=YOURREF&contract={listing_id}" if listing_id else None

    # Round price to 4 decimal places (matches our decimal(10,4) column)
    price_per_hour = round(float(price_raw), 4)

    return {
        "provider":       PROVIDER_NAME,
        "gpu_model":      gpu_model.strip(),     # Strip extra whitespace
        "vram_gb":        vram_gb,
        "price_per_hour": price_per_hour,
        "listing_type":   listing_type,
        "is_available":   is_available,
        "region":         region,
        "link":           link,
        "updated_at":     datetime.now(timezone.utc).isoformat(),
    }


# ─────────────────────────────────────────────
# MAIN: Scrape → Transform → Save
# ─────────────────────────────────────────────

def scrape_vastai():
    """
    Full pipeline:
    1. Connect to Supabase
    2. Fetch listings from Vast.ai API
    3. Transform each offer to our DB schema
    4. Delete old Vast.ai rows from the table (fresh data every run)
    5. Insert new rows in one batch

    We DELETE then INSERT (not upsert) because Vast.ai listing IDs change
    every time a machine goes offline and comes back — there's no stable ID
    to upsert on. A full refresh every hour is the cleanest approach.
    """
    print("=" * 50)
    print("Starting Vast.ai scraper")
    print("=" * 50)

    # Step 1: Connect to Supabase
    supabase = get_supabase_client()
    print("✓ Connected to Supabase")

    # Step 2: Fetch raw data from Vast.ai
    raw_offers = fetch_vastai_listings()

    if not raw_offers:
        print("No data received from Vast.ai. Exiting without modifying the database.")
        return

    # Step 3: Transform offers to our schema
    print(f"Transforming {len(raw_offers)} offers...")
    transformed = []

    for offer in raw_offers[:MAX_LISTINGS]:   # Limit to MAX_LISTINGS
        row = transform_offer(offer)
        if row:                               # Skip any offers that returned None
            transformed.append(row)

    print(f"  ✓ {len(transformed)} valid listings after filtering")

    if not transformed:
        print("No valid listings to insert. Exiting.")
        return

    # Step 4: Delete existing Vast.ai rows from gpu_listings
    # This ensures we don't accumulate stale listings from offline machines.
    print("Deleting old Vast.ai rows from database...")
    try:
        delete_result = (
            supabase.table("gpu_listings")
            .delete()
            .eq("provider", PROVIDER_NAME)   # Only delete Vast.ai rows
            .execute()
        )
        print(f"  ✓ Old rows deleted")
    except Exception as e:
        print(f"  ✗ Failed to delete old rows: {e}")
        print("  Aborting to avoid duplicates.")
        sys.exit(1)

    # Step 5: Insert new rows in a single batch request
    print(f"Inserting {len(transformed)} new listings...")
    try:
        insert_result = (
            supabase.table("gpu_listings")
            .insert(transformed)
            .execute()
        )
        # The Supabase Python SDK returns the inserted rows in insert_result.data
        inserted_count = len(insert_result.data) if insert_result.data else 0
        print(f"  ✓ Successfully inserted {inserted_count} listings")

    except Exception as e:
        print(f"  ✗ Failed to insert listings: {e}")
        sys.exit(1)

    print("=" * 50)
    print(f"Vast.ai scraper complete. {len(transformed)} listings saved.")
    print("=" * 50)


# ─────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────

if __name__ == "__main__":
    # This block runs when you execute: python scraper/vastai.py
    # It will NOT run when this file is imported by main.py
    scrape_vastai()
