'use client'
import { useEffect, useState } from 'react'
import { supabase, type Post } from '@/lib/supabase'

export default function ReviewPage() {
  const [posts, setPosts]   = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [edits, setEdits]   = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => { fetchDrafts() }, [])

  async function fetchDrafts() {
    setLoading(true)
    const { data } = await supabase
      .from('content_queue')
      .select('*')
      .eq('status', 'draft')
      .order('created_at', { ascending: false })
    setPosts(data ?? [])
    setLoading(false)
  }

  async function saveEdit(id: string) {
    if (edits[id] === undefined) return
    setSaving(id + '_save')
    await supabase.from('content_queue').update({ text: edits[id] }).eq('id', id)
    setPosts(prev => prev.map(p => p.id === id ? { ...p, text: edits[id] } : p))
    setEdits(prev => { const n = { ...prev }; delete n[id]; return n })
    setSaving(null)
  }

  async function updateStatus(id: string, status: 'approved' | 'rejected') {
    setSaving(id)
    const patch: any = { status }
    if (edits[id] !== undefined) patch.text = edits[id]
    await supabase.from('content_queue').update(patch).eq('id', id)
    setPosts(prev => prev.filter(p => p.id !== id))
    setSaving(null)
  }

  const isDirty = (id: string) => edits[id] !== undefined

  return (
    <div>
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1>Review Queue</h1>
          <p>Edit, approve or reject draft posts</p>
        </div>
        <button className="btn btn-ghost" onClick={fetchDrafts} style={{ marginTop: 4 }}>↺ Refresh</button>
      </div>

      {loading && (
        <div className="empty-state">Loading drafts…</div>
      )}

      {!loading && posts.length === 0 && (
        <div className="empty-state">
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>🎉</div>
          Queue is empty — no drafts waiting.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {posts.map(post => (
          <div key={post.id} className="card" style={{ borderLeft: '4px solid var(--gold)' }}>
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
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)', alignSelf: 'center' }}>
                {new Date(post.created_at).toLocaleDateString('nl-NL')}
              </span>
            </div>

            {/* Editable text */}
            <textarea
              rows={4}
              value={edits[post.id] ?? post.text}
              onChange={e => setEdits(prev => ({ ...prev, [post.id]: e.target.value }))}
              style={{ marginBottom: '1rem' }}
            />

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {isDirty(post.id) && (
                <button
                  className="btn btn-ghost"
                  disabled={saving === post.id + '_save'}
                  onClick={() => saveEdit(post.id)}
                >
                  💾 Save edit
                </button>
              )}
              <button
                className="btn btn-green"
                disabled={saving === post.id}
                onClick={() => updateStatus(post.id, 'approved')}
              >
                ✓ Approve
              </button>
              <button
                className="btn btn-red"
                disabled={saving === post.id}
                onClick={() => updateStatus(post.id, 'rejected')}
              >
                ✕ Reject
              </button>
              {isDirty(post.id) && (
                <button
                  className="btn btn-ghost"
                  style={{ marginLeft: 'auto' }}
                  onClick={() => setEdits(prev => { const n = { ...prev }; delete n[post.id]; return n })}
                >
                  Discard
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
