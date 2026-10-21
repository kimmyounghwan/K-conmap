/**
 * 📷 사진 → 캐드 · 흐름 — 도면 사진 · 손그림 · 건물 사진을 처음부터 끝까지 (2026-10-14 G287)
 *
 *   도면펴기(판, o)            → { 네모, 믿음, 틀, 편 }       (모서리는 화면에서 끌어 고친 뒤 다시 부를 수 있음)
 *   도면읽기(편, o)            → 결과(반듯한 판 픽셀 좌표: 도형 · 숫자 · 치수 · 글씨)
 *   맞추기(결과, 사람치수, o)   → 풀이(픽셀 → mm, 치수마다 쓰임 · 남은 차)
 *   결과그림(결과, 풀이, o)     → DXF 로 쓸 그림(mm · y 위로)  →  DXF만들기(그림)
 *   건물펴기(판, o) · 건물읽기(편, o) — 건물 정면 사진(소실점으로 펴기 · 밝기 경계 선분)
 */

import { 종이찾기, 펴는틀, 펴기, 줄이기, 소실점펴기, 곱 } from './사진캐드_펴기.js'
import { 잉크뽑기, 덩이, 거리, 뼈대, 길따기, 칠한평면, 벽뽑기 } from './사진캐드_잉크.js'
import { 길맞추기, 반듯하게, 선분찾기 } from './사진캐드_선.js'
import { 글자가르기 } from './사진캐드_글자.js'
import { 낱말읽기, 무게있음 } from './사진캐드_숫자.js'
import { 치수짝짓기, 치수풀기 } from './사진캐드_치수.js'
import { 치수글풀기 } from './사진캐드_글읽기.js'

export { DXF만들기 } from './사진캐드_dxf.js'

/* ───────── 도면 · 손그림 ───────── */

export function 도면펴기(판, o = {}) {
  const 찾 = o.네모 ? { 네모: o.네모, 믿음: 1 } : 종이찾기(판)
  const 틀 = 펴는틀(찾.네모, 판.w, 판.h, { 종이: o.종이, 최대: o.최대 || 3000 })
  const 편 = 펴기(판, 틀.H, 틀.너비, 틀.높이, 255)
  return { 네모: 찾.네모, 믿음: 찾.믿음, 틀, 편 }
}

function 돌림점(p, c, θ) {   // 반듯하게 와 같은 돌림(-θ)
  const r = -θ * Math.PI / 180, cs = Math.cos(r), sn = Math.sin(r)
  const x = p[0] - c[0], y = p[1] - c[1]
  return [c[0] + x * cs - y * sn, c[1] + x * sn + y * cs]
}

/**
 * @param 편 펴진 밝기 판
 * @param o { 손그림, 세기, 숫자읽기(기본 true), 진행(f) }
 */
