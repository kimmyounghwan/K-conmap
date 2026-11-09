/**
 * 🖼 종이(화면 글)를 그림 쪽으로 — 안전 웹 서식 «사이트에서 작성 → PDF» (G584 · 2026-11-08)
 *   소장님 11-08 「PDF 도 변환 안되게 해야 하지 않아? 사이트?」 — 10-21 «그림 PDF»(CLAUDE.md 🍚 밥줄 4번)가 엑셀 꼴 서식(격자작성)에만
 *   들어가 있었음: 안전 웹 서식 36가지(엑셀을 안 주는 서식)는 브라우저 인쇄라 PDF 에 글자가 남아 변환 프로그램으로 엑셀이 나왔음.
 *   ■ html2canvas(누를 때만 불러옴)로 종이(#fw-인쇄 .fw-paper)를 한 장 그림으로 찍고, 줄(tr) · 덩이 경계에서 A4 글자 칸(186 × 271mm)으로 자름.
 *     줄 · 짧은 표 · 서명 · 확인 항목 · 표 머리와 첫 줄은 가운데서 안 자름 · 쪽을 넘는 표는 다음 쪽 위에 머리줄을 다시 그림(인쇄와 같게).
 *   ■ 쪽 = 픽셀만 있는 캔버스(글자 층 없음) → PDF 는 lib/그림PDF.js(A4 · 여백 위 12 · 왼 12mm) · 인쇄는 같은 그림을 <img> 로.
 *   ⚠️ 완전히 막을 수는 없음(다시 치기 · 사진 글자 읽기) — 소장님께 말씀드린 그대로.
 *
 * 🖼 G585(11-08) 인쇄판찍기 — 도구마다 따로 짠 «인쇄 판»(#gp-인쇄 · 화면엔 숨김 · 인쇄 CSS 는 @media print 안)을 «인쇄 모양 그대로» 찍기.
 *   소장님 「엑셀은 그대로 · PDF 는 모두 그림」(11-08 «모든 작업은 사이트에서 하게 해줘» → 고르심) — 남은 도구 인쇄를 하나씩 그림으로.
 *   ■ html2canvas 가 만드는 복제본(onclone)에만 인쇄 CSS(@media print 안 규칙)를 화면 규칙으로 덧붙이고 몸 표(gp-인쇄중 …)를 달아
 *     인쇄 때와 같은 모양으로 폄 — 보는 화면은 그대로(깜빡임 없음). 복제본 창 폭 = 쪽 글자 칸 폭(인쇄 때 미디어 쿼리와 같게).
 *   ■ 자르기: 덩이 경계 · 글 줄 사이에서만 · 줄(tr) · break-inside: avoid 덩이 · 표 머리와 첫 줄은 안 자름 · break-before/after: page 는 꼭 자름 ·
 *     쪽을 넘는 표는 다음 쪽 위에 머리줄 다시(인쇄와 같게).
 *   ■ 한 장 맞춤: 마지막 쪽이 쪽의 1/4 이 안 되면(꼬리 한두 줄만 넘침) 1/z 넓게 펴서 찍고 z 배로 줄여 한 쪽 덜 씀(z ≥ 0.83) — 서식작성의 줄임과 같음.
 */
const MM = 96 / 25.4
export const 글칸mm = [186, 271]          // A4 210 × 297 − 여백(왼 · 오른 12 · 위 12 · 아래 14) — styles.css @page 와 같음
export const 여백mm = [12, 12]            // [왼, 위]

/** 자를 곳만 셈 — 쪽마다 {s, cut, 머리}(쪽나누기 · 한 장 맞춤이 같이 씀 · G609 에서 떼어 냄) */
function 쪽자르기({ H, 경계, 피함, 표들, 꼭 = [] }, 쪽H) {
  const 자를수 = (y) => !피함.some(([a, b]) => b - a <= 쪽H && a + 0.5 < y && y < b - 0.5)
  const 쪽들 = []
  let s = 0
  for (let 번 = 0; s < H - 0.5 && 번 < 300; 번++) {
    const 머리 = 표들.find((t) => s > t.hb - 0.5 && s > t.a + 0.5 && s < t.b - 0.5) || null   // 표 몸 가운데서 시작하는 쪽 — 머리줄을 다시
    const 머리높 = 머리 ? 머리.hb - 머리.ha : 0
    const 끝 = s + 쪽H - 머리높
    let cut = H
    const 꼭자름 = 꼭.filter((y) => y > s + 8 && y < H - 0.5 && y <= 끝 + 0.5)
    if (꼭자름.length) cut = Math.min(...꼭자름)
    else if (끝 < H - 0.5) {
      const 후보 = 경계.filter((y) => y > s + 8 && y <= 끝 + 0.5 && 자를수(y))
      cut = 후보.length ? Math.min(Math.max(...후보), 끝) : 끝
    }
    쪽들.push({ s, cut, 머리 })
    s = cut
  }
  return 쪽들
}

/** 큰 그림 → 쪽 그림들(글자 칸 크기) — 잰 것(경계 · 피함 · 표들 · 꼭)에서 자를 곳을 골라 */
function 쪽나누기(큰, 잰, { 쪽H, k, zz, 쪽px }) {
  const { H } = 잰
  const 쪽들 = 쪽자르기(잰, 쪽H)
  const 그림쪽 = 쪽들.map(({ s: a, cut, 머리 }) => {
    const cv = document.createElement('canvas')
    cv.width = 쪽px[0]; cv.height = 쪽px[1]
    const g = cv.getContext('2d')
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, cv.width, cv.height)
    let y = 0
    if (머리) {
      const h = 머리.hb - 머리.ha
      g.drawImage(큰, 0, 머리.ha * k, 큰.width, h * k, 0, 0, 큰.width * zz, h * k * zz)
      y = h * k * zz
    }
    const h = Math.min(cut, H) - a
    if (h > 0) g.drawImage(큰, 0, a * k, 큰.width, h * k, 0, y, 큰.width * zz, h * k * zz)
    return cv
  })
  /* 🩹 G597 빈 쪽은 빼기 — 한 쪽보다 긴 덩이가 쪽 나눔(break-after) 앞에서 넘치면 남은 빈 아래 여백만 한 쪽이 됐음
     (안전카드 «표지» 긴 글 — 전 방식은 그 쪽에 바닥 글 한 줄) · 흰 쪽(점 하나 없음)만 빼고 · 적어도 한 쪽은 남김 */
  const 남길 = 그림쪽.filter((cv) => !흰쪽(cv))
  if (!남길.length) return 그림쪽.slice(0, 1)
  for (const cv of 그림쪽) if (!남길.includes(cv)) { cv.width = cv.height = 1 }
  return 남길
}

