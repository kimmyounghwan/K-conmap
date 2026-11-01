/**
 * 시험 — 👥 경쟁 관심도 순수 셈(web/src/lib/관심도.js) · 규칙(database.rules.json bc) · G499 (2026-11-01)
 *   node tools/시험_관심도.mjs   (인터넷 · node_modules 없이 — PC bat 에서도)
 *   ① 마감 숫자 · 지금 숫자 ② 본 사람 셈(최근 1시간 · 오늘) ③ 마감 뒤 자리 나눔(실격 · 1순위 자리 · 밀림 · 막대 20칸)
 *   ④ 규칙 — bc/p 는 공고마다만 읽기 · 처음 한 번만 쓰기 · bc/q 는 아무도 못 읽음 · 금액(분위)은 0~100 정수만 · fresh 는 읽기만
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/* lib/관심도.js 는 lib/방문세기.js(브라우저 번호)를 부릅니다 — node 에서도 불러지는지까지 봄 */
globalThis.localStorage = { _: {}, getItem(k) { return this._[k] ?? null }, setItem(k, v) { this._[k] = String(v) }, removeItem(k) { delete this._[k] } }
const { 마감숫자, 지금숫자, 관심셈, 자리나눔, 묶음자리 } = await import('../web/src/lib/관심도.js')

const 여기 = path.dirname(fileURLToPath(import.meta.url))
let 통과 = 0, 실패 = 0
const 확인 = (이름, 참, 더 = '') => { if (참) { 통과++; console.log('  ✔', 이름) } else { 실패++; console.log('  ✘', 이름, typeof 더 === 'string' ? 더 : JSON.stringify(더)) } }

console.log('① 숫자')
확인('마감 «2026-11-02 10:00:00» → 202611021000', 마감숫자('2026-11-02 10:00:00') === 202611021000)
확인('마감 14자리 → 앞 12자리 · 모르는 꼴은 null', 마감숫자('20261102100000') === 202611021000 && 마감숫자('') === null && 마감숫자('2026-11') === null && 마감숫자('19990101000000') === null)
확인('지금(한국 시각) → 12자리', 지금숫자(Date.parse('2026-11-01T15:30:00+09:00')) === 202611011530)
확인('공개 묶음 자리 = 공고번호 앞 8자', 묶음자리('R26BK01776922') === 'R26BK017')

console.log('② 본 사람')
{
  const 지금 = Date.parse('2026-11-01T15:30:00+09:00')
  const v = { a: { t: 지금 - 10 * 60e3, c: 1 }, b: { t: 지금 - 2 * 3600e3, c: 1 }, c: { t: Date.parse('2026-10-31T23:00:00+09:00'), c: 1 }, d: 'x', e: { c: 1 } }
  const s = 관심셈(v, 지금)
  확인('본 사람 3 · 최근 1시간 1 · 오늘 2(어제 밤은 오늘 아님) · 이상한 것 뺌', s.n === 3 && s.시간 === 1 && s.오늘 === 2, s)
  확인('빈 것', JSON.stringify(관심셈(null, 지금)) === JSON.stringify({ n: 0, 시간: 0, 오늘: 0 }))
}

console.log('③ 마감 뒤 자리 나눔')
{
  const 자리 = { 실격선: 40, 일순끝: 42 }
  const 묶 = { n: 7, h: { 10: 1, 39: 1, 40: 1, 42: 2, 75: 1, 100: 1, abc: 9, 50: 0 } }
  const 나 = 자리나눔(묶, 자리)
  확인('실격(10 · 39) 2 · 1순위 자리(40 · 42 · 42) 3 · 밀림(75 · 100) 2 · 이상한 열쇠 · 0 은 뺌', 나.n === 7 && 나.실격 === 2 && 나.일순 === 3 && 나.밀림 === 2, 나)
  확인('막대 20칸 — 100분위는 마지막 칸 · 합 7', 나.막대.length === 20 && 나.막대[19] === 1 && 나.막대[2] === 1 && 나.막대.reduce((a, b) => a + b, 0) === 7, 나.막대)
  const 모름 = 자리나눔(묶, null)
  확인('자리를 모르면 막대만', 모름.n === 7 && 모름.실격 === 0 && 모름.일순 === 0 && 모름.밀림 === 0)
}

console.log('④ 규칙')
{
  const 글 = fs.readFileSync(path.join(여기, '../web/database.rules.json'), 'utf8')
  const R = JSON.parse(글.replace(/^\s*\/\/.*$/gm, '')).rules
  const p = R.bc && R.bc.p, q = R.bc && R.bc.q
  확인('bc/p — 목록 전체는 못 읽고 공고 하나씩만 읽음', p && !('.read' in p) && p.$no['.read'] === true)
  확인('bc/p — 처음 한 번만 쓰기(!data.exists()) · 번호 16자 · 공고번호 꼴', /!data\.exists\(\)/.test(p.$no.$id['.write']) && /a-z0-9\]\{16\}/.test(p.$no.$id['.write']) && /A-Za-z0-9-\]\{6,30\}/.test(p.$no.$id['.write']))
  확인('bc/p — 금액 칸 없음(t · c 만 · 다른 칸 막힘)', Object.keys(p.$no.$id).filter((k) => !k.startsWith('.')).sort().join(',') === '$other,c,t' && p.$no.$id.$other['.validate'] === false)
  확인('bc/q — 아무 데도 .read 없음(운영자 화면도 못 읽음)', !JSON.stringify(q).includes('.read') && !('.read' in R.bc))
  확인('bc/q — 분위는 0~100 · 시각은 서버 시각(정수 아닌 것은 묶는 쪽 관심묶기가 버림 — 시험_이용자지도.py)', /newData.val\(\) >= 0 && newData.val\(\) <= 100/.test(q.$no.$id.q['.validate']) && /=== now/.test(q.$no.$id.t['.validate']))
  확인('규칙 식에 % 없음(문서로 확인 안 된 연산 — 배포 실패 막음)', !/%/.test(JSON.stringify(R.bc)))
  확인('fresh — 누구나 읽기 · 아무도 못 씀(깃허브 관리자만)', R.fresh['.read'] === true && R.fresh['.write'] === false)
}

console.log(실패 ? `✘ ${실패} 틀림 · ${통과} 맞음` : `✔ 모두 맞음(${통과})`)
process.exit(실패 ? 1 : 0)
