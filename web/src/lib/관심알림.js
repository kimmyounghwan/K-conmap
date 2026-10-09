/* 🔔 다시 오게 — 담은 공고 1순위 알림 · 내 조건 새 공고 알림 (2026-10-01, G97)
 *
 * 소장님: 「다시 오게 하기: 내 지역·면허를 한 번 정하면 1순위·공고가 그 조건으로 열리게 하고,
 *          관심 공고 결과가 나오면 알림을 보냅니다. ---- 자동으로 할 수 있어?」
 *          → 고르심: «①+②+내 조건 새 공고 알림»
 *
 * ■ 무엇을 적나 (데이터베이스 — 주인만 쓰고 아무도 못 읽음 · 함수만 읽음)
 *   watch/{공고번호}/{번호}  = {at, t}            ☆ 담은 공고 — 1순위가 나오면 한 번 알리고 함수가 지웁니다
 *   watch_cond/{번호}       = {rg, lic, none, at} 내 조건(지역 · 면허 코드) — 하루 두 번(8시 · 13시) 새 공고를 묶어 알림
 *   (G222 · 2026-10-09) 이 «신청» 은 그대로입니다. 신청하지 않은 분(폰 알림만 허용)은 lib/저절로알림.js → watch_auto 로 하루 한 번(오전 10시)
 *     소장님 「현재 하던대로 하고, 알림 신청하지 않은 이용자만 하루 한 번 알림 가게 하자.」
 *   {번호} = 사랑방과 같은 번호(익명 로그인 uid · 기기를 되찾았으면 옛 번호 r) — 폰 알림 주소 push/{번호} 를 같이 씁니다.
 * ■ 보내는 쪽: web/functions/index.js freshNotify (빠른 수집이 fresh/meta 를 고칠 때마다 깨어남)
 * ■ 폰 알림창은 브라우저 규칙상 «허용» 을 한 번 눌러야 합니다 — 그래서 반드시 «누름» 안에서 허락묻기() 를 먼저 부릅니다.
 *   허용이 안 되면(막음 · 아이폰 홈 화면 추가 안 함) 사이트 맨 위 🔔 로만 알립니다(noti/{번호}).
 */
import { 허락묻기, 폰알림켜기, 표시해두기 } from './알림.js'

let _fb = null
async function fb() {
  if (_fb) return _fb
  const [f, d] = await Promise.all([import('../firebase.js'), import('firebase/database')])
  _fb = { db: f.db, ensureAnon: f.ensureAnon, ...d }
  return _fb
}

/** 이 브라우저의 번호 — 사랑방과 같은 번호(되찾은 기기면 옛 번호) */
export async function 내뿌리() {
  const { ensureAnon, db, ref, get } = await fb()
  const u = await ensureAnon()
  let r = u.uid
  try { const w = (await get(ref(db, `qna_who/${u.uid}`))).val(); if (w && w.r) r = String(w.r) } catch (e) { /* 규칙 전 · 막힘 */ }
  return r
}

const 결과말 = (p) => (p === 'granted' ? '폰·PC 알림창으로 알려 드립니다'
  : p === 'denied' ? '알림이 막혀 있어 사이트 맨 위 🔔 로 알려 드립니다'
    : p === 'default' ? '사이트 맨 위 🔔 로 알려 드립니다(알림창 «허용» 을 누르시면 폰에도 뜹니다)'
      : p === 'error' ? '사이트 맨 위 🔔 로 알려 드립니다(폰 알림창 연결은 잠시 뒤 다시 됩니다)'
        : '이 기기는 알림창이 안 돼 사이트 맨 위 🔔 로 알려 드립니다')

/**
 * ☆ 담은 공고 지켜보기 — 반드시 «누름» 처리 안에서 부르십시오(허락 창).
 * @returns 화면에 한 줄로 보일 말
 */
export async function 공고지켜보기(no, 이름, 켬) {
  const 허락 = 켬 ? 허락묻기() : null      /* ⚠️ await 보다 먼저 — 아이폰 · 파이어폭스는 누름 밖이면 거절 */
  if (켬) import('./받은수.jsx').then((m) => m.세기('|알림|담기')).catch(() => {})   /* 📊 G222 숨은 누적 */
  try {
    표시해두기()
    const r = await 내뿌리()
    const { db, ref, set } = await fb()
    const 열쇠 = String(no || '').replace(/[.#$[\]/]/g, '_').slice(0, 30)
    if (!열쇠) return ''
    await set(ref(db, `watch/${열쇠}/${r}`), 켬 ? { at: Date.now(), t: String(이름 || '').slice(0, 60) } : null)
    if (!켬) return '알림을 껐습니다'
    const p = await 폰알림켜기(r, 허락)
    return '1순위가 나오면 — ' + 결과말(p)
  } catch (e) {
    return 켬 ? '알림을 켜지 못했습니다 — 잠시 뒤 다시 눌러 주세요' : ''
  }
}

const 조건열쇠 = 'kcm_cond_on'
export function 조건알림켜짐() { try { return localStorage.getItem(조건열쇠) === '1' } catch (e) { return false } }

/**
 * 내 조건 새 공고 알림 켜기 · 끄기 · 조건 바뀜 반영.
 * @param 조건  {rg, lic: [코드], none} 또는 null(끄기)
 * @param 누름  true 면 허락 창을 띄웁니다(켤 때만 · 반드시 누름 안에서)
 */
export async function 조건알림(조건, 누름 = false) {
  const 허락 = 조건 && 누름 ? 허락묻기() : null
  if (누름) import('./받은수.jsx').then((m) => m.세기(조건 ? '|알림|신청' : '|알림|신청끔')).catch(() => {})   /* 📊 G222 숨은 누적 — 내 조건 알림 신청 · 끔 */
  try {
    표시해두기()
    const r = await 내뿌리()
    const { db, ref, set } = await fb()
    if (!조건) {
      await set(ref(db, `watch_cond/${r}`), null)
      try { localStorage.removeItem(조건열쇠) } catch (e) { /* 없음 */ }
      return '내 조건 알림을 껐습니다'
    }
    await set(ref(db, `watch_cond/${r}`), {
      rg: String(조건.rg || '전국').slice(0, 12),
      lic: (조건.lic || []).map(String).join(',').slice(0, 600),
      none: !!조건.none,
      at: Date.now(),
    })
    try { localStorage.setItem(조건열쇠, '1') } catch (e) { /* 없음 */ }
    if (!허락) return ''
    const p = await 폰알림켜기(r, 허락)
    return '아침 8시 · 낮 1시, 새 공고를 묶어 한 번 — ' + 결과말(p)
  } catch (e) {
    return 조건 ? '알림을 켜지 못했습니다 — 잠시 뒤 다시 눌러 주세요' : ''
  }
}
