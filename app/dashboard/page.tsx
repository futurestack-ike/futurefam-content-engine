'use client'
import { useState } from 'react'
import Nav from '@/components/Nav'
import Link from 'next/link'

const TOPIC_SUGGESTIONS = [
  'Community gratitude ritual',
  'Morning motivation for parents',
  'Weekend family challenge',
  'Mindfulness for busy moms',
  'Celebrating small wins',
]

export default function Dashboard() {
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ content: string; id: string } | null>(null)
  const [error, setError] = useState('')

  async function generate() {
    if (!topic.trim()) return
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult({ content: data.post.content, id: data.post.id })
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Nav />
      <div className="page">
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '.4rem' }}>Content Generator</h1>
          <p style={{ color: 'var(--earth)', fontSize: '.95rem' }}>
            Generate WhatsApp posts for the FutureFam community
          </p>
        </div>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <label>Topic or theme</label>
          <textarea
            rows={3}
            placeholder="e.g. Encouraging moms to take 5 minutes for themselves today"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            style={{ marginBottom: '1rem', resize: 'vertical' }}
          />

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', marginBottom: '1.25rem' }}>
            {TOPIC_SUGGESTIONS.map(s => (
              <button
                key={s}
                className="btn btn-ghost"
                style={{ fontSize: '.78rem', padding: '.3rem .8rem' }}
                onClick={() => setTopic(s)}
              >
                {s}
              </button>
            ))}
          </div>

          <button
            className="btn btn-primary"
            onClick={generate}
            disabled={loading || !topic.trim()}
          >
            {loading ? '⏳ Generating…' : '✦ Generate Post'}
          </button>

          {error && <p className="error">{error}</p>}
        </div>

        {result && (
          <div className="card" style={{ borderLeft: '4px solid var(--accent)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem' }}>Generated Post</h3>
              <span className="badge badge-pending">Pending review</span>
            </div>

            <div style={{
              background: 'var(--cream)',
              borderRadius: '8px',
              padding: '1rem',
              fontFamily: 'inherit',
              lineHeight: 1.6,
              fontSize: '.95rem',
              marginBottom: '1rem',
            }}>
              {result.content}
            </div>

            <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
              <Link href="/review" className="btn btn-ghost">→ Go to Review Queue</Link>
              <button
                className="btn btn-ghost"
                onClick={() => { setResult(null); setTopic('') }}
              >
                Generate another
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
