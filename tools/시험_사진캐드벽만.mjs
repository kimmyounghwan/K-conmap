/**
 * 🧱 사진 → 캐드 · 칠한 평면도 «벽 · 치수만» 시험 (2026-10-21) — node tools/시험_사진캐드벽만.mjs (인터넷 · 글 읽기 모델 없이)
 *   소장님 폰 사진(분양 평면도: 회색 바닥 · 가구 · 방 번호 원 · 숫자 자리에서 끊긴 치수선)이 선 1000 개 넘게 엉켜 나온 것을 고친 것.
 *   ① 지어낸 칠한 평면도(벽 · 바닥 무늬 · 침대 · 책상 · 방 번호 원 · 끊긴 치수선 «16,000» «36,000» · 축척대로 안 그림)
 *      → 저절로 «칠한 평면도» · 벽만 · 그린 벽을 거의 다 찾음 · 원 속에 선 없음 · 선 수가 «다 뽑기» 보다 훨씬 적음
 *      → 전체 치수 둘 다 씀 · 방향마다 척(16,000 ÷ 그림 폭 · 36,000 ÷ 그림 높이) · 비율차 알림
 *   ② 손그림 · «벽만 끔» 은 예전 그대로 ③ 치수짝짓기: 숫자 자리에서 끊긴 두 토막 = 한 치수선 · 다른 줄 토막은 안 묶음
 *   ④ 치수풀기: 전체 치수(가로 · 세로 · 또렷 · 둘레 60 % 넘게)는 그림 비율과 달라도 씀 · 믿음 낮으면 안 씀 · 범위 없으면 예전 그대로
 */
// 그림 그리기(①)는 @napi-rs/canvas 가 있을 때만(클라우드 시험) — PC 올리기 bat 의 임시 폴더에는 없으므로 ③ ④(짝짓기 · 전체 치수)만
const 캔버스 = await import('../web/node_modules/@napi-rs/canvas/index.js').catch(() => null)
import { 밝기판 } from '../web/src/lib/사진캐드_펴기.js'
import { 도면읽기, 맞추기 } from '../web/src/lib/사진캐드_흐름.js'
import { 잉크뽑기, 칠한평면 } from '../web/src/lib/사진캐드_잉크.js'
import { 치수짝짓기, 치수풀기 } from '../web/src/lib/사진캐드_치수.js'

let 통과 = 0, 실패 = 0
const 봄 = (n, ok, 더 = '') => { ok ? 통과++ : 실패++; console.log(ok ? '  ✓' : '  ✗', n, 더) }
let 씨 = 7
const 난 = () => { 씨 = (씨 * 1103515245 + 12345) & 0x7fffffff; return 씨 / 0x7fffffff }

