/**
 * 📑 내역서 물량 ↔ 도면 물량 대조 (2026-09-27)
 *
 * 소장님: 「도면 넣으면 모든 물량이 나오게… 그럼, 내역서 물량이랑 대조해 볼 수 있잖아」
 *         (진짜 목적 — 「물량이 틀린 데를 찾아 설계변경으로 가는 것」, 9/20)
 *
 * ■ 내역서(.xlsx · .csv)에서 «품명·규격·단위·수량» 줄을 읽고, 도면에서 뽑은 물량과 짝을 짓습니다.
 *   짝 = 단위가 같은 무리(m·m²·m³·개·kg/ton)이고 품명·규격이 가장 닮은 것. 사람이 짝을 바꿀 수 있습니다.
 * ■ 판정: 차이율 |도면−내역| ÷ 내역 ≤ 1% «같음» · 넘으면 «다름» · 짝이 없으면 «도면에서 못 찾음»
 *   도면에는 있는데 내역서에 짝이 없는 물량은 «내역에 없음» (빠진 물량일 수 있음)
 * ■ «다름» 은 곧 «틀림» 이 아닙니다 — 할증·환산·범위(도면 한 장 vs 내역 전체)가 다를 수 있습니다. 근거를 같이 보여 줍니다.
 * ■ 시험: node tools/시험_내역대조.mjs
 */
import { readWorkbook } from './qtoxlsx.js'

const 글 = (x) => String(x ?? '').trim()
const 붙 = (s) => 글(s).replace(/\s+/g, '')
function 수(x) {
  if (typeof x === 'number') return Number.isFinite(x) ? x : null
  const t = 글(x).replace(/,/g, '')
  if (!t || !/^[-+]?\d*\.?\d+(e[-+]?\d+)?$/i.test(t)) return null
  const v = Number(t)
  return Number.isFinite(v) ? v : null
}

/* ───────────────────────────── 내역서 읽기 */

const H_품명 = /^(품명|공종|공종명|명칭|품목|자재명|공사명|규격및품명|품명및규격|산출명|항목|세부공종|세부공종명|내용|공종및규격|품명규격)$/
const H_규격 = /^(규격|형식|규격및단위|치수|사양)$/
const H_단위 = /^(단위)$/
const H_수량 = /^(수량|물량|설계수량|계약수량|당초수량|변경수량|도급수량|수량계|계|합계수량)$/
const 합계줄 = /^(합계|소계|총계|계|누계|재료비|노무비|경비|직접공사비|간접공사비|순공사원가|공사원가|총공사비|부가가치세|일반관리비|이윤|비고|구분|번호|호표|[가-힣]*합계|[가-힣]*소계)$/
const 내역아닌시트 = /일위|단가산출|단가표|중기|기계경비|노임|자재단가|원가계산|총괄|품셈|산출근거|수량산출|공정|목차|안내|표지|집계표|갑지|명세서|노무비|경비|COVER/i

/** 머리 줄 찾기 — 두 줄 머리(「당초 / 수량」)도 합쳐 봄 */
function 머리찾기(grid) {
  for (let i = 0; i < Math.min(grid.length, 40); i++) {
    const a = (grid[i] || []).map((x) => 붙(x))
    const b = (grid[i + 1] || []).map((x) => 붙(x))
    for (const c of [a, a.map((x, j) => x || b[j] || ''), a.map((x, j) => (b[j] && H_수량.test(b[j]) ? b[j] : x))]) {
      const iN = c.findIndex((x) => H_품명.test(x))
      if (iN < 0) continue
      // 수량 칸 — 「변경수량」 이 있으면 그것(지금 물량), 아니면 첫 수량
      let iQ = c.findIndex((x) => /^변경수량$/.test(x))
      if (iQ < 0) iQ = c.findIndex((x) => H_수량.test(x))
      if (iQ < 0) continue
      return { i, 칸: { 품명: iN, 규격: c.findIndex((x) => H_규격.test(x)), 단위: c.findIndex((x) => H_단위.test(x)), 수량: iQ }, 머리: c, 두줄: c !== a }
    }
  }
  return null
}

