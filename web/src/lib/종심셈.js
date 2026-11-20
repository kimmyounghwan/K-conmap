/* 🏛 G804 (2026-11-20) 종합심사낙찰제(종심제) · 지방 종합평가 — 갈래 · 배점 · 균형가격 · 가격점수
 *   소장님 「바로투찰이 계산하지 않는다고 하는데, 100억 이상도 해야 하지 않아?」 → 기획서 → 「다섯가지 다 하자」 → 「바로투찰 작업해줘」
 *   근거(크롬으로 세 번 · notes/종심제_원문.txt):
 *     · 계약예규 «공사계약 종합심사낙찰제 심사기준»(재정경제부 계약예규 제168호 · 2026.8.25.) 제8조 · [별표 3] 1.(가격점수 식)
 *     · 조달청 «공사계약 종합심사낙찰제 심사세부기준»(조달청지침 제4497호 · 시행 2026.9.8.) 제7조 · [별표 1-1 ~ 1-5](배점) · [별표 4](A = B = 1.0 원칙)
 *     · 행정안전부 예규 «지방자치단체 입찰시 낙찰자 결정기준»(제393호 · 시행 2026.11.2.) 제3장 — 종합평가는 위 둘을 «준용» · 입찰가격 배점 50 / 40 / 35
 *   ⚠️ kcm_rules.py 의 종심갈래 · 균형가격 · 종심가격점수 와 같은 셈 — tools/종심셈_표.json 을 시험_종심셈.py · .mjs 가 같이 봅니다(한쪽만 고치면 시험이 깨짐).
 *   ⚠️ 공개 자료(업체별 투찰금액)로는 «예정가격 초과 · 70% 미만 · 3인 이상 같은 금액» 만 뺄 수 있습니다 — 내역서 불일치 · 노무비 80% ·
 *      997/1000 같은 빼기는 몰라서 «건설맵이 공개 금액으로 다시 셈 — 근사값» 입니다(화면에도 그렇게 적음).
 */

/** 낙찰방법 글(공고 sucsfbidMthdNm) · 추정가격 → [갈래, 가격 배점] · 종심제 · 종합평가가 아니면 null
 *  조달청 [별표 1-1] 일반 50 · [1-2] 고난도 50 · [1-3] 실적제한 300억 이상 50 · [1-4] 실적제한 300억 미만 60 · [1-5] 간이형 60
 *  지방 종합평가 입찰가격 300억 이상 500억 미만 50 · 500억 이상 1000억 미만 40 · 1000억 이상 35 */
export function 종심갈래(swin, est) {
  const s = String(swin || '').replace(/\s+/g, '')
  if (!s) return null
  if (s.includes('종합평가') && !s.includes('종합심사')) {
    const e = Number(est) || 0
    if (e >= 1e11) return ['지방종평', 35]
    if (e >= 5e10) return ['지방종평', 40]
    return ['지방종평', 50]
  }
  if (!s.includes('종합심사')) return null
  if (s.includes('간이형')) return ['간이형', 60]
  if (s.includes('고난')) return ['고난도', 50]
  if (s.includes('실적제한')) return ['실적제한', s.includes('300억원미만') ? 60 : 50]
  if (s.includes('일반공사')) return ['일반', 50]
  return ['종심', 50]              /* 글이 낯설면(공기업 등) 일반과 같게 — 화면은 «공고의 배점 확인» 을 띄움 */
}

/** 예규 제8조 · 조달청 세부기준 제7조 — 공개된 업체별 투찰금액으로 균형가격 다시 셈(근사)
 *  ① 예정가격 초과 · 70% 미만 뺌(예정가격을 알 때) ② 3인 이상 같은 금액은 1개만(같은금액 = true — 2026.8.25. 신설 · 조달청 제4497호)
 *  ③ 남은 개수 n: 20개 초과 → 위 20% · 아래 20% / 10~20개 → 위 40% · 아래 10% / 10개 미만 → 위 50% + 맨 아래 1개(2개면 안 뺌)
 *     · 빼는 개수의 소수점 버림(제7조⑥) · 같은 금액이 경계에 걸려도 «개수만큼» 만 뺌(제7조②4)
 *  ④ 남은 금액 산술평균 · 원 아래 버림(남은 것이 1개면 그 금액)
 *  돌려줌: { bal, n0, n1, n, 위, 아래, 같은 } · 금액이 없으면 null
 *  ⚠️ 큰 금액 합(수백 건 × 수백억)도 Number 로 정확(2^53 ≈ 9천조 안) — 평균은 Math.floor */
export function 균형가격(금액들, 예정가격 = 0, 같은금액 = true) {
  let a = []
  for (const x of 금액들 || []) {
    const v = Math.trunc(Number(x))
    if (Number.isFinite(v) && v > 0) a.push(v)
  }
  const n0 = a.length
  const p = Math.trunc(Number(예정가격)) || 0
  if (p > 0) a = a.filter((v) => v <= p && v * 100 >= p * 70)
  const n1 = a.length
  let 같은 = 0
  if (같은금액 && a.length) {
    const 수 = new Map()
    for (const v of a) 수.set(v, (수.get(v) || 0) + 1)
    const 본 = new Set()
    const b = []
    for (const v of a) {
      if (수.get(v) >= 3) {
        if (본.has(v)) continue
        본.add(v)
        같은++
      }
      b.push(v)
    }
    a = b
  }
  const n = a.length
  if (!n) return null
  a.sort((x, y) => x - y)
  let 위, 아래
  if (n > 20) { 위 = Math.floor((n * 20) / 100); 아래 = 위 }
  else if (n >= 10) { 위 = Math.floor((n * 40) / 100); 아래 = Math.floor((n * 10) / 100) }
  else if (n <= 2) { 위 = 0; 아래 = 0 }
  else { 위 = Math.floor((n * 50) / 100); 아래 = 1 }
  let 남 = a.slice(아래, n - 위)
  if (!남.length) 남 = a
  const 합 = 남.reduce((s, v) => s + v, 0)
  return { bal: Math.floor(합 / 남.length), n0, n1, n, 위, 아래, 같은 }
}

/** [별표 3] 1. · 조달청 [별표 4] 1. — √(1 − 계수 × ((투찰 − 균형) ÷ (예정 − 균형))²) × 배점
 *  균형가격 이하 → A · 초과 → B(조달청 원칙 A = B = 1.0 · 공고에 다르게 적으면 그 값) · 제곱근 안이 음수면 0 · 소수 넷째자리에서 반올림(조달청 제11조②)
 *  예정가격이 균형가격보다 크지 않으면(셈 불가) null */
export function 종심가격점수(투찰, 균형, 예정, 배점, A = 1, B = 1) {
  const t = Number(투찰), g = Number(균형), y = Number(예정), s = Number(배점)
  if (![t, g, y, s].every(Number.isFinite) || !(y > g) || s <= 0) return null
  const k = Number(t <= g ? A : B)
  const x = (t - g) / (y - g)
  const 속 = 1 - k * x * x
  if (속 <= 0) return 0
  return Math.round((Math.sqrt(속) * s + 1e-12) * 1000) / 1000
}
