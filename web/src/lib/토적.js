/**
 * 🏔 토적컨맵 — 토적표 · 유토곡선(누가토량 곡선) · 토공유동표 · 운반집계 · 집계표 · 차수 비교 (G571 · 2026-11-06)
 *
 * 소장님: 「만들어 줘, 정확도 높여서」(매스커브 프로그램 광고를 보시고) · 「이름은 토적컨맵으로 하자」
 *         「유토곡선을 다른 말로 … 원래 쓰는 용어라면 그대로 쓰고」 → 유토곡선 그대로(화면에서 한 번 «누가토량 곡선» 으로 풂)
 *
 * ■ 부피(측점 줄마다 · 흙 칸마다)
 *   평균단면  V_k = (A_{k-1} + A_k) ÷ 2 × d_k   — 줄 k(뒤 측점)에 둠 · 첫 줄은 0
 *   지배거리  V_i = A_i × (d_i + d_{i+1}) ÷ 2    — 측점마다(설계사 토공집계 꼴: 단면 × 평균거리) · 합은 평균단면과 같음
 *   끝수: 줄마다 반올림(엑셀 ROUND 와 같게 — .5 는 0 에서 먼 쪽) 뒤 합. «안 버림» 도 고를 수 있음.
 *   변이점(평균단면만): 앞 측점 절토만 · 뒤 측점 성토만(또는 거꾸로)인 구간 → 0점 x0 = d·A1/(A1+A2) 에서 나눠
 *        절토 = A1·x0/2 · 성토 = A2·(d−x0)/2. 켜지 않으면 ⚠️ 로 «평균단면이 더 센 양» 만 알림.
 * ■ 보정(다짐 기준): 절토 칸마다 × C(줄마다 끝수) — 성토와 견줌. «유용 안 함» 절토 칸(뻘 · 표토 등)은 바로 사토(곡선에 안 넣음).
 *   횡방향 유용 = min(보정 절토(유용), 성토) — 줄마다(변이점으로 나눈 줄은 곡선이 옮김을 보이므로 0).
 *   차인 = 보정 절토(유용) − 성토 · 누가토량 = 차인 합.
 * ■ 유토곡선 점: (누가거리, 누가토량). 평균단면은 측점마다(+ 변이점), 지배거리는 측점 + 측점 사이 가운데(그 줄 부피가 그 사이에 고르게).
 *   «운반 못 건넘»(교량 · 터널 등) 측점에서 구간을 끊어 구간마다 따로 평형선.
 *   평형선: 시점 높이(기본) · 운반이 가장 적은 높이(∫|M−b|dx 최소 = 길이로 본 가운뎃값) · 직접.
 * ■ 높이 띠 셈(정확): 꼭짓점 높이마다 띠를 나누면 띠 안에서 곡선이 지나는 선분이 바뀌지 않으므로
 *   그 높이에서 «만나는 점» 을 왼쪽부터 짝지음 —
 *     평형선 위: 오름 → 내림 = 순방향 운반 · 오름 → 끝 = 사토 · 처음 → 내림 = 순성토
 *     평형선 아래: 내림 ← 오름 = 역방향 운반 · 내림 → 끝 = 순성토 · 처음 → 오름 = 사토
 *   운반토량 V = 띠 높이 합 · V×L = 띠 높이 × 짝 사이 거리(띠 안에서 곧은 줄 → 가운데 높이 값이 곧 평균) → 평균운반거리 = V×L ÷ V.
 *   토질별: 운반 · 사토 흙은 늘 «오름» 선분에서 나옴 → 그 줄 보정 절토(유용) 비례로 나눔.
 * ■ 검산: 보정 절토(유용) = 횡방향 + 종방향 + 사토(곡선) · 성토 = 횡방향 + 종방향 + 순성토
 * ■ 운반 띠(장비) 나눔(G574 · 2026-11-07 · 소장님께 말씀드린 차례 ② «한 운반 구간을 거리별 장비로»):
 *   «구간»(기본) — 마디(운반 구간)마다 평균운반거리로 띠 하나(한 구간 = 한 장비).
 *   «거리» — 한 마디도 높이 띠마다 실제 운반거리로 나눔. 높이 띠 안에서 운반거리는 높이에 곧게 바뀌므로(거lo → 거hi)
 *     띠 거리(까지)와 같아지는 높이에서 잘라 짧은 쪽 · 긴 쪽 장비에 나눔 — 어림 없음. 그 높이에 그은 가로선(길이 = 띠 거리)이
 *     «띠 거리선»(외국 매스커브의 free haul 선과 같은 꼴): 봉우리 쪽(짧은 운반)은 짧은 장비, 평형선 쪽(긴 운반)은 긴 장비.
 * ■ 사토장 · 토취장(G575 · 소장님께 말씀드린 차례 ③): 장마다 «진출입 측점»(길에서 나가는 곳 · 비우면 밖 거리만) + «밖 거리».
 *   흙마다(유토곡선 사토 · 순성토 = 높이 띠 기록마다 · 바로 사토 = 측점 줄 · 칸마다) 길 따라 평균 거리 + 밖 거리가 가장 짧은 곳으로.
 *   길 따라 평균 거리는 흙이 놓인 꼴 그대로(높이 띠 안은 고르게 · 평균단면은 두 단면 사이 곧게 · 지배거리는 그 측점 몫 고르게 — 평균거리) — 어림 없음.
 * ■ 토공 유동도(G576 · 차례 ④): 운반 몫마다 흙 무게중심 — 절c(깎는 곳) · 성c(쌓는 곳) = Σ(띠 높이 × 그 높이의 만나는 점) ÷ V.
 *   한 마디 안의 짝은 모두 같은 쪽(→ 또는 ←)이라 |성c − 절c| = 평균운반거리 L 이 그대로 맞음(화살표 길이 = L). 사토 · 순성토 묶음도 c.
 * ■ 시험: node tools/시험_토적.mjs
 */

const 작 = 1e-9

/** 칸 글 → 수(쉼표 · 띄어쓰기 · 앞 + 무시) · 못 읽으면 NaN */
export function 숫(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : NaN
  const s = String(v ?? '').replace(/[,\s]/g, '').replace(/^\+/, '')
  if (s === '' || s === '-' || s === '.') return NaN
  const n = Number(s)
  return Number.isFinite(n) ? n : NaN
}

/** 엑셀 ROUND 와 같은 반올림 — .5 는 0 에서 먼 쪽 · d < 0 이면 그대로.
 *  셈 찌꺼기: 2.675 × 100 = 267.49999999999997 처럼 «.5 에서 몇 ULP 안» 이면 .5 로 보고 올림(엑셀 2.68),
 *  77.644999999999882(엑셀이 27 − 20.7 = 6.2999999999999545 로 셈한 거리에서 나온 값)처럼 그보다 멀면 내림(엑셀 77.64 — 실제 설계 토공집계와 같음). */
export function 끝수(x, d) {
  if (!Number.isFinite(x)) return 0
  if (d === null || d === undefined || d === '' || Number(d) < 0) return x
  const k = Number(d), f = 10 ** k
  const p = Math.abs(x) * f
  let n = Math.floor(p)
  if (p - n >= 0.5 - 4 * Number.EPSILON * Math.max(1, p)) n += 1
  const v = Number((n / f).toFixed(k))
  return x < 0 ? -v : v
}

/** 화면 칸 글 + 가져온 원래 수(엑셀 셈 찌꺼기 그대로) — 글이 원래 수를 6자리로 줄인 것과 같으면 원래 수를 씀(설계 엑셀과 끝수까지 같게) */
export function 원수(글, 원) {
  if (typeof 원 === 'number' && Number.isFinite(원) && String(끝수(원, 6)) === String(글 ?? '').replace(/[,\s]/g, '')) return 원
  return 숫(글)
}
/** 가져올 때 — 6자리 넘는 찌꺼기 수는 화면엔 줄여 보이고 원래 수는 따로 둠 */
export function 칸수(v) {
  const n = 숫(v)
  if (!Number.isFinite(n)) return { 글: '' }
  const 글 = String(끝수(n, 6))
  return Number(글) === n ? { 글 } : { 글, 원: n }
}

/** 측점 글 → { m(누가거리), 꼴 } · 못 읽으면 null
 *  NO.12+5.5 · No 12 + 5.5 · 12+5.5 → 12 × 간격 + 5.5 / STA.1+020.5 · 1+020(더함 정수 세 자리) → 1,020.5 / 꼴 'm' → 그 수 */
