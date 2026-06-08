import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

async function callGemini(systemPrompt: string, userMessage: string): Promise<string> {
  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": GEMINI_API_KEY,
    },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userMessage }] }],
      generationConfig: { maxOutputTokens: 4096, temperature: 0.7 },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error: ${err}`);
  }

  const data = await res.json();
  return data.candidates[0].content.parts[0].text as string;
}

function rulesBlock(rules: string | null): string {
  if (!rules?.trim()) return "";
  return `\n\nProject Rules (follow these guidelines in all outputs):\n${rules.trim()}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const action: string | undefined = body.action;

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // ─── Action: Generate personalized brief for a single stakeholder ─────────
    if (action === "generate-stakeholder-brief") {
      const stakeholderId: string = body.stakeholderId;

      const shRes = await fetch(
        `${supabaseUrl}/rest/v1/stakeholders?id=eq.${stakeholderId}&select=*`,
        { headers: { "apikey": serviceKey, "Authorization": `Bearer ${serviceKey}` } }
      );
      const shArr = await shRes.json();
      const sh = shArr[0];
      if (!sh) {
        return new Response(JSON.stringify({ error: "Stakeholder not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const projRes = await fetch(
        `${supabaseUrl}/rest/v1/projects?id=eq.${sh.project_id}&select=name,description,rules`,
        { headers: { "apikey": serviceKey, "Authorization": `Bearer ${serviceKey}` } }
      );
      const projArr = await projRes.json();
      const project = projArr[0] ?? {};

      const profileData = sh.profile_data as Record<string, unknown> | null;
      const profileSection = profileData
        ? `
Profile Summary: ${profileData.summary}
Key Priorities: ${(profileData.key_priorities as string[])?.join("; ")}
Potential Concerns: ${(profileData.potential_concerns as string[])?.join("; ")}
Influence Patterns: ${profileData.influence_patterns}
Risk Assessment: ${profileData.risk_assessment}
Engagement Recommendations from Profile: ${(profileData.engagement_recommendations as string[])?.join("; ")}`
        : "(No detailed profile data available — generate a stakeholder profile first for richer briefs)";

      const systemPrompt = `You are an expert stakeholder engagement strategist. Your job is to produce a personalized engagement brief — a practical guide for a researcher or project manager preparing to interact with this specific stakeholder.${rulesBlock(project.rules ?? null)}

Return ONLY a valid JSON object with exactly these fields:
{
  "executive_summary": "2-3 sentence overview of how to think about engaging this stakeholder and what matters most to them",
  "key_messages": ["message 1", "message 2", "message 3"],
  "communication_approach": "2-3 sentences describing the ideal communication style, format, and frequency for this stakeholder",
  "talking_points": ["specific talking point 1", "specific talking point 2", "specific talking point 3", "specific talking point 4"],
  "things_to_avoid": ["thing to avoid 1", "thing to avoid 2", "thing to avoid 3"],
  "generated_at": "${new Date().toISOString()}"
}

Guidelines:
- key_messages: The 3 most important messages to land with this specific person. Make them concrete and tailored.
- talking_points: Specific conversation openers, questions, or proof points relevant to their role and concerns.
- things_to_avoid: Topics, approaches, or framings that are likely to create friction or resistance.
- Be specific to THIS stakeholder — avoid generic stakeholder management advice.

Do not include markdown fencing or any text outside the JSON object.`;

      const userMessage = `Project: ${project.name ?? "Unknown"}${project.description ? `\nProject description: ${project.description}` : ""}

Stakeholder: ${sh.name}
Role: ${sh.role}${sh.organization ? `\nOrganization: ${sh.organization}` : ""}
Influence Level: ${sh.influence_level}
Interest Level: ${sh.interest_level}
Current Stance: ${sh.stance}${sh.notes ? `\nNotes: ${sh.notes}` : ""}
${profileSection}

Generate the personalized engagement brief JSON.`;

      const raw = await callGemini(systemPrompt, userMessage);

      let brief;
      try {
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        brief = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      } catch {
        brief = null;
      }

      if (!brief) {
        return new Response(JSON.stringify({ error: "Failed to parse brief" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Ensure generated_at is set
      if (!brief.generated_at) brief.generated_at = new Date().toISOString();

      // Save to stakeholder record
      await fetch(
        `${supabaseUrl}/rest/v1/stakeholders?id=eq.${stakeholderId}`,
        {
          method: "PATCH",
          headers: {
            "apikey": serviceKey,
            "Authorization": `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ stakeholder_brief: brief }),
        }
      );

      return new Response(JSON.stringify({ brief }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Default action: Generate project-level insights ─────────────────────
    const projectId: string = body.projectId;
    const researchIds: string[] | undefined = body.researchIds;
    const crossReference: boolean = body.crossReference !== false;

    const projRes = await fetch(
      `${supabaseUrl}/rest/v1/projects?id=eq.${projectId}&select=rules`,
      { headers: { "apikey": serviceKey, "Authorization": `Bearer ${serviceKey}` } }
    );
    const projects = await projRes.json();
    const projectRules: string | null = projects[0]?.rules ?? null;
    const rulesSection = rulesBlock(projectRules);

    const shRes = await fetch(
      `${supabaseUrl}/rest/v1/stakeholders?project_id=eq.${projectId}&select=*`,
      { headers: { "apikey": serviceKey, "Authorization": `Bearer ${serviceKey}` } }
    );
    const stakeholders = await shRes.json();

    if (!stakeholders || stakeholders.length === 0) {
      return new Response(JSON.stringify({ error: "No stakeholders found for this project" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let researchDocs: Array<{ id: string; title: string; content: string; source: string | null }> = [];
    if (researchIds && researchIds.length > 0) {
      const rdRes = await fetch(
        `${supabaseUrl}/rest/v1/research_documents?project_id=eq.${projectId}&id=in.(${researchIds.map(id => `"${id}"`).join(",")})&select=id,title,content,source`,
        { headers: { "apikey": serviceKey, "Authorization": `Bearer ${serviceKey}` } }
      );
      const rdData = await rdRes.json();
      if (Array.isArray(rdData)) researchDocs = rdData;
    }

    const stakeholderSummaries = stakeholders.map((sh: Record<string, unknown>) => {
      const profileData = sh.profile_data as Record<string, unknown> | null;
      return `
Stakeholder: ${sh.name} (${sh.role}${sh.organization ? `, ${sh.organization}` : ""})
Influence: ${sh.influence_level} | Interest: ${sh.interest_level} | Stance: ${sh.stance}
${profileData ? `Key Priorities: ${(profileData.key_priorities as string[])?.join(", ")}
Potential Concerns: ${(profileData.potential_concerns as string[])?.join(", ")}
Summary: ${profileData.summary}` : "(No detailed profile generated yet)"}
`.trim();
    }).join("\n\n---\n\n");

    let researchContext = "";
    if (researchDocs.length > 0) {
      researchContext = researchDocs.map(doc => {
        const sourceNote = doc.source ? ` [Source: ${doc.source}]` : "";
        return `=== ${doc.title}${sourceNote} ===\n${doc.content}`;
      }).join("\n\n");
    }

    const hasResearch = researchDocs.length > 0;

    const systemPrompt = hasResearch
      ? `You are an expert UX research analyst synthesizing stakeholder research for a project team. You have access to both stakeholder profiles and primary research data.${rulesSection}

${crossReference
  ? `Your primary task is to TRIANGULATE and CROSS-REFERENCE across the research documents and stakeholder profiles. Look for:
- Patterns that appear across multiple research sources
- Contradictions between what stakeholders say and what research shows
- Gaps in the research relative to specific stakeholders
- Evidence that confirms or challenges each stakeholder's stated priorities and concerns
- Themes that emerge consistently across different data sources`
  : `Analyze each research document in context of the stakeholder profiles, grounding each insight in specific evidence from the provided research.`}

Return ONLY a valid JSON array with no markdown fencing or explanatory text outside it:
[
  { "type": "summary", "content": "..." },
  { "type": "recommendation", "content": "..." },
  { "type": "risk", "content": "..." }
]

Guidelines:
- summary: 2-3 paragraph overview covering stakeholder dynamics, key patterns found across research, and overall landscape assessment. Cite specific research documents and stakeholders by name.
- recommendation: Specific, actionable engagement strategy grounded in the research evidence (one per entry, 2-4 sentences). Reference the supporting research.
- risk: Specific risk backed by research evidence (one per entry, 2-3 sentences). Name the stakeholder(s) and cite the relevant finding.

Generate at least 2 summaries, 3 recommendations, and 2 risks. Return only the JSON array.`
      : `You are an expert UX research analyst synthesizing stakeholder research for a project team. Your role is to help the team understand their stakeholder landscape and develop effective engagement strategies.${rulesSection}

Analyze the stakeholder profiles below and generate three types of structured insights. Return ONLY a valid JSON array with no markdown fencing or explanatory text outside it:
[
  { "type": "summary", "content": "..." },
  { "type": "recommendation", "content": "..." },
  { "type": "risk", "content": "..." }
]

Guidelines:
- summary: 2-3 paragraph landscape overview covering stakeholder dynamics, alignment patterns, and overall sentiment
- recommendation: Specific, actionable engagement strategies (one strategy per entry, 2-4 sentences each)
- risk: Specific risks if certain stakeholders are not properly engaged (one risk per entry, 2-3 sentences each)

Generate at least 2 summaries, 3 recommendations, and 2 risks. Reference stakeholders by name. Return only the JSON array.`;

    const userMessage = hasResearch
      ? `## Stakeholder Profiles\n\n${stakeholderSummaries}\n\n## Research Documents (${researchDocs.length})\n\n${researchContext}\n\nGenerate the landscape insights JSON array${crossReference ? ", triangulating across all sources" : ""}.`
      : `Project stakeholder profiles:\n\n${stakeholderSummaries}\n\nGenerate the landscape insights JSON array.`;

    const raw = await callGemini(systemPrompt, userMessage);

    let insights;
    try {
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      insights = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      insights = null;
    }

    if (!insights) {
      return new Response(JSON.stringify({ error: "Failed to parse insights" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const insightsToInsert = insights.map((ins: { type: string; content: string }) => ({
      project_id: projectId,
      content: ins.content,
      type: ins.type,
    }));

    await fetch(`${supabaseUrl}/rest/v1/insights?project_id=eq.${projectId}`, {
      method: "DELETE",
      headers: { "apikey": serviceKey, "Authorization": `Bearer ${serviceKey}` },
    });

    await fetch(`${supabaseUrl}/rest/v1/insights`, {
      method: "POST",
      headers: {
        "apikey": serviceKey,
        "Authorization": `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(insightsToInsert),
    });

    return new Response(JSON.stringify({ insights }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
