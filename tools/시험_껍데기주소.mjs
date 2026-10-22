// 🔎 G375 (2026-10-22) 서치 콘솔 «적절한 표준 태그가 포함된 대체 페이지» 고침 시험 — 파이어베이스 호스팅 에뮬레이터(진짜 규칙)로 봅니다
//   돌리기: cd web && npx vite build && cd .. && python prerender.py → cd web && firebase emulators:start --only hosting --project demo-kconmap
//           → B=http://127.0.0.1:5000 node tools/시험_껍데기주소.mjs [미리구운공고번호] [안구운공고번호]
//   A 미리 굽지 않은 공고 /notice/{번호}: 200 · canonical 없음(전엔 «홈») · og:url 없음 · 홈 본문 없음 → 화면이 그 공고 화면으로 그려짐
//   B 끝 «/» /first/ → 301 /first · 1순위 화면 · canonical /first
//   C 끝 «/» /tools/safecard/ → 301 /tools/safecard · 안전카드가 그려짐 · 미리 구운 공고 · 홈 · 없는 주소(404 · noindex)는 그대로
import { createRequire } from 'module'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const B = process.env.B || 'http://127.0.0.1:5000'
const 구운 = process.argv[2] || 'R26BK01467013', 안구운 = process.argv[3] || 'R26BK01643112'
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log(c ? '✓' : '✗', m, c ? '' : 더) }
const 받기 = async (u) => {
  const r = await fetch(B + u, { redirect: 'manual' })
  const h = r.status >= 300 && r.status < 400 ? '' : await r.text()
  const c = (h.match(/<link rel="canonical" href="([^"]*)"/) || [])[1] || ''
  return { s: r.status, to: r.headers.get('location') || '', h, c: c.replace('https://k-conmap.com', ''), og: /property="og:url"/.test(h), ni: /name="robots" content="noindex"/.test(h) }
}
/* 주소마다 HTML(서버가 주는 그대로 — 구글이 처음 보는 것) */
let x = await 받기('/notice/' + 안구운)
봐(x.s === 200 && x.c === '' && !x.og, `A 안 구운 공고 → 200 · canonical 없음 · og:url 없음`, JSON.stringify({ s: x.s, c: x.c, og: x.og }))
봐(x.h.includes('<div id="root"></div>'), 'A 홈 본문이 안 들어간 빈 껍데기(홈 사본 아님)')
x = await 받기('/notice/' + 구운)
봐(x.s === 200 && x.c === '/notice/' + 구운, 'A 미리 구운 공고는 그대로 자기 canonical', x.c)
x = await 받기('/')
봐(x.s === 200 && x.c === '/' && x.og, '홈은 그대로 canonical /')
x = await 받기('/first/')
봐(x.s === 301 && /\/first$/.test(x.to), 'B /first/ → 301 /first', `${x.s} ${x.to}`)
x = await 받기('/first')
봐(x.s === 200 && x.c === '/first', 'B /first canonical /first', x.c)
x = await 받기('/tools/safecard/')
봐(x.s === 301 && /\/tools\/safecard$/.test(x.to), 'C /tools/safecard/ → 301', `${x.s} ${x.to}`)
x = await 받기('/qna/-가상글없음')
봐(x.s === 200 && x.c === '' && !x.og, 'C 막 올라온(안 구운) 맵톡 글 → canonical 없음')
x = await 받기('/가상-없는-주소')
봐(x.s === 404 && x.ni && x.c === '', '없는 주소는 그대로 404 · noindex')

/* 화면(사람 · 구글 렌더러가 보는 것) */
const 브 = await chromium.launch()
const 판 = await 브.newContext({ viewport: { width: 1280, height: 900 }, locale: 'ko-KR' })
await 판.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs|firebaseio/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
const A = await 판.newPage()
const 오류 = []
A.on('pageerror', (e) => 오류.push(String(e).slice(0, 160)))
await A.goto(B + '/first/', { waitUntil: 'domcontentloaded' })
봐(new URL(A.url()).pathname === '/first', 'B 화면: /first/ 로 들어오면 주소가 /first', A.url())
await A.waitForTimeout(1500)
봐(/1순위/.test(await A.locator('body').innerText()), 'B 화면: 1순위 화면이 그려짐')
await A.goto(B + '/tools/safecard/', { waitUntil: 'domcontentloaded' })
await A.waitForSelector('.sc-wrap', { timeout: 20000 }).catch(() => {})
봐(new URL(A.url()).pathname === '/tools/safecard' && await A.locator('.sc-wrap').count() > 0, 'C 화면: 안전카드가 그려짐', A.url())
await A.goto(B + '/notice/' + 안구운, { waitUntil: 'domcontentloaded' })
await A.waitForTimeout(2500)
const 글 = await A.locator('body').innerText()
봐(글.length > 200 && !/바로투찰 — /.test(await A.title()), 'A 화면: 안 구운 공고 주소에서 홈이 아닌 공고 화면(있으면 공고 · 없으면 «없는 공고»)', (await A.title()).slice(0, 80))
const 표 = await A.evaluate(() => [document.querySelector('link[rel="canonical"]')?.href || '', document.querySelector('meta[name="robots"]')?.content || ''])
봐(!/k-conmap\.com\/?$/.test(표[0]), 'A 화면: 그린 뒤에도 canonical 이 «홈» 이 아님', JSON.stringify(표))
await A.goto(B + '/', { waitUntil: 'domcontentloaded' })
await A.waitForTimeout(1200)
await A.locator('a[href="/tools"]').first().click().catch(() => {})
await A.waitForTimeout(1200)
봐(new URL(A.url()).pathname === '/tools', '홈 → 도구 (앱 안에서 옮겨 가기) 그대로', A.url())
봐(오류.length === 0, '화면 오류 없음', 오류.join(' | '))
await 브.close()
console.log(`\n${bad ? '❌' : '✅'} 껍데기 주소 시험 ${ok + bad}개 중 ${ok} 맞음 · ${bad} 틀림`)
process.exit(bad ? 1 : 0)
