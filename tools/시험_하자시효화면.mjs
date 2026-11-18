/**
 * ⏳ G762 (2026-11-18) 하자담보책임기간 도구 «청구할 수 있는 기간(소멸시효)» — 화면 시험(클라우드 · 구운 사이트)
 *   LANG=C.UTF-8 node tools/시험_하자시효화면.mjs [주소=http://127.0.0.1:4988]   (OUT=폴더 면 화면 사진)
 *   ① 폰 390 — 맨 아래(📋 공종별 기간 표 전체 보기 다음)에 «⏳ 청구할 수 있는 기간(소멸시효)» 네 줄 · 줄마다 근거 괄호 · 끝줄
 *   ② 예시 그대로 — 아스팔트 포장 도로 2년 · 끝나는 무렵 2028-12-20 · 보증금 9,000,000원(3%) · 시효 글은 셈 결과와 섞이지 않음
 *   ③ 폰 320 · PC 1280 — 같은 글 · 가로 넘침 0 · 화면 오류 0
 * 인터넷 안 부름(파이어베이스 · 광고 · 애널리틱스 막음) · 이 시험 브라우저 안에서만 적음.
 */
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4988'
const OUT = process.env.OUT || ''

let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 600))) }
const UA = { PC: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', 폰: 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36' }
const b = await chromium.launch()
async function 새쪽(w, h, 폰 = true, 미리 = null) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, userAgent: 폰 ? UA.폰 : UA.PC, deviceScaleFactor: OUT ? 2 : 1 })
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs|coupang|daumcdn|kakao/, (r) => r.fulfill({ status: 200, body: '' }))
  await ctx.route(/firebaseio\.com|firebasedatabase\.app/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: r.request().method() === 'GET' ? 'null' : (r.request().postData() || 'null') }))
  await ctx.addInitScript((미리) => {
    try {
      localStorage.setItem('kcm_notice_seen', '2026-10-필독'); localStorage.setItem('kcm_how_seen', '1')
      sessionStorage.setItem('kcm_notice_seen', '2026-11-광고'); sessionStorage.setItem('kcm_visit_s', '1')
      if (미리 && !sessionStorage.getItem('__미리')) { for (const [k, v] of Object.entries(미리)) localStorage.setItem(k, v); sessionStorage.setItem('__미리', '1') }
    } catch (e) { /* 없음 */ }
  }, 미리)
  const p = await ctx.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  p.on('dialog', (d) => d.dismiss())
  return { ctx, p, 오류 }
}
const 시효읽기 = (p) => p.evaluate(() => {
  const t = document.querySelector('.tool')
  const h = [...t.querySelectorAll('.kt-h')].find((x) => /청구할 수 있는 기간/.test(x.textContent))
  const ul = h && h.nextElementSibling
  const 끝 = ul && ul.nextElementSibling
  const 표 = t.querySelector('details.kt-all')
  const 뒤 = (a, b2) => !!(a && b2 && (a.compareDocumentPosition(b2) & Node.DOCUMENT_POSITION_FOLLOWING))
  return {
    제목: h ? h.textContent : '',
    줄: ul && ul.classList.contains('hs-list') ? [...ul.querySelectorAll('li')].map((li) => li.innerText.replace(/\s+/g, ' ').trim()) : [],
    끝: 끝 && 끝.classList.contains('hint') ? 끝.textContent.trim() : '',
    표다음: 뒤(표, h),
    맨끝: !!(끝 && 끝 === t.lastElementChild),
    넘침: document.documentElement.scrollWidth - innerWidth,
    결과: [...t.querySelectorAll('.out, .tl-out, .kt-out, [class*="out"]')].map((x) => x.innerText.replace(/\s+/g, ' ')).join(' | ').slice(0, 600),
  }
})
const 맞는지 = (r) => r.제목 === '⏳ 청구할 수 있는 기간(소멸시효)' && r.줄.length === 4 &&
  /^책임기간은 하자가 «생겨야» 하는 기간 — .*\(건설산업기본법 제28조①\)$/.test(r.줄[0]) &&
  /^청구할 수 있는 기간은 따로 — .*상행위면 5년, 아니면 10년.*\(대법원 2012\. 11\. 15\. 선고 2011다56491 · 상법 제64조 · 민법 제162조①\)$/.test(r.줄[1]) &&
  /^건설회사가 맡은 공사는 보통 5년 — .*\(상법 제5조② · 제47조 · 제3조\)$/.test(r.줄[2]) &&
  /^권리를 쓸 수 있는 때부터 셉니다 — .*\(민법 제166조①\)$/.test(r.줄[3]) &&
  /하자마다 다를 수 있습니다/.test(r.끝) && r.표다음 && r.맨끝