export function 도면읽기(편, o = {}) {
  const 손 = !!o.손그림
  const 진행 = o.진행 || (() => {})
  const { w, h } = 편
  진행('선 뽑는 중', 0.15)
  // 글 읽기가 찾은 치수 숫자 자리 — 흐린 가는 치수선을 살리는 단서
  const 글자리 = o.글목록 && o.글목록.length ? o.글목록.filter((r) => r.믿음 >= 0.5 && 치수글풀기(r.글)) : null
  const 잉 = 잉크뽑기(편, { 세기: o.세기 || 1, 손그림: 손, 글자리 })
  // 🧱 칠한 평면도(바닥 · 가구 · 방 번호가 칠해진 분양 · 홍보 그림) → 벽만 (o.벽만: true 늘 · false 안 함 · 그 밖 = 저절로)
  const 칠 = 손 ? { 덮임: 0, 가운데: 0, 칠함: false } : 칠한평면(잉)
  const 벽만 = !손 && (o.벽만 === true || (o.벽만 !== false && 칠.칠함))
  //   치수 숫자는 또렷한(0.8 넘게) · 치수다운(100 넘거나 소수 · 단위) 것만 — 방 번호 원 속 글자(«6실» → «769») 는 빼려고
  if (벽만) {
    const 또렷 = (글자리 || []).filter((r) => { const p = r.믿음 >= 0.8 && 치수글풀기(r.글); return p && (p.값 >= 100 || p.소수 || p.단위) })
    잉.mask = 벽뽑기(잉, { 글자리: 또렷 }).mask
  }
  // 종이 가장자리(사진 테두리 찌꺼기) 비우기
  const 테 = Math.max(3, Math.round(0.004 * Math.max(w, h)))
  {
    // 테두리에 닿고 · 한 변에 바짝 붙은(3 % 안) 잉크 덩이 = 종이 밖 바닥 · 그림자 찌꺼기 → 통째로 지움
    const 띠 = 0.03 * Math.max(w, h)
    const { lab, 덩이들 } = 덩이(잉.mask, w, h)
    const 지울 = 덩이들.map((b) => {
      const 닿 = b.x0 < 테 || b.y0 < 테 || b.x1 >= w - 테 || b.y1 >= h - 테
      if (!닿) return false
      return (b.x0 < 테 && b.x1 < 띠) || (b.x1 >= w - 테 && b.x0 > w - 띠) || (b.y0 < 테 && b.y1 < 띠) || (b.y1 >= h - 테 && b.y0 > h - 띠)
    })
    if (지울.some(Boolean)) for (let i = 0; i < lab.length; i++) if (lab[i] >= 0 && 지울[lab[i]]) 잉.mask[i] = 0
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (x < 테 || y < 테 || x >= w - 테 || y >= h - 테) 잉.mask[y * w + x] = 0
  진행('뼈대 만드는 중', 0.3)
  const 뼈 = 뼈대(잉.mask, w, h)
  const 거 = 거리(잉.mask, w, h)
  const 굵들 = []
  for (let i = 0; i < 뼈.length; i += 1) if (뼈[i]) 굵들.push(거[i])
  굵들.sort((a, b) => a - b)
  const 굵 = Math.max(1.5, 2 * (굵들[굵들.length >> 1] || 1))
  진행('글자 가르는 중', 0.45)
  // ① 선에 안 닿은 글자 — 원래 판에서
  const 덩 = 덩이(잉.mask, w, h)
  const 글 = 글자가르기(잉, 굵, { 덩이: 덩 })
  // ⑨ 글 읽기(PaddleOCR) 상자가 있으면 — 상자 안에 70 % 넘게 든 잉크 덩이는 글자(선에서 뺌 · 글씨 그림으로)
  const 글상자 = (o.글목록 || []).filter((b) => b && b.믿음 >= 0.5 && b.L > 0 && b.W > 0)
  if (글상자.length) {
    const 칸 = new Uint8Array(w * h)
    for (const b of 글상자) {
      const hx = (Math.abs(b.u[0]) * b.L + Math.abs(b.u[1]) * b.W) / 2, hy = (Math.abs(b.u[1]) * b.L + Math.abs(b.u[0]) * b.W) / 2
      for (let y = Math.max(0, Math.floor(b.c[1] - hy)); y <= Math.min(h - 1, Math.ceil(b.c[1] + hy)); y++) for (let x = Math.max(0, Math.floor(b.c[0] - hx)); x <= Math.min(w - 1, Math.ceil(b.c[0] + hx)); x++) {
        const dx = x - b.c[0], dy = y - b.c[1]
        if (Math.abs(dx * b.u[0] + dy * b.u[1]) <= b.L / 2 && Math.abs(-dx * b.u[1] + dy * b.u[0]) <= b.W / 2) 칸[y * w + x] = 1
      }
    }
    const 안 = new Int32Array(덩.덩이들.length)
    for (let i = 0; i < 덩.lab.length; i++) { const L = 덩.lab[i]; if (L >= 0 && 칸[i]) 안[L]++ }
    덩.덩이들.forEach((b, L) => { if (b.n >= 3 && 안[L] >= 0.7 * b.n) 글.글자덩이.add(L) })
  }
  const 읽을수 = o.숫자읽기 !== false && 무게있음()
  // ② 선에 닿은 숫자(손그림에서 흔함) — 긴 선 자리를 지운 판에서 다시 가르고, «숫자로 또렷이 읽히는» 것만 더함
  //    (지우다 생긴 선 토막 · 빗금 반쪽은 글자가 아님 — 두 자리 이상 · 100 이상(또는 소수) · 믿음 0.45 이상 · «1» 만은 아님)
  const 새낱말 = []
  let 덩2 = null
  if (읽을수) {
    const 길1 = 길따기(뼈, w, h, { 가지: Math.round(2.5 * 굵) })
    const 도형1 = 길맞추기(길1, { 굵, 손그림: 손 })
    const 긴선 = Math.max(10 * 굵, 0.03 * Math.max(w, h))
    const 지운 = new Uint8Array(잉.mask)
    const 반폭 = 굵 / 2 + 1.6
    for (const s of 도형1) {
      if (s.t !== 'L') continue
      const L = Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1])
      if (L < 긴선) continue
      const ux = (s.b[0] - s.a[0]) / L, uy = (s.b[1] - s.a[1]) / L
      for (let t = -반폭; t <= L + 반폭; t += 0.5) for (let q = -반폭; q <= 반폭; q += 0.5) {
        const x = Math.round(s.a[0] + ux * t - uy * q), y = Math.round(s.a[1] + uy * t + ux * q)
        if (x >= 0 && y >= 0 && x < w && y < h) 지운[y * w + x] = 0
      }
    }
    덩2 = 덩이(지운, w, h)
    const 글2 = 글자가르기({ mask: 지운, w, h }, 굵, { 덩이: 덩2 })
    for (const n of 글2.낱말들) {
      // 이미 ①에서 글자로 본 덩이로만 된 낱말은 건너뜀
      let 새 = false
      for (const id of n.들) {
        const b = 덩2.덩이들[id]
        for (let y = b.y0; y <= b.y1 && !새; y++) for (let x = b.x0; x <= b.x1; x++) { const q = y * w + x; if (덩2.lab[q] === id && !글.글자덩이.has(덩.lab[q])) { 새 = true; break } }
        if (새) break
      }
      if (!새) continue
      let r
      try { r = 낱말읽기(n, 덩2.덩이들, 덩2.lab, w) } catch (e) { continue }
      const 자리수 = (r.글 || '').replace(/\D/g, '').length
      if (r.숫자임 && r.믿음 >= 0.45 && 자리수 >= 2 && (r.값 >= 100 || r.소수) && !/^1+$/.test(r.글)) 새낱말.push({ n, r })
    }
  }
  const 새덩이 = new Set(새낱말.flatMap((x) => x.n.들))
  // 글자 덩이 · 점선 덩이의 뼈대는 도형에서 뺌
  const 점선덩이 = new Set(글.점선.flat())
  const 글뼈 = new Uint8Array(w * h)
  for (let i = 0; i < 뼈.length; i++) {
    if (!뼈[i]) continue
    const L = 덩.lab[i]
    if (글.글자덩이.has(L)) { 뼈[i] = 0; 글뼈[i] = 1 } else if (점선덩이.has(L)) 뼈[i] = 0
    else if (덩2 && 새덩이.has(덩2.lab[i])) { 뼈[i] = 0; 글뼈[i] = 1 }
  }
  진행('선 맞추는 중', 0.6)
  const 길 = 길따기(뼈, w, h, { 가지: Math.round(2.5 * 굵) })
  let 도형 = 길맞추기(길, { 굵, 손그림: 손 })
  // 점선 → 선 하나(점 전체로 맞춤)
  for (const 들 of 글.점선) {
    const pts = []
    for (const id of 들) { const b = 덩.덩이들[id]; for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) if (덩.lab[y * w + x] === id) pts.push([x, y]) }
    let sx = 0, sy = 0; for (const p of pts) { sx += p[0]; sy += p[1] }
    const cx = sx / pts.length, cy = sy / pts.length
    let xx = 0, xy = 0, yy = 0; for (const p of pts) { const dx = p[0] - cx, dy = p[1] - cy; xx += dx * dx; xy += dx * dy; yy += dy * dy }
    const th = 0.5 * Math.atan2(2 * xy, xx - yy), ux = Math.cos(th), uy = Math.sin(th)
    let t0 = Infinity, t1 = -Infinity; for (const p of pts) { const t = (p[0] - cx) * ux + (p[1] - cy) * uy; t0 = Math.min(t0, t); t1 = Math.max(t1, t) }
    도형.push({ t: 'L', a: [cx + ux * t0, cy + uy * t0], b: [cx + ux * t1, cy + uy * t1], c: [cx, cy], n: pts.length, 끝: ['E', 'E'], 점선: true })
  }
  진행('반듯하게', 0.72)
  const 반 = 반듯하게(도형, { 굵, 손그림: 손, w, h })
  // 숫자 읽기
  진행('숫자 읽는 중', 0.82)
  const 숫자 = [], 글씨낱말 = []
  const 모든낱말 = [...글.낱말들.map((n) => ({ n, r: null })), ...새낱말.map((x) => ({ ...x, 닿음: true }))]
  for (const { n, r: r0, 닿음 } of 모든낱말) {
    let r = r0 || { 숫자임: false }
    if (!r0 && 읽을수) {
      try { r = 낱말읽기(n, 덩.덩이들, 덩.lab, w) } catch (e) { r = { 숫자임: false } }
    }
    const c = 돌림점(n.c, 반.가운데, 반.돌림각)
    if (r.숫자임 && r.값 > 0 && !(n.들.length === 1 && r.값 < 10)) {
      숫자.push({ c, 꼴: r.돌림 === 0 ? 'H' : 'V', 높이: n.높이, 값: r.값, 믿음: r.믿음, 돌림: r.돌림, 소수: r.소수, 글: r.글, 네모: n.네모, 들: n.들, 후보: r.후보, 닿음: !!닿음 })
    } else 글씨낱말.push({ ...n, c })
  }
  if (글상자.length) 글숫자합치기(숫자, 글상자, (p) => 돌림점(p, 반.가운데, 반.돌림각), 손)
  // 🧱 칠한 평면도: 방 번호 원 속 글자(«6실» 을 «769» 로) · 가구 무늬를 숫자로 잘못 읽은 것은 치수로 안 씀 — 또렷한(0.8 넘게) 치수다운 숫자만(인쇄 치수는 또렷이 읽힘)
  if (벽만) for (let i = 숫자.length - 1; i >= 0; i--) { const n = 숫자[i]; if (!((n.믿음 ?? 0) >= 0.8 && (n.값 >= 100 || n.소수))) 숫자.splice(i, 1) }
  const 치수 = 치수짝짓기(숫자, 반.도형, 반.빗금, { 굵, 크기: Math.max(w, h), 끊긴선: 벽만 })
  // 글씨 그림(TEXT 레이어): 글자 뼈대를 짧은 꺾은선으로
  const 글길 = 길따기(글뼈, w, h, { 가지: 0 })
  const 글씨줄 = 글길.map((g) => 줄이기선(g.p.map((p) => 돌림점(p, 반.가운데, 반.돌림각)), 0.8)).filter((p) => p.length >= 2)
  진행('끝', 1)
  return {
    w, h, 굵, 손그림: 손, 돌림각: 반.돌림각, 가운데: 반.가운데,
    도형: 반.도형, 빗금: 반.빗금, 숫자, 치수, 글씨줄, 글씨낱말,
    잉크문턱: 잉.T, 벽만, 칠함: 칠.칠함,
  }
}

