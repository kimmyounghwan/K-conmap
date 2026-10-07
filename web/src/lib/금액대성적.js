/* ══════════════════════════════════════════════════════════════
   금액대성적.js — 💰 금액대별 «이 자리에 넣었다면» 지난 개찰 성적 (G185 · 2026-10-07)

   소장님: 「1억이하 … 1부터 2억까지 … 세분화해서 100억까지 가자고.. 이용자들이 금액을 선택해서 최종낙찰금액을 보게」
           「1순위 금액을 그 가격대에서 다시 재봐. 권장투찰금액하고 낙찰금액하고...비교해보고 ...최종확률」
           「선택하도록 해야지. 설명만 하고… 단정적으로 하면 안돼」 · 「비용 고려 해서 만들어 줘」
   → 매일 자동 갱신 때(tools/확보예가굽기.mjs · 깃허브 = 무료) 금액대마다 «사정률 분위 자리별 실격 · 1순위 건수» 표를 구워
     /data/kb/gm.json(수 KB)로 싣고, 바로투찰은 그 표에서 고른 금액의 자리를 찾아 읽기만 합니다.
   ■ 자리(z) = (투찰 사정률 − 전국 가운데 사정률) ÷ 그 공고의 사정률 표준편차. 25분위 = −0.674 · 50분위 = 0 · 90분위 = 1.282.
   ■ 그 자리의 금액은 바로투찰과 같은 길(quantileBid: 사정률 → 하한금액 올림 → 투찰률 소수 3자리 올림 → 금액)로 셉니다.
   ■ 개찰마다 실제 낙찰하한(1순위 금액 ÷ 1순위 투찰률로 예정가격) 아래면 실격 · 하한 이상이고 1순위 금액보다 낮으면 1순위.
   ■ 금액대: 10억까지 1억 단위 · 그 위는 넓게(1억 단위면 칸마다 1~50건뿐이라 0% · 100% 처럼 튐 — 기록 2026-10-07 12:0x).
   시험: node tools/시험_금액대성적.mjs
   ══════════════════════════════════════════════════════════════ */
import * as B from './bidmath.js'

export const 판 = 1
export const Z0 = -2.5, DZ = 0.05, ZN = 101          // −2.5 ~ +2.5 · 0.05 간격
export const 금액대들 = [
  [0, 1e8, '1억 이하'], [1e8, 2e8, '1~2억'], [2e8, 3e8, '2~3억'], [3e8, 4e8, '3~4억'], [4e8, 5e8, '4~5억'],
  [5e8, 6e8, '5~6억'], [6e8, 7e8, '6~7억'], [7e8, 8e8, '7~8억'], [8e8, 9e8, '8~9억'], [9e8, 1e9, '9~10억'],
  [1e9, 1.5e9, '10~15억'], [1.5e9, 2e9, '15~20억'], [2e9, 3e9, '20~30억'], [3e9, 5e9, '30~50억'], [5e9, 1e10, '50~100억'],
]
/* ⚠️ 100억 넘는 공사는 뺍니다 — 종합심사 등 «하한 위 가장 낮은 금액 = 1순위» 가 아닌 공고가 섞여, 이 셈으로는 «권장 1순위 58%» 처럼 엉뚱하게 나왔습니다(시험 2026-10-07). */
/** 기초금액 → 금액대 번호(«1억 이하» = 1억까지 · «1~2억» = 1억 초과 2억 이하) */
export function 금액대of(base) {
  const b = Number(base) || 0
  if (!(b > 0)) return -1
  return 금액대들.findIndex(([lo, hi], i) => (i === 0 ? b <= hi : b > lo && b <= hi))
}
/** 그 자리(z)의 금액 — 바로투찰 분위 금액과 같은 길 */
export function 자리금액(base, llr, a, p50, sd, z) {
  const sj = Math.round((p50 + z * sd) * 1000) / 1000
  const m = Math.ceil(B.limitAmount(base, sj, llr, a))
  const s = B.shownBid(base, p50, m)
  return s ? s.amt : m
}

