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
  const t = 글(이름).replace(/^.*\$0\$/, '')          // 바인드된 외부참조 «XR 평면도$0$WALL» → «WALL»
  if (!t) return null
  for (const [re, 품명, 종, 갈래] of 뜻표) if (re.test(t)) return { 품명, 종, 갈래 }
  if (주석층.test(t)) return { 주석: true }
  return null
}
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

const 실말 = /(실|방|룸|홀|로비|복도|계단|현관|거실|주방|식당|욕실|화장실|변소|샤워|창고|발코니|베란다|다용도|드레스|파우더|세탁|보일러|펌프|물탱크|사무|회의|휴게|탕비|대기|상담|객장|금고|숙직|경비|강당|교실|병실|진료|주차|램프|승강기|엘리베이터|E\/?V|PIT|피트|덕트|DUCT|포치|테라스|옥탑|다락|알파|안방|부엌|취사|식품|매장|점포|공용|로비|통로|전실|부속|탈의|목욕|헬스|체력|열람|도서|자료|서고|전산|서버|통신|방재|중앙|관리|ROOM|HALL|LOBBY|CORR|OFFICE|TOILET|STOR|KITCHEN|BED|LIVING|BATH)/i
const 실아님 = /(소방|설비|통신설비|전기설비|새마을금고|공사|현장|주식회사|㈜|건축사|사무소$|구조|토목|조경|허가|준공|지붕|대지|도로|부지|경계|인접|건축선|옥외|외부|평면|단면|입면|배치|도면|축척|SCALE|표$|일람|범례|주기|비고|마감|재료|규격|수량|기준|상세|계획|위치|구조|설비|전기|기계설비|소방설비|NOTE|TYPE|타입|참조|참고|S=|1\/\d|방향|방수층|방수턱|계단참|UP|DN|DOWN|\d+층$)/i
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
export function 실키(s) { return 붙임(s).replace(/\(.*?\)/g, '').replace(/[-_]?\d+$/, '').replace(/[·.]/g, '').toUpperCase() }

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
 * 실 찾기
 * @returns [{이름, 층, 면적, 둘레, e, x, y, 글자:[i], 해치}]
 */
