'use client'
import { useEffect, useState } from 'react'
import Nav from '@/components/Nav'
import { supabase, type Post } from '@/lib/supabase'

const STATUS_FILTERS = ['all', 'pending', 'approved', 'rejected'] as const

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
}

export default function ReviewQueue() {
  const [posts, setPosts] = useState<Post[]>([])
  const [filter, setFilter] = useState<typeof STATUS_FILTERS[number]>('all')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetchPosts()
  }, [])

  async function fetchPosts() {
    setLoading(true)
    const { data } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
    setPosts(data ?? [])
    setLoading(false)
  }

  async function updateStatus(id: string, status: 'approved' | 'rejected') {
    setUpdating(id)
    await supabase.from('posts').update({ status }).eq('id', id)
    setPosts(prev => prev.map(p => (p.id === id ? { ...p, status } : p)))
    setUpdating(null)
  }

  const filtered = filter === 'all' ? posts : posts.filter(p => p.status === filter)

  const counts = {
    all: posts.length,
    pending: posts.filter(p => p.status === 'pending').length,
    approved: posts.filter(p => p.status === 'approved').length,
    rejected: posts.filter(p => p.status === 'rejected').length,
  }

  return (
    <>
      <Nav />
      <div className="page">
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '.4rem' }}>Review Queue</h1>
          <p style={{ color: 'var(--earth)', fontSize: '.95rem' }}>
            Approve or reject AI-generated WhatsApp posts
          </p>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {STATUS_FILTERS.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className="btn"
              style={{
                padding: '.4rem 1rem',
                fontSize: '.82rem',
                background: filter === s ? 'var(--ink)' : 'var(--sand)',
                color: filter === s ? '#fff' : 'var(--ink)',
              }}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}{' '}
              <span style={{ opacity: .6 }}>({counts[s]})</span>
            </button>
          ))}
          <button className="btn btn-ghost" onClick={fetchPosts} style={{ marginLeft: 'auto', fontSize: '.82rem' }}>
            ↺ Refresh
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--earth)' }}>
            Loading posts…
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--earth)' }}>
            No {filter === 'all' ? '' : filter} posts yet.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map(post => (
            <div
              key={post.id}
              className="card"
              style={{
                borderLeft: `4px solid ${
                  post.status === 'approved' ? 'var(--green)'
                  : post.status === 'rejected' ? 'var(--red)'
                  : 'var(--bark)'
                }`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.75rem', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '.75rem', color: 'var(--earth)', fontWeight: 500 }}>TOPIC</span>
                  <p style={{ fontSize: '.9rem', fontWeight: 500 }}>{post.topic}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexShrink: 0 }}>
                  <span className={`badge badge-${post.status}`}>{post.status}</span>
                  <span style={{ fontSize: '.75rem', color: 'var(--bark)' }}>
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div style={{
                background: 'var(--cream)',
                borderRadius: '8px',
                padding: '.9rem 1rem',
                lineHeight: 1.6,
                fontSize: '.93rem',
                marginBottom: '1rem',
              }}>
                {post.content}
              </div>

              <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                {post.status !== 'approved' && (
                  <button
                    className="btn btn-green"
                    disabled={updating === post.id}
                    onClick={() => updateStatus(post.id, 'approved')}
                  >
                    ✓ Approve
                  </button>
                )}
                {post.status !== 'rejected' && (
                  <button
                    className="btn btn-red"
                    disabled={updating === post.id}
                    onClick={() => updateStatus(post.id, 'rejected')}
                  >
                    ✕ Reject
                  </button>
                )}
                <button
                  className="btn btn-ghost"
                  onClick={() => copyToClipboard(post.content)}
                  style={{ marginLeft: 'auto' }}
                >
                  Copy
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