/* ───────── 글 읽기(PaddleOCR) 숫자와 숫자망 숫자 합치기 ───────── */
// 숫자로 자주 헷갈리는 글자 → 숫자
const 숫자닮음 = { O: '0', o: '0', D: '0', Q: '0', l: '1', I: '1', '|': '1', i: '1', Z: '2', z: '2', S: '5', s: '5', B: '8', G: '6', b: '6', q: '9', g: '9', T: '7', A: '4' }
/** 글 읽기 결과 한 상자의 «치수 후보»(자리마다 위 3 숫자 · 단위 · 쉼표 그대로) — 확률 큰 차례 */
function 줄후보(자리, 글, 믿음) {
  if (!자리 || !자리.length) { const p = 치수글풀기(글); return p ? [{ ...p, p: 믿음 }] : [] }
  let 묶 = [{ t: '', p: 1 }]
  for (const z of 자리) {
    const 숫 = /[0-9]/.test(z.ch) || 숫자닮음[z.ch] != null
    const 고 = 숫 ? [...(z.후 || []).filter((x) => x[1] > 0.01)] : [[z.ch, 1]]
    if (숫 && !/[0-9]/.test(z.ch) && !고.length) 고.push([숫자닮음[z.ch], 0.3])
    if (숫 && /[0-9]/.test(z.ch) && !고.some((x) => x[0] === z.ch)) 고.unshift([z.ch, z.p])
    const 새 = []
    for (const b of 묶) for (const [ch, p] of 고.slice(0, 3)) 새.push({ t: b.t + ch, p: b.p * Math.max(0.001, p) })
    새.sort((a, b) => b.p - a.p)
    묶 = 새.slice(0, 16)
  }
  const 나 = new Map()
  const 넣 = (t, p) => {
    const 풀 = 치수글풀기(t)
    if (!풀) return
    if (풀.추정) p *= 0.6   // «15-0» 처럼 표 없는 피트-인치 짐작
    const 키 = 풀.값 + '|' + 풀.배수.join(',')
    if (!나.has(키) || 나.get(키).p < p) 나.set(키, { ...풀, p })
  }
  for (const b of 묶) {
    // «00021» 처럼 0 이 둘 넘게 앞에 오는 숫자는 거의 «거꾸로 읽은» 것 — 아주 낮게
    const 앞영 = /^0\d\d/.test(b.t) ? 0.15 : 1
    넣(b.t, b.p * 앞영)
    // 손글씨 소수점(윗점 · 쉼표)을 0 으로 읽음: «1'2m» → «102m» → 1.2 m 도 후보로
    const z = b.t.match(/^(\d)0(\d{1,2})([mM])$/)
    if (z) 넣(z[1] + '.' + z[2] + z[3], b.p * 0.5)
  }
  // 끝 글자 하나가 치수선 눈금 · 화살을 숫자로 읽은 것일 수 있음(«14800» → «4800») — 그 글자 믿음이 낮으면 빼 본 것도 후보로
  if (자리.length >= 4) {
    const 첫 = 자리[0], 끝 = 자리[자리.length - 1]
    const 몸 = 묶[0] ? 묶[0].t : ''
    if (몸.length === 자리.length) {
      if (/[0-9]/.test(첫.ch) && 첫.p < 0.8) 넣(몸.slice(1), 묶[0].p * (1 - 첫.p) * 0.8)
      if (/[0-9]/.test(끝.ch) && 끝.p < 0.8) 넣(몸.slice(0, -1), 묶[0].p * (1 - 끝.p) * 0.8)
      if (첫.ch === '1' && 첫.p < 0.95) 넣(몸.slice(1), 묶[0].p * 0.25)   // 앞 «1» = 세로 눈금
    }
  }
  return [...나.values()]
}

