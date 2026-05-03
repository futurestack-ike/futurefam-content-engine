import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: "claude-3-haiku-20240307",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `
Maak een WhatsApp bericht voor jongeren (16-27)

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

  const text = data?.content?.[0]?.text || "fallback message";

  // opslaan in Supabase
  await supabase.from('content_queue').insert([
    {
      theme: 'geld',
      content_type: 'tip',
      text: text,
      status: 'draft'
    }
  ]);

  return new Response(JSON.stringify({ text }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
