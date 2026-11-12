/* 🧪 G657 물가변동 ESC «예시 화면» 미리 짓기 — node tools/build_물가ESC예시화면.mjs [--check]
   소장님 11-12: 「… 물론 막아 놔....예시는 볼 수 있게 하고」 · G650 «예시는 보기만»
   ■ 이용자 화면에는 «셈 엔진(lib/물가ESC.js) · 엑셀 짓기 · 수식» 이 가지 않게, 지어낸 예시(data/물가ESC_예시입력.js)를 여기서 미리 셈해
     «값만 남긴 화면 자료»(표의 글자 · 숫자뿐)로 web/src/data/물가ESC_예시화면.js 에 둡니다.
   ■ --check: 지금 엔진으로 다시 지은 것과 파일이 같은지만 봄(다르면 exit 1 — 엔진 · 예시를 고치고 다시 짓는 것을 잊지 않게).
*/
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'
const 여기 = dirname(fileURLToPath(import.meta.url))
const 웹 = join(여기, '..', 'web', 'src')
const E = await import(pathToFileURL(join(웹, 'lib', '물가ESC.js')).href)
const { 예시입력 } = await import(pathToFileURL(join(웹, 'data', '물가ESC_예시입력.js')).href)

const R = E.ESC셈(예시입력)
const 자료 = E.화면자료(예시입력, R)
const 글 = '/* 🧪 G657 물가변동 ESC «예시 화면» — tools/build_물가ESC예시화면.mjs 가 지음(손으로 고치지 마십시오)\n' +
  '   지어낸 공사(가상 들말지구 배수개선사업 · 가상군)를 미리 셈해 «값만» 남긴 화면 자료입니다 — 셈 엔진 · 수식 · 엑셀 없음.\n' +
  '   이용자는 이것만 받아 화면으로 봅니다(받기 · 인쇄 없음). */\n' +
  'export const 예시화면 = ' + JSON.stringify(자료) + '\n'
const 길 = join(웹, 'data', '물가ESC_예시화면.js')
if (process.argv.includes('--check')) {
  let 옛 = ''
  try { 옛 = readFileSync(길, 'utf8') } catch { /* 없음 */ }
  if (옛.replace(/\r\n/g, '\n') !== 글) {      /* PC(윈도) 저장소는 줄끝이 CRLF 일 수 있음 — 줄끝만 맞춰 견줌 */ console.log('✗ 물가ESC_예시화면.js 가 지금 엔진 · 예시와 다릅니다 — node tools/build_물가ESC예시화면.mjs 로 다시 지으십시오'); process.exit(1) }
  console.log('✓ 물가ESC_예시화면.js 가 지금 엔진 · 예시와 같음')
} else {
  writeFileSync(길, 글)
  console.log(`지음: ${길} · ${글.length.toLocaleString()}자 · 조정률 ${자료.조정률}% · 적용금액 ${자료.금액.적용금액.toLocaleString()}원 · 품목 ${자료.품목.filter((x) => !x.머리).length}줄`)
}
