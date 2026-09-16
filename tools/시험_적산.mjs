/**
 * tools/시험_적산.mjs — 사이트 적산 엔진이 «PC 프로그램과 같은 수량» 을 내는지 봅니다.
 *
 *   node tools/시험_적산.mjs
 *
 * ■ 왜 필요한가
 *    같은 셈을 파이썬(K-적산/kqto.py)과 자바스크립트(web/src/lib/qto.js) 두 곳에 두었습니다.
 *    «한쪽만 고치는» 순간 사이트 수량과 PC 수량이 갈라지고, 그러면 아무도 못 믿습니다.
 *    이 시험이 그것을 잡습니다.
 *
 * ■ 무엇을 보나
 *    ① 수식 엔진 — 정해 둔 식을 셈해 값과 «엑셀 수식 글» 까지 견줍니다
 *    ② 막아야 하는 식 — 음수의 제곱근처럼, 안 막으면 엑셀 칸에 NaN 이 들어가 파일이 깨집니다
 *    ③ 견본 치수표 — 실제로 산출서를 만들어 줄 수·수량·검산을 봅니다
 *    ④ 파이썬과 맞대보기 — 파이썬이 있을 때만. 없으면 건너뜁니다(배치에서 돌리기 위함)
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import os from 'node:os'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '..')
const LIB = path.join(ROOT, 'web', 'src', 'lib')
const 적산폴더 = path.resolve(ROOT, '..', 'K-적산')
const NUL = String.fromCharCode(0)

let 틀림 = 0
const 봄 = (이름, 됐나, 말) => {
  if (됐나) console.log('  ○ ' + 이름)
  else { 틀림 += 1; console.log('  ✕ ' + 이름 + (말 ? '  — ' + 말 : '')) }
}
const url = (p) => 'file://' + path.resolve(p).replace(/\\/g, '/')

const { calc, SusikError } = await import(url(path.join(LIB, 'susik.js')))
const qto = await import(url(path.join(LIB, 'qto.js')))

/* ───────────────────────────────────────── ① 수식 엔진 */
console.log('')
console.log('① 수식 엔진')
const 값표 = {}
값표['철근단위중량' + NUL + 'HD16'] = 1.56
값표['철근단위중량' + NUL + 'HD13'] = 0.995
const 이름 = { A: '2.5', H: '3', L: '12.4', N: '4', 규격: 'HD16', 배근: '양면' }
const 정답 = [
  ['A*H', 7.5, '2.5*3'],          /* 산출근거는 «이름» 이 아니라 «숫자» 로 적힙니다 — 감리가 읽는 글입니다 */
  ['(A+1)/2*L', 21.7, '(2.5+1)/2*12.4'],
  ['2^3^2', 64, null],                    /* 엑셀처럼 «왼쪽부터» 묶습니다 */
  ['round(1.5)', 2, null],
  ['round(-1.5)', -2, null],              /* 0 에서 «먼» 쪽 */
  ['round(2.5)', 3, null],                /* 파이썬 기본 round() 였다면 2 가 됩니다 */
  ['ceil(-1.2)', -2, null],
  ['int(-1.9)', -1, null],
  ['값("철근단위중량",규격)*L', 19.344, null],
  ['if(배근="양면",2,1)*A', 5, null],
]
for (const [식, 값, 글] of 정답) {
  let r = null
  try { r = calc(식, 이름, 4, 값표) } catch (e) { r = null }
  봄('식 ' + 식,
     !!r && Math.abs(r.val - 값) < 1e-9 && (글 === null || r.expr === 글),
     r ? ('값 ' + r.val + ' · 근거 ' + r.expr) : '셈하지 못했습니다')
}

/* ───────────────────────────────────────── ② 막아야 하는 식 */
console.log('')
console.log('② 막아야 하는 식 (안 막으면 엑셀 칸이 깨집니다)')
for (const 식 of ['(0-1)^0.5', '0^-1', 'sqrt(0-1)', '10^300*10^300',
                  'A/0', '모르는이름*2', '1.2.3', 'A*', '없는함수(A)']) {
  let 막았나 = false
  try { calc(식, 이름, 4, 값표) } catch (e) { 막았나 = e instanceof SusikError }
  봄('막음 ' + 식, 막았나, '막지 못했습니다')
}

