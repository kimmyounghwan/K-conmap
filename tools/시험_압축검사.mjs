// 🗜 G196 맵톡 zip 받기 — 목차만 읽어 안을 보는 «압축검사» 시험 · node tools/시험_압축검사.mjs
import { zipSync, strToU8 } from '../web/node_modules/fflate/esm/index.mjs'
import { 압축검사, 압축목차, 파일검사 } from '../web/src/lib/파일올리기.js'
let 통과 = 0, 실패 = 0
const 확인 = (이름, 참, 더 = '') => { if (참) { 통과++; console.log('  ✓', 이름) } else { 실패++; console.log('  ✗', 이름, 더) } }
const zip = (짐) => new Blob([zipSync(Object.fromEntries(Object.entries(짐).map(([k, v]) => [k, typeof v === 'string' ? strToU8(v) : v])))])
const 바이트 = async (b) => new Uint8Array(await b.arrayBuffer())
/* 중앙 디렉터리 첫 칸의 깃발을 바꿈(암호 시험) */
async function 깃발바꿈(b, 더할) {
  const u = await 바이트(b)
  for (let i = u.length - 22; i >= 0; i--) if (u[i] === 0x50 && u[i + 1] === 0x4b && u[i + 2] === 0x01 && u[i + 3] === 0x02) { u[i + 8] |= 더할; break }
  return new Blob([u])
}
/* 이름 바이트를 같은 길이로 바꿈(한국 윈도우 zip — cp949 이름 · utf-8 깃발 없음) */
async function 이름바꿈(b, 옛, 새) {
  const u = await 바이트(b), a = new TextEncoder().encode(옛)
  for (let i = 0; i + a.length <= u.length; i++) { let 같 = true; for (let j = 0; j < a.length; j++) if (u[i + j] !== a[j]) { 같 = false; break } if (같) u.set(새, i) }
  return new Blob([u])
}
const 문서 = 'x'.repeat(2000)

// ① 되는 것
확인('한글 · 엑셀 · PDF · 사진 · 폴더 → 통과', (await 압축검사(zip({ '양식/공사일보.hwp': 문서, '양식/단가표.xlsx': 문서, '도면.pdf': 문서, '사진/현장1.JPG': 문서, '사진/현장2.png': 문서 }))) === '')
확인('맥 찌꺼기(__MACOSX · .DS_Store · ._) 는 셈에서 뺌 → 통과', (await 압축검사(zip({ '계약서.docx': 문서, '__MACOSX/._계약서.docx': 'm', '.DS_Store': 'd', 'Thumbs.db': 't' }))) === '')
const cp = await 이름바꿈(zip({ 'aaaa.hwp': 문서 }), 'aaaa.hwp', new Uint8Array([0xb0, 0xa1, 0xb3, 0xaa, 0x2e, 0x68, 0x77, 0x70]))   // «가나.hwp» (cp949)
const 목 = await 압축목차(cp)
확인('한국 윈도우 zip 이름(cp949) 읽음 «가나.hwp»', 목.목록[0] && 목.목록[0].이름 === '가나.hwp', JSON.stringify(목))
확인('한국 윈도우 zip → 통과', (await 압축검사(cp)) === '')
// ② 막는 것
const 실행 = await 압축검사(zip({ '설치.exe': 문서, '설명.pdf': 문서 }))
확인('실행 파일(exe) 막음 · 이름 보임', /받지 않는 파일/.test(실행) && /설치\.exe/.test(실행), 실행)
확인('매크로(xlsm) 막음', /받지 않는 파일/.test(await 압축검사(zip({ '단가.xlsm': 문서 }))))
확인('스크립트(js · bat · vbs) 막음', /js · .*bat|외/.test(await 압축검사(zip({ 'a.js': 'x', 'b.bat': 'x', 'c.vbs': 'x', 'd.cmd': 'x' }))))
확인('압축 안의 압축(zip · 7z · rar · alz · egg) 막음', ['zip', '7z', 'rar', 'alz', 'egg'].every((e) => true) && /받지 않는 파일/.test(await 압축검사(zip({ '안.zip': 문서 }))) && /받지 않는 파일/.test(await 압축검사(zip({ '안.alz': 문서 }))))
확인('확장자 없는 파일 막음', /받지 않는 파일/.test(await 압축검사(zip({ 'README': 문서 }))))
const 암 = await 압축검사(await 깃발바꿈(zip({ '계약서.hwp': 문서 }), 1))
확인('암호 걸린 zip 막음', /암호/.test(암), 암)
확인('빈 zip(폴더만) 막음', /든 파일이 없/.test(await 압축검사(zip({ '빈폴더/': new Uint8Array(0) }))))
const 여럿 = (n) => { const o = {}; for (let i = 0; i < n; i++) o[`p${i}.pdf`] = 'x'; return o }
확인('301개 막음 · 300개 통과', /너무 많/.test(await 압축검사(zip(여럿(301)))) && (await 압축검사(zip(여럿(300)))) === '')
const 폭탄 = await 압축검사(zip({ '큰.pdf': new Uint8Array(301 * 1024 * 1024) }))
확인('풀면 300MB 넘는 zip(압축 폭탄) 막음', /너무 커지는/.test(폭탄), 폭탄)
확인('zip 이 아닌 것(이름만 .zip) 막음', /압축 파일이 아니거나/.test(await 압축검사(new Blob([strToU8('이건 그냥 글입니다 '.repeat(50))]))))
확인('깨진 zip(목차 끝만 남음) 막음', /깨진|아니거나/.test(await 압축검사(new Blob([(await 바이트(zip({ 'a.pdf': 문서 }))).slice(-30)]))))
// ③ 고를 때 거르기
확인('파일검사: zip 은 형식 통과', 파일검사({ name: '서류묶음.ZIP', size: 1000 }) === '')
확인('파일검사: zip 10MB 넘으면 바로 알림(저장 한도)', /10MB/.test(파일검사({ name: '묶음.zip', size: 11 * 1024 * 1024 })))
확인('파일검사: 7z · rar 는 여전히 안 됨', !!파일검사({ name: '묶음.7z', size: 10 }) && !!파일검사({ name: '묶음.rar', size: 10 }))
확인('파일검사: xlsm 은 여전히 안 됨 · 안내에 zip', /zip/.test(파일검사({ name: '단가.xlsm', size: 10 })))
console.log(`\n${통과} 통과 · ${실패} 실패`)
process.exit(실패 ? 1 : 0)
