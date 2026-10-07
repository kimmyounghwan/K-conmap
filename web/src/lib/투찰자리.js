/* ══════════════════════════════════════════════════════════════
   투찰자리.js — 업체 성적표 «투찰 사정률 · 확보 예가» (2026-10-06 · G174)

   소장님: (입찰 분석 사이트 캡처를 보시고) 「건설맵에 보완하면 어때? 도움 돼?」 → 「해줘 … 내일 바로 적용 가능하도록」
     캡처에 있던 것: 업체 «투찰 사정률» 구간 분포(99 미만 · 99~100 · 100~101 · 101 이상) ·
                     낙찰 잘 되는 곳과 비교 · 공고별 «확보 예가» · 예정가격 사정률 ↔ 투찰 사정률 줄그림.
     → 남의 화면을 베끼지 않고, 우리 개찰 자료(first.json — 개찰마다 낮은 금액 순 30곳)로 다시 셉니다.

   ■ 투찰 사정률 — 그 금액이 «딱 낙찰하한선» 이 되는 사정률(bidmath.breakEvenSj).
       예정가격 사정률이 그보다 높게 나오면 하한선이 올라와 실격, 낮게 나오면 삽니다.
   ■ 1순위 될 몫 · 확보 예가(어림) — 같은 개찰의 금액들을 낮은 순으로 늘어놓으면,
       내 금액이 1순위가 되는 사정률은 «바로 아래 금액의 사정률 ~ 내 사정률» 사이입니다.
       그 사이로 사정률이 나올 확률(그 공고 σ · 전국 가운데값 p50 — 성적표 분위와 같은 잣대)이 «몫» 이고,
       몫 × 예가 조합 수(15개 중 4개 = 1,365가지)가 «확보 예가(어림)» 입니다.
       평균 = 조합 수 ÷ 참가 수. «평균 대비 몇 배» = 몫 × 참가 수.
       ⚠️ 실제 15개 예비가격 값은 담고 있지 않아 «투찰 때 기대» 로 셉니다(개찰 뒤 실제 조합 수가 아님 — «어림»).
   ■ 계산은 bidmath.js 하나만 씁니다(같은 식을 여기 다시 적지 않습니다). 성적표.js(파이썬과 한 줄씩 맞추는 셈)는 건드리지 않습니다.
   ⚠️ 생존 편향 — «1순위가 앉았던 구간에 넣으십시오» 라고 쓰지 않습니다(그 자리는 개찰 뒤에야 보임 · CLAUDE.md 8-9).
      말할 수 있는 것은 «남들이 몰린 구간에 같이 넣었나 · 몫을 얼마나 확보했나» 입니다.
   시험: node tools/시험_투찰자리.mjs
   ══════════════════════════════════════════════════════════════ */
import * as B from './bidmath.js'
import { 내줄 } from './성적표.js'

export const 구간들 = [['99 미만', -Infinity, 99], ['99~100', 99, 100], ['100~101', 100, 101], ['101 이상', 101, Infinity]]
export const 구간찾기 = (s) => (s == null || !isFinite(s) ? -1 : 구간들.findIndex(([, lo, hi]) => s >= lo && s < hi))
export function 조합수(n, k) {
  n = Number(n) || 15; k = Number(k) || 4
  if (k < 1 || n <= k) return 0
  let r = 1
  for (let i = 1; i <= k; i++) r = r * (n - k + i) / i
  return Math.round(r)
}
const r3 = (v) => (v == null ? null : Math.round(v * 1000) / 1000)
const 가운데 = (a) => {
  const s = a.filter((x) => x != null && isFinite(x)).sort((x, y) => x - y)
  if (!s.length) return null
  const h = s.length >> 1
  return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2
}

