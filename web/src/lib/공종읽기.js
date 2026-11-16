/**
 * 📥 내역서 → 공종 나무 (예정공정표 «내역서만 넣으면» — 2026-11-16 소장님 「간단하게 하는 방법없을까? 내역서만 넣으면 되게」 → 「해줘.」
 *    → 「실제로 내역서 직접 넣어 보고, 점검해줘」)
 *
 *   실제 내역서 꼴 여럿을 한 길로 읽어 «공종(묶음) 줄» 만 나무로 — 이름 · 깊이 · 금액(그 줄에 적힌 합 · 없으면 아래 품목 합):
 *     · 공종별집계표 «01 · 0101 · 010101 이름» (이름 앞 짝수 자리 번호 · 또는 «공종코드» 칸)
 *     · 내역서 · 총괄표 «공종» 칸 «● · 1. · 1.1 · 1.1.1 · 1) · a)» + «품명» 칸 (품목 줄은 번호 없음)
 *     · 이름 앞 번호 «1.목동 · 1)면보수 · 1-1.태양광» · 표식 «▣ ◈ □ ◇ ▶»
 *   시트는 모두 읽어 보고 가장 «공종표» 다운 것(집계 · 총괄 · 내역 이름 · 번호 · 금액)을 고름 — 일위대가 · 단가산출 · 기계경비 · 원가계산서 · 수량 · 예정공정표 시트는 안 고름.
 * ■ 빼는 것(알림에 적음): 관급자재(관급자 · 도급자 · 관급자설치 · 도급자설치) · 부담금 · 기타공사비 ·
 *     위 공종 합(적힌 금액)에 안 드는 아래 공종(«● 순공사비» 뒤에 붙은 관급 · 기타공사비처럼) · 금액이 있는 내역서에서 금액 0 · 음수(작업부산물) 공종
 * ■ 맨 위가 한 줄(공사 이름 · 순공사비)뿐이면 벗기고 그 아래부터 — 그 이름은 공사명 후보.
 * ■ 도급액: 원가계산서(또는 총괄표)의 «도급액 · 도급금액 · 도급공사비» (없으면 공급가액 + 부가가치세)
 * ■ 시험: node tools/시험_공종읽기.mjs (지어낸 내역서 꼴 여럿) · 실제 내역서는 PC 에서만 대 봄(저장소에 안 올림)
 */
import { readWorkbook } from './qtoxlsx.js'

const 글 = (x) => (x === null || x === undefined ? '' : String(x).replace(/ /g, ' ').trim())
const 붙 = (x) => 글(x).replace(/\s+/g, '')
const 수 = (x) => {
  if (typeof x === 'number') return Number.isFinite(x) ? x : null
  const t = 글(x).replace(/[,\s원₩]/g, '')
  return /^-?\d+(\.\d+)?$/.test(t) ? Number(t) : null
}

/* ── 머리 · 칸 ─────────────────────────────────────────── */
const 이름머리 = /^(품명|명칭|공종명|공종|공사명|공사종류|공종및품명|품명및규격|품명규격|공종및규격|내역|항목|세부공종|세부내역|구분)$/
const 값머리 = /^(규격|단위|수량|단가|금액|합계|합계금액|재료비|노무비|경비|계|총액|공사비|비고|조사금액합계|설계금액|산출근거)$/
const 코드머리 = /^(공종|코드|공종코드|번호|no\.?|순번|구분|공종번호)$/i

function 머리찾기(g) {
  for (let r = 0; r < Math.min(g.length, 40); r++) {
    const a = (g[r] || []).map(붙)
    if (!a.some((x) => 이름머리.test(x))) continue
    const b = (g[r + 1] || []).map(붙)
    const n = a.filter((x) => 값머리.test(x)).length + b.filter((x) => /^(단가|금액)$/.test(x)).length
    if (n >= 2) return r
  }
  return -1
}

/** 금액 칸 — 합계(아래 «금액») 한 칸 · 없으면 재료 · 노무 · 경비 금액 칸들(더함) */
function 금액칸들(a, b, 아래머리) {
  const bb = 아래머리 ? b : []
  for (let j = 0; j < a.length; j++) {
    if (!/합계|^(총액|공사비|합|계|총계|금액합계|설계금액)$/.test(a[j])) continue
    if (bb[j] === '금액') return [j]
    if (bb[j] === '단가' && bb[j + 1] === '금액') return [j + 1]
    if (!bb[j] && bb[j + 1] === '금액' && !a[j + 1]) return [j + 1]
    if (!bb[j]) return [j]
  }
  for (let j = 0; j < a.length; j++) {
    if (a[j] !== '금액') continue
    if (!bb[j]) return [j]
    for (let k = j; k < Math.min(a.length + 6, j + 6); k++) if (/^(합계|계)$/.test(bb[k] || '')) return [k]
  }
  const 갈래 = []
  for (let j = 0; j < a.length; j++) {
    if (!/^(재료비|노무비|경비)$/.test(a[j])) continue
    if (bb[j] === '금액') 갈래.push(j)
    else if (bb[j + 1] === '금액') 갈래.push(j + 1)
    else if (!bb[j]) 갈래.push(j)
  }
  return 갈래
}

