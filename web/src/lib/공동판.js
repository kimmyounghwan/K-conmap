/* 🤝 공동도급 마당 — 셈 (G341 · 2026-10-20)
 *   소장님 「공동도급도 하나의 페이지로 만들고 싶고」 · 「연락처 넣어도 돼, 이메일도」 · 「돈 벌이 될 수 있는 방향으로」 ·
 *   「그냥, 자유롭게 연결될 수 있는 장을 마련하는 걸로 해보자..우선은 아낌없이 줘 보자...나중에 나에게 이익이 되어야 하는데」
 *   → 건설맵은 «도구 + 연결» 만 합니다(가운데서 짝을 맺어 주지 않음). 업체끼리 글을 보고 바로 전화 · 문자 · 메일.
 *
 * ■ 지분 짜기 기준 — 계약예규 「공동계약운용요령」 제9조(법제처 찾기쉬운생활법령 «공동계약» 으로 확인 · 2026-10-20)
 *     공동이행: 구성원 5인 이하 · 구성원마다 지분 10% 이상 (추정가격 1,000억 이상 공사는 10인 · 5%)
 *     분담이행: 5인 이하
 *     계약담당공무원이 20% 범위에서 가감할 수 있어 «공고서 기준이 우선» 입니다(예: «4개사 이내»).
 *     지역의무 공동도급 지역업체 최소지분(30% · 40% · 20%)은 입찰공고에 적힙니다 → 우리 자료 jdrt(공동재료().지분).
 *     시공능력 · 실적 · 기술보유는 «구성원 모두의 것을 합산»(제9조 ②) — 시평액 합산은 단순 합입니다.
 *     협정서는 입찰참가 신청서류와 함께 냅니다(제5조 ②) → 협정 마감(jagr).
 * ■ 여기는 계산만 합니다 — 화면(pages/Gongdong.jsx · 공동판짜기.jsx · 공동글.jsx)과 시험(tools/시험_공동판.mjs)이 같이 씁니다.
 */
import { 공동재료, 공동판정 } from './공동.js'

export const 기본최대 = 5
export const 기본최소 = 10
export const 큰공사 = 100000000000          // 추정가격 1,000억 — 10인 · 5%

/** 공고 → 지분 짜기 기본 규칙 { 최대, 최소, 의무지분, 의무시도[], 방식코드, 큰 } */
export function 기본규칙(r) {
  const 재 = 공동재료(r) || {}
  const 추정 = Number(r && (r.est || r.budget)) || 0
  const 큰 = 추정 >= 큰공사
  return {
    최대: 큰 ? 10 : 기본최대,
    최소: 큰 ? 5 : 기본최소,
    의무지분: Number(재.지분) || 0,
    의무시도: 재.의무시도 || [],
    방식코드: 재.코드 || '',
    큰,
    /* 종합심사낙찰제 공사는 대표자 지분 50% 이상(모두입찰 «공동수급협정서란?» · 공동계약운용요령) */
    대표최소: /종합심사/.test(String((r && (r.swin || r.mthd)) || '')) ? 50 : 0,
  }
}

const 수 = (v) => { const n = Number(String(v == null ? '' : v).replace(/[^0-9.]/g, '')); return isFinite(n) ? n : 0 }

/**
 * 지분 검사 — 구성원 [{co, rgn, share, sipy}] · 규칙(기본규칙 꼴, 화면에서 바꿀 수 있음)
 * → { ok, 합, 의무합, 문제: [글], 알림: [글] }
 *   문제 = 이대로면 협정이 안 되는 것 · 알림 = 확인할 것
 */
