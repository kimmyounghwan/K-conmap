// 🧪 G797 — 떠 있는 창이 아이폰 시계 줄 밑으로 들어가지 않게 (node tools/시험_시계줄.mjs) — 노드만(덧 꾸러미 없음)
//   소장님 11-20 아이폰 캡처(제휴 공지창 맨 위 «📢 공지 · ✕» 가 시계 줄 밑에서 흐리게) 「이거 고치기 힘들어? 위쪽에 보면 …」
//   까닭: G760 이 .noticepop 바깥 안쪽(padding)에 시계 줄(safe-area-inset-top)을 더했는데, 폰 줄(@media max-width 480px)의 «padding: 12px» 가 덮어씀
//   ① 화면을 덮는 창(.noticepop · .askwrap · .pb-modal · .gmd-xlchk)의 padding 은 미디어 쿼리 안까지 모두 시계 줄을 더함
//   ② 빠른 찾기 폰 줄(.qs-back · 560px 이하)도 시계 줄 · ③ 폰 공지창 높이는 시계 줄 · 홈 막대를 둘 다 뺌 · 아래는 홈 막대만큼 띄움
//   ④ index.html viewport-fit=cover · 상태 표시줄 black-translucent 그대로(그래서 env 값이 0 이 아님)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const 읽 = (...p) => fs.readFileSync(path.join(ROOT, ...p), 'utf8').replace(/\r\n/g, '\n')
let 통과 = 0, 실패 = 0
const 봄 = (참, 무엇, 더 = '') => { if (참) { 통과++; console.log('  ✓', 무엇) } else { 실패++; console.log('  ✗', 무엇, 더) } }

const 꼴 = 읽('web', 'src', 'styles.css').replace(/\/\*[\s\S]*?\*\//g, '')
/* 가장 안쪽 «선택자 { 선언 }» 덩이 — 미디어 쿼리 안의 것도(바깥 @media 는 앞 글로) */
const 덩이들 = []
for (const m of 꼴.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  const 앞 = 꼴.slice(0, m.index)
  const 미디어 = (앞.match(/@media[^{]*\{[^}]*$/) || [''])[0]
  const 열림 = (앞.match(/\{/g) || []).length - (앞.match(/\}/g) || []).length
  덩이들.push({ 선택: m[1].trim().split(',').map((s) => s.trim()), 몸: m[2], 줄: 앞.split('\n').length, 안: 열림 > 0 })
}
봄(덩이들.length > 2000, `styles.css 덩이 ${덩이들.length}개 읽음`)

console.log('① 화면을 덮는 창 — padding 마다 시계 줄')
for (const 이름 of ['.noticepop', '.askwrap', '.pb-modal', '.gmd-xlchk']) {
  const 패딩 = 덩이들.filter((d) => d.선택.includes(이름)).flatMap((d) => [...d.몸.matchAll(/(?:^|;)\s*(padding(?:-top)?)\s*:([^;]*)/g)].map((x) => ({ ...d, 값: x[2].trim(), 칸: x[1] })))
  const 틀 = 패딩.filter((x) => !/safe-area-inset-top/.test(x.값))
  봄(패딩.length >= 1 && 틀.length === 0, `${이름} — padding ${패딩.length}곳 모두 safe-area-inset-top`, 틀.map((x) => `${x.줄}째 줄 ${x.칸}: ${x.값}`).join(' | '))
}
{
  const 폰 = 덩이들.filter((d) => d.안 && d.선택.includes('.noticepop') && /padding\s*:/.test(d.몸))   /* 인쇄 줄(display: none)은 빼고 */
  봄(폰.length >= 1 && 폰.every((d) => /safe-area-inset-top/.test(d.몸) && /safe-area-inset-bottom/.test(d.몸)), '폰 줄 .noticepop — 위 시계 줄 · 아래 홈 막대 둘 다', 폰.map((d) => d.몸.trim()).join(' | '))
}

console.log('② 빠른 찾기 폰 줄')
{
  const q = 덩이들.filter((d) => d.안 && d.선택.includes('.qs-back') && /padding/.test(d.몸))
  봄(q.length >= 1 && q.every((d) => /safe-area-inset-top/.test(d.몸)), '.qs-back(560px 이하) — padding 에 시계 줄', q.map((d) => d.몸.trim()).join(' | '))
}

console.log('③ 폰 공지창 높이')
{
  const c = 덩이들.filter((d) => d.안 && d.선택.includes('.noticepop-c') && /max-height/.test(d.몸))
  const 값 = c.flatMap((d) => [...d.몸.matchAll(/max-height\s*:([^;]*)/g)].map((x) => x[1]))
  봄(값.length >= 2 && 값.every((v) => /safe-area-inset-top/.test(v) && /safe-area-inset-bottom/.test(v)) && 값.some((v) => /100dvh/.test(v)), '.noticepop-c 폰 max-height — 시계 줄 · 홈 막대 빼기(vh · dvh 둘 다)', 값.join(' | '))
  const f = 덩이들.filter((d) => d.안 && d.선택.includes('.noticepop-f') && /padding\s*:/.test(d.몸))
  봄(f.length >= 1 && f.every((d) => !/safe-area-inset-bottom/.test(d.몸)), '.noticepop-f 폰 — 홈 막대는 바깥 창이 띄우므로 단추 줄에 또 더하지 않음', f.map((d) => d.몸.trim()).join(' | '))
}

console.log('④ index.html')
{
  const h = 읽('web', 'index.html')
  봄(/name="viewport" content="[^"]*viewport-fit=cover/.test(h) && /apple-mobile-web-app-status-bar-style" content="black-translucent"/.test(h), 'viewport-fit=cover · black-translucent 그대로(시계 줄 밑까지 그림 → env 값으로 띄움)')
}

console.log(`\n${실패 ? '❌' : '✅'} 시계 줄 ${통과}/${통과 + 실패}`)
process.exit(실패 ? 1 : 0)
