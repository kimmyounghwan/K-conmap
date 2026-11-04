// 💰 G534 기성금 · 준공금 지급 기한 화면 시험 — 이용자처럼(PC 1280 · 폰 390 터치)
//   돌리기: 빌드 + /tmp/g10/g534/bake_tool.py(도구 장) · forms3.py(gisung-cheonggu · jungong-daega) 를 얹은 뒤
//           node tools/시험_대금기한화면.mjs [주소=http://127.0.0.1:4996]
//   ① 예시 ② 손으로 날짜 넣기 세 벌(국가 기성 토요일 끝 · 지방 기성 검사 뒤 청구 · 국가 준공 개천절 연휴) + 준공 알림 + 추석 참고 날
//   ③ 새로고침해도 남음 ④ 다음에 갈 곳 단추 넷 ⑤ 되돌아오는 길(기성 관리 · 서식 둘 · 서식 탭 ⑧ · ⑨ · 도구 목록) ⑥ 구운 장(제목 · 근거 · «무료» · «클로드» 없음)
//   ⑦ 맨 위 찾기(빠른찾기) 로 «기성금 지급기한» · «준공대가» → 이 도구 ⑧ 가로 넘침 없음 · 화면 오류 0
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { 대금기한, 날말 } from '../web/src/lib/대금기한.js'
import { 한국오늘 } from '../web/src/lib/해마다.js'
const 여기 = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(process.env.PW || '/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const B = process.argv[2] || 'http://127.0.0.1:4996'
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else { bad++; console.log('✗', m, 더) } }
const 오늘 = 한국오늘()
const 기대 = (o) => { const r = 대금기한({ ...o, 오늘 }); return `${날말(r.기한, 오늘)}까지 · ${r.남은 === 0 ? '오늘까지' : r.남은 > 0 ? `${r.남은}일 남음` : `${-r.남은}일 지남`}` }

/* ⑦ 맨 위 찾기 — 사이트 자료로 목록을 만들어 사람들이 칠 말 */
{
  const L = await import(pathToFileURL(path.join(여기, '..', 'web', 'src', 'lib', '빠른찾기.js')).href)
  const 읽 = (f) => JSON.parse(fs.readFileSync(path.join(여기, '..', 'web', 'src', 'data', f), 'utf8'))
  const 목 = L.목록만들기({ 탭: [{ to: '/tools', ic: '🧰', label: '도구' }], tools: 읽('tools.json'), forms: 읽('forms-min.json'), change: 읽('change.json'), guide: 읽('guide.json'), cad: 읽('cad.json') })
  for (const q of ['기성금 지급기한', '준공금 지급 기한', '대가지급 기한', '기성대가 언제', '준공대가 지급']) {
    const 위 = L.찾기(목, q, 3).map((x) => x.to)
    봐(위.includes('/tools/payment-deadline'), `찾기 «${q}» → 위 셋 안에 이 도구`, 위.join(' '))
  }
}

