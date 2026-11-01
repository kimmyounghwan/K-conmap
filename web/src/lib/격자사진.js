/* 📷 G492 (2026-11-01) 서식 «종이에 바로 쓰기» 사진 칸 — 이 브라우저(IndexedDB)에 남김
 *   소장님: 「사진 대지도 도구화 해줘. 내 컴퓨터에서 사진 불러 와서.. 편하게」
 *   · 열쇠 = `${slug}|${판}`(판 = 'cur' 쓰던 것 · 저장 id) → { 들: [{ 칸: 'si|r,c', 바이트: Uint8Array(JPEG), w, h, 때 }] }
 *   · 사진은 서버로 가지 않습니다. 쓰던 것(cur)은 바뀔 때마다 · 저장한 것은 그 id 로.
 */
const DB = 'kcm-격자사진', 표 = '사진'
let _열기 = null
function 열기() {
  if (_열기) return _열기
  _열기 = new Promise((ok, no) => {
    try {
      const q = indexedDB.open(DB, 1)
      q.onupgradeneeded = () => { const d = q.result; if (!d.objectStoreNames.contains(표)) d.createObjectStore(표) }
      q.onsuccess = () => ok(q.result)
      q.onerror = () => no(q.error || new Error('indexedDB'))
    } catch (e) { no(e) }
  })
  _열기.catch(() => { _열기 = null })
  return _열기
}
const 일 = (모드, f) => 열기().then((d) => new Promise((ok, no) => {
  const t = d.transaction(표, 모드), s = t.objectStore(표)
  const r = f(s)
  t.oncomplete = () => ok(r && 'result' in r ? r.result : undefined)
  t.onerror = () => no(t.error)
  t.onabort = () => no(t.error)
}))
/** 사진들(Map 칸 → {바이트, w, h, 때}) 를 남김 — 비면 지움 */
export async function 사진남기기(slug, 판, 사진들) {
  const 들 = []
  for (const [칸, p] of 사진들) 들.push({ 칸, 바이트: p.바이트, w: p.w, h: p.h, 때: p.때 || '' })
  try { if (!들.length) await 일('readwrite', (s) => s.delete(`${slug}|${판}`)); else await 일('readwrite', (s) => s.put({ 들, at: Date.now() }, `${slug}|${판}`)); return true } catch (e) { return false }
}
/** → [{칸, 바이트, w, h, 때}] (없으면 []) */
export async function 사진꺼내기(slug, 판) {
  try { const v = await 일('readonly', (s) => s.get(`${slug}|${판}`)); return v && Array.isArray(v.들) ? v.들 : [] } catch (e) { return [] }
}
export async function 사진지우기(slug, 판) { try { await 일('readwrite', (s) => s.delete(`${slug}|${판}`)); return true } catch (e) { return false } }
/** 바이트(JPEG) → 그릴 수 있는 그림(ImageBitmap · 안 되면 <img>) */
export async function 그림으로(바이트) {
  const blob = new Blob([바이트], { type: 'image/jpeg' })
  try { return await createImageBitmap(blob) } catch (e) {
    const url = URL.createObjectURL(blob)
    try {
      const img = new Image()
      img.decoding = 'async'
      await new Promise((ok, no) => { img.onload = () => ok(); img.onerror = () => no(new Error('그림을 못 읽음')); img.src = url })
      return img
    } finally { setTimeout(() => URL.revokeObjectURL(url), 10000) }
  }
}