export function 측점풀기(글, 간격 = 20, 꼴 = '자동') {
  const 처음 = String(글 ?? '').trim()
  if (!처음) return null
  let s = 처음.toUpperCase().replace(/\s+/g, '').replace(/＋/g, '+')
  let 머리 = ''
  const mh = s.match(/^(STA\.?|ST\.|NO\.?|N0\.?|KM)/)
  if (mh) { 머리 = mh[1].startsWith('N') ? '번호' : 'km'; s = s.slice(mh[1].length) }
  s = s.replace(/M$/, '')
  const m = s.match(/^(-?\d+(?:\.\d+)?)(?:([+-])(\d+(?:\.\d+)?))?$/)
  if (!m) return null
  const a = Number(m[1]), b = m[3] !== undefined ? (m[2] === '-' ? -1 : 1) * Number(m[3]) : 0
  const 셋자리 = m[3] !== undefined && /^\d{3}(?:\.|$)/.test(m[3])
  const 쓴 = 꼴 === '자동' || !꼴 ? (머리 || (셋자리 ? 'km' : '번호')) : 꼴
  if (쓴 === 'm') return { m: a + b, 꼴: 'm' }
  if (쓴 === 'km') return { m: a * 1000 + b, 꼴: 'km' }
  const g = 숫(간격) > 0 ? 숫(간격) : 20
  return { m: a * g + b, 꼴: '번호', 번: a, 더: b }
}

/** 누가거리 → 측점 글(구간 끝 · 평형선 만나는 점 이름) */
export function 자리글(x, 꼴 = '번호', 간격 = 20) {
  if (!Number.isFinite(x)) return ''
  if (x < -0.0005 && 꼴 !== 'm') return (꼴 === 'km' ? '0-' : 'NO.0-') + 끝수(-x, 2)
  if (꼴 === 'm') return 끝수(x, 2).toLocaleString('ko-KR', { maximumFractionDigits: 2 }) + ' m'
  if (꼴 === 'km') {
    let k = Math.floor(x / 1000 + 1e-9), r = 끝수(x - k * 1000, 2)
    if (r >= 999.995) { k += 1; r = 0 }
    const [i, f] = String(r).split('.')
    return k + '+' + i.padStart(3, '0') + (f ? '.' + f : '')
  }
  const g = 간격 > 0 ? 간격 : 20
  let n = Math.floor(x / g + 1e-9), p = 끝수(x - n * g, 2)
  if (p >= g - 0.005) { n += 1; p = 0 }
  return 'NO.' + n + (p > 0 ? '+' + p : '')
}

export const 기본칸 = () => [
  { id: 'a', 이름: '토사', 종: '절', C: '', 씀: true },
  { id: 'b', 이름: '리핑암', 종: '절', C: '', 씀: true },
  { id: 'c', 이름: '발파암', 종: '절', C: '', 씀: true },
  { id: 'f', 이름: '성토', 종: '성' },
]
export const 기본설정 = () => ({ 공사명: '', 간격: '20', 꼴: '자동', 방법: '평균단면', 끝: '2', 변이점: false, 평형: '시점', 평형높이: [], 띠: [], 띠나눔: '구간', 사토장: [], 토취장: [], 토취C: '' })
/** 띠 이름 — 이름이 비면 «60 m 까지» · «그 밖» */
export const 띠글 = (t) => (t && t.이름) || (t && Number.isFinite(t.까지) ? t.까지 + ' m 까지' : '그 밖')
export const 빈줄 = () => ({ 측: '', 거: '', 값: {}, 끊: false })

