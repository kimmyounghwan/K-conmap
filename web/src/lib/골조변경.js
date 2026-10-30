/**
 * 📑 G464 골조 모델 ↔ 내역서 대조 → 설계변경 (2026-10-30)
 *
 * 소장님: 진짜 목적은 «물량이 틀린 데를 찾아 설계변경으로 가는 것»(9/20) · «나중에 설계변경 가능하면 좋겠다»(10/24)
 *   → 적산컨맵 다음 차례 «설계변경 연결»: 골조 모델 물량(도면에서 세운 3D) ↔ 내 내역서 줄 → 변경 수량 → 설계변경 서류.
 *
 * ■ 짝 짓기는 새로 만들지 않습니다 — 도면 물량 자동(/jeoksan/auto)과 같은 규칙(lib/내역채움.js 골조짝 · lib/내역대조.js 대조)
 *     레미콘 강도 · 철근 지름(재료 줄 = 할증 넣은 값) · 가공조립 · 타설 = 전체(할증 없이) · 부재 이름이 적힌 거푸집 = 그 부재 거푸집
 *     · 한 권에 동 · 공종이 여럿이면 모델과 가장 가까운 «붙은 줄 덩이» 하나만 짝(나머지는 «다른 동·공종»)
 * ■ 변경 수량(제안) — 짝이 «확실» 한 줄 = 건설맵 값 · 붙은 줄 덩이(합판 3 · 4 · 6회처럼 여러 줄)와 견준 줄 = 줄 수량 × (건설맵 ÷ 덩이 합)
 *     기본으로 넣는 것: 확실 · 덩이 아님 · 수량이 다른 줄. 약한 짝 · 덩이 비율은 사람이 켤 때만(짐작으로 바꾸지 않음) · 값은 사람이 고칠 수 있음.
 * ■ 받는 것 — ① 내 내역서 그대로(바꾼 수량 칸만 노랑 · «물량 넣은 곳» 시트 — lib/내역채움.js 셀바꾸기)
 *             ② 설계변경 엑셀: 변경내역서(2줄 — 골조 줄 발췌) · 공사비증감대비표 · 공사비물량대비표(설계변경 작업대와 같은 꼴 · 살아 있는 수식) + «건설맵 대조»(근거)
 *     ※ 소장님 원칙(10/01) «이용자 자기 파일을 고쳐 주는 것(2줄 · 작업대 · 설계변경 엑셀)은 수식 그대로» — 받기 전 검사로 다시 셈해 봄
 * ■ 시험: node tools/시험_골조변경.mjs
 */
import { 대조, 단위풀기 } from './내역대조.js'
import { 골조보탬, 골조짝, 골조갈래 } from './내역채움.js'
import { 기준값 } from './골조.js'
import { 파일읽기, 내역시트, 증감대비시트, 물량대비시트, 모으기 as 금액모으기, 품목셈 } from './변경내역.js'

const 글 = (x) => (x === null || x === undefined ? '' : String(x).trim())
const 붙 = (x) => 글(x).replace(/\s+/g, '')
export const 줄열쇠 = (n) => n.시트 + '!' + n.줄
const 둥글게 = (v, u) => { const t = 단위풀기(u); const p = t.무리 === '개' ? 1 : 1000; return Math.round(v * p) / p }
export const 큰차이 = 30          // % — 이보다 크게 다르면 처음엔 안 넣음(짝부터 확인)
const 내역아닌시트 = /일위|단가산출|단가표|단가근거|중기|기계경비|노임|자재단가|원가계산|총괄|품셈|산출근거|수량산출|공정|목차|안내|표지|집계|갑지|명세서|노무비|경비|대비|COVER/i

/** 골조 모델 셈(S) → 대조에 넣을 «도면» 줄 — 규격별(할증 넣은 값 같이) + 맞춤 합계(콘크리트 전체 · 철근 전체 · 거푸집 전체 · 부재별 거푸집) */
export function 모델도면줄(M, S) {
  if (!S || !S.R || !S.R.집계) return []
  const 버림 = (M && M.기준 && M.기준.버림) || 기준값().버림
  const 줄 = []
  for (const a of S.R.집계.합 || []) {
    if (!['콘크리트', '거푸집', '철근', '데크'].includes(a.항목)) continue
    줄.push({ key: 'gz:' + a.항목 + '|' + a.규격 + '|' + a.단위, 골: { 항목: a.항목, 규격: a.규격, 버림: a.항목 === '콘크리트' && a.규격 === 버림 }, 할증수량: a.내역, 할증: a.할증,
      구분: '🏗 골조 모델', 품명: a.항목, 규격: a.규격, 단위: a.단위, 수량: a.산출, 근거: '골조 모델 ' + a.항목 + ' ' + a.규격 + ' 합(할증 전 · 할증 ' + a.할증 + '%)' })
  }
  for (const x of 골조보탬(S.R, 버림)) 줄.push({ ...x, 근거: String(x.근거 || '').replace(/^골조/, '골조 모델') })
  return 줄
}

