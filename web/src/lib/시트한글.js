/**
 * 📄 엑셀 서류 시트(변경엑셀쓰기 꼴) → 한글(.hwpx) (G296 · 2026-10-15)
 *
 * 소장님: 엑셀 추가기능의 «한글로 내보내기» 를 우리 방식으로 — 변경 · 기성 서류를 엑셀과 같은 내용으로 한글 문서에.
 * ■ 엑셀로 만드는 시트 그대로(제목 · 부제 · 머리 · 줄 · 병합 · 칸 너비 · 꼴)를 A4 쪽에 표로 앉힙니다.
 *   숫자는 꼴대로 글로(금 → 1,234 · 율 → 3.55% · 수 → 소수 자리) — 식 칸은 미리 셈한 값.
 *   한 시트 = 새 쪽부터 · 쪽이 넘으면 머리 줄을 다시 적고 이어 갑니다. 숨긴 칸은 뺍니다.
 * ■ 한글 파일 쓰기는 쪽한글.js(사진대지 · 영수증 정리와 같은 것) — 쪽 모형(lib/쪽문서.js)의 칸을 표로.
 * 시험: node tools/시험_시트한글.mjs
 */
import { 쪽들한글 } from './쪽한글.js'
import { 나누기 } from './쪽문서.js'

const 줄높이 = (pt) => pt * 0.3528 * 1.22

/** 엑셀 주소(A1 · AB12) → { r, c } (1부터) */
function 주소(t) {
  const m = /^([A-Z]+)(\d+)$/.exec(String(t).trim())
  if (!m) return null
  let c = 0
  for (const ch of m[1]) c = c * 26 + (ch.charCodeAt(0) - 64)
  return { r: Number(m[2]), c }
}

/** 칸 → { 글, 정렬, 굵게, 색, 바탕, 테 } */
export function 칸모양(칸) {
  if (칸 === null || 칸 === undefined || 칸 === '') return { 글: '', 테: 0 }
  const o = typeof 칸 === 'object' ? 칸 : { v: 칸 }
  const s = String(o.s || '').replace(/_(위|아래)$/, '')
  const v = o.v
  let 글 = ''
  let 숫자 = false
  if (typeof v === 'number' && Number.isFinite(v)) {
    숫자 = true
    const m = /^(금|수|율)(\d?)/.exec(s)
    if (m && m[1] === '율') { const n = m[2] === '' ? 2 : Number(m[2]); 글 = (v * 100).toFixed(n) + '%' } else if (m && m[1] === '수') {
      const n = m[2] === '' ? 0 : Number(m[2])
      글 = v.toLocaleString('ko-KR', { minimumFractionDigits: 0, maximumFractionDigits: n })
    } else 글 = Math.round(v).toLocaleString('ko-KR')
  } else 글 = v === null || v === undefined ? '' : String(v)
  const 머리 = s === '머리'
  const 공종 = /^공종/.test(s)
  return {
    글,
    정렬: 머리 || /가/.test(s.replace(/^공종/, '')) || s === '제목' ? '가' : 숫자 ? '오' : '왼',
    굵게: 머리 || 공종 || /굵/.test(s),
    색: /빨/.test(s) ? '#C00000' : /파/.test(s) ? '#1F4E9E' : /흐림|작은글/.test(s) ? '#666666' : '',
    바탕: 머리 ? '#DDE4EE' : 공종 ? '#F2F2F2' : /확인/.test(s) ? '#FFF2CC' : '',
    테: s && s !== '민' && s !== '작은글' && s !== '제목' ? 1 : (글 ? 1 : 0),
  }
}

/**
 * 시트 하나 → 쪽들
 * @param 용지 { 폭, 높이 } mm
 */
