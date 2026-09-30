/**
 * 🔔 사랑방 답글 알림 — 사이트 안 🔔 + 폰 알림창 (2026-09-30, G73)
 *
 * 소장님: 「답글이 달렸다는 걸 알게 해줘. 내가 답글달면 의무적으로 가게 해줘. 그래야 또 들어와서 확인하지」
 *         「«답글이 달리면 알려 드릴까요?» … 이런 건 빼고, 그냥 다 알림이 가게 해」 → 「사이트 안, 폰 알림창도 뜨게 해줘」
 *
 * ■ 사이트 안 🔔 — 허락이 필요 없습니다. 답글이 달리면 함수(web/functions qnaReplyNotify)가 noti/{번호} 에 한 줄을 넣고,
 *   이 브라우저가 사랑방에 글이나 답글을 쓴 적이 있으면(열쇠 'kcm_noti' · 'kcm_qna_mine') 화면을 열 때 한 번 읽습니다.
 *   ⚠️ 글을 쓴 적 없는 방문자는 파이어베이스를 부르지 않습니다(firebase.js «읽기만 하는 방문자는 인증 요청조차 하지 않음»).
 * ■ 폰 알림창 — 브라우저 규칙상 이용자가 «허용» 을 한 번 눌러야 합니다(어느 사이트도 없이는 못 띄웁니다).
 *   우리 안내창은 띄우지 않습니다(소장님 「이런 건 빼고」) — 글 · 답글의 «올리기» 를 누른 그 순간 브라우저 기본 허용 창만 한 번.
 *   허용하면 이 기기의 푸시 주소를 push/{번호}/{기기} 에 적습니다(주인만 쓰고 아무도 못 읽음 · 함수만 읽음).
 *   아이폰은 «홈 화면에 추가» 한 경우에만 됩니다(애플 규칙). 안 되는 기기는 🔔 로 알게 됩니다.
 */

export const 알림열쇠 = 'kcm_noti'            /* '1' = 이 브라우저가 사랑방에 글 · 답글을 썼음 */
const 내글열쇠 = 'kcm_qna_mine'
const 공개열쇠칸 = 'kcm_push_pub'
/* 공개 열쇠 창구 — 웹 푸시 공개 열쇠(공개해도 되는 값)를 건넵니다. web/functions/index.js pushKey */
export const 열쇠창구 = 'https://us-central1-k-conmap.cloudfunctions.net/pushKey'

let _fb = null
async function fb() {
  if (_fb) return _fb
  const [f, d] = await Promise.all([import('../firebase.js'), import('firebase/database')])
  _fb = { db: f.db, auth: f.auth, ...d }
  return _fb
}

/** 알림을 읽을 까닭이 있나 — 사랑방에 쓴 적이 있는 브라우저만 */
export function 켤까닭() {
  try {
    if (localStorage.getItem(알림열쇠) === '1') return true
    return JSON.parse(localStorage.getItem(내글열쇠) || '[]').length > 0
  } catch (e) { return false }
}
export function 표시해두기() { try { localStorage.setItem(알림열쇠, '1') } catch (e) { /* 개인 창 */ } }

/** 이 브라우저의 사랑방 번호들 [지금 uid, 되찾은 옛 번호] — 로그인이 «되살아날» 때까지 기다리고, 새로 만들지 않습니다 */
export async function 내번호들() {
  const { auth, db, ref, get } = await fb()
  try { if (auth.authStateReady) await auth.authStateReady() } catch (e) { /* 옛 SDK */ }
  const u = auth.currentUser
  if (!u) return []
  const out = [u.uid]
  try {
    const w = (await get(ref(db, `qna_who/${u.uid}`))).val()
    if (w && w.r && String(w.r) !== u.uid) out.push(String(w.r))
  } catch (e) { /* 규칙 전 · 막힘 */ }
  return out
}

