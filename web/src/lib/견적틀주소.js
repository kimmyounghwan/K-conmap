/**
 * 🤝 G518 하도급 견적틀 주소 — 1순위 카드 → /first/hado-gyeonjeok (값은 주소에 실어 보냄 · 개찰 7일이 지나도 열림)
 * 주소에 싣는 것은 공고번호 · 차수 · 공사명 · 발주처 · 1순위 업체 이름 · 개찰일뿐 — 전화 · 주소 · 대표 · 사업자번호는 안 실음.
 * (화면 파일 pages/HadoGyeonjeok.jsx 를 1순위 화면이 불러오지 않게 따로 둡니다 — 첫 화면 묶음이 커지지 않게)
 */
export function 견적틀주소({ no = '', ord = '', 공사명 = '', 발주 = '', 원청 = '', 날 = '' } = {}) {
  const q = new URLSearchParams()
  if (no) q.set('no', String(no).slice(0, 30))
  if (ord && ord !== '000') q.set('o', String(ord).slice(0, 4))
  if (공사명) q.set('n', String(공사명).slice(0, 80))
  if (발주) q.set('i', String(발주).slice(0, 40))
  if (원청) q.set('w', String(원청).slice(0, 40))
  if (날) q.set('d', String(날).slice(0, 10))
  const s = q.toString()
  return '/first/hado-gyeonjeok' + (s ? '?' + s : '')
}

/** 주소 → 처음 값 */
export function 견적틀값(search) {
  const q = new URLSearchParams(String(search || '').replace(/^\?/, ''))
  return {
    no: (q.get('no') || '').slice(0, 30), ord: (q.get('o') || '').slice(0, 4), 공사명: (q.get('n') || '').slice(0, 80),
    발주: (q.get('i') || '').slice(0, 40), 원청: (q.get('w') || '').slice(0, 40), 날: (q.get('d') || '').slice(0, 10),
  }
}
