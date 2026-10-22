/**
 * 🖼 서식 종이 그리기 — 엑셀 칸 그대로(격자.py JSON)를 캔버스에 (G361 · 2026-10-21)
 *   화면 · 인쇄 · 그림 PDF 가 «같은 그림» 입니다(소장님 고르심 «그림 PDF» — 글자 층이 없어 엑셀로 안 바뀜).
 *   쪽 나눔: A4 · 엑셀 여백 · 폭 맞춤(fitToWidth=1, 넓히지 않음) · 높이 맞춤(fitToHeight) · 쪽 나누기(brk)
 *   단위: pt(1/72 in). 그릴 때 k = 1pt 당 픽셀.
 */
import { 꼴 } from './엑셀꼴.js'
import { 자리글, 주소 } from './엑셀셈.js'

export const 글꼴 = '"Malgun Gothic","맑은 고딕","Apple SD Gothic Neo","Noto Sans KR","Pretendard",sans-serif'
const A4 = [595.28, 841.89]

/** 시트 하나의 판(칸 자리 · 쪽) */
export function 판짜기(sheet) {
  const pc = sheet.pc, pr = sheet.pr
  const X = [0]
  for (let c = 1; c <= pc; c++) X[c] = X[c - 1] + (sheet.w[c - 1] || 0)
  const Y = [0]
  for (let r = 1; r <= pr; r++) Y[r] = Y[r - 1] + (sheet.h[r - 1] ?? 15)
  const [W, H] = sheet.land ? [A4[1], A4[0]] : A4
  const [ml, mr, mt, mb] = (sheet.marg || [0.45, 0.35, 0.5, 0.5]).map((x) => x * 72)
  const pw = W - ml - mr, ph = H - mt - mb
  let scale = Math.min(1, pw / X[pc])
  if (sheet.fit > 0) scale = Math.min(scale, (ph * sheet.fit) / Y[pr])
  const brk = new Set(sheet.brk || [])
  const 쪽 = []
  let st = 1, acc = 0
  for (let r = 1; r <= pr; r++) {
    const hr = (sheet.h[r - 1] ?? 15) * scale
    if (acc + hr > ph + 0.5 && r > st) { 쪽.push([st, r - 1]); st = r; acc = 0 }
    acc += hr
    if (brk.has(r) && r < pr) { 쪽.push([st, r]); st = r + 1; acc = 0 }
  }
  if (st <= pr) 쪽.push([st, pr])
  const ox = ml + (pw - X[pc] * scale) / 2
  // 칸 표(빠른 찾기)
  const 칸표 = new Map()
  const 덮임 = new Set()
  for (const x of sheet.cells) {
    const [r, c, rs, cs] = x
    칸표.set(r * 16384 + c, x)
    if (rs > 1 || cs > 1) for (let i = r; i < r + rs; i++) for (let j = c; j < c + cs; j++) if (i !== r || j !== c) 덮임.add(i * 16384 + j)
  }
  // 쪽마다 그 쪽에 걸친 칸만(큰 서식 — 검측 300항목 3만 칸 — 에서 칠 때마다 전부 훑지 않게)
  const 쪽칸 = 쪽.map(() => [])
  const 줄쪽 = new Int32Array(pr + 2)
  쪽.forEach(([a, b], i) => { for (let r = a; r <= b; r++) 줄쪽[r] = i })
  for (const x of sheet.cells) {
    const [r, c, rs] = x
    if (c > pc || r > pr) continue
    const p1 = 줄쪽[r], p2 = 줄쪽[Math.min(pr, r + rs - 1)]
    for (let i = p1; i <= p2; i++) 쪽칸[i].push(x)
  }
  return { X, Y, scale, 쪽, 쪽칸, W, H, ox, oy: mt, pw, ph, pc, pr, 칸표, 덮임 }
}