/** 내역서 시트 켜기 — 골조 줄(레미콘 · 타설 · 철근 · 가공조립 · 거푸집)이 가장 많은 «내역» 시트 하나(같은 줄이 여러 시트 — 갑지 · 을지 · 단가근거 — 에 있어도 한 번) */
export function 골조줄수(s) { return s.줄.filter((n) => { const g = 골조갈래(n); return g && g !== 'X' }).length }
export function 시트고르기(내역, 켤 = null) {
  const 시 = 내역.시트들.map((s) => ({ s, n: 골조줄수(s) }))
  let 고름
  if (켤 && 켤.length) 고름 = new Set(켤.filter((x) => 내역.시트들.some((s) => s.시트 === x)))
  if (!고름 || !고름.size) {
    const 후 = 시.filter((x) => x.n > 0 && !내역아닌시트.test(x.s.시트))
    const 쓸 = (후.length ? 후 : 시.filter((x) => x.n > 0)).sort((a, b) => b.n - a.n)
    고름 = new Set(쓸.length ? [쓸[0].s.시트] : 내역.시트들.filter((s) => s.켬).map((s) => s.시트))
  }
  const 시트들 = 내역.시트들.map((s) => ({ ...s, 켬: 고름.has(s.시트) }))
  let n = 0
  const 줄 = []
  for (const s of 시트들) if (s.켬) for (const x of s.줄) 줄.push({ ...x, id: n++ })
  return { ...내역, 시트들, 줄 }
}

/**
 * 대조 + 변경 수량
 * @param 설정 { 짝: {줄열쇠: 도면 key | ''}, 넣기: {줄열쇠: bool}, 값: {줄열쇠: 수} }
 * @returns { 도면, 결과(대조), 줄: [골조 줄 — {r, 열쇠, 당초, 제안, 방법, 변경, 넣음, 기본넣음, 사람값}], 한눈, 셈 }
 */
