// 🛠 캐드 버전 · 글꼴 고치기 — 엔진 시험 (2026-10-17)
//   node tools/시험_캐드고침.mjs
// 🧪 예시 도면 두 장(web/public/tools/files/ex-cadfix-*.dxf — 지어낸 «가상 사무실»)으로
//   진단(판 · 글꼴 · 권함 · 한글 깨짐) → 일곱 판 다시 쓰기 → 다시 읽기 → (python ezdxf 가 있으면) audit 0 · 판 확인
//   → 그대로 고치기(짝 보존) → 같은 설정 두 번 = 같은 바이트 → 받을 이름
import path from 'path'
import fs from 'fs'
import os from 'os'
import { execFileSync } from 'child_process'
import { fileURLToPath, pathToFileURL } from 'url'
const 파일주소 = (p) => pathToFileURL(p).href
const 여기 = path.dirname(fileURLToPath(import.meta.url))
const W = path.join(여기, '..', 'web', 'src', 'lib')
const F = path.join(여기, '..', 'web', 'public', 'tools', 'files')
const { 읽기, 고치기, 받을이름 } = await import(파일주소(path.join(W, '캐드고침하기.js')))
const { 판목록, 짝들, 짝글 } = await import(파일주소(path.join(W, '캐드고침.js')))

let 틀림 = 0, 맞음 = 0
const 봄 = (이름, 참, 더 = '') => { if (!참) 틀림++; else 맞음++; console.log((참 ? '  ✓ ' : '  ✗ ') + 이름 + (더 ? ' — ' + 더 : '')) }
const 같은바이트 = (a, b) => a.length === b.length && a.every((v, i) => v === b[i])
const 판값 = (글) => { const m = /\$ACADVER\r?\n\s*1\r?\n(AC\d{4})/.exec(글); return m ? m[1] : '' }
const 글로 = (r) => r.글 || new TextDecoder(r.인코딩 === 'utf-8' ? 'utf-8' : 'euc-kr').decode(r.바이트)

/* python + ezdxf 가 있으면 audit 도 — 없으면 건너뜀 */
let 파이썬 = ''
for (const p of ['python3', 'python']) { try { execFileSync(p, ['-c', 'import ezdxf'], { stdio: 'ignore' }); 파이썬 = p; break } catch (e) { /* 없음 */ } }
const 감사 = (바이트) => {
  const t = path.join(os.tmpdir(), `cadfix_${process.pid}_${Math.random().toString(36).slice(2)}.dxf`)
  fs.writeFileSync(t, 바이트)
  try {
    const 말 = execFileSync(파이썬, ['-c', 'import sys,ezdxf\nfrom ezdxf import recover\ntry:\n  d=ezdxf.readfile(sys.argv[1]);e=0\nexcept Exception:\n  d,a=recover.readfile(sys.argv[1]);e=max(1,len(a.errors))\nr=d.audit()\nprint(d.dxfversion,e,len(r.errors),len(d.modelspace()))', t], { encoding: 'utf-8' }).trim().split(/\s+/)
    return { 판: 말[0], 읽기오류: +말[1], 감사오류: +말[2], 모델: +말[3] }
  } finally { fs.unlinkSync(t) }
}

const 새 = new Uint8Array(fs.readFileSync(path.join(F, 'ex-cadfix-new.dxf')))
const 깨진 = new Uint8Array(fs.readFileSync(path.join(F, 'ex-cadfix-broken.dxf')))

console.log('1) 진단 — 2018 판 · 없는 글꼴 · 이름 없는 TTF')
const R1 = 읽기(새)
{
  const 진 = R1.진
  봄('판 2018(AC1032)', 진.판 === 'AC1032', 진.판)
  const 글꼴 = Object.fromEntries(진.글꼴.map((f) => [f.이름, f]))
  봄('제목(YGO330.TTF) — 윈도우 기본 아님 · 권함 맑은 고딕', 글꼴['제목'] && 글꼴['제목'].권함 === 'malgun', JSON.stringify(글꼴['제목'] && { 이상: 글꼴['제목'].이상, 권함: 글꼴['제목'].권함 }))
  봄('본문(이름 없는 TTF · 나눔고딕) — 권함 맑은 고딕', 글꼴['본문'] && 글꼴['본문'].권함 === 'malgun', JSON.stringify(글꼴['본문'] && { 이상: 글꼴['본문'].이상, 권함: 글꼴['본문'].권함 }))
  봄('한글 깨짐 의심 없음', !(R1.P.깨짐 && R1.P.깨짐.의심))
}