/** 한 시트 → 내역 줄 */
function 시트읽기(시트, grid) {
  const h = 머리찾기(grid)
  if (!h) return { 시트, 줄: [], 까닭: '「품명·수량」 머리를 못 찾음' }
  const { 칸 } = h
  const 줄 = []
  for (let r = h.i + 1; r < grid.length; r++) {
    const row = grid[r] || []
    const nm = 글(row[칸.품명])
    const q = 수(row[칸.수량])
    const 단 = 칸.단위 >= 0 ? 글(row[칸.단위]) : ''
    if (!nm) continue
    /* 📥 2026-09-28 — 공내역서처럼 «수량 칸이 빈» 줄도 읽습니다(단위가 있는 줄만) → 도면 물량을 넣을 자리.
       수량 칸에 글자(「별도」 등)가 있으면 건드리지 않습니다. */
    const 빈 = q === null && 글(row[칸.수량]) === ''
    if (q === null && !(빈 && 단 && 단위풀기(단).무리 && 단위풀기(단).무리 !== '식')) continue
    if (합계줄.test(붙(nm))) continue
    if (H_품명.test(붙(nm))) continue
    줄.push({ 시트, 줄: r + 1, 수량칸: 칸.수량, 품명: nm, 규격: 칸.규격 >= 0 ? 글(row[칸.규격]) : '', 단위: 단, 수량: q, 빈 })
  }
  return { 시트, 줄, 머리줄: h.i + 1, 칸 }
}

/** CSV 한 줄 가르기 (따옴표 안 쉼표) */
function csv줄(line) {
  const out = []
  let cur = '', q = false
  for (let k = 0; k < line.length; k++) {
    const ch = line[k]
    if (q) { if (ch === '"') { if (line[k + 1] === '"') { cur += '"'; k++ } else q = false } else cur += ch }
    else if (ch === '"') q = true
    else if (ch === ',' || ch === '\t') { out.push(cur); cur = '' }
    else cur += ch
  }
  out.push(cur)
  return out
}

/**
 * 내역서 읽기
 * @param bytes ArrayBuffer|Uint8Array  @param name 파일 이름
 * @returns {이름, 시트들:[{시트, 줄:[…], 켬}], 줄:[켠 시트의 줄], 말:[시트마다 한 줄]}
 */
export function 내역읽기(bytes, name) {
  let wb
  if (/\.(csv|txt|tsv)$/i.test(name || '')) {
    let t = new TextDecoder('utf-8').decode(bytes)
    if (t.includes('�')) { try { t = new TextDecoder('euc-kr').decode(bytes) } catch (e) { /* 그대로 */ } }
    wb = { [String(name).replace(/\.[^.]+$/, '')]: t.replace(/^﻿/, '').split(/\r?\n/).map(csv줄) }
  } else wb = readWorkbook(bytes)
  const 시트들 = []
  const 말 = []
  for (const [시트, grid] of Object.entries(wb)) {
    if (!grid || !grid.length) { 말.push(시트 + ': 빈 시트'); continue }
    const r = 시트읽기(시트, grid)
    if (r.줄.length) { 시트들.push({ ...r, 켬: !내역아닌시트.test(시트) }); 말.push(시트 + ': ' + r.줄.length + '줄') }
    else 말.push(시트 + ': ' + (r.까닭 || '줄 없음'))
  }
  if (!시트들.length) throw new Error('내역서에서 「품명·수량」 표를 못 찾았습니다 (' + 말.slice(0, 6).join(' / ') + ')')
  if (!시트들.some((s) => s.켬)) 시트들[0].켬 = true
  // 같은 줄이 여러 시트에 있으면(갑지·을지) — 내역다운 시트를 먼저
  const 내역다운 = 시트들.filter((s) => s.켬 && /내역|을지|공종/.test(s.시트))
  if (내역다운.length) for (const s of 시트들) if (!/내역|을지|공종/.test(s.시트)) s.켬 = false
  return 모으기({ 이름: name || '내역서', 시트들, 말 })
}
/** 켠 시트의 줄만 다시 모음 */
export function 모으기(내역) {
  let n = 0
  const 줄 = []
  for (const s of 내역.시트들) if (s.켬) for (const x of s.줄) 줄.push({ ...x, id: n++ })
  return { ...내역, 줄 }
}