export function 골조대조(M, S, 내역, 설정 = {}) {
  const 짝설정 = 설정.짝 || {}, 넣기 = 설정.넣기 || {}, 값설정 = 설정.값 || {}, 수식칸 = 설정.수식칸 || null
  const 기본 = 모델도면줄(M, S)
  const { 규칙, 더 } = 골조짝(기본, 내역.줄)
  const 도면 = [...기본, ...더]
  const 고침 = {}
  for (const n of 내역.줄) { const k = 줄열쇠(n); if (Object.prototype.hasOwnProperty.call(짝설정, k)) 고침[n.id] = 짝설정[k] || null }
  const 결과 = 대조(도면, 내역.줄, 고침, 1, 규칙)
  /* 짝마다 몇 줄이 붙었나(덩이는 한 번) — «여럿이라 약함» 이었던 줄도 덩이 고르기 뒤 하나만 남으면 확실로 봄 */
  const 키수 = new Map()
  for (const r of 결과.줄) if (r.도면) { const k = r.도면.key + (r.덩이 && r.덩이.수 > 1 ? '#' + r.덩이.줄 : '#' + r.내역.id); if (!키수.has(r.도면.key)) 키수.set(r.도면.key, new Set()); 키수.get(r.도면.key).add(k) }
  const 줄 = []
  for (const r of 결과.줄) {
    const n = r.내역
    const g = 골조갈래(n)
    const 골짝 = !!(r.도면 && r.도면.골)
    if (!골짝 && !(g && 규칙.has(n.id)) && !r.고친짝) continue
    const 열쇠 = 줄열쇠(n)
    const 당초 = n.수량 === null || n.수량 === undefined ? null : +n.수량
    let 믿음 = r.믿음 || '', 까닭 = r.까닭 || ''
    if (믿음 === '약함' && r.도면 && /여럿|줄이 \d+개/.test(까닭) && 키수.get(r.도면.key) && 키수.get(r.도면.key).size === 1) { 믿음 = '확실'; 까닭 += ' — 다른 줄은 «다른 동·공종» 으로 빠져 이 줄만 남음' }
    let 제안 = null, 방법 = '', 모델 = null, 율 = null, 판정 = r.판정
    if (r.도면 && Number.isFinite(r.도면수량)) {
      const 모 = r.할증수량 !== null && r.할증수량 !== undefined ? r.할증수량 : r.도면수량
      /* 견줌 = 넣을 값과 같은 바탕(재료 줄은 할증 넣은 값 · 타설 · 가공조립은 할증 없이) — 덩이는 덩이 합과 */
      모델 = 모
      const 견줄 = r.덩이 && r.덩이.수 > 1 ? r.덩이.합 : 당초
      if (견줄 !== null && 견줄 !== 0) { 율 = (모 - 견줄) / Math.abs(견줄) * 100; 판정 = Math.abs(율) <= 1 ? '같음' : 모 > 견줄 ? '도면이 많음' : '도면이 적음' }
      if (r.덩이 && r.덩이.수 > 1) {
        if (당초 !== null && r.덩이.합 > 0) { 제안 = 둥글게(당초 * 모 / r.덩이.합, n.단위); 방법 = '덩이 ' + r.덩이.수 + '줄(' + r.덩이.줄 + ') 합 ' + 쉼(r.덩이.합, 3) + ' → 건설맵 ' + 쉼(모, 3) + ' 비율로 나눔' }
      } else { 제안 = 둥글게(모, n.단위); 방법 = r.할증 ? '건설맵(할증 ' + r.할증 + '% 넣은 값)' : '건설맵' }
    }
    const 다름 = 제안 !== null && (당초 === null || Math.abs(제안 - 당초) >= 0.0005)
    /* 처음부터 넣는 줄 — 짝이 확실 · 1% 넘게 다름 · 덩이 비율 아님 · 차이 30% 안(더 크면 짝이 맞는지부터 사람이 봄 — 짐작으로 바꾸지 않음) */
    const 큼 = 율 !== null && Math.abs(율) > 큰차이
    const 기본넣음 = 다름 && 판정 !== '같음' && 믿음 === '확실' && !(r.덩이 && r.덩이.수 > 1) && !큼
    /* 🔗 수량 칸이 수식(«펌프차 타설 = 레미콘 합» 같은) — 그 칸은 안 바꾸고 받을 때 내역서 식대로 다시 셈(수식반영) */
    if (수식칸 && 수식칸.has(열쇠)) { 줄.push({ r, 열쇠, 갈래: g, 당초, 모델, 율, 판정, 믿음, 까닭, 큼, 제안, 방법: '수량 칸이 수식 — 받을 때 내역서 식대로 다시 셈', 변경: 당초, 넣음: false, 기본넣음: false, 사람값: null, 바뀜: 0, 수식칸: true }); continue }
    const 사람값 = Object.prototype.hasOwnProperty.call(값설정, 열쇠) && Number.isFinite(+값설정[열쇠]) ? +값설정[열쇠] : null
    const 넣음 = Object.prototype.hasOwnProperty.call(넣기, 열쇠) ? !!넣기[열쇠] : (사람값 !== null ? true : 기본넣음)
    const 쓸값 = 사람값 !== null ? 사람값 : 제안
    const 변경 = 넣음 && 쓸값 !== null ? 쓸값 : 당초
    줄.push({ r, 열쇠, 갈래: g, 당초, 모델, 율, 판정, 믿음, 까닭, 큼, 제안, 방법: 사람값 !== null ? '사람이 고친 값' : 방법, 변경, 넣음: 넣음 && 쓸값 !== null, 기본넣음, 사람값, 바뀜: 변경 !== null && 당초 !== null ? 변경 - 당초 : null })
  }
  /* 보는 차례 — 짝 있는 줄(내역 차례) 먼저 · 짝 없음 · 다른 동·공종은 뒤 */
  줄.sort((a, b) => (a.r.도면 ? 0 : 1) - (b.r.도면 ? 0 : 1) || a.r.내역.id - b.r.내역.id)
  const 셈 = { 줄: 줄.length, 짝: 줄.filter((x) => x.r.도면).length, 넣음: 줄.filter((x) => x.넣음 && x.바뀜).length, 같음: 줄.filter((x) => x.판정 === '같음').length, 못: 줄.filter((x) => !x.r.도면).length }
  return { 도면, 결과, 줄, 한눈: 한눈(줄), 셈 }
}

