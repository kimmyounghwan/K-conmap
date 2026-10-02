/**
 * 🏗⚡ 골조 자동 — 구조평면도 + 부재 일람표를 넣으면 골조 산출 «공사» 를 스스로 채웁니다 (2026-09-27)
 *
 * 소장님: 「적산에서 왜 골조 물량을 찍어야 된다고 했지?. 도면만 주면 스스로 물량을 내는 거잖아」
 *         「물량은 자동으로 뽑아서 엑셀로 다운 받을 수 있게 해줘」 · 「도면을 주면 도면에 나와있는 물량은 자동으로 엑셀로 정리되게 해줘」
 *
 * ■ 하는 일 (사람이 찍던 것을 스스로)
 *   ① 일람표 — 부재 기호(G1·C1·S1·W1·F1) 둘레의 철근 글자(4-HD22 · HD10@150 · 400X700 · THK150)를 모아
 *      머리 글(상부근·하부근·늑근·단부·중앙·단변·장변·수직·수평…)로 뜻을 붙여 «배근표» 를 만듦
 *   ② 평면 — 제목(2층 구조평면도 · 지붕층 · 기초 평면도 · 2F FRAMING PLAN)으로 층을 정하고, 기호 글자마다
 *      보: 기호 옆 «나란한 두 선»(폭 = 일람표의 폭) → 기둥·걸친 보에서 끊어 한 칸씩(안목 + 받침 반폭 = 길이·좌단·우단)
 *      기둥·기초: 기호 개수 · 슬래브: 기호에서 네 방향으로 보 가운데까지(통심 단변×장변) · 벽: 두 선 사이 두께·길이
 *   ③ 층 높이 — «FL+3,600» 같은 글자로 층고, 없으면 3,300 으로 짐작(화면에 «짐작» 표시)
 *   → 결과는 lib/골조.js 의 «공사» 모양 그대로 — 셈·엑셀·골조 화면(/jeoksan/golgo)에서 그대로 열고 고칠 수 있음
 * ■ 짐작은 늘 근거와 함께(어느 도면·어느 글자·몇 mm). 못 읽은 것은 «경고» 로 모아 보여 줌 — 숨기지 않음
 * ■ 층 규칙은 골조.js 와 같음: n층 = n층 기둥·벽 + 그 위 바닥(보·슬래브). «2층 구조평면도» 의 보·슬래브·그 아래 기둥 → 1층
 * ■ 시험: node tools/시험_골조자동.mjs (가상 예시 두 가지 버릇 — 손으로 적은 답과 맞춤)
 */
import { 종류 } from './골조도면.js'
import { 새공사, 새동, 엑셀 as 골조엑셀, 정착표 } from './골조.js'
import { 표찾기, 넣을것, 칸이름 } from './정착표읽기.js'
import { 도곽찾기 } from './dxfplot.js'

const 글 = (x) => String(x ?? '').trim()
const 붙 = (s) => String(s ?? '').replace(/\s+/g, '')
const 반올림 = (v, d = 0) => { const k = Math.pow(10, d); return Math.round(v * k) / k }
/** 🔗 줄마다 «도면의 어디서 읽었나» (2026-09-28 결과 ↔ 도면 오가기) — {n: 도면 이름, r: [x0,y0,x1,y1] 도면 단위} */
const 자리만들기 = (이름, r) => ({ n: 이름 || '', r: r.map((v) => 반올림(v, 1)) })

/* ───────────────────────────── 글자 뜻 */

/** 부재 기호 — 「G1」「2G1」「RG1」「B1C2」「TG1A」 → {기호, 몸(층 표시 뗀 것), 종류:'보'|'기둥'|'슬라브'|'벽'|'기초'} */
export function 기호풀이(s) {
  /* 🛠 G118 — 「(G1)」「G-1」 → G1 */
  let m0
  let t = 붙(s).toUpperCase()
  if ((m0 = /^[(\[]([A-Z0-9]{2,6})[)\]]$/.exec(t))) t = m0[1]
  if ((m0 = /^([A-Z]{1,3})-(\d{1,2}[A-Z]?)$/.exec(t))) t = m0[1] + m0[2]
  const m = /^(B\d{1,2}|\d{1,2}|R|PH\d?|RF)?([A-Z]{1,3})(\d{1,2}[A-Z]?)$/.exec(t)
  if (!m) return null
  let 앞 = m[1] || '', 글자 = m[2]
  const 끝 = 글자[글자.length - 1]
  if (/^(X|Y|D|H|HD|SD|SHD|UHD|EL|FL|GL|SL|KS|NO|STA|PL|TH|THK|L|R|M|MM|CM|T|A|AW|WD|SW|PW|AD|SD|FD|WW|CW|DS)$/.test(글자) && !(글자 === 'DS' && 앞)) {
    // 창호(AW·WD)·철근(D·HD)·통심선(X·Y)·높이(EL·FL) 들 — 부재 아님
    return null
  }
  let k = null
  if (끝 === 'G' || 끝 === 'B') k = '보'
  else if (끝 === 'C') k = '기둥'
  else if (끝 === 'S') k = '슬라브'
  else if (끝 === 'W') k = '벽'
  else if (끝 === 'F') k = '기초'
  if (!k) return null
  return { 기호: t, 몸: 글자 + m[3], 층표: 앞, 종류: k }
}
/** 🛠 G118 — 평면의 기호 글자: 크기를 붙여 적은 꼴(「G1(400X700)」「G1 400X700」)도 기호로 (일람표 칸은 기호풀이 그대로) */
export function 평면기호(s) {
  const r = 기호풀이(s)
  if (r) return r
  const m = /^(\s*)([A-Za-z0-9]{2,6})\s*[(\[]?\s*\d{3,4}\s*[Xx×*]\s*\d{3,4}(?:\s*[Xx×*]\s*\d{3,4})?\s*[)\]]?\s*$/.exec(String(s ?? ''))
  if (!m) return null
  const r2 = 기호풀이(m[2])
  return r2 ? { ...r2, 앞: m[1].length, 길이: m[2].length } : null     // 앞 · 길이 — 글자 안에서 기호가 차지한 자리(가운데를 기호 쪽으로)
}
/** 글자 폭 짐작 — 준비() 와 같은 셈(한글 1 · 빈칸 0.5 · 나머지 0.75 × 높이) */
const 폭짐작 = (s, h) => { let w = 0; for (const ch of s) w += /[ㄱ-힝]/.test(ch) ? 1.0 : (ch === ' ' ? 0.5 : 0.75); return w * h }
/** 한 글자 칸에 기호가 여럿 — 「G1, G2」「2G1·3G1」 */
function 기호들(s) {
  const t = 붙(s).toUpperCase()
  if (!t || t.length > 30) return []
  const parts = t.split(/[,·/&]|(?:\bAND\b)/).filter(Boolean)
  const out = []
  for (const p of parts) { const r = 기호풀이(p); if (!r) return []; out.push(r) }
  return out
}

/** 층 이름 하나 — 「1F」「1층」「B1F」「지하1층」「R」「RF」「옥상」「PH」「PHR」「옥상지붕」 → '1'·'B1'·'R'·'PR' (모르면 null) */
export function 층말(t0) {
  const t = 붙(t0).toUpperCase().replace(/층$/, '')
  if (!t) return null
  if (/^(PHR|PR|PRF|옥상지붕|옥탑지붕|PH지붕)$/.test(t)) return 'PR'
  if (/^(R|RF|RFL|ROOF|옥상|지붕|PH|PHF|옥탑)$/.test(t)) return 'R'
  let m
  if ((m = /^(?:지하|B)(\d{1,2})F?L?$/.exec(t))) return 'B' + +m[1]
  if ((m = /^(?:지상)?(\d{1,2})F?L?$/.exec(t))) return String(+m[1])
  if (t === 'FT' || t === '기초') return 'FT'
  return null
}
/** 범위 글 — 「ALL」「전층」 → {전체} · 「B1F ~ 2F」「1~PHR」「2-4」 → {a, b} · 「3F」「R」 → {목록:[..]} · 「B1,1」 → {목록} · 모르면 null */
export function 범위풀이(t0) {
  const t = 붙(t0).toUpperCase().replace(/[()（）]/g, '')
  if (!t) return null
  if (/^(ALL|전층|공통|모든층|TYP|TYPICAL|기준층)$/.test(t)) return { 전체: true }
  let m
  if ((m = /^([^~∼\-]+)[~∼\-]([^~∼\-]+)$/.exec(t))) { const a = 층말(m[1]), b = 층말(m[2]); if (a && b) return { a, b } }
  const 조각 = t.split(/[,·/]/).filter(Boolean)
  const 목록 = 조각.map(층말)
  if (목록.length && 목록.every(Boolean)) return { 목록 }
  return null
}
/** 일람표의 기호 칸 — 「(R) G1」「(ALL) WG1」「(1) WG2」「1~PHR S1」「C1, C4」「B1, B2, B3」 → {기호들, 범위} */
export function 기호칸(s) {
  const t = 글(s)
  if (!t || t.length > 40) return null
  let 범위 = null, 몸글 = t, m
  if ((m = /^[(（]([^)）]{1,14})[)）]\s*(.+)$/.exec(t))) { 범위 = 범위풀이(m[1]); if (!범위) return null; 몸글 = m[2] }
  else if ((m = /^(\S+?)\s+(\S.*)$/.exec(t))) { const r = 범위풀이(m[1]); if (r && (r.a || r.전체)) { 범위 = r; 몸글 = m[2] } }
  const 기 = 기호들(몸글)
  if (!기.length) return null
  return { 기호들: 기, 범위: 범위 && 범위.전체 ? null : 범위 }
}

const RE개수 = /(\d{1,2})\s*-\s*[A-Z]{0,3}D(\d{2})(?!\d)/g
const RE간격 = /[A-Z]{0,3}D(\d{2})(?:\s*\+\s*[A-Z]{0,3}D(\d{2}))?\s*-?\s*@\s*(\d{2,4})/g      // 🛠 G118 「HD10-@150」 도
const RE크기 = /(\d{1,2},\d{3}|\d{3,4})\s*[X×x*]\s*(\d{1,2},\d{3}|\d{3,4})(?:\s*[X×x*]\s*(\d{1,2},\d{3}|\d{3,4}))?/
const RE두께 = /(?:THK|THICK|T\s*=|(?<![×X*]\s?)D\s*=|H\s*=|두께)\s*[=:]?\s*(\d{2,4})|(\d{2,4})\s*THK/i     // 🛠 G118 「B×D=400×700」 의 D= 는 두께 아님
const RE지름 = /[ØΦ∅]\s*(\d{3,4})|%%C\s*(\d{3,4})|^\s*D\s*(\d{3,4})\s*$/i
const 철규 = (n) => { const d = 'D' + n; return ['D10', 'D13', 'D16', 'D19', 'D22', 'D25', 'D29', 'D32', 'D35', 'D38', 'D41', 'D51'].includes(d) ? d : '' }

/** 글자 한 칸의 «값 토막» — [{k:'개수',n,d} | {k:'간격',d,d2,s,글} | {k:'크기',a,b,c} | {k:'두께',t} | {k:'지름',t}] */
const RE철골 = /^\s*(H|I|C|L|ㄷ|ㅁ|□|■|○|◎|Ø|Φ|P|RHS|SHS|BOX|TUBE|PIPE|CT|SQ|LGS|Z)\s*[-–]\s*\d|\d\s*[X×*]\s*\d+(\.\d+)?\s*T\b|^H\s*\d{3}\s*[X×*]/i
export function 토막들(s) {
  const u = String(s ?? '').toUpperCase().replace(/[−–—]/g, '-')
    /* 🛠 G118 — 「B400×D700」 → 400×700 */
    .replace(/\bB\s*=?\s*(\d{3,4})\s*([X×*])\s*[DH]\s*=?\s*(\d{3,4})/, '$1$2$3')
  // 철골 단면(H-400X200X8X13 · ㅁ-125X125X5t · C-100X50X20X2.3T) — 철근콘크리트 값으로 읽지 않음
  if (RE철골.test(u) && !/[A-Z]{0,3}D\d{2}\s*@|\d\s*-\s*[A-Z]{0,3}D\d{2}/.test(u)) return [{ k: '철골', 글: 글(s) }]
  const out = []
  let m
  RE간격.lastIndex = 0
  const 가린 = u.replace(RE간격, (all, a, b, sp) => {
    const d = 철규(a), d2 = b ? 철규(b) : ''
    if (d && (!b || d2)) out.push({ k: '간격', d, d2, s: +sp, 글: d + (d2 ? '+' + d2 : '') + '@' + sp })
    return ' '.repeat(all.length)
  })
  RE개수.lastIndex = 0
  while ((m = RE개수.exec(가린))) { const d = 철규(m[2]); if (d && +m[1] > 0) out.push({ k: '개수', n: +m[1], d, 글: m[1] + '-' + d }) }
  // 「HD13-2EA」「D22×4EA」 처럼 개수를 뒤에 적은 꼴
  const RE개수뒤 = /[A-Z]{0,3}D(\d{2})\s*[-×X*]\s*(\d{1,2})\s*(?:EA|개|본)/g
  while ((m = RE개수뒤.exec(가린))) { const d = 철규(m[1]); if (d && +m[2] > 0 && !out.some((o) => o.k === '개수' && o.d === d && o.n === +m[2])) out.push({ k: '개수', n: +m[2], d, 글: m[2] + '-' + d }) }
  /* 🛠 G118 — 「4EA-HD22」 · 칸 전체가 「HD22-4」 */
  const RE개수앞 = /(\d{1,2})\s*(?:EA|개|본)\s*-\s*[A-Z]{0,3}D(\d{2})(?!\d)/g
  while ((m = RE개수앞.exec(가린))) { const d = 철규(m[2]); if (d && +m[1] > 0 && !out.some((o) => o.k === '개수' && o.d === d && o.n === +m[1])) out.push({ k: '개수', n: +m[1], d, 글: m[1] + '-' + d }) }
  if (!out.some((o) => o.k === '개수') && (m = /^\s*[A-Z]{0,3}D(\d{2})\s*-\s*(\d{1,2})\s*$/.exec(가린))) { const d = 철규(m[1]); if (d && +m[2] > 0) out.push({ k: '개수', n: +m[2], d, 글: m[2] + '-' + d }) }
  if ((m = RE크기.exec(u))) { const n = (x) => +String(x).replace(/,/g, ''); out.push({ k: '크기', a: n(m[1]), b: n(m[2]), c: m[3] ? n(m[3]) : null }) }
  if ((m = RE두께.exec(u))) out.push({ k: '두께', t: +(m[1] || m[2]) })
  if ((m = RE지름.exec(u))) out.push({ k: '지름', t: +(m[1] || m[2] || m[3]) })
  return out
}

