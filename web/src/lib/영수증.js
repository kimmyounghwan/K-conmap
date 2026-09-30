/**
 * 🧾 영수증 정리 — 스캔 한 장에 여러 장이면 저절로 나눔 · 과목 추천 · 지출결의서 · 지출명세서 · 증빙철 (2026-09-30)
 *
 * 소장님: imgsheet(영수증 — 스캔본을 올리면 나눠서 목록 · 집계표 · 증빙철) 캡처 → 「아이디어 더 해서 만들어줘. 프로그램으로」
 *
 * ■ 나누기(AI 없음): 스캔을 작은 회색 그림으로 → 바탕이 밝으면 «글자 · 테두리» 를, 어두우면 «종이» 를 찾아
 *   번지게(팽창) 한 뒤 덩어리마다 네모 → 겹치거나 위아래로 붙은 것 합침 → 네모마다 영수증 한 장.
 *   틀리면 화면에서 네모를 끌어 고치거나 새로 그립니다(PhotoBook.jsx 칸고치기).
 * ■ 과목은 «사용처» 글자로 추천(주유소 → 유류비 · 식당/카페 → 식대 …) — 고칠 수 있음.
 * ■ 쪽은 쪽문서.js 모형 — PDF · 엑셀 · 한글 · 워드가 같은 모양. 엑셀에는 수식이 사는 «지출명세 · 과목별» 시트를 더 넣습니다.
 */
/* 엑셀 칸 주소(쪽엑셀.js 와 같음 — 여기서 쪽엑셀을 부르면 화면 첫 짐이 무거워져 따로 둠) */
const 열이름 = (c) => { let s = ''; let n = c + 1; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26) } return s }
const 주소 = (r, c) => `${열이름(c)}${r + 1}`

/* ══════════════════════ 나누기 ══════════════════════ */

function 오츄(gray) {
  const h = new Array(256).fill(0)
  for (let i = 0; i < gray.length; i++) h[gray[i]]++
  const n = gray.length
  let 합 = 0
  for (let t = 0; t < 256; t++) 합 += t * h[t]
  let 합B = 0, wB = 0, 최 = 0, T = 127
  for (let t = 0; t < 256; t++) {
    wB += h[t]
    if (!wB) continue
    const wF = n - wB
    if (!wF) break
    합B += t * h[t]
    const mB = 합B / wB, mF = (합 - 합B) / wF
    const v = wB * wF * (mB - mF) * (mB - mF)
    if (v > 최) { 최 = v; T = t }
  }
  return T
}

/** 가로 rx · 세로 ry 만큼 번지게(상자 안에 하나라도 있으면 1) — 적분 그림 */
function 번지기(mask, w, h, rx, ry) {
  const I = new Uint32Array((w + 1) * (h + 1))
  for (let y = 0; y < h; y++) {
    let 줄 = 0
    for (let x = 0; x < w; x++) {
      줄 += mask[y * w + x]
      I[(y + 1) * (w + 1) + x + 1] = I[y * (w + 1) + x + 1] + 줄
    }
  }
  const out = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - ry), y1 = Math.min(h, y + ry + 1)
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - rx), x1 = Math.min(w, x + rx + 1)
      const s = I[y1 * (w + 1) + x1] - I[y0 * (w + 1) + x1] - I[y1 * (w + 1) + x0] + I[y0 * (w + 1) + x0]
      out[y * w + x] = s > 0 ? 1 : 0
    }
  }
  return out
}

function 덩어리들(mask, w, h) {
  const 표 = new Int32Array(w * h).fill(-1)
  const 상자 = []
  const 줄 = new Int32Array(w * h)
  for (let s = 0; s < w * h; s++) {
    if (!mask[s] || 표[s] >= 0) continue
    const id = 상자.length
    let a = 0, b = 0
    줄[b++] = s; 표[s] = id
    let x0 = w, y0 = h, x1 = 0, y1 = 0, n = 0
    while (a < b) {
      const i = 줄[a++]
      const x = i % w, y = (i - x) / w
      n++
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y
      const 이웃 = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]
      for (const j of 이웃) if (j >= 0 && mask[j] && 표[j] < 0) { 표[j] = id; 줄[b++] = j }
    }
    상자.push({ x0, y0, x1, y1, n })
  }
  return 상자
}

