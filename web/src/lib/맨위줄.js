/**
 * 🩹 G465 맨 위 줄 맞춤 (2026-10-30 · 소장님 «이게 왜 이러지 약간 짤리는데, 고쳐줘» — 폰 393px · 🔔 가 생긴 날 🌊 사라사가 오른쪽에서 잘림)
 *   까닭: 안 본 알림이 있을 때만 🔔 단추가 하나 더 생기는데, 전에는 🔔 없는 상태로만 폭을 맞춰 둠(📲 앱으로 까지 있으면 더 넘침).
 *   소장님 «아래에 있으니 사라사 빼자» → 🌊 사라사는 맨 위 줄에서 뺌(바닥글에는 그대로).
 *   하는 일: 맨 위 줄(.topbar-in)이 넘치면 data-tight 를 1 → 2 로 올려 덜 중요한 단추부터 뺌(styles.css)
 *     1 = 📲 앱으로(본문 맨 위 «홈 화면에 추가» 띠에도 있음) · 2 = + ← 뒤로(폰 뒤로가기)
 *     📖 보는 방법 · 🔎 · 🔔 · 🔄 은 빼지 않음 · 자리가 있으면 0(다 보임). 폭이 바뀌거나 단추가 생기고 없어질 때마다 다시 잼.
 * ■ 시험: tools/시험_맨위줄.mjs (화면 · 320 ~ 430 px · 🔔 · 📲 있고 없고)
 */
import { useLayoutEffect } from 'react'

export const 끝단계 = 2
/** 넘치나 — 보이는 단추 중 가장 오른쪽 끝이 줄 안쪽 오른쪽(오른 여백 안)을 넘으면(scrollWidth 는 flex 의 오른 여백을 안 세어 1 ~ 10 px 넘침을 놓침) */
export function 넘치나(t) {
  const 틀 = t.getBoundingClientRect()
  const 안오른 = Math.min(틀.right - (parseFloat(getComputedStyle(t).paddingRight) || 0), (typeof window !== 'undefined' ? window.innerWidth : Infinity))
  let 끝 = -Infinity
  for (const e of t.querySelectorAll('a, button')) { if (e.offsetParent === null) continue; const r = e.getBoundingClientRect(); if (r.width > 0 && r.right > 끝) 끝 = r.right }
  return 끝 > 안오른 + 0.5
}
/** 넘치지 않을 때까지 단계를 올림 — 한 번에(같은 그림 안에서) 재고 정하므로 깜박이지 않음 */
export function 맞추기(t) {
  if (!t) return 0
  let k = 0
  if (t.dataset.tight !== '0') t.dataset.tight = '0'
  while (k < 끝단계 && 넘치나(t)) { k++; t.dataset.tight = String(k) }
  return k
}
export function use맨위줄맞춤(ref) {
  useLayoutEffect(() => {
    const t = ref.current
    if (!t || typeof ResizeObserver === 'undefined') return undefined
    let 일 = 0
    const 다시 = () => { cancelAnimationFrame(일); 일 = requestAnimationFrame(() => 맞추기(t)) }
    맞추기(t)
    const ro = new ResizeObserver(다시)
    ro.observe(t)
    const mo = new MutationObserver(다시)          // 🔔 · 📲 이 생기고 없어질 때(단추 줄 안의 자식만 봄 — data-tight 바꿈은 안 봄)
    mo.observe(t, { childList: true, subtree: true })
    window.addEventListener('resize', 다시)
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(다시).catch(() => {})
    return () => { cancelAnimationFrame(일); ro.disconnect(); mo.disconnect(); window.removeEventListener('resize', 다시) }
  }, [ref])
}
