/**
 * 🛣 G396 토목 탭 가상 예시 «측점 성과»(시공측량 꼴) 만들기 — web/public/jeoksan/BIM예시_측점성과.csv
 *   가상 배수로(BIM예시_*.dxf)를 도면 3D 일꾼으로 읽어 종단 표 지반고 = 설계지반고 · 시공 지반고 = 설계 + 정해 둔 작은 차(±3 cm 안 — 가상)
 *   node tools/토목탭_예시성과.mjs
 */
import fs from 'fs'
const 곳 = new URL('../web/public/jeoksan/', import.meta.url)
let 끝 = null
globalThis.self = { postMessage: (m) => { if (m.type !== 'prog') 끝 = m } }
await import('../web/src/lib/dxf3d.worker.js')
const 파일 = ['BIM예시_측량도면.dxf', 'BIM예시_계획평면도.dxf', 'BIM예시_종횡단면도.dxf', 'BIM예시_배수장일반도.dxf'].map((n) => { const b = fs.readFileSync(new URL(n, 곳)); return { name: n, buf: b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) } })
await self.onmessage({ data: { files: 파일 } })
const 활 = 끝.r.활용
const 종 = 활.종단[0]
const L = 활.노선.find((x) => x.이름 === 종.노선)
const 차 = [0.01, -0.02, 0, 0.03, -0.01, 0.02, -0.03, 0.01, 0, -0.02]
const 줄 = ['▣ 측량성과표(가상 배수로) — 가상 예시(실제 현장 아님)', '위치,설계지반고,시공측량 지반고,오차,비고']
종.줄.forEach((r, i) => {
  const n = Math.floor((r.m + 1e-6) / L.간격), d = r.m - n * L.간격
  const 위 = 'NO.' + n + (d > 0.005 ? '+' + d.toFixed(2) : '')
  const 시 = +(r.지반고 + 차[i % 차.length]).toFixed(2)
  줄.push([위, r.지반고.toFixed(2), 시.toFixed(2), (r.지반고 - 시).toFixed(2), ''].join(','))
})
fs.writeFileSync(new URL('BIM예시_측점성과.csv', 곳), '﻿' + 줄.join('\r\n') + '\r\n')
console.log('BIM예시_측점성과.csv', 종.노선, 줄.length - 2, '줄')
