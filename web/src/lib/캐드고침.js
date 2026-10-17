/**
 * 🛠 캐드 고치기 — 진단 · 글꼴 · 한글 깨짐 · 판 낮추기(DXF R12 ~ 2018) (2026-10-17)
 *
 * 소장님: 「캐드 버전 · 글꼴 …」 「크몽보다 좋아야 해. 반드시, 대충만들지마」 「모든 도구는 사이트 내에서 사용가능하게」
 *   크몽 «버전다운 · 폰트 오류 · 병합 · 분리» 5천 ~ 2만 원(판매자 한 명 517 거래) — 사람이 AutoCAD 로 다시 저장해 줌.
 *
 * ■ 두 길
 *   ① 그대로 고치기(보존) — 파일의 짝(그룹 코드 · 값)을 하나도 버리지 않고 글꼴(STYLE 3 · 4) · 글 안 글꼴(\f…;) · 코드페이지만 바꿔 다시 씀.
 *      배치(종이) 공간 · 치수 · 사전 · 모든 것이 그대로. 판은 그대로(또는 같은 짜임의 2007 ~ 2018 사이).
 *   ② 깨끗하게 다시 쓰기(판 낮추기) — 모형 공간 + 블록의 도형을 하나씩 읽어 고른 판(R12 · 2000 · 2004 · 2007 · 2010 · 2013 · 2018)에 맞는
 *      꼴로 새로 씀. 그 판에 없는 도형은 바꿔 씀(R12: LWPOLYLINE → POLYLINE · MTEXT → TEXT · HATCH → 선 · 세모 · 치수 → 블록 …).
 *      빈 틀(머리 · 표 · 사전)은 ezdxf 가 만든 판마다의 틀(lib/dxf판틀.js — tools/dxf판틀_만들기.py)을 씀.
 * ■ 글 인코딩: 2007 판부터 UTF-8 · 그 전은 도면 코드페이지(한글 = ANSI_949 = CP949). CP949 에 없는 글자는 \U+XXXX.
 *   브라우저 TextEncoder 는 UTF-8 만 → CP949 는 TextDecoder('euc-kr') 로 거꾸로 표를 만들어 씀(처음 한 번 · 약 2만 글자).
 * ■ 시험: node tools/시험_캐드고침.mjs (ezdxf 로 다시 읽어 audit · 그림 견주기)
 */

/* ───────────────────────────── ① 판 · 코드페이지 · 글 풀기 */

export const 판이름 = { AC1009: 'R12', AC1012: 'R13', AC1014: 'R14', AC1015: '2000', AC1018: '2004', AC1021: '2007', AC1024: '2010', AC1027: '2013', AC1032: '2018' }
export const 판들 = [['AC1032', '2018'], ['AC1027', '2013'], ['AC1024', '2010'], ['AC1021', '2007'], ['AC1018', '2004'], ['AC1015', '2000'], ['AC1009', 'R12']]
/** 다시 쓸 수 있는 판(고르는 칸) */
export const 판목록 = [
  { 판: 'AC1032', 이름: '2018', 설명: 'AutoCAD 2018 ~ 지금' },
  { 판: 'AC1027', 이름: '2013', 설명: 'AutoCAD 2013 ~ 2017' },
  { 판: 'AC1024', 이름: '2010', 설명: 'AutoCAD 2010 ~ 2012' },
  { 판: 'AC1021', 이름: '2007', 설명: 'AutoCAD 2007 ~ 2009' },
  { 판: 'AC1018', 이름: '2004', 설명: 'AutoCAD 2004 ~ 2006' },
  { 판: 'AC1015', 이름: '2000', 설명: 'AutoCAD 2000 ~ 2002 · 옛 캐디안' },
  { 판: 'AC1009', 이름: 'R12', 설명: '아주 옛 캐드 · 다른 프로그램(CNC · 측량 · 레이저)' },
]
/** 받을 파일 이름 — 원래이름_2007.dxf · 모두 보존이면 원래이름_글꼴고침.dxf */
export function 받을이름(원래, 판이름v, 방식) {
  const 밑 = String(원래 || '도면').replace(/\.(dxf|dwg)$/i, '')
  return `${밑}_${방식 === '그대로' ? '글꼴고침' : 판이름v}.dxf`
}
const 코드페이지표 = { ANSI_949: 'euc-kr', ANSI_1252: 'windows-1252', ANSI_932: 'shift_jis', ANSI_936: 'gbk', ANSI_950: 'big5', ANSI_1250: 'windows-1250', ANSI_1251: 'windows-1251', ANSI_874: 'windows-874', DOS949: 'euc-kr', UTF8: 'utf-8', 'UTF-8': 'utf-8' }

