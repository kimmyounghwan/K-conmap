/* ============================================================
   분석 엔진 — 기존 app.py 의 판정 기준을 그대로 옮긴 것

   원본: engine_bid_calculator / engine_zoom / engine_bid_score
   점수 구간, 등급 경계, 가중치는 임의로 바꾸지 않았습니다.
   (숫자를 바꾸면 지금까지 쌓인 감각과 어긋나기 때문)
   ============================================================ */

const floorTo = (v, unit, dec) => Number((Math.floor(v / unit) * unit).toFixed(dec))

/* ── 낙찰하한율 (조달청 일반공사 적격심사) ────
   추정가격 기준입니다. 기초금액이 아니라 추정가격이라는 점이 중요합니다.
   ------------------------------------------------ */
export function lowerLimit(estimate) {
  if (!estimate) return null
  const eok = estimate / 1e8
  if (eok >= 100) return { rate: null, note: '100억 이상 — 종합심사(별도 기준)' }
  if (eok >= 50) return { rate: 87.495, note: '추정가격 50억~100억' }
  if (eok >= 10) return { rate: 88.745, note: '추정가격 10억~50억' }
  return { rate: 89.745, note: '추정가격 10억 미만' }
}

/* ── 투찰가 계산기 ─────────────────────────────
   0.1% 단위 최다발생 구간(핫존)을 찾고, 그 안에서 0.01% 단위로 좁힌다.

   [2026-09 정밀도 보강]
   예전에는 «기초금액 × 투찰률» 로 금액을 냈습니다. 이게 틀렸습니다.
   투찰률은 기초금액이 아니라 «예정가격» 에 대한 비율이기 때문입니다.

       예정가격 = 기초금액 × 사정률
       투찰금액 = (예정가격 − A값) × 투찰률 + A값

   실제 개찰 450건으로 확인해 보니 옛 방식은 평균 0.071%,
   많게는 2.136% 까지 금액이 높게 나왔습니다.
   10억 공사에서 2%면 2천만원입니다 — 입찰에서는 치명적인 차이입니다.

   그리고 끝수를 내림(floor)에서 올림(ceil)으로 바꿨습니다.
   낙찰하한율에 딱 맞춰 넣을 때 내림을 하면 하한 아래로 떨어져 실격됩니다.
   ------------------------------------------------ */
export function bidCalculator(agency, basePrice, opts = {}) {
  if (!agency || !agency.h1 || !agency.h1.length) return null

  const aVal = Number(opts.aVal) || 0
  const sj = Number(opts.sj) || 100                 // 사정률 (가운데값)
  const sjLo = Number(opts.sjLo) || sj
  const sjHi = Number(opts.sjHi) || sj
  const sjSrc = opts.sjSrc || '기본값 100%'

  /** 투찰금액 — 사정률과 A값을 반영한 실제 식 */
  const P = (rate, sajeong = sj) => {
    if (!(basePrice > 0) || !(rate > 0)) return 0
    const yeje = basePrice * (sajeong / 100)
    return Math.ceil((yeje - aVal) * (rate / 100) + aVal)
  }

  const h1 = [...agency.h1].sort((a, b) => b[1] - a[1])
  const bestRate = h1[0][0]
  const s = agency.s || {}

  // 핫존 안 0.01% 정밀 구간
  const lower = Number(bestRate.toFixed(1))
  const upper = Number((lower + 0.1).toFixed(1))
  const inZone = (agency.h01 || []).filter(([r]) => r >= lower && r < upper)
  inZone.sort((a, b) => b[1] - a[1])
  const zoom = inZone.length
    ? {
        best: inZone[0][0],
        price: P(inZone[0][0]),
        band: { lo: P(inZone[0][0], sjLo), hi: P(inZone[0][0], sjHi) },
        rows: inZone.slice(0, 8),
        total: inZone.reduce((a, b) => a + b[1], 0),
        lower, upper,
      }
    : null

  const totalZone = h1.reduce((a, b) => a + b[1], 0)
  const estimate = basePrice > 0 ? Math.round(basePrice / 1.1) : 0
  const ll = lowerLimit(estimate)

  return {
    total: agency.n,
    bestRate,
    recommended: P(bestRate),
    band: { lo: P(bestRate, sjLo), hi: P(bestRate, sjHi) },
    share: totalZone ? Math.round((h1[0][1] / totalZone) * 1000) / 10 : 0,
    avgRate: s.avg,
    medRate: s.med,
    avgPrice: P(s.avg),
    medPrice: P(s.med),
    top: h1.slice(0, 6),
    zoom,

    // 정밀도 보강분
    sj, sjLo, sjHi, sjSrc,
    aVal,
    estimate,
    yeje: basePrice > 0 ? Math.round(basePrice * (sj / 100)) : 0,
    limit: ll,
    // 하한 미달 경고 — 추천 투찰률이 낙찰하한율보다 낮으면 실격
    belowLimit: !!(ll && ll.rate && bestRate < ll.rate),
    limitPrice: ll && ll.rate ? P(ll.rate) : 0,
    // 표본이 적으면 그대로 믿으면 안 됩니다
    thin: (agency.n || 0) < 10,
  }
}

