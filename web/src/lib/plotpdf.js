/**
 * 📄 평면 그림(dxfplot.js) → PDF (2026-09-26)
 *
 * ■ 선은 PDF 의 선 그대로(벡터) — 확대해도 깨지지 않습니다. 글자도 글자 그대로(검색·복사 됨).
 * ■ 글꼴 KCM Gothic(나눔고딕 서브셋, OFL)을 «쓴 글자만» 넣습니다(pdf-lib 서브셋) — 한 장에 수십 KB.
 * ■ 좌표는 PDF 에 넣기 «전에» 종이 좌표(pt)로 옮깁니다. TM 좌표(수백만 mm)를 PDF 에 그대로 넣으면
 *   보는 프로그램에 따라 float32 로 떨어져 선이 떨립니다.
 * ■ 그리는 차례: 채움 → 선 → 글자. XCLIP 은 PDF 자르기 경로(W n)로 그대로 자릅니다.
 */
import { PDFDocument, PDFName } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { penMm, penRgb, dashOf, pageGeom, pick, cullOf } from './plotstyle.js'
import { layoutText } from './textlayout.js'
import { slimFont } from './ttfslim.js'

const f2 = (v) => { const r = Math.round(v * 100) / 100; return r === 0 ? '0' : String(r) }
const c3 = (v) => (Math.round((v / 255) * 1000) / 1000).toString()

/**
 * 한 장의 PDF 명령(내용 흐름)을 만듭니다.
 * @param enc 글자 → '<…>' (PDF 글꼴 부호) · null 이면 글자를 안 넣음
 */
export function pageOps(model, G, opt, enc, cache, groups0) {
  const s = G.s, X = (x) => f2((x - G.x0) * s + G.ox), Y = (y) => f2((y - G.y0) * s + G.oy)
  const groups = groups0 || pick(model, cullOf(G))
  const out = ['1 J 1 j', `${f2(G.clip[0])} ${f2(G.clip[1])} ${f2(G.clip[2] - G.clip[0])} ${f2(G.clip[3] - G.clip[1])} re W n`]
  const P = model.paths, F = model.fills, ST = model.styles
  const pt = 72 / 25.4
  const order = [...groups.keys()].sort((a, b) => a - b)
  let nPath = 0, nText = 0
  for (const cid of order) {
    const g = groups.get(cid)
    if (cid > 0) {
      const poly = model.clips[cid]
      if (!poly || poly.length < 3) continue
      out.push('q')
      out.push(poly.map((q, k) => `${X(q[0])} ${Y(q[1])} ${k ? 'l' : 'm'}`).join(' ') + ' h W n')
    }
    /* 채움 */
    g.fills.sort((a, b) => F.sty[a] - F.sty[b])
    let cur = -1
    for (const i of g.fills) {
      const sid = F.sty[i]
      if (sid !== cur) { const c = penRgb(ST[sid], opt); out.push(`${c3(c[0])} ${c3(c[1])} ${c3(c[2])} rg`); cur = sid }
      const seg = []
      for (let l = F.l0[i]; l < F.l0[i] + F.nl[i]; l++) {
        const st = F.lst[l] * 2, n = F.ln[l]
        for (let k = 0; k < n; k++) seg.push(`${X(F.xy[st + k * 2])} ${Y(F.xy[st + k * 2 + 1])} ${k ? 'l' : 'm'}`)
        seg.push('h')
      }
      seg.push('f*')
      out.push(seg.join(' '))
    }
    /* 선 */
    g.paths.sort((a, b) => P.sty[a] - P.sty[b])
    cur = -1
    for (const i of g.paths) {
      const sid = P.sty[i]
      if (sid !== cur) {
        const st = ST[sid]
        const c = penRgb(st, opt)
        const d = dashOf(model, st, s)
        out.push(`${c3(c[0])} ${c3(c[1])} ${c3(c[2])} RG ${f2(penMm(st, opt) * pt)} w ${d ? '[' + d.arr.map(f2).join(' ') + '] 0 d' : '[] 0 d'}`)
        cur = sid
      }
      const st = P.st[i] * 2, n = P.n[i]
      const seg = new Array(n + 1)
      for (let k = 0; k < n; k++) seg[k] = `${X(P.xy[st + k * 2])} ${Y(P.xy[st + k * 2 + 1])} ${k ? 'l' : 'm'}`
      seg[n] = P.closed[i] ? 's' : 'S'
      out.push(seg.join(' '))
      nPath++
    }
    /* 글자 */
    if (enc && g.texts.length && opt.text !== false) {
      out.push('BT /KCM 1 Tf')
      cur = -1
      for (const i of g.texts) {
        const t = model.texts[i]
        let lines = cache[i]
        if (!lines) lines = cache[i] = layoutText(t)
        if (t.sty !== cur) { const c = penRgb(ST[t.sty], opt); out.push(`${c3(c[0])} ${c3(c[1])} ${c3(c[2])} rg`); cur = t.sty }
        for (const L of lines) {
          const tob = Math.tan(L.ob || 0)
          for (const r of L.runs) {
            const fs = r.fs * s
            if (fs < 0.25) continue
            const px = L.x + L.ux * r.dx, py = L.y + L.uy * r.dx
            const a = L.ux * fs * r.hs, b = L.uy * fs * r.hs
            const c = (L.vx + tob * L.ux) * fs, d = (L.vy + tob * L.uy) * fs
            const txt = r.t.replace(/\s+$/, '')
            if (!txt) continue
            out.push(`${f2(a)} ${f2(b)} ${f2(c)} ${f2(d)} ${X(px)} ${Y(py)} Tm ${enc(txt)} Tj`)
            nText++
          }
        }
      }
      out.push('ET')
    }
    if (cid > 0) out.push('Q')
  }
  return { ops: out.join('\n'), nPath, nText }
}