/** 글 읽기 한 상자 → 치수 후보들 — PaddleOCR 읽기 + (있으면) 손글씨 숫자 전용 읽기를 합침: 둘이 같은 값이면 믿음을 올림 */
export function 글후보(r, 손그림 = true) {
  const 가 = 줄후보(r.자리, r.글, r.믿음)
  const 손무게 = 손그림 ? 0.95 : 0.5   // 인쇄 도면은 PaddleOCR 가 더 정확 — 손글씨 모델만 읽은 값은 낮게
  if (!r.손 || !r.손.글) return 가.sort((a, b) => b.p - a.p)
  const 나 = 줄후보(r.손.자리, r.손.글, r.손.믿음)
  // 반대 방향 읽기도(믿음 비율만큼 낮춰서)
  if (r.손.뒤 && r.손.뒤.글) for (const c of 줄후보(r.손.뒤.자리, r.손.뒤.글, r.손.뒤.믿음)) 나.push({ ...c, p: c.p * Math.min(1, r.손.뒤.믿음 / Math.max(0.05, r.손.믿음)) * 0.6 })
  const 모 = new Map()
  for (const c of 가) 모.set(c.값 + '|' + c.배수.join(','), { ...c })
  for (const c of 나) {
    const 키 = c.값 + '|' + c.배수.join(',')
    const 옛 = 모.get(키)
    if (옛) { 옛.p = Math.min(1, Math.max(옛.p, c.p) + 0.35 * Math.min(옛.p, c.p)); 옛.둘 = true }
    else 모.set(키, { ...c, p: c.p * 손무게, 손읽기: true })
  }
  return [...모.values()].sort((a, b) => b.p - a.p)
}

