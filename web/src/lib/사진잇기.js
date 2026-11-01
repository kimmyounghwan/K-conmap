/* 📱🔗 사진 잇기 — 현장 코드 + 비밀번호로 폰 ↔ PC 가 사진대지를 «실시간» 으로 같이 씀 (G493 · 2026-11-01)
 *   소장님: 「현장에서 사진을 찍으면 실시간으로 pc에서 사진대지가 완성된다는 거야?」 → «현장 코드 방식» 고르심
 *           「사진대지 도구는 총 2개가 되는 거야. 알지? 이건 실시간으로 되는 것으로 해줘」
 *
 * ■ 소장님(11-01 12:4x) 「아니, 방금 만든 사진도구 하나. 이번에 만들고 있는 사진도구 실시간 따로 따로」 「이미 만든건 두고... 이용자가 선택해서 사용하게」
 *   → 서식 사진 칸(격자작성) · 사진대지 도구(/tools/photo)는 그대로. 실시간은 **따로** /tools/photo-live(pages/PhotoLive.jsx · ns 'pb') 하나.
 * ■ 서버 자리(web/database.rules.json — bj_* 와 같은 문 + pic):
 *     {ns}_pins/{코드} · {ns}_keys/{코드}/{uid} · {ns}_books/{코드}        — lib/장부.js 그대로(코드 · 비밀번호)
 *     {ns}_doc/{코드} = { s(잠근 상태 글 · 사진 바이트는 안 듦), r(판), at, by }  — lib/이어쓰기.js 와 같은 꼴(r = 서버 판 + 1)
 *     {ns}_pic/{코드}/{사진id} = { s(잠근 {b: base64 JPEG, w, h, 때}), at, by }   — 사진 한 장 = 한 칸(≤ 1,500,000 자)
 *   사진은 비밀번호로 잠가 올리므로 서버 · 운영자는 못 봅니다. 7일 지난 사진은 매일 정리(tools/공사일보백업.py)가 지웁니다 — 각 기기엔 남음.
 * ■ 실시간: 판지켜보기(onValue · {ns}_doc/{코드}/r 작은 칸 하나)로 다른 기기가 올린 것을 몇 초 안에 알아채고, 상태 글을 받아
 *   «합치기pb»(아래 순수 함수 — 시험 tools/시험_사진잇기.mjs) — 사진은 양쪽 합(id 로 · 지운 것은 묘비) · 글은 늦게 고친 쪽.
 * ■ 폰이 인터넷이 없으면 못 올린 사진 id 를 기억(kcm-{ns}-pending)했다가 online · 다시 볼 때 올립니다.
 */
import { 장부, loadFb, 막힘 } from './장부.js'
import { 열쇠읽기, 잠그기, 풀기 } from './tplock.js'
import { 사진잇기들, 최대상태글, 최대사진글, 사진긴쪽, 기기이름 } from './사진잇기셈.js'   /* 순수 셈(합치기pb · 새사진id …)은 그 파일에서 바로 import */

const 연결자리 = (ns) => `kcm-${ns}-link`
const 밀린자리 = (ns) => `kcm-${ns}-pending`
export function 연결읽기(ns) { try { const v = JSON.parse(localStorage.getItem(연결자리(ns))); return v && typeof v.c === 'string' && v.c.length === 9 ? v : null } catch (e) { return null } }
export function 연결쓰기(ns, v) { try { if (v) localStorage.setItem(연결자리(ns), JSON.stringify(v)); else localStorage.removeItem(연결자리(ns)) } catch (e) { /* 개인 창 */ } return v }
export function 밀린읽기(ns) { try { return JSON.parse(localStorage.getItem(밀린자리(ns))) || [] } catch (e) { return [] } }
export function 밀린쓰기(ns, 들) { try { if (들 && 들.length) localStorage.setItem(밀린자리(ns), JSON.stringify(들)); else localStorage.removeItem(밀린자리(ns)) } catch (e) { /* */ } }
const b64 = (u8) => { let s = ''; const 덩 = 0x8000; for (let i = 0; i < u8.length; i += 덩) s += String.fromCharCode.apply(null, u8.subarray(i, i + 덩)); return btoa(s) }
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))

