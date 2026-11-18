/**
 * 🩹 G758 아이폰 «홈 화면 앱» 시계 줄 · 흰 화면 지킴 2 — 글 시험(브라우저 없이 · 올리기 bat 이 돌림) (2026-11-18)
 *   node tools/시험_아이폰위칸.mjs
 *   소장님 11-18 「폰에서 건설맵이 들어가면 흰색으로 나와 안돼. 빨리 고쳐줘」 → (아이콘을 지우고 다시 추가) →
 *   「새로고침이나 뒤로가기로 누르고 싶을 때 할 수가 없어」 「갑자기 왜 이런거지? 1시간 전만해도 잘 됐는데」
 *   — 다시 추가한 아이콘은 시계 · 배터리 줄까지 꽉 채워 엶(index.html black-translucent · viewport-fit=cover) → 머리줄이 시계 줄 뒤로 숨음
 *   ① styles.css — .topbar 안쪽을 시계 줄만큼 내림 · 머리줄 높이로 붙는 칸(top: calc(40px 넘게 · var(--nav-h)) 은 모두 + env(safe-area-inset-top)
 *      · scroll-padding-top · 화면을 덮는 창 · 옆 창 · 위에 뜨는 상자
 *   ② index.html — 시계 줄까지 꽉 채우는 설정이 그대로면(바뀌면 ① 을 다시 볼 것) · 흰 화면 지킴 2(묶음 새로 받기 · 한 번만 · 45초 · 상자 · 숫자 칸)
 *   ③ main.jsx — window.__KCM_OK 를 그리기 전에 찍고 상자 · 표를 지움   ④ 화면지킴 · 지도지킴 — 무엇이 멈췄는지 숫자 칸에(진단세기)
 *   ⑤ 숫자 칸 열쇠 꼴 — 어떤 오류 글이 와도 «|흰화면|…» 두 마디 · 80자 · . / # $ [ ] | 없음
 *   ⑥ 흰 화면 지킴 2 의 로봇 거르기 = lib/인사.js 로봇(한쪽만 고치지 않게)
 *   ⑦ 📱 G760 화면을 덮는 칸(position: fixed · inset 0 / top 0)은 모두 시계 줄 셈(덮개 · 아래 창 목록만 빼고) — 🔎 찾기 창을 빠뜨렸던 일 · 자가시험
 *   ⑧ 🩹 G765 시계 줄 바탕(.kcm-sibar) — 소장님 11-18 18:10 폰 캡처 「지금도 위 쪽이 좀 그러지 않아??」(로고 줄이 아이폰 «그늘»에 덮여 흐림)
 *      맨 위 고정 칸 · 높이 = 시계 줄 · 바탕 = 머리줄 색(불투명) · 머리줄보다 위(z) · pointer-events 없음 · 인쇄 숨김 · 키보드 바로잡기(vv-fix) 목록 · App.jsx 머리줄 바로 앞 하나
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'web')
const 읽 = (p) => readFileSync(path.join(뿌리, p), 'utf8').replace(/\r\n/g, '\n')
let 통과 = 0, 실패 = 0
const 봄 = (이름, 참, 더 = '') => { if (참) { 통과++; console.log('  ✓', 이름) } else { 실패++; console.log('  ✗', 이름, 더) } }

const css = 읽('src/styles.css')
const html = 읽('index.html')
const main = 읽('src/main.jsx')
const 지킴 = 읽('src/화면지킴.jsx')
const 바로 = 읽('src/pages/BaroBid.jsx')
const 인사 = 읽('src/lib/인사.js')
const 받은수 = 읽('src/lib/받은수.jsx')
const E = 'env(safe-area-inset-top, 0px)'

console.log('① styles.css')
const 머리 = css.match(/\n\.topbar \{[^}]*\}/)
봄('.topbar 안쪽을 시계 줄만큼 내림', !!머리 && 머리[0].includes(`padding-top: ${E}`))
봄('.topbar 는 그대로 위에 붙음(sticky · top 0)', !!머리 && /position: sticky;/.test(머리[0]) && /top: 0;/.test(머리[0]))
/* 붙는 칸(sticky) 가운데 «머리줄 높이» 로 내린 것(40px 넘는 수 · var(--nav-h)) — 모두 시계 줄을 더해야 함 */
const 규칙들 = css.split('}').map((r) => r + '}')
const 붙는칸 = 규칙들.filter((r) => /position:\s*sticky/.test(r) && /(^|[;{\s])top:\s*calc\(/.test(r))
const 머리높이칸 = 붙는칸.filter((r) => { const m = r.match(/(?:^|[;{\s])top:\s*calc\(([^;]*)\)/); return m && (/var\(--nav-h/.test(m[1]) || (Number((m[1].match(/^(\d+)px/) || [])[1]) || 0) >= 40) })
봄('머리줄 높이로 붙는 칸이 있음(시험이 헛돌지 않게)', 머리높이칸.length >= 8, String(머리높이칸.length))
const 빠짐 = 머리높이칸.filter((r) => !r.includes(E))
봄('그 칸 모두 + 시계 줄', 빠짐.length === 0, 빠짐.map((r) => r.trim().slice(0, 80)).join(' | '))
/* 미디어 안의 폰용 top(.gg-draw 48px) 도 */
봄('.gg-draw 폰용 top 도', /\.gg-draw \{ top: calc\(48px \+ var\(--cn-h, 0px\) \+ env\(safe-area-inset-top, 0px\)\)/.test(css))
봄('scroll-padding-top + 시계 줄', css.includes(`scroll-padding-top: calc(var(--cn-h, 0px) + ${E})`))
봄('붙는 칸 높이(max-height: 100vh - 76px) 도 시계 줄만큼 줄임', (css.match(/max-height: calc\(100vh - 76px - var\(--cn-h, 0px\) - env\(safe-area-inset-top, 0px\)\)/g) || []).length === 4)
/* 제 자리(처음 적은 규칙)에서 고침 — 먼 곳에 덮어 적으면 시험_css겹침 이 잡음 */
const 규칙 = (이름) => (css.match(new RegExp('\\n' + 이름.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ' \\{[^}]*\\}')) || [''])[0]
봄('옆 창 · 화면을 덮는 창 · 위에 뜨는 상자(제 자리에서)', 규칙('.mt-sheet').includes(`padding: calc(20px + ${E}) 24px 40px;`) && 규칙('.kcm-help-dlg').includes(`padding: calc(14px + ${E}) 14px 40px;`)
  && 규칙('.gmd .gmd-ws').includes(`padding-top: ${E};`) && 규칙('.bim .bim-ws').includes(`padding: ${E} 0 0;`) && 규칙('.gg.gg-ws').includes(`padding: ${E} 0 0;`)
  && 규칙('.gmd-askbox').includes(`top: calc(72px + ${E});`), JSON.stringify(['.mt-sheet', '.kcm-help-dlg', '.gmd .gmd-ws', '.bim .bim-ws', '.gg.gg-ws', '.gmd-askbox'].map((x) => 규칙(x).length)))
봄('알림 창(.noti-pop)은 전부터 시계 줄 셈', css.includes('top: calc(env(safe-area-inset-top, 0px) + 58px)'))

console.log('② index.html')
봄('시계 줄까지 꽉 채우는 설정(바뀌면 ① 다시 볼 것)', /apple-mobile-web-app-status-bar-style" content="black-translucent"/.test(html) && /viewport-fit=cover/.test(html))
const 흰 = (html.match(/<script>\s*\(function \(\) \{\s*var 표 = 'kcm_boot_fix'[\s\S]*?<\/script>/) || [''])[0]
봄('흰 화면 지킴 2 있음', 흰.length > 1000)
봄('묶음을 새로 받음(cache: reload)', /fetch\(u\[i\], \{ cache: 'reload' \}\)/.test(흰))
봄('한 번만(표 kcm_boot_fix · sessionStorage)', /sessionStorage\.getItem\(표\) === '1'/.test(흰) && /sessionStorage\.setItem\(표, '1'\)/.test(흰))
봄('12초 뒤 처음 봄 · 받는 중이면 45초까지 기다림', /setTimeout\(function \(\) \{ 봄\(12\); \}, 12000\)/.test(흰) && /받는중\(\) && 초 < 45/.test(흰))
봄('떴으면(__KCM_OK) 아무것도 안 함 · 숨은 탭은 기다림', /if \(window\.__KCM_OK\) return;/.test(흰) && /visibilityState === 'hidden'/.test(흰))
봄('상자 — 글 · 다시 열기 단추 · 오류 글', /화면을 띄우지 못했습니다/.test(흰) && /🔄 다시 열기/.test(흰) && /오류\[0\]/.test(흰))
봄('상자는 HTML 글을 안 씀(textContent)', !/innerHTML/.test(흰))
봄('숫자 칸(dl/p) 1씩만 · ETag', /X-Firebase-ETag/.test(흰) && /'if-match': tag/.test(흰) && /\(Number\(v\) \|\| 0\) \+ 1/.test(흰))
봄('묶음을 «못 받은» 때의 옛 지킴(kcm_main_reload)도 그대로', /var K = 'kcm_main_reload';/.test(html))
const 로봇흰 = (흰.match(/if \(\/([^/]+)\/i\.test\(navigator\.userAgent/) || [])[1]
const 로봇원 = (인사.match(/export const 로봇 = \(ua = ''\) => \/([^/]+)\/i\.test\(ua\)/) || [])[1]
봄('⑥ 로봇 거르기 = lib/인사.js 로봇', !!로봇흰 && 로봇흰 === 로봇원, `${로봇흰} ≠ ${로봇원}`)

console.log('③ main.jsx')
const 찍음 = main.indexOf('window.__KCM_OK = 1'), 그림 = main.lastIndexOf('else 그리기()')
봄('__KCM_OK 를 그리기 전에 찍음', 찍음 > 0 && 그림 > 찍음)
봄('표 · 상자 지움', /sessionStorage\.removeItem\('kcm_boot_fix'\)/.test(main) && /getElementById\('kcm-boot-box'\)/.test(main))

console.log('④ 화면지킴 · 지도지킴')
봄('화면지킴 — 진단세기 «|흰화면|지킴-기기-글»', /m\.진단세기\(`\|흰화면\|지킴-\$\{기기\}-\$\{짧게 \|\| '오류'\}`\)/.test(지킴))
봄('지도지킴 — 진단세기 «|지도멈춤|기기-글» · 옛 셈 그대로', /m\.진단세기\(`\|지도멈춤\|\$\{기기\}-\$\{짧게 \|\| '오류'\}`\)/.test(바로) && /세기\('\|바로투찰\|지도멈춤'\)/.test(바로))
봄('진단세기는 소장님 폰도 셈(운영자 거르기 없음)', /export async function 진단세기\(열쇠\) \{\s*try \{\s*if \(봇\(\) \|\| !\/\^\[\|\]\[\^\|\]\+\(\[\|\]\[\^\|\]\+\)\?\$\/\.test\(열쇠\)\) return\s*await 하나더/.test(받은수))

console.log('⑤ 숫자 칸 열쇠 꼴')
const 지움 = (s) => String(s).replace(/[|\/\\.#$[\]\s]+/g, ' ').trim()
const 열쇠흰 = (s) => ('|흰화면|' + String(s).replace(/[|\/\\.#$\[\]\s]+/g, ' ').trim()).slice(0, 80)      // index.html 과 같은 꼴
const 견본 = ["Uncaught SyntaxError: Unexpected token '<' @https://k-conmap.com/assets/index-AbC.js:1", 'a|b/c.d#e$f[g]h', '못 받음 index-x.js', 'R TypeError: Cannot read properties of undefined (reading \'map\')', '', 'x'.repeat(300)]
const 꼴 = /^[|][^|]+[|][^|./#$[\]]+$/
봄('index.html 꼴 — 어떤 글이 와도 두 마디 · 80자 · 금지 글자 없음', 견본.map((s) => 열쇠흰('상자-i앱-' + s)).every((k) => 꼴.test(k) && k.length <= 80))
봄('화면지킴 · 지도지킴 꼴', 견본.map((s) => `|흰화면|지킴-i앱-${지움(s).slice(0, 50) || '오류'}`).concat(견본.map((s) => `|지도멈춤|i-${지움(s).slice(0, 50) || '오류'}`)).every((k) => 꼴.test(k)))

/* 📱 G760 (11-18 15시) 소장님 아이폰 캡처 — 첫 화면은 고쳐졌는데 🔎 찾기 창(폰은 화면을 꽉 채움)의 입력칸 · ✕ 가 시계 줄 뒤로 숨음
   — G758 때 «머리줄 높이로 붙는 칸» 만 보고 «화면을 덮는 칸(position: fixed · inset 0 / top 0)» 을 다 보지 않았음 → 재발 막기: 덮는 칸은 모두 셈 */
console.log('⑦ 화면을 덮는 칸(position: fixed · inset 0 / top 0)은 모두 시계 줄 셈')
const 이름 = (r) => (r.slice(0, r.lastIndexOf('{')).split(/[{};\n]/).pop() || '').trim()
const 몸 = (r) => r.slice(r.lastIndexOf('{') + 1)
/* 덮개만(창은 따로 셈: .mt-sheet · .kcm-help-dlg) · PC 끌어 놓기 그림판 · 아래에서 올라오는 창(위 끝이 시계 줄 밑 — .cam-sheet 92vh · 설치 안내) */
const 덮개만 = new Set(['.mt-back', '.kcm-help-back', '.끌놓판', '.installguide', '.cam-dim'])
const 덮는칸 = 규칙들.filter((r) => /position:\s*fixed/.test(몸(r)) && (/(^|[;{\s])inset:\s*0[;\s}]/.test(몸(r)) || /(^|[;{\s])top:\s*0(px)?\s*[;}]/.test(몸(r)))).map(이름)
봄('덮는 칸을 찾음(시험이 헛돌지 않게)', 덮는칸.length >= 12 && 덮는칸.includes('.qs-back') && 덮는칸.includes('.noticepop'), String(덮는칸.length) + ' ' + 덮는칸.join(' · '))
const 셈안함 = 덮는칸.filter((s) => !덮개만.has(s) && !규칙들.some((r) => 이름(r) === s && 몸(r).includes(E)))
봄('덮개 · 아래 창 빼고 모두 시계 줄 셈(같은 이름 규칙 어딘가에 env(safe-area-inset-top))', 셈안함.length === 0, 셈안함.join(' · '))
봄('🔎 찾기 창 — 폰(꽉 채움)은 위 안쪽 = 시계 줄 · PC 는 그대로(7vh)', css.includes(`@media (max-width: 560px) { .qs-back { padding: ${E} 0 0; }`) && /\.qs-back \{\n\s*position: fixed; inset: 0;[^}]*padding: 7vh 12px 12px;/.test(css))
봄('가운데 창(공지 · 한 줄 남기기 · 표 · 엑셀 검사)은 위 안쪽 + 시계 줄', [`.noticepop { position: fixed; inset: 0; z-index: 1100; background: rgba(15, 23, 42, .55); display: grid; place-items: center; padding: calc(16px + ${E}) 16px 16px; }`,
  `padding: calc(16px + ${E}) 16px 16px;   /* 📱 G760 시계 줄 */`, `place-items: center; padding: calc(12px + ${E}) 12px 12px; }`, `display: grid; place-items: center; padding: calc(16px + ${E}) 16px 16px; }   /* 📱 G760 시계 줄 */`].every((x) => css.includes(x)))
봄('창 높이도 시계 줄만큼 줄임(.pb-mbox · .gmd-xlchk-box)', css.includes(`max-height: calc(100vh - 24px - ${E})`) && css.includes(`max-height: calc(100vh - 32px - ${E})`))
/* 자가시험 — 셈 안 한 덮는 칸을 일부러 넣으면 잡아야 함 */
{ const 가짜 = (css + `\n.시험덮개 { position: fixed; inset: 0; padding: 0; }\n`).split('}').map((r) => r + '}')
  봄('자가시험 — 셈 안 한 덮는 칸을 넣으면 잡음', 가짜.filter((r) => /position:\s*fixed/.test(몸(r)) && /(^|[;{\s])inset:\s*0[;\s}]/.test(몸(r))).map(이름).filter((s) => !덮개만.has(s) && !가짜.some((r) => 이름(r) === s && 몸(r).includes(E))).includes('.시험덮개')) }

/* 🩹 G765 (11-18 18시) 소장님 폰 캡처(어두운 화면) — 로고 줄(K-건설맵 · 🔎 · 🔄)이 뿌옇게 · 오후(밝은 화면)엔 시계 줄 뒤가 회색 띠
   아이폰(iOS 26)은 맨 위 «고정(fixed)» 칸의 바탕색으로 시계 줄 뒤를 칠하고, 없으면 쪽 바탕색 «그늘»을 깔아 아래로 번지게 함(머리줄은 sticky 라 안 침) */
console.log('⑧ 시계 줄 바탕(.kcm-sibar)')
const 바탕 = 규칙('.kcm-sibar')
봄('맨 위 고정 칸(fixed · top 0 · 왼 0 · 오른 0)', /position: fixed;/.test(바탕) && /\btop: 0;/.test(바탕) && /\bleft: 0;/.test(바탕) && /\bright: 0;/.test(바탕), 바탕.replace(/\s+/g, ' ').slice(0, 160))
봄('높이 = 시계 줄(PC · 안드로이드는 0)', 바탕.includes(`height: ${E};`))
봄('바탕 = 머리줄 색(var(--bar))', /background: var\(--bar\);/.test(바탕) && /background: var\(--bar\);/.test(머리 ? 머리[0] : ''))
const 바탕색들 = [...css.matchAll(/--bar:\s*([^;]+);/g)].map((m) => m[1].trim())
봄('머리줄 색은 밝은 · 어두운 화면 모두 불투명(#rrggbb)', 바탕색들.length >= 2 && 바탕색들.every((c) => /^#[0-9a-f]{6}$/i.test(c)), 바탕색들.join(' · '))
const z바탕 = Number((바탕.match(/z-index: (\d+);/) || [])[1]), z머리 = Number(((머리 ? 머리[0] : '').match(/z-index: (\d+);/) || [])[1])
봄('머리줄보다 위(z) — 시계 줄 자리만 덮음', z바탕 > z머리 && z바탕 < 60, `${z바탕} > ${z머리}`)
봄('pointer-events: none 없음(아이폰이 맨 위 칸을 찾을 때 건너뛰지 않게)', !/pointer-events/.test(바탕))
봄('인쇄에선 숨김', /@media print \{ \.kcm-sibar \{ display: none; \} \}/.test(css))
봄('키보드 바로잡기(html.vv-fix) 때 머리줄과 같이 내려감', /html\.vv-fix :is\([^)]*\.kcm-sibar\) \{ translate: 0 var\(--vv-dy, 0px\); \}/.test(css))
{ const 앱 = 읽('src/App.jsx')
  const 칸 = 앱.match(/<div className="kcm-sibar" aria-hidden="true" \/>/g) || []
  봄('App.jsx — 하나 · 머리줄(<header className="topbar">) 바로 앞', 칸.length === 1 && /<div className="kcm-sibar" aria-hidden="true" \/>\n\s*<header className="topbar">/.test(앱), String(칸.length)) }

console.log(`\n시험_아이폰위칸: ${통과}개 통과 · ${실패}개 실패`)
process.exit(실패 ? 1 : 0)
