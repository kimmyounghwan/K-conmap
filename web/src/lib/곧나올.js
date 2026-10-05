/* 📣 곧 나올 공사 — 발주계획 · 사전규격(공사) (2026-10-05 · G135)
   소장님: 「설계부터 보여줘 최대한 사용자 편의성 기준으로」 → 「클로드 의견대로 해줘」(자리 = 공고 탭 한 줄 → /pre ·
           담당자는 부서 · 전화만 · 알림은 사이트 안)
   자료: build_json.py build_pre → /data/pre/idx.json · /data/pre/{시도 차례}.json · /data/pre/ag/{통}.json
   ⚠️ 시도 차례는 build_json SIDO_KAN(= lib/칸누가.js 시도칸)과 같고, 17 = 시도 모름.
   ⚠️ 발주계획은 기관의 «계획» 입니다 — 시기 · 금액이 바뀌거나 취소될 수 있습니다(화면에 늘 적음). */
import { getJSON } from './data.js'
import { 시도칸 } from './칸누가.js'
import { 통번호 } from './기관사정률.js'

export const 모름번호 = 시도칸.length          // 17
const 담기열쇠 = 'kcm.pre.bag'
const 조건열쇠 = 'kcm.pre.v1'

export const 받기목록 = () => getJSON('/data/pre/idx.json')

/** 시도 → 줄들(객체). '전국' 이면 전부(18개 파일 · 처음 한 번만 무겁고 그 뒤엔 기억) */
export async function 받기(시도) {
  const 번호들 = !시도 || 시도 === '전국' ? [...시도칸.map((_, i) => i), 모름번호] : [시도칸.indexOf(시도)].filter((i) => i >= 0)
  const 묶음 = await Promise.all(번호들.map((i) => getJSON(`/data/pre/${i}.json`)))
  const 본 = new Set()
  const 줄 = []
  for (const d of 묶음) {
    if (!d || !Array.isArray(d.r) || !Array.isArray(d.f)) continue
    for (const a of d.r) {
      const o = {}
      d.f.forEach((k, i) => { o[k] = a[i] })
      if (본.has(o.id)) continue           // «전남,광주» 처럼 두 시도에 걸친 줄
      본.add(o.id)
      줄.push(o)
    }
  }
  return 정렬(줄)
}

/** 기관 화면 «이 기관이 낼 공사» — [[id, 사업명, 시기, 금액, 종류, 상태, 공고번호]] */
export async function 기관것(기관) {
  const nm = String(기관 || '').trim()
  if (!nm) return []
  const d = await getJSON(`/data/pre/ag/${통번호(nm)}.json`)
  return (d && Array.isArray(d[nm])) ? d[nm] : []
}

/** 나올 차례 — 공고 직전(사전규격 · 의견 마감 빠른 순) → 발주월 빠른 순 → 금액 큰 순 */
export function 정렬(줄) {
  return [...줄].sort((a, b) =>
    (a.k === 's' ? 0 : 1) - (b.k === 's' ? 0 : 1)
    || String(a.due || '9999').localeCompare(String(b.due || '9999'))
    || String(a.ym || '999999').localeCompare(String(b.ym || '999999'))
    || (Number(b.amt) || 0) - (Number(a.amt) || 0))
}

/** 한국시간 'YYYYMM' · 'YYYY-MM-DD' */
export function 한국날(지금 = Date.now()) {
  const t = new Date(지금 + 9 * 3600000).toISOString()
  return { ym: t.slice(0, 4) + t.slice(5, 7), d: t.slice(0, 10) }
}
const 다음달 = (ym) => {
  let y = +ym.slice(0, 4), m = +ym.slice(4, 6) + 1
  if (m > 12) { y++; m = 1 }
  return `${y}${String(m).padStart(2, '0')}`
}

export const 금액대 = [
  { k: '', t: '금액 전체' },
  { k: 'a', t: '1억 미만', lo: 0, hi: 1e8 },
  { k: 'b', t: '1~5억', lo: 1e8, hi: 5e8 },
  { k: 'c', t: '5~30억', lo: 5e8, hi: 30e8 },
  { k: 'd', t: '30억 이상', lo: 30e8, hi: Infinity },
]
export const 탭들 = [
  { k: 'all', t: '전체' },
  { k: 'soon', t: '📝 직전' },       // 공고 직전(사전규격) — 폰 한 줄에 다섯 칸이 들어가게 짧게
  { k: 'this', t: '이번 달' },
  { k: 'next', t: '다음 달' },
  { k: 'bag', t: '⭐ 담음' },
]

