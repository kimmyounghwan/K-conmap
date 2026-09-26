/**
 * 🖊 종이에 찍을 때의 «펜» — 색·굵기·점선 (2026-09-26)
 * PDF(plotpdf.js)와 미리보기(plotview.js)가 같이 씁니다. 여기 한 곳만 고칩니다.
 *
 * ■ 굵기: 우리나라 도면은 대부분 «색마다 굵기» 로 출력합니다(CTB). 도면 안의 선 굵기(370)는
 *   여수 도면 3장 실측으로 90% 가 BYBLOCK·기본값이라 그대로 쓰면 전부 같은 굵기가 됩니다.
 *   그래서 기본은 «색 번호별 굵기» 입니다. 표는 아래 CTB — 소장님 현장 CTB 가 있으면 바꿔 끼우면 됩니다.
 * ■ 흑백: 회색(8·9·250~254번)만 회색으로, 나머지는 검정.
 */
export const CTB = { 1: 0.13, 2: 0.18, 3: 0.25, 4: 0.3, 5: 0.35, 6: 0.4, 7: 0.3, 8: 0.09, 9: 0.09 }
export const PAPER = { A0: [1189, 841], A1: [841, 594], A2: [594, 420], A3: [420, 297], A4: [297, 210] }

export function penMm(st, opt) {
  if (opt.lw === 'thin') return 0.1
  if (opt.lw === 'object' && st.lw >= 0) return Math.max(0.05, st.lw / 100)
  if (opt.lw === 'object' && st.lw === -3) return 0.18
  const t = opt.ctb || CTB
  if (st.aci >= 1 && st.aci <= 9) return t[st.aci] ?? 0.13
  if (st.aci >= 250) return 0.09
  return 0.13
}
const GRAY = { 8: 128, 9: 192, 250: 51, 251: 91, 252: 132, 253: 173, 254: 214 }   // 캐드 회색 그대로(흐린 바탕 해치가 새까매지지 않게)
export function penRgb(st, opt) {
  if (opt.color !== 'color') {
    const g = GRAY[st.aci]
    return g !== undefined ? [g, g, g] : [0, 0, 0]
  }
  let [r, g, b] = st.rgb
  if (st.aci === 7 || (r > 245 && g > 245 && b > 245)) return [0, 0, 0]
  const lum = 0.299 * r + 0.587 * g + 0.114 * b
  if (lum > 190) { const k = 190 / lum; r *= k; g *= k; b *= k }
  return [Math.round(r), Math.round(g), Math.round(b)]
}
/** 선 종류(도면 단위, 캐드 부호: + 선 · − 빈칸 · 0 점) → 종이 점선 배열(pt) · 너무 잘면 null(실선) */
export function dashOf(model, st, ptPerUnit) {
  if (st.lt < 0) return null
  const lt = model.ltypes[st.lt]
  if (!lt) return null
  const k = (st.lts || 1) * ptPerUnit
  let d = lt.dash.map((v) => v * k)
  const per = d.reduce((s, v) => s + Math.abs(v), 0)
  if (!(per > 0.8)) return null                        // 한 주기가 0.3mm 보다 짧으면 실선처럼 보입니다
  // 켜기(+) / 끄기(−) 번갈아 — 같은 부호는 합칩니다
  const on = [], seq = []
  for (const v of d) {
    const isOn = v >= 0
    const len = v === 0 ? 0 : Math.abs(v)
    if (seq.length && on[on.length - 1] === isOn) seq[seq.length - 1] += len
    else { seq.push(len); on.push(isOn) }
  }
  if (!on[0]) { seq.push(seq.shift()); on.push(on.shift()) }                // 켜기부터 시작하게 돌림
  if (seq.length % 2) seq[0] += seq.pop()                                   // 켜기로 끝나면 첫 켜기에 붙임
  if (seq.length < 2 || seq.every((v) => v === 0)) return null
  d = seq.map((v) => Math.max(0, v))
  return { arr: d, phase: 0 }
}

/**
 * 한 장의 자리 — 도면 범위 r 을 종이(mm) 에 맞춰 넣습니다.
 * @returns {{W, H, s, ox, oy, clip}} W·H: pt · s: pt/도면단위 · clip: 잘라 보일 범위(pt)
 */
export function pageGeom(r, paperMm, margin = 5) {
  const rw = r[2] - r[0], rh = r[3] - r[1]
  let [pw, ph] = paperMm
  if ((rw >= rh) !== (pw >= ph)) [pw, ph] = [ph, pw]
  const W = (pw * 72) / 25.4, H = (ph * 72) / 25.4
  const m = (margin * 72) / 25.4
  const s = Math.min((W - 2 * m) / rw, (H - 2 * m) / rh)
  const ox = (W - rw * s) / 2, oy = (H - rh * s) / 2
  const pad = Math.min(m * 0.8, Math.max(rw, rh) * s * 0.004)
  return { W, H, s, ox, oy, x0: r[0], y0: r[1], clip: [ox - pad, oy - pad, ox + rw * s + pad, oy + rh * s + pad] }
}

export const cullOf = (G) => [G.x0 + (G.clip[0] - G.ox) / G.s, G.y0 + (G.clip[1] - G.oy) / G.s, G.x0 + (G.clip[2] - G.ox) / G.s, G.y0 + (G.clip[3] - G.oy) / G.s]

/** 페이지 한 장 범위 안에 드는 것들 — 자르기(clip)별로 묶음 */
export function pick(model, cull) {
  const [cx0, cy0, cx1, cy1] = cull
  const groups = new Map()
  const grp = (c) => { let g = groups.get(c); if (!g) { g = { fills: [], paths: [], texts: [] }; groups.set(c, g) } return g }
  const P = model.paths, F = model.fills
  const nP = P.st.length, nF = F.l0.length
  for (let i = 0; i < nF; i++) {
    const b = F.box
    if (b[i * 4] > cx1 || b[i * 4 + 2] < cx0 || b[i * 4 + 1] > cy1 || b[i * 4 + 3] < cy0) continue
    grp(F.clip[i]).fills.push(i)
  }
  for (let i = 0; i < nP; i++) {
    const b = P.box
    if (b[i * 4] > cx1 || b[i * 4 + 2] < cx0 || b[i * 4 + 1] > cy1 || b[i * 4 + 3] < cy0) continue
    grp(P.clip[i]).paths.push(i)
  }
  const T = model.texts
  for (let i = 0; i < T.length; i++) {
    const t = T[i]
    const r = (t.mt ? Math.max(t.w || 0, t.h * 40) : t.h * (t.s.length + 2)) + t.h * 4
    if (t.x - r > cx1 || t.x + r < cx0 || t.y - r > cy1 || t.y + r < cy0) continue
    grp(t.clip || 0).texts.push(i)
  }
  return groups
}

