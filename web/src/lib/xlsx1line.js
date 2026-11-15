/**
 * xlsx1line.js — 2줄(당초 · 변경) 내역서를 «원본 꼴 그대로» 1줄로 줄입니다. (2026-11-15 G687)
 *
 * 소장님: 「2줄에서 1줄로도 할 수 있어?」 → 「1줄로 되게 만들어 줘」 → «원본 꼴 그대로 1줄 (추천)»
 *   — 소장님 엑셀의 서식 · 인쇄 · 결재란을 그대로 두고 변경(또는 당초) 줄만 남겨 수식을 다시 이음(설계박사와 같은 결과).
 *
 * ■ 2줄 → 1줄 (xlsx2line.js 의 거꾸로)
 *    1줄 → 2줄은 줄을 «늘리고», 이것은 줄을 «지웁니다». 지우는 일은 되돌릴 수 없으니 «짝» 을 확실히 알아야 합니다.
 *    ① 짝 찾기 — 품목 · 공종 · 계 줄마다 당초 줄 + 변경 줄(+ 증감 줄)을 한 덩이로 묶습니다.
 *       · 라벨 칸(«당초 · 변경 · 증감» 이나 «①총괄당초 ②총괄변경 …» 이 적힌 칸)이 있으면 그것으로(우리 2줄 변환이 만든 파일 · 차수 내역서)
 *       · 없으면 «줄 짝»(적산 프로그램이 만든 변경내역서 — 변경 줄은 품명이 비어 있음 · 손으로 만든 것 — 변경 줄에 같은 품명이 병합 아래 숨어 있음)
 *    ② 덩이마다 한 줄만 남깁니다 — 자리 · 줄 높이 · 서식은 덩이 첫 줄(당초)의 것, 값은 남길 줄(변경)의 것.
 *       품명 · 규격 · 단위 · 번호처럼 «설명» 칸이 변경 줄에 비어 있으면 당초 줄의 것을 씁니다(변경 줄 품명이 바뀌었으면 바뀐 이름).
 *       병합 아래 숨은 칸은 «안 보이는 칸» 으로 봅니다 — 화면에 보이던 글 그대로.
 *    ③ 수식을 다시 잇습니다 — 남은 칸을 가리키면 새 줄 번호로, 지운 칸을 가리키면
 *       · 같은 덩이 안(변경 단가 = 당초 단가 처럼)이면 그 칸의 수식을 그대로 끌어와 잇고(값이면 값)
 *       · 다른 곳(대비표의 «당초» 칸 · 증감 칸)이면 그때 값으로 남깁니다 — 값이 바뀌지 않게.
 *       라벨로 거른 합계 SUMIF(라벨,"변경",범위) 는 SUM(범위) 로 · SUMIF(라벨,"당초",…) 는 0 으로(앞의 ± 와 함께 지움).
 *       범위(SUM(H5:H50))는 지운 줄만큼 줄어듭니다 — 그 안에서 빠지는 값이 0 이 아니면 «손으로 확인» 으로 알립니다.
 *    ④ 병합 · 조건부 서식 · 데이터 유효성 · 인쇄 영역 · 페이지 나눔 · 메모 · 그림 자리 · 이름 정의도 같이 옮깁니다.
 *    ⑤ 짝이 의심스러우면(남은 수식이 지운 «다른 덩이» 칸을 가리킴) 바꾸지 않고 멈춥니다 — 틀린 1줄보다 낫습니다(8절 17).
 *
 * ■ 안 하는 것
 *    · 구형 .xls(97-2003) — xlsx 로 저장해서 올려야 합니다(원본 꼴을 고쳐 돌려주므로)
 *    · 차트가 가리키는 범위 · 표(ListObject) — 손대지 않고 알립니다
 */
import { unzipSync, zipSync, strToU8, strFromU8 } from 'fflate'
import {
  이름표풀기, unshareFormulas, colToNum, numToCol, attr, setAttr, esc, unesc, splitRef,
  sliceList, splitItems, splitArgs, sheetOrder, sheetNames, Styler,
} from './xlsx2line.js'
import { 번호꼴 } from './변경내역.js'

/* ═══════════════════════════ 낱말 ═══════════════════════════ */
const 맨 = (x) => (x === null || x === undefined ? '' : String(x).replace(/[\s　]+/g, ''))
/** 상태 말 — «당초 · 변경 · 증감» 과 차수 내역서의 «①총괄당초 …» */
export function 상태말(t) {
  const s = 맨(t).replace(/[()（）[\]]/g, '')
  if (!s) return null
  if (/^당초(분|설계|내역)?$/.test(s)) return '당초'
  if (/^변경(분|설계|내역)?$/.test(s)) return '변경'
  if (/^증감(분)?$/.test(s)) return '증감'
  if (/^[①-⑳]/.test(s) && s.length >= 2 && s.length <= 12) return s
  return null
}
const 머리낱말 = /^(공종|공종명|공종번호|번호|순번|호표|호표번호|항목|코드|no\.?|품명|품명및규격|품목|품목명|명칭|공사명|자재명|비목|내역|구분|규격|형식|사양|규격및형식|단위|수량|물량|단가|금액|합계|합계금액|계|재료비|노무비|경비|비고|적요|산출근거|요율|협의단가\(?%?\)?|낙찰율\(?%?\)?|낙찰률\(?%?\)?|직접공사비|당초|변경|증감|증\(\+\)|감\(-\)|증|감|재료또는치수|치수)$/i
const 이름머리 = /^(품명|품명및규격|품목|품목명|명칭|공종명|공사명|자재명|비목|내역|공종및품명|공종별명칭)$/
const 번호머리 = /^(공종|번호|순번|호표|호표번호|항목|no\.?|코드|공종번호)$/i
const 설명머리 = /^(규격|형식|사양|규격및형식|재료또는치수|치수|단위|수량단위|비고|적요|산출근거|코드)$/

/* ═══════════════════════════ 읽기 ═══════════════════════════ */
function 공유글(zip) {
  if (!zip['xl/sharedStrings.xml']) return []
  const x = strFromU8(zip['xl/sharedStrings.xml'])
  return (x.match(/<si>[\s\S]*?<\/si>|<si\/>/g) || []).map((si) => unesc(
    si.replace(/<rPh\b[\s\S]*?<\/rPh>/g, '').replace(/<phoneticPr\b[^>]*\/>/g, '')
      .match(/<t\b[^>]*>([\s\S]*?)<\/t>|<t\b[^>]*\/>/g)?.map((t) => (t.endsWith('/>') ? '' : t.replace(/^<t\b[^>]*>/, '').replace(/<\/t>$/, ''))).join('') || ''))
}
const 글뽑기 = (inner) => unesc((inner.replace(/<rPh\b[\s\S]*?<\/rPh>/g, '').match(/<t\b[^>]*>([\s\S]*?)<\/t>/g) || []).map((t) => t.replace(/^<t\b[^>]*>/, '').replace(/<\/t>$/, '')).join(''))

/** 칸 하나 */
function 칸풀기(cx, rowNo, 앞열) {
  const open = /<c\b[^>]*?\/?>/.exec(cx)[0]
  const self = open.endsWith('/>')
  const ref = attr(open, 'r')
  const sp = ref ? splitRef(ref) : null
  const col = sp ? colToNum(sp.col) : 앞열 + 1
  const body = self ? '' : cx.slice(open.length, cx.lastIndexOf('</c>'))
  const fm = /<f\b([^>]*?)(?:\/>|>([\s\S]*?)<\/f>)/.exec(body)
  const vm = /<v(?:\s[^>]*)?>([\s\S]*?)<\/v>|<v\s*\/>/.exec(body)
  const ism = /<is>([\s\S]*?)<\/is>/.exec(body)
  return {
    open, self, body, col, row: sp ? sp.row : rowNo,
    s: attr(open, 's'), t: attr(open, 't'),
    f: fm ? { attrs: fm[1] || '', text: fm[2] != null ? unesc(fm[2]) : '' } : null,
    v: vm ? (vm[1] ?? '') : null,
    is: ism ? 글뽑기(ism[1]) : null,
  }
}

/** 시트 한 장 — 줄 · 칸 · 병합 */
function 시트풀기(xml) {
  const sdOpen = /<sheetData\b[^>]*?(\/?)>/.exec(xml)
  const out = { xml, rows: new Map(), 순: [], merges: [], 숨은: new Map(), sd: null, 끝줄: 0 }
  if (!sdOpen) return out
  if (sdOpen[1] === '/') { out.sd = { start: sdOpen.index, innerStart: sdOpen.index + sdOpen[0].length, end: sdOpen.index + sdOpen[0].length, 닫힘: true }; return out }
  const innerStart = sdOpen.index + sdOpen[0].length
  const end = xml.indexOf('</sheetData>', innerStart)
  out.sd = { start: sdOpen.index, innerStart, end, 닫힘: false }
  const body = xml.slice(innerStart, end)
  let 앞줄 = 0
  for (const m of body.matchAll(/<row\b[^>]*?\/>|<row\b[^>]*>[\s\S]*?<\/row>/g)) {
    const rx = m[0]
    const open = /<row\b[^>]*?\/?>/.exec(rx)[0]
    const selfClose = open.endsWith('/>')
    const rn = +(attr(open, 'r') || 0) || 앞줄 + 1
    앞줄 = rn
    const inner = selfClose ? '' : rx.slice(open.length, rx.lastIndexOf('</row>'))
    const cells = new Map()
    let 앞열 = 0
    for (const cm of inner.matchAll(/<c\b[^>]*?\/>|<c\b[^>]*>[\s\S]*?<\/c>/g)) {
      const c = 칸풀기(cm[0], rn, 앞열)
      앞열 = c.col
      c.row = rn
      cells.set(c.col, c)
    }
    out.rows.set(rn, { rn, open, selfClose, cells })
    out.순.push(rn)
  }
  out.순.sort((a, b) => a - b)
  out.끝줄 = out.순.length ? out.순[out.순.length - 1] : 0
  const mb = sliceList(xml, 'mergeCells')
  if (mb) {
    for (const it of splitItems(mb.inner, 'mergeCell')) {
      const m = /^\$?([A-Za-z]{1,3})\$?(\d+)(?::\$?([A-Za-z]{1,3})\$?(\d+))?$/.exec(attr(it, 'ref') || '')
      if (!m) continue
      const c1 = colToNum(m[1]), r1 = +m[2], c2 = m[3] ? colToNum(m[3]) : c1, r2 = m[4] ? +m[4] : r1
      out.merges.push({ c1: Math.min(c1, c2), r1: Math.min(r1, r2), c2: Math.max(c1, c2), r2: Math.max(r1, r2) })
    }
    let n = 0
    for (const g of out.merges) {
      for (let r = g.r1; r <= g.r2 && n < 400000; r++) for (let c = g.c1; c <= g.c2; c++) {
        if (r === g.r1 && c === g.c1) continue
        out.숨은.set(c + ',' + r, { c: g.c1, r: g.r1 }); n++
      }
    }
  }
  return out
}

/** 칸의 값(캐시) — {k:'n'|'s'|'b'|'e', v} 또는 null */
function 값(c, sst) {
  if (!c) return null
  if (c.t === 's') { const s = sst[+c.v]; return s == null ? null : { k: 's', v: s } }
  if (c.t === 'inlineStr') return c.is != null ? { k: 's', v: c.is } : null
  if (c.t === 'str') return c.v != null ? { k: 's', v: unesc(c.v) } : null
  if (c.t === 'b') return c.v != null ? { k: 'b', v: c.v.trim() === '1' } : null
  if (c.t === 'e') return c.v != null ? { k: 'e', v: unesc(c.v) } : null
  if (c.v == null || c.v.trim() === '') return null
  return { k: 'n', v: c.v.trim() }
}
const 내용 = (c, sst) => !!c && (!!c.f || 값(c, sst) !== null)
const 글칸 = (c, sst) => { const v = 값(c, sst); return v && v.k === 's' && !c.f ? v.v : '' }

/* ═══════════════════════════ 짝 찾기 ═══════════════════════════ */
/**
 * 시트 한 장의 «덩이» — 덩이마다 줄들 · 줄마다 상태
 * @returns {{꼴, 상태:string[], 덩이:[{rows:number[], 상태:Map<row,int>}], 머리:number[], 자료부터, 끝, 이름칸, 번호칸, 라벨칸, 설명칸:Set, 까닭}}
 */