function 글숫자합치기(숫자, 글상자, 돌림, 손그림 = true) {
  const 안 = (b, x, y, 덤 = 1.15) => { const dx = x - b.c[0], dy = y - b.c[1]; return Math.abs(dx * b.u[0] + dy * b.u[1]) <= (b.L / 2) * 덤 && Math.abs(-dx * b.u[1] + dy * b.u[0]) <= (b.W / 2) * 덤 }
  const 지울 = new Set()
  for (const b of 글상자) {
    const 후 = 글후보(b, 손그림)
    // 이 상자 안의 숫자망 숫자(같은 글을 두 번 읽은 것)
    const 겹 = []
    숫자.forEach((n, i) => { if (!지울.has(i) && n.네모 && 안(b, (n.네모[0] + n.네모[2]) / 2, (n.네모[1] + n.네모[3]) / 2)) 겹.push(i) })
    if (!후.length) {
      // 글 읽기가 «숫자 아닌 글»(방 이름 · 설명)로 또렷이 읽었으면 그 자리의 숫자망 숫자는 버림
      const 글자수 = (b.글.match(/[A-Za-z]/g) || []).length
      if (b.믿음 >= 0.8 && 글자수 >= 2 && !/\d/.test(b.글)) for (const i of 겹) 지울.add(i)
      continue
    }
    // 후보 합치기: 둘이 같은 값을 읽으면 믿음을 올림
    const 모음 = new Map()
    for (const c of 후) 모음.set(c.값 + '|' + c.배수.join(','), { 값: c.값, 배수: c.배수, 소수: c.소수, 단위: c.단위, p: c.p, 글: c.글, 추정: c.추정 })
    for (const i of 겹) for (const c of 숫자[i].후보 || [{ 값: 숫자[i].값, p: 숫자[i].믿음 }]) {
      const 같은 = [...모음.values()].find((x) => x.값 === c.값)
      if (같은) 같은.p = Math.min(1, Math.max(같은.p, c.p) + 0.3 * Math.min(같은.p, c.p))
      else 모음.set(c.값 + '|cnn', { 값: c.값, 배수: null, 소수: !!숫자[i].소수, p: c.p * 0.8 })
    }
    for (const i of 겹) 지울.add(i)
    const 줄 = [...모음.values()].sort((a, b) => b.p - a.p)
    const 최 = 줄[0]
    const 세로 = Math.abs(b.u[1]) > Math.abs(b.u[0])
    const 방 = b.방향 || b.u
    숫자.push({
      c: 돌림(b.c), 꼴: 세로 ? 'V' : 'H', 높이: Math.max(4, b.W / 1.5), 값: 최.값, 믿음: Math.min(1, 최.p), 돌림: 세로 ? (방[1] < 0 ? -90 : 90) : 0,
      소수: !!최.소수, 배수: 최.배수 || undefined, 단위: 최.단위 || '', 글: b.글, 글길: b.L * 0.8, 네모: [b.c[0] - b.L / 2, b.c[1] - b.W / 2, b.c[0] + b.L / 2, b.c[1] + b.W / 2],
      후보: 줄.slice(0, 12).map((x) => ({ 값: x.값, p: x.p, 배수: x.배수 || undefined, 단위: x.단위 || '' })), 글읽기: true,
    })
  }
  const 남 = 숫자.filter((_, i) => !지울.has(i))
  숫자.length = 0; 숫자.push(...남)
}

/** 꺾은선 줄이기(Douglas-Peucker) */
function 줄이기선(pts, eps) {
  if (pts.length < 3) return pts
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1
  const st = [[0, pts.length - 1]]
  while (st.length) {
    const [i, j] = st.pop()
    const A = pts[i], B = pts[j], L = Math.hypot(B[0] - A[0], B[1] - A[1])
    let 최 = -1, k = -1
    for (let q = i + 1; q < j; q++) {
      const p = pts[q]
      const d = L > 1e-9 ? Math.abs((B[0] - A[0]) * (A[1] - p[1]) - (A[0] - p[0]) * (B[1] - A[1])) / L : Math.hypot(p[0] - A[0], p[1] - A[1])
      if (d > 최) { 최 = d; k = q }
    }
    if (최 > eps) { keep[k] = 1; st.push([i, k], [k, j]) }
  }
  return pts.filter((_, i) => keep[i])
}

/**
 * 치수 풀기 (자동으로 읽은 것 + 사람이 넣은 것).
 * @param 사람치수 [{ 선:도형번호, 값(mm) }] — 사람이 선을 눌러 넣은 길이
 * @param o { 척(mm/px · 종이 축척으로 아는 경우), 끈치수: Set(자동 치수 번호 — 사람이 «틀림» 으로 끈 것) , 고친값: Map(번호→값) }
 */
export function 맞추기(결과, 사람치수 = [], o = {}) {
  const 굵 = 결과.굵
  const 자동 = 결과.치수.map((d, i) => ({ ...d, 번호: i, 값: o.고친값?.has(i) ? o.고친값.get(i) : d.값, 사람: o.고친값?.has(i) || false })).filter((d) => !(o.끈치수 && o.끈치수.has(d.번호)))
  const 손 = []
  for (const s of 사람치수) {
    const t = 결과.도형[s.선]
    if (!t || t.t !== 'L' || !(s.값 > 0)) continue
    if (t.꼴 === 'H') 손.push({ 꼴: 'H', a: Math.min(t.a[0], t.b[0]), b: Math.max(t.a[0], t.b[0]), 줄: t.a[1], 값: s.값, 사람: true, 선: s.선, 손넣음: true })
    else if (t.꼴 === 'V') 손.push({ 꼴: 'V', a: Math.min(t.a[1], t.b[1]), b: Math.max(t.a[1], t.b[1]), 줄: t.a[0], 값: s.값, 사람: true, 선: s.선, 손넣음: true })
    else {
      // 기운 선은 «전체 크기» 만 맞춤
      const L = Math.hypot(t.b[0] - t.a[0], t.b[1] - t.a[1])
      if (L > 0) o = { ...o, 척: s.값 / L }
    }
  }
  // 손그림은 치수선 끝(보조선)이 몇 픽셀씩 어긋나게 그려짐 → 같은 자리로 묶는 폭을 넓힘(부분 치수 합 = 전체 치수 검산이 되게)
  const 묶폭 = 결과.손그림 ? Math.max(4, 2 * 굵, 0.008 * Math.max(결과.w || 0, 결과.h || 0)) : Math.max(4, 2 * 굵)
  // 그림 둘레(선들의 가로 · 세로 폭) — «전체 치수»(둘레 거의 끝에서 끝까지 걸친 치수)를 알아보려고
  let X0 = Infinity, X1 = -Infinity, Y0 = Infinity, Y1 = -Infinity
  for (const s of 결과.도형) if (s.t === 'L' && !s.지움) { X0 = Math.min(X0, s.a[0], s.b[0]); X1 = Math.max(X1, s.a[0], s.b[0]); Y0 = Math.min(Y0, s.a[1], s.b[1]); Y1 = Math.max(Y1, s.a[1], s.b[1]) }
  const 범위 = isFinite(X0) ? { H: X1 - X0, V: Y1 - Y0 } : null
  const 풀 = 치수풀기([...자동, ...손], { 손그림: 결과.손그림, 허용: 묶폭, 척: o.척, 크기px: Math.max(결과.w || 0, 결과.h || 0) || undefined, 범위 })
  if (!풀.척x) { const s = o.척 || 1; 풀.척x = 풀.척y = s; 풀.x = (v) => v * s; 풀.y = (v) => v * s; 풀.축척모름 = !o.척 }
  return 풀
}