/* ── 셈 ─────────────────────────────────────────────────────────── */
export function 토적셈(입 = {}) {
  const S = { ...기본설정(), ...(입.설정 || {}) }
  const 칸 = (입.칸 || []).filter((c) => c && c.id)
  const 간격 = 숫(S.간격) > 0 ? 숫(S.간격) : 20
  const 방법 = S.방법 === '지배거리' ? '지배거리' : '평균단면'
  const 끝 = S.끝 === '' || S.끝 === undefined || S.끝 === null ? 2 : Number(S.끝)
  const 둥 = (x) => (끝 < 0 ? x : 끝수(x, 끝))
  const 경고 = [], 오류 = []
  const 절j = [], 성j = [], 씀j = [], 안씀j = []
  칸.forEach((c, j) => { if (c.종 === '성') 성j.push(j); else { 절j.push(j); if (c.씀 === false) 안씀j.push(j); else 씀j.push(j) } })
  const C = 칸.map((c) => (c.종 === '성' ? 1 : (숫(c.C) > 0 ? 숫(c.C) : 1)))
  const C없음 = 칸.map((c) => c.종 !== '성' && !(숫(c.C) > 0))

  /* ① 쓸 줄(측점 · 거리 · 단면이 다 빈 줄은 뺌) */
  const 줄 = []
  ;(입.줄 || []).forEach((r, i) => {
    const 측 = String(r?.측 ?? '').trim()
    const 값 = 칸.map((c) => 원수(r?.값?.[c.id], r?.값원?.[c.id]))
    const 거 = 원수(r?.거, r?.거원)
    if (!측 && !Number.isFinite(거) && 값.every((v) => !Number.isFinite(v))) return
    줄.push({ i, 측, 거수: 거, 원값: 값, 끊: !!r?.끊 })
  })
  const n = 줄.length
  const 틀린거리 = []
  let 첫꼴 = null, 모두읽음 = n > 0
  for (let k = 0; k < n; k++) {
    const z = 줄[k]
    z.p = z.측 ? 측점풀기(z.측, 간격, S.꼴) : null
    if (z.p && !첫꼴) 첫꼴 = z.p.꼴
    if (!z.p) { 모두읽음 = false; if (z.측) 오류.push(`${z.i + 1}번 줄 측점 «${z.측}» 을 읽지 못했습니다 — NO.12+5.5 · 0+120 꼴로 적어 주십시오`) }
    z.A = z.원값.map((v, j) => {
      if (Number.isFinite(v) && v < 0) { 오류.push(`${z.i + 1}번 줄 «${칸[j].이름}» 단면적이 음수(${v})입니다 — 0 으로 셈`); return 0 }
      return Number.isFinite(v) ? v : 0
    })
    const 준 = z.거수
    if (k === 0) { z.d = 0; z.x = z.p ? z.p.m : 0; continue }
    const 앞 = 줄[k - 1]
    const 측거 = z.p && 앞.p ? z.p.m - 앞.p.m : NaN
    if (Number.isFinite(측거) && 측거 < -0.0005) 오류.push(`${z.i + 1}번 줄 측점 «${z.측}» 이 앞 줄 «${앞.측}» 보다 앞입니다 — 측점 차례를 확인해 주십시오`)
    if (Number.isFinite(준)) {
      if (준 < 0) 오류.push(`${z.i + 1}번 줄 거리가 음수입니다 — 0 으로 셈`)
      z.d = Math.max(0, 준)
      if (Number.isFinite(측거) && Math.abs(측거 - z.d) > 0.005) 틀린거리.push(`${앞.측} → ${z.측}: 측점으로 ${끝수(측거, 3)} m · 적은 거리 ${z.d} m`)
    } else if (Number.isFinite(측거)) z.d = Math.max(0, 측거)
    else { z.d = 0; 오류.push(`${z.i + 1}번 줄 거리를 알 수 없습니다 — 측점이나 거리를 적어 주십시오`) }
    z.x = 앞.x + z.d
  }
  if (틀린거리.length) 경고.push(`📏 측점과 적은 거리가 다른 곳 ${틀린거리.length}곳 — 적은 거리로 셈(설계 토적표와 같게): ${틀린거리.slice(0, 3).join(' · ')}${틀린거리.length > 3 ? ' …' : ''}`)
  const 자리꼴 = 모두읽음 && !틀린거리.length && 첫꼴 ? 첫꼴 : 'm'
  const 자리 = (x) => {
    for (const z of 줄) if (Math.abs(z.x - x) < 0.0005 && z.측) return z.측
    return 자리글(x, 자리꼴, 간격)
  }

  /* ② 부피(흙 칸마다) */
  const 변이들 = []
  for (let k = 0; k < n; k++) { 줄[k].V = 칸.map(() => 0); 줄[k].변 = null }
  const 합면 = (z, js) => js.reduce((a, j) => a + z.A[j], 0)
  const 바뀜 = (a, b) => {
    const 절앞 = 합면(a, 절j), 성앞 = 합면(a, 성j), 절뒤 = 합면(b, 절j), 성뒤 = 합면(b, 성j)
    if (절앞 > 0 && 성앞 === 0 && 절뒤 === 0 && 성뒤 > 0) return { 꼴: '절성', A1: 절앞, A2: 성뒤 }
    if (성앞 > 0 && 절앞 === 0 && 성뒤 === 0 && 절뒤 > 0) return { 꼴: '성절', A1: 성앞, A2: 절뒤 }
    return null
  }
  if (방법 === '평균단면') {
    for (let k = 1; k < n; k++) {
      const a = 줄[k - 1], b = 줄[k], d = b.d
      const w = d > 0 ? 바뀜(a, b) : null
      if (w) {
        const x0 = (d * w.A1) / (w.A1 + w.A2)
        const 더 = (w.A1 * w.A2 * d) / (2 * (w.A1 + w.A2))
        if (S.변이점) {
          칸.forEach((c, j) => { b.V[j] = 둥(a.A[j] > 0 ? (a.A[j] * x0) / 2 : (b.A[j] * (d - x0)) / 2) })
          b.변 = { 꼴: w.꼴, x0 }
          변이들.push({ 앞: a.측, 뒤: b.측, x0, 더, 고침: true })
          continue
        }
        변이들.push({ 앞: a.측, 뒤: b.측, x0, 더, 고침: false })
      }
      칸.forEach((c, j) => { b.V[j] = 둥(((a.A[j] + b.A[j]) / 2) * d) })
    }
  } else {
    for (let k = 0; k < n; k++) {
      const z = 줄[k]
      z.평 = ((z.d || 0) + (k + 1 < n ? 줄[k + 1].d : 0)) / 2
      칸.forEach((c, j) => { z.V[j] = 둥(z.A[j] * z.평) })
      if (k > 0 && 줄[k].d > 0) { const w = 바뀜(줄[k - 1], z); if (w) 변이들.push({ 앞: 줄[k - 1].측, 뒤: z.측, x0: (z.d * w.A1) / (w.A1 + w.A2), 더: (w.A1 * w.A2 * z.d) / (2 * (w.A1 + w.A2)), 고침: false }) }
    }
  }
  const 안고친변이 = 변이들.filter((v) => !v.고침)
  if (안고친변이.length) {
    const 합더 = 안고친변이.reduce((s, v) => s + v.더, 0)
    경고.push(`〰 절토만 있는 측점과 성토만 있는 측점이 붙은 곳 ${안고친변이.length}곳(${안고친변이.slice(0, 3).map((v) => v.앞 + '~' + v.뒤).join(' · ')}${안고친변이.length > 3 ? ' …' : ''}) — 사이에 0점(변이점)이 없어 ${방법 === '평균단면' ? '평균단면법' : '지배거리법'}은 절토 · 성토를 각각 약 ${끝수(합더, 2).toLocaleString('ko-KR')} ㎥ 더 셉니다. 0점 측점을 넣거나${방법 === '평균단면' ? ' «변이점 나눔» 을 켜십시오' : ' 평균단면법에서 «변이점 나눔» 을 켜십시오'}(설계 토적표와 견줄 때는 끈 채로).`)
  }
  const 고친변이 = 변이들.filter((v) => v.고침)
  if (고친변이.length) 경고.push(`〰 변이점(0점)으로 나눈 구간 ${고친변이.length}곳 — 절토 · 성토를 각각 ${끝수(고친변이.reduce((s, v) => s + v.더, 0), 2).toLocaleString('ko-KR')} ㎥ 줄여 셈(그 구간은 횡방향 유용 없이 곡선이 옮김을 보임)`)

  /* ③ 보정 · 횡방향 · 차인 · 누가 */
  let M = 0
  const 칸합 = 칸.map(() => 0), 보정합 = 칸.map(() => 0)
  let 유용합 = 0, 성합 = 0, 횡합 = 0, 직접합 = 0
  for (const z of 줄) {
    z.B = 칸.map((c, j) => (c.종 === '성' ? 0 : 둥(z.V[j] * C[j])))
    z.U = 씀j.reduce((a, j) => a + z.B[j], 0)
    z.W = 안씀j.reduce((a, j) => a + z.V[j], 0)
    z.F = 성j.reduce((a, j) => a + z.V[j], 0)
    z.횡 = z.변 ? 0 : Math.min(z.U, z.F)
    z.차 = z.U - z.F
    M += z.차
    z.M = M
    z.몫 = z.U > 0 ? Object.fromEntries(씀j.filter((j) => z.B[j] > 0).map((j) => [칸[j].id, z.B[j] / z.U])) : null
    칸.forEach((c, j) => { 칸합[j] += z.V[j]; 보정합[j] += z.B[j] })
    유용합 += z.U; 성합 += z.F; 횡합 += z.횡; 직접합 += z.W
  }
  칸.forEach((c, j) => { if (C없음[j] && c.씀 !== false && 칸합[j] > 0) 경고.push(`🧮 «${c.이름}» C(토량환산계수)가 비어 1 로 셈했습니다 — 설계서 · 토질시험 값을 넣어 주십시오`) })

  /* ④ 유토곡선 점 */
  const 점 = []
  if (n) 점.push({ x: 줄[0].x, m: 0, r: -1 })
  if (방법 === '평균단면') {
    let m = 0
    for (let k = 1; k < n; k++) {
      const z = 줄[k], 앞x = 줄[k - 1].x
      if (z.변 && (z.U > 0 || z.F > 0)) {
        const 첫 = z.변.꼴 === '절성' ? { m: m + z.U, 몫: z.몫 } : { m: m - z.F, 몫: null }
        점.push({ x: 앞x + z.변.x0, m: 첫.m, r: k, 몫: 첫.몫 })
        m = m + z.U - z.F
        점.push({ x: z.x, m, r: k, 몫: z.변.꼴 === '절성' ? null : z.몫 })
      } else {
        m += z.차
        점.push({ x: z.x, m, r: k, 몫: z.차 > 0 ? z.몫 : null })
      }
    }
  } else {
    let m = 0
    for (let k = 0; k < n; k++) {
      const z = 줄[k]
      if (!(z.평 > 0)) continue
      const 왼 = z.d / 2, 오 = k + 1 < n ? 줄[k + 1].d / 2 : 0
      const 몫 = z.차 > 0 ? z.몫 : null
      if (왼 > 0) 점.push({ x: z.x, m: m + (z.차 * 왼) / (왼 + 오), r: k, 몫 })
      m += z.차
      if (오 > 0) 점.push({ x: z.x + 오, m, r: k, 몫 })
    }
  }
  /* 같은 x 겹침 정리(마지막 값) */
  const 곡 = []
  for (const p of 점) { const q = 곡[곡.length - 1]; if (q && Math.abs(q.x - p.x) < 1e-9) { if (Math.abs(q.m - p.m) < 1e-9) continue; p.x = q.x + 1e-9 } 곡.push(p) }

  /* ⑤ 구간(운반 못 건넘) · 평형선 · 띠 셈 */
  const 띠틀 = (S.띠 || []).map((t) => ({ 이름: String(t?.이름 || '').trim(), 까지: 숫(t?.까지) })).filter((t) => t.이름 || Number.isFinite(t.까지))
    .sort((p, q) => (Number.isFinite(p.까지) ? p.까지 : Infinity) - (Number.isFinite(q.까지) ? q.까지 : Infinity))
  const 띠 = (띠틀.length ? 띠틀 : [{ 이름: '운반', 까지: NaN }]).map((t) => ({ ...t, V: 0, VL: 0, 마디: [] }))
  const 거리별 = S.띠나눔 === '거리' && 띠.length > 1
  const 띠고름 = (L) => { const t = 띠.findIndex((u) => Number.isFinite(u.까지) && L <= u.까지 + 1e-9); return t < 0 ? 띠.length - 1 : t }
  const 띠선 = []
  /* 사토장 · 토취장 — 측점 → 누가거리(측점 글이 같은 줄이 있으면 그 줄 · 아니면 읽은 측점 사이를 곧게) */
  const 측x = (글) => {
    const 낱 = (s) => String(s || '').replace(/\s+/g, '').toUpperCase()
    const 같은 = 줄.find((z) => z.측 && 낱(z.측) === 낱(글))
    if (같은) return 같은.x
    const p = 측점풀기(글, 간격, S.꼴)
    if (!p) return NaN
    const 읽은 = 줄.filter((z) => z.p)
    if (!읽은.length) return p.m
    if (p.m <= 읽은[0].p.m) return 읽은[0].x - (읽은[0].p.m - p.m)
    for (let i = 1; i < 읽은.length; i++) {
      const a = 읽은[i - 1], c = 읽은[i]
      if (p.m <= c.p.m) return c.p.m > a.p.m ? a.x + ((p.m - a.p.m) / (c.p.m - a.p.m)) * (c.x - a.x) : c.x
    }
    const e = 읽은[읽은.length - 1]
    return e.x + (p.m - e.p.m)
  }
  const 장틀 = (목록, 머리) => (Array.isArray(목록) ? 목록 : []).map((s, i) => {
    const 이름 = String(s?.이름 || '').trim() || 머리 + ' ' + (i + 1)
    const 측 = String(s?.측 ?? '').trim(), 밖 = 숫(s?.밖)
    if (!측 && !Number.isFinite(밖)) return null
    const x = 측 ? 측x(측) : NaN
    if (측 && !Number.isFinite(x)) 오류.push(`${머리} «${이름}» 측점 «${측}» 을 읽지 못했습니다 — NO.12+5.5 · 0+120 꼴로 적어 주십시오(이 ${머리}은 셈에서 뺌)`)
    if (Number.isFinite(밖) && 밖 < 0) 오류.push(`${머리} «${이름}» 밖 거리가 음수입니다 — 0 으로 셈`)
    return { 이름, 측, x, 밖: Number.isFinite(밖) && 밖 > 0 ? 밖 : 0, 못읽음: !!측 && !Number.isFinite(x), V: 0, VL: 0, 토V: {}, 토VL: {}, 직접V: 0, 직접VL: 0, 마디: [] }
  }).filter(Boolean)
  const 사장 = 장틀(S.사토장, '사토장'), 순장 = 장틀(S.토취장, '토취장')
  /* 가장 가까운 장 — 길 따라 평균 거리(흙이 [a, b] 에 곧게 바뀌는 무게 wa → wb 로 놓임) + 밖 거리.
     범 = 흙이 든 구간의 운반 끊음 경계(시점 · 종점 쪽은 끝없음) — 끊음 너머 진출입 측점은 이쪽에 갈 곳이 하나도 없을 때만(넘 → 🚛 알림) */
  const 가까운 = (장들, a, b, wa, wb, 범) => {
    let k = -1, L = Infinity, 넘k = -1, 넘L = Infinity
    장들.forEach((s, i) => {
      if (s.못읽음) return
      const d = (Number.isFinite(s.x) ? 평균거리(a, b, wa, wb, s.x) : 0) + s.밖
      const 넘 = !!범 && Number.isFinite(s.x) && (s.x < 범[0] - 1e-6 || s.x > 범[1] + 1e-6)
      if (넘) { if (d < 넘L - 1e-9) { 넘L = d; 넘k = i } }
      else if (d < L - 1e-9) { L = d; k = i }
    })
    if (k >= 0) return { k, L, 넘: false }
    if (넘k >= 0) return { k: 넘k, L: 넘L, 넘: true }
    return { k: -1, L: null, 넘: false }
  }
  const 넘음 = { 사토장: 0, 토취장: 0 }
  const 끊x = 줄.slice(1, -1).filter((z) => z.끊).map((z) => z.x)
  const 경계 = n ? [줄[0].x, ...끊x.filter((x, i, a) => x > 줄[0].x && (i === 0 || x > a[i - 1])), 줄[n - 1].x] : []
  const 구간 = []
  const 마디 = []
  for (let g = 0; g + 1 < 경계.length; g++) {
    const xs = 경계[g], xe = 경계[g + 1]
    if (!(xe > xs)) continue
    const 쪽 = 곡.filter((p) => p.x >= xs - 1e-9 && p.x <= xe + 1e-9)
    if (쪽.length < 2) continue
    const 시높 = 쪽[0].m
    let b = 시높, 꼴 = '시점'
    if (S.평형 === '최소') { b = 가운뎃높이(쪽); 꼴 = '최소' }
    else if (S.평형 === '직접') { const v = 숫((S.평형높이 || [])[구간.length]); if (Number.isFinite(v)) { b = v; 꼴 = '직접' } }
    const 기록 = 띠셈(쪽, b)
    const 마 = 평형마디(쪽, b)
    const 범 = [g > 0 ? xs : -Infinity, g + 2 < 경계.length ? xe : Infinity]
    for (const r of 기록) {
      const x = r.꼴 === '운' ? (r.절.x + r.성.x) / 2 : r.꼴 === '사' ? r.절.x : r.성.x
      let t = 마.findIndex((q) => x >= q.xa - 1e-7 && x <= q.xb + 1e-7)
      if (t < 0) t = 마.length - 1
      const q = 마[t]
      if (r.꼴 === '운') {
        q.V += r.h; q.VL += r.h * r.거
        나눔(q.토V, r.절.s.몫, r.h); 나눔(q.토VL, r.절.s.몫, r.h * r.거)
        q.절x = 넓힘(q.절x, r.절); q.성x = 넓힘(q.성x, r.성)
        q.절중 += r.h * r.절.x; q.성중 += r.h * r.성.x
        q.최소 = Math.min(q.최소, r.거lo, r.거hi); q.최대 = Math.max(q.최대, r.거lo, r.거hi)
        if (거리별) 거리로나눔(r, 띠, 띠고름, q, 띠선)
      } else if (r.꼴 === '사') { q.사 += r.h; 나눔(q.토사, r.절.s.몫, r.h); q.사x = 넓힘(q.사x, r.절); q.사들.push({ ab: 넓힘(null, r.절), h: r.h, 몫: r.절.s.몫, 가: r.절.x, ...장고름(사장, 가까운, r.절, r.h, 범, 넘음, '사토장') }) }
      else { q.순 += r.h; q.순x = 넓힘(q.순x, r.성); q.순들.push({ ab: 넓힘(null, r.성), h: r.h, 몫: null, 가: r.성.x, ...장고름(순장, 가까운, r.성, r.h, 범, 넘음, '토취장') }) }
    }
    const 번g = 구간.length
    for (const q of 마) {
      q.구간 = 번g
      q.L = q.V > 0 ? q.VL / q.V : 0
      q.절c = q.V > 0 ? q.절중 / q.V : null; q.성c = q.V > 0 ? q.성중 / q.V : null
      delete q.절중; delete q.성중
      q.방향 = q.꼴 === '위' ? '→' : q.꼴 === '아래' ? '←' : ''
      q.반폭 = 반높이폭(쪽, b, q)
      q.사묶음 = 묶기(q.사들); q.순묶음 = 묶기(q.순들)
      delete q.사들; delete q.순들
      if (q.V > 1e-9 || q.사 > 1e-9 || q.순 > 1e-9) 마디.push(q)
      else delete q.띠몫
    }
    구간.push({ 번: 번g, xs, xe, b, 꼴, 시높, 끝높: 쪽[쪽.length - 1].m, 점: 쪽, 마디: 마 })
  }
  마디.forEach((q, i) => { q.번 = i + 1 })

  /* ⑥ 합 · 운반 띠 · 검산 */
  const 토 = (k) => 마디.reduce((o, q) => { for (const [id, v] of Object.entries(q[k])) o[id] = (o[id] || 0) + v; return o }, {})
  const 종 = 마디.reduce((a, q) => a + q.V, 0), 종VL = 마디.reduce((a, q) => a + q.VL, 0)
  const 사토 = 마디.reduce((a, q) => a + q.사, 0), 순성토 = 마디.reduce((a, q) => a + q.순, 0)
  const 토사토 = 토('토사')
  const 사토자연 = {}
  for (const [id, v] of Object.entries(토사토)) { const j = 칸.findIndex((c) => c.id === id); 사토자연[id] = j >= 0 ? v / C[j] : v }
  const 토취C = 숫(S.토취C)
  /* 운반 띠: «구간» 은 마디 평균운반거리로 띠 하나 · «거리» 는 ⑤ 에서 높이 띠마다 나눈 몫(띠몫)을 그대로 — 띠별 = [{t, 이름, 까지, V, VL, L, 토V, 토VL, 절x, 성x, 최소, 최대}] */
  for (const q of 마디) {
    const 몫 = q.띠몫
    delete q.띠몫
    if (!(q.V > 1e-9)) { q.띠별 = []; continue }
    q.띠별 = 거리별
      ? [...몫.values()].filter((p) => p.V > 1e-9).sort((a, b) => a.t - b.t)
      : [{ t: 띠고름(q.L), V: q.V, VL: q.VL, 토V: q.토V, 토VL: q.토VL, 절x: q.절x, 성x: q.성x, 최소: q.최소, 최대: q.최대, 절c: q.절c, 성c: q.성c }]
    for (const p of q.띠별) {
      p.L = p.V > 0 ? p.VL / p.V : 0
      if (p.절중 !== undefined) { p.절c = p.V > 0 ? p.절중 / p.V : null; p.성c = p.V > 0 ? p.성중 / p.V : null; delete p.절중; delete p.성중 }
      p.이름 = 띠[p.t].이름 || ''
      p.까지 = 띠[p.t].까지
      띠[p.t].V += p.V; 띠[p.t].VL += p.VL
      if (!띠[p.t].마디.includes(q.번)) 띠[p.t].마디.push(q.번)
    }
    q.띠 = 거리별 ? q.띠별.map((p) => 띠글(p)).join(' · ') : q.띠별[0].이름
  }
  for (const s of 띠선) { s.꼴 = s.마디.꼴; s.구간 = s.마디.구간; s.마디 = s.마디.번 }
  /* 사토장 · 토취장 합 — 유토곡선 사토 · 순성토 묶음마다(장 · 거리 · 장비 띠) · 바로 사토는 측점 줄 · 칸마다 */
  const 더하기 = (o, p) => { for (const [k, v] of Object.entries(p || {})) o[k] = (o[k] || 0) + v }
  for (const q of 마디) {
    for (const [묶, 장들] of [[q.사묶음, 사장], [q.순묶음, 순장]]) {
      for (const m of 묶) {
        if (!(m.장 >= 0)) continue
        const s = 장들[m.장]
        s.V += m.V; s.VL += m.VL; 더하기(s.토V, m.토); 더하기(s.토VL, m.토VL)
        if (!s.마디.includes(q.번)) s.마디.push(q.번)
        m.장이름 = s.이름; m.띠 = 띠[띠고름(m.L)].이름 || ''
      }
    }
  }
  const 직접장 = []
  if (사장.length && 안씀j.length) {
    for (let k = 0; k < n; k++) {
      const z = 줄[k]
      for (const j of 안씀j) {
        const V = z.V[j]
        if (!(V > 0)) continue
        let a, b, wa, wb
        if (방법 === '평균단면') {
          if (k === 0) continue
          const p = 줄[k - 1]
          if (z.변) { if (p.A[j] > 0) { a = p.x; b = p.x + z.변.x0; wa = p.A[j]; wb = 0 } else { a = p.x + z.변.x0; b = z.x; wa = 0; wb = z.A[j] } }
          else { a = p.x; b = z.x; wa = p.A[j]; wb = z.A[j] }
        } else { a = z.x - (z.d || 0) / 2; b = z.x + (k + 1 < n ? 줄[k + 1].d : 0) / 2; wa = 1; wb = 1 }
        const 가운데 = (a + b) / 2
        let gi = 0
        while (gi + 2 < 경계.length && 가운데 > 경계[gi + 1] + 1e-9) gi++
        const g = 가까운(사장, a, b, wa, wb, 경계.length > 2 ? [gi > 0 ? 경계[gi] : -Infinity, gi + 2 < 경계.length ? 경계[gi + 1] : Infinity] : null)
        if (g.k < 0) continue
        if (g.넘) 넘음.사토장++
        let e = 직접장.find((o) => o.j === j && o.장 === g.k)
        if (!e) { e = { j, id: 칸[j].id, 이름: 칸[j].이름, 장: g.k, 장이름: 사장[g.k].이름, V: 0, VL: 0 }; 직접장.push(e) }
        e.V += V; e.VL += V * g.L
      }
    }
    for (const e of 직접장) { e.L = e.V > 0 ? e.VL / e.V : null; e.띠 = 띠[띠고름(e.L)].이름 || ''; 사장[e.장].직접V += e.V; 사장[e.장].직접VL += e.VL; delete e.j }
    직접장.sort((p, q) => p.장 - q.장)
  }
  for (const s of [...사장, ...순장]) {
    s.L = s.V > 1e-9 ? s.VL / s.V : null; s.띠 = s.L !== null ? 띠[띠고름(s.L)].이름 || '' : ''
    s.직접L = s.직접V > 1e-9 ? s.직접VL / s.직접V : null
  }
  for (const [머리, 수] of Object.entries(넘음)) if (수) 경고.push(`🚛 운반 끊음(교량 등) 이쪽에 ${머리}(진출입 측점)이 없어 끊음 너머 ${머리}까지 길 따라 셈한 흙이 있습니다 — 끊음 이쪽에도 진출입 측점을 넣으십시오(같은 곳을 진출입 측점만 달리해 두 줄로 적어도 됩니다)`)
  const 장합 = (장들, k) => 장들.reduce((a, s) => a + s[k], 0)
  const 사토VL = 장합(사장, 'VL'), 사토장V = 장합(사장, 'V'), 순성토VL = 장합(순장, 'VL'), 순성토장V = 장합(순장, 'V')
  const 직접장V = 직접장.reduce((a, e) => a + e.V, 0), 직접VL = 직접장.reduce((a, e) => a + e.VL, 0)
  if (띠틀.length && Number.isFinite(띠틀[띠틀.length - 1].까지) && 마디.some((q) => q.V > 1e-9 && (거리별 ? q.최대 : q.L) > 띠틀[띠틀.length - 1].까지 + 1e-9)) {
    경고.push(`🚚 ${거리별 ? '운반거리' : '평균운반거리'}가 마지막 띠(${띠틀[띠틀.length - 1].이름} ${띠틀[띠틀.length - 1].까지} m)보다 먼 운반이 있어 그 띠에 넣었습니다 — 띠를 하나 더 두십시오`)
  }
  const 검절 = 유용합 - (횡합 + 종 + 사토), 검성 = 성합 - (횡합 + 종 + 순성토)
  const 잣대 = Math.max(1, 유용합, 성합)
  const 맞음 = Math.abs(검절) <= 1e-6 * 잣대 && Math.abs(검성) <= 1e-6 * 잣대
  if (!맞음) 오류.push(`검산이 맞지 않습니다(절토 차 ${끝수(검절, 4)} · 성토 차 ${끝수(검성, 4)}) — 이 화면을 캡처해 맵톡에 남겨 주십시오`)

  return {
    설정: S, 칸, C, C없음, 방법, 간격, 끝, 줄, 점: 곡, 구간, 마디, 띠, 띠나눔: 거리별 ? '거리' : '구간', 띠선, 장: { 사: 사장, 순: 순장 }, 직접장, 자리, 자리꼴,
    합: {
      칸: 칸합, 보정: 보정합, 유용: 유용합, 성: 성합, 횡: 횡합, 종, 종VL, L: 종 > 0 ? 종VL / 종 : 0,
      사토, 사토토: 토사토, 사토자연, 직접: 직접합, 직접칸: 안씀j.map((j) => ({ id: 칸[j].id, 이름: 칸[j].이름, V: 칸합[j] })),
      순성토, 순성토자연: 토취C > 0 ? 순성토 / 토취C : null, 토V: 토('토V'), 토VL: 토('토VL'),
      길이: n ? 줄[n - 1].x - 줄[0].x : 0, 끝누가: M,
      사토VL, 사토L: 사토장V > 1e-9 ? 사토VL / 사토장V : null, 순성토VL, 순성토L: 순성토장V > 1e-9 ? 순성토VL / 순성토장V : null,
      직접VL, 직접L: 직접장V > 1e-9 ? 직접VL / 직접장V : null,
    },
    검산: { 절: 검절, 성: 검성, 맞음 },
    경고, 오류, 변이들,
  }
}

