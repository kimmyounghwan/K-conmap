/* ══════════════════════════════════════════════════════════════
   bidmath.js — 바로투찰의 «계산» 만 모아 둔 곳

   왜 따로 뺐나
     2026-09-03 — 검사를 브라우저로 돌리게 만들었더니 소장님 PC 에서
     Playwright 가 없어 돌지 않았습니다. 계산을 화면 코드 안에 두면
     «화면을 띄워야만» 검사할 수 있습니다. 그건 잘못된 구조입니다.
     계산을 여기로 빼서, 브라우저 없이 `node` 만으로 검사할 수 있게 했습니다.

   ⚠️ 화면(BaroBid.jsx)도 채점도 이 파일 하나만 씁니다. 여기 말고 다른 데
      같은 식을 또 쓰지 마세요 — 그래서 두 화면이 어긋났던 적이 있습니다.
   ⚠️ 이 파일을 고치면 `python tools/selfcheck.py` 가 파이썬으로 따로 쓴
      계산기(tools/bidmath.py)와 맞춰 봅니다. 어긋나면 배포가 멈춥니다.
   ══════════════════════════════════════════════════════════════ */

/** 투찰금액 = 예정가격 × 투찰률 (조달청 투찰률 정의 그대로) */
/* 전국 사정률 중앙값의 «대체값» — overview.json 의 sjq.p50 이 없을 때만 씁니다.
   ⚠️ 2026-09-03 전에는 이 값이 화면 안에 100 · 99.9 · 99.894 로 세 가지가 흩어져 있었습니다.
      sjq 가 빠지면 같은 공고의 금액이 자리마다 달라지는 구조였습니다. 하나로 모읍니다.
      실측(3년치 개찰) 중앙값 99.896 — build_json.py 가 sjq.p50 으로 매번 다시 잽니다. */
export const P50_FALLBACK = 99.896

export function bidAmount(base, sajeong, rate) {
  if (!base || !rate) return 0
  return Math.ceil(base * (sajeong / 100) * (rate / 100))
}

/** 낙찰하한금액 = (예정가격 − A) × 하한율 + A — 적격심사 규정 */
export function limitAmount(base, sajeong, llRate, aVal) {
  if (!base || !llRate) return 0
  const yeje = base * (sajeong / 100)
  return Math.ceil((yeje - aVal) * (llRate / 100) + aVal)
}

/** 그 하한금액을 «투찰률»로 환산한 값. A가 있으면 명목 하한율보다 높습니다. */
export function limitRate(base, sajeong, llRate, aVal) {
  const yeje = base * (sajeong / 100)
  if (!yeje || !llRate) return 0
  return (limitAmount(base, sajeong, llRate, aVal) / yeje) * 100
}

export const digits = (s) => String(s || '').replace(/[^0-9]/g, '')
export const toNum = (s) => Number(digits(s)) || 0
/* ══════════════════════════════════════════════════════════════
   «계산할 수 있는 공고» 판정 — 하나라도 없으면 답을 내지 않습니다.

   금액을 내려면 네 가지가 다 있어야 합니다:
     ① 기초금액   — 없으면 아무것도 못 함
     ② 낙찰하한율 — 공고에 실린 값. 규모로 추측하면 2%p 틀려 수천만원이 어긋납니다
     ③ A값        — 실린 값이거나 «A값 미적용(N)». 추정하면 하한이 흔들립니다
     ④ 예가범위·예비가격 개수 — 사정률 분포를 그 공고 기준으로 계산하려면 필요합니다

   실측(2026-09-02): 마감 전 공고 1,939건 중 860건(44.4%)이 완비.
   나머지는 «아직 계산할 수 없습니다» 라고 말하고 무엇이 빠졌는지 알려줍니다.
   반쯤 아는 걸로 금액을 내미는 것보다, 모른다고 하는 편이 낫습니다.
   ══════════════════════════════════════════════════════════════ */
