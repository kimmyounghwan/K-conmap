/**
 * 🧭 개찰 복기 — 넣은 금액이 «왜» 그 자리였는지 글로 · 적어 둔 공고들의 «성향» (G499 · 2026-11-01)
 *
 * 소장님: 바로투찰 아이디어 「1부터 4까지 한 번에 만들어서 완벽하게 검증 후에 올리자」 — ③ 개찰 복기 코치
 *   «왜 떨어졌나: 사정률이 평소보다 높게 나왔고(상위 n%), 참가가 평소의 2배 …» 를 숫자로 말할 수 있는 것만.
 *
 * ■ «분위» 는 바로투찰과 같은 말입니다 — 금액 M 의 분위 = 사정률이 그 금액의 버팀 사정률(breakEvenSj) 아래로 나올 확률(%).
 *     p50 = 전국 사정률 가운데값(ov.sjq.p50) · σ = 그 공고 예가범위의 추첨 σ(sjSigma) — BaroBid.jsx 의 분위 칸과 같은 셈.
 *   이번 개찰의 «1순위 자리» = [실격선 분위, 1순위 금액 분위) — 그 사이에 넣었으면 1순위였음(하한 위 · 1순위보다 낮음).
 *     실격선 분위 = 실제 사정률의 분위(그 사정률에서 하한과 같은 금액의 분위) · 1순위 금액 분위 = 1순위 금액의 버팀 사정률 분위.
 * ■ 바로투찰 실측(QTILES)과 어긋나는 말을 하지 않습니다 — «분위를 내리면 더 이긴다» 고 하지 않음(1순위율은 어느 분위든 3.6~4.4%).
 *   분위는 «얼마나 자주 살아남나(실격)» 를 정하고, 이기는 몫은 참가 수가 더 크게 가름(참가 2~9곳 18.2% · 100곳 넘으면 1.6%).
 * ■ 순수 함수 — 시험 tools/시험_개찰복기.mjs (node_modules 없이 · PC 올리기 bat 에서도)
 */
import { breakEvenSj, normCdf, sjSigma, QTILES, P50_FALLBACK } from './bidmath.js'
import { lowerLimit } from './engines.js'

const 수 = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : Number(v) || 0)
const 반올림 = (v, n = 1) => Math.round(v * 10 ** n) / 10 ** n

/** 그 공고의 하한율 · A값 · 순공사원가 — 내성적(lib/넣은금액.js)과 같은 고름 */
export function 공고값(r) {
  const base = 수(r && r.base)
  let llr = 수(r && r.llr), 추정 = false
  if (!(llr > 0)) {
    const est = 수(r && r.est) || (base > 0 ? Math.round(base / 1.1) : 0)
    const ll = est > 0 ? lowerLimit(est) : null
    llr = ll && ll.rate ? ll.rate : 0
    추정 = true
  }
  const A = r && r.ayn === 'N' ? 0 : 수(r && r.aval)
  return { base, llr, A, pc: 수(r && r.pc), 추정, sd: sjSigma(r && r.lo != null ? r.lo : -3, r && r.hi != null ? r.hi : 3) }
}

/** 금액의 분위(0~100) — 바로투찰 분위 칸과 같은 뜻 · 셀 수 없으면 null */
export function 분위of({ base, llr, A = 0, pc = 0, amt, p50 = P50_FALLBACK, sd }) {
  const s = breakEvenSj(base, llr, A, amt, pc)
  if (s == null || !(sd > 0) || !(p50 > 0)) return null
  return Math.max(0, Math.min(100, normCdf((s - p50) / sd) * 100))
}

/** 사정률의 분위(0~100) — 그 사정률보다 낮게 나올 확률 */
export function 사정률분위(sj, p50 = P50_FALLBACK, sd) {
  if (!(sj > 0) || !(sd > 0)) return null
  return Math.max(0, Math.min(100, normCdf((sj - p50) / sd) * 100))
}

/**
 * 이번 개찰의 자리 — r: 개찰 줄(amt|sAmt · rate · base · lo · hi · llr · aval · ayn · pc · np · enp)
 * 돌려줌: { sj, 실격선, 일순끝, 폭, sd, p50 } (분위는 소수 1자리) 또는 null
 */
