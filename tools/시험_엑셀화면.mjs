// 📄 엑셀 화면(원클릭·수량산출서) 시험 — node tools/시험_엑셀화면.mjs  (web 폴더의 node_modules 를 씁니다)
// 2026-09-27 · 셈은 리브레오피스와 대조했습니다(원클릭 389식 × 입력 3벌 · 수량산출서 118식 — 모두 같음).
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const 여기 = path.dirname(fileURLToPath(import.meta.url))
const W = path.join(여기, '..', 'web')
const 가져 = (p) => import(path.join(W, p))
const { 엑셀읽기 } = await 가져('src/lib/엑셀읽기.js')
const { 셈판, 형식글, 수식짜기 } = await 가져('src/lib/엑셀수식.js')
const { 고친엑셀 } = await 가져('src/lib/엑셀쓰기.js')
const { fillWorkbook } = await 가져('src/lib/wonclick.js')
const { run } = await 가져('src/lib/qto.js')

let 틀림 = 0
const 봄 = (이름, 참, 더 = '') => { if (!참) 틀림++; console.log((참 ? '  ✓ ' : '  ✗ ') + 이름 + (더 ? ' — ' + 더 : '')) }

// ── 표시 형식
const 형 = [
  [123456, '#,##0', '123,456'], [-1234.5, '#,##0;[Red]-#,##0', '-1,235'], [0.1234, '0.0%', '12.3%'],
  [3.14159, '0.000', '3.142'], [46086, 'yyyy-mm-dd', '2026-03-05'], [118, '0"일"', '118일'],
  [1234567.891, '#,##0.00', '1,234,567.89'], [0.5, 'General', '0.5'], [1e-10, 'General', '1E-10'], [0.0000001, 'General', '1E-07'], [0.000123, 'General', '0.000123'],
  [46086, 'yyyy"년" m"월" d"일"', '2026년 3월 5일'], ['글', '@', '글'], [340, '#,##0.000', '340.000'],
]
for (const [v, f, 기대] of 형) { const g = 형식글(v, f).글; 봄(`형식 ${f} (${v})`, g === 기대, g) }

// ── 수식
const 한책 = { 시트들: [{ 이름: 'S', 칸: new Map([
  ['A1', { v: 2, f: null, s: 0, 행: 1, 열: 1 }], ['A2', { v: 3, f: null, s: 0, 행: 2, 열: 1 }], ['A3', { v: null, f: null, s: 0, 행: 3, 열: 1 }],
  ['B1', { v: '가', f: null, s: 0, 행: 1, 열: 2 }], ['B2', { v: '나', f: null, s: 0, 행: 2, 열: 2 }], ['B3', { v: '가', f: null, s: 0, 행: 3, 열: 2 }],
]) }], 이름들: [] }
const 식 = (f) => { 한책.시트들[0].칸.set('Z9', { v: null, f, s: 0, 행: 9, 열: 26 }); return 셈판(한책).칸값('S', 9, 26) }
const 식들 = [
  ['A1+A2*2', 8], ['-2^2', 4], ['ROUND(2.345,2)', 2.35], ['ROUND(-2.345,2)', -2.35], ['ROUNDUP(1.201,1)', 1.3], ['INT(-1.5)', -2], ['MOD(-3,5)', 2],
  ['"a"&A1&"b"', 'a2b'], ['IF(A3="","빈칸","아님")', '빈칸'], ['IF(A1>1,"큼")', '큼'], ['CHOOSE(2,"일","이","삼")', '이'],
  ['SUMPRODUCT(--(B1:B3="가"))', 2], ['SUMPRODUCT((B1:B3="가")*A1:A3)', 2], ['SUM(A1:A3)', 5], ['FIXED(1234567.5,0)', '1,234,568'],
  ['YEAR(46086)&"-"&MONTH(46086)&"-"&DAY(46086)', '2026-3-5'], ['EDATE(46086,1)', 46117], ['DATE(2026,3,5)', 46086], ['A1/0', { 오류: '#DIV/0!' }],
  ['OR(A3="",A1=0)', true], ['TEXT(0.25,"0%")', '25%'], ['50%', 0.5],
]
for (const [f, 기대] of 식들) { const v = 식(f); 봄(`=${f}`, JSON.stringify(v) === JSON.stringify(기대), JSON.stringify(v)) }
let 짜임 = true
try { 수식짜기("'입력'!$C$6&\"\"") } catch (e) { 짜임 = false }
봄('시트 이름 붙은 주소 짜기', 짜임)

