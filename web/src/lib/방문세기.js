/* ══════════════════════════════════════════════════════════════
   방문세기.js — 👥 방문자를 건설맵이 직접 셉니다 (G315 · 2026-10-18 · 10/19 0시부터)

   소장님: 「오늘 방문자수는 … 의미가 없다」(애널리틱스 «오늘» 이 늦게 들어와 낮에도 +0) →
           「그냥 들어 오는 사람 다 세는 걸로 하자」 「사이트 접속만 하면 세는 걸로 하면 어때? 동일인은 한 번만 하고」
           「밤12시를 기준으로 … 12시에 바뀌는 걸로 하자」 「클로드가 세는 걸로 해서 누적도 올라가는 걸로 하자」
           「애널리스틱도 브라우저로 세는거 맞잖아?」 — 그래서 단위는 애널리틱스와 같게 «브라우저 하나 = 한 사람».

   ■ 세는 것 (데이터베이스 vis — 규칙 database.rules.json "vis": 1씩만 · 열쇠 꼴 묶음 · 누구나 읽기)
     · 오늘 vis/d/{한국 날짜}/n · vis/d/{날짜}/r/{시·도}   — 같은 브라우저는 하루 한 번
     · 누적 vis/a/n · vis/a/r/{시·도}                      — 처음 온 브라우저만 한 번(매일 와도 한 번)
       10/18 까지 왔던 브라우저는 애널리틱스 누적(fresh/reg — 9/15~10/18)에 이미 들어 있습니다.
       → 애널리틱스 쿠키(_ga)에 적힌 «처음 온 시각» 이 10/19 0시 전이면 누적에 또 안 더함.
     · 화면에 보이는 누적 = 애널리틱스 9/15~10/18 + vis/a (lib/이용자지도.js 직접줄들)
   ■ 시·도 — get.geojs.io(맵톡 글쓰기와 같은 곳 · 무료 · 열쇠 없음) 의 지역 이름 → 시·도 열쇠
     (seoul … jeju) · 대한민국 밖 f · 모르면 x. 접속 주소는 어디에도 안 남깁니다(시·도 열쇠 하나만).
   ■ 안 세는 것: 운영자(소장님) 브라우저 · 자동 브라우저(webdriver · bot) · 화면을 5초 넘게 보지 않고 나간 것(점검 로봇)
     · 화면이 숨어 있는 탭(밤새 열어 둔 탭은 다음에 화면을 볼 때 셈)
   ■ 지도 점 — 소장님 「점도 바꾸자. 다 하는게 좋지 않아...헷갈리잖아」 → 점도 건설맵이 센 것으로(0시부터):
     geojs 도시 이름 · 위도 경도 → 시·군 곳 번호(맵톡 글쓰기와 같은 자리고르기 · data/한국지도.json) ·
     오늘 다녀간 곳 vis/d/{날짜}/c/{곳 번호}(하루 한 번) · 지금 점 = 최근 30분 «여기 있음» 의 곳 번호(1명 · 2~4명 · 5명 넘게 — 크기 셋, 전과 같음)
     자리(시·도 · 곳 번호)는 이 브라우저에 하루 한 번만 물어 기억(kcm.vis.loc).
   ■ 지금(30분 안) — 화면을 보고 있는 브라우저가 5분마다 vis/on/{이 브라우저 번호} = {t 서버 시각, k 곳 번호} 를 남김(«여기 있음»)
     → 지도는 최근 30분 안에 남긴 번호 수를 셈(애널리틱스 «최근 30분 사용자» 와 같은 뜻). 번호는 이 브라우저에서 만든 아무 글자(사람 정보 없음).
     «여기 있음» 은 올린 때부터 바로 남기고(0시에 비어 보이지 않게) 화면 숫자만 0시에 바뀜. 2시간 넘은 것은 깃허브(tools/이용자지도.py)가 지움.
   ■ 0시 — 열어 둔 화면도 1분마다 날짜를 봅니다. 날이 바뀌면(화면이 보일 때) 새 날로 한 번 셉니다.
   ■ 비용: 새 사람 하루 한 번 작은 요청 4~8번 · 지도 화면은 1분마다 작은 읽기 둘(vis/a · vis/d/오늘)
   ■ 🔁 세션 — 2026-10-21 소장님 「그냥 지금처럼 두고 당일 세션만 추가」 → 「세션 누적 세션 당일 이렇게 추가하자」 · 고르심 «표 꼴»
     사람 셈(위 전부 · 방문자 줄)은 그대로 · 지도 상자에 세션 줄(누적 · 오늘 · 어제)을 더함. 10/22 0시부터(방문시작).
     세션 누적 = 애널리틱스 세션 9/15~10/21(fresh/ses — tools/이용자지도.py) + vis/sa/n · 어제 = 10/22 엔 fresh/ses.y · 10/23 부터 vis/d/{어제}/s.
     다른 사이트(애널리틱스 «세션» · 네이버 «방문수»)와 같은 잣대: 화면을 보다가 30분 넘게 안 보았다가 다시 보면 1번 더 · 0시 지나면 새 날 1번.
     vis/d/{날짜}/s · vis/sa/n — 1씩만(규칙). 시·도별 세션은 안 셈. 마지막으로 본 때 kcm.vis.s = {t, d} — 화면이 보이는 동안 1분마다 고침(탭 여럿 · 새로 고침도 한 방문).
     안 세는 것은 사람 셈과 같음(운영자 · 로봇 · 5초 안 나감 · 숨은 탭). 비용: 세션마다 작은 요청 4번(두 곳 · 읽고 1 더하기).
   ══════════════════════════════════════════════════════════════ */
