/**
 * 📏 종단면도 · 횡단면도에 «적힌 값» 읽기 — G132 (2026-10-05)
 *
 * 소장님: 「엑셀받기 하면 엑셀에 도면 물량이 나와야 하는데, 안나와」 → 「고쳐줘」
 * ■ 종·횡단면도의 선은 실제 연장이 아니므로(가로 · 세로 축척이 다름) 그림으로 재지 않고, 도면에 «적힌» 값을 읽습니다.
 *
 * ① 구간표읽기 — 종단면도의 «이름 + 바로 아래 L=○○M» 띠(하수도 종단 프로그램이 흔히 그리는 꼴)
 *    예) «D200(오수관)» 아래 «L=230.00M» · «OPEN CUT(토사)» 아래 «L=70.00M» · «3 LINE-002» 아래 «L=40.00M»(맨홀 구간)
 *    → 이름마다 L 을 더함(관경별 · 공법별 · 관보호공 · 맨홀 구간). 이름이 «n LINE-00k» 꼴이면 «관로 구간(맨홀~맨홀)» 으로 묶음.
 * ② 속성단면 — 횡단면도마다 넣은 «수량표 블록»의 속성(측점 · 터파기 · 모래부설 · 보조기층 …)
 *    측점 «12+5.000» = NO.12 + 5 m (뒤 수가 늘 20 보다 작으면 20 m 간격, 아니면 km+m)
 *    노선마다(측점이 0+0 으로 돌아가거나 크게 줄면 새 노선) 측점 차례로 놓고 평균단면법 Σ (A1+A2)/2 × L.
 *    «(전)/(후)» 처럼 같은 측점 두 단면은 거리 0 으로 이어집니다(구조물 앞뒤).
 *    지반고 · 관저고 같은 높이 값은 물량이 아니라 뺍니다. ASP · CONC 처럼 «폭» 으로 보이는 값은 m × L = m² 로 셈하고 처음엔 꺼 둠.
 * ■ 시험: node tools/시험_단면표.mjs
 */
import { 글자폭 } from './도면자동.js'

const 수 = (t) => {
  const s = String(t ?? '').replace(/,/g, '').trim()
  if (s === '' || s === '-') return 0
  const v = Number(s)
  return Number.isFinite(v) ? v : NaN
}

