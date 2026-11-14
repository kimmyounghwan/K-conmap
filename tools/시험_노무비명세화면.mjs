// 🧪 G681 — 일용노무비 지급명세서 «한 장 표» 화면(/tools/nomubi-myeongse) — PC 1280 · 폰 390
//   화면 빌드를 얹은 뒤  B=http://127.0.0.1:4702 node tools/시험_노무비명세화면.mjs [PC|폰|모두]
//   ① 예시 ② 종이(12명 한 쪽 · 합계) ③ 셈 = lib(노무비 계산기와 같은 셈) ④ 4대보험 이 달만 넣기/빼기 ⑤ 사람 더하기 · 글 꼴
//   ⑥ 저장에 주민번호 · 계좌 맨 글 없음(잠근 글만) ⑦ 새로고침 뒤 기기 열쇠로 다시 열림 · 종이에 다 나옴(주민 · 전화 · 주소 · 은행 · 계좌)
//   ⑧ 그림 PDF(A4 가로 · 글자 층 없음) · 🖨 인쇄(그림) ⑨ 13명 = 두 쪽 ⑩ 열쇠를 잃으면 알림 · 가린 주민번호 ⑪ 다음 달 · 빼기 · 되돌리기 · 처음부터
//   ⑫ 폰 넘침 · 글칸 16px · 날 단추 크기 ⑬ 어두운 화면에서도 종이는 흰 바탕 ⑭ 화면 오류 0
//   (클라우드 화면 시험 — pdfinfo · pdftotext · pdftoppm 을 씀 · PC 올리기 시험엔 넣지 않음)
import { createRequire } from 'module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
const require = createRequire(process.env.PW || '/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 뿌리 = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const L = await import(pathToFileURL(path.join(뿌리, 'web', 'src', 'lib', '노무비명세.js')).href)
const { 원, 이번달, 달더하기 } = await import(pathToFileURL(path.join(뿌리, 'web', 'src', 'lib', 'nomubi.js')).href)
const 주소 = process.env.B || 'http://127.0.0.1:4702'
const 기기들 = (process.argv[2] || '모두') === '모두' ? ['PC', '폰'] : [process.argv[2]]
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log(c ? '  ✓' : '  ✗', m, c ? '' : String(typeof 더 === 'string' ? 더 : JSON.stringify(더)).slice(0, 600)) }
const 임시 = fs.mkdtempSync(path.join(os.tmpdir(), 'kcm_g681_'))
const ym = 이번달()
const 다음 = 달더하기(ym, 1)
const 달글 = (m) => `${m.slice(0, 4)}년 ${Number(m.slice(5, 7))}월`
const 브 = await chromium.launch({ args: ['--use-gl=swiftshader'] })