/* ───────────────────────────────────────── ③ 견본 치수표 */
console.log('')
console.log('③ 견본 치수표로 산출서 만들기')
const 재료표 = path.join(ROOT, 'web', 'public', 'jeoksan', '재료표_토목.xlsx')
const 치수표 = path.join(ROOT, 'web', 'public', 'jeoksan', '치수표_견본.csv')
if (!fs.existsSync(재료표) || !fs.existsSync(치수표)) {
  봄('견본 파일이 있다', false, 'web/public/jeoksan 에 재료표·치수표 견본이 없습니다')
} else {
  const res = qto.run(fs.readFileSync(재료표), '재료표_토목.xlsx',
                      fs.readFileSync(치수표, 'utf-8').replace(/^﻿/, ''), '치수표_견본.csv')
  봄('치수표 12줄을 읽었다', res.units.length === 12, '읽은 줄: ' + res.units.length)
  봄('산출서 30줄이 나왔다', res.rows.length === 30, '나온 줄: ' + res.rows.length)
  봄('✕ 로 걸린 것이 없다', res.serious === 0, '✕ ' + res.serious + '가지')
  봄('적힌 근거로 다시 세어 값이 같다',
     res.checks.some((c) => String(c[0]).startsWith('○ 근거글')),
     '근거글 검산이 통과하지 않았습니다')
  const 땅 = res.rows.find((r) => r.rule['재료'] === '땅깎기')
  봄('양단면평균법이 맞다',
     !!땅 && Math.abs(땅.val - 282) < 1e-6 && 땅.expr === '(12.4+15.8)/2*20',
     땅 ? (땅.val + ' · ' + 땅.expr) : '땅깎기 줄이 없습니다')
  const 철근 = res.rows.find((r) => r.rule['재료'] === '철근')
  봄('값표(철근 단위중량)를 찾아 썼다', !!철근 && !철근.err && 철근.val > 0,
     철근 ? (철근.val + ' · ' + 철근.note) : '철근 줄이 없습니다')

  /* 저장소 안이 아니라 «임시 자리» 에 씁니다 —
     마운트 폴더에서는 지울 수 없어서, 시험이 찌꺼기를 남기고 죽습니다. */
  const 냄 = path.join(os.tmpdir(), 'kcm_시험_수량산출서.xlsx')
  fs.writeFileSync(냄, Buffer.from(res.bytes))
  const 바이트 = fs.readFileSync(냄)
  봄('엑셀이 만들어졌다', 바이트.length > 3000, 바이트.length + ' 바이트')
  봄('zip(엑셀) 꼴이다', 바이트[0] === 0x50 && 바이트[1] === 0x4b)
  봄('수량 칸이 «살아 있는 수식» 이다',
     !!res.rows[0] && !!res.rows[0].expr && !res.rows[0].err, '수식이 없습니다')
  try { fs.unlinkSync(냄) } catch (e) { /* 못 지워도 시험은 통과입니다 */ }
}

/* ───────────────────────────────────────── ④ 파이썬과 맞대보기 */
console.log('')
console.log('④ PC 프로그램(파이썬)과 맞대보기')
if (!fs.existsSync(path.join(적산폴더, 'kq_susik.py'))) {
  console.log('  · K-적산 폴더가 없어 건너뜁니다 (사이트만 있는 자리에서는 정상입니다)')
} else {
  const 식들 = ['A*H', '(A+1)/2*L', '2^3^2', 'round(2.5)', 'round(-1.5)', 'ceil(-1.2)',
                'int(-1.9)', 'sqrt(16)', 'max(1,2,3)', 'pi*2', 'A*H*(1+0.07)',
                'if(A>2,10,20)', '(0-1)^0.5', 'sqrt(0-1)', 'A/0']
  const 코드 = [
    '# -*- coding: utf-8 -*-',
    'import sys, json',
    'sys.path.insert(0, ' + JSON.stringify(적산폴더) + ')',
    'import kq_susik as SU',
    'env = ' + JSON.stringify(이름),
    'out = []',
    'for s in ' + JSON.stringify(식들) + ':',
    '    try:',
    '        v, t, _, _ = SU.calc(s, env, 4, {})',
    '        out.append([s, True, v, t])',
    '    except Exception as e:',
    '        out.append([s, False, None, str(e)])',
    'sys.stdout.write(json.dumps(out, ensure_ascii=False))',
  ].join('\n')
  let 답 = null
  for (const py of ['python', 'python3']) {
    try { 답 = JSON.parse(execFileSync(py, ['-c', 코드], { encoding: 'utf-8' })); break } catch (e) { /* 다음 */ }
  }
  if (!답) console.log('  · 파이썬을 부르지 못해 건너뜁니다')
  else for (const [식, 됐나, 값, 글] of 답) {
    let r = null, 오류 = ''
    try { r = calc(식, 이름, 4, {}) } catch (e) { 오류 = e.message }
    const 같나 = 됐나
      ? (!!r && Math.abs(r.val - 값) < 1e-9 && r.expr === 글)
      : (!r && 오류 === 글)
    봄('파이썬과 같다: ' + 식, 같나,
       '파이썬 ' + (됐나 ? 값 + ' / ' + 글 : '막음 «' + 글 + '»') +
       '   브라우저 ' + (r ? r.val + ' / ' + r.expr : '막음 «' + 오류 + '»'))
  }
}

console.log('')
console.log(틀림 ? ('✕ 틀린 것 ' + 틀림 + '가지 — 올리지 마십시오.') : '○ 전부 맞습니다.')
process.exit(틀림 ? 1 : 0)
