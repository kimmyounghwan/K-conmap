/**
 * 🧱 벽으로 방 찾기 (G298 · 2026-10-16)
 *
 * 소장님: 「이제 골조물량하고 마감물량 업그레이드 하자」 → 「순서대로 해줘. 3D 가능하게」
 *   실제 평면도는 방을 닫힌 선으로 그리지 않고 «벽 선» 으로만 그린 것이 많음(현장 평면 xref — 방 0개 찾음).
 *   → 실 이름 자리마다 둘러싼 칸을 벽 · 기둥 · 창 · 문 선으로 막아 «물 채우기» 로 찾음.
 *
 * ■ 막는 선: 층 이름이 벽 · 기둥 · 코어 · 창 · 문 · 마감(실내 마감선) · 칸막이 · 승강기 · 계단인 것 + 문 · 창 블록 속 선(문짝 · 열림 호)
 *   (중심선 · 치수 · 글 · 해치 · 가구 · 위생기구 · 면적 · 숨은선 층은 안 막음). 문 열림 호가 열린 문 자리를 막음.
 * ■ 셈: 이름 자리 둘레 창(30 m → 60 m)을 격자(25 mm)로 — 선이 지나는 칸을 막고, 이름 칸에서 네 방향 물 채우기.
 *   창 끝까지 새면(문 · 창이 비어 있음) 못 찾음. 넓이 = (칸 수 + 테두리 변 수 ÷ 2) × 칸² (막은 선 가운데까지)
 *   · 테두리 = 칸 경계를 이어 바깥 고리 → 꺾인 곳만 남기고(곧은 변) · 둘레 = 그 고리 길이.
 * ■ 좌표는 모델 그대로(mm 라고 보고 · 단위 배율 k 는 부르는 쪽).
 * ■ 층방들(G298 ②): 한 층 상자를 통째로 칸 판에 — 막히지 않은 칸 덩이를 모두 찾음(이름 없는 방 · 복도 · 화장실도)
 *   + 🧮 중심선 넓이: 벽 속 칸(선 · 벽 사이 좁은 틈)을 가까운 공간에 나눠 줌(벽 두께 반씩 · 120 mm 까지 — 바깥벽은 단열 · 치장 쪽 빼고 구조 벽 가운데쯤) — 설계자가 «면적» 으로 적는 벽 중심 넓이와 견줌.
 *   «열린 칸» = 빈 칸을 300 mm 네모로 깎았다 다시 불린 것(벽 사이 틈 · 기둥 속은 빠짐). 판 가장자리에 닿는 덩이 = 바깥.
 * 시험: node tools/시험_방찾기.mjs
 */
import { 종류 } from './골조도면.js'

export const 벽층말 = /WAL|WALL|벽|^CON$|^CONC|[-_ ]CON$|COL|기둥|CORE|코어|DOOR|^DR|[-_]DR|문$|WIN|^W[-_]|창호|창$|SASH|FIN|마감|PART|칸막이|CURT|GLASS|유리|STAIR|계단|EV$|^EV|ELEV|^ELE-?V|승강|SHAFT|PIT|난간벽/i
export const 안막는층 = /CEN|中心|标注|^cl$|중심|DIM|치수|TEXT|글|HAT|해치|SYM|MARK|기호|AREA|면적|DEF|HID|숨은|FUR|가구|TOIL|위생|PARK|주차|SITE|대지|LAN|조경|SOLID|TRENCH|DRAIN|배수|M-|기계|전기|ELEC|태양|SECT|단면|ELEV|입면|GRID|축|TITLE|도곽|FRAME|NOTE|가상|PTANN|0-현황|건물현황|^ELE-?\d|^EL\d|^ELE$/i
const 문블록말 = /DOOR|문|^D[-_ ]?\d|^D\d|^SD|^AD|^WD|^FSD|^SSD|^PD|^ASD|^FD|셔터|SHUTTER|자동문|^AW|^W[-_ ]?\d|창|WIN|SASH/i

/** 막는 선인가 — 도형마다 (Uint8Array) */
export function 막는도형(모델) {
  const { E, layers, I } = 모델
  const n = E.t.length
  const 층막 = layers.map((L) => { const nm = (L && L.name) || ''; return 벽층말.test(nm) && !안막는층.test(nm) })
  const 층안 = layers.map((L) => 안막는층.test((L && L.name) || ''))
  const 블막 = (I || []).map((b) => 문블록말.test(b.name || '') || (layers[b.ly] && 벽층말.test(layers[b.ly].name || '') && !안막는층.test(layers[b.ly].name || '')))
  const out = new Uint8Array(n)
  for (let e = 0; e < n; e++) {
    const t = E.t[e]
    if (t === 종류.글자 || t === 종류.치수 || t === 종류.해치 || t === 종류.채움 || t === 종류.지시선) continue
    if (층막[E.ly[e]]) { out[e] = 1; continue }
    const ins = E.ins[e]
    if (ins >= 0 && 블막[ins] && !층안[E.ly[e]]) out[e] = 1
  }
  return out
}