export function 지분검사(구성원, 규칙 = {}) {
  const 줄 = (구성원 || []).filter((m) => m && (String(m.co || '').trim() || 수(m.share) > 0))
  const 최대 = 규칙.최대 > 0 ? 규칙.최대 : 기본최대
  const 최소 = 규칙.최소 >= 0 ? 규칙.최소 : 기본최소
  const 문제 = [], 알림 = []
  const 합 = Math.round(줄.reduce((s, m) => s + 수(m.share), 0) * 100) / 100
  if (줄.length < 2) 문제.push('구성원이 두 곳 이상이어야 공동도급입니다.')
  if (줄.length > 최대) 문제.push(`구성원이 ${줄.length}곳입니다 — ${최대}곳 이하여야 합니다.`)
  if (Math.abs(합 - 100) > 0.001) 문제.push(`지분 합계가 ${합}% 입니다 — 100% 가 돼야 합니다.`)
  const 공동이행 = !규칙.방식코드 || /J/.test(규칙.방식코드)
  줄.forEach((m, i) => {
    const s = 수(m.share)
    const 이름 = String(m.co || '').trim() || `${i + 1}번째 구성원`
    if (!(s > 0)) 문제.push(`${이름} 지분을 적어 주세요.`)
    else if (공동이행 && s < 최소) 문제.push(`${이름} 지분 ${s}% — 구성원마다 ${최소}% 이상이어야 합니다.`)
  })
  if (규칙.대표최소 > 0 && 줄.length && 수(줄[0].share) < 규칙.대표최소) 문제.push(`종합심사낙찰제 공사 — 대표사(첫 줄) 지분이 ${규칙.대표최소}% 이상이어야 합니다.`)
  let 의무합 = null
  if ((규칙.의무시도 || []).length) {
    의무합 = Math.round(줄.filter((m) => 규칙.의무시도.includes(m.rgn)).reduce((s, m) => s + 수(m.share), 0) * 100) / 100
    const 곳 = 규칙.의무시도.join('·')
    if (!줄.some((m) => 규칙.의무시도.includes(m.rgn))) 문제.push(`${곳} 업체가 한 곳 이상 들어가야 합니다(지역의무 공동도급).`)
    else if (규칙.의무지분 > 0 && 의무합 < 규칙.의무지분) 문제.push(`${곳} 업체 지분 합이 ${의무합}% — ${규칙.의무지분}% 이상이어야 합니다.`)
    if (줄.some((m) => !m.rgn)) 알림.push('지역을 안 적은 구성원이 있습니다 — 지역의무 지분을 셀 때 빠집니다.')
    알림.push(`${곳} 업체는 입찰공고일 현재 90일 넘게 그곳에 본점이 있어야 합니다.`)
  }
  if (!공동이행) 알림.push('분담이행은 맡을 공종(면허)으로 나눕니다 — 구성원마다 맡은 공종 면허가 있어야 합니다.')
  알림.push('공고서에 구성원 수 · 최소 지분이 따로 적혀 있으면 그 기준이 우선입니다.')
  return { ok: 문제.length === 0, 합, 의무합, 문제, 알림 }
}

/** 각자 몫 — 금액 × 지분(원 단위 내림 · 끝 차이는 대표사(첫 줄)에 붙임) */
export function 몫나누기(금액, 구성원) {
  const 줄 = (구성원 || []).map((m) => 수(m.share))
  const A = Math.floor(Number(금액) || 0)
  if (!(A > 0) || !줄.length) return 줄.map(() => 0)
  const 몫 = 줄.map((s) => Math.floor(A * s / 100))
  const 합 = 몫.reduce((a, b) => a + b, 0)
  const 지분합 = 줄.reduce((a, b) => a + b, 0)
  if (Math.abs(지분합 - 100) < 0.001 && 몫.length) 몫[0] += A - 합
  return 몫
}

/** 시평액(원) 합 — 공동이행은 «구성원 모두의 것을 합산» · 적힌 것만 더하고 몇 곳이 비었는지 알려 줌 */
export function 시평합(구성원) {
  let 합 = 0, 빈 = 0
  for (const m of 구성원 || []) {
    const v = 수(m.sipy)
    if (v > 0) 합 += v; else if (String(m.co || '').trim()) 빈++
  }
  return { 합, 빈 }
}

/** «2026-10-21 10:00:00» · «202610211000» (한국 시각) → ms · 모르면 0 */
export function 때(s) {
  const d = String(s || '').replace(/[^0-9]/g, '')
  if (d.length < 8) return 0
  const t = Date.parse(`${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}T${(d.slice(8, 10) || '23')}:${(d.slice(10, 12) || '59')}:00+09:00`)
  return isFinite(t) ? t : 0
}

