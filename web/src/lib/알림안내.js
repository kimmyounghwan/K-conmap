/* 🔔 알림 안내 쪽지 — 셈만(화면 · 파이어베이스 없음 · 시험: node tools/시험_알림묶음.mjs) (G222 · 2026-10-10)
 *   소장님: 「허용 안 한 사람을 못 보내면 의미가 없잖아」 → 고르심 «허용 비율 올리기» → 「허용하는 사람은 조건 충족시 알림해」 → 고르심 «신청한 분과 똑같이»
 *   ■ 브라우저 허용 창을 «차갑게»(첫 누름에 바로) 띄우면 막는 분이 많고, 한 번 막으면 다시 물을 수 없습니다(크롬은 막는 분이 많은 사이트의 창을 아예 숨김).
 *     그래서 내 조건(지역 · 면허)을 고른 «그 순간» 에 우리 쪽지를 먼저 띄우고, «🔔 알림 받기» 를 누른 분께만 허용 창을 띄웁니다.
 *   ■ 받기 = 내 조건 «🔔 새 공고 알림 받기» 신청과 똑같음(lib/관심알림.js 조건알림 → watch_cond · 하루 두 번 8시 · 13시 맞는 새 공고).
 *   ■ 띄우는 때: 폰 알림이 되는 기기 · 아직 신청 안 함 · 끄지 않음 · 막지 않음 · 내 조건이 있음 · 이 탭에서 처음 · 사흘에 한 번.
 *     «나중에» 를 세 번 누르면 30일 동안 안 띄움.
 */
export const 안내열쇠 = 'kcm_ask_card'          /* {at: 마지막으로 띄운 때, n: «나중에» 누른 수, until: 이때까지 안 띄움} */
export const 안내탭열쇠 = 'kcm_ask_card_tab'    /* 이 탭에서 한 번 */
const 하루 = 86400e3

/** 띄울까 — 모두 «참» 이어야 띄움 */
export function 띄울까({ 지원, 허용, 신청됨, 꺼짐, 조건있음, 기록, 지금, 탭에서봄 }) {
  if (!지원 || 허용 === 'denied' || 허용 === 'unsupported') return false
  if (신청됨 || 꺼짐 || !조건있음 || 탭에서봄) return false
  const r = 기록 && typeof 기록 === 'object' ? 기록 : {}
  if (Number(r.until) > 지금) return false
  if (Number(r.at) > 0 && 지금 - Number(r.at) < 3 * 하루) return false
  return true
}

/** 띄웠음 · 나중에 — 기록을 새로 */
export const 띄움기록 = (기록, 지금) => ({ ...(기록 && typeof 기록 === 'object' ? 기록 : {}), at: 지금 })
export function 나중에기록(기록, 지금) {
  const r = 기록 && typeof 기록 === 'object' ? 기록 : {}
  const n = (Number(r.n) || 0) + 1
  return { at: 지금, n, until: n >= 3 ? 지금 + 30 * 하루 : 0 }
}

/** 쪽지에 쓸 내 조건 글 — «전남 · 면허 2개» · 조건이 없으면 '' */
export function 조건글(rg, 면허수) {
  const a = rg && rg !== '전국' ? rg : ''
  const b = 면허수 > 0 ? `면허 ${면허수}개` : ''
  return [a, b].filter(Boolean).join(' · ')
}
