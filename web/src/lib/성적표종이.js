/* ══════════════════════════════════════════════════════════════
   성적표종이.js — 성적표 숫자를 **A4 종이**로 그립니다 (2026-09-18)

   왜 캔버스에 그리나
     tools/report_html.py 는 HTML 을 만들고 크롬 인쇄로 PDF 를 뽑았습니다.
     브라우저 안에서 «내려받기» 를 하려면 인쇄 대화상자를 거치지 않고
     PDF 파일 자체를 만들어야 합니다. 한글을 pdf-lib 에 넣으려면 5MB 짜리
     글꼴을 통째로 받아야 해서, 대신 **브라우저가 이미 가진 글꼴로 캔버스에
     그린 뒤** 그 그림을 쪽마다 한 장씩 넣습니다.
     ⇒ 화면에 보이는 것과 내려받은 PDF 가 **같은 그림**입니다. 어긋날 자리가 없습니다.

   ⚠️ 종이 꼴(글자 크기·색·칸 너비)은 tools/report_html.py 를 따라갔습니다.
      한쪽을 고치면 다른 쪽도 고쳐야 «견본 PDF» 와 «사이트에서 만든 PDF» 가 같아집니다.
   ══════════════════════════════════════════════════════════════ */

export const 파랑 = '#1a56db'
export const 녹 = '#c2410c'
export const 먹 = '#1a1d24'
export const 흐림 = '#6b7280'
export const 줄색 = '#e5e7eb'

/* 사이트(styles.css)와 같은 차례입니다 — 소장님 컴퓨터(윈도)에서는 맑은 고딕으로 그려집니다 */
const 글꼴 = "'Malgun Gothic','맑은 고딕','Apple SD Gothic Neo','Pretendard','Noto Sans KR','Noto Sans CJK KR',sans-serif"

/* 300dpi 는 한 쪽에 4MB 가 넘습니다. 160dpi 면 글자가 또렷하면서 한 쪽 200~400KB 입니다. */
export const DPI = 160
const MM = (v) => v * DPI / 25.4
const PT = (v) => v * DPI / 72
const 쪽너비 = Math.round(MM(210))
const 쪽높이 = Math.round(MM(297))
const 여백가로 = Math.round(MM(13))
const 여백세로 = Math.round(MM(14))
const 글너비 = 쪽너비 - 여백가로 * 2
const 바닥 = 쪽높이 - 여백세로

export const 돈 = (n) => {
  if (n == null) return '—'
  n = Math.round(Number(n))
  if (Math.abs(n) >= 1e8) return (n / 1e8).toFixed(2) + '억원'
  if (Math.abs(n) >= 1e4) return Math.round(n / 1e4).toLocaleString() + '만원'
  return n.toLocaleString() + '원'
}
export const 쉼표 = (n) => (n == null ? '—' : Math.round(Number(n)).toLocaleString())
export const pp = (v, d = 3) => (v == null ? '—' : (v >= 0 ? '+' : '') + Number(v).toFixed(d) + '%p')
const n0 = (x) => (x == null ? '—' : (Number(x) === Math.trunc(Number(x)) ? String(Math.trunc(Number(x))) : String(x)))

/* 업체 이름·공고명 가리기 — 견본을 만들 때만 씁니다 */
export const 이름가리기 = () => '○○건설 주식회사'
export function 공고가리기(s) {
  const t = String(s || '').trim().split(/\s+/)
  if (!t.length || !t[0]) return String(s || '')
  let head = t[0].slice(0, 12)
  if (head.length <= 4 && t.length > 1) head = head + ' ' + t[1].slice(0, 10)
  return head + ' ○○○ 공사'
}

/* ── 글 조각내기 ────────────────────────────────────────────
   *굵게* · ⟦파란 굵게⟧ · ⟨붉은 굵게⟩ 세 가지만 씁니다.
   자료에서 온 글(공고명·업체명)은 넣기 전에 이 글자들을 떼어 냅니다. */
export const 씻기 = (s) => String(s == null ? '' : s).replace(/[*⟦⟧⟨⟩]/g, '')
function 조각(s) {
  const out = []
  const re = /(\*[^*]+\*|⟦[^⟧]+⟧|⟨[^⟩]+⟩)/g
  let i = 0, m
  const 평 = (t) => { if (t) out.push({ s: t, b: false, c: null }) }
  while ((m = re.exec(s)) !== null) {
    평(s.slice(i, m.index))
    const t = m[0]
    if (t[0] === '*') out.push({ s: t.slice(1, -1), b: true, c: null })
    else if (t[0] === '⟦') out.push({ s: t.slice(1, -1), b: true, c: 파랑 })
    else out.push({ s: t.slice(1, -1), b: true, c: 녹 })
    i = m.index + t.length
  }
  평(s.slice(i))
  return out
}

/* 줄바꿈 — 라틴 낱말은 붙여 두고 한글은 글자 단위로 끊습니다(브라우저와 같은 규칙) */
function 토막(t) {
  const out = []
  let buf = ''
  for (const ch of t) {
    if (/[A-Za-z0-9.,%+\-/()]/.test(ch)) { buf += ch; continue }
    if (buf) { out.push(buf); buf = '' }
    out.push(ch)
  }
  if (buf) out.push(buf)
  return out
}

export function 종이만들기() {
  const c = document.createElement('canvas')
  c.width = 쪽너비
  c.height = 쪽높이
  const x = c.getContext('2d')
  x.fillStyle = '#ffffff'
  x.fillRect(0, 0, 쪽너비, 쪽높이)
  x.textBaseline = 'alphabetic'
  return { c, x }
}

/* ══════════════════════════════════════════════════════════════
   그림판 — 쪽을 채우다 넘치면 새 쪽으로 넘어갑니다
   ══════════════════════════════════════════════════════════════ */
