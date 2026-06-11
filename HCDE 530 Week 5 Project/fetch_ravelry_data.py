"""Fetch Ravelry pattern data and save a flat CSV for the MP1 analysis notebook.

Output: data/ravelry_patterns_2026.csv
One row per (pattern_id, month_collected, craft) combination.

How patterns are assigned to months
-----------------------------------
The pattern search endpoint (sort=recently_popular) has no month filter, so
querying it once per month would return ~identical lists and the seasonal
analysis would be meaningless. Instead, this script finds the patterns people
actually *started projects from* in each month, via:

    GET /projects/search.json?started=YYYY-MM

It covers the 12 most recent complete months (Jul 2025 - Jun 2026), so all
four seasons have real data. month_collected is the calendar month (1-12).

Two quirks of the Ravelry API discovered while testing
------------------------------------------------------
1. Batch endpoints (/patterns.json, /yarns.json) require SPACE-separated ids.
   Comma-separated ids silently return only the first record.
2. Pattern objects do not embed fiber content in packs[].yarn — that object
   only carries the yarn's id and name. Fiber comes from a follow-up batch
   call to /yarns.json, using each pattern's first-pack yarn_id and taking
   the fiber category with the highest percentage.
3. A batch request returns 404 for the WHOLE batch if it contains even one
   deleted/invalid id. Failed batches are split in half and retried so only
   the genuinely bad ids are dropped (see fetch_ids_with_split).
"""

import os
import sys
import time
from pathlib import Path

import pandas as pd
import requests
from dotenv import load_dotenv

BASE_URL = "https://api.ravelry.com"
REQUEST_DELAY = 0.5      # seconds between API calls
RETRY_WAIT = 10          # seconds to wait after an HTTP 429
PAGE_SIZE = 100
MAX_PAGES = 5            # up to 500 projects per month per craft
BATCH_SIZE = 150         # ids per /patterns.json or /yarns.json call
CRAFTS = ["knitting", "crochet"]

# 12 most recent complete months: Jul 2025 - Jun 2026
MONTHS = [(2025, m) for m in range(7, 13)] + [(2026, m) for m in range(1, 7)]

SEASON_BY_MONTH = {
    12: "Winter", 1: "Winter", 2: "Winter",
    3: "Spring", 4: "Spring", 5: "Spring",
    6: "Summer", 7: "Summer", 8: "Summer",
    9: "Fall", 10: "Fall", 11: "Fall",
}

EXPERIENCE_AS_OF = pd.Timestamp("2026-12-31")

DATA_DIR = Path(__file__).parent / "data"
OUTPUT_CSV = DATA_DIR / "ravelry_patterns_2026.csv"

# Data categories collected from the Ravelry API
COLUMN_ORDER = [
    "month_collected", "season", "craft", "pattern_id", "pattern_name",
    "published_date", "category", "yarn_weight", "fiber",
    "projects_count", "favorites_count", "queued_projects_count",
    "rating_average", "rating_count",
    "designer_id", "designer_name", "designer_first_published",
    "designer_years_experience", "designer_total_projects",
    "designer_total_favorites", "designer_pattern_count",
]

# May's credentials in .env file for security
def load_auth():
    """Read API credentials from .env and return a (user, password) tuple."""
    load_dotenv()
    username = os.getenv("RAVELRY_USERNAME")
    password = os.getenv("RAVELRY_PASSWORD")
    if not username or not password:
        sys.exit("Error: RAVELRY_USERNAME / RAVELRY_PASSWORD not found in .env")
    return (username, password)


AUTH = None  # set in main()


def ravelry_get(endpoint, params=None):
    """GET a Ravelry endpoint as JSON.

    Sleeps REQUEST_DELAY between calls. On HTTP 429, waits RETRY_WAIT seconds
    and retries once. Returns None for any other non-200 response.
    """
    url = BASE_URL + endpoint
    for attempt in range(2):
        try:
            response = requests.get(url, params=params, auth=AUTH, timeout=30)
        except requests.RequestException as err:
            print(f"  Request error ({err}); skipping {endpoint}")
            return None
        time.sleep(REQUEST_DELAY)
        if response.status_code == 429 and attempt == 0:
            print(f"  Rate limited (429) - waiting {RETRY_WAIT}s, retrying once...")
            time.sleep(RETRY_WAIT)
            continue
        if response.status_code != 200:
            print(f"  Skipping {endpoint} (status {response.status_code})")
            return None
        return response.json()
    return None

