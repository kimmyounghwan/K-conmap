/**
 * 💰 금액 칸 읽기 — 한 곳 (G541 · 2026-11-05)
 *   소장님 「사이트 점검도 다 햇어? 이용자 입장에서....마이컨맵도...」 → 이용자처럼 써 보니
 *   마이컨맵 «도급금액» 에 «3억 8,500만» 을 치면 38,500원 · «12억» 은 12원이 되어 서식(착공계 계약금액)에까지 틀린 값이 들어갔음.
 *   G127(2026-10-04 · 4대보험 판단기 «18만» → 18원)과 같은 탈 — 같은 탈이 다른 칸에서 다시 나지 않게 읽기를 이 파일 한 곳에 둡니다.
 *   (lib/ilyong4.js 금액읽기 · lib/영수증.js 금액읽기 는 아직 따로 — 옮길 때 하나씩 시험하며: tools/시험_금액읽기.mjs)
 *
 *   «3억 8,500만» → 385000000 · «12억» → 1200000000 · «3.85억» → 385000000 · «6천만» → 60000000 · «8천5백만» → 85000000
 *   «1조 2천억» → 1200000000000 · «1,250,000,000원» → 1250000000 · «₩55,000» → 55000 · «5만5천» → 55000 · '' · 글자만 → 0
 *   조 · 억 · 만 · 천 · 백 · 십 이 없으면 숫자만 남깁니다(원 단위 — 소수점 아래는 반올림).
 */
const 작은 = (p) => {
  let v = 0, t = String(p || '')
  const 천 = t.match(/^(\d+(?:\.\d+)?)천(.*)$/); if (천) { v += Number(천[1]) * 1000; t = 천[2] }
  const 백 = t.match(/^(\d+(?:\.\d+)?)백(.*)$/); if (백) { v += Number(백[1]) * 100; t = 백[2] }
  const 십 = t.match(/^(\d+(?:\.\d+)?)십(.*)$/); if (십) { v += Number(십[1]) * 10; t = 십[2] }
  if (t) v += Number(t.replace(/[^\d.]/g, '')) || 0
  return Number.isFinite(v) ? v : 0
}

/** 금액 글 → 수(원) — 못 읽으면 0 */
export function 금액수(s) {
  if (typeof s === 'number') return Number.isFinite(s) && s > 0 ? Math.round(s) : 0
  const t = String(s == null ? '' : s).replace(/[,\s원₩]/g, '')
  if (!t) return 0
  if (!/[조억만천백십]/.test(t)) {
    /* G542 점이 둘 이상이면 자리 나눔(«285.000.000» → 285000000 — 바로투찰 예전 digits() 와 같게) · 하나면 소수점(«3.85» → 4) */
    const 점 = (t.match(/\./g) || []).length
    const n = Number((점 > 1 ? t.replace(/\./g, '') : t).replace(/[^\d.]/g, ''))
    return Number.isFinite(n) && n > 0 ? Math.round(n) : 0
  }
  let 조 = 0, 억 = 0, 만 = 0, 나머지 = t
  let a = 나머지.split('조'); if (a.length > 1) { 조 = 작은(a[0]); 나머지 = a.slice(1).join('') }
  a = 나머지.split('억'); if (a.length > 1) { 억 = 작은(a[0]); 나머지 = a.slice(1).join('') }
  a = 나머지.split('만'); if (a.length > 1) { 만 = 작은(a[0]); 나머지 = a.slice(1).join('') }
  const v = Math.round(조 * 1e12 + 억 * 1e8 + 만 * 1e4 + 작은(나머지))
  return Number.isFinite(v) && v > 0 ? v : 0
}

/** 금액 글 → 숫자 글('' = 못 읽음) — lib/ilyong4.js 금액읽기 와 같은 꼴 */
export const 금액글 = (s) => { const n = 금액수(s); return n ? String(n) : '' }

/** 385000000 → «3억 8,500만 원» · 60000000 → «6,000만 원» · 55000 → «5만 5,000원» · 800 → «800원» (칸 아래 «이렇게 읽었습니다» 줄) */
export function 금액말(n) {
  n = Math.round(Number(n) || 0)
  if (!(n > 0)) return ''
  const 조 = Math.floor(n / 1e12), 억 = Math.floor((n % 1e12) / 1e8), 만 = Math.floor((n % 1e8) / 1e4), 원 = n % 1e4
  const 조각 = []
  if (조) 조각.push(조.toLocaleString('ko-KR') + '조')
  if (억) 조각.push(억.toLocaleString('ko-KR') + '억')
  if (만) 조각.push(만.toLocaleString('ko-KR') + '만')
  if (원) 조각.push(원.toLocaleString('ko-KR'))
  return 조각.join(' ') + (원 ? '원' : ' 원')
}