class 그림판 {
  constructor() {
    this.쪽들 = []
    this.새쪽()
  }
  새쪽() {
    const p = 종이만들기()
    this.쪽들.push(p)
    this.x = p.x
    this.y = 여백세로
    return p
  }
  자리(h) {                      // h 만큼 그릴 자리가 남았나
    if (this.y + h > 바닥 - PT(16)) this.새쪽()
  }
  글꼴설정(pt, b) { this.x.font = `${b ? '700 ' : ''}${PT(pt)}px ${글꼴}` }
  잰다(segs, pt) {
    let w = 0
    for (const s of segs) { this.글꼴설정(pt, s.b); w += this.x.measureText(s.s).width }
    return w
  }
  /** 조각들을 maxW 안에서 줄로 나눕니다 */
  줄나누기(segs, pt, maxW) {
    const 줄 = [[]]
    let w = 0
    for (const s of segs) {
      this.글꼴설정(pt, s.b)
      for (const t of 토막(s.s)) {
        const tw = this.x.measureText(t).width
        if (w + tw > maxW && w > 0 && t !== ' ') { 줄.push([]); w = 0 }
        if (w === 0 && t === ' ') continue
        줄[줄.length - 1].push({ ...s, s: t, w: tw })
        w += tw
      }
    }
    return 줄
  }
  /** 한 줄 그리기. a='l'|'r'|'c' */
  줄그리기(줄, pt, x0, y, 색, a = 'l', maxW = 0) {
    let w = 0
    for (const s of 줄) w += s.w
    let x = x0
    if (a === 'r') x = x0 + maxW - w
    else if (a === 'c') x = x0 + (maxW - w) / 2
    for (const s of 줄) {
      this.글꼴설정(pt, s.b)
      this.x.fillStyle = s.c || 색
      this.x.fillText(s.s, x, y)
      x += s.w
    }
  }
  /** 여러 줄 글 — 돌려주는 것은 다 그린 뒤의 y */
  글(s, { pt = 10.5, 색 = 먹, 위 = 0, 아래 = 0, 들여 = 0, 너비 = 0, 줄간 = 1.55, a = 'l' } = {}) {
    const W = 너비 || (글너비 - 들여)
    const segs = 조각(s)
    const 줄 = this.줄나누기(segs, pt, W)
    const lh = PT(pt) * 줄간
    this.자리(위 + lh * 줄.length + 아래)
    this.y += 위
    for (const L of 줄) {
      this.y += lh
      this.줄그리기(L, pt, 여백가로 + 들여, this.y - lh * 0.25, 색, a, W)
    }
    this.y += 아래
    return this.y
  }
  선(y, x0, x1, 색 = 줄색, w = 1) {
    this.x.strokeStyle = 색
    this.x.lineWidth = w
    this.x.beginPath()
    this.x.moveTo(x0, y + 0.5)
    this.x.lineTo(x1, y + 0.5)
    this.x.stroke()
  }
  칸(x0, y0, w, h, { 배경, 테두리, r = 0 } = {}) {
    const x = this.x
    x.beginPath()
    if (r) {
      x.moveTo(x0 + r, y0); x.lineTo(x0 + w - r, y0); x.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r)
      x.lineTo(x0 + w, y0 + h - r); x.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h)
      x.lineTo(x0 + r, y0 + h); x.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r)
      x.lineTo(x0, y0 + r); x.quadraticCurveTo(x0, y0, x0 + r, y0)
    } else { x.rect(x0, y0, w, h) }
    x.closePath()
    if (배경) { x.fillStyle = 배경; x.fill() }
    if (테두리) { x.strokeStyle = 테두리; x.lineWidth = 1; x.stroke() }
  }
}

/* ══════════════════════════════════════════════════════════════
   블록 하나하나
   ══════════════════════════════════════════════════════════════ */
function 표제(g, s, hi) {
  const lh = PT(12.5) * 1.3
  /* ⚠️ 표제만 쪽 맨 아래에 남고 알맹이가 다음 쪽으로 넘어가면 종이가 이상해 보입니다.
     그래서 표제 아래로 최소 한 덩어리(약 90pt)가 들어갈 자리가 없으면 쪽을 넘깁니다. */
  g.자리(PT(20) + lh + PT(7) + PT(90))
  g.y += PT(20)
  g.글꼴설정(12.5, true)
  g.x.fillStyle = hi ? 파랑 : 먹
  g.y += lh
  g.x.fillText(씻기(s), 여백가로, g.y - lh * 0.28)
  g.y += PT(5)
  g.선(g.y, 여백가로, 쪽너비 - 여백가로, hi ? 파랑 : 먹, 2)
  g.y += PT(8)
}

function 상자글(g, s, { 배경, 테, pt = 10.5 }) {
  const W = 글너비 - PT(14)
  const 줄 = g.줄나누기(조각(s), pt, W)
  const lh = PT(pt) * 1.6
  const h = lh * 줄.length + PT(10)
  g.자리(PT(10) + h)
  g.y += PT(10)
  g.칸(여백가로, g.y, 글너비, h, { 배경 })
  g.x.fillStyle = 테
  g.x.fillRect(여백가로, g.y, PT(3), h)
  let y = g.y + PT(5)
  for (const L of 줄) { y += lh; g.줄그리기(L, pt, 여백가로 + PT(11), y - lh * 0.28, 먹) }
  g.y += h
}

function 타일(g, items) {
  const n = items.length
  const gap = PT(8)
  const w = (글너비 - gap * (n - 1)) / n
  const h = PT(50)
  g.자리(PT(16) + h)
  g.y += PT(16)
  items.forEach((it, i) => {
    const x0 = 여백가로 + i * (w + gap)
    g.칸(x0, g.y, w, h, { 테두리: 줄색, r: PT(7) })
    g.글꼴설정(8.5, false); g.x.fillStyle = 흐림
    g.x.fillText(씻기(it.k), x0 + PT(10), g.y + PT(13))
    g.글꼴설정(17, true); g.x.fillStyle = 먹
    g.x.fillText(씻기(it.v), x0 + PT(10), g.y + PT(33))
    g.글꼴설정(8, false); g.x.fillStyle = 흐림
    g.x.fillText(씻기(it.s), x0 + PT(10), g.y + PT(45))
  })
  g.y += h
}

