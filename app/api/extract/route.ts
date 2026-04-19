import { NextRequest, NextResponse } from 'next/server'
import { parse as parseHtml } from 'node-html-parser'
import { anthropic, EXTRACTION_MODEL, EXTRACTION_SYSTEM_PROMPT } from '@/lib/anthropic'
import type { ExtractedOpportunity } from '@/lib/types'

// POST /api/extract
// Body: { url: string }
// Returns: ExtractedOpportunity (for human review before saving)

export async function POST(req: NextRequest) {
  const { url } = await req.json() as { url?: string }

  if (!url || !/^https?:\/\//.test(url)) {
    return NextResponse.json({ error: 'A valid URL is required.' }, { status: 400 })
  }

  // ── 1. Fetch the page ──────────────────────────────────────────────────────
  let rawHtml: string
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      // 10-second timeout so we don't hang a Vercel function
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `Could not fetch URL (HTTP ${res.status}).` },
        { status: 422 }
      )
    }
    rawHtml = await res.text()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Fetch failed: ${msg}` }, { status: 422 })
  }

  // ── 2. Strip HTML → plain text ────────────────────────────────────────────
  // node-html-parser is lightweight and runs server-side without a DOM.
  const root = parseHtml(rawHtml)
  // Remove script/style/nav/footer noise before extracting text
  root.querySelectorAll('script, style, nav, footer, header').forEach((el) => el.remove())
  const pageText = root.structuredText.slice(0, 8_000) // stay within token budget

  // ── 3. Ask Claude to extract structured data ──────────────────────────────
  const today = new Date().toISOString().split('T')[0]
  const systemPrompt = EXTRACTION_SYSTEM_PROMPT.replace('{TODAY}', today)

  let extracted: ExtractedOpportunity
  try {
    const message = await anthropic.messages.create({
      model: EXTRACTION_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Extract consulting opportunity details from this job posting text:\n\n${pageText}`,
        },
      ],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    extracted = JSON.parse(raw) as ExtractedOpportunity
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { error: `AI extraction failed: ${msg}` },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: extracted, source_url: url })
}
