/**
 * 🧱 마감 수량산출 — 방(실) 중심 셈 (2026-09-27)
 *
 * 소장님이 주신 마감 프로그램 설명서의 «방(실) 중심» 방식만 따릅니다(그 프로그램의 코드·자료는 쓰지 않음):
 *   실마다 바닥·걸레받이·벽·천장(·몰딩) 마감 기호를 붙이고, 마감 기호마다 «들어가는 재료» 를 적어 두면
 *   실의 면적·둘레·천장고·창호로 재료별 수량이 나옵니다.
 *
 * ■ 단위: 길이 m · 면적 m² (도면을 누르면 m 로 들어옵니다)
 * ■ 부위량(실 하나)
 *     바닥 = 면적 · 천장 = 면적
 *     벽   = 둘레 × 천장고 − 창호 면적(폭×높이×개수) − 벽공제
 *     걸레받이 = 둘레 − 문 폭 합(창호표 구분이 «문» 인 것) · 몰딩 = 둘레
 *     외벽 = 길이 × 높이 − 창호 면적
 * ■ 재료 수량 = 부위량 × 실 개수 × 계수   (계수: 몰탈 24mm 면 0.024(m³), 타일이면 1(m²) …)
 * ■ 산출근거는 m 단위 숫자식 — 엑셀에서 =ROUND(식,3) 으로 다시 셉니다.
 * ■ 2026-09-27 「빠진 기능까지 다」 (설명서의 기능 — 코드·자료는 안 씀):
 *   묶음(평형·수평셀·수직셀·기타) + 조합표(동·층 범위·묶음·개수) · 평형 전용면적 검산 · 치환(마감 코드·창호) ·
 *   창호 산출(창호마다 재료 식 W·H·A·L · 창호 조합 · 창호 집계) · 계수 식 변수(Q·A·L·H·J1~J4·K1~K5) · 부자재(주재료 1 단위당) ·
 *   명칭·규격 일괄 바꾸기 · 구역별·동별 집계 · 당초 대비
 * ■ 시험: node tools/시험_마감.mjs · node tools/시험_마감더.mjs
 */
import { calc } from './susik.js'
import { 엑셀반올림 } from './골조.js'

const 글 = (v) => String(v ?? '').trim()
function 수(v, d = null) {
  const t = 글(v).replace(/,/g, '')
  if (t === '') return d
  const n = Number(t)
  if (Number.isFinite(n)) return n
  try { const r = calc(t, {}, 6).val; return Number.isFinite(r) ? r : d } catch (e) { return d }
}
const 짧 = (v) => { const r = Math.round(v * 10000) / 10000; return String(Object.is(r, -0) ? 0 : r) }

export const 부위들 = ['바닥', '걸레받이', '벽', '천장', '몰딩', '외벽']
export const 부위단위 = { 바닥: 'm²', 걸레받이: 'm', 벽: 'm²', 천장: 'm²', 몰딩: 'm', 외벽: 'm²' }

/** 실 표 칸 [보이는 이름, 속 이름, 보기] */
export const 실칸 = [
  ['층', '층', '1'], ['실명', '실명', '사무실'], ['개수', '개수', '1'],
  ['면적(m²)', '면적', ''], ['둘레(m)', '둘레', ''], ['천장고(m)', '천장고', '비우면 기본'],
  ['바닥', '바닥', 'F1'], ['걸레받이', '걸레받이', 'B1'], ['벽', '벽', 'W1'], ['천장', '천장', 'C1'], ['몰딩', '몰딩', ''],
  ['창호', '창호', 'WD1*2 AW1'], ['벽공제(m²)', '벽공제', ''], ['묶음', '묶음', ''], ['구역', '구역', ''], ['변수', '변수', 'J1=0.3'], ['비고', '비고', ''],
]
export const 외벽칸 = [
  ['층', '층', '1'], ['부위', '부위', '남측'], ['길이(m)', '길이', ''], ['높이(m)', '높이', ''], ['마감', '마감', 'EW1'], ['창호', '창호', 'AW1*4'], ['공제(m²)', '공제', ''], ['구역', '구역', ''], ['비고', '비고', ''],
]
export const 창호칸 = [['기호', '기호', 'WD1'], ['구분', '구분', '문'], ['폭(m)', '폭', '0.9'], ['높이(m)', '높이', '2.1'], ['비고', '비고', '']]
export const 재료칸 = [['재료', '재료', '비닐타일'], ['규격', '규격', 'THK 3'], ['단위', '단위', 'm2'], ['계수·식', '계수', '1'], ['주재료(부자재)', '주재료', '']]
/** 창호 재료 식 — W 폭 · H 높이 · A = W×H · L = 2×(W+H) (m) */
export const 창호재료칸 = [['재료', '재료', '유리'], ['규격', '규격', '24mm 복층'], ['단위', '단위', 'm2'], ['식', '식', 'A']]
export const 묶음종류 = ['평형', '수평셀', '수직셀', '기타']
export const 묶음칸 = [['이름', '이름', '84A'], ['종류', '종류', '평형'], ['전용면적(m²)', '전용', ''], ['비고', '비고', '']]
export const 조합칸 = [['동', '동', '101동'], ['층', '층', '2-15'], ['묶음', '묶음', '84A'], ['개수', '개수', '1'], ['치환', '치환', ''], ['비고', '비고', '']]
export const 치환칸 = [['이름', '이름', 'T1'], ['바꿈', '바꿈', 'F1→F3, AW1→AW2'], ['비고', '비고', '']]
export const 창호조합칸 = [['동', '동', ''], ['층', '층', '2-15'], ['기호', '기호', 'AW1'], ['개수', '개수', '1'], ['비고', '비고', '']]

export function 새공사() {
  return { 이름: '', 기준: { 천장고: 2.4, 자리: 3 }, 마감: [], 창호: [], 실: [], 외벽: [], 묶음: [], 조합: [], 치환: [], 창호조합: [] }
}

