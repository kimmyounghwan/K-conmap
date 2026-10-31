/**
 * 📚 G438 BIM 물량 «도면함» — 넣은 도면(DXF · DWG)을 이 브라우저에 남겨 두는 곳 (2026-10-27)
 *   소장님: 「도면함을 만들고, 체크하면 되게 해줘」 · 「최대한 간편하게」 · 고르심 «이 브라우저에 남김»
 *   - 파일은 이 브라우저의 IndexedDB 에만(어디로도 안 올라감) — 새로고침 · 다음 날 열어도 도면함 그대로
 *   - 목록(이름 · 크기 · 체크 · 판 요약)과 파일 몸(ArrayBuffer)을 따로 둠 — 목록만 먼저 빨리 읽음
 *   - IndexedDB 가 없거나(사생활 창) 용량이 모자라면 이 탭 동안만(오류를 던지지 않고 false 를 돌려줌)
 * 📚 G483 (2026-10-31) — 작업 화면(골조 · 토목 함께 넣기)도 같은 가게를 씀: 함가게(이름) 로 따로 연 DB(«kcm-ws-dwgbox» · lib/넣은도면.js).
 *   두 벌로 만들지 않으려고 BIM 의 것을 «이름만 바꿔» 씀(아래 내보내기 함목록 … 는 BIM 이 쓰던 그대로 «kcm-bim-dwgbox»).
 */
/** 이름(IndexedDB) 하나에 목록 · 몸 두 칸 — { 함목록, 함몸, 함넣기, 함고치기, 함빼기, 함비우기 } */
export function 함가게(이름, 판 = 1) {
  let 열린 = null

  function 열기() {
    if (열린) return 열린
    열린 = new Promise((ok) => {
      try {
        if (typeof indexedDB === 'undefined') { ok(null); return }
        const q = indexedDB.open(이름, 판)
        q.onupgradeneeded = () => {
          const db = q.result
          if (!db.objectStoreNames.contains('목록')) db.createObjectStore('목록', { keyPath: '키' })
          if (!db.objectStoreNames.contains('몸')) db.createObjectStore('몸')
        }
        q.onsuccess = () => ok(q.result)
        q.onerror = () => ok(null)
        q.onblocked = () => ok(null)
      } catch (e) { ok(null) }
    })
    return 열린
  }

  function 일(가게들, 방식, 할) {
    return 열기().then((db) => new Promise((ok) => {
      if (!db) { ok(false); return }
      try {
        const t = db.transaction(가게들, 방식)
        const 값 = 할(t)
        t.oncomplete = () => ok(값 === undefined ? true : 값)
        t.onerror = () => ok(false)
        t.onabort = () => ok(false)
      } catch (e) { ok(false) }
    }))
  }

  return {
    /** 목록 — [{키, 이름, 크기, 때, 켬, 요약}] (넣은 차례) */
    async 함목록() {
      const db = await 열기()
      if (!db) return []
      return new Promise((ok) => {
        try {
          const q = db.transaction('목록', 'readonly').objectStore('목록').getAll()
          q.onsuccess = () => ok((q.result || []).sort((a, b) => (a.차례 || 0) - (b.차례 || 0)))
          q.onerror = () => ok([])
        } catch (e) { ok([]) }
      })
    },
    /** 파일 몸 하나 */
    async 함몸(키) {
      const db = await 열기()
      if (!db) return null
      return new Promise((ok) => {
        try {
          const q = db.transaction('몸', 'readonly').objectStore('몸').get(키)
          q.onsuccess = () => ok(q.result || null)
          q.onerror = () => ok(null)
        } catch (e) { ok(null) }
      })
    },
    /** 넣기(같은 키는 바꿈) — 몸까지 · 성공하면 true(용량이 모자라면 false) */
    함넣기: (항목, 몸) => 일(['목록', '몸'], 'readwrite', (t) => { t.objectStore('목록').put(항목); t.objectStore('몸').put(몸, 항목.키) }),
    /** 목록 칸만 고침(체크 · 판 요약) */
    함고치기: (항목) => 일(['목록'], 'readwrite', (t) => { t.objectStore('목록').put(항목) }),
    함빼기: (키) => 일(['목록', '몸'], 'readwrite', (t) => { t.objectStore('목록').delete(키); t.objectStore('몸').delete(키) }),
    함비우기: () => 일(['목록', '몸'], 'readwrite', (t) => { t.objectStore('목록').clear(); t.objectStore('몸').clear() }),
  }
}

/* BIM 물량(G438) — 예전 그대로 «kcm-bim-dwgbox» */
const BIM = 함가게('kcm-bim-dwgbox')
export const 함목록 = BIM.함목록
export const 함몸 = BIM.함몸
export const 함넣기 = BIM.함넣기
export const 함고치기 = BIM.함고치기
export const 함빼기 = BIM.함빼기
export const 함비우기 = BIM.함비우기