/** 막는 토막 [x0,y0,x1,y1, …] (Float64Array)
 *  🚪 문 열림 호는 막지 않고 «닫힌 문짝 자리»(돌쩌귀 = 호 가운데 → 닫힌 쪽 끝)로 막음 — 호로 막으면 방에서 문 열림 자리(약 0.4 ㎡)가 빠짐.
 *     열린 문짝(돌쩌귀 → 열린 끝) 선은 그대로(얇아서 넓이 거의 0). 열린 끝 = 문짝 선이 닿는 호 끝.
 */
export function 막는토막(모델, 막, k = 1) {
  const { Q, P, E, layers } = 모델
  const 토 = []
  const 조각들 = new Map()
  for (let q = 0; q < Q.e.length; q++) { const e = Q.e[q]; if (!막[e]) continue; const l = 조각들.get(e); if (l) l.push(q); else 조각들.set(e, [q]) }
  const 문층 = layers.map((L) => /DOOR|^DR|[-_]DR|문/i.test((L && L.name) || ''))
  const 호들 = []
  for (const [e, qs] of 조각들) {
    if (E.t[e] === 종류.호 && (문층[E.ly[e]] || E.ins[e] >= 0)) {
      const 점 = []
      for (const q of qs) { const s0 = Q.p0[q], n = Q.pn[q]; for (let k = 0; k < n; k++) 점.push([P[(s0 + k) * 2], P[(s0 + k) * 2 + 1]]) }
      const h = 문호(점, k)
      if (h) { 호들.push({ e, ...h }); continue }
    }
    for (const q of qs) {
      const s0 = Q.p0[q], n = Q.pn[q]
      for (let k = 0; k + 1 < n; k++) 토.push(P[(s0 + k) * 2], P[(s0 + k) * 2 + 1], P[(s0 + k + 1) * 2], P[(s0 + k + 1) * 2 + 1])
    }
  }
  const 문들 = []                       /* 🚪 찾은 문(돌쩌귀 · 닫힌 끝 · 폭) — 마감 벽 공제(G298 ③) */
  if (호들.length) {
    /* 열린 끝 고르기 — 돌쩌귀와 그 끝을 잇는(30 mm 안) 곧은 선(문짝)이 있는 쪽. 같은 블록 · 같은 층의 선만 봄 */
    const 곁 = (x, y, r) => [x - r, y - r, x + r, y + r]
    const 문선 = []
    for (const [e, qs] of 조각들) {
      if (E.t[e] === 종류.호) continue
      if (!(문층[E.ly[e]] || E.ins[e] >= 0)) continue
      for (const q of qs) { const s0 = Q.p0[q], n = Q.pn[q]; for (let k = 0; k + 1 < n; k++) 문선.push({ e, a: [P[(s0 + k) * 2], P[(s0 + k) * 2 + 1]], b: [P[(s0 + k + 1) * 2], P[(s0 + k + 1) * 2 + 1]] }) }
    }
    const 가까 = (p, q, t) => Math.hypot(p[0] - q[0], p[1] - q[1]) <= t
    for (const h of 호들) {
      const t = Math.max(30 / k, h.r * 0.06)
      const 상 = 곁(h.c[0], h.c[1], h.r * 1.2)
      let 열린 = null
      for (const L of 문선) {
        if (Math.max(L.a[0], L.b[0]) < 상[0] || Math.min(L.a[0], L.b[0]) > 상[2] || Math.max(L.a[1], L.b[1]) < 상[1] || Math.min(L.a[1], L.b[1]) > 상[3]) continue
        if (E.ins[L.e] !== E.ins[h.e] && E.ly[L.e] !== E.ly[h.e]) continue
        for (const [끝, 다른] of [[h.p, h.q], [h.q, h.p]]) {
          /* 문짝 선: 한 끝이 열린 끝 · 다른 끝이 돌쩌귀 쪽(선이 돌쩌귀 ~ 열린 끝 사이를 거의 다 덮음) */
          if ((가까(L.a, 끝, t) || 가까(L.b, 끝, t)) && 선거리(h.c, L.a, L.b) < t * 2 && Math.hypot(L.b[0] - L.a[0], L.b[1] - L.a[1]) > h.r * 0.6) { 열린 = 끝; void 다른; break }
        }
        if (열린) break
      }
      const 닫힌 = 열린 === h.p ? h.q : 열린 === h.q ? h.p : null
      문들.push({ c: h.c, 닫힌, p: h.p, q: h.q, w: h.r })
      if (닫힌) 토.push(h.c[0], h.c[1], 닫힌[0], 닫힌[1])
      else { 토.push(h.c[0], h.c[1], h.p[0], h.p[1], h.c[0], h.c[1], h.q[0], h.q[1]) }    /* 모르면 돌쩌귀 → 두 끝 다(하나는 닫힌 자리 · 하나는 문짝 자리) — 호는 안 막음 */
    }
  }
  const 결과 = Float64Array.from(토)
  결과.문들 = 문들
  return 결과
}