/** 예시 — 가상 도면(마감_예시.dxf)과 짝 */
export function 예시공사() {
  return {
    이름: '예시 — 가상 사무소 1층',
    기준: { 천장고: 2.7, 자리: 3 },
    마감: [
      { 기호: 'F1', 부위: '바닥', 이름: '비닐타일 마감', 재료: [{ 재료: '시멘트 몰탈', 규격: '바닥 24mm', 단위: 'm3', 계수: '0.024' }, { 재료: '비닐타일', 규격: '300×300×3', 단위: 'm2', 계수: '1' }] },
      { 기호: 'F2', 부위: '바닥', 이름: '자기질 타일 마감', 재료: [{ 재료: '방수(액체)', 규격: '바닥', 단위: 'm2', 계수: '1' }, { 재료: '자기질 타일', 규격: '300×300', 단위: 'm2', 계수: '1' }] },
      { 기호: 'B1', 부위: '걸레받이', 이름: '비닐 걸레받이', 재료: [{ 재료: '비닐 걸레받이', 규격: 'H100', 단위: 'm', 계수: '1' }] },
      { 기호: 'W1', 부위: '벽', 이름: '수성페인트', 재료: [{ 재료: '벽 미장', 규격: '18mm', 단위: 'm2', 계수: '1' }, { 재료: '수성페인트', 규격: '2회', 단위: 'm2', 계수: '1' }] },
      { 기호: 'W2', 부위: '벽', 이름: '벽 타일', 재료: [{ 재료: '자기질 타일', 규격: '200×250', 단위: 'm2', 계수: '1' }] },
      { 기호: 'C1', 부위: '천장', 이름: '텍스 천장', 재료: [{ 재료: '경량철골 천장틀', 규격: 'M-BAR', 단위: 'm2', 계수: '1' }, { 재료: '흡음텍스', 규격: '300×600×12', 단위: 'm2', 계수: '1' }] },
      { 기호: 'C2', 부위: '천장', 이름: '방수석고 천장', 재료: [{ 재료: '방수 석고보드', 규격: '9.5T', 단위: 'm2', 계수: '1' }] },
      { 기호: 'M1', 부위: '몰딩', 이름: '천장 몰딩', 재료: [{ 재료: '걸레받이·몰딩(PVC)', 규격: '천장', 단위: 'm', 계수: '1' }] },
      { 기호: 'EW1', 부위: '외벽', 이름: '외벽 도장', 재료: [{ 재료: '외벽 수성페인트', 규격: '3회', 단위: 'm2', 계수: '1' }] },
    ],
    창호: [
      { 기호: 'WD1', 구분: '문', 폭: '0.9', 높이: '2.1', 재료: [{ 재료: '목재 문틀', 규격: '', 단위: 'm', 식: '2*H+W' }] },
      { 기호: 'WD2', 구분: '문', 폭: '0.8', 높이: '2.1' },
      { 기호: 'AW1', 구분: '창', 폭: '1.8', 높이: '1.5', 재료: [{ 재료: '창호 유리', 규격: '24mm 복층', 단위: 'm2', 식: 'A' }, { 재료: '코킹', 규격: '실리콘', 단위: 'm', 식: 'L' }] },
      { 기호: 'AW2', 구분: '창', 폭: '0.6', 높이: '0.6' },
    ],
    실: [
      { 층: '1', 실명: '사무실', 개수: '1', 면적: '48', 둘레: '28', 천장고: '', 바닥: 'F1', 걸레받이: 'B1', 벽: 'W1', 천장: 'C1', 몰딩: 'M1', 창호: 'WD1 AW1*2' },
      { 층: '1', 실명: '회의실', 개수: '1', 면적: '30', 둘레: '22', 천장고: '', 바닥: 'F1', 걸레받이: 'B1', 벽: 'W1', 천장: 'C1', 몰딩: 'M1', 창호: 'WD1 AW1' },
      { 층: '1', 실명: '화장실', 개수: '1', 면적: '9', 둘레: '12', 천장고: '2.4', 바닥: 'F2', 걸레받이: '', 벽: 'W2', 천장: 'C2', 몰딩: '', 창호: 'WD2 AW2' },
    ],
    외벽: [], 묶음: [], 조합: [], 치환: [], 창호조합: [],
  }
}

/** 「WD1*2 AW1 AW3*3」 → [{기호:'WD1', n:2}, …] */
export function 창호풀기(s) {
  const out = []
  for (const tok of 글(s).split(/[\s,+·]+/).filter(Boolean)) {
    const m = tok.match(/^(.+?)(?:[*×xX](\d+(?:\.\d+)?))?$/)
    if (!m) continue
    const 기호 = m[1].toUpperCase()
    const n = m[2] ? Number(m[2]) : 1
    const 있음 = out.find((o) => o.기호 === 기호)
    if (있음) 있음.n += n; else out.push({ 기호, n })
  }
  return out
}
export function 창호글(목록) { return 목록.map((o) => (o.n === 1 ? o.기호 : o.기호 + '*' + o.n)).join(' ') }