const 굵기 = (code) => (code ? Number(String(code)[0]) || 1 : 0)
function 선(ctx, code, x1, y1, x2, y2, k, s) {
  if (!code) return
  const w = 굵기(code)
  const m = /#([0-9A-Fa-f]{6})/.exec(code)
  ctx.strokeStyle = '#' + (m ? m[1] : '000000')
  ctx.lineWidth = Math.max(1, (w === 1 ? 0.75 : w === 2 ? 1.5 : 2.25) * s * k)
  ctx.setLineDash(String(code).includes('d') ? [3 * k, 2 * k] : [])
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
}

/** 🏷 G369 맨 위 «K-건설맵 | k-conmap.com 건설 서식» 칸(서식 355장 모두 1행 1열 · 글 칸) — 소장님 「건설맵 주소를 제거할 수 있게」 */
export const 건설맵칸 = (x) => !!x && x[5] === 0 && typeof x[6] === 'string' && /k-conmap\.com/.test(x[6])

/** 칸에 보일 값과 글 */
export function 칸글(책, si, x) {
  const [r, c, , , , k, v, , nf] = x
  let val, 자리 = false
  if (k === 0) val = x[7] ? 책.값(si, r, c) : v
  else if (k === 2) val = 책.값(si, r, c)
  else {
    const iv = 책.입력값(si, r, c)
    if (iv !== null && typeof iv === 'object' && typeof iv.f === 'string') val = 책.값(si, r, c)      // 작성 예시만의 수식
    else if (iv !== undefined) val = iv
    else if (k === 3) val = 책.값(si, r, c)
    else if (자리글({ v, nf })) { val = v; 자리 = v !== null && v !== undefined }
    else val = v
  }
  if (val === null || val === undefined) return { t: '', color: null, 수: false, 자리 }
  if (자리) return { t: String(val), color: null, 수: false, 자리 }
  const f = 꼴(val, nf)
  return { ...f, 자리 }
}

/** 글을 줄로(띄어쓰기에서 · 긴 말은 글자에서) */
function 줄나누기(ctx, text, w) {
  const out = []
  for (const para of String(text).split('\n')) {
    if (ctx.measureText(para).width <= w) { out.push(para); continue }
    let line = ''
    const toks = para.split(/(\s+)/)
    for (const tk of toks) {
      if (!tk) continue
      const tryL = line + tk
      if (ctx.measureText(tryL).width <= w) { line = tryL; continue }
      if (line.trim()) { out.push(line.replace(/\s+$/, '')); line = '' }
      if (/^\s+$/.test(tk)) continue
      if (ctx.measureText(tk).width <= w) { line = tk; continue }
      for (const ch of tk) {
        if (ctx.measureText(line + ch).width > w && line) { out.push(line); line = ch } else line += ch
      }
    }
    out.push(line)
  }
  return out
}

/**
 * 한 쪽 그리기
 * @param ctx 캔버스
 * @param {object} o { sheet, si, 판, 쪽번호, k(px/pt), 책, 화면(bool), 고른칸('r,c'), 그림들(Map 이름→Image), 빈칸보기 }
 */