const 합상자 = (a, b) => ({ x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1), n: (a.n || 0) + (b.n || 0) })

/**
 * 영수증 찾기 — gray(Uint8 w×h, 긴 쪽 600~900 점이 알맞음) → [{ x, y, w, h }](0~1 비율)
 */
export function 영수증찾기(gray, w, h, 기록 = null) {
  if (!w || !h) return [{ x: 0, y: 0, w: 1, h: 1 }]
  /* 둘레 밝기 → 바탕이 어두운가 */
  let 둘 = 0, 둘n = 0
  const bx = Math.max(2, Math.round(w * 0.03)), by = Math.max(2, Math.round(h * 0.03))
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (x < bx || x >= w - bx || y < by || y >= h - by) { 둘 += gray[y * w + x]; 둘n++ }
  }
  const 어두운바탕 = 둘 / Math.max(1, 둘n) < 105
  const T = 오츄(gray)
  const mask = new Uint8Array(w * h)
  if (어두운바탕) { for (let i = 0; i < mask.length; i++) mask[i] = gray[i] > Math.max(T, 110) ? 1 : 0 } else {
    /* 오츄 문턱은 «글자 한 가운데» 에 붙기 쉬움(흰 바탕이 거의 전부라서) — 줄여 본 가는 글자는 연해지므로 150~200 사이로
       (종이 테두리 · 감열지 바탕 220 넘는 것은 빼고) */
    const t = Math.min(200, Math.max(150, T))
    for (let i = 0; i < mask.length; i++) mask[i] = gray[i] <= t ? 1 : 0
  }
  /* 가로는 조금만(옆 영수증과 붙지 않게) · 세로는 넉넉히(한 장 안의 빈 줄을 건너게) */
  const rx = 어두운바탕 ? 2 : Math.max(3, Math.round(w * 0.012))
  const ry = 어두운바탕 ? 2 : Math.max(3, Math.round(h * 0.028))
  const m2 = 번지기(mask, w, h, rx, ry)
  let 상자 = 덩어리들(m2, w, h)
    .map((b) => (어두운바탕 ? b : { ...b, x0: Math.min(b.x1, b.x0 + rx), y0: Math.min(b.y1, b.y0 + ry), x1: Math.max(b.x0, b.x1 - rx), y1: Math.max(b.y0, b.y1 - ry) }))
    .filter((b) => (b.x1 - b.x0) >= w * 0.04 && (b.y1 - b.y0) >= h * 0.03)
  if (기록) 기록.push({ 어두운바탕, T, 덩어리: 상자.map((b) => ({ ...b })) })
  /* 겹치는 것 · 위아래로 붙은 것(영수증 한 장이 빈 줄로 끊긴 것) 합치기 */
  const 붙나 = (a, b) => {
    const 틈x = Math.max(0, Math.max(a.x0, b.x0) - Math.min(a.x1, b.x1))
    const 틈y = Math.max(0, Math.max(a.y0, b.y0) - Math.min(a.y1, b.y1))
    if (틈x <= w * 0.008 && 틈y <= h * 0.008) return true
    const 겹x = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)
    const 좁 = Math.min(a.x1 - a.x0, b.x1 - b.x0)
    return 겹x >= 좁 * 0.55 && 틈y <= h * 0.08
  }
  let 바뀜 = true
  while (바뀜) {
    바뀜 = false
    outer: for (let i = 0; i < 상자.length; i++) {
      for (let j = i + 1; j < 상자.length; j++) {
        if (붙나(상자[i], 상자[j])) { 상자[i] = 합상자(상자[i], 상자[j]); 상자.splice(j, 1); 바뀜 = true; break outer }
      }
    }
  }
  상자 = 상자.filter((b) => (b.x1 - b.x0) * (b.y1 - b.y0) >= w * h * 0.005)
  if (!상자.length) return [{ x: 0, y: 0, w: 1, h: 1 }]
  if (상자.length === 1) {
    const b = 상자[0]
    if ((b.x1 - b.x0) * (b.y1 - b.y0) > w * h * 0.8) return [{ x: 0, y: 0, w: 1, h: 1 }]
  }
  /* 글자 둘레만 잡혔으니 종이 여백만큼 넉넉히 — 옆 네모와 겹치지 않게는 화면에서 고침 */
  const 결과 = 상자.map((b) => {
    const px = Math.max(w * 0.022, (b.x1 - b.x0) * 0.14), py = Math.max(h * 0.02, (b.y1 - b.y0) * 0.07)
    const x0 = Math.max(0, b.x0 - px), y0 = Math.max(0, b.y0 - py)
    const x1 = Math.min(w, b.x1 + 1 + px), y1 = Math.min(h, b.y1 + 1 + py)
    return { x: x0 / w, y: y0 / h, w: (x1 - x0) / w, h: (y1 - y0) / h }
  })
  return 차례로(결과)
}

