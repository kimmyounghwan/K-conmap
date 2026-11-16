/**
 * 📰 맵톡 뉴스 글 카드(web/src/뉴스카드.jsx) 화면 시험 — 2026-11-16
 *   소장님 「좀 이상하지 않아. 뭔가 부실해 보이고 다른 방법 없어?」 → 「우선 만들어 보자. 그리고 한 번 보고 판단 하자」 → 「요약2줄로」
 *   준비: 가짜 파이어베이스로 구운 판(vite.config.mock — 진짜 맵톡 자료는 건드리지 않음)을 정적 서버로 띄움
 *   node tools/시험_뉴스카드.mjs [주소=http://127.0.0.1:4731]   (PLAYWRIGHT: /tmp/g10/pw · PC bat 에서는 안 돌림)
 *   ① 운영자 뉴스 글(띠 «📰 건설뉴스 — 11. 16.») → 카드: 👷 오늘 현장 한마디 · 갈래(사고 · 정책 · 정보) · 꼭지 수 = 그날 자료(public/newsd) ·
 *      원문 고리 = 자료의 https 주소 · 새 창 · noopener · «N건 전체 보기» → /news/2026-11-16
 *   ② 요약은 두 줄까지(넘치면 잘림) · 제목은 잘리지 않음
 *   ③ 운영자가 아닌 사람이 쓴 «📰 …» 글(/qna/{번호}) → 카드 아님(글자 그대로)
 *   ④ 자료가 없는 날(11. 10.) 운영자 뉴스 글 → 글자 그대로(뒤로 물러남)
 *   ⑤ 폭 320 · 390 · 1280 가로 넘침 없음 · 화면 오류 없음
 */
