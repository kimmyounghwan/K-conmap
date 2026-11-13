// 🧪 안전관리계획서 한 벌 화면(/tools/anjeon) — G638 (2026-11-10)
//   화면 빌드를 띄운 뒤  B=http://127.0.0.1:4996 node tools/시험_안전계획화면.mjs [PC|폰|모두]
//   ① 잠긴 브라우저(이용자): 🔒 안내 · 적는 칸 없음 · 🧪 예시 → 300쪽 넘는 미리보기 · 쪽 넘김 · 차례로 가기 · 받기 누르면 잠금 말 · 받기 안 됨
//   ② 소장님 브라우저(kcm_op=1): 적는 칸 · 🧪 예시로 채우기 → 미리보기 · 판정 · 그림 넣기(가짜 PNG) → 그 자리에 그림 · PDF 받기(이 시험 브라우저 안에서만)
//   ③ 화면 오류 없음 · 폰 가로 넘침 없음
import { createRequire } from 'module'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 주소 = process.env.B || 'http://127.0.0.1:4996'
const 기기들 = (process.argv[2] || '모두') === '모두' ? ['PC', '폰'] : [process.argv[2]]
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log(c ? '✓' : '✗', m, c ? '' : String(더).slice(0, 300)) }
/* 1×1 이 아닌 작은 PNG(빨간 네모 8×8) */
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEklEQVR4nGP4z8CAFWEXHbQSACj/P8Fu7N9hAAAAAElFTkSuQmCC', 'base64')

