/**
 * 📮 매달 신고 정리 — 노무비 계산기(또는 현장 투입비)의 한 달 출역으로 «어디에 · 무엇을 · 언제까지 · 어떤 숫자» (G116 · 2026-10-02)
 *
 * 소장님: 「매달 신고 정리, 퇴직공제 집계, 고용·산재 보험료 계산기 … 현재 사이트에 있는 것과 연계해서 사용 가능하게 해줘」
 *
 * ■ 자료는 따로 적지 않습니다 — 👷 노무비 계산기(lib/nomubi.js, localStorage 'kcm_nomubi1' · 🔗 이어 쓰기 'nm')를 그대로 읽고,
 *   🏗 현장 투입비에서 «신고 정리로» 를 누르면 그 현장 출역을 넘겨받아 같은 셈을 합니다(sessionStorage 'kcm_singo_from').
 * ■ 공제(소득세 · 지방소득세 · 4대보험)는 노무비 계산기와 같은 셈(lib/gongje.js · lib/ilyong4.js)을 씁니다 — 손으로 고친 공제(o)도 그대로.
 * ■ 기한(원문 확인 2026-10-01~02 · 국가법령정보센터)
 *   · 원천세(일용근로)       지급한 달의 다음 달 10일 — 소득세법 제128조① (반기납부 승인 사업자는 반기 마지막 달의 다음 달 10일 · 같은 조②)
 *   · 개인지방소득세(특별징수) 같은 날 — 지방세법 제103조의13② (반기도 같음)
 *   · 일용근로소득 지급명세서 지급한 달의 다음 달 말일 — 소득세법 제164조① 단서
 *                           (근로내용 확인신고서의 국세청 칸을 채워 내면 낸 것으로 봄 — 소득세법 시행령 제213조④, lib/nomubi 화면과 같은 근거)
 *   · 근로내용 확인신고      일한 달의 다음 달 15일 — 고용보험법 시행령 제7조①
 *   · 퇴직공제 근로일수 신고 · 부금 납부  일한 달의 다음 달 15일 — 건설근로자법 시행규칙 제15조③
 *   · 국민연금 취득 · 상실   다음 달 15일(국민연금법 시행규칙 제6조①) / 건강보험 14일 이내(국민건강보험법 제8조② · 제10조②) — lib/ilyong4.js 판단
 *   · 쉬는 날이면 다음 날 — 국세기본법 제5조① · 민법 제161조 (lib/해마다.js 공휴일표)
 */
import { 공제셈, 공제합치기, 공제칸 } from './gongje.js'
import { 판단, 출역모으기, 달규칙 } from './ilyong4.js'
import { 기한미루기, 달더하기, 달말일, 날더하기 } from './해마다.js'

export const 넘김열쇠 = 'kcm_singo_from'
const 두자 = (n) => String(n).padStart(2, '0')
export const 달날수 = (ym) => new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)), 0).getDate()
export const 달글 = (ym) => `${ym.slice(0, 4)}년 ${Number(ym.slice(5, 7))}월`
export const 원 = (n) => Math.round(n || 0).toLocaleString('ko-KR')

/** 사람의 그 달 일당 — 투입비는 달마다 일당(a.w)이 있고, 노무비 계산기는 명단 일당(p.w) */
const 일당 = (p, a) => Math.max(0, Number(a && a.w != null && a.w !== '' ? a.w : p.w) || 0)

/**
 * 그 달 사람마다 — 노무비 계산기 달셈(lib/nomubi.js)과 같은 셈 (투입비 자료의 달별 일당도 받음)
 * @returns {{ym, 줄: Array, 합계}}
 */