/** 머리 글(역할) — 한 칸에 여럿일 수 있음(「단변 상부」) */
export function 역할들(s) {
  const t = 붙(s).toUpperCase().replace(/[()（）\[\]]/g, '')
  const r = new Set()
  if (!t || t.length > 16) return r
  if (/단변|SHORT|X방향|X-DIR|주근방향/.test(t)) r.add('단변')
  if (/장변|LONG|Y방향|Y-DIR|배력/.test(t)) r.add('장변')
  if (/상부|상단|TOP|UPPER/.test(t)) r.add('상')
  if (/하부|하단|BOT|BOTTOM|LOWER/.test(t)) r.add('하')
  if (/늑근|STIRR|스터럽|전단근/.test(t)) r.add('늑')
  if (/띠철근|띠근|대근|HOOP|TIE/.test(t)) r.add('대')
  if (!r.has('상') && !r.has('하') && /^(주근|주철근|MAIN|수직주근)/.test(t)) r.add('주')
  if (/^(복부근|부근|SKIN|WEB|측면근)/.test(t)) r.add('부')
  if (/단부|END|EXT|외단|양단|^INT|내단|EDGE|BOTH/.test(t)) r.add('단부')
  if (/중앙|CEN|MID|중간부/.test(t)) r.add('중앙')
  if (/수직|^VERT|^V$|세로근/.test(t)) r.add('수직')
  if (/수평|^HORI|^H$|가로근/.test(t)) r.add('수평')
  if (/^(SIZE|B[×X*]D|BXD|단면|크기|규격|치수|단면크기)$/.test(t)) r.add('크기')
  if (/^(두께|THK|THICK|THICKNESS|T)(MM)?$/.test(t)) r.add('두께')
  if (/^(부호|기호|SYMBOL|MARK|NAME|부재|부재명|MEMBER|MEMBERS)$/.test(t)) r.add('부호')
  if (/^(층|FLOOR|LEVEL|STORY|적용층|해당층)$/.test(t)) r.add('층')
  if (/^(위치|구분|POSITION|LOC)$/.test(t)) r.add('위치')
  return r
}

/** 층 이름 차례 (B3 < B2 < B1 < FT? … ) — FT 는 맨 아래 */
function 층값(f) {
  if (f === 'FT') return -1000
  if (/^B\d+$/.test(f)) return -+f.slice(1)
  if (/^\d+$/.test(f)) return +f
  if (/^PH\d*$/.test(f)) return 900 + (+f.slice(2) || 0)
  if (f === 'R') return 1000
  if (f === 'PR') return 1100
  return 0
}
const 층차례 = (a, b) => 층값(a) - 층값(b)

/** 평면 제목 → 바닥 높이 이름들 ['2'] · ['3','4','5'] · ['R'] · ['FT'] · null(평면 제목 아님) */
export function 제목층(s) {
  const t = 붙(s).toUpperCase()
  if (!/(구조평면|골조평면|보평면|기초평면|기초배치|FRAMING|STRUCTURALPLAN|STR\.?PLAN|BASEPLAN|FOUNDATIONPLAN|FOOTINGPLAN|슬[래라]브평면|구조도$|바닥구조|주심도|기둥배치|기둥평면|COLUMNPLAN|COLUMNLAYOUT)/.test(t)) return null
  if (/일람|LIST|SCHEDULE|상세|DETAIL|단면|SECTION|배근도/.test(t)) return null
  if (/기초|FOUNDATION|FOOTING|BASEPLAN|매트/.test(t)) return ['FT']
  if (/(옥상|옥탑|PH|PENT)지붕|PHR|(PH|PENT\w*)ROOF/.test(t)) return ['PR']
  if (/지붕|옥상|ROOF|^RF|R층/.test(t)) return ['R']
  if (/옥탑|PENT|^PH\d?(층|F)|PH층/.test(t)) return ['R']
  let m
  /* 🛠 G118 — 「2,3층 구조평면도」「2·4층」 → 여러 층 · 「2ND FLOOR FRAMING PLAN」 */
  if ((m = /^((?:지하)?\d{1,2}(?:층|F)?(?:[,·](?:지하)?\d{1,2}(?:층|F)?)+)(?:층|F)?/.exec(t))) {
    const 들 = m[1].split(/[,·]/).map((x) => /지하/.test(x) ? 'B' + +x.replace(/\D/g, '') : String(+x.replace(/\D/g, '')))
    if (들.length >= 2 && 들.every((x) => x !== 'NaN' && x !== 'B0' && x !== '0')) return 들
  }
  if ((m = /(\d{1,2})(?:ST|ND|RD|TH)FLOOR/.exec(t))) return [String(+m[1])]
  if ((m = /(지하)?(\d{1,2})(?:층|F)?[~∼\-](지하)?(\d{1,2})(?:층|F)/.exec(t))) {
    const a = +m[2], b = +m[4], 지 = !!(m[1] || m[3])
    const out = []
    for (let k = Math.min(a, b); k <= Math.max(a, b); k++) out.push(지 ? 'B' + k : String(k))
    return out
  }
  if ((m = /지하(\d{1,2})층/.exec(t)) || (m = /^B(\d{1,2})F?/.exec(t))) return ['B' + m[1]]
  if ((m = /(\d{1,2})(?:층|F\b|F(?=[A-Z가-힣])|FL)/.exec(t))) return [String(+m[1])]
  return null
}
/** 제목이 «기둥 배치(주심도)» 인가 — 이 평면의 기둥은 «그 층» 기둥(구조평면도는 «그 바닥» 이라 한 층 아래) */
export function 기둥제목(s) { return /(주심도|기둥배치|기둥평면|COLUMNPLAN|COLUMNLAYOUT)/.test(붙(s).toUpperCase()) }
/** 층 이름 글자 — 「지붕층」「RF」「2층」「2F」「B1」「지하1층」「1층바닥」 → 'R'·'2'·'B1' */
function 층글(s) {
  const t = 붙(s).toUpperCase()
  if (!t || t.length > 10) return null
  if (/^(지붕층?|옥상층?|RF|ROOF|R|RFL|R층)$/.test(t)) return 'R'
  if (/^(옥탑층?|PH|PHF|PH\d)$/.test(t)) return 'PH'
  let m
  if ((m = /^지하(\d{1,2})층?$/.exec(t)) || (m = /^B(\d{1,2})F?L?$/.exec(t))) return 'B' + m[1]
  if ((m = /^(\d{1,2})(?:층|F|FL|층바닥)$/.exec(t))) return String(+m[1])
  return null
}
/** 높이 글자 — 「FL+3,600」「EL+3.600」「SL:+3600」「FL±0」「2FL+3,600」 → {층?, v(mm)} */
function 높이글(s) {
  const t = 붙(s).toUpperCase().replace(/[−–]/g, '-')
  const m = /^(?:(\d{1,2}|B\d|R|RF|ROOF|지붕층?|\d{1,2}층)\s*)?(?:FL|SL|EL|F\.L\.?|S\.L\.?)\s*[:=]?\s*(±|\+|-)?\s*(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?)$/.exec(t)
  if (!m) return null
  let v = +m[3].replace(/,/g, '')
  if (/\./.test(m[3]) && v < 300 && !/,/.test(m[3])) v *= 1000
  if (m[2] === '-') v = -v
  const 층 = m[1] ? 층글(m[1].replace(/층$/, '') + (/^\d/.test(m[1]) ? 'F' : '')) || 층글(m[1]) : null
  return { 층, v }
}

/* ───────────────────────────── 도면 준비 (mm 로) */

const 주석층 = /(치수|DIM|TEXT|TXT|문자|글자|도곽|TITLE|BORDER|FRAME|FORM|DEFPOINTS|VIEWPORT|VPORT|GRID|통심|축선|CEN(TER)?\b|중심선|HATCH|해치|PATTERN|TABLE|TBL|LEADER|인출|SYMB|심볼|NOTE|범례|LEGEND|LOGO|STAMP|결재)/i

function 준비(모델, k, 번) {
  const { E, Q, P, T, layers } = 모델
  const 층주석 = layers.map((L) => 주석층.test(L.name || ''))
  // 선분
  const sx0 = [], sy0 = [], sx1 = [], sy1 = [], sly = [], se = []
  const 닫힌 = []
  for (let q = 0; q < Q.e.length; q++) {
    const e = Q.e[q], t = E.t[e]
    if (!(t === 종류.선 || t === 종류.폴리선 || t === 종류.닫힌폴리선 || t === 종류.원)) continue
    const ly = E.ly[e]
    if (층주석[ly]) continue
    const s = Q.p0[q], n = Q.pn[q]
    if (t === 종류.닫힌폴리선 || t === 종류.원) {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
      for (let j = 0; j < n; j++) { const x = P[(s + j) * 2] * k, y = P[(s + j) * 2 + 1] * k; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
      닫힌.push({ e, ly, b: [x0, y0, x1, y1], 원: t === 종류.원 })
    }
    if (t === 종류.원) continue
    const 끝 = t === 종류.닫힌폴리선 ? n : n - 1
    for (let j = 0; j < 끝; j++) {
      const a = s + j, b = s + ((j + 1) % n)
      const x0 = P[a * 2] * k, y0 = P[a * 2 + 1] * k, x1 = P[b * 2] * k, y1 = P[b * 2 + 1] * k
      if (Math.hypot(x1 - x0, y1 - y0) < 50) continue
      sx0.push(x0); sy0.push(y0); sx1.push(x1); sy1.push(y1); sly.push(ly); se.push(e)
    }
  }
  // 칸 찾기판
  const 칸 = 2000
  const 판 = new Map()
  const 열쇠 = (i, j) => i * 100003 + j
  for (let s = 0; s < sx0.length; s++) {
    const i0 = Math.floor(Math.min(sx0[s], sx1[s]) / 칸), i1 = Math.floor(Math.max(sx0[s], sx1[s]) / 칸)
    const j0 = Math.floor(Math.min(sy0[s], sy1[s]) / 칸), j1 = Math.floor(Math.max(sy0[s], sy1[s]) / 칸)
    if ((i1 - i0 + 1) * (j1 - j0 + 1) > 4000) continue       // 도면 전체를 가로지르는 아주 긴 선(도곽 등)
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const key = 열쇠(i, j); const a = 판.get(key); if (a) a.push(s); else 판.set(key, [s]) }
  }
  const 도장 = new Int32Array(sx0.length); let 도장번 = 0
  const 찾기 = (x0, y0, x1, y1) => {
    도장번++
    const out = []
    const i0 = Math.floor(Math.min(x0, x1) / 칸), i1 = Math.floor(Math.max(x0, x1) / 칸), j0 = Math.floor(Math.min(y0, y1) / 칸), j1 = Math.floor(Math.max(y0, y1) / 칸)
    if ((i1 - i0 + 1) * (j1 - j0 + 1) > 20000) return out
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
      const a = 판.get(열쇠(i, j)); if (!a) continue
      for (const s of a) if (도장[s] !== 도장번) { 도장[s] = 도장번; out.push(s) }
    }
    return out
  }
  // 글자 (가운데 · mm)
  const 글자 = []
  for (let i = 0; i < T.s.length; i++) {
    const s = 글(T.s[i]); if (!s) continue
    const h = T.h[i] * k, a = T.a[i]
    let w = 0; for (const ch of s) w += /[ㄱ-힝]/.test(ch) ? 1.0 : (ch === ' ' ? 0.5 : 0.75)
    w *= h
    const x = T.x[i] * k, y = T.y[i] * k
    const cx = x + (w / 2) * Math.cos(a) - (h / 2) * Math.sin(a), cy = y + (w / 2) * Math.sin(a) + (h / 2) * Math.cos(a)
    글자.push({ i, 번, s, u: 붙(s).toUpperCase(), x: cx, y: cy, h, w, a, ly: E.ly[T.e[i]], x0: x })
  }
  /* 🛠 G118 (2026-10-02) — 소장님 「골조 수량 산출 도면을 넣었는데, 물량이 제대로 안나온데..」
     도면이 «도곽(박스)» 마다 한 장이고 제목이 표제란(도곽 오른쪽 아래)에만 있으면, 평면 왼쪽의 부재 기호가 제목과 너무 멀어
     어느 평면에도 안 걸리고 빠졌습니다(보 46 → 33줄 · 콘크리트 216 → 189㎥). 도곽을 찾아, 같은 도곽 안의 제목을 그 평면의 제목으로 봅니다.
     도곽 찾기는 도면 PDF 만들기와 같은 것(lib/dxfplot.js 도곽찾기) — 주석층(도곽 · TITLE 등)도 봅니다. */
  let 도곽 = []
  try {
    const 조각 = []
    for (let q = 0; q < Q.e.length; q++) {
      const t = E.t[Q.e[q]]
      if (t === 종류.선 || t === 종류.폴리선 || t === 종류.닫힌폴리선) 조각.push({ s: Q.p0[q], n: Q.pn[q], closed: t === 종류.닫힌폴리선 })
    }
    도곽 = 도곽찾기(P, 조각, 모델.units).map((f) => [f.x0 * k, f.y0 * k, f.x1 * k, f.y1 * k])
  } catch (e) { 도곽 = [] }
  const 도곽번 = (x, y) => { for (let i = 0; i < 도곽.length; i++) { const f = 도곽[i]; if (x >= f[0] && x <= f[2] && y >= f[1] && y <= f[3]) return i } return -1 }
  return { 번, k, 모델, sx0, sy0, sx1, sy1, sly, se, 닫힌, 찾기, 글자, layers, 도곽, 도곽번 }
}