export function missingOf(r) {
  if (!r) return []
  const m = []
  const llr = Number(r.llr)
  if (!(r.base > 0)) m.push('기초금액')
  if (!(llr >= 60 && llr <= 100)) m.push('낙찰하한율')
  if (!(r.aval > 0 || r.ayn === 'N')) m.push('A값')
  if (!(r.ptot > 0 && r.pdrw > 0)) m.push('예비가격 정보')
  return m
}
export const isReady = (r) => missingOf(r).length === 0

export const r3 = (n) => Math.round(n * 1000) / 1000
/* 하한 관련 비율은 반올림하면 실제 하한금액 아래로 내려갑니다.
   «✅ 통과 · 여유 0.000%p» 를 띄운 채 몇백 원이 모자라 실격합니다. 그래서 올립니다. */
export const c3 = (n) => Math.ceil(n * 1000) / 1000

/* ══════════════════════════════════════════════════════════════
   ⚠️ 여기 두 함수는 «추천 화면»과 «채점»이 **같이** 씁니다. 나누지 마세요.

   2026-09-02 팀 검증에서 드러난 사고:
     추천은 A값을 아는 공고에 «75분위 + 0.3%» 를 쓰는데,
     채점은 옛 방식 «95분위, 여유 없음, 예가범위 항상 ±3%» 로 채점하고 있었습니다.
     958건 전부 금액이 달랐고(중앙 +39만원), 판정이 119건(12.4%) 뒤집혔습니다.
     실격률을 3.24% 로 보고했지만 실제 추천의 실격률은 11.59% 였습니다.
     «바로투찰이 실제로 내는 금액» 이 아닌 것으로 채점하면 그건 채점이 아닙니다.
   ══════════════════════════════════════════════════════════════ */

/** 그 공고의 사정률 표준편차 — 예가범위와 예비가격 개수로 정해집니다 */
export function sjSigma(lo, hi, ptot, pdrw) {
  const w = (Number(hi) || 0) - (Number(lo) || 0)
  const nTot = Number(ptot) || 15
  const nDrw = Number(pdrw) || 4
  if (!(w > 0) || nDrw < 1 || nTot <= nDrw) return null
  return Math.sqrt((w * w / 12) * (1 / nDrw) * ((nTot - nDrw) / (nTot - 1)))
}

/* 정규분포 분위 — 5분위부터 95분위까지 열 자리 */
export const SCEN_Z = [[5, -1.6449], [15, -1.0364], [25, -0.6745], [35, -0.3853], [45, -0.1257],
                [55, 0.1257], [65, 0.3853], [75, 0.6745], [85, 1.0364], [95, 1.6449]]

/** 「사정률이 이 값이었다면」 — 추천 화면과 채점이 **같은 함수**를 씁니다.
 *  투찰금액(myAmt)은 하나로 고정하고, 사정률만 바꿔가며 그때의 하한을 구합니다.
 *  ⚠️ 전국 사정률 10분위(ov.sjc)를 쓰면 안 됩니다 — ±2%와 ±3% 공고가 섞여 있어
 *     ±2% 공고에 있지도 않은 넓은 흔들림을 보여주게 됩니다. 그 공고의 σ 로 만듭니다. */
export function buildScen({ base, llRate, aVal, p50, sd, myAmt, realSj, realLimit }) {
  if (!(base > 0) || !llRate || sd == null || !(myAmt > 0)) return null
  const lowOf = (v) => Math.ceil((base * (v / 100) - aVal) * (llRate / 100) + aVal)
  const rows = SCEN_Z.map(([q, z]) => {
    const sj = Math.round((p50 + z * sd) * 1000) / 1000
    const low = lowOf(sj)
    return { q, sj, low, pass: myAmt >= low, gap: myAmt - low }
  })
  const passN = rows.filter((x) => x.pass).length
  if (realSj != null) {
    const low = realLimit != null ? realLimit : lowOf(realSj)
    rows.push({ q: null, sj: realSj, low, pass: myAmt >= low, gap: myAmt - low, real: true })
    rows.sort((x, y) => x.sj - y.sj)
  }
  return { rows, passN }
}

