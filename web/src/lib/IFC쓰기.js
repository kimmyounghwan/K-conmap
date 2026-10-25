/**
 * 📤 IFC 파일 쓰기 — BIM 물량(lib/BIM모델.js)의 부재 모델을 IFC4 로 (G225 · 2026-10-10)
 *
 * 소장님: 「레빗 파일(IFC)을 주고받는 단계도 앞당겨져요. — 이게 무슨 말이지??」 → 우리 사이트가 도면으로 세운 3D 를
 *         레빗 · 다른 BIM 프로그램에서 열 수 있게 «내보내기». 따로 꾸러미(라이브러리) 없이 글자로 씁니다(IFC = STEP 글자 파일).
 *
 * ■ 담는 것: 프로젝트 · 대지 · 건물 · 층(높이) · 부재(IfcColumn · IfcBeam · IfcSlab · IfcWall · IfcFooting)
 *   - 모양: 평면 다각형을 아래 높이에서 위로 밀어 올린 덩어리(IfcExtrudedAreaSolid) — 단위 mm
 *   - 색: 부재 종류마다(화면과 같은 색)
 *   - 물량: 부재마다 «산출서» 콘크리트(m³) · 거푸집(m²) · 철근(kg) — IfcElementQuantity «K-conmap 산출서»
 * ■ 한글은 STEP 규칙대로 \X2\…\X0\ 로 바꿔 씁니다. GlobalId 는 부재마다 같은 값이 나오게(다시 받아도 같은 부재) 만듭니다.
 * ■ 토목(G225 · 토목 도면도 같이): 배수로 · 터파기 · 성토 = IfcBuildingElementProxy · 구조물 벽 = IfcWall · 바닥판 = IfcSlab(BASESLAB) · 땅 = IfcGeographicElement(TERRAIN)
 *   모양은 세모 면(IfcTriangulatedFaceSet) · 대지(IfcSite)에 담음 · 물량 = 평균단면 몫(콘크리트 · 거푸집 · 터파기 · 되메우기 · 성토)
 *   건물을 토목 옆에 놓았으면(정보.건물옮김) 건물 자리를 그만큼 옮김
 * ■ 시험: node tools/시험_BIM물량.mjs (글자 짜임) · 개발 때 IfcOpenShell 로 열어 봄(저장소에는 안 넣음)
 */
import { 종류색, 크기글 } from './BIM모델.js'
import { 토목색, 토목비침, 토목이름 } from './BIM토목.js'

const 글64 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$'

/** 글자 → 늘 같은 IFC GlobalId(22자) */
export function 고유번호(s) {
  // FNV-1a 32비트 네 번(씨앗 다르게) → 128 비트
  const 해시 = (seed) => { let h = (0x811c9dc5 ^ seed) >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0 } return h >>> 0 }
  let n = 0n
  for (const seed of [1, 2, 3, 4]) n = (n << 32n) | BigInt(해시(seed * 0x9e3779b1))
  let out = ''
  for (let i = 0; i < 22; i++) { out = 글64[Number(n & 63n)] + out; n >>= 6n }
  // 첫 자리는 2 비트(0~3)만
  return 글64[글64.indexOf(out[0]) & 3] + out.slice(1)
}

/** STEP 글자 — 작은따옴표 둘로 · 역빗금 둘로 · ASCII 밖은 \X2\XXXX\X0\ */
export function 글자(s) {
  if (s === null || s === undefined) return '$'
  let out = ''
  const t = String(s)
  let i = 0
  while (i < t.length) {
    const c = t.charCodeAt(i)
    if (c >= 32 && c <= 126) { const ch = t[i]; out += ch === "'" ? "''" : ch === '\\' ? '\\\\' : ch; i++; continue }
    let hex = ''
    while (i < t.length && !(t.charCodeAt(i) >= 32 && t.charCodeAt(i) <= 126)) { hex += t.charCodeAt(i).toString(16).toUpperCase().padStart(4, '0'); i++ }
    out += '\\X2\\' + hex + '\\X0\\'
  }
  return "'" + out + "'"
}
const 실수 = (v) => { const x = Math.round((+v || 0) * 1000) / 1000; const s = String(x); return /[.eE]/.test(s) ? s : s + '.' }

