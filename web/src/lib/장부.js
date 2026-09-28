/* ══════════════════════════════════════════════════════════════
   장부.js — «코드 + 비밀번호» 로 여는 장부 (2026-09-29)

   소장님: 「되도록 사이트내에서 사용 할 수 있는 프로그램으로 만들어 줘」 →
           (고름) 저장은 «코드+비밀번호로 여러 기기» — 현장 투입비(/tools/tuipbi)와 같은 방식.

   ■ 현장 투입비(Tuipbi.jsx)가 쓰는 방식을 «이름 앞머리(ns)» 만 바꿔 여러 프로그램이 같이 씁니다.
       {ns}_pins/{코드}        비밀번호 해시(아무도 못 읽음 · 한 번만 씀)
       {ns}_keys/{코드}/{uid}  이 브라우저가 맞는 해시를 써야 그 장부를 읽고 씀(규칙이 확인)
       {ns}_books/{코드}       장부 정보(이름·만든 때·지운 때 del)
       {ns}_{자리}/{코드}/{번호} 적은 것들
       {ns}_trash/{코드}/{번호} 휴지통 {p: 자리, k: 번호, v: 값, at} — 30일 뒤 매일 백업이 비움
     쓰는 곳: 🚜 장비 임대료·수금 장부(ns = 'eq') · ⚠️ 위험성평가(ns = 'rk')
     규칙: web/database.rules.json · 매일 백업: tools/공사일보백업.py (자리를 더해 둠)
   ■ 파이어베이스는 «장부를 열 때만» 받습니다. get() 만(실시간 구독 없음).
   ■ 잠글 칸(사업자번호·계좌 등)은 tplock.js 로 브라우저에서 잠가 «x» 한 칸에 둡니다 — 서버는 못 읽습니다.
   ══════════════════════════════════════════════════════════════ */
import { 코드만들기, 비번해시 } from './tuipbi.js'
import { 열쇠만들기, 열쇠두기, 열쇠읽기, 열쇠지우기 } from './tplock.js'

/* ⚠️ 코드정리·코드보기(lib/tuipbi.js) · 잠그기·풀기(lib/tplock.js) 는 «그 파일에서 바로» import 하십시오.
   여기서 «다시 내보내기(re-export)» 를 하면 tools/checkimports.py 가 한글 이름을 «장부.js 것» 으로 세어
   이 이름을 쓰는 다른 파일 26곳을 «import 안 함» 으로 잡습니다(배포 검사가 멈춤 — 2026-09-29 겪음). */
export const 휴지통날 = 30

let _fb = null
export const loadFb = async () => {
  if (!_fb) {
    const [d, f] = await Promise.all([import('firebase/database'), import('../firebase.js')])
    _fb = { ...d, db: f.db, ensureAnon: f.ensureAnon }
  }
  return _fb
}

export const 막힘 = (e) => /permission|PERMISSION/.test(String((e && (e.code || e.message)) || e))

/* 이 기기에서 연 장부 목록 */
const 목록자리 = (ns) => `kcm-${ns}-books`
export function 목록읽기(ns) { try { return JSON.parse(localStorage.getItem(목록자리(ns))) || [] } catch (e) { return [] } }
export function 목록기억(ns, c, n) {
  const v = [{ c, n }, ...목록읽기(ns).filter((x) => x.c !== c)].slice(0, 20)
  try { localStorage.setItem(목록자리(ns), JSON.stringify(v)) } catch (e) { /* 개인 창 */ }
  return v
}
export function 목록잊기(ns, c) {
  const v = 목록읽기(ns).filter((x) => x.c !== c)
  try { localStorage.setItem(목록자리(ns), JSON.stringify(v)) } catch (e) { /* 개인 창 */ }
  return v
}

/**
 * 장부 하나를 다루는 손잡이.
 *   ns     'eq' | 'rk'
 *   자리들  ['rows', 'pay', ...] — {ns}_{자리}/{코드} 로 읽고 씀
 */
