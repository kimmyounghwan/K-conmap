/**
 * 📑 판 펼치기 — 캐드 한 파일을 «인쇄되는 판(쪽)» 마다 나눠, 판마다 도면번호 · 도면명 · 종류 · 글자 · 선 수를 (🧭 G245 — 2026-10-11)
 *
 * 소장님: 「캐드를 완벽하게 읽는 도구를 먼저 개발해. 그게 먼저야」 · 「판 그대로 읽기부터」
 *   사람은 도면을 판(쪽) 단위로 읽음 — 판 번호(S-201) · 도면명(지하1층 구조평면도)으로 무엇인지 알고 그 판 안만 봄.
 *   현장 A 구조도서 PDF(81쪽)와 판마다 견주니 판 80장이 모두 짝지어졌고 글자 99.4 % · 선 98~100 % 가 같았음(나머지는 글 나눔 차이 ·
 *   빗금 무늬 · 로고 그림 · 같이 안 준 xref) — tools 판 대조(내부).
 *
 * ■ 판 = 모형 공간의 도곽(골조자동 준비()가 찾은 판 — lib/도곽3d.js 와 같은 방법 · 종이에 찍히는 선 · 글로). 배치(종이) 공간 판은 아직(점검 표가 알림).
 * ■ 점이 아주 많은 도면(600만 점 넘음)도 뒤쪽 판까지 — 골조 읽개가 글자 · 판 테두리(틀선)를 끝까지 읽음(🧭 G246).
 * ■ 판 번호 = 판 안 글자 중 «S-201 · A-101 · C-J-00043 · S01-001» 꼴 — 표제란 «SHEET NO · DWG NO · 도면번호» 곁 · 없으면 판 오른쪽 아래에 가장 가까운 것.
 */

import { 도곽찾기3d, 박스제목들 } from './도곽3d.js'

/** 도면번호 꼴 — 영문 1~3 (+숫자 0~2) · 붙임표 · 숫자 2~5 (· 붙임표 숫자) */
const 번호꼴 = /^[A-Z]{1,3}\d{0,2}(?:-[A-Z])?[-_]?\d{2,5}(?:-\d{1,3})?$/
const 번호머리 = /SHEET\s*N|DWG\.?\s*N|DRAWING\s*N|도면\s*번호|도\s*번|도면NO/i

const 붙 = (s) => String(s || '').replace(/\s+/g, '').toUpperCase()

/**
 * 판 하나의 번호
 * @param 글들 [{s, x, y, h}] — 그 판 안 글자(가운데 · mm)
 * @param r [x0, y0, x1, y1] — 판 테두리
 * @returns {string} 없으면 ''
 */
export function 판번호(글들, r) {
  const 후보 = 글들.filter((g) => 번호꼴.test(붙(g.s)) && /\d/.test(g.s) && !/^\d+$/.test(붙(g.s)))
  if (!후보.length) return ''
  const 머리 = 글들.filter((g) => 번호머리.test(g.s))
  const [x0, y0, x1, y1] = r
  const 최대h = Math.max(1, ...후보.map((q) => q.h || 0))
  const 점수 = (g) => {
    let d = Infinity
    for (const m of 머리) d = Math.min(d, Math.hypot(g.x - m.x, g.y - m.y) / Math.max(m.h, g.h, 1))
    const 구석 = Math.hypot(x1 - g.x, g.y - y0) / Math.max(1, Math.hypot(x1 - x0, y1 - y0))      // 오른쪽 아래(표제란)에 가까울수록 작음
    return (Number.isFinite(d) ? Math.min(d, 60) : 60) + 40 * 구석 - Math.min(5, ((g.h || 0) / 최대h) * 5)
  }
  let 좋은 = null, 좋은점 = Infinity
  for (const g of 후보) { const v = 점수(g); if (v < 좋은점) { 좋은점 = v; 좋은 = g } }
  return 붙(좋은.s)
}