/**
 * @param pages [{r:[x0,y0,x1,y1], paper:[w_mm,h_mm], name}]
 * @param opt {color:'mono'|'color', lw:'ctb'|'thin'|'object', text:true, margin}
 */
export async function buildPdf(model, pages, opt, fontBytes, onProgress, title = '도면') {
  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)
  doc.setTitle(title)
  doc.setProducer('K-건설맵 도면 PDF · k-conmap.com')
  doc.setCreator('K-건설맵 (브라우저 안에서 만듦 — 도면은 어디에도 올라가지 않았습니다)')
  const cache = new Array(model.texts.length)
  /* ① 장마다 들어갈 것을 먼저 고르고, 쓰는 글자를 모읍니다 */
  const Gs = pages.map((pg) => pageGeom(pg.r, pg.paper, opt.margin ?? 5))
  const picks = Gs.map((G) => pick(model, cullOf(G)))
  const chars = new Set()
  if (opt.text !== false) {
    for (const groups of picks) for (const g of groups.values()) for (const i of g.texts) {
      const lines = cache[i] || (cache[i] = layoutText(model.texts[i]))
      for (const L of lines) for (const r of L.runs) for (const ch of r.t) chars.add(ch.codePointAt(0))
    }
  }
  /* ② 쓴 글자만 남긴 글꼴 (ttfslim.js 머리말 — pdf-lib 서브셋은 한글을 빠뜨립니다) */
  const fk = fontkit.create(fontBytes)
  const gids = [...chars].map((c) => fk.glyphForCodePoint(c).id)
  const font = await doc.embedFont(slimFont(fontBytes, gids), { subset: false })
  const enc = (s) => font.encodeText(s).toString()
  let nPath = 0, nText = 0
  for (let pi = 0; pi < pages.length; pi++) {
    const G = Gs[pi]
    const page = doc.addPage([G.W, G.H])
    page.node.setFontDictionary(PDFName.of('KCM'), font.ref)
    const r = pageOps(model, G, opt, enc, cache, picks[pi])
    picks[pi] = null
    nPath += r.nPath; nText += r.nText
    const stream = doc.context.flateStream(r.ops)
    page.node.addContentStream(doc.context.register(stream))
    if (onProgress) onProgress((pi + 1) / pages.length)
    await new Promise((res) => setTimeout(res, 0))
  }
  const bytes = await doc.save({ useObjectStreams: true })
  return { bytes, nPath, nText, glyphs: gids.length }
}