/** 거리별 장비 나눔 — 한 높이 띠(운반 기록 r: lo ~ lo+h) 안에서 짝 사이 거리는 높이에 곧게 바뀜(거lo → 거hi).
 *  띠 거리(까지)와 같아지는 높이 s 에서 잘라 짧은 쪽 · 긴 쪽 띠에 V · V×L · 토질 · 자리를 나눔(어림 없음).
 *  자른 높이에서 두 만나는 점을 잇는 가로선(길이 = 띠 거리) = 띠선 [{마디, t, 이름, 까지, m, xa, xb}] */
function 거리로나눔(r, 띠, 띠고름, q, 띠선) {
  const a = r.거lo, d = r.거hi - r.거lo
  const 자름 = [0, 1]
  if (Math.abs(d) > 1e-12) {
    띠.forEach((u, t) => {
      if (t === 띠.length - 1 || !Number.isFinite(u.까지) || (t > 0 && 띠[t - 1].까지 === u.까지)) return   /* 같은 거리 띠 둘이면 선 하나 */
      const s = (u.까지 - a) / d
      if (s > 1e-12 && s < 1 - 1e-12) 자름.push(s)
      if (s > 1e-12 && s <= 1 + 1e-12) {
        const k = Math.min(1, s)
        const x1 = r.절.xl + k * (r.절.xh - r.절.xl), x2 = r.성.xl + k * (r.성.xh - r.성.xl)
        띠선.push({ 마디: q, t, 이름: u.이름, 까지: u.까지, m: r.lo + k * r.h, xa: Math.min(x1, x2), xb: Math.max(x1, x2) })
      }
    })
  }
  자름.sort((p, s) => p - s)
  const 몫 = r.절.s.몫
  const 자리 = (c, s0, s1) => ({ xl: c.xl + s0 * (c.xh - c.xl), xh: c.xl + s1 * (c.xh - c.xl) })
  for (let i = 0; i + 1 < 자름.length; i++) {
    const s0 = 자름[i], s1 = 자름[i + 1]
    if (!(s1 - s0 > 1e-15)) continue
    const L0 = a + d * s0, L1 = a + d * s1, h = r.h * (s1 - s0), vl = (h * (L0 + L1)) / 2
    const t = 띠고름((L0 + L1) / 2)
    let p = q.띠몫.get(t)
    if (!p) { p = { t, V: 0, VL: 0, 토V: {}, 토VL: {}, 절x: null, 성x: null, 최소: Infinity, 최대: 0, 절중: 0, 성중: 0 }; q.띠몫.set(t, p) }
    p.V += h; p.VL += vl
    const sm = (s0 + s1) / 2
    p.절중 += h * (r.절.xl + sm * (r.절.xh - r.절.xl)); p.성중 += h * (r.성.xl + sm * (r.성.xh - r.성.xl))
    나눔(p.토V, 몫, h); 나눔(p.토VL, 몫, vl)
    p.절x = 넓힘(p.절x, 자리(r.절, s0, s1)); p.성x = 넓힘(p.성x, 자리(r.성, s0, s1))
    p.최소 = Math.min(p.최소, L0, L1); p.최대 = Math.max(p.최대, L0, L1)
  }
}