/** 공고 → 글을 내릴 때(ms) — 협정 마감이 있으면 그때, 없으면 입찰 마감 · 둘 다 없으면 7일 뒤 */
export function 글끝(r, 지금 = Date.now()) {
  const 재 = 공동재료(r) || {}
  return 때(재.협정마감) || 때(r && r.close) || (지금 + 7 * 86400000)
}
export const 명부날 = 90                        // 업체 명부는 90일 — 다시 올리면 이어짐
export const 명부끝 = (지금 = Date.now()) => 지금 + 명부날 * 86400000

/** 목록 칸 — 공고 r · 나 {지역, 면허} → '의무' | '공동이면' | '가능' | null(공동 안 됨) */
export function 칸of(r, 나 = {}) {
  const 판 = 공동판정(r, 나)
  if (!판.허용 || 판.참가불가) return null
  if (판.기회.length) return '의무'
  if (판.공동이면) return '공동이면'
  return '가능'
}

/** 협정 마감까지 남은 ms · 지났으면 음수 · 모르면 null */
export function 협정남음(r, 지금 = Date.now()) {
  const t = 때((공동재료(r) || {}).협정마감)
  return t ? t - 지금 : null
}

/* ── 글 ─────────────────────────────────────────────── */
export const 종류들 = ['구함', '참여', '명부']
export const 종류이름 = { 구함: '🙋 대표사 · 구성원 구함', 참여: '🤝 구성원으로 참여', 명부: '🏢 업체 명부' }
/** 글쓰기 «우리 역할» 두 가지 — 구함 = 우리가 대표사 · 참여 = 우리가 구성원 */
export const 역할들 = [
  { k: '구함', t: '🙋 우리가 대표사', d: '구성원을 구합니다' },
  { k: '참여', t: '🤝 우리가 구성원', d: '같이 할 대표사를 찾습니다' },
]