if (!캔버스) console.log('  (그림 시험 ① ② 건너뜀 — @napi-rs/canvas 없음 · 클라우드에서 돌림)')
else {
/* ── ① 지어낸 칠한 평면도 ── */
const W = 1500, H = 2100
const X0 = 150, X1 = 1350, Y0 = 250, Y1 = 2050          // 건물 둘레(그림 폭 1200 = 16,000 · 높이 1800 = 36,000 → 축척대로 아님: 세로 1.5 배)
const 복0 = 690, 복1 = 810                               // 복도 두 벽
const 두 = 14
const cv = 캔버스.createCanvas(W, H), g = cv.getContext('2d')
g.fillStyle = '#f3f3f1'; g.fillRect(0, 0, W, H)
g.fillStyle = '#c4c4c4'; g.fillRect(X0, Y0, X1 - X0, Y1 - Y0)            // 바닥
for (let y = Y0; y < Y1; y += 28) { g.fillStyle = '#ababab'; g.fillRect(X0, y + 14, X1 - X0, 14) }   // 바닥 무늬(마루 줄)
for (let i = 0; i < 26000; i++) { const v = 140 + Math.round(난() * 80); g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(X0 + 난() * (X1 - X0), Y0 + 난() * (Y1 - Y0), 3, 3) }
for (let i = 0; i < 700; i++) { g.fillStyle = '#fbfbfb'; g.beginPath(); g.ellipse(X0 + 난() * (X1 - X0), Y0 + 난() * (Y1 - Y0), 9 + 난() * 14, 7 + 난() * 10, 0, 0, Math.PI * 2); g.fill() }   // 흰 변기 · 세면대 · 베개 같은 밝은 것들
const 벽들 = []   // [x1,y1,x2,y2] 가운데 줄
const 벽 = (x1, y1, x2, y2) => { 벽들.push([x1, y1, x2, y2]); g.fillStyle = '#262626'; g.fillRect(Math.min(x1, x2) - 두 / 2, Math.min(y1, y2) - 두 / 2, Math.abs(x2 - x1) + 두, Math.abs(y2 - y1) + 두) }
벽(X0, Y0, X1, Y0); 벽(X0, Y1, X1, Y1); 벽(X0, Y0, X0, Y1); 벽(X1, Y0, X1, Y1)
const 방높 = (Y1 - Y0) / 5
const 원들 = []
for (let k = 0; k < 5; k++) {
  const t = Y0 + k * 방높
  if (k) { 벽(X0, t, 복0, t); 벽(복1, t, X1, t) }
  // 복도 벽: 방마다 문(90) 자리만 비움
  벽(복0, t, 복0, t + 40); 벽(복0, t + 130, 복0, t + 방높)
  벽(복1, t, 복1, t + 40); 벽(복1, t + 130, 복1, t + 방높)
  // 화장실 칸막이
  벽(X0 + 170, t, X0 + 170, t + 150); 벽(X1 - 170, t, X1 - 170, t + 150)
  for (const [x, 거울] of [[X0, false], [복1, true]]) {
    // 침대 · 책상(칠한 가구 · 진한 테두리)
    const bx = 거울 ? X1 - 330 : X0 + 120
    g.fillStyle = '#8c8c8c'; g.fillRect(bx, t + 190, 200, 110); g.strokeStyle = '#4a4a4a'; g.lineWidth = 5; g.strokeRect(bx, t + 190, 200, 110)
    g.fillStyle = '#9d9d9d'; g.fillRect(bx + 20, t + 310, 160, 40); g.strokeRect(bx + 20, t + 310, 160, 40)
    // 방 번호 원(진하게 칠한 원 · 흰 글씨)
    const cx = 거울 ? 복1 + 250 : 복0 - 250, cy = t + 250
    g.fillStyle = '#202020'; g.beginPath(); g.arc(cx, cy, 46, 0, Math.PI * 2); g.fill()
    g.fillStyle = '#f5f5f5'; g.font = 'bold 34px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(`${k + (거울 ? 1 : 6)}실`, cx, cy)
    원들.push([cx, cy, 46])
    void x
  }
}
// 치수선(가는 선 · 숫자 자리에서 끊김 · 끝 보조선)
g.strokeStyle = '#333'; g.lineWidth = 2.5
const 선 = (a, b, c, d) => { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke() }
선(X0, 170, 680, 170); 선(820, 170, X1, 170); 선(X0, 145, X0, 215); 선(X1, 145, X1, 215)
선(1440, Y0, 1440, 1080); 선(1440, 1220, 1440, Y1); 선(1415, Y0, 1475, Y0); 선(1415, Y1, 1475, Y1)
g.fillStyle = '#333'; g.font = '40px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'
g.fillText('16,000', 750, 168)
g.save(); g.translate(1440, 1150); g.rotate(-Math.PI / 2); g.fillText('36,000', 0, 0); g.restore()
const 판 = 밝기판(new Uint8ClampedArray(g.getImageData(0, 0, W, H).data), W, H)
// 글 읽기(PaddleOCR) 대신 상자를 손으로 — 실제 글 읽기 꼴 그대로(c · u · L · W · 믿음 · 방향) · 방 번호 원 속 «769» 같은 잘못 읽음도
const 글목록 = [
  { 글: '16,000', 믿음: 0.96, c: [750, 168], u: [1, 0], 방향: [1, 0], L: 130, W: 44 },
  { 글: '36,000', 믿음: 0.97, c: [1440, 1150], u: [0, -1], 방향: [0, 1], L: 130, W: 44 },
  { 글: '769', 믿음: 0.75, c: [원들[0][0], 원들[0][1]], u: [1, 0], 방향: [1, 0], L: 60, W: 40 },
  { 글: '91', 믿음: 0.62, c: [원들[3][0], 원들[3][1]], u: [1, 0], 방향: [1, 0], L: 50, W: 40 },
]
const 잉 = 잉크뽑기(판, {})
const 칠 = 칠한평면(잉)
봄(`칠한 평면도 알아봄 — 덮임 ${칠.덮임.toFixed(2)} · 대비 가운데값 ${칠.가운데}`, 칠.칠함)
const 결 = 도면읽기(판, { 글목록, 숫자읽기: false })
const 다 = 도면읽기(판, { 글목록, 숫자읽기: false, 벽만: false })
const 선들 = 결.도형.filter((s) => s.t === 'L'), 다선 = 다.도형.filter((s) => s.t === 'L')
봄(`저절로 벽만 · 선 ${선들.length} (다 뽑기 ${다선.length})`, 결.벽만 === true && 결.칠함 === true && 다.벽만 === false && 선들.length * 2 <= 다선.length && 선들.length <= 2 * 벽들.length + 12)
// 반듯한 판 좌표 → 원래 그림 좌표(돌림 되돌림)
const θ = (결.돌림각 || 0) * Math.PI / 180, C = 결.가운데 || [0, 0]
const 되 = (p) => { const x = p[0] - C[0], y = p[1] - C[1]; return [C[0] + x * Math.cos(θ) - y * Math.sin(θ), C[1] + x * Math.sin(θ) + y * Math.cos(θ)] }
const 원선 = 선들.map((s) => [되(s.a), 되(s.b)])
const 덮음 = ([x1, y1, x2, y2]) => {
  const L = Math.hypot(x2 - x1, y2 - y1), 가로 = Math.abs(y2 - y1) < 1
  let 덮 = 0
  for (let t = 0; t <= L; t += 4) {
    const px = x1 + ((x2 - x1) * t) / L, py = y1 + ((y2 - y1) * t) / L
    if (원선.some(([a, b]) => {
      if (가로 ? Math.abs(a[1] - b[1]) > 4 : Math.abs(a[0] - b[0]) > 4) return false
      const 옆 = 가로 ? Math.abs((a[1] + b[1]) / 2 - py) : Math.abs((a[0] + b[0]) / 2 - px)
      const s0 = 가로 ? Math.min(a[0], b[0]) : Math.min(a[1], b[1]), s1 = 가로 ? Math.max(a[0], b[0]) : Math.max(a[1], b[1]), v = 가로 ? px : py
      return 옆 <= 두 && v >= s0 - 두 && v <= s1 + 두
    })) 덮 += 4
  }
  return 덮 / Math.max(4, L)
}
const 덮들 = 벽들.map(덮음)
const 찾은 = 덮들.filter((x) => x >= 0.7).length
봄(`그린 벽 ${벽들.length} 가운데 ${찾은} 을 찾음(길이 70 % 넘게 덮음)`, 찾은 >= 0.9 * 벽들.length, 덮들.map((x) => x.toFixed(2)).join(' '))
const 원속 = 원선.filter(([a, b]) => { const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; return 원들.some(([x, y, r]) => Math.hypot(m[0] - x, m[1] - y) < r) })
봄('방 번호 원 속에 선 없음', 원속.length === 0, JSON.stringify(원속.slice(0, 3)))
봄('잘못 읽은 방 번호(«769» «91»)는 숫자로 안 씀', 결.숫자.every((n) => n.글 !== '769' && n.글 !== '91') && 결.숫자.length === 2, 결.숫자.map((n) => n.글).join(' '))
const 풀 = 맞추기(결)
const 쓴 = 풀.치수들.filter((d) => d.쓰임)
const 가 = 쓴.find((d) => d.꼴 === 'H'), 세 = 쓴.find((d) => d.꼴 === 'V')
봄(`끊긴 치수선 짝 · 전체 치수 둘 다 씀(${쓴.map((d) => d.글 + ' ' + Math.round(d.a) + '~' + Math.round(d.b)).join(' / ')})`, 쓴.length === 2 && 가 && 세 && 가.mm === 16000 && 세.mm === 36000 && 가.선2 >= 0 && 세.선2 >= 0)
봄(`방향마다 척 — 가로 ${풀.척x.toFixed(2)} (바람 ${(16000 / 1200).toFixed(2)}) · 세로 ${풀.척y.toFixed(2)} (바람 ${(36000 / 1800).toFixed(2)})`, Math.abs(풀.척x / (16000 / 1200) - 1) < 0.03 && Math.abs(풀.척y / (36000 / 1800) - 1) < 0.03)
봄(`비율차 알림 ${풀.비율차 && 풀.비율차.toFixed(2)} (바람 1.50)`, 풀.비율차 && Math.abs(풀.비율차 - 1.5) < 0.06)
const 손 = 도면읽기(판, { 글목록, 숫자읽기: false, 손그림: true })
봄('손그림은 벽만 안 함(예전 그대로)', 손.벽만 === false && 손.칠함 === false)

}