/** 한눈에 — 갈래마다 맞는 정도(전체 짝 줄이 있으면 그것 · 없으면 짝 줄들의 합 — 같은 짝은 한 번) */
export function 한눈(줄) {
  const 무리 = [['콘크리트', (g) => g.항목 === '콘크리트' && !g.버림], ['버림', (g) => g.항목 === '콘크리트' && g.버림], ['거푸집', (g) => g.항목 === '거푸집'], ['철근', (g) => g.항목 === '철근'], ['데크', (g) => g.항목 === '데크']]
  const out = []
  for (const [이름, 맞] of 무리) {
    const z = 줄.filter((x) => x.r.도면 && x.r.도면.골 && 맞(x.r.도면.골) && x.모델 !== null && x.당초 !== null)
    if (!z.length) continue
    const 전 = z.filter((x) => x.r.도면.골.전체)
    const 쓸 = 전.length ? [전[0]] : z
    const 본 = new Set()
    let 내 = 0, 모 = 0
    for (const x of 쓸) {
      const k = x.r.도면.key
      if (x.r.덩이 && x.r.덩이.수 > 1) { if (본.has(k)) continue; 본.add(k); 내 += x.r.덩이.합; 모 += x.모델; continue }
      내 += x.당초; if (!본.has(k)) { 본.add(k); 모 += x.모델 }
    }
    const 율 = 내 ? (모 - 내) / Math.abs(내) * 100 : null
    out.push({ 이름, 내역: 내, 모델: 모, 단위: 쓸[0].r.내역.단위, 율, 맞음: 율 === null ? 0 : Math.max(0, 100 - Math.abs(율)), 줄글: 전.length ? 전[0].r.내역.줄 + '행' : 쓸.length + '줄' })
  }
  return out
}
function 쉼(v, d = 2) { return Number.isFinite(v) ? Number(v).toLocaleString('ko-KR', { maximumFractionDigits: d, minimumFractionDigits: 0 }) : '—' }

/** 내 내역서 그대로 받기 — lib/내역채움.js 셀바꾸기에 넘길 것 (넣은 줄 · 수량이 바뀐 줄만) */
export function 바꿀것(판) {
  const out = []
  for (const x of 판.줄) {
    const n = x.r.내역
    if (!x.넣음 || x.변경 === null || !(n.수량칸 >= 0)) continue
    if (x.당초 !== null && Math.abs(x.변경 - x.당초) < 0.0005) continue
    out.push({ id: n.id, 시트: n.시트, 줄: n.줄, 칸: n.수량칸, 값: x.변경, 전: x.당초, 품명: n.품명, 규격: n.규격, 단위: n.단위, 믿음: x.믿음, 까닭: (x.까닭 || '') + (x.방법 ? ' · ' + x.방법 : ''),
      근거: x.r.도면 ? (x.r.도면.구분 ? x.r.도면.구분 + ' · ' : '') + (x.r.도면.근거 || '') : '사람이 넣은 값', 도면품명: x.r.도면 ? x.r.도면.품명 + (x.r.도면.규격 ? ' ' + x.r.도면.규격 : '') : '' })
  }
  return out
}

/* ───────────────────────────── 설계변경 엑셀(작업대와 같은 꼴) */

const 머리아님 = /^(\[)?\s*(합\s*계|소\s*계|총\s*계|누\s*계|계|공종\s*도급계|도급계)\s*(\])?$/
/**
 * 당초(내 내역서) + 변경(골조 줄 변경 수량) → 2상태 모형 — 골조 줄(짝이 있거나 골조 갈래인 줄)만 발췌, 그 줄의 바로 위 공종 머리를 공종으로
 * @param 책 readWorkbook 결과 { 시트: grid }  @param 판 골조대조()
 */
