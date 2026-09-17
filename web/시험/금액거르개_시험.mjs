/* 💰 금액 거르개가 «법정 경계» 를 정말 맞게 자르는지 — 실제 코드를 떼어 내서 돌립니다. (2026-09-17)
 *
 *   node web/시험/금액거르개_시험.mjs
 *
 * ⚠️ 경계를 고치면 여기 숫자도 같이 고치십시오. 짐작으로 「되겠지」 하지 않습니다.
 * ⚠️ 끝표는 «코드 줄» 로 잡습니다 — 주석으로 잡았다가 주석을 지운 날 죽은 적이 있습니다 (8절 28).
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const here = path.dirname(fileURLToPath(import.meta.url))
const src = fs.readFileSync(path.join(here, '..', 'src', 'pages', 'LiveBoard.jsx'), 'utf8').replace(/\r\n/g, '\n')
const 자르기 = (a, b) => {
  const i = src.indexOf(a), j = src.indexOf(b)
  if (i < 0 || j < 0 || j <= i) {
    console.log(`✕ LiveBoard.jsx 에서 «${i < 0 ? a : b}» 를 못 찾았습니다 — 시험이 코드를 못 떼어 냅니다.`)
    process.exit(1)
  }
  return src.slice(i, j)
}
const 토막 = 자르기('const AMT_KEY =', 'export default function')

const store = {}
globalThis.localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v) }, removeItem: (k) => { delete store[k] } }
const m = new Function(토막.replace(/export const/g, 'const')
  + '\n return { AMT_CHIPS, estOf, amtHit, amtLabel, loadAmt, saveAmt };')()
const { AMT_CHIPS, estOf, amtHit, amtLabel, loadAmt, saveAmt } = m

let ok = 0, bad = 0
const T = (n, v, w) => { (v === w ? (ok++, console.log('  ○ ' + n)) : (bad++, console.log(`  ✕ ${n} → ${JSON.stringify(v)} (${JSON.stringify(w)} 여야 합니다)`))) }
const 억 = 1e8

console.log('① 추정가격을 고르는 규칙 — 배정예산은 «절대» 쓰지 않습니다')
T('추정가격이 있으면 그대로', estOf({ est: 3.61e8, base: 3.97e8, budget: 4.86e8 }), 3.61e8)
T('없으면 기초금액 ÷ 1.1', estOf({ est: 0, base: 397111000 }), Math.round(397111000 / 1.1))
T('둘 다 없으면 0 (모름)', estOf({ budget: 485852000 }), 0)
T('배정예산으로 메우지 않는다', estOf({ est: 0, base: 0, budget: 485852000 }), 0)

console.log('② 안 걸었으면 전부 통과 — 모르는 공고도 안 빠집니다')
T('조건 없음', amtHit(0, null), true)
T('빈 조건', amtHit(0, { lo: null, hi: null }), true)

console.log('③ 모르는 것은 «거짓» 이 아니라 «모름(null)» 입니다')
T('추정가격 0 이면 null', amtHit(0, { lo: null, hi: 2 }), null)
T('  → 0원으로 세면 「2억 미만」에 걸려 들어옵니다. 그러면 안 됩니다',
  amtHit(0, { lo: null, hi: 2 }) === false || amtHit(0, { lo: null, hi: 2 }) === null, true)

console.log('④ 경계 — 「2억 미만」은 2억을 «안» 넣습니다')
T('1억 9999만', amtHit(1.9999 * 억, { lo: null, hi: 2 }), true)
T('딱 2억은 빠진다', amtHit(2 * 억, { lo: null, hi: 2 }), false)
T('2억부터는 들어온다', amtHit(2 * 억, { lo: 2, hi: 4 }), true)
T('딱 4억은 다음 칸', amtHit(4 * 억, { lo: 2, hi: 4 }), false)
T('4억은 4~10억에 들어온다', amtHit(4 * 억, { lo: 4, hi: 10 }), true)

console.log('⑤ 한쪽만 — 「이상」·「미만」')
T('10억 이상: 9.9억 빠짐', amtHit(9.9 * 억, { lo: 10, hi: null }), false)
T('10억 이상: 10억 들어옴', amtHit(10 * 억, { lo: 10, hi: null }), true)
T('3억 미만: 2.9억 들어옴', amtHit(2.9 * 억, { lo: null, hi: 3 }), true)
T('3억 미만: 3억 빠짐', amtHit(3 * 억, { lo: null, hi: 3 }), false)

console.log('⑥ 알약이 국가·지자체 경계를 다 덮나 (소장님: 「둘 다 가자」)')
const 마디 = new Set()
AMT_CHIPS.forEach((c) => { if (c.lo != null) 마디.add(c.lo); if (c.hi != null) 마디.add(c.hi) })
T('  2억 (국가·지자체 공통)', 마디.has(2), true)
T('  4억 (지자체)', 마디.has(4), true)
T('  10억 (국가·지자체 공통)', 마디.has(10), true)
T('  50억 (국가)', 마디.has(50), true)
T('  100억 (국가 — 넘으면 종합심사)', 마디.has(100), true)
T('  알약 사이에 구멍이 없다', AMT_CHIPS.every((c, i) => i === 0 || c.lo === AMT_CHIPS[i - 1].hi), true)
T('  첫 칸은 아래가 열려 있다', AMT_CHIPS[0].lo, null)
T('  끝 칸은 위가 열려 있다', AMT_CHIPS[AMT_CHIPS.length - 1].hi, null)

console.log('⑦ 3억은 알약에 없습니다 — 직접 넣기로 갑니다 (일부러 그렇게 뒀습니다)')
T('  알약에 3억 마디 없음', 마디.has(3), false)
T('  직접 넣으면 걸린다', amtHit(2.99 * 억, { lo: null, hi: 3 }), true)

console.log('⑧ 이름 붙이기')
T('둘 다', amtLabel({ lo: 4, hi: 10 }), '4억~10억')
T('위만', amtLabel({ lo: null, hi: 2 }), '2억 미만')
T('아래만', amtLabel({ lo: 100, hi: null }), '100억 이상')

console.log('⑨ 기억하기 — 지역·면허처럼 브라우저가 들고 있습니다')
saveAmt({ lo: 4, hi: 10 }); T('  넣은 대로 돌아온다', JSON.stringify(loadAmt()), JSON.stringify({ lo: 4, hi: 10 }))
saveAmt(null); T('  지우면 없다', loadAmt(), null)
saveAmt({ lo: null, hi: null }); T('  빈 조건은 저장 안 한다', loadAmt(), null)

console.log('\n맞음 ' + ok + ' · 틀림 ' + bad)
process.exit(bad ? 1 : 0)
