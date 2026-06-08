# Mini Project 2 Reflection — Research Bridge

## What did you build?

I built **Research Bridge**, a web application that helps user experience researchers and designers turn raw research into audience-ready insights. A user creates a project, uploads or pastes their research data, and the tool generates insight summaries that are tailored to specific audiences rather than producing one generic write-up.

The core idea is that different audiences care about different things and speak different languages, so a single summary rarely serves everyone well. To address this, Research Bridge lets users define **stakeholder profiles** through a short, AI-led interview that captures each stakeholder's role, responsibilities, priorities, tone, and technical knowledge. It ships with three default profile templates as starting points:

- **Designers** — design feedback, aesthetics, usability, and insights for design updates.
- **Stakeholders** — business impact, ROI, brand and product perception, engagement, and revenue.
- **Engineers** — technical implementation, feasibility, and more technical language tied to the tech stack.

Each project holds multiple stakeholder profiles, research notes, and a history of generated summaries organized by date, plus a **project rules** section where users set guidelines for how summaries should sound and what they should always or never include. The goal is to reduce the manual effort of synthesis and reporting so practitioners can share findings at scale.

## What decisions did you make?

- **Platform: Bolt over Cursor.** I chose Bolt because it could predetermine an appropriate tech stack for me, whereas Cursor expected me to define the full stack myself. To work efficiently, I used Claude alongside Bolt for idea generation and troubleshooting, which helped conserve tokens on the build platform.
- **AI engine: Gemini over Anthropic.** I originally planned to use Anthropic for the summary-generation feature but switched to Gemini because of API key access and the costs associated with running the feature.
- **Data source and scope.** I deliberately limited accepted inputs to .csv, excel, and text files to keep parsing predictable and the scope manageable. I used a usability test dataset (`usability_test_sessions.csv`) as example research data so the demo project would feel realistic. I also scoped the project structure around a list of projects, each containing multiple stakeholder profiles, research notes, and a dated history of summaries.
- **Tone and experience.** I committed to a clean, professional interface and a supportive, professional voice in the AI prompts, framing the tool as a partner that makes the practitioner's job easier rather than replacing their judgment.

## What would you do differently?

- **Give users control over who summaries are generated for.** Right now generation defaults to all stakeholder profiles. I would add a selector so users can generate a summary for a single chosen stakeholder (or a subset) on demand, which better matches how reporting actually happens.
- **Expand input and output flexibility.** I would broaden the accepted research file types, and add multiple output formats for generated insights (for example, a short executive summary versus a detailed report or PowerPoint presentation) instead of a single fixed format.
- **Enhance Design of Insights** I'd work on the aesthetics of the documents generated, and provide a way for users to input their own design guidelines/templates.

## What does this work demonstrate?

- **Research synthesis and communication.** The heart of the tool — turning raw research into audience-specific summaries — directly addresses the practitioner challenge of communicating insights differently for different business partners. The stakeholder profile interview and the three default templates encode this competency into the interface.
- **Specification and prompt engineering.** Building the application required writing precise specifications and prompts for the AI. Working in Bolt surfaced this clearly: it re-reviewed the whole project on each edit due to limited persistent memory, so I had to point to very specific parts of the plan to change and explicitly state what should stay the same. After a troubleshooting step, Bolt lost the project context entirely and I had to re-paste the full chat log to restore it. These constraints pushed me toward more disciplined, explicit specification.
- **Interaction and responsive design.** I had to explicitly require responsive design, otherwise elements would overlap or get cut off, and I learned to clear the cache so updated assets would load correctly for my own troubleshooting experience. The result is a clean, professional layout that holds up across screen sizes.
- **Data handling.** Constraining inputs to .csv, excel, and text and grounding the demo in a real usability dataset demonstrates practical decisions about ingesting, structuring, and organizing research data within a project.


## Notes
- Although I purchased a month of credits on Bolt, I did eventually run out. This may contribute to bugs or less robust design of some features.