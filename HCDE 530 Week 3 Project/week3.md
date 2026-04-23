# Week 3 — Debugging messy data and script iteration

## Observations

This week reinforced that **running code is only part of the workflow**—much of the learning happens when something fails, the error message points to a specific line, and I trace **what type of data** the code expected versus what the file actually contains.

### Running and troubleshooting

- I am comfortable **moving between directories** and executing scripts with `python3 [script]` to verify whether they run or raise errors.
- When the messy survey CSV triggered `ValueError: invalid literal for int() with base 10: 'fifteen'`, the traceback showed **line 30**, which made it straightforward to inspect the `int(...)` conversion and see that **`experience_years` was not always numeric text**.
- That mismatch—**string (e.g. a word) versus integer**—is a concrete example of why **data cleaning or parsing** belongs in the pipeline before aggregation.

### AI-assisted iteration

- I used the **Cursor agent** to ask how to fix the error, read the explanation, and compare it to what the code was doing.
- I **reviewed proposed edits** in the file and only **accepted changes** I understood and wanted to keep, rather than applying edits blindly.
- The resulting approach—**a small parser** to normalize messy values before averaging—let the script **run successfully** and produce sensible output.

### Version control

- I know to **commit** work on my branch and to write **short, descriptive commit messages** that explain what changed and why.

### Connection to this week’s work

I was **not able to attend the live session**, and the **recordings had technical issues**, so most of this week’s practice was **self-directed**. I will **follow up in the next class** with questions to confirm my understanding.

A concrete win was **closing the loop**: from error → root cause → targeted fix → **successful run**, while keeping **human review** in the loop for tool-generated changes.

Overall, this week extends last week’s emphasis on **code literacy** by adding **debugging discipline**, **respect for messy real-world inputs**, and a repeatable habit of **verify, then commit**.