import { 시도찾기 } from './이용자지도.js'
/** 자동 브라우저 — 받은수.jsx 봇() 과 같은 셈(그쪽은 .jsx 라 시험(node)에서 못 불러 여기 한 줄 둠) */
export function 봇(ua = typeof navigator !== 'undefined' ? navigator.userAgent : '', wd = typeof navigator !== 'undefined' && navigator.webdriver) {
  try { return !!wd || /bot|crawl|spider|slurp|headless|lighthouse/i.test(ua || '') } catch (e) { return true }
}

const DB = 'https://k-conmap-default-rtdb.firebaseio.com'
export const 직접시작 = Date.parse('2026-10-19T00:00:00+09:00')
export const 직접인가 = (t = Date.now()) => t >= 직접시작
export const 한국날 = (t) => new Date(t + 9 * 3600000).toISOString().slice(0, 10)
const 기억열쇠 = 'kcm.vis'
const 머물초 = 5000

/** 시·도 줄임 이름 ↔ 데이터베이스 열쇠 (규칙 vis 와 «똑같이») */
export const 시도열쇠 = { 서울: 'seoul', 부산: 'busan', 인천: 'incheon', 대구: 'daegu', 대전: 'daejeon', 광주: 'gwangju', 울산: 'ulsan', 세종: 'sejong',
  경기: 'gyeonggi', 강원: 'gangwon', 충북: 'chungbuk', 충남: 'chungnam', 전북: 'jeonbuk', 전남: 'jeonnam', 경북: 'gyeongbuk', 경남: 'gyeongnam', 제주: 'jeju' }
export const 열쇠시도 = Object.fromEntries(Object.entries(시도열쇠).map(([n, k]) => [k, n]))

/** geojs 응답 → 시·도 열쇠 · 대한민국 밖 'f' · 모르면 'x' */
export function 시도고르기(j) {
  if (!j || !j.country_code) return 'x'
  if (String(j.country_code).toUpperCase() !== 'KR') return 'f'
  const n = 시도찾기(j.region) || 시도찾기(j.city)
  return (n && 시도열쇠[n]) || 'x'
}

/** 애널리틱스 쿠키 _ga=GA1.1.{번호}.{처음 온 시각(초)} → 처음 온 시각(ms) · 없으면 null */
export function 처음온때(쿠키) {
  const m = /(?:^|;\s*)_ga=GA\d+\.\d+\.\d+\.(\d{9,11})(?:;|$)/.exec(String(쿠키 || ''))
  return m ? Number(m[1]) * 1000 : null
}
/** 10/19 0시 전에 왔던 브라우저(애널리틱스 누적에 이미 든 사람)인가 */
export function 옛사람(쿠키) {
  const t = 처음온때(쿠키)
  return t != null && t < 직접시작
}