const 브 = await chromium.launch()
for (const 기기 of ['PC', '폰']) {
  const 판 = await 브.newContext({ viewport: 기기 === '폰' ? { width: 390, height: 844 } : { width: 1280, height: 900 }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', ...(기기 === '폰' ? { isMobile: true, hasTouch: true } : {}) })
  await 판.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs|firebaseio|firebasedatabase/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await 판.addInitScript(() => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) { /* 없음 */ } })
  const A = await 판.newPage()
  const 오류 = []
  A.on('pageerror', (e) => 오류.push(String(e).slice(0, 160)))
  const 누름 = async (loc) => { if (기기 === '폰') await loc.tap(); else await loc.click() }
  const 열기 = async () => { await A.goto(B + '/tools/payment-deadline', { waitUntil: 'domcontentloaded' }); await A.waitForSelector('.pdl', { timeout: 25000 }); await A.waitForTimeout(300) }
  const 기한글 = () => A.evaluate(() => { const o = [...document.querySelectorAll('.pdl .tl-o.big b')]; return o.length ? o[0].innerText.replace(/\u00a0/g, ' ') : '' })   // «n일 남음» 은 붙는 빈칸
  const 칩 = () => A.evaluate(() => [...document.querySelectorAll('.pdl .pdl-d')].map((x) => x.className.replace('pdl-d ', '') + ':' + x.querySelector('b').innerText + ' ' + x.querySelector('i').innerText))
  const 날넣기 = async (n, v) => { const el = A.locator('.pdl input[type="date"]').nth(n); await el.fill(v); await A.waitForTimeout(120) }
  const 고르기 = async (n, v) => { await A.locator('.pdl select').nth(n).selectOption(v); await A.waitForTimeout(120) }

  await A.goto(B + '/', { waitUntil: 'domcontentloaded' })
  await A.evaluate(() => { try { for (const k of Object.keys(localStorage)) if (/payment-deadline|kcm_tool/.test(k)) localStorage.removeItem(k) } catch (e) { /* 없음 */ } })
  await 열기()
  봐(await A.locator('h1', { hasText: '기성금 · 준공금 지급 기한' }).count() > 0, `${기기} 제목`)
  봐((await 기한글()).includes('검사 완료일을 넣으세요'), `${기기} 빈칸이면 «검사 완료일을 넣으세요»`, await 기한글())
  /* ① 예시 */
  await 누름(A.locator('button', { hasText: '예시로 해 보기' }).first())
  await A.waitForTimeout(300)
  봐((await 기한글()) === 기대({ 무엇: '기성', 발주: '국가', 검사일: '2026-11-04' }), `${기기} 예시 → 11월 9일(월)까지`, await 기한글())
  봐((await A.locator('.pdl .claudesay', { hasText: '11월 11일(수)' }).count()) === 1, `${기기} 예시 · 토 · 공휴일 빼고 세면 11월 11일(수) 참고`)
  await 누름(A.locator('button', { hasText: '지우기' }).first())
  await A.waitForTimeout(300)
  /* ② 손으로 — 국가 기성 · 11.2.(월) 검사 → 5일째 11.7.(토) → 11.9.(월) */
  await 고르기(0, '기성'); await 고르기(1, '국가')
  await 날넣기(0, '2026-11-02')
  봐((await 기한글()) === 기대({ 무엇: '기성', 발주: '국가', 검사일: '2026-11-02' }), `${기기} 국가 기성 11.2. → 11월 9일(월)`, await 기한글())
  const c1 = await 칩()
  봐(c1.join('|') === 'n:11.3.(화) 1일째|n:11.4.(수) 2일째|n:11.5.(목) 3일째|n:11.6.(금) 4일째|n:11.7.(토) 5일째 · 쉬는 날|x:11.8.(일) 쉼|end:11.9.(월) 다음 일하는 날', `${기기} 국가 기성 세는 날 · 밀린 날`, c1.join('|'))
  봐((await A.locator('.pdl .claudesay', { hasText: '빼고 세는 발주처' }).count()) === 0, `${기기} 같은 날이면 참고 날 없음`)
  /* 지방 기성 · 검사 11.4. · 뒤에 청구 11.6.(금) → 11.13.(금) */
  await 고르기(1, '지방')
  await 날넣기(0, '2026-11-04'); await 날넣기(1, '2026-11-06')
  봐((await 기한글()) === 기대({ 무엇: '기성', 발주: '지방', 검사일: '2026-11-04', 청구일: '2026-11-06' }), `${기기} 지방 기성 · 검사 뒤 청구 → 11월 13일(금)`, await 기한글())
  봐((await A.locator('.pdl .kt-hint', { hasText: '검사 완료일 뒤에 청구 → 청구를 받은 날부터' }).count()) === 1, `${기기} «청구를 받은 날부터» 까닭`)
  봐((await A.locator('.pdl .kt-law', { hasText: '지방계약법 시행령 제67조' }).count()) === 1, `${기기} 지방 근거 줄`)
  /* 국가 준공 · 9.30.(수) 청구 → 10.3.(토 · 개천절) · 10.4.(일) · 10.5.(대체) 빼고 10.8.(목) */
  await 고르기(0, '준공'); await 고르기(1, '국가')
  await 날넣기(0, '2026-09-30'); await 날넣기(1, '')
  봐((await 기한글()) === 기대({ 무엇: '준공', 발주: '국가', 청구일: '2026-09-30' }), `${기기} 국가 준공 9.30. → 10월 8일(목)`, await 기한글())
  const c2 = await 칩()
  봐(c2.join('|') === 'n:10.1.(목) 1일째|n:10.2.(금) 2일째|x:10.3.(토) 쉼|x:10.4.(일) 쉼|x:10.5.(월) 쉼|n:10.6.(화) 3일째|n:10.7.(수) 4일째|end:10.8.(목) 5일째', `${기기} 국가 준공 세는 날(연휴 셋 뺌)`, c2.join('|'))
  /* 준공 · 청구가 검사보다 앞섬 → 알림 */
  await 날넣기(1, '2026-10-02')
  봐((await A.locator('.pdl .claudesay.bad', { hasText: '검사 날보다 앞섭니다' }).count()) === 1, `${기기} 준공 · 청구가 검사보다 앞서면 알림`)
  await 날넣기(1, '')
  /* 국가 기성 · 추석 — 9.21.(월) 검사 → 9.26.(토) 끝 → 9.28.(월) · 빼고 세면 9.30.(수) */
  await 고르기(0, '기성')
  await 날넣기(0, '2026-09-21'); await 날넣기(1, '')
  봐((await 기한글()) === 기대({ 무엇: '기성', 발주: '국가', 검사일: '2026-09-21' }), `${기기} 국가 기성 추석 → 9월 28일(월)`, await 기한글())
  봐((await A.locator('.pdl .claudesay.mid', { hasText: '9월 30일(수)' }).count()) === 1, `${기기} 추석 · 빼고 세면 9월 30일(수)`)
  봐((await 기한글()).includes('지남') ? (await A.locator('.pdl .claudesay.bad', { hasText: '대출평균금리' }).count()) === 1 : true, `${기기} 지난 기한이면 이자 알림(국가)`)
  /* ③ 새로고침 */
  await A.waitForTimeout(700)
  await 열기()
  봐((await 기한글()) === 기대({ 무엇: '기성', 발주: '국가', 검사일: '2026-09-21' }) && (await A.locator('.pdl select').nth(0).inputValue()) === '기성', `${기기} 새로고침해도 그대로(이 기기)`, await 기한글())
  /* ④ 다음에 갈 곳 */
  const 단추 = await A.evaluate(() => [...document.querySelectorAll('.pdl .btn-row a')].map((a) => a.getAttribute('href')))
  봐(['/change/gisung', '/forms/gisung-cheonggu', '/forms/jungong-daega', '/tools/unpaid'].every((h) => 단추.includes(h)), `${기기} 다음에 갈 곳 넷`, 단추.join(' '))
  await 누름(A.locator('.pdl .btn-row a[href="/forms/gisung-cheonggu"]'))
  await A.waitForURL(/\/forms\/gisung-cheonggu/, { timeout: 15000 }).catch(() => {})
  await A.waitForSelector('.flist', { timeout: 20000 }).catch(() => {})
  봐(/\/forms\/gisung-cheonggu$/.test(A.url()), `${기기} 단추 → 기성금 청구서`, A.url())
  /* ⑤ 되돌아오는 길 */
  봐((await A.locator('.flist a.flink[href="/tools/payment-deadline"]').count()) === 1, `${기기} 기성금 청구서 «놓치기 쉬운 것» → 이 도구`)
  await A.goto(B + '/forms/jungong-daega', { waitUntil: 'domcontentloaded' })
  await A.waitForSelector('.flist', { timeout: 20000 }).catch(() => {})
  봐((await A.locator('.flist a.flink[href="/tools/payment-deadline"]').count()) === 1, `${기기} 준공대가 청구서 → 이 도구`)
  await A.goto(B + '/change/gisung', { waitUntil: 'domcontentloaded' })
  await A.waitForSelector('a[href="/tools/payment-deadline"]', { timeout: 20000 }).catch(() => {})
  봐((await A.locator('a[href="/tools/payment-deadline"]').count()) >= 1, `${기기} 기성 관리 → 이 도구`)
  await A.goto(B + '/forms', { waitUntil: 'domcontentloaded' })
  await A.waitForTimeout(1500)
  const 탭카드 = await A.evaluate(() => document.querySelectorAll('a[href="/tools/payment-deadline"]').length)
  봐(탭카드 >= 1, `${기기} 서식 탭에 카드(⑧ 기성 · ⑨ 준공)`, String(탭카드))
  await A.goto(B + '/tools', { waitUntil: 'domcontentloaded' })
  await A.waitForSelector('a[href="/tools/payment-deadline"]', { timeout: 20000 }).catch(() => {})
  봐((await A.locator('a[href="/tools/payment-deadline"]').count()) >= 1, `${기기} 도구 목록에 카드`)
  /* ⑧ 가로 넘침 · 오류 */
  await 열기()
  const 넘침 = await A.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)
  봐(!넘침, `${기기} 가로 넘침 없음`)
  봐(!오류.length, `${기기} 화면 오류 0`, 오류.slice(0, 2).join(' | '))
  await A.evaluate(() => { try { for (const k of Object.keys(localStorage)) if (/payment-deadline/.test(k)) localStorage.removeItem(k) } catch (e) { /* 없음 */ } })
  await 판.close()
}
await 브.close()