function 막대(g, rows, 라벨폭 = 74) {
  const lw = PT(라벨폭), vw = PT(80)
  const bw = 글너비 - lw - vw - PT(8)
  g.자리(PT(8) + rows.length * PT(17))
  g.y += PT(8)
  for (const r of rows) {
    g.자리(PT(17))
    const y = g.y
    g.글꼴설정(9.5, false); g.x.fillStyle = 흐림
    const 줄 = g.줄나누기(조각(r.k), 9.5, lw - PT(6))
    g.줄그리기(줄[0], 9.5, 여백가로, y + PT(11), 흐림)
    g.칸(여백가로 + lw, y + PT(4), bw, PT(9), { 배경: '#f1f3f7', r: PT(4) })
    const w = Math.max(0, Math.min(100, r.pct)) / 100 * bw
    if (w > 0) g.칸(여백가로 + lw, y + PT(4), w, PT(9), { 배경: r.색 || 파랑, r: PT(4) })
    g.글꼴설정(11, true); g.x.fillStyle = 먹
    const t = 씻기(r.v)
    g.x.fillText(t, 쪽너비 - 여백가로 - g.x.measureText(t).width, y + PT(12))
    g.y += PT(17)
  }
}

function 견줌(g, rows) {
  const lw = PT(118), vw = PT(100)
  g.자리(PT(10) + rows.length * PT(21))
  g.y += PT(10)
  for (const r of rows) {
    g.자리(PT(21))
    const y = g.y
    g.글꼴설정(10, true); g.x.fillStyle = 먹
    g.x.fillText(씻기(r.k), 여백가로, y + PT(14))
    g.글꼴설정(13, true)
    const t = 씻기(r.v)
    g.x.fillStyle = r.색 || 먹
    g.x.fillText(t, 여백가로 + lw + vw - PT(12) - g.x.measureText(t).width, y + PT(15))
    const 줄 = g.줄나누기(조각(r.d || ''), 9, 글너비 - lw - vw)
    if (줄[0] && 줄[0].length) g.줄그리기(줄[0], 9, 여백가로 + lw + vw, y + PT(14), 흐림)
    g.y += PT(21)
  }
}

/* 등수는 «자리» 다 — 막대가 아니라 눈금 위의 점으로 찍습니다.
   막대로 그리면 «길수록 좋다» 로 잘못 읽힙니다(등수는 작을수록 좋습니다). */
function 눈금(g, rows, mx = 30) {
  const lw = PT(104), vw = PT(80)
  const tw = 글너비 - lw - vw - PT(8)
  g.자리(PT(10) + rows.length * PT(20) + PT(14))
  g.y += PT(10)
  for (const r of rows) {
    g.자리(PT(20))
    const y = g.y
    g.글꼴설정(10, true); g.x.fillStyle = 먹
    g.x.fillText(씻기(r.k), 여백가로, y + PT(13))
    g.x.fillStyle = '#e9edf4'
    g.x.fillRect(여백가로 + lw, y + PT(9), tw, PT(2))
    const pos = Math.max(0, Math.min(1, (Number(r.v) - 1) / (mx - 1)))
    const cx = 여백가로 + lw + pos * tw
    g.x.beginPath(); g.x.arc(cx, y + PT(10), PT(5.5), 0, Math.PI * 2)
    g.x.fillStyle = '#ffffff'; g.x.fill()
    g.x.beginPath(); g.x.arc(cx, y + PT(10), PT(4), 0, Math.PI * 2)
    g.x.fillStyle = r.색 || 파랑; g.x.fill()
    g.글꼴설정(11, true); g.x.fillStyle = 먹
    const t = n0(r.v) + '위'
    g.x.fillText(t, 쪽너비 - 여백가로 - g.x.measureText(t).width, y + PT(14))
    g.y += PT(20)
  }
  g.글꼴설정(7.5, false); g.x.fillStyle = 흐림
  const 눈 = [['1위', 0], ['10위', 0.31], ['20위', 0.65], ['30위', 1]]
  for (const [t, p] of 눈) {
    const w = g.x.measureText(t).width
    g.x.fillText(t, 여백가로 + lw + p * tw - (p === 1 ? w : p === 0 ? 0 : w / 2), g.y + PT(9))
  }
  g.y += PT(20)
}

/** 테두리 있는 작은 표 (report_html.py 의 .tbl2) */
function 네모표(g, head, rows, 너비몫) {
  const pt = 10
  const W = 글너비
  const cw = 너비몫.map((f) => W * f)
  const rh = PT(pt) * 1.9
  const 머리 = () => {
    g.자리(rh)
    const y = g.y
    let x = 여백가로
    head.forEach((h, i) => {
      g.칸(x, y, cw[i], rh, { 테두리: 줄색 })
      g.글꼴설정(pt, false); g.x.fillStyle = 흐림
      const t = 씻기(h)
      const tw = g.x.measureText(t).width
      g.x.fillText(t, i === 0 ? x + PT(10) : x + cw[i] - PT(10) - tw, y + rh * 0.68)
      x += cw[i]
    })
    g.y += rh
  }
  g.y += PT(10)
  머리()
  for (const r of rows) {
    if (g.y + rh > 바닥 - PT(16)) { g.새쪽(); 머리() }
    const y = g.y
    let x = 여백가로
    r.forEach((cell, i) => {
      g.칸(x, y, cw[i], rh, { 테두리: 줄색 })
      const segs = 조각(String(cell))
      const tw = g.잰다(segs, pt)
      const 줄 = [segs.map((s) => { g.글꼴설정(pt, s.b); return { ...s, w: g.x.measureText(s.s).width } })]
      g.줄그리기(줄[0], pt, i === 0 ? x + PT(10) : x + cw[i] - PT(10) - tw, y + rh * 0.68,
                 i === 0 ? 흐림 : 먹)
      x += cw[i]
    })
    g.y += rh
  }
}

