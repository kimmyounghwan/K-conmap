/**
 * 🏔 토적컨맵 — 📐 횡단면도(DXF)에서 측점별 단면적 바로 읽기 (G572 · 2026-11-06)
 *
 * 소장님(11-06 23:3x): 「토적컨맵이 이렇게 간단히 완성이라고???」 → 아직 없는 것 ① «횡단면도(DXF)에서 단면적 바로 읽기» 부터.
 *
 * ■ 읽기는 «도면 3D 보기» 가 쓰는 횡단 읽개를 그대로 씁니다(lib/횡단3d.js 단면찾기 · 횡단묶기 · 횡단세우기 — 소장님 현장 도면으로 맞춘 것).
 *   단면마다 두 가지 값:
 *     📋 표 값  — 측점 표에 설계자가 적은 면적(터파기 · 되메우기 · 흙쌓기 · 흙깎기 / 도로 토공 표는 칸마다 토사 · 리핑암 · 발파암 … 세부까지)
 *     📏 선 값  — 지반선 · 계획선으로 둘러싸인 곳을 잰 면적(터파기 · 되메우기 · 성토 — 잘게 나눈 칸으로 잼 · 어림)
 *   설계서와 맞춰야 하면 표 값이 먼저입니다(설계자가 셈한 값). 표 값이 없는 도면만 선 값.
 * ■ 노선이 여럿이면(열 위 제목) 노선마다 따로. 같은 측점이 두 벌이면 하나만(3D 보기와 같음).
 * ■ 시험: node tools/시험_토적횡단.mjs (가상 횡단면 · 3D 보기 예시 도면)
 */
import { parseDxf, decodeBytes, sniff, F64, U8 } from './dxf3d.js'
import { 단면찾기, 횡단묶기, 횡단세우기 } from './횡단3d.js'
import { 도곽찾기3d, 박스제목들, 도면종류, 네모로나누기, 도면합치기, 묶음이름 } from './도곽3d.js'
import { 종단표읽기 } from './노선3d.js'
import { 끝수, 측점풀기 } from './토적.js'

const 새버킷 = () => ({ pos: new F64(), col: new U8(), pts: new F64(64), pcol: new U8(64) })
const 고름 = (o, ks) => (o ? Object.fromEntries(ks.filter((k) => Number.isFinite(o[k])).map((k) => [k, o[k]])) : null)

/** DXF 바이트 → { 노선: [{ 이름, 단면: [{측, 글, 풀이, 지반고, 계획고, 선: {터파기, 되메우기, 구조물, 성토} | null, 표: {…} | null, 세부: {절토: {토사 …}, 성토: {…}} | null, 이상}], 빠짐 }], 까닭 } */
export function 횡단노선읽기(buf, 파일이름 = '도면', 알려 = null) {
  const kind = sniff(buf)
  if (kind !== 'dxf') return { 노선: [], 까닭: kind }
  const text = decodeBytes(buf)
  if (!/(^|\n)\s*0\s*\r?\n\s*SECTION/.test(text.slice(0, 20000))) return { 노선: [], 까닭: 'notdxf' }
  const raw = parseDxf(text, 알려, { raw: true })
  return 횡단노선(raw, 파일이름)
}

/** parseDxf(…, {raw:true}) 결과 → 노선들
 *  도면 3D 보기와 같은 차례: 판(도곽)을 찾아 판 이름이 «횡단» 인 판만, 같은 이름(«… 횡단면도(3/11)» 의 «(3/11)» 뺀 것)끼리 모아 한 노선.
 *  판이 없거나 «횡단» 판이 없으면 파일 통째로. 한 묶음 안에 열 위 제목(Ramp-B …)이 여럿이면 그 제목마다 따로. */