/* ── 기억(이 브라우저) {d: 마지막으로 센 날, a: 누적에 든 브라우저면 1} ── */
function 기억읽기() {
  try { const v = JSON.parse(localStorage.getItem(기억열쇠) || 'null'); return v && typeof v === 'object' ? v : {} } catch (e) { return null }
}
function 기억쓰기(v) {
  try { localStorage.setItem(기억열쇠, JSON.stringify(v)); return localStorage.getItem(기억열쇠) === JSON.stringify(v) } catch (e) { return false }
}

/** 데이터베이스 숫자 하나에 1 더하기 — 읽고(ETag) 고쳐 쓰기 · 그 사이 누가 먼저 더했으면(412) 다시 */
async function 하나더(길) {
  const url = `${DB}/vis/${길}.json`
  for (let i = 0; i < 5; i++) {
    const r = await fetch(url, { headers: { 'X-Firebase-ETag': 'true' }, cache: 'no-store' })
    if (!r.ok) return false
    const tag = r.headers.get('ETag')
    const v = Number(await r.json()) || 0
    const w = await fetch(url, { method: 'PUT', headers: { 'if-match': tag }, body: String(v + 1) })
    if (w.ok) return true
    if (w.status !== 412) return false
  }
  return false
}

/* ── 자리 — 시·도 열쇠(s) · 곳 번호(k · 시·군) — 하루 한 번만 물어 이 브라우저에 기억 ── */
const 자리열쇠 = 'kcm.vis.loc'
let 바탕캐시 = null
/** 시험(node)에서 지도 바탕을 넣어 줌 — 사이트에서는 data/한국지도.json 을 처음 쓸 때 한 번 받음 */
export function 시험바탕(b) { 바탕캐시 = b }
async function 바탕받기() {
  if (!바탕캐시) { const m = await import('../data/한국지도.json'); 바탕캐시 = m.default || m }
  return 바탕캐시
}
/** geojs 응답 · 지도 바탕 → {s 시·도 열쇠, k 곳 번호 또는 null} */
export async function 자리풀기(j, 바) {
  let s = 시도고르기(j), k = null
  if (j && s !== 'f' && 바) {
    try {
      const { 자리고르기 } = await import('./맵톡.js')
      const p = 자리고르기(j, 바)
      if (p && /^[0-9]{2,5}$/.test(String(p.k))) {
        k = String(p.k)
        if (s === 'x') { const 곳 = (바.곳 || []).find((q) => q.k === k); if (곳 && 시도열쇠[곳.d]) s = 시도열쇠[곳.d] }
      }
    } catch (e) { /* 자리만 모름 */ }
  }
  return { s, k }
}
let 자리실패 = 0
async function 자리알기(지금 = Date.now()) {
  const 날 = 한국날(지금)
  try { const v = JSON.parse(localStorage.getItem(자리열쇠) || 'null'); if (v && v.d === 날 && typeof v.s === 'string') return v } catch (e) { /* 없음 */ }
  if (Math.abs(지금 - 자리실패) < 10 * 60000) return { d: 날, s: 'x', k: null }      // 못 받았으면 10분은 다시 안 물음
  let j = null
  try {
    const c = typeof AbortController === 'function' ? new AbortController() : null
    const t = c ? setTimeout(() => c.abort(), 4000) : null
    const r = await fetch('https://get.geojs.io/v1/ip/geo.json', c ? { signal: c.signal } : undefined)
    if (t) clearTimeout(t)
    j = r && r.ok ? await r.json() : null
  } catch (e) { j = null }
  if (!j) { 자리실패 = 지금; return { d: 날, s: 'x', k: null } }
  let 바 = null
  try { 바 = await 바탕받기() } catch (e) { 바 = null }
  const v = { d: 날, ...(await 자리풀기(j, 바)) }
  try { localStorage.setItem(자리열쇠, JSON.stringify(v)) } catch (e) { /* 이번만 */ }
  return v
}