/* ── 번호(코드) ─────────────────────────────────────────── */
const 표식들 = '▣◈□■●◎▶◆◇○※★☆►▷◐◑▦▩◉▲△▼▽◀◁⊙▪▫◘◙'
const 표식앞 = new RegExp('^([' + 표식들 + ']+)\\s*\\.?\\s*')
const 로마 = 'ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ'

/** 번호 글 → {꼴, 단} — 꼴: N(1 · 1.1 · 01 · 0101 · 1-1) · P«1)» · Q«(1)» · A«a)» · K«가.» · C«①» · R«Ⅰ.» · M«●» */
export function 번호풀이(t) {
  const s = 붙(t)
  if (!s) return null
  if (new RegExp('^[' + 표식들 + ']+\\.?$').test(s)) return { 꼴: 'M', 단: 0, 표: s[0] }
  if (/^0\d(\d{2}){0,7}$/.test(s) || /^\d{2}(\d{2}){1,7}$/.test(s)) return { 꼴: 'N', 단: s.length / 2, 값: Number(s.slice(-2)) }
  if (/^\d{1,3}(\.\d{1,3}){0,5}\.?$/.test(s)) { const p = s.replace(/\.$/, '').split('.'); return { 꼴: 'N', 단: p.length, 값: Number(p[p.length - 1]), 맨수: p.length === 1 && !/\.$/.test(s) && p[0].length >= 2 } }
  if (/^\d{1,3}(-\d{1,3}){0,5}-?$/.test(s)) return { 꼴: 'N', 단: s.replace(/-$/, '').split('-').length }
  if (/^\d{1,3}\)$/.test(s)) return { 꼴: 'P', 단: 0 }
  if (/^\(\d{1,3}\)\.?$/.test(s)) return { 꼴: 'Q', 단: 0 }
  if (/^[a-zA-Z][.)]?$/.test(s) || /^\([a-zA-Z]\)$/.test(s)) return { 꼴: 'A', 단: 0 }
  if (/^[가-하][.)]$/.test(s) || /^\([가-하]\)$/.test(s)) return { 꼴: 'K', 단: 0 }
  if (/^[①-⑳]$/.test(s)) return { 꼴: 'C', 단: 0 }
  if (new RegExp('^[' + 로마 + ']+\\.?$').test(s) || /^(I|II|III|IV|V|VI|VII|VIII|IX|X)\.$/.test(s)) return { 꼴: 'R', 단: 0 }
  return null
}

/** 이름 앞에 붙은 번호 «010101 가설공사 · 1.목동 · 1.1 토공 · 1)면보수 · (1) · a) · 가. · ①» → {번호, 이름} | null */
export function 이름앞번호(t) {
  const s = 글(t)
  let m = s.match(/^(\d{2}(?:\d{2}){0,7})\.?\s+(\S.*)$/) || s.match(/^(\d{4}(?:\d{2}){0,6})\.(\D.*)$/)
  if (m) return { 번호: m[1], 이름: m[2] }
  m = s.match(/^(\d{1,3}(?:[.-]\d{1,3}){1,5})[.)-]?\s+(\S.*)$/)
  if (m) return { 번호: m[1], 이름: m[2] }
  m = s.match(/^(\d{1,3}(?:[.-]\d{1,3}){0,5})([.)])\s+(\S.*)$/)      /* «1. 1구간(…)» 처럼 이름이 숫자로 시작해도 */
  if (m) return { 번호: m[1] + (m[2] === ')' ? ')' : ''), 이름: m[3] }
  m = s.match(/^(\d{1,3}(?:[.-]\d{1,3}){0,5})([.)-])\s*([^\d\s.)\-,%].*)$/)
  if (m) return { 번호: m[1] + (m[2] === ')' ? ')' : ''), 이름: m[3] }
  m = s.match(/^(\(\d{1,3}\)|\([a-zA-Z가-하]\))\s*(\S.*)$/)
  if (m) return { 번호: m[1], 이름: m[2] }
  m = s.match(/^([a-zA-Z가-하][.)])\s*(\S.*)$/)
  if (m && !(/[가-하]/.test(m[1][0]) && m[1][1] === '.' && /^\d/.test(m[2]))) return { 번호: m[1], 이름: m[2] }
  m = s.match(/^([①-⑳])\s*(\S.*)$/)
  if (m) return { 번호: m[1], 이름: m[2] }
  m = s.match(new RegExp('^([' + 로마 + ']+)\\.?\\s*(\\S.*)$'))
  if (m) return { 번호: m[1] + '.', 이름: m[2] }
  return null
}

