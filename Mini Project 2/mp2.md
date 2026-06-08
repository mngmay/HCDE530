# Mini Project 2 — Competency Evidence

**Project:** Research Bridge — a web app that turns raw UX research into audience-tailored insight summaries. The frontend is React/Vite (TypeScript) and the backend is Supabase (Postgres with row-level security, auth, and Deno edge functions). I scoped it in plain language, built it through Bolt, used Claude for ideas and troubleshooting, and ran the AI features on the Gemini API.

Each section below maps a competency to specific evidence in the project.

## C1 — Vibecoding and Rapid Prototyping

I started with a plain-language spec in `feature_list.md` and built the app through Bolt instead of hand-writing the stack. I then iterated in a prompt-to-change loop, logged in `CHANGES.md`.

- **Caught a bad result and re-prompted.** My first sidebar fix (09:30) left the "Research Bridge" label clipped, so I re-prompted (14:00) and the fix was corrected with proper CSS transitions and a fixed logo size.
- **Chose the platform on purpose.** I picked Bolt over Cursor because it set up the tech stack for me, and used Claude alongside it to save tokens.
- **Worked around tool limits.** Bolt re-read the whole project on each edit and once lost all context, so I learned to point at specific files and re-paste the chat log.

## C2 — Code Literacy and Documentation

I can read, explain, make simple changes or change prompts, and document the generated code. It is split into pages (`src/pages/`), components (`src/components/`), types (`src/lib/types.ts`), and one Supabase client (`src/lib/supabase.ts`).

- **Explain the data model.** `src/lib/types.ts` defines the domain (`Project`, `Stakeholder`, `InterviewSession`, `ResearchDocument`) and matches the SQL schema.
- **Document the work.** `CHANGES.md` logs each edit with its prompt, files changed, and reason. The security migration has a header explaining what it fixes. I also wrote a clear `README.md` with access steps and a data warning.

## C3 — Data Cleaning and File Handling

`src/components/ResearchTab.tsx` handles messy user files in a repeatable way.

- **Validated inputs.** It allows `.csv, .xlsx, .xls, .xlsm, .txt` and caps files at 10 MB before processing.
- **One parsing path for any file.** `parseFile()` reads `.txt`/`.csv` as text and converts spreadsheets to CSV with SheetJS, labeling multi-sheet workbooks.
- **Clear errors.** It tracks a parse status (`idle`/`parsing`/`done`/`error`) and throws clear messages like `Unsupported file type: .${ext}`.
- **Real test data.** `usability_test_sessions.csv` (62 rows of tasks, timings, errors, and comments) was the messy input I tested against.

## C4 — APIs and Data Acquisition

The app calls outside APIs, exposes its own, and handles keys safely.

- **Calls an external API.** Both edge functions POST to the Gemini endpoint with a structured request and parse the JSON response.
- **Pulls data via REST.** The functions query the Supabase REST API for stakeholders and research, including a filtered query for only the chosen documents.
- **Safe auth.** No hard-coded secrets: keys come from environment variables (`Deno.env.get(...)`), the browser uses only the anon key, and CORS is set on every function.

## C7 — Critical Evaluation and Professional Judgment

The product and my process both focus on checking output before acting on it.

- **Fixed a wrong AI assumption.** The interview agent always acted like it was interviewing the stakeholder directly, so I added a two-mode selector ("I'll describe them" vs. "Direct interview") with separate prompts for each.
- **Acted on security warnings.** Instead of shipping the first schema, I fixed four flagged Supabase advisories in `...fix_function_security.sql` (locked `search_path` and revoked direct `EXECUTE`).
- **Was honest about limits.** Summaries are tailored per audience and constrained by user rules, and the `README.md` warns not to use real or sensitive data.

## C8 — Building and Deploying a Complete Tool

Research Bridge is a full, working tool for a real HCD need: helping researchers share insights with different audiences.

- **Scoped first.** `feature_list.md` sets the purpose, scope, default profile templates (Designers, Stakeholders, Engineers), and tone.
- **Built end to end.** A React/Vite frontend, a Postgres schema with migrations and row-level security, Supabase auth with a protected-route guard, and two edge functions for the interview and insights.
- **Shipped and usable.** It is deployed with a working demo account (in `README.md`) and does real work: build stakeholder profiles, upload research, and generate tailored summaries.
- **Reflected honestly.** `reflection.md` covers the trade-offs (Bolt vs. Cursor, Anthropic vs. Gemini), the friction I hit, and what I would change next.
