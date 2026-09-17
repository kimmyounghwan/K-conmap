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
 *    → 이제 collect.py 가 조달청 «공사 현장 지역(site)» 으로 정해 준 sido 를 씁니다.
 *      화면에서 짐작하지 않습니다 (CLAUDE.md 1번).
 *    ⚠️ 이름을 «rgn» 으로 두면 안 됩니다 — 조달청 rgn(참가가능지역)이 이미 있어서
 *       공고 카드가 「참가지역: 전남」 이라고 엉뚱하게 적습니다. 그래서 sido 입니다.
 *    아래 낱말 방식은 sido 가 없는 옛 자료에서만 씁니다.
 */
export function inRegion(row, region) {
  if (!region || region === '전국') return true
  if (row && row.sido != null && row.sido !== '') {
    return String(row.sido).split(',').includes(region)
  }
  if (row && row.sido === '') return false    // 지역을 못 정한 공고 — 전국에서만 보입니다
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

/* ── 💰 「이 공고의 추정가격」 — 한 곳에서만 정합니다 (2026-09-17) ──────────
 *
 * 🚨 왜 여기로 옮겼나 — 같은 잘못이 화면 세 곳에 따로 있었습니다.
 *      공고 목록 카드   won(r.budget)            ← 늘 배정예산. 99.5% 가 틀렸습니다
 *      펼친 상세        won(r.est || r.budget)   ← est 가 없으면 배정예산으로 떨어짐
 *      공고 한 장       won(r.est || r.budget)   ← 〃
 *    셋 다 이름표는 「추정가격」 이었습니다.
 *
 * ■ 금액이 셋입니다. 셋 다 다릅니다
 *      추정가격 est     ← 법정 경계가 걸리는 금액 (적격심사 구간이 이걸로 갈립니다)
 *      기초금액 base    ← 추정가격 + 부가세
 *      배정예산 budget  ← 총사업비. 제일 큼
 *    실측(공고 16,280건): 배정예산은 추정가격보다 **가운데값 +10.0%**, 상위 10%는 **+67.4%**.
 *    그중 **13.7%(2,085건)** 는 2·3·4·10·50·100억 경계를 넘어 «다른 칸» 으로 보였습니다.
 *
 * ■ 규칙
 *      est 가 있으면 그대로 · 없으면 base ÷ 1.1 · 둘 다 없으면 **0 = 모름**
 *    ⚠️ 0 은 «0원» 이 아닙니다. 부르는 쪽이 반드시 갈라서 다뤄야 합니다.
 *    ⚠️ **배정예산으로 메우지 않습니다.** 모르면 「배정예산」 이라고 이름을 바꿔 보여 줍니다 —
 *       이름과 숫자가 어긋나는 것보다 「모른다」 가 낫습니다.
 *    (est 가 없을 때 base÷1.1 이 맞는지: 둘 다 있는 9,106건 대조 — 오차 1% 이내 94.8%, 가운데값 0.00%)
 */
export const estOf = (r) => {
  const e = Number(r && r.est) || 0
  if (e > 0) return e
  const b = Number(r && r.base) || 0
  return b > 0 ? Math.round(b / 1.1) : 0
}
