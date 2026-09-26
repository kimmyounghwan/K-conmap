/**
 * 🖼 미리보기 — PDF 와 «같은 펜·같은 글자 배치» 로 캔버스에 그립니다 (2026-09-26)
 * plotpdf.js 의 pageOps 와 짝입니다. 굵기·색·점선·글자 자리는 plotstyle.js · textlayout.js 한 곳에서 옵니다.
 */
import { penMm, penRgb, dashOf, pageGeom, pick, cullOf } from './plotstyle.js'
import { layoutText } from './textlayout.js'

export const FONT = 'KCMGothic'
let fontReady = null
/** 미리보기용 글꼴 — PDF 에 넣는 것과 같은 파일 */
export function loadFont() {
  if (fontReady) return fontReady
  fontReady = (async () => {
    try {
      const f = new FontFace(FONT, 'url(/fonts/KCMGothic.ttf)')
      await f.load()
      document.fonts.add(f)
      return true
    } catch (e) { return false }
  })()
  return fontReady
}

/**
 * @param canvas  그릴 캔버스(크기는 여기서 맞춤)
 * @param cssW    화면 폭(px)
 * @returns {{G, k}} 종이 자리와 pt→px 배율 (마우스 좌표를 도면 좌표로 바꿀 때 씀)
 */
export function drawPage(canvas, model, page, opt, cssW, cache) {
  const G = pageGeom(page.r, page.paper, opt.margin ?? 5)
  const dpr = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1)
  const k = cssW / G.W
  canvas.style.width = cssW + 'px'
  canvas.style.height = Math.round(G.H * k) + 'px'
  canvas.width = Math.round(cssW * dpr)
  canvas.height = Math.round(G.H * k * dpr)
  const ctx = canvas.getContext('2d')
  const K = k * dpr
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  const s = G.s
  const X = (x) => ((x - G.x0) * s + G.ox) * K
  const Y = (y) => (G.H - ((y - G.y0) * s + G.oy)) * K
  ctx.save()
  ctx.beginPath()
  ctx.rect(G.clip[0] * K, (G.H - G.clip[3]) * K, (G.clip[2] - G.clip[0]) * K, (G.clip[3] - G.clip[1]) * K)
  ctx.clip()
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  const groups = pick(model, cullOf(G))
  const P = model.paths, F = model.fills, ST = model.styles
  const pt = 72 / 25.4
  const col = (c) => `rgb(${c[0]},${c[1]},${c[2]})`
  for (const cid of [...groups.keys()].sort((a, b) => a - b)) {
    const g = groups.get(cid)
    if (cid > 0) {
      const poly = model.clips[cid]
      if (!poly || poly.length < 3) continue
      ctx.save()
      ctx.beginPath()
      poly.forEach((q, i) => (i ? ctx.lineTo(X(q[0]), Y(q[1])) : ctx.moveTo(X(q[0]), Y(q[1]))))
      ctx.closePath()
      ctx.clip()
    }
    for (const i of g.fills) {
      ctx.fillStyle = col(penRgb(ST[F.sty[i]], opt))
      ctx.beginPath()
      for (let l = F.l0[i]; l < F.l0[i] + F.nl[i]; l++) {
        const st = F.lst[l] * 2, n = F.ln[l]
        for (let q = 0; q < n; q++) { const x = X(F.xy[st + q * 2]), y = Y(F.xy[st + q * 2 + 1]); if (q) ctx.lineTo(x, y); else ctx.moveTo(x, y) }
        ctx.closePath()
      }
      ctx.fill('evenodd')
    }
    g.paths.sort((a, b) => P.sty[a] - P.sty[b])
    let cur = -1
    for (const i of g.paths) {
      const sid = P.sty[i]
      if (sid !== cur) {
        if (cur >= 0) ctx.stroke()
        const st = ST[sid]
        ctx.strokeStyle = col(penRgb(st, opt))
        ctx.lineWidth = Math.max(0.6, penMm(st, opt) * pt * K)
        const d = dashOf(model, st, s)
        ctx.setLineDash(d ? d.arr.map((v) => v * K) : [])
        ctx.beginPath()
        cur = sid
      }
      const st = P.st[i] * 2, n = P.n[i]
      ctx.moveTo(X(P.xy[st]), Y(P.xy[st + 1]))
      for (let q = 1; q < n; q++) ctx.lineTo(X(P.xy[st + q * 2]), Y(P.xy[st + q * 2 + 1]))
      if (P.closed[i]) ctx.closePath()
    }
    if (cur >= 0) ctx.stroke()
    ctx.setLineDash([])
    if (opt.text !== false) {
      ctx.font = `100px ${FONT}, sans-serif`
      ctx.textBaseline = 'alphabetic'
      for (const i of g.texts) {
        const t = model.texts[i]
        const lines = cache[i] || (cache[i] = layoutText(t))
        ctx.fillStyle = col(penRgb(ST[t.sty], opt))
        for (const L of lines) {
          const tob = Math.tan(L.ob || 0)
          for (const r of L.runs) {
            const fs = r.fs * s
            if (fs * K < 1.2) continue                     // 1px 보다 작은 글자는 미리보기에서 생략(PDF 에는 들어감)
            const px = L.x + L.ux * r.dx, py = L.y + L.uy * r.dx
            const a = L.ux * fs * r.hs, b = L.uy * fs * r.hs
            const c = (L.vx + tob * L.ux) * fs, d = (L.vy + tob * L.uy) * fs
            ctx.save()
            ctx.setTransform((K * a) / 100, (-K * b) / 100, (-K * c) / 100, (K * d) / 100, X(px), Y(py))
            ctx.fillText(r.t, 0, 0)
            ctx.restore()
          }
        }
      }
    }
    if (cid > 0) ctx.restore()
  }
  ctx.restore()
  return { G, k }
}

/** 작은 그림(도곽 고르기용) — 글자·점선 없이 빠르게 */
export function drawThumb(canvas, model, r, w) {
  const rw = r[2] - r[0], rh = r[3] - r[1]
  const h = Math.max(20, Math.round((w * rh) / rw))
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h)
  const s = w / rw
  const X = (x) => (x - r[0]) * s, Y = (y) => h - (y - r[1]) * s
  const P = model.paths
  ctx.strokeStyle = '#223'; ctx.lineWidth = 0.5
  ctx.beginPath()
  const minLen = rw / w * 1.5
  for (let i = 0; i < P.st.length; i++) {
    const b = P.box
    if (b[i * 4] > r[2] || b[i * 4 + 2] < r[0] || b[i * 4 + 1] > r[3] || b[i * 4 + 3] < r[1]) continue
    if (b[i * 4 + 2] - b[i * 4] < minLen && b[i * 4 + 3] - b[i * 4 + 1] < minLen) continue
    const st = P.st[i] * 2, n = P.n[i]
    ctx.moveTo(X(P.xy[st]), Y(P.xy[st + 1]))
    for (let q = 1; q < n; q++) ctx.lineTo(X(P.xy[st + q * 2]), Y(P.xy[st + q * 2 + 1]))
  }
  ctx.stroke()
}
