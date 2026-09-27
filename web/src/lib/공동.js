/* 🤝 공동도급 — 2026-09-27, 소장님
 *   「공고를 보고 공동 도급이 가능한지 알 수 있어?」 · 「이것도 표시해야 하지 않을까? … 회사 자료가 있으니 공동으로 입찰할 수도」 ·
 *   「단독은 못하지만 공동으로 가능한 경우」 · 「우리가 시공평가액을 모르잖아」 → 「우선 없어도 할 수 있는 건 다 해 놓자」
 *
 * ■ 재료 — 조달청 공고 목록이 주는 값 그대로 (collect.py joint_extra · jnt_of)
 *     joint  공동수급 방식 원문  «(전자)공동이행» «(없음)공동수급불허» …
 *     jagr   공동수급 협정서 마감 일시      jrgl  공동수급업체도 지역제한("Y")
 *     jdy    지역의무 공동도급("Y")         jdrt  지역의무 지분율(%)
 *     jdrg   의무 지역 원문[]              jdrs  의무 지역 시도 줄임[] (collect.py 가 줄임 — 여기서 다시 줄이지 않습니다)
 *     licg   면허 제한 그룹 번호[] (lic 와 같은 차례)
 *   색인·bidindex·공고 묶음은 이것을 jnt 한 칸으로 줄여 싣습니다:
 *     [방식코드, 의무시도[], 지분%, 면허그룹[], 지역제한시도[], 협정서마감, 공동수급업체지역제한(1/0)]  (공동 불가면 0)
 *   공동재료() 가 두 모양을 하나로 맞춥니다 — 화면은 이것만 부릅니다.
 *
 * ■ 판정 — 자료로 «확실히» 말할 수 있는 것만 합니다
 *   ① 지역의무 공동도급 · 우리 회사 지역이 의무 지역 밖 → «단독 불가 · 그 지역 업체와 공동이면 가능»
 *      우리 지역이 의무 지역 → «외지 업체가 찾는 구성원 자리» (기회)
 *   ② 면허 — 제한 그룹 규칙(같은 그룹 = 모두 보유, 다른 그룹 = 그중 하나)을 **자료로 확인한 뒤에** 켭니다(면허판정켜기).
 *      2026-09-27 에는 그룹 번호를 이제 막 받기 시작해서 꺼 둡니다 — 틀린 «단독 불가» 는 안내하지 않습니다.
 *   ③ 실적 · ④ 시공능력(시평액) · ⑤ 적격심사 점수 — 자료에 없습니다. 판정하지 않고 «공고서 확인» 한 줄만.
 *   ⚠️ 지역제한 공고에서 «공동수급업체도 지역제한»(jrgl=Y)인데 우리 지역이 밖이면 → 공동이어도 참가 못 함.
 *      jrgl 이 없으면 단정하지 않습니다(공고서 확인).
 */

export const 면허판정켜기 = false

/* 🏢 우리 회사 지역 — 이 브라우저에만 (내 면허와 같은 방식). 시도 줄임 한 개. */
const 지역열쇠 = 'kcm.myrgn'
export function load우리지역() {
  try { return localStorage.getItem(지역열쇠) || '' } catch (e) { return '' }
}
export function save우리지역(v) {
  try { if (v) localStorage.setItem(지역열쇠, v); else localStorage.removeItem(지역열쇠) } catch (e) { /* 사생활 창 */ }
}

const 방식이름 = { J: '공동이행', S: '분담이행', M: '혼합방식' }

/** «(전자)공동이행 또는 분담이행» → { 허용, 코드:'JS', 이름:['공동이행','분담이행'], 제출:'전자' } */
export function 방식풀이(joint) {
  const j = String(joint || '')
  if (!j || /불허/.test(j)) return { 허용: false, 코드: '', 이름: [], 제출: '' }
  let 코드 = ''
  if (/공동이행/.test(j)) 코드 += 'J'
  if (/분담이행/.test(j)) 코드 += 'S'
  if (/혼합/.test(j)) 코드 += 'M'
  const m = /^\((전자|수기)\)/.exec(j)
  return { 허용: true, 코드: 코드 || '?', 이름: [...코드].map((c) => 방식이름[c]).filter(Boolean), 제출: m ? m[1] : '' }
}