export function 장부(ns, 자리들) {
  const 곳 = (자리) => `${ns}_${자리}`

  async function 불러오기(c) {
    const fb = await loadFb()
    await fb.ensureAnon()
    const b = await fb.get(fb.ref(fb.db, `${곳('books')}/${c}`))
    if (!b.exists()) throw Object.assign(new Error('없음'), { code: 'PERMISSION_DENIED' })
    const 값들 = await Promise.all(자리들.map((z) => fb.get(fb.ref(fb.db, `${곳(z)}/${c}`)).then((s) => s.val() || {})))
    let 통 = {}
    try { 통 = (await fb.get(fb.ref(fb.db, `${곳('trash')}/${c}`))).val() || {} } catch (e) { 통 = {} }
    const 자료 = {}
    자리들.forEach((z, i) => { 자료[z] = 값들[i] })
    return { 정보: b.val(), 자료, 휴지통: 통, 열쇠: 열쇠읽기(c) }
  }

  async function 열기(c, pw) {
    const fb = await loadFb()
    const u = await fb.ensureAnon()
    const h = await 비번해시(c, pw)
    await fb.set(fb.ref(fb.db, `${곳('keys')}/${c}/${u.uid}`), h)
    열쇠두기(c, await 열쇠만들기(c, pw))
    return 불러오기(c)
  }

  async function 만들기(정보, pw) {
    const fb = await loadFb()
    const u = await fb.ensureAnon()
    let c = '', h = ''
    for (let i = 0; i < 4 && !c; i++) {
      const t = 코드만들기()
      const th = await 비번해시(t, pw)
      try { await fb.set(fb.ref(fb.db, `${곳('pins')}/${t}`), th); c = t; h = th } catch (e) { if (!막힘(e)) throw e }
    }
    if (!c) throw new Error('코드를 만들지 못했습니다')
    await fb.set(fb.ref(fb.db, `${곳('keys')}/${c}/${u.uid}`), h)
    const v = { ...정보, at: Date.now() }
    await fb.set(fb.ref(fb.db, `${곳('books')}/${c}`), v)
    const raw = await 열쇠만들기(c, pw)
    열쇠두기(c, raw)
    return { 코드: c, 정보: v, 열쇠: raw }
  }

  async function 정보저장(c, v) {
    const fb = await loadFb()
    await fb.set(fb.ref(fb.db, `${곳('books')}/${c}`), v)
  }

  /** 한 곳만 읽기 — 위험성평가 사진처럼 «열 때만» 받는 것 (자리들에 넣지 않은 자리) */
  async function 하나읽기(c, 자리, id) {
    const fb = await loadFb()
    await fb.ensureAnon()
    return (await fb.get(fb.ref(fb.db, `${곳(자리)}/${c}/${id}`))).val()
  }

  /** 한 줄 쓰기 — id 가 없으면 새 번호. 돌려주는 것: 번호 */
  async function 쓰기(c, 자리, id, v) {
    const fb = await loadFb()
    let nid = id
    if (!nid) nid = fb.push(fb.ref(fb.db, `${곳(자리)}/${c}`)).key
    await fb.set(fb.ref(fb.db, `${곳(자리)}/${c}/${nid}`), v)
    return nid
  }

  /** 🗑 지우기 = 휴지통으로 옮기기 — 옮기기와 지우기를 한 번에(update). 옮기지 못하면 지우지도 않습니다 */
  async function 지우기(c, 자리, id, v) {
    const fb = await loadFb()
    const t = fb.push(fb.ref(fb.db, `${곳('trash')}/${c}`)).key
    const 새 = { p: 자리, k: id, v, at: Date.now() }
    await fb.update(fb.ref(fb.db), { [`${곳('trash')}/${c}/${t}`]: 새, [`${곳(자리)}/${c}/${id}`]: null })
    return [t, 새]
  }

  async function 되살리기(c, t, x) {
    const fb = await loadFb()
    await fb.update(fb.ref(fb.db), { [`${곳(x.p)}/${c}/${x.k}`]: x.v, [`${곳('trash')}/${c}/${t}`]: null })
  }

  async function 장부지우기(c) {
    const fb = await loadFb()
    const t = Date.now()
    await fb.set(fb.ref(fb.db, `${곳('books')}/${c}/del`), t)
    return t
  }
  async function 장부되살리기(c) {
    const fb = await loadFb()
    await fb.remove(fb.ref(fb.db, `${곳('books')}/${c}/del`))
  }
  /** 🔒 이 기기에 잠금 열쇠가 없을 때(저장소를 비움 등) — 비밀번호가 맞는지는 «이 브라우저가 맞힌 해시({ns}_keys)» 와 견줍니다 */
  async function 잠금풀기(c, pw) {
    try {
      const fb = await loadFb()
      const u = await fb.ensureAnon()
      const mine = await fb.get(fb.ref(fb.db, `${곳('keys')}/${c}/${u.uid}`))
      if (mine.val() !== await 비번해시(c, pw)) return null
      const raw = await 열쇠만들기(c, pw)
      열쇠두기(c, raw)
      return raw
    } catch (e) { return null }
  }

  async function 이기기잊기(c) {
    try { const fb = await loadFb(); const u = await fb.ensureAnon(); await fb.remove(fb.ref(fb.db, `${곳('keys')}/${c}/${u.uid}`)) } catch (e) { /* 그래도 잊음 */ }
    열쇠지우기(c)
    목록잊기(ns, c)
  }

  return { 불러오기, 열기, 만들기, 정보저장, 하나읽기, 쓰기, 지우기, 되살리기, 장부지우기, 장부되살리기, 잠금풀기, 이기기잊기 }
}
