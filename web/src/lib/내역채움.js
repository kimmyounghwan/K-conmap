/**
 * 📥 내역서에 도면 물량 «자동으로 넣기» (2026-09-28)
 *
 * 소장님: 「물량, 내역채우는 거 다 자동이 목표야...되도록 자동으로 해줘」
 *
 * ■ 하는 일
 *   ① 골조짝  : 골조 물량(레미콘·철근·거푸집)을 내역서 줄에 «뜻» 으로 짝지음 — 이름 닮음만으로는 틀리는 자리
 *               · 레미콘 25-30-15 ↔ 콘크리트 25-24-150 처럼 강도가 다르면 짝이 아님(슬럼프 15cm = 150mm)
 *               · 철근 HD13 → 도면 D13 (재료 줄 = 할증 넣은 값)
 *               · 철근가공조립 → 철근 전체 (할증 없이) · 레미콘 타설 → 버림 빼고 콘크리트 전체
 *               · 거푸집 슬라브/벽/기초… → 그 부재의 거푸집 (규격·품명에 부재 이름이 있으면)
 *   ② 넣을것  : 대조 결과에서 «내역 수량 칸에 넣을 값» 을 고름 — 믿음 «확실» 만(약한 짝은 사람이 켤 때만)
 *               빈 수량 칸만 채우는 것이 기본(발주처 수량을 덮지 않게). 끄면 도면과 다른 수량도 바꿈.
 *   ③ 셀바꾸기: 받은 내역서(.xlsx·.xlsm) «그 파일» 의 수량 칸만 고쳐 돌려줌 — 서식·수식·다른 시트는 그대로.
 *               바꾼 칸은 노란 바탕, 맨 뒤에 «물량 넣은 곳» 시트(무엇을 어디서 가져왔나). 열 때 엑셀이 다시 셈.
 *               ⚠️ 수량 칸에 수식이 있으면 건드리지 않고 알려 줌(공유 수식이 깨지지 않게).
 *   ④ csv바꾸기: CSV 내역서는 같은 CSV 로(UTF-8).
 *
 * ■ 도면을 «해석» 하지 않습니다. 짝은 규칙·이름으로 짓고, 근거를 시트에 남깁니다. 믿음이 약한 줄은 넣지 않습니다.
 * ■ 시험: node tools/시험_내역채움.mjs
 */
import { unzipSync, zipSync, strToU8, strFromU8 } from 'fflate'
import { 단위풀기, 철근지름, 콘크리트규격 } from './내역대조.js'

const 글 = (x) => String(x ?? '').trim()
const 붙 = (s) => 글(s).replace(/\s+/g, '')

/* ───────────────────────────── ① 골조 짝 */

/** 골조 결과 → 내역 맞춤용 합계 줄(대조전용) — 콘크리트 전체(버림 빼고) · 철근 전체 · 거푸집 전체 · 부재별 거푸집 */
export function 골조보탬(결과, 버림규격 = '') {
  if (!결과 || !결과.집계) return []
  const 합 = 결과.집계.합 || []
  const out = []
  const 모아 = (거르기) => 합.filter(거르기).reduce((a, x) => ({ 수: a.수 + x.산출, 할: a.할 + x.내역 }), { 수: 0, 할: 0 })
  const 콘 = 모아((x) => x.항목 === '콘크리트' && x.규격 !== 버림규격)
  const 콘규격 = [...new Set(합.filter((x) => x.항목 === '콘크리트' && x.규격 !== 버림규격).map((x) => x.규격))]
  if (콘.수 > 0) out.push({ key: 'gzT:콘크리트', 대조전용: true, 골: { 항목: '콘크리트', 전체: true }, 구분: '🏗 골조 (내역 맞춤 합계)', 품명: '콘크리트 타설', 규격: '버림 빼고 전체', 단위: 'm3', 수량: 콘.수, 할증수량: 콘.할, 근거: '골조 콘크리트 ' + 콘규격.join('·') + ' 합 (할증 전)' })
  const 철 = 모아((x) => x.항목 === '철근')
  if (철.수 > 0) out.push({ key: 'gzT:철근', 대조전용: true, 골: { 항목: '철근', 전체: true }, 구분: '🏗 골조 (내역 맞춤 합계)', 품명: '철근가공조립', 규격: '철근 전체', 단위: 'ton', 수량: 철.수, 할증수량: 철.할, 근거: '골조 철근 전 지름 합 (할증 전)' })
  const 틀 = 모아((x) => x.항목 === '거푸집')
  if (틀.수 > 0) out.push({ key: 'gzT:거푸집', 대조전용: true, 골: { 항목: '거푸집', 전체: true }, 구분: '🏗 골조 (내역 맞춤 합계)', 품명: '거푸집', 규격: '전체', 단위: 'm2', 수량: 틀.수, 할증수량: 틀.할, 근거: '골조 거푸집 전체 (할증 전)' })
  const 부 = new Map()
  for (const x of (결과.집계.층부재 || [])) if (x.항목 === '거푸집') 부.set(x.부재, (부.get(x.부재) || 0) + x.수량)
  const 틀할 = (합.find((x) => x.항목 === '거푸집') || {}).할증 || 0
  for (const [부재, v] of 부) if (v > 0) out.push({ key: 'gzP:거푸집|' + 부재, 대조전용: true, 골: { 항목: '거푸집', 부재 }, 구분: '🏗 골조 (내역 맞춤 부재별)', 품명: '거푸집', 규격: 부재, 단위: 'm2', 수량: v, 할증수량: v * (1 + 틀할 / 100), 근거: '골조 ' + 부재 + ' 거푸집 전 층 합' })
  return out
}

