/**
 * 📦 도면 물량 «전부» — 도면을 넣으면 누르지 않고 모든 물량을 한꺼번에 (2026-09-27)
 *
 * 소장님: 「토목이든, 건축이든. 도면을 주면 관련된 물량을 전부 뽑아주는 걸로 만들어줘. 모두 자동으로..
 *         도면 넣으면 모든 물량이 나오게… 그럼, 내역서 물량이랑 대조해 볼 수 있잖아」
 *
 * ■ 도면자동.js(표·토공·세기) 위에 얹어 «사람이 고르던 것» 을 스스로 고릅니다.
 *   ① 레이어 뜻   : 레이어 이름으로 무엇인지 짐작(우수관·측구·경계석·포장·잔디…) → 길이(m)·면적(m²)
 *                   치수·글자·도곽·중심선 같은 «주석 레이어» 는 뺍니다. 뜻을 모르는 레이어는 목록에만(산출서엔 안 넣음)
 *   ② 블록        : 주석 블록(방위·도곽·화살·단면 표시…)을 뺀 모든 블록의 개수 — 이름으로 품명 짐작(맨홀·집수정·가로등·수목…)
 *   ③ 기호 글자   : WD1·AW1·C1·MH-3 처럼 생긴 글자의 개수 (표 안의 글자는 빼고) — 창호일람표가 있으면 창호로
 *   ④ 실(방)      : 실 이름 글자(사무실·거실·화장실…)를 품은 가장 작은 닫힌 선 → 면적·둘레
 *   ⑤ 마감        : 실내재료마감표가 있으면 실마다 바닥·걸레받이·벽·천장 마감 면적(lib/마감.js 의 셈 그대로)
 *   ⑥ 창호        : 창호일람표 수량과 평면의 창호 기호 개수를 맞춰 봄
 * ■ «짐작» 은 늘 근거와 함께 돌려줍니다(레이어 이름·블록 이름·몇 개). 사람이 산출서에서 빼거나 품명을 고칠 수 있게.
 * ■ 시험: node tools/시험_도면전부.mjs (가상 예시 도면 둘)
 */
import { 종류 } from './골조도면.js'
import { 세기, 도형상자, 글자폭, 붙임, 숫자인가 } from './도면자동.js'
import { 마감표읽기, 창호표읽기, 셈 as 마감셈 } from './마감.js'
import { 구간표읽기, 속성단면 } from './단면표.js'
import { 벽방찾기, 막는도형, 막는토막, 층방들, 벽상자, 방문들, 방나누기, 안 as 고리안 } from './방찾기.js'

const 글 = (x) => String(x ?? '').trim()
const 셋 = (v) => Math.round(v * 1000) / 1000
const 짧 = (v) => { const r = Math.round(v * 10000) / 10000; return String(Object.is(r, -0) ? 0 : r) }

/* ───────────────────────────── ① 이름으로 뜻 짐작 */

/** 주석(물량이 아닌) 레이어 — 치수·글자·도곽·중심선·그리드·인출선·범례… */
const 주석층 = /(치수|DIM|TEXT|TXT|문자|글자|주기|NOTE|도곽|TITLE|BORDER|FRAME|SHEET|FORM|DEFPOINTS|VPORT|VIEWPORT|중심|CEN(TER)?|^CL$|^C-?L\b|GRID|통심|축선|인출|LEADER|해설|범례|LEGEND|방위|NORTH|좌표|COORD|표$|TABLE|TBL|심볼|SYMB?|기준선|보조|CONST|참고|REF|MARK|HATCH|해치|패턴|PATTERN|LOGO|로고|STAMP|결재|날인|^0$|^\*|X-?REF|IMAGE|그림|사진|PHOTO|VIEW|뷰|CUT|절단|단면선|SECT|상세표시|DETAIL|LEVEL|레벨|EL\b|고저|측점|STA|NO\.)/i
/** 주석 블록 — 방위·도곽·화살·단면·상세 표시·레벨·그리드 기호… */
const 주석블록 = /(방위|NORTH|도곽|TITLE|FRAME|BORDER|SHEET|화살|ARROW|TICK|^_|DOT|DIM|치수|레벨|LEVEL|^EL|단면|SECT|상세|DETAIL|기호|SYMB|MARK|TAG|GRID|통심|축|좌표|COORD|로고|LOGO|NOTE|범례|LEGEND|표$|TABLE|^A\$C|^\*|STA|측점|결재|STAMP|날인|스케일|SCALE|ORIGIN|기준점|BENCH|B\.?M|구배|경사|SLOPE|FALL|방향|DIR|CUTLINE|절단|BREAK|파단|REV|개정)/i