const 듣는이 = new Set()
/** 이 브라우저가 방금 세어졌을 때 부름(지도가 바로 다시 읽게) */
export function 셈듣기(f) { 듣는이.add(f); return () => 듣는이.delete(f) }

let 운영자 = null
let 도는중 = false
/** 한 번 세어 보기 — 이미 오늘 셌으면 아무것도 안 함. 돌려줌: 센 길들(시험용) 또는 null */
export async function 세어보기(지금 = Date.now()) {
  if (!직접인가(지금) || 도는중) return null
  if (typeof document !== 'undefined' && document.visibilityState && document.visibilityState !== 'visible') return null
  if (봇()) return null
  const 날 = 한국날(지금)
  const m = 기억읽기()
  if (!m || m.d === 날) return null                     // 기억을 못 쓰는 브라우저는 세지 않음(새로 고칠 때마다 또 세지 않게)
  const 새사람 = !m.a && !옛사람(typeof document !== 'undefined' ? document.cookie : '')
  if (!기억쓰기({ d: 날, a: 1 })) return null           // 보내기 «전에» 적어 둠 — 탭 둘 · 새로 고침에도 두 번 안 셈
  도는중 = true
  try {
    if (운영자 === null) {
      try { const o = await import('./운영자.js'); 운영자 = !!(await o.나운영자()) } catch (e) { 운영자 = false }
    }
    if (운영자) return null
    const 곳 = await 자리알기(지금)
    const k = 곳.s
    const 길 = [`d/${날}/n`, `d/${날}/r/${k}`].concat(곳.k ? [`d/${날}/c/${곳.k}`] : [], 새사람 ? ['a/n', `a/r/${k}`] : [])
    await Promise.all(길.map((p) => 하나더(p).catch(() => false)))
    듣는이.forEach((f) => { try { f() } catch (e) { /* 무시 */ } })
    return 길
  } finally { 도는중 = false }
}

/* ── 🔁 오늘 방문(세션) — 10/22 0시부터 · vis/d/{날}/s 하나만 ── */
export const 방문시작 = Date.parse('2026-10-22T00:00:00+09:00')
export const 방문인가 = (t = Date.now()) => t >= 방문시작
export const 쉼틈 = 30 * 60000
const 방문열쇠 = 'kcm.vis.s'
/** 새 방문인가 — 마지막으로 본 때 {t, d} · 지금 → 처음 · 날이 바뀜 · 30분 넘게 쉼이면 true */
export function 새방문(옛, 지금) {
  if (!옛 || typeof 옛.t !== 'number' || !isFinite(옛.t)) return true
  if (옛.d !== 한국날(지금)) return true
  return 지금 - 옛.t >= 쉼틈
}
let 방문도는중 = false
/** 화면이 보이면 «마지막으로 본 때» 를 고치고, 새 방문이면 오늘 방문에 1 더함. 돌려줌: 센 길(시험용) 또는 null */
export async function 방문보기(지금 = Date.now()) {
  if (typeof document !== 'undefined' && document.visibilityState && document.visibilityState !== 'visible') return null
  if (봇() || 방문도는중) return null
  let 옛
  try { 옛 = JSON.parse(localStorage.getItem(방문열쇠) || 'null') } catch (e) { return null }
  const 새 = 새방문(옛, 지금)
  const 날 = 한국날(지금)
  const 값 = JSON.stringify({ t: 지금, d: 날 })
  try { localStorage.setItem(방문열쇠, 값); if (localStorage.getItem(방문열쇠) !== 값) return null } catch (e) { return null }   // 기억을 못 쓰면 세지 않음(1분마다 또 세지 않게)
  if (!새 || !방문인가(지금)) return null
  방문도는중 = true
  try {
    if (운영자 === null) {
      try { const o = await import('./운영자.js'); 운영자 = !!(await o.나운영자()) } catch (e) { 운영자 = false }
    }
    if (운영자) return null
    const 길 = [`d/${날}/s`, 'sa/n']
    const 됨 = await Promise.all(길.map((p) => 하나더(p).catch(() => false)))
    if (됨.some(Boolean)) 듣는이.forEach((f) => { try { f() } catch (e) { /* 무시 */ } })
    return 길
  } finally { 방문도는중 = false }
}