/** 머리에서 변수 값(아스키로만 훑음) — 처음 64 KB */
function 머리값(u, 이름) {
  const n = Math.min(u.length, 65536)
  let s = ''
  for (let i = 0; i < n; i++) s += String.fromCharCode(u[i])
  const i = s.indexOf(이름)
  if (i < 0) return ''
  const m = /^\s*\r?\n\s*\d+\s*\r?\n([^\r\n]*)/.exec(s.slice(i + 이름.length, i + 이름.length + 200))
  return m ? m[1].trim() : ''
}
const 한글수 = (s) => { let n = 0; for (const ch of s) { const c = ch.codePointAt(0); if (c >= 0xac00 && c <= 0xd7a3) n++ } return n }

/**
 * DXF 바이트 → 글
 * @returns { 글, 판, 코드페이지, 인코딩, 깨짐: {의심, 지금한글, 949한글} }
 */
export function 풀기(bytes) {
  const u = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  if (u.length >= 22 && String.fromCharCode(...u.subarray(0, 18)) === 'AutoCAD Binary DXF') throw Object.assign(new Error('바이너리 DXF'), { kind: 'bindxf' })
  const 판 = 머리값(u, '$ACADVER') || 'AC1009'
  const 코드페이지 = 머리값(u, '$DWGCODEPAGE') || ''
  let 인코딩 = 판 >= 'AC1021' ? 'utf-8' : (코드페이지표[코드페이지.toUpperCase()] || 'euc-kr')
  let 글 = new TextDecoder(인코딩).decode(u)
  /* 한글 깨짐 의심 — 2007 전 판인데 코드페이지가 한글이 아님(ANSI_1252 등) · 그런데 CP949 로 풀면 한글이 많이 나옴 */
  const 깨짐 = { 의심: false, 지금한글: 0, 한글949: 0 }
  if (판 < 'AC1021' && 인코딩 !== 'euc-kr') {
    let 높 = 0
    for (let i = 0; i < u.length; i++) if (u[i] >= 0x80) { 높++; if (높 > 20) break }
    if (높 > 20) {
      const 다른 = new TextDecoder('euc-kr').decode(u)
      깨짐.지금한글 = 한글수(글); 깨짐.한글949 = 한글수(다른)
      if (깨짐.한글949 > 깨짐.지금한글 + 5) 깨짐.의심 = true
    }
  }
  /* 2007 판부터인데 UTF-8 로 풀리지 않는 바이트(대체 문자 많음) → CP949 로 적힌 «가짜 2007» */
  if (인코딩 === 'utf-8') {
    let 대체 = 0
    for (let i = 0; i < 글.length && 대체 < 30; i++) if (글.charCodeAt(i) === 0xfffd) 대체++
    if (대체 >= 30) { const 다른 = new TextDecoder('euc-kr').decode(u); if (한글수(다른) > 한글수(글)) { 깨짐.의심 = true; 깨짐.utf8아님 = true } }
  }
  return { 글, 판, 코드페이지, 인코딩, 깨짐 }
}