/** 글 속 부재 이름들 (거푸집 줄의 «슬라브» «벽» …) */
export function 부재들(t) {
  const s = 글(t).toUpperCase()
  const out = []
  if (/슬라브|슬래브|SLAB|데크/.test(s)) out.push('슬라브')
  if (/기둥|COLUMN/.test(s)) out.push('기둥')
  if (/(^|[^가-힣])(큰|작은|지중|테두리)?보($|[^가-힣])|BEAM|GIRDER/.test(s)) out.push('보')
  if (/옹벽|벽체|(^|[^가-힣])벽($|[^가-힣])|WALL/.test(s) && !/합벽/.test(s)) out.push('벽')
  if (/기초|매트|FOOTING|MAT(?![A-Z])|푸팅/.test(s)) out.push('기초')
  if (/계단|STAIR/.test(s)) out.push('계단')
  if (/파라펫|PARAPET/.test(s)) out.push('파라펫')
  return out
}
const 벽부재 = ['벽', '벽(기타)', 'Dry Area']

/** 내역 줄의 «골조 갈래» — 레미콘 · 타설 · 철근재료 · 가공조립 · 거푸집 · 'X'(골조 말을 쓰지만 골조 물량이 아님: 양생·방수턱…) · '' */
export function 골조갈래(n) {
  const u = 단위풀기(n.단위).무리
  const 이 = 붙(n.품명).toUpperCase()
  const T = (붙(n.품명) + ' ' + 붙(n.규격)).toUpperCase()
  if (u === 'kg' && /철근|봉강|REBAR/.test(이)) {
    if (/가공|조립/.test(이)) return '가공조립'
    if (/운반|절단|이음|커플러|결속|스페이서|배근|체어|정착|앵커|용접|기계식|녹|방청|하차|소운반|인력/.test(이)) return 'X'
    return '철근재료'
  }
  if (u === 'm3') {
    if (/벽돌|블록|블럭|인방|깨기|철거|면처리|폴리싱|미장|양생|보수|절단|코어|천공|2차|파일|말뚝|측구|경계석|흄관|관로|암거|맨홀|집수정|포장|잡석|자갈|모래|되메우|되메움|성토|절토|터파기/.test(이)) return /레미콘|콘크리트|CONC|타설/.test(이) ? 'X' : ''
    if (/무근/.test(T) && !/버림|밑창/.test(T)) return 'X'                     // 무근(버림 아닌 것 — 바닥·보호 콘크리트)은 골조 물량이 아님
    if (/타설/.test(T)) return '타설'
    if (/레미콘|레디믹스|콘크리트|CONC/.test(이)) return '레미콘'
    return ''
  }
  if (u === 'm2' && /거푸집|형틀|유로폼|알폼|갱폼|합판폼|FORM/.test(이)) {      // 품명으로만 (규격 «구조,거푸집» 인 먹매김에 속지 않게)
    if (/방수턱|해체|박리|동바리|비계|받침|턱/.test(이)) return 'X'
    return '거푸집'
  }
  return ''
}

/**
 * 골조 뜻으로 짝 짓기
 * @param 도면 대조에 넣을 도면 줄(골조 줄은 d.골 = {항목, 규격, 버림} · 보탬 줄 포함)
 * @param 내역 내역 줄들(켠 시트)
 * @returns {규칙: Map(id → {key|null, 믿음, 까닭, 할증}), 더: [부재 여럿을 더한 대조전용 줄]}
 */