/* ───────────────────────────── ① 일람표 → 배근표 */

/**
 * 일람표 읽기 → «정의» 목록. 한 기호가 여러 번(층마다 다른 크기·(R) G1·「B1F ~ 2F」 칸) 나올 수 있어 목록으로 둡니다.
 * @returns {정의:[{종류, 기호, 몸, 층표, r, 범위, 번, g, 근거}], 쓴글자:Set, 철골:Map}
 *   범위 = null(모든 층) | {a,b} | {목록} — 보·슬래브는 «바닥» 이름, 기둥·벽은 «층» 이름 (골조읽기에서 층으로 바꿈)
 */
function 일람표읽기(도면들, 경고) {
  const 정의 = []
  const 철골 = new Map()        // 기호 → {기호, 종류, 규격} — 철골 부재(철근콘크리트 셈에서 뺌)
  const 쓴글자 = new Set()      // 일람표에 쓰인 글자(평면 기호로 세지 않게) — '번:i'
  for (const D of 도면들) {
    const 토 = [], 머리 = [], 기후 = [], 층머리 = [], 부호머리 = []
    for (const g of D.글자) {
      /* 🛠 G118 — 평면의 「G1(400X700)」 꼴도 기호로 봄(값 토막으로 보면 가까운 일람표가 가져가 평면에서 빠졌음) */
      const 평 = 기호칸(g.s) ? null : 평면기호(g.s)
      const 칸 = 기호칸(g.s) || (평 ? { 기호들: [평], 범위: null } : null)
      if (칸) { 기후.push({ g, 기: 칸.기호들, 범위: 칸.범위 }); continue }
      const tk = 토막들(g.s)
      const 역 = 역할들(g.s)
      const 범 = /[~∼]|^(ALL|전층|공통|B?\d{1,2}F|B\d{1,2}|R|RF|PH|PHR|옥상|지붕)$/i.test(붙(g.s)) ? 범위풀이(g.s) : null
      if (범) { 층머리.push({ g, 범 }); continue }
      if (tk.length) 토.push({ g, tk, 역: 역할들(g.s.replace(/[\d@\-X×*=.,]+|[A-Z]{0,3}D\d{2}/gi, '')) })
      else if (역.size) { 머리.push({ g, 역 }); if (역.has('부호')) 부호머리.push(g) }
      else if (/^(\d{1,2},\d{3}|\d{2,4})$/.test(g.u)) 토.push({ g, tk: [{ k: '숫자', v: +g.u.replace(/,/g, '') }], 역: new Set() })
    }
    if (!기후.length) continue
    // 표 안 기호(«MEMBER»·«부호»·«구 분» 머리 아래 기호 열) — 값을 못 읽어도 평면 기호로 세지 않음. 이런 기호는 «왼쪽 이름표»(줄·덩이의 왼쪽)
    const 열머리 = 머리.filter((h) => h.역.has('부호') || h.역.has('위치')).map((h) => h.g)
    const 같은열 = (h, c) => Math.abs(h.x - c.g.x) <= Math.max(h.w, c.g.w) / 2 + 6 * c.g.h || Math.abs(h.x0 - c.g.x0) <= 3 * c.g.h
    for (const c of 기후) {
      if (열머리.some((h) => h.y > c.g.y && h.y - c.g.y < 60 * c.g.h && 같은열(h, c))) { c.표안 = true; 쓴글자.add(D.번 + ':' + c.g.i) }
    }
    // 같은 왼쪽 끝(x0)으로 줄지어 선 기호들 — 하나가 표 안이면 붙어 있는 이웃(세로 간격 6줄 안)도 표 안(짧은 기호는 머리 가운데에서 멀어 못 잡힘)
    for (let 바뀜 = true; 바뀜;) {
      바뀜 = false
      for (const c of 기후) {
        if (c.표안) continue
        if (기후.some((o) => o.표안 && Math.abs(o.g.x0 - c.g.x0) <= 2 * c.g.h && Math.abs(o.g.y - c.g.y) <= 6 * c.g.h && Math.abs(o.g.h - c.g.h) < 0.2 * c.g.h)) { c.표안 = true; 쓴글자.add(D.번 + ':' + c.g.i); 바뀜 = true }
      }
    }
    if (!토.length) continue
    // 기호 후보마다: 반경 안 값 토막 수
    const 후보 = []
    for (const c of 기후) {
      // 표 밖 기호는 둘레에 철근 글자가 있고 값 토막이 둘 넘어야 일람표 — 평면 기호 곁의 개구부 크기 글자 하나로 속지 않게
      const R = 30 * c.g.h
      let n = 0, 철 = 0
      for (const t of 토) {
        if (t.tk[0].k === '숫자' || Math.abs(t.g.x - c.g.x) > R || Math.abs(t.g.y - c.g.y) > R) continue
        n++
        if (t.tk.some((x) => x.k === '개수' || x.k === '간격')) 철++
      }
      if (c.표안 || (n >= 2 && 철 >= 1)) 후보.push(c)
    }
    if (!후보.length) continue
    /* 왼쪽 이름표 기호(표안) — 같은 열의 위아래 기호·머리 사이가 그 기호의 칸(세로 범위). 오른쪽의 토막은 그 칸에 든 기호 것 */
    const 왼쪽들 = 후보.filter((c) => c.표안)
    for (const c of 왼쪽들) {
      const h0 = c.g.h
      const 열 = 왼쪽들.filter((o) => Math.abs(o.g.x - c.g.x) <= 3 * h0 || Math.abs(o.g.x0 - c.g.x0) <= 3 * h0).sort((a, b) => b.g.y - a.g.y)
      const k = 열.indexOf(c)
      const 머리사이 = (위y, 아래y) => 열머리.filter((h) => h.y < 위y && h.y > 아래y && 같은열(h, c)).sort((a, b) => b.y - a.y)
      const 앞 = 열[k - 1], 뒤 = 열[k + 1]
      if (앞) { const hs = 머리사이(앞.g.y, c.g.y); c.위 = hs.length ? hs[hs.length - 1].y + 0.5 * hs[hs.length - 1].h : (앞.g.y + c.g.y) / 2 }
      else { const hs = 머리사이(c.g.y + 60 * h0, c.g.y); c.위 = hs.length ? hs[hs.length - 1].y + 0.5 * hs[hs.length - 1].h : c.g.y + 1.5 * h0 }
      if (뒤) { const hs = 머리사이(c.g.y, 뒤.g.y); c.아래 = hs.length ? hs[0].y + 0.5 * hs[0].h : (c.g.y + 뒤.g.y) / 2 }
      else { const hs = 머리사이(c.g.y, c.g.y - 60 * h0); c.아래 = hs.length ? hs[0].y + 0.5 * hs[0].h : c.g.y - (앞 ? Math.min(20 * h0, (앞.g.y - c.g.y)) : 3 * h0) }
    }
    const 왼쪽주인 = (t) => {
      let best = null, bd = Infinity
      for (const c of 왼쪽들) {
        if (t.g.y > c.위 || t.g.y <= c.아래) continue
        const dx = t.g.x - c.g.x0
        if (dx < -2 * c.g.h || dx > 90 * c.g.h) continue
        if (dx < bd) { bd = dx; best = c }
      }
      return best
    }
    // 줄 모양(부재가 가로로 늘어섬 → 덩이 · 세로로 → 줄마다)
    for (const c of 후보) {
      let best = null, bd = Infinity
      for (const o of 후보) {
        if (o === c || o.기[0].종류 !== c.기[0].종류) continue
        const d = Math.hypot(o.g.x - c.g.x, o.g.y - c.g.y)
        if (d < bd) { bd = d; best = o }
      }
      c.덩이 = best ? Math.abs(best.g.y - c.g.y) < Math.abs(best.g.x - c.g.x) : false
      c.줄 = best ? !c.덩이 : false
      c.토 = []
    }
    // 토막마다 주인 기호 — 같은 줄(오른쪽)이면 줄마다 표, 아니면 가까운 덩이(위쪽이 보통, 덩이 표는 기호가 칸 가운데라 위 토막도 받음)
    const 주인찾기 = (t) => {
      let best = null, bc = Infinity
      for (const c of 후보) {
        if (c.표안) continue                                  // 표 안 기호는 제 칸(세로 범위)의 것만 — 왼쪽주인
        const tol = 1.5 * Math.max(c.g.h, t.g.h)
        const dy = c.g.y - t.g.y
        if (dy < -tol && !c.덩이) continue                // 줄 표에서 기호보다 위 토막은 윗줄 것
        const dx = t.g.x - c.g.x
        const lim = 90 * Math.max(c.g.h, t.g.h)
        if (Math.abs(dx) > lim || Math.abs(dy) > lim) continue
        let cost
        if (Math.abs(dy) <= 0.8 * Math.max(c.g.h, t.g.h) && dx > -tol && !c.덩이) cost = dx * 0.25   // 같은 줄 — 줄마다 한 부재 표(가장 믿음)
        else { const wx = c.덩이 ? 3 : 1, wy = c.줄 ? 3 : 1; cost = Math.abs(dx) * wx + Math.max(0, dy) * wy + Math.max(0, -dy) * 3 + (c.줄 ? 1e6 : 0) }
        if (cost < bc) { bc = cost; best = c }
      }
      return best
    }
    for (const t of 토) { const b0 = 왼쪽주인(t) || 주인찾기(t); if (b0) b0.토.push(t) }
    for (const h of 층머리) h.주인 = 왼쪽주인(h) || 주인찾기(h)          // 층 범위 칸도 그 표의 기호에만
    // 역할 붙이기
    const 역할 = (t) => {
      const r = new Set(t.역)
      const g = t.g, tolY = 1.2 * g.h
      let bl = null, bd = Infinity
      for (const hd of 머리) {
        if (Math.abs(hd.g.y - g.y) > Math.max(tolY, 1.2 * hd.g.h)) continue
        const dx = g.x - hd.g.x
        if (dx <= 0) continue
        if (dx < bd) { bd = dx; bl = hd }
      }
      let bu = null, bdu = Infinity
      for (const hd of 머리) {
        const dy = hd.g.y - g.y
        if (dy <= 0.5 * g.h || dy > 30 * g.h) continue
        if (Math.abs(hd.g.x - g.x) > Math.max(g.w, hd.g.w) / 2 + g.h) continue
        if (dy < bdu) { bdu = dy; bu = hd }
      }
      for (const hd of [bl, bu]) if (hd) for (const x of hd.역) r.add(x)
      return r
    }
    /** 토막의 층 범위 — 같은 줄 왼쪽의 «ALL·B1F·1F~6F» 칸, 없으면 같은 칸 위의 «B1F ~ 2F» 머리 */
    const 층범위 = (t, c) => {
      const g = t.g
      let best = null, bd = Infinity
      for (const h of 층머리) {
        if (h.주인 !== c) continue
        if (Math.abs(h.g.y - g.y) > 1.2 * Math.max(g.h, h.g.h)) continue
        const dx = g.x - h.g.x
        if (dx <= 0 || h.g.x < c.g.x - c.g.h) continue
        if (dx < bd) { bd = dx; best = h }
      }
      if (best) return best
      bd = Infinity
      for (const h of 층머리) {
        if (h.주인 !== c) continue
        const dy = h.g.y - g.y
        if (dy <= 0.3 * g.h || dy > 40 * g.h) continue
        if (Math.abs(h.g.x - g.x) > Math.max(g.w, h.g.w) / 2 + 3 * g.h) continue
        if (dy < bd) { bd = dy; best = h }
      }
      return best
    }
    for (const c of 후보) {
      if (c.토.some((t) => t.tk[0].k !== '숫자')) for (const t of c.토) 쓴글자.add(D.번 + ':' + t.g.i)
      쓴글자.add(D.번 + ':' + c.g.i)
      const 값0 = c.토.map((t) => ({ t, 역: 역할(t), 층: 층범위(t, c) }))
      // 층 범위 칸마다 따로 (기둥 일람표 «B1F ~ 2F | 3F | 5F ~ 6F» · 목록의 «위치» 칸)
      const 무리 = new Map()
      for (const v of 값0) { const k = v.층 ? v.층.g.i : -1; let a = 무리.get(k); if (!a) { a = []; 무리.set(k, a) } a.push(v) }
      const 공통 = 무리.get(-1) || []
      const 판들 = [...무리.entries()].filter(([k]) => k !== -1)
      const 짜기 = 판들.length ? 판들.map(([, vs]) => ({ 값: [...vs, ...공통], 범위: vs[0].층.범 })) : [{ 값: 공통, 범위: null }]
      for (const 기 of c.기) {
        for (const { 값, 범위 } of 짜기) {
          if (!값.length) continue
          const r = 배근만들기(기, 값, c, 머리, 경고)
          if (!r) continue
          if (r.철골) { if (!철골.has(기.기호)) 철골.set(기.기호, r); continue }
          const 범 = 범위 && !범위.전체 ? 범위 : c.범위
          정의.push({ 종류: 기.종류, 기호: 기.기호, 몸: 기.몸, 층표: 기.층표, r, 범위: 범, 명시: !!범, 번: D.번, g: c.g, 근거: { 번: D.번, i: c.g.i, 글: c.g.s } })
        }
      }
    }
  }
  return { 정의, 쓴글자, 철골 }
}