/** 바로투찰이 실제로 내는 금액. 추천 화면과 채점이 이 하나만 씁니다. */
export function recommend({ base, llRate, aVal, aKnown, p50, sd }) {
  if (!(base > 0) || !llRate || sd == null || !p50) return null
  const K = aKnown ? 0.674 : 1.63        // 75분위 : 95분위
  const margin = aKnown ? 1.003 : 1.0    // 75분위에는 0.3% 여유
  const sj = Math.round((p50 + K * sd) * 1000) / 1000
  const yeje = base * (sj / 100)
  return { sj, K, margin, pctile: aKnown ? 75 : 95,
           amt: Math.ceil(Math.ceil((yeje - aVal) * (llRate / 100) + aVal) * margin) }
}

/* ══════════════════════════════════════════════════════════════
   quickBid — «공고 한 줄»에서 권장 투찰금액을 바로 냅니다. 2026-09-03

   소장님: 「아이건설넷 원클릭처럼. 입찰가를 원클릭으로 구해서 입찰할 때.」
   바로투찰 화면 자체는 이미 한 화면에 금액·복사·나라장터가 있습니다.
   문제는 거기까지 가는 길이었습니다 — 공고 탭 → 알약 → 화면 이동 → 그제야 금액.
   원클릭이 되려면 **공고 카드에 금액이 이미 떠 있어야** 합니다.

   그래서 계산을 여기 한 함수로 뽑았습니다. 공고 카드도, 바로투찰 화면도 이걸 씁니다.
   (같은 계산을 두 곳에 적으면 반드시 어긋납니다 — 오늘 네 번 겪었습니다)

   입력은 공고 한 줄(r) 그대로입니다. 완비(isReady)가 아니면 null — 반쯤 아는 값으로
   금액을 내지 않습니다. 그건 «금액»이 아니라 «추측»입니다.
   ══════════════════════════════════════════════════════════════ */
/** 화면이 «실제로 띄우는» 금액 — recommend() 의 금액을 투찰률(소수 3자리 올림)로 바꿨다가
 *  다시 금액으로 만든 것. 사용자가 복사해 가는 금액은 이것입니다.
 *
 *  ★ 2026-09-03 — 이 «한 번 돌아가기» 가 세 곳(바로투찰 화면·원클릭·채점)에 따로 적혀 있다가
 *    채점만 빠져서 「바로투찰하고 채점 금액이 달라」 가 났습니다(실측 9,646건 전부, 중앙 475원·최대 96만원).
 *    이제 세 곳이 이 함수 하나를 부릅니다. 여기 말고 다른 데서 금액→투찰률→금액을 다시 쓰지 마세요. */
export function shownBid(base, p50, recAmt) {
  if (!(base > 0) || !(p50 > 0) || !(recAmt > 0)) return null
  const rate = c3(recAmt / (base * (p50 / 100)) * 100)
  return { rate, amt: bidAmount(base, p50, rate) }
}

/* q 를 주면 그 분위로 «고정»해 계산합니다 (공유 주소 `?q=80` 용).
   ⚠️ 규칙은 quantileBid 하나만 씁니다 — 여기서 다시 적으면 바로투찰 화면과 어긋납니다. */
/* ── 마감 판정 — 공고 탭(LiveBoard)과 바로투찰 첫 화면(MyToday)이 같이 씁니다 (2026-09-06)
   전에는 LiveBoard 안에만 있었습니다. 두 화면이 «넣을 수 있는 공고» 를 따로 정하면
   같은 공고가 한쪽엔 뜨고 한쪽엔 안 뜨는 일이 조용히 생깁니다. */
export const stamp14 = (v) => String(v || '').replace(/[^0-9]/g, '').padEnd(14, '0')
export function nowStamp() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}` +
         `${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
}
/** 아직 마감 전이고, 계산에 필요한 값이 다 있는 공고만 «넣을 수 있는 공고» 입니다 */
export const canBid = (r, now) => !!r && stamp14(r.close) >= now && isReady(r)