/** 결과 + 풀이 → DXF 그림 (mm · y 위로 · 왼아래 쪽을 0 근처로) */
/** 치수선 · 보조선 찾기(3D 로 세울 때 빼려고) — 짝지은 치수의 선이 «건물 몸통» 밖에 있으면 치수선, 그 치수선에 닿는 직각 선 = 보조선.
 *  몸통 = 짝 안 지은 긴 선(전체의 15 % 넘는)들의 둘레 — 벽 옆에 바로 적은 손그림 숫자(벽이 곧 짝)는 몸통 안이라 벽으로 남음 */
function 치수꾸밈(결과, 풀) {
  const 나 = new Set()
  const 도 = 결과.도형
  const 짝 = new Set()
  for (const d of 풀.치수들 || []) if (d.쓰임 && d.선 >= 0 && !d.손넣음) { 짝.add(d.선); if (d.선2 >= 0) 짝.add(d.선2) }
  if (!짝.size) return 나
  let X0 = Infinity, Y0 = Infinity, X1 = -Infinity, Y1 = -Infinity
  for (const s of 도) if (s.t === 'L' && !s.지움) { X0 = Math.min(X0, s.a[0], s.b[0]); X1 = Math.max(X1, s.a[0], s.b[0]); Y0 = Math.min(Y0, s.a[1], s.b[1]); Y1 = Math.max(Y1, s.a[1], s.b[1]) }
  const 큰 = Math.max(X1 - X0, Y1 - Y0)
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  도.forEach((s, i) => {
    if (s.t !== 'L' || s.지움 || 짝.has(i)) return
    if (Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1]) < 0.15 * 큰) return
    x0 = Math.min(x0, s.a[0], s.b[0]); x1 = Math.max(x1, s.a[0], s.b[0]); y0 = Math.min(y0, s.a[1], s.b[1]); y1 = Math.max(y1, s.a[1], s.b[1])
  })
  if (!isFinite(x0)) return 나
  const 허 = Math.max(4, 2 * (결과.굵 || 2))
  const 치선 = []
  for (const i of 짝) {
    const s = 도[i]; if (!s || s.t !== 'L') continue
    const 밖 = s.꼴 === 'H' ? (s.a[1] < y0 - 허 || s.a[1] > y1 + 허) : s.꼴 === 'V' ? (s.a[0] < x0 - 허 || s.a[0] > x1 + 허) : false
    if (밖) { 나.add(i); 치선.push(s) }
  }
  도.forEach((s, i) => {
    if (s.t !== 'L' || 나.has(i) || (s.꼴 !== 'H' && s.꼴 !== 'V')) return
    for (const d of 치선) {
      if (d.꼴 === s.꼴) continue
      const k = d.꼴 === 'H' ? 0 : 1, j = 1 - k   // d 가 가로면 s 는 세로: s 의 x 가 d 의 x 범위 안 · d 의 y 가 s 의 y 범위(±허) 안
      const 자리 = s.a[k], d0 = Math.min(d.a[k], d.b[k]), d1 = Math.max(d.a[k], d.b[k])
      const 줄 = d.a[j], s0 = Math.min(s.a[j], s.b[j]), s1 = Math.max(s.a[j], s.b[j])
      if (자리 >= d0 - 허 && 자리 <= d1 + 허 && 줄 >= s0 - 허 && 줄 <= s1 + 허) { 나.add(i); break }
    }
  })
  return 나
}