export function 변경모형(책, 판, 파일이름 = '내역서') {
  const 켠 = [...new Set(판.줄.map((x) => x.r.내역.시트))]
  const 쓸 = new Map(판.줄.map((x) => [x.열쇠, x]))
  const 읽 = 파일읽기(Object.fromEntries(켠.filter((s) => 책[s]).map((s) => [s, 책[s]])), 파일이름)
  const 갈래 = [...new Set(읽.시트들.flatMap((s) => s.갈래 || []))]
  const 줄 = []
  for (const s of 읽.시트들) {
    let 머리 = '', 넣은머리 = null
    for (const x of s.줄) {
      if (x.꼴 === '공종') { const t = 글(x.이름); if (t && !머리아님.test(t.replace(/\s+/g, ' '))) 머리 = t; continue }
      if (x.꼴 !== '품목') continue
      const z = 쓸.get(s.시트 + '!' + x.r)
      if (!z) continue
      const 이름 = (켠.length > 1 ? s.시트 + ' · ' : '') + (머리 || s.시트)
      if (넣은머리 !== 이름) { 줄.push({ 꼴: '공종', 깊이: 0, 번호: '', 이름, 규격: '', 원합: null }); 넣은머리 = 이름 }
      const v0 = x.값[0] || { 수량: z.당초, g: {} }
      /* 바뀐 줄은 금액을 비워 «수량 × 단가(원 미만 버림)» 로 다시 셈(엑셀에서도 수식) — 단가 없이 금액만 적힌 칸(일식 금액)은 그대로 */
      const 바꿈 = !!(z.넣음 && z.바뀜)
      const 단가있음 = ['노무비', '재료비', '경비'].some((k) => v0.g && v0.g[k] && v0.g[k].단가 !== null && v0.g[k].단가 !== undefined)
      const g1 = 바꿈 ? Object.fromEntries(Object.entries(v0.g || {}).map(([k, c]) => [k, { 단가: c ? c.단가 : null, 금액: c && (c.단가 === null || c.단가 === undefined) && !(k === '합계' && 단가있음) ? c.금액 : null }])) : v0.g
      const v1 = { ...v0, 수량: z.변경, g: g1 }
      줄.push({ 꼴: '품목', 번호: x.번호 || '', 이름: x.이름, 규격: x.규격, 단위: x.단위, 값: [v0, v1], 행: x.r, 바뀜: !!(z.넣음 && z.바뀜) })
    }
  }
  return { 시트: '골조 변경', 상태: ['당초', '변경'], 갈래: 갈래.length ? 갈래 : ['합계'], 줄, 꼴: '2상태(건설맵 대조)', 품목수: 줄.filter((x) => x.꼴 === '품목').length, 부제: '골조 줄 발췌 — K-건설맵 적산컨맵 골조 모델 대조' }
}

/** 설계변경 엑셀 시트들 — 변경내역서(2줄) · 공사비증감대비표 · 공사비물량대비표 · 건설맵 대조(근거) */
export function 변경시트들(모형, 판, 색 = null) {
  const 판정글 = { 같음: '✓ 같음(1% 안)', '도면이 많음': '▲ 건설맵이 많음', '도면이 적음': '▼ 건설맵이 적음', '도면에서 못 찾음': '— 짝 없음', '다른 동·공종': '— 다른 동·공종', '내역 수량 없음': '빈 수량' }
  const 대조줄 = 판.줄.map((x, i) => {
    const r = x.r, n = r.내역, d = r.도면
    return [i + 1, n.시트, n.줄, n.품명, n.규격 || '', n.단위 || '', x.당초 === null ? '' : x.당초, d ? +(+r.도면수량).toFixed(6) : '', r.할증수량 !== null && r.할증수량 !== undefined ? +(+r.할증수량).toFixed(6) : '',
      x.율 === null || x.율 === undefined ? '' : Math.round(x.율 * 100) / 100, 판정글[x.판정] || x.판정, d ? d.품명 + (d.규격 ? ' ' + d.규격 : '') : '', (x.믿음 ? x.믿음 + ' — ' : '') + (x.까닭 || ''),
      x.넣음 && x.변경 !== null ? x.변경 : '', x.넣음 ? (x.바뀜 ? '넣음' : '같음') : '안 넣음', x.방법 || '', d ? d.근거 || '' : '']
  })
  const 대조시트 = { 이름: '건설맵 대조', 제목: '건 설 맵   대 조 (골 조 모 델 ↔ 내 역 서)', 부제: '짝 규칙 = 도면 물량 자동과 같음 · 다르다고 곧 틀린 것은 아님(할증 · 셈 기준 · 모델에 없는 부재) — 확인한 줄만 넣으십시오',
    너비: [6, 14, 7, 26, 22, 6, 12, 12, 12, 9, 16, 26, 44, 12, 9, 40, 50],
    머리: [['번호', '시트', '줄', '품명', '규격', '단위', '당초 수량', '건설맵(할증 전)', '건설맵(할증 넣음)', '차이율(%)', '판정', '건설맵 짝', '짝 믿음 · 까닭', '변경 수량', '넣음', '변경 방법', '건설맵 근거']],
    줄: 대조줄, 고정열: 4 }
  return [
    내역시트(모형, [0, 1], { 제목: '변 경 내 역 서', 이름: '변경내역서', 색 }),
    증감대비시트(모형, 0, 1),
    물량대비시트(모형, 0, 1),
    대조시트,
  ]
}

