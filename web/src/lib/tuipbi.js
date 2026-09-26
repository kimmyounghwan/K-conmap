/**
 * 🏗 현장 투입비 — 셈·엑셀·예시 (2026-09-26)
 *
 * 소장님: 「공사일보를 시스템화 하는 거...이건 너무 확장판인듯 하고, 난 투입비만 나오면 돼.
 *          총공사금액 얼마. 현재 투입비 얼마...등...최대한 단순하면서 필요한 기능은 다 있는것...
 *          건설맵에서 등록해서 사용하게 하는 거지...」
 * → 참고로 보내 주신 «공사일보 서비스» 에서 투입비만 남겼습니다.
 *   근로자·주민번호·계좌·4대보험 공제·TBM 은 받지 않습니다(개인정보를 안 받으면 지킬 것도 없습니다).
 *
 * 저장 자리(파이어베이스, 규칙은 web/database.rules.json «현장 투입비»):
 *   cost_pins/{코드}          비밀번호 해시(아무도 못 읽음)
 *   cost_keys/{코드}/{uid}    이 브라우저가 비밀번호를 맞혔다는 표시(같은 해시)
 *   cost_sites/{코드}         {name, total, budget?, start?, end?, at, upd?}
 *   cost_rows/{코드}/{id}     {d:'2026-09-26', k:'L', t:'형틀목공 5인', amt, q?, u?, by?, at}
 */
import { writeWorkbook, ST } from './qtoxlsx.js'

export const 구분 = [
  { k: 'L', 이름: '노무비', 색: '#3b82f6' },
  { k: 'M', 이름: '자재비', 색: '#10b981' },
  { k: 'E', 이름: '장비비', 색: '#f59e0b' },
  { k: 'S', 이름: '외주비', 색: '#8b5cf6' },
  { k: 'X', 이름: '경비', 색: '#ef4444' },
  { k: 'O', 이름: '기타', 색: '#64748b' },
]
export const 구분이름 = Object.fromEntries(구분.map((x) => [x.k, x.이름]))

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

