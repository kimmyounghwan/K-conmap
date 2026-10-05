/**
 * 📡 좌표측량성과표 읽기 — 엑셀(.xlsx · .xls) · CSV · TXT (2026-10-05)
 *
 * 소장님: 「좌표측량성과표하고, 평면도는 항상 필요하다는 걸 알려야 하지 않을까?」
 *         「평면도에도 좌표가 안입혀져 있어. 대부분 그래, 그래서 좌표가 있는 측량도면을 측량성과표 도면을 꼭 넣어달라고 해야 하지 않아.」
 *
 * ■ 점 이름 · X · Y · Z(표고) 칸을 «머리 글자» 로 찾고, 머리가 없으면 숫자 칸 모양으로 찾습니다.
 * ■ ⚠️ 측량 성과표의 X 는 «북쪽(위)», Y 는 «동쪽(오른쪽)» 입니다 — 캐드의 x·y 와 반대입니다.
 *   머리에 N·E(북·동)가 적혀 있으면 그대로, X·Y 만 적혀 있으면 측량 관례(X=북)로 읽습니다.
 *   어느 쪽이 맞는지는 도면 글자와 맞춰 보고 정합니다(dxf3d.worker.js) — 그래서 «바꿔 읽을 수 있음» 을 같이 돌려줍니다.
 * ■ 파일은 이 브라우저 안에서만 읽습니다.
 */

const 수 = (v) => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : NaN
  const s = String(v ?? '').trim().replace(/,/g, '')
  return /^[-+]?\d+(\.\d+)?$/.test(s) ? parseFloat(s) : NaN
}
const 글 = (v) => String(v ?? '').normalize('NFKC').trim()

/** 글(CSV·TXT) → 줄마다 칸 */
export function 글표(text) {
  const 줄들 = String(text || '').replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim())
  const 표본 = 줄들.slice(0, 40).join('\n')
  const 나눔 = /\t/.test(표본) ? /\t/ : /,/.test(표본) ? /,/ : /;/.test(표본) ? /;/ : /\s+/
  return 줄들.map((l) => l.split(나눔).map((c) => c.trim().replace(/^"(.*)"$/, '$1')))
}

const 머리꼴 = {
  이름: /^(점\s*명|점\s*번\s*호?|측\s*점|번\s*호|NO\.?|POINT|PT\.?|PNO|NAME|ID|기준점|도근점|점의\s*명칭|명\s*칭)$/i,
  N: /^(N|NORTH(ING)?|북|북\s*좌표|X\s*\(\s*N\s*\)|N\s*\(\s*X\s*\))$/i,
  E: /^(E|EAST(ING)?|동|동\s*좌표|Y\s*\(\s*E\s*\)|E\s*\(\s*Y\s*\))$/i,
  X: /^(X|X\s*좌표|좌표\s*X|X\s*\(\s*M\s*\))$/i,
  Y: /^(Y|Y\s*좌표|좌표\s*Y|Y\s*\(\s*M\s*\))$/i,
  Z: /^(Z|H|EL\.?|ELEV(ATION)?|표\s*고|높\s*이|지\s*반\s*고|표고\s*\(\s*M\s*\)|H\s*\(\s*M\s*\)|Z\s*\(\s*M\s*\))$/i,
}

/**
 * 표(행 → 칸) → { 점: [{이름, N, E, Z}], 머리줄, 칸: {이름,N,E,Z}, 북동확실: bool, 빠진줄 }
 * N = 북쪽(캐드 y), E = 동쪽(캐드 x) — m
 */
