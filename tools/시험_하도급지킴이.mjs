/**
 * 🧪 G556 하도급지킴이 길잡이(/tools/hado-jikimi) — 계좌 넷 · 상황 다섯 (2026-11-05 초안 · 11-06 공식 원문으로 다시 씀)
 *   lib 모드(주소 없이):  LANG=C.UTF-8 node tools/시험_하도급지킴이.mjs          — lib/하도급지킴이.js · tools.json · 빠른찾기
 *   화면 모드(구운 사이트): LANG=C.UTF-8 node tools/시험_하도급지킴이.mjs http://127.0.0.1:4986   · OUT=폴더 면 화면 사진
 *   소장님 「1번 부터 5번까지 작업해줘」 — 카페 도구 후보 ②(카페 질문 5건)
 *   ① 자료: 계좌 넷 · 상황 다섯 — 답 · 차례 · 근거 빈칸 없음 · 상황마다 원문 낱말(노무비 자동지급 · 대금지시처리 · 예외대금이체목록 ·
 *      지급방식 선지급 · 대금지급정보 소급입력) · 맨 위 대상(3천만원 미만 · 30일 이내 — 시행규칙 제28조⑥) · 법이 정한 것 다섯
 *   ①-2 짐작으로 썼던 말이 돌아오지 않음: «소급 승인» · «2022. 7. 4.» · «선금을 뺀» · «감독관» · «공문» 없음
 *   ② 글: «무료» · «클로드» 없음 · tail · 설명 넷 · 콜센터 1588-0800 · 사이트 안 링크는 있는 길만(라우트 · 서식 이름표)
 *   ③ 빠른찾기 «하도급지킴이» · «노무비계좌» · «선지급» · «소급승인» · «소급입력» · «예외이체» → 이 도구
 *   ④ 화면: 맨 위 대상 한 줄 · 상황 단추 다섯 · 누르면 답 · 차례 · 근거 · 링크 · 자재 → 서식 두 개(눌러 열림) · 계좌 표 넷 ·
 *      법이 정한 것(접힘 → 다섯) · 예시로 해 보기 → 노무비 · 다시 열어도 고른 것 남음 · 폭 320 · 390 · 1280 넘침 0 · 오류 0
 * 가상 자료만 씀 · 인터넷 안 부름.
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
const require = createRequire(import.meta.url)
const 여기 = path.dirname(fileURLToPath(import.meta.url))
const 뿌리 = path.join(여기, '..')
const BASE = process.argv[2] || ''
const OUT = process.env.OUT || ''
let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 600))) }
const L = await import(pathToFileURL(path.join(뿌리, 'web/src/lib/하도급지킴이.js')).href)

console.log('① 자료')
const 상 = Object.fromEntries(L.상황들.map((x) => [x.k, x]))
const 글 = (x) => [x.답, ...x.차례].join(' ')
ok('계좌 넷 — 고정 · 선금 · 노무비 · 일반', L.계좌들.map((a) => a.이름).join() === '고정계좌,선금계좌,노무비계좌,일반계좌', L.계좌들.map((a) => a.이름))
ok('계좌 출금 — 약정계좌 셋 «하도급지킴이로만» · 일반계좌 «제한 없음»', L.계좌들.map((a) => a.출금).join() === '하도급지킴이로만,하도급지킴이로만,하도급지킴이로만,제한 없음', L.계좌들.map((a) => a.출금))
ok('상황 다섯 — 노무비 · 자재장비 · 선금계좌 · 선지급 · 일반 계좌', L.상황들.map((x) => x.k).join() === 'nomubi,jajae,seongeum,seonjigeup,ilban', L.상황들.map((x) => x.k))
ok('상황마다 물음 · 답 · 차례(셋 넘게) · 근거 빈칸 없음', L.상황들.every((x) => x.물음 && x.답 && x.차례.length >= 3 && x.근거.length >= 1 && x.근거.every(Boolean)), L.상황들.map((x) => [x.k, x.차례.length, x.근거.length]))
ok('노무비 — 본인 명의 계좌 · «노무비 자동지급» · 대리수령인 · FAQ 제도 Q3', /본인 명의 계좌/.test(상.nomubi.답) && /노무비 자동지급/.test(글(상.nomubi)) && /대리수령인/.test(글(상.nomubi)) && 상.nomubi.근거.some((g) => /제도 Q3/.test(g)))
ok('자재장비 — 계좌정보 · 대가 · «대금지시처리» · 고정계좌 · FAQ 시스템 Q4', /계좌정보와 대가/.test(글(상.jajae)) && /대금지시처리/.test(상.jajae.답) && /고정계좌/.test(상.jajae.답) && 상.jajae.근거.some((g) => /시스템 Q4/.test(g)))
ok('선금계좌 — 예외대금이체목록 · «동일한 업체 약정계좌간 이체» · «예외이체 승인» · Q15 · Q18', /예외대금이체목록/.test(상.seongeum.답) && /동일한 업체 약정계좌간 이체/.test(글(상.seongeum)) && /예외이체 승인/.test(상.seongeum.답) && 상.seongeum.근거.some((g) => /Q15 · Q18/.test(g)))
ok('선지급 — 법 제34조⑨ · «지급방식» 선지급 · 건설사 일반계좌 · 소급입력 · Q7 · Q14', 상.seonjigeup.근거.some((g) => /제34조⑨/.test(g)) && /«지급방식» \*\*선지급/.test(글(상.seonjigeup)) && /건설사 일반계좌/.test(글(상.seonjigeup)) && /소급입력/.test(글(상.seonjigeup)) && 상.seonjigeup.근거.some((g) => /Q7 · Q14/.test(g)))
ok('일반 계좌 — 또 보내지 않음 · «대금지급정보 소급입력» · 경로 · 담당자 · 콜센터 확인 · Q8', /또 보내지 않습니다/.test(상.ilban.답) && /대금지급정보 소급입력/.test(상.ilban.답) && /현황관리 > 계약현황목록/.test(글(상.ilban)) && /담당자 · 콜센터 확인/.test(글(상.ilban)) && 상.ilban.근거.some((g) => /Q8/.test(g)))
ok('맨 위 대상 — 3천만원 미만 · 30일 이내 · 근거 제34조⑨ · 제28조⑥', /3천만원 미만/.test(L.대상) && /30일 이내/.test(L.대상) && /제34조⑨/.test(L.대상근거) && /제28조⑥/.test(L.대상근거))
ok('법이 정한 것 다섯 — 근거 빈칸 없음 · 선지급금 · 약정계좌 · 재난(제28조⑧)', L.법.length === 5 && L.법.every((x) => x.글 && x.근거) && /선지급금/.test(L.법[0].글) && /약정계좌/.test(L.법[2].글) && /제28조⑧/.test(L.법[4].근거), L.법.map((x) => x.근거))
ok('계좌 풀이 셋 · 근거(시행규칙 · 은행 설명서 · FAQ)', L.계좌풀이.length === 3 && /시행규칙 제28조⑦/.test(L.계좌근거) && /하나은행/.test(L.계좌근거) && /FAQ/.test(L.계좌근거))
ok('바뀌는 것 다섯 — 2027. 1. 1. 이후 계약 · 민간(국토교통부령 금액 — 아직 없음) · 계좌 안 거침 · 지자체 지원 · 2028 과태료 2천만원 이하', L.바뀜.length === 5 && L.바뀜.every((x) => x.글 && x.근거) && /2027\. 1\. 1\. 이후/.test(L.바뀜[0].글) && /부칙 제2조/.test(L.바뀜[0].근거) && /국토교통부령으로 정하는 금액/.test(L.바뀜[1].글) && /아직 시행규칙에 없습니다/.test(L.바뀜[1].글) && /거치지 않는/.test(L.바뀜[2].글) && /⑪/.test(L.바뀜[3].근거) && /2028\. 1\. 1\./.test(L.바뀜[4].글) && /2천만원 이하/.test(L.바뀜[4].글) && /제98조의2/.test(L.바뀜[4].근거) && /법률 제21894호/.test(L.바뀜근거), L.바뀜.map((x) => x.근거))
ok('맨 위 바뀜 한 줄 · 일반 계좌 상황에 2028 과태료', /2027\. 1\. 1\./.test(L.바뀜한줄) && /민간 공사/.test(L.바뀜한줄) && L.상황들[4].차례.some((t) => /2028\. 1\. 1\./.test(t) && /과태료/.test(t)) && L.상황들[4].근거.some((g) => /제98조의2/.test(g)))
{
  const 모두 = JSON.stringify(L)
  ok('짐작으로 썼던 말 없음 — «소급 승인» · «2022. 7. 4.» · «선금을 뺀» · «감독관» · «공문»', !/소급 승인|2022\. 7\. 4\.|선금을 뺀|감독관|공문/.test(모두), 모두.match(/소급 승인|2022\. 7\. 4\.|선금을 뺀|감독관|공문/g))
}
{
  const 서식 = JSON.parse(fs.readFileSync(path.join(뿌리, 'web/src/data/forms-min.json'), 'utf8'))
  const 길 = fs.readFileSync(path.join(뿌리, 'web/src/main.jsx'), 'utf8')
  const 링크 = L.상황들.flatMap((x) => x.링크)
  const 있음 = ([to, 이름]) => to.startsWith('/forms/') ? !!(서식[to.slice(7)] && 서식[to.slice(7)][0] === 이름) : 길.includes(`path="${to}"`)
  ok('사이트 안 링크는 있는 길만(라우트 · 서식 이름표 같음)', 링크.length >= 5 && 링크.every(있음), 링크.filter((x) => !있음(x)))
}
console.log('② 글')
const 자료 = JSON.parse(fs.readFileSync(path.join(뿌리, 'web/src/data/tools.json'), 'utf8'))
const t = 자료.tools.find((x) => x.slug === 'hado-jikimi')
const 모두 = JSON.stringify(t || {}) + JSON.stringify(L)
ok('tools.json hado-jikimi · cat money · tail «계좌 · 상황별 할 일» · 설명 다섯(2027 바뀌는 것) · 제목 «소급입력»', !!t && t.cat === 'money' && t.tail === '계좌 · 상황별 할 일' && t.secs.length === 5 && /소급입력/.test(t.title) && /2027/.test(t.secs[3].h) && !/소급 승인/.test(JSON.stringify(t)), t && [t.cat, t.tail, t.secs.length, t.title])
ok('«무료» · «클로드» 없음', !/무료|클로드/.test(모두))
ok('콜센터 1588-0800', /1588-0800/.test(JSON.stringify(t)) && /1588-0800/.test(L.문의))
console.log('③ 빠른찾기')
{
  const 찾 = await import(pathToFileURL(path.join(뿌리, 'web/src/lib/빠른찾기.js')).href)
  const 읽 = (x) => JSON.parse(fs.readFileSync(path.join(뿌리, 'web/src/data', x), 'utf8'))
  const 목 = 찾.목록만들기({ 탭: [], tools: 읽('tools.json'), forms: 읽('forms-min.json'), change: 읽('change.json'), guide: 읽('guide.json'), cad: 읽('cad.json') })
  const 맨위 = (q) => (찾.찾기(목, q, 3)[0] || {}).to
  const 말 = ['하도급지킴이', '노무비계좌', '선지급', '소급승인', '소급입력', '예외이체']
  ok('«하도급지킴이» · «노무비계좌» · «선지급» · «소급승인» · «소급입력» · «예외이체» → /tools/hado-jikimi', 말.every((q) => 맨위(q) === '/tools/hado-jikimi'), 말.map(맨위))
}

if (BASE) {
  const { chromium } = require('playwright')
  const b = await chromium.launch()
  async function 새쪽(w, h, 폰, ctx0) {
    const ctx = ctx0 || await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, deviceScaleFactor: 2,
      userAgent: 폰 ? 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36' : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36' })
    if (!ctx0) {
      await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
      await ctx.route(/firebaseio\.com|firebasedatabase\.app/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
    }
    const p = await ctx.newPage()
    const 오류 = []
    p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
    await p.goto(BASE + '/tools/hado-jikimi', { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('.hj-picks', { timeout: 20000 }); await p.waitForTimeout(600)
    return { ctx, p, 오류 }
  }
  const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  console.log('④ 화면 — 폰 390')
  {
    const { ctx, p, 오류 } = await 새쪽(390, 844, true)
    ok('상황 단추 다섯 · 처음엔 «상황을 고르면» 안내', (await p.locator('.hj-pick').count()) === 5 && /상황을 고르면/.test(await p.locator('.tool').innerText()))
    ok('맨 위 대상 한 줄 — 3천만원 미만 · 30일 이내 · 근거', /3천만원 미만/.test(await p.locator('.hj-who').innerText()) && /30일 이내/.test(await p.locator('.hj-who').innerText()) && /제28조⑥/.test(await p.locator('.hj-who').innerText()))
    ok('계좌 표 넷 · 출금 «하도급지킴이로만» 셋 · 풀이 셋 · 근거', (await p.locator('.hj-t tbody tr').count()) === 4 && (await p.locator('.hj-t tbody td', { hasText: '하도급지킴이로만' }).count()) === 3 && (await p.locator('.hj-acc').first().locator('.hj-notes li').count()) === 3)
    ok('계좌 표 글은 왼쪽 맞춤(머리 · 칸 모두)', await p.evaluate(() => [...document.querySelectorAll('.hj-t th, .hj-t td')].every((e) => getComputedStyle(e).textAlign === 'left' || getComputedStyle(e).textAlign === 'start')), await p.evaluate(() => [...document.querySelectorAll('.hj-t th, .hj-t td')].map((e) => getComputedStyle(e).textAlign).join()))
    ok('맨 아래 콜센터 — 누르면 전화(tel:15880800) · 번호 줄 안 갈림', await p.evaluate(() => { const a = document.querySelector('.hj-end a.hj-tel'); return !!a && a.getAttribute('href') === 'tel:15880800' && a.textContent === '1588-0800' && getComputedStyle(a).whiteSpace === 'nowrap' && a.getClientRects().length === 1 }))
    {
      const 법 = p.locator('details.hj-law')
      const 처음닫힘 = !(await 법.evaluate((e) => e.open))
      await 법.locator('summary').click(); await p.waitForTimeout(150)
      ok('법이 정한 것 — 처음엔 접힘 · 열면 다섯 줄 · 줄마다 근거', 처음닫힘 && (await 법.locator('.hj-notes li').count()) === 5 && (await 법.locator('.hj-src1').count()) === 5)
      await 법.locator('summary').click(); await p.waitForTimeout(100)
    }
    {
      const 새 = p.locator('details.hj-next')
      const 처음닫힘 = !(await 새.evaluate((e) => e.open))
      await 새.locator('summary').click(); await p.waitForTimeout(150)
      ok('바뀌는 것 — 처음엔 접힘 · 열면 다섯 줄 · 맨 위 📅 한 줄', 처음닫힘 && (await 새.locator('.hj-notes li').count()) === 5 && /법률 제21894호/.test(await 새.innerText()) && /2027\. 1\. 1\./.test(await p.locator('.hj-new').innerText()))
      await 새.locator('summary').click(); await p.waitForTimeout(100)
    }
    const 본 = []
    for (let i = 0; i < 5; i++) {
      await p.locator('.hj-pick').nth(i).click(); await p.waitForTimeout(150)
      const r = await p.evaluate(() => ({ 답: (document.querySelector('.hj-ans') || {}).textContent || '', 차례: document.querySelectorAll('.hj-steps li').length, 근거: (document.querySelector('.hj-src') || {}).textContent || '', 눌림: [...document.querySelectorAll('.hj-pick')].filter((x) => x.getAttribute('aria-pressed') === 'true').length }))
      본.push(r)
    }
    ok('다섯 상황 모두 — 답 · 차례 3 넘게 · 근거 · 눌린 단추 하나', 본.every((r) => r.답.length > 10 && r.차례 >= 3 && /^근거:/.test(r.근거) && r.눌림 === 1), 본.map((r) => [r.답.slice(0, 12), r.차례, r.눌림]))
    await p.locator('.hj-pick').nth(0).click(); await p.waitForTimeout(150)
    ok('노무비 — 링크 «노무비 계산기» → /tools/nomubi', (await p.locator('.hj-link').first().getAttribute('href')) === '/tools/nomubi')
    if (OUT) {
      await p.evaluate(() => { for (const e of document.querySelectorAll('body *')) { const s = getComputedStyle(e); if (s.position === 'fixed' || s.position === 'sticky') e.style.setProperty('display', 'none', 'important') } })
      await p.locator('.tool').screenshot({ path: OUT + '/하도급지킴이_노무비_폰390.png' })
    }
    await p.locator('.hj-pick').nth(4).click(); await p.waitForTimeout(150)
    ok('폰 390 넘침 0 · 오류 0', (await 넘침(p)) <= 0 && !오류.length, [await 넘침(p), 오류])
    /* 다시 열어도 고른 것(일반 계좌) 남음 */
    const { p: p2, 오류: 오류2 } = await 새쪽(390, 844, true, ctx)
    ok('다시 열면 마지막 고른 상황(일반 계좌) 그대로', /또 보내지 않습니다/.test(await p2.locator('.hj-ans').textContent()) && !오류2.length)
    await ctx.close()
  }
  console.log('④ 예시 · 폭 320 · 1280')
  {
    const { ctx, p, 오류 } = await 새쪽(320, 640, true)
    await p.locator('button', { hasText: '예시로 해 보기' }).first().click(); await p.waitForTimeout(500)
    ok('예시로 해 보기 → 노무비 상황', /본인 명의 계좌/.test((await p.locator('.hj-ans').textContent()) || ''))
    await p.locator('.hj-pick').nth(1).click(); await p.waitForTimeout(150)
    const 자재링크 = await p.locator('.hj-link').evaluateAll((a) => a.map((x) => x.getAttribute('href')))
    ok('자재장비 — 링크 둘(건설기계 임대차계약서 · 자재 구매계약서)', 자재링크.join() === '/forms/gy-imdae,/forms/gy-jajae', 자재링크)
    ok('320 넘침 0 (자재장비)', (await 넘침(p)) <= 0, await 넘침(p))
    await p.locator('.hj-link').first().click()
    await p.waitForURL('**/forms/gy-imdae', { timeout: 15000 }); await p.waitForTimeout(1500)
    {
      const 쪽 = await p.evaluate(() => document.body.innerText)
      ok('링크 누르면 그 서식 쪽이 열림(건설기계 임대차계약서 · 칸별 작성법)', /건설기계 임대차계약서/.test(쪽) && /칸별 작성법/.test(쪽), 쪽.slice(0, 120))
    }
    await p.goBack(); await p.waitForSelector('.hj-picks', { timeout: 15000 }); await p.waitForTimeout(300)
    const 본문 = await p.evaluate(() => (document.querySelector('.tool') || {}).innerText || '')
    ok('도구 안 «무료» · «클로드» · NaN · undefined 없음', !/무료|클로드|NaN|undefined/.test(본문))
    ok('320 넘침 0 · 오류 0', (await 넘침(p)) <= 0 && !오류.length, [await 넘침(p), 오류])
    await ctx.close()
  }
  {
    const { ctx, p, 오류 } = await 새쪽(1280, 860, false)
    await p.locator('.hj-pick').nth(3).click(); await p.waitForTimeout(150)
    ok('PC 1280 — 선지급 · 링크 원클릭 · 넘침 0 · 오류 0', /선지급/.test(await p.locator('.hj-ans').textContent()) && (await p.locator('.hj-link').first().getAttribute('href')) === '/tools/wonclick' && (await 넘침(p)) <= 0 && !오류.length, 오류)
    if (OUT) await p.locator('.tool').screenshot({ path: OUT + '/하도급지킴이_선지급_PC1280.png' })
    await ctx.close()
  }
  await b.close()
}
console.log(`\n${bad ? '✗' : '✓'} 시험_하도급지킴이 ${n - bad}/${n}`)
if (bad) process.exit(1)