/** 이름 다듬기 — «배 수 장 공 사» → «배수장공사» (한 글자씩 띄운 것만 붙임 · «토 및 지정공사» 는 그대로) · 끝 «*» · 괄호 앞뒤 빈칸 */
export function 이름다듬기(t) {
  let s = 글(t).replace(/\s+/g, ' ').replace(/[*＊]+$/, '').replace(/^[\s.·-]+/, '').trim()
  const 토막 = s.split(' ')
  const out = []
  for (let i = 0; i < 토막.length;) {
    if (/^[가-힣]$/.test(토막[i])) {
      let j = i
      while (j < 토막.length && /^[가-힣]$/.test(토막[j])) j++
      const 무리 = 토막.slice(i, j)
      if (무리.length >= 2 && !무리.some((x) => /^(및|외|등|의|또)$/.test(x))) out.push(무리.join(''))
      else out.push(...무리)
      i = j
    } else { out.push(토막[i]); i++ }
  }
  return out.join(' ').replace(/\s+\)/g, ')').replace(/\(\s+/g, '(').trim()
}

/* ── 줄 갈래 ───────────────────────────────────────────── */
const 합계이름 = /^[[(]?(합계|소계|계|총계|누계|총합계|합|공사비계|순공사비계|직접공사비계|계:|합:)[\])]?$|(합계|소계)$/
const 원가이름 = /^(간접노무비|산재보험료|산업재해보상보험료|고용보험료|건강보험료|국민건강보험료|연금보험료|국민연금보험료|노인장기요양보험료|퇴직공제부금비?|산업안전보건관리비|안전보건관리비|기타경비|환경보전비|건설기계대여금지급보증서?발급(금액|액|수수료)?|하도급대금지급보증서?발급?수수료|공사이행보증서?발급?수수료|건설하도급대금지급보증수수료|일반관리비|이윤|부가가치세|부가세|공급가액|총원가|순공사원가|공사원가|물가상승비|물가변동비|도급액|도급금액|총공사비|손해보험료|간접재료비|직접재료비|직접노무비|산출경비|재료비|노무비|경비|장비대|장비비|자재비|인건비|작업설\.?부산물등?\(?△?\)?)$/
const 원가인가 = (u) => 원가이름.test(u) || /(보험료|수수료|공제부금|공제부금비)$/.test(u) || /^(건설기계대여|하도급대금|공사이행보증|건설하도급|장기요양)/.test(u)
const 관급이름 = (u) => /^(도급자|관급자)?(설치)?관급(자재|공사)?(대|비|총괄)?$/.test(u.replace(/^※\.?/, '').replace(/\(.*\)$/, ''))
const 밖이름 = (u) => 관급이름(u) || /^(석면|임금채권)?(부담금|분담금)$/.test(u) || /^기타공사비$/.test(u) || /^(고재|작업부산물)/.test(u)
const 순공사비이름 = /^(순공사비|순직접공사비|직접공사비|공사비|순공사비계|직접공사비계|도급공사비?)$/

