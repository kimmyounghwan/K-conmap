/**
 * 📏 G685 «캐드에서 고른 것» 엑셀 시험 — 캐드시트 → 받기 전 검사(lib/받기전검사.js) · 다시 읽어 값 대조 (클라우드 — web/node_modules 의 fflate 를 씀 · PC 올리기 시험에는 안 넣음)
 * 쓰는 법: node tools/시험_캐드고름엑셀.mjs
 */
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'

const 뿌리 = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const 들 = (n) => import(pathToFileURL(path.join(뿌리, 'web', 'src', 'lib', n)).href)
const m = await 들('캐드고름.js')
const { ST } = await 들('qtoxlsx.js')
const 검 = await 들('받기전검사.js')
const { 엑셀읽기 } = await 들('엑셀읽기.js')
let 됨 = 0
const 틀 = []
const 봄 = (조건, 글) => { if (조건) { 됨++; console.log('  ✓ ' + 글) } else { 틀.push(글); console.log('  ✗ ' + 글) } }
console.log('📏 G685 캐드 고름 엑셀 시험')

const 읽 = m.고름읽기(m.예시고름글())
const r = m.줄만들기(읽, { 이름: '예시', 층: '1' })
const 핸 = (h) => r.줄.find((x) => x.핸들 === h)
const 줄번 = (h) => r.줄.findIndex((x) => x.핸들 === h) + 2          // 엑셀 행(1행 = 머리)
Object.assign(핸('1A1'), { 갈래: '길이높이', 높이: '2.8' })
Object.assign(핸('1A2'), { 갈래: '길이높이' })                         // 높이 빈칸 → ❓
Object.assign(핸('1A5'), { 치수씀: true })                             // 치수 7,400 으로
Object.assign(핸('1C1'), { 갈래: '면적두께', 두께: '0.15', 공제: '0.5', 횟수: '2' })   // 거실 27 ㎡
const 캐드 = { 묶음: [r.묶음], 줄: r.줄 }
const C = m.캐드셈(캐드)
const { sheets, 맞댈 } = m.캐드시트(캐드, ST, C)
봄(sheets.length === 2 && sheets[0].name === '캐드고름' && sheets[1].name === '캐드집계', '시트 둘 — 캐드고름(줄마다) · 캐드집계')
봄(sheets[0].rows.length === C.셈.length, `캐드고름 줄 = 화면 줄 ${C.셈.length}`)
const res = 검.받기전검사(sheets, 맞댈)
봄(res.통과, '받기 전 검사 통과 — ' + res.줄.filter((x) => !x.됨).map((x) => x.글).join(' / '))
봄(res.줄.some((x) => x.글.includes('줄마다 수량') && x.됨) && res.줄.filter((x) => x.글.startsWith('📏 캐드 고름 합')).length === Object.keys(C.합).length, '맞댐 — 줄마다 수량 · 단위마다 합')
const 책 = 엑셀읽기(res.바이트)
봄(책.시트들.map((s) => s.이름).join() === '검사 결과,캐드고름,캐드집계', '받은 파일 = 검사 결과 + 두 시트')
const 칸 = (시트, ref) => { const s = 책.시트들.find((x) => x.이름 === 시트); const c = s && s.칸.get(ref); return c ? c.v : undefined }
const a = 줄번('1A1'), b = 줄번('1A2'), c = 줄번('1A5'), d = 줄번('1C1')
봄(String(칸('캐드고름', 'B' + a)) === '외벽' && Number(칸('캐드고름', 'F' + a)) === 28 && String(칸('캐드고름', 'H' + a)) === '10 × 2.8', `1A1 — 외벽 · 10 × 2.8 = 28 ㎡ (${칸('캐드고름', 'F' + a)})`)
봄(String(칸('캐드고름', 'F' + b)).startsWith('❓') && String(칸('캐드고름', 'F' + b)).includes('높이'), `1A2 — 높이 빈칸 → «${칸('캐드고름', 'F' + b)}»`)
봄(Number(칸('캐드고름', 'F' + c)) === 7.4 && String(칸('캐드고름', 'T' + c)).includes('치수 값으로 셈'), '1A5 — 치수 7,400 으로 셈 · 근거에 적음')
봄(Number(칸('캐드고름', 'F' + d)) === 7.1 && String(칸('캐드고름', 'H' + d)) === '(27 × 0.15 − 0.5) × 2', `1C1 거실 — (27 × 0.15 − 0.5) × 2 = ${칸('캐드고름', 'F' + d)} ㎥`)
봄(String(칸('캐드고름', 'T' + d)).includes('안 글자 «거실»') && String(칸('캐드고름', 'T' + d)).includes('핸들 1C1') && String(칸('캐드고름', 'T' + d)).includes('(0.0, 0.0) mm'), '근거 칸 — 도면 · 레이어 · 핸들 · 좌표 · 안 글자: ' + 칸('캐드고름', 'T' + d))
const 집 = 책.시트들.find((x) => x.이름 === '캐드집계')
const 합줄 = [...집.칸].filter(([ref, c]) => /^A\d+$/.test(ref) && String(c.v).startsWith('합계 ')).map(([ref, c]) => [String(c.v), Number(집.칸.get('F' + ref.slice(1)).v)])
봄(합줄.length === Object.keys(C.합).length && 합줄.every(([k, v]) => Math.abs(v - C.합[k.slice(3)]) < 1e-9), '집계 «합계 m · ㎡ · ㎥ · 개» = 화면 합 ' + JSON.stringify(합줄))

/* 고장 흉내 — 엑셀 값이 화면과 다르면 못 통과 */
const 망 = JSON.parse(JSON.stringify(sheets))
망[0].rows[0][5] = { v: 99, st: ST.QTY }
망[1].rows[망[1].rows.length - 1][5] = { v: 1, st: ST.QTY }
const 못 = 검.받기전검사(망, 맞댈)
봄(!못.통과 && 못.줄.some((x) => !x.됨 && x.글.includes('줄마다')) && 못.줄.some((x) => !x.됨 && x.글.includes('합(')), '(시험의 시험) 엑셀 줄 · 합을 바꾸면 못 통과 — 둘 다 잡음')

console.log(`\n결과: ${됨} 통과 · ${틀.length} 틀림`)
if (틀.length) { for (const t of 틀) console.log('  ✗ ' + t); process.exit(1) }