export function quickBid(r, p50, q) {
  if (!r || !isReady(r) || !(p50 > 0)) return null
  const aKnown = r.ayn === 'N' || r.aval > 0
  const aVal = r.ayn === 'N' ? 0 : (Number(r.aval) || 0)
  const lo = r.lo != null ? Number(r.lo) : -3
  const hi = r.hi != null ? Number(r.hi) : 3
  const sd = sjSigma(lo, hi, r.ptot, r.pdrw)
  const base = Number(r.base)
  /* ⚠️ 바로투찰 화면과 «같은 길»로 갑니다 — 금액 → 투찰률(소수 3자리, 올림) → 다시 금액 (shownBid).
     처음엔 recommend().amt 를 그대로 냈다가 selfcheck 에 잡혔습니다: 카드 408,999,841 vs 화면 409,002,195.
     예상 참가(enp)를 알면 공고별 자동 분위, 모르면 권장 — smartBid 하나로 (2026-09-03). */
  if (q) {
    const qb = quantileBid({ base, llRate: Number(r.llr), aVal, p50, sd, q: Number(q) })
    if (qb) return { ...qb, mode: 'pick', rule: null, pctile: Number(q), aKnown }
  }
  return smartBid({ base, llRate: Number(r.llr), aVal, aKnown, p50, sd, enp: Number(r.enp) || 0 })
}

/* ══════════════════════════════════════════════════════════════
   🎯 공고 고르기 — «예상 참가 · 이런 자리 1순위율 · 기대액» (2026-09-03)

   소장님: 「실격이 더 되더라도 1건이라도…」 → 실측 8,406건: 금액(사정률 분위)을 어떻게 잡아도
   1순위율은 3.5~4.4% 에서 안 움직였다. 움직이는 건 «참가업체수» 뿐 (2~9곳 18% · 100곳+ 1.6%).
   그래서 금액이 아니라 «어느 공고에 넣느냐» 를 돕는다.

   재료는 bidindex.json 에 collect.py 가 붙여 준다:
     r.enp   그 기관의 최근 개찰 참가업체수 중앙 (6건 이상일 때만, 아니면 0)   — «예상 참가»
     r.enpn  그 근거 건수
     idx.pick.tbl["s{규모}n{참가}"] = [건수, 1순위율%]  ← 개찰 저장소에서 권장 금액을 대본 실측
   여기서는 «표에서 칸을 찾아 주는 것» 만 한다. 표에 없는 칸(15건 미만)은 null — 없는 숫자를 만들지 않는다.
   ══════════════════════════════════════════════════════════════ */
export function pickBucket(v, edges) {
  for (let i = 0; i < edges.length; i++) if (v < edges[i]) return i
  return edges.length
}
export function pickOdds(r, pick, qbAmt) {
  if (!pick || !pick.tbl || !(r?.base > 0)) return null
  const enp = Number(r.enp) || 0
  if (!(enp > 0)) return { enp: 0, enpn: 0, rate: null, n: 0, ev: null, key: null }
  const key = `s${pickBucket(Number(r.base), pick.sz || [1e8, 3e8, 1e9])}n${pickBucket(enp, pick.nb || [10, 30, 100])}`
  const cell = pick.tbl[key]
  if (!cell) return { enp, enpn: Number(r.enpn) || 0, rate: null, n: 0, ev: null, key }
  const rate = cell[1]
  return { enp, enpn: Number(r.enpn) || 0, rate, n: cell[0], key,
           ev: qbAmt > 0 ? Math.round(qbAmt * rate / 100) : null }
}

/* ── «이 금액이면 실격이냐» 는 사정률이 나와 봐야 안다 (2026-09-03) ────────
   소장님: 「실제로 실격인지 아닌지는 모르는 거잖아? 결과를 봐야 알지.」 맞습니다.
   화면이 «이대로 넣으면 실격입니다» 라고 단정했는데, 그건 «사정률이 중앙값이면» 의 얘기였습니다.
   금액 M 은 고정이고 하한 L(s) 은 사정률 s 로 움직입니다. M ≥ L(s) ⇔ s ≤ s*.
   그래서 «통과가 되는 사정률 경계 s*» 와 «그 아래로 나올 확률» 을 같이 말합니다. */
