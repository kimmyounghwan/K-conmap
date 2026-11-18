/**
 * 🗺 G756 공사 현황판 화면 시험 (2026-11-17) — 진짜 브라우저(Playwright) · PC 1440 · 폰 390
 *   node tools/시험_현황판화면.mjs [주소=http://127.0.0.1:5001] [캡처폴더]
 *   (클라우드에서만 — 굽은 사이트 + data/now/*.json 이 있는 시험 서버가 있어야 함 · PC 올리기 시험 목록엔 넣지 않음)
 *   ① 전국: 제목 · 단계 수(sum.json 그대로) · 핀(곳 수 · 크기 · 지도 안) · 위 알림 · 시도 17 · 전국 큰 공사 · 가로 넘침 없음
 *   ② 단계 끄기 · 켜기 — 핀 수 = 고른 단계로 센 수 · 주소 s= · 마지막 하나는 못 끔
 *   ③ 시도(전남) — 주소 /map/전남 · 지도 크게(viewBox) · 목록 수 = 자료로 센 수 · 300 까지 · «← 전국»
 *   ④ 핀(시 · 군) — 목록 = 그 곳 줄 수 · 주소 k= · «전남 전체 보기»
 *   ⑤ 카드 — 펼침 · 📄 공고 보기(/notice/) · 💰 바로투찰(/?no=) · ☆ 담기(바구니 kcm_basket) · 🔗 공유(복사 글 · 주소 · 알림)
 *   ⑥ 금액 · 찾기 — 자료로 센 수와 같음 · 주소 a= q=
 *   ⑦ 뒤로가기 — 시 · 군 → 시도 → 전국 → 들어온 곳(구인구직)
 *   ⑧ 공유 주소로 바로 열기 — 그 카드가 펼쳐져 화면 안에
 *   ⑨ 📍 내 지역(있을 때 칩 · 없을 때 정하기) · 🪪 내 면허만(공고 탭과 같은 저장)
 *   ⑩ 구인구직 «🗺 지도로 보기» → /map?s=2 · 지역 골랐으면 /map/{시도}?s=2
 *   ⑪ 자료 없음(n 0) · 못 받음 — 알림 글 · 오류 없음
 *   ⑫ 화면 오류(pageerror) 없음
 */
import { createRequire } from 'module'
import { 줄풀기, 거르기, 시도핀들, 수짧게 } from '../web/src/lib/현황판.js'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 주소 = process.argv[2] || 'http://127.0.0.1:5001'
const 캡처 = process.argv[3] || ''
let 통과 = 0, 실패 = 0
const 봄 = (이름, 참, 더 = '') => { if (참) { 통과++; console.log('  ✓', 이름, 더) } else { 실패++; console.log('  ✗', 이름, 더) } }
const 쉼 = (ms) => new Promise((r) => setTimeout(r, ms))
const 받기 = async (p) => { const r = await fetch(주소 + p); return r.ok ? r.json() : null }
const 수글 = (n) => Number(n || 0).toLocaleString('ko-KR')

const 합 = await 받기('/data/now/sum.json')
if (!합 || !합.n) { console.log('✗ 시험 서버에 /data/now/sum.json 이 없습니다 — 먼저 자료를 놓으세요'); process.exit(1) }
const 시도줄 = async (d) => ((await 받기('/data/now/' + encodeURIComponent(d) + '.json')) || { 줄: [] }).줄.map(줄풀기).filter(Boolean)
const 전남 = await 시도줄('전남')
const 경기 = await 시도줄('경기')
const 모두 = new Set([0, 1, 2])

