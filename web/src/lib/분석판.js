/* 📊 입찰 분석실 — 셈 (G340 · 2026-10-20)
 *   소장님 「입찰 프로그램, 이렇게 만들 수는 없을까」(비드프로 화면: 기관 예정/기초 흐름 · 분포 최고/차순 · 신뢰 구간 · 낙찰지점) ·
 *   「대표적인 프로그램이 하나씩 있잖아 … 그걸 만들고 싶어」 · 「이용자 입장에서 편하게 … 간편하게 … 그러면서 다 되게 … 정말 숙고해서」
 *
 * ■ 자료 (build_json.py build_sjl — 매일 자동 갱신 때 구움)
 *   /data/agency/sjl/{통}.json  기관 → {s: 시도, c: [[yymmdd, 사정률, 1순위 투찰률, 참가, 기초(만원), 예가범위(3·2·0), 1순위 업체, 공고명], …최신 앞 60]}
 *   /data/agency/sjd.json       전국 · 시도 · 금액대 분포(0.1%p 칸) · 시도 최신 60건 · 전국 적중 검사 · 앞뒤 상관
 * ■ 통 번호 = lib/기관사정률.js 통번호(이름 글자 번호 합 % 64) — 파이썬 sjr_bucket 과 같은 셈
 * ■ 적중검사() 는 파이썬 sjd_hit() 와 «같은 셈» 입니다(시험: tools/시험_분석판.mjs 가 대 봄).
 *   모든 방법을 폭 1%p 창으로 견줍니다 — 폭이 다르면 넓은 쪽이 더 맞는 것처럼 보입니다.
 * ⚠️ 사정률은 복수예비가격 추첨으로 매번 새로 뽑힙니다. 2026-10-20 잰 것: 앞 공고와 다음 공고 상관 0.01 ·
 *    «기관 흐름 가장 많은 두 칸» 42% < «전국 두 칸» 47% < «전국 가운데값 ±0.5» 48%(±3% · 4,768번).
 *    그래서 화면은 «흐름으로 맞힌다» 고 하지 않고, 지난 개찰에 대 본 숫자를 그대로 보여 줍니다.
 */
import { getJSON } from './data.js'
import { 통번호 } from './기관사정률.js'

/** 기관 이름 → {s, c:[줄…]} 또는 null */
export async function 긴흐름받기(inst) {
  const nm = String(inst || '').trim()
  if (!nm) return null
  const d = await getJSON(`/data/agency/sjl/${통번호(nm)}.json`)
  const v = d && d[nm]
  return v && Array.isArray(v.c) && v.c.length ? v : null
}

let 분포약속 = null
/** 전국 분포 · 적중 검사 — 한 번만 받음 */
export function 분포받기() {
  if (!분포약속) {
    분포약속 = getJSON('/data/agency/sjd.json')
      .then((d) => { if (d && d.b) return d; 분포약속 = null; return null })      /* 못 받으면(갱신 중 · 신호) 붙들지 않음 — 다시 받기가 됨 */
      .catch(() => { 분포약속 = null; return null })
  }
  return 분포약속
}

/** 기관 줄 하나 → 이름 붙인 것 */
export const 줄풀기 = (a) => ({
  d: String(a[0] || ''), sj: Number(a[1]), rate: a[2] == null ? null : Number(a[2]), np: a[3] == null ? null : Number(a[3]),
  base: (Number(a[4]) || 0) * 10000, r: Number(a[5]) || 0, win: String(a[6] || ''), name: String(a[7] || ''),
})
/** 시도 줄 하나 [yymmdd, 사정률, 예가범위, 기관] → 이름 붙인 것 */
export const 시도줄풀기 = (a) => ({ d: String(a[0] || ''), sj: Number(a[1]), r: Number(a[2]) || 0, inst: String(a[3] || '') })

/** 공고의 예가범위(lo · hi) → '3' · '2' · 'x' — 파이썬 _sjd_rng 과 같은 셈(안 실려 오면 '3') */
export function 범위of(lo, hi) {
  const a = Number(lo), b = Number(hi)
  if (lo == null || hi == null || !isFinite(a) || !isFinite(b)) return '3'
  if (Math.abs(a + 3) < 0.01 && Math.abs(b - 3) < 0.01) return '3'
  if (Math.abs(a + 2) < 0.01 && Math.abs(b - 2) < 0.01) return '2'
  return 'x'
}
export const 범위코드 = (r) => (r === '3' ? 3 : r === '2' ? 2 : 0)
export const 범위말 = (r) => (r === '3' ? '±3%' : r === '2' ? '±2%' : '그 밖')

/** 0.5%p 칸 번호 — 파이썬 math.floor(v / 0.5) 와 같음 */
export const 칸번호 = (v) => Math.floor(v / 0.5)
export const 칸이름 = (b) => `${(b * 0.5).toFixed(1)}~${(b * 0.5 + 0.5).toFixed(1)}`

/** 0.5%p 칸 중 가장 많은 두 칸(같으면 낮은 칸 먼저) — 파이썬 _top2 와 같음 */
export function 가장많은두칸(vals) {
  const c = new Map()
  for (const v of vals) { const b = 칸번호(v); c.set(b, (c.get(b) || 0) + 1) }
  return [...c.entries()].sort((x, y) => y[1] - x[1] || x[0] - y[0]).slice(0, 2).map((x) => x[0])
}

