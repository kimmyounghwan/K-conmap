/**
 * 📐 쪽 모형 — «mm 네모 칸» 으로 그린 A4 한 장 (2026-09-30, 사진대지 · 영수증 정리)
 *
 * 소장님: imgsheet(사진대지 · 영수증 — PDF 만 무료, 엑셀 · 한글 · 워드는 유료) 캡처 → 「아이디어 더 해서 만들어줘. 프로그램으로」
 *
 * ■ 한 장을 네모 칸(rect) 여럿으로 그립니다. 같은 칸들을
 *     화면 미리보기(PhotoBook.jsx) · PDF(쪽pdf.js) · 엑셀(쪽엑셀.js) · 워드(쪽워드.js) · 한글 HWPX(쪽한글.js)
 *   가 그대로 씁니다 — 그래서 다섯 가지가 같은 모양으로 나옵니다.
 * ■ 엑셀 · 워드 · 한글은 «칸을 표로»: 모든 칸의 가로 · 세로 경계를 모아 격자를 짓고(격자로), 칸마다 병합합니다.
 *   (겹치는 칸은 없게 그립니다 — 사진 번호도 사진 위가 아니라 옆 칸에)
 *
 * rect = { x, y, w, h (mm),
 *          글, 크기(pt), 굵게, 정렬: '가' | '왼' | '오', 색('#rrggbb'), 바탕('#rrggbb'),
 *          테: 1(네 변 선) | 0, 굵은테: 1(바깥 굵게 — PDF · 화면만),
 *          그림: 열쇠(그림들 Map 의 열쇠) }
 * 쪽 = { 폭, 높이(mm), 안: {x, y, w, h}(표가 놓일 자리), 칸들: [rect] }
 */

import 폭표원 from './kcmwidths.js'

/* ── 글자 폭(1000 단위) — KCM Gothic 표 · 한글은 940 ── */
let _폭 = null
function 폭표() {
  if (_폭) return _폭
  _폭 = new Map()
  for (const [w, 목록] of Object.entries(폭표원)) {
    for (const v of 목록) {
      if (Array.isArray(v)) for (let c = v[0]; c <= v[1]; c++) _폭.set(c, +w)
      else _폭.set(v, +w)
    }
  }
  return _폭
}
export function 글자폭(ch) {
  const c = ch.codePointAt(0)
  if (c >= 0xac00 && c <= 0xd7a3) return 940
  if (c >= 0x3131 && c <= 0x318e) return 940
  const w = 폭표().get(c)
  if (w) return w
  return c > 0x2e80 ? 1000 : 600
}
/** 글의 폭(mm) — 크기(pt) · 굵으면 3% 넓게 */
export function 글폭(글, 크기, 굵게 = false) {
  let s = 0
  for (const ch of String(글)) s += 글자폭(ch)
  return (s / 1000) * 크기 * 0.3528 * (굵게 ? 1.03 : 1)
}

/**
 * 칸 안에 글 맞추기 — 한 줄로 안 들어가면 글자를 줄이고(원래의 70% 까지), 그래도 안 되면 줄을 나눕니다.
 * 결과 { 크기, 줄들 } — 모든 형식이 이 결과대로 적습니다(그래서 엑셀 · 한글 · 워드에서도 넘치지 않음).
 */
