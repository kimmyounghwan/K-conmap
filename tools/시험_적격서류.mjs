/**
 * 🧪 G551 적격심사 서류 길잡이 시험 — 2026-11-05
 *   lib · 자료 시험(인터넷 · 화면 안 씀 — PC 올리기 연습에서도 돎): LANG=C.UTF-8 node tools/시험_적격서류.mjs
 *   화면 시험까지(구운 사이트 띄운 뒤):                          LANG=C.UTF-8 node tools/시험_적격서류.mjs http://127.0.0.1:4986  · OUT=폴더 면 화면 사진
 *   소장님 「적격심사 도구 만들어 줘.」 — 카페 «3번 민간공사 실적증명서 2026년 것도?»
 *   ① lib: 실적인정기간(협회 확정 3년 + 다음 해 1.1 ~ 입찰공고일) · 작년 미확정이면 4년 넘음 · 없는 날짜 · 한국 날짜
 *   ② 자료: tools.json · CALCS · 예시 짝 · «무료» · «클로드» 없음 · 근거(예규 제393호) 적힘
 *   ③ 화면: 공고일 넣으면 기간 · 올해 분 «준공이 끝난 공사만» · 작년 미확정 줄 · 체크 남음(다시 열어도) · 예시 · 칸 비우기 · 이어지는 도구 · 넘침 0 · 오류 0
 * 가상 자료만 씀 · 인터넷 안 부름(데이터베이스 · 애널리틱스는 막음).
 */
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { 날짜읽기, 적격기간, 낼서류, 오늘한국 } from '../web/src/lib/적격서류.js'
const require = createRequire(import.meta.url)
const 뿌리 = new URL('../', import.meta.url)
const 읽기 = (p) => readFileSync(new URL(p, 뿌리), 'utf8')
let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 300))) }

console.log('① lib — 실적인정기간')
{
  const a = 적격기간('2026-11-05', true)
  ok('2026-11-05 · 작년 확정 → 2023.1.1 ~ 2026.11.5 (확정 2023 · 2024 · 2025 + 2026.1.1 ~)', a && a.전체 === '2023.1.1 ~ 2026.11.5' && a.확정해.join() === '2023,2024,2025' && a.덧시작 === '2026.1.1' && a.끝 === '2026.11.5' && a.넷이상 === false, a)
  const b = 적격기간('2026-02-10', false)
  ok('2026-02-10 · 작년 미확정 → 2022.1.1 ~ 2026.2.10 (확정 2022 · 2023 · 2024 + 2025.1.1 ~ · 4년 넘음)', b && b.전체 === '2022.1.1 ~ 2026.2.10' && b.확정해.join() === '2022,2023,2024' && b.덧시작 === '2025.1.1' && b.넷이상 === true, b)
  const c = 적격기간('2027-12-31', true)
  ok('2027-12-31 · 작년 확정 → 2024.1.1 ~ 2027.12.31', c && c.전체 === '2024.1.1 ~ 2027.12.31' && c.마지막확정 === 2026, c)
  ok('없는 날짜 · 빈 칸 → 없음(2026-02-30 · 2026-13-01 · 빈 칸 · 1999-01-01)', [날짜읽기('2026-02-30'), 날짜읽기('2026-13-01'), 적격기간(''), 적격기간('1999-01-01')].every((x) => x === null))
  ok('윤년 2028-02-29 는 있는 날짜', !!날짜읽기('2028-02-29') && 적격기간('2028-02-29').전체 === '2025.1.1 ~ 2028.2.29')
  ok('한국 날짜 — UTC 11/4 16:00 = 한국 11/5 01:00', 오늘한국(Date.UTC(2026, 10, 4, 16, 0)) === '2026-11-05' && 오늘한국(Date.UTC(2026, 10, 4, 14, 59)) === '2026-11-04')
  ok('낼 서류 아홉 · 열쇠 겹침 없음 · 이름 · 설명 다 있음', 낼서류.length === 9 && new Set(낼서류.map((x) => x[0])).size === 9 && 낼서류.every((x) => x[1] && x[2]))
}