// ── 원클릭 틀 전체
const META = JSON.parse(fs.readFileSync(path.join(W, 'src/data/wonclick.json'), 'utf8'))
const tpl = new Uint8Array(fs.readFileSync(path.join(W, 'public/tools/files/k-conmap-wonclick.xlsx')))
const vals = {}
for (const i of META.inputs) if (i.ex != null && i.ex !== '') vals[i.key] = i.ex
const out = fillWorkbook(tpl, META, vals, META.docs.map((d) => d.sheet))
const 책 = 엑셀읽기(out)
const 셈 = 셈판(책)
let n = 0, 오 = 0
for (const s of 책.시트들) for (const [, x] of s.칸) if (x.f) { n++; const v = 셈.칸값(s.이름, x.행, x.열); if (v && typeof v === 'object' && '오류' in v) 오++ }
봄('원클릭 수식 390개 · 오류 0 (G129 공사대장 «공기 연장» 1식 더함)', n === 390 && 오 === 0, `${n}식 · 오류 ${오}`)
const 착 = '06 착공신고서'
const 글 = (시, ref) => { const s = 책.시트들.find((x) => x.이름 === 시); const x = s.칸.get(ref); return 형식글(셈.값(시, ref), 책.스타일.형식[책.스타일.xfs[x.s].형식번호] || (책.스타일.xfs[x.s].형식번호 ? 'General' : 'General')).글 }
봄('착공신고서 계약금액 한글', /일금 일억이천삼백사십오만육천원정 \(₩123,456,000\)/.test(글(착, 'E7')), 글(착, 'E7'))
봄('착공신고서 공사기간 118일', /118일/.test(글(착, 'E8')), 글(착, 'E8'))
봄('인쇄 영역·용지 읽음', (() => { const s = 책.시트들.find((x) => x.이름 === 착); return s.인쇄영역 && s.인쇄영역.c2 === 13 && s.용지.맞춤 && !s.용지.가로 })())

// ── 고친 칸: 따라 바뀜 + 엑셀에 들어감
const 고침 = { '입력!C14': 200000000, [착 + '!E4']: '고친 공사명' }
const 셈2 = 셈판(책, 고침)
봄('입력을 고치면 서류가 따라 바뀜', /일금 이억원정/.test(String(셈2.값(착, 'E7'))), String(셈2.값(착, 'E7')))
const 고친 = 고친엑셀(out, 책, 고침)
const 책2 = 엑셀읽기(고친)
const e4 = 책2.시트들.find((x) => x.이름 === 착).칸.get('E4')
봄('고친 칸이 엑셀에 값으로 들어감(수식 대신)', e4 && e4.v === '고친 공사명' && !e4.f, JSON.stringify(e4 && { v: e4.v, f: e4.f }))
const c14 = 책2.시트들.find((x) => x.이름 === '입력').칸.get('C14')
봄('숫자로 고친 칸은 숫자', c14 && c14.v === 200000000)
봄('고친 엑셀도 셈이 같음', String(셈판(책2).값(착, 'E7')) === String(셈2.값(착, 'E7')))
봄('없던 칸도 넣음', (() => { const b = 고친엑셀(out, 책, { [착 + '!P40']: '새 칸' }); const s = 엑셀읽기(b).시트들.find((x) => x.이름 === 착); return s.칸.get('P40') && s.칸.get('P40').v === '새 칸' })())

// ── 수량산출서(견본)
const P = path.join(W, 'public/jeoksan/')
let text = fs.readFileSync(P + '치수표_견본.csv')
try { text = new TextDecoder('utf-8', { fatal: true }).decode(text) } catch { text = new TextDecoder('euc-kr').decode(text) }
const res = run(new Uint8Array(fs.readFileSync(P + '재료표_토목.xlsx')).buffer, '재료표_토목.xlsx', text, '치수표_견본.csv')
const q책 = 엑셀읽기(res.bytes)
const q셈 = 셈판(q책)
let q오 = 0, qn = 0
for (const s of q책.시트들) for (const [, x] of s.칸) if (x.f) { qn++; const v = q셈.칸값(s.이름, x.행, x.열); if (v && typeof v === 'object') q오++ }
봄('수량산출서 수식 · 오류 0', qn > 50 && q오 === 0, `${qn}식 · 오류 ${q오}`)
const 산 = q책.시트들.find((s) => s.이름 === '산출서')
let 합K = 0
for (let r = 2; r <= 산.끝행; r++) { const v = q셈.칸값('산출서', r, 11); if (typeof v === 'number') 합K += v }
const 집 = q책.시트들.find((s) => s.이름 === '집계')
let 합E = 0
for (let r = 2; r <= 집.끝행; r++) { const v = q셈.칸값('집계', r, 5); if (typeof v === 'number') 합E += v }
봄('집계 합계 = 산출서 수량 합계', Math.abs(합K - 합E) < 1e-6, `${합K.toFixed(3)} / ${합E.toFixed(3)}`)

console.log(틀림 ? `✗ ${틀림}` : '✓ 모두 맞음')
process.exit(틀림 ? 1 : 0)
