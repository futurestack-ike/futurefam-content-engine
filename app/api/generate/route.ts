import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const { topic } = await req.json()

    if (!topic?.trim()) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Write a WhatsApp post for FutureFam community about: "${topic}".

Rules:
- Max 300 characters
- Warm, energetic tone — like a message from a trusted friend
- Use 1–2 relevant emojis
- End with a short call to action or question
- No hashtags

Return only the post text, nothing else.`,
        },
      ],
    })

    const content = message.content[0].type === 'text' ? message.content[0].text : ''

    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('posts')
      .insert({ topic, content, status: 'pending' })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ post: data })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message ?? 'Generation failed' }, { status: 500 })
  }
}