/** 쪽 그림이 온통 흰가 — 줄이지 않고 제 크기 그대로 64줄 띠씩 봄(가는 선 한 줄 · 점 하나라도 있으면 흰 쪽 아님 · 처음 만난 점에서 바로 멈춤)
 *  못 읽으면(그림이 막힘 등) 흰 쪽 아님으로 — 쪽을 빼는 쪽으로는 절대 안 틀림 */
function 흰쪽(cv) {
  try {
    const g = cv.getContext('2d')
    const W = cv.width
    for (let y = 0; y < cv.height; y += 64) {
      const d = g.getImageData(0, y, W, Math.min(64, cv.height - y)).data
      for (let i = 0; i < d.length; i += 4) if (d[i] < 250 || d[i + 1] < 250 || d[i + 2] < 250) return false
    }
    return true
  } catch (e) { return false }
}

/** 표 — 머리줄(thead)과 첫 줄 자리 · 머리줄 다시 쓸 표 */
function 표재기(el, 자리, 피함, 표들) {
  for (const t of el.querySelectorAll('table')) {
    const [a, b] = 자리(t)
    const 첫 = t.tBodies[0] && t.tBodies[0].rows[0]
    if (첫) 피함.push([a, 자리(첫)[1]])          // 제목 · 머리줄만 쪽 끝에 남지 않게(첫 줄과 같이)
    if (t.tHead) { const [ha, hb] = 자리(t.tHead); 표들.push({ a, b, ha, hb }) }
  }
}

/**
 * 종이 하나를 글자 칸 크기 그림 쪽들로
 * @param {HTMLElement} el  .fw-paper(화면에 펼쳐 둔 것 — #fw-인쇄.fw-그림)
 * @param {{z?: number, 배율?: number, 한도?: number}} o  z = 종이 줄임(서명만 넘어갈 때 0.83 까지) · 배율 = 1 CSS px 당 그림 px
 * @returns {Promise<HTMLCanvasElement[]>}
 */
export async function 종이찍기(el, { z = 1, 배율 = 2, 한도 = 12e6 } = {}) {
  const { default: html2canvas } = await import('html2canvas')
  if (document.fonts && document.fonts.ready) { try { await document.fonts.ready } catch (e) { /* 없음 */ } }
  const 상자 = el.getBoundingClientRect()
  const W = 상자.width, H = 상자.height
  const zz = z > 0 && z <= 1 ? z : 1
  const 쪽H = (글칸mm[1] * MM) / zz            // 원본(CSS px)에서 한 쪽에 들어가는 높이
  let k = 배율
  if (W * H * k * k > 한도) k = Math.max(1, Math.sqrt(한도 / (W * H)))   // 아이폰 캔버스 한도 — 긴 서식은 조금 덜 곱게
  const 큰 = await html2canvas(el, { scale: k, backgroundColor: '#ffffff', logging: false, useCORS: true })
  const 위0 = 상자.top
  const 자리 = (n) => { const r = n.getBoundingClientRect(); return [r.top - 위0, r.bottom - 위0] }
  const 경계 = new Set([H])
  for (const n of el.querySelectorAll('tr, caption, table, .fw-mark, .fw-h, .fw-text, .fw-cl-i, .fw-sign, .fw-date, .fw-who, .fw-note, .fw-law')) {
    const [a, b] = 자리(n); 경계.add(a); 경계.add(b)
  }
  const 피함 = []
  for (const n of el.querySelectorAll('tr, .fw-cl-i, .fw-sign, table.keep, table.fw-chk')) 피함.push(자리(n))
  const 표들 = []
  표재기(el, 자리, 피함, 표들)
  const 쪽px = [Math.round(글칸mm[0] * MM * k), Math.round(글칸mm[1] * MM * k)]
  const 결과 = 쪽나누기(큰, { H, 경계: [...경계], 피함, 표들 }, { 쪽H, k, zz, 쪽px })
  큰.width = 큰.height = 1
  return 결과
}

/** 인쇄 CSS — @media print 안 규칙(화면용 아님 · @page 뺌)을 글로 모음 */
function 인쇄규칙() {
  const out = []
  const 걷기 = (list) => {
    for (const r of list) {
      if (r.type === 4) {                                    // CSSRule.MEDIA_RULE
        const m = r.media.mediaText
        if (/\bprint\b/.test(m) && !/\bscreen\b/.test(m)) { for (const x of r.cssRules) if (x.type !== 6) out.push(x.cssText) }   // 6 = PAGE_RULE
        else 걷기(r.cssRules)
      } else if (r.type === 12) 걷기(r.cssRules)             // @supports
    }
  }
  for (const ss of document.styleSheets) { let rs = null; try { rs = ss.cssRules } catch (e) { /* 남의 글꼴 CSS — 못 읽음 */ } if (rs) 걷기(rs) }
  return out.join('\n')
}

const 블록꼴 = /^(block|table|table-row|table-row-group|table-header-group|table-footer-group|table-caption|flex|grid|list-item|flow-root)$/

