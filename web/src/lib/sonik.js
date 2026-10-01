/**
 * 💰 현장 손익 장부 — 매출 · 매입 · 미수금 · 미지급금 · 손익 (G112 · 2026-10-01)
 *
 * 소장님: 「예스폼에 또 뭐가 있지??? 새로 만들어야 할 서식은?」 → 예스폼 «현장 매입매출·손익»(누적 조회 40만, 우리 사이트에 없음)
 *   → 「1부터 4까지 만들어 보자」 (① 현장 손익 장부)
 * ■ 현장 투입비(/tools/tuipbi)와 다른 점: 투입비는 «현장이 날마다 적는 원가 · 청구서»(서버 · 여럿이 같이),
 *   이 장부는 «사장님이 세금계산서 단위로 적는 돈 들어오고 나간 것»(이 브라우저만) — 현장 여러 곳을 한 장부에서.
 * ■ 손익 = 매출 공급가액 − 매입 공급가액 (부가세는 빼고). 미수금 = 매출 합계(공급가 + 부가세) − 받은 돈. 미지급금도 같은 셈.
 * ■ 선급금은 받은 돈에만 넣고 매출에는 안 넣습니다 — 기성을 받을 때 정산분을 빼고 받으면 미수금이 저절로 맞습니다.
 *   «이대로 가면» = 매입 ÷ 진행률(매출 ÷ 도급액)로 본 참고값 — 회계 · 세무 판단이 아닙니다.
 * ■ 저장: 이 브라우저(localStorage)만 · 서버에 안 보냅니다.
 *
 * 저장 모양(v1)
 *   { co, 현장: [{ id, n, o 발주처, amt 도급액(공급가액), s 착공, e 준공 }],
 *     R: [{ id, h 현장id, d 날짜, k 'S'매출|'P'매입, c 항목, v 거래처, t 적요, sup 공급가액, tax 부가세, ev 증빙, pd 결제일, pa 결제액 }] }
 */

export const 열쇠 = 'kcm_sonik1'
export const 매출항목 = ['기성금', '준공금', '선급금', '추가·변경', '기타 수입']
export const 매입항목 = ['노무비', '자재비', '장비비', '외주비', '경비', '기타']
export const 증빙들 = ['세금계산서', '계산서', '카드', '현금영수증', '간이영수증', '없음']
export const 구분이름 = { S: '매출', P: '매입' }

export const 수 = (v) => { const x = Number(String(v ?? '').replace(/[^\d.-]/g, '')); return Number.isFinite(x) ? x : 0 }
export const 원 = (n) => Math.round(n || 0).toLocaleString('ko-KR')
const 두자 = (n) => String(n).padStart(2, '0')
export const 오늘 = () => { const t = new Date(); return `${t.getFullYear()}-${두자(t.getMonth() + 1)}-${두자(t.getDate())}` }
export const 새번호 = () => 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
export const 합계 = (r) => 수(r.sup) + 수(r.tax)
export const 미결 = (r) => 합계(r) - 수(r.pa)
export const 분기 = (d) => { const m = Number(String(d).slice(5, 7)); return m ? `${String(d).slice(0, 4)}년 ${Math.ceil(m / 3)}분기` : '' }

export function 빈장부() { return { co: '', 현장: [], R: [] } }
export function 읽기() {
  try {
    const s = JSON.parse(localStorage.getItem(열쇠) || 'null')
    if (s && Array.isArray(s.현장) && Array.isArray(s.R)) return { ...빈장부(), ...s }
  } catch (e) { /* 막힌 브라우저 · 깨진 값 */ }
  return 빈장부()
}
export function 쓰기(s) { try { localStorage.setItem(열쇠, JSON.stringify(s)); return true } catch (e) { return false } }

