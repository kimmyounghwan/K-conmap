// 🤝 G368 공동도급 마당(/gongdong) 화면 시험 — 소장님 캡처(2026-10-22) 점검 · PC · 폰
//   ① 목록 딱지 «협정 N시간 남음» 이 한 번만(전엔 «공동 가능 · 협정 7시간 남음» + 빨간 «협정 7시간 남음» 두 번)
//   ② 창을 열어 둔 채 시간이 지나면 남은 시간이 줄고, 협정이 지난 공고는 목록에서 빠짐(전엔 처음 연 때에 멈춤)
//   ③ 지분 짜기 «몫» 은 억 · 만까지(전엔 51% · 49% 가 1.1억 · 1.1억) · ④ «시평액을 안 적은 구성원 N곳» 이 지분만 적은 줄도 셈
//   다른 예시 세 벌: A 공동 가능 51/49 · 2.25억 / B 지역의무(전남 30%) 세 곳 50/30/20 · 10억 / C 네 곳 40/25/20/15 · 5천만(이름 하나만)
//   공고 목록은 가짜(가상 공고) · 데이터베이스는 가짜 · 시계는 2026-10-21 10:36(한국)으로 고정해 앞으로 돌림
//   돌리기: 4998 에 화면 빌드를 얹은 뒤 node tools/시험_공동마당화면.mjs [PC|폰|모두]
import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 주소 = process.env.B || 'http://127.0.0.1:4998'
const 기기들 = (process.argv[2] || '모두') === '모두' ? ['PC', '폰'] : [process.argv[2]]
const 폴더 = process.env.CAP || '/tmp/g10/g368/ui'
fs.mkdirSync(폴더, { recursive: true })
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log(c ? '✓' : '✗', m, c ? '' : 더) }

const f = ['no', 'name', 'inst', 'base', 'budget', 'close', 'lo', 'hi', 'llr', 'est', 'lic', 'aval', 'gmtrl', 'ayn', 'ptot', 'pdrw', 'url', 'site', 'rgnb', 'joint', 'mthd', 'swin', 'rebid', 'enp', 'enpn', 'dt', 'sido', 'dsn', 'enpb', 'jnt', 'tg', 'nt', 'licg', 'rgs', 'pc']
const 줄 = (o) => f.map((k) => (o[k] === undefined ? null : o[k]))
const 공고 = [
  { no: 'R26BK90000001', name: '가상 청사 단열성능 개선 공사', inst: '가상조달청', base: 254000000, est: 230000000, close: '2026-10-22 10:00:00', dt: '2026-10-13 15:00:00', sido: '경기', joint: '(전자)공동이행', mthd: '전자입찰', jnt: ['J', [], 0, [], [], '2026-10-21 18:00:00', 0] },
  { no: 'R26BK90000002', name: '가상군 농로 포장공사', inst: '가상군', base: 1000000000, est: 900000000, close: '2026-10-24 10:00:00', dt: '2026-10-14 15:00:00', sido: '전남', joint: '(전자)공동이행', mthd: '전자입찰', jnt: ['J', ['전남'], 30, [], [], '2026-10-23 18:00:00', 0] },
  { no: 'R26BK90000003', name: '가상시 배수로 정비공사', inst: '가상시', base: 300000000, est: 270000000, close: '2026-10-22 10:00:00', dt: '2026-10-15 15:00:00', sido: '경남', joint: '(전자)공동이행', mthd: '전자입찰', jnt: ['J', [], 0, [], [], '2026-10-21 12:00:00', 0] },
  { no: 'R26BK90000004', name: '가상 체육관 보수공사', inst: '가상교육청', base: 60000000, est: 54000000, close: '2026-10-29 10:00:00', dt: '2026-10-16 15:00:00', sido: '충북', joint: '(전자)공동이행', mthd: '전자입찰', jnt: ['J', [], 0, [], [], '2026-10-28 18:00:00', 0] },
  { no: 'R26BK90000005', name: '가상 단독 공사(공동 안 됨)', inst: '가상시', base: 200000000, close: '2026-10-22 10:00:00', dt: '2026-10-15 15:00:00', sido: '서울', joint: '(없음)공동수급불허', jnt: 0 },
]
const 색인 = JSON.stringify({ f, r: 공고.map(줄) })
const 시작 = new Date('2026-10-21T10:36:00+09:00')