/** [정규식, 품명, 종류('길이'|'면적'|'개수'), 갈래] — 위에서부터 먼저 맞는 것 */
const 뜻표 = [
  // 관로 (길이)
  [/배수관|DRAIN/i, '배수관로', '길이', '토목'],
  [/우수|STORM|RAIN|빗물관|SD-?P/i, '우수관로', '길이', '토목'],
  [/오수|하수|SEWER|SS-?P/i, '오수관로', '길이', '토목'],
  [/상수|급수|용수|WATER|W-?PIPE/i, '상수관로', '길이', '설비'],
  [/가스|GAS/i, '가스관', '길이', '설비'],
  [/전선관|전력|케이블|CABLE|통신|TELE|전기관로|배선/i, '전선관로', '길이', '전기'],
  [/관로|PIPE|배관|흄관|HUME|PE관|PVC관|VR관|주철관|강관/i, '관로', '길이', '토목'],
  [/측구|L형|U형|GUTTER|DITCH|도랑/i, '측구', '길이', '토목'],
  [/경계석|연석|CURB|보차도/i, '경계석', '길이', '토목'],
  [/가드레일|방호울타리|방호책|G\.?R\b|GUARD/i, '방호울타리', '길이', '토목'],
  [/차선|노면표시|LANE|도색/i, '차선도색', '길이', '토목'],
  [/울타리|펜스|휀스|FENCE|담장/i, '울타리', '길이', '토목'],
  [/옹벽|RETAIN/i, '옹벽', '길이', '토목'],
  [/배수로|수로|개거|암거|CULVERT|CHANNEL|트렌치|TRENCH/i, '배수로', '길이', '토목'],
  [/난간|HANDRAIL|RAILING/i, '난간', '길이', '건축'],
  [/방음벽|NOISE/i, '방음벽', '길이', '토목'],
  // 면적
  [/아스콘|아스팔트|ASCON|ASP/i, '아스콘 포장', '면적', '토목'],
  [/콘크리트\s*포장|CON'?C?-?PAV|CONC.*PAV/i, '콘크리트 포장', '면적', '토목'],
  [/보도블|블[록럭]|투수|INTERLOCK|PAVER/i, '블록 포장', '면적', '토목'],
  [/포장|PAVE/i, '포장', '면적', '토목'],
  [/잔디|SOD|GRASS|TURF/i, '잔디', '면적', '조경'],
  [/녹지|식재|조경|PLANT|LANDSC/i, '식재 면적', '면적', '조경'],
  [/데크|DECK/i, '데크', '면적', '건축'],
  [/방수|WATERPROOF/i, '방수', '면적', '건축'],
  [/단열|INSUL/i, '단열', '면적', '건축'],
  [/지붕|ROOF/i, '지붕', '면적', '건축'],
]
const 블록뜻표 = [
  [/맨홀|MH|MAN.?HOLE/i, '맨홀'],
  [/집수정|빗물받이|우수받이|CATCH|INLET|GULLY/i, '집수정·빗물받이'],
  [/가로등|보안등|투광|LIGHT|LAMP|등기구|조명|LUMIN/i, '조명·가로등'],
  [/소화전|HYDRANT/i, '소화전'],
  [/표지|SIGN/i, '표지판'],
  [/볼라드|BOLLARD|车止/i, '볼라드'],
  [/벤치|BENCH|퍼걸러|파고라|PERGOLA|정자|쉘터|SHELTER|휴지통|음수대|평상/i, '벤치·시설물'],   // 🧭 G363 조경 시설물
  [/교목|관목|수목|TREE|SHRUB|소나무|느티|벚|은행|단풍|이팝|배롱|회양|철쭉|영산홍|사철|주목|향나무|메타|왕벚|산수유|화살나무/i, '수목'],
  [/대변기|양변기|좌변기|소변기|세면기|세면대|싱크|욕조|샤워|청소용|WC|URINAL|LAV|TOILET|BASIN/i, '위생기구'],
  [/콘센트|스위치|OUTLET|SWITCH|RECEPT/i, '전기 기구'],
  [/스프링클러|SPRINK|감지기|DETECT|유도등|비상등/i, '소방 기구'],
  [/파일|PILE/i, '파일'],
  [/앵커|ANCHOR/i, '앵커'],
  [/문|DOOR|^D\d/i, '문'],
  [/창|WIN|^W\d/i, '창'],
  [/기둥|COL/i, '기둥'],
  [/주차|PARK/i, '주차 구획'],
]
/** 레이어 이름 → {품명, 종, 갈래} · 주석이면 {주석:true} · 모르면 null */
export function 레이어뜻(이름) {
  const 원 = 글(이름)
  const 참조 = /\|/.test(원)                                 // 🧭 G132 끼워 넣은 외부참조 «xref-○○|레이어»
  const t = 원.replace(/^.*\|/, '').replace(/^.*\$0\$/, '')   // 바인드된 외부참조 «XR 평면도$0$WALL» → «WALL»
  if (!t) return null
  /* 🧭 G132 — 맨홀 · 받이 · 정화조 · 전주 같은 «점 시설» 레이어의 선은 기호 그림 → 길이로 안 셈(블록 개수로 셈) */
  if (점시설층.test(t)) return { 주석: true, 점시설: true }
  const 현황 = 현황층.test(t)
  const 계획 = 계획층.test(t)
  for (const [re, 품명, 종, 갈래] of 뜻표) if (re.test(t)) return { 품명, 종, 갈래, 현황, 참조: 참조 && !계획 }
  if (주석층.test(t)) return { 주석: true }
  return null
}
/** 점 시설(기호로 그리는 것) — 레이어 선 길이는 뜻이 없음 */
const 점시설층 = /맨홀|MAN.?HOLE|^MH|받이|집수정|INLET|CATCH|GULLY|정화조|계량기|소화전|제수변|지수전|전주|통신주|가로등|표지판|신호등|반사경|볼라드|CCTV|의자|비석|대문|관정|수목|나무|TREE/i
/** 현황(있는 것) · 철거 — 새로 할 물량이 아님 */
const 현황층 = /현황|기존|EXIST|철거|DEMO|지형|지적|측량|수치지도/i
/** 🧭 G363 묶음 블록 이름(수목군A · 화장실세트 · TREE_GROUP) */
const 묶음말 = /(군|세트|^SET|SET$|[-_ ]SET|GROUP|묶음|모음|그룹)/i
/** 외부참조(바탕도) 안에서도 «계획» 으로 볼 이름 */
const 계획층 = /계획|신설|설계|PLAN|NEW|^#/i
/** 블록 이름 → {품명} · 주석이면 {주석:true} */
export function 블록뜻(이름) {
  const t = 글(이름)
  if (!t || /^\*/.test(t)) return { 주석: true }
  if (/^XREF|^XR[ _]|\$0\$|\uFFFD|^[A-Z]?\d{0,3}$/i.test(t)) return { 주석: true }   // 외부참조·바인드·깨진 이름·한두 글자 이름
  if (주석블록.test(t)) {
    for (const [re, 품명] of 블록뜻표) if (re.test(t) && !/기호|SYMB|MARK|TAG|표시/.test(t)) return { 품명 }
    return { 주석: true }
  }
  for (const [re, 품명] of 블록뜻표) if (re.test(t)) return { 품명 }
  return { 품명: '' }
}

/* ───────────────────────────── ③ 기호 글자 */

/** 기호처럼 생긴 글자 — WD1 · AW-2 · C1 · MH-3 · SD1A (그리드 X1·Y1·①은 뺌) */
export function 기호인가(s) {
  const t = 붙임(s).toUpperCase()
  if (!/^[A-Z]{1,4}-?\d{1,3}[A-Z]?$/.test(t)) return false
  if (/^[XY]\d{1,2}$/.test(t)) return false                         // 통심선 기호
  if (/^(STA|NO|EL|GL|FL|SL|KS|FH|CH)/.test(t)) return false         // 측점·높이
  if (/^(D|HD|SD|SHD|UHD|H)\d{2}$/.test(t)) return false             // 철근 규격 D13·H13
  if (/^D\d{3,4}$/.test(t)) return false                              // 지름 D800 (원형 기둥·관)
  if (/^(M|MM|CM|KM|KG|EA|T|R|Φ)\d/.test(t)) return false            // 단위·두께·반지름
  if (/^[A-Z]{1,2}-\d{3,4}$/.test(t)) return false                  // 도면 번호 A-171 · S-101 · C-005
  if (/^B\d{1,2}F$|^\d{1,2}F$|^PH\d?F?$|^RF$/.test(t)) return false   // 층 표시 B1F · 2F
  if (/^(SS|SM|SMA|SHP|SHN|SN|STK|STKR|SPS|SPHC|SGT|SWS|SNT|SD|SHD|HSB|HSA|ACI|KS|KDS|KCS|ASTM|ISO|JIS|DIN|F\d+T|C|H)\d{3}/.test(t)) return false  // 재질·규격 SS275 · SD400 · ACI318
  if (/^F\d+T$/.test(t)) return false                                // 고장력 볼트 F10T
  return true
}
const 기호뜻 = [
  [/^(WD|SD|AD|FD|PD|SSD|D)\d/, '문'], [/^(AW|SW|PW|WW|CW|W)\d/, '창'], [/^(C|TC)\d/, '기둥'], [/^(G|TG|WG|B|TB|CG|CB)\d/, '보'],
  [/^(S|TS|DS)\d/, '슬라브'], [/^(F|MF|PF)\d/, '기초'], [/^(MH)/, '맨홀'], [/^(ST)\d/, '계단'], [/^(P)\d/, '파일·기둥'],
]
/** 구조 부재 기호(C1·G1·S1…)는 한 부재에 글자가 여러 장(주심도·보 평면·일람)에 나올 수 있어 «개수» 로 믿기 어려움 → 처음엔 꺼 둠 */
const 구조기호 = new Set(['기둥', '보', '슬라브', '기초', '계단', '파일·기둥'])
function 기호풀이(t) { for (const [re, n] of 기호뜻) if (re.test(t.replace(/-/g, ''))) return n; return '' }

/* ───────────────────────────── ④ 실(방) */

const 실말 = /(실|방|룸|홀|로비|복도|계단|현관|거실|주방|식당|욕실|화장실|변소|샤워|창고|발코니|베란다|다용도|드레스|파우더|세탁|보일러|펌프|물탱크|사무|회의|휴게|탕비|대기|상담|객장|금고|숙직|경비|강당|교실|병실|진료|주차|램프|승강기|엘리베이터|E\/?V|PIT|피트|덕트|DUCT|포치|테라스|옥탑|다락|알파|안방|부엌|취사|식품|매장|점포|공용|로비|통로|전실|부속|탈의|목욕|헬스|체력|열람|도서|자료|서고|전산|서버|통신|방재|중앙|관리|인감|문서고|근린|생활시설|판매시설|업무시설|의료시설|교육시설|운동시설|공장|작업장|상가|매점|카페|ROOM|HALL|LOBBY|CORR|OFFICE|TOILET|STOR|KITCHEN|BED|LIVING|BATH)/i
const 실아님 = /(소방|설비|통신설비|전기설비|새마을금고|공사|현장|주식회사|㈜|건축사|사무소$|구조|토목|조경|허가|준공|지붕|대지|도로|부지|경계|인접|건축선|옥외|외부|평면|단면|입면|배치|도면|축척|SCALE|표$|일람|범례|주기|비고|마감|재료|규격|수량|기준|상세|계획|위치|구조|설비|전기|기계설비|소방설비|NOTE|TYPE|타입|참조|참고|S=|1\/\d|방향|방수층|방수턱|계단참|UP|DN|DOWN|\d+층$|설치$|셔터|방범|[겔갤]러리월|무빙월|^월$)/i
/** 실 이름 글자인가 (마감표에 적힌 실 이름이면 무조건) */
export function 실이름인가(s, 아는이름) {
  const t = 붙임(s)
  if (!t || t.length > 14 || 숫자인가(t)) return false
  if (아는이름 && 아는이름.has(실키(t))) return true
  if (!/[가-힣A-Za-z]/.test(t)) return false
  if (실아님.test(t)) return false
  if ((t.match(/[가-힣]/g) || []).length > 8) return false          // 긴 글(공사 이름 등)은 실 이름으로 안 봄
  return 실말.test(t)
}
/** 실 이름 비교 열쇠 — 띄어쓰기·끝 번호·괄호 떼고 («침실2» ↔ «침실», «화장실(남)» ↔ «화장실») */
export function 실키(s) { return 붙임(s).replace(/\(.*?\)/g, '').replace(/[-_]?\d+$/, '').replace(/[·./]/g, '').toUpperCase() }   // 🧱 G462 «/» 도 뗌(«E/V HALL» ↔ «E.V HALL»)

/** 점이 도형 e 의 안인가 (Q 조각들 짝홀) */
function 안인가(모델, 조각, x, y) {
  const { Q, P } = 모델
  let inside = false
  for (const q of 조각) {
    const s = Q.p0[q], n = Q.pn[q]
    for (let k = 0, j = n - 1; k < n; j = k++) {
      const xi = P[(s + k) * 2], yi = P[(s + k) * 2 + 1], xj = P[(s + j) * 2], yj = P[(s + j) * 2 + 1]
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
    }
  }
  return inside
}
const 닫힌종 = new Set([종류.닫힌폴리선, 종류.원, 종류.해치, 종류.채움, 종류.곡선])
/** 점이 방 안인가 — 벽으로 찾은 방(다각형)이면 그 다각형 · 닫힌 선 방이면 그 선 */
export function 방안(모델, r, x, y) { return r.다각형 ? 고리안(r.다각형, x, y) : 안인가(모델, r.qs, x, y) }

/** 닫힌 도형 목록(상자·조각) — 한 번 만들어 여러 번 씀 */
export function 닫힌도형들(모델, 끈층, k, 상자) {
  const { E, Q, layers } = 모델
  const B = 상자 || 도형상자(모델)
  const 조각 = new Map()
  for (let q = 0; q < Q.e.length; q++) { const e = Q.e[q]; if (!닫힌종.has(E.t[e])) continue; const a = 조각.get(e); if (a) a.push(q); else 조각.set(e, [q]) }
  const out = []
  for (const [e, qs] of 조각) {
    if (끈층 && 끈층.has(E.ly[e])) continue
    if (!(E.area[e] > 0)) continue
    const ln = (layers[E.ly[e]] || {}).name || ''
    out.push({ e, qs, A: E.area[e] * k * k / 1e6, L: E.len[e] > 0 ? E.len[e] * k / 1000 : NaN, b: [B[e * 4], B[e * 4 + 1], B[e * 4 + 2], B[e * 4 + 3]], 층: ln, 해치: E.t[e] === 종류.해치 || E.t[e] === 종류.채움 })
  }
  out.sort((a, b) => a.A - b.A)
  return out
}
/** (x,y) 를 품은 가장 작은 닫힌 도형 (면적 범위 안) */
function 품은(모델, 도형들, x, y, 최소, 최대, 거르기) {
  for (const d of 도형들) {
    if (d.A < 최소) continue
    if (d.A > 최대) break
    if (x < d.b[0] || x > d.b[2] || y < d.b[1] || y > d.b[3]) continue
    if (거르기 && !거르기(d)) continue
    if (안인가(모델, d.qs, x, y)) return d
  }
  return null
}

/** 평면도 제목 — 「지상 1층 평면도」「2F PLAN」 → 층 이름 */
function 평면층(s) {
  const t = 붙임(s)
  /* 🏠 G298 «평면도» 없이 층 이름만 적은 판 제목(«지하1층/pit» · «지붕») */
  let m0
  if ((m0 = /^지하(\d+)층(\/?PIT|피트)?$/i.exec(t))) return 'B' + m0[1]
  if (/^(지붕|옥상)(층)?$/.test(t)) return 'RF'
  if (/^옥탑(층)?$/.test(t)) return 'PH'
  if (!/(평면도|PLAN)/i.test(t)) return null
  let m
  if ((m = /지하(\d+)층/.exec(t))) return 'B' + m[1]
  if ((m = /^B(\d+)/i.exec(t))) return 'B' + m[1]
  if ((m = /(?:지상)?(\d+)층/.exec(t))) return m[1]
  if ((m = /^(\d+)F/i.exec(t))) return m[1]
  if (/옥탑/.test(t)) return 'PH'
  if (/옥상|지붕/.test(t)) return 'RF'
  return null
}

/**
 * 🧱 G462 판 제목 고르기 — 한 파일에 평면 여러 장(층마다 판 테두리)이면 «같은 판 테두리 안» 의 제목으로 층을 정함
 *   (전엔 가장 가까운 제목 — 제목이 판 오른쪽 아래에 있어 왼쪽 방이 옆 판(아래층) 제목에 더 가까웠음: 현장 Y A-201 2층 E/V HALL → 1층)
 *   판 테두리 = 제목을 품은 닫힌 도형 중 그 방 자리도 품은 가장 작은 것 · 없으면 예전처럼 가장 가까운 제목
 */
function 제목고르개(모델, 도형들, 제목) {
  if (!제목.length) return () => null
  const 큰 = []
  for (const d of 도형들) {
    if (d.A < 20) continue
    const 든 = 제목.filter((t) => t.x >= d.b[0] && t.x <= d.b[2] && t.y >= d.b[1] && t.y <= d.b[3] && 안인가(모델, d.qs, t.x, t.y))
    if (든.length) 큰.push({ d, 든 })
  }
  const 가깝 = (l, x, y) => { let best = Infinity, f = null; for (const t of l) { const dd = Math.hypot(t.x - x, t.y - y); if (dd < best) { best = dd; f = t } } return f }
  return (x, y) => {
    for (const c of 큰) { const b = c.d.b; if (x < b[0] || x > b[2] || y < b[1] || y > b[3] || !안인가(모델, c.d.qs, x, y)) continue; return 가깝(c.든, x, y) }
    return 가깝(제목, x, y)
  }
}

/**
 * 실 찾기
 * @returns [{이름, 층, 면적, 둘레, e, x, y, 글자:[i], 해치}]
 */
/** 공간 안의 것 세기 — 위생기구(층 · 블록 이름) · 승강기 · 계단 선 (첫 꼭짓점이 안에 든 도형 수) */
const 위생말 = /TOIL|BATH|SANI|PLUMB|위생|변기|세면|소변|대변|WC|LAV|URINAL|CLOSET|BASIN/i
const 승강말 = /승강|ELEV|^EV|LIFT/i
const 계단말 = /STAIR|계단|STEP/i
function 안것(모델, f, 토 = null) {
  const { Q, P, E, layers, I } = 모델
  const 수 = { 위생: 0, 승강: 0, 계단: 0, 디딤L: 0 }
  const 본 = new Set()
  for (let q = 0; q < Q.e.length; q++) {
    const e = Q.e[q]
    if (본.has(e)) continue
    const s0 = Q.p0[q]
    const x = P[s0 * 2], y = P[s0 * 2 + 1]
    if (x < f.상자[0] || x > f.상자[2] || y < f.상자[1] || y > f.상자[3]) continue
    본.add(e)
    const ly = (layers[E.ly[e]] && layers[E.ly[e]].name) || ''
    const bn = E.ins[e] >= 0 && I && I[E.ins[e]] ? I[E.ins[e]].name || '' : ''
    const 위 = 위생말.test(ly) || 위생말.test(bn), 승 = 승강말.test(ly) || 승강말.test(bn), 계 = 계단말.test(ly) || 계단말.test(bn)
    if (!위 && !승 && !계) continue
    if (!고리안(f.점, x, y)) continue
    if (위) 수.위생++; if (승) 수.승강++; if (계) 수.계단++
  }
  /* 계단 디딤판 — 공간 안에 홀로 선 막는 선 중 같은 방향 · 같은 길이(50 mm)가 6개 넘게(디딤판을 벽 · 코어 층에 그린 도면) */
  if (토) {
    const 무리 = new Map()
    for (let i = 0; i < 토.length / 4; i++) {
      const ax = 토[i * 4], ay = 토[i * 4 + 1], bx = 토[i * 4 + 2], by = 토[i * 4 + 3]
      if (Math.min(ax, bx) < f.상자[0] || Math.max(ax, bx) > f.상자[2] || Math.min(ay, by) < f.상자[1] || Math.max(ay, by) > f.상자[3]) continue
      const L = Math.hypot(bx - ax, by - ay)
      if (L < 600 || L > 3000) continue
      if (!고리안(f.점, (ax + bx) / 2, (ay + by) / 2)) continue
      const k = Math.round(((Math.atan2(by - ay, bx - ax) * 180) / Math.PI + 180) % 180 / 5) + '|' + Math.round(L / 50)
      무리.set(k, (무리.get(k) || 0) + 1)
    }
    /* 🪜 G299 ③ 디딤판 길이(가장 많은 무리의 길이 = 계단 폭) — 마감 계단 챌판 넓이(폭 × 층 높이)에 씀 */
    for (const [key, n] of 무리) if (n > 수.계단) { 수.계단 = n; 수.디딤L = +key.split('|')[1] * 50 }
  }
  return 수
}
/** 방들을 상자가 d 안으로 붙은 무리(층 하나)로 — [{상자, 방들}] */
function 무리짓기(방들, d) {
  const 무 = 방들.map((r) => ({ 상자: [...r.b], 방들: [r] }))
  for (let 바뀜 = true; 바뀜;) {
    바뀜 = false
    for (let i = 0; i < 무.length && !바뀜; i++) for (let j = i + 1; j < 무.length; j++) {
      const a = 무[i].상자, b = 무[j].상자
      if (a[0] - d > b[2] || b[0] - d > a[2] || a[1] - d > b[3] || b[1] - d > a[3]) continue
      무[i] = { 상자: [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])], 방들: [...무[i].방들, ...무[j].방들] }
      무.splice(j, 1); 바뀜 = true; break
    }
  }
  return 무
}
export function 실찾기(모델, o = {}) {
  const { T, E } = 모델
  const k = o.k || 1
  const 끈 = o.끈층 || new Set()
  const 표글자 = o.표글자 || new Set()
  const 도형들 = o.도형들 || 닫힌도형들(모델, 끈, k, o.상자)
  const 아는 = o.실이름들 ? new Set([...o.실이름들].map(실키)) : null
  const 제목 = []
  for (let i = 0; i < T.s.length; i++) { const f = 평면층(T.s[i]); if (f) 제목.push({ f, x: T.x[i], y: T.y[i] }) }
  const 제목고르기 = 제목고르개(모델, 도형들, 제목)
  const 층고르기 = (x, y) => { const t = 제목고르기(x, y); return t ? t.f : '' }
  /* 실 이름 글 — 보이는 글 + 🧱 G298 숨은 층(Defpoints 등)의 글(설계자가 실 이름을 인쇄 안 하는 층에 적은 평면도) */
  const 이름들 = []
  for (let i = 0; i < T.s.length; i++) {
    const e = T.e[i]
    if (E.t[e] !== 종류.글자) continue
    if (E.sc && (E.sc[e] < 0.5 || E.sc[e] > 2)) continue     // 🧭 G132 축소 사본(위치도) 글자는 뺌
    if (끈.has(E.ly[e]) || 표글자.has(i) || !실이름인가(T.s[i], 아는)) continue
    이름들.push({ s: 글(T.s[i]), x: T.x[i] + 글자폭(T, i) / 2 * Math.cos(T.a[i]), y: T.y[i] + T.h[i] / 2, i, w: 글자폭(T, i), h: T.h[i] || 0, a: T.a[i] || 0 })
  }
  if (o.숨은글 !== false) for (const q of 모델.숨은글 || []) if (실이름인가(q.s, 아는)) 이름들.push({ s: 글(q.s), x: q.x, y: q.y, i: -1, 숨음: true })
  // 실 이름 글자 자리 (먼저 모두) — 한 닫힌 선이 이름을 셋 넘게 품으면 층 외곽선으로 봄
  const 이름자리 = 이름들.map((n) => [n.x, n.y])
  const 외곽판 = new Map()
  const 외곽 = (d) => {
    let v = 외곽판.get(d.e)
    if (v !== undefined) return v
    let n = 0
    for (const [x, y] of 이름자리) { if (x < d.b[0] || x > d.b[2] || y < d.b[1] || y > d.b[3]) continue; if (안인가(모델, d.qs, x, y) && ++n >= 3) break }
    v = n >= 3; 외곽판.set(d.e, v); return v
  }
  const 모음 = new Map()
  for (const nm of 이름들) {
    const cx = nm.x, cy = nm.y
    /* 🧱 G462 이름 글 네 귀 중 셋 넘게 밖인 닫힌 도형은 방이 아님 — 현장 Y «지하수조» 글(1.2 m)이 패널 물탱크 1 m 칸 · 400 받침 띠에 걸쳐 «지하수조 1 ㎡ · 1.4 ㎡» 로 잡혔음 */
    const 귀 = nm.w > 0 && nm.h > 0 ? [[-0.45, -0.4], [0.45, -0.4], [-0.45, 0.4], [0.45, 0.4]].map(([u, v]) => [cx + u * nm.w * Math.cos(nm.a) - v * nm.h * Math.sin(nm.a), cy + u * nm.w * Math.sin(nm.a) + v * nm.h * Math.cos(nm.a)]) : null
    const 글품음 = (x) => !귀 || 귀.filter(([ex, ey]) => ex >= x.b[0] && ex <= x.b[2] && ey >= x.b[1] && ey <= x.b[3] && 안인가(모델, x.qs, ex, ey)).length >= 3
    const d = 품은(모델, 도형들, cx, cy, 0.8, 1500, (x) => (!주석층.test(x.층) || /실|ROOM|AREA|면적/i.test(x.층)) && !/HID|숨은|HIDDEN/i.test(x.층 || '') && !외곽(x) && 글품음(x))     /* 🏠 G298 숨은선 층의 닫힌 선(위층 뚫린 곳 · 천장 윤곽)은 방 경계가 아님 */
    if (!d) continue
    const a = 모음.get(d.e)
    /* 같은 방에 보이는 이름이 있으면 숨은 이름은 덧붙이지 않음(같은 이름을 두 층에 적은 도면) */
    if (a) { if (!a.이름.split('·').includes(nm.s) && !(nm.숨음 && a.보임)) a.이름 += '·' + nm.s; if (nm.i >= 0) { a.글자.push(nm.i); a.보임 = true } continue }
    const 층 = 층고르기(cx, cy)
    모음.set(d.e, { 이름: nm.s, 층, 면적: d.A, 둘레: d.L, e: d.e, x: cx, y: cy, 글자: nm.i >= 0 ? [nm.i] : [], 보임: nm.i >= 0, ...(nm.숨음 ? { 숨은이름: true } : {}), 해치: d.해치, 레이어: d.층, qs: d.qs, b: d.b })
  }
  /* 🧱 G298 벽으로 방 찾기 — 닫힌 선이 없는 이름(벽 선만 그린 평면도) · 면적 표시 층(AREA)의 선만 품은 이름(벽 중심 면적선 — 마감은 안목) */
  let 막토 = null
  const 막토막 = () => {
    if (막토) return 막토
    const 막 = 막는도형(모델)
    let 수 = 0
    for (let e = 0; e < 막.length; e++) if (막[e]) 수++
    막토 = { 수, 토: 수 >= 50 ? 막는토막(모델, 막, k) : null }
    return 막토
  }
  if (o.벽 !== false) {
    const 면적선 = (r) => /AREA|면적/i.test(r.레이어 || '')
    const 찾을 = []
    const 있는 = new Map()             /* 이름 → 그 이름이 든 모음 열쇠 */
    for (const [key, r] of 모음) if (면적선(r)) for (const nm of 이름들) if (nm.x === r.x && nm.y === r.y) 있는.set(nm, key)
    const 든 = new Set([...모음.values()].map((r) => r.x + ',' + r.y))
    for (const nm of 이름들) {
      const 안든 = ![...모음.values()].some((r) => (r.다각형 ? 고리안(r.다각형, nm.x, nm.y) : (nm.x >= r.b[0] && nm.x <= r.b[2] && nm.y >= r.b[1] && nm.y <= r.b[3] && 안인가(모델, r.qs, nm.x, nm.y))))
      if (안든 || 있는.has(nm)) 찾을.push(nm)
    }
    void 든
    if (찾을.length) {
      const { 토 } = 막토막()
      if (토) {
        const R = 벽방찾기(모델, 찾을, { 토막: 토, 칸: 25 / k, 창들: [30000 / k, 60000 / k], 최대넓이: 1500e6 / (k * k) })
        const 벽모음 = new Map()           /* 찾은 다각형(같은 방) → 모음 줄 */
        R.forEach((w, n) => {
          if (!w) return
          const nm = 찾을[n]
          const A = w.넓이 * k * k / 1e6
          if (A < 0.8) return
          const 옛키 = 있는.get(nm)
          const 옛 = 옛키 !== undefined ? 모음.get(옛키) : null
          /* 면적선 방: 벽으로 찾은 안목이 면적선의 60 ~ 105 % 일 때만 바꿈(새면 면적선 그대로) */
          if (옛 && !(A >= 옛.면적 * 0.6 && A <= 옛.면적 * 1.05)) return
          let 줄 = 벽모음.get(w.점)
          if (!줄 && w.같은) for (const [점, r] of 벽모음) if (r.넓이 === w.넓이 && 점.length === w.점.length) { 줄 = r; break }
          if (줄) { if (!줄.이름.split('·').includes(nm.s)) 줄.이름 += '·' + nm.s; if (nm.i >= 0) 줄.글자.push(nm.i); if (옛키 !== undefined) 모음.delete(옛키); return }
          let 층 = 옛 ? 옛.층 : ''
          if (!층 && 제목.length) 층 = 층고르기(nm.x, nm.y)
          const 새 = { 이름: nm.s, 층, 면적: A, 둘레: w.둘레 * k / 1000, e: -1, x: nm.x, y: nm.y, 글자: nm.i >= 0 ? [nm.i] : [], 보임: nm.i >= 0, ...(nm.숨음 ? { 숨은이름: true } : {}),
            해치: false, 레이어: '', 다각형: w.점, b: w.상자, 넓이: w.넓이, 방법: '벽', ...(옛 ? { 면적선: 옛.면적, 면적선e: 옛.e } : {}) }
          if (옛키 !== undefined) 모음.delete(옛키)
          모음.set('w' + n, 새)
          벽모음.set(w.점, 새)
        })
      }
    }
  }
  /* 방 안의 글 — 설계자 면적 글(«35.42 m2» → 검산) · 천장고 글(«CH=2.70» · «2.40») — 보이는 글 + 숨은 글 */
  const 수글들 = []
  for (let i = 0; i < T.s.length; i++) 수글들.push({ s: T.s[i], x: T.x[i] + 글자폭(T, i) / 2 * Math.cos(T.a[i]), y: T.y[i] + T.h[i] / 2 })
  for (const q of 모델.숨은글 || []) 수글들.push(q)
  /* 🏠 G298 ② 층 통째로 — 벽 중심 넓이(설계 «면적» 과 견줌) · 이름 없는 공간(복도 · 화장실 · 계단실 …)도 실로 */
  if (o.벽 !== false && o.빈방 !== false) {
    const 벽방 = [...모음.values()].filter((r) => r.방법 === '벽')
    const { 토 } = 벽방.length ? 막토막() : {}
    if (토) {
      let 빈n = 0
      for (const g of 무리짓기(벽방, 5000 / k)) {
        /* 층 상자 = 이름 든 방들 상자를 벽 선이 이어진 데까지 넓힘(가장자리 방 · 화장실 · 계단이 잘리지 않게) */
        const 상 = 벽상자(토, g.상자, 2000 / k)
        if ((상[2] - 상[0]) * k > 200000 || (상[3] - 상[1]) * k > 200000) continue
        const F = 층방들(모델, 상, { 토막: 토, 칸: 25 / k, 여유: 3000 / k, 최소넓이: 0.8e6 / (k * k), 벽반: 120 / k, 깎기: 150 / k })
        const 쓴 = new Set()
        const 덩방 = new Map()                 /* 덩이 → 그 안에 이름이 든 방들 */
        for (const r of 모음.values()) {
          const id = F.어디(r.x, r.y)
          if (id < 0) continue
          쓴.add(id)
          const l = 덩방.get(id); if (l) l.push(r); else 덩방.set(id, [r])
          const f = F.방들[id]
          if (r.방법 === '벽' && Math.abs(f.넓이 - r.넓이) <= 0.03 * r.넓이) r.중심면적 = f.중심넓이 * k * k / 1e6
        }
        /* 열린 공간 안에 면적 선(AREA)으로만 그은 방(«개방형 공간») — 벽으로 찾은 큰 방에서 그만큼 뺌(두 번 안 셈) */
        for (const l of 덩방.values()) {
          const 큰 = l.filter((r) => r.방법 === '벽')
          if (큰.length !== 1) continue
          const R = 큰[0]
          for (const r of l) {
            if (r === R || r.방법 === '벽' || !/AREA|면적/i.test(r.레이어 || '') || !(r.면적 > 0)) continue
            if (R.면적 - r.면적 < R.면적 * 0.2) continue
            R.면적 -= r.면적
            if (R.중심면적) R.중심면적 -= r.면적
            R.뺀 = [...(R.뺀 || []), { 이름: r.이름, 면적: r.면적 }]
          }
        }
        const 층들 = new Map()
        for (const r of g.방들) if (r.층) 층들.set(r.층, (층들.get(r.층) || 0) + 1)
        const 층 = [...층들].sort((a, b) => b[1] - a[1])[0]?.[0] || ''
        /* 이름 든 방에서 벽 하나 건너(상자 1 m 안)로 이어진 공간만 — 이어진 것의 이어진 것도(떨어진 다른 그림 · 건물은 안 셈) */
        const 닿음 = new Set(쓴)
        const 붙 = (a, b) => !(a[2] < b[0] - 1000 / k || a[0] > b[2] + 1000 / k || a[3] < b[1] - 1000 / k || a[1] > b[3] + 1000 / k)
        for (let 바뀜 = true; 바뀜;) {
          바뀜 = false
          F.방들.forEach((f, id) => { if (!닿음.has(id) && [...닿음].some((j) => 붙(f.상자, F.방들[j].상자))) { 닿음.add(id); 바뀜 = true } })
        }
        const 곁 = 3000 / k, gb = g.상자
        F.방들.forEach((f, id) => {
          if (쓴.has(id)) return
          const A = f.넓이 * k * k / 1e6
          if (A < 1 || f.폭 * k < 600) return
          if (!닿음.has(id)) return
          /* 이미 찾은 방(닫힌 선 방) 안이면 뺌 */
          if ([...모음.values()].some((r) => 방안(모델, r, f.씨[0], f.씨[1]))) return
          const 안글 = []
          let 빈곳 = false
          for (const q of 수글들) {
            if (q.x < f.상자[0] || q.x > f.상자[2] || q.y < f.상자[1] || q.y > f.상자[3]) continue
            const t = 붙임(q.s)
            if (!t || t.length > 14 || !/[가-힣A-Za-z]/.test(t) || /^[A-Z]{0,2}\d|[*ø∅Ø×]|^\d|m2$|㎡$/i.test(t)) continue
            if (!고리안(f.점, q.x, q.y)) continue
            if (/^(OPEN|오픈|VOID|보이드)$/i.test(t)) { 빈곳 = [q.x, q.y]; continue }     /* 뚫린 곳 글 — 이름으로는 안 씀(복도 · 화장실과 한 덩이일 수 있음) */
            if (실아님.test(t)) continue
            if (!안글.includes(t)) 안글.push(t)
          }
          /* 이름이 없으면 안의 것으로 짐작 — 위생기구(변기 · 세면기) → 화장실 · 승강기 선 → 승강로 · 계단 선 → 계단실 */
          let 짐작 = '', 디딤 = 0
          if (안글.length && 안글.some((t) => /계단/.test(t))) { const 수2 = 안것(모델, f, 토); if (수2.계단 >= 6) 디딤 = 수2.디딤L * k / 1000 }
          if (!안글.length) {
            const 수 = 안것(모델, f, 토)
            if (수.계단 >= 6) 디딤 = 수.디딤L * k / 1000
            /* 복도 — 좁고 긴 공간(가장 넓은 폭 2.5 m 아래 · 넓이가 폭² 의 세 배 넘음 · 5 ㎡ 넘음) */
            const 폭 = f.폭 * k / 1000
            짐작 = 수.위생 >= 2 ? '화장실(추정)' : 수.승강 >= 3 ? '승강로(추정)' : 수.계단 >= 6 ? '계단실(추정)' : A >= 5 && 폭 > 0.6 && 폭 <= 2.5 && A >= 3 * 폭 * 폭 ? '복도(추정)' : ''
          }
          const 밖 = f.상자[2] < gb[0] - 곁 || f.상자[0] > gb[2] + 곁 || f.상자[3] < gb[1] - 곁 || f.상자[1] > gb[3] + 곁
          빈n++
          모음.set('u' + 빈n + '_' + id, { ...(밖 ? { 밖: true } : {}), 이름: 안글.length ? 안글.slice(0, 2).join('·') : 짐작 || '이름 없는 공간 ' + 빈n + (빈곳 ? ' (OPEN)' : ''), 층, ...(짐작 ? { 짐작: true } : {}), ...(짐작 === '승강로(추정)' ? { 마감없음: true } : {}), 면적: A, 둘레: f.둘레 * k / 1000, e: -1, x: f.씨[0], y: f.씨[1], 글자: [], 보임: false,
            해치: false, 레이어: '', 다각형: f.점, b: f.상자, 넓이: f.넓이, 방법: '벽', 이름없음: !안글.length, ...(디딤 > 0.5 && 디딤 < 4 ? { 디딤 } : {}), ...(빈곳 ? { 오픈: true, 오픈점: 빈곳 } : {}), 중심면적: f.중심넓이 * k * k / 1e6 })
        })
      }
    }
  }
  /* 글 하나는 그 글을 품은 가장 작은 방 몫(열린 공간 속 면적 선 방의 글을 큰 방이 가져가지 않게) */
  const 방들0 = [...모음.values()]
  for (const q of 수글들) {
    const t = 붙임(q.s)
    const ma = /^([\d.]+)(m2|㎡|M2|m²)$/.exec(t)
    const mc = /^(?:CH|C\.H|천장고)?[=:]?(\d\.\d{1,2})(?:m|M)?$/.exec(t)
    if (!ma && !mc) continue
    let r = null
    for (const x of 방들0) {
      if (q.x < x.b[0] || q.x > x.b[2] || q.y < x.b[1] || q.y > x.b[3]) continue
      if (!방안(모델, x, q.x, q.y)) continue
      if (!r || x.면적 < r.면적) r = x
    }
    if (!r) continue
    if (ma && !r.도면면적) r.도면면적 = +ma[1]
    else if (mc && !ma) { const v = +mc[1]; if (v >= 2.1 && v <= 6 && !r.도면천장고) r.도면천장고 = v }
  }
  /* 🏠 G298 OPEN(뚫린 곳) — 판 제목(«1층평면도» · «2층평면도») 자리로 층끼리 겹쳐 봄:
     이 층 OPEN 공간 아래층 같은 자리에 방이 있고, 위층 같은 자리가 OPEN 이 아니면 → 뚫린 곳(바닥 없음 · 실에서 뺌)
     위층 같은 자리도 OPEN 이면 → 이 층은 두 층 높이 공간의 바닥(그대로 · «위가 뚫림») */
  const 층닻 = new Map()             /* 층 → 그 층 판 제목들(같은 층 이름이 여러 판 — «지하1층/pit» · «지하1층구조평면도») */
  for (const t of 제목) { const l = 층닻.get(t.f); if (l) l.push(t); else 층닻.set(t.f, [t]) }
  const 가까운닻 = (f, x, y) => { let b = null, bd = Infinity; for (const t of 층닻.get(f) || []) { const d = Math.hypot(t.x - x, t.y - y); if (d < bd) { bd = d; b = t } } return b }
  const 층차례 = (f) => (/^B(\d+)/.test(f) ? -Number(f.slice(1)) : /^\d+$/.test(f) ? Number(f) : f === 'RF' || f === 'PH' ? 99 : NaN)
  const 옆층 = (f, d) => { const n = 층차례(f) + d; for (const [g] of 층닻) if (층차례(g) === n || (n === 0 && 층차례(g) === -1 && d < 0)) return g; return null }
  const 그층방 = (f, x, y) => 방들0.filter((r) => r.층 === f && x >= r.b[0] && x <= r.b[2] && y >= r.b[1] && y <= r.b[3] && 방안(모델, r, x, y))
  for (const r of 방들0) { const t = 가까운닻(r.층, r.x, r.y); if (t) r.닻 = [t.x, t.y] }     /* 3D — 층마다 (가까운) 판 제목 자리로 맞춤 */
  for (const r of 방들0) {
    if (!r.오픈 || !r.닻) continue
    const 닻 = { x: r.닻[0], y: r.닻[1] }
    const [ox, oy] = r.오픈점 || [r.x, r.y]           /* OPEN 글 자리로 견줌(공간이 크면 가장 안쪽 점은 뚫린 곳 밖일 수 있음) */
    /* 그 층 판 제목마다 옮겨 보고 그 층 방에 드는 것 */
    const 그자리방 = (g) => { for (const b of 층닻.get(g) || []) { const l = 그층방(g, ox - 닻.x + b.x, oy - 닻.y + b.y); if (l.length) return l } return [] }
    const 위 = 옆층(r.층, 1), 아래 = 옆층(r.층, -1)
    if (위 && 그자리방(위).some((o) => o.오픈)) { r.위뚫림 = true; continue }
    if (아래 && 그자리방(아래).length) r.뚫림 = true
  }
  for (const [key, r] of 모음) if (r.뚫림) 모음.delete(key)
  /* 🛗 G469 방에 함께 든 승강로 · 샤프트 — 승강기 문 자리엔 문짝 · 열림 호가 없어 홀 물 채우기가 승강로까지 들어감(현장 Y E/V HALL).
     방 안에 «승강로 · 샤프트» 글이 있으면 그 글과 방 이름 글(가장 먼 것) 사이 가장 좁은 목(2 m 이하)에서 떼어 따로 둠(마감 없음 · 뗀 것은 방에 적음) */
  if (막토 && 막토.토) {
    const 떼글 = []
    const 가운데 = (i) => ({ x: T.x[i] + 글자폭(T, i) / 2 * Math.cos(T.a[i]), y: T.y[i] + T.h[i] / 2 })
    for (let i = 0; i < T.s.length; i++) {
      const s = 글(T.s[i])
      if (떼말.test(s) || s.split('/').every((w) => 샤프트말.test(w.trim()))) { 떼글.push({ s, ...가운데(i) }); continue }
      /* «E/V» 글 묶음(위아래 줄)에 HALL · 홀 · 전실 · 로비가 없으면 승강기(승강로) 자리 — 현장 Y «E/V · 침상형 · (장애인 겸용)» */
      if (!승강글.test(s)) continue
      const c = 가운데(i), hh = T.h[i] || 0
      if (!(hh > 0)) continue
      const 곁 = []
      for (let j = 0; j < T.s.length; j++) {
        if (j === i) continue
        const d = 가운데(j)
        if (Math.abs(d.x - c.x) < hh * 5 && Math.abs(d.y - c.y) > hh * 0.3 && Math.abs(d.y - c.y) < hh * 4) 곁.push(글(T.s[j]))
      }
      if (곁.some((w) => 홀글.test(w))) continue
      떼글.push({ s: '승강로(' + [s, ...곁.filter((w) => w && !/^\(.*\)$/.test(w))].slice(0, 2).join(' ') + ')', ...c })
    }
    let 뗀n = 0
    if (떼글.length) for (const [key, r] of [...모음]) {
      if (r.방법 !== '벽' || !r.다각형 || r.마감없음 || 떼말.test(붙임(r.이름)) || 샤프트말.test(붙임(r.이름))) continue
      const 든 = 떼글.filter((q) => q.x >= r.b[0] && q.x <= r.b[2] && q.y >= r.b[1] && q.y <= r.b[3] && 고리안(r.다각형, q.x, q.y))
      if (!든.length) continue
      /* 방 씨앗 = 방 이름 글 가운데 떼어 낼 글들에서 가장 먼 것 */
      const 후보 = (r.글자 || []).map((i) => 가운데(i)).concat([{ x: r.x, y: r.y }]).filter((p) => 고리안(r.다각형, p.x, p.y))
      const 멀기 = (p) => Math.min(...든.map((q) => Math.hypot(p.x - q.x, p.y - q.y)))
      후보.sort((a, b) => 멀기(b) - 멀기(a))
      const 씨 = 후보[0]
      if (!씨 || 멀기(씨) < 1000 / k) continue
      const v = 방나누기(막토.토, r.다각형, 씨, 든, { 칸: 25 / k, 목: 2000 / k })
      if (!v) continue
      const 새들 = []
      v.나들.forEach((w, n) => {
        if (!w) return
        const q = 든[n], 뗀면적 = w.넓이 * k * k / 1e6
        r.뗀 = [...(r.뗀 || []), { 이름: q.s, 면적: 뗀면적 }]
        새들.push({ 이름: q.s, 층: r.층, 면적: 뗀면적, 둘레: w.둘레 * k / 1000, e: -1, x: q.x, y: q.y, 글자: [], 보임: false, 해치: false, 레이어: '', 다각형: w.점, b: w.상자, 넓이: w.넓이, 방법: '벽', 마감없음: true })
      })
      if (!r.뗀) continue
      r.다각형 = v.가.점; r.넓이 = v.가.넓이; r.면적 = v.가.넓이 * k * k / 1e6; r.둘레 = v.가.둘레 * k / 1000; r.b = v.가.상자; r.x = 씨.x; r.y = 씨.y
      if (r.중심면적) delete r.중심면적
      /* 떼어 낸 승강로 안에 있던 이름 글(«E/V» 등)은 홀 이름에서 뺌 — «E/V HALL·E/V» → «E/V HALL» (홀에 같은 글이 또 있으면 둠) */
      const 남글 = (r.글자 || []).filter((i) => { const p = 가운데(i); return 고리안(r.다각형, p.x, p.y) })
      if (남글.length && 남글.length < r.글자.length) {
        const 남말 = new Set(남글.map((i) => 글(T.s[i])))
        const 뺄말 = new Set(r.글자.filter((i) => !남글.includes(i)).map((i) => 글(T.s[i])).filter((w) => !남말.has(w)))
        const 부분 = r.이름.split('·').filter((w) => !뺄말.has(w))
        if (부분.length) r.이름 = 부분.join('·')
        r.글자 = 남글
      }
      for (const x of 새들) 모음.set(key + '_뗌' + ++뗀n, { ...x, 뗌: r.이름 })
    }
  }
  /* 🚪 G298 ③ 벽으로 찾은 방에 붙은 문(문 열림 호) — 마감 벽 · 걸레받이 공제용(문 폭 · 높이는 2.1 m 로 봄) */
  if (막토 && 막토.토 && 막토.토.문들 && 막토.토.문들.length) {
    for (const r of 모음.values()) if (r.다각형) { const w = 방문들(r.다각형, 막토.토.문들, 300 / k); if (w.length) r.문들 = w.map((v) => Math.round((v * k) / 50) * 50) }
  }
  // 한 닫힌 선이 실 이름을 셋 넘게 품으면 방이 아니라 층 외곽선 — 뺌 (방이 선으로만 그려진 평면도)
  return [...모음.values()].filter((r) => r.방법 === '벽' || r.이름.split('·').length <= 2).sort((a, b) => (a.층 || '').localeCompare(b.층 || '', 'ko', { numeric: true }) || a.이름.localeCompare(b.이름, 'ko', { numeric: true }))
}