/** 선급금 — 받은 돈에는 들지만 매출(손익 · 진행률)에는 안 듭니다. 기성에서 정산된 만큼은 기성 줄의 결제액이 줄어 미수금이 맞아떨어집니다. */
export const 선급 = (r) => r.k === 'S' && r.c === '선급금'
const 빈쪽 = () => ({ 공급: 0, 세: 0, 합: 0, 결제: 0, 미: 0, 건: 0, 선급: 0 })
function 쌓기(o, r) {
  o.건++
  if (선급(r)) { o.결제 += 수(r.pa); o.미 -= 수(r.pa); o.선급 += 수(r.pa); return }
  o.공급 += 수(r.sup); o.세 += 수(r.tax); o.합 += 합계(r); o.결제 += 수(r.pa); o.미 += 미결(r)
}

/** 줄들 → 매출 · 매입 · 손익 (현장 하나면 도급액으로 진행률 · 참고 예상) */
export function 셈(rows, 현장 = null) {
  const 매출 = 빈쪽(), 매입 = 빈쪽()
  const 항목매입 = new Map(), 항목매출 = new Map()
  for (const r of rows) {
    if (r.k === 'S') { 쌓기(매출, r); if (!선급(r)) 항목매출.set(r.c || '기타 수입', (항목매출.get(r.c || '기타 수입') || 0) + 수(r.sup)) }
    else if (r.k === 'P') { 쌓기(매입, r); 항목매입.set(r.c || '기타', (항목매입.get(r.c || '기타') || 0) + 수(r.sup)) }
  }
  const 손익 = 매출.공급 - 매입.공급
  const 도급 = 현장 ? 수(현장.amt) : 0
  const 진행 = 도급 > 0 ? 매출.공급 / 도급 : NaN
  const 예상원가 = Number.isFinite(진행) && 진행 >= 0.05 ? 매입.공급 / 진행 : NaN
  const 차례 = (m, 순) => [...m.entries()].sort((a, b) => 순.indexOf(a[0]) - 순.indexOf(b[0]) || b[1] - a[1]).map(([이름, 금]) => ({ 이름, 금 }))
  return {
    매출, 매입, 손익, 이익률: 매출.공급 > 0 ? 손익 / 매출.공급 : NaN,
    도급, 진행, 예상원가, 예상손익: Number.isFinite(예상원가) ? 도급 - 예상원가 : NaN,
    남은도급: 도급 > 0 ? 도급 - 매출.공급 : NaN,
    항목매입: 차례(항목매입, 매입항목), 항목매출: 차례(항목매출, 매출항목),
  }
}

/** 달마다 — 청구 기준(날짜) 매출 · 매입 · 손익 · 누계 / 돈 기준(결제일) 들어온 · 나간 */
export function 달별(rows) {
  const m = new Map()
  const 달 = (ym) => { let x = m.get(ym); if (!x) { x = { ym, 매출: 0, 매입: 0, 들어옴: 0, 나감: 0 }; m.set(ym, x) } return x }
  for (const r of rows) {
    const ym = String(r.d || '').slice(0, 7)
    if (ym) { if (r.k === 'S') { if (!선급(r)) 달(ym).매출 += 수(r.sup) } else if (r.k === 'P') 달(ym).매입 += 수(r.sup) }
    const pm = String(r.pd || '').slice(0, 7)
    if (pm && 수(r.pa)) { if (r.k === 'S') 달(pm).들어옴 += 수(r.pa); else if (r.k === 'P') 달(pm).나감 += 수(r.pa) }
  }
  let 누 = 0, 돈누 = 0
  return [...m.values()].sort((a, b) => a.ym.localeCompare(b.ym)).map((x) => {
    누 += x.매출 - x.매입; 돈누 += x.들어옴 - x.나감
    return { ...x, 손익: x.매출 - x.매입, 누계: 누, 돈: x.들어옴 - x.나감, 돈누계: 돈누 }
  })
}

/** 거래처마다 — 매출처는 미수금, 매입처는 미지급금 */
export function 거래처별(rows) {
  const m = new Map()
  for (const r of rows) {
    const key = (r.k || '') + '|' + (String(r.v || '').trim() || '(거래처 없음)')
    let x = m.get(key)
    if (!x) { x = { k: r.k, v: key.split('|')[1], 합: 0, 결제: 0, 미: 0, 건: 0, 마지막: '' }; m.set(key, x) }
    if (선급(r)) { x.결제 += 수(r.pa); x.미 -= 수(r.pa) } else { x.합 += 합계(r); x.결제 += 수(r.pa); x.미 += 미결(r) }
    x.건++
    if ((r.d || '') > x.마지막) x.마지막 = r.d
  }
  return [...m.values()].sort((a, b) => (a.k === b.k ? b.미 - a.미 || b.합 - a.합 : a.k === 'S' ? -1 : 1))
}