/** 🚪 방(다각형)에 붙은 문 — 문 자리(돌쩌귀 ~ 닫힌 끝 가운데)가 방 테두리에서 «곁» 안 · 폭 [mm 모델 단위] */
export function 방문들(다각형, 문들, 곁 = 300) {
  const out = []
  if (!다각형 || !다각형.length || !문들) return out
  const 거리 = (x, y) => { let d = Infinity; for (let i = 0; i < 다각형.length; i++) { const a = 다각형[i], b = 다각형[(i + 1) % 다각형.length]; const v = 선거리([x, y], a, b); if (v < d) d = v } return d }
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const [x, y] of 다각형) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
  for (const d of 문들) {
    const 점 = d.닫힌 ? [[(d.c[0] + d.닫힌[0]) / 2, (d.c[1] + d.닫힌[1]) / 2]] : [[(d.c[0] + d.p[0]) / 2, (d.c[1] + d.p[1]) / 2], [(d.c[0] + d.q[0]) / 2, (d.c[1] + d.q[1]) / 2]]
    if (점.some(([x, y]) => x >= x0 - 곁 && x <= x1 + 곁 && y >= y0 - 곁 && y <= y1 + 곁 && 거리(x, y) <= 곁)) out.push(d.w)
  }
  return out
}
/** 문 열림 호인가 — 반지름 400 ~ 2,000 mm · 60 ~ 180° · 가운데 · 두 끝 */
function 문호(점, k = 1) {
  if (점.length < 3) return null
  const p = 점[0], q = 점[점.length - 1], m = 점[(점.length / 2) | 0]
  const c = 외심(p, m, q)
  if (!c) return null
  const r = Math.hypot(p[0] - c[0], p[1] - c[1])
  if (!(r * k >= 400 && r * k <= 2000)) return null
  let a = Math.abs(Math.atan2(p[1] - c[1], p[0] - c[0]) - Math.atan2(q[1] - c[1], q[0] - c[0])) * 180 / Math.PI
  if (a > 180) a = 360 - a
  if (a < 60 || a > 181) return null                 /* 90° 여닫이 · 180° 자재문(양쪽 열림)까지 */
  return { c, r, p, q, 점 }
}
function 외심(a, b, c) {
  const d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]))
  if (Math.abs(d) < 1e-9) return null
  const a2 = a[0] * a[0] + a[1] * a[1], b2 = b[0] * b[0] + b[1] * b[1], c2 = c[0] * c[0] + c[1] * c[1]
  return [(a2 * (b[1] - c[1]) + b2 * (c[1] - a[1]) + c2 * (a[1] - b[1])) / d, (a2 * (c[0] - b[0]) + b2 * (a[0] - c[0]) + c2 * (b[0] - a[0])) / d]
}
function 선거리(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy
  const t = L2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2)) : 0
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy)
}

/**
 * 이름 자리마다 둘러싼 방
 * @param 이름들 [{x, y}] (모델 좌표)
 * @returns [{점: [[x,y]…], 넓이(mm²), 둘레(mm), 상자, 창} | null]
 */