console.log('② 자료 — 도구 목록 · 계산기 · 예시 · 말')
{
  const tj = JSON.parse(읽기('web/src/data/tools.json'))
  const t = tj.tools.find((x) => x.slug === 'qualify-docs')
  ok('tools.json — qualify-docs · 갈래 bid · 🗂 · 적격심사 서류 길잡이 · 설명 넷', !!t && t.cat === 'bid' && t.icon === '🗂' && t.title === '적격심사 서류 길잡이' && (t.secs || []).length === 4, t && [t.cat, t.title, (t.secs || []).length])
  ok('tools.json — 구운 쪽 제목 꼬리 «실적인정기간 · 제출서류»(꼬리가 없으면 prerender 가 «무료 계산기» 를 붙임 — 새것엔 «무료» 안 씀)', !!t && t.tail === '실적인정기간 · 제출서류' && !/무료/.test(t.tail), t && t.tail)
  ok('tools.json — 적격 둘 다음 자리(점수 합산기 다음)', tj.tools.findIndex((x) => x.slug === 'qualify-docs') === tj.tools.findIndex((x) => x.slug === 'qualify-score') + 1)
  const 글 = JSON.stringify(t)
  ok('설명 — «준공이 끝난» · «연도말 단위로 최종 확정» · 예규 제393호 · 제3절 1-가 · [별표5] 주2)', /준공이 끝난/.test(글) && /연도말 단위로 최종 확정/.test(글) && /예규 제393호/.test(글) && /제3절 1-가/.test(글) && /\[별표5\] 주2\)/.test(글))
  const c = 읽기('web/src/tools/calcs.jsx')
  ok('calcs.jsx — CALCS · 예시 짝 · lib 씀', /'qualify-docs': QualifyDocs,/.test(c) && /'qualify-docs': \{ 글: /.test(c) && /from '\.\.\/lib\/적격서류\.js'/.test(c))
  const 화면글 = c.slice(c.indexOf('export function QualifyDocs'), c.indexOf('export function QualifyDocs') + 6000)
  ok('«무료» · «클로드» 없음(설명 · 화면 · lib)', !/무료|클로드/.test(글 + 화면글 + 읽기('web/src/lib/적격서류.js')))
  ok('lib 근거 — 예규 제393호 · 2026. 11. 2. 시행 · 조사 기록 md', /예규 제393호/.test(읽기('web/src/lib/적격서류.js')) && /2026\. 11\. 2\. 시행/.test(읽기('web/src/lib/적격서류.js')) && /적격심사_서류길잡이_조사_2026-11-05\.md/.test(읽기('web/src/lib/적격서류.js')))
}

