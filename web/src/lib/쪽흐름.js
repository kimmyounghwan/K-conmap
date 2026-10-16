/**
 * 📄 쪽 흐름 — 글 · 표 · 흐름도 · 그림 자리 «덩이» 를 A4 쪽들로 흘려 앉힙니다 (G300 · 2026-10-16)
 *
 * 소장님: 「견본있으니까 거기에 맞춰 서류가 자동으로 만들어 져야 해 … 무료이면서, 최대한 깔끔하게」
 *   → 시공계획서처럼 «글이 길게 이어지는 서류» 를 사진대지 · 영수증과 같은 쪽 모형(lib/쪽문서.js 의 mm 칸)으로 만듭니다.
 *     그래서 화면 미리보기 · PDF · 한글 · 엑셀 · 워드가 같은 모양으로 나옵니다.
 *
 * ■ 구역 = { 용지: '세로' | '가로', 덩이들: [...] } — 구역마다 새 쪽에서 시작, 쪽 번호는 이어 갑니다(번호없음: 표지 · 목차).
 * ■ 덩이
 *     { 종류: '장', 글 }                      큰 제목(「1. 공 사 개 요」) — 앞 덩이가 있으면 새 쪽
 *     { 종류: '절', 글 }                      「제1장 표토제거」 · 「가. 공사개요」
 *     { 종류: '항', 글 }                      「1. 흙깎기 재료의 유용」  · { 종류: '소항', 글 } 한 단 더 아래 제목
 *     { 종류: '조직', 줄들: [[글…], [글…], [글…]] }  조직도 — 줄마다 상자들을 가운데 맞춤, 위 줄과 선으로 잇기
 *     { 종류: '글', 글, 들 }                  본문 한 항목 — 맨 앞 머리표(1) · ― · ① …)만큼 둘째 줄부터 들여 씀, 들 = 들여쓰기 단(0~)
 *     { 종류: '표', 열, 머리, 줄, 크기 }       표 — 칸: 글 | { 글, cs, rs, 정렬, 바탕, 굵게, 색, 크기 } · 쪽이 넘으면 머리를 다시 적음
 *     { 종류: '흐름', 상자: [{ 글, 옆: [글…] }] }  세로 흐름도(상자 → 화살표 → 상자 …) · 상자 오른쪽에 메모
 *     { 종류: '그림', 높이, 그림, 설명 }        그림 자리(올린 도면 · 사진) — 없으면 빈 테두리와 안내 글
 *     { 종류: '빈', 높이 }  · { 종류: '쪽' }(새 쪽) · { 종류: '통쪽', 만들기: (자리) => ({ 칸들, 선들, 원들 }) }
 * ■ 쪽 = { 폭, 높이, 안, 칸들: [rect], 선들: [{ 점들: [[x,y]…], 굵기(pt), 색, 점선 }], 원들: [{ x, y, r, 색, 바탕 }] }
 *   선들 · 원들은 PDF · 화면만 그립니다(엑셀 · 한글 · 워드는 칸만).
 * 시험: node tools/시험_시공계획.mjs
 */
import { 나누기, 글폭 } from './쪽문서.js'

export const 용지크기 = { 세로: { 폭: 210, 높이: 297 }, 가로: { 폭: 297, 높이: 210 } }
const 여백 = { 왼: 20, 오: 18, 위: 20, 아래: 20 }
const PT = 0.3528
/* 글 모양 */
const 꼴 = {
  장: { 크기: 14, 높: 10, 앞: 0, 뒤: 4 },
  절: { 크기: 11.5, 높: 8, 앞: 4, 뒤: 1.2 },
  항: { 크기: 10, 높: 6.6, 앞: 2.2, 뒤: 0.4 },
  소항: { 크기: 9.5, 높: 6, 앞: 1.6, 뒤: 0.2 },
  글: { 크기: 9.5, 높: 5.6, 앞: 0.7, 뒤: 0 },
}
const 들폭 = 5          // 들여쓰기 한 단(mm)
const 글시작 = 5        // 절 · 항 아래 본문은 이만큼 들어가서