const 브 = await chromium.launch()
for (const 기기 of 기기들) {
  const 판 = await 브.newContext({ viewport: { width: 기기 === '폰' ? 390 : 1280, height: 900 }, locale: 'ko-KR', timezoneId: 'Asia/Seoul' })
  await 판.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  await 판.route(/firebaseio\.com/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await 판.route(/\/data\/bidindex\.json/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 색인 }))
  await 판.route(/\/data\/overview\.json/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await 판.addInitScript(() => { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); try { sessionStorage.setItem('kcm_notice_seen', '2026-10-업체') } catch (e) {} })
  const A = await 판.newPage()
  await A.clock.install({ time: 시작 })
  const 오류 = []
  A.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  await A.goto(주소 + '/gongdong', { waitUntil: 'domcontentloaded' })
  await A.waitForSelector('.gd-item', { timeout: 20000 })
  const 목록 = async () => A.$$eval('.gd-item', (bs) => bs.map((b) => ({ t: b.querySelector('.t').innerText, e: b.querySelector('.e').innerText })))
  let L = await 목록()
  const 협 = (x) => (x.e.match(/협정/g) || []).length
  봐(L.length === 4 && !L.some((x) => /단독 공사/.test(x.t)), `${기기} 목록 — 공동 되는 가상 공고 4곳(공동 안 되는 공고는 빠짐)`, L.map((x) => x.t).join(' / '))
  봐(L.every((x) => 협(x) === 1), `${기기} ① 딱지마다 «협정 …» 한 번만(전엔 두 번)`, L.map((x) => x.e.replace(/\n/g, ' ')).join(' / '))
  const 찾 = (s) => L.find((x) => x.t.includes(s)) || { e: '' }
  봐(/협정 7시간 남음/.test(찾('청사').e) && /협정 1시간 남음/.test(찾('배수로').e) && /협정 D-2/.test(찾('농로').e), `${기기} 남은 때 10:36 — 청사 7시간 · 배수로 1시간 · 농로 D-2`, L.map((x) => x.e.replace(/\n/g, ' ')).join(' / '))
  if (기기 === 'PC') await A.locator('.gd-items').screenshot({ path: path.join(폴더, 'G368_PC_목록_1036.png') })
  // ② 창을 열어 둔 채 2시간
  await A.clock.fastForward('02:00:00')
  await A.waitForTimeout(400)
  L = await 목록()
  봐(/협정 5시간 남음/.test(찾('청사').e) && !L.some((x) => /배수로/.test(x.t)), `${기기} ② 열어 둔 채 2시간 → 청사 5시간 · 협정 지난 배수로는 빠짐(전엔 7시간 · 1시간 그대로)`, L.map((x) => x.t + ' ' + x.e.replace(/\n/g, ' ')).join(' / '))
  // A — 공동 가능 51/49 · 2.25억
  await A.locator('.gd-item', { hasText: '청사' }).click()
  await A.locator('button', { hasText: '지분 짜기 열기' }).click()
  const 짜기 = A.locator('.gd-split')
  const 몫들 = async () => 짜기.locator('.gd-mok').allInnerTexts()
  const 시평글 = async () => (await 짜기.locator('.gd-kv > div').nth(1).innerText()).replace(/\n/g, ' ')
  봐(/시평액을 안 적은 구성원 2곳/.test(await 시평글()), `${기기} A ④ 둘 다 시평액 비면 «안 적은 구성원 2곳»(전엔 1곳)`, await 시평글())
  await 짜기.locator('.gd-kv input').fill('2.254510')
  봐(JSON.stringify(await 몫들()) === JSON.stringify(['1억 1,498만', '1억 1,047만']), `${기기} A ③ 몫 51% · 49% = 1억 1,498만 · 1억 1,047만(전엔 1.1억 · 1.1억)`, JSON.stringify(await 몫들()))
  await 짜기.locator('[aria-label="1번째 시평액"]').fill('35.5')
  봐(/35\.5억/.test(await 시평글()) && /안 적은 구성원 1곳/.test(await 시평글()), `${기기} A 시평액 하나 적으면 35.5억 · 1곳`, await 시평글())
  봐(/협정 기준에 맞습니다/.test(await 짜기.innerText()), `${기기} A 51/49 → 협정 기준에 맞음`)
  if (기기 === 'PC') await 짜기.screenshot({ path: path.join(폴더, 'G368_PC_A_지분짜기.png') })
  if (기기 === '폰') {
    await 짜기.screenshot({ path: path.join(폴더, 'G368_폰_A_지분짜기.png') })
    봐((await A.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1, `${기기} A 지분 짜기 펼친 채 가로 넘침 없음`)
    const 칸폭 = await 짜기.locator('[aria-label="1번째 시평액"]').evaluate((e) => e.getBoundingClientRect().width)
    const 이름들 = await 짜기.locator('.gd-tr:not(.gd-th)').first().locator('.gd-fl').allInnerTexts()
    봐(칸폭 >= 60 && 이름들.join() === '지분 %,시평액(억)', `${기기} A 📱 시평액 칸 폭 ${Math.round(칸폭)}px(전엔 22px 에 눌려 35.5 → 5) · 칸 이름 «지분 % · 시평액(억)»`, `${칸폭} ${이름들}`)
  } else {
    const 숨 = await 짜기.locator('.gd-fl').first().isVisible()
    봐(!숨, `${기기} A PC 는 머리줄 그대로(칸마다 작은 이름 안 보임)`)
  }
  // B — 지역의무 전남 30% · 세 곳 50/30/20 · 10억
  await A.goto(주소 + '/gongdong?no=R26BK90000002', { waitUntil: 'domcontentloaded' })
  await A.locator('button', { hasText: '지분 짜기 열기' }).click()
  const 지분칸 = (i) => 짜기.locator(`[aria-label="${i}번째 지분"]`)
  봐(await 지분칸(1).inputValue() === '70' && await 지분칸(2).inputValue() === '30' && await 짜기.locator('[aria-label="2번째 지역"]').inputValue() === '전남', `${기기} B 처음 값 — 지역의무 전남 30%(구성원 전남 30 · 우리 70)`)
  await 짜기.locator('button', { hasText: '구성원 더하기' }).click()
  await 짜기.locator('[aria-label="1번째 회사"]').fill('가상건설(주)')
  await 짜기.locator('[aria-label="2번째 회사"]').fill('가상토건')
  await 짜기.locator('[aria-label="3번째 회사"]').fill('가상산업')
  await 지분칸(1).fill('50'); await 지분칸(3).fill('20')
  await 짜기.locator('[aria-label="3번째 지역"]').selectOption('전남')
  await 짜기.locator('.gd-kv input').fill('10')
  await 짜기.locator('[aria-label="1번째 시평액"]').fill('120'); await 짜기.locator('[aria-label="2번째 시평액"]').fill('45.2')
  봐(JSON.stringify(await 몫들()) === JSON.stringify(['5억', '3억', '2억']), `${기기} B 몫 10억 × 50/30/20 = 5억 · 3억 · 2억`, JSON.stringify(await 몫들()))
  봐(/165\.2억/.test(await 시평글()) && /안 적은 구성원 1곳/.test(await 시평글()), `${기기} B 시평 120 + 45.2 = 165.2억 · 안 적은 1곳`, await 시평글())
  봐(/협정 기준에 맞습니다/.test(await 짜기.innerText()) && /전남 업체 50%/.test(await 짜기.innerText()), `${기기} B 전남 업체 합 50% ≥ 30% → 맞음`, (await 짜기.innerText()).slice(0, 300))
  // C — 네 곳 40/25/20/15 · 5천만 · 이름은 첫 줄만
  await A.goto(주소 + '/gongdong?no=R26BK90000004', { waitUntil: 'domcontentloaded' })
  await A.locator('button', { hasText: '지분 짜기 열기' }).click()
  await 짜기.locator('button', { hasText: '구성원 더하기' }).click()
  await 짜기.locator('button', { hasText: '구성원 더하기' }).click()
  for (const [i, v] of [[1, '40'], [2, '25'], [3, '20'], [4, '15']]) await 지분칸(i).fill(v)
  await 짜기.locator('.gd-kv input').fill('0.5')
  봐(JSON.stringify(await 몫들()) === JSON.stringify(['2,000만', '1,250만', '1,000만', '750만']), `${기기} C 몫 5천만 × 40/25/20/15 = 2,000만 · 1,250만 · 1,000만 · 750만`, JSON.stringify(await 몫들()))
  봐(/안 적은 구성원 4곳/.test(await 시평글()), `${기기} C 이름 없이 지분만 적은 줄도 셈 → 4곳`, await 시평글())
  봐(/협정 기준에 맞습니다/.test(await 짜기.innerText()), `${기기} C 네 곳 · 모두 10% 이상 → 맞음`)
  await 지분칸(4).fill('5'); await 지분칸(1).fill('50')
  봐(/지분 5% — 구성원마다 10% 이상/.test(await 짜기.innerText()), `${기기} C 한 곳 5% → «10% 이상이어야» 알림`, (await 짜기.innerText()).slice(0, 400))
  if (기기 === '폰') 봐((await A.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1, `${기기} C 네 곳 펼친 채 가로 넘침 없음`)
  봐(!오류.length, `${기기} 화면 오류 0`, 오류.join(' | '))
  await 판.close()
}
await 브.close()
console.log(`\n${ok} 통과 · ${bad} 실패`)
process.exit(bad ? 1 : 0)