export function 골조짝(도면, 내역) {
  const 규칙 = new Map()
  const 더 = []
  const 골줄 = 도면.filter((d) => d.골)
  if (!골줄.length) return { 규칙, 더 }
  const 콘들 = 골줄.filter((d) => d.골.항목 === '콘크리트' && !d.골.전체 && !d.골.부재)
  const 버림들 = 콘들.filter((d) => d.골.버림)
  const 구조콘 = 콘들.filter((d) => !d.골.버림)
  const 철들 = 골줄.filter((d) => d.골.항목 === '철근' && !d.골.전체)
  const 찾 = (key) => 도면.find((d) => d.key === key)
  const 갈 = new Map(내역.map((n) => [n.id, 골조갈래(n)]))
  const 몇 = (g, 거르기 = () => true) => 내역.filter((n) => 갈.get(n.id) === g && 거르기(n)).length
  for (const n of 내역) {
    const g = 갈.get(n.id)
    if (!g) continue
    if (g === 'X') { 규칙.set(n.id, { key: null, 믿음: '', 까닭: '골조 물량과 다른 품목(양생·방수턱·운반 등) — 골조 물량을 넣지 않음' }); continue }
    const T = n.품명 + ' ' + n.규격
    const 버림말 = /버림|밑창/.test(붙(T))
    if (g === '철근재료') {
      const d = 철근지름(T)
      const hit = d ? 철들.find((x) => 철근지름(x.규격) === d) : null
      if (hit) { 규칙.set(n.id, { key: hit.key, 믿음: '확실', 까닭: '철근 ' + d + ' — 재료 줄이라 할증 넣은 값', 할증: true }); continue }
      if (!d && 철들.length === 1) { 규칙.set(n.id, { key: 철들[0].key, 믿음: '약함', 까닭: '지름이 안 적힌 철근 줄 — 도면 철근이 한 지름뿐', 할증: true }); continue }
      규칙.set(n.id, { key: null, 믿음: '', 까닭: d ? '골조에 ' + d + ' 철근이 없음' : '지름이 안 적힌 철근 줄' })
      continue
    }
    if (g === '가공조립') {
      const t = 찾('gzT:철근')
      if (!t) { 규칙.set(n.id, { key: null, 믿음: '', 까닭: '골조 철근 없음' }); continue }
      const 모두 = 내역.filter((x) => 갈.get(x.id) === '가공조립')
      const 가공만 = (x) => /가공/.test(x.품명 + x.규격) && !/조립/.test(x.품명 + x.규격)
      const 조립만 = (x) => /조립/.test(x.품명 + x.규격) && !/가공/.test(x.품명 + x.규격)
      const 갈라짐 = 모두.length === 2 && 모두.some(가공만) && 모두.some(조립만)
      규칙.set(n.id, { key: t.key, 믿음: 모두.length === 1 || 갈라짐 ? '확실' : '약함', 까닭: 모두.length === 1 || 갈라짐 ? '철근 전체 (가공조립은 할증 없이)' : '가공조립 줄이 ' + 모두.length + '개 — 난이도별로 나눈 것이면 직접 나누십시오', 할증: false })
      continue
    }
    if (g === '레미콘' || g === '타설') {
      const c = 콘크리트규격(T)
      if (버림말) {
        const hit = c ? 버림들.find((x) => { const k = 콘크리트규격(x.규격); return k && k.fck === c.fck }) : 버림들[0]
        if (hit) 규칙.set(n.id, { key: hit.key, 믿음: 버림들.length === 1 || c ? '확실' : '약함', 까닭: '버림(무근) 콘크리트' + (g === '레미콘' ? ' — 재료 줄이라 할증 넣은 값' : ''), 할증: g === '레미콘' })
        else 규칙.set(n.id, { key: null, 믿음: '', 까닭: '골조에 버림 콘크리트가 없음' })
        continue
      }
      if (c) {
        const 같은 = 구조콘.filter((x) => { const k = 콘크리트규격(x.규격); return k && k.fck === c.fck && (!k.골재 || !c.골재 || k.골재 === c.골재) })
        if (같은.length === 1) { 규칙.set(n.id, { key: 같은[0].key, 믿음: '확실', 까닭: '강도 ' + c.fck + 'MPa 같음' + (g === '레미콘' ? ' — 재료 줄이라 할증 넣은 값' : ' (타설은 할증 없이)'), 할증: g === '레미콘' }); continue }
        규칙.set(n.id, { key: null, 믿음: '', 까닭: '골조에 ' + c.fck + 'MPa 콘크리트가 없음 (도면: ' + (구조콘.map((x) => x.규격).join('·') || '없음') + ')' })
        continue
      }
      if (g === '타설') {
        const t = 찾('gzT:콘크리트')
        const 여럿 = 몇('타설', (x) => !콘크리트규격(x.품명 + ' ' + x.규격) && !/버림|밑창/.test(붙(x.품명 + x.규격))) > 1
        if (t) 규칙.set(n.id, { key: t.key, 믿음: 여럿 ? '약함' : '확실', 까닭: 여럿 ? '강도 없는 타설 줄이 여럿 — 방법(펌프·인력)별로 나눈 것이면 직접 나누십시오' : '버림 빼고 콘크리트 전체 (타설은 할증 없이)', 할증: false })
        else 규칙.set(n.id, { key: null, 믿음: '', 까닭: '골조 콘크리트 없음' })
        continue
      }
      // 강도 없는 레미콘 줄 — 도면 구조 콘크리트가 한 가지면 그것
      if (구조콘.length === 1) 규칙.set(n.id, { key: 구조콘[0].key, 믿음: '약함', 까닭: '강도가 안 적힌 레미콘 줄 — 도면 콘크리트가 한 가지뿐', 할증: true })
      else 규칙.set(n.id, { key: null, 믿음: '', 까닭: '강도가 안 적힌 레미콘 줄 — 도면 콘크리트가 ' + 구조콘.length + '가지' })
      continue
    }
    if (g === '거푸집') {
      const 부 = 부재들(T)
      const 부줄 = (p) => (p === '벽' ? 벽부재 : [p]).map((q) => 찾('gzP:거푸집|' + q)).filter(Boolean)
      if (부.length) {
        const 줄들 = 부.flatMap(부줄)
        if (!줄들.length) { 규칙.set(n.id, { key: null, 믿음: '', 까닭: '골조에 ' + 부.join('·') + ' 거푸집이 없음' }); continue }
        if (줄들.length === 1) { 규칙.set(n.id, { key: 줄들[0].key, 믿음: '확실', 까닭: 부.join('·') + ' 거푸집', 할증: false }); continue }
        const key = 'gzP:거푸집|' + 줄들.map((d) => d.규격).join('+')
        if (!더.some((d) => d.key === key) && !찾(key)) {
          더.push({ key, 대조전용: true, 골: { 항목: '거푸집', 부재: 줄들.map((d) => d.규격).join('+') }, 구분: '🏗 골조 (내역 맞춤 부재별)', 품명: '거푸집', 규격: 줄들.map((d) => d.규격).join('+'), 단위: 'm2',
            수량: 줄들.reduce((a, d) => a + d.수량, 0), 할증수량: 줄들.reduce((a, d) => a + d.할증수량, 0), 근거: 줄들.map((d) => d.규격).join('+') + ' 거푸집 합' })
        }
        규칙.set(n.id, { key, 믿음: '확실', 까닭: 부.join('·') + ' 거푸집 합', 할증: false })
        continue
      }
      const t = 찾('gzT:거푸집')
      const 하나 = 몇('거푸집') === 1
      if (t) 규칙.set(n.id, { key: t.key, 믿음: 하나 && !/경사|원형|곡면|합벽|노출|문양/.test(붙(T)) ? '확실' : '약함', 까닭: 하나 ? '거푸집 줄이 하나 — 골조 거푸집 전체' : '거푸집 줄이 여럿인데 부재 이름이 없음 — 확인', 할증: false })
      else 규칙.set(n.id, { key: null, 믿음: '', 까닭: '골조 거푸집 없음' })
    }
  }
  return { 규칙, 더 }
}