/** 못 읽었을 때 칸 아래 글 — 마이컨맵(G541) · 금액입력.jsx(G542) 같은 글 */
export const 못읽음글 = '⚠ 금액으로 읽지 못했습니다 — 숫자로 적어 주세요'

/**
 * 칸 아래 «이렇게 읽었습니다» 줄 — { 글, bad } · 빈 칸이면 null (G542 · 금액입력.jsx 가 씀)
 *   금액줄(285000000) → «= 2억 8,500만 원» (칸에 이미 285,000,000 이 보일 때)
 *   금액줄('3억 8,500만', true) → «= 3억 8,500만 원 (385,000,000원)» (억 · 만으로 친 글이 칸에 그대로 있을 때)
 *   금액줄('삼억') → ⚠ 못읽음글 · 금액줄(0) · 금액줄('') → null
 */
export function 금액줄(s, 원도 = false) {
  if (typeof s === 'number') { if (!(s > 0)) return null }
  else if (s == null || String(s).trim() === '') return null
  const n = 금액수(s)
  if (!n) return { 글: 못읽음글, bad: true }
  return { 글: '= ' + 금액말(n) + (원도 ? ` (${n.toLocaleString('ko-KR')}원)` : ''), bad: false }
}

/**
 * 금액 칸에 친 글 → { 수, 숫자글, 그대로 } (G542 · 금액입력.jsx 가 칠 때마다 씀)
 *   숫자만(쉼표 섞여도) → 예전 바로투찰 digits() · toNum() 과 같은 값 · 그대로 false(칸엔 쉼표 숫자 — 예전처럼 칠 때마다 쉼표)
 *   단위 · 점 · 띄어쓰기 · 원이 섞이면 → 금액수 · 그대로 true(친 글을 칸에 둠 — 칸을 벗어나면 쉼표 숫자로)
 */
export function 칸글읽기(s) {
  const t = String(s == null ? '' : s)
  if (/^[\d,]*$/.test(t)) { const d = t.replace(/,/g, ''); return { 수: Number(d) || 0, 숫자글: d, 그대로: false } }
  const m = 금액수(t)
  return { 수: m, 숫자글: m ? String(m) : '', 그대로: true }
}

/** 칸에 보일 숫자(쉼표) — 수 0 → '' · 숫자 글 «0» → «0» (예전 바로투찰 칸 «base ? … : ''» · «aIn ? Number(aIn)… : ''» 과 같게)
 *  G544 예전에 친 그대로 남은 글(«3억 8,500만» — 계약 도구 칸은 글을 남겼음)은 읽은 수로 → «385,000,000» */
export function 칸숫자(v) {
  if (typeof v === 'number') return v > 0 ? Math.round(v).toLocaleString('ko-KR') : ''
  const t = String(v == null ? '' : v)
  if (/^[\d,\s]*$/.test(t)) { const d = t.replace(/\D/g, ''); return d ? Number(d).toLocaleString('ko-KR') : '' }
  const n = 금액수(t)
  return n ? n.toLocaleString('ko-KR') : ''
}

/**
 * 글 전체가 금액이면 그 수(원), 아니면 0 — 바로투찰 «공고 찾기» 칸(G542): «2억 8,500만» 도 기초금액으로
 *   숫자만(쉼표 · 띄어쓰기 · 원 · ₩ 섞여도) → 예전과 같은 수 · 단위(조 억 만 천 백 십)가 있으면 점(3.85억)도 됨
 *   낱말이 섞이면(«도로 2억» · «억») 0 → 공고 이름으로 찾기
 */
export function 금액뿐(s) {
  const t = String(s == null ? '' : s).trim()
  if (!t || !/\d/.test(t)) return 0
  if (/^[\d,\s원₩]+$/.test(t)) return 금액수(t)
  if (/^[\d,.\s원₩조억만천백십]+$/.test(t) && /[조억만천백십]/.test(t)) return 금액수(t)
  return 0
}
