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
 *   ⑧ G643 모든 종목 칩 83 → 깊은 글(건축기사 → /cert/geonchuk-gisa) · 2027 새 종목(건축구조기사)도 깊은 글 + «2027. 1. 1.부터» 표시
 *   ⑭ G643(11-10) 큐넷 덧 — 건축기사 · 건설안전산업기사 · 건축일반시공기능장 · 거푸집기능사(실기만) · 토목시공기술사(면접) — 차례 칩 = 칸 · 📅 일정 · 📊 합격률 ·
 *      🏅 우대 3칸이 «📝 시험» 바로 뒤 · 일정 표 7칸 · 합격률 막대 = certq 자료(해 · 너비 · 값) · 차례 칩 누르면 그 칸이 위 막대 밑으로 숨지 않고 위에 · 넘침 0 ·
 *      구운 쪽(산업기사 16 · 기능장 3 · 기사 16쪽 · 건축기사 쪽 차례 · data-q 3칸 · 합격률 5줄) · 소장님 「자격증은 다른 사이트와 비교해서 자세하고 편하게」
 *   ⑩ G626(11-10) 기능사 깊은 글(거푸집 — 실기만 · 콘크리트 — 필기 + 복합형 실기 · 전산응용건축제도) — h1 · 사실 6칸 · 시험 표 5줄 · «제한 없음» · 다음 단계 2줄 · 큐넷 · 등급 셈
 *   ⑨ 등급 셈 «그 밖» — 일한 분야가 다름 → 초급까지 · 감점 3 → 3점 빠짐(lib 와 같음)
 *   ⑪ G628(11-10) 토목기사 깊은 글(시험 표 6줄 · 응시자격 10줄 · 📝 예상문제 단추) → /cert/tomok-gisa/quiz — 과목 · 문제 수 고르기 · 한 문제씩 바로 채점(⭕ 하나 · 고른 ❌) ·
 *      풀이 · 근거 · 결과(과목별 점수 · 6과목이면 모의 판정) · 틀린 문제 = 이 브라우저(id · 씨앗)에 모임 → lib 로 다시 만든 문제와 같음 · 다시 풀어 맞히면 빠짐 ·
 *      PC 숫자 1 ~ 4 · Enter · 틀린 문제 비우기(두 번 눌러야) · 넘침 0 · 소장님 「최신기출문제도 해줘. 예상문제도 해주고…」
 *   ⑬ G631(11-10) 🎤 토목시공기술사 면접 준비 — 깊은 글 단추 → /interview · 분야 칩 11 · 질문 150 · 분야 고름 · 찾기 «히빙» · 🎲 하나만 펼침 ·
 *      ✓ 외웠음(이 브라우저 · 새로고침해도 남음) · 외운 것 빼고 보기 · 넘침 0 · 구운 쪽 · 소장님 「기술사 서브노트 … 고쳐서 올려줘」
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
    새: (() => { const c = [...document.querySelectorAll('.cert-chip')].find((x) => x.innerText.startsWith('건축구조기사')); return c ? c.innerText.replace(/\s+/g, ' ') : '' })(),
    새길: (() => { const c = [...document.querySelectorAll('.cert-chip')].find((x) => x.innerText.startsWith('건축구조기사')); return c ? c.getAttribute('href') : '' })() }))
  ok('⑧ 깊은 글 칩 83(모든 종목) · 토목기사 · 건축기사 칩 → 깊은 글 · 건축구조기사(새) → 깊은 글 + «2027. 1. 1.부터»', 칩꼴.깊은 === 83 && 칩꼴.토목기사 && 칩꼴.토목기사[0] === '/cert/tomok-gisa' && !칩꼴.토목기사[1]
    && 칩꼴.건축기사 && 칩꼴.건축기사[0] === '/cert/geonchuk-gisa' && !칩꼴.건축기사[1] && /2027\. 1\. 1\.부터/.test(칩꼴.새) && 칩꼴.새길 === '/cert/geonchuk-gujo-gisa', 칩꼴)
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
      줄: [...document.querySelectorAll('.card:not([data-q]) table.ctab')].map((t) => t.querySelectorAll('tbody tr').length), 큐넷: [...document.querySelectorAll('a[href*="q-net.or.kr"]')].map((a) => a.getAttribute('href')),
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
      줄: [...document.querySelectorAll('.card:not([data-q]) table.ctab')].map((t) => t.querySelectorAll('tbody tr').length), 큐넷: [...document.querySelectorAll('a[href*="q-net.or.kr"]')].map((a) => a.getAttribute('href')),
      셈: !!document.querySelector('a[href="/cert/grade"]') }))
    ok(`⑩ ${이름2} — h1 · 사실 6칸 · 시험과목 «${과목}» · 시험 표 5줄 · 다음 단계 2줄 · «제한 없음» · ${실기만 ? '실기만' : '필기 + 실기'} · 큐넷 jmCd ${q} · 등급 셈`,
      d.h1 === 이름2 && d.사실 === 6 && d.글.includes(과목) && d.글.includes('제한 없음') && d.줄.join() === '5,2' && (실기만 ? /실기만\(필기 없음\)/.test(d.글) : /객관식 4지 택일형 60문항/.test(d.글))
        && d.큐넷.some((h) => h.endsWith('jmCd=' + q)) && d.셈, { h1: d.h1, 사실: d.사실, 줄: d.줄, 큐넷: d.큐넷.length, 셈: d.셈 })
    ok(`${이름} ${이름2} 넘침 0`, (await 넘침(p)) <= 1, await 넘침(p))
  }
  /* ⑭ G643 큐넷 덧 — 시험 일정 · 합격률 · 법령 우대 · 차례 */
  for (const [slug, 이름2, 둘, 필기] of [['geonchuk-gisa', '건축기사', '실기', true], ['geonseol-anjeon-saneopgisa', '건설안전산업기사', '실기', true], ['geonchuk-ilban-gineungjang', '건축일반시공기능장', '실기', true],
    ['geopujip-gineungsa', '거푸집기능사', '실기', false], ['tomok-sigong-gisulsa', '토목시공기술사', '면접', true]]) {
    const qj = JSON.parse(fs.readFileSync(path.join(ROOT, 'web/src/data/certq', slug + '.json'), 'utf8'))
    const 기대률 = ((qj.secs.find((s) => s.h.startsWith('📊')) || { blocks: [{}] }).blocks[0].rows) || []
    const 일 = qj.secs[0].blocks[0]
    await p.goto(BASE + '/cert/' + slug, { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('.card[data-q] .crate', { timeout: 20000 })
    await 쉬어(300)
    const d = await p.evaluate(() => {
      const cards = [...document.querySelectorAll('.card[id^="cs"]')]
      const q = cards.filter((c) => c.hasAttribute('data-q'))
      const 우대 = q.find((c) => /🏅/.test(c.querySelector('.sec-title').innerText))
      return { 카드: cards.length, 제목들: cards.map((c) => c.querySelector('.sec-title').innerText), toc: [...document.querySelectorAll('.cert-toc a')].map((a) => [a.innerText.trim(), a.getAttribute('href')]),
        q수: q.length, 머리: q.map((c) => [...c.querySelector('.sec-title').innerText][0]), 일정: q[0] ? [...q[0].querySelectorAll('table.ctab tbody tr')].map((tr) => tr.querySelectorAll('td').length) : [],
        rows: [...document.querySelectorAll('.crate .cr-row')].map((r) => ({ y: r.querySelector('.cr-y').innerText, bars: [...r.querySelectorAll('.cr-bar')].map((b) => ({ k: b.querySelector('.cr-k').innerText, w: b.querySelector('.cr-t i').style.width, v: b.querySelector('.cr-v').innerText })) })),
        우대줄: 우대 ? 우대.querySelectorAll('table.ctab tbody tr').length : -1 }
    })
    const 률맞음 = d.rows.length === 기대률.length && d.rows.every((r, j) => {
      const [해, 필응, 필률, 실응, 실률] = 기대률[j]
      const 끝 = r.bars[r.bars.length - 1]
      return r.y === String(해) && r.bars.length === (필기 ? 2 : 1) && 끝.k === 둘 && 끝.w === `${Math.min(100, 실률)}%` && (실응 ? 끝.v.startsWith(`${실률}%`) : 끝.v.startsWith('—'))
        && (!필기 || (r.bars[0].k === '필기' && r.bars[0].w === `${Math.min(100, 필률)}%` && (필응 ? r.bars[0].v.startsWith(`${필률}%`) : r.bars[0].v.startsWith('—'))))
    })
    const 시험곳 = d.제목들.findIndex((x) => x.startsWith('📝 시험'))
    ok(`⑭ ${이름2} — 차례 칩 = 칸 ${d.카드} · 큐넷 덧 3칸(📅 · 📊 · 🏅) «📝 시험» 바로 뒤 · 일정 ${일.rows.length}줄 4칸 · 합격률 ${기대률.length}해(${필기 ? '필기 · ' : ''}${둘}) = 자료 · 우대 표`,
      d.toc.length === d.카드 && d.toc.every(([글, h], j) => h === '#cs' + j && d.제목들[j].startsWith(글)) && d.q수 === 3 && d.머리.join() === '📅,📊,🏅'
        && 시험곳 >= 0 && (d.제목들[시험곳 + 1] || '').startsWith('📅') && d.일정.length === 일.rows.length && d.일정.every((x) => x === 4) && 률맞음 && d.우대줄 >= 1 && d.우대줄 <= 8,
      { 카드: d.카드, toc: d.toc.length, q수: d.q수, 머리: d.머리, 일정: d.일정, rows: d.rows.slice(0, 1), 우대줄: d.우대줄, 률맞음 })
    const 칩 = d.toc.findIndex(([글]) => 글.startsWith('📊'))
    await p.evaluate((i) => document.querySelectorAll('.cert-toc a')[i].click(), 칩)
    await 쉬어(1200)
    const 자리 = await p.evaluate((i) => {
      const c = document.getElementById('cs' + i).getBoundingClientRect().top
      const bar = document.querySelector('.topbar')
      return { 위: Math.round(c), 막대: bar ? Math.round(bar.getBoundingClientRect().bottom) : 0 }
    }, 칩)
    ok(`⑭ ${이름2} 차례 «📊 합격률» 누름 → 그 칸 제목이 위 막대(${자리.막대}px) 밑에 숨지 않고 바로 아래(${자리.위}px)`, 자리.위 >= 자리.막대 - 1 && 자리.위 < 자리.막대 + 60, 자리)
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
    줄: [...document.querySelectorAll('.card:not([data-q]) table.ctab')].map((t) => t.querySelectorAll('tbody tr').length), 큐넷: [...document.querySelectorAll('a[href*="q-net.or.kr"]')].map((a) => a.getAttribute('href')),
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
  /* ⑬ G631 면접 준비 */
  const 면접열쇠 = 'kcm.면접.tomok-sigong-gisulsa'
  await p.evaluate((k) => { try { localStorage.removeItem(k) } catch (e) { /* 없음 */ } }, 면접열쇠)
  await p.goto(BASE + '/cert/tomok-sigong-gisulsa', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.cert-facts', { timeout: 20000 })
  await 쉬어(300)
  const 면접단추 = await p.evaluate(() => [...document.querySelectorAll('a.cert-big.qz-go')].map((a) => [a.getAttribute('href'), a.innerText.replace(/\s+/g, ' ').trim()]))
  ok('⑬ 토목시공기술사 깊은 글 — «🎤 면접 준비» 단추(→ /interview · 질문 150개)', 면접단추.some(([h, t]) => h === '/cert/tomok-sigong-gisulsa/interview' && /🎤 면접 준비/.test(t) && /150개/.test(t)), 면접단추)
  await p.click('a[href="/cert/tomok-sigong-gisulsa/interview"].cert-big')
  await p.waitForURL(/\/cert\/tomok-sigong-gisulsa\/interview$/, { timeout: 10000 })
  await p.waitForSelector('details.iv-q', { timeout: 20000 })
  await 쉬어(300)
  const 셈 = () => p.evaluate(() => ({ 질문: document.querySelectorAll('details.iv-q').length, 열림: document.querySelectorAll('details.iv-q[open]').length, 외움: (document.querySelector('.iv-cnt') || {}).innerText || '' }))
  const iv0 = await p.evaluate(() => ({ h1: (document.querySelector('h1') || {}).innerText || '', 칩: [...document.querySelectorAll('.iv-tools .chips .chip')].map((c) => c.innerText.trim()), 차례: document.querySelectorAll('.csteps .cstep').length }))
  const c0 = await 셈()
  ok('⑬ 면접 쪽 — h1 · 분야 칩 11(전체 150 + 10) · 준비 차례 5 · 질문 150 · 외움 0 / 150', iv0.h1 === '🎤 토목시공기술사 면접 준비' && iv0.칩.length === 11 && iv0.칩[0] === '전체 150' && iv0.차례 === 5 && c0.질문 === 150 && c0.외움 === '✓ 외움 0 / 150', { ...iv0, ...c0 })
  ok(`${이름} 면접 쪽 넘침 0`, (await 넘침(p)) <= 1, await 넘침(p))
  await p.evaluate(() => [...document.querySelectorAll('.iv-tools .chips .chip')].find((c) => c.innerText.includes('콘크리트')).click())
  await 쉬어(200)
  const 콘 = await 셈()
  await p.fill('.iv-tools .cert-q', '히빙')
  await 쉬어(250)
  const 히 = await p.evaluate(() => [...document.querySelectorAll('details.iv-q')].map((d) => d.textContent))
  await p.fill('.iv-tools .cert-q', '')
  await p.evaluate(() => [...document.querySelectorAll('.iv-tools .chips .chip')][0].click())
  await 쉬어(250)
  ok('⑬ 분야 «콘크리트» → 23 · 찾기 «히빙»(콘크리트 안) → 0 · 전체로 돌아오면 150', 콘.질문 === 23 && 히.length === 0 && (await 셈()).질문 === 150, [콘.질문, 히.length])
  await p.fill('.iv-tools .cert-q', '히빙')
  await 쉬어(250)
  const 히2 = await p.evaluate(() => [...document.querySelectorAll('details.iv-q')].map((d) => d.textContent))
  ok('⑬ 전체에서 찾기 «히빙» → 1개 넘게 · 모두 «히빙» 이 들어감', 히2.length >= 1 && 히2.every((t) => t.includes('히빙')), 히2.length)
  await p.fill('.iv-tools .cert-q', '')
  await 쉬어(200)
  await p.click('.iv-row .btn')
  await 쉬어(400)
  ok('⑬ 🎲 아무 질문 하나 → 하나만 펼쳐짐', (await 셈()).열림 === 1, await 셈())
  const 첫 = await p.evaluate(() => { const d = document.querySelector('details.iv-q'); d.querySelector('summary').click(); return d.id })
  await 쉬어(250)
  await p.evaluate((id) => document.querySelector('#' + id + ' .iv-body .btn').click(), 첫)
  await 쉬어(250)
  const 외1 = await p.evaluate((id) => ({ 표: !!document.querySelector('#' + id + ' summary .iv-ok'), 단추: document.querySelector('#' + id + ' .iv-body .btn').innerText.trim() }), 첫)
  const 저장 = await p.evaluate((k) => { try { return JSON.parse(localStorage.getItem(k) || '[]') } catch (e) { return null } }, 면접열쇠)
  ok('⑬ ✓ 외웠음 — 질문 줄에 ✓ · 단추 «다시 볼 것으로» · 외움 1 / 150 · 이 브라우저에 번호 저장', 외1.표 && /다시 볼 것으로/.test(외1.단추) && (await 셈()).외움 === '✓ 외움 1 / 150' && Array.isArray(저장) && 저장.length === 1 && 'iq-' + 저장[0] === 첫, { 외1, 저장 })
  await p.evaluate(() => [...document.querySelectorAll('.iv-row .chip')].find((c) => /외운 것 빼고/.test(c.innerText)).click())
  await 쉬어(250)
  ok('⑬ 외운 것 빼고 보기 → 149', (await 셈()).질문 === 149, await 셈())
  await p.reload({ waitUntil: 'domcontentloaded' })
  await p.waitForSelector('details.iv-q', { timeout: 20000 })
  await 쉬어(300)
  ok('⑬ 새로고침해도 외움 1 / 150(이 브라우저)', (await 셈()).외움 === '✓ 외움 1 / 150', await 셈())
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
  const 쪽들 = fs.readdirSync(path.join(ROOT, 'web/dist/cert'))
  const 셈쪽 = (re) => 쪽들.filter((x) => re.test(x)).length
  const gk = fs.readFileSync(path.join(ROOT, 'web/dist/cert/geonchuk-gisa.html'), 'utf8')
  ok('⑭ 구운 쪽 — 산업기사 16 · 기능장 3 · 기사 16(건축구조기사 포함) · 건축기사 쪽 제목 · h1 · 차례 · 큐넷 덧 3칸(data-q) · 합격률 5줄 · 일정 표 · 우대 표',
    셈쪽(/-saneopgisa\.html$/) === 16 && 셈쪽(/-gineungjang\.html$/) === 3 && 셈쪽(/-gisa\.html$/) === 16 && /<title>건축기사 — /.test(gk) && /<h1[^>]*>건축기사<\/h1>/.test(gk)
      && /<nav class="cert-toc"/.test(gk) && (gk.match(/data-q="1"/g) || []).length === 3 && (gk.match(/class="cr-row"/g) || []).length === 5 && /<th>회차<\/th><th>접수<\/th><th>시험<\/th><th>발표<\/th>/.test(gk) && /class="ctab fit cnl"/.test(gk) && /class="ctab fit ckv"/.test(gk) && /쓰이는 곳/.test(gk) && !/클로드|무료/.test(gk.replace(/<script[\s\S]*?<\/script>/g, '')),
    [셈쪽(/-saneopgisa\.html$/), 셈쪽(/-gineungjang\.html$/), 셈쪽(/-gisa\.html$/), (gk.match(/data-q="1"/g) || []).length, (gk.match(/class="cr-row"/g) || []).length])
  ok('⑪ 구운 토목기사 쪽 — 제목 · h1 · 📝 예상문제 단추 · /cert 에 «토목기사 예상문제» 줄', /<title>토목기사 — /.test(tk) && /<h1[^>]*>토목기사<\/h1>/.test(tk) && /class="cert-big qz-go" href="\/cert\/tomok-gisa\/quiz"/.test(tk) && /href="\/cert\/tomok-gisa\/quiz"><span class="fic">📝/.test(h))
  ok('⑪ 구운 예상문제 쪽(cert/tomok-gisa/quiz.html) — 제목 · h1 · 들어 있는 문제 6과목 · 맛보기 6 · «직접 만든» · 큐넷 · canonical', /<title>토목기사 필기 예상문제 — /.test(qz) && /<h1[^>]*>📝 토목기사 필기 예상문제<\/h1>/.test(qz)
    && (qz.match(/class="qz-types"/g) || []).length === 6 && (qz.match(/<details class="qz-rv">/g) || []).length === 6 && /직접 만든/.test(qz) && /jmCd=1250/.test(qz) && /rel="canonical" href="https:\/\/k-conmap\.com\/cert\/tomok-gisa\/quiz"/.test(qz) && !/클로드|무료/.test(qz.replace(/<script[\s\S]*?<\/script>/g, '')),
    [qz.length, (qz.match(/<title>[^<]*/) || [''])[0]])
  const 면접쪽 = path.join(ROOT, 'web/dist/cert/tomok-sigong-gisulsa/interview.html')
  const ivh = fs.existsSync(면접쪽) ? fs.readFileSync(면접쪽, 'utf8') : ''
  const tsh = fs.readFileSync(path.join(ROOT, 'web/dist/cert/tomok-sigong-gisulsa.html'), 'utf8')
  ok('⑬ 구운 면접 쪽(cert/tomok-sigong-gisulsa/interview.html) — 제목 · h1 · 질문 150(펼침) · 근거 · canonical · 깊은 글 🎤 단추 · /cert 줄', /<title>토목시공기술사 면접 — /.test(ivh) && /<h1[^>]*>🎤 토목시공기술사 면접 준비<\/h1>/.test(ivh)
    && (ivh.match(/<details class="iv-q"/g) || []).length === 150 && /law\.go\.kr/.test(ivh) && /rel="canonical" href="https:\/\/k-conmap\.com\/cert\/tomok-sigong-gisulsa\/interview"/.test(ivh)
    && /class="cert-big qz-go" href="\/cert\/tomok-sigong-gisulsa\/interview"/.test(tsh) && /href="\/cert\/tomok-sigong-gisulsa\/interview"><span class="fic">🎤/.test(h), [ivh.length, (ivh.match(/<title>[^<]*/) || [''])[0]])
}
await b.close()
console.log(`\n${bad ? '❌' : '✅'} 시험_자격증화면 ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
