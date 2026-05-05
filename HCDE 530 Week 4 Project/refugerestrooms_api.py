"""Fetch restroom data from Refuge Restrooms API and save it to JSON."""

import argparse
import json
import sys
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import urlopen

# API endpoint for fetching restroom data focused on safe restroom access for ransgender, intersex, and gender nonconforming individuals.
# No API key required 
API_BASE_URL = "https://www.refugerestrooms.org/api/v1/restrooms"
SCRIPT_DIR = Path(__file__).resolve().parent

# Fetch restroom data with variable input "limit" for the number of results to return.
def fetch_restrooms(limit):
    """Fetch up to `limit` restroom records from the Refuge Restrooms API."""
    if limit <= 0:
        raise ValueError("Result limit must be a positive integer.")

    query = urlencode({"per_page": limit})
    url = f"{API_BASE_URL}?{query}"

    try:
        with urlopen(url, timeout=15) as response:
            if response.status != 200:
                raise RuntimeError(f"API returned status {response.status}")
            return json.load(response)
    except HTTPError as exc:
        raise RuntimeError(f"HTTP error: {exc.code} {exc.reason}") from exc
    except URLError as exc:
        raise RuntimeError(f"Failed to connect to API: {exc.reason}") from exc

# Write the restroom data to a json file
def write_json(data, file_path):
    """Write Python data to a JSON file with pretty formatting."""
    with open(file_path, "w", encoding="utf-8") as file:
        json.dump(data, file, indent=2, ensure_ascii=False)

# print results in the terminal for my own reference
def print_results(results):
    """Print numbered restroom objects and confirm the total count."""
    for index, restroom in enumerate(results, start=1):
        print(f"Result {index}:")
        print(json.dumps(restroom, indent=2, ensure_ascii=False))
        print("---")
    print(f"Total results returned: {len(results)}")

# Put it all together
def main(result_count, output_file="results.json"):
    """Fetch restroom results, print them, and save them to a JSON file."""
    restrooms = fetch_restrooms(result_count)
    print_results(restrooms)
    write_json(restrooms, output_file)
    return output_file, len(restrooms)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Fetch restroom data from the Refuge Restrooms API and write it to JSON."
    )
    parser.add_argument(
        "count",
        type=int,
        help="Number of restroom results to fetch",
    )
    parser.add_argument(
        "--output",
        default="results.json",
        help="Path to the output JSON file (default: results.json)",
    )
    args = parser.parse_args()
    output_path = Path(args.output)
    if not output_path.is_absolute():
        output_path = SCRIPT_DIR / output_path

# print a message to confirm output or throw an error
    try:
        output_path, returned_count = main(args.count, str(output_path))
        print(f"Saved {returned_count} results to {output_path}")
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)
