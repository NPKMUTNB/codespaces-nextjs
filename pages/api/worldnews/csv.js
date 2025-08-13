// Export World News results as CSV.
// GET /api/worldnews/csv?q=topic&number=10&lang=en
// Adds extra derived fields such as category (if available) and hostname.
import fs from 'fs/promises'
import path from 'path'
import { fetchWorldNews } from '../../../lib/worldnews'

function toCsvValue(v) {
  if (v == null) return ''
  const s = String(v)
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
  return s
}

function toCsv(rows) {
  return rows.map((r) => r.map(toCsvValue).join(',')).join('\n') + '\n'
}

function pick(obj, keys) { const out = {}; for (const k of keys) if (obj[k] != null) out[k] = obj[k]; return out }

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
  const { q = '', lang = 'en', number = '10', day, from, to, key: keyFromQuery } = req.query
  const data = await fetchWorldNews({ ...pick({ q, lang, number, day, from, to }, ['q','lang','number','day','from','to']), apiKey: process.env.WORLDNEWS_API_KEY || keyFromQuery })
    const items = Array.isArray(data?.news) ? data.news : []

    const headers = [
      'title',
      'url',
      'hostname',
      'publish_date',
      'source',
      'category',
      'image',
    ]

    const rows = [headers]
    for (const n of items) {
      const hostname = (() => {
        try { return new URL(n.url).hostname } catch { return '' }
      })()
      const category = n.category || (data?.raw?.category ?? '')
      rows.push([
        n.title || '',
        n.url || '',
        hostname,
        n.publish_date || '',
        n.source || '',
        category || '',
        n.image || '',
      ])
    }

    const csv = toCsv(rows)
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  const ts = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)
    const fileName = `worldnews_${ts}.csv`
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)

    // Optionally also save to disk when ?save=1
    const save = (req.query?.save ?? req.query?.s) === '1'
    if (save) {
      try {
        const dir = path.join(process.cwd(), 'data')
        await fs.mkdir(dir, { recursive: true })
        await fs.writeFile(path.join(dir, fileName), csv, 'utf8')
      } catch (e) {
        // Don't fail the response due to save error; include header to indicate issue.
        res.setHeader('X-Save-Error', String(e?.message || e))
      }
    }
    return res.status(200).send(csv)
  } catch (err) {
    return res.status(500).json({ error: 'Failed to export CSV', details: String(err?.message || err) })
  }
}