/** 공고 한 줄(묶음 줄이든 bidindex 줄이든) → 같은 모양의 재료 */
export function 공동재료(r) {
  if (!r) return null
  const j = r.jnt
  if (Array.isArray(j)) {
    const [코드, 의무시도, 지분, 면허그룹, 제한시도, 협정마감, 공동제한] = j
    return {
      허용: true, 코드: 코드 || '?', 이름: [...(코드 || '')].map((c) => 방식이름[c]).filter(Boolean),
      제출: (/^\((전자|수기)\)/.exec(String(r.joint || '')) || [])[1] || '',
      의무시도: 의무시도 || [], 의무원문: r.jdrg || [], 지분: Number(지분) || 0,
      의무: (의무시도 || []).length > 0 || Number(지분) > 0 || r.jdy === 'Y',
      면허그룹: 면허그룹 || [], 제한시도: 제한시도 || [], 협정마감: 협정마감 || r.jagr || '',
      공동도지역제한: 공동제한 === 1 || r.jrgl === 'Y',
    }
  }
  if (j === 0) return { 허용: false, 코드: '', 이름: [], 제출: '', 의무: false, 의무시도: [], 의무원문: [], 지분: 0, 면허그룹: [], 제한시도: [], 협정마감: '', 공동도지역제한: false }
  const p = 방식풀이(r.joint)
  const 의무시도 = r.jdrs || []
  return {
    ...p,
    의무시도, 의무원문: r.jdrg || [], 지분: Number(r.jdrt) || 0,
    의무: r.jdy === 'Y' || 의무시도.length > 0 || (r.jdrg || []).length > 0 || Number(r.jdrt) > 0,
    면허그룹: r.licg || [],
    /* 지역제한 공고의 참가 가능 시도 — 묶음 줄에는 원문(rgn)만 있어서 줄이지 않고 원문으로 둡니다(판정엔 안 씀) */
    제한시도: [],
    협정마감: r.jagr || '',
    공동도지역제한: r.jrgl === 'Y',
  }
}

/* 면허 코드 «철근ㆍ콘크리트공사업/4994» → 4994 · 이름 */
const 코드 = (L) => { const t = String(L || ''); const i = t.lastIndexOf('/'); return i >= 0 ? t.slice(i + 1).trim() : t.trim() }
const 이름 = (L) => { const t = String(L || ''); const i = t.lastIndexOf('/'); return (i >= 0 ? t.slice(0, i) : t).trim() }

/** 면허 그룹 판정 — 같은 그룹은 모두, 다른 그룹은 그중 하나. 면허판정켜기 가 참일 때만 부릅니다.
 *  돌려줌: null(판정 못 함) | { 단독: true } | { 단독: false, 모자람: [이름…] } | { 단독: false, 해당없음: true } */
export function 면허풀이(lic, 그룹, 내면허) {
  const L = (lic || []).map((x) => (typeof x === 'number' ? String(x) : x))
  if (!L.length || !(내면허 || []).length) return null
  if (!그룹 || 그룹.length !== L.length || 그룹.some((g) => !(g > 0))) return null
  const 묶음 = new Map()
  L.forEach((x, i) => { const g = 그룹[i]; if (!묶음.has(g)) 묶음.set(g, []); 묶음.get(g).push(x) })
  const 있나 = (x) => 내면허.includes(코드(x))
  let 가장가까운 = null
  for (const [, xs] of 묶음) {
    const 없음 = xs.filter((x) => !있나(x))
    if (!없음.length) return { 단독: true }
    if (없음.length < xs.length && (!가장가까운 || 없음.length < 가장가까운.length)) 가장가까운 = 없음
  }
  if (!가장가까운) return { 단독: false, 해당없음: true }        // 어느 그룹에도 우리 면허가 없음 — 공동으로도 우리 몫이 없음
  return { 단독: false, 모자람: 가장가까운.map(이름) }
}

const 지역글 = (재, 원문) => {
  const 원 = (원문 || []).filter(Boolean)
  if (원.length) return 원.join('·')
  return (재.의무시도 || []).join('·')
}

/** 판정 — 나 = { 지역: '전남', 면허: ['0001', …] }
 *  돌려줌: { 허용, 방식, 재료, 단독불가:[{k,글}], 기회:[{k,글}], 참가불가:글|null, 확인:[글], 공동이면: bool } */