const 개글 = (x) => x.n + '-' + x.d
const 간글 = (x) => x.d + (x.d2 ? '+' + x.d2 : '') + '@' + x.s

/** 기호 하나의 값 토막들 → 배근표 한 줄 (골조.js 배근칸 모양) */
function 배근만들기(기, 값, c, 머리, 경고) {
  const 모 = (k) => 값.flatMap(({ t, 역 }) => t.tk.filter((x) => x.k === k).map((x) => ({ x, 역, g: t.g })))
  const 철 = 모('철골')
  if (철.length) return { 철골: true, 기호: 기.기호, 종류: 기.종류, 규격: 철.sort((a, b) => Math.hypot(a.g.x - c.g.x, a.g.y - c.g.y) - Math.hypot(b.g.x - c.g.x, b.g.y - c.g.y))[0].x.글 }
  const 개 = 모('개수'), 간 = 모('간격'), 크 = 모('크기'), 두 = 모('두께'), 수 = 모('숫자'), 지 = 모('지름')
  const 읽기차례 = (a, b) => (Math.abs(a.g.y - b.g.y) > 0.6 * a.g.h ? b.g.y - a.g.y : a.g.x - b.g.x)
  const 가로차례 = (a, b) => a.g.x - b.g.x
  let 크기 = (크.find((v) => v.역.has('크기')) || 크[0] || {}).x
  let 치수로 = false
  if (!크기 && (기.종류 === '보' || 기.종류 === '기둥')) {
    // 단면 그림의 치수 글자 — 가로 글자 = 폭(가로) · 세운 글자 = 춤(세로) 「1,100」「850」 (기호에 가까운 것)
    const 가 = (v) => Math.hypot(v.g.x - c.g.x, v.g.y - c.g.y)
    // 단면 위의 치수(가장 위 가로 글자) = 폭 · 단면 왼쪽 치수(가장 왼쪽 세운 글자) = 춤. 피복·간격 같은 작은 숫자는 뺌
    const 가로 = 수.filter((v) => v.x.v >= 200 && v.x.v <= 3000 && Math.abs(Math.sin(v.g.a)) < 0.2).sort((a, b) => (b.g.y - a.g.y) || (가(a) - 가(b)))
    const 세로 = 수.filter((v) => v.x.v >= 250 && v.x.v <= 4000 && Math.abs(Math.cos(v.g.a)) < 0.2).sort((a, b) => (a.g.x - b.g.x) || (가(a) - 가(b)))
    if (가로[0] && 세로[0]) { 크기 = { a: 가로[0].x.v, b: 세로[0].x.v, c: null }; 치수로 = true }
  }
  const 두께값 = () => { const t = 두[0]; if (t) return t.x.t; const n = 수.find((v) => v.역.has('두께')); return n ? n.x.v : null }
  if (기.종류 === '보') {
    if (!크기 && !개.length && !간.length) return null
    const 위치 = (v) => (v.역.has('중앙') ? '중앙' : v.역.has('단부') ? '단부' : '')
    let 상 = 개.filter((v) => v.역.has('상')), 하 = 개.filter((v) => v.역.has('하')), 부 = 개.filter((v) => v.역.has('부'))
    const 남 = 개.filter((v) => !v.역.has('상') && !v.역.has('하') && !v.역.has('부')).sort(읽기차례)
    if (!상.length && !하.length && 남.length >= 2) {
      // 머리 글이 없으면: 위 줄 = 상부, 그 아래 = 하부 (단부·중앙 칸이면 칸마다)
      const ys = [...new Set(남.map((v) => Math.round(v.g.y / (v.g.h * 0.8))))].sort((a, b) => b - a)
      상 = 남.filter((v) => Math.round(v.g.y / (v.g.h * 0.8)) === ys[0])
      하 = 남.filter((v) => Math.round(v.g.y / (v.g.h * 0.8)) === ys[1])
      if (ys.length >= 3 && !부.length) 부 = 남.filter((v) => Math.round(v.g.y / (v.g.h * 0.8)) === ys[2])
    }
    const 고르기 = (arr) => {
      if (!arr.length) return { 단: null, 중: null }
      const 단 = arr.find((v) => 위치(v) === '단부') || null
      const 중 = arr.find((v) => 위치(v) === '중앙') || null
      if (단 || 중) return { 단: (단 || 중).x, 중: (중 || 단).x }
      const s = arr.slice().sort(가로차례)
      return { 단: s[0].x, 중: (s[1] || s[0]).x }
    }
    const T = 고르기(상), B = 고르기(하)
    const r = { 기호: 기.기호, 폭: 크기 ? String(크기.a) : '', 춤: 크기 ? String(크기.b) : '', 상부: '', 하부: '', 늑근단부: '', 늑근중앙: '', 부근: '', 종류: '', 상부추가: '', 하부추가: '', 보조늑근: '', 헌치높이: '', 헌치길이: '', 끝춤: '', 동: '' }
    if (T.단) {
      if (T.중 && T.단.d === T.중.d && T.단.n > T.중.n) { r.상부 = 개글(T.중); r.상부추가 = (T.단.n - T.중.n) + '-' + T.단.d; r.종류 = '양단보' }
      else r.상부 = 개글(T.단.n >= (T.중 || T.단).n ? T.단 : T.중)
    }
    if (B.단) {
      if (B.중 && B.단.d === B.중.d && B.중.n > B.단.n) { r.하부 = 개글(B.단); r.하부추가 = (B.중.n - B.단.n) + '-' + B.단.d; r.종류 = '양단보' }
      else r.하부 = 개글(B.단.n >= (B.중 || B.단).n ? B.단 : B.중)
    }
    if (부.length) r.부근 = 개글(부[0].x)
    const 늑 = 간.filter((v) => !v.역.has('상') && !v.역.has('하'))
    const L = 고르기(늑)
    if (L.단) { r.늑근단부 = 간글(L.단); r.늑근중앙 = 간글(L.중) }
    if (치수로) r._짐작 = '크기(단면 치수 글자)'
    return r
  }
  if (기.종류 === '기둥') {
    const r = { 기호: 기.기호, 가로: '', 세로: '', 지름: '', 주근: '', 대근단부: '', 대근중앙: '', 형태: '사각', 변수: '', 한변: '', 면적: '', 둘레: '', 대근가로: '', 대근세로: '', 대근형태: '띠', 동: '' }
    // 층 범위가 여러 줄이면 맨 아래 줄(가장 낮은 층)을 대표로 — 나머지는 경고
    if (크기) { r.가로 = String(크기.a); r.세로 = String(크기.b) }
    else if (지[0]) { r.지름 = String(지[0].x.t); r.형태 = '원형' }
    else if (!개.length && !간.length) return null
    const 주 = 개.find((v) => v.역.has('주')) || 개.slice().sort(읽기차례)[0]
    if (주) r.주근 = 개글(주.x)
    const 띠 = 간.slice()
    const 단 = 띠.find((v) => v.역.has('단부')), 중 = 띠.find((v) => v.역.has('중앙'))
    if (단 || 중) { r.대근단부 = 간글((단 || 중).x); r.대근중앙 = 간글((중 || 단).x) }
    else if (띠.length) { const s = 띠.map((v) => v.x).sort((a, b) => a.s - b.s); r.대근단부 = 간글(s[0]); r.대근중앙 = 간글(s[s.length - 1]) }
    const 크들 = new Set(크.map((v) => v.x.a + 'x' + v.x.b))
    if (크들.size > 1) 경고.push('기둥 «' + 기.기호 + '» 는 층마다 크기가 달라 보입니다(' + [...크들].join(' · ') + ') — 첫 크기로 셈했습니다. 골조 화면 배근표에서 «1-2' + 기.기호 + '» 처럼 나눠 적어 주세요')
    if (치수로) r._짐작 = '크기(단면 치수 글자)'
    return r
  }
  if (기.종류 === '슬라브') {
    const t = 두께값()
    if (!t && !간.length) return null
    const r = { 기호: 기.기호, 두께: t ? String(t) : '', 단변하부: '', 단변상부: '', 장변하부: '', 장변상부: '', 상부꼴: '전장', 종류: '양방향', 지지근: '', 단위철근: '', 데크: '', 동: '' }
    const 칸 = { 단변상부: null, 단변하부: null, 장변상부: null, 장변하부: null }
    const 남 = []
    for (const v of 간) {
      const 방 = v.역.has('단변') ? '단변' : v.역.has('장변') ? '장변' : ''
      const 위 = v.역.has('상') ? '상부' : v.역.has('하') ? '하부' : ''
      if (방 && 위 && !칸[방 + 위]) 칸[방 + 위] = v.x
      else if (방 && !위) { if (!칸[방 + '하부']) 칸[방 + '하부'] = v.x; if (!칸[방 + '상부']) 칸[방 + '상부'] = v.x }
      else 남.push(v)
    }
    남.sort(읽기차례)
    // 머리 글이 없고 두 줄(위 X · 아래 Y)로 적힌 표 — 위 줄 = 단변(X), 아래 줄 = 장변(Y) · 줄 안 왼쪽 = 상부, 다음 = 하부 (짐작)
    const 줄들 = [...new Set(남.map((v) => Math.round(v.g.y / (v.g.h * 1.5))))].sort((a, b) => b - a)
    if (Object.values(칸).every((v) => !v) && 줄들.length === 2 && 남.length >= 3) {
      const 위 = 남.filter((v) => Math.round(v.g.y / (v.g.h * 1.5)) === 줄들[0]).sort(가로차례), 아 = 남.filter((v) => Math.round(v.g.y / (v.g.h * 1.5)) === 줄들[1]).sort(가로차례)
      칸.단변상부 = 위[0].x; 칸.단변하부 = (위[1] || 위[0]).x; 칸.장변상부 = 아[0].x; 칸.장변하부 = (아[1] || 아[0]).x
      남.length = 0
      r._짐작 = '슬래브 철근 자리(X·Y 칸)'
    }
    if (남.length) {
      const 빈 = Object.keys(칸).filter((k2) => !칸[k2])
      if (남.length === 2 && 빈.length === 4) { 칸.단변상부 = 칸.단변하부 = 남[0].x; 칸.장변상부 = 칸.장변하부 = 남[1].x }
      else if (남.length === 1 && 빈.length === 4) { for (const k2 of 빈) 칸[k2] = 남[0].x }
      else for (const k2 of ['단변상부', '단변하부', '장변상부', '장변하부']) if (!칸[k2] && 남.length) 칸[k2] = 남.shift().x
    }
    for (const k2 of Object.keys(칸)) if (칸[k2]) r[k2] = 간글(칸[k2])
    if (/데크|DECK/i.test(c.g.s)) r.종류 = '데크'
    return r
  }
  if (기.종류 === '벽') {
    let t = 두께값()
    if (!t && 크기) t = Math.min(크기.a, 크기.b)
    if (!t) { 경고.push('벽체 일람표 «' + 기.기호 + '» 에서 두께를 못 찾았습니다'); return null }
    const r = { 기호: 기.기호, 두께: String(t), 수직: '', 수평: '', 배근: '복배근', 구분: '구조벽', 단부보강: '', 상부보강: '', 단부전단: '', 단위철근: '', 동: '' }
    const 수직 = 간.find((v) => v.역.has('수직')), 수평 = 간.find((v) => v.역.has('수평'))
    const 남 = 간.filter((v) => v !== 수직 && v !== 수평).sort(읽기차례)
    r.수직 = 수직 ? 간글(수직.x) : 남[0] ? 간글(남.shift().x) : ''
    r.수평 = 수평 ? 간글(수평.x) : 남[0] ? 간글(남.shift().x) : ''
    const 모든글 = 값.map(({ t: tt }) => tt.g.s).join(' ') + ' ' + 머리.filter((h) => Math.abs(h.g.y - c.g.y) < 1.2 * c.g.h && h.g.x > c.g.x).map((h) => h.g.s).join(' ')
    const 옆글 = 모든글
    if (/단배근|SINGLE/i.test(옆글)) r.배근 = '단배근'
    return r
  }
  if (기.종류 === '기초') {
    if (!크기) { 경고.push('기초 일람표 «' + 기.기호 + '» 에서 크기(2400X2400 같은 글자)를 못 찾았습니다'); return null }
    let t = 크기.c || 두께값()
    if (!t) { 경고.push('기초 일람표 «' + 기.기호 + '» 에서 두께를 못 찾았습니다'); return null }
    const r = { 기호: 기.기호, 종류: /M/.test(기.몸) ? 'MAT' : /WF|줄/.test(기.몸) ? '줄' : '독립', 가로: String(크기.a), 세로: String(크기.b), 두께: String(t), 하부가로: '', 하부세로: '', 상부가로: '', 상부세로: '', 헌치높이: '', 윗가로: '', 윗세로: '', 지지근: '', 면적: '', 둘레: '', 단위철근: '', 동: '' }
    const 하 = 간.filter((v) => !v.역.has('상')).sort(읽기차례), 상 = 간.filter((v) => v.역.has('상')).sort(읽기차례)
    if (하[0]) { r.하부가로 = 간글(하[0].x); r.하부세로 = 간글((하[1] || 하[0]).x) }
    if (상[0]) { r.상부가로 = 간글(상[0].x); r.상부세로 = 간글((상[1] || 상[0]).x) }
    if (!하[0] && 개[0]) {
      // 「15-HD19」 처럼 개수로 적은 기초 — 폭에 고르게 놓였다고 보고 간격으로 바꿈
      const x = 개[0].x
      const s = Math.round((크기.b - 150) / Math.max(1, x.n - 1) / 10) * 10
      r.하부가로 = r.하부세로 = x.d + '@' + s
      경고.push('기초 «' + 기.기호 + '» 철근 «' + 개글(x) + '» 를 간격 ' + x.d + '@' + s + ' 로 바꿔 셈했습니다')
    }
    return r
  }
  return null
}