/** 시트 하나 → {줄들, 공종수, 번호씀, …} (공종 나무는 나무짓기) */
function 시트읽기(이름, g) {
  const hr = 머리찾기(g)
  if (hr < 0) return null
  const a = (g[hr] || []).map(붙), b = (g[hr + 1] || []).map(붙)
  const 아래머리 = b.some((x) => /^(단가|금액)$/.test(x))
  const 시작 = hr + (아래머리 ? 2 : 1)
  const 넓이 = Math.max(a.length, ...g.slice(시작, 시작 + 80).map((r) => (r || []).length))
  const 표본 = g.slice(시작, 시작 + 600)
  const 셈 = (j) => {
    let 빈아님 = 0, 번호 = 0, 글자 = 0
    for (const row of 표본) {
      const t = 글(row && row[j])
      if (!t) continue
      빈아님++
      if (번호풀이(t)) 번호++
      else if (/[가-힣A-Za-z]{2,}/.test(t.replace(/\s+/g, ''))) 글자++
    }
    return { 빈아님, 번호, 글자 }
  }
  const 이름후보 = []
  for (let j = 0; j < 넓이; j++) if (이름머리.test(a[j] || '')) 이름후보.push(j)
  let 이름칸 = -1, 최글 = -1
  for (const j of 이름후보) { const c = 셈(j); if (c.글자 > 최글) { 최글 = c.글자; 이름칸 = j } }
  if (이름칸 < 0 || 최글 < 2) return null
  /* «공종» 칸에 묶음 이름을 적고 «품명» 칸은 품목만인 꼴 — 품명이 빈 줄은 공종 칸 글을 이름으로 */
  let 공종글칸 = -1
  for (const j of 이름후보) { if (j === 이름칸) continue; const c = 셈(j); if (c.글자 >= 1 && c.글자 >= c.번호) { 공종글칸 = j; break } }
  const 단위칸 = a.findIndex((x) => /^단위$/.test(x))
  const 수량칸 = a.findIndex((x) => /^수량$/.test(x))
  /* 번호 칸 — 묶음 줄에만 번호가 있는 칸(품목 줄마다 같은 «공종코드» 가 붙은 숨은 칸은 아님: 단위 있는 줄에도 번호가 있거나 같은 번호가 잇달아 나오면 버림) */
  let 번호칸 = -1, 최번 = 1
  for (let j = 0; j < 넓이; j++) {
    if (j === 이름칸) continue
    if (!(코드머리.test(a[j] || '') || (!a[j] && j === 이름칸 - 1))) continue
    const c = 셈(j)
    if (!(c.번호 > 최번 && c.번호 >= c.빈아님 * 0.6)) continue
    let 잇달 = 0, 앞 = null
    for (const row of 표본) { const t = 붙(row && row[j]); if (t) { if (t === 앞) 잇달++; 앞 = t } }
    if (잇달 > c.빈아님 * 0.3) continue
    최번 = c.번호; 번호칸 = j
  }
  const 금칸 = 금액칸들(a, b, 아래머리).filter((j) => j !== 이름칸 && j !== 번호칸)
  const 금액 = (row) => {
    if (!금칸.length) return null
    let s = null
    for (const j of 금칸) { const v = 수(row[j]); if (v !== null) s = (s || 0) + v }
    return s
  }
  /* 앞 줄들에서 공사명 «공사명 : …» · «[ … ]» */
  let 공사명 = ''
  for (let r = 0; r < Math.min(hr + 1, 12) && !공사명; r++) {
    for (const c of g[r] || []) {
      const t = 글(c)
      let m = t.match(/^공\s*사\s*명\s*[:：]\s*(.{2,})$/)
      if (m) { 공사명 = m[1].replace(/\]$/, '').trim(); break }
      m = t.match(/^\[\s*([^\]]{2,}?)\s*\]?$/)
      if (m && !/합\s*계/.test(m[1])) { 공사명 = m[1].trim(); break }
    }
  }
  /* 줄 갈래 */
  const 줄들 = []
  let 원가수 = 0
  for (let r = 시작; r < g.length; r++) {
    const row = g[r] || []
    let 이름원 = 글(row[이름칸])
    if (!이름원 && 공종글칸 >= 0 && 공종글칸 !== 번호칸) { const t = 글(row[공종글칸]); if (t && !번호풀이(t)) 이름원 = t }
    const 번호원 = 번호칸 >= 0 ? 글(row[번호칸]) : ''
    if (!이름원 && !번호원) continue
    let 번 = 번호원 ? 번호풀이(번호원) : null
    let 이 = 이름원
    { const p = 이름앞번호(이름원); if (p) { const k = 번호풀이(p.번호); if (k) { if (!번) 번 = k; 이 = p.이름 } } }   /* 번호 칸이 있어도 이름 앞 번호는 뗌(«0101 ▶ 건축공사») */
    const mk = 이.match(표식앞)
    if (mk) {
      이 = 이.slice(mk[0].length); if (!번) 번 = { 꼴: 'M', 단: 0, 표: mk[1][0] }
      const p2 = 이름앞번호(이); if (p2 && 번호풀이(p2.번호)) 이 = p2.이름          /* «010101 ▶▶01.동안상가» → «동안상가» */
    }
    이 = 이름다듬기(이)
    const u = 붙(이)
    if (!u || /^\(.*\)$/.test(u) || /^[\d.,\-]+$/.test(u)) continue      /* «(총 괄 내 역 서)» 같은 제목 · 숫자만 */
    const 금 = 금액(row)
    if (원가인가(u)) {
      /* 공종 뒤 원가 덩이 — 넷째 원가 줄부터 그 아래는 안 읽음(«조달수수료» 같은 품목 줄은 세지 않음 — 관급 덩이 안에 여럿 있음) */
      if (!/수수료$/.test(u) || 원가이름.test(u)) 원가수++
      if (원가수 >= 4 && 줄들.some((x) => x.꼴 === '공종' || x.꼴 === '무번')) break
      continue
    }
    if (합계이름.test(u) && (!번 || /(합계|소계)$/.test(u))) { 줄들.push({ 꼴: '합계', 금, r }); continue }
    if (!번 && 순공사비이름.test(u)) { 줄들.push(줄들.some((x) => x.꼴 === '공종') ? { 꼴: '합계', 금, r } : { 꼴: '무번', 이름: 이, 금, r, 뿌리: true }); continue }   /* 공종 뒤 «순 공 사 비» 는 합계 줄 */
    const 단위 = 단위칸 >= 0 ? 붙(row[단위칸]) : ''
    const 수량 = 수량칸 >= 0 ? 수(row[수량칸]) : null
    const 한식 = /^(식|式|LS|L\.S\.?)$/i.test(단위) && (수량 === null || 수량 === 1)     /* 집계 · 총괄표의 공종 줄은 «1 식» */
    if (번) 줄들.push({ 꼴: '공종', 번, 이름: 이, 금, r, 원번호: 번호원 || '' })
    else if (!한식 && (단위 || (수량 !== null && 수량 !== 1 && 수량 !== 0))) 줄들.push({ 꼴: '품목', 금, r })
    else 줄들.push({ 꼴: '무번', 이름: 이, 금, r })
  }
  return { 시트: 이름, 머리: hr, 줄들, 공사명, 금칸: 금칸.length, 번호칸, 이름칸 }
}