export function 글맞춤(글, 폭mm, 높이mm, 크기 = 9, 굵게 = false) {
  const 원 = String(글 ?? '')
  if (!원) return { 크기, 줄들: [] }
  const 쓸폭 = Math.max(1, 폭mm - 1.6)
  const 쓸높 = Math.max(1, 높이mm - 0.8)
  const 줄높 = (k) => k * 0.3528 * 1.22
  const 작게 = Math.max(6, 크기 * 0.7)
  for (let k = 크기; k >= 작게 - 1e-9; k -= 0.5) {
    const 줄들 = 나누기(원, 쓸폭, k, 굵게)
    if (줄들.length * 줄높(k) <= 쓸높 + 1e-9) return { 크기: k, 줄들 }
  }
  /* 끝까지 안 들어가면 — 들어가는 줄까지만, 마지막 줄 끝에 … */
  const k = 작게
  const 줄들 = 나누기(원, 쓸폭, k, 굵게)
  const 최대 = Math.max(1, Math.floor(쓸높 / 줄높(k)))
  if (줄들.length > 최대) {
    const 남 = 줄들.slice(0, 최대)
    let 끝 = 남[최대 - 1]
    while (끝 && 글폭(끝 + '…', k, 굵게) > 쓸폭) 끝 = 끝.slice(0, -1)
    남[최대 - 1] = 끝 + '…'
    return { 크기: k, 줄들: 남 }
  }
  return { 크기: k, 줄들 }
}

/** 폭에 맞게 줄 나누기 — 띄어쓰기에서 먼저, 안 되면 글자에서 */
export function 나누기(글, 폭mm, 크기, 굵게 = false) {
  const out = []
  for (const 단락 of String(글).split('\n')) {
    if (글폭(단락, 크기, 굵게) <= 폭mm) { out.push(단락); continue }
    let 줄 = ''
    const 낱말들 = 단락.split(/(\s+)/)
    for (const 낱 of 낱말들) {
      const 시험 = 줄 + 낱
      if (글폭(시험, 크기, 굵게) <= 폭mm) { 줄 = 시험; continue }
      if (줄.trim()) { out.push(줄.trimEnd()); 줄 = '' }
      if (/^\s+$/.test(낱)) continue
      /* 낱말 하나가 폭보다 길면 글자 단위로 */
      let 조각 = ''
      for (const ch of 낱) {
        if (글폭(조각 + ch, 크기, 굵게) > 폭mm && 조각) { out.push(조각); 조각 = '' }
        조각 += ch
      }
      줄 = 조각
    }
    if (줄.trim() || !out.length) out.push(줄.trimEnd())
  }
  return out
}

/** 짧은 제목은 글자 사이를 띄웁니다 — 「사진대지」 → 「사 진 대 지」 */
export function 제목띄움(글) {
  const s = String(글 || '').trim()
  if (!s || /\s/.test(s) || [...s].length > 6) return s
  return [...s].join(' ')
}

/* ══════════════════════════════════════════════════════════
   칸들 → 격자(표) — 엑셀 · 워드 · 한글이 씁니다
   ══════════════════════════════════════════════════════════ */

/**
 * @returns { 열: [mm…], 줄: [mm…], 칸: [{ r, c, rs, cs, 칸(rect) | null }] }
 *   칸 = null 은 빈 자리(선 없음) — 모든 자리가 정확히 한 번 덮입니다.
 *   아무 칸도 시작하지 않는 줄/열(«죽은 줄»)은 앞 줄/열에 합칩니다(한글은 그런 줄을 못 가짐).
 */
