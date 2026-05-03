'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type KnowledgeItem = {
  id: string
  title: string | null
  type: string | null
  theme: string | null
  content: string | null
  season_tag: string | null
  source_name: string | null
  source_url: string | null
  status: string
  imported_at: string | null
  created_at: string
}

const TYPE_OPTIONS = ['tip', 'update', 'checklist', 'weetje']

export default function KnowledgeReviewPage() {
  const [items, setItems]     = useState<KnowledgeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [edits, setEdits]     = useState<Record<string, Partial<KnowledgeItem>>>({})
  const [saving, setSaving]   = useState<string | null>(null)

  useEffect(() => { fetchItems() }, [])

  async function fetchItems() {
    setLoading(true)
    const { data } = await supabase
      .from('knowledge_items')
      .select('*')
      .eq('status', 'review')
      .order('imported_at', { ascending: false })
    setItems(data ?? [])
    setLoading(false)
  }

  function patch(id: string, field: string, value: string) {
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
  }

  function val(item: KnowledgeItem, field: keyof KnowledgeItem): string {
    return (edits[item.id]?.[field] ?? item[field] ?? '') as string
  }

  async function saveEdit(id: string) {
    const changes = edits[id]
    if (!changes || Object.keys(changes).length === 0) return
    setSaving(id + '_save')
    await supabase.from('knowledge_items').update(changes).eq('id', id)
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...changes } : i))
    setEdits(prev => { const n = { ...prev }; delete n[id]; return n })
    setSaving(null)
  }

  async function updateStatus(id: string, status: 'active' | 'rejected') {
    setSaving(id)
    const changes = edits[id] ?? {}
    await supabase.from('knowledge_items').update({ ...changes, status }).eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
    setSaving(null)
  }

  const isDirty = (id: string) => edits[id] && Object.keys(edits[id]).length > 0

  return (
    <div>
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1>Kennisreview</h1>
          <p>Beoordeel geïmporteerde kennisitems voor ze worden gebruikt</p>
        </div>
        <button className="btn btn-ghost" onClick={fetchItems} style={{ marginTop: 4 }}>↺ Vernieuwen</button>
      </div>

      {loading && <div className="empty-state">Laden…</div>}
      {!loading && items.length === 0 && (
        <div className="empty-state">
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>✅</div>
          Geen items meer in de reviewwachtrij.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {items.map(item => (
          <div key={item.id} className="card" style={{ borderLeft: '4px solid var(--gold)' }}>
            {/* Source info */}
            {item.source_name && (
              <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: '0.85rem', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <span>📎 <strong>{item.source_name}</strong></span>
                {item.source_url && (
                  <a href={item.source_url} target="_blank" rel="noopener noreferrer"
                    style={{ color: 'var(--muted)', textDecoration: 'underline' }}>
                    {item.source_url.slice(0, 60)}{item.source_url.length > 60 ? '…' : ''}
                  </a>
                )}
                {item.imported_at && (
                  <span>Geïmporteerd: {new Date(item.imported_at).toLocaleString('nl-NL')}</span>
                )}
              </div>
            )}

            {/* Editable fields */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label style={labelStyle}>Titel</label>
                <input value={val(item, 'title')} onChange={e => patch(item.id, 'title', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Type</label>
                <select value={val(item, 'type')} onChange={e => patch(item.id, 'type', e.target.value)}>
                  <option value="">— kies —</option>
                  {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Thema</label>
                <input value={val(item, 'theme')} onChange={e => patch(item.id, 'theme', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Seizoenstag</label>
                <input value={val(item, 'season_tag')} placeholder="bijv. zomer, back-to-school"
                  onChange={e => patch(item.id, 'season_tag', e.target.value)} />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Content</label>
              <textarea
                rows={4}
                value={val(item, 'content')}
                onChange={e => patch(item.id, 'content', e.target.value)}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {isDirty(item.id) && (
                <button className="btn btn-ghost" disabled={saving === item.id + '_save'}
                  onClick={() => saveEdit(item.id)}>
                  💾 Opslaan
                </button>
              )}
              <button className="btn btn-green" disabled={!!saving && saving === item.id}
                onClick={() => updateStatus(item.id, 'active')}>
                ✓ Goedkeuren
              </button>
              <button className="btn btn-red" disabled={!!saving && saving === item.id}
                onClick={() => updateStatus(item.id, 'rejected')}>
                ✕ Afwijzen
              </button>
              {isDirty(item.id) && (
                <button className="btn btn-ghost" style={{ marginLeft: 'auto' }}
                  onClick={() => setEdits(prev => { const n = { ...prev }; delete n[item.id]; return n })}>
                  Wijzigingen ongedaan
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.72rem',
  fontWeight: 700,
  color: 'var(--muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 4,
}