/** 위 줄부터, 줄 안에서는 왼쪽부터 */
export function 차례로(상자들) {
  const a = [...상자들].sort((p, q) => p.y - q.y)
  const 줄들 = []
  for (const b of a) {
    /* 세로로 30% 넘게 겹치면 같은 줄 */
    const 줄 = 줄들.find((z) => z.some((q) => Math.min(q.y + q.h, b.y + b.h) - Math.max(q.y, b.y) > Math.min(q.h, b.h) * 0.3))
    if (줄) 줄.push(b); else 줄들.push([b])
  }
  return 줄들.flatMap((z) => z.sort((p, q) => p.x - q.x))
}

/* ══════════════════════ 과목 · 금액 ══════════════════════ */
export const 과목들 = ['식대', '유류비', '교통비', '숙박비', '운반비', '통신비', '도서인쇄비', '소모품비', '자재비', '장비임차료', '수선비', '복리후생비', '접대비', '잡비']
const 과목규칙 = [
  ['식대', /편의점|GS25|CU\b|세븐일레븐|이마트24|미니스톱/i],
  ['유류비', /주유|오일뱅크|에너지|칼텍스|S-?OIL|에쓰오일|충전소|LPG|셀프주유|알뜰주유/i],
  ['운반비', /택배|퀵|화물|용달|운송|로젠|대한통운|한진|롯데택배|우체국/i],
  ['교통비', /택시|고속버스|시외버스|버스|코레일|KTX|SRT|철도|지하철|하이패스|도로공사|톨게이트|통행료|주차|티머니/i],
  ['숙박비', /호텔|모텔|여관|펜션|리조트|게스트하우스|숙박|민박/i],
  ['통신비', /통신|KT\b|SKT|텔레콤|U\+|유플러스|알뜰폰/i],
  ['도서인쇄비', /문구|인쇄|복사|출력|서점|문고|알라딘|예스24|제본|현수막|간판|사진관/i],
  ['장비임차료', /렌탈|중기|크레인|굴삭기|포크레인|지게차|장비임대|장비/i],
  ['수선비', /정비|카센터|타이어|수리|공업사|세차|자동차/i],
  ['자재비', /레미콘|골재|철강|철근|목재|합판|시멘트|건자재|건재|자재상|파이프|배관자재/i],
  ['소모품비', /철물|공구|다이소|안전용품|작업복|장갑|전기자재|전자|하나로마트|이마트(?!24)|홈플러스|롯데마트|코스트코|마트/i],
  ['복리후생비', /약국|병원|의원|한의원|생수|음료/i],
  ['식대', /식당|반점|국밥|김밥|분식|한식|중식|일식|치킨|피자|짜장|찌개|갈비|고기|횟집|해장|뷔페|면옥|국수|칼국수|족발|보쌈|정육|카페|커피|스타벅스|이디야|투썸|빽다방|메가|컴포즈|베이커리|제과|파리바게|뚜레쥬르|편의점|GS25|CU\b|세븐일레븐|이마트24|맥도날드|버거|롯데리아|맘스터치|푸드|밥|식육|주점|포차|호프/i],
]
export function 과목추천(사용처) {
  const s = String(사용처 || '')
  if (!s.trim()) return ''
  for (const [과목, re] of 과목규칙) if (re.test(s)) return 과목
  return ''
}

