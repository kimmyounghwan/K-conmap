/* 🧪 G327 (2026-10-20) 설계변경 2줄 자동변환(lib/xlsx2line.js) — 다시 안 틀리게 잠금
 *   소장님: 「내역서 부터 차례 차례 검증하자」 「차례 차례 하나씩 가자. 단, 완벽에 가깝게 해서」
 *   실제로 넣어 보니 틀린 셋(화면은 «고치지 못한 수식은 없습니다»):
 *   ① 원가계산서를 같이 안 고르면 =내역서!$G$54 가 옛 행을 가리킨 채 남음 → 다시 셈하면 도급액 0원
 *   ② 식 «안» 의 SUM(범위)(조달수수료 · 공구손료 같은 %줄)는 당초 · 변경을 두 번 셈 → 아무것도 안 바꿨는데 증감 −51만 원
 *   ③ 공유수식의 따라가는 칸은 값만 남음 → 변경 수량을 고쳐도 금액이 안 바뀜
 *   + 머리 두 줄(«단 가 · 금 액» 아랫줄)도 자료로 보고 세 벌 만듦
 *   숫자는 시험장에서 리브레오피스로 «캐시 버리고» 다시 셈 + «원본에서 같은 수량을 바꿔 셈한 값» 과 대조했습니다(기록_2026-10.md).
 *   여기서는 그 결과를 지키는 «꼴» 을 잠급니다.
 *   node tools/시험_2줄.mjs */
import { readFileSync } from 'node:fs'
import { analyze, convert, readGrid, suggestLabelCol } from '../web/src/lib/xlsx2line.js'
let 셈 = 0, 틀림 = 0
const 봄 = (뜻, ok, 덧 = '') => { 셈++; if (!ok) 틀림++; console.log((ok ? '✓ ' : '✗ ') + 뜻 + (덧 !== '' ? ' — ' + 덧 : '')) }
const 읽기 = (이름) => { const b = readFileSync(new URL('./시험자료/' + 이름, import.meta.url)); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) }
/* 화면(TwoLine.jsx)과 같은 차림으로 바꿉니다 */
function 바꾸기(buf, 고를, lines = 3) {
  const b = analyze(buf)
  const sheets = b.sheets.filter((s) => 고를.includes(s.name))
    .map((s) => ({ path: s.path, startRow: s.guessStart, endRow: s.guessEnd, labelCol: suggestLabelCol(b.zip, s.path, s.guessStart, s.guessEnd, 16) }))
  const res = convert(buf, { sheets, lines, color: 'blackred', diffFormula: true, labels: ['당초', '변경', '증감'] })
  const out = analyze(res.data.buffer.slice(res.data.byteOffset, res.data.byteOffset + res.data.byteLength))
  const 시트 = (nm) => out.sheets.find((s) => s.name === nm)
  const 칸 = (nm, ref) => {
    const m = /^([A-Z]+)(\d+)$/.exec(ref); const s = 시트(nm)
    const col = m[1].split('').reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0)
    const g = readGrid(out.zip, s.path, +m[2], +m[2], Math.max(col, 20))
    return g.rows.length ? g.rows[0].cells[col - 1] : ''
  }
  const 줄들 = (nm, maxCol = 20) => readGrid(out.zip, 시트(nm).path, 1, 2000, maxCol).rows
  return { b, sheets, res, out, 칸, 줄들, warns: res.report.warns }
}

/* ── 머리 두 줄 ── */
{
  const b = analyze(읽기('2줄_여러공종.xlsx'))
  const s = b.sheets.find((x) => x.name === '내역서')
  봄('머리 두 줄(«단 가 · 금 액» 아랫줄) 건너뜀 — 시작 행 5(전엔 4)', s.guessStart === 5, s.guessStart)
}