/** 「2-15」「B2-B1」「1,3,5」「PH」 → 층 이름들 */
export function 층풀기(글자) {
  const out = []
  for (const tok of 글(글자).toUpperCase().split(/[,\s]+/).filter(Boolean)) {
    const m = tok.match(/^(.+?)[-~](.+)$/)
    if (m) {
      const a = m[1], b = m[2]
      if (/^\d+$/.test(a) && /^\d+$/.test(b)) { const x = +a, y = +b; for (let k = Math.min(x, y); k <= Math.max(x, y); k++) out.push(String(k)); continue }
      const ba = a.match(/^B(\d+)$/), bb = b.match(/^B(\d+)$/)
      if (ba && bb) { const x = +ba[1], y = +bb[1]; for (let k = Math.max(x, y); k >= Math.min(x, y); k--) out.push('B' + k); continue }
      out.push(a, b)
    } else out.push(tok)
  }
  return [...new Set(out)]
}
/** 「F1→F3, AW1→AW2」 → Map(F1→F3, AW1→AW2) */
export function 치환풀기(s) {
  const mp = new Map()
  for (const 조각 of 글(s).split(/[,;\n]+/)) {
    const m = 글(조각).match(/^(.+?)\s*(?:→|->|=>|>|=)\s*(.+)$/)
    if (m) mp.set(글(m[1]).toUpperCase(), 글(m[2]))
  }
  return mp
}
/** 「J1=0.3 K2=1.5」 → {J1:0.3, K2:1.5} */
export function 변수풀기(s) {
  const o = {}
  for (const 조각 of 글(s).toUpperCase().split(/[,;\s]+/).filter(Boolean)) {
    const m = 조각.match(/^([JK]\d)\s*[=:]\s*(.+)$/)
    if (m) { const v = 수(m[2], null); if (v !== null) o[m[1]] = v }
  }
  return o
}
const 변수들 = /\b(Q|A|L|H|W|J[1-4]|K[1-5])\b/g
/** 식 안의 변수를 숫자로 — 모르는 변수는 없는 것에 모음 */
function 바꿔넣기(식, 값, 없는) {
  return 글(식).toUpperCase().replace(변수들, (v) => {
    if (값[v] === undefined || 값[v] === null) { 없는.add(v); return '0' }
    return 값[v]
  })
}
const 괄 = (e) => (/[+\-]/.test(e.replace(/^\(.*\)$/, '')) ? '(' + e + ')' : e)
const mm = (v) => String(Math.round(v * 1000))

/**
 * @returns {{줄:[{동, 층, 실명, 묶음, 구역, 부위, 기호, 재료, 규격, 단위, 식, 수량, 비고, 곳}], 경고:[{곳, 글}],
 *            집계:{합, 층별, 부위별, 동별, 구역별}, 창호집계, 면적검산, 기}}
 */
