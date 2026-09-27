// 🛣 횡단면도 → 3D 시험 — node tools/시험_횡단3d.mjs
// 가상 횡단면 3장(도면에 m 로 그린 것)을 메모리에서 만들어, 측점·지반고로 높이를 맞추는지 봅니다. (실제 공사 도면이 아닙니다)
import path from 'path'
import { fileURLToPath } from 'url'
const 여기 = path.dirname(fileURLToPath(import.meta.url))
const W = path.join(여기, '..', 'web', 'src', 'lib')
const { F64, U8 } = await import(path.join(W, 'dxf3d.js'))
const { 횡단세우기, 측점m } = await import(path.join(W, '횡단3d.js'))

let 틀림 = 0
const 봄 = (이름, 참, 더 = '') => { if (!참) 틀림++; console.log((참 ? '  ✓ ' : '  ✗ ') + 이름 + (더 ? ' — ' + 더 : '')) }
const 새버킷 = () => ({ pos: new F64(), col: new U8(), pts: new F64(64), pcol: new U8(64) })

봄('측점 NO.1+10.15 = 30.15m', Math.abs(측점m('1+10.15', true) - 30.15) < 1e-9)
봄('측점 NO.3 = 60m', 측점m('NO.3') === 60)
봄('측점 STA.0+120 = 120m', 측점m('STA.0+120') === 120)
봄('측점 0+020.000 = 20m', 측점m('0+020.000') === 20)

/* 가상 도면: 열 하나에 단면 3장이 아래에서 위로 — 표(측점·지반고·계획고)가 단면 아래 */
const texts = [], out = new Map()
const 선 = (ly, x1, y1, x2, y2) => { let b = out.get(ly); if (!b) { b = 새버킷(); out.set(ly, b) } b.pos.push6(x1, y1, 0, x2, y2, 0); b.col.push3(255, 0, 0); b.col.push3(255, 0, 0) }
const 글 = (s, x, y) => texts.push({ s, x, y, z: 0, h: 0.45, ly: 'TEXT' })
const 단면들 = [['0+0.00', 2.0, 1.5], ['1+0.00', 2.4, 1.5], ['2+0.00', 3.1, 1.5]]
단면들.forEach(([측, 지반고, 계획고], k) => {
  const y표 = k * 30             // 표 맨 윗줄
  글('N  O  .', -4, y표); 글(측, -2, y표)
  글('지  반  고', -8, y표 - 1.3); 글(String(지반고), -4, y표 - 1.3)
  글('계  획  고', 0, y표 - 1.3); 글(String(계획고), 4, y표 - 1.3)
  const yg = y표 + 8             // 단면: 지반선은 중심(x=0)에서 yg
  선('지반선', -20, yg - 1, 0, yg); 선('지반선', 0, yg, 20, yg + 1)
  선('계획선', -10, yg - 1, -5, yg - 3); 선('계획선', -5, yg - 3, 5, yg - 3); 선('계획선', 5, yg - 3, 10, yg - 1)
  선('TICK', 0, yg - 0.5, 0, yg + 0.5)
})
/* 옆 열(같은 측점 사본이 아니라 다른 도면 조각) — 폭 짐작용 */
글('N  O  .', 116, 0); 글('9+0.00', 118, 0); 글('지  반  고', 112, -1.3); 글('9.9', 116, -1.3)
const r = 횡단세우기({ texts, out }, 새버킷)
봄('단면 세 장을 찾음(옆 열 것은 선이 없어 빠짐)', r && r.단면.filter((s) => s.측 < 100).length === 3, r ? r.단면.map((s) => s.이름).join(', ') : 'null')
봄('측점 순서 0 → 40 m', r && r.시작 === 0 && r.단면.some((s) => s.측 === 40))
// 지반선이 중심에서 지반고와 같은 높이인가 — 첫 단면(측점 0)의 지반선 조각 z
const 땅0 = r && [...r.out].find(([k]) => k === 'NO.0+0.00\u0001지반선')
const z중심 = 땅0 ? (() => { const a = 땅0[1].pos.a; for (let i = 0; i < 땅0[1].pos.n; i += 3) if (Math.abs(a[i + 1]) < 1e-6) return a[i + 2] / 1000; return NaN })() : NaN
봄('중심(가로 0)의 지반선 높이 = 지반고 2.0 m', Math.abs(z중심 - 2.0) < 1e-6, String(z중심))
const 계2 = r && [...r.out].find(([k]) => k === 'NO.2+0.00\u0001계획선')
const z바닥 = 계2 ? Math.min(...Array.from({ length: 계2[1].pos.n / 3 }, (_, j) => 계2[1].pos.a[j * 3 + 2])) / 1000 : NaN
봄('셋째 단면 계획선 바닥 = 3.1 − 3 = 0.1 m', Math.abs(z바닥 - 0.1) < 1e-6, String(z바닥))
const 땅면 = r && r.out.get('땅 면\u0001땅 면')
봄('땅 면(이웃 단면 잇기) 세모가 생김', 땅면 && 땅면.tri && 땅면.tri.n > 0)
봄('측점이 가로(X) 축 — 둘째 단면 X = 20 m', r && [...r.out].some(([k, b]) => k.startsWith('NO.1+0.00') && Math.abs(b.pos.a[0] - 20000) < 1e-6))
console.log(틀림 ? `✗ ${틀림}` : '✓ 모두 맞음')
process.exit(틀림 ? 1 : 0)