/** 사토 · 순성토 자리 — 같은 장(사토장 · 토취장)으로 가는 붙어 있는(겹치는) 자리끼리 묶음: [{xa, xb, V, 토, 장, VL, 토VL, L}] (장 −1 = 장을 안 넣음) */
function 묶기(들) {
  const L = 들.slice().sort((p, q) => p.장 - q.장 || p.ab[0] - q.ab[0])
  const 묶 = []
  for (const d of L) {
    const 끝 = 묶[묶.length - 1]
    if (끝 && 끝.장 === d.장 && d.ab[0] <= 끝.xb + 1e-6) { 끝.xb = Math.max(끝.xb, d.ab[1]); 끝.V += d.h; 끝.VL += d.VL; 끝.중 += d.h * d.가; 나눔(끝.토, d.몫, d.h); 나눔(끝.토VL, d.몫, d.VL) }
    else { const 새 = { xa: d.ab[0], xb: d.ab[1], V: d.h, 토: {}, 장: d.장, VL: d.VL, 토VL: {}, 중: d.h * d.가 }; 나눔(새.토, d.몫, d.h); 나눔(새.토VL, d.몫, d.VL); 묶.push(새) }
  }
  묶.sort((p, q) => p.xa - q.xa)
  for (const m of 묶) { m.L = m.장 >= 0 && m.V > 0 ? m.VL / m.V : null; m.c = m.V > 0 ? m.중 / m.V : (m.xa + m.xb) / 2; delete m.중 }
  return 묶
}
/** 높이 띠 기록 하나(사토 · 순성토)의 장 — 흙은 그 띠의 만나는 점 자리 xl ~ xh 에 고르게 */
function 장고름(장들, 가까운, c, h, 범, 넘음, 머리) {
  if (!장들.length) return { 장: -1, VL: 0 }
  const g = 가까운(장들, c.xl, c.xh, 1, 1, 범)
  if (g.넘) 넘음[머리]++
  return g.k < 0 ? { 장: -1, VL: 0 } : { 장: g.k, VL: h * g.L }
}
/** [a, b] 위에 곧게 바뀌는 무게(wa → wb)로 놓인 흙에서 점 p 까지 길 따라 평균 거리 — 적분 그대로(어림 없음) */
export function 평균거리(a, b, wa, wb, p) {
  if (!Number.isFinite(p)) return 0
  if (b < a) { const t = a; a = b; b = t; const w = wa; wa = wb; wb = w }
  const L = b - a
  if (!(L > 1e-12)) return Math.abs(a - p)
  const α = wa, β = (wb - wa) / L
  const M0 = (u, v) => α * (v - u) + (β * (v * v - u * u)) / 2
  const M1 = (u, v) => (α * (v * v - u * u)) / 2 + (β * (v * v * v - u * u * u)) / 3
  const W = M0(0, L)
  if (!(W > 0)) return Math.abs((a + b) / 2 - p)
  const P = p - a
  let s
  if (P <= 0) s = M1(0, L) - P * W
  else if (P >= L) s = P * W - M1(0, L)
  else s = P * (M0(0, P) - M0(P, L)) - (M1(0, P) - M1(P, L))
  return s / W
}
function 나눔(o, 몫, v) {
  if (!몫) { o['?'] = (o['?'] || 0) + v; return }
  for (const [id, f] of Object.entries(몫)) o[id] = (o[id] || 0) + v * f
}
function 넓힘(r, c) {
  const a = Math.min(c.xl, c.xh), b = Math.max(c.xl, c.xh)
  return r ? [Math.min(r[0], a), Math.max(r[1], b)] : [a, b]
}