/** 🖼 G587 겹친 칸 줄(border-collapse) 고침 — 복제본에서만. 그림으로 찍으면 맞닿은 두 칸이 같은 줄을 따로 그어 굵게 나옴
 *  → 표마다 «떨어진 칸» 으로 바꾸고 맞닿은 줄은 한 번씩만 · 표 자체에 테두리가 있으면 그 쪽 끝 칸 줄은 지움(표 테두리 하나만). 줄 굵기 · 색은 칸에 적힌 그대로.
 *  🩹 G612 이웃을 보고 지움 — 예전엔 «맨 왼쪽 · 맨 위 칸이 아니면 왼 · 위 줄을 지움»(왼 · 위 이웃이 그 줄을 그린다고 봄)이라 엑셀 화면처럼 칸마다 줄이 다른 표
 *     (A열이 빈 여백 칸 · 줄 없는 칸 옆)에서 표 왼쪽 · 위 테두리가 통째로 사라졌음(원클릭 서류) → 겹친 줄 고르기(CSS 2.1 17.6.2.1)처럼:
 *     이웃(왼 · 위) 줄이 다 이 칸 줄만큼 세면(굵기 → 꼴 · 같으면 왼 · 위 칸이 이김) 이 칸 줄을 지우고, 이 칸 줄이 더 세면 이 칸 안에 드는 이웃 줄을 지움 · 이웃이 없으면 그대로.
 *     계획(칸줄재기 · 줄 차례마다)과 적용(칸줄적용)을 나눔 — 긴 판 덩이 복제본(솎은 줄)에도 첫 복제본과 «같은» 줄을 씀(줄 높이 · 자리가 같게). */
const 줄세기순 = { double: 8, solid: 7, dashed: 6, dotted: 5, ridge: 4, outset: 3, groove: 2, inset: 1 }
function 칸줄재기(판) {
  const 창 = 판.ownerDocument.defaultView
  const 줄번 = new Map([...판.querySelectorAll('tr')].map((x, i) => [x, i]))
  const 고칠표 = []
  const 지움 = new Map()       // tr 차례 → 칸(cellIndex)마다 지울 쪽 글자('L' 'T' 'R' 'B')
  const 세기 = (s, k) => { const w = parseFloat(s[`border${k}Width`]) || 0; const st = s[`border${k}Style`]; return !w || st === 'none' || st === 'hidden' ? 0 : w * 10 + (줄세기순[st] || 0) }
  ;[...판.querySelectorAll('table')].forEach((t, 표번) => {
    const ts = 창.getComputedStyle(t)
    if (ts.borderCollapse !== 'collapse') return
    const 칸들 = [...t.querySelectorAll('th, td')].filter((c) => c.closest('table') === t)
    if (!칸들.length) return
    고칠표.push(표번)
    const 줄 = 칸들.map((c) => { const r = c.getBoundingClientRect(); const s = 창.getComputedStyle(c); return { c, l: r.left, t: r.top, r: r.right, b: r.bottom, L: 세기(s, 'Left'), T: 세기(s, 'Top'), R: 세기(s, 'Right'), B: 세기(s, 'Bottom'), 지: '' } })
    let 왼 = Infinity, 위 = Infinity, 오른 = -Infinity, 아래 = -Infinity
    for (const x of 줄) { if (x.l < 왼) 왼 = x.l; if (x.t < 위) 위 = x.t; if (x.r > 오른) 오른 = x.r; if (x.b > 아래) 아래 = x.b }
    const 표줄 = { l: parseFloat(ts.borderLeftWidth) || 0, t: parseFloat(ts.borderTopWidth) || 0, r: parseFloat(ts.borderRightWidth) || 0, b: parseFloat(ts.borderBottomWidth) || 0 }
    const 키 = (v) => Math.round(v * 2)
    const 오른끝 = new Map(), 아래끝 = new Map()
    const 넣 = (m, k, x) => { const a = m.get(k); if (a) a.push(x); else m.set(k, [x]) }
    for (const x of 줄) { 넣(오른끝, 키(x.r), x); 넣(아래끝, 키(x.b), x) }
    const 곁 = (m, v) => { const 나 = []; const k0 = 키(v); for (let d = -3; d <= 3; d++) { const a = m.get(k0 + d); if (a) for (const n of a) 나.push(n) } return 나 }
    for (const x of 줄) {
      if (x.l - 왼 > 1.5) {
        const 이웃 = 곁(오른끝, x.l).filter((n) => n !== x && n.t < x.b - 0.5 && n.b > x.t + 0.5)
        if (이웃.length && 이웃.every((n) => n.R >= x.L)) x.지 += 'L'
        else if (이웃.length) for (const n of 이웃) if (n.R > 0 && n.t >= x.t - 1 && n.b <= x.b + 1) n.지 += 'R'
      } else if (표줄.l > 0) x.지 += 'L'
      if (x.t - 위 > 1.5) {
        const 이웃 = 곁(아래끝, x.t).filter((n) => n !== x && n.l < x.r - 0.5 && n.r > x.l + 0.5)
        if (이웃.length && 이웃.every((n) => n.B >= x.T)) x.지 += 'T'
        else if (이웃.length) for (const n of 이웃) if (n.B > 0 && n.l >= x.l - 1 && n.r <= x.r + 1) n.지 += 'B'
      } else if (표줄.t > 0) x.지 += 'T'
      if (표줄.r > 0 && 오른 - x.r < 1.5) x.지 += 'R'
      if (표줄.b > 0 && 아래 - x.b < 1.5) x.지 += 'B'
    }
    for (const x of 줄) {
      if (!x.지) continue
      const i = 줄번.get(x.c.parentElement)
      if (i == null) continue
      let a = 지움.get(i)
      if (!a) { a = []; 지움.set(i, a) }
      a[x.c.cellIndex] = (a[x.c.cellIndex] || '') + x.지
    }
  })
  return { 고칠표, 지움 }
}
/** 칸줄재기 계획을 복제본에 — 줄차례 = 복제본 tr(메움 줄 뺌) 하나하나가 원본 몇째 줄인지(솎은 덩이) · 없으면 그대로 */
function 칸줄적용(판, 계획, 줄차례 = null) {
  const 표들 = [...판.querySelectorAll('table')]
  for (const i of 계획.고칠표) { const t = 표들[i]; if (t) { t.style.borderCollapse = 'separate'; t.style.borderSpacing = '0' } }
  const 줄 = [...판.querySelectorAll('tr')].filter((x) => !x.hasAttribute('data-kcm-메움'))
  줄.forEach((tr, k) => {
    const a = 계획.지움.get(줄차례 ? 줄차례[k] : k)
    if (!a) return
    a.forEach((지, j) => {
      const c = 지 && tr.cells[j]
      if (!c) return
      if (지.includes('L')) c.style.borderLeftWidth = '0'
      if (지.includes('T')) c.style.borderTopWidth = '0'
      if (지.includes('R')) c.style.borderRightWidth = '0'
      if (지.includes('B')) c.style.borderBottomWidth = '0'
    })
  })
}

