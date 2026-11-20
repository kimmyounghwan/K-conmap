/**
 * 📱 G661 아이폰 키보드 뒤 «아래 탭이 화면 가운데에 뜸» 바로잡기 시험 (2026-11-13 · lib/아이폰자리.js · styles.css «G661»)
 *   node tools/시험_아이폰자리.mjs [http://127.0.0.1:4661]   (vite build → /tmp/g10/srv.mjs 로 띄운 판)
 *   소장님 11-13 06:25 폰 캡처 「빨리 고쳐 줘」 「갑자기 왜 이런거지? 탭이」 — 아이폰이 키보드를 닫은 뒤에도 visualViewport.offsetTop 을
 *   키보드 높이만큼 남겨 두는 오류(WebKit 297779 · Apple 포럼 800125). 크로미움에선 그 오류가 안 나므로 visualViewport 를 가짜로 바꿔 흉내 냄.
 *
 *   ① 평소(어긋남 0) — html.vv-fix 없음 · 탭 · 머리줄 · «+» 그대로(아래 탭 바닥 = 화면 바닥 · 내려도 머리줄 맨 위)
 *   ② 키보드 올라옴(입력칸에 커서 · 보이는 높이 531 · offsetTop 343) — 안 건드림(입력칸을 가리지 않게)
 *   ③ 키보드가 제대로 내려감(offsetTop 0) — 그대로
 *   ④ 아이폰 오류(커서 빠짐 · 높이 돌아옴 · offsetTop 343 남음) — vv-fix · --vv-dy 343px · 탭 · «+»(기울기 그대로) translate 343 · 머리줄 top 343 ·
 *      빠른 찾기 창도 343 · 다른 탭으로 옮겨도 그대로 · 숨은 셈 |아이폰자리|바로잡음 한 번
 *   ⑤ 아이폰이 스스로 돌아옴(offsetTop 0) — 바로 풂
 *   ⑥ 키보드가 내려가는 중(높이 600 < 874×0.85) · 손가락 확대(scale 1.6) · 작은 흔들림(20px) — 안 건드림
 *   ⑦ 알림(이벤트) 없이 어긋남 — 2초 안에 잡음(처음은 0.5초 그대로일 때만) · 뒤로 가기로 돌아옴(pageshow) — 잡음
 *   ⑧ PC(윈도 크롬) · 안드로이드 — 같은 가짜 값이어도 아무것도 안 바뀜
 *   ⑨ 재발 막기 — styles.css 의 position: fixed · sticky(아래) 를 다 «G661 목록» 또는 «뺌(까닭)» 에 두었는지
 *   ⑩ G661b 쿠팡 배너(다른 사이트 틀)에 커서가 남아도 — 키보드가 없으면 바로잡음 · 키보드가 올라와 있으면 안 건드림
 *   ⑪ G661c 진단(소장님 폰에서도 셈) — A: 바로잡을 때 숫자 한 번 · B: 안 바로잡았는데 탭 바닥이 0.8초 넘게 어긋날 때 숫자(G667 꼴 t·h·m·c·b·f) · 깨우기(vv-kick 두 그림 · opacity)
 *   ⑫ G667 «끼임» — 소장님 11-13 16:03 캡처(탭 바닥 568.7pt / 874 · 「탭이 같이 올라가」): 글자판을 닫았는데 보이는 높이까지 줄어 있는 채 남음 →
 *      커서 없이 0.7초 넘게 이어지면 바로잡음(내리고 올릴 때 기준점을 0 까지 따라감) · 다시 글 쓰면 바로 풂 · 글자판이 제대로 내려가면 한 번도 안 움직임 ·
 *      커서만 남고 높이는 돌아온 채 1.5초 넘으면 바로잡음 · 진단 C 한 번
 *   ⑬ G691 진단 D — 머리줄(공사연결 작은 띠가 매달림)이 보이는 곳 위로 0.9초 넘게 나가 있으면 숫자 한 번(글자판이 정말 올라와 있을 땐 없음 · 아무것도 안 움직임) ·
 *      ⑪ ⑫ 의 바로잡기 흐름에선 D 없음
 *   ⑭ G798 «아래 잘림» — 소장님 11-20 12:57 홈 화면 앱 캡처 「아래도 잘려서 안보여」(아래 탭 안 보임 · 바닥글 잘림) · 폰 숫자 진단 B «t-41 h1042 i1042 b1042 s874 앱»:
 *      바탕(innerHeight 1042)이 화면(screen 874)보다 큼 → 0.8초 뒤 html.vv-cut · --vv-cut 168px · 아래 탭 바닥 = 874 · 쪽 끝 안쪽 +168 · 바닥글이 탭 위로 다 보임 ·
 *      화면 덮는 창 아래 가장자리 874 · 공지창 높이 ≤ 보이는 높이 · 진단 E 한 번 · 셈 |아이폰자리|아래바로잡음 한 번 · 진단 B 없음 ·
 *      글 쓰면 풂 → 커서 빼면 다시 · 손가락 확대면 풂 · G661 바로잡는 중이면 풂(둘이 겹치지 않음) · 바탕이 화면과 같아지면 바로 풂 · 0.8초 안 되는 잠깐은 그대로 ·
 *      사파리(웹) · 안드로이드 · PC 는 아무것도 안 함 · styles.css 재발 막기(아래에 붙는 fixed · sticky 는 vv-cut 목록에)
 *   인터넷 안 부름(파이어베이스 · 광고 · 애널리틱스 막음 · 셈은 가로채서 봄).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4661'
const 여기 = path.dirname(fileURLToPath(import.meta.url))

let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 400))) }
const 쉬어 = (ms) => new Promise((r) => setTimeout(r, ms))

const UA아이폰 = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1'
const UA안드 = 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
const UAPC = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'

const b = await chromium.launch()
/* 덧.화면 = 아이폰 화면 크기(screen — 안 주면 바탕과 같음) · 덧.앱 = 홈 화면 앱(navigator.standalone) — 📱 G798 «바탕이 화면보다 큼» 흉내 */
const 새판 = async (ua, w = 402, h = 874, 폰 = true, 덧 = {}) => {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, ...(덧.화면 ? { screen: 덧.화면 } : {}), locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, userAgent: ua })
  if (덧.앱) await ctx.addInitScript(() => { try { Object.defineProperty(Navigator.prototype, 'standalone', { configurable: true, get: () => true }) } catch (e) { /* 없음 */ } })
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs|coupang/, (r) => r.fulfill({ status: 200, body: '' }))
  const 보냄 = []
  await ctx.route(/firebaseio\.com|firebasedatabase\.app|identitytoolkit|securetoken/, (r) => {
    const q = r.request()
    if (q.method() !== 'GET') 보냄.push({ m: q.method(), u: decodeURIComponent(q.url().replace(/\?.*$/, '')) })
    return r.fulfill({ status: 200, contentType: 'application/json', headers: { ETag: 'e1' }, body: q.method() === 'POST' ? '{"name":"-시험"}' : 'null' })
  })
  await ctx.addInitScript(() => {
    try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) { /* 없음 */ }
    /* 숨은 셈이 «자동 브라우저» 라 안 세지 않게(webdriver 가림) — 셈이 가는지 보려고 */
    try { Object.defineProperty(Navigator.prototype, 'webdriver', { configurable: true, get: () => false }) } catch (e) { /* 없음 */ }
    /* 가짜 visualViewport — 아이폰 오류를 흉내 냄(값을 바꾸고 이벤트를 쏨) */
    class 가짜 extends EventTarget {
      constructor() { super(); this.offsetTop = 0; this.offsetLeft = 0; this.pageTop = 0; this.pageLeft = 0; this.scale = 1; this.height = 0; this.width = 0 }
    }
    const v = new 가짜()
    Object.defineProperty(window, 'visualViewport', { configurable: true, get: () => { if (!v.height) { v.height = window.innerHeight; v.width = window.innerWidth } return v } })
    window.__vv = v
  })
  const p = await ctx.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  return { ctx, p, 오류, 보냄 }
}
const 열기 = async (p, 길) => {
  await p.goto(BASE + 길, { waitUntil: 'domcontentloaded' }); await p.waitForSelector('main.shell', { timeout: 20000 }); await 쉬어(1200)
  /* 🔒 G791 — webdriver 를 가려서 사이트 공지창(G786 제휴 모집 · 늘 뜸)이 저절로 뜸 → 닫고 시험(창이 열린 채 굴리는 것은 시험_굴림잠금화면 이 봄) */
  for (let i = 0; i < 3; i++) { const 공지닫기 = p.locator('.noticepop-f .btn.line'); if (!(await 공지닫기.count())) break; await 공지닫기.first().click(); await 쉬어(300) }   /* G792 점검 날엔 점검창 · 공지창 둘 */
}
/* 가짜 값 바꾸기 + (쏠 때만) resize 이벤트 */
const 값 = (p, o, 쏨 = 'resize') => p.evaluate(([o, 쏨]) => { Object.assign(window.__vv, o); if (쏨) window.__vv.dispatchEvent(new Event(쏨)) }, [o, 쏨])
const 상태 = (p) => p.evaluate(() => {
  const r = document.documentElement, cs = (s) => { const e = document.querySelector(s); return e ? getComputedStyle(e) : null }
  const 탭 = document.querySelector('.tabbar'), 머리 = document.querySelector('.topbar'), 더하기 = document.querySelector('.cam-tab')
  return {
    고침: r.classList.contains('vv-fix'), dy: r.style.getPropertyValue('--vv-dy'),
    탭옮김: cs('.tabbar') && cs('.tabbar').translate, 머리top: cs('.topbar') && cs('.topbar').top,
    더하기옮김: cs('.cam-tab') && cs('.cam-tab').translate, 더하기기울기: cs('.cam-tab') && cs('.cam-tab').transform,
    탭바닥: 탭 ? Math.round(탭.getBoundingClientRect().bottom) : null, 머리위: 머리 ? Math.round(머리.getBoundingClientRect().top) : null,
    높이: window.innerHeight, 더하기있음: !!더하기,
  }
})
/* 입력칸에 커서(키보드 올라옴) — 쪽에 있는 첫 글칸 · 없으면 시험 칸을 붙임 */
const 커서 = (p) => p.evaluate(() => {
  let i = [...document.querySelectorAll('main input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=hidden]), main textarea')].find((x) => x.offsetParent)
  if (!i) { i = document.createElement('input'); i.id = '시험칸'; document.querySelector('main').appendChild(i) }
  /* 📰 G696 (11-16) 뉴스띠(입찰 화면 공사연결 띠 아래)로 첫 입력칸이 화면 밖(854 → 955)으로 내려가 focus 가 쪽을 538 내렸음 → ⑪ «진단 D 없음» 이 깨짐.
     이 시험은 «맨 위에서 글자판 · 기준점» 흐름이라 커서만 넣고 쪽은 안 움직임(preventScroll). 내려간 채 바로잡을 때의 D 는 옛 판도 같음(538 내려 시험 — y-145) → G691 조사 몫(⑬) */
  i.focus({ preventScroll: true }); return document.activeElement === i
})
const 커서뺌 = (p) => p.evaluate(() => { if (document.activeElement && document.activeElement.blur) document.activeElement.blur() })