export function 달줄(st, ym) {
  const 날수 = 달날수(ym)
  const 줄 = []
  for (const p of st.P || []) {
    const a = (((st.A || {})[ym] || {})[p.id]) || {}
    const w = 일당(p, a)
    const d = a.d || {}
    const 공수 = Array.from({ length: 날수 }, (_, i) => Number(d[두자(i + 1)]) || 0)
    const 날돈 = 공수.filter((g) => g > 0).map((g) => Math.round(g * w))
    if (!날돈.length) continue
    const 모음 = 출역모으기(st.A, p.id, (m, x) => 일당(p, x))
    const 판 = 판단(모음, { 생일: p.b || '' })
    const 자동 = 공제셈(ym, 날돈, p.nx || '', { ap: a.ap, ex: a.ex }, 달규칙(판, ym))
    const 최종 = 공제합치기(자동, a.o)
    줄.push({ id: p.id, p, w, 공수, 공수합: 공수.reduce((s, g) => s + g, 0), 일수: 자동.일수, 보수: 자동.보수, 자동, 최종, 대상: 자동.대상, 판,
      날들: 공수.map((g, i) => (g > 0 ? i + 1 : 0)).filter(Boolean) })
  }
  const 합계 = { 인원: 줄.length, 일수: 0, 보수: 0, 합: 0, 차인: 0, ...Object.fromEntries(공제칸.map((c) => [c.k, 0])), 세금인원: 0, 대상수: { P: 0, H: 0, E: 0 } }
  for (const r of 줄) {
    합계.일수 += r.일수; 합계.보수 += r.보수; 합계.합 += r.최종.합; 합계.차인 += r.최종.차인
    for (const c of 공제칸) 합계[c.k] += r.최종[c.k]
    if (r.최종.it > 0) 합계.세금인원++
    for (const c of ['P', 'H', 'E']) if (r.대상[c].대상) 합계.대상수[c]++
  }
  return { ym, 날수, 줄, 합계 }
}

/** 출역이 있는 달들(오래된 것부터) */
export function 일한달들(st) {
  const out = []
  for (const [ym, 사람들] of Object.entries(st.A || {})) {
    if (!/^\d{4}-\d{2}$/.test(ym)) continue
    if (Object.values(사람들 || {}).some((a) => a && a.d && Object.values(a.d).some((g) => Number(g) > 0))) out.push(ym)
  }
  return out.sort()
}

/** 반기납부면 반기 마지막 달의 다음 달 10일 */
function 원천기한(지급월, 반기) {
  if (!반기) return `${달더하기(지급월, 1)}-10`
  const y = Number(지급월.slice(0, 4)), m = Number(지급월.slice(5, 7))
  return m <= 6 ? `${y}-07-10` : `${y + 1}-01-10`
}

/**
 * 이 달 할 일 — [{기관, 무엇, 기한, 원래기한, 밀림, 숫자:[[이름, 값]], 어디서, 근거, 키}]
 * @param {object} N  달줄() 결과
 * @param {{지급월?:string, 반기?:boolean, 퇴직?:{대상:boolean, 일수:number, 부금:number, 인원:number}}} 옵션
 */
