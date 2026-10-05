/* ══════════════════════════════════════════════════════════════
   이어쓰기.js — 🔗 «코드 + 비밀번호» 로 폰·PC 어디서든 이어 쓰기 (2026-10-02 · G113)

   소장님: 「자기가 한 번 쓰면 기록이 되는 거잖아. 이어서 쓸 수 있는 방법은 없어? 있어야 해」
           「프로그램으로 쓰는 것은 다 찾아서 그렇게 해줘. 계속 연결되는 작업인 경우 … 실수 하면 안 되고, 설명까지」
           → (고름) 노무비 명단은 «브라우저에서 잠가 올리기» · 사진·도면처럼 큰 것은 «백업 파일»

   ■ 프로그램 상태(지금까지 localStorage 에 두던 한 덩이)를 통째로 «잠가서» 서버 한 칸에 둡니다.
       {ns}_pins/{코드}        비밀번호 해시 — 아무도 못 읽음 (lib/장부.js 와 같은 문)
       {ns}_keys/{코드}/{uid}  이 브라우저가 맞힌 해시 — 규칙이 대조
       {ns}_books/{코드}       {name, at, upd?, del?}
       {ns}_doc/{코드}         {s: 잠근 글('v1.' — lib/tplock.js), r: 판 번호, at: 서버 시각, by: 'PC' | '폰'}
     ns: sn 산안비 · sk 손익 장부 · ib 작업일보 · nm 노무비 · jm 지명원 · gj 견적서 · sc 예정공정표 · wc 공사서류 원클릭
         · bj 보험료 정산 청구서(G146 · 2026-10-05)
     규칙: web/database.rules.json · 매일 백업: tools/공사일보백업.py (묶음들)

   ■ 판 번호 r — 규칙이 «서버 판 + 1» 만 받습니다(처음은 1).
     두 기기가 같은 판에서 고치면 «늦게 올린 쪽» 이 막힙니다 → 덮어써서 사라지는 일이 없고, 화면이 고르게 합니다.
   ■ 잠금 — 상태 전부를 비밀번호에서 만든 열쇠(PBKDF2 → AES-GCM, tplock.js)로 잠급니다. 서버 · 저희는 못 읽습니다.
     비밀번호를 잊으면 서버 것은 못 엽니다(이 브라우저 것 · 백업 파일은 그대로).
   ■ 이 기기의 연결: localStorage 'kcm-bk-{ns}' = {c 코드, n 이름, r 맞춘 판, d 못 올린 고침, t 마지막 맞춘 때}
     바꾸기 전 모습 한 벌: 'kcm-bk-{ns}-prev' = {at, 상태} — «되돌리기 · 파일로 받기»
   ■ 파이어베이스는 «연결했을 때만» 받습니다(get · set 만, 실시간 구독 없음).
   ══════════════════════════════════════════════════════════════ */
import { 장부, loadFb, 막힘 } from './장부.js'
import { 잠그기, 풀기, 열쇠읽기 } from './tplock.js'

export const 이어쓰기들 = ['sn', 'sk', 'ib', 'nm', 'jm', 'gj', 'sc', 'wc', 'bj']
export const 최대글 = 2900000          // 규칙 s ≤ 3,000,000 보다 조금 작게

const 연결자리 = (ns) => `kcm-bk-${ns}`
const 앞자리 = (ns) => `kcm-bk-${ns}-prev`

export function 연결읽기(ns) {
  try { const v = JSON.parse(localStorage.getItem(연결자리(ns))); return v && typeof v.c === 'string' && v.c.length === 9 ? v : null } catch (e) { return null }
}
export function 연결쓰기(ns, v) {
  try { if (v) localStorage.setItem(연결자리(ns), JSON.stringify(v)); else localStorage.removeItem(연결자리(ns)) } catch (e) { /* 개인 창 */ }
  return v
}
export function 앞모습읽기(ns) { try { return JSON.parse(localStorage.getItem(앞자리(ns))) } catch (e) { return null } }
export function 앞모습두기(ns, 상태) {
  try { localStorage.setItem(앞자리(ns), JSON.stringify({ at: Date.now(), 상태 })); return true } catch (e) { return false }
}
export function 앞모습지우기(ns) { try { localStorage.removeItem(앞자리(ns)) } catch (e) { /* 없음 */ } }

export const 기기이름 = () => (/Mobi|Android|iPhone|iPad/i.test((typeof navigator !== 'undefined' && navigator.userAgent) || '') ? '폰' : 'PC')

/**
 * 서버 판 · 이 기기 판 · 못 올린 고침 → 할 일 (인터넷 없이 시험합니다 — tools/시험_이어쓰기.mjs)
 *   '없음'  서버에 아직 없음 → 올림(판 1)
 *   '같음'  할 일 없음
 *   '올림'  이 기기만 고침 → 올림
 *   '받음'  다른 기기가 고침 · 이 기기는 안 고침 → 받음
 *   '충돌'  둘 다 고침 → 사람이 고름(덮어쓰지 않음)
 */