/** 기대값 — 모형에서 셈한 당초 · 변경 합계(갈래 «합계» 또는 첫 갈래) · 바뀐 줄 */
export function 변경기대(모형) {
  const { 합 } = 금액모으기(모형)
  const 기준 = 모형.갈래.includes('합계') ? '합계' : 모형.갈래[0]
  const 줄 = 모형.줄.filter((x) => x.꼴 === '품목')
  return { 당초: 합[0][기준] || 0, 변경: 합[1][기준] || 0, 기준, 품목: 줄.length, 바뀐: 줄.filter((x) => x.바뀜).length,
    수량: 줄.map((x) => [x.이름, x.규격, 품목셈(x.값[0], 모형.갈래)?.수량 ?? null, 품목셈(x.값[1], 모형.갈래)?.수량 ?? null]) }
}

/**
 * 📋 받기 전 검사 — 만든 설계변경 엑셀을 다시 셈해(수식 칸을 셈판으로) 작업대 읽기로 다시 읽어 봄
 *   ① 셈 오류 0 ② 변경내역서(2줄)를 다시 읽으면 품목 수 · 줄마다 당초 · 변경 수량 = 화면 ③ 당초 · 변경 합계 금액 = 화면(원 단위)
 * @param 바이트 변경엑셀() 결과  @param 기대 변경기대()  @param 도구 { 값만으로, readWorkbook } (불러 쓴 쪽이 넘김 — 시험도 같은 것)
 */
export function 변경검사(바이트, 기대, 도구) {
  const 줄 = []
  let 값판 = null
  try { 값판 = 도구.값만으로(바이트) } catch (e) { 줄.push({ 됨: false, 글: '다시 셈하지 못함 — ' + String((e && e.message) || e).slice(0, 120) }); return { 통과: false, 줄 } }
  줄.push({ 됨: 값판.오류 === 0, 글: 값판.오류 === 0 ? `셈 칸 ${값판.바꾼.toLocaleString('ko-KR')}곳을 다시 셈 — 셈 오류 0` : `셈 오류 칸 ${값판.오류}곳` })
  let 읽 = null
  try { 읽 = 파일읽기(도구.readWorkbook(값판.바이트), '변경내역서.xlsx') } catch (e) { 읽 = null }
  const 시 = 읽 && 읽.시트들.find((s) => s.시트 === '변경내역서')
  if (!시) { 줄.push({ 됨: false, 글: '변경내역서 시트를 다시 읽지 못함' }); return { 통과: false, 줄 } }
  const 품 = 시.줄.filter((x) => x.꼴 === '품목')
  const 수다름 = []
  기대.수량.forEach(([이름, 규격, q0, q1], i) => {
    const x = 품[i]
    const a = x && 품목셈(x.값[0], 시.갈래), b = x && 품목셈(x.값[1], 시.갈래)
    if (!x || 붙(x.이름) !== 붙(이름) || Math.abs((a?.수량 ?? 0) - (q0 ?? 0)) > 0.0005 || Math.abs((b?.수량 ?? 0) - (q1 ?? 0)) > 0.0005) 수다름.push((이름 || '') + ' ' + (규격 || ''))
  })
  줄.push({ 됨: 품.length === 기대.품목 && !수다름.length, 글: 품.length !== 기대.품목 ? `다시 읽은 품목 ${품.length}줄 ≠ 화면 ${기대.품목}줄` : 수다름.length ? `수량이 화면과 다른 줄 ${수다름.length} — ${수다름.slice(0, 3).join(' · ')}` : `품목 ${품.length}줄 — 당초 · 변경 수량이 모두 화면과 같음(바뀐 줄 ${기대.바뀐})` })
  const { 합 } = 금액모으기({ ...시, 상태: 시.상태 })
  const 기준 = 시.갈래.includes('합계') ? '합계' : 시.갈래[0]
  const 엑0 = (합[0] && 합[0][기준]) || 0, 엑1 = (합[1] && 합[1][기준]) || 0
  /* 줄마다 «원 미만 버림» 끝수(수량 × 단가가 0.9999… 로 셈되는 칸) — 품목 × 갈래 셋만큼 원 안은 같음으로 봄 */
  const 끝수 = Math.max(1, 기대.품목 * 3)
  const 금됨 = Math.abs(엑0 - 기대.당초) <= 끝수 && Math.abs(엑1 - 기대.변경) <= 끝수
  줄.push({ 됨: 금됨, 글: `합계 금액 — 당초 ${Math.round(엑0).toLocaleString('ko-KR')}원 · 변경 ${Math.round(엑1).toLocaleString('ko-KR')}원 ${금됨 ? '= 화면' + (Math.abs(엑0 - 기대.당초) + Math.abs(엑1 - 기대.변경) >= 1 ? `(원 미만 버림 끝수 ${끝수}원 안)` : '') : '≠ 화면 ' + Math.round(기대.당초).toLocaleString('ko-KR') + ' · ' + Math.round(기대.변경).toLocaleString('ko-KR')}` })
  return { 통과: 줄.every((x) => x.됨), 줄 }
}

