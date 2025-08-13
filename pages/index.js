import { useCallback, useEffect, useState } from 'react'
import Button from '../components/Button'
import ClickCount from '../components/ClickCount'
import styles from '../styles/home.module.css'
import { useMemo } from 'react'

function throwError() {
  console.log(
    // The function body() is not defined
    document.body()
  )
}

function Home() {
  const [count, setCount] = useState(0)
  const increment = useCallback(() => {
    setCount((v) => v + 1)
  }, [setCount])

  useEffect(() => {
    const r = setInterval(() => {
      increment()
    }, 1000)

    return () => {
      clearInterval(r)
    }
  }, [increment])

  return (
    <main className={styles.main}>
      <h1>Fast Refresh Demo</h1>
      <p>
        Fast Refresh is a Next.js feature that gives you instantaneous feedback
        on edits made to your React components, without ever losing component
        state.
      </p>
      <hr className={styles.hr} />
      <div>
        <p>
          Auto incrementing value. The counter won't reset after edits or if
          there are errors.
        </p>
        <p>Current value: {count}</p>
      </div>
      <hr className={styles.hr} />
      <div>
        <p>Component with state.</p>
        <ClickCount />
      </div>
      <hr className={styles.hr} />
      <div>
        <p>
          The button below will throw 2 errors. You'll see the error overlay to
          let you know about the errors but it won't break the page or reset
          your state.
        </p>
        <Button
          onClick={(e) => {
            setTimeout(() => document.parentNode(), 0)
            throwError()
          }}
        >
          Throw an Error
        </Button>
      </div>
      <hr className={styles.hr} />
      <div>
        <p>World News (via API route proxy)</p>
        <NewsList />
  {/* CSV download button is rendered inside NewsList with current query */}
      </div>
      <hr className={styles.hr} />
    </main>
  )
}

export default Home

function NewsList() {
  const [query, setQuery] = useState('technology')
  const [lang, setLang] = useState('th')
  const [day, setDay] = useState('') // YYYY-MM-DD
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [items, setItems] = useState([])

  const params = useMemo(() => {
    const p = new URLSearchParams({ q: query, number: '8', lang })
    if (day) p.set('day', day)
    return p.toString()
  }, [query, lang, day])

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
        <input
          type="date"
          value={day}
          onChange={(e) => setDay(e.target.value)}
          aria-label="date"
          style={{ padding: 6 }}
        />
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
          <li key={`${n.url}-${i}`} style={{ border: '1px solid #eaeaea', borderRadius: 6, padding: 10 }}>
            <a href={n.url} target="_blank" rel="noreferrer">
              <strong>{n.title || 'Untitled'}</strong>
            </a>
            <div style={{ fontSize: 12, color: '#666' }}>
              {n.source ? `Source: ${n.source}` : null}
              {n.publish_date ? ` • ${new Date(n.publish_date).toLocaleString()}` : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
