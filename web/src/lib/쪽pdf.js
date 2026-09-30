/**
 * 📄 쪽 모형 → PDF (2026-09-30, 사진대지 · 영수증 정리) — 쪽문서.js 머리말
 *   글은 «진짜 글자»(KCM Gothic · 쓴 글자만 남겨 넣음 — ttfslim.js) — 찾기 · 복사가 되고 파일이 작습니다.
 *   사진은 미리 줄여 둔 JPEG 를 그대로 붙입니다(다시 압축하지 않음).
 */
import { 글맞춤, 그림맞춤 } from './쪽문서.js'

export const 환경 = { 글꼴: null }        // node 시험: KCMGothic.ttf 바이트

let _글꼴 = null
async function 글꼴바이트() {
  if (환경.글꼴) return 환경.글꼴
  if (!_글꼴) {
    _글꼴 = fetch('/fonts/KCMGothic.ttf').then((r) => {
      if (!r.ok) throw new Error('글꼴을 못 받았습니다 — 인터넷 연결을 보십시오')
      return r.arrayBuffer()
    }).then((b) => new Uint8Array(b)).catch((e) => { _글꼴 = null; throw e })
  }
  return _글꼴
}

const pt = (mm) => (mm * 72) / 25.4
function 색(hex, rgb) {
  const n = parseInt(String(hex || '#000000').slice(1), 16) || 0
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}

/**
 * @param 쪽들 [{ 폭, 높이, 칸들 }]
 * @param 그림들 Map(열쇠 → { 바이트: JPEG Uint8Array, w, h })
 */
export async function 쪽들PDF(쪽들, 그림들, { 제목 = '' } = {}, 진도) {
  const P = await import('pdf-lib')
  const { PDFDocument, rgb } = P
  const fontkit = (await import('@pdf-lib/fontkit')).default
  const { slimFont } = await import('./ttfslim.js')
  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)
  if (제목) doc.setTitle(제목)
  doc.setProducer('K-건설맵 · k-conmap.com')
  doc.setCreator('K-건설맵 사진대지 · 영수증 정리 (브라우저 안에서 만듦 — 사진은 어디에도 올라가지 않았습니다)')

  /* ① 글 맞춤을 먼저 — 쓰는 글자를 모아 그 글자만 넣은 글꼴 */
  const 맞춤들 = 쪽들.map((쪽) => 쪽.칸들.map((k) => (k.글 ? 글맞춤(k.글, k.w, k.h, k.크기 || 9, !!k.굵게) : null)))
  const 글자들 = new Set([0x2026, 0x20])
  for (const m of 맞춤들) for (const x of m) if (x) for (const 줄 of x.줄들) for (const ch of 줄) 글자들.add(ch.codePointAt(0))
  const fb = await 글꼴바이트()
  const fk = fontkit.create(fb)
  const gids = [...글자들].map((c) => fk.glyphForCodePoint(c).id)
  const font = await doc.embedFont(slimFont(fb, gids), { subset: false })

  const 붙인 = new Map()
  for (let pi = 0; pi < 쪽들.length; pi++) {
    const 쪽 = 쪽들[pi]
    const W = pt(쪽.폭), H = pt(쪽.높이)
    const page = doc.addPage([W, H])
    /* 바탕 → 그림 → 글 → 선 차례 */
    for (const k of 쪽.칸들) {
      if (!k.바탕) continue
      page.drawRectangle({ x: pt(k.x), y: H - pt(k.y + k.h), width: pt(k.w), height: pt(k.h), color: 색(k.바탕, rgb) })
    }
    for (const k of 쪽.칸들) {
      if (!k.그림) continue
      const g = 그림들.get(k.그림)
      if (!g) continue
      let img = 붙인.get(k.그림)
      if (!img) {
        img = await doc.embedJpg(g.바이트)
        붙인.set(k.그림, img)
      }
      const s = 그림맞춤(g.w, g.h, k.w, k.h, k.그림여백 ?? 1.2)
      page.drawImage(img, {
        x: pt(k.x + (k.w - s.w) / 2), y: H - pt(k.y + (k.h + s.h) / 2),
        width: pt(s.w), height: pt(s.h),
      })
    }
    쪽.칸들.forEach((k, i) => {
      const m = 맞춤들[pi][i]
      if (!m || !m.줄들.length) return
      const 크기 = m.크기
      const 줄높 = 크기 * 1.22
      const 위 = H - pt(k.y) - (pt(k.h) - 줄높 * m.줄들.length) / 2
      const c = 색(k.색 || '#111111', rgb)
      if (k.굵게) {
        page.pushOperators(P.setTextRenderingMode(P.TextRenderingMode.FillAndOutline),
          P.setLineWidth(크기 * 0.035), P.setStrokingColor(c))
      }
      m.줄들.forEach((줄, j) => {
        if (!줄) return
        const 폭 = font.widthOfTextAtSize(줄, 크기)
        const 여 = pt(0.8)
        const x = k.정렬 === '왼' ? pt(k.x) + 여
          : k.정렬 === '오' ? pt(k.x + k.w) - 여 - 폭
            : pt(k.x) + (pt(k.w) - 폭) / 2
        const 가운데 = 위 - (j + 0.5) * 줄높
        page.drawText(줄, { x, y: 가운데 - 크기 * 0.34, size: 크기, font, color: c })
      })
      if (k.굵게) page.pushOperators(P.setTextRenderingMode(P.TextRenderingMode.Fill))
    })
    for (const k of 쪽.칸들) {
      if (!k.테) continue
      page.drawRectangle({
        x: pt(k.x), y: H - pt(k.y + k.h), width: pt(k.w), height: pt(k.h),
        borderColor: 색(k.선색 || '#333333', rgb), borderWidth: k.굵은테 ? 1.1 : 0.5,
      })
    }
    if (진도) await 진도(pi + 1, 쪽들.length)
  }
  return await doc.save()
}
