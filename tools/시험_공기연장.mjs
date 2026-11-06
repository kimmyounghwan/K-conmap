/**
 * 🧪 G559 공기연장 때 할 일(/tools/time-extension) — 연장 청구 · 보증서 · 실비 · 신고 기한 (2026-11-06)
 *   lib 모드(주소 없이):  LANG=C.UTF-8 node tools/시험_공기연장.mjs          — lib/공기연장.js · tools.json · 빠른찾기 · 길잡이 · 등록
 *   화면 모드(구운 사이트): LANG=C.UTF-8 node tools/시험_공기연장.mjs http://127.0.0.1:4986   · OUT=폴더 면 화면 사진
 *   소장님 「1번 부터 5번까지 작업해줘」 — 카페 도구 후보 ⑤-1(공기연장)
 *   ① 할 일(국가 · 지방 원문 낱말 — 공사계약일반조건 제26조 · 집행기준 제73조 · 지방 집행기준 제1장 제8절 · 제9장 제7절 · 제8절):
 *      순서 · 기한(키스콘 30일 · 고용산재 14일 — 첫날 안 셈) · 장기계속 공백기간(국가만) · 하도급 · 퇴직공제 · 우리 책임 → 지체상금 둘
 *   ② 국가 · 지방 글이 섞이지 않게(«공사감독관을 거쳐» · «연장계약 체결 전까지» · «건설기계대여대금» · «30일 안에 조정» · «15일 안에» 는 지방만)
 *   ③ tools.json · 빠른찾기(«공기연장» → 도구 · «공기연장 신청서» → 서식 · «지체상금» · «퇴직공제» 그대로) · 길잡이 공백기간 바로잡음 · 지체상금 도구 링크
 *   ④ 화면: 예시 → 45일 · 키스콘 2027. 1. 11.(쉬는 날이라 미룸) · 고용산재 2026. 12. 24. · 할 일 아홉 · 우리 책임 · 지방 · 폭 320 · 390 · 1280 넘침 0 · 오류 0
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
const L = await import(pathToFileURL(path.join(뿌리, 'web/src/lib/공기연장.js')).href)

const 보기 = { 발주: '국가', 까닭: '없음', 지금: '2026-12-31', 새것: '2027-02-14', 합의: '2026-12-10', 장기: false, 하도급: true, 공제: true }
console.log('① 할 일 — 국가')
{
  const r = L.할일(보기)
  const 열 = r.단계.map((x) => x.k).join()
  ok('판정 yes · 연장 45일 · 순서(청구 · 인력 · 장비 · 보증 · 실비 · 하도급 · 키스콘 · 고용산재 · 환경 변경신고 · 퇴직공제)', r.판정 === 'yes' && r.일수.일 === 45 && 열 === 'cheong,saram,jangbi,bojeung,silbi,hado,kiscon,boheom,hwangyeong,gongje', [r.일수, 열])
  const 단 = (k) => r.단계.find((x) => x.k === k)
  ok('청구 — 날 = 지금 준공기한 · «계약기간이 끝나기 전에» · «수정공정표» · «계약담당공무원과 공사감독관»', 단('cheong').날 === '2026-12-31' && /계약기간이 끝나기 전에/.test(단('cheong').글) && /수정공정표/.test(단('cheong').글) && /계약담당공무원과 공사감독관/.test(단('cheong').글) && /제26조①/.test(단('cheong').근거))
  ok('키스콘 = 변경계약 + 30일(2027-01-09) · 고용산재 = + 14일(2026-12-24)', 단('kiscon').날 === '2027-01-09' && 단('boheom').날 === '2026-12-24', [단('kiscon').날, 단('boheom').날])
  ok('인력투입계획 «즉시» · 장비 «즉시» · «연간표준가동기간»(국가 낱말)', /즉시/.test(단('saram').글) && /즉시/.test(단('jangbi').글) && /연간표준가동기간/.test(단('jangbi').글) && /제73조②/.test(단('saram').근거) && /제73조⑤/.test(단('jangbi').근거))
  ok('보증 — «계약기간 종료일 이후» · 넷(계약 · 공사이행 · 하도급대금 · 공사손해보험) · 보증수수료 영수증 · 시행규칙 제55조①3나', /계약기간 종료일 이후/.test(단('bojeung').글) && /계약보증서 · 공사이행보증서 · 하도급대금지급보증서 · 공사손해보험/.test(단('bojeung').글) && /보증수수료 영수증/.test(단('bojeung').글) && /제55조①3나/.test(단('bojeung').근거))
  ok('실비 — «실비를 넘지 않는 범위» · «준공대가(장기계속은 차수별 준공대가)를 받기 전까지» · 자료 · 보증시공은 조정 없음', /실비를 넘지 않는 범위/.test(단('silbi').글) && /준공대가\(장기계속은 차수별 준공대가\)를 받기 전까지/.test(단('silbi').글) && /임금지급대장/.test(단('silbi').글) && /보증시공하는 연장은 조정 없음/.test(단('silbi').글) && /제26조④⑤/.test(단('silbi').근거))
  ok('하도급 — 30일 · 감리자 · 서면 승낙 예외 · 건산법 제29조⑥ · 시행령 제32조', /하도급계약을 바꾼 날부터 30일 안에/.test(단('hado').글) && /감리자/.test(단('hado').글) && /서면 승낙/.test(단('hado').글) && /제29조⑥ · 시행령 제32조①②/.test(단('hado').근거))
  ok('키스콘 «변경통보» · 1억원 이상 · 4천만원 · 고용산재 근로복지공단 · 퇴직공제 별지 제10호 · 지체 없이', /«변경통보»/.test(단('kiscon').글) && /1억원 이상/.test(단('kiscon').글) && /4천만원/.test(단('kiscon').글) && /근로복지공단/.test(단('boheom').글) && /별지 제10호/.test(단('gongje').글) && /지체 없이/.test(단('gongje').글))
  ok('환경 변경신고 — 비산먼지 «신고증명서에 적힌 공사기간의 종료일까지» 별지 제24호 · 특정공사 «사전신고증명서의 특정공사 기간이 끝나기 전까지» 별지 제12호 · 근거 제58조 · 제21조', /신고증명서에 적힌 공사기간의 종료일까지/.test(단('hwangyeong').글) && /별지 제24호/.test(단('hwangyeong').글) && /사전신고증명서의 특정공사 기간이 끝나기 전까지/.test(단('hwangyeong').글) && /별지 제12호/.test(단('hwangyeong').글) && /제58조①②5/.test(단('hwangyeong').근거) && /제21조④2 · ⑤/.test(단('hwangyeong').근거))
  ok('장기계속 체크 → 공백기간(2025. 12. 31. 이후 입찰공고 · 제26조⑨ · 부칙 <제812호>) — 국가만', L.할일({ ...보기, 장기: true }).단계.some((x) => x.k === 'gongbaek' && /2025\. 12\. 31\. 이후 입찰공고/.test(x.글) && /제26조⑨/.test(x.근거) && /제812호/.test(x.근거)) && !L.할일({ ...보기, 발주: '지방', 장기: true }).단계.some((x) => x.k === 'gongbaek'))
  ok('하도급 · 퇴직공제 안 고르면 그 두 줄 없음 · 변경계약 날 없으면 키스콘 · 고용산재 날 빈칸', (() => { const s = L.할일({ ...보기, 하도급: false, 공제: false, 합의: '' }); return !s.단계.some((x) => ['hado', 'gongje'].includes(x.k)) && s.단계.find((x) => x.k === 'kiscon').날 === '' && s.단계.find((x) => x.k === 'boheom').날 === '' })())
  ok('모든 단계에 근거 · 때 · 제목 · 제목과 때가 같은 말을 되풀이하지 않음(«준공대가» 두 번 등)', r.단계.every((x) => x.근거 && x.때 && x.제목 && !(/준공대가/.test(x.제목) && /준공대가/.test(x.때))))
  ok('맨 아래 근거 한 줄 — 국가 · 지방 모두 같은 법 이름 한 번씩(공사계약일반조건 · 지방 집행기준 · 건설산업기본법)', (L.근거.국가모두.match(/공사계약일반조건/g) || []).length === 1 && (L.근거.국가모두.match(/건설산업기본법/g) || []).length === 1 && (L.근거.지방모두.match(/지방자치단체 입찰 및 계약 집행기준/g) || []).length === 1 && !/공사계약일반조건/.test(L.근거.지방모두))
  ok('까닭 고르는 칸 글 짧게(폰에서 안 잘림 — 16자 이하)', L.까닭들.every((x) => x.이름.length <= 16), L.까닭들.map((x) => x.이름.length))
}
console.log('② 지방 · 우리 책임 · 날 셈')
{
  const r = L.할일({ ...보기, 발주: '지방' })
  const 단 = (k) => r.단계.find((x) => x.k === k)
  ok('지방 청구 — «공사감독관을 거쳐 계약담당자» · 날 없음(«지체 없이» — 지방 원문에 «기간 끝나기 전» 없음)', /공사감독관을 거쳐 계약담당자/.test(단('cheong').글) && 단('cheong').날 === '' && !/계약기간이 끝나기 전에/.test(단('cheong').글) && /제9장 제8절 2\.가/.test(단('cheong').근거))
  ok('지방 보증 — «연장계약 체결 전까지» · «계약기간 연장이 표시된 보증서 등» · 건설기계대여대금 · 실제 완료일 예외', /연장계약 체결 전까지/.test(단('bojeung').글) && /계약기간 연장이 표시된 보증서 등/.test(단('bojeung').글) && /건설기계대여대금 지급보증/.test(단('bojeung').글) && /실제 완료일까지 유효/.test(단('bojeung').글))
  ok('지방 실비 — 30일 안에 조정 · 준공대가 받기 전 · 지방 장비 «연간표준가동시간» · 지방 인력 «발주기관에 냅니다»', /30일 안에/.test(단('silbi').글) && /받기 전까지/.test(단('silbi').글) && /연간표준가동시간/.test(단('jangbi').글) && /인력투입계획을 발주기관에 냅니다/.test(단('saram').글))
  ok('지방 하도급 — 발주기관 15일 안 하도급 업체 통보 · 근거 제7절 4.나.5)', /15일 안에/.test(단('hado').글) && /제7절 4\.나\.5\)/.test(단('hado').근거))
  const g = L.할일(보기)
  const 국 = (k) => g.단계.find((x) => x.k === k)
  ok('국가 글엔 지방 낱말 없음(공사감독관을 거쳐 · 연장계약 체결 전까지 · 건설기계대여대금 · 15일 안에)', !/공사감독관을 거쳐/.test(국('cheong').글) && !/연장계약 체결 전까지/.test(국('bojeung').글) && !/건설기계대여대금/.test(국('bojeung').글) && !/15일 안에/.test(국('hado').글))
  const u = L.할일({ ...보기, 까닭: '우리' }), w = L.할일({ ...보기, 발주: '지방', 까닭: '우리' })
  ok('우리 책임 → 판정 no · 둘(지체상금 · 계약보증금만큼) · 지방은 «지연배상금»', u.판정 === 'no' && u.단계.length === 2 && /지체상금/.test(u.단계[0].제목) && /국가정책사업/.test(u.단계[1].글) && /지연배상금/.test(w.단계[0].제목) && /제26조⑥⑦/.test(u.단계[0].근거))
  ok('연장 일수 — 같은 날 · 앞 날 → 틀림 · 빈칸 → null · 12. 31. → 2. 14. = 45', L.연장일수('2026-12-31', '2026-12-31').틀림 === true && L.연장일수('2026-12-31', '2026-12-01').틀림 === true && L.연장일수('', '2027-01-01') === null && L.연장일수('2026-12-31', '2027-02-14').일 === 45)
  ok('날뒤 — 달 · 해 넘김(12. 20. + 14 = 2027. 1. 3. · 1. 31. + 30 = 3. 2.) · 틀린 날 빈칸', L.날뒤('2026-12-20', 14) === '2027-01-03' && L.날뒤('2027-01-31', 30) === '2027-03-02' && L.날뒤('2026-13', 3) === '', [L.날뒤('2026-12-20', 14), L.날뒤('2027-01-31', 30)])
  ok('연장 사유 — 국가 일곱(제25조③ 1 · 2 · 3 · 5 · 6 · 7 · 8호) · 지방 일곱(물품 뺌)', L.사유들.국가.length === 7 && L.사유들.지방.length === 7 && /혁신제품/.test(L.사유들.국가.join()) && !/납품/.test(L.사유들.지방.join()) && /그 밖에 계약상대자의 책임에 속하지 않는 사유/.test(L.사유들.지방.join()))
}
console.log('③ 글 · 빠른찾기 · 길잡이 · 링크')
{
  const 자료 = JSON.parse(fs.readFileSync(path.join(뿌리, 'web/src/data/tools.json'), 'utf8'))
  const t = 자료.tools.find((x) => x.slug === 'time-extension')
  ok('tools.json time-extension · cat work · tail 빈 글 · 설명 셋 · 제목 «공기연장 때 할 일 —»', !!t && t.cat === 'work' && t.tail === '' && t.secs.length === 3 && /^공기연장 때 할 일 — /.test(t.title), t && [t.cat, t.tail, t.secs.length, t.title])
  ok('«무료» · «클로드» 없음(tools.json 글 · lib)', !/무료|클로드/.test(JSON.stringify(t || {}) + fs.readFileSync(path.join(뿌리, 'web/src/lib/공기연장.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')))
  const 찾 = await import(pathToFileURL(path.join(뿌리, 'web/src/lib/빠른찾기.js')).href)
  const 읽 = (x) => JSON.parse(fs.readFileSync(path.join(뿌리, 'web/src/data', x), 'utf8'))
  const 목 = 찾.목록만들기({ 탭: [], tools: 읽('tools.json'), forms: 읽('forms-min.json'), change: 읽('change.json'), guide: 읽('guide.json'), cad: 읽('cad.json') })
  const 맨위 = (q) => (찾.찾기(목, q, 3)[0] || {}).to
  const 말 = ['공기연장', '공기 연장', '계약기간 연장', '준공기한 연장', '연장 청구', '보증서 연장']
  ok('빠른찾기 «공기연장» · «계약기간 연장» · «준공기한 연장» · «연장 청구» · «보증서 연장» → 이 도구', 말.every((q) => 맨위(q) === '/tools/time-extension'), 말.map(맨위))
  ok('빠른찾기 «공기연장 신청서» → 서식 · «지체상금» → 지체상금 도구 · «퇴직공제» → 집계 · «공기연장 간접비» → 산출서', 맨위('공기연장 신청서') === '/forms/gonggi-yeonjang' && 맨위('지체상금') === '/tools/delay-penalty' && 맨위('퇴직공제') === '/tools/toejik' && 맨위('공기연장 간접비') === '/forms/chg-ganjeopbi', ['공기연장 신청서', '지체상금', '퇴직공제', '공기연장 간접비'].map(맨위))
  const 길 = 읽('change.json').topics.find((x) => x.slug === 'period')
  const 길글 = JSON.stringify(길)
  ok('길잡이 «공기연장과 간접비» — 공백기간 바로잡음(2025. 12. 31. 이후 입찰공고 · 제26조⑨ · 제812호)', /2025\. 12\. 31\. 이후 입찰공고\(수의계약은 체결\)한 공사/.test(길글) && /제26조⑨/.test(길글) && /제812호/.test(길글))
  const 칸 = fs.readFileSync(path.join(뿌리, 'web/src/tools/계약칸.jsx'), 'utf8')
  ok('등록(계약CALCS · EXAMPLES) · 지체상금 도구 → 이 도구 링크 · 서식 · 길잡이 링크', /'time-extension': TimeExtension,/.test(칸) && /'time-extension': \{ 글: '국가 공사 · 책임 없는 설계변경/.test(칸) && /<Link to="\/tools\/time-extension" className="kr-link">공기연장 때 할 일 →<\/Link>/.test(칸) && /to="\/forms\/gonggi-yeonjang"/.test(칸) && /to="\/forms\/chg-ganjeopbi"/.test(칸) && /to="\/change\/period"/.test(칸))
}

if (BASE) {
  const { chromium } = require('playwright')
  const b = await chromium.launch()
  async function 새쪽(w, h, 폰, ctx0, 길 = '/tools/time-extension', 고를 = '.tool.te') {
    const ctx = ctx0 || await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, deviceScaleFactor: 2,
      userAgent: 폰 ? 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36' : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36' })
    if (!ctx0) {
      await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
      await ctx.route(/firebaseio\.com|firebasedatabase\.app/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
    }
    const p = await ctx.newPage()
    const 오류 = []
    p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
    await p.goto(BASE + 길, { waitUntil: 'domcontentloaded' })
    await p.waitForSelector(고를, { timeout: 20000 }); await p.waitForTimeout(600)
    return { ctx, p, 오류 }
  }
  const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  const 본문 = (p) => p.evaluate(() => (document.querySelector('.tool.te') || {}).innerText || '')
  const 고르기 = async (p, i, v) => { await p.locator('.tool.te select').nth(i).selectOption(v); await p.waitForTimeout(200) }
  console.log('④ 화면 — 폰 390')
  {
    const { ctx, p, 오류 } = await 새쪽(390, 844, true)
    ok('처음(날 없음) → «두 준공기한을 넣으면» · 할 일 여덟(하도급 · 퇴직공제 빼고)', /두 준공기한을 넣으면/.test(await 본문(p)) && (await p.locator('.te-steps li').count()) === 8)
    await p.locator('button', { hasText: '예시로 해 보기' }).first().click(); await p.waitForTimeout(500)
    let 글 = await 본문(p)
    ok('예시 → 신청할 수 있음(국가 낱말) · 45일 · 키스콘 2027. 1. 11.(쉬는 날이라 미룸) · 고용산재 2026. 12. 24. · 할 일 열', /계약기간 연장을 신청할 수 있습니다/.test(글) && /45일/.test(글) && /2027\. 1\. 11\. \(쉬는 날이라 미룸\)/.test(글) && /2026\. 12\. 24\./.test(글) && (await p.locator('.te-steps li').count()) === 10, 글.slice(0, 700))
    ok('청구 줄 «계약기간이 끝나기 전(준공기한 2026. 12. 31.)» · 지체상금 안 붙음 · 서식 둘 · 길잡이 · 퇴직공제 판단기 링크', /계약기간이 끝나기 전\(준공기한 2026\. 12\. 31\.\)/.test(글) && /지체상금/.test(글) && (await p.locator('.tool.te a[href="/forms/gonggi-yeonjang"]').count()) === 1 && (await p.locator('.tool.te a[href="/forms/chg-ganjeopbi"]').count()) === 1 && (await p.locator('.tool.te a[href="/change/period"]').count()) === 1 && (await p.locator('.tool.te a[href="/tools/toejik-check"]').count()) === 1 && (await p.locator('.tool.te a[href="/forms/bisan-singo"]').count()) === 1 && (await p.locator('.tool.te a[href="/forms/teukjeong-singo"]').count()) === 1)
    await p.locator('.tool.te details.te-why summary').click(); await p.waitForTimeout(150)
    ok('«연장 사유가 되는 것» 열면 일곱 줄 · 제25조③', (await p.locator('.tool.te .te-list li').count()) === 7 && /제25조③/.test(await 본문(p)))
    if (OUT) {
      await p.evaluate(() => { for (const e of document.querySelectorAll('body *')) { const s = getComputedStyle(e); if (s.position === 'fixed' || s.position === 'sticky') e.style.setProperty('display', 'none', 'important') } })
      await p.locator('.tool.te').screenshot({ path: OUT + '/공기연장_예시_폰390.png' })
    }
    await 고르기(p, 1, '우리')
    글 = await 본문(p)
    ok('우리 책임 → «계약기간 연장 사유가 아닙니다» · 할 일 둘 · 지체상금 도구 · 감면 신청서 링크', /계약기간 연장 사유가 아닙니다/.test(글) && (await p.locator('.te-steps li').count()) === 2 && (await p.locator('.tool.te a[href="/tools/delay-penalty"]').count()) === 1 && (await p.locator('.tool.te a[href="/forms/jiche-gammyeon"]').count()) === 1)
    await 고르기(p, 1, '없음'); await 고르기(p, 0, '지방')
    글 = await 본문(p)
    ok('지자체로 바꾸면 «청구할 수 있습니다» · «지연배상금» · «연장계약 체결 전까지» · «공사감독관을 거쳐» · 15일', /계약기간 연장을 청구할 수 있습니다/.test(글) && /지연배상금/.test(글) && /연장계약 체결 전까지/.test(글) && /공사감독관을 거쳐/.test(글) && /15일 안에/.test(글))
    ok('폰 390 넘침 0 · 오류 0 · «무료» «클로드» NaN undefined 없음', (await 넘침(p)) <= 0 && !오류.length && !/무료|클로드|NaN|undefined/.test(글), [await 넘침(p), 오류])
    const { p: p2, 오류: 오류2 } = await 새쪽(390, 844, true, ctx)
    ok('다시 열면 지자체 · 날 · 체크 그대로', (await p2.locator('.tool.te select').first().inputValue()) === '지방' && (await p2.locator('.tool.te input[type="date"]').first().inputValue()) === '2026-12-31' && (await p2.locator('.tool.te input[type="checkbox"]').nth(1).isChecked()) && !오류2.length)
    await ctx.close()
  }
  console.log('④ 폭 320 · 1280 · 다른 화면')
  {
    const { ctx, p, 오류 } = await 새쪽(320, 640, true)
    await p.locator('button', { hasText: '예시로 해 보기' }).first().click(); await p.waitForTimeout(400)
    ok('320 넘침 0 · 오류 0', (await 넘침(p)) <= 0 && !오류.length, [await 넘침(p), 오류])
    await ctx.close()
  }
  {
    const { ctx, p, 오류 } = await 새쪽(1280, 860, false)
    await p.locator('button', { hasText: '예시로 해 보기' }).first().click(); await p.waitForTimeout(400)
    ok('PC 1280 — 예시 45일 · 넘침 0 · 오류 0', /45일/.test(await 본문(p)) && (await 넘침(p)) <= 0 && !오류.length, 오류)
    if (OUT) await p.locator('.tool.te').screenshot({ path: OUT + '/공기연장_예시_PC1280.png' })
    await ctx.close()
  }
  {
    const { ctx, p, 오류 } = await 새쪽(390, 844, true, null, '/tools/delay-penalty', '.tool')
    ok('지체상금 도구 → «공기연장 때 할 일 →» 링크 · 오류 0', (await p.locator('.tool a[href="/tools/time-extension"]').count()) === 1 && !오류.length, 오류)
    await ctx.close()
  }
  {
    const { ctx, p, 오류 } = await 새쪽(390, 844, true, null, '/change/period', 'main')
    await p.waitForTimeout(500)
    const 글 = await p.evaluate(() => document.body.innerText)
    ok('길잡이 «공기연장과 간접비» — 공백기간 바로잡은 글 보임 · 오류 0', /2025\. 12\. 31\. 이후 입찰공고\(수의계약은 체결\)한 공사/.test(글) && !오류.length, 오류)
    await ctx.close()
  }
  await b.close()
}
console.log(`\n${bad ? '✗' : '✓'} 시험_공기연장 ${n - bad}/${n}`)
if (bad) process.exit(1)
