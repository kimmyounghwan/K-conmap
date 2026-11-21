/**
 * 🎲 G817 (2026-11-21) 종심제 «모의 개찰» — 지난 비슷한 종심 개찰(같은 갈래 · 새것부터)에 «기초금액의 율%» 금액을 넣어
 *   균형가격을 다시 셈(lib/종심셈.js 균형가격 — 예규 제8조 · 같은 금액 규칙)하고 → 내 가격점수 · 가격점수 등수를 셈.
 *   소장님 11-21 「만들 수 있는 건 다 만들어」(아이디어 ① 모의 개찰)
 *   자료: /data/jongsim_bids.json(종심예측.py 금액표) — 공고번호 → [개찰일시, 갈래, 배점, 기초, 예정(근사), 규칙뒤, 균형(근사), [업체 금액 …], 묶음 열쇠]
 *   «지난 비슷한 개찰» = 카드 «예상» 과 같은 묶음(통.열쇠 — 열쇠 앞부분이 같음 · 규칙 뒤 묶음이면 sm 1만) · 5건이 안 되면 그 갈래 전체(넓힘 표시)
 *   ⚠️ 가격점수만으로 줄 세움(공사수행능력 · 사회적책임 점수는 회사마다 달라 안 셈) · 예정가격을 넘는 금액은 무효(점수 없음) ·
 *      같은 점수는 같은 등수(그보다 높은 점수 수 + 1) · 업체 이름 없음
 *   시험: tools/시험_종심모의.mjs
 */
import { 균형가격, 종심가격점수 } from './종심셈.js'

const 평균 = (xs) => (xs.length ? xs.reduce((a, v) => a + v, 0) / xs.length : null)

/** 공고 한 줄 a(금액표) 에 금액 T 를 넣어 셈 → { 내(점수 | null=무효), 등, n(참여 수 · 나 포함), 일(가격점수 1등 점수), 균형, 균형율 } | null */
export function 한공고(a, T) {
  if (!Array.isArray(a) || a.length < 8) return null
  const [, , pt, base, yp, sm, , 금액] = a
  const t = Math.trunc(Number(T)), y = Math.trunc(Number(yp)), b0 = Number(base)
  if (!(t > 0) || !(y > 0) || !(b0 > 0) || !Array.isArray(금액) || 금액.length < 2) return null
  const 모두 = [...금액.map((v) => Math.trunc(Number(v))).filter((v) => v > 0), t]
  const b = 균형가격(모두, y, !!sm)
  if (!b || !(y > b.bal)) return null
  const 점 = (x) => (x > y ? null : (종심가격점수(x, b.bal, y, Number(pt) || 50) ?? 0))   /* 예정가격 넘음 = 무효 */
  const 내 = 점(t)
  const 남들 = 금액.map((v) => 점(Math.trunc(Number(v)))).filter((v) => v != null)
  const 일 = Math.max(내 ?? 0, ...남들, 0)
  const 등 = 내 == null ? null : 1 + 남들.filter((v) => v > 내 + 1e-9).length
  return { 내, 등, n: 모두.length, 일, 균형: b.bal, 균형율: (b.bal * 100) / b0 }
}

/** 표(금액표) · 거름({ kind, 열쇠, 규칙뒤 } — 카드 통의 묶음 · 갈래 글자만 주면 그 갈래) · 율(기초 대비 %) → 지난 개찰 새것부터 최대 «최대» 건에 넣어 본 결과 + 요약
 *  같은 묶음이 «최소»(5)건이 안 되면 그 갈래 전체로 넓힘(넓힘 true)
 *  { n, 결과: [{ no, dt, 내, 등, n, 일, 균형율 }], 평균(유효만 · 내 점수), 일평균(그 공고들 1등 점수), 일등, 삼등, 십분(참여의 10% 안 · 1등 포함), 영, 무효, 넓힘 } */
export function 모의개찰(표, 거름, 율, 최대 = 30, 최소 = 5) {
  const r = Number(율)
  const g = typeof 거름 === 'string' ? { kind: 거름 } : 거름 || {}
  const kind = g.kind || String(g.열쇠 || '').split('|')[0]
  const 열쇠 = String(g.열쇠 || kind)
  const 쓸줄 = Object.entries((표 && 표.공고) || {})
    .filter(([, a]) => Array.isArray(a) && a[1] === kind && Number(a[3]) > 0 && Number(a[4]) > 0 && Array.isArray(a[7]) && a[7].length >= 2)
  const 같은묶음 = ([, a]) => (!g.규칙뒤 || !!a[5]) && (String(a[8] || '') === 열쇠 || String(a[8] || '').startsWith(열쇠 + '|') || 열쇠 === kind)
  let 고른 = 쓸줄.filter(같은묶음), 넓힘 = false
  if (고른.length < 최소 && 쓸줄.length > 고른.length) { 고른 = 쓸줄; 넓힘 = true }
  const 줄 = 고른
    .sort((x, y) => String(y[1][0]).localeCompare(String(x[1][0])) || String(y[0]).localeCompare(String(x[0])))
    .slice(0, Math.max(0, 최대))
  const 결과 = []
  if (Number.isFinite(r) && r > 0) {
    for (const [no, a] of 줄) {
      const T = Math.floor((Number(a[3]) * r) / 100 / 1000) * 1000   /* 천 원 아래 버림(세 줄과 같게) */
      const o = 한공고(a, T)
      if (o) 결과.push({ no, dt: a[0], T, ...o })
    }
  }
  const 유효 = 결과.filter((x) => x.내 != null)
  return {
    n: 결과.length, 결과,
    평균: 평균(유효.map((x) => x.내)), 일평균: 평균(결과.map((x) => x.일)),
    일등: 유효.filter((x) => x.등 === 1).length, 삼등: 유효.filter((x) => x.등 <= 3).length,
    십분: 유효.filter((x) => x.등 <= Math.max(1, Math.ceil(x.n * 0.1))).length,
    영: 유효.filter((x) => x.내 <= 0).length, 무효: 결과.length - 유효.length, 넓힘,
  }
}
