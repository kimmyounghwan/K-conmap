/* 🎯 이 칸에 누가 넣나 — 바로투찰 (2026-10-05)
   소장님: 「1부터 3까지 같이 하는게 편하지 않아」 → ①②는 한 번에 · 이건 ②

   ■ 칸 = 그 금액이 낙찰하한을 넘으려면 사정률이 «이 값 아래로» 나와야 하는 경계(sj*)를 0.1%p 로 자른 것
       sj* = ((금액 − A) × 100 ÷ 낙찰하한율 + A) ÷ 기초금액 × 100      (bidmath.breakEvenSj 와 같은 식)
     우리 금액의 sj* 는 판정 상자가 이미 «사정률이 ○○% 를 넘게 나오면 실격» 으로 보여 주는 바로 그 값입니다.
   ■ 자료: /data/kan/{시도 차례}.json · /data/kan/all.json (build_json.py build_kan)
       {v, lo: 970, f/t: 첫·끝 개찰 yymmdd, w: 전국 칸별 1순위 비율(%) — 투찰 200건 안 되는 칸은 null, wa: 전체,
        g: {'': 전체, '면허 이름': …}}  ·  한 묶음 = {e: 개찰 수, n: 투찰 수, h: [칸별 투찰 수 60개], t: {칸: [[업체, 횟수, 고정이면 가운데 sj*]]}}
   ⚠️ 칸별 1순위 비율은 평평합니다(전국 약 4%). 붐비는 칸을 피한다고 이기지 않습니다 — 화면에 그대로 적습니다.
   ⚠️ 시도 차례는 build_json.py 의 SIDO_KAN 과 같아야 합니다. */
import { getJSON } from './data.js'

export const 시도칸 = ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '경기',
  '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주']
export const 칸시작 = 970
export const 칸개수 = 60
export const 적은투찰 = 300      // 시도 자료가 이보다 적으면 전국으로

export const 칸번호 = (sj) => Math.floor(sj * 10 + 1e-9)
export const 칸글 = (k) => (k / 10).toFixed(1)

/** «전남,광주» 처럼 여럿이면 앞의 것 */
export function 시도번호(sido) {
  const s = String(sido || '').split(',')[0].trim()
  return 시도칸.indexOf(s)
}

/** 시도 자료(넉넉하면) 아니면 전국 → {d, 곳} 또는 null */
export async function 칸받기(sido) {
  const i = 시도번호(sido)
  if (i >= 0) {
    const d = await getJSON(`/data/kan/${i}.json`)
    if (d && d.g && d.g[''] && d.g[''].n >= 적은투찰) return { d, 곳: 시도칸[i] }
  }
  const a = await getJSON('/data/kan/all.json')
  return a && a.g && a.g[''] ? { d: a, 곳: '전국' } : null
}

/** 공고의 면허(['토목공사업/0001', …]) 중 자료에 따로 있는 첫 면허 이름 — 없으면 '' */
export function 면허고르기(d, lics) {
  for (const l of lics || []) {
    const n = String(l || '').split('/')[0].trim()
    if (n && d && d.g && d.g[n]) return n
  }
  return ''
}

/** 칸 k 풀이 — {수, 몫(%), 순위(붐비는 순), 위: [[업체, 횟수, 고정]], 일순위(전국 %|null)} */
export function 칸풀이(d, g, k) {
  const lo = d.lo || 칸시작
  const i = k - lo
  const h = g.h || []
  const 수 = i >= 0 && i < h.length ? h[i] : 0
  const 순위 = 수 > 0 ? h.filter((x) => x > 수).length + 1 : null
  const w = Array.isArray(d.w) && i >= 0 && i < d.w.length ? d.w[i] : null
  return {
    수,
    몫: g.n > 0 ? (수 * 100) / g.n : 0,
    순위,
    위: (g.t && g.t[String(k)]) || [],
    일순위: typeof w === 'number' ? w : null,
  }
}

/** 전국 칸별 1순위 비율의 범위 — 투찰이 넉넉한 칸만(null 빼고) */
export function 일순위범위(d) {
  const v = (d.w || []).filter((x) => typeof x === 'number')
  if (!v.length) return null
  return { lo: Math.min(...v), hi: Math.max(...v), 전체: d.wa }
}

/** 그림에 그릴 칸 범위 [a, b] (칸 번호) — 투찰 양끝 1% 를 빼고, 고른 칸은 늘 넣고, 양옆 2칸 여유 · 적어도 20칸 */
export function 그림범위(d, g, k) {
  const lo = d.lo || 칸시작
  const h = g.h || []
  const 합 = h.reduce((s, x) => s + x, 0)
  let a = 0, b = h.length - 1
  if (합 > 0) {
    let s = 0
    for (a = 0; a < h.length; a++) { s += h[a]; if (s >= 합 * 0.01) break }
    s = 0
    for (b = h.length - 1; b >= 0; b--) { s += h[b]; if (s >= 합 * 0.01) break }
  }
  let A = lo + a - 2, B = lo + b + 2
  if (k != null) { A = Math.min(A, k - 2); B = Math.max(B, k + 2) }
  while (B - A + 1 < 20) { A--; B++ }
  return [Math.max(lo, A), Math.min(lo + h.length - 1, B)]
}

/** 'yymmdd' → 'M.D' */
export const 날짜 = (s) => (String(s || '').length === 6 ? `${Number(s.slice(2, 4))}.${Number(s.slice(4, 6))}` : '')
