import csv
import json
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


def main() -> None:
    output_filename = "week4_category_helpful_votes.csv"

    rows_to_write = []
    for review in iter_reviews(limit=100):
        category = (review.get("category") or "").strip()
        helpful_votes = review.get("helpful_votes")

        # Print requested fields
        print(f"{category}\t{helpful_votes}")

        rows_to_write.append(
            {
                "category": category,
                "helpful_votes": helpful_votes,
            }
        )

    with open(output_filename, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["category", "helpful_votes"])
        writer.writeheader()
        writer.writerows(rows_to_write)

    print(f"\nSaved {len(rows_to_write)} rows to {output_filename}")


if __name__ == "__main__":
    main()

