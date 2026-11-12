/**
 * 🤝 G659 공사 연결 · 서류 작성 대행 — 띠(공사연결띠.jsx) · 문의(contact.html?k=cn) 화면 시험 (2026-11-12)
 *   node tools/시험_공사연결화면.mjs [http://127.0.0.1:4659]   (vite build → /tmp/g10/srv.mjs 로 띄운 판 — /contact → contact.html · LANG=C.UTF-8)
 *   소장님 「전국으로 하자」 · 「전국 공사 연결 및 설계변경, 안전관리계획서, 등 모든 서류 작성 대행 최저가로」 · 「견본 제공 후 최저가로 작성」 · 「색을 다르게 해서 잘 보이게」
 *
 *   ① 모든 손님(지역 상관없이) — 모든 탭(바로투찰 · 1순위 · 공고 · 도구 · 서식 · 내역서 · 적산 · 마이컨맵 · 맵톡 · 자격증 · 용역 · 물품 …)에 띠 · 관리자 · 로봇(HeadlessChrome)엔 없음
 *   ② 띠 글(전국 공사 연결 · 모든 서류 작성 대행 · 설계변경 · 안전관리계획서 등 · 견본 먼저, 최저가로) · «문의 남기기» → /contact?k=cn ·
 *      색(진초록 · 흰 글 · 흰 단추 — 옅은 색으로 되돌아가면 걸림) · 쿠팡 맨 위 줄 다음 · 씀-앞 앞 · 폰 넘침 0
 *   ③ ✕ → 바로 사라지고 새로 열어도 오늘은 안 보임(kcm.cn.hide = 오늘)
 *   ④ 문의(/contact?k=cn) — 제목 · 안내(견본 먼저 · 최저가 · 먼저 여쭘) · 무슨 일 미리 · 필요한 것 두 묶음(공사 연결 5 · 서류 작성 5 · 하나만) ·
 *      공고번호 · 사이트 오류 안내 숨김 · 연락처가 «자세히» 위 · 연락처 없이 보내면 알림 · 보내면 문의함(quotes) want «서류 작성 — 설계변경» ·
 *      보냈다는 말 · 자동 브라우저는 셈 안 감
 *   ⑤ 다른 문의는 그대로 — /contact(사이트 문의) · ?k=ad&w=a(광고 문의)
 *   인터넷 안 부름(파이어베이스 · 광고 · 애널리틱스 막음 · quotes 보내기는 가로채서 봄).
 */
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4659'
const 폴더 = process.env.OUT || '/tmp/g10/g659'
fs.mkdirSync(폴더, { recursive: true })

let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 400))) }
const 쉬어 = (ms) => new Promise((r) => setTimeout(r, ms))
const 오늘 = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10)