/* 🩹 G183 (2026-10-07) «바로 아래 업체를 아는가» — 개찰 자료는 개찰 순위 30곳까지(하한 위 낮은 순 → 하한 아래)만 실려 있습니다.
   참가가 실린 수보다 많으면 하한 아래 업체 · 30위 밖 업체가 빠져 있어, 1위(바로 아래가 안 실린 하한 아래 업체) ·
   하한 아래로 실린 업체는 몫을 셀 수 없습니다(전에는 바로 아래를 «없음» 으로 보고 몫을 크게 셌음 — 1위 칩 «13배» 처럼).
   알 수 있는 것: 다 실렸거나, 하한 위 덩이(1위 ~ k위 · 금액이 이어짐) 안에서 자기보다 낮은 금액이 덩이에 있을 때. */
export function 아래앎(corps, np, nrank) {
  const 금 = (corps || []).map((c) => (c && Number(c[1]) > 0 ? Number(c[1]) : null)).filter((m) => m != null)
  const 다실림 = Math.max(Number(np) || 0, Number(nrank) || 0, 금.length) <= 금.length
  let k = 1
  while (k < 금.length && 금[k] >= 금[k - 1]) k++
  const 덩 = 금.slice(0, k)
  return (amt) => 다실림 || (덩.includes(amt) && 덩.some((m) => m < amt))
}

/** 개찰 한 건 — 이 업체가 없거나 셀 수 없으면 null */
export function 한개찰(row, bno, p50) {
  const base = Number(row && row.base) || 0
  const llr = Number(row && row.llr) || 0
  if (!base || !llr) return null
  const cs = (row.corps || []).filter((c) => c && Number(c[1]) > 0)
  if (cs.length < 2) return null                       // 혼자 넣은 개찰은 «몰린 곳» 을 말할 수 없음
  const mine = 내줄(row, bno)
  if (!mine || !(mine[2] > 0)) return null
  const [rank, , amt] = mine
  const sd = B.sjSigma(row.lo != null && row.lo !== '' ? Number(row.lo) : -3, row.hi != null && row.hi !== '' ? Number(row.hi) : 3,
                       row.ptot || 15, row.pdrw || 4)
  if (!(sd > 0)) return null
  const a = Number(row.aval) || 0
  const be = (m) => B.breakEvenSj(base, llr, a, m)
  const F = (s) => B.normCdf((s - p50) / sd)
  const 내s = be(amt)
  const 금액들 = [...new Set(cs.map((c) => Number(c[1])))].sort((x, y) => x - y)
  let 앞 = null
  for (const m of 금액들) { if (m < amt) 앞 = m; else break }
  const 같은값 = cs.filter((c) => Number(c[1]) === amt).length
  let 몫 = F(내s) - (앞 != null ? F(be(앞)) : 0)
  if (같은값 > 1) 몫 /= 같은값                          // 같은 금액이면 추첨 — 나눠 가짐
  몫 = Math.max(0, Math.min(1, 몫))
  if (!아래앎(row.corps, row.np, row.nrank)(amt)) 몫 = null   // 🩹 G183 바로 아래 업체를 모름 — 확보 예가는 안 셈
  const n = Math.max(Number(row.np) || 0, Number(row.nrank) || 0, cs.length)
  const 예가수 = 조합수(row.ptot || 15, row.pdrw || 4)
  /* 예정가격 사정률(개찰 뒤 확정) — 1순위 금액 ÷ 1순위 투찰률 (성적표.js 한건 과 같은 셈) */
  const w = cs[0]
  const yeje = w && Number(w[2]) > 0 ? Math.round(Number(w[1]) / (Number(w[2]) / 100)) : 0
  const 예정s = yeje ? yeje / base * 100 : null
  return {
    no: row.no, dt: String(row.dt || ''), name: row.name || '', inst: row.inst || '',
    n, 담긴: cs.length, rank, 일순: rank === 1,
    내s: r3(내s), 예정s: r3(예정s), 일순s: r3(be(Number(w[1]))),
    실격: 예정s != null && 내s != null ? 내s < 예정s - 1e-9 : false,
    몫, 배: 몫 == null ? null : 몫 * n, 확보: 몫 == null ? null : 몫 * 예가수, 평균: 예가수 / n, 예가수,
    남s: cs.map((c) => be(Number(c[1]))).filter((s) => s != null),
  }
}