/* ───────────────────────────── 실내재료마감표 — 칸이 여러 줄인 큰 표 */

/**
 * 「실 명」 머리 아래로 실마다 여러 줄(바탕 / 마감)이 쌓인 실내재료마감표를 읽습니다.
 *   위 머리: 바닥 · 걸레받이 · 벽 · 천장  /  아래 머리: 실명 · 바탕 · 마감 · 두께 · 상세 · 천장고
 *   실 한 줄 = 실 이름 글자 위아래(앞뒤 실 이름의 가운데까지)의 «마감» 칸 글자를 위에서부터 이어 붙임
 * @returns [{실명, 층, 바닥, 걸레받이, 벽, 천장, 천장고(m 글), 표:'실내재료마감표'}]
 */
export function 마감표찾기(모델) {
  const T = 모델.T
  const n = T.s.length
  const 붙 = (i) => 붙임(T.s[i])
  const 가 = (i) => T.x[i] + 글자폭(T, i) / 2
  const out = []
  for (let hi = 0; hi < n; hi++) {
    if (붙(hi) !== '실명') continue
    const hy = T.y[hi], hh = T.h[hi] || 1
    // 같은 줄의 아래 머리들
    const 아래 = []
    for (let i = 0; i < n; i++) if (Math.abs(T.y[i] - hy) <= 0.6 * hh && /^(실명|실번호|층별|바탕|마감|두께|상세|천장고|천정고|반자높이|비고|구분)$/.test(붙(i))) 아래.push(i)
    const 마감칸 = 아래.filter((i) => 붙(i) === '마감')
    if (마감칸.length < 2) continue
    const 칸들 = 아래.map((i) => ({ i, c: 가(i), 뜻: 붙(i) })).sort((a, b) => a.c - b.c)
    const 폭 = (k) => [k > 0 ? (칸들[k - 1].c + 칸들[k].c) / 2 : 칸들[k].c - 4 * hh, k < 칸들.length - 1 ? (칸들[k].c + 칸들[k + 1].c) / 2 : 칸들[k].c + 4 * hh]
    // 위 머리(부위)
    const 부위들 = []
    for (let i = 0; i < n; i++) {
      const dy = T.y[i] - hy
      if (dy < 0.5 * hh || dy > 6 * hh) continue
      const t = 붙(i)
      const 부 = /^바닥$/.test(t) ? '바닥' : /^걸레받이$/.test(t) ? '걸레받이' : /^벽$|^벽체$/.test(t) ? '벽' : /^(천장|천정|반자)$/.test(t) ? '천장' : ''
      if (!부) continue
      let best = null, bd = Infinity
      for (const m of 마감칸) { const d = Math.abs(가(m) - 가(i)); if (d < bd) { bd = d; best = m } }
      const k = 칸들.findIndex((c) => c.i === best)
      if (k >= 0) 부위들.push({ 부, 범위: 폭(k) })
    }
    if (부위들.length < 2) continue
    const 실k = 칸들.findIndex((c) => c.i === hi)
    const 실범위 = 폭(실k)
    const 층k = 칸들.findIndex((c) => c.뜻 === '층별')
    const 층범위 = 층k >= 0 ? 폭(층k) : null
    const 높k = 칸들.findIndex((c) => /^(천장고|천정고|반자높이)$/.test(c.뜻))
    const 높범위 = 높k >= 0 ? 폭(높k) : null
    const 표왼 = 칸들[0].c - 4 * hh, 표오른 = 칸들[칸들.length - 1].c + 4 * hh
    // 표 안 글자(머리 아래)
    const 몸 = []
    for (let i = 0; i < n; i++) { if (T.y[i] >= hy - 0.5 * hh) continue; const c = 가(i); if (c < 표왼 || c > 표오른) continue; 몸.push(i) }
    몸.sort((a, b) => T.y[b] - T.y[a])
    // 실 이름: 실명 칸 안, 위에서부터 — 큰 틈(머리 높이의 25배)이 나면 표 끝
    const 이름들 = []
    let 앞y = hy
    for (const i of 몸) {
      const c = 가(i)
      if (c < 실범위[0] || c > 실범위[1]) continue
      const t = 글(T.s[i])
      if (!t || t === '-' || 숫자인가(t)) continue
      if (/(몰탈|모르타르|시멘트|타일|페인트|방수|콘크리트|석고|도장|뿜칠|보드|합판|단열|마감$|THK|^T\d)/i.test(붙(i))) continue   // 칸이 넘친 재료 글
      if (앞y - T.y[i] > 25 * hh) break
      이름들.push(i); 앞y = T.y[i]
    }
    if (!이름들.length) continue
    const ys = 이름들.map((i) => T.y[i])
    const 간격 = ys.slice(1).map((y, k) => ys[k] - y).sort((a, b) => a - b)
    const 보통 = 간격.length ? 간격[간격.length >> 1] : 6 * hh
    const 층글 = 층범위 ? 몸.filter((i) => { const c = 가(i); return c >= 층범위[0] && c <= 층범위[1] && /층|B\d|지하|지상|옥탑|옥상|PH|RF/i.test(T.s[i]) }) : []
    이름들.forEach((i, k) => {
      const 위 = k === 0 ? hy - 0.5 * hh : (ys[k - 1] + ys[k]) / 2
      const 아래끝 = k === 이름들.length - 1 ? ys[k] - 보통 / 2 : (ys[k] + ys[k + 1]) / 2
      const 안 = 몸.filter((j) => T.y[j] <= 위 && T.y[j] > 아래끝)
      const r = { 실명: 글(T.s[i]), 층: '', 바닥: '', 걸레받이: '', 벽: '', 천장: '', 천장고: '', 표: '실내재료마감표' }
      for (const { 부, 범위 } of 부위들) {
        const 글들 = 안.filter((j) => { const c = 가(j); return c >= 범위[0] && c <= 범위[1] }).map((j) => 글(T.s[j])).filter((t) => t && t !== '-')
        r[부] = 글들.join(' ').replace(/\s*\/\s*$/, '').replace(/\s+/g, ' ').trim()
      }
      if (높범위) {
        const h = 안.map((j) => ({ j, c: 가(j) })).filter(({ c }) => c >= 높범위[0] && c <= 높범위[1]).map(({ j }) => 붙(j).replace(/,/g, '')).find((t) => /^\d+(\.\d+)?$/.test(t))
        if (h) r.천장고 = String(+h > 100 ? +h / 1000 : +h)
      }
      const 층위 = 층글.filter((j) => T.y[j] >= 아래끝).sort((a, b) => T.y[a] - T.y[b])[0]
      if (층위 !== undefined) r.층 = 글(T.s[층위])
      out.push(r)
    })
  }
  return out
}