const b = await chromium.launch()
const UA폰 = 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
/* 띠는 로봇(머리 없는 브라우저 «HeadlessChrome» 포함)에겐 안 나옴 — PC 도 보통 크롬 UA 로 */
const UAPC = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
for (const [기기, w, h, 폰] of [['PC 1280', 1280, 900, false], ['폰 390', 390, 844, true]]) {
  console.log(`■ ${기기}`)
  const 새판 = async (ua = 폰 ? UA폰 : UAPC) => {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, userAgent: ua })
    await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs|coupang/, (r) => r.fulfill({ status: 200, body: '' }))
    const 보냄 = []
    await ctx.route(/firebaseio\.com|firebasedatabase\.app|identitytoolkit|securetoken/, (r) => {
      const q = r.request()
      if (q.method() !== 'GET') 보냄.push({ m: q.method(), u: q.url().replace(/\?.*$/, ''), b: q.postData() || '' })
      return r.fulfill({ status: 200, contentType: 'application/json', body: q.method() === 'POST' ? '{"name":"-시험"}' : 'null' })
    })
    await ctx.addInitScript(() => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) { /* 없음 */ } })
    const p = await ctx.newPage()
    const 오류 = []
    p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
    return { ctx, p, 오류, 보냄 }
  }
  const 띠 = (p) => p.locator('.noti-band.cn')
  const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  const 열기 = async (p, 길) => { await p.goto(BASE + 길, { waitUntil: 'domcontentloaded' }); await p.waitForSelector('main.shell', { timeout: 20000 }); await 쉬어(1300) }

  /* ① ② ③ 띠 */
  {
    const { ctx, p, 오류 } = await 새판()
    await 열기(p, '/')
    const 글 = (await 띠(p).count()) ? (await 띠(p).innerText()).replace(/\s+/g, ' ').trim() : ''
    const href = (await 띠(p).count()) ? await 띠(p).locator('a.noti-go').getAttribute('href') : ''
    ok(`② / 띠 «${글}»`, /전국 공사 연결 · 📄 건설 서류 무엇이든 작성대행/.test(글) && /설계변경 · 안전관리계획서 · 유해위험방지계획서 등 — 견본 먼저 보시고 최저가로 맡기세요/.test(글) && /상담 · 견적 받기/.test(글))
    ok(`② «상담 · 견적 받기» → ${href}`, href === '/contact?k=cn')
    const 색 = await p.evaluate(() => { const a = document.querySelector('.noti-band.cn'); if (!a) return null; const g = getComputedStyle(a); const t = getComputedStyle(a.querySelector('.noti-go b')); const s = getComputedStyle(a.querySelector('.noti-see')); return { 바탕: g.backgroundImage, 글: t.color, 단추: s.backgroundColor } })
    ok('② 띠 색 — 진초록 바탕 · 흰 글 · 흰 단추', !!색 && /linear-gradient/.test(색.바탕) && /rgb\(4, 120, 87\)/.test(색.바탕) && 색.글 === 'rgb(255, 255, 255)' && 색.단추 === 'rgb(255, 255, 255)', 색)
    ok('② 띠는 쿠팡 맨 위 줄 다음 · 씀-앞 앞(도구 써 본 횟수 밖)', await p.evaluate(() => { const a = document.querySelector('.noti-band.cn'), s = document.getElementById('씀-앞'), c = document.querySelector('aside.cpg[data-cpg-at="위"]'); return !!a && !!s && !!c && !!(a.compareDocumentPosition(s) & Node.DOCUMENT_POSITION_FOLLOWING) && !!(c.compareDocumentPosition(a) & Node.DOCUMENT_POSITION_FOLLOWING) }))
    ok(`⑧ 넘침 ${await 넘침(p)}px(/)`, (await 넘침(p)) <= 0)
    await p.screenshot({ path: path.join(폴더, `②띠_첫화면${폰 ? '_폰' : ''}.png`), fullPage: false })
    const 쪽들 = {}
    /* 소장님 「모든칸에 넣어 줘」 — 모든 탭(도구 · 적산 · 마이컨맵 · 맵톡 · 자격증 · 용역 · 물품도) · 관리자만 뺌 */
    const 탭들 = ['/first', '/live', '/tools', '/tools/risk', '/forms', '/naeyeok', '/jeoksan', '/my', '/qna', '/cert', '/svc', '/goods', '/change', '/safety']
    for (const 길 of [...탭들, '/admin']) { await 열기(p, 길); 쪽들[길] = await 띠(p).count() }
    ok(`① 쪽마다 ${JSON.stringify(쪽들)} — 모든 탭 · 관리자만 없음`, 탭들.every((k) => 쪽들[k] === 1) && 쪽들['/admin'] === 0, 쪽들)
    await 열기(p, '/first')
    ok(`⑧ 넘침 ${await 넘침(p)}px(/first)`, (await 넘침(p)) <= 0)
    await 띠(p).locator('.noti-x').click(); await 쉬어(300)
    const 닫은뒤 = await 띠(p).count()
    const 열쇠 = await p.evaluate(() => localStorage.getItem('kcm.cn.hide'))
    await 열기(p, '/'); const 다시 = await 띠(p).count()
    ok(`③ ✕ → 띠 ${닫은뒤} · 새로 열어도 ${다시} · kcm.cn.hide=${열쇠}`, 닫은뒤 === 0 && 다시 === 0 && 열쇠 === 오늘)
    ok(`② 오류 ${오류.length}`, 오류.length === 0, 오류)
    await ctx.close()
  }
  /* ① 로봇엔 없음 */
  {
    const { ctx, p } = await 새판('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/130.0.0.0 Safari/537.36')
    await 열기(p, '/'); const 로봇 = await 띠(p).count()
    ok(`① 로봇(HeadlessChrome) — 띠 ${로봇}`, 로봇 === 0)
    await ctx.close()
  }

  /* ④ 문의 쪽 */
  {
    const { ctx, p, 오류, 보냄 } = await 새판()
    await p.goto(BASE + '/contact?k=cn', { waitUntil: 'domcontentloaded' }); await 쉬어(600)
    const 봄 = await p.evaluate(() => ({
      t: document.title, h1: document.querySelector('h1').textContent, h2: document.querySelector('.card h2').textContent,
      work: document.getElementById('work').value,
      묶음: [...document.querySelectorAll('.cn-grp')].map((g) => [g.querySelector('.cn-gname').textContent, [...g.querySelectorAll('.cn-pick button')].map((x) => x.textContent)]),
      공고번호: getComputedStyle(document.getElementById('no').closest('.row')).display,
      둘째: getComputedStyle(document.querySelectorAll('.card')[1]).display,
      연락처먼저: !!(document.getElementById('phone').compareDocumentPosition(document.getElementById('memo')) & Node.DOCUMENT_POSITION_FOLLOWING),
      말: document.querySelector('.card p.small').textContent,
    }))
    ok(`④ 제목 «${봄.h1}» · «${봄.h2}» · 창 «${봄.t}»`, 봄.h1 === '🤝 공사 연결 · 📄 서류 작성대행' && 봄.h2 === '상담 · 견적 받기 — 1분이면 됩니다' && 봄.t === '공사 연결 · 서류 작성대행 상담 | K-건설맵')
    ok(`④ 무슨 일 «${봄.work}» · 필요한 것 ${JSON.stringify(봄.묶음)}`, 봄.work === '🤝 공사 연결 · 📄 서류 작성대행 상담' &&
      JSON.stringify(봄.묶음) === JSON.stringify([['공사 연결', ['시공', '하도급', '장비', '인력', '자재']], ['서류 작성대행', ['설계변경', '안전관리계획서', '유해위험방지계획서', '내역서', '기성', '그 밖 서류']]]))
    ok(`④ 공고번호 칸 ${봄.공고번호} · 사이트 오류 안내 ${봄.둘째} · 연락처가 «자세히» 위 ${봄.연락처먼저}`, 봄.공고번호 === 'none' && 봄.둘째 === 'none' && 봄.연락처먼저)
    ok('④ 안내 — 전국 · 맞는 곳 연락 · 설계변경 · 안전관리계획서 등 모든 서류 · 견본 먼저 · 최저가 · 먼저 여쭘',
      /전국 어디든/.test(봄.말) && /맞는 곳을 찾아 연락드립니다/.test(봄.말) && /설계변경 · 안전관리계획서 · 유해위험방지계획서 · 내역서 · 기성 등 건설 서류를 작성대행합니다/.test(봄.말) && /견본을 먼저 보여 드리고, 마음에 드시면 최저가로 진행합니다/.test(봄.말) && /먼저 여쭙니다/.test(봄.말))
    await p.locator('.cn-pick button', { hasText: '장비' }).click(); await 쉬어(120)
    await p.locator('.cn-pick button', { hasText: '설계변경' }).click(); await 쉬어(150)
    const 켜짐 = await p.evaluate(() => [...document.querySelectorAll('.cn-pick button.on')].map((x) => x.textContent))
    ok(`④ 장비 → 설계변경 누름 → 하나만 ${JSON.stringify(켜짐)}`, JSON.stringify(켜짐) === '["설계변경"]')
    await p.fill('#memo', '○○군 ○○면 배수로 정비 — 설계변경 서류 · 다음 주')
    await p.locator('#go').click(); await 쉬어(400)
    const 알림1 = (await p.locator('#msg').innerText()).trim()
    ok(`④ 연락처 없이 보내기 → «${알림1}» · 보낸 것 ${보냄.length}`, /연락드릴 전화번호나 이메일을 적어 주십시오/.test(알림1) && 보냄.length === 0)
    await p.fill('#phone', '010-0000-0000')
    await p.screenshot({ path: path.join(폴더, `④문의${폰 ? '_폰' : '_PC'}.png`), fullPage: 폰 })
    await p.locator('#go').click(); await 쉬어(900)
    const 알림2 = (await p.locator('#msg').innerText()).trim()
    const q = 보냄.find((x) => /quotes\.json$/.test(x.u))
    const 몸 = q ? JSON.parse(q.b) : {}
    ok(`④ 보냄 → quotes want «${몸.want}» · work «${몸.work}» · phone ${몸.phone ? '있음' : '없음'}`, !!q && 몸.want === '서류 작성대행 — 설계변경' && 몸.work === '🤝 공사 연결 · 📄 서류 작성대행 상담' && 몸.phone === '010-0000-0000' && /설계변경 서류/.test(몸.memo || ''))
    ok(`④ 보낸 뒤 «${알림2}» · 칸 숨김`, /하루 안에 적어 주신 연락처로 연락드리겠습니다/.test(알림2) && !(await p.locator('#f').isVisible()))
    ok(`④ 자동 브라우저는 셈 안 감(dl 보냄 ${보냄.filter((x) => /\/dl\//.test(x.u)).length})`, 보냄.filter((x) => /\/dl\//.test(x.u)).length === 0)
    ok(`⑧ 넘침 ${await 넘침(p)}px(문의)`, (await 넘침(p)) <= 0)
    /* 안 고르고 보내면 «공사 연결 · 서류 작성» */
    await p.goto(BASE + '/contact?k=cn', { waitUntil: 'domcontentloaded' }); await 쉬어(500)
    await p.fill('#phone', '010-0000-0000'); await p.locator('#go').click(); await 쉬어(800)
    const q2 = 보냄.filter((x) => /quotes\.json$/.test(x.u))[1]; const 몸2 = q2 ? JSON.parse(q2.b) : {}
    ok(`④ 안 고르고 보내면 want «${몸2.want}»`, 몸2.want === '공사 연결 · 서류 작성대행')
    ok(`④ 오류 ${오류.length}`, 오류.length === 0, 오류)
    await ctx.close()
  }

  /* ⑤ 다른 문의는 그대로 */
  {
    const { ctx, p, 오류, 보냄 } = await 새판()
    await p.goto(BASE + '/contact', { waitUntil: 'domcontentloaded' }); await 쉬어(400)
    const 그대로 = await p.evaluate(() => ({ h1: document.querySelector('h1').textContent, 고름: document.querySelectorAll('.cn-pick').length, 공고번호: getComputedStyle(document.getElementById('no').closest('.row')).display }))
    await p.fill('#work', '시험 — 사이트 문의'); await p.locator('#go').click(); await 쉬어(700)
    const q1 = 보냄.find((x) => /quotes\.json$/.test(x.u)); const 몸1 = q1 ? JSON.parse(q1.b) : {}
    ok(`⑤ 사이트 문의 그대로 — 제목 «${그대로.h1}» · 고르기 ${그대로.고름} · 공고번호 ${그대로.공고번호} · want «${몸1.want}»`, 그대로.h1 === '문의' && 그대로.고름 === 0 && 그대로.공고번호 !== 'none' && 몸1.want === '사이트 문의')
    await p.goto(BASE + '/contact?k=ad&w=a', { waitUntil: 'domcontentloaded' }); await 쉬어(400)
    const 광고 = await p.evaluate(() => ({ work: document.getElementById('work').value, 고름: document.querySelectorAll('.cn-pick').length, h2: document.querySelector('.card h2').textContent }))
    ok(`⑤ 광고 문의 그대로 — «${광고.work}» · «${광고.h2}» · 고르기 ${광고.고름}`, 광고.work === '📣 광고 문의' && 광고.h2 === '📣 광고 문의' && 광고.고름 === 0)
    ok(`⑤ 오류 ${오류.length}`, 오류.length === 0, 오류)
    await ctx.close()
  }
}
await b.close()
console.log(`\n${n - bad}/${n} 통과`)
process.exit(bad ? 1 : 0)