export function 이어할일(서버판, 내판, 고침) {
  if (서버판 == null) return '없음'
  if (서버판 === 내판) return 고침 ? '올림' : '같음'
  return 고침 ? '충돌' : '받음'
}

/** 백업 파일 — 한 프로그램 상태를 JSON 글로 / 글에서 */
export function 이어파일글(ns, 이름, 상태) {
  return JSON.stringify({ kcm: '이어쓰기', ns, 이름, v: 1, at: new Date().toISOString(), 상태 }, null, 1)
}
export function 이어파일읽기(ns, 글) {
  let x
  try { x = JSON.parse(글) } catch (e) { return { 오류: 'JSON 파일이 아닙니다.' } }
  if (!x || x.kcm !== '이어쓰기' || !x.상태 || typeof x.상태 !== 'object') return { 오류: 'K-건설맵 백업 파일이 아닙니다.' }
  if (x.ns !== ns) return { 오류: `다른 프로그램(${x.이름 || x.ns})의 백업 파일입니다.` }
  return { 상태: x.상태, at: x.at }
}

export function 이어손잡이(ns) {
  if (!이어쓰기들.includes(ns)) throw new Error('모르는 ns ' + ns)
  const 장 = 장부(ns, ['doc'])
  const 곳 = (c) => `${ns}_doc/${c}`

  /** 서버 판만 (작음) — 없으면 null */
  async function 판보기(c) {
    const fb = await loadFb()
    await fb.ensureAnon()
    const v = (await fb.get(fb.ref(fb.db, `${곳(c)}/r`))).val()
    return typeof v === 'number' ? v : null
  }

  /** 서버 것 받기 → {상태, r, at, by} · 서버에 없으면 null · 못 풀면 {잠김: true} */
  async function 받기(c, 열쇠) {
    const fb = await loadFb()
    await fb.ensureAnon()
    const d = (await fb.get(fb.ref(fb.db, 곳(c)))).val()
    return 풀어보기(d, 열쇠)
  }
  async function 풀어보기(d, 열쇠) {
    if (!d || typeof d.s !== 'string') return null
    const 상태 = 열쇠 ? await 풀기(열쇠, d.s) : null
    if (!상태 || typeof 상태 !== 'object') return { 잠김: true, r: d.r }
    return { 상태, r: d.r, at: d.at, by: d.by }
  }

  /** 올리기 — 판(이 기기가 맞춘 서버 판) 다음 번호로. 돌려주는 것: 새 판
   *  막히면: 서버 판이 달라졌으면 {code:'충돌', 서버판} · 아니면 그대로 던짐 */
  async function 올리기(c, 열쇠, 상태, 판) {
    if (!열쇠) throw Object.assign(new Error('열쇠 없음'), { code: '열쇠' })
    const s = await 잠그기(열쇠, 상태)
    if (s.length > 최대글) throw Object.assign(new Error('너무 큼'), { code: '큼' })
    const fb = await loadFb()
    await fb.ensureAnon()
    const r = (판 || 0) + 1
    try {
      await fb.set(fb.ref(fb.db, 곳(c)), { s, r, at: fb.serverTimestamp(), by: 기기이름() })
      return r
    } catch (e) {
      if (막힘(e)) {
        let 서버판
        try { 서버판 = await 판보기(c) } catch (e2) { throw e }     // 판도 못 보면 «충돌» 이라 하지 않음
        if ((서버판 ?? 0) !== (판 || 0)) throw Object.assign(new Error('충돌'), { code: '충돌', 서버판 })
      }
      throw e
    }
  }

  /** 새 코드 — 장부 만들고 지금 상태를 판 1로 올림 */
  async function 만들기(이름, pw, 상태) {
    const r0 = await 장.만들기({ name: String(이름 || '').trim().slice(0, 60) || '이어 쓰기' }, pw)
    const r = await 올리기(r0.코드, r0.열쇠, 상태, 0)
    return { 코드: r0.코드, 이름: r0.정보.name, 열쇠: r0.열쇠, r }
  }

  /** 코드 + 비밀번호로 열기 → {코드, 이름, 열쇠, 서버: {상태, r, …} | null} */
  async function 열기(c, pw) {
    const x = await 장.열기(c, pw)                 // 비밀번호가 틀리면 PERMISSION_DENIED
    const 서버 = await 풀어보기(x.자료.doc, x.열쇠)
    return { 코드: c, 이름: (x.정보 && x.정보.name) || '', 열쇠: x.열쇠, 서버 }
  }

  /** 이 기기에 잠금 열쇠가 없을 때(저장소 비움 등) 비밀번호로 다시 */
  const 잠금풀기 = (c, pw) => 장.잠금풀기(c, pw)
  /** 이 기기에서 끊기 — 서버 것은 그대로 · 이 기기 열쇠만 지움 */
  async function 끊기(c) { await 장.이기기잊기(c); 연결쓰기(ns, null) }
  const 열쇠 = (c) => 열쇠읽기(c)

  return { 판보기, 받기, 올리기, 만들기, 열기, 잠금풀기, 끊기, 열쇠 }
}
