/**
 * 🔎 읽기 점검 — 파일마다 «도형 종류별 개수 · 읽음 · 못 읽음(까닭)» 표 (🧭 G245 — 2026-10-11)
 *
 * 소장님: 「도면에 다 있어. 근데, 클로드가 못 읽고 있는 거지」 · 「캐드만 확실히 읽으면 돼」 · 「1번 부터 시작해」
 *   → 1번 = 캐드 빈틈 메우기 + 파일마다 종류별 개수 표(전체 / 읽음 / 못 읽음). 짐작이 아니라 «무엇을 몇 개 못 읽었는지» 를 보여 드림.
 *
 * ■ 셈은 골조 읽개(골조도면.js 도면읽기)의 stats 로 합니다 — 파일 속(블록 정의 안까지) 종류별 개수 · 배치(종이) 공간 · 숨긴 층 · 안 보이게 한 것 · 없는 블록.
 * ■ DWG 로 넣었으면 바꾸기 일꾼(dwgdxf.worker.js)이 DWG 원본을 직접 센 개수(원본)와 견줘 «바꾸며 빠진 것» 도 봅니다.
 */

/** 도형 종류 → 우리말 */
export const 종류말 = {
  LINE: '선', LWPOLYLINE: '폴리선', POLYLINE: '폴리선(옛)', CIRCLE: '원', ARC: '호', ELLIPSE: '타원', SPLINE: '곡선(스플라인)',
  SOLID: '채움(2D 면)', TRACE: '굵은 선', LEADER: '지시선', MULTILEADER: '다중 지시선', MLEADER: '다중 지시선', HATCH: '해치(무늬 · 채우기)',
  TEXT: '글자', MTEXT: '여러 줄 글자', ATTRIB: '블록 속성 값', ATTDEF: '속성 정의', DIMENSION: '치수', ARC_DIMENSION: '호 치수',
  LARGE_RADIAL_DIMENSION: '큰 반지름 치수', INSERT: '블록', '3DFACE': '3D 면', MESH: '메쉬', ACAD_TABLE: '표', POINT: '점',
  WIPEOUT: '가림막', VIEWPORT: '화면틀', XLINE: '끝없는 보조선', RAY: '반쪽 보조선', IMAGE: '그림 파일', OLE2FRAME: '끼운 그림(OLE)',
  OLEFRAME: '끼운 그림(OLE)', REGION: '영역(입체 자료)', '3DSOLID': '입체', BODY: '입체', SURFACE: '곡면', PLANESURFACE: '곡면',
  EXTRUDEDSURFACE: '곡면', LOFTEDSURFACE: '곡면', REVOLVEDSURFACE: '곡면', SWEPTSURFACE: '곡면', NURBSURFACE: '곡면',
  TOLERANCE: '기하 공차', SHAPE: '모양 기호', MLINE: '여러 겹 선', HELIX: '나선', UNDERLAY: '밑그림(PDF · DWF)',
  PDFUNDERLAY: '밑그림(PDF)', DWFUNDERLAY: '밑그림(DWF)', DGNUNDERLAY: '밑그림(DGN)', SECTIONOBJECT: '단면 객체',
  ACAD_PROXY_ENTITY: '대리 도형(다른 프로그램 것)', LIGHT: '조명', SUN: '해',
}

/** 골조 읽개가 읽는 종류 */
const 읽는 = new Set(['LINE', 'LWPOLYLINE', 'POLYLINE', 'CIRCLE', 'ARC', 'ELLIPSE', 'SPLINE', 'SOLID', 'TRACE', 'LEADER', 'MULTILEADER', 'MLEADER',
  'HATCH', 'TEXT', 'MTEXT', 'ATTRIB', 'ATTDEF', 'DIMENSION', 'ARC_DIMENSION', 'LARGE_RADIAL_DIMENSION', 'INSERT', '3DFACE', 'MESH', 'ACAD_TABLE', 'POINT'])

/** 셀 것이 없는 종류(읽었지만 길이 · 넓이 · 글자가 없음) — 까닭 */
const 셀것없음 = {
  WIPEOUT: '밑을 가리는 흰 판 — 셀 것 없음', VIEWPORT: '배치의 화면틀 — 셀 것 없음', XLINE: '그릴 때 쓰는 끝없는 보조선 — 셀 것 없음',
  RAY: '그릴 때 쓰는 보조선 — 셀 것 없음', LIGHT: '조명 — 셀 것 없음', SUN: '해 — 셀 것 없음',
}