export function 쪽그리기(ctx, o) {
  const { sheet, si, 판, k, 책 } = o
  const [r1, r2] = 판.쪽[o.쪽번호]
  const s = 판.scale
  const st = (i) => (o.doc.st[i] || {})
  const px = (xpt) => (판.ox + xpt * s) * k
  const py = (ypt) => (판.oy + (ypt - 판.Y[r1 - 1]) * s) * k
  ctx.save()
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 판.W * k, 판.H * k)
  ctx.textBaseline = 'alphabetic'
  const 보일 = []
  for (const x of (판.쪽칸 ? 판.쪽칸[o.쪽번호] : sheet.cells)) {
    const [r, c, rs, cs] = x
    if (c > 판.pc) continue
    if (r > r2 || r + rs - 1 < r1) continue
    if (o.건설맵빼기 && 건설맵칸(x)) continue   /* 🏷 G369 화면 · 인쇄 · PDF 같이 */
    const ra = Math.max(r, r1), rb = Math.min(r + rs - 1, r2)
    const cb = Math.min(c + cs - 1, 판.pc)
    보일.push({ x, x0: px(판.X[c - 1]), x1: px(판.X[cb]), y0: py(판.Y[ra - 1]), y1: py(판.Y[rb]), 잘림: ra !== r })
  }
  // 1) 바탕
  for (const b of 보일) {
    const S = st(b.x[4])
    let g = S.g ? '#' + S.g : null
    if (o.화면 && (b.x[5] === 1 || b.x[5] === 3)) g = g || null
    if (g) { ctx.fillStyle = g; ctx.fillRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0) }
    if (o.화면 && (b.x[5] === 1 || b.x[5] === 3)) {
      ctx.fillStyle = 'rgba(37,99,235,0.055)'
      ctx.fillRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0)
    }
  }
  // 2) 글
  const 비었나 = (r, c) => !판.칸표.has(r * 16384 + c) && !판.덮임.has(r * 16384 + c)
  for (const b of 보일) {
    if (b.잘림) continue
    const x = b.x
    const S = st(x[4])
    const g = 칸글(책, si, x)
    if (!g.t) continue
    const size = (S.z || 10) * s * k
    let font = `${S.i ? 'italic ' : ''}${S.b ? 'bold ' : ''}${size}px ${글꼴}`
    ctx.font = font
    const pad = 1.6 * s * k + (S.ind ? S.ind * 7 * s * k : 0)
    let al = S.a || (g.수 ? 'right' : 'left')
    if (al === 'general') al = g.수 ? 'right' : 'left'
    let bx0 = b.x0, bx1 = b.x1
    const by0 = b.y0, by1 = b.y1
    let w = bx1 - bx0 - pad * 2
    const wrap = !!S.w && !g.수          // 엑셀처럼 수(날짜 · 금액)는 줄을 바꾸지 않음 — 칸보다 길면 글자를 줄여 한 줄로(엑셀의 ### 대신)
    let lines
    let fs = size
    if (S.rot === 255) {
      lines = [...g.t.replace(/\s+/g, '')]
      const lh = fs * 1.15
      const total = lines.length * lh
      let yy = S.v === 'top' ? by0 + lh : S.v === 'bottom' ? by1 - total + lh : (by0 + by1) / 2 - total / 2 + lh * 0.82
      ctx.fillStyle = g.color === 'red' ? '#dc2626' : S.k ? '#' + S.k : '#111111'
      ctx.textAlign = 'center'
      for (const ch of lines) { ctx.fillText(ch, (bx0 + bx1) / 2, yy); yy += lh }
      continue
    }
    if (wrap) lines = 줄나누기(ctx, g.t, Math.max(4, w))
    else {
      lines = g.t.split('\n')
      const tw = Math.max(...lines.map((l) => ctx.measureText(l).width))
      if (tw > w) {
        if (S.s || g.수) { fs = Math.max(size * 0.35, size * (w / tw)); font = `${S.i ? 'italic ' : ''}${S.b ? 'bold ' : ''}${fs}px ${글꼴}`; ctx.font = font }
        else if (!g.수) {
          // 옆 빈 칸으로 넘침(엑셀처럼)
          const r = x[0]
          if (al === 'left' || al === 'distributed') { let c = x[1] + x[3]; while (c <= 판.pc && 비었나(r, c) && bx1 - bx0 - pad * 2 < tw) { bx1 = px(판.X[c]); c++ } }
          else if (al === 'right') { let c = x[1] - 1; while (c >= 1 && 비었나(r, c) && bx1 - bx0 - pad * 2 < tw) { bx0 = px(판.X[c - 1]); c-- } }
          else if (al === 'center') { let c1 = x[1] - 1, c2 = x[1] + x[3]; while ((c1 >= 1 && 비었나(r, c1)) || (c2 <= 판.pc && 비었나(r, c2))) { if (bx1 - bx0 - pad * 2 >= tw) break; if (c1 >= 1 && 비었나(r, c1)) { bx0 = px(판.X[c1 - 1]); c1-- } if (c2 <= 판.pc && 비었나(r, c2)) { bx1 = px(판.X[c2]); c2++ } } }
          w = bx1 - bx0 - pad * 2
        }
      }
    }
    const lh = fs * 1.32
    const total = lines.length * lh
    const asc = fs * 0.86
    let y
    if (S.v === 'top') y = by0 + 1.5 * s * k + asc
    else if (S.v === 'bottom') y = by1 - 1.5 * s * k - (total - lh) - (lh - fs) / 2 - fs * 0.14
    else y = (by0 + by1) / 2 - total / 2 + (lh - fs) / 2 + asc
    ctx.save()
    ctx.beginPath(); ctx.rect(bx0, by0, bx1 - bx0, by1 - by0); ctx.clip()
    ctx.fillStyle = g.자리 && o.화면 ? '#9aa3b2' : g.color === 'red' ? '#dc2626' : S.k ? '#' + S.k : '#111111'
    for (const line of lines) {
      if (al === 'distributed' && !wrap && line.length > 1) {
        const chars = [...line.trim()]
        const cw = chars.map((ch) => ctx.measureText(ch).width)
        const sum = cw.reduce((a, b2) => a + b2, 0)
        const gap = chars.length > 1 ? Math.max(0, (w - sum) / (chars.length - 1)) : 0
        let xx = bx0 + pad
        ctx.textAlign = 'left'
        chars.forEach((ch, i) => { ctx.fillText(ch, xx, y); xx += cw[i] + gap })
      } else if (al === 'center' || al === 'centerContinuous' || al === 'justify' && false) { ctx.textAlign = 'center'; ctx.fillText(line, (bx0 + bx1) / 2, y) }
      else if (al === 'right') { ctx.textAlign = 'right'; ctx.fillText(line, bx1 - pad, y) }
      else { ctx.textAlign = 'left'; ctx.fillText(line, bx0 + pad, y) }
      if (S.u) { const tw = ctx.measureText(line).width; const lx = ctx.textAlign === 'center' ? (bx0 + bx1) / 2 - tw / 2 : ctx.textAlign === 'right' ? bx1 - pad - tw : bx0 + pad; ctx.fillRect(lx, y + fs * 0.12, tw, Math.max(1, fs * 0.06)) }
      y += lh
    }
    ctx.restore()
  }
  // 3) 선
  for (const b of 보일) {
    const bd = st(b.x[4]).bd
    if (!bd) continue
    const [t, r, bt, l] = bd
    const e = 0
    if (t && !b.잘림) 선(ctx, t, b.x0, b.y0 + e, b.x1, b.y0 + e, k, s)
    if (bt) 선(ctx, bt, b.x0, b.y1, b.x1, b.y1, k, s)
    if (l) 선(ctx, l, b.x0, b.y0, b.x0, b.y1, k, s)
    if (r) 선(ctx, r, b.x1, b.y0, b.x1, b.y1, k, s)
  }
  ctx.setLineDash([])
  // 4) 사진
  for (const im of sheet.img || []) {
    const [ix, iy, iw, ih, name] = im
    const yTop = iy, yBot = iy + ih
    if (yBot < 판.Y[r1 - 1] || yTop > 판.Y[r2]) continue
    const img = o.그림들 && o.그림들.get(name)
    if (img && img.complete && img.naturalWidth) ctx.drawImage(img, px(ix), py(iy), iw * s * k, ih * s * k)
  }
  // 5) 화면: 고른 칸
  if (o.화면 && o.고른칸) {
    const b = 보일.find((q) => q.x[0] + ',' + q.x[1] === o.고른칸)
    if (b) { ctx.strokeStyle = '#2563eb'; ctx.lineWidth = Math.max(2, 1.6 * k * s); ctx.setLineDash([]); ctx.strokeRect(b.x0 + 1, b.y0 + 1, b.x1 - b.x0 - 2, b.y1 - b.y0 - 2) }
  }
  ctx.restore()
}

