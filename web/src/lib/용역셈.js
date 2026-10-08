/* 💰 용역 · 물품 바로투찰 셈 — G194d (2026-10-08)
 *
 * 소장님: 「물품이나 용역은 계산 방법이 다르다고 했잖아 그럼 공사처럼 설명을 해줘야지? 왜 이런지??
 *          그리고 바로입찰 버튼 이런게 있어야 클릭을 하지???」 → (안) → 「만들어 줘」
 *
 * ■ 셈 자체는 공사와 같은 식입니다(lib/bidmath.js 를 그대로 씀 — 같은 식을 두 곳에 적지 않음):
 *     예정가격 = 기초금액 × 사정률 · 낙찰하한 = (예정가격 − A값) × 하한율 + A값 · 사정률 흔들림 σ = 예가 범위 · 15개 중 4개
 * ■ 다른 것은 «재료» 입니다:
 *     ① 하한율 — 공사는 금액대 표, 용역 · 물품은 공고마다 다름 → 조달청이 공고에 적어 준 값(llr)만 씀(표로 짐작 안 함)
 *     ② 낙찰 방식 — 협상 · 수의시담은 가격으로 안 정해짐 → 단추 없음
 *     ③ 예정가격 — 복수예가(15개 중 추첨)만 사정률로 셈 · 단일예가 · 비예가는 안 셈
 *     ④ 사정률 가운데값 — 용역 · 물품 실측(svc.py sj_stats)이 30건 넘으면 그것, 아니면 공사 실측을 빌려 씀(화면에 밝힘)
 * ■ «셀 수 있나» 규칙은 svc.py calc_why 와 같습니다(tools/시험_용역셈.mjs 가 같은 사례로 둘을 맞춰 봄).
 * ■ 권장 금액도 «참고» — 화면은 «참고하시고, 투찰 금액은 직접 골라 주십시오» (소장님 「권장금액 참고 하라고 적어」)
 */
import { sjSigma, limitAmount, breakEvenSj, normCdf, recommend, SCEN_Z, P50_FALLBACK } from './bidmath.js'

export const 실측최소 = 30

/** 셀 수 있으면 '' · 아니면 까닭 열쇠 — svc.py calc_why 와 같은 차례 · 같은 말 */
export function 셈까닭(r) {
  if (!r) return '기초'
  const swin = String(r.swin || '')
  if (swin.includes('협상')) return '협상'
  if (swin.includes('시담')) return '시담'
  if (!String(r.pmth || '').includes('복수')) return '예가'
  const llr = Number(r.llr) || 0
  if (!(llr >= 60 && llr <= 100)) return '하한율'
  if (!(Number(r.base) > 0)) return '기초'
  if (r.lo == null || r.lo === '' || r.hi == null || r.hi === '') return '범위'
  return ''
}
export const 셈가능 = (r) => 셈까닭(r) === ''

/** 까닭 → 화면 말(짧은 꼬리표 · 펼친 설명) */
export const 까닭말 = {
  협상: { 짧게: '협상 계약', 길게: '협상에 의한 계약 — 제안서 점수로 낙찰자가 정해져 가격만으로 셀 수 없습니다.' },
  시담: { 짧게: '수의시담', 길게: '수의시담 — 한 곳과 가격을 협의하는 공고라 바로투찰이 없습니다.' },
  예가: { 짧게: '', 길게: '예정가격이 «복수예가»(15개 중 추첨)가 아니라(단일예가 · 비예가) 사정률로 셀 수 없습니다.' },
  하한율: { 짧게: '', 길게: '낙찰하한율이 공고에 없습니다(최저가 · 규격가격 동시입찰 등) — 하한 없이 가장 낮은 값이 정해지는 방식입니다.' },
  기초: { 짧게: '기초금액 공개 전', 길게: '기초금액 공개 전입니다 — 공개되면(보통 개찰 며칠 전) 바로투찰 단추가 생깁니다.' },
  범위: { 짧게: '', 길게: '예가 범위(±2% · ±3%)가 공고에 없어 사정률 흔들림을 정할 수 없습니다.' },
}

/** 사정률 가운데값 — 그 종류 실측(30건 넘을 때) 또는 공사 실측 */
export function 기준사정률(sj, 공사p50) {
  if (sj && Number(sj.n) >= 실측최소 && Number(sj.p50) > 0) return { p50: Number(sj.p50), 출처: '실측', n: Number(sj.n) }
  return { p50: Number(공사p50) > 0 ? Number(공사p50) : P50_FALLBACK, 출처: '공사', n: sj ? Number(sj.n) || 0 : 0 }
}

