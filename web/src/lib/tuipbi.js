/**
 * 🏗 현장 투입비 · 공사일보 — 셈·엑셀·예시 (2026-09-26)
 *
 * 소장님: 「공사일보를 시스템화 하는 거...이건 너무 확장판인듯 하고, 난 투입비만 나오면 돼.
 *          총공사금액 얼마. 현재 투입비 얼마...등...최대한 단순하면서 필요한 기능은 다 있는것...
 *          건설맵에서 등록해서 사용하게 하는 거지...」
 *        → 첫 판(투입비만) 2026-09-26 02시
 * 소장님: 「공사금액으로 해서 공정률도 함께 나오게」 → 기성금액 적기 (공정률 = 누적 기성 ÷ 총공사금액)
 *        「어차피 공사 관계자만 보는 거니까. 노무자 및 장비, 자재 청구내역서 작성해서 보여주는 걸로 하자. 매달...」
 *        → 명부(근로자·장비·자재 업체) · 날마다 출역 · 매달 청구내역서 3종 · 공제 자동(lib/gongje.js) · 주민번호·계좌 잠금(lib/tplock.js)
 *
 * 저장 자리(파이어베이스, 규칙은 web/database.rules.json «현장 투입비»):
 *   cost_pins/{코드}               비밀번호 해시(아무도 못 읽음)
 *   cost_keys/{코드}/{uid}         이 브라우저가 비밀번호를 맞혔다는 표시(같은 해시)
 *   cost_sites/{코드}              {name, total, budget?, start?, end?, co?, at, upd?}
 *   cost_rows/{코드}/{id}          {d, k:'L|M|E|S|X|O|G', t?, amt, q?, u?, un?, sp?, eq?, vd?, by?, at}   G = 기성
 *   cost_people/{코드}/{id}        {n 이름, j 직종, w 일급, tel?, x? 잠금(주민번호·은행·계좌·예금주), nx? 공제 빼기, off?, at}
 *   cost_equip/{코드}/{id}         {n 장비명, s? 규격, v? 업체, u 단가, un 단위, x? 잠금(사업자번호·은행·계좌·예금주), off?, at}
 *   cost_vendors/{코드}/{id}       {n 업체명, g? 품목, x? 잠금, off?, at}
 *   cost_att/{코드}/{YYYY-MM}/{사람} {w 그달 일급, d:{'01':1,'02':0.5}, o?:{it,lt,ei,np,hi,lc 고쳐 쓴 공제}, m? 비고}
 */
import { writeWorkbook, ST } from './qtoxlsx.js'
import { 공제셈, 공제합치기, 공제칸 } from './gongje.js'
import { 주민가림 } from './tplock.js'

export const 구분 = [
  { k: 'L', 이름: '노무비', 색: '#3b82f6' },
  { k: 'M', 이름: '자재비', 색: '#10b981' },
  { k: 'E', 이름: '장비비', 색: '#f59e0b' },
  { k: 'S', 이름: '외주비', 색: '#8b5cf6' },
  { k: 'X', 이름: '경비', 색: '#ef4444' },
  { k: 'O', 이름: '기타', 색: '#64748b' },
]
export const 구분이름 = Object.fromEntries(구분.map((x) => [x.k, x.이름]))
export const 기성 = 'G'
export const 단위들 = ['일', '시간', '회', '대', '월']
export const 자재단위 = ['㎥', 'ton', 'kg', '개', '장', 'm', '㎡', '본', '포', '식', 'L', '롤', '매']

const 쉼표 = new Intl.NumberFormat('ko-KR')
export const 원 = (n) => 쉼표.format(Math.round(n || 0))
/** 큰 돈은 «억·만» 으로 — 1,234,500,000 → 12억 3,450만 */
export function 억만(n) {
  const v = Math.round(Math.abs(n || 0))
  const s = n < 0 ? '−' : ''
  const 억 = Math.floor(v / 1e8), 만 = Math.round((v % 1e8) / 1e4)
  if (억 && 만) return `${s}${쉼표.format(억)}억 ${쉼표.format(만)}만`
  if (억) return `${s}${쉼표.format(억)}억`
  if (만) return `${s}${쉼표.format(만)}만`
  return `${s}${쉼표.format(v)}`
}
export const 퍼센트 = (x) => (Number.isFinite(x) ? (Math.round(x * 1000) / 10).toFixed(1) + '%' : '—')
export const 공수글 = (g) => (g === 1 ? '1' : String(Math.round(g * 100) / 100))

/* 현장 코드 — 헷갈리는 글자(0·O·1·I) 없이 9자리. 32^9 ≈ 35조 가지라 짐작으로 못 찾습니다. */
const 글자들 = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export function 코드만들기() {
  const a = new Uint8Array(9)
  crypto.getRandomValues(a)
  return [...a].map((v) => 글자들[v % 32]).join('')
}
export const 코드보기 = (c) => (c ? c.slice(0, 3) + '-' + c.slice(3, 6) + '-' + c.slice(6) : '')
export const 코드정리 = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/O/g, '0').slice(0, 9)
export async function 비번해시(code, pw) {
  const buf = new TextEncoder().encode(`kcm-cost:${code}:${pw}`)
  const d = await crypto.subtle.digest('SHA-256', buf)
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

const 두자 = (n) => String(n).padStart(2, '0')
export const 날글 = (d) => `${d.getFullYear()}-${두자(d.getMonth() + 1)}-${두자(d.getDate())}`
export const 오늘 = () => 날글(new Date())
const 날 = (s) => (s ? new Date(s + 'T00:00:00') : null)
export const 날더하기 = (s, n) => { const d = 날(s); d.setDate(d.getDate() + n); return 날글(d) }
export const 달날수 = (ym) => new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)), 0).getDate()
export const 요일 = (s) => '일월화수목금토'[날(s).getDay()]
export const 달더하기 = (ym, n) => { const d = new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)) - 1 + n, 1); return `${d.getFullYear()}-${두자(d.getMonth() + 1)}` }

