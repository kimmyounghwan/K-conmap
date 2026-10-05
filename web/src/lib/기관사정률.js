/* 🏛 이 기관 최근 사정률 — 2026-09-30
   소장님: 입찰나라에서 가져올 것 «공고 화면에 이 기관 최근 사정률» · 「편리성, 기능성 유지하면서」 · 「핸드폰에서도 편리하게」

   자료: /data/agency/sjr/{통}.json  (build_json.py 가 만듭니다)
     통 번호 = 기관 이름 글자 번호(코드포인트) 합 % 64  ← build_json.py 의 sjr_bucket() 과 «같은 셈»
     한 기관: { n: 사정률 아는 개찰 수, med: 가운데값, c: [[yymmdd, 사정률, 1순위 투찰률, 참가수, 공고명], … 최신 8건],
               p: [yymmddHHMM, …] 아직 개찰 안 된 공고의 개찰 시각(2026-10-05 · 없으면 빠짐) }
   ⚠️ 통 크기는 몇 KB(압축 2~5KB)입니다. 기관 전체 묶음(agency/dat · 약 65KB)을 받지 않습니다 —
      공고 카드를 펼칠 때마다 받으므로 가벼워야 합니다(폰 데이터 · Firebase 전송 한도).
   ⚠️ 한 번 받은 통은 getJSON 이 기억합니다. 같은 통의 다른 기관을 펼치면 다시 받지 않습니다. */
import { getJSON } from './data.js'

export const 통수 = 64

export function 통번호(name) {
  let t = 0
  for (const ch of String(name || '')) t += ch.codePointAt(0)
  return t % 통수
}

/** 기관 이름 → {n, med, c} 또는 null(사정률을 아는 개찰이 없음) */
export async function 기관사정률받기(name) {
  const nm = String(name || '').trim()
  if (!nm) return null
  const d = await getJSON(`/data/agency/sjr/${통번호(nm)}.json`)
  const v = d && d[nm]
  /* ⏳ 사정률을 아직 모르는 기관도 «미개찰» 이 있으면 돌려줍니다 (c 는 빈 칸, p 만) */
  return v && ((Array.isArray(v.c) && v.c.length) || (Array.isArray(v.p) && v.p.length)) ? v : null
}

/** 한국시간 'yymmddHHMM' — 조달청 시각과 견주려고 (기기 시간대와 무관) */
export function 한국시각열(지금 = Date.now()) {
  const t = new Date(지금 + 9 * 3600000).toISOString()
  return t.slice(2, 4) + t.slice(5, 7) + t.slice(8, 10) + t.slice(11, 13) + t.slice(14, 16)
}

/** ⏳ 아직 개찰 안 된 공고 — 2026-10-05, 소장님: 입찰나라처럼 «이 기관 미개찰 N건»
 *  p: ['yymmddHHMM', …] (build_json 이 빌드 때 아직 개찰 전인 것 · 이른 순 30개까지)
 *  → «지금» 보다 뒤인 것만 셉니다(빌드 뒤에 개찰이 지나가도 맞게). {n, 첫: 'M.D HH:MM', 넘침} 또는 null
 *  ⚠️ 30개로 잘라 싣습니다 — 30개가 다 남아 있으면 «30건 넘게» 일 수 있어 넘침 = true */
export function 미개찰(p, 지금 = Date.now()) {
  if (!Array.isArray(p) || !p.length) return null
  const k = 한국시각열(지금)
  const 남 = p.map(String).filter((x) => x.length === 10 && x > k).sort()
  if (!남.length) return null
  const s = 남[0]
  return {
    n: 남.length,
    첫: `${Number(s.slice(2, 4))}.${Number(s.slice(4, 6))} ${s.slice(6, 8)}:${s.slice(8, 10)}`,
    넘침: p.length >= 30 && 남.length === p.length,
  }
}

/** 'yymmdd' → 'M.D' */
export function 날짜짧게(s) {
  const t = String(s || '')
  if (t.length !== 6) return ''
  return `${Number(t.slice(2, 4))}.${Number(t.slice(4, 6))}`
}

/** 그림에 쓸 세로 범위 — 100% 를 늘 넣고, 점이 가장자리에 붙지 않게 0.2%p 띄웁니다 */
export function 세로범위(vals) {
  const v = vals.filter((x) => typeof x === 'number' && isFinite(x))
  if (!v.length) return [99, 101]
  const lo = Math.min(99.4, Math.min(...v) - 0.2)
  const hi = Math.max(100.6, Math.max(...v) + 0.2)
  return [Math.floor(lo * 10) / 10, Math.ceil(hi * 10) / 10]
}

/** 가운데값 한 줄 풀이 — 숫자로 말할 수 있는 것만 */
export function 풀이(med) {
  if (typeof med !== 'number' || !isFinite(med)) return ''
  const d = Math.round((med - 100) * 1000) / 1000
  if (Math.abs(d) < 0.05) return '예정가격이 기초금액과 거의 같게 정해졌습니다'
  return d > 0
    ? `예정가격이 기초금액보다 ${d.toFixed(2)}% 높게 정해지는 편입니다`
    : `예정가격이 기초금액보다 ${Math.abs(d).toFixed(2)}% 낮게 정해지는 편입니다`
}