/* ───────────────────────────── ② 넣을 것 */

const 둥글게 = (v, u) => { const t = 단위풀기(u); const 자리 = t.무리 === '개' ? 0 : 3; const p = 10 ** 자리; return Math.round(v * p) / p }

/**
 * 대조 결과 → 내역서 수량 칸에 넣을 것
 * @param 옵션 {빈만: true(빈 칸만) · 할증: true(재료 줄은 할증 넣은 값) · 약함: false(약한 짝도)}
 * @returns {바꿀: [{id, 시트, 줄, 칸, 값, 전, 품명, 규격, 단위, 믿음, 까닭, 근거, 도면품명}], 셈: {넣음, 약함, 있음, 같음, 없음}}
 */
export function 넣을것(대조결과, 옵션 = {}) {
  const { 빈만 = true, 할증 = true, 약함 = false } = 옵션
  const 바꿀 = []
  const 셈 = { 넣음: 0, 약함: 0, 있음: 0, 같음: 0, 없음: 0 }
  for (const r of (대조결과 && 대조결과.줄) || []) {
    const n = r.내역
    if (!r.도면) { if (n.빈) 셈.없음++; continue }
    if (r.믿음 !== '확실' && !약함) { 셈.약함++; continue }
    const 할 = 할증 && r.할증수량 !== null && r.할증수량 !== undefined
    const 값 = 둥글게(할 ? r.할증수량 : r.도면수량, n.단위)
    if (!n.빈) {
      if (Math.abs(값 - n.수량) < 0.0005) { 셈.같음++; continue }
      if (빈만) { 셈.있음++; continue }
    }
    if (!(n.수량칸 >= 0)) continue
    셈.넣음++
    바꿀.push({ id: n.id, 시트: n.시트, 줄: n.줄, 칸: n.수량칸, 값, 전: n.빈 ? null : n.수량, 품명: n.품명, 규격: n.규격, 단위: n.단위, 믿음: r.믿음, 까닭: r.까닭 + (할 ? ' (할증 ' + r.할증 + '%)' : ''), 근거: (r.도면.구분 ? r.도면.구분 + ' · ' : '') + (r.도면.근거 || ''), 도면품명: r.도면.품명 + (r.도면.규격 ? ' ' + r.도면.규격 : '') })
  }
  return { 바꿀, 셈 }
}

/* ───────────────────────────── ③ xlsx 그 파일의 칸만 고치기 */