/** 복제본 안 종이 재기 — 경계(덩이 위 · 아래 · 글 줄) · 피함(줄 · avoid 덩이) · 표 · 꼭(page 나눔) */
function 판재기(el) {
  const 위0 = el.getBoundingClientRect().top
  const 자리 = (n) => { const r = n.getBoundingClientRect(); return [r.top - 위0, r.bottom - 위0] }
  const H = el.getBoundingClientRect().height
  const 경계 = new Set([H])
  const 피함 = []
  const 꼭 = []
  const 붙임 = []     // 제목(h1~h6 · <summary> · break-after: avoid) — 다음 글 첫 줄과 같은 쪽에(쪽 끝에 제목만 남지 않게 · G588 일용 «🧾 공제 표» 제목만 첫 쪽 끝에 남았음)
  const 창 = el.ownerDocument.defaultView
  /* 🧵 G612 큰 판(칸 수천 — 긴 산출서)은 칸(td · th) 안은 안 봄 — 줄(tr)이 이미 자를 곳 · 안 자를 곳이라 칸 안 글 줄은 쓸 데가 없음(한 쪽보다 높은 줄만 빼고)
     — 칸마다 꼴 · 자리를 읽느라 3000줄 산출서에서 몇 초씩 걸렸음. 작은 판은 예전 그대로. */
  const 큰판 = el.getElementsByTagName('*').length > 4000
  const 칸안 = (n) => { for (let p = n.parentElement; p && p !== el; p = p.parentElement) if (p.tagName === 'TD' || p.tagName === 'TH') return true; return false }
  for (const n of el.querySelectorAll('*')) {
    if (큰판 && (n.tagName === 'TD' || n.tagName === 'TH' || 칸안(n))) continue
    const cs = 창.getComputedStyle(n)
    if (cs.display === 'none') continue
    const [a, b] = 자리(n)
    /* 쪽 나눔(break-before/after: page)은 높이 0 인 빈 덩이(노무비 지급명세서 .tp-pb)에도 걸림 — 높이를 보기 전에 셈
       (G589 — 전엔 빈 덩이를 먼저 걸러 «③ 신고용 집계» 가 첫 쪽에 붙고 한 장으로 줄었음) */
    if (/^(page|always|left|right)$/.test(cs.breakBefore) || cs.pageBreakBefore === 'always') 꼭.push(a)
    if (/^(page|always|left|right)$/.test(cs.breakAfter) || cs.pageBreakAfter === 'always') 꼭.push(b)
    if (b - a <= 0) continue
    if (블록꼴.test(cs.display)) { 경계.add(a); 경계.add(b) }
    if (n.tagName === 'TR' || cs.breakInside === 'avoid' || cs.pageBreakInside === 'avoid' || cs.breakInside === 'avoid-page') 피함.push([a, b])
    if (/^(H[1-6]|SUMMARY)$/.test(n.tagName) || cs.breakAfter === 'avoid' || cs.breakAfter === 'avoid-page' || cs.pageBreakAfter === 'avoid') 붙임.push([a, b])
  }
  /* 글 줄 사이 — 긴 덩이(특기사항 칸 · 긴 글)도 글 줄 가운데서 자르지 않게 */
  const 문서 = el.ownerDocument
  const 걷개 = 문서.createTreeWalker(el, 4)                // NodeFilter.SHOW_TEXT
  const 범위 = 문서.createRange()
  const 줄 = []
  for (let t = 걷개.nextNode(); t; t = 걷개.nextNode()) {
    if (!t.nodeValue || !t.nodeValue.trim()) continue
    if (큰판 && 칸안(t)) continue
    범위.selectNodeContents(t)
    for (const r of 범위.getClientRects()) { 경계.add(r.top - 위0); 경계.add(r.bottom - 위0); if (r.height > 0) 줄.push([r.top - 위0, r.bottom - 위0]) }
  }
  for (const [a, b] of 붙임) {      // 제목 위 ~ 다음 글 첫 줄 아래는 자르지 않음(그 사이가 한 쪽보다 길면 쪽나누기가 안 봄)
    let 끝 = Infinity
    for (const [t, u] of 줄) if (t >= b - 1 && u < 끝) 끝 = u
    if (끝 < Infinity) 피함.push([a, 끝])
  }
  const 표들 = []
  표재기(el, 자리, 피함, 표들)
  return { W: el.getBoundingClientRect().width, H, 경계: [...경계].filter((y) => y >= 0 && y <= H + 0.5), 피함, 표들, 꼭 }
}

/** 🧵 G612 덩이 밖 숨기기(복제본만) — 자리는 그대로(visibility) · 그림 그리개가 덩이 밖 칸까지 다 읽느라 느리던 것
 *  줄(tr)은 합친 칸(rowspan)이 줄 밖으로 내려가므로 칸 아래까지 봄 · 덩이와 겹치는 것은 안으로 들어가 봄 */
function 가리기(판, s, e) {
  const 위0 = 판.getBoundingClientRect().top
  const 걷기 = (부모) => {
    for (const n of 부모.children) {
      const r = n.getBoundingClientRect()
      if (r.width === 0 && r.height === 0) { if (n.children.length) 걷기(n); continue }
      const a = r.top - 위0
      let b = r.bottom - 위0
      if (n.tagName === 'TR') for (const c of n.children) if (c.rowSpan !== 1) b = Math.max(b, c.getBoundingClientRect().bottom - 위0)
      if (b < s - 2 || a > e + 2) n.style.visibility = 'hidden'
      else if (n.tagName !== 'TR' && n.children.length) 걷기(n)
    }
  }
  걷기(판)
}

/** 🧵 G612 줄 솎기에 쓸 표 몸(tbody)들 — 칸 안에 든 표는 뺌(그 줄과 같이 감) */
function 솎을몸들(판) {
  return [...판.querySelectorAll('tbody')].filter((tb) => { const 칸 = tb.parentElement && tb.parentElement.closest('td, th'); return !(칸 && 판.contains(칸)) })
}

