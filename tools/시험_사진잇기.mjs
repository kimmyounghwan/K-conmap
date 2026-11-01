/**
 * 시험 — 📡 실시간 사진대지 셈(web/src/lib/사진잇기셈.js) · 규칙(web/database.rules.json pb_*) — G493 (2026-11-01)
 *   node tools/시험_사진잇기.mjs   (인터넷 · 파이어베이스 · web/node_modules 없이 — 순수 함수만 → PC 올리기 bat 시험에도 넣음)
 *   ① 합치기pb — 서버 차례 그대로 + 이 기기만의 사진은 뒤에 · 값은 값때 늦은 쪽 · 그림은 그림때 늦은 쪽 · 설정은 설정때 늦은 쪽
 *   ② 묘비(지움) — 어느 기기가 지운 사진은 다른 기기 목록에 있어도 되살아나지 않음 · 30일 지난 묘비는 정리
 *   ③ 할일 · 받을사진 · 사진 id(때를 읽을 수 있음 · 규칙 꼴에 맞음)
 *   ④ 규칙 — pb_pins · pb_keys · pb_books · pb_doc · pb_pic 이 bj_* 와 같은 문 · pic s ≤ 1,500,000 · 사진둘날 = 매일 정리와 같음
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { 합치기pb, 할일, 받을사진, 새사진id, 사진id때, 사진둘날, 묘비둘날, 최대사진글, 최대상태글, 사진잇기들 } from '../web/src/lib/사진잇기셈.js'   /* 순수 — node_modules 없이(PC bat 에서도) */

const 여기 = path.dirname(fileURLToPath(import.meta.url))
let 통과 = 0, 실패 = 0
const 확인 = (이름, 참, 더 = '') => { if (참) { 통과++; console.log('  ✔', 이름) } else { 실패++; console.log('  ✘', 이름, typeof 더 === 'string' ? 더 : JSON.stringify(더)) } }
const 날 = 86400000
const 지금 = 1790000000000
const 사진 = (id, 더 = {}) => ({ id, 이름: id + '.jpg', 때: '2026-11-01 09:00', 너비: 1600, 높이: 1200, 값: {}, 새쪽: false, 값때: 0, 그림때: 100, ...더 })

/* ① 합치기 */
console.log('① 합치기pb')
{
  const 서버 = { 설정: { 공사명: '서버' }, 차례: '때', 설정때: 10, 목록: [사진('a'), 사진('b', { 값: { n: '서버글' }, 값때: 50 }), 사진('c')], 지움: {} }
  const 내것 = { 설정: { 공사명: '내것' }, 설정때: 20, 차례: '그대로', 목록: [사진('b', { 값: { n: '내글' }, 값때: 70 }), 사진('a', { 그림때: 900, 너비: 1200, 높이: 1600 }), 사진('d')], 지움: {} }
  const 합 = 합치기pb(서버, 내것, 지금)
  확인('서버 차례(a b c) 그대로 + 이 기기만의 d 는 뒤에', 합.목록.map((p) => p.id).join('') === 'abcd', 합.목록.map((p) => p.id))
  확인('b 의 값은 값때가 늦은 이 기기 것(내글)', 합.목록[1].값.n === '내글' && 합.목록[1].값때 === 70)
  확인('a 의 그림은 그림때가 늦은 이 기기 것(돌림 1200×1600)', 합.목록[0].너비 === 1200 && 합.목록[0].높이 === 1600 && 합.목록[0].그림때 === 900)
  확인('설정 · 차례는 설정때가 늦은 이 기기 것', 합.설정.공사명 === '내것' && 합.차례 === '그대로' && 합.설정때 === 20)
  const 합2 = 합치기pb(내것, 서버, 지금)
  확인('거꾸로(서버 ← 내것)도 d 는 뒤 · 값 · 그림 · 설정은 같은 결론', 합2.목록.map((p) => p.id).join('') === 'badc' && 합2.목록.find((p) => p.id === 'b').값.n === '내글' && 합2.설정.공사명 === '내것')
  확인('서버가 비면(처음) 이 기기 것 그대로', 합치기pb(null, 내것, 지금).목록.length === 3 && 합치기pb({}, 내것, 지금).설정.공사명 === '내것')
  확인('이 기기가 비면 서버 것 그대로', 합치기pb(서버, null, 지금).목록.length === 3)
  확인('같은 것끼리 합치면 그대로(멱등)', JSON.stringify(합치기pb(합, 합, 지금).목록) === JSON.stringify(합.목록))
}

/* ② 묘비 */
console.log('② 지움(묘비)')
{
  const 서버 = { 설정: {}, 차례: '때', 설정때: 0, 목록: [사진('a'), 사진('b'), 사진('c')], 지움: {} }
  const 폰 = { ...서버, 목록: [사진('a'), 사진('c')], 지움: { b: 지금 - 1000 } }           // 폰이 b 를 지움
  const 합 = 합치기pb(서버, 폰, 지금)
  확인('폰이 지운 b 는 서버 목록에 있어도 안 살아남', 합.목록.map((p) => p.id).join('') === 'ac' && 합.지움.b === 지금 - 1000)
  const PC = { ...서버, 목록: [사진('a'), 사진('b'), 사진('c')], 지움: {} }                  // PC 는 아직 b 를 가짐
  const 합PC = 합치기pb(합, PC, 지금)
  확인('PC 가 합쳐도 b 는 묘비 덕에 다시 안 들어감', 합PC.목록.map((p) => p.id).join('') === 'ac')
  const 오래 = { ...서버, 목록: [], 지움: { a: 지금 - (묘비둘날 + 1) * 날, b: 지금 - 2 * 날 } }
  const 합3 = 합치기pb(오래, { 목록: [사진('a'), 사진('b')] }, 지금)
  확인(`${묘비둘날}일 지난 묘비(a)는 정리되고 2일 된 묘비(b)는 남음`, !합3.지움.a && 합3.지움.b && 합3.목록.map((p) => p.id).join('') === 'a')
}