/** 금액 글 → 수 — '55,000원' · '₩55000' · '5만5천' */
export function 금액읽기(s) {
  if (typeof s === 'number') return Number.isFinite(s) ? Math.round(s) : 0
  const t = String(s || '').replace(/[,\s₩원]/g, '')
  if (!t) return 0
  const m = t.match(/^(?:(\d+(?:\.\d+)?)만)?(?:(\d+)천)?(\d*)$/)
  if (m && (m[1] || m[2])) return Math.round((+m[1] || 0) * 10000 + (+m[2] || 0) * 1000 + (+m[3] || 0))
  const n = Number(t.replace(/[^\d.-]/g, ''))
  return Number.isFinite(n) ? Math.round(n) : 0
}
export const 쉼표 = (n) => (Number(n) || 0).toLocaleString('ko-KR')

/** 한글 금액 — 123000 → '일십이만삼천' (결의서는 앞에 '일' 을 붙여 고치기 어렵게) */
export function 한글금액(n) {
  n = Math.floor(Math.abs(Number(n) || 0))
  if (!n) return '영'
  const 수 = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구']
  const 작은 = ['', '십', '백', '천']
  const 큰 = ['', '만', '억', '조', '경']
  let out = ''
  let k = 0
  while (n > 0) {
    const 네 = n % 10000
    if (네) {
      let s = ''
      const d = String(네).padStart(4, '0').split('').map(Number)
      d.forEach((v, i) => { if (v) s += 수[v] + 작은[3 - i] })
      out = s + 큰[k] + out
    }
    n = Math.floor(n / 10000); k++
  }
  return out
}

/** 날짜 글 고르기 — '2026-9-3' · '26.09.03' · '9/3' → 'YYYY.MM.DD' */
export function 날짜고르기(s, 해 = new Date().getFullYear()) {
  const t = String(s || '').trim()
  let m = t.match(/(\d{2,4})\s*[.\-/년]\s*(\d{1,2})\s*[.\-/월]\s*(\d{1,2})/)
  if (m) {
    let y = +m[1]; if (y < 100) y += 2000
    return `${y}.${String(+m[2]).padStart(2, '0')}.${String(+m[3]).padStart(2, '0')}`
  }
  m = t.match(/^(\d{1,2})\s*[.\-/월]\s*(\d{1,2})/)
  if (m) return `${해}.${String(+m[1]).padStart(2, '0')}.${String(+m[2]).padStart(2, '0')}`
  return t
}

/** 합계 — 과목별 { 과목, 건수, 금액 } · 모두 · 기간 */
export function 모으기(목록) {
  const 표 = new Map()
  let 모두 = 0
  const 날들 = []
  for (const r of 목록) {
    const 과목 = r.과목 || '(과목 없음)'
    const 금 = 금액읽기(r.금액)
    if (!표.has(과목)) 표.set(과목, { 과목, 건수: 0, 금액: 0 })
    const x = 표.get(과목)
    x.건수 += 1; x.금액 += 금
    모두 += 금
    if (/^\d{4}\.\d{2}\.\d{2}$/.test(r.일자 || '')) 날들.push(r.일자)
  }
  날들.sort()
  const 차례 = [...표.values()].sort((a, b) => {
    const ia = 과목들.indexOf(a.과목), ib = 과목들.indexOf(b.과목)
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib)
  })
  return { 과목별: 차례, 모두, 기간: 날들.length ? (날들[0] === 날들[날들.length - 1] ? 날들[0] : `${날들[0]} ~ ${날들[날들.length - 1]}`) : '' }
}