/** 🧵 G612 줄 계획(첫 복제본에서) — 몸마다 줄 묶음(rowspan 으로 이어진 줄들)과 자리 · 칸 수 · 표 아래 끝 */
function 줄계획(판) {
  const 위0 = 판.getBoundingClientRect().top
  const 차례 = new Map([...판.querySelectorAll('tr')].map((x, i) => [x, i]))
  return 솎을몸들(판).map((tb) => {
    const 줄 = [...tb.rows]
    const 자리 = 줄.map((tr) => { const r = tr.getBoundingClientRect(); let b = r.bottom; for (const c of tr.cells) if (c.rowSpan !== 1) b = Math.max(b, c.getBoundingClientRect().bottom); return [r.top - 위0, b - 위0] })
    const 묶음 = []
    for (let i = 0; i < 줄.length;) {
      let 끝 = i
      for (let j = i; j <= 끝; j++) for (const c of 줄[j].cells) 끝 = Math.max(끝, Math.min(줄.length - 1, j + (c.rowSpan > 0 ? c.rowSpan : 줄.length - j) - 1))
      let a = Infinity, b = -Infinity
      for (let j = i; j <= 끝; j++) { a = Math.min(a, 자리[j][0]); b = Math.max(b, 자리[j][1]) }
      묶음.push([i, 끝, a, b])
      i = 끝 + 1
    }
    const 칸수 = Math.max(1, ...줄.map((tr) => [...tr.cells].reduce((n, c) => n + (c.colSpan || 1), 0)))
    const 표 = tb.closest('table')
    return { 줄: 줄.map((x) => 차례.get(x)), 자리, 묶음, 칸수, 표끝: 표 ? 표.getBoundingClientRect().bottom - 위0 : 0 }
  })
}

/** 🧵 G612 덩이 [s, e] 의 솎기 — 버릴 줄(판 안 tr 차례) · 몸마다 메움(위 줄 자리) */
function 솎기(줄들, s, e) {
  const 버림 = new Set()
  const 메움 = []
  줄들.forEach((몸, 몸번) => {
    if (!몸.줄.length) return
    const 남 = 몸.묶음.filter(([, , a, b]) => b >= s - 2 && a <= e + 2)
    const 첫 = 남.length ? 남[0][0] : -1
    const 끝 = 남.length ? 남[남.length - 1][1] : -1
    몸.줄.forEach((k, i) => { if (첫 < 0 || i < 첫 || i > 끝) 버림.add(k) })
    if (첫 > 0) 메움.push({ 몸번, 높: 몸.자리[첫][0] - 몸.자리[0][0], 기대: 몸.자리[첫][0], 남음: true, 칸수: 몸.칸수 })
    else if (첫 < 0 && 몸.자리[0][0] < s) 메움.push({ 몸번, 높: 몸.표끝 - 몸.자리[0][0], 기대: 몸.표끝, 남음: false, 칸수: 몸.칸수 })
  })
  return { 버림, 메움 }
}

/** 🧵 G612 메움 줄 넣기(복제본) — 버린 위 줄 자리만큼 빈 줄 하나 · 다 편 뒤 «메움맞춤» 으로 자리를 정확히 */
function 메움넣기(판, 메움) {
  const 몸들 = 솎을몸들(판)
  const 넣은 = []
  for (const m of 메움) {
    const tb = 몸들[m.몸번]
    if (!tb) continue
    const 문서 = 판.ownerDocument
    const tr = 문서.createElement('tr')
    const td = 문서.createElement('td')
    td.colSpan = m.칸수
    td.style.cssText = `height:${m.높}px;padding:0;border:0;margin:0;line-height:0;font-size:0;background:none;box-shadow:none`
    tr.style.height = m.높 + 'px'
    tr.setAttribute('data-kcm-메움', '1')
    tr.appendChild(td)
    tb.insertBefore(tr, tb.firstChild)
    넣은.push({ m, tb, tr, td })
  }
  return 넣은
}
function 메움맞춤(판, 넣은) {
  for (const { m, tb, tr, td } of 넣은) {         // 위에서부터 — 앞 표를 맞추면 뒤 표 자리도 따라 옴
    const 위0 = 판.getBoundingClientRect().top
    const 표 = tb.closest('table')
    const 지금 = m.남음 ? (tb.rows[1] ? tb.rows[1].getBoundingClientRect().top - 위0 : NaN) : (표 ? 표.getBoundingClientRect().bottom - 위0 : NaN)
    const 차 = m.기대 - 지금
    if (Number.isFinite(차) && Math.abs(차) > 0.05) { const h = Math.max(0, m.높 + 차); td.style.height = h + 'px'; tr.style.height = h + 'px' }
  }
}

/** 쪽 그림 아래 끝(마지막 흰 아닌 줄 + 1) — 64줄 띠로 밑에서부터 · 못 읽으면 끝까지 */
export function 그림아래끝(cv) {
  try {
    const g = cv.getContext('2d')
    const W = cv.width
    for (let y1 = cv.height; y1 > 0; y1 -= 64) {
      const y0 = Math.max(0, y1 - 64)
      const d = g.getImageData(0, y0, W, y1 - y0).data
      for (let i = d.length - 4; i >= 0; i -= 4) if (d[i] < 250 || d[i + 1] < 250 || d[i + 2] < 250) return y0 + Math.floor(i / 4 / W) + 1
    }
    return 0
  } catch (e) { return cv.height }
}