/** ① 종단면도 — «이름 / L=○○M» 짝 */
export function 구간표읽기(M) {
  const { T, E, layers } = M
  const 참조층 = (e) => /\|/.test((layers[E.ly[e]] || {}).name || '')
  const 사본 = (e) => E.sc && (E.sc[e] < 0.5 || E.sc[e] > 2)
  const L들 = []
  const 글들 = []
  for (let i = 0; i < T.s.length; i++) {
    const e = T.e[i]
    if (참조층(e) || 사본(e)) continue
    const s = String(T.s[i]).trim()
    const m = s.match(/^L\s*=\s*([\d,]+(?:\.\d+)?)\s*M?$/i)
    const w = 글자폭(T, i)
    if (m) L들.push({ i, v: Number(m[1].replace(/,/g, '')), cx: T.x[i] + w / 2, y: T.y[i], h: T.h[i] || 1, w })
    else if (s && !/^[-+]?[\d.,]+$/.test(s)) 글들.push({ i, s, cx: T.x[i] + w / 2, y: T.y[i], w })
  }
  if (L들.length < 2) return []
  글들.sort((a, b) => a.y - b.y)
  const 아래첫 = (y) => { let lo = 0, hi = 글들.length; while (lo < hi) { const md = (lo + hi) >> 1; if (글들[md].y <= y) lo = md + 1; else hi = md } return lo }
  /* 짝 — 짧은 구간은 이름 · L 이 위아래로 엇갈려 쌓이므로(«이름 / L» 두 줄씩), 가로로 가장 잘 맞는 이름을 5 줄 높이 안에서 찾고
   *  한 이름은 한 L 에만(가까운 것부터) */
  const 후보 = []
  for (const L of L들) {
    for (let j = 아래첫(L.y); j < 글들.length && 글들[j].y - L.y <= 5 * L.h; j++) {
      const g = 글들[j]
      const dx = Math.abs(g.cx - L.cx)
      if (dx > (g.w + L.w) / 2 + 0.5 * L.h) continue
      후보.push({ L, g, 점: dx + 0.3 * (g.y - L.y) })
    }
  }
  후보.sort((a, b) => a.점 - b.점)
  const 쓴L = new Set(), 쓴글 = new Set()
  const 묶 = new Map()
  for (const { L, g } of 후보) {
    if (쓴L.has(L) || 쓴글.has(g)) continue
    쓴L.add(L); 쓴글.add(g)
    let 이름 = g.s.replace(/\s+/g, ' ')
    if (/^\d+(-\d+)?\s*LINE\s*-\s*\d+$/i.test(이름) || /^(M\.?H|맨홀)\s*[-#]?\s*\d+\s*[~-]\s*\d+$/i.test(이름)) 이름 = '관로 구간(맨홀~맨홀)'
    const a = 묶.get(이름) || { 품명: 이름, 수량: 0, 개수: 0 }
    a.수량 += L.v; a.개수++
    묶.set(이름, a)
  }
  return [...묶.values()].filter((a) => a.수량 > 0).sort((a, b) => b.수량 - a.수량)
}

const 높이칸 = /지반고|관저고|계획고|표고|^EL\b|^G\.?H$|^F\.?H$|토피|심도|DEPTH|^H$/i
const 폭칸 = /^(ASP|ASCON|아스[콘팔]|CONC?|CON'C|콘크리트|보도블[럭록]|보도|포장|폭|B)$/i

/** 측점 글자 → [NO, 더한 m] */
function 측점풀기(t) {
  const m = String(t || '').match(/(\d+)\s*\+\s*(\d+(?:\.\d+)?)/)
  if (m) return [Number(m[1]), Number(m[2])]
  const n = String(t || '').match(/NO\.?\s*(\d+)/i)
  return n ? [Number(n[1]), 0] : null
}

/** ② 횡단면 수량표 블록(속성) → 평균단면법 */
export function 속성단면(M) {
  const 묶음 = new Map()
  for (const b of M.I || []) {
    if (!b || !b.속성 || b.속성.length < 3 || b.참조) continue
    const a = 묶음.get(b.name) || []
    a.push(b)
    묶음.set(b.name, a)
  }
  const 결과 = []
  for (const [이름, 넣은] of 묶음) {
    if (넣은.length < 3) continue
    const 측칸 = 넣은[0].속성.map((x) => x[0]).find((t) => /측점|STA|^NO\.?$|CHAIN|STATION/i.test(t))
    if (!측칸) continue
    const 줄 = 넣은.map((b) => ({ 측: 측점풀기((b.속성.find((x) => x[0] === 측칸) || [])[1]), 글: (b.속성.find((x) => x[0] === 측칸) || [])[1] || '', 값: Object.fromEntries(b.속성.map(([k, v]) => [k, 수(v)])) })).filter((r) => r.측)
    if (줄.length < 3) continue
    const 간격 = 줄.every((r) => r.측[1] < 20) ? 20 : 1000
    for (const r of 줄) r.s = r.측[0] * 간격 + r.측[1]
    /* 노선 나누기 — 측점이 크게 줄면 새 노선 */
    const 노선 = [[]]
    let 앞 = -Infinity
    for (const r of 줄) {
      if (노선[노선.length - 1].length && ((r.s === 0 && 앞 > 0) || r.s < 앞 - 3 * 간격)) { 노선.push([]); 앞 = -Infinity }
      노선[노선.length - 1].push(r)
      앞 = Math.max(앞, r.s)
    }
    const 칸들 = 넣은[0].속성.map((x) => x[0]).filter((t) => t !== 측칸 && !높이칸.test(t) && 줄.filter((r) => Number.isFinite(r.값[t])).length >= 줄.length * 0.6)
    const 합 = Object.fromEntries(칸들.map((t) => [t, 0]))
    let 길이 = 0
    for (const g of 노선) {
      g.sort((a, b) => a.s - b.s || (/\(후\)/.test(a.글) ? 1 : 0) - (/\(후\)/.test(b.글) ? 1 : 0))
      for (let k = 1; k < g.length; k++) {
        const L = g[k].s - g[k - 1].s
        길이 += L
        for (const t of 칸들) {
          const a1 = g[k - 1].값[t], a2 = g[k].값[t]
          if (Number.isFinite(a1) && Number.isFinite(a2)) 합[t] += (a1 + a2) / 2 * L
        }
      }
    }
    const 항목 = 칸들.filter((t) => 합[t] > 0.0005).map((t) => {
      const 폭 = 폭칸.test(t.trim())
      return { 품명: t, 단위: 폭 ? 'm²' : 'm³', 수량: 합[t], 폭 }
    })
    if (항목.length) 결과.push({ 블록: 이름, 노선수: 노선.length, 단면수: 줄.length, 길이, 간격, 항목 })
  }
  return 결과
}