/** 가운데값 */
export function 가운데(vals) {
  const v = vals.filter((x) => isFinite(x)).slice().sort((a, b) => a - b)
  if (!v.length) return null
  return v[Math.floor(v.length / 2)]
}

/**
 * 적중 검사 — seq: 옛것부터 사정률. 앞 10건 이상 쌓인 다음 공고마다 방법을 대 봅니다(파이썬 sjd_hit 와 같은 셈).
 * 전국두칸: 칸 번호 두 개 · 전국가운데: % → {n, 셈: {flow2, all2, prev, avg10, med}(맞은 수), 율: {…}(%)}
 */
export function 적중검사(seq, 전국두칸 = [], 전국가운데 = 99.9) {
  const L = (seq || []).filter((x) => isFinite(x))
  const 셈 = { flow2: 0, all2: 0, prev: 0, avg10: 0, med: 0 }
  let n = 0
  for (let k = 10; k < L.length; k++) {
    const x = L[k], nb = 칸번호(x)
    n++
    if (가장많은두칸(L.slice(Math.max(0, k - 30), k)).includes(nb)) 셈.flow2++
    if (전국두칸.includes(nb)) 셈.all2++
    if (Math.abs(x - L[k - 1]) <= 0.5) 셈.prev++
    let s = 0
    for (let i = k - 10; i < k; i++) s += L[i]
    if (Math.abs(x - s / 10) <= 0.5) 셈.avg10++
    if (Math.abs(x - 전국가운데) <= 0.5) 셈.med++
  }
  const 율 = {}
  for (const k of Object.keys(셈)) 율[k] = n ? Math.round(셈[k] / n * 1000) / 10 : null
  return { n, 셈, 율 }
}

/** 앞 공고와 다음 공고 사정률 상관 — 10쌍 못 되면 null (파이썬 _corr 와 같음) */
export function 앞뒤상관(seq) {
  const L = (seq || []).filter((x) => isFinite(x))
  if (L.length < 11) return null
  const xs = L.slice(0, -1), ys = L.slice(1)
  const m = (a) => a.reduce((s, v) => s + v, 0) / a.length
  const mx = m(xs), my = m(ys)
  let sxy = 0, sx = 0, sy = 0
  for (let i = 0; i < xs.length; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sx += (xs[i] - mx) ** 2; sy += (ys[i] - my) ** 2 }
  if (!sx || !sy) return null
  return Math.round(sxy / Math.sqrt(sx * sy) * 1000) / 1000
}

/** 상관 한 마디 */
export function 상관말(c) {
  if (c == null) return ''
  const a = Math.abs(c)
  return a < 0.1 ? '관계 없음' : a < 0.3 ? '약함' : a < 0.5 ? '보통' : '강함'
}

/** 0.1%p 칸 건수(sjd) → 0.5%p 칸 [{b(칸 번호), n}] — lo ~ hi 사이만 */
export function 굵은칸(cnt, b, lo = 97, hi = 103) {
  if (!Array.isArray(cnt) || !Array.isArray(b)) return []
  const [s0, st] = b
  const m = new Map()
  cnt.forEach((n, i) => {
    if (!n) return
    const v = s0 + i * st + st / 2
    if (v < lo || v >= hi) return
    const k = 칸번호(v)
    m.set(k, (m.get(k) || 0) + n)
  })
  return [...m.entries()].sort((x, y) => x[0] - y[0]).map(([k, n]) => ({ b: k, n }))
}

/** 사정률 줄 → 0.5%p 칸 [{b, n}] */
export function 칸세기(vals, lo = 97, hi = 103) {
  const m = new Map()
  for (const v of vals) {
    if (!isFinite(v) || v < lo || v >= hi) continue
    const k = 칸번호(v)
    m.set(k, (m.get(k) || 0) + 1)
  }
  return [...m.entries()].sort((x, y) => x[0] - y[0]).map(([k, n]) => ({ b: k, n }))
}

/**
 * 두 비율 차이가 «건수로 보아 뚜렷한가» — 승률 곡선(G339)과 같은 2 × 표준오차 규칙
 * (같은 공고들에 두 방법을 대 본 것이라 엄밀한 짝 검정은 아니지만, 화면 말을 정하는 데는 충분히 보수적)
 */
export function 뚜렷이높음(p1, p2, n) {
  if (!(n > 0) || p1 == null || p2 == null) return false
  const a = p1 / 100, b = p2 / 100
  return a - b > 2 * Math.sqrt((a * (1 - a) + b * (1 - b)) / n)
}

/** 'yymmdd' → 'M.D' */
export function 짧은날(s) {
  const t = String(s || '')
  return t.length === 6 ? `${Number(t.slice(2, 4))}.${Number(t.slice(4, 6))}` : ''
}

export const 방법들 = [
  { k: 'flow2', 이름: '이 흐름에서 가장 많이 나온 두 칸', 덧: '흔히 «최고 · 차순» 이라 부르는 방법' },
  { k: 'all2', 이름: '전국에서 가장 많이 나온 두 칸', 덧: '같은 예가범위 전국 개찰' },
  { k: 'prev', 이름: '바로 앞 공고 사정률 ±0.5', 덧: '' },
  { k: 'avg10', 이름: '최근 10건 평균 ±0.5', 덧: '' },
  { k: 'med', 이름: '전국 가운데값 ±0.5', 덧: '흐름을 안 보고 늘 같은 자리' },
]