export function 결과그림(결과, 풀, o = {}) {
  const X = 풀.x, Y = (v) => -풀.y(v)
  const P = (p) => [X(p[0]), Y(p[1])]
  const 그림 = { 선: [], 호: [], 원: [], 줄: [], 글: [], 치수: [] }
  const 원래치수선 = new Set()
  if (!결과.손그림) for (const d of 풀.치수들) if (d.쓰임 && d.선 >= 0 && !d.손넣음) { 원래치수선.add(d.선); if (d.선2 >= 0) 원래치수선.add(d.선2) }
  const 꾸밈 = 치수꾸밈(결과, 풀)
  결과.도형.forEach((s, i) => {
    if (s.t === 'L') 그림.선.push({ a: P(s.a), b: P(s.b), 층: s.점선 ? 'DASH' : 원래치수선.has(i) ? 'DIM_SRC' : 'LINE', ...(꾸밈.has(i) ? { 꾸밈: true } : {}) })
    else {
      const 척 = (Math.abs(X(s.c[0] + s.r) - X(s.c[0] - s.r)) + Math.abs(풀.y(s.c[1] + s.r) - 풀.y(s.c[1] - s.r))) / (4 * s.r || 1)
      const c = P(s.c), r = s.r * 척
      if (s.t === 'C') 그림.원.push({ c, r, 층: 'LINE' })
      else {
        const a0 = -Math.max(s.a0, s.a1) * 180 / Math.PI, a1 = -Math.min(s.a0, s.a1) * 180 / Math.PI
        그림.호.push({ c, r, a0, a1, 층: 'LINE' })
      }
    }
  })
  if (o.글씨 !== false) for (const pl of 결과.글씨줄) 그림.줄.push({ 점: pl.map(P), 층: 'TEXT' })
  const 붙임 = Math.max(4, 2 * (결과.굵 || 2)) + 1
  for (const d of 풀.치수들) {
    if (!d.쓰임) continue
    const mm = Math.round(d.mm)
    // 치수 끝은 풀이의 매듭(치수끼리 맞춘 자리) 그대로 — 캐드에서 다시 재도 적힌 숫자와 꼭 같게
    const 끝 = (매듭, v, f) => { let k = null, 최 = Infinity; for (const m of 매듭 || []) { const e = Math.abs(m.px - v); if (e < 최) { 최 = e; k = m } } return k && 최 <= 붙임 ? k.mm : f(v) }
    if (d.꼴 === 'H') {
      const 줄위 = d.선자리 != null ? d.선자리 : 결과.손그림 && !d.손넣음 && d.숫자 != null ? 결과.숫자[d.숫자].c[1] : d.줄
      그림.치수.push({ 꼴: 'H', p1: [끝(풀.매듭x, d.a, X), Y(d.줄)], p2: [끝(풀.매듭x, d.b, X), Y(d.줄)], 줄: [0, Y(줄위)], 글: String(mm) })
    } else {
      const 줄옆 = d.선자리 != null ? d.선자리 : 결과.손그림 && !d.손넣음 && d.숫자 != null ? 결과.숫자[d.숫자].c[0] : d.줄
      그림.치수.push({ 꼴: 'V', p1: [X(d.줄), -끝(풀.매듭y, d.b, 풀.y)], p2: [X(d.줄), -끝(풀.매듭y, d.a, 풀.y)], 줄: [X(줄옆), 0], 글: String(mm) })
    }
  }
  // 왼아래를 (0,0) 가까이로
  let x0 = Infinity, y0 = Infinity
  for (const s of 그림.선) { x0 = Math.min(x0, s.a[0], s.b[0]); y0 = Math.min(y0, s.a[1], s.b[1]) }
  if (isFinite(x0)) {
    const dx = -Math.round(x0 / 10) * 10, dy = -Math.round(y0 / 10) * 10
    const 옮 = (p) => [p[0] + dx, p[1] + dy]
    for (const s of 그림.선) { s.a = 옮(s.a); s.b = 옮(s.b) }
    for (const a of [...그림.호, ...그림.원]) a.c = 옮(a.c)
    for (const pl of 그림.줄) pl.점 = pl.점.map(옮)
    for (const d of 그림.치수) { d.p1 = 옮(d.p1); d.p2 = 옮(d.p2); d.줄 = 옮(d.줄) }
  }
  return 그림
}

/* ───────── 건물 사진 ───────── */

export function 건물펴기(판, o = {}) {
  const k = Math.max(1, Math.max(판.w, 판.h) / 1400)
  const 작 = k > 1 ? 줄이기(판, k) : 판
  const 선분 = 선분찾기(작, { 최소길이: Math.max(14, 0.025 * Math.max(작.w, 작.h)) })
  const V = 소실점펴기(선분, 작.w, 작.h, { 최대: 1400 })
  if (!V) return { 실패: '건물의 세로 · 가로 선을 충분히 못 찾았습니다 — 건물 정면이 크게 나오게 찍어 주세요(또는 네 점 직접 찍기)' }
  // 작은 판 기준 H → 큰 판으로: 사진 = k × 작은 좌표 · 나올 판도 (최대/1400) 배로 키움
  const 키움 = Math.min(2.2, (o.최대 || 2600) / Math.max(V.너비, V.높이))
  const S = [k, 0, 0, 0, k, 0, 0, 0, 1], T = [1 / 키움, 0, 0, 0, 1 / 키움, 0, 0, 0, 1]
  const H = 곱(S, 곱(V.H, T))
  const 너비 = Math.round(V.너비 * 키움), 높이 = Math.round(V.높이 * 키움)
  const 편 = 펴기(판, H, 너비, 높이, NaN)
  return { 편, 틀: { H, 너비, 높이 }, 소실: V, 선분수: 선분.length }
}

export function 건물읽기(편, o = {}) {
  const { w, h } = 편
  const 긴 = Math.max(w, h)
  const 선분 = 선분찾기(편, { 최소길이: Math.max(16, (o.세밀 ?? 0.02) * 긴) })
  const 도형 = 선분.map((s) => ({ t: 'L', a: [s[0], s[1]], b: [s[2], s[3]], c: [(s[0] + s[2]) / 2, (s[1] + s[3]) / 2], n: Math.hypot(s[2] - s[0], s[3] - s[1]), 끝: ['E', 'E'] }))
  const 반 = 반듯하게(도형, { 굵: 2, 손그림: false, w, h })
  // 정면은 가로 · 세로가 거의 다 — 기운 선은 길 때만(지붕 경사)
  const 남 = 반.도형.filter((s) => s.t !== 'L' || s.꼴 === 'H' || s.꼴 === 'V' || Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1]) > 0.12 * 긴)
  return { w, h, 굵: 2, 손그림: false, 건물: true, 돌림각: 반.돌림각, 가운데: 반.가운데, 도형: 남, 빗금: [], 숫자: [], 치수: [], 글씨줄: [], 글씨낱말: [] }
}

