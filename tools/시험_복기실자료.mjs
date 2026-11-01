/**
 * 시험 — 🧭 개찰 복기 · 👥 이용자 자리를 «실제 개찰 자료 전부» 에 대 봄 (G503 · 2026-11-01 소장님 「안 될것 같은 것 까지 세세히 점검 해줘」)
 *   node tools/시험_복기실자료.mjs   (node_modules 없이 · data/store/first.json 이 없으면 건너뜀)
 *   개찰 한 건마다 내 금액을 일곱 자리(1순위 −1,000 · 같음 · +5만 · 하한 바로 아래 · 반값 · 1.5배 · 1원)로 넣어
 *   ① 내성적 → 복기 가 멈추지 않음 ② 글에 NaN · undefined · Infinity · null 이 안 나옴 ③ 분위 · 자리 0~100 ④ 1순위 자리(실격선 ≤ 1순위 끝)
 *   ⑤ 상태와 글이 맞음(실격 → «낮았습니다» · 통과 → «높았습니다» · 같음 → «같은 금액») ⑥ 하한을 짐작한 공고가 안 맞으면(하한모름) 복기 안 함
 *   ⑦ 성향 · 자리나눔도 아무 묶음에 멈추지 않음.  ⚠️ 실제 이름은 화면에 안 찍음(번호 · 숫자만)
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { 내성적 } from '../web/src/lib/넣은금액.js'
import { 복기, 개찰자리, 성향, 공고값, 분위of } from '../web/src/lib/개찰복기.js'
import { P50_FALLBACK } from '../web/src/lib/bidmath.js'

globalThis.localStorage = { _: {}, getItem(k) { return this._[k] ?? null }, setItem(k, v) { this._[k] = String(v) }, removeItem(k) { delete this._[k] } }
const { 자리나눔 } = await import('../web/src/lib/관심도.js')

const 여기 = path.dirname(fileURLToPath(import.meta.url))
const 파일 = path.join(여기, '..', 'data', 'store', 'first.json')
if (!fs.existsSync(파일)) { console.log('… data/store/first.json 없음 — 건너뜀'); process.exit(0) }
const 자료 = Object.values(JSON.parse(fs.readFileSync(파일, 'utf8')).con || {})
let 통과 = 0, 실패 = 0
const 확인 = (이름, 참, 더 = '') => { if (참) { 통과++; console.log('  ✔', 이름) } else { 실패++; console.log('  ✘', 이름, typeof 더 === 'string' ? 더 : JSON.stringify(더).slice(0, 700)) } }
const 나쁜글 = /NaN|undefined|Infinity|null|\[object/

let 건 = 0, 복기됨 = 0, 멈춤 = [], 나쁜 = [], 범위밖 = [], 자리거꾸로 = [], 말어긋 = [], 짐작틀림 = [], 같음말 = []
const 상태수 = {}
for (const x of 자료) {
  if (!(Number(x.amt) > 0)) continue
  건++
  const amts = (x.corps || []).map((c) => Number(c[1]) || 0).filter((a) => a > 0).sort((a, b) => a - b)
  const r = { ...x, amts }
  const v = 공고값(r)
  const 예정 = Number(x.amt) / (Number(x.rate) / 100)
  const 하한 = v.llr > 0 && 예정 > 0 ? Math.ceil((예정 - v.A) * (v.llr / 100) + v.A) : Number(x.amt)
  const 자리들 = [Number(x.amt) - 1000, Number(x.amt), Number(x.amt) + 50000, 하한 - 1, Math.round(Number(x.amt) * 0.5), Math.round(Number(x.amt) * 1.5), 1]
  for (const 내 of 자리들) {
    let 성, b
    try { 성 = 내성적(r, 내, amts); b = 복기(성, r, 내, P50_FALLBACK, { med: 99.7, n: 8 }) } catch (e) { 멈춤.push([x.no, 내, String(e).slice(0, 80)]); continue }
    상태수[성 && 성.상태] = (상태수[성 && 성.상태] || 0) + 1
    if (!b) { if (성 && 성.하한모름 && 성.상태 !== '모름') 짐작틀림.push([x.no, 성.상태]); continue }
    if (성.하한모름) 짐작틀림.push([x.no, 성.상태, '복기 나옴'])
    복기됨++
    const 글 = b.줄들.map((z) => z.글).join(' | ')
    if (나쁜글.test(글)) 나쁜.push([x.no, 글.slice(0, 160)])
    const 수들 = [b.내분위, b.요약.q, b.요약.lo, b.요약.hi, b.자리.실격선, b.자리.일순끝]
    if (!수들.every((q) => typeof q === 'number' && q >= 0 && q <= 100)) 범위밖.push([x.no, 수들])
    if (!(b.자리.실격선 <= b.자리.일순끝)) 자리거꾸로.push([x.no, b.자리])
    const 자리글 = b.줄들.find((z) => z.k === '자리').글
    if (성.상태 === '실격' && !/낮았습니다/.test(자리글)) 말어긋.push([x.no, '실격', 자리글.slice(0, 80)])
    if (성.상태 === '통과' && !/높았습니다/.test(자리글)) 말어긋.push([x.no, '통과', 자리글.slice(0, 80)])
    if (성.상태 === '같음' && !/같은 금액/.test(b.줄들.map((z) => z.글).join(' '))) 같음말.push([x.no, b.줄들.find((z) => z.k === '배움').글.slice(0, 60)])
  }
}
console.log(`실제 개찰 ${건.toLocaleString()}건 × 내 금액 7자리 — 복기 나온 것 ${복기됨.toLocaleString()} · 상태 ${JSON.stringify(상태수)}`)
확인('① 멈춤(예외) 없음', !멈춤.length, 멈춤.slice(0, 5))
확인('② 글에 NaN · undefined · Infinity · null 없음', !나쁜.length, 나쁜.slice(0, 3))
확인('③ 분위 · 자리 모두 0~100', !범위밖.length, 범위밖.slice(0, 3))
확인('④ 1순위 자리 — 실격선 ≤ 1순위 끝', !자리거꾸로.length, 자리거꾸로.slice(0, 3))
확인('⑤ 상태와 글이 맞음(실격 → 낮았습니다 · 통과 → 높았습니다)', !말어긋.length, 말어긋.slice(0, 3))
확인('⑤-2 1순위와 같은 금액(동가) → «같은 금액» 이라고 말함(«1순위 금액 아래» 아님)', !같음말.length, 같음말.slice(0, 3))
확인('⑥ 하한을 짐작했는데 안 맞는 공고(하한모름)는 복기 안 함', !짐작틀림.some((z) => z[2]), 짐작틀림.filter((z) => z[2]).slice(0, 3))

/* 1순위 자리가 실격선보다 많이 낮게 셈해지는 공고(하한율 · A값이 맞지 않음) — 몇 건인지 */
let 어긋자리 = 0
for (const x of 자료) {
  if (!(Number(x.amt) > 0)) continue
  const v = 공고값(x); const 자 = 개찰자리(x, P50_FALLBACK)
  if (!자) continue
  const 끝 = 분위of({ base: v.base, llr: v.llr, A: v.A, pc: v.pc, amt: Number(x.sAmt || x.amt), p50: P50_FALLBACK, sd: v.sd })
  if (끝 != null && 끝 + 2 < 자.실격선) 어긋자리++
}
확인(`④-2 1순위 금액이 실격선보다 2분위 넘게 낮게 셈해지는 공고 없음(있으면 자리 그림이 거짓 — ${어긋자리}건)`, 어긋자리 === 0, 어긋자리)

