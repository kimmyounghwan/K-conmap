/* 🧪 G378 (2026-10-22) 80% 비율 — 실제 설계내역서로 찾은 두 꼴 잠금 (예시 파일은 가상 · tools/시험자료/붙은머리_예시.xlsx · .xlsm)
 *   소장님: 「이제 부터는 가상으로 하지 말고, 실제 내역서로 해줘」 → 실제 설계내역서 60부에서 찾은 것을 작게 지어 다시 안 틀리게
 *   ① 한 칸에 갈래 + 꼴이 붙은 머리글 「재료단가 · 재료금액 · 노무단가 · 노무금액 · 경비금액 · 직접공사비」
 *      전엔 «「단가」나 「금액」 칸을 못 찾았습니다» 로 751줄짜리 실제 내역서를 돌려보냄
 *   ② 매크로 사용 내역서(.xlsm)를 «원본 고치기 · 틀 그대로» 로 내려받으면 이름이 .xlsx — 엑셀이 «형식 또는 확장명이 잘못» 이라며 안 엶
 *   node tools/시험_비율붙은머리.mjs */
import { readFileSync } from 'node:fs'
import { unzipSync, strFromU8 } from '../web/node_modules/fflate/esm/index.mjs'
import { readNaeyeok, 격자로읽기, 시트고르기, 고를만한시트, 맞추기, 원본고치기 } from '../web/src/lib/비율.js'
import { 틀그대로 } from '../web/src/lib/낙찰맞추기.js'
import { 매크로인가, 엑셀종류, XLSM, XLSX } from '../web/src/lib/엑셀종류.js'
let 셈 = 0, 틀림 = 0
const 봄 = (뜻, ok, 덧 = '') => { 셈++; if (!ok) 틀림++; console.log((ok ? '✓ ' : '✗ ') + 뜻 + (ok || 덧 === '' ? '' : ' — ' + 덧)) }
const 읽기 = (n) => { const b = readFileSync(new URL('./시험자료/' + n, import.meta.url)); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) }
const ab = 읽기('붙은머리_예시.xlsx')

/* ① 붙은 머리글 */
const g = readNaeyeok(ab, '붙은머리_예시.xlsx')
const 고 = 고를만한시트(g.시트들)
봄('붙은 머리글 내역서를 읽음 (전엔 «단가 · 금액 칸을 못 찾았습니다»)', 고.length === 1 && 고[0] === '공종별 내역서', g.시트말.join(' / '))
const 읽은 = 시트고르기(g, 고)
const s = 읽은.시트들[0]
const 갈 = Object.fromEntries(s.갈래.map((x) => [x.이름, [x.단가칸, x.금액칸]]))
봄('재료비 I · J / 노무비 K · L / 경비 금액 M / 합계 금액 N(직접공사비)', JSON.stringify(갈) === JSON.stringify({ 재료비: [8, 9], 노무비: [10, 11], 경비: [-1, 12], 합계: [-1, 13] }), JSON.stringify(갈))
봄('품목 4줄 · 당초 합계 = 직접공사비 합 982,683', 읽은.rows.length === 4 && Math.abs(읽은.합 - 982683) < 0.01, 읽은.rows.length + ' · ' + 읽은.합)
봄('붙은 머리글 — «수량 × 단가 ≠ 금액» 특수줄 0 (단가 칸이 없는 경비금액 · 직접공사비 때문에 4줄 모두 특수로 알리던 것)', 읽은.특수줄 === 0, 읽은.특수줄)
봄('붙은 머리글 — 합계(직접공사비) = 셋의 합이라 «합계 칸 어긋남» 알림 없음', 읽은.합어긋.length === 0, 읽은.합어긋.join(','))
const R = 맞추기(읽은, { 비율: 80, 목표: 0, 단수꼴: '버림', 노무고정: false, 관급그대로: true, 관급끔: new Set() })
const 줄 = Object.fromEntries(R.rows.map((x) => [x.줄, x]))
봄('80% — 밸브 재료단가 53,291 → 42,632 (버림) · 금액 3 × 42,632 = 127,896', 줄[5].새값.재료비.단가 === 42632 && 줄[5].새값.재료비.금액 === 127896, JSON.stringify(줄[5].새값.재료비))
봄('80% — 수량 12.5 덕트 재료금액 = 버림(12.5 × 14,666) = 183,325', 줄[6].새값.재료비.금액 === 183325, 줄[6].새값.재료비.금액)
봄('80% — 경비(금액만) 25,000 → 20,000', 줄[7].새값.경비.금액 === 20000, JSON.stringify(줄[7].새값.경비))
봄('80% — 줄 합계 = 재료 + 노무 + 경비', R.rows.every((x) => x.새금액 === (x.새값.재료비.금액 || 0) + (x.새값.노무비.금액 || 0) + (x.새값.경비.금액 || 0)))
봄('80% — 실제 비율 0.79 ~ 0.80', R.실비율 > 0.79 && R.실비율 <= 0.8, R.실비율)
const 원 = 원본고치기(ab, 읽은, R)
const z = unzipSync(new Uint8Array(원.bytes))
const x1 = strFromU8(z['xl/worksheets/sheet1.xml'])
봄('원본 고치기 — 재료단가 I5 는 비율 칸을 보는 수식', /<c r="I5"[^>]*><f>ROUNDDOWN\(비율!\$D\$\d+\*비율!\$B\$2\/100,0\)<\/f>/.test(x1), (x1.match(/<c r="I5".*?<\/c>/) || [''])[0])
봄('원본 고치기 — 직접공사비 N5 는 원래 수식(J5+L5+M5)을 살려 단수만 씌움 · 값 = 새 합계 130,776', /<c r="N5"[^>]*><f>ROUNDDOWN\(J5\+L5\+M5,0\)<\/f><v>130776<\/v>/.test(x1) && 줄[5].새금액 === 130776, (x1.match(/<c r="N5".*?<\/c>/) || [''])[0])
봄('원본 고치기 — 못 찾은 칸 0', 원.못찾은칸 === 0, 원.못찾은칸)

