/* ══════════════════════════════════════════════════════════════
   확보예가자료.js — 🎯 확보 예가를 «무료로» 보이기 위한 작은 자료 (G184 · 2026-10-07)

   소장님: 「비용이 왜 이렇게 들어가지? 무료로 할 수 있는 방법 없어?」 → 「해. 1, 2번으로 무료로 만들어 줘」
     전에는 바로투찰 · 업체 페이지가 확보 예가를 셀 때 개찰 자료 통째(first_full.json · 받는 크기 8.4MB)를 받았습니다.
     호스팅 무료 전송량(한 달 10GB)으로는 하루 40번쯤밖에 못 봅니다.
   → 매일 자동 갱신(깃허브 · 무료) 때 tools/확보예가굽기.mjs 가 두 가지를 미리 만들어 싣습니다:
     ① /data/kb/mini.json   — 바로투찰 «확보 예가 미리 보기» 용: 셈에 필요한 숫자만(업체 금액은 «하한선이 되는 사정률» 로 바꿔 차이만) · 0.5MB 남짓
     ② /data/kb/c/{번호}.json — 업체 페이지용: 사업자번호마다 미리 센 결과(투찰자리) · 조각 하나 수십 KB
   이 파일은 만드는 쪽(굽기)과 읽는 쪽(화면)이 같이 씁니다 — 모양을 한 곳에서만 정합니다.
   셈 자체는 lib/투찰자리.js 그대로(미리확보 · 비슷한개찰 은 row._s 가 있으면 그것을 씀).
   시험: node tools/시험_확보예가자료.mjs
   ══════════════════════════════════════════════════════════════ */
import { breakEvenSj, sjSigma } from './bidmath.js'
import { 시도말 } from './투찰자리.js'

export const 판 = 1
const 줄임 = ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주']
/** 현장 글 첫 마디 → 시도 줄임말(«전라남도 순천시» → 전남 · «전남광주통합특별시 …» → 전남) */
export function 시도of(site) {
  const t = String(site || '').trim().split(/\s+/)[0] || ''
  return 줄임.find((k) => (시도말[k] || [k]).some((w) => t.startsWith(w))) || ''
}
const 수 = (v) => (v == null || v === '' ? null : Number(v))

/** ① 개찰 줄들 → 작은 자료 { v, i: [기관], r: [[날, 기관번호, 시도, 기초, 하한율×1000, 예가 아래×100, 위×100, 예비 수, 뽑는 수, 참가, 순위 수, s0, d1, d2 …]] }
 *  s = 그 업체 금액이 «딱 낙찰하한선» 이 되는 사정률 ×10000(0.0001 단위) (개찰 순위 차례 그대로 · 첫째는 값, 그다음은 앞과의 차이) */
export function 미니만들기(rows) {
  const 기관 = new Map()
  const r = []
  for (const x of rows || []) {
    const base = Number(x && x.base) || 0
    const llr = Number(x && x.llr) || 0
    if (!(base > 0) || !(llr > 0)) continue
    const lo = 수(x.lo) ?? -3, hi = 수(x.hi) ?? 3
    if (!(sjSigma(lo, hi, x.ptot || 15, x.pdrw || 4) > 0)) continue
    const a = Number(x.aval) || 0
    const s = (x.corps || []).map((c) => (c && Number(c[1]) > 0 ? breakEvenSj(base, llr, a, Number(c[1])) : null))
      .filter((v) => v != null && isFinite(v)).map((v) => Math.round(v * 10000))
    if (s.length < 2) continue
    const inst = String(x.inst || '').trim()
    if (!기관.has(inst)) 기관.set(inst, 기관.size)
    const 날 = Number(String(x.dt || '').slice(2, 10).replace(/-/g, '')) || 0
    const 차 = s.map((v, i) => (i ? v - s[i - 1] : v))
    r.push([날, 기관.get(inst), 시도of(x.site), Math.round(base), Math.round(llr * 1000), Math.round(lo * 100), Math.round(hi * 100),
      Number(x.ptot) || 15, Number(x.pdrw) || 4, Number(x.np) || 0, Number(x.nrank) || 0, ...차])
  }
  return { v: 판, i: [...기관.keys()], r }
}

/** ① 작은 자료 → 비슷한개찰 · 미리확보 가 읽는 줄 모양(_s = 사정률들 · 개찰 순위 차례) */
export function 미니풀기(m) {
  if (!m || m.v !== 판 || !Array.isArray(m.r)) return []
  const 기관 = m.i || []
  return m.r.map((x) => {
    const [날, ii, 시도, base, llr, lo, hi, ptot, pdrw, np, nrank, ...차] = x
    const _s = []
    for (let i = 0; i < 차.length; i++) _s.push(i ? _s[i - 1] + 차[i] : 차[i])
    const d = String(날).padStart(6, '0')
    return { dt: `20${d.slice(0, 2)}-${d.slice(2, 4)}-${d.slice(4, 6)}`, inst: 기관[ii] || '', site: 시도 || '', base, llr: llr / 1000,
      aval: 0, lo: lo / 100, hi: hi / 100, ptot, pdrw, np, nrank, _s: _s.map((v) => v / 10000) }
  })
}

/** ② 업체 조각 번호 — 사업자번호 끝 넷째~둘째 자리(000~999). 만드는 쪽 · 읽는 쪽이 같이 씀 */
export const 업체조각 = (biz) => {
  const d = String(biz || '').replace(/[^0-9]/g, '')
  return d.length >= 4 ? Number(d.slice(-4, -1)) : 0
}

/** ② 업체 페이지가 쓰는 것만 남김(투찰자리 결과 → 작게) */
export function 업체요약(t) {
  if (!t) return null
  const 셋 = (v) => (v == null ? null : Math.round(v * 1000) / 1000)
  return {
    잰개찰: t.잰개찰, 몫잰: t.몫잰, 배가운데: t.배가운데, 평균넘은: t.평균넘은, 기대1순위: t.기대1순위, 잰1순위: t.잰1순위,
    몰린구간: t.몰린구간, 몰린몫: 셋(t.몰린몫), 귀사몰린몫: 셋(t.귀사몰린몫),
    /* 🔎 G189 사업자번호로 보기 — 평균 예가 합 · 확보 예가 합 · 1순위(실제 · 평균이라면) · 실격 · 사정률 분포(0.2 칸 20) */
    확보합: t.확보합, 평균합: t.평균합, 실제1순위: t.실제1순위, 평균1순위: t.평균1순위, 실격: t.실격,
    내s가운데: t.내s가운데, 예정s가운데: t.예정s가운데, 분포: t.분포,
    최근: (t.최근 || []).slice(-20).map((x) => ({ no: x.no, dt: String(x.dt || '').slice(0, 10), name: String(x.name || '').slice(0, 26),
      rank: x.rank, n: x.n, 내s: 셋(x.내s), 예정s: 셋(x.예정s), 일순s: 셋(x.일순s), 실격: x.실격 ? 1 : 0, 확보: x.확보, 배: x.배 })),
  }
}
