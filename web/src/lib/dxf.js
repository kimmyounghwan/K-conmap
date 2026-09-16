/**
 * 도면(.dxf)에서 «찍어 둔 산출단위» 를 읽습니다 (2026-09-16).
 *
 * ⚠️ 도면을 «해석» 하지 않습니다. 선이 무엇을 뜻하는지는 도면마다 달라서
 *    자동으로 하면 반드시 틀립니다. 여기서 읽는 것은 **사람이 캐드에서 찍어 붙여 둔 쪽지**
 *    (XDATA, 앱이름 `KQTO`) 뿐입니다. 찍지 않은 도면에서는 아무것도 안 나옵니다.
 *
 * ⚠️ PC 의 `K-적산/kqto.py` 의 `read_units_dxf()` 와 «같은 것» 을 읽어야 합니다.
 *
 * DXF 는 «두 줄이 한 짝» 인 글자 파일입니다.
 *      0          <- 그룹 코드
 *      LWPOLYLINE <- 값
 * XDATA 는 이렇게 붙습니다:
 *     1001 KQTO          <- 앱 이름
 *     1000 부재=구조물     <- 우리가 적어 둔 쪽지
 *     1000 A=7.2
 *
 * 2007 판 아래 캐드는 한글을 \U+bc88\U+d638 꼴로 적습니다 — 되돌립니다.
 */

const UNI = /\\U\+([0-9A-Fa-f]{4})/g
const MIF = /\\M\+[0-9A-Fa-f]([0-9A-Fa-f]{4})/g

export function unescapeKo(s) {
  return String(s)
    .replace(UNI, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(MIF, (_, h) => String.fromCharCode(parseInt(h, 16)))
}

/** 바이트 -> 글자.  DXF 는 UTF-8 이거나 cp949(euc-kr) 입니다. */
export function decodeDxf(bytes) {
  const u8 = new Uint8Array(bytes)
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(u8).replace(/^﻿/, '')
  } catch (e) {
    try { return new TextDecoder('euc-kr').decode(u8) } catch (e2) { /* 아래로 */ }
    return new TextDecoder('utf-8').decode(u8).replace(/^﻿/, '')
  }
}

/**
 * 도면 글자 -> 산출단위 [{칸이름: 값}]
 *
 * 그룹 코드 1001 «KQTO» 가 나오면 그 뒤의 1000 줄들을 한 덩어리로 모읍니다.
 * 다른 앱 이름(1001)이 나오면 그 덩어리는 끝난 것입니다.
 */
export function readDxfUnits(text) {
  const lines = String(text).split(/\r\n|\r|\n/)
  const out = []
  let inKqto = false
  let cur = null
  for (let i = 0; i + 1 < lines.length; i += 2) {
    const code = lines[i].trim()
    const val = lines[i + 1]
    if (code === '1001') {
      if (val.trim() === 'KQTO') {
        inKqto = true
        cur = {}
      } else {
        if (cur && cur['부재']) out.push(cur)
        inKqto = false; cur = null
      }
      continue
    }
    if (code === '0' || code === '2') {           /* 새 도형·새 표 — 덩어리가 끝납니다 */
      if (cur && cur['부재']) out.push(cur)
      inKqto = false; cur = null
      continue
    }
    if (!inKqto || !cur) continue
    if (code === '1000' && val.includes('=')) {
      const s = unescapeKo(val)
      const j = s.indexOf('=')
      const k = s.slice(0, j).trim()
      const v = s.slice(j + 1).trim()
      if (k) cur[k] = v
    }
  }
  if (cur && cur['부재']) out.push(cur)

  /* 번호로 줄세웁니다 — 찍은 차례대로 보이게 (kqto.py 와 같습니다) */
  out.sort((a, b) => (parseFloat(a['번호']) || 0) - (parseFloat(b['번호']) || 0))
  out.forEach((r, i) => { if (!r['번호']) r['번호'] = String(i + 1) })
  return out
}

/** 도면에서 읽은 산출단위를 «치수표 CSV» 글자로 바꿉니다 (내려받아 고칠 수 있게) */
export function unitsToCsv(units) {
  const 앞 = ['번호', '부재', '부호', '태그1', '태그2', '태그3', '개소']
  const 뒤 = []
  for (const u of units) for (const k of Object.keys(u)) {
    if (!앞.includes(k) && !뒤.includes(k) && k !== '비고') 뒤.push(k)
  }
  const head = 앞.concat(뒤, ['비고'])
  const q = (v) => {
    const s = v === undefined || v === null ? '' : String(v)
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }
  const rows = [head.join(',')]
  for (const u of units) rows.push(head.map((k) => q(u[k])).join(','))
  return '﻿' + rows.join('\r\n') + '\r\n'
}