/** 못 읽는 종류 — 까닭(무엇을 하면 되는지) */
const 못까닭 = {
  IMAGE: '사진 · 스캔 그림이라 선 · 글자가 아님 — 그림 속 글자는 PDF 를 같이 넣으면 거기서 읽음',
  OLE2FRAME: '끼워 넣은 그림(로고 · 표 그림) — 선 · 글자가 아님', OLEFRAME: '끼워 넣은 그림 — 선 · 글자가 아님',
  REGION: '입체 자료(ACIS)가 DXF 에 없음 — 캐드에서 EXPLODE 하면 선이 됨', '3DSOLID': '입체 자료(ACIS) — 캐드에서 EXPLODE 하면 선이 됨',
  BODY: '입체 자료(ACIS)', SURFACE: '곡면 자료(ACIS)', PLANESURFACE: '곡면 자료(ACIS)', EXTRUDEDSURFACE: '곡면 자료(ACIS)',
  LOFTEDSURFACE: '곡면 자료(ACIS)', REVOLVEDSURFACE: '곡면 자료(ACIS)', SWEPTSURFACE: '곡면 자료(ACIS)', NURBSURFACE: '곡면 자료(ACIS)',
  TOLERANCE: '기하 공차 기호', SHAPE: 'SHX 모양 기호', MLINE: '여러 겹 선(MLINE) — 캐드에서 EXPLODE 하면 선이 됨',
  ACAD_PROXY_ENTITY: '다른 프로그램(건축 · 토목 전용)이 만든 도형 — 그 프로그램 없이는 모양만 보임',
  PDFUNDERLAY: '밑그림으로 붙인 PDF — PDF 를 따로 넣어 주십시오', DWFUNDERLAY: '밑그림(DWF)', DGNUNDERLAY: '밑그림(DGN)', UNDERLAY: '밑그림',
}

/** DWG 원본 종류 이름(LibreDWG) → DXF 종류 */
export function 원본종류(k) {
  if (/^DIMENSION_/.test(k)) return 'DIMENSION'
  if (/^POLYLINE_/.test(k)) return 'POLYLINE'
  if (/^(VERTEX|SEQEND|BLOCK|ENDBLK)/.test(k)) return ''
  if (k === 'TABLE') return 'ACAD_TABLE'
  if (k === 'OLEFRAME') return 'OLE2FRAME'
  if (k === 'PROXY_ENTITY' || k === 'UNKNOWN_ENT') return 'ACAD_PROXY_ENTITY'
  return k
}

const 쉼 = (n) => Number(n || 0).toLocaleString('ko-KR')

/**
 * 표 만들기
 * @param stats 골조도면.도면읽기(…).stats
 * @param 원본 DWG 원본 종류별 개수(바꾸기 일꾼 info.원본) — 없으면 null
 * @returns {{줄: {종류, 이름, 수, 상태: '읽음'|'셀 것 없음'|'못 읽음', 까닭}[], 합: {전체, 읽음, 없음, 못}, 뺌: string[], 빠짐: string[], 글: string}}
 */