/* ══════════ 이 기기 창고(IndexedDB) — 사진 바이트 · 상태 ══════════ */
/** kcm-{ns}-store: '사진' 표(id → {작업본, 작은그림, 너비, 높이, 그림때}) · '상태' 표('doc' → 상태 글) */
export function 창고(ns) {
  const DB = `kcm-${ns}-store`
  let _열기 = null
  const 열기 = () => {
    if (_열기) return _열기
    _열기 = new Promise((ok, no) => {
      try {
        const q = indexedDB.open(DB, 1)
        q.onupgradeneeded = () => { const d = q.result; for (const t of ['사진', '상태']) if (!d.objectStoreNames.contains(t)) d.createObjectStore(t) }
        q.onsuccess = () => ok(q.result)
        q.onerror = () => no(q.error || new Error('indexedDB'))
      } catch (e) { no(e) }
    })
    _열기.catch(() => { _열기 = null })
    return _열기
  }
  const 일 = (표, 모드, f) => 열기().then((d) => new Promise((ok, no) => {
    const t = d.transaction(표, 모드), s = t.objectStore(표)
    const r = f(s)
    t.oncomplete = () => ok(r && 'result' in r ? r.result : undefined)
    t.onerror = () => no(t.error); t.onabort = () => no(t.error)
  }))
  return {
    async 사진넣기(id, v) { try { await 일('사진', 'readwrite', (s) => s.put(v, id)); return true } catch (e) { return false } },
    async 사진꺼내기(id) { try { return (await 일('사진', 'readonly', (s) => s.get(id))) || null } catch (e) { return null } },
    async 사진들꺼내기(ids) { const m = new Map(); for (const id of ids || []) { const v = await this.사진꺼내기(id); if (v) m.set(id, v) } return m },
    async 사진지우기(ids) { try { await 일('사진', 'readwrite', (s) => { for (const id of ids || []) s.delete(id) }); return true } catch (e) { return false } },
    async 사진모두지우기() { try { await 일('사진', 'readwrite', (s) => s.clear()); return true } catch (e) { return false } },
    async 상태넣기(v) { try { await 일('상태', 'readwrite', (s) => s.put(v, 'doc')); return true } catch (e) { return false } },
    async 상태꺼내기() { try { return (await 일('상태', 'readonly', (s) => s.get('doc'))) || null } catch (e) { return null } },
    async 상태지우기() { try { await 일('상태', 'readwrite', (s) => s.delete('doc')); return true } catch (e) { return false } },
  }
}

