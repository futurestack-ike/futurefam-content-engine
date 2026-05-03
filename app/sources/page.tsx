'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Source = {
  id: string
  name: string
  url: string
  source_type: string | null
  theme: string | null
  trust_level: string | null
  active: boolean
  last_checked_at: string | null
  created_at: string
}

const EMPTY_FORM = { name: '', url: '', theme: '', source_type: '', active: true }

export default function SourcesPage() {
  const [sources, setSources]       = useState<Source[]>([])
  const [loading, setLoading]       = useState(true)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [adding, setAdding]         = useState(false)
  const [formError, setFormError]   = useState('')
  const [importing, setImporting]   = useState<string | null>(null)
  const [importAll, setImportAll]   = useState(false)
  const [results, setResults]       = useState<Record<string, 'ok' | 'error'>>({})

  useEffect(() => { fetchSources() }, [])

  async function fetchSources() {
    setLoading(true)
    const { data } = await supabase
      .from('source_urls')
      .select('*')
      .order('created_at', { ascending: false })
    setSources(data ?? [])
    setLoading(false)
  }

  async function addSource() {
    if (!form.name.trim() || !form.url.trim()) {
      setFormError('Name and URL are required.')
      return
    }
    setAdding(true)
    setFormError('')
    const { error } = await supabase.from('source_urls').insert([{
      name: form.name.trim(),
      url: form.url.trim(),
      theme: form.theme.trim() || null,
      source_type: form.source_type.trim() || null,
      active: form.active,
    }])
    if (error) { setFormError(error.message); setAdding(false); return }
    setForm(EMPTY_FORM)
    setAdding(false)
    fetchSources()
  }

  async function importSource(id: string) {
    setImporting(id)
    setResults(r => ({ ...r, [id]: undefined as any }))
    try {
      const res = await fetch('/api/import-source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_url_id: id }),
      })
      const data = await res.json()
      setResults(r => ({ ...r, [id]: res.ok ? 'ok' : 'error' }))
      if (res.ok) fetchSources() // refresh last_checked_at
    } catch {
      setResults(r => ({ ...r, [id]: 'error' }))
    } finally {
      setImporting(null)
    }
  }

  async function importAllActive() {
    setImportAll(true)
    const active = sources.filter(s => s.active)
    for (const s of active) {
      await importSource(s.id)
    }
    setImportAll(false)
  }

  return (
    <div>
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1>Bronnen</h1>
          <p>Beheer de bronnen die worden gebruikt voor kennisimport</p>
        </div>
        <button
          className="btn btn-navy"
          onClick={importAllActive}
          disabled={importAll || sources.filter(s => s.active).length === 0}
        >
          {importAll ? '⏳ Bezig…' : '↓ Importeer alle actieve bronnen'}
        </button>
      </div>

      {/* Add source form */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem' }}>Nieuwe bron toevoegen</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div>
            <label style={labelStyle}>Naam *</label>
            <input placeholder="bijv. DUO Studiefinanciering" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>URL *</label>
            <input placeholder="https://..." value={form.url}
              onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Thema</label>
            <input placeholder="bijv. geld, werk, wonen" value={form.theme}
              onChange={e => setForm(f => ({ ...f, theme: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Type bron</label>
            <input placeholder="bijv. overheid, ngo, nieuwsbrief" value={form.source_type}
              onChange={e => setForm(f => ({ ...f, source_type: e.target.value }))} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.active}
              onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
              style={{ width: 16, height: 16, accentColor: 'var(--navy)' }}
            />
            Actief
          </label>
        </div>
        {formError && <p className="msg-error" style={{ marginBottom: '0.75rem' }}>{formError}</p>}
        <button className="btn btn-gold" onClick={addSource} disabled={adding}>
          {adding ? 'Toevoegen…' : '+ Bron toevoegen'}
        </button>
      </div>

      {/* Source list */}
      {loading && <div className="empty-state">Bronnen laden…</div>}
      {!loading && sources.length === 0 && (
        <div className="empty-state">Nog geen bronnen toegevoegd.</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {sources.map(source => (
          <div key={source.id} className="card" style={{
            display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
            borderLeft: `4px solid ${source.active ? 'var(--green)' : 'var(--border)'}`,
          }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{source.name}</span>
                {source.theme && (
                  <span style={{ fontSize: '0.7rem', background: 'var(--gold-dim)', color: 'var(--navy-mid)', padding: '0.15rem 0.5rem', borderRadius: 20, fontWeight: 600 }}>
                    {source.theme}
                  </span>
                )}
                {!source.active && (
                  <span style={{ fontSize: '0.7rem', background: 'var(--border)', color: 'var(--muted)', padding: '0.15rem 0.5rem', borderRadius: 20, fontWeight: 600 }}>
                    inactief
                  </span>
                )}
              </div>
              <a href={source.url} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: '0.78rem', color: 'var(--muted)', wordBreak: 'break-all' }}>
                {source.url}
              </a>
              {source.last_checked_at && (
                <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 2 }}>
                  Laatste import: {new Date(source.last_checked_at).toLocaleString('nl-NL')}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {results[source.id] === 'ok' && <span style={{ fontSize: '0.78rem', color: 'var(--green)', fontWeight: 600 }}>✓ Geïmporteerd</span>}
              {results[source.id] === 'error' && <span style={{ fontSize: '0.78rem', color: 'var(--red)', fontWeight: 600 }}>✕ Fout</span>}
              <button
                className="btn btn-ghost"
                style={{ fontSize: '0.82rem' }}
                disabled={importing === source.id || importAll}
                onClick={() => importSource(source.id)}
              >
                {importing === source.id ? '⏳ Bezig…' : '↓ Importeer'}
              </button>
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