console.log('① 폰 390 — 맨 아래 «⏳ 청구할 수 있는 기간(소멸시효)»')
{
  const { ctx, p, 오류 } = await 새쪽(390, 844, true)
  await p.goto(BASE + '/tools/defect-period', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.tool .tl-row', { timeout: 15000 })
  const r = await 시효읽기(p)
  ok('제목 · 네 줄(생김 · 청구 · 상행위 · 기산) · 줄마다 근거 · 끝줄 · 📋 표 다음 · 도구 맨 끝', 맞는지(r), r)
  ok('가로 넘침 0', r.넘침 <= 0, r.넘침)
  /* ② 예시 그대로 — 셈 결과는 전과 같음 */
  const 예시 = p.locator('button', { hasText: '예시로 해 보기' }).first()   /* 예시 단추는 .tool 바깥(도구 머리 상자) */
  ok('② «🧪 예시로 해 보기» 단추가 있음', (await 예시.count()) === 1)
  await 예시.click(); await p.waitForTimeout(600)
  const 글 = await p.evaluate(() => document.querySelector('.tool').innerText.replace(/\s+/g, ' '))
  ok('② 예시 — 아스팔트 포장 도로 2년 · 끝나는 무렵 2028-12-20 · 보증금 9,000,000원', /하자담보책임기간 2년/.test(글) && /2028-12-20/.test(글) && /9,000,000/.test(글), 글.slice(0, 400))
  const r2 = await 시효읽기(p)
  ok('② 예시를 넣어도 시효 글 그대로(셈 결과와 안 섞임)', 맞는지(r2) && JSON.stringify(r2.줄) === JSON.stringify(r.줄), r2)
  if (OUT) {
    await p.addStyleTag({ content: '.insa, .noticepop, .noticepop-bg, .cam-tab { display: none !important; }' })
    await p.evaluate(() => { const h = [...document.querySelectorAll('.tool .kt-h')].find((x) => /청구할 수 있는 기간/.test(x.textContent)); h.scrollIntoView({ block: 'start' }); window.scrollBy(0, -200) })
    await p.waitForTimeout(400)
    await p.screenshot({ path: OUT + '/하자시효_폰390.png' })
  }
  ok('화면 오류 0', !오류.length, 오류)
  await ctx.close()
}

console.log('③ 폰 320 · PC 1280')
for (const [w, h, 폰, 이름] of [[320, 700, true, '폰 320'], [1280, 900, false, 'PC 1280']]) {
  const { ctx, p, 오류 } = await 새쪽(w, h, 폰)
  await p.goto(BASE + '/tools/defect-period', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.tool .tl-row', { timeout: 15000 })
  const r = await 시효읽기(p)
  ok(`${이름} — 같은 글 · 자리`, 맞는지(r), r)
  ok(`${이름} — 가로 넘침 0`, r.넘침 <= 0, r.넘침)
  if (OUT && !폰) {
    await p.addStyleTag({ content: '.insa, .noticepop, .noticepop-bg, .cam-tab { display: none !important; }' })
    await p.evaluate(() => { const h = [...document.querySelectorAll('.tool .kt-h')].find((x) => /청구할 수 있는 기간/.test(x.textContent)); h.scrollIntoView({ block: 'start' }); window.scrollBy(0, -260) })
    await p.waitForTimeout(400)
    await p.screenshot({ path: OUT + '/하자시효_PC1280.png' })
  }
  ok(`${이름} — 화면 오류 0`, !오류.length, 오류)
  await ctx.close()
}

await b.close()
console.log(`\n${bad ? '✗' : '✓'} 시험_하자시효화면 ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
