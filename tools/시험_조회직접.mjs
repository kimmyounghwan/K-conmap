/* 🧪 G342 (2026-10-20) 조회수 직접 세기 — 데이터베이스 규칙 pv(a · c · n)가 «1씩만 · 열쇠 꼴» 을 지키는지
     node tools/시험_조회직접.mjs
   ■ 화면 쪽(10/21 0시 전 · 뒤 · 열 때마다 · 로봇 · 숫자 = 시작값 + 직접)은 브라우저 시험(/tmp/g10/tl/화면342.mjs)이 봅니다. */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const 여기 = path.dirname(fileURLToPath(import.meta.url))
const 글 = fs.readFileSync(path.join(여기, '..', 'web', 'database.rules.json'), 'utf-8')
const 규칙 = JSON.parse(글.split('\n').map((l) => (/^\s*\/\//.test(l) ? '' : l)).join('\n')).rules
let ok = 0, bad = 0
const 봄 = (what, cond, 덧 = '') => { if (cond) { ok++; console.log('  ✓', what) } else { bad++; console.log('  ✗', what, 덧) } }

/** .write · .validate 를 한 번에 — 변수: {$k: '…'} · 전 = 있던 값(없으면 undefined) · 새 = 넣는 값 */
function 됨(마디, 변수, 전, 새) {
  const 풀 = (식) => {
    let s = 식
      .replace(/newData\.exists\(\)/g, String(새 !== null && 새 !== undefined))
      .replace(/data\.exists\(\)/g, String(전 !== undefined))
      .replace(/newData\.isNumber\(\)/g, String(typeof 새 === 'number'))
      .replace(/newData\.val\(\)/g, JSON.stringify(새))
      .replace(/data\.val\(\)/g, JSON.stringify(전 ?? null))
      .replace(/\.matches\((\/[^/]*(?:\\\/[^/]*)*\/[a-z]*)\)/g, '.match($1) !== null')
      .replace(/\.beginsWith\(/g, '.startsWith(')
    for (const [k, x] of Object.entries(변수)) s = s.split(k).join(JSON.stringify(x))
    // eslint-disable-next-line no-new-func
    return Function(`return (${s})`)()
  }
  return 풀(마디['.write']) && 풀(마디['.validate'])
}
const pv = 규칙.pv
봄('pv 있음 · 누구나 읽기', pv && pv['.read'] === true)
const a = pv.a.$k, c = pv.c.$k, n = pv.n.$g.$no
봄('화면 — 처음 1', 됨(a, { $k: '|gongdong' }, undefined, 1))
봄('화면 — 3 → 4', 됨(a, { $k: '|forms|chg-tonghap' }, 3, 4))
봄('화면 — 맨 앞 «|»(첫 화면)', 됨(a, { $k: '|' }, undefined, 1))
봄('화면 — 세 마디까지', 됨(a, { $k: '|tools|tuipbi|x' }, undefined, 1))
봄('막힘 — 네 마디', !됨(a, { $k: '|a|b|c|d' }, undefined, 1))
봄('막힘 — 2 씩', !됨(a, { $k: '|gongdong' }, 3, 5))
봄('막힘 — 낮추기', !됨(a, { $k: '|gongdong' }, 3, 2))
봄('막힘 — 지우기', !됨(a, { $k: '|gongdong' }, 3, null))
봄('막힘 — 처음에 5', !됨(a, { $k: '|gongdong' }, undefined, 5))
봄('막힘 — 글자', !됨(a, { $k: '|gongdong' }, 3, '4'))
봄('막힘 — | 로 안 시작', !됨(a, { $k: 'gongdong' }, undefined, 1))
봄('막힘 — 너무 긴 열쇠', !됨(a, { $k: '|' + 'x'.repeat(130) }, undefined, 1))
봄('카드 — 두 마디 1', 됨(c, { $k: '|forms|chg-tonghap' }, undefined, 1))
봄('막힘 — 카드 세 마디', !됨(c, { $k: '|tools|tuipbi|x' }, undefined, 1))
봄('공고 — 앞 8자 묶음 1', 됨(n, { $g: 'R26BK017', $no: 'R26BK01749985' }, undefined, 1))
봄('공고 — 7 → 8', 됨(n, { $g: 'R26BK017', $no: 'R26BK01749985' }, 7, 8))
봄('막힘 — 묶음과 번호가 다름', !됨(n, { $g: 'R26XX017', $no: 'R26BK01749985' }, undefined, 1))
봄('막힘 — 번호에 이상한 글자', !됨(n, { $g: 'R26BK017', $no: 'R26BK017<x>' }, undefined, 1))
봄('막힘 — 공고 2 씩', !됨(n, { $g: 'R26BK017', $no: 'R26BK01749985' }, 1, 3))
console.log(`\n${ok} 통과 · ${bad} 실패`)
process.exit(bad ? 1 : 0)