export function 셈(공사) {
  const 기 = { 천장고: 2.4, 자리: 3, ...(공사.기준 || {}) }
  const 자리 = Math.max(0, Math.min(6, Math.trunc(수(기.자리, 3))))
  const 줄 = []
  const 경고 = []
  const 본경고 = new Set()
  const 경 = (곳, t) => { const k = (곳 ? 곳.표 + '|' + 곳.i : '') + '|' + t; if (본경고.has(k)) return; 본경고.add(k); 경고.push({ 곳, 글: t }) }
  const 마감표 = new Map()
  for (const m of 공사.마감 || []) if (글(m.기호)) 마감표.set(글(m.기호).toUpperCase(), m)
  const 창표 = new Map()
  for (const w of 공사.창호 || []) if (글(w.기호)) 창표.set(글(w.기호).toUpperCase(), w)
  const 치환표 = new Map()
  for (const t of 공사.치환 || []) if (글(t.이름)) 치환표.set(글(t.이름).toUpperCase(), 치환풀기(t.바꿈))
  const 빈줄 = (r) => !Object.entries(r || {}).some(([k, v]) => !k.startsWith('_') && 글(v))
  /** 창호 개수 모음: 동|층|기호 → {동, 층, 기호, 식:[], 곳} */
  const 창개수 = new Map()
  const 창직접 = (공사.창호조합 || []).some((r) => !빈줄(r))
  const 창더하기 = (동, 층, 기호, 식, 곳) => {
    const k = 동 + '|' + 층 + '|' + 기호
    const a = 창개수.get(k) || { 동, 층, 기호, 식: [], 곳 }
    a.식.push(식); 창개수.set(k, a)
  }

  /** 창호 면적 식 · 문 폭 식 (치환 적용) */
  function 창호식(창호, 곳, 치) {
    const 면 = [], 문 = [], 목록 = []
    for (const o0 of 창호풀기(창호)) {
      const 기호 = 치 && 치.has(o0.기호) ? 글(치.get(o0.기호)).toUpperCase() : o0.기호
      const o = { 기호, n: o0.n }
      목록.push(o)
      const w = 창표.get(기호)
      if (!w) { 경(곳, '창호 «' + 기호 + '» 가 창호표에 없습니다 — 빼지 못했습니다'); continue }
      const 폭 = 수(w.폭, null), 높 = 수(w.높이, null)
      if (!(폭 > 0) || !(높 > 0)) { 경(곳, '창호 «' + 기호 + '» 의 폭·높이가 비었습니다'); continue }
      면.push(짧(폭) + '*' + 짧(높) + (o.n === 1 ? '' : '*' + 짧(o.n)))
      if (/문|DOOR|^D/i.test(글(w.구분))) 문.push(짧(폭) + (o.n === 1 ? '' : '*' + 짧(o.n)))
    }
    return { 면, 문, 목록 }
  }
  function 넣기(o) {
    let v
    try { v = calc(o.식, {}, 8).val } catch (e) { 경(o.곳, o.부위 + ' ' + o.기호 + ' — 식을 셀 수 없습니다: ' + e.message); return null }
    if (!Number.isFinite(v)) { 경(o.곳, o.부위 + ' ' + o.기호 + ' — 셈이 숫자가 아닙니다'); return null }
    if (v < 0) 경(o.곳, o.부위 + ' ' + o.기호 + ' — 수량이 음수입니다(공제가 본체보다 큼): ' + o.식)
    줄.push({ ...o, 수량: 엑셀반올림(v, 자리) })
    return o.식
  }
  /**
   * 한 부위의 재료들
   * @param 판 {곳, 동, 층, 실명, 묶음, 구역, 곱글, 값:{A,L,H,J…,K…}}
   */
  function 재료로(판, 부위, 기호, 부위식, 설명) {
    const c = 글(기호)
    if (!c) return
    const { 곳 } = 판
    const m = 마감표.get(c.toUpperCase())
    if (!m) { 경(곳, 부위 + ' 마감 «' + c + '» 가 마감표에 없습니다'); return }
    if (m.부위 && 부위 !== '외벽' && m.부위 !== 부위) 경(곳, '«' + c + '» 는 마감표에서 ' + m.부위 + ' 마감인데 ' + 부위 + ' 칸에 적혔습니다')
    const 재료 = (m.재료 || []).filter((r) => 글(r.재료))
    if (!재료.length) { 경(곳, '마감 «' + c + '» 에 재료가 없습니다'); return }
    const 식표 = new Map()
    const 뒤로 = []
    const 공통 = { 동: 판.동, 층: 판.층, 실명: 판.실명, 묶음: 판.묶음, 구역: 판.구역, 부위, 기호: c, 곳 }
    for (const r of 재료) {
      if (글(r.주재료)) { 뒤로.push(r); continue }
      const t = 글(r.계수) || '1'
      let 식
      if (/[A-Za-z]/.test(t.replace(/\b(?:ROUND|INT|SQRT|ABS|MAX|MIN|PI)\b/gi, ''))) {
        const 없는 = new Set()
        const 값 = { ...판.값, Q: '(' + 부위식 + ')' }
        const e = 바꿔넣기(t, 값, 없는)
        if (없는.size) 경(곳, '«' + c + '» ' + 글(r.재료) + ' 식의 변수 ' + [...없는].join('·') + ' 가 이 줄에 없습니다(0 으로 셈) — 실 표의 «변수» 칸에 「J1=0.3」 처럼 적으십시오')
        식 = 괄(e) + 판.곱글
      } else {
        const k = 수(t, null)
        if (k === null) { 경(곳, '«' + c + '» ' + 글(r.재료) + ' 계수 «' + t + '» 를 모르겠습니다'); continue }
        식 = 괄(부위식) + 판.곱글 + (k === 1 ? '' : '*' + 짧(k))
      }
      const 된 = 넣기({ ...공통, 재료: 글(r.재료), 규격: 글(r.규격), 단위: 글(r.단위) || 부위단위[부위], 식, 비고: 설명 + (판.덧 || '') })
      if (된) 식표.set(글(r.재료), 된)
    }
    for (const r of 뒤로) {
      const 주 = 식표.get(글(r.주재료))
      if (!주) { 경(곳, '«' + c + '» 부자재 ' + 글(r.재료) + ' 의 주재료 «' + 글(r.주재료) + '» 가 이 마감에 없습니다'); continue }
      const k = 수(r.계수, null)
      if (k === null) { 경(곳, '«' + c + '» 부자재 ' + 글(r.재료) + ' 계수는 숫자로 적으십시오(주재료 1 단위당)'); continue }
      넣기({ ...공통, 재료: 글(r.재료), 규격: 글(r.규격), 단위: 글(r.단위) || '', 식: 괄(주) + (k === 1 ? '' : '*' + 짧(k)), 비고: '부자재 = ' + 글(r.주재료) + ' × ' + 짧(k) + (판.덧 || '') })
    }
  }

  /** 실 한 줄 — 판: 동·층·곱(층 수·개수)·치환 */
  function 실셈(r, i, 조) {
    const 곳 = { 표: '실', i }
    const 치 = 조 ? 조.치 : null
    const 코드 = (k) => { const v = 글(r[k]); return v && 치 && 치.has(v.toUpperCase()) ? 치.get(v.toUpperCase()) : v }
    const 층 = 조 && 조.층 ? 조.층 : 글(r.층)
    const 실명 = 글(r.실명) || '(이름 없음)'
    const n = 수(r.개수, 1)
    const A = 수(r.면적, null), L = 수(r.둘레, null)
    const H = 수(r.천장고, null) ?? 수(기.천장고, null)
    if (!(n > 0)) { 경(곳, '개수가 0 입니다'); return }
    const 바닥필요 = 코드('바닥') || 코드('천장')
    if (바닥필요 && !(A > 0)) 경(곳, '면적이 비었습니다 — 바닥·천장을 못 셉니다 (도면에서 방 안을 누르십시오)')
    const 둘레필요 = 코드('벽') || 코드('걸레받이') || 코드('몰딩')
    if (둘레필요 && !(L > 0)) 경(곳, '둘레가 비었습니다 — 벽·걸레받이·몰딩을 못 셉니다')
    if (A > 0 && L > 0 && L * L < 4 * Math.PI * A * 0.999) 경(곳, '둘레가 면적에 비해 너무 짧습니다(원보다 짧음) — mm/m 를 확인하십시오')
    if (A > 0 && A > 5000) 경(곳, '면적이 ' + A + ' m² 입니다 — mm² 로 들어간 것 아닌지 보십시오')
    const { 면, 문, 목록 } = 창호식(r.창호, 곳, 치)
    const 층수 = 조 ? 조.층수 : 1, 벌 = 조 ? 조.개수 : 1
    const 곱글 = (n === 1 ? '' : '*' + 짧(n)) + (층수 === 1 ? '' : '*' + 층수) + (벌 === 1 ? '' : '*' + 짧(벌))
    const 판 = {
      곳, 동: 조 ? 조.동 : '', 층, 실명, 묶음: 글(r.묶음), 구역: 글(r.구역), 곱글,
      값: { A: A > 0 ? 짧(A) : null, L: L > 0 ? 짧(L) : null, H: H > 0 ? 짧(H) : null, ...Object.fromEntries(Object.entries(변수풀기(r.변수)).map(([k, v]) => [k, 짧(v)])) },
      덧: 조 ? ' · 조합 ' + (조.동 ? 조.동 + ' ' : '') + (조.층 ? 조.층 + '층' : '') + (층수 > 1 ? '(' + 층수 + '개 층)' : '') + (벌 !== 1 ? ' ×' + 짧(벌) : '') : '',
    }
    if (A > 0) {
      재료로(판, '바닥', 코드('바닥'), 짧(A), '바닥 = 면적')
      재료로(판, '천장', 코드('천장'), 짧(A), '천장 = 면적')
    }
    if (L > 0) {
      if (코드('벽')) {
        if (!(H > 0)) 경(곳, '천장고가 없어 벽을 못 셉니다')
        else {
          const 빼 = 면.concat(수(r.벽공제, 0) ? [짧(수(r.벽공제, 0))] : [])
          재료로(판, '벽', 코드('벽'), 짧(L) + '*' + 짧(H) + (빼.length ? '-' + 빼.join('-') : ''), '벽 = 둘레×천장고' + (면.length ? ' − 창호(' + 창호글(목록) + ')' : '') + (수(r.벽공제, 0) ? ' − 벽공제' : ''))
        }
      }
      재료로(판, '걸레받이', 코드('걸레받이'), 짧(L) + (문.length ? '-' + 문.join('-') : ''), '걸레받이 = 둘레' + (문.length ? ' − 문 폭' : ''))
      재료로(판, '몰딩', 코드('몰딩'), 짧(L), '몰딩 = 둘레')
    }
    if (!창직접) for (const o of 목록) 창더하기(판.동, 층, o.기호, 짧(o.n) + 곱글, 곳)
  }

  const 실들 = 공사.실 || []
  const 묶음이름 = (r) => 글(r.묶음).toUpperCase()
  // ① 묶음 없는 실
  실들.forEach((r, i) => { if (!빈줄(r) && !묶음이름(r)) 실셈(r, i, null) })
  // ② 조합표 — 묶음 × 동 × 층 범위 × 개수
  const 쓴묶음 = new Set()
  ;(공사.조합 || []).forEach((z, j) => {
    if (빈줄(z)) return
    const 곳z = { 표: '조합', i: j }
    const 묶 = 글(z.묶음).toUpperCase()
    if (!묶) { 경(곳z, '묶음이 비었습니다'); return }
    const 방들 = 실들.map((r, i) => [r, i]).filter(([r]) => !빈줄(r) && 묶음이름(r) === 묶)
    if (!방들.length) { 경(곳z, '묶음 «' + 글(z.묶음) + '» 에 든 실이 없습니다 — 실 표의 «묶음» 칸에 적으십시오'); return }
    쓴묶음.add(묶)
    const 층들 = 층풀기(z.층)
    const 개수 = 수(z.개수, 1)
    if (!(개수 > 0)) { 경(곳z, '개수가 0 입니다'); return }
    const 치 = new Map()
    for (const 이름 of 글(z.치환).toUpperCase().split(/[,\s]+/).filter(Boolean)) {
      const t = 치환표.get(이름)
      if (!t) { 경(곳z, '치환 «' + 이름 + '» 이 치환표에 없습니다'); continue }
      for (const [a, b] of t) 치.set(a, b)
    }
    const 조 = { 동: 글(z.동), 층: 글(z.층), 층수: Math.max(1, 층들.length), 개수, 치 }
    for (const [r, i] of 방들) 실셈(r, i, 조)
  })
  실들.forEach((r, i) => { const 묶 = 묶음이름(r); if (묶 && !쓴묶음.has(묶)) 경({ 표: '실', i }, '묶음 «' + 글(r.묶음) + '» 이 조합표에 없어 세지 않았습니다') })
  // ③ 외벽
  ;(공사.외벽 || []).forEach((r, i) => {
    const 곳 = { 표: '외벽', i }
    if (빈줄(r)) return
    const Lw = 수(r.길이, null), Hw = 수(r.높이, null)
    if (!(Lw > 0) || !(Hw > 0)) { 경(곳, '외벽 길이·높이가 비었습니다'); return }
    const { 면, 목록 } = 창호식(r.창호, 곳, null)
    const 빼 = 면.concat(수(r.공제, 0) ? [짧(수(r.공제, 0))] : [])
    const 판 = { 곳, 동: '', 층: 글(r.층), 실명: 글(r.부위) || '외벽', 묶음: '', 구역: 글(r.구역), 곱글: '', 값: { A: 짧(Lw * Hw), L: 짧(Lw), H: 짧(Hw) } }
    재료로(판, '외벽', r.마감, 짧(Lw) + '*' + 짧(Hw) + (빼.length ? '-' + 빼.join('-') : ''), '외벽 = 길이×높이' + (면.length ? ' − 창호' : ''))
    if (!창직접) for (const o of 목록) 창더하기('', 글(r.층), o.기호, 짧(o.n), 곳)
  })
  // ④ 창호 산출 — 창호 조합표가 있으면 그것, 없으면 실·외벽의 창호 칸
  if (창직접) {
    ;(공사.창호조합 || []).forEach((z, j) => {
      if (빈줄(z)) return
      const 곳 = { 표: '창호조합', i: j }
      const 기호 = 글(z.기호).toUpperCase()
      if (!기호) { 경(곳, '기호가 비었습니다'); return }
      const 층수 = Math.max(1, 층풀기(z.층).length), n = 수(z.개수, 1)
      창더하기(글(z.동), 글(z.층), 기호, 짧(n) + (층수 === 1 ? '' : '*' + 층수), 곳)
    })
  }
  const 창호집계 = new Map()
  for (const a of 창개수.values()) {
    const w = 창표.get(a.기호)
    if (!w) { if (창직접) 경(a.곳, '창호 «' + a.기호 + '» 가 창호표에 없습니다'); continue }     // 실·외벽에서 온 것은 거기서 이미 알림
    const W = 수(w.폭, null), H = 수(w.높이, null)
    const 개식 = a.식.join('+')
    const 규 = W > 0 && H > 0 ? mm(W) + '×' + mm(H) : ''
    const 공통 = { 동: a.동, 층: a.층, 실명: '', 묶음: '', 구역: '', 부위: '창호', 기호: a.기호, 곳: a.곳 }
    const 개 = 넣기({ ...공통, 재료: '창호', 규격: a.기호 + (규 ? ' (' + 규 + ')' : ''), 단위: '개소', 식: 개식, 비고: (글(w.구분) || '창호') + ' 개수' })
    let 개v = 0
    try { 개v = calc(개식, {}, 8).val } catch (e) { 개v = 0 }
    const g = 창호집계.get(a.기호) || { 기호: a.기호, 구분: 글(w.구분), 규격: 규, 개수: 0 }
    g.개수 += 개v; 창호집계.set(a.기호, g)
    if (!개) continue
    const 재료 = (w.재료 || []).filter((r) => 글(r.재료))
    if (재료.length && !(W > 0 && H > 0)) { 경(a.곳, '창호 «' + a.기호 + '» 폭·높이가 없어 재료를 못 셉니다'); continue }
    for (const r of 재료) {
      const 없는 = new Set()
      const e = 바꿔넣기(글(r.식) || 'A', { W: 짧(W), H: 짧(H), A: 짧(W * H), L: 짧(2 * (W + H)) }, 없는)
      if (없는.size) 경(a.곳, '창호 «' + a.기호 + '» ' + 글(r.재료) + ' 식에 모르는 변수 ' + [...없는].join('·') + ' (W·H·A·L 만 씀)')
      넣기({ ...공통, 재료: 글(r.재료), 규격: 글(r.규격), 단위: 글(r.단위), 식: 괄(e) + '*' + 괄(개식), 비고: '창호 ' + a.기호 + ' — 식 ' + (글(r.식) || 'A') + ' (W 폭·H 높이·A 면적·L 둘레)' })
    }
  }
  // ⑤ 평형 전용면적 검산
  const 면적검산 = []
  for (const b of 공사.묶음 || []) {
    const 이름 = 글(b.이름)
    if (!이름) continue
    const 방 = 실들.filter((r) => 묶음이름(r) === 이름.toUpperCase())
    const 실합 = 방.reduce((s2, r) => s2 + (수(r.면적, 0) || 0) * (수(r.개수, 1) || 0), 0)
    const 전용 = 수(b.전용, null)
    const o = { 묶음: 이름, 종류: 글(b.종류), 실수: 방.length, 실합: Math.round(실합 * 1e4) / 1e4, 전용, 차: 전용 ? Math.round((실합 - 전용) * 1e4) / 1e4 : null, 율: 전용 ? (실합 - 전용) / 전용 * 100 : null }
    면적검산.push(o)
    if (전용 && Math.abs(o.율) > 2) 경({ 표: '묶음', i: (공사.묶음 || []).indexOf(b) }, '«' + 이름 + '» 실 면적 합 ' + 짧(실합) + ' m² 가 전용면적 ' + 짧(전용) + ' m² 와 ' + o.율.toFixed(1) + '% 다릅니다 — 빠진 방·겹친 방을 보십시오')
  }
  return { 줄, 경고, 집계: 모으기(줄), 창호집계: [...창호집계.values()].map((g) => ({ ...g, 개수: Math.round(g.개수 * 1e6) / 1e6 })), 면적검산, 기 }
}

