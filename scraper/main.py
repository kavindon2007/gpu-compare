"""
main.py — Master scraper runner for GPU Compare.

Runs all scrapers in sequence. If one fails, the others still run.
Called by GitHub Actions on a schedule (every hour).

Usage:
  python3 main.py

Exit codes:
  0 — all scrapers succeeded
  1 — one or more scrapers failed (partial success)
"""

import sys
import time
from datetime import datetime, timezone


# ─────────────────────────────────────────────
# LOGGING HELPERS
# ─────────────────────────────────────────────

def log(msg: str):
    """Print a timestamped log line."""
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    print(f"[{ts}] {msg}", flush=True)


def log_section(title: str):
    """Print a bold section separator."""
    print(f"\n{'=' * 60}", flush=True)
    print(f"  {title}", flush=True)
    print(f"{'=' * 60}", flush=True)


def log_result(name: str, success: bool, duration: float, error: str = ""):
    """Print a single-line result summary for one scraper."""
    status = "SUCCESS" if success else "FAILED "
    icon   = "+" if success else "X"
    line   = f"  [{icon}] {name:<20} {status}   ({duration:.1f}s)"
    if error:
        line += f"   ERROR: {error}"
    print(line, flush=True)


# ─────────────────────────────────────────────
# RUN ONE SCRAPER SAFELY
# ─────────────────────────────────────────────

def run_scraper(name: str, scrape_fn) -> tuple[bool, float, str]:
    """
    Runs a single scraper function and captures the result.

    Returns a tuple: (success: bool, duration_seconds: float, error_msg: str)

    We wrap each scraper in a try/except so that:
    - A crash in vastai.py does NOT prevent runpod.py from running
    - The error is clearly printed and logged for GitHub Actions
    - The overall run reports partial failures at the end
    """
    log_section(f"Running: {name}")
    start = time.time()

    try:
        scrape_fn()
        duration = time.time() - start
        log(f"{name} finished successfully in {duration:.1f}s")
        return True, duration, ""

    except SystemExit as e:
        # Individual scrapers call sys.exit(1) on fatal errors (e.g. missing env vars)
        # We catch that here so it doesn't kill the whole main.py process
        duration = time.time() - start
        error = f"Scraper called sys.exit({e.code})"
        log(f"ERROR: {name} exited with code {e.code} after {duration:.1f}s")
        return False, duration, error

    except Exception as e:
        # Catch any unexpected exception — import errors, type errors, etc.
        duration = time.time() - start
        error = str(e)
        log(f"ERROR: {name} raised an exception after {duration:.1f}s: {error}")
        import traceback
        traceback.print_exc()
        return False, duration, error


# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────

def main():
    overall_start = time.time()

    log_section("GPU Compare — Scraper Run Starting")
    log(f"Python version: {sys.version.split()[0]}")
    log(f"Starting all scrapers ...")

    # ── Import scrapers ──────────────────────
    # We import inside main() so that import errors are caught cleanly
    # and reported in the final summary rather than crashing silently.
    scrapers = []

    try:
        from vastai import scrape_vastai
        scrapers.append(("Vast.ai Scraper", scrape_vastai))
        log("Loaded: vastai.py")
    except ImportError as e:
        log(f"ERROR: Could not import vastai.py — {e}")
        scrapers.append(("Vast.ai Scraper", None))

    try:
        from runpod import scrape_runpod
        scrapers.append(("RunPod Scraper", scrape_runpod))
        log("Loaded: runpod.py")
    except ImportError as e:
        log(f"ERROR: Could not import runpod.py — {e}")
        scrapers.append(("RunPod Scraper", None))

    # ── Run each scraper ─────────────────────
    results = []

    for name, fn in scrapers:
        if fn is None:
            # Import failed — record as failure without running
            results.append((name, False, 0.0, "Import failed"))
            continue

        success, duration, error = run_scraper(name, fn)
        results.append((name, success, duration, error))

    # ── Final summary ────────────────────────
    total_duration = time.time() - overall_start
    all_succeeded  = all(r[1] for r in results)

    log_section("Run Summary")
    for name, success, duration, error in results:
        log_result(name, success, duration, error)

    print(f"\n  Total time: {total_duration:.1f}s", flush=True)

    if all_succeeded:
        print(f"  Status:     ALL SCRAPERS SUCCEEDED", flush=True)
    else:
        failed = [r[0] for r in results if not r[1]]
        print(f"  Status:     PARTIAL FAILURE — {', '.join(failed)} failed", flush=True)

    print(f"{'=' * 60}\n", flush=True)

    # Exit 1 if any scraper failed — GitHub Actions will flag this run as failed
    sys.exit(0 if all_succeeded else 1)


# ─────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────

if __name__ == "__main__":
    main()