/* ── 지금(30분 안) — «여기 있음» ── */
const 번호열쇠 = 'kcm.vis.id'
export const 숨틈 = 5 * 60000
export const 지금틈 = 30 * 60000
function 내번호() {
  try {
    let v = localStorage.getItem(번호열쇠)
    if (!/^[a-z0-9]{16}$/.test(v || '')) {
      const b = new Uint8Array(16); crypto.getRandomValues(b)
      v = Array.from(b, (x) => 'abcdefghijklmnopqrstuvwxyz0123456789'[x % 36]).join('')
      localStorage.setItem(번호열쇠, v)
      if (localStorage.getItem(번호열쇠) !== v) return null
    }
    return v
  } catch (e) { return null }
}
let 마지막숨 = 0
/** 화면을 보고 있으면 5분에 한 번 vis/on/{번호} = 서버 시각. 돌려줌: 남긴 번호(시험용) 또는 null */
export async function 숨쉬기(지금 = Date.now()) {
  if (typeof document !== 'undefined' && document.visibilityState && document.visibilityState !== 'visible') return null
  if (봇() || 지금 - 마지막숨 < 숨틈 - 5000) return null
  const id = 내번호()
  if (!id) return null
  마지막숨 = 지금
  if (운영자 === null) {
    try { const o = await import('./운영자.js'); 운영자 = !!(await o.나운영자()) } catch (e) { 운영자 = false }
  }
  if (운영자) return null
  try {
    const 곳 = await 자리알기(지금)
    const w = await fetch(`${DB}/vis/on/${id}.json`, { method: 'PUT', body: JSON.stringify({ t: { '.sv': 'timestamp' }, ...(곳.k ? { k: 곳.k } : {}) }) })
    return w.ok ? id : null
  } catch (e) { return null }
}

/** 사이트를 열 때 한 번(main.jsx) — 화면을 5초 넘게 본 뒤 세고, 그 뒤 1분마다 · 화면이 다시 보일 때 날짜를 봄 */
export function 방문켜기() {
  if (typeof window === 'undefined' || window.__방문) return
  window.__방문 = true
  let 본 = 0, 시작 = null, 끝 = false
  const 다시 = () => { 세어보기().catch(() => {}); 방문보기().catch(() => {}); 숨쉬기().catch(() => {}) }
  const 재기 = () => {
    if (끝) return
    if (document.visibilityState === 'visible') { if (시작 == null) 시작 = Date.now() } else if (시작 != null) { 본 += Date.now() - 시작; 시작 = null }
  }
  const 틱 = setInterval(() => {
    재기()
    const 지금본 = 본 + (시작 != null ? Date.now() - 시작 : 0)
    if (지금본 >= 머물초) {
      끝 = true; clearInterval(틱)
      다시()
      setInterval(다시, 60000)
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') 다시() })
    }
  }, 500)
  document.addEventListener('visibilitychange', 재기)
  재기()
}

/* 📅 G343 (2026-10-20) 소장님 「여기에 전날 방문수 띄울 수 있어. 여기만…」 — 큰 지도의 «전체 누적 · 오늘» 상자 아래 «어제 N명».
   어제 하루 방문 = vis/d/{어제}/n (오늘 +N 과 같은 셈 · 같은 브라우저 하루 한 번). 어제 숫자는 거의 안 바뀌므로
   30분 동안 다시 안 받음(1분마다 읽는 지도에 작은 읽기 하나 · 30분에 한 번). 직접 세기 전 날(10/18 까지)은 null. 못 받아도 null(상자만 안 뜸). */