export function 격자로(쪽, 허용 = 0.6, 고정xs = null) {
  const 안 = 쪽.안
  const 칸들 = 쪽.칸들.filter((k) => k.w > 0.3 && k.h > 0.3)
  const 모으기 = (시작, 끝, 값들) => {
    const v = [...new Set(값들.map((x) => Math.round(x * 100) / 100))]
      .filter((x) => x >= 시작 - 허용 && x <= 끝 + 허용).sort((a, b) => a - b)
    const out = [시작]
    for (const x of v) {
      if (x - out[out.length - 1] > 허용) out.push(x)
    }
    if (끝 - out[out.length - 1] > 허용) out.push(끝)
    else out[out.length - 1] = 끝
    return out
  }
  let xs = 고정xs ? [...고정xs] : 모으기(안.x, 안.x + 안.w, 칸들.flatMap((k) => [k.x, k.x + k.w]))
  let ys = 모으기(안.y, 안.y + 안.h, 칸들.flatMap((k) => [k.y, k.y + k.h]))
  const 가까운 = (arr, v) => {
    let b = 0
    for (let i = 1; i < arr.length; i++) if (Math.abs(arr[i] - v) < Math.abs(arr[b] - v)) b = i
    return b
  }
  let R = ys.length - 1, C = xs.length - 1
  const 차지 = Array.from({ length: R }, () => new Array(C).fill(-1))
  let 놓인 = []
  for (const k of 칸들) {
    const c0 = 가까운(xs, k.x), c1 = 가까운(xs, k.x + k.w)
    const r0 = 가까운(ys, k.y), r1 = 가까운(ys, k.y + k.h)
    if (c1 <= c0 || r1 <= r0) continue
    let 겹침 = false
    for (let r = r0; r < r1 && !겹침; r++) for (let c = c0; c < c1; c++) if (차지[r][c] >= 0) { 겹침 = true; break }
    if (겹침) continue
    const i = 놓인.length
    놓인.push({ r: r0, c: c0, rs: r1 - r0, cs: c1 - c0, 칸: k })
    for (let r = r0; r < r1; r++) for (let c = c0; c < c1; c++) 차지[r][c] = i
  }
  /* 빈 자리 — 1×1 */
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    if (차지[r][c] < 0) { 차지[r][c] = 놓인.length; 놓인.push({ r, c, rs: 1, cs: 1, 칸: null }) }
  }
  /* 죽은 줄 — 이 줄에서 시작하는 칸이 하나도 없으면 앞 줄에 합침 */
  for (let r = R - 1; r >= 1; r--) {
    if (놓인.some((p) => p.r === r)) continue
    for (const p of 놓인) {
      if (p.r < r && p.r + p.rs > r) p.rs -= 1
      if (p.r > r) p.r -= 1
    }
    ys.splice(r, 1)
    R -= 1
  }
  for (let c = C - 1; c >= 1 && !고정xs; c--) {
    if (놓인.some((p) => p.c === c)) continue
    for (const p of 놓인) {
      if (p.c < c && p.c + p.cs > c) p.cs -= 1
      if (p.c > c) p.c -= 1
    }
    xs.splice(c, 1)
    C -= 1
  }
  const 열 = xs.slice(1).map((x, i) => x - xs[i])
  const 줄 = ys.slice(1).map((y, i) => y - ys[i])
  놓인.sort((a, b) => a.r - b.r || a.c - b.c)
  return { 열, 줄, 칸: 놓인, xs, ys }
}

/** 여러 쪽이 같이 쓸 가로 경계(엑셀 한 시트에 쪽들을 이어 붙일 때) */
export function 공통가로(쪽들, 허용 = 0.6) {
  const 안 = 쪽들[0].안
  const v = [...new Set(쪽들.flatMap((쪽) => 쪽.칸들.filter((k) => k.w > 0.3).flatMap((k) => [k.x, k.x + k.w]))
    .map((x) => Math.round(x * 100) / 100))].filter((x) => x > 안.x + 허용 && x < 안.x + 안.w - 허용).sort((a, b) => a - b)
  const out = [안.x]
  for (const x of v) if (x - out[out.length - 1] > 허용) out.push(x)
  if (안.x + 안.w - out[out.length - 1] > 허용) out.push(안.x + 안.w)
  else out[out.length - 1] = 안.x + 안.w
  return out
}

/** 이 칸 크기 안에 그림을 비율대로 — { w, h } mm */
export function 그림맞춤(그림w, 그림h, 칸w, 칸h, 여백 = 1.2) {
  const W = Math.max(1, 칸w - 여백 * 2), H = Math.max(1, 칸h - 여백 * 2)
  const s = Math.min(W / 그림w, H / 그림h)
  return { w: 그림w * s, h: 그림h * s }
}

/** 파일 이름에 못 쓰는 글자 빼기 */
export function 파일이름(s) {
  return String(s || '').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60)
}

/** XML 글 싸기 */
export const 싸기 = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  // eslint-disable-next-line no-control-regex
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