/* ── 낙찰스코어 ────────────────────────────────
   100점 = 핫존 30 + 경쟁 20 + 유사공고 20 + 안정성 15 + 데이터량 15
   ------------------------------------------------ */
export function bidScore({ agency, myRate, basePrice, similar, aVal = 0, sj = 100 }) {
  if (!agency || !agency.h1 || !agency.h1.length || !myRate) return null

  const h1 = [...agency.h1].sort((a, b) => b[1] - a[1])
  const bestRate01 = h1[0][0]
  const totalZone = h1.reduce((a, b) => a + b[1], 0)
  const s = agency.s || {}
  const totalData = agency.n || 0
  const stdRate = s.std ?? 99

  // 1. 핫존 일치도 (30점)
  const dist = Math.abs(myRate - bestRate01)
  const scoreHot =
    dist <= 0.05 ? 30 : dist <= 0.1 ? 25 : dist <= 0.2 ? 18 : dist <= 0.5 ? 10 : dist <= 1.0 ? 4 : 0

  const myZone = floorTo(myRate, 0.1, 1)
  const myZoneHit = h1.find(([r]) => r === myZone)
  const hotZonePct = totalZone ? ((myZoneHit ? myZoneHit[1] : 0) / totalZone) * 100 : 0

  // 2. 경쟁 강도 (20점) — 독식 업체 점유율이 높을수록 불리
  const mono = agency.mono || 0
  const scoreComp = mono >= 60 ? 2 : mono >= 40 ? 7 : mono >= 25 ? 13 : mono >= 15 ? 17 : 20

  // 3. 유사공고 적중 (20점)
  let scoreSim = 0
  if (similar && similar.zone !== undefined && similar.zone !== null) {
    const sd = Math.abs(myRate - similar.zone)
    scoreSim = sd <= 0.05 ? 20 : sd <= 0.1 ? 16 : sd <= 0.2 ? 10 : sd <= 0.5 ? 5 : 0
  }

  // 4. 투찰률 안정성 (15점) — 기관의 투찰률이 좁게 모여 있을수록 유리
  const scoreStab =
    stdRate <= 0.3 ? 15 : stdRate <= 0.5 ? 12 : stdRate <= 0.8 ? 8 : stdRate <= 1.2 ? 4 : 1

  // 5. 데이터 충분성 (15점)
  const scoreData =
    totalData >= 100 ? 15 : totalData >= 50 ? 12 : totalData >= 20 ? 8 : totalData >= 10 ? 4 : 1

  const total = scoreHot + scoreComp + scoreSim + scoreStab + scoreData
  const g = gradeOf(total, bestRate01)

  // 금액은 계산기와 같은 식을 씁니다 — (기초금액 × 사정률 − A) × 투찰률 + A
  const P = (r) => {
    if (!(basePrice > 0) || !(r > 0)) return 0
    const yeje = basePrice * ((Number(sj) || 100) / 100)
    const a = Number(aVal) || 0
    return Math.ceil((yeje - a) * (r / 100) + a)
  }
  return {
    total,
    ...g,
    items: [
      { name: '핫존 일치도', score: scoreHot, max: 30 },
      { name: '경쟁 강도', score: scoreComp, max: 20 },
      { name: '유사공고 적중', score: scoreSim, max: 20 },
      { name: '투찰률 안정성', score: scoreStab, max: 15 },
      { name: '데이터 충분성', score: scoreData, max: 15 },
    ],
    totalData,
    avgRate: s.avg,
    stdRate,
    bestRate01,
    hotZonePct: Math.round(hotZonePct * 10) / 10,
    mono,
    topCorp: agency.corps && agency.corps.length ? agency.corps[0][0] : '-',
    similar,
    myBidPrice: P(myRate),
    bestBidPrice: P(bestRate01),
  }
}

