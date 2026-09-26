/* 🔁 DWG → DXF 바꾸기 — 판 알아보기 · 레이어 켜짐/꺼짐 바로잡기 (2026-09-26)
 *
 * 소장님: 「도면을 dxf 전환해주는 도구도 만들어 줘」 · 「캐드 파일을 드래그 하면 dxf로 만들어 주는 도구를 만들 수 있어? 그래서 다운 받게 해줘」
 *
 * 변환 자체는 공개 프로그램 LibreDWG(GPL-3.0)를 브라우저용으로 구운 libredwg-web(GPL-3.0)이 합니다 → dwgdxf.worker.js
 * 이 파일은 그 결과를 «고쳐서» 내보내는 부분입니다. 워커 안에서 함께 돌므로 이 파일도 GPL-3.0 으로 공개합니다.
 *
 * 🚨 2026-09-26 시험에서 잡은 것 — LibreDWG 의 DXF 쓰기는 **레이어를 전부 «꺼짐»(색 번호 음수)** 으로 적습니다.
 *    소장님 도면 8장 모두 그랬습니다(09. 상수도 이설평면도는 실제로 6개만 꺼져 있는데 194개 전부 꺼짐).
 *    그대로 두면 캐드·도면 PDF 에서 «빈 도면» 으로 열립니다.
 *    → 같은 엔진으로 DWG 를 한 번 더 읽어 레이어마다 진짜 켜짐/꺼짐을 알아낸 뒤,
 *      DXF 의 LAYER 표에서 색 번호(62) 부호만 바로잡습니다. 다른 글자는 한 바이트도 건드리지 않습니다.
 *      (옛 판 DXF 는 한글이 CP949 라서, 글을 풀었다 다시 싸면 깨질 수 있습니다 — 그래서 바이트로만 고칩니다)
 */

/** DWG 머리 6글자 → 캐드 판 */
export const 판표 = {
  AC1009: 'R12', AC1012: 'R13', AC1014: 'R14', AC1015: '2000', AC1018: '2004',
  AC1021: '2007', AC1024: '2010', AC1027: '2013', AC1032: '2018',
}

/** 파일 앞머리로 DWG 인지 · 몇 년 판인지 */
export function 판읽기(bytes) {
  const u = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  if (u.length < 6) return { dwg: false }
  const s = String.fromCharCode(...u.subarray(0, 6))
  if (!/^AC\d{4}$/.test(s)) return { dwg: false, 머리: s }
  return { dwg: true, 머리: s, 판: 판표[s] || s }
}

/** 판에 따라 DXF 안의 글자 인코딩 — 2007 판부터 UTF-8, 그 전은 도면의 코드페이지(한글 = CP949) */
export function dxf글꼴(머리) {
  return 머리 >= 'AC1021' ? 'utf-8' : 'euc-kr'
}

const 줄끝 = 0x0a, 캐리지 = 0x0d

/* 바이트 배열을 «줄» 로 — [시작, 끝(줄바꿈 앞, \r 제외)] */
function* 줄들(u, 부터, 까지) {
  let i = 부터
  while (i < 까지) {
    let j = u.indexOf(줄끝, i)
    if (j < 0 || j > 까지) j = 까지
    let e = j
    if (e > i && u[e - 1] === 캐리지) e--
    yield [i, e, j + 1]
    i = j + 1
  }
}

const 아스키 = (u, a, b) => { let s = ''; for (let i = a; i < b; i++) s += String.fromCharCode(u[i]); return s }

/**
 * LAYER 표의 62(색 번호) 부호를 진짜 켜짐/꺼짐에 맞춥니다.
 * @param {Uint8Array} dxf  LibreDWG 가 쓴 DXF 바이트
 * @param {Map<string,{off:boolean}>} 레이어  DWG 에서 읽은 레이어(이름 → 꺼짐). 대문자 이름으로도 찾습니다.
 * @param {string} 글꼴  'utf-8' | 'euc-kr'
 * @returns {{ bytes: Uint8Array, 레이어수: number, 켬: number, 끔: number, 고침: number, 모름: string[] }}
 */
