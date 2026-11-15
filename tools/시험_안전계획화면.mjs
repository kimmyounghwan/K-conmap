// 🧪 안전관리계획서 한 벌 화면(/tools/anjeon) — G638 (2026-11-10)
//   화면 빌드를 띄운 뒤  B=http://127.0.0.1:4996 node tools/시험_안전계획화면.mjs [PC|폰|모두]
//   ① 잠긴 브라우저(이용자): 🔒 안내 · 적는 칸 없음 · 🧪 예시 → 앞 3쪽만(G690 — 한 벌 300쪽 넘음 · 차례 4쪽부터 🔒) · 받기 자리는 문의 단추 · 받기 안 됨
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
      /* 🧪 G690 (11-15 소장님 「예시도 2페이지에서 3페이지만 볼 수 있게 해줘」) — 손님 예시는 앞 3쪽까지 · 한 벌 쪽 수는 머리에 */
      const 쪽수 = await A.evaluate(() => +((document.body.innerText.match(/한 벌 (\d+)쪽/) || [])[1] || 0))
      봐(쪽수 >= 300, `${누구} 예시 한 벌 ${쪽수}쪽(300 넘게) — 머리 «🧪 예시 3쪽 (한 벌 ${쪽수}쪽)»`, 쪽수)
      const 표지 = await A.locator('svg.sg-page').innerHTML()
      봐(표지.includes('가상 한빛 공공하수처리시설 증설공사') && /안\s*전\s*관\s*리\s*계\s*획\s*서/.test(표지.replace(/<[^>]+>/g, '')), `${누구} 표지(가상 공사명)`)
      await A.locator('.sg-pager button:has-text("▶")').click()
      await A.waitForTimeout(400)
      const 쪽2 = await A.locator('.sg-pager select').inputValue()
      봐(쪽2 === '1', `${누구} ▶ 다음 쪽`, 쪽2)
      const 고르기 = await A.evaluate(() => [...document.querySelectorAll('.sg-pager select option')].map((o) => o.textContent))
      봐(고르기.length === 3 && /^3 \/ \d{3}쪽/.test(고르기[2]), `${누구} 넘기기 고르기는 3쪽까지(«${고르기[2] || ''}»)`, 고르기)
      await A.locator('.sg-pager select').selectOption('2')
      await A.waitForTimeout(400)
      봐(await A.locator('.sg-pager button:has-text("▶")').isDisabled(), `${누구} 3쪽에서 ▶ 막힘`)
      /* 차례로 가기 — 4쪽부터는 🔒(고를 수 없음) */
      const 차례 = await A.evaluate(() => {
        const o = [...document.querySelectorAll('.sp-toc select option')].filter((x) => x.value !== '' || x.disabled)
        const 운영 = [...document.querySelectorAll('.sp-toc select option')].find((x) => /다\. 현장운영계획/.test(x.textContent))
        return { 열림: o.filter((x) => !x.disabled).length, 잠김: o.filter((x) => x.disabled).length, 운영잠김: !!(운영 && 운영.disabled && /🔒/.test(운영.textContent)) }
      })
      봐(차례.열림 <= 3 && 차례.잠김 > 10 && 차례.운영잠김, `${누구} 차례로 가기 — 4쪽부터 🔒(열림 ${차례.열림} · 잠김 ${차례.잠김} · «다. 현장운영계획» 🔒)`, 차례)
      const 끝말 = await A.locator('.kcm-예시끝').innerText().catch(() => '')
      봐(/예시는 앞 3쪽까지 보입니다/.test(끝말) && /안전관리계획서 한 벌 \d{3}쪽 전부/.test(끝말) && (await A.locator('.kcm-예시끝 a[href^="/contact?k=cn"]').count()) === 1, `${누구} «🔒 예시는 앞 3쪽까지» + 문의 단추`, 끝말)
      /* 받기 자리 = 문의 단추(🔒 PDF · 한글 · 워드 · 엑셀 단추 없음) · 내려받기 없음 */
      let 받음 = false
      A.on('download', () => { 받음 = true })
      const 받기단추 = await A.evaluate(() => [...document.querySelectorAll('.sg-dl button')].map((b) => b.innerText.trim()))
      const 문의 = await A.locator('.sg-dl a[href^="/contact?k=cn"]').count()
      봐(받기단추.length === 0 && 문의 === 1 && !받음, `${누구} 받기 자리 — 🔒 받기 단추 0 · 문의 단추 1(G690)`, 받기단추)
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