export function 벽방찾기(모델, 이름들, { 칸 = 25, 창들 = [30000, 60000], 최대넓이 = 1500e6, 토막 = null } = {}) {
  const 토 = 토막 || 막는토막(모델, 막는도형(모델))
  const 나 = 토.length / 4
  const 상 = new Float64Array(나 * 4)
  for (let i = 0; i < 나; i++) {
    const a = 토[i * 4], b = 토[i * 4 + 1], c = 토[i * 4 + 2], d = 토[i * 4 + 3]
    상[i * 4] = Math.min(a, c); 상[i * 4 + 1] = Math.min(b, d); 상[i * 4 + 2] = Math.max(a, c); 상[i * 4 + 3] = Math.max(b, d)
  }
  let 판 = null, 판N = 0
  const 결과 = []
  const 이미 = []                      /* 찾은 방 — 같은 방 안의 다른 이름은 다시 안 셈 */
  for (const nm of 이름들) {
    const 앞 = 이미.find((r) => nm.x >= r.상자[0] && nm.x <= r.상자[2] && nm.y >= r.상자[1] && nm.y <= r.상자[3] && 안(r.점, nm.x, nm.y))
    if (앞) { 결과.push({ ...앞, 같은: true }); continue }
    let r = null
    for (const W of 창들) {
      const N = Math.ceil(W / 칸)
      if (!판 || 판N < N) { 판 = new Uint8Array(N * N); 판N = N }
      const g = 판N
      판.fill(0, 0, g * g)
      const x0 = nm.x - (N * 칸) / 2, y0 = nm.y - (N * 칸) / 2, x1 = x0 + N * 칸, y1 = y0 + N * 칸
      for (let i = 0; i < 나; i++) {
        if (상[i * 4 + 2] < x0 || 상[i * 4] > x1 || 상[i * 4 + 3] < y0 || 상[i * 4 + 1] > y1) continue
        긋기(판, g, N, (토[i * 4] - x0) / 칸, (토[i * 4 + 1] - y0) / 칸, (토[i * 4 + 2] - x0) / 칸, (토[i * 4 + 3] - y0) / 칸)
      }
      let sx = Math.floor((nm.x - x0) / 칸), sy = Math.floor((nm.y - y0) / 칸)
      /* 이름 칸이 선 위면 가장 가까운 빈 칸 */
      if (판[sy * g + sx]) {
        let 찾 = false
        for (let d = 1; d <= 8 && !찾; d++) for (let dy = -d; dy <= d && !찾; dy++) for (let dx = -d; dx <= d; dx++) { if (!판[(sy + dy) * g + sx + dx]) { sx += dx; sy += dy; 찾 = true; break } }
        if (!찾) break
      }
      const 칸수한도 = 최대넓이 / (칸 * 칸)
      const 채 = 물채우기(판, g, N, sx, sy, 칸수한도)
      if (!채) continue                                  /* 샘 — 더 큰 창으로 */
      const 고리 = 바깥고리(판, g, 채)
      if (!고리) break
      const 점 = 고리.map(([i, j]) => [x0 + i * 칸, y0 + j * 칸])
      const 넓이 = (채.수 + 채.테 / 2) * 칸 * 칸
      r = { 점, 넓이, 둘레: 고리둘레(점), 상자: 상자(점), 창: W }
      break
    }
    if (r) 이미.push(r)
    결과.push(r)
  }
  return 결과
}

/** 칸 판에 선(칸 단위 좌표) — 지나는 칸을 모두(빈틈 없이) */
function 긋기(판, g, N, ax, ay, bx, by) {
  const 길 = Math.max(Math.abs(bx - ax), Math.abs(by - ay))
  const n = Math.max(1, Math.ceil(길 * 2))
  let pi = -1, pj = -1
  for (let s = 0; s <= n; s++) {
    const x = ax + ((bx - ax) * s) / n, y = ay + ((by - ay) * s) / n
    const i = Math.floor(x), j = Math.floor(y)
    if (i === pi && j === pj) continue
    if (pi >= 0 && i !== pi && j !== pj) { const ci = i, cj = pj; if (ci >= 0 && ci < N && cj >= 0 && cj < N) 판[cj * g + ci] = 1 }     /* 대각 건너뜀 막기 */
    if (i >= 0 && i < N && j >= 0 && j < N) 판[j * g + i] = 1
    pi = i; pj = j
  }
}