/**
 * 🖼 G585 인쇄 판 하나를 «인쇄 모양 그대로» 그림 쪽들로 — 판(el)은 화면엔 숨어 있어도 됨(복제본에서만 폄)
 * @param {HTMLElement} el  #gp-인쇄 안의 쪽 덩이(예: .il-쪽)
 * @param {{몸표?: string[], 쪽?: {폭: number, 높: number}, 맞춤?: boolean, 배율?: number, 한도?: number, 더CSS?: string, 칸줄?: boolean,
 *          손질?: Function, z0?: number, 쪽마다?: Function, 홀로?: boolean}} o
 *   몸표 = 인쇄 때 몸에 다는 표(gp-인쇄중 …) · 쪽 = 글자 칸 mm(그 판의 @page 와 같게) · 맞춤 = 마지막 쪽이 1/4 안 되면 줄여 한 쪽 덜 씀 ·
 *   칸줄 = 겹친 칸 줄을 한 번씩만(G587 — 합친 칸 있는 표도 · 도구마다 CSS 를 따로 안 써도 됨) · 손질(판, 문서) = 복제본만 고치기(G588 접은 것 펴기 등)
 *   🧵 G612 · z0 = 판을 처음부터 이만큼 줄여(키워) 찍음 — 판 폭 = 쪽 폭 / z0 · 그림 배율 = 배율 × z0(엑셀 화면 «한 쪽에 맞춤» · 쪽 채움 — CSS zoom 은
 *            그림 그리개가 글자 크기를 못 따라가 낱말 사이가 벌어졌음) · 쪽마다(그림, 번째, 모두) = 쪽이 나올 때마다 바로 넘김(넘긴 뒤 그림은 지움 — 쪽마다 JPEG 로 바로) ·
 *            홀로 = 복제본에 판(과 그 위 줄기)만 — 몸 밑 다른 것(사이트 화면)은 안 옮김(떼어 둔 인쇄 판일 때만 · 화면 덩이(대상)엔 쓰지 말 것)
 *   🧵 G612 긴 판 나눠 찍기 — 그림 넓이가 한도(아이폰 캔버스 ≈ 16M 의 안쪽 12M)를 넘으면 쪽을 묶어 덩이마다 따로 찍음(html2canvas y · height) ·
 *            덩이 밖 표 줄은 복제부터 안 하고(위 줄 자리는 빈 줄 하나로 메움 · 메운 뒤 자리 맞춤) · 그 밖은 visibility 로 숨겨 그림 그리개가 안 읽음 ·
 *            쪽 위에 다시 그릴 머리줄은 그 줄이 든 덩이에서 그림을 떠 둠. 예전처럼 배율을 1 까지 내리지 않음(긴 판도 같은 선명도).
 * @returns {Promise<{쪽들: HTMLCanvasElement[], z: number, 쪽수: number}>}  쪽마다를 주면 쪽들은 빈 배열
 */
/** 🧵 G612 그림 넓이 한도 — 아이폰 사파리 캔버스 ≈16.7M px(그 안쪽 12M) · 폰 메모리 → 12M · PC 는 32M(긴 판 덩이 수를 줄여 빠르게 — 3000줄 산출서 덩이 19 → 7) */
function 기기한도() {
  try { const ua = navigator.userAgent || ''; return /Mobi|Android|iP(hone|ad|od)/i.test(ua) || (navigator.maxTouchPoints > 1 && /Mac/.test(ua)) ? 12e6 : 32e6 } catch (e) { return 12e6 }
}
const 덩이높이한도 = 30000      // 그림 한 장 높이(px) — 크롬은 6만 5천을 넘으면 못 그림 · 넉넉히 안쪽

