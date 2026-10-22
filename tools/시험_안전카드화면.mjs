// 🌏 현장 다국어 안전카드(/tools/safecard) 화면 시험 — 다른 예시 세 벌 · PC · 폰 (2026-10-22)
//   A TBM · 중국어 + 베트남어 · 추천 넣기 · 작업 둘 · 101동 3층 A구역 · 서명 8줄 → 칸 순서 · 번역 · 장소 말마다 · 건설맵 끄기 · 인쇄 셈
//   B 안전수칙 «표지» · 우즈벡어 + 러시아어 + 영어(넷째 말은 막힘) · 찾기 «크레인» · 직접 쓴 말(러시아어만 적음) → 표지 장 수 · «번역 안 됨»
//   C 작업 지시서 · 영어 · 지하 2층 · 시간 · 다시 열면 그대로 · 처음부터
//   돌리기: 4998 에 화면 빌드를 얹은 뒤 node tools/시험_안전카드화면.mjs [PC|폰|모두]
import { createRequire } from 'module'
import fs from 'fs'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 주소 = process.env.B || 'http://127.0.0.1:4998'
const 기기들 = (process.argv[2] || '모두') === '모두' ? ['PC', '폰'] : [process.argv[2]]
const 폴더 = process.env.CAP || '/tmp/g10/g372/ui'
fs.mkdirSync(폴더, { recursive: true })
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log(c ? '✓' : '✗', m, c ? '' : 더) }
const 브 = await chromium.launch()
for (const 기기 of 기기들) {
  /* 셈을 보려고 사람 브라우저처럼(webdriver · Headless 글자 없앰) — 데이터베이스는 가짜(아래 route) */
  const 판 = await 브.newContext({ viewport: { width: 기기 === '폰' ? 390 : 1280, height: 900 }, locale: 'ko-KR', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36' })
  await 판.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  const 셈 = []
  await 판.route(/firebaseio\.com/, (r) => {
    const q = r.request()
    if (q.method() !== 'GET') 셈.push(decodeURIComponent(q.url()))
    r.fulfill({ status: 200, contentType: 'application/json', body: 'null' })
  })
  await 판.addInitScript(() => { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); try { sessionStorage.setItem('kcm_notice_seen', '2026-10-업체') } catch (e) {}; window.print = () => { window.__찍음 = (window.__찍음 || 0) + 1 }; Object.defineProperty(navigator, 'webdriver', { get: () => false }) })
  const A = await 판.newPage()
  const 오류 = []
  A.on('pageerror', (e) => 오류.push(String(e).slice(0, 160)))
  const 새로 = async () => {
    await A.goto(주소 + '/tools/safecard', { waitUntil: 'domcontentloaded' })
    await A.evaluate(() => localStorage.removeItem('kcm.safecard.v1'))
    await A.reload({ waitUntil: 'domcontentloaded' })
    await A.waitForSelector('.sc-wrap', { timeout: 20000 })
  }
  const 말누름 = (이름) => A.locator('.sc-chips[aria-label="말 고르기"] .chip', { hasText: 이름 }).click()
  const 종이글 = () => A.locator('.sc-preview').innerText()
  const 넘침 = () => A.evaluate(() => document.scrollingElement.scrollWidth - window.innerWidth)

  /* ── A TBM ── */
  await 새로()
  봐((await A.locator('.sc-paper').count()) === 1, `${기기} A 처음부터 종이가 보임(기본 문장 9)`)
  await 말누름('베트남어')
  for (const 작 of ['철근 배근', '콘크리트 타설']) await A.locator('.sc-works .chip', { hasText: 작 }).click()
  await A.locator('button', { hasText: '추천 넣기' }).click()
  await A.locator('[aria-label="동"]').fill('101'); await A.locator('[aria-label="층"]').fill('3층'); await A.locator('[aria-label="구역"]').fill('A')
  await A.locator('#sc-site').fill('가상 물류센터 신축공사'); await A.locator('#sc-leader').fill('박반장(가상)')
  await A.locator('#sc-boss').fill('정과장(가상)'); await A.locator('#sc-phone').fill('010-0000-0000'); await A.locator('#sc-evac').fill('정문 앞')
  await A.locator('.sc-opt select').selectOption('8')
  let t = await 종이글()
  봐(t.includes('101栋 3层 A区') && t.includes('Tòa 101, Tầng 3, Khu A') && t.includes('101동 3층 A구역'), `${기기} A 장소 말마다(층 칸은 숫자만)`, t.slice(0, 300))
  봐(t.includes('钢筋绑扎') && t.includes('Đổ bê tông'), `${기기} A 작업 번역`)
  const 머리순 = await A.locator('.sc-preview .sc-sec-h .sc-hd-ko').allInnerTexts()
  봐(JSON.stringify(머리순) === JSON.stringify(['오늘 할 작업', '위험한 것과 지킬 것', '보호구 확인', '건강 확인', '꼭 기억하세요', '비상 연락', '참석자 서명']), `${기기} A 칸 순서(KOSHA TBM 흐름)`, 머리순.join(' > '))
  봐(t.includes('不要随意拆除或移动模板支撑') === false && t.includes('不要进入设备作业范围内') && t.includes('Trong khi đổ bê tông, không được vào bên dưới hệ cây chống.') && t.includes('突出的钉子'), `${기기} A 추천 = 기본 + 고른 작업(철근 · 타설)의 위험 문장`)
  봐(t.indexOf('现在开始班前安全会议') < t.indexOf('오늘 할 작업'), `${기기} A 여는 말이 맨 위`)
  봐((await A.locator('.sc-preview .sc-sign-t tbody tr').count()) === 8, `${기기} A 서명 8줄`)
  봐(t.includes('拨打119') && t.includes('Gọi 119'), `${기기} A 119 문장 번역`)
  봐((await A.locator('.sc-preview .sc-box').count()) === 7, `${기기} A 보호구 4(철근 → 장갑) · 건강 3 네모`)
  봐(t.includes('k-conmap.com'), `${기기} A 건설맵 주소 보임`)
  await A.locator('.sc-brand input').uncheck()
  봐(!(await 종이글()).includes('k-conmap.com'), `${기기} A 건설맵 주소 끄면 사라짐`)
  셈.length = 0
  await A.locator('button', { hasText: '인쇄 · PDF' }).click()
  await A.waitForTimeout(700)
  봐((await A.evaluate(() => window.__찍음 || 0)) === 1 && (await A.locator('#gp-인쇄 .sc-쪽').count()) === 1, `${기기} A 인쇄 — 종이 한 벌 · print 한 번`)
  if (기기 === 'PC') {
    await A.emulateMedia({ media: 'print' })
    await A.pdf({ path: `${폴더}/시험A_TBM.pdf`, format: 'A4', printBackground: true, preferCSSPageSize: true })
    await A.emulateMedia({ media: 'screen' })
  }
  await A.evaluate(() => window.dispatchEvent(new Event('afterprint')))
  await A.waitForTimeout(300)
  const 셈글 = 셈.join('\n')
  봐(/안전카드.{0,3}인쇄TBM/.test(셈글) && /안전카드.{0,3}zh/.test(셈글) && /안전카드.{0,3}vi/.test(셈글), `${기기} A 인쇄 셈(|안전카드|인쇄TBM · zh · vi)`, 셈글.slice(0, 300))
  봐((await A.locator('#gp-인쇄').count()) === 0, `${기기} A 인쇄 끝나면 인쇄 칸 사라짐`)
  봐((await 넘침()) <= 1, `${기기} A 가로 넘침 없음`)
  await A.screenshot({ path: `${폴더}/시험A_${기기}.png`, fullPage: false })

  /* ── B 안전수칙 · 표지 ── */
  await 새로()
  await A.locator('.gp-pick-b', { hasText: '안전수칙' }).click()
  await 말누름('중국어')   // 하나뿐이면 안 빠짐
  봐((await A.locator('.sc-chips[aria-label="말 고르기"] .chip.on').count()) === 1, `${기기} B 마지막 말은 못 뺌`)
  for (const 이 of ['우즈벡어', '러시아어']) await 말누름(이)
  await 말누름('영어')
  봐((await A.locator('.fwarn', { hasText: '세 가지 말까지' }).count()) === 1, `${기기} B 넷째 말 → «세 가지까지» 알림`)
  await 말누름('중국어'); await 말누름('영어')
  봐((await A.locator('.sc-chips[aria-label="말 고르기"] .chip.on').allInnerTexts()).map((x) => x.split(' ')[0]).join() === '우즈벡어,러시아어,영어', `${기기} B 우즈벡어 · 러시아어 · 영어`)
  await A.locator('.sc-opt label', { hasText: '표지 —' }).click()
  await A.locator('.sc-find').fill('크레인')
  const 찾은 = await A.locator('.sc-list li label').count()
  봐(찾은 >= 3, `${기기} B 찾기 «크레인» ${찾은}줄`)
  await A.locator('.sc-list li label').nth(0).click(); await A.locator('.sc-list li label').nth(1).click()
  await A.locator('.sc-find').fill('')
  await A.locator('.sc-cats .chip', { hasText: '밀폐공간' }).click()
  await A.locator('.sc-list li label', { hasText: '갈탄' }).click()
  await A.locator('button', { hasText: '직접 쓴 줄 더하기' }).click()
  await A.locator('[aria-label="직접 쓴 말 1"]').fill('3층 슬래브 끝에는 가지 마세요.')
  await A.locator('[aria-label="직접 쓴 말 1 러시아어"]').fill('Не подходите к краю плиты 3-го этажа.')
  t = await 종이글()
  const 장 = await A.locator('.sc-preview .sc-sign').count()
  봐(장 === 4, `${기기} B 표지 4장(고른 3 + 직접 1)`, String(장))
  봐(t.includes('Kranga signalni faqat bir kishi beradi.') && t.includes('угарным газом') && t.includes('Crane work stops in strong winds.'), `${기기} B 우즈벡어 · 러시아어 · 영어 번역`, t.slice(0, 400))
  봐(t.includes('Не подходите к краю плиты') && t.includes('Qoʻshimcha yozilgan (tarjima qilinmagan)') && t.includes('Added on site (not translated)'), `${기기} B 직접 쓴 말 — 러시아어만 · 나머지 «번역 안 됨»`)
  봐(!t.includes('Добавлено вручную (без перевода)'), `${기기} B 러시아어를 적었으니 러시아어 «번역 안 됨» 없음`)
  봐((await A.locator('.sc-preview .sc-sign.k-no').count()) >= 1 && (await A.locator('.sc-preview .sc-sign.k-self').count()) === 1, `${기기} B 금지 · 직접 표지 색`)
  봐((await 넘침()) <= 1, `${기기} B 가로 넘침 없음`)
  if (기기 === 'PC') {
    await A.locator('button', { hasText: '인쇄 · PDF' }).click(); await A.waitForTimeout(500)
    await A.emulateMedia({ media: 'print' })
    await A.pdf({ path: `${폴더}/시험B_표지.pdf`, format: 'A4', printBackground: true, preferCSSPageSize: true })
    await A.emulateMedia({ media: 'screen' }); await A.evaluate(() => window.dispatchEvent(new Event('afterprint'))); await A.waitForTimeout(200)
  }

  /* ── C 작업 지시서 ── */
  await 새로()
  await A.locator('.gp-pick-b', { hasText: '작업 지시서' }).click()
  await 말누름('영어'); await 말누름('중국어')
  await A.locator('#sc-date').fill('2026-11-03'); await A.locator('#sc-시작').fill('08:30'); await A.locator('#sc-끝').fill('16:30')
  await A.locator('#sc-작업자').fill('가상 배관공 2명'); await A.locator('#sc-issuer').fill('최대리(가상)')
  await A.locator('.sc-place input[type=checkbox]').check(); await A.locator('[aria-label="층"]').fill('2')
  for (const 작 of ['배관', '용접', '자재 운반']) await A.locator('.sc-works .chip', { hasText: 작 }).click()
  for (const 글 of ['작업 허가를 받은 뒤에', '혼자 일하지 말고', '용접 · 절단 전에']) {
    await A.locator('.sc-find').fill(글.split(' ')[0]); await A.locator('.sc-list li label', { hasText: 글 }).click()
  }
  await A.locator('.sc-find').fill('')
  t = await 종이글()
  봐(t.includes('B2') && t.includes('지하 2층'), `${기기} C 지하 2층 → B2`)
  봐(t.includes('08:30 ~ 16:30') && t.includes('2026-11-03'), `${기기} C 시간 · 날짜`)
  봐(t.includes('Pipe installation') && t.includes('Welding') && t.includes('Material handling'), `${기기} C 작업 영어`)
  봐(t.includes('Start only after you have received a work permit.') && t.includes('Do not work alone; work in pairs.'), `${기기} C 주의할 것 영어`)
  봐(!/[一-鿿]/.test(t.replace(/K-건설맵.*$/s, '')), `${기기} C 중국어 뺐으니 한자 없음`)
  봐((await A.locator('.sc-preview .sc-sign-t th').count()) === 2 && t.includes('Issued by') && t.includes('Confirmed (worker)'), `${기기} C 지시 · 확인 서명 칸`)
  await A.reload({ waitUntil: 'domcontentloaded' }); await A.waitForSelector('.sc-wrap')
  t = await 종이글()
  봐(t.includes('B2') && t.includes('Pipe installation') && (await A.locator('.gp-pick-b.on').innerText()).includes('작업 지시서'), `${기기} C 다시 열면 그대로(이 브라우저)`)
  await A.locator('button', { hasText: '처음부터' }).click()
  봐((await A.locator('.sc-paper').count()) === 0 && (await A.locator('[aria-label="층"]').inputValue()) === '', `${기기} C 처음부터 → 빈 종이`)
  /* 🧪 예시 */
  셈.length = 0
  await A.locator('button', { hasText: '예시 채우기' }).click(); await A.waitForTimeout(300)
  봐((await 종이글()).includes('가상') && /안전카드.{0,3}예시/.test(셈.join('\n')), `${기기} 예시 채우기 · 셈`)
  봐(오류.length === 0, `${기기} 화면 오류 0`, 오류.join(' | '))
  await 판.close()
}
await 브.close()
console.log(`\n${bad ? '❌' : '✅'} 안전카드 화면 ${ok + bad}개 중 ${ok} 맞음 · ${bad} 틀림`)
process.exit(bad ? 1 : 0)