const 줄임 = (v, n) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, n)
export const 전화꼴 = (v) => String(v || '').replace(/[^0-9-]/g, '').slice(0, 20)
export const 메일꼴 = (v) => String(v || '').trim().slice(0, 60)
export const 메일맞나 = (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
export const 전화맞나 = (v) => !v || String(v).replace(/[^0-9]/g, '').length >= 8

/**
 * 글 → 데이터베이스에 넣을 모양(규칙 jv 와 «똑같이») · 틀리면 { 틀림: 글 }
 * f = { kind, no, name, inst, co, rgn, lic, share, sipy, want, body, tel, email, who(담당자) }
 */
export function 글만들기(f, uid, 지금 = Date.now(), 끝 = 0) {
  const kind = 종류들.includes(f.kind) ? f.kind : ''
  if (!kind) return { 틀림: '글 종류를 고르세요.' }
  const co = 줄임(f.co, 40)
  if (co.length < 2) return { 틀림: '회사 이름을 2자 넘게 적어 주세요.' }
  const rgn = 줄임(f.rgn, 10)
  if (!rgn) return { 틀림: '우리 회사 지역(시·도)을 고르세요.' }
  const tel = 전화꼴(f.tel), email = 메일꼴(f.email)
  if (!tel && !email) return { 틀림: '전화나 이메일 중 하나는 적어 주세요 — 그래야 연락이 옵니다.' }
  if (!전화맞나(tel)) return { 틀림: '전화번호를 다시 봐 주세요(숫자 8자리 넘게).' }
  if (!메일맞나(email)) return { 틀림: '이메일 꼴을 다시 봐 주세요(예: name@company.co.kr).' }
  if (kind !== '명부' && !줄임(f.no, 40)) return { 틀림: '공고를 먼저 고르세요.' }
  const end = Math.round(Number(끝) || 0)
  if (!(end > 지금 - 60000)) return { 틀림: '이 공고는 협정(입찰) 마감이 지났습니다.' }
  const v = { kind, co, rgn, uid: String(uid || ''), at: 지금, end, deleted: false }
  const 넣기 = (k, x) => { if (x) v[k] = x }
  if (kind !== '명부') { 넣기('no', 줄임(f.no, 40)); 넣기('name', 줄임(f.name, 80)); 넣기('inst', 줄임(f.inst, 40)) }
  넣기('lic', 줄임(f.lic, 80)); 넣기('share', 줄임(f.share, 20)); 넣기('sipy', 줄임(f.sipy, 20))
  넣기('want', 줄임(f.want, 60)); 넣기('body', String(f.body || '').trim().slice(0, 500))
  넣기('tel', tel); 넣기('email', email); 넣기('who', 줄임(f.who, 20))
  return { 글: v }
}

/** 글 키 — 파이어베이스 push 키와 같은 꼴(시각 8글자 + 아무 글자 12) · 시각 순으로 줄 섬 */
const 글자 = '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz'
export function 새키(지금 = Date.now(), 난수 = Math.random) {
  let t = 지금, s = ''
  for (let i = 0; i < 8; i++) { s = 글자.charAt(t % 64) + s; t = Math.floor(t / 64) }
  for (let i = 0; i < 12; i++) s += 글자.charAt(Math.floor(난수() * 64))
  return s
}

/** 받은 글들(객체) · 지운 것 · 신고 → 보일 글 [] (끝 지난 것 · 지운 것 · 신고 3건 넘은 것 뺌 · 최신 앞) */
export function 보일글(raw, 지운 = {}, 신고 = {}, 지금 = Date.now()) {
  return Object.entries(raw || {})
    .map(([id, v]) => ({ id, ...(v || {}) }))
    .filter((p) => p && 종류들.includes(p.kind) && !p.deleted && !(지운 && 지운[p.id])
      && Number(p.end) > 지금 && Object.keys((신고 && 신고[p.id]) || {}).length < 3)
    .sort((a, b) => (b.at || 0) - (a.at || 0))
}

/** 공고번호별 글 수 { no: {구함, 참여} } */
export function 공고별수(글들) {
  const m = {}
  for (const p of 글들 || []) {
    if (!p.no || p.kind === '명부') continue
    const o = m[p.no] || (m[p.no] = { 구함: 0, 참여: 0 })
    o[p.kind] = (o[p.kind] || 0) + 1
  }
  return m
}

/** 연락 주소 — 전화 · 문자 · 메일 */
export const 전화주소 = (t) => 'tel:' + String(t || '').replace(/[^0-9+]/g, '')
export const 문자주소 = (t, 글 = '') => 'sms:' + String(t || '').replace(/[^0-9+]/g, '') + (글 ? '?body=' + encodeURIComponent(글) : '')
export const 메일주소 = (m, 제목 = '', 글 = '') => 'mailto:' + String(m || '').trim()
  + (제목 || 글 ? '?' + [제목 && 'subject=' + encodeURIComponent(제목), 글 && 'body=' + encodeURIComponent(글)].filter(Boolean).join('&') : '')

/** 연락할 때 첫 마디(문자 · 메일) — 금액 이야기는 안 넣음 */
export function 첫마디(p) {
  const 공고 = p.name ? `«${p.name}»` : '공동도급'
  return `안녕하세요. K-건설맵 공동도급 마당에서 ${p.co} 글을 보고 연락드립니다. ${공고} 공동수급 관련해 이야기 나누고 싶습니다.`
}

/* ── 우리 회사 명함(이 브라우저에만) ── */
const 명함열쇠 = 'kcm.jv.me'
export function 명함읽기() {
  try { const v = JSON.parse(localStorage.getItem(명함열쇠) || 'null'); return v && typeof v === 'object' ? v : {} } catch (e) { return {} }
}
export function 명함쓰기(v) {
  try { localStorage.setItem(명함열쇠, JSON.stringify(v || {})) } catch (e) { /* 사생활 창 */ }
}
const 내글열쇠 = 'kcm.jv.mine'
export function 내글읽기() {
  try { const v = JSON.parse(localStorage.getItem(내글열쇠) || '[]'); return Array.isArray(v) ? v : [] } catch (e) { return [] }
}
export function 내글더하기(id) {
  try { localStorage.setItem(내글열쇠, JSON.stringify([...내글읽기().filter((x) => x !== id), id].slice(-50))) } catch (e) { /* 사생활 창 */ }
}
/* ⭐ 담음은 바로투찰 · 분석실과 같은 것(lib/basket.js kcm_basket)을 씁니다 — 한 곳에서 담으면 어디서나 보임 */

/* ── 💬 답글(대화) ── comments/jv-{글 키} (규칙 comments: body 1~500 · by 20자 · uid · at · deleted) */
export const 답글열쇠 = (글키) => 'jv-' + String(글키 || '').slice(0, 30)
/** 답글 → 넣을 모양 · 틀리면 {틀림} */
export function 답글만들기(by, body, uid, 지금 = Date.now()) {
  const b = String(body || '').trim().slice(0, 500)
  if (!b) return { 틀림: '하실 말을 적어 주세요.' }
  const who = String(by || '').replace(/\s+/g, ' ').trim().slice(0, 20)
  const 답 = { body: b, uid: String(uid || ''), at: 지금, deleted: false }
  if (who) 답.by = who
  return { 답 }
}
const 내답글열쇠 = 'kcm.jv.myre'
export function 내답글읽기() {
  try { const v = JSON.parse(localStorage.getItem(내답글열쇠) || '[]'); return Array.isArray(v) ? v : [] } catch (e) { return [] }
}
export function 내답글더하기(id) {
  try { localStorage.setItem(내답글열쇠, JSON.stringify([...내답글읽기().filter((x) => x !== id), id].slice(-200))) } catch (e) { /* 사생활 창 */ }
}
/* 🔔 내 글의 답글을 어디까지 봤나 {글 키: 수} — 새 답글 알림 */
const 본열쇠 = 'kcm.jv.seen'
export function 본수읽기() {
  try { const v = JSON.parse(localStorage.getItem(본열쇠) || '{}'); return v && typeof v === 'object' ? v : {} } catch (e) { return {} }
}
export function 본수적기(글키, n) {
  try { const v = 본수읽기(); v[글키] = n; localStorage.setItem(본열쇠, JSON.stringify(v)) } catch (e) { /* 사생활 창 */ }
}
/** 새 답글 — 내 글 키들 · 수 {키: n} · 본 수 → [{키, 새}] (새 > 0 만) */
export function 새답글(내키들, 수, 본) {
  return (내키들 || []).map((k) => ({ 키: k, 새: Math.max(0, (Number((수 || {})[k]) || 0) - (Number((본 || {})[k]) || 0)) })).filter((x) => x.새 > 0)
}

/** 글쓰기 «찾는 상대» 첫 글(비어 있을 때 채움) — 공고의 지역의무 · 면허 · 지분으로 */
export function 추천말(r, kind, 명함 = {}) {
  if (!r) return ''
  const 재 = 공동재료(r) || {}
  const 면 = ((r.lic || [])[0] ? String(r.lic[0]).split('/')[0].replace(/ㆍ/g, '·') : '') || 명함.lic || ''
  const 곳 = (재.의무시도 || []).join('·')
  const 지분 = Number(재.지분) || 0
  if (kind === '구함') {
    if (곳 && 명함.rgn && !(재.의무시도 || []).includes(명함.rgn)) return `${곳} 소재 ${면} 업체 · 지분 ${지분 || 30}% 이상`.replace(/\s+/g, ' ').trim()
    return `${면} 구성원 · 지분 ${지분 || 30}%`.replace(/\s+/g, ' ').trim()
  }
  if (kind === '참여') return `${명함.rgn || ''} ${면} · 지분 ${지분 || 30}% 맡겠습니다`.replace(/\s+/g, ' ').trim()
  return ''
}
/** 우리 회사 명함이 글쓰기에 «다 찼나» — 회사 · 지역 · 연락처 하나 */
export const 명함다참 = (m = {}) => String(m.co || '').trim().length >= 2 && !!m.rgn && (전화맞나(m.tel) && !!m.tel || (메일맞나(m.email) && !!m.email))
