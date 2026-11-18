/* 📗 G777 하도급 내역서 만들기 — 받는 엑셀은 «값만»(G109 원칙 · 2026-11-19 소장님 「엑셀에서 수식은 빼고 — 건설맵」)
   node tools/시험_하도급값만.mjs
   ① 예시 파일(/jeoksan/비율예시_내역서.xlsx — 지어낸 마을안길 정비공사)로 하도급한벌 → 값만으로 → 수식 칸 0 · 셈 오류 0 · 시트 여섯
   ② 값만 엑셀의 숫자 = 수식 판에 적어 둔 값(캐시가 있는 칸) — 화면 셈과 같은지
   ③ 화면(Hado.jsx)이 받기 전에 값만으로를 거치는지 · «노란 칸 하나로 다시 셈» 글이 남지 않았는지 (다시 생기지 않게) */
import fs from 'fs'
import { fileURLToPath } from 'url'
import { unzipSync, strFromU8 } from '../web/node_modules/fflate/esm/index.mjs'
const m = await import('../web/src/lib/비율.js')
const h = await import('../web/src/lib/하도급내역.js')
const v = await import('../web/src/lib/변경내역.js')
const q = await import('../web/src/lib/qtoxlsx.js')
const w = await import('../web/src/lib/엑셀쓰기.js')
const R = await import('../web/src/lib/엑셀읽기.js')
let 통과 = 0, 실패 = 0
const 봐 = (말, 참, 더 = '') => { if (참) { 통과++; console.log('  ✓ ' + 말) } else { 실패++; console.log('  ✗ ' + 말 + (더 ? ' — ' + 더 : '')) } }
const 루트 = fileURLToPath(new URL('..', import.meta.url))   /* PC(Windows)에서도 — checkimports «URL.pathname 을 파일 경로로 쓰지 말 것» */

const buf = fs.readFileSync(루트 + 'web/public/jeoksan/비율예시_내역서.xlsx')
const 이름 = '예시_내역서(가상 마을안길 정비공사).xlsx'
const 책0 = q.readWorkbook(new Uint8Array(buf))
const 알 = h.상태알기(책0, v)
const 여럿 = 알.상태.length > 1
const 편 = 여럿 ? h.상태펴기(책0, v, 알.상태.length - 1) : 책0
const g = m.격자로읽기(편, 이름, { 원가품목: true })
const 읽은 = m.시트고르기(g, m.고를만한시트(g.시트들))
const 직접 = new Set(h.직접후보(읽은))
for (const 율 of [80, 82, 64.5]) {
  console.log('■ 율 ' + 율 + '%')
  const got = h.하도급한벌(new Uint8Array(buf), 읽은, { 율, 단수꼴: '버림', 관급그대로: true, 관급끔: new Set(), 직접, 책: 편, 공사명: '(예시) 가상 마을안길 정비공사', 발주처: '(예시) 가상군', 원도급사: '(예시) 가상건설(주)', 하도급사: '(예시) 가상토건(주)' })
  봐('여섯 장 — ' + got.시트.length, got.시트.length === 6)
  봐('경고 없음', got.경고.length === 0, JSON.stringify(got.경고).slice(0, 200))
  const 값 = w.값만으로(got.bytes)
  봐('값만으로 바꾼 칸 ' + 값.바꾼, 값.바꾼 > 300)
  봐('셈 오류 0', 값.오류 === 0, String(값.오류))
  const fz = unzipSync(값.바이트)
  let nf = 0, 칸 = 0
  for (const k of Object.keys(fz)) if (/^xl\/worksheets\/.*\.xml$/.test(k)) { const x = strFromU8(fz[k]); nf += (x.match(/<f[ >]/g) || []).length; 칸 += (x.match(/<c /g) || []).length }
  봐('수식 칸 0(칸 ' + 칸 + ')', nf === 0, String(nf))
  봐('계산 사슬 없음', !fz['xl/calcChain.xml'])
  /* ② 수식 판에 적힌 값(캐시)과 값만 판 숫자가 같은지 */
  const A = R.엑셀읽기(got.bytes), B2 = R.엑셀읽기(값.바이트)
  let 견줌 = 0, 다름 = 0, 보기 = ''
  for (const s of A.시트들) {
    const t = B2.시트들.find((x) => x.이름 === s.이름)
    if (!t) { 다름++; 보기 = '시트 없음 ' + s.이름; continue }
    for (const [ref, x] of s.칸) {
      if (!x.f || typeof x.v !== 'number') continue
      const y = t.칸.get(ref)
      견줌++
      if (!y || typeof y.v !== 'number' || Math.abs(y.v - x.v) > 0.5) { 다름++; if (!보기) 보기 = s.이름 + '!' + ref + ' ' + x.v + ' → ' + (y && y.v) }
    }
  }
  봐('캐시 있는 수식 칸 ' + 견줌 + '칸 = 값만 숫자', 견줌 > 100 && 다름 === 0, 보기)
}
/* ③ 화면 글 — 다시 생기지 않게 */
const 화면 = fs.readFileSync(루트 + 'web/src/pages/Hado.jsx', 'utf8')
봐('Hado.jsx 받기 전에 값만으로', /libs\.w\.값만으로\(got\.bytes\)/.test(화면) && /new Blob\(\[값\.바이트\]/.test(화면))
봐('«노란 칸 · 율 칸 하나로 다시 셈» 글 없음', !/노란 칸|율 칸 하나로|전부 다시 셈/.test(화면.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')))
봐('예시 단추 · 예시 파일 주소', /🧪 예시 내역서로 해 보기/.test(화면) && /\/jeoksan\/비율예시_내역서\.xlsx/.test(화면))
const 판 = fs.readFileSync(루트 + 'web/src/pages/Naeyeok.jsx', 'utf8')
봐('내역서 탭 카드 글에 «율 칸 하나로» 없음', !/율 칸 하나로/.test(판))
console.log((실패 ? '❌' : '✅') + ' 시험_하도급값만 ' + 통과 + '/' + (통과 + 실패))
process.exit(실패 ? 1 : 0)