/** 출역 → 날마다 노무비·인원 */
export function 출역풀기(att) {
  const 날들 = new Map()          // 'YYYY-MM-DD' → {금액, 인원, 공수}
  let 합 = 0, 공수합 = 0
  for (const [ym, byP] of Object.entries(att || {})) {
    for (const a of Object.values(byP || {})) {
      const w = Number(a && a.w) || 0
      for (const [dd, g] of Object.entries((a && a.d) || {})) {
        const gg = Number(g) || 0
        if (!(gg > 0)) continue
        const d = `${ym}-${dd}`
        const amt = Math.round(gg * w)
        const x = 날들.get(d) || { 금액: 0, 인원: 0, 공수: 0 }
        x.금액 += amt; x.인원 += 1; x.공수 += gg
        날들.set(d, x)
        합 += amt; 공수합 += gg
      }
    }
  }
  return { 날들, 합, 공수합 }
}

/**
 * 한눈에 볼 숫자들
 * @param site {total, budget?, start?, end?}
 * @param rows [{d, k, amt}]  (k 'G' = 기성)
 * @param att  출역 {ym:{사람:{w,d}}}
 */
export function 요약(site, rows, 기준 = 오늘(), att = null) {
  let 누적 = 0, 이번달 = 0, 오늘치 = 0, 누적기성 = 0, 기성일 = '', 기성건 = 0
  const ym = 기준.slice(0, 7)
  const 구분합 = Object.fromEntries(구분.map((x) => [x.k, 0]))
  const 월 = new Map()
  const 달 = (m) => {
    let x = 월.get(m)
    if (!x) { x = { ym: m, 합: 0, 기성: 0, ...Object.fromEntries(구분.map((c) => [c.k, 0])) }; 월.set(m, x) }
    return x
  }
  const 투입 = []                                   // [날짜, 금액] — 기성일까지 투입 셈에
  for (const r of rows) {
    const a = Number(r.amt) || 0
    const m = (r.d || '').slice(0, 7) || '날짜 없음'
    if (r.k === 기성) { 누적기성 += a; 기성건++; if ((r.d || '') > 기성일) 기성일 = r.d; 달(m).기성 += a; continue }
    누적 += a
    구분합[r.k] = (구분합[r.k] || 0) + a
    if (r.d && r.d.slice(0, 7) === ym) 이번달 += a
    if (r.d === 기준) 오늘치 += a
    const x = 달(m); x[r.k] = (x[r.k] || 0) + a; x.합 += a
    투입.push([r.d || '', a])
  }
  const A = 출역풀기(att)
  for (const [d, x] of A.날들) {
    누적 += x.금액
    구분합.L += x.금액
    if (d.slice(0, 7) === ym) 이번달 += x.금액
    if (d === 기준) 오늘치 += x.금액
    const mm = 달(d.slice(0, 7)); mm.L += x.금액; mm.합 += x.금액
    투입.push([d, x.금액])
  }
  const total = Number(site.total) || 0, budget = Number(site.budget) || 0
  const 월별 = [...월.values()].sort((a, b) => (a.ym < b.ym ? -1 : 1))
  let run = 0, runG = 0
  for (const m of 월별) {
    run += m.합; runG += m.기성
    m.누적 = run; m.률 = total > 0 ? run / total : NaN
    m.누적기성 = runG; m.공정률 = total > 0 ? runG / total : NaN
  }
  let 경과율 = NaN, 남은날 = null
  const s = 날(site.start), e = 날(site.end), t = 날(기준)
  if (s && e && e > s) {
    경과율 = Math.min(1, Math.max(0, (t - s) / (e - s)))
    남은날 = Math.round((e - t) / 86400000)
  }
  const 기성까지투입 = 기성일 ? 투입.reduce((acc, [d, a]) => acc + (d && d <= 기성일 ? a : 0), 0) : 0
  const 오늘출역 = A.날들.get(기준)
  return {
    누적, 이번달, 오늘치, 구분합, 월별,
    투입률: total > 0 ? 누적 / total : NaN,
    실행률: budget > 0 ? 누적 / budget : NaN,
    남은: total - 누적,
    실행남은: budget > 0 ? budget - 누적 : null,
    경과율, 남은날,
    건수: rows.length,
    누적기성, 기성일, 기성건,
    공정률: total > 0 && 기성건 ? 누적기성 / total : NaN,
    기성까지투입,
    원가율: 누적기성 > 0 ? 기성까지투입 / 누적기성 : NaN,            // 기성 1원 벌 때 쓴 돈
    목표원가율: budget > 0 && total > 0 ? budget / total : NaN,       // 실행예산 ÷ 도급액
    출역노무: A.합, 연인원: A.공수합,
    오늘인원: 오늘출역 ? 오늘출역.인원 : 0, 오늘공수: 오늘출역 ? 오늘출역.공수 : 0,
  }
}

/* ── 달마다 청구내역서 ───────────────────────── */

