/**
 * 📝 G688 블로그에서 온 사람 세기 — lib/블로그셈.js 시험(인터넷 · node_modules 없이 · PC 올리기에도)
 *   ① 꼬리 꼴 ② 들어온 곳 ③ 갈래(꼬리가 앞섬 · 🩹 G810 꼴이 아닌 b 는 안 뗌 — 용역 · 물품 바로투찰 b = 기초금액) ④ 열쇠 꼴 = 받은수.jsx 세기 규칙 ⑤ 같은 탭 한 번 · 다른 글은 셈
 *   ⑥ 브라우저 흉내 — 주소에서 b 만 뗌(m=1 · # 그대로) · 셈 열쇠 ⑦ main.jsx 가 그리기 «전» 에 부름 ⑧ 쓴수판 전체머리
 * 쓰는 법: node tools/시험_블로그셈.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const L = await import(pathToFileURL(path.join(ROOT, 'web', 'src', 'lib', '블로그셈.js')).href)
let 좋음 = 0, 나쁨 = 0
const 봐 = (ok, 말, 덧) => { if (ok) { 좋음++; console.log('  ✓ ' + 말) } else { 나쁨++; console.log('  ✗ ' + 말 + (덧 === undefined ? '' : ' = ' + JSON.stringify(덧))) } }
const 같 = (a, b) => JSON.stringify(a) === JSON.stringify(b)

console.log('① 꼬리 꼴')
봐(같(L.꼬리풀기('n3'), { 출처: '네이버', 글: 'n3' }), 'n3 → 네이버 · n3')
봐(같(L.꼬리풀기('G12'), { 출처: '구글', 글: 'g12' }), 'G12 → 구글 · g12(대문자도)')
봐(같(L.꼬리풀기('n'), { 출처: '네이버', 글: null }), 'n → 네이버 · 글 번호 없음')
봐(같(L.꼬리풀기(' g7 '), { 출처: '구글', 글: 'g7' }), '앞뒤 빈칸 뗌')
봐(L.꼬리풀기('n0') === null && L.꼬리풀기('n01') === null && L.꼬리풀기('n10000') === null, 'n0 · n01 · n10000 → 아님')
봐(L.꼬리풀기('x3') === null && L.꼬리풀기('') === null && L.꼬리풀기(null) === null && L.꼬리풀기('n3|x') === null, 'x3 · 빈칸 · null · 섞인 글 → 아님')

console.log('② 들어온 곳')
봐(L.들어온곳풀기('https://blog.naver.com/kconmap/223456') === '네이버', 'blog.naver.com → 네이버')
봐(L.들어온곳풀기('https://m.blog.naver.com/PostView.naver?blogId=x') === '네이버', 'm.blog.naver.com → 네이버')
봐(L.들어온곳풀기('https://k-conmap.blogspot.com/2026/11/a.html') === '구글', '블로그스팟 → 구글')
봐(L.들어온곳풀기('https://www.blogger.com/') === '구글', 'blogger.com → 구글')
봐(L.들어온곳풀기('https://search.naver.com/search.naver?query=x') === null && L.들어온곳풀기('https://cafe.naver.com/x') === null, '네이버 검색 · 카페는 블로그 아님')
봐(L.들어온곳풀기('https://k-conmap.com/tools') === null && L.들어온곳풀기('') === null && L.들어온곳풀기('아무 글') === null, '같은 사이트 · 빈칸 · 깨진 주소 → 아님')
봐(L.들어온곳풀기('https://blog.naver.com.evil.io/') === null && L.들어온곳풀기('https://blogspot.com.evil.io/') === null && L.들어온곳풀기('https://notblog.naver.com/') === null, '흉내 낸 주소(…naver.com.evil.io · blogspot.com.evil.io) → 아님')

console.log('③ 갈래')
봐(같(L.블로그갈래('?b=n3', ''), { 출처: '네이버', 글: 'n3', 뗄: true }), '?b=n3 → 네이버 · n3 · 뗌')
봐(같(L.블로그갈래('?m=1&b=g2', 'https://blog.naver.com/x'), { 출처: '구글', 글: 'g2', 뗄: true }), '꼬리가 들어온 곳보다 앞섬')
봐(같(L.블로그갈래('', 'https://m.blog.naver.com/x/1'), { 출처: '네이버', 글: null, 뗄: false }), '꼬리 없이 블로그에서 옴 → 출처만 · 뗄 것 없음')
봐(같(L.블로그갈래('?b=zz', 'https://k-conmap.blogspot.com/'), { 출처: '구글', 글: null, 뗄: false }), '🩹 G810 꼴이 아닌 b + 블로그에서 옴 → 출처만 · b 는 그대로')
봐(L.블로그갈래('?b=zz', '') === null, '🩹 G810 꼴이 아닌 b 만 → 셈 없음 · 안 뗌')
봐(L.블로그갈래('?no=R26BK00000001&b=52800000&l=87.745&lo=-2&hi=2', '') === null, '🩹 G810 용역 · 물품 바로투찰 주소(b = 기초금액) → 블로그 아님 · b 그대로')
봐(L.블로그갈래('', '') === null && L.블로그갈래('?m=1', 'https://www.google.com/') === null, '꼬리 · 블로그 아님 → null')

console.log('④ 열쇠 꼴 = 받은수.jsx 세기 규칙')
const 받은수 = fs.readFileSync(path.join(ROOT, 'web', 'src', 'lib', '받은수.jsx'), 'utf8')
const 규칙글 = (/export async function 세기\(열쇠\) \{[\s\S]*?!\/(\^\[\|\][^/]*\$)\/\.test\(열쇠\)/.exec(받은수) || [])[1]
봐(!!규칙글, '받은수.jsx 세기 열쇠 규칙을 읽음', 규칙글)
const 규칙 = new RegExp(규칙글 || '^$')
const 다 = [['?b=n3', ''], ['?b=g9999', ''], ['', 'https://blog.naver.com/x'], ['?b=g', '']].map(([s, r]) => L.블로그열쇠(L.블로그갈래(s, r)))
봐(같(다, [['|블로그|네이버', '|블로그글|n3'], ['|블로그|구글', '|블로그글|g9999'], ['|블로그|네이버'], ['|블로그|구글']]), '열쇠 — 출처 하나 + 글 번호 있으면 글 하나', 다)
봐(다.flat().every((k) => 규칙.test(k) && k.length <= 80), '모든 열쇠가 세기 규칙(«|한 마디» · «|두|마디») · 80자 안')
봐(같(L.블로그열쇠(null), []) && 같(L.블로그열쇠({ 출처: null, 글: null }), []), '갈래 없음 → 열쇠 없음')

console.log('⑤ 같은 탭 한 번 · 다른 글은 셈')
const 가짜저장 = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) } }
const s1 = 가짜저장()
봐(같(L.새열쇠(['|블로그|네이버', '|블로그글|n3'], s1), ['|블로그|네이버', '|블로그글|n3']), '처음 — 둘 다 셈')
봐(같(L.새열쇠(['|블로그|네이버', '|블로그글|n3'], s1), []), '같은 탭 다시 읽기 — 안 셈')
봐(같(L.새열쇠(['|블로그|네이버', '|블로그글|n5'], s1), ['|블로그글|n5']), '같은 탭 · 다른 글(n5)에서 또 옴 — 글만 셈(출처는 한 번)')
봐(같(L.새열쇠(['|블로그|구글'], s1), ['|블로그|구글']), '같은 탭 · 구글 블로그에서도 옴 — 구글 셈')
봐(같(L.새열쇠(['|블로그|네이버'], null), ['|블로그|네이버']), '저장 못 씀(사생활 보호 모드) — 그래도 셈')
const s2 = 가짜저장(); s2.setItem('kcm.blog.t', '{망가짐')
봐(같(L.새열쇠(['|블로그|구글'], s2), ['|블로그|구글']), '저장값이 망가져도 셈')

console.log('⑥ 브라우저 흉내 — 주소에서 b 만 뗌')
/* 노드 판에 따라 sessionStorage 같은 이름이 «읽기만» 으로 있을 수 있어(노드 25 웹 저장소) 덮어쓰기 대신 defineProperty */
const 둠 = (k, v) => Object.defineProperty(globalThis, k, { value: v, configurable: true, writable: true, enumerable: true })
const 흉내 = (href, ref) => {
  const 바꾼 = []
  둠('window', {})
  둠('location', new URL(href))
  둠('document', { referrer: ref })
  둠('history', { state: { k: 1 }, replaceState: (st, t, u) => { 바꾼.push(u); 둠('location', new URL(u, href)) } })
  const m = new Map(); 둠('sessionStorage', { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) })
  return 바꾼
}
let 바꾼 = 흉내('https://k-conmap.com/change/twoline?m=1&b=n3#ex', '')
let 결과 = L.블로그세기()
봐(같(바꾼, ['/change/twoline?m=1#ex']), '?m=1&b=n3#ex → /change/twoline?m=1#ex(m · # 그대로)', 바꾼)
봐(결과 && 같(결과.셈, ['|블로그|네이버', '|블로그글|n3']), '셈 열쇠 둘', 결과)
결과 = L.블로그세기()
봐(결과 === null, '꼬리를 뗀 뒤 다시 부르면 아무 일 없음(들어온 곳도 블로그 아님)', 결과)
바꾼 = 흉내('https://k-conmap.com/tools?b=g2', 'https://k-conmap.blogspot.com/2026/11/x.html')
결과 = L.블로그세기()
봐(같(바꾼, ['/tools']) && 같(결과.셈, ['|블로그|구글', '|블로그글|g2']), '?b=g2 → /tools · 구글 · g2', [바꾼, 결과])
바꾼 = 흉내('https://k-conmap.com/forms', 'https://m.blog.naver.com/kconmap/1')
결과 = L.블로그세기()
봐(같(바꾼, []) && 같(결과.셈, ['|블로그|네이버']), '꼬리 없이 네이버 블로그에서 옴 → 주소 그대로 · 네이버만', [바꾼, 결과])
결과 = L.블로그세기()
봐(같(결과.셈, []), '같은 탭에서 다시 읽기(새로 고침) → 안 셈', 결과)
바꾼 = 흉내('https://k-conmap.com/?b=%3Cx%3E', '')
결과 = L.블로그세기()
봐(결과 === null && 같(바꾼, []), '🩹 G810 꼴이 아닌 꼬리(<x>) → 안 뗌 · 안 셈', [바꾼, 결과])
바꾼 = 흉내('https://k-conmap.com/svc/calc?no=R26BK00000001&b=52800000&l=87.745&lo=-2&hi=2&pm=%EB%B3%B5%EC%88%98%EC%98%88%EA%B0%80', '')
결과 = L.블로그세기()
봐(결과 === null && 같(바꾼, []), '🩹 G810 용역 바로투찰 새로 고침 · 공유 링크 → 주소 그대로(b = 기초금액 안 떨어짐)', [바꾼, 결과])
바꾼 = 흉내('https://k-conmap.com/live?q=b%3Dn3', '')
결과 = L.블로그세기()
봐(결과 === null && 같(바꾼, []), '다른 꼬리 안의 «b=n3» 글은 안 봄', [바꾼, 결과])
둠('history', { replaceState: () => { throw new Error('막힘') } })
둠('location', new URL('https://k-conmap.com/?b=n3'))
봐(L.블로그세기() === null, 'history 가 막혀도 오류를 밖으로 안 냄(사이트 멈춤 없음)')
for (const k of ['window', 'location', 'document', 'history', 'sessionStorage']) { try { delete globalThis[k] } catch (e) { /* 그대로 */ } }