export function 모으기(줄) {
  const 판 = (앞) => {
    const mp = new Map()
    for (const x of 줄) {
      const k = 앞.map((a) => x[a] || '').join('|') + '|' + x.재료 + '|' + x.규격 + '|' + x.단위
      const a = mp.get(k) || { ...Object.fromEntries(앞.map((a2) => [a2, x[a2] || ''])), 재료: x.재료, 규격: x.규격, 단위: x.단위, 수량: 0 }
      a.수량 += x.수량; mp.set(k, a)
    }
    return [...mp.values()].map((x) => ({ ...x, 수량: Math.round(x.수량 * 1e6) / 1e6 }))
  }
  const 있나 = (k) => 줄.some((x) => x[k])
  return { 합: 판([]), 층별: 판(['층']), 부위별: 판(['부위']), 동별: 있나('동') ? 판(['동']) : [], 구역별: 있나('구역') ? 판(['구역']) : [] }
}

/** 당초(저장한 집계)와 지금 비교 — 설계변경 */
export function 비교(당초합, 지금합) {
  const 키 = (x) => x.재료 + '|' + x.규격 + '|' + x.단위
  const mp = new Map()
  for (const x of 당초합 || []) mp.set(키(x), { 재료: x.재료, 규격: x.규격, 단위: x.단위, 당초: x.수량, 지금: 0 })
  for (const x of 지금합 || []) { const k = 키(x); const a = mp.get(k) || { 재료: x.재료, 규격: x.규격, 단위: x.단위, 당초: 0, 지금: 0 }; a.지금 = x.수량; mp.set(k, a) }
  return [...mp.values()].map((a) => ({ ...a, 증감: Math.round((a.지금 - a.당초) * 1e6) / 1e6, 율: a.당초 ? (a.지금 - a.당초) / a.당초 * 100 : null }))
}

