/**
 * 📝 도면 글자 → 종이 위 «줄·조각» (2026-09-26) — PDF(plotpdf.js)와 미리보기(plotview.js)가 같이 씁니다.
 *
 * 캐드 글꼴(SHX·한글 빅폰트)은 브라우저에 없어서 KCM Gothic(나눔고딕 서브셋, OFL)으로 찍습니다.
 * 캐드와 크기가 비슷하게 보이도록 한글과 영문·숫자를 «따로» 맞춥니다:
 *   · 캐드 글자 높이 h = 영문 대문자 높이 → 영문은 글꼴 크기 h/0.70 (나눔고딕 대문자 높이 700/1000)
 *   · 한글은 윗선이 영문 대문자와 맞게 → 글꼴 크기 h×1.2 (나눔 한글 윗선 782/1000)
 *     (1.08 로 했더니 「죽림1지구」 에서 숫자가 한글보다 커 보였습니다 — 2026-09-26 여수 A-201)
 *   · 폭은 줄여(영문 88% · 한글 86%) 한글 한 칸 ≈ h — 좁은 표 칸에서 글자가 넘치지 않게 합니다
 * 글자 폭은 kcmwidths.js(글꼴에서 뽑은 표)으로 잽니다 — PDF 와 미리보기가 똑같이 줄바꿈되게.
 */
import W from './kcmwidths.js'

const ADV = new Map()
for (const [adv, list] of Object.entries(W)) {
  const a = Number(adv)
  for (const r of list) {
    if (Array.isArray(r)) for (let c = r[0]; c <= r[1]; c++) ADV.set(c, a)
    else ADV.set(r, a)
  }
}
export const HAS = (c) => (c >= 0xac00 && c <= 0xd7a3) || ADV.has(c)
export const 글자비 = { wide: 1.2, wideX: 0.86, narrow: 1 / 0.7, narrowX: 0.88 }
const isWide = (c) => c >= 0x1100 && !(c >= 0x2000 && c < 0x2e80 && c !== 0x203b)
function adv(c) {
  if (c >= 0xac00 && c <= 0xd7a3) return 940
  const a = ADV.get(c)
  if (a !== undefined) return a
  return isWide(c) ? 1000 : 600
}

/** 글자를 «넓은 글자(한글)» · «좁은 글자(영문·숫자)» 조각으로 나눕니다 */
export function runsOf(s) {
  const out = []
  let cur = null
  for (const ch of s) {
    const c = ch.codePointAt(0)
    const wide = isWide(c)
    const t = HAS(c) ? ch : (wide ? '□' : '?')
    if (!cur || cur.wide !== wide) { cur = { t: '', wide, adv: 0 }; out.push(cur) }
    cur.t += t
    cur.adv += adv(t.codePointAt(0))
  }
  return out
}
/** 높이 h 로 쓴 글자의 폭(도면 단위, 폭 비율 wf 전) */
export function measure(s, h) {
  let w = 0
  for (const r of runsOf(s)) w += (r.adv / 1000) * h * (r.wide ? 글자비.wide * 글자비.wideX : 글자비.narrow * 글자비.narrowX)
  return w
}

function wrap(line, h, wf, width) {
  if (!(width > 0) || measure(line, h) * wf <= width * 1.02) return [line]
  const out = []
  let cur = '', lastSp = -1
  for (const ch of line) {
    const next = cur + ch
    if (measure(next, h) * wf > width * 1.02 && cur) {
      if (lastSp > 0 && ch !== ' ') { out.push(cur.slice(0, lastSp)); cur = cur.slice(lastSp + 1) + ch }
      else { out.push(cur); cur = ch === ' ' ? '' : ch }
      lastSp = cur.lastIndexOf(' ')
      continue
    }
    cur = next
    if (ch === ' ') lastSp = cur.length - 1
  }
  if (cur) out.push(cur)
  return out
}

/**
 * 글자 하나(TEXT·ATTRIB·MTEXT) → 줄 목록
 * 줄: { x, y: 기준선 시작점(도면 좌표), ux, uy: 글자 방향, vx, vy: 위 방향, runs: [{t, dx, fs, hs}], ob }
 *   dx: 줄 시작에서 조각까지 거리(도면 단위) · fs: 글꼴 크기(도면 단위) · hs: 가로 배율(폭 비율 포함)
 */
export function layoutText(t) {
  let ux = Math.cos(t.a), uy = Math.sin(t.a)
  let vx = -uy, vy = ux
  if (t.mir) { ux = -ux; uy = -uy }
  if (t.ud) { vx = -vx; vy = -vy }
  const lines = []
  const mk = (s, h, wf, bx, by) => {
    let dx = 0
    const runs = []
    for (const r of runsOf(s)) {
      const fs = h * (r.wide ? 글자비.wide : 글자비.narrow)
      const hs = (r.wide ? 글자비.wideX : 글자비.narrowX) * wf
      runs.push({ t: r.t, dx, fs, hs })
      dx += (r.adv / 1000) * fs * hs
    }
    return { x: bx, y: by, ux, uy, vx, vy, runs, ob: t.ob || 0, w: dx }
  }
  if (!t.mt) {
    let h = t.h, wf = t.wf || 1
    const w0 = measure(t.s, h) * wf
    let x = t.x, y = t.y
    if ((t.hj === 3 || t.hj === 5) && t.x2 !== undefined) {
      const d = Math.hypot(t.x2 - t.x, t.y2 - t.y)
      if (d > 0 && w0 > 0) { if (t.hj === 3) h *= d / w0; else wf *= d / w0 }
    } else {
      const w = w0
      const f = t.hj === 1 || t.hj === 4 ? 0.5 : t.hj === 2 ? 1 : 0
      x -= ux * w * f; y -= uy * w * f
      const vo = t.hj === 4 ? -h / 2 : t.vj === 1 ? h * 0.22 : t.vj === 2 ? -h / 2 : t.vj === 3 ? -h : 0
      x += vx * vo; y += vy * vo
    }
    lines.push(mk(t.s, h, wf, x, y))
    return lines
  }
  /* MTEXT */
  const h = t.h, wf = t.wf || 1
  const all = []
  for (const L of t.lines) for (const w of wrap(L, h, wf, t.w)) all.push(w)
  while (all.length && !all[all.length - 1].trim()) all.pop()
  if (!all.length) return lines
  const pitch = h * 1.667 * (t.ls || 1)
  const n = all.length
  const col = (t.at - 1) % 3, row = Math.floor((t.at - 1) / 3)
  const total = h + (n - 1) * pitch
  const top = row === 0 ? 0 : row === 1 ? total / 2 : total
  for (let i = 0; i < n; i++) {
    const L = mk(all[i], h, wf, 0, 0)
    const off = top - h - i * pitch                       // 위 방향(+v) 으로 얼마나
    const f = col === 1 ? 0.5 : col === 2 ? 1 : 0
    L.x = t.x + vx * off - ux * L.w * f
    L.y = t.y + vy * off - uy * L.w * f
    lines.push(L)
  }
  return lines
}