/* ───────────────────────────── ② 평면 */

/** 선분 s 의 방향이 u 와 나란한가 · 수직인가 */
function 방향(D, s) { const dx = D.sx1[s] - D.sx0[s], dy = D.sy1[s] - D.sy0[s]; const L = Math.hypot(dx, dy); return [dx / L, dy / L, L] }

/**
 * 기호 글자 곁의 «나란한 두 선» 띠 찾기
 * @returns {ux, uy, nx, ny, px, py(축 위 한 점), g(폭), 층들:Set, 점수} | null
 */
function 띠찾기(D, g, 폭, 최대폭 = 1500) {
  const R = Math.max(2000, (폭 || 600) * 3, 12 * g.h)
  const S = Math.max(1500, 4 * g.h)
  const 가까운 = D.찾기(g.x - R, g.y - R, g.x + R, g.y + R)
  // 방향 후보 — 글자 방향·그 직각(가로 글자가 세로 보 옆에 있는 도면) + 글자 곁 선들의 실제 방향(비스듬한 보의 글자는 몇 도 틀어져 있기도)
  const 각들 = [g.a, g.a + Math.PI / 2]
  for (const s of 가까운) {
    const [dx, dy, L] = 방향(D, s)
    if (L < 500) continue
    const a = Math.atan2(dy, dx)
    const 차 = (x) => { let d = Math.abs(((x - g.a) % Math.PI + Math.PI) % Math.PI); return Math.min(d, Math.PI - d) }
    if (차(a) < 0.35 || Math.abs(차(a) - Math.PI / 2) < 0.35) if (!각들.some((b) => { let d = Math.abs(((a - b) % Math.PI + Math.PI) % Math.PI); return Math.min(d, Math.PI - d) < 0.01 })) 각들.push(a)
  }
  let best = null
  for (const 넓게 of [false, true]) {                   // 넓게: 일람표 폭과 다르게 그린 도면(폭 ±40%) — 길이만 잼
    if (넓게 && (best || !폭)) break
    for (const a of 각들) {
      const ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux
      const 선들 = new Map()
      for (const s of 가까운) {
        const [dx, dy] = 방향(D, s)
        if (Math.abs(dx * uy - dy * ux) > 0.012) continue
        const o = ((D.sx0[s] + D.sx1[s]) / 2 - g.x) * nx + ((D.sy0[s] + D.sy1[s]) / 2 - g.y) * ny
        if (Math.abs(o) > R) continue
        let t0 = (D.sx0[s] - g.x) * ux + (D.sy0[s] - g.y) * uy, t1 = (D.sx1[s] - g.x) * ux + (D.sy1[s] - g.y) * uy
        if (t0 > t1) { const x = t0; t0 = t1; t1 = x }
        if (t1 < -S || t0 > S) continue
        const key = Math.round(o)
        let arr = 선들.get(key); if (!arr) { arr = []; 선들.set(key, arr) }
        arr.push({ s, t0, t1 })
      }
      const os = [...선들.keys()].sort((p, q) => p - q)
      for (let i = 0; i < os.length; i++) for (let j = i + 1; j < os.length; j++) {
        const gap = os[j] - os[i]
        const 맞음 = 폭 && !넓게 ? Math.abs(gap - 폭) <= Math.max(3, 폭 * 0.03) : 폭 ? gap >= 폭 * 0.6 && gap <= 폭 * 1.45 && gap >= 150 : gap >= 150 && gap <= 최대폭
        if (!맞음) continue
        const A = 선들.get(os[i]), B = 선들.get(os[j])
        let 겹 = false
        for (const p of A) { for (const q of B) if (Math.min(p.t1, q.t1) - Math.max(p.t0, q.t0) > 100) { 겹 = true; break } if (겹) break }
        if (!겹) continue
        const 거리 = os[i] <= 0 && os[j] >= 0 ? 0 : Math.min(Math.abs(os[i]), Math.abs(os[j]))
        if (거리 > Math.max(1200, 5 * g.h)) continue
        // 글자 방향에서 벗어난 만큼 조금 불리하게
        let 틀어짐 = Math.abs(((a - g.a) % Math.PI + Math.PI) % Math.PI); 틀어짐 = Math.min(틀어짐, Math.PI - 틀어짐); 틀어짐 = Math.min(틀어짐, Math.abs(틀어짐 - Math.PI / 2))
        const 점수 = 거리 + (폭 ? Math.abs(gap - 폭) * (넓게 ? 2 : 10) : 0) + 틀어짐 * 2000
        if (!best || 점수 < best.점수) {
          const oc = (os[i] + os[j]) / 2
          best = { ux, uy, nx, ny, px: g.x + nx * oc, py: g.y + ny * oc, g: gap, 점수, 층들: new Set([...A, ...B].map((x) => D.sly[x.s])), 다른폭: 넓게 }
        }
      }
    }
  }
  return best
}

/** 띠의 축을 따라 두 선이 같이 있는 구간 → 받침(기둥·걸친 보)에서 끊은 토막들 */
function 띠토막(D, 띠, 기둥층, 길이 = 60000) {
  const { ux, uy, nx, ny, px, py, g } = 띠
  const x0 = px - ux * 길이, y0 = py - uy * 길이, x1 = px + ux * 길이, y1 = py + uy * 길이
  const pad = g + 100
  const 후보 = D.찾기(Math.min(x0, x1) - pad, Math.min(y0, y1) - pad, Math.max(x0, x1) + pad, Math.max(y0, y1) + pad)
  const A = [], B = []   // 두 선의 구간
  const 가로지름 = []    // 축을 가로지르는 수직 선분 → [t, o0, o1]
  for (const s of 후보) {
    const [dx, dy] = 방향(D, s)
    const 나란 = Math.abs(dx * uy - dy * ux) < 0.012
    const 수직 = Math.abs(dx * ux + dy * uy) < 0.05
    if (!나란 && !수직) continue
    const ta = (D.sx0[s] - px) * ux + (D.sy0[s] - py) * uy, tb = (D.sx1[s] - px) * ux + (D.sy1[s] - py) * uy
    const oa = (D.sx0[s] - px) * nx + (D.sy0[s] - py) * ny, ob = (D.sx1[s] - px) * nx + (D.sy1[s] - py) * ny
    if (나란) {
      const o = (oa + ob) / 2
      if (Math.abs(o + g / 2) < 2) A.push([Math.min(ta, tb), Math.max(ta, tb)])
      else if (Math.abs(o - g / 2) < 2) B.push([Math.min(ta, tb), Math.max(ta, tb)])
    } else if (Math.min(oa, ob) <= -g / 2 + 1 && Math.max(oa, ob) >= g / 2 - 1) {
      가로지름.push({ t: (ta + tb) / 2, ly: D.sly[s] })
    }
  }
  const 합치기 = (arr) => {
    arr.sort((p, q) => p[0] - q[0])
    const out = []
    for (const [a, b] of arr) { const l = out[out.length - 1]; if (l && a <= l[1] + 2) l[1] = Math.max(l[1], b); else out.push([a, b]) }
    return out
  }
  const UA = 합치기(A), UB = 합치기(B)
  const 같이 = []
  for (const [a0, a1] of UA) for (const [b0, b1] of UB) { const s = Math.max(a0, b0), e = Math.min(a1, b1); if (e - s > 50) 같이.push([s, e]) }
  // 받침: 기둥(닫힌 도형) · 걸친 보(가로지르는 나란한 두 선)
  const 끊김 = []   // [c0, c1, 반폭, 무엇]
  for (const c of D.닫힌) {
    const w = c.b[2] - c.b[0], h = c.b[3] - c.b[1]
    if (w < 150 || h < 150 || w > 3000 || h > 3000) continue
    if (기둥층 && !기둥층.has(c.ly)) continue
    // 네 모서리를 축·법선으로
    const cs = [[c.b[0], c.b[1]], [c.b[2], c.b[1]], [c.b[2], c.b[3]], [c.b[0], c.b[3]]]
    let t0 = Infinity, t1 = -Infinity, o0 = Infinity, o1 = -Infinity
    for (const [x, y] of cs) { const t = (x - px) * ux + (y - py) * uy, o = (x - px) * nx + (y - py) * ny; t0 = Math.min(t0, t); t1 = Math.max(t1, t); o0 = Math.min(o0, o); o1 = Math.max(o1, o) }
    if (o1 < -g / 2 + 1 || o0 > g / 2 - 1) continue
    if (t1 < -길이 || t0 > 길이) continue
    끊김.push([t0, t1, (t1 - t0) / 2, '기둥'])
  }
  가로지름.sort((p, q) => p.t - q.t)
  for (let i = 0; i < 가로지름.length; i++) for (let j = i + 1; j < 가로지름.length; j++) {
    const w = 가로지름[j].t - 가로지름[i].t
    if (w < 150) continue
    if (w > 1500) break
    if (가로지름[j].ly !== 가로지름[i].ly) continue
    끊김.push([가로지름[i].t, 가로지름[j].t, w / 2, '보'])
    break
  }
  // 같이 있는 구간에서 끊김을 빼서 토막으로
  끊김.sort((p, q) => p[0] - q[0])
  const 토막 = []
  for (const [s0, s1] of 같이) {
    let a = s0
    let 왼 = null
    const 안 = 끊김.filter((c) => c[1] > s0 - 5 && c[0] < s1 + 5)
    for (const c of 안) {
      if (c[0] - a > 100) 토막.push({ t0: a, t1: c[0], 왼, 오: c })
      if (c[1] > a) { a = Math.max(a, c[1]); 왼 = c }
    }
    const 끝c = 끊김.find((c) => Math.abs(c[0] - s1) < 5) || null
    if (s1 - a > 100) 토막.push({ t0: a, t1: s1, 왼, 오: 끝c })
    // 토막 끝이 끊김 없이 선이 끝난 곳이면: 기둥 면에서 끊긴 선(선이 기둥 면에서 멈춤) — 그 자리의 기둥 찾기
  }
  for (const p of 토막) {
    if (!p.왼) p.왼 = 끊김.find((c) => Math.abs(c[1] - p.t0) < 5) || null
    if (!p.오) p.오 = 끊김.find((c) => Math.abs(c[0] - p.t1) < 5) || null
  }
  return 토막
}

/** 슬래브 기호에서 네 방향으로 받침(보·벽) 가운데까지 — 통심 단변×장변 */
function 슬래브재기(D, g, 구조층, 폭들, 최대 = 20000) {
  const 결과 = []
  const 방들 = [[1, 0], [-1, 0], [0, 1], [0, -1]]
  for (const [dx, dy] of 방들) {
    const x1 = g.x + dx * 최대, y1 = g.y + dy * 최대
    const 후보 = D.찾기(Math.min(g.x, x1) - 5, Math.min(g.y, y1) - 5, Math.max(g.x, x1) + 5, Math.max(g.y, y1) + 5)
    const 맞 = []
    for (const s of 후보) {
      if (구조층 && !구조층.has(D.sly[s])) continue
      const [sx, sy] = 방향(D, s)
      if (Math.abs(sx * dx + sy * dy) > 0.02) continue           // 광선에 수직인 선만
      // 광선과 만나는 거리
      const ax = D.sx0[s], ay = D.sy0[s], bx = D.sx1[s], by = D.sy1[s]
      let d
      if (dx !== 0) { const lo = Math.min(ay, by), hi = Math.max(ay, by); if (g.y < lo - 1 || g.y > hi + 1) continue; d = (ax - g.x) * dx }
      else { const lo = Math.min(ax, bx), hi = Math.max(ax, bx); if (g.x < lo - 1 || g.x > hi + 1) continue; d = (ay - g.y) * dy }
      if (d > 1) 맞.push({ d, ly: D.sly[s] })
    }
    맞.sort((p, q) => p.d - q.d)
    if (!맞.length) { 결과.push(null); continue }
    const d1 = 맞[0].d
    // 받침의 다른 면 — 일람표에 있는 폭(보 폭·벽 두께)과 맞는 것 중 가장 넓은 것(큰보 안에 벽이 겹쳐 그려져도 큰보 가운데로)
    const 맞는 = 맞.filter((m2) => m2.d - d1 >= 150 && m2.d - d1 <= 1500 && (!폭들 || 폭들.some((w) => Math.abs(m2.d - d1 - w) <= 3)))
    const 짝 = 맞는.length ? 맞는[맞는.length - 1] : 맞.find((m2) => m2.d - d1 >= 150 && m2.d - d1 <= 1500)
    const 가운데 = 짝 ? d1 + (짝.d - d1) / 2 : d1
    결과.push({ d: 가운데, 면: d1 })
  }
  return 결과
}

