/* ==========================================================
   ⚡ 공사서류 원클릭 — 빈 엑셀(틀)에 입력값을 넣어 돌려줍니다 (이 기기 안에서만)

   ■ 틀: public/tools/wonclick/k-conmap-wonclick.xlsx (tools/build_wonclick.py 가 만든 것)
   ■ 칸 주소: src/data/wonclick.json 의 inputs[].cell — 틀과 같은 스크립트가 같이 만듭니다.
     ⚠️ 틀을 다시 만들면 json 도 같이 바꿔야 합니다 (칸 주소가 어긋나면 엉뚱한 칸에 들어감).
   ■ 서류 칸은 전부 수식입니다. 여기서는 «입력» 시트의 노란 칸만 채우고,
     엑셀이 열 때 다시 계산합니다 (workbook.xml 의 fullCalcOnLoad="1").
   ■ 고르지 않은 서류는 지우지 않고 «숨김» 으로 둡니다 — 수식이 깨지지 않게.
   ■ 입력값은 서버로 보내지 않습니다.
   ========================================================== */
import { unzipSync, zipSync, strToU8, strFromU8 } from 'fflate'

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  // 엑셀이 못 읽는 제어문자는 뺍니다 (줄바꿈·탭은 둠)
  // eslint-disable-next-line no-control-regex
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')

/** 'YYYY-MM-DD' → 엑셀 날짜 일련번호 (1900 날짜 체계) */
export function dateSerial(s) {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(String(s || '').trim())
  if (!m) return null
  const t = Date.UTC(+m[1], +m[2] - 1, +m[3])
  const d = new Date(t)
  if (d.getUTCFullYear() !== +m[1] || d.getUTCMonth() !== +m[2] - 1) return null
  return Math.round((t - Date.UTC(1899, 11, 30)) / 86400000)
}

/** '123,456,000원' → 123456000 (숫자가 아니면 null) */
export function toNumber(s) {
  if (s === null || s === undefined) return null
  const t = String(s).replace(/[,\s원₩%]/g, '')
  if (t === '') return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

/** 입력 하나 → 칸 xml (스타일 번호 s 는 틀의 것을 그대로) */
function cellXml(ref, s, inp, raw) {
  const sa = s ? ` s="${s}"` : ''
  const v = String(raw ?? '').trim()
  if (v === '') return `<c r="${ref}"${sa}/>`
  if (inp.type === 'date') {
    const n = dateSerial(v)
    if (n !== null) return `<c r="${ref}"${sa}><v>${n}</v></c>`
  } else if (inp.type === 'money' || inp.type === 'num') {
    const n = toNumber(v)
    if (n !== null) return `<c r="${ref}"${sa}><v>${n}</v></c>`
  }
  return `<c r="${ref}"${sa} t="inlineStr"><is><t xml:space="preserve">${esc(v)}</t></is></c>`
}

/** 틀 시트 xml 에 값 넣기 */
export function fillSheetXml(xml, inputs, values) {
  let out = xml
  for (const inp of inputs) {
    if (!(inp.key in values)) continue
    const ref = inp.cell
    const re = new RegExp(`<c r="${ref}"(\\s[^>]*?)?(?:/>|>[\\s\\S]*?</c>)`)
    const m = re.exec(out)
    if (!m) throw new Error(`틀에서 ${ref} 칸을 찾지 못했습니다`)
    const sm = /\ss="(\d+)"/.exec(m[1] || '')
    out = out.slice(0, m.index) + cellXml(ref, sm ? sm[1] : '', inp, values[inp.key]) + out.slice(m.index + m[0].length)
  }
  return out
}

/** 고르지 않은 서류 시트 숨기기 */
export function hideSheets(wbXml, hide) {
  const set = new Set(hide)
  return wbXml.replace(/<sheet\b[^>]*\/>/g, (tag) => {
    const nm = /\sname="([^"]*)"/.exec(tag)
    if (!nm) return tag
    const name = nm[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    if (!set.has(name)) return tag
    if (/\sstate="/.test(tag)) return tag.replace(/\sstate="[^"]*"/, ' state="hidden"')
    return tag.replace(/<sheet\b/, '<sheet state="hidden"')
  })
}

/**
 * @param {Uint8Array} template  틀 xlsx
 * @param {object} meta          wonclick.json
 * @param {object} values        {키: 값}
 * @param {string[]} pick        남길 서류 시트 이름들 (없으면 전부)
 * @returns {Uint8Array}
 */
export function fillWorkbook(template, meta, values, pick) {
  const files = unzipSync(template)
  const sp = meta.inputSheet
  if (!files[sp]) throw new Error('틀이 올바르지 않습니다 (입력 시트 없음)')
  files[sp] = strToU8(fillSheetXml(strFromU8(files[sp]), meta.inputs, values || {}))
  if (pick && pick.length) {
    const keep = new Set(pick)
    const hide = meta.docs.map((d) => d.sheet).filter((s) => !keep.has(s))
    if (hide.length) files['xl/workbook.xml'] = strToU8(hideSheets(strFromU8(files['xl/workbook.xml']), hide))
  }
  // 열자마자 다시 계산 (틀에 이미 있지만 한 번 더 다짐)
  const wb = strFromU8(files['xl/workbook.xml'])
  if (!/fullCalcOnLoad="1"/.test(wb)) {
    files['xl/workbook.xml'] = strToU8(/<calcPr\b/.test(wb)
      ? wb.replace(/<calcPr\b/, '<calcPr fullCalcOnLoad="1"')
      : wb.replace('</workbook>', '<calcPr fullCalcOnLoad="1"/></workbook>'))
  }
  return zipSync(files, { level: 6 })
}

/** 파일 이름에 못 쓰는 글자 빼기 */
export function safeName(s) {
  return String(s || '').replace(/[\\/:*?"<>|\u0000-\u001F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 40)
}
