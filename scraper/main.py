"""
main.py — Master scraper runner.
Runs all individual scrapers in sequence.
Called by GitHub Actions every hour.
"""

from vastai import scrape_vastai
# from runpod import scrape_runpod   # Uncomment when RunPod scraper is built

if __name__ == "__main__":
    scrape_vastai()
    # scrape_runpod()   # Uncomment in Phase 2, Step 2