/* ───────────────────────────── 실내재료마감표 — 칸 선(격자)으로 읽기 (G448b · 2026-10-29) */

/**
 * 🧱 G448b 칸마다 «바탕 · 마감 · 두께/높이 · 상세번호» 가 있는 큰 실내재료마감표(공공 청사 도면에 흔함)를 표의 칸 선으로 읽습니다.
 *   소장님 크롬 사이트 확인(실제 건축 도면 · 실내외재료마감표)에서 찾음 — 표찾기(글자 틈)는 층 사이 빈 줄에서 표가 끝난 줄 알고 5줄만 읽었고,
 *   마감표찾기는 아래 머리(바탕 · 마감)가 «실 명» 과 다른 줄이라 0줄이었음.
 *   위 머리: 바닥(F) · 걸레받이(B) · 벽(W) · 천장(C) / 아래 머리: 바탕 · 마감 · 두께 · 높이 · 상세번호 · 천장고
 *   실 한 줄 = «실 명» 칸을 가로지르는 가로 선 사이(한 칸에 실 이름이 둘이면 — 「일반화장실(남), (여)」 — 같은 마감을 함께 씀)
 *   부위마다 상세번호(F-06 · W-02 …)를 기호로 · 바탕 · 마감 글을 그 기호의 재료로(도면에 적힌 그대로 한 줄씩)
 *   한 칸에 상세번호가 둘 넘으면(벽 W-02 · W-09 — 어느 벽에 어느 것인지는 도면 표에 없음) 기호를 비우고 비고에 적음(짐작 안 함)
 *   칸 선이 없으면 [] (예전 마감표찾기 · 표찾기 길을 그대로 씀)
 * @returns [{실명, 층, 바닥, 걸레받이, 벽, 천장, 천장고, 표, 마감들:{부위:{기호, 이름, 재료:[{재료, 규격, 단위, 계수}]}}, 비고}]
 */
