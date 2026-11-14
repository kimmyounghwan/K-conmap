/**
 * 🔑 이 기기 열쇠 — 꺼낼 수 없는(extractable: false) AES-GCM 256 열쇠를 IndexedDB 에 두고 그 열쇠로 잠근 글만 저장 (2026-11-14 · 경리컨맵 1단계)
 *   쓰는 곳: 경리컨맵(거래처 사업자번호 · 계좌). 노무비 지급명세서(G681)는 lib/노무비명세.js 에 같은 꼴이 따로 있음(그대로 둠).
 *   · 비밀번호를 묻지 않음(소장님 「이용자 편하게」) · 서버로 안 보냄 · 사이트 데이터를 지우면 열쇠도 지워져 그 칸만 다시 적음
 *   · 잠근 글 'v1.iv.ct'(base64) — 다른 기기 · 다른 열쇠로는 못 풂(null)
 */
const 칸 = 'k', 이름 = 'v1'
function 디비열기(디비) {
  return new Promise((ok, no) => {
    try {
      const q = indexedDB.open(디비, 1)
      q.onupgradeneeded = () => { try { q.result.createObjectStore(칸) } catch (e) { /* 이미 있음 */ } }
      q.onsuccess = () => ok(q.result)
      q.onerror = () => no(q.error || new Error('IndexedDB'))
      q.onblocked = () => no(new Error('IndexedDB 막힘'))
    } catch (e) { no(e) }
  })
}
const 일 = (db, 꼴, f) => new Promise((ok, no) => {
  try {
    const tx = db.transaction(칸, 꼴)
    const q = f(tx.objectStore(칸))
    tx.oncomplete = () => ok(q && q.result)
    tx.onerror = () => no(tx.error || new Error('IndexedDB'))
    tx.onabort = () => no(tx.error || new Error('IndexedDB'))
  } catch (e) { no(e) }
})
/** 이 기기 열쇠 — 없으면 만들어 둠 · 못 쓰는 곳(막힌 창 · 노드)이면 null */
export async function 기기열쇠(디비) {
  try {
    if (!globalThis.indexedDB || !globalThis.crypto || !crypto.subtle) return null
    const db = await 디비열기(디비)
    try {
      const 있음 = await 일(db, 'readonly', (s) => s.get(이름))
      if (있음 && 있음.type === 'secret') return 있음
      const 새 = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
      await 일(db, 'readwrite', (s) => s.put(새, 이름))
      const 다시 = await 일(db, 'readonly', (s) => s.get(이름))   // 두 창이 같이 만들었으면 먼저 넣은 것 하나로
      return 다시 && 다시.type === 'secret' ? 다시 : 새
    } finally { try { db.close() } catch (e) { /* 이미 닫힘 */ } }
  } catch (e) { return null }
}

const 글로 = new TextEncoder(), 글에서 = new TextDecoder()
const b64 = (u8) => { let s = ''; for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]); return btoa(s) }
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))
/** 물건 → 잠근 글 'v1.iv.ct' */
export async function 잠그기(key, obj) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, 글로.encode(JSON.stringify(obj)))
  return 'v1.' + b64(iv) + '.' + b64(new Uint8Array(ct))
}
/** 잠근 글 → 물건 · 열쇠가 다르면(다른 기기 · 지운 열쇠) null */
export async function 풀기(key, s) {
  try {
    const [v, iv, ct] = String(s || '').split('.')
    if (v !== 'v1' || !iv || !ct || !key) return null
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, key, unb64(ct))
    return JSON.parse(글에서.decode(pt))
  } catch (e) { return null }
}