export const 오늘 = () => {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
const 날 = (s) => (s ? new Date(s + 'T00:00:00') : null)

/**
 * 한눈에 볼 숫자들
 * @param site {total, budget?, start?, end?}
 * @param rows [{d, k, amt}]
 */
export function 요약(site, rows, 기준 = 오늘()) {
  let 누적 = 0, 이번달 = 0, 오늘치 = 0
  const ym = 기준.slice(0, 7)
  const 구분합 = Object.fromEntries(구분.map((x) => [x.k, 0]))
  const 월 = new Map()
  for (const r of rows) {
    const a = Number(r.amt) || 0
    누적 += a
    구분합[r.k] = (구분합[r.k] || 0) + a
    if (r.d && r.d.slice(0, 7) === ym) 이번달 += a
    if (r.d === 기준) 오늘치 += a
    const m = (r.d || '').slice(0, 7) || '날짜 없음'
    const x = 월.get(m) || { ym: m, 합: 0, ...Object.fromEntries(구분.map((c) => [c.k, 0])) }
    x[r.k] = (x[r.k] || 0) + a
    x.합 += a
    월.set(m, x)
  }
  const 월별 = [...월.values()].sort((a, b) => (a.ym < b.ym ? -1 : 1))
  let run = 0
  for (const m of 월별) { run += m.합; m.누적 = run; m.률 = site.total > 0 ? run / site.total : NaN }
  const total = Number(site.total) || 0, budget = Number(site.budget) || 0
  let 경과율 = NaN, 남은날 = null
  const s = 날(site.start), e = 날(site.end), t = 날(기준)
  if (s && e && e > s) {
    경과율 = Math.min(1, Math.max(0, (t - s) / (e - s)))
    남은날 = Math.round((e - t) / 86400000)
  }
  return {
    누적, 이번달, 오늘치, 구분합, 월별,
    투입률: total > 0 ? 누적 / total : NaN,
    실행률: budget > 0 ? 누적 / budget : NaN,
    남은: total - 누적,
    실행남은: budget > 0 ? budget - 누적 : null,
    경과율, 남은날,
    건수: rows.length,
  }
}

/** 엑셀 한 벌 — 요약 · 월별 · 투입 내역 */
export function 엑셀(site, rows, 코드) {
  const S = 요약(site, rows)
  const 정렬 = [...rows].sort((a, b) => (a.d === b.d ? (a.at || 0) - (b.at || 0) : a.d < b.d ? -1 : 1))
  const 돈 = (v) => ({ v: Math.round(v || 0), st: ST.INT })
  const 률 = (v) => (Number.isFinite(v) ? { v: Math.round(v * 10000) / 10000, st: ST.PCT } : '')
  const 요약줄 = [
    ['현장명', site.name],
    ['현장 코드', 코드보기(코드 || '')],
    ['공사기간', `${site.start || ''} ~ ${site.end || ''}`],
    ['총공사금액', 돈(site.total)],
    ['실행예산', site.budget ? 돈(site.budget) : ''],
    ['누적 투입비', 돈(S.누적)],
    ['투입률(총공사금액 대비)', 률(S.투입률)],
    ['실행예산 대비', 률(S.실행률)],
    ['남은 금액(총공사금액 − 누적)', 돈(S.남은)],
    ['공기 경과율', 률(S.경과율)],
    ...구분.map((c) => [c.이름 + ' 합계', 돈(S.구분합[c.k])]),
    ['뽑은 날', 오늘()],
    ['만든 곳', 'K-건설맵 현장 투입비 (k-conmap.com/tools/tuipbi)'],
  ]
  const 월줄 = S.월별.map((m) => [m.ym, ...구분.map((c) => 돈(m[c.k])), 돈(m.합), 돈(m.누적), 률(m.률)])
  const 내역줄 = 정렬.map((r, i) => [i + 1, r.d, 구분이름[r.k] || r.k, r.t || '',
    r.q != null ? { v: r.q, st: ST.DEC2 } : '', r.u != null ? 돈(r.u) : '', 돈(r.amt), r.by || ''])
  return writeWorkbook([
    { name: '요약', head: ['항목', '값'], rows: 요약줄, widths: [30, 36], freeze: false },
    { name: '월별 집계', head: ['월', ...구분.map((c) => c.이름), '월 합계', '누적', '투입률'], rows: 월줄,
      widths: [10, 14, 14, 14, 14, 14, 14, 15, 16, 10] },
    { name: '투입 내역', head: ['번호', '날짜', '구분', '내용', '수량', '단가', '금액', '적은 사람'], rows: 내역줄,
      widths: [6, 11, 8, 40, 9, 12, 14, 10] },
  ])
}

/* 🧪 예시 — 지어낸 현장입니다(이름·금액 모두 가상). 저장되지 않고 이 화면에서만 봅니다. */
export function 예시현장() {
  const site = { name: '가상 ○○동 근린생활시설 신축공사 (예시)', total: 1_250_000_000, budget: 1_085_000_000,
    start: '2026-03-02', end: '2026-12-31', at: 0 }
  const rows = []
  let seed = 7
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
  const 항목 = {
    L: [['보통인부', 187000], ['형틀목공', 283000], ['철근공', 276000], ['콘크리트공', 262000], ['조적공', 270000], ['미장공', 275000]],
    M: [['레미콘 25-24-150', 98000], ['철근 SD400 D13', 1020000], ['합판 거푸집', 18500], ['시멘트 벽돌', 110], ['단열재 압출법 100T', 21000]],
    E: [['굴착기 0.7㎥', 950000], ['펌프카 42m', 1150000], ['크레인 25t', 1250000], ['덤프트럭 15t', 620000]],
    S: [['방수공사 (외주)', 0], ['전기공사 기성 (외주)', 0], ['설비공사 기성 (외주)', 0]],
    X: [['현장사무실 전기·수도', 0], ['안전용품', 0], ['가설울타리 임대', 0], ['식대', 0]],
  }
  const 달별비율 = { 3: 0.35, 4: 0.8, 5: 1.1, 6: 1.25, 7: 1.2, 8: 1.05, 9: 0.9 }
  for (const [mm, w] of Object.entries(달별비율)) {
    const m = Number(mm)
    for (let day = 1; day <= 28; day++) {
      const d = `2026-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      if (new Date(d + 'T00:00:00').getDay() === 0) continue
      if (m === 9 && day > 25) continue
      if (rnd() < 0.55 * w) { const [t, u] = 항목.L[Math.floor(rnd() * 6)]; const q = 3 + Math.floor(rnd() * 9 * w); rows.push({ d, k: 'L', t: `${t} ${q}인`, q, u, amt: q * u }) }
      if (rnd() < 0.35 * w) { const [t, u] = 항목.M[Math.floor(rnd() * 5)]; const q = t.includes('벽돌') ? 2000 + Math.floor(rnd() * 6000) : t.includes('철근') ? Math.round((1 + rnd() * 8) * 10) / 10 : t.includes('레미콘') ? 30 + Math.floor(rnd() * 90) : 20 + Math.floor(rnd() * 80); rows.push({ d, k: 'M', t, q, u, amt: Math.round(q * u) }) }
      if (rnd() < 0.18 * w) { const [t, u] = 항목.E[Math.floor(rnd() * 4)]; rows.push({ d, k: 'E', t: `${t} 1일`, q: 1, u, amt: u }) }
      if ((day === 10 || day === 25) && m >= 5) { const [t] = 항목.S[Math.floor(rnd() * 3)]; const a = Math.round((25 + rnd() * 45) * 1e6 / 1e4) * 1e4; rows.push({ d, k: 'S', t, amt: a }) }
      if (day === 28 || (rnd() < 0.05)) { const [t] = 항목.X[Math.floor(rnd() * 4)]; const a = Math.round((0.3 + rnd() * 2.5) * 1e6 / 1e3) * 1e3; rows.push({ d, k: 'X', t, amt: a }) }
    }
  }
  rows.forEach((r, i) => { r.id = 'ex' + i; r.at = i })
  return { site, rows }
}