export function 짝찾기(시트, sst) {
  const 결과 = { 꼴: '없음', 상태: [], 덩이: [], 머리: [], 자료부터: 0, 끝: 0, 이름칸: 0, 번호칸: 0, 라벨칸: 0, 설명칸: new Set(), 까닭: '' }
  const { rows, 순, 숨은 } = 시트
  if (!순.length) { 결과.까닭 = '빈 시트입니다'; return 결과 }
  const 보임 = (c, r) => { if (숨은.has(c + ',' + r)) return null; const row = rows.get(r); return row ? row.cells.get(c) : null }
  const 보임글 = (c, r) => 글칸(보임(c, r), sst)
  const 숫자줄 = (r) => { const row = rows.get(r); if (!row) return false; for (const c of row.cells.values()) { if (c.f) return true; const v = 값(c, sst); if (v && v.k === 'n') return true } return false }
  const 빈줄 = (r) => { const row = rows.get(r); if (!row) return true; for (const c of row.cells.values()) if (내용(c, sst)) return false; return true }
  const 머리줄 = (r) => {
    const row = rows.get(r); if (!row) return false
    let 낱 = 0, 다른 = 0
    for (const c of row.cells.values()) {
      if (!내용(c, sst)) continue
      if (숨은.has(c.col + ',' + r)) continue
      const v = 값(c, sst)
      if (c.f || (v && v.k !== 's')) { 다른++; continue }
      const t = 맨(v.v)
      if (!t) continue
      if (머리낱말.test(t)) 낱++
      else 다른++
    }
    return 낱 >= 2 && 낱 >= 다른 * 2 && !숫자줄(r)
  }
  /* ── ① 라벨 칸(«당초 · 변경 · 증감» · «①총괄당초 …» 이 적힌 칸) — 머리글이 없어도(원가계산서 등) 시트 전체에서 찾습니다 ── */
  결과.끝 = 시트.끝줄
  const 라벨수 = new Map()
  for (const r of 순) {
    const row = rows.get(r); if (!row) continue
    for (const c of row.cells.values()) {
      const s = 상태말(보임글(c.col, r)); if (!s) continue
      if (!라벨수.has(c.col)) 라벨수.set(c.col, { n: 0, 말: new Map() })
      const o = 라벨수.get(c.col); o.n++; o.말.set(s, (o.말.get(s) || 0) + 1)
    }
  }
  let 라벨 = 0, 라벨n = 0
  for (const [c, o] of 라벨수) if (o.n > 라벨n && o.말.size >= 2) { 라벨 = c; 라벨n = o.n }
  const 숫자줄수 = 순.filter(숫자줄).length
  const 라벨길 = 라벨 && 라벨n >= 3 && 라벨n >= 숫자줄수 * 0.3

  /* 머리 — 앞 60줄 안에서 머리 줄이 처음 나오는 곳(바로 아래 머리 줄까지) */
  let h = 0
  for (const r of 순) { if (r > 60) break; if (머리줄(r)) { h = r; break } }
  if (!h && !라벨길) { 결과.까닭 = '머리글(품명 · 규격 · 수량 · 금액 …)을 못 찾았습니다'; return 결과 }
  let hEnd = h
  if (h) {
    while (머리줄(hEnd + 1) || (빈줄(hEnd + 1) && 머리줄(hEnd + 2) && hEnd + 2 - h <= 3)) hEnd += 머리줄(hEnd + 1) ? 1 : 2
    for (let r = h; r <= hEnd; r++) 결과.머리.push(r)
  }
  결과.자료부터 = h ? hEnd + 1 : 1
  const 자료 = 순.filter((r) => r >= 결과.자료부터)
  /* 머리 칸 → 이름 · 번호 · 설명 칸 */
  const 머리칸 = []        /* [{c1, c2, t}] — 병합된 머리는 병합 폭 */
  for (const r of 결과.머리) {
    const row = rows.get(r); if (!row) continue
    for (const c of row.cells.values()) {
      const t = 맨(글칸(c, sst)); if (!t) continue
      const g = 시트.merges.find((m) => m.r1 <= r && r <= m.r2 && m.c1 === c.col && (m.r1 === r))
      머리칸.push({ c1: c.col, c2: g ? g.c2 : c.col, t })
    }
  }
  const 긴글수 = (c) => { let n = 0; for (const r of 자료) { const t = 맨(보임글(c, r)); if (t.length >= 2 && !/^[-+\d.,%]+$/.test(t) && !상태말(t)) n++ } return n }
  const 이름머 = 머리칸.find((x) => 이름머리.test(x.t))
  if (이름머) {
    let best = 이름머.c1, bn = -1
    for (let c = 이름머.c1; c <= 이름머.c2; c++) { const n = 긴글수(c); if (n > bn) { bn = n; best = c } }
    결과.이름칸 = best
  } else {
    let best = 0, bn = 2
    for (let c = 1; c <= 10; c++) { const n = 긴글수(c); if (n > bn) { bn = n; best = c } }
    결과.이름칸 = best
  }
  if (!결과.이름칸 && !라벨길) { 결과.까닭 = '품명(이름) 칸을 못 찾았습니다'; return 결과 }
  const 번머 = 머리칸.find((x) => 번호머리.test(x.t) && x.c1 < 결과.이름칸)
  if (번머) 결과.번호칸 = 번머.c1
  else if (결과.이름칸 > 1) {
    let n = 0
    for (const r of 자료) if (번호꼴(보임글(결과.이름칸 - 1, r))) n++
    if (n >= 3) 결과.번호칸 = 결과.이름칸 - 1
  }
  for (const x of 머리칸) if (설명머리.test(x.t)) for (let c = x.c1; c <= x.c2; c++) 결과.설명칸.add(c)
  if (결과.이름칸) 결과.설명칸.add(결과.이름칸)
  if (결과.번호칸) 결과.설명칸.add(결과.번호칸)
  const 대비머리 = 머리칸.filter((x) => 상태말(x.t) === '당초' || 상태말(x.t) === '변경').length >= 2

  /* ── ① 라벨 칸이 있으면 그것으로 덩이(시트 전체 — 머리 줄을 두 벌로 벌린 것도) ── */
  if (라벨길) {
    결과.라벨칸 = 라벨
    결과.설명칸.delete(라벨)
    const 차례 = []
    for (const r of 순) { const s = 상태말(보임글(라벨, r)); if (s && !차례.includes(s)) 차례.push(s) }
    /* 당초 · 변경 · 증감은 늘 이 차례로 */
    const 기본 = ['당초', '변경', '증감']
    결과.상태 = 차례.every((s) => 기본.includes(s)) ? 기본.filter((s) => 차례.includes(s)) : 차례
    let 지금 = null, 앞자리 = -1
    /* 🩹 G689 라벨 칸이 병합 아래 숨은 줄 — 숨은 칸의 «변경» 글도 읽음(전엔 못 읽어 짝이 한 줄씩 밀림 · 실제 설계내역서 D37 «소스» 시트를 1줄 → 2줄 → 1줄 하니
       C2:G3 세로 병합 아래 라벨 «변경» 이 숨어 첫 줄이 홀로 남고 아래가 모두 엇갈렸음) · 숨은 글로 맞춘 줄 수 = 숨은라벨(살펴보기가 «확실» 에서 뺌) */
    let 숨은라벨 = 0
    const 라벨글 = (r) => {
      const t = 보임글(라벨, r)
      if (t || !숨은.has(라벨 + ',' + r)) return t
      const row = rows.get(r); const raw = row && row.cells.get(라벨) ? 글칸(row.cells.get(라벨), sst) : ''
      if (상태말(raw)) { 숨은라벨++; return raw }
      return t
    }
    for (const r of 순) {
      const s = 상태말(라벨글(r))
      if (!s) { 지금 = null; 앞자리 = -1; continue }
      const k = 결과.상태.indexOf(s)
      if (!지금 || k <= 앞자리 || r !== 지금.rows[지금.rows.length - 1] + 1) { 지금 = { rows: [], 상태: new Map() }; 결과.덩이.push(지금) }
      지금.rows.push(r); 지금.상태.set(r, k); 앞자리 = k
    }
    const 첫 = 결과.덩이.length ? 결과.덩이[0].rows[0] : 결과.자료부터
    if (첫 < 결과.자료부터) 결과.자료부터 = 첫
    결과.꼴 = 결과.상태.length > 3 || !결과.상태.every((s) => 기본.includes(s)) ? 'N상태' : 결과.상태.includes('증감') ? '3줄' : '2줄'
    결과.숨은라벨 = 숨은라벨
    return 결과
  }

  /* ── ② 줄 짝(라벨 없음) ── */
  const 이름 = (r) => 맨(보임글(결과.이름칸, r))
  const 번호 = (r) => (결과.번호칸 ? 맨(보임글(결과.번호칸, r)) : '')
  const 규격칸 = 머리칸.find((x) => /^(규격|형식|사양|규격및형식|재료또는치수|치수)$/.test(x.t))
  const 규격 = (r) => (규격칸 ? 맨(보임글(규격칸.c1, r)) : '')
  const 단위칸 = 머리칸.find((x) => /^(단위|수량단위)$/.test(x.t))
  const 단위 = (r) => (단위칸 ? 맨(보임글(단위칸.c1, r)) : '')
  const 짓기 = (K, 빈줄붙임, 단위짝) => {
    const 덩 = []
    let 지금 = null
    const 닫기 = () => { 지금 = null }
    for (let i = 0; i < 자료.length; i++) {
      const r = 자료[i]
      if (머리줄(r)) { 닫기(); continue }
      if (빈줄(r)) {
        if (빈줄붙임 && 지금 && 지금.rows.length < K && r === 지금.rows[지금.rows.length - 1] + 1) {
          /* 다음 내용 줄이 새 덩이를 열면(또는 표가 끝나면) 이 빈 줄은 이 덩이의 «변경» 줄(값 없음)입니다 */
          let j = i + 1
          while (j < 자료.length && 빈줄(자료[j]) && 자료[j] === 자료[j - 1] + 1 && j - i < K) j++
          const 다음 = 자료[j]
          const 연다 = 다음 === undefined || 다음 !== r + (j - i) || 머리줄(다음) || 새덩이(다음, null)
          if (연다) { 지금.rows.push(r); continue }
        }
        닫기(); continue
      }
      const 붙음 = 지금 && r === 지금.rows[지금.rows.length - 1] + 1
      if (!붙음 || 지금.rows.length >= K || (새덩이(r, 지금) && !(단위짝 && 바뀐품목(r, 지금)))) {
        /* 이름 없는 줄은 앞 덩이에 «바로 붙어» 있을 때만 새 덩이를 엽니다(일위대가의 빈 칸 짝 줄).
           빈 줄 · 머리 뒤에 홀로 선 이름 없는 숫자 줄(표 아래 셈 메모)은 짝 없이 그대로 둡니다 */
        const 연다 = 새덩이(r, null) || 붙음
        지금 = { rows: [r] }; 덩.push(지금)
        if (!연다) { 지금.홀로 = true; 지금 = null }
      } else 지금.rows.push(r)
    }
    return 덩
  }
  /* 이 줄이 새 덩이를 여는가 — 이름(또는 공종 번호)이 있으면 엽니다.
     다만 덩이 첫 줄과 같은 이름 · 같은 규격(병합 아래 숨지 않고 그대로 적힌 변경 줄) · 같은 번호(«제1호표» 를 두 줄에 적은 것)는 짝 줄 */
  function 새덩이(r, 지금) {
    const nm = 이름(r), no = 번호(r)
    if (!nm && !no) return false
    if (지금 && 지금.rows.length) {
      const r0 = 지금.rows[0]
      const 같은이름 = nm && nm === 이름(r0) && (!규격(r) || 규격(r) === 규격(r0))
      const 같은번호 = !nm && no && no === 번호(r0)
      if ((같은이름 && (!no || no === 번호(r0))) || 같은번호) return false
    }
    return true
  }
  /* 변경 줄에 «바뀐 품명» 이 적힌 것(ICP말뚝 → PHCP말뚝 · 실제 변경내역서) — 공종 번호 없고 단위가 비었으면 짝 줄(변경내역.js 시트읽기와 같은 잣대) */
  function 바뀐품목(r, 지금) {
    const no = 번호(r)
    if (no && 번호꼴(no)) return false
    return !!이름(r) && !단위(r) && !!단위(지금.rows[0])
  }
  /* 몇 줄 짝인가 — 2줄로 묶어 보고 3줄로 묶어 봄(묶음 꽉 찬 덩이가 숫자 덩이의 60 % 넘고 5개 넘는 쪽) */
  const 몫 = (K) => {
    let 찬 = 0, 다 = 0
    for (const d of 짓기(K, false, false)) if (d.rows.some(숫자줄)) { 다++; if (d.rows.length === K) 찬++ }
    return { 찬, 다, s: 다 ? 찬 / 다 : 0 }
  }
  const m2 = 몫(2), m3 = 몫(3)
  let K = 1
  if (m3.찬 >= 5 && m3.s >= 0.6 && m3.s >= m2.s) K = 3
  else if (m2.찬 >= 5 && m2.s >= 0.6) K = 2
  결과.크기 = { 둘: m2, 셋: m3 }
  if (K === 1) {
    결과.꼴 = 대비머리 ? '대비표' : '1줄'
    결과.까닭 = 대비머리 ? '당초 · 변경이 옆으로 벌려진 대비표입니다 — 줄일 줄이 없습니다' : '1줄 내역서입니다(당초 · 변경 짝 줄이 없음)'
    return 결과
  }
  결과.덩이 = 짓기(K, true, true).map((d) => ({ rows: d.rows, 상태: new Map(d.rows.map((r, i) => [r, i])) }))
  결과.상태 = K === 3 ? ['당초', '변경', '증감'] : ['당초', '변경']
  결과.꼴 = K === 3 ? '3줄' : '2줄'
  return 결과
}

/**
 * 짝 검사 — 파일 안 수식이 «같은 상태 줄끼리» 이어지는지 봅니다(변경 합계 → 변경 줄 · 당초 합계 → 당초 줄).
 * 다른 덩이의 «다른 상태» 줄을 가리키는 수식이 많으면 짝을 잘못 지은 것입니다(한 줄씩 밀림 등).
 * 범위(SUM(H5:H50))는 두 상태를 다 품으니 셈에서 뺍니다. 같은 덩이 안(증감 = 변경 − 당초)도 뺍니다.
 */
export function 짝검사(시트, 짝, 시트이름) {
  const 어디 = new Map()
  짝.덩이.forEach((d, i) => { if (d.rows.length < 2) return; for (const r of d.rows) 어디.set(r, { i, st: d.상태.get(r) }) })
  let 같음 = 0, 다름 = 0
  const 예 = []
  for (const r of 시트.순) {
    const a = 어디.get(r)
    if (!a) continue
    for (const c of 시트.rows.get(r).cells.values()) {
      if (!c.f || !c.f.text) continue
      참조옮김(c.f.text, {
        시트: 시트이름, 라벨풀이: false,
        수집: (대상, r1, r2) => {
          if (r2 || (대상 != null && 대상 !== 시트이름)) return
          const b = 어디.get(+r1[4])
          if (!b || b.i === a.i) return
          if (b.st === a.st) 같음++
          else { 다름++; if (예.length < 6) 예.push(numToCol(c.col) + r + '→' + r1[2] + r1[4]) }
        },
      })
    }
  }
  return { 같음, 다름, 예 }
}