const 이름표 = '(?:[A-Za-z_][\\w.-]*:)?'
const 속성 = (tag, name) => { const m = new RegExp('\\s' + name.replace(/[:]/g, '\\:') + '="([^"]*)"').exec(tag); return m ? m[1] : null }
function 속성넣기(tag, name, v) {
  const re = new RegExp('(\\s' + name.replace(/[:]/g, '\\:') + '=")[^"]*(")')
  if (re.test(tag)) return tag.replace(re, '$1' + v + '$2')
  return tag.replace(/^(<[^\s/>]+)/, '$1 ' + name + '="' + v + '"')
}
const 속성빼기 = (tag, name) => tag.replace(new RegExp('\\s' + name + '="[^"]*"'), '')
const 풀글 = (s) => String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&')
const 싼글 = (s) => String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
function 열번호(ref) { let n = 0; for (const c of ref.toUpperCase()) n = n * 26 + (c.charCodeAt(0) - 64); return n }
function 열글(n) { let s = ''; while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = ((n - r) / 26) | 0 } return s }

/** <tag ...>…</tag> 한 덩이 (이름표 붙은 태그도) */
function 덩이(xml, tag, from = 0) {
  const re = new RegExp('<(' + 이름표 + ')' + tag + '\\b[^>]*?(/?)>', 'g')
  re.lastIndex = from
  const m = re.exec(xml)
  if (!m) return null
  const pre = m[1]
  if (m[2] === '/') return { start: m.index, 속끝: m.index + m[0].length, 닫시작: m.index + m[0].length, end: m.index + m[0].length, pre, 여는: m[0], 홀로: true }
  const 닫 = '</' + pre + tag + '>'
  const ci = xml.indexOf(닫, m.index + m[0].length)
  if (ci < 0) return null
  return { start: m.index, 속끝: m.index + m[0].length, 닫시작: ci, end: ci + 닫.length, pre, 여는: m[0], 홀로: false }
}
/** 목록 속 항목들 (<fill>…</fill> · <xf …/>) */
function 항목들(inner, pre, tag) {
  const re = new RegExp('<' + pre + tag + '\\b[^>]*/>|<' + pre + tag + '\\b[^>]*>[\\s\\S]*?</' + pre + tag + '>', 'g')
  return inner.match(re) || []
}

/** 시트 이름 → zip 경로 · 워크북 정보 */
function 시트지도(zip) {
  const wb = strFromU8(zip['xl/workbook.xml'])
  const rels = zip['xl/_rels/workbook.xml.rels'] ? strFromU8(zip['xl/_rels/workbook.xml.rels']) : ''
  const relMap = {}
  for (const m of rels.matchAll(/<(?:[A-Za-z_][\w.-]*:)?Relationship\b[^>]*\/?>/g)) {
    const id = 속성(m[0], 'Id'); let t = 속성(m[0], 'Target') || ''
    if (!id) continue
    t = t.replace(/^\//, '')
    if (!t.startsWith('xl/')) t = 'xl/' + t
    relMap[id] = t.replace(/xl\/\.\.\//, '')
  }
  const 지도 = new Map()
  let i = 0, 아이디이름 = 'r:id', 최대 = 0
  for (const m of wb.matchAll(new RegExp('<' + 이름표 + 'sheet\\b[^>]*/?>', 'g'))) {
    i++
    const nm = 풀글(속성(m[0], 'name') || ('시트' + i)).trim()
    const idm = /\s([A-Za-z_][\w.-]*:id)="([^"]*)"/.exec(m[0])
    if (idm) 아이디이름 = idm[1]
    최대 = Math.max(최대, +(속성(m[0], 'sheetId') || 0))
    const path = (idm && relMap[idm[2]]) || ('xl/worksheets/sheet' + i + '.xml')
    지도.set(nm, path)
  }
  return { 지도, 아이디이름, 최대, 수: i }
}

/** 노란 바탕 꾸밈 — 원래 꾸밈(숫자 형식·테두리·글꼴)은 두고 바탕만 칠함 */
class 칠 {
  constructor(xml) {
    this.xml = xml
    this.fills = 덩이(xml, 'fills')
    this.xfs = 덩이(xml, 'cellXfs')
    this.ok = !!(this.fills && this.xfs && !this.fills.홀로 && !this.xfs.홀로)
    if (!this.ok) return
    this.pre = this.fills.pre
    this.fl = 항목들(xml.slice(this.fills.속끝, this.fills.닫시작), this.pre, 'fill')
    this.xl = 항목들(xml.slice(this.xfs.속끝, this.xfs.닫시작), this.xfs.pre, 'xf')
    this.노랑 = -1
    this.캐시 = new Map()
  }
  색(s) {
    if (!this.ok) return s
    const k = +s || 0
    if (this.캐시.has(k)) return this.캐시.get(k)
    if (this.노랑 < 0) {
      const p = this.pre
      this.fl.push('<' + p + 'fill><' + p + 'patternFill patternType="solid"><' + p + 'fgColor rgb="FFFFF29A"/><' + p + 'bgColor indexed="64"/></' + p + 'patternFill></' + p + 'fill>')
      this.노랑 = this.fl.length - 1
    }
    const 원 = this.xl[k] || this.xl[0] || '<' + this.xfs.pre + 'xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
    const 머리 = /^<[^>]*?\/?>/.exec(원)[0]
    let 새머리 = 속성넣기(머리.replace(/\/>$/, '>').replace(/>$/, ''), 'fillId', String(this.노랑))
    새머리 = 속성넣기(새머리, 'applyFill', '1')
    const 새 = 원.endsWith('/>') && 머리 === 원 ? 새머리 + '/>' : 새머리 + '>' + 원.slice(머리.length)
    this.xl.push(새)
    const i = this.xl.length - 1
    this.캐시.set(k, i)
    return i
  }
  짓기() {
    if (!this.ok || this.노랑 < 0) return this.xml
    let x = this.xml
    // 뒤쪽(cellXfs)부터 갈아 끼워야 앞 위치가 안 밀림 — fills 가 cellXfs 보다 앞에 있음
    const xb = 덩이(x, 'cellXfs')
    x = x.slice(0, xb.start) + 속성넣기(xb.여는, 'count', String(this.xl.length)) + this.xl.join('') + x.slice(xb.닫시작)
    const fb = 덩이(x, 'fills')
    x = x.slice(0, fb.start) + 속성넣기(fb.여는, 'count', String(this.fl.length)) + this.fl.join('') + x.slice(fb.닫시작)
    return x
  }
}

