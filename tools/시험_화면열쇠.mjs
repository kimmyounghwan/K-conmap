/* 🧪 G537 (2026-11-04) 화면열쇠 «두 마디» — 화면(lib/받은수.jsx)과 깃허브(tools/이용자지도.py)가 같은 표를 쓰는지 · 카드 화면이 윗 화면과 안 섞이는지
     node tools/시험_화면열쇠.mjs
   까닭: 소장님 「조회는 이렇게 많은데, 받기는 없어」 — «하도급 견적틀»(/first/hado-gyeonjeok) 카드가 «|first»(1순위 화면 전체) 조회 2,321 을 보였음. */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const 읽 = (p) => fs.readFileSync(path.join(ROOT, p), 'utf-8')
let ok = 0, bad = 0
const 봐 = (what, cond, 덧 = '') => { if (cond) { ok++; console.log('  ✓', what) } else { bad++; console.log('  ✗', what, 덧) } }
const js = 읽('web/src/lib/받은수.jsx'), py = 읽('tools/이용자지도.py')
const 표js = new Set(((js.match(/const 두마디 = new Set\(\[([^\]]*)\]\)/) || [])[1] || '').match(/'([^']+)'/g)?.map((x) => x.slice(1, -1)) || [])
const 표py = new Set(((py.match(/^두마디 = \{([^}]*)\}/m) || [])[1] || '').match(/"([^"]+)"/g)?.map((x) => x.slice(1, -1)) || [])
봐(`두마디 표 — 화면 ${표js.size} · 깃허브 ${표py.size} 가 같음`, 표js.size > 5 && 표js.size === 표py.size && [...표js].every((x) => 표py.has(x)), JSON.stringify([[...표js], [...표py]]))
봐('first 도 두 마디(1순위 아래 화면을 따로 셈)', 표js.has('first') && 표py.has('first'))
/* 화면열쇠 — 받은수.jsx 와 같은 셈(두 마디 표만 위에서 읽은 것) */
const 열쇠꼴 = (s) => String(s).replace(/\./g, ',').replace(/\//g, '|').replace(/[#$[\]]/g, '_')
const 화면열쇠 = (p) => { const m = String(p || '/').split('?')[0].split('#')[0].split('/').filter(Boolean); if (!m.length) return '|'; const 둘 = 표js.has(m[0]) ? m.slice(0, 2) : m.slice(0, 1); let k; try { k = 둘.map((x) => decodeURIComponent(x)).join('|') } catch (e) { k = 둘.join('|') } return 열쇠꼴('|' + k).slice(0, 80) }
봐('«/first» → |first · «/first/hado-gyeonjeok» → |first|hado-gyeonjeok', 화면열쇠('/first') === '|first' && 화면열쇠('/first/hado-gyeonjeok') === '|first|hado-gyeonjeok')
/* 카드 화면(도구 · 내역서 · 적산 · 서식 단계 카드) — 두 마디 이상이면 열쇠도 두 마디 */
const 카드 = new Set()
for (const f of ['web/src/data/tools.json', 'web/src/data/forms_tab.json']) { try { for (const m of 읽(f).matchAll(/"to":\s*"(\/[^"]+)"/g)) 카드.add(m[1]) } catch (e) { /* 없음 */ } }
for (const f of ['web/src/pages/Naeyeok.jsx', 'web/src/pages/Jeoksan.jsx', 'web/src/pages/Tools.jsx', 'web/src/pages/Forms.jsx']) { for (const m of 읽(f).matchAll(/to: '(\/[^']+)'/g)) 카드.add(m[1]) }
const 묶임 = [...카드].filter((a) => a.split('?')[0].split('#')[0].split('/').filter(Boolean).length >= 2 && 화면열쇠(a).split('|').length - 1 < 2)
봐(`카드 화면 ${카드.size}곳 — 두 마디 화면은 열쇠도 두 마디(윗 화면 조회를 안 받음)`, 카드.size > 40 && 카드.has('/first/hado-gyeonjeok') && !묶임.length, 묶임.slice(0, 5).join(' · '))
/* 시작값 — 따로 세기 전 숫자(받기 p · 조회 v) */
const 시작 = JSON.parse(읽('web/src/data/받은수_시작.json'))
봐('시작값 — 하도급 견적틀 받기 1(p) · 조회 6(v)', 시작.p['|first|hado-gyeonjeok'] === 1 && 시작.v && 시작.v['|first|hado-gyeonjeok'] === 6)
봐('화면이 조회 시작값(v)을 더함(받은수.jsx 읽기)', /시작\.v\b[^\n]*합침\[k\]/.test(js))
console.log(`\n${bad ? '✗' : '✓'} 시험_화면열쇠 ${ok}/${ok + bad}`)
process.exit(bad ? 1 : 0)
