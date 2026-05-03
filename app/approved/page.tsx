'use client'
import { useEffect, useState } from 'react'
import { supabase, type Post } from '@/lib/supabase'

export default function ApprovedPage() {
  const [posts, setPosts]     = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [copied, setCopied]   = useState<string | null>(null)

  useEffect(() => { fetchApproved() }, [])

  async function fetchApproved() {
    setLoading(true)
    const { data } = await supabase
      .from('content_queue')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
    setPosts(data ?? [])
    setLoading(false)
  }

  async function markPosted(id: string) {
    setUpdating(id)
    await supabase.from('content_queue').update({ status: 'posted' }).eq('id', id)
    setPosts(prev => prev.filter(p => p.id !== id))
    setUpdating(null)
  }

  function copy(id: string, text: string) {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div>
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1>Approved Posts</h1>
          <p>Ready to send on WhatsApp — mark as posted when done</p>
        </div>
        <button className="btn btn-ghost" onClick={fetchApproved} style={{ marginTop: 4 }}>↺ Refresh</button>
      </div>

      {loading && (
        <div className="empty-state">Loading approved posts…</div>
      )}

      {!loading && posts.length === 0 && (
        <div className="empty-state">
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>📭</div>
          No approved posts yet. Head to <strong>Review</strong> to approve some.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {posts.map(post => (
          <div key={post.id} className="card" style={{ borderLeft: '4px solid var(--green)' }}>
            {/* Meta row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.85rem', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>Theme</div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{post.theme}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>Type</div>
                  <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{post.content_type}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="badge badge-approved">Approved</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                  {new Date(post.created_at).toLocaleDateString('nl-NL')}
                </span>
              </div>
            </div>

            {/* Post text */}
            <div className="post-bubble" style={{ marginBottom: '1rem' }}>
              {post.text}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                className="btn btn-navy"
                disabled={updating === post.id}
                onClick={() => markPosted(post.id)}
              >
                {updating === post.id ? '…' : '✓ Mark as posted'}
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => copy(post.id, post.text)}
              >
                {copied === post.id ? '✓ Copied!' : 'Copy text'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