/* ───────────────────────────── 단위 */

/** 단위 → {무리, 배} (배 = 무리의 바탕 단위로 바꾸는 곱) */
export function 단위풀기(u) {
  const t = 붙(u).toUpperCase().replace(/[()]/g, '')
  if (!t) return { 무리: '', 배: 1 }
  if (/^(M3|㎥|M³|루베|입방미터|CUM)$/.test(t)) return { 무리: 'm3', 배: 1 }
  if (/^(M2|㎡|M²|제곱미터|평방미터|SQM)$/.test(t)) return { 무리: 'm2', 배: 1 }
  if (/^(M|미터|㎙|LM)$/.test(t)) return { 무리: 'm', 배: 1 }
  if (/^(KM|㎞)$/.test(t)) return { 무리: 'm', 배: 1000 }
  if (/^(KG|㎏|킬로그램)$/.test(t)) return { 무리: 'kg', 배: 1 }
  if (/^(TON|톤|T|M\/T|MT)$/.test(t)) return { 무리: 'kg', 배: 1000 }
  if (/^(G|그램)$/.test(t)) return { 무리: 'kg', 배: 0.001 }
  if (/^(개|EA|개소|본|조|대|SET|셋트|세트|기|주|매|구|벌|곳|개수|NO|NOS|PCS|PC)$/.test(t)) return { 무리: '개', 배: 1 }
  if (/^(식|LS|L\.S)$/.test(t)) return { 무리: '식', 배: 1 }
  if (/^(L|리터|ℓ)$/.test(t)) return { 무리: 'L', 배: 1 }
  return { 무리: t, 배: 1 }
}

/* ───────────────────────────── 이름 닮음 */

