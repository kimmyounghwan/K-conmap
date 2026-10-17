/**
 * 🖼 장면(컬러평면장면.js) 그리기 — 캔버스(화면 · PNG) · PDF (2026-10-17)
 *   같은 도형 목록을 같은 셈으로 그려서 화면 · PNG · PDF 가 같은 모양.
 *   글 기준선: 가운데 = y + 크기mm × 0.34 · 위 = y + 0.8 · 아래 = y − 0.12 (lib/쪽그림 과 같은 버릇)
 *   PDF 글은 «진짜 글자»(KCM Gothic — 쓴 글자만 넣음 · ttfslim.js) · 선 · 면은 벡터(확대해도 안 깨짐).
 */
const PT = 0.3528
export const 글꼴이름 = 'KCMGothic'
export const 기준선 = (기준, 크mm) => (기준 === '위' ? 크mm * 0.8 : 기준 === '아래' ? -크mm * 0.12 : 크mm * 0.34)

/* ───────────────────────────── 캔버스 */

function 둥근네모(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2))
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.closePath()
}

/** @param 배 px / mm · 글꼴: 캔버스 글꼴 이름 */
export function 장면캔버스(ctx, 장면, 배, 글꼴 = 글꼴이름) {
  ctx.save()
  ctx.scale(배, 배)
  ctx.lineJoin = 'round'
  for (const g of 장면.그림들) {
    if (g.t === '면') {
      ctx.beginPath()
      for (const r of g.고리들) { if (r.length < 2) continue; ctx.moveTo(r[0][0], r[0][1]); for (let i = 1; i < r.length; i++) ctx.lineTo(r[i][0], r[i][1]); ctx.closePath() }
      if (g.채움) { ctx.fillStyle = g.채움; ctx.fill('evenodd') }
      if (g.선) { ctx.strokeStyle = g.선; ctx.lineWidth = g.굵기 || 0.2; ctx.setLineDash([]); ctx.stroke() }
    } else if (g.t === '선') {
      if (!g.점들 || g.점들.length < 2) continue
      ctx.beginPath()
      ctx.moveTo(g.점들[0][0], g.점들[0][1])
      for (let i = 1; i < g.점들.length; i++) ctx.lineTo(g.점들[i][0], g.점들[i][1])
      if (g.닫힘) ctx.closePath()
      ctx.strokeStyle = g.색 || '#000'
      ctx.lineWidth = Math.max(g.굵기 || 0.1, 0.35 / 배)
      ctx.lineCap = g.끝 === '둥' ? 'round' : 'butt'
      ctx.setLineDash(g.점선 || [])
      ctx.stroke()
    } else if (g.t === '원') {
      ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2)
      if (g.채움) { ctx.fillStyle = g.채움; ctx.fill() }
      if (g.색) { ctx.strokeStyle = g.색; ctx.lineWidth = g.굵기 || 0.2; ctx.setLineDash([]); ctx.stroke() }
    } else if (g.t === '네모') {
      ctx.beginPath()
      if (g.둥) 둥근네모(ctx, g.x, g.y, g.w, g.h, g.둥); else ctx.rect(g.x, g.y, g.w, g.h)
      if (g.채움) { ctx.fillStyle = g.채움; ctx.fill() }
      if (g.색) { ctx.strokeStyle = g.색; ctx.lineWidth = g.굵기 || 0.2; ctx.setLineDash([]); ctx.stroke() }
    } else if (g.t === '글') {
      const 크mm = g.크기 * PT
      ctx.font = `${g.굵게 ? '700 ' : ''}${크mm}px ${글꼴}, sans-serif`
      ctx.textAlign = g.정렬 === '왼' ? 'left' : g.정렬 === '오' ? 'right' : 'center'
      ctx.textBaseline = 'alphabetic'
      ctx.fillStyle = g.색 || '#111'
      ctx.fillText(g.글, g.x, g.y + 기준선(g.기준, 크mm))
    }
  }
  ctx.restore()
}