/* ═══════════════════════════ 살펴보기 ═══════════════════════════ */
function 책열기(buf) {
  let zip
  try { zip = 이름표풀기(unzipSync(new Uint8Array(buf))) } catch (e) {
    throw new Error('엑셀 파일을 열지 못했습니다. 구형 .xls 는 엑셀에서 «다른 이름으로 저장 → Excel 통합 문서(.xlsx)» 한 뒤 올려 주십시오.')
  }
  if (!zip['xl/workbook.xml']) throw new Error('엑셀 파일(xlsx)이 아닙니다. 구형 .xls 는 엑셀에서 xlsx 로 저장한 뒤 올려 주십시오.')
  /* 공유수식(끌어 채운 것)은 먼저 풉니다 — 따라가는 칸의 참조도 봐야 하므로 */
  for (const p of Object.keys(zip)) {
    if (!/^xl\/worksheets\/[^/]+\.xml$/.test(p)) continue
    const x = strFromU8(zip[p])
    if (/\st="shared"/.test(x)) zip[p] = strToU8(unshareFormulas(x))
  }
  const sst = 공유글(zip)
  const names = sheetNames(zip)
  const order = sheetOrder(zip)
  const sheets = []
  for (const path of order) {
    if (!path || !zip[path]) continue
    sheets.push({ path, name: names[path] || path, 시트: 시트풀기(strFromU8(zip[path])) })
  }
  return { zip, sst, sheets }
}

/** 미리보기 줄(화면) — 덩이 앞의 몇 개 */
/* 칸 글(미리보기용) — 숨은 칸은 빈 글 · 숫자는 천 단위 쉼표 */
function 칸글(시트, sst, c, r) {
  const row = 시트.rows.get(r); const cell = row && row.cells.get(c)
  if (!cell || 시트.숨은.has(c + ',' + r)) return ''
  const v = 값(cell, sst)
  if (!v) return ''
  if (v.k === 'n') { const x = +v.v; return Number.isFinite(x) ? (Math.abs(x - Math.round(x)) < 1e-9 ? Math.round(x).toLocaleString('ko-KR') : String(Math.round(x * 1000) / 1000)) : v.v }
  return String(v.v)
}
const 미리칸수 = 14

/**
 * 미리보기 — 덩이 앞의 몇 개: 줄마다(상태 · 칸 글) + 1줄로 줄인 결과(바꾸기와 같은 «출처» 셈)
 * @returns {[{줄:[{r, 상태, 남김, cells}], 결과}]}
 */
export function 미리줄(살핀, path, 남길 = '변경', n = 3) {
  const 책 = 살핀 && 살핀.책
  const s = 책 && 책.sheets.find((x) => x.path === path)
  if (!s) return []
  const 짝 = 짝찾기(s.시트, 책.sst)
  if (짝.상태.length < 2 || !짝.상태.includes(남길)) return []
  const 계획 = 계획짓기(s, 짝, 남길, 책.sst)
  const out = []
  for (const b of 계획.덩이) {
    if (b.홀) continue
    /* 품목다운 덩이(단위가 있는 줄)를 먼저 — 맨 위 합계 줄만 보이면 무엇이 바뀌는지 모름 */
    const 줄 = b.rows.map((r) => ({ r, 상태: 짝.상태[b.상태.get(r)] ?? '', 남김: r === b.남길, cells: Array.from({ length: 미리칸수 }, (_, i) => 칸글(s.시트, 책.sst, i + 1, r)) }))
    const 결과 = Array.from({ length: 미리칸수 }, (_, i) => {
      const c = i + 1
      if (c === 짝.라벨칸) return ''
      const src = 출처(계획, b, c)
      return src == null ? '' : 칸글(s.시트, 책.sst, c, src)
    })
    /* 품목다운 덩이 — 이름 · 규격 · 단위 같은 글이 있고 당초 · 변경 숫자가 다른 것(무엇이 어떻게 바뀌는지 보이게) */
    const 이름 = 짝.이름칸 && 짝.이름칸 <= 미리칸수 ? String(결과[짝.이름칸 - 1] || '').trim() : ''
    let 설명수 = 0
    for (const c of 짝.설명칸) if (c !== 짝.이름칸 && c !== 짝.번호칸 && c <= 미리칸수 && String(결과[c - 1] || '').trim()) 설명수++
    const 첫 = 줄[0].cells, 남 = (줄.find((z) => z.남김) || 줄[줄.length - 1]).cells
    const 다름 = 첫.some((t, i) => t !== 남[i] && /\d/.test(String(t) + String(남[i])) && i + 1 !== 짝.라벨칸)
    out.push({ 줄, 결과, 품목: !!이름 && 설명수 >= 1 && 다름, 이름: !!이름 })
  }
  /* 품목 줄 셋 → 이름 있는 줄 → 앞에서 셋 */
  const 품 = out.filter((x) => x.품목)
  if (품.length >= n) return 품.slice(0, n)
  const 이름 = out.filter((x) => x.품목 || x.이름)
  return (이름.length >= n ? 이름 : out).slice(0, n)
}

/**
 * 파일 살펴보기 — 시트마다 «몇 줄 짝» 인지 · 확실한지
 * @returns {{sheets:[{path,name,꼴,상태,짝,홀,홀안,라벨칸,자료부터,끝,까닭,지울줄,확실,검사}], 상태들:string[], 책}}
 */
export function 살펴보기(buf) {
  const 책 = 책열기(buf)
  const sheets = []
  const 상태들 = []
  for (const s of 책.sheets) {
    let 짝
    try { 짝 = 짝찾기(s.시트, 책.sst) } catch (e) { 짝 = { 꼴: '없음', 상태: [], 덩이: [], 까닭: '읽다가 멈췄습니다' } }
    const 여럿 = 짝.덩이.filter((d) => d.rows.length >= 2)
    const 홀 = 짝.덩이.filter((d) => d.rows.length === 1).map((d) => d.rows[0])
    for (const st of 짝.상태) if (!상태들.includes(st)) 상태들.push(st)
    /* 확실한가 — ① 라벨 칸이 있거나 ② 짝 사이에 홀로 선 줄이 없고 파일 안 수식이 «같은 상태 줄끼리» 이어짐 */
    let 확실 = false, 검사 = { 같음: 0, 다름: 0, 예: [] }, 홀안 = 0
    if (여럿.length) {
      const 처음 = 여럿[0].rows[0], 끝 = 여럿[여럿.length - 1].rows[0]
      홀안 = 홀.filter((r) => r > 처음 && r < 끝).length
      검사 = 짝검사(s.시트, 짝, s.name)
      const 수식맞음 = 검사.다름 <= Math.max(6, 검사.같음 * 0.05)
      확실 = 짝.라벨칸 ? 홀안 <= Math.max(2, 여럿.length * 0.02) && 수식맞음 : (여럿.length >= 3 && 홀안 === 0 && 수식맞음)
      /* 🩹 G689 라벨을 병합 아래 숨은 칸에서 읽어 맞춘 짝이 있으면 «확실» 아님 — 미리보기로 보고 사람이 켬 */
      if (짝.숨은라벨 > 0) 확실 = false
    }
    sheets.push({
      path: s.path, name: s.name, 꼴: 짝.꼴, 상태: 짝.상태, 짝: 여럿.length, 홀: 홀.length, 홀안, 홀줄: 홀.slice(0, 8),
      라벨칸: 짝.라벨칸 ? numToCol(짝.라벨칸) : '', 자료부터: 짝.자료부터, 끝: 짝.끝, 까닭: 짝.까닭,
      지울줄: 여럿.reduce((n, d) => n + d.rows.length - 1, 0), 확실, 검사: { 같음: 검사.같음, 다름: 검사.다름, 예: 검사.예 }, 숨은라벨: 짝.숨은라벨 || 0,
    })
  }
  return { sheets, 상태들, 책 }
}