/* ══════════════════════ 쪽 짓기 ══════════════════════ */
const 회색 = '#F2F2F2'
export const 기본설정 = {
  제목: '지출결의서', 공사명: '', 작성자: '', 작성일: '', 결재: ['담당', '소장'],
  증빙한쪽에: 4, 차례: '올린차례', 명세: true, 증빙: true, 결의서: true, 용량: '보통',
}

function 머리그리기(넣, 안, 제목, 결재) {
  const 결 = (결재 || []).filter((x) => String(x).trim())
  const 결재폭 = 결.length ? 7 + 결.length * 17 : 0
  const 높 = 결.length ? 20 : 13
  넣({ x: 안.x, y: 안.y, w: 안.w - 결재폭 - (결재폭 ? 3 : 0), h: 높, 글: 띄움(제목), 크기: 18, 굵게: true })
  if (결.length) {
    const x0 = 안.x + 안.w - 결재폭
    넣({ x: x0, y: 안.y, w: 7, h: 20, 글: '결\n재', 크기: 8.5, 굵게: true, 테: 1, 바탕: 회색 })
    결.forEach((이름, i) => {
      넣({ x: x0 + 7 + i * 17, y: 안.y, w: 17, h: 6, 글: String(이름), 크기: 8.5, 굵게: true, 테: 1, 바탕: 회색 })
      넣({ x: x0 + 7 + i * 17, y: 안.y + 6, w: 17, h: 14, 테: 1 })
    })
  }
  return 안.y + 높 + 3
}
function 띄움(s) {
  const t = String(s || '').trim()
  if (!t || /\s/.test(t) || [...t].length > 6) return t
  return [...t].join(' ')
}

/**
 * 영수증 목록 → 쪽들
 * @param 목록 [{ id, 일자, 사용처, 과목, 금액, 결제, 사용자, 비고, 그림: 열쇠 }]
 * @returns { 쪽들 }
 */