/* ① 내역서만 고름 — 원가계산서는 «당초» 줄을 봄 · 그렇다고 알림 */
{
  const t = 바꾸기(읽기('2줄_여러공종.xlsx'), ['내역서'])
  봄('원가계산서 F4 = 내역서!J5 · 그 행은 «당초» 줄', t.칸('원가계산서', 'F4') === '=내역서!J5' && t.칸('내역서', 'A5') === '당초', t.칸('원가계산서', 'F4') + ' · ' + t.칸('내역서', 'A5'))
  봄('원가계산서가 내역서를 가리킨다고 알림(«당초» 줄 · 같이 고르라고)', t.warns.some((w) => /«내역서» 를 가리킵니다/.test(w.msg) && /당초/.test(w.msg)), t.warns.map((w) => w.msg.slice(0, 40)).join(' | '))
}
{
  const t = 바꾸기(읽기('2줄_퍼센트줄.xlsx'), ['내역서'])
  const 관 = t.칸('원가계산서', 'B3')
  봄('원가계산서 관급 SUMIF(내역서 범위) → SUMIFS(… «당초»)', /^=SUMIFS\(내역서!\$G\$\d+:\$G\$\d+,내역서!\$N\$\d+:\$N\$\d+,"관급",내역서!\$\w+\$\d+:\$\w+\$\d+,"당초"\)$/.test(관), 관)
  봄('원가계산서 직노 =내역서!I9 → 당초 합계 행', /^=내역서!I\d+$/.test(t.칸('원가계산서', 'B4')) && t.칸('원가계산서', 'B4') !== '=내역서!I9', t.칸('원가계산서', 'B4'))
  /* ② %줄 — 식 안의 SUM(범위)를 줄별로 */
  const L = suggestLabelCol(t.b.zip, t.b.sheets.find((s) => s.name === '내역서').path, 3, 9, 16)
  const ci = L.charCodeAt(0) - 64
  const rows = t.줄들('내역서', Math.max(ci, 16))
  const 줄 = (품, 라) => rows.find((r) => r.cells[1] === 품 && r.cells[ci - 1] === 라)
  const 조당 = 줄('조달수수료', '당초'), 조변 = 줄('조달수수료', '변경')
  봄('조달수수료 당초 — SUM(G3:G5)가 SUMIF(…,"당초",…)', 조당 && /SUMIF\([^)]*"당초"/.test(조당.cells[5]) && !/"변경"/.test(조당.cells[5]), 조당 && 조당.cells[5])
  봄('조달수수료 변경 — SUMIF(…,"변경",…) · G6 은 변경 줄', 조변 && /SUMIF\([^)]*"변경"/.test(조변.cells[5]), 조변 && 조변.cells[5])
  const 공변 = 줄('공구손료', '변경')
  봄('공구손료 변경 — ROUNDDOWN(SUM(I…)*0.03) 이 SUMIF(…,"변경",…)', 공변 && /ROUNDDOWN\(SUM\(SUMIF\([^)]*"변경"[^)]*\)\)\*0\.03,0\)/.test(공변.cells[9]), 공변 && 공변.cells[9])
  봄('범위를 못 가른 칸 경고 없음', !t.warns.some((w) => /못 갈랐습니다/.test(w.msg)), t.warns.map((w) => w.msg.slice(0, 30)).join(' | '))
}
/* 원가계산서도 같이 — A값 SUMIF(제 시트 범위) 도 줄별로 */
{
  const t = 바꾸기(읽기('2줄_퍼센트줄.xlsx'), ['원가계산서', '내역서'])
  const rows = t.줄들('원가계산서', 6)
  const A = rows.filter((r) => r.cells[0] === 'A값')
  봄('원가 A값 당초 · 변경 — SUMIFS(…,"O",…,"당초"/"변경")', A.length === 2 && /"O",\$D\$\d+:\$D\$\d+,"당초"\)/.test(A[0].cells[1]) && /"변경"\)/.test(A[1].cells[1]), A.map((r) => r.cells[1]).join(' | '))
  const 관 = rows.filter((r) => r.cells[0] === '관급자재비')
  봄('원가 관급 변경 줄 → 내역서 «변경» 줄만', 관.length === 2 && /"변경"\)$/.test(관[1].cells[1]), 관.map((r) => r.cells[1]).join(' | '))
  봄('경고 없음(줄별로 다 가름)', t.warns.length === 0, t.warns.map((w) => w.msg.slice(0, 30)).join(' | '))
}
/* 범위 안에 안 벌린 행이 있으면 «전체 − 다른 줄» */
{
  const t = 바꾸기(읽기('2줄_여러공종.xlsx'), ['내역서'])
  const f = t.칸('내역서', 'H5')
  const 본 = [...f.matchAll(/H(\d+)/g)].map((m) => +m[1])
  봄('총괄 당초 H5 = 공종 «당초» 줄만 더함', t.칸('내역서', 'A5') === '당초' && 본.length > 2 && 본.every((r) => t.칸('내역서', 'A' + r) === '당초'), f)
  const g = t.칸('내역서', 'H6')
  const 본2 = [...g.matchAll(/H(\d+)/g)].map((m) => +m[1])
  봄('총괄 변경 H6 = 공종 «변경» 줄만 더함', 본2.length > 2 && 본2.every((r) => t.칸('내역서', 'A' + r) === '변경'), g)
}
/* ③ 공유수식 */
{
  const t = 바꾸기(읽기('2줄_공유수식.xlsx'), ['내역서'])
  봄('공유수식 «값만 남김» 경고 없음', !t.warns.some((w) => /공유수식/.test(w.msg)), t.warns.map((w) => w.msg.slice(0, 30)).join(' | '))
  const rows = t.줄들('내역서', 13)
  const 변 = rows.find((r) => r.cells[2] === '되메우기 및 다짐' && r.cells[0] === '변경')
  봄('따라가는 칸(되메우기 변경 줄) L = TRUNC(E행*K행,0) — 제 행', 변 && 변.cells[11] === `=TRUNC(E${변.r}*K${변.r},0)`, 변 && `${변.r} ${변.cells[11]}`)
}
/* 2줄 — «증감» 없이 */
{
  const t = 바꾸기(읽기('2줄_퍼센트줄.xlsx'), ['원가계산서', '내역서'], 2)
  const rows = t.줄들('원가계산서', 6)
  봄('2줄이면 라벨은 당초 · 변경 둘', rows.some((r) => r.cells[3] === '변경') && !rows.some((r) => r.cells[3] === '증감'))
}
/* 못 가르는 범위는 숨기지 않고 알림 */
{
  const m = await import('../web/src/lib/xlsx2line.js')
  const o = { k: 0, isDup: true, self: { dup: new Set([3, 4, 5]), mapBase: (r) => r, labelCol: 'P' }, selfName: '내역서', plans: new Map(), labels: ['당초', '변경', '증감'], gs: 3, warns: [], ref: 'X1', holes: [] }
  const t1 = m.sumInside('AVERAGE(G3:G5)+SUM(G3:G5)', o)
  봄('SUM(범위) 는 자리표로 · AVERAGE 범위는 그대로', /AVERAGE\(G3:G5\)\+SUM\("§0§"\)/.test(t1) && /SUMIF\(\$P\$3:\$P\$7,"당초",G3:G7\)/.test(o.holes[0]), t1 + ' · ' + o.holes[0])
}
console.log(`\n${셈}개 중 틀림 ${틀림}`)
process.exit(틀림 ? 1 : 0)