const 같은말 = [
  [/아스팔트콘크리트|아스팔트|ASCON|ASP/g, '아스콘'], [/보차도경계석|연석|CURB/g, '경계석'], [/가드레일|방호책|G\.?R/g, '방호울타리'],
  [/철근콘크리트용봉강|봉강|이형철근|철근가공조립|철근가공|철근조립|REBAR|SD[345]00W?|SD[345]00/g, '철근'], [/레미콘|CONC'?|콘크리트타설/g, '콘크리트'],
  [/흄관|원심력철근콘크리트관|HUME/g, '흄관'], [/빗물받이|우수받이|트렌치/g, '집수정'], [/보안등|가로등|투광등/g, '가로등'],
  [/휀스|펜스|FENCE/g, '울타리'], [/거푸집|형틀/g, '거푸집'], [/L형측구|U형측구|측구수로/g, '측구'], [/보도블록|보도블럭|블럭|인터로킹/g, '블록'],
]
function 다듬기(s) {
  let t = 붙(s).toUpperCase().replace(/[()[\]{}<>·,._/\\'"`~!@#$%^&*+=:;|-]/g, '')
  for (const [re, 새] of 같은말) t = t.replace(re, 새)
  t = t.replace(/(설치|시공|제작|구입|설치비|공사|작업|포설)$/g, '').replace(/(설치|시공|제작|구입)(?=[A-Z0-9])/g, '')
  return t
}
function 두글자(s) { const a = []; for (let k = 0; k < s.length - 1; k++) a.push(s.slice(k, k + 2)); return a.length ? a : [s] }
function 닮음(a, b) {
  if (!a || !b) return 0
  if (a === b) return 1
  const A = 두글자(a), B = 두글자(b)
  const m = new Map()
  for (const x of A) m.set(x, (m.get(x) || 0) + 1)
  let n = 0
  for (const x of B) { const c = m.get(x); if (c) { n++; m.set(x, c - 1) } }
  let d = (2 * n) / (A.length + B.length)
  if (a.includes(b) || b.includes(a)) d = Math.max(d, 0.6 + 0.4 * Math.min(a.length, b.length) / Math.max(a.length, b.length))
  return d
}
/** 규격 속 숫자·기호(D13 · 300 · Φ600 · 24MPA) */
function 규격말(s) {
  const t = 붙(s).toUpperCase().replace(/Φ|∅|Ø|φ|파이/g, 'D')
  const out = new Set()
  for (const m of t.matchAll(/[A-Z]{0,3}\d+(?:\.\d+)?/g)) out.add(m[0])
  return out
}
/* 🔩 SH22·SHD22·UHD25(고강도) 도 지름으로 읽음 (2026-09-28 — 실제 공내역서에 «철근 SH22» 가 있음) */
export const 철근지름 = (s) => { const m = 붙(s).toUpperCase().match(/(?:^|[^A-Z])(?:SHD|UHD|SH|HD|SD|D|H)(\d{2})(?!\d)/); return m ? 'D' + m[1] : '' }
/** 레미콘 규격 «25-24-150» · «25-30-15»(슬럼프 cm) · «25-240-15»(옛 kgf) → {골재, fck} */
export function 콘크리트규격(s) {
  const m = 붙(s).match(/(?:^|[^\d])(\d{2})-(\d{2,3})-(\d{2,3})(?!\d)/)
  if (!m) return null
  let fck = +m[2]
  if (fck >= 100) fck = fck / 10
  return { 골재: +m[1], fck }
}

/** 도면 줄 d 와 내역 줄 n 의 닮음 점수 (0~1) — 단위 무리가 다르면 0 */
export function 점수(d, n) {
  const ud = 단위풀기(d.단위), un = 단위풀기(n.단위)
  if (!ud.무리 || !un.무리 || ud.무리 !== un.무리 || un.무리 === '식') return 0
  const da = 다듬기(d.품명), na = 다듬기(n.품명)
  const 이름 = 닮음(da, na)
  if (이름 < 0.35) return 0
  const 한d = da.replace(/[^가-힣]/g, ''), 한n = na.replace(/[^가-힣]/g, '')
  if (한d && 한n && 닮음(한d, 한n) < 0.3) return 0            // 한글 이름이 다르면(보 ↔ 분전함) 기호만 같아도 짝이 아님                                   // 이름이 안 닮으면 규격이 같아도 짝이 아님 (분전함 CB1 ↔ 보 CB1)
  const 규d = 규격말(d.규격 + ' ' + d.품명), 규n = 규격말(n.규격 + ' ' + n.품명)
  let 규 = 0
  if (규d.size && 규n.size) { let c = 0; for (const x of 규d) if (규n.has(x)) c++; 규 = c / Math.max(1, Math.min(규d.size, 규n.size)) }
  let s = 이름 * 0.8 + 규 * 0.2
  // 철근은 지름이 달라서는 안 됨
  const fd = 철근지름(d.규격 + ' ' + d.품명), fn = 철근지름(n.규격 + ' ' + n.품명)
  if (fd && fn && fd !== fn) s *= 0.15
  if (fd && fn && fd === fn && /철근/.test(다듬기(d.품명)) && /철근/.test(다듬기(n.품명))) s = Math.max(s, 0.9)
  // 콘크리트는 강도(fck)가 달라서는 안 됨 (25-24-150 ↔ 25-30-15)
  const cd = 콘크리트규격(d.규격 + ' ' + d.품명), cn = 콘크리트규격(n.규격 + ' ' + n.품명)
  if (cd && cn && cd.fck !== cn.fck) s *= 0.15
  return Math.max(0, Math.min(1, s))
}
/** 규격 속 숫자가 둘 다 있는데 하나도 안 겹치나 (석고보드 9.5T ↔ 12.5T) — 이름만 같은 짝을 «확실» 로 두지 않게 */
export function 규격어긋남(d, n) {
  const a = 규격말(d.규격 || ''), b = 규격말(n.규격 || '')
  if (!a.size || !b.size) return false
  for (const x of a) if (b.has(x)) return false
  return true
}
export const 문턱 = 0.42

/**
 * 짝 짓기
 * @param 도면 [{key, 품명, 규격, 단위, 수량, 근거, 구분}]
 * @param 내역 [{id, 시트, 줄, 품명, 규격, 단위, 수량}]
 * @param 고침 {내역id: 도면key | '' (짝 없음)}
 * @returns {줄:[{내역, 도면|null, 후보:[{key, 점수}], 점수, 도면수량(내역 단위), 차이, 율, 판정}], 남은도면:[도면 줄], 셈:{같음, 다름, 없음, 도면만}}
 */
/**
 * 📥 2026-09-28 — 소장님 「물량, 내역채우는 거 다 자동이 목표야」
 *   · 규칙: Map(내역 id → {key|null, 믿음:'확실'|'약함', 까닭, 할증:boolean}) — 골조처럼 «뜻» 으로 짝을 짓는 것(lib/내역채움.js 골조짝)
 *     규칙이 알아본 줄은 이름 닮음 대신 규칙을 따르고, 이름 닮음 후보에서 골조 줄(d.골)은 뺍니다(강도 다른 레미콘에 붙지 않게).
 *   · 도면 줄에 대조전용:true 면(골조 합계처럼 내역 맞춤용) 이름 닮음 후보·«내역에 없는 도면 물량» 에서 뺍니다.
 *   · 내역 수량이 빈 줄(공내역서) → 판정 «내역 수량 없음» (넣을 자리)
 *   · 믿음: 사람이 고른 짝·규칙 «확실» · 이름이 거의 같고(닮음 0.75↑) 규격 숫자가 어긋나지 않음 → 확실, 나머지 → 약함
 */
export function 대조(도면, 내역, 고침 = {}, 허용 = 1, 규칙 = null) {
  const 표 = new Map(도면.map((d) => [d.key, d]))
  const 쓴 = new Set()
  const 보통 = 도면.filter((d) => !d.대조전용)
  const 골빼고 = 보통.filter((d) => !d.골)
  const 줄 = 내역.map((n) => {
    const 규 = 규칙 ? 규칙.get(n.id) : null
    const 고친짝 = Object.prototype.hasOwnProperty.call(고침, n.id)
    let 후보 = (규 ? 골빼고 : 보통).map((d) => ({ key: d.key, 점수: 점수(d, n) })).filter((c) => c.점수 >= 0.25).sort((a, b) => b.점수 - a.점수).slice(0, 6)
    if (규 && 규.key) 후보 = [{ key: 규.key, 점수: 1, 규칙: true }, ...후보.filter((c) => c.key !== 규.key)].slice(0, 6)
    let key = null
    if (고친짝) key = 고침[n.id] || null
    else if (규 && 규.key) key = 규.key
    else if (후보.length && 후보[0].점수 >= 문턱) key = 후보[0].key
    const d = key ? 표.get(key) || null : null
    if (!d) return { 내역: n, 도면: null, 후보, 점수: 0, 도면수량: null, 차이: null, 율: null, 판정: '도면에서 못 찾음', 고친짝, 믿음: '', 까닭: 규 && !규.key ? 규.까닭 || '' : '' }
    쓴.add(d.key)
    const ud = 단위풀기(d.단위), un = 단위풀기(n.단위)
    const 바꿈 = (v) => (ud.무리 === un.무리 ? v * ud.배 / un.배 : v)
    const 도면수량 = 바꿈(d.수량)
    const 빈 = n.수량 === null || n.수량 === undefined
    const 차이 = 빈 ? null : 도면수량 - n.수량
    const 율 = !빈 && n.수량 ? 차이 / Math.abs(n.수량) * 100 : null
    const 판정 = 빈 ? '내역 수량 없음' : 율 !== null && Math.abs(율) <= 허용 ? '같음' : (차이 > 0 ? '도면이 많음' : '도면이 적음')
    const 점 = (후보.find((c) => c.key === d.key) || {}).점수 || 0
    const 규맞음 = 규 && 규.key === d.key
    const 이름점 = 닮음(다듬기(d.품명), 다듬기(n.품명))
    const 믿음 = 고친짝 ? '확실' : 규맞음 ? 규.믿음 : ((이름점 >= 0.75 || 점 >= 0.9) && 점 >= 문턱 && !규격어긋남(d, n) ? '확실' : '약함')
    const 까닭 = 고친짝 ? '사람이 고른 짝' : 규맞음 ? 규.까닭 : (믿음 === '확실' ? '이름·규격이 같음' : '이름이 닮음 — 확인')
    const 할증쓰기 = !!(규맞음 && 규.할증) && Number.isFinite(d.할증수량)
    return { 내역: n, 도면: d, 후보, 점수: 점, 도면수량, 할증수량: 할증쓰기 ? 바꿈(d.할증수량) : null, 할증: 할증쓰기 ? d.할증 : 0, 차이, 율, 판정, 고친짝, 믿음, 까닭 }
  })
  const 남은도면 = 보통.filter((d) => !쓴.has(d.key))
  const 셈 = { 같음: 0, 다름: 0, 없음: 0, 빈: 0, 도면만: 남은도면.length }
  for (const r of 줄) { if (r.판정 === '같음') 셈.같음++; else if (r.판정 === '내역 수량 없음') 셈.빈++; else if (r.도면) 셈.다름++; else 셈.없음++ }
  return { 줄, 남은도면, 셈 }
}

/** 엑셀 시트 둘 — «내역 대조» (차이·율은 살아 있는 식) · «내역에 없는 도면 물량» */
export function 대조시트(결과, 모양) {
  const rows = 결과.줄.map((r, i) => {
    const R = i + 2
    const n = r.내역, d = r.도면
    const 빈 = n.수량 === null || n.수량 === undefined
    return [i + 1, n.시트, n.줄, n.품명, n.규격, n.단위, 빈 ? '' : { v: n.수량, st: 모양.QTY },
      d ? d.품명 : '', d ? d.규격 || '' : '', d ? { v: Math.round(r.도면수량 * 1e6) / 1e6, st: 모양.QTY } : '',
      d && !빈 ? { f: 'ROUND(J' + R + '-G' + R + ',3)', st: 모양.QTY } : '', d && !빈 ? { f: 'IF(G' + R + '=0,"",ROUND((J' + R + '-G' + R + ')/ABS(G' + R + ')*100,2))', st: 모양.QTY } : '',
      r.판정, r.믿음 ? r.믿음 + (r.까닭 ? ' — ' + r.까닭 : '') : '', d ? { v: (d.구분 ? d.구분 + ' · ' : '') + (d.근거 || '') + (r.할증 ? ' · 재료 줄은 할증 ' + r.할증 + '% 넣은 값 ' + Math.round(r.할증수량 * 1000) / 1000 : ''), st: 모양.GRAY } : '']
  })
  const 남 = 결과.남은도면.map((d, i) => [i + 1, d.구분 || '', d.품명, d.규격 || '', d.단위, { v: Math.round(d.수량 * 1000) / 1000, st: 모양.QTY }, { v: d.근거 || '', st: 모양.GRAY }, d.도면 || ''])
  return [
    { name: '내역 대조', head: ['번호', '내역 시트', '내역 줄', '내역 품명', '내역 규격', '단위', '내역 수량', '도면 품명', '도면 규격', '도면 수량', '차이(도면−내역)', '차이율(%)', '판정', '짝 믿음', '도면 근거'], rows, widths: [6, 12, 7, 24, 16, 6, 12, 22, 14, 12, 13, 10, 12, 24, 50], freeze: 1 },
    { name: '내역에 없는 도면 물량', head: ['번호', '구분', '품명', '규격', '단위', '도면 수량', '근거', '도면'], rows: 남, widths: [6, 20, 24, 14, 6, 12, 50, 22], freeze: 1 },
  ]
}