export function 영수증쪽들(목록, 설정) {
  const S = { ...기본설정, ...설정 }
  const 폭 = 210, 높이 = 297
  const 안 = { x: 12, y: 12, w: 186, h: 273 }
  const 쪽들 = []
  const 합 = 모으기(목록)
  const 새쪽 = () => { const 쪽 = { 폭, 높이, 안, 칸들: [] }; 쪽들.push(쪽); return (r) => { 쪽.칸들.push(r); return r } }

  /* ① 지출결의서 */
  if (S.결의서) {
    const 넣 = 새쪽()
    let y = 머리그리기(넣, 안, S.제목 || '지출결의서', S.결재)
    const h = 8
    const 줄 = (칸) => { let x = 안.x; for (const [w, 글, 이름칸, 더] of 칸) { 넣({ x, y, w, h, 글, 크기: 이름칸 ? 8.5 : 9.5, 굵게: !!이름칸, 테: 1, 바탕: 이름칸 ? 회색 : '', 정렬: 이름칸 ? '가' : '왼', ...(더 || {}) }); x += w } y += h }
    줄([[24, '현 장 명', 1], [안.w - 24, S.공사명 || '']])
    줄([[24, '기 간', 1], [안.w - 24, 합.기간]])
    줄([[24, '작 성 자', 1], [안.w / 2 - 24, S.작성자 || ''], [24, '작 성 일', 1], [안.w / 2 - 24, S.작성일 || '']])
    y += 3
    넣({ x: 안.x, y, w: 24, h: 12, 글: '합 계 금 액', 크기: 9, 굵게: true, 테: 1, 바탕: 회색 })
    넣({ x: 안.x + 24, y, w: 안.w - 24, h: 12, 글: `금 ${한글금액(합.모두)}원정  (${쉼표(합.모두)}원)`, 크기: 12, 굵게: true, 테: 1 })
    y += 12 + 5
    const 열 = [[50, '과 목'], [24, '건 수'], [52, '금 액'], [안.w - 126, '비 고']]
    let x = 안.x
    for (const [w, t] of 열) { 넣({ x, y, w, h: 8, 글: t, 크기: 9, 굵게: true, 테: 1, 바탕: 회색 }); x += w }
    y += 8
    const 줄수 = Math.max(합.과목별.length, 6)
    for (let i = 0; i < 줄수; i++) {
      const r = 합.과목별[i]
      x = 안.x
      const 값 = r ? [r.과목, `${r.건수}건`, `${쉼표(r.금액)}`, ''] : ['', '', '', '']
      열.forEach(([w], j) => { 넣({ x, y, w, h: 8, 글: 값[j], 크기: 9.5, 정렬: j === 2 ? '오' : '가', 테: 1 }); x += w })
      y += 8
    }
    x = 안.x
    const 끝 = ['합 계', `${목록.length}건`, 쉼표(합.모두), '']
    열.forEach(([w], j) => { 넣({ x, y, w, h: 8.5, 글: 끝[j], 크기: 10, 굵게: true, 정렬: j === 2 ? '오' : '가', 테: 1, 바탕: 회색 }); x += w })
    y += 8.5 + 10
    넣({ x: 안.x, y, w: 안.w, h: 9, 글: '위 금액을 지출하였기에 증빙서류를 붙여 결의합니다.', 크기: 10.5 })
    y += 12
    넣({ x: 안.x, y, w: 안.w, h: 7, 글: `붙임  지출명세서 ${S.명세 ? 1 : 0}부 · 증빙자료 ${목록.length}매`, 크기: 9, 정렬: '왼', 색: '#444444' })
  }

  /* ② 지출명세서 — 쪽마다 28줄 */
  if (S.명세) {
    const 열 = [[11, '번호'], [23, '일 자'], [24, '과 목'], [56, '사 용 처'], [16, '결 제'], [28, '금 액'], [안.w - 158, '비 고']]
    const 쪽당 = 28
    const 쪽수 = Math.max(1, Math.ceil(목록.length / 쪽당))
    for (let p = 0; p < 쪽수; p++) {
      const 넣 = 새쪽()
      넣({ x: 안.x, y: 안.y, w: 안.w, h: 12, 글: 띄움('지출명세서'), 크기: 16, 굵게: true })
      let y = 안.y + 13
      넣({ x: 안.x, y, w: 안.w, h: 6, 글: `${S.공사명 ? `현장명 : ${S.공사명}    ` : ''}(${p + 1} / ${쪽수})`, 크기: 8.5, 정렬: '오', 색: '#444444' })
      y += 7
      let x = 안.x
      for (const [w, t] of 열) { 넣({ x, y, w, h: 8, 글: t, 크기: 9, 굵게: true, 테: 1, 바탕: 회색 }); x += w }
      y += 8
      for (let i = 0; i < 쪽당; i++) {
        const n = p * 쪽당 + i
        const r = 목록[n]
        x = 안.x
        const 값 = r ? [String(n + 1), r.일자 || '', r.과목 || '', r.사용처 || '', r.결제 || '', 쉼표(금액읽기(r.금액)), r.비고 || ''] : ['', '', '', '', '', '', '']
        열.forEach(([w], j) => { 넣({ x, y, w, h: 7.6, 글: 값[j], 크기: 9, 정렬: j === 5 ? '오' : j === 3 || j === 6 ? '왼' : '가', 테: 1 }); x += w })
        y += 7.6
      }
      if (p === 쪽수 - 1) {
        x = 안.x
        const 앞 = 열.slice(0, 5).reduce((a, [w]) => a + w, 0)
        넣({ x, y, w: 앞, h: 8.5, 글: `합 계  (${목록.length}건)`, 크기: 10, 굵게: true, 테: 1, 바탕: 회색 })
        넣({ x: x + 앞, y, w: 열[5][0], h: 8.5, 글: 쉼표(합.모두), 크기: 10, 굵게: true, 정렬: '오', 테: 1, 바탕: 회색 })
        넣({ x: x + 앞 + 열[5][0], y, w: 열[6][0], h: 8.5, 테: 1, 바탕: 회색 })
      }
    }
  }

  /* ③ 증빙자료 — 영수증 그림 */
  if (S.증빙 && 목록.length) {
    const 배치 = { 2: [1, 2], 4: [2, 2], 6: [2, 3], 8: [2, 4] }[S.증빙한쪽에] || [2, 2]
    const [열수, 줄수] = 배치
    const 쪽당 = 열수 * 줄수
    const 쪽수 = Math.ceil(목록.length / 쪽당)
    for (let p = 0; p < 쪽수; p++) {
      const 넣 = 새쪽()
      넣({ x: 안.x, y: 안.y, w: 안.w, h: 12, 글: 띄움('증빙자료'), 크기: 16, 굵게: true })
      넣({ x: 안.x, y: 안.y + 13, w: 안.w, h: 6, 글: `${S.공사명 ? `현장명 : ${S.공사명}    ` : ''}(${p + 1} / ${쪽수})`, 크기: 8.5, 정렬: '오', 색: '#444444' })
      const y0 = 안.y + 21
      const 틈 = 3
      const 칸폭 = (안.w - 틈 * (열수 - 1)) / 열수
      const 칸높 = (안.y + 안.h - y0 - 틈 * (줄수 - 1)) / 줄수
      for (let i = 0; i < 쪽당; i++) {
        const n = p * 쪽당 + i
        const r = 목록[n]
        if (!r) break
        const cx = 안.x + (i % 열수) * (칸폭 + 틈)
        const cy = y0 + Math.floor(i / 열수) * (칸높 + 틈)
        const 글높 = 7
        넣({ x: cx, y: cy, w: 칸폭, h: 칸높 - 글높, 테: 1, 그림: r.그림, 사진: r.id, 맞춤: '다보임' })
        넣({ x: cx, y: cy + 칸높 - 글높, w: 9, h: 글높, 글: String(n + 1), 크기: 9.5, 굵게: true, 테: 1, 바탕: 회색 })
        const 남 = 칸폭 - 9
        const 칸 = [[남 * 0.3, r.일자 || ''], [남 * 0.4, [r.과목, r.사용처].filter(Boolean).join(' · ')], [남 * 0.3, `${쉼표(금액읽기(r.금액))}원`]]
        let x = cx + 9
        칸.forEach(([w, t], j) => { 넣({ x, y: cy + 칸높 - 글높, w, h: 글높, 글: t, 크기: 8.5, 정렬: j === 2 ? '오' : j === 1 ? '왼' : '가', 테: 1 }); x += w })
      }
    }
  }
  return { 쪽들, 합 }
}