/** 네 방향 물 채우기 — 창 끝에 닿거나 한도를 넘으면 null · 채운 칸 = 2 */
function 물채우기(판, g, N, sx, sy, 한도) {
  const 줄 = new Int32Array(Math.min(N * N, 한도 + 8) | 0)
  let h = 0, t = 0, 수 = 0
  줄[t++] = sy * g + sx; 판[sy * g + sx] = 2
  let i0 = sx, i1 = sx, j0 = sy, j1 = sy
  while (h < t) {
    const c = 줄[h++]; 수++
    if (수 > 한도) return null
    const i = c % g, j = (c / g) | 0
    if (i <= 0 || j <= 0 || i >= N - 1 || j >= N - 1) return null
    if (i < i0) i0 = i; if (i > i1) i1 = i; if (j < j0) j0 = j; if (j > j1) j1 = j
    for (const d of [c - 1, c + 1, c - g, c + g]) if (판[d] === 0) { 판[d] = 2; if (t >= 줄.length) return null; 줄[t++] = d }
  }
  /* 테두리 변 수(채운 칸 ↔ 막은 칸) */
  let 테 = 0
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const c = j * g + i
    if (판[c] !== 2) continue
    if (판[c - 1] !== 2) 테++; if (판[c + 1] !== 2) 테++; if (판[c - g] !== 2) 테++; if (판[c + g] !== 2) 테++
  }
  return { 수, 테, i0, i1, j0, j1 }
}

/** 채운 칸(2)의 바깥 테두리 고리 — 격자 꼭짓점 [i, j] (반시계 · 채운 칸이 왼쪽) · 곧은 변은 하나로 */
function 바깥고리(판, g, 채) {
  const { i0, i1, j0, j1 } = 채
  const W = i1 - i0 + 3
  const 키 = (i, j) => (j - j0 + 1) * W + (i - i0 + 1)
  const 나감 = new Map()            /* 꼭짓점 키 → [다음 꼭짓점 [i,j] …] */
  const 넣 = (a, b) => { const k = 키(a[0], a[1]); const l = 나감.get(k); if (l) l.push(b); else 나감.set(k, [b]) }
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const c = j * g + i
    if (판[c] !== 2) continue
    if (판[c - g] !== 2) 넣([i, j], [i + 1, j])               /* 아래 변 → 오른쪽 */
    if (판[c + 1] !== 2) 넣([i + 1, j], [i + 1, j + 1])       /* 오른쪽 변 → 위 */
    if (판[c + g] !== 2) 넣([i + 1, j + 1], [i, j + 1])       /* 위 변 → 왼쪽 */
    if (판[c - 1] !== 2) 넣([i, j + 1], [i, j])               /* 왼쪽 변 → 아래 */
  }
  let 큰 = null, 큰넓 = 0
  for (const [k0, l0] of 나감) {
    while (l0.length) {
      const 시작 = l0.pop()
      const 고리 = []
      let cur = 시작
      let 앞 = null
      for (let n = 0; n < 1e7; n++) {
        고리.push(cur)
        const l = 나감.get(키(cur[0], cur[1]))
        if (!l || !l.length) break
        /* 갈림(대각으로 닿은 칸) — 왼쪽으로 꺾는 것 먼저(채운 칸을 안고 돎) */
        let 고른 = 0
        if (l.length > 1 && 앞) {
          const dx = cur[0] - 앞[0], dy = cur[1] - 앞[1]
          for (let q = 0; q < l.length; q++) { const ex = l[q][0] - cur[0], ey = l[q][1] - cur[1]; if (dx * ey - dy * ex > 0) { 고른 = q; break } }
        }
        앞 = cur
        cur = l.splice(고른, 1)[0]
      }
      if (고리.length < 4) continue
      let A = 0
      for (let q = 0; q < 고리.length; q++) { const a = 고리[q], b = 고리[(q + 1) % 고리.length]; A += a[0] * b[1] - b[0] * a[1] }
      if (A / 2 > 큰넓) { 큰넓 = A / 2; 큰 = 고리 }
    }
    void k0
  }
  if (!큰) return null
  /* 곧은 변 하나로(꺾인 꼭짓점만) */
  const 꺾 = []
  for (let q = 0; q < 큰.length; q++) {
    const a = 큰[(q - 1 + 큰.length) % 큰.length], b = 큰[q], c = 큰[(q + 1) % 큰.length]
    if ((b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]) !== 0) 꺾.push(b)
  }
  /* 계단 꼴(비스듬한 벽) — 칸 1.5 개 안으로 펴기 */
  return 펴기(꺾, 1.5)
}