/** 굽기 — 개찰 줄들 → { v, p50, 기간, z0, dz, b: [{ k, n, np, rec: [실격, 1순위], dq: [자리마다 실격 건], win: [자리마다 1순위 건] }] } */
export function 성적만들기(rows, p50) {
  const 칸 = 금액대들.map(([, , k]) => ({ k, n: 0, nps: [], rec: [0, 0], dq: new Array(ZN).fill(0), win: new Array(ZN).fill(0) }))
  let 처음 = '', 끝 = ''
  for (const r of rows || []) {
    const base = Number(r && r.base), amt = Number(r && r.amt), rate = Number(r && r.rate), llr = Number(r && r.llr)
    if (!B.isReady(r) || !(base > 0) || !(amt > 0) || !(rate > 80 && rate < 100) || r.lo == null || r.hi == null || !((Number(r.np) || 0) >= 2)) continue
    const a = r.ayn === 'N' ? 0 : (Number(r.aval) || 0)
    const sd = B.sjSigma(Number(r.lo), Number(r.hi), r.ptot, r.pdrw)
    if (!(sd > 0)) continue
    const i = 금액대of(base)
    if (i < 0) continue
    const yeje = amt / (rate / 100)
    const lim = Math.ceil((yeje - a) * (llr / 100) + a)
    const 판정 = (m) => (m < lim ? 1 : m < amt ? 2 : 0)
    const c = 칸[i]
    c.n++; c.nps.push(Number(r.np))
    const q = B.quickBid(r, p50)
    if (q && q.amt > 0) { const v = 판정(q.amt); if (v === 1) c.rec[0]++; if (v === 2) c.rec[1]++ }
    for (let j = 0; j < ZN; j++) {
      const v = 판정(자리금액(base, llr, a, p50, sd, Z0 + j * DZ))
      if (v === 1) c.dq[j]++; else if (v === 2) c.win[j]++
    }
    const d = String(r.dt || '').slice(0, 10)
    if (d && (!처음 || d < 처음)) 처음 = d
    if (d && d > 끝) 끝 = d
  }
  return {
    v: 판, p50, 기간: [처음, 끝], z0: Z0, dz: DZ,
    b: 칸.map(({ nps, ...c }) => ({ ...c, np: nps.length ? nps.sort((x, y) => x - y)[nps.length >> 1] : 0 })),
  }
}

/** 읽기 — 그 금액대 · 그 자리(z)의 { n, 실격, 일순 } (건수 · 이웃 두 칸 사이를 곧게 이음 · 표 밖이면 끝 칸) */
export function 자리성적(표, i, z) {
  const c = 표 && 표.v === 판 && 표.b ? 표.b[i] : null
  if (!c || !(c.n > 0) || z == null || !isFinite(z)) return null
  const x = (z - 표.z0) / 표.dz
  const 밖 = x < -0.5 || x > ZN - 1 + 0.5
  const xx = Math.max(0, Math.min(ZN - 1, x))
  const j0 = Math.min(ZN - 2, Math.floor(xx)), t = xx - j0
  const 이음 = (a) => a[j0] * (1 - t) + a[j0 + 1] * t
  return { n: c.n, 실격: 이음(c.dq), 일순: 이음(c.win), 밖 }
}
/** 분위(0~100) → 표준정규 z (Acklam 근사 · 오차 1e-9 남짓) — 바로투찰 분위표(QTILES) z 와 같음 */
export function 분위z(q) {
  const p = Math.min(1 - 1e-9, Math.max(1e-9, Number(q) / 100))
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239]
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1]
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783]
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416]
  const pl = 0.02425
  if (p < pl) { const q2 = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q2 + c[1]) * q2 + c[2]) * q2 + c[3]) * q2 + c[4]) * q2 + c[5]) / ((((d[0] * q2 + d[1]) * q2 + d[2]) * q2 + d[3]) * q2 + 1) }
  if (p > 1 - pl) { const q2 = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q2 + c[1]) * q2 + c[2]) * q2 + c[3]) * q2 + c[4]) * q2 + c[5]) / ((((d[0] * q2 + d[1]) * q2 + d[2]) * q2 + d[3]) * q2 + 1) }
  const q2 = p - 0.5, r = q2 * q2
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q2 / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
}
/** 넓게 본 범위(윌슨 95%) — %로 [아래, 위] */
export function 넓게(k, n) {
  if (!(n > 0)) return [0, 0]
  const z = 1.96, p = k / n, d = 1 + z * z / n, c = (p + z * z / (2 * n)) / d
  const h = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
  return [Math.max(0, c - h) * 100, Math.min(1, c + h) * 100]
}