export function 개찰자리(r, p50 = P50_FALLBACK) {
  const v = 공고값(r)
  const amt1 = 수(r && (r.sAmt || r.amt)), rate = 수(r && r.rate)
  if (!(v.base > 0) || !(amt1 > 0) || !(rate > 50 && rate < 110) || !(v.llr > 0) || !(v.sd > 0)) return null
  const 예정 = amt1 / (rate / 100)
  const sj = (예정 / v.base) * 100
  const 실격선 = 사정률분위(sj, p50, v.sd)
  const 일순끝 = 분위of({ base: v.base, llr: v.llr, A: v.A, pc: v.pc, amt: amt1, p50, sd: v.sd })
  if (실격선 == null || 일순끝 == null) return null
  /* 1순위 금액은 하한 위였음 — 반올림 · A값 차이로 일순끝이 실격선보다 조금 낮게 나오면 같게 */
  const 끝 = Math.max(실격선, 일순끝)
  return { sj: 반올림(sj, 3), 실격선: 반올림(실격선), 일순끝: 반올림(끝), 폭: 반올림(끝 - 실격선), sd: v.sd, p50 }
}

/** 실측 표(QTILES)로 그 분위의 실격률(%) 어림 — 사이 값은 곧게 이음 · 25 아래는 100 − 분위 · 95 위는 끝값 */
export function 실격률어림(q) {
  if (!(q >= 0)) return null
  const t = QTILES
  if (q <= t[0].q) return Math.max(t[0].dq, 100 - q)   // 25분위 아래 — 실측 표가 «100 − 분위» 와 거의 같으므로(25→74.3 · 50→49.8 · 95→4.0) 그 식으로
  for (let i = 1; i < t.length; i++) {
    if (q <= t[i].q) { const a = t[i - 1], b = t[i]; return a.dq + (b.dq - a.dq) * ((q - a.q) / (b.q - a.q)) }
  }
  return t[t.length - 1].dq
}