function 펴기(점, tol) {
  if (점.length <= 4) return 점
  /* 닫힌 고리 Douglas-Peucker — 가장 먼 두 점으로 나눠 */
  let a = 0, b = 0, best = -1
  for (let i = 0; i < 점.length; i++) { const d = Math.hypot(점[i][0] - 점[0][0], 점[i][1] - 점[0][1]); if (d > best) { best = d; b = i } }
  const 반 = (s, e) => {
    const out = []
    const 재귀 = (i, j) => {
      let m = -1, md = tol
      const [ax, ay] = 점[i % 점.length], [bx, by] = 점[j % 점.length]
      const L = Math.hypot(bx - ax, by - ay) || 1
      for (let k = i + 1; k < j; k++) { const [px, py] = 점[k % 점.length]; const dd = Math.abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / L; if (dd > md) { md = dd; m = k } }
      if (m < 0) { out.push(점[i % 점.length]); return }
      재귀(i, m); 재귀(m, j)
    }
    재귀(s, e)
    return out
  }
  return [...반(a, b), ...반(b, 점.length + a)]
}

const 상자 = (r) => { let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (const [x, y] of r) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y } return [x0, y0, x1, y1] }
const 고리둘레 = (r) => { let L = 0; for (let i = 0; i < r.length; i++) { const a = r[i], b = r[(i + 1) % r.length]; L += Math.hypot(b[0] - a[0], b[1] - a[1]) } return L }
export function 안(r, x, y) {
  let 속 = false
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const xi = r[i][0], yi = r[i][1], xj = r[j][0], yj = r[j][1]
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-300) + xi) 속 = !속
  }
  return 속
}

/**
 * 🏠 한 층 상자 안의 모든 공간(G298 ②)
 * @param 상자0 [x0,y0,x1,y1] (모델 좌표)
 * @returns { 방들: [{점, 넓이(안목 mm²), 중심넓이(mm²), 둘레, 상자, 씨:[x,y], 폭(mm)}], 어디(x,y) → 방 번호 | -1 }
 */
