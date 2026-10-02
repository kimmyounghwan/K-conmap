/* ⬇ 받은 횟수 — 2026-10-01 (G96) 소장님 「사이트 전체 조회수 적용시켜줘. 누적해서」
 *    → 고르심: «사이트 전체 도구 및 서식 등 다운받은 것은 다운로드 몇 번까지» · «이대로 만들어»
 *
 * ■ 무엇을 세나 — 사이트에서 «파일을 받은» 것 전부
 *   ① 정적 파일 링크(서식 엑셀 · 인쇄용 PDF · 내역서 · 견본 · CAD 리스프 · 쉐어원 ZIP …)를 누름
 *   ② 화면이 만들어 주는 파일(사진대지 PDF · 원클릭 엑셀 · 도면 PDF …) — <a download href="blob:…">
 *   → 데이터베이스 dl/f/{파일} · dl/p/{화면} 에 1 을 더합니다(규칙이 «1씩만» 받음 — database.rules.json "dl").
 *   화면 하나하나를 고치지 않고 여기 한 곳에서 잡습니다:
 *     · 문서 전체 «누름» 을 엿들음(사람이 누른 링크)
 *     · HTMLAnchorElement.click 을 감쌈(코드가 몰래 만든 <a> 를 .click() — 문서에 안 붙어 있어 엿들음에 안 걸림)
 *
 * ■ 지난 숫자 — 구글 애널리틱스(측정 ID 를 고친 9/15 부터) 파일 받기 372회 · CAD 12회를
 *   data/받은수_시작.json 에 «시작값» 으로 두고, 보이는 숫자 = 시작값 + 데이터베이스 숫자.
 *   (사이트가 직접 세기 시작한 것은 이 판을 올린 때부터)
 *
 * ■ 안 세는 것: 운영자(소장님) 브라우저 · 자동 브라우저(webdriver) · 같은 것을 3초 안에 또 누름
 * ■ 비용: 받을 때만 작은 요청 두 번(읽고 · 1 더하기). 숫자를 보여 주는 화면(서식 · 도구 목록)은
 *   dl 묶음을 한 번 읽습니다(몇 KB). 파이어베이스 SDK 를 안 씁니다(REST).
 * ■ 화면 주소는 앞 두 마디까지만 적습니다 — /tools/tuipbi/v/{현장}/{링크} 같은 주소의 현장 번호가
 *   누구나 읽는 dl 에 남으면 안 되기 때문입니다(그런 주소는 /tools/tuipbi 로 셉니다).
 *
 * 👁 «조회 N» (G119 · 2026-10-02) — 소장님: 「누적을 제대로 해줘. 지금, 훵해 보이잖아」 →
 *   「다른 것들도 꼼꼼히 점검해서 누적으로 카운트 해서 올려줘. 그리고 카운트 되게 해주고」
 *   계산기 · 인쇄 · 화면 안에서 끝나는 도구는 «받은 파일» 이 없어 카드가 늘 비었음 → 카드마다 «그 화면을 연 횟수» 를 같이 보입니다.
 *   숫자 = 구글 애널리틱스 조회수(2026-09-15 ~ 지금) — 깃허브(tools/이용자지도.py)가 30분마다 fresh/pv 에 넣고, 화면은 읽기만.
 *   (브라우저가 쓰는 것 없음 · 규칙 안 바뀜 · fresh 는 누구나 읽기만). 애널리틱스를 막은 브라우저는 안 셈 · 소장님 것도 섞임.
 *   화면열쇠는 그쪽(파이썬 화면열쇠)과 똑같아야 합니다. 받은 횟수(⬇)와 따로 셉니다 — 서식 카드는 «봄» 으로 그 서식 화면만.
 */
import { useEffect, useState } from 'react'

const DB = 'https://k-conmap-default-rtdb.firebaseio.com'
export const 파일끝 = /\.(xlsx|xlsm|xls|pdf|hwp|hwpx|docx|doc|zip|dwg|dxf|lsp|csv|pptx)$/i
const 두마디 = new Set(['forms', 'tools', 'cad', 'jeoksan', 'naeyeok', 'change'])

