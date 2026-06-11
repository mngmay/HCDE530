# Week 5 Competency Claim — C5: Data Analysis with Pandas

**Evidence:** `week5_data_analysis.ipynb`, which loads `data/ravelry_patterns_2026.csv` (7,332 rows × 21 columns, built by `fetch_ravelry_data.py` from the Ravelry API).

## The claim

I used pandas to profile a dataset I collected myself and to answer a specific
question about its missing data — not just to display output, but to explain a
discrepancy in it.

After loading the dataset, I profiled it with `df.head()`, `df.info()`,
`df['craft'].value_counts()`, and `df.isnull().sum()`. The value counts showed
crochet rows (4,068) outnumber knitting rows (3,264), and the null counts
surfaced something I didn't expect: **588 rows are missing `published_date`,
but only 516 are missing `designer_first_published` and
`designer_years_experience`** — even though the designer fields are *derived
from* the publish date. If one depends on the other, why don't the counts match?

Digging into the fetch script explained the 72-row gap. The designer columns
are computed with `groupby("designer_id")` and `.min()` on the publish date,
and `.min()` skips nulls. So a pattern with no publish date still *inherits* a
first-published date if the same designer has another, dated pattern in the
dataset. Filtering with `df[df['published_date'].isnull() &
df['designer_first_published'].notnull()]` confirmed it: exactly 72 rows,
belonging to 6 designers (e.g., Helen Shrimpton has 6 patterns, 5 dated — her
undated one still gets her 2019 first-published date).

This matters for interpretation: for those 6 designers, "years of experience"
is based only on their dated patterns, so if an undated pattern was actually
their earliest, their experience is understated. I've flagged this as a
limitation to note in my Mini Project 1 analysis, where designer experience is
one of my three research questions.

## Context: what it took to get here

The analysis runs in a Jupyter notebook, which I set up this week for the
first time — including learning what a kernel is and why the notebook must be
connected to my project's virtual environment (otherwise imports fail even
when packages are installed). The dataset itself comes from the Ravelry API,
which took real iteration: early calls returned nothing usable, so I worked
out the API's quirks (batch endpoints need space-separated ids; fiber data
requires a second lookup per yarn) and used Claude to draft a detailed
technical spec before having Cursor's agent build the fetch script.
