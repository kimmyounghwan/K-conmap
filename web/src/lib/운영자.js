/**
 * 🔑 운영자 — 「이 브라우저가 소장님 것인가」 한 곳에서만 봅니다 (2026-09-18)
 *
 * ■ 왜 따로 뺐나
 *    전에는 `Qna.jsx` 안에 `OPS`/`isOp` 가 있었습니다. 그래서 운영자인지 보려는
 *    화면(Admin·ReportMake·Report)이 **사랑방 화면을 통째로 끌고 왔습니다.**
 *    번호 목록 한 줄을 보려고 게시판 코드를 받는 셈이었습니다. 여기 한 곳으로 옮깁니다.
 *
 * ■ 🚨 `database.rules.json` 의 `op` 규칙과 «반드시 같아야» 합니다.
 *    한쪽만 고치면 화면은 표를 붙이려 하는데 서버가 막아 「올리지 못했습니다」 가 납니다.
 *    기기를 더하실 땐 아래 목록과 규칙 둘 다에 번호를 넣고 `3_규칙올리기.bat` 을 한 번.
 *
 * ⚠️ uid 를 여기 적어도 안전합니다 — 익명 로그인은 «원하는 uid 로» 로그인할 수 없습니다.
 */
export const OPS = [
  'ZglL1g3X5UZFBA2590LirDnEnil1',      // 소장님 (사무실 크롬, 2026-09-17 등록)
]

export const isOp = (uid) => !!uid && OPS.includes(uid)

/**
 * 🔖 2026-09-18 — 소장님: 「여전히 내가 업체 성적표를 실행해 볼 수 있는 버튼이 없어」
 *
 * 전에는 `/admin` 에 들러야 `kcm_op` 가 심겼습니다. 그 화면을 안 들르면 단추가
 * 영영 안 보였습니다. **소장님이 손으로 들러야 하는 단계를 만들면 안 됩니다.**
 *
 * 그래서 파이어베이스가 «이미 브라우저에 적어 둔» 번호를 그냥 읽습니다.
 *
 * 🚨 «어디에» 적어 두는지를 제가 틀렸습니다 (2026-09-18 실측으로 잡음)
 *    처음에 `localStorage` 를 뒤졌는데 **거기엔 없습니다.**
 *    파이어베이스 인증(v9 이상)은 **IndexedDB** 에 넣습니다:
 *
 *        DB     firebaseLocalStorageDb
 *        창고   firebaseLocalStorage
 *        열쇠   firebase:authUser:{apiKey}:[DEFAULT]
 *        값     { fbase_key, value: { uid, … } }
 *
 *    ⚠️ 같은 DB 에 `…:chk` 로 끝나는 열쇠도 있습니다 — **다른 앱 이름이라 uid 가 다릅니다.**
 *       반드시 `[DEFAULT]` 로 끝나는 것만 보십시오.
 *    ⚠️ IndexedDB 는 «비동기» 입니다. 그래서 이 함수는 약속(Promise)을 돌려줍니다 —
 *       화면에서는 `useEffect` 로 받아 `useState` 에 넣으십시오.
 *
 * 읽기만 하므로 **파이어베이스 꾸러미를 받지 않습니다** — /report 는 설명만 있는
 * 가벼운 화면이라 방문자에게 인증 꾸러미를 받게 하면 안 됩니다.
 *
 * ⚠️ 이건 «문 앞 이름표» 입니다. 진짜 자물쇠가 아닙니다 —
 *    누구든 브라우저 저장소에 아무 번호나 적어 넣을 수 있습니다.
 *    진짜 자물쇠는 ① 서버 규칙(database.rules.json)과
 *    ② **자료** 입니다: 성적표는 소장님 컴퓨터의 `data/store/first.json` 이 있어야
 *    만들어지고, 그 파일은 사이트에 올라가 있지 않습니다.
 */
const 파이어열쇠 = (k) => typeof k === 'string'
  && k.indexOf('firebase:authUser:') === 0 && k.lastIndexOf(':[DEFAULT]') === k.length - 10

/** 옛 길 — 어떤 브라우저는 localStorage 로 떨어집니다(사생활 보호 창 등) */
function 곳간에서() {
  try {
    const ls = window.localStorage
    for (let i = 0; i < ls.length; i++) {
      const k = ls.key(i)
      if (!파이어열쇠(k)) continue
      const u = JSON.parse(ls.getItem(k) || 'null')
      if (u && u.uid) return String(u.uid)
    }
  } catch { /* 저장소가 막힌 창 */ }
  return ''
}

/** 이 브라우저에 적힌 번호 — 없으면 빈 글자 */
export function 내번호() {
  return new Promise((다됨) => {
    const 곳간 = 곳간에서()
    let 끝났나 = false
    const 내놓기 = (v) => { if (!끝났나) { 끝났나 = true; 다됨(v || 곳간) } }
    /* IndexedDB 가 안 열리는 창도 있습니다 — 1초 넘으면 곳간 쪽 답으로 끝냅니다 */
    setTimeout(() => 내놓기(''), 1000)
    try {
      const rq = window.indexedDB.open('firebaseLocalStorageDb')
      rq.onerror = () => 내놓기('')
      rq.onsuccess = () => {
        try {
          const db = rq.result
          if (!db.objectStoreNames.contains('firebaseLocalStorage')) return 내놓기('')
          const g = db.transaction('firebaseLocalStorage', 'readonly')
                      .objectStore('firebaseLocalStorage').getAll()
          g.onerror = () => 내놓기('')
          g.onsuccess = () => {
            for (const r of (g.result || [])) {
              if (파이어열쇠(r && r.fbase_key) && r.value && r.value.uid) {
                return 내놓기(String(r.value.uid))
              }
            }
            내놓기('')
          }
        } catch { 내놓기('') }
      }
    } catch { 내놓기('') }
  })
}

/** 이 브라우저가 운영자 것인가 — 옛 표식(`kcm_op`)도 그대로 받아 줍니다 */
export function 나운영자() {
  try { if (window.localStorage.getItem('kcm_op') === '1') return Promise.resolve(true) }
  catch { /* 무시 */ }
  return 내번호().then((u) => isOp(u))
}
