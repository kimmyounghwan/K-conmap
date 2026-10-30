/**
 * 🧊 G467 골조 모델 → IFC4 — 적산컨맵(골조 모델)이 세운 3D 덩어리를 레빗 · 나비스웍스 · 다른 BIM 프로그램에서 열 수 있게
 *   (BIM 물량 /jeoksan/bim 의 lib/IFC쓰기.js 와 같은 글자 규칙 · 같은 고유번호 — 골조 모델 꼴로 새로 씀)
 *
 * ■ 담는 것
 *   - 프로젝트 · 대지 · 건물 · 층(층높이 — 바닥 높이 mm) · 부재: 기둥 IfcColumn · 보 IfcBeam · 벽 IfcWall · 슬라브 IfcSlab(FLOOR) ·
 *     기초 IfcFooting(PAD_FOOTING) · 계단 IfcStair(세모 면)
 *   - 모양 = 3D 화면의 덩어리 그대로(평면 다각형을 아래 높이에서 위로 밀어 올림 · 계단은 세모 면) · 단위 mm
 *     덩어리 부피 합 = 산출서 콘크리트(골조 모델 «검사» 와 같음) — 벽 · 슬라브 구멍은 3D 처럼 모양에는 없고 물량에서만 뺌
 *   - 물량(부재마다) «Qto_KconmapQuantities»: 3D 부피 · 산출서 콘크리트(m³) · 거푸집(m²) · 철근(kg)
 *   - 속성 «Pset_Kconmap»: 부호 · 층 · 자리(통심) · 칸(층 × 구간) · 레미콘 규격 · (공정이 다 정해졌으면) 공정 시작 · 끝 · (기성이면) 기성 회차
 *   - 🟨 건설맵이 먼저 세운 것(확인 전 제안)은 화면처럼 노란 색 · 속성 «확인» = «확인 전 제안» · «제안 까닭»(화면 글 그대로)
 *   - 재료: 부재마다 레미콘 규격(산출서 콘크리트 줄 · 없으면 모델 기준)
 *   - 🗓 공정(G466 이 다 정해졌을 때): IfcWorkSchedule «골조 공정» · 칸마다 IfcTask(작업일 · 시작 · 끝) · 칸의 부재를 과제에 묶음(IfcRelAssignsToProcess) ·
 *     같은 줄(팀) 앞뒤 과제는 IfcRelSequence(끝-시작) — 나비스웍스 TimeLiner · 다른 4D 프로그램이 읽음
 * ■ 받기 전에 «IFC 검사»(골조IFC검사) — 글자 규칙(ASCII · 끝맺음) · 부재 수 = 3D 덩어리 수 · 층마다 담김 · 과제 수 = 칸 수 · 덩어리 부피 합 = 산출서 콘크리트
 * ■ 시험: node tools/시험_골조IFC.mjs (가상 예시) · 개발 때 IfcOpenShell 로 열어 부피 · 층 · 과제를 맞대 봄(저장소에는 안 넣음)
 */
import { 고유번호, 글자 } from './IFC쓰기.js'
import { 층높이, 종류색, 제안색, 부재글, 기성상태, 기성칸물량 } from './골조모델.js'
import { 공정셈, 칸이름 } from './골조공정.js'

const 실수 = (v) => { const x = Math.round((+v || 0) * 1000) / 1000; const s = String(x); return /[.eE]/.test(s) ? s : s + '.' }
const 쉼 = (v, d) => Math.round((+v || 0) * Math.pow(10, d)) / Math.pow(10, d)
const 층말 = (n) => (n === 'FT' ? '기초' : n === 'R' ? '지붕' : n === 'PH' ? '옥탑' : /^B\d+$/i.test(n) ? '지하' + n.slice(1) + '층' : n + '층')
export const 꼴표 = { 기둥: ['IFCCOLUMN', '.COLUMN.'], 보: ['IFCBEAM', '.BEAM.'], 벽: ['IFCWALL', '.STANDARD.'], 슬라브: ['IFCSLAB', '.FLOOR.'], 기초: ['IFCFOOTING', '.PAD_FOOTING.'], 계단: ['IFCSTAIR', '.NOTDEFINED.'] }