export function 할일목록(N, 옵션 = {}) {
  const ym = N.ym
  const 지급월 = 옵션.지급월 || 달더하기(ym, 1)
  const out = []
  const 더 = (x, 기한) => { const k = 기한미루기(기한); out.push({ ...x, 기한: k.날, 원래기한: 기한, 밀림: k.밀림, 공휴일모름: k.모름 }) }
  const H = N.합계
  더({ 키: 'wonchun', 기관: '세무서 (홈택스)', 무엇: `원천세 신고 · 납부 — 일용근로소득(${달글(ym)} 귀속 · ${달글(지급월)} 지급)`,
    숫자: [['인원', `${H.인원}명`], ['총지급액', 원(H.보수)], ['소득세', 원(H.it)]],
    어디서: '홈택스 › 신고/납부 › 원천세 › 원천징수이행상황신고서 «일용근로소득(A03)» 줄', 근거: 옵션.반기 ? '소득세법 제128조② (반기납부 승인)' : '소득세법 제128조① (지급한 달의 다음 달 10일)' },
  원천기한(지급월, 옵션.반기))
  더({ 키: 'jibang', 기관: '시 · 군 · 구 (위택스)', 무엇: '개인지방소득세(특별징수) 신고 · 납부 — 소득세의 10%',
    숫자: [['인원', `${H.인원}명`], ['과세표준(소득세)', 원(H.it)], ['지방소득세', 원(H.lt)]],
    어디서: '위택스 › 신고하기 › 지방소득세 › 특별징수 (홈택스 원천세 신고 뒤 «위택스 바로 신고» 로 이어서)', 근거: '지방세법 제103조의13②' },
  원천기한(지급월, 옵션.반기))
  더({ 키: 'geunro', 기관: '근로복지공단 (고용·산재 토탈서비스)', 무엇: `근로내용 확인신고 — ${달글(ym)}에 일한 일용근로자`,
    숫자: [['인원', `${H.인원}명`], ['근로일수 합', `${H.일수}일`], ['보수총액', 원(H.보수)], ['국세청 칸 소득세 · 지방소득세', `${원(H.it)} · ${원(H.lt)}`]],
    어디서: '고용·산재보험 토탈서비스 › 신고 › 근로내용 확인신고 (국세청 칸까지 채우면 지급명세서를 따로 안 냄)', 근거: '고용보험법 시행령 제7조① · 소득세법 시행령 제213조④' },
  `${달더하기(ym, 1)}-15`)
  더({ 키: 'myeongse', 기관: '세무서 (홈택스)', 무엇: '일용근로소득 지급명세서 — 근로내용 확인신고에 국세청 칸을 채웠으면 안 내도 됨',
    숫자: [['인원', `${H.인원}명`], ['과세소득', 원(H.보수)], ['소득세', 원(H.it)]],
    어디서: '홈택스 › 지급명세서 · 자료제출 › 일용근로소득 지급명세서', 근거: '소득세법 제164조① 단서 (지급한 달의 다음 달 말일)' },
  달말일(달더하기(지급월, 1)))
  if (옵션.퇴직 && 옵션.퇴직.대상)
    더({ 키: 'toejik', 기관: '건설근로자공제회 (EDI)', 무엇: '퇴직공제 근로일수 신고 · 공제부금 납부',
      숫자: [['피공제자', `${옵션.퇴직.인원}명`], ['근로일수', `${옵션.퇴직.일수}일`], ['공제부금', 원(옵션.퇴직.부금)]],
      어디서: '건설근로자공제회 EDI › 근로일수 신고 (전자카드 현장은 전자카드 시스템으로)', 근거: '건설근로자법 제13조① · 시행규칙 제15조③' },
    `${달더하기(ym, 1)}-15`)
  /* 4대보험 취득 · 상실 — 이 달에 생긴 것만 (판단은 이 브라우저에 적은 모든 달을 봄) */
  for (const r of N.줄) {
    const 이름 = r.p.n || '(이름)'
    for (const g of r.판.연금.구간) {
      if (g.취득.slice(0, 7) === ym) 더({ 키: 'np+' + r.id, 기관: '국민연금공단 (EDI)', 무엇: `${이름} 국민연금 자격취득 신고 — 취득일 ${g.취득}${g.근거 === '회사 합산' ? ' (회사 합산)' : ''}`, 숫자: [], 어디서: '4대사회보험 정보연계센터 · 국민연금 EDI', 근거: '국민연금법 시행규칙 제6조① (다음 달 15일)' }, `${달더하기(ym, 1)}-15`)
      if (g.상실 && g.상실.slice(0, 7) === ym) 더({ 키: 'np-' + r.id, 기관: '국민연금공단 (EDI)', 무엇: `${이름} 국민연금 자격상실 신고 — 상실일 ${g.상실}`, 숫자: [], 어디서: '4대사회보험 정보연계센터 · 국민연금 EDI', 근거: '국민연금법 시행규칙 제6조①' }, `${달더하기(ym, 1)}-15`)
    }
    for (const g of r.판.건강.구간) {
      if (g.취득.slice(0, 7) === ym) 더({ 키: 'hi+' + r.id, 기관: '국민건강보험공단 (EDI)', 무엇: `${이름} 건강보험 자격취득 신고 — 취득일 ${g.취득} (건설현장 일괄경정은 다음 달 5일 마감)`, 숫자: [], 어디서: '4대사회보험 정보연계센터 · 건강보험 EDI', 근거: '국민건강보험법 제8조② (14일 이내)' }, 날더하기(g.취득, 13))
      if (g.상실 && g.상실.slice(0, 7) === ym) 더({ 키: 'hi-' + r.id, 기관: '국민건강보험공단 (EDI)', 무엇: `${이름} 건강보험 자격상실 신고 — 상실일 ${g.상실}`, 숫자: [], 어디서: '4대사회보험 정보연계센터 · 건강보험 EDI', 근거: '국민건강보험법 제10조② (14일 이내)' }, 날더하기(g.상실, 13))
    }
  }
  return out.sort((a, b) => (a.기한 < b.기한 ? -1 : a.기한 > b.기한 ? 1 : 0))
}