export function 시트쪽들(t, 용지 = { 폭: 297, 높이: 210 }, { 크기 = 8.5 } = {}) {
  const 안 = { x: 12, y: 12, w: 용지.폭 - 24, h: 용지.높이 - 24 }
  const 숨김 = new Set(t.숨김열 || [])
  const 머리 = t.머리 || []
  const 폭수 = Math.max((t.너비 || []).length, ...머리.map((h) => h.length), ...(t.줄 || []).map((r) => (r ? r.length : 0)), 1)
  const 보일 = Array.from({ length: 폭수 }, (_, i) => i).filter((i) => !숨김.has(i + 1))
  const 너비합 = 보일.reduce((a, i) => a + ((t.너비 || [])[i] || 10), 0)
  const 폭 = 보일.map((i) => (((t.너비 || [])[i] || 10) / 너비합) * 안.w)
  const 열x = [안.x]
  for (const w of 폭) 열x.push(열x[열x.length - 1] + w)
  const 보는칸 = new Map(보일.map((i, k) => [i + 1, k]))          /* 엑셀 칸(1부터) → 보이는 차례 */
  /* 엑셀 줄 차례 — 제목(1) · 부제(2) · 머리 · 줄 (변경엑셀쓰기와 같게) */
  const 첫머리 = t.제목 ? 3 : 1
  const 첫줄 = 첫머리 + 머리.length
  /* 병합 → 줄마다 { 시작칸: 끝칸 } · 줄 사이 병합(머리 두 줄)은 rs */
  const 병합 = []
  for (const m of t.병합 || []) {
    const [a, b] = String(m).split(':').map(주소)
    if (!a || !b) continue
    병합.push({ r0: a.r, c0: a.c, r1: b.r, c1: b.c })
  }
  const 병합찾기 = (r, c) => 병합.find((m) => r >= m.r0 && r <= m.r1 && c >= m.c0 && c <= m.c1)
  /* 한 엑셀 줄 → 칸 조각들 [{ k(보이는 시작), n(칸 수), rs, 모양 }] */
  const 줄조각 = (R, 칸들, 머리줄 = false) => {
    const out = []
    for (const i of 보일) {
      const c = i + 1
      const m = 병합찾기(R, c)
      if (m && (m.c0 !== c || m.r0 !== R)) {
        /* 병합의 첫 칸이 숨김이면 첫 보이는 칸이 대신 */
        const 첫보임 = 보일.find((j) => j + 1 >= m.c0 && j + 1 <= m.c1)
        if (!(m.r0 === R && 첫보임 === i)) continue
      }
      const 끝 = m ? 보일.filter((j) => j + 1 >= c && j + 1 <= m.c1).length : 1
      const 원칸 = (칸들 || [])[m && m.r0 === R ? m.c0 - 1 : i]
      const 모 = 칸모양(머리줄 ? (원칸 === null || 원칸 === undefined ? { v: '', s: '머리' } : { v: 원칸, s: '머리' }) : 원칸)
      out.push({ k: 보는칸.get(c), n: Math.max(1, 끝), rs: m ? m.r1 - m.r0 + 1 : 1, 모 })
    }
    /* 첫 칸에만 글이 있고 나머지가 빈(테두리도 없는) 줄 — 엑셀처럼 옆 칸으로 넘쳐 보이게 한 줄 전체로(맨 아래 한 줄 · 알림 글) */
    if (out.length > 1 && out[0].k === 0 && out[0].모.글 && out.slice(1).every((조) => !조.모.글 && !조.모.테)) return [{ ...out[0], n: 보일.length, 모: { ...out[0].모, 테: 0 } }]
    return out
  }
  /* 줄 높이 — 칸 글을 칸 폭에 나눠 본 줄 수로 */
  const 칸폭 = (조) => 열x[조.k + 조.n] - 열x[조.k]
  const 높이 = (조각들, pt) => {
    let 줄수 = 1
    for (const 조 of 조각들) if (조.모.글 && 조.rs === 1) 줄수 = Math.max(줄수, 나누기(조.모.글, Math.max(1, 칸폭(조) - 1.6), pt, 조.모.굵게).length)
    return Math.min(60, Math.max(6.2, 줄수 * 줄높이(pt) + 1.8))
  }
  const 머리조각 = 머리.map((h, j) => 줄조각(첫머리 + j, h, true))
  const 머리높이 = 머리조각.map((조) => 높이(조, 크기))
  const 본조각 = (t.줄 || []).map((row, j) => 줄조각(첫줄 + j, row))
  const 쪽들 = []
  let 쪽 = null, y = 0
  const 새쪽 = (첫) => {
    쪽 = { 폭: 용지.폭, 높이: 용지.높이, 안, 칸들: [] }
    쪽들.push(쪽)
    y = 안.y
    if (첫 && t.제목) {
      쪽.칸들.push({ x: 안.x, y, w: 안.w, h: 11, 글: t.제목, 크기: 15, 굵게: true, 정렬: '가', 테: 0 })
      y += 11
      if (t.부제) {
        const n = 나누기(t.부제, 안.w - 1.6, 7.5).length
        const h = Math.max(5.5, n * 줄높이(7.5) + 1.4)
        쪽.칸들.push({ x: 안.x, y, w: 안.w, h, 글: t.부제, 크기: 7.5, 정렬: '왼', 색: '#555555', 테: 0 })
        y += h
      }
      y += 1.5
    } else if (!첫 && t.제목) {
      쪽.칸들.push({ x: 안.x, y, w: 안.w, h: 6, 글: t.제목.replace(/\s+/g, ' ') + ' (이어서)', 크기: 8, 정렬: '왼', 색: '#555555', 테: 0 })
      y += 7
    }
    /* 머리 줄 — 쪽마다 */
    머리조각.forEach((조들, j) => {
      for (const 조 of 조들) {
        const h = 머리높이.slice(j, j + 조.rs).reduce((a, b) => a + b, 0)
        쪽.칸들.push({ x: 열x[조.k], y, w: 칸폭(조), h, 글: 조.모.글, 크기, 굵게: true, 정렬: '가', 바탕: '#DDE4EE', 테: 1 })
      }
      y += 머리높이[j]
    })
  }
  새쪽(true)
  본조각.forEach((조들) => {
    const h = 높이(조들, 크기)
    if (y + h > 안.y + 안.h + 0.01) 새쪽(false)
    for (const 조 of 조들) {
      const 모 = 조.모
      if (!모.글 && !모.테) continue
      쪽.칸들.push({ x: 열x[조.k], y, w: 칸폭(조), h: h * 조.rs, 글: 모.글, 크기, 굵게: 모.굵게, 정렬: 모.정렬, 색: 모.색 || undefined, 바탕: 모.바탕 || undefined, 테: 모.테 })
    }
    y += h
  })
  return 쪽들
}

/** 시트 용지 — 엑셀 인쇄 방향 그대로(세로: true → A4 세로 · 아니면 A4 가로) */
export const 시트용지 = (t) => (t.세로 ? { 폭: 210, 높이: 297 } : { 폭: 297, 높이: 210 })

/**
 * 시트들 → .hwpx 바이트 · 시트마다 새 쪽 · 용지는 시트마다(세로 · 가로가 바뀌면 한글 구역을 나눔)
 */
export function 시트들한글(시트들, { 제목 = '' } = {}) {
  const 쪽들 = 시트들.flatMap((t) => 시트쪽들(t, 시트용지(t)))
  return 쪽들한글(쪽들, new Map(), { 제목 })
}