/** 줄들 → 나무 [{이름, 금액, 적힌, 아이, 깊이, 밖, 까닭}] */
function 나무짓기(줄들) {
  const 번호있음 = 줄들.some((x) => x.꼴 === '공종')
  const 첫번 = 줄들.findIndex((x) => x.꼴 === '공종')
  /* 깊이 — 번호 꼴이 처음 나온 차례로 쌓음(같은 꼴이 다시 나오면 그 자리로 돌아감) · 1 · 1.1 · 1.1.1(· 01 · 0101) 은 단으로 ·
     «10 · 20 · 30» 처럼 열 단위로 매긴 맨 숫자(9 다음 10 이 아니면)는 따로 한 꼴 */
  const 꼴쌓 = []
  let 앞일 = null
  const 깊이 = (x) => {
    const k = x.번
    if (k.꼴 === 'M' && k.표 === '※' && 꼴쌓.length) return 꼴쌓.length - 1     /* «※. 도급자관급자재» — 앞 번호 줄과 나란히 */
    let key
    if (k.꼴 === 'M') key = 'M' + k.표
    else if (k.꼴 !== 'N') key = k.꼴
    else if (k.맨수 && k.값 >= 10 && k.값 % 10 === 0 && 앞일 !== k.값 - 1) key = 'D'
    else key = 'N' + k.단
    if (key === 'N1' && Number.isFinite(k.값)) 앞일 = k.값
    const i = 꼴쌓.indexOf(key)
    if (i >= 0) { 꼴쌓.length = i + 1; return i }
    if (key[0] === 'N') {
      const L = +key.slice(1)
      const f = 꼴쌓.findIndex((y) => y[0] === 'N' && +y.slice(1) >= L)
      if (f >= 0) 꼴쌓.length = f
    }
    꼴쌓.push(key)
    return 꼴쌓.length - 1
  }
  const 뿌리 = []
  const 쌓 = []
  const 새마디 = (x, d) => ({ 이름: x.이름, 적힌: x.금, 품목합: 0, 품목수: 0, 아이: [], 깊이: d, 밖: false, 까닭: '' })
  줄들.forEach((x, k) => {
    let d = null
    if (x.꼴 === '공종') d = 깊이(x)
    else if (x.꼴 === '무번' && (!번호있음 || k < 첫번)) d = 번호있음 || x.뿌리 ? -1 : 0
    if (d !== null) {
      while (쌓.length && 쌓[쌓.length - 1].깊이 >= d) 쌓.pop()
      const n = 새마디(x, d)
      if (쌓.length) 쌓[쌓.length - 1].아이.push(n); else 뿌리.push(n)
      쌓.push(n)
      return
    }
    const 위 = 쌓[쌓.length - 1]
    if (!위) return
    if (x.꼴 === '합계') { if ((위.적힌 === null || 위.적힌 === undefined) && x.금 !== null) 위.합계줄 = x.금; return }
    if (x.금 !== null) { 위.품목합 += x.금; 위.품목금수 = (위.품목금수 || 0) + 1 }
    위.품목수++
  })
  /* 금액: 적힌 합 → 없으면 (합계 줄 · 품목 합 + 아이 합) */
  const 셈 = (n) => {
    n.아이.forEach(셈)
    const 아이합 = n.아이.reduce((s, c) => s + (c.금액 || 0), 0)
    const 아이있음 = n.아이.some((c) => c.금액 !== null)
    if (n.적힌 !== null && n.적힌 !== undefined) n.금액 = n.적힌
    else if (n.합계줄 !== undefined) n.금액 = n.합계줄
    else if ((n.품목금수 || 0) > 0 || 아이있음) n.금액 = n.품목합 + 아이합
    else n.금액 = null
  }
  뿌리.forEach(셈)
  겹침합치기(뿌리)
  return 뿌리
}

/** 나란한 공종에 같은 이름이 또 나오면(앞 «집계» 블록 + 뒤 «내역» 블록) 하나로 — 금액이 같거나 한쪽이 비었을 때만 */
function 겹침합치기(목록) {
  const 본 = new Map()
  for (let i = 0; i < 목록.length; i++) {
    const b = 목록[i]
    const k = 붙(b.이름)
    let a = 본.get(k)
    /* 이름은 달라도(«정비사업» 집계 ↔ «정비공» 내역) 금액이 원 단위까지 같고 앞 것은 아래가 없으면 같은 공종 */
    if (!a && b.금액 > 0) a = 목록.slice(0, i).find((x) => x.금액 === b.금액 && !x.아이.length && !x.품목수 && (b.아이.length || b.품목수)) || null
    if (a && (a.금액 === null || b.금액 === null || Math.abs(a.금액 - b.금액) <= Math.max(2, Math.abs(a.금액) * 1e-5))) {
      if (a.금액 === null) { a.금액 = b.금액; a.적힌 = b.적힌 }
      if (!a.아이.length && b.아이.length) a.아이 = b.아이
      if (!a.품목수 && b.품목수) { a.품목수 = b.품목수; a.품목합 = b.품목합; a.품목금수 = b.품목금수 }
      목록.splice(i, 1); i--
      continue
    }
    if (!a) 본.set(k, b)
  }
  for (const n of 목록) 겹침합치기(n.아이)
}

