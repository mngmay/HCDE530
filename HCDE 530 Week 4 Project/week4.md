# Week 4 — API integration and output persistence

## Observations

This week challenged me to move beyond local CSV work and connect a Python script to a live web API. The key learning was that a working data pipeline includes both a reliable request and an explicit output destination.

### API integration

- I built a script that calls `https://www.refugerestrooms.org/api/v1/restrooms` and uses the `per_page` query parameter to control how many results are returned.
- The script now accepts an integer input so the result count is not hardcoded and can be changed from the command line.
- I also added terminal output that prints each returned result with its index and confirms the total number of objects returned.

### Output and organization

- I saved the returned data as a JSON file in the same directory as the script, rather than depending on the current working directory.
- That makes the project more portable and easier to inspect in the Week 4 folder.

### Challenges and agent interaction

- My original script had limitations on how many objects the API returned; I could request 50 results, but the endpoint only returned 25 in a single call.
- The agent struggled to adapt the existing code and sometimes gave false confirmation that my logic was correct, blaming the behavior on an API error or limitation instead of the code restrictions.
- Scrapping the earlier code and starting fresh with a clearer prompt worked better, making it easier to build a predictable request and verify the output.

### Things I'd do differently / What I learned

- Consider making my prompt more flexible and scalable, such as the input or output quantities, so that the agent and code can more easily adapt to parameter changes. Be mindful of data types, shapes, and when the helper agent is giving advice versus making assumptions.

### Connection to this week’s work

This week builds on the class goal of making code readable, repeatable, and connected to real data sources. The main win was turning an external API response into a reproducible workflow: fetch, inspect, print, and persist. It also reinforced the value of explicit documentation and clear folder organization when a script writes output files.