/** 명칭·규격 일괄 바꾸기 — 마감표·창호표의 재료 칸에서 «찾을» 글자를 «바꿀» 로 */
export function 일괄바꾸기(공사, 칸, 찾을, 바꿀) {
  const f = 글(찾을)
  if (!f || !['재료', '규격'].includes(칸)) return { 공사, 수: 0 }
  let n = 0
  const 고침 = (목록) => (목록 || []).map((r) => {
    const v = String(r[칸] ?? '')
    const 주 = String(r.주재료 ?? '')
    let x = r
    if (v.includes(f)) { n++; x = { ...x, [칸]: v.split(f).join(바꿀) } }
    if (칸 === '재료' && 주.includes(f)) x = { ...x, 주재료: 주.split(f).join(바꿀) }   // 부자재의 주재료 이름도 같이
    return x
  })
  const 마감 = (공사.마감 || []).map((m) => ({ ...m, 재료: 고침(m.재료) }))
  const 창호 = (공사.창호 || []).map((w) => (w.재료 ? { ...w, 재료: 고침(w.재료) } : w))
  return { 공사: { ...공사, 마감, 창호 }, 수: n }
}

/* ───────────────────────────── 도면의 표에서 채우기 (도면자동.js 의 표찾기 결과) */

const 머 = (h) => String(h || '').replace(/\s+/g, '').replace(/\(.*?\)/g, '')
/** 실내재료마감표 → [{실명, 층?, 바닥, 걸레받이, 벽, 천장, 천장고}] */
export function 마감표읽기(표들) {
  const out = []
  for (const t of 표들 || []) {
    const hs = t.머리.map(머)
    const j = (re) => hs.findIndex((h) => re.test(h))
    const js = j(/^(실명|실|실이름|ROOM)$/i), jf = j(/^바닥/), jb = j(/걸레/), jw = j(/^벽/), jc = j(/^천장$|^천정$|^반자/), jh = j(/(천장고|천정고|반자높이|CH)/i), jl = j(/^층$/)
    if (js < 0 || (jf < 0 && jw < 0 && jc < 0)) continue
    for (const r of t.줄) {
      const 실명 = 글(r[js])
      if (!실명) continue
      const 값 = (k) => (k >= 0 ? 글(r[k]) : '')
      let 천장고 = 값(jh)
      const h = Number(천장고.replace(/[^\d.]/g, ''))
      if (h > 100) 천장고 = String(h / 1000)            // mm 로 적힌 것
      out.push({ 실명, 층: 값(jl), 바닥: 값(jf), 걸레받이: 값(jb), 벽: 값(jw), 천장: 값(jc), 천장고: 천장고.replace(/[^\d.]/g, ''), 표: t.제목 })
    }
  }
  return out
}
/** 창호일람표 → [{기호, 폭, 높이, 구분, 수량?}] — 「900×2100」「W900 H2100」 모두 */
export function 창호표읽기(표들) {
  const out = []
  for (const t of 표들 || []) {
    const hs = t.머리.map(머)
    const j = (re) => hs.findIndex((h) => re.test(h))
    const jk = j(/^(기호|부호|창호기호|번호|MARK)$/i), js = j(/(규격|크기|치수|SIZE|W×H|WXH)/i), jw = j(/^(폭|W|너비)$/i), jh = j(/^(높이|H)$/i), jq = j(/^(수량|개수|EA)$/i)
    if (jk < 0 || (js < 0 && (jw < 0 || jh < 0))) continue
    for (const r of t.줄) {
      const 기호 = 글(r[jk]).toUpperCase()
      if (!/^[A-Z가-힣]{1,4}-?\d{1,3}[A-Z]?$/.test(기호)) continue
      let w = NaN, h = NaN
      if (js >= 0) { const m = 글(r[js]).replace(/,/g, '').match(/(\d+(?:\.\d+)?)\s*[×xX*]\s*(\d+(?:\.\d+)?)/); if (m) { w = +m[1]; h = +m[2] } }
      if (!Number.isFinite(w) && jw >= 0) { w = Number(글(r[jw]).replace(/[^\d.]/g, '')); h = Number(글(r[jh]).replace(/[^\d.]/g, '')) }
      if (!(w > 0 && h > 0)) continue
      if (w > 20) { w /= 1000; h /= 1000 }                  // mm → m
      const 구분 = /^(W?D|SD|FD|AD|DR)/.test(기호) || /문/.test(r.join('')) ? '문' : '창'
      out.push({ 기호, 폭: String(Math.round(w * 1000) / 1000), 높이: String(Math.round(h * 1000) / 1000), 구분, 수량: jq >= 0 ? 글(r[jq]) : '', 표: t.제목 })
    }
  }
  return out
}