function gradeOf(total, best) {
  if (total >= 85)
    return {
      grade: 'S', label: 'S등급 — 최상위 낙찰 확률', color: '#b45309',
      bg: 'linear-gradient(135deg,#78350f,#b45309)', prob: '75~90%',
      advice: [
        '현재 투찰률이 발주기관 핫존과 매우 정확하게 일치합니다.',
        '경쟁 구도도 열려 있어 특정 독식 업체의 위협이 낮습니다.',
        '유사공고 낙찰 패턴과도 높은 일치도를 보입니다.',
        '현재 투찰가를 유지하거나 ±0.03% 이내로만 미세조정하세요.',
      ],
    }
  if (total >= 70)
    return {
      grade: 'A', label: 'A등급 — 높은 낙찰 가능성', color: '#047857',
      bg: 'linear-gradient(135deg,#064e3b,#047857)', prob: '55~75%',
      advice: [
        '투찰률이 핫존에 근접해 경쟁력이 충분합니다.',
        `최다발생 구간(${best}%)과의 거리를 좁히면 S등급 진입이 가능합니다.`,
        '유사공고 분석도 긍정적인 신호를 보이고 있습니다.',
        '핫존 중심까지 약간의 미세조정 여지가 있습니다.',
      ],
    }
  if (total >= 55)
    return {
      grade: 'B', label: 'B등급 — 보통 수준', color: '#1d4ed8',
      bg: 'linear-gradient(135deg,#1e3a8a,#1d4ed8)', prob: '35~55%',
      advice: [
        '투찰률이 핫존에서 다소 벗어나 있습니다.',
        `발주기관 최다발생 구간 ${best}% 방향으로 조정을 검토하세요.`,
        '경쟁업체 분포와 유사공고 패턴을 다시 확인해보세요.',
        '투찰가 계산기의 0.01% 정밀 분석을 함께 돌려보세요.',
      ],
    }
  if (total >= 40)
    return {
      grade: 'C', label: 'C등급 — 낙찰 가능성 낮음', color: '#c2410c',
      bg: 'linear-gradient(135deg,#7c2d12,#c2410c)', prob: '15~35%',
      advice: [
        '현재 투찰률은 이 기관의 낙찰 집중 구간과 거리가 있습니다.',
        `핫존(${best}%)과 비교해 투찰가 재검토가 필요합니다.`,
        '독식 업체가 있는지 경쟁 강도 항목을 확인하세요.',
        '투찰가 계산기의 0.01% 돋보기 분석을 활용하세요.',
      ],
    }
  return {
    grade: 'D', label: 'D등급 — 낙찰 가능성 매우 낮음', color: '#b91c1c',
    bg: 'linear-gradient(135deg,#450a0a,#b91c1c)', prob: '5~15%',
    advice: [
      '현재 투찰률이 발주기관 낙찰 패턴과 크게 벗어나 있습니다.',
      `발주기관 핫존(${best}%) 기준으로 투찰가를 전면 재검토하세요.`,
      '독식 업체가 있는 경우 전략적 판단이 필요합니다.',
      '투찰가 계산기를 먼저 실행해 추천 투찰가부터 확인하세요.',
    ],
  }
}

/* ── 기관 성향 한 줄 요약 ────────────────────── */
export function agencySummary(a) {
  if (!a) return null
  const s = a.s || {}
  const h1 = [...(a.h1 || [])].sort((x, y) => y[1] - x[1])
  const best = h1.length ? h1[0][0] : null
  const totalZone = h1.reduce((x, y) => x + y[1], 0)
  const share = totalZone && h1.length ? Math.round((h1[0][1] / totalZone) * 100) : 0

  const tight = s.std <= 0.3 ? '매우 좁음' : s.std <= 0.5 ? '좁음' : s.std <= 1.2 ? '보통' : '넓음'
  const monoTxt =
    a.mono >= 60 ? '특정 업체 독식이 강함'
      : a.mono >= 40 ? '독식 경향 있음'
        : a.mono >= 25 ? '일부 편중'
          : '고르게 분산'

  const peak = a.m ? a.m.indexOf(Math.max(...a.m)) + 1 : null
  return { best, share, tight, monoTxt, peak, avg: s.avg, std: s.std }
}
