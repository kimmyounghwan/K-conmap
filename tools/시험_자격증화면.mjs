/**
 * 📚 G625 자격증 탭 화면 시험 — 구운 사이트(dist)를 띄운 뒤:
 *   node tools/시험_자격증화면.mjs [주소=http://127.0.0.1:4578]
 *   소장님(11-09) 「탭을 하나 만들어서 …」 · 「핸폰에서도 볼 수 있게」 · 「이용자가 최대한 편하게」 · 「검색 되게 해줘」 · 「토목, 건축 관련 자격증만」 ·
 *                 「초급, 중급, 고급., 특급 기술자 수첩」 · 「분석을 1순위 안으로 넣으면 어떻게 넣을거지??」 → 두 칸 단추 → 「그래. 이렇게 하자.」
 *   ① 아래 탭 — 📚 자격증 있음 · «분석» 탭 없음 · 탭 10개 · /analysis · /corp 에서는 1순위 탭에 불
 *   ② 1순위 맨 위 두 칸 단추 — 분석으로 가고 돌아옴(주소 /analysis · /first)
 *   ③ /cert — 토목 · 건축 · 건설안전 지도 · 찾기(«거푸집» → 거푸집기능사만 · «특급» → 등급 셈 줄) · ?q= 로 찾은 채 열림
 *   ④ /cert/grade — 고르면 점수 · 등급이 lib/등급셈.js 와 같음(기술사 · 4년제 · 현장대리인 6년 → 특급 등) · 새로고침해도 그대로(이 기기)
 *   ⑤ 빠른 찾기(🔎) «특급» → 건설기술인 등급 셈 · «토목기사» → 자격증
 *   ⑥ 폰 390 · 360 · PC 1280 넘침 0 · 오류 0 · 구운 쪽(/cert.html · /cert/grade.html · 기술사 19쪽) 제목 · h1
 *   ⑦ 기술사 깊은 글(토목시공 · 건축시공 · 건설안전 · 토질및기초 · 해양) — h1 · 사실 칸 · 시험과목 · 응시자격 11줄 · 큐넷 그 종목 링크 · 등급 셈 링크
 *   ⑧ 깊은 글 없는 종목 칩 → 큐넷 그 종목(새 창 · ↗) · 2027 새 종목(건축구조기사) «2027. 1. 1.부터» 표시
 *   ⑩ G626(11-10) 기능사 깊은 글(거푸집 — 실기만 · 콘크리트 — 필기 + 복합형 실기 · 전산응용건축제도) — h1 · 사실 6칸 · 시험 표 5줄 · «제한 없음» · 다음 단계 2줄 · 큐넷 · 등급 셈
 *   ⑨ 등급 셈 «그 밖» — 일한 분야가 다름 → 초급까지 · 감점 3 → 3점 빠짐(lib 와 같음)
 *   ⑪ G628(11-10) 토목기사 깊은 글(시험 표 6줄 · 응시자격 10줄 · 📝 예상문제 단추) → /cert/tomok-gisa/quiz — 과목 · 문제 수 고르기 · 한 문제씩 바로 채점(⭕ 하나 · 고른 ❌) ·
 *      풀이 · 근거 · 결과(과목별 점수 · 6과목이면 모의 판정) · 틀린 문제 = 이 브라우저(id · 씨앗)에 모임 → lib 로 다시 만든 문제와 같음 · 다시 풀어 맞히면 빠짐 ·
 *      PC 숫자 1 ~ 4 · Enter · 틀린 문제 비우기(두 번 눌러야) · 넘침 0 · 소장님 「최신기출문제도 해줘. 예상문제도 해주고…」
 * 인터넷 안 부름(파이어베이스 · 광고 · 애널리틱스 막음).
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as G from '../web/src/lib/등급셈.js'
import * as Q from '../web/src/lib/예상문제.js'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4578'
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 300))) }
const b = await chromium.launch()
const UA폰 = 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
async function 새쪽(w, h, 폰 = true) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, acceptDownloads: false, ...(폰 ? { userAgent: UA폰 } : {}) })
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  await ctx.route(/firebaseio\.com|firebasedatabase\.app|identitytoolkit|securetoken/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await ctx.addInitScript(() => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) { /* 없음 */ } })
  const p = await ctx.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  return { ctx, p, 오류 }
}
const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
const 쉬어 = (ms) => new Promise((r) => setTimeout(r, ms))
const 탭들 = (p) => p.evaluate(() => [...document.querySelectorAll('nav a, .tabbar a, .bottomnav a, .navbar a')].map((a) => ({ t: a.innerText.replace(/\s+/g, ' ').trim(), on: a.className.includes('on') || a.getAttribute('aria-current') === 'page' })).filter((x) => x.t))
const 점수 = (p) => p.evaluate(() => ({ 점: (document.querySelector('.go-n') || {}).innerText || '', 등급: (document.querySelector('.go-g') || {}).innerText || '' }))
const 칩누르기 = (p, 줄, 글) => p.evaluate(([줄, 글]) => {
  const f = [...document.querySelectorAll('.grade-in .field')].find((x) => (x.querySelector('label') || {}).innerText.startsWith(줄))
  const c = f && [...f.querySelectorAll('button.chip')].find((x) => x.innerText.startsWith(글))
  if (c) c.click()
  return !!c
}, [줄, 글])

