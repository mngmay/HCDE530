import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

interface GeminiPart {
  text: string;
}

interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

async function callGemini(systemPrompt: string, contents: GeminiContent[]): Promise<string> {
  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": GEMINI_API_KEY,
    },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error: ${err}`);
  }

  const data = await res.json();
  return data.candidates[0].content.parts[0].text as string;
}

function toGeminiRole(role: string): "user" | "model" {
  return role === "user" ? "user" : "model";
}

function rulesBlock(rules: string | null): string {
  if (!rules?.trim()) return "";
  return `\n\nProject Rules (follow these guidelines throughout):\n${rules.trim()}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { stakeholderId, messages, action } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const shRes = await fetch(`${supabaseUrl}/rest/v1/stakeholders?id=eq.${stakeholderId}&select=*`, {
      headers: { "apikey": serviceKey, "Authorization": `Bearer ${serviceKey}` },
    });
    const stakeholders = await shRes.json();
    const sh = stakeholders[0];

    if (!sh) {
      return new Response(JSON.stringify({ error: "Stakeholder not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch project rules
    const projRes = await fetch(`${supabaseUrl}/rest/v1/projects?id=eq.${sh.project_id}&select=rules`, {
      headers: { "apikey": serviceKey, "Authorization": `Bearer ${serviceKey}` },
    });
    const projects = await projRes.json();
    const projectRules: string | null = projects[0]?.rules ?? null;

    if (action === "start") {
      const systemPrompt = `You are a skilled UX research analyst conducting a structured stakeholder interview. Your role is to help the researcher build a deep, nuanced understanding of this stakeholder so they can engage with them effectively.

Stakeholder: ${sh.name}
Role: ${sh.role}${sh.organization ? `\nOrganization: ${sh.organization}` : ""}
Influence Level: ${sh.influence_level}
Interest Level: ${sh.interest_level}
Current Stance: ${sh.stance}${rulesBlock(projectRules)}

Begin with a warm, professional welcome that acknowledges who this stakeholder is. Then ask your first targeted question to understand their primary goals and priorities related to this work. Keep your message to 2-3 short paragraphs. Be conversational, supportive, and specific to this stakeholder — not generic.`;

      const welcomeMsg = await callGemini(systemPrompt, [
        { role: "user", parts: [{ text: "Please begin the stakeholder interview." }] },
      ]);

      return new Response(JSON.stringify({ message: welcomeMsg }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "continue") {
      const systemPrompt = `You are a skilled UX research analyst conducting a stakeholder interview. Your goal is to help the researcher deeply understand this stakeholder's priorities, concerns, and motivations.

Stakeholder: ${sh.name}
Role: ${sh.role}${sh.organization ? `\nOrganization: ${sh.organization}` : ""}
Influence Level: ${sh.influence_level}
Interest Level: ${sh.interest_level}
Current Stance: ${sh.stance}${rulesBlock(projectRules)}

Guidelines:
- Ask one focused follow-up question at a time based on the conversation so far
- Probe for specifics: underlying motivations, success metrics, concerns, relationships with other stakeholders
- Validate and reflect back what you hear before asking your next question
- If the user volunteers important information, acknowledge it meaningfully
- Keep responses concise and conversational (2-4 short paragraphs max)
- Be professional, warm, and genuinely curious`;

      const contents: GeminiContent[] = (messages as { role: string; content: string }[]).map(m => ({
        role: toGeminiRole(m.role),
        parts: [{ text: m.content }],
      }));

      const lastRole = contents[contents.length - 1]?.role;
      if (lastRole !== "user") {
        contents.push({ role: "user", parts: [{ text: "Please continue the interview." }] });
      }

      const aiMsg = await callGemini(systemPrompt, contents);

      return new Response(JSON.stringify({ message: aiMsg }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "generate-profile") {
      const systemPrompt = `You are an expert UX research analyst. Based on the stakeholder interview transcript provided, generate a structured stakeholder profile as a JSON object.

Stakeholder: ${sh.name}
Role: ${sh.role}${sh.organization ? `\nOrganization: ${sh.organization}` : ""}
Influence Level: ${sh.influence_level}
Interest Level: ${sh.interest_level}
Current Stance: ${sh.stance}${rulesBlock(projectRules)}

Return ONLY a valid JSON object with exactly these fields:
{
  "summary": "2-3 sentence overview of who this stakeholder is and their relationship to the work",
  "key_priorities": ["priority 1", "priority 2", "priority 3"],
  "potential_concerns": ["concern 1", "concern 2"],
  "influence_patterns": "1-2 sentences describing how this stakeholder exerts influence and makes decisions",
  "engagement_recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "risk_assessment": "1-2 sentences summarizing the main risks if this stakeholder is not properly engaged"
}

Do not include any markdown fencing, explanatory text, or anything outside the JSON object.`;

      const conversationText = (messages as { role: string; content: string }[])
        .map(m => `${m.role === "user" ? "Researcher" : "Interviewer"}: ${m.content}`)
        .join("\n\n");

      const raw = await callGemini(systemPrompt, [
        { role: "user", parts: [{ text: `Interview transcript:\n\n${conversationText}\n\nGenerate the stakeholder profile JSON.` }] },
      ]);

      let profile;
      try {
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        profile = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      } catch {
        profile = null;
      }

      if (!profile) {
        return new Response(JSON.stringify({ error: "Failed to parse profile" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ profile }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