/* ───────────────────────────── 모두 */

/**
 * @param 도면들 [{모델(골조도면.도면읽기), 이름, k(도면 단위 → mm)}]
 * @returns {공사, 경고:[글], 읽음:{배근:{…}, 평면:[…], 층:[…]}, 근거:[{번, 상자:[x0,y0,x1,y1](도면 단위), 글}], 있음:boolean}
 */
export function 골조읽기(도면들0, o = {}) {
  const 경고 = []
  const 도면들 = 도면들0.map((d, 번) => ({ ...준비(d.모델, d.k || 1, 번), 이름: d.이름 || '' }))
  const { 정의, 쓴글자, 철골 } = 일람표읽기(도면들, 경고)
  const 철골수 = new Map()
  const 근거 = []

  /* 층 높이 */
  const 높이 = new Map()
  for (const D of 도면들) {
    for (const g of D.글자) {
      const h = 높이글(g.s)
      if (!h) continue
      let 층 = h.층
      if (!층) {
        let best = null, bd = Infinity
        for (const o2 of D.글자) {
          if (o2 === g || Math.abs(o2.y - g.y) > 1.2 * Math.max(g.h, o2.h)) continue
          const dx = g.x - o2.x
          if (dx <= 0 || dx > 25 * g.h) continue
          const f = 층글(o2.s)
          if (f && dx < bd) { bd = dx; best = f }
        }
        층 = best
      }
      if (층 && !높이.has(층)) 높이.set(층, h.v)
    }
  }

  /* 평면 제목 */
  const 제목들 = []
  for (const D of 도면들) for (const g of D.글자) { const f = 제목층(g.s); if (f) 제목들.push({ D, g, f, 기둥판: 기둥제목(g.s), 이름: 붙(g.s).toUpperCase(), 판: D.도곽.length ? D.도곽번(g.x, g.y) : -1 }) }
  const 바닥들 = new Set()
  for (const t of 제목들) for (const f of t.f) if (f !== 'FT') 바닥들.add(f)
  for (const f of 높이.keys()) 바닥들.add(f)
  for (const d of 정의) if (d.범위) for (const f of d.범위.목록 || [d.범위.a, d.범위.b]) if (f && f !== 'FT' && (d.종류 === '보' || d.종류 === '슬라브')) 바닥들.add(f)
  if (바닥들.size && ![...바닥들].some((f) => f === '1' || /^B/.test(f))) 바닥들.add('1')
  if (바닥들.has('PR') && !바닥들.has('R')) 바닥들.add('R')
  const 바닥차례 = [...바닥들].sort(층차례)
  /** 바닥 L 을 보는 평면의 부재 → 그 아래 층 */
  const 아래층 = (L) => {
    if (L === 'FT') return 'FT'
    const i = 바닥차례.indexOf(L)
    if (i <= 0) return 'FT'
    return 바닥차례[i - 1]
  }
  /** 범위 → 이름들 */
  const 펼치기 = (범) => {
    if (!범) return null
    if (범.목록) return 범.목록
    const 모두 = [...new Set([...바닥차례, 범.a, 범.b])].sort(층차례)
    const i = 모두.indexOf(범.a), j = 모두.indexOf(범.b)
    return 모두.slice(Math.min(i, j), Math.max(i, j) + 1)
  }
  const 바닥종 = (종) => 종 === '보' || 종 === '슬라브'
  /** 정의의 범위 → 층들(골조.js 의 층 이름) */
  const 층으로 = (종, 이름들) => new Set(이름들.map((f) => (종 === '기초' ? 'FT' : 바닥종(종) ? 아래층(f) : f)))

  /* 제목 찾기 — 기호 글자(또는 일람표 칸)가 어느 평면 제목에 붙나: 제목은 보통 평면 «아래». 옆 도면과 헷갈리지 않게 가로 거리를 먼저 봄 */
  const 제목찾기 = (D, g) => {
    /* 🛠 G118 — 도곽 안의 글자는 «같은 도곽 안» 제목에서 고름(거리 제한 없이).
       그 도곽에 제목이 하나도 없으면(도곽이 아닌 큰 네모일 수도) 예전처럼 가까운 제목을 찾음 */
    const 판 = D.도곽 && D.도곽.length ? D.도곽번(g.x, g.y) : -1
    const 안 = 판 >= 0 ? 제목들.filter((t) => t.D === D && t.판 === 판) : []
    if (안.length) {
      let best = null, bd = Infinity, 아무 = null, ad = Infinity
      for (const t of 안) {
        const dy = g.y - t.g.y, dx = Math.abs(g.x - t.g.x)
        const d = dx + 0.3 * Math.max(0, dy)
        if (d < ad) { ad = d; 아무 = t }
        if (dy < -2 * t.g.h) continue
        if (d < bd) { bd = d; best = t }
      }
      return best || 아무
    }
    let best = null, bd = Infinity
    for (const t of 제목들) {
      if (t.D !== D) continue
      const dy = g.y - t.g.y, dx = Math.abs(g.x - t.g.x)
      if (dy < -2 * t.g.h || dy > 80000 || dx > 60000) continue
      const d = dx + 0.3 * Math.max(0, dy)
      if (d < bd) { bd = d; best = t }
    }
    return best
  }
  const 제목층들 = (t, 종) => (t.기둥판 && 종 !== '보' && 종 !== '슬라브' ? t.f : t.f.map(아래층))

  /* 같은 기호가 다르게 여러 번(층마다 다른 목록) → 그 목록이 놓인 평면의 층으로 */
  const 서명 = (r) => ['폭', '춤', '상부', '하부', '늑근단부', '늑근중앙', '가로', '세로', '지름', '주근', '대근단부', '두께', '단변하부', '장변하부', '수직', '수평', '하부가로'].map((k) => r[k] || '').join('|')
  const 무리 = new Map()
  for (const d of 정의) { if (d.명시) continue; const k = d.종류 + '|' + d.기호; let a = 무리.get(k); if (!a) { a = []; 무리.set(k, a) } a.push(d) }
  for (const [, ds] of 무리) {
    if (ds.length < 2 || new Set(ds.map((d) => 서명(d.r))).size < 2) continue
    for (const d of ds) {
      const t = 제목찾기(도면들[d.번], d.g)
      if (t) { d.층들 = new Set(제목층들(t, d.종류)); d.시트 = true }
    }
  }
  for (const d of 정의) if (d.명시) d.층들 = 층으로(d.종류, 펼치기(d.범위))

  /* 합치기 — 빈 칸은 다른 정의(같은 기호)로 채움: 평면 목록의 크기 + 일람표의 철근 */
  const 합 = (위, 아래) => { const m = { ...(아래 || {}) }; for (const [k, v] of Object.entries(위 || {})) if (v !== '' && v != null && !k.startsWith('_')) m[k] = v; return m }
  const 전역 = { 보: new Map(), 기둥: new Map(), 슬라브: new Map(), 벽: new Map(), 기초: new Map() }
  for (const d of 정의) {
    if (d.층들) continue
    const m = 전역[d.종류]
    m.set(d.기호, 합(m.get(d.기호), d.r))       // 먼저 읽은 것이 앞(빈 칸만 뒤의 것으로)
  }
  const 층정의 = { 보: new Map(), 기둥: new Map(), 슬라브: new Map(), 벽: new Map(), 기초: new Map() }
  for (const d of 정의) {
    if (!d.층들) continue
    const m = 층정의[d.종류]
    let a = m.get(d.몸); if (!a) { a = []; m.set(d.몸, a) }
    a.push(d)
  }
  const 짐작칸 = new Set()
  for (const d of 정의) if (d.r._짐작) 짐작칸.add(d.r._짐작)
  const 배근행 = { 보: new Map(), 기둥: new Map(), 슬라브: new Map(), 벽: new Map(), 기초: new Map() }
  /** 평면 기호 r 을 층 f 에서 쓸 배근 기호 — 없으면 null */
  const 기호정하기 = (r, f) => {
    const 종 = r.종류
    const 층것 = (층정의[종].get(r.몸) || []).filter((d) => d.층들.has(f)).sort((a, b) => (b.명시 ? 1 : 0) - (a.명시 ? 1 : 0))
    if (층것.length) {
      const 바탕 = 전역[종].get(r.기호) || 전역[종].get(r.몸) || {}
      let m = { ...바탕 }
      for (const d of 층것.slice().reverse()) m = 합(d.r, m)
      const 이름 = (f === 'FT' ? 'FT' : f) + r.몸
      m.기호 = 이름
      배근행[종].set(이름, m)
      return 이름
    }
    const 쓰기 = (k) => { const m = { ...전역[종].get(k), 기호: k }; 배근행[종].set(k, m); return k }
    if (전역[종].has(r.기호)) return 쓰기(r.기호)
    for (const [k] of 전역[종]) {
      const kr = 기호풀이(k)
      if (!kr || kr.몸 !== r.몸 || !kr.층표) continue
      const 제층 = 층말(kr.층표)
      if (!제층) continue
      const 그층 = 종 === '기초' ? 'FT' : 바닥종(종) ? 아래층(제층) : 제층
      if (그층 === f) return 쓰기(k)
    }
    if (전역[종].has(r.몸)) return 쓰기(r.몸)
    return null
  }
  const 배근있음 = 정의.length > 0

  /* 평면 기호 → 평면(제목)으로 */
  const 기호글자 = []
  for (const D of 도면들) {
    for (const g of D.글자) {
      if (쓴글자.has(D.번 + ':' + g.i)) continue
      const r = 평면기호(g.s)
      if (!r) continue
      if (r.길이 != null) {
        /* 「G1(400X700)」 — 글자 가운데가 아니라 «G1» 부분의 가운데를 기호 자리로 (기둥·보 찾는 거리가 어긋나지 않게) */
        const 앞폭 = 폭짐작(g.s.slice(0, r.앞), g.h), 몸폭 = 폭짐작(g.s.slice(r.앞, r.앞 + r.길이), g.h)
        const 가운데 = 앞폭 + 몸폭 / 2 - g.w / 2
        기호글자.push({ D, g: { ...g, x: g.x + 가운데 * Math.cos(g.a), y: g.y + 가운데 * Math.sin(g.a), w: 몸폭 }, r })
        continue
      }
      기호글자.push({ D, g, r })
    }
  }
  const 평면별 = new Map()     // 제목 → 기호글자들
  const 제목없음 = { g: null, f: ['2'], 없음: true, 이름: '' }
  for (const x of 기호글자) {
    let best = 제목찾기(x.D, x.g)
    if (!best) {
      if (제목들.some((t) => t.D === x.D)) continue       // 제목이 있는 도면인데 어느 평면에도 안 걸림(상세·단면 속 글자)
      best = 제목없음
    }
    let a = 평면별.get(best); if (!a) { a = []; 평면별.set(best, a) }
    a.push(x)
  }
  if (평면별.has(제목없음) && !바닥차례.length) { 바닥차례.push('1', '2') }
  const 기둥판있음 = [...평면별.keys()].some((t) => t.기둥판)

  /* 같은 제목의 평면이 여러 장(보 평면 · 슬래브 평면 · 개구부 평면…)이면 부재 종류마다 가장 많이 적힌 한 장만 셈 — 두 번 세지 않게 */
  const 쓸판 = new Map()     // 제목이름|종류 → 제목(판)
  for (const [t, 글들] of 평면별) {
    const 셈 = new Map()
    for (const x of 글들) 셈.set(x.r.종류, (셈.get(x.r.종류) || 0) + 1)
    for (const [종, n] of 셈) {
      const key = t.이름 + '|' + 종
      const 앞 = 쓸판.get(key)
      if (!앞 || n > 앞.n) 쓸판.set(key, { t, n })
    }
  }

  /* 부재 모으기 */
  const 층들 = new Map()
  const 층칸 = (f) => { let v = 층들.get(f); if (!v) { v = { 보: [], 기둥: new Map(), 슬라브: [], 벽: [], 기초: new Map(), 두께: [], 기둥자리: new Map(), 기초자리: new Map() }; 층들.set(f, v) } return v }
  const 없는기호 = new Map()
  const 평면목록 = []
  const 보층 = new Set(), 벽층 = new Set(), 기둥층 = new Set()
  for (const [t, 글들0] of 평면별) {
    const 글들 = 글들0.filter((x) => { const u = 쓸판.get(t.이름 + '|' + x.r.종류); return !u || u.t === t })
    if (!글들.length) continue
    // 기둥: 주심도(기둥 배치)가 있으면 기둥은 그 평면에서만
    const 층목0 = t.없음 ? ['1'] : t.f
    const 층목보 = t.없음 ? ['1'] : t.f.map(아래층)
    const 같은목 = 평면목록.find((p2) => p2.제목 === (t.g ? t.g.s : '(제목 없는 평면)') && p2.도면 === 글들[0].D.번)
    if (같은목) 같은목.기호수 += 글들.length
    else 평면목록.push({ 제목: t.g ? t.g.s : '(제목 없는 평면)', 도면: 글들[0].D.번, 층: [...new Set(t.기둥판 ? 층목0 : 층목보)], 기호수: 글들.length, 기둥판: !!t.기둥판 })
    const 높이들 = 글들.map((x) => x.g.h).sort((a, b) => a - b)
    const 보통 = 높이들[높이들.length >> 1] || 1
    const 쓸 = 글들.filter((x) => x.g.h <= 보통 * 2)
    // 층마다 (범위 제목 «3~5층» 이면 층마다 같은 것)
    const 층목 = t.기둥판 ? 층목0 : 층목보
    for (const f of [...new Set(층목)]) {
      const 기둥수 = new Map(), 기초수 = new Map(), 기둥자리 = new Map(), 기초자리 = new Map()
      const 더하기 = (m, k2, v) => { const a = m.get(k2); if (a) a.push(v); else m.set(k2, [v]) }
      const 보띠 = [], 벽띠 = [], 슬들 = []
      for (const x of 쓸) {
        const { D, g } = x
        const r = x.r
        if (r.종류 === '기둥' && 기둥판있음 && !t.기둥판) continue
        if (t.기둥판 && r.종류 !== '기둥' && r.종류 !== '벽') continue
        const 철 = 철골.get(r.기호) || 철골.get(r.몸)
        if (철) { const k2 = 철.기호; 철골수.set(k2, (철골수.get(k2) || 0) + 1); continue }
        const 층f = r.종류 === '기초' ? 'FT' : f
        const 기 = 기호정하기(r, 층f)
        if (!기) { 없는기호.set(r.기호, (없는기호.get(r.기호) || 0) + 1); continue }
        const b = 배근행[r.종류].get(기)
        const 글상자 = () => 자리만들기(D.이름, [(g.x - g.w / 2 - g.h) / D.k, (g.y - g.h) / D.k, (g.x + g.w / 2 + g.h) / D.k, (g.y + g.h) / D.k])
        if (r.종류 === '기둥') { 기둥수.set(기, (기둥수.get(기) || 0) + 1); 근거.push({ 번: D.번, i: g.i, 글: r.기호 }); 더하기(기둥자리, 기, 글상자()) }
        else if (r.종류 === '기초') { 기초수.set(기, (기초수.get(기) || 0) + 1); 근거.push({ 번: D.번, i: g.i, 글: r.기호 }); 더하기(기초자리, 기, 글상자()) }
        else if (r.종류 === '보' || r.종류 === '벽') {
          const 폭 = +(r.종류 === '보' ? b.폭 : b.두께) || 0
          const 띠 = 띠찾기(D, g, 폭)
          if (!띠) { 경고.push((r.종류 === '보' ? '보' : '벽') + ' «' + r.기호 + '» 곁에서 폭 ' + (폭 || '?') + 'mm 의 나란한 두 선을 못 찾았습니다 (' + D.번 + '번 도면)'); continue }
          if (띠.다른폭) 경고.push((r.종류 === '보' ? '보' : '벽') + ' «' + r.기호 + '» — 도면의 폭 ' + Math.round(띠.g) + 'mm 가 일람표(' + 폭 + 'mm)와 달라 도면 선으로 길이만 쟀습니다(물량은 일람표 크기)')
          ;(r.종류 === '보' ? 보띠 : 벽띠).push({ D, g, r: { ...r, 기호: 기 }, 띠 })
          for (const l of 띠.층들) (r.종류 === '보' ? 보층 : 벽층).add(D.번 + ':' + l)
        } else if (r.종류 === '슬라브') 슬들.push({ D, g, r: { ...r, 기호: 기 }, b })
      }
      // 기둥 층(닫힌 도형 레이어) — 기둥 기호 곁의 닫힌 도형
      for (const x of 쓸) {
        if (x.r.종류 !== '기둥') continue
        for (const c of x.D.닫힌) {
          const w = c.b[2] - c.b[0], h = c.b[3] - c.b[1]
          if (w < 150 || h < 150 || w > 3000 || h > 3000) continue
          const cx = (c.b[0] + c.b[2]) / 2, cy = (c.b[1] + c.b[3]) / 2
          if (Math.hypot(cx - x.g.x, cy - x.g.y) < Math.max(w, h) + 10 * x.g.h) 기둥층.add(x.D.번 + ':' + c.ly)
        }
      }
      const { 보칸, 벽칸, 슬칸 } = 평면부재(보띠, 벽띠, 슬들, 기둥층, 보층, 벽층, 배근행, 경고, 근거)
      const c = 층칸(f)
      c.보.push(...보칸); c.벽.push(...벽칸); c.슬라브.push(...슬칸)
      for (const [k2, n] of 기둥수) c.기둥.set(k2, (c.기둥.get(k2) || 0) + n)
      for (const [k2, n] of 기초수) 층칸('FT').기초.set(k2, (층칸('FT').기초.get(k2) || 0) + n)
      for (const [k2, a2] of 기둥자리) c.기둥자리.set(k2, (c.기둥자리.get(k2) || []).concat(a2))
      for (const [k2, a2] of 기초자리) 층칸('FT').기초자리.set(k2, (층칸('FT').기초자리.get(k2) || []).concat(a2))
      for (const s2 of 슬칸) c.두께.push(s2.두께)
    }
  }
  for (const [k2, n] of 없는기호) 경고.push('평면의 «' + k2 + '» ' + n + '개 — 일람표(배근표)에 없는 기호라 셈에서 뺐습니다')

  /* 공사 만들기 */
  const P = 새공사()
  P.이름 = '도면에서 자동 — ' + 도면들0.map((d) => d.이름 || '').filter(Boolean).join(' · ')
  for (const k2 of Object.keys(배근행)) {
    const 쓴 = new Set(배근행[k2].keys())
    const 줄 = [...배근행[k2].values()]
    for (const [k3, m] of 전역[k2]) if (!쓴.has(k3)) 줄.push({ ...m, 기호: k3 })      // 평면에 없어도 일람표에 있는 것은 배근표에 둠
    P.배근[k2 === '벽' ? '벽' : k2] = 줄.map(({ _근거, _짐작, ...r }) => r)
  }
  const 층이름들 = new Set(['FT'])
  for (const f of 층들.keys()) 층이름들.add(f)
  for (const f of 바닥차례) { const i = 바닥차례.indexOf(f); if (i < 바닥차례.length - 1) 층이름들.add(f) }
  const 꼭대기 = 바닥차례.length ? 바닥차례[바닥차례.length - 1] : 'R'
  const 층목록 = [...층이름들].sort(층차례).filter((f) => f !== 꼭대기)
  const 짐작층 = []
  P.층 = 층목록.map((f) => {
    if (f === 'FT') return { 이름: 'FT', 층고: 0, 슬라브: 0 }
    const i = 바닥차례.indexOf(f)
    const 위 = i >= 0 ? 바닥차례[i + 1] : null
    let 고 = null
    if (높이.has(f) && 위 && 높이.has(위)) 고 = 높이.get(위) - 높이.get(f)
    if (!(고 > 0)) { 고 = 3300; 짐작층.push(f) }
    const 두 = (층들.get(f) || { 두께: [] }).두께.filter((v) => v > 0)
    const 흔한 = 두.length ? [...두.reduce((m2, v) => m2.set(v, (m2.get(v) || 0) + 1), new Map())].sort((a, b) => b[1] - a[1])[0][0] : 150
    return { 이름: f, 층고: 고, 슬라브: 흔한 }
  })
  P.층.push({ 이름: 꼭대기 === 'PR' ? 'PR' : 'R', 층고: 0, 슬라브: 0 })
  if (짐작층.length) 경고.push('층고를 도면에서 못 찾아 3,300mm 로 짐작한 층: ' + 짐작층.join(' · ') + ' — 골조 화면 «① 개요» 에서 고쳐 주세요')
  for (const z of 짐작칸) 경고.push('일람표의 ' + z + ' 는 짐작입니다 — 배근표를 한 번 보아 주세요')
  const 동 = 새동('')
  const 주 = 동.주자료
  const 이야기층 = P.층.filter((f) => f.이름 !== 'FT' && f.층고 > 0).map((f) => f.이름)
  let 열번 = 0
  for (const f of [...층들.keys()].sort(층차례)) {
    const c = 층들.get(f)
    const 홑 = new Map()
    for (const 줄 of c.보) {
      if (줄.length === 1) {
        const x = 줄[0]
        const key = x.기호 + '|' + (x.안목 + x.좌 + x.우) + '|' + x.좌 + '|' + x.우
        const h = 홑.get(key); if (h) { h.QT++; h._자리.push(x.자리) } else 홑.set(key, { 층: f, 열: '', 기호: x.기호, 길이: String(x.안목 + x.좌 + x.우), 좌단: x.좌 ? String(x.좌) : '', 우단: x.우 ? String(x.우) : '', S: '', QT: 1, C: '', F: '', 공제F: '', R: '', _자리: [x.자리] })
        continue
      }
      열번++
      줄.forEach((x, i) => 주.보.push({ 층: f, 열: i === 0 ? 'A' + 열번 : i === 줄.length - 1 ? 'E' : '', 기호: x.기호, 길이: String(x.안목 + x.좌 + x.우), 좌단: x.좌 ? String(x.좌) : '', 우단: x.우 ? String(x.우) : '', S: '', QT: '1', C: '', F: '', 공제F: '', R: '', _자리: [x.자리] }))
    }
    for (const h of 홑.values()) 주.보.push({ ...h, QT: String(h.QT) })
    const i = 이야기층.indexOf(f)
    const 위층 = i >= 0 ? 이야기층[i + 1] : null
    const 맨아래 = i === 0
    const 기초기호 = 맨아래 ? [...(층들.get('FT') || { 기초: new Map() }).기초.keys()][0] || '' : ''
    for (const [k2, n] of c.기둥) {
      const 몸 = (기호풀이(k2) || {}).몸
      const 위것 = 위층 && 층들.get(위층) ? [...층들.get(위층).기둥.keys()].find((x) => x === k2 || (기호풀이(x) || {}).몸 === 몸) : null
      주.기둥.push({ 층: f === 'FT' ? (이야기층[0] || '1') : f, 기호: k2, 높이: '', 내림: '', S: '', FT: 기초기호, 연결: 위것 || 'R', QT: String(n), C: '', F: '', 원형F: '', R: '', _자리: c.기둥자리.get(k2) || [] })
    }
    const 슬홑 = new Map()
    for (const s2 of c.슬라브) {
      const key = s2.기호 + '|' + s2.단변 + '|' + s2.장변 + '|' + s2.단정 + '|' + s2.장정
      const h = 슬홑.get(key); if (h) { h.QT++; h._자리.push(s2.자리) } else 슬홑.set(key, { 층: f, 기호: s2.기호, 단변: String(s2.단변), 장변: String(s2.장변), 개구부: '', 단변정착: String(s2.단정), 장변정착: String(s2.장정), QT: 1, C: '', F: '', R: '', _자리: [s2.자리] })
    }
    for (const h of 슬홑.values()) 주.슬라브.push({ ...h, QT: String(h.QT) })
    const 벽홑 = new Map()
    for (const 줄 of c.벽) for (const x of 줄) {
      const key = x.기호 + '|' + x.안목
      const h = 벽홑.get(key); if (h) { h.QT++; h._자리.push(x.자리) } else 벽홑.set(key, { 층: f === 'FT' ? (이야기층[0] || '1') : f, 기호: x.기호, 길이: String(x.안목), 높이: '', 하부: '', 상부: '', 단부: '', X정착: '2', 상부이음: '1', OPEN: '', QT: 1, C: '', F: '', F2: '', R: '', _자리: [x.자리] })
    }
    for (const h of 벽홑.values()) 주.옹벽.push({ ...h, QT: String(h.QT) })
    for (const [k2, n] of c.기초) 주.기초.push({ 층: 'FT', 기호: k2, 줄기초: '', MAT단변: '', MAT장변: '', 형틀공제: '', 추가: '', 단부공제: '', QT: String(n), C: '', F: '', 공제F: '', R: '', _자리: c.기초자리.get(k2) || [] })
  }
  P.동 = [동]
  const 셈수 = Object.values(주).reduce((t2, a2) => t2 + a2.length, 0)
  if (!배근있음 && 기호글자.length) 경고.push('부재 일람표(보·기둥·슬래브 크기와 철근)를 찾지 못했습니다 — 일람표가 있는 도면도 같이 넣어 주세요')
  // 크기·철근이 빈 배근 줄 — 알림
  const 빈것 = []
  for (const [k2, 줄] of Object.entries(P.배근)) for (const r of 줄 || []) {
    const 빔 = k2 === '보' ? !(+r.폭 && +r.춤) || (!r.상부 && !r.하부) : k2 === '기둥' ? !((+r.가로 && +r.세로) || +r.지름) || !r.주근 : k2 === '슬라브' ? !+r.두께 : k2 === '벽' ? !+r.두께 : k2 === '기초' ? !+r.두께 : false
    if (빔) 빈것.push(r.기호)
  }
  if (빈것.length) 경고.push('크기나 철근을 일람표에서 다 찾지 못한 기호 ' + 빈것.length + '개(' + 빈것.slice(0, 8).join(' · ') + (빈것.length > 8 ? ' …' : '') + ') — 그 부재는 철근(또는 물량)이 덜 나옵니다. 일람표 도면도 같이 넣거나 골조 화면 배근표에서 채워 주세요')
  const 모은경고 = []
  const 셈경고 = new Map()
  for (const w of 경고) { const key = w.replace(/ \(\d+번 도면\)$/, ''); if (셈경고.has(key)) 셈경고.set(key, 셈경고.get(key) + 1); else { 셈경고.set(key, 1); 모은경고.push(key) } }
  const 경고들 = 모은경고.map((w) => (셈경고.get(w) > 1 ? w + ' (' + 셈경고.get(w) + '곳)' : w))
  if (철골.size) 경고들.unshift('철골 부재 ' + 철골.size + '가지(' + [...철골.values()].slice(0, 4).map((x) => x.기호 + ' ' + x.규격).join(' · ') + (철골.size > 4 ? ' …' : '') + ')는 철근콘크리트 셈에서 뺐습니다 — 철골 무게는 아직 자동으로 안 셉니다')
  /* 📋 일반구조사항의 정착·이음 길이표 (2026-09-28) — 찾으면 기준값 정착표에 넣음(이 fck 줄만).
     표의 fck 가 하나뿐이면 기준 fck 도 그 값으로. 못 알아본 줄(칸 짐작 없음)은 넣지 않음 */
  let 정착읽음 = null
  for (const D of 도면들) {
    let 찾음 = []
    try { 찾음 = 표찾기(D.모델, D.k) } catch (e) { 찾음 = [] }
    for (const c of 찾음) if (!정착읽음 || c.셈 > 정착읽음.셈) 정착읽음 = { ...c, 번: D.번 }
  }
  if (정착읽음) {
    const fcks = [...new Set(정착읽음.표.줄.filter((z) => z.칸 && z.그럴듯 !== false && z.fck != null).map((z) => z.fck))]
    if (fcks.length === 1 && fcks[0] !== +P.기준.fck) P.기준.fck = fcks[0]
    const 넣 = 넣을것(정착읽음.표.줄, P.기준.fck, 정착표(+P.기준.fck, +P.기준.fy))
    정착읽음.넣은 = 넣.넣은; 정착읽음.뺀 = 넣.뺀
    if (넣.넣은.length) {
      P.기준.정착 = 넣.정착
      P.기준.정착출처 = '도면의 정착·이음표' + (정착읽음.제목 ? ' «' + 정착읽음.제목 + '»' : '') + ' — fck ' + P.기준.fck + ' 줄 · ' + [...new Set(넣.넣은.map((x) => 칸이름[x.칸]))].join('·')
    }
  }
  return {
    공사: P, 경고: 경고들, 근거, 있음: 셈수 > 0, 정착표: 정착읽음,
    읽음: {
      배근: Object.fromEntries(Object.entries(P.배근).map(([k2, v]) => [k2, v])),
      평면: 평면목록, 높이: Object.fromEntries(높이), 층고짐작: 짐작층,
      철골: [...철골.values()].map((x) => ({ 기호: x.기호, 종류: x.종류, 규격: x.규격, 수: 철골수.get(x.기호) || 0 })),
      셈: { 보: 주.보.length, 기둥: 주.기둥.length, 슬라브: 주.슬라브.length, 벽: 주.옹벽.length, 기초: 주.기초.length },
      개수: Object.fromEntries([['보', 주.보], ['기둥', 주.기둥], ['슬라브', 주.슬라브], ['벽', 주.옹벽], ['기초', 주.기초]].map(([k, a2]) => [k, a2.reduce((t2, r) => t2 + (+r.QT || 1), 0)])),
    },
  }
}