/* ═══════════════════════════ 바꾸기 ═══════════════════════════ */
/** 지운 칸을 가리키던 수식에 넣을 «그때 값» */
function 고정값(c, sst) {
  const v = 값(c, sst)
  if (!v) return '0'
  if (v.k === 'n') return /^-/.test(v.v) ? '(' + v.v + ')' : v.v
  if (v.k === 's') return '"' + v.v.replace(/"/g, '""') + '"'
  if (v.k === 'b') return v.v ? 'TRUE' : 'FALSE'
  return v.v
}

/** 글꼴 색 — 검정(없음 · 자동 · FF000000 · 색번호 0 · 8 · 64 · 테마 1)이 아니면 «색 있음» */
function 색판별(zip) {
  const x = zip['xl/styles.xml'] ? strFromU8(zip['xl/styles.xml']) : ''
  if (!x) return () => false
  const st = new Styler(x)
  const 캐시 = new Map()
  return (sIdx) => {
    const k = sIdx == null ? 0 : +sIdx
    if (캐시.has(k)) return 캐시.get(k)
    const xf = st.xfs[k] || ''
    const font = st.fonts[+(attr(xf, 'fontId') || 0)] || ''
    const m = /<color\b[^>]*\/?>/.exec(font)
    let 색 = false
    if (m) {
      const t = m[0]
      const rgb = attr(t, 'rgb'), ix = attr(t, 'indexed'), th = attr(t, 'theme')
      if (rgb != null) 색 = !/^(FF)?000000$/i.test(rgb)
      else if (ix != null) 색 = !['0', '8', '64'].includes(ix)
      else if (th != null) 색 = th !== '1'
    }
    캐시.set(k, 색)
    return 색
  }
}
/** 이 시트에서 «보통 글씨» 로 적힌 상태 — 변경 줄을 빨강으로 적은 파일은 당초, 당초를 빨강으로 적은 파일(적산 프로그램)은 변경.
    1줄로 줄인 줄의 서식은 이 상태 줄의 것을 씁니다(1줄 내역서는 보통 글씨). 가리기 어려우면 null(남길 줄 서식 그대로) */
function 무늬상태(시트, 짝, sst, 색) {
  const 색수 = 짝.상태.map(() => 0), 다수 = 짝.상태.map(() => 0)
  for (const d of 짝.덩이) {
    if (d.rows.length < 2) continue
    for (const r of d.rows) {
      const st = d.상태.get(r)
      const row = 시트.rows.get(r)
      if (!row) continue
      for (const c of row.cells.values()) {
        const v = 값(c, sst)
        if (!c.f && !(v && v.k === 'n')) continue
        다수[st]++
        if (색(c.s)) 색수[st]++
      }
    }
  }
  const 몫 = 다수.map((n, i) => (n >= 5 ? 색수[i] / n : null))
  const 있는 = 몫.map((f, i) => [f, i]).filter(([f]) => f != null).sort((a, b) => a[0] - b[0])
  if (있는.length < 2) return null
  /* 가장 덜 칠한 상태가 다음 상태보다 30 %p 넘게 덜 칠해야 가립니다 */
  return 있는[1][0] - 있는[0][0] >= 0.3 ? 있는[0][1] : null
}

/** 시트 한 장의 «계획» — 덩이 · 남길 줄 · 새 줄 번호 */
function 계획짓기(s, 짝, 남길이름, sst, 색 = null) {
  const 계획 = { path: s.path, name: s.name, 시트: s.시트, 짝, 덩이: [], 덩이of: new Map(), 빠짐: [], 출처: new Map(), sst,
    무늬: 색 ? 무늬상태(s.시트, 짝, sst, 색) : null }
  const k = 짝.상태.indexOf(남길이름)
  for (const d of 짝.덩이) {
    const rows = d.rows.slice().sort((a, b) => a - b)
    const b = { rows, r0: rows[0], 상태: d.상태, 홀: rows.length < 2, 남길: null }
    if (!b.홀) {
      for (const r of rows) if (d.상태.get(r) === k) { b.남길 = r; break }
      for (const r of rows.slice(1)) 계획.빠짐.push(r)
    }
    계획.덩이.push(b)
    for (const r of rows) 계획.덩이of.set(r, b)
  }
  계획.빠짐.sort((a, b) => a - b)
  /* 남길 줄에는 (거의) 안 적고 다른 상태 줄에만 적는 칸 — 원가계산서 «기호»(1 · 2 · A …)처럼 첫 줄에만 적는 칸.
     숫자처럼 보여도 그 줄 글을 가져옵니다(전엔 숫자 꼴이라 안 가져와 1줄에서 기호 «1 · 2 · 3» 이 사라졌음 · 병합된 것만 남았음) */
  const 칸셈 = new Map()
  for (const b of 계획.덩이) {
    if (b.홀 || b.남길 == null) continue
    const 칸들 = new Set()
    for (const r of b.rows) { const row = s.시트.rows.get(r); if (row) for (const [c, cell] of row.cells) if (!s.시트.숨은.has(c + ',' + r) && 내용(cell, sst)) 칸들.add(c) }
    for (const c of 칸들) {
      const o = 칸셈.get(c) || { K: 0, O: 0 }
      const kr = s.시트.rows.get(b.남길)
      const kc = kr ? kr.cells.get(c) : null
      if (kc && !s.시트.숨은.has(c + ',' + b.남길) && 내용(kc, sst)) o.K++; else o.O++
      칸셈.set(c, o)
    }
  }
  계획.첫줄칸 = new Set()
  for (const [c, o] of 칸셈) if (c !== 짝.라벨칸 && o.O >= 2 && o.K <= o.O * 0.1) 계획.첫줄칸.add(c)
  return 계획
}
/* 줄 번호 r 앞에서 지운 줄 수 */
function 앞지움(계획, r) {
  const a = 계획.빠짐
  let lo = 0, hi = a.length
  while (lo < hi) { const m = (lo + hi) >> 1; if (a[m] < r) lo = m + 1; else hi = m }
  return lo
}
const 자리 = (계획, r) => r - 앞지움(계획, r)           /* 남는 줄(덩이 첫 줄 · 덩이 밖 줄)의 새 번호 */
function 칸얻기(계획, c, r) { const row = 계획.시트.rows.get(r); return row ? row.cells.get(c) || null : null }

/** 덩이 b 의 c 칸을 «어느 줄에서» 가져오나 — null 이면 값 없음 */
function 출처(계획, b, c) {
  const key = b.r0 + ',' + c
  if (계획.출처.has(key)) return 계획.출처.get(key)
  const { sst } = 계획
  const 짝 = 계획.짝
  const 숨 = 계획.시트.숨은
  /* 병합 아래 숨은 칸은 «보이는 칸»(병합 왼쪽 위)으로 — 같은 덩이 안 세로 병합만 */
  const 보이는줄 = (r) => { const h = 숨.get(c + ',' + r); return h && h.c === c && b.rows.includes(h.r) ? h.r : r }
  let out = null
  if (c === 짝.라벨칸) out = null
  else if (b.남길 == null) {
    /* 이 상태 줄이 없는 덩이 — 설명 칸만 첫 줄에서 */
    if (짝.설명칸.has(c)) for (const r of b.rows) { const rv = 보이는줄(r); if (내용(칸얻기(계획, c, rv), sst)) { out = rv; break } }
  } else {
    let kv = 보이는줄(b.남길)
    if (kv !== b.남길) {
      /* 남길 칸이 병합 아래 숨었는데 제 수식이 따로 있으면(또는 보이는 칸과 같은 글이면) 그것 — 2줄 프로그램 · 1줄 → 2줄은 줄마다 수식을 씀.
         전엔 보이는(당초) 칸의 «MIN(G33:G35)» 을 가져와 «MIN(G19:G19)» 로 줄어 산업안전보건관리비가 바뀌었음(남길 칸엔 «MIN(G34:G36)») */
      const kc = 칸얻기(계획, c, b.남길), vc = 칸얻기(계획, c, kv)
      if (kc && 내용(kc, sst)) {
        const a1 = 값(kc, sst), a2 = 값(vc, sst)
        if (kc.f || (a1 && a2 && a1.k === a2.k && a1.v === a2.v)) kv = b.남길
      }
    }
    if (내용(칸얻기(계획, c, kv), sst)) out = kv
    else {
      const 설명 = 짝.설명칸.has(c) || (계획.첫줄칸 && 계획.첫줄칸.has(c))
      for (const r of b.rows) {
        if (r === b.남길) continue
        const rv = 보이는줄(r)
        const cell = 칸얻기(계획, c, rv)
        if (!내용(cell, sst)) continue
        const 글 = 글칸(cell, sst)
        if (설명 || (글 && !/^[-+]?[\d,.]+%?$/.test(글.trim()))) { out = rv; break }
      }
    }
  }
  계획.출처.set(key, out)
  return out
}
/** 옛 칸 (c, r) 이 바꾼 뒤 어디인가 — {k:'same', row} 또는 {k:'gone', b} */
function 칸풀이(계획, c, r) {
  const b = 계획.덩이of.get(r)
  if (!b || b.홀) return { k: 'same', row: 자리(계획, r) }
  const n = 자리(계획, b.r0)
  const src = 출처(계획, b, c)
  if (src === r) return { k: 'same', row: n }
  /* 병합 아래 숨은 칸(N16 이 N15:N16 병합 안) — 보이는 칸이 같은 덩이에서 이 칸 글의 출처면 «그 칸» 입니다
     (그대로 두면 숨은 칸에 남은 옛 글을 그때 값으로 굳혀 «=N9» 가 «10억 미만» 글이 됐음) */
  const 숨 = 계획.시트.숨은.get(c + ',' + r)
  if (숨 && 숨.c === c && 숨.r === src && b.rows.includes(숨.r)) return { k: 'same', row: n }
  const cell = 칸얻기(계획, c, r)
  if (!내용(cell, 계획.sst)) return src == null ? { k: 'same', row: n } : { k: 'gone', b, cell: null }
  return { k: 'gone', b, cell }
}
/** 범위의 새 줄(위 · 아래) — 덩이는 «남길 줄(값 칸)» 이 범위 안에 있어야 들어갑니다 */
function 범위풀이(계획, c1, r1, c2, r2) {
  const 닻 = (b) => (b.홀 ? b.r0 : (출처(계획, b, c1) ?? b.남길 ?? b.r0))
  let lo = null, hi = null
  for (let r = r1, n = 0; r <= r2 && n < 100000; n++) {
    const b = 계획.덩이of.get(r)
    if (!b || b.홀) { lo = 자리(계획, r); break }
    const a = 닻(b)
    if (a >= r1 && a <= r2) { lo = 자리(계획, b.r0); break }
    r = b.rows[b.rows.length - 1] + 1
  }
  for (let r = r2, n = 0; r >= r1 && n < 100000; n++) {
    const b = 계획.덩이of.get(r)
    if (!b || b.홀) { hi = 자리(계획, r); break }
    const a = 닻(b)
    if (a >= r1 && a <= r2) { hi = 자리(계획, b.r0); break }
    r = b.r0 - 1
  }
  if (lo == null || hi == null || lo > hi) return null
  return [lo, hi]
}
/** 범위 안에서 지워지는 값(0 아닌 숫자 · 빈 칸 아닌 글) — 있으면 합이 달라질 수 있음 */
function 범위빠짐(계획, c1, r1, c2, r2) {
  const { sst } = 계획
  let n = 0
  const a = 계획.빠짐
  let lo = 0, hi = a.length
  while (lo < hi) { const m = (lo + hi) >> 1; if (a[m] < r1) lo = m + 1; else hi = m }
  const 이미 = new Set()
  for (let i = lo; i < a.length && a[i] <= r2; i++) {
    const b = 계획.덩이of.get(a[i])
    for (const r of [b.r0, a[i]]) {
      if (r < r1 || r > r2 || 이미.has(r)) continue
      이미.add(r)
      for (let c = c1; c <= c2; c++) {
        const p = 칸풀이(계획, c, r)
        if (p.k !== 'gone' || !p.cell) continue
        const v = 값(p.cell, sst)
        if (v && ((v.k === 'n' && +v.v !== 0) || (v.k === 's' && v.v.trim()) || v.k === 'e')) n++
      }
    }
  }
  return n
}

/* ── 수식 ─────────────────────────────────────── */
const 참조 = /^(\$?)([A-Za-z]{1,3})(\$?)(\d{1,7})(?![0-9A-Za-z_.(])/
const 맨시트 = /^([A-Za-z0-9_.ㄱ-힝À-ɏ]+)!/
const 이름글자 = /[A-Za-z0-9_.$ㄱ-힝\]]/

/**
 * 수식 글을 옮깁니다.
 * ctx: { 계획들: Map(시트이름 → 계획), 시트: 이 수식이 있는 시트 이름, 덩이: 이 칸의 덩이(지운 줄의 수식을 끌어올 때만), 깊이, 알림(msg), 셈 }
 */
function 수식옮김(f, ctx) {
  const t1 = ctx.라벨풀이 === false ? f : 라벨풀이(f, ctx)
  return 참조옮김(t1, ctx)
}
function 참조옮김(f, ctx) {
  let out = ''
  let i = 0
  const n = f.length
  while (i < n) {
    const ch = f[i]
    if (ch === '"') {
      let j = i + 1
      while (j < n) { if (f[j] === '"') { if (f[j + 1] === '"') j += 2; else { j++; break } } else j++ }
      out += f.slice(i, j); i = j; continue
    }
    const prev = i > 0 ? f[i - 1] : ''
    /* [1]시트!A1 — 다른 통합 문서는 그대로 */
    if (ch === '[') {
      const j = f.indexOf(']', i)
      if (j > i) {
        let k = j + 1
        const m = 맨시트.exec(f.slice(k))
        if (m) k += m[0].length
        const r1 = 참조.exec(f.slice(k))
        if (r1) { k += r1[0].length; if (f[k] === ':') { const r2 = 참조.exec(f.slice(k + 1)); if (r2) k += 1 + r2[0].length } }
        out += f.slice(i, k); i = k; continue
      }
    }
    let sheet = null, k = i
    if (ch === "'" && !이름글자.test(prev)) {
      let j = i + 1
      while (j < n) { if (f[j] === "'") { if (f[j + 1] === "'") j += 2; else break } else j++ }
      if (f[j] === "'" && f[j + 1] === '!') { sheet = f.slice(i + 1, j).replace(/''/g, "'"); k = j + 2 }
      else { out += f.slice(i, j + 1); i = j + 1; continue }
      if (/^\[/.test(sheet)) { /* '[1]시트'!A1 — 다른 통합 문서 */
        let e = k
        const r1 = 참조.exec(f.slice(e))
        if (r1) { e += r1[0].length; if (f[e] === ':') { const r2 = 참조.exec(f.slice(e + 1)); if (r2) e += 1 + r2[0].length } }
        out += f.slice(i, e); i = e; continue
      }
    } else if (!이름글자.test(prev)) {
      const m = 맨시트.exec(f.slice(i))
      if (m) { sheet = m[1]; k = i + m[0].length }
    }
    if (sheet !== null || !이름글자.test(prev)) {
      const r1 = 참조.exec(f.slice(k))
      if (r1) {
        let e = k + r1[0].length
        let r2 = null
        if (f[e] === ':') { r2 = 참조.exec(f.slice(e + 1)); if (r2) e += 1 + r2[0].length }
        const 머리 = sheet !== null ? f.slice(i, k) : ''
        const 대상 = sheet !== null ? sheet : ctx.시트
        out += 한참조(대상, r1, r2, ctx, 머리)
        i = e; continue
      }
      if (sheet !== null) { out += f.slice(i, k); i = k; continue }
    }
    out += ch; i++
  }
  return out
}
/** 참조 하나(칸 또는 범위) */
/* 참조 하나(칸 또는 범위) — 머리(«내역서!» 같은 시트 이름)는 참조로 남을 때만 붙입니다(값 · 끌어온 수식이 되면 뗌) */
function 한참조(대상, r1, r2, ctx, 머리 = '') {
  const 글1 = r1[0], 글2 = r2 ? r2[0] : null
  if (ctx.수집) { ctx.수집(대상, r1, r2); return 머리 + (글2 ? 글1 + ':' + 글2 : 글1) }
  const 계획 = 대상 != null ? ctx.계획들.get(대상) : null
  if (!계획) return 머리 + (글2 ? 글1 + ':' + 글2 : 글1)
  const c1 = colToNum(r1[2]), row1 = +r1[4]
  if (!r2 || (colToNum(r2[2]) === c1 && +r2[4] === row1)) {
    const p = 칸풀이(계획, c1, row1)
    if (p.k === 'same') {
      const a = `${r1[1]}${r1[2]}${r1[3]}${p.row}`
      return 머리 + (r2 ? a + ':' + `${r2[1]}${r2[2]}${r2[3]}${p.row}` : a)
    }
    /* 안 줄인 시트가 지운 줄«만» 가리키던 것(당초 줄로 만든 집계표 같은 것) — 남긴 줄을 보게 다시 잇습니다
       · 줄인 시트의 덩이 밖 칸(머리 «금 ○○원» · 끝수 맞춤 칸)이 지운 줄«만» 가리키면 그 칸도(이어잇기) */
    if ((ctx.다시잇기 && ctx.시트 !== 계획.name) || ctx.이어잇기) {
      if (ctx.이어잇기) { if (ctx.이음) ctx.이음(계획.name, numToCol(c1) + row1) } else ctx.다시이음(계획.name)
      const n = 자리(계획, p.b.r0)
      const a = `${r1[1]}${r1[2]}${r1[3]}${n}`
      return 머리 + (r2 ? a + ':' + `${r2[1]}${r2[2]}${r2[3]}${n}` : a)
    }
    return 지운칸(계획, p, c1, row1, ctx, !!r2)
  }
  const c2 = colToNum(r2[2]), row2 = +r2[4]
  const lo = Math.min(row1, row2), hi = Math.max(row1, row2)
  /* 한 줄짜리 범위가 지운 줄 위에 있고 이 칸이 지운 줄«만» 보면 — 남긴 줄로(위와 같음) */
  if (ctx.이어잇기 && row1 === row2) {
    const b = 계획.덩이of.get(row1)
    if (b && !b.홀 && 칸풀이(계획, c1, row1).k === 'gone') {
      if (ctx.이음) ctx.이음(계획.name, `${numToCol(c1)}${row1}:${numToCol(c2)}${row2}`)
      const n = 자리(계획, b.r0)
      return 머리 + `${r1[1]}${r1[2]}${r1[3]}${n}:${r2[1]}${r2[2]}${r2[3]}${n}`
    }
  }
  const nr = 범위풀이(계획, Math.min(c1, c2), lo, Math.max(c1, c2), hi)
  if (!ctx.거른 && 범위빠짐(계획, Math.min(c1, c2), lo, Math.max(c1, c2), hi)) {
    ctx.알림(`범위 ${대상 === ctx.시트 ? '' : 대상 + '!'}${글1}:${글2} 안의 지운 줄(${계획.짝.상태.filter((s, i) => i !== 계획.짝.상태.indexOf(ctx.남길)).join(' · ')}) 값이 빠집니다 — 합이 달라질 수 있으니 이 칸을 확인해 주십시오`)
  }
  if (!nr && row1 === row2) {
    /* 한 줄짜리 범위(«'관급'!B5:N5» 같은 것)가 지운 줄에 있으면 — #REF! 대신 그 덩이의 남긴 줄로(글 칸은 당초 줄 글을 옮겨 왔으니 보이는 것도 같음) */
    const b = 계획.덩이of.get(row1)
    if (b && !b.홀) {
      ctx.알림(`범위 ${대상 === ctx.시트 ? '' : 대상 + '!'}${글1}:${글2} 는 지운 줄 하나에 있어 남긴 줄(${ctx.남길})로 이었습니다 — 그 줄 값을 봅니다`)
      const n = 자리(계획, b.r0)
      return 머리 + `${r1[1]}${r1[2]}${r1[3]}${n}:${r2[1]}${r2[2]}${r2[3]}${n}`
    }
  }
  if (!nr) {
    ctx.알림(`범위 ${글1}:${글2} 의 줄이 모두 지워져 #REF! 가 됩니다`)
    ctx.셈.깨짐++
    return '#REF!'
  }
  const [a, b] = row1 <= row2 ? nr : [nr[1], nr[0]]
  return 머리 + `${r1[1]}${r1[2]}${r1[3]}${a}:${r2[1]}${r2[2]}${r2[3]}${b}`
}
/** 지운 칸을 가리킬 때 — 같은 덩이면 그 수식을 끌어오고, 아니면 그때 값 */
function 지운칸(계획, p, c, r, ctx, 범위꼴) {
  const cell = p.cell
  const 같은덩이 = ctx.덩이 && ctx.덩이 === p.b && ctx.시트 === 계획.name
  if (!같은덩이) {
    /* 끌어오는 중에 «다른 덩이» 의 지운 칸을 만남 → 끌어오기를 그만두고 맨 바깥 칸을 그때 값으로(아래) */
    if (ctx.시도) { ctx.시도.넘음 = true; return '0' }
    ctx.셈.고정++; ctx.고정시트(계획.name)
    if (ctx.굳힘) ctx.굳힘(계획.name, numToCol(c) + r)
    if (ctx.덩이 !== undefined && ctx.시트 === 계획.name) ctx.셈.엇갈림.push(numToCol(c) + r)
    if (cell && cell.f && 값(cell, 계획.sst) == null) ctx.알림(`${계획.name}!${numToCol(c)}${r} 은 셈한 값이 저장돼 있지 않아 0 으로 남겼습니다`)
    return cell ? 고정값(cell, 계획.sst) : '0'
  }
  if (!cell) { ctx.셈.끌어옴++; return '0' }
  /* 같은 덩이(변경 단가 = 당초 단가 처럼) — 그 칸의 수식을 끌어와 잇습니다.
     끌어온 수식이 다른 덩이의 지운 칸까지 닿으면(증감 = 변경 − 당초 합계 같은 것) 그 칸은 그때 값으로 둡니다 */
  if (cell.f && cell.f.text && (ctx.깊이 || 0) < 8 && !/\st="array"/.test(cell.f.attrs)) {
    const 시도 = { 넘음: false }
    const 셈2 = { 끌어옴: 0, 고정: 0, 라벨: 0, 깨짐: 0, 엇갈림: [] }
    const 속 = 수식옮김(cell.f.text, { ...ctx, 시트: 계획.name, 덩이: p.b, 깊이: (ctx.깊이 || 0) + 1, 시도, 셈: 셈2, 알림: () => {}, 고정시트: () => {}, 굳힘: null })
    if (!시도.넘음) {
      ctx.셈.끌어옴 += 1 + 셈2.끌어옴; ctx.셈.라벨 += 셈2.라벨
      /* 칸 하나 · 0 이상 수 하나면 괄호 없이(«=(F8)*0.045» → «=F8*0.045») */
      const 맨 = 속.trim()
      if (/^(?:(?:'(?:[^']|'')+'|[A-Za-z0-9_.ㄱ-힝]+)!)?\$?[A-Za-z]{1,3}\$?\d{1,7}$/.test(맨) || /^\d+(?:\.\d+)?$/.test(맨)) return 맨
      return '(' + 속 + ')'
    }
    if (ctx.시도) { ctx.시도.넘음 = true; return '0' }
  }
  ctx.셈.끌어옴++
  if (cell.f && 값(cell, 계획.sst) == null) ctx.알림(`${계획.name}!${numToCol(c)}${r} 은 셈한 값이 저장돼 있지 않아 0 으로 남겼습니다`)
  return 고정값(cell, 계획.sst)
}

/* 라벨로 거른 합계 — SUMIF(라벨,"변경",범위) → SUM(범위) · 다른 상태 → 0 */
function 라벨범위(t, ctx) {
  const m = /^(?:'((?:[^']|'')*)'!|([A-Za-z0-9_.ㄱ-힝]+)!)?\$?([A-Za-z]{1,3})\$?(\d{1,7}):\$?([A-Za-z]{1,3})\$?(\d{1,7})$/.exec(t.trim())
  if (!m) return null
  const sh = m[1] != null ? m[1].replace(/''/g, "'") : m[2] != null ? m[2] : ctx.시트
  const 계획 = ctx.계획들.get(sh)
  if (!계획 || !계획.짝.라벨칸) return null
  const c1 = colToNum(m[3]), c2 = colToNum(m[5])
  return c1 === c2 && c1 === 계획.짝.라벨칸 ? 계획 : null
}
function 조건말(t, ctx) {
  const s = t.trim()
  const q = /^"((?:[^"]|"")*)"$/.exec(s)
  if (q) return 상태말(q[1].replace(/""/g, '"').replace(/^=/, ''))
  const m = /^(?:'((?:[^']|'')*)'!|([A-Za-z0-9_.ㄱ-힝]+)!)?\$?([A-Za-z]{1,3})\$?(\d{1,7})$/.exec(s)
  if (m) {
    const sh = m[1] != null ? m[1].replace(/''/g, "'") : m[2] != null ? m[2] : ctx.시트
    const 책시트 = ctx.시트들.get(sh)
    if (!책시트) return null
    const row = 책시트.rows.get(+m[4]); const cell = row && row.cells.get(colToNum(m[3]))
    const v = 값(cell, ctx.sst)
    return v && v.k === 's' ? 상태말(v.v) : null
  }
  return null
}
function 라벨풀이(f, ctx) {
  if (!/(SUMIFS?|COUNTIFS?)\s*\(/i.test(f)) return f
  let out = ''
  let i = 0
  while (i < f.length) {
    const ch = f[i]
    if (ch === '"') {
      let j = i + 1
      while (j < f.length) { if (f[j] === '"') { if (f[j + 1] === '"') j += 2; else { j++; break } } else j++ }
      out += f.slice(i, j); i = j; continue
    }
    const prev = i > 0 ? f[i - 1] : ''
    const m = !/[A-Za-z0-9_.$!]/.test(prev) && /^(SUMIFS|SUMIF|COUNTIFS|COUNTIF)\s*\(/i.exec(f.slice(i, i + 12))
    if (m) {
      const fn = m[1].toUpperCase()
      const a = splitArgs(f, i + m[0].length)
      if (a) {
        const t = a.args.map(([x, y]) => f.slice(x, y))
        let 새 = null
        if (fn === 'SUMIF' && (t.length === 2 || t.length === 3)) {
          const pl = 라벨범위(t[0], ctx), w = pl ? 조건말(t[1], ctx) : null
          if (pl && w) 새 = w === ctx.남길 ? `SUM(${(t[2] ?? t[0]).trim()})` : '0'
        } else if (fn === 'COUNTIF' && t.length === 2) {
          const pl = 라벨범위(t[0], ctx), w = pl ? 조건말(t[1], ctx) : null
          if (pl && w && w !== ctx.남길) 새 = '0'
        } else if ((fn === 'SUMIFS' && t.length >= 3 && t.length % 2 === 1) || (fn === 'COUNTIFS' && t.length >= 2 && t.length % 2 === 0)) {
          const 첫 = fn === 'SUMIFS' ? 1 : 0
          const 남은 = []
          let 영 = false, 뺌 = 0
          for (let k = 첫; k + 1 < t.length + (fn === 'SUMIFS' ? 0 : 0) && k < t.length; k += 2) {
            const pl = 라벨범위(t[k], ctx), w = pl ? 조건말(t[k + 1], ctx) : null
            if (pl && w) { if (w !== ctx.남길) 영 = true; 뺌++; continue }
            남은.push(t[k], t[k + 1])
          }
          if (영) 새 = '0'
          else if (뺌) {
            /* 조건이 하나 남으면 SUMIF · COUNTIF 로 되돌림(우리 2줄 변환이 SUMIF 를 SUMIFS 로 바꾼 것 — 원래 꼴로) */
            if (fn === 'SUMIFS') 새 = 남은.length === 2 ? `SUMIF(${남은[0].trim()},${남은[1].trim()},${t[0].trim()})` : 남은.length ? `SUMIFS(${[t[0], ...남은].map((x) => x.trim()).join(',')})` : `SUM(${t[0].trim()})`
            else if (남은.length) 새 = 남은.length === 2 ? `COUNTIF(${남은[0].trim()},${남은[1].trim()})` : `COUNTIFS(${남은.map((x) => x.trim()).join(',')})`
          }
        }
        if (새 !== null) {
          ctx.셈.라벨++
          ctx.거른범위 = true
          if (새 === '0') {
            /* 앞의 + · − 와 함께 지웁니다 — (SUM(…)-SUMIF(…,"당초",…)) → (SUM(…)) */
            const 앞 = out.replace(/\s+$/, '')
            const o = 앞.slice(-1)
            if (o === '-' || o === '+') { out = 앞.slice(0, -1); i = a.end + 1; continue }
            /* 🩹 G689 빼는 몫이 아니라 «지운 줄(당초)만 더하던» 식 — 1줄엔 그 줄이 없어 0 이 됨 → 그 칸은 그때 값으로(옮겨 가 봄)
               (2줄 파일의 홀 줄 · 합계 줄이 SUMIF(…,"당초",…) 만 더하던 것 — 전엔 조용히 0 · «SUM(0)*10%») */
            ctx.지운상태만 = true
            out += '0'; i = a.end + 1; continue
          }
          out += 라벨풀이(새, ctx)
          ctx.거른범위 = true
          i = a.end + 1; continue
        }
      }
    }
    out += ch; i++
  }
  /* «0+…» 처럼 맨 앞에 남은 0 */
  out = out.replace(/^(\(*)0\+/, '$1').replace(/\(0\+/g, '(').replace(/,0\+/g, ',')
  out = 겹SUM풀기(out)
  /* 라벨로 거른 식이었으면 — 우리 2줄 변환이 만든 꼴을 원래 꼴로(조건 하나 남은 SUMIFS → SUMIF · 함수 하나를 감싼 괄호)
     🩹 G689 · 2줄 파일에서 이미 «함수 하나를 감싼» 괄호는 사람이 쓴 것 → 그대로(«TRUNC((SUM(…)),0)» 의 괄호를 떼던 것 — 실제 설계내역서 되돌림 D46)
        괄호를 뗀 뒤 생긴 «SUM(SUM(범위))» 도 한 번 더 풂(«SUM((SUM(…)-SUMIF(…)))*10%» → 전엔 «SUM(SUM(…))*10%» 로 남음 — D47) */
  if (ctx.거른범위) out = 겹SUM풀기(괄호풀기(SUMIFS하나(out), 홑괄호들(f)))
  return out
}
/* SUMIFS(합범위,조건범위,조건) — 조건이 하나면 SUMIF(조건범위,조건,합범위) */
function SUMIFS하나(f) {
  let out = '', i = 0
  while (i < f.length) {
    const ch = f[i]
    if (ch === '"') { let j = i + 1; while (j < f.length) { if (f[j] === '"') { if (f[j + 1] === '"') j += 2; else { j++; break } } else j++ } out += f.slice(i, j); i = j; continue }
    const prev = i > 0 ? f[i - 1] : ''
    const m = !/[A-Za-z0-9_.$!]/.test(prev) && /^SUMIFS\s*\(/i.exec(f.slice(i, i + 9))
    if (m) {
      const a = splitArgs(f, i + m[0].length)
      if (a && a.args.length === 3) {
        const t = a.args.map(([x, y]) => SUMIFS하나(f.slice(x, y)).trim())
        out += `SUMIF(${t[1]},${t[2]},${t[0]})`
        i = a.end + 1; continue
      }
    }
    out += ch; i++
  }
  return out
}
/* 홑괄호(함수 괄호가 아닌 «(») 를 차례로 — 저마다 «함수 하나만 감쌌나» · 글자(«…») 안 괄호는 셈 안 함 */
const 이름글 = /[A-Za-z0-9_.$]/
function 함수하나감쌈(t, i) {
  const a = splitArgs(t, i + 1)
  if (!a || a.args.length !== 1) return { a, 속: null }
  const 속 = t.slice(a.args[0][0], a.args[0][1]).trim()
  const m = /^[A-Za-z][A-Za-z0-9.]*\(/.exec(속)
  if (!m) return { a, 속: null }
  const b = splitArgs(속, m[0].length)
  return { a, 속: b && b.end === 속.length - 1 ? 속 : null }
}
function 홑괄호들(f) {
  const 들 = []
  for (let i = 0; i < f.length; i++) {
    const ch = f[i]
    if (ch === '"') { let j = i + 1; while (j < f.length) { if (f[j] === '"') { if (f[j + 1] === '"') j += 2; else break } else j++ } i = j; continue }
    if (ch !== '(' || (i > 0 && 이름글.test(f[i - 1]))) continue
    들.push(!!함수하나감쌈(f, i).속)
  }
  return 들
}
/* (함수(…)) — 여는 괄호 앞이 «(» · «,» · 맨 앞이면 감싼 괄호를 뗌
   원 = 2줄 파일 식의 홑괄호들(같은 차례) — 거기서 이미 «함수 하나를 감싼» 괄호는 사람이 쓴 것이라 그대로(수가 안 맞으면 전처럼 모두 봄) */
function 괄호풀기(f, 원 = null) {
  let out = f
  const 표 = 원 && 홑괄호들(out).length === 원.length ? 원.slice() : null
  for (let n = 0; n < 50; n++) {
    let 바뀜 = false
    let k = -1
    for (let i = 0; i < out.length; i++) {
      const ch = out[i]
      if (ch === '"') { let j = i + 1; while (j < out.length) { if (out[j] === '"') { if (out[j + 1] === '"') j += 2; else break } else j++ } i = j; continue }
      if (ch !== '(') continue
      const prev = i > 0 ? out[i - 1] : ''
      if (prev && 이름글.test(prev)) continue        /* 함수 괄호 */
      k++
      if (prev && prev !== '(' && prev !== ',' && prev !== '=') continue
      const { a, 속 } = 함수하나감쌈(out, i)
      if (!속) continue
      const 뒤 = out[a.end + 1] || ''
      if (뒤 && !/[,)]/.test(뒤)) continue          /* (SUMIF(…))*0.03 같은 것은 그대로 */
      if (표 && 표[k]) continue                      /* 2줄 파일에서도 함수 하나를 감쌌던 괄호 — 사람이 쓴 것 */
      out = out.slice(0, i) + 속 + out.slice(a.end + 1)
      if (표) 표.splice(k, 1)
      바뀜 = true
      break
    }
    if (!바뀜) break
  }
  return out
}
/* SUM(SUM(범위)) → SUM(범위) — 2줄 변환이 SUM(범위) 를 SUM(SUMIF(…)) 로 감싼 것을 되돌릴 때 */
function 겹SUM풀기(f) {
  let out = f
  for (let n = 0; n < 50; n++) {
    const i = out.search(/(?<![A-Za-z0-9_.$!])SUM\(\s*SUM\(/i)
    if (i < 0) break
    const a = splitArgs(out, out.indexOf('(', i) + 1)
    if (!a || a.args.length !== 1) break
    const 속 = out.slice(a.args[0][0], a.args[0][1]).trim()
    const b = /^SUM\(/i.test(속) ? splitArgs(속, 속.indexOf('(') + 1) : null
    if (!b || b.end !== 속.length - 1) break
    out = out.slice(0, i) + 속 + out.slice(a.end + 1)
  }
  return out
}

/* 수식 전체를 감싼 괄호 한 겹 — 없으면 null */
function 한겹뗌(t) {
  t = String(t).trim()
  if (!(t.startsWith('(') && t.endsWith(')'))) return null
  let d = 0
  for (let i = 0; i < t.length; i++) {
    const ch = t[i]
    if (ch === '"') { i++; while (i < t.length && !(t[i] === '"' && t[i + 1] !== '"')) i += t[i] === '"' ? 2 : 1; continue }
    if (ch === '(') d++
    else if (ch === ')') { d--; if (d === 0 && i < t.length - 1) return null }
  }
  return t.slice(1, -1).trim()
}
function 겹수(t) {
  let x = String(t).trim(), n = 0
  for (; n < 3; n++) { const u = 한겹뗌(x); if (u == null) break; x = u }
  return n
}
/* 수식 전체를 감싼 괄호 — 끌어온 수식 «(…)» 만 남은 꼴. 원(원래 수식)을 주면 «원래보다 늘어난 겹» 만 뗍니다
   (원래 «=(D24*F24)» 처럼 사람이 쓴 괄호는 그대로 — 전엔 모든 수식에서 떼어 원본 수식 글이 바뀌었음) */
export function 바깥괄호뗌(f, 원) {
  let t = String(f).trim()
  let 뗄 = 원 == null ? 3 : 겹수(t) - 겹수(원)
  for (; 뗄 > 0; 뗄--) { const u = 한겹뗌(t); if (u == null) break; t = u }
  return t
}
/* ── 칸 하나 다시 쓰기 ── */
function 칸쓰기(cell, newRef, newS, 새f, extra) {
  let open = setAttr(cell.open.replace(/\/>$/, '>'), 'r', newRef)
  if (newS != null) open = setAttr(open, 's', String(newS))
  else open = open.replace(/\ss="[^"]*"/, '')
  if (extra && extra.빈) {
    open = open.replace(/\st="[^"]*"/, '')
    return open.replace(/>$/, '/>')
  }
  if (새f === undefined || !cell.f) {
    const body = cell.self ? '' : cell.body
    return body ? `${open}${body}</c>` : open.replace(/>$/, '/>')
  }
  /* 안 바뀐 수식은 글 그대로(괄호 · 값 하나 수식도 사람이 쓴 그대로) */
  const 바뀜 = 새f !== cell.f.text
  if (바뀜) 새f = 바깥괄호뗌(새f, cell.f.text)
  /* 수식이 «값 하나» 가 되면 값 칸으로(1줄 내역서 원래 모양) — 우리가 바꾼 수식만 */
  const t = 새f.trim()
  const 수 = 바뀜 && /^\(?(-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?)\)?$/.exec(t)
  if (수 && !/\st="array"/.test(cell.f.attrs)) {
    open = open.replace(/\st="[^"]*"/, '')
    return `${open}<v>${수[1]}</v></c>`
  }
  const 글 = 바뀜 && /^"((?:[^"]|"")*)"$/.exec(t)
  if (글 && !/\st="array"/.test(cell.f.attrs)) {
    open = open.replace(/\st="[^"]*"/, '')
    open = setAttr(open, 't', 'inlineStr')
    return `${open}<is><t xml:space="preserve">${esc(글[1].replace(/""/g, '"'))}</t></is></c>`
  }
  let at = ''
  if (/\st="array"/.test(cell.f.attrs)) {
    const 태그 = '<f' + cell.f.attrs.replace(/\/$/, '') + '>'
    at = ' t="array"'
    if (extra && extra.배열ref) at += ` ref="${extra.배열ref}"`
    const aca = attr(태그, 'aca'); if (aca) at += ` aca="${aca}"`
  }
  const 나머지 = cell.body.replace(/<f\b[^>]*(?:\/>|>[\s\S]*?<\/f>)/, '')
  return `${open}<f${at}>${esc(새f)}</f>${나머지}</c>`
}

/**
 * 2줄 → 1줄
 * @param buf ArrayBuffer
 * @param opts {sheets: [path…], 남길: '변경'|'당초'|상태 이름}
 * @returns {{data: Uint8Array, report}}
 */
export function 한줄로(buf, opts = {}) {
  const 남길 = opts.남길 || '변경'
  const 책 = 책열기(buf)
  const { zip, sst } = 책
  const 고른 = new Set(opts.sheets || [])
  const report = { sheets: [], warns: [], 고정: {}, 셈: null }
  const 지도 = opts.지도 ? {} : null         /* 시험용 — 시트마다 «새 칸 → 옛 칸» */
  const 계획들 = new Map()
  const 시트들 = new Map()
  const 색 = 색판별(zip)
  for (const s of 책.sheets) 시트들.set(s.name, s.시트)
  for (const s of 책.sheets) {
    if (!고른.has(s.path)) continue
    const 짝 = 짝찾기(s.시트, sst)
    if (!짝.덩이.length || 짝.상태.length < 2) throw new Error(`«${s.name}» 시트는 당초 · 변경 짝 줄을 못 찾았습니다(${짝.까닭 || 짝.꼴}) — 바꾸지 않았습니다.`)
    if (!짝.상태.includes(남길)) throw new Error(`«${s.name}» 시트에는 «${남길}» 줄이 없습니다(있는 줄: ${짝.상태.join(' · ')}).`)
    계획들.set(s.name, 계획짓기(s, 짝, 남길, sst, 색))
  }
  if (!계획들.size) throw new Error('줄일 시트를 하나 이상 고르십시오.')

  const 셈 = { 끌어옴: 0, 고정: 0, 라벨: 0, 깨짐: 0, 엇갈림: [], 수식칸: 0, 이음: 0 }
  const 알림 = (path, ref) => (msg) => report.warns.push({ path, ref, msg })
  const 고정시트 = new Map()        /* 수식이 있는 시트 → 그때 값으로 남긴 칸 수 */
  const 다시이음 = new Map()        /* 수식이 있는 시트 → 다시 이은 칸 수 */
  const 굳힘 = []                   /* 그때 값으로 굳힌 칸 — {path, ref(그 칸), 원(가리키던 지운 칸)} · 300개까지 */
  const 이음 = []                   /* 지운 줄만 보던 덩이 밖 칸을 남긴 줄로 이은 것 — 같은 꼴 */
  const 문맥 = (시트이름, path, ref, 덩이) => ({
    계획들, 시트들, sst, 남길, 시트: 시트이름, 덩이, 깊이: 0, 셈, 거른: false,
    다시잇기: 다시잇는시트.has(시트이름),
    다시이음: () => 다시이음.set(시트이름, (다시이음.get(시트이름) || 0) + 1),
    알림: 알림(path, ref), 고정시트: () => 고정시트.set(시트이름, (고정시트.get(시트이름) || 0) + 1),
    굳힘: (원시트, 원칸) => { if (굳힘.length < 300) 굳힘.push({ path, ref, 원: (원시트 === 시트이름 ? '' : 원시트 + '!') + 원칸 }) },
    이음: (원시트, 원칸) => { 셈.이음++; if (이음.length < 300) 이음.push({ path, ref, 원: (원시트 === 시트이름 ? '' : 원시트 + '!') + 원칸 }) },
  })
  /* 줄인 시트의 덩이 밖 칸 — 수식이 줄인 시트의 «지운 줄» 만 보고 «남긴 줄» 은 안 보면 남긴 줄로 잇습니다.
     (머리 «금 ○○원» · 끝수 맞춤 칸처럼 1줄 문서에서는 남긴 줄(변경)을 봐야 맞는 칸 — 그때 값으로 굳히면 당초 금액이 남음)
     둘 다 보면(증감 = 변경 − 당초 같은 것) 지금처럼 지운 쪽만 그때 값 */
  const 지운줄만 = (text, 시트이름) => {
    let 지울 = 0, 남는 = 0
    참조옮김(text, {
      시트: 시트이름, 라벨풀이: false,
      수집: (대상, r1, r2) => {
        const 계 = 대상 != null ? 계획들.get(대상) : null
        if (!계) return
        const c1 = colToNum(r1[2]), row1 = +r1[4]
        if (r2 && +r2[4] !== row1) {
          for (let r = Math.min(row1, +r2[4]), n = 0; r <= Math.max(row1, +r2[4]) && n < 100000; r++, n++) { const b = 계.덩이of.get(r); if (b && !b.홀) { 남는++; break } }
          return
        }
        const b = 계.덩이of.get(row1)
        if (!b || b.홀) return
        if (칸풀이(계, c1, row1).k === 'gone') 지울++
        else 남는++
      },
    })
    return 지울 > 0 && 남는 === 0
  }
  const 옮겨 = (text, ctx, 칸) => {
    const t1 = 라벨풀이(text, ctx)
    ctx.거른 = !!ctx.거른범위
    /* 🩹 G689 지운 줄(당초)만 더하던 칸 — 1줄로 옮기면 0 이 되므로 그 칸은 그때 값(2줄 파일이 보이던 숫자 그대로) + 알림 */
    if (ctx.지운상태만 && 칸) {
      셈.고정++; ctx.고정시트()
      if (ctx.굳힘) ctx.굳힘(ctx.시트, '지운 줄만 더하던 식')
      ctx.알림('지운 줄만 더하던 칸이라 1줄에선 0 이 됩니다 — 그때 값(숫자 그대로)으로 두었습니다. 남긴 줄 합계가 필요하면 그 칸 수식을 다시 넣어 주십시오.')
      return 고정값(칸, sst)
    }
    return 참조옮김(t1, ctx)
  }

  /* ── 안 줄인 시트가 줄인 시트를 어떻게 가리키나 ──
     기본(값): 지운 줄을 가리키던 칸은 «그때 값» 으로 — 어느 시트의 값도 바뀌지 않습니다(대비표의 당초 칸 · 숨은 당초 원가계산서).
     잇기(사람이 고름): 지운 줄«만» 가리키던 시트(당초 줄을 보던 1줄 집계표)는 남긴 줄을 보게 다시 이음 —
       ⚠️ 그 시트 값이 당초 → 변경으로 바뀌고 그 시트를 보는 셈도 같이 바뀝니다(실제 변경내역서에서 숨은 당초 제경비 시트를 잇자
       제경비산출서(변경)의 «당초 비율» 셈까지 바뀌었음 — 그래서 기본이 아님). 둘 다 가리키는 대비표는 언제나 그때 값. */
  const 다시잇는시트 = new Set()
  const 딴시트 = {}
  for (const s of 책.sheets) {
    if (계획들.has(s.name)) continue
    let 지울 = 0, 남는 = 0
    for (const rn of s.시트.순) {
      for (const c of s.시트.rows.get(rn).cells.values()) {
        if (!c.f || !c.f.text) continue
        참조옮김(c.f.text, {
          시트: s.name, 라벨풀이: false,
          수집: (대상, r1, r2) => {
            if (r2 || 대상 == null || 대상 === s.name) return
            const 계획 = 계획들.get(대상)
            if (!계획) return
            const p = 칸풀이(계획, colToNum(r1[2]), +r1[4])
            if (p.k === 'gone' && p.cell) 지울++
            else if (계획.덩이of.get(+r1[4]) && !계획.덩이of.get(+r1[4]).홀) 남는++
          },
        })
      }
    }
    if (지울 || 남는) 딴시트[s.name] = { 지울, 남는 }
    if (지울 && !남는 && opts.딴시트 === '잇기') 다시잇는시트.add(s.name)
  }

  /* ── 시트마다 ── */
  for (const s of 책.sheets) {
    const 계획 = 계획들.get(s.name)
    const 시트 = s.시트
    if (!시트.sd) continue
    let xml = 시트.xml
    const 줄글 = []
    let 바뀜 = false
    const 지 = 지도 ? (지도[s.name] = {}) : null
    const 고정앞 = 셈.고정
    for (const rn of 시트.순) {
      const row = 시트.rows.get(rn)
      const b = 계획 ? 계획.덩이of.get(rn) : null
      if (계획 && b && !b.홀 && rn !== b.r0) { 바뀜 = true; continue }      /* 지운 줄 */
      const nr = 계획 ? 자리(계획, rn) : rn
      const 셀들 = []
      if (계획 && b && !b.홀) {
        /* 덩이 → 한 줄: 칸마다 출처 줄에서 · 서식은 «보통 글씨» 상태 줄(가리기 어려우면 남길 줄)에서 */
        const cols = new Set()
        for (const r of b.rows) { const rr = 시트.rows.get(r); if (rr) for (const c of rr.cells.keys()) cols.add(c) }
        const 서식줄 = 서식줄고름(계획, b)
        for (const c of [...cols].sort((x, y) => x - y)) {
          const src = 출처(계획, b, c)
          const 서칸 = 칸얻기(계획, c, 서식줄)
          const 원 = src != null ? 칸얻기(계획, c, src) : null
          const 첫칸 = 칸얻기(계획, c, b.r0)
          const ref = numToCol(c) + nr
          const 서식 = 서칸 ? 서칸.s : 원 ? 원.s : 첫칸 ? 첫칸.s : null
          if (!원) {
            const 빈칸 = 서칸 || 첫칸
            if (빈칸) 셀들.push(칸쓰기(빈칸, ref, 서식, undefined, { 빈: true }))
            continue
          }
          if (지) 지[ref] = numToCol(c) + src
          let 새f
          if (원.f) {
            셈.수식칸++
            const ctx = 문맥(s.name, s.path, ref, b)
            새f = 원.f.text ? 옮겨(원.f.text, ctx, 원) : ''
          }
          셀들.push(칸쓰기(원, ref, 서식, 새f, 배열ref(원, src, nr)))
        }
        바뀜 = true
      } else {
        for (const c of row.cells.values()) {
          const ref = numToCol(c.col) + nr
          if (지) 지[ref] = numToCol(c.col) + rn
          let 새f
          if (c.f && c.f.text) {
            if (계획) 셈.수식칸++
            const ctx = 문맥(s.name, s.path, ref, undefined)
            if (계획 && 지운줄만(c.f.text, s.name)) ctx.이어잇기 = true
            새f = 옮겨(c.f.text, ctx, c)
            if (새f !== c.f.text) 바뀜 = true
          }
          if (nr !== rn) 바뀜 = true
          셀들.push(새f === undefined && nr === rn ? c.open.endsWith('/>') ? c.open : `${c.open}${c.body}</c>` : 칸쓰기(c, ref, c.s, 새f, 배열ref(c, rn, nr)))
        }
      }
      let 원줄 = row.open
      if (계획 && b && !b.홀) {
        const 서r = 시트.rows.get(서식줄고름(계획, b))
        if (서r) 원줄 = 서r.open
        /* 품명이 두 줄로 감긴 당초 줄처럼 더 높은 줄이 있으면 그 높이 */
        let 높 = 0
        for (const r of b.rows) { const rr = 시트.rows.get(r); const h = rr ? +(attr(rr.open, 'ht') || 0) : 0; if (h > 높) 높 = h }
        const 지금높 = +(attr(원줄, 'ht') || 0)
        if (높 > 지금높 && 지금높 > 0) 원줄 = setAttr(원줄, 'ht', String(높))
      }
      const 열림 = setAttr(원줄.replace(/\s*\/>$/, '>'), 'r', String(nr))
      줄글.push(셀들.length ? `${열림}${셀들.join('')}</row>` : 열림.replace(/>$/, '/>'))
    }
    if (계획) {
      const 고정이시트 = 셈.고정 - 고정앞
      report.sheets.push({
        path: s.path, name: s.name, 꼴: 계획.짝.꼴,
        짝: 계획.덩이.filter((d) => !d.홀).length, 홀: 계획.덩이.filter((d) => d.홀).length,
        지운줄: 계획.빠짐.length, 줄전: 시트.끝줄, 줄후: 시트.끝줄 - 앞지움(계획, 시트.끝줄 + 1), 고정: 고정이시트,
      })
    }
    if (!바뀜 && !계획) {
      /* 줄 번호가 그대로인 시트 — 수식만 바뀌었으면 위에서 바뀜=true */
    }
    if (바뀜 || 계획) {
      xml = xml.slice(0, 시트.sd.innerStart) + 줄글.join('') + xml.slice(시트.sd.end)
      if (시트.sd.닫힘) xml = xml.replace(/<sheetData\b([^>]*)\/>/, `<sheetData$1>${줄글.join('')}</sheetData>`)
    }
    if (계획) xml = 시트나머지(xml, 계획, (text, ref) => 옮겨(text, 문맥(s.name, s.path, ref, undefined)), report)
    else xml = 남시트나머지(xml, (text, ref) => 옮겨(text, 문맥(s.name, s.path, ref, undefined)))
    zip[s.path] = strToU8(xml)
    /* 메모 · 그림 */
    if (계획) 딸린것(zip, s.path, 계획, report)
  }
  for (const [nm, n] of 고정시트) report.고정[nm] = n
  report.다시이음 = Object.fromEntries(다시이음)
  report.딴시트 = 딴시트

  /* ── 이름 정의(인쇄 영역 · 인쇄 제목 · 이름 붙인 칸) ── */
  if (zip['xl/workbook.xml']) {
    let wb = strFromU8(zip['xl/workbook.xml'])
    const 차례 = sheetOrder(zip)
    const 이름 = sheetNames(zip)
    wb = wb.replace(/<definedName\b([^>]*)>([\s\S]*?)<\/definedName>/g, (all, at, body) => {
      const lsi = attr('<x' + at + '>', 'localSheetId')
      const 시트이름 = lsi != null ? 이름[차례[+lsi]] : null
      const ctx = 문맥(시트이름, '', '이름 정의', undefined)
      ctx.거른 = true
      const nb = 참조옮김(unesc(body), ctx)
      return nb === unesc(body) ? all : `<definedName${at}>${esc(nb)}</definedName>`
    })
    if (/<calcPr\b[^>]*\/>/.test(wb)) wb = wb.replace(/<calcPr\b[^>]*\/>/, (t) => setAttr(t, 'fullCalcOnLoad', '1'))
    else wb = wb.replace('</workbook>', '<calcPr calcId="0" fullCalcOnLoad="1"/></workbook>')
    zip['xl/workbook.xml'] = strToU8(wb)
  }
  /* 계산 사슬은 지웁니다 — 줄이 바뀌었으니 엑셀이 다시 만들게 */
  if (zip['xl/calcChain.xml']) {
    delete zip['xl/calcChain.xml']
    if (zip['[Content_Types].xml']) zip['[Content_Types].xml'] = strToU8(strFromU8(zip['[Content_Types].xml']).replace(/<Override[^>]*calcChain\.xml[^>]*\/>/g, ''))
    if (zip['xl/_rels/workbook.xml.rels']) zip['xl/_rels/workbook.xml.rels'] = strToU8(strFromU8(zip['xl/_rels/workbook.xml.rels']).replace(/<Relationship[^>]*calcChain\.xml[^>]*\/>/g, ''))
  }
  /* 차트 · 표가 줄인 시트를 가리키면 알림 */
  const 고른이름 = [...계획들.keys()]
  for (const p of Object.keys(zip)) {
    if (!/^xl\/charts\/chart\d+\.xml$/.test(p)) continue
    const x = strFromU8(zip[p])
    if (고른이름.some((nm) => x.includes(nm + '!') || x.includes(`'${nm.replace(/'/g, "''")}'!`))) report.warns.push({ path: '', ref: '차트', msg: '차트가 줄인 시트의 범위를 가리킵니다 — 차트 범위는 손대지 않았습니다. 확인해 주십시오' })
  }
  /* 엇갈림 — 남은 수식이 지운 «다른 덩이» 칸을 가리킴 = 짝이 틀렸을 수 있음 → 많으면 바꾸지 않고 멈춤(틀린 1줄보다 낫습니다) */
  if (셈.엇갈림.length > Math.max(20, (셈.수식칸 || 0) * 0.02)) {
    throw new Error(`당초 · 변경 짝이 맞지 않는 것 같아 바꾸지 않았습니다 — 남길 줄의 수식 ${셈.엇갈림.length}곳이 지울 «다른 품목» 줄을 가리킵니다(예: ${셈.엇갈림.slice(0, 4).join(' · ')}). 고른 시트를 다시 보시거나, 이상하면 맵톡으로 알려 주십시오.`)
  }
  report.셈 = { ...셈, 엇갈림: 셈.엇갈림.slice(0, 20), 엇갈림수: 셈.엇갈림.length }
  report.굳힘 = 굳힘
  report.이음 = 이음
  {
    const seen = new Set()
    report.warns = report.warns.filter((w) => { const key = `${w.path}|${w.ref}|${w.msg}`; if (seen.has(key)) return false; seen.add(key); return true })
  }
  const data = zipSync(zip, { level: 6 })
  if (지도) report.지도 = 지도
  return { data, report }
}
/* 덩이의 서식 줄 — 보통 글씨 상태 줄 → 남길 줄 → 첫 줄 */
function 서식줄고름(계획, b) {
  if (계획.무늬 != null) for (const r of b.rows) if (b.상태.get(r) === 계획.무늬 && 계획.시트.rows.has(r)) return r
  if (b.남길 != null && 계획.시트.rows.has(b.남길)) return b.남길
  return b.r0
}
/* 배열 수식 ref 옮기기 */
function 배열ref(c, 옛줄, 새줄) {
  if (!c.f || !/\st="array"/.test(c.f.attrs)) return null
  const rf = attr('<f' + c.f.attrs.replace(/\/$/, '') + '>', 'ref') || ''
  const d = 새줄 - 옛줄
  return { 배열ref: rf.replace(/([A-Za-z]{1,3})(\d+)/g, (_, col, r) => col + (+r + d)) }
}

/* ── 시트의 나머지(병합 · 조건부 서식 · 유효성 · 하이퍼링크 · 페이지 나눔 · 크기) ── */
function 칸자리(계획, c, r) {
  const b = 계획.덩이of.get(r)
  if (!b || b.홀) return 자리(계획, r)
  return 자리(계획, b.r0)
}
function 범위글옮김(계획, ref) {
  /* «B5:F6» · «C15» — 병합 · sqref 용(값이 아니라 자리) */
  const m = /^(\$?)([A-Za-z]{1,3})(\$?)(\d+)(?::(\$?)([A-Za-z]{1,3})(\$?)(\d+))?$/.exec(ref)
  if (!m) return ref
  const c1 = colToNum(m[2]), r1 = +m[4]
  const a = 칸자리(계획, c1, r1)
  if (!m[6]) return `${m[1]}${m[2]}${m[3]}${a}`
  const r2 = +m[8]
  const b = 칸자리(계획, colToNum(m[6]), r2)
  return `${m[1]}${m[2]}${m[3]}${Math.min(a, b)}:${m[5]}${m[6]}${m[7]}${Math.max(a, b)}`
}
function 시트나머지(xml, 계획, 옮겨, report) {
  /* 병합 — 덩이 첫 줄의 병합이 먼저 · 겹치면 뒤의 것을 버림 · 1칸짜리는 버림 */
  const mb = sliceList(xml, 'mergeCells')
  if (mb) {
    const 후보 = []
    for (const it of splitItems(mb.inner, 'mergeCell')) {
      const m = /^\$?([A-Za-z]{1,3})\$?(\d+)(?::\$?([A-Za-z]{1,3})\$?(\d+))?$/.exec(attr(it, 'ref') || '')
      if (!m) { 후보.push({ 순: 2, it }); continue }
      const c1 = colToNum(m[1]), r1 = +m[2], c2 = m[3] ? colToNum(m[3]) : c1, r2 = m[4] ? +m[4] : r1
      const b = 계획.덩이of.get(r1)
      let 순 = 0
      if (b && !b.홀) {
        /* 덩이 안 병합은 «그 칸 글을 가져온 줄» 의 것만 — 변경 줄 칸을 남겼는데 당초 줄의 넓은 병합이 덮으면 값이 숨음 */
        const src = 출처(계획, b, c1)
        if (src === r1) 순 = 0
        else if (src != null && src > r1 && src <= r2 && (계획.시트.숨은.get(c1 + ',' + src) || {}).r === r1) 순 = 0   /* 출처가 이 병합 아래 숨은 남길 칸 */
        else if (src == null && r1 === 서식줄고름(계획, b)) 순 = 1
        else continue
        /* 병합 안(왼쪽 위 말고) 칸에 다른 줄에서 가져온 글이 있으면 병합이 그 글을 덮음 → 버림 */
        let 덮음 = false
        for (let c = c1 + 1; c <= c2 && !덮음; c++) { const sc = 출처(계획, b, c); if (sc != null && (sc < r1 || sc > r2)) 덮음 = true }
        if (덮음) continue
      }
      const n1 = 칸자리(계획, c1, r1), n2 = 칸자리(계획, c2, r2)
      if (n1 === n2 && c1 === c2) continue
      후보.push({ 순, c1, c2, n1: Math.min(n1, n2), n2: Math.max(n1, n2) })
    }
    후보.sort((a, b) => a.순 - b.순)
    const 놓인 = []
    const 겹침 = (a, b) => a.c1 <= b.c2 && b.c1 <= a.c2 && a.n1 <= b.n2 && b.n1 <= a.n2
    const out = []
    for (const x of 후보) {
      if (x.it) { out.push(x.it); continue }
      if (놓인.some((y) => 겹침(x, y))) continue
      놓인.push(x)
      out.push(`<mergeCell ref="${numToCol(x.c1)}${x.n1}:${numToCol(x.c2)}${x.n2}"/>`)
    }
    xml = out.length
      ? xml.slice(0, mb.start) + `<mergeCells count="${out.length}">${out.join('')}</mergeCells>` + xml.slice(mb.end)
      : xml.slice(0, mb.start) + xml.slice(mb.end)
  }
  /* sqref(조건부 서식 · 유효성 · 무시할 오류 · 선택) */
  const sq = (val) => {
    const 조각 = val.split(/\s+/).filter(Boolean).map((r) => sqref하나(계획, r)).filter(Boolean)
    return [...new Set(조각)].join(' ')
  }
  xml = xml.replace(/(<(?:conditionalFormatting|dataValidation|ignoredError|selection|protectedRange)\b[^>]*?\ssqref=")([^"]*)(")/g, (all, a, v, z) => {
    const nv = sq(v)
    return nv ? a + nv + z : a + v.split(/\s+/)[0] + z
  })
  xml = xml.replace(/<xm:sqref>([^<]*)<\/xm:sqref>/g, (all, v) => `<xm:sqref>${sq(v) || v}</xm:sqref>`)
  /* 조건부 서식 · 유효성의 수식 */
  xml = xml.replace(/<(formula|formula1|formula2|xm:f)>([\s\S]*?)<\/\1>/g, (all, tag, body) => {
    const nb = 옮겨(unesc(body), '서식 수식')
    return `<${tag}>${esc(nb)}</${tag}>`
  })
  /* 선택 칸 · 틀 고정 왼쪽 위 */
  xml = xml.replace(/(\s(?:activeCell|topLeftCell)=")([A-Za-z]{1,3}\d+)(")/g, (all, a, v, z) => a + 범위글옮김(계획, v) + z)
  /* 하이퍼링크 — 지운 칸이면 버림 */
  xml = xml.replace(/<hyperlink\b[^>]*\/>/g, (t) => {
    const ref = attr(t, 'ref') || ''
    const m = /^([A-Za-z]{1,3})(\d+)(?::([A-Za-z]{1,3})(\d+))?$/.exec(ref)
    if (!m) return t
    const p = 칸풀이(계획, colToNum(m[1]), +m[2])
    if (p.k === 'gone') return ''
    return setAttr(t, 'ref', 범위글옮김(계획, ref))
  })
  xml = xml.replace(/<hyperlinks>\s*<\/hyperlinks>/, '')
  /* 페이지 나눔(줄) — id 줄 «아래» 에서 나눔(0부터 센 줄 = 1부터 센 id+1 줄의 위) */
  xml = xml.replace(/<rowBreaks\b([^>]*)>([\s\S]*?)<\/rowBreaks>/, (all, at, inner) => {
    const 원 = inner.match(/<brk\b[^>]*\/>/g) || []
    const 자료부터 = 계획.짝.자료부터 || 1
    /* 자료(짝 줄)보다 위의 쪽 나눔(표지 · 머리 쪽)은 그대로 */
    const 앞 = 원.filter((t) => +(attr(t, 'id') || 0) + 1 < 자료부터)
    const 안 = 원.filter((t) => +(attr(t, 'id') || 0) + 1 >= 자료부터)
    const ids = 안.map((t) => +(attr(t, 'id') || 0))
    let out = 앞.slice()
    if (ids.length) {
      /* 2줄에 맞춰 넣은 쪽 나눔을 1줄 자리로 옮기면 쪽마다 반이 빔 →
         ① «같은 간격» 이면(쪽마다 몇 줄로 맞춘 것) 1줄에서도 그 간격으로 다시 · ② 아니면 빼고 엑셀이 쪽을 다시 나누게 */
      const 간 = new Map()
      for (let i = 1; i < ids.length; i++) { const g = ids[i] - ids[i - 1]; 간.set(g, (간.get(g) || 0) + 1) }
      let P = 0, 많 = 0
      for (const [g, n] of 간) if (n > 많 && g > 1) { 많 = n; P = g }
      const 새끝 = 칸자리(계획, 1, 계획.시트.끝줄)
      if (ids.length >= 3 && P > 0 && 많 >= (ids.length - 1) * 0.6) {
        for (let id = ids[0]; id < 새끝; id += P) out.push(setAttr(안[0], 'id', String(id)))
        report.warns.push({ path: 계획.path, ref: '쪽 나눔', msg: `손으로 넣은 쪽 나눔 ${ids.length}곳이 ${P}줄 간격이었습니다 — 1줄에서도 ${P}줄마다 다시 넣었습니다(쪽이 반쯤 비지 않게)` })
      } else {
        report.warns.push({ path: 계획.path, ref: '쪽 나눔', msg: `손으로 넣은 쪽 나눔 ${ids.length}곳은 2줄에 맞춘 것이라 뺐습니다 — 엑셀이 쪽을 다시 나눕니다(인쇄 미리보기로 한 번 보십시오)` })
      }
    }
    if (!out.length) return ''
    let a2 = at
    if (/\scount="/.test(a2)) a2 = a2.replace(/(\scount=")\d+(")/, `$1${out.length}$2`)
    if (/\smanualBreakCount="/.test(a2)) a2 = a2.replace(/(\smanualBreakCount=")\d+(")/, `$1${out.filter((t) => /\sman="(1|true)"/.test(t)).length}$2`)
    return `<rowBreaks${a2}>${out.join('')}</rowBreaks>`
  })
  /* 크기 · 자동 필터 */
  xml = xml.replace(/<dimension\b[^>]*\/>/, (t) => {
    const ref = attr(t, 'ref') || ''
    const m = /^([A-Za-z]+\d+):([A-Za-z]+)(\d+)$/.exec(ref)
    return m ? setAttr(t, 'ref', `${m[1]}:${m[2]}${칸자리(계획, colToNum(m[2]), +m[3])}`) : t
  })
  xml = xml.replace(/<autoFilter\b[^>]*?(\/?)>/g, (t) => { const r = attr(t, 'ref'); return r ? setAttr(t, 'ref', 범위글옮김(계획, r)) : t })
  if (/<tableParts\b/.test(xml)) report.warns.push({ path: 계획.path, ref: '표', msg: '이 시트에 엑셀 «표» 가 있습니다 — 표 범위는 손대지 않았습니다. 확인해 주십시오' })
  return xml
}
function sqref하나(계획, r) {
  const m = /^([A-Za-z]{1,3})(\d+)(?::([A-Za-z]{1,3})(\d+))?$/.exec(r)
  if (!m) return r
  const c1 = colToNum(m[1]), r1 = +m[2]
  if (!m[3]) {
    const p = 칸풀이(계획, c1, r1)
    return p.k === 'gone' ? `${m[1]}${칸자리(계획, c1, r1)}` : `${m[1]}${p.row}`
  }
  const c2 = colToNum(m[3]), r2 = +m[4]
  const a = 칸자리(계획, c1, Math.min(r1, r2)), b = 칸자리(계획, c2, Math.max(r1, r2))
  return a === b && c1 === c2 ? `${m[1]}${a}` : `${m[1]}${a}:${m[3]}${b}`
}
/* 안 줄인 시트 — 수식(위에서) 말고 조건부 서식 · 유효성 수식만 */
function 남시트나머지(xml, 옮겨) {
  return xml.replace(/<(formula|formula1|formula2|xm:f)>([\s\S]*?)<\/\1>/g, (all, tag, body) => {
    const nb = 옮겨(unesc(body), '서식 수식')
    return nb === unesc(body) ? all : `<${tag}>${esc(nb)}</${tag}>`
  })
}

/* ── 메모(댓글) · 그림 자리 ── */
function 딸린것(zip, path, 계획, report) {
  const relp = path.replace(/^(.*\/)([^/]+)$/, '$1_rels/$2.rels')
  if (!zip[relp]) return
  const rels = strFromU8(zip[relp])
  const 대상 = (type) => [...rels.matchAll(/<Relationship\b[^>]*\/>/g)].map((m) => m[0]).filter((t) => new RegExp(type).test(attr(t, 'Type') || ''))
    .map((t) => { const tg = attr(t, 'Target') || ''; const base = path.replace(/[^/]+$/, ''); return 경로합(base, tg) })
  /* 메모 — ref 를 옮기고, 지운 칸 메모는 버림 · 그 메모 상자(VML)도 */
  const 버린 = []           /* [row0, col0] */
  const 옮긴 = new Map()     /* 'row0,col0' → 새 row0 */
  for (const p of 대상('/comments$')) {
    if (!zip[p]) continue
    let x = strFromU8(zip[p])
    /* 먼저 남는 칸의 메모 자리를 잡고, 지운 칸(당초 줄 등)의 메모는 같은 열 · 줄인 줄로 옮김(그 칸에 메모가 이미 있으면 뺌) */
    const 블록 = x.match(/<comment\b[^>]*>[\s\S]*?<\/comment>/g) || []
    const 자리잡힘 = new Set()
    const 풀이 = 블록.map((blk) => {
      const open = /<comment\b[^>]*>/.exec(blk)[0]
      const m = /^([A-Za-z]{1,3})(\d+)$/.exec(attr(open, 'ref') || '')
      if (!m) return null
      const c = colToNum(m[1]), r = +m[2]
      const p2 = 칸풀이(계획, c, r)
      const 새줄 = p2.k === 'same' ? p2.row : 칸자리(계획, c, r)
      if (p2.k === 'same') 자리잡힘.add(m[1] + 새줄)
      return { open, m, c, r, 지움: p2.k === 'gone', 새줄 }
    })
    let i = 0
    x = x.replace(/<comment\b[^>]*>[\s\S]*?<\/comment>/g, (blk) => {
      const q = 풀이[i++]
      if (!q) return blk
      const 새ref = q.m[1] + q.새줄
      if (q.지움) {
        if (자리잡힘.has(새ref)) { 버린.push([q.r - 1, q.c - 1]); report.warns.push({ path: 계획.path, ref: q.m[0], msg: '지운 줄의 메모 — 줄인 칸에 이미 메모가 있어 뺐습니다' }); return '' }
        자리잡힘.add(새ref)
        report.warns.push({ path: 계획.path, ref: q.m[0], msg: `지운 줄의 메모를 ${새ref} 로 옮겼습니다` })
      }
      옮긴.set(`${q.r - 1},${q.c - 1}`, q.새줄 - 1)
      return blk.replace(q.open, setAttr(q.open, 'ref', 새ref))
    })
    zip[p] = strToU8(x)
  }
  for (const p of 대상('/vmlDrawing$')) {
    if (!zip[p]) continue
    let x = strFromU8(zip[p])
    x = x.replace(/<v:shape\b[\s\S]*?<\/v:shape>/g, (blk) => {
      const rm = /<x:Row>(\d+)<\/x:Row>/.exec(blk), cm = /<x:Column>(\d+)<\/x:Column>/.exec(blk)
      if (!rm || !cm) return blk
      const r0 = +rm[1], c0 = +cm[1]
      if (버린.some(([a, b]) => a === r0 && b === c0)) return ''
      const nr = 옮긴.has(`${r0},${c0}`) ? 옮긴.get(`${r0},${c0}`) : 칸자리(계획, c0 + 1, r0 + 1) - 1
      const d = nr - r0
      let nb = blk.replace(/<x:Row>\d+<\/x:Row>/, `<x:Row>${nr}</x:Row>`)
      nb = nb.replace(/<x:Anchor>([^<]*)<\/x:Anchor>/, (a, v) => {
        const p3 = v.split(',').map((s) => s.trim())
        if (p3.length === 8) { p3[2] = String(Math.max(0, +p3[2] + d)); p3[6] = String(Math.max(0, +p3[6] + d)) }
        return `<x:Anchor>${p3.join(', ')}</x:Anchor>`
      })
      return nb
    })
    zip[p] = strToU8(x)
  }
  /* 그림 · 도형 자리(0부터 센 줄) */
  for (const p of 대상('/drawing$')) {
    if (!zip[p]) continue
    let x = strFromU8(zip[p])
    x = x.replace(/<(xdr:from|xdr:to)>([\s\S]*?)<\/\1>/g, (all, tag, inner) => {
      const nb = inner.replace(/<xdr:row>(\d+)<\/xdr:row>/, (a, v) => `<xdr:row>${Math.max(0, 칸자리(계획, 1, +v + 1) - 1)}</xdr:row>`)
      return `<${tag}>${nb}</${tag}>`
    })
    zip[p] = strToU8(x)
  }
  if (대상('/threadedComment$').length) report.warns.push({ path: 계획.path, ref: '메모', msg: '새 꼴 메모(스레드 메모)는 옮기지 않았습니다 — 확인해 주십시오' })
}
function 경로합(base, tg) {
  if (tg.startsWith('/')) return tg.slice(1)
  const parts = (base + tg).split('/')
  const out = []
  for (const s of parts) { if (s === '..') out.pop(); else if (s !== '.') out.push(s) }
  return out.join('/')
}

/* 시험용 — 안쪽 함수(화면은 안 씀) */
export const _안 = {
  책열기: (buf) => 책열기(buf), 시트풀기, 계획짓기, 출처: (계획, b, c) => 출처(계획, b, c), 칸풀이: (계획, c, r) => 칸풀이(계획, c, r),
  /* 시험용 — 칸 하나 {f: 수식 글 | null, v: 값 글 | null, k: 's'|'n'|…} */
  칸: (책, 시트이름, ref) => {
    const s = 책.sheets.find((x) => x.name === 시트이름); if (!s) return null
    const m = /^([A-Za-z]{1,3})(\d+)$/.exec(ref); if (!m) return null
    const row = s.시트.rows.get(+m[2]); const c = row ? row.cells.get(colToNum(m[1].toUpperCase())) : null
    if (!c) return null
    const v = 값(c, 책.sst)
    return { f: c.f ? c.f.text : null, v: v ? v.v : null, k: v ? v.k : null, s: c.s }
  },
}