/** 노무비 — 그 달 사람별 공수(1~말일)·보수·공제 */
export function 노무달(ym, att, people) {
  const byP = (att && att[ym]) || {}
  const 날수 = 달날수(ym)
  const 줄 = []
  for (const [pid, a] of Object.entries(byP)) {
    if (!a) continue
    const p = (people && people[pid]) || { n: '(명부에서 지운 사람)', j: '' }
    const w = Number(a.w) || 0
    const 공수 = Array(날수).fill(0)
    for (const [dd, g] of Object.entries(a.d || {})) {
      const i = Number(dd) - 1
      if (i >= 0 && i < 날수) 공수[i] = Number(g) || 0
    }
    const 날돈 = 공수.filter((g) => g > 0).map((g) => Math.round(g * w))
    if (!날돈.length) continue
    const 자동 = 공제셈(ym, 날돈, p.nx || '', { ap: a.ap, ex: a.ex })
    const 최종 = 공제합치기(자동, a.o)
    줄.push({ pid, p, w, 공수, 공수합: 공수.reduce((s, g) => s + g, 0), 일수: 자동.일수, 보수: 자동.보수, 자동, 최종, 고침: a.o || {}, 비고: a.m || '',
      대상: 자동.대상, ap: a.ap || '', ex: a.ex || '' })
  }
  줄.sort((x, y) => (x.p.j || '').localeCompare(y.p.j || '', 'ko') || (x.p.n || '').localeCompare(y.p.n || '', 'ko'))
  const 합계 = { 인원: 줄.length, 공수: 0, 일수: 0, 보수: 0, 합: 0, 차인: 0, ...Object.fromEntries(공제칸.map((c) => [c.k, 0])),
    대상수: { P: 0, H: 0, E: 0 } }
  const 날합 = Array(날수).fill(0)
  for (const r of 줄) {
    합계.공수 += r.공수합; 합계.일수 += r.일수; 합계.보수 += r.보수; 합계.합 += r.최종.합; 합계.차인 += r.최종.차인
    for (const c of 공제칸) 합계[c.k] += r.최종[c.k]
    for (const c of ['P', 'H', 'E']) if (r.대상[c].대상) 합계.대상수[c]++
    r.공수.forEach((g, i) => { if (g > 0) 날합[i] += 1 })
  }
  const R0 = 줄.length ? 줄[0].자동 : 공제셈(ym, [])
  return { ym, 날수, 줄, 합계, 날합, 요율해: R0.요율해, 요율없음: R0.요율없음, 잠정: R0.잠정 || [] }
}

/** 장비 — 그 달 장비(또는 업체)별 사용 내역 */
export function 장비달(ym, rows, equip) {
  const 묶음 = new Map()
  for (const r of rows) {
    if (r.k !== 'E' || !(r.d || '').startsWith(ym)) continue
    const e = r.eq && equip ? equip[r.eq] : null
    const key = r.eq ? 'e:' + r.eq : 't:' + (r.t || '(내용 없음)')
    let g = 묶음.get(key)
    if (!g) {
      g = { key, id: r.eq || '', 장비: e ? e.n : (r.eq ? '(명부에서 지운 장비)' : (r.t || '장비')), 규격: e ? e.s || '' : '', 업체: e ? e.v || '' : '',
        단위: (e && e.un) || r.un || '', 단가: e ? Number(e.u) || 0 : 0, 줄: [], 수량: 0, 금액: 0, 명부: !!e }
      묶음.set(key, g)
    }
    g.줄.push(r)
    g.수량 += Number(r.q) || 0
    g.금액 += Number(r.amt) || 0
  }
  const 목록 = [...묶음.values()].sort((a, b) => (a.업체 || '~').localeCompare(b.업체 || '~', 'ko') || a.장비.localeCompare(b.장비, 'ko'))
  for (const g of 목록) g.줄.sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : (a.at || 0) - (b.at || 0)))
  return { ym, 목록, 합계: 목록.reduce((s, g) => s + g.금액, 0) }
}

/** 자재 — 그 달 업체별 반입 내역 */
export function 자재달(ym, rows, vendors) {
  const 묶음 = new Map()
  for (const r of rows) {
    if (r.k !== 'M' || !(r.d || '').startsWith(ym)) continue
    const v = r.vd && vendors ? vendors[r.vd] : null
    const key = r.vd || '-'
    let g = 묶음.get(key)
    if (!g) {
      g = { key, id: r.vd || '', 업체: v ? v.n : (r.vd ? '(명부에서 지운 업체)' : '업체 안 정함'), 줄: [], 금액: 0, 명부: !!v }
      묶음.set(key, g)
    }
    g.줄.push(r)
    g.금액 += Number(r.amt) || 0
  }
  const 목록 = [...묶음.values()].sort((a, b) => (a.id ? 0 : 1) - (b.id ? 0 : 1) || a.업체.localeCompare(b.업체, 'ko'))
  for (const g of 목록) g.줄.sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : (a.at || 0) - (b.at || 0)))
  return { ym, 목록, 합계: 목록.reduce((s, g) => s + g.금액, 0) }
}

/* ── 엑셀 ─────────────────────────────────────── 
 * ⚠️ 2026-09-26 부터 화면에서 부르지 않습니다 — 소장님: 「프로그램으로 해서 만든 거는 엑셀로 볼 수 있게 하지만, 다운 받을 수 없게 …
 *    프린트만 가능하게 … 수정이나 입력은 건설맵에서 하게」. 다시 켤 일이 생길 때를 위해 셈은 남겨 둡니다(묶음에는 안 들어감). */
const 돈 = (v) => ({ v: Math.round(v || 0), st: ST.INT })
const 률 = (v) => (Number.isFinite(v) ? { v: Math.round(v * 10000) / 10000, st: ST.PCT } : '')
const 계좌글 = (x) => (x ? [x.b, x.a, x.h ? `(${x.h})` : ''].filter(Boolean).join(' ') : '')