/* ⑥ 구운 장 */
{
  const r = await fetch(`${B}/tools/payment-deadline.html`).then((x) => x.text()).catch(() => '')
  봐(/<title>기성금 · 준공금 지급 기한 — 검사 · 청구 뒤 5일\(토요일 · 공휴일\) \| K-건설맵<\/title>/.test(r), '구운 장 제목(«무료» 꼬리 없음)')
  봐(r.includes('국가계약법 시행령 제58조') && r.includes('지방계약법 시행령 제67조') && r.includes('공사계약일반조건 제40조') && r.includes('민법 제157조'), '구운 장 근거 넷')
  봐(r.includes('10월 8일(목)') && r.includes('<b>적어도 30일마다</b>'), '구운 장 예 · 굵게')
  봐(!/무료|클로드/.test(r), '구운 장 «무료» · «클로드» 없음')
  const t = JSON.parse(fs.readFileSync(path.join(여기, '..', 'web', 'src', 'data', 'tools.json'), 'utf8')).tools.find((x) => x.slug === 'payment-deadline')
  봐(t && t.tail === '' && t.badge && !/무료/.test(JSON.stringify(t)), '도구 자료에 «무료» 없음 · 꼬리 · 미리보기 그림 글(badge)')
}
console.log(`\n${bad ? '✗' : '✓'} 시험_대금기한화면 ${ok}/${ok + bad}`)
process.exit(bad ? 1 : 0)
