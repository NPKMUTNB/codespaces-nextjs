// Shared helper to fetch and normalize World News API results.

function toCategory(c) {
  if (!c) return ''
  if (Array.isArray(c)) return c.filter(Boolean).join('; ')
  return String(c)
}

export async function fetchWorldNews({ q = '', lang = 'en', number = '10', apiKey, day, from, to, earliest, latest, categories, category }) {
  const key = apiKey || process.env.WORLDNEWS_API_KEY
  if (!key) {
    const err = new Error('Missing API key')
    err.code = 'NO_API_KEY'
    throw err
  }

  const params = new URLSearchParams()
  if (q) params.set('text', q)
  params.set('language', String(lang))
  params.set('number', String(number))
  params.set('api-key', key)
  // Support either categories (array/string) or single category
  const catValue = categories || category
  if (catValue) {
    if (Array.isArray(catValue)) params.set('categories', catValue.filter(Boolean).join(','))
    else params.set('categories', String(catValue))
  }

  // Date filtering
  const setWindow = (start, end) => {
    if (start) params.set('earliest-publish-date', start)
    if (end) params.set('latest-publish-date', end)
  }
  if (day) {
    try {
      const d = new Date(`${day}T00:00:00Z`)
      const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0)).toISOString()
      const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59)).toISOString()
      setWindow(start, end)
    } catch {
      // ignore bad date
    }
  } else {
    if (from || to) setWindow(from, to)
  }

  // Direct earliest/latest passthrough takes precedence if provided
  if (earliest) params.set('earliest-publish-date', earliest)
  if (latest) params.set('latest-publish-date', latest)

  const url = `https://api.worldnewsapi.com/search-news?${params.toString()}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)
  try {
    const r = await fetch(url, { signal: controller.signal })
    const contentType = r.headers.get('content-type') || ''
    if (!r.ok) {
      const text = contentType.includes('application/json') ? await r.json() : await r.text()
      const err = new Error('Upstream error')
      err.status = r.status
      err.details = text
      throw err
    }
    const data = await r.json()

    const news = Array.isArray(data?.news)
      ? data.news.map((n) => ({
          id: n.id,
          title: n.title,
          text: n.text,
          summary: n.summary,
          url: n.url,
          image: n.image,
          video: n.video,
          publish_date: n.publish_date,
          authors: Array.isArray(n.authors)
            ? n.authors.filter(Boolean)
            : (n.authors ? [String(n.authors)] : []),
          category: toCategory(n.category || n.categories || n.topic || n.topics),
          language: n.language,
          source_country: n.source_country || n.sourceCountry || n.country,
          sentiment: n.sentiment,
        }))
      : []

    return { news, raw: data }
  } finally {
    clearTimeout(timeout)
  }
}