/** 부재 레미콘 규격 — 산출서 줄(콘크리트 · 레미콘) 규격 · 없으면 모델 기준 */
function 규격찾기(M, q) {
  const 줄 = (q && q.줄) || []
  const r = 줄.find((x) => /콘크리트|레미콘/.test(String(x.항목 || '')) && !/버림|타설|펌프|양생/.test(String(x.항목 || '')) && x.규격)
  return String((r && r.규격) || (M.기준 && M.기준.콘크리트) || '').trim()
}

/**
 * @param M 골조 모델(정돈된 것) · @param S 모델셈(M)
 * @param 정보 {이름, 파일, 때(Date)}
 * @returns {{ 글: string, 셈: {부재, 종류별, 층, 과제, 부피, 콘크리트, 빠짐: [id]} }}
 */
export function 골조IFC(M, S, 정보 = {}) {
  const 줄 = []
  let n = 0
  const 넣 = (s) => { n++; 줄.push('#' + n + '=' + s + ';'); return '#' + n }
  const 이름 = 정보.이름 || M.이름 || '골조 모델'
  const 때0 = 정보.때 || new Date()
  const 때 = 때0.toISOString().slice(0, 19)
  const 씨 = 정보.씨 || 'kcm-frame|' + 이름
  const 셈 = { 부재: 0, 종류별: {}, 층: 0, 과제: 0, 부피: 0, 콘크리트: 0, 빠짐: [] }

  const 사람 = 넣("IFCPERSON($,$,'',$,$,$,$,$)")
  const 곳 = 넣("IFCORGANIZATION($,'K-conmap',$,$,$)")
  const 사곳 = 넣('IFCPERSONANDORGANIZATION(' + 사람 + ',' + 곳 + ',$)')
  const 앱 = 넣('IFCAPPLICATION(' + 곳 + ",'1.0','K-conmap Frame Model','KCONMAP-FRAME')")
  const 이력 = 넣('IFCOWNERHISTORY(' + 사곳 + ',' + 앱 + ',$,.ADDED.,$,$,$,' + Math.floor(때0.getTime() / 1000) + ')')
  const 단위 = 넣('IFCUNITASSIGNMENT((' + [
    넣('IFCSIUNIT(*,.LENGTHUNIT.,.MILLI.,.METRE.)'), 넣('IFCSIUNIT(*,.AREAUNIT.,$,.SQUARE_METRE.)'), 넣('IFCSIUNIT(*,.VOLUMEUNIT.,$,.CUBIC_METRE.)'),
    넣('IFCSIUNIT(*,.MASSUNIT.,.KILO.,.GRAM.)'), 넣('IFCSIUNIT(*,.PLANEANGLEUNIT.,$,.RADIAN.)'), 넣('IFCSIUNIT(*,.TIMEUNIT.,$,.SECOND.)'),
  ].join(',') + '))')
  const 영 = 넣('IFCCARTESIANPOINT((0.,0.,0.))')
  const 위 = 넣('IFCDIRECTION((0.,0.,1.))')
  const 옆 = 넣('IFCDIRECTION((1.,0.,0.))')
  const 제자리 = 넣('IFCAXIS2PLACEMENT3D(' + 영 + ',' + 위 + ',' + 옆 + ')')
  const 북 = 넣('IFCDIRECTION((0.,1.))')
  const 틀 = 넣("IFCGEOMETRICREPRESENTATIONCONTEXT($,'Model',3,1.E-05," + 제자리 + ',' + 북 + ')')
  const 몸틀 = 넣("IFCGEOMETRICREPRESENTATIONSUBCONTEXT('Body','Model',*,*,*,*," + 틀 + ',$,.MODEL_VIEW.,$)')
  const 프로젝트 = 넣('IFCPROJECT(' + 글자(고유번호(씨 + '|project')) + ',' + 이력 + ',' + 글자(이름) + ',' + 글자('K-건설맵 적산컨맵 골조 모델(k-conmap.com)') + ',$,$,$,(' + 틀 + '),' + 단위 + ')')
  const 대지자리 = 넣('IFCLOCALPLACEMENT($,' + 제자리 + ')')
  const 대지 = 넣('IFCSITE(' + 글자(고유번호(씨 + '|site')) + ',' + 이력 + ',' + 글자('대지') + ',$,$,' + 대지자리 + ',$,$,.ELEMENT.,$,$,$,$,$)')
  const 건물자리 = 넣('IFCLOCALPLACEMENT(' + 대지자리 + ',' + 제자리 + ')')
  const 건물 = 넣('IFCBUILDING(' + 글자(고유번호(씨 + '|building')) + ',' + 이력 + ',' + 글자('건물') + ',$,$,' + 건물자리 + ',$,$,.ELEMENT.,$,$,$)')
  넣('IFCRELAGGREGATES(' + 글자(고유번호(씨 + '|agg1')) + ',' + 이력 + ',$,$,' + 프로젝트 + ',(' + 대지 + '))')
  넣('IFCRELAGGREGATES(' + 글자(고유번호(씨 + '|agg2')) + ',' + 이력 + ',$,$,' + 대지 + ',(' + 건물 + '))')

  /* 층 — 모델 층 차례 · 바닥 높이(mm) */
  const H = 층높이(M)
  const 층표 = new Map()
  for (const f of M.층) {
    const h = H.표.get(f.이름)
    const 자리 = 넣('IFCLOCALPLACEMENT(' + 건물자리 + ',' + 제자리 + ')')
    const s = 넣('IFCBUILDINGSTOREY(' + 글자(고유번호(씨 + '|storey|' + f.이름)) + ',' + 이력 + ',' + 글자(층말(f.이름)) + ',$,$,' + 자리 + ',$,$,.ELEMENT.,' + 실수(h ? h.z0 : 0) + ')')
    층표.set(f.이름, { s, 자리, 부재: [] })
  }
  if (층표.size) 넣('IFCRELAGGREGATES(' + 글자(고유번호(씨 + '|agg3')) + ',' + 이력 + ',$,$,' + 건물 + ',(' + [...층표.values()].map((x) => x.s).join(',') + '))')
  셈.층 = 층표.size

  /* 색(종류마다 — 화면과 같은 색) */
  const 색표 = new Map()
  for (const [종, c] of [...Object.entries(종류색), ['제안', 제안색]]) {
    const rgb = 넣('IFCCOLOURRGB($,' + c.map(실수).join(',') + ')')
    const 빛 = 넣('IFCSURFACESTYLESHADING(' + rgb + ',0.)')
    색표.set(종, 넣('IFCSURFACESTYLE(' + 글자(종) + ',.BOTH.,(' + 빛 + '))'))
  }

  /* 칸 · 공정 · 기성 */
  const Q = 기성칸물량(M, S)
  const R = M.공정 ? 공정셈(M, S, Q) : null
  const 공 = R && R.다됨 ? R : null
  const 칸줄 = new Map(공 ? 공.줄.map((c) => [c.열쇠, c]) : [])
  const 기상 = 기성상태(M)
  const 칸부재 = new Map()
  const 재료표 = new Map()

  const 부재표 = new Map(M.부재.map((o) => [o.id, o]))
  for (const d of S.덩어리 || []) {
    const k = 꼴표[d.종류]
    const o = 부재표.get(d.id)
    if (!k || !o) { 셈.빠짐.push(d.id); continue }
    let 모양
    if (d.종류 === '계단' && Array.isArray(d.면) && d.면.length >= 9) {
      const 점번 = new Map(), 점들 = [], 세 = []
      for (let i = 0; i + 8 < d.면.length; i += 9) {
        const t = []
        for (let j = 0; j < 9; j += 3) {
          const x = 쉼(d.면[i + j], 1), y = 쉼(d.면[i + j + 1], 1), z = 쉼(d.면[i + j + 2], 1)
          const key = x + ',' + y + ',' + z
          let m = 점번.get(key)
          if (m === undefined) { m = 점들.length + 1; 점번.set(key, m); 점들.push('(' + 실수(x) + ',' + 실수(y) + ',' + 실수(z) + ')') }
          t.push(m)
        }
        if (t[0] !== t[1] && t[1] !== t[2] && t[0] !== t[2]) 세.push('(' + t.join(',') + ')')
      }
      if (!세.length) { 셈.빠짐.push(d.id); continue }
      const 면 = 넣('IFCTRIANGULATEDFACESET(' + 넣('IFCCARTESIANPOINTLIST3D((' + 점들.join(',') + '))') + ',$,.T.,(' + 세.join(',') + '),$)')
      넣('IFCSTYLEDITEM(' + 면 + ',(' + 색표.get(d.제안 ? '제안' : d.종류) + '),$)')
      모양 = 넣('IFCSHAPEREPRESENTATION(' + 몸틀 + ",'Body','Tessellation',(" + 면 + '))')
    } else {
      if (!Array.isArray(d.판) || d.판.length < 3 || !(d.z1 > d.z0)) { 셈.빠짐.push(d.id); continue }
      const 점들 = d.판.map((p) => 넣('IFCCARTESIANPOINT((' + 실수(p[0]) + ',' + 실수(p[1]) + '))'))
      const 선 = 넣('IFCPOLYLINE((' + 점들.join(',') + ',' + 점들[0] + '))')
      const 단면 = 넣('IFCARBITRARYCLOSEDPROFILEDEF(.AREA.,$,' + 선 + ')')
      const 놓임 = 넣('IFCAXIS2PLACEMENT3D(' + 넣('IFCCARTESIANPOINT((0.,0.,' + 실수(d.z0) + '))') + ',' + 위 + ',' + 옆 + ')')
      const 몸 = 넣('IFCEXTRUDEDAREASOLID(' + 단면 + ',' + 놓임 + ',' + 위 + ',' + 실수(d.z1 - d.z0) + ')')
      넣('IFCSTYLEDITEM(' + 몸 + ',(' + 색표.get(d.제안 ? '제안' : d.종류) + '),$)')
      모양 = 넣('IFCSHAPEREPRESENTATION(' + 몸틀 + ",'Body','SweptSolid',(" + 몸 + '))')
    }
    const 꼴정의 = 넣('IFCPRODUCTDEFINITIONSHAPE($,$,(' + 모양 + '))')
    const 층 = 층표.get(o.층) || [...층표.values()][0]
    const 자리 = 넣('IFCLOCALPLACEMENT(' + (층 ? 층.자리 : 건물자리) + ',' + 제자리 + ')')
    const 아이디 = 고유번호(씨 + '|member|' + d.id)
    const 부호 = String(o.부호 || '').trim()
    const 자리글 = 부재글(M, o)
    const 이름글 = (부호 ? 부호 + ' ' : '') + 층말(o.층) + ' ' + d.종류
    const e = 넣(k[0] + '(' + 글자(아이디) + ',' + 이력 + ',' + 글자(이름글) + ',' + 글자(자리글) + ',' + 글자(d.종류) + ',' + 자리 + ',' + 꼴정의 + ',' + 글자(부호 || null) + ',' + k[1] + ')')
    if (층) 층.부재.push(e)
    셈.부재++; 셈.종류별[d.종류] = (셈.종류별[d.종류] || 0) + 1; 셈.부피 += d.부피 || 0
    if (d.제안) { 셈.제안 = (셈.제안 || 0) + 1; 셈.제안부피 = (셈.제안부피 || 0) + (d.부피 || 0) }
    /* 물량 */
    const q = S.부재별.get(d.id)
    const 양 = [넣("IFCQUANTITYVOLUME('GrossVolume'," + 글자('3D 부피(m3)') + ',$,' + 실수(쉼(d.부피, 4)) + ',$)')]
    if (q) {
      셈.콘크리트 += q.콘크리트 || 0
      양.push(넣('IFCQUANTITYVOLUME(' + 글자('콘크리트') + ',' + 글자('산출서 콘크리트(m3)') + ',$,' + 실수(쉼(q.콘크리트, 4)) + ',$)'))
      양.push(넣('IFCQUANTITYAREA(' + 글자('거푸집') + ',' + 글자('산출서 거푸집(m2)') + ',$,' + 실수(쉼(q.거푸집, 3)) + ',$)'))
      양.push(넣('IFCQUANTITYWEIGHT(' + 글자('철근') + ',' + 글자('산출서 철근(kg)') + ',$,' + 실수(쉼(q.철근, 2)) + ',$)'))
    }
    const 묶 = 넣('IFCELEMENTQUANTITY(' + 글자(고유번호(아이디 + '|qto')) + ',' + 이력 + ",'Qto_KconmapQuantities'," + 글자('K-건설맵 산출서') + ',' + 글자('골조 수량산출(K-건설맵)') + ',(' + 양.join(',') + '))')
    넣('IFCRELDEFINESBYPROPERTIES(' + 글자(고유번호(아이디 + '|rel')) + ',' + 이력 + ',$,$,(' + e + '),' + 묶 + ')')
    /* 속성 */
    const 칸k = Q.어디.get(d.id)
    const c = 칸k ? Q.칸.get(칸k) : null
    const 규격 = 규격찾기(M, q)
    const 값 = [['부호', 부호 || '—'], ['층', 층말(o.층)], ['자리', 자리글], ['칸', c ? 칸이름(c) : '—'], ['레미콘 규격', 규격 || '—']]
    if (d.제안) { 값.push(['확인', '확인 전 제안(건설맵이 먼저 세운 것)']); if (String(o.제안 || '').trim()) 값.push(['제안 까닭', String(o.제안).trim()]) }
    const 공칸 = 칸k ? 칸줄.get(칸k) : null
    if (공칸) 값.push(['공정 시작', 공칸.시작], ['공정 끝', 공칸.끝], ['작업일', String(공칸.일수)])
    if (칸k && 기상.has(칸k)) 값.push(['기성 회차', 기상.get(칸k) + '회'])
    const 속 = 값.map(([a, b]) => 넣('IFCPROPERTYSINGLEVALUE(' + 글자(a) + ',$,IFCLABEL(' + 글자(b) + '),$)'))
    const 속묶 = 넣('IFCPROPERTYSET(' + 글자(고유번호(아이디 + '|pset')) + ',' + 이력 + ",'Pset_Kconmap'," + 글자('K-건설맵 부재 정보') + ',(' + 속.join(',') + '))')
    넣('IFCRELDEFINESBYPROPERTIES(' + 글자(고유번호(아이디 + '|relp')) + ',' + 이력 + ',$,$,(' + e + '),' + 속묶 + ')')
    if (규격) { if (!재료표.has(규격)) 재료표.set(규격, []); 재료표.get(규격).push(e) }
    if (칸k) { if (!칸부재.has(칸k)) 칸부재.set(칸k, []); 칸부재.get(칸k).push(e) }
  }
  for (const [nm, x] of 층표) {
    if (!x.부재.length) continue
    넣('IFCRELCONTAINEDINSPATIALSTRUCTURE(' + 글자(고유번호(씨 + '|contain|' + nm)) + ',' + 이력 + ',$,$,(' + x.부재.join(',') + '),' + x.s + ')')
  }
  for (const [규격, 들] of 재료표) {
    const 재 = 넣('IFCMATERIAL(' + 글자('레미콘 ' + 규격) + ',$,' + 글자('Concrete') + ')')
    넣('IFCRELASSOCIATESMATERIAL(' + 글자(고유번호(씨 + '|mat|' + 규격)) + ',' + 이력 + ',$,$,(' + 들.join(',') + '),' + 재 + ')')
  }

  /* 🗓 공정 — 칸마다 과제(IfcTask) · 부재 묶음 · 같은 줄 앞뒤 */
  if (공) {
    const 시각 = (t, 끝) => "'" + t + (끝 ? 'T17:00:00' : 'T08:00:00') + "'"
    const 일정 = 넣('IFCWORKSCHEDULE(' + 글자(고유번호(씨 + '|schedule')) + ',' + 이력 + ',' + 글자('골조 공정') + ',' + 글자('K-건설맵 적산컨맵 — 칸(층 × 구간)마다 작업일') + ',$,$,' + "'" + 때 + "'" + ',$,$,$,$,' + 시각(공.시작) + ',' + 시각(공.끝, true) + ',.PLANNED.)')
    넣('IFCRELDECLARES(' + 글자(고유번호(씨 + '|declares')) + ',' + 이력 + ',$,$,' + 프로젝트 + ',(' + 일정 + '))')
    const 과제들 = []
    const 사슬앞 = new Map()
    for (const c of 공.줄) {
      const 시간 = 넣('IFCTASKTIME($,$,$,.WORKTIME.,' + "'P" + c.일수 + "D'" + ',' + 시각(c.시작) + ',' + 시각(c.끝, true) + ',$,$,$,$,$,$,$,$,$,$,$,$,$)')
      const t = 넣('IFCTASK(' + 글자(고유번호(씨 + '|task|' + c.열쇠)) + ',' + 이력 + ',' + 글자(칸이름(c)) + ',' + 글자('작업일 ' + c.일수 + '일 · ' + c.시작 + ' ~ ' + c.끝) + ',$,' + 글자(String(c.차례)) + ',$,$,$,.F.,$,' + 시간 + ',.CONSTRUCTION.)')
      과제들.push(t)
      const 들 = 칸부재.get(c.열쇠)
      if (들 && 들.length) 넣('IFCRELASSIGNSTOPROCESS(' + 글자(고유번호(씨 + '|proc|' + c.열쇠)) + ',' + 이력 + ',$,$,(' + 들.join(',') + '),$,' + t + ',$)')
      const 앞 = 사슬앞.get(c.사슬)
      if (앞) 넣('IFCRELSEQUENCE(' + 글자(고유번호(씨 + '|seq|' + c.열쇠)) + ',' + 이력 + ',$,$,' + 앞 + ',' + t + ',$,.FINISH_START.,$)')
      사슬앞.set(c.사슬, t)
    }
    넣('IFCRELASSIGNSTOCONTROL(' + 글자(고유번호(씨 + '|control')) + ',' + 이력 + ',$,$,(' + 과제들.join(',') + '),$,' + 일정 + ')')
    셈.과제 = 과제들.length
  }

  const 머리 = [
    'ISO-10303-21;',
    'HEADER;',
    "FILE_DESCRIPTION(('ViewDefinition [ReferenceView_V1.2]'),'2;1');",
    'FILE_NAME(' + 글자(정보.파일 || 'k-conmap-frame.ifc') + ",'" + 때 + "',(''),('K-conmap'),'K-conmap Frame Model 1.0','K-conmap','');",
    "FILE_SCHEMA(('IFC4'));",
    'ENDSEC;',
    'DATA;',
  ]
  return { 글: 머리.concat(줄, ['ENDSEC;', 'END-ISO-10303-21;', '']).join('\n'), 셈, 공: !!공 }
}