/** 건물: 전체 너비 · 높이 치수를 저절로 (사람이 길이 하나를 넣은 뒤) */
export function 건물치수(결과, 풀) {
  /* 🏢 G287 소장님 「저절로 넣게 만들어줘 치수」 — 건물 정면: 아래에 «창 · 문 · 기둥 자리 치수 줄 + 전체 폭», 오른쪽에 «층 · 창 높이 치수 줄 + 전체 높이».
     세로선(길이 4 % 넘는 것)이 선 자리 = 가로 치수의 멈춤 · 가로선 자리 = 세로 치수의 멈춤(가까우면 하나 · 너무 잘면 합침 · 많으면 긴 선 자리만 16 칸까지) */
  const 선 = 결과.도형.filter((s) => s.t === 'L' && !s.지움)
  if (!선.length) return []
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity
  for (const s of 선) { x0 = Math.min(x0, s.a[0], s.b[0]); x1 = Math.max(x1, s.a[0], s.b[0]); y0 = Math.min(y0, s.a[1], s.b[1]); y1 = Math.max(y1, s.a[1], s.b[1]) }
  const W = x1 - x0, H = y1 - y0
  if (!(W > 0 && H > 0)) return []
  const mmx = (a, b) => Math.abs(풀.x(b) - 풀.x(a)), mmy = (a, b) => Math.abs(풀.y(b) - 풀.y(a))
  const 띄움 = 0.06 * Math.max(W, H)
  const 멈춤들 = (꼴, 끝0, 끝1, 넓) => {
    const k = 꼴 === 'V' ? 0 : 1   // 세로선 → x 자리 · 가로선 → y 자리
    const 자 = []
    for (const s of 선) {
      if (s.꼴 !== 꼴) continue
      const L = Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1])
      if (L < 0.04 * (꼴 === 'V' ? H : W)) continue
      자.push({ v: (s.a[k] + s.b[k]) / 2, w: L })
    }
    자.sort((p, q) => p.v - q.v)
    const 허 = Math.max(4, 0.006 * 넓)
    const 묶 = []
    for (const z of 자) { const m = 묶[묶.length - 1]; if (m && z.v - m.끝 <= 허) { m.합 += z.v * z.w; m.w += z.w; m.끝 = z.v } else 묶.push({ 합: z.v * z.w, w: z.w, 끝: z.v }) }
    let 점 = 묶.map((m) => ({ v: m.합 / m.w, w: m.w }))
    점 = 점.filter((z) => z.v > 끝0 + 0.012 * 넓 && z.v < 끝1 - 0.012 * 넓)
    // 너무 잘게(전체의 1.5 % 안) 붙은 자리는 긴 선 쪽 하나만
    const 남 = []
    for (const z of 점) { const m = 남[남.length - 1]; if (m && z.v - m.v < 0.015 * 넓) { if (z.w > m.w) 남[남.length - 1] = z } else 남.push(z) }
    let 고 = 남
    // 좁은 무리 안쪽 자리(창 가운데 문살 · 두 줄 창틀 사이)는 뺌 — 양옆 자리 사이가 전체의 9 % 안이면 가운데는 창 안
    for (let 바뀜 = true; 바뀜;) {
      바뀜 = false
      const 줄 = [끝0, ...고.map((z) => z.v), 끝1]
      for (let i = 0; i < 고.length; i++) if (줄[i + 2] - 줄[i] < 0.09 * 넓) { 고.splice(i, 1); 바뀜 = true; break }
    }
    if (고.length > 15) 고 = 고.slice().sort((p, q) => q.w - p.w).slice(0, 15).sort((p, q) => p.v - q.v)
    return [끝0, ...고.map((z) => z.v), 끝1]
  }
  const 나 = []
  const xs = 멈춤들('V', x0, x1, W), ys = 멈춤들('H', y0, y1, H)
  if (xs.length > 2) for (let i = 0; i + 1 < xs.length; i++) 나.push({ 꼴: 'H', a: xs[i], b: xs[i + 1], 줄: y1, 선자리: y1 + 띄움, mm: mmx(xs[i], xs[i + 1]), 쓰임: true, 선: -1, 손넣음: true, 건물자동: true })
  나.push({ 꼴: 'H', a: x0, b: x1, 줄: y1, 선자리: y1 + 띄움 * (xs.length > 2 ? 2 : 1), mm: mmx(x0, x1), 쓰임: true, 선: -1, 손넣음: true, 건물자동: true, 전체: true })
  if (ys.length > 2) for (let i = 0; i + 1 < ys.length; i++) 나.push({ 꼴: 'V', a: ys[i], b: ys[i + 1], 줄: x1, 선자리: x1 + 띄움, mm: mmy(ys[i], ys[i + 1]), 쓰임: true, 선: -1, 손넣음: true, 건물자동: true })
  나.push({ 꼴: 'V', a: y0, b: y1, 줄: x1, 선자리: x1 + 띄움 * (ys.length > 2 ? 2 : 1), mm: mmy(y0, y1), 쓰임: true, 선: -1, 손넣음: true, 건물자동: true, 전체: true })
  return 나
}
