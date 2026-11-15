/**
 * 🔁 G687 설계변경 «2줄 → 1줄» 시험 — node tools/시험_1줄.mjs   (lib/xlsx1line.js · 클라우드 — web/node_modules 의 fflate 를 씀)
 *
 *  ① 예시 2줄 파일(web/public/tools/files/ex-twoline-2line.xlsx · 지어낸 공사) — 짝 찾기(원가계산서 · 내역서 2줄 확실 · 대비표 그대로)
 *     · 1줄로: 줄 수 · 남긴 줄(변경) 값 · 당초 줄에만 있던 글(품명 · 기호 «1 · 2 · A») · 합계 수식 · 머리 «금 ○○원» 이 1줄 도급액을 봄(이음)
 *     · 대비표의 당초 칸은 그때 값 · 변경 칸은 남긴 줄을 봄 · 엇갈림 0
 *  ② 1줄 파일은 «2줄 확실» 로 안 봄(예시 1줄 · 시험자료 셋) — 엉뚱한 줄을 지우지 않게
 *  ③ 되돌림 — 1줄 → (xlsx2line) 2줄 · 3줄 → (xlsx1line) 1줄 = 원래와 같은 수식 · 값(예시 1줄 · 시험자료 셋)
 *  ④ 지어낸 작은 책으로 사고 꼴 잠금 — 병합 아래 숨은 칸(«=N9» 가 «10억 미만» 글이 됐던 것) · 사람이 쓴 괄호 «=(D24*F24)» 그대로 ·
 *     끌어온 칸 하나는 괄호 없이 · 머리 칸이 지운 줄만 보면 남긴 줄로(이음) · 짝이 엇갈리면 멈춤 ·
 *     1줄 → 2줄에서 마지막 줄 뒤를 가리키던 범위(«SUM(K28:K35)»)가 거꾸로 되지 않음(xlsx2line)
 * 가상 자료만 씀(실제 공사 · 회사 이름 없음) · 인터넷 안 부름.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const 열기 = (p) => import(pathToFileURL(path.join(ROOT, p)).href)
const L1 = await 열기('web/src/lib/xlsx1line.js')
const L2 = await 열기('web/src/lib/xlsx2line.js')
const { zipSync, strToU8 } = await 열기('web/node_modules/fflate/esm/index.mjs')

let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 300))) }
const 버퍼 = (b) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)
const 파일 = (p) => 버퍼(fs.readFileSync(path.join(ROOT, p)))
const 칸 = (책, 시트, ref) => L1._안.칸(책, 시트, ref) || {}

/* ── ① 예시 2줄 파일 ── */
console.log('① 예시 2줄 파일(지어낸 공사)')
{
  const buf = 파일('web/public/tools/files/ex-twoline-2line.xlsx')
  const 살 = L1.살펴보기(buf)
  const 시 = (nm) => 살.sheets.find((s) => s.name === nm) || {}
  ok('원가계산서 2줄 · 짝 20 · 확실', 시('원가계산서').꼴 === '2줄' && 시('원가계산서').짝 === 20 && 시('원가계산서').확실, 시('원가계산서'))
  ok('내역서 2줄 · 짝 15 · 확실', 시('내역서').꼴 === '2줄' && 시('내역서').짝 === 15 && 시('내역서').확실, 시('내역서'))
  ok('공사비증감대비표 = 대비표(줄이지 않음)', 시('공사비증감대비표').꼴 === '대비표')
  ok('상태 = 당초 · 변경', JSON.stringify(살.상태들) === '["당초","변경"]', 살.상태들)
  const 미 = L1.미리줄(살, 시('내역서').path, '변경', 3)
  ok('미리보기 짝 셋 · 품목 줄 · 결과에 품명(당초 줄 글)과 변경 수량', 미.length === 3 && 미[0].결과.includes('터파기(토사)') && 미[0].결과.includes('465'), 미[0] && 미[0].결과)
  const r = L1.한줄로(buf, { sheets: [시('원가계산서').path, 시('내역서').path], 남길: '변경' })
  const 책 = L1._안.책열기(버퍼(r.data))
  const 줄수 = (nm) => 책.sheets.find((s) => s.name === nm).시트.끝줄
  ok('내역서 34줄 → 19줄', 줄수('내역서') === 19, 줄수('내역서'))
  const 보고 = (nm) => r.report.sheets.find((x) => x.name === nm) || {}
  ok('검산 글의 줄 수 = 파일(내역서 34 → 19 · 원가계산서 44 → 24 · 마지막 줄이 지운 줄이어도)', 보고('내역서').줄전 === 34 && 보고('내역서').줄후 === 19 && 보고('원가계산서').줄후 === 24, [보고('내역서'), 보고('원가계산서')])
  ok('원가계산서 44줄 → 24줄', 줄수('원가계산서') === 24, 줄수('원가계산서'))
  ok('내역서 7줄 = 터파기 · 변경 수량 465(당초 420 아님)', 칸(책, '내역서', 'B7').v === '터파기(토사)' && 칸(책, '내역서', 'D7').v === '465', [칸(책, '내역서', 'B7'), 칸(책, '내역서', 'D7')])
  ok('내역서 7줄 금액 수식이 제 줄을 봄', 칸(책, '내역서', 'I7').f === 'TRUNC(D7*H7,0)' && 칸(책, '내역서', 'G7').f === 'I7+K7+M7', [칸(책, '내역서', 'I7').f, 칸(책, '내역서', 'G7').f])
  ok('공종 소계 = 변경 줄끼리 더한 것 → 1줄 품목 줄', 칸(책, '내역서', 'I6').f === 'I7+I8+I9', 칸(책, '내역서', 'I6').f)
  ok('순공사비 = 공종 소계 넷', 칸(책, '내역서', 'I5').f === 'I6+I10+I14+I17', 칸(책, '내역서', 'I5').f)
  ok('원가계산서 기호 «1» · «A» 남음(당초 줄에만 적힌 글)', 칸(책, '원가계산서', 'E5').v === '1' && 칸(책, '원가계산서', 'E7').v === 'A', [칸(책, '원가계산서', 'E5'), 칸(책, '원가계산서', 'E7')])
  ok('원가계산서 재료비 = 내역서 변경 합계 줄(→ 1줄 5줄)', 칸(책, '원가계산서', 'F5').f === '내역서!I5', 칸(책, '원가계산서', 'F5').f)
  ok('원가계산서 간접노무비 = 제 줄 셈', 칸(책, '원가계산서', 'F9').f === 'TRUNC(F8*0.146,0)', 칸(책, '원가계산서', 'F9').f)
  ok('머리 «금 ○○원» 이 1줄 도급액(24줄)을 봄', /TEXT\(F24,/.test(칸(책, '원가계산서', 'F3').f || ''), 칸(책, '원가계산서', 'F3').f)
  ok('대비표 당초 칸 = 그때 값(숫자)', 칸(책, '공사비증감대비표', 'C4').f == null && Number(칸(책, '공사비증감대비표', 'C4').v) > 0, 칸(책, '공사비증감대비표', 'C4'))
  ok('대비표 변경 칸 = 1줄 순공사비 줄을 봄', 칸(책, '공사비증감대비표', 'D4').f === '내역서!G5', 칸(책, '공사비증감대비표', 'D4').f)
  ok('엇갈림 0 · 깨짐 0', r.report.셈.엇갈림수 === 0 && r.report.셈.깨짐 === 0, r.report.셈)
  ok('굳힘 목록에 대비표 칸', r.report.굳힘.some((g) => g.ref === 'C4' && /내역서!G5/.test(g.원)), r.report.굳힘.slice(0, 3))
  ok('남길 = 당초 — 당초 수량 420', (() => { const r2 = L1.한줄로(buf, { sheets: [시('내역서').path], 남길: '당초' }); const b2 = L1._안.책열기(버퍼(r2.data)); return 칸(b2, '내역서', 'D7').v === '420' })())
  ok('없는 상태를 남기라면 멈춤', (() => { try { L1.한줄로(buf, { sheets: [시('내역서').path], 남길: '증감' }); return false } catch (e) { return /줄이 없습니다/.test(e.message) } })())
}

/* ── ② 1줄 파일은 2줄로 안 봄 ── */
console.log('② 1줄 파일은 «2줄 확실» 로 안 봄')
for (const p of ['web/public/tools/files/ex-twoline-1line.xlsx', 'tools/시험자료/2줄_여러공종.xlsx', 'tools/시험자료/2줄_퍼센트줄.xlsx', 'tools/시험자료/2줄_공유수식.xlsx']) {
  const 살 = L1.살펴보기(파일(p))
  const 확 = 살.sheets.filter((s) => s.확실)
  ok(`${path.basename(p)} — 확실한 2줄 시트 0`, 확.length === 0, 확.map((s) => [s.name, s.꼴, s.짝]))
}

/* ── ③ 되돌림 1줄 → 2줄 · 3줄 → 1줄 ── */
console.log('③ 되돌림 1줄 → 2줄 · 3줄 → 1줄 = 원래')
function 되돌림(buf, 고를, lines) {
  const b = L2.analyze(buf)
  const sheets = b.sheets.filter((s) => 고를.includes(s.name))
    .map((s) => ({ path: s.path, startRow: s.guessStart, endRow: s.guessEnd, labelCol: L2.suggestLabelCol(b.zip, s.path, s.guessStart, s.guessEnd, 16) }))
  const r2 = L2.convert(buf, { sheets, lines, color: 'blackred', diffFormula: true, labels: ['당초', '변경', '증감'] })
  const b2 = 버퍼(r2.data)
  const 살 = L1.살펴보기(b2)
  const 고른 = 살.sheets.filter((s) => 고를.includes(s.name) && s.짝 > 0)
  const r1 = L1.한줄로(b2, { sheets: 고른.map((s) => s.path), 남길: '변경', 딴시트: '잇기' })
  return { 원: L1._안.책열기(buf), 새: L1._안.책열기(버퍼(r1.data)), 고른: 고른.map((s) => s.name), report: r1.report }
}
function 견줌(원, 새) {
  const 틀 = []
  let 칸수 = 0
  for (const s of 원.sheets) {
    const t = 새.sheets.find((x) => x.name === s.name)
    if (!t) { 틀.push(s.name + ' 없음'); continue }
    for (const [r, row] of s.시트.rows) {
      for (const [c, cell] of row.cells) {
        const ref = L2.numToCol(c) + r
        const a = L1._안.칸(원, s.name, ref), b = L1._안.칸(새, s.name, ref) || {}
        if (!a || (a.f == null && a.v == null)) continue
        칸수++
        const af = a.f != null ? a.f.replace(/\s/g, '') : null, bf = b.f != null ? b.f.replace(/\s/g, '') : null
        /* 수식이 있으면 수식 글 · 없으면 값 */
        if (af != null ? af !== bf : String(a.v) !== String(b.v ?? '')) 틀.push(`${s.name}!${ref} ${af ?? a.v} → ${bf ?? b.v}`)
      }
    }
  }
  return { 칸수, 틀 }
}
for (const [p, 고를] of [
  ['web/public/tools/files/ex-twoline-1line.xlsx', ['원가계산서', '내역서']],
  ['tools/시험자료/2줄_여러공종.xlsx', ['내역서']],
  ['tools/시험자료/2줄_퍼센트줄.xlsx', ['원가계산서', '내역서']],
  ['tools/시험자료/2줄_공유수식.xlsx', ['내역서']],
]) {
  for (const lines of [2, 3]) {
    const t = 되돌림(파일(p), 고를, lines)
    const { 칸수, 틀 } = 견줌(t.원, t.새)
    ok(`${path.basename(p)} ${lines}줄 → 1줄 = 원래(칸 ${칸수})`, 틀.length === 0 && 칸수 > 20 && t.고른.length === 고를.length, { 고른: t.고른, 틀: 틀.slice(0, 4) })
  }
}

/* ── ④ 지어낸 작은 책 — 사고 꼴 잠금 ── */
console.log('④ 지어낸 작은 책 — 사고 꼴')
const 이스 = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
/* 시트들: [{이름, 줄: {줄번호: {열: 값|{f}}}, 병합: ['N15:N16']}] — 글은 inlineStr · 숫자는 그대로 · {f, v} 는 수식(v = 그때 값) */
function 작은책(시트들) {
  const z = {}
  z['[Content_Types].xml'] = strToU8('<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
    시트들.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('') +
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>')
  z['_rels/.rels'] = strToU8('<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>')
  z['xl/workbook.xml'] = strToU8('<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
    시트들.map((s, i) => `<sheet name="${이스(s.이름)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('') + '</sheets><calcPr calcId="191029"/></workbook>')
  z['xl/_rels/workbook.xml.rels'] = strToU8('<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    시트들.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('') +
    `<Relationship Id="rId${시트들.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`)
  z['xl/styles.xml'] = strToU8('<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="10"/><name val="맑은 고딕"/></font><font><sz val="10"/><color rgb="FFFF0000"/><name val="맑은 고딕"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="2"><xf fontId="0"/><xf fontId="1" applyFont="1"/></cellXfs></styleSheet>')
  시트들.forEach((s, i) => {
    const 줄들 = Object.keys(s.줄).map(Number).sort((a, b) => a - b)
    const sd = 줄들.map((r) => {
      const 칸들 = Object.entries(s.줄[r]).sort((a, b) => L2.colToNum(a[0]) - L2.colToNum(b[0])).map(([col, v]) => {
        const ref = col + r
        const st = s.빨강 && s.빨강.includes(r) ? ' s="1"' : ''
        if (v && typeof v === 'object') return `<c r="${ref}"${st}${typeof v.v === 'string' ? ' t="str"' : ''}><f>${이스(v.f)}</f>${v.v != null ? `<v>${이스(v.v)}</v>` : ''}</c>`
        if (typeof v === 'number') return `<c r="${ref}"${st}><v>${v}</v></c>`
        return `<c r="${ref}"${st} t="inlineStr"><is><t>${이스(v)}</t></is></c>`
      }).join('')
      return `<row r="${r}">${칸들}</row>`
    }).join('')
    const mg = s.병합 && s.병합.length ? `<mergeCells count="${s.병합.length}">${s.병합.map((m) => `<mergeCell ref="${m}"/>`).join('')}</mergeCells>` : ''
    z[`xl/worksheets/sheet${i + 1}.xml`] = strToU8(`<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sd}</sheetData>${mg}</worksheet>`)
  })
  return 버퍼(zipSync(z))
}
/* 2줄 내역서 — 품목 다섯(당초 · 변경) · 합계 SUMIF 라벨 칸 G */
function 이줄줄(덤 = {}) {
  const 줄 = { 1: { A: '내 역 서' }, 2: { A: '품 명', B: '규 격', C: '수 량', D: '단 가', E: '금 액', F: '비 고', G: '구분' } }
  const 품 = [['흙막이 판', 'H-300', 10, 12, 5000], ['보도블록', '300×300', 20, 22, 7000], ['경계석', '화강석', 30, 30, 9000], ['맨홀', 'D900', 2, 3, 150000], ['집수정', '1.0m', 4, 4, 80000]]
  let r = 3
  for (const [이름, 규격, 당, 변, 단가] of 품) {
    줄[r] = { A: 이름, B: 규격, C: 당, D: 단가, E: { f: `C${r}*D${r}`, v: String(당 * 단가) }, G: '당초' }
    줄[r + 1] = { C: 변, D: { f: `D${r}`, v: String(단가) }, E: { f: `C${r + 1}*D${r + 1}`, v: String(변 * 단가) }, G: '변경' }
    r += 2
  }
  줄[r] = { A: '합 계', E: { f: `SUMIF(G3:G${r - 1},"당초",E3:E${r - 1})`, v: '0' }, G: '당초' }
  줄[r + 1] = { E: { f: `SUMIF(G3:G${r - 1},"변경",E3:E${r - 1})`, v: '0' }, G: '변경' }
  return Object.assign(줄, 덤)
}
{
  /* 병합 아래 숨은 칸 — 덩이(5,6)의 H5:H6 병합 · 숨은 H6 에도 옛 글이 남아 있음 · I6 = H6 */
  const 줄 = 이줄줄()
  줄[5].H = '10억 미만'; 줄[6].H = '10억 미만'; 줄[6].I = { f: 'H6', v: '10억 미만' }
  const buf = 작은책([{ 이름: '내역서', 줄, 병합: ['H5:H6'], 빨강: [4, 6, 8, 10, 12, 14] }])
  const 살 = L1.살펴보기(buf)
  const s = 살.sheets[0]
  ok('작은 2줄 내역서 — 라벨 칸 G · 짝 6 · 확실', s.꼴 === '2줄' && s.짝 === 6 && s.확실 && s.라벨칸 === 'G', s)
  const r = L1.한줄로(buf, { sheets: [s.path] })
  const 책 = L1._안.책열기(버퍼(r.data))
  ok('병합 아래 숨은 칸을 보던 «=H6» → «=H4»(글로 굳히지 않음)', 칸(책, '내역서', 'I4').f === 'H4', 칸(책, '내역서', 'I4'))
  ok('합계 SUMIF «변경» → SUM(E3:E7)', /^SUM\(E3:E7\)$/.test(칸(책, '내역서', 'E8').f || ''), 칸(책, '내역서', 'E8').f)
  ok('변경 단가 «=D3»(당초 단가) → 값 12 아닌 단가 값 5000', 칸(책, '내역서', 'D3').v === '5000' && 칸(책, '내역서', 'D3').f == null, 칸(책, '내역서', 'D3'))
  ok('라벨 칸 G 는 비움', !칸(책, '내역서', 'G3').v && !칸(책, '내역서', 'G8').v, [칸(책, '내역서', 'G3'), 칸(책, '내역서', 'G8')])
}
{
  /* 사람이 쓴 괄호 · 끌어온 칸 하나 · 머리 칸 이음 · 다른 시트 */
  const 줄 = 이줄줄()
  줄[1].E = { f: 'E13*1', v: '0' }                                   /* 머리 칸이 지운(당초) 합계 줄만 봄 → 1줄 합계로 이음 */
  줄[1].D = 5000                                                     /* 당초 단가 «=D1» · 변경 단가 «=D3» → 끌어온 것 «D1» 하나 */
  줄[3].D = { f: 'D1', v: '5000' }; 줄[4].D = { f: 'D3', v: '5000' }
  const 집계 = { 1: { A: '집 계' }, 2: { A: '당초', B: { f: '내역서!E13', v: '0' }, C: { f: '(B2*1.1)', v: '0' } }, 3: { A: '변경', B: { f: '내역서!E14', v: '0' } } }
  const buf = 작은책([{ 이름: '내역서', 줄 }, { 이름: '집계', 줄: 집계 }])
  const 살 = L1.살펴보기(buf)
  const r = L1.한줄로(buf, { sheets: [살.sheets[0].path] })
  const 책 = L1._안.책열기(버퍼(r.data))
  ok('머리 칸 «=E13*1»(지운 당초 합계만 봄) → «=E8*1»(1줄 합계) · 이음 1', 칸(책, '내역서', 'E1').f === 'E8*1' && r.report.셈.이음 === 1, [칸(책, '내역서', 'E1').f, r.report.셈.이음])
  ok('끌어온 칸 하나는 괄호 없이 «=D1»(«=(D1)» 아님)', 칸(책, '내역서', 'D3').f === 'D1', 칸(책, '내역서', 'D3').f)
  ok('사람이 쓴 괄호 «=(B2*1.1)» 그대로(안 줄인 시트)', 칸(책, '집계', 'C2').f === '(B2*1.1)', 칸(책, '집계', 'C2').f)
  ok('다른 시트의 당초 칸 = 그때 값 · 변경 칸 = 1줄 합계', 칸(책, '집계', 'B2').f == null && 칸(책, '집계', 'B3').f === '내역서!E8', [칸(책, '집계', 'B2'), 칸(책, '집계', 'B3').f])
}
{
  /* 짝이 엇갈린 파일 — 변경 줄 수식이 모두 «다른 품목» 의 당초 줄을 봄 → 바꾸지 않고 멈춤 */
  const 줄 = { 1: { A: '내 역 서' }, 2: { A: '품 명', B: '규 격', C: '수 량', D: '단 가', E: '금 액', G: '구분' } }
  let r = 3
  for (let i = 0; i < 30; i++) {
    줄[r] = { A: '품목' + (i + 1), B: '규격', C: 1, D: 100, E: { f: `C${r}*D${r}`, v: '100' }, G: '당초' }
    줄[r + 1] = { C: { f: `C${r + 2 > 61 ? 3 : r + 2}`, v: '1' }, D: { f: `D${r + 2 > 61 ? 3 : r + 2}`, v: '100' }, E: { f: `E${r + 2 > 61 ? 3 : r + 2}`, v: '100' }, G: '변경' }
    r += 2
  }
  const buf = 작은책([{ 이름: '내역서', 줄 }])
  const 살 = L1.살펴보기(buf)
  ok('엇갈린 파일은 «확실» 이 아님', !살.sheets[0].확실, 살.sheets[0])
  let 멈춤 = ''
  try { L1.한줄로(buf, { sheets: [살.sheets[0].path] }) } catch (e) { 멈춤 = e.message }
  ok('바꾸려 하면 «짝이 맞지 않는 것 같아 바꾸지 않았습니다» 로 멈춤', /짝이 맞지 않는 것 같아 바꾸지 않았습니다/.test(멈춤), 멈춤)
}
{
  /* 1줄 → 2줄: 마지막 줄 뒤를 가리키는 범위 — SUM(E5:E20) 에서 20 이 마지막 줄(8) 뒤 */
  const 줄 = { 1: { A: '내 역 서' }, 2: { A: '품 명', B: '규 격', C: '수 량', D: '단 가', E: '금 액' } }
  for (let r = 3; r <= 8; r++) 줄[r] = { A: '품목' + r, B: '규격', C: r, D: 10, E: { f: `C${r}*D${r}`, v: String(r * 10) } }
  줄[1].F = { f: 'SUM(E5:E20)', v: '0' }
  const buf = 작은책([{ 이름: '내역서', 줄 }])
  const b = L2.analyze(buf)
  const s = b.sheets[0]
  const r2 = L2.convert(buf, { sheets: [{ path: s.path, startRow: 3, endRow: 8, labelCol: 'G' }], lines: 2, color: 'blackred', diffFormula: true, labels: ['당초', '변경', '증감'] })
  const 책 = L1._안.책열기(버퍼(r2.data))
  const f = 칸(책, '내역서', 'F1').f || ''
  const m = /E(\d+):E(\d+)/.exec(f)
  ok('xlsx2line — 마지막 줄 뒤 범위도 같이 밀림(거꾸로 · 짧아지지 않음)', !!m && +m[1] < +m[2] && +m[2] === 26, f)
}

{
  /* 두 덩이에 걸친 병합 아래 숨은 남길 칸에 제 수식 — «MIN(G4:G6)»(변경) 을 써야 함(보이는 당초 칸 «MIN(G3:G5)» 아님) · 병합도 남음
     + 다른 시트의 한 줄 범위가 지운 줄에 있으면 #REF! 대신 남긴 줄 */
  const 줄 = 이줄줄()
  줄[3].H = { f: 'MIN(I3:I5)', v: '1' }; 줄[4].H = { f: 'MIN(I4:I6)', v: '1' }
  for (let r = 3; r <= 6; r++) 줄[r].I = r
  const 표 = { 1: { A: '총괄' }, 2: { A: { f: 'INDEX(내역서!A3:F3,1,1)', v: '흙막이 판' } } }
  const buf = 작은책([{ 이름: '내역서', 줄, 병합: ['H3:H6'] }, { 이름: '총괄', 줄: 표 }])
  const 살 = L1.살펴보기(buf)
  const r = L1.한줄로(buf, { sheets: [살.sheets[0].path] })
  const 책 = L1._안.책열기(버퍼(r.data))
  ok('병합 아래 숨은 남길 칸의 제 수식 «MIN(I4:I6)» → «MIN(I3:I4)»(당초 «MIN(I3:I5)» → «MIN(I3:I3)» 아님)', 칸(책, '내역서', 'H3').f === 'MIN(I3:I4)', 칸(책, '내역서', 'H3').f)
  const 병합 = 책.sheets.find((x) => x.name === '내역서').시트.merges.map((m) => `${L2.numToCol(m.c1)}${m.r1}:${L2.numToCol(m.c2)}${m.r2}`)
  ok('병합 H3:H4 남음', 병합.includes('H3:H4'), 병합)
  ok('다른 시트 한 줄 범위(지운 당초 줄 A3:F3) → #REF! 아니고 남긴 줄 A3:F3', 칸(책, '총괄', 'A2').f === 'INDEX(내역서!A3:F3,1,1)' && r.report.셈.깨짐 === 0, [칸(책, '총괄', 'A2').f, r.report.셈.깨짐])
}
{
  /* xlsx2line — 다른 통합 문서 «[1]내역서!H5» 는 그대로 */
  const 줄 = { 1: { A: '내 역 서', F: { f: '[1]내역서!H5+H5', v: '0' } }, 2: { A: '품 명', B: '규 격', C: '수 량', D: '단 가', E: '금 액' } }
  for (let r = 3; r <= 8; r++) 줄[r] = { A: '품목' + r, B: '규격', C: r, D: 10, E: { f: `C${r}*D${r}`, v: String(r * 10) } }
  const buf = 작은책([{ 이름: '내역서', 줄 }])
  const b = L2.analyze(buf)
  const r2 = L2.convert(buf, { sheets: [{ path: b.sheets[0].path, startRow: 3, endRow: 8, labelCol: 'G' }], lines: 2, color: 'blackred', diffFormula: true, labels: ['당초', '변경', '증감'] })
  const 책 = L1._안.책열기(버퍼(r2.data))
  const f = 칸(책, '내역서', 'F1').f || ''
  ok('xlsx2line — 다른 통합 문서 «[1]내역서!H5» 그대로 · 이 책 «H5» 는 옮김(→ H7)', f === '[1]내역서!H5+H7', f)
}

console.log(`\n${bad ? '❌' : '✅'} 2줄 → 1줄 시험 ${n}개 중 ${n - bad} 맞음 · ${bad} 틀림`)
process.exit(bad ? 1 : 0)
