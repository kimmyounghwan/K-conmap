/**
 * 🤝 G659 공사 연결 · 서류 작성 대행 — 띠(공사연결띠.jsx) · 문의(contact.html?k=cn) 화면 시험 (2026-11-12)
 *   node tools/시험_공사연결화면.mjs [http://127.0.0.1:4659]   (vite build → /tmp/g10/srv.mjs 로 띄운 판 — /contact → contact.html · LANG=C.UTF-8)
 *   소장님 「전국으로 하자」 · 「전국 공사 연결 및 설계변경, 안전관리계획서, 등 모든 서류 작성 대행 최저가로」 · 「견본 제공 후 최저가로 작성」 · 「색을 다르게 해서 잘 보이게」
 *
 *   ① 모든 손님(지역 상관없이) — 모든 탭(바로투찰 · 1순위 · 공고 · 도구 · 서식 · 내역서 · 적산 · 마이컨맵 · 맵톡 · 자격증 · 용역 · 물품 …) · 관리자 화면까지(G662)에 띠 · 로봇(HeadlessChrome)엔 없음
 *   ② 띠 글(전국 공사 연결 · 모든 서류 작성 대행 · 설계변경 · 안전관리계획서 등 · 견본 먼저, 최저가로) · «문의 남기기» → /contact?k=cn ·
 *      색(진초록 · 흰 글 · 흰 단추 — 옅은 색으로 되돌아가면 걸림) · 쿠팡 맨 위 줄 다음 · 씀-앞 앞 · 폰 넘침 0
 *   ③ G662 닫기(✕) 없음 — 예전에 닫아 둔 값(kcm.cn.hide = 오늘)이 있어도 보임(소장님 「내 밥 줄인데, 항상 보이게」)
 *   ⑥ G662 작은 띠 — 내려서 큰 띠가 머리줄 밑으로 지나가면 머리줄 바로 아래 한 줄(늘 보임 · 34px · --cn-h) · 올리면 들어감 · 다른 쪽도
 *   ⑦ G662 정적 쪽(소개 · 개인정보 · 약관 · 문의 · 광고 문의 · ShareOne 설명서) 맨 위 한 줄(sticky) · 상담 쪽 자신엔 없음 · 로봇엔 없음
 *   ④ 문의(/contact?k=cn) — 제목 · 안내(견본 먼저 · 최저가 · 먼저 여쭘) · 무슨 일 미리 · 필요한 것 두 묶음(공사 연결 5 · 서류 작성 5 · 하나만) ·
 *      공고번호 · 사이트 오류 안내 숨김 · 연락처가 «자세히» 위 · 연락처 없이 보내면 알림 · 보내면 문의함(quotes) want «서류 작성 — 설계변경» ·
 *      보냈다는 말 · 자동 브라우저는 셈 안 감
 *   ⑤ 다른 문의는 그대로 — /contact(사이트 문의) · ?k=ad&w=a(광고 문의)
 *   인터넷 안 부름(파이어베이스 · 광고 · 애널리틱스 막음 · quotes 보내기는 가로채서 봄).
 *   📐 G693 (11-15 «도면 · 건설서류 작성대행») — ② 큰 띠 «📐 도면 · 📄 건설서류» · ⑥-2 작은 띠가 폭 320 ~ 1280(+ 글꼴 10 % 넓힘)에서 안 잘림 ·
 *      ④ 문의 세 묶음(도면 작성대행 8) · ?s= 도면 갈래 미리 고름 · ?t=도면 · 숨은 셈(고름 · 접수 묶음) · ⑨ 도면 도구 쪽 끝 한 줄(도면대행줄 — 쪽 · 글 · 고리 · 씀 밖 · 다른 쪽엔 없음)
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
    ok(`② / 띠 «${글}»`, /전국 공사 연결 · 📐 도면 · 📄 건설서류 작성대행/.test(글) && /시공상세도 · 준공도면 · 설계변경 도면 · 안전관리계획서 · 유해위험방지계획서 등 — 견본 먼저 보시고 최저가로 맡기세요/.test(글) && /상담 · 견적 받기/.test(글))
    ok(`② «상담 · 견적 받기» → ${href}`, href === '/contact?k=cn')
    const 색 = await p.evaluate(() => { const a = document.querySelector('.noti-band.cn'); if (!a) return null; const g = getComputedStyle(a); const t = getComputedStyle(a.querySelector('.noti-go b')); const s = getComputedStyle(a.querySelector('.noti-see')); return { 바탕: g.backgroundImage, 글: t.color, 단추: s.backgroundColor } })
    ok('② 띠 색 — 진초록 바탕 · 흰 글 · 흰 단추', !!색 && /linear-gradient/.test(색.바탕) && /rgb\(4, 120, 87\)/.test(색.바탕) && 색.글 === 'rgb(255, 255, 255)' && 색.단추 === 'rgb(255, 255, 255)', 색)
    ok('② 띠는 쿠팡 맨 위 줄 다음 · 씀-앞 앞(도구 써 본 횟수 밖)', await p.evaluate(() => { const a = document.querySelector('.noti-band.cn'), s = document.getElementById('씀-앞'), c = document.querySelector('aside[data-cpg-at="위"]')   /* G663 — 카드 줄(aside.cpc) · 자료를 못 받으면 예전 배너(aside.cpg) */; return !!a && !!s && !!c && !!(a.compareDocumentPosition(s) & Node.DOCUMENT_POSITION_FOLLOWING) && !!(c.compareDocumentPosition(a) & Node.DOCUMENT_POSITION_FOLLOWING) }))
    ok(`⑧ 넘침 ${await 넘침(p)}px(/)`, (await 넘침(p)) <= 0)
    await p.screenshot({ path: path.join(폴더, `②띠_첫화면${폰 ? '_폰' : ''}.png`), fullPage: false })
    const 쪽들 = {}
    /* 소장님 「모든칸에 넣어 줘」 → 11-13 「모든 페이지에 넣고」 — 모든 탭(도구 · 적산 · 마이컨맵 · 맵톡 · 자격증 · 용역 · 물품도) · 관리자 화면까지(G662) */
    const 탭들 = ['/first', '/live', '/tools', '/tools/risk', '/forms', '/naeyeok', '/jeoksan', '/my', '/qna', '/cert', '/svc', '/goods', '/change', '/safety', '/admin']
    for (const 길 of 탭들) { await 열기(p, 길); 쪽들[길] = await 띠(p).count() }
    ok(`① 쪽마다 ${JSON.stringify(쪽들)} — 모든 탭 · 관리자 화면까지`, 탭들.every((k) => 쪽들[k] === 1), 쪽들)
    await 열기(p, '/first')
    ok(`⑧ 넘침 ${await 넘침(p)}px(/first)`, (await 넘침(p)) <= 0)
    /* ③ G662 「항상 보이게」 — 닫기(✕) 없음 · 예전에 닫아 둔 값(kcm.cn.hide = 오늘)이 있어도 보임 */
    ok('③ 닫기(✕) 단추 없음', (await 띠(p).locator('.noti-x').count()) === 0 && (await p.locator('a.cn-mini .noti-x').count()) === 0)
    await p.evaluate((d) => localStorage.setItem('kcm.cn.hide', d), 오늘)
    await 열기(p, '/'); const 다시 = await 띠(p).count()
    ok(`③ 예전에 닫아 둔 값(kcm.cn.hide=오늘)이 있어도 보임 — 띠 ${다시}`, 다시 === 1)
    /* ⑥ 작은 띠 — 내려서 큰 띠가 머리줄 밑으로 지나가면 머리줄 바로 아래에 한 줄(늘 보임) · 다시 올리면 들어감 */
    const 작은 = () => p.evaluate(() => {
      const m = document.querySelector('a.cn-mini'), h = document.querySelector('.topbar'), r = document.documentElement
      if (!m) return null
      const mr = m.getBoundingClientRect(), hr = h.getBoundingClientRect()
      return { 켬: r.classList.contains('cn-mini-on'), 보임: getComputedStyle(m).display !== 'none', 쪽보임: getComputedStyle(r).display !== 'none' && getComputedStyle(document.body).display !== 'none', 위: Math.round(mr.top), 머리밑: Math.round(hr.bottom), 높이: Math.round(mr.height),
        주소: m.getAttribute('href'), 글: m.innerText.replace(/\s+/g, ' ').trim(), 칸높이: getComputedStyle(r).getPropertyValue('--cn-h').trim(), 여백: getComputedStyle(r).scrollPaddingTop }
    })
    let 작 = await 작은()
    ok('⑥ 맨 위(큰 띠가 보임) — 작은 띠는 숨음', !!작 && !작.켬 && !작.보임 && 작.칸높이 === '' , 작)
    await p.evaluate(() => window.scrollTo(0, 1600)); await 쉬어(500)
    작 = await 작은()
    ok(`⑥ 내리면 — 머리줄 바로 아래 작은 띠(위 ${작 && 작.위} = 머리줄 밑 ${작 && 작.머리밑} · 높이 ${작 && 작.높이})`, !!작 && 작.켬 && 작.보임 && Math.abs(작.위 - 작.머리밑) <= 1 && 작.높이 === 34, 작)
    ok('⑥ 작은 띠가 보여도 쪽(html · body)은 그대로 보임', !!작 && 작.쪽보임, 작)
    ok(`⑥ 작은 띠 글 «${작 && 작.글}» → ${작 && 작.주소}`, !!작 && /공사 연결/.test(작.글) && /도면/.test(작.글) && /서류 작성대행/.test(작.글) && /상담 · 견적/.test(작.글) && 작.주소 === '/contact?k=cn', 작)
    ok(`⑥ 작은 띠 동안 --cn-h ${작 && 작.칸높이} · 바로 가기 여백 ${작 && 작.여백}(머리줄 밑 칸이 안 가려지게)`, !!작 && 작.칸높이 === '34px' && 작.여백 === '34px', 작)
    ok(`⑧ 넘침 ${await 넘침(p)}px(작은 띠 보일 때)`, (await 넘침(p)) <= 0)
    await p.screenshot({ path: path.join(폴더, `⑥작은띠${폰 ? '_폰' : ''}.png`), fullPage: false })
    await p.evaluate(() => window.scrollTo(0, 0)); await 쉬어(400)
    작 = await 작은()
    ok('⑥ 다시 올리면 — 작은 띠 들어감', !!작 && !작.켬 && !작.보임, 작)
    await 열기(p, '/tools'); await p.evaluate(() => window.scrollTo(0, 2000)); await 쉬어(500)
    작 = await 작은()
    ok('⑥ 다른 쪽(/tools)에서도 내리면 작은 띠', !!작 && 작.켬 && 작.보임, 작)
    ok(`② 오류 ${오류.length}`, 오류.length === 0, 오류)
    await ctx.close()
  }
  /* ⑥-2 📐 G693 작은 띠가 폭마다 안 잘림 — 말(공사 연결 · 도면 · 서류 작성대행)이 다 보이고 «…» 없음 · 단추가 화면 안 · 글꼴이 10 % 넓어도(윈도 · 아이폰 글꼴 — G685b)
     좁은 폰은 그림 글자(📐 📄) · «상담 · » · « — 견본 먼저 · 최저가» 를 숨김(styles.css «G693» 경계 380/381 · 440/441 · 480/481 · 560/561 둘레) */
  if (폰) {
    const { ctx, p, 오류 } = await 새판()
    const 폭들 = [320, 340, 360, 375, 380, 381, 390, 400, 402, 412, 414, 430, 440, 441, 460, 480, 481, 520, 560, 561, 640, 768, 1024, 1280]
    const 잘림 = []
    for (const 넓힘 of [false, true]) {
      for (const 폭 of 폭들) {
        await p.setViewportSize({ width: 폭, height: 844 })
        await 열기(p, '/tools')
        if (넓힘) await p.addStyleTag({ content: '.cn-mini-t,.cn-mini-t *,.cn-mini-go,.cn-mini-go *{letter-spacing:.1em !important}' })
        await p.evaluate(() => window.scrollTo(0, 2000)); await 쉬어(450)
        const r = await p.evaluate(() => {
          const t = document.querySelector('.cn-mini-t'), g = document.querySelector('.cn-mini-go'), m = document.querySelector('a.cn-mini')
          if (!t || !g || !m) return null
          const gr = g.getBoundingClientRect(), mr = m.getBoundingClientRect()
          return { 켬: document.documentElement.classList.contains('cn-mini-on'), 넘: Math.round(t.scrollWidth - t.clientWidth), 단추끝: Math.round(gr.right), 띠끝: Math.round(mr.right), 폭: innerWidth, 글: t.innerText.replace(/\s+/g, ' ').trim(), 단추: g.innerText.trim(), 옆넘침: document.documentElement.scrollWidth - innerWidth }
        })
        const 맞음 = !!r && r.켬 && r.넘 <= 0 && r.단추끝 <= r.폭 && r.옆넘침 <= 0 && /공사 연결/.test(r.글) && /도면/.test(r.글) && /서류 작성대행/.test(r.글) && /견적 ▸/.test(r.단추)
        if (!맞음) 잘림.push({ 폭, 넓힘, ...(r || {}) })
        if (!넓힘 && [320, 390, 1280].includes(폭)) await p.screenshot({ path: path.join(폴더, `⑥작은띠_${폭}.png`), clip: { x: 0, y: 0, width: 폭, height: 140 } })
      }
    }
    ok(`⑥-2 작은 띠 ${폭들.length}폭 × (그대로 · 글꼴 10 % 넓힘) — 말이 다 보이고 안 잘림 · 단추 화면 안`, 잘림.length === 0, 잘림)
    await p.setViewportSize({ width: 390, height: 844 }); await 열기(p, '/tools'); await p.evaluate(() => window.scrollTo(0, 2000)); await 쉬어(450)
    const 넓 = await p.evaluate(() => [...document.querySelectorAll('.cn-mini-e')].map((e) => getComputedStyle(e).display))
    await p.setViewportSize({ width: 768, height: 844 }); await 열기(p, '/tools'); await p.evaluate(() => window.scrollTo(0, 2000)); await 쉬어(450)
    const 큰 = await p.evaluate(() => ({ 그림: [...document.querySelectorAll('.cn-mini-e')].map((e) => getComputedStyle(e).display), 글: document.querySelector('.cn-mini-t').innerText.replace(/\s+/g, ' ').trim() }))
    ok(`⑥-2 그림 글자 — 390 숨김 ${JSON.stringify(넓)} · 768 보임 «${큰.글}»`, 넓.length === 2 && 넓.every((d) => d === 'none') && 큰.그림.every((d) => d !== 'none') && /🤝 공사 연결 · 📐 도면 · 📄 서류 작성대행/.test(큰.글), { 넓, 큰 })
    ok(`⑥-2 오류 ${오류.length}`, 오류.length === 0, 오류)
    await ctx.close()
  }
  /* ① 로봇엔 없음 */
  {
    const { ctx, p } = await 새판('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/130.0.0.0 Safari/537.36')
    await 열기(p, '/'); const 로봇 = await 띠(p).count()
    ok(`① 로봇(HeadlessChrome) — 띠 ${로봇} · 작은 띠 ${await p.locator('a.cn-mini').count()}`, 로봇 === 0 && (await p.locator('a.cn-mini').count()) === 0)
    await p.goto(BASE + '/about', { waitUntil: 'domcontentloaded' }); await 쉬어(400)
    ok('① 로봇 — 정적 쪽(소개)에도 없음', (await p.locator('#cn-band').count()) === 0)
    await ctx.close()
  }

  /* ④ 문의 쪽 */
  {
    const { ctx, p, 오류, 보냄 } = await 새판()
    await p.goto(BASE + '/contact?k=cn', { waitUntil: 'domcontentloaded' }); await 쉬어(600)
    const 봄 = await p.evaluate(() => ({
      t: document.title, h1: document.querySelector('h1').textContent, h1꼴: getComputedStyle(document.querySelector('h1')).wordBreak, h2: document.querySelector('.card h2').textContent,
      work: document.getElementById('work').value,
      묶음: [...document.querySelectorAll('.cn-grp')].map((g) => [g.querySelector('.cn-gname').textContent, [...g.querySelectorAll('.cn-pick button')].map((x) => x.textContent)]),
      공고번호: getComputedStyle(document.getElementById('no').closest('.row')).display,
      둘째: getComputedStyle(document.querySelectorAll('.card')[1]).display,
      연락처먼저: !!(document.getElementById('phone').compareDocumentPosition(document.getElementById('memo')) & Node.DOCUMENT_POSITION_FOLLOWING),
      말: document.querySelector('.card p.small').textContent,
    }))
    ok(`④ 제목 «${봄.h1}» · «${봄.h2}» · 창 «${봄.t}»`, 봄.h1 === '🤝 공사 연결 · 📐 도면 · 📄 서류 작성대행' && 봄.h2 === '상담 · 견적 받기 — 1분이면 됩니다' && 봄.t === '공사 연결 · 도면 · 서류 작성대행 상담 | K-건설맵')
    ok(`④ 무슨 일 «${봄.work}» · 필요한 것 ${JSON.stringify(봄.묶음)}`, 봄.work === '🤝 공사 연결 · 📐 도면 · 📄 서류 작성대행 상담' &&
      JSON.stringify(봄.묶음) === JSON.stringify([['공사 연결', ['시공', '하도급', '장비', '인력', '자재']], ['도면 작성대행', ['시공상세도', '준공도면', '설계변경 도면', '가설 · 안전시설 배치도', '교통처리 계획도', '피난 안내도', '캐드 정리(DWG · PDF)', '그 밖 도면']], ['서류 작성대행', ['설계변경', '안전관리계획서', '유해위험방지계획서', '내역서', '기성', '그 밖 서류']]]))
    ok(`④ 제목 낱말째 줄바꿈(${봄.h1꼴}) — 폰에서 «작성 / 대행» 으로 안 갈림(G693)`, 봄.h1꼴 === 'keep-all')
    ok(`④ 공고번호 칸 ${봄.공고번호} · 사이트 오류 안내 ${봄.둘째} · 연락처가 «자세히» 위 ${봄.연락처먼저}`, 봄.공고번호 === 'none' && 봄.둘째 === 'none' && 봄.연락처먼저)
    ok('④ 안내 — 전국 · 맞는 곳 연락 · 설계변경 · 안전관리계획서 등 모든 서류 · 견본 먼저 · 최저가 · 먼저 여쭘',
      /전국 어디든/.test(봄.말) && /맞는 곳을 찾아 연락드립니다/.test(봄.말) && /설계변경 · 안전관리계획서 · 유해위험방지계획서 · 내역서 · 기성 등 건설 서류를 작성대행합니다/.test(봄.말) && /시공상세도 · 준공도면 · 설계변경 도면 · 가설 · 안전시설 배치도 · 교통처리 계획도 · 피난 안내도 · 캐드 정리\(DWG · PDF\) 등 시공 · 공무 도면을 그려 드립니다/.test(봄.말) && /도면 · 서류 모두 견본을 먼저 보여 드리고, 마음에 드시면 최저가로 진행합니다/.test(봄.말) && /먼저 여쭙니다/.test(봄.말))
    await p.locator('.cn-pick button[data-v="공사 연결 — 장비"]').click(); await 쉬어(120)
    await p.locator('.cn-pick button[data-v="서류 작성대행 — 설계변경"]').click(); await 쉬어(150)   /* 📐 G693 «설계변경 도면» 과 겹치지 않게 글 그대로 고름 */
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
    ok(`④ 보냄 → quotes want «${몸.want}» · work «${몸.work}» · phone ${몸.phone ? '있음' : '없음'}`, !!q && 몸.want === '서류 작성대행 — 설계변경' && 몸.work === '🤝 공사 연결 · 📐 도면 · 📄 서류 작성대행 상담' && 몸.phone === '010-0000-0000' && /설계변경 서류/.test(몸.memo || ''))
    ok(`④ 보낸 뒤 «${알림2}» · 칸 숨김`, /하루 안에 적어 주신 연락처로 연락드리겠습니다/.test(알림2) && !(await p.locator('#f').isVisible()))
    ok(`④ 자동 브라우저는 셈 안 감(dl 보냄 ${보냄.filter((x) => /\/dl\//.test(x.u)).length})`, 보냄.filter((x) => /\/dl\//.test(x.u)).length === 0)
    ok(`⑧ 넘침 ${await 넘침(p)}px(문의)`, (await 넘침(p)) <= 0)
    /* 안 고르고 보내면 «공사 연결 · 서류 작성» */
    await p.goto(BASE + '/contact?k=cn', { waitUntil: 'domcontentloaded' }); await 쉬어(500)
    await p.fill('#phone', '010-0000-0000'); await p.locator('#go').click(); await 쉬어(800)
    const q2 = 보냄.filter((x) => /quotes\.json$/.test(x.u))[1]; const 몸2 = q2 ? JSON.parse(q2.b) : {}
    ok(`④ 안 고르고 보내면 want «${몸2.want}»`, 몸2.want === '공사 연결 · 도면 · 서류 작성대행')
    /* 📐 G693 도면 묶음 — 고르면 want «도면 작성대행 — 시공상세도» · ?s= 도면 갈래 미리 고름 · ?t=도면 은 «자세히» 한 줄만(안 고름) */
    await p.goto(BASE + '/contact?k=cn', { waitUntil: 'domcontentloaded' }); await 쉬어(500)
    await p.locator('.cn-pick button[data-v="도면 작성대행 — 시공상세도"]').click(); await 쉬어(120)
    await p.fill('#phone', '010-0000-0000'); await p.locator('#go').click(); await 쉬어(800)
    const q3 = 보냄.filter((x) => /quotes\.json$/.test(x.u))[2]; const 몸3 = q3 ? JSON.parse(q3.b) : {}
    ok(`④ 도면 «시공상세도» 고르고 보내면 want «${몸3.want}»`, 몸3.want === '도면 작성대행 — 시공상세도')
    const 미리 = async (q) => { await p.goto(BASE + '/contact' + q, { waitUntil: 'domcontentloaded' }); await 쉬어(450); return p.evaluate(() => ({ 눌림: [...document.querySelectorAll('.cn-pick button[aria-pressed="true"]')].map((b) => b.getAttribute('data-v')), 자세히: document.getElementById('memo').value })) }
    let m = await 미리('?k=cn&s=' + encodeURIComponent('캐드 정리(DWG · PDF)') + '&t=' + encodeURIComponent('캐드 도면 고치기'))
    ok(`④ ?s=캐드 정리 → ${JSON.stringify(m)}`, JSON.stringify(m.눌림) === JSON.stringify(['도면 작성대행 — 캐드 정리(DWG · PDF)']) && m.자세히 === '«캐드 도면 고치기» 작성대행 · 견적 문의합니다.', m)
    m = await 미리('?k=cn&s=' + encodeURIComponent('설계변경'))
    ok(`④ ?s=설계변경 → 서류 묶음 «설계변경» 하나(«설계변경 도면» 아님) ${JSON.stringify(m.눌림)}`, JSON.stringify(m.눌림) === JSON.stringify(['서류 작성대행 — 설계변경']), m)
    m = await 미리('?k=cn&s=' + encodeURIComponent('장비'))
    ok(`④ ?s=장비(공사 연결 묶음)는 안 고름 ${JSON.stringify(m.눌림)}`, m.눌림.length === 0, m)
    m = await 미리('?k=cn&t=' + encodeURIComponent('도면'))
    ok(`④ ?t=도면 → 안 고름 · «자세히» «${m.자세히}»`, m.눌림.length === 0 && m.자세히 === '«도면» 작성대행 · 견적 문의합니다.', m)
    ok(`⑧ 넘침 ${await 넘침(p)}px(문의 · 세 묶음)`, (await 넘침(p)) <= 0)
    await p.screenshot({ path: path.join(폴더, `④문의_세묶음${폰 ? '_폰' : '_PC'}.png`), fullPage: true })
    ok(`④ 오류 ${오류.length}`, 오류.length === 0, 오류)
    await ctx.close()
  }
  /* ④-2 📐 G693 숨은 셈 — 사람 브라우저(자동 표시 없음)에서: 묶음을 처음 누르면 |공사연결|고름-<묶음>(한 번) · 보내면 |공사연결|접수 + |공사연결|접수-<묶음> */
  {
    const { ctx, p, 오류, 보냄 } = await 새판()
    await ctx.addInitScript(() => { try { Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false }) } catch (e) { /* 없음 */ } })
    await p.goto(BASE + '/contact?k=cn', { waitUntil: 'domcontentloaded' }); await 쉬어(500)
    await p.locator('.cn-pick button[data-v="도면 작성대행 — 준공도면"]').click(); await 쉬어(300)
    await p.locator('.cn-pick button[data-v="도면 작성대행 — 시공상세도"]').click(); await 쉬어(300)
    await p.locator('.cn-pick button[data-v="서류 작성대행 — 기성"]').click(); await 쉬어(300)
    await p.locator('.cn-pick button[data-v="도면 작성대행 — 피난 안내도"]').click(); await 쉬어(300)
    await p.fill('#phone', '010-0000-0000'); await p.locator('#go').click(); await 쉬어(1200)
    const 셈들 = 보냄.filter((x) => x.m === 'PUT' && /\/dl\/p\//.test(x.u)).map((x) => decodeURIComponent(x.u.replace(/^.*\/dl\/p\//, '').replace(/\.json$/, '')))
    const 바람 = ['|공사연결|고름-도면', '|공사연결|고름-서류', '|공사연결|접수', '|공사연결|접수-도면']
    ok(`④-2 숨은 셈 ${JSON.stringify(셈들)}`, JSON.stringify([...셈들].sort()) === JSON.stringify([...바람].sort()), 셈들)
    ok(`④-2 오류 ${오류.length}`, 오류.length === 0, 오류)
    await ctx.close()
  }
  /* ⑨ 📐 G693 도면 도구 쪽 끝 한 줄(도면대행줄) — 그 쪽들에만 · 글 · 고리 · 씀 밖(씀-뒤 다음) · 넘침 0 · 잠근 캐드 고치기 · 컬러 평면도 · 다른 쪽엔 없음 */
  {
    const { ctx, p, 오류 } = await 새판()
    const 줄 = () => p.evaluate(() => { const d = document.querySelector('.dm-line'); if (!d) return null; const a = d.querySelector('a.dm-go'), s = document.getElementById('씀-뒤'); return { 글: d.innerText.replace(/\s+/g, ' ').trim(), 고리: a && a.getAttribute('href'), 씀밖: !!s && !!(s.compareDocumentPosition(d) & Node.DOCUMENT_POSITION_FOLLOWING), 단추: a && a.innerText.trim() } })
    const 있음 = {}, 없음 = {}
    for (const 길 of ['/cad', '/tools/dxfpdf', '/tools/dwgdxf', '/tools/dxf3d', '/tools/sajincad', '/tools/tojeok', '/jeoksan', '/jeoksan/golgo', '/jeoksan/magam', '/jeoksan/auto', '/jeoksan/model', '/jeoksan/bim']) { await 열기(p, 길); 있음[길] = await 줄() }
    for (const 길 of ['/', '/first', '/tools', '/tools/cadfix', '/tools/colorplan', '/jeoksan/run', '/jeoksan/fill', '/forms']) { await 열기(p, 길); 없음[길] = await 줄() }
    const 맞 = (r) => !!r && r.글.startsWith('📐 도면 작성 · 캐드 대행이 필요하시면 — 시공상세도 · 준공도면 · 설계변경 도면 · 캐드 정리까지 K-건설맵이 그려 드립니다(견본 먼저 · 최저가).') &&
      r.고리 === '/contact?k=cn&t=%EB%8F%84%EB%A9%B4' && r.단추 === '📐 도면 작성대행 문의 ▸' && r.씀밖
    ok(`⑨ 도면 도구 쪽 ${Object.keys(있음).length}곳 끝 한 줄 · 고리 · 씀 밖`, Object.values(있음).every(맞), Object.fromEntries(Object.entries(있음).filter(([, r]) => !맞(r))))
    ok(`⑨ 다른 쪽 · 잠근 도구엔 없음 ${JSON.stringify(없음)}`, Object.values(없음).every((r) => r === null), 없음)
    await 열기(p, '/tools/dxfpdf')
    ok(`⑧ 넘침 ${await 넘침(p)}px(도면 줄 쪽)`, (await 넘침(p)) <= 0)
    await p.evaluate(() => { const d = document.querySelector('.dm-line'); if (d) d.scrollIntoView({ block: 'center' }) }); await 쉬어(300)
    await p.screenshot({ path: path.join(폴더, `⑨도면줄${폰 ? '_폰' : '_PC'}.png`), fullPage: false })
    await p.emulateMedia({ media: 'print' }); const 찍힘 = await p.evaluate(() => { const d = document.querySelector('.dm-line'); return d ? getComputedStyle(d).display : 'none' }); await p.emulateMedia({ media: 'screen' })
    ok(`⑨ 인쇄엔 안 나옴(${찍힘})`, 찍힘 === 'none')
    ok(`⑨ 오류 ${오류.length}`, 오류.length === 0, 오류)
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

  /* ⑦ G662 정적 쪽(앱 밖 .html) — 맨 위 한 줄(늘 보임 · sticky) · 상담 쪽 자신엔 없음 */
  {
    const { ctx, p, 오류 } = await 새판()
    const 정적 = {}
    for (const 길 of ['/about', '/privacy', '/terms', '/contact', '/contact?k=ad&w=a', '/shareone/사용설명서.html', '/contact?k=cn']) {
      await p.goto(BASE + encodeURI(길), { waitUntil: 'domcontentloaded' }); await 쉬어(400)
      정적[길] = await p.evaluate(() => { const a = document.getElementById('cn-band'); if (!a) return 0; const g = getComputedStyle(a); return { 주소: a.getAttribute('href'), 붙음: g.position, 첫: document.body.firstElementChild === a, 글: a.innerText.replace(/\s+/g, ' ').trim().slice(0, 60) } })
    }
    const 달림 = ['/about', '/privacy', '/terms', '/contact', '/contact?k=ad&w=a', '/shareone/사용설명서.html']
    ok(`⑦ 정적 쪽 ${달림.length}곳 맨 위 한 줄(sticky) → /contact?k=cn`, 달림.every((k) => 정적[k] && 정적[k].주소 === '/contact?k=cn' && 정적[k].붙음 === 'sticky' && 정적[k].첫 && /공사 연결 · 📐 도면 · 📄 건설서류 작성대행/.test(정적[k].글) && /상담 · 견적/.test(정적[k].글)), 정적)
    ok('⑦ 상담 쪽(/contact?k=cn) 자신엔 없음', 정적['/contact?k=cn'] === 0, 정적['/contact?k=cn'])
    await p.goto(BASE + '/terms', { waitUntil: 'domcontentloaded' }); await 쉬어(300)
    await p.evaluate(() => window.scrollTo(0, 3000)); await 쉬어(300)
    ok('⑦ 정적 쪽 내려도 맨 위에 보임', await p.evaluate(() => { const a = document.getElementById('cn-band'); return !!a && Math.round(a.getBoundingClientRect().top) === 0 }))
    ok(`⑧ 넘침 ${await 넘침(p)}px(정적 쪽)`, (await 넘침(p)) <= 0)
    ok(`⑦ 오류 ${오류.length}`, 오류.length === 0, 오류)
    await ctx.close()
  }
}
await b.close()
console.log(`\n${n - bad}/${n} 통과`)
process.exit(bad ? 1 : 0)