/* ━━ 아이폰 ━━ */
{
  console.log('■ 아이폰(402×874 · 홈 화면 앱 흉내)')
  const { ctx, p, 오류, 보냄 } = await 새판(UA아이폰)
  await 열기(p, '/')
  await 값(p, { offsetTop: 0, scale: 1, height: 874 })
  await 쉬어(300)
  let s = await 상태(p)
  ok('① 평소 — vv-fix 없음 · 탭 · 머리줄 · «+» 그대로', !s.고침 && s.탭옮김 === 'none' && s.머리top === '0px' && (!s.더하기있음 || s.더하기옮김 === 'none'), s)
  ok('① 평소 — 아래 탭 바닥 = 화면 바닥', s.탭바닥 === s.높이, s)
  await p.evaluate(() => window.scrollTo(0, 900)); await 쉬어(400)
  s = await 상태(p)
  ok('① 평소 — 내려도 머리줄은 맨 위(sticky 그대로)', s.머리위 === 0 && !s.고침, s)
  await p.evaluate(() => window.scrollTo(0, 0)); await 쉬어(200)

  /* ② 키보드 올라옴 */
  ok('② (시험 준비) 입력칸에 커서', await 커서(p))
  await 값(p, { height: 531, offsetTop: 343 }); await 쉬어(300)
  s = await 상태(p)
  ok('② 키보드 올라옴(커서 · 높이 531 · 343) — 안 건드림', !s.고침 && s.탭옮김 === 'none', s)
  /* ③ 제대로 내려감 */
  await 커서뺌(p); await 값(p, { height: 874, offsetTop: 0 }); await 쉬어(1100)
  s = await 상태(p)
  ok('③ 키보드가 제대로 내려감(0) — 그대로', !s.고침 && s.탭옮김 === 'none' && s.머리top === '0px', s)

  /* ④ 아이폰 오류 — 커서는 빠졌는데 offsetTop 343 이 남음 */
  await 커서(p); await 값(p, { height: 531, offsetTop: 343 }); await 쉬어(150)
  await 커서뺌(p); await 쉬어(200)
  s = await 상태(p)
  ok('⑥ 키보드가 내려가는 중(커서 빠짐 · 높이 531) — 아직 안 건드림', !s.고침, s)
  await 값(p, { height: 874 }); await 쉬어(250)
  ok('④ 처음 0.5초는 기다림(튕김 · 내려가는 한순간이 아닌지)', !(await 상태(p)).고침)
  await 쉬어(700)
  s = await 상태(p)
  ok('④ 오류 — vv-fix · --vv-dy 343px', s.고침 && s.dy === '343px', s)
  ok('④ 아래 탭 translate 343 (화면 바닥으로)', s.탭옮김 === '0px 343px', s)
  ok('④ 머리줄 top 343 (화면 맨 위로)', s.머리top === '343px', s)
  ok('④ «+» 도 343 · 기울기(transform) 그대로', !s.더하기있음 || (s.더하기옮김 === '0px 343px' && /matrix/.test(s.더하기기울기 || '')), s)
  /* 빠른 찾기 창(머리줄 안에서 뜨는 «떠 있는 창») */
  const 찾기단추 = p.locator('.qsbtn').first()
  if (await 찾기단추.count()) {
    await 찾기단추.click(); await 쉬어(400)
    /* 창이 열리며 찾기 칸에 커서가 감(키보드 올라옴) → 그동안은 안 건드림 · 커서를 빼면 다시 바로잡음 */
    const 쓰는동안 = await p.evaluate(() => document.documentElement.classList.contains('vv-fix'))
    ok('④ 빠른 찾기 칸에 커서(키보드) — 그동안은 안 건드림', !쓰는동안)
    await 커서뺌(p); await 쉬어(1100)
    const 창 = await p.evaluate(() => { const e = document.querySelector('.qs-back'); return e ? getComputedStyle(e).translate : '없음' })
    ok('④ 빠른 찾기 창도 343(머리줄에 갇히지 않음)', 창 === '0px 343px', 창)
    await p.keyboard.press('Escape'); await 쉬어(300)
    if (await p.locator('.qs-back').count()) await p.evaluate(() => { const e = document.querySelector('.qs-back'); if (e) e.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })) })
    await 커서뺌(p); await 쉬어(1100)
  }
  /* 다른 탭으로 옮겨도 그대로(쪽 바뀜 · 아이폰은 여전히 어긋남) */
  await p.evaluate(() => { history.pushState(null, '', '/tools'); window.dispatchEvent(new PopStateEvent('popstate')) }); await 쉬어(900)
  s = await 상태(p)
  ok('④ 다른 탭(/tools)으로 옮겨도 바로잡은 채', s.고침 && s.탭옮김 === '0px 343px' && s.머리top === '343px', s)
  const 셈 = 보냄.filter((x) => /아이폰자리\|바로잡음/.test(x.u))
  ok('④ 숨은 셈 |아이폰자리|바로잡음 — 한 번', 셈.length === 1 && /\|아이폰자리\|바로잡음\.json$/.test(셈[0].u), 셈)
  await 쉬어(1200)
  const 진A = 보냄.filter((x) => /아이폰자리\|진단-A-/.test(x.u))
  ok('⑪ 진단 A(기준점이 남아 바로잡음) — 한 번 · 숫자(t343 · h874 · m874 · c874 · 바로잡기 전 탭 바닥 b874 · 커서 없음)', 진A.length === 1 && /진단-A-t343-h874-m874-c874-b874-fN-s\d+-(웹|앱)\.json$/.test(진A[0].u), 진A.map((x) => x.u.replace(/^.*\/dl\/p\//, '')))
  ok('⑪ 기준점 탓 어긋남엔 진단 B 없음', !보냄.some((x) => /진단-B-/.test(x.u)))

  /* ⑤ 아이폰이 스스로 돌아옴 */
  await 값(p, { offsetTop: 0 }, 'scroll'); await 쉬어(300)
  s = await 상태(p)
  ok('⑤ 스스로 돌아옴(0) — 바로 풂', !s.고침 && s.dy === '' && s.탭옮김 === 'none' && s.머리top === '0px', s)

  /* ⑥ 확대 · 작은 흔들림 */
  await 값(p, { scale: 1.6, offsetTop: 200, height: 546 }); await 쉬어(300)
  s = await 상태(p)
  ok('⑥ 손가락 확대(scale 1.6) — 안 건드림', !s.고침, s)
  await 값(p, { scale: 1, height: 874, offsetTop: 20 }); await 쉬어(300)
  s = await 상태(p)
  ok('⑥ 작은 흔들림(20px) — 안 건드림', !s.고침, s)
  /* 끝에서 튕김처럼 0.2초만 어긋났다 돌아옴 — 한 번도 안 움직여야(깜빡임 없음) */
  await p.evaluate(() => { window.__깜 = 0; new MutationObserver(() => { if (document.documentElement.classList.contains('vv-fix')) window.__깜++ }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] }) })
  await 값(p, { offsetTop: 120 }); await 쉬어(200); await 값(p, { offsetTop: 0 }); await 쉬어(900)
  ok('⑥ 0.2초 튕김 — 한 번도 안 움직임(깜빡임 없음)', (await p.evaluate(() => window.__깜)) === 0 && !(await 상태(p)).고침)

  /* ⑦ 이벤트 없이 · 뒤로 가기(pageshow) */
  await 값(p, { offsetTop: 343 }, ''); await 쉬어(2200)
  s = await 상태(p)
  ok('⑦ 알림 없이 어긋남 — 2초 안에 잡음', s.고침 && s.dy === '343px', s)
  await 값(p, { offsetTop: 0 }, ''); await 쉬어(1400)
  s = await 상태(p)
  ok('⑦ 알림 없이 돌아옴 — 1초 안에 풂', !s.고침, s)
  await 값(p, { offsetTop: 300 }, ''); await p.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))); await 쉬어(1200)
  s = await 상태(p)
  ok('⑦ 뒤로 가기로 돌아옴(pageshow) — 잡음(300)', s.고침 && s.dy === '300px', s)
  await 값(p, { offsetTop: 0 }); await 쉬어(300)
  ok('⑦ 다시 풂', !(await 상태(p)).고침)

  /* 🩹 G661b 쿠팡 배너(다른 사이트 틀)를 누르면 틀에 커서가 남음 — 그래도 키보드가 없으면 바로잡아야(전엔 막혔음) */
  const 틀커서 = await p.evaluate(() => {
    let f = document.querySelector('aside.cpg iframe')
    if (!f) { f = document.createElement('iframe'); f.id = '시험틀'; f.srcdoc = '<p>틀</p>'; document.querySelector('main').appendChild(f) }
    f.focus(); return document.activeElement === f
  })
  ok('⑩ (시험 준비) 배너 틀에 커서', 틀커서)
  await 값(p, { height: 531, offsetTop: 343 }); await 쉬어(900)
  ok('⑩ 틀에 커서 + 키보드 올라옴(높이 531) — 안 건드림', !(await 상태(p)).고침)
  await 값(p, { height: 874 }); await 쉬어(900)
  s = await 상태(p)
  ok('⑩ 틀에 커서 + 키보드 없음 + 343 남음 — 바로잡음(쿠팡 다녀온 뒤)', s.고침 && s.dy === '343px' && s.탭옮김 === '0px 343px', s)
  await 값(p, { offsetTop: 0 }); await 쉬어(300)
  ok('⑩ 다시 풂', !(await 상태(p)).고침)
  await 커서뺌(p)
  ok('셈은 한 번뿐(이 탭) · 진단 A 도 한 번뿐', 보냄.filter((x) => /아이폰자리\|바로잡음/.test(x.u)).length === 1 && 보냄.filter((x) => /진단-A-/.test(x.u)).length === 1)
  /* 🩺 깨우기 — 뒤로 가기(pageshow) 뒤 두 그림 동안만 html.vv-kick */
  await p.evaluate(() => { window.__깨 = 0; new MutationObserver(() => { if (document.documentElement.classList.contains('vv-kick')) window.__깨++ }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] }) })
  await p.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))); await 쉬어(900)
  ok('⑪ 깨우기 — pageshow 뒤 vv-kick 이 잠깐 붙었다 떨어짐', (await p.evaluate(() => window.__깨)) >= 1 && !(await p.evaluate(() => document.documentElement.classList.contains('vv-kick'))))
  ok('⑪ 깨우기 동안 머리줄 · 탭 will-change: opacity(transform 아님)', await p.evaluate(() => { document.documentElement.classList.add('vv-kick'); const a = getComputedStyle(document.querySelector('.topbar')).willChange, b = getComputedStyle(document.querySelector('.tabbar')).willChange; document.documentElement.classList.remove('vv-kick'); return a === 'opacity' && b === 'opacity' }))
  /* 🩺 진단 B — 기준점은 0 인데 아래 탭 바닥이 보이는 바닥과 어긋남(다른 꼴 · 아직 못 바로잡음 → 숫자만 적음) — 맨 끝(가장 큰 높이가 바뀜) */
  await 값(p, { offsetTop: 0, height: 1100 }); await 쉬어(1300)
  const 진B = 보냄.filter((x) => /아이폰자리\|진단-B-/.test(x.u))
  ok('⑪ 진단 B(기준점 0 · 탭 바닥 874 ≠ 보이는 바닥 1100) — 한 번 · 바로잡지는 않음', 진B.length === 1 && /진단-B-t0-h1100-m1100-c874-b874-fN-/.test(진B[0].u) && !(await 상태(p)).고침, 진B.map((x) => x.u.replace(/^.*\/dl\/p\//, '')))
  ok('⑪ 진단 D 없음(머리줄은 늘 보이는 곳 안)', !보냄.some((x) => /진단-D-/.test(x.u)), 보냄.filter((x) => /진단-D-/.test(x.u)).map((x) => x.u.replace(/^.*\/dl\/p\//, '')))
  ok('화면 오류 없음', 오류.length === 0, 오류)
  await ctx.close()
}

/* ━━ ⑫ G667 «끼임» — 글자판을 닫았는데 보이는 높이까지 줄어 있는 채 남음(소장님 11-13 16:03 캡처 · 「탭이 같이 올라가」) ━━ */
{
  console.log('■ 아이폰 ⑫ G667 끼임(보이는 높이까지 줄어 있음)')
  const { ctx, p, 오류, 보냄 } = await 새판(UA아이폰)
  await 열기(p, '/')
  await 값(p, { offsetTop: 0, scale: 1, height: 874 }); await 쉬어(300)
  ok('⑫ (시험 준비) 입력칸에 커서', await 커서(p))
  await 값(p, { height: 531, offsetTop: 0 }); await 쉬어(300)
  ok('⑫ 글 쓰는 중(커서 · 높이 531) — 안 건드림', !(await 상태(p)).고침)
  /* 글자판 닫음 — 커서는 빠졌는데 보이는 높이 531 이 그대로 남음(끼임) · 맨 위(기준점 0) */
  await 커서뺌(p); await 쉬어(1000)
  let s = await 상태(p)
  ok('⑫ 끼임 + 맨 위(기준점 0) — 안 건드림(탭 제자리)', !s.고침 && s.탭바닥 === s.높이, s)
  /* 내림 — 보이는 쪽이 바탕 안에서 미끄러져 기준점이 커짐(바로잡지 않으면 탭이 글과 같이 올라감) */
  await 값(p, { offsetTop: 150 }, 'scroll'); await 쉬어(150)
  s = await 상태(p)
  ok('⑫ 끼임에서 내림(150) — 바로 바로잡음(0.7초 지남 · 기다림 없음)', s.고침 && s.dy === '150px' && s.탭옮김 === '0px 150px' && s.머리top === '150px', s)
  await 값(p, { offsetTop: 305 }, 'scroll'); await 쉬어(150)
  s = await 상태(p)
  ok('⑫ 더 내림(305 — 캡처와 같은 어긋남) — 따라감', s.고침 && s.dy === '305px' && s.탭옮김 === '0px 305px' && s.머리top === '305px', s)
  await 값(p, { offsetTop: 20 }, 'scroll'); await 쉬어(150)
  s = await 상태(p)
  ok('⑫ 다시 올림(20) — 작은 값도 따라감', s.고침 && s.dy === '20px', s)
  await 값(p, { offsetTop: 0 }, 'scroll'); await 쉬어(150)
  s = await 상태(p)
  ok('⑫ 맨 위(0) — 끼인 동안은 켠 채 0(탭 · 머리줄 제자리)', s.고침 && s.dy === '0px' && s.탭바닥 === s.높이 && s.머리top === '0px', s)
  /* 다시 글을 씀(커서 + 높이 줄어 있음) — 바로 풂(아이폰이 하는 대로 · 입력칸을 가리지 않게) */
  await 커서(p); await 값(p, { offsetTop: 200 }, 'scroll'); await 쉬어(200)
  ok('⑫ 다시 글 씀(커서 + 높이 531) — 바로 풂', !(await 상태(p)).고침)
  /* 닫음 — 다시 끼임(305) · 0.7초 안에는 안 건드림(글자판이 내려가는 중일 수 있음) → 지나면 바로잡음 */
  await 커서뺌(p); await 값(p, { offsetTop: 305 }, 'scroll'); await 쉬어(350)
  ok('⑫ 닫은 직후 0.35초 — 아직 안 건드림', !(await 상태(p)).고침)
  await 쉬어(800)
  s = await 상태(p)
  ok('⑫ 0.7초 넘게 끼임 — 바로잡음(305)', s.고침 && s.dy === '305px' && s.탭옮김 === '0px 305px', s)
  /* 아이폰이 스스로 돌아옴(높이 874 · 기준점 0) — 바로 풂 */
  await 값(p, { height: 874, offsetTop: 0 }); await 쉬어(300)
  s = await 상태(p)
  ok('⑫ 스스로 돌아옴(높이 874 · 0) — 풂', !s.고침 && s.dy === '' && s.탭옮김 === 'none', s)
  /* 글자판이 제대로 내려감(커서 빠진 뒤 0.3초 안에 높이 · 기준점 돌아옴) — 한 번도 안 움직임(깜빡임 없음) */
  await p.evaluate(() => { window.__깜 = 0; new MutationObserver(() => { if (document.documentElement.classList.contains('vv-fix')) window.__깜++ }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] }) })
  await 커서(p); await 값(p, { height: 531, offsetTop: 343 }); await 쉬어(300)
  await 커서뺌(p); await 쉬어(150); await 값(p, { height: 700, offsetTop: 200 }); await 쉬어(120); await 값(p, { height: 874, offsetTop: 0 }); await 쉬어(1200)
  ok('⑫ 글자판이 제대로 내려감(0.3초) — 한 번도 안 움직임', (await p.evaluate(() => window.__깜)) === 0 && !(await 상태(p)).고침)
  /* 커서는 글칸에 남았는데 글자판은 내려감(높이 874) + 343 남음 — 1.5초 기다렸다 바로잡음 */
  await 커서(p); await 값(p, { height: 874, offsetTop: 343 }); await 쉬어(1000)
  ok('⑫ 커서 남음 + 높이 돌아옴 — 1초 안에는 안 건드림(막 커서가 들어간 것일 수 있음)', !(await 상태(p)).고침)
  await 쉬어(1800)
  s = await 상태(p)
  ok('⑫ 커서 남음 + 높이 돌아옴 1.5초 넘게 — 바로잡음(글자판은 내려갔는데 커서만 남음)', s.고침 && s.dy === '343px', s)
  await 커서뺌(p); await 값(p, { offsetTop: 0 }); await 쉬어(300)
  ok('⑫ 풂', !(await 상태(p)).고침)
  await 쉬어(300)
  const 진C = 보냄.filter((x) => /아이폰자리\|진단-C-/.test(x.u))
  ok('⑫ 진단 C(끼임 · 바로잡음) — 한 번 · 숫자(t150 · h531 · m874 · c874 · b874 · 커서 없음)', 진C.length === 1 && /진단-C-t150-h531-m874-c874-b874-fN-s\d+-(웹|앱)\.json$/.test(진C[0].u), 진C.map((x) => x.u.replace(/^.*\/dl\/p\//, '')))
  ok('⑫ 진단 B 는 한 쪽에 셋까지', 보냄.filter((x) => /아이폰자리\|진단-B-/.test(x.u)).length <= 3, 보냄.filter((x) => /진단-B-/.test(x.u)).map((x) => x.u.replace(/^.*\/dl\/p\//, '')))
  ok('⑫ 셈 |아이폰자리|바로잡음 — 한 번', 보냄.filter((x) => /아이폰자리\|바로잡음/.test(x.u)).length === 1)
  ok('⑫ 진단 D 없음(바로잡는 동안에도 머리줄은 보이는 곳 안)', !보냄.some((x) => /진단-D-/.test(x.u)), 보냄.filter((x) => /진단-D-/.test(x.u)).map((x) => x.u.replace(/^.*\/dl\/p\//, '')))
  ok('⑫ 화면 오류 없음', 오류.length === 0, 오류)
  await ctx.close()
}

/* ━━ ⑬ G691 진단 D — 머리줄이 보이는 곳 위로 나가 있음(소장님 11-15 20:3x 「아래로 내리면 공사연결 띠가 사라져」 · 작은 띠는 머리줄에 매달림) — 숫자만 적고 아무것도 안 움직임 ━━ */
{
  console.log('■ 아이폰 ⑬ G691 진단 D(머리줄이 보이는 곳 위로)')
  const { ctx, p, 오류, 보냄 } = await 새판(UA아이폰)
  await 열기(p, '/live')
  await 값(p, { offsetTop: 0, scale: 1, height: 874 }); await 쉬어(300)
  /* 머리줄을 위로 밀어 «아이폰에서 머리줄이 보이는 곳 위로 나간» 모습을 흉내(크롬은 visualViewport 를 못 움직임) */
  const 밀기 = (px) => p.evaluate((px) => { let s = document.getElementById('시험밀기'); if (!s) { s = document.createElement('style'); s.id = '시험밀기'; document.head.appendChild(s) } s.textContent = px ? `.topbar{position:relative !important;top:${px}px !important}` : '' }, px)
  ok('⑬ (시험 준비) 입력칸에 커서', await 커서(p))
  await 값(p, { height: 531, offsetTop: 0 }); await 밀기(-200); await 쉬어(1500)
  ok('⑬ 글 쓰는 중(커서 · 높이 531) + 머리줄이 위로 — 진단 D 없음(글자판이 정말 올라와 있음 · 아이폰이 하는 대로)', !보냄.some((x) => /진단-D-/.test(x.u)))
  await 커서뺌(p); await 값(p, { height: 874, offsetTop: 0 }); await 쉬어(400)
  ok('⑬ 커서 뺌 · 머리줄이 위로 나간 지 0.4초 — 아직 없음', !보냄.some((x) => /진단-D-/.test(x.u)))
  await 쉬어(1400)
  const 진D = 보냄.filter((x) => /아이폰자리\|진단-D-/.test(x.u))
  ok('⑬ 0.9초 넘게 — 진단 D 한 번 · 숫자(t0 · h874 · 머리줄 바닥 y− · 확대 k100 · 바로잡음 z0 · 쪽 live)', 진D.length === 1 && /진단-D-t0-h874-m874-c874-b874-fN-y-\d+-k100-z0-plive-s\d+-(웹|앱)\.json$/.test(진D[0].u), 진D.map((x) => x.u.replace(/^.*\/dl\/p\//, '')))
  const s = await 상태(p)
  ok('⑬ 진단만 — 바로잡기(vv-fix) 안 함 · 아래 탭 그대로', !s.고침 && s.탭옮김 === 'none', s)
  await 쉬어(2200)
  ok('⑬ 이어져도 한 쪽에 한 번뿐', 보냄.filter((x) => /진단-D-/.test(x.u)).length === 1)
  await 밀기(0); await 쉬어(1100)
  ok('⑬ 머리줄 제자리 — 그 뒤로 더 없음 · 다른 진단(A · B · C)도 없음', 보냄.filter((x) => /진단-[A-D]-/.test(x.u)).length === 1, 보냄.filter((x) => /진단-/.test(x.u)).map((x) => x.u.replace(/^.*\/dl\/p\//, '')))
  ok('⑬ 화면 오류 없음', 오류.length === 0, 오류)
  await ctx.close()
}

/* ━━ ⑭ G798 «아래 잘림» — 홈 화면 앱에서 바탕(innerHeight 1042)이 화면(screen 874)보다 큼(소장님 폰 진단 B «t-41 h1042 i1042 b1042 s874 앱») ━━ */
{
  console.log('■ 아이폰 ⑭ G798 아래 잘림(바탕 1042 · 화면 874 · 홈 화면 앱)')
  const { ctx, p, 오류, 보냄 } = await 새판(UA아이폰, 402, 1042, true, { 화면: { width: 402, height: 874 }, 앱: true })
  const 잘림 = () => p.evaluate(() => {
    const r = document.documentElement, 탭 = document.querySelector('.tabbar')
    const 탭r = 탭 ? 탭.getBoundingClientRect() : null
    return { 켬: r.classList.contains('vv-cut'), 고침: r.classList.contains('vv-fix'), cut: r.style.getPropertyValue('--vv-cut'), vis: r.style.getPropertyValue('--vv-vis'),
      탭바닥: 탭r ? Math.round(탭r.bottom) : null, 탭위: 탭r ? Math.round(탭r.top) : null, 높이: window.innerHeight, 화면: screen.height, 앱: navigator.standalone === true }
  })
  await 열기(p, '/')
  await 값(p, { offsetTop: 0, scale: 1, height: 1042 })
  await 쉬어(1300)
  let s = await 잘림()
  ok('⑭ 흉내 됨 — 바탕 1042 · 화면 874 · 홈 화면 앱', s.높이 === 1042 && s.화면 === 874 && s.앱, s)
  ok('⑭ 0.8초 뒤 바로잡음 — html.vv-cut · --vv-cut 168px · --vv-vis 874px · vv-fix 없음', s.켬 && s.cut === '168px' && s.vis === '874px' && !s.고침, s)
  ok('⑭ 아래 탭 바닥 = 화면 바닥(874) — 1042 에서 168 올라옴', s.탭바닥 === 874, s)
  const 더 = await p.evaluate(() => {
    const r = document.documentElement, m = document.querySelector('main.shell')
    const a = parseFloat(getComputedStyle(m).paddingBottom); r.classList.remove('vv-cut'); const b0 = parseFloat(getComputedStyle(m).paddingBottom); r.classList.add('vv-cut')
    return Math.round(a - b0)
  })
  ok('⑭ 쪽 끝 안쪽(.shell padding-bottom)이 168 더 — 바닥글까지 내려 보이게', 더 === 168, 더)
  await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await 쉬어(500)
  const 끝 = await p.evaluate(() => {
    const f = document.querySelector('.footer'), 탭 = document.querySelector('.tabbar')
    const fr = f.getBoundingClientRect(), tr = 탭.getBoundingClientRect()
    return { 바닥글끝: Math.round(fr.bottom), 탭위: Math.round(tr.top), 탭바닥: Math.round(tr.bottom) }
  })
  ok('⑭ 맨 아래로 내리면 바닥글이 (올린) 아래 탭 위에 다 보임 — 화면 874 안', 끝.바닥글끝 <= 끝.탭위 && 끝.탭바닥 === 874, 끝)
  const 창 = await p.evaluate(() => {
    const w = document.createElement('div'); w.className = 'noticepop'; w.id = '시험창'
    const c = document.createElement('div'); c.className = 'noticepop-c'; c.style.height = '3000px'; w.appendChild(c); document.body.appendChild(w)
    const wr = w.getBoundingClientRect(), cr = c.getBoundingClientRect(), mh = getComputedStyle(c).maxHeight
    w.remove()
    return { 창바닥: Math.round(wr.bottom), 카드위: Math.round(cr.top), 카드바닥: Math.round(cr.bottom), mh }
  })
  ok('⑭ 화면 덮는 창(공지창) — 아래 가장자리 874 · 긴 공지도 카드가 화면 안(위 ≥ 0 · 아래 ≤ 874)', 창.창바닥 === 874 && 창.카드위 >= 0 && 창.카드바닥 <= 874, 창)
  const 진E = 보냄.filter((x) => /진단-E-/.test(x.u))
  ok('⑭ 진단 E — 한 번 · 숫자(t0 · h1042 · 넘침 m168 · 바로잡기 전 탭 바닥 b1042 · 커서 없음 · s874 · 앱)', 진E.length === 1 && /진단-E-t0-h1042-m168-c\d+-b1042-fN-s874-앱\.json$/.test(진E[0].u), 진E.map((x) => x.u.replace(/^.*\/dl\/p\//, '')))
  ok('⑭ 숨은 셈 |아이폰자리|아래바로잡음 한 번', 보냄.filter((x) => /아이폰자리\|아래바로잡음/.test(x.u)).length === 1, 보냄.map((x) => x.u.replace(/^.*\/dl\/p\//, '')))
  ok('⑭ 진단 B 없음(올려 둔 탭은 B 로 안 셈) · A · C · D 없음', !보냄.some((x) => /진단-[ABCD]-/.test(x.u)), 보냄.filter((x) => /진단-/.test(x.u)).map((x) => x.u.replace(/^.*\/dl\/p\//, '')))
  await p.evaluate(() => window.scrollTo(0, 0)); await 쉬어(300)

  ok('⑭ 글 쓰면 — 바로 풂(키보드는 아이폰이 하는 대로)', await 커서(p) && (await 쉬어(300), !(await 잘림()).켬), await 잘림())
  await 쉬어(1700)
  ok('⑭ 커서가 남아 있는 동안은 계속 안 건드림', !(await 잘림()).켬, await 잘림())
  await 커서뺌(p); await 쉬어(1600)
  s = await 잘림()
  ok('⑭ 커서 빼면 — 0.8초 뒤 다시 바로잡음(168)', s.켬 && s.cut === '168px' && s.탭바닥 === 874, s)

  await 값(p, { scale: 1.6 }); await 쉬어(300)
  ok('⑭ 손가락 확대 — 풂', !(await 잘림()).켬, await 잘림())
  await 값(p, { scale: 1 }); await 쉬어(1400)
  ok('⑭ 확대 끝 — 다시 바로잡음', (await 잘림()).켬, await 잘림())

  await 값(p, { offsetTop: 343 }); await 쉬어(2300)
  s = await 잘림()
  ok('⑭ G661 기준점 어긋남이 겹치면 — G661 바로잡기(vv-fix)만 · vv-cut 은 풂(둘이 겹치지 않음)', s.고침 && !s.켬, s)
  await 값(p, { offsetTop: 0 }); await 쉬어(1500)
  s = await 잘림()
  ok('⑭ 기준점 돌아오면 — vv-fix 풂 · 바탕이 아직 크면 vv-cut 다시', !s.고침 && s.켬 && s.탭바닥 === 874, s)

  await p.setViewportSize({ width: 402, height: 874 }); await 값(p, { height: 874 }); await 쉬어(400)
  s = await 잘림()
  ok('⑭ 바탕이 화면과 같아지면(874) — 바로 풂 · 값 지움 · 탭 바닥 874 그대로', !s.켬 && !s.cut && !s.vis && s.탭바닥 === 874, s)
  await p.setViewportSize({ width: 402, height: 1042 }); await 값(p, { height: 1042 }); await 쉬어(450)
  ok('⑭ 잠깐(0.8초 안) 커진 것은 — 그대로', !(await 잘림()).켬, await 잘림())
  await p.setViewportSize({ width: 402, height: 874 }); await 값(p, { height: 874 }); await 쉬어(1400)
  ok('⑭ 잠깐 커졌다 돌아오면 — 끝내 안 건드림', !(await 잘림()).켬, await 잘림())
  ok('⑭ 진단 E 는 한 쪽에 한 번뿐 · 셈도 한 번', 보냄.filter((x) => /진단-E-/.test(x.u)).length === 1 && 보냄.filter((x) => /아래바로잡음/.test(x.u)).length === 1)
  ok('⑭ 화면 오류 없음', 오류.length === 0, 오류)
  await ctx.close()
}
for (const [이름, 앱, ua, 폰] of [['사파리(웹 — 홈 화면 앱 아님)', false, UA아이폰, true], ['안드로이드(앱 흉내)', true, UA안드, true]]) {
  const { ctx, p, 오류, 보냄 } = await 새판(ua, 402, 1042, 폰, { 화면: { width: 402, height: 874 }, 앱 })
  await 열기(p, '/')
  await 값(p, { offsetTop: 0, scale: 1, height: 1042 }); await 쉬어(1500)
  const s = await p.evaluate(() => ({ 켬: document.documentElement.classList.contains('vv-cut'), cut: document.documentElement.style.getPropertyValue('--vv-cut') }))
  ok(`⑭ ${이름} — 바탕 1042 · 화면 874 여도 vv-cut 없음 · 진단 E 없음`, !s.켬 && !s.cut && !보냄.some((x) => /진단-E-|아래바로잡음/.test(x.u)), s)
  ok(`⑭ ${이름} — 화면 오류 없음`, 오류.length === 0, 오류)
  await ctx.close()
}

/* ━━ ⑧ PC · 안드로이드 — 아무것도 안 바뀜 ━━ */
for (const [이름, ua, w, h, 폰] of [['PC(윈도 크롬 1280)', UAPC, 1280, 900, false], ['안드로이드(390)', UA안드, 390, 844, true]]) {
  console.log('■ ' + 이름)
  const { ctx, p, 오류, 보냄 } = await 새판(ua, w, h, 폰)
  await 열기(p, '/')
  await 값(p, { offsetTop: 343, scale: 1, height: h }); await 쉬어(1400)
  const s = await 상태(p)
  ok(`⑧ ${이름} — 가짜 343 이어도 vv-fix 없음 · 그대로`, !s.고침 && (s.탭옮김 === 'none' || s.탭옮김 === null) && s.머리top === '0px', s)
  ok(`⑧ ${이름} — vv-cut(G798)도 없음`, !(await p.evaluate(() => document.documentElement.classList.contains('vv-cut'))))
  ok(`⑧ ${이름} — 셈 안 감`, !보냄.some((x) => /아이폰자리/.test(x.u)))
  ok(`⑧ ${이름} — 화면 오류 없음`, 오류.length === 0, 오류)
  await ctx.close()
}
await b.close()

/* ━━ ⑨ 재발 막기 — 떠 있는 것(fixed) · 아래에 붙는 것(sticky bottom) 은 G661 목록에 있거나 «뺌» 에 까닭이 있어야 ━━ */
{
  console.log('■ 재발 막기(styles.css)')
  const css = fs.readFileSync(path.join(여기, '..', 'web', 'src', 'styles.css'), 'utf8')
  const 블록 = css.replace(/\/\*[\s\S]*?\*\//g, '')
  /* 덮음 = «html.vv-fix …» 규칙의 선택자에 든 이름만(파일 끝에 붙은 다른 규칙이 섞이지 않게) */
  const 덮음 = new Set()
  for (const m of 블록.matchAll(/html\.vv-fix\s*([^{}]*)\{/g)) for (const c of m[1].matchAll(/\.([\w가-힣-]+)/g)) 덮음.add(c[1])
  const g = [...블록.matchAll(/html\.vv-fix[^{}]*\{[^{}]*\}/g)].map((m) => m[0]).join('\n')
  const 뺌 = {
    'gmd-ws': 'K-적산컨맵 작업 화면 — PC 넓은 화면용(폰에선 안 씀) · 안에 떠 있는 창이 있어 통째로 옮기면 두 번 옮겨짐',
    'bim-ws': 'BIM 작업 화면 — PC 넓은 화면용',
    'gg-ws': '골조 작업 화면 — PC 넓은 화면용',
    'noticepop-f': '공지 창 안 스크롤 상자에 붙음(화면 기준 아님)',
  }
  const 없는것 = []
  for (const m of 블록.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const 선택 = m[1].trim(), 몸 = m[2]
    const 고정 = /position:\s*fixed/.test(몸), 아래붙음 = /position:\s*sticky/.test(몸) && /(^|[;\s])bottom\s*:/.test(몸)
    if (!고정 && !아래붙음) continue
    for (const 하나 of 선택.split(',')) {
      const 끝 = [...하나.matchAll(/\.([\w가-힣-]+)/g)].map((x) => x[1]).pop()
      if (!끝) continue
      if (!덮음.has(끝) && !뺌[끝]) 없는것.push((고정 ? 'fixed ' : 'sticky-bottom ') + 하나.trim())
    }
  }
  ok('⑨ fixed · sticky(아래) 가 모두 G661 목록 또는 «뺌»(까닭) 에 있음', 없는것.length === 0, 없는것)
  ok('⑨ G661 목록에 머리줄 · 아래 탭 · «+» 가 있음', ['topbar', 'tabbar', 'cam-tab'].every((k) => 덮음.has(k)))
  ok('⑨ 머리줄은 transform 으로 옮기지 않음(안의 떠 있는 창이 갇힘)', !/vv-fix[^{}]*\.topbar[^{}]*\{[^}]*(translate|transform)/.test(g) && /html\.vv-fix \.topbar \{ top: var\(--vv-dy/.test(g))
}

/* ━━ ⑭ G798 재발 막기 — G661 목록(vv-fix) 가운데 «아래에 붙는 것»(bottom · inset · 글 속 style bottom · sticky 아래)은 vv-cut 목록에도 있어야 ━━ */
{
  console.log('■ 재발 막기 ⑭(styles.css · vv-cut)')
  const css = fs.readFileSync(path.join(여기, '..', 'web', 'src', 'styles.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
  const 덩이 = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ 선택: m[1].trim(), 몸: m[2] }))
  const 이름들 = (sel) => new Set([...sel.matchAll(/\.([\w가-힣-]+)/g)].map((x) => x[1]))
  const 고침목록 = new Set(), 잘림목록 = new Set()
  for (const d of 덩이) {
    if (/html\.vv-fix/.test(d.선택)) for (const c of 이름들(d.선택)) 고침목록.add(c)
    if (/html\.vv-cut/.test(d.선택)) for (const c of 이름들(d.선택)) 잘림목록.add(c)
  }
  for (const c of ['vv-fix', 'vv-cut']) { 고침목록.delete(c); 잘림목록.delete(c) }
  /* 글 속(JSX) style={{ bottom: … }} 로 아래에 붙는 것 — 인사(.insa) · 알림 안내(.ask-card) · 일용 판단 띠(.iy-bar) 등 */
  const 글속아래 = new Set()
  const 걷기 = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const q = path.join(d, e.name); if (e.isDirectory()) 걷기(q); else if (/\.jsx$/.test(e.name)) for (const m of fs.readFileSync(q, 'utf8').matchAll(/className=\{?['"]([\w가-힣 -]+)['"][^>]*?style=\{\{\s*bottom/g)) for (const c of m[1].split(/\s+/)) if (c) 글속아래.add(c) } }
  걷기(path.join(여기, '..', 'web', 'src'))
  const 아래붙음 = (c) => 글속아래.has(c) || 덩이.some((d) => !/vv-(fix|cut|kick)/.test(d.선택) && d.선택.split(',').some((하나) => [...하나.matchAll(/\.([\w가-힣-]+)/g)].map((x) => x[1]).pop() === c) &&
    (/(^|[;\s])bottom\s*:\s*(?!auto)/.test(d.몸) || /(^|[;\s])inset\s*:\s*0\b/.test(d.몸)))
  const 뺌 = { 'noticepop-f': '공지 창 안 스크롤 상자에 붙음(화면 기준 아님)' }
  const 빠짐 = [...고침목록].filter((c) => 아래붙음(c) && !잘림목록.has(c) && !뺌[c])
  ok('⑭ 아래에 붙는 fixed · sticky(G661 목록) 가 모두 vv-cut 목록에 있음', 빠짐.length === 0, 빠짐)
  ok('⑭ 글 속 style bottom 찾음(.insa · .ask-card · .iy-bar)', ['insa', 'ask-card', 'iy-bar'].every((c) => 글속아래.has(c)), [...글속아래])
  ok('⑭ 위에 붙는 것(.topbar · .kcm-sibar · .gmd-askbox)은 vv-cut 으로 안 옮김', !['topbar', 'kcm-sibar', 'gmd-askbox'].some((c) => 잘림목록.has(c)), [...잘림목록])
  ok('⑭ .shell 아래 안쪽 셋(기본 · 560 이하 · 900 이상) 모두 --vv-cut 더함', (css.match(/html\.vv-cut \.shell \{ padding-bottom: calc\([^}]*\+ var\(--vv-cut, 0px\)\); \}/g) || []).length === 3)
}

console.log(bad ? `\n✗ ${bad}개 틀림 (${n}개 중)` : `\n✅ 시험_아이폰자리 ${n}/${n}`)
process.exit(bad ? 1 : 0)
