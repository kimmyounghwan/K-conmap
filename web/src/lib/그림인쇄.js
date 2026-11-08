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

/** 큰 그림 → 쪽 그림들(글자 칸 크기) — 잰 것(경계 · 피함 · 표들 · 꼭)에서 자를 곳을 골라 */
function 쪽나누기(큰, { H, 경계, 피함, 표들, 꼭 = [] }, { 쪽H, k, zz, 쪽px }) {
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
 *  → 표마다 «떨어진 칸» 으로 바꾸고 칸 줄을 한 번씩만: 맨 왼쪽 · 맨 위 칸이 아니면 왼 · 위 줄을 지움(합친 칸(rowspan · colspan)도 칸 자리로 봄) ·
 *  표 자체에 테두리가 있으면 그 쪽 끝 칸 줄은 지움(표 테두리 하나만). 줄 굵기 · 색은 칸에 적힌 그대로. */
function 칸줄고침(판) {
  const 창 = 판.ownerDocument.defaultView
  for (const t of 판.querySelectorAll('table')) {
    const ts = 창.getComputedStyle(t)
    if (ts.borderCollapse !== 'collapse') continue
    const 칸들 = [...t.querySelectorAll('th, td')].filter((c) => c.closest('table') === t)
    if (!칸들.length) continue
    const 자리 = 칸들.map((c) => c.getBoundingClientRect())
    const 왼 = Math.min(...자리.map((r) => r.left)), 위 = Math.min(...자리.map((r) => r.top))
    const 오른 = Math.max(...자리.map((r) => r.right)), 아래 = Math.max(...자리.map((r) => r.bottom))
    const 표줄 = { l: parseFloat(ts.borderLeftWidth) || 0, t: parseFloat(ts.borderTopWidth) || 0, r: parseFloat(ts.borderRightWidth) || 0, b: parseFloat(ts.borderBottomWidth) || 0 }
    t.style.borderCollapse = 'separate'; t.style.borderSpacing = '0'
    칸들.forEach((c, i) => {
      const r = 자리[i]
      if (r.left - 왼 > 1.5 || 표줄.l > 0) c.style.borderLeftWidth = '0'
      if (r.top - 위 > 1.5 || 표줄.t > 0) c.style.borderTopWidth = '0'
      if (표줄.r > 0 && 오른 - r.right < 1.5) c.style.borderRightWidth = '0'
      if (표줄.b > 0 && 아래 - r.bottom < 1.5) c.style.borderBottomWidth = '0'
    })
  }
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
  for (const n of el.querySelectorAll('*')) {
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

/**
 * 🖼 G585 인쇄 판 하나를 «인쇄 모양 그대로» 그림 쪽들로 — 판(el)은 화면엔 숨어 있어도 됨(복제본에서만 폄)
 * @param {HTMLElement} el  #gp-인쇄 안의 쪽 덩이(예: .il-쪽)
 * @param {{몸표?: string[], 쪽?: {폭: number, 높: number}, 맞춤?: boolean, 배율?: number, 한도?: number, 더CSS?: string, 칸줄?: boolean}} o
 *   몸표 = 인쇄 때 몸에 다는 표(gp-인쇄중 …) · 쪽 = 글자 칸 mm(그 판의 @page 와 같게) · 맞춤 = 마지막 쪽이 1/4 안 되면 줄여 한 쪽 덜 씀 ·
 *   칸줄 = 겹친 칸 줄을 한 번씩만(G587 — 합친 칸 있는 표도 · 도구마다 CSS 를 따로 안 써도 됨) · 손질(판, 문서) = 복제본만 고치기(G588 접은 것 펴기 등)
 * @returns {Promise<{쪽들: HTMLCanvasElement[], z: number}>}
 */
export async function 인쇄판찍기(el, { 몸표 = [], 쪽 = { 폭: 186, 높: 273 }, 맞춤 = true, 배율 = 2, 한도 = 12e6, 더CSS = '', 칸줄 = false, 손질 = null } = {}) {
  const { default: html2canvas } = await import('html2canvas')
  if (document.fonts && document.fonts.ready) { try { await document.fonts.ready } catch (e) { /* 없음 */ } }
  const 규칙 = 인쇄규칙()
  const 표지 = 'k' + Date.now().toString(36)
  el.setAttribute('data-kcm-찍을', 표지)
  const 폭px = 쪽.폭 * MM
  const 높px = 쪽.높 * MM
  let 잰 = null
  let zz = 1
  const 설정 = {
    scale: 배율, backgroundColor: '#ffffff', logging: false, useCORS: true,
    windowWidth: Math.round(폭px), scrollX: 0, scrollY: 0,
    onclone: (doc) => {
      for (const c of [...몸표, 'kcm-찍는중']) { doc.documentElement.classList.add(c); if (doc.body) doc.body.classList.add(c) }   // kcm-찍는중 — «그림만인쇄» 숨김(Ctrl+P 막기)이 복제본엔 안 걸리게
      const st = doc.createElement('style')
      st.textContent = 규칙 + '\n' + 더CSS
      doc.head.appendChild(st)
      const 판 = doc.querySelector(`[data-kcm-찍을="${표지}"]`)
      if (!판) return
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
      if (칸줄) 칸줄고침(판)
      잰 = 판재기(판)
      /* 한 장 맞춤 — 꼬리만 넘치면 넓게 펴서 다시 잼(줄이면 표가 폭을 다 쓰게 · 인쇄의 zoom 과 같은 모양) */
      const n = Math.max(1, Math.ceil((잰.H - 0.5) / 높px))
      const 꼭있음 = 잰.꼭.some((y) => y > 8 && y < 잰.H - 0.5)   // 쪽 나눔이 있는 판(노무비 신고용 집계 새 쪽)은 쪽을 합칠 수 없음 — 줄이지 않음(G589)
      if (맞춤 && n > 1 && !꼭있음) {
        const 끝쪽 = 잰.H - (n - 1) * 높px
        const 줄일 = ((n - 1) * 높px * 0.975) / 잰.H
        if (끝쪽 < 높px * 0.25 && 줄일 >= 0.83) {
          zz = Math.floor(줄일 * 1000) / 1000
          판.style.width = (폭px / zz).toFixed(2) + 'px'
          판.style.maxWidth = 'none'
          잰 = 판재기(판)
          if (Math.ceil((잰.H * zz - 0.5) / 높px) > n - 1) {   // 넓혀도 안 들어가면(드묾) 높이에 맞춰 더 줄임
            zz = Math.max(0.5, Math.floor((((n - 1) * 높px * 0.99) / 잰.H) * 1000) / 1000)
          }
        }
      }
      if (잰.W * 잰.H * 배율 * 배율 > 한도) 설정.scale = Math.max(1, Math.sqrt(한도 / (잰.W * 잰.H)))   // 아이폰 캔버스 한도
    },
  }
  let 큰
  try { 큰 = await html2canvas(el, 설정) } finally { el.removeAttribute('data-kcm-찍을') }
  if (!잰) throw new Error('인쇄 판을 펴지 못함')
  const k = 설정.scale
  const 쪽px = [Math.round(폭px * k), Math.round(높px * k)]
  const 쪽들 = 쪽나누기(큰, 잰, { 쪽H: 높px / zz, k, zz, 쪽px })
  큰.width = 큰.height = 1
  return { 쪽들, z: zz }
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