/* 🧱 G462 «T153 무근콘크리트» 처럼 두께가 적힌 무근 · 버림 콘크리트 바닥 바탕은 부피(m³ = 넓이 × 두께) 줄도 — 레미콘(m³)과 견줄 수 있게 · 넓이(m²) 줄은 그대로 */
const 무근말 = /(?:^|[\s/+(])T\s*(\d{2,3})\s*(?:mm)?\s*(무근|버림)\s*(콘크리트|CONC)/i
export function 부피더하기(재료들, 부위) {
  if (부위 !== '바닥') return 재료들
  const out = []
  for (const x of 재료들) {
    out.push(x)
    const m = 무근말.exec(' ' + x.재료)
    if (m && x.단위 === 'm2' && !재료들.some((y) => y.재료 === x.재료 && y.단위 === 'm3')) out.push({ 재료: x.재료, 규격: x.규격, 단위: 'm3', 계수: String(+m[1] / 1000) })
  }
  return out
}
/* 🧱 G462 표 머리(x, y)를 품은 판 테두리(도곽) — 글 높이 hh 의 가로 100 배 · 세로 60 배 넘는 닫힌 도형 중 가장 작은 것의 상자 · 없으면 null */
const 판테두리판 = new WeakMap()
function 판테두리(모델, x, y, hh) {
  let l = 판테두리판.get(모델)
  if (!l) { l = 닫힌도형들(모델, null, 1); 판테두리판.set(모델, l) }
  for (const d of l) {
    const b = d.b
    if (b[2] - b[0] < 100 * hh || b[3] - b[1] < 60 * hh) continue
    if (x < b[0] || x > b[2] || y < b[1] || y > b[3]) continue
    if (안인가(모델, d.qs, x, y)) return b
  }
  return null
}
/* 🧱 G462 층 칸 글 — 「지하」+「1층」 두 줄 · 한 글 «지하1층» «지상1층» · «B1» «1F» · «지상1~2층» «지상1,2층»(여러 층 한 칸) */
const 층칸말 = /^(지하|지상|옥탑|옥상|지붕|(지하|지상)?\d{1,2}([~,·]\d{1,2})?층?|B\d{1,2}F?|PH\d?|RF|\d{1,2}F)$/i
export function 격자마감표(모델) {
  const { T, Q, P } = 모델
  if (!Q || !P) return []
  const n = T.s.length
  const 붙 = (i) => 붙임(T.s[i]).replace(/\(.*?\)/g, '')
  const 가 = (i) => T.x[i] + 글자폭(T, i) / 2
  const 수평글 = (i) => Math.abs(T.a[i] || 0) < 0.05
  const out = []
  const 쓴머리 = []
  let 판밖 = 0
  for (let hi = 0; hi < n; hi++) {
    if (!/^실명(칭)?$/.test(붙(hi)) || !수평글(hi)) continue
    const hy = T.y[hi], hh = T.h[hi] || 1, hc = 가(hi)
    if (쓴머리.some(([x, y]) => Math.abs(x - hc) < 5 * hh && Math.abs(y - hy) < 5 * hh)) continue
    /* 아래 머리 — 실명과 같은 줄 ~ 3 글자 아래 */
    const 아래 = []
    for (let i = 0; i < n; i++) {
      const dy = T.y[i] - hy
      if (dy > 0.6 * hh || dy < -3.2 * hh || !수평글(i)) continue
      if (Math.abs(가(i) - hc) > 400 * hh) continue
      if (/^(실번호|층별|층|바탕|마감|두께|높이|상세번호|상세|천장고|천정고|반자높이|비고|SL\.?|FL\.?)$/.test(붙(i))) 아래.push(i)
    }
    const 마감칸 = 아래.filter((i) => 붙(i) === '마감')
    if (마감칸.length < 2) continue
    /* 위 머리(부위) — 아래 머리보다 위 6 글자 안 */
    const 위y = Math.max(...아래.map((i) => T.y[i]))
    const 부위글 = []
    for (let i = 0; i < n; i++) {
      const dy = T.y[i] - 위y
      if (dy < -0.6 * hh || dy > 6 * hh || !수평글(i)) continue
      if (Math.abs(가(i) - hc) > 400 * hh) continue
      const t = 붙(i)
      const 부 = /^바닥$/.test(t) ? '바닥' : /^걸레받이$/.test(t) ? '걸레받이' : /^(벽|벽체)$/.test(t) ? '벽' : /^(천장|천정|반자)$/.test(t) ? '천장' : ''
      if (부) 부위글.push({ i, 부 })
    }
    if (부위글.length < 2) continue
    /* 표 둘레 안의 칸 선 */
    const xs = [...아래, hi, ...부위글.map((g) => g.i)].map(가)
    const X0 = Math.min(...xs) - 30 * hh, X1 = Math.max(...xs) + 30 * hh
    const Ytop = Math.max(...부위글.map((g) => T.y[g.i])) + 6 * hh, Ybot = hy - 600 * hh
    const 가로 = [], 세로 = []
    for (let q = 0; q < Q.e.length; q++) {
      const s0 = Q.p0[q], m = Q.pn[q]
      for (let k = 0; k + 1 < m; k++) {
        const ax = P[(s0 + k) * 2], ay = P[(s0 + k) * 2 + 1], bx = P[(s0 + k + 1) * 2], by = P[(s0 + k + 1) * 2 + 1]
        if (Math.max(ax, bx) < X0 || Math.min(ax, bx) > X1 || Math.max(ay, by) < Ybot || Math.min(ay, by) > Ytop) continue
        const dx = Math.abs(ax - bx), dy = Math.abs(ay - by)
        if (dy <= 0.02 * hh && dx > 0.5 * hh) 가로.push([Math.min(ax, bx), Math.max(ax, bx), (ay + by) / 2])
        else if (dx <= 0.02 * hh && dy > 0.5 * hh) 세로.push([(ax + bx) / 2, Math.min(ay, by), Math.max(ay, by)])
      }
    }
    if (가로.length < 4 || 세로.length < 4) continue
    /* 글 c 를 품은 칸 — 그 글 높이(y)를 지나는 세로 선 중 왼쪽 · 오른쪽 가장 가까운 것 */
    const 칸 = (c, y) => {
      let L = -Infinity, R = Infinity
      for (const [x, y0, y1] of 세로) if (y0 <= y + 0.3 * hh && y1 >= y - 0.3 * hh) { if (x < c && x > L) L = x; if (x > c && x < R) R = x }
      if (!Number.isFinite(L) && Number.isFinite(R)) L = c - (R - c)        // 표 바깥 테두리 선이 없는 쪽 — 머리 글 가운데로 맞접음
      if (!Number.isFinite(R) && Number.isFinite(L)) R = c + (c - L)
      return [L, R]
    }
    /* 표 너비 = 머리 바로 아래 가로 선(«실 명» 칸을 지나는 것)과 이어진 선들 — 옆에 나란한 딴 판(마감표 -2)의 머리를 섞지 않게 */
    const 머리밑 = Math.min(...아래.map((i) => T.y[i])) - 0.3 * hh
    const 지나는 = (c) => [...new Set(가로.filter(([x0, x1, y]) => x0 <= c && x1 >= c && y < 머리밑).map(([, , y]) => Math.round(y * 1000) / 1000))].sort((a, b) => b - a)
    const 줄선 = 지나는(hc)
    if (줄선.length < 3) continue
    let 너비 = null
    {
      const 첫 = 줄선[0]
      const 같은 = 가로.filter(([, , y]) => Math.abs(y - 첫) < 0.05 * hh).sort((a, b) => a[0] - b[0])
      const 시작 = 같은.find(([x0, x1]) => x0 <= hc && x1 >= hc)
      if (시작) {
        let a = 시작[0], b = 시작[1], 늘음 = true
        while (늘음) { 늘음 = false; for (const [x0, x1] of 같은) if (x0 <= b + 0.2 * hh && x1 >= a - 0.2 * hh && (x0 < a || x1 > b)) { a = Math.min(a, x0); b = Math.max(b, x1); 늘음 = true } }
        너비 = [a - 0.2 * hh, b + 0.2 * hh]
      }
    }
    if (!너비) continue
    const 표안 = (c) => c >= 너비[0] && c <= 너비[1]
    const 아래칸 = 아래.filter((i) => 표안(가(i))).map((i) => ({ i, 뜻: 붙(i), c: 가(i), 범위: 칸(가(i), T.y[i]) })).filter((a) => Number.isFinite(a.범위[0]) && Number.isFinite(a.범위[1]))
    const 부위칸 = 부위글.filter((g) => 표안(가(g.i))).map((g) => ({ ...g, 범위: 칸(가(g.i), T.y[g.i]) })).filter((g) => Number.isFinite(g.범위[0]) && Number.isFinite(g.범위[1]))
    if (부위칸.length < 2 || 아래칸.filter((a) => a.뜻 === '마감').length < 2) continue
    const 실범위 = 칸(hc, hy)
    if (!Number.isFinite(실범위[0]) || !Number.isFinite(실범위[1])) continue
    const 층칸 = 아래칸.find((a) => /^(층별|층)$/.test(a.뜻) && a.범위[1] <= 실범위[0] + 0.2 * hh)
    const 위선 = 가로.filter(([x0, x1, y]) => x0 <= hc && x1 >= hc && y >= 머리밑 && y < hy).map(([, , y]) => y)
    const 줄들 = []
    let 앞 = 위선.length ? Math.min(...위선) : 머리밑 + 0.3 * hh
    for (const y of 줄선) { if (앞 - y > 0.3 * hh) 줄들.push([y, 앞]); 앞 = y }
    /* 층 칸 — 층 칸 가운데를 지나는 가로 선 사이마다 글(지하 · 1층 → 「지하1층」) */
    const 층들 = []
    if (층칸) {
      const 층선 = 지나는(층칸.c)
      let 앞2 = 앞 === 0 ? 0 : (위선.length ? Math.min(...위선) : 머리밑 + 0.3 * hh)
      for (const y of 층선) {
        const 글들 = []
        for (let i = 0; i < n; i++) { const c = 가(i); if (c >= 층칸.범위[0] && c <= 층칸.범위[1] && T.y[i] < 앞2 && T.y[i] > y && 수평글(i) && 층칸말.test(붙(i))) 글들.push(i) }
        글들.sort((a, b) => T.y[b] - T.y[a])
        const t = 글들.map((i) => 붙(i)).join('')
        if (t) 층들.push([y, 앞2, t])
        앞2 = y
      }
    }
    const 표X0 = 너비[0], 표X1 = 너비[1]
    /* 🧱 G462 판 테두리(도곽) 밖의 줄은 인쇄되지 않는 줄 — 현장 Y A-171 은 «마감표 - 1» 판 아래(도곽 밖)에 옛 줄(지상2층 ~ 6층)이 남아 있어 «- 2 · - 3» 판 줄과 겹쳤음 */
    const 판 = 판테두리(모델, hc, hy, hh)
    if (판) { while (줄들.length && 줄들[줄들.length - 1][0] < 판[1]) { 줄들.pop(); 판밖++ } for (let j = 층들.length - 1; j >= 0; j--) if (층들[j][0] < 판[1] && 층들[j][1] <= 판[1]) 층들.splice(j, 1) }
    const 몸 = []
    for (let i = 0; i < n; i++) { if (T.y[i] >= 머리밑 || T.y[i] < 줄선[줄선.length - 1] || !수평글(i)) continue; const c = 가(i); if (c < 표X0 || c > 표X1) continue; 몸.push(i) }
    const 재료말 = /(몰탈|모르타르|시멘트|타일|페인트|방수|콘크리트|석고|도장|뿜칠|보드|합판|단열|THK|^T\d)/i
    const 제목i = (() => { let b = -1, bd = Infinity; for (let i = 0; i < n; i++) { if (!/마감표/.test(붙(i)) || T.y[i] <= hy) continue; const d = Math.hypot(가(i) - hc, T.y[i] - hy); if (d < bd && d < 80 * hh) { bd = d; b = i } } return b })()
    const 표이름 = 제목i >= 0 ? 글(T.s[제목i]).replace(/\s+/g, ' ') : '실내재료마감표'
    let 읽은 = 0
    for (const [y0, y1] of 줄들) {
      const 안 = 몸.filter((j) => T.y[j] < y1 && T.y[j] > y0).sort((a, b) => T.y[b] - T.y[a] || T.x[a] - T.x[b])
      const 이름글 = 안.filter((j) => { const c = 가(j); if (c < 실범위[0] || c > 실범위[1]) return false; const t = 글(T.s[j]); return t && t !== '-' && !숫자인가(t) && !재료말.test(붙(j)) })
      if (이름글.some((j) => /마감(재료)?표$/.test(붙(j)))) break       // 같은 판 아래 딴 표(외벽마감재료표)가 이어지면 여기서 끝
      if (!이름글.length) continue
      const 이름들 = []
      for (const j of 이름글) {
        const 조각 = 글(T.s[j]).split(/\s*[,/]\s*/).map((x) => x.trim()).filter(Boolean)     // 「일반화장실(남), (여)」 · 「EPS/PS」 · 「복도 / 연결복도」 — 한 칸에 실 여럿
        let 바탕이름 = ''
        for (const x of 조각) {
          if (/^\(.+\)$/.test(x) && 바탕이름) 이름들.push(바탕이름 + x)
          else { 이름들.push(x); 바탕이름 = x.replace(/\(.*?\)\s*$/, '') }
        }
      }
      const 줄 = { 실명: '', 층: '', 바닥: '', 걸레받이: '', 벽: '', 천장: '', 천장고: '', 표: 표이름, 마감들: {}, 비고: '' }
      const 비고 = []
      for (const g of 부위칸) {
        const 단위 = g.부 === '걸레받이' ? 'm' : 'm2'
        const 속 = 아래칸.filter((a) => a.c >= g.범위[0] && a.c <= g.범위[1])
        const 칸글 = (re) => { const a = 속.filter((x) => re.test(x.뜻)); return 안.filter((j) => a.some((x) => { const c = 가(j); return c >= x.범위[0] && c <= x.범위[1] })) }
        const 기호들 = [...new Set(칸글(/^(상세번호|상세)$/).map((j) => 붙임(T.s[j]).toUpperCase()).filter((t) => /^[A-Z]{1,3}-?\d{1,3}[A-Z]?$/.test(t)))]
        const 마감글 = 칸글(/^마감$/).map((j) => 글(T.s[j])).filter((t) => t && !/^[-—–]$/.test(t))
        const 바탕글 = 칸글(/^바탕$/).map((j) => 글(T.s[j]).replace(/^[\s/]+|[\s/]+$/g, '')).filter((t) => t && !/^[-—–]$/.test(t))   // 줄이 넘친 «/ Thk47 시멘트몰탈» 의 앞뒤 «/» 는 뗌
        const 높이글 = 칸글(/^(높이|두께)$/).map((j) => 붙임(T.s[j]).replace(/,/g, '')).find((t) => /^\d+(\.\d+)?$/.test(t))
        if (g.부 === '천장') {
          const h = 칸글(/^(천장고|천정고|반자높이)$/).map((j) => 붙임(T.s[j]).replace(/,/g, '')).find((t) => /^\d+(\.\d+)?$/.test(t))
          if (h) 줄.천장고 = String(+h > 100 ? +h / 1000 : +h)
        }
        if (기호들.length > 1) { 비고.push(g.부 + ' 마감 ' + 기호들.join(' · ') + ' 두 가지 — 어느 곳에 어느 것인지 도면 표에 없어 비웠습니다'); continue }
        const 이름 = 마감글.join(' ').replace(/\s+/g, ' ').trim()
        const 기호 = 기호들[0] || 이름
        if (!기호) continue
        줄[g.부] = 기호
        const 규격 = g.부 === '걸레받이' && 높이글 ? 'H' + 높이글 : ''
        const 재료 = 부피더하기([...바탕글.map((t) => ({ 재료: t, 규격: '', 단위, 계수: '1' })), ...(이름 ? [{ 재료: 이름, 규격, 단위, 계수: '1' }] : [])], g.부)
        줄.마감들[g.부] = { 기호, 이름: 이름 || 기호, 재료: 재료.length ? 재료 : [{ 재료: g.부 + ' 마감 ' + 기호, 규격: '', 단위, 계수: '1' }] }
      }
      const 층 = 층들.find(([a, b]) => 이름글.some((j) => T.y[j] < b && T.y[j] > a))
      줄.층 = 층 ? 층[2] : ''
      줄.비고 = 비고.join(' · ')
      const 원이름 = 이름글.map((j) => 글(T.s[j])).join(' ')
      for (const 이름 of 이름들) { out.push({ ...줄, 실명: 이름, ...(이름들.length > 1 ? { 원이름 } : {}) }); 읽은++ }
    }
    if (읽은) 쓴머리.push([hc, hy])
  }
  /* 같은 상세번호인데 실마다 바탕 · 마감 글이 다르면(F-06 이 어떤 방은 Thk20 · 어떤 방은 Thk27 시멘트몰탈) 다른 마감 — 뒤의 것은 «F-06(2)» 로 나눔(한 가지로 뭉뚱그리지 않음) */
  for (const 부 of ['바닥', '걸레받이', '벽', '천장']) {
    const 본 = new Map()
    for (const r of out) {
      const g = r.마감들[부]
      if (!g || !r[부]) continue
      const 원 = g.기호
      const 꼴 = g.재료.map((x) => 붙임(x.재료).replace(/[.。,]+$/, '') + '|' + x.규격).join('/')     // 띄어쓰기 · 끝 마침표만 다른 것은 같은 것
      const a = 본.get(원) || []
      let k = a.indexOf(꼴)
      if (k < 0) { a.push(꼴); k = a.length - 1; 본.set(원, a) }
      if (k > 0) { const 새 = 원 + '(' + (k + 1) + ')'; r.마감들 = { ...r.마감들, [부]: { ...g, 기호: 새 } }; r[부] = 새 }
    }
  }
  out.밖줄 = 판밖          // 🧱 G462 판 테두리 밖이라 뺀 줄 수 — 마감표모음이 다른 읽기와 견줄 때 같이 셈
  return out
}

/** 🧱 G448b 실내재료마감표 — 세 길(작은 표 · 여러 줄 칸 큰 표 · 칸 선 격자) 중 가장 많이 읽은 것 */
export function 마감표모음(모델, 표들) {
  const a = 마감표읽기(표들 || [])
  const b = a.length ? [] : 마감표찾기(모델)
  const c = 격자마감표(모델)
  const 앞 = a.length ? a : b
  return c.length + (c.밖줄 || 0) > 앞.length ? c : 앞       // 🧱 G462 판 밖 줄을 뺀 격자 표도 처음 읽은 수로 견줌(현장 Y A-171 — 빼고 나니 여러 줄 칸 읽기 쪽이 골라져 바탕이 안 나뉨)
}

/** 층 글 → 견줄 꼴 — 「지하1층」「B1」「B1F」→ B1 · 「1층」「1F」「1」→ 1 · 옥탑 · 옥상 · 지붕 · PH · RF → PH */
export function 층키(s) {
  const t = 붙임(s).toUpperCase()
  if (!t) return ''
  let m = t.match(/^지하(\d{1,2})층?$/) || t.match(/^B(\d{1,2})F?층?$/)
  if (m) return 'B' + +m[1]
  m = t.match(/^(?:지상)?(\d{1,2})(?:층|F)?$/)
  if (m) return String(+m[1])
  if (/^(옥탑|옥상|지붕|PH\d*|RF|ROOF)/.test(t)) return 'PH'
  return t
}

/** 🧱 G462 한 칸에 층이 여럿 — 「지상3층지상4층」(두 줄 한 칸) · 「지상1~2층」 · 「지상1,2층」 → ['3','4'] · ['1','2'] · 그 밖은 [층키] */
export function 층키들(s) {
  const t = 붙임(s).toUpperCase()
  if (!t) return []
  const out = new Set()
  let m
  const 범위 = /(지하|지상|B)?(\d{1,2})(?:층|F)?[~∼-](?:지하|지상|B)?(\d{1,2})(?:층|F)?/g
  while ((m = 범위.exec(t))) { const a = +m[2], b = +m[3]; if (b >= a && b - a < 30) for (let i = a; i <= b; i++) out.add((m[1] === '지하' || m[1] === 'B' ? 'B' : '') + i) }
  const 쉼표 = /(지하|지상)?(\d{1,2})((?:,\d{1,2})+)층/g
  while ((m = 쉼표.exec(t))) for (const v of [m[2], ...m[3].split(',').filter(Boolean)]) out.add((m[1] === '지하' ? 'B' : '') + +v)
  if (!out.size) { const 낱 = t.match(/(지하|지상)?\d{1,2}층/g); if (낱 && 낱.length > 1) for (const x of 낱) out.add(층키(x)) }
  return out.size ? [...out] : [층키(s)]
}

/**
 * 🧱 G448b 마감표 줄 찾기 — 같은 이름(실키)이 여러 줄이면(창고가 지하1층 · 1층 · 2층에) 층으로 고르고,
 *   층으로도 못 고르고 마감이 서로 다르면 { 여럿 } (짐작해 넣지 않음)
 */
export function 마감표짝(마감표) {
  const 묶 = new Map()
  const 더 = (k, m) => { if (!k) return; const a = 묶.get(k) || []; if (!a.includes(m)) a.push(m); 묶.set(k, a) }
  for (const m of 마감표 || []) { 더(실키(m.실명), m); if (m.원이름) 더(실키(m.원이름), m) }   // 「복도/라운지」 처럼 한 칸에 둘이던 실은 합친 이름으로도
  const 같은마감 = (a) => a.every((m) => ['바닥', '걸레받이', '벽', '천장', '천장고'].every((c) => 글(m[c]) === 글(a[0][c])))
  /* 🧱 G462 평면 이름 → 표 줄: ① 한 방에 든 이름 글 모두 이은 것(«E/V»+«HALL» → EVHALL) ② 첫 글(예전) ③ 끝 «실» 만 다른 것(«감시제어반실» ↔ «감시제어반») */
  const 찾 = (이름) => {
    const t = String(이름 || '')
    for (const k of [실키(t.replace(/·/g, '')), 실키(t.split('·')[0])]) {
      if (!k) continue
      const a = 묶.get(k) || (/실$/.test(k) ? 묶.get(k.slice(0, -1)) : 묶.get(k + '실'))
      if (a) return a
    }
    return null
  }
  return (이름, 층) => {
    const a = 찾(이름)
    if (!a) return null
    if (a.length === 1 || 같은마감(a)) return { m: a[0] }
    const 층k = 층키(층)
    if (층k) { const b = a.filter((m) => 층키들(m.층).includes(층k)); if (b.length === 1 || (b.length > 1 && 같은마감(b))) return { m: b[0] } }
    return { 여럿: a }
  }
}

/* ───────────────────────────── 모두 */

/**
 * 🧭 G363 블록 개수 모음 — 세기() 의 블록(모형 공간에 바로 넣은 것) + 묶음 블록 안에 든 것
 *   ① 물량 전부 · ⑥ 레이어·블록·글자 · 고른 블록 세기가 같은 수를 쓰게 한 곳에서 셈
 * @returns [{이름, 수, 참조수, 층이름, 층, 뜻, 안?: Map(바깥 길 → 수), 묶음?: '이팝나무 6 · …'}]
 */
export function 블록모음(S) {
  const 블록 = S.블록.map((b) => ({ ...b, 뜻: 블록뜻(b.이름) }))
  /* 🧭 G363 묶음 블록(수목군 · 화장실 세트처럼 뜻 있는 블록을 한 번에 둘 넘게 품은 블록) — 안에 든 것을 그 이름으로 세고, 묶음은 겹치지 않게 꺼 둠
       묶음 = 뜻 있는 블록을 넣을 때마다 평균 2개 넘게 품음 + (제 이름으로는 뜻을 모름 · 또는 이름에 군 · 세트 · GROUP …)
       한 개만 품은 블록(가로등 안의 등 머리)은 바깥 블록만 셈 · 주석 블록(범례 · 도곽 · 바인드 외부참조) 안은 안 셈 */
  const 안들 = S.안블록 || []
  if (안들.length) {
    const 넣은수 = new Map()
    for (const b of S.블록) 넣은수.set(b.이름, (넣은수.get(b.이름) || 0) + b.수)
    for (const a of 안들) 넣은수.set(a.이름, (넣은수.get(a.이름) || 0) + a.수)
    const 뜻있음 = (n) => { const f = 블록뜻(n); return !f.주석 && !!f.품명 }
    const 품은수 = new Map()
    for (const a of 안들) if (뜻있음(a.이름)) { const p = a.조상[a.조상.length - 1]; 품은수.set(p, (품은수.get(p) || 0) + a.수) }
    const 묶음 = (n) => { const f = 블록뜻(n); return !f.주석 && (품은수.get(n) || 0) >= 2 * Math.max(1, 넣은수.get(n) || 1) && (!f.품명 || 묶음말.test(n)) }
    const 품은것 = new Map()
    for (const a of 안들) {
      if (!a.조상.length || !a.조상.every(묶음)) continue
      let b = 블록.find((x) => x.이름 === a.이름)
      if (!b) { b = { 이름: a.이름, 수: 0, 참조수: 0, 층이름: [], 층: '', 뜻: 블록뜻(a.이름) }; 블록.push(b) }
      b.수 += a.수; b.참조수 += a.참조수
      b.안 = b.안 || new Map()
      const p = a.조상.join(' › ')
      b.안.set(p, (b.안.get(p) || 0) + a.수)
      b.층이름 = [...new Set([...(b.층이름 || []), ...a.층])]
      if (!b.층) b.층 = a.층.join(', ')
      const 겉 = a.조상[0]
      const m = 품은것.get(겉) || new Map(); m.set(a.이름, (m.get(a.이름) || 0) + a.수); 품은것.set(겉, m)
    }
    for (const b of 블록) if (품은것.has(b.이름)) b.묶음 = [...품은것.get(b.이름)].map(([n, c]) => n + ' ' + c).join(' · ')
  }
  return 블록
}

/**
 * 한 도면에서 모든 물량
 * @param 모델 골조도면.도면읽기() 결과
 * @param o {k: 도면 단위→mm, 끈층:Set, 표들: 도면자동.표찾기() 결과, 상자}
 * @returns {항목:[{key, 구분, 품명, 규격, 단위, 수량, 근거, 갈래, 켬}], 레이어:[…], 블록:[…], 기호:[…], 실:[…], 마감:{…}|null, 창호:[…]}
 */
export function 모두(모델, o = {}) {
  const k = o.k || 1
  /* 🧭 G132 참조뺌 — 끼워 넣은 외부참조(«참조|레이어») 는 여기서 안 셈(외부참조 원본 쪽에서 도면들이 보여 주는 곳을 한 번만 셈) */
  const 끈 = o.참조뺌 ? new Set([...(o.끈층 || []), ...모델.layers.map((L, i) => (/\|/.test(L.name) ? i : -1)).filter((i) => i >= 0)]) : (o.끈층 || new Set())
  const 표들 = o.표들 || []
  const 상자 = o.상자 || 도형상자(모델)
  const 표글자 = new Set(표들.flatMap((t) => t.글자 || []))
  const S = 세기(모델, { 끈층: 끈, k, 상자 })
  const 항목 = []

  // ① 레이어
  const 레이어 = S.층.map((a) => {
    const 뜻 = 레이어뜻(a.이름)
    return { ...a, 뜻 }
  })
  for (const a of 레이어) {
    if (!a.뜻 || a.뜻.주석) continue
    const { 품명, 종, 갈래 } = a.뜻
    /* 🧭 G132 — 현황(기존·지형·철거) · 외부참조 바탕도의 레이어는 처음엔 꺼 둠(계획 · 신설 이름이면 켬) */
    const 끔 = o.단면 ? ' — 종·횡단면도의 선은 실제 연장 · 면적이 아니라 처음엔 꺼 둠(도면의 표 값을 쓰십시오)' : a.뜻.현황 ? ' — 현황(있는 것)으로 보여 처음엔 꺼 둠' : a.뜻.참조 ? ' — 외부참조(바탕도) 레이어라 처음엔 꺼 둠' : ''
    if (종 === '길이' && a.선수 > 0 && a.길이m > 0.001) {
      항목.push({ key: '층길이:' + a.이름, 구분: '레이어 길이', 품명, 규격: '', 단위: 'm', 수량: a.길이m, 근거: '레이어 «' + a.이름 + '» 선 ' + a.선수 + '개 길이 합' + 끔, 갈래, 켬: !끔 })
    }
    if (종 === '면적') {
      if (a.면수 > 0 && a.면적m2 > 0.001) 항목.push({ key: '층면적:' + a.이름, 구분: '레이어 면적', 품명, 규격: '', 단위: 'm²', 수량: a.면적m2, 근거: '레이어 «' + a.이름 + '» 닫힌 도형 ' + a.면수 + '개 면적 합' + 끔, 갈래, 켬: !끔 })
      else if (a.선수 > 0) 항목.push({ key: '층길이:' + a.이름, 구분: '레이어 길이', 품명: 품명 + ' (선 길이)', 규격: '', 단위: 'm', 수량: a.길이m, 근거: '레이어 «' + a.이름 + '» 에 닫힌 도형이 없어 선 길이만 ' + a.선수 + '개', 갈래, 켬: false })
    }
  }
  // ①-2 🧭 G132 종 · 횡단면도에 «적힌» 값 — 종단 «이름 / L=○○M» 띠 · 횡단 수량표 블록(속성) 평균단면법
  if (o.단면) {
    const 구간 = 구간표읽기(모델)
    const 관경 = 구간.some((g) => /^D\s*\d+/i.test(g.품명))
    for (const g of 구간) {
      const 합계줄 = 관경 && /^관로 구간/.test(g.품명)
      항목.push({ key: '구간:' + g.품명, 구분: '종단면도 L= (적힌 연장)', 품명: g.품명, 규격: '', 단위: 'm', 수량: g.수량, 근거: '도면에 적힌 «' + g.품명 + '» 아래 L= ' + g.개수 + '곳 합' + (합계줄 ? ' — 관경별 줄의 합계와 같은 연장이라 겹치지 않게 처음엔 꺼 둠' : ''), 갈래: '토목', 켬: !합계줄 })
    }
  }
  for (const t of 속성단면(모델)) {
    for (const x of t.항목) {
      항목.push({ key: '단면:' + t.블록 + ':' + x.품명, 구분: '횡단면 수량표(블록 속성) · 평균단면법', 품명: x.품명, 규격: '', 단위: x.단위, 수량: x.수량,
        근거: '블록 «' + t.블록 + '» 단면 ' + t.단면수 + '개 · 노선 ' + t.노선수 + '개 · 연장 ' + Math.round(t.길이 * 100) / 100 + ' m · (A1+A2)/2×L (측점 NO 간격 ' + t.간격 + ' m)' + (x.폭 ? ' — 값을 폭(m)으로 보고 m×L=m²' : ''),
        갈래: '토목', 켬: true })
    }
  }
  // ② 블록
  const 블록 = 블록모음(S)
  for (const b of 블록) {
    if (b.뜻.주석) continue
    const 품명 = b.뜻.품명 ? b.뜻.품명 + (b.뜻.품명 === b.이름 ? '' : ' (' + b.이름 + ')') : b.이름
    /* 🧭 G132 — 외부참조(바탕도)에서만 나온 블록 · 현황 레이어의 블록은 처음엔 꺼 둠(계획 · 신설 레이어면 켬) */
    const 층들 = (b.층이름 || []).map((n) => n.replace(/^.*\|/, ''))
    const 바탕 = (b.참조수 && b.참조수 === b.수 && !층들.some((n) => 계획층.test(n))) || (층들.length && 층들.every((n) => 현황층.test(n)))
    const 끔글 = 바탕 ? ' — 외부참조(바탕도) · 현황 레이어의 블록이라 처음엔 꺼 둠' : ''
    const 안수 = b.안 ? [...b.안.values()].reduce((s, n) => s + n, 0) : 0
    const 안글 = 안수 ? ' — 바로 넣은 것 ' + (b.수 - 안수) + ' + 묶음 블록 안 ' + [...b.안].map(([p, n]) => '«' + p + '» ' + n).join(' · ') : ''
    const 묶글 = b.묶음 ? ' — 묶음 블록: 안에 든 것(' + b.묶음 + ')을 따로 셈 · 겹치지 않게 처음엔 꺼 둠' : ''
    항목.push({ key: '블록:' + b.이름, 구분: '블록 개수', 품명, 규격: '', 단위: '개', 수량: b.수, 근거: '블록 «' + b.이름 + '» ' + b.수 + '개 (레이어 ' + (b.층 || '—') + ')' + 안글 + (b.묶음 ? 묶글 : b.뜻.품명 ? (b.뜻.품명 === '기둥' ? ' — 기둥 표시는 여러 장에 겹쳐 나올 수 있어 처음엔 꺼 둠' : 끔글) : ' — 이름으로 뜻을 몰라 처음엔 꺼 둠'), 갈래: '', 켬: !b.묶음 && !!b.뜻.품명 && b.뜻.품명 !== '기둥' && !바탕 })
  }
  // ③ 기호 글자 (표 안은 뺌)
  const { T, E } = 모델
  const 기호수 = new Map()
  for (let i = 0; i < T.s.length; i++) {
    const e = T.e[i]
    if (E.t[e] !== 종류.글자) continue
    if (끈.has(E.ly[e])) continue
    if (E.sc && (E.sc[e] < 0.5 || E.sc[e] > 2)) continue     // 🧭 G132 축소 사본(위치도) 글자는 뺌
    const t = 붙임(T.s[i]).toUpperCase()
    if (!기호인가(t)) continue
    if (표글자.has(i)) continue
    const a = 기호수.get(t) || { 기호: t, 수: 0, 자리: [] }
    a.수++; a.자리.push([T.x[i], T.y[i]]); 기호수.set(t, a)
  }
  // 창호일람표 · 실내재료마감표
  const 창호표 = 창호표읽기(표들)
  const 창표 = new Map(창호표.map((w) => [w.기호, w]))
  const 기호 = [...기호수.values()].sort((a, b) => a.기호.localeCompare(b.기호, 'en', { numeric: true }))
  for (const a of 기호) {
    const w = 창표.get(a.기호)
    const 뜻 = w ? '창호' : 기호풀이(a.기호)
    항목.push({ key: '기호:' + a.기호, 구분: w ? '창호 (평면 기호 개수)' : '기호 개수', 품명: (뜻 ? 뜻 + ' ' : '기호 ') + a.기호, 규격: w ? Math.round(+w.폭 * 1000) + '×' + Math.round(+w.높이 * 1000) : '', 단위: '개소', 수량: a.수, 근거: '평면의 «' + a.기호 + '» 글자 ' + a.수 + '개 (표 안의 글자는 뺌)', 갈래: w ? '건축' : '', 켬: !!(w || (뜻 && !구조기호.has(뜻) && a.수 >= 2)) })
  }
  const 창호 = 창호표.map((w) => {
    const a = 기호수.get(w.기호)
    const 도면 = a ? a.수 : 0
    const 표수 = 숫자인가(w.수량) ? +붙임(w.수량).replace(/,/g, '') : null
    return { 기호: w.기호, 구분: w.구분, 폭: w.폭, 높이: w.높이, 도면, 표수, 다름: 표수 !== null && 표수 !== 도면 }
  })
  // ④ 실
  let 마감표 = 마감표모음(모델, 표들)          // 🧱 G448b 칸 선 격자 표도
  /* 🧱 G449b 이 도면에 마감표가 없고 함께 넣은 딴 도면(마감표 장)에 있으면 그것으로 — 평면 · 마감표가 다른 파일인 실제 도면(실내외재료마감표 장) */
  let 마감표출처 = ''
  if (!마감표.length && o.밖마감표 && o.밖마감표.length) { 마감표 = o.밖마감표; 마감표출처 = o.밖마감표이름 || '함께 넣은 도면' }
  const 도형들 = 닫힌도형들(모델, 끈, k, 상자)
  const 실 = 실찾기(모델, { k, 끈층: 끈, 표글자, 도형들, 실이름들: 마감표.map((m) => m.실명), 상자 })
  if (실.length) {
    const 합 = 실.reduce((s, r) => s + r.면적, 0)
    항목.push({ key: '실:합', 구분: '실 면적', 품명: '실 면적 합계 (안목)', 규격: '실 ' + 실.length + '개', 단위: 'm²', 수량: 합, 근거: '실 이름 글자를 품은 닫힌 선 ' + 실.length + '개의 면적 합 — 실마다는 «실» 시트', 갈래: '건축', 켬: 실.length >= 3 && 합 >= 10 })
  }
  // ⑤ 마감 — 실내재료마감표가 있으면
  let 마감 = null
  if (마감표.length && 실.length) {
    const 마감들 = new Map()
    const 부위칸 = [['바닥', '바닥', 'm2'], ['걸레받이', '걸레받이', 'm'], ['벽', '벽', 'm2'], ['천장', '천장', 'm2']]
    const 실줄 = []
    const 짝 = 마감표짝(마감표)
    for (const r of 실) {
      const a = 짝(r.이름, r.층)
      const m = a && a.m
      if (!m) continue
      // 방 안의 창호 기호
      const 창 = []
      for (const a of 기호) {
        if (!창표.has(a.기호)) continue
        let n = 0
        for (const [x, y] of a.자리) if (방안(모델, r, x, y)) n++
        if (n) 창.push(n === 1 ? a.기호 : a.기호 + '*' + n)
      }
      const 줄 = { 층: r.층, 실명: r.이름, 개수: '1', 면적: 짧(r.면적), 둘레: Number.isFinite(r.둘레) ? 짧(r.둘레) : '', 천장고: m.천장고 || '', 창호: 창.join(' ') }
      for (const [부위, 칸, 단위] of 부위칸) {
        const v = 글(m[칸])
        if (!v || /^[-—–]$/.test(v)) continue
        줄[칸] = v
        const 열 = 부위 + '|' + v
        const 표마감 = m.마감들 && m.마감들[칸]
        if (!마감들.has(열)) 마감들.set(열, 표마감 ? { 기호: v, 부위, 이름: 표마감.이름, 재료: 표마감.재료.map((x) => ({ ...x })) } : { 기호: v, 부위, 이름: v, 재료: [{ 재료: /^[A-Z]{1,3}-?\d{1,3}$/i.test(v) ? 부위 + ' 마감 ' + v : v, 규격: '', 단위, 계수: '1' }] })
      }
      실줄.push(줄)
    }
    if (실줄.length) {
      // 같은 기호가 부위를 달리해 쓰이면(드묾) 부위별로 이름을 달리 둠
      const 공사 = { 이름: '', 기준: { 천장고: '', 자리: 3 }, 마감: [...마감들.values()], 창호: 창호표.map((w) => ({ 기호: w.기호, 구분: w.구분, 폭: w.폭, 높이: w.높이 })), 실: 실줄, 외벽: [] }
      const R = 마감셈(공사)
      마감 = { 공사, 결과: R }
      for (const a of R.집계.합) {
        if (a.재료 === '창호') continue            // 창호 개수는 ③ 기호에서 셈
        항목.push({ key: '마감:' + a.재료 + '|' + a.규격 + '|' + a.단위, 구분: '마감 (실내재료마감표 × 실)', 품명: a.재료, 규격: a.규격, 단위: a.단위, 수량: a.수량, 근거: '실 ' + 실줄.length + '개 — 바닥·천장=면적 · 벽=둘레×천장고−창호 · 걸레받이=둘레−문 폭' + (마감표출처 ? ' · 마감표: ' + 마감표출처 : ''), 갈래: '건축', 켬: true })
      }
    }
  }
  return { 항목, 레이어, 블록, 기호, 실, 마감, 창호, 마감표, 창호표, 마감표출처 }
}

/**
 * ⚡ 마감 수량산출 «도면 넣으면 자동» (2026-09-28 소장님 「되도록 자동으로 물량이 나오게 해줘. 도면 클릭하면 나온다 이러지 말고」)
 *   방(실 이름 글자를 품은 닫힌 선)마다 실 줄을 만들어 면적·둘레·창호 기호를 저절로 채우고,
 *   실내재료마감표가 있으면 바닥·걸레받이·벽·천장 기호와 천장고까지, 창호일람표가 있으면 창호표까지 채웁니다.
 *   이미 적어 둔 마감표(기호별 재료)·창호 재료는 그대로 두고, 없는 기호만 더합니다(재료 칸은 «부위 마감 F1» 처럼 이름만 — 고쳐 씀).
 *   줄마다 «찍은 자리»(_찍음 — 그 방의 닫힌 선)를 남겨 ⑥ 결과에서 도면과 오갈 수 있게.
 * @param o {k, 끈층, 표들(도면자동.표찾기), 이름(도면 이름), 옛(지금 공사)}
 * @returns {공사, 말:{실, 마감표, 맞춘, 창호표, 새마감, 표에만(방과 못 이은 마감표 줄)}} — 실을 하나도 못 찾으면 공사 = null
 */
export function 마감자동(모델, o = {}) {
  const k = o.k || 1
  const 끈 = o.끈층 || new Set()
  const 표들 = o.표들 || []
  const 옛 = o.옛 || {}
  const 상자 = 도형상자(모델)
  const 표글자 = new Set(표들.flatMap((t) => t.글자 || []))
  const 창호표 = 창호표읽기(표들)
  const 마감표 = 마감표모음(모델, 표들)          // 🧱 G448b 칸 선 격자 표도
  const 도형들 = 닫힌도형들(모델, 끈, k, 상자)
  const 실 = 실찾기(모델, { k, 끈층: 끈, 표글자, 도형들, 실이름들: 마감표.map((m) => m.실명), 상자 })
  if (!실.length) return { 공사: null, 말: { 실: 0, 마감표: 마감표.length, 맞춘: 0, 창호표: 창호표.length, 새마감: 0 } }
  // 창호 기호 자리 (표 안 글자는 뺌)
  const { T, E } = 모델
  const 옛창 = new Map((옛.창호 || []).map((w) => [String(w.기호 || '').toUpperCase(), w]))
  const 창기호 = new Set([...창호표.map((w) => w.기호), ...옛창.keys()])
  const 자리 = new Map()
  for (let i = 0; i < T.s.length; i++) {
    const e = T.e[i]
    if (E.t[e] !== 종류.글자 || 끈.has(E.ly[e]) || 표글자.has(i)) continue
    const t = 붙임(T.s[i]).toUpperCase()
    if (!창기호.has(t)) continue
    const a = 자리.get(t) || []; a.push([T.x[i] + 글자폭(T, i) / 2 * Math.cos(T.a[i]), T.y[i] + T.h[i] / 2]); 자리.set(t, a)
  }
  const 짝 = 마감표짝(마감표)
  const 옛마감 = new Map((옛.마감 || []).map((m) => [String(m.부위 || '') + '|' + String(m.기호 || '').toUpperCase(), m]))
  const 새마감 = new Map()
  const 부위칸 = [['바닥', '바닥', 'm2'], ['걸레받이', '걸레받이', 'm'], ['벽', '벽', 'm2'], ['천장', '천장', 'm2']]
  let 맞춘 = 0
  const 자동문 = new Set()
  const 쓴표 = new Set()          /* 🅿 G470 방과 이은 마감표 줄 — 나머지는 «평면에 없는 표의 실»(짐작해 잇지 않음 · 화면이 줄로 더해 사람이 누르게) */
  const 실줄 = 실.map((r) => {
    const 창 = []
    for (const [기호, 점들] of 자리) {
      let n = 0
      for (const [x, y] of 점들) if (x >= r.b[0] && x <= r.b[2] && y >= r.b[1] && y <= r.b[3] && 방안(모델, r, x, y)) n++
      if (n) 창.push(n === 1 ? 기호 : 기호 + '*' + n)
    }
    /* 🚪 G298 ③ 창호 기호가 없는 방 — 도면 문 열림 호로 찾은 문(폭마다 «문900» 같은 기호 · 높이 2.1 m)으로 벽 · 걸레받이 공제 */
    if (!창.length && r.문들 && r.문들.length && !샤프트말.test(붙임(r.이름))) {
      const 폭수 = new Map()
      for (const w of r.문들) 폭수.set(w, (폭수.get(w) || 0) + 1)
      for (const [w, n] of [...폭수].sort((a, b) => a[0] - b[0])) { 자동문.add(w); 창.push('문' + w + (n > 1 ? '*' + n : '')) }
    }
    const 줄 = { 층: r.층 || '', 실명: r.이름, 개수: '1', 면적: 짧(r.면적), 둘레: Number.isFinite(r.둘레) ? 짧(r.둘레) : '', 천장고: r.도면천장고 ? String(r.도면천장고) : '', 창호: 창.sort().join(' '),
      ...(r.e >= 0 ? { _찍음: { 면적: [{ e: r.e, v: r.면적 }], ...(Number.isFinite(r.둘레) ? { 둘레: [{ e: r.e, v: r.둘레 }] } : {}) } } : { _자리: [{ n: o.이름 || '', r: r.b }] }),
      _도면: o.이름 || '',
      /* 🧱 G298 검산 · 3D — 찾은 길(닫힌 선 · 벽) · 설계자 면적 글 · 면적선(벽 중심) · 방 다각형(도면 단위) */
      _방: { 길: r.방법 === '벽' ? '벽' : '선', ...(r.도면면적 ? { 도면면적: r.도면면적 } : {}), ...(r.면적선 ? { 면적선: 짧(r.면적선) } : {}), ...(r.숨은이름 ? { 숨은이름: true } : {}), ...(r.중심면적 ? { 중심면적: 짧(r.중심면적) } : {}), ...(r.이름없음 ? { 이름없음: true } : {}), ...(r.오픈 ? { 오픈: true } : {}), ...(r.위뚫림 ? { 위뚫림: true } : {}), ...(r.짐작 ? { 짐작: true } : {}), ...(r.마감없음 ? { 마감없음: true } : {}), ...(r.뺀 ? { 뺀: r.뺀.map((x) => ({ 이름: x.이름, 면적: 짧(x.면적) })) } : {}), ...(r.뗀 ? { 뗀: r.뗀.map((x) => ({ 이름: x.이름, 면적: 짧(x.면적) })) } : {}), ...(r.뗌 ? { 뗌: r.뗌 } : {}), ...(샤프트말.test(붙임(r.이름)) ? { 샤프트: true } : {}), ...(r.닻 ? { 닻: r.닻.map((v) => Math.round(v)) } : {}), ...(r.디딤 ? { 디딤: 짧(r.디딤) } : {}), ...(k !== 1 ? { k } : {}), 점: 방점(모델, r) } }
    const 덧 = 방덧말(r)
    if (덧) 줄.비고 = 덧
    const 찾음 = 짝(r.이름, r.층)
    const m = 찾음 && 찾음.m
    if (찾음 && 찾음.여럿) for (const x of 찾음.여럿) 쓴표.add(x)
    if (m) {
      맞춘++
      쓴표.add(m)
      if (m.천장고) 줄.천장고 = m.천장고
      for (const [부위, 칸, 단위] of 부위칸) {
        const v = 글(m[칸])
        if (!v || /^[-—–]$/.test(v)) continue
        줄[칸] = v
        const 열 = 부위 + '|' + v.toUpperCase()
        const 표마감 = m.마감들 && m.마감들[칸]        // 🧱 G448b 격자 표: 상세번호 기호 + 도면에 적힌 바탕 · 마감 재료
        if (!옛마감.has(열) && !새마감.has(열)) 새마감.set(열, 표마감 ? { 기호: v, 부위, 이름: 표마감.이름, 재료: 표마감.재료.map((x) => ({ ...x })) } : { 기호: v, 부위, 이름: v, 재료: [{ 재료: /^[A-Z]{1,3}-?\d{1,3}$/i.test(v) ? 부위 + ' 마감 ' + v : v, 규격: '', 단위, 계수: '1' }] })
      }
      if (m.비고) 줄.비고 = (줄.비고 ? 줄.비고 + ' · ' : '') + m.비고
    } else if (찾음 && 찾음.여럿) {
      줄.비고 = (줄.비고 ? 줄.비고 + ' · ' : '') + '마감표에 같은 이름이 ' + 찾음.여럿.length + '줄(' + [...new Set(찾음.여럿.map((x) => x.층 || '층 없음'))].join(' · ') + ') — 층으로 못 골라 비웠습니다'
    }
    // 마감표에 없는 칸(몰딩 등)·마감표에 없는 방 — 예전 공사에 같은 이름의 방이 있으면 그 기호를 이어 씀
    const 옛방 = (옛.실 || []).find((x) => 실키(x.실명 || '') === 실키(r.이름.split('·')[0]))
    if (옛방) for (const 칸 of ['바닥', '걸레받이', '벽', '천장', '몰딩', '천장고', '구역', '변수']) if (옛방[칸] && !줄[칸]) 줄[칸] = 옛방[칸]
    return 줄
  })
  const 창호 = [...(옛.창호 || [])]
  for (const w of [...자동문].sort((a, b) => a - b)) if (!창호.some((x) => String(x.기호 || '') === '문' + w)) 창호.push({ 기호: '문' + w, 구분: '문', 폭: String(w / 1000), 높이: '2.1', 비고: '도면 문 열림 호로 찾음(자동 · 높이 2.1 m 로 봄 — 고쳐 쓰십시오)' })
  for (const w of 창호표) if (!옛창.has(w.기호)) 창호.push({ 기호: w.기호, 구분: w.구분, 폭: w.폭, 높이: w.높이, 비고: w.수량 ? '도면 수량 ' + w.수량 : '' })
  const 공사 = {
    ...옛, 이름: 옛.이름 || '도면에서 자동 — ' + (o.이름 || ''),
    기준: { 천장고: '', 자리: 3, ...(옛.기준 || {}) },
    마감: [...(옛.마감 || []), ...새마감.values()], 창호, 실: 실줄,
    외벽: 옛.외벽 || [], 묶음: 옛.묶음 || [], 조합: 옛.조합 || [], 치환: 옛.치환 || [], 창호조합: 옛.창호조합 || [],
  }
  const 표에만 = 마감표.filter((m) => !쓴표.has(m) && 글(m.실명))
  return { 공사, 말: { 실: 실줄.length, 마감표: 마감표.length, 맞춘, 창호표: 창호표.length, 새마감: 새마감.size, 표에만 } }
}

const 샤프트말 = /^(EPS|PS|TPS|AD|DA|DS|DUCT|덕트|샤프트|SHAFT|AV)$/i
const 떼말 = /승강로|HOISTWAY|샤프트|SHAFT/i              /* 🛗 G469 방에서 떼어 낼 글 */
const 승강글 = /^(E\/?V|ELEV|ELEVATOR|LIFT|승강기|엘리베이터)$/i
const 홀글 = /HALL|홀|로비|LOBBY|전실|복도|대기|ROOM/i
/** 🏠 G298 실 줄 «비고» — 자동으로 찾은 방에 사람이 볼 것 */
function 방덧말(r) {
  const 말 = []
  if (r.짐작) 말.push(/화장실/.test(r.이름) ? '이름 추정(위생기구)' : /계단/.test(r.이름) ? '이름 추정(계단 디딤판)' : /복도/.test(r.이름) ? '이름 추정(좁고 긴 공간)' : '이름 추정(승강기 선) — 마감 없으면 지우십시오')
  else if (r.이름없음) 말.push('도면에 실 이름 없음 — 이름을 적으십시오')
  if (r.위뚫림) 말.push('위층이 뚫린 두 층 높이(OPEN) — 천장고 확인')
  else if (r.오픈) 말.push('OPEN 글 — 뚫린 곳이면 지우십시오')
  if (샤프트말.test(붙임(r.이름))) 말.push('샤프트 — 마감 없으면 지우십시오')
  if (r.밖) 말.push('이름 든 방들 밖(연결 통로 · 옆 건물?) — 이 공사 것이 아니면 지우십시오')
  if (r.뺀) 말.push('열린 공간 속 «' + r.뺀.map((x) => x.이름.split('·')[0]).join('·') + '» 면적을 뺌')
  if (r.뗀) 말.push('승강기 문 자리에서 «' + r.뗀.map((x) => x.이름 + ' ' + x.면적.toFixed(2) + ' ㎡').join(' · ') + '» 를 떼어 냄')
  if (r.뗌) 말.push('«' + r.뗌 + '» 에서 떼어 낸 승강로 · 샤프트 — 마감 없음')
  if (r.방법 !== '벽' && /AREA|면적/i.test(r.레이어 || '')) 말.push('면적 선(벽 중심)으로 셈 — 안목보다 조금 큼')
  return 말.join(' · ')
}
/* ══════════════════════════════════════════════════════════════
 *  🧊 2026-10-16 소장님 「마감 물량에서 방 목록 어느 줄을 눌러도 3D 에서 그 방이 켜지게」(나)
 *  ③ 실 표의 면적 칸을 누르고 도면의 방 안을 누른 줄도 3D 에 나오게 — 누른 자리의 방 모양 · 판 제목 자리(닻)를 줄에 남깁니다.
 *  (전엔 ⚡ 자동으로 찾은 방만 모양(_방.점)이 있어 3D 에 나왔음)
 * ══════════════════════════════════════════════════════════════ */
const 판닻판 = new WeakMap()
/** 점(모델 좌표)에서 가장 가까운 판 제목(«1층 평면도» 등) — {f: 층, x, y} · 없으면 null */
export function 판닻(모델, x, y) {
  let 고르개 = 판닻판.get(모델)
  if (!고르개) {
    const l = []; const { T } = 모델; for (let i = 0; i < T.s.length; i++) { const f = 평면층(T.s[i]); if (f) l.push({ f, x: T.x[i], y: T.y[i] }) }
    /* 🧱 G462 같은 판 테두리 안의 제목(실찾기와 같은 규칙) */
    고르개 = l.length ? 제목고르개(모델, 닫힌도형들(모델, null, 1), l) : () => null
    판닻판.set(모델, 고르개)
  }
  return 고르개(x, y)
}
/** 닫힌 도형 e 의 모양(첫 조각 · 도면 단위 · 꼭짓점 300 개까지) */
export function 도형점(모델, e) {
  const { Q, P } = 모델
  for (let q = 0; q < Q.e.length; q++) {
    if (Q.e[q] !== e) continue
    const s0 = Q.p0[q], n = Q.pn[q]
    if (n < 3) continue
    const 줄임 = n > 300 ? Math.ceil(n / 300) : 1
    const 점 = []
    for (let k = 0; k < n; k += 줄임) 점.push([Math.round(P[(s0 + k) * 2]), Math.round(P[(s0 + k) * 2 + 1])])
    return 점
  }
  return null
}

/** 방 다각형(도면 단위 · 꼭짓점 300 개까지) — 벽으로 찾은 방은 그 다각형 · 닫힌 선 방은 그 선의 첫 조각 */
function 방점(모델, r) {
  let 점 = r.다각형
  if (!점 && r.qs && r.qs.length) { const { Q, P } = 모델; const q = r.qs[0], s0 = Q.p0[q], n = Q.pn[q]; 점 = []; for (let k = 0; k < n; k++) 점.push([P[(s0 + k) * 2], P[(s0 + k) * 2 + 1]]) }
  if (!점) return null
  const 줄임 = 점.length > 300 ? Math.ceil(점.length / 300) : 1
  return 점.filter((_, i) => i % 줄임 === 0).map(([x, y]) => [Math.round(x), Math.round(y)])
}

/** 산출서에 넣을 줄의 수량을 엑셀 식으로 (소수 셋째 자리) */
export function 수식글(v) { return 짧(셋(v)) }