/** 한 시트의 칸들 고치기 → {xml, 됨:[…], 안됨:[{…, 까닭}]} */
function 시트고치기(xml, 목록, 칠하기) {
  const sd = 덩이(xml, 'sheetData')
  if (!sd) return { xml, 됨: [], 안됨: 목록.map((x) => ({ ...x, 까닭: '시트 자료를 못 찾음' })) }
  const pre = sd.pre
  let body = sd.홀로 ? '' : xml.slice(sd.속끝, sd.닫시작)
  const 됨 = [], 안됨 = []
  const 줄별 = new Map()
  for (const x of 목록) { if (!줄별.has(x.줄)) 줄별.set(x.줄, []); 줄별.get(x.줄).push(x) }
  const rowRe = () => new RegExp('<' + pre + 'row\\b[^>]*/>|<' + pre + 'row\\b[^>]*>[\\s\\S]*?</' + pre + 'row>', 'g')
  const cRe = () => new RegExp('<' + pre + 'c\\b[^>]*/>|<' + pre + 'c\\b[^>]*>[\\s\\S]*?</' + pre + 'c>', 'g')
  const 새칸 = (ref, s, v) => '<' + pre + 'c r="' + ref + '"' + (s !== null ? ' s="' + s + '"' : '') + '><' + pre + 'v>' + v + '</' + pre + 'v></' + pre + 'c>'
  const 값글 = (v) => String(Math.round(v * 1e6) / 1e6)
  // 이미 있는 줄 고치기
  const 있는줄 = new Set()
  body = body.replace(rowRe(), (row) => {
    const 여는 = /^<[^>]*>/.exec(row)[0]
    const rn = +(속성(여는, 'r') || 0)
    const 할것 = 줄별.get(rn)
    if (!rn || !할것) return row
    있는줄.add(rn)
    let 속 = row.endsWith('/>') && 여는 === row ? '' : row.slice(여는.length, row.length - ('</' + pre + 'row>').length)
    const 칸들 = 속.match(cRe()) || []
    if (칸들.some((c) => !속성(c, 'r'))) { for (const x of 할것) 안됨.push({ ...x, 까닭: '칸 자리를 못 읽음' }); return row }
    for (const x of 할것) {
      const ref = 열글(x.칸 + 1) + rn
      const i = 칸들.findIndex((c) => 속성(c, 'r') === ref)
      if (i >= 0) {
        const c = 칸들[i]
        if (new RegExp('<' + pre + 'f\\b').test(c)) { 안됨.push({ ...x, 까닭: '수량 칸이 수식이라 그대로 둠' }); continue }
        칸들[i] = 새칸(ref, 칠하기 ? 칠하기.색(속성(c, 's') || 0) : 속성(c, 's'), 값글(x.값))
      } else {
        const 열 = x.칸 + 1
        let at = 칸들.findIndex((c) => 열번호(속성(c, 'r').replace(/\d+$/, '')) > 열)
        if (at < 0) at = 칸들.length
        칸들.splice(at, 0, 새칸(ref, 칠하기 ? 칠하기.색(0) : null, 값글(x.값)))
      }
      됨.push(x)
    }
    // 속에서 칸이 아닌 것(extLst 등)은 없다고 봄 — 칸만 다시 늘어놓음
    const 남은것 = 속.replace(cRe(), '')
    return 속성빼기(여는.replace(/\/>$/, '>'), 'spans') + 칸들.join('') + 남은것 + '</' + pre + 'row>'
  })
  // 없는 줄 새로 만들기 (차례대로 끼움)
  const 새줄들 = [...줄별.keys()].filter((rn) => !있는줄.has(rn)).sort((a, b) => a - b)
  for (const rn of 새줄들) {
    const 할것 = 줄별.get(rn).sort((a, b) => a.칸 - b.칸)
    const 칸 = 할것.map((x) => 새칸(열글(x.칸 + 1) + rn, 칠하기 ? 칠하기.색(0) : null, 값글(x.값))).join('')
    const 새 = '<' + pre + 'row r="' + rn + '">' + 칸 + '</' + pre + 'row>'
    let 넣을곳 = body.length
    for (const m of body.matchAll(rowRe())) { const r = +(속성(/^<[^>]*>/.exec(m[0])[0], 'r') || 0); if (r > rn) { 넣을곳 = m.index; break } }
    body = body.slice(0, 넣을곳) + 새 + body.slice(넣을곳)
    for (const x of 할것) 됨.push(x)
  }
  const 새xml = sd.홀로
    ? xml.slice(0, sd.start) + '<' + pre + 'sheetData>' + body + '</' + pre + 'sheetData>' + xml.slice(sd.end)
    : xml.slice(0, sd.속끝) + body + xml.slice(sd.닫시작)
  return { xml: 새xml, 됨, 안됨 }
}

