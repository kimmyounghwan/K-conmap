/**
 * 파일기억.js — 한 번 고르신 파일을 «기억» 합니다 (2026-09-19)
 *
 * 소장님: 「이건 내가 하는 건데 … 근데, 이걸 어떻게 내가 사용하라고」
 *
 * ■ 왜 필요한가
 *   성적표는 소장님 컴퓨터의 data/store/first.json(14MB)이 있어야 만들어집니다.
 *   그런데 열 때마다 파일 창을 띄워 폴더를 헤집게 하면 «쓸 수 없는 도구» 입니다.
 *   브라우저가 파일 «손잡이(handle)» 를 기억할 수 있으므로, 그것을 넣어 둡니다.
 *
 * ■ 어떻게
 *   showOpenFilePicker 가 준 손잡이를 IndexedDB 에 넣습니다. 다음에 열면
 *     · 권한이 살아 있으면  → 아무것도 안 물어보고 바로 읽습니다
 *     · 권한이 잠들었으면  → 단추 «한 번» 이면 됩니다 (폴더를 다시 헤집지 않습니다)
 *
 * ⚠️ 파일 내용은 저장하지 않습니다. «어느 파일이었나» 만 기억합니다.
 *    자료는 여전히 소장님 컴퓨터에만 있고 서버로 올라가지 않습니다.
 * ⚠️ 이 기능이 없는 브라우저(사파리 등)에서는 예전처럼 <input type=file> 로 고릅니다.
 */
const DB = 'kcm_files'
const ST = 'handles'

export const 기억됨 = () => typeof window !== 'undefined' && typeof window.showOpenFilePicker === 'function'

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
    const s = t.objectStore(ST)
    const r = 하기(s)
    t.oncomplete = () => 되면(r && r.result)
    t.onerror = () => 탈(t.error)
  })
}

export async function 넣기(열쇠, 손잡이) {
  try { await 한판('readwrite', (s) => s.put(손잡이, 열쇠)) } catch (e) { /* 사생활 모드 — 그냥 넘어갑니다 */ }
}
export async function 꺼내기(열쇠) {
  try { return await 한판('readonly', (s) => s.get(열쇠)) } catch (e) { return null }
}
export async function 지우기(열쇠) {
  try { await 한판('readwrite', (s) => s.delete(열쇠)) } catch (e) { /* 넘어갑니다 */ }
}

/** 물어보지 «않고» 읽을 수 있나 */
export async function 바로되나(손잡이) {
  try { return (await 손잡이.queryPermission({ mode: 'read' })) === 'granted' } catch (e) { return false }
}
/** 단추를 누른 «그 순간» 에만 부를 수 있습니다 (브라우저 규칙) */
export async function 허락받기(손잡이) {
  try { return (await 손잡이.requestPermission({ mode: 'read' })) === 'granted' } catch (e) { return false }
}

/** 파일 창을 띄워 고르고, 그 손잡이를 기억합니다 */
export async function 골라서기억(열쇠, 설명) {
  const [h] = await window.showOpenFilePicker({
    multiple: false,
    types: [{ description: 설명 || '자료 파일', accept: { 'application/json': ['.json'] } }],
  })
  await 넣기(열쇠, h)
  return h
}
