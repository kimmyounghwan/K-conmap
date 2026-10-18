/* 🧪 G321 하도급 계약서류 «예시 화면» 미리 짓기 — node tools/build_하도급서류예시화면.mjs [--check]
   소장님: 「보기만 가능 내려받기 없이, 실수없게 … 상품으로 팔아야 하니까」
   ■ 이용자 화면에는 «만드는 엔진 · 서류 틀 · 수식» 이 가지 않게, 예시 한 벌을 여기서 미리 지어
     «값만 남긴 화면 자료»(수식 없음 · 엑셀 파일 조각 없음)로 web/src/data/하도급서류_예시화면.js 에 둡니다.
     → 이용자 브라우저에는 엑셀 파일도, 수식으로 이어진 틀도 없습니다(화면에 보이는 글자 · 숫자 · 꼴뿐).
   ■ --check: 지금 엔진으로 다시 지은 것과 파일이 같은지만 봄(다르면 exit 1 — 틀 · 엔진을 고치고 다시 짓는 것을 잊지 않게).
*/
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'
const 여기 = dirname(fileURLToPath(import.meta.url))
const 웹 = join(여기, '..', 'web', 'src')
const m = await import(pathToFileURL(join(웹, 'lib', '비율.js')).href)
const h = await import(pathToFileURL(join(웹, 'lib', '하도급내역.js')).href)
const d = await import(pathToFileURL(join(웹, 'lib', '하도급서류.js')).href)
const k = await import(pathToFileURL(join(웹, 'lib', '하도급서류칸.js')).href)
const x = await import(pathToFileURL(join(웹, 'lib', '엑셀읽기.js')).href)
const 수 = await import(pathToFileURL(join(웹, 'lib', '엑셀수식.js')).href)
const 예 = await import(pathToFileURL(join(웹, 'data', '하도급서류_예시.js')).href)

/* 화면의 예시보기와 똑같은 길(HadoDocs.jsx 예시보기) */
const g = m.격자로읽기(예.예시책, 예.예시파일이름, { 원가품목: true })
const 읽은 = m.시트고르기(g, m.고를만한시트(g.시트들))
const 옵션 = { 율: 80, 단수꼴: '버림', 관급그대로: true, 직접: new Set(h.직접후보(읽은)) }
const 준비 = d.서류준비(읽은, 예.예시책, 옵션)
const 채 = k.제안채우기(예.예시값, d.맥락(준비, 예.예시값))
const 결 = d.서류한벌({ 읽은, 책: 예.예시책, 옵션, 값: 채.값, 준비, 보기용: true, 맥: { 제안: new Set(), 근거: {} } })
const 책 = x.엑셀읽기(결.bytes)

/* 수식 → 셈한 값, 수식 지움 · 이름 정의(수식에 쓰는 이름)는 지우고 인쇄 영역 · 머리행은 이미 시트에 풀려 있음 */
const 셈 = 수.셈판(책, {})
let 수식수 = 0
for (const s of 책.시트들) {
  for (const [주소, 칸] of s.칸) {
    if (!칸.f) { delete 칸.f; continue }
    const p = /^([A-Z]+)(\d+)$/.exec(주소)
    const v = 셈.칸값(s.이름, +p[2], x.열번호(p[1]))
    if (v && typeof v === 'object') throw new Error(`셈 오류 ${s.이름}!${주소} ${JSON.stringify(v)}`)
    칸.v = v
    delete 칸.f
    for (const 키 of Object.keys(칸)) if (/^(f|식|공유|si|ref|t식)$/.test(키)) delete 칸[키]
    수식수++
  }
  delete s.길
}
const 날 = {
  판: 1,
  시트들: 책.시트들, 스타일: 책.스타일, 이름들: [], 날짜1904: 책.날짜1904,
  시트: 결.시트, 제출: 결.제출, 원자료: 결.원자료,
}
const 글 = JSON.stringify(날, (키, v) => {
  if (v instanceof Map) return { $맵: [...v.entries()] }
  if (v instanceof Set) return { $모음: [...v] }
  if (v instanceof Uint8Array) throw new Error('바이트가 섞임: ' + 키)
  return v
})
/* 틀 · 엔진이 따라오지 않았는지 — 수식 흔적 없음 */
if (/"f":/.test(글)) throw new Error('수식이 남음')
/* 실제 회사 낱말은 틀을 지을 때(build_하도급서류틀.py) 이미 막음 — 여기 들어오는 값은 지어낸 예시(하도급서류_예시.js)뿐 */

const 파일글 = `/* 🧪 G321 하도급 계약서류 «예시 화면» — tools/build_하도급서류예시화면.mjs 가 지음(손으로 고치지 마십시오)
   지어낸 예시(하도급서류_예시.js)를 미리 지어 «값만» 남긴 화면 자료입니다 — 수식 · 엑셀 파일 조각 · 서류 틀 없음.
   이용자는 이것만 받아 화면으로 봅니다(받기 · 인쇄 없음). 수식 칸 ${수식수}개는 셈한 값으로 바꿈. */
const 날 = ${JSON.stringify(글)}
const 되살림 = (키, v) => (v && typeof v === 'object' && !Array.isArray(v) ? (v.$맵 ? new Map(v.$맵) : v.$모음 ? new Set(v.$모음) : v) : v)
export function 예시화면() { return JSON.parse(날, 되살림) }
`
const 길 = join(웹, 'data', '하도급서류_예시화면.js')
if (process.argv.includes('--check')) {
  let 있 = ''
  try { 있 = readFileSync(길, 'utf8') } catch (e) { /* 없음 */ }
  if (있.replace(/\r\n/g, '\n') !== 파일글) { console.log('✗ 예시 화면이 지금 엔진과 다릅니다 — node tools/build_하도급서류예시화면.mjs 로 다시 지으십시오'); process.exit(1) }
  console.log('✓ 예시 화면 = 지금 엔진으로 지은 것')
} else {
  writeFileSync(길, 파일글)
  console.log(`✓ ${길} · ${(파일글.length / 1024).toFixed(0)}KB · 시트 ${책.시트들.length} · 수식→값 ${수식수}`)
}