console.log('⑦ main.jsx 가 그리기 «전» 에 부름')
const 메인 = fs.readFileSync(path.join(ROOT, 'web', 'src', 'main.jsx'), 'utf8')
봐(/import \{ 블로그세기 \} from '\.\/lib\/블로그셈\.js'/.test(메인), 'main.jsx 가 블로그세기 를 불러옴')
const 부름 = 메인.indexOf('try { 블로그세기() }'), 그림 = 메인.indexOf('if (열쇠왔나()) 열쇠받기().then(그리기)')
봐(부름 > 0 && 그림 > 0 && 부름 < 그림, '블로그세기() 가 try 안 · 그리기(라우터 시작)보다 앞', [부름, 그림])

console.log('⑧ 쓴수판 전체머리')
const 판 = fs.readFileSync(path.join(ROOT, 'web', 'src', 'lib', '쓴수판.jsx'), 'utf8')
봐(/const 전체머리 = \[[^\]]*'\|블로그'[^\]]*'\|블로그글'/.test(판), "쓴수판 전체머리에 '|블로그' · '|블로그글'")

console.log(나쁨 ? `\n❌ 시험_블로그셈 ${좋음}/${좋음 + 나쁨}` : `\n✅ 시험_블로그셈 ${좋음}/${좋음}`)
process.exit(나쁨 ? 1 : 0)