/** 한 평면·한 층의 보·벽 토막과 슬래브 칸 */
function 평면부재(보띠, 벽띠, 슬들, 기둥층, 보층, 벽층, 배근행, 경고, 근거) {
  const 토막들 = (띠들, 종) => {
    const 묶음 = new Map()
    for (const x of 띠들) {
      const { 띠, D } = x
      const 각 = Math.round(((Math.atan2(띠.uy, 띠.ux) + Math.PI) % Math.PI) * 1000)
      const 자리 = Math.round((띠.px * 띠.nx + 띠.py * 띠.ny) / 5)
      const 열쇠 = D.번 + '|' + 각 + '|' + 자리 + '|' + Math.round(띠.g / 5)
      let m2 = 묶음.get(열쇠)
      if (!m2) {
        const 기층 = new Set([...기둥층].filter((k2) => k2.startsWith(D.번 + ':')).map((k2) => +k2.split(':')[1]))
        m2 = { 띠, D, 토막: 띠토막(D, 띠, 기층.size ? 기층 : null), 이름표: [] }
        묶음.set(열쇠, m2)
      }
      const t = (x.g.x - m2.띠.px) * m2.띠.ux + (x.g.y - m2.띠.py) * m2.띠.uy
      m2.이름표.push({ t, r: x.r, g: x.g })
    }
    const 칸들 = []
    for (const m2 of 묶음.values()) {
      const P = m2.토막
      if (!P.length) { 경고.push(종 + ' «' + m2.이름표[0].r.기호 + '» 의 두 선 구간을 못 잡았습니다'); continue }
      const 주인 = new Array(P.length).fill(null)
      for (const n2 of m2.이름표) {
        let bi = -1, bd = Infinity
        P.forEach((p, i) => { const d = n2.t < p.t0 ? p.t0 - n2.t : n2.t > p.t1 ? n2.t - p.t1 : 0; if (d < bd) { bd = d; bi = i } })
        if (bi >= 0 && bd < 1500 && !주인[bi]) 주인[bi] = n2
      }
      const 이어짐 = (i) => P[i].오 && P[i + 1] && P[i + 1].왼 === P[i].오
      for (let pass = 0; pass < P.length; pass++) {
        let 바뀜 = false
        for (let i = 0; i < P.length; i++) {
          if (주인[i]) continue
          if (i > 0 && 주인[i - 1] && 이어짐(i - 1)) { 주인[i] = { ...주인[i - 1], 물림: true }; 바뀜 = true }
          else if (i < P.length - 1 && 주인[i + 1] && 이어짐(i)) { 주인[i] = { ...주인[i + 1], 물림: true }; 바뀜 = true }
        }
        if (!바뀜) break
      }
      let 열 = []
      const 열들 = []
      for (let i = 0; i < P.length; i++) {
        if (!주인[i]) { if (열.length) 열들.push(열); 열 = []; continue }
        if (열.length && !(이어짐(i - 1) && 주인[i - 1] && 주인[i - 1].r.기호 === 주인[i].r.기호)) { 열들.push(열); 열 = [] }
        열.push(i)
      }
      if (열.length) 열들.push(열)
      for (const 열i of 열들) {
        const 줄 = 열i.map((i) => {
          const p = P[i]
          const 좌 = p.왼 ? p.왼[2] : 0, 우 = p.오 ? p.오[2] : 0
          const 안목 = p.t1 - p.t0
          const { D, 띠 } = m2
          const a = [띠.px + 띠.ux * p.t0, 띠.py + 띠.uy * p.t0], b = [띠.px + 띠.ux * p.t1, 띠.py + 띠.uy * p.t1]
          const k = D.k
          const 상자 = [(Math.min(a[0], b[0]) - 띠.g / 2 * Math.abs(띠.nx)) / k, (Math.min(a[1], b[1]) - 띠.g / 2 * Math.abs(띠.ny)) / k, (Math.max(a[0], b[0]) + 띠.g / 2 * Math.abs(띠.nx)) / k, (Math.max(a[1], b[1]) + 띠.g / 2 * Math.abs(띠.ny)) / k]
          근거.push({ 번: D.번, 상자, 글: 주인[i].r.기호 + ' 안목 ' + Math.round(안목) })
          return { 기호: 주인[i].r.기호, 안목: Math.round(안목), 좌: Math.round(좌), 우: Math.round(우), 물림: !!주인[i].물림, 자리: 자리만들기(D.이름, 상자) }
        })
        칸들.push(줄)
      }
    }
    return 칸들
  }
  const 보칸 = 토막들(보띠, '보')
  const 벽칸 = 토막들(벽띠, '벽')
  const 구조층 = new Map()
  for (const k2 of [...보층, ...벽층, ...기둥층]) { const [d, l] = k2.split(':'); let s = 구조층.get(+d); if (!s) { s = new Set(); 구조층.set(+d, s) } s.add(+l) }
  const 폭들 = [...new Set([...배근행.보.values()].map((b) => +b.폭).concat([...배근행.벽.values()].map((w) => +w.두께)).filter((v) => v > 0))]
  const 슬칸 = []
  const 판본 = new Set()
  const 잰들 = []
  for (const x of 슬들) {
    const 잰 = 슬래브재기(x.D, x.g, 구조층.get(x.D.번) || null, 폭들)
    if (잰.some((v) => !v)) { 경고.push('슬래브 «' + x.r.기호 + '» 둘레의 보·벽을 네 방향 모두에서 찾지 못했습니다'); continue }
    const [오, 왼, 위, 아래] = 잰
    const key = x.D.번 + '|' + Math.round(x.g.x + (오.d - 왼.d) / 2) + '|' + Math.round(x.g.y + (위.d - 아래.d) / 2)
    if (판본.has(key)) continue
    판본.add(key)
    잰들.push({ x, 오, 왼, 위, 아래, x0: x.g.x - 왼.d, x1: x.g.x + 오.d, y0: x.g.y - 아래.d, y1: x.g.y + 위.d })
  }
  const 이웃 = (a, 변) => 잰들.some((b) => {
    if (b === a || b.x.D !== a.x.D) return false
    const 겹x = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), 겹y = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0)
    if (변 === '오') return Math.abs(b.x0 - a.x1) < 50 && 겹y > 100
    if (변 === '왼') return Math.abs(b.x1 - a.x0) < 50 && 겹y > 100
    if (변 === '위') return Math.abs(b.y0 - a.y1) < 50 && 겹x > 100
    return Math.abs(b.y1 - a.y0) < 50 && 겹x > 100
  })
  for (const a of 잰들) {
    const { x, 오, 왼, 위, 아래 } = a
    const Lx = 오.d + 왼.d, Ly = 위.d + 아래.d
    const 바 = (변) => (이웃(a, 변) ? 0 : 1)
    const x단 = Lx <= Ly
    const 단정 = x단 ? 바('오') + 바('왼') : 바('위') + 바('아래')
    const 장정 = x단 ? 바('위') + 바('아래') : 바('오') + 바('왼')
    const k = x.D.k
    const 상자 = [(x.g.x - 왼.d) / k, (x.g.y - 아래.d) / k, (x.g.x + 오.d) / k, (x.g.y + 위.d) / k]
    근거.push({ 번: x.D.번, 상자, 글: x.r.기호 + ' ' + Math.round(Math.min(Lx, Ly)) + '×' + Math.round(Math.max(Lx, Ly)) })
    슬칸.push({ 기호: x.r.기호, 단변: Math.round(Math.min(Lx, Ly)), 장변: Math.round(Math.max(Lx, Ly)), 단정, 장정, 두께: +(x.b && x.b.두께) || 0, 자리: 자리만들기(x.D.이름, 상자) })
  }
  return { 보칸, 벽칸, 슬칸 }
}