/** 분기마다 매출세액 − 매입세액 (참고 — 공제 여부는 증빙 · 세법에 따라 다름) */
export function 분기세(rows) {
  const m = new Map()
  for (const r of rows) {
    const q = 분기(r.d)
    if (!q || !수(r.tax)) continue
    let x = m.get(q); if (!x) { x = { q, 매출세: 0, 매입세: 0 }; m.set(q, x) }
    if (r.k === 'S') x.매출세 += 수(r.tax); else if (r.k === 'P') x.매입세 += 수(r.tax)
  }
  return [...m.values()].sort((a, b) => a.q.localeCompare(b.q)).map((x) => ({ ...x, 차: x.매출세 - x.매입세 }))
}

/** 엑셀에서 복사한 표 → 줄 (탭으로 나뉜 칸: 날짜 · 구분 · 항목 · 거래처 · 적요 · 공급가액 · 부가세 · 결제일 · 결제액) */
export function 붙여읽기(text, h) {
  const out = []
  const 날 = (s) => {
    const t = String(s || '').trim().replace(/[./]/g, '-').replace(/\s+/g, '')
    const m = t.match(/^(\d{2,4})-(\d{1,2})-(\d{1,2})/)
    if (!m) return ''
    const y = m[1].length === 2 ? '20' + m[1] : m[1]
    return `${y}-${두자(m[2])}-${두자(m[3])}`
  }
  for (const line of String(text || '').split(/\r?\n/)) {
    if (!line.trim()) continue
    const c = line.split('\t').map((x) => x.trim())
    const d = 날(c[0])
    if (!d) continue                                         // 머리 줄 · 빈 날짜
    const g = c[1] || ''
    const k = /매출|수입|^S$|받/.test(g) ? 'S' : /매입|지출|^P$|비용|줄|지급/.test(g) ? 'P' : ''
    if (!k) continue
    const sup = 수(c[5]), tax = c[6] === undefined || c[6] === '' ? 0 : 수(c[6])
    if (!sup && !tax) continue
    out.push({ id: 새번호(), h, d, k, c: c[2] || (k === 'S' ? '기성금' : '기타'), v: c[3] || '', t: c[4] || '', sup, tax, ev: tax ? '세금계산서' : '', pd: 날(c[7]), pa: 수(c[8]) })
  }
  return out
}