/** \U+XXXX · \M+nXXXX(옛 판 2바이트 글자) → 글자 */
export function 풀린글(s) {
  if (!s || s.indexOf('\\') < 0) return s
  return s.replace(/\\U\+([0-9A-Fa-f]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\M\+([1-5])([0-9A-Fa-f]{4})/g, (m, n, h) => {
      const 표 = { 1: 'shift_jis', 2: 'big5', 3: 'euc-kr', 4: 'euc-kr', 5: 'gbk' }
      try { const b = parseInt(h, 16); return new TextDecoder(표[n]).decode(new Uint8Array([b >> 8, b & 255])) } catch (e) { return m }
    })
}

/* ── CP949 싸기 — TextDecoder('euc-kr') 로 거꾸로 표 ── */
let _949 = null
function 표949() {
  if (_949) return _949
  _949 = new Map()
  const d = new TextDecoder('euc-kr')
  const buf = new Uint8Array(2)
  for (let a = 0x81; a <= 0xfe; a++) for (let b = 0x41; b <= 0xfe; b++) {
    if (b > 0x5a && b < 0x61) continue
    if (b > 0x7a && b < 0x81) continue
    buf[0] = a; buf[1] = b
    const s = d.decode(buf)
    if (s.length === 1 && s !== '�' && !_949.has(s)) _949.set(s, (a << 8) | b)
  }
  return _949
}
/** 글 → 바이트(인코딩: 'utf-8' | 'euc-kr' — CP949 에 없는 글자는 \U+XXXX) */
export function 싸기(글, 인코딩 = 'utf-8') {
  if (인코딩 === 'utf-8') return new TextEncoder().encode(글)
  const 표 = 표949()
  const out = new Uint8Array(글.length * 2 + 16)
  let n = 0
  const 넣 = (b) => { out[n++] = b }
  let 늘 = out
  for (const ch of 글) {
    if (n + 8 > 늘.length) { const 새 = new Uint8Array(늘.length * 2); 새.set(늘.subarray(0, n)); 늘 = 새 }
    const c = ch.codePointAt(0)
    if (c < 0x80) { 늘[n++] = c; continue }
    const v = 표.get(ch)
    if (v !== undefined) { 늘[n++] = v >> 8; 늘[n++] = v & 255; continue }
    const esc = c > 0xffff ? '?' : '\\U+' + c.toString(16).toUpperCase().padStart(4, '0')
    for (let i = 0; i < esc.length; i++) 늘[n++] = esc.charCodeAt(i)
  }
  void 넣
  return 늘.subarray(0, n)
}

/* ───────────────────────────── ② 짝(그룹 코드 · 값) 읽기 */

/** 숫자 값을 갖는 그룹 코드(앞뒤 빈칸을 지워도 되는 것) — LibreDWG 는 «70=     0» 처럼 빈칸을 붙여 씀 */
export function 숫자코드(c) {
  return (c >= 10 && c <= 99) || (c >= 140 && c <= 289) || (c >= 290 && c <= 299) || (c >= 370 && c <= 389) || (c >= 400 && c <= 409) ||
    (c >= 420 && c <= 429) || (c >= 440 && c <= 469) || (c >= 1010 && c <= 1071)
}
/** 글 → 짝들 [[코드, 값] …] (값은 글 그대로 — 숫자 코드만 앞뒤 빈칸 지움) */
export function 짝들(글) {
  const 줄 = 글.split(/\r?\n/)
  const out = []
  for (let i = 0; i + 1 < 줄.length; i += 2) {
    const c = parseInt(줄[i], 10)
    if (Number.isNaN(c)) { i--; continue }               /* 빈 줄 · 깨진 줄 하나 건너뜀 */
    const v = 줄[i + 1]
    out.push([c, 숫자코드(c) ? v.trim() : v])
  }
  return out
}

/** 짝들 → 구역 · 표 · 블록 · 도형으로 */
export function 나누기(짝) {
  const D = { 머리: [], 구역: [], 표: {}, 블록: [], 도형: [], 사전: [], 클래스: [] }
  let i = 0
  const n = 짝.length
  /* 도형 하나 = 0 코드에서 다음 0 코드 앞까지 */
  const 하나 = () => { const t = 짝[i][1]; const g = []; i++; while (i < n && 짝[i][0] !== 0) { g.push(짝[i]); i++ } return { t, g } }
  /* POLYLINE / INSERT 뒤의 VERTEX · ATTRIB … SEQEND 를 묶음 */
  const 도형들 = (끝말) => {
    const out = []
    while (i < n && !(짝[i][0] === 0 && 끝말.includes(짝[i][1]))) {
      if (짝[i][0] !== 0) { i++; continue }
      const e = 하나()
      if (e.t === 'POLYLINE' || (e.t === 'INSERT' && 수(e, 66) === 1)) {
        e.딸 = []
        while (i < n && 짝[i][0] === 0 && 짝[i][1] !== 'SEQEND' && (짝[i][1] === 'VERTEX' || 짝[i][1] === 'ATTRIB')) e.딸.push(하나())
        if (i < n && 짝[i][0] === 0 && 짝[i][1] === 'SEQEND') e.끝 = 하나()
      }
      out.push(e)
    }
    return out
  }
  while (i < n) {
    if (!(짝[i][0] === 0 && 짝[i][1] === 'SECTION')) { i++; continue }
    i++
    const 이름 = 짝[i] && 짝[i][0] === 2 ? 짝[i][1] : ''
    i++
    D.구역.push(이름)
    if (이름 === 'HEADER') {
      while (i < n && !(짝[i][0] === 0 && 짝[i][1] === 'ENDSEC')) { D.머리.push(짝[i]); i++ }
    } else if (이름 === 'TABLES') {
      while (i < n && !(짝[i][0] === 0 && 짝[i][1] === 'ENDSEC')) {
        if (짝[i][0] === 0 && 짝[i][1] === 'TABLE') {
          const 머 = 하나()
          const 표이름 = 값(머, 2)
          const 줄 = []
          while (i < n && !(짝[i][0] === 0 && 짝[i][1] === 'ENDTAB')) { if (짝[i][0] === 0) 줄.push(하나()); else i++ }
          if (i < n) i++
          D.표[표이름] = 줄
        } else i++
      }
    } else if (이름 === 'BLOCKS') {
      while (i < n && !(짝[i][0] === 0 && 짝[i][1] === 'ENDSEC')) {
        if (짝[i][0] === 0 && 짝[i][1] === 'BLOCK') {
          const b = 하나()
          b.도형 = 도형들(['ENDBLK', 'ENDSEC'])
          if (i < n && 짝[i][1] === 'ENDBLK') b.끝 = 하나()
          D.블록.push(b)
        } else i++
      }
    } else if (이름 === 'ENTITIES') {
      D.도형 = 도형들(['ENDSEC'])
    } else if (이름 === 'OBJECTS') {
      while (i < n && !(짝[i][0] === 0 && 짝[i][1] === 'ENDSEC')) { if (짝[i][0] === 0) D.사전.push(하나()); else i++ }
    } else if (이름 === 'CLASSES') {
      while (i < n && !(짝[i][0] === 0 && 짝[i][1] === 'ENDSEC')) { if (짝[i][0] === 0) D.클래스.push(하나()); else i++ }
    } else {
      while (i < n && !(짝[i][0] === 0 && 짝[i][1] === 'ENDSEC')) i++
    }
    if (i < n) i++                                       /* ENDSEC */
  }
  return D
}

/** 도형의 코드 값(첫 것) · 모두 */
export function 값(e, c, 기본 = '') { for (const [k, v] of e.g) if (k === c) return v; return 기본 }
export function 수(e, c, 기본 = 0) { const v = 값(e, c, null); if (v === null || v === '') return 기본; const x = Number(v); return Number.isFinite(x) ? x : 기본 }
export function 모두(e, c) { const out = []; for (const [k, v] of e.g) if (k === c) out.push(v); return out }
/** 머리 변수 값 */
export function 머리(D, 이름, 코드 = null) {
  for (let i = 0; i < D.머리.length; i++) if (D.머리[i][0] === 9 && D.머리[i][1] === 이름) {
    const j = i + 1
    if (j < D.머리.length && (코드 === null || D.머리[j][0] === 코드)) return D.머리[j][1]
  }
  return ''
}

/* ───────────────────────────── ③ 진단 */

/* 한국 도면에 흔한 SHX(없는 PC 가 많은 것 · 있는 것) — 없을 수 있는 글꼴을 짚음 */
const 흔한shx = /^(txt|romans|romand|romant|romanc|simplex|complex|italic|isocp|isoct|isocpeur|scripts|gothic\w*|monotxt|bold|whgtxt|whgdtxt|whtgtxt|whtmtxt|hgtxt|hgdtxt|hgmtxt|ghs|bigfont|chineset|extfont\d?|gbcbig|kaiti)(\.shx)?$/i
const 흔한ttf = /^(malgun|malgunbd|malgunsl|gulim|batang|gungsuh|arial\w*|times\w*|tahoma\w*|verdana\w*|calibri\w*|cambria\w*|consola\w*|cour\w*|georgia\w*|segoe\w*|micross|trebuc\w*|symbol|wingding\w*|simsun|msyh|nanum\w*|hy\w*|hans\w*|h2\w*|hmk\w*)(\.tt[fc])?$/i

/** @returns { 판, 판이름, 코드페이지, 인코딩, 깨짐, 단위, 도형수:{종류:수}, 블록수, 외부참조:[…], 그림참조:[…], 층:{수, 꺼짐, 얼림, 잠김}, 글꼴:[…], 글안글꼴:[…], 배치도형수, 프록시, 문제:[{급, 글, 고침}] } */
export function 진단(풀린, D) {
  const 도형수 = {}
  const 셈 = (l) => { for (const e of l) { 도형수[e.t] = (도형수[e.t] || 0) + 1 } }
  셈(D.도형)
  let 배치 = 0
  for (const e of D.도형) if (수(e, 67) === 1) 배치++
  const 블도형 = {}
  for (const b of D.블록) for (const e of b.도형 || []) 블도형[e.t] = (블도형[e.t] || 0) + 1
  const 블록 = D.블록.filter((b) => !/^\*(Model|Paper)_Space/i.test(값(b, 2)))
  const 외부참조 = 블록.filter((b) => (수(b, 70) & 4) !== 0).map((b) => ({ 이름: 값(b, 2), 길: 값(b, 1) }))
  const 그림참조 = D.사전.filter((o) => o.t === 'IMAGEDEF').map((o) => 값(o, 1))
  const 층 = D.표.LAYER || []
  const 꺼짐 = 층.filter((L) => 수(L, 62) < 0).length, 얼림 = 층.filter((L) => (수(L, 70) & 1) !== 0).length, 잠김 = 층.filter((L) => (수(L, 70) & 4) !== 0).length
  /* 글꼴 — 글꼴마다 쓰는 글 수(TEXT · MTEXT · ATTRIB · ATTDEF 의 7) */
  const 씀 = {}
  const 한글씀 = {}
  const 기호씀 = {}, 기호글자 = {}
  const 세기글 = (l) => {
    for (const e of l) {
      if (/^(TEXT|MTEXT|ATTRIB|ATTDEF)$/.test(e.t)) {
        const s = (값(e, 7) || 'STANDARD').toUpperCase()
        씀[s] = (씀[s] || 0) + 1
        const 글 = 풀린글(값(e, 1) + 모두(e, 3).join(''))
        if (/[\uac00-\ud7a3]/.test(글)) 한글씀[s] = (한글씀[s] || 0) + 1
        if (e.t !== 'MTEXT') {                                      /* 한 줄 글의 기호(MTEXT 는 캐드가 다른 글꼴로 메워 보여 줌) */
          const 기 = [...new Set([...글].filter(기호인가))]
          if (기.length) { 기호씀[s] = (기호씀[s] || 0) + 1; for (const c of 기) (기호글자[s] = 기호글자[s] || new Set()).add(c) }
        }
      }
      if (e.딸) 세기글(e.딸)
    }
  }
  세기글(D.도형); for (const b of D.블록) 세기글(b.도형 || [])
  const 글꼴 = (D.표.STYLE || []).filter((s) => (수(s, 70) & 1) === 0).map((s) => {
    const 키 = 값(s, 2).toUpperCase(), 이름 = 풀린글(값(s, 2)), 파일 = 값(s, 3), 큰 = 값(s, 4)
    const 이상 = []
    if (!파일) 이상.push('글꼴 파일 이름 없음')
    else if (/\.shx$/i.test(파일) || !/\./.test(파일)) { if (!흔한shx.test(파일.replace(/\.shx$/i, ''))) 이상.push('흔치 않은 SHX') }
    else if (/\.tt[fc]$/i.test(파일) && !윈도우글꼴.test(파일)) 이상.push(흔한ttf.test(파일) ? '윈도우 기본 글꼴 아님(한글 프로그램 · 따로 설치한 글꼴)' : '흔치 않은 TTF')
    if (큰 && !흔한shx.test(큰.replace(/\.shx$/i, ''))) 이상.push('흔치 않은 큰글꼴(한글 SHX)')
    const 한글 = 한글씀[키] || 0
    const shx = !!파일 && (/\.shx$/i.test(파일) || !/\./.test(파일))
    if (한글 && shx && !큰) 이상.push('한글 큰글꼴(SHX) 없음 — 한글이 «?» 로 보임')
    /* 2026-10-17 AutoCAD 2023 시험: romans + whgtxt 의 한 줄 글에서 «·» «※» 가 «?» 로 보임(한글 큰글꼴에 기호가 없음) → 맑은 고딕을 권함 */
    const 기호 = shx && 기호씀[키] ? { 수: 기호씀[키], 글자: [...기호글자[키]].slice(0, 6).join(' ') } : null
    if (기호) 이상.push(`기호(${기호.글자}) 든 글 ${기호.수}개 — SHX 글꼴에 없어 «?» 로 보일 수 있음`)
    const ac = (s.g.findIndex((p) => p[0] === 1001 && p[1] === 'ACAD'))
    const 가족 = ac >= 0 ? ((s.g.slice(ac + 1).find((p) => p[0] === 1000) || [])[1] || '') : ''
    const 글수 = 씀[키] || 0
    const 권함 = 이상.some((x) => !/^윈도우 기본 글꼴 아님/.test(x)) && 글수 ? (기호 ? 'malgun' : 권할글꼴(파일, 가족)) : ''
    return { 키, 이름, 파일, 큰, 가족, 글수, 한글수: 한글, 기호, 이상, 권함 }
  })
  /* 글 안 글꼴(\fArial|b0|i0|c0|p34; · \Fromans|c0;) */
  const 글안 = new Map()
  const 훑 = (l) => { for (const e of l) { if (e.t === 'MTEXT') for (const [k, v] of e.g) if (k === 1 || k === 3) for (const m of v.matchAll(/\\[fF]([^|;\\]+)[|;]/g)) 글안.set(m[1], (글안.get(m[1]) || 0) + 1); if (e.딸) 훑(e.딸) } }
  훑(D.도형); for (const b of D.블록) 훑(b.도형 || [])
  const 프록시 = (도형수.ACAD_PROXY_ENTITY || 0) + (블도형.ACAD_PROXY_ENTITY || 0)
  const 문제 = []
  if (풀린.깨짐.의심) 문제.push({ 급: '높', 글: `한글이 깨져 보일 수 있습니다 — 코드페이지 ${풀린.코드페이지 || '없음'} (CP949 로 읽으면 한글 ${풀린.깨짐.한글949}자)`, 고침: '한글' })
  const 이상글꼴 = 글꼴.filter((f) => f.이상.length && f.글수 > 0)
  if (이상글꼴.length) 문제.push({ 급: '중', 글: `없는 PC 에서 «?» 나 다른 글꼴로 보일 글꼴 ${이상글꼴.length}개 — ${이상글꼴.slice(0, 4).map((f) => `${f.이름}(${f.파일 || '이름 없음'}${f.큰 ? ' + ' + f.큰 : ''})`).join(', ')}${이상글꼴.length > 4 ? ' …' : ''}`, 고침: '글꼴' })
  if (글안.size) 문제.push({ 급: '낮', 글: `글 안에 박힌 글꼴 ${글안.size}가지(${[...글안.keys()].slice(0, 4).join(', ')}${글안.size > 4 ? ' …' : ''}) — 글꼴을 바꿔도 이 글들은 그대로일 수 있음`, 고침: '글안' })
  if (외부참조.length) 문제.push({ 급: '중', 글: `외부 참조(XREF) ${외부참조.length}개 — 그 파일이 없으면 비어 보임: ${외부참조.slice(0, 3).map((x) => x.이름).join(', ')}`, 고침: '' })
  if (그림참조.length) 문제.push({ 급: '낮', 글: `붙인 그림 ${그림참조.length}개 — 그림 파일을 같이 보내야 보임`, 고침: '' })
  if (프록시) 문제.push({ 급: '중', 글: `다른 프로그램(Civil 3D 등) 전용 도형 ${프록시}개 — 일반 캐드에서는 안 보이거나 상자로 보임`, 고침: '' })
  if (꺼짐 || 얼림) 문제.push({ 급: '낮', 글: `꺼진 층 ${꺼짐} · 얼린 층 ${얼림} — 안 보이는 선이 있음`, 고침: '' })
  if (풀린.판 >= 'AC1024') 문제.push({ 급: '낮', 글: `${판이름[풀린.판] || 풀린.판} 판 — 옛 캐드(AutoCAD 2009 이전 · 옛 캐디안 등)에서는 안 열릴 수 있음`, 고침: '판' })
  return {
    판: 풀린.판, 판이름: 판이름[풀린.판] || 풀린.판, 코드페이지: 풀린.코드페이지, 인코딩: 풀린.인코딩, 깨짐: 풀린.깨짐,
    단위: Number(머리(D, '$INSUNITS', 70) || 0), 도형수, 블록도형수: 블도형, 블록수: 블록.length, 외부참조, 그림참조,
    층: { 수: 층.length, 꺼짐, 얼림, 잠김 }, 글꼴, 글안글꼴: [...글안].map(([이름, 수]) => ({ 이름, 수 })), 배치도형수: 배치, 프록시, 문제,
  }
}

/** SHX(한글 큰글꼴 whgtxt 등)에 없을 기호 — ASCII · 한글 음절 · 도면에 흔한 ° ± Ø ⌀ 밖의 글자 */
export function 기호인가(c) {
  const u = c.codePointAt(0)
  if (u < 0x7f || (u >= 0xac00 && u <= 0xd7a3)) return false
  if (u === 0xb0 || u === 0xb1 || u === 0xd8 || u === 0xf8 || u === 0x2300 || u === 0x2205 || u === 0x3000) return false
  return u > 0x9f
}

/* TTF 가족 이름 → 파일 */
const 가족파일 = [
  [/^(맑은\s*고딕|malgun\s*gothic)$/i, 'malgun.ttf'], [/^(맑은\s*고딕\s*semilight|malgun\s*gothic\s*semilight)$/i, 'malgunsl.ttf'],
  [/^(굴림|굴림체|돋움|돋움체|gulim|gulimche|dotum|dotumche)$/i, 'gulim.ttc'], [/^(바탕|바탕체|궁서|궁서체|batang|batangche|gungsuh|gungsuhche)$/i, 'batang.ttc'],
  [/^arial$/i, 'arial.ttf'], [/^times\s*new\s*roman$/i, 'times.ttf'], [/^tahoma$/i, 'tahoma.ttf'], [/^(microsoft\s*sans\s*serif)$/i, 'micross.ttf'],
]
/** TTF 가족 이름 → 글꼴 파일. 윈도우에 늘 있는 글꼴(맑은 고딕 · 굴림 · 돋움 · 바탕 · 궁서 · Arial …)이면 그 파일,
 *  아니면(나눔고딕 · 모르는 글꼴) 맑은 고딕 — 2026-10-17 AutoCAD 2023 시험: 나눔고딕이 없는 PC 에서 «NanumGothic.ttf» 로 채운 글이 «???» 로 보임 */
export function 가족글꼴파일(가족) {
  for (const [re, f] of 가족파일) if (re.test(String(가족 || '').trim())) return f
  return 가족 ? 'malgun.ttf' : ''
}
export const 윈도우글꼴 = /^(malgun|malgunbd|malgunsl|gulim|batang|gungsuh|arial\w*|times\w*|tahoma\w*|verdana\w*|calibri\w*|cambria\w*|consola\w*|cour\w*|georgia\w*|segoe\w*|micross|trebuc\w*|symbol|wingding\w*|simsun|msyh)(\.tt[fc])?$/i

/** 문제 있는 글꼴에 권할 것 — SHX 는 romans + whgtxt · 윈도우에 있는 글꼴(돋움 · 굴림 · 바탕 · 궁서 · 맑은 고딕)이면 같은 글꼴의 바른 파일 · 나머지는 맑은 고딕 */
export function 권할글꼴(파일, 가족) {
  if (파일 && (/\.shx$/i.test(파일) || !/\./.test(파일))) return 'shx'
  const 이름 = String(가족 || String(파일 || '').replace(/\.[^.]+$/, '')).trim()
  if (/^(돋움|돋움체|dotum|dotumche)$/i.test(이름)) return 'dotum'
  if (/^(굴림|굴림체|gulim|gulimche)$/i.test(이름)) return 'gulim'
  if (/^(바탕|바탕체|batang|batangche)$/i.test(이름)) return 'batang'
  if (/^(궁서|궁서체|gungsuh|gungsuhche)$/i.test(이름)) return 'gungsuh'
  return 'malgun'
}

/* ───────────────────────────── ④ 글꼴 · 글 안 글꼴 · 코드페이지 (그대로 고치기) */

export const 글꼴판 = {
  malgun: { 이름: '맑은 고딕 (TTF · 윈도우에 늘 있음)', 파일: 'malgun.ttf', 큰: '', 가족: 'Malgun Gothic' },
  gulim: { 이름: '굴림 (TTF)', 파일: 'gulim.ttc', 큰: '', 가족: 'Gulim' },
  dotum: { 이름: '돋움 (TTF)', 파일: 'gulim.ttc', 큰: '', 가족: 'Dotum' },
  batang: { 이름: '바탕 (TTF)', 파일: 'batang.ttc', 큰: '', 가족: 'Batang' },
  gungsuh: { 이름: '궁서 (TTF)', 파일: 'batang.ttc', 큰: '', 가족: 'Gungsuh' },
  shx: { 이름: 'romans + whgtxt (SHX · 한글 캐드 기본)', 파일: 'romans.shx', 큰: 'whgtxt.shx' },
  txt: { 이름: 'txt + whgtxt (SHX · 가장 가벼움)', 파일: 'txt.shx', 큰: 'whgtxt.shx' },
}

/**
 * 그대로 고치기 — 짝들을 고쳐 다시 씀
 * @param o { 글꼴: {스타일이름(대문자): 글꼴판키 | {파일, 큰}} | 모두: 글꼴판키, 글안: '그대로'|'지움'|'바꿈', 한글: '그대로'|'949'|'utf8' }
 * @returns { 짝, 바꾼: {글꼴, 글안, 머리} }
 */
export function 그대로고치기(짝, o = {}) {
  const 바꾼 = { 글꼴: 0, 빈글꼴: 0, 글안: 0, 머리: [] }
  /* STYLE 기록 자리들 [시작, 끝) — 0 STYLE … 다음 0 앞 */
  const 자리 = []
  let 표안 = ''
  for (let i = 0; i < 짝.length; i++) {
    if (짝[i][0] !== 0) continue
    const v = 짝[i][1]
    if (v === 'TABLE' && 짝[i + 1] && 짝[i + 1][0] === 2) 표안 = 짝[i + 1][1]
    else if (v === 'ENDTAB' || v === 'ENDSEC') 표안 = ''
    if (표안 === 'STYLE' && v === 'STYLE') { let j = i + 1; while (j < 짝.length && 짝[j][0] !== 0) j++; 자리.push([i, j]) }
  }
  const 바꿀 = new Map()   // 시작 → 새 짝들(그 기록 전체)
  for (const [시, 끝] of 자리) {
    const 기록 = 짝.slice(시, 끝).map((p) => [p[0], p[1]])
    const 찾 = (c) => 기록.findIndex((p) => p[0] === c)
    const 이름 = (기록[찾(2)] || [2, ''])[1]
    const 꼴 = Number((기록[찾(70)] || [70, 0])[1]) || 0
    if (꼴 & 1) {                                            /* 모양(shape) 파일 기록 — 이름은 비어야 AutoCAD 가 엶(«SHAPE|REF» 처럼 이름이 있으면 «도면이 취소됨») */
      const ni = 찾(2)
      if (ni >= 0 && 기록[ni][1]) { 기록[ni][1] = ''; 바꾼.모양이름 = (바꾼.모양이름 || 0) + 1; 바꿀.set(시, { 끝, 기록 }) }
      continue
    }
    if (!이름) continue
    const 고름 = (o.글꼴 && o.글꼴[이름.toUpperCase()]) || o.모두
    const 판 = typeof 고름 === 'string' ? 글꼴판[고름] : 고름
    const ac = 기록.findIndex((p) => p[0] === 1001 && p[1] === 'ACAD')
    let 고침 = false
    if (판 && 판.파일 !== undefined) {
      const fi = 찾(3), bi = 찾(4)
      if (fi >= 0) { if (기록[fi][1] !== 판.파일) { 기록[fi][1] = 판.파일; 바꾼.글꼴++; 고침 = true } } else { 기록.push([3, 판.파일]); 바꾼.글꼴++; 고침 = true }
      const bi2 = 찾(4)
      if (bi2 >= 0) 기록[bi2][1] = 판.큰 || ''
      else if (판.큰) 기록.splice(찾(3) + 1, 0, [4, 판.큰])
      void bi
      /* 꼬리(ACAD 1000 = TTF 가족 이름) — TTF 면 새 가족 이름 · SHX 면 꼬리를 지움(남아 있으면 캐드가 옛 TTF 를 찾음) */
      if (ac >= 0) {
        if (/\.tt[fc]$/i.test(판.파일)) { for (let k = ac + 1; k < 기록.length && 기록[k][0] !== 1001; k++) if (기록[k][0] === 1000) { 기록[k][1] = 판.가족 || 판.이름.replace(/\s*\(.*$/, ''); break } }
        else { let k = ac + 1; while (k < 기록.length && 기록[k][0] !== 1001) k++; 기록.splice(ac, k - ac) }
      }
      고침 = true
    } else if (o.빈글꼴 !== false) {
      /* 글꼴 파일 이름이 비고 꼬리에 TTF 가족 이름만 있음(DWG 바꾸기에서 흔함) → 파일 이름 채움 */
      const fi = 찾(3)
      const 가족 = ac >= 0 ? ((기록.slice(ac + 1).find((p) => p[0] === 1000) || [])[1] || '') : ''
      const f = 가족 ? 가족글꼴파일(가족) : ''
      if (f && (fi < 0 || !기록[fi][1])) { if (fi >= 0) 기록[fi][1] = f; else 기록.push([3, f]); 바꾼.빈글꼴++; 고침 = true }
    }
    if (고침) 바꿀.set(시, { 끝, 기록 })
  }
  let 새 = 짝
  if (바꿀.size) {
    새 = []
    for (let i = 0; i < 짝.length;) {
      const b = 바꿀.get(i)
      if (b) { for (const p of b.기록) 새.push(p); i = b.끝; continue }
      새.push([짝[i][0], 짝[i][1]]); i++
    }
  } else 새 = 짝.map((p) => [p[0], p[1]])
  /* 글 안 글꼴 */
  if (o.글안 && o.글안 !== '그대로') {
    let mtext = false
    for (let i = 0; i < 새.length; i++) {
      const [c, v] = 새[i]
      if (c === 0) { mtext = v === 'MTEXT'; continue }
      if (!mtext || (c !== 1 && c !== 3)) continue
      const 전 = v
      const 후 = o.글안 === '지움' ? v.replace(/\\[fF][^;\\]*;/g, '') : v.replace(/\\([fF])[^|;\\]*([|;])/g, (_, f, e) => `\\${f}${o.글안이름 || 'Malgun Gothic'}${e}`)
      if (후 !== 전) { 새[i][1] = 후; 바꾼.글안++ }
    }
  }
  /* 한글(코드페이지) */
  if (o.한글 === '949') { 머리바꿈(새, '$DWGCODEPAGE', 3, 'ANSI_949'); 바꾼.머리.push('$DWGCODEPAGE = ANSI_949') }
  return { 짝: 새, 바꾼 }
}
/** 머리 변수 값 바꾸기(없으면 HEADER 끝에 넣음) */
export function 머리바꿈(짝, 이름, 코드, 새값) {
  let 머리끝 = -1, 머리안 = false
  for (let i = 0; i < 짝.length; i++) {
    if (짝[i][0] === 0 && 짝[i][1] === 'SECTION' && 짝[i + 1] && 짝[i + 1][1] === 'HEADER') 머리안 = true
    if (머리안 && 짝[i][0] === 0 && 짝[i][1] === 'ENDSEC') { 머리끝 = i; break }
    if (머리안 && 짝[i][0] === 9 && 짝[i][1] === 이름) { 짝[i + 1] = [코드, 새값]; return }
  }
  if (머리끝 >= 0) 짝.splice(머리끝, 0, [9, 이름], [코드, 새값])
}

/** 짝들 → 글(코드는 오른쪽 맞춤 3칸 · 줄 끝 \r\n) */
export function 짝글(짝) {
  const out = new Array(짝.length * 2)
  for (let i = 0; i < 짝.length; i++) {
    const c = 짝[i][0]
    out[i * 2] = c < 10 ? '  ' + c : c < 100 ? ' ' + c : String(c)
    out[i * 2 + 1] = 짝[i][1]
  }
  return out.join('\r\n') + '\r\n'
}

/**
 * 그대로 고친 짝 → 바이트 (판은 그대로 · 한글=utf8 이면 2007 판으로 올리고 UTF-8)
 */
export function 그대로싸기(짝, 판, o = {}) {
  let 새판 = 판
  if (o.한글 === 'utf8' && 판 < 'AC1021') { 새판 = 'AC1021'; 머리바꿈(짝, '$ACADVER', 1, 'AC1021') }
  const 인코딩 = 새판 >= 'AC1021' ? 'utf-8' : 'euc-kr'
  /* 옛 판으로 싸면서 \U+ 는 그대로 · 2007 판 이상으로 싸면 \U+ 를 글자로 */
  if (인코딩 === 'utf-8') for (const p of 짝) if (typeof p[1] === 'string' && p[1].indexOf('\\U+') >= 0 && (p[0] === 1 || p[0] === 3 || p[0] === 2 || p[0] === 8 || p[0] === 7)) p[1] = 풀린글(p[1])
  return 싸기(짝글(짝), 인코딩)
}
