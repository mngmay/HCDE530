import csv

# Convert messy numeric strings like "fifteen" -> 15
def parse_int(value: str) -> int | None:
    if value is None:
        return None

    text = str(value).strip().lower()
    if not text:
        return None

    # Common word numbers seen in messy survey data
    word_to_num = {
        "zero": 0,
        "one": 1,
        "two": 2,
        "three": 3,
        "four": 4,
        "five": 5,
        "six": 6,
        "seven": 7,
        "eight": 8,
        "nine": 9,
        "ten": 10,
        "eleven": 11,
        "twelve": 12,
        "thirteen": 13,
        "fourteen": 14,
        "fifteen": 15,
        "sixteen": 16,
        "seventeen": 17,
        "eighteen": 18,
        "nineteen": 19,
        "twenty": 20,
    }
    if text in word_to_num:
        return word_to_num[text]

    try:
        return int(text)
    except ValueError:
        return None


# Load the survey data from a CSV file
filename = "week3_survey_messy.csv"
rows = []

with open(filename, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        rows.append(row)

# Count responses by role
# Normalize role names so "ux researcher" and "UX Researcher" are counted together
role_counts = {}

for row in rows:
    role = row["role"].strip().title()
    if role in role_counts:
        role_counts[role] += 1
    else:
        role_counts[role] = 1

print("Responses by role:")
for role, count in sorted(role_counts.items()):
    print(f"  {role}: {count}")

# Calculate the average years of experience
total_experience = 0
valid_experience_count = 0
invalid_experience_count = 0
for row in rows:
    years = parse_int(row.get("experience_years", ""))
    if years is None:
        invalid_experience_count += 1
        continue

    total_experience += years
    valid_experience_count += 1

if valid_experience_count == 0:
    raise ValueError("No valid numeric values found in 'experience_years'.")

avg_experience = total_experience / valid_experience_count
print(f"\nAverage years of experience: {avg_experience:.1f}")
if invalid_experience_count:
    print(f"(Skipped {invalid_experience_count} row(s) with invalid experience_years.)")

# Find the top 5 highest satisfaction scores
scored_rows = []
for row in rows:
    if row["satisfaction_score"].strip():
        score = parse_int(row["satisfaction_score"])
        if score is not None:
            scored_rows.append((row["participant_name"], score))

scored_rows.sort(key=lambda x: x[1], reverse=True)
top5 = scored_rows[:5]

print("\nTop 5 satisfaction scores:")
for name, score in top5:
    print(f"  {name}: {score}")
