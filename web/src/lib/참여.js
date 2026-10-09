/**
 * ✅ 참여 판정 (G219 · 2026-10-09) — 마감 전 공고를 «이 회사가 정말 넣을 수 있나» 로 가릅니다.
 *   소장님: 「호남산업개발이 참여 할 수 있는 공고라는 거야」 → 「공고를 보고 정말 참여가 가능한 것만 보여 줘야지. 안그래.」
 *   근거: 그 회사가 실제로 넣어 본 공고의 면허 · 지역 제한(build_json.py load_partner_evidence → 업체 자료 c.pl)
 *   공고: 조달청 lic(면허) · licg(면허 그룹, 같은 그룹 = 모두 · 다른 그룹 = 그중 하나) · rgs(참가가능지역 열쇠) · mthd
 *   모르면 '모름' — 화면은 '됨' 만 띄웁니다. 시험: node tools/시험_참여판정.mjs
 *
 * 🗺 G221 (2026-10-09) 지역은 «참가가능지역»(rgs)으로 — 소장님: 「87건이나 된다고 이상한데 ㅎㅎㅎ」
 *   전에는 rgnb(지역제한 판단기준)가 빈 공고를 «전국» 으로 봤는데, 그 칸은 수의계약에만 와서
 *   «경상북도 지역제한» · «주된 영업소가 경기도» 인 제한경쟁 공고가 넣을 수 있는 공고로 셈해졌습니다(87 → 실제 10건 안팎).
 *   이제: 참가가능지역이 있으면 그것으로(시도 · 시군) · 없으면 일반경쟁만 «전국» · 제한경쟁 · 수의계약 · 지명은 «모름»
 */
const 코드만 = (x) => { const t = String(x || ''); return t.slice(t.lastIndexOf('/') + 1).trim() }

export function 참여근거(c) {
  const pl = c && c.pl
  if (!pl || !Array.isArray(pl.l) || !pl.l.length) return null
  const 하나 = new Set(), 묶음 = new Set()
  for (const x of pl.l) {
    const code = String(Array.isArray(x) ? x[0] : x)
    if (code.includes('_')) 묶음.add(code); else 하나.add(code)
  }
  const 시군 = new Set(Array.isArray(pl.s) ? pl.s.map(String) : [])
  const 지역 = new Set(Array.isArray(pl.r) ? pl.r : [])
  for (const x of 시군) 지역.add(x.split(' ')[0])                    // «전남 여수시» 면 전남 회사
  return { 하나, 묶음, 지역, 시군, 면허: pl.l }
}

/* 🗺 지역 — 조달청 참가가능지역 열쇠 rgs(«전남» · «전남 장흥군» · «?» 못 읽은 조각)로 봅니다.
   없으면: 일반경쟁 = 전국 · 지역제한 판단기준만 있거나 제한경쟁 · 수의계약 · 지명 = 지역 제한이 있는지 모름 */
export function 지역판정(r, g) {
  const rgs = Array.isArray(r.rgs) ? r.rgs.map(String).filter(Boolean) : []
  if (!rgs.length) {
    if (String(r.rgnb || '').trim()) return '모름'                    // 지역 제한인데 어디인지 못 받음
    return /일반/.test(String(r.mthd || '')) ? '됨' : '모름'
  }
  const 앎 = rgs.filter((x) => x !== '?')
  if (!앎.length || !g.지역.size) return '모름'
  const 시도맞음 = 앎.filter((x) => g.지역.has(x.split(' ')[0]))
  if (!시도맞음.length) return rgs.includes('?') ? '모름' : '안됨'      // 다른 시도로 제한된 공고
  if (시도맞음.some((x) => !x.includes(' '))) return '됨'               // 그 시도 전체가 열림
  if (시도맞음.some((x) => g.시군.has(x))) return '됨'                  // 그 시 · 군에 본사 · 지사(낙찰 주소 · 넣어 본 공고)
  return '모름'        // 시 · 군 제한인데 그 회사 시 · 군이 안 맞거나 모름 — 지사가 있을 수 있어 «안 맞음» 으로 단정 안 함
}

/* 면허 그룹 — 조달청 lmtGrpNo: 같은 그룹 = 모두 갖춰야 · 다른 그룹 = 그중 하나 (실측: «전문소방[1] / 일반소방 기계+전기[2,2]»)
   그룹을 모르는 «면허 여럿» 공고는 토목 · 건축 · 토목건축(0001 · 0002 · 0003)끼리일 때만 «그중 하나» 로 봄
   (토목건축이 둘을 다 품는 면허라 그 셋끼리는 대신 쓰는 사이) — 나머지는 모름(띄우지 않음). */
const 대신면허 = new Set(['0001', '0002', '0003'])
export function 면허그룹들(r, lics) {
  const 그룹 = Array.isArray(r.licg) && r.licg.length === lics.length ? r.licg
    : (Array.isArray(r.jnt) && Array.isArray(r.jnt[3]) && r.jnt[3].length === lics.length ? r.jnt[3] : null)
  if (그룹 && 그룹.every((x) => Number(x) > 0)) {
    const m = new Map()
    lics.forEach((c, i) => { const k = String(그룹[i]); if (!m.has(k)) m.set(k, []); m.get(k).push(c) })
    return [...m.values()]
  }
  if (lics.length === 1) return [lics]
  if (lics.every((c) => 대신면허.has(c))) return lics.map((c) => [c])
  return null
}

/** 한 공고 → '됨' · '안됨' · '모름' */
export function 참여판정(r, g) {
  if (!g) return '모름'
  const lics = (Array.isArray(r.lic) ? r.lic : []).map(코드만).filter(Boolean)
  if (!lics.length) return '모름'                                    // 면허가 안 적힌 공고
  const 같은묶음 = g.묶음.has([...lics].sort().join('_'))           // 똑같은 면허 묶음 공고에 넣어 본 적 있음
  const 그룹들 = 면허그룹들(r, lics)
  const 면허 = 같은묶음 || (!!그룹들 && 그룹들.some((gr) => gr.every((x) => g.하나.has(x))))
  if (!면허) {
    if (!그룹들) return '모름'                                       // 그룹을 모르는 면허 여럿 — 단정 못 함
    const 묶음안 = [...g.묶음].some((m) => m.split('_').some((x) => lics.includes(x)))
    return 묶음안 ? '모름' : '안됨'                                  // «그중 하나» 로만 넣어 본 면허면 단정 못 함
  }
  return 지역판정(r, g)
}

