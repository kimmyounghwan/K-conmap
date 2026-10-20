/* 🧪 G338 (2026-10-20) 승률 곡선 — 참가 띠 굽기 · 곡선 점(lib/금액대성적.js) 잠금
 *   소장님 「바로입찰 업그레이드」 ① 금액마다 «1순위 될 확률» · 참가업체수 구간별
 *   node tools/시험_승률곡선.mjs */
import { 성적만들기, 참가띠들, 참가띠of, 곡선점들, 띠성적, 자리성적, ZN, Z0, DZ } from '../web/src/lib/금액대성적.js'
let 셈 = 0, 틀림 = 0
const 봄 = (뜻, ok, 덧 = '') => { 셈++; if (!ok) 틀림++; console.log((ok ? '✓ ' : '✗ ') + 뜻 + (덧 !== '' ? ' — ' + 덧 : '')) }
봄('참가 띠 다섯 · 경계(2 · 9 · 10 · 29 · 30 · 99 · 100 · 299 · 300 · 5000)',
  [2, 9, 10, 29, 30, 99, 100, 299, 300, 5000].map(참가띠of).join() === '0,0,1,1,2,2,3,3,4,4' && 참가띠of(1) === -1 && 참가띠of(0) === -1 && 참가띠들.length === 5)
/* 가상 개찰 — 금액대 둘 · 참가 셋 */
const 줄 = (no, base, np, sj, 붙음) => {
  const A = Math.round(base * 0.05), llr = 89.745, yeje = Math.round(base * sj / 100)
  const lim = Math.ceil((yeje - A) * llr / 100 + A), amt = lim + 붙음
  return { no, base, np, aval: A, ayn: 'Y', llr, lo: -3, hi: 3, ptot: 15, pdrw: 4, amt, rate: amt / yeje * 100, dt: '2026-10-1' + (no % 9) }
}
const rows = []
for (let i = 0; i < 40; i++) rows.push(줄(i, 150e6 + i * 1e6, [5, 50, 400][i % 3], 99 + (i % 7) * 0.3, 20000 + i * 1000))
const 표 = 성적만들기(rows, 99.89)
봄('굽기 — 띠 p 가 다섯 칸 · 띠 건수 합 = 금액대 건수 합', Array.isArray(표.p) && 표.p.length === 5 && 표.p.reduce((s, c) => s + c.n, 0) === 표.b.reduce((s, c) => s + c.n, 0), JSON.stringify(표.p.map((c) => c.n)))
봄('굽기 — 띠마다 101칸 · 실격 + 1순위 ≤ 건수', 표.p.every((c) => c.dq.length === ZN && c.win.length === ZN && c.dq.every((d, j) => d + c.win[j] <= c.n)))
{
  const 띠합 = (j) => 표.p.reduce((s, c) => s + c.win[j], 0), 금합 = (j) => 표.b.reduce((s, c) => s + c.win[j], 0)
  봄('굽기 — 자리마다 1순위 건수: 띠 합 = 금액대 합(같은 개찰을 두 갈래로 나눔)', Array.from({ length: ZN }, (_, j) => j).every((j) => 띠합(j) === 금합(j)))
}
{
  const c = 표.p[0], 점 = 곡선점들(표, c, 3)
  const j = 50, 손 = [47, 48, 49, 50, 51, 52, 53].reduce((s, k) => s + c.win[k], 0) / 7
  봄('곡선점들 — 101점 · z = z0 + j·dz · 1순위는 ±3칸 평균 · 실격은 그대로', 점.length === ZN && Math.abs(점[j].z - (Z0 + j * DZ)) < 1e-9 && Math.abs(점[j].일순 - 손) < 1e-12 && 점[j].실격 === c.dq[j])
  const 끝 = [0, 1, 2, 3].reduce((s, k) => s + c.win[k], 0) / 4
  봄('곡선점들 — 끝 칸은 있는 이웃만 평균(0 칸 = 0~3칸)', Math.abs(점[0].일순 - 끝) < 1e-12)
}
봄('띠성적 — 자리성적과 같은 모양({n, 실격, 일순, 밖})', (() => { const x = 띠성적(표, 0, 0), y = 자리성적(표, 1, 0); return x && y && 'n' in x && 'n' in y && '밖' in x })())
{
  const 옛 = JSON.parse(JSON.stringify(표)); delete 옛.p
  봄('옛 gm.json(띠 없음) — 띠성적 null · 곡선점들(null) 빈 배열 · 자리성적은 그대로', 띠성적(옛, 0, 0) === null && 곡선점들(옛, null).length === 0 && 자리성적(옛, 1, 0) !== null)
}
봄('참가 2곳 미만 개찰은 굽기에서 빠짐(띠 −1)', 성적만들기([줄(1, 2e8, 1, 99.9, 1000)], 99.89).p.every((c) => c.n === 0))
console.log(`\n${셈}개 중 틀림 ${틀림}`)
process.exit(틀림 ? 1 : 0)
