/**
 * 📷 사진 → 캐드 · ④ 글자 — 잉크 덩이에서 글자(숫자 · 한글)를 가려 «낱말» 로 묶기 (2026-10-14 G287)
 *
 *   글자가르기(잉, 굵, o) — 작은 덩이를 후보로 → 가까이 줄지어 선 것끼리 낱말 → 낱말마다 가로/세로 쓰기 · 글자 높이
 *                         · 한 줄로 늘어선 가는 막대들은 «점선» (도형으로 돌려보냄)
 *                         · 홀로 있는 네모 · 막대(기둥 · 짧은 선)는 도형으로
 *   → { 낱말들: [{ 들:[덩이번호], 꼴:'H'|'V'|'?', 네모:[x0,y0,x1,y1], 높이, c:[x,y] }], 글자덩이: Set, 점선: [[덩이번호…]] }
 *
 * 참고: Lu 들 «Segmentation and recognition of dimensioning text from engineering drawings» —
 *       크기 · 줄 맞춤으로 글자 후보를 고르고 가로 · 세로 두 쓰기만 봄(도면 치수 글자는 둘 중 하나).
 */

import { 덩이 } from './사진캐드_잉크.js'

export function 글자가르기(잉, 굵, o = {}) {
  const { mask, w, h } = 잉
  const { lab, 덩이들 } = o.덩이 || 덩이(mask, w, h)
  const 긴 = Math.max(w, h)
  const 글자최대 = o.글자최대 ?? Math.max(10 * 굵, 0.04 * 긴)
  const 후보 = []
  덩이들.forEach((b, i) => {
    const bw = b.x1 - b.x0 + 1, bh = b.y1 - b.y0 + 1
    if (Math.max(bw, bh) <= 글자최대 && b.n >= 3) 후보.push(i)
  })
  // 칸 나누기(가까운 것만 견주기)
  const 칸크기 = 글자최대
  const 칸 = new Map()
  const 키 = (x, y) => `${Math.floor(x / 칸크기)},${Math.floor(y / 칸크기)}`
  for (const i of 후보) {
    const b = 덩이들[i], k = 키((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2)
    if (!칸.has(k)) 칸.set(k, []); 칸.get(k).push(i)
  }
  const 부모 = new Map(후보.map((i) => [i, i]))
  const 찾 = (i) => { while (부모.get(i) !== i) { 부모.set(i, 부모.get(부모.get(i))); i = 부모.get(i) } return i }
  const 잇 = (a, b) => { const x = 찾(a), y = 찾(b); if (x !== y) 부모.set(x, y) }
  const 작은점 = (b, 기준) => Math.max(b.x1 - b.x0 + 1, b.y1 - b.y0 + 1) < 0.42 * 기준
  for (const i of 후보) {
    const A = 덩이들[i]
    const cx = Math.floor(((A.x0 + A.x1) / 2) / 칸크기), cy = Math.floor(((A.y0 + A.y1) / 2) / 칸크기)
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const L = 칸.get(`${cx + dx},${cy + dy}`); if (!L) continue
      for (const j of L) {
        if (j <= i) continue
        const B = 덩이들[j]
        const ah = A.y1 - A.y0 + 1, bh = B.y1 - B.y0 + 1, aw = A.x1 - A.x0 + 1, bw = B.x1 - B.x0 + 1
        // 가로 이웃: 세로로 겹치고 가로 틈이 작음
        const 세겹 = Math.min(A.y1, B.y1) - Math.max(A.y0, B.y0) + 1
        const 가틈 = Math.max(A.x0, B.x0) - Math.min(A.x1, B.x1) - 1
        const 큰h = Math.max(ah, bh), 작h = Math.min(ah, bh)
        const 가로 = 가틈 <= 0.75 * 큰h && 가틈 >= -0.5 * 큰h &&
          ((세겹 >= 0.45 * 작h && 큰h <= 2.6 * 작h) || ((작은점(A, 큰h) || 작은점(B, 큰h)) && 세겹 >= -0.15 * 큰h))
        // 세로 이웃(돌려 쓴 글자 · 한글 받침)
        const 가겹 = Math.min(A.x1, B.x1) - Math.max(A.x0, B.x0) + 1
        const 세틈 = Math.max(A.y0, B.y0) - Math.min(A.y1, B.y1) - 1
        const 큰w = Math.max(aw, bw), 작w = Math.min(aw, bw)
        const 세로 = 세틈 <= 0.75 * 큰w && 세틈 >= -0.5 * 큰w &&
          ((가겹 >= 0.45 * 작w && 큰w <= 2.6 * 작w) || ((작은점(A, 큰w) || 작은점(B, 큰w)) && 가겹 >= -0.15 * 큰w))
        if (가로 || 세로) 잇(i, j)
      }
    }
  }
  const 무리 = new Map()
  for (const i of 후보) { const r = 찾(i); if (!무리.has(r)) 무리.set(r, []); 무리.get(r).push(i) }
  const 낱말들 = [], 점선 = [], 글자덩이 = new Set()
  for (const 들 of 무리.values()) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
    for (const i of 들) { const b = 덩이들[i]; x0 = Math.min(x0, b.x0); y0 = Math.min(y0, b.y0); x1 = Math.max(x1, b.x1); y1 = Math.max(y1, b.y1) }
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1
    // 막대 모양(가늘고 긴) 덩이
    const 막대 = (i) => { const b = 덩이들[i]; const a = b.x1 - b.x0 + 1, c = b.y1 - b.y0 + 1; return Math.max(a, c) >= 3.2 * Math.min(a, c) && b.n <= 1.6 * Math.max(a, c) * Math.max(굵, 1) }
    if (들.length >= 3 && 들.every(막대)) {
      // 한 줄로 늘어선 막대 = 점선
      const 가로점선 = 들.every((i) => { const b = 덩이들[i]; return b.x1 - b.x0 > b.y1 - b.y0 }) && bh <= 2.5 * 굵 + 2
      const 세로점선 = 들.every((i) => { const b = 덩이들[i]; return b.y1 - b.y0 > b.x1 - b.x0 }) && bw <= 2.5 * 굵 + 2
      if (가로점선 || 세로점선) { 점선.push(들); continue }
    }
    if (들.length === 1) {
      const b = 덩이들[들[0]]
      const a = b.x1 - b.x0 + 1, c = b.y1 - b.y0 + 1
      // 홀로 있는 막대 · 네모 테두리 · 아주 작은 티 → 도형(글자 아님)
      if (Math.max(a, c) >= 3 * Math.min(a, c)) continue
      if (네모테두리(lab, 들[0], b, w, 굵)) continue
      if (Math.max(a, c) < 2.2 * 굵 + 2) continue
    }
    const 꼴 = bw >= 1.35 * bh ? 'H' : bh >= 1.35 * bw ? 'V' : '?'
    // 글자 높이: 가로쓰기면 덩이 높이들의 큰 쪽 중앙값
    const 높들 = 들.map((i) => { const b = 덩이들[i]; return 꼴 === 'V' ? b.x1 - b.x0 + 1 : b.y1 - b.y0 + 1 }).sort((p, q) => p - q)
    const 높이 = 높들[Math.floor(높들.length * 0.7)] || 높들[높들.length - 1]
    for (const i of 들) 글자덩이.add(i)
    낱말들.push({ 들, 꼴, 네모: [x0, y0, x1, y1], 높이, c: [(x0 + x1) / 2, (y0 + y1) / 2] })
  }
  return { 낱말들, 글자덩이, 점선, lab, 덩이들 }
}