export function 공동판정(r, 나 = {}) {
  const 재 = 공동재료(r)
  const out = { 허용: !!(재 && 재.허용), 재료: 재, 단독불가: [], 기회: [], 참가불가: null, 확인: [], 공동이면: false }
  if (!재 || !재.허용) return out
  out.방식 = 재.이름.join(' 또는 ') || '공동수급'
  const 내지역 = 나.지역 || ''

  /* 지역제한 — 공동수급업체도 지역제한(jrgl)이고 우리 지역이 밖이면, 공동이어도 참가 못 합니다 */
  if (내지역 && 재.공동도지역제한 && 재.제한시도.length && !재.제한시도.includes(내지역)) {
    out.참가불가 = `지역제한 공고(${재.제한시도.join('·')})이고 공동수급 업체도 그 지역이어야 합니다 — 우리 지역(${내지역})은 공동으로도 참가 못 합니다.`
  }

  /* ① 지역의무 공동도급 */
  if (재.의무) {
    const 곳 = 지역글(재, 재.의무원문)
    const 지분 = 재.지분 > 0 ? ` · 지분 ${재.지분}% 이상` : ''
    if (!내지역) {
      out.확인.push(`지역의무 공동도급(${곳}${지분}) — 🏢 우리 회사 지역을 정하시면 단독으로 되는지 알려 드립니다.`)
    } else if (재.의무시도.length && !재.의무시도.includes(내지역)) {
      out.단독불가.push({ k: '지역', 글: `${곳} 업체와 공동으로만 넣을 수 있습니다${지분}. 우리 지역(${내지역})은 단독으로 못 넣습니다.` })
    } else if (재.의무시도.includes(내지역)) {
      const 시군 = (재.의무원문 || []).some((x) => String(x).trim().split(/\s+/).length >= 2)
      out.기회.push({ k: '지역', 글: `우리 지역(${내지역})이 의무 지역입니다 — 외지 업체가 ${곳} 업체를 구성원으로 찾는 공고입니다${지분}.` })
      if (시군) out.확인.push(`의무 지역이 ${곳} 입니다 — 본사가 그 시·군이 아니면 그곳 업체와 공동이어야 합니다(공고서 확인).`)
    } else {
      out.확인.push(`지역의무 공동도급(${곳}${지분}) — 의무 지역을 시도로 가리지 못했습니다. 공고서를 확인하세요.`)
    }
  }

  /* ② 면허 — 규칙을 자료로 확인한 뒤에 켭니다 */
  if (면허판정켜기 && /[SM]/.test(재.코드) && (나.면허 || []).length) {
    const lic = r.lic || []
    const m = 면허풀이(lic, 재.면허그룹, 나.면허)
    if (m && m.단독 === false && m.모자람) {
      out.단독불가.push({ k: '면허', 글: `면허 ${m.모자람.join('·')} 이(가) 없어 단독으로는 못 넣습니다 — 분담이행으로 그 면허 업체와 나눠 넣을 수 있습니다.` })
    }
  }

  out.공동이면 = !out.참가불가 && out.단독불가.length > 0
  return out
}

/** 협정서 마감까지 — «D-2» 같은 짧은 글. 지났으면 «마감됨». 모르면 '' */
export function 협정남은(s, 지금 = new Date()) {
  const d = String(s || '').replace(/[^0-9]/g, '')
  if (d.length < 8) return ''
  const t = new Date(+d.slice(0, 4), +d.slice(4, 6) - 1, +d.slice(6, 8), +(d.slice(8, 10) || 23), +(d.slice(10, 12) || 59))
  const 남 = t - 지금
  if (남 < 0) return '마감됨'
  const 일 = Math.floor(남 / 86400000)
  if (일 >= 1) return `D-${일}`
  return `${Math.max(1, Math.round(남 / 3600000))}시간 남음`
}