export function 실찾기(모델, o = {}) {
  const { T, E } = 모델
  const k = o.k || 1
  const 끈 = o.끈층 || new Set()
  const 표글자 = o.표글자 || new Set()
  const 도형들 = o.도형들 || 닫힌도형들(모델, 끈, k, o.상자)
  const 아는 = o.실이름들 ? new Set([...o.실이름들].map(실키)) : null
  const 제목 = []
  for (let i = 0; i < T.s.length; i++) { const f = 평면층(T.s[i]); if (f) 제목.push({ f, x: T.x[i], y: T.y[i] }) }
  // 실 이름 글자 자리 (먼저 모두) — 한 닫힌 선이 이름을 셋 넘게 품으면 층 외곽선으로 봄
  const 이름자리 = []
  for (let i = 0; i < T.s.length; i++) {
    const e = T.e[i]
    if (E.t[e] !== 종류.글자 || 끈.has(E.ly[e]) || 표글자.has(i) || !실이름인가(T.s[i], 아는)) continue
    이름자리.push([T.x[i] + 글자폭(T, i) / 2 * Math.cos(T.a[i]), T.y[i] + T.h[i] / 2])
  }
  const 외곽판 = new Map()
  const 외곽 = (d) => {
    let v = 외곽판.get(d.e)
    if (v !== undefined) return v
    let n = 0
    for (const [x, y] of 이름자리) { if (x < d.b[0] || x > d.b[2] || y < d.b[1] || y > d.b[3]) continue; if (안인가(모델, d.qs, x, y) && ++n >= 3) break }
    v = n >= 3; 외곽판.set(d.e, v); return v
  }
  const 모음 = new Map()
  for (let i = 0; i < T.s.length; i++) {
    const e = T.e[i]
    if (E.t[e] !== 종류.글자) continue
    if (끈.has(E.ly[e])) continue
    if (!실이름인가(T.s[i], 아는)) continue
    if (표글자.has(i)) continue
    const cx = T.x[i] + 글자폭(T, i) / 2 * Math.cos(T.a[i]), cy = T.y[i] + T.h[i] / 2
    const d = 품은(모델, 도형들, cx, cy, 0.8, 1500, (x) => (!주석층.test(x.층) || /실|ROOM|AREA|면적/i.test(x.층)) && !외곽(x))
    if (!d) continue
    const a = 모음.get(d.e)
    if (a) { if (!a.이름.split('·').includes(글(T.s[i]))) a.이름 += '·' + 글(T.s[i]); a.글자.push(i); continue }
    let 층 = ''
    if (제목.length) {
      let best = Infinity
      for (const t of 제목) { const dd = Math.hypot(t.x - cx, t.y - cy); if (dd < best) { best = dd; 층 = t.f } }
    }
    모음.set(d.e, { 이름: 글(T.s[i]), 층, 면적: d.A, 둘레: d.L, e: d.e, x: cx, y: cy, 글자: [i], 해치: d.해치, 레이어: d.층, qs: d.qs, b: d.b })
  }
  // 한 닫힌 선이 실 이름을 셋 넘게 품으면 방이 아니라 층 외곽선 — 뺌 (방이 선으로만 그려진 평면도)
  return [...모음.values()].filter((r) => r.이름.split('·').length <= 2).sort((a, b) => (a.층 || '').localeCompare(b.층 || '', 'ko', { numeric: true }) || a.이름.localeCompare(b.이름, 'ko', { numeric: true }))
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

/* ───────────────────────────── 모두 */

/**
 * 한 도면에서 모든 물량
 * @param 모델 골조도면.도면읽기() 결과
 * @param o {k: 도면 단위→mm, 끈층:Set, 표들: 도면자동.표찾기() 결과, 상자}
 * @returns {항목:[{key, 구분, 품명, 규격, 단위, 수량, 근거, 갈래, 켬}], 레이어:[…], 블록:[…], 기호:[…], 실:[…], 마감:{…}|null, 창호:[…]}
 */
export function 모두(모델, o = {}) {
  const k = o.k || 1
  const 끈 = o.끈층 || new Set()
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
    if (종 === '길이' && a.선수 > 0 && a.길이m > 0.001) {
      항목.push({ key: '층길이:' + a.이름, 구분: '레이어 길이', 품명, 규격: '', 단위: 'm', 수량: a.길이m, 근거: '레이어 «' + a.이름 + '» 선 ' + a.선수 + '개 길이 합', 갈래, 켬: true })
    }
    if (종 === '면적') {
      if (a.면수 > 0 && a.면적m2 > 0.001) 항목.push({ key: '층면적:' + a.이름, 구분: '레이어 면적', 품명, 규격: '', 단위: 'm²', 수량: a.면적m2, 근거: '레이어 «' + a.이름 + '» 닫힌 도형 ' + a.면수 + '개 면적 합', 갈래, 켬: true })
      else if (a.선수 > 0) 항목.push({ key: '층길이:' + a.이름, 구분: '레이어 길이', 품명: 품명 + ' (선 길이)', 규격: '', 단위: 'm', 수량: a.길이m, 근거: '레이어 «' + a.이름 + '» 에 닫힌 도형이 없어 선 길이만 ' + a.선수 + '개', 갈래, 켬: false })
    }
  }
  // ② 블록
  const 블록 = S.블록.map((b) => ({ ...b, 뜻: 블록뜻(b.이름) }))
  for (const b of 블록) {
    if (b.뜻.주석) continue
    const 품명 = b.뜻.품명 ? b.뜻.품명 + (b.뜻.품명 === b.이름 ? '' : ' (' + b.이름 + ')') : b.이름
    항목.push({ key: '블록:' + b.이름, 구분: '블록 개수', 품명, 규격: '', 단위: '개', 수량: b.수, 근거: '블록 «' + b.이름 + '» ' + b.수 + '개 (레이어 ' + b.층 + ')' + (b.뜻.품명 ? (b.뜻.품명 === '기둥' ? ' — 기둥 표시는 여러 장에 겹쳐 나올 수 있어 처음엔 꺼 둠' : '') : ' — 이름으로 뜻을 몰라 처음엔 꺼 둠'), 갈래: '', 켬: !!b.뜻.품명 && b.뜻.품명 !== '기둥' })
  }
  // ③ 기호 글자 (표 안은 뺌)
  const { T, E } = 모델
  const 기호수 = new Map()
  for (let i = 0; i < T.s.length; i++) {
    const e = T.e[i]
    if (E.t[e] !== 종류.글자) continue
    if (끈.has(E.ly[e])) continue
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
  const 마감표 = 마감표읽기(표들)
  if (!마감표.length) for (const r of 마감표찾기(모델)) 마감표.push(r)
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
    const 표 = new Map(마감표.map((m) => [실키(m.실명), m]))
    for (const r of 실) {
      const m = 표.get(실키(r.이름.split('·')[0])) || null
      if (!m) continue
      // 방 안의 창호 기호
      const 창 = []
      for (const a of 기호) {
        if (!창표.has(a.기호)) continue
        let n = 0
        for (const [x, y] of a.자리) if (안인가(모델, r.qs, x, y)) n++
        if (n) 창.push(n === 1 ? a.기호 : a.기호 + '*' + n)
      }
      const 줄 = { 층: r.층, 실명: r.이름, 개수: '1', 면적: 짧(r.면적), 둘레: Number.isFinite(r.둘레) ? 짧(r.둘레) : '', 천장고: m.천장고 || '', 창호: 창.join(' ') }
      for (const [부위, 칸, 단위] of 부위칸) {
        const v = 글(m[칸])
        if (!v || /^[-—–]$/.test(v)) continue
        줄[칸] = v
        const 열 = 부위 + '|' + v
        if (!마감들.has(열)) 마감들.set(열, { 기호: v, 부위, 이름: v, 재료: [{ 재료: /^[A-Z]{1,3}-?\d{1,3}$/i.test(v) ? 부위 + ' 마감 ' + v : v, 규격: '', 단위, 계수: '1' }] })
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
        항목.push({ key: '마감:' + a.재료 + '|' + a.규격 + '|' + a.단위, 구분: '마감 (실내재료마감표 × 실)', 품명: a.재료, 규격: a.규격, 단위: a.단위, 수량: a.수량, 근거: '실 ' + 실줄.length + '개 — 바닥·천장=면적 · 벽=둘레×천장고−창호 · 걸레받이=둘레−문 폭', 갈래: '건축', 켬: true })
      }
    }
  }
  return { 항목, 레이어, 블록, 기호, 실, 마감, 창호, 마감표, 창호표 }
}

/** 산출서에 넣을 줄의 수량을 엑셀 식으로 (소수 셋째 자리) */
export function 수식글(v) { return 짧(셋(v)) }