/* ③ 할일 · 받을사진 · id */
console.log('③ 할일 · 받을사진 · 사진 id')
{
  확인('할일 — 서버 없음 · 같음 · 올림 · 받음 · 합침', 할일(null, 0, true) === '없음' && 할일(3, 3, false) === '같음' && 할일(3, 3, true) === '올림' && 할일(4, 3, false) === '받음' && 할일(4, 3, true) === '합침')
  const 있는 = new Map([['a', { 그림때: 100 }], ['b', { 그림때: 50 }]])
  확인('받을사진 — 없는 것(c) · 낡은 것(b 그림때 50 < 100)만', 받을사진([사진('a'), 사진('b'), 사진('c')], 있는).join('') === 'bc')
  const id = 새사진id()
  확인('새 사진 id 는 «때(36진)-기기차례난수» 꼴 · 규칙 꼴(^[0-9a-z]+-[mp][0-9a-z]+$ · ≤ 30)', /^[0-9a-z]+-[mp][0-9a-z]+$/.test(id) && id.length <= 30, id)
  확인('id 에서 때를 읽음(지금과 1분 안)', Math.abs(사진id때(id) - Date.now()) < 60000, id)
  확인('이상한 id 는 null', 사진id때('weird') === null && 사진id때('') === null && 사진id때(null) === null)
  const 둘 = new Set(Array.from({ length: 200 }, () => 새사진id()))
  확인('200개 만들어도 겹치지 않음', 둘.size === 200)
}

/* ④ 규칙 · 매일 정리와 맞음 */
console.log('④ 규칙 · 매일 정리')
{
  const 글 = fs.readFileSync(path.join(여기, '../web/database.rules.json'), 'utf8')
  const 규칙 = JSON.parse(글.replace(/^\s*\/\/.*$/gm, '')).rules
  for (const k of ['pb_pins', 'pb_keys', 'pb_books', 'pb_doc', 'pb_pic']) 확인(`규칙 ${k} 있음`, !!규칙[k])
  const 문 = (s) => String(s).replace(/pb_/g, 'bj_')
  확인('pb_doc 문(.read/.write/.validate)은 bj_doc 과 같음', 문(규칙.pb_doc.$c['.read']) === 규칙.bj_doc.$c['.read'] && 문(규칙.pb_doc.$c['.write']) === 규칙.bj_doc.$c['.write'] && JSON.stringify(규칙.pb_doc.$c.s) === JSON.stringify(규칙.bj_doc.$c.s) && JSON.stringify(규칙.pb_doc.$c.r) === JSON.stringify(규칙.bj_doc.$c.r))
  확인('pb_books · pb_pins · pb_keys 도 bj 와 같음', 문(JSON.stringify(규칙.pb_books)) === JSON.stringify(규칙.bj_books) && 문(JSON.stringify(규칙.pb_pins)) === JSON.stringify(규칙.bj_pins) && 문(JSON.stringify(규칙.pb_keys)) === JSON.stringify(규칙.bj_keys))
  const pic = 규칙.pb_pic.$c
  확인('pb_pic 은 같은 문 · 사진 한 장 s ≤ 1,500,000 · v1. 로 시작 · 다른 칸 못 넣음', 문(pic['.read']) === 규칙.bj_doc.$c['.read'] && /1500000/.test(pic.$id.s['.validate']) && /beginsWith\('v1\.'\)/.test(pic.$id.s['.validate']) && pic.$id.$other['.validate'] === false)
  확인('pb_pic 의 id 꼴 규칙이 새사진id 와 맞음', /\^\[0-9a-z\]\+-\[mp\]\[0-9a-z\]\+\$/.test(pic.$id['.validate']) && new RegExp('^[0-9a-z]+-[mp][0-9a-z]+$').test(새사진id()))
  확인('최대사진글(1,450,000) < 규칙 1,500,000 · 최대상태글(2,900,000) < 규칙 3,000,000', 최대사진글 < 1500000 && 최대상태글 < 3000000)
  const 백업 = fs.readFileSync(path.join(여기, '공사일보백업.py'), 'utf8')
  확인(`매일 정리의 사진둘날 = ${사진둘날} (사진잇기.js 와 같음) · pb 묶음 · pb_pic 딸림자리`, new RegExp(`사진둘날 = ${사진둘날}\\b`).test(백업) && /"ns": "pb"/.test(백업) && /"딸림자리": \["pb_pic"\]/.test(백업))
  확인('ns 는 pb 하나(서식 사진 칸 · 사진대지 도구는 그대로)', 사진잇기들.length === 1 && 사진잇기들[0] === 'pb')
}

console.log(실패 ? `✘ ${실패} 틀림 · ${통과} 맞음` : `✔ 모두 맞음(${통과})`)
process.exit(실패 ? 1 : 0)
