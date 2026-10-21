// 🔢 G361 서식 종이 «보이는 글» 대조 — 사이트 숫자 꼴(lib/엑셀꼴.js) = LibreOffice 가 작성 예시 시트에 보이는 글
//   (격자검증.py 가 만든 바탕 엑셀을 LibreOffice 로 «보이는 대로» CSV 로 뽑은 것과 — 서식마다 작성 예시 한 벌)
//   node tools/격자꼴시험.mjs [CSV 폴더=/tmp/g10/g361/csvall] [바탕 엑셀 폴더=/tmp/g10/g361/vb/base]
import fs from 'fs'
import { execFileSync } from 'child_process'
import { 책만들기, 열번호 } from '../web/src/lib/엑셀셈.js'
import { 꼴 } from '../web/src/lib/엑셀꼴.js'
import { 칸글 } from '../web/src/lib/격자그림.js'

const CSV = process.argv[2] || '/tmp/g10/g361/csvall'
const BASE = process.argv[3] || '/tmp/g10/g361/vb/base'
function csv읽기(t) {
  const rows = []; let row = [], cell = '', q = false
  for (let i = 0; i < t.length; i++) {
    const ch = t[i]
    if (q) { if (ch === '"') { if (t[i + 1] === '"') { cell += '"'; i++ } else q = false } else cell += ch; continue }
    if (ch === '"') { q = true; continue }
    if (ch === ',') { row.push(cell); cell = ''; continue }
    if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; continue }
    if (ch === '\r') continue
    cell += ch
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  return rows
}
const 시트이름들 = (p) => JSON.parse(execFileSync('python3', ['-c', 'import openpyxl,sys,json;print(json.dumps(openpyxl.load_workbook(sys.argv[1],read_only=True).sheetnames,ensure_ascii=False))', p], { encoding: 'utf8' }))
const 정리 = (s) => String(s ?? '').replace(/\s+/g, ' ').trim()
let ok = 0, bad = 0, 서식수 = 0, 다맞음 = 0
const 틀림 = []
const 꼴별 = new Map()
for (const slug of fs.readdirSync(CSV).filter((d) => fs.statSync(`${CSV}/${d}`).isDirectory()).sort()) {
  const gp = `/tmp/g10/fm55/web/public/forms/g/${slug}.json`
  if (!fs.existsSync(gp)) continue
  const doc = JSON.parse(fs.readFileSync(gp, 'utf8'))
  let names
  try { names = 시트이름들(`${BASE}/${slug}.xlsx`) } catch (e) { continue }
  const n = doc.sheets.length
  const 책 = 책만들기(doc); 책.꼴 = 꼴
  책.들여오기(doc.ex || {})
  서식수++
  let 이번bad = 0
  doc.sheets.forEach((s, si) => {
    const exName = s.exn || null                      // 격자.py 가 짝지은 작성 예시 시트(몇 장만 있는 서식이 있음)
    const f = `${CSV}/${slug}/${slug}-${exName}.csv`
    if (!exName || !fs.existsSync(f)) return
    const rows = csv읽기(fs.readFileSync(f, 'utf8'))
    for (const x of s.cells) {
      const [r, c, , , , k, v, fml, nf] = x
      if (c > s.pc || r > s.pr) continue
      if (!(k === 2 || k === 3 || ((k === 1) && nf))) continue
      if (r === 1) continue                                  // 1행 «작성 예시» 표시는 시트마다 다름
      const lo = 정리((rows[r - 1] || [])[c - 1])
      const g = 칸글(책, si, x)
      const 우리 = 정리(g.자리 ? '' : g.t)
      if (lo === 우리) { ok++; continue }
      // LibreOffice 가 좁은 칸의 수를 ### 로 보이는 것 — 사이트는 글자를 줄여 다 보임(엑셀의 ### 대신)
      if (/^#+$/.test(lo) && 우리) { ok++; continue }
      bad++; 이번bad++
      const key = nf || '(일반)'
      꼴별.set(key, (꼴별.get(key) || 0) + 1)
      if (틀림.length < 300) 틀림.push(`${slug} ${s.name}!${String.fromCharCode(64 + c)}${r} 꼴 ${JSON.stringify(nf)} · 사이트 «${우리}» ≠ LO «${lo}» ${fml ? '= ' + fml.slice(0, 60) : ''}`)
    }
  })
  if (!이번bad) 다맞음++
}
for (const t of 틀림.slice(0, 120)) console.log(t)
console.log('\n꼴별 틀림:', JSON.stringify([...꼴별.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20)))
console.log(`서식 ${서식수} · 다 맞음 ${다맞음} · 칸 맞음 ${ok} · 틀림 ${bad}`)
process.exit(bad ? 1 : 0)