/** 공고 한 줄 → 셈 재료 (셀 수 없으면 null) */
export function 재료(r, p50) {
  if (!셈가능(r)) return null
  const base = Number(r.base), llRate = Number(r.llr)
  const lo = Number(r.lo), hi = Number(r.hi)
  const ptot = Number(r.ptot) || 15, pdrw = Number(r.pdrw) || 4
  const sd = sjSigma(lo, hi, ptot, pdrw)
  if (!(sd > 0)) return null
  const aKnown = r.ayn === 'N' || Number(r.aval) > 0
  const aVal = r.ayn === 'N' ? 0 : (Number(r.aval) || 0)
  return { base, llRate, aVal, aKnown, lo, hi, ptot, pdrw, sd, p50 }
}

/** 권장(참고) 금액 — 공사 바로투찰과 같은 식(recommend): A값을 알면 75분위 + 0.3% · 모르면 95분위 */
export function 참고금액(m) {
  if (!m) return null
  const rec = recommend({ base: m.base, llRate: m.llRate, aVal: m.aVal, aKnown: m.aKnown, p50: m.p50, sd: m.sd })
  if (!rec) return null
  return { ...rec, 통과: normCdf(((breakEvenSj(m.base, m.llRate, m.aVal, rec.amt) || 0) - m.p50) / m.sd) }
}

/** 분위 고르기 — q 분위 사정률에서의 하한금액(올림) · 하한을 넘길 확률 ≈ q% */
export const 분위들 = [50, 60, 70, 80, 90, 95]
const Z = { 50: 0, 60: 0.2533, 70: 0.5244, 80: 0.8416, 90: 1.2816, 95: 1.6449 }
export function 분위금액(m, q) {
  if (!m || Z[q] == null) return null
  const sj = Math.round((m.p50 + Z[q] * m.sd) * 1000) / 1000
  const amt = Math.ceil(limitAmount(m.base, sj, m.llRate, m.aVal))
  return { q, sj, amt, 통과: normCdf(Z[q]) }
}

/** 내가 넣은 금액 — 사정률이 몇 % 이하로 나오면 하한을 넘나 · 그 확률 */
export function 내금액(m, amt) {
  if (!m || !(amt > 0)) return null
  const s = breakEvenSj(m.base, m.llRate, m.aVal, amt)
  if (s == null) return null
  return { sj: Math.round(s * 1000) / 1000, 통과: normCdf((s - m.p50) / m.sd) }
}

/** 「사정률이 이 값이면 하한은 얼마」 — 그 공고 σ 로 5 ~ 95분위 열 자리 */
export function 하한표(m) {
  if (!m) return []
  return SCEN_Z.map(([q, z]) => {
    const sj = Math.round((m.p50 + z * m.sd) * 1000) / 1000
    return { q, sj, low: Math.ceil(limitAmount(m.base, sj, m.llRate, m.aVal)) }
  })
}

/** 카드 단추 → 계산기 주소(공고 값을 주소에 실어 보냄 — 카톡으로 보내도 그대로 열림) */
export function 계산주소(종류, r) {
  const p = new URLSearchParams()
  const 넣 = (k, v) => { if (v != null && v !== '') p.set(k, String(v)) }
  넣('no', r.no); 넣('ord', r.ord); 넣('n', r.name); 넣('i', r.inst); 넣('b', r.base); 넣('l', r.llr)
  넣('lo', r.lo); 넣('hi', r.hi); 넣('a', r.aval); 넣('ay', r.ayn); 넣('pt', r.ptot); 넣('pd', r.pdrw)
  넣('c', r.close); 넣('pm', r.pmth); 넣('sw', r.swin); 넣('u', r.url)
  return `/${종류}/calc?${p.toString()}`
}
/** 주소 → 공고 한 줄 */
export function 주소공고(search) {
  const p = new URLSearchParams(search || '')
  const g = (k) => p.get(k)
  const n = (k) => (p.get(k) == null || p.get(k) === '' ? null : Number(p.get(k)))
  if (!g('b') && !g('no')) return null
  return { no: g('no'), ord: g('ord'), name: g('n'), inst: g('i'), base: n('b'), llr: n('l'), lo: n('lo'), hi: n('hi'),
    aval: n('a'), ayn: g('ay'), ptot: n('pt'), pdrw: n('pd'), close: g('c'), pmth: g('pm') || '복수예가', swin: g('sw') || '', url: g('u') }
}