/** 업체 하나 — 셀 수 있는 개찰이 3건이 안 되면 null */
export function 투찰자리(bno, rows, p50) {
  const 건들 = []
  for (const r of rows || []) {
    const o = 한개찰(r, bno, p50)
    if (o) 건들.push(o)
  }
  if (건들.length < 3) return null
  건들.sort((x, y) => x.dt.localeCompare(y.dt))
  const 칸 = (list) => {
    const c = 구간들.map(() => 0)
    for (const s of list) { const i = 구간찾기(s); if (i >= 0) c[i]++ }
    const 합 = c.reduce((p, q) => p + q, 0) || 1
    return c.map((v) => ({ 건: v, 몫: v / 합 * 100 }))
  }
  const 귀 = 칸(건들.map((x) => x.내s))
  const 전체 = 칸(건들.flatMap((x) => x.남s))
  const 일순 = 칸(건들.map((x) => x.일순s))
  const 몰린 = 전체.reduce((m, v, i) => (v.몫 > 전체[m].몫 ? i : m), 0)
  /* 🩹 G183 확보 예가는 «바로 아래 업체를 아는» 개찰만(몫잰) — 1순위 · 하한 아래로 실린 개찰은 대개 못 잼 */
  const 잰 = 건들.filter((x) => x.몫 != null)
  const 기대 = 잰.reduce((p, x) => p + x.몫, 0)
  return {
    잰개찰: 건들.length,
    몫잰: 잰.length,
    구간: 구간들.map(([k], i) => ({ k, 귀사: 귀[i], 전체: 전체[i], 일순: 일순[i] })),
    몰린구간: 구간들[몰린][0], 몰린몫: 전체[몰린].몫, 귀사몰린몫: 귀[몰린].몫,
    배가운데: 잰.length ? r3(가운데(잰.map((x) => x.배))) : null,
    배평균: 잰.length ? r3(잰.reduce((p, x) => p + x.배, 0) / 잰.length) : null,
    평균넘은: 잰.filter((x) => x.배 >= 1).length,
    기대1순위: Math.round(기대 * 10) / 10,
    잰1순위: 잰.filter((x) => x.일순).length,
    실제1순위: 건들.filter((x) => x.일순).length,
    실격: 건들.filter((x) => x.실격).length,
    내s가운데: r3(가운데(건들.map((x) => x.내s))),
    예정s가운데: r3(가운데(건들.map((x) => x.예정s))),
    /* 최근 것부터 — 표 · 줄그림 */
    최근: 건들.slice(-24).map(({ 남s, ...x }) => ({ ...x, 몫퍼: x.몫 == null ? null : r3(x.몫 * 100), 배: x.배 == null ? null : r3(x.배),
      확보: x.확보 == null ? null : Math.round(x.확보 * 10) / 10, 평균: Math.round(x.평균 * 10) / 10 })),
  }
}

/* ══════════════════════════════════════════════════════════════
   🎯 G181 (2026-10-07) 확보 예가를 «보이는 자리» 로 — 소장님 「원래 이게 어디에 있어야 가장 효과가 크지?」 →
   (바로투찰 · 1순위 개찰 상세 · 업체 페이지) 「고쳐줘」 · 「이미 잘 돌아가는 것은 손대지 말고, 예가만 추가해」
   → 위 한개찰 · 투찰자리(성적표)는 그대로 두고, 같은 셈을 «개찰 한 건의 모든 업체» 와 «아직 안 넣은 내 금액» 에 씁니다.
   ══════════════════════════════════════════════════════════════ */

/** 그 개찰의 사정률 잣대(σ · 하한선 사정률 함수) — 셀 수 없으면 null */
function 잣대(row, p50) {
  const base = Number(row && row.base) || 0
  const llr = Number(row && row.llr) || 0
  if (!base || !llr) return null
  const sd = B.sjSigma(row.lo != null && row.lo !== '' ? Number(row.lo) : -3, row.hi != null && row.hi !== '' ? Number(row.hi) : 3,
                       row.ptot || 15, row.pdrw || 4)
  if (!(sd > 0)) return null
  const a = Number(row.aval) || 0
  return { be: (m) => B.breakEvenSj(base, llr, a, m), F: (s) => B.normCdf((s - p50) / sd), 예가수: 조합수(row.ptot || 15, row.pdrw || 4) }
}