/** 🧪 예시 — 지어낸 회사 · 현장 · 거래처 (다섯 달) */
export function 예시() {
  const 가 = { id: 'h-ex1', n: '가나지구 배수로 정비공사', o: '○○시', amt: 850000000, s: '2026-05-01', e: '2026-12-31' }
  const 나 = { id: 'h-ex2', n: '다라 물류창고 신축공사', o: '가상물류(주)', amt: 1240000000, s: '2026-06-15', e: '2027-03-31' }
  const R = []
  const 더 = (h, d, k, c, v, t, sup, 결제 = 'all', pd = '') => {
    const tax = c === '노무비' || c === '선급금' ? 0 : Math.round(sup / 10)
    const pa = 결제 === 'all' ? sup + tax : 결제 === 'none' ? 0 : 결제
    R.push({ id: 새번호(), h, d, k, c, v, t, sup, tax, ev: c === '노무비' || c === '선급금' ? '없음' : '세금계산서', pd: pa ? (pd || d) : '', pa })
  }
  /* 가나 — 선급금 1억 2천 · 기성 넉 번(받을 때 선급금 정산분을 빼고 들어옴 · 마지막 하나는 아직) */
  더(가.id, '2026-05-20', 'S', '선급금', '○○시', '선급금 (도급액의 약 14%)', 120000000, 'all', '2026-05-28')
  const 정산 = (sup) => Math.round(sup * 120 / 850)
  for (const [d, 회, sup, pd] of [['2026-06-30', 1, 98000000, '2026-07-14'], ['2026-07-31', 2, 112000000, '2026-08-18'], ['2026-08-31', 3, 104000000, '2026-09-15'], ['2026-09-30', 4, 96000000, '']]) {
    더(가.id, d, 'S', '기성금', '○○시', `${회}회 기성 (선급금 정산 ${원(정산(sup))} 빼고 받음)`, sup, pd ? Math.round(sup * 1.1) - 정산(sup) : 'none', pd)
  }
  for (const [m, n] of [['05', 5], ['06', 8], ['07', 9], ['08', 9], ['09', 8]]) {
    더(가.id, `2026-${m}-${m === '06' || m === '09' ? 30 : 31}`, 'P', '노무비', '가나 인력', `${Number(m)}월 일용 노무비 (${n * 22}공)`, n * 22 * 185000, m === '09' ? 'none' : 'all', `2026-${두자(Number(m) + 1)}-10`)
  }
  for (const [m, a] of [['06', 12400000], ['07', 16200000], ['08', 14600000], ['09', 9800000]]) {
    더(가.id, `2026-${m}-10`, 'P', '자재비', '가상레미콘', `레미콘 25-21-150 · ${Number(m)}월분`, a, m === '09' ? 'none' : 'all', `2026-${두자(Number(m) + 1)}-10`)
  }
  더(가.id, '2026-06-20', 'P', '자재비', '가상철강', '철근 SD400 D13~D22', 14800000, 'all', '2026-07-20')
  더(가.id, '2026-07-25', 'P', '자재비', '가상흄관', '흄관 D600 · D800', 38500000, 15000000, '2026-08-25')
  for (const [m, a] of [['05', 9600000], ['06', 15800000], ['07', 17200000], ['08', 14900000], ['09', 12100000]]) {
    더(가.id, `2026-${m}-28`, 'P', '장비비', '가상중기', `굴착기 0.6㎥ · 덤프 ${Number(m)}월분`, a, m === '09' ? 'none' : 'all', `2026-${두자(Number(m) + 1)}-15`)
  }
  더(가.id, '2026-08-05', 'P', '외주비', '가상전기(외주)', '가로등 기초 · 배관 기성', 18000000, 'all', '2026-08-30')
  더(가.id, '2026-09-25', 'P', '경비', '가상안전', '안전시설 · 보호구', 4200000, 'all', '2026-09-25')
  더(가.id, '2026-07-15', 'P', '경비', '○○보증', '하자 · 계약 보증 수수료', 1850000, 'all', '2026-07-15')
  /* 다라 — 기성 둘(두 번째는 아직) · 외주 큼 */
  더(나.id, '2026-07-31', 'S', '기성금', '가상물류(주)', '1회 기성', 186000000, 'all', '2026-08-31')
  더(나.id, '2026-09-30', 'S', '기성금', '가상물류(주)', '2회 기성', 214000000, 'none')
  더(나.id, '2026-07-20', 'P', '외주비', '가상철골(외주)', '철골 제작 · 설치 1차', 118000000, 'all', '2026-08-20')
  더(나.id, '2026-09-20', 'P', '외주비', '가상철골(외주)', '철골 제작 · 설치 2차', 104000000, 'none')
  더(나.id, '2026-08-25', 'P', '자재비', '가상레미콘', '기초 레미콘', 42600000, 'all', '2026-09-25')
  for (const [m, n] of [['07', 6], ['08', 7], ['09', 6]]) {
    더(나.id, `2026-${m}-${m === '09' ? 30 : 31}`, 'P', '노무비', '다라 인력', `${Number(m)}월 일용 노무비 (${n * 20}공)`, n * 20 * 190000, m === '09' ? 'none' : 'all', `2026-${두자(Number(m) + 1)}-10`)
  }
  더(나.id, '2026-08-28', 'P', '장비비', '가상크레인', '크레인 50t 임대', 9800000, 'all', '2026-09-28')
  return { co: '예시건설(주)', 현장: [가, 나], R }
}