/** 높이 띠 셈 — 점: 한 구간의 곡선 꼭짓점 [{x, m, 몫}] (선분 i−1→i 의 몫 = 점[i].몫) · b: 평형선 높이 */
export function 띠셈(점, b) {
  const 선 = []
  for (let i = 1; i < 점.length; i++) {
    const a = 점[i - 1], c = 점[i]
    if (Math.abs(c.m - a.m) <= 작) continue
    선.push({ xa: a.x, ma: a.m, xb: c.x, mb: c.m, 몫: c.몫 || null })
  }
  const 높 = [...new Set([b, ...점.map((p) => p.m)])].sort((p, q) => p - q)
  const 층 = []
  for (const v of 높) if (!층.length || v - 층[층.length - 1] > 작 * Math.max(1, Math.abs(v))) 층.push(v)
  const 기록 = []
  const M0 = 점[0].m
  for (let j = 0; j + 1 < 층.length; j++) {
    const lo = 층[j], hi = 층[j + 1], h = hi - lo, mid = (lo + hi) / 2
    if (!(h > 0)) continue
    const 만남 = []
    for (const s of 선) {
      const mn = Math.min(s.ma, s.mb), mx = Math.max(s.ma, s.mb)
      if (mn > mid || mx < mid) continue
      const 비 = (v) => s.xa + ((v - s.ma) / (s.mb - s.ma)) * (s.xb - s.xa)
      만남.push({ x: 비(mid), xl: 비(lo), xh: 비(hi), 오름: s.mb > s.ma, s })
    }
    만남.sort((p, q) => p.x - q.x)
    const 위 = mid > b
    let 열림 = 위 ? (M0 > mid ? '처음' : null) : (M0 < mid ? '처음' : null)
    for (const c of 만남) {
      const 여는가 = 위 ? c.오름 : !c.오름
      if (여는가) { 열림 = c; continue }
      if (열림 === '처음') {
        if (위) 기록.push({ 꼴: '순', h, 성: c })
        else 기록.push({ 꼴: '사', h, 절: c })
      } else if (열림) {
        const 절 = 위 ? 열림 : c, 성 = 위 ? c : 열림
        기록.push({ 꼴: '운', h, lo, 거: Math.abs(c.x - 열림.x), 거lo: Math.abs(c.xl - 열림.xl), 거hi: Math.abs(c.xh - 열림.xh), 절, 성 })
      }
      열림 = null
    }
    if (열림 && 열림 !== '처음') {
      if (위) 기록.push({ 꼴: '사', h, 절: 열림 })
      else 기록.push({ 꼴: '순', h, 성: 열림 })
    }
  }
  return 기록
}

/** 평형선과 만나는 점으로 나눈 마디(운반 덩이) */
function 평형마디(점, b) {
  const tol = 1e-6
  const 경 = [점[0].x]
  for (let i = 1; i < 점.length; i++) {
    const p = 점[i], q = 점[i - 1], d = p.m - b, e = q.m - b
    if (Math.abs(d) <= tol) { if (p.x > 경[경.length - 1] + 1e-7) 경.push(p.x); continue }
    if (Math.abs(e) > tol && Math.sign(d) !== Math.sign(e)) {
      const x = q.x + ((0 - e) / (d - e)) * (p.x - q.x)
      if (x > 경[경.length - 1] + 1e-7) 경.push(x)
    }
  }
  const xe = 점[점.length - 1].x
  if (xe > 경[경.length - 1] + 1e-7) 경.push(xe)
  else 경[경.length - 1] = xe
  const 마 = []
  for (let i = 0; i + 1 < 경.length; i++) {
    const xa = 경[i], xb = 경[i + 1], xm = (xa + xb) / 2
    const d = 높이에서(점, xm) - b
    마.push({ xa, xb, 꼴: d > tol ? '위' : d < -tol ? '아래' : '평', V: 0, VL: 0, 사: 0, 순: 0, 토V: {}, 토VL: {}, 토사: {}, 절x: null, 성x: null, 사x: null, 순x: null, 사들: [], 순들: [], 최소: Infinity, 최대: 0, 띠몫: new Map(), 절중: 0, 성중: 0 })
  }
  return 마
}

export function 높이에서(점, x) {
  if (!점.length) return 0
  if (x <= 점[0].x) return 점[0].m
  for (let i = 1; i < 점.length; i++) {
    const a = 점[i - 1], c = 점[i]
    if (x <= c.x) return c.x - a.x > 0 ? a.m + ((x - a.x) / (c.x - a.x)) * (c.m - a.m) : c.m
  }
  return 점[점.length - 1].m
}

/** ∫|M−b|dx 가 가장 작은 b = 길이로 본 M 의 가운뎃값 */
function 가운뎃높이(점) {
  let lo = Infinity, hi = -Infinity
  for (const p of 점) { lo = Math.min(lo, p.m); hi = Math.max(hi, p.m) }
  if (!(hi > lo)) return lo
  const T = 점[점.length - 1].x - 점[0].x
  const 아래 = (b) => {
    let s = 0
    for (let i = 1; i < 점.length; i++) {
      const a = 점[i - 1], c = 점[i], L = c.x - a.x
      const mn = Math.min(a.m, c.m), mx = Math.max(a.m, c.m)
      if (mx < b) s += L
      else if (mn < b) s += (L * (b - mn)) / (mx - mn)
    }
    return s
  }
  for (let t = 0; t < 100; t++) { const m = (lo + hi) / 2; if (아래(m) < T / 2) lo = m; else hi = m }
  return (lo + hi) / 2
}

