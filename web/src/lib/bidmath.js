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