/** 덩이가 «네모 테두리» 인가: 둘레 네 변 근처에만 잉크가 있고 가운데는 빔 */
function 네모테두리(lab, id, b, w, 굵) {
  const a = b.x1 - b.x0 + 1, c = b.y1 - b.y0 + 1
  if (a < 4 * 굵 || c < 4 * 굵) return false
  const t = Math.max(2, 1.6 * 굵)
  let 변 = 0, 안 = 0
  for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) {
    if (lab[y * w + x] !== id) continue
    const 가 = x - b.x0 < t || b.x1 - x < t || y - b.y0 < t || b.y1 - y < t
    if (가) 변++; else 안++
  }
  // 변에 잉크가 고루(둘레의 60 % 이상) 있고 안쪽은 거의 비어야
  const 둘레 = 2 * (a + c) * 굵
  return 안 < 0.06 * (변 + 안) && 변 > 0.5 * 둘레
}

/** 낱말 안 덩이들을 읽는 차례로(가로: 왼→오, 세로: 아래→위 — 도면에서 세로 치수 글자는 왼쪽으로 돌려 씀) */
export function 읽는차례(낱말, 덩이들, 돌림 = 'ccw') {
  const 들 = 낱말.들.slice()
  if (낱말.꼴 === 'V') 들.sort((a, b) => 돌림 === 'ccw' ? 덩이들[b].y1 - 덩이들[a].y1 : 덩이들[a].y0 - 덩이들[b].y0)
  else 들.sort((a, b) => 덩이들[a].x0 - 덩이들[b].x0)
  return 들
}