/** 참고: 마디 높이의 ½ 에서 그은 가로선 길이(손으로 긋는 방식) — 평형선과 두 번 만나는(닫힌) 마디만 */
function 반높이폭(점, b, q) {
  if (q.꼴 === '평') return null
  const 닫힘 = Math.abs(높이에서(점, q.xa) - b) < 1e-6 && Math.abs(높이에서(점, q.xb) - b) < 1e-6
  if (!닫힘) return null
  const 안 = 점.filter((p) => p.x > q.xa && p.x < q.xb)
  if (!안.length) return null
  const H = Math.max(...안.map((p) => Math.abs(p.m - b)))
  if (!(H > 1e-9)) return null
  const lv = b + (q.꼴 === '위' ? H / 2 : -H / 2)
  const 줄들 = [{ x: q.xa, m: b }, ...안, { x: q.xb, m: b }]
  let 첫 = null, 끝 = null
  for (let i = 1; i < 줄들.length; i++) {
    const a = 줄들[i - 1], c = 줄들[i]
    if ((a.m - lv) * (c.m - lv) <= 0 && a.m !== c.m) {
      const x = a.x + ((lv - a.m) / (c.m - a.m)) * (c.x - a.x)
      if (첫 === null) 첫 = x
      끝 = x
    }
  }
  return 첫 !== null && 끝 !== null ? 끝 - 첫 : null
}

/* ── 가져오기(엑셀 붙여넣기 · 엑셀 파일) ─────────────────────────────── */