/** 쪽 위 한 점(pt, 쪽 기준) → 칸 */
export function 칸찾기(sheet, 판, 쪽번호, xp, yp) {
  const [r1, r2] = 판.쪽[쪽번호]
  const s = 판.scale
  const X = (xp - 판.ox) / s
  const Y = (yp - 판.oy) / s + 판.Y[r1 - 1]
  if (X < 0 || X > 판.X[판.pc] || Y < 판.Y[r1 - 1] || Y > 판.Y[r2]) return null
  let c = 1; while (c < 판.pc && 판.X[c] < X) c++
  let r = r1; while (r < r2 && 판.Y[r] < Y) r++
  // 합친 칸이면 왼쪽 위로
  let hit = 판.칸표.get(r * 16384 + c)
  if (!hit) {
    for (const x of (판.쪽칸 ? 판.쪽칸[쪽번호] : sheet.cells)) { const [rr, cc, rs, cs] = x; if (r >= rr && r < rr + rs && c >= cc && c < cc + cs) { hit = x; break } }
  }
  return hit || null
}

/** 칸 테두리 상자(쪽 기준 pt) */
export function 칸상자(판, 쪽번호, x) {
  const [r1, r2] = 판.쪽[쪽번호]
  const s = 판.scale
  const [r, c, rs, cs] = x
  const ra = Math.max(r, r1), rb = Math.min(r + rs - 1, r2), cb = Math.min(c + cs - 1, 판.pc)
  return { x: 판.ox + 판.X[c - 1] * s, y: 판.oy + (판.Y[ra - 1] - 판.Y[r1 - 1]) * s, w: (판.X[cb] - 판.X[c - 1]) * s, h: (판.Y[rb] - 판.Y[ra - 1]) * s }
}