const 어제기억 = { 날: '', n: null, t: 0 }
export function 어제받기(지금, 받) {
  const 어제날 = 한국날(지금 - 86400000)
  if (!직접인가(Date.parse(어제날 + 'T00:00:00+09:00'))) return Promise.resolve(null)
  if (어제기억.날 === 어제날 && typeof 어제기억.n === 'number' && Date.now() - 어제기억.t < 30 * 60000) return Promise.resolve({ 날: 어제날, n: 어제기억.n })
  return 받(`${DB}/vis/d/${어제날}/n.json`).then((v) => {
    const n = v !== null && isFinite(Number(v)) ? Math.max(0, Number(v)) : 0
    Object.assign(어제기억, { 날: 어제날, n, t: Date.now() })
    return { 날: 어제날, n }
  }).catch(() => null)
}

/* 🔁 어제 세션(건설맵) — 어제가 10/22 이후일 때만 vis/d/{어제}/s (30분 기억 · 어제 사람 수와 같은 꼴) · 그 전 날이면 null(화면이 애널리틱스 어제 세션을 씀) */
const 어제s기억 = { 날: '', n: null, t: 0 }
export function 어제세션받기(지금, 받) {
  const 어제날 = 한국날(지금 - 86400000)
  if (!방문인가(Date.parse(어제날 + 'T00:00:00+09:00'))) return Promise.resolve(null)
  if (어제s기억.날 === 어제날 && typeof 어제s기억.n === 'number' && Date.now() - 어제s기억.t < 30 * 60000) return Promise.resolve({ 날: 어제날, n: 어제s기억.n })
  return 받(`${DB}/vis/d/${어제날}/s.json`).then((v) => {
    const n = v !== null && isFinite(Number(v)) ? Math.max(0, Number(v)) : 0
    Object.assign(어제s기억, { 날: 어제날, n, t: Date.now() })
    return { 날: 어제날, n }
  }).catch(() => null)
}

/** 🔁 세션 줄 — 직접 받은 것 · 애널리틱스 세션 바탕(fresh/ses) → {누적, 오늘, 어제} (모르는 칸은 null) · 10/21 까지는 null(줄을 안 그림) */
export function 세션줄(직접, 바탕, 지금시각 = Date.now()) {
  if (!방문인가(지금시각) || !직접 || 직접.날 !== 한국날(지금시각)) return null
  const 수 = (v) => (isFinite(Number(v)) ? Math.max(0, Number(v)) : 0)
  const 바 = 바탕 && typeof 바탕.kr === 'number' ? 수(바탕.kr) + 수(바탕.f) : null
  const 누적 = 바 != null && typeof 직접.sa === 'number' ? 바 + 직접.sa : null
  const 어제날 = 한국날(지금시각 - 86400000)
  let 어제 = null
  if (직접.어제s && 직접.어제s.날 === 어제날) 어제 = 직접.어제s.n
  else if (바탕 && 바탕.yd === 어제날 && 바탕.y) 어제 = 수(바탕.y.kr) + 수(바탕.y.f)
  return { 누적, 오늘: 수(직접.d && 직접.d.s), 어제 }
}

/** 지도 화면이 읽는 직접 센 숫자 — {a: vis/a, d: vis/d/오늘, 지금: 30분 안 브라우저 수(못 받으면 null), 지금곳: {곳 번호: 수}, 날, at, 어제: {날, n} | null}
 *  누적 · 오늘을 못 받으면 null */
