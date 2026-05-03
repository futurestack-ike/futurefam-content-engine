import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey || !anthropicApiKey) {
    return Response.json(
      { error: "Missing environment variables" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": anthropicApiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-20241022",",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `
Maak een WhatsApp bericht voor jongeren van 16 tot 27 jaar.

Regels:
- max 2 zinnen
- simpel en direct
- eindig met een vraag
- thema: geld
          `
        }
      ]
    })
  });

  const data = await response.json();
  const text = data?.content?.[0]?.text || "Geen bericht gegenereerd.";

  const { error } = await supabase.from("content_queue").insert([
    {
      theme: "geld",
      content_type: "tip",
      text,
      status: "draft"
    }
  ]);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ text });
}