/**
 * 내 내역서(셀바꾸기 한 것)를 다시 셈해 읽은 골조 줄 수량 — 수량 칸이 수식인 줄(«펌프차 타설 = 레미콘 합» 같은)은 내역서 식대로 따라 바뀜
 * @param 값바이트 값만으로(셀바꾸기 결과).바이트  @param 책읽기 qtoxlsx 의 readWorkbook
 * @returns Map(줄열쇠 → 수량)
 */
export function 다시읽은수량(값바이트, 판, 책읽기) {
  const 책 = 책읽기(값바이트)
  const out = new Map()
  for (const x of 판.줄) {
    const n = x.r.내역
    const g = 책[n.시트]
    if (!g || !(n.수량칸 >= 0)) continue
    const v = (g[n.줄 - 1] || [])[n.수량칸]
    const q = typeof v === 'number' ? v : Number(String(v ?? '').replace(/,/g, ''))
    if (v !== '' && v !== null && v !== undefined && Number.isFinite(q)) out.set(x.열쇠, q)
  }
  return out
}
/** 다시 읽은 수량을 판에 — 수식 칸이 따라 바뀐 줄은 «내역서 식대로» 로 넣음(변경 내역서 · 증감이 내 내역서와 같게) */
export function 수식반영(판, 다시) {
  if (!다시 || !다시.size) return 판
  const 줄 = 판.줄.map((x) => {
    const q = 다시.get(x.열쇠)
    if (q === undefined || x.당초 === null) return x
    const 지금 = x.넣음 && x.변경 !== null ? x.변경 : x.당초
    if (Math.abs(q - 지금) < 0.0005) return x
    return { ...x, 변경: q, 넣음: true, 바뀜: q - x.당초, 방법: '수량 칸이 수식 — 내역서 식대로 다시 셈(바꾼 줄을 따라)', 수식: true }
  })
  return { ...판, 줄 }
}

/**
 * 🔗 수량 칸이 수식인 줄 찾기(.xlsx) — 셀바꾸기에 «당초 값 그대로» 를 넣어 보고 «수식이라 그대로 둠» 이 나온 줄
 * @param 셀바꾸기 lib/내역채움.js 것(부른 쪽이 넘김)  @returns Set(줄열쇠)
 */
export function 수식칸찾기(원본, 내역, 셀바꾸기) {
  const 바꿀 = []
  for (const n of 내역.줄) { const g = 골조갈래(n); if (!g || g === 'X' || !(n.수량칸 >= 0)) continue; 바꿀.push({ id: n.id, 시트: n.시트, 줄: n.줄, 칸: n.수량칸, 값: n.수량 ?? 0, 전: n.수량, 품명: n.품명 }) }
  if (!바꿀.length) return new Set()
  try {
    const r = 셀바꾸기(원본, 바꿀, { 알림: false, 칠: false })
    return new Set(r.안됨.filter((x) => /수식/.test(x.까닭 || '')).map((x) => x.시트 + '!' + x.줄))
  } catch (e) { return new Set() }
}