/** 엑셀에서 복사한 글 → [[칸]] (탭 · 줄바꿈 · 따옴표 안 줄바꿈) */
export function 표풀기(글) {
  const t = String(글 ?? '')
  const rows = []
  let row = [], cell = '', q = false
  for (let i = 0; i < t.length; i++) {
    const ch = t[i]
    if (q) { if (ch === '"') { if (t[i + 1] === '"') { cell += '"'; i++ } else q = false } else cell += ch; continue }
    if (ch === '"' && cell === '') { q = true; continue }
    if (ch === '\t') { row.push(cell); cell = ''; continue }
    if (ch === '\n' || ch === '\r') { if (ch === '\r' && t[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; continue }
    cell += ch
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row) }
  return rows.filter((r) => r.some((v) => String(v).trim() !== ''))
}

const 낱말 = (s) => String(s ?? '').replace(/\s+/g, ' ').trim()
/** 첫 자료 줄 — 수(또는 측점) 칸이 둘 이상이고 채운 칸의 반 이상 */
export function 자료시작(rows) {
  for (let i = 0; i < Math.min(rows.length, 40); i++) {
    const 찬 = rows[i].map((v) => String(v ?? '').trim()).filter(Boolean)
    const 수칸 = 찬.filter((v) => Number.isFinite(숫(v)) || 측점풀기(v))
    if (수칸.length >= 2 && 수칸.length >= 찬.length * 0.5) return i
  }
  return 0
}

/** 머리 줄(여럿이면 위아래를 이어 붙임 · 위쪽 줄의 묶은 칸은 왼쪽 글을 이어 받음) → 칸마다 이름 · 할 일 짐작 */
export function 칸알아보기(rows, 머리수) {
  const ncol = rows.reduce((a, r) => Math.max(a, r.length), 0)
  const 머리 = Array.from({ length: ncol }, () => [])
  /* 위쪽 머리 줄의 빈칸은 왼쪽 글을 이어 받음(병합한 칸) — 단, 바로 위 줄에서 같은 묶음 안일 때만(묶음 밖으로 번지지 않게) */
  let 위 = null
  for (let i = 0; i < 머리수; i++) {
    const 이 = []
    let 왼 = '', 왼c = -1
    for (let c = 0; c < ncol; c++) {
      let v = 낱말(rows[i]?.[c])
      if (v) { 왼 = v; 왼c = c }
      else if (i < 머리수 - 1 && 왼 && (!위 || 위[c] === 위[왼c])) v = 왼
      이.push(v)
      if (v && !머리[c].includes(v)) 머리[c].push(v)
    }
    위 = 이
  }
  const 자료 = rows.slice(머리수)
  const 칸들 = 머리.map((h, c) => ({ c, 머리: h.join(' '), 보기: 자료.slice(0, 4).map((r) => 낱말(r[c])), 할: 할일짐작(h.join(' ')) }))
  /* 묶은 머리 «측 점» 이 두 칸(NO | +)에 걸치면 — 둘째 칸(수)은 «더함» */
  const 측들 = 칸들.filter((k) => k.할 === '측')
  if (측들.length >= 2 && 측들[1].c === 측들[0].c + 1 && 자료.some((r) => Number.isFinite(숫(r[측들[1].c])))) 측들[1].할 = '더'
  if (!칸들.some((k) => k.할 === '측')) {
    /* 머리에 «측점» 이 없으면 — 앞 두 칸이 «번호 · 더함» 꼴인지(설계사 토공집계: NO | + ) */
    const 수들 = (c) => 자료.map((r) => 숫(r[c])).filter((v) => Number.isFinite(v))
    const a = 수들(0), b = 수들(1)
    const 번호꼴 = a.length >= 2 && a.every((v, i) => Number.isInteger(v) && v >= 0 && (i === 0 || v >= a[i - 1]))
    if (번호꼴 && 칸들[0] && 칸들[0].할 === '무시') {
      칸들[0].할 = '측'
      if (칸들[1] && 칸들[1].할 === '무시' && b.length >= 1) 칸들[1].할 = '더'
    }
  }
  return 칸들
}

export function 할일짐작(머리글) {
  const t = String(머리글 || '').replace(/\s+/g, '').toLowerCase()
  if (!t) return '무시'
  if (/부피|㎥|m3|m³|체적|토량|수량/.test(t)) return '무시'
  if (/누가|누계|추가거리|측점\(m\)|sta\(m\)/.test(t)) return '누'
  if (/평균/.test(t) && /거리/.test(t)) return '무시'
  if (/점간|구간거리|^거리|거리\(m\)/.test(t)) return '거'
  if (/측점|^no\.?$|^sta|station/.test(t)) return '측'
  if (/^\+$|더함|플러스|plus/.test(t)) return '더'
  if (/길이|면고르기|보호공|비고|구조물/.test(t)) return '무시'
  if (/성토|되메|뒷채움|채움|매립|복토|흙쌓기/.test(t)) return '성'
  if (/절토|터파기|토사|리핑|발파|암|풍화|굴착|깎기|준설|뻘|표토/.test(t)) return '절'
  return '무시'
}

/** 머리글 → 흙 칸 이름(단위 · «단면» 같은 말 빼고, 띄어 쓴 한 글자들 «토 사» → «토사») */
export function 칸이름(머리글) {
  const 토막 = 낱말(String(머리글 || '').replace(/\((?:㎡|m2|m²|㎥|m)\)/gi, ' ').replace(/단면적|단면|면적/g, ' ')).split(' ').filter(Boolean)
  const 붙 = []
  let 한자모음 = false
  for (const w of 토막) {
    const 한 = /^[가-힣]$/.test(w)
    if (한 && 한자모음) 붙[붙.length - 1] += w
    else 붙.push(w)
    한자모음 = 한
  }
  return 붙.join(' ').slice(0, 24) || '흙'
}

/** 고른 할 일대로 줄 · 칸 만들기 — 맞춤: [{c, 할, 이름?}] · 이전칸: 같은 이름이면 C · 씀을 이어 받음 */
export function 가져오기(rows, 머리수, 맞춤, 이전칸 = []) {
  const 자료 = rows.slice(머리수)
  const 찾 = (할) => 맞춤.find((m) => m.할 === 할)
  const 측c = 찾('측'), 더c = 찾('더'), 거c = 찾('거'), 누c = 찾('누')
  const 흙 = 맞춤.filter((m) => m.할 === '절' || m.할 === '성')
  const 칸 = 흙.map((m, i) => {
    const 이름 = (m.이름 || 칸이름(m.머리)).trim() || '흙'
    const 옛 = 이전칸.find((c) => c.이름 === 이름 && (c.종 === '성') === (m.할 === '성'))
    return m.할 === '성' ? { id: 'k' + i, 이름, 종: '성' } : { id: 'k' + i, 이름, 종: '절', C: 옛 ? 옛.C : '', 씀: 옛 ? 옛.씀 !== false : !/뻘|표토|불량|유기/.test(이름) }
  })
  const 줄 = []
  let 앞누 = null
  const 알림 = []
  for (const r of 자료) {
    const 첫글 = 낱말(r[측c ? 측c.c : 0])
    if (/(^|\s)(합\s*계|소\s*계|총\s*계|계)(\s|$)|^계$/.test(첫글.replace(/\s+/g, ' '))) continue
    let 측 = 측c ? 낱말(r[측c.c]) : ''
    const 더 = 더c ? 숫(r[더c.c]) : NaN
    const 더글 = Number.isFinite(더) && 더 !== 0 ? (더 > 0 ? '+' + 끝수(더, 6) : '-' + 끝수(-더, 6)) : ''
    if (측 && Number.isFinite(숫(측))) 측 = 'NO.' + 숫(측) + 더글
    else if (측 && 더글 && !/[+]/.test(측)) 측 = 측 + 더글
    let 거 = 거c ? 숫(r[거c.c]) : NaN
    const 누 = 누c ? 숫(r[누c.c]) : NaN
    if (!Number.isFinite(거) && Number.isFinite(누)) { 거 = 앞누 === null ? NaN : 누 - 앞누 }
    if (Number.isFinite(누)) 앞누 = 누
    if (!측 && Number.isFinite(누)) 측 = String(누)
    const 값 = {}, 값원 = {}
    let 있음 = false
    흙.forEach((m, i) => { const k = 칸수(r[m.c]); if (k.글 !== '') { 값[칸[i].id] = k.글; if (k.원 !== undefined) 값원[칸[i].id] = k.원; 있음 = true } })
    if (!측 && !있음) continue
    const 거k = 칸수(거)
    const 한 = { 측, 거: 거k.글, 값, 끊: false }
    if (거k.원 !== undefined) 한.거원 = 거k.원
    if (Object.keys(값원).length) 한.값원 = 값원
    줄.push(한)
  }
  /* 측점 간격 — «번호+0 → 번호+0» 거리 ÷ 번호 차 가 가장 많은 값 */
  let 간격 = null
  if (거c && 측c) {
    const 셈 = new Map()
    for (let k = 1; k < 줄.length; k++) {
      const a = 측점풀기(줄[k - 1].측, 1, '번호'), b = 측점풀기(줄[k].측, 1, '번호'), d = 숫(줄[k].거)
      if (!a || !b || !(d > 0) || a.더 || b.더 || !(b.번 > a.번)) continue
      const g = 끝수(d / (b.번 - a.번), 3)
      셈.set(g, (셈.get(g) || 0) + 1)
    }
    let 최 = 0
    for (const [g, c] of 셈) if (c > 최) { 최 = c; 간격 = g }
    if (간격) 알림.push(`측점 간격을 ${간격} m 로 읽었습니다(번호가 1 늘 때 거리)`)
  }
  if (누c && !측c) 알림.push('측점 칸이 없어 누가거리를 측점으로 썼습니다(측점 꼴: m)')
  return { 칸, 줄, 간격, 알림, 꼴: 누c && !측c ? 'm' : null }
}

/* ── 🧪 예시(가상 — 실제 공사 아님) ──────────────────────────────────── */
export function 예시토적() {
  /* 가상 도로 440 m · NO. 간격 20 m · 토사 · 리핑암 절토, 성토 · NO.12 교량(운반 못 건넘) */
  const 표 = [
    ['NO.0', 0, 0, 6.2], ['NO.1', 0, 0, 9.8], ['NO.2', 3.4, 0, 4.1], ['NO.2+12.5', 8.6, 0, 0], ['NO.3', 14.2, 2.1, 0],
    ['NO.4', 21.5, 6.8, 0], ['NO.5', 18.3, 9.4, 0], ['NO.6', 12.7, 4.2, 0], ['NO.7', 6.1, 0, 2.3], ['NO.7+8.4', 0, 0, 0],
    ['NO.8', 0, 0, 7.9], ['NO.9', 0, 0, 15.6], ['NO.10', 0, 0, 12.4], ['NO.11', 0, 0, 8.2], ['NO.12', 2.5, 0, 3.1],
    ['NO.13', 9.8, 0, 0], ['NO.14', 16.4, 3.5, 0], ['NO.15', 13.1, 5.2, 0], ['NO.16', 7.4, 1.6, 0], ['NO.17', 2.2, 0, 4.8],
    ['NO.18', 0, 0, 9.1], ['NO.19', 0, 0, 6.7], ['NO.20', 1.8, 0, 2.2], ['NO.21', 5.6, 0, 0], ['NO.22', 3.9, 0, 0],
  ]
  return {
    설정: { ...기본설정(), 공사명: '가상 ○○ 도로 개설공사(예시)', 띠: [{ 이름: '불도저', 까지: '60' }, { 이름: '덤프트럭', 까지: '' }], 사토장: [{ 이름: '사토장 A', 측: 'NO.0', 밖: '1200' }, { 이름: '사토장 B', 측: 'NO.22', 밖: '1500' }] },
    칸: [{ id: 'a', 이름: '토사', 종: '절', C: '0.9', 씀: true }, { id: 'b', 이름: '리핑암', 종: '절', C: '1.1', 씀: true }, { id: 'f', 이름: '성토', 종: '성' }],
    줄: 표.map(([측, a, b, f]) => ({ 측, 거: '', 값: { a: a ? String(a) : '', b: b ? String(b) : '', f: f ? String(f) : '' }, 끊: 측 === 'NO.12' })),
  }
}

/** 🧪 예시 1회 변경 — NO.5 · NO.15 절토가 늘고 NO.9 성토가 줄며 NO.10+10 측점이 생김(가상) */
export function 예시변경토적() {
  const 당 = 예시토적()
  const 줄 = 당.줄.map((r) => ({ ...r, 값: { ...r.값 } }))
  const 찾 = (측) => 줄.find((r) => r.측 === 측)
  찾('NO.5').값.a = '20.6'; 찾('NO.5').값.b = '11.2'
  찾('NO.15').값.a = '15.4'
  찾('NO.9').값.f = '13.2'
  줄.splice(줄.findIndex((r) => r.측 === 'NO.11'), 0, { 측: 'NO.10+10', 거: '', 값: { a: '', b: '', f: '10.6' }, 끊: false })
  return { ...당, 줄 }
}

/* ── 차수 비교(당초 ↔ 변경) ───────────────────────────────────────── */
export function 차수비교(R1, R2) {
  const 이름들 = [...new Set([...R1.칸.map((c) => c.이름 + '|' + (c.종 === '성' ? '성' : '절')), ...R2.칸.map((c) => c.이름 + '|' + (c.종 === '성' ? '성' : '절'))])]
  const 값 = (R, key) => { const [이름, 종] = key.split('|'); const j = R.칸.findIndex((c) => c.이름 === 이름 && (c.종 === '성' ? '성' : '절') === 종); return j >= 0 ? R.합.칸[j] : 0 }
  const 줄 = 이름들.map((k) => ({ 항목: k.split('|')[0] + (k.endsWith('|성') ? ' (성토)' : ' (절토 · 자연)'), a: 값(R1, k), b: 값(R2, k) }))
  줄.push(
    { 항목: '보정 절토(유용 · 다짐)', a: R1.합.유용, b: R2.합.유용 },
    { 항목: '횡방향 유용', a: R1.합.횡, b: R2.합.횡 },
    { 항목: '종방향 유용(운반토량)', a: R1.합.종, b: R2.합.종 },
    { 항목: '평균운반거리(m)', a: R1.합.L, b: R2.합.L, 거리: true },
    { 항목: '사토(다짐)', a: R1.합.사토 + 0, b: R2.합.사토 + 0 },
    { 항목: '바로 사토(유용 안 함 · 자연)', a: R1.합.직접, b: R2.합.직접 },
    { 항목: '순성토(다짐)', a: R1.합.순성토, b: R2.합.순성토 },
    { 항목: '길이(m)', a: R1.합.길이, b: R2.합.길이, 거리: true },
  )
  for (const z of 줄) z.증 = z.b - z.a
  /* 같은 누가거리 측점의 단면 바뀜 */
  const 단면 = []
  const 찾 = new Map(R1.줄.map((z) => [끝수(z.x, 3), z]))
  for (const z of R2.줄) {
    const y = 찾.get(끝수(z.x, 3))
    if (!y) continue
    const 절 = (R) => (q) => R.칸.reduce((a, c, j) => a + (c.종 !== '성' ? q.A[j] : 0), 0)
    const 성 = (R) => (q) => R.칸.reduce((a, c, j) => a + (c.종 === '성' ? q.A[j] : 0), 0)
    const da = 절(R2)(z) - 절(R1)(y), df = 성(R2)(z) - 성(R1)(y)
    if (Math.abs(da) > 1e-9 || Math.abs(df) > 1e-9) 단면.push({ 측: z.측 || y.측, x: z.x, 절a: 절(R1)(y), 절b: 절(R2)(z), 성a: 성(R1)(y), 성b: 성(R2)(z) })
  }
  const 새 = R2.줄.filter((z) => !찾.has(끝수(z.x, 3))).map((z) => z.측)
  const 둘 = new Set(R2.줄.map((z) => 끝수(z.x, 3)))
  const 뺌 = R1.줄.filter((z) => !둘.has(끝수(z.x, 3))).map((z) => z.측)
  return { 줄, 단면, 새, 뺌 }
}