export function 층방들(모델, 상자0, { 칸: 칸0 = 25, 토막 = null, 여유 = 2000, 최소넓이 = 0.8e6, 벽반 = 120, 깎기 = 150, 최대칸 = 16e6 } = {}) {
  const 토 = 토막 || 막는토막(모델, 막는도형(모델))
  let 칸 = 칸0
  const x0 = 상자0[0] - 여유, y0 = 상자0[1] - 여유, w = 상자0[2] - 상자0[0] + 여유 * 2, h = 상자0[3] - 상자0[1] + 여유 * 2
  while ((w / 칸) * (h / 칸) > 최대칸) 칸 *= 2
  const NX = Math.ceil(w / 칸) + 2, NY = Math.ceil(h / 칸) + 2
  const NN = NX * NY
  const 판 = new Uint8Array(NN)
  const 나 = 토.length / 4
  const x1 = x0 + NX * 칸, y1 = y0 + NY * 칸
  for (let i = 0; i < 나; i++) {
    const a = 토[i * 4], b = 토[i * 4 + 1], c = 토[i * 4 + 2], d = 토[i * 4 + 3]
    if (Math.max(a, c) < x0 || Math.min(a, c) > x1 || Math.max(b, d) < y0 || Math.min(b, d) > y1) continue
    긋기2(판, NX, NY, (a - x0) / 칸, (b - y0) / 칸, (c - x0) / 칸, (d - y0) / 칸)
  }
  /* ① 빈 칸 덩이(4 방향) */
  const 덩 = new Int32Array(NN).fill(-1)
  const 줄 = new Int32Array(NN)
  const 덩이 = []
  for (let s0 = 0; s0 < NN; s0++) {
    if (판[s0] || 덩[s0] >= 0) continue
    const id = 덩이.length
    let hh = 0, t = 0, 수 = 0, 테 = 0, 가 = false
    let i0 = NX, i1 = 0, j0 = NY, j1 = 0
    줄[t++] = s0; 덩[s0] = id
    while (hh < t) {
      const c = 줄[hh++]; 수++
      const i = c % NX, j = (c / NX) | 0
      if (i < i0) i0 = i; if (i > i1) i1 = i; if (j < j0) j0 = j; if (j > j1) j1 = j
      if (i === 0 || j === 0 || i === NX - 1 || j === NY - 1) { 가 = true }
      const 이웃 = [i > 0 ? c - 1 : -1, i < NX - 1 ? c + 1 : -1, j > 0 ? c - NX : -1, j < NY - 1 ? c + NX : -1]
      for (const d of 이웃) {
        if (d < 0) continue
        if (판[d]) { 테++; continue }
        if (덩[d] < 0) { 덩[d] = id; 줄[t++] = d }
      }
    }
    덩이.push({ 수, 테, 가, i0, i1, j0, j1, 열린: 0 })
  }
  /* ② 열린 칸 = 빈 칸을 r 칸 네모로 깎았다가(벽까지 거리 > r) 다시 r 칸 불림 */
  const r = Math.max(1, Math.round(깎기 / 칸))
  const 거 = 체스거리(NX, NY, (c) => 판[c] !== 0)
  const 깎 = new Uint8Array(NN)
  for (let c = 0; c < NN; c++) 깎[c] = 거[c] > r ? 1 : 0
  const 거2 = 체스거리(NX, NY, (c) => 깎[c] === 1)
  const 열 = new Uint8Array(NN)
  for (let c = 0; c < NN; c++) if (!판[c] && 거2[c] <= r) { 열[c] = 1; 덩이[덩[c]].열린++ }
  /* ③ 씨(공간) = 열린 칸이 충분한 덩이 + 바깥 → 벽 속 칸을 가까운 씨에 나눔(4 방향 · 벽반 까지) */
  const 씨인가 = 덩이.map((o) => o.가 || o.열린 * 칸 * 칸 >= 최소넓이)
  const 임자 = new Int32Array(NN).fill(-1)
  const 거리 = new Uint16Array(NN)
  let hh = 0, t = 0
  for (let c = 0; c < NN; c++) if (!판[c] && 씨인가[덩[c]]) { 임자[c] = 덩[c]; 줄[t++] = c }       /* 씨 덩이의 칸은 모두 제 것 */
  const 한 = Math.max(1, Math.round(벽반 / 칸))
  while (hh < t) {
    const c = 줄[hh++]
    if (거리[c] >= 한) continue
    const i = c % NX, j = (c / NX) | 0
    const 이웃 = [i > 0 ? c - 1 : -1, i < NX - 1 ? c + 1 : -1, j > 0 ? c - NX : -1, j < NY - 1 ? c + NX : -1]
    for (const d of 이웃) {
      if (d < 0 || 임자[d] >= 0) continue
      /* 다른 씨 덩이의 칸은 그 덩이 몫(안 넘어감) */
      if (!판[d] && 씨인가[덩[d]] && 덩[d] !== 임자[c]) continue
      임자[d] = 임자[c]; 거리[d] = 거리[c] + 1; 줄[t++] = d
    }
  }
  const 중심수 = new Float64Array(덩이.length)
  for (let c = 0; c < NN; c++) if (임자[c] >= 0) 중심수[임자[c]]++
  /* ④ 방들(바깥 · 작은 틈 빼고) — 테두리 · 씨(가장 안쪽 칸) · 폭 */
  const 표 = new Uint8Array(NN)
  const 방들 = []
  const 번호 = new Int32Array(덩이.length).fill(-1)
  const 깊이 = new Int32Array(덩이.length), 깊칸 = new Int32Array(덩이.length).fill(-1)
  for (let c = 0; c < NN; c++) { const id = 덩[c]; if (id >= 0 && 거[c] > 깊이[id]) { 깊이[id] = 거[c]; 깊칸[id] = c } }
  덩이.forEach((o, id) => {
    if (o.가 || !씨인가[id]) return
    for (let j = o.j0; j <= o.j1; j++) for (let i = o.i0; i <= o.i1; i++) { const c = j * NX + i; if (덩[c] === id) 표[c] = 2 }
    const 고리 = 바깥고리(표, NX, o)
    for (let j = o.j0; j <= o.j1; j++) for (let i = o.i0; i <= o.i1; i++) 표[j * NX + i] = 0
    if (!고리) return
    const 점 = 고리.map(([i, j]) => [x0 + i * 칸, y0 + j * 칸])
    const c = 깊칸[id]
    번호[id] = 방들.length
    방들.push({ 점, 넓이: (o.수 + o.테 / 2) * 칸 * 칸, 중심넓이: 중심수[id] * 칸 * 칸, 둘레: 고리둘레(점), 상자: 상자(점), 씨: [x0 + ((c % NX) + 0.5) * 칸, y0 + (((c / NX) | 0) + 0.5) * 칸], 폭: 깊이[id] * 2 * 칸 })
  })
  const 어디 = (x, y) => {
    let i = Math.floor((x - x0) / 칸), j = Math.floor((y - y0) / 칸)
    if (i < 0 || j < 0 || i >= NX || j >= NY) return -1
    let c = j * NX + i
    if (판[c]) {                                  /* 선 위 — 가까운 빈 칸 */
      let 찾 = -1
      for (let d = 1; d <= 8 && 찾 < 0; d++) for (let dy = -d; dy <= d && 찾 < 0; dy++) for (let dx = -d; dx <= d; dx++) { const ii = i + dx, jj = j + dy; if (ii >= 0 && jj >= 0 && ii < NX && jj < NY && !판[jj * NX + ii]) { 찾 = jj * NX + ii; break } }
      if (찾 < 0) return -1
      c = 찾
    }
    return 덩[c] >= 0 ? 번호[덩[c]] : -1
  }
  /* 살피기(시험 · 진단) — 점이 든 덩이: 칸 수 · 바깥인가 · 상자(모델 좌표) */
  const 덩이정보 = (x, y) => {
    const i = Math.floor((x - x0) / 칸), j = Math.floor((y - y0) / 칸)
    if (i < 0 || j < 0 || i >= NX || j >= NY) return null
    const id = 덩[j * NX + i]
    if (id < 0) return { 선: true }
    const o = 덩이[id]
    return { 넓이: o.수 * 칸 * 칸, 바깥: o.가, 씨: 씨인가[id], 상자: [x0 + o.i0 * 칸, y0 + o.j0 * 칸, x0 + (o.i1 + 1) * 칸, y0 + (o.j1 + 1) * 칸] }
  }
  return { 방들, 어디, 칸, 덩이정보 }
}