/* ①-2 원본 «합계» 칸이 재료비 + 노무비 + 경비와 다른 줄 — 알림(실측: 끌어 채운 합계 수식이 어긋난 설계내역서 · 당초 합계 25% 부풂) */
{
  const 격 = [
    ['가상 내역서'],
    ['품명', '규격', '단위', '수량', '재료비', null, '노무비', null, '경비', null, '합계', null],
    [null, null, null, null, '단가', '금액', '단가', '금액', '단가', '금액', '단가', '금액'],
    ['가상 전선', '4C', 'M', 28, 6504, 182112, 5714, 159992, 0, 0, 12218, 184950],     // 합계 칸이 셋의 합(342,104)과 다름
    ['가상 관', 'PE', 'M', 30, 2831, 84930, 37219, 1116570, 0, 0, 40050, 1201500],  // 맞음
  ]
  const g2 = 격자로읽기({ 내역서: 격 }, '가상.xlsx'); const 읽2 = 시트고르기(g2, ['내역서'])
  봄('합계 칸이 셋의 합과 다른 줄을 알아봄 — «내역서 4행» 하나', 읽2.합어긋.length === 1 && 읽2.합어긋[0] === '내역서 4행', JSON.stringify(읽2.합어긋))
  const 화 = readFileSync(new URL('../web/src/pages/Ratio.jsx', import.meta.url), 'utf8')
  봄('화면이 그 줄을 알림(«합계» 칸이 재료비 + 노무비 + 경비와 다른 줄)', /읽은\.합어긋\.length > 0/.test(화) && /«합계» 칸이 재료비 \+ 노무비 \+ 경비와 다른 줄/.test(화))
}

/* ② .xlsm 은 .xlsm 으로 */
const am = 읽기('붙은머리_예시.xlsm')
봄('엑셀종류 — 매크로 사용 꼴(.xlsm 바이트) → xlsm · 종류 macroEnabled', 엑셀종류(am, 'a.xlsm').끝 === 'xlsm' && 엑셀종류(am).type === XLSM)
봄('엑셀종류 — 보통 꼴 → xlsx (이름이 .xlsm 이어도 안을 봄)', 엑셀종류(ab, '속인이름.xlsm').끝 === 'xlsx' && 엑셀종류(ab).type === XLSX)
봄('매크로인가 — 못 여는 바이트면 이름으로', 매크로인가(new Uint8Array([1, 2, 3]), 'x.xlsm') === true && 매크로인가(new Uint8Array([1, 2, 3]), 'x.xlsx') === false)
const gm = readNaeyeok(am, '붙은머리_예시.xlsm'); const 읽m = 시트고르기(gm, 고를만한시트(gm.시트들))
const Rm = 맞추기(읽m, { 비율: 80, 목표: 0, 단수꼴: '버림', 노무고정: false, 관급그대로: true, 관급끔: new Set() })
const 원m = 원본고치기(am, 읽m, Rm)
봄('.xlsm 원본 고치기 결과도 안이 매크로 사용 꼴 → 내려받기 이름 .xlsm', 엑셀종류(원m.bytes).끝 === 'xlsm')
const 틀m = 틀그대로(am, 읽m, { 단수꼴: '버림', 노무고정: false, 관급그대로: true, 관급끔: new Set(), A값그대로: false, 낙찰금액: 0, 비율: 80 })
봄('.xlsm 틀 그대로 결과도 매크로 사용 꼴 → .xlsm', 엑셀종류(틀m.bytes).끝 === 'xlsm')
/* 화면이 그 꼴을 이름 · 종류에 쓰는가(원본 고치기 · 틀 그대로 둘 다) */
const 화면 = readFileSync(new URL('../web/src/pages/Ratio.jsx', import.meta.url), 'utf8')
봄('화면 — 원본 고치기 · 틀 그대로 이름 끝을 엑셀종류로 (".xlsx" 박힌 이름 없음)', (화면.match(/엑셀종류\(file\.buf, file\.name\)/g) || []).length === 2 && !/%\.xlsx'|%_그대로\.xlsx'|원\.xlsx'/.test(화면))
봄('화면 — 내려받기 Blob 종류도 그 꼴로', /new Blob\(\[bytes\], \{ type: 종류 \}\)/.test(화면) && /new Blob\(\[got\.bytes\], \{ type: 꼴\.type \}\)/.test(화면))
const 두줄 = readFileSync(new URL('../web/src/pages/TwoLine.jsx', import.meta.url), 'utf8')
봄('2줄 화면도 같은 한 곳(lib/엑셀종류.js)을 씀', /from '\.\.\/lib\/엑셀종류\.js'/.test(두줄) && !/function 매크로인가/.test(두줄))
console.log(`\n${틀림 ? '❌' : '✅'} 비율 붙은 머리글 · xlsm ${셈}개 중 ${셈 - 틀림} 맞음 · ${틀림} 틀림`)
process.exit(틀림 ? 1 : 0)