/** 현장 전체 한 벌 — 요약 · 월별 · 투입 내역 · 기성 · 출역 노무(달·사람별) */
export function 엑셀(site, rows, 코드, att, people) {
  const S = 요약(site, rows, 오늘(), att)
  const 투입줄 = rows.filter((r) => r.k !== 기성)
  const 기성줄 = rows.filter((r) => r.k === 기성).sort((a, b) => (a.d < b.d ? -1 : 1))
  const 정렬 = [...투입줄].sort((a, b) => (a.d === b.d ? (a.at || 0) - (b.at || 0) : a.d < b.d ? -1 : 1))
  const 요약줄 = [
    ['현장명', site.name],
    ['현장 코드', 코드보기(코드 || '')],
    ['공사기간', `${site.start || ''} ~ ${site.end || ''}`],
    ['총공사금액', 돈(site.total)],
    ['실행예산', site.budget ? 돈(site.budget) : ''],
    ['누적 기성', 돈(S.누적기성)],
    ['공정률(기성 ÷ 총공사금액)', 률(S.공정률)],
    ['공기 경과율(계획)', 률(S.경과율)],
    ['누적 투입비', 돈(S.누적)],
    ['투입률(총공사금액 대비)', 률(S.투입률)],
    ['실행예산 대비', 률(S.실행률)],
    ['남은 금액(총공사금액 − 누적 투입비)', 돈(S.남은)],
    ['기성 대비 투입비(마지막 기성일까지)', 률(S.원가율)],
    ...구분.map((c) => [c.이름 + ' 합계', 돈(S.구분합[c.k])]),
    ['출역 연인원(공수 합)', { v: Math.round(S.연인원 * 100) / 100, st: ST.DEC2 }],
    ['뽑은 날', 오늘()],
    ['만든 곳', 'K-건설맵 현장 투입비 (k-conmap.com/tools/tuipbi)'],
    ['알림', '건설맵에서 만든 사본입니다 — 숫자만 들어 있습니다. 최신 내용·고치기·다음 달 청구서는 k-conmap.com/tools/tuipbi 에서'],
  ]
  const 월줄 = S.월별.map((m) => [m.ym, ...구분.map((c) => 돈(m[c.k])), 돈(m.합), 돈(m.누적), 률(m.률), 돈(m.기성), 돈(m.누적기성), 률(m.공정률)])
  const 내역줄 = 정렬.map((r, i) => [i + 1, r.d, 구분이름[r.k] || r.k, r.t || '', r.sp || '',
    r.q != null ? { v: r.q, st: ST.DEC2 } : '', r.un || '', r.u != null ? 돈(r.u) : '', 돈(r.amt), r.by || ''])
  const 기성엑셀 = []
  let run = 0
  기성줄.forEach((r, i) => { run += Number(r.amt) || 0; 기성엑셀.push([i + 1, r.d, r.t || '', 돈(r.amt), 돈(run), 률(site.total > 0 ? run / site.total : NaN)]) })
  const 출역줄 = []
  for (const ym of Object.keys(att || {}).sort()) {
    const N = 노무달(ym, att, people)
    for (const r of N.줄) 출역줄.push([ym, r.p.n, r.p.j || '', 돈(r.w), { v: r.공수합, st: ST.DEC2 }, r.일수, 돈(r.보수)])
  }
  const sheets = [
    { name: '요약', head: ['항목', '값'], rows: 요약줄, widths: [34, 36], freeze: false },
    { name: '월별 집계', head: ['월', ...구분.map((c) => c.이름), '월 합계', '누적', '투입률', '월 기성', '누적 기성', '공정률'], rows: 월줄,
      widths: [10, 14, 14, 14, 14, 14, 14, 15, 16, 10, 14, 16, 10] },
    { name: '투입 내역', head: ['번호', '날짜', '구분', '내용', '규격', '수량', '단위', '단가', '금액', '적은 사람'], rows: 내역줄,
      widths: [6, 11, 8, 36, 14, 9, 6, 12, 14, 10] },
  ]
  if (출역줄.length) sheets.push({ name: '출역 노무', head: ['월', '성명', '직종', '일급', '공수', '일수', '노무비'], rows: 출역줄, widths: [9, 12, 12, 12, 8, 7, 14] })
  if (기성엑셀.length) sheets.push({ name: '기성', head: ['회차', '날짜', '내용', '기성금액', '누적 기성', '공정률'], rows: 기성엑셀, widths: [6, 11, 30, 16, 16, 10] })
  return writeWorkbook(sheets)
}

/** 장비 줄의 메모 — 장비 이름·규격만 적힌 것이면 비움 */
export const 장비메모 = (r, g) => { const t = (r.t || '').trim(); return !t || t === g.장비 || t === [g.장비, g.규격].filter(Boolean).join(' ') ? '' : t }

/** 4대보험 대상 한 줄 글 — «연금·건강·고용» / «고용만» (손으로 바꾼 것은 ✎) */
export function 대상글(r) {
  const 이름 = { P: '연금', H: '건강', E: '고용' }
  const 된 = ['P', 'H', 'E'].filter((c) => r.대상[c].대상).map((c) => 이름[c] + (r.대상[c].손 ? '✎' : ''))
  const 안된손 = ['P', 'H', 'E'].filter((c) => !r.대상[c].대상 && r.대상[c].손).map((c) => 이름[c] + ' 뺌✎')
  const 글 = 된.length === 3 ? 된.join('·') : 된.length ? 된.join('·') + '만' : '없음'
  return [글, ...안된손].join(' ')
}
const 공제머리 = 공제칸.map((c) => c.이름)
const 요율글 = (N) => {
  const R = N.요율해 || ''
  const 연 = R >= 2027 ? '5%' : R === 2025 ? '4.5%' : '4.75%'
  const 건 = R === 2025 ? '3.545%' : '3.595%'
  return `${R}년 요율 — 소득세 (일급−15만원)×2.7%(한 달 합 1천원 미만 안 뗌) · 지방소득세 10% · 고용 0.9% · 국민연금 ${연}(8일↑ 또는 220만원↑) · 건강 ${건} · 장기요양 건강보험료×${R === 2025 ? '12.95' : '13.14'}%(8일↑) · 10원 미만 버림` +
    (N.잠정 && N.잠정.length ? ` · ⚠️ ${N.잠정.join('·')}는 아직 확정 전이라 2026년 요율` : '') + (N.요율없음 ? ' · ⚠️ 이 해 요율이 없어 가까운 해 요율' : '')
}

/**
 * 한 달 청구내역서 한 벌 — 요약 · 노무비 대장 · 노무비 청구내역서 · 장비 · 자재
 * 풀린: {id: 풀린 잠금 물건} (없으면 주민번호·계좌 칸이 빕니다) · 뒷자리: 주민번호 뒷자리를 보일지
 */
