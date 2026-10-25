/**
 * 🏗⚡ 골조 자동 — 구조평면도 + 부재 일람표를 넣으면 골조 산출 «공사» 를 스스로 채웁니다 (2026-09-27)
 *
 * 소장님: 「적산에서 왜 골조 물량을 찍어야 된다고 했지?. 도면만 주면 스스로 물량을 내는 거잖아」
 *         「물량은 자동으로 뽑아서 엑셀로 다운 받을 수 있게 해줘」 · 「도면을 주면 도면에 나와있는 물량은 자동으로 엑셀로 정리되게 해줘」
 *
 * ■ 하는 일 (사람이 찍던 것을 스스로)
 *   ① 일람표 — 부재 기호(G1·C1·S1·W1·F1) 둘레의 철근 글자(4-HD22 · HD10@150 · 400X700 · THK150)를 모아
 *      머리 글(상부근·하부근·늑근·단부·중앙·단변·장변·수직·수평…)로 뜻을 붙여 «배근표» 를 만듦
 *   ② 평면 — 제목(2층 구조평면도 · 지붕층 · 기초 평면도 · 2F FRAMING PLAN)으로 층을 정하고, 기호 글자마다
 *      보: 기호 옆 «나란한 두 선»(폭 = 일람표의 폭) → 기둥·걸친 보에서 끊어 한 칸씩(안목 + 받침 반폭 = 길이·좌단·우단)
 *      기둥·기초: 기호 개수 · 슬래브: 기호에서 네 방향으로 보 가운데까지(통심 단변×장변) · 벽: 두 선 사이 두께·길이
 *   ③ 층 높이 — «FL+3,600» 같은 글자로 층고, 없으면 3,300 으로 짐작(화면에 «짐작» 표시)
 *   → 결과는 lib/골조.js 의 «공사» 모양 그대로 — 셈·엑셀·골조 화면(/jeoksan/golgo)에서 그대로 열고 고칠 수 있음
 * ■ 짐작은 늘 근거와 함께(어느 도면·어느 글자·몇 mm). 못 읽은 것은 «경고» 로 모아 보여 줌 — 숨기지 않음
 * ■ 층 규칙은 골조.js 와 같음: n층 = n층 기둥·벽 + 그 위 바닥(보·슬래브). «2층 구조평면도» 의 보·슬래브·그 아래 기둥 → 1층
 * ■ 시험: node tools/시험_골조자동.mjs (가상 예시 두 가지 버릇 — 손으로 적은 답과 맞춤)
 */
import { 층높이찾기, 레벨줄채우기, 평면제목 } from './building3d.js'
import { 종류 } from './골조도면.js'
import { 새공사, 새동, 엑셀 as 골조엑셀, 정착표, 정착표규격, 배근칸 } from './골조.js'
import { 표찾기, 넣을것, 칸이름, 강도규격읽기, 정착표넣기, 강도fck읽기 } from './정착표읽기.js'
import { 도곽찾기 } from './dxfplot.js'
import { 도곽찾기3d, 박스제목들 } from './도곽3d.js'
import { 판목록, 배치판목록 } from './판펼치기.js'
import { 지시선끝 } from './지시선.js'
import { 구조물읽기 } from './구조물판.js'
import { 레벨범례, 입면경사 } from './지붕높이.js'

const 글 = (x) => String(x ?? '').trim()
const 붙 = (s) => String(s ?? '').replace(/\s+/g, '')
const 반올림 = (v, d = 0) => { const k = Math.pow(10, d); return Math.round(v * k) / k }
/** 🔗 줄마다 «도면의 어디서 읽었나» (2026-09-28 결과 ↔ 도면 오가기) — {n: 도면 이름, r: [x0,y0,x1,y1] 도면 단위} */
const 자리만들기 = (이름, r) => ({ n: 이름 || '', r: r.map((v) => 반올림(v, 1)) })

/* ───────────────────────────── 글자 뜻 */

/** 🧭 G249 이번 읽기에서 벽으로 볼 기호(벽체 일람표의 이름 열) — 골조읽기 동안만 */
let 벽허용 = null
let 데크허용 = false
/** 벽체 일람표(머리 «NAME · MEMBER · 부호» + 벽 표: 판 이름 · 표 이름에 벽 · WALL, 또는 같은 줄에 수직 · 수평 머리) 이름 열의 «…W숫자» 기호들 */
function 벽표기호(도면들) {
  const 허 = new Set()
  for (const D of 도면들) {
    for (const h of D.글자) {
      if (!역할들(h.s).has('부호')) continue
      const 판이름 = D.도곽 && D.도곽.length ? (D.판제목 || [])[D.도곽번(h.x, h.y)] || '' : ''
      const 벽 = /벽|WALL/i.test(판이름) || D.글자.some((g) => g.y > h.y && g.y - h.y < 8 * h.h && Math.abs(g.x - h.x) < 40 * h.h && /WALL|벽체|벽\s*일람/i.test(g.s)) ||
        D.글자.some((g) => Math.abs(g.y - h.y) < 2 * h.h && Math.abs(g.x - h.x) < 60 * h.h && (역할들(g.s).has('수직') || 역할들(g.s).has('수평')))
      if (!벽) continue
      for (const g of D.글자) {
        if (g.y >= h.y || h.y - g.y > 200 * h.h || Math.abs(g.x - h.x) > Math.max(g.w, h.w) / 2 + 3 * h.h) continue
        if (D.도곽 && D.도곽.length && D.도곽번(g.x, g.y) !== D.도곽번(h.x, h.y)) continue
        for (const p of 붙(g.s).toUpperCase().split(/[,·/&]/)) if (/^[A-Z]{1,4}\d{1,4}[A-Z]?$/.test(p) && /W\d/.test(p)) 허.add(p)
      }
    }
  }
  return 허
}
/** 부재 기호 — 「G1」「2G1」「RG1」「B1C2」「TG1A」 → {기호, 몸(층 표시 뗀 것), 종류:'보'|'기둥'|'슬라브'|'벽'|'기초'} */
export function 기호풀이(s) {
  /* 🛠 G118 — 「(G1)」「G-1」 → G1 */
  let m0
  let t = 붙(s).toUpperCase()
  if ((m0 = /^[(\[]([A-Z0-9]{2,6})[)\]]$/.exec(t))) t = m0[1]
  if ((m0 = /^([A-Z]{1,3})-(\d{1,2}[A-Z]?)$/.exec(t))) t = m0[1] + m0[2]
  /* 🧭 G249 벽체 일람표(NAME · MEMBER 열)에 적힌 벽 기호는 창호 글자(CW 커튼월 · AW)와 겹쳐도 벽 — 현장 A «CW1 ~ CW10»(코어 벽) · «RaW1» · «W200»
       (일람표에 없으면 예전처럼 창호로 봄 — 건축 평면의 CW1 커튼월을 벽으로 세지 않게) */
  /* 🧭 G241 «B1F» · «B2F» 는 지하 층 이름(현장 A 벽체 일람표 «B1F» 줄 머리 — 보 B1 으로 읽어 헛 정의 31개) */
  if (/^B\d{1,2}F$/.test(t)) return null
  /* 🧭 G405 «RaWG1» · «RaS1» · «RaW1»(경사로 Ramp — 소문자 a) 는 «Ra» 까지 몸 — 예전엔 R(지붕 층) + AWG1 로 풀어 지하 경사로 보가 «FTAWG1» 같은 이름이 됐음(현장 Y) */
  {
    const 원 = 붙(s).replace(/^[(\[]([^)\]]+)[)\]]$/, '$1')
    const mRa = /^(B\d{1,2}|\d{1,2})?(Ra[A-Za-z]{1,2})(\d{1,2}[A-Za-z]?)$/.exec(원)
    const 끝Ra = mRa ? mRa[2].slice(-1).toUpperCase() : ''
    const kRa = { G: '보', B: '보', C: '기둥', S: '슬라브', W: '벽', F: '기초' }[끝Ra]
    if (mRa && kRa) { const 앞 = (mRa[1] || '').toUpperCase(), 몸 = mRa[2].toUpperCase() + mRa[3].toUpperCase(); return { 기호: 앞 + 몸, 몸, 층표: 앞, 종류: kRa } }
  }
  /* 🧭 G249 보통 기호 풀이가 안 되는(창호 글자 CW · AW 와 겹치거나 숫자가 셋 넘는 W200) 벽체 일람표 이름만 벽 — 풀리는 기호(RW1 = 지붕 층 W1)는 그대로 */
  const 벽만 = () => (벽허용 && 벽허용.has(t) ? { 기호: t, 몸: t, 층표: '', 종류: '벽' } : null)
  const m = /^(B\d{1,2}|\d{1,2}|R|PH\d?|RF)?([A-Z]{1,3})(\d{1,2}[A-Z]?)$/.exec(t)
  if (!m) return 벽만()
  let 앞 = m[1] || '', 글자 = m[2]
  const 끝 = 글자[글자.length - 1]
  /* 🧭 G250 «DS1» = 데크 슬래브 — 도면 묶음에 데크(DECK · 데크) 글이 있으면 층 표시 없이도 슬래브(현장 B «DS1 · DS2» 데크 표시) */
  if (/^(X|Y|D|H|HD|SD|SHD|UHD|EL|FL|GL|SL|KS|NO|STA|PL|TH|THK|L|R|M|MM|CM|T|A|AW|WD|SW|PW|AD|SD|FD|WW|CW|DS)$/.test(글자) && !(글자 === 'DS' && (앞 || 데크허용))) {
    // 창호(AW·WD)·철근(D·HD)·통심선(X·Y)·높이(EL·FL) 들 — 부재 아님
    return 벽만()
  }
  let k = null
  if (끝 === 'G' || 끝 === 'B') k = '보'
  else if (끝 === 'C') k = '기둥'
  else if (끝 === 'S') k = '슬라브'
  else if (끝 === 'W') k = '벽'
  else if (끝 === 'F') k = '기초'
  if (!k) return null
  return { 기호: t, 몸: 글자 + m[3], 층표: 앞, 종류: k }
}
/** 🛠 G118 — 평면의 기호 글자: 크기를 붙여 적은 꼴(「G1(400X700)」「G1 400X700」)도 기호로 (일람표 칸은 기호풀이 그대로) */
export function 평면기호(s) {
  const r = 기호풀이(s)
  if (r) return r
  const m = /^(\s*)([A-Za-z0-9]{2,6})\s*[(\[]?\s*\d{3,4}\s*[Xx×*]\s*\d{3,4}(?:\s*[Xx×*]\s*\d{3,4})?\s*[)\]]?\s*$/.exec(String(s ?? ''))
  if (!m) {
    /* 🧭 G299 뒤 괄호 주기 — «G1(상, 하)»(위 · 아래 두 보) · «G3A(ROOF, PHF 동일보), 상부덧살H=Var»(두 평면에 같이 그린 한 보 — 앞에 적힌 평면에서만 셈).
         현장 4 지붕 평면: 못 읽어 경사 지붕 단차의 보가 어느 평면에서도 안 셈해졌음 */
    const m2 = /^(\s*)([A-Za-z0-9]{2,6})\s*[(（]([^)）]{1,30})[)）]\s*(?:[,·]\s*[^,·]{0,30})?$/.exec(String(s ?? ''))
    if (!m2 || !/상|하|동일|ROOF|PHF|지붕|옥탑|역보/i.test(m2[3])) return null
    const r3 = 기호풀이(m2[2])
    if (!r3 || r3.종류 !== '보') return null
    /* 🧭 G405 «WG1(상부)» · «RaWG1(하부)» · «B8(역보)» · «WG1(상부역보)» — 그 평면의 보(상부 · 역보) · 한 층 아래 바닥의 보(하부).
         현장 Y 지하1층 구조평면도: 못 읽어 이 보 8개가 어느 층에도 안 셈해졌음(보 일람표 «(1) B8 400×600» · «(B1) RaWG1 300×600» 이 있는데도) */
    const 자리글 = 붙(m2[3])
    if (자리글 && /^(상부|하부|상단|하단)?(역보)?$/.test(자리글)) return { ...r3, 앞: m2[1].length, 길이: m2[2].length, 자리: /^하/.test(자리글) ? '하부' : '상부', ...(/역보/.test(자리글) ? { 역보: true } : {}) }
    const 동일 = /동일/.test(m2[3]) ? m2[3].split(/[,\s·]+/).map((w) => w.trim()).filter((w) => w && !/동일/.test(w)) : null
    const 위아래 = /^\s*상\s*[,·/]\s*하\s*$/.test(m2[3])
    if (!동일 && !위아래) return null
    return { ...r3, 앞: m2[1].length, 길이: m2[2].length, ...(동일 && 동일.length ? { 동일 } : {}), ...(위아래 ? { 위아래: true } : {}) }
  }
  const r2 = 기호풀이(m[2])
  return r2 ? { ...r2, 앞: m[1].length, 길이: m[2].length } : null     // 앞 · 길이 — 글자 안에서 기호가 차지한 자리(가운데를 기호 쪽으로)
}
/** 🧭 G299 «(ROOF, PHF 동일보)» 의 첫 평면 이름이 이 평면 제목인가 — ROOF · RF · 지붕 ↔ 지붕 · ROOF 제목 · PH(F) ↔ PH · 옥탑 · 그 밖은 글이 제목에 들었나 */
export function 동일첫판(w, 제목) {
  const W = String(w || '').toUpperCase(), T = String(제목 || '').toUpperCase().replace(/\s+/g, '')
  if (/^(ROOF|RF|R|지붕)$/.test(W)) return /ROOF|지붕|^RF|^R구조/.test(T) && !/PH|옥탑/.test(T)
  if (/^PH/.test(W) || /옥탑/.test(W)) return /PH|옥탑/.test(T)
  return T.includes(W)
}
/** 🧭 G246 동(구조물) 꼬리 — 판 이름 끝 «[미생물 처리장]» · «[쓰레기 처리장]» → 그 구조물 이름(없으면 '').
    한 도면 묶음에 본 건물과 딴 구조물(처리장 · 관리동)이 같이 있으면 같은 기호(C1)가 서로 다른 부재 — 현장 C 건축: 처리장의 «C1 ㅁ-100x100» 철골이
    본 건물 철근콘크리트 기둥 C1 · C2 56개를 철골로 보고 다 뺐음 */
export const 동꼬리 = (s) => { const m = /[\[［【]\s*([^\]］】]+?)\s*[\]］】]\s*$/.exec(String(s || '').trim()); return m ? m[1].replace(/\s+/g, '') : '' }
/** 글자 폭 짐작 — 준비() 와 같은 셈(한글 1 · 빈칸 0.5 · 나머지 0.75 × 높이) */
const 폭짐작 = (s, h) => { let w = 0; for (const ch of s) w += /[ㄱ-힝]/.test(ch) ? 1.0 : (ch === ' ' ? 0.5 : 0.75); return w * h }
/** 한 글자 칸에 기호가 여럿 — 「G1, G2」「2G1·3G1」 */
function 기호들(s) {
  const t = 붙(s)            // 🧭 G405 글자 꼴 그대로 기호풀이로(«RaWG1» 의 소문자 a = 경사로 — 대문자로 바꾸면 지붕 층 R + AWG1)
  if (!t || t.length > 30) return []
  const parts = t.split(/[,·/&]|(?:\bAND\b)/i).filter(Boolean)
  const out = []
  for (const p0 of parts) {
    const p = p0.toUpperCase()
    /* 🧭 G256 층 범위가 붙은 기호 «2~1B1» = 2B1 · 1B1 (현장 B 구조평면 BEAM LIST 범례 «2~1B1,2~1B1A,1B1B | 400X700») —
         못 읽으면 그 줄이 표에서 빠져 그 줄 크기(400X700)를 위 줄 «B0 | 200X600» 이 두 줄 칸으로 가져갔음(B0 → 400 × 700) */
    const rm = /^(B?\d{1,2})[~∼](B?\d{1,2})([A-Z]{1,3}\d{1,2}[A-Z]?)$/.exec(p)
    if (rm) {
      const 펼 = 층펼치기(rm[1], rm[2])
      if (!펼) return []
      for (const f of 펼) { const r = 기호풀이(f + rm[3]); if (!r) return []; out.push(r) }
      continue
    }
    const r = 기호풀이(p0); if (!r) return []; out.push(r)
  }
  return out
}
/** 🧭 G256 «2~1» · «B1~2» 층 범위 → ['1','2'] · ['B1','1','2'] (숫자 · 지하 층만 · 서른 층 넘으면 null) */
function 층펼치기(a, b) {
  const 수 = (x) => (/^B(\d+)$/.test(x) ? -+x.slice(1) : +x)
  let p = 수(a), q = 수(b)
  if (!(Number.isFinite(p) && Number.isFinite(q)) || p === 0 || q === 0) return null
  if (p > q) [p, q] = [q, p]
  if (q - p > 30) return null
  const out = []
  for (let i = p; i <= q; i++) if (i !== 0) out.push(i < 0 ? 'B' + -i : String(i))
  return out
}

/** 층 이름 하나 — 「1F」「1층」「B1F」「지하1층」「R」「RF」「옥상」「PH」「PHR」「옥상지붕」 → '1'·'B1'·'R'·'PR' (모르면 null) */
export function 층말(t0) {
  const t = 붙(t0).toUpperCase().replace(/층$/, '')
  if (!t) return null
  if (/^(PHR|PR|PRF|옥상지붕|옥탑지붕|PH지붕)$/.test(t)) return 'PR'
  if (/^(R|RF|RFL|ROOF|옥상|지붕|PH|PHF|옥탑)$/.test(t)) return 'R'
  let m
  if ((m = /^(?:지하|B)(\d{1,2})F?L?$/.exec(t))) return 'B' + +m[1]
  if ((m = /^(?:지상)?(\d{1,2})F?L?$/.exec(t))) return String(+m[1])
  if (t === 'FT' || t === '기초') return 'FT'
  return null
}
/** 범위 글 — 「ALL」「전층」 → {전체} · 「B1F ~ 2F」「1~PHR」「2-4」 → {a, b} · 「3F」「R」 → {목록:[..]} · 「B1,1」 → {목록} · 모르면 null */
export function 범위풀이(t0) {
  const t = 붙(t0).toUpperCase().replace(/[()（）]/g, '')
  if (!t) return null
  if (/^(ALL|전층|공통|모든층|TYP|TYPICAL|기준층)$/.test(t)) return { 전체: true }
  let m
  if ((m = /^([^~∼\-]+)[~∼\-]([^~∼\-]+)$/.exec(t))) { const a = 층말(m[1]), b = 층말(m[2]); if (a && b) return { a, b } }
  const 조각 = t.split(/[,·/]/).filter(Boolean)
  const 목록 = 조각.map(층말)
  if (목록.length && 목록.every(Boolean)) return { 목록 }
  return null
}
/** 일람표의 기호 칸 — 「(R) G1」「(ALL) WG1」「(1) WG2」「1~PHR S1」「C1, C4」「B1, B2, B3」 → {기호들, 범위} */
export function 기호칸(s) {
  /* 🧭 G241 철골 목록의 «SB1(SS275)» · «SG1(SM275)» — 뒤의 강재 이름은 떼고 기호로(현장 B STEEL LIST: 떼지 않으면 SB1 을 몰라 그 «H-200X100X5.5X8» 이 옆 판 C1 것이 됐었음) */
  const t = 글(s).replace(/\s*[(（](?:SS|SM|SN|SHN|SMA|STK|STKR|SPSR|SWS|SPHC|SD)\s*\d{3}[A-Z]{0,2}[)）]$/i, '')
    /* 🧭 G262 «W3(미표기벽체)» — 뒤의 «(미표기 …)» 주기는 떼고 기호로(현장 B S-401 벽 일람: 떼지 않으면 W3 · W4 줄을 못 읽어 철근을 «만든» 값으로 빌렸음) */
    .replace(/\s*[(（]\s*미\s*표기[^)）]{0,12}[)）]$/, '')
  /* 🧭 G265 «BW1 (THK=300mm)» · «BW2, BW3 (THK=300mm)» — 뒤의 두께는 떼고 기호로 · 두께는 따로(현장 A S-611 지하외벽 일람: 떼지 않으면 기호를 몰라 BW1 ~ 3 · DW1 을 «만든» 값으로 빌렸음) */
  let 두께0 = null
  const t2 = t.replace(/\s*[(（]\s*(?:THK|T)\s*[=.:]?\s*(\d{2,4})\s*(?:MM)?\s*[)）]$/i, (a, n) => { 두께0 = +n; return '' })
  return 기호칸몸(t2, 두께0)
}
function 기호칸몸(t, 두께0) {
  if (!t || t.length > 40) return null
  let 범위 = null, 몸글 = t, m
  if ((m = /^[(（]([^)）]{1,14})[)）]\s*(.+)$/.exec(t))) { 범위 = 범위풀이(m[1]); if (!범위) return null; 몸글 = m[2] }
  else if ((m = /^(\S+?)\s+(\S.*)$/.exec(t))) { const r = 범위풀이(m[1]); if (r && (r.a || r.전체)) { 범위 = r; 몸글 = m[2] } }
  const 기 = 기호들(몸글)
  if (!기.length) return null
  return { 기호들: 기, 범위: 범위 && 범위.전체 ? null : 범위, ...(두께0 ? { 두께: 두께0 } : {}) }
}

const RE개수 = /(\d{1,2})\s*-\s*[A-Z]{0,3}D(\d{2})(?!\d)/g
const RE간격 = /[A-Z]{0,3}D(\d{2})(?:\s*\+\s*(?:[A-Z]{0,3}D)?(\d{2}))?\s*-?\s*@\s*(\d{2,4})/g      // 🛠 G118 「HD10-@150」 도 · 🧭 G265 「HD16+19 @100」(뒤 굵기의 D 없이 — 현장 B RW2 밖 면 격배근)
const RE크기 = /(\d{1,2},\d{3}|\d{3,4})\s*[X×x*]\s*(\d{1,2},\d{3}|\d{3,4})(?:\s*[X×x*]\s*(\d{1,2},\d{3}|\d{3,4}))?/
const RE두께 = /(?:THK|THICK|T\s*=|(?<![×X*]\s?)D\s*=|H\s*=|두께)\s*[=:]?\s*(\d{2,4})|(\d{2,4})\s*THK/i     // 🛠 G118 「B×D=400×700」 의 D= 는 두께 아님
const RE지름 = /[ØøΦφ∅⌀]\s*(\d{3,4})|%%C\s*(\d{3,4})|^\s*D\s*(\d{3,4})\s*$/i      // 🧭 G263 작은 «ø»(U+00F8) · «φ» · «⌀» 도 지름(현장 B COLUMN LIST «C3 ø500» — 사각 500 × 500 으로 읽었음)
const 철규 = (n) => { const d = 'D' + n; return ['D10', 'D13', 'D16', 'D19', 'D22', 'D25', 'D29', 'D32', 'D35', 'D38', 'D41', 'D51'].includes(d) ? d : '' }

/** 글자 한 칸의 «값 토막» — [{k:'개수',n,d} | {k:'간격',d,d2,s,글} | {k:'크기',a,b,c} | {k:'두께',t} | {k:'지름',t}] */
/* 🧭 G250 «머리-숫자» 꼴은 뒤에 «X 숫자» 가 있어야 철골(H-400X200 · C-100X50 · ㅁ-125X125) — 도면 번호 «C-104» 를 ㄷ형강으로 보지 않게 */
const RE철골 = /^\s*(H|I|C|L|ㄷ|ㅁ|□|■|○|◎|Ø|Φ|P|RHS|SHS|BOX|TUBE|PIPE|CT|SQ|LGS|Z)\s*[-–]\s*\d+(\.\d+)?\s*[X×*]\s*\d|\d\s*[X×*]\s*\d+(\.\d+)?\s*T\b|^H\s*\d{3}\s*[X×*]/i
export function 토막들(s) {
  const u = String(s ?? '').toUpperCase().replace(/[−–—]/g, '-')
    /* 🛠 G118 — 「B400×D700」 → 400×700 */
    .replace(/\bB\s*=?\s*(\d{3,4})\s*([X×*])\s*[DH]\s*=?\s*(\d{3,4})/, '$1$2$3')
    /* 🧭 G241 「700Wx1000H」 → 700×1000 (현장 C · D 토목 보 평면) */
    .replace(/(\d{3,4})\s*W\s*([X×*])\s*(\d{3,4})\s*H\b/, '$1$2$3')
  // 철골 단면(H-400X200X8X13 · ㅁ-125X125X5t · C-100X50X20X2.3T) — 철근콘크리트 값으로 읽지 않음
  if (RE철골.test(u) && !/[A-Z]{0,3}D\d{2}\s*@|\d\s*-\s*[A-Z]{0,3}D\d{2}/.test(u)) return [{ k: '철골', 글: 글(s) }]
  const out = []
  let m
  RE간격.lastIndex = 0
  const 가린 = u.replace(RE간격, (all, a, b, sp) => {
    const d = 철규(a), d2 = b ? 철규(b) : ''
    if (d && (!b || d2)) out.push({ k: '간격', d, d2, s: +sp, 글: d + (d2 ? '+' + d2 : '') + '@' + sp })
    return ' '.repeat(all.length)
  })
  RE개수.lastIndex = 0
  while ((m = RE개수.exec(가린))) { const d = 철규(m[2]); if (d && +m[1] > 0) out.push({ k: '개수', n: +m[1], d, 글: m[1] + '-' + d }) }
  // 「HD13-2EA」「D22×4EA」 처럼 개수를 뒤에 적은 꼴
  const RE개수뒤 = /[A-Z]{0,3}D(\d{2})\s*[-×X*]\s*(\d{1,2})\s*(?:EA|개|본)/g
  while ((m = RE개수뒤.exec(가린))) { const d = 철규(m[1]); if (d && +m[2] > 0 && !out.some((o) => o.k === '개수' && o.d === d && o.n === +m[2])) out.push({ k: '개수', n: +m[2], d, 글: m[2] + '-' + d }) }
  /* 🛠 G118 — 「4EA-HD22」 · 칸 전체가 「HD22-4」 */
  const RE개수앞 = /(\d{1,2})\s*(?:EA|개|본)\s*-\s*[A-Z]{0,3}D(\d{2})(?!\d)/g
  while ((m = RE개수앞.exec(가린))) { const d = 철규(m[2]); if (d && +m[1] > 0 && !out.some((o) => o.k === '개수' && o.d === d && o.n === +m[1])) out.push({ k: '개수', n: +m[1], d, 글: m[1] + '-' + d }) }
  if (!out.some((o) => o.k === '개수') && (m = /^\s*[A-Z]{0,3}D(\d{2})\s*-\s*(\d{1,2})\s*$/.exec(가린))) { const d = 철규(m[1]); if (d && +m[2] > 0) out.push({ k: '개수', n: +m[2], d, 글: m[2] + '-' + d }) }
  /* 🧭 G241 종이 크기 «A3(420X297mm)»(현장 B 표제란 — 옆 기둥 C3 이 420×297 이 됐었음) 는 부재 크기가 아님 */
  const 종이 = (a, b) => [[1189, 841], [841, 594], [594, 420], [420, 297], [297, 210]].some(([p, q]) => (a === p && b === q) || (a === q && b === p))
  if ((m = RE크기.exec(u))) { const n = (x) => +String(x).replace(/,/g, ''); if (!종이(n(m[1]), n(m[2])) || m[3]) out.push({ k: '크기', a: n(m[1]), b: n(m[2]), c: m[3] ? n(m[3]) : null }) }
  /* 🧭 G405 «200x건축치수» — 폭만 구조 도면 · 춤은 건축 도면(창호 · 단면)에 따름(현장 Y 구조평면도 범례 LB1 · LB2). 춤은 빈칸(짐작 안 함) · 까닭 글 */
  else if ((m = /^\s*(\d{3,4})\s*[X×*]\s*건축\s*치수\s*$/.exec(u))) out.push({ k: '크기', a: +m[1], b: null, c: null, 춤글: '건축치수' })
  if ((m = RE두께.exec(u))) out.push({ k: '두께', t: +(m[1] || m[2]) })
  if ((m = RE지름.exec(u))) out.push({ k: '지름', t: +(m[1] || m[2] || m[3]) })
  return out
}

/** 머리 글(역할) — 한 칸에 여럿일 수 있음(「단변 상부」) */
export function 역할들(s) {
  /* 🧭 G241 끝의 마침표(«THK.» · «WALL NO.») 는 떼고 봄 */
  const t = 붙(s).toUpperCase().replace(/[()（）\[\]]/g, '').replace(/\.+$/, '')
  const r = new Set()
  if (!t || t.length > 16) return r
  if (/단변|SHORT|X방향|X-DIR|주근방향/.test(t)) r.add('단변')
  if (/장변|LONG|Y방향|Y-DIR|배력/.test(t)) r.add('장변')
  if (/상부|상단|TOP|UPPER/.test(t)) r.add('상')
  if (/하부|하단|BOTTOM|LOWER/.test(t) || /BOT(?!H)/.test(t)) r.add('하')      // 🧭 G241 «BOTH.»(양단) 는 하부 아님 — 현장 A RC보 일람표
  if (/늑근|STIRR|스터럽|전단근/.test(t)) r.add('늑')
  if (/띠철근|띠근|대근|HOOP|TIE/.test(t)) r.add('대')
  if (!r.has('상') && !r.has('하') && /^(주근|주철근|MAIN|수직주근)/.test(t)) r.add('주')
  if (/^(복부근|부근|SKIN|WEB|측면근)/.test(t)) r.add('부')
  if (/단부|END|EXT|외단|양단|^INT|내단|EDGE|BOTH/.test(t)) r.add('단부')
  /* 🧭 G268 «Conti · Disconti»(연속단 · 불연속단 — 현장 B S-401 2B4 · RB1 …: 칸이 셋 «Conti | CENTER | Disconti») 도 단부 · 어느 끝인지 */
  if (/^DISCONT|불연속/.test(t)) { r.add('단부'); r.add('불연속') } else if (/^CONT|^연속/.test(t)) { r.add('단부'); r.add('연속') }
  if (/중앙|CEN|MID|중간부/.test(t)) r.add('중앙')
  if (/수직|^VERT|^V$|세로근/.test(t)) r.add('수직')
  if (/수평|^HORI|^H$|가로근/.test(t)) r.add('수평')
  if (/^(SIZE|B[×X*]D|BXD|단면|크기|규격|치수|단면크기)$/.test(t)) r.add('크기')
  if (/^(두께|THK|THICK|THICKNESS|T)(MM)?$/.test(t)) r.add('두께')
  if (/^(부호|기호|SYMBOL|MARK|NAME|부재|부재명|MEMBER|MEMBERS)$/.test(t) || /^(WALL|BEAM|COLUMN|COL|SLAB|GIRDER|FOOTING|MEMBER|MARK)NO$/.test(t)) r.add('부호')
  if (/^(층|FLOOR|LEVEL|STORY|적용층|해당층)$/.test(t)) r.add('층')
  if (/^(위치|구분|POSITION|LOC)$/.test(t)) r.add('위치')
  return r
}

/** 층 이름 차례 (B3 < B2 < B1 < FT? … ) — FT 는 맨 아래 */
function 층값(f) {
  if (f === 'FT') return -1000
  if (/^B\d+$/.test(f)) return -+f.slice(1)
  if (/^\d+$/.test(f)) return +f
  /* 🧭 G271 PH(번호 옥탑 평면 «PHF-2» — 옥탑 지붕 · 천창 바닥)는 옥상(R) 위 · 옥탑 위 지붕(PR) 아래 — 예전 900(R 아래)은 쓰인 곳이 없었음 */
  if (/^PH\d*$/.test(f)) return 1050 + (+f.slice(2) || 0)
  if (f === 'R') return 1000
  if (f === 'PR') return 1100
  return 0
}
const 층차례 = (a, b) => 층값(a) - 층값(b)

/** 평면 제목 → 바닥 높이 이름들 ['2'] · ['3','4','5'] · ['R'] · ['FT'] · null(평면 제목 아님) */
export function 제목층(s) {
  const t = 붙(s).toUpperCase()
  /* 🧭 G237 «2층 구조 확대평면도 -3»(현장 B S-201) — 띄어 쓴 «구조 확대평면» 도 구조평면 */
  if (!/(구조평면|구조확대평면|확대구조평면|골조평면|보평면|지중보|기초평면|기초배치|FRAMING|STRUCTURALPLAN|STR\.?PLAN|BASEPLAN|FOUNDATIONPLAN|FOOTINGPLAN|BEAMPLAN|GIRDERPLAN|TIEBEAM|GRADEBEAM|슬[래라]브평면|구조도$|바닥구조|주심도|기둥배치|기둥평면|COLUMNPLAN|COLUMNLAYOUT)/.test(t)) return null
  if (/일람|LIST|SCHEDULE|상세|DETAIL|단면|SECTION|배근도/.test(t)) return null
  if (/기초|FOUNDATION|FOOTING|BASEPLAN|매트/.test(t)) return ['FT']
  /* 🧭 G271 번호 붙은 옥탑 평면 — «PHF-1»(옥탑 바닥 = 옥상 R) · «PHF-2»(옥탑 위 · 천창 바닥 = PH) · «옥탑1층» · «PH2층».
       예전엔 «PHF-2 …(지붕 천창 LEVEL)» 의 «지붕» 때문에 셋 다 R 로 풀려 옥상 위 기둥 · 벽(현장 B PHF-1 · PHF-2 평면)이 2층 같은 자리와 겹쳐 빠졌음 */
  { const n = /^(?:PHF?|옥탑)-?([12])(?![0-9])/.exec(t); if (n) return [n[1] === '1' ? 'R' : 'PH'] }
  if (/(옥상|옥탑|PH|PENT)지붕|PHR|(PH|PENT\w*)ROOF/.test(t)) return ['PR']
  if (/지붕|옥상|ROOF|^RF|R층/.test(t)) return ['R']
  if (/옥탑|PENT|^PH\d?(층|F)|PH층/.test(t)) return ['R']
  let m
  /* 🛠 G118 — 「2,3층 구조평면도」「2·4층」 → 여러 층 · 「2ND FLOOR FRAMING PLAN」 */
  if ((m = /^((?:지하)?\d{1,2}(?:층|F)?(?:[,·](?:지하)?\d{1,2}(?:층|F)?)+)(?:층|F)?/.exec(t))) {
    const 들 = m[1].split(/[,·]/).map((x) => /지하/.test(x) ? 'B' + +x.replace(/\D/g, '') : String(+x.replace(/\D/g, '')))
    if (들.length >= 2 && 들.every((x) => x !== 'NaN' && x !== 'B0' && x !== '0')) return 들
  }
  if ((m = /(\d{1,2})(?:ST|ND|RD|TH)FLOOR/.exec(t))) return [String(+m[1])]
  if ((m = /(지하)?(\d{1,2})(?:층|F)?[~∼\-](지하)?(\d{1,2})(?:층|F)/.exec(t))) {
    const a = +m[2], b = +m[4], 지 = !!(m[1] || m[3])
    const out = []
    for (let k = Math.min(a, b); k <= Math.max(a, b); k++) out.push(지 ? 'B' + k : String(k))
    return out
  }
  if ((m = /지하(\d{1,2})층/.exec(t)) || (m = /^B(\d{1,2})F?/.exec(t))) return ['B' + m[1]]
  if ((m = /(\d{1,2})(?:층|F\b|F(?=[A-Z가-힣])|FL)/.exec(t))) return [String(+m[1])]
  /* 🧭 G241 층이 안 적힌 «BEAM PLAN» · «지중보 평면» — 1층 바닥(기초 위 지중보 · 현장 C · D 토목 통합본) */
  if (/^(지중보|BEAMPLAN|GIRDERPLAN|TIEBEAM|GRADEBEAM)/.test(t) || /지중보/.test(t)) return ['1']
  return null
}
/** 🧭 G266 기초 평면 제목이 받치는 층 — «1층기초구조평면도» → '1' · «지하1층 기초 구조 확대평면도» → 'B1' · 층이 없으면 null */
export function 기초받침층(s) {
  const t = 붙(s).toUpperCase()
  let m
  if ((m = /지하(\d{1,2})층기초/.exec(t)) || (m = /^B(\d{1,2})F?기초/.exec(t))) return 'B' + +m[1]
  if ((m = /(?:^|[^하\d])(\d{1,2})층기초/.exec(t))) return String(+m[1])
  return null
}
/** 제목이 «기둥 배치(주심도)» 인가 — 이 평면의 기둥은 «그 층» 기둥(구조평면도는 «그 바닥» 이라 한 층 아래) */
export function 기둥제목(s) { return /(주심도|기둥배치|기둥평면|COLUMNPLAN|COLUMNLAYOUT)/.test(붙(s).toUpperCase()) }
/** 층 이름 글자 — 「지붕층」「RF」「2층」「2F」「B1」「지하1층」「1층바닥」 → 'R'·'2'·'B1' */
function 층글(s) {
  const t = 붙(s).toUpperCase()
  if (!t || t.length > 10) return null
  if (/^(지붕층?|옥상층?|RF|ROOF|R|RFL|R층)$/.test(t)) return 'R'
  if (/^(옥탑층?|PH|PHF|PH\d)$/.test(t)) return 'PH'
  let m
  if ((m = /^지하(\d{1,2})층?$/.exec(t)) || (m = /^B(\d{1,2})F?L?$/.exec(t))) return 'B' + m[1]
  if ((m = /^(\d{1,2})(?:층|F|FL|층바닥)$/.exec(t))) return String(+m[1])
  return null
}
/** 높이 글자 — 「FL+3,600」「EL+3.600」「SL:+3600」「FL±0」「2FL+3,600」 → {층?, v(mm)} */
function 높이글(s) {
  const t = 붙(s).toUpperCase().replace(/[−–]/g, '-')
  const m = /^(?:(\d{1,2}|B\d|R|RF|ROOF|지붕층?|\d{1,2}층)\s*)?(?:FL|SL|EL|F\.L\.?|S\.L\.?)\s*[:=]?\s*(±|\+|-)?\s*(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?)$/.exec(t)
  if (!m) return null
  let v = +m[3].replace(/,/g, '')
  if (/\./.test(m[3]) && v < 300 && !/,/.test(m[3])) v *= 1000
  if (m[2] === '-') v = -v
  /* 🧭 G237 «1FL +4,100» 은 «1층 바닥에서 +4,100»(현장 B 단면 · 골조입면 — 그 위 «2nd FL» 의 높이) — 1층 높이가 아님 */
  if (m[1] === '1' && m[2] && v !== 0) return { 층: null, v, 일층기준: true }
  const 층 = m[1] ? 층글(m[1].replace(/층$/, '') + (/^\d/.test(m[1]) ? 'F' : '')) || 층글(m[1]) : null
  return { 층, v }
}

/* ───────────────────────────── 도면 준비 (mm 로) */

const 주석층 = /(치수|DIM|TEXT|TXT|문자|글자|도곽|TITLE|BORDER|FRAME|FORM|DEFPOINTS|VIEWPORT|VPORT|GRID|통심|축선|CEN(TER)?\b|중심선|HATCH|해치|PATTERN|TABLE|TBL|LEADER|인출|SYMB|심볼|NOTE|범례|LEGEND|LOGO|STAMP|결재)/i

function 준비(모델, k, 번) {
  const { E, Q, P, T, layers } = 모델
  const 층주석 = layers.map((L) => 주석층.test(L.name || ''))
  const 보강층 = layers.map((L) => /보강|추가|ADD|REINF/i.test(L.name || ''))
  // 선분
  const sx0 = [], sy0 = [], sx1 = [], sy1 = [], sly = [], se = []
  /* 🏭 G294 토막의 선 꼴(골조도면 E.lt) — 0 실선 · 1 도형에 따로 준 끊어진 선(일점쇄선 · 숨은선 — 플랜트 기초 읽기가 윤곽에서 뺌) · 2 층 꼴이 끊어진 선(씀). 다른 셈은 안 씀 */
  const slt = []
  const Elt = E.lt || null
  const 닫힌 = [], 주석가로 = [], 주석세로 = []
  /* 🧭 G254 지시선(LEADER · MLEADER) 선분은 따로(구조 선 찾기에 안 섞음) — 글 → 지시선 끝(현장 A S-701 추가 보강근 글이 LEADER 로 구역에 이어짐) */
  const 지 = { sx0: [], sy0: [], sx1: [], sy1: [], sly: [] }
  for (let q = 0; q < Q.e.length; q++) {
    const e = Q.e[q], t = E.t[e]
    if (t === 종류.지시선) {
      const s = Q.p0[q], n = Q.pn[q]
      for (let j = 0; j + 1 < n; j++) {
        const a = s + j, b = s + j + 1
        const x0 = P[a * 2] * k, y0 = P[a * 2 + 1] * k, x1 = P[b * 2] * k, y1 = P[b * 2 + 1] * k
        if (Math.hypot(x1 - x0, y1 - y0) < 1) continue
        지.sx0.push(x0); 지.sy0.push(y0); 지.sx1.push(x1); 지.sy1.push(y1); 지.sly.push(E.ly[e])
      }
      continue
    }
    if (!(t === 종류.선 || t === 종류.폴리선 || t === 종류.닫힌폴리선 || t === 종류.원)) continue
    const ly = E.ly[e]
    if (층주석[ly]) {
      /* 🧭 G249 주석 층(표 · 글 층 «TXTE»)의 가로 선은 표 칸 읽기에만 — 현장 A «RC WALL LIST» 의 표 줄 */
      if (t === 종류.선 || t === 종류.폴리선 || t === 종류.닫힌폴리선) {
        const s = Q.p0[q], n = Q.pn[q], 끝 = t === 종류.닫힌폴리선 ? n : n - 1
        for (let j = 0; j < 끝; j++) {
          const a = s + j, b = s + ((j + 1) % n)
          const x0 = P[a * 2] * k, y0 = P[a * 2 + 1] * k, x1 = P[b * 2] * k, y1 = P[b * 2 + 1] * k
          const L = Math.hypot(x1 - x0, y1 - y0)
          if (L >= 50 && Math.abs(y1 - y0) <= 0.01 * L) 주석가로.push((y0 + y1) / 2, Math.min(x0, x1), Math.max(x0, x1))
          else if (L >= 50 && Math.abs(x1 - x0) <= 0.01 * L) 주석세로.push((x0 + x1) / 2, Math.min(y0, y1), Math.max(y0, y1))      // 🧭 G265 세로 줄도(단면 그림 일람표 칸 — `제칸`)
        }
      }
      continue
    }
    const s = Q.p0[q], n = Q.pn[q]
    if (t === 종류.닫힌폴리선 || t === 종류.원) {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
      for (let j = 0; j < n; j++) { const x = P[(s + j) * 2] * k, y = P[(s + j) * 2 + 1] * k; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
      const 큰 = t === 종류.닫힌폴리선 && ((x1 - x0) * (y1 - y0) > 2e7 || (보강층[ly] && (x1 - x0) * (y1 - y0) > 5e5))     // 🧱 G233 20 ㎡ 넘는 닫힌 선은 점도(MAT 기초 테두리) · 🧭 G254 보강 층 구역(0.5 ㎡ 넘게)도
      닫힌.push({ e, ly, b: [x0, y0, x1, y1], 원: t === 종류.원, 점: 큰 ? Array.from({ length: n }, (_, j) => [P[(s + j) * 2] * k, P[(s + j) * 2 + 1] * k]) : null })
    }
    if (t === 종류.원) continue
    const 끝 = t === 종류.닫힌폴리선 ? n : n - 1
    for (let j = 0; j < 끝; j++) {
      const a = s + j, b = s + ((j + 1) % n)
      const x0 = P[a * 2] * k, y0 = P[a * 2 + 1] * k, x1 = P[b * 2] * k, y1 = P[b * 2 + 1] * k
      if (Math.hypot(x1 - x0, y1 - y0) < 50) continue
      sx0.push(x0); sy0.push(y0); sx1.push(x1); sy1.push(y1); sly.push(ly); se.push(e); slt.push(Elt ? Elt[e] : 0)
    }
  }
  // 칸 찾기판
  const 칸 = 2000
  const 판 = new Map()
  const 열쇠 = (i, j) => i * 100003 + j
  for (let s = 0; s < sx0.length; s++) {
    const i0 = Math.floor(Math.min(sx0[s], sx1[s]) / 칸), i1 = Math.floor(Math.max(sx0[s], sx1[s]) / 칸)
    const j0 = Math.floor(Math.min(sy0[s], sy1[s]) / 칸), j1 = Math.floor(Math.max(sy0[s], sy1[s]) / 칸)
    if ((i1 - i0 + 1) * (j1 - j0 + 1) > 4000) continue       // 도면 전체를 가로지르는 아주 긴 선(도곽 등)
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const key = 열쇠(i, j); const a = 판.get(key); if (a) a.push(s); else 판.set(key, [s]) }
  }
  const 도장 = new Int32Array(sx0.length); let 도장번 = 0
  const 찾기 = (x0, y0, x1, y1) => {
    도장번++
    const out = []
    const i0 = Math.floor(Math.min(x0, x1) / 칸), i1 = Math.floor(Math.max(x0, x1) / 칸), j0 = Math.floor(Math.min(y0, y1) / 칸), j1 = Math.floor(Math.max(y0, y1) / 칸)
    if ((i1 - i0 + 1) * (j1 - j0 + 1) > 20000) return out
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
      const a = 판.get(열쇠(i, j)); if (!a) continue
      for (const s of a) if (도장[s] !== 도장번) { 도장[s] = 도장번; out.push(s) }
    }
    return out
  }
  // 글자 (가운데 · mm)
  const 글자 = []
  /* 🧭 G246 점이 다 찬 뒤 읽은 글(그 판은 모양이 없음)은 판 목록에만 — 물량 읽기에 쓰면 모양 없는 판(건축 평면)이 부재 자리를 가져가
       현장 C 기둥 56개가 빠졌음(전처럼 물량은 모양을 읽은 판까지) */
  const 밖글 = 모델.T밖 || null       /* 🧭 G246 범위 읽기에서 모양을 안 담은 판의 글 */
  const 뒤글자 = [], 캡0 = 모델.stats && 모델.stats.capped && 모델.stats.캡글 != null ? 모델.stats.캡글 : Infinity, 캡1 = (모델.stats && 모델.stats.글수) || T.s.length
  for (let i = 0; i < T.s.length; i++) {
    const s = 글(T.s[i]); if (!s) continue
    const h = T.h[i] * k, a = T.a[i]
    let w = 0; for (const ch of s) w += /[ㄱ-힝]/.test(ch) ? 1.0 : (ch === ' ' ? 0.5 : 0.75)
    w *= h
    const x = T.x[i] * k, y = T.y[i] * k
    const cx = x + (w / 2) * Math.cos(a) - (h / 2) * Math.sin(a), cy = y + (w / 2) * Math.sin(a) + (h / 2) * Math.cos(a)
    ;((밖글 ? i < 밖글.length && 밖글[i] : i >= 캡0 && i < 캡1) ? 뒤글자 : 글자).push({ i, 번, s, u: 붙(s).toUpperCase(), x: cx, y: cy, h, w, a, ly: E.ly[T.e[i]], x0: x })
  }
  /* 🧭 G245 «글자 틀» — 기호 글자를 바짝 감싼 작은 네모(짧은 변이 그 글자 높이 2.5배 안 · 현장 B «C1» 네모)는 기둥 · 기초가 아님.
     xref 를 겹쳐 같은 기호 글자가 둘이면, 둘째 글자가 진짜 기둥(이미 씀) 대신 이 네모를 기둥으로 잡아 기둥이 하나 더 생겼음 */
  {
    const 칸2 = 2000, 글칸 = new Map()
    for (const g of 글자) { if (!/[A-Z]/i.test(g.s)) continue; const key = Math.floor(g.x / 칸2) * 100003 + Math.floor(g.y / 칸2); const a = 글칸.get(key); if (a) a.push(g); else 글칸.set(key, [g]) }
    for (const c of 닫힌) {
      const w = c.b[2] - c.b[0], h = c.b[3] - c.b[1]
      if (c.원 || w > 3000 || h > 3000) continue
      const 짧 = Math.min(w, h)
      let 틀 = false
      for (let i = Math.floor(c.b[0] / 칸2); i <= Math.floor(c.b[2] / 칸2) && !틀; i++) for (let j = Math.floor(c.b[1] / 칸2); j <= Math.floor(c.b[3] / 칸2) && !틀; j++) {
        for (const g of 글칸.get(i * 100003 + j) || []) if (g.x > c.b[0] && g.x < c.b[2] && g.y > c.b[1] && g.y < c.b[3] && g.h * 2.5 >= 짧) { 틀 = true; break }
      }
      if (틀) c.글틀 = true
    }
  }
  /* 🛠 G118 (2026-10-02) — 소장님 「골조 수량 산출 도면을 넣었는데, 물량이 제대로 안나온데..」
     도면이 «도곽(박스)» 마다 한 장이고 제목이 표제란(도곽 오른쪽 아래)에만 있으면, 평면 왼쪽의 부재 기호가 제목과 너무 멀어
     어느 평면에도 안 걸리고 빠졌습니다(보 46 → 33줄 · 콘크리트 216 → 189㎥). 도곽을 찾아, 같은 도곽 안의 제목을 그 평면의 제목으로 봅니다.
     도곽 찾기는 도면 PDF 만들기와 같은 것(lib/dxfplot.js 도곽찾기) — 주석층(도곽 · TITLE 등)도 봅니다. */
  let 도곽 = [], 판제목 = [], 판글들 = []
  /* 🧭 G241 판(도곽)은 3D 와 같은 방법(도곽3d — 맞붙은 판 · 표제란 도면명)으로 — 현장 C · D 토목 통합본: 예전 방법은 판 3장(헛 네모)만 잡아
       기초 상세 판 · 보 평면 판을 못 나눴음. 판 테두리 층(FORM 등 주석층)까지 모든 선으로 찾음 · 못 찾으면 예전 방법 */
  try {
    const 선 = []
    /* 🧭 G246 판은 «종이에 찍히는 것» 으로 — 인쇄 안 하는 층(면적 계산 네모 · 화면틀 · 작업 층)의 선 · 글은 판 찾기 · 판 이름에 안 씀
         (현장 A «area 03» 층의 84 × 59.4 m 네모가 판 테두리로 잡혀 판이 바깥/안쪽 테두리로 오갔음 — 물량 읽기에는 그대로 씀) */
    const 안찍힘 = layers.map((L) => !!(L && L.인쇄안함))
    for (let q = 0; q < Q.e.length; q++) {
      const e = Q.e[q], t = E.t[e]
      if (!(t === 종류.선 || t === 종류.폴리선 || t === 종류.닫힌폴리선)) continue
      if (안찍힘[E.ly[e]]) continue
      const s = Q.p0[q], n = Q.pn[q], 끝 = t === 종류.닫힌폴리선 ? n : n - 1
      for (let j = 0; j < 끝; j++) { const a2 = s + j, b2 = s + ((j + 1) % n); 선.push(P[a2 * 2] * k, P[a2 * 2 + 1] * k, 0, P[b2 * 2] * k, P[b2 * 2 + 1] * k, 0) }
    }
    const 글들 = []
    for (let i = 0; i < T.s.length; i++) { if (안찍힘[E.ly[T.e[i]]]) continue; const s2 = 글(T.s[i]); if (s2) 글들.push({ s: s2, x: T.x[i] * k, y: T.y[i] * k, h: T.h[i] * k, ly: (layers[E.ly[T.e[i]]] || {}).name || '' }) }
    const a = Float64Array.from(선)
    /* 🧭 G246 점이 다 찬 큰 도면 — 뒤쪽 판 테두리는 틀선(가로 · 세로 곧은 선)으로 · 덜 읽은 판은 글자로(도곽3d 덜읽음) */
    const F0 = 모델.틀선
    const 틀선 = F0 && F0.n ? { a: Float64Array.from(F0.a.subarray(0, F0.n), (v) => v * k), n: F0.n } : null
    const 판 = 도곽찾기3d({ out: new Map([['_', { pos: { a, n: a.length } }]]), texts: 글들, stats: { capped: !!(모델.stats && 모델.stats.capped), 범위밖: (모델.stats && 모델.stats.범위밖) || 0 }, ...(틀선 ? { 틀선 } : {}) }, null)
    판글들 = 글들
    if (판.length) { 도곽 = 판.map((f) => [f.x0, f.y0, f.x1, f.y1]); 판제목 = 박스제목들(글들, 판) }
  } catch (e) { 도곽 = []; 판제목 = [] }
  if (!도곽.length) try {
    const 조각 = []
    for (let q = 0; q < Q.e.length; q++) {
      const t = E.t[Q.e[q]]
      if (t === 종류.선 || t === 종류.폴리선 || t === 종류.닫힌폴리선) 조각.push({ s: Q.p0[q], n: Q.pn[q], closed: t === 종류.닫힌폴리선 })
    }
    도곽 = 도곽찾기(P, 조각, 모델.units).map((f) => [f.x0 * k, f.y0 * k, f.x1 * k, f.y1 * k])
    /* 🧭 G246 예전 방법으로 찾은 판도 표제란에서 이름을 읽음(전엔 늘 빈 이름 — 판 목록에 «이름 못 찾음») */
    판제목 = 도곽.length && 판글들.length ? 박스제목들(판글들, 도곽.map((r) => ({ x0: r[0], y0: r[1], x1: r[2], y1: r[3] }))) : 도곽.map(() => '')
  } catch (e) { 도곽 = []; 판제목 = [] }
  /* 🧭 G241 여러 판에 들면 가장 작은 판(현장 C · D 토목: 판 전체를 품는 큰 헛 네모가 앞에 있어 모든 글자가 그 판으로 갔음) */
  const 도곽번 = (x, y) => { let k2 = -1, A = Infinity; for (let i = 0; i < 도곽.length; i++) { const f = 도곽[i]; if (x >= f[0] && x <= f[2] && y >= f[1] && y <= f[3]) { const a = (f[2] - f[0]) * (f[3] - f[1]); if (a < A) { A = a; k2 = i } } } return k2 }
  /* 🧱 G233 해치(무늬 · 고리 · 넓이) — MAT 기초 «기초 두께» 범례 무늬로 평면의 두꺼운 구역을 셈 */
  const 해치표 = new Map()
  const 무늬 = 모델.무늬 || new Map()
  for (let q = 0; q < Q.e.length; q++) {
    const e = Q.e[q]
    if (E.t[e] !== 종류.해치) continue
    const s = Q.p0[q], n = Q.pn[q]
    if (n < 3) continue
    let h = 해치표.get(e)
    if (!h) { h = { e, ly: E.ly[e], 무늬: 무늬.get(e) || '', 넓이: (E.area[e] || 0) * k * k, 고리: [], b: [Infinity, Infinity, -Infinity, -Infinity] }; 해치표.set(e, h) }
    const r = []
    for (let j = 0; j < n; j++) { const x = P[(s + j) * 2] * k, y = P[(s + j) * 2 + 1] * k; r.push([x, y]); if (x < h.b[0]) h.b[0] = x; if (x > h.b[2]) h.b[2] = x; if (y < h.b[1]) h.b[1] = y; if (y > h.b[3]) h.b[3] = y }
    h.고리.push(r)
  }
  const 해치 = [...해치표.values()]
  /* 지시선 찾기판(같은 꼴 — 지시선끝(지시D, 글) 로 씀) */
  const 지판 = new Map()
  for (let s2 = 0; s2 < 지.sx0.length; s2++) {
    const i0 = Math.floor(Math.min(지.sx0[s2], 지.sx1[s2]) / 칸), i1 = Math.floor(Math.max(지.sx0[s2], 지.sx1[s2]) / 칸)
    const j0 = Math.floor(Math.min(지.sy0[s2], 지.sy1[s2]) / 칸), j1 = Math.floor(Math.max(지.sy0[s2], 지.sy1[s2]) / 칸)
    if ((i1 - i0 + 1) * (j1 - j0 + 1) > 4000) continue
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const key = 열쇠(i, j); const a2 = 지판.get(key); if (a2) a2.push(s2); else 지판.set(key, [s2]) }
  }
  const 지도장 = new Int32Array(지.sx0.length); let 지도장번 = 0
  지.찾기 = (x0, y0, x1, y1) => {
    지도장번++
    const out = []
    const i0 = Math.floor(Math.min(x0, x1) / 칸), i1 = Math.floor(Math.max(x0, x1) / 칸), j0 = Math.floor(Math.min(y0, y1) / 칸), j1 = Math.floor(Math.max(y0, y1) / 칸)
    if ((i1 - i0 + 1) * (j1 - j0 + 1) > 20000) return out
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const a2 = 지판.get(열쇠(i, j)); if (!a2) continue; for (const s2 of a2) if (지도장[s2] !== 지도장번) { 지도장[s2] = 지도장번; out.push(s2) } }
    return out
  }
  return { 번, k, 모델, sx0, sy0, sx1, sy1, sly, se, slt, 닫힌, 찾기, 글자, 뒤글자, layers, 도곽, 도곽번, 판제목, 해치, 주석가로, 주석세로, 지시D: 지 }
}

/** 🧱 G260 열린 선들의 바깥 테두리 — 끝점 붙이기(tol) · 만나는 곳 · T 자리에서 나눔 → 평면 그래프 → 가장 큰 무리의 바깥 면을 오른쪽 돌기로 한 바퀴
 *  선들: [[x0,y0,x1,y1] …] · 돌려줌: {점: [[x,y] …] (반시계), 넓이} | null */
export function 바깥고리(선들, tol = 30) {
  const n = 선들.length
  if (!n || n > 6000) return null
  // 1) 선마다 나눌 t
  const ts = 선들.map(() => [0, 1])
  const 상자 = 선들.map(([a, b, c, d]) => [Math.min(a, c) - tol, Math.min(b, d) - tol, Math.max(a, c) + tol, Math.max(b, d) + tol])
  for (let i = 0; i < n; i++) {
    const [ax, ay, bx, by] = 선들[i], ux = bx - ax, uy = by - ay, L2 = ux * ux + uy * uy
    if (L2 < 1) continue
    const L = Math.sqrt(L2)
    for (let j = 0; j < n; j++) {
      if (i === j) continue
      const p = 상자[i], q = 상자[j]
      if (p[2] < q[0] || q[2] < p[0] || p[3] < q[1] || q[3] < p[1]) continue
      const [cx, cy, dx, dy] = 선들[j], vx = dx - cx, vy = dy - cy
      const den = ux * vy - uy * vx
      if (Math.abs(den) > 1e-9 * L * Math.hypot(vx, vy)) {
        const t = ((cx - ax) * vy - (cy - ay) * vx) / den, s = ((cx - ax) * uy - (cy - ay) * ux) / den
        const tt = tol / L, ss = tol / (Math.hypot(vx, vy) || 1)
        if (t > -tt && t < 1 + tt && s > -ss && s < 1 + ss) ts[i].push(Math.max(0, Math.min(1, t)))
      }
      // j 의 끝점이 i 위에(T · 겹친 선)
      for (const [px, py] of [[cx, cy], [dx, dy]]) {
        const t = ((px - ax) * ux + (py - ay) * uy) / L2
        if (t <= 0 || t >= 1) continue
        const ox = ax + ux * t - px, oy = ay + uy * t - py
        if (ox * ox + oy * oy <= tol * tol) ts[i].push(t)
      }
    }
  }
  // 2) 점 붙이기(칸 tol)
  const 점 = [], 칸 = new Map()
  const 열 = (x, y) => Math.floor(x / tol) + ',' + Math.floor(y / tol)
  const 점번 = (x, y) => {
    const gx = Math.floor(x / tol), gy = Math.floor(y / tol)
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const arr = 칸.get((gx + a) + ',' + (gy + b)); if (arr) for (const k of arr) if (Math.hypot(점[k][0] - x, 점[k][1] - y) <= tol) return k }
    점.push([x, y]); const key = 열(x, y); const arr = 칸.get(key); if (arr) arr.push(점.length - 1); else 칸.set(key, [점.length - 1])
    return 점.length - 1
  }
  const 이웃 = new Map()
  const 잇기 = (a, b) => { if (a === b) return; let s = 이웃.get(a); if (!s) { s = new Set(); 이웃.set(a, s) } s.add(b); let s2 = 이웃.get(b); if (!s2) { s2 = new Set(); 이웃.set(b, s2) } s2.add(a) }
  for (let i = 0; i < n; i++) {
    const [ax, ay, bx, by] = 선들[i]
    const t = [...new Set(ts[i].map((v) => Math.round(v * 1e6) / 1e6))].sort((p, q) => p - q)
    let prev = 점번(ax + (bx - ax) * t[0], ay + (by - ay) * t[0])
    for (let k = 1; k < t.length; k++) { const c = 점번(ax + (bx - ax) * t[k], ay + (by - ay) * t[k]); 잇기(prev, c); prev = c }
  }
  if (!이웃.size) return null
  // 3) 무리
  const 무리 = new Map(); let m = 0
  for (const v of 이웃.keys()) {
    if (무리.has(v)) continue
    const st = [v]; 무리.set(v, m)
    while (st.length) { const u = st.pop(); for (const w of 이웃.get(u)) if (!무리.has(w)) { 무리.set(w, m); st.push(w) } }
    m++
  }
  let 최고 = null
  for (let g = 0; g < m; g++) {
    const vs = [...이웃.keys()].filter((v) => 무리.get(v) === g)
    if (vs.length < 3) continue
    let s0 = vs[0]
    for (const v of vs) if (점[v][0] < 점[s0][0] - 1e-9 || (Math.abs(점[v][0] - 점[s0][0]) <= 1e-9 && 점[v][1] < 점[s0][1])) s0 = v
    const 각 = (a, b) => Math.atan2(점[b][1] - 점[a][1], 점[b][0] - 점[a][0])
    let cur = s0, hin = -Math.PI / 2, 첫 = null
    const 길 = [s0]
    const 한도 = 4 * vs.length + 10
    for (let step = 0; step < 한도; step++) {
      let best = null, bt = Infinity
      for (const w of 이웃.get(cur)) { let tr = 각(cur, w) - hin; while (tr <= -Math.PI) tr += 2 * Math.PI; while (tr > Math.PI) tr -= 2 * Math.PI; if (tr < bt - 1e-12) { bt = tr; best = w } }
      if (best === null) break
      if (첫 === null) 첫 = best
      else if (cur === s0 && best === 첫) break
      hin = 각(cur, best); cur = best; 길.push(cur)
    }
    if (길[길.length - 1] === s0) 길.pop()
    /* 튀어나온 줄(갔다가 되돌아온 길 A → B → A)은 테두리에서 뺌 — 넓이는 같고 둘레만 늘었음 */
    for (let 바뀜 = true; 바뀜 && 길.length > 3;) {
      바뀜 = false
      const 새 = []
      for (const v of 길) { if (새.length >= 2 && 새[새.length - 2] === v) { 새.pop(); 바뀜 = true } else if (새[새.length - 1] !== v) 새.push(v) }
      while (새.length > 3 && (새[0] === 새[새.length - 1] || 새[1] === 새[새.length - 1])) { if (새[0] === 새[새.length - 1]) 새.pop(); else { 새.shift(); 새.pop(); } 바뀜 = true }
      길.length = 0; 길.push(...새)
    }
    let A = 0
    for (let k = 0; k < 길.length; k++) { const p = 점[길[k]], q = 점[길[(k + 1) % 길.length]]; A += p[0] * q[1] - q[0] * p[1] }
    A /= 2
    if (!최고 || A > 최고.넓이) 최고 = { 점: 길.map((k) => 점[k]), 넓이: A }
  }
  return 최고 && 최고.넓이 > 0 ? 최고 : null
}

/** 🧱 G233 다각형 넓이(mm² · 부호 뺌) · 둘레(mm) */
const 고리넓이 = (r) => { let A = 0; for (let i = 0; i < r.length; i++) { const a = r[i], b = r[(i + 1) % r.length]; A += a[0] * b[1] - b[0] * a[1] } return Math.abs(A / 2) }
const 고리둘레 = (r) => { let L = 0; for (let i = 0; i < r.length; i++) { const a = r[i], b = r[(i + 1) % r.length]; L += Math.hypot(b[0] - a[0], b[1] - a[1]) } return L }
const 점안 = (p, r) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const a = r[i], b = r[j]; if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c } return c }
/** 철근 글자 «HD19@300(B)» · «SHD22@200(T)» → {d, s, 위아래} */
/* 🧭 G252 «SHD16@200(T&B)» · «(TB)» · «(T,B)» · «(상하부)» = 위 · 아래 둘 다(현장 B 기초 — 예전엔 못 읽어 MAT 철근 0) */
const 매트철근꼴 = /^(?:S?H?D|SD|D)(\d{2})@(\d{2,4})\(?(T\s*[&,/+]?\s*B|상\s*[·,]?\s*하부?|T|B|상|하|상부|하부)?\)?$/i


/* ───────────────────────────── ① 일람표 → 배근표 */

/**
 * 일람표 읽기 → «정의» 목록. 한 기호가 여러 번(층마다 다른 크기·(R) G1·「B1F ~ 2F」 칸) 나올 수 있어 목록으로 둡니다.
 * @returns {정의:[{종류, 기호, 몸, 층표, r, 범위, 번, g, 근거}], 쓴글자:Set, 철골:Map}
 *   범위 = null(모든 층) | {a,b} | {목록} — 보·슬래브는 «바닥» 이름, 기둥·벽은 «층» 이름 (골조읽기에서 층으로 바꿈)
 */
/* 🧭 G242 글자 곁 그림 한 덩이(서로 닿거나 엇갈린 선들)의 테두리 [x0, y0, x1, y1] — 한 상세 칸에 그림이 여럿일 때(현장 D 기초 상세: 평면 하나 · 단면 넷)
     이름표(오각형 속 «F9») 가 든 단면 그림의 자리. 틀 밖으로 나가는 선은 안 따라감 · 선이 너무 많으면(그림끼리 이어짐) null */
function 그림테두리(D, x, y, r, 틀, 최대 = 20000) {
  const tol = Math.max(5, 0.05 * r)
  const 안 = (s) => Math.min(D.sx0[s], D.sx1[s]) >= 틀[0] && Math.max(D.sx0[s], D.sx1[s]) <= 틀[2] && Math.min(D.sy0[s], D.sy1[s]) >= 틀[1] && Math.max(D.sy0[s], D.sy1[s]) <= 틀[3]
  const 점선 = (px, py, s) => {
    const ax = D.sx0[s], ay = D.sy0[s], dx = D.sx1[s] - ax, dy = D.sy1[s] - ay, L = dx * dx + dy * dy
    const u = L ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L)) : 0
    return Math.hypot(px - ax - u * dx, py - ay - u * dy)
  }
  const 엇 = (a, b) => {
    const x1 = D.sx0[a], y1 = D.sy0[a], x2 = D.sx1[a], y2 = D.sy1[a], x3 = D.sx0[b], y3 = D.sy0[b], x4 = D.sx1[b], y4 = D.sy1[b]
    const d = (x2 - x1) * (y4 - y3) - (y2 - y1) * (x4 - x3)
    if (!d) return false
    const t = ((x3 - x1) * (y4 - y3) - (y3 - y1) * (x4 - x3)) / d, u = ((x3 - x1) * (y2 - y1) - (y3 - y1) * (x2 - x1)) / d
    return t >= 0 && t <= 1 && u >= 0 && u <= 1
  }
  const 닿 = (a, b) => 엇(a, b) || 점선(D.sx0[a], D.sy0[a], b) <= tol || 점선(D.sx1[a], D.sy1[a], b) <= tol || 점선(D.sx0[b], D.sy0[b], a) <= tol || 점선(D.sx1[b], D.sy1[b], a) <= tol
  const 든 = new Set(), 큐 = []
  for (const s of D.찾기(x - r, y - r, x + r, y + r)) if (안(s) && 점선(x, y, s) <= r) { 든.add(s); 큐.push(s) }
  if (!큐.length) return null
  while (큐.length) {
    const a = 큐.pop()
    for (const b of D.찾기(Math.min(D.sx0[a], D.sx1[a]) - tol, Math.min(D.sy0[a], D.sy1[a]) - tol, Math.max(D.sx0[a], D.sx1[a]) + tol, Math.max(D.sy0[a], D.sy1[a]) + tol)) {
      if (든.has(b) || !안(b) || !닿(a, b)) continue
      든.add(b); 큐.push(b)
      if (든.size > 최대) return null
    }
  }
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const s of 든) { x0 = Math.min(x0, D.sx0[s], D.sx1[s]); x1 = Math.max(x1, D.sx0[s], D.sx1[s]); y0 = Math.min(y0, D.sy0[s], D.sy1[s]); y1 = Math.max(y1, D.sy0[s], D.sy1[s]) }
  return [x0, y0, x1, y1]
}

/* 🧭 G265 글자가 «칸 머리» 인 표 칸 [왼, 밑, 오, 머리밑줄] — 단면 그림 일람표(현장 B S-401 «옹벽 일람표 - 4» RW1 · RW2 · DW1 · 현장 A S-611 «BW1 (THK=300mm)»):
     양옆 = 머리 높이를 지나 아래로 10 글자 넘게 내려가는 가장 가까운 세로 줄 · 머리 밑줄 = 머리 아래 3 글자 안의 가로 줄(칸 폭 80 % 넘게) ·
     칸 밑 = 그 아래 10 글자 넘게 떨어진 첫 가로 줄(칸 폭 80 % 넘게 — 없으면 양옆 세로 줄 아래 끝). 칸이 15 글자보다 좁거나 낮으면 null */
function 제칸(D, g, 최대 = 400) {
  const H = g.h
  const 세로 = [], 가로 = []
  for (const s of D.찾기(g.x - 최대 * H, g.y - 최대 * H, g.x + 최대 * H, g.y + 3 * H)) {
    const dx = D.sx1[s] - D.sx0[s], dy = D.sy1[s] - D.sy0[s], L = Math.hypot(dx, dy)
    if (L < 2 * H) continue
    if (Math.abs(dx) <= 0.01 * L) 세로.push({ x: (D.sx0[s] + D.sx1[s]) / 2, a: Math.min(D.sy0[s], D.sy1[s]), b: Math.max(D.sy0[s], D.sy1[s]) })
    else if (Math.abs(dy) <= 0.01 * L) 가로.push({ y: (D.sy0[s] + D.sy1[s]) / 2, a: Math.min(D.sx0[s], D.sx1[s]), b: Math.max(D.sx0[s], D.sx1[s]) })
  }
  /* 표 줄이 주석 층(TABLE · TBL …)에 있으면 찾기판에 없음 — 주석 가로 · 세로 줄도 */
  const bx0 = g.x - 최대 * H, bx1 = g.x + 최대 * H, by0 = g.y - 최대 * H, by1 = g.y + 3 * H
  const 주가 = D.주석가로 || [], 주세 = D.주석세로 || []
  for (let q = 0; q < 주가.length; q += 3) if (주가[q] >= by0 && 주가[q] <= by1 && 주가[q + 2] >= bx0 && 주가[q + 1] <= bx1 && 주가[q + 2] - 주가[q + 1] >= 2 * H) 가로.push({ y: 주가[q], a: 주가[q + 1], b: 주가[q + 2] })
  for (let q = 0; q < 주세.length; q += 3) if (주세[q] >= bx0 && 주세[q] <= bx1 && 주세[q + 2] >= by0 && 주세[q + 1] <= by1 && 주세[q + 2] - 주세[q + 1] >= 2 * H) 세로.push({ x: 주세[q], a: 주세[q + 1], b: 주세[q + 2] })
  let 왼 = null, 오 = null
  for (const v of 세로) {
    if (v.b < g.y || v.a > g.y - 10 * H) continue
    if (v.x < g.x0 - 0.2 * H && (!왼 || v.x > 왼.x)) 왼 = v
    if (v.x > g.x0 + g.w + 0.2 * H && (!오 || v.x < 오.x)) 오 = v
  }
  if (!왼 || !오 || 오.x - 왼.x < 15 * H) return null
  const 덮 = (l) => Math.min(l.b, 오.x) - Math.max(l.a, 왼.x) >= 0.8 * (오.x - 왼.x)
  const 밑줄 = 가로.filter((l) => l.y < g.y - 0.3 * H && l.y >= g.y - 3 * H && 덮(l)).sort((p, q) => q.y - p.y)[0]
  if (!밑줄) return null
  const 끝 = Math.max(왼.a, 오.a)
  const 밑l = 가로.filter((l) => l.y <= 밑줄.y - 10 * H && l.y >= 끝 - H && 덮(l)).sort((p, q) => q.y - p.y)[0]
  const 밑 = 밑l ? 밑l.y : 끝
  if (밑줄.y - 밑 < 15 * H) return null
  return [왼.x, 밑, 오.x, 밑줄.y]
}

/* ───────── 🧭 G405 (2026-10-25) 짐작 금지 — 소장님 「짐작은 절대 하지마」 · 「도면에 없으면 없다고 해」 · 「이건 돈과 직결되는 거야」
   (G250 「일람표가 없으면, 클로드가 만들어서 추가해줘」 의 «흔한 값 · 비슷한 부재 · 같은 몸 다른 층 값으로 채우기» 를 바꿈)
   배근표의 빈 크기 · 두께 · 철근은 채우지 않음. 쓰는 값 = 도면 일람표 · 평면 범례 · 도면에서 잰 값(평면 두 선 폭 · 기둥 · 기초 그림)뿐.
   빈 것은 «만든 값» 칸에 «❓ 도면에 없음 — 춤 · 철근» 으로 적고, 그 부재의 그 물량은 셈에서 빠짐(골조.js — 폭 · 춤이 없으면 보를 안 셈 · 철근 칸이 비면 철근 0).
   같은 이름(층만 다른) 줄이 일람표에 있으면 알려만 줌(같은지는 사람이 정함 — 배근표에 적으면 셈) */
const 둥글 = (v, k) => Math.round(v / k) * k
const 철없음 = {
  보: (r) => !글(r.상부) && !글(r.하부),
  기둥: (r) => !글(r.주근) && !글(r.단위철근),
  벽: (r) => !글(r.수직) && !글(r.수평) && !글(r.단위철근),
  슬라브: (r) => !글(r.단변하부) && !글(r.장변하부) && !글(r.단변상부) && !글(r.장변상부) && !글(r.단위철근),
  기초: (r) => !글(r.하부가로) && !글(r.하부세로) && !글(r.상부가로) && !글(r.상부세로) && !글(r.단위철근),
}
/** 배근표(P.배근)의 빈 크기 · 철근 — 채우지 않고 «❓ 도면에 없음» 을 적음. @returns [{종, 기호, 글, 없음}] */
const 빈칸 = (종, r) => {
  const 없음 = []
  if (종 === '보') { if (!(+r.폭 > 0)) 없음.push('폭'); if (!(+r.춤 > 0)) 없음.push(r._춤글 ? '춤(«' + r._춤글 + '» — 건축 도면 치수)' : '춤') }
  else if (종 === '기둥') { if (!(+r.지름 > 0) && !(+r.가로 > 0 && +r.세로 > 0)) 없음.push('크기') }
  else if (!(+r.두께 > 0)) 없음.push('두께')
  if (철없음[종](r)) 없음.push('철근')
  return 없음
}
function 일람채우기(배근) {
  const 채움 = []
  const 몸 = (k) => (기호풀이(k) || {}).몸 || 글(k).toUpperCase()
  for (const 종 of ['보', '기둥', '벽', '슬라브', '기초']) {
    const 줄들 = 배근[종] || []
    const 빈 = new Map()
    for (const r of 줄들) { if (글(r.종류) === '부정형' || 글(r.단위철근)) continue; const a = 빈칸(종, r); if (a.length) 빈.set(r, a) }
    for (const [r, 없음] of 빈) {
      const 나 = 몸(r.기호)
      /* 알려 줄 줄 = 빈 칸 가운데 하나라도 값이 있는 줄(그 줄도 같은 칸이 비었으면 알려도 소용없음) */
      const 값있음 = (o) => 없음.some((w) => (/^철근/.test(w) ? !철없음[종](o) : /^폭/.test(w) ? +o.폭 > 0 : /^춤/.test(w) ? +o.춤 > 0 : /^크기/.test(w) ? +o.지름 > 0 || (+o.가로 > 0 && +o.세로 > 0) : +o.두께 > 0))
      const 같 = 줄들.filter((o) => o !== r && 몸(o.기호) === 나 && 값있음(o)).map((o) => o.기호).slice(0, 3)
      /* 앞에 한 글자 붙은 이름(DS2 ↔ UDS2 — 현장 J 평면 «DS1 · DS2» · 데크 일람 «UDS1 ~ 3») 먼저 · 한 글자 뗀 이름은 그다음 — 알려만 줌 */
      /* 🧭 G408 범례에 «건축치수» 로 정의된 보(현장 Y LB2)는 이름 비슷한 다른 부재(B2)를 후보로 안 냄 — 다른 부재임이 도면에 적혀 있음 */
      const 비 = 같.length || r._춤글 ? [] : [
        ...줄들.filter((o) => o !== r && 값있음(o) && (() => { const a = 몸(o.기호); return a !== 나 && a.endsWith(나) && a.length - 나.length === 1 })()),
        ...줄들.filter((o) => o !== r && 값있음(o) && (() => { const a = 몸(o.기호); return a !== 나 && 나.endsWith(a) && 나.length - a.length === 1 })()),
      ].map((o) => o.기호).slice(0, 3)
      r._없음 = 없음
      /* 🧭 G406 «같은 부재» 후보(사람이 고르면 📌 — 같음입히기) · 층표 없는 이름(UDS1) 먼저 */
      { const 후 = r._무리기호 ? [r._무리기호] : 같.length ? 같 : 비; if (후.length) r._후보 = [...후].sort((a, b) => (몸(a) === 글(a).toUpperCase() ? 0 : 1) - (몸(b) === 글(b).toUpperCase() ? 0 : 1)) }
      const 무 = r._무리힌트 ? ' (같은 무리 «' + r._무리힌트 + '» — 같은 것이면 이 줄에 적어 주세요)' : ''
      const 글0 = '❓ 도면에 없음 — ' + 없음.join(' · ') + (무 || (같.length ? ' (같은 이름 «' + 같.join(' · ') + '» 은 일람표에 있음 — 같은 것이면 이 줄에 적어 주세요)' : 비.length ? ' (비슷한 이름 «' + 비.join(' · ') + '» 은 일람표에 있음 — 같은 것이면 이 줄에 적어 주세요)' : ''))
      r.만든 = (r.만든 ? r.만든 + ' · ' : '건설맵: ') + 글0
      채움.push({ 종, 기호: r.기호, 글: 글0, 없음 })
    }
  }
  return 채움
}
/** 🧭 G249 «미표기 벽체» 주기 — 판(판i) 안 «미표기 벽체 / * W200 : THK=200mm / * W300 : THK=300mm» → Map(두께 → 기호) */
function 미표기표(D, 판i) {
  const 표 = new Map()
  const 같은판 = (o) => 판i < 0 || !D.도곽 || !D.도곽.length || D.도곽번(o.x, o.y) === 판i
  for (const g of D.글자) {
    if (!/미\s*표기\s*(된\s*)?벽|표기\s*(안\s*된|없는)\s*벽|UN-?MARKED\s*WALL|NOT\s*MARKED\s*WALL/i.test(g.s) || !같은판(g)) continue
    const 곁 = D.글자.filter((o) => o.y <= g.y + 0.5 * g.h && g.y - o.y <= 8 * g.h && o.x >= g.x - g.w / 2 - 2 * g.h && o.x - g.x <= 40 * g.h && 같은판(o))
    for (const o of [g, ...곁]) {
      const m = /([A-Z]{0,3}W\d{2,4}[A-Z]?)\s*[:=(]?\s*(?:THK|T|두께)\s*[.=:]?\s*(\d{2,4})/i.exec(o.s)
      if (m) { 표.set(+m[2], m[1].toUpperCase()); continue }
      const m2 = o === g ? /\b([A-Z]{0,2}W(\d{3}))\b/i.exec(o.s) : null       // «미표기 벽체는 W200»
      if (m2) 표.set(+m2[2], m2[1].toUpperCase())
    }
    /* 🧭 G261 벽 일람(범례) 줄 «W3(미표기벽체) | 200» — 기호 칸에 «(미표기 …)» 꼬리 · 두께는 같은 줄 오른쪽 숫자 칸(현장 B S-101 WALL LIST) */
    const m3 = /^\s*([A-Z]{0,3}W\d{1,4}[A-Z]?)\s*[(（]\s*미\s*표기/i.exec(g.s)
    if (m3) {
      const 줄 = D.글자.filter((o) => o !== g && Math.abs(o.y - g.y) <= 0.6 * Math.max(g.h, o.h) && o.x > g.x && o.x - g.x <= 40 * g.h && 같은판(o) && /^\s*(?:THK\.?|T\s*=?)?\s*\d{2,4}\s*(MM)?\s*$/i.test(o.s)).sort((p2, q) => p2.x - q.x)
      if (줄.length) { const t2 = +줄[0].s.replace(/\D/g, ''); if (t2 >= 100 && t2 <= 1500 && !표.has(t2)) 표.set(t2, m3[1].toUpperCase()) }
    }
  }
  return 표
}
/** 🧭 G249 판(틀) 안 기둥 층(층s)의 «나란한 두 선» 중 폭이 두께들인 것 — 선 짝마다 {ux, uy, nx, ny, px, py(겹친 구간 가운데), g, 층들, t0, t1} */
/** 🧭 G263 단면 치수로 짐작한 기둥 · 보 크기 — 같은 기호에 크기를 바로 적은 정의가 있으면 그 짐작 크기 칸(가로 · 세로 · 지름 · 폭 · 춤 · 형태)을 비움(철근은 그대로) */
function 짐작크기버림(정의) {
  const 크기칸 = ['가로', '세로', '지름', '폭', '춤', '형태']
  /* 🧭 G405 바로 적은 크기 가운데 치수 글자 크기와 같은 것이 있으면(층마다 다른 범례 — 현장 Y CG1 400 · 500 · 900 × 700 …) 치수 글자 크기는 그대로 둠 —
       예전엔 같은 기호의 바로 적은 정의가 하나라도 있으면 지워, 범례에 없는 층(지상4층 바닥 «(4) CG1» 500 × 700)의 크기가 빈칸이 됐음. 다른 꼴(⌀500 ↔ 500 × 500)이면 예전대로 지움 */
  const 서 = (r) => (+r.지름 > 0 ? '⌀' + +r.지름 : +r.폭 > 0 ? +r.폭 + 'x' + +r.춤 : +r.가로 + 'x' + +r.세로)
  const 있음 = new Map()
  for (const d of 정의) if (!/크기/.test(d.r._짐작 || '') && (d.r.가로 || d.r.지름 || d.r.폭)) { const k = d.종류 + '|' + d.기호; if (!있음.has(k)) 있음.set(k, new Set()); 있음.get(k).add(서(d.r)) }
  for (const d of 정의) if (/크기/.test(d.r._짐작 || '') && (d.종류 === '기둥' || d.종류 === '보') && 있음.has(d.종류 + '|' + d.기호) && !있음.get(d.종류 + '|' + d.기호).has(서(d.r))) { for (const k of 크기칸) if (k in d.r) d.r[k] = ''; d.r._짐작 = '' }
  return 정의
}
/** 🧭 G259 골조입면 · 단면의 레벨 글 «1st FL» · «2nd FL» · «PIT FL» · «RF FL» · «PH FL» · «B1 FL» · «3F FL» · «지하1층 FL» → 층 (뒤에 높이가 붙은 «1FL +4,100» 은 아님 · «G.L» 은 null) */
export function 레벨층(s) {
  const t = 붙(s).toUpperCase().replace(/F\.L\.?$/, 'FL')
  let m
  if (!/FL$|LEVEL$/.test(t)) return null
  const u = t.replace(/(FL|LEVEL)$/, '')
  if (/^G\.?L\.?$/.test(u)) return null
  if (/^PIT$/.test(u)) return 'PIT'
  if ((m = /^(\d{1,2})(ST|ND|RD|TH)$/.exec(u))) return String(+m[1])
  if (/^(RF|ROOF|R)$/.test(u)) return 'R'
  if (/^(PH|PHF|PH1)$/.test(u)) return 'PH'
  const f = 층말(u)
  return f && f !== 'FT' ? f : null
}
/** 🧭 G259 입면 · 단면 판의 벽 · 기둥 이름 → 그것이 든 층 띠(레벨 글 줄의 두 레벨 사이 = 아래 레벨 층) — {몸 → Set(층)}
 *  레벨 글 줄 = 이름표 왼쪽 가장 가까운 레벨 글 무리(같은 x · 셋 넘게). PIT 은 그 줄에 지하 레벨이 없으면 B1. 지붕 위(R · PR 위)는 안 셈 · 열쇠는 기호 그대로 */
export function 입면층기호(도면들) {
  const out = new Map()
  for (const D of 도면들) {
    const 레벨 = []
    for (const g of D.글자) { const f = 레벨층(g.s); if (f) 레벨.push({ f, x: g.x0 != null ? g.x0 : g.x, y: g.y, h: g.h }) }
    if (레벨.length < 3) continue
    for (const g of D.글자) {
      const r = 기호풀이(g.s)
      if (!r || (r.종류 !== '벽' && r.종류 !== '기둥')) continue
      const gx = g.x0 != null ? g.x0 : g.x
      let xc = -Infinity
      for (const L of 레벨) if (L.x < gx && L.x > xc && gx - L.x < 600 * L.h) xc = L.x
      if (!Number.isFinite(xc)) continue
      const 줄 = 레벨.filter((L) => Math.abs(L.x - xc) <= 3 * L.h).sort((p, q) => p.y - q.y)
      if (줄.length < 3) continue
      const 지하 = 줄.some((L) => /^B\d/.test(L.f))
      let 층 = null
      for (let i = 0; i + 1 < 줄.length; i++) if (g.y > 줄[i].y && g.y < 줄[i + 1].y) { 층 = 줄[i].f; break }
      if (층 === 'PIT') 층 = 지하 ? null : 'B1'
      if (!층 || 층 === 'R' || 층 === 'PR' || 층 === 'PH') continue
      let a = out.get(r.기호); if (!a) { a = new Set(); out.set(r.기호, a) }      // 기호 그대로(«RW1» 을 지붕 W1 로 풀지 않음 — 현장 B 지하 옹벽 RW1)
      a.add(층)
    }
  }
  return out
}

function 미표기띠(D, 틀, 층s, 두께들, 기둥상자) {
  const 선 = []
  for (const s2 of D.찾기(틀[0], 틀[1], 틀[2], 틀[3])) {
    if (!층s.has(D.sly[s2])) continue
    const x0 = D.sx0[s2], y0 = D.sy0[s2], x1 = D.sx1[s2], y1 = D.sy1[s2]
    if (Math.min(x0, x1) < 틀[0] || Math.max(x0, x1) > 틀[2] || Math.min(y0, y1) < 틀[1] || Math.max(y0, y1) > 틀[3]) continue
    const L = Math.hypot(x1 - x0, y1 - y0)
    if (L < 300) continue
    let a = Math.atan2(y1 - y0, x1 - x0); if (a < 0) a += Math.PI; if (a >= Math.PI - 0.002) a -= Math.PI      // 거의 가로인 선(π 언저리)은 0 쪽으로 — 짝 선과 각이 이어지게
    const ux = Math.cos(a), uy = Math.sin(a)
    const ta = x0 * ux + y0 * uy, tb = x1 * ux + y1 * uy
    선.push({ s: s2, a, o: -x0 * uy + y0 * ux, t0: Math.min(ta, tb), t1: Math.max(ta, tb), ly: D.sly[s2] })
  }
  선.sort((p, q) => p.a - q.a || p.o - q.o)
  const out = []
  const 최대 = Math.max(...두께들) * 1.05
  for (let i = 0; i < 선.length; i++) {
    const p = 선[i]
    for (let j = i + 1; j < 선.length; j++) {
      const q = 선[j]
      if (q.a - p.a > 0.004) break
      /* 🧭 G252 각이 1e-15 쯤 다른 두 선은 «각 → 자리» 차례가 뒤바뀌어 q 가 p 보다 아래일 수 있음(gap 음수) — 현장 A 1층 아래쪽 바깥벽 7.1 m 를 못 잡았음. 절댓값 · 위아래 정렬 */
      const gap = Math.abs(q.o - p.o), o0 = Math.min(p.o, q.o), o1 = Math.max(p.o, q.o)
      if (gap > 최대) continue
      const 두 = 두께들.find((t) => Math.abs(gap - t) <= Math.max(3, t * 0.03))
      if (!두) continue
      const t0 = Math.max(p.t0, q.t0), t1 = Math.min(p.t1, q.t1)
      if (t1 - t0 < 300) continue
      /* 두 선 사이(벽 속)에 나란한 선이 지나면 벽이 아님(두꺼운 것의 일부) */
      if (선.some((r) => r !== p && r !== q && Math.abs(r.a - p.a) < 0.004 && r.o > o0 + 5 && r.o < o1 - 5 && Math.min(r.t1, t1) - Math.max(r.t0, t0) > 100)) continue
      const ux = Math.cos(p.a), uy = Math.sin(p.a), nx = -uy, ny = ux
      const oc = (p.o + q.o) / 2, tc = (t0 + t1) / 2
      const px = ux * tc + nx * oc, py = uy * tc + ny * oc
      /* 기둥 상자 속(기둥 테두리의 두 변)은 뺌 */
      if (기둥상자.some((b) => px > b[0] - 5 && px < b[2] + 5 && py > b[1] - 5 && py < b[3] + 5)) continue
      out.push({ ux, uy, nx, ny, px, py, g: 두, 점수: 0, 층들: new Set([p.ly, q.ly]), 다른폭: false, t0, t1 })
    }
  }
  return out
}
/**
 * 🧭 G249 줄 그은 벽체 일람표 — 칸을 합친 표(현장 A S-601 «RC벽체 일람표»: NAME · THK 한 칸이 층 줄 넷을 덮고, 수직근 · 수평근 칸도 층 줄 몇 개를 덮음)
 *   머리 «NAME(부호) · STORY(층) · THK(두께) · 수직근(EXT · INT) · 수평근(EXT · INT)» 아래 글자마다 제 칸(위아래 가로 줄 사이)을 잡고,
 *   층 칸(STORY 열 글자) 하나하나를 한 줄로 — 그 층 칸 가운데를 덮는 이름 · 두께 · 수직 · 수평 칸의 값. 줄 없는 표는 건너뜀(예전 읽기)
 * @returns {줄: [{g(이름 글), 기, 범위, 두께, 수직, 수평}], 쓴: Set(글자 i)}
 */
function 격자벽표(D) {
  const 줄 = [], 쓴 = new Set()
  const 판 = (g) => (D.도곽 && D.도곽.length ? D.도곽번(g.x, g.y) : -1)
  for (const h of D.글자) {
    if (쓴.has(h.i) || !역할들(h.s).has('부호')) continue
    const H = h.h, p0 = 판(h)
    const 역 = (g) => 역할들(g.s)
    /* 머리 줄 — 같은 줄(두 줄 머리 «STORY / (Floor)» 까지 ±1.6 글자) · 오른쪽 다음 표(다음 «NAME · MEMBER» 머리) 앞까지 · 기호나 철근 값 글은 아님 */
    const 옆머리 = D.글자.filter((g) => g !== h && Math.abs(g.y - h.y) <= 1.6 * H && g.x > h.x + 2 * H && 판(g) === p0 && 역(g).has('부호')).map((g) => g.x).sort((a, b) => a - b)[0]
    const 오끝 = 옆머리 !== undefined ? 옆머리 - 2 * H : h.x + 150 * H
    const 띠 = D.글자.filter((g) => Math.abs(g.y - h.y) <= 1.6 * H && g.x >= h.x - 3 * H && g.x < 오끝 && 판(g) === p0 && Math.abs(g.h - H) <= 0.6 * H &&
      !기호칸(g.s) && !토막들(g.s).some((x) => x.k === '개수' || x.k === '간격' || x.k === '두께'))
    if (!띠.some((g) => 역(g).has('두께') || 역(g).has('크기'))) continue
    const 판이름 = p0 >= 0 ? (D.판제목 || [])[p0] || '' : ''
    /* 벽 표 — 수직 · 수평 머리, 판 이름 «벽 · WALL», 또는 표 위 이름(«■ RC WALL LIST») */
    const 표이름 = D.글자.some((g) => g.y > h.y && g.y - h.y < 8 * H && Math.abs(g.x - h.x) < 40 * H && /WALL|벽체|벽\s*일람/i.test(g.s))
    if (!띠.some((g) => 역(g).has('수직') || 역(g).has('수평')) && !/벽|WALL/i.test(판이름) && !표이름) continue
    /* 열 — x 가 가까운 머리 글(두 줄 머리 «STORY / (Floor)»)은 한 열. 아래에 열이 둘 넘게 든 머리(«수직근» 밑 EXT · INT)는 묶음 머리 */
    const 열들 = []
    for (const g of 띠.slice().sort((a, b) => a.x - b.x)) { const c = 열들.find((o) => Math.abs(o.x - g.x) <= 1.5 * H); if (c) { c.들.push(g); c.역 = new Set([...c.역, ...역(g)]) } else 열들.push({ x: g.x, 들: [g], 역: new Set(역(g)) }) }
    for (const c of 열들) { c.위 = Math.max(...c.들.map((g) => g.y)); c.밑 = Math.min(...c.들.map((g) => g.y)) }
    const 묶음 = 열들.filter((c) => 열들.filter((o) => o !== c && o.위 < c.밑 - 0.8 * H && Math.abs(o.x - c.x) < 12 * H).length >= 2)
    let 잎 = 열들.filter((c) => !묶음.includes(c))
    for (const c of 잎) {
      if (c.역.has('수직') || c.역.has('수평')) continue
      const 위것 = 묶음.filter((m) => m.밑 > c.위 + 0.8 * H).sort((a, b) => Math.abs(a.x - c.x) - Math.abs(b.x - c.x))[0]
      if (위것 && Math.abs(위것.x - c.x) < 12 * H) { if (위것.역.has('수직')) c.역.add('수직'); if (위것.역.has('수평')) c.역.add('수평') }
    }
    잎 = 잎.sort((a, b) => a.x - b.x)
    const 부열 = 잎.findIndex((c) => c.역.has('부호')), 층열 = 잎.findIndex((c) => c.역.has('층') && !c.역.has('부호'))
    let 두열 = 잎.findIndex((c) => c.역.has('두께')); if (두열 < 0) 두열 = 잎.findIndex((c) => c.역.has('크기'))
    const 직열 = 잎.findIndex((c) => c.역.has('수직')), 평열 = 잎.findIndex((c) => c.역.has('수평'))
    /* 🧭 G281 «C : 단부보강근 (V)» 열(현장 B S-401) — 개수 꼴 철근(«4-HD13») = 벽 끝 수직 보강근 */
    const 단열 = 잎.findIndex((c) => c.역.has('단부') && !c.역.has('수직') && !c.역.has('수평') && !c.역.has('부호') && !c.역.has('두께'))
    if (부열 < 0 || 두열 < 0) continue
    const 경 = 잎.map((c, i) => [i ? (잎[i - 1].x + c.x) / 2 : c.x - 6 * H, i < 잎.length - 1 ? (c.x + 잎[i + 1].x) / 2 : c.x + 6 * H])
    const 열번 = (g) => 경.findIndex(([a, b]) => g.x > a && g.x <= b)
    const 머리밑 = Math.min(...띠.map((g) => g.y - g.h / 2))
    const x0 = 경[0][0], x1 = Math.min(경[경.length - 1][1], 오끝)
    /* 표 아래 끝 — 머리 아래로 가로 줄(표 폭의 40 % 넘게)이 25 글자 안으로 이어지는 데까지 · 다음 «NAME» 머리 위까지(표 밑 평면 글자를 표 값으로 먹지 않게) */
    const 다음머리 = D.글자.filter((g) => g !== h && g.y < 머리밑 && Math.abs(g.x - h.x) <= 2 * H && 역(g).has('부호') && 판(g) === p0).map((g) => g.y).sort((a, b) => b - a)[0]
    const 밑끝0 = 다음머리 !== undefined ? 다음머리 + 2 * H : (p0 >= 0 ? D.도곽[p0][1] : 머리밑 - 400 * H)
    const 가로0 = []
    for (const s2 of D.찾기(x0, 밑끝0, x1, 머리밑 + H)) {
      const dx = D.sx1[s2] - D.sx0[s2], dy = D.sy1[s2] - D.sy0[s2], L = Math.hypot(dx, dy)
      if (L < 2 * H || Math.abs(dy) > 0.01 * L) continue
      const y = (D.sy0[s2] + D.sy1[s2]) / 2
      if (y < 밑끝0 || y > 머리밑 + H) continue
      가로0.push({ y, a: Math.min(D.sx0[s2], D.sx1[s2]), b: Math.max(D.sx0[s2], D.sx1[s2]) })
    }
    const 주 = D.주석가로 || []
    for (let q = 0; q < 주.length; q += 3) { const y = 주[q], a = 주[q + 1], b = 주[q + 2]; if (y >= 밑끝0 && y <= 머리밑 + H && b >= x0 && a <= x1 && b - a >= 2 * H) 가로0.push({ y, a, b }) }
    const 폭 = x1 - x0
    const 긴줄 = 가로0.filter((l) => Math.min(l.b, x1) - Math.max(l.a, x0) >= 0.4 * 폭).map((l) => l.y).sort((a, b) => b - a)
    let 밑 = null
    for (const y of 긴줄) { if (y > 머리밑 + H) continue; if (밑 === null ? 머리밑 - y <= 25 * H : 밑 - y <= 25 * H) 밑 = y; else if (밑 !== null) break }
    if (밑 === null) continue
    const 몸 = D.글자.filter((g) => g.y < 머리밑 && g.y > 밑 && g.x > x0 && g.x <= x1 && 판(g) === p0 && Math.abs(g.h - H) <= 0.6 * H)
    if (!몸.length) continue
    const 가로 = 가로0.filter((l) => l.y >= 밑 - 1)
    if (가로.length < 3) continue
    const 칸 = (g) => {
      let 위 = Infinity, 아래 = -Infinity
      /* 글자 가운데를 지나는 선(표 뒤 그림 선 · 밑줄)은 칸 경계가 아님 */
      for (const l of 가로) { if (g.x < l.a - 0.2 * H || g.x > l.b + 0.2 * H || Math.abs(l.y - g.y) < 0.35 * g.h) continue; if (l.y > g.y && l.y < 위) 위 = l.y; if (l.y < g.y && l.y > 아래) 아래 = l.y }
      if (!Number.isFinite(위) || !Number.isFinite(아래) || 위 - 아래 > 60 * H) return null
      return [아래, 위]
    }
    const 열글 = (k) => 몸.filter((g) => 열번(g) === k).map((g) => ({ g, c: 칸(g) })).filter((x) => x.c)
    const 부들 = 열글(부열), 층들 = 층열 >= 0 ? 열글(층열) : [], 두들 = 열글(두열), 직들 = 직열 >= 0 ? 열글(직열) : [], 평들 = 평열 >= 0 ? 열글(평열) : [], 단들 = 단열 >= 0 ? 열글(단열) : []
    const 덮 = (arr, y) => arr.filter((x) => x.c[0] <= y && x.c[1] >= y).sort((a, b) => Math.abs(a.g.y - y) - Math.abs(b.g.y - y))[0] || null
    let 됨 = 0
    /* 줄 = 층 칸마다(층 열이 없는 표 «RC WALL LIST» 는 이름 칸마다 · 모든 층) */
    /* 층 열이 없으면 이름 글마다(한 칸에 이름 줄이 둘 — «CW1,CW3,CW4 / CW5,CW6,CW9» 가 «THK = 300mm» 한 칸을 같이 씀) 그 글 높이로 */
    const 줄칸 = 층열 >= 0 ? 층들.map((x) => ({ 범: 범위풀이(x.g.s), y: (x.c[0] + x.c[1]) / 2 })) : 부들.map((x) => ({ 범: { 전체: true }, y: x.g.y, n: x }))
    for (const { 범, y, n: n0 } of 줄칸) {
      if (!범) continue
      const n = n0 || 덮(부들, y)
      if (!n) continue
      const 기들 = 기호들(n.g.s)
      if (!기들.length || !기들.every((x) => x.종류 === '벽')) continue
      const t = 덮(두들, y)
      const 두께 = t ? (+(/^\d{2,4}$/.exec(t.g.u) || [])[0] || ((토막들(t.g.s).find((x) => x.k === '두께') || {}).t) || 0) : 0
      const 간 = (x) => { if (!x) return ''; const k2 = 토막들(x.g.s).find((v) => v.k === '간격'); return k2 ? 간글(k2) : '' }
      const 직 = 간(덮(직들, y)), 평 = 간(덮(평들, y))
      const 단x = 덮(단들, y), 단k = 단x ? 토막들(단x.g.s).find((v) => v.k === '개수') : null
      /* 두께 칸이 빈 벽(현장 A CW9 — 두께는 평면의 «RC WALL LIST» 에만)은 철근만 — 두께는 같은 기호의 다른 정의로 채움 */
      if (!두께 && !직 && !평) continue
      for (const 기 of 기들) 줄.push({ g: n.g, 기, 범위: 범.전체 ? null : 범, 두께, 수직: 직, 수평: 평, ...(단k ? { 단부: 개글(단k) } : {}) })
      됨++
    }
    if (!됨) continue
    for (const g of [...띠, ...몸]) 쓴.add(g.i)
  }
  return { 줄, 쓴 }
}

function 일람표읽기(도면들, 경고0) {
  /* 🧭 G241 읽다가 난 «X 일람표 «W3» 에서 … 못 찾았습니다» 는 끝에 — 같은 기호를 다른 데(일람표 판)에서 읽었으면 알리지 않음 */
  const 경고 = []
  const 정의 = []
  const 철골 = new Map()        // 기호 → {기호, 종류, 규격} — 철골 부재(철근콘크리트 셈에서 뺌)
  const 쓴글자 = new Set()      // 일람표에 쓰인 글자(평면 기호로 세지 않게) — '번:i'
  for (const D of 도면들) {
    const 토 = [], 머리 = [], 기후 = [], 층머리 = [], 부호머리 = []
    let m레 = null
    /* 🧭 G249 줄 그은 벽체 일람표(칸 합침)는 따로 읽고 그 글자는 아래 예전 표 읽기에서 뺌 */
    const 격 = 격자벽표(D)
    for (const z of 격.줄) {
      const r = { 기호: z.기.기호, 두께: z.두께 ? String(z.두께) : '', 수직: z.수직, 수평: z.수평 || z.수직, 배근: '복배근', 구분: '구조벽', 단부보강: z.단부 || '', 상부보강: '', 단부전단: '', 단위철근: '', 동: '' }
      if (!r.수직) r.수직 = r.수평
      정의.push({ 종류: '벽', 기호: z.기.기호, 몸: z.기.몸, 층표: z.기.층표, r, 범위: z.범위, 명시: !!z.범위, 번: D.번, g: z.g, 근거: { 번: D.번, i: z.g.i, 글: z.g.s }, 목록판: true, 평면판: false })
    }
    for (const i of 격.쓴) 쓴글자.add(D.번 + ':' + i)
    for (const g of D.글자) {
      if (격.쓴.has(g.i)) continue
      /* 🛠 G118 — 평면의 「G1(400X700)」 꼴도 기호로 봄(값 토막으로 보면 가까운 일람표가 가져가 평면에서 빠졌음) */
      const 평 = 기호칸(g.s) ? null : 평면기호(g.s)
      const 칸 = 기호칸(g.s) || (평 ? { 기호들: [평], 범위: null } : null)
      if (칸) { 기후.push({ g, 기: 칸.기호들, 범위: 칸.범위 }); if (칸.두께) 토.push({ g, tk: [{ k: '두께', t: 칸.두께 }], 역: new Set(['두께']) }); continue }
      const tk = 토막들(g.s)
      const 역 = 역할들(g.s)
      const 범 = /[~∼]|^(ALL|전층|공통|B?\d{1,2}F|B\d{1,2}|R|RF|PH|PHR|옥상|지붕)$/i.test(붙(g.s)) ? 범위풀이(g.s) : null
      if (범) { 층머리.push({ g, 범 }); continue }
      /* 🧭 G265 «+» 도 지움 — «HD16+19 @100(V)» 의 «(V)» 를 수직으로(예전엔 «+V» 가 남아 역할 없음) */
      if (tk.length) 토.push({ g, tk, 역: 역할들(g.s.replace(/[\d@\-X×*=.,+]+|[A-Z]{0,3}D\d{2}/gi, '')) })
      else if (역.size) { 머리.push({ g, 역 }); if (역.has('부호')) 부호머리.push(g) }
      else if (/^(\d{1,2},\d{3}|\d{2,4})$/.test(g.u)) 토.push({ g, tk: [{ k: '숫자', v: +g.u.replace(/,/g, '') }], 역: new Set() })
      /* 🧭 G282 «150mm» — 단위 붙은 숫자 칸(현장 B S-451 데크 일람 «SLAB THK.» 칸 — 못 읽어 UDS1 ~ 3 두께를 «흔한 두께» 로 채웠음) */
      else if (/^(\d{2,4})MM$/.test(g.u)) 토.push({ g, tk: [{ k: '숫자', v: +/^(\d{2,4})MM$/.exec(g.u)[1] }], 역: new Set() })
      /* 🧭 G241 높이 표(«-1500» · «±0.000» · «EL-550») — 기초 상세 단면에서 두께(가장 낮은 두 높이 차)를 읽으려고 */
      else if ((m레 = /^(?:EL\.?|FL\.?|GL\.?)?\s*([-+±])\s*(\d{1,2},?\d{3}|\d{1,4}(?:[.,]\d{1,3})?)$/i.exec(붙(g.s)))) {
        const 수 = m레[2].includes('.') ? +m레[2].replace(',', '') * 1000 : +m레[2].replace(',', '')
        if (Number.isFinite(수)) 토.push({ g, tk: [{ k: '레벨', v: m레[1] === '-' ? -수 : 수 }], 역: new Set() })
      }
    }
    if (!기후.length) continue
    // 표 안 기호(«MEMBER»·«부호»·«구 분» 머리 아래 기호 열) — 값을 못 읽어도 평면 기호로 세지 않음. 이런 기호는 «왼쪽 이름표»(줄·덩이의 왼쪽)
    const 열머리 = 머리.filter((h) => h.역.has('부호') || h.역.has('위치')).map((h) => h.g)
    const 같은열 = (h, c) => Math.abs(h.x - c.g.x) <= Math.max(h.w, c.g.w) / 2 + 6 * c.g.h || Math.abs(h.x0 - c.g.x0) <= 3 * c.g.h
    for (const c of 기후) {
      if (열머리.some((h) => h.y > c.g.y && h.y - c.g.y < 60 * c.g.h && 같은열(h, c))) { c.표안 = true; 쓴글자.add(D.번 + ':' + c.g.i) }
    }
    // 같은 왼쪽 끝(x0)으로 줄지어 선 기호들 — 하나가 표 안이면 붙어 있는 이웃(세로 간격 6줄 안)도 표 안(짧은 기호는 머리 가운데에서 멀어 못 잡힘)
    for (let 바뀜 = true; 바뀜;) {
      바뀜 = false
      for (const c of 기후) {
        if (c.표안) continue
        if (기후.some((o) => o.표안 && Math.abs(o.g.x0 - c.g.x0) <= 2 * c.g.h && Math.abs(o.g.y - c.g.y) <= 6 * c.g.h && Math.abs(o.g.h - c.g.h) < 0.2 * c.g.h)) { c.표안 = true; 쓴글자.add(D.번 + ':' + c.g.i); 바뀜 = true }
      }
    }
    if (!토.length) continue
    /* 🧭 G265 벽 단면 그림 일람표의 칸 머리(현장 B S-401 «옹벽 일람표 - 4» RW1 · RW2 · DW1 — 칸마다 단면 · 입면 그림 · 현장 A S-611 «BW1 (THK=300mm)»):
         머리가 줄 그은 칸의 맨 위 줄에 홀로 있고(제 줄 오른쪽 값 없음) 칸 안에 철근 글이 있으면 그 칸의 글이 모두 제 것(`제칸`).
         예전: 머리에서 멀어(현장 A — 30 글자 넘게) 일람 기호로 안 잡히거나 이웃 칸 머리가 값을 가져가 «만든» 값이 됐음 */
    for (const c of 기후) {
      if (c.표안 || c.칸 || !c.기.every((x) => x.종류 === '벽')) continue
      if (토.some((t) => t.g !== c.g && Math.abs(t.g.y - c.g.y) <= 0.6 * Math.max(c.g.h, t.g.h) && t.g.x > c.g.x && t.g.x - c.g.x <= 40 * c.g.h)) continue
      const 칸0 = 제칸(D, c.g)
      if (!칸0) continue
      const 든 = 토.filter((t) => !t.칸주인 && (t.g === c.g || (t.g.x > 칸0[0] && t.g.x < 칸0[2] && t.g.y < 칸0[3] && t.g.y > 칸0[1])))
      if (든.length < 2 || !든.some((t) => t.tk.some((x) => x.k === '간격' || x.k === '개수'))) continue
      /* 칸 안에 다른 벽 머리(같은 크기 글)가 있으면 칸이 아님(줄 표) */
      if (기후.some((o) => o !== c && o.g.x > 칸0[0] && o.g.x < 칸0[2] && o.g.y < 칸0[3] && o.g.y > 칸0[1] && Math.abs(o.g.h - c.g.h) <= 0.25 * c.g.h && o.기.every((x) => x.종류 === '벽'))) continue
      c.칸 = true; c.칸쪽 = [칸0[0], 칸0[1], 칸0[2], c.g.y]; c.벽칸 = true
      for (const t of 든) t.칸주인 = c
    }
    /* 🧭 G241 기초 상세 판 칸 — 판 이름이 상세 · 일람 · LIST · SCHEDULE 인 판(현장 C · D 토목 «FOOTING DETAIL PLAN & SECTION-1 ~ 14»)에서
         기초 기호 머리(F1 · F2 … — 기초마다 평면 · 단면 그림을 한 칸에 그리고 «2400X2400» 같은 표 글자가 없음)마다 제 칸의 글자가 제 것:
         같은 줄 머리가 여럿이면 옆 머리와의 가운데까지(세로 칸 — 판 1 «F1 · F2 · F3 · F4»), 홀로면 판 폭 전체(가로 띠 — 판 10 «F30» / «F31»),
         아래로는 다음 머리 줄까지(없으면 판 아래 끝). 보 · 기둥 일람표 · 평면(현장 B «기초 구조 확대평면도» 의 MF1)은 예전 표 읽기 그대로 */
    if (D.도곽 && D.도곽.length) {
      const 기초일람제목 = D.글자.filter((t) => /기초\s*(?:일람|상세)|FOOTING\s*(?:LIST|SCHEDULE|DETAIL)|FOUNDATION\s*(?:LIST|SCHEDULE)/i.test(t.s) && !/^\s*[([]?\d+(?:\.\d+)*\s*[.)]/.test(t.s))
      const 판별 = new Map()
      for (const c of 기후) {
        /* 기초 머리(F1 하나) · 보 · 기둥 머리(«C1,C4» 처럼 여럿도) — 보 · 기둥 칸은 철근 글자가 하나도 없는 «크기 그림만» 칸일 때만(아래) */
        const 종0 = c.기[0].종류
        /* 표 칸 머리(표안)도 — 현장 C · D BEAM LIST 의 첫 칸 «C1,C4» · «B1» 은 왼쪽 끝이 줄지어 표안으로 잡혔음(칸 읽기는 아래 철근 글자 조건으로 거름) */
        if (!(종0 === '기초' ? c.기.length === 1 : (종0 === '보' || 종0 === '기둥') && c.기.every((x) => x.종류 === 종0))) continue
        let 판i = D.도곽번(c.g.x, c.g.y)
        /* 🧭 G275 기초 머리가 판 테두리 바로 위(현장 B S-401 «■ 기초 일람표» · «MF1» — 판 위 240 mm) · 판 이름이 비었어도 바로 위 · 왼쪽에 기초 일람 제목 글이 있으면 그 아래 판 */
        const 제목곁 = 종0 === '기초' && 기초일람제목.some((t) => t.y >= c.g.y - c.g.h && t.y - c.g.y <= 8 * c.g.h && c.g.x - t.x >= -2 * c.g.h && c.g.x - t.x <= 40 * c.g.h)
        if (판i < 0 && 제목곁) 판i = D.도곽번(c.g.x, c.g.y - 3 * c.g.h)
        const 판이름 = (D.판제목 || [])[판i] || ''
        if (판i < 0 || !(/DETAIL|상세|일람|LIST|SCHEDULE|배근도/i.test(판이름) || 제목곁)) continue
        /* 보 · 기둥 칸은 기초 상세 판이 아닌 곳에서만(기초 상세 판 속 보 이름표 «B1c» 를 보 칸으로 보지 않게) */
        if (종0 !== '기초' && (/FOOTING|FOUNDATION|기초/i.test(판이름) || !/LIST|SCHEDULE|일람|단면\s*상세|SECTION\s*DETAIL|배근도/i.test(판이름))) continue
        const 열 = 판i + '|' + 종0
        let a = 판별.get(열); if (!a) { a = []; 판별.set(열, a) } a.push(c)
      }
      /* 머리는 판 · 종류마다 가장 흔한 글자 높이(±25 %)만 — 칸 속 큰 «B1» «B2»(고친 자리 표시)는 머리가 아님.
           칸 아래 끝 = 아래쪽 다음 머리 줄(이 머리 글자 높이의 75 % 넘는 것만 — 기초 상세 판 속 작은 보 이름표 «B1» 는 줄로 안 봄) */
      const 판모음 = new Map()
      for (const [열, 들0] of 판별) {
        const 판i = +열.split('|')[0]
        const hs = 들0.map((c) => c.g.h).sort((a2, b2) => a2 - b2)
        let 흔h = hs.reduce((best, h) => { const n = hs.filter((x) => Math.abs(x - h) <= 0.25 * h).length; return n > best.n ? { h, n } : best }, { h: hs[0], n: 0 }).h
        /* 🧭 G242 기초 머리: 더 큰 글자 셋 넘게가 한 줄에 나란하면(8배 넘게 띄어) 그 줄이 머리 — 현장 D 기초 상세 판: 머리 «F8 · F9 · F10»(225) 보다
             그림 속 이름표(150)가 더 많아 이름표를 머리로 봤음. 보 · 기둥은 그대로(현장 C · D BEAM LIST 의 큰 «B1» 은 고친 자리 표시) */
        if (열.endsWith('|기초')) {
          const 큰것 = 들0.filter((c) => c.g.h > 흔h * 1.25)
          const 줄h = []
          for (const c of 큰것) { const 같 = 큰것.filter((o) => Math.abs(o.g.y - c.g.y) <= 0.6 * c.g.h && Math.abs(o.g.h - c.g.h) <= 0.25 * c.g.h).sort((p, q) => p.g.x - q.g.x); if (같.length >= 3 && 같.slice(1).every((o, i) => o.g.x - 같[i].g.x >= 8 * c.g.h)) 줄h.push(c.g.h) }
          if (줄h.length) 흔h = Math.max(...줄h)
        }
        const a = 판모음.get(판i) || []
        for (const c of 들0) if (Math.abs(c.g.h - 흔h) <= 0.25 * 흔h) a.push(c)
        판모음.set(판i, a)
      }
      for (const [판i, 머리들] of 판모음) {
        const [px0, py0, px1] = D.도곽[판i]
        const 줄들 = []
        for (const c of 머리들.slice().sort((p, q) => q.g.y - p.g.y)) {
          const 줄 = 줄들.find((z) => Math.abs(z.y - c.g.y) <= 0.6 * c.g.h && Math.abs(z.h - c.g.h) <= 0.25 * c.g.h)
          if (줄) 줄.들.push(c); else 줄들.push({ y: c.g.y, h: c.g.h, 들: [c] })
        }
        for (const z of 줄들) z.들.sort((p, q) => p.g.x - q.g.x)
        /* 같은 줄에 붙어 선 기호(글자 높이 15배 안)는 머리가 아님(그림 속 이름표) — 🧭 G242 기초 머리 줄만 8배: 현장 D 기초 상세 판 «F8 · F9 · F10» 은
             한 상세에 함께 그려 2 m(글자 225 의 8.9배) 띄움(아래 «함께 그린 기초»). 보 · 기둥 줄은 15배 그대로(시험 예시 c · d 의 표 머리) */
        const 머리줄 = 줄들.filter((z) => z.들.length < 2 || Math.min(...z.들.slice(1).map((c, i) => c.g.x - z.들[i].g.x)) >= (z.들.every((c) => c.기[0].종류 === '기초') ? 8 : 15) * z.h)
        /* 🧭 G242 옆 칸과의 경계 = 두 머리 사이에 그은 긴 세로 선(칸 높이 절반 넘게 · 머리 줄 높이까지 올라옴 · 두 머리 사이 가운데 20 ~ 80 %) — 없으면 가운데.
             현장 D 기초 상세 판: «F7» 칸과 «F8 · F9 · F10» 칸의 경계 선이 가운데보다 1.5 m 왼쪽이라 가운데로 나누면 옆 칸 단면 치수 «1550» 이 F7 것이 됐음 */
        const 가름 = (a, b, 없음 = null) => {
          const 가운데 = (a.g.x + b.g.x) / 2, 높 = a.g.y - py0, 폭 = b.g.x - a.g.x
          let best = null, bd = Infinity
          for (const s2 of D.찾기(a.g.x + 0.2 * 폭, py0, a.g.x + 0.8 * 폭, a.g.y)) {
            const L = Math.abs(D.sy1[s2] - D.sy0[s2]), x = (D.sx0[s2] + D.sx1[s2]) / 2
            if (L < 0.5 * 높 || Math.abs(D.sx1[s2] - D.sx0[s2]) > 0.01 * L || x < a.g.x + 0.2 * 폭 || x > a.g.x + 0.8 * 폭) continue
            if (Math.max(D.sy0[s2], D.sy1[s2]) < a.g.y - 3 * a.g.h) continue
            if (Math.abs(x - 가운데) < bd) { bd = Math.abs(x - 가운데); best = x }
          }
          return best === null ? (없음 === null ? 가운데 : 없음) : best
        }
        /* 🧭 G406 줄 끝 칸(맨 왼쪽 · 맨 오른쪽)의 바깥 경계 = 옆 칸 폭만큼 바깥에 그은 표 세로 선 — 없을 때만 판 끝(예전).
             현장 P① BEAM LIST «B7j»(줄 맨 끝 칸): 판 끝까지 보니 옆 그림(H-BEAM 상세)의 철근 글 «HD25@150» 이 들어 표 줄로 보고 칸을 안 읽었음
             → 도면에 그린 동그라미 18개(D25)를 못 셌음 */
        const 끝왼 = (z, i) => (z.들.length > 1 ? Math.max(px0, 가름({ g: { x: 2 * z.들[i].g.x - z.들[i + 1].g.x, y: z.들[i].g.y, h: z.들[i].g.h } }, z.들[i], px0)) : px0)
        const 끝오 = (z, i) => (i > 0 ? Math.min(px1, 가름(z.들[i], { g: { x: 2 * z.들[i].g.x - z.들[i - 1].g.x } }, px1)) : px1)
        for (const z of 머리줄) {
          const 칸밑 = (왼, 오) => { const 밑줄 = 머리줄.filter((o) => o !== z && o.h >= 0.75 * z.h && o.y < z.y - 2 * z.h && o.들.some((d) => d.g.x > 왼 && d.g.x < 오)).sort((p, q) => q.y - p.y)[0]; return 밑줄 ? 밑줄.y + 2 * 밑줄.h : py0 }
          /* 🧭 G242 한 상세에 함께 그린 기초 — 같은 줄 기초 머리가 15배 안으로 붙어 서면(현장 D «F8 · F9 · F10»: 평면 하나에 기초 셋 · 단면 넷)
               세로로 나눈 칸이 그림과 맞지 않음(F9 칸에 F10 평면 치수 «8000» 이 들어 8000X8000 이 됐었음). 기초마다 «제 이름표(오각형 속 F9)만 든 단면» 의
               글자가 그 기초 것 — 폭 = 그 단면 위 가장 큰 가로 치수(평면은 정사각으로 짐작) · 두께 = 그 단면의 높이 글자. 그런 단면이 없는 기초가 있으면 예전처럼 나눠 읽고 알림 */
          const 무리들 = []
          for (const c of z.들) { const m = 무리들[무리들.length - 1]; if (m && c.기[0].종류 === '기초' && m[0].기[0].종류 === '기초' && c.g.x - m[m.length - 1].g.x < 15 * z.h) m.push(c); else 무리들.push([c]) }
          const 함께한 = new Set()
          for (const m of 무리들) {
            if (m.length < 2) continue
            const i0 = z.들.indexOf(m[0]), i1 = z.들.indexOf(m[m.length - 1])
            const 왼 = i0 ? 가름(z.들[i0 - 1], m[0]) : 끝왼(z, i0)
            const 오 = i1 < z.들.length - 1 ? 가름(m[m.length - 1], z.들[i1 + 1]) : 끝오(z, i1)
            const 밑 = 칸밑(왼, 오), 위 = Math.min(...m.map((c) => c.g.y - 0.5 * c.g.h))
            const 안 = (g) => g.x > 왼 && g.x <= 오 && g.y < 위 && g.y > 밑
            const 든 = 토.filter((t) => !t.칸주인 && 안(t.g) && !(t.g.s.length > 24 && /^\s*(\(?\d{1,2}[).]|※|\*)|[가-힣](은|는|을|를|으로|할\s*것)/.test(t.g.s)))
            const 보기들 = D.글자.filter((g2) => 안(g2) && /^(PLAN|SECTION|평면|단면|평면도|단면도)$/.test(g2.u)).map((g2) => ({ 종: /PLAN|평면/.test(g2.u) ? '평면' : '단면', x: g2.x, y: g2.y }))
            /* 글자의 그림 = 아래쪽(그림 이름은 그림 밑)에서 가장 가까운 그림 이름 — 아래에 없을 때만 위쪽도 */
            const 보기번 = (g) => {
              let best = -1, bd = Infinity
              보기들.forEach((v, k) => { const dy = g.y - v.y; if (dy >= 0 && Math.abs(g.x - v.x) + dy < bd) { bd = Math.abs(g.x - v.x) + dy; best = k } })
              if (best < 0) 보기들.forEach((v, k) => { const d = Math.abs(g.x - v.x) + 3 * Math.abs(g.y - v.y); if (d < bd) { bd = d; best = k } })
              return best
            }
            const 이름표 = 기후.filter((o) => !m.includes(o) && o.기.length === 1 && 안(o.g) && o.g.h < 0.9 * z.h && m.some((c) => c.기[0].기호 === o.기[0].기호))
            const 표보기 = new Map()
            for (const o of 이름표) { const k = 보기번(o.g); if (k < 0 || 보기들[k].종 !== '단면') continue; const a2 = 표보기.get(k) || []; a2.push(o); 표보기.set(k, a2) }
            const 몫 = new Map()
            let 됨 = 보기들.length > 0
            for (const c of m) {
              const 제것 = []
              for (const [k, os] of 표보기) {
                if (!os.every((o) => o.기[0].기호 === c.기[0].기호)) continue
                /* 그 단면 그림의 테두리(이름표에서 이어진 선들) + 글자 12배 — 옆 그림(평면 오른쪽 세운 치수 «1300») 글자를 안 섞게.
                     테두리에 다른 그림 이름 · 다른 이름표가 들면(그림끼리 이어진 선) 테두리는 안 씀 */
                const o = os[0]
                let 테 = 그림테두리(D, o.g.x, o.g.y, 6 * o.g.h, [왼, 밑, 오, 위])
                if (테 && (보기들.some((v, k2) => k2 !== k && v.x >= 테[0] && v.x <= 테[2] && v.y >= 테[1] && v.y <= 테[3]) || 이름표.some((p) => !os.includes(p) && p.g.x >= 테[0] && p.g.x <= 테[2] && p.g.y >= 테[1] && p.g.y <= 테[3]))) 테 = null
                const M = 12 * o.g.h
                for (const t of 든) if (보기번(t.g) === k && (!테 || (t.g.x >= 테[0] - M && t.g.x <= 테[2] + M && t.g.y >= 테[1] - M && t.g.y <= 테[3] + M))) 제것.push(t)
              }
              const 철 = 제것.filter((t) => t.tk.some((x) => x.k === '개수' || x.k === '간격')).length
              if (제것.length < 3 || !철) { 됨 = false; break }
              몫.set(c, 제것)
            }
            if (!됨) {
              경고.push('기초 «' + m.map((c) => c.g.s.trim()).join(' · ') + '» 은 한 상세에 함께 그려져(판 «' + ((D.판제목 || [])[판i] || '') + '») 크기 · 두께를 칸마다 나눠 읽었습니다 — 배근표에서 한 번 보아 주세요')
              continue
            }
            const 버림 = { 토: [], 칸: true }            // 평면 · 함께 그린 단면 글자 — 어느 기초 것인지 몰라 아무 데도 안 줌
            for (const t of 든) t.칸주인 = 버림
            for (const c of m) {
              c.칸 = true; c.함께 = true; c.칸쪽 = [왼, 밑, 오, c.g.y]
              for (const t of 몫.get(c)) { t.칸주인 = c; t.보기종 = '단면' }
              함께한.add(c)
            }
          }
          z.들.forEach((c, i) => {
            if (함께한.has(c)) return
            const 왼 = i ? 가름(z.들[i - 1], c) : 끝왼(z, i)
            const 오 = i < z.들.length - 1 ? 가름(c, z.들[i + 1]) : 끝오(z, i)
            const 밑 = 칸밑(왼, 오)
            let n = 0, 철 = 0
            const 든 = []
            for (const t of 토) {
              if (t.칸주인 || t.g.x <= 왼 || t.g.x > 오 || t.g.y >= c.g.y - 0.5 * c.g.h || t.g.y <= 밑) continue
              /* 판 아래 주의 글(«3) 조립근은 … HD16@1000 … 할것.») 은 칸 값이 아님 */
              if (t.g.s.length > 24 && /^\s*(\(?\d{1,2}[).]|※|\*)|[가-힣](은|는|을|를|으로|할\s*것)/.test(t.g.s)) continue
              든.push(t); n++
              if (t.tk.some((x) => x.k === '개수' || x.k === '간격')) 철++
            }
            /* 기초 상세 칸 = 철근 글자가 있음(HD22@100 …) · 보 · 기둥 칸 = 철근 표가 비고 단면 그림 치수만(현장 C · D BEAM LIST — 현장 A · 현장 B 일람표는 철근 글자가 있어 예전 표 읽기 그대로) */
            /* 🧭 G241 보 · 기둥 칸에 철근 글자가 있어도 같은 줄 왼쪽에 «부 호» 줄 머리가 있으면 칸 머리 — 현장 A RC보 일람표 «부 호 | (6) G14 | (6) CG1»:
                 기호 아래 칸의 BOTH · CEN 이 제 것. 기호가 칸 가운데 왼쪽에 있는 표(현장 A 기둥 일람표 «C2» — 위에 «B1F ~ 2F» 층 칸)는 예전 표 읽기 */
            const 부호줄 = () => 머리.some((h) => h.역.has('부호') && Math.abs(h.g.y - c.g.y) <= 0.8 * Math.max(c.g.h, h.g.h) && h.g.x < c.g.x && D.도곽번(h.g.x, h.g.y) === 판i)
            /* 기초 칸 머리는 제 줄(오른쪽 · 칸 안)에 값이 없음 — «F1 | 2400X2400 | 700 | D19@200» 처럼 같은 줄에 값이 있으면 줄 표(시험 예시 c · d 의 기초 일람표) */
            const 줄값 = () => 토.some((t) => Math.abs(t.g.y - c.g.y) <= 0.6 * Math.max(c.g.h, t.g.h) && t.g.x > c.g.x + c.g.w / 2 && t.g.x <= 오 && t.tk[0].k !== '레벨')
            if (c.기[0].종류 === '기초' ? n < 3 || 철 < 1 || 줄값() : n < 2 || (철 > 0 && !부호줄())) return
            c.칸 = true; c.칸쪽 = [왼, 밑, 오, c.g.y]
            for (const t of 든) t.칸주인 = c
            /* 칸 안 그림 이름(«PLAN» · «SECTION» · 평면 · 단면) — 글자마다 바로 아래(가로로 가까운) 그림 이름의 그림에 든 것으로:
                 평면 치수(가로 · 세로)는 평면 그림 글자만, 높이는 단면 그림 글자 — 가로 띠 판(평면 옆에 단면)에서 단면 치수 «2100» 이 섞이지 않게 */
            const 보기들 = D.글자.filter((g2) => g2.x > 왼 && g2.x <= 오 && g2.y < c.g.y && g2.y > 밑 && /^(PLAN|SECTION|평면|단면|평면도|단면도)$/.test(g2.u))
              .map((g2) => ({ 종: /PLAN|평면/.test(g2.u) ? '평면' : '단면', x: g2.x, y: g2.y, h: g2.h }))
            if (보기들.some((v) => v.종 === '평면')) {
              c.보기 = true
              for (const t of 든) {
                let best = null, bd = Infinity
                for (const v of 보기들) {
                  /* 그림 이름은 보통 그림 아래 — 위에 있는 이름은 3배로 멀게(판 10: 평면 밑 치수 «1600» 은 오른쪽 위의 «PLAN» 것) */
                  const dy = t.g.y - v.y
                  const d = Math.abs(t.g.x - v.x) + (dy >= 0 ? dy : -3 * dy)
                  if (d < bd) { bd = d; best = v }
                }
                t.보기종 = best ? best.종 : ''
              }
            }
          })
        }
      }
    }
    // 기호 후보마다: 반경 안 값 토막 수
    const 후보 = []
    for (const c of 기후) {
      // 표 밖 기호는 둘레에 철근 글자가 있고 값 토막이 둘 넘어야 일람표 — 평면 기호 곁의 개구부 크기 글자 하나로 속지 않게
      const R = 30 * c.g.h
      let n = 0, 철 = 0
      for (const t of 토) {
        if (t.tk[0].k === '숫자' || t.tk[0].k === '레벨' || Math.abs(t.g.x - c.g.x) > R || Math.abs(t.g.y - c.g.y) > R) continue
        n++
        if (t.tk.some((x) => x.k === '개수' || x.k === '간격')) 철++
      }
      if (c.표안 || c.칸 || (n >= 2 && 철 >= 1)) 후보.push(c)
    }
    if (!후보.length) continue
    /* 왼쪽 이름표 기호(표안) — 같은 열의 위아래 기호·머리 사이가 그 기호의 칸(세로 범위). 오른쪽의 토막은 그 칸에 든 기호 것 */
    /* 🧭 G241 표의 값은 같은 판(도곽)의 기호 것 — 현장 C · D 토목: BEAM LIST-2 의 큰 «B4»(고친 자리 표시 · 글자 높이 450 → 90배 = 40 m)가
         옆 판 WALL & SLAB LIST 의 W1 ~ W5 줄 값을 다 가져가 벽 두께 · 철근을 못 읽었음 */
    const 판번 = (g) => (g._판 !== undefined ? g._판 : (g._판 = D.도곽 && D.도곽.length ? D.도곽번(g.x, g.y) : -1))
    /* 서로 남남인 판일 때만(한 판이 다른 쪽 글자를 품으면 같은 판 — 판 속 작은 네모 · 판 밖 글자는 따지지 않음) */
    const 품 = (f, g) => g.x >= f[0] && g.x <= f[2] && g.y >= f[1] && g.y <= f[3]
    const 딴판 = (c, t) => { const a = 판번(c.g), b = 판번(t.g); return a !== b && a >= 0 && b >= 0 && !품(D.도곽[a], t.g) && !품(D.도곽[b], c.g) }
    const 왼쪽들 = 후보.filter((c) => c.표안 && !c.칸)          // 🧭 G241 상세 칸 머리는 제 칸 글자만(표의 왼쪽 이름표 읽기 안 함)
    for (const c of 왼쪽들) {
      const h0 = c.g.h
      const 열 = 왼쪽들.filter((o) => Math.abs(o.g.x - c.g.x) <= 3 * h0 || Math.abs(o.g.x0 - c.g.x0) <= 3 * h0).sort((a, b) => b.g.y - a.g.y)
      const k = 열.indexOf(c)
      const 머리사이 = (위y, 아래y) => 열머리.filter((h) => h.y < 위y && h.y > 아래y && 같은열(h, c)).sort((a, b) => b.y - a.y)
      const 앞 = 열[k - 1], 뒤 = 열[k + 1]
      /* 🧭 G241 기호가 제 칸의 «첫 줄» 에 적힌 표(같은 줄 오른쪽에 값 · 층 칸이 있음) — 다음 기호 줄 바로 위까지가 제 칸.
           현장 A 지하1층 구조평면도의 기둥 표: «C8 | B1F | …» 아래 줄 «1F~6F | …» 는 C8 것(가운데로 나누면 아래 C9 것이 됐음) */
      /*   «첫 줄» 표인지는 두 기호 사이 줄의 값이 위 기호 줄의 값과 같은 칸(세로로 나란)에 있는지로 — 슬래브 일람표처럼 기호가 두 줄(X · Y) 가운데에
           적히고 제 줄엔 TYPE · THK 만 있는 표는 가운데로 나눔 */
      const 오른글 = (o, 위y, 아래y) => [...토, ...층머리].filter((t) => t.g.y <= 위y && t.g.y >= 아래y && t.g.x > o.g.x + o.g.w / 2 && t.g.x - o.g.x <= 90 * o.g.h && !딴판(o, t))
      const 첫줄 = (위c, 아래c) => {
        const tol = (o) => 0.35 * o.g.h
        const 제줄 = 오른글(위c, 위c.g.y + tol(위c), 위c.g.y - tol(위c)), 아래줄 = 오른글(아래c, 아래c.g.y + tol(아래c), 아래c.g.y - tol(아래c))
        const 사이 = 오른글(위c, 위c.g.y - tol(위c) - 1e-6, 아래c.g.y + tol(아래c) + 1e-6)
        return 제줄.length > 0 && 아래줄.length > 0 && 사이.length > 0 && 사이.some((t) => 제줄.some((o) => Math.abs(t.g.x - o.g.x) <= Math.max(t.g.h, o.g.h)))
      }
      if (앞 && 첫줄(앞, c) && !머리사이(앞.g.y, c.g.y).length) c.위 = c.g.y + 0.6 * c.g.h
      else if (앞) { const hs = 머리사이(앞.g.y, c.g.y); c.위 = hs.length ? hs[hs.length - 1].y + 0.5 * hs[hs.length - 1].h : (앞.g.y + c.g.y) / 2 }
      else { const hs = 머리사이(c.g.y + 60 * h0, c.g.y); c.위 = hs.length ? hs[hs.length - 1].y + 0.5 * hs[hs.length - 1].h : c.g.y + 1.5 * h0 }
      if (뒤 && 첫줄(c, 뒤) && !머리사이(c.g.y, 뒤.g.y).length) c.아래 = 뒤.g.y + 0.6 * 뒤.g.h
      else if (뒤) { const hs = 머리사이(c.g.y, 뒤.g.y); c.아래 = hs.length ? hs[0].y + 0.5 * hs[0].h : (c.g.y + 뒤.g.y) / 2 }
      else { const hs = 머리사이(c.g.y, c.g.y - 60 * h0); c.아래 = hs.length ? hs[0].y + 0.5 * hs[0].h : c.g.y - (앞 ? Math.min(20 * h0, (앞.g.y - c.g.y)) : 3 * h0) }
    }
    const 왼쪽주인 = (t) => {
      let best = null, bd = Infinity
      for (const c of 왼쪽들) {
        if (t.g.y > c.위 || t.g.y <= c.아래) continue
        if (딴판(c, t)) continue
        const dx = t.g.x - c.g.x0
        if (dx < -2 * c.g.h || dx > 90 * c.g.h) continue
        if (dx < bd) { bd = dx; best = c }
      }
      return best
    }
    // 줄 모양(부재가 가로로 늘어섬 → 덩이 · 세로로 → 줄마다)
    for (const c of 후보) {
      let best = null, bd = Infinity
      for (const o of 후보) {
        if (o === c || o.기[0].종류 !== c.기[0].종류) continue
        const d = Math.hypot(o.g.x - c.g.x, o.g.y - c.g.y)
        if (d < bd) { bd = d; best = o }
      }
      c.덩이 = best ? Math.abs(best.g.y - c.g.y) < Math.abs(best.g.x - c.g.x) : false
      c.줄 = best ? !c.덩이 : false
      /* 🧭 G265 줄 표(기호마다 한 줄)는 제 줄 오른쪽에 값이 있음 — 없으면 줄 표가 아님(단면 그림 칸 머리: 현장 B S-401 «옹벽 일람표 - 4» 의 RW1 은
           아래 DW1 칸 머리와 세로로 가장 가까워 «줄» 로 보여 제 칸 철근 글을 옆 칸 RW2 에 다 빼앗겼음 — RW1 · DW1 이 «만든» 값).
           벽만 — 칸 줄을 못 찾은 벽 단면 일람(`제칸` 이 못 잡음)의 받침. 보 · 기둥 · 기초는 예전 그대로(현장 E 건축 «FG2» 상세 칸이 아래 글을 가져가 물량이 바뀌었음) */
      if (c.줄 && !c.표안 && !c.칸 && c.기.every((x) => x.종류 === '벽') && !토.some((t) => t.tk[0].k !== '레벨' && Math.abs(t.g.y - c.g.y) <= 0.8 * Math.max(c.g.h, t.g.h) && t.g.x > c.g.x && t.g.x - c.g.x <= 90 * Math.max(c.g.h, t.g.h) && !딴판(c, t))) c.줄 = false
      c.토 = []
    }
    // 토막마다 주인 기호 — 같은 줄(오른쪽)이면 줄마다 표, 아니면 가까운 덩이(위쪽이 보통, 덩이 표는 기호가 칸 가운데라 위 토막도 받음)
    const 주인찾기 = (t) => {
      let best = null, bc = Infinity
      for (const c of 후보) {
        if (c.표안 || c.칸) continue                          // 표 안 기호 · 상세도 칸 머리는 제 칸의 것만 — 왼쪽주인 · 칸주인
        if (딴판(c, t)) continue
        const tol = 1.5 * Math.max(c.g.h, t.g.h)
        const dy = c.g.y - t.g.y
        if (dy < -tol && !c.덩이) continue                // 줄 표에서 기호보다 위 토막은 윗줄 것
        const dx = t.g.x - c.g.x
        const lim = 90 * Math.max(c.g.h, t.g.h)
        if (Math.abs(dx) > lim || Math.abs(dy) > lim) continue
        let cost
        if (Math.abs(dy) <= 0.8 * Math.max(c.g.h, t.g.h) && dx > -tol && !c.덩이) cost = dx * 0.25   // 같은 줄 — 줄마다 한 부재 표(가장 믿음)
        else { const wx = c.덩이 ? 3 : 1, wy = c.줄 ? 3 : 1; cost = Math.abs(dx) * wx + Math.max(0, dy) * wy + Math.max(0, -dy) * 3 + (c.줄 ? 1e6 : 0) }
        if (cost < bc) { bc = cost; best = c }
      }
      return best
    }
    /* 🧭 G241 높이 글자(«FL+6,900» · «-1500»)는 상세 칸(기초 · 보 단면) 것만 — 표의 기호가 가져가면 옆의 «R» 층 칸 때문에 그 기호가 «R 층만» 이 됐음(시험 예시 b 의 W1) */
    for (const t of 토) { let b0 = t.칸주인 || 왼쪽주인(t) || 주인찾기(t); if (b0 && t.tk[0].k === '레벨' && !b0.칸) b0 = null; if (b0) b0.토.push(t) }
    for (const h of 층머리) h.주인 = 왼쪽주인(h) || 주인찾기(h)          // 층 범위 칸도 그 표의 기호에만
    // 역할 붙이기
    const 역할 = (t) => {
      const r = new Set(t.역)
      const g = t.g, tolY = 1.2 * g.h
      let bl = null, bd = Infinity
      for (const hd of 머리) {
        if (Math.abs(hd.g.y - g.y) > Math.max(tolY, 1.2 * hd.g.h)) continue
        const dx = g.x - hd.g.x
        if (dx <= 0) continue
        if (dx < bd) { bd = dx; bl = hd }
      }
      let bu = null, bdu = Infinity
      for (const hd of 머리) {
        const dy = hd.g.y - g.y
        if (dy <= 0.5 * g.h || dy > 30 * g.h) continue
        if (Math.abs(hd.g.x - g.x) > Math.max(g.w, hd.g.w) / 2 + g.h) continue
        if (dy < bdu) { bdu = dy; bu = hd }
      }
      /* 🧭 G387 먼 칸 머리 — 머리(THK)에서 30 글자 높이 넘게 아래 줄도, 같은 칸(세로)에 글자가 띄엄띄엄(15 글자 높이 안) 이어져 머리까지 닿으면 그 칸.
           현장 A S-301 슬래브 일람 아래 두 줄 «R CS1» · «RaS1» 의 두께(150 · 200)를 못 읽어 «흔한 두께» 150 으로 채웠음 */
      if (!bu) {
        const 같은칸 = (o, hw) => Math.abs(o.g.x - g.x) <= Math.max(g.w, hw) / 2 + g.h
        for (const hd of 머리) {
          const dy = hd.g.y - g.y
          if (dy <= 30 * g.h || dy > 150 * g.h || !같은칸(hd, hd.g.w) || dy >= bdu) continue
          const ys = 토.filter((o) => o !== t && o.g.y > g.y && o.g.y < hd.g.y && 같은칸(o, o.g.w)).map((o) => o.g.y).sort((p, q) => p - q)
          let y = g.y, 이어 = true
          for (const v of ys) { if (v - y > 15 * g.h) { 이어 = false; break } y = v }
          if (이어 && hd.g.y - y <= 30 * g.h) { bdu = dy; bu = hd }
        }
      }
      for (const hd of [bl, bu]) if (hd) for (const x of hd.역) r.add(x)
      return r
    }
    /** 토막의 층 범위 — 같은 줄 왼쪽의 «ALL·B1F·1F~6F» 칸, 없으면 같은 칸 위의 «B1F ~ 2F» 머리 */
    const 층범위 = (t, c) => {
      const g = t.g
      let best = null, bd = Infinity
      for (const h of 층머리) {
        if (h.주인 !== c) continue
        if (Math.abs(h.g.y - g.y) > 1.2 * Math.max(g.h, h.g.h)) continue
        const dx = g.x - h.g.x
        if (dx <= 0 || h.g.x < c.g.x - c.g.h) continue
        if (dx < bd) { bd = dx; best = h }
      }
      if (best) return best
      bd = Infinity
      for (const h of 층머리) {
        if (h.주인 !== c) continue
        const dy = h.g.y - g.y
        if (dy <= 0.3 * g.h || dy > 40 * g.h) continue
        if (Math.abs(h.g.x - g.x) > Math.max(g.w, h.g.w) / 2 + 3 * g.h) continue
        if (dy < bd) { bd = dy; best = h }
      }
      return best
    }
    for (const c of 후보) {
      if (c.토.some((t) => t.tk[0].k !== '숫자' && t.tk[0].k !== '레벨')) for (const t of c.토) 쓴글자.add(D.번 + ':' + t.g.i)
      쓴글자.add(D.번 + ':' + c.g.i)
      /* 🧭 G265 벽 단면 그림 칸(철근 글에 «(V) · (H)» 꼬리 · 그림에 «G.L · GL-2900» 땅 높이 글)의 «1F · B1F» 는 그림 속 층 높이 표시 — 표의 층 칸이 아님
           (현장 A S-611 «BW1 (THK=300mm)» 칸: 위 «1F» 를 층 칸으로 보면 BW1 이 1층 벽만 됨) */
      const 단면칸 = c.기[0].종류 === '벽' && c.토.length >= 2 && c.토.some((t) => /\(\s*(?:ADD\.?\s*)?[VH]\s*\)/i.test(t.g.s)) && (() => {
        const xs = c.토.map((t) => t.g.x), ys = c.토.map((t) => t.g.y)
        const x0 = Math.min(...xs) - 10 * c.g.h, x1 = Math.max(...xs) + 10 * c.g.h, y0 = Math.min(...ys) - 10 * c.g.h
        return D.글자.some((g) => /^(G\.?L\.?|GL[-+±]?[\d,.]*|E\.?L[-+±]?[\d,.]*)$/.test(g.u) && g.x >= x0 && g.x <= x1 && g.y >= y0 && g.y <= c.g.y)
      })()
      const 값0 = c.토.map((t) => ({ t, 역: 역할(t), 층: 단면칸 ? null : 층범위(t, c) }))
      // 층 범위 칸마다 따로 (기둥 일람표 «B1F ~ 2F | 3F | 5F ~ 6F» · 목록의 «위치» 칸)
      const 무리 = new Map()
      for (const v of 값0) { const k = v.층 ? v.층.g.i : -1; let a = 무리.get(k); if (!a) { a = []; 무리.set(k, a) } a.push(v) }
      const 공통 = 무리.get(-1) || []
      const 판들 = [...무리.entries()].filter(([k]) => k !== -1)
      const 짜기 = 판들.length ? 판들.map(([, vs]) => ({ 값: [...vs, ...공통], 범위: vs[0].층.범 })) : [{ 값: 공통, 범위: null }]
      let 된것 = false
      for (const 기 of c.기) {
        for (const { 값, 범위 } of 짜기) {
          if (!값.length) continue
          const r = 배근만들기(기, 값, c, 머리, 경고, D)
          if (!r) continue
          된것 = true
          const 판이름c = D.도곽 && D.도곽.length ? (D.판제목 || [])[판번(c.g)] || '' : ''
          if (r.철골 === true) {   /* 🧭 G290 SRC 기둥(r.철골 = 규격 글)은 철근콘크리트 정의로 */
           const 동 = 동꼬리(판이름c), k = 기.기호 + '|' + 동; if (!철골.has(k)) 철골.set(k, { ...r, 동, 번: D.번 }); continue }
          const 범 = 범위 && !범위.전체 ? 범위 : c.범위
          정의.push({ 종류: 기.종류, 기호: 기.기호, 몸: 기.몸, 층표: 기.층표, r, 범위: 범, 명시: !!범, 번: D.번, g: c.g, 근거: { 번: D.번, i: c.g.i, 글: c.g.s }, 목록판: /LIST|SCHEDULE|일람/i.test(판이름c), 평면판: !!판이름c && !!제목층(판이름c), ...(c.칸 ? { 칸: true, 칸수: c.토.length + (c.보기 ? 1000 : 0) } : {}) })
        }
      }
      /* 🧭 G275 평면 판(«1층기초구조평면도»)의 기초 기호가 일람 줄로 안 읽혔으면 평면 기호 — 셈에서 빼지 않음(현장 B S-101 MF1 셋: 곁 평면 치수를 칸으로 읽다 두께를 못 찾고
           글자만 «일람표에 쓴 글자» 로 남아 평면 기초 셋이 안 셈 · 확대평면도 쪽 것은 겹친 것으로 빠져 MF1 이 하나도 안 들어왔음) */
      /* 숫자(치수 · 높이) 글만 곁에 있던 머리만 — 곁 글이 없는 머리(현장 C FOOTING PLAN 판의 기초 목록 «F1 ~ F46»)는 그대로 «일람표에 쓴 글자» */
      if (!된것 && c.기.every((x) => x.종류 === '기초') && c.토.length && c.토.every((t2) => t2.tk.every((x) => x.k === '숫자' || x.k === '레벨'))) {
        const 판이름0 = D.도곽 && D.도곽.length ? (D.판제목 || [])[판번(c.g)] || '' : ''
        if (판이름0 && 제목층(판이름0) && !/LIST|SCHEDULE|일람|DETAIL|상세/i.test(판이름0)) { 쓴글자.delete(D.번 + ':' + c.g.i); for (const t2 of c.토) 쓴글자.delete(D.번 + ':' + t2.g.i) }
      }
    }
  }
  /* 🧭 G241 상세도 칸에서 읽은 기호가 있으면 같은 기호의 다른 데(평면 곁 글자)에서 짐작한 것은 버림 */
  const 칸기호 = new Set(정의.filter((d) => d.칸).map((d) => d.종류 + '|' + d.기호))
  /* 🧭 G241 보 상세 칸의 춤 후보(바닥에서 슬래브 아래 · 보 위까지 둘 다 치수로 적힘)가 여럿이면 같은 판 보들에 가장 많이 나오는 값
       — 현장 C · D BEAM LIST-2: B2 {1000 · 1250} · B5 {700 · 1000} · B2a {1000 …} → 1000 (보 평면의 «500Wx1000H» 와 같음) */
  {
    const 판보 = new Map()
    for (const d of 정의) if (d.칸 && d.종류 === '보' && d.r._춤후보) { const k = d.번 + ':' + (도면들[d.번] ? 도면들[d.번].도곽번(d.g.x, d.g.y) : -1); const a = 판보.get(k) || []; a.push(d); 판보.set(k, a) }
    for (const [, ds] of 판보) {
      const 셈 = new Map()
      for (const d of ds) for (const v of new Set(d.r._춤후보)) 셈.set(v, (셈.get(v) || 0) + 1)
      for (const d of ds) { const 고 = d.r._춤후보.slice().sort((a, b) => (셈.get(b) || 0) - (셈.get(a) || 0) || a - b)[0]; if (고) { d.r.춤 = String(고); if (d.r._밑 != null) d.r._윗면 = String(d.r._밑 + 고) } }
    }
  }
  /* 같은 기호의 상세 칸이 둘(다른 판에 그 기호가 또 머리처럼 적힘)이면 그림 이름(PLAN · SECTION)이 있고 글자가 많은 칸 하나만 */
  const 칸최고 = new Map()
  /* 층 범위가 다른 칸(현장 A «(6) B10» · «(5) B10» · «(R) B10» — 층마다 다른 목록)은 따로 */
  const 칸열쇠 = (d) => d.종류 + '|' + d.기호 + '|' + JSON.stringify(d.범위 || null)
  for (const d of 정의) if (d.칸) { const k = 칸열쇠(d); if (!칸최고.has(k) || d.칸수 > 칸최고.get(k).칸수) 칸최고.set(k, d) }
  /* 구조평면 판의 같은 기호(현장 A «지상2층 구조평면도» 의 «G1 500X800» · 현장 C · D BEAM PLAN «700Wx1000H»)는 층마다의 크기라 남김 — 일람표 칸이 위에 덮음 */
  const 남정의0 = 정의.filter((d) => (d.칸 ? 칸최고.get(칸열쇠(d)) === d : !칸기호.has(d.종류 + '|' + d.기호) || d.평면판))
  /* 🧭 G241 일람표 판(이름이 LIST · SCHEDULE · 일람)에서 읽은 기호는 그것이 먼저 — 단면 · 상세 판의 같은 기호 이름표 곁 글자(현장 C · D «FOUNDATION SECTION» 의
       W3 곁 «T=50» · «HD19@200»)는 빈 칸만 채우고(뒤로) 층마다 다른 목록으로 보지 않음(보조).
       구조평면 판의 범례 표(현장 B S-101 층마다 «1S1A 150 · 200»)는 그 층 목록이라 그대로 */
  const 목록기호 = new Set(남정의0.filter((d) => d.목록판).map((d) => d.종류 + '|' + d.기호))
  for (const d of 남정의0) if (!d.목록판 && !d.평면판 && 목록기호.has(d.종류 + '|' + d.기호)) d.보조 = true
  const 남정의 = 남정의0.filter((d) => !d.보조).concat(남정의0.filter((d) => d.보조))
  const 된 = new Set(남정의.map((d) => d.종류 + '|' + d.기호))
  const 종말 = { 벽체: '벽', 기초: '기초' }
  /* 🧭 G242 두께 후보가 여럿인 기초는 한 줄로(현장 C · D F45 «400 · 1,200» — 옆 보 바닥 −1300 이 가장 얇은 후보) */
  const 두후 = new Map()
  for (const w of 경고) if (w && w.두께후보 && !두후.has(w.두께후보)) 두후.set(w.두께후보, w.후)
  for (const w of 경고) {
    if (w && w.두께후보) continue
    const m = /^(벽체|기초) 일람표 «([^»]+)»/.exec(w); if (m && 된.has(종말[m[1]] + '|' + m[2])) continue; 경고0.push(w)
  }
  if (두후.size) 경고0.push('기초 ' + [...두후].map(([k, v]) => k + '(' + v.map((x) => x.toLocaleString()).join(' / ') + ')').join(' · ') + ' 는 높이 글자로 본 두께 후보(mm)가 여럿이라 가장 얇은 것으로 셈했습니다 — 계단 · 꺾인 기초이거나 옆 보 · 슬래브 바닥일 수 있어 배근표에서 한 번 보아 주세요')
  return { 정의: 남정의, 쓴글자, 철골 }
}

const 개글 = (x) => x.n + '-' + x.d
const 간글 = (x) => x.d + (x.d2 ? '+' + x.d2 : '') + '@' + x.s

/** 기호 하나의 값 토막들 → 배근표 한 줄 (골조.js 배근칸 모양) */
/* 🧭 G241 높이 표로 두께 · 춤 — 가장 낮은 높이(바닥)에서 다른 높이까지 차 가운데 «세운 치수 글자로도 적힌 것» 의 가장 작은 것(300 넘게)
     — 현장 C · D F1: 바닥 -1500 · 위 -550 · 세운 치수 950 · 1000 · 1500 → 950 / F2 는 옆 보 바닥 -1250 이 있어 «가장 낮은 두 높이 차(250)» 는 틀림 */
function 높이차두께(레, 수, 모두 = false) {
  if (레.length < 2) return 모두 ? [] : null
  const vs = [...new Set(레.map((v) => v.x.v))].sort((a, b) => a - b)
  const 차들 = vs.slice(1).map((v) => v - vs[0]).filter((d) => d >= 300 && d <= 4000)
  const 세운 = new Set(수.filter((v) => Math.abs(Math.cos(v.g.a || 0)) < 0.2).map((v) => v.x.v))
  const 맞 = 차들.filter((d) => 세운.has(d))
  if (모두) return 맞
  if (맞.length) return Math.min(...맞)
  const d = vs[1] - vs[0]
  return d >= 300 && d <= 4000 ? d : null
}
/* 🧭 G248 단면 그림의 철근 — 철근 글이 없는 보 상세 칸(현장 C · D BEAM LIST «B1b · B1c · B5a …»): 칸 안 철근 층의 닫힌 네모(늑근)가 보 폭 · 춤에 맞으면
     그 안 작은 동그라미(철근)를 줄로 — 맨 위 줄 = 상부 · 맨 아래 줄 = 하부 · 그 사이(양옆) = 부근. 굵기 = 동그라미 지름(가까운 규격).
     소장님 규칙 «글자 먼저, 글자가 없을 때만 동그라미 지름» · «HD25 = 25 mm» */
const 철근층이름 = /철근|REBAR|BAR\b/i
const 규격굵기 = [10, 13, 16, 19, 22, 25, 29, 32, 35]
function 그림철근(D, c, 폭, 춤) {
  if (!D || !c || !c.칸쪽) return null
  const [왼, 밑, 오, 위] = c.칸쪽
  const 철층 = (ly) => 철근층이름.test(((D.layers || [])[ly] || {}).name || '')
  const 안 = (x, y) => x > 왼 && x <= 오 && y > 밑 && y < 위
  /* 늑근 네모 — 겹늑근(네모 둘을 나란히 · 현장 D B3 · B4)은 맞닿은 네모를 하나로 묶은 테두리가 보 폭 · 춤에 맞으면 */
  const 조각 = D.닫힌.filter((s) => { const w = s.b[2] - s.b[0], h = s.b[3] - s.b[1]; return 철층(s.ly) && w >= 80 && h >= 150 && 안((s.b[0] + s.b[2]) / 2, (s.b[1] + s.b[3]) / 2) }).map((s) => s.b.slice())
  const 묶음 = []
  for (const b of 조각) {
    const 붙 = 묶음.filter((u) => b[0] <= u[2] + 30 && b[2] >= u[0] - 30 && b[1] <= u[3] + 30 && b[3] >= u[1] - 30)
    const 새 = [b[0], b[1], b[2], b[3]]
    for (const u of 붙) { 새[0] = Math.min(새[0], u[0]); 새[1] = Math.min(새[1], u[1]); 새[2] = Math.max(새[2], u[2]); 새[3] = Math.max(새[3], u[3]); 묶음.splice(묶음.indexOf(u), 1) }
    묶음.push(새)
  }
  /* 폭은 칸의 폭 치수로 맞춤 · 춤은 칸 치수가 슬래브 아래만 적힌 것(«700» = 1000 − 300)이 많아 늑근 높이(1.1 배 안)로만 봄 */
  const 맞 = 묶음.filter((u) => { const w = u[2] - u[0], h = u[3] - u[1]; return w >= 150 && h >= 200 && (!폭 || (w < 폭 && w > 폭 - 400)) && (!춤 || h < 1.6 * 춤) })
  if (!맞.length) return null
  const 네 = 맞[0]
  const 점 = []
  for (const s of D.닫힌) {
    const w = s.b[2] - s.b[0], h = s.b[3] - s.b[1]
    if (w < 6 || w > 60 || Math.abs(w - h) > 0.25 * w || !철층(s.ly)) continue
    const x = (s.b[0] + s.b[2]) / 2, y = (s.b[1] + s.b[3]) / 2
    if (x > 네[0] - w && x < 네[2] + w && y > 네[1] - w && y < 네[3] + w) 점.push({ x, y, w })
  }
  if (점.length < 4) return null
  const d0 = 점.map((p) => p.w).sort((a, b) => a - b)[점.length >> 1]
  const 굵기 = 규격굵기.reduce((a, b) => (Math.abs(b - d0) < Math.abs(a - d0) ? b : a))
  /* 줄로 묶기(높이 차 동그라미 지름 0.6배 안) — 3개 넘는 줄 = 주근 줄(가운데보다 위 = 상부 · 아래 = 하부 · 2단이면 더함) · 2개 이하 줄 = 양옆 부근 */
  const 줄들 = []
  for (const p of 점.slice().sort((a, b) => a.y - b.y)) { const z = 줄들[줄들.length - 1]; if (z && p.y - z.y <= 0.6 * d0) z.n++; else 줄들.push({ y: p.y, n: 1 }) }
  const 가운데 = (네[1] + 네[3]) / 2
  let 상 = 0, 하 = 0, 부 = 0
  for (const z of 줄들) { if (z.n >= 3) { if (z.y > 가운데) 상 += z.n; else 하 += z.n } else 부 += z.n }
  if (상 < 2 || 하 < 2) return null
  return { 상, 하, 부, 굵기, 늑: [네[2] - 네[0], 네[3] - 네[1]] }
}
/**
 * 🧭 G281 기둥 일람 칸의 단면 그림 → 대근 가닥 수 {가, 세} (둘레 대근 2 가닥 포함) — 없으면 null.
 *   칸 = 기호 아래 · 주근 글 위(옆 기호와의 가운데까지 · 글자 15배 안). 띠철근 네모 = 가장 바깥 세로 두 선 · 가로 두 선(길이 비슷 · 주석 층 아님),
 *   보조 대근 = 네모 안(가장자리 12 % 안쪽)을 70 % 넘게 가로지르는 곧은 선 — 세로 선 = 가로 가닥(길이 = 세로 변) · 가로 선 = 세로 가닥.
 *   크기를 알면 네모 가로 : 세로가 기둥 가로 : 세로와 25 % 안일 때만(단면 그림이 아닌 선 묶음은 안 봄)
 */
function 단면가닥(D, c, 아래y, a, b) {
  const h = c.g.h
  const 옆 = D.글자.filter((g) => g !== c.g && Math.abs(g.y - c.g.y) < 0.5 * h && Math.abs(g.h - h) < 0.3 * h && 기호칸(g.s)).map((g) => Math.abs(g.x - c.g.x)).filter((d) => d > 2 * h)
  const W = Math.min(15 * h, 옆.length ? Math.min(...옆) / 2 : 15 * h)
  const x0 = c.g.x - W, x1 = c.g.x + W, y1 = c.g.y - h, y0 = Math.max(아래y, c.g.y - 40 * h)
  if (!(y1 - y0 > 2 * h)) return null
  const 세선 = [], 가선 = []
  for (const s of D.찾기(x0, y0, x1, y1)) {
    const ax = D.sx0[s], ay = D.sy0[s], bx = D.sx1[s], by = D.sy1[s]
    if (Math.min(ax, bx) < x0 || Math.max(ax, bx) > x1 || Math.min(ay, by) < y0 || Math.max(ay, by) > y1) continue
    const L = Math.hypot(bx - ax, by - ay)
    if (Math.abs(bx - ax) <= 0.02 * L) 세선.push({ v: (ax + bx) / 2, p: Math.min(ay, by), q: Math.max(ay, by), L })
    else if (Math.abs(by - ay) <= 0.02 * L) 가선.push({ v: (ay + by) / 2, p: Math.min(ax, bx), q: Math.max(ax, bx), L })
  }
  if (세선.length < 2 || 가선.length < 2) return null
  const 끝 = (arr) => {
    const 긴 = Math.max(...arr.map((s) => s.L))
    const 큰 = arr.filter((s) => s.L >= 0.6 * 긴).sort((p, q) => p.v - q.v)
    return 큰.length >= 2 ? [큰[0], 큰[큰.length - 1]] : null
  }
  const 세끝 = 끝(세선), 가끝 = 끝(가선)
  if (!세끝 || !가끝) return null
  const bx0 = 세끝[0].v, bx1 = 세끝[1].v, by0 = 가끝[0].v, by1 = 가끝[1].v
  const BW = bx1 - bx0, BH = by1 - by0
  if (!(BW > 2 * h && BH > 2 * h)) return null
  /* 네모 — 세로 두 선이 가로 두 선 사이를 덮고 · 가로 두 선이 세로 두 선 사이를 덮음(모서리 둥근 띠철근은 끝이 조금 모자람) */
  const 덮 = (s, p, q, 길) => s.p <= p + 0.15 * 길 && s.q >= q - 0.15 * 길
  if (!세끝.every((s) => 덮(s, by0, by1, BH)) || !가끝.every((s) => 덮(s, bx0, bx1, BW))) return null
  if (a > 0 && b > 0 && Math.abs(BW / BH - a / b) > 0.25 * (a / b)) return null
  const 안 = (arr, lo, 폭, 길) => {
    const vs = arr.filter((s) => s.v > lo + 0.12 * 폭 && s.v < lo + 0.88 * 폭 && s.L >= 0.7 * 길).map((s) => s.v).sort((p, q) => p - q)
    const 자리 = []
    for (const v of vs) if (!자리.length || v - 자리[자리.length - 1] > 0.04 * 폭) 자리.push(v)
    return 자리.length
  }
  const n세 = 안(세선, bx0, BW, BH), n가 = 안(가선, by0, BH, BW)
  if (!n세 && !n가) return null
  return { 가: 2 + n세, 세: 2 + n가 }
}
function 배근만들기(기, 값, c, 머리, 경고, D = null) {
  const 모 = (k) => 값.flatMap(({ t, 역 }) => t.tk.filter((x) => x.k === k).map((x) => ({ x, 역, g: t.g, 보: t.보기종 || '' })))
  const 철 = 모('철골')
  let SRC = ''
  if (철.length) {
    const 규 = 철.sort((a, b) => Math.hypot(a.g.x - c.g.x, a.g.y - c.g.y) - Math.hypot(b.g.x - c.g.x, b.g.y - c.g.y))[0].x.글
    /* 🧭 G290 SRC 기둥 — 철골 단면과 주근(«12-SHD25» 꼴 개수)이 같은 칸에 같이 적힌 기둥은 철근콘크리트로 읽고 철골 규격을 덧붙임
         (실제 구조도면 점검: 4층 SRC1 · SRC2 · SRC3 · SRC9 가 «철골» 로만 빠져 콘크리트 · 주근 · 철골 모두 안 셌음). 철골만 적힌 것(STEEL LIST)은 예전대로 철골 */
    if (기.종류 === '기둥' && 모('개수').length) SRC = 규
    else return { 철골: true, 기호: 기.기호, 종류: 기.종류, 규격: 규 }
  }
  const 개 = 모('개수'), 간 = 모('간격'), 크 = 모('크기'), 두 = 모('두께'), 수 = 모('숫자'), 지 = 모('지름')
  const 읽기차례 = (a, b) => (Math.abs(a.g.y - b.g.y) > 0.6 * a.g.h ? b.g.y - a.g.y : a.g.x - b.g.x)
  const 가로차례 = (a, b) => a.g.x - b.g.x
  let 춤후보 = null
  let 보밑 = null           // 🧭 G241 상세 칸 보의 바닥 높이(가장 낮은 높이 글자 · FL 기준 mm) — 윗면 = 바닥 + 춤 (3D 제자리)
  let 크기 = (크.find((v) => v.역.has('크기')) || 크[0] || {}).x
  let 치수로 = false
  let 지름원 = 0             // 🧭 G405 단면 그림의 원을 잰 지름
  if (!크기 && (기.종류 === '보' || 기.종류 === '기둥')) {
    // 단면 그림의 치수 글자 — 가로 글자 = 폭(가로) · 세운 글자 = 춤(세로) 「1,100」「850」 (기호에 가까운 것)
    const 가 = (v) => Math.hypot(v.g.x - c.g.x, v.g.y - c.g.y)
    // 단면 위의 치수(가장 위 가로 글자) = 폭 · 단면 왼쪽 치수(가장 왼쪽 세운 글자) = 춤. 피복·간격 같은 작은 숫자는 뺌
    const 가로 = 수.filter((v) => v.x.v >= 200 && v.x.v <= 3000 && Math.abs(Math.sin(v.g.a)) < 0.2).sort((a, b) => (b.g.y - a.g.y) || (가(a) - 가(b)))
    const 세로 = 수.filter((v) => v.x.v >= 250 && v.x.v <= 4000 && Math.abs(Math.cos(v.g.a)) < 0.2).sort((a, b) => (a.g.x - b.g.x) || (가(a) - 가(b)))
    if (가로[0] && 세로[0]) { 크기 = { a: 가로[0].x.v, b: 세로[0].x.v, c: null }; 치수로 = true }
    /* 🧭 G405 둥근 기둥 단면 — 가로 치수 하나(«1,000») 뿐이고 그 밑에 같은 지름의 원이 그려져 있으면 지름(도면 원을 잼). 현장 Y SRC 기둥 일람 SRC2 ⌀1,000 · SRC3 ⌀900:
         예전엔 세로 치수가 없어 크기를 못 읽고 «같은 몸 기둥» 크기를 빌렸음(짐작) */
    else if (기.종류 === '기둥' && 가로[0] && !세로[0] && D && D.닫힌) {
      const v0 = 가로[0].x.v, gx = 가로[0].g.x, gy = 가로[0].g.y
      const 원 = D.닫힌.find((q) => q.원 && Math.abs((q.b[2] - q.b[0]) - v0) <= 0.03 * v0 && Math.abs((q.b[3] - q.b[1]) - v0) <= 0.03 * v0 && Math.abs((q.b[0] + q.b[2]) / 2 - gx) <= 0.6 * v0 && q.b[3] < gy && gy - q.b[3] <= 1.5 * v0)
      if (원) 지름원 = v0
    }
    /* 상세 칸(철근 표 빈 단면 그림)은 가장 큰 가로 치수가 폭(위 치수 «700» 아래 «200 · 500» 은 나눈 치수) */
    if (치수로 && c.칸) 크기 = { ...크기, a: Math.max(...가로.map((v) => v.x.v)) }
    /* 🧭 G241 상세 칸(철근 표가 빈 보 단면 — 현장 C · D BEAM LIST): 춤 = 가장 낮은 높이(보 바닥)에서 다른 높이까지 차 가운데 세운 치수로도 적힌 가장 작은 것 */
    if (치수로 && c.칸 && 기.종류 === '보') { const d = 높이차두께(모('레벨'), 수); if (d) { 크기 = { ...크기, b: d }; 보밑 = Math.min(...모('레벨').map((v) => v.x.v)) } 춤후보 = 높이차두께(모('레벨'), 수, true) }
  }
  const 두께값 = () => { const t = 두[0]; if (t) return t.x.t; const n = 수.find((v) => v.역.has('두께')); return n ? n.x.v : null }
  if (기.종류 === '보') {
    if (!크기 && !개.length && !간.length) return null
    const 위치 = (v) => (v.역.has('중앙') ? '중앙' : v.역.has('단부') ? '단부' : '')
    let 상 = 개.filter((v) => v.역.has('상')), 하 = 개.filter((v) => v.역.has('하')), 부 = 개.filter((v) => v.역.has('부'))
    const 남 = 개.filter((v) => !v.역.has('상') && !v.역.has('하') && !v.역.has('부')).sort(읽기차례)
    if (!상.length && !하.length && 남.length >= 2) {
      // 머리 글이 없으면: 위 줄 = 상부, 그 아래 = 하부 (단부·중앙 칸이면 칸마다)
      const ys = [...new Set(남.map((v) => Math.round(v.g.y / (v.g.h * 0.8))))].sort((a, b) => b - a)
      상 = 남.filter((v) => Math.round(v.g.y / (v.g.h * 0.8)) === ys[0])
      하 = 남.filter((v) => Math.round(v.g.y / (v.g.h * 0.8)) === ys[1])
      if (ys.length >= 3 && !부.length) 부 = 남.filter((v) => Math.round(v.g.y / (v.g.h * 0.8)) === ys[2])
    }
    const 고르기 = (arr) => {
      if (!arr.length) return { 단: null, 중: null }
      const 단 = arr.find((v) => 위치(v) === '단부') || null
      const 중 = arr.find((v) => 위치(v) === '중앙') || null
      if (단 || 중) return { 단: (단 || 중).x, 중: (중 || 단).x }
      const s = arr.slice().sort(가로차례)
      return { 단: s[0].x, 중: (s[1] || s[0]).x }
    }
    const T = 고르기(상), B = 고르기(하)
    const r = { 기호: 기.기호, 폭: 크기 ? String(크기.a) : '', 춤: 크기 && 크기.b ? String(크기.b) : '', ...(크기 && 크기.춤글 ? { _춤글: 크기.춤글 } : {}), 상부: '', 하부: '', 늑근단부: '', 늑근중앙: '', 부근: '', 종류: '', 상부추가: '', 하부추가: '', 보조늑근: '', 헌치높이: '', 헌치길이: '', 끝춤: '', 동: '' }
    /* 🧭 G268 연속단 · 불연속단이 따로 적힌 보(«Conti 7 | CENTER 2 | Disconti 2») — 두 끝의 상부 추가근이 다르면 끝마다(«5-D22(한 끝)») ·
         예전엔 한 끝 글만 보거나(CENTER 2) 앞의 것만 봐 연속단 상부 7 개 중 추가 5 개가 빠졌음 */
    const 끝 = (arr, 꼴) => arr.find((v) => v.역.has(꼴)) || null
    const 연상 = 끝(상, '연속'), 불상 = 끝(상, '불연속')
    if (연상 && 불상 && T.중 && 연상.x.d === T.중.d && 불상.x.d === T.중.d && 연상.x.n !== 불상.x.n && Math.min(연상.x.n, 불상.x.n) >= T.중.n) {
      const 덧 = [연상.x.n - T.중.n, 불상.x.n - T.중.n].filter((n) => n > 0)
      r.상부 = 개글(T.중)
      if (덧.length) { r.상부추가 = 덧.map((n) => n + '-' + T.중.d + '(한 끝)').join(','); r.종류 = '양단보' }
    } else if (T.단) {
      if (T.중 && T.단.d === T.중.d && T.단.n > T.중.n) { r.상부 = 개글(T.중); r.상부추가 = (T.단.n - T.중.n) + '-' + T.단.d; r.종류 = '양단보' }
      else r.상부 = 개글(T.단.n >= (T.중 || T.단).n ? T.단 : T.중)
    }
    if (B.단) {
      if (B.중 && B.단.d === B.중.d && B.중.n > B.단.n) { r.하부 = 개글(B.단); r.하부추가 = (B.중.n - B.단.n) + '-' + B.단.d; r.종류 = '양단보' }
      else r.하부 = 개글(B.단.n >= (B.중 || B.단).n ? B.단 : B.중)
    }
    if (부.length) r.부근 = 개글(부[0].x)
    const 늑 = 간.filter((v) => !v.역.has('상') && !v.역.has('하'))
    const L = 고르기(늑)
    if (L.단) { r.늑근단부 = 간글(L.단); r.늑근중앙 = 간글(L.중) }
    if (치수로) r._짐작 = '크기(단면 치수 글자)'
    if (!r.상부 && !r.하부 && c.칸 && D) {
      /* 🧭 G406 늑근 네모 높이는 춤 후보 가운데 가장 큰 것으로 봄 — 춤은 판의 다른 보와 견줘 뒤에서 정함(G241). 현장 P① B7d · B7g: 먼저 잡힌 춤 350 · 500 으로
           늑근 네모(높이 900)를 «너무 크다» 고 버려 동그라미 18개(D25)를 못 셌음 */
      const 그 = 그림철근(D, c, +r.폭 || 0, Math.max(+r.춤 || 0, ...(춤후보 || [])))
      if (그) {
        r.상부 = 그.상 + '-D' + 그.굵기; r.하부 = 그.하 + '-D' + 그.굵기
        if (그.부 && !r.부근) r.부근 = 그.부 + '-D' + 그.굵기
        /* 늑근: 단면에 늑근 네모만 있고 굵기 · 간격 글이 없으면 소장님이 정해 주신 «HD13@150»(골조 화면 배근표에서 바꿈) */
        if (!r.늑근단부) { r.늑근단부 = r.늑근중앙 = 'D13@150'; r._늑근짐작 = true }
        r._그림철근 = '단면 동그라미 ' + (그.상 + 그.하 + 그.부) + '개(지름 ' + 그.굵기 + ' mm)'
      }
    }
    if (춤후보 && 춤후보.length > 1) r._춤후보 = 춤후보
    if (보밑 !== null && Number.isFinite(보밑)) { r._밑 = 보밑; r._윗면 = String(보밑 + (+r.춤 || 0)) }
    return r
  }
  if (기.종류 === '기둥') {
    const r = { 기호: 기.기호, 가로: '', 세로: '', 지름: '', 주근: '', 대근단부: '', 대근중앙: '', 형태: '사각', 변수: '', 한변: '', 면적: '', 둘레: '', 대근가로: '', 대근세로: '', 대근형태: '띠', 동: '' }
    // 층 범위가 여러 줄이면 맨 아래 줄(가장 낮은 층)을 대표로 — 나머지는 경고
    if (크기) { r.가로 = String(크기.a); r.세로 = String(크기.b) }
    else if (지[0]) { r.지름 = String(지[0].x.t); r.형태 = '원형' }
    else if (지름원) { r.지름 = String(지름원); r.형태 = '원형'; r._근거글 = '⌀' + 지름원 + ' = 단면 그림의 원(치수 «' + 지름원.toLocaleString('en-US') + '»)' }
    else if (!개.length && !간.length) return null
    const 주 = 개.find((v) => v.역.has('주')) || 개.slice().sort(읽기차례)[0]
    if (주) r.주근 = 개글(주.x)
    const 띠 = 간.slice()
    const 단 = 띠.find((v) => v.역.has('단부')), 중 = 띠.find((v) => v.역.has('중앙'))
    if (단 || 중) { r.대근단부 = 간글((단 || 중).x); r.대근중앙 = 간글((중 || 단).x) }
    else if (띠.length) { const s = 띠.map((v) => v.x).sort((a, b) => a.s - b.s); r.대근단부 = 간글(s[0]); r.대근중앙 = 간글(s[s.length - 1]) }
    const 크들 = new Set(크.map((v) => v.x.a + 'x' + v.x.b))
    if (크들.size > 1) 경고.push('기둥 «' + 기.기호 + '» 는 층마다 크기가 달라 보입니다(' + [...크들].join(' · ') + ') — 첫 크기로 셈했습니다. 골조 화면 배근표에서 «1-2' + 기.기호 + '» 처럼 나눠 적어 주세요')
    if (치수로) r._짐작 = '크기(단면 치수 글자)'
    if (SRC) r.철골 = SRC
    /* 🧭 G281 일람 칸 단면 그림의 보조 대근(띠철근 네모 안을 가로지르는 곧은 선) — 현장 B S-401 기둥 일람 C1 · C2(가운데 세로 · 가로 한 가닥씩) */
    if (D && !(+r.지름 > 0) && r.형태 !== '원형') {
      const 가닥 = 단면가닥(D, c, 주 && 주.g.y < c.g.y - 2 * c.g.h ? 주.g.y + 주.g.h : c.g.y - 30 * c.g.h, +r.가로 || 0, +r.세로 || 0)
      if (가닥) { r.대근가로 = String(가닥.가); r.대근세로 = String(가닥.세) }
    }
    return r
  }
  if (기.종류 === '슬라브') {
    const t = 두께값()
    if (!t && !간.length) return null
    const r = { 기호: 기.기호, 두께: t ? String(t) : '', 단변하부: '', 단변상부: '', 장변하부: '', 장변상부: '', 상부꼴: '전장', 종류: '양방향', 지지근: '', 단위철근: '', 데크: '', 동: '' }
    const 칸 = { 단변상부: null, 단변하부: null, 장변상부: null, 장변하부: null }
    const 남 = []
    for (const v of 간) {
      const 방 = v.역.has('단변') ? '단변' : v.역.has('장변') ? '장변' : ''
      const 위 = v.역.has('상') ? '상부' : v.역.has('하') ? '하부' : ''
      if (방 && 위 && !칸[방 + 위]) 칸[방 + 위] = v.x
      else if (방 && !위) { if (!칸[방 + '하부']) 칸[방 + '하부'] = v.x; if (!칸[방 + '상부']) 칸[방 + '상부'] = v.x }
      else 남.push(v)
    }
    남.sort(읽기차례)
    // 머리 글이 없고 두 줄(위 X · 아래 Y)로 적힌 표 — 위 줄 = 단변(X), 아래 줄 = 장변(Y) · 줄 안 왼쪽 = 상부, 다음 = 하부 (짐작)
    const 줄들 = [...new Set(남.map((v) => Math.round(v.g.y / (v.g.h * 1.5))))].sort((a, b) => b - a)
    if (Object.values(칸).every((v) => !v) && 줄들.length === 2 && 남.length >= 3) {
      const 위 = 남.filter((v) => Math.round(v.g.y / (v.g.h * 1.5)) === 줄들[0]).sort(가로차례), 아 = 남.filter((v) => Math.round(v.g.y / (v.g.h * 1.5)) === 줄들[1]).sort(가로차례)
      칸.단변상부 = 위[0].x; 칸.단변하부 = (위[1] || 위[0]).x; 칸.장변상부 = 아[0].x; 칸.장변하부 = (아[1] || 아[0]).x
      남.length = 0
      r._짐작 = '슬래브 철근 자리(X·Y 칸)'
    }
    if (남.length) {
      const 빈 = Object.keys(칸).filter((k2) => !칸[k2])
      if (남.length === 2 && 빈.length === 4) { 칸.단변상부 = 칸.단변하부 = 남[0].x; 칸.장변상부 = 칸.장변하부 = 남[1].x }
      else if (남.length === 1 && 빈.length === 4) { for (const k2 of 빈) 칸[k2] = 남[0].x }
      else for (const k2 of ['단변상부', '단변하부', '장변상부', '장변하부']) if (!칸[k2] && 남.length) 칸[k2] = 남.shift().x
    }
    for (const k2 of Object.keys(칸)) if (칸[k2]) r[k2] = 간글(칸[k2])
    if (/데크|DECK/i.test(c.g.s)) r.종류 = '데크'
    return r
  }
  if (기.종류 === '벽') {
    let t = 두께값()
    if (!t && 크기) t = Math.min(크기.a, 크기.b)
    if (!t) { 경고.push('벽체 일람표 «' + 기.기호 + '» 에서 두께를 못 찾았습니다'); return null }
    const r = { 기호: 기.기호, 두께: String(t), 수직: '', 수평: '', 배근: '복배근', 구분: '구조벽', 단부보강: '', 상부보강: '', 단부전단: '', 단위철근: '', 동: '' }
    /* 🧭 G265 «ADD» · «추가» 철근(현장 B DW1 «SHD19 @200(ADD. V)» · 현장 A BW2 «HD13@200(V).ADD») 은 기본 수직근이 아님 — 따로 «추가수직» */
    const 덧 = (v) => /ADD|추가/i.test(v.g.s)
    const 간0 = 간.filter((v) => !덧(v)), 추가 = 간.filter(덧)
    const 수직 = 간0.find((v) => v.역.has('수직')), 수평 = 간0.find((v) => v.역.has('수평'))
    const 남 = 간0.filter((v) => v !== 수직 && v !== 수평).sort(읽기차례)
    r.수직 = 수직 ? 간글(수직.x) : 남[0] ? 간글(남.shift().x) : ''
    r.수평 = 수평 ? 간글(수평.x) : 남[0] ? 간글(남.shift().x) : ''
    /* 🧭 G281 «C : 단부보강근 (V)» 칸의 «4-HD13»(현장 B S-401 벽 일람 W1 · W2) — 개수 꼴 철근이 단부 머리 밑이면 벽 끝 수직 보강근(예전엔 안 읽어 셈에서 빠졌음) */
    const 단개 = 개.find((v) => v.역.has('단부') && !v.역.has('수평') && !/ADD|추가/i.test(v.g.s))
    if (단개) r.단부보강 = 개글(단개.x)
    /* 🧭 G265 단면 그림 칸의 «In · Out»(안 · 밖) 짝 — 짝 가운데가 가름: 안 쪽 글 = 안 면 · 밖 쪽 = 밖 면. 같은 면 글이 여럿이면 가름에 가장 가까운 것
         (입면 그림 곁 글 — 먼 것은 옆 단면 그림의 이름표). 밖 면이 안 면과 다르면 «수직밖 · 수평밖»(현장 B RW2 밖 «HD16+19 @100(V)» · DW1 밖 «SHD16 @200(V)») */
    if (D && 간0.length >= 2) {
      const xs = 간.map((v) => v.g.x), ys = 간.map((v) => v.g.y)
      const bx0 = Math.min(...xs) - 4 * c.g.h, bx1 = Math.max(...xs) + 4 * c.g.h, by0 = Math.min(...ys)
      const 안꼴 = /^(IN|INSIDE|INNER|내측|안쪽|안면)$/, 밖꼴 = /^(OUT|OUTSIDE|OUTER|외측|바깥쪽|밖면)$/
      const 곳 = (g) => g.x >= bx0 && g.x <= bx1 && g.y > by0 && g.y < c.g.y
      const 안들 = D.글자.filter((g) => 안꼴.test(g.u) && 곳(g)), 밖들 = D.글자.filter((g) => 밖꼴.test(g.u) && 곳(g))
      let 짝 = null, bd = Infinity
      for (const a of 안들) for (const b of 밖들) {
        if (Math.abs(a.y - b.y) > Math.max(a.h, b.h) || Math.abs(a.x - b.x) > 30 * a.h) continue
        const d = Math.hypot((a.x + b.x) / 2 - c.g.x, a.y - c.g.y)
        if (d < bd) { bd = d; 짝 = { 가름: (a.x + b.x) / 2, 왼안: a.x < b.x } }
      }
      if (짝) {
        const 밖쪽 = (v) => (v.g.x >= 짝.가름) === 짝.왼안
        const 가까운 = (arr) => arr.slice().sort((p, q) => Math.abs(p.g.x - 짝.가름) - Math.abs(q.g.x - 짝.가름))[0] || null
        const 직들 = 간0.filter((v) => v.역.has('수직')), 평들 = 간0.filter((v) => v.역.has('수평'))
        const 안V = 가까운(직들.filter((v) => !밖쪽(v))), 밖V = 가까운(직들.filter(밖쪽)), 안H = 가까운(평들.filter((v) => !밖쪽(v))), 밖H = 가까운(평들.filter(밖쪽))
        if (안V || 밖V) r.수직 = 간글((안V || 밖V).x)
        if (안H || 밖H) r.수평 = 간글((안H || 밖H).x)
        if (안V && 밖V && 간글(밖V.x) !== r.수직) r.수직밖 = 간글(밖V.x)
        if (안H && 밖H && 간글(밖H.x) !== r.수평) r.수평밖 = 간글(밖H.x)
      }
    }
    /* 추가 수직근 길이 — 칸 안 «L/3» 꼴 글(치수 글 · 벽 높이 L 의 몫)이 있으면 «D19@200 L/3». 없으면 길이를 몰라 안 셈(알림 — 배근표에 «L)1200» 처럼) */
    if (추가.length) {
      const a = 추가[0]
      let 몫 = null
      if (D) {
        const xs = 간.map((v) => v.g.x), ys = 간.map((v) => v.g.y)
        const bx0 = Math.min(...xs) - 6 * c.g.h, bx1 = Math.max(...xs) + 6 * c.g.h, by0 = Math.min(...ys) - 15 * c.g.h
        const 몫글 = D.글자.filter((g) => /^L\/([2-9])$/.test(g.u) && g.x >= bx0 && g.x <= bx1 && g.y >= by0 && g.y < c.g.y)
          .sort((p, q) => Math.hypot(p.x - a.g.x, p.y - a.g.y) - Math.hypot(q.x - a.g.x, q.y - a.g.y))[0]
        if (몫글) 몫 = +/^L\/([2-9])$/.exec(몫글.u)[1]
      }
      if (몫) r.추가수직 = 간글(a.x) + ' L/' + 몫
      else 경고.push('벽 «' + 기.기호 + '» 추가 수직근(ADD) ' + 간글(a.x) + ' 은 길이 글(L/3 · 치수)이 없어 셈에서 뺐습니다 — 배근표 «추가 수직근» 칸에 «' + 간글(a.x) + ' L)1200» 처럼 적어 주세요')
    }
    const 모든글 = 값.map(({ t: tt }) => tt.g.s).join(' ') + ' ' + 머리.filter((h) => Math.abs(h.g.y - c.g.y) < 1.2 * c.g.h && h.g.x > c.g.x).map((h) => h.g.s).join(' ')
    const 옆글 = 모든글
    if (/단배근|SINGLE/i.test(옆글)) r.배근 = '단배근'
    return r
  }
  if (기.종류 === '기초') {
    /* 🧭 G241 «2400X2400» 글자가 없는 기초 상세(현장 C · D 토목 FOOTING DETAIL PLAN & SECTION — 평면 치수 «1300» · 단면 높이 «-550 · -1500»):
         평면 그림(단면의 높이 표보다 위)의 가장 큰 가로 치수 = 가로 · 가장 큰 세운 치수 = 세로(없으면 정사각) · 두께 = 가장 낮은 두 높이의 차 */
    const 레 = 모('레벨')
    let 치수기초 = false
    if (!크기) {
      const 위끝 = 레.length ? Math.max(...레.map((v) => v.g.y)) + 2 * c.g.h : -Infinity
      const 평전 = 수.filter((v) => (c.보기 ? v.보 === '평면' : v.g.y > 위끝))
      let 평 = 평전.filter((v) => v.x.v >= 500 && v.x.v <= 12000)
      /* 🧭 G242 평면의 «격자선까지» 치수(현장 D F6 평면 오른쪽 «6600» · F23 «8400» · F7 위 «1850» — 기초 끝에서 옆 격자선까지)는 기초 크기가 아님:
           단면 그림 폭(단면 위 가장 큰 가로 치수)보다 크고, 바로 곁 줄의 나눈 치수(«650 · 6150 · 1350» → 8150)로 이어지지 않고, 칸 안 다른 데(단면)에
           같은 값이 없는 평면 치수는 뺌 — 나눈 치수 합이 맞는 큰 치수(F23 의 8150) · 단면에도 적힌 치수(F42 의 2050)는 기초 크기 */
      if (c.보기) {
        const 단폭 = Math.max(0, ...수.filter((v) => v.보 === '단면' && Math.abs(Math.sin(v.g.a || 0)) < 0.2 && v.x.v >= 500 && v.x.v <= 12000).map((v) => v.x.v))
        const 이어짐 = (v) => {
          const 가 = Math.abs(Math.sin(v.g.a || 0)) < 0.2
          const 축 = (u) => (가 ? u.g.x : u.g.y), 옆 = (u) => (가 ? u.g.y : u.g.x)
          const 곁 = 평전.filter((u) => u !== v && (가 ? Math.abs(Math.sin(u.g.a || 0)) < 0.2 : Math.abs(Math.cos(u.g.a || 0)) < 0.2) && Math.abs(옆(u) - 옆(v)) > 0.6 * v.g.h && Math.abs(옆(u) - 옆(v)) <= 8 * v.g.h && Math.abs(축(u) - 축(v)) <= v.x.v / 2 + v.g.h).sort((a2, b2) => 옆(a2) - 옆(b2))
          const 줄들 = []
          for (const u of 곁) { const z = 줄들[줄들.length - 1]; if (z && 옆(u) - 옆(z[z.length - 1]) <= 0.6 * v.g.h) z.push(u); else 줄들.push([u]) }
          return 줄들.some((z) => z.length >= 2 && Math.abs(z.reduce((a2, u) => a2 + u.x.v, 0) - v.x.v) <= 2)
        }
        if (단폭) { const 남 = 평.filter((v) => v.x.v <= 단폭 * 1.01 || 이어짐(v) || 수.some((u) => u !== v && u.x.v === v.x.v)); if (남.length) 평 = 남 }
      }
      const 가 = 평.filter((v) => Math.abs(Math.sin(v.g.a || 0)) < 0.2).map((v) => v.x.v)
      const 세 = 평.filter((v) => Math.abs(Math.cos(v.g.a || 0)) < 0.2).map((v) => v.x.v)
      if (가.length) { 크기 = { a: Math.max(...가), b: 세.length ? Math.max(...세) : Math.max(...가), c: null }; 치수기초 = true }
    }
    if (!크기) { 경고.push('기초 일람표 «' + 기.기호 + '» 에서 크기(2400X2400 같은 글자)를 못 찾았습니다'); return null }
    /* 상세 칸(크기 글자 없이 그림 치수로 그린 기초)은 높이 표(가장 낮은 두 높이 차)를 먼저 — 칸 안의 «T=100»(단열재) · «T=300»(슬래브)은 기초 두께가 아님 */
    /* 두께 = 가장 낮은 높이(기초 바닥)에서 다른 높이까지의 차 가운데 «세운 치수 글자로도 적힌 것» 의 가장 작은 것(300 넘게)
         — 현장 C · D F1: 바닥 -1500 · 위 -550 · 세운 치수 950 · 1000 · 1500 → 950 / F2 는 옆 보 바닥 -1250 이 있어 «가장 낮은 두 높이 차(250)» 는 틀림 */
    const 레두께 = () => 높이차두께(레, 수)
    let t = 크기.c || ((치수기초 || c.칸) && 레두께()) || 두께값()
    if ((치수기초 || c.칸) && !크기.c && 레두께()) 치수기초 = true
    if (!t) { const d = 레두께(); if (d) { t = d; 치수기초 = true } }
    /* 🧭 G248 흙 위 바닥 슬래브 밑 기초 — 두께 = 기초 바닥(가장 낮은 높이)에서 «바로 위 슬래브 바닥» 까지. 슬래브 바닥 = 칸의 슬래브 두께 글(«(T=300)»)로
         높이 글 쌍(윗면 S · 바닥 S−T)을 찾음. 기초 하나가 높이가 다른 두 슬래브 밑에 걸치면 평균(현장 C F11: −250/−550 · −600/−900 · 바닥 −1600 → 1050 · 700 → 875).
         전엔 «가장 낮은 높이에서 다른 높이까지의 차 가운데 세운 치수로도 적힌 가장 작은 것» 이라 슬래브 계단 높이(350 · 300)를 기초 두께로 잡은 것이 많았음(콘크리트 모자람) */
    let 슬밑 = null
    if ((치수기초 || c.칸) && !크기.c && 레.length >= 3) {
      const 슬T = [...new Set(두.filter((v) => !/단열|버림|쇄석|자갈|모래|WEARING|BINDER|ASCON|블럭|포장|방수|비닐/i.test((v.g && v.g.s) || '')).map((v) => +v.x.t))].filter((v) => v >= 100 && v <= 600)
      if (슬T.length === 1) {
        const T = 슬T[0]
        const vs = [...new Set(레.map((v) => v.x.v))].sort((a2, b2) => a2 - b2)
        const 밑 = vs[0]
        const 바닥들 = vs.filter((b2) => b2 - 밑 >= 200 && vs.includes(b2 + T))
        if (바닥들.length) { t = Math.round(바닥들.reduce((a2, b2) => a2 + (b2 - 밑), 0) / 바닥들.length); 치수기초 = true; 슬밑 = { 밑, T, 바닥들 } }
      }
    }
    /* 🧭 G275 두께 글 · 높이 글이 없는 치수 상세(현장 B MF1 — 파일캡 평면 2,500 × 2,375 · 단면 세운 치수 700 · 곁 MAT 600 · «기초 구조도 참조»):
         세운 치수 가운데 평면 세로 치수(크기.b) 자리 밖(위아래로 비킨 것)이고 평면 크기보다 작은 것(300 ~ 3,000)의 가장 큰 것 = 두께 */
    if (!t && 치수기초) {
      const 세운 = 수.filter((v) => Math.abs(Math.cos(v.g.a || 0)) < 0.2 && v.x.v >= 300 && v.x.v <= 3000)
      const 큰 = 세운.filter((v) => v.x.v === +크기.b).sort((p, q) => Math.hypot(p.g.x - c.g.x, p.g.y - c.g.y) - Math.hypot(q.g.x - c.g.x, q.g.y - c.g.y))[0]
      if (큰) {
        const y0 = 큰.g.y - 큰.x.v / 2 - 큰.g.h, y1 = 큰.g.y + 큰.x.v / 2 + 큰.g.h
        const 밖 = 세운.filter((v) => v !== 큰 && v.x.v < Math.min(+크기.a, +크기.b) && (v.g.y < y0 || v.g.y > y1)).map((v) => v.x.v)
        if (밖.length) t = Math.max(...밖)
      }
    }
    if (!t) { 경고.push('기초 일람표 «' + 기.기호 + '» 에서 두께를 못 찾았습니다'); return null }
    /* 칸에 슬래브 두께 글이 없으면 높이 글을 남겨 둠 — 골조읽기가 바닥 일반 단면 두께로 다시 셈(현장 D 기초 상세: «(T=300)» 없음) */
    const 레값 = !슬밑 && (치수기초 || c.칸) && !크기.c && 레.length >= 3 ? [...new Set(레.map((v) => v.x.v))].sort((a2, b2) => a2 - b2) : null
    /* 🧭 G275 기호에 M 이 있어도(«MF1» = 파일캡) 칸 치수로 크기가 정해진 작은 기초(6 m 안)는 독립 — MAT 은 평면 테두리로 크기를 잼(빈 MAT 단변 · 장변이면 셈에서 빠졌음) */
    const 작은치수 = 치수기초 && Math.max(+크기.a || 0, +크기.b || 0) <= 6000
    const r = { 기호: 기.기호, 종류: /M/.test(기.몸) && !작은치수 ? 'MAT' : /WF|줄/.test(기.몸) ? '줄' : '독립', 가로: String(크기.a), 세로: String(크기.b), 두께: String(t), ...(레값 ? { _레값: 레값 } : {}), 하부가로: '', 하부세로: '', 상부가로: '', 상부세로: '', 헌치높이: '', 윗가로: '', 윗세로: '', 지지근: '', 면적: '', 둘레: '', 단위철근: '', 동: '' }
    let 하 = 간.filter((v) => !v.역.has('상')).sort(읽기차례), 상 = 간.filter((v) => v.역.has('상')).sort(읽기차례)
    /* 🧭 G248 지시선으로 위 · 아래 철근 — 상세 단면의 철근 글(«HD19@100»)마다 지시선을 따라가 그 끝이 기초 단면 높이의 위쪽(60 % 넘게)이면 상부 · 아래쪽(40 % 안)이면 하부.
         단면 높이는 높이 글(«-1600» · «-550»)로 — 1:1 그림이면 «글자 y − 높이 값» 이 같은 글자들이 단면 것(평면 쪽 높이 글은 따로 놂).
         전엔 위 · 아래를 못 가려 칸의 철근 글을 다 하부로 보고 상부 철근을 안 셈(현장 C F11 «HD19@100» 넷 = 상부 둘 · 하부 둘) */
    if (D && !상.length && 간.length >= 2 && 레.length >= 2) {
      const 밑 = Math.min(...레.map((v) => v.x.v))
      const 차들 = 레.map((v) => v.g.y - v.x.v)
      let 기준 = null, 셈 = 0
      for (const a2 of 차들) { const n = 차들.filter((b2) => Math.abs(b2 - a2) <= 0.6 * c.g.h).length; if (n > 셈) { 셈 = n; 기준 = a2 } }
      if (셈 >= 2) {
        const yb = 밑 + 기준, yt = 밑 + t + 기준
        const 위들 = [], 아래들 = []
        for (const v of 간) {
          const e = 지시선끝(D, v.g)
          if (!e) continue
          const f = (e.y - yb) / (yt - yb)
          if (f >= 0.6 && f <= 1.4) 위들.push(v)
          else if (f >= -0.4 && f <= 0.4) 아래들.push(v)
        }
        if (위들.length && 아래들.length) { 상 = 위들.sort(읽기차례); 하 = 아래들.sort(읽기차례) }
      }
    }
    if (하[0]) { r.하부가로 = 간글(하[0].x); r.하부세로 = 간글((하[1] || 하[0]).x) }
    if (상[0]) { r.상부가로 = 간글(상[0].x); r.상부세로 = 간글((상[1] || 상[0]).x) }
    if (치수기초) r._짐작 = '기초 크기 · 두께(상세 치수 · 높이 글자)'
    /* 🧭 G242 높이 글자로 본 두께 후보가 여럿이고 가장 얇은 것이 다음 것의 반도 안 되면(현장 D F1 «400 · 1,100 · 1,400» — 계단 · 꺾인 기초) 알림 */
    if (!슬밑 && (치수기초 || c.칸) && t === 레두께()) { const 후 = [...new Set(높이차두께(레, 수, true))].sort((a2, b2) => a2 - b2); if (후.length > 1 && 후[0] === t && 후[1] > 2 * t) 경고.push({ 두께후보: 기.기호, 후 }) }
    /* 🧭 G241 높이 글자로 두께를 읽은 기초는 윗면 높이도(가장 낮은 높이 = 기초 바닥 + 두께 · FL 기준 mm) — 3D 에서 기초 · 주각을 제 높이에 */
    if (슬밑) r._윗면 = String(슬밑.밑 + t)
    else if ((치수기초 || c.칸) && 레.length >= 2 && t === 레두께()) { const 밑 = Math.min(...레.map((v) => v.x.v)); r._윗면 = String(밑 + t) }
    if (!하[0] && 개[0]) {
      // 「15-HD19」 처럼 개수로 적은 기초 — 폭에 고르게 놓였다고 보고 간격으로 바꿈
      const x = 개[0].x
      const s = Math.round((크기.b - 150) / Math.max(1, x.n - 1) / 10) * 10
      r.하부가로 = r.하부세로 = x.d + '@' + s
      경고.push('기초 «' + 기.기호 + '» 철근 «' + 개글(x) + '» 를 간격 ' + x.d + '@' + s + ' 로 바꿔 셈했습니다')
    }
    return r
  }
  return null
}

/* ───────────────────────────── ② 평면 */

/** 선분 s 의 방향이 u 와 나란한가 · 수직인가 */
function 방향(D, s) { const dx = D.sx1[s] - D.sx0[s], dy = D.sy1[s] - D.sy0[s]; const L = Math.hypot(dx, dy); return [dx / L, dy / L, L] }

/**
 * 기호 글자 곁의 «나란한 두 선» 띠 찾기
 * @returns {ux, uy, nx, ny, px, py(축 위 한 점), g(폭), 층들:Set, 점수} | null
 */
function 띠찾기(D, g, 폭, 최대폭 = 1500, 빼기 = null) {
  const R = Math.max(2000, (폭 || 600) * 3, 12 * g.h)
  const S = Math.max(1500, 4 * g.h)
  const 가까운 = D.찾기(g.x - R, g.y - R, g.x + R, g.y + R)
  // 방향 후보 — 글자 방향·그 직각(가로 글자가 세로 보 옆에 있는 도면) + 글자 곁 선들의 실제 방향(비스듬한 보의 글자는 몇 도 틀어져 있기도)
  const 각들 = [g.a, g.a + Math.PI / 2]
  for (const s of 가까운) {
    const [dx, dy, L] = 방향(D, s)
    if (L < 500) continue
    const a = Math.atan2(dy, dx)
    const 차 = (x) => { let d = Math.abs(((x - g.a) % Math.PI + Math.PI) % Math.PI); return Math.min(d, Math.PI - d) }
    if (차(a) < 0.35 || Math.abs(차(a) - Math.PI / 2) < 0.35) if (!각들.some((b) => { let d = Math.abs(((a - b) % Math.PI + Math.PI) % Math.PI); return Math.min(d, Math.PI - d) < 0.01 })) 각들.push(a)
  }
  let best = null
  for (const 넓게 of [false, true]) {                   // 넓게: 일람표 폭과 다르게 그린 도면(폭 ±40%) — 길이만 잼
    if (넓게 && (best || !폭)) break
    for (const a of 각들) {
      const ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux
      const 선들 = new Map()
      for (const s of 가까운) {
        /* 🧭 G411 빼기로 다시 찾을 때는 구조 도면 제 선만 — 끼운 건축 평면(«…$0$…» 층 · 건축 벽 선)이 만든 띠는 안 고름(현장 A 1층 바닥 G2 가 건축 벽 선 300 을 잡았음) */
        if (빼기 && /\$0\$/.test(((D.layers || [])[D.sly[s]] || {}).name || '')) continue
        const [dx, dy] = 방향(D, s)
        if (Math.abs(dx * uy - dy * ux) > 0.012) continue
        const o = ((D.sx0[s] + D.sx1[s]) / 2 - g.x) * nx + ((D.sy0[s] + D.sy1[s]) / 2 - g.y) * ny
        if (Math.abs(o) > R) continue
        let t0 = (D.sx0[s] - g.x) * ux + (D.sy0[s] - g.y) * uy, t1 = (D.sx1[s] - g.x) * ux + (D.sy1[s] - g.y) * uy
        if (t0 > t1) { const x = t0; t0 = t1; t1 = x }
        if (t1 < -S || t0 > S) continue
        const key = Math.round(o)
        let arr = 선들.get(key); if (!arr) { arr = []; 선들.set(key, arr) }
        arr.push({ s, t0, t1 })
      }
      const os = [...선들.keys()].sort((p, q) => p - q)
      for (let i = 0; i < os.length; i++) for (let j = i + 1; j < os.length; j++) {
        const gap = os[j] - os[i]
        const 맞음 = 폭 && !넓게 ? Math.abs(gap - 폭) <= Math.max(3, 폭 * 0.03) : 폭 ? gap >= 폭 * 0.6 && gap <= 폭 * 1.45 && gap >= 150 : gap >= 150 && gap <= 최대폭
        if (!맞음) continue
        const A = 선들.get(os[i]), B = 선들.get(os[j])
        let 겹 = false
        for (const p of A) { for (const q of B) if (Math.min(p.t1, q.t1) - Math.max(p.t0, q.t0) > 100) { 겹 = true; break } if (겹) break }
        if (!겹) continue
        /* 🧭 G411 빼기로 다시 찾을 때는 두 면 사이에 나란한 선이 지나는 짝(두 부재를 하나로 본 것)은 안 고름 */
        if (빼기 && j > i + 1) continue
        /* 빼기로 다시 찾을 때는 두 면이 1.5 m 넘게 같이 가는 짝만(기둥 · 받침 네모의 변을 띠로 보지 않게 — 현장 P① B7a) */
        if (빼기) { let 길 = 0; for (const p of A) for (const q of B) 길 = Math.max(길, Math.min(p.t1, q.t1) - Math.max(p.t0, q.t0)); if (길 < 1500) continue }
        const 거리 = os[i] <= 0 && os[j] >= 0 ? 0 : Math.min(Math.abs(os[i]), Math.abs(os[j]))
        if (거리 > Math.max(1200, 5 * g.h)) continue
        // 글자 방향에서 벗어난 만큼 조금 불리하게
        let 틀어짐 = Math.abs(((a - g.a) % Math.PI + Math.PI) % Math.PI); 틀어짐 = Math.min(틀어짐, Math.PI - 틀어짐); 틀어짐 = Math.min(틀어짐, Math.abs(틀어짐 - Math.PI / 2))
        const 점수 = 거리 + (폭 ? Math.abs(gap - 폭) * (넓게 ? 2 : 10) : 0) + 틀어짐 * 2000
        /* 🧭 G411 빼기 — 다른 이름표의 띠로 본 것(같은 방향 · 가운데 줄 40 mm 안)은 안 고름 */
        if (빼기 && 빼기.some((e) => Math.abs(e.ux * uy - e.uy * ux) < 0.01 && Math.abs((g.x + nx * (os[i] + os[j]) / 2 - e.px) * e.nx + (g.y + ny * (os[i] + os[j]) / 2 - e.py) * e.ny) < 40)) continue
        if (!best || 점수 < best.점수) {
          const oc = (os[i] + os[j]) / 2
          best = { ux, uy, nx, ny, px: g.x + nx * oc, py: g.y + ny * oc, g: gap, 점수, 층들: new Set([...A, ...B].map((x) => D.sly[x.s])), 다른폭: 넓게 }
        }
      }
    }
  }
  return best
}

/**
 * 🧭 G406 한 선 보 — 가장자리 보를 슬래브 끝 선 «하나» 로만 그린 평면(현장 Y 2 ~ 4층 모따기 자리 «G18» 1,200 × 600: 글자 곁에 나란한 두 선이 없고
 *   비스듬한 끝 선 하나뿐 → «두 선 못 찾음» 으로 보 6곳 · 그 슬래브 2S1 · 3S1 · 4S1 이 빠졌음).
 *   글자 곁(일람 폭 1.5 배 · 글자 8 배 안) 2 m 넘는 곧은 선 하나 · 그 선과 나란한 선이 양쪽 어디에도(폭 3 배 · 1.5 m 안) 없음 → 그 선 = 보 한 면 · 보는 글자 반대쪽(슬래브 쪽)으로 일람 폭.
 *   글자 쪽(바깥) 폭 1.5 배 띠 안에는 다른 선이 없어야 함(끝 선). 두 선으로 그렸는데 폭이 일람과 다른 보 · 개구부 X 표 대각선 곁 글자(현장 G «WB1»)는 안 씀 — 예전처럼 «두 선 못 찾음»
 *   폭은 일람표 값(📄) · 길이는 도면 선을 잼(📐). 주석 · 치수 · 중심선 층은 안 봄.
 */
const 한선덜층 = /CEN|SYM|AREA|LEADER|HID|DIM|TEXT|SITE|GRID|AXIS|HATCH|해치|치수|중심/i
function 한선띠찾기(D, g, 폭) {
  if (!(폭 >= 300)) return null
  const R = Math.max(1.5 * 폭, 8 * g.h, 1500)
  const 가까운 = D.찾기(g.x - R, g.y - R, g.x + R, g.y + R)
  const 층이름 = (ly) => ((D.layers || [])[ly] || {}).name || ''
  let best = null
  for (const s of 가까운) {
    if (한선덜층.test(층이름(D.sly[s]))) continue
    const [ux, uy, L] = 방향(D, s)
    if (!(L >= 2000)) continue
    const nx = -uy, ny = ux, ox = D.sx0[s], oy = D.sy0[s]
    const d = (g.x - ox) * nx + (g.y - oy) * ny, t = (g.x - ox) * ux + (g.y - oy) * uy
    if (Math.abs(d) > R || Math.abs(d) < 0.3 * g.h || t < -0.1 * L || t > 1.1 * L) continue
    const 짝 = 가까운.some((s2) => {
      if (s2 === s || 한선덜층.test(층이름(D.sly[s2]))) return false
      const [ex, ey, L2] = 방향(D, s2)
      if (!(L2 >= 500) || Math.abs(ex * uy - ey * ux) > 0.012) return false
      const o = ((D.sx0[s2] + D.sx1[s2]) / 2 - ox) * nx + ((D.sy0[s2] + D.sy1[s2]) / 2 - oy) * ny
      if (!(Math.abs(o) > 20 && Math.abs(o) < Math.max(3 * 폭, 1500))) return false
      let a0 = (D.sx0[s2] - ox) * ux + (D.sy0[s2] - oy) * uy, a1 = (D.sx1[s2] - ox) * ux + (D.sy1[s2] - oy) * uy
      if (a0 > a1) { const x = a0; a0 = a1; a1 = x }
      return Math.min(a1, L) - Math.max(a0, 0) > Math.min(500, 0.3 * Math.min(L, L2))
    })
    if (짝) continue
    /* 글자 쪽(바깥)은 비어 있어야 — 끝 선이 아닌 선(빈 칸 X 표 대각선 · 칸 안 선)을 보로 잡지 않게(현장 G 개구부 X 표 곁 «WB1») */
    const 글쪽 = d > 0 ? 1 : -1, 띠깊이 = 1.5 * 폭
    const 안에듦 = (x, y) => { const tt = (x - ox) * ux + (y - oy) * uy, oo = ((x - ox) * nx + (y - oy) * ny) * 글쪽; return tt > 0.05 * L && tt < 0.95 * L && oo > 20 && oo < 띠깊이 }
    const 바깥선 = 가까운.some((s2) => {
      if (s2 === s || 한선덜층.test(층이름(D.sly[s2]))) return false
      for (let k = 0; k <= 8; k++) { const f = k / 8; if (안에듦(D.sx0[s2] + (D.sx1[s2] - D.sx0[s2]) * f, D.sy0[s2] + (D.sy1[s2] - D.sy0[s2]) * f)) return true }
      return false
    })
    if (바깥선) continue
    if (!best || Math.abs(d) < best.거리) {
      const 쪽 = d > 0 ? -1 : 1                        // 보는 글자 반대쪽
      best = { ux, uy, nx, ny, px: ox + ux * t + nx * 쪽 * 폭 / 2, py: oy + uy * t + ny * 쪽 * 폭 / 2, g: 폭, 점수: Math.abs(d), 거리: Math.abs(d), 층들: new Set([D.sly[s]]), 다른폭: false, 한선: true }
    }
  }
  return best
}

/**
 * 🧭 G408 📐 단면에 잘린 보의 춤을 직접 잼 — 일람 · 범례에 춤이 없는 보(현장 Y «LB1 · LB2 | 200x건축치수»)는 골구도 · 단면 판에서 그 이름표 곁
 *   «매달린 두 세로 선»(간격 = 폭 ±15 %)을 찾아 위 슬래브 윗면 ~ 보 밑까지를 잼(곁 치수 글이 같으면 근거에 적음) · 층 = 그 슬래브 높이의 층 이름 글(«지상 5층» · «옥상»).
 *   소장님 «없으면 클로드가 직접 재서 물량 뽑아 … 도구에도 이게 적용되어야 해» · «직접 잰거는 알려줘 — 그래야 이용자가 알지».
 * @param 보들 [{몸, 폭}] · @returns [{몸, 판층(평면 제목 층 «5»), 춤, 근거, 치수}]
 */
const 단면층꼴 = /^(?:(지하|지상)\s*(\d{1,2})\s*층|(옥상|옥탑)\s*(지붕)?|PH\s*층?|RF)$/
/**
 * 🧭 G410 골구도 · 단면 판(층 이름 글 셋 넘게)의 벽 이름 글(«W400» · «W200» …)이 든 층 — 그 글 바로 아래 층 이름 글의 층(층 띠).
 * @returns Map('층|이름' → '판 제목 · 층 글')
 */
function 단면벽이름(도면들) {
  const out = new Map()
  for (const D of 도면들) {
    const 판번 = (x, y) => (D.도곽 && D.도곽.length ? D.도곽번(x, y) : -1)
    const 레벨 = []
    for (const g of D.글자) { const t = 붙(g.s); if (단면층꼴.test(t)) { const f = (제목층(t + ' 구조평면도') || [])[0]; if (f) 레벨.push({ f, y: g.y, x: g.x, 판: 판번(g.x, g.y), 글: g.s.trim() }) } }
    if (레벨.length < 3) continue
    for (const g of D.글자) {
      const t = 붙(g.s).toUpperCase()
      if (!/^[A-Z]{0,2}W\d{3}$/.test(t)) continue
      const 판 = 판번(g.x, g.y)
      const 판레 = 레벨.filter((L) => L.판 === 판)
      if (판레.length < 3) continue
      const 밑 = 판레.filter((L) => L.y <= g.y + 0.5 * g.h).sort((a, b) => b.y - a.y)[0]
      if (!밑) continue
      const k = 밑.f + '|' + t
      if (!out.has(k)) out.set(k, ((D.판제목 || [])[판] || D.이름 || '') + ' · ' + 밑.글 + ' 띠')
    }
  }
  return out
}
function 단면춤재기(도면들, 보들) {
  const out = []
  if (!보들.length) return out
  const 몸들 = new Map(보들.map((b) => [b.몸, b]))
  for (const D of 도면들) {
    const 판번 = (x, y) => (D.도곽 && D.도곽.length ? D.도곽번(x, y) : -1)
    const 레벨 = []
    for (const g of D.글자) { const t = 붙(g.s); if (단면층꼴.test(t)) { const f = (제목층(t + ' 구조평면도') || [])[0]; if (f) 레벨.push({ f, y: g.y, 판: 판번(g.x, g.y), 글: g.s.trim() }) } }
    if (레벨.length < 3) continue
    for (const g of D.글자) {
      const r = 기호풀이(g.s)
      const b = r && 몸들.get(r.몸)
      if (!b) continue
      const 판 = 판번(g.x, g.y)
      const 판레 = 레벨.filter((L) => L.판 === 판)
      if (판레.length < 3) continue                       // 평면 판의 이름표는 아님(층 이름 글 줄이 있는 단면 판만)
      const 폭 = +b.폭
      const 세 = []
      for (const s2 of D.찾기(g.x - 3000, g.y - 1500, g.x + 3000, g.y + 4000)) {
        const x0 = D.sx0[s2], y0 = D.sy0[s2], x1 = D.sx1[s2], y1 = D.sy1[s2], L = Math.hypot(x1 - x0, y1 - y0)
        if (L < 300 || Math.abs(x1 - x0) > 0.01 * L) continue
        세.push({ x: (x0 + x1) / 2, a: Math.min(y0, y1), b: Math.max(y0, y1) })
      }
      /* 간격 = 일람 폭 ±15 % · 또는 폭 0.6 ~ 1.45 배(단면 그림 폭이 범례와 다른 도면 — 현장 Y 범례 LB2 300 ↔ 골구도 단면 200: 춤만 재고 물량 폭은 범례 · 다름을 알림).
           이름표 지시선 끝이 든 두 선을 먼저(곁의 다른 보 «300X1000» 을 잡지 않게) · 다음은 가까운 것 */
      const 지시끝 = []
      for (const s2 of D.찾기(g.x - 3000, g.y - 1500, g.x + 3000, g.y + 4000)) {
        const ends = [[D.sx0[s2], D.sy0[s2], D.sx1[s2], D.sy1[s2]], [D.sx1[s2], D.sy1[s2], D.sx0[s2], D.sy0[s2]]]
        for (const [ax, ay, bx, by] of ends) if (Math.abs(ax - g.x) <= (g.w || 3 * g.h) / 2 + 3 * g.h && Math.abs(ay - g.y) <= 2 * g.h) 지시끝.push([bx, by])
      }
      let 쌍 = null
      for (const p of 세) for (const q of 세) {
        const gap = q.x - p.x
        const 맞 = gap > 0 && Math.abs(gap - 폭) <= 0.15 * 폭, 넓게 = !맞 && gap >= Math.max(150, 0.6 * 폭) && gap <= 1.45 * 폭
        if (!맞 && !넓게) continue
        const lo = Math.max(p.a, q.a), hi = Math.min(p.b, q.b)
        if (hi - lo < 300) continue
        const d = Math.hypot((p.x + q.x) / 2 - g.x, lo - g.y)
        if (d > 3000) continue
        const 가리킴 = 지시끝.some(([x, y]) => x >= p.x - 30 && x <= q.x + 30 && y >= lo - 100 && y <= hi + 100)
        const 점수 = d + (넓게 ? 300 : 0) - (가리킴 ? 5000 : 0)
        if (!쌍 || 점수 < 쌍.점수) 쌍 = { x0: p.x, x1: q.x, lo, hi, d, 점수, 폭: Math.round(gap), 넓게 }
      }
      if (!쌍) continue
      /* 위 슬래브 윗면 = 두 선 위끝에서 600 안의 가로선 가운데 두 선을 다 덮는 가장 높은 것 */
      let 윗 = null
      for (const s2 of D.찾기(쌍.x0 - 50, 쌍.hi - 20, 쌍.x1 + 50, 쌍.hi + 600)) {
        const x0 = D.sx0[s2], y0 = D.sy0[s2], x1 = D.sx1[s2], y1 = D.sy1[s2], L = Math.hypot(x1 - x0, y1 - y0)
        if (L < 500 || Math.abs(y1 - y0) > 0.01 * L) continue
        if (Math.min(x0, x1) > 쌍.x0 + 5 || Math.max(x0, x1) < 쌍.x1 - 5) continue
        const y = (y0 + y1) / 2
        if (y >= 쌍.hi - 20 && y <= 쌍.hi + 600 && (윗 === null || y > 윗)) 윗 = y
      }
      if (윗 === null) continue
      const 춤 = Math.round(윗 - 쌍.lo)
      if (!(춤 >= 200 && 춤 <= 4000)) continue
      const 레 = 판레.filter((L) => L.y >= 윗 - 300 && L.y <= 윗 + 1500).sort((p, q) => p.y - q.y)[0]
      if (!레) continue
      const 치 = D.글자.find((t) => { const v = +String(t.s).replace(/,/g, ''); return v > 0 && Math.abs(v - 춤) <= Math.max(10, 0.02 * 춤) && Math.abs(t.x - (쌍.x0 + 쌍.x1) / 2) < 2500 && t.y > 쌍.lo - 500 && t.y < 윗 + 500 })
      const 판이름 = ((D.판제목 || [])[판] || '').trim()
      /* 곁 보(같은 단면 · 같은 높이 띠에 잘린 보의 이름 «5B10» · 크기 «300X800») — 평면의 어느 자리인지 맞출 때 씀(G408) */
      const cx = (쌍.x0 + 쌍.x1) / 2, 곁 = []
      for (const t of D.글자) {
        if (t === g || 판번(t.x, t.y) !== 판 || Math.abs(t.x - cx) > 6000 || t.y < 윗 - 1800 || t.y > 윗 + 700) continue
        const u = 붙(t.s).toUpperCase(), rr = 기호풀이(t.s)
        if (/^\d{3,4}X\d{3,4}$/.test(u)) 곁.push({ 크기: u, dx: t.x - cx })
        else if (rr && rr.종류 === '보' && rr.몸 !== b.몸) 곁.push({ 몸: rr.몸, dx: t.x - cx })
      }
      out.push({ 몸: b.몸, 판층: 레.f, 레벨글: 레.글, 춤: 치 ? +String(치.s).replace(/,/g, '') : 춤, 잰춤: 춤, 치수: 치 ? 치.s.trim() : '', 단면폭: 쌍.넓게 ? 쌍.폭 : 0, 곁, 근거: (D.이름 || '') + (판 >= 0 ? ' 판 ' + (판 + 1) : '') + (판이름 ? ' «' + 판이름 + '»' : '') + ' ' + 레.글 + ' 밑' })
    }
  }
  return out
}

/** 띠의 축을 따라 두 선이 같이 있는 구간 → 받침(기둥·걸친 보)에서 끊은 토막들 */
/* 🧭 G245 찾는 범위 = 첫 글자 ±60 m → [lo, hi](그 띠의 모든 기호 글자 앞뒤 20 m 까지) — 줄이 60 m 넘게 긴 보 줄(현장 D 지중보 80 m)은
   첫 글자에서 먼 끝 구간을 못 찾아, 표제란 제목에 붙은 글자가 따로 그 구간을 셌음 */
function 띠토막(D, 띠, 기둥층, lo = -60000, hi = 60000) {
  const { ux, uy, nx, ny, px, py, g } = 띠
  const x0 = px + ux * lo, y0 = py + uy * lo, x1 = px + ux * hi, y1 = py + uy * hi
  const pad = g + 100
  const 후보 = D.찾기(Math.min(x0, x1) - pad, Math.min(y0, y1) - pad, Math.max(x0, x1) + pad, Math.max(y0, y1) + pad)
  const A = [], B = []   // 두 선의 구간
  const 가로지름 = []    // 축을 가로지르는 수직 선분 → [t, o0, o1]
  for (const s of 후보) {
    const [dx, dy] = 방향(D, s)
    const 나란 = Math.abs(dx * uy - dy * ux) < 0.012
    const 수직 = Math.abs(dx * ux + dy * uy) < 0.05
    if (!나란 && !수직) continue
    const ta = (D.sx0[s] - px) * ux + (D.sy0[s] - py) * uy, tb = (D.sx1[s] - px) * ux + (D.sy1[s] - py) * uy
    const oa = (D.sx0[s] - px) * nx + (D.sy0[s] - py) * ny, ob = (D.sx1[s] - px) * nx + (D.sy1[s] - py) * ny
    if (나란) {
      const o = (oa + ob) / 2
      if (Math.abs(o + g / 2) < 2) A.push([Math.min(ta, tb), Math.max(ta, tb)])
      else if (Math.abs(o - g / 2) < 2) B.push([Math.min(ta, tb), Math.max(ta, tb)])
    } else if (Math.min(oa, ob) <= -g / 2 + 1 && Math.max(oa, ob) >= g / 2 - 1) {
      /* 🧭 G258 띠 면 밖으로 나간 길이(한쪽이라도) — 띠 끝을 닫는 선(마구리)은 0 */
      가로지름.push({ t: (ta + tb) / 2, ly: D.sly[s], 밖: Math.max(-g / 2 - Math.min(oa, ob), Math.max(oa, ob) - g / 2) })
    }
  }
  const 합치기 = (arr) => {
    arr.sort((p, q) => p[0] - q[0])
    const out = []
    for (const [a, b] of arr) { const l = out[out.length - 1]; if (l && a <= l[1] + 2) l[1] = Math.max(l[1], b); else out.push([a, b]) }
    return out
  }
  /* 🧭 G406 한 선 보 — 그린 선은 한 면뿐: 다른 면 = 같은 구간 */
  if (띠.한선) { if (!A.length) A.push(...B.map((x) => x.slice())); else if (!B.length) B.push(...A.map((x) => x.slice())) }
  const UA = 합치기(A), UB = 합치기(B)
  const 같이 = []
  for (const [a0, a1] of UA) for (const [b0, b1] of UB) { const s = Math.max(a0, b0), e = Math.min(a1, b1); if (e - s > 50) 같이.push([s, e]) }
  // 받침: 기둥(닫힌 도형) · 걸친 보(가로지르는 나란한 두 선)
  const 끊김 = []   // [c0, c1, 반폭, 무엇]
  for (const c of D.닫힌) {
    if (c.글틀) continue
    const w = c.b[2] - c.b[0], h = c.b[3] - c.b[1]
    if (w < 150 || h < 150 || w > 3000 || h > 3000) continue
    if (기둥층 && !기둥층.has(c.ly)) continue
    // 네 모서리를 축·법선으로
    const cs = [[c.b[0], c.b[1]], [c.b[2], c.b[1]], [c.b[2], c.b[3]], [c.b[0], c.b[3]]]
    let t0 = Infinity, t1 = -Infinity, o0 = Infinity, o1 = -Infinity
    for (const [x, y] of cs) { const t = (x - px) * ux + (y - py) * uy, o = (x - px) * nx + (y - py) * ny; t0 = Math.min(t0, t); t1 = Math.max(t1, t); o0 = Math.min(o0, o); o1 = Math.max(o1, o) }
    if (o1 < -g / 2 + 1 || o0 > g / 2 - 1) continue
    if (t1 < lo || t0 > hi) continue
    끊김.push([t0, t1, (t1 - t0) / 2, '기둥'])
  }
  가로지름.sort((p, q) => p.t - q.t)
  for (let i = 0; i < 가로지름.length; i++) for (let j = i + 1; j < 가로지름.length; j++) {
    const w = 가로지름[j].t - 가로지름[i].t
    if (w < 150) continue
    if (w > 1500) break
    if (가로지름[j].ly !== 가로지름[i].ly) continue
    /* 🧭 G258 걸친 보 = 두 선이 띠 면 밖으로 이어짐(50 mm 넘게) — 짧은 벽 토막 두 끝 마구리(현장 B 승강기 문 옆 W2 425 · 675 mm)는 보가 아님
         (예전: 두 마구리를 걸친 보로 보고 토막을 통째로 빼 «두 선 구간 못 잡음») */
    if (Math.min(가로지름[i].밖, 가로지름[j].밖) <= 50) continue
    끊김.push([가로지름[i].t, 가로지름[j].t, w / 2, '보'])
    break
  }
  // 같이 있는 구간에서 끊김을 빼서 토막으로
  끊김.sort((p, q) => p[0] - q[0])
  const 토막 = []
  for (const [s0, s1] of 같이) {
    let a = s0
    let 왼 = null
    const 안 = 끊김.filter((c) => c[1] > s0 - 5 && c[0] < s1 + 5)
    for (const c of 안) {
      if (c[0] - a > 100) 토막.push({ t0: a, t1: c[0], 왼, 오: c })
      if (c[1] > a) { a = Math.max(a, c[1]); 왼 = c }
    }
    const 끝c = 끊김.find((c) => Math.abs(c[0] - s1) < 5) || null
    if (s1 - a > 100) 토막.push({ t0: a, t1: s1, 왼, 오: 끝c })
    // 토막 끝이 끊김 없이 선이 끝난 곳이면: 기둥 면에서 끊긴 선(선이 기둥 면에서 멈춤) — 그 자리의 기둥 찾기
  }
  for (const p of 토막) {
    if (!p.왼) p.왼 = 끊김.find((c) => Math.abs(c[1] - p.t0) < 5) || null
    if (!p.오) p.오 = 끊김.find((c) => Math.abs(c[0] - p.t1) < 5) || null
  }
  return 토막
}

/** 슬래브 기호에서 네 방향으로 받침(보·벽) 가운데까지 — 통심 단변×장변
 *  빗띠: 🧭 G252 이 평면에서 이름으로 잡은 비스듬한 보 · 벽 띠 [{a:[x,y], b:[x,y], w}] — 광선이 그 띠를 먼저 만나면 그 띠가 받침
 *  (현장 A 3층 바닥 대각 G11 · G4 — 세모 · 사다리꼴 칸 14곳이 «네 방향 모두에서 못 찾음» 으로 빠졌음).
 *  비스듬한 «선» 은 받침으로 안 봄(계단 빗금 · 개구부 X · 둥근 벽 토막) — 이름 붙은 띠만. */
function 슬래브재기(D, g, 구조층, 폭들, 최대 = 20000, 빗띠 = null, 보벽층 = null) {
  const 결과 = []
  const 방들 = [[1, 0], [-1, 0], [0, 1], [0, -1]]
  for (const [dx, dy] of 방들) {
    const x1 = g.x + dx * 최대, y1 = g.y + dy * 최대
    const 후보 = D.찾기(Math.min(g.x, x1) - 5, Math.min(g.y, y1) - 5, Math.max(g.x, x1) + 5, Math.max(g.y, y1) + 5)
    const 맞 = [], 빗선 = []
    for (const s of 후보) {
      if (구조층 && !구조층.has(D.sly[s])) continue
      const [sx, sy] = 방향(D, s)
      const 곧 = Math.abs(sx * dx + sy * dy)
      if (곧 > 0.02) {
        /* 🧭 G252 보 · 벽 층(이름 붙은 띠가 그려진 층)의 비스듬한 선(광선과 18° 넘게 비낌 · 1 m 넘게) — 아래에서 나란한 짝이 있을 때만 받침 */
        if (!보벽층 || !보벽층.has(D.sly[s]) || 곧 > 0.95) continue
        const ax = D.sx0[s], ay = D.sy0[s], bx = D.sx1[s], by = D.sy1[s]
        if (Math.hypot(bx - ax, by - ay) < 1000) continue
        let d
        if (dx !== 0) { if ((ay - g.y) * (by - g.y) > 0 || ay === by) continue; d = (ax + (g.y - ay) / (by - ay) * (bx - ax) - g.x) * dx }
        else { if ((ax - g.x) * (bx - g.x) > 0 || ax === bx) continue; d = (ay + (g.x - ax) / (bx - ax) * (by - ay) - g.y) * dy }
        if (d > 1) 빗선.push({ d, c: Math.abs(sx * dy - sy * dx), sx, sy })
        continue
      }
      // 광선과 만나는 거리
      const ax = D.sx0[s], ay = D.sy0[s], bx = D.sx1[s], by = D.sy1[s]
      let d
      if (dx !== 0) { const lo = Math.min(ay, by), hi = Math.max(ay, by); if (g.y < lo - 1 || g.y > hi + 1) continue; d = (ax - g.x) * dx }
      else { const lo = Math.min(ax, bx), hi = Math.max(ax, bx); if (g.x < lo - 1 || g.x > hi + 1) continue; d = (ay - g.y) * dy }
      if (d > 1) 맞.push({ d, ly: D.sly[s] })
    }
    맞.sort((p, q) => p.d - q.d)
    /* 🧭 G252 비스듬한 띠 — 가운데 줄과 광선이 만나는 거리 · 가까운 면 = 가운데 − (폭/2)/c (c = 띠 법선 · 광선) */
    let 빗 = null
    for (const b of 빗띠 || []) {
      const ex = b.b[0] - b.a[0], ey = b.b[1] - b.a[1], L = Math.hypot(ex, ey)
      if (L < 1) continue
      const c = Math.abs(ex * dy - ey * dx) / L
      if (c < 0.3) continue                                        // 광선과 거의 나란한 띠는 아님
      const 덤 = (b.w / 2) / c
      let u, d
      if (dx !== 0) { if (Math.abs(ey) < 1e-9) continue; u = (g.y - b.a[1]) / ey; d = (b.a[0] + u * ex - g.x) * dx }
      else { if (Math.abs(ex) < 1e-9) continue; u = (g.x - b.a[0]) / ex; d = (b.a[1] + u * ey - g.y) * dy }
      const 끝여유 = (b.w / 2 + 300) / L
      if (u < -끝여유 || u > 1 + 끝여유) continue
      if (d - 덤 <= 1) continue
      if (!빗 || d - 덤 < 빗.면) 빗 = { d, 면: d - 덤 }
    }
    /* 비스듬한 선 둘이 나란히(0.02) 수직 폭 150 ~ 1500 으로 만나면 띠(일람표 폭과 맞는 짝 먼저) — 가장 가까운 것 */
    빗선.sort((p, q) => p.d - q.d)
    for (let i = 0; i < 빗선.length; i++) {
      const m1 = 빗선[i]
      if (빗 && m1.d >= 빗.면) break
      const 폭 = (m2) => (Math.abs(m1.sx * m2.sy - m1.sy * m2.sx) <= 0.02 ? (m2.d - m1.d) * m1.c : -1)
      const 짝들 = 빗선.slice(i + 1).filter((m2) => { const w0 = 폭(m2); return w0 >= 150 && w0 <= 1500 })
      if (!짝들.length) continue
      const 맞폭 = 짝들.filter((m2) => 폭들 && 폭들.some((w) => Math.abs(폭(m2) - w) <= 3))
      const 짝 = 맞폭.length ? 맞폭[맞폭.length - 1] : 짝들[0]
      빗 = { d: m1.d + (짝.d - m1.d) / 2, 면: m1.d }
      break
    }
    if (!맞.length) { 결과.push(빗); continue }
    const d1 = 맞[0].d
    if (빗 && 빗.면 < d1 - 1) { 결과.push(빗); continue }
    // 받침의 다른 면 — 일람표에 있는 폭(보 폭·벽 두께)과 맞는 것 중 가장 넓은 것(큰보 안에 벽이 겹쳐 그려져도 큰보 가운데로)
    const 맞는 = 맞.filter((m2) => m2.d - d1 >= 150 && m2.d - d1 <= 1500 && (!폭들 || 폭들.some((w) => Math.abs(m2.d - d1 - w) <= 3)))
    const 짝 = 맞는.length ? 맞는[맞는.length - 1] : 맞.find((m2) => m2.d - d1 >= 150 && m2.d - d1 <= 1500)
    const 가운데 = 짝 ? d1 + (짝.d - d1) / 2 : d1
    결과.push({ d: 가운데, 면: d1 })
  }
  return 결과
}

/* ───────────────────────────── 모두 */

/**
 * @param 도면들 [{모델(골조도면.도면읽기), 이름, k(도면 단위 → mm)}]
 * @returns {공사, 경고:[글], 읽음:{배근:{…}, 평면:[…], 층:[…]}, 근거:[{번, 상자:[x0,y0,x1,y1](도면 단위), 글}], 있음:boolean}
 */
/* ───────────────────────────── 🧭 G274 계단 */
/* 🧭 G274 계단 — 계단 일람 · 배근도(단면 그림 + 철근 글)와 평면 계단판(네모 + 대각선 하나)으로 계단 줄(5. 계단).
     예전엔 계단을 아예 안 셌음(평면 «SS1» 은 클로드가 만든 평 슬래브 한 칸 — 경사 · 디딤 · 참이 빠짐) */
const 계단기호꼴 = /^(\d*(?:SS|ST|STS)\d{1,2}[A-Z]?)(?![A-Z0-9])/
const 계단제목꼴 = /계단\s*(?:실\s*)?(?:일람|배근|상세|단면)|STAIR\s*(?:SCHEDULE|DETAIL|SECTION|LIST)/i
const 계단철꼴 = /^(?:(\d+)EA-?)?(S?U?H?D|SD)(\d{2})(?:@(\d{2,4}))?(?:\((T[&,/+]?B|T|B|상하부?|상부|하부|상|하)\))?$/
const 계단두께꼴 = /^(?:THK|T|두께)[=:.]?(\d{2,3})(?:MM)?$|^(\d{2,3})(?:MM)?THK$/
const 계단덜층 = /OPEN|개구|HOLE|ELEV|E\.V|DUCT|SHAFT|DIM|치수|TEXT|LEADER|HATCH|CEN|SYM|GRID|AXIS|LED|MARK|NAME/i
const 계단기호인가 = (s) => 계단기호꼴.test(붙(s).toUpperCase())

/** 계단 일람 · 배근도 → Map(기호 → {기호, 두께, 주근, 상부주근, 배력근, 참주근, 참배력근, 배근, 단높이, 단너비, _근거}) */
function 계단일람찾기(도면들) {
  const out = new Map()
  const 굵 = (g) => +((/(\d{2})@/.exec(g) || [])[1] || 0)
  const 간 = (g) => +((/@(\d+)/.exec(g) || [])[1] || 0)
  const 센 = (a) => {
    const c = new Map()
    for (const x of a) c.set(x.글, (c.get(x.글) || 0) + 1)
    return ([...c].sort((p, q) => q[1] - p[1] || 굵(q[0]) - 굵(p[0]) || 간(p[0]) - 간(q[0]))[0] || [''])[0]
  }
  for (const D of 도면들) {
    const 판번 = (x, y) => (D.도곽 && D.도곽.length ? D.도곽번(x, y) : -1)
    const 제목 = D.글자.filter((g) => 계단제목꼴.test(g.s) && !/^\s*[([]?\d+(?:\.\d+)*\s*[.)]|그림|일반|\d+\.\d+\s/.test(g.s))
    if (globalThis.__계단dbg) globalThis.__계단dbg.push({ D: D.이름, 제목: 제목.map((g) => g.s + '@' + Math.round(g.x) + ',' + Math.round(g.y) + ' h' + g.h) })
    if (!제목.length) continue
    const 기호들 = []
    for (const g of D.글자) {
      const u = 붙(g.s).toUpperCase()
      const m = 계단기호꼴.exec(u)
      if (!m) continue
      const 제목글 = 계단제목꼴.test(g.s)
      if (u.length > m[1].length && !제목글) continue
      const p = 판번(g.x, g.y)
      if (!제목글 && !제목.some((t) => { const tp = 판번(t.x, t.y); return (tp === p || tp < 0 || p < 0) && g.y <= t.y + 2 * t.h && t.y - g.y <= 40 * t.h && Math.abs(g.x - t.x) <= 200 * t.h })) continue
      기호들.push({ g, 기: m[1], p })
    }
    for (const S of 기호들) {
      const h = S.g.h || 100
      if (out.has(S.기)) continue
      /* 칸 벽(기호 좌우의 세운 선 — 기호 아래로 길게) */
      let xa = S.g.x - 80 * h, xb = S.g.x + 80 * h
      for (const s of D.찾기(S.g.x - 80 * h, S.g.y - 40 * h, S.g.x + 80 * h, S.g.y + 3 * h)) {
        const x0 = D.sx0[s], x1 = D.sx1[s], y0 = Math.min(D.sy0[s], D.sy1[s]), y1 = Math.max(D.sy0[s], D.sy1[s])
        if (Math.abs(x1 - x0) > 1 || y1 < S.g.y - h || y0 > S.g.y - 20 * h) continue
        const x = (x0 + x1) / 2
        if (x < S.g.x - 2 * h && x > xa) xa = x
        if (x > S.g.x + 2 * h && x < xb) xb = x
      }
      const 남기호 = 기호들.filter((o) => o !== S && o.p === S.p)
      const 후보 = D.글자.filter((t) => {
        const tp = 판번(t.x, t.y)
        if ((tp >= 0 && S.p >= 0 && tp !== S.p) || t.x < xa || t.x > xb || t.y > S.g.y + h || t.y < S.g.y - 130 * h) return false      // 표 머리가 판(도곽) 밖이기도 함(현장 B S-401)
        const u = 붙(t.s).toUpperCase()
        if (!계단철꼴.test(u) && !계단두께꼴.test(u)) return false
        const d0 = Math.hypot(t.x - S.g.x, t.y - S.g.y)
        return !남기호.some((o) => o.g.y >= t.y - h && Math.hypot(t.x - o.g.x, t.y - o.g.y) < d0)
      })
      /* 기호에서 이어진 덩이만(글 사이 40 글자 높이 안) */
      const 든 = new Set(), 줄 = [{ x: S.g.x, y: S.g.y }]
      while (줄.length) {
        const a = 줄.pop()
        for (const t of 후보) if (!든.has(t) && Math.hypot(t.x - a.x, t.y - a.y) <= 40 * h) { 든.add(t); 줄.push(t) }
      }
      if (globalThis.__계단dbg) globalThis.__계단dbg.push({ 기: S.기, 제목: 제목.map((g) => g.s), xa, xb, 후보: 후보.length, 든: [...든].map((x) => x.s) })
      if (!든.size) continue
      const 철 = [], 두께글 = []
      for (const t of 든) {
        const u = 붙(t.s).toUpperCase()
        const d = 계단두께꼴.exec(u)
        if (d) { 두께글.push(+(d[1] || d[2])); continue }
        const m = 계단철꼴.exec(u)
        if (!m || m[1] || !m[4]) continue          // «3EA-HD13» 끝 보강 · 간격 없는 글은 안 셈
        const 면 = !m[5] ? '' : /T.*B|상하/.test(m[5]) ? 'TB' : /^(T|상)/.test(m[5]) ? 'T' : 'B'
        철.push({ 글: m[2] + m[3] + '@' + m[4], 면, t })
      }
      if (!철.length) continue
      const B = 철.filter((x) => x.면 === 'B'), T = 철.filter((x) => x.면 === 'T'), TB = 철.filter((x) => x.면 === 'TB'), 무 = 철.filter((x) => x.면 === '')
      let 주근 = '', 상부주근 = '', 배력근 = '', 참주근 = '', 배근 = '단배근'
      if (B.length || T.length) {
        주근 = 센(B.length ? B : T)
        if (B.length && T.length) { 상부주근 = 센(T); 배근 = '복배근' }
        const 남 = [...TB, ...무]
        const 가는 = 남.filter((x) => 굵(x.글) < 굵(주근))
        if (가는.length) 배력근 = 센(가는.filter((x) => 굵(x.글) === Math.min(...가는.map((y) => 굵(y.글)))))
        const 굵은 = TB.filter((x) => 굵(x.글) >= 굵(주근))
        if (굵은.length) 참주근 = 센(굵은)
        if (TB.length) 배근 = '복배근'
      } else {
        const 모 = TB.length ? TB : 무
        const ds = [...new Set(모.map((x) => 굵(x.글)))].sort((p, q) => q - p)
        주근 = 센(모.filter((x) => 굵(x.글) === ds[0]))
        if (ds.length > 1) 배력근 = 센(모.filter((x) => 굵(x.글) === ds[ds.length - 1]))
        if (TB.length) 배근 = '복배근'
      }
      /* 단면 그림 — 같은 길이로 거듭 그린 챌판 · 디딤판(끝이 맞닿은 짝) */
      /* 칸(칸 벽 사이 · 기호 아래 130 글자 높이) 안 — 단면 그림은 철근 글 아래까지 내려가기도 함 */
      const 틀 = [xa, S.g.y - 130 * h, xb, S.g.y]
      const 세 = [], 누 = [], 빗 = []
      for (const s of D.찾기(틀[0], 틀[1], 틀[2], 틀[3])) {
        const x0 = D.sx0[s], y0 = D.sy0[s], x1 = D.sx1[s], y1 = D.sy1[s], L = Math.hypot(x1 - x0, y1 - y0)
        if (Math.abs(x1 - x0) < 1 && L >= 100 && L <= 230) 세.push({ s, x: x0, a: Math.min(y0, y1), b: Math.max(y0, y1), L, ly: D.sly[s] })
        else if (Math.abs(y1 - y0) < 1 && L >= 200 && L <= 360) 누.push({ s, y: y0, a: Math.min(x0, x1), b: Math.max(x0, x1), L, ly: D.sly[s] })
        else if (L > 1500 && Math.abs(x1 - x0) > 300 && Math.abs(y1 - y0) > 300) 빗.push({ x0, y0, x1, y1, L, ly: D.sly[s] })
      }
      const 맞닿 = (v, n) => v.ly === n.ly && (Math.abs(n.a - v.x) < 3 || Math.abs(n.b - v.x) < 3) && (Math.abs(n.y - v.a) < 3 || Math.abs(n.y - v.b) < 3)
      const 짝세 = 세.filter((v) => 누.some((n) => 맞닿(v, n)))
      const 짝누 = 누.filter((n) => 세.some((v) => 맞닿(v, n)))
      const 가운 = (a) => { const b = [...a].sort((p, q) => p - q); return b.length ? b[Math.floor(b.length / 2)] : 0 }
      let 단높이 = 짝세.length >= 4 ? Math.round(가운(짝세.map((v) => v.L))) : 0
      let 단너비 = 짝누.length >= 4 ? Math.round(가운(짝누.map((v) => v.L))) : 0
      let 두께 = 두께글.length ? 두께글[0] : 0, 두께근 = 두께 ? '글' : ''
      if (!두께 && 단높이 && 단너비) {
        /* 디딤 안 모서리(챌판 아래 끝) ~ 같은 층 밑면 빗선(기울기 = 단높이 / 단너비) 수직 거리 */
        const 기 = 단높이 / 단너비
        const 점 = 짝세.map((v) => [v.x, v.a, v.ly])
        let best = null
        for (const l of 빗) {
          const k = Math.abs((l.y1 - l.y0) / (l.x1 - l.x0))
          if (Math.abs(k - 기) > 0.06 * 기) continue
          const ux = (l.x1 - l.x0) / l.L, uy = (l.y1 - l.y0) / l.L
          const ds = 점.filter((p) => p[2] === l.ly).map((p) => Math.abs((p[0] - l.x0) * -uy + (p[1] - l.y0) * ux))
          if (ds.length < 4) continue
          const d = 가운(ds)
          if (d >= 90 && d <= 450 && (!best || d < best)) best = d
        }
        if (best) { 두께 = Math.round(best / 10) * 10; 두께근 = '그림' }
      }
      out.set(S.기, {
        기호: S.기, 두께: 두께 ? String(두께) : '', 주근, 상부주근, 배력근, 참주근, 참배력근: 참주근, 배근, 단높이: 단높이 ? String(단높이) : '', 단너비: 단너비 ? String(단너비) : '', 동: '',
        _근거: (D.이름 || '') + (S.p >= 0 ? ' 판 ' + (S.p + 1) : '') + ' «' + S.g.s.trim() + '» 철근 글 ' + 철.length + '개' + (두께근 === '그림' ? ' · 두께 = 단면 그림(디딤 안 모서리 ~ 밑면)' : ''),
      })
    }
  }
  return out
}

/** 평면 계단판 — 글자 g 곁의 «네모 + 대각선 하나»(개구부 X 는 둘). 나란히 붙은 판끼리 한 계단(되돌림 계단 = 판 둘).
 *  @returns null | {판:[{x0,y0,x1,y1,L,W}], 가로, L, W, 하단참, 상단참, 상자:[x0,y0,x1,y1]} */
function 계단판찾기(D, g) {
  const R = 9000
  const ids = D.찾기(g.x - R, g.y - R, g.x + R, g.y + R)
  const 층이름 = (s) => ((D.layers[D.sly[s]] || {}).name || '')
  const 곧 = [], 빗 = []
  for (const s of ids) {
    if (계단덜층.test(층이름(s))) continue
    const x0 = D.sx0[s], y0 = D.sy0[s], x1 = D.sx1[s], y1 = D.sy1[s]
    const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), L = Math.hypot(dx, dy)
    if (L < 300) continue
    if (dx <= 0.01 * L) 곧.push({ v: true, c: (x0 + x1) / 2, a: Math.min(y0, y1), b: Math.max(y0, y1) })
    else if (dy <= 0.01 * L) 곧.push({ v: false, c: (y0 + y1) / 2, a: Math.min(x0, x1), b: Math.max(x0, x1) })
    else if (dx >= 600 && dy >= 600) 빗.push({ x0: Math.min(x0, x1), y0: Math.min(y0, y1), x1: Math.max(x0, x1), y1: Math.max(y0, y1), 오름: (x1 - x0) * (y1 - y0) > 0 })
  }
  const 덮 = (v, c, a, b) => {
    const iv = 곧.filter((l) => l.v === v && Math.abs(l.c - c) <= 40 && l.b > a && l.a < b).map((l) => [Math.max(a, l.a), Math.min(b, l.b)]).sort((p, q) => p[0] - q[0])
    let n = 0, e = a
    for (const [p, q] of iv) { if (q <= e) continue; n += q - Math.max(p, e); e = q }
    return n / (b - a)
  }
  const 판들 = []
  for (const d of 빗) {
    const w = d.x1 - d.x0, h = d.y1 - d.y0
    const 짧 = Math.min(w, h), 긴 = Math.max(w, h)
    if (짧 < 700 || 짧 > 2600 || 긴 < 1500 || 긴 > 7500 || 긴 / 짧 < 1.15) continue
    if (빗.some((e) => e !== d && e.오름 !== d.오름 && Math.abs(e.x0 - d.x0) < 0.03 * w && Math.abs(e.x1 - d.x1) < 0.03 * w && Math.abs(e.y0 - d.y0) < 0.03 * h && Math.abs(e.y1 - d.y1) < 0.03 * h)) continue
    if (판들.some((p) => Math.abs(p.x0 - d.x0) < 30 && Math.abs(p.x1 - d.x1) < 30 && Math.abs(p.y0 - d.y0) < 30 && Math.abs(p.y1 - d.y1) < 30)) continue
    const 변 = [덮(false, d.y0, d.x0, d.x1), 덮(false, d.y1, d.x0, d.x1), 덮(true, d.x0, d.y0, d.y1), 덮(true, d.x1, d.y0, d.y1)]
    if (변.filter((v) => v >= 0.7).length < 3) continue
    판들.push({ x0: d.x0, y0: d.y0, x1: d.x1, y1: d.y1, 가로: w >= h, L: 긴, W: 짧 })
  }
  if (!판들.length) return null
  const 거리 = (p) => Math.hypot(Math.max(p.x0 - g.x, 0, g.x - p.x1), Math.max(p.y0 - g.y, 0, g.y - p.y1))
  const 씨 = 판들.filter((p) => 거리(p) <= 2500).sort((p, q) => 거리(p) - 거리(q))[0]
  if (!씨) return null
  const 무리 = [씨]
  for (let 더 = true; 더;) {
    더 = false
    for (const p of 판들) {
      if (무리.includes(p) || p.가로 !== 씨.가로) continue
      const 붙음 = 무리.some((q) => {
        const [ca, cb, da, db] = 씨.가로 ? [p.y0, p.y1, q.y0, q.y1] : [p.x0, p.x1, q.x0, q.x1]
        const [la, lb, ma, mb] = 씨.가로 ? [p.x0, p.x1, q.x0, q.x1] : [p.y0, p.y1, q.y0, q.y1]
        const 틈 = Math.max(ca - db, da - cb)
        return 틈 >= -30 && 틈 <= 500 && Math.min(lb, mb) - Math.max(la, ma) >= 0.5 * Math.min(lb - la, mb - ma)
      })
      if (붙음 && 무리.length < 4) { 무리.push(p); 더 = true }
    }
  }
  /* 참 — 판 끝에서 긴 쪽으로 가장 가까운 가로지른 선(벽 · 보 면)까지(4 m 안 · 판 폭의 반 넘게 걸침) */
  const 끝거리 = (p, 끝) => {
    const 세로 = !씨.가로          // 긴 쪽이 y 면 끝은 위 · 아래, 가로지른 선 = 누운 선
    const e = 세로 ? (끝 ? p.y1 : p.y0) : (끝 ? p.x1 : p.x0)
    const [a, b] = 세로 ? [p.x0, p.x1] : [p.y0, p.y1]
    let best = null
    for (const l of 곧) {
      if (l.v === 세로) continue
      const d = 끝 ? l.c - e : e - l.c
      if (d < 50 || d > 4000) continue
      if (Math.min(l.b, b) - Math.max(l.a, a) < 0.5 * (b - a)) continue
      if (best === null || d < best) best = d
    }
    return best
  }
  const 가 = (a) => a.reduce((t, v) => t + v, 0) / a.length
  const L = Math.round(가(무리.map((p) => p.L))), W = Math.round(가(무리.map((p) => p.W)))
  let 하단참 = 0, 상단참 = 0, 중끝 = true
  if (무리.length >= 2) {
    const 끝값 = (p, 끝) => (!씨.가로 ? (끝 ? p.y1 : p.y0) : (끝 ? p.x1 : p.x0))
    const 맞 = (끝) => Math.max(...무리.map((p) => 끝값(p, 끝))) - Math.min(...무리.map((p) => 끝값(p, 끝))) <= 100
    const 깊 = (끝) => { const ds = 무리.map((p) => 끝거리(p, 끝)); return ds.some((d) => d === null) ? null : 가(ds) }
    const d0 = 깊(false), d1 = 깊(true)
    /* 판 끝이 나란히 맞은 쪽 = 중간참(둘 다 맞으면 깊은 쪽) */
    중끝 = 맞(true) && !맞(false) ? true : 맞(false) && !맞(true) ? false : (d1 ?? 0) >= (d0 ?? 0)
    상단참 = Math.round((중끝 ? d1 : d0) ?? W)
    하단참 = Math.round((중끝 ? d0 : d1) ?? 0)
  }
  const 상자 = [Math.min(...무리.map((p) => p.x0)), Math.min(...무리.map((p) => p.y0)), Math.max(...무리.map((p) => p.x1)), Math.max(...무리.map((p) => p.y1))]
  return { 판: 무리, 가로: 씨.가로, L, W, 하단참, 상단참, 상자, 중끝 }
}

/* ───────────────────────────── 🧭 G273 깊은 칸(지하수조 · 저수조 · 정화조 …) — 단면의 깊이 · 벽 · 바닥판 + 건축 평면의 안 크기 */
const 깊은방꼴 = /^(?:지하)?(?:저수조|수조|소화수조|정화조|오수조|우수조|저류조|집수정|침사조|PIT|피트)$/i
const 레벨글꼴 = /^(?:GL|EL|FL|SL)\.?([-+±])?(\d{1,2},\d{3}|\d{1,5})$/
const 깊은덜층 = /CEN|SYM|AREA|LEADER|HID|DIM|TEXT|SITE/i
/**
 * 단면: 방 이름 글(«지하수조») 아래 가장 가까운 바닥 선이 바로 밑 레벨 글(«GL -7,350») 줄이면 그 레벨이 안 바닥 —
 *   좌우 가장 가까운 세로선(바닥까지 내려옴) = 안 폭 · 그 바깥 100 ~ 1,000 mm 안 나란한 세로선 = 벽 두께 · 바닥 선 아래 150 ~ 2,000 mm 가로선(안 폭 80 % 넘게) = 바닥판 두께.
 * 평면: 같은 이름 글에서 네 방향으로 가장 가까운 선까지 = 안 크기 — 한 변이 단면 안 폭과 맞을 때만(±2 % · 60 mm).
 * @returns [{이름, a, b, F, 벽, 바닥, 단면, 평면}] (mm)
 */
function 깊은칸찾기(도면들, 최저) {
  const 끝이름 = (D, ly) => ((D.layers[ly] || {}).name || '')
  const 단면 = []
  const 단면글 = new Set()
  for (const D of 도면들) {
    const 판번 = (x, y) => (D.도곽 && D.도곽.length ? D.도곽번(x, y) : -1)
    const 레 = []
    for (const g of D.글자) { const m = 레벨글꼴.exec(붙(g.s).toUpperCase()); if (m) 레.push({ g, v: +(m[2].replace(/,/g, '')) * (m[1] === '-' ? -1 : 1), 판: 판번(g.x, g.y) }) }
    if (레.length < 2) continue
    for (const g of D.글자) {
      const 이름 = 붙(g.s)
      if (!깊은방꼴.test(이름)) continue
      const 판 = 판번(g.x, g.y)
      const 같 = 레.filter((l) => l.판 === 판)
      if (같.length < 2) continue
      const 아래 = 같.filter((l) => l.g.y < g.y).sort((p, q) => q.g.y - p.g.y)[0]
      if (!아래 || !(아래.v < 최저 - 500)) continue
      const 세로 = [], 가로 = []
      for (const s2 of D.찾기(g.x - 30000, g.y - 15000, g.x + 30000, g.y + 8000)) {
        if (깊은덜층.test(끝이름(D, D.sly[s2]))) continue
        const x0 = D.sx0[s2], y0 = D.sy0[s2], x1 = D.sx1[s2], y1 = D.sy1[s2], L = Math.hypot(x1 - x0, y1 - y0)
        if (L < 300) continue
        if (Math.abs(x1 - x0) <= 0.01 * L) 세로.push({ x: (x0 + x1) / 2, a: Math.min(y0, y1), b: Math.max(y0, y1) })
        else if (Math.abs(y1 - y0) <= 0.01 * L) 가로.push({ y: (y0 + y1) / 2, a: Math.min(x0, x1), b: Math.max(x0, x1) })
      }
      const 바닥선 = 가로.filter((h) => h.y < g.y - g.h && h.a <= g.x && h.b >= g.x).sort((p, q) => q.y - p.y)[0]
      if (!바닥선 || Math.abs(바닥선.y - 아래.g.y) > 3 * Math.max(아래.g.h, 100)) continue
      const yf = 바닥선.y
      const 걸 = (v) => v.a <= yf + 100 && v.b >= g.y
      const 왼 = 세로.filter((v) => v.x < g.x && 걸(v)).sort((p, q) => q.x - p.x)[0]
      const 오 = 세로.filter((v) => v.x > g.x && 걸(v)).sort((p, q) => p.x - q.x)[0]
      if (!왼 || !오) continue
      const w = 오.x - 왼.x
      if (!(w >= 1000 && w <= 40000)) continue
      const 겹 = (v) => Math.min(v.b, g.y) - Math.max(v.a, yf) >= 0.3 * (g.y - yf)
      const 두께들 = []
      const 바깥왼 = 세로.filter((v) => v.x < 왼.x - 99 && v.x > 왼.x - 1001 && 겹(v)).sort((p, q) => q.x - p.x)[0]
      const 바깥오 = 세로.filter((v) => v.x > 오.x + 99 && v.x < 오.x + 1001 && 겹(v)).sort((p, q) => p.x - q.x)[0]
      if (바깥왼) 두께들.push(Math.round(왼.x - 바깥왼.x))
      if (바깥오) 두께들.push(Math.round(바깥오.x - 오.x))
      if (!두께들.length) continue
      const 밑 = 가로.filter((h) => h.y < yf - 149 && h.y > yf - 2001 && Math.min(h.b, 오.x) - Math.max(h.a, 왼.x) >= 0.8 * w).sort((p, q) => q.y - p.y)[0]
      if (!밑) continue
      단면.push({ 이름, w: Math.round(w), F: 아래.v, 벽: Math.min(...두께들), 바닥: Math.round(yf - 밑.y), 근거: (D.이름 || '') + (판 >= 0 ? ' 판 ' + (판 + 1) : '') })
      단면글.add(g)
    }
  }
  if (!단면.length) return []
  const 이름들 = new Set(단면.map((x) => x.이름))
  const out = []
  const 벽층꼴 = /WALL|벽|COL|CON(?!T)|기둥/i
  for (const D of 도면들) {
    /* 평면은 벽 · 기둥 층 선까지만(건축 평면의 장비 · 가구 · 기타 선 — 현장 A 지하수조 안 위생수조 · 소화수조 상자) · 그런 층이 없는 도면은 주석 층만 뺌 */
    const 벽층있음 = D.layers.some((L) => 벽층꼴.test(L.name || ''))
    for (const g of D.글자) {
      const 이름 = 붙(g.s)
      if (!이름들.has(이름) || 단면글.has(g)) continue
      const 쏘기 = (dx, dy) => {
        let best = Infinity
        const 비 = dx ? Math.max((g.w || 붙(g.s).length * g.h) / 2 + 150, 1.5 * g.h) : 1.5 * g.h
        for (const s2 of D.찾기(g.x - 40000, g.y - 40000, g.x + 40000, g.y + 40000)) {
          const ln = 끝이름(D, D.sly[s2])
          if (깊은덜층.test(ln) || (벽층있음 && !벽층꼴.test(ln))) continue
          const x0 = D.sx0[s2], y0 = D.sy0[s2], x1 = D.sx1[s2], y1 = D.sy1[s2]
          if (Math.hypot(x1 - x0, y1 - y0) < 500) continue
          const ex = x1 - x0, ey = y1 - y0, det = dx * (-ey) - dy * (-ex)
          if (Math.abs(det) < 1e-9) continue
          const rx = x0 - g.x, ry = y0 - g.y
          const t = (rx * (-ey) - ry * (-ex)) / det, u = (dx * ry - dy * rx) / det
          if (t > 비 && u >= 0 && u <= 1 && t < best) best = t
        }
        return best
      }
      const 오 = 쏘기(1, 0), 왼 = 쏘기(-1, 0), 위 = 쏘기(0, 1), 아 = 쏘기(0, -1)
      if (![오, 왼, 위, 아].every(Number.isFinite)) continue
      const a = Math.round(오 + 왼), b = Math.round(위 + 아)
      const 맞 = (w, x) => Math.abs(w - x) <= Math.max(60, 0.02 * w)
      const 짝 = 단면.filter((x) => x.이름 === 이름 && (맞(x.w, a) || 맞(x.w, b)))
      if (!짝.length) continue
      const 둘다 = 단면.some((x) => x.이름 === 이름 && 맞(x.w, a)) && 단면.some((x) => x.이름 === 이름 && 맞(x.w, b))
      /* 단면 폭이 둘 넘게(가로 · 세로 단면) 있으면 평면 두 변이 다 맞아야 — 한 변만 맞는 다른 방(현장 A «지하수조» 글이 붙은 지하층 기계실 9.97 × 11.9 m)은 뺌 */
      const 폭들 = [...new Set(단면.filter((x) => x.이름 === 이름).map((x) => Math.round(x.w / 100)))]
      if (폭들.length >= 2 && !둘다) continue
      if (out.some((o) => o.이름 === 이름 && Math.abs(o.a - a) < 100 && Math.abs(o.b - b) < 100)) continue
      const s0 = 짝[0]
      out.push({ 이름, a, b, F: s0.F, 벽: s0.벽, 바닥: s0.바닥, 둘다, 단면: [...new Set(짝.map((x) => x.근거))].join(' · '), 평면: (D.이름 || '') })
    }
  }
  return out
}
const 높이글표 = (v) => (v > 0 ? '+' : v < 0 ? '−' : '±') + Math.abs(Math.round(v)).toLocaleString('en-US')
/** 🧭 G270 {D16:500,…} → «D16 이상 fy 500 (나머지 400)» */
function 강도글요약(fy규격, fy) {
  const ds = Object.keys(fy규격)
  const 값들 = [...new Set(ds.map((d) => fy규격[d]))]
  if (값들.length === 1) { const 작은 = ds.map((d) => +d.slice(1)).sort((a, b) => a - b)[0]; return 'D' + 작은 + ' 이상 fy ' + 값들[0] + ' (나머지 ' + fy + ')' }
  return ds.map((d) => d + ' ' + fy규격[d]).join(' · ')
}
/* 🧭 G332 (2026-10-20) 도면에서 읽은 벽 줄(_양면 · «높이» · «상부» 가 빈 줄 = 층고 그대로)은 위 슬래브 두께만큼 낮춤 —
     기둥(층고 − 슬래브)과 같은 규칙 · BIM 화면(BIM모델.js 겹친것빼기의 «벽 윗면 공제»)과 같은 값. 파라펫 · 기타 벽 · 높이를 읽은 줄 · 사람이 «상부» 를 적은 줄은 그대로.
     전엔 골조 · 도면 물량 자동 화면에서 벽이 층고 그대로라 슬래브와 겹친 몫(길이 × 두께 × 슬래브)을 두 번 셈 — 예시 W1 3.888 → 3.726 ㎥(BIM 3.726)
     골조읽기 안에 넣지 않은 까닭: BIM 화면은 3D 로 벽 토막마다 위를 보고 공제하므로(빈 «상부» 를 봄) 그대로 둠 */
export function 벽윗면공제(공사) {
  if (!공사 || !Array.isArray(공사.동)) return 공사
  const 판 = new Map((공사.층 || []).map((f) => [String(f.이름), +f.슬라브 || 0]))
  const 구분 = new Map((((공사.배근 || {}).벽) || []).map((w) => [String(w.기호), String(w.구분 || '')]))
  let n = 0
  const 동 = 공사.동.map((d) => {
    const rows = (d.주자료 || {}).옹벽
    if (!Array.isArray(rows)) return d
    const 새 = rows.map((r) => {
      if (!r._양면 || String(r.상부 ?? '').trim() || String(r.높이 ?? '').trim()) return r
      if (/파라|기타/.test(구분.get(String(r.기호)) || '')) return r
      const t = 판.get(String(r.층)) || 0
      if (!(t > 0)) return r
      n++
      return { ...r, 상부: String(t), _윗공제: true }
    })
    return { ...d, 주자료: { ...d.주자료, 옹벽: 새 } }
  })
  return n ? { ...공사, 동 } : 공사
}

export function 골조읽기(도면들0, o = {}) {
  try { return 골조읽기0(도면들0, o) } finally { 벽허용 = null; 데크허용 = false }
}
function 골조읽기0(도면들0, o = {}) {
  const 경고 = []
  const 도면들 = 도면들0.map((d, 번) => ({ ...준비(d.모델, d.k || 1, 번), 이름: d.이름 || '' }))
  벽허용 = 벽표기호(도면들)
  데크허용 = 도면들.some((D) => D.글자.some((g) => /DECK|데크/i.test(g.s)))
  const { 정의, 쓴글자, 철골 } = 일람표읽기(도면들, 경고)
  /* 🧭 G248 판마다 «무엇을 읽어 썼나» (화면 «판 목록» 의 읽은 것 칸) — 번|판 → { 기호: {종류: n}, 정의: {종류: n}, 철근글, 바닥단면, 바닥철근 } */
  const 쓰임표 = new Map()
  const 쓰임 = (D, x, y) => {
    const p = D.도곽 && D.도곽.length ? D.도곽번(x, y) : -1
    if (p < 0) return null
    const k = D.번 + '|' + p
    let o = 쓰임표.get(k)
    if (!o) { o = { 기호: {}, 정의: {}, 철근글: 0 }; 쓰임표.set(k, o) }
    return o
  }
  for (const d of 정의) { const D = 도면들[d.번]; const o = D && d.g ? 쓰임(D, d.g.x, d.g.y) : null; if (o) o.정의[d.종류] = (o.정의[d.종류] || 0) + 1 }
  for (const D of 도면들) for (const g of D.글자) if (/^(?:\d{1,3}-)?H?D\d{2}(?:@\d{2,4})?$/.test(g.u)) { const o = 쓰임(D, g.x, g.y); if (o) o.철근글++ }
  const 철골수 = new Map()
  const SRC짝 = new Map()        // 🧭 G290 평면 C 기호 → 그 층 SRC 정의
  const 근거 = []

  /* 층 높이 */
  const 높이 = new Map()
  for (const D of 도면들) {
    for (const g of D.글자) {
      const h = 높이글(g.s)
      if (!h) continue
      let 층 = h.층
      if (!층) {
        let best = null, bd = Infinity
        for (const o2 of D.글자) {
          if (o2 === g || Math.abs(o2.y - g.y) > 1.2 * Math.max(g.h, o2.h)) continue
          const dx = g.x - o2.x
          if (dx <= 0 || dx > 25 * g.h) continue
          if (/^\s*B\d{1,2}\s*$/i.test(o2.s)) continue        // 🧭 G240 홀로 쓴 «B2» 는 보 기호 — 층 이름 아님
          const f = 층글(o2.s)
          if (f && dx < bd) { bd = dx; best = f }
        }
        층 = best
      }
      if (층 && !높이.has(층)) 높이.set(층, h.v)
    }
  }
  /* 🧭 G237 단면 · 입면 · 골조입면의 레벨 표(«2nd FL / 1FL +4,100» · «지상 3 층 / 8100» · «PIT FL») — 건축과 같은 함수(building3d.js 층높이찾기)로 읽어 빈 층을 채움
       (소장님 「모든 도면에 단면도 있고, 높이가 나와. 짐작은 빼」) */
  try {
    const 파일글 = 도면들.map((D) => ({ 이름: D.이름, texts: D.글자.map((g) => ({ s: g.s, x: g.x0 != null ? g.x0 : g.x, y: g.y, h: g.h, ly: (D.layers[g.ly] || {}).name || '' })) }))
    let 건 = 층높이찾기(파일글).높이
    /* 🧭 G241 이름 없는 레벨 줄(FL±0 · FL+5400 · FL+9400 …)도 건축과 같이 — 현장 C: 골조 1층 층고를 3,300 으로 짐작했음(소장님 「짐작은 빼」) */
    try { const 층들 = [...new Set(파일글.flatMap((f) => 평면제목(f.texts).map((t) => t.층)))]; if (층들.length) 건 = 레벨줄채우기(파일글, 층들, 건).h } catch (e) { /* 그대로 */ }
    /* 숫자 층(지하 · 지상)만 그대로 · 지붕(R) · 옥탑(PH)은 골조에 그 층 평면 제목이 있을 때만(층 이름 뜻이 도면마다 달라서 — 건축 RF ↔ 골조 R) */
    const 제목바닥 = new Set()
    for (const D of 도면들) for (const g of D.글자) { const f = 제목층(g.s); if (f) for (const x of f) 제목바닥.add(x) }
    for (const [k, v] of Object.entries(건)) {
      /* 🧭 G290 레벨 표의 «옥상지붕»(층높이찾기 = PH)은 골조 평면 제목이 «옥상지붕 구조평면도»(PR)뿐이면 PR — 실제 구조도면 점검: 옥탑 층고를 3,300 으로 짐작했음(골구도 2,800) */
      const f = /^B?\d+$/.test(k) ? k : k === 'RF' && 제목바닥.has('R') ? 'R' : k === 'PH' && 제목바닥.has('PH') ? 'PH' : k === 'PH' && 제목바닥.has('PR') ? 'PR' : null
      if (f && !높이.has(f)) 높이.set(f, v)
    }
    /* 🧭 G271 PH 평면(«PHF-2»)의 기둥 · 벽은 PH 바닥에서 위로 — 그 위 레벨이 없으면 입면 «Roof-1 · Roof-2»(옥탑 위 지붕) 가운데 PH 보다 높은 가장 낮은 것을 PR 로.
         (현장 B 골조입면도: RF +7,600 · PH FL +10,400 · Roof-1 +11,300 · Roof-2 +13,400 — 높은 경사 지붕 동의 기둥이 2층 바닥에서 +11,300 까지) */
    if (제목바닥.has('PH') && 높이.has('PH') && !높이.has('PR')) {
      const 위들 = []
      for (const f of 파일글) {
        for (const t of f.texts) {
          if (!/^ROOF[-\s]?\d$/i.test(String(t.s || '').trim())) continue
          const h = t.h || 300
          let best = null, bd = Infinity
          for (const q of f.texts) {
            const dx = q.x - t.x, dy = q.y - t.y
            if (Math.abs(dx) > 8 * h || dy > 0.6 * h || dy < -4 * h) continue
            const r = 높이글(q.s)
            if (!r || (r.층 && !r.일층기준)) continue
            const d = Math.hypot(dx * 0.5, dy)
            if (d < bd) { bd = d; best = r }
          }
          if (best && best.v > 높이.get('PH')) 위들.push(best.v)
        }
      }
      if (위들.length) 높이.set('PR', Math.min(...위들))
    }
    /* 지하 1층 평면 옆 «PIT 평면» 이 있고 지하 1층 레벨은 없으면 PIT FL = 지하 1층 바닥(건축과 같은 규칙) */
    if (!높이.has('B1') && 건.PIT != null && 도면들.some((D) => D.글자.some((g) => /PIT\s*(구조)?\s*평면/i.test(g.s)))) 높이.set('B1', 건.PIT)
  } catch (e) { /* 레벨 표가 없으면 그대로 */ }

  /* 평면 제목 */
  const 제목들 = []
  /* 🧭 G246 도면 목록 판(도면 목록표 · 목차 · DRAWING LIST)의 줄은 평면 제목이 아님 — 현장 A S-001 목록의 «지상7층 주심도» 가 7층을 만들어
       옥상 구조평면도 부재 55개가 6층이 아닌 7층(높이 짐작)으로 갔음(목록을 같이 넣으면 물량이 10 ㎥ 바뀜) */
  const 목록판 = (D, p) => p >= 0 && /목록|목차|차례|DRAWING\s*LIST|DRAWINGINDEX|INDEX\s*OF\s*DRAWING/i.test(String((D.판제목 || [])[p] || ''))
  for (const D of 도면들) for (const g of D.글자) { const f = 제목층(g.s); if (!f) continue; const 판 = D.도곽.length ? D.도곽번(g.x, g.y) : -1; if (목록판(D, 판)) continue; 제목들.push({ D, g, f, 기둥판: 기둥제목(g.s), 이름: 붙(g.s).toUpperCase(), 판 }) }
  /* 📑 2026-10-16 (다) 소장님 「박스형으로 여러 장이 든 도면에서 판 제목을 못 읽은 장은 «이 장은 몇 층?» 을 고르게」
       o.판층 { '번|판': 'FT' | 'B1' | '2' | 'R' … } — 그 판의 평면 제목을 사람이 고른 층으로(그 판 안 다른 제목은 버림).
       제목이 없는 판의 부재 기호는 이웃 판의 제목을 잘못 집거나(다른 층) 빠졌음 → 판 목록에서 고르면 그 층으로 셈 */
  if (o.판층) for (const [키, f] of Object.entries(o.판층)) {
    if (!f) continue
    const [번s, 판s] = String(키).split('|'), D = 도면들[+번s], p = +판s
    if (!D || !D.도곽 || !D.도곽[p]) continue
    for (let i = 제목들.length - 1; i >= 0; i--) if (제목들[i].D === D && 제목들[i].판 === p) 제목들.splice(i, 1)
    const r = D.도곽[p]
    const 글 = (f === 'FT' ? '기초' : f === 'R' ? '지붕층' : f === 'PH' ? '옥탑층' : /^B\d/.test(f) ? '지하' + f.slice(1) + '층' : f + '층') + ' 구조평면도'
    const ff = 제목층(글)
    const h = Math.max(1, (r[3] - r[1]) * 0.01)
    if (ff) 제목들.push({ D, g: { s: 글, u: 붙(글).toUpperCase(), x: (r[0] + r[2]) / 2, y: r[1] + (r[3] - r[1]) * 0.04, h, i: -1 }, f: ff, 기둥판: false, 이름: 붙(글).toUpperCase(), 판: p, 고름: f })
  }
  const 바닥들 = new Set()
  for (const t of 제목들) for (const f of t.f) if (f !== 'FT') 바닥들.add(f)
  for (const f of 높이.keys()) 바닥들.add(f)
  for (const d of 정의) if (d.범위) for (const f of d.범위.목록 || [d.범위.a, d.범위.b]) if (f && f !== 'FT' && (d.종류 === '보' || d.종류 === '슬라브')) 바닥들.add(f)
  if (바닥들.size && ![...바닥들].some((f) => f === '1' || /^B/.test(f))) 바닥들.add('1')
  if (바닥들.has('PR') && !바닥들.has('R')) 바닥들.add('R')
  /* 🧭 G250 주심도(기둥 평면) 층 f 의 기둥 · 벽은 f 바닥 ~ 위 바닥 — 위 바닥 제목이 없으면 지붕(R)을 둠(f 가 맨 위 바닥 = 지붕으로 잘려 그 층 기둥 · 벽이 빠졌음) */
  for (const t of 제목들) if (t.기둥판) for (const f of t.f) if (f !== 'FT' && f !== 'R' && f !== 'PR' && ![...바닥들].some((x) => 층값(x) > 층값(f))) 바닥들.add('R')
  const 바닥차례 = [...바닥들].sort(층차례)
  /** 바닥 L 을 보는 평면의 부재 → 그 아래 층 */
  const 아래층 = (L) => {
    if (L === 'FT') return 'FT'
    const i = 바닥차례.indexOf(L)
    if (i <= 0) return 'FT'
    return 바닥차례[i - 1]
  }
  /** 범위 → 이름들 */
  const 펼치기 = (범) => {
    if (!범) return null
    if (범.목록) return 범.목록
    const 모두 = [...new Set([...바닥차례, 범.a, 범.b])].sort(층차례)
    const i = 모두.indexOf(범.a), j = 모두.indexOf(범.b)
    return 모두.slice(Math.min(i, j), Math.max(i, j) + 1)
  }
  const 바닥종 = (종) => 종 === '보' || 종 === '슬라브'
  /** 정의의 범위 → 층들(골조.js 의 층 이름) */
  const 층으로 = (종, 이름들) => new Set(이름들.map((f) => (종 === '기초' ? 'FT' : 바닥종(종) ? 아래층(f) : f)))

  /* 제목 찾기 — 기호 글자(또는 일람표 칸)가 어느 평면 제목에 붙나: 제목은 보통 평면 «아래». 옆 도면과 헷갈리지 않게 가로 거리를 먼저 봄 */
  const 제목찾기 = (D, g) => {
    /* 🛠 G118 — 도곽 안의 글자는 «같은 도곽 안» 제목에서 고름(거리 제한 없이).
       그 도곽에 제목이 하나도 없으면(도곽이 아닌 큰 네모일 수도) 예전처럼 가까운 제목을 찾음 */
    const 판 = D.도곽 && D.도곽.length ? D.도곽번(g.x, g.y) : -1
    const 안 = 판 >= 0 ? 제목들.filter((t) => t.D === D && t.판 === 판) : []
    if (안.length) {
      let best = null, bd = Infinity, 아무 = null, ad = Infinity
      for (const t of 안) {
        const dy = g.y - t.g.y, dx = Math.abs(g.x - t.g.x)
        const d = dx + 0.3 * Math.max(0, dy)
        if (d < ad) { ad = d; 아무 = t }
        if (dy < -2 * t.g.h) continue
        if (d < bd) { bd = d; best = t }
      }
      return best || 아무
    }
    let best = null, bd = Infinity
    for (const t of 제목들) {
      if (t.D !== D) continue
      const dy = g.y - t.g.y, dx = Math.abs(g.x - t.g.x)
      if (dy < -2 * t.g.h || dy > 80000 || dx > 60000) continue
      const d = dx + 0.3 * Math.max(0, dy)
      if (d < bd) { bd = d; best = t }
    }
    return best
  }
  const 제목층들 = (t, 종) => (t.기둥판 && 종 !== '보' && 종 !== '슬라브' ? t.f : t.f.map(아래층))

  /* 🧭 G263 단면 치수 글자로 «짐작» 한 기둥 · 보 크기는 같은 기호에 크기를 바로 적은 정의(평면 범례 «C3 ø500» · 표 «500X700»)가 있으면 버림 —
       현장 B S-401 기둥 단면 C3 의 치수 500 · 500 을 사각 500 × 500 으로 읽어 범례의 둥근 기둥 ø500 을 덮었음(콘크리트 · 거푸집이 사각으로) */
  짐작크기버림(정의)
  /* 같은 기호가 다르게 여러 번(층마다 다른 목록) → 그 목록이 놓인 평면의 층으로 */
  const 서명 = (r) => ['폭', '춤', '상부', '하부', '늑근단부', '늑근중앙', '가로', '세로', '지름', '주근', '대근단부', '두께', '단변하부', '장변하부', '수직', '수평', '하부가로'].map((k) => r[k] || '').join('|')
  const 무리 = new Map()
  for (const d of 정의) { if (d.명시 || d.보조) continue; const k = d.종류 + '|' + d.기호; let a = 무리.get(k); if (!a) { a = []; 무리.set(k, a) } a.push(d) }
  for (const [, ds] of 무리) {
    if (ds.length < 2 || new Set(ds.map((d) => 서명(d.r))).size < 2) continue
    for (const d of ds) {
      const t = 제목찾기(도면들[d.번], d.g)
      if (t) { d.층들 = new Set(제목층들(t, d.종류)); d.시트 = true }
    }
  }
  for (const d of 정의) if (d.명시) d.층들 = 층으로(d.종류, 펼치기(d.범위))

  /* 합치기 — 빈 칸은 다른 정의(같은 기호)로 채움: 평면 목록의 크기 + 일람표의 철근 */
  const 합 = (위, 아래) => { const m = { ...(아래 || {}) }; for (const [k, v] of Object.entries(위 || {})) { if (v === '' || v == null) continue; if (!k.startsWith('_')) m[k] = v; else if (m[k] == null) m[k] = v } return m }      // _ 칸(_윗면 …)은 빈 쪽만 채움
  const 전역 = { 보: new Map(), 기둥: new Map(), 슬라브: new Map(), 벽: new Map(), 기초: new Map() }
  for (const d of 정의) {
    if (d.층들) continue
    const m = 전역[d.종류]
    m.set(d.기호, 합(m.get(d.기호), d.r))       // 먼저 읽은 것이 앞(빈 칸만 뒤의 것으로)
  }
  /* 🧭 G248 같은 이름 무리 보(B1 · B1a · B1b · B1c — 끝 글자만 다른 기호)의 크기(폭 · 춤)가 같고 그 가운데 하나만 단면 그림에 철근 동그라미가 있으면
       나머지(그림이 구름 표시만 남은 칸)도 그 철근 — 현장 C BEAM LIST: «B1b · B1c» 상부 7 · 하부 7+7 · 옆 2(PDF 표 «TOP 7-HD22 · BOTTOM 7-HD25/7-HD22 ·
       SUB 2-HD16» 과 개수 같음), «B1 · B1a» 칸은 고친 자리 구름만. 무리 안 그림 철근이 갈리면 안 채움 · 채운 것은 알림(배근표에서 확인) */
  const 무리철근 = []
  {
    const 무리키 = (k) => { const m = /^(.*\d)[A-Z]{1,2}$/.exec(k); return m ? m[1] : k }
    for (const [k, r] of 전역.보) {
      if (r.상부 || r.하부 || !r.폭 || !r.춤) continue
      const 같은 = [...전역.보].filter(([k2, r2]) => k2 !== k && 무리키(k2) === 무리키(k) && r2._그림철근 && r2.폭 === r.폭 && r2.춤 === r.춤)
      const 서명들 = new Set(같은.map(([, r2]) => r2.상부 + '|' + r2.하부 + '|' + r2.부근))
      if (!같은.length || 서명들.size !== 1) continue
      const [k2, r2] = 같은[0]
      /* 🧭 G405 짐작 금지 — 같은 무리 보의 그림 철근을 빌려 넣지 않음(현장 P② B1 · B1a ← B1b 7-D25/14-D25 를 빌렸었음 · B1 · B1a 단면엔 철근이 안 그려져 있음). 알려만 줌 → 일람채우기 «❓ … (같은 무리 «B1B» 단면 철근)» */
      전역.보.set(k, { ...r, _무리힌트: k2 + ' 단면 철근 ' + r2.상부 + ' / ' + r2.하부, _무리기호: k2 })
      무리철근.push(k + '←' + k2)
    }
  }
  const 층정의 = { 보: new Map(), 기둥: new Map(), 슬라브: new Map(), 벽: new Map(), 기초: new Map() }
  for (const d of 정의) {
    if (!d.층들) continue
    const m = 층정의[d.종류]
    let a = m.get(d.몸); if (!a) { a = []; m.set(d.몸, a) }
    a.push(d)
  }
  const 짐작칸 = new Set()
  for (const d of 정의) if (d.r._짐작) 짐작칸.add(d.r._짐작)
  const 배근행 = { 보: new Map(), 기둥: new Map(), 슬라브: new Map(), 벽: new Map(), 기초: new Map() }
  /* 🧭 G274 계단 일람 · 계단 배근도(기호 → 두께 · 철근 · 단 높이) */
  const 계단일람 = 계단일람찾기(도면들)
  /** 평면 기호 r 을 층 f 에서 쓸 배근 기호 — 없으면 null */
  /** 일람표의 «층 붙은 기호»(2G3A = 2층 바닥 보 · RG4 = 지붕 보) 중 이 층 f 의 것 — 기호 몸이 같고 그 층표가 f 로 가는 것 */
  const 층표기호 = (종, r, f) => {
    for (const [k] of 전역[종]) {
      const kr = 기호풀이(k)
      if (!kr || kr.몸 !== r.몸 || !kr.층표) continue
      const 제층 = 층말(kr.층표)
      if (!제층) continue
      const 그층 = 종 === '기초' ? 'FT' : 바닥종(종) ? 아래층(제층) : 제층
      if (그층 === f) return k
    }
    return null
  }
  /* 🧭 G387 겹몸 — 일람표에 «층 붙은 기호»(1S1A · RG1)가 있고, 같은 몸의 층 범위 정의(2~4 S1A · …)로 «층 + 몸» 이름을 붙이면 그 기호와 같은 이름이 다른 층을 가리키게 되는 몸 */
  const 겹몸표 = new Map()
  const 겹몸 = (종, 몸) => {
    const key = 종 + '|' + 몸
    if (겹몸표.has(key)) return 겹몸표.get(key)
    let v = false
    const 층들 = new Set((층정의[종].get(몸) || []).flatMap((d) => [...d.층들]))
    for (const [k] of 전역[종]) {
      const kr = 기호풀이(k)
      if (!kr || kr.몸 !== 몸 || !kr.층표) continue
      const 제층 = 층말(kr.층표)
      if (!제층) continue
      for (const f of 층들) if (f + 몸 === k && 아래층(제층) !== f) v = true
    }
    겹몸표.set(key, v)
    return v
  }
  const 기호정하기 = (r, f0) => {
    const 종 = r.종류
    let f = f0
    let 층것 = (층정의[종].get(r.몸) || []).filter((d) => d.층들.has(f)).sort((a, b) => (b.명시 ? 1 : 0) - (a.명시 ? 1 : 0))
    /* 🧭 G249 기초 평면(지하층 바닥)에 적힌 벽 기호는 맨 아래 층 벽 — 벽체 일람표가 층마다만 있으면(현장 A CW5 «B1F · 1F · …») 그 맨 아래 층 것으로 */
    /* 🧭 G405 평면 범례(«CW2,CW7,CW8 | 200» — 두께만 · 철근 없음)가 있어도 층마다 일람(벽체 일람표 B1F 줄)이 있으면 그 맨 아래 층 것으로 — 현장 Y 지하 코어벽 CW1 ~ CW8 철근이 «도면에 없음» 이 됐음 */
    const 전역벽 = 종 === '벽' ? 전역.벽.get(r.기호) || 전역.벽.get(r.몸) : null
    if (!층것.length && 종 === '벽' && f === 'FT' && (!전역벽 || 철없음.벽(전역벽))) {
      const 모든 = 층정의.벽.get(r.몸) || []
      const 아래 = [...new Set(모든.flatMap((d) => [...d.층들]))].filter((x) => x !== 'FT').sort(층차례)[0]
      if (아래) { f = 아래; 층것 = 모든.filter((d) => d.층들.has(f)).sort((a, b) => (b.명시 ? 1 : 0) - (a.명시 ? 1 : 0)) }
    }
    if (층것.length) {
      /* 🧭 G245 평면 범례(«2G3,2G3A … 400X700» 처럼 크기만)가 층마다 있어도, 일람표에 그 층의 기호(2G3A · RG3A)가 있으면 그 배근을 바탕으로 · 이름도 그것으로
         (현장 B: 범례 크기만 쓰고 일람표 «2G3A 3-D22 · D13@150» 을 안 써 보 철근이 빠졌고, 보 이름이 1G3A · 2G4 로 바뀌었음) */
      const 층표것 = 전역[종].has(r.기호) ? null : 층표기호(종, r, f)
      const 바탕 = 전역[종].get(r.기호) || (층표것 && 전역[종].get(층표것)) || 전역[종].get(r.몸) || {}
      let m = { ...바탕 }
      for (const d of 층것.slice().reverse()) m = 합(d.r, m)
      let 이름 = 층표것 || ((f === 'FT' ? 'FT' : f) + r.몸)
      /* 🧭 G387 이름 겹침 — «층 + 몸» 이름(1S1A = 1층 위 바닥)이 일람표의 «층 붙은 기호»(1S1A = 1층 바닥 · 다른 층)와 같아지는 몸(겹몸)은
           그 몸 전부를 바닥 층 이름(1층 위 바닥 → 2S1A · 2층 위 → 3S1A)으로 — 일람표 이름과 같은 꼴. 그 이름의 일람 줄이 있으면 그것을 바탕으로.
           현장 A S-301: «1S1A»(1층 바닥 HD13@200) 와 «2~4 S1A»(HD10@150 · 300) — 1층 위 바닥이 «1S1A» 로 이름 붙어 1층 바닥 철근을 덮었음.
           현장 B: 지붕 보 «RG1» 과 옥탑 바닥 보(층 R + G1 = RG1)가 한 줄을 같이 써 RG1 일람 철근이 빠지고(같은 몸 2G1 것을 빌림) 옥탑 PHG1 일람을 안 썼음 */
      if (!층표것 && 바닥종(종) && f !== 'FT' && 겹몸(종, r.몸)) {
        const i = 바닥차례.indexOf(f)
        if (i >= 0 && i + 1 < 바닥차례.length) {
          이름 = 바닥차례[i + 1] + r.몸
          if (전역[종].has(이름)) { m = { ...전역[종].get(이름) }; for (const d of 층것.slice().reverse()) m = 합(d.r, m) }
        }
      }
      m.기호 = 이름
      배근행[종].set(이름, m)
      return 이름
    }
    const 쓰기 = (k) => { const m = { ...전역[종].get(k), 기호: k }; 배근행[종].set(k, m); return k }
    if (전역[종].has(r.기호)) return 쓰기(r.기호)
    { const k = 층표기호(종, r, f); if (k) return 쓰기(k) }
    if (전역[종].has(r.몸)) return 쓰기(r.몸)
    return null
  }
  const 배근있음 = 정의.length > 0
  /* 🧭 G250 일람표에 없는 평면 기호 → 일람 줄을 만듦: 크기 = 도면에서 잰 값(보 · 벽 = 평면 두 선 폭 · 기둥 · 기초 = 기호 곁 닫힌 도형)만.
       🧭 G405 짐작 금지 — 보 춤 · 슬래브 · 기초 두께 · 철근은 «흔한 값» 으로 채우지 않음(빈칸 → 일람채우기가 «❓ 도면에 없음»).
       건축 참조 층(«…$0$…» · XR)의 글 · 철골 기호(SC · SG · SB)는 안 만듦 */
  const 만든기호 = []
  const 줄틀 = (종) => Object.fromEntries(((배근칸 && 배근칸[종]) || []).map((c) => [c[1], '']))
  const 일람만들기 = (r, D, g) => {
    const 종 = r.종류
    if (!전역[종] || /^S[CGB]\d/.test(r.몸)) return null
    const ln = (D.layers[g.ly] || {}).name || ''
    if (/\$0\$|^XR|XREF|^A[-_ ]|건축|ARCH/i.test(ln)) return null
    let row = null, 글0 = ''
    const 곳 = D.이름 ? '(' + D.이름 + ')' : ''
    if (종 === '보' || 종 === '벽') {
      const 띠 = 띠찾기(D, g, 0, 1200)
      if (!띠) return null
      const w = 둥글(띠.g, 10)
      if (종 === '보') {
        row = { ...줄틀(종), 기호: r.기호, 폭: String(w), 춤: '', 종류: '전단보' }
        글0 = '📐 폭 ' + w + ' = 평면 두 선을 잼' + 곳
      } else { row = { ...줄틀(종), 기호: r.기호, 두께: String(w), 배근: '복배근', 구분: '구조벽' }; 글0 = '📐 두께 ' + w + ' = 평면 두 선을 잼' + 곳 }
    } else if (종 === '기둥' || 종 === '기초') {
      let best = null, bd = Infinity
      const lim = 종 === '기둥' ? 3000 : 15000
      for (const c of D.닫힌) {
        if (c.글틀) continue
        const w = c.b[2] - c.b[0], h = c.b[3] - c.b[1]
        if (w < 150 || h < 150 || w > lim || h > lim) continue
        const cx = (c.b[0] + c.b[2]) / 2, cy = (c.b[1] + c.b[3]) / 2, d = Math.hypot(cx - g.x, cy - g.y)
        const 안 = g.x > c.b[0] && g.x < c.b[2] && g.y > c.b[1] && g.y < c.b[3]
        /* 기초는 기호를 품은 도형(800 넘게)만 — 곁의 기둥 네모를 기초로 보지 않게 */
        if (종 === '기초' ? !(안 && w >= 800 && h >= 800) : !(안 || d < Math.max(w, h) + 10 * g.h)) continue
        if (d < bd) { bd = d; best = c }
      }
      if (!best) return null
      const w = 둥글(best.b[2] - best.b[0], 10), h = 둥글(best.b[3] - best.b[1], 10)
      if (종 === '기둥') { row = best.원 ? { ...줄틀(종), 기호: r.기호, 지름: String(w), 형태: '원형' } : { ...줄틀(종), 기호: r.기호, 가로: String(w), 세로: String(h), 형태: '사각' }; 글0 = '📐 ' + (best.원 ? '지름 ' + w : w + '×' + h) + ' = 평면 그림을 잼' + 곳 }
      else { row = { ...줄틀(종), 기호: r.기호, 종류: '독립', 가로: String(w), 세로: String(h), 두께: '' }; 글0 = '📐 ' + w + '×' + h + ' = 평면 그림을 잼' + 곳 }
    } else if (종 === '슬라브') {
      const 데 = /^DS/.test(r.몸) && 데크허용
      row = { ...줄틀(종), 기호: r.기호, 두께: '', 상부꼴: '전장', 종류: 데 ? '데크' : '양방향' }
      글0 = 데 ? 'DS = 데크 슬래브(거푸집 없음)' : ''
    }
    if (!row) return null
    row.만든 = '건설맵: 일람표에 없는 기호' + (글0 ? ' — ' + 글0 : '')
    전역[종].set(r.기호, row)
    배근행[종].set(r.기호, { ...row })
    만든기호.push(r.기호)
    return r.기호
  }

  /* 평면 기호 → 평면(제목)으로 */
  const 기호글자 = []
  const 위아래글 = []          // 🧭 G299 «G1(상, 하)» 글 — 그 자리 보 줄은 두 개(QT × 2)
  for (const D of 도면들) {
    /* 🧭 G245 겹쳐 찍힌 같은 «기둥 · 기초» 기호 글자(같은 글 · 글자 높이 반 안 · 높이 비슷)는 하나 — 화면엔 한 글자로 보임.
       xref 를 겹쳐 끼운 도면(현장 B S-101: 제 글자 + xref 글자가 9 mm 어긋나 둘)에서 기둥이 둘로 셈해졌음(둘째 글자가 옆 모양 · 글자 자리에 기둥을 하나 더 세움).
       보 · 벽 글자는 그대로 둠 — 같은 구간을 두 번 잡으면 BIM 이 «같은 자리 같은 부재» 로 빼고, 겹친 글자가 서로 다른 보를 잡는 일도 있어서 */
    const 겹표 = new Map()
    const 겹침 = (g) => {
      const 칸2 = 1000, i0 = Math.floor(g.x / 칸2), j0 = Math.floor(g.y / 칸2)
      for (let i = i0 - 1; i <= i0 + 1; i++) for (let j = j0 - 1; j <= j0 + 1; j++) for (const o of 겹표.get(i * 100003 + j) || []) {
        if (o.u === g.u && Math.hypot(o.x - g.x, o.y - g.y) <= 0.5 * Math.max(o.h, g.h) && Math.abs(o.h - g.h) <= 0.2 * Math.max(o.h, g.h)) return true
      }
      const k = i0 * 100003 + j0; const a = 겹표.get(k); if (a) a.push(g); else 겹표.set(k, [g])
      return false
    }
    for (const g of D.글자) {
      if (쓴글자.has(D.번 + ':' + g.i)) continue
      const r = 평면기호(g.s)
      if (!r) continue
      if ((r.종류 === '기둥' || r.종류 === '기초') && 겹침(g)) continue
      if (r.위아래) 위아래글.push({ D, g, 기호: r.기호 })
      if (r.길이 != null) {
        /* 「G1(400X700)」 — 글자 가운데가 아니라 «G1» 부분의 가운데를 기호 자리로 (기둥·보 찾는 거리가 어긋나지 않게) */
        const 앞폭 = 폭짐작(g.s.slice(0, r.앞), g.h), 몸폭 = 폭짐작(g.s.slice(r.앞, r.앞 + r.길이), g.h)
        const 가운데 = 앞폭 + 몸폭 / 2 - g.w / 2
        기호글자.push({ D, g: { ...g, x: g.x + 가운데 * Math.cos(g.a), y: g.y + 가운데 * Math.sin(g.a), w: 몸폭 }, r })
        continue
      }
      기호글자.push({ D, g, r })
    }
  }
  const 평면별 = new Map()     // 제목 → 기호글자들
  const 제목없음 = { g: null, f: ['2'], 없음: true, 이름: '' }
  const 제목없는도면 = new Map()  // 🧭 G332 D → 안 센 기호들
  for (const x of 기호글자) {
    let best = 제목찾기(x.D, x.g)
    /* 🧭 G299 «(ROOF, PHF 동일보)» — 앞에 적힌 평면(ROOF)에서만 셈 · 다른 평면(PHF)의 같은 글은 건너뜀(한 보를 두 번 안 셈) */
    if (x.r.동일 && best && !동일첫판(x.r.동일[0], best.이름)) continue
    if (!best) {
      if (제목들.some((t) => t.D === x.D)) continue       // 제목이 있는 도면인데 어느 평면에도 안 걸림(상세·단면 속 글자)
      /* 🧭 G241 판 이름(표제란 도면명)이 있는데 구조 평면이 아닌 판(현장 A «종 골구도 - 1» · 단면 · 상세 · 일람표)의 기호는 평면 부재가 아님
           — 예전엔 «제목 없는 평면(1층)» 으로 셈해 현장 A 골구도의 기호 726개가 1층 부재로 더해졌음 */
      if (x.D.도곽 && x.D.도곽.length) { const p = x.D.도곽번(x.g.x, x.g.y); const nm = p >= 0 ? (x.D.판제목 || [])[p] || '' : ''; if (nm && !제목층(nm)) continue }
      /* 🧭 G332 (2026-10-20) 다른 도면에 구조평면도 제목이 있으면, 제목이 하나도 없는 도면(건축 평면 · 마감 · 창호 도면)의 기호는 부재가 아님 — 알리고 뺌.
           /jeoksan/auto 예시 셋을 같이 넣으니 마감 평면의 실내재료마감표 기호(F1 바닥 · C1 천장 · W1 벽 · B1 걸레받이)가 «제목 없는 평면(1층)» 의
           기초 · 기둥 · 벽 · 보로 셈해져 콘크리트 216.25 → 226.80 ㎥ · 철근 22.040 → 22.725 ton 으로 부풀었음(건축 · 구조 도면을 한꺼번에 넣는 일이 흔함) */
      if (제목들.length) { const a = 제목없는도면.get(x.D); if (a) a.push(x.r.기호); else 제목없는도면.set(x.D, [x.r.기호]); continue }
      best = 제목없음
    }
    let a = 평면별.get(best); if (!a) { a = []; 평면별.set(best, a) }
    a.push(x)
  }
  for (const [D, 기들] of 제목없는도면) {
    const 가지 = [...new Set(기들)]
    경고.push('«' + (D.이름 || (D.번 + 1) + '번 도면') + '» 에는 구조평면도 제목이 없어 그 도면의 기호 ' + 기들.length + '개(' + 가지.slice(0, 6).join(' · ') + (가지.length > 6 ? ' …' : '') +
      ')는 부재로 세지 않았습니다 — 건축 · 마감 도면이면 그대로 두십시오. 구조 평면이면 제목(예: «2층 구조평면도»)을 확인하거나 판 목록에서 층을 고르십시오')
  }
  if (평면별.has(제목없음) && !바닥차례.length) { 바닥차례.push('1', '2') }
  for (const 글들 of 평면별.values()) for (const x of 글들) { const o = 쓰임(x.D, x.g.x, x.g.y); if (o) o.기호[x.r.종류] = (o.기호[x.r.종류] || 0) + 1 }
  /* 🧭 G245 같은 판(도곽) 안의 같은 이름 제목 둘(평면 밑 «BEAM  PLAN» + 표제란 «BEAM PLAN»)은 한 평면 — 글자를 한데 모아 한 번만 셈.
     전엔 둘로 따로 셈해, 표제란 쪽에 붙은 글자 하나가 줄 전체 보 구간을 이어 받아 같은 보를 두 번 셌음(현장 D 지중보 B2 5개 · B4 1개) */
  {
    const 대표 = new Map()
    for (const [t, 글들] of [...평면별].sort((a, b) => b[1].length - a[1].length)) {
      if (t.없음 || !(t.판 >= 0)) continue
      const k = t.D.번 + '|' + t.판 + '|' + t.이름
      const r = 대표.get(k)
      if (!r) { 대표.set(k, t); continue }
      평면별.get(r).push(...글들)
      평면별.delete(t)
    }
  }
  /* 🧭 G246 «주심도가 있으면 기둥은 주심도에서만» 은 같은 동(판 이름 꼬리 «[…]») 안에서만 — 현장 C: 쓰레기 처리장 «기둥 주심도» 때문에
       본 건물 기초 평면의 기둥 56개가 다 빠졌음 */
  const 제목동 = (t) => 동꼬리(t.g && t.g.s) || 동꼬리(t.판 >= 0 && t.D ? (t.D.판제목 || [])[t.판] : '')
  const 기둥판동 = new Set([...평면별.keys()].filter((t) => t.기둥판).map(제목동))

  /* 같은 제목의 평면이 여러 장(보 평면 · 슬래브 평면 · 개구부 평면…)이면 부재 종류마다 가장 많이 적힌 한 장만 셈 — 두 번 세지 않게 */
  const 쓸판 = new Map()     // 제목이름|종류 → 제목(판)
  for (const [t, 글들] of 평면별) {
    const 셈 = new Map()
    for (const x of 글들) 셈.set(x.r.종류, (셈.get(x.r.종류) || 0) + 1)
    for (const [종, n] of 셈) {
      const key = t.이름 + '|' + 종
      const 앞 = 쓸판.get(key)
      /* 같은 판의 같은 이름 제목은 합쳐 셈(한 평면) */
      if (앞 && 앞.t.D === t.D && 앞.t.판 >= 0 && 앞.t.판 === t.판) { 앞.n += n; continue }
      if (!앞 || n > 앞.n) 쓸판.set(key, { t, n })
    }
  }

  /* 🧭 G241 기호 없는 바닥 슬래브 글자 — 기초 평면의 «-250 / T=300»(높이 글자 바로 아래 두께 글자 · 현장 C · D 토목 FOUNDATION PLAN) */
  const 레벨값 = (s) => { const m = /^(?:EL|FL|GL)?\.?([-+±])(\d{1,2},\d{3}|\d{1,4}(?:\.\d{1,3})?)$/i.exec(붙(s).replace(/[−–]/g, '-')); if (!m) return null; let v = m[2].includes('.') ? +m[2] * 1000 : +m[2].replace(/,/g, ''); if (m[1] === '-') v = -v; return Number.isFinite(v) ? Math.round(v) : null }
  const 바닥두께글 = new Map()
  let 바닥슬수 = 0
  for (const D of 도면들) {
    for (const g of D.글자) {
      const m = /^T=(\d{2,4})(?:MM)?$/.exec(g.u)
      if (!m || +m[1] < 100 || +m[1] > 1500 || 쓴글자.has(D.번 + ':' + g.i)) continue
      const t = 제목찾기(D, g)
      if (!t || !t.f.includes('FT')) continue
      let 높 = null, bd = Infinity
      for (const o of D.글자) {
        if (o === g) continue
        const dy = o.y - g.y, dx = Math.abs(o.x - g.x)
        if (dy <= 0.3 * g.h || dy > 2.5 * Math.max(g.h, o.h) || dx > 4 * g.h) continue
        const v = 레벨값(o.s)
        if (v === null) continue
        if (dy + dx < bd) { bd = dy + dx; 높 = v }
      }
      const a2 = 바닥두께글.get(t) || []
      a2.push({ D, g, 두께: +m[1], 높이: 높 })
      바닥두께글.set(t, a2)
    }
  }

  /* 🧭 G248 (2026-10-12) 바닥 일반 단면 → 기초 평면의 바닥 슬래브 (소장님 「다 있는데, 클로드가 못 읽는 거라고」 · 「읽는 도구 먼저」)
       현장 C 토목: 기초 평면 칸 대부분은 높이 글(«±0.000» · «-250»)만 있고 두께 글(T=300)은 10칸뿐이라 바닥 슬래브를 10칸(164 ㎥)만 셈했음.
       두께는 WALL & SLAB LIST 판의 «FLOOR TYPICAL SECTION» 그림에 있음 — 세운 치수 «300» · 위아래 철근 점 두 줄 · «버림콘크리트 T=50» · «단열재 T=100».
     ■ 두께 = 그 제목 둘레(같은 판 · 제목 글 높이 50배 안)의 세운 치수 글(100~1500) 가운데, 치수 두 끝에 긴 가로 구조선이 있고(그림 치수 = 글 값 — 1:1)
       그 두 선 사이에 철근 점(작은 닫힌 원)이 4개 넘게 든 것(슬래브 단면 = 위아래 철근 줄). 그런 치수가 없으면 두께를 안 정함(짐작 안 함).
     ■ 그 그림에 «버림 … T=50» · «단열재» 글이 있으면 흙 위 슬래브 — 밑면 거푸집 없음 · 버림 두께 셈.
     ■ 쓰는 곳 = 같은 동(판 이름 꼬리 «[…]»)의 기초 평면(FT 제목) 한 장 — 두께 글(T=)이 있는 평면, 없으면 높이 글이 가장 많은 평면.
       그 평면의 높이 글(레벨) 하나하나를 씨로 둘레 보 · 벽을 찾아 칸을 만들고(T= 칸과 같은 방법), 같은 칸은 한 번만. */
  const 바닥단면 = []
  let 바닥씨칸 = 0, 바닥씨넓 = 0, 바닥채움 = 0, 바닥채움넓 = 0
  const 바닥씨단면 = new Set()
  const 바닥제목 = /^(?:(?:BASE)?(?:FLOOR|SLAB)(?:TYPICAL)?(?:SECTION|DETAIL)|TYPICAL(?:FLOOR|SLAB)(?:SECTION|DETAIL)|(?:바닥|바닥판|슬래브|슬라브)(?:일반|표준|기준)(?:단면|상세)도?)$/
  for (const D of 도면들) for (const g0 of D.글자) {
    if (!바닥제목.test(g0.u)) continue
    const 판0 = D.도곽 && D.도곽.length ? D.도곽번(g0.x, g0.y) : -1
    if (목록판(D, 판0)) continue
    const R = 50 * g0.h
    const 곁 = D.글자.filter((o) => o !== g0 && Math.abs(o.x - g0.x) <= R && Math.abs(o.y - g0.y) <= 0.8 * R && (판0 < 0 || D.도곽번(o.x, o.y) === 판0))
    const 점들 = D.닫힌.filter((c) => { const w = c.b[2] - c.b[0], h = c.b[3] - c.b[1]; return w > 0 && w <= 400 && Math.abs(w - h) <= 0.2 * Math.max(w, h) && Math.abs(c.b[0] - g0.x) <= R + 2000 && Math.abs(c.b[1] - g0.y) <= R }).map((c) => ({ x: (c.b[0] + c.b[2]) / 2, y: (c.b[1] + c.b[3]) / 2, w: c.b[2] - c.b[0] }))
    let best = null
    for (const o of 곁) {
      if (Math.abs(Math.sin(o.a)) < 0.9 || !/^\d{3,4}$/.test(o.u)) continue
      const v = +o.u
      if (v < 100 || v > 1500) continue
      const 위 = [], 아래 = []
      for (const s of D.찾기(o.x - 6 * v, o.y - v, o.x + 6 * v, o.y + v)) {
        const y = D.sy0[s]
        if (Math.abs(y - D.sy1[s]) > 0.01 * v) continue
        const xa = Math.min(D.sx0[s], D.sx1[s]), xb = Math.max(D.sx0[s], D.sx1[s])
        if (xb - xa < v) continue
        const 떨 = xa > o.x ? xa - o.x : xb < o.x ? o.x - xb : 0
        if (떨 > 5 * v) continue
        if (Math.abs(y - (o.y + v / 2)) <= 0.12 * v) 위.push({ y, xa, xb })
        if (Math.abs(y - (o.y - v / 2)) <= 0.12 * v) 아래.push({ y, xa, xb })
      }
      for (const a of 위) for (const b of 아래) {
        if (Math.abs(a.y - b.y - v) > 0.03 * v) continue
        const xa = Math.max(a.xa, b.xa), xb = Math.min(a.xb, b.xb)
        if (xb - xa < v) continue
        const 든 = 점들.filter((p) => p.w <= 0.25 * v && p.x > xa && p.x < xb && p.y > b.y && p.y < a.y)
        if (든.length >= 4 && (!best || 든.length > best.점)) best = { v, 점: 든.length, o }
      }
    }
    if (!best) continue
    const 버림글 = 곁.map((o) => /(?:버림|LEAN|LEVEL+ING)[^T]*T=(\d{2,3})/.exec(o.u)).find(Boolean)
    const 단열 = 곁.some((o) => /단열재|INSULATION/.test(o.u))
    const 높이들 = new Set(곁.map((o) => 레벨값(o.s)).filter((v) => v !== null))
    바닥단면.push({ D, 판: 판0, 동: 동꼬리(판0 >= 0 ? (D.판제목 || [])[판0] : ''), 두께: best.v, 버림: 버림글 ? +버림글[1] : 0, 흙: !!(버림글 || 단열), 높이들, 글: g0.s, i: best.o.i })
    근거.push({ 번: D.번, i: best.o.i, 글: '바닥 일반 단면 두께 ' + best.v })
    { const o = 쓰임(D, g0.x, g0.y); if (o) o.바닥단면 = best.v }
  }
  /* 🧭 G248 바닥 슬래브 철근 — 단면 · 상세 판의 철근 글(«HD19@200»)의 지시선을 따라가 그 끝이 바닥 슬래브 두께 띠(위아래 구조선 사이가 두께와 같은 곳) 안
       (또는 띠 곁 0.25T)이면 그 슬래브의 철근 — 띠 가운데보다 위면 상부 · 아래면 하부. 위치마다 가장 많이 나온 글(60 % 넘게)을 씀.
       (현장 C: FLOOR TYPICAL SECTION 에는 철근 점(25 mm)만 있고 글이 없음 — 기초 단면 판들의 «HD19@200» 지시선이 슬래브 위 · 아래 철근을 가리킴.
        소장님 규칙 «글자 먼저, 글자가 없을 때만 동그라미 지름») */
  const 철근층 = (D, ly) => /철근|REBAR|BAR\b/i.test(((D.layers || [])[ly] || {}).name || '')
  const 슬래브띠 = (D, e, T) => {
    const ys = []
    for (const k of D.찾기(e.x - 5, e.y - 2 * T, e.x + 5, e.y + 2 * T)) {
      if (D.sly[k] === e.층 || 철근층(D, D.sly[k])) continue
      if (Math.abs(D.sy0[k] - D.sy1[k]) > 0.01 * T) continue
      const xa = Math.min(D.sx0[k], D.sx1[k]), xb = Math.max(D.sx0[k], D.sx1[k])
      if (e.x < xa - 1 || e.x > xb + 1 || xb - xa < T) continue
      ys.push(D.sy0[k])
    }
    ys.sort((p, q) => p - q)
    let 띠 = null
    for (let i = 0; i < ys.length; i++) for (let j = i + 1; j < ys.length; j++) {
      const lo = ys[i], hi = ys[j]
      if (Math.abs(hi - lo - T) > 0.04 * T || e.y < lo - 0.25 * T || e.y > hi + 0.25 * T) continue
      const d = Math.abs(e.y - (lo + hi) / 2)
      if (!띠 || d < 띠.d) 띠 = { lo, hi, d }
    }
    return 띠 ? { 위: e.y > (띠.lo + 띠.hi) / 2 } : null
  }
  for (const 단 of 바닥단면) {
    const 셈 = { 위: new Map(), 아래: new Map() }
    for (const D of 도면들) for (const g of D.글자) {
      if (!/^H?D\d{2}@\d{2,4}$/.test(g.u)) continue
      const p = D.도곽 && D.도곽.length ? D.도곽번(g.x, g.y) : -1
      const 판이름 = p >= 0 ? String((D.판제목 || [])[p] || '') : ''
      if (!/SECTION|DETAIL|단면|상세/i.test(판이름) || 목록판(D, p)) continue
      if (단.동 && 동꼬리(판이름) && 동꼬리(판이름) !== 단.동) continue
      const e = 지시선끝(D, g)
      if (!e) continue
      const 띠 = 슬래브띠(D, e, 단.두께)
      if (!띠) continue
      const m = 띠.위 ? 셈.위 : 셈.아래
      m.set(g.u, (m.get(g.u) || 0) + 1)
      { const o = 쓰임(D, g.x, g.y); if (o) o.바닥철근 = (o.바닥철근 || 0) + 1 }
    }
    const 고름 = (m) => { const a = [...m].sort((p, q) => q[1] - p[1]); const n = a.reduce((t, x) => t + x[1], 0); return a.length && a[0][1] >= 0.6 * n ? { 값: a[0][0], n: a[0][1], 모두: n } : null }
    단.철근 = { 위: 고름(셈.위), 아래: 고름(셈.아래), 셈: { 위: Object.fromEntries(셈.위), 아래: Object.fromEntries(셈.아래) } }
  }
  /* 🧭 G248 슬래브 두께 글이 없는 기초 상세 칸(높이 글만) — 바닥 일반 단면 두께 T 로 높이 쌍(S · S−T)을 찾아 기초 두께 = 기초 바닥 ~ 슬래브 바닥(평균).
       단면이 하나뿐이거나 두께가 모두 같을 때만 */
  const 기초다시 = []
  {
    const Ts = [...new Set(바닥단면.map((x) => x.두께))]
    if (Ts.length === 1) {
      const T = Ts[0]
      const 고치기 = (r) => {
        if (!r || !Array.isArray(r._레값)) return
        const vs = r._레값, 밑 = vs[0]
        const 바닥들 = vs.filter((b2) => b2 - 밑 >= 200 && vs.includes(b2 + T))
        if (!바닥들.length) return
        const t = Math.round(바닥들.reduce((a2, b2) => a2 + (b2 - 밑), 0) / 바닥들.length)
        if (String(t) !== r.두께) { 기초다시.push(r.기호 + ' ' + r.두께 + '→' + t); r.두께 = String(t); r._윗면 = String(밑 + t) }
        r._레값 = null
      }
      for (const d of 정의) if (d.종류 === '기초') 고치기(d.r)
      for (const r of 전역.기초.values()) 고치기(r)
    }
  }
  /** 그 평면(제목 t)에 쓸 바닥 일반 단면 — 같은 파일 · 같은 동(또는 동 없음) 먼저, 두께가 갈리면 null */
  const 단면고르기 = (t, 동) => {
    for (const 같은파일 of [true, false]) {
      const 들 = 바닥단면.filter((s) => (같은파일 ? s.D === t.D : true) && (!s.동 || !동 || s.동 === 동))
      if (!들.length) continue
      return new Set(들.map((s) => s.두께)).size === 1 ? 들[0] : null
    }
    return null
  }
  const 바닥씨 = new Map()           // 제목 t → [{D, g, 두께, 높이, 단면}]
  if (바닥단면.length) {
    const 후보 = new Map()
    for (const D of 도면들) for (const g of D.글자) {
      if (쓴글자.has(D.번 + ':' + g.i)) continue
      const v = 레벨값(g.s)
      if (v === null) continue
      const t = 제목찾기(D, g)
      if (!t || t.없음 || !t.f.includes('FT')) continue
      const a = 후보.get(t) || []
      a.push({ D, g, 높이: v })
      후보.set(t, a)
    }
    /* 동마다 한 평면 — 두께 글(T=)이 있는 평면, 없으면 높이 글이 가장 많은 평면(보 평면 · 기초 평면에 같은 높이 글이 또 있어도 두 번 안 셈) */
    const 동평면 = new Map()
    for (const [t, a] of 후보) {
      const 동 = 동꼬리(t.g && t.g.s) || 동꼬리(t.판 >= 0 && t.D ? (t.D.판제목 || [])[t.판] : '')
      const 점 = (바닥두께글.has(t) ? 1e6 : 0) + a.length
      const 앞 = 동평면.get(동)
      if (!앞 || 점 > 앞.점) 동평면.set(동, { t, 점, 동 })
    }
    for (const { t, 동 } of 동평면.values()) {
      const s = 단면고르기(t, 동)
      if (!s) continue
      const a = 후보.get(t).slice().sort((p, q) => (s.높이들.has(q.높이) || q.높이 === 0 ? 1 : 0) - (s.높이들.has(p.높이) || p.높이 === 0 ? 1 : 0))
      바닥씨.set(t, a.map((x) => ({ ...x, 두께: s.두께, 단면: s })))
    }
  }
  if (typeof globalThis !== 'undefined' && globalThis.__바닥dbg) globalThis.__바닥dbg.push({ 단면: 바닥단면.map((s) => ({ 번: s.D.번, 동: s.동, 두께: s.두께, 버림: s.버림, 흙: s.흙, 높이들: [...s.높이들], 철근: s.철근 })), 씨: [...바닥씨].map(([t, a]) => ({ 제목: t.g && t.g.s, 판: t.판, n: a.length })) })
  /** 슬래브 배근행 한 줄(기호 없는 바닥 슬래브 — «T300(±0)») · 흙 위면 버림 · 밑면 거푸집 없음 */
  const 바닥줄 = (두께, 높이, 단면) => {
    const 기 = 'T' + 두께 + (높이 !== null ? '(' + (높이 > 0 ? '+' : 높이 === 0 ? '±' : '') + 높이 + ')' : '')
    const 철 = 단면 && 단면.두께 === 두께 && 단면.철근 ? 단면.철근 : {}
    const 하 = 철.아래 ? 철.아래.값 : '', 상 = 철.위 ? 철.위.값 : ''
    if (!배근행.슬라브.has(기)) 배근행.슬라브.set(기, { 기호: 기, 두께: String(두께), 단변하부: 하, 단변상부: 상, 장변하부: 하, 장변상부: 상, 상부꼴: '전장', 종류: '양방향', 지지근: '', 단위철근: '', 데크: '', 버림: 단면 && 단면.버림 ? String(단면.버림) : '', 동: '', ...(높이 !== null ? { _윗면: String(높이) } : {}), ...(단면 && 단면.흙 ? { _흙: '1' } : {}) })
    return 기
  }

  /* 부재 모으기 */
  const 층들 = new Map()
  const 층칸 = (f) => { let v = 층들.get(f); if (!v) { v = { 보: [], 기둥: new Map(), 슬라브: [], 벽: [], 기초: new Map(), 두께: [], 기둥자리: new Map(), 기초자리: new Map(), 계단: [] }; 층들.set(f, v) } return v }
  const 없는기호 = new Map()
  const 한선보 = new Map()          // 🧭 G406 한 선(슬래브 끝 선)으로만 그린 보 — 기호 → 곳(겹쳐 쓴 같은 글자는 한 곳)
  const 미표기벽 = []           // 🧭 G249 «평면 제목 n» — 미표기 벽체로 읽은 두 선 짝 수
  const 기둥표 = []             // 🧭 G251 평면(판)마다 기둥 기호 자리 — 벽 이름 잇기의 판 맞춤
  const 평면목록 = []
  const 보층 = new Set(), 벽층 = new Set(), 기둥층 = new Set()
  const RC정의파일 = new Map()        // 기호 → 철근콘크리트 일람표 정의가 있는 파일 번호들
  for (const d of 정의) { if (!d.목록판) continue; let a = RC정의파일.get(d.기호); if (!a) { a = new Set(); RC정의파일.set(d.기호, a) } a.add(d.번) }   /* 일람표(LIST · 일람) 판의 정의만 — 평면 판 크기 글 곁 기호는 아님(현장 B S-201 «SC1 625×3425») */
  for (const t of [...바닥씨.keys(), ...바닥두께글.keys()]) if (!평면별.has(t)) 평면별.set(t, [])
  /* 🧭 G249 주심도(기둥 평면)가 있는 층 — 미표기 벽체를 주심도에서 읽는 층 */
  const 주심층 = new Set()
  for (const t of 평면별.keys()) if (t.기둥판 && !t.없음) for (const f of t.f || []) 주심층.add(f)
  /* 🧭 G259 «N층 구조평면도» 의 벽 · 기둥이 N층 것(위로 올라가는 것)인 도면 — 골조입면 · 단면의 층 띠 안 벽 · 기둥 이름(한 층에만 나오는 것)으로 투표.
       예전 읽기는 «그 아래층 것»(평면이 받치는 벽 · 기둥)만 — 현장 B: 지하1층 평면 RW1 · RW2 · DW1 = 입면 지하층 · 1층 평면 바깥 W2 = 입면 1층 →
       층 높이가 한 층씩 밀렸고 지하1층 평면 벽은 기초 평면 벽(받침 높이)으로 갔음. 표(입면 이름)가 없거나 아래층 쪽이 많으면 예전 그대로 */
  let 위규칙 = false
  {
    const 입면 = 입면층기호(도면들)
    let 같 = 0, 아 = 0
    for (const [t, 글들0] of 평면별) {
      if (t.기둥판 || t.없음 || !t.f) continue
      const 몸들 = new Set(글들0.filter((x) => x.r.종류 === '벽' || x.r.종류 === '기둥').map((x) => x.r.기호))
      for (const F of t.f) {
        const a = 아래층(F)
        for (const m of 몸들) { const E = 입면.get(m); if (!E || E.size !== 1) continue; if (E.has(F)) 같++; else if (a !== 'FT' && E.has(a)) 아++ }
      }
    }
    위규칙 = (같 >= 2 && 아 === 0) || (같 >= 3 && 같 >= 2 * 아)
    if (위규칙) 경고.push(`평면의 벽 · 기둥을 «그 층 것(위로 올라가는 것)» 으로 읽었습니다 — 골조입면도 층 띠의 이름과 맞음 ${같}곳 · 아래층과 맞음 ${아}곳`)
  }
  for (const [t, 글들0] of 평면별) {
    /* 🧭 G242 같은 판(도곽) 안의 같은 이름 제목 둘(평면 밑 제목 + 표제란 도면명)은 한 평면 — 둘로 갈려 적은 쪽 기호가 빠졌음(현장 C · D FOOTING PLAN 오른쪽 줄 기초 F14 · F22 · F23 · F36 · F44) */
    const 같은판 = (a, b) => a === b || (a.D === b.D && a.판 >= 0 && a.판 === b.판)
    const 글들 = 글들0.filter((x) => { const u = 쓸판.get(t.이름 + '|' + x.r.종류); return !u || 같은판(u.t, t) })
    /* 🧭 G248 부재 기호가 하나도 없는 기초 평면이라도 바닥 슬래브 글(T= · 높이 글 씨)이 있으면 그 평면을 읽음 */
    if (!글들.length && !바닥씨.has(t) && !바닥두께글.has(t)) continue
    // 기둥: 주심도(기둥 배치)가 있으면 기둥은 그 평면에서만
    const 층목0 = t.없음 ? ['1'] : t.f
    const 층목보 = t.없음 ? ['1'] : t.f.map(아래층)
    const 번0 = 글들.length ? 글들[0].D.번 : t.D.번
    const 같은목 = 평면목록.find((p2) => p2.제목 === (t.g ? t.g.s : '(제목 없는 평면)') && p2.도면 === 번0)
    if (같은목) 같은목.기호수 += 글들.length
    else 평면목록.push({ 제목: t.g ? t.g.s : '(제목 없는 평면)', 도면: 번0, 층: [...new Set(t.기둥판 ? 층목0 : 층목보)], 기호수: 글들.length, 기둥판: !!t.기둥판 })
    const 높이들 = 글들.map((x) => x.g.h).sort((a, b) => a - b)
    const 보통 = 높이들[높이들.length >> 1] || 1
    /* 🧭 G275 기초 기호는 기초 기호끼리의 보통 높이로 — 현장 B S-101 «1층기초구조평면도»: 기둥 블록 속 작은 이름표(50) 16개 때문에 보통 = 50 이라 MF1(300) 셋이 «큰 글자» 로 빠졌음 */
    const 기초높이 = 글들.filter((x) => x.r.종류 === '기초').map((x) => x.g.h).sort((a, b) => a - b)
    const 기초보통 = Math.max(보통, 기초높이[기초높이.length >> 1] || 0)
    const 쓸 = 글들.filter((x) => x.g.h <= (x.r.종류 === '기초' ? 기초보통 : 보통) * 2)
    const 동t = 제목동(t)
    // 층마다 (범위 제목 «3~5층» 이면 층마다 같은 것)
    const 층목 = t.기둥판 ? 층목0 : 층목보
    const 위로 = new Map(층목보.map((f2, i) => [f2, 층목0[i]]))
    for (const f of [...new Set(층목)]) {
      /* 🧭 G259 벽 · 기둥의 층 — 위규칙이면 평면 제목 층(위로 올라가는 것). 그 위에 바닥이 없는 맨 위 층(현장 B PHF-1 · PHF-2 · 지붕 = R — 층고 없음)은 예전대로 아래층 */
      const 위F = 위규칙 && !t.기둥판 ? 위로.get(f) : null
      const fw = 위F && 바닥차례.indexOf(위F) >= 0 && 바닥차례.indexOf(위F) < 바닥차례.length - 1 ? 위F : f
      const 기둥수 = new Map(), 기초수 = new Map(), 기둥자리 = new Map(), 기초자리 = new Map()
      const 더하기 = (m, k2, v) => { const a = m.get(k2); if (a) a.push(v); else m.set(k2, [v]) }
      const 보띠 = [], 벽띠 = [], 슬들 = [], 계단들 = [], 보띠하 = []      // 🧭 G405 보띠하 = «(하부)» 보 — 한 층 아래 바닥 것
      for (const x of 쓸) {
        const { D, g } = x
        const r = x.r
        /* 🧭 G251 기둥 기호 자리는 셈에 안 쓰는 평면(주심도가 따로 있는 구조평면도)것도 — 벽 이름 잇기의 판 맞춤 */
        if (r.종류 === '기둥') 기둥표.push({ 판: D.번 + '|' + (D.도곽 && D.도곽.length ? D.도곽번(g.x, g.y) : -1), 몸: r.몸, x: g.x, y: g.y })
        if (r.종류 === '기둥' && 기둥판동.has(동t) && !t.기둥판) continue
        if (t.기둥판 && r.종류 !== '기둥' && r.종류 !== '벽') continue
        /* 🧭 G246 철골 정의는 같은 동(판 이름 꼬리 «[…]») 평면에만 · 동 없는 정의는 모든 평면에.
             평면과 같은 파일에 그 기호의 철근콘크리트 정의(일람표)가 있고 철골 정의는 딴 파일이면 철근콘크리트 — 가까운 정의 먼저
             (현장 C: 건축 통합본 냉동실 상세의 «C1 ㅁ-100x100» 이 토목 통합본 본 건물 기둥 C1 · C2 를 철골로 만들었음) */
        let 철 = 철골.get(r.기호 + '|' + 동t) || 철골.get(r.몸 + '|' + 동t) || (동t ? 철골.get(r.기호 + '|') || 철골.get(r.몸 + '|') : null)
        if (철 && 철.번 !== D.번 && (RC정의파일.get(r.기호) || RC정의파일.get(r.몸) || new Set()).has(D.번)) 철 = null
        if (철) { const k2 = 철.기호; 철골수.set(k2, (철골수.get(k2) || 0) + 1); continue }
        /* 🧭 G274 계단 기호(계단 일람에 있거나 SS · ST 꼴 — «SS1» · «1SS1») 곁에 평면 계단판(네모 + 대각선 하나)이 있으면 계단 줄로(평 슬래브 아님) */
        if (r.종류 === '슬라브' && f !== 'FT' && (계단일람.has(r.기호) || 계단일람.has(r.몸) || 계단기호인가(r.몸 || r.기호))) {
          const st = 계단판찾기(D, g)
          if (st) { 계단들.push({ D, g, 기: 계단일람.has(r.기호) ? r.기호 : 계단일람.has(r.몸) ? r.몸 : (r.몸 || r.기호), st }); continue }
        }
        const 층f = r.종류 === '기초' ? 'FT' : r.종류 === '기둥' || r.종류 === '벽' ? fw : r.종류 === '보' && r.자리 === '하부' ? 아래층(f) : f
        let 기 = 기호정하기(r, 층f)
        /* 🧭 G290 SRC 짝 — 평면 «C1» 자리에, 같은 번호 SRC 정의(SRC 기둥 일람표 «SRC1 · 4F»)가 그 층으로 적혀 있고 이 평면에 «SRC1» 글자가 따로 없으면 그 SRC 기둥
             (실제 구조도면 점검: 4층 주심도는 C1 · C2 · C3 · C9 그대로, 기둥 일람표엔 4F 가 빠지고 SRC 일람표에만 4F — 3층 것 · 평면 범례 것으로 셈했었음) */
        if (r.종류 === '기둥') {
          const n = /^C(\d+[A-Z]?)$/.exec(r.몸 || r.기호 || '')
          if (n && (층정의.기둥.get('SRC' + n[1]) || []).some((d) => d.층들.has(층f)) && !쓸.some((y) => y.r.종류 === '기둥' && (y.r.몸 === 'SRC' + n[1] || y.r.기호 === 'SRC' + n[1]))) {
            const k2 = 기호정하기({ ...r, 기호: 'SRC' + n[1], 몸: 'SRC' + n[1] }, 층f)
            if (k2) { 기 = k2; SRC짝.set(r.몸 + ' → ' + k2, (SRC짝.get(r.몸 + ' → ' + k2) || 0) + 1); const 행 = 배근행.기둥.get(k2); if (행 && !행._짝몸) 행._짝몸 = r.몸 }
          }
        }
        if (!기) 기 = 일람만들기(r, D, g)
        if (!기) { 없는기호.set(r.기호, (없는기호.get(r.기호) || 0) + 1); continue }
        let b = 배근행[r.종류].get(기)
        const 글상자 = () => 자리만들기(D.이름, [(g.x - g.w / 2 - g.h) / D.k, (g.y - g.h) / D.k, (g.x + g.w / 2 + g.h) / D.k, (g.y + g.h) / D.k])
        if (r.종류 === '기둥') { 기둥수.set(기, (기둥수.get(기) || 0) + 1); 근거.push({ 번: D.번, i: g.i, 글: r.기호 }); 더하기(기둥자리, 기, 글상자()) }
        else if (r.종류 === '기초') { 기초수.set(기, (기초수.get(기) || 0) + 1); 근거.push({ 번: D.번, i: g.i, 글: r.기호 }); 더하기(기초자리, 기, 글상자()) }
        else if (r.종류 === '보' || r.종류 === '벽') {
          let 폭 = +(r.종류 === '보' ? b.폭 : b.두께) || 0
          let 띠 = 띠찾기(D, g, 폭)
          /* 🧭 G255 고른 정의(층 붙은 2B0 400 × 700 — 평면 범례)의 폭으로 두 선이 없으면, 같은 몸의 다른 정의(일람표 B0 200 × 600) 폭으로 — 그 폭 두 선이 곁에 있으면 그 정의
               (현장 B 2층 평면 «B0» 12곳이 «폭 400 두 선 못 찾음» 으로 빠졌음 — 도면 두 선은 200) */
          if (!띠) {
            const 몸 = r.몸 || r.기호
            const 후보 = new Map([...(전역[r.종류] || new Map())].filter(([k2]) => !배근행[r.종류].has(k2)))
            for (const [k2, b2] of [...배근행[r.종류], ...후보]) {
              if (k2 === 기 || !b2) continue
              const 몸2 = (기호풀이(k2) || {}).몸 || k2
              if (몸2 !== 몸) continue
              const 폭2 = +(r.종류 === '보' ? b2.폭 : b2.두께) || 0
              if (!(폭2 > 0) || Math.abs(폭2 - 폭) < 10) continue
              const 띠2 = 띠찾기(D, g, 폭2)
              if (띠2 && !띠2.다른폭) {
                if (!배근행[r.종류].has(k2)) 배근행[r.종류].set(k2, { ...b2, 기호: k2 })
                기 = k2; b = 배근행[r.종류].get(k2); 폭 = 폭2; 띠 = 띠2; break
              }
            }
          }
          /* 🧭 G411 남의 띠(보만) — 고른 띠에 다른 이름(몸)의 보 · 벽 이름표가 이 이름표보다 더 가까이 붙어 있으면(그 띠의 임자) 그 띠를 빼고 다시 찾음 —
               더 가까운 다른 띠(폭이 일람과 달라도)가 있으면 그것. 현장 Y 1층 바닥 G13(일람 500 · 도면 400 두 선)이 1.2 m 밖 WG1 띠(500)를 잡아
               G13 24 m 가 빠졌음 · LB2 아래 줄(도면 200)이 B10 띠(300)를 잡아 빠졌음 */
          if (띠 && r.종류 === '보') {
            const 몸 = r.몸 || r.기호
            /* 임자 = 그 띠 폭이 제 일람 폭(±15 %)과 맞는 다른 이름표(보 · 벽)가 띠 곁(폭/2 + 글자 3 개)에 · 이 이름표 앞뒤 10 m 안에 있음(한 줄 전체에 이름표 하나 — 현장 Y 1층 바닥 WG1)(가까움필요 = 이 이름표보다 띠에 더 가까움) */
            const 폭들 = (y) => {
              const 종 = y.r.종류, 몸y = y.r.몸 || y.r.기호, ws = []
              for (const d of 층정의[종].get(몸y) || []) { const v = +(종 === '보' ? d.r.폭 : d.r.두께); if (v > 0) ws.push(v) }
              for (const k of [y.r.기호, 몸y]) { const e = 전역[종].get(k); const v = e ? +(종 === '보' ? e.폭 : e.두께) : 0; if (v > 0) ws.push(v) }
              return ws
            }
            const 임자찾기 = (B, 가까움필요) => {
              const 수직 = (px, py) => (px - B.px) * B.nx + (py - B.py) * B.ny
              const 나0 = Math.abs(수직(g.x, g.y))
              return 쓸.find((y) => y !== x && y.D === D && (y.r.종류 === '보' || y.r.종류 === '벽') && (y.r.몸 || y.r.기호) !== 몸 &&
                (!가까움필요 || Math.abs(수직(y.g.x, y.g.y)) + 50 < 나0) && Math.abs(수직(y.g.x, y.g.y)) <= B.g / 2 + 3 * y.g.h &&
                Math.abs((y.g.x - g.x) * B.ux + (y.g.y - g.y) * B.uy) <= 10000 &&
                폭들(y).some((w) => Math.abs(w - B.g) <= Math.max(30, 0.15 * w)))
            }
            const 나 = Math.abs((g.x - 띠.px) * 띠.nx + (g.y - 띠.py) * 띠.ny)
            const 임자 = 임자찾기(띠, true)
            if (임자) {
              const 띠2 = 띠찾기(D, g, 폭, 1500, [띠])
              if (띠2) {
                const 나2 = Math.abs((g.x - 띠2.px) * 띠2.nx + (g.y - 띠2.py) * 띠2.ny)
                /* 새 띠가 확실히 더 가깝고(0.7 배 안) · 일람 폭보다 넓지 않고(도면은 일람보다 좁게 그린 것만 — 두 부재 사이 틈을 띠로 보지 않게) · 새 띠에도 임자가 없을 때만 */
                /* 새 띠 두 면 사이(속)에 나란한 선이 지나면 두 부재를 하나로 본 것 — 안 씀 */
                const 속선 = (() => {
                  const L = 3000
                  for (const s2 of D.찾기(띠2.px - L, 띠2.py - L, 띠2.px + L, 띠2.py + L)) {
                    const x0 = D.sx0[s2], y0 = D.sy0[s2], x1 = D.sx1[s2], y1 = D.sy1[s2], Ls = Math.hypot(x1 - x0, y1 - y0)
                    if (Ls < 300 || Math.abs(((x1 - x0) * 띠2.uy - (y1 - y0) * 띠2.ux) / Ls) > 0.01) continue
                    const o = ((x0 + x1) / 2 - 띠2.px) * 띠2.nx + ((y0 + y1) / 2 - 띠2.py) * 띠2.ny
                    if (Math.abs(o) >= 띠2.g / 2 - 20) continue
                    const ta = (x0 - g.x) * 띠2.ux + (y0 - g.y) * 띠2.uy, tb = (x1 - g.x) * 띠2.ux + (y1 - g.y) * 띠2.uy
                    if (Math.min(ta, tb) < 1500 && Math.max(ta, tb) > -1500) return true
                  }
                  return false
                })()
                if (나2 <= 0.7 * 나 && 띠2.g <= 1.05 * (폭 || 띠2.g) && !속선 && !임자찾기(띠2, false)) { 띠 = 띠2 }
              }
            }
          }
          if (!띠 && r.종류 === '보') { 띠 = 한선띠찾기(D, g, 폭); if (띠) { const 곳 = 한선보.get(r.기호) || new Set(); 곳.add(D.번 + ':' + Math.round(g.x / 100) + ':' + Math.round(g.y / 100)); 한선보.set(r.기호, 곳) } }
          if (!띠 && globalThis.__못찾음) globalThis.__못찾음.push({ 종: r.종류, 기호: r.기호, 기, 폭, x: g.x, y: g.y, h: g.h, 번: D.번, 제목: t.g ? t.g.s : '', f })
          if (!띠) { 경고.push((r.종류 === '보' ? '보' : '벽') + ' «' + r.기호 + '» 곁에서 폭 ' + (폭 || '?') + 'mm 의 나란한 두 선을 못 찾았습니다 (' + D.번 + '번 도면)'); continue }
          if (띠.다른폭) 경고.push((r.종류 === '보' ? '보' : '벽') + ' «' + r.기호 + '» — 도면의 폭 ' + Math.round(띠.g) + 'mm 가 일람표(' + 폭 + 'mm)와 달라 도면 선으로 길이만 쟀습니다(물량은 일람표 크기)')
          ;(r.종류 === '보' ? (r.자리 === '하부' && 층f !== f ? 보띠하 : 보띠) : 벽띠).push({ D, g, r: { ...r, 기호: 기 }, 띠 })
          for (const l of 띠.층들) (r.종류 === '보' ? 보층 : 벽층).add(D.번 + ':' + l)
        } else if (r.종류 === '슬라브') 슬들.push({ D, g, r: { ...r, 기호: 기 }, b })
      }
      // 기둥 층(닫힌 도형 레이어) — 기둥 기호 곁의 닫힌 도형
      for (const x of 쓸) {
        if (x.r.종류 !== '기둥') continue
        for (const c of x.D.닫힌) {
          if (c.글틀) continue
          const w = c.b[2] - c.b[0], h = c.b[3] - c.b[1]
          if (w < 150 || h < 150 || w > 3000 || h > 3000) continue
          const cx = (c.b[0] + c.b[2]) / 2, cy = (c.b[1] + c.b[3]) / 2
          if (Math.hypot(cx - x.g.x, cy - x.g.y) < Math.max(w, h) + 10 * x.g.h) 기둥층.add(x.D.번 + ':' + c.ly)
        }
      }
      /* 🧭 G249 미표기 벽체 — 주심도(기둥 평면)에 이름 없이 두 줄로만 그린 벽. 판의 주기 «미표기 벽체 * W200 : THK=200mm · * W300 : THK=300mm» 의
           두께로 그린 기둥 층의 나란한 두 선을 그 기호(W200 · W300) 벽으로 — 현장 A 1 ~ 6층 바깥벽 · 코어벽(이름표는 지하 평면에만 몇 개) */
      /* 주심도가 없는 층(현장 A 옥탑 = 옥상지붕 구조평면도 아래)은 바로 위 구조평면도의 기둥 층(아래 부재 «@DOWN») 두 줄 — 도면 묶음에 주심도가 있을 때만(아래 부재를 기둥 층에 그리는 버릇) · 보 층은 뺌(보 폭 300 을 벽으로 안 봄) */
      /* 🧭 G261 주심도가 없는 도면 묶음(현장 B)의 구조평면도도 — 그 판에 미표기 벽 범례가 있고 평면 벽 = 그 층 것(위규칙)이거나 주심도가 아예 없을 때. 벽 층(이름 붙은 벽 띠 층)도 찾음 */
      /* 🧭 G271 옥상(R) · 옥탑(PH) · 옥탑 위 지붕(PR) 평면도 안 함 — 지붕 틀 평면의 이름 없는 두 선은 대개 보 · 난간(현장 B PHF-1 · PHF-2: 큰 홀 위 지붕보 선을
           W3 로 읽어 옥상 위 벽이 221 m 생겼음 — 예전엔 이 평면들이 맨 위(R)로 풀려 저절로 빠져 있었음) */
      const 지붕틀 = fw === 'R' || fw === 'PR' || /^PH/.test(fw)
      const 일반미표기 = !t.기둥판 && !주심층.size && fw !== 'FT' && !지붕틀 && (!위규칙 || fw === 위F) && t.D && t.g    // 맨 위(층고 없음 · 아래층으로 돌린) 평면은 안 함
      if ((t.기둥판 || (주심층.size && fw !== 'FT' && !주심층.has(fw)) || 일반미표기) && t.D && t.g) {
        const D = t.D
        const 판i = D.도곽 && D.도곽.length ? D.도곽번(t.g.x, t.g.y) : -1
        let 표 = 판i >= 0 ? 미표기표(D, 판i) : new Map()
        let 틀 = 판i >= 0 ? D.도곽[판i] : null
        /* 🧭 G292 ⑦ 판(도곽)을 못 찾은 도면(표제란 틀이 외부참조 XREF_DAN-FORM 으로 빠짐) — 이 평면 기호 글자들의 테두리(3 m 더)를 판으로 · 미표기 범례는 도면 전체에서.
             현장 B 를 구조도면 폴더만 넣으니 1층 바깥 · 칸막이 철근콘크리트 벽(이름 없이 두 줄 · 범례 «W3(미표기벽체) 200»)이 다 빠져 콘크리트 −13 % · 거푸집 −27 % */
        if (판i < 0) {
          const 점 = 쓸.filter((x) => x.D === D).map((x) => [x.g.x, x.g.y])
          if (점.length >= 4) {
            const xs = 점.map((p2) => p2[0]), ys = 점.map((p2) => p2[1])
            틀 = [Math.min(...xs) - 3000, Math.min(...ys) - 3000, Math.max(...xs) + 3000, Math.max(...ys) + 3000]
            표 = 미표기표(D, -1)
          }
        }
        const 층s = new Set([...기둥층, ...(일반미표기 ? [...벽층].filter((k2) => !보층.has(k2)) : [])].filter((k2) => k2.startsWith(D.번 + ':')).map((k2) => +k2.split(':')[1]))      // 🧭 G261 보 층(이름 붙은 보 띠 층)은 뺌
        /* 이 평면에서 이름으로 잡은 보 띠와 같은 두 선은 보(벽으로 또 안 셈) */
        const 보와같음 = (b) => 보띠.some((x) => x.D === D && Math.abs(x.띠.ux * b.uy - x.띠.uy * b.ux) < 0.01 && Math.abs((b.px - x.띠.px) * x.띠.nx + (b.py - x.띠.py) * x.띠.ny) <= 20 && Math.abs(x.띠.g - b.g) <= 10)
        if (표.size && 층s.size && 틀) {
          const 상자 = D.닫힌.filter((c) => !c.글틀 && 층s.has(c.ly) && c.b[2] - c.b[0] >= 150 && c.b[3] - c.b[1] >= 150 && c.b[2] - c.b[0] <= 3000 && c.b[3] - c.b[1] <= 3000).map((c) => c.b)
          let n미 = 0
          const 지하틀 = (() => {
            if (!일반미표기 || !/^B\d/.test(fw)) return null
            const 점 = 벽띠.filter((x) => x.D === D && !x.r._미표기 && !x.r._모서리).map((x) => [x.띠.px, x.띠.py])
            if (점.length < 3) return null
            const xs = 점.map((p2) => p2[0]), ys = 점.map((p2) => p2[1])
            return [Math.min(...xs) - 1000, Math.min(...ys) - 1000, Math.max(...xs) + 1000, Math.max(...ys) + 1000]
          })()
          for (const b of 미표기띠(D, 틀, 층s, [...표.keys()], 상자)) {
            if (!t.기둥판 && 보와같음(b)) continue
            /* 🧭 G261 지하층 평면은 이름 붙은 지하 벽(RW1 …)이 둘러싼 곳 안만(1 m 더) — 현장 B 지하1층 평면 왼쪽(지하 없는 쪽)의 벽 그림은 지하 벽 아님 */
            if (일반미표기 && /^B\d/.test(fw) && 지하틀 && !(b.px >= 지하틀[0] && b.px <= 지하틀[2] && b.py >= 지하틀[1] && b.py <= 지하틀[3])) continue
            /* 🧭 G261 이름 붙은 보 띠 안(보 두 면 사이)에 든 두 선은 벽 아님 — 현장 B 2층 큰보 G1(400) 가운데 CON 선 + 보 면 선이 200 짝을 만들었음 */
            if (일반미표기 && 보띠.some((x) => x.D === D && Math.abs(x.띠.ux * b.uy - x.띠.uy * b.ux) < 0.01 && Math.abs((b.px - x.띠.px) * x.띠.nx + (b.py - x.띠.py) * x.띠.ny) <= x.띠.g / 2 + 5)) continue
            const 기0 = 표.get(b.g)
            const r = { 기호: 기0, 몸: 기0, 층표: '', 종류: '벽' }
            let 기 = 기호정하기(r, fw)
            if (!기) { 배근행.벽.set(기0, { 기호: 기0, 두께: String(b.g), 수직: '', 수평: '', 배근: '복배근', 구분: '구조벽', 단부보강: '', 상부보강: '', 단부전단: '', 단위철근: '', 동: '' }); 기 = 기0 }
            벽띠.push({ D, g: { x: b.px, y: b.py, h: 0, w: 0, a: Math.atan2(b.uy, b.ux), i: -1, s: 기0 }, r: { ...r, 기호: 기, _미표기: true }, 띠: b })
            for (const l of b.층들) 벽층.add(D.번 + ':' + l)
            n미++
          }
          if (n미) 미표기벽.push((t.g ? t.g.s : '') + ' ' + n미)
          /* 🧭 G409 건축 바탕(외부참조로 끼운 건축 평면 «…$0$WALL…» 층)의 두 선 벽 — 주심도에 구조 선 없이 건축 바탕으로만 그린 벽(현장 A 1층 복도 · 화장실 벽 ·
               5층 화장실 벽: 위아래 층 주심도에는 같은 자리 구조 벽 · 골구도 1층 띠 «W200»). 여기서는 후보(_바탕)로만 넣고, 다 읽은 뒤
               바로 위 · 아래층에 같은 자리 · 같은 두께 구조 벽이 있을 때만 셈(없으면 ❓ 알림 — 잰 길이) */
          if (t.기둥판) {
            const 바탕층s = new Set((D.layers || []).map((L, i) => [String((L || {}).name || ''), i]).filter(([n, i]) => /\$0\$.*(WALL|벽)/i.test(n) && !/HATCH|해치|FIN|마감|단열|INSUL/i.test(n) && !층s.has(i)).map(([, i]) => i))
            const 두께들 = new Set([...표.keys()])
            /* 벽 일람표의 «W200 · W300 · W400 …»(이름 = 두께) 줄도 — 평면 미표기 범례에 없는 두께(현장 A W400 · 골구도 6층 띠) */
            for (const [k2, row] of 전역.벽) { const m = /^W(\d{3})$/.exec(String(k2)); if (m && row && +row.두께 === +m[1]) 두께들.add(+m[1]) }
            if (바탕층s.size) for (const b of 미표기띠(D, 틀, 바탕층s, [...두께들], 상자)) {
              /* 구조 선(바탕 아닌 층 · 실선 · 중심선 · 치수 아님 — 슬래브 끝 선도 넣음: 지하 바깥벽 · 1층 바탕 벽이 슬래브 끝 선과 겹침)이 이 띠 자리(두 면 사이 · 면)를
                   30 % 넘게 따라가면 구조 쪽이 이미 그린 것 — 바탕 띠는 안 씀(토막 임자를 바탕이 뺏지 않게) */
              {
                const oc = b.px * b.nx + b.py * b.ny, L = b.t1 - b.t0
                const 구간 = []
                for (const s2 of D.찾기(Math.min(b.px - Math.abs(b.ux) * L, b.px + Math.abs(b.ux) * L) - 500, Math.min(b.py - Math.abs(b.uy) * L, b.py + Math.abs(b.uy) * L) - 500, Math.max(b.px - Math.abs(b.ux) * L, b.px + Math.abs(b.ux) * L) + 500, Math.max(b.py - Math.abs(b.uy) * L, b.py + Math.abs(b.uy) * L) + 500)) {
                  const n = String((D.layers[D.sly[s2]] || {}).name || '')
                  if (바탕층s.has(D.sly[s2]) || /\$0\$/.test(n) || /CEN|GRID|중심|통심|AXIS|DIM|치수/i.test(n) || (D.slt && D.slt[s2])) continue
                  const x0 = D.sx0[s2], y0 = D.sy0[s2], x1 = D.sx1[s2], y1 = D.sy1[s2], Ls = Math.hypot(x1 - x0, y1 - y0)
                  if (Ls < 50 || Math.abs(((x1 - x0) * b.uy - (y1 - y0) * b.ux) / Ls) > 0.01) continue
                  const o = ((x0 + x1) / 2) * b.nx + ((y0 + y1) / 2) * b.ny
                  if (Math.abs(o - oc) > b.g / 2 + 30) continue
                  const ta = x0 * b.ux + y0 * b.uy, tb = x1 * b.ux + y1 * b.uy
                  const c0 = Math.max(b.t0, Math.min(ta, tb)), c1 = Math.min(b.t1, Math.max(ta, tb))
                  if (c1 > c0) 구간.push([c0, c1, Math.abs(o - oc) < 5 ? 2 : o < oc ? 0 : 1])
                }
                const 덮 = (쪽s) => { const 들 = 구간.filter((v) => 쪽s.includes(v[2])).sort((p2, q2) => p2[0] - q2[0]); let d = 0, e = -Infinity; for (const [c0, c1] of 들) { if (c1 <= e) continue; d += c1 - Math.max(c0, e); e = c1 } return d }
                /* 🧭 G410 지상층 · 평면 미표기 범례에 없는 두께(일람표에만 있는 «W400»)는 구조 선이 두 면을 다 따라갈 때만 뺌 — 한 면만이면 슬래브 끝 선(@SL)이 바깥벽 바깥 면과
                     겹친 것(현장 Y 6층 강당 W400 · 2 · 5층 바깥벽). 지하 주심도는 한 면만 따라가도 뺌(지하 바깥벽은 지하 구조평면도의 이름 붙은 벽 · 1층 바탕 벽과 엉킴) */
                if (표.has(b.g) && /^B\d/.test(fw) ? 덮([0, 1, 2]) > 0.3 * L : Math.min(덮([0, 2]), 덮([1, 2])) > 0.3 * L) continue
                /* 🧭 G411 한 면만 구조 선(슬래브 끝)이 반 넘게 따라가는 띠 = 건물 둘레 벽 — 골구도 그 층 띠의 같은 이름으로 확인할 수 있게 표시 */
                b._한면 = Math.max(덮([0]), 덮([1])) >= 0.5 * L
              }
              let 기0 = 표.get(b.g) || ('W' + b.g)
              const r = { 기호: 기0, 몸: 기0, 층표: '', 종류: '벽' }
              let 기 = 기호정하기(r, fw)
              if (!기) { if (!배근행.벽.has(기0)) 배근행.벽.set(기0, { 기호: 기0, 두께: String(b.g), 수직: '', 수평: '', 배근: '복배근', 구분: '구조벽', 단부보강: '', 상부보강: '', 단부전단: '', 단위철근: '', 동: '' }); 기 = 기0 }
              벽띠.push({ D, g: { x: b.px, y: b.py, h: 0, w: 0, a: Math.atan2(b.uy, b.ux), i: -1, s: 기0 }, r: { ...r, 기호: 기, _미표기: true, _바탕: true, ...(표.has(b.g) ? {} : { _범례밖: true }), ...(b._한면 ? { _한면: true } : {}) }, 띠: b })
            }
          }
        }
      }
      /* 기호 없는 바닥 슬래브(«-250 / T=300») — 그 글자가 든 칸(둘레 보 · 벽)을 그 두께로 · 철근 글자가 없으면 콘크리트 · 거푸집만 */
      if (f === 'FT') {
        const 단0 = 바닥단면.length ? 단면고르기(t, 동t) : null
        for (const s2 of 바닥두께글.get(t) || []) {
          const 기 = 바닥줄(s2.두께, s2.높이, 단0)
          슬들.push({ D: s2.D, g: s2.g, r: { 기호: 기, 종류: '슬라브', 몸: 기, 층표: '' }, b: 배근행.슬라브.get(기) })
          바닥슬수++
        }
        /* 🧭 G248 두께 글이 없는 칸 — 높이 글(레벨)을 씨로, 두께는 바닥 일반 단면 */
        for (const s2 of 바닥씨.get(t) || []) {
          const 기 = 바닥줄(s2.두께, s2.높이, s2.단면)
          슬들.push({ D: s2.D, g: s2.g, r: { 기호: 기, 종류: '슬라브', 몸: 기, 층표: '' }, b: 배근행.슬라브.get(기), 씨: s2.단면 })
        }
      }
      const { 보칸, 벽칸, 슬칸 } = 평면부재(보띠, 벽띠, 슬들, 기둥층, 보층, 벽층, 배근행, 경고, 근거)
      const 보칸하 = 보띠하.length ? 평면부재(보띠하, [], [], 기둥층, 보층, 벽층, 배근행, 경고, 근거).보칸 : []
      /* 🧭 G274 한 계단에 기호가 둘(판마다)이면 한 번만 */
      const 계단칸 = []
      for (const x of 계단들) {
        const c0 = [(x.st.상자[0] + x.st.상자[2]) / 2, (x.st.상자[1] + x.st.상자[3]) / 2]
        if (계단칸.some((y) => y.D === x.D && Math.hypot((y.st.상자[0] + y.st.상자[2]) / 2 - c0[0], (y.st.상자[1] + y.st.상자[3]) / 2 - c0[1]) < 1000)) continue
        계단칸.push(x)
      }
      const 계단줄 = 계단칸.map((x) => {
        const 상자 = x.st.상자.map((v) => v / x.D.k)
        근거.push({ 번: x.D.번, 상자, 글: '계단 ' + x.기 + ' ' + x.st.판.length + '판 ' + x.st.L + '×' + x.st.W })
        /* 🪜 G393 오르는 방향(가로 = x 로 오름) · 중간참 쪽(참끝 1 = x · y 큰 쪽) — 작업 화면(골조 모델) 3D 계단 · 셈에는 안 씀 */
        return { 기호: x.기, L: x.st.L, W: x.st.W, 판수: x.st.판.length, 하단참: x.st.하단참, 상단참: x.st.상단참, 자리: { ...자리만들기(x.D.이름, 상자), 가로: !!x.st.가로, 참끝: x.st.중끝 ? 1 : 0 } }
      })
      for (const x of 슬칸) if (x.씨) { 바닥씨칸++; 바닥씨넓 += x.단변 * x.장변 / 1e6; if (typeof x.씨 === 'object') 바닥씨단면.add(x.씨); if (x.채움) { 바닥채움++; 바닥채움넓 += x.단변 * x.장변 / 1e6 } }
      /* 🧭 G245 자리마다 «어느 평면(제목 · 판)에서 읽었나»(p) — BIM 이 같은 층 평면을 무리로 나눌 때 거리(6 m 칸) 대신 이것으로 나눔.
         글자가 제목과 다른 판(도곽)에 있으면(상세 평면 판의 글자가 옆 판 제목에 붙은 것) 다른 무리 → 맞춘 뒤 겹친 것으로 뺌 */
      if (!t.없음) {
        const D0 = t.D
        const 찍 = (z) => {
          if (!z || !z.r || z.p !== undefined) return
          const cx = ((z.r[0] + z.r[2]) / 2) * D0.k, cy = ((z.r[1] + z.r[3]) / 2) * D0.k
          const lp = D0.도곽 && D0.도곽.length ? D0.도곽번(cx, cy) : -1
          z.p = D0.번 + '|' + t.판 + '|' + t.이름 + '|' + lp
        }
        for (const 줄 of 보칸) for (const x of 줄) 찍(x.자리)
        for (const 줄 of 보칸하) for (const x of 줄) 찍(x.자리)
        for (const 줄 of 벽칸) for (const x of 줄) 찍(x.자리)
        for (const x of 슬칸) 찍(x.자리)
        for (const x of 계단줄) 찍(x.자리)
        for (const a2 of 기둥자리.values()) for (const z of a2) 찍(z)
        for (const a2 of 기초자리.values()) for (const z of a2) 찍(z)
      }
      const c = 층칸(f), cw = 층칸(fw)
      c.보.push(...보칸); cw.벽.push(...벽칸); c.슬라브.push(...슬칸); c.계단.push(...계단줄)
      if (보칸하.length) 층칸(아래층(f)).보.push(...보칸하)
      for (const [k2, n] of 기둥수) cw.기둥.set(k2, (cw.기둥.get(k2) || 0) + n)
      for (const [k2, n] of 기초수) 층칸('FT').기초.set(k2, (층칸('FT').기초.get(k2) || 0) + n)
      for (const [k2, a2] of 기둥자리) cw.기둥자리.set(k2, (cw.기둥자리.get(k2) || []).concat(a2))
      for (const [k2, a2] of 기초자리) 층칸('FT').기초자리.set(k2, (층칸('FT').기초자리.get(k2) || []).concat(a2))
      for (const s2 of 슬칸) c.두께.push(s2.두께)
    }
  }
  /* 🧭 G251 같은 자리 벽 이름 잇기 — 이름 없이 두 선으로 읽은 벽(미표기 W300 …)이 다른 평면(기초 평면 · 아래층)의 이름 붙은 벽(CW1 …)과
       같은 자리 · 같은 두께면 그 이름의 그 층 일람 줄로(코어 벽은 층마다 철근이 다름 — 현장 A CW1 1층 D19@100 · 2 ~ 6층 D13@100).
       평면끼리의 자리는 같은 몸 기둥 기호의 옮김 투표(100 mm 칸 · 셋 넘게 · 기둥의 반 넘게)로 맞춤 */
  /* 🧭 G252 꺾인 데 · 같은 줄로 이어 붙인 벽 토막은 그 층 벽을 가장 많이 그린 판(이름표 · 미표기 토막이 가장 많은 판)에서만 — 다른 판(위층 구조평면도에 그린 아래층 벽)에서
       이어 붙이면 같은 벽을 두 번 셈(현장 A 1층 구조평면도의 B1CW9 를 따라 지하 바깥벽 둘레를 또 셌음) */
  {
    const 맨아래 = 바닥차례.find((f) => f !== 'FT') || '1'
    const 무리 = new Map()                      // 셈 층(기초 평면의 벽 = 맨 아래 층) → [c …]
    for (const [f, c] of 층들) { const k = f === 'FT' ? 맨아래 : f; const a = 무리.get(k) || []; a.push(c); 무리.set(k, a) }
    for (const cs of 무리.values()) {
      const 진짜 = new Map()
      for (const c of cs) for (const 줄 of c.벽) for (const x of 줄) if (!x._모서리 && !x._같은줄) 진짜.set(x._판, (진짜.get(x._판) || 0) + 1)   // 이름표 · 미표기(주심도) 토막 수
      if (진짜.size < 2) continue
      let 주판 = null, n0 = 0
      for (const [p, k] of 진짜) if (k > n0) { n0 = k; 주판 = p }
      for (const c of cs) {
        for (const 줄 of c.벽) for (let i = 줄.length - 1; i >= 0; i--) if ((줄[i]._모서리 || 줄[i]._같은줄) && 줄[i]._판 !== 주판) 줄.splice(i, 1)
        for (let i = c.벽.length - 1; i >= 0; i--) if (!c.벽[i].length) c.벽.splice(i, 1)
      }
    }
  }
  const 이은벽 = new Map()
  const 바탕셈 = [], 바탕뺌 = []   // 🧭 G409 건축 바탕 벽 [벽, 층, 이웃층|까닭(, 골구도 곳)]
  let 단면벽 = null              // 🧭 G410 골구도 벽 이름 층(필요할 때 한 번)
  const 아래배경 = []          // 🧭 G387 [벽, 층, 아래층 벽 이름] — 위층 평면에 바탕으로 깐 아래층 벽(셈에서 뺌)
  {
    const 기둥판별 = new Map()
    for (const c of 기둥표) { const a = 기둥판별.get(c.판) || []; a.push(c); 기둥판별.set(c.판, a) }
    const 옮김표 = new Map()
    const 옮김 = (from, to) => {
      const key = from + '>' + to
      if (옮김표.has(key)) return 옮김표.get(key)
      let res = null
      if (from === to) res = [0, 0]
      else {
        const A = 기둥판별.get(from) || [], B = 기둥판별.get(to) || []
        const 표 = new Map()
        for (const a of A) for (const b of B) if (a.몸 === b.몸) { const dx = b.x - a.x, dy = b.y - a.y, k = Math.round(dx / 100) + ',' + Math.round(dy / 100); const v = 표.get(k) || { n: 0, dx: 0, dy: 0 }; v.n++; v.dx += dx; v.dy += dy; 표.set(k, v) }
        let best = null
        for (const v of 표.values()) if (!best || v.n > best.n) best = v
        if (best && best.n >= 3 && best.n >= 0.5 * Math.min(A.length, B.length)) res = [best.dx / best.n, best.dy / best.n]
      }
      옮김표.set(key, res)
      return res
    }
    const 이름벽 = [], 이름벽층 = new Map()
    const 맨아래0 = 바닥차례.find((f) => f !== 'FT') || '1'
    for (const [f0, c] of 층들) for (const 줄 of c.벽) for (const x of 줄) if (!x._미표기 && !x._모서리 && !x._같은줄 && x._축 && x._몸) { 이름벽.push(x); 이름벽층.set(x, f0 === 'FT' ? 맨아래0 : f0) }
    if (이름벽.length) for (const [f, c] of 층들) for (const 줄 of c.벽) for (const x of 줄) {
      if (!x._미표기 || !x._축) continue
      const [ax, ay, bx, by, g] = x._축
      const Lw = Math.hypot(bx - ax, by - ay)
      if (!(Lw > 0)) continue
      const ux = (bx - ax) / Lw, uy = (by - ay) / Lw
      let best = null, bo = 0
      for (const L of 이름벽) {
        const [la, lb, lc, ld, lg] = L._축
        if (Math.abs(lg - g) > 15) continue
        const T = 옮김(x._판, L._판)
        if (!T) continue
        const Ll = Math.hypot(lc - la, ld - lb)
        if (!(Ll > 0)) continue
        const vx = (lc - la) / Ll, vy = (ld - lb) / Ll
        if (Math.abs(ux * vy - uy * vx) > 0.02) continue
        const px = ax + T[0], py = ay + T[1], qx = bx + T[0], qy = by + T[1]
        if (Math.abs((px - la) * vy - (py - lb) * vx) > 80 || Math.abs((qx - la) * vy - (qy - lb) * vx) > 80) continue
        const t0 = (px - la) * vx + (py - lb) * vy, t1 = (qx - la) * vx + (qy - lb) * vy
        const 겹 = Math.min(Math.max(t0, t1), Ll) - Math.max(Math.min(t0, t1), 0)
        if (겹 < 0.5 * Math.min(Lw, Ll)) continue
        if (겹 > bo) { bo = 겹; best = L }
      }
      if (!best) continue
      /* 벽체 일람표에 그 층 줄이 따로 있는 벽(층마다 철근이 다른 코어 벽)만 — 지하 외벽 BW 를 1층 바깥벽 이름으로 잇지 않게 */
      if (!(층정의.벽.get(best._몸) || []).some((d) => d.층들 && d.층들.has(f))) continue
      const 기 = 기호정하기({ 기호: best._몸, 몸: best._몸, 층표: '', 종류: '벽' }, f)
      if (!기) continue
      const 앞 = x.기호
      x.기호 = 기
      x._미표기 = false
      이은벽.set(앞 + ' → ' + best._몸, (이은벽.get(앞 + ' → ' + best._몸) || 0) + 1)
    }
    /* 🧭 G387 위층 평면 바탕에 깐 아래층 벽 — 이름 없이 읽은 벽(미표기)이 아래층 이름 붙은 벽(이어 붙인 토막 포함)과 같은 자리 · 같은 두께이고
         그 자리의 이름 붙은 벽 어느 것도 벽 일람표에 이 층 줄이 없으면 «후보». 한 평면(판)의 이 층 벽 길이의 반 넘게가 후보면 그 평면은
         아래층 벽을 바탕으로 그린 것 → 후보만 셈에서 뺌(일람표에 이 층 줄이 있는 코어 벽 · 같은 자리 이름 이은 벽은 그대로).
         소장님 현장 A «지상1층 주심도»: 지하 외벽 BW1 · BW2 둘레 · 수조 · 램프 벽을 1층 벽(W300 · W200)으로 또 셈(약 110 m) —
         건축 1층 평면은 커튼월 · 골구도 1층 띠에 바깥벽 없음 · 1층 주심도엔 벽 이름표가 하나도 없음 */
    {
      const 차 = (k) => 바닥차례.indexOf(k === 'FT' ? 맨아래0 : k)
      const 모든 = []
      for (const [f0, c] of 층들) for (const 줄 of c.벽) for (const x of 줄) if (!x._미표기 && x._축 && x._몸) 모든.push([x, f0])
      const 위모든 = []            // 🧭 G409 모든 벽(이름 · 미표기 · 바탕)
      for (const [f0, c] of 층들) for (const 줄 of c.벽) for (const x of 줄) if (x._축) 위모든.push([x, f0])
      const 층있음 = (몸, f) => (층정의.벽.get(몸) || []).some((d) => d.층들 && d.층들.has(f))
      const 같은자리 = (x, L) => {
        const [ax, ay, bx, by, g] = x._축, [la, lb, lc, ld, lg] = L._축
        if (Math.abs(lg - g) > 15) return false
        const T = 옮김(x._판, L._판)
        if (!T) return false
        const Lw = Math.hypot(bx - ax, by - ay), Ll = Math.hypot(lc - la, ld - lb)
        if (!(Lw > 0) || !(Ll > 0)) return false
        const ux = (bx - ax) / Lw, uy = (by - ay) / Lw, vx = (lc - la) / Ll, vy = (ld - lb) / Ll
        if (Math.abs(ux * vy - uy * vx) > 0.02) return false
        const px = ax + T[0], py = ay + T[1], qx = bx + T[0], qy = by + T[1]
        if (Math.abs((px - la) * vy - (py - lb) * vx) > 80 || Math.abs((qx - la) * vy - (qy - lb) * vx) > 80) return false
        const t0 = (px - la) * vx + (py - lb) * vy, t1 = (qx - la) * vx + (qy - lb) * vy
        return Math.min(Math.max(t0, t1), Ll) - Math.max(Math.min(t0, t1), 0) >= 0.5 * Math.min(Lw, Ll)
      }
      const 판별 = new Map()           // 층|판 → { 전체(mm), 후보: [[x, 아래 이름]] }
      for (const [f, c] of 층들) {
        if (f === 'FT' || 차(f) < 0) continue
        for (const 줄 of c.벽) for (const x of 줄) {
          if (!x._축 || x._바탕) continue
          const k = f + '|' + x._판
          let v = 판별.get(k); if (!v) { v = { 전체: 0, 후보: [] }; 판별.set(k, v) }
          const [ax, ay, bx, by] = x._축
          v.전체 += Math.hypot(bx - ax, by - ay)
          if (!x._미표기) continue
          const 겹 = 모든.filter(([L, fl]) => 차(fl) >= 0 && 차(fl) < 차(f) && 같은자리(x, L))
          if (!겹.length || 겹.some(([L]) => 층있음(L._몸, f))) continue
          v.후보.push([x, 겹[0][0]._몸])
        }
      }
      for (const [k, v] of 판별) {
        const 후 = v.후보.reduce((a, [x]) => { const [ax, ay, bx, by] = x._축; return a + Math.hypot(bx - ax, by - ay) }, 0)
        if (!(후 > 0.5 * v.전체)) continue
        for (const [x, m] of v.후보) 아래배경.push([x, k.split('|')[0], m])
      }
      /* 🧭 G409 건축 바탕 벽 — 같은 층에 이미 센 구조 벽과 같은 자리면 뺌 · 바로 위 · 아래층에 같은 자리 · 같은 두께 구조 벽(바탕 아닌 · 아래층 바탕으로 뺀 것 아닌)이 있으면 셈 · 둘 다 아니면 ❓(뺌) */
      const 뺄0 = new Set(아래배경.map((v) => v[0]))
      const 구조벽 = 위모든.filter(([L]) => !L._바탕 && !뺄0.has(L))
      for (const [f, c] of 층들) {
        if (f === 'FT' || 차(f) < 0) continue
        for (const 줄 of c.벽) for (const x of 줄) {
          if (!x._바탕 || !x._축) continue
          if (구조벽.some(([L, fl]) => 차(fl) === 차(f) && 같은자리(x, L))) { 바탕뺌.push([x, f, '같음']); continue }
          const 이웃 = 구조벽.filter(([L, fl]) => Math.abs(차(fl) - 차(f)) === 1 && 같은자리(x, L))
          if (이웃.length) { 바탕셈.push([x, f, 이웃[0][1]]); continue }
          /* 🧭 G410 위아래층 증거가 없고 평면 미표기 범례에 없는 두께(일람표에만 있는 «W400»)면 골구도 · 단면의 그 층 띠에 같은 벽 이름이 있는지
               (W200 · W300 처럼 여러 층 · 여러 곳에 쓰는 이름은 자리를 못 맞춰 ❓ 그대로) */
          if (단면벽 === null) { try { 단면벽 = 단면벽이름(도면들) } catch (e) { 단면벽 = new Map() } }
          /* 🧭 G411 건물 둘레 벽(한 면이 슬래브 끝 선)도 — 현장 Y 6층 강당 북쪽 W300(건축 횡단면도 A-405 «콘타입 노출콘크리트» · 골구도 6층 «W300») */
          const 단면곳 = x._범례밖 || x._한면 ? 단면벽.get(f + '|' + String(x.기호).toUpperCase()) : null
          if (단면곳) { 바탕셈.push([x, f, null, 단면곳]); continue }
          바탕뺌.push([x, f, ''])
        }
      }
    }
    if (바탕뺌.length) for (const [x] of 바탕뺌) 아래배경.push([x, null, null])
    if (아래배경.length) {
      const 뺄 = new Set(아래배경.map((v) => v[0]))
      for (const [, c] of 층들) {
        for (const 줄 of c.벽) for (let i = 줄.length - 1; i >= 0; i--) if (뺄.has(줄[i])) 줄.splice(i, 1)
        for (let i = c.벽.length - 1; i >= 0; i--) if (!c.벽[i].length) c.벽.splice(i, 1)
      }
      const 모 = new Map()
      for (const [, f, m] of 아래배경.filter((v) => v[1] !== null)) { const k = (/^B\d/.test(f) ? '지하' + f.slice(1) + '층' : f === 'R' ? '지붕층' : f + '층') + ' ' + m; 모.set(k, (모.get(k) || 0) + 1) }
      if (모.size) 경고.push('위층 평면에 바탕으로 그린 아래층 벽 ' + 아래배경.filter((v) => v[1] !== null).length + '곳은 셈에서 뺐습니다(같은 자리 · 같은 두께의 아래층 벽 · 벽 일람표에 이 층 줄 없음 · 그 평면 벽의 반 넘게가 그러함): ' + [...모].map(([k, n]) => k + ' ' + n).join(' · '))
    }
    /* 🧭 G409 알림 — 층 · 기호마다 잰 길이(m) */
    const 층글 = (f) => (/^B\d/.test(f) ? '지하' + f.slice(1) + '층' : f === 'R' ? '지붕층' : f + '층')
    const 길이 = (x) => Math.hypot(x._축[2] - x._축[0], x._축[3] - x._축[1])
    const 모음 = (arr) => { const m = new Map(); for (const [x, f] of arr) { const k = 층글(f) + ' ' + x.기호; m.set(k, (m.get(k) || 0) + 길이(x)) } return [...m].map(([k, v]) => k + ' ' + (v / 1000).toFixed(1) + ' m').join(' · ') }
    const 쌓임 = 바탕셈.filter((v) => v[2] !== null), 단면확인 = 바탕셈.filter((v) => v[2] === null)
    if (쌓임.length) {
      const 이웃 = [...new Set(쌓임.map(([, , g]) => 층글(g)))].join(' · ')
      경고.push('📐 건축 바탕(주심도에 끼운 건축 평면)으로만 그린 벽을 셈 — ' + 모음(쌓임) + ' — 바로 위 · 아래층(' + 이웃 + ') 주심도에 같은 자리 · 같은 두께 구조 벽이 있음(길이 = 건축 바탕 두 선을 잼)')
    }
    if (단면확인.length) {
      const 곳 = [...new Set(단면확인.map((v) => v[3]))].join(' / ')
      경고.push('📐 건축 바탕으로만 그린 벽을 골구도로 확인해 셈 — ' + 모음(단면확인) + ' — 위아래층에 같은 벽은 없지만 골구도 그 층 띠에 같은 벽 이름이 있음(' + 곳 + ') · 길이 = 건축 바탕 두 선을 잼')
    }
    const 뺌 = 바탕뺌.filter(([, , w]) => w !== '같음')
    if (뺌.length) 경고.push('❓ 건축 바탕에만 있는 벽 — 위 · 아래층에 같은 자리 구조 벽이 없어 셈에서 뺐습니다(구조 벽인지 도면에 없음): ' + 모음(뺌) + ' — 철근콘크리트 벽이면 골조 화면 벽 줄에 적어 주세요')
  }
  /* 🧭 G241 «SC1 · SG1 · SB1»(Steel Column · Girder · Beam) 꼴인데 철골 목록이 없으면 — 철골 부재(규격이 도면에 없음)로 알림(현장 C · D 토목 «SC1» 2개 · 건축공사분) */
  if (한선보.size) 경고.push('📐 한 선으로만 그린 보 ' + [...한선보].map(([k2, 곳]) => k2 + ' ' + 곳.size + '곳').join(' · ') + ' — 평면에 나란한 두 선이 없고 슬래브 끝 선 하나뿐이라 그 선을 보 한 면으로 보고 일람표 폭으로 셈했습니다(길이 = 도면 선을 잼) — 3D 에서 자리를 한 번 보아 주세요')
  for (const [k2, n] of 없는기호) {
    const 몸 = (기호풀이(k2) || {}).몸 || k2
    if (/^S[CGB]\d/.test(몸)) 경고.push('평면의 «' + k2 + '» ' + n + '개 — 철골 부재 기호로 보이나 규격(H형강 등)이 넣은 도면에 없어 셈에서 뺐습니다(철골 무게는 아직 자동으로 안 셉니다)')
    else 경고.push('평면의 «' + k2 + '» ' + n + '개 — 일람표(배근표)에 없는 기호라 셈에서 뺐습니다')
  }

  /* 🧱 G233 (2026-10-10) MAT(온통) 기초 — 소장님 현장 A 도면 «기초 0 ㎥» → 「넣은 도면 모두 점검」
     기초 평면에 부재 기호(F1 …)가 없고 «기초 두께 · *: Thk = 600mm» 범례가 있으면:
       ① 범례 글자 줄 왼쪽의 해치 견본 무늬(ANSI31 …) ↔ 두께 · 견본 없는 줄 = 기본 두께
       ② 기초 테두리 = 그 평면의 가장 큰 닫힌 선(제목 글자를 안 품은 것 · 20 ㎡ 넘게) → «MAT» 부정형 기초(면적 · 둘레 × 기본 두께)
       ③ 평면의 같은 무늬 해치 = 두꺼운 구역 → «MAT-1200» 꼴 부정형 기초(구역 넓이 · 둘레 × (구역 두께 − 기본 두께)) — 아래로 더 깊음
       ④ 철근 = «기본근» 글자 곁(5 m)의 «HD19@300(T)» 꼴 — 위 · 아래 그물마다 두 방향(m²당 2 × 1000/간격 m) · 추가 보강근은 아직 */
  const 매트배근 = [], 매트주 = [], 매트보강 = []
  const 매트받침 = []          // 🧭 G267 [받친 층(없으면 '' = 첫 층), MAT 이름] — 그 층 기둥 · 벽 철근이 MAT 속으로 들어감
  for (const D of 도면들) {
    const 기제목 = 제목들.filter((t) => t.D === D && t.f.includes('FT'))
    if (!기제목.length) continue
    /* 🧭 G237 기초 기호가 «MF1» 처럼 MAT(온통) 기호뿐이고 일람표엔 «기초 구조도 참조» 라 크기가 없으면(소장님 현장 B) — 범례 두께로 MAT 를 읽음 */
    const 기초기호 = [...(층들.get('FT') || { 기초: new Map() }).기초.keys()]
    if (기초기호.length && !기초기호.every((k) => /^M(F|AT)/i.test(k))) continue
    /* 범례 «Thk = 600mm» · «Thk 600» · «Thk 1,000»(현장 B «기초 레벨» 범례 — mm 없이) */
    const 범례 = D.글자.map((g) => { const m = /THK\.?=?([\d,]{3,6})MM/.exec(g.u) || /두께[:=]?([\d,]{3,5})MM/.exec(g.u) || /^THK\.?=?([\d,]{3,6})$/.exec(g.u); return m ? { g, t: +m[1].replace(/,/g, '') } : null }).filter((x) => x && x.t >= 200 && x.t <= 5000)
    if (!범례.length) continue
    const 견본 = new Set()
    const 무늬두께 = new Map()
    let 기본 = null
    for (const L of 범례) {
      const g = L.g
      let c = D.해치.filter((h) => { const cx = (h.b[0] + h.b[2]) / 2, cy = (h.b[1] + h.b[3]) / 2; return Math.abs(cy - g.y) <= 1.6 * g.h && cx >= g.x0 - 4 * g.h && cx <= g.x0 + g.w && (h.b[2] - h.b[0]) < 30 * g.h })
      /* 🧭 G253 표 꼴 범례(현장 B «FOUNDATION LIST» — 표시 | 기호(MAT 기본) | 두께(Thk 700)): 견본이 두께 글 왼쪽 두 칸 너머 — 같은 줄 왼쪽 20 글자 안 가장 가까운 작은 해치 하나 */
      if (!c.length) {
        const 왼 = D.해치.filter((h) => { const cx = (h.b[0] + h.b[2]) / 2, cy = (h.b[1] + h.b[3]) / 2; return Math.abs(cy - g.y) <= 0.8 * g.h && cx < g.x0 && cx >= g.x0 - 20 * g.h && (h.b[2] - h.b[0]) < 12 * g.h && (h.b[3] - h.b[1]) < 3 * g.h })
          .sort((p, q) => (q.b[0] + q.b[2]) - (p.b[0] + p.b[2]))
        if (왼.length) c = [왼[0]]
      }
      if (c.length) { for (const h of c) { 견본.add(h); if (h.무늬 && !무늬두께.has(h.무늬)) 무늬두께.set(h.무늬, L.t) } }
      else if (기본 === null) 기본 = L.t
    }
    if (기본 === null) 기본 = Math.min(...범례.map((x) => x.t))
    const 읽은테 = []
    for (const t of 기제목) {
      const 이것 = (x, y) => 제목찾기(D, { x, y, h: t.g.h }) === t
      /* 🧭 G260 판 테두리 층 · 주석 층(MARK · 구름 · 글 · 치수 …)의 닫힌 선은 기초 테두리 아님 — xref 로 끼운 층(«XREF_S-PLAN|FOUNDATION»)은 끝 이름으로 봄
           (현장 B: «편심기초 구간» 둥근 네모(MARK 716.5 ㎡)를 테두리로 썼고, 끼운 xref 층은 이름에 XREF 가 있어 모두 뺐었음) */
      const 끝이름 = (ly) => ((D.layers[ly] || {}).name || '').split('|').pop()
      const 틀층 = (ly) => /시트|SHEET|PAPER|FORM|도곽|BORDER|FRAME/i.test((D.layers[ly] || {}).name || '') || /XREF/i.test(끝이름(ly))
      const 주석닫힌 = (ly) => 주석층.test(끝이름(ly)) || /MARK|CLOUD|구름|REV/i.test(끝이름(ly))
      let 테 = D.닫힌.filter((c) => c.점 && !c.원 && 이것((c.b[0] + c.b[2]) / 2, (c.b[1] + c.b[3]) / 2) && !점안([t.g.x, t.g.y], c.점) && !틀층(c.ly) && !주석닫힌(c.ly))
        .map((c) => ({ c, A: 고리넓이(c.점) })).filter((x) => x.A > 2e7).sort((a, b) => b.A - a.A)
      /* 기둥(작은 닫힌 선 150 ~ 3,000 mm)이 셋 넘게 있으면 — 기둥을 80% 넘게 품은 것 중 가장 작은 것(실 면적 · 도면 테두리 네모는 더 큼 · 현장 A S-701 = @SL 759 ㎡) */
      const 기둥점 = D.닫힌.filter((c) => { const w = c.b[2] - c.b[0], h = c.b[3] - c.b[1]; return w >= 150 && h >= 150 && w <= 3000 && h <= 3000 && 이것((c.b[0] + c.b[2]) / 2, (c.b[1] + c.b[3]) / 2) }).map((c) => [(c.b[0] + c.b[2]) / 2, (c.b[1] + c.b[3]) / 2])
      const 품음 = (점들) => 기둥점.filter((p) => 점안(p, 점들)).length >= 0.8 * 기둥점.length
      if (기둥점.length >= 3) {
        const 품은 = 테.filter((x) => 품음(x.c.점)).sort((a, b) => a.A - b.A)
        if (품은.length) 테.unshift(품은[0])
      }
      /* 🧭 G260 닫힌 테두리가 없거나 기둥을 못 품으면 — 기초 층(FOUND · FOOT · 기초 · MAT) 열린 선의 바깥 테두리(`바깥고리` — 끝 붙이기 30 mm · 만나는 곳 나눔 ·
           가장 큰 무리의 바깥 면). 그것도 기둥을 못 품으면 벽 · 구조 층(CON · WALL)까지 넣어 다시. 현장 B 1층 기초 평면: 테두리가 열린 선(FOUNDATION 층)뿐 */
      /* 기둥 · 말뚝 층(COL · 기둥 · PHC · PILE · 파일)의 작은 닫힌 선 — 열린 선 테두리를 받을지 셀 때(표 칸 · 글틀 · 기호 동그라미는 뺌). 셋 안 되면 작은 닫힌 선 모두 */
      const 구조점0 = D.닫힌.filter((c) => { const w = c.b[2] - c.b[0], h = c.b[3] - c.b[1]; return w >= 150 && h >= 150 && w <= 3000 && h <= 3000 && /COL|기둥|PHC|PILE|파일/i.test(끝이름(c.ly)) && 이것((c.b[0] + c.b[2]) / 2, (c.b[1] + c.b[3]) / 2) }).map((c) => [(c.b[0] + c.b[2]) / 2, (c.b[1] + c.b[3]) / 2])
      const 구조점 = 구조점0.length >= 3 ? 구조점0 : 기둥점
      const 셈안 = (점들) => 구조점.filter((p) => 점안(p, 점들)).length
      if (!테.length || (기둥점.length >= 3 && !품음(테[0].c.점))) {
        const 판i = D.도곽 && D.도곽.length ? D.도곽번(t.g.x, t.g.y) : -1
        const 범 = 판i >= 0 ? D.도곽[판i] : null
        const 후보 = 범 ? D.찾기(범[0], 범[1], 범[2], 범[3]) : D.sx0.map((_, s2) => s2)
        for (const re of [/FOUND|FOOT|FTG|기초|MAT/i, /FOUND|FOOT|FTG|기초|MAT|CON|WALL|벽|구조/i]) {
          const 선 = []
          for (const s2 of 후보) { const ln = 끝이름(D.sly[s2]); if (!re.test(ln) || 주석닫힌(D.sly[s2])) continue; if (!이것((D.sx0[s2] + D.sx1[s2]) / 2, (D.sy0[s2] + D.sy1[s2]) / 2)) continue; 선.push([D.sx0[s2], D.sy0[s2], D.sx1[s2], D.sy1[s2]]) }
          const 고 = 선.length >= 4 ? 바깥고리(선, 30) : null
          if (!고 || 고.넓이 <= 2e7 || 점안([t.g.x, t.g.y], 고.점)) continue
          /* 기둥 · 말뚝의 반 넘게 품고(다른 기초 위 기둥 — 현장 B 지하층 쪽 기둥 6개는 1층 기초 테두리 밖) 닫힌 후보보다 많이 품을 때만 */
          if (구조점.length >= 3 && (셈안(고.점) < 0.5 * 구조점.length || (테.length && 셈안(고.점) <= 셈안(테[0].c.점)))) continue
          const xs = 고.점.map((p) => p[0]), ys = 고.점.map((p) => p[1])
          테 = [{ c: { 점: 고.점, b: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)], ly: -1 }, A: 고.넓이, 열린: true }]
          break
        }
      }
      if (!테.length) continue
      /* 🧭 G260 같은 평면의 제목 둘(평면 밑 제목 + 표제란) · 이미 읽은 테두리와 반 넘게 겹치면 건너뜀 */
      {
        const b0 = 테[0].c.b
        const 겹 = 읽은테.some((b1) => { const w = Math.min(b0[2], b1[2]) - Math.max(b0[0], b1[0]), h = Math.min(b0[3], b1[3]) - Math.max(b0[1], b1[1]); if (w <= 0 || h <= 0) return false; const a0 = (b0[2] - b0[0]) * (b0[3] - b0[1]), a1 = (b1[2] - b1[0]) * (b1[3] - b1[1]); return w * h >= 0.5 * Math.min(a0, a1) })
        if (겹) continue
        읽은테.push(b0)
      }
      const 바 = 테[0].c.점, A = 테[0].A, 둘 = 고리둘레(바)
      // 철근 — 기본근 글자 곁
      const 기본근글 = D.글자.filter((g) => /기본근|기본철근|MAINBAR/.test(g.u) && 이것(g.x, g.y))
      const 철글 = D.글자.filter((g) => 이것(g.x, g.y)).map((g) => { const m = 매트철근꼴.exec(g.u); const w = m ? m[3] || '' : ''; return m ? { g, d: +m[1], s: +m[2], 위: /T.*B|상.*하/.test(w) ? 'TB' : /T|상/.test(w) ? 'T' : /B|하/.test(w) ? 'B' : '' } : null }).filter(Boolean)
      const 쓸철 = 기본근글.length ? 철글.filter((x) => 기본근글.some((g) => Math.hypot(g.x - x.g.x, g.y - x.g.y) < 5000)) : 철글
      const 그물 = new Map()            // 위아래 → 가장 많이 나온 {d, s}
      for (const 위 of ['T', 'B']) {
        const 셈 = new Map()
        for (const x of 쓸철.filter((y) => y.위 === 위 || y.위 === 'TB')) { const k2 = x.d + '@' + x.s; 셈.set(k2, (셈.get(k2) || 0) + 1) }
        const 큰 = [...셈].sort((a, b) => b[1] - a[1])[0]
        if (큰) { const [d, s2] = 큰[0].split('@').map(Number); 그물.set(위, { d, s: s2 }) }
      }
      const 단위 = new Map()
      for (const x of 그물.values()) 단위.set(x.d, (단위.get(x.d) || 0) + 2 * 1000 / x.s)
      const 단위글 = [...단위].map(([d, v]) => 'D' + d + ':' + (Math.round(v * 100) / 100)).join(', ')
      /* 🧭 G260 MAT 자리에도 «어느 평면에서 읽었나»(p) — BIM 이 그 평면의 기둥 · 벽과 한 무리로 자리를 맞춤(예전: p 없이 MAT 둘만 따로 무리 → 현장 B 지하 MAT «자리 못 맞춤» 으로 빠짐) */
      const 판p = (x, y) => D.번 + '|' + t.판 + '|' + t.이름 + '|' + (D.도곽 && D.도곽.length ? D.도곽번(x, y) : -1)
      const 자리 = 자리만들기(D.이름, [테[0].c.b[0] / D.k, 테[0].c.b[1] / D.k, 테[0].c.b[2] / D.k, 테[0].c.b[3] / D.k])
      자리.p = 판p((테[0].c.b[0] + 테[0].c.b[2]) / 2, (테[0].c.b[1] + 테[0].c.b[3]) / 2)
      /* 🧭 G266 «1층기초구조평면도» 의 MAT 는 1층 바닥을 받침(현장 B — 지하가 없는 쪽 · 윗면 = «1F SLAB LEVEL») — 3D 가 그 층 바닥에 놓게 */
      const 받침층 = 기초받침층(t.g.s)
      if (받침층) 자리.받침층 = 받침층
      자리.판 = 바.map((p) => [반올림(p[0] / D.k, 1), 반올림(p[1] / D.k, 1)])
      /* 🧭 G260 MAT 평면이 둘 넘으면(현장 B 1층 기초 · 지하1층 기초) 이름을 따로 — MAT · MAT2 · … (예전: 모두 «MAT» 라 배근표 첫 줄 넓이로 셈) */
      const 매트이름 = (() => { const n = 매트배근.filter((r2) => /^MAT\d*$/.test(r2.기호)).length; return n ? 'MAT' + (n + 1) : 'MAT' })()
      매트배근.push({ 기호: 매트이름, 종류: '부정형', 가로: '', 세로: '', 두께: String(기본), 하부가로: '', 하부세로: '', 상부가로: '', 상부세로: '', 헌치높이: '', 윗가로: '', 윗세로: '', 지지근: '', 면적: String(Math.round(A / 1e4) / 100), 둘레: String(Math.round(둘 / 10) / 100), 단위철근: 단위글, 버림: '', 동: '', _길x: String(Math.round((테[0].c.b[2] - 테[0].c.b[0]) / D.k)), _길y: String(Math.round((테[0].c.b[3] - 테[0].c.b[1]) / D.k)) })      // 🧭 G264 판 상자(이음 셈)
      매트주.push({ 층: 'FT', 기호: 매트이름, 줄기초: '', MAT단변: '', MAT장변: '', 형틀공제: '', 추가: '', 단부공제: '', QT: '1', C: '', F: '', 공제F: '', R: '', _자리: [자리] })
      매트받침.push([받침층 || '', 매트이름])
      근거.push({ 번: D.번, i: t.g.i, 글: 'MAT 기초' })
      // 두꺼운 구역 — 같은 무늬 해치(범례 견본 · 테두리 밖은 뺌)
      const 구역 = new Map()
      for (const h of D.해치) {
        if (견본.has(h) || !무늬두께.has(h.무늬)) continue
        const cx = (h.b[0] + h.b[2]) / 2, cy = (h.b[1] + h.b[3]) / 2
        if (!이것(cx, cy) || !점안([cx, cy], 바)) continue
        const 두 = 무늬두께.get(h.무늬)
        if (!(두 > 기본)) continue
        const 고 = h.고리.slice().sort((a, b) => 고리넓이(b) - 고리넓이(a))
        /* 🧭 G292 ⑩ 한 해치에 떨어진 섬이 여럿(현장 B «Thk 1,000» 무늬 — 왼쪽 ㄴ자 41 ㎡ + 오른쪽 띠 12 ㎡) — 다른 고리 안에 든 고리만 구멍 · 나머지는 다 구역.
             전엔 가장 큰 고리 하나만 셈 */
        const 섬 = 고.filter((r, k) => !고.some((q, j) => j < k && 고리넓이(q) > 고리넓이(r) && 점안(r[0], q)))
        const 구멍 = 고.filter((r) => !섬.includes(r))
        const 넓 = Math.max(0, 섬.reduce((t, r) => t + 고리넓이(r), 0) - 구멍.reduce((t, r) => t + 고리넓이(r), 0))
        const v = 구역.get(두) || { 넓: 0, 둘: 0, 판: [], b: [Infinity, Infinity, -Infinity, -Infinity] }
        v.넓 += 넓; v.둘 += 고.reduce((t, r) => t + 고리둘레(r), 0); v.판.push(...섬)
        v.b = [Math.min(v.b[0], h.b[0]), Math.min(v.b[1], h.b[1]), Math.max(v.b[2], h.b[2]), Math.max(v.b[3], h.b[3])]
        구역.set(두, v)
      }
      for (const [두, v] of [...구역].sort((a, b) => a[0] - b[0])) {
        const 기 = 매트이름 + '-' + 두           // 그 두께 구역(배근표 두께 = 기본 두께보다 더 깊은 만큼)
        /* 🧭 G276 단차부 철근 자리 — MAT 아래 철근(없으면 위)의 지름 · 간격 · 구역 둘레 · 단차 깊이(정착은 끝에서 정착표로) */
        const 아래근 = 그물.get('B') || 그물.get('T')
        매트배근.push({ 기호: 기, 종류: '부정형', 가로: '', 세로: '', 두께: String(두 - 기본), 하부가로: '', 하부세로: '', 상부가로: '', 상부세로: '', 헌치높이: '', 윗가로: '', 윗세로: '', 지지근: '', 면적: String(Math.round(v.넓 / 1e4) / 100), 둘레: String(Math.round(v.둘 / 10) / 100), 단위철근: '', 버림: '', 동: '', ...(아래근 ? { _단차: { d: 아래근.d, s: 아래근.s, 둘레: v.둘, 깊이: 두 - 기본 } } : {}) })
        const 자리들 = v.판.map((r) => { const xs = r.map((p) => p[0]), ys = r.map((p) => p[1]); const z = 자리만들기(D.이름, [Math.min(...xs) / D.k, Math.min(...ys) / D.k, Math.max(...xs) / D.k, Math.max(...ys) / D.k]); z.판 = r.map((p) => [반올림(p[0] / D.k, 1), 반올림(p[1] / D.k, 1)]); z.내림 = 기본; z.몫 = 고리넓이(r) / v.넓; z.p = 판p((Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2); if (받침층) z.받침층 = 받침층; return z })
        매트주.push({ 층: 'FT', 기호: 기, 줄기초: '', MAT단변: '', MAT장변: '', 형틀공제: '', 추가: '', 단부공제: '', QT: '1', C: '', F: '', 공제F: '', R: '', _자리: 자리들 })
      }
      /* 🧭 G254 추가 보강근 구역(현장 A S-701 «추가보강근» — 보강 층 «-구조_기초보강LINE» 의 닫힌 네모 + 지시선 끝의 글 «SHD22@200(B)» + 네모 안 철근 대표 선(RR)):
           철근 대표 선 하나 = 그 방향 철근(길이 = 네모의 그 방향 길이 · 개수 = 다른 방향 길이 ÷ 간격 + 1) · 대표 선이 없으면 두 방향 · «보강» 표 산출식(길이 m)으로 */
      const 추가 = []
      let 구역수 = 0
      {
        const 층이름 = (ly) => String((D.layers[ly] || {}).name || '')
        const 구역들 = D.닫힌.filter((c) => c.점 && /보강|추가|ADD|REINF/i.test(층이름(c.ly)) && 이것((c.b[0] + c.b[2]) / 2, (c.b[1] + c.b[3]) / 2))
          .map((c) => ({ c, A: 고리넓이(c.점) })).filter((x) => x.A >= 1e6 && x.A < 0.5 * A)
        const 추가꼴 = /(?:^|[^A-Z0-9])(?:S?H?D|SD)(\d{2})@(\d{2,4})\s*\(?(T\s*[&,/+]?\s*B|T|B|상|하|상부|하부)?\)?$/
        const 안 = (z, x, y, e = 0) => x >= z.c.b[0] - e && x <= z.c.b[2] + e && y >= z.c.b[1] - e && y <= z.c.b[3] + e && (e > 0 || 점안([x, y], z.c.점))
        /* 🧭 G265 보강 층이 아닌 닫힌 선(주석 층 MARK 의 팔각형 — 현장 B S-101 1층 기초 «ADD BAR. SHD16@200(T)» 715 ㎡)도 추가 구역 — 글 자체에 «ADD · 추가» 가 있고
             글이나 그 지시선 끝이 그 안에 들 때만 · 기초 테두리 안(가운데) · 1 ㎡ 넘게 · 기초 테두리의 98 % 보다 작게 · 제목 · 판 테두리 층 아님. 보강 층 구역을 먼저 봄(현장 A 그대로) */
        const 덧구역들 = D.닫힌.filter((c) => c.점 && !c.원 && !/보강|추가|ADD|REINF/i.test(층이름(c.ly)) && !틀층(c.ly) && 이것((c.b[0] + c.b[2]) / 2, (c.b[1] + c.b[3]) / 2) && 점안([(c.b[0] + c.b[2]) / 2, (c.b[1] + c.b[3]) / 2], 바) && !점안([t.g.x, t.g.y], c.점))
          .map((c) => ({ c, A: 고리넓이(c.점) })).filter((x) => x.A >= 1e6 && x.A < 0.98 * A)
        const 덧글 = (g) => /ADD|추가/i.test(g.u)
        const 글들 = 구역들.length || 덧구역들.length ? D.글자.filter((g) => 이것(g.x, g.y)).map((g) => { const m = 추가꼴.exec(g.u) || 매트철근꼴.exec(g.u); return m ? { g, d: +m[1], s: +m[2] } : null }).filter(Boolean) : []
        const 임자 = new Map()
        for (const x of 글들) {
          /* 글 자기 지시선 · 바로 위 «추가보강근 · ADD BAR» 이름 글의 지시선(두 줄로 쓴 이름표 — 지시선은 윗줄에 붙음) · 글 자리 — 구역에 닿는 첫 것 */
          const 위글 = D.글자.filter((o) => o !== x.g && /추가|보강|기본|ADD|BAR|MAIN/i.test(o.s) && o.y > x.g.y && o.y - x.g.y <= 2.5 * x.g.h && Math.abs(o.x - x.g.x) <= Math.max(o.w, x.g.w))
          const 끝들 = []
          for (const gg of [x.g, ...위글]) {
            try { const e1 = D.지시D && D.지시D.sx0.length ? 지시선끝(D.지시D, gg, { 끝여유: 4 * gg.h }) : null; if (e1) 끝들.push([e1.x, e1.y]) } catch (e) { /* 없음 */ }
          }
          /* 지시선(LEADER)이 있으면 그 끝만(구역 밖이면 이 글은 구역 글이 아님 — 기본근 글) · 없을 때만 선 따라가기 · 글 자리 */
          if (!끝들.length) {
            try { const e2 = 지시선끝(D, x.g); if (e2) 끝들.push([e2.x, e2.y]) } catch (e) { /* 없음 */ }
            끝들.push([x.g.x, x.g.y])
          }
          let z = null, p0 = 끝들[0]
          for (const q of 끝들) { z = 구역들.find((zz) => 안(zz, q[0], q[1], 100)); if (z) { p0 = q; break } }
          if (!z && (덧글(x.g) || 위글.some(덧글)) && 덧구역들.length) {
            /* 글 자리 · 지시선 끝이 든 가장 작은 덧구역(안 = 테두리 안쪽만) */
            for (const q of [[x.g.x, x.g.y], ...끝들]) { z = 덧구역들.filter((zz) => 안(zz, q[0], q[1])).sort((a2, b2) => a2.A - b2.A)[0] || null; if (z) { p0 = q; break } }
          }
          if (z && !임자.has(z)) 임자.set(z, x)
        }
        for (const [z, x] of 임자) {
          구역수++
          const w = z.c.b[2] - z.c.b[0], h = z.c.b[3] - z.c.b[1]
          const 대표 = new Set()
          for (const s2 of D.찾기(z.c.b[0] - 30, z.c.b[1] - 30, z.c.b[2] + 30, z.c.b[3] + 30)) {
            if (D.sly[s2] === z.c.ly) continue
            const x0 = D.sx0[s2], y0 = D.sy0[s2], x1 = D.sx1[s2], y1 = D.sy1[s2]
            if (!안(z, x0, y0, 30) || !안(z, x1, y1, 30)) continue
            const L = Math.hypot(x1 - x0, y1 - y0)
            if (Math.abs(y1 - y0) <= 0.01 * L && L >= 0.8 * w) 대표.add('가로')
            else if (Math.abs(x1 - x0) <= 0.01 * L && L >= 0.8 * h) 대표.add('세로')
          }
          const 방향 = 대표.size ? [...대표] : ['가로', '세로']
          const 네모 = z.A >= 0.97 * w * h
          for (const 방 of 방향) {
            /* 🧭 G265 네모가 아닌 구역(모서리를 깎은 팔각형)은 철근 한 가닥 길이 = 넓이 ÷ 폭(평균) — 상자 길이로 세면 깎은 모서리만큼 많음 */
            const 폭 = 방 === '가로' ? h : w, 길 = 네모 ? (방 === '가로' ? w : h) : z.A / 폭
            const n = Math.floor(폭 / x.s) + 1
            매트보강.push({ 동: '', 층: 'FT', 부재: 'F-D' + x.d, 산출식: n + '*' + 반올림(길 / 1000, 3), _자리: [자리만들기(D.이름, [z.c.b[0] / D.k, z.c.b[1] / D.k, z.c.b[2] / D.k, z.c.b[3] / D.k])] })
            추가.push({ d: x.d, m: n * 길 / 1000 })
          }
        }
      }
      const 추가글 = 추가.length ? (() => { const t = new Map(); for (const a of 추가) t.set(a.d, (t.get(a.d) || 0) + a.m); return ' · 추가 보강근 구역 ' + 구역수 + '곳(' + [...t].map(([d, m]) => 'D' + d + ' ' + Math.round(m) + ' m').join(' · ') + ' — «보강» 표)' })() : ' · 추가 보강근은 아직 안 셈'
      경고.push(`MAT(온통) 기초로 읽었습니다(${D.번}번 도면 «${t.g.s}») — 테두리 ${(A / 1e6).toFixed(1)} ㎡ × 기본 ${기본} mm` + ([...구역].length ? ' + ' + [...구역].map(([두, v]) => `${두} mm 구역 ${(v.넓 / 1e6).toFixed(1)} ㎡`).join(' · ') : '') + (단위글 ? ` · 철근 ${단위글} m/㎡(기본근 위 · 아래 두 방향)` : ' · 철근 글자를 못 찾아 철근은 안 셈') + 추가글)
      /* 🧭 G260 한 파일에 기초 평면이 여럿이면(현장 B S-101 1층 기초 · 지하1층 기초) 모두 — 예전엔 첫 MAT 만 읽고 멈춤(지하 기초 빠짐) */
    }
  }

  /* 공사 만들기 */
  const P = 새공사()
  P.이름 = '도면에서 자동 — ' + 도면들0.map((d) => d.이름 || '').filter(Boolean).join(' · ')
  for (const k2 of Object.keys(배근행)) {
    const 쓴 = new Set(배근행[k2].keys())
    const 줄 = [...배근행[k2].values()]
    for (const [k3, m] of 전역[k2]) if (!쓴.has(k3)) 줄.push({ ...m, 기호: k3 })      // 평면에 없어도 일람표에 있는 것은 배근표에 둠
    P.배근[k2 === '벽' ? '벽' : k2] = 줄.map(({ _근거, _짐작, ...r }) => r)
  }
  if (매트배근.length) P.배근.기초 = [...(P.배근.기초 || []), ...매트배근]
  /* 🧭 G261 데크 슬래브 — 도면 묶음에 데크(DECK · 데크) 글이 있고 기호 몸이 DS · UDS(«DS1» · «2UDS1») 이면 종류 «데크»(거푸집 대신 데크 면적) —
       일람표 종류 칸이 비어 «양방향» 이 된 줄도(현장 B DS1 ~ 3 · UDS1 ~ 3: 슬래브 거푸집 1,238 ㎡ 중 데크 칸 약 1,080 ㎡ — 내역 합판 슬래브 148 ㎡) */
  if (데크허용) for (const r of P.배근.슬라브 || []) {
    const 몸 = (기호풀이(r.기호) || {}).몸 || r.기호
    if (/^U?DS\d/.test(몸) && (!r.종류 || r.종류 === '양방향')) { r.종류 = '데크'; r.데크비고 = '기호 DS · UDS + 도면 데크 표시' }
  }
  /* 🧭 G281 벽 끝 «U형 철근» 상세 — 벽 일람 · 벽체 상세가 든 판에 «"U"형 철근 · U-BAR» 글이 있으면(현장 B S-401 «일자형 벽체 · 모서리 벽체 · 단부 보강근 상세도»)
       구조벽마다 벽 끝 · 만나는 데에 수평근과 같은 굵기 · 간격의 U 철근(셈: 다리 = 인장 이음 × 2 + 두께 − 피복 × 2 · 끝 몫은 3D 벽끝재기) */
  const U판 = 도면들.find((D) => D.글자.some((g) => /["“”']?\s*U\s*["“”']?\s*(?:형|자형)\s*철근|\bU-?BAR\b/i.test(g.s) &&
    D.글자.some((t) => /벽체|WALL|옹벽/i.test(t.s) && (!D.도곽 || !D.도곽.length || D.도곽번(t.x, t.y) === D.도곽번(g.x, g.y)))))
  if (U판) for (const r of P.배근.벽 || []) if (글(r.구분 || '구조벽') === '구조벽' && !글(r.단위철근) && !글(r.단부U)) r.단부U = 'U'
  /* 🧭 G408 📐 춤이 없는 보 — 골구도 · 단면에 잘린 그 보를 직접 잼(층마다). 그 층에서 잰 곳이 모두 같으면 그 층 그 보 모두 · 곳마다 다르면 ❓(잰 값을 알려 줌) */
  {
    const 빈보 = (P.배근.보 || []).filter((r) => !(+r.춤 > 0) && +r.폭 > 0).map((r) => ({ r, 몸: (기호풀이(r.기호) || {}).몸 || r.기호, 폭: r.폭 }))
    let 잰 = []
    try { 잰 = 빈보.length ? 단면춤재기(도면들, 빈보) : [] } catch (e) { 잰 = [] }
    const 무리 = new Map()
    for (const z of 잰) { const f = 아래층(z.판층); const k = z.몸 + '|' + f; const a = 무리.get(k) || []; a.push(z); 무리.set(k, a) }
    const 쓴글 = [], 다른글 = []
    for (const [k, zs] of 무리) {
      const [몸, f] = k.split('|')
      const b = 빈보.find((x) => x.몸 === 몸)
      if (!b) continue
      const 값 = [...new Set(zs.map((z) => z.춤))].sort((p, q) => p - q)
      const 같음 = 값[값.length - 1] - 값[0] <= Math.max(10, 0.02 * 값[0])
      const 근 = zs.map((z) => z.근거 + ' ' + z.잰춤.toLocaleString('en-US') + (z.치수 ? '(치수 글 ' + z.치수 + ')' : '') + (z.단면폭 ? ' · 단면 그림 폭 ' + z.단면폭 + '(범례 ' + b.r.폭 + ' 과 다름 — 물량은 범례 폭)' : '')).join(' · ')
      /* 곳마다 다른 춤 — 평면의 어느 보가 어느 단면인지 맞출 근거(단면 곁 보 이름 · 거리)가 아직 약해(현장 Y 평면 LB2 를 다 못 읽음 — 범례 300 ↔ 그림 200) 그 층은 ❓ + 잰 값 알림.
           💡 다음: 평면 LB2 읽기(그림 폭 200) 고친 뒤 단면 곁 보(이름 «5B10» · 거리)로 맞추기 — z.곁 에 모아 둠 */
      if (!같음) { 다른글.push(b.r.기호 + ' ' + f + '층(' + zs[0].레벨글 + ' 슬래브 밑) ' + 값.map((v) => v.toLocaleString('en-US')).join(' · ')); continue }
      const 키 = (f === 'FT' ? 'FT' : f) + 몸
      const 줄 = { ...b.r, 기호: 키, 춤: String(값[0]), _없음: undefined, 만든: '건설맵: 📐 직접 잰 값 — 춤 ' + 값[0].toLocaleString('en-US') + ' (골구도 · 단면에 잘린 ' + b.r.기호 + ' 을 잼: ' + 근 + ') · 폭 ' + b.r.폭 + ' = ' + (b.r.만든 ? '범례 · 일람' : '일람표') }
      delete 줄._없음          // _춤글(«건축치수») 은 남김 — 이름 비슷한 다른 부재를 후보로 안 냄
      P.배근.보.push(줄); 배근행.보.set(키, 줄)
      const c = 층들.get(f)
      let n = 0
      if (c) for (const 줄0 of c.보) for (const x of (Array.isArray(줄0) ? 줄0 : [줄0])) if (x && x.기호 === b.r.기호) { x.기호 = 키; n++ }
      쓴글.push(키 + ' ' + 값[0].toLocaleString('en-US') + '(' + n + '곳)')
    }
    if (쓴글.length) 경고.push('📐 직접 잰 보 춤 — 일람 · 범례에 춤이 없어 골구도 · 단면에 잘린 그림을 쟀습니다: ' + 쓴글.join(' · ') + ' — 배근표 «만든 값» 칸에 어느 도면 · 판 · 층을 쟀는지 적혀 있습니다')
    if (다른글.length) 경고.push('📐 잰 보 춤이 곳마다 다름 — ' + 다른글.join(' / ') + ' — 평면의 어느 곳이 어느 단면인지 아직 못 맞춰 그 층은 셈에서 뺐습니다(❓ · 잰 값을 배근표에 적으면 셈)')
  }
  /* 🧭 G250 빈 크기 · 철근은 클로드가 채움(«만든» 칸) — 평면 부재가 쓰는 줄만 알림 */
  const 채운 = 일람채우기(P.배근).filter((x) => (배근행[x.종] || new Map()).has(x.기호))
  const 층이름들 = new Set(['FT'])
  for (const f of 층들.keys()) 층이름들.add(f)
  for (const f of 바닥차례) { const i = 바닥차례.indexOf(f); if (i < 바닥차례.length - 1) 층이름들.add(f) }
  const 꼭대기 = 바닥차례.length ? 바닥차례[바닥차례.length - 1] : 'R'
  const 층목록 = [...층이름들].sort(층차례).filter((f) => f !== 꼭대기)
  const 짐작층 = []
  P.층 = 층목록.map((f) => {
    /* 🧭 G248 기초 평면에 바닥 슬래브(흙 위 · T= 칸)가 있으면 FT 층 슬래브 두께 = 그 두께(가장 흔한 것) — 지중보는 «폭×(춤−슬래브)×안목».
         전엔 0 이라 지중보가 슬래브 두께까지 다 들어가 바닥 슬래브(보 가운데까지)와 겹쳐 두 번 셌음 */
    if (f === 'FT') {
      const 두 = (층들.get('FT') || { 두께: [] }).두께.filter((v) => v > 0)
      const 흔한 = 두.length ? [...두.reduce((m2, v) => m2.set(v, (m2.get(v) || 0) + 1), new Map())].sort((a, b) => b[1] - a[1])[0][0] : 0
      return { 이름: 'FT', 층고: 0, 슬라브: 흔한 }
    }
    const i = 바닥차례.indexOf(f)
    const 위 = i >= 0 ? 바닥차례[i + 1] : null
    let 고 = null
    if (높이.has(f) && 위 && 높이.has(위)) 고 = 높이.get(위) - 높이.get(f)
    /* 🧭 G405 짐작 금지 — 층고를 도면(레벨 · 단면 · 골구도)에서 못 찾으면 0(❓ 도면에 없음): 그 층 기둥 · 벽은 셈에서 빠짐(층 표에 적으면 셈) · 3D 는 3,300 으로 그림만. 예전엔 3,300 으로 셈했음 */
    if (!(고 > 0)) { 고 = 0; 짐작층.push(f) }
    const 두 = (층들.get(f) || { 두께: [] }).두께.filter((v) => v > 0)
    /* 층 슬라브 두께 = 그 층에서 읽은 슬래브 두께 가운데 가장 많은 것(도면 값). 🧭 G405 하나도 없으면 0(❓ — 예전엔 150 짐작: 두께 없는 슬래브를 이 값으로 셈했음) */
    const 흔한 = 두.length ? [...두.reduce((m2, v) => m2.set(v, (m2.get(v) || 0) + 1), new Map())].sort((a, b) => b[1] - a[1])[0][0] : 0
    return { 이름: f, 층고: 고, 슬라브: 흔한 }
  })
  P.층.push({ 이름: 꼭대기 === 'PR' ? 'PR' : 'R', 층고: 0, 슬라브: 0 })
  { const 그림 = [...전역.보].filter(([, r]) => r._그림철근).map(([k, r]) => k + ' ' + r.상부 + '/' + r.하부)
    if (그림.length) 경고.push('보 철근 글이 없는 일람 칸 ' + 그림.length + '곳은 단면 그림의 철근 동그라미를 세어 읽었습니다(굵기 = 동그라미 지름): ' + 그림.slice(0, 6).join(' · ') + (그림.length > 6 ? ' …' : '') + ' — 늑근은 굵기 · 간격 글이 없어 D13@150 으로 셈(배근표에서 바꿈)')
    if (무리철근.length) 경고.push('단면 그림에 철근이 없는 보 ' + 무리철근.length + '곳(' + 무리철근.join(' · ') + ')은 같은 이름 무리 보의 철근을 빌리지 않았습니다(❓ 도면에 없음 — 같은 것이면 배근표에 적어 주세요)')
  }
  if (바닥슬수) 경고.push('기호 없는 바닥 슬래브 ' + 바닥슬수 + '곳(기초 평면의 «높이 / T=두께» 글자)을 그 칸(둘레 보 · 벽)의 크기로 셈했습니다')
  /* 🧭 G405 짐작 금지 알림 — 📐 도면에서 잰 값(일람표에 없는 기호) · ❓ 도면에 없음(셈에서 뺀 것 — 배근표에 적으면 셈) */
  if (만든기호.length) {
    const 잰 = [...new Set(만든기호)]
    경고.push('📐 일람표에 없는 기호 ' + 잰.length + '가지(' + 잰.slice(0, 10).join(' · ') + (잰.length > 10 ? ' …' : '') + ')는 도면에서 잰 크기(평면 두 선 폭 · 기둥 · 기초 그림)만 썼습니다 — 배근표 «만든 값» 칸에 어디서 쟀는지 적혀 있습니다')
  }
  if (기초다시.length) 경고.push('기초 상세 ' + 기초다시.length + '곳은 칸에 슬래브 두께 글이 없어 바닥 일반 단면 두께로 «기초 바닥 ~ 슬래브 바닥» 을 다시 셈했습니다: ' + 기초다시.slice(0, 10).join(' · ') + (기초다시.length > 10 ? ' …' : ''))
  if (이은벽.size) 경고.push('이름 없이 읽은 벽 ' + [...이은벽.values()].reduce((a, b) => a + b, 0) + '곳은 다른 평면의 같은 자리 · 같은 두께 이름 붙은 벽 이름(그 층 일람 줄)으로 이었습니다: ' + [...이은벽].map(([k, n]) => k + ' ' + n).join(' · '))
  if (미표기벽.length) 경고.push('이름 없이 두 줄로만 그린 벽을 도면 주기 «미표기 벽체» 의 두께 · 기호로 읽었습니다(' + 미표기벽.join(' · ') + ' 곳) — 벽 길이 · 두께를 3D 에서 한 번 보아 주세요')
  if (바닥씨칸) {
    const 단들 = [...바닥씨단면]
    경고.push('기초 평면에 두께 글이 없는 바닥 슬래브 ' + 바닥씨칸 + '칸(' + Math.round(바닥씨넓).toLocaleString('ko-KR') + ' ㎡ · 칸마다 높이 글 · 둘레 보 · 벽)을 «' + 단들.map((s) => s.글).join(' · ') + '» 그림의 두께 ' + 단들.map((s) => s.두께).join(' · ') + 'mm 로 셈했습니다'
      + (단들.some((s) => s.버림) ? ' · 버림 ' + 단들.map((s) => s.버림).filter(Boolean).join(' · ') + 'mm' : '') + (단들.some((s) => s.흙) ? ' — 흙 위 슬래브(버림 · 단열재 위)라 밑면 거푸집은 안 셈' : '')
      + (바닥채움 ? '. 이 가운데 ' + 바닥채움 + '칸(' + Math.round(바닥채움넓).toLocaleString('ko-KR') + ' ㎡)은 높이 글이 없어 맞댄 칸의 높이로 봤습니다' : ''))
  }
  /* 🧭 G242 그 층 부재가 모두 기초 평면의 기둥 · 벽(주각)이면 — 3D(BIM)는 밑 기초 · 지중보 윗면 ~ 1층 바닥으로 잼 · 골조 화면 셈만 층고(짐작)를 씀 */
  const 주각층 = 짐작층.filter((f) => { const c = 층들.get(f); return !c || (!c.보.length && !c.기둥.size && !c.벽.length && !c.슬라브.length) })
  const 참짐작 = 짐작층.filter((f) => !주각층.includes(f))
  /* 🧭 G408 글 고침 — G405 부터 층고를 못 찾으면 0(❓ 셈에서 뺌)인데 글은 «3,300mm 로 짐작» 이었음 */
  if (참짐작.length) 경고.push('❓ 층고를 도면(레벨 · 단면 · 골구도)에서 못 찾은 층: ' + 참짐작.join(' · ') + ' — 그 층 기둥 · 벽은 셈에서 뺐습니다(짐작 안 함 · 3D 는 3,300 으로 그림만) · 골조 화면 «① 개요» 층고에 적으시면 셈합니다')
  if (주각층.length) 경고.push(주각층.join(' · ') + '층 부재는 기초 평면의 기둥 · 벽(주각)뿐 — BIM 3D 는 밑 기초 · 지중보 윗면부터 1층 바닥까지로 잽니다(📐) · 골조 화면 셈은 «① 개요» 층고가 비어 있으면(❓) 그 층을 셈에서 뺍니다')
  for (const z of 짐작칸) 경고.push('일람표의 ' + z + ' 는 짐작입니다 — 배근표를 한 번 보아 주세요')
  const 동 = 새동('')
  const 주 = 동.주자료
  /* 🧭 G248 구조물 판(PIT · 정화조 · 맨홀 · 점검구 · 처리장 …) — 평면 벽 두께 치수 줄 + 단면 높이 치수 줄로 상자를 세워 «보강» 표 산출식으로 */
  {
    const 읽은 = [], 못 = []
    for (const D of 도면들) {
      let r
      try { r = 구조물읽기(D, 판목록(D)) } catch (e) { continue }
      주.보강.push(...r.줄)
      for (const a of r.읽음) {
        읽은.push(a.이름 + ' ' + a.콘크리트.toFixed(1) + ' ㎥' + (a.짐작 ? '(짐작)' : ''))
        const f = D.도곽[a.p]; const o = f ? 쓰임(D, (f[0] + f[2]) / 2, (f[1] + f[3]) / 2) : null
        if (o) o.구조물 = a.글
      }
      for (const a of r.못읽음) {
        못.push(a.이름 + '(' + a.까닭 + ')')
        const f = D.도곽[a.p]; const o = f ? 쓰임(D, (f[0] + f[2]) / 2, (f[1] + f[3]) / 2) : null
        if (o) o.구조물못 = a.까닭
      }
    }
    if (읽은.length) 경고.push('구조물 판 ' + 읽은.length + '장을 평면 벽 두께 · 단면 높이 치수로 셈했습니다(골조 산출서 «보강» 표 산출식): ' + 읽은.join(' · ') + (읽은.some((t) => /\(짐작\)$/.test(t)) ? ' — 짐작: 높이 «VAR»(곳마다 다름)는 단면 그림에서 잰 값 · 낮은 판은 단면 레벨 글자로 본 두께' : ''))
    if (못.length) 경고.push('구조물 판 ' + 못.length + '장은 아직 못 셌습니다: ' + 못.join(' · '))
  }
  const 이야기층 = P.층.filter((f) => f.이름 !== 'FT' && (f.층고 > 0 || 짐작층.includes(f.이름))).map((f) => f.이름)      // 🧭 G405 층고가 도면에 없는 층(❓ 0)도 층
  /* 🧭 G267 MAT 위 층(현장 B 1층 MAT → 1층 · 지하 MAT → 지하1층 · 현장 A «기초 구조평면도» MAT → 첫 층)의 기둥 주근 · 벽 수직근은 MAT 속으로 정착 —
       기둥 «FT» 칸 = 그 MAT(두께 − 피복 + 12d) · 벽 «하부» 칸 = 그 MAT(두께). 예전엔 맨 아래 층 기둥만 첫 기초 기호(현장 B «MF1» — 두께 없음)로, 벽은 0 */
  const 받침MAT = new Map()
  for (const [층0, 이름] of 매트받침) { const k = 층0 || 이야기층[0] || '1'; if (!받침MAT.has(k)) 받침MAT.set(k, 이름) }
  let 열번 = 0
  for (const f of [...층들.keys()].sort(층차례)) {
    const c = 층들.get(f)
    const 홑 = new Map()
    /* 🧭 G299 «G1(상, 하)» 글 곁(2 m 안 · 같은 기호 · 같은 도면)의 보 = 위 · 아래 둘 → 그 줄 QT × 2(3D 는 한 자리) */
    const 겹수 = (x) => {
      if (!위아래글.length || !x.자리 || !x.자리.r) return 1
      const D0 = 도면들.find((D) => D.이름 === x.자리.n)
      if (!D0) return 1
      const [x0, y0, x1, y1] = x.자리.r.map((v) => v * D0.k)
      /* 글 자리에서 보 띠(네모)까지 1.5 m 안 — 가장 가까운 같은 기호 보 하나만 */
      const 거리 = (w) => Math.hypot(Math.max(x0 - w.g.x, 0, w.g.x - x1), Math.max(y0 - w.g.y, 0, w.g.y - y1))
      const 몸 = (k) => (기호풀이(k) || {}).몸 || k
      return 위아래글.some((w) => w.D === D0 && 몸(w.기호) === 몸(x.기호) && 거리(w) <= 1500 && !c.보.some((줄2) => 줄2.some((y) => y !== x && y.자리 && y.자리.n === x.자리.n && 몸(y.기호) === 몸(x.기호) && (() => { const [a0, b0, a1, b1] = y.자리.r.map((v) => v * D0.k); return Math.hypot(Math.max(a0 - w.g.x, 0, w.g.x - a1), Math.max(b0 - w.g.y, 0, w.g.y - b1)) < 거리(w) })()))) ? 2 : 1
    }
    for (const 줄 of c.보) {
      if (줄.length === 1) {
        const x = 줄[0]
        const 겹 = 겹수(x)
        const key = x.기호 + '|' + (x.안목 + x.좌 + x.우) + '|' + x.좌 + '|' + x.우 + (겹 > 1 ? '|겹' : '')
        const h = 홑.get(key); if (h) { h.QT += 겹; h._자리.push(x.자리) } else 홑.set(key, { 층: f, 열: '', 기호: x.기호, 길이: String(x.안목 + x.좌 + x.우), 좌단: x.좌 ? String(x.좌) : '', 우단: x.우 ? String(x.우) : '', S: '', QT: 겹, C: '', F: '', 공제F: '', R: '', _자리: [x.자리], ...(겹 > 1 ? { _위아래: true } : {}) })
        continue
      }
      열번++
      줄.forEach((x, i) => { const 겹 = 겹수(x); 주.보.push({ 층: f, 열: i === 0 ? 'A' + 열번 : i === 줄.length - 1 ? 'E' : '', 기호: x.기호, 길이: String(x.안목 + x.좌 + x.우), 좌단: x.좌 ? String(x.좌) : '', 우단: x.우 ? String(x.우) : '', S: '', QT: String(겹), C: '', F: '', 공제F: '', R: '', _자리: [x.자리], ...(겹 > 1 ? { _위아래: true } : {}) }) })
    }
    for (const h of 홑.values()) 주.보.push({ ...h, QT: String(h.QT) })
    const i = 이야기층.indexOf(f)
    const 위층 = i >= 0 ? 이야기층[i + 1] : null
    const 맨아래 = i === 0
    const 기초기호 = 맨아래 ? [...(층들.get('FT') || { 기초: new Map() }).기초.keys()][0] || '' : ''
    for (const [k2, n] of c.기둥) {
      const 몸 = (기호풀이(k2) || {}).몸
      const 위것 = 위층 && 층들.get(위층) ? [...층들.get(위층).기둥.keys()].find((x) => x === k2 || (기호풀이(x) || {}).몸 === 몸) : null
      const 층k = f === 'FT' ? (이야기층[0] || '1') : f
      주.기둥.push({ 층: 층k, 기호: k2, 높이: '', 내림: '', S: '', FT: 받침MAT.get(층k) || 기초기호, 연결: 위것 || 'R', QT: String(n), C: '', F: '', 원형F: '', R: '', _자리: c.기둥자리.get(k2) || [], ...(f === 'FT' ? { _기초판: true } : {}) })
    }
    const 슬홑 = new Map()
    for (const s2 of c.슬라브) {
      const key = s2.기호 + '|' + s2.단변 + '|' + s2.장변 + '|' + s2.단정 + '|' + s2.장정
      const h = 슬홑.get(key); if (h) { h.QT++; h._자리.push(s2.자리); h._안.push(s2.안 || null) } else 슬홑.set(key, { 층: f, 기호: s2.기호, 단변: String(s2.단변), 장변: String(s2.장변), 개구부: '', 단변정착: String(s2.단정), 장변정착: String(s2.장정), QT: 1, C: '', F: '', R: '', _자리: [s2.자리], _안: [s2.안 || null], _안cc: String(s2.단변) + '|' + String(s2.장변) })
    }
    for (const h of 슬홑.values()) 주.슬라브.push({ ...h, QT: String(h.QT) })
    /* 🧭 G274 계단 — 평면 계단판(판 수 · 길이 · 폭 · 참)마다 · 단수는 셈에서 층고 ÷ 판 수 ÷ 단 높이 */
    const 계홑 = new Map()
    for (const s2 of c.계단 || []) {
      const key = [s2.기호, s2.L, s2.W, s2.판수, s2.하단참, s2.상단참].join('|')
      const h = 계홑.get(key); if (h) { h.QT++; h._자리.push(s2.자리) } else 계홑.set(key, { 층: f, 기호: s2.기호, 단수: '', 길이: String(s2.L), 폭: String(s2.W), 하단참: String(s2.하단참), 상단참: String(s2.상단참), L정착: '2', W정착: '0', QT: 1, C: '', F: '', 챌판F: '', R: '', _판수: String(s2.판수), _자리: [s2.자리] })
    }
    for (const h of 계홑.values()) 주.계단.push({ ...h, QT: String(h.QT) })
    const 벽홑 = new Map()
    for (const 줄 of c.벽) for (const x of 줄) {
      const key = x.기호 + '|' + x.안목
      const 층w = f === 'FT' ? (이야기층[0] || '1') : f
      const h = 벽홑.get(key); if (h) { h.QT++; h._자리.push(x.자리) } else 벽홑.set(key, { 층: 층w, 기호: x.기호, 길이: String(x.안목), 높이: '', 하부: 받침MAT.get(층w) || '', 상부: '', 단부: '', X정착: '2', 상부이음: '1', OPEN: '', QT: 1, C: '', F: '', F2: '', R: '', _양면: true, _자리: [x.자리], ...(f === 'FT' ? { _기초판: true } : {}) })
    }
    for (const h of 벽홑.values()) 주.옹벽.push({ ...h, QT: String(h.QT) })
    for (const [k2, n] of c.기초) 주.기초.push({ 층: 'FT', 기호: k2, 줄기초: '', MAT단변: '', MAT장변: '', 형틀공제: '', 추가: '', 단부공제: '', QT: String(n), C: '', F: '', 공제F: '', R: '', _자리: c.기초자리.get(k2) || [] })
  }
  for (const r of 매트주) 주.기초.push(r)
  for (const r of 매트보강) 주.보강.push(r)
  /* 🧭 G274 계단 배근 — 평면 계단 기호마다: 계단 일람 · 배근도 줄 · 없으면 같은 기호 슬래브 일람(두께 · 단변 = 주근 · 장변 = 배력근) · 그것도 없으면 흔한 값(«만든») */
  {
    const 쓴 = [...new Set(주.계단.map((r) => r.기호))]
    const 줄 = []
    const 만든것 = []
    for (const 기 of [...쓴, ...[...계단일람.keys()].filter((k) => !쓴.includes(k))]) {
      const 몸 = (기호풀이(기) || {}).몸 || 기
      const a = 계단일람.get(기) || 계단일람.get(몸)
      if (a) {
        const { _근거, ...row } = a
        /* 🧭 G405 짐작 금지 — 빈 칸(두께 · 주근 · 배력근)은 흔한 값으로 안 채움 → «❓ 도면에 없음» (두께가 없으면 그 계단은 셈에서 빠짐 · 철근 칸이 비면 그 철근 0) */
        const 빈 = ['두께', '주근', '배력근'].filter((k) => !row[k])
        줄.push({ ...row, 기호: 기, ...(빈.length ? { 만든: '건설맵: ' + _근거 + ' — ❓ 도면에 없음 — ' + 빈.join(' · ') } : {}) })
        if (빈.length && 쓴.includes(기)) 만든것.push(기)
        continue
      }
      const s = (전역.슬라브 && (전역.슬라브.get(기) || 전역.슬라브.get(몸))) || null
      if (s && +s.두께 > 0 && (s.단변하부 || s.장변하부)) {
        const 위 = s.단변상부 || ''
        줄.push({ 기호: 기, 두께: String(s.두께), 주근: s.단변하부 || s.장변하부, 상부주근: 위 && 위 !== (s.단변하부 || s.장변하부) ? 위 : '', 배력근: s.장변하부 || s.단변하부, 참주근: '', 참배력근: '', 배근: 위 ? '복배근' : '단배근', 단높이: '', 단너비: '', 동: '', 만든: '건설맵: 📄 계단 일람이 없어 같은 기호 «' + 기 + '» 슬래브 일람(두께 · 단변 = 주근 · 장변 = 배력근)' })
        만든것.push(기)
        continue
      }
      /* 🧭 G405 계단 일람 · 배근도 · 같은 기호 슬래브 일람이 모두 없으면 빈 줄(«❓ 도면에 없음») — 예전엔 흔한 설계 값(두께 150 · D13@150 · D10@200)으로 셈했음 */
      줄.push({ 기호: 기, 두께: '', 주근: '', 상부주근: '', 배력근: '', 참주근: '', 참배력근: '', 배근: '', 단높이: '', 단너비: '', 동: '', 만든: '건설맵: ❓ 도면에 없음 — 두께 · 주근 · 배력근(계단 일람 · 배근도 · 같은 기호 슬래브 일람이 없음)' })
      만든것.push(기)
    }
    P.배근.계단 = 줄
    if (주.계단.length) {
      const 층별 = new Map()
      for (const r of 주.계단) 층별.set(r.층, (층별.get(r.층) || 0) + (+r.QT || 1))
      경고.push('계단 ' + [...층별.values()].reduce((a2, b2) => a2 + b2, 0) + '곳(' + [...층별].map(([k2, v]) => k2 + '층 ' + v).join(' · ') + ' — 같은 층을 두 평면에 그린 것은 3D 맞춤에서 한 번만)을 평면 계단판(네모 + 대각선)의 길이 · 폭 · 판 수 · 참과 ' + (만든것.length < 쓴.length ? '계단 일람 · 배근도로' : '도면에 있는 값으로') + ' 셈했습니다' +
        (만든것.length ? ' — «' + 만든것.join(' · ') + '» 는 계단 일람에 없음(배근표 «만든 값» 칸에 까닭 · ❓ 는 도면에 없어 셈에서 뺀 것)' : '') + ' · 단수는 층고 ÷ 판 수 ÷ 단 높이 · 3D 는 참 높이에 판 하나로 그림')
    }
  }
  /* 🧭 G273 깊은 칸(지하수조 …) — 맨 아래 층 바닥보다 깊은 방(단면 레벨)을 벽 · 바닥판으로 더하고 그 자리 MAT 를 뺌.
       현장 A: 골구도 단면 «지하수조» 안 폭 4,270 · 13,530 · 바닥 −7,350 · 벽 300 · 바닥판 600 + 건축 지하 평면 같은 이름 방 4.27 × 13.53 m — 내역 «합벽 지하 … 지하수조부» 가 있는데 우리는 안 셌음.
       철근 글이 없어 벽 = 맨 아래 층 같은 두께 벽(가장 긴 것) · 바닥판 = MAT 철근으로 «만든» 값 · 3D 에는 아직 안 그림(건축 평면 자리 맞춤 전)
       🧭 G406 짐작 금지 — 철근을 빌리지 않음: 벽 · 바닥판 철근 = ❓ 도면에 없음 · 같은 두께 벽 · MAT 은 «같은 부재» 후보로만(사람이 BIM 물량 일람표에서 📌) */
  {
    const 맨층 = (P.층.find((f) => f.이름 !== 'FT') || {}).이름
    const L0 = 맨층 && 높이.has(맨층) ? 높이.get(맨층) : null
    if (L0 !== null) {
      let 깊 = []
      try { 깊 = 깊은칸찾기(도면들, L0) } catch (e) { 깊 = [] }
      const 매트 = (P.배근.기초 || []).find((b) => /부정/.test(b.종류 || '') && 주.기초.some((r) => r.층 === 'FT' && r.기호 === b.기호 && (r._자리 || []).some((z) => z.판)))
      for (const k of 깊) {
        const H = L0 - k.F
        if (!(H > 500)) continue
        const t = k.벽, 밖a = k.a + 2 * t, 밖b = k.b + 2 * t
        const 같은벽 = (() => {
          const 길이 = new Map()
          for (const r of 주.옹벽) if (r.층 === 맨층) { const b = (P.배근.벽 || []).find((x) => x.기호 === r.기호); if (b && +b.두께 === t) 길이.set(b, (길이.get(b) || 0) + (+r.길이 || 0) * (+r.QT || 1)) }
          return [...길이].sort((p, q) => q[1] - p[1]).map((x) => x[0])[0] || null
        })()
        const 벽기호 = k.이름 + '벽', 바기호 = k.이름 + '바닥', 빼기호 = k.이름 + '자리'
        const 근 = '단면 ' + k.단면 + ' · 평면 ' + k.평면 + ' 안 ' + k.a + ' × ' + k.b
        P.배근.벽.push({ 배근: (같은벽 && 같은벽.배근) || '복배근', 구분: (같은벽 && 같은벽.구분) || '구조벽', 수직: '', 수평: '', 기호: 벽기호, 두께: String(t), 동: '', _없음: ['철근'], ...(같은벽 ? { _후보: [같은벽.기호] } : {}),
          만든: '건설맵: 📐 ' + 근 + ' — 두께 = 단면 · ❓ 도면에 없음 — 철근' + (같은벽 ? ' (같은 두께 ' + 맨층 + ' 벽 «' + 같은벽.기호 + '» 이 같은 것이면 📌)' : '') })
        const 벽줄 = (L, n) => ({ 층: 맨층, 기호: 벽기호, 길이: String(L), 높이: String(H), 하부: '', 상부: '', 단부: '', X정착: '2', 상부이음: '', OPEN: '', QT: String(n), C: '', F: '', F2: '', R: '', _양면: true, _깊은칸: k.이름 })
        주.옹벽.push(벽줄(k.a + t, 2), 벽줄(k.b + t, 2))
        const 둘레 = (2 * (밖a + 밖b) / 1000).toFixed(2), 넓 = (밖a * 밖b / 1e6).toFixed(2)
        P.배근.기초.push({ 종류: '부정형', 단위철근: '', 기호: 바기호, 두께: String(k.바닥), 면적: 넓, 둘레, _길x: String(밖a), _길y: String(밖b), 동: '', _없음: ['철근'], ...(매트 ? { _후보: [매트.기호] } : {}),
          만든: '건설맵: 📐 ' + 근 + ' — 두께 = 단면 바닥판 · ❓ 도면에 없음 — 철근' + (매트 ? ' (MAT «' + 매트.기호 + '» 와 같은 것이면 📌)' : '') })
        주.기초.push({ 층: 'FT', 기호: 바기호, 줄기초: '', MAT단변: '', MAT장변: '', 형틀공제: '', 추가: '', 단부공제: '', QT: '1', C: '', F: '', 공제F: '', R: '', _깊은칸: k.이름 })
        if (매트) {
          P.배근.기초.push({ ...매트, 기호: 빼기호, 면적: 넓, 둘레: '0', 버림: '', _길x: String(밖a), _길y: String(밖b), 동: '', 만든: '건설맵: ' + k.이름 + ' 자리(밖 ' + 밖a + ' × ' + 밖b + ')만큼 MAT 를 뺌' })
          주.기초.push({ 층: 'FT', 기호: 빼기호, 줄기초: '', MAT단변: '', MAT장변: '', 형틀공제: '', 추가: '', 단부공제: '', QT: '-1', C: '', F: 'N', 공제F: '', R: '', _깊은칸: k.이름 })
        }
        경고.push('깊은 칸 «' + k.이름 + '» — ' + 근 + ' mm · 바닥 ' + 높이글표(k.F) + ' · 벽 ' + t + ' · 바닥판 ' + k.바닥 + ' 로 벽(' + 맨층 + ' 바닥까지 ' + H + ' mm) · 바닥판을 더하고' + (매트 ? ' 그 자리 MAT 를 뺐습니다' : ' (MAT 없음)') + ' — 철근은 ❓ 도면에 없음(같은 두께 벽 · MAT 이 같은 것이면 BIM 물량 부재 일람표에서 📌) · 3D 에는 아직 안 그림')
      }
    }
  }
  if (매트주.length && !P.층.some((f) => f.이름 === 'FT')) P.층.unshift({ 이름: 'FT', 층고: 0, 슬라브: 0 })
  P.동 = [동]
  const 셈수 = Object.values(주).reduce((t2, a2) => t2 + a2.length, 0)
  if (!배근있음 && 기호글자.length) 경고.push('부재 일람표(보·기둥·슬래브 크기와 철근)를 찾지 못했습니다 — 일람표가 있는 도면도 같이 넣어 주세요')
  // 크기·철근이 빈 배근 줄 — 알림
  const 빈것 = []
  for (const [k2, 줄] of Object.entries(P.배근)) for (const r of 줄 || []) {
    /* 🧭 G241 평면 부재가 쓰는 줄만 — 안 쓰는 줄(평면 판의 크기 표 · 층마다 따로 읽은 것의 바탕)은 알리지 않음 */
    if (!(배근행[k2 === '벽' ? '벽' : k2] || new Map()).has(r.기호) && !매트배근.includes(r)) continue
    const 빔 = k2 === '보' ? !(+r.폭 && +r.춤) || (!r.상부 && !r.하부) : k2 === '기둥' ? !((+r.가로 && +r.세로) || +r.지름) || !r.주근 : k2 === '슬라브' ? !+r.두께 : k2 === '벽' ? !+r.두께 : k2 === '기초' ? !+r.두께 : false
    if (빔 && !(r._없음 && r._없음.length)) 빈것.push(r.기호)          // 🧭 G405 «❓ 도면에 없음» 으로 이미 알린 줄은 빼고
  }
  /* 🧭 G405 ❓ 도면에 없음 알림 — 셈 줄(주자료)에 실제로 쓰인 기호만(SRC 짝으로 바뀐 «4C1» 처럼 안 쓰인 줄은 뺌) */
  {
    const 쓴 = new Set(Object.values(주).flatMap((a2) => (Array.isArray(a2) ? a2 : []).map((r) => r.기호)))
    const 보기 = [...new Map(채운.filter((x) => 쓴.has(x.기호)).map((x) => [x.기호, x.기호 + ' ' + x.없음.map((w) => w.replace(/\(.*$/, '')).join('·')])).values()]
    if (보기.length) 경고.push('❓ 도면에 없음 ' + 보기.length + '가지(' + 보기.slice(0, 10).join(' · ') + (보기.length > 10 ? ' …' : '') + ') — 일람표 · 평면 범례 · 단면 어디에도 값이 없어 그 물량은 셈에서 뺐습니다(짐작 안 함). 배근표 빈칸에 적으시면 셈합니다')
  }
  if (빈것.length) 경고.push('크기나 철근을 일람표에서 다 찾지 못한 기호 ' + 빈것.length + '개(' + 빈것.slice(0, 8).join(' · ') + (빈것.length > 8 ? ' …' : '') + ') — 그 부재는 철근(또는 물량)이 덜 나옵니다. 일람표 도면도 같이 넣거나 골조 화면 배근표에서 채워 주세요')
  const 모은경고 = []
  const 셈경고 = new Map()
  for (const w of 경고) { const key = w.replace(/ \(\d+번 도면\)$/, ''); if (셈경고.has(key)) 셈경고.set(key, 셈경고.get(key) + 1); else { 셈경고.set(key, 1); 모은경고.push(key) } }
  const 경고들 = 모은경고.map((w) => (셈경고.get(w) > 1 ? w + ' (' + 셈경고.get(w) + '곳)' : w))
  if (SRC짝.size) 경고들.unshift('SRC 기둥으로 읽었습니다 — 평면 ' + [...SRC짝].map(([k, v]) => k + ' ' + v + '곳').join(' · ') + '(그 층은 SRC 기둥 일람표에만 있음 · 철골 무게는 «철골» 줄로 · 콘크리트는 철골 단면을 뺌)')
  if (철골.size) 경고들.unshift('철골 부재 ' + 철골.size + '가지(' + [...철골.values()].slice(0, 4).map((x) => x.기호 + ' ' + x.규격).join(' · ') + (철골.size > 4 ? ' …' : '') + ')는 철근콘크리트 셈에서 뺐습니다 — 철골 무게는 아직 자동으로 안 셉니다')
  /* 🧭 G291 일람표 없음 알림 — 소장님 「우선에 물량을 넣고, 일람표가 없다는 알림을 줘」 (실제 판매시설 구조평면도: 일람표가 없어 부재 52가지를 모두 짐작 —
       벽 두께 1,040 · 보 1,160 × 2,300 · 기둥 2,150 × 2,300 처럼 말이 안 되는 크기로 셈했는데 알림이 묻혀 있었음). 물량은 그대로 넣고 맨 위에 알림 · 흔치 않은 짐작 크기는 따로 */
  const 일람 = (() => {
    const 행들 = Object.entries(P.배근 || {}).flatMap(([종, a]) => (a || []).map((r) => ({ 종, r })))
    const 짐 = 행들.filter((x) => x.r._없음 && x.r._없음.length)
    const 잰 = 행들.filter((x) => /📐/.test(x.r.만든 || ''))
    const n = (v) => +String(v ?? '').replace(/,/g, '') || 0
    const 쉼 = (v) => n(v).toLocaleString('ko-KR')
    const 큰 = []
    for (const { 종, r } of 잰) {
      if (종 === '벽' && n(r.두께) > 600) 큰.push(r.기호 + ' 벽 두께 ' + 쉼(r.두께))
      else if (종 === '보' && (n(r.폭) > 1000 || n(r.춤) > 1500)) 큰.push(r.기호 + ' 보 ' + 쉼(r.폭) + ' × ' + 쉼(r.춤))
      else if (종 === '기둥' && Math.max(n(r.가로), n(r.세로), n(r.지름)) > 1500) 큰.push(r.기호 + ' 기둥 ' + (n(r.지름) ? '⌀' + 쉼(r.지름) : 쉼(r.가로) + ' × ' + 쉼(r.세로)))
      else if (종 === '슬라브' && n(r.두께) > 400) 큰.push(r.기호 + ' 슬래브 두께 ' + 쉼(r.두께))
      else if (종 === '기초' && n(r.두께) > 2500) 큰.push(r.기호 + ' 기초 두께 ' + 쉼(r.두께))
    }
    return { 표있음: 배근있음, 짐작: 짐.length, 전체: 행들.length, 큰 }
  })()
  {
    const 큰글 = 일람.큰.length ? ' · 흔치 않은 잰 크기(꼭 확인): ' + 일람.큰.slice(0, 6).join(' · ') + (일람.큰.length > 6 ? ' 외 ' + (일람.큰.length - 6) + '가지' : '') : ''
    if (셈수 > 0 && !일람.표있음 && 일람.짐작 > 0) 경고들.unshift('📋 넣은 도면에서 부재 일람표(보 · 기둥 · 벽 · 슬래브 · 기초 일람표 · 배근표)를 찾지 못했습니다 — 부재 ' + 일람.짐작 + '가지는 크기 · 두께 · 철근이 도면에 없어(❓) 그 물량을 셈에서 뺐습니다. 평면에서 잰 폭 · 두께 · 그림 크기만 썼습니다. 일람표 도면을 같이 넣어 주세요' + 큰글)
    else if (셈수 > 0 && 일람.짐작 >= Math.max(3, 0.3 * 일람.전체)) 경고들.unshift('📋 일람표에 없는 값이 많습니다 — ' + 일람.전체 + '가지 가운데 ' + 일람.짐작 + '가지는 크기 · 철근 일부가 도면에 없어(❓) 그 물량을 셈에서 뺐습니다. 그 부재의 일람표 도면을 같이 넣거나 배근표에 적어 주세요' + 큰글)
    else if (셈수 > 0 && 일람.큰.length) 경고들.unshift('📋 도면에서 잰 크기 가운데 흔치 않은 것이 있습니다(꼭 확인): ' + 일람.큰.slice(0, 6).join(' · ') + (일람.큰.length > 6 ? ' 외 ' + (일람.큰.length - 6) + '가지' : ''))
  }
  /* 📋 일반구조사항의 정착·이음 길이표 (2026-09-28) — 찾으면 기준값 정착표에 넣음(이 fck 줄만).
     표의 fck 가 하나뿐이면 기준 fck 도 그 값으로. 못 알아본 줄(칸 짐작 없음)은 넣지 않음 */
  let 정착읽음 = null
  const 정착표들 = []
  /* 🧭 G270 일반사항 «D13 이하 SD400 · D16 이상 SD500» — 규격마다 fy(기본식 · 표 고르기에 씀) */
  const 강도글 = []
  for (const D of 도면들) {
    let 찾음 = []
    try { 찾음 = 표찾기(D.모델, D.k) } catch (e) { 찾음 = [] }
    for (const c of 찾음) { 정착표들.push({ ...c, 번: D.번 }); if (!정착읽음 || c.셈 > 정착읽음.셈) 정착읽음 = { ...c, 번: D.번 } }
    const Ts = (D.모델 && D.모델.T && D.모델.T.s) || []
    for (let i = 0; i < Ts.length; i++) { const t = Ts[i]; if (t && t.length < 80 && /이하|이상/.test(t) && /D\s*\d{2}/i.test(t) && /FY|SD\d{3}/i.test(t)) 강도글.push(t) }
  }
  const fy규격 = 강도규격읽기(강도글, +P.기준.fy)
  if (fy규격) P.기준.fy규격 = fy규격
  /* 🧭 G272 콘크리트 강도 글(«fck = 30 MPa» · «* fck=27MPa (기초)») — 기준 fck · 레미콘 규격(«25-24-150» 의 가운데) · 기초만 다르면 기초 칸.
       예전엔 늘 기본값 24 로 셈해 정착 · 이음표의 fck 24 줄을 썼음(현장 B · 현장 A = 30 · 현장 A 기초 27) */
  { const 글들 = []
    for (const D of 도면들) { const Ts = (D.모델 && D.모델.T && D.모델.T.s) || []; for (let i = 0; i < Ts.length; i++) { const t = Ts[i]; if (t && t.length < 60 && /f\s*'?\s*ck/i.test(t)) 글들.push(t) } }
    const 강 = 강도fck읽기(글들)
    const 규fck = (sp, v) => (/^\d+-\d+-\d+$/.test(String(sp || '')) ? String(sp).replace(/^(\d+)-\d+-(\d+)$/, '$1-' + v + '-$2') : sp)
    if (강 && 강.기본 && 강.기본 !== +P.기준.fck) { P.기준.fck = 강.기본; P.기준.콘크리트 = 규fck(P.기준.콘크리트, 강.기본) }
    if (강 && 강.기초 && 강.기초 !== +P.기준.fck) { P.기준.fck부재 = { 기초: 강.기초 }; P.기준.콘크리트부재 = { 기초: 규fck(P.기준.콘크리트, 강.기초) } }
    if (강) P.기준.fck출처 = '도면 글 fck ' + (강.기본 || P.기준.fck) + (강.기초 && 강.기초 !== +P.기준.fck ? ' · 기초 ' + 강.기초 : '') + ' MPa'
    /* 기준 정착표(기본식)도 읽은 fck · 규격마다 fy 로 다시 — 새 공사의 정착표는 fck 24 · fy 400 으로 미리 채워져 있어 그대로면 fck · fy 를 읽어도 안 바뀜(화면에서 fck 를 고칠 때와 같은 규칙) */
    if (강 || fy규격) P.기준.정착 = 정착표규격(+P.기준.fck, +P.기준.fy, P.기준.fy규격 || null) }
  if (정착읽음) {
    const fcks = [...new Set(정착읽음.표.줄.filter((z) => z.칸 && z.그럴듯 !== false && z.fck != null).map((z) => z.fck))]
    if (fcks.length === 1 && fcks[0] !== +P.기준.fck) P.기준.fck = fcks[0]
    /* 부재 칸 · fy 를 읽은 표가 있으면 그런 표들(fy 400 · 500 두 표)을 함께 · 없으면 예전처럼 가장 많이 읽은 표 하나만 */
    const 쓸표 = 정착표들.some((c) => c.표.줄.some((z) => z.부재 || z.fy != null)) ? 정착표들.filter((c) => c.표.줄.some((z) => z.부재 || z.fy != null)) : [정착읽음]
    const 넣 = 정착표넣기(쓸표, P.기준.fck, +P.기준.fy, P.기준.fy규격 || null, 정착표규격(+P.기준.fck, +P.기준.fy, P.기준.fy규격 || null), P.기준.fck부재 || null)
    정착읽음.넣은 = 넣.넣은; 정착읽음.뺀 = 넣.뺀
    if (넣.넣은.length) {
      P.기준.정착 = 넣.정착
      if (넣.정착부재) P.기준.정착부재 = 넣.정착부재
      const 부재들 = [...new Set(넣.넣은.map((x) => x.부재).filter(Boolean))]
      const fy들 = [...new Set(쓸표.flatMap((c) => c.표.줄).map((z) => z.fy).filter((v) => v != null))]
      P.기준.정착출처 = '도면의 정착·이음표' + (정착읽음.제목 ? ' «' + 정착읽음.제목 + '»' : '') + (쓸표.length > 1 ? ' 외 ' + (쓸표.length - 1) + '표' : '') + (fy들.length ? '(fy ' + fy들.join(' · ') + ')' : '') + ' — fck ' + P.기준.fck + ' 줄 · ' + [...new Set(넣.넣은.map((x) => 칸이름[x.칸]))].join('·') +
        (부재들.length ? ' · 부재 칸 ' + 부재들.map((b) => ({ 기초: '기초', 보기둥: '보 · 기둥', 슬래브벽: '슬래브 · 벽' }[b] || b)).join(' / ') : '') +
        (P.기준.fy규격 ? ' · 철근 강도 ' + 강도글요약(P.기준.fy규격, +P.기준.fy) : '') +
        (넣.다른fy && 넣.다른fy.length ? ' · 표에 fy 가 없어 ' + 넣.다른fy.join('·') + ' 는 그 강도의 기본식(표 = fy ' + P.기준.fy + ' 것으로 봄)' : '')
    }
  } else if (P.기준.fy규격) P.기준.정착출처 = 'KDS 기본식 · 철근 강도 ' + 강도글요약(P.기준.fy규격, +P.기준.fy) + '(도면 일반사항 글)'
  /* 🧭 G276 MAT 단차부(두꺼운 구역 둘레) 철근 — 일반사항 «(1) 기초 단차부 배근 · MAT 기초 하부근과 동일직경, 동일간격»(현장 B S-011): 아래 철근이 구역 둘레에서 꺾여 내려가
       구역 바닥까지 이어짐 — 둘레 1 m 마다 1000 ÷ 간격 가닥 × (단차 깊이 + 정착 × 2). 예전엔 두꺼운 구역에 콘크리트만 더하고 철근은 0 */
  {
    let 단차글 = ''
    for (const D of 도면들) { const g = D.글자.find((x) => /단차/.test(x.s) && /기초|MAT|매트/i.test(x.s)); if (g) { 단차글 = g.s.trim(); break } }
    for (const r of P.배근.기초 || []) {
      const z = r._단차
      if (!z) continue
      delete r._단차
      const A = +r.면적
      if (!(A > 0 && z.s > 0 && z.깊이 > 0)) continue
      /* 🧭 G405 짐작 금지 — 일반사항에 기초 단차부 배근 상세가 없으면 단차부 철근을 «흔한 상세» 로 셈하지 않음(«❓ 도면에 없음» · 둘레 · 단차만 적음) */
      if (!단차글) { r.만든 = '건설맵: ❓ 도면에 없음 — 단차부 철근(일반사항에 기초 단차부 배근 상세가 없음 · 구역 둘레 ' + (Math.round(z.둘레 / 10) / 100) + ' m · 단차 ' + z.깊이 + ' mm)'; continue }
      const dk = 'D' + z.d
      const 부 = P.기준.정착부재 && P.기준.정착부재.기초 && P.기준.정착부재.기초[dk]
      const ld = (부 && +부.인장정착) || (P.기준.정착 && P.기준.정착[dk] && +P.기준.정착[dk].인장정착) || 40 * z.d
      const 가닥 = (z.둘레 / 1000) * (1000 / z.s)
      const 길 = 가닥 * (z.깊이 + 2 * ld) / 1000
      r.단위철근 = dk + ':' + Math.round(길 / A * 100) / 100
      r.만든 = '건설맵: 📐 단차부 철근 = 구역 둘레 ' + (Math.round(z.둘레 / 10) / 100) + ' m · ' + dk + '@' + z.s + '(MAT 아래 철근과 같은 지름 · 간격) ' + Math.round(가닥) + '가닥 × (단차 ' + z.깊이 + ' + 정착 ' + ld + ' × 2) = ' + Math.round(길) + ' m' + ' — 일반사항 «' + 단차글 + '»'
    }
  }
  /* 🏔 G299 지붕 높이 구역 — 지붕 평면 «FL 레벨» 범례(견본 무늬 ↔ «1FL +8,400» · «경사 지붕 1»)의 같은 무늬 해치 = 구역(평면 자리 p) ·
       골조입면 · 단면의 경사 지붕 사슬. BIM 모델이 그 층 벽 · 기둥을 지붕까지 올림(현장 4: 2층 벽 · 기둥이 RF 7,600 에서 잘려 경사 지붕 아래 몫이 빠졌음) */
  const 지붕구역 = [], 지붕사슬 = []
  try {
    for (const D of 도면들) {
      const 줄 = 레벨범례(D)
      if (!줄.length) continue
      const 견본 = new Set(줄.map((r) => r.견본))
      const 쓴 = new Set()
      for (const r of 줄) {
        const tL = 제목찾기(D, r.g)
        if (!tL) continue
        for (const h of D.해치) {
          if (견본.has(h) || 쓴.has(h) || h.무늬 !== r.무늬) continue
          const tz = 제목찾기(D, { x: (h.b[0] + h.b[2]) / 2, y: (h.b[1] + h.b[3]) / 2, h: r.g.h })
          if (!tz || tz.이름 !== tL.이름) continue
          쓴.add(h)
          const 고 = h.고리.slice().sort((p, q) => 고리넓이(q) - 고리넓이(p))
          const 섬 = 고.filter((q, k2) => !고.some((o, j) => j < k2 && 고리넓이(o) > 고리넓이(q) && 점안(q[0], o)))
          for (const q of 섬) {
            if (고리넓이(q) < 1e6) continue
            const xs = q.map((p) => p[0]), ys = q.map((p) => p[1])
            const mx = (Math.min(...xs) + Math.max(...xs)) / 2, my = (Math.min(...ys) + Math.max(...ys)) / 2
            const lp = D.도곽 && D.도곽.length ? D.도곽번(mx, my) : -1
            지붕구역.push({ p: D.번 + '|' + tz.판 + '|' + tz.이름 + '|' + lp, 판: q.map((p) => [반올림(p[0] / D.k, 1), 반올림(p[1] / D.k, 1)]), ...(r.경사 ? { 경사: true } : { 높이: r.높이 }), 이름: String(r.g.s).trim() })
          }
        }
      }
    }
    for (const D of 도면들) for (const s2 of 입면경사(D)) 지붕사슬.push({ ...s2, 번: D.번 })
  } catch (e) { /* 범례 · 입면이 없으면 그대로 */ }
  return {
    공사: P, 경고: 경고들, 근거, 있음: 셈수 > 0, 정착표: 정착읽음, 정착표들: 정착표들.filter((c) => c.표.줄.some((z) => z.부재 || z.fy != null)).length ? 정착표들.filter((c) => c.표.줄.some((z) => z.부재 || z.fy != null)) : (정착읽음 ? [정착읽음] : []),
    읽음: {
      배근: Object.fromEntries(Object.entries(P.배근).map(([k2, v]) => [k2, v])),
      평면: 평면목록, 높이: Object.fromEntries(높이), 층고짐작: 짐작층,
      지붕구역, 지붕사슬,             // 🏔 G299
      일람,                      // 🧭 G291 {표있음, 짐작, 전체, 큰:[글]} — 화면 알림 띠
      /* 🧭 G246 판 펼치기 — 파일마다 판(쪽) 목록: 번호 · 도면명 · 테두리 · 글자 수(화면 «판 목록») */
      판: 도면들.map((D) => ({ 파일: D.이름, 번: D.번, k: D.k, 판: 판목록(D).map((x) => { const 안 = 제목들.filter((t) => t.D === D && t.판 === x.p); return { ...x, 쓰임: 쓰임표.get(D.번 + '|' + x.p) || null, 층: [...new Set(안.flatMap((t) => t.f))], ...(안.some((t) => t.고름) ? { 고른층: 안.find((t) => t.고름).고름 } : {}) } }), 배치판: (() => { try { return 배치판목록(D.모델) } catch (e) { return [] } })(), 덜읽음: !!(D.모델 && D.모델.stats && D.모델.stats.capped) })),
      철골: [...철골.values()].map((x) => ({ 기호: x.기호, 종류: x.종류, 규격: x.규격, 수: 철골수.get(x.기호) || 0, ...(x.동 ? { 동: x.동 } : {}) })),
      셈: { 보: 주.보.length, 기둥: 주.기둥.length, 슬라브: 주.슬라브.length, 벽: 주.옹벽.length, 기초: 주.기초.length, 계단: 주.계단.length },
      개수: Object.fromEntries([['보', 주.보], ['기둥', 주.기둥], ['슬라브', 주.슬라브], ['벽', 주.옹벽], ['기초', 주.기초], ['계단', 주.계단]].map(([k, a2]) => [k, a2.reduce((t2, r) => t2 + (+r.QT || 1), 0)])),
    },
  }
}

/** 🧭 G252 이름 붙은 벽의 꺾인 데 잇기 — 벽띠에 가짜 이름표(그 벽 이름 · «_모서리»)를 더함. 토막 · 이름 주기는 토막들(…)이 함 */
function 모서리벽(벽띠, 기둥층) {
  const 이름띠 = 벽띠.filter((x) => !x.r._미표기 && !x.r._모서리 && x.띠 && x.띠.g > 0)
  if (!이름띠.length) return
  const 같은줄 = (D, b) => 벽띠.some((x) => x.D === D && Math.abs(x.띠.ux * b.uy - x.띠.uy * b.ux) < 0.01 && Math.abs((b.px - x.띠.px) * x.띠.nx + (b.py - x.띠.py) * x.띠.ny) <= 20 && Math.abs(x.띠.g - b.g) <= 10 &&
    (() => { const t = (x.g.x - b.px) * b.ux + (x.g.y - b.py) * b.uy; return t >= b.t0 - b.g && t <= b.t1 + b.g })())
  const 본 = new Set()
  const 줄 = []                                   // [D, r, 띠, 끝점들]
  for (const x of 이름띠) {
    const 기층 = new Set([...기둥층].filter((k2) => k2.startsWith(x.D.번 + ':')).map((k2) => +k2.split(':')[1]))
    const tg = (x.g.x - x.띠.px) * x.띠.ux + (x.g.y - x.띠.py) * x.띠.uy
    const P = 띠토막(x.D, x.띠, 기층.size ? 기층 : null, tg - 20000, tg + 20000)
    const 가까 = P.filter((p) => (tg < p.t0 ? p.t0 - tg : tg > p.t1 ? tg - p.t1 : 0) <= 10000)
    const 끝 = []
    for (const p of 가까) for (const t of [p.t0, p.t1]) 끝.push([x.띠.px + x.띠.ux * t, x.띠.py + x.띠.uy * t])
    줄.push([x.D, x.r, x.띠, 끝, 0])
  }
  for (let k = 0; k < 줄.length; k++) {
    const [D, r, 띠0, 끝, 깊이] = 줄[k]
    if (깊이 >= 12) continue
    const g = 띠0.g, R = g + 1200
    for (const [ex, ey] of 끝) {
      const 선 = [], 면끝 = []
      for (const s2 of D.찾기(ex - R - 3000, ey - R - 3000, ex + R + 3000, ey + R + 3000)) {
        if (!띠0.층들.has(D.sly[s2])) continue
        const x0 = D.sx0[s2], y0 = D.sy0[s2], x1 = D.sx1[s2], y1 = D.sy1[s2]
        const L = Math.hypot(x1 - x0, y1 - y0)
        if (L < 300) continue
        const ux = (x1 - x0) / L, uy = (y1 - y0) / L
        if (Math.abs(ux * 띠0.uy - uy * 띠0.ux) < 0.05) {
          /* 원래 벽의 면 선(축에서 ±두께/2) — 그 끝점(꺾인 데에서 이어지는 면과 만나는 점) */
          const o = ((x0 + x1) / 2 - 띠0.px) * 띠0.nx + ((y0 + y1) / 2 - 띠0.py) * 띠0.ny
          if (Math.abs(ux * 띠0.uy - uy * 띠0.ux) < 0.02 && Math.abs(Math.abs(o) - g / 2) <= 3) 면끝.push([x0, y0], [x1, y1])
          continue                                                    // 원래 벽과 나란한 선은 아님(꺾인 것만)
        }
        let a = Math.atan2(uy, ux); if (a < 0) a += Math.PI; if (a >= Math.PI - 0.002) a -= Math.PI
        const cu = Math.cos(a), su = Math.sin(a)
        const ta = x0 * cu + y0 * su, tb = x1 * cu + y1 * su
        선.push({ a, o: -x0 * su + y0 * cu, t0: Math.min(ta, tb), t1: Math.max(ta, tb), cu, su, 끝: [[x0, y0], [x1, y1]] })
      }
      /* 꺾인 데 = 원래 벽 면 선의 끝과 이어 갈 벽 면 선의 끝이 맞닿음(10 mm 안) — 기둥을 건너거나 T 자로 붙은 벽(칸막이)으로는 안 번짐 */
      const 닿음 = (l) => l.끝.some(([x, y]) => 면끝.some(([fx, fy]) => Math.hypot(x - fx, y - fy) <= 10))
      for (let i = 0; i < 선.length; i++) for (let j = 0; j < 선.length; j++) {
        const p = 선[i], q = 선[j]
        if (i === j || Math.abs(q.a - p.a) > 0.004 || q.o <= p.o) continue
        const gap = q.o - p.o
        if (Math.abs(gap - g) > Math.max(3, g * 0.03)) continue
        const t0 = Math.max(p.t0, q.t0), t1 = Math.min(p.t1, q.t1)
        if (t1 - t0 < 300) continue
        if (!닿음(p) && !닿음(q)) continue
        if (선.some((r2) => r2 !== p && r2 !== q && Math.abs(r2.a - p.a) < 0.004 && r2.o > p.o + 5 && r2.o < q.o - 5 && Math.min(r2.t1, t1) - Math.max(r2.t0, t0) > 100)) continue
        const ux = p.cu, uy = p.su, nx = -uy, ny = ux, oc = (p.o + q.o) / 2
        /* 띠의 한 끝이 원래 벽 끝 곁(두께 + 1.2 m 안) */
        const 끝들 = [t0, t1].map((t) => [ux * t + nx * oc, uy * t + ny * oc])
        if (!끝들.some(([x, y]) => Math.hypot(x - ex, y - ey) <= R)) continue
        const tc = (t0 + t1) / 2
        const b = { ux, uy, nx, ny, px: ux * tc + nx * oc, py: uy * tc + ny * oc, g: 띠0.g, 점수: 0, 층들: 띠0.층들, 다른폭: false, t0: t0 - tc, t1: t1 - tc }
        const 열쇠 = D.번 + '|' + Math.round(p.a * 1000) + '|' + Math.round(oc / 20) + '|' + Math.round(tc / 200)
        if (본.has(열쇠) || 같은줄(D, b)) continue
        본.add(열쇠)
        벽띠.push({ D, g: { x: b.px, y: b.py, h: 0, w: 0, a: Math.atan2(uy, ux), i: -1, s: r.기호 }, r: { ...r, _모서리: true }, 띠: b })
        줄.push([D, r, b, 끝들, 깊이 + 1])
      }
    }
  }
}

/** 한 평면·한 층의 보·벽 토막과 슬래브 칸 */
function 평면부재(보띠, 벽띠, 슬들, 기둥층, 보층, 벽층, 배근행, 경고, 근거) {
  const 빼앗김 = []
  const 토막들 = (띠들, 종) => {
    const 묶음 = new Map()
    for (const x of 띠들) {
      const { 띠, D } = x
      const 각 = Math.round(((Math.atan2(띠.uy, 띠.ux) + Math.PI) % Math.PI) * 1000)
      /* 🐞 G225 (2026-10-10) 같은 띠(한 줄의 보)를 «5 mm 칸» 으로 묶었더니, 띠 자리가 칸 경계(…2.5 mm)에 걸리면 기호마다 다른 칸이 되어
       *   같은 보가 두 번 셈해졌음(가상 3층 · 지붕 평면을 다른 자리에 그린 도면 — 작은보 RB1 2칸 더). → 같은 각 · 폭에서 «20 mm 안» 이면 같은 띠. */
      /* 🧭 G412 띠 방향(이름표 쪽에 따라 ux = +1 · −1)이 반대면 법선도 반대라 자리mm 부호가 뒤집혀 같은 띠가 두 묶음이 됐음 —
           같은 토막을 두 이름표가 따로 가져 두 번 셈(현장 Y 3층 G12 · G16 · CG1 · G11 · G14 · G13 · 1층 바닥 WG1 · G12 · G13 · 2층 G4 · G15 — 보 약 15 ㎥). 방향을 한쪽으로 맞춰 셈 */
      const 쪽 = 종 !== '보' || 띠.ux > 1e-9 || (Math.abs(띠.ux) <= 1e-9 && 띠.uy > 0) ? 1 : -1      // 벽은 예전대로(벽 이름 · 미표기 · 바탕 띠는 따로 맞춤 — 다음에 도면으로 하나씩)
      const 자리mm = 쪽 * (띠.px * 띠.nx + 띠.py * 띠.ny)
      let 열쇠 = null
      for (const [k0, v0] of 묶음) if (v0.번 === D.번 && Math.min(Math.abs(v0.각 - 각), 3142 - Math.abs(v0.각 - 각)) <= 2 && Math.abs(v0.자리mm - 자리mm) <= 20 && Math.abs(v0.띠.g - 띠.g) <= 10) { 열쇠 = k0; break }
      if (열쇠 === null) 열쇠 = D.번 + '|' + 각 + '|' + Math.round(자리mm) + '|' + Math.round(띠.g)
      let m2 = 묶음.get(열쇠)
      if (!m2) {
        const 기층 = new Set([...기둥층].filter((k2) => k2.startsWith(D.번 + ':')).map((k2) => +k2.split(':')[1]))
        m2 = { 띠, D, 번: D.번, 각, 자리mm, 기층: 기층.size ? 기층 : null, 토막: null, 이름표: [] }
        묶음.set(열쇠, m2)
      }
      const t = (x.g.x - m2.띠.px) * m2.띠.ux + (x.g.y - m2.띠.py) * m2.띠.uy
      m2.이름표.push({ t, r: x.r, g: x.g, x })
    }
    const 칸들 = []
    for (const m2 of 묶음.values()) {
      const ts = m2.이름표.map((n) => n.t)
      m2.토막 = 띠토막(m2.D, m2.띠, m2.기층, Math.min(-60000, Math.min(...ts) - 20000), Math.max(60000, Math.max(...ts) + 20000))
      const P = m2.토막
      /* 🧭 G258 꺾인 데 잇기(G252)로 지어 붙인 이름표뿐인 띠는 알림 안 함(도면에 적힌 이름표가 아님) */
      if (!P.length) { if (!m2.이름표.every((n) => n.r._모서리)) 경고.push(종 + ' «' + m2.이름표[0].r.기호 + '» 의 두 선 구간을 못 잡았습니다'); continue }
      const 주인 = new Array(P.length).fill(null)
      /* 🧭 G412 이름표마다 가장 가까운 토막 — 한 토막을 여럿이 가리키면 더 가까운 이름표(토막 안에 든 것)가 가짐(전엔 먼저 읽은 이름표 — 현장 Y 5층 B12 세로 보를 G11 이 가졌음) */
      const 짝들 = []
      for (const n2 of m2.이름표) {
        let bi = -1, bd = Infinity
        P.forEach((p, i) => { const d = n2.t < p.t0 ? p.t0 - n2.t : n2.t > p.t1 ? n2.t - p.t1 : 0; if (d < bd) { bd = d; bi = i } })
        if (bi >= 0 && bd < 1500) 짝들.push({ n2, bi, bd })
      }
      if (종 === '보') 짝들.sort((p, q) => p.bd - q.bd)
      for (const { n2, bi } of 짝들) if (!주인[bi]) 주인[bi] = n2
      /* 밀린 이름표(다른 이름 · 같은 이름표가 이 띠에 따로 없음) — 알림만(짐작으로 다른 자리로 옮기지 않음) */
      if (종 === '보') for (const { n2, bi } of 짝들) if (주인[bi] !== n2 && 주인[bi] && (주인[bi].r.몸 || 주인[bi].r.기호) !== (n2.r.몸 || n2.r.기호) && !m2.이름표.some((k) => k !== n2 && k.r.기호 === n2.r.기호 && 주인.includes(k))) 빼앗김.push({ 기호: n2.r.기호, 임자: 주인[bi].r.기호, 번: m2.D.번, x: n2.x })
      const 이어짐 = (i) => P[i].오 && P[i + 1] && P[i + 1].왼 === P[i].오
      for (let pass = 0; pass < P.length; pass++) {
        let 바뀜 = false
        for (let i = 0; i < P.length; i++) {
          if (주인[i]) continue
          if (i > 0 && 주인[i - 1] && 이어짐(i - 1)) { 주인[i] = { ...주인[i - 1], 물림: true }; 바뀜 = true }
          else if (i < P.length - 1 && 주인[i + 1] && 이어짐(i)) { 주인[i] = { ...주인[i + 1], 물림: true }; 바뀜 = true }
        }
        if (!바뀜) break
      }
      /* 🧭 G252 이름 붙은 벽(BW1 …)의 같은 줄 · 같은 두께 토막인데 받침으로 이어지지 않은 것(개구부 · 꺾인 자리로 끊김 — 현장 A 지하 바깥벽 BW1 네 토막)은
           가장 가까운 이름 토막의 이름(10 m 안) — 벽만 · 이름 없는(미표기) 벽 줄은 아님 */
      if (종 === '벽') {
        const 임자 = P.map((_, i) => i).filter((i) => 주인[i] && !주인[i].r._미표기 && !주인[i].물림)
        if (임자.length) for (let i = 0; i < P.length; i++) {
          if (주인[i]) continue
          let bi = -1, bd = Infinity
          for (const k of 임자) { const d = P[i].t1 < P[k].t0 ? P[k].t0 - P[i].t1 : P[k].t1 < P[i].t0 ? P[i].t0 - P[k].t1 : 0; if (d < bd) { bd = d; bi = k } }
          if (bi >= 0 && bd <= 10000) 주인[i] = { ...주인[bi], 물림: true, 같은줄: true }
        }
      }
      let 열 = []
      const 열들 = []
      for (let i = 0; i < P.length; i++) {
        if (!주인[i]) { if (열.length) 열들.push(열); 열 = []; continue }
        if (열.length && !(이어짐(i - 1) && 주인[i - 1] && 주인[i - 1].r.기호 === 주인[i].r.기호)) { 열들.push(열); 열 = [] }
        열.push(i)
      }
      if (열.length) 열들.push(열)
      for (const 열i of 열들) {
        const 줄 = 열i.map((i) => {
          const p = P[i]
          const 좌 = p.왼 ? p.왼[2] : 0, 우 = p.오 ? p.오[2] : 0
          const 안목 = p.t1 - p.t0
          const { D, 띠 } = m2
          const a = [띠.px + 띠.ux * p.t0, 띠.py + 띠.uy * p.t0], b = [띠.px + 띠.ux * p.t1, 띠.py + 띠.uy * p.t1]
          const k = D.k
          const 상자 = [(Math.min(a[0], b[0]) - 띠.g / 2 * Math.abs(띠.nx)) / k, (Math.min(a[1], b[1]) - 띠.g / 2 * Math.abs(띠.ny)) / k, (Math.max(a[0], b[0]) + 띠.g / 2 * Math.abs(띠.nx)) / k, (Math.max(a[1], b[1]) + 띠.g / 2 * Math.abs(띠.ny)) / k]
          근거.push({ 번: D.번, 상자, 글: 주인[i].r.기호 + ' 안목 ' + Math.round(안목) })
          /* 🏗 G225 BIM 물량 — 3D 로 세울 «축»(두 끝 · 폭, 도면 단위) 도 같이 남김 (비스듬한 보 · 벽도 제 방향으로) */
          const 자리 = { ...자리만들기(D.이름, 상자), 축: [a[0] / k, a[1] / k, b[0] / k, b[1] / k, 띠.g / k].map((v) => 반올림(v, 1)) }
          /* 🧭 G251 벽 이름 잇기용 — 미표기(이름 없는 두 선) · 몸 · 축(mm) · 판 */
          const 판 = D.도곽 && D.도곽.length ? D.도곽번((a[0] + b[0]) / 2, (a[1] + b[1]) / 2) : -1
          return { 기호: 주인[i].r.기호, 안목: Math.round(안목), 좌: Math.round(좌), 우: Math.round(우), 물림: !!주인[i].물림, 자리, _미표기: !!주인[i].r._미표기, _모서리: !!주인[i].r._모서리, _같은줄: !!주인[i].같은줄, _바탕: !!주인[i].r._바탕, _다시: !!(주인[i].x && 주인[i].x._다시), _범례밖: !!주인[i].r._범례밖, _한면: !!주인[i].r._한면, _몸: 주인[i].r.몸, _축: [a[0], a[1], b[0], b[1], 띠.g], _판: D.번 + '|' + 판 }
        })
        칸들.push(줄)
      }
    }
    return 칸들
  }
  const 근거0 = 근거.length, 경고0 = 경고.length
  let 보칸 = 토막들(보띠, '보')
  /* 🧭 G413 밀린 이름표(제 띠를 더 가까운 다른 이름표가 가진 것) — 그 띠와 다른 이름표들이 고른 띠를 빼고 구조 도면 제 선으로 다시 찾음
       (띠찾기 빼기: «$0$» 건축 바탕 선 안 봄 · 두 면 사이 다른 선 없음 · 두 면 1.5 m 넘게 같이 감). 받는 것: 일람 폭과 같은 두 선(±3 %) ·
       또는 조금 좁게(0.75 배 이상) 그린 두 선이 한 층 — 넓은 띠 · 섞인 층(보 면 + 벽 표시 선)은 안 받음 · 글자에서 1.5 m 안.
       찾은 띠로 다시 나눠 봄 — 거기서도 더 가까운 이름표가 있으면 또 밀림(❓ 알림 그대로).
       현장 Y 3층 G12: 가로 띠(G16 몫) → 기둥 곁 세로 큰보(구조 GIRDER 400 · 8.5 m) · 3층 G13 오른쪽 끝 세로 큰보 7.5 m · 1 · 2층 CG1 남쪽 끝 1.6 m */
  const 다시찾음 = []
  if (빼앗김.length) {
    const 새띠 = new Map()
    for (const v of 빼앗김) {
      const x = v.x
      if (!x || 새띠.has(x)) continue
      const b = 배근행.보.get(x.r.기호) || {}
      const 폭 = +b.폭 || 0
      const 남띠 = 보띠.filter((y) => y.D === x.D && (y.r.몸 || y.r.기호) !== (x.r.몸 || x.r.기호)).map((y) => y.띠)
      const 띠2 = 띠찾기(x.D, x.g, 폭, 1500, [x.띠, ...남띠])
      const 나2 = 띠2 ? Math.abs((x.g.x - 띠2.px) * 띠2.nx + (x.g.y - 띠2.py) * 띠2.ny) : Infinity
      const 맞폭 = 띠2 && 폭 > 0 && (Math.abs(띠2.g - 폭) <= Math.max(3, 0.03 * 폭) || (띠2.g >= 0.75 * 폭 && 띠2.g < 폭 && 띠2.층들.size === 1))
      if (띠2 && 맞폭 && 나2 <= 1500) 새띠.set(x, 띠2)
    }
    if (새띠.size) {
      근거.length = 근거0; 경고.length = 경고0; 빼앗김.length = 0
      const 보띠2 = 보띠.map((x) => (새띠.has(x) ? { ...x, 띠: 새띠.get(x), _다시: true } : x))
      보칸 = 토막들(보띠2, '보')
      for (const 줄 of 보칸) for (const t of 줄) if (t._다시) 다시찾음.push(t)
    }
  }
  /* 🧭 G412 한 토막을 두 이름(몸)이 가리키면 더 가까운 이름표 몫으로 한 번만 — 밀린 이름표는 ❓ 알림(제 자리를 도면에서 확인 · 짐작으로 옮기지 않음) */
  if (빼앗김.length) {
    const 셈 = new Map()
    for (const v of 빼앗김) { const k = v.기호 + ' → ' + v.임자 + ' 띠(' + v.번 + '번 도면)'; 셈.set(k, (셈.get(k) || 0) + 1) }
    경고.push('❓ 보 이름표가 다른 이름표와 같은 띠를 가리킴 — 그 토막은 더 가까운 이름표 몫으로 한 번만 셈 · 밀린 이름표의 제 자리는 도면에서 확인: ' + [...셈].map(([k, n]) => k + (n > 1 ? ' ×' + n : '')).join(' · '))
    빼앗김.length = 0
  }
  if (다시찾음.length) {
    const 셈 = new Map()
    for (const t of 다시찾음) { const k = t.기호 + '(' + String(t._판).split('|')[0] + '번 도면)'; 셈.set(k, (셈.get(k) || 0) + t.안목) }
    경고.push('📐 다른 이름표 띠를 가리키던 보 이름표 — 그 띠를 빼고 곁의 구조 선 두 줄(제 띠)로 다시 찾아 셈: ' + [...셈].map(([k, L]) => k + ' ' + (L / 1000).toFixed(1) + ' m').join(' · ') + ' — 3D 에서 자리를 한 번 보아 주세요')
  }
  /* 🧭 G252 이름 붙은 벽의 꺾인 데 잇기 — 이름 붙은 벽(지하 바깥벽 BW1 …) 토막 끝에서 같은 층 · 같은 두께로 꺾여 이어지는 이름 없는 두 선(대각 · 직각)은
       그 벽 이름(현장 A 지하 바깥벽 BW1 의 대각 17.6 m 가 이름표가 없어 빠졌음). 이미 다른 벽 기호가 있는 줄은 건드리지 않음 · 열두 번까지 이어 감 */
  모서리벽(벽띠, 기둥층)
  const 벽칸 = 토막들(벽띠, '벽')
  /* 🧭 G252 꺾인 데 · 같은 줄로 이어 붙인 벽 토막이 이 평면의 다른 벽 토막(이름표 · 미표기 · 먼저 이은 것)과 같은 자리(나란 · 두께가 겹침 · 이은 토막 길이의 반 넘게 겹침)면 뺌
       — 두께가 다른 이름(RW1 300 · W1 200)이 한 면 선을 같이 쓰는 데서 같은 벽을 두 번 이었음(현장 B 옥탑) */
  {
    const 진 = (t) => !t._모서리 && !t._같은줄
    const 겹 = (a, b) => {
      const [ax, ay, bx, by, ga] = a._축, [cx, cy, dx, dy, gb] = b._축
      const La = Math.hypot(bx - ax, by - ay), Lb = Math.hypot(dx - cx, dy - cy)
      if (!(La > 0) || !(Lb > 0)) return false
      const ux = (bx - ax) / La, uy = (by - ay) / La, vx = (dx - cx) / Lb, vy = (dy - cy) / Lb
      if (Math.abs(ux * vy - uy * vx) > 0.02) return false
      const mx = (ax + bx) / 2, my = (ay + by) / 2
      if (Math.abs((mx - cx) * vy - (my - cy) * vx) >= (ga + gb) / 2 - 5) return false
      const t0 = (ax - cx) * vx + (ay - cy) * vy, t1 = (bx - cx) * vx + (by - cy) * vy
      return Math.min(Math.max(t0, t1), Lb) - Math.max(Math.min(t0, t1), 0) >= 0.5 * La      // 이어 붙인 토막(a)의 반 넘게가 덮일 때만
    }
    const 모두 = []
    for (const 줄 of 벽칸) for (const t of 줄) if (t._축) 모두.push(t)
    const 남 = 모두.filter(진), 뺄 = new Set()
    for (const t of 모두) { if (진(t)) continue; if (남.some((k) => 겹(t, k))) 뺄.add(t); else 남.push(t) }
    if (뺄.size) {
      for (const 줄 of 벽칸) for (let i = 줄.length - 1; i >= 0; i--) if (뺄.has(줄[i])) 줄.splice(i, 1)
      for (let i = 벽칸.length - 1; i >= 0; i--) if (!벽칸[i].length) 벽칸.splice(i, 1)
    }
  }
  const 구조층 = new Map()
  for (const k2 of [...보층, ...벽층, ...기둥층]) { const [d, l] = k2.split(':'); let s = 구조층.get(+d); if (!s) { s = new Set(); 구조층.set(+d, s) } s.add(+l) }
  const 보벽층 = new Map()
  for (const k2 of [...보층, ...벽층]) { const [d, l] = k2.split(':'); let s = 보벽층.get(+d); if (!s) { s = new Set(); 보벽층.set(+d, s) } s.add(+l) }
  const 폭들 = [...new Set([...배근행.보.values()].map((b) => +b.폭).concat([...배근행.벽.values()].map((w) => +w.두께)).filter((v) => v > 0))]
  /* 🧭 G252 이름으로 잡은 비스듬한 보 · 벽 띠(도면마다) — 슬래브 칸 받침으로 */
  const 빗띠들 = new Map()
  for (const 줄 of [...보칸, ...벽칸]) for (const t of 줄) {
    const z = t._축
    if (!z) continue
    const ex = z[2] - z[0], ey = z[3] - z[1], L = Math.hypot(ex, ey)
    if (!(L > 500) || Math.min(Math.abs(ex), Math.abs(ey)) / L < 0.05) continue
    const 번 = +String(t._판 || '').split('|')[0]
    let a = 빗띠들.get(번); if (!a) { a = []; 빗띠들.set(번, a) }
    a.push({ a: [z[0], z[1]], b: [z[2], z[3]], w: z[4] })
  }
  const 슬칸 = []
  const 판본 = new Set()
  const 잰들 = []
  const 띠속슬 = []
  for (const x of 슬들) {
    /* 🧭 G248 높이 글 씨(바닥 일반 단면 두께)는 이미 잡은 칸 안이면 건너뜀 · 둘레를 못 찾으면 조용히 뺌(평면 밖 높이 글 · 보 위 높이 글) */
    if (x.씨 && 잰들.some((a) => a.x.D === x.D && x.g.x > a.x0 && x.g.x < a.x1 && x.g.y > a.y0 && x.g.y < a.y1)) continue
    const 잰 = 슬래브재기(x.D, x.g, 구조층.get(x.D.번) || null, 폭들, 20000, 빗띠들.get(x.D.번) || null, 보벽층.get(x.D.번) || null)
    if (잰.some((v) => !v) && globalThis.__못찾음 && !x.씨) globalThis.__못찾음.push({ 종: '슬라브', 기호: x.r.기호, x: x.g.x, y: x.g.y, h: x.g.h, 번: x.D.번, 잰: 잰.map((v) => (v ? Math.round(v.d) : null)) })
    if (잰.some((v) => !v)) { if (!x.씨) 경고.push('슬래브 «' + x.r.기호 + '» 둘레의 보·벽을 네 방향 모두에서 찾지 못했습니다'); continue }
    const [오, 왼, 위, 아래] = 잰
    if (x.씨 && Math.min(오.d + 왼.d, 위.d + 아래.d) < 1000) continue      // 벽 두 줄 사이 같은 좁은 틈은 슬래브 칸이 아님
    /* 🧭 G414 슬래브 글자가 보 · 벽 띠 안(두 면 사이)에 걸쳐 적힌 것 — 띠 속 좁은 틈(폭 450 미만)을 슬래브로 셌음(현장 Y 지상4층 S1A: LB2 세로 띠 200 안 글자 →
         2.7 m × 0.2 조각만 · 그 칸 16 ㎡ 빠짐). 띠 양쪽으로 한 발 나가 다시 잼 — 그 칸에 다른 슬래브 글자가 없고 1 m 넘는 칸만 이 글자 몫 */
    if (!x.씨 && Math.min(오.d + 왼.d, 위.d + 아래.d) < 450) {
      const 가로좁음 = 오.d + 왼.d <= 위.d + 아래.d
      const 씨점 = 가로좁음 ? [[x.g.x + 오.d + 150, x.g.y], [x.g.x - 왼.d - 150, x.g.y]] : [[x.g.x, x.g.y + 위.d + 150], [x.g.x, x.g.y - 아래.d - 150]]
      /* 양쪽이 한 칸일 때만(띠가 그 칸 안에서 끝남 — 띠를 따라가며 재 보다 좁지 않은 곳이 나옴 · 현장 Y LB2 세로 띠는 55,625 에서 끝남).
         띠가 칸 끝까지 가는 보면 양쪽은 다른 칸 — 글자가 어느 쪽 것인지 도면만으로 갈리지 않아 예전대로 둠(현장 B DS1: 지시선이 오른쪽) */
      let 끝남 = false
      for (let k = -40; k <= 40 && !끝남; k++) {
        if (!k) continue
        const g3 = 가로좁음 ? { ...x.g, y: x.g.y + k * 250 } : { ...x.g, x: x.g.x + k * 250 }
        if (가로좁음 ? (g3.y > x.g.y + 위.d - 50 || g3.y < x.g.y - 아래.d + 50) : (g3.x > x.g.x + 오.d - 50 || g3.x < x.g.x - 왼.d + 50)) continue
        const 잰3 = 슬래브재기(x.D, g3, 구조층.get(x.D.번) || null, 폭들, 20000, 빗띠들.get(x.D.번) || null, 보벽층.get(x.D.번) || null)
        if (잰3.some((v) => !v)) continue
        if ((가로좁음 ? 잰3[0].d + 잰3[1].d : 잰3[2].d + 잰3[3].d) >= 1000) 끝남 = true
      }
      let 옮김 = 0
      if (끝남) for (const [px, py] of 씨점) {
        const g2 = { ...x.g, x: px, y: py }
        const 잰2 = 슬래브재기(x.D, g2, 구조층.get(x.D.번) || null, 폭들, 20000, 빗띠들.get(x.D.번) || null, 보벽층.get(x.D.번) || null)
        if (잰2.some((v) => !v)) continue
        const [o2, w2, u2, d2] = 잰2
        const c = { x0: px - w2.d, x1: px + o2.d, y0: py - d2.d, y1: py + u2.d }
        if (Math.min(c.x1 - c.x0, c.y1 - c.y0) < 1000) continue
        if (슬들.some((y) => y !== x && y.D === x.D && !y.씨 && y.g.x > c.x0 && y.g.x < c.x1 && y.g.y > c.y0 && y.g.y < c.y1)) continue      // 그 칸에 제 글자가 따로 있으면 그 글자 몫
        const key2 = x.D.번 + '|' + Math.round(px + (o2.d - w2.d) / 2) + '|' + Math.round(py + (u2.d - d2.d) / 2)
        if (판본.has(key2)) continue
        판본.add(key2)
        잰들.push({ x: { ...x, g: g2, _띠속: true }, 오: o2, 왼: w2, 위: u2, 아래: d2, ...c })
        옮김++
      }
      if (옮김) { 띠속슬.push(x.r.기호 + '(' + x.D.번 + '번 도면) ' + 옮김 + '칸'); continue }
    }
    const key = x.D.번 + '|' + Math.round(x.g.x + (오.d - 왼.d) / 2) + '|' + Math.round(x.g.y + (위.d - 아래.d) / 2)
    if (판본.has(key)) continue
    판본.add(key)
    잰들.push({ x, 오, 왼, 위, 아래, x0: x.g.x - 왼.d, x1: x.g.x + 오.d, y0: x.g.y - 아래.d, y1: x.g.y + 위.d })
  }
  /* 🧭 G248 높이 글이 없는 칸 채우기 — 바닥 일반 단면으로 잡은 바닥 슬래브(씨 칸) 사이에 비어 있는 칸(둘레 보 · 벽으로 닫힌 칸)도 같은 바닥.
       씨 칸들을 품는 네모 안을 0.5 m 마다 찍어, 아직 칸이 아닌 점에서 둘레 보 · 벽을 네 방향 다 찾았고 이미 잡은 바닥 칸과 한 변을 맞대면
       그 칸도 바닥 슬래브(맞댄 칸의 두께 · 높이). 바깥(둘레 보 밖)은 한쪽 선을 못 찾아 빠지고, 벽 두 줄 사이 · 기둥 속은 1 m 미만이라 빠짐 */
  for (const D of new Set(잰들.filter((a) => a.x.씨).map((a) => a.x.D))) {
    const 씨칸 = 잰들.filter((a) => a.x.D === D && a.x.씨)
    const bx0 = Math.min(...씨칸.map((a) => a.x0)), bx1 = Math.max(...씨칸.map((a) => a.x1)), by0 = Math.min(...씨칸.map((a) => a.y0)), by1 = Math.max(...씨칸.map((a) => a.y1))
    const 안 = (px, py) => 잰들.some((a) => a.x.D === D && px > a.x0 && px < a.x1 && py > a.y0 && py < a.y1)
    const 바닥칸 = (a) => a.x.D === D && (a.x.씨 || /^T\d/.test(a.x.r.기호))
    const 맞댐 = (c) => 잰들.find((a) => 바닥칸(a) && (
      ((Math.abs(a.x1 - c.x0) < 800 || Math.abs(a.x0 - c.x1) < 800) && Math.min(a.y1, c.y1) - Math.max(a.y0, c.y0) > 300) ||
      ((Math.abs(a.y1 - c.y0) < 800 || Math.abs(a.y0 - c.y1) < 800) && Math.min(a.x1, c.x1) - Math.max(a.x0, c.x0) > 300)))
    const 걸음 = 500
    for (let n = 0, 더 = true; 더 && n < 4; n++) {
      더 = false
      for (let py = by0 + 걸음 / 2; py < by1; py += 걸음) for (let px = bx0 + 걸음 / 2; px < bx1; px += 걸음) {
        if (안(px, py)) continue
        const g = { x: px, y: py, h: 0 }
        const 잰 = 슬래브재기(D, g, 구조층.get(D.번) || null, 폭들, Math.max(bx1 - bx0, by1 - by0))
        if (잰.some((v) => !v)) continue
        const c = { x0: px - 잰[1].d, x1: px + 잰[0].d, y0: py - 잰[3].d, y1: py + 잰[2].d }
        if (Math.min(c.x1 - c.x0, c.y1 - c.y0) < 1000 || c.x0 < bx0 - 100 || c.x1 > bx1 + 100 || c.y0 < by0 - 100 || c.y1 > by1 + 100) continue
        /* 옆 칸과 보 폭(0.8 m 안)만큼 겹치면 그 변을 옆 칸 변에 맞춤(양쪽에서 잰 보 가운데가 조금 다를 수 있음) · 더 겹치면 버림 */
        let 버 = false
        for (const a of 잰들) {
          if (a.x.D !== D) continue
          const ox = Math.min(a.x1, c.x1) - Math.max(a.x0, c.x0), oy = Math.min(a.y1, c.y1) - Math.max(a.y0, c.y0)
          if (ox <= 1 || oy <= 1) continue
          if (ox <= 800 && oy > ox) { if (a.x0 <= c.x0) c.x0 = a.x1; else c.x1 = a.x0 }
          else if (oy <= 800 && ox > oy) { if (a.y0 <= c.y0) c.y0 = a.y1; else c.y1 = a.y0 }
          else { 버 = true; break }
        }
        if (버 || !(px > c.x0 && px < c.x1 && py > c.y0 && py < c.y1) || Math.min(c.x1 - c.x0, c.y1 - c.y0) < 1000) continue
        const 옆 = 맞댐(c)
        if (!옆) continue
        const key = D.번 + '|' + Math.round((c.x0 + c.x1) / 2) + '|' + Math.round((c.y0 + c.y1) / 2)
        if (판본.has(key)) continue
        판본.add(key)
        /* 바깥 보 바깥 면까지 늘릴 때 쓸 «보 반 폭»(가운데 − 가까운 면) — 그 변을 옆 칸에 맞춰 줄였으면 안 씀 */
        const 반 = (v, 새) => (Math.abs(새 - v.d) < 1 && v.면 != null ? { d: 새, 면: v.면 } : { d: 새 })
        잰들.push({ x: { ...옆.x, g, 씨: 옆.x.씨 || true, 채움: true }, 오: 반(잰[0], c.x1 - px), 왼: 반(잰[1], px - c.x0), 위: 반(잰[2], c.y1 - py), 아래: 반(잰[3], py - c.y0), ...c })
        더 = true
      }
    }
  }
  /* 🧭 G248 바닥 슬래브 칸(높이 글 씨 · 채움 · T= 칸)끼리는 보 폭(0.8 m) 안에서 맞대도 이웃 — 칸마다 따로 잰 보 가운데가 조금 달라
       50 mm 안에 안 들어 칸마다 «정착 2변» 이 붙어 철근이 1.5 배로 나왔음(바닥 철근은 칸을 건너 이어짐) */
  const 바닥칸인가 = (a) => !!a.x.씨 || /^T\d/.test(a.x.r.기호)
  /* 🧭 G248 바닥 칸 — ① 맞댄 칸 사이 보 폭(0.8 m 안) 틈은 반씩 메움(한쪽 칸이 보 가운데가 아닌 가까운 면에서 끝나 보 윗부분 띠가 비었음)
       ② 맞댄 칸이 없는 바깥 변은 바깥 보의 바깥 면까지(지중보는 «춤−슬래브» 로 셈하므로 보 윗부분 슬래브 두께는 바닥 슬래브 몫) */
  {
    const 바닥들 = 잰들.filter(바닥칸인가)
    for (const a of 바닥들) for (const b of 바닥들) {
      if (a === b || a.x.D !== b.x.D) continue
      const g = b.x0 - a.x1
      if (g > 1 && g <= 800 && Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0) >= 0.8 * Math.min(a.y1 - a.y0, b.y1 - b.y0)) { a.x1 += g / 2; b.x0 -= g / 2 }
      const h = b.y0 - a.y1
      if (h > 1 && h <= 800 && Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0) >= 0.8 * Math.min(a.x1 - a.x0, b.x1 - b.x0)) { a.y1 += h / 2; b.y0 -= h / 2 }
    }
    const 맞댄 = (a, 변) => 바닥들.some((b) => {
      if (b === a || b.x.D !== a.x.D) return false
      const 겹x = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), 겹y = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0)
      if (변 === '오') return Math.abs(b.x0 - a.x1) < 50 && 겹y > 100
      if (변 === '왼') return Math.abs(b.x1 - a.x0) < 50 && 겹y > 100
      if (변 === '위') return Math.abs(b.y0 - a.y1) < 50 && 겹x > 100
      return Math.abs(b.y1 - a.y0) < 50 && 겹x > 100
    })
    const 늘림 = []
    for (const a of 바닥들) {
      for (const [변, k] of [['오', 'x1'], ['왼', 'x0'], ['위', 'y1'], ['아래', 'y0']]) {
        const v = a[변]
        if (!v || v.면 == null || 맞댄(a, 변)) continue
        const 반폭 = v.d - v.면
        if (반폭 > 50 && 반폭 <= 800) 늘림.push([a, k, k === 'x1' || k === 'y1' ? 반폭 : -반폭])
      }
    }
    for (const [a, k, dv] of 늘림) a[k] += dv
    /* ③ 늘리다 겹친 곳은 작은 칸 쪽을 잘라 냄(두 번 안 셈) */
    for (const a of 바닥들) for (const b of 바닥들) {
      if (a === b || a.x.D !== b.x.D) continue
      const ox = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), oy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0)
      if (ox <= 1 || oy <= 1) continue
      const 작 = (a.x1 - a.x0) * (a.y1 - a.y0) <= (b.x1 - b.x0) * (b.y1 - b.y0) ? a : b, 큰 = 작 === a ? b : a
      if (ox <= oy) { if (작.x0 < 큰.x0) 작.x1 = 큰.x0; else 작.x0 = 큰.x1 }
      else { if (작.y0 < 큰.y0) 작.y1 = 큰.y0; else 작.y0 = 큰.y1 }
    }
    for (const a of 바닥들) { const g = a.x.g; a.오 = { ...a.오, d: a.x1 - g.x }; a.왼 = { ...a.왼, d: g.x - a.x0 }; a.위 = { ...a.위, d: a.y1 - g.y }; a.아래 = { ...a.아래, d: g.y - a.y0 } }
  }
  const 이웃 = (a, 변) => 잰들.some((b) => {
    if (b === a || b.x.D !== a.x.D) return false
    const 틈 = 바닥칸인가(a) && 바닥칸인가(b) ? 800 : 50
    const 겹x = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), 겹y = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0)
    if (변 === '오') return Math.abs(b.x0 - a.x1) < 틈 && 겹y > 100
    if (변 === '왼') return Math.abs(b.x1 - a.x0) < 틈 && 겹y > 100
    if (변 === '위') return Math.abs(b.y0 - a.y1) < 틈 && 겹x > 100
    return Math.abs(b.y1 - a.y0) < 틈 && 겹x > 100
  })
  for (const a of 잰들) {
    const { x, 오, 왼, 위, 아래 } = a
    const Lx = 오.d + 왼.d, Ly = 위.d + 아래.d
    const 바 = (변) => (이웃(a, 변) ? 0 : 1)
    const x단 = Lx <= Ly
    const 단정 = x단 ? 바('오') + 바('왼') : 바('위') + 바('아래')
    const 장정 = x단 ? 바('위') + 바('아래') : 바('오') + 바('왼')
    const k = x.D.k
    const 상자 = [(x.g.x - 왼.d) / k, (x.g.y - 아래.d) / k, (x.g.x + 오.d) / k, (x.g.y + 위.d) / k]
    근거.push({ 번: x.D.번, 상자, 글: x.r.기호 + ' ' + Math.round(Math.min(Lx, Ly)) + '×' + Math.round(Math.max(Lx, Ly)) })
    /* 🧭 G292 ⑨ 안목(보 · 벽 면 사이) — 둘레 면까지 거리(면)가 있으면 그것 · 없으면 가운데까지(d) · 데크플레이트 넓이에 씀 */
    const 면 = (v) => (v && v.면 != null && v.면 > 0 && v.면 <= v.d ? v.면 : v.d)
    const 안x = 면(오) + 면(왼), 안y = 면(위) + 면(아래)
    슬칸.push({ 기호: x.r.기호, 단변: Math.round(Math.min(Lx, Ly)), 장변: Math.round(Math.max(Lx, Ly)), 단정, 장정, 두께: +(x.b && x.b.두께) || 0, 자리: 자리만들기(x.D.이름, 상자), 안: [Math.round(x단 ? 안x : 안y), Math.round(x단 ? 안y : 안x)], ...(x.씨 ? { 씨: x.씨 } : {}), ...(x.채움 ? { 채움: true } : {}) })
  }
  if (띠속슬.length) 경고.push('📐 슬래브 글자가 보 · 벽 띠 안(두 면 사이)에 적혀 있어 띠 양쪽 칸으로 셈: ' + 띠속슬.join(' · ') + ' — 3D 에서 자리를 한 번 보아 주세요')
  return { 보칸, 벽칸, 슬칸 }
}

/**
 * 골조 산출서 시트들(골조 화면의 엑셀과 같은 양식)을 «골조 …» 이름으로 — 도면 물량 자동 엑셀 한 파일에 같이 넣으려고.
 * 시트 이름이 바뀌므로 집계의 식(SUMPRODUCT … 산출서!…)도 새 이름으로 고칩니다.
 */
/** 읽은 부재 한 줄 글 — 「보 46칸 · 기둥 24개 · 슬래브 24칸 · 벽 1곳 · 기초 12개」 */
export function 개수글(R) {
  const n = (R && R.읽음 && R.읽음.개수) || {}
  return [n.보 ? '보 ' + n.보 + '칸' : '', n.기둥 ? '기둥 ' + n.기둥 + '개' : '', n.슬라브 ? '슬래브 ' + n.슬라브 + '칸' : '', n.벽 ? '벽 ' + n.벽 + '곳' : '', n.기초 ? '기초 ' + n.기초 + '개' : ''].filter(Boolean).join(' · ')
}

export function 골조시트들(공사, 결과, 모양) {
  const sheets = 골조엑셀(공사, 결과, (s) => s, 모양)
  const 바꿈 = new Map(sheets.map((x) => [x.name, ('골조 ' + x.name).slice(0, 28)]))
  const 틀 = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const 고치 = (f) => {
    let t = String(f)
    for (const [a, b] of 바꿈) {
      t = t.split("'" + a + "'!").join("'" + b + "'!")
      t = t.replace(new RegExp('(^|[^A-Za-z가-힣0-9_.\'])' + 틀(a) + '!', 'g'), (m, p) => p + "'" + b + "'!")
    }
    return t
  }
  return sheets.map((x) => ({ ...x, name: 바꿈.get(x.name), rows: x.rows.map((r) => r.map((c) => (c && typeof c === 'object' && c.f ? { ...c, f: 고치(c.f) } : c))) }))
}

/* 🏗 G225 BIM 물량(lib/BIM모델.js) — 기둥 · 기초 모양(닫힌 선)과 글자를 같은 셈으로 찾으려고 내보냄 */
export { 준비 as 도면준비 }
export { 일람표읽기 as _일람표읽기, 준비 as _준비, 격자벽표 as _격자벽표, 짐작크기버림 as _짐작크기버림 }
/** 시험용 — 일람표읽기만 따로 돌릴 때 벽 기호 허용을 맞춤(null 이면 끔) */
export function _벽허용(도면들) { 벽허용 = 도면들 ? 벽표기호(도면들) : null; return 벽허용 }
/** 🧪 G252 시험용 — 슬래브 네 방향 받침 · 미표기 두 선 짝 */
export const _슬래브재기 = 슬래브재기
export const _미표기띠 = 미표기띠
export const _깊은칸찾기 = 깊은칸찾기
export const _계단일람찾기 = 계단일람찾기, _계단판찾기 = 계단판찾기
/** 🧪 G253 시험용 — 배근표 빈 크기 · 철근 채우기 */
export const _일람채우기 = 일람채우기
/**
 * 🧭 G406 📌 사람이 «같은 부재» 라고 정한 줄 — 소장님 «같다고 보고 셈»(현장 J 평면 DS1 ~ 3 ↔ SLAB LIST · S-451 UDS1 ~ 3).
 *   건설맵은 이름이 다른 줄을 스스로 잇지 않음(짐작 금지) — 사람이 고른 것만: ❓ 줄의 빈 칸만 그 줄 값으로 · «만든» 칸에 📌 누가 아닌 «사람 확인» · 날짜 · 어느 줄 값인지.
 *   @param R 골조읽기 결과 · @param 같음 { '슬라브|DS1': { 기호: 'UDS1', 때: '2026-10-25' } } · @returns 새 R(같음이 없으면 그대로)
 */
export function 같음입히기(R, 같음) {
  const 쌍 = Object.entries(같음 || {})
  if (!R || !R.공사 || !R.공사.배근 || !쌍.length) return R
  const 배 = { ...R.공사.배근 }
  const 된 = [], 풀린 = new Set()
  for (const [키, v] of 쌍) {
    const [종, 기호] = 키.split('|'), 그 = v && 글(v.기호)
    const 줄들 = 배[종]
    if (!줄들 || !그 || !철없음[종]) continue
    const i = 줄들.findIndex((r) => r.기호 === 기호), c = 줄들.find((r) => r.기호 === 그)
    if (i < 0 || !c || c === 줄들[i]) continue
    const r = { ...줄들[i] }
    for (const [k, x] of Object.entries(c)) if (!k.startsWith('_') && !['기호', '만든', '동', '층'].includes(k) && 글(x) && !글(r[k])) r[k] = x
    const 남 = 빈칸(종, r)
    r._없음 = 남
    r._사람 = { 기호: 그, 때: 글(v.때) }
    r.만든 = '건설맵: 📌 사람 확인 — «' + 그 + '» 줄과 같은 부재로 봄' + (글(v.때) ? '(' + 글(v.때) + ')' : '') + ' · 값 = 일람표 «' + 그 + '» 줄' + (남.length ? ' · ❓ 도면에 없음 — ' + 남.join(' · ') : '')
    배[종] = 줄들.slice(); 배[종][i] = r
    된.push(기호 + ' = ' + 그)
    if (!남.length) 풀린.add(기호)
  }
  if (!된.length) return R
  const 경고 = []
  for (const w of R.경고 || []) {
    const m = typeof w === 'string' && /^❓ 도면에 없음 (\d+)가지\((.*?)\) — (.*)$/.exec(w)
    if (!m || /…\)/.test(w)) { 경고.push(w); continue }
    const 항 = m[2].split(' · ').filter((x) => !풀린.has(x.split(' ')[0]))
    if (항.length) 경고.push('❓ 도면에 없음 ' + 항.length + '가지(' + 항.join(' · ') + ') — ' + m[3])
  }
  경고.push('📌 사람이 같은 부재로 본 것 ' + 된.length + '가지(' + 된.join(' · ') + ') — 그 일람표 줄 값으로 셈했습니다(배근표 «만든 값» 칸에 날짜와 함께 적혀 있음 · 되돌릴 수 있음)')
  return { ...R, 공사: { ...R.공사, 배근: 배 }, 경고 }
}
