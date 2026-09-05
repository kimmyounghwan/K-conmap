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

/**
 * 지역 거르기. — 2026-09-05 고침
 *
 * ⚠️ 전에는 «기관명+공고명에 그 글자가 들어 있나» 로 봤습니다.
 *    전남과 광주가 통합되어 기관명이 「전남광주통합특별시 장흥군」 이 되면서
 *    **「광주」 를 고르면 962건 중 833건(87%)이 전남 시·군 공고**였습니다.
 *    → 이제 collect.py 가 조달청 «공사 현장 지역(site)» 으로 정해 준 rgn 을 씁니다.
 *      화면에서 짐작하지 않습니다 (CLAUDE.md 1번).
 *    아래 낱말 방식은 rgn 이 없는 옛 자료에서만 씁니다.
 */
export function inRegion(row, region) {
  if (!region || region === '전국') return true
  if (row && row.rgn != null && row.rgn !== '') {
    return String(row.rgn).split(',').includes(region)
  }
  if (row && row.rgn === '') return false     // 지역을 못 정한 공고 — 전국에서만 보입니다
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

/* ⚠️ 면허 목록·키워드는 여기서 지웠습니다 — 2026-09-05
 *
 * 공고명 낱말로 면허를 «추측» 하고 있었습니다
 * (철근·콘크리트 → «철콘, 구조물, 옹벽, 배수, 기초»).
 * 실제 공고 12,735건으로 재보니 정확도 15.7%, 놓친 것 82% 였습니다.
 * 조달청이 lic 로 정확히 주고 있었습니다.
 * → 면허 거르기는 web/src/lib/lic.js 가 «조달청 코드»로만 합니다.
 *   여기에 낱말 목록을 다시 만들지 마세요 — 두 벌이 되면 어긋납니다.
 */