/** 알림 시트 XML (꾸밈 없이 — 남의 파일 꾸밈 번호를 빌리지 않음) */
function 알림시트(머리, 줄들, 너비) {
  const 칸 = (ref, v) => (v === null || v === undefined || v === '' ? '' : typeof v === 'number'
    ? '<c r="' + ref + '"><v>' + v + '</v></c>'
    : '<c r="' + ref + '" t="inlineStr"><is><t xml:space="preserve">' + 싼글(v) + '</t></is></c>')
  const rows = [머리, ...줄들].map((r, i) => '<row r="' + (i + 1) + '">' + r.map((v, j) => 칸(열글(j + 1) + (i + 1), v)).join('') + '</row>')
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
    '<cols>' + 너비.map((w, i) => '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>').join('') + '</cols>' +
    '<sheetData>' + rows.join('') + '</sheetData></worksheet>'
}

/**
 * 받은 내역서의 수량 칸만 고쳐 돌려줌
 * @param bytes 원래 파일(.xlsx·.xlsm)  @param 바꿀 넣을것().바꿀
 * @param 설명 {알림: true(맨 뒤에 «물량 넣은 곳» 시트), 칠: true(노란 바탕), 도면: '도면 이름들'}
 * @returns {bytes: Uint8Array, 됨: [...], 안됨: [{..., 까닭}]}
 */
