/**
 * 🖼 종이(화면 글)를 그림 쪽으로 — 안전 웹 서식 «사이트에서 작성 → PDF» (G584 · 2026-11-08)
 *   소장님 11-08 「PDF 도 변환 안되게 해야 하지 않아? 사이트?」 — 10-21 «그림 PDF»(CLAUDE.md 🍚 밥줄 4번)가 엑셀 꼴 서식(격자작성)에만
 *   들어가 있었음: 안전 웹 서식 36가지(엑셀을 안 주는 서식)는 브라우저 인쇄라 PDF 에 글자가 남아 변환 프로그램으로 엑셀이 나왔음.
 *   ■ html2canvas(누를 때만 불러옴)로 종이(#fw-인쇄 .fw-paper)를 한 장 그림으로 찍고, 줄(tr) · 덩이 경계에서 A4 글자 칸(186 × 271mm)으로 자름.
 *     줄 · 짧은 표 · 서명 · 확인 항목 · 표 머리와 첫 줄은 가운데서 안 자름 · 쪽을 넘는 표는 다음 쪽 위에 머리줄을 다시 그림(인쇄와 같게).
 *   ■ 쪽 = 픽셀만 있는 캔버스(글자 층 없음) → PDF 는 lib/그림PDF.js(A4 · 여백 위 12 · 왼 12mm) · 인쇄는 같은 그림을 <img> 로.
 *   ⚠️ 완전히 막을 수는 없음(다시 치기 · 사진 글자 읽기) — 소장님께 말씀드린 그대로.
 */
const MM = 96 / 25.4
export const 글칸mm = [186, 271]          // A4 210 × 297 − 여백(왼 · 오른 12 · 위 12 · 아래 14) — styles.css @page 와 같음
export const 여백mm = [12, 12]            // [왼, 위]

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
  for (const t of el.querySelectorAll('table')) {
    const [a, b] = 자리(t)
    const 첫 = t.tBodies[0] && t.tBodies[0].rows[0]
    if (첫) 피함.push([a, 자리(첫)[1]])          // 제목 · 머리줄만 쪽 끝에 남지 않게(첫 줄과 같이)
    if (t.tHead) { const [ha, hb] = 자리(t.tHead); 표들.push({ a, b, ha, hb }) }
  }
  const 자를수 = (y) => !피함.some(([a, b]) => b - a <= 쪽H && a + 0.5 < y && y < b - 0.5)
  const 쪽들 = []
  let s = 0
  for (let 번 = 0; s < H - 0.5 && 번 < 300; 번++) {
    const 머리 = 표들.find((t) => s > t.hb - 0.5 && s > t.a + 0.5 && s < t.b - 0.5) || null   // 표 몸 가운데서 시작하는 쪽 — 머리줄을 다시
    const 머리높 = 머리 ? 머리.hb - 머리.ha : 0
    const 끝 = s + 쪽H - 머리높
    let cut = H
    if (끝 < H - 0.5) {
      const 후보 = [...경계].filter((y) => y > s + 8 && y <= 끝 + 0.5 && 자를수(y))
      cut = 후보.length ? Math.min(Math.max(...후보), 끝) : 끝
    }
    쪽들.push({ s, cut, 머리 })
    s = cut
  }
  const 쪽px = [Math.round(글칸mm[0] * MM * k), Math.round(글칸mm[1] * MM * k)]
  const 결과 = 쪽들.map(({ s: a, cut, 머리 }) => {
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
  큰.width = 큰.height = 1
  return 결과
}

/** 글자 칸 그림 → A4 한 장(여백 포함) — PDF 쪽 */
export function A4쪽(cv) {
  const k = cv.width / (글칸mm[0] * MM)
  const out = document.createElement('canvas')
  out.width = Math.round(210 * MM * k); out.height = Math.round(297 * MM * k)
  const g = out.getContext('2d')
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, out.width, out.height)
  g.drawImage(cv, Math.round(여백mm[0] * MM * k), Math.round(여백mm[1] * MM * k))
  return out
}