export async function 인쇄판찍기(el, { 몸표 = [], 쪽 = { 폭: 186, 높: 273 }, 맞춤 = true, 배율 = 2, 한도 = 기기한도(), 더CSS = '', 칸줄 = false, 손질 = null, z0 = 1, 쪽마다 = null, 홀로 = false } = {}) {
  const { default: html2canvas } = await import('html2canvas')
  if (document.fonts && document.fonts.ready) { try { await document.fonts.ready } catch (e) { /* 없음 */ } }
  const 규칙 = 인쇄규칙()
  const 표지 = 'k' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
  el.setAttribute('data-kcm-찍을', 표지)
  const 폭px = 쪽.폭 * MM
  const 높px = 쪽.높 * MM
  const 처음z = z0 > 0 && Number.isFinite(z0) ? z0 : 1
  let zz = 처음z           // 판 CSS px → 쪽 px (그림 = 판 CSS px × k × zz)
  let 판너비 = 처음z !== 1 ? (폭px / 처음z).toFixed(2) + 'px' : ''   // 복제본마다 같은 폭으로 펴려고 적어 둠
  let k = 배율             // 쪽 CSS px 당 그림 px
  let 잰 = null
  let 계획 = null          // { 쪽들, 덩이: [{s, e, a, b}] }
  let 줄들 = null          // 줄 계획(덩이가 둘 넘을 때만)
  let 덩이번 = 0
  let 솎음 = null          // 이번 덩이의 { 버림, 메움 }
  let 칸줄계획 = null      // 첫 복제본에서 정한 칸 줄(덩이 복제본에도 같게)
  const 원줄 = [...el.querySelectorAll('tr')]
  const 버릴줄 = new Set()
  const 바깥 = 홀로 ? (n) => n !== document.body && document.body.contains(n) && !n.contains(el) && !el.contains(n) && !/^(STYLE|LINK)$/.test(n.tagName) : () => false
  const 펴기 = (doc) => {
    for (const c of [...몸표, 'kcm-찍는중']) { doc.documentElement.classList.add(c); if (doc.body) doc.body.classList.add(c) }   // kcm-찍는중 — «그림만인쇄» 숨김(Ctrl+P 막기)이 복제본엔 안 걸리게
    const st = doc.createElement('style')
    st.textContent = 규칙 + '\n' + 더CSS
    doc.head.appendChild(st)
    const 판 = doc.querySelector(`[data-kcm-찍을="${표지}"]`)
    if (!판) return null
    if (typeof 손질 === 'function') { try { 손질(판, doc) } catch (e) { /* 손질 못 해도 찍음 */ } }   // G588 접은 것 펴기 같은 도구마다 손질(복제본만)
    /* 펼침 표(▼ · ▶ — <summary> 의 disclosure 표)는 그림 그리개가 못 그려 «1.» 로 나왔음(G588 일용 4대보험) → 글자 표로 바꿔 그대로 */
    const 창 = doc.defaultView
    for (const sm of 판.querySelectorAll('summary')) {
      const cs = 창.getComputedStyle(sm)
      if (cs.display === 'list-item' && /disclosure/.test(cs.listStyleType)) {
        const 열림 = !!(sm.parentElement && sm.parentElement.open)
        sm.style.listStyle = 'none'; sm.style.display = 'block'
        sm.insertBefore(doc.createTextNode(열림 ? '▾ ' : '▸ '), sm.firstChild)
      }
    }
    return 판
  }
  const 설정 = {
    scale: 배율 * zz, backgroundColor: '#ffffff', logging: false, useCORS: true,
    windowWidth: Math.round(폭px), scrollX: 0, scrollY: 0,
    ignoreElements: (n) => 바깥(n) || (버릴줄.size > 0 && n.tagName === 'TR' && 버릴줄.has(n)),
    onclone: (doc) => {
      if (!계획) {
        /* 첫 복제본 — 펴고 · 재고 · 맞춤 · 쪽 · 덩이 계획 */
        const 판 = 펴기(doc)
        if (!판) return
        if (칸줄) { 칸줄계획 = 칸줄재기(판); 칸줄적용(판, 칸줄계획) }
        if (판너비) { 판.style.width = 판너비; 판.style.maxWidth = 'none' }
        잰 = 판재기(판)
        /* 한 장 맞춤 — 꼬리만 넘치면 넓게 펴서 다시 잼(줄이면 표가 폭을 다 쓰게 · 인쇄의 zoom 과 같은 모양) */
        let P = 높px / zz
        const n = Math.max(1, Math.ceil((잰.H - 0.5) / P))
        const 꼭있음 = 잰.꼭.some((y) => y > 8 && y < 잰.H - 0.5)   // 쪽 나눔이 있는 판(노무비 신고용 집계 새 쪽)은 쪽을 합칠 수 없음 — 줄이지 않음(G589)
        let 줄임 = false
        if (맞춤 && n > 1 && !꼭있음) {
          const 끝쪽 = 잰.H - (n - 1) * P
          const 줄일 = ((n - 1) * P * 0.975) / 잰.H
          if (끝쪽 < P * 0.25 && 줄일 >= 0.83) {
            const z새 = Math.floor(zz * 줄일 * 1000) / 1000
            판너비 = (폭px / z새).toFixed(2) + 'px'
            판.style.width = 판너비; 판.style.maxWidth = 'none'
            잰 = 판재기(판)
            zz = z새
            if (Math.ceil((잰.H * zz - 0.5) / 높px) > n - 1) {   // 넓혀도 안 들어가면(드묾) 높이에 맞춰 더 줄임
              zz = Math.max(0.5 * 처음z, Math.floor((((n - 1) * 높px * 0.99) / 잰.H) * 1000) / 1000)
            }
            줄임 = true
          }
        }
        /* 🩹 G609 자를 곳 때문에 넘친 꼬리 — 높이로는 n 쪽에 꼭 들어가는데(위 맞춤은 안 걸림) 줄 사이 · 덩이 경계에서만 자르다 보니 마지막 몇 줄이 한 쪽 더 넘어감
           (낙찰 뒤 할 일: 높이 2048 · 쪽 1024 → 3쪽째에 한 줄만) → 정말 자른 쪽 수로 다시 보고, 꼬리가 1/4 쪽 안 되면 같은 꼴(넓게 펴서 찍고 줄임)로 한 쪽 덜 —
           0.83 까지 조금씩 · 그래도 안 되면 그대로(위 맞춤과 겹치지 않게 · 쪽 나눔이 있는 판은 안 함) */
        if (맞춤 && !줄임 && !꼭있음) {
          P = 높px / zz
          const 자른 = 쪽자르기(잰, P)
          const m = 자른.length
          const 꼬리 = 잰.H - 자른[m - 1].s
          if (m > 1 && m > n && 꼬리 < P * 0.25) {
            const [원폭, 원최대] = [판.style.width, 판.style.maxWidth]
            let f = Math.floor((((m - 1) * P * 0.975) / 잰.H) * 1000) / 1000
            let 됨 = false
            for (let 번 = 0; 번 < 8 && f >= 0.83; 번++) {
              const z = Math.floor(zz * f * 1000) / 1000
              판.style.width = (폭px / z).toFixed(2) + 'px'
              판.style.maxWidth = 'none'
              const 잰2 = 판재기(판)
              if (쪽자르기(잰2, 높px / z).length <= m - 1) { zz = z; 잰 = 잰2; 판너비 = 판.style.width; 됨 = true; break }
              f = Math.floor((f - 0.02) * 1000) / 1000
            }
            if (!됨) { 판.style.width = 원폭; 판.style.maxWidth = 원최대; 잰 = 판재기(판) }
          }
        }
        const 쪽들 = 쪽자르기(잰, 높px / zz)
        /* 덩이 — 그림 넓이가 한도 안에 들게 쪽을 묶음(한 쪽은 늘 들어감: 쪽 넓이 = 글자 칸 × 배율²)
           판 통째로도 배율 1.5 넘게 한 번에 찍히면 예전처럼 한 번에(조금 덜 곱게 · 빠름) · 그보다 길면 덩이로(배율 그대로) */
        const 한통k = Math.sqrt(한도 / (잰.W * 잰.H)) / zz
        if (한통k < 배율 && 한통k >= Math.min(배율, 1.5) && 잰.H * 한통k * zz <= 덩이높이한도) k = 한통k
        let s = k * zz
        if (잰.W * (높px / zz) * s * s > 한도) { k = Math.max(1, Math.sqrt(한도 / (잰.W * (높px / zz))) / zz); s = k * zz }   // 아주 넓은 판(쪽 하나가 한도 넘음)만 배율을 더 줄임
        const 덩이 = []
        for (let i = 0; i < 쪽들.length;) {
          let j = i
          const 위 = 쪽들[i].s
          const 아래 = (q) => Math.min(쪽들[q].cut, 잰.H)
          while (j + 1 < 쪽들.length && 잰.W * (아래(j + 1) - 위) * s * s <= 한도 && (아래(j + 1) - 위) * s <= 덩이높이한도) j++
          덩이.push({ s: 위, e: 아래(j), a: i, b: j })
          i = j + 1
        }
        계획 = { 쪽들, 덩이 }
        if (덩이.length > 1) {
          if (원줄.length === 판.querySelectorAll('tr').length && !판.querySelector('td table, th table')) 줄들 = 줄계획(판)   // 원본과 복제본 줄 차례가 같고 칸 안 표가 없을 때만 솎음
          가리기(판, 덩이[0].s, 덩이[0].e)
        }
      } else {
        /* 다음 덩이 — 같은 꼴로 펴고(솎은 줄 자리는 메움) 덩이 밖은 숨김 */
        const 판 = 펴기(doc)
        if (!판) return
        const 넣은 = 솎음 ? 메움넣기(판, 솎음.메움) : []
        if (칸줄 && 칸줄계획) 칸줄적용(판, 칸줄계획, 솎음 ? 원줄.map((_, i) => i).filter((i) => !솎음.버림.has(i)) : null)
        if (판너비) { 판.style.width = 판너비; 판.style.maxWidth = 'none' }
        if (넣은.length) 메움맞춤(판, 넣은)
        가리기(판, 계획.덩이[덩이번].s, 계획.덩이[덩이번].e)
      }
      설정.scale = k * zz
      if (계획.덩이.length > 1) { const d = 계획.덩이[덩이번]; 설정.y = d.s; 설정.height = Math.max(1, d.e - d.s) } else { delete 설정.y; delete 설정.height }
    },
  }
  const 모은 = []
  let 낸수 = 0
  let 흰첫 = null
  const 내기 = (cv, 번, 모두) => {
    if (흰쪽(cv)) { if (!흰첫 && !낸수) 흰첫 = cv; else cv.width = cv.height = 1; return }   // 🩹 G597 빈 쪽은 빼기(적어도 한 쪽은 남김)
    if (흰첫) { 흰첫.width = 흰첫.height = 1; 흰첫 = null }
    if (쪽마다) { 쪽마다(cv, 낸수, 모두); cv.width = cv.height = 1 } else 모은.push(cv)
    낸수++
  }
  const 머리그림 = new Map()      // 표 머리줄 위 자리 → 그 줄 그림(뒤 덩이에서 다시 그릴 때)
  try {
    for (덩이번 = 0; ; 덩이번++) {
      if (계획 && 덩이번 >= 계획.덩이.length) break
      버릴줄.clear()
      솎음 = null
      if (계획 && 덩이번 > 0 && 줄들) {
        솎음 = 솎기(줄들, 계획.덩이[덩이번].s, 계획.덩이[덩이번].e)
        for (const i of 솎음.버림) if (원줄[i]) 버릴줄.add(원줄[i])
      }
      const 때 = performance.now()
      const 큰 = await html2canvas(el, 설정)
      if (!잰 || !계획) throw new Error('인쇄 판을 펴지 못함')
      if (Array.isArray(window.__kcm찍기재기)) window.__kcm찍기재기.push({ 덩이: 덩이번, 덩이수: 계획.덩이.length, ms: Math.round(performance.now() - 때), 버림: 버릴줄.size, 그림: [큰.width, 큰.height] })   // 시험만 봄(소장님 화면엔 없음)
      const d = 계획.덩이[덩이번]
      const s = k * zz
      const 쪽px = [Math.round(폭px * k), Math.round(높px * k)]
      const H = 잰.H
      for (let i = d.a; i <= d.b; i++) {
        const { s: a, cut, 머리 } = 계획.쪽들[i]
        const cv = document.createElement('canvas')
        cv.width = 쪽px[0]; cv.height = 쪽px[1]
        const g = cv.getContext('2d')
        g.fillStyle = '#ffffff'; g.fillRect(0, 0, cv.width, cv.height)
        let y = 0
        if (머리) {
          const h = 머리.hb - 머리.ha
          const 안 = 머리.ha >= d.s - 0.5 && 머리.hb <= d.e + 0.5
          const 그림 = 안 ? 큰 : 머리그림.get(Math.round(머리.ha * 100))
          if (그림) {
            const 위 = 안 ? (머리.ha - d.s) * s : 0
            g.drawImage(그림, 0, 위, 그림.width, h * s, 0, 0, 그림.width, h * s)
            y = h * s
          }
        }
        const h = Math.min(cut, H) - a
        if (h > 0) g.drawImage(큰, 0, (a - d.s) * s, 큰.width, h * s, 0, y, 큰.width, h * s)
        내기(cv, i, 계획.쪽들.length)
      }
      if (계획.덩이.length > 1) {
        for (const t of 잰.표들) {
          const 열쇠 = Math.round(t.ha * 100)
          if (t.ha >= d.s - 0.5 && t.hb <= d.e + 0.5 && !머리그림.has(열쇠) && 계획.쪽들.some((p) => p.머리 === t)) {
            const c = document.createElement('canvas')
            c.width = 큰.width; c.height = Math.max(1, Math.round((t.hb - t.ha) * s))
            c.getContext('2d').drawImage(큰, 0, (t.ha - d.s) * s, 큰.width, c.height, 0, 0, c.width, c.height)
            머리그림.set(열쇠, c)
          }
        }
      }
      큰.width = 큰.height = 1
    }
  } finally {
    el.removeAttribute('data-kcm-찍을')
    for (const c of 머리그림.values()) c.width = c.height = 1
    document.querySelectorAll('iframe.html2canvas-container').forEach((f) => { try { f.remove() } catch (e) { /* 없음 */ } })
  }
  if (!낸수 && 흰첫) { const cv = 흰첫; 흰첫 = null; if (쪽마다) { 쪽마다(cv, 0, 1); cv.width = cv.height = 1 } else 모은.push(cv); 낸수 = 1 }
  return { 쪽들: 모은, z: zz, 쪽수: 낸수 }
}

/** 글자 칸 그림 → 종이 한 장(여백 포함) — PDF 쪽 · 글칸 · 여백 · 종이는 mm */
export function A4쪽(cv, { 글칸 = 글칸mm, 여백 = 여백mm, 종이 = [210, 297] } = {}) {
  const k = cv.width / (글칸[0] * MM)
  const out = document.createElement('canvas')
  out.width = Math.round(종이[0] * MM * k); out.height = Math.round(종이[1] * MM * k)
  const g = out.getContext('2d')
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, out.width, out.height)
  g.drawImage(cv, Math.round(여백[0] * MM * k), Math.round(여백[1] * MM * k))
  return out
}