/** 엑셀 — 수식이 사는 «지출명세» · «과목별» 시트 */
export function 영수증수식시트들(목록, 설정) {
  const S = { ...기본설정, ...설정 }
  const 머리모양 = { 테: 1, 바탕: 회색, 굵게: true, 크기: 10 }
  const 칸모양 = { 테: 1, 크기: 10 }
  const 명세 = { 이름: '지출명세', 열너비: [14, 26, 26, 60, 18, 30, 22, 40], 칸들: [], 병합: [[0, 0, 0, 7]], 줄높이: { 0: 11 }, 고정줄: 3 }
  명세.칸들.push({ r: 0, c: 0, 값: '지 출 명 세 서', 모양: { 굵게: true, 크기: 16 } })
  명세.칸들.push({ r: 1, c: 0, 값: `현장명 : ${S.공사명 || ''}`, 모양: { 정렬: '왼', 크기: 10, 줄바꿈: false } })
  const 머리 = ['번호', '일자', '과목', '사용처', '결제', '금액', '사용자', '비고']
  머리.forEach((t, c) => 명세.칸들.push({ r: 2, c, 값: t, 모양: 머리모양 }))
  명세.줄높이[2] = 7
  목록.forEach((x, i) => {
    const r = 3 + i
    명세.줄높이[r] = 6.5
    const 값 = [i + 1, x.일자 || '', x.과목 || '', x.사용처 || '', x.결제 || '', 금액읽기(x.금액), x.사용자 || '', x.비고 || '']
    값.forEach((v, c) => 명세.칸들.push({ r, c, 값: v, 모양: { ...칸모양, 정렬: c === 3 || c === 7 ? '왼' : c === 5 ? '오' : '가', ...(c === 5 ? { 형식: '#,##0' } : {}) } }))
  })
  const 끝 = 3 + 목록.length
  const 모두 = 목록.reduce((a, x) => a + 금액읽기(x.금액), 0)
  명세.줄높이[끝] = 7.5
  for (let c = 0; c < 8; c++) {
    if (c === 5) 명세.칸들.push({ r: 끝, c, 수식: 목록.length ? `SUM(${주소(3, 5)}:${주소(끝 - 1, 5)})` : '0', 값: 모두, 모양: { ...머리모양, 정렬: '오', 형식: '#,##0' } })
    else 명세.칸들.push({ r: 끝, c, 값: c === 0 ? '합계' : '', 모양: 머리모양 })
  }
  명세.병합.push([끝, 0, 끝, 4])

  const 합 = 모으기(목록)
  const 과 = { 이름: '과목별', 열너비: [40, 22, 40], 칸들: [], 병합: [[0, 0, 0, 2]], 줄높이: { 0: 11 } }
  과.칸들.push({ r: 0, c: 0, 값: '과 목 별  합 계', 모양: { 굵게: true, 크기: 14 } })
  ;['과목', '건수', '금액'].forEach((t, c) => 과.칸들.push({ r: 2, c, 값: t, 모양: 머리모양 }))
  const 범위 = (c) => `지출명세!$${String.fromCharCode(65 + c)}$4:$${String.fromCharCode(65 + c)}$${Math.max(4, 끝)}`
  합.과목별.forEach((x, i) => {
    const r = 3 + i
    과.칸들.push({ r, c: 0, 값: x.과목, 모양: 칸모양 })
    /* 과목을 안 적은 줄은 명세에서 빈칸 — 조건도 빈칸("") */
    const 조건 = x.과목 === '(과목 없음)' ? '""' : 주소(r, 0)
    과.칸들.push({ r, c: 1, 수식: `COUNTIF(${범위(2)},${조건})`, 값: x.건수, 모양: { ...칸모양, 형식: '#,##0' } })
    과.칸들.push({ r, c: 2, 수식: `SUMIF(${범위(2)},${조건},${범위(5)})`, 값: x.금액, 모양: { ...칸모양, 정렬: '오', 형식: '#,##0' } })
  })
  const 과끝 = 3 + 합.과목별.length
  과.칸들.push({ r: 과끝, c: 0, 값: '합계', 모양: 머리모양 })
  과.칸들.push({ r: 과끝, c: 1, 수식: 합.과목별.length ? `SUM(${주소(3, 1)}:${주소(과끝 - 1, 1)})` : '0', 값: 목록.length, 모양: { ...머리모양, 형식: '#,##0' } })
  과.칸들.push({ r: 과끝, c: 2, 수식: 합.과목별.length ? `SUM(${주소(3, 2)}:${주소(과끝 - 1, 2)})` : '0', 값: 합.모두, 모양: { ...머리모양, 정렬: '오', 형식: '#,##0' } })
  과.칸들.push({ r: 과끝 + 2, c: 0, 값: '※ 지출명세 시트의 과목 · 금액을 고치면 여기 합계가 따라 바뀝니다.', 모양: { 정렬: '왼', 크기: 9, 색: '#666666', 줄바꿈: false } })
  return [명세, 과]
}
