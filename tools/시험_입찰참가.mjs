/**
 * 🧪 G562 입찰 참가 가능 금액(/tools/bid-eligible) — 시공능력평가액 · 실적 제한 · 공동이행 (2026-11-06)
 *   lib 모드(주소 없이):  LANG=C.UTF-8 node tools/시험_입찰참가.mjs          — lib/입찰참가.js · tools.json · 빠른찾기 · 등록
 *   화면 모드(구운 사이트): LANG=C.UTF-8 node tools/시험_입찰참가.mjs http://127.0.0.1:4986   · OUT=폴더 면 화면 사진
 *   소장님 「1번 부터 5번까지 작업해줘」 — 카페 도구 후보 ⑤-3(«시평액이 추정가격보다 적은데 단독으로 들어갈 수 있나»)
 *   ① 문턱(30억 · 3억 «이상») · 상한(국가 1배 · 지방 2배) ② 시평 판정(모자람 · 여유 · 상한 넘음 · 제한 못 하는 규모)
 *   ③ 제한 없음(지방 원문 그대로 · 국가 공고) ④ 실적(한 건 · 1배 · 규모 · 특수 공법) ⑤ 안전선(막히지 않는 공사)
 *   ⑥ 공동이행(국가 합산 · 지방 시평 × 지분 · 실적 한 곳) ⑦ 근거 · 안내 ⑧ tools.json · 빠른찾기 · 등록 · 예시는 가상 숫자
 *   ⑨ 화면: 예시 → 막히지 않음 · 상한 64억 · 30억 미만 · 시평으로 바꾸면 11억 모자람 → 공동이행 32억 7,600만 → 들어감 · 국가 66억 · 폭 320 · 390 · 1280 넘침 0 · 오류 0
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
const L = await import(pathToFileURL(path.join(뿌리, 'web/src/lib/입찰참가.js')).href)
const 판 = (o) => L.판정(o)

console.log('① 문턱 · 상한')
{
  ok('종합 29억 9,999만 9,999원 → 못 검 · 30억 → 걸 수 있음 · 전문 2억 9,999만 9,999원 → 못 검 · 3억 → 걸 수 있음 · 빈 칸 → null',
    L.걸수({ 종류: '종합', 추정: '2,999,999,999' }).걸 === false && L.걸수({ 종류: '종합', 추정: '30억' }).걸 === true &&
    L.걸수({ 종류: '전문', 추정: '299,999,999' }).걸 === false && L.걸수({ 종류: '전문', 추정: '3억' }).걸 === true && L.걸수({ 종류: '종합', 추정: '' }).걸 === null)
  ok('시평 상한 — 국가 1배(32억) · 지방 2배(64억) · 실적 금액 상한 1배(32억)', 판({ 발주: '국가', 추정: '32억' }).상한 === 3200000000 && 판({ 발주: '지방', 추정: '32억' }).상한 === 6400000000 && 판({ 발주: '지방', 추정: '32억' }).실적상한 === 3200000000 && L.시평배.국가 === 1 && L.시평배.지방 === 2)
}
console.log('② 시평 판정')
{
  const a = 판({ 발주: '국가', 종류: '종합', 추정: '32억', 제한: '시평', 기준: '32억', 우리: '21억' })
  ok('국가 32억 · 기준 32억 · 우리 21억 → 모자람 11억 · «공동이행으로»', a.결과 === 'no' && a.모자람 === 1100000000 && /11억 원 모자랍니다/.test(a.제목) && /공동이행/.test(a.글) && !a.알림.length, a)
  const b = 판({ 발주: '국가', 종류: '종합', 추정: '32억', 제한: '시평', 기준: '32억', 우리: '32억' })
  ok('우리 = 기준 → 들어감 · 여유 0 이면 «여유» 말 없음', b.결과 === 'yes' && b.여유 === 0 && !/여유/.test(b.글), b)
  ok('우리 35억 → 여유 3억', /여유 3억 원/.test(판({ 발주: '국가', 추정: '32억', 제한: '시평', 기준: '32억', 우리: '35억' }).글))
  ok('국가 기준 33억(상한 32억 넘음) → 알림 «상한(추정가격의 1배 = 32억 원)» · 지방 64억 → 알림 없음 · 64억 1원 → 알림', /상한\(추정가격의 1배 = 32억 원\)/.test(판({ 발주: '국가', 추정: '32억', 제한: '시평', 기준: '33억', 우리: '40억' }).알림.join()) && !판({ 발주: '지방', 추정: '32억', 제한: '시평', 기준: '64억', 우리: '70억' }).알림.length && /2배 = 64억 원/.test(판({ 발주: '지방', 추정: '32억', 제한: '시평', 기준: '6,400,000,001', 우리: '70억' }).알림.join()))
  ok('25억 종합 공고에 시평 제한 → 알림 «제한할 수 없는 규모» · 기준이나 우리가 비면 «넣으면 판정»', /시공능력으로 제한할 수 없는 규모/.test(판({ 발주: '지방', 종류: '종합', 추정: '25억', 제한: '시평', 기준: '25억', 우리: '20억' }).알림.join()) && 판({ 제한: '시평', 추정: '32억', 기준: '', 우리: '21억' }).결과 === 'q' && /넣으면 판정/.test(판({ 제한: '시평', 추정: '32억' }).제목))
}
console.log('③ 제한 없음')
{
  ok('지방 원문 그대로 — «시공능력평가액으로 제한하지 않은 경우 … 미달되더라도 입찰에 참가할 수 있다.»', L.미달원문 === '시공능력평가액으로 제한하지 않은 경우 시공능력평가액이 해당공사의 추정가격에 미달되더라도 입찰에 참가할 수 있다.' && 판({ 발주: '지방', 추정: '32억', 제한: '없음', 우리: '21억' }).글.includes(L.미달원문) && 판({ 발주: '지방', 제한: '없음' }).결과 === 'yes')
  ok('국가 → «참가 자격은 입찰공고에 적힙니다» · 원문(지방) 글은 안 씀 · 25억이면 «애초에 시평으로 제한할 수 없는 규모 — 실적은 특수 공법만»', /참가 자격은 입찰공고에 적힙니다/.test(판({ 발주: '국가', 추정: '32억', 제한: '없음' }).글) && !판({ 발주: '국가', 제한: '없음' }).글.includes(L.미달원문) && /애초에 시평으로 제한할 수 없는 규모\(추정가격 30억원 미만 종합공사\)입니다 — 실적 제한도 특수한 기술 · 공법이 요구되는 공사만/.test(판({ 발주: '국가', 종류: '종합', 추정: '25억', 제한: '없음' }).글) && !/애초에/.test(판({ 발주: '국가', 추정: '32억', 제한: '없음' }).글))
}
console.log('④ 실적')
{
  const a = 판({ 발주: '국가', 추정: '32억', 제한: '실적금액', 기준: '20억', 실적: '18억' })
  ok('실적 금액 20억 · 우리 한 건 18억 → 2억 모자람 · 국가는 «합산» · 지방은 «한 곳이라도»', a.결과 === 'no' && a.모자람 === 200000000 && /합산/.test(a.글) && /한 곳이라도/.test(판({ 발주: '지방', 추정: '32억', 제한: '실적금액', 기준: '20억', 실적: '18억' }).글), a)
  ok('실적 기준 33억 > 추정가격 32억 → 알림 «1배 이내» · 20억이면 알림 없음', /추정가격의 1배 이내/.test(판({ 추정: '32억', 제한: '실적금액', 기준: '33억', 실적: '40억' }).알림.join()) && !판({ 추정: '32억', 제한: '실적금액', 기준: '20억', 실적: '40억' }).알림.length)
  const g = 판({ 발주: '국가', 종류: '전문', 추정: '5억', 제한: '실적규모', 기준: '1,200', 실적: '1500.5' })
  ok('실적 규모 1,200 · 우리 1,500.5 → 들어감(단위 없이 수만 · 금액 상한 알림 없음)', g.결과 === 'yes' && g.기준 === 1200 && g.실적 === 1500.5 && /1,500\.5/.test(g.글) && !g.알림.length, g)
  ok('25억 종합에 실적 제한 → «특수한 기술 · 공법 … 실적으로 제한할 수 있음»(시행령 제21조①2 · 제20조①2)', /특수한 기술 · 공법이 요구되는 공사는 금액과 관계없이 실적으로 제한할 수 있음 — 국가계약법 시행령 제21조①2 · 지방계약법 시행령 제20조①2/.test(판({ 종류: '종합', 추정: '25억', 제한: '실적금액', 기준: '20억', 실적: '25억' }).알림.join()))
}
console.log('⑤ 안전선')
{
  const 글 = (o) => L.안전선글(L.안전선(o))
  ok('국가 시평 50억 → «추정가격 50억 원 이하» · 지방 50억 → «30억 원 미만»(가장 높게 걸면 60억) · 지방 100억 → «50억 원 이하»', 글({ 발주: '국가', 우리: '50억' }).v === '추정가격 50억 원 이하' && 글({ 발주: '지방', 우리: '50억' }).v === '추정가격 30억 원 미만' && /기준 60억 원/.test(글({ 발주: '지방', 우리: '50억' }).풀이) && 글({ 발주: '지방', 우리: '100억' }).v === '추정가격 50억 원 이하')
  ok('전문 국가 시평 2억 → «3억 원 미만» · 시평 안 넣으면 null', 글({ 발주: '국가', 종류: '전문', 우리: '2억' }).v === '추정가격 3억 원 미만' && L.안전선({ 우리: '' }) === null && L.안전선글(null) === null)
}
console.log('⑥ 공동이행')
{
  const 줄 = [{ 시평: '21억', 지분: '51' }, { 시평: '45억', 지분: '49' }, {}]
  const k = L.공동셈({ 발주: '국가', 제한: '시평' }, 줄), j = L.공동셈({ 발주: '지방', 제한: '시평' }, 줄)
  ok('국가 시평 = 모두 합산 66억 · 지방 = 21억 × 51% + 45억 × 49% = 32억 7,600만 · 빈 줄은 안 셈 · 지분 합 100', k.시평합 === 6600000000 && j.시평합 === 3276000000 && k.줄수 === 2 && j.지분합 === 100 && /합산/.test(k.풀이.시평) && /× 지분/.test(j.풀이.시평), [k, j])
  ok('지방 지분 빈 구성원 셈 · 실적 — 국가 합산 39억 · 지방 가장 큰 한 곳 27억', L.공동셈({ 발주: '지방', 제한: '시평' }, [{ 시평: '21억', 지분: '60' }, { 시평: '45억' }]).지분빔 === 1 && L.공동셈({ 발주: '국가', 제한: '실적금액' }, [{ 실적: '12억' }, { 실적: '27억' }]).실적값 === 3900000000 && L.공동셈({ 발주: '지방', 제한: '실적금액' }, [{ 실적: '12억' }, { 실적: '27억' }]).실적값 === 2700000000)
}
console.log('⑦ 근거 · 안내')
{
  const g = L.근거
  ok('근거 — 시행령 제21조①1 · 시행규칙 제24조① · 제20조①1 · 제25조②2 · 집행기준 제5조① · ④1 · 공동계약운용요령 제9조② · 제6장 제2절 1.가.2) · 제4장 제3절 2.나 3) · 제36조 4호',
    /제21조①1/.test(g.국가제한) && /제24조①/.test(g.국가제한) && /제20조①1/.test(g.지방제한) && /제25조②2/.test(g.국가시평) && /제25조②2/.test(g.지방시평) && /제5조①/.test(g.국가한건) && /제5조④1/.test(g.국가중복) && /제9조②/.test(g.국가공동) && /제6장 제2절 1\.가\.2\)/.test(g.지방공동) && /제4장 제3절 2\.나 3\)/.test(g.지방없음) && /제36조 4호/.test(g.국가없음) && /제4장 제3절 1\.나/.test(g.지방중복) && /제4장 제1절 2\.나/.test(g.지방한건) && /제3절 2\.가 4\)/.test(g.지방십년))
  const 지 = L.안내('지방').join('\n'), 국 = L.안내('국가').join('\n')
  ok('안내 — 둘 다 «한 건» · «중복 제한 금지» · 지방만 «특별한 사유가 없으면 … 최근 10년 이내» · 규모 국가 1배 · 지방 3분의 1', /한 건/.test(지) && /한 건/.test(국) && /중복 제한 금지/.test(국) && /특별한 사유가 없으면 입찰공고일 전일까지 검사가 끝난 \*\*최근 10년 이내\*\*/.test(지) && !/10년/.test(국) && /\*\*1배 이내\*\*/.test(국) && /\*\*3분의 1 이내\*\*/.test(지))
  ok('근거 모두(근거줄 한 줄 — 같은 법 이름을 되풀이하지 않음) — 국가 · 지방', /^국가계약법 시행령 제21조①1 · 2 · 제36조 4호 · 시행규칙 제24조① · 제25조② · 정부 입찰 · 계약 집행기준 제5조① · ④1 · 공동계약운용요령 제9조②$/.test(g.국가모두) && /^지방계약법 시행령 제20조①1 · 2 · 시행규칙 제25조② · 지방자치단체 입찰 및 계약 집행기준 제4장 제1절 2\.나 · 제3절 1\.나 · 2\.가 · 2\.나 · 제6장 제2절 1\.가\.2\)$/.test(g.지방모두) && (g.지방모두.match(/지방 집행기준|지방자치단체 입찰 및 계약 집행기준/g) || []).length === 1)
  ok('«무료» · «클로드» 없음(lib 글)', !/무료|클로드/.test(fs.readFileSync(path.join(뿌리, 'web/src/lib/입찰참가.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')))
}
console.log('⑧ tools.json · 빠른찾기 · 등록')
{
  const 도 = JSON.parse(fs.readFileSync(path.join(뿌리, 'web/src/data/tools.json'), 'utf8'))
  const t = 도.tools.find((x) => x.slug === 'bid-eligible')
  ok('tools.json bid-eligible — 갈래 bid · 🎯 · tail 빈 글(구운 제목 겹침 없음) · 판단기 · 세 마디 · 근거 줄 · 30억 · 1배 · 2배', !!t && t.cat === 'bid' && t.icon === '🎯' && t.tail === '' && t.badge === '판단기' && t.secs.length === 3 && t.secs.every((s) => s.p.some((p) => /^근거:/.test(p))) && /30억원 이상/.test(t.lead) && /1배/.test(t.lead) && /2배/.test(t.lead) && t.secs[2].p[0].includes(L.미달원문), t)
  ok('«무료» · «클로드» 없음(tools.json 글)', !/무료|클로드/.test(JSON.stringify(t || {})))
  const 찾 = await import(pathToFileURL(path.join(뿌리, 'web/src/lib/빠른찾기.js')).href)
  const 읽 = (x) => JSON.parse(fs.readFileSync(path.join(뿌리, 'web/src/data', x), 'utf8'))
  const 목 = 찾.목록만들기({ 탭: [], tools: 읽('tools.json'), forms: 읽('forms-min.json'), change: 읽('change.json'), guide: 읽('guide.json'), cad: 읽('cad.json') })
  const 맨위 = (q) => (찾.찾기(목, q, 3)[0] || {}).to
  const 말 = ['시평', '시평액', '시공능력평가액', '입찰 참가 자격', '단독 투찰', '시평 합산', '실적 제한', '제한입찰', '입찰 가능 금액']
  ok('빠른찾기 «시평» · «시공능력평가액» · «입찰 참가 자격» · «단독 투찰» · «시평 합산» · «실적 제한» … → 이 도구', 말.every((q) => 맨위(q) === '/tools/bid-eligible'), 말.map(맨위))
  ok('빠른찾기 그대로 — «실적인정기간» · «시공경험» · «적격심사» → 서류 길잡이 · «공동도급» → 기성 나누기 · «공동수급» → 협정서 · «입찰» 맨 위 공고', 맨위('실적인정기간') === '/tools/qualify-docs' && 맨위('시공경험') === '/tools/qualify-docs' && 맨위('적격심사') === '/tools/qualify-docs' && 맨위('공동도급') === '/tools/joint-split' && 맨위('공동수급') === '/forms/gy-gongdong' && 맨위('입찰') === '/live', ['실적인정기간', '시공경험', '적격심사', '공동도급', '공동수급', '입찰'].map(맨위))
  const 칸 = fs.readFileSync(path.join(뿌리, 'web/src/tools/계약칸.jsx'), 'utf8')
  ok('등록(계약CALCS · EXAMPLES) · 공동도급 마당 · 적격심사 길잡이 · 합산기 링크', /'bid-eligible': BidEligible,/.test(칸) && /'bid-eligible': \{ 글: '지자체 종합공사/.test(칸) && /to="\/gongdong" className="kr-link">공동도급 마당/.test(칸) && /to="\/tools\/qualify-docs" className="kr-link">적격심사 서류 길잡이/.test(칸) && /to="\/tools\/qualify-score" className="kr-link">적격심사 점수 합산기/.test(칸))
  const 예 = (칸.match(/'bid-eligible': \{ 글: [^\n]*/) || [''])[0]
  ok('예시는 가상 숫자(32억 · 21억) — 카페 질문 숫자를 옮기지 않음', /32억 원/.test(예) && /21억 원/.test(예) && !/19\.69|33\.84|45\.15|60\.89|1,969|3,384/.test(예), 예)
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
    await p.goto(BASE + '/tools/bid-eligible', { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('.tool.be', { timeout: 20000 }); await p.waitForTimeout(600)
    return { ctx, p, 오류 }
  }
  const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  const 본문 = (p) => p.evaluate(() => (document.querySelector('.tool.be') || {}).innerText || '')
  const 고름 = (p, i, v) => p.locator('.tool.be .tl-grid select').nth(i).selectOption(v)
  console.log('⑨ 화면 — 폰 390')
  {
    const { ctx, p, 오류 } = await 새쪽(390, 844, true)
    ok('처음 → 칸 넷(발주 · 종류 · 추정가격 · 제한) + 우리 시평 · «추정가격을 넣으면» · 공동이행 접힘 없음(제한 없음)', (await p.locator('.tool.be .tl-grid select').count()) === 3 && /추정가격을 넣으면/.test(await 본문(p)) && (await p.locator('.tool.be .be-jv').count()) === 0)
    await p.locator('button', { hasText: '예시로 해 보기' }).first().click(); await p.waitForTimeout(500)
    let 글 = await 본문(p)
    ok('예시(지자체 종합 32억 · 제한 없음 · 시평 21억) → 막히지 않음 + 원문 · 걸 수 있는 규모 · 64억 원(× 2) · 32억 원(× 1) · «추정가격 30억 원 미만»', /시공능력평가액 · 실적으로는 막히지 않습니다/.test(글) && 글.includes(L.미달원문) && /걸 수 있는 규모/.test(글) && /64억 원 \(추정가격 × 2\)/.test(글) && /32억 원 \(추정가격 × 1\)/.test(글) && /추정가격 30억 원 미만/.test(글) && /시평으로 안 막히는 공사/.test(글), 글.slice(0, 900))
    if (OUT) {
      await p.evaluate(() => { for (const e of document.querySelectorAll('body *')) { const s = getComputedStyle(e); if (s.position === 'fixed' || s.position === 'sticky') e.style.setProperty('display', 'none', 'important') } })
      await p.locator('.tool.be').screenshot({ path: OUT + '/입찰참가_예시_폰390.png' })
    }
    await 고름(p, 2, '시평'); await p.waitForTimeout(250)
    ok('제한을 «시공능력평가액» 으로 → 공고 기준 칸 · 빨리 넣기 둘(지자체 × 2) · «넣으면 판정»', /공고 시평액 기준/.test(await 본문(p)) && (await p.locator('.tool.be .be-quick button').count()) === 2 && /공고의 시평액 기준과 우리 시평액을 넣으면 판정합니다/.test(await 본문(p)))
    await p.locator('.tool.be .be-quick button', { hasText: '추정가격만큼' }).click(); await p.waitForTimeout(250)
    글 = await 본문(p)
    ok('«추정가격만큼» → 기준 32억 · «단독으로는 시평액이 11억 원 모자랍니다» · 공동이행 펼쳐짐 · 지분 칸', /단독으로는 시평액이 11억 원 모자랍니다/.test(글) && (await p.locator('.tool.be details.be-jv[open]').count()) === 1 && (await p.locator('.tool.be .be-rows.w3').count()) === 1, 글.slice(0, 700))
    await p.locator('.tool.be input[aria-label="우리 지분"]').fill('51')
    await p.locator('.tool.be input[aria-label="구성원 2 시평액"]').fill('4500000000')
    await p.locator('.tool.be input[aria-label="구성원 2 지분"]').fill('49'); await p.waitForTimeout(300)
    글 = await 본문(p)
    ok('구성원 2(시평 45억 · 49%) + 우리 51% → 공동이행 시평액 32억 7,600만 원 · 지분 합계 100% · «공동이행이면 들어갈 수 있습니다»', /32억 7,600만 원/.test(글) && /100%/.test(글) && /공동이행이면 들어갈 수 있습니다/.test(글), 글.slice(-1400))
    if (OUT) await p.locator('.tool.be').screenshot({ path: OUT + '/입찰참가_공동_폰390.png' })
    await 고름(p, 0, '국가'); await p.waitForTimeout(300)
    글 = await 본문(p)
    ok('국가로 바꾸면 → 합산 66억 원 · 지분 칸 없음 · 빨리 넣기 «× 2» 없음 · 상한 32억 원(× 1)', /66억 원/.test(글) && (await p.locator('.tool.be .be-rows.w3').count()) === 0 && (await p.locator('.tool.be .be-quick button').count()) === 1 && /32억 원 \(추정가격 × 1\)/.test(글))
    await 고름(p, 2, '실적금액'); await p.waitForTimeout(250)
    글 = await 본문(p)
    ok('실적 금액으로 → «공고 실적 기준» · «우리 가장 큰 한 건» · 우리 시평 칸 없음 · 안전선 줄 없음', /공고 실적 기준/.test(글) && /우리 가장 큰 한 건/.test(글) && !/우리 시평액/.test(글) && !/막히지 않는 공사/.test(글))
    ok('근거줄 한 줄 · 결과 이름표 · 값이 낱말 가운데서 안 쪼개짐(«시평으로 안 막히는 공사» · «추정가격 30억 원 미만» keep-all)', (await p.locator('.tool.be .kt-law').count()) === 1 && (await p.evaluate(() => [...document.querySelectorAll('.tool.be .tl-o span, .tool.be .tl-o b')].every((e) => getComputedStyle(e).wordBreak === 'keep-all'))))
    ok('폰 390 넘침 0 · 오류 0 · «무료» «클로드» NaN undefined 없음', (await 넘침(p)) <= 0 && !오류.length && !/무료|클로드|NaN|undefined/.test(글), [await 넘침(p), 오류])
    const { p: p2 } = await 새쪽(390, 844, true, ctx)
    ok('다시 열면 넣은 값 그대로(국가 · 실적 금액 · 기준 32억)', (await p2.locator('.tool.be .tl-grid select').nth(0).inputValue()) === '국가' && (await p2.locator('.tool.be .tl-grid select').nth(2).inputValue()) === '실적금액' && /3,200,000,000/.test(await p2.locator('.tool.be .tl-grid input').nth(1).inputValue()))
    await ctx.close()
  }
  console.log('⑨ 폭 320 · 1280')
  {
    const { ctx, p, 오류 } = await 새쪽(320, 640, true)
    await p.locator('button', { hasText: '예시로 해 보기' }).first().click(); await p.waitForTimeout(400)
    await 고름(p, 2, '시평'); await p.waitForTimeout(200)
    await p.locator('.tool.be .be-quick button', { hasText: '추정가격 × 2' }).click(); await p.waitForTimeout(250)
    ok('320 — 시평 기준 64억(× 2) → 43억 원 모자람 · 넘침 0 · 오류 0', /43억 원 모자랍니다/.test(await 본문(p)) && (await 넘침(p)) <= 0 && !오류.length, [await 넘침(p), 오류])
    await ctx.close()
  }
  {
    const { ctx, p, 오류 } = await 새쪽(1280, 860, false)
    await p.locator('button', { hasText: '예시로 해 보기' }).first().click(); await p.waitForTimeout(400)
    ok('PC 1280 — 예시 막히지 않음 · 넘침 0 · 오류 0', /막히지 않습니다/.test(await 본문(p)) && (await 넘침(p)) <= 0 && !오류.length, 오류)
    if (OUT) await p.locator('.tool.be').screenshot({ path: OUT + '/입찰참가_예시_PC1280.png' })
    await p.locator('.tool.be .tl-grid input').nth(0).fill('2500000000'); await p.waitForTimeout(300)
    const 작은 = await 본문(p)
    ok('추정가격 25억(종합)으로 → «걸 수 없는 규모» · 시평 상한 «제한 못 함» · 실적 «특수 기술 · 공법 공사만» · 판정에 «실적 제한도 특수한 기술 · 공법»', /걸 수 없는 규모/.test(작은) && /제한 못 함/.test(작은) && /특수 기술 · 공법 공사만/.test(작은) && /실적 제한도 특수한 기술 · 공법이 요구되는 공사만/.test(작은), 작은.slice(0, 900))
    await ctx.close()
  }
  await b.close()
}
console.log(`\n${bad ? '✗' : '✓'} 시험_입찰참가 ${n - bad}/${n}`)
if (bad) process.exit(1)
