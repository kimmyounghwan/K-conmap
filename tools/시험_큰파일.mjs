/* 🧪 G243 큰 도면 파일 — 소장님 「파일을 못 읽고 멈췄을때 해결 방안도 만들어서 프로그램이 작동하도록」 · 「반드시 다 읽게해」
 *  ① 아주 큰 DXF 는 줄 끝에서 끊은 조각글로 풀어도 읽은 결과가 한 글자열과 «한 자리도» 같음(골조 · 3D · PDF 읽기 셋)
 *  ② 조각글 slice · 섞인 글(UTF-8 + EUC-KR 줄) · 조각 경계  ③ 파일 한도(PC 2 GB · 폰 200 MB)  ④ 일꾼 멈춤 감시 */
import fs from 'fs'
import { decodeBytes, parseDxf, 조각글 } from '../web/src/lib/dxf3d.js'
import { 도면읽기 } from '../web/src/lib/골조도면.js'
import { parsePlot } from '../web/src/lib/dxfplot.js'
import { 파일한도, 멈춤감시 } from '../web/src/lib/파일한도.js'
let bad = 0
const ok = (이름, 참, 값) => { console.log((참 ? '  ✓ ' : '  ✗ ') + 이름 + (참 ? '' : ' = ' + JSON.stringify(값).slice(0, 300))); if (!참) bad++ }
const 같음 = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const 배 = (v) => Array.from(v)

console.log('① 조각글로 읽어도 같음')
for (const 길 of ['../web/public/jeoksan/골조자동_예시.dxf', '../web/public/tools/files/ex-building-plan.dxf']) {
  const b = fs.readFileSync(new URL(길, import.meta.url)); const buf = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)
  const A = decodeBytes(buf), B = decodeBytes(buf, 4096, 0)
  const 이름 = 길.split('/').pop()
  ok(이름 + ' — 조각 여럿(' + B.조각.length + ') · 길이 같음 · 앞 2만 자 같음', B instanceof 조각글 && B.조각.length > 10 && A.length === B.length && A.slice(0, 20000) === B.slice(0, 20000), [B.조각 && B.조각.length, A.length, B.length])
  const M1 = 도면읽기(A), M2 = 도면읽기(B)
  ok(이름 + ' — 골조 읽기 같음(도형 · 점 · 글자 · 층)', 같음([배(M1.E.t), 배(M1.P), M1.T.s, M1.layers.map((l) => l.name)], [배(M2.E.t), 배(M2.P), M2.T.s, M2.layers.map((l) => l.name)]))
  const r1 = parseDxf(A, null, { raw: true }), r2 = parseDxf(B, null, { raw: true })
  ok(이름 + ' — 3D 읽기 같음(선 · 글자 · 층)', 같음([r1.stats, r1.texts, [...r1.out].map(([k, v]) => [k, 배(v.pos.a.subarray(0, v.pos.n))])], [r2.stats, r2.texts, [...r2.out].map(([k, v]) => [k, 배(v.pos.a.subarray(0, v.pos.n))])]))
  const p1 = parsePlot(A), p2 = parsePlot(B)
  ok(이름 + ' — PDF 읽기 같음(글자 · 판 · 통계)', 같음([p1.stats, p1.texts.length, p1.frames, p1.box], [p2.stats, p2.texts.length, p2.frames, p2.box]))
}

console.log('② 조각글 slice · 섞인 글 · 경계')
{
  const 글 = Array.from({ length: 3000 }, (_, i) => 'line' + i + (i % 7 === 0 ? ' 한글' : '')).join('\n') + '\n'
  const u8 = new TextEncoder().encode(글)
  const C = decodeBytes(u8.buffer, 1000, 0)
  let 맞 = C.length === 글.length
  for (const [a, b] of [[0, 10], [990, 1010], [5, 4000], [글.length - 20, 글.length + 50], [1234, 1234]]) if (C.slice(a, b) !== 글.slice(a, b)) 맞 = false
  ok('slice 가 조각 경계를 넘어도 글자열과 같음 · 조각은 줄 끝에서 끊김', 맞 && C.조각.every((t) => t.endsWith('\n')), C.조각.length)
  /* EUC-KR 줄이 섞인 파일 — 조각마다 줄 단위로 풀어 한 번에 푼 것과 같음 */
  const euc = [0xc7, 0xd1, 0xb1, 0xdb]     // «한글» EUC-KR
  const 줄들 = []
  for (let i = 0; i < 400; i++) { 줄들.push(...new TextEncoder().encode('  8\n')); if (i % 50 === 3) 줄들.push(...euc, 10); else 줄들.push(...new TextEncoder().encode('층' + i + '\n')) }
  const 섞 = new Uint8Array(줄들)
  const 한번 = decodeBytes(섞.buffer), 조각 = decodeBytes(섞.buffer, 300, 0)
  ok('섞인 글(UTF-8 + EUC-KR 줄) — 조각으로 풀어도 같음 · «한글» 깨지지 않음', 한번 === 조각.toString() && 한번.includes('한글') && !한번.includes('�'), [한번.length, 조각.length])
  ok('BOM 은 첫 조각에서만 뗌', decodeBytes(new Uint8Array([0xef, 0xbb, 0xbf, ...new TextEncoder().encode('0\nSECTION\n'.repeat(100))]).buffer, 64, 0).slice(0, 9) === '0\nSECTION')
}

console.log('③ 파일 한도')
{
  const 옛 = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
  const 놓기 = (n) => Object.defineProperty(globalThis, 'navigator', { value: n, configurable: true, writable: true })
  놓기({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/141', deviceMemory: 8 }); const pc = 파일한도()
  놓기({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0) Mobile/15E148' }); const 폰 = 파일한도()
  놓기({ userAgent: 'Mozilla/5.0 (X11; Linux x86_64) Chrome/141', deviceMemory: 2 }); const 작은 = 파일한도()
  if (옛) Object.defineProperty(globalThis, 'navigator', 옛)
  ok('PC 2 GB(243 MB DXF 도 받음) · 폰 · 기억 2 GB 기기 200 MB', pc === 2000 * 1024 * 1024 && 폰 === 200 * 1024 * 1024 && 작은 === 200 * 1024 * 1024 && pc > 243401172, [pc, 폰, 작은])
}

console.log('④ 일꾼 멈춤 감시')
{
  const 기다림 = (ms) => new Promise((z) => setTimeout(z, ms))
  let 멈춤1 = 0, 멈춤2 = 0
  const a = 멈춤감시(() => { 멈춤1++ }, 0.3)
  const b = 멈춤감시(() => { 멈춤2++ }, 0.3)
  for (let i = 0; i < 8; i++) { await 기다림(100); b.깨움() }       // b 는 계속 말이 옴
  await 기다림(300)
  const 그때 = [멈춤1, 멈춤2]
  b.끝(); a.끝()
  await 기다림(600)
  ok('말이 없으면 한 번 멈춤 · 말이 오는 동안은 안 멈춤 · 끝() 뒤엔 안 부름', 그때[0] === 1 && 그때[1] === 0 && 멈춤1 === 1 && 멈춤2 <= 1, [그때, 멈춤1, 멈춤2])
}

console.log(bad ? '✗ ' + bad + '개 틀림' : '✓ 모두 맞음')
process.exit(bad ? 1 : 0)