/**
 * 골조 산출서 시트들(골조 화면의 엑셀과 같은 양식)을 «골조 …» 이름으로 — 도면 물량 자동 엑셀 한 파일에 같이 넣으려고.
 * 시트 이름이 바뀌므로 집계의 식(SUMPRODUCT … 산출서!…)도 새 이름으로 고칩니다.
 */
/** 읽은 부재 한 줄 글 — 「보 46칸 · 기둥 24개 · 슬래브 24칸 · 벽 1곳 · 기초 12개」 */
export function 개수글(R) {
  const n = (R && R.읽음 && R.읽음.개수) || {}
  return [n.보 ? '보 ' + n.보 + '칸' : '', n.기둥 ? '기둥 ' + n.기둥 + '개' : '', n.슬라브 ? '슬래브 ' + n.슬라브 + '칸' : '', n.벽 ? '벽 ' + n.벽 + '곳' : '', n.기초 ? '기초 ' + n.기초 + '개' : ''].filter(Boolean).join(' · ')
}

export function 골조시트들(공사, 결과, 모양) {
  const sheets = 골조엑셀(공사, 결과, (s) => s, 모양)
  const 바꿈 = new Map(sheets.map((x) => [x.name, ('골조 ' + x.name).slice(0, 28)]))
  const 틀 = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const 고치 = (f) => {
    let t = String(f)
    for (const [a, b] of 바꿈) {
      t = t.split("'" + a + "'!").join("'" + b + "'!")
      t = t.replace(new RegExp('(^|[^A-Za-z가-힣0-9_.\'])' + 틀(a) + '!', 'g'), (m, p) => p + "'" + b + "'!")
    }
    return t
  }
  return sheets.map((x) => ({ ...x, name: 바꿈.get(x.name), rows: x.rows.map((r) => r.map((c) => (c && typeof c === 'object' && c.f ? { ...c, f: 고치(c.f) } : c))) }))
}