/** 사랑방 «구성원 구하기» 글 초안 — 금액 이야기는 넣지 않게 안내까지 */
export function 구성원글(r, 판) {
  const 재 = (판 && 판.재료) || 공동재료(r) || {}
  const 줄 = [
    `공고: ${r.name || ''}`,
    `공고번호: ${r.no || ''}`,
    `발주기관: ${r.inst || ''}`,
    `공동수급 방식: ${(재.이름 || []).join(' 또는 ') || '공고서 확인'}`,
  ]
  if (재.의무) 줄.push(`지역의무 공동도급: ${지역글(재, 재.의무원문)}${재.지분 > 0 ? ` · 지분 ${재.지분}% 이상` : ''}`)
  if (재.협정마감) 줄.push(`협정서 마감: ${재.협정마감}`)
  줄.push('', '구하는 구성원: (면허 · 지역 · 지분 — 예: 전남 소재 토목공사업, 지분 49%)', '우리 회사: (면허 · 지역 · 맡을 지분)', '연락: (이 글의 답글로 — 전화번호는 적지 마세요)')
  줄.push('', '※ 투찰 금액은 서로 이야기하지 않습니다 — 금액을 맞추면 입찰담합입니다.')
  return { t: `[구성원 구함] ${String(r.name || '').slice(0, 50)}`, b: 줄.join('\n') }
}

/* ══════════════════════════════════════════════════════════════
   👥 같이 넣을 수 있는 회사 — 2026-09-27, 소장님 「공동입찰이 가능한 회사를 찾아주는 것 까지 해보자 …
      두 회사가 공동입찰 가능하다 … 회사가 많으면 그 회사들을 다 보여주는 거지」
   재료: data/partners/{면허코드 또는 묶음}.json — collect.py export_partners 가 «실제 투찰 기록» 으로 만듭니다
     줄 = [사업자번호, 이름, 지역들(쉼표), 최근 참가, 최근 1순위, 마지막 날 YYYYMMDD]
   ══════════════════════════════════════════════════════════════ */

/** 공고 면허 → 받을 파일 이름들. 면허마다 하나 + 여럿이면 «그 묶음» 하나(0001_4989_4994) */
export function 면허키들(lic) {
  const cs = []
  for (const L of lic || []) { const c = 코드(L); if (/^[0-9A-Za-z]{1,12}$/.test(c) && !cs.includes(c)) cs.push(c) }
  const out = [...cs]
  if (cs.length > 1 && cs.length <= 6) out.push([...cs].sort().join('_'))
  return out
}

/** 여러 파일의 줄을 사업자번호로 합칩니다(참가·1순위·날짜는 큰 쪽, 지역은 합침) */
export function 회사합치기(파일들) {
  const m = new Map()
  for (const d of 파일들 || []) {
    for (const x of (d && d.r) || []) {
      const [b, n, s, p, w, day] = x
      const 전 = m.get(b)
      if (!전) { m.set(b, { b, n, s: s ? String(s).split(',').filter(Boolean) : [], p: p || 0, w: w || 0, d: day || '' }); continue }
      for (const t of (s ? String(s).split(',') : [])) if (t && !전.s.includes(t)) 전.s.push(t)
      전.p = Math.max(전.p, p || 0); 전.w = Math.max(전.w, w || 0); if ((day || '') > 전.d) 전.d = day
      if (n) 전.n = n
    }
  }
  return [...m.values()].sort((a, b) => (b.d || '').localeCompare(a.d || '') || b.p - a.p)
}

/** 공고 성격에 따라 나눕니다.
 *  의무 — { 종류:'의무', 현지:[], 외지:[] }  (현지 = 의무 지역 근거가 있는 회사, 외지 = 그 밖 · 지역 모름 포함)
 *  제한 — { 종류:'제한', 가능:[], 모름수 }  (지역제한 공고: 그 지역 근거가 있는 회사만)
 *  면허 — { 종류:'면허', 전부:[] } */
export function 회사나누기(회사, 판) {
  const 재 = (판 && 판.재료) || {}
  const 겹침 = (a, b) => (a || []).some((x) => (b || []).includes(x))
  if (재.의무 && (재.의무시도 || []).length) {
    const 현지 = [], 외지 = []
    for (const c of 회사) (겹침(c.s, 재.의무시도) ? 현지 : 외지).push(c)
    return { 종류: '의무', 현지, 외지 }
  }
  if ((재.제한시도 || []).length) {
    const 가능 = 회사.filter((c) => 겹침(c.s, 재.제한시도))
    return { 종류: '제한', 가능, 모름수: 회사.filter((c) => !c.s.length).length }
  }
  return { 종류: '면허', 전부: 회사 }
}