export function breakEvenSj(base, llRate, aVal, amt) {
  if (!(base > 0) || !llRate || !(amt > 0)) return null
  const A = Number(aVal) || 0
  // (base·s/100 − A)·llr/100 + A ≤ M  →  s ≤ ((M − A)·100/llr + A) / base · 100
  return ((amt - A) * 100 / llRate + A) / base * 100
}
/** 표준정규 누적분포 — Abramowitz-Stegun 7.1.26 (오차 1.5e-7) */
export function normCdf(z) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z))
  const d = 0.3989423 * Math.exp(-z * z / 2)
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
  return z >= 0 ? 1 - p : p
}
/** 이 금액이 하한을 넘길 확률 (사정률이 s* 아래로 나올 확률) — 0~1, 계산 불가면 null */
export function passProb({ base, llRate, aVal, amt, p50, sd }) {
  const s = breakEvenSj(base, llRate, aVal, amt)
  if (s == null || !(sd > 0) || !(p50 > 0)) return null
  return { sj: Math.round(s * 1000) / 1000, p: normCdf((s - p50) / sd) }
}

/* ══════════════════════════════════════════════════════════════
   순위 사다리로 «몇 위쯤인지» 좁히기 (2026-09-18)

   ⚠️ 이 규칙이 BaroBid.jsx 안에 적혀 있었습니다. 성적표(lib/성적표.js)도 같은 것이
      필요해져서, 두 곳에 같은 식을 적는 대신 여기 하나로 모읍니다.
      파이썬 쪽 짝은 tools/bidmath.py 의 rank_bracket 입니다 — 같은 답을 내야 합니다.

   ladder(rq) = [[등수, 금액], …] 열한 칸. 우리 금액이 어느 칸 사이에 떨어지는지 봅니다.
   ⚠️ 사다리에는 **하한 미만(실격) 투찰도 들어 있습니다.** 그건 등수 상대가 아니므로
      하한 아래 칸 수만큼 등수에서 뺍니다.
   ⚠️ 1순위(beat)면 사다리와 무관하게 1위입니다 — 하한을 넘기고 실제 1순위보다 낮으면
      정의상 1위입니다(사다리가 없는 옛 개찰에서 «모른다» 로 떨어지던 자리).
   돌려주는 것: [최소등수, 최대등수(모르면 null)] · 좁힐 수 없으면 null */
export function rankBracket(ladder, myAmt, limit = 0, beat = false) {
  if (beat) return [1, 1]
  const lad = (Array.isArray(ladder) ? ladder : [])
    .filter((x) => Array.isArray(x) && x[0] > 0 && x[1] > 0)
    .sort((x, y) => (x[0] - y[0]) || (x[1] - y[1]))
  if (!lad.length) return null
  const dqKnown = lad.reduce((m, x) => (x[1] < limit ? Math.max(m, x[0]) : m), 0)
  let lo = null, hi = null
  for (let i = 0; i < lad.length; i++) {
    if (myAmt >= lad[i][1]) { lo = lad[i][0]; hi = lad[i + 1] ? lad[i + 1][0] : null }
  }
  if (lo == null) lo = 1
  const rankLo = Math.max(2, lo - dqKnown)
  return [rankLo, hi == null ? null : Math.max(rankLo, hi - dqKnown)]
}