console.log('2) 진단 — 2000 판 · 한글 깨짐(코드페이지 ANSI_1252)')
const R2 = 읽기(깨진)
{
  봄('판 2000(AC1015)', R2.진.판 === 'AC1015', R2.진.판)
  봄('한글 깨짐 의심', !!(R2.P.깨짐 && R2.P.깨짐.의심), JSON.stringify(R2.P.깨짐))
  const r = 고치기(깨진, R2, { 방식: '다시', 판: 'AC1015' })
  const 글 = 글로(r)
  봄('고친 뒤 한글이 보임(«회의실»)', 글.includes('회의실'))
  봄('코드페이지 ANSI_949', /\$DWGCODEPAGE\r?\n\s*3\r?\nANSI_949/.test(글))
  봄('알림에 «한글 깨짐 고침»', r.알림.some((a) => /한글 깨짐 고침/.test(a.글)))
  const 글꼴 = Object.fromEntries(R2.진.글꼴.map((f) => [f.이름, f]))
  봄('글꼴 이름이 한글로(«제목» · «본문» — 깨진 이름은 원이름에)', !!글꼴['제목'] && !!글꼴['본문'] && !!글꼴['제목'].원이름, Object.keys(글꼴).join(' · '))
  봄('Standard(txt · 큰글꼴 없음)에 한글 «축척» + 기호 «·» → 권함 맑은 고딕', 글꼴['Standard'] && 글꼴['Standard'].권함 === 'malgun' && 글꼴['Standard'].이상.some((x) => /큰글꼴/.test(x)) && !!글꼴['Standard'].기호, JSON.stringify(글꼴['Standard'] && 글꼴['Standard'].이상))
  봄('제목(romans + whgtxt)에 «휴게실 · 탕비» → 기호 «?» 짚음 · 권함 맑은 고딕', 글꼴['제목'] && 글꼴['제목'].권함 === 'malgun' && 글꼴['제목'].기호 && 글꼴['제목'].기호.글자 === '·', JSON.stringify(글꼴['제목'] && 글꼴['제목'].기호))
  봄('본문(romans + whgtxt · 기호 없음 — 여러 줄 글은 캐드가 메움) → 권함 없음', 글꼴['본문'] && !글꼴['본문'].권함, JSON.stringify(글꼴['본문'] && 글꼴['본문'].이상))
  const g = 고치기(깨진, R2, { 방식: '그대로', 한글: '그대로', 글꼴: { 제목: 'malgun' } })
  봄('한글 «그대로» 여도 고른 글꼴(한글 이름)이 깨진 이름 기록에 붙음', 짝글(g.짝).includes('malgun.ttf'))
}

console.log('2-1) R12 — 묶음 글꼴(TTC) · 없는 TTF 는 맑은 고딕(AutoCAD 2023: 글꼴 기록이 비고 한글이 «?»)')
{
  const r = 고치기(새, R1, { 방식: '다시', 판: 'AC1009', 글꼴: { 제목: 'gulim', 본문: 'dotum' } })
  const 글 = 글로(r)
  봄('R12 글꼴에 .ttc 없음 · malgun.ttf', !/\.ttc/i.test(글) && 글.includes('malgun.ttf'))
  봄('알림 «R12 에서 못 읽는 TTF → 맑은 고딕»', r.알림.some((a) => /R12 에서 못 읽는 TTF/.test(a.글)), r.알림.map((a) => a.글).join(' | '))
  const r2 = 고치기(새, R1, { 방식: '다시', 판: 'AC1015', 글꼴: { 제목: 'gulim' } })
  봄('2000 판은 굴림(gulim.ttc + 가족 Gulim) 그대로', 글로(r2).includes('gulim.ttc') && 글로(r2).includes('Gulim'))
}

