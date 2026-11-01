/**
 * 시험 — 🔁 개찰 결과 한 건 읽기(web/src/lib/data.js 결과한줄) · G501 (2026-11-01)
 *   node tools/시험_결과한줄.mjs   (node_modules 없이 — PC bat 에서도)
 *   bidresult.json 의 r 는 {공고번호: [f 차례 값]} 꼴 — indexRows(배열만 읽음)로 찾으면 늘 없음 → 🔎 찾기로 연 개찰 공고가 «찾지 못했습니다»
 *   ① 지금 꼴(객체) ② 옛 꼴(배열) ③ 없는 번호 · 빈 자료 ④ 화면 코드가 bidresult 를 indexRows 로 읽지 않음
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { 결과한줄, indexRows } from '../web/src/lib/data.js'

const 여기 = path.dirname(fileURLToPath(import.meta.url))
let 통과 = 0, 실패 = 0
const 확인 = (이름, 참, 더 = '') => { if (참) { 통과++; console.log('  ✔', 이름) } else { 실패++; console.log('  ✘', 이름, typeof 더 === 'string' ? 더 : JSON.stringify(더)) } }

const f = ['win', 'amt', 'rate', 'np', 'base', 'dt', 'llr', 'lic', 'lo', 'hi']
const 값 = ['가상1순위(주)', 146278000, 93.913, 2, 155615000, '2026-10-26 11:00:00', 89.745, null, -3, 3]
console.log('① 지금 꼴 — r = {공고번호: 줄}')
{
  const res = { built: 'x', f, r: { R26BK99990002: 값, R26BK99990003: ['가상', 1, 90, 1, 0, '', 0, ['a'], null, null] } }
  const o = 결과한줄(res, 'R26BK99990002')
  확인('찾음 · no · win · amt · base · llr', o && o.no === 'R26BK99990002' && o.win === '가상1순위(주)' && o.amt === 146278000 && o.base === 155615000 && o.llr === 89.745, o)
  확인('lic 는 늘 배열', Array.isArray(o.lic) && o.lic.length === 0)
  const o3 = 결과한줄(res, 'R26BK99990003')
  확인('llr 0 → null(indexRows 와 같게) · lic 그대로', o3 && o3.llr === null && o3.lic[0] === 'a', o3)
  확인('indexRows 로는 못 읽음(그래서 고친 것)', indexRows(res).length === 0)
}
console.log('② 옛 꼴 — r = [줄 …] · f 에 no')
{
  const res = { f: ['no', ...f], r: [['R26BK99990002', ...값]] }
  const o = 결과한줄(res, 'R26BK99990002')
  확인('옛 꼴도 찾음', o && o.amt === 146278000 && o.win === '가상1순위(주)', o)
}
console.log('③ 없음')
확인('없는 번호 · 빈 자료 · null → null', 결과한줄({ f, r: {} }, 'R1') === null && 결과한줄(null, 'R1') === null && 결과한줄({ f, r: { R1: 'x' } }, 'R1') === null && 결과한줄({ f, r: { R1: 값 } }, '') === null)
console.log('④ 화면 코드')
{
  const 글 = fs.readFileSync(path.join(여기, '../web/src/pages/NoticePage.jsx'), 'utf8')
  확인('NoticePage — bidresult 는 결과한줄로(indexRows(res) 없음)', /결과한줄\(res, key\)/.test(글) && !/indexRows\(res\)/.test(글))
}
console.log(실패 ? `✘ ${실패} 틀림 · ${통과} 맞음` : `✔ 모두 맞음(${통과})`)
process.exit(실패 ? 1 : 0)
