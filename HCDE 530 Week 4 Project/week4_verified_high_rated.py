import csv
import json
import math
import urllib.parse
import urllib.request


BASE_URL = "https://hcde530-week4-api.onrender.com"
ENDPOINT = "/reviews"


def fetch_json(url: str) -> dict:
    with urllib.request.urlopen(url) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        data = response.read().decode(charset)
    return json.loads(data)


def iter_reviews(limit: int = 100):
    offset = 0

    while True:
        query = urllib.parse.urlencode({"offset": offset, "limit": limit})
        url = f"{BASE_URL}{ENDPOINT}?{query}"
        payload = fetch_json(url)

        reviews = payload.get("reviews", [])
        for review in reviews:
            yield review

        returned = int(payload.get("returned", len(reviews)))
        total = int(payload.get("total", offset + returned))

        offset += returned
        if returned == 0 or offset >= total:
            break


def is_verified(review: dict) -> bool:
    # Docs use "verified_purchase"; prompt says "verified"
    value = review.get("verified_purchase", review.get("verified"))
    return bool(value)


def parse_int(value) -> int | None:
    if value is None:
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def rating_cutoff_top_percent(ratings: list[int], top_percent: float) -> int:
    """
    Returns the minimum rating needed to be in the top X%.
    Example: top_percent=5.0 => 95th percentile cutoff.
    """
    if not ratings:
        raise ValueError("No ratings available to compute a cutoff.")

    if not (0 < top_percent < 100):
        raise ValueError("top_percent must be between 0 and 100 (exclusive).")

    sorted_ratings = sorted(ratings)
    n = len(sorted_ratings)

    # Small, discrete scale (1–5): use the rating at the 95th percentile index.
    # Ceil keeps the cutoff conservative (only the truly top values pass).
    percentile = 1.0 - (top_percent / 100.0)
    idx = max(0, min(n - 1, math.ceil(percentile * n) - 1))
    return sorted_ratings[idx]


def main() -> None:
    output_filename = "verified_high_rated.csv"

    all_reviews = list(iter_reviews(limit=100))
    verified_reviews = [r for r in all_reviews if is_verified(r)]

    verified_ratings = [
        parse_int(r.get("rating")) for r in verified_reviews if parse_int(r.get("rating")) is not None
    ]
    cutoff = rating_cutoff_top_percent(verified_ratings, top_percent=5.0)

    rows_to_write = []
    for r in verified_reviews:
        rating = parse_int(r.get("rating"))
        if rating is None or rating < cutoff:
            continue

        category = (r.get("category") or "").strip()
        review_text = (r.get("review") or "").strip()

        print(f"{category}\t{rating}\t{review_text}")
        rows_to_write.append(
            {
                "category": category,
                "review": review_text,
                "rating": rating,
            }
        )

    with open(output_filename, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["category", "review", "rating"])
        writer.writeheader()
        writer.writerows(rows_to_write)

    print(
        f"\nSaved {len(rows_to_write)} row(s) to {output_filename} "
        f"(verified-only, rating >= {cutoff} cutoff for top 5%)."
    )


if __name__ == "__main__":
    main()

