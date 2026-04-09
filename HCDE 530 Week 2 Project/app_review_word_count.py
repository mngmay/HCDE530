import csv
from pathlib import Path


CSV_PATH = Path(__file__).with_name("app_reviews.csv")


def count_words(text: str) -> int:
    text = (text or "").strip()
    if not text:
        return 0
    return len(text.split())


def main() -> None:
    rows: list[dict[str, str]] = []
    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)

    print(f"{'ID':<6} {'Rating':<6} {'Words':<6} {'Review (first 60 chars)'}")
    print("-" * 80)

    word_counts: list[int] = []
    for row in rows:
        review_id = row.get("review_id", "")
        rating = row.get("rating", "")
        review = row.get("review", "")

        words = count_words(review)
        word_counts.append(words)

        preview = (review or "")
        preview = preview[:60] + "..." if len(preview) > 60 else preview
        print(f"{review_id:<6} {rating:<6} {words:<6} {preview}")

    print()
    print("── Summary ─────────────────────────────────")
    print(f"  Total reviews   : {len(word_counts)}")
    if not word_counts:
        print("  Shortest        : n/a")
        print("  Longest         : n/a")
        print("  Average         : n/a")
        return

    print(f"  Shortest        : {min(word_counts)} words")
    print(f"  Longest         : {max(word_counts)} words")
    print(f"  Average         : {sum(word_counts) / len(word_counts):.1f} words")


if __name__ == "__main__":
    main()
