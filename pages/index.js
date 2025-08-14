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
      <header>
        <h1 className={styles.headerTitle}>ค้นหาข่าวโลก</h1>
        <p className={styles.headerSubtitle}>ค้นหา เลือกภาษา กรองช่วงเวลา และดาวน์โหลดเป็น CSV ได้อย่างรวดเร็ว</p>
      </header>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          // triggers useEffect via query state
          setQuery((q) => q.trim())
        }}
        className={styles.toolbar}
      >
        <div className={styles.fieldGroup} style={{ flex: '1 1 240px' }}>
          <label htmlFor="q">คำค้น (Keyword)</label>
          <input id="q" className={styles.input} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="เช่น AI, climate, energy" autoComplete="off" />
        </div>
        <div className={styles.fieldGroup}>
          <label htmlFor="lang">ภาษา (Language)</label>
          <select id="lang" className={styles.select} value={lang} onChange={(e) => setLang(e.target.value)}>
            <option value="th">ไทย (th)</option>
            <option value="en">English (en)</option>
            <option value="ja">日本語 (ja)</option>
            <option value="zh">中文 (zh)</option>
          </select>
        </div>
        <div className={styles.fieldGroup}>
          <label htmlFor="category">หมวดหมู่</label>
          <select id="category" className={styles.select} value={category} onChange={(e) => setCategory(e.target.value)}>
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
        </div>
        <div className={styles.fieldGroup}>
          <label htmlFor="earliest">Earliest</label>
          <input id="earliest" type="datetime-local" className={styles.input} value={earliest} onChange={(e) => setEarliest(e.target.value)} />
        </div>
        <div className={styles.fieldGroup}>
          <label htmlFor="latest">Latest</label>
          <input id="latest" type="datetime-local" className={styles.input} value={latest} onChange={(e) => setLatest(e.target.value)} />
        </div>
        <div className={styles.actions} style={{ marginTop: 'auto' }}>
          <button className={styles.buttonPrimary} type="submit" disabled={loading}>{loading ? 'กำลังค้นหา…' : 'ค้นหา'}</button>
        </div>
      </form>
      {loading && (
        <div className={styles.loadingBarWrapper} aria-hidden>
          <div className={styles.loadingBar} />
        </div>
      )}
      {error ? <p className={styles.error}>Error: {error}</p> : null}
      <div className={styles.downloadLink} style={{ margin: '4px 0 14px' }}>
        <a href={`/api/worldnews/csv?${params}`}><button className={styles.input} style={{ cursor: 'pointer' }} type="button">Download CSV</button></a>
      </div>
      {!loading && !error && items.length === 0 && (
        <div className={styles.emptyState}>ยังไม่มีผลลัพธ์ ลองพิมพ์คำค้นแล้วกดค้นหา</div>
      )}
      <ul className={styles.resultsGrid}>
        {items.map((n, i) => {
          const dateStr = n.publish_date ? new Date(n.publish_date).toLocaleString() : ''
          return (
            <li key={`${n.id || n.url || i}-${i}`} className={styles.newsCard}>
              {n.image ? <img src={n.image} alt="" className={styles.thumb} loading="lazy" /> : null}
              <h3 className={styles.newsTitle}><a href={n.url} target="_blank" rel="noreferrer">{n.title || 'Untitled'}</a></h3>
              <div className={styles.meta}>
                {dateStr && <span>{dateStr}</span>}
                {n.language && <span>{n.language}</span>}
                {n.category && <span>{n.category}</span>}
                {n.source_country && <span>{n.source_country}</span>}
                {typeof n.sentiment === 'number' && <span>sentiment: {n.sentiment}</span>}
              </div>
              {n.summary ? <div className={styles.summary}>{n.summary}</div> : n.text ? <div className={styles.summary}>{n.text.slice(0,180)}{n.text.length>180?'…':''}</div> : null}
              {n.authors && n.authors.length ? <div className={styles.authors}>By {Array.isArray(n.authors)?n.authors.join(', '):n.authors}</div> : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