/** 위 공종에 적힌 합과 안 맞는 아래 공종 — 뒤에 붙은 것(«● 합» 뒤 기타공사비) · 관급 · 별도 이름 */
function 합밖찾기(n) {
  n.아이.forEach(합밖찾기)
  const A = n.적힌
  const 안 = n.아이.filter((c) => !c.밖)
  if (!(A > 0) || 안.length < 2 || n.품목수) return
  const 금 = (c) => c.금액 || 0
  const 같 = (x) => Math.abs(x - A) <= Math.max(2, Math.abs(A) * 1e-5)
  if (같(안.reduce((s, c) => s + 금(c), 0))) return
  /* 앞에서부터 더해 맞으면 그 뒤는 밖 — 이름으로 뺀 관급까지 차례대로 더해 봄(«● 합» 에 관급이 든 꼴 · 안 든 꼴 둘 다) */
  for (const 목록 of [안, n.아이]) {
    let 누 = 0
    for (let k = 0; k < 목록.length - 1; k++) {
      누 += 금(목록[k])
      if (같(누)) { 목록.slice(k + 1).forEach((c) => { if (!c.밖) { c.밖 = true; c.까닭 = '위 합 밖' } }); return }
    }
  }
  /* 몇 개(셋까지)를 빼면 맞나 — 관급 · 별도 · 기타 이름 먼저 */
  if (안.length > 14) return
  const 합 = 안.reduce((s, c) => s + 금(c), 0)
  const 이름점 = (c) => (/관급|별도|제외|기타|부담|분담|부가/.test(붙(c.이름)) ? 1 : 0)
  const 조합 = []
  const n안 = 안.length
  for (let i = 0; i < n안; i++) {
    조합.push([i])
    for (let j = i + 1; j < n안; j++) { 조합.push([i, j]); for (let k = j + 1; k < n안; k++) 조합.push([i, j, k]) }
  }
  조합.sort((p, q) => p.length - q.length || q.reduce((s, i) => s + 이름점(안[i]), 0) - p.reduce((s, i) => s + 이름점(안[i]), 0))
  for (const c of 조합) {
    if (c.length >= n안) continue
    if (같(합 - c.reduce((s, i) => s + 금(안[i]), 0))) { c.forEach((i) => { 안[i].밖 = true; 안[i].까닭 = '위 합 밖' }); return }
  }
}

/** 나무 고르기(시트) 점수 */
const 좋은시트 = /집계|총괄|을지/
const 나쁜시트 = /일위|단가|기계경비|자재|노임|원가|예정공정|공정표|수량|산출근거|소스|견적|표지|목차|간지|INITIAL|짝짓기|검산|갑지|사유|대비|비교|실정|요율|제경비|인력|장비|품셈|관급|중량|산출서$|설계서용지\(갑\)/

function 마디들(뿌리) { const out = []; const 걷기 = (n) => { out.push(n); n.아이.forEach(걷기) }; 뿌리.forEach(걷기); return out }