console.log('3) 다시 쓰기 — 일곱 판 모두(권함 글꼴로)')
const 권함 = Object.fromEntries(R1.진.글꼴.filter((f) => f.권함).map((f) => [f.키, f.권함]))
let 모델수 = null
for (const { 판, 이름 } of 판목록) {
  const r = 고치기(새, R1, { 방식: '다시', 판, 글꼴: 권함 })
  const 글 = 글로(r)
  const 다시 = 읽기(r.바이트)
  const 더 = [`${(r.바이트.length / 1024).toFixed(0)} KB`, `모델 ${r.셈.모델}`, `종이 ${r.셈.종이}`, `알림 ${r.알림.length}`]
  let 참 = 판값(글) === 판 && 다시.진.판 === 판 && 글.includes('회의실') && r.셈.모델 > 0
  if (모델수 === null && 판 === 'AC1032') 모델수 = r.셈.모델
  if (판 >= 'AC1015') 참 = 참 && r.셈.모델 === 모델수                 // 2000 이상은 하나도 안 바뀜(R12 는 해치 · 치수가 블록으로)
  if (판 >= 'AC1015') 참 = 참 && 글.includes('malgun.ttf') && !글.includes('YGO330')
  if (파이썬) {
    const a = 감사(r.바이트)
    더.push(`ezdxf ${a.판} · 읽기오류 ${a.읽기오류} · 감사오류 ${a.감사오류}`)
    참 = 참 && a.판 === 판 && a.읽기오류 === 0 && a.감사오류 === 0
  }
  봄(`${이름}(${판})`, 참, 더.join(' · '))
}
if (!파이썬) console.log('  · python ezdxf 가 없어 audit 는 건너뜀')

console.log('4) 그대로 고치기 — 짝을 하나도 안 버림 · 판 그대로')
{
  const r = 고치기(새, R1, { 방식: '그대로', 글꼴: 권함 })
  const 원짝 = R1.짝.length, 새짝 = r.짝.length
  const 글 = 짝글(r.짝)
  봄('판 그대로(AC1032)', r.판 === 'AC1032' && 판값(글) === 'AC1032')
  봄('짝 수 그대로(글꼴 칸만 바뀜 · 늘어남은 파일 이름 칸)', 새짝 >= 원짝 && 새짝 - 원짝 <= 4, `${원짝} → ${새짝}`)
  봄('YGO330 → 맑은 고딕', !글.includes('YGO330') && 글.includes('malgun.ttf'))
  봄('ENTITIES 개수 그대로', (글.match(/\r?\n\s*0\r?\nTEXT\r?\n/g) || []).length === (짝글(R1.짝).match(/\r?\n\s*0\r?\nTEXT\r?\n/g) || []).length)
  if (파이썬) { const a = 감사(r.바이트); 봄('ezdxf audit', a.읽기오류 === 0 && a.감사오류 === 0, `${a.판} · ${a.읽기오류} · ${a.감사오류}`) }
  const 둘 = 고치기(새, R1, { 방식: '그대로', 모두: 'malgun', 글꼴: { 제목: '그대로' } })
  봄('«그대로» 고른 글꼴은 «모두 바꾸기» 가 있어도 안 바뀜', 짝글(둘.짝).includes('YGO330'))
}

console.log('5) 같은 설정 두 번 = 같은 바이트(읽은 것을 안 망가뜨림)')
{
  const a = 고치기(새, R1, { 방식: '다시', 판: 'AC1009', 글꼴: 권함 }).바이트
  고치기(새, R1, { 방식: '그대로', 모두: 'gulim' })
  고치기(새, R1, { 방식: '다시', 판: 'AC1018', 모두: 'shx', 글안: '지움' })
  const b = 고치기(새, R1, { 방식: '다시', 판: 'AC1009', 글꼴: 권함 }).바이트
  봄('R12 두 번 같음', 같은바이트(a, b), `${a.length} B`)
}

console.log('6) 받을 이름')
봄('다시 쓰기 → «_2000»', 받을이름('가상 평면.dwg', '2000', '다시') === '가상 평면_2000.dxf', 받을이름('가상 평면.dwg', '2000', '다시'))
봄('그대로 → «_글꼴고침»', 받을이름('가상 평면.dxf', '2018', '그대로') === '가상 평면_글꼴고침.dxf', 받을이름('가상 평면.dxf', '2018', '그대로'))

console.log(`\n맞음 ${맞음} · 틀림 ${틀림}`)
process.exit(틀림 ? 1 : 0)