export function 점검표(stats, 원본 = null) {
  const 줄 = []
  const 합 = { 전체: 0, 읽음: 0, 없음: 0, 못: 0 }
  const 파일속 = (stats && stats.파일속) || {}
  for (const [t, n] of Object.entries(파일속).sort((a, b) => b[1] - a[1])) {
    let 상태, 까닭 = ''
    if (t === 'ATTDEF') { 상태 = '읽음'; 까닭 = '고정 속성은 글자로 · 바뀌는 속성은 값(블록 속성)으로 읽음' }
    else if (읽는.has(t)) 상태 = '읽음'
    else if (셀것없음[t]) { 상태 = '셀 것 없음'; 까닭 = 셀것없음[t] }
    else { 상태 = '못 읽음'; 까닭 = 못까닭[t] || '이 프로그램이 모르는 종류' }
    if (상태 === '못 읽음' && stats.못층 && stats.못층[t]) {
      const 층 = Object.entries(stats.못층[t]).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([l]) => l)
      if (층.length) 까닭 += ' · 층: ' + 층.join(', ')
    }
    줄.push({ 종류: t, 이름: 종류말[t] || t, 수: n, 상태, 까닭 })
    합.전체 += n
    if (상태 === '읽음') 합.읽음 += n; else if (상태 === '셀 것 없음') 합.없음 += n; else 합.못 += n
  }
  /* 그리지 않은 것(파일에는 있으나 캐드 화면에도 안 보이는 것) */
  const 뺌 = []
  if (stats && stats.hidden) 뺌.push('꺼 두거나 얼린 층에 그려진 것 ' + 쉼(stats.hidden) + '번(블록으로 여러 번 넣은 것 포함) — 캐드 화면에도 안 보여 셈에서 뺌')
  /* 🧭 G246 인쇄 안 하는 층은 화면에 보이므로 읽음 — 알리기만 */
  if (stats && stats.인쇄안함) 뺌.push('인쇄 안 하는 층(화면에는 보임)에 그려진 것 ' + 쉼(stats.인쇄안함) + '번 — 읽음(PDF 로 뽑으면 안 찍힘 · 부재 이름표가 이 층에 있는 도면이 있음)')
  if (stats && stats.안보임) 뺌.push('안 보이게 한 도형 ' + 쉼(stats.안보임) + '번 — 캐드에도 안 보여 뺌')
  if (stats && stats.배치) {
    const 글 = Object.entries(stats.배치종류 || {}).filter(([t]) => t !== 'VIEWPORT').reduce((a, [, n]) => a + n, 0)
    뺌.push(글 ? '배치(종이) 공간 도형 ' + 쉼(stats.배치) + '개 — 표제란 · 범례 · 주기(모형 공간의 도면과 좌표가 달라 물량엔 안 씀)' : '배치(종이) 공간 화면틀 ' + 쉼(stats.배치) + '개 — 셀 것 없음')
  }
  const 없는 = Object.entries((stats && stats.없는블록) || {})
  if (없는.length) 뺌.push('모양 정의가 빠진 블록 ' + 없는.length + '종(' + 쉼(없는.reduce((a, [, n]) => a + n, 0)) + '번 넣음): ' + 없는.slice(0, 4).map(([k]) => k).join(', ') + (없는.length > 4 ? ' …' : '') + ' — 그 모양은 못 그림')
  /* 🧭 G246 점이 다 차도 글자 · 판 테두리는 끝까지 읽음(전엔 거기서 읽기를 멈췄음) — 모양을 못 담은 도형 수를 알림 */
  /* 🧭 G246 구조 판 다시 읽기 */
  if (stats && stats.판만 && stats.판만.length) 뺌.push('점이 다 찬 뒤의 구조 판 ' + stats.판만.length + '장(' + stats.판만.slice(0, 4).join(' · ') + (stats.판만.length > 4 ? ' …' : '') + ')은 모양까지 다시 읽어 물량에 씀' + (stats.더못 ? ' — 그래도 다 못 담은 도형 ' + 쉼(stats.더못) + '개' : ''))
  if (stats && stats.capped) 뺌.push('도형이 아주 많아(점 600만 개 넘음) 뒤쪽 도형 ' + 쉼(stats.못그림 || 0) + '개는 모양(선 · 원)을 못 담음 — 글자 · 판 테두리는 끝까지 읽어 판 목록에 넣음(모양이 없는 판의 글자' + (stats.판만 ? '' : ' ' + 쉼(Math.max(0, (stats.글수 || 0) - (stats.캡글 || 0))) + '개') + '는 물량에 안 씀). 그 판의 물량이 필요하면 그 판만 따로 저장해 넣어 주십시오')
  /* DWG 원본과 견줌 — 바꾸며 빠진 것 */
  const 빠짐 = []
  if (원본) {
    const 원 = {}
    for (const [k, n] of Object.entries(원본)) { const t = 원본종류(k); if (t) 원[t] = (원[t] || 0) + n }
    for (const [t, n] of Object.entries(원)) {
      const d = (파일속[t] || 0) + ((stats && stats.배치종류 && stats.배치종류[t]) || 0)
      if (d < n) 빠짐.push((종류말[t] || t) + ' ' + 쉼(n - d) + '개(원본 ' + 쉼(n) + ' → ' + 쉼(d) + ')')
    }
  }
  const 글 = '도형 ' + 쉼(합.전체) + '개 — 읽음 ' + 쉼(합.읽음) + (합.없음 ? ' · 셀 것 없음 ' + 쉼(합.없음) : '') + ' · 못 읽음 ' + 쉼(합.못) +
    (빠짐.length ? ' · DWG 바꾸며 빠짐: ' + 빠짐.join(', ') : '')
  return { 줄, 합, 뺌, 빠짐, 글 }
}