import { createRequire } from 'module'
import { OPS } from '../web/src/lib/운영자.js'
const require = createRequire(process.env.PW || '/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 주소 = process.argv[2] || 'http://127.0.0.1:4731'
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log(c ? '  ✓' : '  ✗', m, c ? '' : String(typeof 더 === 'string' ? 더 : JSON.stringify(더)).slice(0, 500)) }
const 키 = (n) => '-P5zz' + String(n).padStart(15, '0')
const at = Date.parse('2026-11-16T02:51:00Z')
const 본문 = '⚠ 사고 · 시험 글\n📜 정책 · 시험 글\n💡 정보 · 시험 글\n\n📰 전체 보기 → k-conmap.com/news\n이 글에 답글로 이야기 나눠요.'
const 씨앗 = { qna: {
  [키(1)]: { t: '[후기·건의] 잘 쓰고 있습니다', b: '고맙습니다', nick: '노련한 소장891', uid: 'u1', at: at - 5 * 3600e3 },
  [키(2)]: { t: '📰 건설뉴스 — 11. 16.(월)', b: 본문, c: 'K-건설맵', nick: 'K-건설맵', uid: OPS[0], at },
  [키(3)]: { t: '📰 건설뉴스 — 11. 16.(월)', b: '흉내 낸 글 · 카드로 바뀌면 안 됨', nick: '침착한 지게차548', uid: 'u9', at: at - 3600e3 },
  [키(4)]: { t: '📰 건설뉴스 — 11. 10.(화)', b: '자료 없는 날 · 글자 그대로', c: 'K-건설맵', nick: 'K-건설맵', uid: OPS[0], at: Date.parse('2026-11-10T02:51:00Z') },
}, qna_a: {}, qna_del: {}, qna_top: {} }
const 자료 = await (await fetch(주소 + '/newsd/2026-11-16.json')).json()
const 갈래수 = new Set(자료.items.map((x) => x.c)).size
const 브 = await chromium.launch()
for (const [이름, w, h] of [['PC', 1280, 1000], ['폰', 390, 844]]) {
  console.log('■ ' + 이름)
  const 판 = await 브.newContext({ viewport: { width: w, height: h }, isMobile: w < 500, hasTouch: w < 500, locale: 'ko-KR', timezoneId: 'Asia/Seoul' })
  await 판.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  await 판.route(/firebaseio\.com/, (r) => r.fulfill({ status: 503, body: 'down' }))
  await 판.addInitScript(([s]) => { if (!sessionStorage.getItem('씨앗됨')) { localStorage.setItem('mockdb', JSON.stringify(s)); localStorage.setItem('mockuid', 'viewer1'); sessionStorage.setItem('씨앗됨', '1') } localStorage.setItem('mock지연', '0'); localStorage.setItem('kcm_notice_seen', '2026-10-필독'); try { sessionStorage.setItem('kcm_notice_seen', '2026-10-업체') } catch (e) {} }, [씨앗])
  const A = await 판.newPage(); const 오류 = []; A.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  /* ① 띠에서 운영자 뉴스 글 열기 */
  await A.goto(주소 + '/qna', { waitUntil: 'domcontentloaded' })
  await A.waitForFunction(() => document.body.innerText.includes('건설뉴스 — 11. 16.(월)'), null, { timeout: 20000 })
  await A.waitForTimeout(2000)
  const 눌림 = await A.evaluate(() => { const b = [...document.querySelectorAll('button.mt-tk, button.mt-open')].find((e) => /건설뉴스 — 11\. 16/.test(e.textContent)); if (!b) return false; b.click(); return true })
  봐(눌림, '① 띠의 «📰 건설뉴스 — 11. 16.» 누름')
  await A.waitForSelector('.nc-it', { timeout: 15000 }).catch(() => {})
  await A.waitForTimeout(800)
  const c = await A.evaluate(() => ({
    한마디: (document.querySelector('.nc-one span') || {}).textContent || '',
    갈래: [...document.querySelectorAll('.nc-sec')].map((s) => s.getAttribute('aria-label')),
    꼭지: document.querySelectorAll('.nc-it').length,
    고리: [...document.querySelectorAll('.nc-o a')].map((a) => [a.getAttribute('href'), a.target, a.rel]),
    전체: (document.querySelector('.nc-all') || { getAttribute: () => '' }).getAttribute('href'),
    전체글: (document.querySelector('.nc-all') || {}).textContent || '',
  }))
  const 첫사고 = (자료.items.find((x) => x.c === '사고' && x.kk) || 자료.items.find((x) => x.kk) || {}).kk
  봐(c.한마디 === 첫사고, '① 👷 오늘 현장 한마디 = 첫 사고 꼭지의 현장 말', c.한마디)
  봐(c.갈래.length === 갈래수, `① 갈래 ${갈래수}개`, c.갈래)
  봐(c.꼭지 === 자료.items.length, `① 꼭지 ${자료.items.length}개(그날 자료 그대로)`, c.꼭지)
  봐(c.고리.length === 자료.items.filter((x) => x.u).length && c.고리.every(([u, t, r], i) => /^https:\/\//.test(u) && t === '_blank' && /noopener/.test(r) && /noreferrer/.test(r)),
    '① 원문 고리 — https · 새 창 · noopener noreferrer', c.고리)
  봐(c.고리.map((x) => x[0]).join() === 자료.items.filter((x) => x.u).map((x) => x.u).join(), '① 원문 주소 = 자료 주소 그대로(차례도)', c.고리.map((x) => x[0]))
  봐(c.전체 === '/news/2026-11-16' && c.전체글.includes(`${자료.items.length}건 전체 보기`), '① «N건 전체 보기» → /news/2026-11-16', [c.전체, c.전체글])
  /* ② 요약 두 줄 · 제목은 안 잘림 */
  const s = await A.evaluate(() => ({
    요약: [...document.querySelectorAll('.nc-s')].map((e) => Math.round(e.clientHeight / parseFloat(getComputedStyle(e).lineHeight) * 10) / 10),
    제목잘림: [...document.querySelectorAll('.nc-t')].filter((e) => e.scrollHeight > e.clientHeight + 1 || e.scrollWidth > e.clientWidth + 1).length,
  }))
  봐(s.요약.length > 0 && Math.max(...s.요약) <= 2.05, `${이름} ② 요약은 두 줄까지`, s.요약)
  봐(s.제목잘림 === 0, `${이름} ② 제목은 잘리지 않음`, s.제목잘림)
  /* ⑤ 넓이 */
  for (const 폭 of (이름 === '폰' ? [320, 390] : [1280])) {
    await A.setViewportSize({ width: 폭, height: h }); await A.waitForTimeout(300)
    const n = await A.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    봐(n <= 1, `${이름} ⑤ ${폭}px 가로 넘침 없음`, n)
  }
  /* ③ 운영자가 아닌 사람의 «📰» 글 · ④ 자료 없는 날 */
  for (const [n, 뜻, 글] of [[3, '③ 운영자 아닌 사람의 «📰» 글 → 카드 아님', '흉내 낸 글'], [4, '④ 자료 없는 날 운영자 뉴스 글 → 글자 그대로', '자료 없는 날']]) {
    await A.goto(주소 + '/qna/' + 키(n), { waitUntil: 'domcontentloaded' })
    await A.waitForFunction((g) => document.body.innerText.includes(g), 글, { timeout: 20000 }).catch(() => {})
    await A.waitForTimeout(2500)
    const r = await A.evaluate((g) => ({ 카드: document.querySelectorAll('.nc, .nc-it').length, 글: document.body.innerText.includes(g) }), 글)
    봐(r.카드 === 0 && r.글, 이름 + ' ' + 뜻, r)
  }
  봐(!오류.length, 이름 + ' 화면 오류 없음', 오류.join(' | '))
  await 판.close()
}
await 브.close()
console.log(bad ? `✗ ${bad} 틀림 · ${ok} 맞음` : `✓ 모두 맞음(${ok})`)
process.exit(bad ? 1 : 0)