/** 공종 나무 한 벌 → {위(공정표에 쓸 맨 위 공종들), 벗긴(공사 이름 마디), 뺀[], 금있음} */
function 다듬기(뿌리, 공사명 = '') {
  const 뺀 = []
  const 모두 = 마디들(뿌리)
  /* 이름으로 밖 */
  for (const n of 모두) if (!n.밖 && 밖이름(붙(n.이름))) { n.밖 = true; n.까닭 = /관급/.test(n.이름) ? '관급자재' : /고재|작업부산물/.test(n.이름) ? '공제(작업부산물 · 고재)' : '도급 밖' }
  뿌리.forEach(합밖찾기)
  const 산 = 모두.filter((n) => !n.밖)
  const 금있음 = 산.filter((n) => n.금액 > 0).length >= Math.max(1, 산.length * 0.4)
  /* 금액 있는 내역서: 0 · 음수 공종은 밖 */
  if (금있음) for (const n of 모두) if (!n.밖 && !(n.금액 > 0) && n.금액 !== null) { n.밖 = true; n.까닭 = n.금액 < 0 ? '음수(작업부산물 등)' : '금액 0' }
  if (금있음) for (const n of 모두) if (!n.밖 && n.금액 === null && !n.아이.some((c) => !c.밖 && c.금액 > 0)) { n.밖 = true; n.까닭 = '금액 없음' }
  /* 밖 마디(그 아래까지)를 떼어 냄 — 위 공종 금액이 «아래를 다 더한 것» 이었으면 뗀 만큼 다시 셈(건축공사 안의 도급자관급자재 같은) */
  const 같 = (x, y) => Math.abs(x - y) <= Math.max(2, Math.abs(y) * 1e-5)
  const 전합매기기 = (n) => { n.아이.forEach(전합매기기); n.전합 = n.아이.reduce((s, c) => s + (c.금액 || 0), 0) + (n.품목합 || 0) }
  뿌리.forEach(전합매기기)
  const 떼기 = (목록, 위밖) => 목록.filter((n) => {
    if (n.밖 && !위밖) 뺀.push({ 이름: n.이름, 금액: n.금액, 까닭: n.까닭 })
    const 전 = n.아이.length
    n.아이 = 떼기(n.아이, 위밖 || n.밖)
    if (n.아이.length !== 전) n.잃음 = true
    if (전 && !n.아이.length && !n.품목수 && !n.밖) { n.밖 = true; n.까닭 = '아래가 모두 밖' }   /* «자재구매비» 아래가 관급자재뿐 */
    return !n.밖
  })
  let 위 = 떼기(뿌리, false)
  const 고침 = (n) => {
    let 바뀜 = !!n.잃음
    for (const c of n.아이) if (고침(c)) 바뀜 = true
    if (바뀜 && n.금액 !== null && n.아이.length && 같(n.금액, n.전합)) n.금액 = n.아이.reduce((s, c) => s + (c.금액 || 0), 0) + (n.품목합 || 0)
    return 바뀜
  }
  위.forEach(고침)
  const 벗긴 = []
  for (let 번 = 0; 번 < 6; 번++) {
    if (위.length === 1 && 위[0].아이.length) { 벗긴.push(위[0]); 위 = 위[0].아이; continue }
    /* «순공사비» · 공사 이름(«2026년 …») 묶음이 다른 공종(안전관리비 등)과 나란히 있으면 그 아래를 맨 위로 */
    const k = 위.findIndex((n) => n.아이.length && (순공사비이름.test(붙(n.이름)) || (공사명 && 붙(n.이름) === 붙(공사명)) || /^\d{4}년/.test(붙(n.이름))))
    if (k < 0) break
    벗긴.push(위[k]); 위 = [...위.slice(0, k), ...위[k].아이, ...위.slice(k + 1)]
  }
  /* 아래가 하나뿐인 마디는 건너뜀(«배수장공사 › 토목공사 › 토공 · 구조물공» → «배수장공사 › 토공 · 구조물공») */
  const 외길 = (n) => { while (n.아이.length === 1 && n.아이[0].아이.length) n.아이 = n.아이[0].아이; n.아이.forEach(외길) }
  위.forEach(외길)
  /* 맨 위에 남은 «순공사비» 한 줄(아래 없음)은 합계 줄 — 다른 공종이 있으면 뺌 */
  const 합줄빼고 = 위.filter((n) => n.아이.length || !순공사비이름.test(붙(n.이름)))
  if (합줄빼고.length) 위 = 합줄빼고
  return { 위, 벗긴, 뺀, 금있음 }
}

/* ── 도급액 ─────────────────────────────────────────── */
export function 도급액찾기(책) {
  const 찾음 = []
  for (const [시트, g] of Object.entries(책)) {
    if (!g) continue
    const 원가시트 = /원가|총괄|갑지/.test(시트)
    g.forEach((row, r) => {
      if (!row) return
      row.forEach((c, j) => {
        const u = 붙(c)
        let 꼴 = null
        if (/^(도급액|도급금액|도급공사비|총도급액|도급공사금액)$/.test(u)) 꼴 = '도급'
        else if (/^(공급가액)$/.test(u)) 꼴 = '공급'
        else if (/^(부가가치세|부가세)$/.test(u)) 꼴 = '부가'
        if (!꼴) return
        const v = row.slice(j + 1).map(수).find((x) => x !== null && x > 1000)
        if (v) 찾음.push({ 시트, r, 꼴, v, 원가시트 })
      })
    })
  }
  const 도 = 찾음.filter((x) => x.꼴 === '도급').sort((p, q) => q.원가시트 - p.원가시트 || p.r - q.r)
  if (도.length) return { 금액: Math.round(도[0].v), 시트: 도[0].시트 }
  const 공 = 찾음.find((x) => x.꼴 === '공급' && x.원가시트)
  const 부 = 공 && 찾음.find((x) => x.꼴 === '부가' && x.시트 === 공.시트 && x.r > 공.r)
  if (공 && 부) return { 금액: Math.round(공.v + 부.v), 시트: 공.시트 }
  return null
}

/**
 * 내역서 → 공종 나무
 * @param 입력 readWorkbook 결과(시트 → 격자) 또는 파일 바이트(ArrayBuffer)
 * @returns {시트, 위:[{이름, 금액, 아이:[…]}], 뺀:[{이름, 금액, 까닭}], 금있음, 공사명, 도급액:{금액, 시트}|null, 말:[]}
 */