export function 레이어고치기(dxf, 레이어, 글꼴 = 'utf-8') {
  const u = dxf
  const 풀기 = new TextDecoder(글꼴)
  const 찾기 = new Map()
  for (const [k, v] of 레이어 || []) { 찾기.set(k, v); 찾기.set(String(k).toUpperCase(), v) }

  /* 1) LAYER 표의 바이트 범위 — 「0/TABLE, 2/LAYER」 부터 「0/ENDTAB」 까지 (앞쪽 TABLES 안에 있으므로 금방 찾습니다) */
  let 표시작 = -1, 표끝 = -1
  let 앞코드 = null, 앞앞 = null
  let 짝 = 0, 코드 = null
  for (const [a, e, 다음] of 줄들(u, 0, u.length)) {
    if (짝 % 2 === 0) { 코드 = 아스키(u, a, e).trim() }
    else {
      const 값 = e - a < 16 ? 아스키(u, a, e).trim() : ''
      if (표시작 < 0) {
        if (코드 === '2' && 값 === 'LAYER' && 앞코드 === '0' && 앞앞 === 'TABLE') 표시작 = 다음
        if (코드 === '0' && 값 === 'ENTITIES') break   // 표가 없으면 그만
      } else if (코드 === '0' && 값 === 'ENDTAB') { 표끝 = a; break }
      앞코드 = 코드; 앞앞 = 값
    }
    짝++
  }
  const 빈결과 = { bytes: u, 레이어수: 0, 켬: 0, 끔: 0, 고침: 0, 모름: [] }
  if (표시작 < 0 || 표끝 < 0) return 빈결과

  /* 2) 표 안을 레코드(0/LAYER)마다 — 이름(2)과 색(62) 줄 위치를 모아 둡니다 */
  const 레코드 = []
  let 지금 = null
  짝 = 0
  for (const [a, e] of 줄들(u, 표시작, 표끝)) {
    if (짝 % 2 === 0) 코드 = 아스키(u, a, e).trim()
    else if (코드 === '0') { 지금 = { 이름: null, 색: null }; 레코드.push(지금) }
    else if (지금 && 코드 === '2' && 지금.이름 == null) 지금.이름 = 풀기.decode(u.subarray(a, e))
    else if (지금 && 코드 === '62' && 지금.색 == null) 지금.색 = [a, e, Number(아스키(u, a, e).trim())]
    짝++
  }

  /* 3) 부호를 정하고, 바뀌는 줄만 바꿔 끼워 새 배열을 만듭니다 */
  const 바꿈 = []   // [시작, 끝, 새 글자]
  let 켬 = 0, 끔 = 0
  const 모름 = []
  for (const r of 레코드) {
    if (!r.색 || !Number.isFinite(r.색[2])) continue
    const 알 = 찾기.get(r.이름) || 찾기.get(String(r.이름 || '').toUpperCase())
    /* 모르는 레이어(엔진이 새로 만든 Defpoints 등)는 «켜짐» — 버그로 전부 꺼짐이 되니, 켜 두는 쪽이 안전합니다 */
    const 꺼짐 = 알 ? !!알.off : false
    if (!알 && r.이름 && !/^defpoints$/i.test(r.이름)) 모름.push(r.이름)
    const 절대 = Math.abs(r.색[2]) || 7
    const 새값 = 꺼짐 ? -절대 : 절대
    꺼짐 ? 끔++ : 켬++
    if (새값 !== r.색[2]) {
      /* 원래 줄의 앞 칸(오른쪽 맞춤 공백)은 없애고 숫자만 — DXF 는 값 앞뒤 공백을 무시합니다 */
      바꿈.push([r.색[0], r.색[1], String(새값)])
    }
  }
  if (!바꿈.length) return { ...빈결과, 레이어수: 레코드.length, 켬, 끔, 모름 }

  let 늘 = 0
  for (const [a, e, s] of 바꿈) 늘 += s.length - (e - a)
  const out = new Uint8Array(u.length + 늘)
  let 읽은 = 0, 쓴 = 0
  for (const [a, e, s] of 바꿈) {
    out.set(u.subarray(읽은, a), 쓴); 쓴 += a - 읽은
    for (let i = 0; i < s.length; i++) out[쓴++] = s.charCodeAt(i)
    읽은 = e
  }
  out.set(u.subarray(읽은), 쓴)
  return { bytes: out, 레이어수: 레코드.length, 켬, 끔, 고침: 바꿈.length, 모름 }
}

/**
 * LibreDWG 가 쓴 DXF 를 AutoCAD 가 받아들이게 다듬습니다 — «빼기만» 합니다(보이는 선·글자는 그대로).
 *
 * 🚨 2026-09-26 소장님 PC 의 AutoCAD 2023 으로 하나씩 열어 보고 잡은 것
 *  ① 사전(DICTIONARY)의 «없는 물체를 가리키는 칸»
 *     05.편경사설치도: 원본 DWG 는 AUDIT 오류 4건, 바꾼 DXF 는 549건.
 *     549건 모두 «사전 칸이 가리키는 물체가 없음»(Civil 3D·Map 전용 물체 — 엔진이 DXF 에 못 씀)이었습니다.
 *     도면은 열리지만 AUDIT 를 돌리면 오류가 수백 건 떠서 걱정하시게 됩니다.
 *     → 파일 전체의 핸들(5·105)을 모은 뒤, OBJECTS 의 사전에서 없는 핸들을 가리키는 「3 이름 / 350·360 핸들」 두 짝을 뺍니다.
 *       (AutoCAD AUDIT 가 고치는 것과 같은 일 — 다듬은 뒤 AUDIT 0건, 원본보다 적음)
 *  ② 속성(ATTRIB·ATTDEF) 끝의 반쪽짜리 «AcDbXrecord» 묶음 — 2007 판 이상에서만 나옵니다
 *     계월 날개벽(2018 판): AutoCAD 가 「ATTRIB … 너무 이른 객체의 끝 — 유효하지 않은 DXF 입력, 도면이 취소됨」 으로 아예 못 열었습니다.
 *     엔진은 「100 AcDbXrecord / 280 0 / 70 1」 까지만 쓰는데, AutoCAD 는 그 뒤 칸들(70·70·340·10·40·2 …)을 더 기다립니다.
 *     AutoCAD 자신은 이 묶음을 보통 쓰지 않습니다(ezdxf 도 «실제 파일에서 본 적 없다» 고 적어 둠) → 묶음째 뺍니다.
 *     보이는 글자·위치·태그는 앞쪽 AcDbText·AcDbAttribute 에 그대로 있습니다.
 *  ③ 엔진이 틀리게 쓰는 물체(DIMASSOC 등) — 아래 «빼는물체» 참고
 *  ④ MTEXT 의 반쪽짜리 «101 Embedded Object» — 아래 설명 참고
 *  ⑤ SORTENTSTABLE 에 빠진 블록 핸들(330) — 이것만은 «끼워 넣기» 입니다
 *  ⑥ 16비트 칸의 넘치는 수 — «고쳐 쓰기»
 *  ⑦ 없는 핸들을 가리키는 확장 데이터 묶음
 *  ⑧ 1001 없는 1000번대 칸이 든 XRECORD · ⑨ 보통 도형의 대리 그림(proxy graphics)
 *  ⑩ 닫히지 않은 WIPEOUT·IMAGE 다각형 경계 · ⑪ 구조가 깨진 HATCH · ⑫ 맞춤점 없는 스플라인 경계의 접선 · ⑬ 치수 기울기(52) 자리 · ⑭ 회전 치수의 빠진 회전각(50) · ⑮ 빠진 치수 종류(70)
 *  ⑯ 여러 줄 속성의 반쪽 묶음 · ⑰ 빈 글자 스타일(7) · ⑱ 쪼개진 그림 파일 경로(IMAGEDEF 3+1)
 * @returns {{ bytes: Uint8Array, 뺌: number, 속성: number, 물체: number, 긴글: number, 순서표: number, 수: number, 꼬리: number }}
 */