const 브 = await chromium.launch()
const 치우기 = (p) => p.evaluate(() => {
  document.querySelectorAll('.noticepop, .noticepop-bg').forEach((e) => { e.style.display = 'none' })
  for (const e of document.querySelectorAll('body *')) { const cs = getComputedStyle(e); if (cs.position === 'fixed' && /반갑습니다|다시 오셨네요|오랜만/.test(e.innerText || '')) e.style.visibility = 'hidden' }
})
async function 판(크기, 이름, 저장 = {}) {
  const 폰 = 이름 === '폰'
  const c = await 브.newContext({ viewport: 크기, deviceScaleFactor: 1, isMobile: 폰, hasTouch: 폰, locale: 'ko-KR' })
  await c.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 주소 })
  await c.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs|firebaseio|coupang|daumcdn|kakao/, (r) => r.fulfill({ status: 200, body: '' }))
  /* 공유는 «복사» 길로(시험 브라우저마다 navigator.share 가 있고 없고가 달라서) · 저장 값은 처음 한 번만 */
  await c.addInitScript((s) => {
    try { delete Navigator.prototype.share } catch (e) { /* */ }
    try { if (!sessionStorage.getItem('시험_놓음')) { for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v); sessionStorage.setItem('시험_놓음', '1') } } catch (e) { /* */ }
  }, 저장)
  const p = await c.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  return { c, p, 오류 }
}
const 길 = (p) => { const u = new URL(p.url()); return decodeURIComponent(u.pathname) + decodeURIComponent(u.search) }
const 제목수 = async (p) => { const t = await p.locator('.nm-h').first().innerText(); const m = t.match(/([\d,]+)\s*건/); return m ? Number(m[1].replace(/,/g, '')) : -1 }
const 기다림 = async (p, f, ms = 8000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await f()) return true; await 쉼(120) } return false }

