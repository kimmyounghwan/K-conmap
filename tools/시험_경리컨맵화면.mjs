// 🗃 경리컨맵 1단계 화면 시험 — 회사 전체 한눈에 · 거래처 원장(현장 손익 장부 자료) (2026-11-14)
//   빌드를 띄운 뒤  B=http://127.0.0.1:4705 node tools/시험_경리컨맵화면.mjs
//   ① 손님(폰 390 · PC 1280): 🔒 문의 띠 · 작성대행 문의(경리컨맵) · 🧪 예시 장부(보기만 — 숫자 = lib · 원장 · 적는 칸 없음 · html 보기만 표시) · 넘침 0 · 오류 0
//   ② 소장님 브라우저(kcm_op · 손익 장부에 가상 줄 넷): 잠금 띠 없음 · 한눈에 숫자 · 원장(결제일 없음 표시) · 거래처 정보 🔐(저장엔 잠근 글만 · 새로고침 뒤 풀림 · 끝자리 셈 경고)
//      · 손익 장부를 고치고 돌아오면(창 focus) 숫자가 바로 바뀜 · 손익 장부 저장은 안 건드림
import { createRequire } from 'module'
const require = createRequire(process.env.PW || '/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 경 = await import('../web/src/lib/경리컨맵.js')
const 주소 = process.env.B || 'http://127.0.0.1:4705'
let 맞 = 0, 틀 = 0
const 봐 = (c, m, 더 = '') => { if (c) 맞++; else 틀++; console.log(c ? '  ✓' : '  ✗', m, c ? '' : JSON.stringify(더).slice(0, 500)) }
const 쉼 = (p, ms) => p.waitForTimeout(ms)
const 원 = (n) => Math.round(n).toLocaleString('ko-KR')
const 두자 = (n) => String(n).padStart(2, '0')
const 지금 = new Date(), 이달 = `${지금.getFullYear()}-${두자(지금.getMonth() + 1)}`
const E = 경.예시(), 예달 = 경.처음달(E, 이달), H = 경.한눈에(E, 예달)
const 브 = await chromium.launch()

for (const w of [390, 1280]) {
  const 폰 = w < 600, 판 = 폰 ? '폰 390' : 'PC 1280'
  console.log('① 손님 — ' + 판)
  {
    const c = await 브.newContext({ viewport: { width: w, height: 900 }, isMobile: 폰, hasTouch: 폰, locale: 'ko-KR' })
    await c.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs|firebaseio|identitytoolkit|securetoken|kakaocdn|coupang/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
    await c.addInitScript(() => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체') } catch (e) {} })
    const p = await c.newPage(); const 오류 = []
    p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
    await p.goto(주소 + '/tools/gyeongri', { waitUntil: 'domcontentloaded' }); await 쉼(p, 2500)
    const 처음 = await p.evaluate(() => ({ 띠: !!document.querySelector('.sg-lock') && /문의해 주세요/.test(document.querySelector('.sg-lock').textContent), 문의: (document.querySelector('.sg-lock a[href^="/contact?k=cn"]') || {}).getAttribute?.('href') || '', 소개: !!document.querySelector('.gr-start'), 탭: document.querySelectorAll('.gr-tabs [role=tab]').length, 제목: (document.querySelector('h1') || {}).textContent }))
    봐(처음.띠 && 처음.문의.includes('t=' + encodeURIComponent('경리컨맵')) && 처음.소개 && 처음.탭 === 0 && /경리컨맵/.test(처음.제목), '잠금 띠 «🔒 문의해 주세요» · 작성대행 문의(t=경리컨맵) · 소개 · 탭 없음', 처음)
    await p.locator('button', { hasText: '🧪 예시 장부 보기' }).first().click(); await 쉼(p, 800)
    const 예 = await p.evaluate(() => ({ 보기만: document.documentElement.classList.contains('kcm-보기만'), 판: !!document.querySelector('.kcm-예시판'), 탭: [...document.querySelectorAll('.gr-tabs [role=tab]')].map((b) => b.textContent.trim()), 칸: document.querySelectorAll('.gr-판 input, .gr-판 select, .gr-판 textarea').length, 적기: !![...document.querySelectorAll('a')].find((a) => /손익 장부에서 적기/.test(a.textContent)), 달: (document.querySelector('.gr-달 b') || {}).textContent, 타일: [...document.querySelectorAll('.gr-tiles > div')].map((d) => d.textContent.replace(/\s+/g, ' ').trim()) }))
    봐(예.보기만 && 예.판 && 예.탭.join() === '📊 한눈에,🤝 거래처 원장' && 예.칸 === 0 && !예.적기, '🧪 예시: 보기만 표시 · 예시 판 · 탭 둘 · 적는 칸 0 · «적기» 단추 없음', 예)
    const 달글 = `${예달.slice(0, 4)}년 ${Number(예달.slice(5, 7))}월`, 월 = Number(예달.slice(5, 7)) + '월'
    봐(예.달 === 달글 && 예.타일.length === 4 && 예.타일[0].includes(월 + ' 들어온 돈') && 예.타일[0].includes(원(H.들어옴)) && 예.타일[1].includes(원(H.나감)) && 예.타일[2].includes(원(H.받을)) && 예.타일[3].includes(원(H.줄돈)),
      `한눈에 ${달글} — 들어온 ${원(H.들어옴)} · 나간 ${원(H.나감)} · 받을 ${원(H.받을)} · 줄 ${원(H.줄돈)}(= lib)`, 예)
    const 현장표 = await p.evaluate(() => { const t = [...document.querySelectorAll('.gr-t')][0]; return t ? [...t.querySelectorAll('tbody tr')].map((tr) => tr.textContent.replace(/\s+/g, ' ').trim()) : [] })
    봐(현장표.length === 2 && /48\.2%/.test(현장표[0]) && /32\.3%/.test(현장표[1]) && 현장표[0].includes(원(51320000)), '현장마다 — 가나 48.2% · 손익 51,320,000 · 다라 32.3%', 현장표)
    const 거래표 = await p.evaluate(() => { const t = [...document.querySelectorAll('.gr-t')][1]; return t ? [...t.querySelectorAll('tbody tr')].map((tr) => tr.textContent.replace(/\s+/g, ' ').trim()) : [] })
    const 남은곳 = 경.거래처들(E.R).filter((x) => x.받을 || x.줄돈)
    봐(거래표.length === 남은곳.length && 거래표[0].startsWith(남은곳[0].이름), `거래처 남은 돈 ${남은곳.length}곳 · 첫 줄 ${남은곳[0].이름}`, 거래표)
    /* 누르면 원장 — 가상흄관 */
    await p.evaluate(() => { const t = [...document.querySelectorAll('.gr-t')][1]; [...t.querySelectorAll('tbody tr')].find((tr) => /가상흄관/.test(tr.textContent))?.click() }); await 쉼(p, 600)
    const 흄 = await p.evaluate(() => ({ 탭: (document.querySelector('.gr-tabs [aria-selected=true]') || {}).textContent, 고른: (document.querySelector('.gr-chips .chip.on') || {}).textContent, 정보: (document.querySelector('.gr-kv') || {}).textContent, 타일: [...document.querySelectorAll('.gr-tiles > div')].map((d) => d.textContent.replace(/\s+/g, ' ').trim()), 줄: [...document.querySelectorAll('.gr-t tbody tr')].map((tr) => tr.textContent.replace(/\s+/g, ' ').trim()) }))
    봐(/거래처 원장/.test(흄.탭) && /가상흄관/.test(흄.고른) && /박가상/.test(흄.정보) && /\*\*\*-\*\*-\*\*\*\*\*/.test(흄.정보) && !/\d{3}-\d{2}-\d{5}/.test(흄.정보), '거래처 줄 누름 → 원장 탭 · 가상흄관 · 정보(지어낸 · 사업자번호 가림)', 흄)
    봐(흄.타일[1].includes('27,350,000') && 흄.줄.length === 2 && 흄.줄[0].includes('42,350,000') && 흄.줄[1].includes('15,000,000') && 흄.줄[1].includes('27,350,000'), '가상흄관 원장 — 매입 42,350,000 → 지급 15,000,000 → 줄 돈 27,350,000', 흄)
    await p.evaluate(() => [...document.querySelectorAll('.gr-chips .chip')].find((b) => /○○시/.test(b.textContent))?.click()); await 쉼(p, 400)
    const 시 = await p.evaluate(() => ({ 타일: [...document.querySelectorAll('.gr-tiles > div')].map((d) => d.textContent.replace(/\s+/g, ' ').trim()), 첫: (document.querySelector('.gr-t tbody tr') || {}).textContent }))
    봐(시.타일[0].includes('29,929,412') && /선급/.test(시.첫) && /미리 받음/.test(시.첫), '○○시 — 받을 돈 29,929,412 · 첫 줄 선급(미리 받음)', 시)
    const 넘 = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    봐(넘 <= 1, '가로 넘침 없음', 넘)
    /* 🩹 11-14 올리기 전 캡처에서 찾음 — 폰에서 현장 이름이 한 글자씩 세로로 · 원장 금액 · 줄 돈 칸이 화면 밖(옆으로 밀어야 보임) → 폰은 줄마다 쌓음 */
    await p.evaluate(() => [...document.querySelectorAll('.gr-tabs [role=tab]')].find((b) => /한눈에/.test(b.textContent))?.click()); await 쉼(p, 400)
    const 꼴1 = await p.evaluate(() => {
      const 표 = [...document.querySelectorAll('.gr-t')], 칸 = (q) => [...document.querySelectorAll(q)].filter((td) => td.offsetParent !== null)
      return { 머리: 표.map((t) => getComputedStyle(t.querySelector('thead')).display), 안밀림: [...document.querySelectorAll('.gr-wrap')].every((w) => w.scrollWidth <= w.clientWidth + 1),
        현장이름폭: 칸('.gr-t.gr-현장 tbody td:first-child').map((td) => Math.round(td.getBoundingClientRect().width)),
        밖칸: 칸('.gr-t td').filter((td) => td.getBoundingClientRect().right > window.innerWidth + 1).length,
        좁은글칸: 칸('.gr-t td').filter((td) => td.textContent.trim().length > 4 && td.getBoundingClientRect().width < 56).map((td) => td.textContent.trim().slice(0, 12)),
        빈돈칸보임: 칸('.gr-t.gr-곳 td.n').filter((td) => td.textContent.trim() === '–').length, 칸이름: 칸('.gr-t.gr-곳 td.n').slice(0, 2).map((td) => getComputedStyle(td, '::before').content) }
    })
    if (폰) 봐(꼴1.머리.every((d) => d === 'none') && 꼴1.안밀림 && 꼴1.현장이름폭.length === 2 && 꼴1.현장이름폭.every((x) => x >= 250) && 꼴1.밖칸 === 0 && 꼴1.좁은글칸.length === 0 && 꼴1.빈돈칸보임 === 0 && 꼴1.칸이름.every((x) => /받을 돈|줄 돈/.test(x)),
      '폰 — 표를 줄마다 쌓음(머리 숨김 · 옆으로 안 밀림 · 현장 이름 한 줄 폭 · 화면 밖 칸 0 · 좁은 글 칸 0 · 「–」 돈 칸 숨김 · 칸 앞 «받을 돈 · 줄 돈»)', 꼴1)
    else 봐(꼴1.머리.every((d) => d === 'table-header-group') && 꼴1.밖칸 === 0 && 꼴1.좁은글칸.length === 0, 'PC — 표 그대로(머리 · 칸) · 화면 밖 칸 0 · 좁은 글 칸 0', 꼴1)
    await p.evaluate(() => [...document.querySelectorAll('.gr-tabs [role=tab]')].find((b) => /원장/.test(b.textContent))?.click()); await 쉼(p, 400)
    const 꼴2 = await p.evaluate(() => { const 줄 = [...document.querySelectorAll('.gr-t.gr-장 tbody tr')]; const r = (td) => td.getBoundingClientRect()
      return { 줄: 줄.length, 금액안: 줄.every((tr) => r(tr.querySelector('td.gr-금')).right <= window.innerWidth), 남은칸: 줄.map((tr) => [...tr.querySelectorAll('td.gr-남')].filter((td) => td.offsetParent !== null).length),
        금액줄: 줄.slice(0, 1).map((tr) => Math.abs(r(tr.querySelector('td.gr-금')).top - r(tr.querySelector('td.gr-날')).top) < 6) } })
    if (폰) 봐(꼴2.줄 === 8 && 꼴2.금액안 && 꼴2.남은칸.every((k) => k === 1) && 꼴2.금액줄[0], '폰 원장 — 은행 앱 꼴(날 · 갈래 … 금액 한 줄 · 남은 돈은 그 줄 쪽 하나만 · 금액이 화면 안)', 꼴2)
    else 봐(꼴2.줄 === 8 && 꼴2.금액안 && 꼴2.남은칸.every((k) => k === 2), 'PC 원장 — 일곱 칸 그대로(받을 · 줄 돈 남음 둘 다)', 꼴2)
    봐(오류.length === 0, '쪽 오류 0', 오류)
    await c.close()
  }

  console.log('② 소장님 브라우저 — ' + 판)
  {
    const c = await 브.newContext({ viewport: { width: w, height: 900 }, isMobile: 폰, hasTouch: 폰, locale: 'ko-KR' })
    await c.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs|firebaseio|identitytoolkit|securetoken|kakaocdn|coupang/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
    const 장부 = { co: '가상건설(시험)', 현장: [{ id: 'h1', n: '가상 현장 A', o: '가상시', amt: 100000000, s: '', e: '' }], R: [
      { id: 'r1', h: 'h1', d: 이달 + '-02', k: 'S', c: '기성금', v: '가상시', t: '1회 기성', sup: 10000000, tax: 1000000, ev: '세금계산서', pd: 이달 + '-10', pa: 11000000 },
      { id: 'r2', h: 'h1', d: 이달 + '-03', k: 'P', c: '자재비', v: '가상 레미콘', t: '레미콘', sup: 2000000, tax: 200000, ev: '세금계산서', pd: 이달 + '-05', pa: 1000000 },
      { id: 'r3', h: 'h1', d: 이달 + '-04', k: 'P', c: '장비비', v: '가상 중기', t: '굴착기', sup: 3000000, tax: 300000, ev: '세금계산서', pd: '', pa: 0 },
      { id: 'r4', h: 'h1', d: 이달 + '-06', k: 'P', c: '자재비', v: '가상 레미콘', t: '모래(카드)', sup: 500000, tax: 50000, ev: '카드', pd: '', pa: 550000 },
    ] }
    await c.addInitScript((s) => { try { if (!sessionStorage.getItem('심음')) { localStorage.setItem('kcm_op', '1'); localStorage.setItem('kcm_sonik1', s); localStorage.removeItem('kcm_gyeongri1'); sessionStorage.setItem('심음', '1') } localStorage.setItem('kcm_notice_seen', '2026-10-필독') } catch (e) {} }, JSON.stringify(장부))
    const p = await c.newPage(); const 오류 = []
    p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
    await p.goto(주소 + '/tools/gyeongri', { waitUntil: 'domcontentloaded' }); await 쉼(p, 2500)
    const 첫 = await p.evaluate(() => ({ 띠: !!document.querySelector('.sg-lock'), 탭: [...document.querySelectorAll('.gr-tabs [role=tab]')].map((b) => b.textContent.trim()), 적기: ([...document.querySelectorAll('a')].find((a) => /손익 장부에서 적기/.test(a.textContent)) || {}).getAttribute?.('href'), 보기만: document.documentElement.classList.contains('kcm-보기만'), 달: (document.querySelector('.gr-달 b') || {}).textContent, 타일: [...document.querySelectorAll('.gr-tiles > div')].map((d) => d.textContent.replace(/\s+/g, ' ').trim()) }))
    봐(!첫.띠 && 첫.탭.length === 2 && 첫.적기 === '/tools/sonik' && !첫.보기만, '잠금 띠 없음 · 탭 둘 · «✏️ 손익 장부에서 적기» → /tools/sonik · 보기만 아님', 첫)
    /* 이 달 — 들어온 11,000,000(r1 결제) · 나간 1,000,000(r2 결제 — r4 는 결제일이 없어 달별엔 안 셈 · 손익 장부와 같음) · 받을 0 · 줄 1,200,000 + 3,300,000 = 4,500,000 */
    봐(첫.달 === `${이달.slice(0, 4)}년 ${Number(이달.slice(5, 7))}월` && 첫.타일[0].includes('11,000,000') && 첫.타일[1].includes('1,000,000') && 첫.타일[2].includes('0') && 첫.타일[3].includes('4,500,000'), '한눈에 — 이 달 들어온 11,000,000 · 나간 1,000,000 · 받을 0 · 줄 4,500,000', 첫)
    /* 현장 A — 기성률 = 기성 10,000,000 ÷ 도급 100,000,000 = 10% · 손익(공급가) = 10,000,000 − (2,000,000 + 3,000,000 + 500,000) = 4,500,000 */
    const 현 = await p.evaluate(() => [...((document.querySelector('.gr-t tbody tr') || {}).querySelectorAll?.('td') || [])].map((td) => td.textContent.trim()))
    봐(현.length === 7 && 현[3] === '10%' && 현[6] === '4,500,000' && 현[5] === '4,500,000' && 현[4] === '–', '현장 A — 기성률 10% · 받을 – · 줄 4,500,000 · 손익 4,500,000(매출 1천만 − 매입 550만)', 현)
    await p.evaluate(() => [...document.querySelectorAll('.gr-tabs [role=tab]')].find((b) => /원장/.test(b.textContent))?.click()); await 쉼(p, 400)
    const 칩 = await p.evaluate(() => [...document.querySelectorAll('.gr-chips .chip')].map((b) => b.textContent.trim()))
    봐(칩[0].startsWith('가상 중기') && 칩.length === 3, '원장 거래처 차례 — 남은 돈 큰 «가상 중기» 먼저 · 셋', 칩)
    await p.evaluate(() => [...document.querySelectorAll('.gr-chips .chip')].find((b) => /가상 레미콘/.test(b.textContent))?.click()); await 쉼(p, 400)
    const 레 = await p.evaluate(() => ({ 줄: [...document.querySelectorAll('.gr-t tbody tr')].map((tr) => tr.textContent.replace(/\s+/g, ' ').trim()), 타일: [...document.querySelectorAll('.gr-tiles > div')].map((d) => d.textContent.replace(/\s+/g, ' ').trim()) }))
    봐(레.줄.length === 4 && /결제일 없음/.test(레.줄[3]) && 레.줄[3].includes('1,200,000') && 레.타일[1].includes('1,200,000'), '가상 레미콘 원장 넷 — 끝 줄 «결제일 없음»(장부 날짜로) · 줄 돈 1,200,000', 레)
    /* 거래처 정보 — 🔐 사업자번호 · 계좌 */
    await p.evaluate(() => { const d = document.querySelector('.gr-info'); if (d) d.open = true }); await 쉼(p, 200)
    const 적 = async (글, v) => { await p.evaluate(([글, v]) => { const l = [...document.querySelectorAll('.gr-info label')].find((x) => x.textContent.includes(글)); const i = l.querySelector('input'); const 세 = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; 세.call(i, v); i.dispatchEvent(new Event('input', { bubbles: true })) }, [글, v]); await 쉼(p, 250) }
    await 적('대표', '홍가상'); await 적('업종', '레미콘'); await 적('전화', '01000001111'); await 적('사업자등록번호', '1234567890')
    const 경고 = await p.evaluate(() => !!document.querySelector('.gr-info .gr-warn'))
    await 적('사업자등록번호', '1234567891'); await 적('계좌', '301-0000-1234-01'); await 쉼(p, 600)
    const 칸들 = await p.evaluate(() => [...document.querySelectorAll('.gr-info input')].map((i) => i.value))
    const 저장 = await p.evaluate(() => localStorage.getItem('kcm_gyeongri1') || '')
    const 손익 = await p.evaluate(() => localStorage.getItem('kcm_sonik1') || '')
    봐(경고 && 칸들.includes('010-0000-1111') && 칸들.includes('123-45-67891') && !(await p.evaluate(() => !!document.querySelector('.gr-info .gr-warn'))), '정보 적기 — 전화 꼴 · 사업자 꼴 · 끝자리 틀리면 경고 → 맞으면 사라짐', { 경고, 칸들 })
    봐(/"가상 레미콘"/.test(저장) && /홍가상/.test(저장) && /"x":"v1\./.test(저장) && !/67891|1234-01/.test(저장), '저장(kcm_gyeongri1)엔 정보 + 잠근 글만 — 사업자번호 · 계좌 맨 글 없음', 저장.slice(0, 300))
    봐(손익 === JSON.stringify(장부), '손익 장부 저장(kcm_sonik1)은 그대로(읽기만)')
    await p.reload({ waitUntil: 'domcontentloaded' }); await 쉼(p, 2500)
    await p.evaluate(() => [...document.querySelectorAll('.gr-tabs [role=tab]')].find((b) => /원장/.test(b.textContent))?.click()); await 쉼(p, 300)
    await p.evaluate(() => [...document.querySelectorAll('.gr-chips .chip')].find((b) => /가상 레미콘/.test(b.textContent))?.click()); await 쉼(p, 300)
    await p.evaluate(() => { const d = document.querySelector('.gr-info'); if (d) d.open = true }); await 쉼(p, 300)
    const 다시 = await p.evaluate(() => ({ 요약: (document.querySelector('.gr-info summary') || {}).textContent, 칸: [...document.querySelectorAll('.gr-info input')].map((i) => i.value) }))
    봐(다시.칸.includes('123-45-67891') && 다시.칸.includes('301-0000-1234-01') && 다시.칸.includes('홍가상') && /레미콘/.test(다시.요약), '새로고침 뒤 — 이 기기 열쇠로 풀려 사업자번호 · 계좌 그대로', 다시)
    /* 손익 장부에서 한 줄 더 적고 돌아옴(같은 기기 저장 · 창 focus) → 바로 바뀜 */
    await p.evaluate((ym) => { const s = JSON.parse(localStorage.getItem('kcm_sonik1')); s.R.push({ id: 'r5', h: 'h1', d: ym + '-08', k: 'S', c: '기성금', v: '가상시', t: '2회 기성', sup: 20000000, tax: 2000000, ev: '세금계산서', pd: '', pa: 0 }); localStorage.setItem('kcm_sonik1', JSON.stringify(s)); window.dispatchEvent(new Event('focus')) }, 이달)
    await 쉼(p, 400)
    await p.evaluate(() => [...document.querySelectorAll('.gr-tabs [role=tab]')].find((b) => /한눈에/.test(b.textContent))?.click()); await 쉼(p, 400)
    const 바뀜 = await p.evaluate(() => [...document.querySelectorAll('.gr-tiles > div')].map((d) => d.textContent.replace(/\s+/g, ' ').trim()))
    봐(바뀜[2].includes('22,000,000'), '손익 장부를 고치고 돌아오면 바로 — 받을 돈 22,000,000(2회 기성)', 바뀜)
    const 넘 = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    봐(넘 <= 1, '가로 넘침 없음', 넘)
    봐(오류.length === 0, '쪽 오류 0', 오류)
    await c.close()
  }
}
await 브.close()
console.log(`\n${맞} 맞음 · ${틀} 틀림`)
process.exit(틀 ? 1 : 0)
