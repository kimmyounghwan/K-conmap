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
    const n = Number(t.replace(/[^\d.]/g, ''))
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