/* ⑦ 성향 · 자리나눔 — 아무 묶음에 */
let 성향멈춤 = 0
for (let k = 0; k < 300; k++) {
  const 줄들 = Array.from({ length: k % 9 }, (_, i) => ({ o: i % 4 === 0 ? null : { s: ['실격', '통과', '일순', '같음', '모름'][(k + i) % 5], q: (k * 7 + i * 13) % 101 } }))
  try { const s = 성향(줄들); if (s && 나쁜글.test(s.말)) 성향멈춤++ } catch (e) { 성향멈춤++ }
}
확인('⑦ 성향 — 아무 묶음(빈 것 · 모름 섞임)에도 멈추지 않고 글 깨끗', 성향멈춤 === 0, 성향멈춤)
let 나눔멈춤 = 0
for (const h of [{}, { 0: 1 }, { 100: 3 }, { '-1': 2, 101: 2, x: 1 }, { 50: 0 }, null]) {
  try { const 나 = 자리나눔(h === null ? null : { n: 3, h }, { 실격선: 40, 일순끝: 45 }); if (나.막대.length !== 20) 나눔멈춤++ } catch (e) { 나눔멈춤++ }
}
확인('⑦ 자리나눔 — 빈 것 · 0 · 100 · 범위 밖 · null 에도 막대 20칸', 나눔멈춤 === 0, 나눔멈춤)

console.log(실패 ? `✘ ${실패} 틀림 · ${통과} 맞음` : `✔ 모두 맞음(${통과})`)
process.exit(실패 ? 1 : 0)
