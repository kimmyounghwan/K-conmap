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
    몫, 배: 몫 * n, 확보: 몫 * 예가수, 평균: 예가수 / n, 예가수,
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
  const 기대 = 건들.reduce((p, x) => p + x.몫, 0)
  return {
    잰개찰: 건들.length,
    구간: 구간들.map(([k], i) => ({ k, 귀사: 귀[i], 전체: 전체[i], 일순: 일순[i] })),
    몰린구간: 구간들[몰린][0], 몰린몫: 전체[몰린].몫, 귀사몰린몫: 귀[몰린].몫,
    배가운데: r3(가운데(건들.map((x) => x.배))),
    배평균: r3(건들.reduce((p, x) => p + x.배, 0) / 건들.length),
    평균넘은: 건들.filter((x) => x.배 >= 1).length,
    기대1순위: Math.round(기대 * 10) / 10,
    실제1순위: 건들.filter((x) => x.일순).length,
    실격: 건들.filter((x) => x.실격).length,
    내s가운데: r3(가운데(건들.map((x) => x.내s))),
    예정s가운데: r3(가운데(건들.map((x) => x.예정s))),
    /* 최근 것부터 — 표 · 줄그림 */
    최근: 건들.slice(-24).map(({ 남s, ...x }) => ({ ...x, 몫퍼: r3(x.몫 * 100), 배: r3(x.배), 확보: Math.round(x.확보 * 10) / 10, 평균: Math.round(x.평균 * 10) / 10 })),
  }
}