/** 빽빽한 기록표 (report_html.py 의 .rows) */
function 기록표(g, head, rows, 너비몫) {
  const pt = 8.5
  const cw = 너비몫.map((f) => 글너비 * f)
  const 머리 = () => {
    const h = PT(pt) * 2.0
    g.자리(h)
    g.x.fillStyle = '#f7f8fa'
    g.x.fillRect(여백가로, g.y, 글너비, h)
    let x = 여백가로
    head.forEach((t, i) => {
      g.글꼴설정(pt, false); g.x.fillStyle = 먹
      const a = 너비몫.a && 너비몫.a[i]
      const w = g.x.measureText(씻기(t)).width
      g.x.fillText(씻기(t), a === 'r' ? x + cw[i] - PT(5) - w : x + PT(5), g.y + h * 0.7)
      x += cw[i]
    })
    g.y += h
    g.선(g.y, 여백가로, 쪽너비 - 여백가로, 먹, 2)
  }
  g.y += PT(4)
  머리()
  for (const r of rows) {
    const 두줄 = r.some((c) => c && c.sub)
    const h = PT(pt) * (두줄 ? 2.5 : 1.7)
    if (g.y + h > 바닥 - PT(16)) { g.새쪽(); 머리() }
    let x = 여백가로
    r.forEach((cell, i) => {
      const c = (cell && typeof cell === 'object') ? cell : { s: String(cell == null ? '' : cell) }
      const segs = 조각(c.s == null ? '' : String(c.s))
      const 줄 = [segs.map((s) => { g.글꼴설정(pt, s.b); return { ...s, w: g.x.measureText(s.s).width } })]
      const w = 줄[0].reduce((a, b) => a + b.w, 0)
      const a = c.a || 'l'
      g.줄그리기(줄[0], pt, a === 'r' ? x + cw[i] - PT(5) - w : x + PT(5), g.y + PT(pt) * 1.15,
                 c.c || 먹)
      if (c.sub) {
        g.글꼴설정(7.5, false); g.x.fillStyle = 흐림
        const 줄2 = g.줄나누기(조각(c.sub), 7.5, cw[i] - PT(8))
        if (줄2[0]) g.줄그리기(줄2[0], 7.5, x + PT(5), g.y + PT(pt) * 2.2, 흐림)
      }
      x += cw[i]
    })
    g.y += h
    g.선(g.y - PT(2), 여백가로, 쪽너비 - 여백가로, 줄색, 1)
  }
}

function 꼬리(g, 큰줄, 작은줄들) {
  g.자리(PT(60))
  g.y += PT(18)
  g.선(g.y, 여백가로, 쪽너비 - 여백가로, 파랑, 2)
  g.y += PT(4)
  g.글(큰줄, { pt: 10, 줄간: 1.55, 위: PT(5) })
  for (const s of 작은줄들) g.글(s, { pt: 8, 색: 흐림, 줄간: 1.6 })
}

/* 📣 쪽마다 사이트 이름을 답니다 — 이 종이는 사무실을 돌아다닙니다.
   받은 사람이 아니라 «옆에서 본 사람» 이 찾아오게 하는 것이 목적입니다. */
function 쪽바닥(p, n, 총) {
  const x = p.x
  x.strokeStyle = 줄색; x.lineWidth = 1
  x.beginPath(); x.moveTo(여백가로, 바닥 - PT(11) + 0.5); x.lineTo(쪽너비 - 여백가로, 바닥 - PT(11) + 0.5); x.stroke()
  x.font = `${PT(7.5)}px ${글꼴}`
  x.fillStyle = 흐림
  x.fillText('K-건설맵  ·  k-conmap.com  —  공공입찰 개찰 기록 · 권장 투찰금액 · 건설 서식 · 내역서 작성',
             여백가로, 바닥 - PT(1))
  const t = `${n} / ${총}`
  x.fillText(t, 쪽너비 - 여백가로 - x.measureText(t).width, 바닥 - PT(1))
}

/* ══════════════════════════════════════════════════════════════
   성적표 한 벌 그리기
   ══════════════════════════════════════════════════════════════ */