const 크기들 = process.env.ONLY === 'pc' ? [['PC', { width: 1440, height: 900 }]] : process.env.ONLY === 'phone' ? [['폰', { width: 390, height: 844 }]] : [['PC', { width: 1440, height: 900 }], ['폰', { width: 390, height: 844 }]]
for (const [이름, 크기] of 크기들) {
  const 좁 = 크기.width <= 640
  console.log(`■ ${이름} ${크기.width}`)
  /* ── ① 전국 ── */
  {
    const { c, p, 오류 } = await 판(크기, 이름)
    await p.goto(주소 + '/map', { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('.nm-pin', { timeout: 20000 }).catch(() => {})
    await 치우기(p)
    봄('① 제목 «공사 현황판»', (await p.locator('.nm h1').innerText()).includes('공사 현황판'))
    const 단추 = await p.locator('.nm-stb').allInnerTexts()
    봄('① 단계 셋 · 수 = sum.json', 단추.length === 3 && 단추[0].includes(수글(합.n[0])) && 단추[1].includes(수글(합.n[1])) && 단추[2].includes(수글(합.n[2])), 단추.join(' | '))
    봄('① 기준 시각', (await p.locator('.nm-at').innerText()).includes('기준'))
    const 핀수 = await p.locator('.nm-spin').count()
    봄('① 전국 = 시 · 도 핀(수 있는 시도만)', 핀수 === 시도핀들(합, 모두).length && (await p.locator('.nm-pin:not(.nm-spin)').count()) === 0, `${핀수}`)
    const 핀재기 = () => p.evaluate(() => {
      const m = document.querySelector('.nm-map').getBoundingClientRect()
      const ps = [...document.querySelectorAll('.nm-pin')].map((b) => { const r = b.getBoundingClientRect(); return { w: r.width, h: r.height, cx: r.left + r.width / 2, cy: r.top + r.height / 2, 글: b.innerText } })
      let 겹 = 0
      for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) if (Math.hypot(ps[i].cx - ps[j].cx, ps[i].cy - ps[j].cy) < (ps[i].w + ps[j].w) / 2 - 1) 겹++
      return { 겹, 안: ps.every((x) => x.cx >= m.left - 1 && x.cx <= m.right + 1 && x.cy >= m.top - 1 && x.cy <= m.bottom + 1), 넘침: ps.filter((x) => x.w < 18 || Math.abs(x.w - x.h) > 1).length, 지도폭: m.width, 작은: Math.min(...ps.map((x) => x.w)), 큰: Math.max(...ps.map((x) => x.w)) }
    })
    const 잰 = await 핀재기()
    봄('① 시 · 도 핀 안 겹침 · 지도 안 · 둥근 꼴', 잰.겹 === 0 && 잰.안 && 잰.넘침 === 0, JSON.stringify(잰))
    const 전남핀 = await p.locator('.nm-spin').nth(시도핀들(합, 모두).findIndex((x) => x.d === '전남')).innerText()
    const 전남수 = 합.시도['전남'].slice(0, 3).reduce((a, b) => a + b, 0)
    봄('① 전남 핀 수 = sum.json', 전남핀.replace(/\s/g, '').startsWith(좁 ? 수짧게(전남수) : 수글(전남수) + '전남'), 전남핀.replace(/\n/g, ' '))
    if (!좁) {
      const 겹침 = await p.evaluate(() => { const a = document.querySelector('.nm-brand').getBoundingClientRect(), b = document.querySelector('.nm-map').getBoundingClientRect(); return a.right > b.left && a.bottom > b.top ? Math.round(a.right - b.left) : 0 })
      봄('① 넓은 화면 — 글 칸이 지도를 안 덮음', 겹침 === 0, `${겹침}px`)
    }
    봄('① 위 알림(새 공고 · 1순위)', !합.새.length || (await p.locator('.nm-live').count()) === 1)
    봄('① 시도 17 · 전남 수', (await p.locator('.nm-sido button').count()) === 17 && (await p.locator('.nm-sido button', { hasText: '전남' }).innerText()).includes(수글(합.시도['전남'].slice(0, 3).reduce((a, b) => a + b, 0))))
    봄('① 전국 큰 공사 = sum.큰', (await p.locator('.nm-cards > li').count()) === 거르기(합.큰.map(줄풀기), { 단계: 모두 }).length)
    const 넘침 = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
    봄('① 가로 넘침 없음', 넘침 <= 1, `${넘침}px`)
    if (캡처) { await p.screenshot({ path: `${캡처}/${이름}_1전국.png` }) }

    /* ── ② 단계 ── */
    await p.locator('.nm-stb', { hasText: '곧 착공' }).click()
    await 쉼(300)
    const 핀2 = await p.locator('.nm-spin').count()
    const 둘 = 시도핀들(합, new Set([0, 1]))
    const 경기2 = 둘.find((x) => x.d === '경기')
    const 경기글 = await p.locator('.nm-spin').nth(둘.findIndex((x) => x.d === '경기')).innerText()
    봄('② 곧 착공 끔 → 시 · 도 핀 = 입찰 중 · 개찰 대기로 센 수', 핀2 === 둘.length && 경기글.replace(/\s/g, '').startsWith(좁 ? 수짧게(경기2.n) : 수글(경기2.n) + '경기') && (await p.locator('.nm-stb', { hasText: '곧 착공' }).getAttribute('aria-pressed')) === 'false', `${핀2} · 경기 ${경기글.replace(/\n/g, ' ')} / ${경기2.n}`)
    봄('② 주소 s=0,1', 길(p).includes('s=0,1'), 길(p))
    await p.locator('.nm-stb', { hasText: '입찰 중' }).click(); await p.locator('.nm-stb', { hasText: '개찰 대기' }).click(); await 쉼(200)
    봄('② 마지막 하나(개찰 대기)는 못 끔', (await p.locator('.nm-stb.on').count()) === 1 && (await p.locator('.nm-stb', { hasText: '개찰 대기' }).getAttribute('aria-pressed')) === 'true')
    await p.locator('.nm-stb', { hasText: '입찰 중' }).click(); await p.locator('.nm-stb', { hasText: '곧 착공' }).click(); await 쉼(200)
    봄('② 다시 셋 다 → 주소 /map', (await p.locator('.nm-stb.on').count()) === 3 && 길(p) === '/map', 길(p))

    /* ── ③ 시도 ── */
    await p.locator('.nm-sido button', { hasText: '전남' }).click()
    await 기다림(p, async () => (await 제목수(p)) >= 0)
    await 쉼(400)
    봄('③ 주소 /map/전남', 길(p) === '/map/전남', 길(p))
    봄('③ 목록 수 = 전남 자료 수', (await 제목수(p)) === 전남.length, `${await 제목수(p)} / ${전남.length}`)
    봄('③ 카드 300 까지 · 넘으면 알림', (await p.locator('.nm-cards > li').count()) === Math.min(300, 전남.length) && (전남.length <= 300 || (await p.locator('text=앞 300건만').count()) === 1))
    const vb = await p.locator('svg.nm-land').getAttribute('viewBox')
    봄('③ 지도 크게(전국 틀 아님) · «← 전국 지도» · «📍 전남»', !/^0 0 /.test(vb) && (await p.locator('.nm-back').count()) === 1 && (await p.locator('.nm-where b').innerText()).includes('전남'), vb)
    const 전남곳 = new Set(전남.filter((r) => r.k).map((r) => r.k))
    봄('③ 핀 = 전남 시 · 군 수', (await p.locator('.nm-pin').count()) === 전남곳.size, `${await p.locator('.nm-pin').count()} / ${전남곳.size}`)
    봄('③ 가로 넘침 없음', (await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1)
    const 잰2 = await 핀재기()
    봄('③ 시 · 군 핀 안 겹침(핀펴기) · 지도 안', 잰2.겹 === 0 && 잰2.안, JSON.stringify(잰2))
    await p.evaluate(() => scrollTo(0, 0)); await 쉼(300)
    await p.locator('.nm-golist').click()
    const 목록옴 = await 기다림(p, () => p.evaluate(() => { const r = document.querySelector('.nm-bar').getBoundingClientRect(); return r.top >= -2 && r.top < innerHeight / 2 }), 4000)
    봄('③ «목록 ↓» → 목록이 화면에', 목록옴, String(await p.evaluate(() => Math.round(document.querySelector('.nm-bar').getBoundingClientRect().top))))
    await p.evaluate(() => scrollTo(0, 0)); await 쉼(200)

    /* ── ④ 핀 ── */
    const 큰곳 = [...전남곳].map((k) => [k, 전남.filter((r) => r.k === k).length]).sort((a, b) => b[1] - a[1])[0]
    const 이핀 = p.locator('.nm-pin', { hasText: String(큰곳[1] > 999 ? '999+' : 큰곳[1]) }).first()
    await 이핀.scrollIntoViewIfNeeded(); await 이핀.click()
    await 쉼(500)
    봄('④ 핀 → 그 시 · 군 목록 수', (await 제목수(p)) === 큰곳[1] && 길(p).includes('k=' + 큰곳[0]), `${await 제목수(p)} / ${큰곳[1]} · ${길(p)}`)
    봄('④ «전남 전체 보기»', (await p.locator('.nm-x').innerText()).includes('전남 전체 보기'))
    if (캡처) { await p.evaluate(() => scrollTo(0, 0)); await p.screenshot({ path: `${캡처}/${이름}_2전남핀.png` }) }

    /* ── ⑤ 카드 ── */
    const 첫 = p.locator('.nm-cards > li').first()
    const 첫no = (await 첫.getAttribute('id')).replace(/^nm-/, '')
    const 첫줄 = 전남.find((r) => r.no === 첫no)
    await 첫.locator('.nm-ch').click(); await 쉼(300)
    봄('⑤ 카드 펼침 · 발주처 · 주소 no=', (await 첫.locator('.nm-body').count()) === 1 && (await 첫.locator('dt', { hasText: '발주처' }).count()) === 1 && 길(p).includes('no=' + 첫no))
    const 공고 = await 첫.locator('a', { hasText: '공고 보기' }).getAttribute('href')
    봄('⑤ 📄 공고 보기 → /notice/{번호}', 공고 === '/notice/' + encodeURIComponent(첫no), 공고)
    if (첫줄 && 첫줄.s === 0) {
      봄('⑤ 💰 바로투찰 → /?no=', (await 첫.locator('a', { hasText: '바로투찰' }).getAttribute('href')) === '/?no=' + encodeURIComponent(첫no))
      await 첫.locator('button', { hasText: '담기' }).click(); await 쉼(200)
      const 바구니 = await p.evaluate(() => JSON.parse(localStorage.getItem('kcm_basket') || '[]'))
      봄('⑤ ☆ 담기 → ★ 담음 · 바구니에 들어감', (await 첫.locator('button', { hasText: '담음' }).count()) === 1 && 바구니.includes(첫no))
      await 첫.locator('button', { hasText: '담음' }).click(); await 쉼(200)
      봄('⑤ 다시 누르면 뺌', !(await p.evaluate(() => JSON.parse(localStorage.getItem('kcm_basket') || '[]'))).includes(첫no))
    } else {
      봄('⑤ 마감 지난 공사는 바로투찰 · 담기 없음', (await 첫.locator('a', { hasText: '바로투찰' }).count()) === 0 && (await 첫.locator('button', { hasText: '담기' }).count()) === 0)
    }
    await 첫.locator('button', { hasText: '공유' }).click()
    const 알림 = await 기다림(p, async () => (await p.locator('.nm-toast').count()) === 1, 3000)
    const 글 = await p.evaluate(() => navigator.clipboard.readText()).catch(() => '')
    봄('⑤ 🔗 공유 → 복사 알림 · 공사명 · /map/전남 · no=', 알림 && 글.includes(첫줄 ? 첫줄.이름 : '@@') && 글.includes('/map/' + encodeURIComponent('전남')) && 글.includes('no=' + 첫no), 글.split('\n').slice(-1)[0])
    if (캡처) { await 첫.scrollIntoViewIfNeeded(); await p.screenshot({ path: `${캡처}/${이름}_3카드.png` }) }
    await p.locator('.nm-x').click(); await 쉼(300)
    봄('④ 전체 보기 → k 빠짐', (await 제목수(p)) === 전남.length && !길(p).includes('k='), 길(p))

    /* ── ⑥ 금액 · 찾기 ── */
    await p.locator('.nm-chip', { hasText: '10억 넘게' }).click(); await 쉼(300)
    const 큰수 = 거르기(전남, { 단계: 모두, 금액: 'l' }).length
    봄('⑥ 10억 넘게 = 자료로 센 수 · a=l', (await 제목수(p)) === 큰수 && 길(p).includes('a=l'), `${await 제목수(p)} / ${큰수}`)
    await p.locator('.nm-chip', { hasText: '금액 전체' }).click(); await 쉼(200)
    const 낱말 = (() => { const c = {}; for (const r of 전남) for (const w of r.이름.split(/\s+/)) if (w.length >= 2) c[w] = (c[w] || 0) + 1; return Object.entries(c).sort((a, b) => b[1] - a[1]).find(([, n]) => n >= 3 && n < 전남.length / 2)[0] })()
    await p.locator('.nm-q').fill(낱말); await 쉼(400)
    const 찾은수 = 거르기(전남, { 단계: 모두, 찾기: 낱말 }).length
    봄(`⑥ 찾기 «${낱말}» = 자료로 센 수 · q=`, (await 제목수(p)) === 찾은수 && 길(p).includes('q=' + 낱말), `${await 제목수(p)} / ${찾은수}`)
    await p.locator('.nm-q').fill(''); await 쉼(300)
    봄('⑥ 찾기 비우면 그대로', (await 제목수(p)) === 전남.length && !길(p).includes('q='))

    /* ── 시도 고르기(위 목록) ── */
    await p.locator('.nm-bar select').first().selectOption('경기'); await 쉼(600)
    await 기다림(p, async () => (await 제목수(p)) === 경기.length)
    봄('③ 시 · 도 목록에서 경기 → /map/경기 · 수', 길(p) === '/map/경기' && (await 제목수(p)) === 경기.length, `${길(p)} ${await 제목수(p)} / ${경기.length}`)
    await 쉼(300)
    const 잰3 = await 핀재기()
    봄('③ 경기(시 · 군 31) 핀도 안 겹침 · 지도 안', 잰3.겹 === 0 && 잰3.안, JSON.stringify(잰3))
    if (캡처) { await p.evaluate(() => scrollTo(0, 0)); await p.locator('.nm-hero').screenshot({ path: `${캡처}/${이름}_5경기.png` }) }
    await p.evaluate(() => scrollTo(0, 0))
    await p.locator('.nm-back').click(); await 쉼(400)
    봄('③ «← 전국» → /map · 시도 고르기', 길(p) === '/map' && (await p.locator('.nm-sido').count()) === 1, 길(p))
    봄('⑫ 화면 오류 없음(①~⑥)', 오류.length === 0, 오류.join(' / '))
    await c.close()
  }

  /* ── ⑦ 뒤로가기 · ⑩ 구인구직 링크 ── */
  {
    const { c, p, 오류 } = await 판(크기, 이름)
    await p.goto(주소 + '/jobs', { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('.sites-map', { timeout: 20000 }).catch(() => {})
    await 치우기(p)
    봄('⑩ 구인구직 «🗺 지도로 보기» → /map?s=2', (await p.locator('.sites-map').getAttribute('href')) === '/map?s=2')
    await p.locator('.sites-map').click()
    await p.waitForSelector('.nm-stb', { timeout: 20000 }).catch(() => {})
    await 쉼(500)
    봄('⑩ 곧 착공만 켜짐', (await p.locator('.nm-stb.on').count()) === 1 && (await p.locator('.nm-stb.on').innerText()).includes('곧 착공') && 길(p) === '/map?s=2', 길(p))
    await p.locator('.nm-sido button', { hasText: '전남' }).click(); await 쉼(700)
    const 핀 = p.locator('.nm-pin').first()
    await 핀.scrollIntoViewIfNeeded(); await 핀.click(); await 쉼(600)
    const 곳주소 = 길(p)
    봄('⑦ 전남 → 시 · 군 (주소 k=)', 곳주소.startsWith('/map/전남?') && 곳주소.includes('k='), 곳주소)
    await p.goBack(); await 쉼(600)
    봄('⑦ 뒤로 → 전남(시 · 군 풀림)', 길(p) === '/map/전남?s=2' && (await p.locator('.nm-x').count()) === 0 && (await 제목수(p)) === 거르기(전남, { 단계: new Set([2]) }).length, `${길(p)} ${await 제목수(p)}`)
    await p.goBack(); await 쉼(600)
    봄('⑦ 뒤로 → 전국', 길(p) === '/map?s=2' && (await p.locator('.nm-sido').count()) === 1, 길(p))
    await p.goForward(); await 쉼(600)
    봄('⑦ 앞으로 → 다시 전남', 길(p) === '/map/전남?s=2' && (await p.locator('.nm-h').first().innerText()).includes('전남'), 길(p))
    await p.goBack(); await 쉼(400); await p.goBack(); await 쉼(800)
    봄('⑦ 뒤로 → 들어온 곳(구인구직)', 길(p) === '/jobs', 길(p))
    봄('⑫ 화면 오류 없음(⑦ ⑩)', 오류.length === 0, 오류.join(' / '))
    await c.close()
  }
  {
    const { c, p, 오류 } = await 판(크기, 이름, { kcm_region: '전남' })
    await p.goto(주소 + '/jobs', { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('.sites-map', { timeout: 20000 }).catch(() => {})
    봄('⑩ 지역(전남) 골랐으면 → /map/전남?s=2', decodeURIComponent(await p.locator('.sites-map').getAttribute('href')) === '/map/전남?s=2')
    봄('⑫ 화면 오류 없음(구인구직)', 오류.length === 0, 오류.join(' / '))
    await c.close()
  }

  /* ── ⑩-2 맵톡 · 공고 · 1순위에서 가는 길(G756 소장님 「현황판 어디서 볼 수 있지?」) ── */
  /* 🗺 G778 (11-19) 1순위 · 분석 = 두 칸 단추 옆 빈자리(.fa-map) · 공고 = 제목 줄 작은 단추 + 설명글(.sites-mapbtn) — 소장님 「빈 공간이 있잖아」 · 「작고 안전하게 1로」 */
  for (const [경로, 고리글, 기대, 켜짐] of [['/live', '.sites-mapbtn', '/map?s=0', '입찰 중'], ['/first', '.fa-map', '/map?s=2', '곧 착공'], ['/analysis', '.fa-map', '/map?s=2', '곧 착공'], ['/qna', '.mt-golink', '/map', '']]) {
    const { c, p, 오류 } = await 판(크기, 이름)
    await p.goto(주소 + 경로, { waitUntil: 'domcontentloaded' })
    await p.waitForSelector(고리글, { timeout: 20000 }).catch(() => {})
    await 치우기(p)
    const 고리 = p.locator(고리글).first()
    const 있음 = (await 고리.count()) === 1
    봄(`⑩ ${경로} 가는 길 → ${기대}`, 있음 && (await 고리.getAttribute('href')) === 기대, 있음 ? await 고리.getAttribute('href') : '없음')
    if (있음 && 고리글 !== '.mt-golink') {
      /* 🗺 G778 설명글 · 자리 — PC 는 두 칸 단추와 한 줄(오른쪽) · 폰(640 아래)은 두 칸 아래 · 공고는 제목 줄 안 */
      const 자 = await p.evaluate((sel) => { const a = document.querySelector(sel), s = document.querySelector('.fa-seg'), t = a.closest('.sec-title')
        const r = a.getBoundingClientRect(), q = s ? s.getBoundingClientRect() : null
        return { 글: a.innerText.replace(/\s+/g, ' '), 가운데: r.y + r.height / 2, 왼: r.x, 칸가운데: q ? q.y + q.height / 2 : null, 칸오른: q ? q.right : null, 칸아래: q ? q.bottom : null, 위: r.y, 제목안: !!t,
          옛글: document.querySelectorAll('.fb-head .sites-map').length } }, 고리글)
      봄(`⑩ ${경로} 단추 + 설명글`, /🗺 지도로 보기/.test(자.글) && /시 · 도 지도로/.test(자.글), 자.글)
      if (고리글 === '.fa-map') {
        if (크기.width > 640) 봄(`⑩ ${경로} 두 칸 단추와 한 줄 · 오른쪽 빈자리`, Math.abs(자.가운데 - 자.칸가운데) < 8 && 자.왼 >= 자.칸오른, JSON.stringify(자))
        else 봄(`⑩ ${경로} 폰 — 두 칸 단추 아래`, 자.위 >= 자.칸아래 - 1, JSON.stringify(자))
        봄(`⑩ ${경로} 1순위 제목 줄 옛 «지도로 보기» 글 없음(한 곳만)`, 자.옛글 === 0)
      } else 봄(`⑩ ${경로} 제목 줄 안`, 자.제목안)
    }
    if (있음) {
      const 상자 = await 고리.boundingBox()
      봄(`⑩ ${경로} 단추가 화면 안 · 안 잘림`, 상자 && 상자.x >= 0 && 상자.x + 상자.width <= 크기.width + 1 && 상자.width > 40, JSON.stringify(상자 && { x: Math.round(상자.x), w: Math.round(상자.width) }))
      await 고리.click()
      await p.waitForSelector('.nm-stb', { timeout: 20000 }).catch(() => {})
      await 쉼(500)
      const 켠 = await p.locator('.nm-stb.on').allInnerTexts()
      봄(`⑩ ${경로} → 현황판 열림${켜짐 ? ' · ' + 켜짐 + '만 켜짐' : ' · 셋 다 켜짐'}`, 길(p) === 기대 && (켜짐 ? 켠.length === 1 && 켠[0].includes(켜짐) : 켠.length === 3), `${길(p)} · ${켠.length}`)
    }
    봄(`⑫ 화면 오류 없음(${경로})`, 오류.length === 0, 오류.join(' / '))
    await c.close()
  }
  {
    const { c, p, 오류 } = await 판(크기, 이름, { kcm_region: '전남' })
    await p.goto(주소 + '/qna', { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('.mt-golink', { timeout: 20000 }).catch(() => {})
    봄('⑩ 맵톡 — 지역(전남) 골랐으면 → /map/전남', decodeURIComponent((await p.locator('.mt-golink').getAttribute('href')) || '') === '/map/전남')
    const 겹침 = await p.evaluate(() => { const a = document.querySelector('.mt-golink'), b = document.querySelector('.mt-compose'); if (!a || !b) return 0; const x = a.getBoundingClientRect(), y = b.getBoundingClientRect(); return x.bottom > y.top && x.top < y.bottom && x.right > y.left && x.left < y.right ? 1 : 0 })
    봄('⑩ 맵톡 — 단추가 글쓰기 칸과 안 겹침', 겹침 === 0)
    if (캡처) await p.locator('.mt-hero').screenshot({ path: `${캡처}/${이름}_6맵톡.png` })
    봄('⑫ 화면 오류 없음(맵톡 지역)', 오류.length === 0, 오류.join(' / '))
    await c.close()
  }

  /* ── ⑧ 공유 주소로 바로 열기 ── */
  {
    const 뒤쪽 = 전남.filter((r) => r.k).slice(-1)[0]        // 목록 뒤쪽(화면 밖) 공사
    const { c, p, 오류 } = await 판(크기, 이름)
    await p.goto(`${주소}/map/${encodeURIComponent('전남')}?k=${뒤쪽.k}&no=${뒤쪽.no}`, { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('#nm-' + 뒤쪽.no, { timeout: 20000 }).catch(() => {})
    await 쉼(1500)
    await 치우기(p)
    const 상태 = await p.evaluate((id) => { const e = document.getElementById(id); if (!e) return null; const r = e.getBoundingClientRect(); return { 열림: e.classList.contains('open'), 안: r.top < innerHeight && r.bottom > 0 } }, 'nm-' + 뒤쪽.no)
    봄('⑧ 공유 주소 → 그 카드 펼침 · 화면 안', 상태 && 상태.열림 && 상태.안, JSON.stringify(상태))
    if (캡처) await p.screenshot({ path: `${캡처}/${이름}_4공유열기.png` })
    봄('⑫ 화면 오류 없음(⑧)', 오류.length === 0, 오류.join(' / '))
    await c.close()
  }

  /* ── ⑨ 내 지역 · 내 면허 ── */
  {
    const { c, p, 오류 } = await 판(크기, 이름, { kcm_region: '전남', kcm_liccodes: JSON.stringify(['0001']) })
    await p.goto(주소 + '/map', { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('.nm-pin', { timeout: 20000 }).catch(() => {})
    await 치우기(p)
    const 칩 = p.locator('.nm-chip', { hasText: '내 지역' })
    봄('⑨ 📍 내 지역 전남 칩', (await 칩.count()) === 1 && (await 칩.innerText()).includes('전남'))
    봄('⑨ 시도 고르기에서 내 지역 표시', (await p.locator('.nm-sido button.mine').innerText()).includes('전남'))
    await 칩.click(); await 쉼(700)
    봄('⑨ 칩 → /map/전남', 길(p) === '/map/전남' && (await 제목수(p)) === 전남.length, 길(p))
    await p.locator('.nm-chip', { hasText: '내 면허만' }).click(); await 쉼(300)
    const 면허수 = 거르기(전남, { 단계: 모두, 면허: ['0001'] }).length
    봄('⑨ 🪪 내 면허만(토목 0001) = 자료로 센 수', (await 제목수(p)) === 면허수, `${await 제목수(p)} / ${면허수}`)
    봄('⑫ 화면 오류 없음(⑨)', 오류.length === 0, 오류.join(' / '))
    await c.close()
  }
  {
    const { c, p, 오류 } = await 판(크기, 이름)
    await p.goto(주소 + '/map', { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('.nm-pin', { timeout: 20000 }).catch(() => {})
    await 치우기(p)
    봄('⑨ 내 지역 없으면 «📍 내 지역 정하기» · 면허 없으면 «내 면허만» 없음', (await p.locator('.nm-mine select').count()) === 1 && (await p.locator('.nm-chip', { hasText: '내 면허만' }).count()) === 0)
    await p.locator('.nm-mine select').selectOption('경기'); await 쉼(800)
    봄('⑨ 정하기(경기) → 저장 · /map/경기 · 칩', (await p.evaluate(() => localStorage.getItem('kcm_region'))) === '경기' && 길(p) === '/map/경기' && (await p.locator('.nm-chip', { hasText: '내 지역 경기' }).count()) === 1, 길(p))
    봄('⑫ 화면 오류 없음(⑨ 정하기)', 오류.length === 0, 오류.join(' / '))
    await c.close()
  }

  /* ── ⑪ 자료 없음 · 못 받음 ── */
  for (const [꼴, 줄] of [['자료 없음', { at: 합.at, n: [0, 0, 0], 시도: {}, 곳: {}, 새: [], 큰: [], 모름: 0 }], ['못 받음', null]]) {
    const { c, p, 오류 } = await 판(크기, 이름)
    await p.route(/\/data\/now\/sum\.json/, (r) => (줄 ? r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(줄) }) : r.fulfill({ status: 404, body: 'x' })))
    await p.goto(주소 + '/map', { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('.nm-sido', { timeout: 20000 }).catch(() => {})
    await 쉼(1200)
    const 글 = await p.locator('.nm').innerText()
    봄(`⑪ ${꼴} — 핀 0 · ${줄 ? '«맞는 공사가 없습니다»' : '«자료를 받지 못했습니다»'}`, (await p.locator('.nm-pin').count()) === 0 && 글.includes(줄 ? '고른 조건에 맞는 공사가 없습니다' : '자료를 받지 못했습니다'))
    봄(`⑫ 화면 오류 없음(⑪ ${꼴})`, 오류.length === 0, 오류.join(' / '))
    await c.close()
  }
}
await 브.close()
console.log(`\n${실패 ? '❌' : '✅'} 공사 현황판 화면 ${통과}/${통과 + 실패}`)
process.exit(실패 ? 1 : 0)