const 분 = (q) => (q >= 99.5 ? '99분위 넘는' : q < 0.5 ? '1분위 아래' : `${Math.round(q)}분위`)
const 퍼 = (v) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(2)}%p`

/**
 * 복기 — 성(내성적 결과) · r(개찰 줄) · 내 금액 · p50 · 기관(기관사정률: {med, n, c}) 선택
 * 돌려줌: { 자리, 내분위, 줄들: [{k: '사정률'|'자리'|'참가'|'배움', 글}], 요약 } 또는 null
 */
export function 복기(성, r, 내금액, p50 = P50_FALLBACK, 기관 = null) {
  if (!성 || 성.상태 === '모름') return null
  const 자리 = 개찰자리(r, p50)
  if (!자리) return null
  const v = 공고값(r)
  const 내분위 = 분위of({ base: v.base, llr: v.llr, A: v.A, pc: v.pc, amt: 수(내금액), p50, sd: v.sd })
  if (내분위 == null) return null
  const 줄들 = []
  /* ① 사정률 — 전국 가운데 · 이 기관 평소와 견줌 */
  const 높낮 = 자리.sj - p50
  const 위몇 = 100 - 자리.실격선
  let 사 = `이번 사정률 ${자리.sj.toFixed(3)}% — 전국 가운데(${p50.toFixed(3)}%)보다 ${퍼(높낮)}`
  사 += 자리.실격선 >= 70 ? ` · 100번 중 ${Math.round(위몇)}번만 이보다 높게 나오는 «높은 쪽»` : 자리.실격선 <= 30 ? ` · 100번 중 ${Math.round(자리.실격선)}번만 이보다 낮게 나오는 «낮은 쪽»` : ` · 보통 나오는 범위(100번 중 ${Math.round(위몇)}번은 이보다 높음)`
  if (기관 && 수(기관.med) > 0 && 수(기관.n) >= 3) {
    const d = 자리.sj - 수(기관.med)
    사 += ` · 이 기관 평소(${수(기관.n)}건 가운데 ${수(기관.med).toFixed(3)}%)보다 ${퍼(d)}`
  }
  줄들.push({ k: '사정률', 글: 사 })
  /* ② 자리 — 내 분위 vs 1순위 자리 */
  const 자리글 = 자리.폭 < 0.05 ? `${분(자리.실격선)} 바로 그 자리` : `${분(자리.실격선)} ~ ${분(자리.일순끝)}`
  let 내 = `내 금액은 ${분(내분위)} 자리 · 이번 «1순위 자리» 는 ${자리글}`
  if (성.상태 === '실격') 내 += ` — 실격선(${분(자리.실격선)})보다 ${Math.max(1, Math.round(자리.실격선 - 내분위))}분위 낮았습니다`
  else if (성.상태 === '통과') 내 += ` — 1순위 자리보다 ${Math.max(1, Math.round(내분위 - 자리.일순끝))}분위 높았습니다`
  else 내 += ' — 그 안에 들어갔습니다'
  줄들.push({ k: '자리', 글: 내 })
  /* ③ 참가 — 예상 참가 · 1순위 자리 폭 */
  const np = 수(r && r.np), enp = 수(r && r.enp)
  if (np > 0) {
    let 참 = `참가 ${np.toLocaleString('ko-KR')}곳`
    if (enp > 0) {
      const 배 = np / enp
      참 += ` · 예상 ${enp.toLocaleString('ko-KR')}곳의 ${배 >= 1.25 ? `${배.toFixed(1)}배(많았음)` : 배 <= 0.8 ? `${배.toFixed(1)}배(적었음)` : '비슷'}`
    }
    참 += ` · 1순위 자리 폭 ${자리.폭 < 0.05 ? '0.1분위 안' : `${자리.폭.toFixed(1)}분위`} — 참가가 많을수록 이 폭이 좁아집니다`
    줄들.push({ k: '참가', 글: 참 })
  }
  /* ④ 배움 — 실측과 같은 말만 */
  const 실 = 실격률어림(내분위)
  let 배 = ''
  if (성.상태 === '실격') {
    배 = `실격은 사정률이 ${자리.실격선 >= 70 ? '높게' : '평소대로'} 나와 하한이 내 금액 위로 올라간 탓입니다. ${분(내분위)}는 실측으로 ${실 != null ? `${Math.round(실)}%` : '꽤 자주'} 실격되는 자리 — 실격을 줄이려면 권장(75분위) 쪽으로 올리면 됩니다(1순위율은 어느 분위든 3.6~4.4% 로 거의 같음).`
  } else if (성.상태 === '통과') {
    배 = `밀림 — 나보다 낮게 쓴 곳이 하한 위에 있었습니다. 분위를 낮춰도 1순위율은 거의 같고(3.6~4.4%) 실격만 늘어납니다. 이기는 몫은 참가 수가 더 크게 가릅니다(참가 2~9곳 18.2% · 100곳 넘으면 1.6%).`
  } else {
    배 = `🏆 하한 위 · 1순위 금액 아래 — 1순위 자리 안이었습니다.${실 != null ? ` ${분(내분위)}는 실측 실격 ${Math.round(실)}% 자리였습니다.` : ''}`
  }
  줄들.push({ k: '배움', 글: 배 })
  return { 자리, 내분위: 반올림(내분위), 줄들, 요약: { s: 성.상태, q: 반올림(내분위), lo: 자리.실격선, hi: 자리.일순끝 } }
}

/**
 * 성향 — 적어 둔 줄들(o: {s, q?}) 중 분위를 아는 것으로
 * 돌려줌: { n, 평균, 실격, 일순, 밀림, 실측실격, 말 } 또는 null(3건 미만)
 */
export function 성향(줄들) {
  const 들 = (줄들 || []).map((x) => x && x.o).filter((o) => o && typeof o.q === 'number' && ['실격', '통과', '일순', '같음'].includes(o.s))
  if (들.length < 3) return null
  const n = 들.length
  const 평균 = 들.reduce((a, o) => a + o.q, 0) / n
  const 실격 = 들.filter((o) => o.s === '실격').length
  const 일순 = 들.filter((o) => o.s === '일순' || o.s === '같음').length
  const 밀림 = n - 실격 - 일순
  const 실측실격 = 실격률어림(평균)
  const 내실격 = (실격 / n) * 100
  let 말
  if (평균 < 45) 말 = `낮은 자리에 넣는 편(평균 ${분(평균)}) — 실측으로 이 자리는 ${Math.round(실측실격)}% 실격. 1순위율은 분위와 거의 무관하니 실격을 줄이려면 권장(75분위) 쪽으로.`
  else if (평균 > 85) 말 = `높은 자리에 넣는 편(평균 ${분(평균)}) — 실격은 적지만(실측 ${Math.round(실측실격)}%) 1순위율은 분위와 거의 같습니다. 참가가 적은 공고를 고르는 것이 몫을 더 키웁니다.`
  else 말 = `가운데 자리(평균 ${분(평균)}) — 실측 실격 ${Math.round(실측실격)}% 자리. 1순위율은 분위와 거의 같으니 참가가 적은 공고를 고르는 것이 몫을 더 키웁니다.`
  return { n, 평균: 반올림(평균), 실격, 일순, 밀림, 내실격: 반올림(내실격), 실측실격: 반올림(실측실격), 말 }
}