/* 머리표 — 「1)」 「(1)」 「①」 「―」 「가.」 「1.1.」 「※」 … */
const 머리표 = /^(제\s*\d+\s*장|\d+(?:\s*[-.]\s*\d+)*\s*[.)]|\(\d+\)|[①-⑳]|[㉠-㉭]|[가-하]\s*[.)]|\([가-하]\)|[-―ㅡ•·※□■◈＊*▶○◎ㆍ])\s*/
export function 머리나누기(글) {
  const m = 머리표.exec(String(글 || ''))
  return m ? { 머리: m[0], 몸: String(글).slice(m[0].length) } : { 머리: '', 몸: String(글 || '') }
}

/** 칸 값 → { 글, cs, rs, … } */
function 칸풀기(c) {
  if (c === null || c === undefined) return { 글: '' }
  if (typeof c === 'object' && !Array.isArray(c)) return { ...c, 글: c.글 === null || c.글 === undefined ? '' : String(c.글) }
  return { 글: String(c) }
}

/**
 * @param 구역들 [{ 용지, 덩이들, 번호없음 }]
 * @param 설정 { 쪽번호: true, 머리글: '' (쪽 위 오른쪽 작은 글 — 공사명) }
 * @returns 쪽들
 */
export function 흘리기(구역들, 설정 = {}) {
  const 쪽들 = []
  let 번호 = 0
  for (const 구역 of 구역들) {
    const 용 = 용지크기[구역.용지 || '세로']
    const 안 = { x: 여백.왼, y: 여백.위, w: 용.폭 - 여백.왼 - 여백.오, h: 용.높이 - 여백.위 - 여백.아래 }
    const 바닥 = 안.y + 안.h
    let 쪽 = null
    let y = 0
    const 새쪽 = () => {
      쪽 = { 폭: 용.폭, 높이: 용.높이, 안: { ...안 }, 칸들: [], 선들: [], 원들: [], 번호: 구역.번호없음 ? 0 : ++번호 }
      쪽들.push(쪽)
      y = 안.y
    }
    const 남음 = () => 바닥 - y
    const 넣기 = (k) => { 쪽.칸들.push(k) }
    새쪽()
    let 첫 = true
    const 덩들 = (구역.덩이들 || []).filter(Boolean)
    /* 덩이 j 를 «쓸모 있게» 시작하는 데 드는 높이 — 제목이 쪽 끝에 홀로 남지 않게 미리 봄 */
    const 첫높 = (j, 깊 = 0) => {
      const e = 덩들[j]
      if (!e || 깊 > 3) return 0
      if (e.종류 === '절' || e.종류 === '항' || e.종류 === '소항') {
        const f = 꼴[e.종류]
        return f.앞 + f.높 * 나누기(e.글, 안.w - (e.들 || 0) * 들폭 - 1.6, f.크기, true).length + f.뒤 + 첫높(j + 1, 깊 + 1)
      }
      if (e.종류 === '글') {
        const f = 꼴.글
        const 폭 = 안.w - 글시작 - (e.들 || 0) * 들폭 - 1.6
        const n = 나누기(e.글, 폭, e.크기 || f.크기, !!e.굵게).length
        const 자기 = f.앞 + (e.줄높 || f.높) * Math.min(2, n)
        /* 한 줄짜리 「(1) 터파기 및 되메우기」 처럼 아래에 더 들여 쓴 글이 딸린 줄은 제목처럼 — 딸린 글 첫 줄까지 */
        return n === 1 && 딸림(j) ? 자기 + 첫높(j + 1, 깊 + 1) : 자기
      }
      if (e.종류 === '표') { const t = 표준비(e); return t.작음 ? t.온높 : (e.제목 ? 8.5 : 1.5) + t.머리높 + t.첫묶음 }
      if (e.종류 === '흐름') { const h = 흐름높이(e); return h <= 안.h - 4 ? h + 4 : 13 }
      if (e.종류 === '그림') return Math.min(e.높이 || 80, 안.h - 2) + 3 + (e.제목 ? 7 : 0)
      if (e.종류 === '조직') { const n = (e.줄들 || []).filter((r) => r && r.length).length; return n * 13 + (n - 1) * 9 + 6 }
      if (e.종류 === '빈') return e.높이 || 4
      return 0
    }
    function 딸림(j) { const e = 덩들[j], n = 덩들[j + 1]; return !!(e && n && e.종류 === '글' && n.종류 === '글' && (n.들 || 0) > (e.들 || 0)) }
    for (let di = 0; di < 덩들.length; di++) {
      const d = 덩들[di]
      const 종류 = d.종류
      if (종류 === '쪽') { if (!첫) 새쪽(); 첫 = true; continue }
      if (종류 === '장') {
        if (!첫 && y > 안.y + 1) 새쪽()
        const f = 꼴.장
        넣기({ x: 안.x, y, w: 안.w, h: f.높, 글: d.글, 크기: d.크기 || f.크기, 굵게: 1, 정렬: d.정렬 || '왼', 테: 0 })
        y += f.높 + f.뒤
        첫 = false
        continue
      }
      if (종류 === '절' || 종류 === '항' || 종류 === '소항') {
        const f = 꼴[종류]
        const 들 = (d.들 || 0) * 들폭
        const 줄들 = 나누기(d.글, 안.w - 들 - 1.6, f.크기, true)
        /* 제목만 쪽 끝에 홀로 남지 않게 — 아래 덩이(글 두 줄 · 표 머리와 첫 줄 · 흐름도 · 그림 …)가 같이 들어갈 자리가 없으면 새 쪽.
           (아래 덩이가 한 쪽보다 크면 예전처럼 글 두 줄 자리만 봄) */
        const 제높 = f.앞 + f.높 * 줄들.length + f.뒤
        let 같이 = 첫높(di + 1)
        if (제높 + 같이 > 안.h * 0.8) 같이 = 꼴.글.높 * 2
        if (y > 안.y + 1 && 남음() < 제높 + 같이) 새쪽()
        else if (y > 안.y + 1) y += f.앞
        for (const 줄 of 줄들) {
          넣기({ x: 안.x + 들, y, w: 안.w - 들, h: f.높, 글: 줄, 크기: f.크기, 굵게: 1, 정렬: '왼', 테: 0, 색: d.색 })
          y += f.높
        }
        y += f.뒤
        첫 = false
        continue
      }
      if (종류 === '글') {
        const f = 꼴.글
        const 크기 = d.크기 || f.크기
        const 줄높 = d.줄높 || f.높
        const x0 = 안.x + 글시작 + (d.들 || 0) * 들폭
        const 폭 = 안.x + 안.w - x0
        const { 머리, 몸 } = 머리나누기(d.글)
        const 걸침 = 머리 ? Math.min(14, 글폭(머리, 크기, !!d.굵게)) : 0
        /* 첫 줄은 머리표부터, 둘째 줄부터는 머리표 폭만큼 들여 */
        const 첫줄들 = 나누기(머리 + 몸, 폭 - 1.6, 크기, !!d.굵게)
        let 줄들 = [첫줄들[0]]
        if (첫줄들.length > 1) {
          const 나머지 = (머리 + 몸).slice(첫줄들[0].length).trimStart()
          줄들 = 줄들.concat(나누기(나머지, 폭 - 걸침 - 1.6, 크기, !!d.굵게))
        }
        /* 아래 글이 딸린 한 줄(소제목 같은 줄)이 쪽 끝에 홀로 남지 않게 */
        if (y > 안.y + 1 && 줄들.length === 1 && 딸림(di)) {
          const 같이 = 첫높(di + 1)
          if (f.앞 + 줄높 + 같이 <= 안.h * 0.8 && 남음() < f.앞 + 줄높 + 같이) 새쪽()
        }
        if (y > 안.y + 1) y += f.앞
        const 끝덩이 = di === 덩들.length - 1
        줄들.forEach((줄, i) => {
          /* 구역 맨 끝 마지막 한 줄이 조금 넘칠 때는 아래 여백(쪽 번호 위)까지 써서 거의 빈 쪽을 만들지 않음 */
          const 끝한줄 = 끝덩이 && i === 줄들.length - 1 && 줄들.length <= 2 && 남음() > 줄높 - 6
          if (남음() < 줄높 && !끝한줄) 새쪽()
          const x = i === 0 ? x0 : x0 + 걸침
          넣기({ x, y, w: 안.x + 안.w - x, h: 줄높, 글: 줄, 크기, 굵게: d.굵게 ? 1 : 0, 정렬: d.정렬 || '왼', 테: 0, 색: d.색 })
          y += 줄높
        })
        첫 = false
        continue
      }
      if (종류 === '빈') { y += d.높이 || 4; if (y > 바닥) 새쪽(); continue }
      if (종류 === '표') { 표놓기(d); 첫 = false; continue }
      if (종류 === '흐름') { 흐름놓기(d); 첫 = false; continue }
      if (종류 === '조직') { 조직놓기(d); 첫 = false; continue }
      if (종류 === '그림') {
        const h = Math.min(d.높이 || 80, 안.h - 2)
        if (남음() < h + 2) 새쪽()
        else if (y > 안.y + 1) y += 2
        const 있음 = !!d.그림
        넣기({ x: 안.x + (d.들 || 0), y, w: 안.w - (d.들 || 0), h, 그림: d.그림 || undefined, 자리: d.자리 || undefined, 테: 1, 선색: '#9aa3ae',
          글: 있음 ? '' : (d.설명 || '(도면 · 사진을 올리면 이 자리에 들어갑니다)'), 크기: 9, 색: '#8a929c' })
        y += h + 1
        if (d.제목) { 넣기({ x: 안.x, y, w: 안.w, h: 6, 글: d.제목, 크기: 9, 정렬: '가', 테: 0 }); y += 7 }
        첫 = false
        continue
      }
      if (종류 === '통쪽') {
        if (!첫 || y > 안.y + 1) 새쪽()
        const r = d.만들기({ 안, 폭: 용.폭, 높이: 용.높이 }) || {}
        for (const k of r.칸들 || []) 넣기(k)
        쪽.선들.push(...(r.선들 || []))
        쪽.원들.push(...(r.원들 || []))
        y = 바닥
        첫 = false
        continue
      }
    }

    /* ── 표 ─────────────────────────────────────── */
    /** 표 자리 셈(칸 · 줄 높이 · 묶음) — 놓기 전에 «머리 + 첫 묶음» 높이를 미리 보려고 따로 둠 */
    function 표준비(d) {
      if (d._준비 && d._준비.안w === 안.w) return d._준비
      const 크기 = d.크기 || 8.5
      const 최소 = d.최소높이 || 6.4
      const 들 = d.들 ? d.들 * 들폭 : 0
      const 폭 = 안.w - 들
      let 열 = (d.열 || []).map(Number)
      const 합 = 열.reduce((a, b) => a + b, 0)
      if (!(합 > 0)) return { 없음: true, 머리높: 0, 첫묶음: 0 }
      열 = 열.map((w) => (w * 폭) / 합)              // 비율 → 쪽 폭에 맞춤
      const x들 = [안.x + 들]
      for (const w of 열) x들.push(x들[x들.length - 1] + w)
      const 놓기 = (줄들) => {
        /* 칸 자리 — HTML 표처럼 위 줄의 rs 가 덮은 자리는 건너뜀 */
        const 덮 = new Set()
        const 칸들 = []
        줄들.forEach((줄, r) => {
          let c = 0
          for (const v of 줄) {
            while (덮.has(r + '|' + c)) c++
            const k = 칸풀기(v)
            const cs = Math.max(1, k.cs || 1), rs = Math.max(1, k.rs || 1)
            for (let i = 0; i < rs; i++) for (let j = 0; j < cs; j++) 덮.add((r + i) + '|' + (c + j))
            칸들.push({ ...k, r, c, cs, rs })
            c += cs
          }
        })
        /* 줄 높이 */
        const 높 = 줄들.map(() => 최소)
        const 필요 = (k) => {
          const w = x들[Math.min(열.length, k.c + k.cs)] - x들[k.c]
          const n = k.글 ? 나누기(k.글, w - 1.6, k.크기 || 크기, !!k.굵게).length : 1
          return Math.max(최소, n * (k.크기 || 크기) * PT * 1.25 + 1.8)
        }
        for (const k of 칸들) if (k.rs === 1) 높[k.r] = Math.max(높[k.r], 필요(k))
        for (const k of 칸들) {
          if (k.rs === 1) continue
          const 끝 = Math.min(줄들.length, k.r + k.rs)
          const 지금 = 높.slice(k.r, 끝).reduce((a, b) => a + b, 0)
          const 모자람 = 필요(k) - 지금
          if (모자람 > 0) 높[끝 - 1] += 모자람
        }
        /* 묶음 — rs 로 이어진 줄들은 한 쪽에 같이 */
        const 묶음끝 = 줄들.map((_, r) => r)
        for (const k of 칸들) for (let r = k.r; r < k.r + k.rs - 1 && r < 줄들.length; r++) 묶음끝[r] = Math.max(묶음끝[r], k.r + k.rs - 1)
        return { 칸들, 높, 묶음끝 }
      }
      const 머리 = 놓기(d.머리 || [])
      const 몸 = 놓기(d.줄 || [])
      const 머리높 = 머리.높.reduce((a, b) => a + b, 0)
      let 끝0 = 몸.묶음끝[0] ?? -1
      for (let t = 0; t <= 끝0; t++) 끝0 = Math.max(끝0, 몸.묶음끝[t])
      const 첫묶음 = 몸.높.slice(0, 끝0 + 1).reduce((a, b) => a + b, 0)
      const 아래줄 = [].concat(d.아래글 || []).reduce((n, t) => n + 나누기(t, 폭 - 1.6, 8.5).length, 0)
      const 아래높 = 아래줄 * 5
      const 온높 = (d.제목 ? 8.5 : 1.5) + 머리높 + 몸.높.reduce((a, b) => a + b, 0) + 아래높
      const r = { 안w: 안.w, 크기, 최소, 들, 폭, 열, x들, 머리, 몸, 머리높, 첫묶음, 아래높, 온높, 작음: 온높 <= 안.h * 0.35 }
      Object.defineProperty(d, '_준비', { value: r, configurable: true, writable: true, enumerable: false })
      return r
    }
    function 표놓기(d) {
      const t = 표준비(d)
      if (t.없음) return
      const { 크기, 들, 폭, 열, x들, 머리, 몸, 머리높 } = t
      const 최소 = t.최소
      /* 작은 표(쪽의 1/3 남짓까지)는 쪽 사이에서 끊지 않음 */
      if (t.작음 && y > 안.y + 1 && 남음() < t.온높) 새쪽()
      const 그리기 = (판, r0, r1, y0, 머리판) => {
        const yr = [y0]
        for (let r = r0; r <= r1; r++) yr.push(yr[yr.length - 1] + 판.높[r])
        for (const k of 판.칸들) {
          if (k.r < r0 || k.r > r1) continue
          const 끝 = Math.min(r1, k.r + k.rs - 1)
          const x = x들[k.c], w = x들[Math.min(열.length, k.c + k.cs)] - x
          넣기({
            x, y: yr[k.r - r0], w, h: yr[끝 - r0 + 1] - yr[k.r - r0], 글: k.글, 크기: k.크기 || 크기,
            굵게: k.굵게 ?? (머리판 ? 1 : 0), 정렬: k.정렬 || (d.열정렬 && !머리판 ? d.열정렬[k.c] : '') || (d.테없음 ? '왼' : '가'),
            색: k.색, 바탕: k.바탕 || (머리판 ? (d.머리바탕 || '#eef1f6') : undefined), 테: d.테없음 ? 0 : 1,
          })
        }
        return yr[yr.length - 1]
      }
      if (d.제목) {
        if (남음() < 7 + 머리높 + (몸.높[0] || 최소)) 새쪽()
        else if (y > 안.y + 1) y += 1.5
        넣기({ x: 안.x + 들, y, w: 폭, h: 6.5, 글: d.제목, 크기: 9.5, 굵게: 1, 정렬: '왼', 테: 0 })
        y += 7
      } else if (y > 안.y + 1) y += 1.5
      if (남음() < 머리높 + (몸.높[0] || 0)) 새쪽()
      if (머리.칸들.length) y = 그리기(머리, 0, 머리.높.length - 1, y, true)
      let r = 0
      while (r < 몸.높.length) {
        let 끝 = 몸.묶음끝[r]
        for (let t = r; t <= 끝; t++) 끝 = Math.max(끝, 몸.묶음끝[t])
        /* 마지막 묶음은 표 아래 글(※ …)과 같이 — 아래 글만 다음 쪽에 홀로 넘어가지 않게 */
        const h = 몸.높.slice(r, 끝 + 1).reduce((a, b) => a + b, 0) + (끝 === 몸.높.length - 1 ? t.아래높 : 0)
        if (남음() < h && y > 안.y + 머리높 + 1) {
          새쪽()
          if (머리.칸들.length) y = 그리기(머리, 0, 머리.높.length - 1, y, true)
        }
        y = 그리기(몸, r, 끝, y, false)
        r = 끝 + 1
      }
      if (d.아래글) {
        for (const t of [].concat(d.아래글)) {
          const 줄들 = 나누기(t, 폭 - 1.6, 8.5)
          for (const 줄 of 줄들) {
            if (남음() < 5) 새쪽()
            넣기({ x: 안.x + 들, y, w: 폭, h: 5, 글: 줄, 크기: 8.5, 정렬: '왼', 테: 0, 색: '#333333' })
            y += 5
          }
        }
      }
      y += 1
    }

    /* ── 조직도 ─────────────────────────────────── */
    function 조직놓기(d) {
      const 줄들 = (d.줄들 || []).filter((r) => r && r.length)
      if (!줄들.length) return
      const 상자h = 13, 사이 = 9
      const 높이 = 줄들.length * 상자h + (줄들.length - 1) * 사이
      if (남음() < 높이 + 4) 새쪽()
      else if (y > 안.y + 1) y += 3
      let 앞중심들 = null
      줄들.forEach((줄, ri) => {
        const n = 줄.length
        const 폭 = Math.min(40, (안.w - (n - 1) * 4) / n)
        const 합 = n * 폭 + (n - 1) * 4
        const x0 = 안.x + (안.w - 합) / 2
        const 중심들 = []
        줄.forEach((c, i) => {
          const k = typeof c === 'object' ? c : { 글: String(c) }
          const x = x0 + i * (폭 + 4)
          넣기({ x, y, w: 폭, h: 상자h, 글: k.글, 크기: k.크기 || 9, 굵게: ri === 0 ? 1 : 0, 바탕: k.바탕 || (ri === 0 ? '#dcdcf5' : '#f4f5f8'), 테: 1, 선색: '#4a4a8a' })
          중심들.push(x + 폭 / 2)
        })
        if (앞중심들) {
          /* 위 줄 가운데 → 가로 막대 → 이 줄 상자들 */
          const 위y = y - 사이, 가운데y = y - 사이 / 2
          const 부모 = 앞중심들.length === 1 ? 앞중심들[0] : (앞중심들[0] + 앞중심들[앞중심들.length - 1]) / 2
          넣기({ x: 부모 - 0.2, y: 위y, w: 0.4, h: 사이 / 2, 바탕: '#555555', 테: 0 })
          const a = Math.min(부모, ...중심들), b = Math.max(부모, ...중심들)
          if (b - a > 0.5) 넣기({ x: a, y: 가운데y - 0.2, w: b - a, h: 0.4, 바탕: '#555555', 테: 0 })
          for (const c of 중심들) 넣기({ x: c - 0.2, y: 가운데y, w: 0.4, h: 사이 / 2, 바탕: '#555555', 테: 0 })
        }
        앞중심들 = 중심들
        y += 상자h + (ri < 줄들.length - 1 ? 사이 : 0)
      })
      y += 3
    }

    /* ── 흐름도 ─────────────────────────────────── */
    function 흐름높이(d) {
      const 상자h = d.상자높이 || 9, 사이 = d.사이 || 5
      return (d.상자 || []).reduce((s, b, i) => s + Math.max(상자h, [].concat(b.옆 || []).length * 4.6) + (i ? 사이 : 0), 0) + 4
    }
    function 흐름놓기(d) {
      const 상자w = d.상자폭 || 52, 상자h = d.상자높이 || 9, 사이 = d.사이 || 5
      const x0 = 안.x + (d.왼 ?? 22)
      const 바탕 = d.바탕 || '#dcdcf5'
      /* 한 쪽에 다 들어가는 흐름도는 쪽 사이에서 끊지 않음 */
      const 온높 = 흐름높이(d)
      if (y > 안.y + 1 && 온높 <= 안.h - 4 && 남음() < 온높) 새쪽()
      else if (y > 안.y + 1) y += 2
      ;(d.상자 || []).forEach((b, i) => {
        const 옆 = [].concat(b.옆 || [])
        const 옆높 = 옆.length * 4.6
        const h = Math.max(상자h, 옆높)
        if (남음() < h + (i ? 사이 : 0)) 새쪽()
        else if (i) {
          /* 화살표 — 앞 상자 아래에서 이 상자 위까지 */
          넣기({ x: x0 + 상자w / 2 - 0.2, y, w: 0.4, h: 사이 - 1.6, 바탕: '#555555', 테: 0 })
          넣기({ x: x0 + 상자w / 2 - 2, y: y + 사이 - 2.6, w: 4, h: 2.6, 글: '▼', 크기: 6.5, 색: '#555555', 테: 0 })
          y += 사이
        }
        const by = y + (h - 상자h) / 2
        넣기({ x: x0, y: by, w: 상자w, h: 상자h, 글: b.글, 크기: 9.5, 바탕: b.바탕 || 바탕, 테: 1, 선색: '#4a4a8a' })
        옆.forEach((t, j) => {
          넣기({ x: x0 + 상자w + 8, y: y + (h - 옆높) / 2 + j * 4.6, w: 안.x + 안.w - (x0 + 상자w + 8), h: 4.6, 글: '- ' + t, 크기: 8.5, 정렬: '왼', 테: 0 })
        })
        y += h
      })
      y += 2
    }
  }
  /* 쪽 번호 · 머리글 */
  for (const 쪽 of 쪽들) {
    if (설정.쪽번호 !== false && 쪽.번호) {
      쪽.칸들.push({ x: 0, y: 쪽.높이 - 13, w: 쪽.폭, h: 6, 글: `- ${쪽.번호} -`, 크기: 9, 색: '#555555', 정렬: '가', 테: 0 })
    }
    if (설정.머리글 && 쪽.번호) {
      쪽.칸들.push({ x: 쪽.안.x, y: 9, w: 쪽.안.w, h: 5, 글: 설정.머리글, 크기: 8, 색: '#777777', 정렬: '오', 테: 0 })
    }
  }
  return 쪽들
}
