// Simple proxy to World News API. Avoid exposing the API key to the browser.
// Usage: GET /api/worldnews?q=topic&lang=en&number=10

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const {
    q = '',
    lang = 'en',
    number = '10',
    day,
    from,
    to,
    'earliest-publish-date': earliest,
    'latest-publish-date': latest,
    // Allow passing a key in query for quick tests, but prefer env var.
    key: keyFromQuery,
  } = req.query

  const apiKey = process.env.WORLDNEWS_API_KEY || keyFromQuery
  try {
  const { fetchWorldNews } = await import('../../lib/worldnews')
  const data = await fetchWorldNews({ q, lang, number, day, from, to, earliest, latest, apiKey })
    return res.status(200).json(data)
  } catch (err) {
    if (err?.code === 'NO_API_KEY') {
      return res.status(400).json({ error: 'Missing API key. Set WORLDNEWS_API_KEY in .env.local or pass ?key=...' })
    }
    const status = err?.status || (err?.name === 'AbortError' ? 504 : 502)
    return res.status(status).json({ error: 'Failed to fetch World News', details: err?.details || String(err?.message || err) })
  }
}