for (const [이름, w, h, 폰] of [['폰 390', 390, 844, true], ['폰 360', 360, 780, true], ['PC 1280', 1280, 900, false]]) {
  console.log(`■ ${이름}`)
  const { ctx, p, 오류 } = await 새쪽(w, h, 폰)
  /* ① ② */
  await p.goto(BASE + '/first', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.fa-seg', { timeout: 20000 })
  await 쉬어(600)
  const t1 = await 탭들(p)
  const 이름들 = t1.map((x) => x.t)
  ok('① 탭 — 📚 자격증 있음 · «분석» 탭 없음', 이름들.some((x) => /자격증/.test(x)) && !이름들.some((x) => /^🔍?\s*분석$/.test(x)), 이름들)
  ok('② 1순위 맨 위 두 칸 — «1순위 현황판» 켜짐 · «발주기관 · 업체 분석»', await p.evaluate(() => {
    const a = [...document.querySelectorAll('.fa-seg a')]
    return a.length === 2 && a[0].className.includes('on') && /1순위 현황판/.test(a[0].innerText) && /발주기관 · 업체 분석/.test(a[1].innerText)
  }))
  await p.click('.fa-seg a:nth-child(2)')
  await p.waitForURL(/\/analysis/, { timeout: 10000 })
  await 쉬어(500)
  ok('② 분석 단추 → /analysis · 두 칸 단추에 분석 켜짐', await p.evaluate(() => location.pathname === '/analysis' && (document.querySelector('.fa-seg a.on') || {}).innerText.includes('분석')))
  const t2 = await 탭들(p)
  ok('① /analysis 에서 1순위 탭에 불', t2.some((x) => /1순위/.test(x.t) && x.on), t2)
  await p.click('.fa-seg a:nth-child(1)')
  await p.waitForURL(/\/first/, { timeout: 10000 })
  ok('② 분석 → 1순위로 돌아옴', await p.evaluate(() => location.pathname === '/first'))
  /* ③ */
  await p.goto(BASE + '/cert', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.cert-map', { timeout: 20000 })
  await 쉬어(400)
  const 지도 = await p.evaluate(() => ({ 갈래: [...document.querySelectorAll('.cert-map .sec-title')].map((x) => x.innerText.split('\n')[0].trim()), 칩: document.querySelectorAll('.cert-chip').length,
    h1: (document.querySelector('h1') || {}).innerText || '' }))
  ok('③ /cert — h1 · 토목 · 건축 · 건설안전 지도 · 종목 칩 83개', /토목 · 건축 자격증/.test(지도.h1) && 지도.갈래.length === 3 && 지도.칩 === 83, 지도)
  const 칩꼴 = await p.evaluate(() => ({ 깊은: document.querySelectorAll('a.cert-chip.deep').length,
    토목기사: (() => { const a = [...document.querySelectorAll('a.cert-chip')].find((x) => x.innerText.replace(/[↗›\s]/g, '') === '토목기사'); return a ? [a.getAttribute('href'), a.getAttribute('target')] : null })(),
    건축기사: (() => { const a = [...document.querySelectorAll('a.cert-chip')].find((x) => x.innerText.replace(/[↗›\s]/g, '') === '건축기사'); return a ? [a.getAttribute('href'), a.getAttribute('target')] : null })(),
    새: (() => { const c = [...document.querySelectorAll('.cert-chip')].find((x) => x.innerText.startsWith('건축구조기사')); return c ? c.innerText.replace(/\s+/g, ' ') : '' })() }))
  ok('⑧ 깊은 글 칩 49(기술사 19 · 기능사 29 · 토목기사) · 토목기사 칩 → 깊은 글 · 건축기사 칩 → 큐넷 그 종목(jmCd 1630 · 새 창) · 건축구조기사 «2027. 1. 1.부터»', 칩꼴.깊은 === 49 && 칩꼴.토목기사 && 칩꼴.토목기사[0] === '/cert/tomok-gisa' && !칩꼴.토목기사[1]
    && 칩꼴.건축기사 && /q-net\.or\.kr\/crf005\.do\?id=crf00503&jmCd=1630$/.test(칩꼴.건축기사[0]) && 칩꼴.건축기사[1] === '_blank' && /2027\. 1\. 1\.부터/.test(칩꼴.새), 칩꼴)
  ok('⑪ /cert 기출 칸 — «토목기사 예상문제» 줄(→ /cert/tomok-gisa/quiz)', await p.evaluate(() => [...document.querySelectorAll('a.row[href="/cert/tomok-gisa/quiz"]')].some((a) => /토목기사 예상문제/.test(a.innerText))))
  ok('③ 탭 — 자격증에 불', (await 탭들(p)).some((x) => /자격증/.test(x.t) && x.on))
  await p.fill('.cert-q', '거푸집')
  await 쉬어(200)
  ok('③ 찾기 «거푸집» → 거푸집기능사만', await p.evaluate(() => [...document.querySelectorAll('.cert-chip')].map((x) => x.innerText.replace(/[↗›]/g, '').trim()).join() === '거푸집기능사'))
  await p.fill('.cert-q', '특급')
  await 쉬어(200)
  ok('③ 찾기 «특급» → 등급 셈 줄', await p.evaluate(() => [...document.querySelectorAll('a[href="/cert/grade"]')].some((x) => /등급 셈/.test(x.innerText) && x.closest('.row'))))
  await p.goto(BASE + '/cert?q=' + encodeURIComponent('토목기사'), { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.cert-q', { timeout: 20000 })
  await 쉬어(300)
  ok('③ /cert?q=토목기사 — 찾은 채 열림', await p.evaluate(() => document.querySelector('.cert-q').value === '토목기사' && [...document.querySelectorAll('.cert-chip')].some((x) => x.innerText.replace(/[↗›]/g, '').trim() === '토목기사')))
  ok(`${이름} /cert 넘침 0`, (await 넘침(p)) <= 1, await 넘침(p))
  /* ④ 등급 셈 */
  await p.evaluate(() => { try { localStorage.removeItem('kcm.등급셈') } catch (e) { /* 없음 */ } })
  await p.goto(BASE + '/cert/grade', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.grade-out', { timeout: 20000 })
  await 쉬어(300)
  const 처음 = G.등급셈({ 갈래: 'sg', 자격: 'eng', 학력: 'ba', 대학원: '없음', 경력: [{ 년: 3, 책임: 'g' }] })
  const s0 = await 점수(p)
  ok(`④ 처음(기사 · 학사 · 참여 3년) = ${처음.합}점 ${처음.등급}`, Number(s0.점) === 처음.합 && s0.등급 === 처음.등급, s0)
  ok('④ 자격 «기술사 · 건축사» 누름', await 칩누르기(p, '자격', '기술사'))
  await p.fill('.grade-row input >> nth=0', '6')
  await p.selectOption('.grade-row select >> nth=0', 'site')
  await 쉬어(200)
  const 기대 = G.등급셈({ 갈래: 'sg', 자격: 'pe', 학력: 'ba', 대학원: '없음', 경력: [{ 년: 6, 책임: 'site' }] })
  const s1 = await 점수(p)
  ok(`④ 기술사 · 학사 · 현장대리인 6년 = ${기대.합}점 ${기대.등급}`, Number(s1.점) === 기대.합 && s1.등급 === 기대.등급, [s1, 기대.합])
  ok('④ 갈래 «건설사업관리» — 경계가 달라 점수 · 등급 다시', await 칩누르기(p, '직무 갈래', '건설사업관리'))
  await 쉬어(200)
  const 기대cm = G.등급셈({ 갈래: 'cm', 자격: 'pe', 학력: 'ba', 대학원: '없음', 경력: [{ 년: 6, 책임: 'site' }] })
  const s2 = await 점수(p)
  ok(`④ 건설사업관리 = ${기대cm.합}점 ${기대cm.등급}`, Number(s2.점) === 기대cm.합 && s2.등급 === 기대cm.등급, [s2, 기대cm])
  await p.reload({ waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.grade-out', { timeout: 20000 })
  await 쉬어(300)
  const s3 = await 점수(p)
  ok('④ 새로고침해도 그대로(이 기기에 남음)', s3.점 === s2.점 && s3.등급 === s2.등급, s3)
  ok('④ 경력수첩 단락(#suchup) · 근거(법제처) 있음', await p.evaluate(() => !!document.getElementById('suchup') && /법제처/.test(document.body.innerText) && /건설기술경력증/.test(document.getElementById('suchup').innerText)))
  /* ⑨ 그 밖 — 다른 분야 · 감점 */
  const 그밖 = (글) => p.evaluate((글) => { const f = [...document.querySelectorAll('.grade-in .field')].find((x) => (x.querySelector('label') || {}).innerText.startsWith('그 밖')); const c = f && [...f.querySelectorAll('button.chip')].find((x) => x.innerText.startsWith(글)); if (c) c.click(); return !!c }, 글)
  ok('⑨ «일한 분야가 자격 · 학과 분야와 다름» 누름', await 그밖('일한 분야'))
  await 쉬어(200)
  const 기대다 = G.등급셈({ 갈래: 'cm', 자격: 'pe', 학력: 'ba', 대학원: '없음', 경력: [{ 년: 6, 책임: 'site' }], 다른분야: true })
  const s4 = await 점수(p)
  ok(`⑨ 다른 분야 → ${기대다.등급}(점수 ${기대다.합} 그대로) · «초급까지» 글`, Number(s4.점) === 기대다.합 && s4.등급 === 기대다.등급 && /초급까지/.test(await p.evaluate(() => document.querySelector('.grade-out').innerText)), [s4, 기대다.등급])
  await 그밖('일한 분야')
  ok('⑨ 감점 «업무정지 3개월 넘음 −3» 누름', await 그밖('업무정지 3개월 넘음'))
  await 쉬어(200)
  const 기대감 = G.등급셈({ 갈래: 'cm', 자격: 'pe', 학력: 'ba', 대학원: '없음', 경력: [{ 년: 6, 책임: 'site' }], 감점: 3 })
  const s5 = await 점수(p)
  ok(`⑨ 감점 3 → ${기대감.합}점 ${기대감.등급}`, Number(s5.점) === 기대감.합 && s5.등급 === 기대감.등급, [s5, 기대감.합])
  await 그밖('건설사고 감점 없음')
  ok(`${이름} /cert/grade 넘침 0`, (await 넘침(p)) <= 1, await 넘침(p))
  /* ⑤ 빠른 찾기 */
  const 단추 = await p.$('[aria-label*="찾기"], .qfind-btn, button[title*="찾기"]')
  if (단추) {
    await 단추.click()
    await p.waitForSelector('input', { timeout: 5000 })
    await 쉬어(300)
    await p.keyboard.type('특급')
    await 쉬어(600)
    ok('⑤ 빠른 찾기 «특급» → 건설기술인 등급 셈', await p.evaluate(() => /건설기술인 등급 셈/.test(document.body.innerText)))
    await p.keyboard.press('Escape').catch(() => {})
  } else ok('⑤ 빠른 찾기 단추 찾음', false)
  /* ⑦ 기술사 깊은 글 */
  for (const [slug, 이름2, 과목, q] of [['tomok-sigong-gisulsa', '토목시공기술사', '시공계획', '0480'], ['geonchuk-sigong-gisulsa', '건축시공기술사', '공정관리', '0510'], ['geonseol-anjeon-gisulsa', '건설안전기술사', '산업안전관리론', '0740'], ['tojil-gicho-gisulsa', '토질및기초기술사', '토질구조물', '0390'], ['haeyang-gisulsa', '해양기술사', '해양생물', '0700']]) {
    await p.goto(BASE + '/cert/' + slug, { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('.cert-facts', { timeout: 20000 })
    await 쉬어(300)
    const d = await p.evaluate(() => ({ h1: (document.querySelector('h1') || {}).innerText || '', 사실: document.querySelectorAll('.cert-facts > div').length, 글: document.querySelector('main').innerText,
      줄: [...document.querySelectorAll('table.ctab')].map((t) => t.querySelectorAll('tbody tr').length), 큐넷: [...document.querySelectorAll('a[href*="q-net.or.kr"]')].map((a) => a.getAttribute('href')),
      셈: !!document.querySelector('a[href="/cert/grade"]') }))
    ok(`⑦ ${이름2} — h1 · 사실 6칸 · 시험과목 «${과목}» · 응시자격 11줄 · 큐넷 jmCd ${q} · 등급 셈 링크`, d.h1 === 이름2 && d.사실 === 6 && d.글.includes(과목) && d.줄.includes(11) && d.큐넷.some((h) => h.endsWith('jmCd=' + q)) && d.셈,
      { h1: d.h1, 사실: d.사실, 줄: d.줄, 큐넷: d.큐넷.length, 셈: d.셈 })
    ok(`${이름} ${이름2} 넘침 0`, (await 넘침(p)) <= 1, await 넘침(p))
  }
  /* ⑩ 기능사 깊은 글(G626) */
  for (const [slug, 이름2, 과목, q, 실기만] of [['geopujip-gineungsa', '거푸집기능사', '거푸집 작업', '7170', true], ['concrete-gineungsa', '콘크리트기능사', '콘크리트재료', '7020', false], ['jeonsan-geonchuk-jedo-gineungsa', '전산응용건축제도기능사', '건축계획 및 설계도면 작성', '7061', false]]) {
    await p.goto(BASE + '/cert/' + slug, { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('.cert-facts', { timeout: 20000 })
    await 쉬어(300)
    const d = await p.evaluate(() => ({ h1: (document.querySelector('h1') || {}).innerText || '', 사실: document.querySelectorAll('.cert-facts > div').length, 글: document.querySelector('main').innerText,
      줄: [...document.querySelectorAll('table.ctab')].map((t) => t.querySelectorAll('tbody tr').length), 큐넷: [...document.querySelectorAll('a[href*="q-net.or.kr"]')].map((a) => a.getAttribute('href')),
      셈: !!document.querySelector('a[href="/cert/grade"]') }))
    ok(`⑩ ${이름2} — h1 · 사실 6칸 · 시험과목 «${과목}» · 시험 표 5줄 · 다음 단계 2줄 · «제한 없음» · ${실기만 ? '실기만' : '필기 + 실기'} · 큐넷 jmCd ${q} · 등급 셈`,
      d.h1 === 이름2 && d.사실 === 6 && d.글.includes(과목) && d.글.includes('제한 없음') && d.줄.join() === '5,2' && (실기만 ? /실기만\(필기 없음\)/.test(d.글) : /객관식 4지 택일형 60문항/.test(d.글))
        && d.큐넷.some((h) => h.endsWith('jmCd=' + q)) && d.셈, { h1: d.h1, 사실: d.사실, 줄: d.줄, 큐넷: d.큐넷.length, 셈: d.셈 })
    ok(`${이름} ${이름2} 넘침 0`, (await 넘침(p)) <= 1, await 넘침(p))
  }
  /* ⑪ G628 토목기사 · 예상문제 */
  const 오답열쇠 = 'kcm.예상문제.tomok-gisa'
  const 오답들 = () => p.evaluate((k) => { try { return JSON.parse(localStorage.getItem(k) || '[]') } catch (e) { return null } }, 오답열쇠)
  await p.evaluate((k) => { try { localStorage.removeItem(k) } catch (e) { /* 없음 */ } }, 오답열쇠)
  await p.goto(BASE + '/cert/tomok-gisa', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.cert-facts', { timeout: 20000 })
  await 쉬어(300)
  const tg = await p.evaluate(() => ({ h1: (document.querySelector('h1') || {}).innerText || '', 사실: document.querySelectorAll('.cert-facts > div').length, 글: document.querySelector('main').innerText,
    줄: [...document.querySelectorAll('table.ctab')].map((t) => t.querySelectorAll('tbody tr').length), 큐넷: [...document.querySelectorAll('a[href*="q-net.or.kr"]')].map((a) => a.getAttribute('href')),
    셈: !!document.querySelector('a[href="/cert/grade"]'), 퀴즈: (document.querySelector('a.qz-go') || { getAttribute: () => '' }).getAttribute('href') }))
  ok('⑪ 토목기사 — h1 · 사실 6칸 · 6과목 · 시험 표 6줄 · 응시자격 10줄 · 큐넷 jmCd 1250 · 등급 셈 · 📝 예상문제 단추', tg.h1 === '토목기사' && tg.사실 === 6 && tg.글.includes('철근콘크리트 및 강구조')
    && tg.글.includes('19,400원') && tg.줄.join() === '6,10' && tg.큐넷.some((h) => h.endsWith('jmCd=1250')) && tg.셈 && tg.퀴즈 === '/cert/tomok-gisa/quiz', { h1: tg.h1, 사실: tg.사실, 줄: tg.줄, 퀴즈: tg.퀴즈 })
  ok(`${이름} 토목기사 넘침 0`, (await 넘침(p)) <= 1, await 넘침(p))
  await p.click('a.qz-go')
  await p.waitForURL(/\/cert\/tomok-gisa\/quiz$/, { timeout: 10000 })
  await p.waitForSelector('.qz-start', { timeout: 20000 })
  await 쉬어(300)
  const 칩글 = (i) => p.evaluate((i) => [...document.querySelectorAll('.field')][i] ? [...[...document.querySelectorAll('.field')][i].querySelectorAll('button.chip')].map((x) => x.innerText.trim()) : [], i)
  const 칩치기 = (i, 글) => p.evaluate(([i, 글]) => { const c = [...[...document.querySelectorAll('.field')][i].querySelectorAll('button.chip')].find((x) => x.innerText.trim() === 글); if (c) c.click(); return !!c }, [i, 글])
  const 고름0 = await p.evaluate(() => ({ h1: (document.querySelector('h1') || {}).innerText || '', 틀줄: document.querySelectorAll('.qz-types').length, 맛: document.querySelectorAll('details.qz-rv').length,
    시작: document.querySelector('.qz-start').innerText, 큐넷: !!document.querySelector('a[href$="jmCd=1250"]'), 틀린: !!document.querySelector('.qz-wrong') }))
  const 과목칩 = await 칩글(0), 수칩 = await 칩글(1)
  ok('⑪ 예상문제 쪽 — h1 · 과목 칩 7(전체 + 6과목) · 문제 수 6 · 12 · 30 · 들어 있는 문제 6줄 · 맛보기 6 · «6과목 전체 12문제» · 큐넷 · (처음엔 틀린 문제 없음)',
    고름0.h1 === '📝 토목기사 필기 예상문제' && 과목칩.length === 7 && 과목칩[0] === '6과목 전체' && 과목칩[6] === '상하수도공학' && 수칩.join() === '6문제,12문제,30문제' && 고름0.틀줄 === 6 && 고름0.맛 === 6
      && /6과목 전체 12문제/.test(고름0.시작) && 고름0.큐넷 && !고름0.틀린, { ...고름0, 과목칩, 수칩 })
  ok(`${이름} 예상문제(고르기) 넘침 0`, (await 넘침(p)) <= 1, await 넘침(p))
  ok('⑪ 과목 «응용역학» → 문제 수 5 · 10 · 20(기본 10) · «5문제» 고름', (await 칩치기(0, '응용역학')) && (await 칩글(1)).join() === '5문제,10문제,20문제' && /응용역학 10문제/.test(await p.innerText('.qz-start')) && (await 칩치기(1, '5문제')) && /응용역학 5문제/.test(await p.innerText('.qz-start')))
  await p.click('.qz-start')
  const 맞음들 = []
  let 문제꼴 = true
  for (let k = 0; k < 5; k++) {
    await p.waitForSelector('.qz-opt:not([disabled])', { timeout: 10000 })
    const 전 = await p.evaluate(() => ({ n: document.querySelector('.qz-n').innerText, 보기: document.querySelectorAll('.qz-opt').length, 과목: document.querySelector('.qz-top').innerText, 문: document.querySelector('.qz-q').innerText, 풀이: !!document.querySelector('.qz-exp') }))
    if (k === 0) ok(`${이름} 예상문제(한 문제) 넘침 0`, (await 넘침(p)) <= 1, await 넘침(p))
    await p.click('.qz-opt >> nth=0')
    await 쉬어(150)
    const 후 = await p.evaluate(() => ({ ok: document.querySelectorAll('.qz-opt.ok').length, no: document.querySelectorAll('.qz-opt.no').length, 첫: document.querySelector('.qz-opt').className,
      풀이: !!document.querySelector('.qz-exp .qz-steps li'), 근거: /근거 — /.test((document.querySelector('.qz-exp') || {}).innerText || ''), 다음: (document.querySelector('.qz-next') || {}).innerText || '',
      막힘: [...document.querySelectorAll('.qz-opt')].every((x) => x.disabled), 점수: document.querySelector('.qz-score').innerText }))
    const 맞 = 후.첫.includes(' ok')
    맞음들.push(맞)
    const 이꼴 = 전.n === `${k + 1} / 5` && 전.보기 === 4 && /응용역학/.test(전.과목) && 전.문.length > 20 && !전.풀이 && 후.ok === 1 && 후.no === (맞 ? 0 : 1) && (맞 || 후.첫.includes(' no'))
      && 후.풀이 && 후.근거 && 후.막힘 && 후.다음 === (k < 4 ? '다음 문제 →' : '결과 보기 →') && 후.점수 === `맞음 ${맞음들.filter(Boolean).length} / ${k + 1}`
    if (!이꼴) { 문제꼴 = false; console.log('     ', JSON.stringify({ 전, 후 }).slice(0, 400)) }
    await p.click('.qz-next')
  }
  ok('⑪ 다섯 문제 — «k / 5» · 보기 4 · 누르면 ⭕ 하나(정답) · 고른 것이 틀리면 ❌ · 보기 잠김 · 풀이 · 근거 · «다음 문제 →» / 끝은 «결과 보기 →» · 맞음 셈', 문제꼴)
  await p.waitForSelector('.qz-out', { timeout: 10000 })
  const 맞은 = 맞음들.filter(Boolean).length
  const 결과 = await p.evaluate(() => ({ 점: (document.querySelector('.qz-out .go-n') || {}).innerText || '', 줄: [...document.querySelectorAll('.qz-res > div')].map((x) => x.innerText.replace(/\s+/g, ' ').trim()),
    판정: !!document.querySelector('.qz-out .go-g'), 글: document.querySelector('.qz-out').innerText, 되짚기: [...document.querySelectorAll('details.qz-rv summary')].map((x) => x.innerText.trim()),
    다시: [...document.querySelectorAll('.qz-btns button')].map((x) => x.innerText.trim()) }))
  ok(`⑪ 결과 — 응용역학 한 줄 · ${맞은 * 20}점(5문제 중 ${맞은}) · 한 과목이라 모의 판정 없음 · 되짚기 5(⭕ · ❌ 가 푼 그대로)`, Number(결과.점) === 맞은 * 20 && 결과.줄.length === 1 && 결과.줄[0].startsWith('응용역학')
    && !결과.판정 && /한 과목만 풀었습니다/.test(결과.글) && 결과.되짚기.length === 5 && 결과.되짚기.every((t, j) => t.startsWith(맞음들[j] ? '⭕' : '❌')), 결과)
  ok(`${이름} 예상문제(결과) 넘침 0`, (await 넘침(p)) <= 1, await 넘침(p))
  const 모인 = await 오답들()
  const 되만든 = (모인 || []).map((o) => Q.문제(o.id, o.씨))
  const 쪽글 = await p.evaluate(() => [...document.querySelectorAll('details.qz-rv')].map((x) => x.textContent))
  ok(`⑪ 틀린 ${5 - 맞은}문제 = 이 브라우저에 모임(id · 씨앗) · lib 로 다시 만든 문제 · 정답 = 화면에 보인 것`, Array.isArray(모인) && 모인.length === 5 - 맞은
    && 되만든.every((q) => q && q.과목 === '응용역학' && 쪽글.some((t) => t.includes(q.문) && t.includes('정답 ' + '①②③④'[q.답] + ' ' + q.보기[q.답]))), { 모인: (모인 || []).length, 맞은 })
  if (맞은 < 5) {
    ok('⑪ «↺ 틀린 N문제 다시» 단추', 결과.다시[0] === `↺ 틀린 ${5 - 맞은}문제 다시`, 결과.다시)
    await p.click('.qz-btns button >> nth=0')
    let 같음 = true
    for (let k = 0; k < 되만든.length; k++) {
      await p.waitForSelector('.qz-opt:not([disabled])', { timeout: 10000 })
      const 문 = await p.innerText('.qz-q')
      const q = 되만든[k]
      if (문.trim() !== q.문) 같음 = false
      const 자리 = await p.evaluate((t) => [...document.querySelectorAll('.qz-opt .qz-t')].findIndex((x) => x.innerText.trim() === t), q.보기[q.답])
      if (자리 < 0) { 같음 = false; break }
      await p.click(`.qz-opt >> nth=${자리}`)
      await 쉬어(120)
      if (!(await p.evaluate((i) => document.querySelectorAll('.qz-opt')[i].className.includes(' ok'), 자리))) 같음 = false
      await p.click('.qz-next')
    }
    await p.waitForSelector('.qz-out', { timeout: 10000 })
    const 남은 = await 오답들()
    ok('⑪ 틀린 문제 다시 — 같은 문제(같은 씨앗) · 정답 고르면 ⭕ · 다 맞히면 틀린 문제에서 빠짐(0)', 같음 && Array.isArray(남은) && 남은.length === 0, { 같음, 남은: (남은 || []).length })
  } else ok('⑪ 틀린 문제 다시 — (다섯 다 맞아 건너뜀)', true)
  /* 6과목 전체 6문제 — 모의 판정(PC 는 숫자 1 · Enter 로) */
  await p.click('.qz-btns button.ghost')
  await p.waitForSelector('.qz-start', { timeout: 10000 })
  await 칩치기(0, '6과목 전체')
  await 칩치기(1, '6문제')
  await p.click('.qz-start')
  const 맞6 = []
  for (let k = 0; k < 6; k++) {
    await p.waitForSelector('.qz-opt:not([disabled])', { timeout: 10000 })
    if (!폰) { await p.keyboard.press('1'); await 쉬어(120) } else await p.click('.qz-opt >> nth=0')
    await 쉬어(100)
    맞6.push(await p.evaluate(() => document.querySelector('.qz-opt').className.includes(' ok')))
    if (!폰) await p.keyboard.press('Enter'); else await p.click('.qz-next')
    await 쉬어(100)
  }
  await p.waitForSelector('.qz-out', { timeout: 10000 })
  const r6 = await p.evaluate(() => ({ 줄: [...document.querySelectorAll('.qz-res > div > span')].map((x) => x.innerText.trim()), 판정: (document.querySelector('.qz-out .go-g') || {}).innerText || '', 글: document.querySelector('.qz-out').innerText }))
  const 다맞 = 맞6.every(Boolean)
  ok(`⑪ 6과목 6문제${폰 ? '' : '(키보드 1 · Enter)'} — 과목 6줄(차례대로) · 모의 판정 «${다맞 ? '모의 합격' : '모의 불합격'}»(한 과목이라도 0점이면 과락) · «30문제로» 안내`,
    r6.줄.join() === Q.문제집['tomok-gisa'].과목.join() && r6.판정 === (다맞 ? '모의 합격' : '모의 불합격') && (다맞 || /과락/.test(r6.글)) && /30문제로/.test(r6.글), { ...r6, 맞6 })
  /* 틀린 문제 비우기 — 두 번 눌러야 */
  await p.click('.qz-btns button.ghost')
  await p.waitForSelector('.qz-start', { timeout: 10000 })
  const 지금틀린 = (await 오답들()).length
  if (지금틀린 > 0) {
    const w0 = await p.evaluate(() => ({ 단추: (document.querySelector('.qz-wrong .btn') || {}).innerText || '', 비우기: (document.querySelector('.qz-clear') || {}).innerText || '' }))
    await p.click('.qz-clear')
    await 쉬어(100)
    const w1 = await p.evaluate(() => (document.querySelector('.qz-clear') || {}).innerText || '')
    const 아직 = (await 오답들()).length
    await p.click('.qz-clear')
    await 쉬어(150)
    const w2 = await p.evaluate(() => !!document.querySelector('.qz-wrong'))
    ok(`⑪ 고르는 화면 «↺ 틀린 문제 다시 풀기 (${지금틀린})» · 비우기는 두 번(한 번은 «한 번 더 누르면 비웁니다») → 비움`, w0.단추 === `↺ 틀린 문제 다시 풀기 (${지금틀린})` && w0.비우기 === '틀린 문제 비우기'
      && w1 === '한 번 더 누르면 비웁니다' && 아직 === 지금틀린 && !w2 && (await 오답들()).length === 0, { w0, w1, 아직, w2 })
  } else ok('⑪ 틀린 문제 비우기 — (틀린 문제가 없어 건너뜀)', true)
  ok(`${이름} 오류 0`, 오류.length === 0, 오류)
  await ctx.close()
}
/* ⑥ 구운 쪽(prerender 가 돌았으면) */
const 구운 = path.join(ROOT, 'web/dist/cert.html')
if (fs.existsSync(구운)) {
  const h = fs.readFileSync(구운, 'utf8'), g = fs.readFileSync(path.join(ROOT, 'web/dist/cert/grade.html'), 'utf8')
  ok('⑥ 구운 /cert — 제목 «토목 · 건축 자격증 — …» · h1 · 칩', /<title>토목 · 건축 자격증 — /.test(h) && /<h1[^>]*>📚 토목 · 건축 자격증<\/h1>/.test(h) && (h.match(/cert-chip/g) || []).length >= 60)
  ok('⑥ 구운 /cert/grade — 제목 «건설기술인 등급 셈 — 초급 · 중급 · 고급 · 특급 …» · 경력수첩', /<title>건설기술인 등급 셈 — 초급 · 중급 · 고급 · 특급/.test(g) && /id="suchup"/.test(g))
  ok('⑥ 구운 쪽에 «클로드» 없음 · 자격증 글에 «무료» 없음', !/클로드/.test(h + g) && !/무료/.test(fs.readFileSync(path.join(ROOT, 'web/src/data/cert.json'), 'utf8')))
  const 깊은쪽 = fs.readdirSync(path.join(ROOT, 'web/dist/cert')).filter((x) => /-gisulsa\.html$/.test(x))
  const 기능사쪽 = fs.readdirSync(path.join(ROOT, 'web/dist/cert')).filter((x) => /-gineungsa\.html$/.test(x))
  const gp = fs.readFileSync(path.join(ROOT, 'web/dist/cert/geopujip-gineungsa.html'), 'utf8')
  ok('⑥ 구운 기능사 29쪽 · 거푸집기능사 쪽 제목 · h1 · 실기만', 기능사쪽.length === 29 && /<title>거푸집기능사 — /.test(gp) && /<h1[^>]*>거푸집기능사<\/h1>/.test(gp) && /필기 없음/.test(gp), [기능사쪽.length, (gp.match(/<title>[^<]*/) || [''])[0]])
  const ts = fs.readFileSync(path.join(ROOT, 'web/dist/cert/tomok-sigong-gisulsa.html'), 'utf8')
  ok('⑥ 구운 기술사 19쪽 · 토목시공기술사 쪽 제목 · h1 · 시험과목', 깊은쪽.length === 19 && /<title>토목시공기술사/.test(ts) && /<h1[^>]*>토목시공기술사<\/h1>/.test(ts) && /시공계획/.test(ts), [깊은쪽.length, (ts.match(/<title>[^<]*/) || [''])[0]])
  const tk = fs.readFileSync(path.join(ROOT, 'web/dist/cert/tomok-gisa.html'), 'utf8')
  const 퀴즈쪽 = path.join(ROOT, 'web/dist/cert/tomok-gisa/quiz.html')
  const qz = fs.existsSync(퀴즈쪽) ? fs.readFileSync(퀴즈쪽, 'utf8') : ''
  ok('⑪ 구운 토목기사 쪽 — 제목 · h1 · 📝 예상문제 단추 · /cert 에 «토목기사 예상문제» 줄', /<title>토목기사 — /.test(tk) && /<h1[^>]*>토목기사<\/h1>/.test(tk) && /class="cert-big qz-go" href="\/cert\/tomok-gisa\/quiz"/.test(tk) && /href="\/cert\/tomok-gisa\/quiz"><span class="fic">📝/.test(h))
  ok('⑪ 구운 예상문제 쪽(cert/tomok-gisa/quiz.html) — 제목 · h1 · 들어 있는 문제 6과목 · 맛보기 6 · «직접 만든» · 큐넷 · canonical', /<title>토목기사 필기 예상문제 — /.test(qz) && /<h1[^>]*>📝 토목기사 필기 예상문제<\/h1>/.test(qz)
    && (qz.match(/class="qz-types"/g) || []).length === 6 && (qz.match(/<details class="qz-rv">/g) || []).length === 6 && /직접 만든/.test(qz) && /jmCd=1250/.test(qz) && /rel="canonical" href="https:\/\/k-conmap\.com\/cert\/tomok-gisa\/quiz"/.test(qz) && !/클로드|무료/.test(qz.replace(/<script[\s\S]*?<\/script>/g, '')),
    [qz.length, (qz.match(/<title>[^<]*/) || [''])[0]])
}
await b.close()
console.log(`\n${bad ? '❌' : '✅'} 시험_자격증화면 ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