export function 월엑셀(site, ym, N, E, M, people, equip, vendors, 풀린, 뒷자리) {
  const P = 풀린 || {}
  const 요약줄 = [
    ['현장명', site.name],
    ['회사명', site.co || ''],
    ['청구 기간', `${ym}-01 ~ ${ym}-${두자(N.날수)}`],
    ['노무비 청구금액 (보수총액)', 돈(N.합계.보수)],
    ...공제칸.map((c) => [`  공제 — ${c.이름}`, 돈(N.합계[c.k])]),
    ['노무비 공제 합계', 돈(N.합계.합)],
    ['노무비 실지급액 (차인지급액 = 보수총액 − 공제)', 돈(N.합계.차인)],
    ['4대보험 대상 인원', `국민연금 ${N.합계.대상수.P}명 · 건강·요양 ${N.합계.대상수.H}명 · 고용 ${N.합계.대상수.E}명 / 전체 ${N.합계.인원}명`],
    ['장비비', 돈(E.합계)],
    ['자재비', 돈(M.합계)],
    ['이 달 합계 (노무 보수총액 + 장비 + 자재)', 돈(N.합계.보수 + E.합계 + M.합계)],
    ['공제 요율', 요율글(N)],
    ['뽑은 날', 오늘()],
    ['만든 곳', 'K-건설맵 현장 투입비 (k-conmap.com/tools/tuipbi)'],
    ['알림', '건설맵에서 만든 사본입니다 — 숫자만 들어 있습니다. 최신 내용·고치기·다음 달 청구서는 k-conmap.com/tools/tuipbi 에서'],
  ]
  const 날칸 = Array.from({ length: N.날수 }, (_, i) => String(i + 1))
  const 대장 = N.줄.map((r, i) => [i + 1, r.p.n, r.p.j || '', 돈(r.w), ...r.공수.map((g) => (g > 0 ? { v: g, st: ST.DEC2 } : '')),
    { v: r.공수합, st: ST.DEC2 }, r.일수, 돈(r.보수), 대상글(r), ...공제칸.map((c) => 돈(r.최종[c.k])), 돈(r.최종.합), 돈(r.최종.차인)])
  대장.push(['', '합계', `${N.합계.인원}명`, '', ...N.날합.map((n) => (n ? n : '')), { v: N.합계.공수, st: ST.DEC2 }, N.합계.일수, 돈(N.합계.보수), '',
    ...공제칸.map((c) => 돈(N.합계[c.k])), 돈(N.합계.합), 돈(N.합계.차인)])
  const 청구 = N.줄.map((r, i) => {
    const x = P[r.pid] || {}
    return [i + 1, r.p.n, x.r ? 주민가림(x.r, 뒷자리) : '', r.p.tel || '', r.p.j || '', r.일수, 돈(r.보수), 대상글(r),
      ...공제칸.map((c) => 돈(r.최종[c.k])), 돈(r.최종.합), 돈(r.최종.차인), x.b || '', x.a || '', x.h || '', r.비고]
  })
  청구.push(['', '합계', '', '', `${N.합계.인원}명`, N.합계.일수, 돈(N.합계.보수), `연금 ${N.합계.대상수.P} · 건강 ${N.합계.대상수.H} · 고용 ${N.합계.대상수.E}`,
    ...공제칸.map((c) => 돈(N.합계[c.k])), 돈(N.합계.합), 돈(N.합계.차인), '', '', '', ''])
  const 장비 = []
  let n = 0
  for (const g of E.목록) {
    for (const r of g.줄) 장비.push([++n, g.장비, g.규격, g.업체, r.d, { v: Number(r.q) || 0, st: ST.DEC2 }, r.un || g.단위, 돈(r.u), 돈(r.amt), 장비메모(r, g)])
    장비.push(['', `${g.장비} 소계`, '', g.업체, '', { v: g.수량, st: ST.DEC2 }, g.단위, '', 돈(g.금액), 계좌글(P[g.id])])
  }
  장비.push(['', '합계', '', '', '', '', '', '', 돈(E.합계), ''])
  const 자재 = []
  n = 0
  for (const g of M.목록) {
    for (const r of g.줄) 자재.push([++n, g.업체, r.d, r.t || '', r.sp || '', { v: Number(r.q) || 0, st: ST.DEC2 }, r.un || '', 돈(r.u), 돈(r.amt), ''])
    const x = P[g.id] || {}
    자재.push(['', `${g.업체} 소계`, '', '', '', '', '', '', 돈(g.금액), [x.biz ? '사업자 ' + x.biz : '', 계좌글(x)].filter(Boolean).join(' · ')])
  }
  자재.push(['', '합계', '', '', '', '', '', '', 돈(M.합계), ''])
  return writeWorkbook([
    { name: '요약', head: ['항목', '값'], rows: 요약줄, widths: [44, 80], freeze: false },
    { name: '노무비 대장', head: ['번호', '성명', '직종', '일급', ...날칸, '공수', '일수', '보수총액', '4대보험 대상', ...공제머리, '공제계', '차인지급액'],
      rows: 대장, widths: [5, 9, 9, 10, ...날칸.map(() => 4), 6, 5, 12, 16, 9, 9, 9, 9, 9, 9, 10, 12] },
    { name: '노무비 청구내역서', head: ['번호', '성명', '주민등록번호', '연락처', '직종', '일수', '청구금액(보수총액)', '4대보험 대상', ...공제머리, '공제 합계', '실지급액(차인지급액)', '은행', '계좌번호', '예금주', '비고'],
      rows: 청구, widths: [5, 9, 16, 14, 10, 5, 14, 16, 9, 9, 9, 9, 9, 9, 11, 14, 9, 18, 9, 16] },
    { name: '장비 청구내역서', head: ['번호', '장비명', '규격', '업체', '날짜', '수량', '단위', '단가', '금액', '비고'], rows: 장비, widths: [5, 16, 12, 14, 11, 7, 5, 11, 13, 30] },
    { name: '자재 청구내역서', head: ['번호', '업체', '날짜', '품명', '규격', '수량', '단위', '단가', '금액', '비고'], rows: 자재, widths: [5, 14, 11, 22, 14, 8, 5, 11, 13, 34] },
  ])
}

