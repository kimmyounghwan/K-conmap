/**
 * 🧪 G561 착공 전 환경 신고 판단기(/tools/env-reports) — 비산먼지 · 특정공사 · 건설폐기물 · 사업장폐기물 (2026-11-06)
 *   lib 모드(주소 없이):  LANG=C.UTF-8 node tools/시험_환경신고.mjs          — lib/환경신고.js · tools.json · 빠른찾기 · 등록
 *   화면 모드(구운 사이트): LANG=C.UTF-8 node tools/시험_환경신고.mjs http://127.0.0.1:4986   · OUT=폴더 면 화면 사진
 *   소장님 「1번 부터 5번까지 작업해줘」 — 카페 도구 후보 ⑤-2(착공 전 환경 신고 한 벌)
 *   ① 비산먼지(별표 13 제5호 경계 — 999 · 1,000 · 199 · 200 · 4,999 · 5,000 · 2,999 · 3,000 · 도장 · 대수선 · 조례 구역 · 매설)
 *   ② 특정공사(제21조① 1~5호 · 장비 5일 이상이 먼저 · 대수선 · 토목 연장은 안 셈 · 유치원은 소음 5호 아님 · 지구단위는 비산 조례 아님 · 제외 지역)
 *   ③ 폐기물(4.9톤 · 5톤 · 사업장) · 신고 넷의 언제 · 누가 · 어디 · 근거 · 원문 낱말
 *   ④ tools.json · 빠른찾기(«비산먼지 신고» · «특정공사» 는 서식이 먼저 · «환경 신고» · «건설폐기물 신고» → 이 도구) · 등록 · 링크
 *   ⑤ 화면: 예시 → 셋 대상(비산 · 특정 · 건폐) · 사업장 확인 · 착공일 · 서식 링크 둘 · 장비 끄면 특정 «확인» · 폭 320 · 390 · 1280 넘침 0 · 오류 0
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
const L = await import(pathToFileURL(path.join(뿌리, 'web/src/lib/환경신고.js')).href)

console.log('① 비산먼지 — 별표 13 제5호')
{
  const 비 = (o) => L.비산먼지(o)
  ok('건축 999 → 아님 · 1,000 → 대상(가) · 대수선 1,000 → 대상(가)', 비({ 건축: '999' }).대상 === false && 비({ 건축: '1000' }).대상 === true && /^가 —/.test(비({ 건축: '1000' }).걸림[0]) && 비({ 대수선: '1,000' }).대상 === true)
  ok('토목 용적 1,000 · 면적 1,000 · 연장 200 → 나 1) · 연장 199 → 아님', 비({ 토목용적: '1000' }).대상 && 비({ 토목면적: '1000' }).대상 && /나 1\)/.test(비({ 토목연장: '200' }).걸림[0]) && 비({ 토목연장: '199' }).대상 === false)
  ok('굴정 연장 200 · 토사량 200 → 나 2) · 조경 4,999 → 아님 · 5,000 → 다 · 해체 2,999 → 아님 · 3,000 → 라 1) · 토공 1,000 → 라 2)', /나 2\)/.test(비({ 굴정연장: '200' }).걸림[0]) && 비({ 굴정토량: '200' }).대상 && 비({ 조경: '4999' }).대상 === false && /^다/.test(비({ 조경: '5000' }).걸림[0]) && 비({ 해체: '2999' }).대상 === false && /라 1\)/.test(비({ 해체: '3000' }).걸림[0]) && /라 2\)/.test(비({ 토공: '1000' }).걸림[0]))
  ok('고른값 — 안 고른 종류에 적은 수는 안 씀(토목 안 고르면 토목 5,000㎡ 무시) · 도장 · 매설은 고르기만', (() => { const v = L.고른값({ 건축: true, 도장: true }, { 건축: '1200', 토목면적: '5000' }); return v.건축 === '1200' && v.토목면적 === undefined && v.도장 === true && v.매설 === false })() && L.종류들.length === 9 && L.종류들.find((x) => x.k === '토목').칸.join() === '토목용적,토목면적,토목연장')
  ok('도장(장기수선 공동주택 외부) → 마 · 아무것도 없으면 null', /^마/.test(비({ 도장: true }).걸림[0]) && 비({}).대상 === null)
  ok('규모 미만 + 주거지역 · 유치원 50m · 매설 → 조례 «들 수 있음» · 지구단위(주거형)만이면 비산 조례 아님', 비({ 건축: '500', 가까이: { 주거: true } }).조례 && 비({ 건축: '500', 가까이: { 유치원: true } }).조례 && 비({ 토목연장: '50', 매설: true }).조례 && !비({ 건축: '500', 가까이: { 지구: true } }).조례 && !비({ 건축: '1500', 가까이: { 주거: true } }).조례)
}
console.log('② 특정공사 — 시행규칙 제21조①')
{
  const 특 = (o) => L.특정공사(o)
  ok('건축 1,000 + 장비 5일 → 대상(1호) · 장비 안 고르면 null(«5일 이상 쓰면 대상») · 해체 3,000 → 1호', 특({ 건축: '1000', 장비: true }).대상 === true && /^1호/.test(특({ 건축: '1000', 장비: true }).걸림[0]) && 특({ 건축: '1000' }).대상 === null && /5일 이상 쓰면 대상/.test(특({ 건축: '1000' }).까닭) && 특({ 해체: '3000', 장비: true }).대상)
  ok('대수선 1,000 · 토목 연장 500 · 조경 9,000 은 특정공사 규모에 안 듦(비산먼지만)', 특({ 대수선: '1000', 장비: true }).대상 === false && 특({ 토목연장: '500', 장비: true }).대상 === false && 특({ 조경: '9000', 장비: true }).대상 === false)
  ok('토목 1,000㎥ · 1,000㎡ → 2호 · 토공 1,000 → 3호 · 굴정 200m · 200㎥ → 4호', /^2호/.test(특({ 토목용적: '1000', 장비: true }).걸림[0]) && 특({ 토목면적: '1000', 장비: true }).대상 && /^3호/.test(특({ 토공: '1000', 장비: true }).걸림[0]) && /^4호/.test(특({ 굴정토량: '200', 장비: true }).걸림[0]))
  ok('작은 공사라도 공동주택 50m · 주거지역 · 지구단위(주거형) → 5호 · 유치원 50m 만이면 5호 아님', /^5호/.test(특({ 건축: '200', 장비: true, 가까이: { 공동주택: true } }).걸림[0]) && 특({ 장비: true, 가까이: { 지구: true } }).대상 && 특({ 건축: '200', 장비: true, 가까이: { 유치원: true } }).대상 === false)
  ok('산업단지 등 제외 지역 → 대상 아님(제21조① 단서 · 제20조①)', 특({ 건축: '5000', 장비: true, 제외: true }).대상 === false && /제20조①/.test(특({ 건축: '5000', 장비: true, 제외: true }).까닭))
  ok('별표 9 열하나(항타기 ~ 콘크리트 펌프) · 가까이 아홉(소음 여덟 · 비산 여덟)', L.장비들.length === 11 && /^항타기/.test(L.장비들[0]) && L.장비들[10] === '콘크리트 펌프' && L.가까이들.length === 9 && L.가까이들.filter((x) => x.소음).length === 8 && L.가까이들.filter((x) => x.비산).length === 8)
}
console.log('③ 폐기물 · 신고 넷')
{
  ok('건설폐기물 4.9톤 → 아님 · 5톤 → 대상 · 빈칸 → null · 사업장 고르면 true', L.폐기물({ 건폐톤: '4.9' }).건설 === false && L.폐기물({ 건폐톤: '5' }).건설 === true && L.폐기물({}).건설 === null && L.폐기물({ 사업장: true }).사업장 === true)
  const 신 = Object.fromEntries(L.신고들.map((x) => [x.k, x]))
  ok('언제 — 비산 · 특정 «착공 전» · 건폐 · 사업장 «착공일까지»', 신.비산.언제 === '착공 전' && 신.특정.언제 === '착공 전' && 신.건폐.언제 === '착공일까지' && 신.사업장.언제 === '착공일까지')
  ok('누가 — 최초로 도급받은 자 · 배출자(분리 발주면 발주자) · 어디 — 둘 이상이면 면적 큰 곳(비산먼지는 길이로 신고하면 가장 긴 곳 — 대기법 제43조②)', /최초로 공사를 도급받은 자/.test(신.비산.누가) && /최초로 공사를 도급받은 자/.test(신.특정.누가) && /분리 발주했으면 발주자/.test(신.건폐.누가) && /면적이 가장 큰 곳/.test(신.비산.어디) && /길이로 신고하면 가장 긴 곳/.test(신.비산.어디) && /면적이 가장 많은 곳/.test(신.특정.어디) && !/길이/.test(신.특정.어디))
  ok('서식 링크 — 비산 · 특정만(사이트 서식) · 건폐 · 사업장은 별지 제7호 이름만', 신.비산.서식 === '/forms/bisan-singo' && 신.특정.서식 === '/forms/teukjeong-singo' && !신.건폐.서식 && /별지 제7호/.test(신.건폐.서식이름) && /별지 제7호/.test(신.사업장.서식이름))
  ok('근거 넷 — 별표 13 · 제21조 · 제17조 · 제18조 · 지침 · 함께 내기(제58조① 단서) · 사업장 풀이(오니 · 옛 매립 · 방치)', /별표 13 제5호/.test(L.근거.비산) && /제21조①②/.test(L.근거.특정) && /제17조①/.test(L.근거.건폐) && /제18조①4/.test(L.근거.사업장) && /업무처리지침/.test(L.근거.사업장) && /제58조① 단서/.test(L.함께) && /폐수처리오니/.test(L.사업장풀이) && /옛 매립/.test(L.사업장풀이))
}
console.log('④ 글 · 빠른찾기 · 등록')
{
  const 자료 = JSON.parse(fs.readFileSync(path.join(뿌리, 'web/src/data/tools.json'), 'utf8'))
  const t = 자료.tools.find((x) => x.slug === 'env-reports')
  ok('tools.json env-reports · cat work · tail 빈 글 · 설명 셋 · 제목 «착공 전 환경 신고 판단기 —»', !!t && t.cat === 'work' && t.tail === '' && t.secs.length === 3 && /^착공 전 환경 신고 판단기 — /.test(t.title), t && [t.cat, t.tail, t.secs.length])
  ok('«무료» · «클로드» 없음(tools.json 글 · lib 글)', !/무료|클로드/.test(JSON.stringify(t || {}) + fs.readFileSync(path.join(뿌리, 'web/src/lib/환경신고.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')))
  const 찾 = await import(pathToFileURL(path.join(뿌리, 'web/src/lib/빠른찾기.js')).href)
  const 읽 = (x) => JSON.parse(fs.readFileSync(path.join(뿌리, 'web/src/data', x), 'utf8'))
  const 목 = 찾.목록만들기({ 탭: [], tools: 읽('tools.json'), forms: 읽('forms-min.json'), change: 읽('change.json'), guide: 읽('guide.json'), cad: 읽('cad.json') })
  const 맨위 = (q) => (찾.찾기(목, q, 3)[0] || {}).to
  ok('빠른찾기 «비산먼지 신고» · «비산먼지 발생사업» → 신고서 · «특정공사» · «특정공사 사전신고» → 사전신고서(서식이 먼저)', 맨위('비산먼지 신고') === '/forms/bisan-singo' && 맨위('비산먼지 발생사업') === '/forms/bisan-singo' && 맨위('특정공사') === '/forms/teukjeong-singo' && 맨위('특정공사 사전신고') === '/forms/teukjeong-singo', ['비산먼지 신고', '비산먼지 발생사업', '특정공사', '특정공사 사전신고'].map(맨위))
  const 말 = ['환경 신고', '착공 전 환경', '건설폐기물 신고', '폐기물 처리계획', '사업장폐기물']
  ok('빠른찾기 «환경 신고» · «착공 전 환경» · «건설폐기물 신고» · «폐기물 처리계획» · «사업장폐기물» → 이 도구', 말.every((q) => 맨위(q) === '/tools/env-reports'), 말.map(맨위))
  const 칸 = fs.readFileSync(path.join(뿌리, 'web/src/tools/계약칸.jsx'), 'utf8')
  ok('등록(계약CALCS · EXAMPLES) · 서식 · 공기연장 · 낙찰 뒤 할 일 링크', /'env-reports': EnvReports,/.test(칸) && /'env-reports': \{ 글: '근린생활시설 신축/.test(칸) && /to="\/tools\/time-extension" className="kr-link">공기연장 때 할 일 →/.test(칸))
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
    await p.goto(BASE + '/tools/env-reports', { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('.tool.er', { timeout: 20000 }); await p.waitForTimeout(600)
    return { ctx, p, 오류 }
  }
  const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  const 본문 = (p) => p.evaluate(() => (document.querySelector('.tool.er') || {}).innerText || '')
  const 배지 = (p) => p.evaluate(() => [...document.querySelectorAll('.tool.er .er-card .er-badge')].map((x) => x.textContent.trim()))
  console.log('⑤ 화면 — 폰 390')
  {
    const { ctx, p, 오류 } = await 새쪽(390, 844, true)
    ok('처음 → 공사 고르기 아홉 · 규모 칸 없음(폐기물 · 착공일만) · «넣으면 신고마다 판정» · 카드 넷 모두 «확인»', (await p.locator('.tool.er .er-kind').count()) === 9 && (await p.locator('.tool.er input[inputmode="decimal"]').count()) === 1 && /넣으면 신고마다 판정합니다/.test(await 본문(p)) && (await 배지(p)).join() === '확인,확인,확인,확인', await 배지(p))
    await p.locator('button', { hasText: '예시로 해 보기' }).first().click(); await p.waitForTimeout(500)
    let 글 = await 본문(p)
    ok('예시(근생 3,200㎡ · 토공 1,800㎡ · 장비 · 공동주택 50m · 건폐 120톤 · 11. 16.) → 셋 대상 · 사업장 확인 · «착공 전에 낼 신고 3가지» · 착공일', (await 배지(p)).join() === '✓ 신고 대상,✓ 신고 대상,✓ 신고 대상,확인' && /착공 전에 낼 신고 3가지/.test(글) && /2026\. 11\. 16\. 전/.test(글), [await 배지(p), 글.slice(0, 300)])
    ok('예시는 건축 · 토공만 골라 규모 칸 둘 + 폐기물', (await p.locator('.tool.er .er-kind.on').count()) === 2 && (await p.locator('.tool.er input[inputmode="decimal"]').count()) === 3)
    ok('비산 걸림 가 · 라 2) · 특정 1호 · 3호 · 5호(공동주택) · 건폐 120톤 · 서식 링크 둘', /가 — 건축물축조/.test(글) && /라 2\) — 토공/.test(글) && /1호 — 건축/.test(글) && /3호 — 토공/.test(글) && /5호 — 시행령 제2조② 지역\(공동주택 50m 안\)/.test(글) && /120톤/.test(글) && (await p.locator('.tool.er a[href="/forms/bisan-singo"]').count()) === 1 && (await p.locator('.tool.er a[href="/forms/teukjeong-singo"]').count()) === 1)
    if (OUT) {
      await p.evaluate(() => { for (const e of document.querySelectorAll('body *')) { const s = getComputedStyle(e); if (s.position === 'fixed' || s.position === 'sticky') e.style.setProperty('display', 'none', 'important') } })
      await p.locator('.tool.er').screenshot({ path: OUT + '/환경신고_예시_폰390.png' })
    }
    await p.locator('.tool.er .kt-chk', { hasText: '5일 이상' }).locator('input').uncheck(); await p.waitForTimeout(200)
    ok('장비 끄면 특정공사 «확인»(5일 이상 쓰면 대상)', (await 배지(p))[1] === '확인' && /5일 이상 쓰면 대상/.test(await 본문(p)))
    await p.locator('.tool.er .kt-chk', { hasText: '건설폐기물이 아닌 사업장폐기물' }).locator('input').check(); await p.waitForTimeout(200)
    ok('사업장폐기물 고르면 «✓ 신고 대상» · 착공일까지', (await 배지(p))[3] === '✓ 신고 대상' && /착공일까지\(2026\. 11\. 16\.까지\)/.test(await 본문(p)))
    await p.locator('.tool.er input[inputmode="decimal"]').nth(0).fill('500'); await p.locator('.tool.er input[inputmode="decimal"]').nth(1).fill('300'); await p.waitForTimeout(250)
    글 = await 본문(p)
    ok('건축 500 · 토공 300 + 공동주택 50m → 비산 «대상 아님» 이지만 조례 안내', (await 배지(p))[0] === '대상 아님' && /조례로 신고 대상일 수 있음/.test(글))
    await p.locator('.tool.er .er-kind', { hasText: '토공' }).locator('input').uncheck(); await p.waitForTimeout(200)
    ok('토공을 풀면 그 칸이 사라지고 판정에서도 빠짐(특정 3호 없음)', (await p.locator('.tool.er input[inputmode="decimal"]').count()) === 2 && !/3호 — 토공/.test(await 본문(p)))
    글 = await 본문(p)
    ok('폰 390 넘침 0 · 오류 0 · «무료» «클로드» NaN undefined 없음', (await 넘침(p)) <= 0 && !오류.length && !/무료|클로드|NaN|undefined/.test(글), [await 넘침(p), 오류])
    const { p: p2, 오류: 오류2 } = await 새쪽(390, 844, true, ctx)
    ok('다시 열면 넣은 값 그대로(건축 500 · 토공 풀림 · 사업장 체크)', (await p2.locator('.tool.er input[inputmode="decimal"]').nth(0).inputValue()) === '500' && (await p2.locator('.tool.er .er-kind.on').count()) === 1 && (await p2.locator('.tool.er .kt-chk', { hasText: '건설폐기물이 아닌 사업장폐기물' }).locator('input').isChecked()) && !오류2.length)
    await ctx.close()
  }
  console.log('⑤ 폭 320 · 1280')
  {
    const { ctx, p, 오류 } = await 새쪽(320, 640, true)
    await p.locator('button', { hasText: '예시로 해 보기' }).first().click(); await p.waitForTimeout(400)
    ok('320 넘침 0 · 오류 0', (await 넘침(p)) <= 0 && !오류.length, [await 넘침(p), 오류])
    await ctx.close()
  }
  {
    const { ctx, p, 오류 } = await 새쪽(1280, 860, false)
    await p.locator('button', { hasText: '예시로 해 보기' }).first().click(); await p.waitForTimeout(400)
    ok('PC 1280 — 예시 3가지 · 넘침 0 · 오류 0', /착공 전에 낼 신고 3가지/.test(await 본문(p)) && (await 넘침(p)) <= 0 && !오류.length, 오류)
    if (OUT) await p.locator('.tool.er').screenshot({ path: OUT + '/환경신고_예시_PC1280.png' })
    await ctx.close()
  }
  await b.close()
}
console.log(`\n${bad ? '✗' : '✓'} 시험_환경신고 ${n - bad}/${n}`)
if (bad) process.exit(1)
