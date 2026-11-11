// 🧪 유해위험방지계획서 한 벌 화면(/tools/yuhae) — G639 (2026-11-10)
//   화면 빌드를 띄운 뒤  B=http://127.0.0.1:4996 node tools/시험_유해계획화면.mjs [PC|폰|모두]
//   ① 잠긴 브라우저(이용자): 🔒 안내 · 적는 칸 없음 · 🧪 예시 → 300쪽 넘는 미리보기 · 표지 · 제출서 · 대조표 · 쪽 넘김 · 차례로 가기 ·
//      마지막 쪽(서식)까지 넘겨 볼 수 있음(소장님 「예시는 처음부터 끝까지 이용자가 볼 수 있게 해줘」) · 받기 누르면 잠금 말 · 받기 안 됨
//   ② 소장님 브라우저(kcm_op=1): 적는 칸 · 🧪 예시로 채우기 → 판정 줄 · 작성대상 끄기 → 쪽 줄어듦 · 그림 넣기(가짜 PNG) · PDF 받기(이 시험 브라우저 안에서만)
//   ③ 화면 오류 없음 · 폰 가로 넘침 없음 · 안전관리계획서 화면에서 이 화면으로 가는 길
import { createRequire } from 'module'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 주소 = process.env.B || 'http://127.0.0.1:4996'
const 기기들 = (process.argv[2] || '모두') === '모두' ? ['PC', '폰'] : [process.argv[2]]
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log(c ? '✓' : '✗', m, c ? '' : String(더).slice(0, 300)) }
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEklEQVR4nGP4z8CAFWEXHbQSACj/P8Fu7N9hAAAAAElFTkSuQmCC', 'base64')
const 쪽글 = async (A) => (await A.locator('svg.sg-page').innerHTML()).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')

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
    }, 소장님)
    const A = await 판.newPage()
    const 오류 = []
    A.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
    const 누구 = `${기기} · ${소장님 ? '소장님' : '이용자'}`
    await A.goto(주소 + '/tools/yuhae', { waitUntil: 'domcontentloaded' })
    await A.waitForSelector('h1:has-text("유해위험방지계획서 한 벌")', { timeout: 30000 })
    await A.waitForTimeout(1500)
    const 넘침 = async () => A.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    const 쪽수 = async () => A.evaluate(() => +((document.body.innerText.match(/미리보기 · 받기\s*— (\d+)쪽/) || [])[1] || 0))
    if (!소장님) {
      const 글 = await A.locator('body').innerText()
      봐(글.includes('🔒 지금은 준비 중입니다'), `${누구} 잠금 안내`)
      봐(!글.includes('① 공사 · 사람'), `${누구} 적는 칸 없음`)
      await A.locator('button:has-text("예시로 미리 보기")').click()
      await A.waitForSelector('svg.sg-page', { timeout: 60000 })
      const n = await 쪽수()
      봐(n >= 300, `${누구} 예시 ${n}쪽(300 넘게)`, n)
      const 표지 = await 쪽글(A)
      봐(표지.includes('가상 한빛 복합문화센터 신축공사') && /유 해 위 험 방 지 계 획 서/.test(표지), `${누구} 표지(가상 공사명)`)
      await A.locator('.sg-pager button:has-text("▶")').click()
      await A.waitForTimeout(400)
      봐((await A.locator('.sg-pager select').inputValue()) === '1' && (await 쪽글(A)).includes('별지 제17호서식'), `${누구} ▶ 다음 쪽 — 별지 제17호서식 제출서`)
      /* 앞쪽 — 첨부서류 대조표 */
      const 대조 = await A.evaluate(() => { const s = document.querySelector('.sg-pager select'); return s ? s.options.length : 0 })
      let 본대조 = false
      for (let i = 2; i < Math.min(12, 대조); i++) {
        await A.locator('.sg-pager select').selectOption(String(i)); await A.waitForTimeout(250)
        if ((await 쪽글(A)).includes('첨부서류 대조표')) { 본대조 = true; break }
      }
      봐(본대조, `${누구} 앞쪽 «첨부서류 대조표»`)
      /* 차례로 가기 — «2. 산업안전보건관리비 사용계획서» */
      const 값 = await A.locator('.sp-toc select option', { hasText: '2. 산업안전보건관리비 사용계획서' }).first().getAttribute('value')
      await A.locator('.sp-toc select').selectOption(값)
      await A.waitForTimeout(500)
      const 지금 = await A.locator('.sg-pager select').inputValue()
      봐(+지금 > 20 && /산업안전보건관리비 사용계획서/.test(await 쪽글(A)), `${누구} 차례로 가기 → ${+지금 + 1}번째 쪽(산안비)`, 지금)
      /* 끝까지 — 마지막 쪽(별첨 서식) */
      await A.locator('.sg-pager select').selectOption(String(n - 1))
      await A.waitForTimeout(500)
      const 끝 = await 쪽글(A)
      봐(/서식 \d+\./.test(끝) && (await A.locator('.sg-pager button:has-text("▶")').isDisabled()), `${누구} 마지막 쪽(${n}쪽)까지 넘겨 봄 — 서식`)
      /* 받기 누르면 잠금 말 · 내려받기 없음 */
      let 받음 = false
      A.on('download', () => { 받음 = true })
      await A.locator('button:has-text("🔒 PDF")').click()
      await A.waitForTimeout(800)
      const 글2 = await A.locator('body').innerText()
      봐(글2.includes('PDF 받기는 지금 준비 중입니다') && !받음, `${누구} 잠긴 받기 → 안내만`)
      봐(await 넘침() <= 1, `${누구} 가로 넘침 없음`, await 넘침())
    } else {
      const 글 = await A.locator('body').innerText()
      봐(!글.includes('🔒 지금은 준비 중입니다') && 글.includes('① 공사 · 사람') && 글.includes('② 제출 대상 판정'), `${누구} 적는 칸 보임 · 잠금 안내 없음`)
      await A.locator('button:has-text("예시(가상 공사)로 채우기")').click()
      await A.waitForSelector('svg.sg-page', { timeout: 60000 })
      await A.waitForFunction(() => /미리보기 · 받기\s*— (\d+)쪽/.test(document.body.innerText) && +document.body.innerText.match(/미리보기 · 받기\s*— (\d+)쪽/)[1] >= 300, null, { timeout: 60000 }).catch(() => {})
      const n = await 쪽수()
      봐(n >= 300, `${누구} 예시로 채움 → ${n}쪽`, n)
      봐((await A.locator('label:has-text("공사명") input').first().inputValue()) === '가상 한빛 복합문화센터 신축공사', `${누구} 칸에 예시 공사명`)
      봐(/✅ 제출 대상 — 제1호 가목 · 제1호 나목 · 제1호 다목 · 제6호/.test(await A.locator('body').innerText()), `${누구} 제출 대상 판정 줄`)
      /* 작성대상 끄기 — «해체 작업» 을 끄면 쪽이 줄어듦 */
      await A.locator('.sp-gong label:has-text("해체 작업") input[type=checkbox]').first().uncheck()
      await A.waitForFunction((전) => { const m = document.body.innerText.match(/미리보기 · 받기\s*— (\d+)쪽/); return m && +m[1] < 전 }, n, { timeout: 30000 }).catch(() => {})
      const n2 = await 쪽수()
      봐(n2 < n, `${누구} 작성대상 «해체 작업» 끄기 → ${n} → ${n2}쪽`, n2)
      await A.locator('.sp-gong label:has-text("해체 작업") input[type=checkbox]').first().check()
      await A.waitForTimeout(1600)
      /* 공사명을 바꾸면 표지가 바뀜 */
      await A.locator('label:has-text("공사명") input').first().fill('가상 시험 고침 공사')
      await A.waitForTimeout(1600)
      await A.locator('.sg-pager select').selectOption('0')
      await A.waitForTimeout(400)
      봐((await A.locator('svg.sg-page').innerHTML()).includes('가상 시험 고침 공사'), `${누구} 고친 공사명이 표지에`)
      /* 그림 넣기 — «회의 사진» 자리 */
      await A.locator('summary:has-text("도면 · 사진 · 서류 사본 넣기")').click()
      await A.locator('.sp-up select').selectOption('회의사진')
      await A.locator('.sp-up input[type=file]').setInputFiles({ name: '시험_회의.png', mimeType: 'image/png', buffer: PNG })
      await A.waitForFunction(() => document.body.innerText.includes('시험_회의.png →'), null, { timeout: 30000 }).catch(() => {})
      봐((await A.locator('body').innerText()).includes('시험_회의.png →'), `${누구} 그림 넣음 말`)
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
      const [받기] = await Promise.all([A.waitForEvent('download', { timeout: 240000 }), A.locator('.sg-dl button:has-text("⬇ PDF")').click()])
      const 이름 = 받기.suggestedFilename()
      const fs = await import('node:fs')
      const 머 = fs.readFileSync(await 받기.path()).subarray(0, 5).toString()
      봐(/유해위험방지계획서\.pdf$/.test(이름) && 머 === '%PDF-', `${누구} PDF 받기(${이름})`, 이름 + ' ' + 머)
      봐(await 넘침() <= 1, `${누구} 가로 넘침 없음`, await 넘침())
    }
    봐(오류.length === 0, `${누구} 화면 오류 없음`, 오류.join(' | '))
    await 판.close()
  }
}
/* 안전관리계획서 화면에서 이 화면으로 가는 길 */
{
  const 판 = await 브.newContext({ viewport: { width: 1280, height: 900 }, locale: 'ko-KR' })
  await 판.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  await 판.route(/firebaseio\.com|googleapis\.com/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await 판.addInitScript(() => { try { localStorage.clear(); localStorage.setItem('kcm_op', '1'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) {} })
  const A = await 판.newPage()
  await A.goto(주소 + '/tools/anjeon', { waitUntil: 'domcontentloaded' })
  await A.waitForSelector('h1:has-text("안전관리계획서 한 벌")', { timeout: 30000 })
  await A.locator('button:has-text("예시(가상 공사)로 채우기")').click()
  await A.waitForSelector('a[href="/tools/yuhae"]', { timeout: 60000 }).catch(() => {})
  봐(await A.locator('a[href="/tools/yuhae"]').count() >= 1, '안전관리계획서 화면 → «유해위험방지계획서 한 벌» 링크')
  await 판.close()
}
await 브.close()
console.log(`\n${bad ? '✗' : '✓'} 통과 ${ok} · 실패 ${bad}`)
process.exit(bad ? 1 : 0)