/** PNG (브라우저) — dpi 에 맞춰 · 한 변 16000 px 까지 */
export async function 장면PNG(장면, dpi = 200) {
  const { loadFont } = await import('./plotview.js')
  await loadFont().catch(() => {})
  let 배 = dpi / 25.4
  const 최대 = 16000
  if (장면.폭 * 배 > 최대 || 장면.높이 * 배 > 최대) 배 = 최대 / Math.max(장면.폭, 장면.높이)
  /* iOS 등 캔버스 넓이 한도(약 1,670만 px) */
  while (장면.폭 * 배 * 장면.높이 * 배 > 16.7e6) 배 *= 0.9
  const W = Math.round(장면.폭 * 배), H = Math.round(장면.높이 * 배)
  const cv = document.createElement('canvas')
  cv.width = W; cv.height = H
  const ctx = cv.getContext('2d')
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H)
  장면캔버스(ctx, 장면, 배)
  const blob = await new Promise((r) => cv.toBlob(r, 'image/png'))
  return { blob, W, H, dpi: Math.round(배 * 25.4) }
}

/* ───────────────────────────── PDF */

export const PDF환경 = { 글꼴: null }        // node 시험: KCMGothic.ttf 바이트
let _글꼴 = null
async function 글꼴바이트() {
  if (PDF환경.글꼴) return PDF환경.글꼴
  if (!_글꼴) {
    _글꼴 = fetch('/fonts/KCMGothic.ttf').then((r) => { if (!r.ok) throw new Error('글꼴을 못 받았습니다 — 인터넷 연결을 보십시오'); return r.arrayBuffer() })
      .then((b) => new Uint8Array(b)).catch((e) => { _글꼴 = null; throw e })
  }
  return _글꼴
}
const f2 = (v) => { const r = Math.round(v * 100) / 100; return Object.is(r, -0) || r === 0 ? '0' : String(r) }
const 색값 = (hex) => { const n = parseInt(String(hex || '#000000').slice(1), 16) || 0; return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => f2(v / 255)).join(' ') }
const K = 0.5522847498

/**
 * @param 장면들 [장면] · @returns Uint8Array
 */