/* ── 달별 누계 — 소장님: 「달 별로 엑셀로 다운 받을 수 있게 해주고, 달별로 누적해서도 되게 해줘」 · 「공제금은 얼마인지도..」
 *    · 「공제금 제외 후 지급해야 할 금액은 얼마인지도 나와야 해」 ─────────────── */

/** 처음 달 ~ 끝 달, 달마다 노무(보수·공제·실지급)·장비·자재와 누계 · 사람별 · 업체별 */
export function 누계(끝ym, att, people, rows, equip, vendors) {
  const 달들 = new Set(Object.keys(att || {}))
  for (const r of rows) if (r.d && (r.k === 'E' || r.k === 'M')) 달들.add(r.d.slice(0, 7))
  const 목록 = [...달들].filter((m) => m <= 끝ym).sort()
  const 처음 = 목록[0] || 끝ym
  const 모든달 = []
  for (let m = 처음; m <= 끝ym; m = 달더하기(m, 1)) 모든달.push(m)
  const 달 = []
  const 사람 = new Map()          // pid → {p, 달:{ym:{보수,합,차인,일수,공수, 공제...}}, 합계}
  const 장비묶음 = new Map()      // key → {이름, 업체, 달:{ym:금액}, 합}
  const 자재묶음 = new Map()
  const 빈 = () => ({ 보수: 0, 합: 0, 차인: 0, 일수: 0, 공수: 0, ...Object.fromEntries(공제칸.map((c) => [c.k, 0])) })
  let 누 = 0, 누노 = 0, 누공 = 0, 누차 = 0
  for (const ym of 모든달) {
    const N = 노무달(ym, att, people)
    const E = 장비달(ym, rows, equip)
    const M = 자재달(ym, rows, vendors)
    const 합 = N.합계.보수 + E.합계 + M.합계
    누 += 합; 누노 += N.합계.보수; 누공 += N.합계.합; 누차 += N.합계.차인
    달.push({ ym, 인원: N.합계.인원, 공수: N.합계.공수, 일수: N.합계.일수, 보수: N.합계.보수, 공제: Object.fromEntries(공제칸.map((c) => [c.k, N.합계[c.k]])),
      공제합: N.합계.합, 차인: N.합계.차인, 대상수: N.합계.대상수, 장비: E.합계, 자재: M.합계, 합, 누계: 누, 노무누계: 누노, 공제누계: 누공, 차인누계: 누차 })
    for (const r of N.줄) {
      let x = 사람.get(r.pid)
      if (!x) { x = { pid: r.pid, p: r.p, 달: {}, 합계: 빈() }; 사람.set(r.pid, x) }
      const 칸 = { 보수: r.보수, 합: r.최종.합, 차인: r.최종.차인, 일수: r.일수, 공수: r.공수합, 대상: 대상글(r), ...Object.fromEntries(공제칸.map((c) => [c.k, r.최종[c.k]])) }
      x.달[ym] = 칸
      for (const k of Object.keys(x.합계)) x.합계[k] += 칸[k] || 0
    }
    for (const g of E.목록) {
      const key = g.key
      let x = 장비묶음.get(key)
      if (!x) { x = { 이름: [g.장비, g.규격].filter(Boolean).join(' '), 업체: g.업체, 달: {}, 합: 0 }; 장비묶음.set(key, x) }
      x.달[ym] = (x.달[ym] || 0) + g.금액; x.합 += g.금액
    }
    for (const g of M.목록) {
      let x = 자재묶음.get(g.key)
      if (!x) { x = { 업체: g.업체, 달: {}, 합: 0 }; 자재묶음.set(g.key, x) }
      x.달[ym] = (x.달[ym] || 0) + g.금액; x.합 += g.금액
    }
  }
  const 합계 = { 보수: 누노, 공제합: 누공, 차인: 누차, 장비: 0, 자재: 0, 합: 누, 공제: Object.fromEntries(공제칸.map((c) => [c.k, 0])), 공수: 0, 일수: 0 }
  for (const d of 달) { 합계.장비 += d.장비; 합계.자재 += d.자재; 합계.공수 += d.공수; 합계.일수 += d.일수; for (const c of 공제칸) 합계.공제[c.k] += d.공제[c.k] }
  const 사람들 = [...사람.values()].sort((a, b) => (a.p.j || '').localeCompare(b.p.j || '', 'ko') || (a.p.n || '').localeCompare(b.p.n || '', 'ko'))
  return { 처음, 끝: 끝ym, 달, 합계, 사람들, 장비: [...장비묶음.values()], 자재: [...자재묶음.values()] }
}