if (/^https?:\/\//.test(process.argv[2] || '')) {
  const { chromium } = require('playwright')
  const BASE = process.argv[2]
  const OUT = process.env.OUT || ''
  const b = await chromium.launch()
  const 새쪽 = async (w, h, 폰 = true) => {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, deviceScaleFactor: 2,
      userAgent: 폰 ? 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36' : undefined })
    await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
    await ctx.route(/firebaseio\.com|firebasedatabase\.app/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
    await ctx.addInitScript(() => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체') } catch (e) { /* 없음 */ } })
    const p = await ctx.newPage()
    const 오류 = []
    p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
    return { ctx, p, 오류 }
  }
  const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  const 숨김 = (p) => p.addStyleTag({ content: '.fab,.ask-fab,.qna-fab,[class*=fab]{display:none!important}' }).catch(() => {})
  const 결과 = (p) => p.evaluate(() => ({ 기간: (document.querySelector('.tl-o.big b') || {}).textContent, 상자: ((document.querySelector('.qd-box') || {}).innerText || '').replace(/\s+/g, ' '), 셈: (document.querySelector('.qd-n') || {}).textContent, 날: (document.querySelector('.tool input[type=date]') || {}).value }))

  console.log('③ 화면 — 폰 390')
  {
    const { ctx, p, 오류 } = await 새쪽(390, 844)
    await p.goto(BASE + '/tools/qualify-docs', { waitUntil: 'domcontentloaded' }); await p.waitForSelector('.tool input[type=date]', { timeout: 15000 }); await p.waitForTimeout(500)
    const h1 = await p.evaluate(() => (document.querySelector('.tl-h1') || {}).textContent)
    ok('제목 «🗂 적격심사 서류 길잡이»', h1 === '🗂 적격심사 서류 길잡이', h1)
    let r = await 결과(p)
    const 오늘 = 오늘한국(), 기대 = 적격기간(오늘, true)
    ok(`처음 — 공고일 = 오늘(${오늘}) · 기간 ${기대.전체}`, r.날 === 오늘 && r.기간 === 기대.전체, r)
    await p.fill('.tool input[type=date]', '2026-11-05'); await p.waitForTimeout(300)
    r = await 결과(p)
    ok('공고일 2026-11-05 → 2023.1.1 ~ 2026.11.5', r.기간 === '2023.1.1 ~ 2026.11.5', r.기간)
    ok('① 2023 · 2024 · 2025년 협회 실적확인서 · ② 2026.1.1 ~ 2026.11.5 준공이 끝난 공사만 · 실적증명서', /① 2023 · 2024 · 2025년/.test(r.상자) && /협회 실적확인서/.test(r.상자) && /② 2026\.1\.1 ~ 2026\.11\.5/.test(r.상자) && /준공이 끝난 공사만/.test(r.상자) && /실적증명서/.test(r.상자), r.상자)
    ok('작년 미확정 줄 — 2022.1.1 ~ 2026.11.5 · 4년 이상 줄', /작년\(2025년\) 실적이 아직/.test(r.상자) && /2022\.1\.1 ~ 2026\.11\.5/.test(r.상자) && /4년 이상/.test(r.상자), r.상자)
    await p.fill('.tool input[type=date]', '2026-02-10'); await p.waitForTimeout(300)
    r = await 결과(p)
    ok('공고일 2026-02-10 → 2023.1.1 ~ 2026.2.10 · 미확정 줄 2022.1.1 ~ 2026.2.10', r.기간 === '2023.1.1 ~ 2026.2.10' && /2022\.1\.1 ~ 2026\.2\.10/.test(r.상자), r)
    const 글 = await p.evaluate(() => document.querySelector('.tool').innerText.replace(/\s+/g, ' '))
    ok('실적 서류 — 공공 · 민간(인 · 허가서류 · 준공 서류 · 부가세 공급가액 증명서) · 하도급(원도급자 증명) · 공고서 추가', /공공공사/.test(글) && /인 · 허가서류/.test(글) && /준공 서류/.test(글) && /부가세 공급가액 증명서/.test(글) && /원도급자 증명/.test(글) && /인감증명서/.test(글))
    const 칸 = await p.locator('.qd-c').count()
    ok('낼 서류 칸 아홉 · 처음 0 / 9', 칸 === 9 && r.셈 === '0 / 9', [칸, r.셈])
    await p.locator('.qd-c').nth(0).click(); await p.locator('.qd-c').nth(5).click(); await p.waitForTimeout(300)
    r = await 결과(p)
    ok('둘 체크 → 2 / 9 · 체크한 칸 초록', r.셈 === '2 / 9' && (await p.locator('.qd-c.on').count()) === 2, r.셈)
    await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForSelector('.tool input[type=date]'); await p.waitForTimeout(500)
    r = await 결과(p)
    ok('다시 열어도 그대로 — 공고일 2026-02-10 · 2 / 9 (이 기기에 남음)', r.날 === '2026-02-10' && r.셈 === '2 / 9', r)
    const 링크 = await p.evaluate(() => [...document.querySelectorAll('.qd-go a')].map((a) => a.getAttribute('href')).join())
    ok('이어지는 도구 — 점수 합산기 · 낙찰하한율', 링크 === '/tools/qualify-score,/tools/floor-rate', 링크)
    ok('«무료» · «클로드» 없음(사이트 알림 띠 · 창은 빼고 — 소장님 글)', !/무료|클로드/.test(await p.evaluate(() => { const c = document.body.cloneNode(true); c.querySelectorAll('.noticebar,.noticepop').forEach((e) => e.remove()); return c.textContent })))
    ok('폰 390 넘침 0 · 오류 0', (await 넘침(p)) <= 0 && !오류.length, [await 넘침(p), 오류])
    if (OUT) {
      await 숨김(p)
      await p.fill('.tool input[type=date]', '2026-11-05'); await p.waitForTimeout(300)
      await p.evaluate(() => document.querySelector('.tl-h1').scrollIntoView({ block: 'start' })); await p.evaluate(() => window.scrollBy(0, -70)); await p.waitForTimeout(300)
      await p.screenshot({ path: OUT + '/적격서류_위_폰390.png' })
      await p.evaluate(() => document.querySelector('.qd-chk').scrollIntoView({ block: 'center' })); await p.waitForTimeout(300)
      await p.screenshot({ path: OUT + '/적격서류_체크_폰390.png' })
    }
    /* 예시 · 칸 비우기 */
    const 예 = p.locator('button', { hasText: '예시로 해 보기' })
    await 예.click(); await p.waitForTimeout(400)
    r = await 결과(p)
    ok('🧪 예시 — 2026-11-05 · 3 / 9', r.날 === '2026-11-05' && r.셈 === '3 / 9', r)
    await p.getByRole('button', { name: '지우기', exact: true }).click(); await p.waitForTimeout(400)   /* 예시 끄기(Tools.jsx — 이 기기에 남긴 칸도 비움) */
    r = await 결과(p)
    ok('예시 «지우기» → 오늘 · 0 / 9', r.날 === 오늘한국() && r.셈 === '0 / 9', r)
    await p.locator('.qd-c').nth(2).click(); await p.waitForTimeout(200)
    await p.getByRole('button', { name: '칸 비우기', exact: true }).click(); await p.waitForTimeout(400)
    r = await 결과(p)
    ok('하나 체크 뒤 «칸 비우기» → 0 / 9', r.셈 === '0 / 9', r.셈)
    await ctx.close()
  }
  console.log('④ 폰 320 · PC 1280 · 도구 목록')
  {
    const { ctx, p, 오류 } = await 새쪽(320, 640)
    await p.goto(BASE + '/tools/qualify-docs', { waitUntil: 'domcontentloaded' }); await p.waitForSelector('.tool input[type=date]'); await p.waitForTimeout(500)
    ok('폰 320 넘침 0 · 오류 0', (await 넘침(p)) <= 0 && !오류.length, [await 넘침(p), 오류])
    await ctx.close()
  }
  {
    const { ctx, p, 오류 } = await 새쪽(1280, 900, false)
    await p.goto(BASE + '/tools/qualify-docs', { waitUntil: 'domcontentloaded' }); await p.waitForSelector('.tool input[type=date]'); await p.waitForTimeout(500)
    await p.fill('.tool input[type=date]', '2026-11-05'); await p.waitForTimeout(300)
    const r = await 결과(p)
    ok('PC 1280 — 기간 · 넘침 0 · 오류 0', r.기간 === '2023.1.1 ~ 2026.11.5' && (await 넘침(p)) <= 0 && !오류.length, [r.기간, await 넘침(p), 오류])
    if (OUT) { await 숨김(p); await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(300); await p.screenshot({ path: OUT + '/적격서류_PC1280.png' }) }
    await p.goto(BASE + '/tools', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1200)
    const 카드 = await p.evaluate(() => [...document.querySelectorAll('a')].some((a) => a.getAttribute('href') === '/tools/qualify-docs' && /적격심사 서류 길잡이/.test(a.innerText)))
    ok('도구 목록에 «적격심사 서류 길잡이» 카드 → /tools/qualify-docs', 카드)
    await ctx.close()
  }
  await b.close()
}
console.log(`\n${bad ? '✗' : '✓'} 시험_적격서류 ${n - bad}/${n}`)
if (bad) process.exit(1)
