/**
 * 📗 옛 엑셀(.xls · 97-2003) 읽기 — 값만 (2026-09-30, G71)
 *
 * 소장님(9/30): 설계박사 · 콘엑스에 있고 우리에게 빠진 것 「다 만들자」.
 *   적산 프로그램이 내보내는 변경내역서는 아직 .xls 가 많습니다(송금지구 변경 2회분도 .xls 3.3MB).
 *   지금까지 우리 도구는 «엑셀에서 xlsx 로 다시 저장해 오십시오» 라고만 했습니다.
 *
 * ■ 하는 일: .xls 바이트 → { 시트이름: 표(2차원 배열) } — `qtoxlsx.readWorkbook` 과 «같은 모양».
 *   그래서 readWorkbook 이 .xls 를 알아보면 이것을 부르고, 내역서를 읽는 모든 도구가 .xls 를 받습니다.
 * ■ 읽는 것: 글자(SST · LABEL) · 숫자(NUMBER · RK · MULRK) · 수식의 «마지막으로 셈한 값» · 참거짓 · 오류.
 *   서식 · 병합 · 수식 자체는 읽지 않습니다(값만 — 내역서 숫자를 읽는 데는 이것으로 충분합니다).
 * ■ 틀: CFB(복합 문서) 안의 «Workbook» 흐름 → BIFF8 레코드. BIFF5(엑셀 95 이전)와 암호 걸린 파일은 말로 알려 드립니다.
 * ■ 브라우저 · 노드 양쪽에서 돕니다(시험은 노드: tools/시험_xls읽기.mjs — xlrd 값과 칸마다 견줌).
 */

const 머리표 = [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]

/** 이 바이트가 옛 엑셀(복합 문서)인가 */
export function xls인가(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  if (b.length < 512) return false
  for (let i = 0; i < 8; i++) if (b[i] !== 머리표[i]) return false
  return true
}

/* ═══════════════════════════ CFB(복합 문서) ═══════════════════════════ */

const 끝 = 0xFFFFFFFE          /* ENDOFCHAIN */
const 빈 = 0xFFFFFFFF          /* FREESECT */