const 브 = await chromium.launch({ env: { ...process.env, LANG: 'C.UTF-8', LC_ALL: 'C.UTF-8' } })
for (const 기기 of 기기들) {
  for (const 소장님 of [false, true]) {
    const 판 = await 브.newContext({ viewport: { width: 기기 === '폰' ? 390 : 1280, height: 900 }, locale: 'ko-KR', acceptDownloads: true,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36' })
    await 판.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
    await 판.route(/firebaseio\.com|googleapis\.com/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
    await 판.addInitScript((op) => {
      try { localStorage.clear() } catch (e) {}
      if (op) localStorage.setItem('kcm_op', '1')
      try { sessionStorage.setItem('kcm_visit_s', '1') } catch (e) {}
      /* 공지 창은 자동 브라우저(navigator.webdriver)에선 저절로 안 뜸(감사공지.jsx) — 그대로 둠 */
    }, 소장님)
    const A = await 판.newPage()
    const 오류 = []
    A.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
    const 누구 = `${기기} · ${소장님 ? '소장님' : '이용자'}`
    await A.goto(주소 + '/tools/anjeon', { waitUntil: 'domcontentloaded' })
    await A.waitForSelector('h1:has-text("안전관리계획서 한 벌")', { timeout: 30000 })
    await A.waitForTimeout(1500)
    const 넘침 = async () => A.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    if (!소장님) {
      const 글 = await A.locator('body').innerText()
      봐(글.includes('🔒 문의해 주세요'), `${누구} 잠금 안내`)
      봐(!글.includes('① 공사 · 사람'), `${누구} 적는 칸 없음`)
      await A.locator('button:has-text("예시로 미리 보기")').click()
      await A.waitForSelector('svg.sg-page', { timeout: 60000 })
      const 쪽수 = await A.evaluate(() => +((document.body.innerText.match(/미리보기 · 받기\s*— (\d+)쪽/) || [])[1] || 0))
      봐(쪽수 >= 300, `${누구} 예시 ${쪽수}쪽(300 넘게)`, 쪽수)
      const 표지 = await A.locator('svg.sg-page').innerHTML()
      봐(표지.includes('가상 한빛 공공하수처리시설 증설공사') && /안\s*전\s*관\s*리\s*계\s*획\s*서/.test(표지.replace(/<[^>]+>/g, '')), `${누구} 표지(가상 공사명)`)
      await A.locator('.sg-pager button:has-text("▶")').click()
      await A.waitForTimeout(400)
      const 쪽2 = await A.locator('.sg-pager select').inputValue()
      봐(쪽2 === '1', `${누구} ▶ 다음 쪽`, 쪽2)
      /* 차례로 가기 — «다. 현장운영계획» */
      const 값 = await A.locator('.sp-toc select option', { hasText: '다. 현장운영계획' }).first().getAttribute('value')
      await A.locator('.sp-toc select').selectOption(값)
      await A.waitForTimeout(500)
      const 지금 = await A.locator('.sg-pager select').inputValue()
      봐(+지금 > 10, `${누구} 차례로 가기 → ${+지금 + 1}번째 쪽`, 지금)
      const 그쪽 = (await A.locator('svg.sg-page').innerHTML()).replace(/<[^>]+>/g, ' ')
      봐(/현장운영계획/.test(그쪽), `${누구} 그 쪽에 «현장운영계획»`)
      /* 받기 누르면 잠금 말 · 내려받기 없음 */
      let 받음 = false
      A.on('download', () => { 받음 = true })
      await A.locator('button:has-text("🔒 PDF")').click()
      await A.waitForTimeout(800)
      const 글2 = await A.locator('body').innerText()
      봐(글2.includes('PDF 받기는 K-건설맵에 문의해 주세요') && !받음, `${누구} 잠긴 받기 → 안내만`)
      봐(await 넘침() <= 1, `${누구} 가로 넘침 없음`, await 넘침())
    } else {
      const 글 = await A.locator('body').innerText()
      봐(!글.includes('🔒 문의해 주세요') && 글.includes('① 공사 · 사람'), `${누구} 적는 칸 보임 · 잠금 안내 없음`)
      await A.locator('button:has-text("예시(가상 공사)로 채우기")').click()
      await A.waitForSelector('svg.sg-page', { timeout: 60000 })
      await A.waitForFunction(() => /미리보기 · 받기\s*— (\d+)쪽/.test(document.body.innerText) && +document.body.innerText.match(/미리보기 · 받기\s*— (\d+)쪽/)[1] >= 300, null, { timeout: 60000 }).catch(() => {})
      const 쪽수 = await A.evaluate(() => +((document.body.innerText.match(/미리보기 · 받기\s*— (\d+)쪽/) || [])[1] || 0))
      봐(쪽수 >= 300, `${누구} 예시로 채움 → ${쪽수}쪽`, 쪽수)
      const 공사명 = await A.locator('label:has-text("공사명") input').first().inputValue()
      봐(공사명 === '가상 한빛 공공하수처리시설 증설공사', `${누구} 칸에 예시 공사명`, 공사명)
      const 글2 = await A.locator('body').innerText()
      봐(/✅ 수립 대상 — 제2호/.test(글2), `${누구} 수립 대상 판정 줄`)
      /* 공사명을 바꾸면 미리보기 표지가 바뀜 */
      await A.locator('label:has-text("공사명") input').first().fill('가상 시험 고침 공사')
      await A.waitForTimeout(1600)
      await A.locator('.sg-pager select').selectOption('0')
      await A.waitForTimeout(400)
      봐((await A.locator('svg.sg-page').innerHTML()).includes('가상 시험 고침 공사'), `${누구} 고친 공사명이 표지에`)
      /* 그림 넣기 — «위치도» 자리 */
      await A.locator('summary:has-text("도면 · 사진 · 서류 사본 넣기")').click()
      await A.locator('.sp-up select').selectOption('위치도')
      await A.locator('.sp-up input[type=file]').setInputFiles({ name: '시험_위치도.png', mimeType: 'image/png', buffer: PNG })
      await A.waitForFunction(() => document.body.innerText.includes('시험_위치도.png →'), null, { timeout: 30000 }).catch(() => {})
      봐((await A.locator('body').innerText()).includes('시험_위치도.png →'), `${누구} 그림 넣음 말`)
      await A.locator('.sp-up button:has-text("그 쪽 보기")').click()
      await A.waitForTimeout(1600)
      봐(await A.locator('svg.sg-page image').count() >= 1, `${누구} 그 쪽에 넣은 그림이 보임`)
      /* 🧪 G650(11-11) 소장님 「막아 놓은 건 예시도 받지 못하게 막고 볼 수만 있게 해」 — 예시로 채운 것은 공사명 · 그림을 고쳐도 🔒(받기 0) */
      let 예시받음 = false
      const 예시받기 = () => { 예시받음 = true }
      A.on('download', 예시받기)
      await A.locator('.sg-dl button:has-text("🔒 PDF")').click()
      await A.waitForTimeout(900)
      봐(!예시받음 && (await A.locator('body').innerText()).includes('예시(가상 공사)로 채운 것은 보기만'), `${누구} 예시로 채운 채로는 🔒 받기 · 받기 0(G650)`)
      A.off('download', 예시받기)
      /* ↺ 비우기 → 내 공사로 적고 PDF 받기 — 이 시험 브라우저 안에서만 */
      await A.locator('button:has-text("↺ 비우기")').click()
      await A.waitForTimeout(1200)
      await A.locator('label:has-text("공사명") input').first().fill('가상 시험 내 공사')
      await A.waitForTimeout(1800)
      const [받기] = await Promise.all([A.waitForEvent('download', { timeout: 180000 }), A.locator('.sg-dl button:has-text("⬇ PDF")').click()])
      const 이름 = 받기.suggestedFilename()
      const 길 = await 받기.path()
      const fs = await import('node:fs')
      const 머 = fs.readFileSync(길).subarray(0, 5).toString()
      봐(/안전관리계획서\.pdf$/.test(이름) && 머 === '%PDF-', `${누구} PDF 받기(${이름})`, 이름 + ' ' + 머)
      봐(await 넘침() <= 1, `${누구} 가로 넘침 없음`, await 넘침())
    }
    봐(오류.length === 0, `${누구} 화면 오류 없음`, 오류.join(' | '))
    await 판.close()
  }
}
await 브.close()
console.log(`\n${bad ? '✗' : '✓'} 통과 ${ok} · 실패 ${bad}`)
process.exit(bad ? 1 : 0)
