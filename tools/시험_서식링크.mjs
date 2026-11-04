/**
 * 🍚 G529 (2026-11-04) 화면 글 안 «사이트 안 링크» 지킴 — 인터넷 · 빌드 · playwright 없이(PC 올리기 시험에도)
 *   node tools/시험_서식링크.mjs
 *   소장님 「계속 사이트 찾게 해야 해」 → 서식 «놓치기 쉬운 것» · «언제 내나» · 안내 글의 [글](/forms/…) · [글](/tools/…) 는 사이트 안 링크(다음에 쓸 서류).
 *   ① 화면(Forms.jsx 굵게)과 구운 장(prerender.py bold_md)이 같은 꼴만 링크로 바꿈(사이트 안 주소만)
 *   ② forms.json · forms_orig.json 의 모든 링크가 «있는» 서식 · 도구를 가리킴(슬러그가 바뀌면 여기서 멈춤 — 죽은 링크 막기)
 *   ③ 특정공사 사전신고서 ↔ 소음 · 진동 측정 기록부 · 비산먼지 점검표 · 비산먼지 발생사업 신고서(G530) 서로 링크 · 한중 · 서중 콘크리트 시공계획서 ↔ 타설 · 레미콘 · 양생 · 혹서기(G531) · 품질관리비 산출내역서 ↔ 품질시험계획서 · 품질관리계획서 · 사용내역서(G532)
 *   ④ 바깥 주소 · 다른 꼴([글](https://…) · [글](/corp/…))은 링크로 안 바뀜(글 그대로)
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const 읽 = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8')
let 통과 = 0, 실패 = 0
const 봐 = (c, 무엇, 더 = '') => { if (c) { 통과++; console.log('  ✓', 무엇) } else { 실패++; console.log('  ✗', 무엇, 더 ? '— ' + String(더).slice(0, 300) : '') } }

console.log('① 화면 · 구운 장이 같은 꼴')
const 화면 = 읽('web/src/pages/Forms.jsx')
const 굽기 = 읽('prerender.py')
const 화면꼴 = (화면.match(/const 안링크 = \/(.+)\/g\r?\n/) || [])[1]   // 줄 끝 CRLF(PC) · LF 모두
const 굽기꼴 = (굽기.match(/re\.sub\(r"(\\\[\(\[\^\\\]\\n\]\+\)\\\]\\\(\(\/\(\?:forms\|tools\)\/\[A-Za-z0-9\\-\/\]\+\)\\\))"/) || [])[1]
봐(!!화면꼴, 'Forms.jsx 에 안링크 꼴', 화면꼴)
봐(!!굽기꼴, 'prerender.py bold_md 에 같은 꼴', 굽기꼴)
봐(화면꼴 && 굽기꼴 && 화면꼴.replace(/\\\//g, '/') === 굽기꼴, '두 꼴이 글자까지 같음', [화면꼴, 굽기꼴].join('  ≠  '))
봐(/function 굵게\(s\) \{\s+const 조각 = String\(s\)\.split\(안링크\)/.test(화면), '굵게(놓치기 쉬운 것 · 언제 내나 · 안내) 가 안링크로 나눔')
봐(/<Link key=\{`\$\{i\}\.a`\} className="flink" to=\{조각\[i \+ 2\]\}>\{조각\[i \+ 1\]\}<\/Link>/.test(화면), '사이트 안 이동(Link) — 새로 불러오지 않음 · 링크 꼴(flink)')
const 꾸밈 = 읽('web/src/styles.css')
봐(/a\.flink \{[^}]*color: var\(--accent\)[^}]*text-decoration: underline/.test(꾸밈), '링크가 링크로 보임(a.flink 색 · 밑줄 — 그냥 a 는 글과 같은 색)')
봐(/r'<a class="flink" href="\\2">\\1<\/a>'/.test(굽기), '구운 장 링크도 flink')
const 꼴 = new RegExp(화면꼴 ? 화면꼴.replace(/\\\//g, '/') : 'x^', 'g')
const 나눔 = (s) => String(s).split(꼴)
봐(JSON.stringify(나눔('앞 [가](/forms/a-b) 뒤')) === JSON.stringify(['앞 ', '가', '/forms/a-b', ' 뒤']), '[가](/forms/a-b) → 글 · 링크글 · 주소 · 글')
봐(나눔('[가](https://x.y/forms/a)').length === 1 && 나눔('[가](/corp/a)').length === 1 && 나눔('[가](/forms/a"onclick)').length === 1, '바깥 주소 · 다른 갈래 · 이상한 글자는 링크로 안 바뀜')

console.log('② 링크가 있는 서식 · 도구를 가리킴')
const F = JSON.parse(읽('web/src/data/forms.json')).forms
const O0 = JSON.parse(읽('web/src/data/forms_orig.json'))
const O = Array.isArray(O0) ? O0 : (O0.forms || [])
const T = JSON.parse(읽('web/src/data/tools.json')).tools
const 길들 = new Set([...F.map((f) => '/forms/' + f.slug), ...O.map((f) => '/forms/' + f.slug), ...T.map((t) => '/tools/' + t.slug),
  ...[...읽('web/src/main.jsx').matchAll(/path="(\/tools\/[a-z0-9-]+)"/g)].map((m) => m[1])])
const 글들 = (f) => [f.when, ...(f.notes || []), ...((f.guide && [f.guide.what, ...(f.guide.how || []).map((x) => x[1])]) || [])].filter(Boolean)
const 링크 = []
for (const f of [...F, ...O]) for (const s of 글들(f)) for (const m of String(s).matchAll(꼴)) 링크.push([f.slug, m[1], m[2]])
const 죽은 = 링크.filter(([, , 주소]) => !길들.has(주소))
봐(링크.length >= 4, `링크 ${링크.length}곳`)
봐(!죽은.length, '죽은 링크 0', JSON.stringify(죽은))
봐(링크.every(([s, , 주소]) => 주소 !== '/forms/' + s), '자기 자신을 가리키는 링크 없음')

console.log('③ 다음에 쓸 서류 — 서로 링크')
const 가 = (from, to) => 링크.some(([s, , 주소]) => s === from && 주소 === '/forms/' + to)
봐(가('teukjeong-singo', 'soeum') && 가('teukjeong-singo', 'bisan'), '특정공사 사전신고서 → 소음 · 진동 측정 기록부 · 비산먼지 점검표')
봐(가('soeum', 'teukjeong-singo') && 가('bisan', 'teukjeong-singo'), '두 서식 → 특정공사 사전신고서')
봐(가('teukjeong-singo', 'bisan-singo') && 가('bisan-singo', 'teukjeong-singo'), '🌫️ G530 특정공사 사전신고서 ↔ 비산먼지 발생사업 신고서(착공 전 환경 신고 한 벌)')
봐(가('bisan-singo', 'bisan') && 가('bisan', 'bisan-singo'), '비산먼지 발생사업 신고서 ↔ 비산먼지 점검표(착공 전 → 공사 중)')
봐(가('hanjung-seojung', 'taseol-check') && 가('hanjung-seojung', 'remicon') && 가('hanjung-seojung', 'yangsaeng'), '🌡️ G531 한중 · 서중 콘크리트 시공계획서 → 타설 체크리스트 · 레미콘 반입 검사표 · 양생 관리대장')
봐(가('yangsaeng', 'hanjung-seojung') && 가('taseol-check', 'hanjung-seojung') && 가('hokseo', 'hanjung-seojung'), '양생 관리대장 · 타설 체크리스트 · 혹서기 · 혹한기 대책 → 한중 · 서중 콘크리트 시공계획서')
봐(가('pumjil-sanchul', 'pumjil-gyehoek') && 가('pumjil-sanchul', 'o-anjeon-pumjil-bi') && 가('pumjil-gyehoek', 'pumjil-sanchul') && 가('pumjil-gwanri-gyehoek', 'pumjil-sanchul'), '🧮 G532 품질관리비 산출내역서 ↔ 품질시험계획서 · 품질관리계획서 → 안전 · 품질관리비 사용내역서')

const 도구로 = (from, to) => 링크.some(([s, , 주소]) => s === from && 주소 === '/tools/' + to)
봐(도구로('gisung-cheonggu', 'payment-deadline') && 도구로('jungong-daega', 'payment-deadline'), '💰 G534 기성금 청구서 · 준공대가 청구서 → 기성금 · 준공금 지급 기한(받을 날)')

console.log('④ 구운 장 글에 [ ]( ) 꼴이 남지 않게 — bold_md 를 거치는 자리')
const 자리 = (굽기.match(/bold_md\(esc\(/g) || []).length
봐(자리 >= 4, `prerender.py 에서 bold_md(esc(…)) ${자리}곳(서식 안내 · 언제 · 놓치기 쉬운 것 포함)`)
봐(/out\.extend\(f"<li>\{bold_md\(esc\(n\)\)\}<\/li>" for n in f\["notes"\]\)/.test(굽기), '구운 서식 장 «놓치기 쉬운 것» 이 bold_md 를 거침')
봐(/<div class="fwhen">\{bold_md\(esc\(f\["when"\]\)\)\}<\/div>/.test(굽기), '구운 서식 장 «언제 내나» 도')

console.log(`\n${실패 ? '✗' : '✓'} 시험_서식링크 ${통과}/${통과 + 실패}`)
process.exit(실패 ? 1 : 0)
