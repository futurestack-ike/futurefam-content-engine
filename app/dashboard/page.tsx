'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Stats = { draft: number; approved: number; posted: number; rejected: number }

export default function Dashboard() {
  const [stats, setStats]       = useState<Stats>({ draft: 0, approved: 0, posted: 0, rejected: 0 })
  const [loadingStats, setLoadingStats] = useState(true)
  const [generating, setGenerating]     = useState(false)
  const [lastPost, setLastPost]         = useState<string | null>(null)
  const [error, setError]               = useState('')

  useEffect(() => { fetchStats() }, [])

  async function fetchStats() {
    setLoadingStats(true)
    const { data } = await supabase.from('content_queue').select('status')
    if (data) {
      setStats({
        draft:    data.filter(r => r.status === 'draft').length,
        approved: data.filter(r => r.status === 'approved').length,
        posted:   data.filter(r => r.status === 'posted').length,
        rejected: data.filter(r => r.status === 'rejected').length,
      })
    }
    setLoadingStats(false)
  }

  async function generate() {
    setGenerating(true)
    setError('')
    setLastPost(null)
    try {
      const res = await fetch('/api/generate')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Generation failed')
      setLastPost(data.text)
      await fetchStats()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  const statCards = [
    { label: 'Drafts',   value: stats.draft,    color: '#6B7A99',      border: '#6B7A99' },
    { label: 'Approved', value: stats.approved, color: 'var(--green)',  border: 'var(--green)' },
    { label: 'Posted',   value: stats.posted,   color: 'var(--gold)',   border: 'var(--gold)' },
    { label: 'Rejected', value: stats.rejected, color: 'var(--red)',    border: 'var(--red)' },
  ]

  return (
    <div>
      <div className="section-header">
        <h1>Content Engine</h1>
        <p>Generate and manage WhatsApp posts for the Future Moves community</p>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        {statCards.map(({ label, value, color, border }) => (
          <div key={label} className="stat-card" style={{ color: color, borderTopColor: border }}>
            <div className="stat-value">{loadingStats ? '–' : value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Generate hero card */}
      <div className="card-hero" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ color: '#fff', fontSize: '1.15rem', fontWeight: 700, marginBottom: 6 }}>
            Generate a new post
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem', maxWidth: 380 }}>
            Claude writes a WhatsApp message for young people aged 16–27 and drops it into the review queue.
          </p>
        </div>
        <button
          className="btn btn-gold"
          onClick={generate}
          disabled={generating}
          style={{ fontSize: '0.9rem', padding: '0.65rem 1.75rem', fontFamily: 'Sora, sans-serif', fontWeight: 700 }}
        >
          {generating ? '⏳ Generating…' : '+ Generate Post'}
        </button>
      </div>

      {error && <p className="msg-error">{error}</p>}

      {/* Last generated post preview */}
      {lastPost && (
        <div className="card" style={{ borderLeft: '4px solid var(--gold)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Just generated</h3>
            <span className="badge badge-draft">Draft</span>
          </div>
          <div className="post-bubble" style={{ marginBottom: '1rem' }}>{lastPost}</div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link href="/review" className="btn btn-navy">→ Go to Review</Link>
            <button className="btn btn-ghost" onClick={() => setLastPost(null)}>Dismiss</button>
          </div>
        </div>
      )}

      {/* Quick links */}
      {!lastPost && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
          <Link href="/review" className="card" style={{ display: 'block', cursor: 'pointer', transition: 'box-shadow 0.15s' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>📋</div>
            <h3 style={{ fontSize: '0.95rem', marginBottom: 4 }}>Review Queue</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{stats.draft} draft{stats.draft !== 1 ? 's' : ''} waiting for review</p>
          </Link>
          <Link href="/approved" className="card" style={{ display: 'block', cursor: 'pointer', transition: 'box-shadow 0.15s' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>✅</div>
            <h3 style={{ fontSize: '0.95rem', marginBottom: 4 }}>Approved Posts</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{stats.approved} post{stats.approved !== 1 ? 's' : ''} ready to send</p>
          </Link>
        </div>
      )}
    </div>
  )
}
