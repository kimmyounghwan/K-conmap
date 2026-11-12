/**
 * 🧮 G658 위험성평가(/tools/risk) «위험성 추정 기준» 3×3 | 5×4 화면 시험 — 구운 사이트(dist)를 띄운 뒤:
 *   node tools/시험_위험성5x4화면.mjs [주소=http://127.0.0.1:4658]        (OUT=/tmp/g10/g658 — 캡처)
 *   이용자 문의(11-12 · 발주처가 3×3 업체에 5×4 로 다시 쓰라는 공문) → 소장님 «그래».
 *   👀 예시 장부(저장 안 됨 · 지어낸 값)로:
 *   ① 별지1 — 기준 단추 3×3 켜짐 · 5×4 로 바꾸면 확인 창 → 빈도 · 강도만 비움(위험요인 · 대책 글 그대로) · 기준표(접힘) 보임
 *   ② 빈도 1~5 · 강도 1~4 단추 · 12 «상당» · 20 «허용불가» · 2 «무시» 딱지 · 종이 «12 / 상당» · «20 / 허용 / 불가» · 꼬리 «… 16~20 허용불가»(3×3 꼬리 없음)
 *      · 종이 등급 칸이 칸 폭 때문에 더 잘리지 않음(11-12 PDF 점검에서 «허용불 / 가» 를 찾아 고침 — 글 줄 수 = 그려진 줄 수)
 *   ③ 확인 창에서 «취소» 면 그대로 · 같은 기준을 다시 누르면 아무 일 없음
 *   ④ 별지2 4주(3×3 그대로 — 예전 서류) · 가져오기: 5×4 → 3×3 «빈도 · 강도는 비우고» 알림 · 가져온 줄 빈도 · 강도 빔
 *   ⑤ 별지5 가져오기 — 5×4 서류를 고르면 «4점 이상만(5×4)» · 2점 줄 뺌
 *   ⑥ 새 별지1 — 가장 최근에 고친 별지1 · 2 의 기준(5×4)으로 시작 · 사전에서 넣으면 빈도 · 강도 비움 + 알림 · ⑥b 3×3 서류를 고친 뒤 새로 만들면 3×3
 *   ⑦ 목록 — «5×4 · 9점 이상 2 · 4~8점 0 · 3점 이하 1» · 3×3 서류는 «상 · 중 · 하» 그대로
 *   ⑧ 폰 390 · PC 1280 넘침 0 · 오류 0
 *   ⑨ (PC) 5×4 서류 📄 PDF(그림 · A4 가로 · 글꼴 0) · 📗 엑셀(등급 칸 «12 / 상당» · «20 / 허용 / 불가» · 꼬리 «16~20 허용불가»)
 *   ⑩ (PC) 가장 좁은 등급 칸 — 별지2 1주 · 1일을 5×4 로 «20 허용 / 불가» · «12 상당» 넣어도 잘린 칸 0
 *   인터넷 안 부름(파이어베이스 · 광고 · 애널리틱스 막음).
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4658'
const 폴더 = process.env.OUT || '/tmp/g10/g658'
fs.mkdirSync(폴더, { recursive: true })

let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 500))) }
const 쉬어 = (ms) => new Promise((r) => setTimeout(r, ms))

const b = await chromium.launch()
const UA폰 = 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
for (const [기기, w, h, 폰] of [['PC 1280', 1280, 900, false], ['폰 390', 390, 844, true]]) {
  console.log(`■ ${기기}`)
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, acceptDownloads: true, ...(폰 ? { userAgent: UA폰 } : {}) })
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs|coupang/, (r) => r.fulfill({ status: 200, body: '' }))
  await ctx.route(/firebaseio\.com|firebasedatabase\.app|identitytoolkit|securetoken/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await ctx.addInitScript(() => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) { /* 없음 */ } })
  const p = await ctx.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  let 창답 = true, 창글 = []
  p.on('dialog', async (d) => { 창글.push(d.message()); if (창답) await d.accept(); else await d.dismiss() })
  const 꼬리 = 폰 ? '_폰' : ''
  await p.goto(BASE + '/tools/risk', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('button', { timeout: 20000 })
  await 쉬어(800)
  await p.locator('button', { hasText: '예시로 해 보기' }).first().click()
  await 쉬어(1200)
  const 서류열기 = async (글) => {
    await p.locator('button, a, [role=button], li').filter({ hasText: new RegExp('^별지 \\d+ .*' + 글.replace(/[·()]/g, '.')) }).first().click()
    await 쉬어(900)
  }
  const 목록으로 = async () => { await p.locator('.rk-edit-head button', { hasText: /목록|닫기|←/ }).first().click().catch(async () => { await p.goBack() }); await 쉬어(700) }
  const 기준단추 = (글) => p.locator('.rk-scale .eq-seg button', { hasText: 글 })
  const 줄 = (i) => p.locator('.rk-row').nth(i)
  const 누름 = async (i, 칸, 값) => { await 줄(i).locator('.rk-fs .field').nth(칸 === '빈도' ? 1 : 2).locator('button', { hasText: new RegExp('^' + 값 + '$') }).click(); await 쉬어(150) }
  const 딱지 = async (i) => (await 줄(i).locator('.rk-row-h .rk-g').innerText()).trim()
  const 종이글 = () => p.evaluate(() => (document.querySelector('.rk-preview .rk-paper') || {}).innerText || '')
  const 넘침 = () => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  /* 종이 등급 칸이 칸 폭 때문에 더 잘렸나 — 글의 줄 수(\n) 와 그려진 줄 수가 다르면 잘린 것 */
  const 잘린칸 = () => p.evaluate(() => [...document.querySelectorAll('.rk-preview .rk-paper td[class*="g-"]')].filter((td) => td.innerText.trim()).map((td) => {
    const r = document.createRange(); r.selectNodeContents(td)
    const 줄 = new Set([...r.getClientRects()].filter((x) => x.width > 0).map((x) => Math.round(x.top))).size
    return { 글: td.innerText.trim(), 줄, 글줄: td.innerText.trim().split('\n').length }
  }).filter((x) => x.줄 !== x.글줄))

  /* ① 별지1 — 3×3 에서 5×4 로 */
  await 서류열기('최초·정기 토공사')
  const 켜짐 = async () => p.evaluate(() => [...document.querySelectorAll('.rk-scale .eq-seg button')].map((x) => (x.classList.contains('on') ? '●' : '○') + x.innerText.trim()))
  ok(`① 별지1 기준 단추 — ${JSON.stringify(await 켜짐())}`, JSON.stringify(await 켜짐()) === JSON.stringify(['●3×3 (상·중·하)', '○5×4 (빈도 5 × 강도 4)']))
  const 전위험 = await 줄(0).locator('textarea').first().inputValue()
  const 전딱지 = await 딱지(0)
  ok(`① 3×3 그대로 — 첫 줄 딱지 «${전딱지}» · 빈도 단추 ${await 줄(0).locator('.rk-fs .field').nth(1).locator('button').count()}개 · 기준표 없음`, /^(상|중|하) \(\d점\)$/.test(전딱지) && (await 줄(0).locator('.rk-fs .field').nth(1).locator('button').count()) === 3 && (await p.locator('.rk-5x4').count()) === 0)
  /* ③ 취소면 그대로 */
  창답 = false; 창글 = []
  await 기준단추('5×4').click(); await 쉬어(300)
  ok(`③ 확인 창 «${(창글[0] || '').split('\n')[0]}» → 취소 · 그대로 3×3`, 창글.length === 1 && /빈도 · 강도를 비웁니다/.test(창글[0]) && JSON.stringify(await 켜짐()) === JSON.stringify(['●3×3 (상·중·하)', '○5×4 (빈도 5 × 강도 4)']) && (await 딱지(0)) === 전딱지)
  창답 = true; 창글 = []
  await 기준단추('5×4').click(); await 쉬어(400)
  ok(`① 5×4 로 — 확인 창 1번 · 단추 ${JSON.stringify(await 켜짐())}`, 창글.length === 1 && JSON.stringify(await 켜짐()) === JSON.stringify(['○3×3 (상·중·하)', '●5×4 (빈도 5 × 강도 4)']))
  ok(`① 빈도 · 강도만 비움 — 딱지 «${await 딱지(0)}» · 위험요인 글 그대로`, (await 딱지(0)) === '등급 —' && (await 줄(0).locator('textarea').first().inputValue()) === 전위험)
  창글 = []
  await 기준단추('5×4').click(); await 쉬어(200)
  ok('③ 같은 기준 다시 누름 — 창 없음', 창글.length === 0)
  ok(`① 5×4 기준표(접힘) — «${(await p.locator('.rk-5x4 summary').innerText()).trim()}»`, (await p.locator('.rk-5x4').count()) === 1 && !(await p.locator('.rk-5x4').evaluate((x) => x.open)))
  await p.locator('.rk-5x4 summary').click(); await 쉬어(200)
  const 표글 = await p.locator('.rk-5x4').innerText()
  ok('① 기준표 펼침 — 빈번함 1일 1회 · 사망재해 · 16~20 허용불가 위험성 — 즉시 작업중지 · 공단 매뉴얼 예시 · 현장이 정함', /5 — 빈번함 — 1일 1회 정도/.test(표글) && /4 — 사망재해/.test(표글) && /16~20 허용불가 위험성 — 즉시 작업중지/.test(표글) && /사업장 위험성평가 매뉴얼/.test(표글) && /현장\(사업장\)이 정하므로/.test(표글), 표글.slice(0, 300))
  if (!폰) await p.screenshot({ path: path.join(폴더, `①기준표${꼬리}.png`), fullPage: false })
  await p.locator('.rk-5x4 summary').click(); await 쉬어(150)

  /* ② 빈도 1~5 · 강도 1~4 · 딱지 · 종이 */
  ok(`② 빈도 단추 ${await 줄(0).locator('.rk-fs .field').nth(1).locator('button').count()}개 · 강도 ${await 줄(0).locator('.rk-fs .field').nth(2).locator('button').count()}개 · 이름표 «빈도 (1~5)»`, (await 줄(0).locator('.rk-fs .field').nth(1).locator('button').count()) === 5 && (await 줄(0).locator('.rk-fs .field').nth(2).locator('button').count()) === 4 && /빈도 \(1~5\)/.test(await 줄(0).locator('.rk-fs .field').nth(1).locator('label').innerText()))
  const 뜻 = await 줄(0).locator('.rk-fs .field').nth(1).locator('button').nth(4).getAttribute('title')
  ok(`② 단추 뜻(마우스 올림) — 빈도 5 «${뜻}»`, 뜻 === '빈번함 — 1일 1회 정도')
  await 누름(0, '빈도', 4); await 누름(0, '강도', 3)
  await 누름(1, '빈도', 5); await 누름(1, '강도', 4)
  await 누름(2, '빈도', 2); await 누름(2, '강도', 1)
  const 딱지들 = [await 딱지(0), await 딱지(1), await 딱지(2)]
  ok(`② 딱지 ${JSON.stringify(딱지들)}`, JSON.stringify(딱지들) === JSON.stringify(['상당 (12점)', '허용불가 (20점)', '무시 (2점)']))
  const 색들 = await p.evaluate(() => [...document.querySelectorAll('.rk-row-h .rk-g')].slice(0, 3).map((x) => x.className.replace('rk-g ', '')))
  ok(`② 딱지 색 ${JSON.stringify(색들)}(9점 이상 상 · 3점 이하 하)`, JSON.stringify(색들) === JSON.stringify(['g-상', 'g-상', 'g-하']))
  await 쉬어(400)
  const 종 = await 종이글()
  ok('② 종이 — 등급 칸 «12 / 상당» · «20 / 허용 / 불가» · «2 / 무시» · 꼬리 5×4 · 3×3 꼬리 없음', /12\s*\n\s*상당/.test(종) && /20\s*\n\s*허용\s*\n\s*불가/.test(종) && /2\s*\n\s*무시/.test(종) && 종.includes('※ 위험성 = 빈도(1~5) × 강도(1~4) · 1~3 무시 · 4~6 미미 · 8 경미 · 9~12 상당 · 15 중대 · 16~20 허용불가') && !종.includes('2점 이하 하'), 종.slice(0, 200))
  const 잘림1 = await 잘린칸()
  ok(`② 종이 등급 칸 — 칸 폭 때문에 잘린 칸 ${잘림1.length}`, 잘림1.length === 0, 잘림1)
  const 빨강 = await p.evaluate(() => [...document.querySelectorAll('.rk-preview .rk-paper td.g-상')].length)
  ok(`② 종이 빨강(9점 이상) ${빨강}칸`, 빨강 === 2)
  ok(`⑧ 넘침 ${await 넘침()}px(별지1 5×4)`, (await 넘침()) <= 0)
  await p.screenshot({ path: path.join(폴더, `②별지1_5x4${꼬리}.png`), fullPage: false })
  if (!폰) { await p.locator('.rk-preview').scrollIntoViewIfNeeded(); await 쉬어(300); await p.locator('.rk-preview').screenshot({ path: path.join(폴더, `②종이_5x4${꼬리}.png`) }) }

  /* ⑨ (PC) 5×4 서류 📄 PDF · 📗 엑셀 — PDF 는 그림(G587 그대로) · 엑셀은 종이와 같은 칸(등급 칸 «12 / 상당» · 꼬리 5×4) */
  if (!폰) {
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 40000 }), p.locator('.rk-edit-head button', { hasText: '📄 PDF' }).click()])
    const pdf = path.join(폴더, '⑨별지1_5x4.pdf'); await dl.saveAs(pdf); await 쉬어(300)
    const 정보 = execFileSync('pdfinfo', [pdf]).toString()
    const 쪽 = Number((/Pages:\s+(\d+)/.exec(정보) || [])[1] || 0)
    const 크기 = ((/Page size:\s+([\d.]+) x ([\d.]+)/.exec(정보) || []).slice(1).map(Number))
    const 글꼴 = execFileSync('pdffonts', [pdf]).toString().trim().split('\n').slice(2).filter((x) => x.trim()).length
    ok(`⑨ 5×4 서류 📄 PDF — ${쪽}쪽 · ${크기.join(' × ')} · 글꼴 ${글꼴}(그림)`, 쪽 >= 1 && 크기[0] > 크기[1] && Math.abs(크기[0] - 841.89) < 1 && 글꼴 === 0, 정보.slice(0, 200))
    const [dx] = await Promise.all([p.waitForEvent('download', { timeout: 40000 }), p.locator('button', { hasText: '📗 엑셀' }).first().click()])
    const xlsx = path.join(폴더, '⑨별지1_5x4.xlsx'); await dx.saveAs(xlsx)
    const 속 = execFileSync('unzip', ['-p', xlsx], { maxBuffer: 64 << 20 }).toString()
    ok('⑨ 📗 엑셀 — 등급 칸 «12 / 상당» · «20 / 허용 / 불가» · «2 / 무시» · 꼬리 «… 16~20 허용불가»',
      /12\s*(\n|&#10;|&#xa;)\s*상당/i.test(속) && /20\s*(\n|&#10;|&#xa;)\s*허용\s*(\n|&#10;|&#xa;)\s*불가/i.test(속) && /2\s*(\n|&#10;|&#xa;)\s*무시/i.test(속) && 속.includes('15 중대 · 16~20 허용불가'),
      (속.match(/.{0,40}상당.{0,40}/) || [''])[0])
  }

  /* ⑦ 목록 */
  await 목록으로()
  const 목록글 = await p.evaluate(() => [...document.querySelectorAll('.rk-open .d')].map((x) => x.innerText.trim()))
  ok(`⑦ 목록 — ${JSON.stringify(목록글.slice(0, 7))}`, 목록글.some((x) => /5×4 · 9점 이상 2 · 4~8점 0 · 3점 이하 1/.test(x)) && 목록글.some((x) => /· 상 \d+ · 중 \d+ · 하 \d+/.test(x)))

  /* ⑥ 새 별지1 — 마지막 기준(5×4)으로 · 사전 넣기 */
  await p.locator('.rk-kind', { hasText: '최초·정기 위험성평가서' }).click(); await 쉬어(1000)
  ok(`⑥ 새 별지1 — 기준 ${JSON.stringify(await 켜짐())}(가장 최근에 고친 별지1 · 2 = 5×4)`, JSON.stringify(await 켜짐()) === JSON.stringify(['○3×3 (상·중·하)', '●5×4 (빈도 5 × 강도 4)']))
  await p.locator('button', { hasText: '📚 사전에서 고르기' }).click(); await 쉬어(300)
  const 사전알림 = await p.locator('.rk-panel').innerText()
  await p.locator('.rk-panel .rk-pick input').first().check(); await 쉬어(150)
  await p.locator('.rk-panel button', { hasText: /줄 넣기/ }).click(); await 쉬어(400)
  const 마지막 = (await p.locator('.rk-row').count()) - 1
  ok(`⑥ 사전 넣기 — 알림 «5×4 서류라 빈도 · 강도는 비워서» · 넣은 줄 딱지 «${await 딱지(마지막)}»`, /5×4 서류라 빈도 · 강도는 비워서 넣습니다/.test(사전알림) && (await 딱지(마지막)) === '등급 —')
  ok(`⑧ 넘침 ${await 넘침()}px(새 별지1)`, (await 넘침()) <= 0)
  if (폰) await p.screenshot({ path: path.join(폴더, `⑥새별지1${꼬리}.png`), fullPage: false })
  await 목록으로()

  /* ④ 별지2 4주 — 예전 서류는 3×3 · 5×4 에서 가져오면 빈도 · 강도 비움 */
  await 서류열기('수시 4주')
  ok(`④ 별지2 4주 — 기준 ${JSON.stringify(await 켜짐())}(예전 서류 그대로 3×3) · 첫 줄 딱지 «${await 딱지(0)}»`, JSON.stringify(await 켜짐()) === JSON.stringify(['●3×3 (상·중·하)', '○5×4 (빈도 5 × 강도 4)']) && /^(상|중|하) \(\d점\)$/.test(await 딱지(0)))
  const 꼬리3 = await 종이글()
  ok('④ 별지2 종이 꼬리 — 서식 글 그대로(3×3)', 꼬리3.includes('※ 위험등급 = 빈도 × 강도 (2점 이하 하 · 3~4점 중 · 6점 이상 상)'))
  await p.locator('button', { hasText: '📥 다른 서류에서 가져오기' }).click(); await 쉬어(300)
  const 고를 = await p.locator('.rk-panel select option').allInnerTexts()
  const 별지1값 = await p.locator('.rk-panel select option', { hasText: '토공사' }).first().getAttribute('value')
  await p.locator('.rk-panel select').selectOption(별지1값); await 쉬어(300)
  const 알림4 = await p.locator('.rk-panel').innerText()
  ok('④ 가져오기 — «기준이 달라(5×4 → 3×3) 빈도 · 강도는 비우고 가져옵니다»', /기준이 달라\(5×4 → 3×3\) 빈도 · 강도는 비우고 가져옵니다/.test(알림4), [고를, 알림4.slice(0, 200)])
  const 전줄수 = await p.locator('.rk-row').count()
  await p.locator('.rk-panel button', { hasText: /줄 가져오기/ }).click(); await 쉬어(400)
  const 뒤줄수 = await p.locator('.rk-row').count()
  const 새딱지 = await 딱지(뒤줄수 - 1)
  ok(`④ 가져온 줄(${전줄수} → ${뒤줄수}) 마지막 딱지 «${새딱지}» — 빈도 · 강도 빔`, 뒤줄수 > 전줄수 - 1 && 새딱지 === '등급 —')
  await 목록으로()

  /* ⑥b 3×3 서류(별지2 4주)를 고친 뒤 새로 만들면 3×3 — «가장 최근에 고친 별지1 · 2» 를 따름 */
  await p.locator('.rk-kind', { hasText: '최초·정기 위험성평가서' }).click(); await 쉬어(1000)
  ok(`⑥b 별지2 4주(3×3)를 고친 뒤 새 별지1 — 기준 ${JSON.stringify(await 켜짐())}`, JSON.stringify(await 켜짐()) === JSON.stringify(['●3×3 (상·중·하)', '○5×4 (빈도 5 × 강도 4)']))
  await 목록으로()

  /* ⑤ 별지5 가져오기 — 5×4 서류는 4점 이상만 */
  await 서류열기('성과측정표')
  await p.locator('button', { hasText: '📥 다른 서류에서 가져오기' }).click(); await 쉬어(300)
  const v1 = await p.locator('.rk-panel select option', { hasText: '토공사' }).first().getAttribute('value')
  await p.locator('.rk-panel select').selectOption(v1); await 쉬어(300)
  const 판5 = await p.locator('.rk-panel').innerText()
  ok(`⑤ 별지5 가져오기 — «4점 이상만(5×4)» · ${(/(\d+)줄 가져오기/.exec(판5) || [])[1]}줄(2점 «무시» 뺌)`, /4점 이상만\(5×4\)/.test(판5) && /2줄 가져오기/.test(판5), 판5.slice(0, 200))
  await 목록으로()

  /* ⑩ (PC) 가장 좁은 등급 칸 — 별지2 1주 · 1일 */
  if (!폰) {
    for (const 글 of ['수시 1주', '수시 1일']) {
      await 서류열기(글)
      await 기준단추('5×4').click(); await 쉬어(400)
      await 누름(0, '빈도', 5); await 누름(0, '강도', 4)
      if ((await p.locator('.rk-row').count()) > 1) { await 누름(1, '빈도', 4); await 누름(1, '강도', 3) }
      await 쉬어(400)
      const 잘림 = await 잘린칸()
      const 종2 = await 종이글()
      ok(`⑩ ${글} 5×4 — 종이 «20 / 허용 / 불가» · 잘린 칸 ${잘림.length}`, /20\s*\n\s*허용\s*\n\s*불가/.test(종2) && 잘림.length === 0, 잘림)
      if (글 === '수시 1주') { await p.locator('.rk-preview').scrollIntoViewIfNeeded(); await 쉬어(300); await p.locator('.rk-preview').screenshot({ path: path.join(폴더, '⑩종이_1주_5x4.png') }) }
      await 목록으로()
    }
  }
  ok(`⑧ 오류 ${오류.length}`, 오류.length === 0, 오류)
  await ctx.close()
}
await b.close()
console.log(`\n${n - bad}/${n} 통과`)
process.exit(bad ? 1 : 0)
