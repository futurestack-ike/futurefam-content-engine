import { createClient } from "@supabase/supabase-js";

// Simple HTML → plain text extractor (no external deps)
function extractText(html: string): string {
  return html
    // Remove scripts, styles, nav, footer, header
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    // Replace block elements with newlines
    .replace(/<\/(p|div|li|h[1-6]|br|tr)>/gi, "\n")
    // Strip remaining tags
    .replace(/<[^>]+>/g, " ")
    // Decode common HTML entities
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    // Collapse whitespace
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    // Limit to first ~3000 chars to stay within Claude context
    .slice(0, 3000);
}

export async function POST(req: Request) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey || !anthropicApiKey) {
    return Response.json({ error: "Missing environment variables" }, { status: 500 });
  }

  const body = await req.json();
  const { source_url_id } = body;

  if (!source_url_id) {
    return Response.json({ error: "source_url_id is required" }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  // 1. Fetch the source record
  const { data: source, error: sourceError } = await supabase
    .from("source_urls")
    .select("*")
    .eq("id", source_url_id)
    .single();

  if (sourceError || !source) {
    return Response.json({ error: "Source not found" }, { status: 404 });
  }

  // 2. Fetch the URL server-side
  let rawHtml: string;
  try {
    const fetchRes = await fetch(source.url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; FutureMoves-Bot/1.0)" },
      signal: AbortSignal.timeout(10000),
    });
    if (!fetchRes.ok) throw new Error(`HTTP ${fetchRes.status}`);
    rawHtml = await fetchRes.text();
  } catch (e: any) {
    return Response.json({ error: `Failed to fetch URL: ${e.message}` }, { status: 502 });
  }

  // 3. Extract readable text
  const pageText = extractText(rawHtml);

  if (!pageText || pageText.length < 50) {
    return Response.json({ error: "Could not extract useful text from page" }, { status: 422 });
  }

  // 4. Send to Claude for structured extraction
  const prompt = `Analyseer deze pagina en extraheer bruikbare informatie voor iemand van 16–27 jaar.

Paginatekst:
${pageText}

Geef ALLEEN geldige JSON terug, geen uitleg, geen markdown:
{
  "title": "",
  "type": "tip | update | checklist | weetje",
  "theme": "",
  "content": "",
  "season_tag": "",
  "valid_from": null,
  "valid_until": null
}

Regels voor de content:
- Geen "jongeren" — spreek direct (jij/je)
- Simpel Nederlands
- Geen lange teksten
- Geen jargon
- Geen beleidstaal
- Future Moves is een schakel, geen coach`;

  const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": anthropicApiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const claudeData = await claudeRes.json();

  if (!claudeRes.ok) {
    return Response.json({ error: "Anthropic API error", details: claudeData }, { status: 500 });
  }

  const rawText = claudeData.content?.find((i: any) => i.type === "text")?.text ?? "";

  // 5. Parse JSON from Claude response
  let extracted: any;
  try {
    const cleaned = rawText.replace(/```json|```/g, "").trim();
    extracted = JSON.parse(cleaned);
  } catch {
    return Response.json({ error: "Claude returned invalid JSON", raw: rawText }, { status: 500 });
  }

  // 6. Save to knowledge_items with status = review
  const { data: inserted, error: insertError } = await supabase
    .from("knowledge_items")
    .insert([{
      title: extracted.title ?? source.name,
      type: extracted.type ?? "tip",
      theme: extracted.theme ?? source.theme ?? null,
      content: extracted.content,
      season_tag: extracted.season_tag ?? null,
      valid_from: extracted.valid_from ?? null,
      valid_until: extracted.valid_until ?? null,
      status: "review",
      source_name: source.name,
      source_url: source.url,
      imported_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (insertError) {
    return Response.json({ error: insertError.message }, { status: 500 });
  }

  // 7. Update last_checked_at on source
  await supabase
    .from("source_urls")
    .update({ last_checked_at: new Date().toISOString() })
    .eq("id", source_url_id);

  return Response.json({ success: true, knowledge_item: inserted });
}
