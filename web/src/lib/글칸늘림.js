/* ✍ G801 (2026-11-20) 소장님 「건설맵 모든 글쓰기 칸 점검해서 고쳐줘」 — G289(맵톡 답글 칸 «쓰면 글만큼 저절로 늘어남») 를 모든 글칸(textarea)에
 *   ■ 글이 칸보다 길어지면 글만큼 칸이 늘어남 — 화면 높이의 60 %(220px 아래로는 안 줄임)까지 · 넘으면 칸 안에서 굴림
 *   ■ 처음 높이는 CSS 그대로(min-height · rows · height) — 글이 짧으면 손대지 않음 · 줄이면(지우면) 처음 높이로 돌아옴 · 처음보다 작게는 안 줄임
 *   ■ 빼는 칸: 붙여넣기 칸(.cin · .tj-paste · .bj-paste · .gj-paste — 고정폭 글꼴 · 칸 안에서 굴림) · 제 늘림이 있는 칸(.mt-af-t G289 · .adm-ta G800 · .fw-in 서식 칸)
 *              · 엑셀 칸 고치기(.xv-고침판 — 화면 아래 붙은 판) · 읽기만 · 막힌 칸(잠긴 도구 예시) · data-grow="no"
 *   ■ 남이 정한 높이는 그대로 — 이용자가 모서리를 끌어 키운 칸 · 화면이 스스로 높이를 정한 칸은 건드리지 않음
 *   ■ 화면(React)이 값을 바꿀 때도(보낸 뒤 비움 · 불러온 글) 맞춤 — textarea 의 value 넣기에 한 줄을 걸어 둠(main.jsx 가 화면을 그리기 전에 켬)
 *   ■ 안 보이는 칸(접힌 곳)은 건드리지 않음 — 보일 때(누르거나 쓸 때) 맞춤 · 여러 칸은 한 번에 모아 재고 고침(긴 서식에서 화면이 버벅이지 않게)
 *   ⚠️ 새 글칸에 따로 높이 늘림을 만들지 말 것 — 이것이 다 해 줌(시험 tools/시험_글칸.mjs) */
const 뺌 = '.cin, .tj-paste, .bj-paste, .gj-paste textarea, .mt-af-t, .adm-ta, .fw-in, .xv-고침판 textarea, [data-grow="no"]'
const px = (v) => parseFloat(v) || 0

function 쓸칸(el) {
  if (!el || el.tagName !== 'TEXTAREA' || !el.isConnected || el.readOnly) return false
  if (el.matches(':disabled') || el.matches(뺌)) return false
  return el.checkVisibility ? el.checkVisibility() : el.getClientRects().length > 0   /* 접힌 곳(details) · 숨은 곳은 빼고 */
}

/** 칸들 맞춤 — 읽기 → 쓰기 → 읽기 → 쓰기 네 번에 끝냄(칸이 많아도 화면을 두 번만 다시 잼) */
export function 맞춤(칸들) {
  try {
    const 할 = []
    for (const el of 칸들) {
      if (!쓸칸(el)) continue
      const 지금 = el.style.height, 우리 = el.__글칸h || 0
      if (지금 && px(지금) !== 우리) continue                                   /* 남(손으로 끌기 · 화면 스스로)이 정한 높이 */
      if (!지금 && el.scrollHeight <= el.clientHeight + 1) continue             /* 글이 칸 안에 듦 — 할 일 없음(가장 흔함) */
      할.push(el)
    }
    if (!할.length) return
    const 쪽 = window.scrollY, 굴림 = new Map()
    for (const el of 할) for (let p = el.parentElement; p; p = p.parentElement) if (p.scrollTop && !굴림.has(p)) 굴림.set(p, p.scrollTop)
    for (const el of 할) el.style.height = ''                                   /* CSS 처음 높이로 */
    const 최대 = Math.max(220, Math.round((window.innerHeight || 800) * 0.6))
    const 잰 = 할.map((el) => {
      const cs = getComputedStyle(el)
      const 덧 = cs.boxSizing === 'border-box' ? 0 : px(cs.paddingTop) + px(cs.paddingBottom) + px(cs.borderTopWidth) + px(cs.borderBottomWidth)
      return [el, el.offsetHeight, el.scrollHeight - el.clientHeight, 덧]
    })
    for (const [el, 처음, 모자람, 덧] of 잰) {
      if (모자람 <= 1) { el.__글칸h = 0; continue }                              /* 처음 높이에 듦 — CSS 그대로 */
      const h = Math.round(Math.min(Math.max(최대, 처음), 처음 + 모자람) - 덧)
      el.style.height = h + 'px'
      el.__글칸h = h
    }
    for (const [p, y] of 굴림) if (p.scrollTop !== y) p.scrollTop = y           /* 줄였다 늘릴 때 쪽이 튀지 않게 */
    if (window.scrollY !== 쪽) window.scrollTo(window.scrollX, 쪽)
  } catch (e) { /* 글칸 때문에 화면이 멈추면 안 됩니다 */ }
}
export const 늘림 = (el) => 맞춤([el])

let 켜짐 = false
export function 켜기() {
  if (켜짐 || typeof window === 'undefined' || typeof document === 'undefined') return
  켜짐 = true
  const 봄 = (e) => { const t = e && e.target; if (t && t.tagName === 'TEXTAREA') 맞춤([t]) }
  document.addEventListener('input', 봄, true)
  document.addEventListener('focusin', 봄, true)
  /* 화면이 값을 넣을 때(React 는 textarea.value = … 로 넣음) — 다음 그림 때 모아서 한 번에 */
  const 모음 = new Set()
  let 걸림 = 0
  const 나중 = (el) => {
    모음.add(el)
    if (!걸림) 걸림 = requestAnimationFrame(() => { 걸림 = 0; const 칸들 = [...모음]; 모음.clear(); 맞춤(칸들) })
  }
  try {
    const 원래 = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')
    if (원래 && 원래.set && 원래.get && !원래.set.__글칸) {
      const 넣기 = function (v) { 원래.set.call(this, v); 나중(this) }
      넣기.__글칸 = true
      Object.defineProperty(HTMLTextAreaElement.prototype, 'value', { configurable: true, enumerable: 원래.enumerable, get: 원래.get, set: 넣기 })
    }
  } catch (e) { /* 옛 브라우저 — 쓸 때만 맞춤 */ }
  /* 창 크기가 바뀌면(폰 돌림) 다시 */
  let 줄 = 0
  window.addEventListener('resize', () => { if (줄) return; 줄 = requestAnimationFrame(() => { 줄 = 0; 맞춤(document.querySelectorAll('textarea')) }) })
}