/* ── 분위 다이얼 (2026-09-03) — 소장님: 「분위를 고정하지 말고, 공고마다 선택하게. 실격이다 아니다는 확률로.」
   각 분위의 z 와, 8,406건 실측(권장과 같은 식, 여유 0%)의 실격률·1순위율.
   ⚠️ 실격률이 분위와 정확히 맞아떨어진다(50→49.8 · 75→25.0 · 95→4.0) — 사정률 정규분포 가정이 맞다는 뜻.
   1순위율은 어느 분위든 3.6~4.4% — 분위는 «얼마나 자주 살아남나» 를 정할 뿐, «얼마나 자주 이기나» 는 못 바꾼다.
   이 숫자를 다시 재면 여기만 고치면 된다(화면은 이 표를 그대로 읽는다). */
export const QTILES = [
  /* 소장님: 「25분위부터 넣어 주고, 확률로 말해 줘」 — 25·40 도 넣는다. 실격 74%·60% 라고 칸에 적는다. */
  { q: 25, z: -0.6745, dq: 74.3, win: 3.59 },
  { q: 40, z: -0.2533, dq: 59.8, win: 4.00 },
  { q: 50, z: 0,      dq: 49.8, win: 3.99 },
  { q: 60, z: 0.2533, dq: 40.1, win: 4.40 },
  { q: 70, z: 0.5244, dq: 29.8, win: 4.21 },
  { q: 80, z: 0.8416, dq: 20.3, win: 4.09 },
  { q: 90, z: 1.2816, dq: 9.8,  win: 3.70 },
  { q: 95, z: 1.6449, dq: 4.0,  win: 3.56 },
]
export const QTILE_N = 8406
/** 분위 q 로 낸 금액 (여유 0%) — 권장(75분위+0.3%)과 같은 길: 하한금액 → 투찰률 올림 → 금액 */
export function quantileBid({ base, llRate, aVal, p50, sd, q }) {
  const t = QTILES.find((x) => x.q === q)
  if (!t || !(base > 0) || !llRate || !(sd > 0) || !(p50 > 0)) return null
  const sj = Math.round((p50 + t.z * sd) * 1000) / 1000
  const amt = Math.ceil(limitAmount(base, sj, llRate, aVal))
  return { q, sj, amt, ...shownBid(base, p50, amt) }
}

/* ── 공고별 자동 분위 (2026-09-03) ──────────────────────────────────────────
   소장님: 「하나로 고정하면 안 되잖아. 과거자료로 공고별로 분위를 다르게 해주고 설명도. 원클릭 가능하게.」
   8,406건을 «예상 참가»(기관 최근 개찰 참가업체수 중앙) 묶음별로 분위를 훑었다:
     참가 2~9곳   (638건)  80분위 22.1%(실격 13.3%)  vs 권장 18.2%(실격 7.8%)   ← 낮춰도 실격이 덜 늘고 더 이긴다
     참가 10~29곳 (1,213건) 60분위 6.9%(실격 37.6%)  vs 권장 5.5%(실격 10.2%)  ← 이기긴 더 이기지만 실격이 4배
     참가 30곳+   (5,016건) 권장이 최고 또는 동률
   ⚠️ 차이는 2σ 안팎이다(638건에서 ±1.6%p). 확실한 우위가 아니라 «자료가 그쪽을 가리킨다» 수준.
      그래서 화면은 «왜 이 분위인지» 와 실측 숫자를 같이 적고, 권장으로 돌아갈 길을 둔다.
   예상 참가를 모르면(기관 6건 미만) 권장 그대로. */
/* ⚠️ 2026-09-14 — 「10~29곳 → 60분위」 규칙을 **뺐습니다.**
   60분위는 실격률 40%짜리인데, 예상 참가가 그 묶음을 제대로 맞히지도 못하면서 적용하고 있었습니다.
   개찰 2,061건을 짝지어 재봤습니다(과거 4,806건으로만 추정 → 그 뒤 개찰로 채점):

       지금 (기관만 추정 · 0·1묶음 자동)   실격 15.62% · 1순위  93건 · 1,296억
       추정을 아예 안 쓰고 늘 권장         실격 13.20% · 1순위 101건 · 1,313억   ← 지금 것이 이보다 나빴다
       새것 (면허+금액대 추정 · 0묶음만)    실격 13.39% · 1순위 106건 · 1,317억
       완벽히 예언했다면                  실격 18.92% · 1순위 114건 · 1,339억

   짝지어 세면 1순위 +13건(새것만 22 vs 지금만 9 · z=2.33), 실격 −46건(z=−6.38).
   **위험은 확실히 줄고 이기는 것도 줄지 않았습니다.**
   ⚠️ collect.py 의 PICK_AUTO 와 같이 고칠 것 — selfcheck 가 두 벌을 대조합니다. */