export async function 직접받기(지금 = Date.now()) {
  const 날 = 한국날(지금)
  const 받 = (u) => fetch(u, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
  const 지금주소 = `${DB}/vis/on.json?orderBy=${encodeURIComponent('"t"')}&startAt=${지금 - 지금틈}`
  try {
    const [a, d, on, 어제, sa, 어제s] = await Promise.all([받(`${DB}/vis/a.json`), 받(`${DB}/vis/d/${날}.json`), 받(지금주소).catch(() => undefined), 어제받기(지금, 받),
      방문인가(지금) ? 받(`${DB}/vis/sa/n.json`).then((v) => Number(v) || 0).catch(() => undefined) : Promise.resolve(null),       // 🔁 세션 누적(건설맵 몫) · 못 받음 undefined
      어제세션받기(지금, 받)])
    let 수 = null; const 지금곳 = {}
    if (on !== undefined) {
      수 = 0
      for (const v of Object.values(on || {})) {
        if (!v || typeof v.t !== 'number' || v.t < 지금 - 지금틈) continue
        수++
        if (typeof v.k === 'string' && v.k) 지금곳[v.k] = (지금곳[v.k] || 0) + 1
      }
    }
    return { a: a || {}, d: d || {}, 지금: 수, 지금곳, 날, at: Date.now(), 어제: 어제 || null, sa, 어제s }
  } catch (e) { return null }
}

/** 지도 점 — 직접 센 것 → [{p 자리, 지금 0~3, 오늘 bool}] (lib/이용자지도.js 지도점들 과 같은 꼴 · 크기 1명 · 2~4명 · 5명 넘게) */
export function 직접점들(직접, 바, 지금시각 = Date.now()) {
  if (!직접 || !바) return []
  const 표 = new Map((바.곳 || []).map((p) => [String(p.k), p]))
  const 점 = new Map()
  const 오늘것 = 직접.날 === 한국날(지금시각)
  for (const k of Object.keys((오늘것 && 직접.d && 직접.d.c) || {})) { const p = 표.get(k); if (p) 점.set(k, { p, 지금: 0, 오늘: true }) }
  for (const [k, n] of Object.entries(직접.지금곳 || {})) {
    const p = 표.get(k)
    if (p) 점.set(k, { p, 지금: n >= 5 ? 3 : n >= 2 ? 2 : 1, 오늘: true })
  }
  return [...점.values()].sort((a, b) => a.지금 - b.지금)
}

/** 지도 시·도 상자 — fresh/reg(애널리틱스 9/15~10/18 = 바탕) + 직접 센 것(vis) → 지역줄들(lib/이용자지도.js)과 같은 꼴
 *  { 줄: [{n, a 누적, t 오늘}] (누적 많은 차례 · 기타 · 해외 맨 끝), 전국: {a, t}, 합계: true, 오늘날: true, 직접: true, at }
 *  오늘(t)은 받은 vis/d 가 한국 오늘 것일 때만 — 자정 지나 아직 새로 안 받았으면 0 */
export function 직접줄들(자료, 직접, 지금시각 = Date.now()) {
  if (!자료 && !직접) return null
  const 오늘것 = !!직접 && 직접.날 === 한국날(지금시각)
  const va = (직접 && 직접.a) || {}, vd = (오늘것 && 직접.d) || {}
  const 수 = (v) => (isFinite(Number(v)) ? Math.max(0, Number(v)) : 0)
  const 묶음 = new Map()
  const 더 = (n, a, t) => { const g = 묶음.get(n) || { n, a: 0, t: 0 }; g.a += a; g.t += t; 묶음.set(n, g) }
  for (const [이름, v] of Object.entries((자료 && 자료.r) || {})) 더(시도찾기(이름) || '기타', 수(v && v.a), 0)
  for (const [k, v] of Object.entries(va.r || {})) if (k !== 'f') 더(열쇠시도[k] || '기타', 수(v), 0)
  for (const [k, v] of Object.entries(vd.r || {})) if (k !== 'f') 더(열쇠시도[k] || '기타', 0, 수(v))
  const 줄 = [...묶음.values()].filter((x) => x.a > 0 || x.t > 0)
    .sort((x, y) => (x.n === '기타') - (y.n === '기타') || y.a - x.a || y.t - x.t || x.n.localeCompare(y.n, 'ko'))
  const fa = 수(자료 && 자료.f && 자료.f.a) + 수(va.r && va.r.f), ft = 수(vd.r && vd.r.f)
  if (fa > 0 || ft > 0) 줄.push({ n: '해외', a: fa, t: ft, 해외: true })
  const 바 = (자료 && (자료.w || 자료.kr)) || {}
  return { 줄, 전국: { a: 수(바.a) + 수(va.n), t: 수(vd.n) }, 합계: true, 오늘날: true, 직접: true, at: 직접 && 직접.at }
}
