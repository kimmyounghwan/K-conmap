/**
 * 🧪 업체 광고 칸(광고칸.jsx · lib/광고자료.js) 화면 시험 — 2026-11-05
 *   구운 사이트(dist)를 띄운 뒤:  LANG=C.UTF-8 node tools/시험_광고칸화면.mjs [주소=http://127.0.0.1:4986]
 *   소장님 「한 페이지에 한번씩만」 · 「구별이 안돼, 광고인지」 · 「보증하지 않습니다 … 빼줘」 · 「유안굴착은 1순위쪽에」 · 「근재보험 광고」
 *   ① 1순위(/first): 셋째 카드 다음 강천 · 대유(제일 좋은 자리 · 늘) · 열째 유안굴착 · 열일곱째 정순덕 FP — 업체마다 쪽에 한 번 · 광고 사이 여섯 장 넘게 · 셋 다 «광고 · 👍 K-건설맵 추천» · «보증» 같은 말 없음 · 📞 tel: · 💬 sms:
 *   ①b 공고(/live): 셋째 카드 다음 강천 · 대유(늘)
 *      · 카드를 눌러 펼쳐도 광고는 그 자리 한 장 · 다음 쪽에도 한 장
 *   ② 보험료 계산기 · 4대보험 판단기: 결과 바로 아래 한 장(근재보험 정순덕 FP · 여러 번 열어도 늘 — 소장님 「번갈아서 하지 말고」)
 *   ③ 숨은 셈: 보임(화면에 들어왔을 때 한 번) · 전화 · 문자 누름 → 데이터베이스로 |광고보임|id · |광고전화|id · |광고문자|id
 *   ④ 폰 390 · 320 넘침 0 · 어두운 화면 글이 읽힘(대비) · 인쇄에는 안 나옴 · 오류 0
 *   OUT=폴더 면 화면 사진(폰 · PC · 어두운 화면)
 * 가상 자료만 씀(공사 · 기관 · 업체 이름 지어냄 — 광고 자료만 실제) · 인터넷 안 부름.
 */
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4986'
const OUT = process.env.OUT || ''
const 심의있음 = true   /* 근재보험 두 분 — 소장님 11-05 「이미 다 됐어..광고 넣어줘」 */
let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 400))) }
const 오늘 = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10)
const meta = { built: 오늘 + ' 06:00', chunk: 500, rankChunk: 50, con: { n: 34, parts: 1, from: '2026-09-15', to: 오늘 }, serv: { n: 0, parts: 0 } }
const 줄 = (i) => ({ no: `R00TEST8${String(i).padStart(4, '0')}`, ord: '000', name: `가상 새솔지구 정비공사 ${i}차`, inst: '가상군', dt: 오늘 + ' 11:00:00', amt: 523456000, rate: 89.912, np: 37, nrank: 37,
  base: 583000000, sAmt: 0, lo: -3, hi: 3, llr: 89.745, aval: 0, ayn: 'N', win: '가상건설1(주)', bno: '1238112345', ceo: '홍길동' })
const rows = Array.from({ length: 34 }, (_, i) => 줄(i + 1))
const UA폰 = 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
const b = await chromium.launch()
const 셈들 = []
async function 새쪽(w, h, 폰 = true, 어둠 = false) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, colorScheme: 어둠 ? 'dark' : 'light', userAgent: 폰 ? UA폰 : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', deviceScaleFactor: OUT ? 2 : 1 })
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  await ctx.route(/firebaseio\.com|firebasedatabase\.app/, (r) => { const u = decodeURIComponent(r.request().url()); if (/광고/.test(u) && r.request().method() !== 'GET') 셈들.push(u.replace(/^.*?\.(com|app)\//, '')); r.fulfill({ status: 200, contentType: 'application/json', body: r.request().method() === 'GET' ? 'null' : (r.request().postData() || 'null') }) })
  await ctx.route('**/data/board/first.json*', (r) => r.fulfill({ json: meta }))
  await ctx.route('**/data/board/first-con-0.json*', (r) => r.fulfill({ json: rows }))
  await ctx.route('**/data/overview.json*', (r) => r.fulfill({ json: { rows: 168842, agencies: 5066, corps: 72494 } }))
  await ctx.route('**/data/ext/meta.json*', (r) => r.fulfill({ json: { n: 0, first: 0 } }))
  await ctx.addInitScript(() => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) { /* 없음 */ } })
  /* 숨은 셈은 봇(navigator.webdriver)이면 안 셈 — 이 시험에선 사람처럼(셈이 정말 나가는지 보려고) */
  await ctx.addInitScript(() => { try { Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false }) } catch (e) { /* 없음 */ } })
  const p = await ctx.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  p.on('dialog', (d) => d.dismiss())
  return { ctx, p, 오류 }
}
const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
const 광고 = (p) => p.evaluate(() => [...document.querySelectorAll('aside.adc')].map((a) => ({
  id: a.dataset.ad, 글: a.innerText.replace(/\s+/g, ' ').trim(), tel: (a.querySelector('.adc-call') || {}).getAttribute?.('href'), sms: (a.querySelector('.adc-sms') || {}).getAttribute?.('href'),
  앞: a.previousElementSibling ? a.previousElementSibling.className : '', 뒤: a.nextElementSibling ? a.nextElementSibling.className : '',
})))
const 숨김 = (p) => p.addStyleTag({ content: '.insa{display:none!important}' })