export const AUTO_RULE = [
  { maxNp: 10, q: 80, n: 638,  win: 22.1, dq: 13.3, recWin: 18.2, recDq: 7.8 },
]

/* 예상 참가를 «무엇을 보고» 짐작했나 — collect.py 의 ENP_BASIS 와 같은 말입니다.
   화면이 「이 기관 12건의 중앙」 처럼 근거를 밝히기 위한 것입니다. */
export const ENP_BASIS = {
  ls: '이 면허·이 금액대',
  l: '이 면허',
  is: '이 기관·이 금액대',
  i: '이 기관',
}
export function enpWhy(r) {
  const k = ENP_BASIS[r?.enpb]
  const n = Number(r?.enpn) || 0
  if (!k || !n) return null
  return `${k} 개찰 ${n.toLocaleString()}건의 중앙`
}

/* ── ④ 담은 공고 합산 확률 (2026-09-14) ────────────────────────────
   소장님: 「한 건이라도 돼야 소문이 나지.」 한 공고의 1순위율은 몇 %뿐이지만
   여러 건에 넣으면 «적어도 한 건» 확률은 1 − ∏(1−p) 로 올라갑니다.
   ⚠️ 공고들이 서로 독립이라고 보고 셈합니다. 같은 기관·같은 날 공고는 붙어 움직일 수 있으니
      화면에 그 전제를 적습니다 — 없는 정확도를 주장하지 않습니다. */
export function atLeastOne(rates) {
  const ps = (rates || []).filter((x) => typeof x === 'number' && x > 0).map((x) => Math.min(x, 100) / 100)
  if (!ps.length) return null
  let none = 1
  for (const p of ps) none *= (1 - p)
  return { n: ps.length, p: (1 - none) * 100 }
}
export function autoRule(enp) {
  if (!(enp > 0)) return null
  return AUTO_RULE.find((r) => enp < r.maxNp) || null
}
/** 공고 한 줄이 «실제로 낼» 금액 — 예상 참가를 알면 자동 분위, 모르면 권장. 화면·원클릭·채점이 전부 이것 하나. */
export function smartBid({ base, llRate, aVal, aKnown, p50, sd, enp }) {
  const rule = autoRule(enp)
  if (rule) {
    const qb = quantileBid({ base, llRate, aVal, p50, sd, q: rule.q })
    if (qb) return { ...qb, mode: 'auto', rule, pctile: rule.q, aKnown }
  }
  const out = recommend({ base, llRate, aVal, aKnown, p50, sd })
  if (!out || !(out.amt > 0)) return null
  return { ...shownBid(base, p50, out.amt), sj: out.sj, mode: 'rec', rule: null, pctile: out.pctile, aKnown }
}

/* 적격심사 낙찰하한율 — **정의는 lib/engines.js 한 곳에만** 있습니다 (2026-09-14).
   여기서는 다시 내보내기만 합니다. 부르는 쪽(바로투찰·건설 도구)이 bidmath 를 쓰기 때문입니다.
   ⚠️ 2026-09-14 확인 — 이 규칙이 engines.js · BaroBid.jsx · NoticeDetail.jsx **세 곳에**
      따로 적혀 있었습니다. 값은 같았지만 한쪽만 고치면 조용히 어긋나는 자리였습니다.
   ⚠️ 공고서에 하한율이 적혀 있으면 그 값이 우선입니다 — 실측 6,212건 중 128건(2.1%)이
      규모 기준과 달랐고 최대 3.7%까지 차이 났습니다. */
export { lowerLimit } from './engines.js'