export async function 장면들PDF(장면들, { 제목 = '', 만든곳 = 'K-건설맵' } = {}) {
  const { PDFDocument, PDFName } = await import('pdf-lib')
  const fontkit = (await import('@pdf-lib/fontkit')).default
  const { slimFont } = await import('./ttfslim.js')
  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)
  if (제목) doc.setTitle(제목)
  doc.setProducer('K-건설맵 · k-conmap.com')
  doc.setCreator(만든곳 + ' (브라우저 안에서 만듦 — 도면은 어디에도 올라가지 않았습니다)')
  const 글자들 = new Set([0x20])
  for (const 장 of 장면들) for (const g of 장.그림들) if (g.t === '글') for (const ch of String(g.글)) 글자들.add(ch.codePointAt(0))
  const fb = await 글꼴바이트()
  const fk = fontkit.create(fb)
  const gids = [...글자들].map((c) => fk.glyphForCodePoint(c).id)
  const font = await doc.embedFont(slimFont(fb, gids), { subset: false })
  for (const 장 of 장면들) {
    const Wpt = (장.폭 * 72) / 25.4, Hpt = (장.높이 * 72) / 25.4
    const page = doc.addPage([Wpt, Hpt])
    page.node.setFontDictionary(PDFName.of('KCM'), font.ref)
    const X = (x) => f2((x * 72) / 25.4), Y = (y) => f2(Hpt - (y * 72) / 25.4), W = (w) => f2((w * 72) / 25.4)
    const ops = ['1 j']
    const 원길 = (cx, cy, r) => {
      const k = r * K
      return [`${X(cx + r)} ${Y(cy)} m`, `${X(cx + r)} ${Y(cy + k)} ${X(cx + k)} ${Y(cy + r)} ${X(cx)} ${Y(cy + r)} c`, `${X(cx - k)} ${Y(cy + r)} ${X(cx - r)} ${Y(cy + k)} ${X(cx - r)} ${Y(cy)} c`,
        `${X(cx - r)} ${Y(cy - k)} ${X(cx - k)} ${Y(cy - r)} ${X(cx)} ${Y(cy - r)} c`, `${X(cx + k)} ${Y(cy - r)} ${X(cx + r)} ${Y(cy - k)} ${X(cx + r)} ${Y(cy)} c`, 'h'].join(' ')
    }
    const 네모길 = (x, y, w, h, r) => {
      if (!r) return `${X(x)} ${Y(y + h)} ${W(w)} ${W(h)} re`
      r = Math.min(r, w / 2, h / 2); const k = r * (1 - K)
      return [`${X(x + r)} ${Y(y)} m`, `${X(x + w - r)} ${Y(y)} l`, `${X(x + w - k)} ${Y(y)} ${X(x + w)} ${Y(y + k)} ${X(x + w)} ${Y(y + r)} c`,
        `${X(x + w)} ${Y(y + h - r)} l`, `${X(x + w)} ${Y(y + h - k)} ${X(x + w - k)} ${Y(y + h)} ${X(x + w - r)} ${Y(y + h)} c`,
        `${X(x + r)} ${Y(y + h)} l`, `${X(x + k)} ${Y(y + h)} ${X(x)} ${Y(y + h - k)} ${X(x)} ${Y(y + h - r)} c`,
        `${X(x)} ${Y(y + r)} l`, `${X(x)} ${Y(y + k)} ${X(x + k)} ${Y(y)} ${X(x + r)} ${Y(y)} c`, 'h'].join(' ')
    }
    for (const g of 장.그림들) {
      if (g.t === '면') {
        const 길 = []
        for (const r of g.고리들) { if (r.length < 2) continue; 길.push(`${X(r[0][0])} ${Y(r[0][1])} m`); for (let i = 1; i < r.length; i++) 길.push(`${X(r[i][0])} ${Y(r[i][1])} l`); 길.push('h') }
        if (!길.length) continue
        ops.push('q', g.채움 ? 색값(g.채움) + ' rg' : '', g.선 ? `${색값(g.선)} RG ${W(g.굵기 || 0.2)} w` : '', 길.join(' '), g.채움 && g.선 ? 'B*' : g.채움 ? 'f*' : 'S', 'Q')
      } else if (g.t === '선') {
        if (!g.점들 || g.점들.length < 2) continue
        const 길 = [`${X(g.점들[0][0])} ${Y(g.점들[0][1])} m`]
        for (let i = 1; i < g.점들.length; i++) 길.push(`${X(g.점들[i][0])} ${Y(g.점들[i][1])} l`)
        ops.push('q', `${색값(g.색)} RG ${W(g.굵기 || 0.1)} w ${g.끝 === '둥' ? 1 : 0} J`, g.점선 ? `[${g.점선.map(W).join(' ')}] 0 d` : '', 길.join(' '), g.닫힘 ? 's' : 'S', 'Q')
      } else if (g.t === '원') {
        ops.push('q', g.채움 ? 색값(g.채움) + ' rg' : '', g.색 ? `${색값(g.색)} RG ${W(g.굵기 || 0.2)} w` : '', 원길(g.x, g.y, g.r), g.채움 && g.색 ? 'B' : g.채움 ? 'f' : 'S', 'Q')
      } else if (g.t === '네모') {
        if (!g.채움 && !g.색) continue
        ops.push('q', g.채움 ? 색값(g.채움) + ' rg' : '', g.색 ? `${색값(g.색)} RG ${W(g.굵기 || 0.2)} w` : '', 네모길(g.x, g.y, g.w, g.h, g.둥 || 0), g.채움 && g.색 ? 'B' : g.채움 ? 'f' : 'S', 'Q')
      } else if (g.t === '글') {
        const s = String(g.글)
        if (!s) continue
        const 크pt = g.크기
        const 폭pt = font.widthOfTextAtSize(s, 크pt)
        const xpt = (g.x * 72) / 25.4 - (g.정렬 === '오' ? 폭pt : g.정렬 === '왼' ? 0 : 폭pt / 2)
        const ypt = Hpt - ((g.y + 기준선(g.기준, 크pt * PT)) * 72) / 25.4
        const 굵 = g.굵게 ? `2 Tr ${f2(크pt * 0.035)} w ${색값(g.색)} RG ` : ''
        ops.push('q', `${색값(g.색 || '#111111')} rg`, `BT /KCM ${f2(크pt)} Tf ${굵}1 0 0 1 ${f2(xpt)} ${f2(ypt)} Tm ${font.encodeText(s).toString()} Tj ET`, 'Q')
      }
    }
    const stream = doc.context.flateStream(ops.filter(Boolean).join('\n'))
    page.node.addContentStream(doc.context.register(stream))
    await new Promise((r) => setTimeout(r, 0))
  }
  return await doc.save({ useObjectStreams: true })
}