export function 공종나무읽기(입력, 파일이름 = '내역서') {
  const 책 = 입력 instanceof ArrayBuffer || ArrayBuffer.isView(입력) ? readWorkbook(입력) : 입력
  const 후보 = []
  const 말 = []
  for (const [이름, g] of Object.entries(책 || {})) {
    if (!g || !g.length) continue
    let s = null
    try { s = 시트읽기(이름, g) } catch (e) { s = null }
    if (!s) { 말.push(이름 + ': 공종 칸 없음'); continue }
    const 뿌리 = 나무짓기(s.줄들)
    const 공종수 = 마디들(뿌리).length
    if (공종수 < 1) { 말.push(이름 + ': 공종 0'); continue }
    const 다 = 다듬기(뿌리, s.공사명)
    if (다.위.every((n) => !n.아이.length && 순공사비이름.test(붙(n.이름)))) 다.위 = []
    const 쓸수 = 마디들(다.위).length
    let 점 = Math.min(쓸수, 24) / 4
    if (다.금있음) 점 += 6
    if (s.줄들.some((x) => x.꼴 === '공종')) 점 += 4
    if (좋은시트.test(이름)) 점 += 5
    else if (/내역/.test(이름)) 점 += 3
    if (나쁜시트.test(이름) && !/내역/.test(이름)) 점 -= 20
    if (쓸수 < 1) 점 -= 30
    if (쓸수 === 1) 점 -= 2          /* 공종 하나뿐인 작은 공사(«○○ 열매제거 공사») — 다른 시트가 낫으면 그것 */
    후보.push({ 이름, 점, s, 다, 쓸수 })
    말.push(이름 + ': 공종 ' + 쓸수 + (다.금있음 ? ' · 금액' : ''))
  }
  for (let k = 후보.length - 1; k >= 0; k--) if (!(후보[k].점 > 0)) 후보.splice(k, 1)
  if (!후보.length) throw new Error('내역서에서 공종(묶음) 줄을 못 찾았습니다 — 공종과 금액을 직접 적어 주십시오 (' + 말.slice(0, 4).join(' / ') + ')')
  후보.sort((p, q) => q.점 - p.점)
  const 고른 = 후보[0]
  const 도급액 = 도급액찾기(책)
  let 공사명 = 고른.s.공사명
  if (!공사명) for (const c of 후보) if (c.s.공사명) { 공사명 = c.s.공사명; break }
  if (!공사명) {
    const 벗 = 고른.다.벗긴.find((n) => !/^(순공사비|순직접공사비|직접공사비|공사비|순공사비계|도급공사비?|공사)$/.test(붙(n.이름)))
    if (벗) 공사명 = 벗.이름
  }
  공사명 = 글(공사명).replace(/\s*[-–]?\s*(\(?공고용\)?\s*)?(설계)?\s*(예산)?\s*(산출)?\s*(공)?\s*내역서.*$/, '').replace(/\s*\[?\s*(입찰용|공고용)\s*\]?\s*$/, '').trim()
  return { 시트: 고른.이름, 위: 고른.다.위, 뺀: 고른.다.뺀, 금있음: 고른.다.금있음, 공사명, 도급액, 말, 파일이름 }
}

/** 공종 나무 → 금액형 줄(1 공종 · 1.1 세부) — 세부가 너무 많으면(공종 + 세부 > 40) 공종만 */
export function 금액형줄(R) {
  const T = R.위
  const 펼칠 = (n) => n.아이.length >= 2          /* 아래가 하나뿐이면(«목동 수로암거 › 면보수») 펼치지 않음 */
  const 세부수 = T.reduce((s, n) => s + (펼칠(n) ? n.아이.length : 0), 0)
  const 세부씀 = 세부수 > 0 && T.length + 세부수 <= 40
  const out = []
  for (const n of T) {
    const 아이 = 세부씀 && 펼칠(n) ? n.아이 : []
    const 아이합 = 아이.reduce((s, c) => s + (c.금액 || 0), 0)
    const 같음 = n.금액 === null || Math.abs((n.금액 || 0) - 아이합) <= Math.max(2, Math.abs(n.금액 || 0) * 1e-5)
    out.push({ 깊이: 1, 이름: n.이름, 금액: 아이.length && 같음 ? null : n.금액 })
    for (const c of 아이) out.push({ 깊이: 2, 이름: c.이름, 금액: c.금액 })
  }
  return { 줄: out, 세부씀, 세부수 }
}

/** 공종 나무 → 막대형 줄 — 맨 위 공종(넷보다 적으면 그 아래까지 펼침 · 같은 이름은 «위 이름 · 이름») */
export function 막대형줄(R) {
  let 줄 = R.위.map((n) => ({ 이름: n.이름, 금액: n.금액 }))
  if (줄.length < 4) {
    const 펼 = []
    for (const n of R.위) {
      if (n.아이.length >= 2) for (const c of n.아이) 펼.push({ 이름: c.이름, 금액: c.금액, 위: n.이름 })
      else 펼.push({ 이름: n.이름, 금액: n.금액 })
    }
    if (펼.length > 줄.length && 펼.length <= 30) {
      const 셈 = new Map()
      for (const x of 펼) 셈.set(x.이름, (셈.get(x.이름) || 0) + 1)
      줄 = 펼.map((x) => ({ 이름: x.위 && 셈.get(x.이름) > 1 ? x.위 + ' · ' + x.이름 : x.이름, 금액: x.금액 }))
    }
  }
  return 줄
}