export function 다듬기(u) {
  /* 줄 시작 위치를 한 번에 — 짝(코드, 값)은 줄 두 개. 75MB 도면이 850만 줄이라 보통 배열 대신 Uint32Array */
  let n = 1
  for (let p = u.indexOf(줄끝); p >= 0; p = u.indexOf(줄끝, p + 1)) n++
  const 시작 = new Uint32Array(n)
  let 줄수 = 0
  for (let i = 0; i < u.length;) {
    시작[줄수++] = i
    const j = u.indexOf(줄끝, i)
    if (j < 0) break
    i = j + 1
  }
  const 끝 = (k) => { // k 번째 줄의 내용 끝(\r·\n 앞)
    let e = k + 1 < 줄수 ? 시작[k + 1] - 1 : u.length
    if (e > 시작[k] && u[e - 1] === 캐리지) e--
    return e
  }
  const 코드 = (k) => { // 짧은 숫자 줄만 읽습니다
    let v = 0, 본 = false
    for (let p = 시작[k], e = 끝(k); p < e; p++) {
      const c = u[p]
      if (c === 0x20 || c === 0x09) continue
      if (c < 0x30 || c > 0x39) return -1
      v = v * 10 + (c - 0x30); 본 = true
    }
    return 본 ? v : -1
  }
  const 값글 = (k) => 아스키(u, 시작[k], 끝(k)).trim().toUpperCase()

  const 짧은값 = (k, n) => 끝(k) - 시작[k] <= n ? 값글(k) : ''

  /* ⑥ 16비트 칸에 16비트를 넘는 수 — 엔진이 부호 없는 수(예: 65529)나 색 방식이 붙은 수(-1056964608)를 그대로 씁니다.
        13.토출부(2018): AutoCAD 「확장 데이터는 읽을 수 없음 — 도면이 취소됨」 (레이어 확장 데이터 1070 = 65529).
        → 1070 등 16비트 칸은 16비트로 되돌리고(65529 → -7), 치수 색(176·177·178)은 «블록별 0 · 도면층별 256 · 번호» 로 풉니다. */
  const 바꿈 = []   // [시작, 끝, 새 바이트]
  const 열여섯 = (c) => (c >= 60 && c <= 79) || (c >= 170 && c <= 179) || (c >= 270 && c <= 289) || (c >= 370 && c <= 389) || (c >= 400 && c <= 409) || (c >= 1060 && c <= 1070)
  let 수고침 = 0
  const 수보기 = (k, c) => {
    if (끝(k) - 시작[k] < 5) return
    const v = Number(아스키(u, 시작[k], 끝(k)).trim())
    if (!Number.isInteger(v) || (v >= -32768 && v <= 32767)) return
    let w
    if (c >= 176 && c <= 178) {
      const m = (v >>> 24) & 0xff
      w = m === 0xc1 ? 0 : m === 0xc3 ? (v & 0xff) : 256
    } else w = (v << 16) >> 16
    const t = String(w)
    const b = new Uint8Array(t.length)
    for (let i = 0; i < t.length; i++) b[i] = t.charCodeAt(i)
    바꿈.push([시작[k], 끝(k), b])
    수고침++
  }

  /* 1) 있는 핸들 모으기 + OBJECTS 자리 + 속성의 반쪽 AcDbXrecord 묶음(②) */
  const 있음 = new Set()
  const 뺄 = []   // [시작 바이트, 끝 바이트] — 앞에서부터 차례로 쌓입니다(②는 모두 OBJECTS 앞, ①은 OBJECTS 안)
  let 물체부터 = -1, 속성 = false, 속성뺌 = 0, 긴글 = false, 긴글뺌 = 0, 표있음 = false, 종류 = '', 서브 = '', 대리뺌 = 0
  /* ⑩ WIPEOUT·IMAGE 의 다각형 자르기 경계(71=2)가 닫혀 있지 않음(첫 점 ≠ 끝 점)
        09.상수도(2004)·13.토출부(2018): AutoCAD 「WIPEOUT 시작 행 … 확장 데이터는 읽을 수 없음 — 도면이 취소됨」.
        대리 그림(⑨)을 빼도 그대로였고, 다른 것은 AutoCAD 가 쓰는 WIPEOUT 과 순서까지 같았습니다.
        엔진은 네모 경계를 점 4개로만 씁니다. AutoCAD 는 다각형 경계의 끝 점이 첫 점과 같아야 합니다(ezdxf 도 «안 닫으면 AutoCAD 가 죽는다» 며 닫음).
        → 끝에 첫 점을 한 번 더 붙이고(14/24) 점 개수(91)를 하나 늘립니다. */
  let 틀 = null, 틀닫음 = 0
  const 속성꼬리 = new Set([48, 60, 370, 8, 6, 62, 420, 440, 101])
  const 줄끝글 = 줄수 > 1 && 시작[1] >= 2 && u[시작[1] - 2] === 캐리지 ? '\r\n' : '\n'
  const 바이트 = (t) => { const b = new Uint8Array(t.length); for (let i = 0; i < t.length; i++) b[i] = t.charCodeAt(i); return b }
  const 틀닫기 = () => {
    const f = 틀; 틀 = null
    if (!f || f.형 !== 2 || f.점수 < 3 || f.개수 < 0 || f.뒤 < 0 || !f.첫 || !f.끝) return
    const 같다 = (a, b) => Math.abs(Number(a) - Number(b)) <= 1e-9 * Math.max(1, Math.abs(Number(a)))
    if (같다(f.첫[0], f.끝[0]) && 같다(f.첫[1], f.끝[1])) return
    바꿈.push([시작[f.개수], 끝(f.개수), 바이트(String(f.점수 + 1))])
    바꿈.push([f.뒤, f.뒤, 바이트(' 14' + 줄끝글 + f.첫[0] + 줄끝글 + ' 24' + 줄끝글 + f.첫[1] + 줄끝글)])
    틀닫음++
  }

  /* ⑪ 반쪽짜리 HATCH — 13.토출부(2018): AutoCAD 「HATCH 시작 행 … 오류: 그룹 코드 72가 예상됨 — 도면이 취소됨」.
        엔진이 경계 모서리 18개 가운데 1개만 쓰고 끝낸 해치가 있었습니다(무늬·씨앗점 칸도 없음).
        → 해치의 경계 구조를 DXF 규칙대로 따라가 보고, 어긋나면 그 해치만 뺍니다(원래도 깨져 있던 해치입니다). */
  let 해치 = null, 해치뺌 = 0, 접선뺌 = 0, 치수 = { 각: false, 표시: -1, 형: true }, 치수넣음 = 0
  const 머리판 = (/\$ACADVER\s*\r?\n\s*1\s*\r?\n\s*(AC\d{4})/.exec(아스키(u, 0, Math.min(u.length, 600))) || [])[1] || ''
  const 맞춤점있음 = 머리판 >= 'AC1024'
  const 해치맞나 = (k0, kEnd, 접선뺄) => {
    let k = k0
    const 값 = () => Number(아스키(u, 시작[k + 1], 끝(k + 1)).trim())
    const 기대 = (c) => { if (k >= kEnd || 코드(k) !== c) throw 0; const v = 값(); k += 2; return v }
    const 선택 = (c) => { if (k < kEnd && 코드(k) === c) { const v = 값(); k += 2; return v } return null }
    try {
      기대(10); 기대(20); 선택(30); 선택(210); 선택(220); 선택(230)
      if (코드(k) !== 2) return false
      k += 2
      const 채움 = 기대(70); 기대(71)
      const 경계수 = 기대(91)
      for (let p = 0; p < 경계수; p++) {
        const f = 기대(92)
        if (f & 2) {
          const 볼록 = 기대(72); 기대(73); const n = 기대(93)
          for (let i = 0; i < n; i++) { 기대(10); 기대(20); if (볼록) 선택(42) }
        } else {
          const n = 기대(93)
          for (let e = 0; e < n; e++) {
            const t = 기대(72)
            if (t === 1) { 기대(10); 기대(20); 기대(11); 기대(21) }
            else if (t === 2) { 기대(10); 기대(20); 기대(40); 기대(50); 기대(51); 기대(73) }
            else if (t === 3) { 기대(10); 기대(20); 기대(11); 기대(21); 기대(40); 기대(50); 기대(51); 기대(73) }
            else if (t === 4) {
              기대(94); 기대(73); 기대(74)
              const nk = 기대(95), nc = 기대(96)
              for (let i = 0; i < nk; i++) 기대(40)
              for (let i = 0; i < nc; i++) { 기대(10); 기대(20); 선택(42) }
              if (맞춤점있음) {   // 2010 판부터 스플라인 모서리에 맞춤점(97)·접선(12·13)이 붙습니다 — 그 전 판의 97 은 경계의 «원본 개수»
                const nf = 기대(97)
                for (let i = 0; i < nf; i++) { 기대(11); 기대(21) }
                /* ⑫ 맞춤점이 0개인데 접선(12/22 · 13/23)을 쓰면 AutoCAD 는 그 자리에서 «원본 개수 97» 을 기다립니다.
                      13.토출부: 「HATCH … 오류: 그룹 코드 97가 예상됨 — 도면이 취소됨」 → 맞춤점이 없으면 접선 네 칸을 뺍니다 */
                const 접선시작 = k
                선택(12); 선택(22); 선택(13); 선택(23)
                if (nf === 0 && k > 접선시작 && 접선뺄) 접선뺄.push([시작[접선시작], 시작[k]])
              }
            } else return false
          }
        }
        const ns = 기대(97)
        for (let i = 0; i < ns; i++) 기대(330)
      }
      기대(75); 기대(76)
      if (!채움) {
        기대(52); 기대(41); 기대(77)
        const nl = 기대(78)
        for (let i = 0; i < nl; i++) { 기대(53); 기대(43); 기대(44); 기대(45); 기대(46); const nd = 기대(79); for (let j = 0; j < nd; j++) 기대(49) }
      }
      선택(47)
      const nseed = 기대(98)
      for (let i = 0; i < nseed; i++) { 기대(10); 기대(20) }
      return true
    } catch (e) { return false }
  }
  const 해치끝 = (k) => {   // k = 해치 다음 물체의 0 줄
    const h = 해치; 해치 = null
    if (!h || h.몸 < 0) return
    let 끝줄 = k
    for (let j = h.몸; j < k; j += 2) if (코드(j) === 1001) { 끝줄 = j; break }
    const 접선 = []
    if (해치맞나(h.몸, 끝줄, 접선)) { for (const r of 접선) 뺄.push(r); 접선뺌 += 접선.length; return }
    뺄.push([h.시작, 시작[k]])
    if (h.핸들) 있음.delete(h.핸들)
    해치뺌++
  }
  const 묶음칸 = new Set([280, 70, 340, 10, 20, 30, 40, 2])
  for (let k = 0; k + 1 < 줄수; k += 2) {
    const c = 코드(k)
    if (틀 && c > 0) {   // ⑩ WIPEOUT·IMAGE 의 다각형 경계 — 아래 틀닫기 참고
      if (c === 71) 틀.형 = Number(아스키(u, 시작[k + 1], 끝(k + 1)).trim())
      else if (c === 91) 틀.개수 = k + 1
      else if (c === 14) { 틀.x = 아스키(u, 시작[k + 1], 끝(k + 1)).trim(); if (틀.첫 == null) 틀.첫x = 틀.x }
      else if (c === 24) { 틀.y = 아스키(u, 시작[k + 1], 끝(k + 1)).trim(); if (틀.첫 == null) { 틀.첫 = [틀.첫x, 틀.y] } 틀.끝 = [틀.x, 틀.y]; 틀.점수++; 틀.뒤 = k + 2 < 줄수 ? 시작[k + 2] : u.length }
    }
    if (c === 70 && 서브 === 'ACDBDIMENSION') 치수.형 = true
    if (속성 && (서브 === 'ACDBATTRIBUTE' || 서브 === 'ACDBATTRIBUTEDEFINITION') && 속성꼬리.has(c)) {
      /* ⑯ 여러 줄 속성(ATTDEF·ATTRIB + 「101 Embedded Object」) — 13.토출부: 「ATTDEF … 잘못된 도면요소 도면층 — 도면이 취소됨」.
            엔진이 속성 칸 뒤에 도형 공통 칸(48·60·370·빈 8)을 한 번 더 쓰고, 여러 줄 글자 묶음을 반쪽만 씁니다.
            → 그 뒤를 확장 데이터(1001) 앞까지 빼서 «한 줄 속성» 으로 둡니다(태그·값·위치는 앞쪽에 그대로). */
      let m = k
      while (m + 1 < 줄수) { const cm = 코드(m); if (cm === 0 || cm === 1001) break; m += 2 }
      뺄.push([시작[k], m < 줄수 ? 시작[m] : u.length])
      속성뺌++
      k = m - 2
      continue
    }
    if (c === 7 && 종류 && 끝(k + 1) - 시작[k + 1] <= 0) {   // ⑰ 빈 글자 스타일(7) — 없으면 Standard 로 읽습니다
      뺄.push([시작[k], k + 2 < 줄수 ? 시작[k + 2] : u.length])
      continue
    }
    if (c > 0 && 열여섯(c)) { 수보기(k + 1, c); continue }
    if (c === 50 && 서브 === 'ACDBALIGNEDDIMENSION') 치수.각 = true
    else if (c === 52 && 서브 === 'ACDBALIGNEDDIMENSION') {
      /* ⑬ 치수의 기울기(52)가 엉뚱한 칸에 — 13.토출부: 「AcDbRotatedDimension … 예상치 않은 DXF 그룹 코드: 52 — 도면이 취소됨」.
            52 는 AcDbDimension 칸의 것인데 엔진은 AcDbAlignedDimension 칸에 씁니다(ezdxf 도 AcDbDimension 에 씀).
            → 여기서 빼고, 0 이 아니면 AcDbAlignedDimension 표시 바로 앞(= AcDbDimension 칸의 끝)으로 옮깁니다. */
      const 값 = 아스키(u, 시작[k + 1], 끝(k + 1)).trim()
      뺄.push([시작[k], k + 2 < 줄수 ? 시작[k + 2] : u.length])
      if (Number(값) !== 0 && 치수.표시 >= 0) 바꿈.push([치수.표시, 치수.표시, 바이트(' 52' + 줄끝글 + 값 + 줄끝글)])
      치수넣음++
      continue
    }
    if (c === 100) {
      const 새 = 짧은값(k + 1, 32)
      if (새 === 'ACDBROTATEDDIMENSION' && 서브 === 'ACDBALIGNEDDIMENSION' && !치수.각) {
        /* ⑭ 회전 치수에 회전각 50 이 없음 — 엔진은 0 이면 안 씁니다. ezdxf 처럼 늘 적어 둡니다(「50 / 0.0」) */
        바꿈.push([시작[k], 시작[k], 바이트(' 50' + 줄끝글 + '0.0' + 줄끝글)])
      }
      if (서브 === 'ACDBDIMENSION' && 새 !== 'ACDBDIMENSION' && !치수.형) {
        /* ⑮ 치수 종류(70)가 없음 — 엔진은 0(회전 치수)이면 안 씁니다. AutoCAD·ezdxf 는 늘 적습니다 → 「70 / 0」 */
        바꿈.push([시작[k], 시작[k], 바이트(' 70' + 줄끝글 + '     0' + 줄끝글)])
        치수.형 = true
      }
      서브 = 새
      if (해치 && 서브 === 'ACDBHATCH') 해치.몸 = k + 2
      if (서브 === 'ACDBDIMENSION') 치수 = { 각: false, 표시: -1, 형: false }
      if (서브 === 'ACDBALIGNEDDIMENSION') 치수 = { ...치수, 각: false, 표시: 시작[k] }
    }
    if (c === 5 || c === 105) { 있음.add(값글(k + 1)); if (해치 && !해치.핸들) 해치.핸들 = 값글(k + 1) }
    else if ((c === 92 || c === 160) && 서브 === 'ACDBENTITY' && 종류 !== 'ACAD_PROXY_ENTITY' && 종류 !== 'MULTILEADER') {
      /* ⑨ 보통 도형에 붙은 «대리 그림»(proxy graphics: 92/160 바이트 수 + 310 덩어리)
            09.상수도(2004): AutoCAD 「WIPEOUT 시작 행 … 확장 데이터는 읽을 수 없음 — 도면이 취소됨」. 13.토출부(2018)도 같은 WIPEOUT.
            엔진이 WIPEOUT 에 대리 그림을 색(62)보다 앞에 끼워 씁니다. AutoCAD 는 WIPEOUT 을 스스로 그리므로 대리 그림이 필요 없습니다 → 뺍니다.
            (진짜 대리 도형 ACAD_PROXY_ENTITY · 옛 판의 MULTILEADER 는 그 그림이 곧 모양이라 그대로 둡니다) */
      let m = k + 2
      while (m + 1 < 줄수 && 코드(m) === 310) m += 2
      뺄.push([시작[k], m < 줄수 ? 시작[m] : u.length])
      대리뺌++
      k = m - 2
    }
    else if (c === 0) {
      틀닫기()
      해치끝(k)
      const t = 짧은값(k + 1, 24)
      if (t === 'HATCH') 해치 = { 시작: 시작[k], 몸: -1, 핸들: '' }
      종류 = t; 서브 = ''
      틀 = (t === 'WIPEOUT' || t === 'IMAGE') ? { 형: 0, 개수: -1, 첫: null, 끝: null, 점수: 0, 뒤: -1 } : null
      속성 = t === 'ATTRIB' || t === 'ATTDEF'
      긴글 = t === 'MTEXT'
      if (t === 'ACAD_TABLE') 표있음 = true
      if (t === 'EOF') break
    } else if (c === 2 && k >= 2 && 코드(k - 2) === 0 && 짧은값(k + 1, 8) === 'OBJECTS' && 짧은값(k - 1, 8) === 'SECTION') { 물체부터 = k + 2; break }
    else if (긴글 && c === 101 && 짧은값(k + 1, 20) === 'EMBEDDED OBJECT') {
      /* ④ MTEXT 의 「101 Embedded Object」(단 나누기 정보) — 엔진이 반쪽만 씁니다.
            계월 날개벽(2018): 열리기는 하지만 AUDIT 에서 «AcDbMText … 복구되지 않았습니다» 71건.
            단(column)을 안 쓰는 보통 글자에는 없어도 되는 묶음이라 통째로 뺍니다(글자·위치·크기는 앞쪽 AcDbMText 에 그대로). */
      let m = k + 2
      while (m + 1 < 줄수) { const cm = 코드(m); if (cm === 0 || cm === 1001 || cm === 102) break; m += 2 }
      뺄.push([시작[k], m < 줄수 ? 시작[m] : u.length])
      긴글뺌++
      k = m - 2
    }
    else if (속성 && c === 100 && 짧은값(k + 1, 16) === 'ACDBXRECORD') {
      let m = k + 2
      while (m + 1 < 줄수 && 묶음칸.has(코드(m))) m += 2
      뺄.push([시작[k], m < 줄수 ? 시작[m] : u.length])
      속성뺌++
      k = m - 2
    }
  }
  /* OBJECTS 안의 핸들도 모아야 사전 칸을 가릴 수 있습니다.
     ③ 엔진이 틀리게 쓰는 물체는 통째로 뺍니다(뺀 것의 핸들은 «없음» 으로 쳐서, 그것을 가리키는 사전 칸도 ①에서 빠집니다)
        · DIMASSOC(치수 연관) — 계월 날개벽(2018): 「DIMASSOC … 너무 이른 객체의 끝 — 도면이 취소됨」.
          엔진이 치수 핸들(330)을 AcDbDimAssoc 바로 뒤가 아닌 71 뒤에 씁니다. 빼도 치수는 그대로 보이고, «연관» 만 풀립니다.
        · TABLESTYLE(표 스타일) — 같은 도면 AUDIT 「AcDbTableStyle … 복구되지 않았습니다」. 도면에 표(ACAD_TABLE)가 하나도 없을 때만 뺍니다
          (표가 있으면 표가 스타일을 찾으므로 그대로 둡니다 — 열리기는 합니다). AutoCAD 가 필요할 때 Standard 를 새로 만듭니다. */
  const 빼는물체 = new Set(['DIMASSOC', 'ACAD_EVALUATION_GRAPH', 'ACDB_DYNAMICBLOCKPURGEPREVENTER_VERSION'])
  if (!표있음) 빼는물체.add('TABLESTYLE')
  /* · 동적 블록의 속(BLOCK…PARAMETER · GRIP · ACTION · COMPONENT 와 평가 그래프) — 13.토출부(2018): 「확장 데이터는 읽을 수 없음」.
       엔진이 이 물체들을 반쪽만 씁니다(1010·1071 칸 순서). 빼면 동적 블록이 «지금 모양 그대로의 보통 블록» 이 됩니다
       (삽입된 모양은 익명 블록 *U 에 따로 있어 화면은 그대로 — 손잡이로 늘이기·배열 바꾸기만 안 됩니다). */
  const 빼나 = (t) => 빼는물체.has(t) || (t.startsWith('BLOCK') && t !== 'BLOCK_RECORD')
  const 물체뺄 = []
  let 물체뺌 = 0
  /* ⑤ SORTENTSTABLE(그리는 순서 표) — 엔진이 「100 AcDbSortentsTable」 뒤의 «어느 블록의 표인지»(330)를 빼먹습니다.
        계월 날개벽(2018): AUDIT 「AcDbSortEntsTable Block Id not valid」 10건. 빼면 와이프아웃·해치 겹침 순서가 바뀔 수 있어,
        빼지 않고 채워 넣습니다 — 이 표를 가진 사전(330)의 주인(330)이 곧 그 블록입니다. */
  /* ⑧ XRECORD 본문에 1001(앱 이름) 없이 1000번대 칸 — 13.토출부(2018): AutoCAD 「확장 데이터는 읽을 수 없음 — 도면이 취소됨」.
        (Map 3D 의 ADE 설정 기록 「1000 ADE02C001 / 1070 / 1002 { } …」 — AutoCAD 는 1000번대를 확장 데이터로 읽으려다 앱 이름이 없어 멈춤)
        → 그런 XRECORD 만 통째로 뺍니다(도면 모양과 무관한 프로그램 설정). */
  let 기록뺌 = 0, 경로이음 = 0
  const 주인 = new Map()     // 핸들 → 주인 핸들(102 묶음 밖의 첫 330)
  const 순서표 = []          // [끼울 바이트 자리, 표를 가진 사전 핸들]
  if (물체부터 >= 0) {
    let 빼는중 = -1, 지금 = '', 이것 = '', 묶음안 = false, 주인봄 = false, 지금시작 = -1, 나쁜기록 = false, 앱봄 = false
    for (let k = 물체부터; k + 1 < 줄수; k += 2) {
      const c = 코드(k)
      if (c >= 1000 && 지금 === 'XRECORD') { if (c === 1001) 앱봄 = true; else if (!앱봄) 나쁜기록 = true }
      if (c > 0 && 열여섯(c)) { if (빼는중 < 0) 수보기(k + 1, c); continue }
      if (c === 0) {
        if (빼는중 >= 0) { 물체뺄.push([빼는중, 시작[k]]); 빼는중 = -1 }
        else if (나쁜기록 && 지금시작 >= 0) { 물체뺄.push([지금시작, 시작[k]]); 있음.delete(이것); 물체뺌++; 기록뺌++ }
        지금 = 짧은값(k + 1, 48); 이것 = ''; 묶음안 = false; 주인봄 = false; 지금시작 = 시작[k]; 나쁜기록 = false; 앱봄 = false
        if (빼나(지금)) { 빼는중 = 시작[k]; 물체뺌++ }
      } else if ((c === 5 || c === 105) && 빼는중 < 0) { 이것 = 값글(k + 1); 있음.add(이것) }
      else if (c === 102) 묶음안 = 짧은값(k + 1, 40).startsWith('{')
      else if (c === 3 && 지금 === 'IMAGEDEF' && 빼는중 < 0 && 코드(k + 2) === 1) {
        /* ⑱ 그림 파일 경로가 길면 엔진이 「3 앞부분 / 1 뒷부분」 으로 쪼갭니다(글자 칸 255 바이트).
              IMAGEDEF 에는 3 이 없어 AutoCAD 가 「IMAGEDEF … 너무 이른 객체의 끝 — 도면이 취소됨」(13.토출부).
              → 둘을 이어 「1 / 전체 경로」 한 줄로 씁니다(바이트 그대로 잇기 — 한글 경로가 깨지지 않게) */
        const 앞 = u.subarray(시작[k + 1], 끝(k + 1)), 뒤 = u.subarray(시작[k + 3], 끝(k + 3))
        const 머 = 바이트('  1' + 줄끝글), 꼬 = 바이트(줄끝글)
        const b = new Uint8Array(머.length + 앞.length + 뒤.length + 꼬.length)
        b.set(머, 0); b.set(앞, 머.length); b.set(뒤, 머.length + 앞.length); b.set(꼬, 머.length + 앞.length + 뒤.length)
        바꿈.push([시작[k], k + 4 < 줄수 ? 시작[k + 4] : u.length, b])
        경로이음++
        k += 2
      }
      else if (c === 330 && !묶음안 && !주인봄) { 주인봄 = true; if (이것) 주인.set(이것, 값글(k + 1)) }
      else if (c === 100 && 지금 === 'SORTENTSTABLE' && 짧은값(k + 1, 24) === 'ACDBSORTENTSTABLE' && k + 2 < 줄수 && 코드(k + 2) !== 330) {
        순서표.push([시작[k + 2], 주인.get(이것) || ''])
      }
    }
  }
  const 줄바꿈 = 줄수 > 1 && 시작[1] >= 2 && u[시작[1] - 2] === 캐리지 ? '\r\n' : '\n'
  const 넣기 = []
  for (const [자리, 사전h] of 순서표) {
    const 블록 = 주인.get(사전h)
    if (!블록 || !있음.has(블록)) continue
    const 글 = '330' + 줄바꿈 + 블록 + 줄바꿈
    const b = new Uint8Array(글.length)
    for (let i = 0; i < 글.length; i++) b[i] = 글.charCodeAt(i)
    넣기.push([자리, 자리, b])
  }

  /* 2) 사전 안의 「3 / 350·360」 가운데 없는 핸들 — 뺄 바이트 범위(①). ③과 겹치지 않게 차례대로 합칩니다 */
  let 사전 = false, 사전뺌 = 0
  let 물체i = 0
  for (let k = Math.max(물체부터, 0); 물체부터 >= 0 && k + 3 < 줄수; k += 2) {
    while (물체i < 물체뺄.length && 물체뺄[물체i][1] <= 시작[k]) 뺄.push(물체뺄[물체i++])
    if (물체i < 물체뺄.length && 시작[k] >= 물체뺄[물체i][0]) continue   // 통째로 빼는 물체 안
    const c = 코드(k)
    if (c === 0) { const t = 짧은값(k + 1, 24); 사전 = t === 'DICTIONARY' || t === 'ACDBDICTIONARYWDFLT'; continue }
    if (!사전 || c !== 3) continue
    const c2 = 코드(k + 2)
    if (c2 !== 350 && c2 !== 360) continue
    const h = 값글(k + 3)
    if (h && h !== '0' && !있음.has(h)) {
      뺄.push([시작[k], k + 4 < 줄수 ? 시작[k + 4] : u.length])
      사전뺌++
      k += 2
    }
  }
  while (물체i < 물체뺄.length) 뺄.push(물체뺄[물체i++])

  /* ⑦ 확장 데이터(1001 묶음) 안의 1005(핸들)가 없는 물체를 가리키면 — 그 앱 묶음만 뺍니다.
        13.토출부(2018): AutoCAD 「확장 데이터는 읽을 수 없음 — 도면이 취소됨」. 이 도면에만 «없는 핸들을 가리키는 1005» 가 54건
        (ACDBBLOCKREPETAG = 동적 블록 표시용 꼬리표 — AutoCAD 가 다시 만듭니다). 보이는 것은 바뀌지 않습니다. */
  let 꼬리뺌 = 0
  {
    let 묶음 = -1, 나쁨 = false
    const 닫기 = (k) => { if (묶음 >= 0 && 나쁨) { 뺄.push([묶음, 시작[k]]); 꼬리뺌++ } 묶음 = -1; 나쁨 = false }
    for (let k = 0; k + 1 < 줄수; k += 2) {
      const c = 코드(k)
      if (c === 1001) { 닫기(k); 묶음 = 시작[k]; continue }
      if (c < 1000) { 닫기(k); continue }
      if (c === 1005 && 묶음 >= 0) {
        const h = 값글(k + 1)
        if (h && h !== '0' && !있음.has(h)) 나쁨 = true
      }
    }
    닫기(줄수 - 1)
  }
  const 결과 = { 뺌: 사전뺌, 속성: 속성뺌, 물체: 물체뺌, 긴글: 긴글뺌, 순서표: 넣기.length, 수: 수고침, 꼬리: 꼬리뺌, 대리: 대리뺌, 기록: 기록뺌, 틀: 틀닫음, 해치: 해치뺌, 접선: 접선뺌, 치수: 치수넣음, 경로: 경로이음 }
  if (!뺄.length && !넣기.length && !바꿈.length) return { bytes: u, ...결과 }
  /* 빼기 [a, b] · 끼우기 [a, a, 바이트] 를 자리 순으로 한 번에 */
  const 모두 = 뺄.concat(넣기, 바꿈).sort((x, y) => x[0] - y[0] || x[1] - y[1])
  /* 겹치는 편집은 앞(바깥) 것만 — 예: 통째로 빼는 해치 안의 확장 데이터 빼기·숫자 고치기는 버립니다 */
  const 편집 = []
  let 끝자리 = 0
  for (const e of 모두) { if (e[0] < 끝자리) continue; 편집.push(e); 끝자리 = Math.max(끝자리, e[1]) }
  let 길이 = u.length
  for (const [a, b, 더] of 편집) 길이 += (더 ? 더.length : 0) - (b - a)
  const out = new Uint8Array(길이)
  let 읽은 = 0, 쓴 = 0
  for (const [a, b, 더] of 편집) {
    out.set(u.subarray(읽은, a), 쓴); 쓴 += a - 읽은
    if (더) { out.set(더, 쓴); 쓴 += 더.length }
    읽은 = b
  }
  out.set(u.subarray(읽은), 쓴)
  return { bytes: out, ...결과 }
}

/** 받을 파일 이름 — 확장자만 .dxf 로 */
export function dxf이름(이름) {
  const s = String(이름 || '도면').replace(/\.dwg$/i, '')
  return s + '.dxf'
}

/** 사람이 읽는 크기 */
export function 크기글(n) {
  if (!(n >= 0)) return ''
  if (n < 1024 * 1024) return Math.max(1, Math.round(n / 1024)) + 'KB'
  return (n / 1024 / 1024).toFixed(n < 10 * 1024 * 1024 ? 1 : 0) + 'MB'
}