export function 성과표풀기(행들) {
  const rows = (행들 || []).filter((r) => Array.isArray(r) && r.some((c) => 글(c)))
  if (!rows.length) return null
  /* ① 머리 줄 찾기 — 앞 20줄에서 머리 글자가 둘 넘게 든 줄 */
  let 머리줄 = -1, 칸 = null, 북동확실 = false
  for (let i = 0; i < Math.min(20, rows.length); i++) {
    const c = {}
    rows[i].forEach((v, j) => {
      const s = 글(v).replace(/\s+/g, ' ')
      for (const [k, re] of Object.entries(머리꼴)) if (c[k] == null && re.test(s)) c[k] = j
    })
    const 좌표 = (c.N != null && c.E != null) || (c.X != null && c.Y != null)
    if (좌표) {
      머리줄 = i
      if (c.N != null && c.E != null) { 칸 = { 이름: c.이름, N: c.N, E: c.E, Z: c.Z }; 북동확실 = true }
      else 칸 = { 이름: c.이름, N: c.X, E: c.Y, Z: c.Z }        // 측량 관례: X = 북, Y = 동
      break
    }
  }
  /* ② 머리가 없으면 — 숫자 칸 모양: 큰 수(1000 넘음) 두 칸이 X·Y, 그 오른쪽 작은 수 칸이 Z */
  if (!칸) {
    const 열수 = Math.max(...rows.map((r) => r.length))
    const 통 = []
    for (let j = 0; j < 열수; j++) {
      let n = 0, 큰 = 0, 작 = 0, 모두 = 0
      for (const r of rows.slice(0, 300)) {
        if (!글(r[j])) continue
        모두++
        const v = 수(r[j])
        if (!Number.isFinite(v)) continue
        n++
        if (Math.abs(v) >= 1000) 큰++; else 작++
      }
      통.push({ j, 수비: 모두 ? n / 모두 : 0, 큰, 작, 모두 })
    }
    const 큰칸 = 통.filter((c) => c.수비 > 0.8 && c.큰 > c.작)
    if (큰칸.length < 2) return null
    const [cx, cy] = 큰칸
    const cz = 통.find((c) => c.j > cy.j && c.수비 > 0.8 && c.작 >= c.큰)
    const 이름칸 = 통.find((c) => c.j < cx.j && c.모두 > 0)
    칸 = { 이름: 이름칸 ? 이름칸.j : null, N: cx.j, E: cy.j, Z: cz ? cz.j : null }
  }
  /* ③ 점 읽기 */
  const 점 = []
  let 빠진줄 = 0
  for (let i = 머리줄 + 1; i < rows.length; i++) {
    const r = rows[i]
    const N = 수(r[칸.N]), E = 수(r[칸.E])
    if (!Number.isFinite(N) || !Number.isFinite(E)) { if (r.some((c) => Number.isFinite(수(c)))) 빠진줄++; continue }
    const Z = 칸.Z != null ? 수(r[칸.Z]) : NaN
    const 이름 = 칸.이름 != null ? 글(r[칸.이름]) : String(점.length + 1)
    점.push({ 이름: 이름 || String(점.length + 1), N, E, Z: Number.isFinite(Z) ? Z : null })
  }
  if (점.length < 2) return null
  return { 점, 머리줄, 칸, 북동확실, 빠진줄 }
}

/** 파일 바이트 → 표(행 → 칸). 엑셀 읽기는 다른 도구가 쓰는 것을 그대로 씁니다. */
export async function 파일표(이름, bytes) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  const 끝 = String(이름 || '').toLowerCase()
  if (u8[0] === 0x50 && u8[1] === 0x4b) {                 // xlsx (zip)
    const { 엑셀읽기 } = await import('./엑셀읽기.js')
    const 책 = 엑셀읽기(u8)
    const 표들 = []
    for (const 시 of 책.시트들) {
      const rows = []
      for (const c of 시.칸.values()) {
        if (c.v == null || c.v === '') continue
        while (rows.length < c.행) rows.push([])
        const row = rows[c.행 - 1]
        while (row.length < c.열 - 1) row.push(null)
        row[c.열 - 1] = c.v
      }
      표들.push(rows)
    }
    return 표들
  }
  if (u8[0] === 0xD0 && u8[1] === 0xCF) {                 // xls (옛 엑셀)
    const { xls읽기 } = await import('./xls읽기.js')
    return Object.values(xls읽기(u8))
  }
  /* 글 — UTF-8 이 깨지면(한글 CSV 는 대개 EUC-KR) 다시 */
  let t = new TextDecoder('utf-8').decode(u8)
  if (t.includes('�')) { try { t = new TextDecoder('euc-kr').decode(u8) } catch (e) { /* 그대로 */ } }
  if (/\.(dxf|dwg)$/.test(끝)) return []
  return [글표(t)]
}

/** 파일 → 성과표 (시트 여럿이면 점이 가장 많은 것) | null */
export async function 성과표읽기(이름, bytes) {
  const 표들 = await 파일표(이름, bytes)
  let best = null
  for (const 표 of 표들) {
    const r = 성과표풀기(표)
    if (r && (!best || r.점.length > best.점.length)) best = r
  }
  return best
}
