/**
 * 🧪 lib/금액대성적.js — G185 금액 고르기(금액대별 «그 자리에 넣었다면» 성적) (2026-10-07)
 *   node tools/시험_금액대성적.mjs [개찰 자료 first.json — 있으면 권장 성적을 금액대별로 따로 셈과 맞춰 봄]
 */
import fs from 'fs'
import * as B from '../web/src/lib/bidmath.js'
import * as G from '../web/src/lib/금액대성적.js'
let 통과 = 0, 실패 = 0
const 봐 = (무엇, ok, 값) => { if (ok) { 통과++; console.log('  ✓', 무엇) } else { 실패++; console.log('  ✗', 무엇, 값 === undefined ? '' : JSON.stringify(값).slice(0, 300)) } }

console.log('■ 금액대')
봐('1억 = «1억 이하» · 1억 1원 = «1~2억»', G.금액대of(1e8) === 0 && G.금액대of(1e8 + 1) === 1)
봐('10억 = «9~10억» · 100억 = «50~100억» · 100억 넘으면 -1 · 0 이면 -1', G.금액대들[G.금액대of(1e9)][2] === '9~10억' && G.금액대들[G.금액대of(1e10)][2] === '50~100억' && G.금액대of(1e10 + 1) === -1 && G.금액대of(0) === -1)

console.log('■ 자리 금액 = 바로투찰 분위 금액')
const base = 150000000, llr = 87.745, a = 3000000, p50 = 99.896, sd = B.sjSigma(-3, 3, 15, 4)
for (const t of B.QTILES) {
  const q = B.quantileBid({ base, llRate: llr, aVal: a, p50, sd, q: t.q })
  봐(`${t.q}분위`, q && G.자리금액(base, llr, a, p50, sd, t.z) === q.amt, [q && q.amt, G.자리금액(base, llr, a, p50, sd, t.z)])
}

console.log('■ 굽기 — 지어낸 개찰 셋')
/* 예정가격 = 기초 × 100.2% · 1순위 = 하한 + 1만원 */
const 줄 = (no, b, s) => {
  const yeje = b * s / 100, lim = Math.ceil((yeje - a) * llr / 100 + a), amt = lim + 10000
  return { no, dt: '2026-09-0' + no, base: b, llr, aval: a, ayn: 'Y', lo: -3, hi: 3, ptot: 15, pdrw: 4, np: 50, amt, rate: Math.round(amt / yeje * 100 * 1000) / 1000 }
}
const 표 = G.성적만들기([줄(1, 1.5e8, 100.2), 줄(2, 1.6e8, 99.0), 줄(3, 1.7e8, 101.5), { ...줄(4, 1.5e8, 100), np: 1 }], p50)
const c = 표.b[1]
봐('1~2억 3건(혼자 넣은 개찰은 뺌) · 기간', c.n === 3 && 표.기간[0] === '2026-09-01' && 표.기간[1] === '2026-09-03', [c.n, 표.기간])
/* 자리마다 판정을 손으로 셈과 맞춤 */
let 같음 = true
for (let j = 0; j < G.ZN; j++) {
  const z = G.Z0 + j * G.DZ
  let dq = 0, win = 0
  for (const r of [줄(1, 1.5e8, 100.2), 줄(2, 1.6e8, 99.0), 줄(3, 1.7e8, 101.5)]) {
    const yeje = r.amt / (r.rate / 100), lim = Math.ceil((yeje - a) * (llr / 100) + a)
    const m = G.자리금액(r.base, llr, a, p50, sd, z)
    if (m < lim) dq++; else if (m < r.amt) win++
  }
  if (dq !== c.dq[j] || win !== c.win[j]) 같음 = false
}
봐('101칸 실격 · 1순위 건수 = 손셈', 같음)
봐('자리가 낮을수록 실격이 늘어남(단조)', c.dq.every((v, j) => j === 0 || v <= c.dq[j - 1]))
봐('자리성적 — 가장 가까운 칸 · 표 밖 표시', G.자리성적(표, 1, 0).n === 3 && G.자리성적(표, 1, 9).밖 === true && G.자리성적(표, 1, 0.01).밖 === false && G.자리성적(표, 0, 0) === null)
봐('분위z = 바로투찰 분위표 z(4자리)', B.QTILES.every((t) => Math.abs(G.분위z(t.q) - t.z) < 5e-5))
{ const j = 50, z = G.Z0 + (j + 0.5) * G.DZ, x = G.자리성적(표, 1, z)
  봐('자리성적 — 두 칸 사이는 곧게 이음(가운데 = 두 칸 평균)', Math.abs(x.실격 - (c.dq[j] + c.dq[j + 1]) / 2) < 1e-9 && Math.abs(x.일순 - (c.win[j] + c.win[j + 1]) / 2) < 1e-9) }
const [아, 위] = G.넓게(5, 100)
봐('넓게(5/100) ≈ 2.2~11.2%', Math.abs(아 - 2.2) < 0.1 && Math.abs(위 - 11.2) < 0.1, [아, 위])

const 길 = process.argv[2]
if (길 && fs.existsSync(길)) {
  console.log('■ 실제 개찰 자료 — 권장 성적을 금액대마다 따로 셈과 맞춤')
  const rows = Object.values(JSON.parse(fs.readFileSync(길, 'utf8')).con || {})
  const g = G.성적만들기(rows, 99.896)
  const 따로 = G.금액대들.map(() => [0, 0, 0])
  for (const r of rows) {
    const b = Number(r.base), amt = Number(r.amt), rate = Number(r.rate)
    if (!B.isReady(r) || !(amt > 0) || !(rate > 80 && rate < 100) || r.lo == null || r.hi == null || !((Number(r.np) || 0) >= 2)) continue
    if (!(B.sjSigma(Number(r.lo), Number(r.hi), r.ptot, r.pdrw) > 0)) continue
    const i = G.금액대of(b); if (i < 0) continue
    const A = r.ayn === 'N' ? 0 : (Number(r.aval) || 0)
    const yeje = amt / (rate / 100), lim = Math.ceil((yeje - A) * (Number(r.llr) / 100) + A)
    const q = B.quickBid(r, 99.896); 따로[i][0]++
    if (q && q.amt < lim) 따로[i][1]++; else if (q && q.amt < amt) 따로[i][2]++
  }
  봐('금액대마다 개찰 수 · 권장 실격 · 권장 1순위 같음', g.b.every((x, i) => x.n === 따로[i][0] && x.rec[0] === 따로[i][1] && x.rec[1] === 따로[i][2]), g.b.map((x, i) => [x.k, x.n, 따로[i][0], x.rec, 따로[i].slice(1)]))
  봐('1억 이하 5,159건 · 권장 1순위 235건(앞서 파이썬으로 잰 것과 같음)', g.b[0].n === 5159 && g.b[0].rec[1] === 235, [g.b[0].n, g.b[0].rec])
}
console.log(`\n${통과} 통과 · ${실패} 실패`)
if (실패) process.exit(1)
