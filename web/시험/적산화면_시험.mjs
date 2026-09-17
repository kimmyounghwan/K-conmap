/* 🧮 적산 보기 화면이 «내역서 형식» 에 맞는지 — 실제 코드를 떼어 내서 봅니다. (2026-09-17)
 *
 *   node web/시험/적산화면_시험.mjs
 *
 * 소장님: 「산출근거는 내역서에 나오지 않아. 수량산출서나 단가산출에 나오는 거지」
 *         「단가하고 금액이 맞아야 하는데 금액이 중간에 있어」
 *         「내역서는 원가계산서, 내역서, 일위대가, 단가산출, 수량산출서..이런 형식」
 *
 * 이 셋이 다시 어긋나면 여기서 잡습니다.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const here = path.dirname(fileURLToPath(import.meta.url))
const p = path.join(here, '..', 'src', 'pages', 'JeoksanShow.jsx')
const src = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n')

const 자르기 = (a, b) => {
  const i = src.indexOf(a), j = src.indexOf(b)
  if (i < 0 || j < 0 || j <= i) { console.log(`✕ JeoksanShow.jsx 에서 «${i < 0 ? a : b}» 를 못 찾았습니다`); process.exit(1) }
  return src.slice(i, j)
}
const m = new Function(자르기('const 일위 = [', 'const 탭 =') + '\n return { 일위, 내역 };')()
const { 일위, 내역 } = m

let ok = 0, bad = 0
const T = (n, v, w) => { (v === w ? (ok++, console.log('  ○ ' + n)) : (bad++, console.log(`  ✕ ${n} → ${JSON.stringify(v)} (${JSON.stringify(w)} 여야 합니다)`))) }

console.log('① 일위대가 — 재료비 + 노무비 + 경비 = 합계')
for (const r of 일위) T(`  ${r.호표} ${r.명}`, r.재 + r.노 + r.경 > 0, true)

console.log('② 그 합계가 «그대로» 내역서 단가가 된다 (이게 일위대가가 있는 까닭)')
for (const r of 일위) {
  const 줄 = 내역.find((x) => x[5] === r.호표)
  T(`  ${r.호표} 가 내역서에 있다`, !!줄, true)
  if (줄) T(`  ${r.호표} 단가 ${줄[4]} = 재+노+경`, 줄[4], r.재 + r.노 + r.경)
}

console.log('③ 내역서 — 호표가 붙은 줄과 «자재» 줄만 있다 (빈 칸 없음)')
for (const r of 내역) T(`  ${r[0]}`, r[5] === '자재' || /^제\d+호표$/.test(r[5]), true)

console.log('④ 내역서 합계 = 수량 × 단가 를 다 더한 값')
{
  const 합 = 내역.reduce((a, r) => a + Math.round(r[3] * r[4]), 0)
  T('  합계가 0 보다 크다', 합 > 0, true)
  T('  줄마다 금액이 수량×단가', 내역.every((r) => Math.round(r[3] * r[4]) > 0), true)
}

console.log('⑤ 🚨 내역서 표에 «산출근거» 칸이 없다 (수량산출서·단가산출서에 가는 칸입니다)')
{
  const 내역표 = 자르기('그 다음 — 내역서', '마지막 — 원가계산서')
  T('  내역서 표에 산출근거 칸 없음', /<th[^>]*>\s*산출근거\s*<\/th>/.test(내역표), false)
  T('  내역서 표에 호표 칸 있음', /<th[^>]*>\s*호표\s*<\/th>/.test(내역표), true)
}

console.log('⑥ 수량산출서에는 «산출근거» 가 있어야 한다 (거기가 제자리입니다)')
{
  const 수량표 = 자르기('{t === 0 && (', '{t === 1 && (')
  T('  수량산출서에 산출근거 칸 있음', /<th[^>]*>\s*산출근거\s*<\/th>/.test(수량표), true)
}

console.log('⑦ 🚨 숫자 칸은 «머리도 숫자도» 오른쪽 — 한쪽만 붙이면 어긋나 보입니다')
{
  const 내역표 = 자르기('그 다음 — 내역서', '마지막 — 원가계산서')
  for (const 이름 of ['수량', '단가', '금액']) {
    const re = new RegExp('<th className="n">' + 이름 + '</th>')
    T(`  머리 「${이름}」 가 n 칸`, re.test(내역표), true)
  }
  T('  옛 방식(style textAlign right)이 안 남았다', /textAlign:\s*'right'/.test(내역표), false)
}

console.log('⑧ 탭 이름이 «수량산출서» 다 (「산출서」 라고만 하면 단가산출서로 읽힙니다)')
T('  첫 탭', /const 탭 = \[\s*'수량산출서'/.test(src), true)

console.log('⑨ 성과품 묶는 차례 — 원가계산서 → 내역서 → 일위대가 → 단가산출서 → 수량산출서')
{
  const 차례 = src.slice(src.indexOf('어디까지 왔나'))
  const 순 = ['① 원가계산서', '② 내역서', '③ 일위대가', '④ 단가산출서', '⑤ 수량산출서']
  let 앞 = -1, 맞나 = true
  for (const x of 순) { const i = 차례.indexOf(x); if (i < 0 || i < 앞) 맞나 = false; 앞 = i }
  T('  차례대로 적혀 있다', 맞나, true)
}

console.log('\n맞음 ' + ok + ' · 틀림 ' + bad)
process.exit(bad ? 1 : 0)