export function 셀바꾸기(bytes, 바꿀, 설명 = {}) {
  const { 알림 = true, 칠: 칠함 = true, 도면 = '' } = 설명
  let zip
  try { zip = unzipSync(new Uint8Array(bytes)) } catch (e) { throw new Error('엑셀(.xlsx) 파일을 열지 못했습니다') }
  if (!zip['xl/workbook.xml']) throw new Error('엑셀(.xlsx) 파일이 아닙니다')
  const { 지도, 아이디이름, 최대 } = 시트지도(zip)
  const 칠하기 = 칠함 && zip['xl/styles.xml'] ? new 칠(strFromU8(zip['xl/styles.xml'])) : null
  const 됨 = [], 안됨 = []
  const 시트별 = new Map()
  for (const x of 바꿀) { if (!시트별.has(x.시트)) 시트별.set(x.시트, []); 시트별.get(x.시트).push(x) }
  for (const [시트, 목록] of 시트별) {
    const path = 지도.get(String(시트).trim())
    if (!path || !zip[path]) { for (const x of 목록) 안됨.push({ ...x, 까닭: '시트를 못 찾음' }); continue }
    const r = 시트고치기(strFromU8(zip[path]), 목록, 칠하기)
    zip[path] = strToU8(r.xml)
    됨.push(...r.됨); 안됨.push(...r.안됨)
  }
  if (칠하기 && 칠하기.ok) zip['xl/styles.xml'] = strToU8(칠하기.짓기())

  let wb = strFromU8(zip['xl/workbook.xml'])
  if (알림) {
    const 이름들 = new Set(지도.keys())
    let 이름 = '물량 넣은 곳 (K-건설맵)'
    for (let k = 2; 이름들.has(이름); k++) 이름 = '물량 넣은 곳 ' + k
    let 경로번호 = 1
    while (zip['xl/worksheets/kcm' + 경로번호 + '.xml']) 경로번호++
    const 경로 = 'xl/worksheets/kcm' + 경로번호 + '.xml'
    const rid = 'rIdKcm' + 경로번호
    const 머리 = ['번호', '시트', '줄', '품명', '규격', '단위', '전 수량', '넣은 수량', '짝 (도면 물량)', '믿음', '까닭', '도면 근거']
    const 행 = 됨.map((x, i) => [i + 1, x.시트, x.줄, x.품명, x.규격 || '', x.단위, x.전 === null || x.전 === undefined ? '(빈 칸)' : x.전, x.값, x.도면품명 || '', x.믿음 || '', x.까닭 || '', x.근거 || ''])
    for (const x of 안됨) 행.push(['', x.시트, x.줄, x.품명, x.규격 || '', x.단위, x.전 === null || x.전 === undefined ? '(빈 칸)' : x.전, '안 넣음', x.도면품명 || '', '', x.까닭, x.근거 || ''])
    행.push([])
    행.push(['', '※ K-건설맵 «도면 물량 자동» 이 넣은 칸입니다(노란 바탕). 도면: ' + (도면 || '—')])
    행.push(['', '※ 도면에 적힌 표·글자·선을 자리대로 옮긴 값입니다. 제출 전에 줄마다 근거를 확인하십시오. 수식이 있던 수량 칸은 건드리지 않았습니다.'])
    zip[경로] = strToU8(알림시트(머리, 행, [6, 14, 6, 26, 18, 6, 11, 11, 28, 6, 40, 50]))
    // 워크북 · 관계 · 꼴
    const sh = 덩이(wb, 'sheets')
    if (sh && !sh.홀로) {
      // 관계 이름표(r:)를 그 자리에서 다시 밝힘 — 뿌리에 없고 시트마다 밝힌 파일도 있음(openpyxl 등)
      const rp = 아이디이름.split(':')[0]
      const 새 = '<' + sh.pre + 'sheet xmlns:' + rp + '="http://schemas.openxmlformats.org/officeDocument/2006/relationships" name="' + 싼글(이름) + '" sheetId="' + (최대 + 1) + '" ' + 아이디이름 + '="' + rid + '"/>'
      wb = wb.slice(0, sh.닫시작) + 새 + wb.slice(sh.닫시작)
      let rels = zip['xl/_rels/workbook.xml.rels'] ? strFromU8(zip['xl/_rels/workbook.xml.rels']) : ''
      const 닫 = rels.match(/<\/(?:[A-Za-z_][\w.-]*:)?Relationships>/)
      if (닫) {
        const rp = (/<((?:[A-Za-z_][\w.-]*:)?)Relationships\b/.exec(rels) || ['', ''])[1]
        rels = rels.slice(0, 닫.index) + '<' + rp + 'Relationship Id="' + rid + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/kcm' + 경로번호 + '.xml"/>' + rels.slice(닫.index)
        zip['xl/_rels/workbook.xml.rels'] = strToU8(rels)
        let ct = strFromU8(zip['[Content_Types].xml'])
        const cc = ct.match(/<\/(?:[A-Za-z_][\w.-]*:)?Types>/)
        const cp = (/<((?:[A-Za-z_][\w.-]*:)?)Types\b/.exec(ct) || ['', ''])[1]
        if (cc) ct = ct.slice(0, cc.index) + '<' + cp + 'Override PartName="/' + 경로 + '" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' + ct.slice(cc.index)
        zip['[Content_Types].xml'] = strToU8(ct)
      } else { delete zip[경로] }
    } else { delete zip[경로] }
  }
  // 열 때 한 번 다시 셈 (금액 = 수량 × 단가 식이 새 수량으로)
  const cp = new RegExp('<' + 이름표 + 'calcPr\\b[^>]*/>').exec(wb)
  if (cp) wb = wb.slice(0, cp.index) + 속성넣기(cp[0].replace(/\/>$/, '').replace(/\s+$/, ''), 'fullCalcOnLoad', '1') + '/>' + wb.slice(cp.index + cp[0].length)
  else {
    const wc = /<\/((?:[A-Za-z_][\w.-]*:)?)workbook>/.exec(wb)
    if (wc) {
      // calcPr 은 sheets·definedNames 뒤에 와야 함 — 끝 태그 앞 extLst 가 있으면 그 앞
      const ext = new RegExp('<' + 이름표 + 'extLst\\b').exec(wb)
      const at = ext ? ext.index : wc.index
      wb = wb.slice(0, at) + '<' + wc[1] + 'calcPr calcId="0" fullCalcOnLoad="1"/>' + wb.slice(at)
    }
  }
  zip['xl/workbook.xml'] = strToU8(wb)
  return { bytes: zipSync(zip, { level: 6 }), 됨, 안됨 }
}

/* ───────────────────────────── ④ CSV */

function csv가르기(line) {
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
const csv싸기 = (v) => (/[",\n\r]/.test(v) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v))

/** CSV 내역서의 수량 칸만 고친 CSV (UTF-8 BOM) */
export function csv바꾸기(bytes, 바꿀) {
  let t = new TextDecoder('utf-8').decode(bytes)
  if (t.includes('�')) { try { t = new TextDecoder('euc-kr').decode(bytes) } catch (e) { /* 그대로 */ } }
  const 줄들 = t.replace(/^﻿/, '').split(/\r?\n/)
  const 됨 = []
  for (const x of 바꿀) {
    const i = x.줄 - 1
    if (i < 0 || i >= 줄들.length) continue
    const 칸 = csv가르기(줄들[i])
    while (칸.length <= x.칸) 칸.push('')
    칸[x.칸] = String(x.값)
    줄들[i] = 칸.map(csv싸기).join(',')
    됨.push(x)
  }
  return { bytes: strToU8('﻿' + 줄들.join('\r\n')), 됨, 안됨: [] }
}
