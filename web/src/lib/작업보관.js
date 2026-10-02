/**
 * 💾 사진대지 · 영수증 작업 — 이 브라우저에만 저절로 저장(IndexedDB) (2026-09-30)
 *   창을 닫았다 열어도 이어서 합니다. 서버로 가지 않습니다(값도 안 듦).
 *   ■ 그림(수백 KB)은 한 번만 따로 넣고(«g:아이디»), 글 · 설정 · 차례(작음)는 바뀔 때마다 «문서» 로 넣습니다.
 *   ⚠️ 개인 창 · 저장소가 막힌 브라우저에서는 조용히 안 됩니다(작업은 그대로 됨).
 */
const 이름 = 'kcm-photobook'
const 곳 = 'work'
let _db = null

function 열기() {
  if (_db) return _db
  _db = new Promise((ok, no) => {
    try {
      const r = indexedDB.open(이름, 1)
      r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(곳)) r.result.createObjectStore(곳) }
      r.onsuccess = () => ok(r.result)
      r.onerror = () => no(r.error)
      r.onblocked = () => no(new Error('막힘'))
    } catch (e) { no(e) }
  }).catch((e) => { _db = null; throw e })
  return _db
}
function 일(방식, 할) {
  return 열기().then((db) => new Promise((ok, no) => {
    const t = db.transaction(곳, 방식)
    const s = t.objectStore(곳)
    const r = 할(s)
    t.oncomplete = () => ok(r && 'result' in r ? r.result : undefined)
    t.onerror = () => no(t.error)
    t.onabort = () => no(t.error)
  }))
}
export async function 넣기(열쇠, 값) { try { await 일('readwrite', (s) => s.put(값, 열쇠)) } catch (e) { /* 저장 못 해도 작업은 계속 */ } }
export async function 꺼내기(열쇠) { try { return await 일('readonly', (s) => s.get(열쇠)) } catch (e) { return undefined } }
export async function 지우기(열쇠들) {
  try { await 일('readwrite', (s) => { for (const k of [].concat(열쇠들)) s.delete(k) }) } catch (e) { /* 없음 */ }
}
/** 그림 여럿을 한 번에 */
export async function 여럿꺼내기(열쇠들) {
  try {
    return await 열기().then((db) => new Promise((ok, no) => {
      const t = db.transaction(곳, 'readonly')
      const s = t.objectStore(곳)
      const out = new Map()
      for (const k of 열쇠들) { const r = s.get(k); r.onsuccess = () => { if (r.result !== undefined) out.set(k, r.result) } }
      t.oncomplete = () => ok(out)
      t.onerror = () => no(t.error)
    }))
  } catch (e) { return new Map() }
}

/* 💾 G113 (2026-10-02) — 작업 백업 파일(lib/백업파일.js · tools/작업백업칸.jsx): 이 창고에 든 것 전부를 꺼내고 / 통째로 바꿉니다 */
export async function 모두꺼내기() {
  return 열기().then((db) => new Promise((ok, no) => {
    const t = db.transaction(곳, 'readonly')
    const out = []
    const r = t.objectStore(곳).openCursor()
    r.onsuccess = () => { const c = r.result; if (c) { out.push([c.key, c.value]); c.continue() } }
    t.oncomplete = () => ok(out)
    t.onerror = () => no(t.error)
  }))
}
export async function 모두바꾸기(자료) {
  await 열기().then((db) => new Promise((ok, no) => {
    const t = db.transaction(곳, 'readwrite')
    const s = t.objectStore(곳)
    s.clear()
    for (const [k, v] of 자료) s.put(v, k)
    t.oncomplete = () => ok()
    t.onerror = () => no(t.error)
    t.onabort = () => no(t.error)
  }))
}