for (const 기기 of 기기들) {
  console.log('■ ' + 기기)
  const 폰 = 기기 === '폰'
  const c = await 브.newContext({ viewport: 폰 ? { width: 390, height: 844 } : { width: 1280, height: 900 }, locale: 'ko-KR', isMobile: 폰, hasTouch: 폰, acceptDownloads: true })
  await c.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs|firebaseio|kakaocdn|coupangcdn|coupang\.com/, (r) => r.fulfill({ status: 200, body: '' }))
  await c.addInitScript(() => {
    localStorage.setItem('kcm_notice_seen', '2026-10-필독'); try { sessionStorage.setItem('kcm_notice_seen', '2026-10-업체') } catch (e) {}
    window.__인쇄 = 0; window.print = () => { window.__인쇄++ }
    /* 받은 파일 이름 — 이 시험 상자의 헤드리스 크롬은 한글 이름을 «download» 로 바꿔 내놓음(실제 브라우저는 그대로) → 붙인 <a download> 이름을 따로 적어 둠(파일주기는 dispatchEvent 라 click 덧씌움으로는 못 잡음) */
    new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => { if (n && n.tagName === 'A' && n.download) (window.__받은이름 = window.__받은이름 || []).push(n.download) }))).observe(document, { childList: true, subtree: true })
  })
  const p = await c.newPage(); const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 300)))
  const 열기 = async () => { await p.goto(주소 + '/tools/nomubi-myeongse', { waitUntil: 'domcontentloaded' }); await p.waitForSelector('.wrap.ms', { timeout: 30000 }); await p.waitForTimeout(1500) }
  const 글 = () => p.evaluate(() => document.body.innerText)
  const 카드수 = () => p.locator('.ms-사람').count()
  const 저장글 = () => p.evaluate(() => localStorage.getItem('kcm_nomubi_ms1') || '')
  await 열기()
  봐(/일용노무비 지급명세서/.test(await p.locator('h1').first().innerText()), `${기기} 화면이 뜸 — 제목`)
  봐(await p.locator('.wrap.ms.그림만인쇄').count() === 1 && await p.locator('.kcm-인쇄안내').count() === 1, `${기기} Ctrl+P 막이(그림만인쇄 · 인쇄 안내 한 줄)`)
  봐(!/무료|클로드/.test(await p.locator('.wrap.ms').innerText()), `${기기} 화면 글에 «무료» · «클로드» 없음`)

  /* ① 예시 */
  await p.getByRole('button', { name: '✍ 예시 채우기' }).click(); await p.waitForTimeout(1500)
  봐(await 카드수() === 6, `${기기} 예시 — 사람 6명`, await 카드수())
  const 예st = L.예시(ym), N예 = L.셈(예st, ym)
  const 합글 = await p.locator('.ms-합줄').innerText()
  봐(합글.includes(원(N예.합계.보수)) && 합글.includes(원(N예.합계.합)) && 합글.includes(원(N예.합계.차인)), `${기기} 예시 합 — 노무비 ${원(N예.합계.보수)} · 공제 ${원(N예.합계.합)} · 차감 ${원(N예.합계.차인)} (lib 과 같음)`, 합글)
  const 첫셈 = await p.locator('.ms-사람').nth(0).locator('.ms-셈줄').innerText()
  봐(첫셈.includes(원(N예.줄[0].최종.차인)), `${기기} 1번 차감 지급액 = lib(${원(N예.줄[0].최종.차인)})`, 첫셈)
  const 넷 = await p.locator('.ms-사람').nth(3).locator('.ms-대상').allInnerTexts()
  봐(넷.join(' ') === '연금 ✕ 건강 ✕ 고용 ✕', `${기기} 4번(만 67세) — 연금 ✕ · 고용 ✕ 저절로`, 넷)

  /* ② 종이 미리 보기 */
  const 쪽 = p.locator('.ms-미리 .ms-쪽')
  봐(await 쪽.count() === 1, `${기기} 종이 한 쪽(6명)`)
  봐(await 쪽.locator('tbody tr').count() === L.한쪽사람 * 2 + 2, `${기기} 종이 줄 = 12명 × 2줄 + 합계 2줄(빈 줄까지 — 캡처처럼)`, await 쪽.locator('tbody tr').count())
  const 종이글 = await 쪽.first().innerText()
  봐(/일용노무비지급명세서 \( \d\d 월\)/.test(종이글) && 종이글.includes(L.기간(ym).처음) && 종이글.includes(L.기간(ym).끝), `${기기} 종이 머리 — 제목 ( 월) · 기간`)
  봐(['상 호', '공 사 명', '주민등록번호', '전화번호', '주 소', '근 로 일 수', '노무비', '차 감', '공 제 내 역', '소득세', '주민세', '고용보험', '국민연금', '건강보험', '요양보험', '은행', '계좌번호', '합 계'].every((w) => 종이글.includes(w)), `${기기} 종이 칸 이름 — 캡처와 같음`)
  봐(종이글.includes(L.돈(N예.합계.차인)) && await 쪽.locator('td.ms-노랑').innerText() === L.돈(N예.합계.차인), `${기기} 합계 차감 지급액(노란 칸) = lib`)

  /* ③ 4대보험 이 달만 빼기 · 다시 */
  const 연 = p.locator('.ms-사람').nth(0).locator('.ms-대상').first()
  await 연.click(); await p.waitForTimeout(400)
  const 뺀st = JSON.parse(await 저장글())
  const 뺀N = L.셈(뺀st, ym)
  봐((await 연.innerText()) === '연금 ✕' && 뺀N.줄[0].최종.np === 0 && (await p.locator('.ms-사람').nth(0).locator('.ms-셈줄').innerText()).includes(원(뺀N.줄[0].최종.차인)), `${기기} 연금 단추 → 이 달만 뺌(차감 ${원(뺀N.줄[0].최종.차인)})`)
  await 연.click(); await p.waitForTimeout(400)
  봐((await 연.innerText()) === '연금 ✓' && (await p.locator('.ms-사람').nth(0).locator('.ms-셈줄').innerText()).includes(원(N예.줄[0].최종.차인)), `${기기} 한 번 더 누르면 처음대로`)

  /* ④ 사람 더하기 · 글 꼴 · 근로일 */
  await p.getByRole('button', { name: '＋ 사람 더하기' }).click(); await p.waitForTimeout(500)
  봐(await 카드수() === 7, `${기기} 사람 더하기 → 7명`)
  const 새 = p.locator('.ms-사람').nth(6)
  봐(await p.evaluate(() => document.activeElement && document.activeElement.classList.contains('ms-이름')), `${기기} 새 줄 성명 칸에 바로 커서`)
  await 새.locator('.ms-이름').fill('시험사람')
  await 새.locator('.ms-직종').fill('보통인부')
  await 새.locator('.ms-단가').fill('200000')
  await 새.getByLabel('7번 주민등록번호').fill('8501011234567')
  await 새.getByLabel('7번 전화번호').fill('01098765432')
  await 새.getByLabel('7번 주소').fill('가나시 시험동 1-2')
  await 새.getByLabel('7번 은행').fill('농협')
  await 새.getByLabel('7번 계좌번호').fill('302-9999-8888-77')
  봐(await 새.locator('.ms-단가').inputValue() === '200,000', `${기기} 일당 — 200,000 (천 단위 쉼표)`)
  봐(await 새.getByLabel('7번 주민등록번호').inputValue() === '850101-1234567', `${기기} 주민번호 — 850101-1234567`)
  봐(await 새.getByLabel('7번 전화번호').inputValue() === '010-9876-5432', `${기기} 전화 — 010-9876-5432`)
  for (const d of [3, 4, 5]) await 새.locator(`.ms-날단추[aria-label^="${d}일 "]`).click()
  await 새.locator('.ms-날단추[aria-label^="5일 "]').click()   // 1.0 → 0.5
  await p.waitForTimeout(700)
  const 새셈 = await 새.locator('.ms-셈줄').innerText()
  봐(새셈.includes('500,000') && /총공수 2\.5/.test(새셈), `${기기} 근로일 3 · 4 · 5(반) → 총공수 2.5 · 노무비 500,000`, 새셈)
  if (!폰) {
    const [t15, t16] = await Promise.all([새.locator('.ms-날단추').nth(14).boundingBox(), 새.locator('.ms-날단추').nth(15).boundingBox()])
    봐(t16.y > t15.y + 10 && Math.abs(t16.x - (await 새.locator('.ms-날단추').nth(0).boundingBox()).x) < 2, `PC 근로일 단추 — 종이처럼 1~15 · 16~31 두 줄`)
  }

  /* ⑤ 저장 — 주민번호 · 계좌 맨 글 없음 */
  await p.waitForTimeout(800)
  const 저 = await 저장글()
  봐(!저.includes('1234567') && !저.includes('9999-8888') && 저.includes('"rf":"850101-1"') && /"x":"v1\./.test(저), `${기기} 이 기기 저장에 주민번호 뒷자리 · 계좌 맨 글 없음(앞 7자리 · 잠근 글만)`, 저.slice(0, 200))
  봐(저.includes('010-9876-5432') && 저.includes('가나시 시험동 1-2') && 저.includes('"k":"농협"'), `${기기} 전화 · 주소 · 은행은 저장`)

  /* ⑥ 새로고침 — 기기 열쇠로 다시 열림 · 종이에 다 나옴 */
  await 열기()
  const 새2 = p.locator('.ms-사람').nth(6)
  봐(await 새2.getByLabel('7번 주민등록번호').inputValue() === '850101-1234567' && await 새2.getByLabel('7번 계좌번호').inputValue() === '302-9999-8888-77', `${기기} 새로고침 뒤 주민번호 · 계좌가 다시 열림(이 기기 열쇠)`)
  const 종이2 = await p.locator('.ms-미리 .ms-쪽').first().innerText()
  봐(['850101-1234567', '010-9876-5432', '가나시 시험동 1-2', '농협', '302-9999-8888-77', '시험사람', '보통인부', '200,000', '500,000'].every((w) => 종이2.includes(w)), `${기기} 종이에 주민번호 · 전화 · 주소 · 은행 · 계좌 · 일당 · 노무비 모두 나옴`)
  const 줄7 = p.locator('.ms-미리 .ms-쪽 tbody tr').nth(12)
  봐((await 줄7.locator('td.ms-날').nth(2).innerText()) === '1.0' && (await 줄7.locator('td.ms-날').nth(4).innerText()) === '0.5', `${기기} 종이 근로일 칸 — 3일 1.0 · 5일 0.5`)

  /* ⑦ 그림 PDF · 인쇄 */
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 90000 }), p.getByRole('button', { name: /PDF 저장/ }).first().click()])
  const 파 = path.join(임시, `${기기}_1.pdf`); await dl.saveAs(파)
  const 정보 = execFileSync('pdfinfo', [파]).toString()
  봐(/^%PDF/.test(fs.readFileSync(파).subarray(0, 5).toString()) && /Pages:\s+1\b/.test(정보) && /841\.89 x 595\.28/.test(정보), `${기기} PDF — 1쪽 · A4 가로`, 정보.split('\n').filter((x) => /Pages|size/.test(x)).join(' '))
  봐(execFileSync('pdftotext', [파, '-']).toString().trim() === '', `${기기} PDF 글자 층 없음(그림 — 엑셀로 안 바뀜)`)
  const 받은이름 = (await p.evaluate(() => (window.__받은이름 || []).slice(-1)[0])) || dl.suggestedFilename()
  봐(받은이름 === `일용노무비지급명세서_${예st.site}_${ym}.pdf`, `${기기} 파일 이름 — ${받은이름}`)
  execFileSync('pdftoppm', ['-r', '40', '-png', 파, path.join(임시, `${기기}_1`)])
  const 그림 = fs.readdirSync(임시).find((f) => f.startsWith(`${기기}_1`) && f.endsWith('.png'))
  봐(!!그림 && fs.statSync(path.join(임시, 그림)).size > 8000, `${기기} PDF 그림이 빈 쪽 아님`, 그림)
  await p.getByRole('button', { name: '🖨 인쇄' }).first().click()
  await p.waitForFunction(() => window.__인쇄 > 0, null, { timeout: 60000 }).catch(() => {})
  봐(await p.evaluate(() => window.__인쇄) >= 1 && await p.locator('#kcm-그림인쇄 img').count() === 1, `${기기} 🖨 인쇄 — 그림 한 장으로 인쇄 창`, await p.evaluate(() => window.__인쇄))

  /* ⑧ 다음 달 · 빼기 · 되돌리기 */
  await p.getByRole('button', { name: '다음 달' }).click(); await p.waitForTimeout(500)
  봐((await p.locator('.ms-달').innerText()) === 달글(다음) && await 카드수() === 7 && /· 0명/.test(await p.locator('.ms-합줄').innerText()), `${기기} 다음 달 — 명단 7명 그대로 · 근로일 0`)
  await p.getByRole('button', { name: /PDF 저장/ }).first().click(); await p.waitForTimeout(400)
  봐(/일한 날이 있는 사람이 없습니다/.test(await 글()), `${기기} 일한 사람이 없으면 PDF 대신 알림`)
  await p.getByRole('button', { name: '이전 달' }).click(); await p.waitForTimeout(400)
  await p.locator('.ms-사람').nth(6).locator('.ms-빼기').click(); await p.waitForTimeout(400)
  봐(await 카드수() === 6 && /되돌리기/.test(await p.locator('.ms-되돌림').innerText()), `${기기} ✕ 빼기 → 6명 · 되돌리기 줄`)
  await p.getByRole('button', { name: '↩ 되돌리기' }).click(); await p.waitForTimeout(500)
  봐(await 카드수() === 7 && (await p.locator('.ms-사람').nth(6).getByLabel('7번 주민등록번호').inputValue()) === '850101-1234567', `${기기} 되돌리기 → 7명 · 주민번호 그대로`)

  if (!폰) {
    /* ⑨ 13명 = 두 쪽 */
    const st13 = L.예시(ym)
    for (let i = 0; i < 7; i++) {
      const id = 'x' + i
      st13.P.push({ id, n: '더함' + i, j: '보통인부', w: 150000 + i * 10000, nx: '', r: [[ym, null]], rf: '800101-1', t: '', a: '', k: '', x: '' })
      st13.A[ym][id] = { d: { '02': 1, '03': 1, '04': 1 } }
    }
    await p.evaluate((v) => localStorage.setItem('kcm_nomubi_ms1', JSON.stringify(v)), st13)
    await 열기()
    const 쪽13 = p.locator('.ms-미리 .ms-쪽')
    봐(await 쪽13.count() === 2 && (await 쪽13.nth(0).innerText()).includes('1 / 2') && !(await 쪽13.nth(0).innerText()).includes('합 계') && (await 쪽13.nth(1).innerText()).includes('합 계'), 'PC 13명 — 두 쪽(합계는 끝 쪽) · 쪽 번호')
    봐((await 쪽13.nth(1).locator('tbody tr').first().innerText()).startsWith('13'), 'PC 둘째 쪽 순번 13부터')
    const [dl2] = await Promise.all([p.waitForEvent('download', { timeout: 90000 }), p.getByRole('button', { name: /PDF 저장/ }).first().click()])
    const 파2 = path.join(임시, 'PC_13.pdf'); await dl2.saveAs(파2)
    봐(/Pages:\s+2\b/.test(execFileSync('pdfinfo', [파2]).toString()), 'PC 13명 PDF — 2쪽')

    /* ⑩ 기기 열쇠를 잃으면 */
    await p.evaluate((v) => localStorage.setItem('kcm_nomubi_ms1', v), 저)
    await p.evaluate(() => new Promise((r) => { const q = indexedDB.deleteDatabase('kcm_nomubi_ms'); q.onsuccess = q.onerror = q.onblocked = () => r() }))
    await 열기()
    const 일곱 = p.locator('.ms-사람').nth(6)
    봐(/열쇠가 지워져/.test(await 일곱.innerText()) && (await 일곱.getByLabel('7번 주민등록번호').inputValue()) === '' && /850101-1\*{6}/.test(await 일곱.getByLabel('7번 주민등록번호').getAttribute('placeholder')), 'PC 기기 열쇠를 잃으면 — 알림 · 다시 적기(가린 앞자리 보임)')
    봐((await p.locator('.ms-미리 .ms-쪽').first().innerText()).includes('850101-1******'), 'PC 열쇠를 잃은 사람 — 종이는 앞 7자리 + ******')
    봐(/7명은 주민번호 뒷자리/.test(await 글()), 'PC 위 칸에도 «7명은 다시 적어야» 알림(예시 6명 + 시험사람 — 모두 옛 열쇠로 잠갔음)')

    /* ⑪ 처음부터 · 되돌리기 */
    await p.getByRole('button', { name: '처음부터 (모두 지우기)' }).click()
    await p.locator('.ms-물음').getByRole('button', { name: '지우기' }).click(); await p.waitForTimeout(400)
    봐(await 카드수() === 0 && await p.getByRole('button', { name: '✍ 예시 채우기' }).count() === 1, 'PC 처음부터 → 0명 · 예시 단추')
    await p.getByRole('button', { name: '↩ 되돌리기' }).click(); await p.waitForTimeout(400)
    봐(await 카드수() === 7, 'PC 처음부터 되돌리기 → 7명')

    /* ⑫ 어두운 화면 — 종이는 흰 바탕 · 검은 글 */
    await p.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark')); await p.waitForTimeout(300)
    const 색 = await p.evaluate(() => { const td = document.querySelector('.ms-미리 .ms-쪽 td'); const s = getComputedStyle(td); return [s.backgroundColor, s.color, getComputedStyle(document.querySelector('.ms-미리 .ms-쪽')).backgroundColor] })
    봐(색[0] === 'rgb(255, 255, 255)' && 색[1] === 'rgb(0, 0, 0)' && 색[2] === 'rgb(255, 255, 255)', 'PC 어두운 화면에서도 종이는 흰 바탕 · 검은 글', 색)
  } else {
    /* ⑬ 폰 — 넘침 · 글칸 16px · 날 단추 */
    봐(await p.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 1, '폰 390 가로 넘침 없음')
    const 글크기 = await p.evaluate(() => [...document.querySelectorAll('.ms-in')].map((e) => parseFloat(getComputedStyle(e).fontSize)))
    봐(글크기.length > 10 && 글크기.every((v) => v >= 16), '폰 글칸 16px 이상(아이폰이 화면을 키우지 않게)', 글크기.slice(0, 5))
    const 단 = await p.locator('.ms-사람').first().locator('.ms-날단추').first().boundingBox()
    봐(단.height >= 40 && 단.width >= 36, `폰 날 단추 ${Math.round(단.width)} × ${Math.round(단.height)}px(손가락)`)
    await p.setViewportSize({ width: 320, height: 700 }); await p.waitForTimeout(400)
    봐(await p.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 1, '폰 320 가로 넘침 없음')
    await p.getByRole('button', { name: '🔍 크게 보기' }).click(); await p.waitForTimeout(300)
    봐(await p.evaluate(() => { const el = document.querySelector('.ms-미리'); return el.scrollWidth > el.clientWidth + 100 }) && await p.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 1, '폰 «크게 보기» — 종이만 옆으로 밀림(쪽 전체는 안 넘침)')
  }
  봐(!오류.length, `${기기} 화면 오류 없음`, 오류)
  await c.close()
}
await 브.close()
console.log(bad ? `✗ ${ok} 맞음 · ${bad} 틀림 · ${임시}` : `✓ 모두 맞음(${ok}) · ${임시}`)
process.exit(bad ? 1 : 0)