console.log('① 1순위(/first) — 폰 390 · 광고 셋(셋째 강천 · 대유 / 열째 유안굴착 / 열일곱째 정순덕)')
{
  const { ctx, p, 오류 } = await 새쪽(390, 844)
  await p.goto(BASE + '/first', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('main .notice.tap', { timeout: 15000 })
  await p.waitForTimeout(800)
  let a = await 광고(p)
  const 찾 = (id) => a.find((x) => x.id === id)
  ok('광고 셋 — 강천 · 대유 · 유안굴착 · 정순덕 FP(업체마다 한 번)', a.map((x) => x.id).join() === 'kc-dy,yuan,kb-jsd', a.map((x) => x.id))
  ok('자리 — 셋째(제일 좋은 자리) · 열째 · 열일곱째 카드 바로 다음(광고 사이 카드 여섯 장 넘게 · 첫 결과 위엔 없음)', await p.evaluate(() => { const ns = [...document.querySelectorAll('main .notice.tap')]; const ads = [...document.querySelectorAll('aside.adc')]; return ns[2].nextElementSibling === ads[0] && ns[9].nextElementSibling === ads[1] && ns[16].nextElementSibling === ads[2] && ns[0].previousElementSibling?.tagName !== 'ASIDE' }), a.map((x) => [x.id, x.앞]))
  const k = 찾('kc-dy'), y = 찾('yuan')
  ok('강천 · 대유 — «광고 · 👍 K-건설맵 추천» · 추천 한 줄 · 이름 · 고흥군 · 📞 010-6460-1650 · 사무실 · 팩스 · 대표 이름 · 이메일 없음', k && /^광고 👍 K-건설맵 추천/.test(k.글) && /두 회사가 함께 — 고흥 지역 건설공사, 전화 한 통으로 상담/.test(k.글) && /강천건설\(주\) · \(유\)대유건설/.test(k.글) && /전남 고흥군/.test(k.글) && k.tel === 'tel:01064601650' && /📞 010-6460-1650/.test(k.글) && /사무실 061-835-6788/.test(k.글) && /팩스 061-844-1650/.test(k.글) && !/대표|@|naver/.test(k.글), k && k.글)
  ok('유안굴착 — «광고 · 👍 K-건설맵 추천» · 추천 한 줄 · 압입추진 · 전북 전주시 덕진구 · 📞 010-3658-3104', y && /^광고 👍 K-건설맵 추천/.test(y.글) && /현장에 맞는 공법을 한 곳에서 상담/.test(y.글) && /압입추진 전문업체/.test(y.글) && /전북 전주시 덕진구/.test(y.글) && y.tel === 'tel:01036583104', y && y.글)
  ok('«보증» · «확인하십시오» 같은 말 없음(셋 다)', a.every((x) => !/보증|확인하십시오|책임지지/.test(x.글)), a.map((x) => x.글.slice(0, 40)))
  /* 셈은 운영자 확인(비동기) 뒤에 나감 — 정해진 짧은 시간만 기다리면 가끔 놓침(11-05 한 번 놓침) → 나올 때까지 8초까지 기다림 */
  const 기다림 = async (f, ms = 8000) => { const t = Date.now(); while (Date.now() - t < ms) { if (f()) return true; await p.waitForTimeout(200) } return f() }
  await p.locator('aside.adc').first().scrollIntoViewIfNeeded()
  await 기다림(() => 셈들.some((u) => /광고보임/.test(u) && /kc-dy/.test(u))); await p.waitForTimeout(800)
  ok('숨은 셈 — 화면에 들어오면 «|광고보임|kc-dy» 한 번', 셈들.filter((u) => /광고보임/.test(u) && /kc-dy/.test(u)).length === 1, 셈들)
  await p.locator('aside.adc').first().locator('.adc-call').evaluate((el) => { el.addEventListener('click', (e) => e.preventDefault(), { once: true }) })
  await p.locator('aside.adc').first().locator('.adc-call').click()
  await p.locator('aside.adc').first().locator('.adc-sms').evaluate((el) => { el.addEventListener('click', (e) => e.preventDefault(), { once: true }) })
  await p.locator('aside.adc').first().locator('.adc-sms').click()
  await 기다림(() => 셈들.some((u) => /광고전화/.test(u) && /kc-dy/.test(u)) && 셈들.some((u) => /광고문자/.test(u) && /kc-dy/.test(u)))
  ok('숨은 셈 — 전화 · 문자 누름 «|광고전화|kc-dy» · «|광고문자|kc-dy»', 셈들.some((u) => /광고전화/.test(u) && /kc-dy/.test(u)) && 셈들.some((u) => /광고문자/.test(u) && /kc-dy/.test(u)), 셈들)
  await p.locator('main .notice.tap').first().click(); await p.waitForTimeout(500)
  ok('카드를 펼쳐도 광고는 세 장 그대로 · 그 자리', (await 광고(p)).length === 3, (await 광고(p)).length)
  ok('폰 390 넘침 0 · 오류 0', (await 넘침(p)) <= 0 && !오류.length, [await 넘침(p), 오류])
  if (OUT) {
    await p.locator('main .notice.tap').first().click(); await p.waitForTimeout(300)
    await 숨김(p)
    /* 광고를 화면 가운데에(오른쪽 아래 + 단추에 안 가리게 · 앞뒤 카드도 보이게) */
    const 가운데 = async (k, 이름) => { await p.evaluate((k) => document.querySelectorAll('aside.adc')[k].scrollIntoView({ block: 'center' }), k); await p.waitForTimeout(400); await p.screenshot({ path: OUT + '/' + 이름 }) }
    await 가운데(0, '광고_1순위_폰390.png')
    await 가운데(1, '광고_1순위_유안굴착_폰390.png')
    await 가운데(2, '광고_1순위_근재보험_폰390.png')
  }
  const 다음 = p.locator('.pager button', { hasText: '다음' })
  if (await 다음.count()) {
    await 다음.click(); await p.waitForTimeout(800)
    ok('다음 쪽(14건) — 셋째 강천 · 대유 · 열째 유안굴착(15건 아래라 열일곱째 없음)', (await 광고(p)).map((x) => x.id).join() === 'kc-dy,yuan', (await 광고(p)).map((x) => x.id))
  } else ok('다음 쪽 단추(가상 34건 · 쪽 넘김)', false, 'pager 없음')
  await ctx.close()
}

console.log('①b 공고(/live) — 셋째 카드 다음 강천 · 대유(소장님 「1순위 및 공고자리에도 항상」)')
{
  const { ctx, p, 오류 } = await 새쪽(390, 844)
  const 마감 = (d) => new Date(Date.now() + d * 86400e3 + 9 * 3600e3).toISOString().slice(0, 10) + ' 10:00:00'
  const 공고줄 = Array.from({ length: 12 }, (_, i) => ({ no: `R00TEST9${String(i).padStart(4, '0')}`, ord: '000', name: `가상 들말 배수로 정비공사 ${i + 1}`, inst: '가상시', dt: 오늘 + ' 09:00:00', close: 마감(i % 4 + 1), base: 244600000, est: 222363636, lo: -3, hi: 3, llr: 89.745, lic: ['토목공사업/0001'], aval: 0, ayn: 'N', ptot: 15, pdrw: 4, url: '' }))
  await ctx.route('**/data/board/live.json*', (r) => r.fulfill({ json: { ...meta, con: { n: 공고줄.length, parts: 1, from: 오늘, to: 오늘 } } }))
  await ctx.route('**/data/board/live-con-0.json*', (r) => r.fulfill({ json: 공고줄 }))
  await p.goto(BASE + '/live', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('main .notice.tap', { timeout: 15000 })
  await p.waitForTimeout(800)
  const a = await 광고(p)
  ok('공고 — 광고 한 장(강천 · 대유) · 셋째 카드 바로 다음', a.length === 1 && a[0].id === 'kc-dy' && await p.evaluate(() => { const ns = [...document.querySelectorAll('main .notice')]; return ns[2] && ns[2].nextElementSibling === document.querySelector('aside.adc') }), a.map((x) => [x.id, x.앞]))
  ok('공고 폰 390 넘침 0 · 오류 0', (await 넘침(p)) <= 0 && !오류.length, [await 넘침(p), 오류])
  if (OUT) { await 숨김(p); await p.evaluate(() => document.querySelector('aside.adc').scrollIntoView({ block: 'center' })); await p.waitForTimeout(400); await p.screenshot({ path: OUT + '/광고_공고_폰390.png' }) }
  await ctx.close()
}

console.log('② 보험료 계산기 · 4대보험 판단기 — 결과 바로 아래')
{
  const 나온 = new Set()
  for (let k = 0; k < 6; k++) {
    const { ctx, p, 오류 } = await 새쪽(390, 844)
    await p.goto(BASE + '/tools/boheomryo', { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('.hm-sum', { timeout: 15000 }); await p.waitForTimeout(500)
    const a = await 광고(p)
    if (심의있음) {
      if (k === 0) {
        ok('보험료 계산기: 한 장 · 근재보험 설계사 · 결과 표(노무비율 글) 다음 · 신고 기한 앞', a.length === 1 && /^kb-/.test(a[0].id) && /detail-h/.test(a[0].뒤), a)
        ok('근재보험 카드 — 소속 · 하는 일 · 사무실 · «보증» 없음 · 정순덕은 «K-건설맵 추천» · 박현희는 «업체 소개»', a[0] && /교보생명/.test(a[0].글) && /근재보험/.test(a[0].글) && /사무실 061-72/.test(a[0].글) && !/보증하지/.test(a[0].글) && (a[0].id === 'kb-jsd' ? /^광고 👍 K-건설맵 추천/.test(a[0].글) : /^광고 업체 소개/.test(a[0].글)), a[0] && a[0].글)
        ok('폰 390 넘침 0 · 오류 0', (await 넘침(p)) <= 0 && !오류.length, [await 넘침(p), 오류])
        if (OUT) { await 숨김(p); await p.evaluate(() => { const a = document.querySelector('aside.adc'); a.scrollIntoView(); window.scrollBy(0, -260) }); await p.waitForTimeout(400); await p.screenshot({ path: OUT + '/광고_보험료계산기_폰390.png' }) }
      }
      a.forEach((x) => 나온.add(x.id))
    } else if (k === 0) ok('심의필 전 — 보험료 계산기에 보험 광고 안 보임', a.length === 0, a)
    await ctx.close()
  }
  if (심의있음) ok('여러 번(6) 열어도 늘 정순덕 FP(번갈지 않음)', 나온.size === 1 && 나온.has('kb-jsd'), [...나온])
  const { ctx, p, 오류 } = await 새쪽(390, 844)
  await p.goto(BASE + '/tools/ilyong-boheom', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.iy-out', { timeout: 15000 }); await p.waitForTimeout(500)
  const a = await 광고(p)
  if (심의있음) {
    ok('4대보험 판단기: 한 장 · 판단 결과 카드 바로 다음', a.length === 1 && /^kb-/.test(a[0].id) && /iy-out/.test(a[0].앞), a)
    if (OUT) { await 숨김(p); await p.evaluate(() => { const a = document.querySelector('aside.adc'); a.scrollIntoView(); window.scrollBy(0, -200) }); await p.waitForTimeout(400); await p.screenshot({ path: OUT + '/광고_4대보험판단기_폰390.png' }) }
  } else ok('심의필 전 — 4대보험 판단기에 보험 광고 안 보임', a.length === 0, a)
  ok('4대보험 판단기 넘침 0 · 오류 0', (await 넘침(p)) <= 0 && !오류.length, [await 넘침(p), 오류])
  await ctx.close()
}

console.log('②b 노무비 계산기 · 산재 휴업급여 계산기 — 정순덕 · 박현희 번갈아(소장님 「그럼, 박현희 정순덕 번갈아서 나가게 해줘」)')
{
  const 나온 = new Set()
  for (let k = 0; k < 8; k++) {
    const { ctx, p, 오류 } = await 새쪽(390, 844)
    const u = k % 2 ? '/tools/sanjae-hyueop' : '/tools/nomubi'
    await p.goto(BASE + u, { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('aside.adc', { timeout: 15000 }); await p.waitForTimeout(400)
    const a = await 광고(p)
    a.forEach((x) => 나온.add(x.id))
    if (k < 2) {
      ok(`${u}: 광고 한 장 · 근재보험 · 넘침 0 · 오류 0`, a.length === 1 && /^kb-/.test(a[0].id) && /근재보험/.test(a[0].글) && (await 넘침(p)) <= 0 && !오류.length, [a.map((x) => x.id), await 넘침(p), 오류])
      ok(`${u}: 자리 — ${k % 2 ? '휴업급여 결과 다음 · 안내 앞' : '쓰는 방법(접힌 칸) 앞'}`, k % 2 ? /sl-guide/.test(a[0].뒤) : /js-more/.test(a[0].뒤), a[0] && [a[0].앞, a[0].뒤])
    }
    if (a[0] && a[0].id === 'kb-phh' && !나온.has('찍음') && OUT) { 나온.add('찍음'); await 숨김(p); await p.evaluate(() => { const x = document.querySelector('aside.adc'); x.scrollIntoView(); window.scrollBy(0, -220) }); await p.waitForTimeout(400); await p.screenshot({ path: OUT + '/광고_노무_박현희_폰390.png' }) }
    if (a[0] && a[0].id === 'kb-phh') ok('박현희 카드 — «광고 · 업체 소개»(추천 없음) · 📞 010-9885-7439', /^광고 업체 소개/.test(a[0].글) && a[0].tel === 'tel:01098857439', a[0].글)
    await ctx.close()
  }
  ok('노무 자리 — 여러 번 열면 정순덕 · 박현희 둘 다 나옴(번갈아)', 나온.has('kb-jsd') && 나온.has('kb-phh'), [...나온])
}

console.log('③ 폰 320 · PC 1280 · 어두운 화면 · 인쇄')
{
  const { ctx, p, 오류 } = await 새쪽(320, 640)
  await p.goto(BASE + '/first', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('aside.adc', { timeout: 15000 }); await p.waitForTimeout(400)
  const 한줄 = await p.evaluate(() => { const c = document.querySelector('.adc-call'), s = document.querySelector('.adc-sms'); const a = c.getBoundingClientRect(), d = s.getBoundingClientRect(); return { 같은줄: Math.abs(a.top - d.top) < 4, 안: d.right <= innerWidth - 8, 번호한줄: c.scrollWidth <= c.clientWidth + 1 } })
  ok('폰 320 — 전화 · 문자 단추 한 줄 · 번호 안 잘림 · 넘침 0', 한줄.같은줄 && 한줄.안 && 한줄.번호한줄 && (await 넘침(p)) <= 0 && !오류.length, [한줄, await 넘침(p), 오류])
  await ctx.close()
}
{
  const { ctx, p, 오류 } = await 새쪽(1280, 900, false)
  await p.goto(BASE + '/first', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('aside.adc', { timeout: 15000 }); await p.waitForTimeout(400)
  ok('PC 1280 — 세 장 · 넘침 0 · 오류 0', (await 광고(p)).length === 3 && (await 넘침(p)) <= 0 && !오류.length, [(await 광고(p)).length, 오류])
  if (OUT) { await 숨김(p); await p.evaluate(() => document.querySelector('aside.adc').scrollIntoView({ block: 'center' })); await p.waitForTimeout(400); await p.screenshot({ path: OUT + '/광고_1순위_PC1280.png' }) }
  await p.emulateMedia({ media: 'print' })
  ok('인쇄에는 안 나옴', await p.evaluate(() => getComputedStyle(document.querySelector('aside.adc')).display === 'none'))
  await ctx.close()
}
{
  const { ctx, p, 오류 } = await 새쪽(390, 844, true, true)
  await p.goto(BASE + '/first', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('aside.adc', { timeout: 15000 }); await p.waitForTimeout(400)
  const 대비 = await p.evaluate(() => {
    const rgb = (s) => (s.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number)
    const 밝기 = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
    const 비 = (a, b) => { const x = 밝기(rgb(a)), y = 밝기(rgb(b)); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
    const ad = document.querySelector('aside.adc'), nm = ad.querySelector('.adc-nm'), one = ad.querySelector('.adc-one'), call = ad.querySelector('.adc-call')
    const 바탕 = getComputedStyle(ad).backgroundColor
    return { 이름: 비(getComputedStyle(nm).color, 바탕), 한줄: 비(getComputedStyle(one).color, 바탕), 단추: 비(getComputedStyle(call).color, getComputedStyle(call).backgroundColor), 바탕 }
  })
  ok('어두운 화면 — 이름 · 한줄 · 단추 글 대비 4.5 넘음', 대비.이름 >= 4.5 && 대비.한줄 >= 4.5 && 대비.단추 >= 4.5, 대비)
  if (OUT) { await 숨김(p); await p.evaluate(() => document.querySelector('aside.adc').scrollIntoView({ block: 'center' })); await p.waitForTimeout(400); await p.screenshot({ path: OUT + '/광고_1순위_폰390_어두운화면.png' }) }
  ok('어두운 화면 오류 0', !오류.length, 오류)
  await ctx.close()
}

await b.close()
console.log(`\n${bad ? '✗' : '✓'} 시험_광고칸화면 ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