export function 횡단노선(raw, 파일이름 = '도면') {
  const 무리 = []
  const 종단글 = new Map()                 /* 노선 열쇠 → 종평 · 종단 판 글자(누가거리 표) */
  let fr = []
  try { fr = 도곽찾기3d(raw, null) } catch (e) { fr = [] }
  if (fr.length) {
    let 나 = null, 제목들 = []
    try { 나 = 네모로나누기(raw, fr); 제목들 = 박스제목들(raw.texts, fr) } catch (e) { 나 = null }
    if (나) {
      const m = new Map()
      fr.forEach((r, i) => {
        const 제 = 제목들[i] || ''
        const 종 = 도면종류(제, fr.length === 1 ? 파일이름 : '')
        if (종 === '종평' || 종 === '종단') { const k = 노선열쇠(제); if (k) 종단글.set(k, (종단글.get(k) || []).concat([나.조각[i].texts || []])); return }
        if (종 !== '횡단') return
        const 키 = 묶음이름(제) || 제 || 파일이름
        let a = m.get(키); if (!a) { a = []; m.set(키, a) } a.push(나.조각[i])
      })
      for (const [키, a] of m) 무리.push({ 이름: 키, raw: a.length === 1 ? a[0] : 도면합치기(a) })
    }
  }
  if (!무리.length) 무리.push({ 이름: 파일이름, raw })
  const 노선 = []
  for (const g of 무리) {
    const 이것 = 한무리(g.raw, g.이름)
    /* 📏 같은 노선의 종평면도 «누가거리» 표 — 측점 간격을 짐작하지 않고 도면 값으로 */
    /* 판마다 따로 읽어 줄을 이음(«종평면도(1/2) · (2/2)» 글자를 한데 섞으면 표를 못 읽음) */
    const 판글 = 종단글.get(노선열쇠(g.이름)) || []
    const 종줄 = []
    for (const 글 of 판글) { let z = null; try { z = 종단표읽기(글) } catch (e) { z = null } if (z && z.줄) 종줄.push(...z.줄) }
    종줄.sort((a, b) => a.m - b.m)
    if (종줄.length >= 2) { const 간 = 누가간격(종줄); for (const L of 이것) L.종단 = { 간격: 간, 점: 종줄.map((z) => ({ 글: z.글, m: z.m })) } }
    노선.push(...이것)
  }
  return { 노선 }
}

/** 노선 열쇠 — 띄어쓰기 · «종평면도 · 횡단면도 …» · «(1/11)» 을 뺀 이름(종평면도와 횡단면도를 잇기) */
export function 노선열쇠(제) {
  return 묶음이름(제).replace(/\s+/g, '').replace(/(종평면도|종단면도|횡단면도|평면도|종평|종단|횡단|단면도)$/g, '').replace(/(종평면도|종단면도|횡단면도)/g, '')
}
/** 누가거리 표 → 측점 간격(«No.n» 줄의 누가거리 ÷ n 가 가장 많은 값) */
export function 누가간격(줄) {
  const 셈 = new Map()
  for (const z of 줄 || []) {
    const p = 측점풀기(z.글, 1, '번호')
    if (!p || !(p.번 > 0) || p.더 !== 0 || !Number.isFinite(z.m)) continue
    const 첫 = (줄 || []).find((q) => { const a = 측점풀기(q.글, 1, '번호'); return a && a.번 === 0 && a.더 === 0 })
    const 영 = 첫 && Number.isFinite(첫.m) ? 첫.m : 0
    const g = 끝수((z.m - 영) / p.번, 3)
    if (g > 0) 셈.set(g, (셈.get(g) || 0) + 1)
  }
  let 간 = null, 최 = 0
  for (const [g, c] of 셈) if (c > 최) { 최 = c; 간 = g }
  return 간
}

