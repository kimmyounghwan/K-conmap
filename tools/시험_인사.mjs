/* 인사.js — 👋 처음 «반갑습니다» · 🙏 다시 «다시 찾아 주셔서 고맙습니다» 를 언제 띄우나 (2026-09-29)
     node tools/시험_인사.mjs */
import { 방문, 로봇, 날, 쉼 } from '../web/src/lib/인사.js'

let ok = 0, bad = 0
const eq = (got, want, what) => {
  const g = JSON.stringify(got), w = JSON.stringify(want)
  if (g === w) { ok++; console.log('  ✓', what) } else { bad++; console.log('  ✗', what, '— 나온 값', g, '· 바란 값', w) }
}
const 아침 = new Date(2026, 8, 29, 9, 0).getTime()
const 분 = 60 * 1000, 시간 = 60 * 분

console.log('1) 처음')
const a = 방문(null, 아침)
eq([a.인사, a.새.n, a.새.day], ['처음', 1, '2026-09-29'], '저장된 것 없음 → 반갑습니다(1번째)')
eq(방문({}, 아침).인사, '처음', '망가진 저장 → 처음으로')
eq([방문(null, 아침, { 전에옴: true }).인사, 방문(null, 아침, { 전에옴: true }).새.n], ['다시', 2], '이 기능 전부터 다녀가신 분(사이트 흔적 있음) → «다시»')

console.log('2) 같은 날')
const b = 방문(a.새, 아침 + 10 * 분, { 탭중: true })
eq([b.인사, b.새.n], [null, 1], '같은 탭에서 옮겨 다님 → 인사 없음 · 방문 그대로')
const c = 방문(a.새, 아침 + 10 * 분)
eq([c.인사, c.새.n], [null, 1], '새 탭이지만 30분 안 → 같은 방문')
const d = 방문(a.새, 아침 + 3 * 시간)
eq([d.인사, d.새.n], [null, 2], '같은 날 3시간 뒤 다시 → 방문은 2번째, 인사는 하루 한 번이라 없음')

console.log('3) 다른 날')
const e = 방문(d.새, 아침 + 24 * 시간)
eq([e.인사, e.새.n, e.새.day], ['다시', 3, '2026-09-30'], '다음 날 → 다시 찾아 주셔서 고맙습니다')
const f = 방문(e.새, 아침 + 24 * 시간 + 2 * 시간)
eq(f.인사, null, '그날 두 번째 방문 → 인사 없음')
const g = 방문({ n: 5, first: 1, last: 아침 - 10 * 분, day: '2026-09-28' }, 아침, { 탭중: false })
eq([g.인사, g.새.n], [null, 5], '자정 넘겨 계속 보고 있던 분(30분 안) → 새 방문 아님')
const h = 방문({ n: 5, first: 1, last: 아침 - 쉼, day: '2026-09-28' }, 아침)
eq([h.인사, h.새.n], ['다시', 6], '딱 30분 쉬고 온 다음 날 → 다시')

console.log('4) 로봇 · 날짜')
eq([로봇('Mozilla/5.0 (compatible; Googlebot/2.1)'), 로봇('Mozilla/5.0 (Windows NT 10.0) HeadlessChrome/120'), 로봇('Mozilla/5.0 (Linux; Android 14) Chrome/128 Mobile Safari'), 로봇('Mozilla/5.0 (compatible; Yeti/1.1; +https://naver.me/spd)')],
   [true, true, false, true], '구글·자동 브라우저·네이버(Yeti)는 빼고 폰 크롬은 인사')
eq(날(new Date(2026, 0, 5, 23, 59).getTime()), '2026-01-05', '날짜는 그 브라우저의 날')

console.log(`\n${ok} 통과 · ${bad} 실패`)
process.exit(bad ? 1 : 0)
