import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey || !anthropicApiKey) {
    return Response.json({ error: "Missing environment variables" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  // 1. Fetch a random active knowledge item
  const { data: activeRows } = await supabase
    .from("knowledge_items")
    .select("id, content, title, type, theme")
    .eq("status", "active");

  const pool = activeRows && activeRows.length > 0
    ? activeRows
    : (await supabase.from("knowledge_items").select("id, content, title, type, theme")).data;

  if (!pool || pool.length === 0) {
    return Response.json({ error: "No knowledge items found" }, { status: 500 });
  }

  const knowledgeItem = pool[Math.floor(Math.random() * pool.length)];

  // 2. Pick a varied content format — not always a question
  const formats = [
    "tip: geef een concrete, directe tip",
    "weetje: deel een verrassend feit of inzicht",
    "update: geef een korte relevante update",
    "checklist: geef 2–3 korte actiepunten",
    "bericht: schrijf een direct, warm bericht zonder vraag",
  ];
  const format = formats[Math.floor(Math.random() * formats.length)];

  // 3. Build prompt with real content
  const prompt = `Je bent de FutureFam content assistant van Future Moves.
Je schrijft WhatsApp-berichten.

Communicatiestijl (HEEL BELANGRIJK):
- Spreek direct tegen de lezer (jij / je)
- Praat NOOIT over "jongeren"
- Gebruik geen formele of beleidsmatige taal
- Geen uitleg alsof je docent bent
- Geen lange teksten

Tone of voice:
- direct
- warm
- eerlijk
- beetje urgent

Rol:
- Future Moves is een schakel
- geen coach, geen hulpverlener

Gebruik deze informatie:
${knowledgeItem.content}

Maak 1 WhatsApp bericht als: ${format}

Regels:
- max 3–4 korte regels
- simpel Nederlands
- concreet
- geen jargon
- geen "jongeren"
- niet altijd eindigen met een vraag

Output:
Alleen het bericht`;

  // 4. Call Claude
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": anthropicApiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }]
    })
  });

  const claudeData = await response.json();

  if (!response.ok) {
    return Response.json({ error: "Anthropic API error", details: claudeData }, { status: 500 });
  }

  const text = claudeData.content?.find((item: any) => item.type === "text")?.text;

  if (!text) {
    return Response.json({ error: "No text returned from Claude", raw: claudeData }, { status: 500 });
  }

  // 5. Save to content_queue — try with source columns, fall back without
  const fullInsert = {
    theme: knowledgeItem.theme ?? knowledgeItem.title ?? "algemeen",
    content_type: knowledgeItem.type ?? "tip",
    text,
    status: "draft",
    source_id: knowledgeItem.id,
    source_title: knowledgeItem.title ?? null,
  };

  const { error: insertError } = await supabase.from("content_queue").insert([fullInsert]);

  if (insertError) {
    if (insertError.message.includes("source")) {
      const { error: fallbackError } = await supabase.from("content_queue").insert([{
        theme: knowledgeItem.theme ?? knowledgeItem.title ?? "algemeen",
        content_type: knowledgeItem.type ?? "tip",
        text,
        status: "draft",
      }]);
      if (fallbackError) return Response.json({ error: fallbackError.message }, { status: 500 });
    } else {
      return Response.json({ error: insertError.message }, { status: 500 });
    }
  }

  return Response.json({ text });
}