function cfb흐름들(b) {
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength)
  const u16 = (o) => dv.getUint16(o, true)
  const u32 = (o) => dv.getUint32(o, true)
  const 칸크기 = 1 << u16(0x1E)
  const 작은칸크기 = 1 << u16(0x20)
  const fat수 = u32(0x2C)
  const 첫목록 = u32(0x30)
  const 작은기준 = u32(0x38) || 4096
  const 첫작은fat = u32(0x3C)
  const 작은fat수 = u32(0x40)
  let 첫difat = u32(0x44)
  const difat수 = u32(0x48)

  const 칸자리 = (n) => (n + 1) * 칸크기
  /* FAT 칸 번호들 — 머리의 109개 + DIFAT 사슬 */
  const fat칸 = []
  for (let i = 0; i < 109 && fat칸.length < fat수; i++) {
    const v = u32(0x4C + i * 4)
    if (v !== 빈) fat칸.push(v)
  }
  let 남 = difat수
  const 본difat = new Set()
  while (남-- > 0 && 첫difat !== 끝 && 첫difat !== 빈) {
    if (본difat.has(첫difat)) break
    본difat.add(첫difat)
    const o = 칸자리(첫difat)
    const n = 칸크기 / 4 - 1
    for (let i = 0; i < n && fat칸.length < fat수; i++) {
      const v = u32(o + i * 4)
      if (v !== 빈) fat칸.push(v)
    }
    첫difat = u32(o + n * 4)
  }
  const 한칸에 = 칸크기 / 4
  const fat = new Uint32Array(fat칸.length * 한칸에)
  fat칸.forEach((s, k) => {
    const o = 칸자리(s)
    for (let i = 0; i < 한칸에; i++) {
      if (o + i * 4 + 4 <= b.length) fat[k * 한칸에 + i] = u32(o + i * 4)
    }
  })
  const 사슬 = (첫, 표) => {
    const out = []
    const 본 = new Set()
    let s = 첫
    while (s !== 끝 && s !== 빈 && s < 표.length && !본.has(s)) {
      본.add(s); out.push(s); s = 표[s]
    }
    return out
  }
  const 큰읽기 = (첫, 크기) => {
    const 칸들 = 사슬(첫, fat)
    const out = new Uint8Array(Math.min(크기, 칸들.length * 칸크기))
    let w = 0
    for (const s of 칸들) {
      if (w >= out.length) break
      const o = 칸자리(s)
      const n = Math.min(칸크기, out.length - w, Math.max(0, b.length - o))
      out.set(b.subarray(o, o + n), w)
      w += n
    }
    return out
  }

  /* 목록(디렉터리) */
  const 목록 = 큰읽기(첫목록, 사슬(첫목록, fat).length * 칸크기)
  const ldv = new DataView(목록.buffer, 목록.byteOffset, 목록.byteLength)
  const 항목 = []
  for (let o = 0; o + 128 <= 목록.length; o += 128) {
    const 길이 = ldv.getUint16(o + 0x40, true)
    let 이름 = ''
    for (let i = 0; i + 2 <= Math.min(길이, 64) - 2; i += 2) 이름 += String.fromCharCode(ldv.getUint16(o + i, true))
    항목.push({ 이름, 꼴: 목록[o + 0x42], 첫: ldv.getUint32(o + 0x74, true), 크기: ldv.getUint32(o + 0x78, true) })
  }
  const 뿌리 = 항목.find((x) => x.꼴 === 5)
  let 작은흐름 = null
  let 작은fat = null
  const 작은읽기 = (첫, 크기) => {
    if (!작은흐름) {
      작은흐름 = 뿌리 ? 큰읽기(뿌리.첫, 뿌리.크기) : new Uint8Array(0)
      const mf = 큰읽기(첫작은fat, 작은fat수 * 칸크기)
      const mdv = new DataView(mf.buffer, mf.byteOffset, mf.byteLength)
      작은fat = new Uint32Array(mf.length / 4)
      for (let i = 0; i < 작은fat.length; i++) 작은fat[i] = mdv.getUint32(i * 4, true)
    }
    const 칸들 = 사슬(첫, 작은fat)
    const out = new Uint8Array(Math.min(크기, 칸들.length * 작은칸크기))
    let w = 0
    for (const s of 칸들) {
      if (w >= out.length) break
      const o = s * 작은칸크기
      const n = Math.min(작은칸크기, out.length - w)
      out.set(작은흐름.subarray(o, o + n), w)
      w += n
    }
    return out
  }
  return {
    이름들: 항목.filter((x) => x.꼴 === 2).map((x) => x.이름),
    꺼내기(이름) {
      const e = 항목.find((x) => x.꼴 === 2 && x.이름.toLowerCase() === 이름.toLowerCase())
      if (!e) return null
      return e.크기 < 작은기준 ? 작은읽기(e.첫, e.크기) : 큰읽기(e.첫, e.크기)
    },
  }
}

/* ═══════════════════════════ BIFF8 ═══════════════════════════ */

/** 레코드 [종류, 시작, 길이] 목록 */
function 레코드들(w) {
  const out = []
  let o = 0
  while (o + 4 <= w.length) {
    const t = w[o] | (w[o + 1] << 8)
    const n = w[o + 2] | (w[o + 3] << 8)
    out.push([t, o + 4, n])
    o += 4 + n
  }
  return out
}

/** CONTINUE 로 쪼개진 자료를 «이어진 것처럼» 읽는 손 — 글자 가운데서 끊기면 새 조각 맨 앞에 flag 한 바이트가 붙습니다 */
function 이어읽개(w, 조각들) {
  let k = 0
  let o = 조각들.length ? 조각들[0][0] : 0
  const 조각끝 = () => 조각들[k][0] + 조각들[k][1]
  const 넘기 = () => { k++; if (k < 조각들.length) o = 조각들[k][0] }
  const 남았나 = () => k < 조각들.length
  const 바이트 = () => {
    while (k < 조각들.length && o >= 조각끝()) 넘기()
    if (k >= 조각들.length) throw new Error('SST 가 도중에 끊겼습니다')
    return w[o++]
  }
  return {
    남았나,
    u8: 바이트,
    u16() { const a = 바이트(); return a | (바이트() << 8) },
    u32() { const a = this.u16(); return (a + this.u16() * 65536) >>> 0 },
    건너(n) { for (let i = 0; i < n; i++) 바이트() },
    글자(개수, 두바이트) {
      let s = ''
      let wide = 두바이트
      for (let i = 0; i < 개수; i++) {
        /* 조각 끝에 닿았으면 다음 조각의 첫 바이트는 «flag» — 이 뒤로 1바이트냐 2바이트냐 */
        if (k < 조각들.length && o >= 조각끝()) {
          넘기()
          if (k >= 조각들.length) break
          wide = (w[o++] & 1) === 1
        }
        if (wide) { const a = 바이트(); s += String.fromCharCode(a | (바이트() << 8)) }
        else s += String.fromCharCode(바이트())
      }
      return s
    },
  }
}

