/**
 * 기억자료.js — 단가표·재료표를 «브라우저 안에» 기억해 둡니다 (2026-09-21)
 *
 * 소장님: 「도면과 공내역서 드래그 해서 올리면 다 되게 해줘」
 *
 * ■ 왜 필요한가
 *   도면과 공내역서는 현장마다 다릅니다. 그런데 «단가표와 재료표» 는 늘 같은 것을 씁니다.
 *   그것까지 매번 올리게 하면 「드래그 하나로 끝」 이 안 됩니다. 그래서 한 번 올리면 기억합니다.
 *
 * ⚠️ 서버로 «한 조각도» 올라가지 않습니다. 브라우저(IndexedDB) 안에만 둡니다.
 *    다른 컴퓨터에서 열면 다시 올리셔야 합니다 — 그게 맞습니다. 유료 자료라서요.
 * ⚠️ 지우려면 화면의 「기억 지우기」 를 누르시면 됩니다.
 */
const DB = 'kcm_jeoksan'
const ST = '자료'

function db열기() {
  return new Promise((되면, 탈) => {
    try {
      const r = indexedDB.open(DB, 1)
      r.onupgradeneeded = () => { try { r.result.createObjectStore(ST) } catch (e) { /* 이미 있음 */ } }
      r.onsuccess = () => 되면(r.result)
      r.onerror = () => 탈(r.error)
    } catch (e) { 탈(e) }
  })
}
async function 한판(모드, 하기) {
  const d = await db열기()
  return new Promise((되면, 탈) => {
    const t = d.transaction(ST, 모드)
    const r = 하기(t.objectStore(ST))
    t.oncomplete = () => 되면(r && r.result)
    t.onerror = () => 탈(t.error)
  })
}

/** 열쇠: '단가표' | '재료표' */
export async function 넣기(열쇠, 값) {
  try { await 한판('readwrite', (s) => s.put(값, 열쇠)); return true } catch (e) { return false }
}
export async function 꺼내기(열쇠) {
  try { return (await 한판('readonly', (s) => s.get(열쇠))) || null } catch (e) { return null }
}
export async function 지우기(열쇠) {
  try { await 한판('readwrite', (s) => s.delete(열쇠)); return true } catch (e) { return false }
}