/**
 * 준비된 도면(골조자동 준비 결과 — 도곽 · 도곽번 · 판제목 · 글자) → 판 목록
 * @returns [{p, 번호, 이름, r:[x0,y0,x1,y1](mm), 글수}]
 */
export function 판목록(D) {
  const 도 = (D && D.도곽) || []
  if (!도.length) return []
  const 판글 = 도.map(() => []), 찍힘 = 도.map(() => [])
  /* 🧭 G246 판 번호는 종이에 찍히는 글에서(인쇄 안 하는 층 글은 뺌) · 글 수는 읽은 글 모두 */
  const 층 = (D.모델 && D.모델.layers) || []
  for (const g of (D.글자 || []).concat(D.뒤글자 || [])) { const p = D.도곽번(g.x, g.y); if (p < 0) continue; 판글[p].push(g); if (!(층[g.ly] && 층[g.ly].인쇄안함)) 찍힘[p].push(g) }
  return 도.map((r, p) => ({ p, 번호: 판번호(찍힘[p], r), 이름: ((D.판제목 || [])[p] || '').trim(), r: r.map((v) => Math.round(v)), 글수: 판글[p].length }))
}

/**
 * 🧭 G246 배치(종이) 공간 판 — 배치 탭마다(골조도면 도면읽기 모델.배치) 판 테두리를 찾아 판마다 번호 · 이름 · 보는 모형 자리.
 *   테두리가 없으면 배치 한 장 = 판 한 장(글 · 선이 든 범위).
 * @returns [{배치, 번호, 이름, r:[x0,y0,x1,y1](종이), 글수, 화면수, 보는곳:[[x0,y0,x1,y1]…](모형 · 가운데 뺀 좌표)}]
 */
export function 배치판목록(M) {
  const out = []
  for (const b of (M && M.배치) || []) {
    const 글들 = (b.글 || []).filter((g) => String(g.s || '').trim())
    let 판 = []
    try { 판 = 도곽찾기3d({ out: new Map([['_', { pos: { a: b.선, n: b.선.length } }]]), texts: 글들, stats: {} }, null) } catch (e) { 판 = [] }
    if (!판.length) {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
      for (let i = 0; i < b.선.length; i += 3) { const x = b.선[i], y = b.선[i + 1]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
      for (const g of 글들) { if (g.x < x0) x0 = g.x; if (g.x > x1) x1 = g.x; if (g.y < y0) y0 = g.y; if (g.y > y1) y1 = g.y }
      for (const v of b.화면 || []) { x0 = Math.min(x0, v.x - v.w / 2); x1 = Math.max(x1, v.x + v.w / 2); y0 = Math.min(y0, v.y - v.h / 2); y1 = Math.max(y1, v.y + v.h / 2) }
      if (!(x1 > x0 && y1 > y0)) continue
      판 = [{ x0, y0, x1, y1 }]
    }
    let 이름들 = []
    try { 이름들 = 박스제목들(글들, 판) } catch (e) { 이름들 = 판.map(() => '') }
    판.forEach((f, i) => {
      const r = [f.x0, f.y0, f.x1, f.y1]
      const 안 = 글들.filter((g) => g.x >= f.x0 && g.x <= f.x1 && g.y >= f.y0 && g.y <= f.y1)
      const 화 = (b.화면 || []).filter((v) => v.x >= f.x0 && v.x <= f.x1 && v.y >= f.y0 && v.y <= f.y1)
      out.push({ 배치: b.이름, 번호: 판번호(안, r), 이름: String(이름들[i] || '').trim(), r: r.map((v) => Math.round(v * 10) / 10), 글수: 안.length, 화면수: 화.length, 보는곳: 화.map((v) => [v.mx - v.mw / 2, v.my - v.mh / 2, v.mx + v.mw / 2, v.my + v.mh / 2].map(Math.round)) })
    })
  }
  return out
}