/** 거르기 — 탭 · 금액대 · 공종 · 찾는 말 */
export function 거르기(줄, { 탭 = 'all', 금액 = '', 공종 = '', 말 = '' } = {}, 담은 = [], 지금 = Date.now()) {
  const { ym } = 한국날(지금)
  const nx = 다음달(ym)
  const 대 = 금액대.find((x) => x.k === 금액)
  const q = String(말 || '').trim()
  const 담 = new Set(담은.map((x) => x.id))
  return 줄.filter((r) => {
    if (탭 === 'soon' && r.k !== 's') return false
    if (탭 === 'this' && !(r.k === 's' || r.ym === ym)) return false     // 사전규격은 곧 공고 — 이번 달에 넣음
    if (탭 === 'next' && r.ym !== nx) return false
    if (탭 === 'bag' && !담.has(r.id)) return false
    if (대 && 대.k && !(r.amt > 0 && r.amt >= 대.lo && r.amt < 대.hi)) return false   // 금액 0 = 미정 — 금액대를 고르면 뺌
    if (공종 && r.kind !== 공종) return false
    if (q && !(`${r.nm} ${r.org} ${r.dm || ''} ${r.rgn || ''}`.includes(q))) return false
    return true
  })
}

/** 탭마다 몇 건 — 칩 옆 숫자 */
export function 탭건수(줄, 조건, 담은, 지금 = Date.now()) {
  const o = {}
  for (const t of 탭들) o[t.k] = 거르기(줄, { ...조건, 탭: t.k }, 담은, 지금).length
  return o
}

/** 공종 칩 — 조달청 공종 값이 있는 것만 · 많은 순 8개 */
export function 공종목록(줄) {
  const c = new Map()
  for (const r of 줄) if (r.kind) c.set(r.kind, (c.get(r.kind) || 0) + 1)
  return [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
}

/** 시기 글 — 사전규격: 의견 마감 D-n · 발주계획: «11월 예정» (해가 다르면 «2027년 1월 예정») */
export function 시기(r, 지금 = Date.now()) {
  if (r.k === 's') {
    if (!r.due) return { t: '공고 직전', tone: 'w' }
    const { d } = 한국날(지금)
    const 남 = Math.round((Date.parse(r.due.slice(0, 10)) - Date.parse(d)) / 86400000)
    if (남 < 0) return { t: '의견 마감 지남 · 곧 공고', tone: 'n' }
    if (남 === 0) return { t: '의견 마감 오늘', tone: 'r' }
    return { t: `의견 마감 D-${남}`, tone: 남 <= 3 ? 'w' : 'b' }
  }
  if (!r.ym) return { t: '시기 모름', tone: 'n' }
  const { ym } = 한국날(지금)
  const y = r.ym.slice(0, 4), m = Number(r.ym.slice(4, 6))
  const 글 = y === ym.slice(0, 4) ? `${m}월 예정` : `${y}년 ${m}월 예정`
  return { t: 글, tone: r.ym === ym ? 'w' : 'b' }
}

/** 금액 — 억 한 자리 · 1억 아래는 천만 · 0 이면 '' */
export function 억(v) {
  const n = Number(v) || 0
  if (!n) return ''
  if (n >= 1e8) {
    const e = n / 1e8
    return (e >= 100 ? Math.round(e).toLocaleString('ko-KR') : e.toFixed(1).replace(/\.0$/, '')) + '억'
  }
  if (n >= 1e7) return Math.round(n / 1e7) + '천만'
  return Math.round(n / 1e4).toLocaleString('ko-KR') + '만'
}

/* ── 담기 (이 브라우저에만 · 서버 0) ── */
export function 담은것() {
  try { const v = JSON.parse(localStorage.getItem(담기열쇠) || '[]'); return Array.isArray(v) ? v : [] } catch { return [] }
}
export function 담기바꿈(r) {
  const 지금 = 담은것()
  const 있 = 지금.some((x) => x.id === r.id)
  const 새 = 있 ? 지금.filter((x) => x.id !== r.id) : [{ id: r.id, nm: r.nm, org: r.org, k: r.k, at: Date.now() }, ...지금].slice(0, 100)
  try { localStorage.setItem(담기열쇠, JSON.stringify(새)) } catch { /* 사생활 보호 모드 */ }
  return 새
}
/** 담은 것 중 공고로 나온 것 — idx.o = {id: 열린 공고번호} */
export function 나온담은것(담은, idx) {
  const o = (idx && idx.o) || {}
  return 담은.filter((x) => o[x.id]).map((x) => ({ ...x, no: o[x.id] }))
}

/* ── 조건 기억 (지역은 공고판 · 바로투찰과 같은 kcm_region — lib/lic.js) ── */
export function 조건읽기() {
  try { const v = JSON.parse(localStorage.getItem(조건열쇠) || '{}'); return v && typeof v === 'object' ? v : {} } catch { return {} }
}
export function 조건쓰기(v) {
  try { localStorage.setItem(조건열쇠, JSON.stringify(v || {})) } catch { /* 사생활 보호 모드 */ }
}