function sst읽기(w, rs, i) {
  const 조각 = [[rs[i][1], rs[i][2]]]
  for (let j = i + 1; j < rs.length && rs[j][0] === 0x003C; j++) 조각.push([rs[j][1], rs[j][2]])
  const r = 이어읽개(w, 조각)
  r.u32()
  const 고유 = r.u32()
  const out = []
  for (let n = 0; n < 고유 && r.남았나(); n++) {
    try {
      const cch = r.u16()
      const fl = r.u8()
      const 런 = fl & 0x08 ? r.u16() : 0
      const 덧 = fl & 0x04 ? r.u32() : 0
      out.push(r.글자(cch, (fl & 1) === 1))
      if (런) r.건너(런 * 4)
      if (덧) r.건너(덧)
    } catch { break }
  }
  return out
}

/* 짧은 글(BOUNDSHEET 이름): cch u8 */
function 짧은글(w, o) {
  const cch = w[o]
  const wide = (w[o + 1] & 1) === 1
  let s = ''
  for (let i = 0; i < cch; i++) {
    s += wide ? String.fromCharCode(w[o + 2 + i * 2] | (w[o + 3 + i * 2] << 8)) : String.fromCharCode(w[o + 2 + i])
  }
  return s
}
/* 보통 글(LABEL · STRING): cch u16 */
function 보통글(w, o, 한도) {
  const cch = w[o] | (w[o + 1] << 8)
  const wide = (w[o + 2] & 1) === 1
  let s = ''
  for (let i = 0; i < cch; i++) {
    const p = o + 3 + (wide ? i * 2 : i)
    if (p >= 한도) break
    s += wide ? String.fromCharCode(w[p] | (w[p + 1] << 8)) : String.fromCharCode(w[p])
  }
  return s
}

const 오류글 = { 0x00: '#NULL!', 0x07: '#DIV/0!', 0x0F: '#VALUE!', 0x17: '#REF!', 0x1D: '#NAME?', 0x24: '#NUM!', 0x2A: '#N/A' }

function rk값(dv, o) {
  const rk = dv.getUint32(o, true)
  let v
  if (rk & 0x02) v = (rk | 0) >> 2
  else {
    const t = new DataView(new ArrayBuffer(8))
    t.setUint32(4, rk & 0xFFFFFFFC, true)
    t.setUint32(0, 0, true)
    v = t.getFloat64(0, true)
  }
  return rk & 0x01 ? v / 100 : v
}