/** 칸 판(가로 NX · 세로 NY)에 선 — 지나는 칸 모두 */
function 긋기2(판, NX, NY, ax, ay, bx, by) {
  const 길 = Math.max(Math.abs(bx - ax), Math.abs(by - ay))
  const n = Math.max(1, Math.ceil(길 * 2))
  let pi = -1, pj = -1
  for (let s = 0; s <= n; s++) {
    const x = ax + ((bx - ax) * s) / n, y = ay + ((by - ay) * s) / n
    const i = Math.floor(x), j = Math.floor(y)
    if (i === pi && j === pj) continue
    if (pi >= 0 && i !== pi && j !== pj) { const ci = i, cj = pj; if (ci >= 0 && ci < NX && cj >= 0 && cj < NY) 판[cj * NX + ci] = 1 }
    if (i >= 0 && i < NX && j >= 0 && j < NY) 판[j * NX + i] = 1
    pi = i; pj = j
  }
}
/** 체스판 거리(8 방향) — 씨 칸(참)까지 칸 수 (255 까지) · 판 밖은 씨로 봄 */
function 체스거리(NX, NY, 씨) {
  const d = new Uint8Array(NX * NY)
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
    const c = j * NX + i
    if (씨(c)) { d[c] = 0; continue }
    if (i === 0 || j === 0) { d[c] = 1; continue }
    d[c] = Math.min(255, 1 + Math.min(d[c - 1], d[c - NX], d[c - NX - 1], i < NX - 1 ? d[c - NX + 1] : 255))
  }
  for (let j = NY - 1; j >= 0; j--) for (let i = NX - 1; i >= 0; i--) {
    const c = j * NX + i
    if (d[c] === 0) continue
    if (i === NX - 1 || j === NY - 1) { d[c] = 1; continue }
    d[c] = Math.min(d[c], 1 + Math.min(d[c + 1], d[c + NX], d[c + NX + 1], i > 0 ? d[c + NX - 1] : 255))
  }
  return d
}

/** 🏠 층 상자 키우기 — 상자에 닿는(틈 안) 막는 선의 끝까지 넓혀 건물 벽을 다 품게(벽은 이어져 있음 · 틈보다 멀리 떨어진 다른 판은 안 품음) */
export function 벽상자(토, 상자0, 틈 = 2000, 번 = 8) {
  let b = [...상자0]
  const 나 = 토.length / 4
  for (let k = 0; k < 번; k++) {
    const n = [b[0] - 틈, b[1] - 틈, b[2] + 틈, b[3] + 틈]
    const c = [...b]
    for (let i = 0; i < 나; i++) {
      const x0 = Math.min(토[i * 4], 토[i * 4 + 2]), x1 = Math.max(토[i * 4], 토[i * 4 + 2]), y0 = Math.min(토[i * 4 + 1], 토[i * 4 + 3]), y1 = Math.max(토[i * 4 + 1], 토[i * 4 + 3])
      if (x1 < n[0] || x0 > n[2] || y1 < n[1] || y0 > n[3]) continue
      if (x0 < c[0]) c[0] = x0; if (y0 < c[1]) c[1] = y0; if (x1 > c[2]) c[2] = x1; if (y1 > c[3]) c[3] = y1
    }
    if (c[0] === b[0] && c[1] === b[1] && c[2] === b[2] && c[3] === b[3]) break
    b = c
  }
  return b
}
