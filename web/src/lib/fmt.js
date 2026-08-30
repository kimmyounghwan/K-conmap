// 표시 형식 모음

export const won = (n) => {
  const v = Number(n) || 0
  if (!v) return '-'
  return v.toLocaleString('ko-KR') + '원'
}

/** 큰 금액을 억/만 단위로 짧게 (모바일 카드용) */
export const wonShort = (n) => {
  const v = Number(n) || 0
  if (!v) return '-'
  if (v >= 100000000) {
    const eok = v / 100000000
    return (eok >= 100 ? Math.round(eok) : eok.toFixed(1).replace(/\.0$/, '')) + '억'
  }
  if (v >= 10000) return Math.round(v / 10000).toLocaleString('ko-KR') + '만'
  return v.toLocaleString('ko-KR')
}

export const pct = (n, d = 2) =>
  n === null || n === undefined || Number.isNaN(n) ? '-' : Number(n).toFixed(d) + '%'

export const num = (n) => (Number(n) || 0).toLocaleString('ko-KR')

/** '20260430' / '2026-04-30 15:00' 등 뒤섞인 형식을 Date 로 */
export function parseDate(v) {
  if (!v) return null
  const s = String(v).trim()
  if (!s || s === '-') return null
  const digits = s.replace(/[^0-9]/g, '')
  if (digits.length >= 12) {
    const d = new Date(
      +digits.slice(0, 4), +digits.slice(4, 6) - 1, +digits.slice(6, 8),
      +digits.slice(8, 10), +digits.slice(10, 12))
    return isNaN(d) ? null : d
  }
  if (digits.length === 8) {
    const d = new Date(+digits.slice(0, 4), +digits.slice(4, 6) - 1, +digits.slice(6, 8))
    return isNaN(d) ? null : d
  }
  const d = new Date(s)
  return isNaN(d) ? null : d
}

const p2 = (n) => String(n).padStart(2, '0')

export function dateShort(v) {
  const d = parseDate(v)
  if (!d) return '-'
  return `${p2(d.getMonth() + 1)}.${p2(d.getDate())}`
}

export function dateTime(v) {
  const d = parseDate(v)
  if (!d) return '-'
  return `${p2(d.getMonth() + 1)}.${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}`
}

export function dateFull(v) {
  const d = parseDate(v)
  if (!d) return '-'
  return `${d.getFullYear()}.${p2(d.getMonth() + 1)}.${p2(d.getDate())}`
}

/** 마감까지 남은 시간 — 공고 카드의 긴급도 */
export function dday(v) {
  const d = parseDate(v)
  if (!d) return null
  const diff = d.getTime() - Date.now()
  if (diff < 0) return { text: '마감', tone: 'n' }
  const h = diff / 36e5
  if (h < 24) return { text: `${Math.max(1, Math.floor(h))}시간 남음`, tone: 'r' }
  const days = Math.floor(h / 24)
  return { text: `D-${days}`, tone: days <= 3 ? 'w' : 'b' }
}

export const REGIONS = ['전국', '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
  '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주']

const REGION_ALIAS = {
  경기: ['경기'], 강원: ['강원'], 충북: ['충북', '충청북도'], 충남: ['충남', '충청남도'],
  전북: ['전북', '전라북도'], 전남: ['전남', '전라남도'],
  경북: ['경북', '경상북도'], 경남: ['경남', '경상남도'],
}

export function inRegion(row, region) {
  if (!region || region === '전국') return true
  const pats = REGION_ALIAS[region] || [region]
  const blob = `${row.inst || ''} ${row.name || ''}`
  return pats.some((p) => blob.includes(p))
}

/** 업체명 정규화 — build_json.py 의 norm_corp 과 반드시 같은 규칙 */
const CORP_NOISE = ['주식회사', '(주)', '㈜', '유한회사', '합자회사', '(유)', '(합)', '주)', '유)']
export function normCorp(s) {
  let v = String(s || '')
  for (const t of CORP_NOISE) v = v.split(t).join('')
  return v.replace(/\s+/g, '').trim()
}

/** 면허별 매칭 키워드 — 기존 K-건설맵 규칙 그대로 */
export const LICENSES = [
  '[종합] 건축공사업', '[종합] 토목공사업', '[종합] 토목건축공사업', '[종합] 조경공사업',
  '[전문] 지반조성·포장공사업', '[전문] 실내건축공사업', '[전문] 철근·콘크리트공사업',
  '[기타] 전기공사업', '[기타] 정보통신공사업', '[기타] 소방시설공사업',
]

export function licenseKeywords(lic) {
  const k = new Set()
  const add = (...xs) => xs.forEach((x) => k.add(x))
  if (lic.includes('토목')) add('토목', '도로', '포장', '하천', '교량', '정비', '관로', '상수도', '하수도')
  if (lic.includes('건축')) add('건축', '신축', '증축', '보수', '인테리어', '방수', '도장')
  if (lic.includes('조경')) add('조경', '식재', '공원', '수목')
  if (lic.includes('전기')) add('전기', '배전', '가로등', 'CCTV')
  if (lic.includes('통신')) add('통신', '네트워크', '방송')
  if (lic.includes('소방')) add('소방', '화재', '스프링클러')
  if (lic.includes('철근') || lic.includes('콘크리트')) add('철콘', '구조물', '옹벽', '배수', '기초')
  if (lic.includes('지반') || lic.includes('포장')) add('지반', '포장', '아스팔트', '토공')
  if (lic.includes('실내건축')) add('실내건축', '인테리어', '내장', '칸막이')
  return [...k]
}
