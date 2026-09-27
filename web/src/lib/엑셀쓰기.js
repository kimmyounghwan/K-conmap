/**
 * 📗 화면에서 고친 칸을 엑셀 파일에 넣습니다 (2026-09-27)
 *   «엑셀 받기» 를 누르면 화면에서 고친 그대로 받아지게. 고친 칸은 수식 대신 적은 값이 들어갑니다
 *   (엑셀에서 수식 칸에 손으로 적은 것과 같음). 나머지 수식은 엑셀이 열 때 다시 셉니다.
 */
import { unzipSync, zipSync, strToU8, strFromU8 } from 'fflate'
import { 주소풀기 } from './엑셀읽기.js'

const 싸기 = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  // eslint-disable-next-line no-control-regex
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')

function 칸글(ref, s, v) {
  const sa = s ? ` s="${s}"` : ''
  if (v === null || v === undefined || v === '') return `<c r="${ref}"${sa}/>`
  if (typeof v === 'number' && Number.isFinite(v)) return `<c r="${ref}"${sa}><v>${v}</v></c>`
  if (typeof v === 'boolean') return `<c r="${ref}"${sa} t="b"><v>${v ? 1 : 0}</v></c>`
  return `<c r="${ref}"${sa} t="inlineStr"><is><t xml:space="preserve">${싸기(v)}</t></is></c>`
}

/** 시트 xml 한 장에 칸 여럿 넣기 */
export function 시트고치기(xml, 칸들) {
  let out = xml
  for (const [ref, v] of 칸들) {
    const re = new RegExp(`<c r="${ref}"(\\s[^>]*?)?(?:/>|>[\\s\\S]*?</c>)`)
    const m = re.exec(out)
    if (m) {
      const sm = /\ss="(\d+)"/.exec(m[1] || '')
      out = out.slice(0, m.index) + 칸글(ref, sm ? sm[1] : '', v) + out.slice(m.index + m[0].length)
      continue
    }
    const p = 주소풀기(ref)
    if (!p) continue
    const 새칸 = 칸글(ref, '', v)
    const rowRe = new RegExp(`<row r="${p.r}"([^>]*?)(/>|>([\\s\\S]*?)</row>)`)
    const rm = rowRe.exec(out)
    if (rm) {
      let 안 = rm[3] || ''
      // 열 차례에 맞춰 끼웁니다
      const cre = /<c r="([A-Z]+)\d+"/g
      let 자리 = 안.length, cm
      while ((cm = cre.exec(안))) {
        const q = 주소풀기(cm[1] + p.r)
        if (q && q.c > p.c) { 자리 = cm.index; break }
      }
      안 = 안.slice(0, 자리) + 새칸 + 안.slice(자리)
      const 새줄 = `<row r="${p.r}"${rm[1].replace(/\/$/, '')}>${안}</row>`
      out = out.slice(0, rm.index) + 새줄 + out.slice(rm.index + rm[0].length)
      continue
    }
    // 줄이 없으면 줄 차례에 맞춰 새로
    const 새줄 = `<row r="${p.r}">${새칸}</row>`
    if (/<sheetData\s*\/>/.test(out)) { out = out.replace(/<sheetData\s*\/>/, `<sheetData>${새줄}</sheetData>`); continue }
    const rre = /<row r="(\d+)"/g
    let 넣을곳 = -1, x
    while ((x = rre.exec(out))) { if (+x[1] > p.r) { 넣을곳 = x.index; break } }
    if (넣을곳 < 0) 넣을곳 = out.indexOf('</sheetData>')
    if (넣을곳 < 0) continue
    out = out.slice(0, 넣을곳) + 새줄 + out.slice(넣을곳)
  }
  return out
}

/**
 * @param bytes  원래 xlsx
 * @param 책     엑셀읽기(bytes) 결과 (시트 이름 → 파일 길)
 * @param 고침   { '시트!B5': 값 }
 * @returns Uint8Array
 */
export function 고친엑셀(bytes, 책, 고침) {
  const ks = Object.keys(고침 || {})
  const files = unzipSync(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes))
  const 묶음 = new Map()
  for (const k of ks) {
    const i = k.lastIndexOf('!')
    const 시 = k.slice(0, i), ref = k.slice(i + 1)
    if (!묶음.has(시)) 묶음.set(시, [])
    묶음.get(시).push([ref, 고침[k]])
  }
  for (const [시, 칸들] of 묶음) {
    const s = 책.시트들.find((x) => x.이름 === 시)
    if (!s || !files[s.길]) continue
    files[s.길] = strToU8(시트고치기(strFromU8(files[s.길]), 칸들))
  }
  if (ks.length && files['xl/calcChain.xml']) {
    // 수식이 빠진 칸이 계산 사슬에 남아 있으면 엑셀이 «복구» 를 묻습니다 → 사슬을 지우면 엑셀이 새로 짭니다
    delete files['xl/calcChain.xml']
    const ct = '[Content_Types].xml'
    if (files[ct]) files[ct] = strToU8(strFromU8(files[ct]).replace(/<Override[^>]*calcChain[^>]*\/>/g, ''))
    const rl = 'xl/_rels/workbook.xml.rels'
    if (files[rl]) files[rl] = strToU8(strFromU8(files[rl]).replace(/<Relationship[^>]*calcChain[^>]*\/>/g, ''))
  }
  const wb = strFromU8(files['xl/workbook.xml'])
  if (!/fullCalcOnLoad="1"/.test(wb)) {
    files['xl/workbook.xml'] = strToU8(/<calcPr\b/.test(wb)
      ? wb.replace(/<calcPr\b/, '<calcPr fullCalcOnLoad="1"')
      : wb.replace('</workbook>', '<calcPr fullCalcOnLoad="1"/></workbook>'))
  }
  return zipSync(files, { level: 6 })
}