const 층말 = (n) => (n === 'FT' ? '기초' : n === 'R' ? '지붕' : /^B\d+$/i.test(n) ? '지하' + n.slice(1) + '층' : n + '층')

/**
 * @param {object} 모델 모델만들기 결과
 * @param {{부재:Map}} [Q] 부재물량 결과(있으면 물량을 담음)
 * @param {{이름?:string, 파일?:string, 때?:Date}} [정보]
 * @returns {string} IFC 글자
 */
export function IFC쓰기(모델, Q, 정보 = {}) {
  const 줄 = []
  let n = 0
  const 넣 = (s) => { n++; 줄.push('#' + n + '=' + s + ';'); return '#' + n }
  const 이름 = 정보.이름 || 'K-건설맵 BIM 물량'
  const 때 = (정보.때 || new Date()).toISOString().slice(0, 19)
  const 씨 = 정보.씨 || 이름

  const 사람 = 넣("IFCPERSON($,$,'',$,$,$,$,$)")
  const 곳 = 넣("IFCORGANIZATION($,'K-conmap',$,$,$)")
  const 사곳 = 넣('IFCPERSONANDORGANIZATION(' + 사람 + ',' + 곳 + ',$)')
  const 앱 = 넣('IFCAPPLICATION(' + 곳 + ",'1.0','K-conmap BIM','KCONMAP')")
  const 이력 = 넣('IFCOWNERHISTORY(' + 사곳 + ',' + 앱 + ',$,.ADDED.,$,$,$,' + Math.floor((정보.때 || new Date()).getTime() / 1000) + ')')
  const 길이단위 = 넣('IFCSIUNIT(*,.LENGTHUNIT.,.MILLI.,.METRE.)')
  const 넓이단위 = 넣('IFCSIUNIT(*,.AREAUNIT.,$,.SQUARE_METRE.)')
  const 부피단위 = 넣('IFCSIUNIT(*,.VOLUMEUNIT.,$,.CUBIC_METRE.)')
  const 무게단위 = 넣('IFCSIUNIT(*,.MASSUNIT.,.KILO.,.GRAM.)')
  const 각단위 = 넣('IFCSIUNIT(*,.PLANEANGLEUNIT.,$,.RADIAN.)')
  const 단위 = 넣('IFCUNITASSIGNMENT((' + [길이단위, 넓이단위, 부피단위, 무게단위, 각단위].join(',') + '))')
  const 영 = 넣('IFCCARTESIANPOINT((0.,0.,0.))')
  const 위 = 넣('IFCDIRECTION((0.,0.,1.))')
  const 옆 = 넣('IFCDIRECTION((1.,0.,0.))')
  const 제자리 = 넣('IFCAXIS2PLACEMENT3D(' + 영 + ',' + 위 + ',' + 옆 + ')')
  const 북 = 넣('IFCDIRECTION((0.,1.))')
  const 틀 = 넣("IFCGEOMETRICREPRESENTATIONCONTEXT($,'Model',3,1.E-05," + 제자리 + ',' + 북 + ')')
  const 몸틀 = 넣("IFCGEOMETRICREPRESENTATIONSUBCONTEXT('Body','Model',*,*,*,*," + 틀 + ',$,.MODEL_VIEW.,$)')
  const 프로젝트 = 넣('IFCPROJECT(' + 글자(고유번호(씨 + '|project')) + ',' + 이력 + ',' + 글자(이름) + ',' + 글자('K-건설맵(k-conmap.com)이 캐드 도면에서 세운 골조') + ',$,$,$,(' + 틀 + '),' + 단위 + ')')
  const 대지자리 = 넣('IFCLOCALPLACEMENT($,' + 제자리 + ')')
  const 대지 = 넣('IFCSITE(' + 글자(고유번호(씨 + '|site')) + ',' + 이력 + ',' + 글자('대지') + ',$,$,' + 대지자리 + ',$,$,.ELEMENT.,$,$,$,$,$)')
  const 옮 = 정보.건물옮김 || [0, 0, 0, 0]
  /* 🏢 G228 [dx, dy, dz, θ] — 같은 건물로 겹쳐 놓았으면 돌림도(건물 x 축 = (cos θ, sin θ, 0)) */
  const 돌 = 옮[3] || 0
  const 건물옆 = 돌 ? 넣('IFCDIRECTION((' + [Math.cos(돌), Math.sin(돌), 0].map(실수).join(',') + '))') : 옆
  const 건물놓임 = 옮[0] || 옮[1] || 옮[2] || 돌 ? 넣('IFCAXIS2PLACEMENT3D(' + 넣('IFCCARTESIANPOINT((' + 옮.slice(0, 3).map((v) => 실수(v || 0)).join(',') + '))') + ',' + 위 + ',' + 건물옆 + ')') : 제자리
  const 건물자리 = 넣('IFCLOCALPLACEMENT(' + 대지자리 + ',' + 건물놓임 + ')')
  const 건물 = 넣('IFCBUILDING(' + 글자(고유번호(씨 + '|building')) + ',' + 이력 + ',' + 글자('건물') + ',$,$,' + 건물자리 + ',$,$,.ELEMENT.,$,$,$)')
  넣('IFCRELAGGREGATES(' + 글자(고유번호(씨 + '|agg1')) + ',' + 이력 + ',$,$,' + 프로젝트 + ',(' + 대지 + '))')
  넣('IFCRELAGGREGATES(' + 글자(고유번호(씨 + '|agg2')) + ',' + 이력 + ',$,$,' + 대지 + ',(' + 건물 + '))')

  /* 층 */
  const 층표 = new Map()
  const 층들 = [...모델.층].sort((a, b) => (a.이름 === 'FT' ? -1 : b.이름 === 'FT' ? 1 : a.바닥 - b.바닥))
  for (const f of 층들) {
    const 자리 = 넣('IFCLOCALPLACEMENT(' + 건물자리 + ',' + 제자리 + ')')
    const s = 넣('IFCBUILDINGSTOREY(' + 글자(고유번호(씨 + '|storey|' + f.이름)) + ',' + 이력 + ',' + 글자(층말(f.이름)) + ',$,$,' + 자리 + ',$,$,.ELEMENT.,' + 실수(f.바닥) + ')')
    층표.set(f.이름, { s, 자리, 부재: [] })
  }
  if (층들.length) 넣('IFCRELAGGREGATES(' + 글자(고유번호(씨 + '|agg3')) + ',' + 이력 + ',$,$,' + 건물 + ',(' + [...층표.values()].map((x) => x.s).join(',') + '))')

  /* 색 */
  const 색표 = new Map()
  for (const [종, c] of Object.entries(종류색)) {
    const rgb = 넣('IFCCOLOURRGB($,' + c.map(실수).join(',') + ')')
    const 빛 = 넣('IFCSURFACESTYLESHADING(' + rgb + ',0.)')
    색표.set(종, 넣('IFCSURFACESTYLE(' + 글자(종) + ',.BOTH.,(' + 빛 + '))'))
  }

  /* 부재 */
  const 꼴 = { 기둥: ['IFCCOLUMN', '.COLUMN.'], 보: ['IFCBEAM', '.BEAM.'], 슬라브: ['IFCSLAB', '.FLOOR.'], 벽: ['IFCWALL', '.STANDARD.'], 기초: ['IFCFOOTING', '.PAD_FOOTING.'] }
  const 쉼 = (v, d) => (Math.round(v * Math.pow(10, d)) / Math.pow(10, d))
  for (const o of 모델.부재) {
    const k = 꼴[o.종류]
    if (!k || !(o.z1 > o.z0) || !o.판 || o.판.length < 3) continue
    const 점들 = o.판.map((p) => 넣('IFCCARTESIANPOINT((' + 실수(p[0]) + ',' + 실수(p[1]) + '))'))
    const 선 = 넣('IFCPOLYLINE((' + 점들.join(',') + ',' + 점들[0] + '))')
    const 단면 = 넣('IFCARBITRARYCLOSEDPROFILEDEF(.AREA.,$,' + 선 + ')')
    const 아래 = 넣('IFCCARTESIANPOINT((0.,0.,' + 실수(o.z0) + '))')
    const 놓임 = 넣('IFCAXIS2PLACEMENT3D(' + 아래 + ',' + 위 + ',' + 옆 + ')')
    const 덩어리 = 넣('IFCEXTRUDEDAREASOLID(' + 단면 + ',' + 놓임 + ',' + 위 + ',' + 실수(o.z1 - o.z0) + ')')
    if (색표.has(o.종류)) 넣('IFCSTYLEDITEM(' + 덩어리 + ',(' + 색표.get(o.종류) + '),$)')
    const 모양 = 넣('IFCSHAPEREPRESENTATION(' + 몸틀 + ",'Body','SweptSolid',(" + 덩어리 + '))')
    const 꼴정의 = 넣('IFCPRODUCTDEFINITIONSHAPE($,$,(' + 모양 + '))')
    const 층 = 층표.get(o.층) || [...층표.values()][0]
    const 자리 = 넣('IFCLOCALPLACEMENT(' + (층 ? 층.자리 : 건물자리) + ',' + 제자리 + ')')
    const 아이디 = 고유번호(씨 + '|' + o.표 + '|' + o.i + '|' + o.kk + '|' + o.기호)
    const e = 넣(k[0] + '(' + 글자(아이디) + ',' + 이력 + ',' + 글자(o.몸 || o.기호) + ',' + 글자(층말(o.층) + ' ' + o.종류 + ' ' + 크기글(o)) + ',' + 글자(o.종류) + ',' + 자리 + ',' + 꼴정의 + ',' + 글자(o.기호) + ',' + k[1] + ')')
    if (층) 층.부재.push(e)
    const q = Q && Q.부재 ? Q.부재.get(o.id) : null
    const 양 = [넣("IFCQUANTITYVOLUME('GrossVolume'," + 글자('3D 부피(겹침 공제 전)') + ',$,' + 실수(쉼(o.부피, 4)) + ',$)')]
    if (q) {
      양.push(넣('IFCQUANTITYVOLUME(' + 글자('콘크리트') + ',' + 글자('산출서 콘크리트(m3)') + ',$,' + 실수(쉼(q.콘크리트, 4)) + ',$)'))
      양.push(넣('IFCQUANTITYAREA(' + 글자('거푸집') + ',' + 글자('산출서 거푸집(m2)') + ',$,' + 실수(쉼(q.거푸집, 3)) + ',$)'))
      양.push(넣('IFCQUANTITYWEIGHT(' + 글자('철근') + ',' + 글자('산출서 철근(kg)') + ',$,' + 실수(쉼(q.철근, 2)) + ',$)'))
    }
    const 묶 = 넣('IFCELEMENTQUANTITY(' + 글자(고유번호(아이디 + '|qto')) + ',' + 이력 + ",'Qto_KconmapQuantities'," + 글자('K-건설맵 산출서') + ',' + 글자('골조 수량산출(K-건설맵)') + ',(' + 양.join(',') + '))')
    넣('IFCRELDEFINESBYPROPERTIES(' + 글자(고유번호(아이디 + '|rel')) + ',' + 이력 + ',$,$,(' + e + '),' + 묶 + ')')
  }
  for (const [nm, x] of 층표) {
    if (!x.부재.length) continue
    넣('IFCRELCONTAINEDINSPATIALSTRUCTURE(' + 글자(고유번호(씨 + '|contain|' + nm)) + ',' + 이력 + ',$,$,(' + x.부재.join(',') + '),' + x.s + ')')
  }

  /* 토목 — 세모 면 덩어리 · 대지에 담음 */
  const 토 = 정보.토목
  if (토 && 토.부재 && 토.부재.length) {
    const 토색 = new Map()
    const 색 = (k, c, 비) => {
      if (토색.has(k)) return 토색.get(k)
      const rgb = 넣('IFCCOLOURRGB($,' + c.map(실수).join(',') + ')')
      const 빛 = 넣('IFCSURFACESTYLESHADING(' + rgb + ',' + 실수(비 ? 1 - 비 : 0) + ')')
      const st = 넣('IFCSURFACESTYLE(' + 글자(k) + ',.BOTH.,(' + 빛 + '))')
      토색.set(k, st)
      return st
    }
    const 담 = []
    for (const o of 토.부재) {
      const m = o.면
      if (!m || m.length < 9) continue
      const 점번 = new Map(), 점들 = [], 세 = []
      for (let i = 0; i + 8 < m.length; i += 9) {
        const t = []
        for (let k = 0; k < 9; k += 3) {
          const x = Math.round(m[i + k]), y = Math.round(m[i + k + 1]), z = Math.round(m[i + k + 2])
          const key = x + ',' + y + ',' + z
          let j = 점번.get(key)
          if (j === undefined) { j = 점들.length + 1; 점번.set(key, j); 점들.push('(' + 실수(x) + ',' + 실수(y) + ',' + 실수(z) + ')') }
          t.push(j)
        }
        if (t[0] !== t[1] && t[1] !== t[2] && t[0] !== t[2]) 세.push('(' + t.join(',') + ')')
      }
      if (!세.length) continue
      const 목록 = 넣('IFCCARTESIANPOINTLIST3D((' + 점들.join(',') + '))')
      const 닫힘 = o.종류 === '지형' ? '.F.' : '.T.'
      const 면 = 넣('IFCTRIANGULATEDFACESET(' + 목록 + ',$,' + 닫힘 + ',(' + 세.join(',') + '),$)')
      const 색이름 = o.종류 === '구조물' && (o.부분 === '바닥' || o.부분 === '덮개') ? '구조바닥' : o.종류 === '건물' && o.부분 === '바닥' ? '건물바닥' : o.종류
      넣('IFCSTYLEDITEM(' + 면 + ',(' + 색(색이름, o.색 || 토목색[o.종류] || [0.7, 0.7, 0.7], 토목비침[o.종류]) + '),$)')
      const 모양 = 넣('IFCSHAPEREPRESENTATION(' + 몸틀 + ",'Body','Tessellation',(" + 면 + '))')
      const 꼴정의 = 넣('IFCPRODUCTDEFINITIONSHAPE($,$,(' + 모양 + '))')
      const 자리 = 넣('IFCLOCALPLACEMENT(' + 대지자리 + ',' + 제자리 + ')')
      const 아이디 = 고유번호(씨 + '|토목|' + o.종류 + '|' + (o.이름 || '') + '|' + o.id)
      const 설명 = (o.노선 ? o.노선 + ' ' + (o.측글 || '') : o.구조물 || (o.건물 ? o.건물 + ' ' + (o.층 || '') : '')) + (o.크기 ? ' · ' + o.크기 : '')
      let e
      if (o.종류 === '지형') e = 넣('IFCGEOGRAPHICELEMENT(' + 글자(아이디) + ',' + 이력 + ',' + 글자(o.이름 || '땅') + ',' + 글자('측량점 삼각망') + ',$,' + 자리 + ',' + 꼴정의 + ',$,.TERRAIN.)')
      else if (o.종류 === '구조물' && o.부분 === '벽') e = 넣('IFCWALL(' + 글자(아이디) + ',' + 이력 + ',' + 글자(o.이름) + ',' + 글자(설명) + ',' + 글자('구조물 벽') + ',' + 자리 + ',' + 꼴정의 + ',$,.STANDARD.)')
      else if (o.종류 === '구조물' && o.부분 === '바닥') e = 넣('IFCSLAB(' + 글자(아이디) + ',' + 이력 + ',' + 글자(o.이름) + ',' + 글자(설명) + ',' + 글자('구조물 바닥판') + ',' + 자리 + ',' + 꼴정의 + ',$,.BASESLAB.)')
      else if (o.종류 === '구조물' && o.부분 === '덮개') e = 넣('IFCSLAB(' + 글자(아이디) + ',' + 이력 + ',' + 글자(o.이름) + ',' + 글자(설명) + ',' + 글자('구조물 덮개 슬래브') + ',' + 자리 + ',' + 꼴정의 + ',$,.ROOF.)')   // 🧾 G402
      else if (o.종류 === '건물' && o.부분 === '벽') e = 넣('IFCWALL(' + 글자(아이디) + ',' + 이력 + ',' + 글자(o.이름) + ',' + 글자(설명) + ',' + 글자('건물 벽(평면 개략)') + ',' + 자리 + ',' + 꼴정의 + ',$,.STANDARD.)')
      else if (o.종류 === '건물' && o.부분 === '바닥') e = 넣('IFCSLAB(' + 글자(아이디) + ',' + 이력 + ',' + 글자(o.이름) + ',' + 글자(설명) + ',' + 글자('건물 바닥판(평면 개략)') + ',' + 자리 + ',' + 꼴정의 + ',$,' + (/지붕/.test(o.이름 || '') ? '.ROOF.' : '.FLOOR.') + ')')
      else e = 넣('IFCBUILDINGELEMENTPROXY(' + 글자(아이디) + ',' + 이력 + ',' + 글자(o.이름) + ',' + 글자(설명) + ',' + 글자(토목이름[o.종류] || o.종류) + ',' + 자리 + ',' + 꼴정의 + ',$,.NOTDEFINED.)')
      담.push(e)
      const 양 = []
      if (o.부피 > 0) 양.push(넣("IFCQUANTITYVOLUME('GrossVolume'," + 글자('3D 부피') + ',$,' + 실수(쉼(o.부피, 4)) + ',$)'))
      for (const [k, v] of Object.entries(o.몫 || {})) {
        if (!Number.isFinite(v)) continue
        양.push(k === '거푸집'
          ? 넣('IFCQUANTITYAREA(' + 글자(k) + ',' + 글자(k + '(m2)') + ',$,' + 실수(쉼(v, 3)) + ',$)')
          : 넣('IFCQUANTITYVOLUME(' + 글자(k) + ',' + 글자(k + '(m3)') + ',$,' + 실수(쉼(v, 4)) + ',$)'))
      }
      if (양.length) {
        const 묶 = 넣('IFCELEMENTQUANTITY(' + 글자(고유번호(아이디 + '|qto')) + ',' + 이력 + ",'Qto_KconmapQuantities'," + 글자('K-건설맵 물량') + ',' + 글자(o.노선 ? '평균단면법 몫' : '개략') + ',(' + 양.join(',') + '))')
        넣('IFCRELDEFINESBYPROPERTIES(' + 글자(고유번호(아이디 + '|rel')) + ',' + 이력 + ',$,$,(' + e + '),' + 묶 + ')')
      }
    }
    if (담.length) 넣('IFCRELCONTAINEDINSPATIALSTRUCTURE(' + 글자(고유번호(씨 + '|contain|site')) + ',' + 이력 + ',$,$,(' + 담.join(',') + '),' + 대지 + ')')
  }
  const 머리 = [
    'ISO-10303-21;',
    'HEADER;',
    "FILE_DESCRIPTION(('ViewDefinition [ReferenceView_V1.2]'),'2;1');",
    'FILE_NAME(' + 글자(정보.파일 || 'k-conmap-bim.ifc') + ",'" + 때 + "',(''),('K-conmap'),'K-conmap BIM 1.0','K-conmap BIM','');",
    "FILE_SCHEMA(('IFC4'));",
    'ENDSEC;',
    'DATA;',
  ]
  return 머리.concat(줄, ['ENDSEC;', 'END-ISO-10303-21;', '']).join('\n')
}