# Our way to measure 'popularity' of patterns by season with the data available.
def collect_monthly_patterns():
    """Step 1: find which patterns projects were started from in each month.

    Returns a DataFrame with one row per (month_collected, craft, pattern_id).
    """
    seen = set()
    rows = []
    for craft in CRAFTS:
        for year, month in MONTHS:
            started = f"{year}-{month:02d}"
            for page in range(1, MAX_PAGES + 1):
                print(f"Fetching {craft} projects started {started}, page {page}")
                data = ravelry_get(
                    "/projects/search.json",
                    params={"started": started, "craft": craft,
                            "page_size": PAGE_SIZE, "page": page},
                )
                if data is None:
                    continue  # skip this page, try the next one
                projects = data.get("projects", [])
                if not projects:
                    break
                for project in projects:
                    pattern_id = project.get("pattern_id")
                    if not pattern_id:
                        continue
                    key = (month, craft, pattern_id)
                    if key not in seen:
                        seen.add(key)
                        rows.append({"month_collected": month,
                                     "craft": craft,
                                     "pattern_id": pattern_id})
                last_page = data.get("paginator", {}).get("last_page", page)
                if page >= last_page:
                    break
    return pd.DataFrame(rows)


def normalize_date(raw):
    """Convert Ravelry's 'YYYY/MM/DD' date strings to 'YYYY-MM-DD'."""
    if not raw:
        return ""
    return str(raw).strip().replace("/", "-")

# Input "Unknown" for missing data returns
def parse_yarn_weight(description):
    """'Worsted (9 wpi)' -> 'Worsted'; empty/missing -> 'Unknown'."""
    if not description: 
        return "Unknown"
    return description.split("(")[0].strip() or "Unknown"


def extract_pattern_fields(pattern):
    """Pull the fields we need from one full pattern object."""
    categories = pattern.get("pattern_categories") or []
    category = (categories[0].get("name") or "Unknown") if categories else "Unknown"

    designer = pattern.get("pattern_author") or pattern.get("designer") or {}

    # Fiber: try the spec'd packs[0].yarn.fiber_category first; in practice the
    # API never includes it there, so we also keep yarn_id for a /yarns.json
    # lookup afterwards.
    fiber = None
    yarn_id = None
    packs = pattern.get("packs") or []
    if packs:
        yarn = packs[0].get("yarn") or {}
        fiber_category = yarn.get("fiber_category")
        if isinstance(fiber_category, dict):
            fiber = fiber_category.get("name")
        elif isinstance(fiber_category, str):
            fiber = fiber_category
        yarn_id = packs[0].get("yarn_id") or yarn.get("id")

    return {
        "pattern_id": pattern.get("id"),
        "pattern_name": pattern.get("name"),
        "published_date": normalize_date(pattern.get("published")),
        "category": category,
        "yarn_weight": parse_yarn_weight(pattern.get("yarn_weight_description")),
        "fiber": fiber,
        "yarn_id": yarn_id,
        "projects_count": pattern.get("projects_count") or 0,
        "favorites_count": pattern.get("favorites_count") or 0,
        "queued_projects_count": pattern.get("queued_projects_count") or 0,
        "rating_average": pattern.get("rating_average"),
        "rating_count": pattern.get("rating_count") or 0,
        "designer_id": designer.get("id"),
        "designer_name": designer.get("name") or "Unknown",
    }


def fetch_ids_with_split(endpoint, result_key, batch):
    """Fetch a batch of ids, splitting the batch in half when it fails.

    The batch endpoints (/patterns.json, /yarns.json) return 404 for the
    ENTIRE batch if it contains even one deleted/invalid id. Splitting and
    retrying narrows the failure down so only the bad ids are dropped,
    instead of losing all 150 records in the batch.
    """
    data = ravelry_get(endpoint,
                       params={"ids": " ".join(str(i) for i in batch)})
    if data is not None:
        return dict(data.get(result_key, {}))
    if len(batch) == 1:
        print(f"  Dropping unfetchable id {batch[0]} from {endpoint}")
        return {}
    mid = len(batch) // 2
    print(f"  Batch of {len(batch)} failed - splitting and retrying...")
    results = fetch_ids_with_split(endpoint, result_key, batch[:mid])
    results.update(fetch_ids_with_split(endpoint, result_key, batch[mid:]))
    return results