/* ───────────────────────────── 엑셀 */
const 열글 = (n) => { let s = ''; n++; while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26) } return s }
export function 엑셀(공사, 결과, 쓰기, 모양) {
  const 자리 = 결과.기.자리 ?? 3
  const sheets = []
  const 동씀 = 결과.줄.some((x) => x.동), 묶씀 = 결과.줄.some((x) => x.묶음), 구씀 = 결과.줄.some((x) => x.구역)
  const 칸 = [['번호', 6, (x, i) => i + 1]]
    .concat(동씀 ? [['동', 8, (x) => x.동]] : [], [['층', 6, (x) => x.층], ['실명', 12, (x) => x.실명]], 묶씀 ? [['묶음', 8, (x) => x.묶음]] : [], 구씀 ? [['구역', 8, (x) => x.구역]] : [])
    .concat([['부위', 8, (x) => x.부위], ['마감', 7, (x) => x.기호], ['재료', 18, (x) => x.재료], ['규격', 14, (x) => x.규격], ['단위', 6, (x) => x.단위],
      ['산출근거', 40, (x) => ({ v: x.식, st: 모양.BOX })], ['수량', 12, (x) => ({ f: 'ROUND(' + x.식 + ',' + 자리 + ')', st: 모양.QTY })], ['비고', 30, (x) => ({ v: x.비고, st: 모양.GRAY })]])
  const ci = (h) => 칸.findIndex(([n]) => n === h)
  sheets.push({ name: '산출서', head: 칸.map(([h]) => h), rows: 결과.줄.map((x, i) => 칸.map(([, , f]) => f(x, i))), widths: 칸.map(([, w]) => w), freeze: 1 })
  const last = Math.max(결과.줄.length + 1, 2)
  const 열 = (h) => '산출서!$' + 열글(ci(h)) + '$2:$' + 열글(ci(h)) + '$' + last
  const q = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"'
  const 합식 = (a, 앞) => 'SUMPRODUCT(' + 앞.map((k) => '(' + 열(k) + '=' + q(a[k]) + ')*').join('') + '(' + 열('재료') + '=' + q(a.재료) + ')*(' + 열('규격') + '=' + q(a.규격) + ')*(' + 열('단위') + '=' + q(a.단위) + ')*' + 열('수량') + ')'
  sheets.push({ name: '집계', head: ['재료', '규격', '단위', '수량'], rows: 결과.집계.합.map((a) => [a.재료, a.규격, a.단위, { f: 합식(a, []), st: 모양.QTY }]), widths: [20, 16, 6, 14] })
  const 모음 = (name, key, 목록) => { if (목록.length) sheets.push({ name, head: [key, '재료', '규격', '단위', '수량'], rows: 목록.map((a) => [a[key], a.재료, a.규격, a.단위, { f: 합식(a, [key]), st: 모양.QTY }]), widths: [10, 20, 16, 6, 14] }) }
  모음('층별', '층', 결과.집계.층별)
  모음('부위별', '부위', 결과.집계.부위별)
  if (동씀) 모음('동별', '동', 결과.집계.동별)
  if (구씀) 모음('구역별', '구역', 결과.집계.구역별)
  if ((결과.창호집계 || []).length) sheets.push({ name: '창호 집계', head: ['기호', '구분', '규격(mm)', '개수'], rows: 결과.창호집계.map((g) => [g.기호, g.구분, g.규격, { v: g.개수, st: 모양.QTY }]), widths: [8, 6, 14, 10] })
  if ((결과.면적검산 || []).length) sheets.push({ name: '면적 검산', head: ['묶음', '종류', '실 수', '실 면적 합(m²)', '전용면적(m²)', '차(m²)', '차(%)'], rows: 결과.면적검산.map((o) => [o.묶음, o.종류, o.실수, o.실합, o.전용 ?? '', o.차 ?? '', o.율 === null ? '' : Math.round(o.율 * 100) / 100]), widths: [10, 8, 6, 14, 14, 10, 8] })
  if (공사.당초 && Array.isArray(공사.당초.합)) {
    const cmp = 비교(공사.당초.합, 결과.집계.합)
    sheets.push({ name: '당초 대비', head: ['재료', '규격', '단위', '당초', '변경', '증감', '증감률(%)'], rows: cmp.map((a) => [a.재료, a.규격, a.단위, { v: a.당초, st: 모양.QTY }, { v: a.지금, st: 모양.QTY }, { v: a.증감, st: 모양.QTY }, a.율 === null ? '신규' : Math.round(a.율 * 100) / 100]), widths: [20, 16, 6, 12, 12, 12, 10] })
  }
  const 값 = (v) => { const t = 글(v); const n = Number(t); return t !== '' && Number.isFinite(n) ? n : t }
  const 표로 = (목록, 칸들) => (목록 || []).filter((r) => Object.entries(r).some(([k, v]) => !k.startsWith('_') && 글(v) && typeof v !== 'object')).map((r) => 칸들.map(([, k]) => 값(r[k])))
  sheets.push({ name: '실', head: 실칸.map(([h]) => h), rows: 표로(공사.실, 실칸), widths: 실칸.map(() => 10) })
  const 마rows = []
  for (const m of 공사.마감 || []) for (const r of m.재료 || []) 마rows.push([m.기호, m.부위, m.이름 || '', r.재료, r.규격, r.단위, 값(r.계수) === '' ? 1 : 값(r.계수), 글(r.주재료)])
  sheets.push({ name: '마감표', head: ['기호', '부위', '이름', '재료', '규격', '단위', '계수·식', '주재료'], rows: 마rows, widths: [7, 8, 16, 18, 14, 6, 10, 12] })
  sheets.push({ name: '창호표', head: 창호칸.map(([h]) => h), rows: 표로(공사.창호, 창호칸), widths: [8, 6, 8, 8, 20] })
  const 창rows = []
  for (const w of 공사.창호 || []) for (const r of w.재료 || []) if (글(r.재료)) 창rows.push([w.기호, r.재료, r.규격, r.단위, r.식])
  if (창rows.length) sheets.push({ name: '창호 재료', head: ['창호', '재료', '규격', '단위', '식 (W·H·A·L)'], rows: 창rows, widths: [8, 18, 14, 6, 14] })
  if ((공사.외벽 || []).length) sheets.push({ name: '외벽', head: 외벽칸.map(([h]) => h), rows: 표로(공사.외벽, 외벽칸), widths: 외벽칸.map(() => 10) })
  if ((공사.묶음 || []).length) sheets.push({ name: '묶음', head: 묶음칸.map(([h]) => h), rows: 표로(공사.묶음, 묶음칸), widths: [10, 8, 12, 20] })
  if ((공사.조합 || []).length) sheets.push({ name: '조합표', head: 조합칸.map(([h]) => h), rows: 표로(공사.조합, 조합칸), widths: [10, 10, 10, 6, 10, 20] })
  if ((공사.치환 || []).length) sheets.push({ name: '치환', head: 치환칸.map(([h]) => h), rows: 표로(공사.치환, 치환칸), widths: [8, 30, 20] })
  if ((공사.창호조합 || []).length) sheets.push({ name: '창호 조합', head: 창호조합칸.map(([h]) => h), rows: 표로(공사.창호조합, 창호조합칸), widths: [10, 10, 8, 6, 20] })
  if (결과.경고.length) sheets.push({ name: '검산', head: ['표', '줄', '확인할 것'], rows: 결과.경고.map((w) => [w.곳 ? w.곳.표 : '', w.곳 ? w.곳.i + 1 : '', w.글]), widths: [8, 6, 80] })
  return 쓰기(sheets)
}