/** 누계 엑셀 — 달별 누계 · 노무비 집계표(분기) · 개인별 노무비 · 장비·자재 업체별 달별 */
export function 누계엑셀(site, C) {
  const 요약줄 = [
    ['현장명', site.name], ['회사명', site.co || ''], ['기간', `${C.처음} ~ ${C.끝} (${C.달.length}개월)`],
    ['노무비 보수총액 누계', 돈(C.합계.보수)],
    ...공제칸.map((c) => [`  공제 누계 — ${c.이름}`, 돈(C.합계.공제[c.k])]),
    ['공제 합계 누계', 돈(C.합계.공제합)],
    ['실지급액(차인지급액) 누계', 돈(C.합계.차인)],
    ['장비비 누계', 돈(C.합계.장비)], ['자재비 누계', 돈(C.합계.자재)],
    ['합계 누계 (노무 보수총액 + 장비 + 자재)', 돈(C.합계.합)],
    ['출역 연인원(공수 합)', { v: Math.round(C.합계.공수 * 100) / 100, st: ST.DEC2 }],
    ['※ 외주·경비·기타·기성은 «엑셀(현장 전체)» 에 있습니다', ''],
    ['뽑은 날', 오늘()], ['만든 곳', 'K-건설맵 현장 투입비 (k-conmap.com/tools/tuipbi)'],
    ['알림', '건설맵에서 만든 사본입니다 — 숫자만 들어 있습니다. 최신 내용·고치기·다음 달 청구서는 k-conmap.com/tools/tuipbi 에서'],
  ]
  const 월줄 = C.달.map((d) => [d.ym, d.인원, { v: d.공수, st: ST.DEC2 }, 돈(d.보수), ...공제칸.map((c) => 돈(d.공제[c.k])), 돈(d.공제합), 돈(d.차인),
    `연금 ${d.대상수.P} · 건강 ${d.대상수.H} · 고용 ${d.대상수.E}`, 돈(d.장비), 돈(d.자재), 돈(d.합), 돈(d.노무누계), 돈(d.차인누계), 돈(d.누계)])
  월줄.push(['합계', '', { v: C.합계.공수, st: ST.DEC2 }, 돈(C.합계.보수), ...공제칸.map((c) => 돈(C.합계.공제[c.k])), 돈(C.합계.공제합), 돈(C.합계.차인), '',
    돈(C.합계.장비), 돈(C.합계.자재), 돈(C.합계.합), '', '', ''])
  /* 노무비 집계표 — 참고로 주신 공사일보 서비스의 «일용직 노무비 지급 명세서 집계표» 처럼 달 줄 + 분기 줄 */
  const 집계 = []
  const 분기 = new Map()
  for (const d of C.달) {
    집계.push([d.ym, d.인원, 돈(d.보수), ...공제칸.map((c) => 돈(d.공제[c.k])), 돈(d.공제합), 돈(d.차인)])
    const q = `${d.ym.slice(0, 4)}년 ${Math.floor((Number(d.ym.slice(5, 7)) - 1) / 3) + 1}분기`
    const x = 분기.get(q) || { 보수: 0, 합: 0, 차인: 0, ...Object.fromEntries(공제칸.map((c) => [c.k, 0])) }
    x.보수 += d.보수; x.합 += d.공제합; x.차인 += d.차인; for (const c of 공제칸) x[c.k] += d.공제[c.k]
    분기.set(q, x)
  }
  집계.push(['합계', '', 돈(C.합계.보수), ...공제칸.map((c) => 돈(C.합계.공제[c.k])), 돈(C.합계.공제합), 돈(C.합계.차인)])
  for (const [q, x] of 분기) 집계.push([q, '', 돈(x.보수), ...공제칸.map((c) => 돈(x[c.k])), 돈(x.합), 돈(x.차인)])
  const 개인 = []
  for (const s of C.사람들) {
    for (const ym of Object.keys(s.달).sort()) {
      const x = s.달[ym]
      개인.push([s.p.n, s.p.j || '', ym, { v: x.공수, st: ST.DEC2 }, x.일수, 돈(x.보수), x.대상, ...공제칸.map((c) => 돈(x[c.k])), 돈(x.합), 돈(x.차인)])
    }
    개인.push([`${s.p.n} 합계`, '', '', { v: s.합계.공수, st: ST.DEC2 }, s.합계.일수, 돈(s.합계.보수), '', ...공제칸.map((c) => 돈(s.합계[c.k])), 돈(s.합계.합), 돈(s.합계.차인)])
  }
  const 달머리 = C.달.map((d) => d.ym)
  const 장비줄 = C.장비.map((x) => [x.이름, x.업체, ...달머리.map((m) => (x.달[m] ? 돈(x.달[m]) : '')), 돈(x.합)])
  장비줄.push(['합계', '', ...C.달.map((d) => 돈(d.장비)), 돈(C.합계.장비)])
  const 자재줄 = C.자재.map((x) => [x.업체, ...달머리.map((m) => (x.달[m] ? 돈(x.달[m]) : '')), 돈(x.합)])
  자재줄.push(['합계', ...C.달.map((d) => 돈(d.자재)), 돈(C.합계.자재)])
  return writeWorkbook([
    { name: '요약', head: ['항목', '값'], rows: 요약줄, widths: [44, 50], freeze: false },
    { name: '달별 누계', head: ['월', '인원', '공수', '노무 보수총액', ...공제머리, '공제 합계', '실지급액', '4대보험 대상', '장비비', '자재비', '달 합계', '노무 보수 누계', '실지급 누계', '합계 누계'],
      rows: 월줄, widths: [9, 6, 7, 14, 9, 9, 9, 9, 9, 9, 11, 13, 20, 12, 12, 14, 15, 15, 15] },
    { name: '노무비 집계표', head: ['월', '인원', '보수총액', ...공제머리, '공제 합계', '차인지급액'], rows: 집계, widths: [14, 6, 14, 10, 10, 10, 10, 10, 10, 12, 14] },
    { name: '개인별 노무비', head: ['성명', '직종', '월', '공수', '일수', '보수총액', '4대보험 대상', ...공제머리, '공제 합계', '차인지급액'], rows: 개인,
      widths: [14, 10, 9, 6, 5, 13, 16, 9, 9, 9, 9, 9, 9, 11, 13] },
    { name: '장비 업체별 달별', head: ['장비', '업체', ...달머리, '누계'], rows: 장비줄, widths: [18, 14, ...달머리.map(() => 12), 14] },
    { name: '자재 업체별 달별', head: ['업체', ...달머리, '누계'], rows: 자재줄, widths: [18, ...달머리.map(() => 12), 14] },
  ])
}

