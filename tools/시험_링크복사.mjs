// 🧪 G516 — 결과 링크 복사(lib/링크복사.js) · 판단기 다섯이 그것을 씀   node tools/시험_링크복사.mjs
//   G515 사이트 점검에서 찾음: 클립보드 쓰기가 끝나지도 · 실패하지도 않고 멈추면 «🔗 링크 보내기» 를 눌러도 링크가 안 나왔음
import { readFileSync } from 'fs'
import { 링크복사 } from '../web/src/lib/링크복사.js'

let 통과 = 0, 틀림 = 0
const 참 = (v, 이름, 덧 = '') => { if (v) 통과++; else { 틀림++; console.log(`  ✗ ${이름} ${덧}`) } }
const 놓기 = (c) => Object.defineProperty(globalThis, 'navigator', { value: c === undefined ? {} : { clipboard: c }, configurable: true, writable: true })

console.log('① 셈')
{
  let 받은 = ''
  놓기({ writeText: async (t) => { 받은 = t } })
  참((await 링크복사('https://k-conmap.com/tools/juhyu?c=abc', 100)) === true && 받은 === 'https://k-conmap.com/tools/juhyu?c=abc', '복사 됨 → true · 글 그대로')
  놓기({ writeText: async () => { throw new Error('NotAllowedError') } })
  참((await 링크복사('x', 100)) === false, '막힘(거절) → false')
  놓기({ writeText: () => { throw new Error('동기 오류') } })
  참((await 링크복사('x', 100)) === false, '바로 오류 → false')
  놓기({ writeText: () => new Promise(() => {}) })
  const t0 = Date.now()
  const r = await 링크복사('x', 150)
  const 걸린 = Date.now() - t0
  참(r === false && 걸린 >= 140 && 걸린 < 1000, '멈춤(끝나지 않음) → 기다림 뒤 false', `${걸린}ms`)
  놓기({ writeText: () => new Promise((res) => setTimeout(res, 50)) })
  참((await 링크복사('x', 300)) === true, '조금 늦게 끝남(50ms) → true')
  놓기({})
  참((await 링크복사('x', 100)) === false, '클립보드 없음 → false')
  놓기(undefined)
  참((await 링크복사('x', 100)) === false, 'navigator.clipboard 없음 → false')
}

console.log('② 판단기 다섯이 씀 — 클립보드를 바로 부르지 않음')
for (const f of ['Toejikgeum', 'Juhyu', 'Silup', 'Hyueop', 'Ilyong4']) {
  const s = readFileSync(new URL(`../web/src/pages/${f}.jsx`, import.meta.url), 'utf8')
  참(s.includes("import { 링크복사 } from '../lib/링크복사.js'") && s.includes('복사: await 링크복사(url)') && !/clipboard\.writeText\(url\)/.test(s), `${f}.jsx — 링크복사 씀`)
}

console.log(`\n결과 링크 복사 ${통과}/${통과 + 틀림}`)
if (틀림) process.exit(1)