function 한무리(raw, 무리이름) {
  let 묶음 = null
  try { 묶음 = 횡단묶기(단면찾기(raw)) } catch (e) { 묶음 = null }
  const 노선 = []
  const 세움 = (찾은, 노선글) => {
    let r = null
    try { r = 횡단세우기(raw, 새버킷, 0, '', 찾은) } catch (e) { r = null }
    if (!r || !r.단면 || !r.단면.length) return
    let 원 = 찾은
    if (!원) { try { 원 = 단면찾기(raw) } catch (e) { 원 = [] } }
    const 세부 = new Map((원 || []).map((s) => [s.측, s.표세부 || null]))
    노선.push({
      이름: 노선글 ? 무리이름 + ' · ' + 노선글 : 무리이름,
      단면: r.단면.map((s) => ({
        측: s.측, 글: s.글, 풀이: s.풀이 || null, 지반고: s.지반고, 계획고: s.계획고,
        선: s.면적 ? 고름(s.면적, ['터파기', '되메우기', '구조물', '성토']) : null,
        이상: s.면적 && s.면적.이상 ? s.면적.이상 : '',
        표: s.표면적 ? 고름(s.표면적, ['절토', '터파기', '성토', '되메우기']) : null,
        세부: 세부.get(s.측) || null,
      })).sort((a, b) => a.측 - b.측),
      빠짐: r.빠짐 || [],
    })
  }
  if (!묶음 || !묶음.some((m) => m.노선글)) 세움(묶음 && 묶음.length === 1 ? 묶음[0].단면 : null, '')
  else for (const m of 묶음) 세움(m.단면, m.노선글)
  return 노선
}

/** 노선 하나의 값 덩이가 무엇을 가졌나 — 표 값이 있는 단면 수 · 선 값이 있는 단면 수 · 세부(토질) 이름들 */
export function 노선살피기(L) {
  const n = L.단면.length
  const 표수 = L.단면.filter((s) => s.표 && Object.values(s.표).some((v) => v > 0)).length
  const 선수 = L.단면.filter((s) => s.선 && Object.values(s.선).some((v) => v > 0)).length
  const 세부이름 = { 절토: new Set(), 성토: new Set() }
  for (const s of L.단면) for (const k of ['절토', '성토']) for (const [이름, v] of Object.entries((s.세부 && s.세부[k]) || {})) if (v > 0) 세부이름[k].add(이름)
  return { n, 표수, 선수, 세부: { 절토: [...세부이름.절토], 성토: [...세부이름.성토] }, 시작: n ? L.단면[0].측 : 0, 끝: n ? L.단면[n - 1].측 : 0 }
}

/**
 * 노선 → 토적컨맵 칸 · 줄
 * @param 출처 '표' (설계자가 적은 표 값 — 도로 토공 표면 토질 세부까지) | '선' (선으로 잰 값)
 * @param 이전칸 같은 이름 칸의 C · «성토에 씀» 을 이어 받음
 */