/** 1순위 개찰 상세 — 투찰 순위의 업체마다 확보 예가(어림). corps 와 같은 차례 · 셀 수 없으면 null 만 든 배열 */
export function 개찰몫들(row, corps, p50) {
  const cs = (corps || []).map((c) => (c && Number(c[1]) > 0 ? Number(c[1]) : null))
  const 잣 = 잣대(row, p50)
  if (!잣 || cs.filter((m) => m != null).length < 2) return cs.map(() => null)
  const n = Math.max(Number(row.np) || 0, Number(row.nrank) || 0, cs.filter((m) => m != null).length)
  const 금액들 = [...new Set(cs.filter((m) => m != null))].sort((x, y) => x - y)
  const 앎 = 아래앎(corps, row.np, row.nrank)                 // 🩹 G183 1위 · 하한 아래(안 실린 업체가 있을 때)는 못 셈
  return cs.map((amt) => {
    if (amt == null || !앎(amt)) return null
    const i = 금액들.indexOf(amt)
    const 앞 = i > 0 ? 금액들[i - 1] : null
    const 같은값 = cs.filter((m) => m === amt).length
    let 몫 = 잣.F(잣.be(amt)) - (앞 != null ? 잣.F(잣.be(앞)) : 0)
    if (같은값 > 1) 몫 /= 같은값
    몫 = Math.max(0, Math.min(1, 몫))
    return { 몫, 배: 몫 * n, 확보: 몫 * 잣.예가수, 평균: 잣.예가수 / n, 예가수: 잣.예가수, n }
  })
}

/** 시도 줄임말 → 현장 · 기관 글에 나오는 말들 (G183) */
export const 시도말 = {
  충북: ['충북', '충청북도'], 충남: ['충남', '충청남도'], 전북: ['전북', '전라북도'], 전남: ['전남', '전라남도'],
  경북: ['경북', '경상북도'], 경남: ['경남', '경상남도'],
}
/** 바로투찰 — 비슷한 개찰을 고름: 같은 기관 → 같은 시도·금액대 → 금액대(전국). 최근 것부터 최대 max건 */
export function 비슷한개찰(rows, 공고, { max = 60, 최소 = 8 } = {}) {
  const base = Number(공고 && 공고.base) || 0
  /* 📦 G184 — 작은 자료(lib/확보예가자료.js 미니풀기)는 corps 대신 _s(사정률들) 를 가짐 */
  const 셀 = (r) => r && Number(r.base) > 0 && Number(r.llr) > 0 && (Array.isArray(r._s) ? r._s.length >= 2 : Array.isArray(r.corps) && r.corps.filter((c) => c && Number(c[1]) > 0).length >= 2)
  const 금액대 = (r) => base > 0 && Number(r.base) >= base / 2 && Number(r.base) <= base * 2
  const 새것 = (a) => a.sort((x, y) => String(y.dt || '').localeCompare(String(x.dt || ''))).slice(0, max)
  const 다 = (rows || []).filter(셀)
  const inst = String((공고 && 공고.inst) || '').trim()
  if (inst) {
    const 같은 = 다.filter((r) => String(r.inst || '').trim() === inst)
    if (같은.length >= 최소) return { 고른: '같은 기관', rows: 새것(같은) }
  }
  const sido = String((공고 && 공고.sido) || '').split(',')[0]
  if (sido) {
    /* 🩹 G183 — 현장 글은 «전라남도 …» 처럼 긴 이름이라 «전남» 으로는 안 맞았음(전남 · 전북 · 경남 · 경북 · 충남 · 충북) */
    const 말들 = 시도말[sido] || [sido]
    const 시도 = 다.filter((r) => 금액대(r) && 말들.some((w) => String(r.site || r.inst || '').includes(w)))
    if (시도.length >= 최소) return { 고른: `${sido} · 비슷한 금액`, rows: 새것(시도) }
  }
  const 전국 = 다.filter(금액대)
  return { 고른: '전국 · 비슷한 금액', rows: 새것(전국) }
}