/* ── ③ 치수짝짓기 — 끊긴 두 토막 ── */
const L = (a, b) => ({ t: 'L', a, b, 꼴: a[1] === b[1] ? 'H' : 'V' })
const 도 = [L([0, 100], [400, 100]), L([600, 100], [1000, 100]), L([0, 80], [0, 120]), L([1000, 80], [1000, 120])]
const n = { c: [500, 80], 꼴: 'H', 높이: 30, 값: 5000, 믿음: 0.95, 돌림: 0, 글: '5,000', 글길: 120 }
const 짝 = 치수짝짓기([n], 도, [], { 굵: 2, 끊긴선: true })
봄(`끊긴 치수선 두 토막 → a 0 · b 1000 (${짝.map((d) => d.a + '~' + d.b + ' 선' + d.선 + '/' + d.선2).join(' ')})`, 짝.length === 1 && 짝[0].a === 0 && 짝[0].b === 1000 && 짝[0].선 === 0 && 짝[0].선2 === 1)
const 도2 = [L([0, 100], [400, 100]), L([600, 160], [1000, 160])]
봄('다른 줄 토막은 안 묶음', 치수짝짓기([n], 도2, [], { 굵: 2, 끊긴선: true }).every((d) => !(d.a === 0 && d.b === 1000)))
봄('선 도면(끊긴선 끔)은 예전 그대로 — 끊긴 토막을 안 묶음', 치수짝짓기([n], 도, [], { 굵: 2 }).length === 0)
const 도4 = [L([0, 100], [400, 100]), L([600, 100], [640, 100])]
봄('글보다 아주 짧은 토막은 치수선으로 안 묶음', 치수짝짓기([n], 도4, [], { 굵: 2, 끊긴선: true }).length === 0)
const 도3 = [L([0, 100], [1000, 100])]
const 짝3 = 치수짝짓기([n], 도3, [], { 굵: 2, 끊긴선: true })
봄('안 끊긴 치수선은 예전 그대로(선2 없음)', 짝3.length === 1 && 짝3[0].a === 0 && 짝3[0].b === 1000 && 짝3[0].선2 === undefined)