export function 그리기(d, { 가릴까 = false } = {}) {
  const f = 가릴까 ? 이름가리기 : ((s) => 씻기(s))
  const fn = 가릴까 ? ((s) => 씻기(공고가리기(s))) : ((s) => 씻기(s))
  const fi = (s) => 씻기(s)          // 발주기관은 가리지 않습니다 — 완전 공개 정보입니다

  const co = d.업체, su = d.요약, rk = d.등수, bo = d.바로투찰이었다면
  const hb = d.습관요약 || {}, hb2 = d.습관 || null, dqa = d.실격해부
  const R = d.기록 || []
  const bb = R.filter((r) => r.baro)
  const cmp_ = bb.filter((r) => !r.baro.dq && r.baro.rank_lo)
  const better = cmp_.filter((r) => r.baro.rank_lo < r.rank).length
  const worse = cmp_.filter((r) => r.baro.rank_lo > r.rank).length
  const bno = String(co.사업자번호 || '')
  const bno_s = 가릴까 ? `${bno.slice(0, 3)}-**-*****`
                       : `${bno.slice(0, 3)}-${bno.slice(3, 5)}-${bno.slice(5)}`

  const g = new 그림판()

  /* ── 1장 ────────────────────────────────────────────── */
  g.글('⟦K-건설맵⟧   k-conmap.com', { pt: 9 })
  g.글('입찰 성적표', { pt: 21, 위: PT(4), 줄간: 1.3 })
  g.글(`*${f(co.이름)}* 귀중    사업자등록번호 ${bno_s}`, { pt: 12, 줄간: 1.4 })
  g.글(`${String(su.기간[0]).slice(0, 10)} ~ ${String(su.기간[1]).slice(0, 10)} 개찰 *${su.투찰}건* 기준`,
       { pt: 9.5, 색: 흐림 })
  if (가릴까) 상자글(g, '견본입니다 — *숫자는 모두 실제 조달청 자료*이고, 업체 이름과 공고명만 가렸습니다.',
                    { 배경: '#fff7ed', 테: 녹, pt: 9.5 })

  타일(g, [
    { k: '투찰', v: `${su.투찰}건`, s: `평균 ${su.평균참가}곳과 경쟁` },
    { k: '낙찰', v: `${su.낙찰}건`, s: `낙찰률 ${su.낙찰률}%` },
    { k: '등수 중앙', v: `${n0(rk.중앙)}위`, s: `평균 ${rk.평균}위` },
    { k: '하한 미달', v: `${hb.실격 || 0}건`, s: '금액을 너무 낮게 씀' },
  ])
  const solo = R.filter((r) => (r.n || 0) <= 1 && r.rank === 1)
  if (solo.length) {
    g.글(`낙찰 ${su.낙찰}건 가운데 *${solo.length}건*은 참가가 1곳뿐인 개찰이었습니다 — ` +
         '경쟁이 있던 자리와 나눠 보셔야 합니다.', { pt: 8.5, 색: 흐림, 위: PT(7) })
  }

  표제(g, '등수는 어디에 몰려 있나')
  const 분포 = rk.분포 || {}
  const 총 = Object.values(분포).reduce((a, b) => a + b, 0) || 1
  const lab = { 1: '1순위', 5: '2~5위', 10: '6~10위', 30: '11위 밖' }
  막대(g, ['1', '5', '10', '30'].map((k) => ({
    k: lab[k], pct: (분포[k] || 0) / 총 * 100, v: `${분포[k] || 0}건`,
  })))
  const 최다 = R.reduce((m, r) => Math.max(m, r.n || 0), 0)
  /* ⚠️ 없는 정확도를 주장하지 않습니다 — 조달청이 주는 투찰업체 목록을 «낮은 금액 순 30곳»
     까지만 담고 있습니다. 30위 밖으로 높게 쓴 건은 이 종이에 아예 안 잡힙니다.
     그 사실을 적지 않으면 «내가 넣은 것이 빠졌다» 는 말을 듣게 됩니다. */
  g.글(`참가업체가 ${쉼표(최다)}곳까지 붙은 자리도 있었습니다. 등수는 «낮은 금액 순 30곳» 안에서 ` +
       '매긴 것이고, 30위 밖은 «11위 밖»에 함께 넣었습니다.', { pt: 8.5, 색: 흐림, 위: PT(6) })
  g.글('⚠️ 담고 있는 것은 개찰마다 *낮은 금액 순 30곳*까지입니다. 참가가 그보다 많은 자리에서 ' +
       '30위 밖으로 높게 쓰신 건은 이 종이에 잡히지 않습니다 — *넣으신 것보다 적게 나올 수 있습니다.*',
       { pt: 8.5, 색: 흐림, 위: PT(4) })

  표제(g, '투찰 습관 — 겨냥과 손', true)
  if (hb2) {
    g.글(`개찰 *${hb2.잰개찰}건*에서 «내 금액이 낙찰하한선보다 몇 %p 위였나»를 재고, ` +
         '같은 자리에서 «1순위 금액은 몇 %p 위였나»와 견줬습니다.', { pt: 10.5 })
    const rows = [{ k: '내가 겨눈 자리', v: pp(hb2.내자리중앙), d: '하한선 위 (가운데값)' }]
    if (hb2.낙찰선중앙 != null) rows.push({ k: '실제 낙찰선', v: pp(hb2.낙찰선중앙), d: '1순위가 있던 자리 (가운데값)' })
    rows.push({ k: '손 떨림', v: `±${Number(hb2.흔들림).toFixed(3)}%p`,
                d: `회마다 얼마나 흩어지나 (${pp(hb2.최저)} ~ ${pp(hb2.최고)})` })
    견줌(g, rows)
    const gap = hb2.어긋남
    if (gap != null && Math.abs(gap) <= hb2.흔들림 / 2) {
      상자글(g, `*겨냥은 맞습니다. 문제는 손입니다.* 겨눈 자리와 실제 낙찰선의 차이는 *${pp(gap)}*로 ` +
        `사실상 같습니다. 그런데 회마다 *±${Number(hb2.흔들림).toFixed(3)}%p*씩 흩어집니다 — ` +
        `낙찰선이 하한 위 ${pp(hb2.낙찰선중앙)}에 있는데 흔들림이 그보다 ` +
        `*${(hb2.흔들림 / Math.max(Math.abs(hb2.낙찰선중앙), 0.001)).toFixed(0)}배* 큽니다. ` +
        '그래서 어떤 날은 1순위고, 어떤 날은 하한선 아래로 떨어집니다.',
        { 배경: '#eff4ff', 테: 파랑 })
    } else if (gap != null && gap > 0) {
      상자글(g, `겨눈 자리가 낙찰선보다 *${pp(gap)} 높습니다.* 그만큼 늘 한 발 위에서 쏘고 있다는 뜻입니다.`,
             { 배경: '#eff4ff', 테: 파랑 })
    } else if (gap != null) {
      상자글(g, `겨눈 자리가 낙찰선보다 *${pp(gap)} 낮습니다.* 이기면 크지만 하한선 아래로 ` +
             '떨어지는 날이 늘어납니다.', { 배경: '#eff4ff', 테: 파랑 })
    }
  } else {
    g.글('셈에 쓸 수 있는 개찰이 세 건이 안 됩니다 — 기초금액·A값이 다 있는 개찰만 잽니다.',
         { pt: 8.5, 색: 흐림 })
  }

  /* ── 분위 ────────────────────────────────────────────
     ⚠️ 여기서 «낙찰자가 앉았던 분위에 넣으라» 고 쓰면 안 됩니다.
        그 자리는 개찰이 끝난 뒤에야 알 수 있습니다 (생존 편향 · CLAUDE.md 8-9). */
  const qt = d.분위
  if (qt) {
    표제(g, '어느 «분위»에 걸고 있나', true)
    g.글('분위는 *그 금액이 실격을 면할 확률*입니다. 40분위에 걸었다는 말은 ' +
         '«열 번 중 여섯 번은 하한선 아래로 떨어질 자리»에 냈다는 뜻입니다. ' +
         `금액을 낮출수록 분위가 내려갑니다. 개찰 *${qt.잰개찰}건*을 되짚었습니다.`, { pt: 10.5 })
    const rows = [{ k: '귀사가 거는 자리', v: `${qt.중앙.toFixed(0)}분위`,
                    d: `가운데값 (${qt.최저.toFixed(0)} ~ ${qt.최고.toFixed(0)} 사이에서 움직입니다)` }]
    if (qt.바로투찰중앙 != null) rows.push({ k: '바로투찰 금액', v: `${qt.바로투찰중앙.toFixed(0)}분위`,
                                          d: '같은 개찰에서 K-건설맵이 권한 금액' })
    if (qt.낙찰자중앙 != null) rows.push({ k: '그날 1순위', v: `${qt.낙찰자중앙.toFixed(0)}분위`,
                                        d: '개찰이 끝난 «뒤에» 보이는 자리입니다' })
    rows.push({ k: '실격', v: `${qt.실격}건 · ${qt.실제실격률.toFixed(0)}%`,
                d: `${qt.중앙.toFixed(0)}분위면 셈으로는 ${qt.모형실격률.toFixed(0)}% 입니다` })
    견줌(g, rows)
    if (qt.칸별 && qt.칸별.length) {
      g.글('분위 칸마다 무슨 일이 있었나', { pt: 11.5, 위: PT(12) })
      네모표(g, ['건 자리', '투찰', '실격', '낙찰', '평균등수'],
        qt.칸별.map((r) => [r.칸, String(r.투찰),
          r.실격 ? `⟨${r.실격}⟩` : '0', r.낙찰 ? `⟦${r.낙찰}⟧` : '0', String(r.평균등수)]),
        [0.36, 0.16, 0.16, 0.16, 0.16])
      const low = qt.칸별.filter((r) => r.칸 === '30분위 미만' || r.칸 === '30~50분위')
      const lo_n = low.reduce((s, r) => s + r.투찰, 0)
      const lo_w = low.reduce((s, r) => s + r.낙찰, 0)
      const lo_d = low.reduce((s, r) => s + r.실격, 0)
      if (lo_n >= 3) {
        상자글(g, `50분위 아래로 *${lo_n}건*을 넣어 ⟨${lo_d}건이 실격⟩되고 *${lo_w}건 낙찰*했습니다. ` +
               '낮게 쓴 만큼 더 딴 것이 아니라, 낮게 쓴 만큼 *버린 것*입니다.',
               { 배경: '#eff4ff', 테: 파랑 })
      }
    }
    g.글('3년치 개찰 8,406건을 분위별로 갈라 본 결과입니다 — *분위를 어떻게 잡아도 1순위율은 ' +
         '3.5~4.4%에서 움직이지 않습니다.* 움직이는 것은 실격률뿐입니다(14% → 84%). ' +
         '금액을 낮추는 것은 «딸 확률»을 사는 것이 아니라 «실격»을 사는 것입니다.',
         { pt: 8.5, 색: 흐림, 위: PT(8) })
    g.글('⚠️ 그렇다고 «1순위가 앉았던 분위에 넣으십시오»라는 말은 아닙니다. 그 자리는 개찰이 끝난 ' +
         '뒤에야 보입니다. 넣기 전에 고를 수 있는 것은 *실격을 얼마나 각오할 것인가* 하나뿐입니다. ' +
         '승부를 가르는 것은 금액이 아니라 *어느 공고에 넣느냐*입니다 — ' +
         '참가 2~9곳이면 1순위율 18.2%, 100곳이 넘으면 1.6%입니다.',
         { pt: 8.5, 색: 흐림, 위: PT(6) })
  }

  /* ── 바로투찰이었다면 ───────────────────────────────── */
  표제(g, '바로투찰 금액이었다면', true)
  g.글('그날 K-건설맵이 권한 금액을 그대로 냈다면 어땠을지, *개찰이 끝난 뒤 확정된 예정가격*으로 ' +
       `다시 세어 본 것입니다. 기초금액·A값이 없는 개찰은 셈에서 뺐습니다(${su.투찰}건 중 ${bo.잰개찰}건을 쟀습니다).`,
       { pt: 10.5 })
  if (cmp_.length) {
    const my_m = 중앙값(cmp_.map((r) => r.rank))
    const bo_m = 중앙값(cmp_.map((r) => r.baro.rank_lo))
    눈금(g, [{ k: '내가 낸 금액', v: my_m, 색: 녹 }, { k: '바로투찰 금액', v: bo_m, 색: 파랑 }])
    g.글('등수 중앙값입니다. *왼쪽일수록 앞선 자리*입니다.', { pt: 8.5, 색: 흐림 })
    g.글(`등수를 견줄 수 있는 *${cmp_.length}건* 가운데 *${better}건에서 바로투찰 금액이 앞섰고*, ` +
         `내 금액이 앞선 것은 ${worse}건이었습니다.`, { pt: 11.5, 위: PT(12) })
  }
  네모표(g, [`잰 ${bo.잰개찰}건 안에서`, '내 금액', '바로투찰'], [
    ['1순위', `${bb.filter((r) => r.rank === 1).length}건`, `${bo['1순위']}건`],
    ['하한 미달(실격)', `${bb.filter((r) => r.my_dq).length}건`, `${bo.실격}건`],
  ], [0.4, 0.3, 0.3])
  g.글('⚠ «몇 위»는 조달청이 준 순위 사다리로 좁힌 *최소 등수*입니다 — 실제로는 그보다 뒤일 수 ' +
       '있습니다. 또 내가 금액을 바꿨다고 남들 금액까지 바뀌지는 않는다는 가정 위에서 센 값입니다.',
       { pt: 8.5, 색: 흐림, 위: PT(8) })

  /* ── 놓친 자리 ───────────────────────────────────────── */
  const miss = d.놓친자리 || []
  if (miss.length) {
    표제(g, '놓친 자리 다섯', true)
    g.글('1순위와 금액 차이가 가장 작았던 자리입니다. *«남은 여유»*는 하한선까지 더 낮출 수 있었던 ' +
         '금액입니다 — 이보다 차이가 작으면 *그만큼만 낮췄어도 1순위*였습니다.', { pt: 10.5 })
    기록표(g, ['개찰', '공고', '참가', '내 등수', '1순위와 차이', '남은 여유'],
      miss.map((m) => {
        const able = m.enough && m.room != null && m.room >= m.gap
        return [
          { s: String(m.dt).slice(5, 10), c: 흐림 },
          { s: fn(m.name), sub: fi(m.inst) },
          { s: 쉼표(m.n), a: 'r' },
          { s: `*${m.rank}위*`, a: 'r' },
          { s: `*${쉼표(m.gap)}*`, a: 'r' },
          { s: m.room != null ? 쉼표(m.room) + (able ? '원 ✔' : '원') : '—', a: 'r', c: able ? 파랑 : 먹 },
        ]
      }), Object.assign([0.11, 0.37, 0.1, 0.12, 0.16, 0.14], { a: ['l', 'l', 'r', 'r', 'r', 'r'] }))
    const top = miss[0]
    if (top.enough && (top.room || 0) >= top.gap) {
      g.글(`가장 아까운 자리는 *${fn(top.name)}*입니다. *${쉼표(top.gap)}원*만 낮췄으면 ` +
           `${쉼표(top.n)}곳 가운데 1순위였고, 하한선까지는 아직 *${쉼표(top.room)}원*이 남아 있었습니다.`,
           { pt: 11.5, 위: PT(10) })
    }
  }

  /* ── 금액대별 ───────────────────────────────────────── */
  const band = d.금액대 || []
  if (band.length) {
    표제(g, '금액대별 성적')
    네모표(g, ['공사 규모', '투찰', '낙찰', '평균 등수'],
      band.map((b) => [b.칸, `${b.투찰}건`, `${b.낙찰}건`, `${b.평균등수}위`]),
      [0.4, 0.2, 0.2, 0.2])
  }

  /* ── 실격 해부 ───────────────────────────────────────── */
  if (dqa) {
    표제(g, `하한선 아래 ${dqa.건}건 — 왜 떨어졌나`, true)
    g.글(`등수에서 진 게 아닙니다. *심사에 올라가지도 못한* 자리입니다. 개찰 ${dqa.전체}건 가운데 ` +
         `*${dqa.건}건*, 넣은 금액을 다 합치면 *${돈(dqa.버린돈)}*어치입니다.`, { pt: 10.5 })
    const rows = [{ k: '모자란 정도', v: `${Number(dqa.모자란pp중앙).toFixed(3)}%p`,
                    d: `가운데값 · 가장 큰 것은 ${Number(dqa.모자란pp최대).toFixed(3)}%p` }]
    if (dqa.기관쏠림 && dqa.기관쏠림.length) {
      rows.push({ k: '가장 잦은 곳', v: `${dqa.기관쏠림[0][1]}건`, d: fi(dqa.기관쏠림[0][0]) })
    }
    견줌(g, rows)
    if (dqa.기관쏠림 && dqa.기관쏠림.length && dqa.기관쏠림[0][1] >= 2) {
      상자글(g, `실격 ${dqa.건}건 가운데 *${dqa.기관쏠림[0][1]}건이 «${fi(dqa.기관쏠림[0][0])}» 한 곳*에서 ` +
             '나왔습니다. 그 기관의 하한율이나 A값을 잘못 보고 계신 게 아닌지 확인해 보십시오 — ' +
             '우연이라기엔 한쪽으로 너무 쏠렸습니다.', { 배경: '#eff4ff', 테: 파랑 })
    }
    기록표(g, ['개찰', '공고', '참가', '낸 금액', '하한선', '모자란 액'],
      dqa.목록.map((m) => [
        { s: String(m.dt).slice(5, 10), c: 흐림 },
        { s: fn(m.name), sub: fi(m.inst) },
        { s: 쉼표(m.n), a: 'r' },
        { s: 돈(m.amt), a: 'r' },
        { s: 돈(m.limit), a: 'r' },
        { s: `*${쉼표(m.short || 0)}원*`, a: 'r', c: 녹 },
      ]), Object.assign([0.11, 0.35, 0.1, 0.15, 0.15, 0.14], { a: ['l', 'l', 'r', 'r', 'r', 'r'] }))
    const small = dqa.목록.filter((m) => (m.short || 0) < 100000)
    if (small.length) {
      const m = small.reduce((a, b) => (a.short <= b.short ? a : b))
      g.글(`이 중 *${fn(m.name)}*는 *${쉼표(m.short)}원* 모자라 떨어졌습니다. ${돈(m.amt)}짜리 공사에서 말입니다.`,
           { pt: 11.5, 위: PT(10) })
    }
  }

  /* ── 기관별 낙찰선 ────────────────────────────────────── */
  const ib = d.기관낙찰선 || []
  if (ib.length) {
    표제(g, '이 기관들은 «얼마»에서 갈렸나')
    g.글('1순위 금액이 낙찰하한선보다 몇 %p 위였는지를 기관마다 모은 것입니다. ' +
         '*다음에 그 기관에 넣을 때 겨눌 자리*입니다.', { pt: 10.5 })
    네모표(g, ['발주기관', '건', '최저', '가운데', '최고'],
      ib.map((x) => [fi(x.기관), String(x.건), pp(x.최저), `*${pp(x.중앙)}*`, pp(x.최고)]),
      [0.36, 0.1, 0.18, 0.18, 0.18])
    g.글('건수가 적은 기관은 참고만 하십시오 — 한두 건으로는 «그 기관의 버릇»이라 말하기 어렵습니다.',
         { pt: 8.5, 색: 흐림, 위: PT(6) })
  }

  표제(g, '어느 기관에 많이 냈나')
  const many = (d.기관 || []).filter(([, n]) => n >= 2).slice(0, 6)
  const ones = (d.기관 || []).filter(([, n]) => n < 2).map(([i]) => i)
  if (many.length) {
    const mx = Math.max(...many.map(([, n]) => n)) || 1
    막대(g, many.map(([i, n]) => ({ k: fi(i), pct: n / mx * 100, v: `${n}건` })), 150)
  }
  if (ones.length) {
    g.글(`한 건씩 낸 곳 ${ones.length}곳 — ${ones.slice(0, 8).map(fi).join(' · ')}`,
         { pt: 8.5, 색: 흐림, 위: PT(6) })
  }

  /* ── 다음에 넣을 자리 ─────────────────────────────────── */
  const nxt = d.다음자리 || []
  if (nxt.length) {
    표제(g, '다음에 넣을 자리 다섯', true)
    g.글('지금 *마감 전*인 공고 가운데, 그동안 넣으셨던 기관·지역·금액대에 맞는 것을 골랐습니다. ' +
         '금액은 *K-건설맵 권장 투찰금액*입니다 — 그대로 쓰시라는 게 아니라 *겨냥할 자리*로 보십시오.',
         { pt: 10.5 })
    기록표(g, ['마감', '공고', '기초금액', '권장 투찰금액', '투찰률'],
      nxt.map((x) => [
        { s: String(x.close).slice(5, 10), sub: String(x.close).slice(11, 16), c: 흐림 },
        { s: fn(x.name), sub: fi(x.inst) + ((x.같은기관 || 0) >= 2 ? ' · 늘 넣으시던 곳'
            : (x.같은기관 ? ' · 전에 한 번 넣으신 곳' : ' · 같은 지역')) },
        { s: 돈(x.base), a: 'r' },
        { s: `⟦${쉼표(x.권장금액)}⟧`, a: 'r' },
        { s: `${Number(x.권장투찰률).toFixed(3)}%`, a: 'r' },
      ]), Object.assign([0.12, 0.38, 0.16, 0.2, 0.14], { a: ['l', 'l', 'r', 'r', 'r'] }))
    g.글('낙찰하한율·A값은 공고서에 실린 값을 그대로 썼습니다. 권장금액은 사정률 가운데값을 기준으로 ' +
         '잡은 것이라 그날 예정가격에 따라 달라집니다. 마감 시각을 꼭 확인하십시오 — ' +
         '이 종이를 받으신 뒤에 마감된 자리가 있을 수 있습니다.', { pt: 8.5, 색: 흐림, 위: PT(6) })
  }

  /* ── 개찰 하나하나 ───────────────────────────────────── */
  표제(g, '개찰 하나하나')
  기록표(g, ['개찰', '공고', '참가', '내 금액', '내 등수', '바로투찰'],
    R.map((r) => {
      const b = r.baro
      const btxt = !b ? '—' : (b.dq ? '실격' : (b.beat ? '1순위' : (b.rank_lo ? `${b.rank_lo}위권` : '—')))
      const myt = r.my_dq ? '실격' : `${r.rank}위`
      return [
        { s: String(r.dt).slice(5, 10), c: 흐림 },
        { s: fn(r.name), sub: fi(r.inst) },
        { s: 쉼표(r.n), a: 'r' },
        { s: 돈(r.amt), a: 'r' },
        { s: `*${myt}*`, a: 'r', c: r.rank === 1 ? 파랑 : (r.my_dq ? 녹 : 먹) },
        { s: `*${btxt}*`, a: 'r', c: 파랑 },
      ]
    }), Object.assign([0.11, 0.35, 0.1, 0.16, 0.13, 0.15], { a: ['l', 'l', 'r', 'r', 'r', 'r'] }))

  꼬리(g, '이 성적표는 *K-건설맵*이 만들어 *무료로* 드린 것입니다. *k-conmap.com* 에서 ' +
          '우리 회사 것도 받아 보십시오 — 회원가입 없습니다.',
    ['조달청이 공개한 개찰 결과를 정리한 것입니다. 따로 캐낸 자료가 아니며, 낙찰을 보장하지 않습니다.',
     '개찰 기록 · 권장 투찰금액 · 건설 서식 · 설계변경 엑셀 · 캐드 유틸은 모두 무료이고, ' +
     '내역서·견적서 작성만 유료입니다 (k-conmap.com/naeyeok).',
     `만든 날 ${d.기준.만든날} · 사정률 중앙값 ${d.기준.사정률중앙값} 기준`])

  g.쪽들.forEach((p, i) => 쪽바닥(p, i + 1, g.쪽들.length))
  return g.쪽들.map((p) => p.c)
}

function 중앙값(a) {
  const s = [...a].sort((x, y) => x - y)
  const n = s.length
  if (!n) return 0
  const h = n >> 1
  return n % 2 ? s[h] : (s[h - 1] + s[h]) / 2
}

/** 캔버스 쪽들 → PDF 한 벌 (A4) */
export async function PDF만들기(캔버스들) {
  const { PDFDocument } = await import('pdf-lib')
  const doc = await PDFDocument.create()
  doc.setTitle('입찰 성적표')
  doc.setProducer('K-건설맵 k-conmap.com')
  doc.setCreator('K-건설맵 k-conmap.com')
  for (const c of 캔버스들) {
    const blob = await new Promise((r) => c.toBlob(r, 'image/png'))
    const png = await doc.embedPng(new Uint8Array(await blob.arrayBuffer()))
    const p = doc.addPage([595.28, 841.89])
    p.drawImage(png, { x: 0, y: 0, width: 595.28, height: 841.89 })
  }
  return await doc.save()
}

export function 내려받기(bytes, 이름) {
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
  const a = document.createElement('a')
  a.href = url
  a.download = 이름
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}