/** 칸이 어느 쪽에 있나 */
export function 칸쪽(판, r) { return Math.max(0, 판.쪽.findIndex(([a, b]) => r >= a && r <= b)) }

/** 칸 이름(쓰는 칸 위에 보일 말) — 칸 열쇠(공사명 · 사유#3) → 없으면 왼쪽 이름표 · 위 머리 */
export function 칸이름(sheet, 판, x) {
  const [r, c] = x
  const key = sheet.keys && sheet.keys[주소(r, c)]
  const m = key ? /^(?:t\d+\.)?(.+?)(?:#(\d+))?$/.exec(key) : null
  let 왼 = null, 위 = null
  for (let cc = c - 1; cc >= 1 && !왼; cc--) {
    for (let rr = r; rr >= Math.max(1, r - 3) && !왼; rr--) {
      const y = 판.칸표.get(rr * 16384 + cc)
      if (y && y[5] === 0 && typeof y[6] === 'string' && y[6].trim() && rr + y[2] - 1 >= r) 왼 = y[6].replace(/\s+/g, ' ').trim()
    }
  }
  for (let rr = r - 1; rr >= Math.max(1, r - 60) && !위; rr--) {
    const y = 판.칸표.get(rr * 16384 + c)
    if (y && y[5] === 0 && typeof y[6] === 'string' && y[6].trim()) 위 = y[6].replace(/\s+/g, ' ').trim()
  }
  const 붙임 = (t) => (t && /^(\S\s+)+\S$/.test(t) && t.split(/\s+/).every((w) => w.length === 1) ? t.replace(/\s+/g, '') : t)   // «공 사 명» → «공사명»
  if (m && m[2]) return `${m[1]} · ${m[2]}번째 줄`
  if (m) return 붙임(왼 && 왼.replace(/\s/g, '') === m[1] ? 왼 : m[1])
  return 붙임(왼 || 위) || 주소(r, c)
}