/** 🏗 현장 투입비 → 이 화면들 (sessionStorage) — 사람 {id:{n,j,w,nx}} · 출역 {ym:{id:{w,d,o,ap,ex}}} */
export function 투입비넘김(이름, people, att, 코드 = '') {
  const P = Object.entries(people || {}).filter(([, p]) => p).map(([id, p]) => ({ id, n: p.n || '', j: p.j || '', b: '', w: Number(p.w) || 0, nx: p.nx || '' }))
  const A = {}
  for (const [ym, 사람들] of Object.entries(att || {})) {
    A[ym] = {}
    for (const [id, a] of Object.entries(사람들 || {})) if (a && a.d) A[ym][id] = { w: Number(a.w) || 0, d: { ...a.d }, ...(a.o ? { o: { ...a.o } } : {}), ...(a.ap ? { ap: a.ap } : {}), ...(a.ex ? { ex: a.ex } : {}) }
  }
  for (const id of new Set(Object.values(A).flatMap((m) => Object.keys(m)))) if (!P.some((p) => p.id === id)) P.push({ id, n: '(명부에서 지운 사람)', j: '', b: '', w: 0, nx: '' })
  return { 출처: 'tp', 코드, co: '', site: 이름 || '', P, A, at: Date.now() }
}
export function 넘김읽기() {
  try {
    const s = JSON.parse(sessionStorage.getItem(넘김열쇠) || 'null')
    if (s && s.출처 === 'tp' && Array.isArray(s.P) && s.A) return s
  } catch (e) { /* 막힘 */ }
  return null
}
export function 넘김지우기() { try { sessionStorage.removeItem(넘김열쇠) } catch (e) { /* */ } }
export function 넘김쓰기(v) { try { sessionStorage.setItem(넘김열쇠, JSON.stringify(v)); return true } catch (e) { return false } }

/* 💾 신고 정리 설정 · 기록 — 노무비 자료 안 st.sg (🔗 이어 쓰기 코드로 같이 감) · 투입비 현장은 이 브라우저
 *   {half 반기납부, pm {귀속달: 지급달}, done {귀속달: {키: 'YYYY-MM-DD' 한 날}}, from 처음 ✓ 한 귀속달 — 이 달부터 «밀린 신고» 를 셈}
 *   소장님 「일의 연속성도 고려 해 주고..」 → 한 것은 남기고, 다음 달에 열면 지난달 못 한 것을 맨 위에 */
export const 빈신고설정 = () => ({ half: false, pm: {}, done: {}, from: '' })
export function 신고설정정리(v) {
  const s = { ...빈신고설정(), ...(v || {}) }
  s.half = !!s.half
  for (const k of ['pm', 'done']) s[k] = s[k] && typeof s[k] === 'object' ? s[k] : {}
  s.from = /^\d{4}-\d{2}$/.test(String(s.from || '')) ? s.from : ''
  return s
}
export const 했음 = (설정, ym, 키) => ((설정.done || {})[ym] || {})[키] || ''
/** ✓ 했음 / 되돌리기 — 새 설정 */
export function 했음바꿈(설정, ym, 키, 날) {
  const s = 신고설정정리(설정)
  const 달 = { ...(s.done[ym] || {}) }
  if (날) 달[키] = 날; else delete 달[키]
  const done = { ...s.done, [ym]: 달 }
  if (!Object.keys(달).length) delete done[ym]
  return { ...s, done, from: s.from && s.from <= ym ? s.from : (날 ? ym : s.from) }
}
/**
 * 지난 달들에서 아직 안 한 것 — from(처음 ✓ 한 달)부터 고른 달 앞까지 · 기한이 지났거나 2주 안
 * @param {(ym:string)=>object|null} 퇴직Of  그 달 퇴직공제 {대상, 인원, 일수, 부금} (가입 현장이면)
 */
export function 밀린목록(자료, 설정, 고른ym, 오늘, 퇴직Of = null) {
  const s = 신고설정정리(설정)
  if (!s.from) return []
  const 끝 = 날더하기(오늘, 14)
  const out = []
  for (const m of 일한달들(자료)) {
    if (m < s.from || m >= 고른ym) continue
    const N = 달줄(자료, m)
    const 목록 = 할일목록(N, { 지급월: s.pm[m] || 달더하기(m, 1), 반기: s.half, 퇴직: 퇴직Of ? 퇴직Of(m) : null })
    for (const x of 목록) if (x.기한 <= 끝 && !했음(s, m, x.키)) out.push({ ...x, ym: m })
  }
  return out.sort((a, b) => (a.기한 < b.기한 ? -1 : a.기한 > b.기한 ? 1 : 0))
}