/* ── 🧪 예시 — 지어낸 현장입니다(이름·금액·주민번호·계좌 모두 가상). 저장되지 않고 이 화면에서만 봅니다 ── */
export function 예시현장() {
  const site = { name: '가상 ○○동 근린생활시설 신축공사 (예시)', co: '가상건설(주)', total: 1_250_000_000, budget: 1_085_000_000,
    start: '2026-03-02', end: '2026-12-31', at: 0 }
  let seed = 7
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
  const 사람목록 = [
    ['홍길동', '형틀목공', 283000], ['김철수', '형틀목공', 283000], ['이영수', '철근공', 276000], ['박정호', '철근공', 276000],
    ['최민석', '콘크리트공', 262000], ['정우진', '보통인부', 187000], ['한기수', '보통인부', 187000], ['서동규', '신호수', 180000],
    ['문성호', '보통인부', 187000],                        // 예: 한 달에 며칠만 오는 사람 — 연금·건강 대상 아님
  ]
  const people = {}, 풀린 = {}
  사람목록.forEach(([n, j, w], i) => {
    const id = 'p' + i
    people[id] = { n, j, w, tel: `010-0000-00${두자(i + 10)}`, x: 'ex', at: i }
    풀린[id] = { r: `7${i}0101-1000000`, b: '○○은행', a: `000-0000-00${두자(i)}`, h: n }
  })
  people.p7.nx = 'P'                                      // 예: 60세 넘어 연금 뺌
  const equip = {
    e0: { n: '굴착기', s: '0.7㎥', v: '가상중기', u: 950000, un: '일', x: 'ex', at: 0 },
    e1: { n: '펌프카', s: '42m', v: '가상펌프', u: 1150000, un: '회', x: 'ex', at: 1 },
    e2: { n: '크레인', s: '25t', v: '가상크레인', u: 1250000, un: '일', x: 'ex', at: 2 },
    e3: { n: '덤프트럭', s: '15t', v: '가상중기', u: 620000, un: '일', x: 'ex', at: 3 },
  }
  const vendors = {
    v0: { n: '가상레미콘(주)', g: '레미콘', x: 'ex', at: 0 },
    v1: { n: '가상철강', g: '철근', x: 'ex', at: 1 },
    v2: { n: '가상건재', g: '합판·벽돌·단열재', x: 'ex', at: 2 },
  }
  for (const id of Object.keys(equip)) 풀린[id] = { biz: '000-00-00000', b: '○○은행', a: '000-000-000000', h: equip[id].v }
  for (const id of Object.keys(vendors)) 풀린[id] = { biz: '000-00-00000', b: '○○은행', a: '000-000-000000', h: vendors[id].n }
  const 자재 = [
    ['v0', '레미콘', '25-24-150', '㎥', 98000, () => 30 + Math.floor(rnd() * 90)],
    ['v1', '철근', 'SD400 D13', 'ton', 1020000, () => Math.round((1 + rnd() * 8) * 10) / 10],
    ['v2', '합판 거푸집', '12T', '장', 18500, () => 20 + Math.floor(rnd() * 80)],
    ['v2', '시멘트 벽돌', '190×90×57', '장', 110, () => 2000 + Math.floor(rnd() * 6000)],
    ['v2', '단열재 압출법', '100T', '장', 21000, () => 20 + Math.floor(rnd() * 60)],
  ]
  const 기타 = {
    S: ['방수공사 기성 (외주)', '전기공사 기성 (외주)', '설비공사 기성 (외주)'],
    X: ['현장사무실 전기·수도', '안전용품', '가설울타리 임대', '식대'],
  }
  const rows = [], att = {}
  const 달별비율 = { 3: 0.35, 4: 0.8, 5: 1.1, 6: 1.25, 7: 1.2, 8: 1.05, 9: 0.9 }
  const 기준 = 오늘()
  for (const [mm, w] of Object.entries(달별비율)) {
    const m = Number(mm)
    const ym = `2026-${두자(m)}`
    const 끝 = 달날수(ym)
    for (let day = 1; day <= 끝; day++) {
      const d = `${ym}-${두자(day)}`
      if (d > 기준 || d > '2026-09-25') break
      if (new Date(d + 'T00:00:00').getDay() === 0) continue
      사람목록.forEach(([, , 일급], i) => {
        const 올확률 = i === 8 ? 0.2 : Math.min(0.95, 0.3 + 0.5 * w) * (i >= 5 ? 1 : (m >= 4 ? 1 : 0.4))
        if (rnd() < 올확률) {
          const pid = 'p' + i
          att[ym] = att[ym] || {}
          att[ym][pid] = att[ym][pid] || { w: 일급, d: {} }
          att[ym][pid].d[두자(day)] = rnd() < 0.08 ? 0.5 : rnd() < 0.06 ? 1.5 : 1
        }
      })
      if (rnd() < 0.3 * w) {
        const [vd, t, sp, un, u, q] = 자재[Math.floor(rnd() * 자재.length)]
        const qq = q()
        rows.push({ d, k: 'M', vd, t, sp, un, q: qq, u, amt: Math.round(qq * u) })
      }
      if (rnd() < 0.16 * w) {
        const eq = 'e' + Math.floor(rnd() * 4)
        const e = equip[eq]
        rows.push({ d, k: 'E', eq, t: `${e.n} ${e.s}`, q: 1, un: e.un, u: e.u, amt: e.u })
      }
      if ((day === 10 || day === 25) && m >= 5) { const t = 기타.S[Math.floor(rnd() * 3)]; rows.push({ d, k: 'S', t, amt: Math.round((25 + rnd() * 45) * 1e6 / 1e4) * 1e4 }) }
      if (day === 28 || rnd() < 0.05) { const t = 기타.X[Math.floor(rnd() * 4)]; rows.push({ d, k: 'X', t, amt: Math.round((0.3 + rnd() * 2.5) * 1e6 / 1e3) * 1e3 }) }
    }
  }
  /* 기성 — 달마다 말일, 그달 투입비의 1.12배 안팎 (9월은 아직) */
  const S0 = 요약(site, rows, '2026-12-31', att)
  let 회 = 0
  for (const m of S0.월별) {
    if (m.ym >= '2026-09') continue
    회++
    rows.push({ d: `${m.ym}-${두자(달날수(m.ym))}`, k: 기성, t: `${회}회 기성`, amt: Math.round(m.합 * (1.08 + rnd() * 0.08) / 1e5) * 1e5 })
  }
  const 고친예 = att['2026-08'] && att['2026-08'].p3
  if (고친예) { 고친예.ex = 'P'; 고친예.m = '연금 다른 사업장에서 냄' }   // 예: 다른 사업장에서 연금을 내는 사람 — 이 달만 «빼기»
  rows.forEach((r, i) => { r.id = 'ex' + i; r.at = i })
  return { site, rows, people, equip, vendors, att, 풀린 }
}