/** .xls 바이트 → { 시트이름: 표 } */
export function xls읽기(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  if (!xls인가(b)) throw new Error('옛 엑셀(.xls) 파일이 아닙니다.')
  const c = cfb흐름들(b)
  const w = c.꺼내기('Workbook')
  if (!w) {
    if (c.꺼내기('Book')) throw new Error('엑셀 95 이전(BIFF5) 파일입니다. 엑셀에서 «다른 이름으로 저장 → Excel 통합 문서(.xlsx)» 한 뒤 올려 주십시오.')
    if (c.이름들.some((n) => /EncryptedPackage|EncryptionInfo/.test(n))) throw new Error('암호가 걸린 엑셀입니다. 암호를 풀고 저장한 뒤 올려 주십시오.')
    throw new Error('엑셀 파일 안에서 통합 문서를 못 찾았습니다(한글 · 워드 파일일 수 있습니다).')
  }
  const dv = new DataView(w.buffer, w.byteOffset, w.byteLength)
  const rs = 레코드들(w)
  const 시트 = []
  let sst = []
  /* 첫 BOF 부터 EOF 까지가 «통합 문서 전체» 자리 */
  for (let i = 0; i < rs.length; i++) {
    const [t, o, n] = rs[i]
    if (t === 0x0809 && i === 0) {
      const 판 = dv.getUint16(o, true)
      if (판 !== 0x0600) throw new Error('엑셀 95 이전(BIFF5) 파일입니다. 엑셀에서 .xlsx 로 저장한 뒤 올려 주십시오.')
    }
    if (t === 0x002F) throw new Error('암호가 걸린 엑셀입니다. 암호를 풀고 저장한 뒤 올려 주십시오.')
    if (t === 0x0085) {
      시트.push({ 자리: dv.getUint32(o, true), 숨김: w[o + 4], 꼴: w[o + 5], 이름: 짧은글(w, o + 6) })
    }
    if (t === 0x00FC) sst = sst읽기(w, rs, i)
    if (t === 0x000A) break
  }
  const 자리별 = new Map()
  rs.forEach((r, i) => 자리별.set(r[1] - 4, i))
  const out = {}
  for (const s of 시트) {
    if (s.꼴 !== 0) continue                       /* 차트 · 매크로 시트는 건너뜁니다 */
    let i = 자리별.get(s.자리)
    if (i === undefined) { out[s.이름.trim()] = []; continue }
    const rows = []
    const 넣기 = (r, cc, v) => {
      while (rows.length <= r) rows.push([])
      const row = rows[r]
      while (row.length < cc) row.push(null)
      row[cc] = v
    }
    let 기다림 = null                              /* 글자 결과를 가진 수식 — 바로 뒤 STRING 레코드에 글자가 옵니다 */
    for (i = i + 1; i < rs.length; i++) {
      const [t, o, n] = rs[i]
      if (t === 0x000A) break
      if (t === 0x0809) {                            /* 시트 안에 끼어든 다른 BOF(차트) — 그 EOF 까지 건너뜀 */
        let 깊이 = 1
        while (++i < rs.length && 깊이 > 0) {
          if (rs[i][0] === 0x0809) 깊이++
          else if (rs[i][0] === 0x000A) 깊이--
        }
        i--
        continue
      }
      switch (t) {
        case 0x00FD: {                               /* LABELSST */
          const k = dv.getUint32(o + 6, true)
          넣기(dv.getUint16(o, true), dv.getUint16(o + 2, true), sst[k] ?? '')
          break
        }
        case 0x0203:                                 /* NUMBER */
          넣기(dv.getUint16(o, true), dv.getUint16(o + 2, true), dv.getFloat64(o + 6, true))
          break
        case 0x027E:                                 /* RK */
          넣기(dv.getUint16(o, true), dv.getUint16(o + 2, true), rk값(dv, o + 6))
          break
        case 0x00BD: {                               /* MULRK */
          const r = dv.getUint16(o, true)
          const c0 = dv.getUint16(o + 2, true)
          const 개수 = (n - 6) / 6
          for (let k = 0; k < 개수; k++) 넣기(r, c0 + k, rk값(dv, o + 4 + k * 6 + 2))
          break
        }
        case 0x0204:                                 /* LABEL */
        case 0x00D6:                                 /* RSTRING */
          넣기(dv.getUint16(o, true), dv.getUint16(o + 2, true), 보통글(w, o + 6, o + n))
          break
        case 0x0205: {                               /* BOOLERR */
          const v = w[o + 6]
          넣기(dv.getUint16(o, true), dv.getUint16(o + 2, true),
            w[o + 7] ? (오류글[v] || '#N/A') : (v ? 'TRUE' : 'FALSE'))
          break
        }
        case 0x0006: {                               /* FORMULA — 마지막으로 셈한 값 */
          const r = dv.getUint16(o, true)
          const cc = dv.getUint16(o + 2, true)
          if (w[o + 12] === 0xFF && w[o + 13] === 0xFF) {
            const 꼴 = w[o + 6]
            if (꼴 === 0) 기다림 = [r, cc]
            else if (꼴 === 1) 넣기(r, cc, w[o + 8] ? 'TRUE' : 'FALSE')
            else if (꼴 === 2) 넣기(r, cc, 오류글[w[o + 8]] || '#N/A')
            else 넣기(r, cc, '')
          } else 넣기(r, cc, dv.getFloat64(o + 6, true))
          break
        }
        case 0x0207:                                 /* STRING — 바로 앞 수식의 글자 결과 */
          if (기다림) { 넣기(기다림[0], 기다림[1], 보통글(w, o, o + n)); 기다림 = null }
          break
        default:
      }
    }
    out[s.이름.trim()] = rows
  }
  return out
}