/** 알림 목록 — 번호마다 최근 30개, 새것부터 */
export async function 알림읽기() {
  const 번호 = await 내번호들()
  if (!번호.length) return []
  const { db, ref, get, query, orderByKey, limitToLast } = await fb()
  const 목록 = []
  for (const r of 번호) {
    try {
      const v = (await get(query(ref(db, `noti/${r}`), orderByKey(), limitToLast(30)))).val() || {}
      for (const [id, x] of Object.entries(v)) if (x && x.q) 목록.push({ id, r, ...x })
    } catch (e) { /* 규칙 전(올리기 전) · 막힘 — 조용히 */ }
  }
  return 목록.sort((a, b) => (b.at || 0) - (a.at || 0))
}

/** 봤음 표시 */
export async function 봤음(항목들) {
  if (!항목들 || !항목들.length) return
  const { db, ref, update } = await fb()
  const u = {}
  for (const x of 항목들) u[`noti/${x.r}/${x.id}/seen`] = true
  try { await update(ref(db), u) } catch (e) { /* 다음에 다시 */ }
}

/* ─────────────────────────── 폰 알림 ─────────────────────────── */

export function 푸시되나() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

/**
 * 브라우저 기본 «알림 허용» 창 — 글 · 답글 «올리기» 를 누른 그 순간(사용자 동작 안에서) 부릅니다.
 * 아이폰 · 파이어폭스는 사용자 동작 밖에서 물으면 거절합니다 — 그래서 올리기를 기다리지 않고 먼저 부릅니다.
 */
export function 허락묻기() {
  if (!푸시되나()) return Promise.resolve('unsupported')
  if (Notification.permission !== 'default') return Promise.resolve(Notification.permission)
  try {
    const p = Notification.requestPermission()
    return p && p.then ? p : Promise.resolve(Notification.permission)
  } catch (e) { return Promise.resolve('default') }
}

async function 공개열쇠(새로 = false) {
  if (!새로) { try { const v = localStorage.getItem(공개열쇠칸); if (v) return v } catch (e) { /* 없음 */ } }
  const r = await fetch(열쇠창구, { cache: 'no-store' })
  const k = (await r.text()).trim()
  if (!r.ok || k.length < 40) throw new Error('열쇠를 못 받았습니다')
  try { localStorage.setItem(공개열쇠칸, k) } catch (e) { /* 없음 */ }
  return k
}
const b64 = (s) => {
  const p = '='.repeat((4 - (s.length % 4)) % 4)
  const raw = atob((s + p).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}
async function 짧은이름(s) {
  try {
    const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
    return [...new Uint8Array(h)].slice(0, 10).map((x) => x.toString(16).padStart(2, '0')).join('')
  } catch (e) {
    let h = 0
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
    return 'h' + h.toString(16)
  }
}

/**
 * 허락되면 이 기기의 푸시 주소를 push/{번호}/{기기} 에 적습니다. 결과: 'granted' | 'denied' | 'default' | 'unsupported' | 'error'
 *   r = 글 · 답글을 쓴 번호(되찾은 기기면 옛 번호)
 */
export async function 폰알림켜기(r, 허락 = 허락묻기()) {
  표시해두기()
  const p = await 허락
  if (p !== 'granted' || !푸시되나() || !r) return p
  try {
    const reg = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_, j) => setTimeout(() => j(new Error('서비스워커가 없습니다')), 8000)),
    ])
    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      try {
        sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(await 공개열쇠()) })
      } catch (e) {
        /* 열쇠가 바뀌었을 수 있습니다 — 한 번만 새 열쇠로 */
        sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(await 공개열쇠(true)) })
      }
    }
    const s = sub.toJSON()
    const sid = await 짧은이름(s.endpoint)
    const { db, ref, set } = await fb()
    await set(ref(db, `push/${r}/${sid}`), { s: { endpoint: s.endpoint, keys: { p256dh: s.keys.p256dh, auth: s.keys.auth } }, at: Date.now() })
    return 'granted'
  } catch (e) {
    return 'error'
  }
}

/** 알림 한 줄 글 */
export function 알림글(x) {
  const 누가 = x.op ? 'K-건설맵 답변' : `${x.by || '이웃'}님 답글`
  return x.mine ? `올리신 글 「${x.t}」에 ${누가}이 달렸습니다` : `답글을 단 글 「${x.t}」에 ${누가}이 달렸습니다`
}
