/**
 * 📏 G686 캐드 폴더(시험판 · 프로그램 없이) — 캐드 명령 KCMS(tools/pc연결/kcm.lsp 1.2)가 «다운로드\K-conmap» 에 쓴
 *   kcms_<번호>.csv 를 작업 화면이 직접 읽음(File System Access — PC 크롬 · 엣지 · 같은 PC)
 *   · «📂 캐드 폴더 잇기» → 그 폴더를 고름(브라우저가 묻는 허락) → 이 창(탭)에서는 계속 씀 — 사이트 안에서 다른 쪽에 갔다 와도 그대로(손잡이는 이 파일 안 변수)
 *   · 🚫 손잡이(FileSystemHandle)를 IndexedDB 에 넣지 않음 — G686 잼(크로뮴 153): 시크릿 창(--incognito)에서 넣어 둔 손잡이를 꺼내면
 *     브라우저가 통째로 꺼짐(SIGTRAP · 일반 창은 됨 · 로컬 폴더 손잡이도 같음) → 일반 창과 시크릿 창을 가를 믿을 길이 없어 아예 안 넣음
 *     → 창을 새로 열면 «📂 캐드 폴더 잇기» 한 번 더(고르는 창이 지난번 폴더에서 열림 — id 'kcm-cad' · 브라우저가 기억)
 *     ⚠️ 다시 넣고 싶어지면 시험_캐드고름.mjs «IndexedDB 안 씀» 이 막음 — 크롬이 고쳤는지 시크릿 창에서 먼저 잴 것(docs/기록 G686)
 *   · 다 쓴 것만 읽음: 리습이 csv 를 다 쓰고 닫은 뒤 같은 이름 .txt 를 씀 → .txt 가 있는 csv 만 · 읽은 뒤 둘 다 지움(폴더가 쌓이지 않게)
 *   · 크롬은 «다운로드» 폴더 자체는 못 고르게 막음(그 안 폴더는 됨 — chromium file_system_access 막는 곳 표) → 리습이 K-conmap 을 만들어 둠
 *   · 도면 · 고른 것은 인터넷으로 안 나감(이 PC 안에서만)
 */
export const 폴더이름 = 'K-conmap'
export const 됨 = () => typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function'

let 지금 = null                       // 이 창에서 이은 폴더(새로 열면 없음)
/** 이 창에서 이은 폴더(없으면 null) */
export const 이은폴더 = () => 지금
/** 이은 폴더를 놓음(폴더가 없어졌을 때) */
export const 놓기 = () => { 지금 = null }

/** 'granted' · 'prompt' · 'denied' — 묻기 = 단추를 눌렀을 때만(브라우저가 사용자 누름 없이는 못 물음) */
export async function 허락(h, 묻기) {
  if (!h || typeof h.queryPermission !== 'function') return 'denied'
  const o = { mode: 'readwrite' }
  let p = await h.queryPermission(o)
  if (p !== 'granted' && 묻기 && typeof h.requestPermission === 'function') p = await h.requestPermission(o)
  return p
}

/** 폴더 고르기(단추 누름 안에서만) — 다운로드에서 시작 · 같은 id 면 지난번 자리 */
export async function 고르기() {
  const h = await window.showDirectoryPicker({ id: 'kcm-cad', mode: 'readwrite', startIn: 'downloads' })
  지금 = h
  return h
}

/** 다 쓴 것(같은 이름 .txt 가 있는 kcms_<번호>.csv)만 → [{ 이름, buf, 때 }] (때 차례) */
export async function 훑기(h) {
  const csv = new Map()
  const 표 = new Set()
  for await (const [n, e] of h.entries()) {
    if (!e || e.kind !== 'file') continue
    const m = /^(kcms_\d+)\.(csv|txt)$/i.exec(n)
    if (!m) continue
    if (m[2].toLowerCase() === 'csv') csv.set(m[1].toLowerCase(), { 이름: n, e })
    else 표.add(m[1].toLowerCase())
  }
  const 낼 = []
  for (const [k, x] of csv) {
    if (!표.has(k)) continue
    const f = await x.e.getFile()
    낼.push({ 이름: x.이름, buf: new Uint8Array(await f.arrayBuffer()), 때: f.lastModified })
  }
  return 낼.sort((a, b) => a.때 - b.때)
}

/** 읽은 kcms_<번호>.csv 와 그 .txt 를 지움(없으면 넘어감) */
export async function 지우기(h, 이름) {
  const k = 이름.replace(/\.csv$/i, '')
  for (const n of [k + '.csv', k + '.txt']) {
    try { await h.removeEntry(n) } catch (e) { /* 이미 없음 · 대소문자 다름 */ }
  }
}