/** 데이터베이스 열쇠로 — «.» «/» «#» «$» «[» «]» 는 열쇠에 못 씁니다 */
export const 열쇠꼴 = (s) => String(s).replace(/\./g, ',').replace(/\//g, '|').replace(/[#$[\]]/g, '_')

/** 화면 주소 → 화면 열쇠 «|forms|chg-tonghap» (앞 두 마디 · 그 밖의 화면은 한 마디) */
export function 화면열쇠(path) {
  const 마디 = String(path || '/').split('?')[0].split('#')[0].split('/').filter(Boolean)
  if (!마디.length) return '|'
  const 둘 = 두마디.has(마디[0]) ? 마디.slice(0, 2) : 마디.slice(0, 1)
  let k
  try { k = 둘.map((x) => decodeURIComponent(x)).join('|') } catch (e) { k = 둘.join('|') }
  return 열쇠꼴('|' + k).slice(0, 80)
}

/** 링크 주소 → 파일 열쇠 «|forms|chg-tonghap,xlsx» · 파일이 아니면 null (blob 은 null — 화면 열쇠만) */
export function 파일열쇠(href) {
  let u
  try { u = new URL(href, location.href) } catch (e) { return null }
  if (u.protocol === 'blob:' || u.protocol === 'data:') return null
  let p
  try { p = decodeURIComponent(u.pathname) } catch (e) { p = u.pathname }
  if (!파일끝.test(p)) return null
  if (u.host === 'github.com') p = '/github/' + p.split('/').pop()      // 쉐어원 ZIP(깃허브 릴리스)
  else if (u.host !== location.host) return null
  return 열쇠꼴(p).slice(0, 150)
}

/* ── 세기 ─────────────────────────────────────────────── */
let 운영자 = null           // 한 번만 물어봄(IndexedDB)
const 최근 = new Map()      // 열쇠 → 시각 (3초 안 다시 누름은 안 셈)
const 듣는이 = new Set()
let 숫자 = null             // { f: {}, p: {} } — 데이터베이스(시작값 빼고)

export function 봇() {
  try { return !!navigator.webdriver || /bot|crawl|spider|slurp|headless|lighthouse/i.test(navigator.userAgent || '') } catch (e) { return true }
}

async function 하나더(갈래, 열쇠) {
  const url = `${DB}/dl/${갈래}/${encodeURIComponent(열쇠)}.json`
  for (let i = 0; i < 4; i++) {
    const r = await fetch(url, { headers: { 'X-Firebase-ETag': 'true' }, cache: 'no-store' })
    if (!r.ok) return
    const tag = r.headers.get('ETag')
    const v = Number(await r.json()) || 0
    const w = await fetch(url, { method: 'PUT', headers: { 'if-match': tag }, body: String(v + 1) })
    if (w.ok) {
      if (숫자) { 숫자 = { ...숫자, [갈래]: { ...(숫자[갈래] || {}), [열쇠]: v + 1 } }; 듣는이.forEach((f) => f()) }
      return
    }
    if (w.status !== 412) return             // 412 = 그 사이 누가 먼저 더함 → 다시
  }
}

export async function 받음(href, 이름) {
  try {
    if (봇()) return
    /* 🔗 G113 — 이어 쓰기 «💾 백업 파일»(…_백업_날짜.json · …_작업백업_날짜.json)은 «받은 서류» 가 아니라 세지 않습니다 */
    if (이름 && /_(작업)?백업_\d{4}-\d{2}-\d{2}\.json$/.test(이름)) return
    const f = href ? 파일열쇠(href) : null
    const blob = /^blob:/.test(String(href || ''))
    if (!f && !blob && !(이름 && 파일끝.test(이름))) return
    const p = 화면열쇠(location.pathname)
    const 지금 = Date.now()
    const 표 = (f || '') + '@' + p
    if (지금 - (최근.get(표) || 0) < 3000) return
    최근.set(표, 지금)
    if (운영자 === null) {
      try { const m = await import('./운영자.js'); 운영자 = !!(await m.나운영자()) } catch (e) { 운영자 = false }
    }
    if (운영자) return
    if (f) 하나더('f', f).catch(() => {})
    하나더('p', p).catch(() => {})
  } catch (e) { /* 세는 것 때문에 받기가 막히면 안 됩니다 */ }
}

/** 사이트를 열 때 한 번(main.jsx) */
export function 켜기() {
  if (typeof window === 'undefined' || window.__받은수) return
  window.__받은수 = true
  document.addEventListener('click', (e) => {
    try {
      const a = e.target && e.target.closest ? e.target.closest('a[href]') : null
      if (!a || a.__셈 > Date.now() - 1500) return
      if (a.hasAttribute('download') || 파일열쇠(a.href)) 받음(a.href, a.getAttribute('download') || '')
    } catch (er) { /* 무시 */ }
  }, true)
  const 원래 = HTMLAnchorElement.prototype.click
  HTMLAnchorElement.prototype.click = function () {
    try {
      if (this.href && (this.hasAttribute('download') || 파일열쇠(this.href))) {
        this.__셈 = Date.now()                       // 문서에 붙은 <a> 면 위 엿듣기가 또 세지 않게
        받음(this.href, this.getAttribute('download') || '')
      }
    } catch (er) { /* 무시 */ }
    return 원래.call(this)
  }
}

/* ── 보여 주기 ────────────────────────────────────────── */
let 읽는중 = null
let 시작 = null
let 읽은때 = 0
let 조회 = null             // { p: {} } — fresh/pv (애널리틱스 조회수 · 못 읽으면 null)
function 읽기() {
  if (읽는중 && Date.now() - 읽은때 < 5 * 60000) return 읽는중
  읽은때 = Date.now()
  읽는중 = Promise.all([
    fetch(`${DB}/dl.json`, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    시작 ? Promise.resolve(시작) : import('../data/받은수_시작.json').then((m) => (시작 = m.default || m)).catch(() => ({})),
    fetch(`${DB}/fresh/pv/p.json`, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
  ]).then(([d, , v]) => {
    숫자 = { f: (d && d.f) || {}, p: (d && d.p) || {} }
    조회 = v && typeof v === 'object' ? { p: v } : null
    듣는이.forEach((f) => f())
    return 숫자
  })
  return 읽는중
}

/** 화면 열쇠가 «쪽들» 에 드나 — 그 화면 자신 + «아래 화면»(빼기에 든 열쇠 = 따로 카드가 있는 화면은 뺌) */
const 맞나틀 = (쪽, 빼기) => {
  const 쪽들 = (Array.isArray(쪽) ? 쪽 : [쪽]).filter(Boolean).map((x) => 화면열쇠(x))
  return (k) => 쪽들.some((a) => k === a || (k.startsWith(a + '|') && !(빼기 && 빼기.has(k))))
}

/** 👁 조회 횟수 더하기 — 봄: 화면 주소들(받은 횟수의 «쪽» 과 같은 셈) · 못 읽었으면 null */
export function 조회합(봄 = [], 빼기 = null) {
  if (!조회) return null
  const 맞나 = 맞나틀(봄, 빼기)
  let n = 0
  for (const [k, v] of Object.entries(조회.p || {})) if (맞나(k)) n += Number(v) || 0
  return n
}

/** 받은 횟수 더하기 — 쪽: 화면 주소들(그 화면과 «아래 화면» 까지 · 빼기에 든 열쇠는 뺌) · 파일: 파일 주소들(그 파일만) */
export function 합(쪽 = [], 파일 = [], 빼기 = null) {
  if (!숫자) return null
  const 파일들 = new Set((Array.isArray(파일) ? 파일 : [파일]).filter(Boolean).map((x) => {
    let d = String(x).split('?')[0]
    try { d = decodeURIComponent(d) } catch (e) { /* 그대로 */ }
    return 열쇠꼴(d)
  }))
  const 맞나 = 맞나틀(쪽, 빼기)
  let n = 0
  for (const 묶음 of [숫자, 시작 || {}]) {
    for (const [k, v] of Object.entries(묶음.p || {})) if (맞나(k)) n += Number(v) || 0
    for (const [k, v] of Object.entries(묶음.f || {})) if (파일들.has(k)) n += Number(v) || 0
  }
  return n
}

/** 받은 횟수 숫자 하나 — 아직 못 읽었으면 null */
export function use받은수({ 쪽, 파일, 빼기 } = {}) {
  const [, 다시] = useState(0)
  useEffect(() => {
    const f = () => 다시((x) => x + 1)
    듣는이.add(f)
    읽기().catch(() => {})
    return () => { 듣는이.delete(f) }
  }, [])
  return 합(쪽, 파일, 빼기)
}

/** «⬇ 12회» (+ 봄 을 주면 «· 조회 340») — 둘 다 0 이거나 못 읽었으면 아무것도 안 그림 */
export function 받은수({ 쪽, 파일, 빼기, 봄, 앞 = '⬇ ', 글 = '회', className = 'dlcount' }) {
  const n = use받은수({ 쪽, 파일, 빼기 })
  const v = 봄 ? 조회합(봄, 빼기) : null
  if (!n && !v) return null
  const 받음글 = n ? <span title="이 사이트에서 받은 횟수 (2026-09-15부터)">{앞}{n.toLocaleString('ko-KR')}{글}</span> : null
  const 조회글 = v ? <span className="pvcount" title="이 화면을 연 횟수 (2026-09-15부터 · 구글 애널리틱스 · 30분마다 고침)">조회 {v.toLocaleString('ko-KR')}</span> : null
  return <span className={className + ' dlc2'}>{받음글}{받음글 && 조회글 ? ' · ' : null}{조회글}</span>   /* dlc2 — 좁은 카드에선 «·» 에서 줄바꿈 */
}