/* ── ④ 치수풀기 — 전체 치수 ── */
const 두치수 = (믿) => [
  { 값: 16000, 배수: [1], 꼴: 'H', 줄: 0, a: 0, b: 1200, 믿음: 믿, 글: '16,000' },
  { 값: 36000, 배수: [1], 꼴: 'V', 줄: 0, a: 0, b: 1800, 믿음: 믿, 글: '36,000' },
]
const P1 = 치수풀기(두치수(0.95), { 범위: { H: 1250, V: 1850 }, 크기px: 2000 })
봄(`전체 치수 가로 · 세로 → 둘 다 씀 · 척 ${P1.척x.toFixed(2)} · ${P1.척y.toFixed(2)} · 비율차 ${P1.비율차 && P1.비율차.toFixed(2)}`, P1.치수들.every((d) => d.쓰임 && d.전체) && Math.abs(P1.척x - 16000 / 1200) < 0.01 && Math.abs(P1.척y - 20) < 0.01 && Math.abs(P1.비율차 - 1.5) < 0.01)
const P2 = 치수풀기(두치수(0.6), { 범위: { H: 1250, V: 1850 }, 크기px: 2000 })
봄('믿음이 낮으면(0.6) 전체 치수로 안 봄', P2.치수들.every((d) => !d.전체) && !P2.비율차)
const P3 = 치수풀기(두치수(0.95), { 크기px: 2000 })
봄('범위를 안 주면 예전 그대로(전체 치수 없음)', P3.치수들.every((d) => !d.전체) && !P3.비율차)
const P4 = 치수풀기(두치수(0.95), { 범위: { H: 3000, V: 1850 }, 크기px: 3000 })
봄('그림 둘레의 60 % 안 되는 치수는 전체 치수 아님', P4.치수들.every((d) => !d.전체))
const P5 = 치수풀기([...두치수(0.95), { 값: 8000, 배수: [1], 꼴: 'H', 줄: 0, a: 0, b: 600, 믿음: 0.95, 글: '8,000' }], { 범위: { H: 1250, V: 1850 }, 크기px: 2000 })
봄('두 숫자가 같은 척으로 모이면 예전 그대로(전체 치수 규칙 안 씀)', P5.치수들.every((d) => !d.전체) && !P5.비율차)

console.log(`\n벽만 ${통과}/${통과 + 실패}`)
process.exit(실패 ? 1 : 0)