export function 횡단토적(L, 출처 = '표', 이전칸 = []) {
  const 알림 = []
  const 열 = []                       /* { id, 이름, 종, 값: (s) => number } */
  const 더열 = (이름, 종, 값) => { if (L.단면.some((s) => (값(s) || 0) > 0)) 열.push({ id: 'k' + 열.length, 이름, 종, 값 }) }
  if (출처 === '표') {
    const 살 = 노선살피기(L)
    if (살.세부.절토.length) for (const t of 살.세부.절토) 더열(t, '절', (s) => (s.세부 && s.세부.절토 && s.세부.절토[t]) || 0)
    else 더열('절토', '절', (s) => (s.표 && s.표.절토) || 0)
    더열('터파기', '절', (s) => (s.표 && s.표.터파기) || 0)
    더열('성토', '성', (s) => (s.표 && s.표.성토) || 0)
    더열('되메우기', '성', (s) => (s.표 && s.표.되메우기) || 0)
    const 없는 = L.단면.filter((s) => !s.표).map((s) => s.글)
    if (없는.length) 알림.push(`표 값이 없는 측점 ${없는.length}곳(${없는.slice(0, 3).join(' · ')}${없는.length > 3 ? ' …' : ''}) — 0 으로 넣었습니다. 도면을 확인해 주십시오`)
    if (살.세부.절토.length) 알림.push(`흙깎기를 토질별(${살.세부.절토.join(' · ')})로 나눠 넣었습니다 — 토질마다 C 를 넣어 주십시오`)
  } else {
    더열('터파기', '절', (s) => (s.선 && s.선.터파기) || 0)
    더열('성토', '성', (s) => (s.선 && s.선.성토) || 0)
    더열('되메우기', '성', (s) => (s.선 && s.선.되메우기) || 0)
    const 못잰 = L.단면.filter((s) => !s.선).map((s) => s.글)
    if (못잰.length) 알림.push(`선으로 면적을 못 잰 측점 ${못잰.length}곳(${못잰.slice(0, 3).join(' · ')}${못잰.length > 3 ? ' …' : ''}) — 0 으로 넣었습니다(지반선 레이어를 확인해 주십시오)`)
    알림.push('선으로 잰 면적은 잘게 나눈 칸으로 잰 어림입니다 — 설계 토적표와 맞출 때는 표 값을 쓰십시오')
  }
  const 칸 = 열.map((c) => {
    const 옛 = 이전칸.find((o) => o.이름 === c.이름 && (o.종 === '성') === (c.종 === '성'))
    return c.종 === '성' ? { id: c.id, 이름: c.이름, 종: '성' } : { id: c.id, 이름: c.이름, 종: '절', C: 옛 ? 옛.C : '', 씀: 옛 ? 옛.씀 !== false : true }
  })
  /* 거리 칸은 비움 — 측점 글과 «측점 간격» 으로 셈(간격이 틀리면 설정 한 칸만 고치면 모두 바뀜) */
  const 줄 = L.단면.map((s) => {
    const 값 = {}
    열.forEach((c) => { const v = c.값(s); if (v > 0) 값[c.id] = String(끝수(v, 6)) })
    return { 측: s.글 || String(끝수(s.측, 3)), 거: '', 값, 끊: false }
  })
  /* 측점 간격 — ① 같은 노선 종평면도의 누가거리 표(도면 값) ② 없으면 횡단 측점의 더한 값으로 짐작(📌 확인) */
  let 간격 = L.종단 && L.종단.간격 ? L.종단.간격 : null, 간근거 = 간격 ? '종평면도 누가거리 표' : ''
  if (!간격) {
    const 셈 = new Map()
    for (const s of L.단면) { const p = s.풀이; if (p && p.n > 0 && Number.isFinite(p.d)) { const g = 끝수((s.측 - p.d) / p.n, 3); if (g > 0) 셈.set(g, (셈.get(g) || 0) + 1) } }
    let 최 = 0
    for (const [g, c] of 셈) if (c > 최) { 최 = c; 간격 = g }
    if (간격) 간근거 = '짐작'
  }
  if (간격 && 간근거 === '짐작') 알림.push(`📌 측점 간격 ${간격} m 는 횡단 측점의 «더한 값» 으로 짐작한 값입니다 — 종평면도 · 설계서의 간격과 같은지 꼭 확인해 주십시오(다르면 «측점 간격» 한 칸만 고치면 됩니다)`)
  else if (간격) 알림.push(`측점 간격 ${간격} m — 같은 노선 종평면도의 누가거리 표에서 읽었습니다`)
  /* 종평면도 누가거리와 측점이 다른 곳(도면끼리 다름) */
  if (간격 && L.종단 && L.종단.점) {
    const 다름 = []
    let 앞번 = null
    for (const z of L.종단.점) {
      let 글 = String(z.글 || '').trim()
      const p0 = 측점풀기(글, 간격, '번호')
      if (p0 && p0.번 !== undefined && /^No|^NO/i.test(글)) 앞번 = p0.번
      if (/^\+/.test(글) && 앞번 !== null) 글 = 'NO.' + 앞번 + 글
      const p = 측점풀기(글, 간격, '번호')
      if (!p || !Number.isFinite(z.m)) continue
      if (Math.abs(p.m - z.m) > 0.01) 다름.push(`${글}: 측점 ${끝수(p.m, 2)} m · 표 ${z.m} m`)
    }
    if (다름.length) 알림.push(`종평면도 누가거리 표와 측점이 다른 곳 ${다름.length}곳(${다름.slice(0, 2).join(' · ')}${다름.length > 2 ? ' …' : ''}) — 도면을 확인해 주십시오`)
  }
  return { 칸, 줄, 간격, 간근거, 알림 }
}