/** 바로투찰 — «이 사정률(내 금액이 딱 하한선이 되는 사정률)로 그 개찰들에 넣었다면» 확보 예가(평균 대비 배) */
export function 미리확보(rows, 내s, p50, { 폭 = 0.05 } = {}) {
  if (내s == null || !isFinite(내s)) return null
  const 건들 = []
  for (const r of rows || []) {
    const 잣 = 잣대(r, p50)
    if (!잣) continue
    /* 📦 G184 — 작은 자료는 사정률(_s · 개찰 순위 차례)을 이미 가짐 → 그대로 */
    const 순서s = Array.isArray(r._s) ? r._s.filter((s) => s != null && isFinite(s))
      : (r.corps || []).map((c) => (c && Number(c[1]) > 0 ? 잣.be(Number(c[1])) : null)).filter((s) => s != null && isFinite(s))
    const 남s = 순서s
    if (남s.length < 2) continue
    const 참가 = Math.max(Number(r.np) || 0, Number(r.nrank) || 0, 남s.length)
    const n = 참가 + 1
    /* 🩹 G183 (2026-10-07) 개찰 자료는 «낮은 금액 30곳» 까지만 실려 있습니다. 참가가 그보다 많은 개찰에서
       내 사정률이 실린 곳 가운데 가장 높은 것보다 위면, 바로 아래 업체가 누구인지(안 실린 업체가 사이에 있는지) 모릅니다.
       전에는 실린 맨 위 업체를 «바로 아래» 로 보고 몫을 크게 셌습니다(큰 공사에서 «평균의 14배» 처럼 부풀려짐) → 그 개찰은 «못 잼» 으로 뺍니다. */
    const 다실림 = 참가 <= 남s.length
    /* corps 는 개찰 순위 차례(하한 위 낮은 순 → 하한 아래). 하한 위 덩이(1위 ~ k위)는 금액이 이어져 있어
       그 안(1위 초과 ~ k위 이하)에 들면 바로 아래 업체를 압니다. 1위 아래 · k위 위는 안 실린 업체가 있을 수 있어 못 잽니다. */
    const 순s = 순서s
    let k = 1
    while (k < 순s.length && 순s[k] >= 순s[k - 1]) k++
    const 아래끝 = 순s[0], 위끝 = 순s[k - 1]
    const 잼 = (s) => 다실림 || (s > 아래끝 + 1e-9 && s <= 위끝 + 1e-9)
    const 몫at = (s) => {
      if (!잼(s)) return null
      let 앞 = null
      for (const x of 남s) if (x < s && (앞 == null || x > 앞)) 앞 = x
      return Math.max(0, Math.min(1, 잣.F(s) - (앞 != null ? 잣.F(앞) : 0)))
    }
    const 근처 = 잼(내s + 폭) && 잼(내s - 폭) ? 남s.filter((x) => Math.abs(x - 내s) <= 폭).length : null
    const 몫 = 몫at(내s)
    건들.push({ 배: 몫 == null ? null : 몫 * n, 근처, 몫at, n })
  }
  const 잰 = 건들.filter((x) => x.배 != null)
  if (건들.length < 5) return null
  const 격자 = []
  for (let d = -0.3; d <= 0.3001; d += 0.05) {
    const s = 내s + d
    const 값 = 건들.map((x) => { const m = x.몫at(s); return m == null ? null : m * x.n }).filter((v) => v != null)
    격자.push({ s: r3(s), d: r3(d), 배: 값.length >= 5 ? r3(가운데(값)) : null, 잰: 값.length })
  }
  const 근처들 = 건들.filter((x) => x.근처 != null)
  return {
    건: 건들.length,
    잰: 잰.length,
    배가운데: 잰.length >= 5 ? r3(가운데(잰.map((x) => x.배))) : null,
    평균넘은: 잰.filter((x) => x.배 >= 1).length,
    근처평균: 근처들.length >= 5 ? Math.round(근처들.reduce((p, x) => p + x.근처, 0) / 근처들.length * 10) / 10 : null,
    격자,
  }
}