/**
 * 🧊 받기 전 IFC 검사 — 다 쓴 글자를 다시 읽어 맞대 봄
 * @returns {{ 통과, 줄: [{됨, 글}] }}
 */
export function 골조IFC검사(글, 셈, M, S) {
  const 줄 = []
  const 줄들 = 글.split('\n')
  const ascii = !/[^\x09\x0a\x0d\x20-\x7e]/.test(글)
  줄.push({ 됨: ascii && 줄들[0] === 'ISO-10303-21;' && 글.trimEnd().endsWith('END-ISO-10303-21;'), 글: ascii ? 'IFC 글자 규칙(ASCII · 한글은 \\X2\\ · 머리 · 끝맺음)' : 'ASCII 밖 글자가 있음' })
  /* 번호 — 모든 #n 이 앞에 있음 */
  const 있음 = new Set()
  let 없는번호 = 0
  for (const l of 줄들) { const m = l.match(/^#(\d+)=/); if (m) 있음.add(+m[1]) }
  for (const l of 줄들) { const m = l.match(/^#\d+=(.*)$/); if (!m) continue; for (const r of m[1].matchAll(/#(\d+)/g)) if (!있음.has(+r[1])) 없는번호++ }
  줄.push({ 됨: !없는번호, 글: 없는번호 ? '없는 번호를 가리킴 ' + 없는번호 + '곳' : '모든 이음(#번호)이 있음 · 줄 ' + 있음.size.toLocaleString('ko-KR') })
  /* 부재 수 = 3D 덩어리 수 */
  const 덩수 = (S.덩어리 || []).length
  const 세 = (re) => 줄들.filter((l) => re.test(l)).length
  const 부재줄 = 세(/^#\d+=IFC(COLUMN|BEAM|WALL|SLAB|FOOTING|STAIR)\(/)
  줄.push({ 됨: 부재줄 === 덩수 && 셈.부재 === 덩수, 글: '부재 ' + 부재줄 + '개 = 3D 덩어리 ' + 덩수 + '개(' + Object.entries(셈.종류별).map(([k, v]) => k + ' ' + v).join(' · ') + ')' })
  /* 🟨 확인 전 제안 — 화면(노란 덩어리) 수 = IFC «확인 전 제안» 수 */
  const 제화면 = (S.덩어리 || []).filter((d) => d.제안).length
  const 제글 = (글.match(new RegExp(글자('확인 전 제안(건설맵이 먼저 세운 것)').replace(/[\\$()|.*+?^{}[\]]/g, '\\$&'), 'g')) || []).length
  줄.push({ 됨: 제글 === 제화면, 글: 제화면 ? '🟨 확인 전 제안 ' + 제글 + '개 = 화면 노란 덩어리 ' + 제화면 + '개(노란 색 · 속성 «확인 전 제안»)' : '🟨 확인 전 제안 없음' })
  /* 층마다 담김 */
  const 담김 = 줄들.filter((l) => /IFCRELCONTAINEDINSPATIALSTRUCTURE\(/.test(l)).reduce((a, l) => a + ((l.match(/,\((#[\d,#]+)\),#\d+\);$/) || ['', ''])[1].split(',').filter(Boolean).length), 0)
  줄.push({ 됨: 담김 === 부재줄, 글: '층에 담긴 부재 ' + 담김 + '개 · 층 ' + 셈.층 })
  /* 부피 — IFC 글자에서 모양을 다시 읽어 잰 부피 = 3D 덩어리(구멍은 3D 처럼 모양에 없음 · 물량에서만 뺌) */
  const 표 = new Map()
  for (const l of 줄들) { const m = l.match(/^#(\d+)=(.*);$/); if (m) 표.set('#' + m[1], m[2]) }
  const 수들 = (t) => (t.match(/-?\d+(?:\.\d*)?(?:E-?\d+)?/gi) || []).map(Number)
  let 잰 = 0
  for (const [, v] of 표) {
    let m = v.match(/^IFCEXTRUDEDAREASOLID\((#\d+),(#\d+),(#\d+),([^)]+)\)$/)
    if (m) {
      const 판 = (표.get(m[1]) || '').match(/,(#\d+)\)$/)
      const 선 = 판 ? 표.get(판[1]) || '' : ''
      const 점 = (선.match(/#\d+/g) || []).slice(0, -1).map((r) => 수들((표.get(r) || '').replace(/^IFCCARTESIANPOINT/, '')))
      let a = 0
      for (let i = 0; i < 점.length; i++) { const p = 점[i], q = 점[(i + 1) % 점.length]; a += p[0] * q[1] - q[0] * p[1] }
      잰 += Math.abs(a) / 2 * Number(m[4]) / 1e9
      continue
    }
    m = v.match(/^IFCTRIANGULATEDFACESET\((#\d+),\$,\.T\.,\((.*)\),\$\)$/)
    if (m) {
      const 목 = (표.get(m[1]) || '').replace(/^IFCCARTESIANPOINTLIST3D\(\(/, '')
      const 점 = [...목.matchAll(/\(([^()]+)\)/g)].map((x) => x[1].split(',').map(Number))
      let vol = 0
      for (const t of m[2].matchAll(/\((\d+),(\d+),(\d+)\)/g)) {
        const [a, b, c] = [점[+t[1] - 1], 점[+t[2] - 1], 점[+t[3] - 1]]
        vol += (a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0])) / 6
      }
      잰 += Math.abs(vol) / 1e9
    }
  }
  let 기대 = 0
  for (const d of S.덩어리 || []) {
    if (d.종류 === '계단') { 기대 += d.부피 || 0; continue }
    if (!Array.isArray(d.판)) continue
    let a = 0
    for (let i = 0; i < d.판.length; i++) { const p = d.판[i], q = d.판[(i + 1) % d.판.length]; a += p[0] * q[1] - q[0] * p[1] }
    기대 += Math.abs(a) / 2 * (d.z1 - d.z0) / 1e9
  }
  줄.push({ 됨: Math.abs(잰 - 기대) <= 0.001 + 1e-6 * (S.덩어리 || []).length, 글: 'IFC 모양을 다시 읽어 잰 부피 ' + 잰.toFixed(3) + ' ㎥ = 3D 덩어리 ' + 기대.toFixed(3) + ' ㎥' })
  /* 공정 과제 */
  if (M.공정) {
    const R = 공정셈(M, S)
    if (R.다됨) {
      const 과 = 세(/^#\d+=IFCTASK\(/)
      줄.push({ 됨: 과 === R.줄.length && 셈.과제 === R.줄.length, 글: '🗓 공정 과제 ' + 과 + '개 = 칸 ' + R.줄.length + '곳(' + R.시작 + ' ~ ' + R.끝 + ')' })
    } else 줄.push({ 됨: true, 글: '🗓 공정은 아직 다 정해지지 않아 담지 않음(' + R.까닭 + ')' })
  }
  return { 통과: 줄.every((x) => x.됨), 줄 }
}
