/**
 * 🔒 잠금 — 「올려는 두되 남이 못 쓰게」 (2026-09-16)
 *
 * 소장님: 「사이트에 올려주되 사용은 하지 못하게 해줘, 내가 실험을 해야 하니까」
 *
 * ⚠️ 이것은 «보안» 이 아닙니다. 똑바로 적어 둡니다.
 *    화면(자바스크립트)은 누구나 내려받아 읽을 수 있으므로, 여기 든 해시도 보입니다.
 *    작정하고 덤비면 열쇠말을 알아낼 수 있습니다.
 *    이 잠금이 하는 일은 «지나가던 사람이 못 들어오게» 하는 것입니다 —
 *    지금 필요한 것이 딱 그것이라 이렇게 만들었습니다.
 *
 *    진짜로 막아야 할 것이 생기면(값을 받거나, 남의 자료를 두거나) 이걸로는 안 됩니다.
 *    그때는 **서버에서** 막아야 합니다.
 *
 * ⚠️ 이 화면은 어디에서도 «링크하지 않습니다». 주소를 아는 사람만 들어옵니다.
 *    sitemap 에도 넣지 않고, prerender 로 굽지도 않습니다.
 */

const KEY = 'kcm_lab_ok'

/* 열쇠말의 SHA-256. 열쇠말 자체는 코드에 두지 않습니다. */
const HASH = 'e20556768cb839ee608f6acb88248ae9ece0fc71ee62a601841c01459f38d202'

export async function sha256(s) {
  const buf = new TextEncoder().encode(String(s))
  const d = await crypto.subtle.digest('SHA-256', buf)
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** 전에 연 적이 있나 */
export function isOpen() {
  try { return localStorage.getItem(KEY) === HASH } catch (e) { return false }
}

/** 열쇠말을 맞춰 봅니다. 맞으면 이 브라우저에 기억해 둡니다. */
export async function tryOpen(word) {
  const h = await sha256(String(word || '').trim())
  if (h !== HASH) return false
  try { localStorage.setItem(KEY, HASH) } catch (e) { /* 사파리 비공개 등 — 이번만 열립니다 */ }
  return true
}

export function close() {
  try { localStorage.removeItem(KEY) } catch (e) { /* 지나갑니다 */ }
}
