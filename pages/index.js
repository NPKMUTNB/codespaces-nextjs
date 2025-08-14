import { useEffect, useState } from 'react'
import Head from 'next/head'
import styles from '../styles/home.module.css'
import { useMemo } from 'react'

function Home() {
  return (
    <>
      <Head>
        <title>ค้นหาข่าวโลก | ค้นหาและดาวน์โหลดผลลัพธ์เป็น CSV</title>
        <meta name="description" content="หน้าเว็บสำหรับค้นหาข่าวจากทั่วโลก เลือกภาษา กำหนดช่วงเวลา และดาวน์โหลดผลลัพธ์เป็นไฟล์ CSV ได้อย่างง่ายดาย" />
        <meta property="og:title" content="ค้นหาข่าวโลก" />
        <meta property="og:description" content="ค้นหาข่าว เลือกภาษา กำหนดช่วงเวลา และดาวน์โหลดเป็น CSV" />
        <meta property="og:type" content="website" />
      </Head>
      <main className={styles.main}>
        <NewsList />
      </main>
    </>
  )
}

export default Home

function NewsList() {
  const [query, setQuery] = useState('')
  const [lang, setLang] = useState('th')
  const [category, setCategory] = useState('business')
  const [earliest, setEarliest] = useState('') // datetime-local
  const [latest, setLatest] = useState('') // datetime-local
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [items, setItems] = useState([])

  const fmt = (dt) => {
    if (!dt) return ''
    // dt is like '2025-08-13T12:34'. Convert to 'YYYY-MM-DD HH:mm:ss'
    const [date, time] = dt.split('T')
    const t = (time || '00:00') + (time?.length === 5 ? ':00' : '')
    return `${date} ${t}`
  }

  const params = useMemo(() => {
    const p = new URLSearchParams({ q: query, number: '8', lang })
    if (category) p.set('category', category)
    if (earliest) p.set('earliest-publish-date', fmt(earliest))
    if (latest) p.set('latest-publish-date', fmt(latest))
    return p.toString()
  }, [query, lang, category, earliest, latest])

  useEffect(() => {
    let ignore = false
    async function run() {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`/api/worldnews?${params}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || res.statusText)
        if (!ignore) setItems(data.news || [])
      } catch (e) {
        if (!ignore) setError(String(e.message || e))
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    run()
    return () => {
      ignore = true
    }
  }, [params])

  return (
    <div>
      <header style={{ marginBottom: 12 }}>
        <h1 style={{ margin: 0 }}>ค้นหาข่าวโลก</h1>
        <p style={{ margin: '4px 0 0', color: '#666' }}>
          ค้นหา เลือกภาษา และกรองตามช่วงเวลาการเผยแพร่ จากนั้นดาวน์โหลดผลลัพธ์เป็น CSV
        </p>
      </header>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          // triggers useEffect via query state
          setQuery((q) => q.trim())
        }}
        style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="search topic"
          aria-label="search topic"
          style={{ padding: 6, minWidth: 220 }}
        />
        <select value={lang} onChange={(e) => setLang(e.target.value)} aria-label="language" style={{ padding: 6 }}>
          <option value="th">ไทย (th)</option>
          <option value="en">English (en)</option>
          <option value="ja">日本語 (ja)</option>
          <option value="zh">中文 (zh)</option>
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="category" style={{ padding: 6 }}>
          <option value="">ทุกหมวด</option>
          <option value="business">Business</option>
          <option value="science">Science</option>
          <option value="technology">Technology</option>
          <option value="world">World</option>
          <option value="entertainment">Entertainment</option>
          <option value="sports">Sports</option>
          <option value="health">Health</option>
          <option value="politics">Politics</option>
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: '#666' }}>Earliest</span>
          <input
            type="datetime-local"
            value={earliest}
            onChange={(e) => setEarliest(e.target.value)}
            aria-label="earliest publish date"
            style={{ padding: 6 }}
          />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: '#666' }}>Latest</span>
          <input
            type="datetime-local"
            value={latest}
            onChange={(e) => setLatest(e.target.value)}
            aria-label="latest publish date"
            style={{ padding: 6 }}
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Loading…' : 'Search'}
        </button>
      </form>
      {error ? <p style={{ color: 'crimson' }}>Error: {error}</p> : null}
      <div style={{ margin: '8px 0' }}>
        <a href={`/api/worldnews/csv?${params}`}>
          <button type="button">Download CSV (current query)</button>
        </a>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 8 }}>
        {items.map((n, i) => (
          <li key={`${n.id || n.url || i}-${i}`} style={{ border: '1px solid #eaeaea', borderRadius: 6, padding: 10 }}>
            <a href={n.url} target="_blank" rel="noreferrer">
              <strong>{n.title || 'Untitled'}</strong>
            </a>
            <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
              {n.source ? `Source: ${n.source}` : null}
              {n.publish_date ? ` • ${new Date(n.publish_date).toLocaleString()}` : null}
              {n.category ? ` • ${n.category}` : null}
              {n.language ? ` • ${n.language}` : null}
            </div>
            {n.summary ? (
              <div style={{ marginTop: 6 }}>{n.summary}</div>
            ) : n.text ? (
              <div style={{ marginTop: 6 }}>{n.text.slice(0, 200)}{n.text.length > 200 ? '…' : ''}</div>
            ) : null}
            {(n.authors && n.authors.length) ? (
              <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>
                Authors: {Array.isArray(n.authors) ? n.authors.join(', ') : n.authors}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