def fetch_pattern_details(pattern_ids):
    """Step 2: batch-fetch full pattern objects (NOTE: space-separated ids)."""
    records = []
    ids = sorted(int(i) for i in pattern_ids)
    for start in range(0, len(ids), BATCH_SIZE):
        batch = ids[start:start + BATCH_SIZE]
        print(f"Fetching pattern details {start + 1}-{start + len(batch)} of {len(ids)}")
        patterns = fetch_ids_with_split("/patterns.json", "patterns", batch)
        for pattern in patterns.values():
            records.append(extract_pattern_fields(pattern))
    return pd.DataFrame(records)


def fetch_yarn_fibers(yarn_ids):
    """Map yarn_id -> fiber category name (e.g. Wool, Cotton) via /yarns.json.

    A yarn can blend several fibers; the one with the highest percentage is
    used as the yarn's dominant fiber.
    """
    fibers = {}
    ids = sorted({int(y) for y in yarn_ids if pd.notna(y)})
    for start in range(0, len(ids), BATCH_SIZE):
        batch = ids[start:start + BATCH_SIZE]
        print(f"Fetching yarn fibers {start + 1}-{start + len(batch)} of {len(ids)}")
        yarns = fetch_ids_with_split("/yarns.json", "yarns", batch)
        for yarn_id_str, yarn in yarns.items():
            yarn_fibers = yarn.get("yarn_fibers") or []
            if not yarn_fibers:
                continue
            dominant = max(yarn_fibers, key=lambda f: f.get("percentage") or 0)
            name = (dominant.get("fiber_category") or {}).get("name")
            if name:
                fibers[int(yarn_id_str)] = name
    return fibers


def add_designer_stats(patterns_df):
    """Step 3: derive per-designer experience and popularity totals."""
    df = patterns_df.copy()
    df["_published"] = pd.to_datetime(df["published_date"], errors="coerce")

    grouped = df.groupby("designer_id", dropna=True)
    stats = pd.DataFrame({
        "designer_first_published": grouped["_published"].min(),
        "designer_total_projects": grouped["projects_count"].sum(),
        "designer_total_favorites": grouped["favorites_count"].sum(),
        "designer_pattern_count": grouped["pattern_id"].nunique(),
    }).reset_index()
# Calculate the years of experience for each designer based on the first published date.
    stats["designer_years_experience"] = (
        (EXPERIENCE_AS_OF - stats["designer_first_published"]).dt.days / 365.25
    ).round(1)
    stats["designer_first_published"] = (
        stats["designer_first_published"].dt.strftime("%Y-%m-%d").fillna("")
    )

    df = df.merge(stats, on="designer_id", how="left")
    return df.drop(columns=["_published"])


def main():
    global AUTH

    if OUTPUT_CSV.exists():
        print("Data already exists, skipping fetch.")
        return

    AUTH = load_auth()
    DATA_DIR.mkdir(exist_ok=True)

    # Step 1: which patterns were people starting each month?
    monthly_df = collect_monthly_patterns()
    print(f"\nCollected {len(monthly_df)} (month, craft, pattern) rows, "
          f"{monthly_df['pattern_id'].nunique()} unique patterns\n")

    # Step 2: full details for every unique pattern
    patterns_df = fetch_pattern_details(monthly_df["pattern_id"].unique())

    # Step 2b: fiber lookup (not embedded in pattern objects; see module docstring)
    missing_fiber = patterns_df["fiber"].isna()
    if missing_fiber.any():
        fiber_by_yarn = fetch_yarn_fibers(
            patterns_df.loc[missing_fiber, "yarn_id"].dropna().unique())
        patterns_df.loc[missing_fiber, "fiber"] = (
            patterns_df.loc[missing_fiber, "yarn_id"].map(fiber_by_yarn))
    patterns_df["fiber"] = patterns_df["fiber"].fillna("Unknown")
    patterns_df = patterns_df.drop(columns=["yarn_id"])

    # Step 3: designer experience and totals
    patterns_df = add_designer_stats(patterns_df)

    # Final assembly: one row per (pattern_id, month_collected, craft)
    final_df = monthly_df.merge(patterns_df, on="pattern_id", how="left")
    final_df["season"] = final_df["month_collected"].map(SEASON_BY_MONTH)
    for col in ["pattern_name", "category", "yarn_weight", "fiber", "designer_name"]:
        final_df[col] = final_df[col].fillna("Unknown")
    final_df = final_df[COLUMN_ORDER]

    final_df.to_csv(OUTPUT_CSV, index=False, encoding="utf-8")
    print(f"\nSaved {len(final_df)} rows to {OUTPUT_CSV}")
    print(f"Unique patterns: {final_df['pattern_id'].nunique()}, "
          f"unique designers: {final_df['designer_id'].nunique()}")


if __name__ == "__main__":
    main()