/* ══════════ 서버 ══════════ */
export function 사진잇기손잡이(ns) {
  if (!사진잇기들.includes(ns)) throw new Error('모르는 ns ' + ns)
  const 장 = 장부(ns, ['doc'])
  const 곳 = (c) => `${ns}_doc/${c}`
  const 그림곳 = (c, id) => `${ns}_pic/${c}/${id}`

  async function 판보기(c) {
    const fb = await loadFb(); await fb.ensureAnon()
    const v = (await fb.get(fb.ref(fb.db, `${곳(c)}/r`))).val()
    return typeof v === 'number' ? v : null
  }
  async function 풀어보기(d, 열쇠) {
    if (!d || typeof d.s !== 'string') return null
    const 상태 = 열쇠 ? await 풀기(열쇠, d.s) : null
    if (!상태 || typeof 상태 !== 'object') return { 잠김: true, r: d.r }
    return { 상태, r: d.r, at: d.at, by: d.by }
  }
  async function 받기(c, 열쇠) {
    const fb = await loadFb(); await fb.ensureAnon()
    return 풀어보기((await fb.get(fb.ref(fb.db, 곳(c)))).val(), 열쇠)
  }
  /** 올리기 — 판 다음 번호로. 막히면(다른 기기가 먼저) {code:'충돌', 서버판} */
  async function 올리기(c, 열쇠, 상태, 판) {
    if (!열쇠) throw Object.assign(new Error('열쇠 없음'), { code: '열쇠' })
    const s = await 잠그기(열쇠, 상태)
    if (s.length > 최대상태글) throw Object.assign(new Error('너무 큼'), { code: '큼' })
    const fb = await loadFb(); await fb.ensureAnon()
    const r = (판 || 0) + 1
    try { await fb.set(fb.ref(fb.db, 곳(c)), { s, r, at: fb.serverTimestamp(), by: 기기이름() }); return r } catch (e) {
      if (막힘(e)) { let 서버판; try { 서버판 = await 판보기(c) } catch (e2) { throw e }; if ((서버판 ?? 0) !== (판 || 0)) throw Object.assign(new Error('충돌'), { code: '충돌', 서버판 }) }
      throw e
    }
  }
  /** 사진 한 장 올리기 — 바이트(JPEG Uint8Array) 를 잠가서 */
  async function 사진올리기(c, 열쇠, id, p) {
    if (!열쇠) throw Object.assign(new Error('열쇠 없음'), { code: '열쇠' })
    const s = await 잠그기(열쇠, { b: b64(p.바이트), w: p.w, h: p.h, 때: p.때 || '' })
    if (s.length > 최대사진글) throw Object.assign(new Error('사진이 너무 큼'), { code: '큼' })
    const fb = await loadFb(); await fb.ensureAnon()
    await fb.set(fb.ref(fb.db, 그림곳(c, id)), { s, at: fb.serverTimestamp(), by: 기기이름() })
    return id
  }
  /** 사진 한 장 받기 → {바이트, w, h, 때} · 없으면 null */
  async function 사진받기(c, 열쇠, id) {
    const fb = await loadFb(); await fb.ensureAnon()
    const d = (await fb.get(fb.ref(fb.db, 그림곳(c, id)))).val()
    if (!d || typeof d.s !== 'string') return null
    const x = await 풀기(열쇠, d.s)
    if (!x || typeof x.b !== 'string') return null
    return { 바이트: unb64(x.b), w: x.w, h: x.h, 때: x.때 || '' }
  }
  async function 사진지우기(c, id) { const fb = await loadFb(); await fb.ensureAnon(); await fb.remove(fb.ref(fb.db, 그림곳(c, id))) }
  /** 🔔 판 지켜보기 — 바뀔 때마다 cb(판). 돌려주는 것: 그만두기 */
  async function 판지켜보기(c, cb) {
    const fb = await loadFb(); await fb.ensureAnon()
    const r = fb.ref(fb.db, `${곳(c)}/r`)
    const 끄기 = fb.onValue(r, (s) => { const v = s.val(); cb(typeof v === 'number' ? v : null) }, () => { /* 끊기면 다음 받기 때 */ })
    return typeof 끄기 === 'function' ? 끄기 : () => { try { fb.off(r) } catch (e) { /* */ } }
  }
  async function 만들기(이름, pw, 상태) {
    const r0 = await 장.만들기({ name: String(이름 || '').trim().slice(0, 60) || '사진대지' }, pw)
    const r = await 올리기(r0.코드, r0.열쇠, 상태, 0)
    return { 코드: r0.코드, 이름: r0.정보.name, 열쇠: r0.열쇠, r }
  }
  async function 열기(c, pw) {
    const x = await 장.열기(c, pw)
    const 서버 = await 풀어보기(x.자료.doc, x.열쇠)
    return { 코드: c, 이름: (x.정보 && x.정보.name) || '', 열쇠: x.열쇠, 서버 }
  }
  const 잠금풀기 = (c, pw) => 장.잠금풀기(c, pw)
  async function 끊기(c) { await 장.이기기잊기(c); 연결쓰기(ns, null); 밀린쓰기(ns, []) }
  const 열쇠 = (c) => 열쇠읽기(c)
  return { 판보기, 받기, 올리기, 사진올리기, 사진받기, 사진지우기, 판지켜보기, 만들기, 열기, 잠금풀기, 끊기, 열쇠 }
}

/** 올릴 사진 줄이기 — 긴 쪽 1600 · JPEG 0.8 (브라우저) → {바이트, w, h} · 너무 크면(규칙 1,500,000 자) PhotoLive 가 1200 · 900 으로 다시 */
export async function 올릴사진(바이트, w0, h0, 긴쪽 = 사진긴쪽, 질 = 0.8) {
  const s = Math.min(1, 긴쪽 / Math.max(w0 || 1, h0 || 1))
  if (s >= 1 && 바이트.length < 400000) return { 바이트, w: w0, h: h0 }
  const blob = new Blob([바이트], { type: 'image/jpeg' })
  let 원
  try { 원 = await createImageBitmap(blob) } catch (e) { return { 바이트, w: w0, h: h0 } }
  const w = Math.max(1, Math.round(원.width * s)), h = Math.max(1, Math.round(원.height * s))
  const c = document.createElement('canvas'); c.width = w; c.height = h
  const g = c.getContext('2d'); g.drawImage(원, 0, 0, w, h); if (원.close) 원.close()
  const b = await new Promise((ok, no) => c.toBlob((x) => (x ? ok(x) : no(new Error('줄이기 실패'))), 'image/jpeg', 질))
  return { 바이트: new Uint8Array(await b.arrayBuffer()), w, h }
}
