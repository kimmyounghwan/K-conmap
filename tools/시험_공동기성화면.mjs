// 🤝 G535 공동도급 기성 · 준공금 나누기 화면 시험 — 이용자처럼(PC 1280 · 폰 390 터치)
//   돌리기: 빌드 + /tmp/g10/g534/bake_tool.py <dist> joint-split · forms3.py(gy-gongdong · gisung-cheonggu) 를 얹은 뒤
//           node tools/시험_공동기성화면.mjs [주소=http://127.0.0.1:4996]
//   ① 예시(10억 · 60 : 40 · 3억 · 선금 20%) ② 손으로 세 벌 — 세 회사 33.4 · 33.3 · 33.3 끝전 · 2회 누계 정산 · 준공(지분 맞춤 · 남은 선금 다)
//   ③ 구성원별 직접(합 다르면 알림) · 지분 합 90% 알림 · 구성원 더하기 · 빼기 ④ 새로고침해도 남음 ⑤ 다음에 갈 곳 넷 · 되돌아오는 길(서식 둘 · 공동도급 마당 · 서식 탭)
//   ⑥ 구운 장(제목 · 근거 · «무료» · «클로드» 없음) ⑦ 맨 위 찾기 ⑧ 가로 넘침 없음 · 화면 오류 0
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
const 여기 = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(process.env.PW || '/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const B = process.argv[2] || 'http://127.0.0.1:4996'
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else { bad++; console.log('✗', m, 더) } }

/* ⑦ 맨 위 찾기 */
{
  const L = await import(pathToFileURL(path.join(여기, '..', 'web', 'src', 'lib', '빠른찾기.js')).href)
  const 읽 = (f) => JSON.parse(fs.readFileSync(path.join(여기, '..', 'web', 'src', 'data', f), 'utf8'))
  const 목 = L.목록만들기({ 탭: [{ to: '/tools', ic: '🧰', label: '도구' }], tools: 읽('tools.json'), forms: 읽('forms-min.json'), change: 읽('change.json'), guide: 읽('guide.json'), cad: 읽('cad.json') })
  for (const q of ['공동도급 기성', '지분율 나누기', '공동수급체 선금정산', '출자비율 기성']) {
    const 위 = L.찾기(목, q, 3).map((x) => x.to)
    봐(위.includes('/tools/joint-split'), `찾기 «${q}» → 위 셋 안에 이 도구`, 위.join(' '))
  }
}

const 브 = await chromium.launch()
for (const 기기 of ['PC', '폰']) {
  const 판 = await 브.newContext({ viewport: 기기 === '폰' ? { width: 390, height: 844 } : { width: 1280, height: 900 }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', ...(기기 === '폰' ? { isMobile: true, hasTouch: true } : {}) })
  await 판.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs|firebaseio|firebasedatabase/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await 판.addInitScript(() => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) { /* 없음 */ } })
  const A = await 판.newPage()
  const 오류 = []
  A.on('pageerror', (e) => 오류.push(String(e).slice(0, 160)))
  const 누름 = async (loc) => { if (기기 === '폰') await loc.tap(); else await loc.click() }
  const 열기 = async () => { await A.goto(B + '/tools/joint-split', { waitUntil: 'domcontentloaded' }); await A.waitForSelector('.jvs', { timeout: 25000 }); await A.waitForTimeout(300) }
  const 표 = () => A.evaluate(() => [...document.querySelectorAll('.jvs-out tbody tr')].map((tr) => [...tr.children].map((td) => td.innerText.replace(/\s+/g, ' ').trim()).join(' | ')))
  const 금액칸 = (n) => A.locator('.jvs .tl-grid input').nth(n)
  const 칸 = (m, 이름) => A.locator('.jvs-m').nth(m).locator('label', { hasText: 이름 }).locator('input')
  const 넣기 = async (loc, v) => { await loc.fill(v); await A.waitForTimeout(80) }

  await A.goto(B + '/', { waitUntil: 'domcontentloaded' })
  await A.evaluate(() => { try { for (const k of Object.keys(localStorage)) if (/joint-split/.test(k)) localStorage.removeItem(k) } catch (e) { /* 없음 */ } })
  await 열기()
  봐(await A.locator('h1', { hasText: '공동도급 기성 · 준공금 나누기' }).count() > 0, `${기기} 제목`)
  봐((await A.locator('.jvs .kt-hint', { hasText: '구성원 지분율을 넣으세요' }).count()) + (await A.locator('.jvs .kt-hint', { hasText: '계약금액' }).count()) > 0, `${기기} 빈칸이면 넣을 것 안내`)
  /* ① 예시 */
  await 누름(A.locator('button', { hasText: '예시로 해 보기' }).first())
  await A.waitForTimeout(300)
  const t1 = await 표()
  봐(t1[0] === '👑 대표사 60% | 180,000,000원 | 36,000,000원 | 144,000,000원 | 180,000,000원 (30.0%) | 420,000,000원 | 600,000,000원', `${기기} 예시 대표사 줄`, t1[0])
  봐(t1[1] === '구성원 1 40% | 120,000,000원 | 24,000,000원 | 96,000,000원 | 120,000,000원 (30.0%) | 280,000,000원 | 400,000,000원', `${기기} 예시 구성원 줄`, t1[1])
  봐(t1[2] === '합 100% | 300,000,000원 | 60,000,000원 | 240,000,000원 | 300,000,000원 | 700,000,000원 | 1,000,000,000원', `${기기} 예시 합`, t1[2])
  봐((await A.locator('.jvs .claudesay.good', { hasText: '구성원별로 나눠 적은 신청서' }).count()) === 1, `${기기} 예시 · 알림 없으면 «구성원 각자에게» 안내`)
  const 받을 = await A.evaluate(() => [...document.querySelectorAll('.jvs-pay .jvs-p')].map((x) => x.innerText.replace(/\s+/g, ' ').trim()))
  봐(받을.join(' / ') === '👑 대표사 60% 144,000,000원 이번 회 180,000,000원 − 선금 정산 36,000,000원 / 구성원 1 40% 96,000,000원 이번 회 120,000,000원 − 선금 정산 24,000,000원', `${기기} 구성원마다 «이번에 받을 돈» 칸`, 받을.join(' / '))
  const 보임 = await A.evaluate(() => { const b = document.querySelector('.jvs-pay .jvs-p b'); const r = b.getBoundingClientRect(); return r.right <= innerWidth && r.left >= 0 })
  봐(보임, `${기기} «이번에 받을 돈» 이 화면 안(옆으로 밀지 않아도)`)
  await 누름(A.locator('button', { hasText: '지우기' }).first())
  await A.waitForTimeout(300)
  /* ② 세 회사 · 끝전 — 100,000,001 × 33.4 · 33.3 · 33.3 → 끝전 1원은 고른 «구성원 2» */
  await 넣기(금액칸(0), '3,000,000,000'); await 넣기(금액칸(1), '100,000,001')
  await 누름(A.locator('.jvs-add'))
  await A.waitForTimeout(150)
  봐((await A.locator('.jvs-m').count()) === 3, `${기기} 구성원 더하기 → 셋`)
  await 넣기(칸(0, '이름'), '가건설'); await 넣기(칸(1, '이름'), '나건설'); await 넣기(칸(2, '이름'), '다건설')
  await 넣기(칸(0, '지분'), '33.4'); await 넣기(칸(1, '지분'), '33.3'); await 넣기(칸(2, '지분'), '33.3')
  await A.locator('.jvs .tl-grid select').nth(1).selectOption('2')
  await A.waitForTimeout(150)
  const t2 = await 표()
  봐(t2[0].startsWith('👑 가건설 33.4% | 33,400,000원') && t2[1].startsWith('나건설 33.3% | 33,300,000원') && t2[2].startsWith('다건설 33.3% | 33,300,001원'), `${기기} 세 회사 · 끝전 1원은 다건설`, t2.slice(0, 3).join(' / '))
  봐(t2[3].startsWith('합 100% | 100,000,001원'), `${기기} 세 회사 합 = 금회`, t2[3])
  /* 지분 합 90% → 알림 */
  await 넣기(칸(2, '지분'), '23.3')
  봐((await A.locator('.jvs .claudesay.bad', { hasText: '90%' }).count()) === 1, `${기기} 지분 합 90% → 알림`)
  await 넣기(칸(2, '지분'), '33.3')
  /* 빼기 */
  await 누름(A.locator('.jvs-m').nth(2).locator('button', { hasText: '빼기' }))
  await A.waitForTimeout(150)
  봐((await A.locator('.jvs-m').count()) === 2, `${기기} 빼기 → 둘`)
  /* 2회 — 60 : 40 · 계약 10억 · 금회 2억 · 전회 1.8억 · 1.2억 · 선금 1.2억 · 0.8억 · 전회 정산 3,600만 · 2,400만 */
  await 넣기(금액칸(0), '1,000,000,000'); await 넣기(금액칸(1), '200,000,000')
  await 넣기(칸(0, '지분'), '60'); await 넣기(칸(1, '지분'), '40')
  await 넣기(칸(0, '받은 선금'), '120,000,000'); await 넣기(칸(1, '받은 선금'), '80,000,000')
  await 넣기(칸(0, '지난번까지 받은 기성'), '180,000,000'); await 넣기(칸(1, '지난번까지 받은 기성'), '120,000,000')
  await 넣기(칸(0, '지난번까지 선금 정산'), '36,000,000'); await 넣기(칸(1, '지난번까지 선금 정산'), '24,000,000')
  await A.locator('.jvs .tl-grid select').nth(1).selectOption('0')
  await A.waitForTimeout(150)
  const t3 = await 표()
  봐(t3[0] === '👑 가건설 60% | 120,000,000원 | 24,000,000원 | 96,000,000원 | 300,000,000원 (50.0%) | 300,000,000원 | 600,000,000원', `${기기} 2회 · 누계 정산(6천만 − 3천6백만)`, t3[0])
  /* 구성원별 직접 — 합이 금회와 다르면 알림 */
  await A.locator('.jvs .tl-grid select').nth(0).selectOption('직접')
  await A.waitForTimeout(120)
  await 넣기(칸(0, '이번 회 금액'), '150,000,000'); await 넣기(칸(1, '이번 회 금액'), '40,000,000')
  봐((await A.locator('.jvs .claudesay.bad', { hasText: '다릅니다' }).count()) === 1, `${기기} 직접 합 1.9억 ≠ 2억 → 알림`)
  await 넣기(칸(1, '이번 회 금액'), '50,000,000')
  봐((await A.locator('.jvs .claudesay.bad').count()) === 0, `${기기} 직접 합 2억 → 알림 없음`)
  /* 준공 — 몫 − 전회 · 남은 선금 다 */
  await 누름(A.locator('.jvs .kt-chk input[type="checkbox"]'))
  await A.waitForTimeout(150)
  const t4 = await 표()
  봐(t4[0] === '👑 가건설 60% | 420,000,000원 | 84,000,000원 | 336,000,000원 | 600,000,000원 (100.0%) | 0원 | 600,000,000원' && t4[1].startsWith('나건설 40% | 280,000,000원 | 56,000,000원 | 224,000,000원 | 400,000,000원 (100.0%) | 0원'), `${기기} 준공 · 지분 맞춤 · 남은 선금 다`, t4.slice(0, 2).join(' / '))
  봐(await A.locator('.jvs .tl-grid select').nth(0).isDisabled(), `${기기} 준공이면 «나누는 법» 잠김`)
  /* ④ 새로고침 */
  await A.waitForTimeout(700)
  await 열기()
  const t5 = await 표()
  봐(JSON.stringify(t5) === JSON.stringify(t4) && (await 칸(0, '이름').inputValue()) === '가건설', `${기기} 새로고침해도 그대로(이 기기)`, t5[0])
  /* ⑤ 다음에 갈 곳 · 되돌아오는 길 */
  const 단추 = await A.evaluate(() => [...document.querySelectorAll('.jvs .btn-row a')].map((a) => a.getAttribute('href')))
  봐(['/forms/gisung-cheonggu', '/tools/payment-deadline', '/forms/gy-gongdong', '/gongdong'].every((h) => 단추.includes(h)), `${기기} 다음에 갈 곳 넷`, 단추.join(' '))
  await 누름(A.locator('.jvs .btn-row a[href="/forms/gy-gongdong"]'))
  await A.waitForURL(/\/forms\/gy-gongdong/, { timeout: 15000 }).catch(() => {})
  await A.waitForSelector('.flist', { timeout: 20000 }).catch(() => {})
  봐((await A.locator('.flist a.flink[href="/tools/joint-split"]').count()) === 1, `${기기} 공동수급협정서 «놓치기 쉬운 것» → 이 도구`)
  await A.goto(B + '/forms/gisung-cheonggu', { waitUntil: 'domcontentloaded' })
  await A.waitForSelector('.flist', { timeout: 20000 }).catch(() => {})
  봐((await A.locator('.flist a.flink[href="/tools/joint-split"]').count()) === 1, `${기기} 기성금 청구서 → 이 도구`)
  await A.goto(B + '/gongdong', { waitUntil: 'domcontentloaded' })
  await A.waitForSelector('a[href="/tools/joint-split"]', { timeout: 20000 }).catch(() => {})
  봐((await A.locator('a[href="/tools/joint-split"]').count()) >= 1, `${기기} 공동도급 마당 → 이 도구`)
  await A.goto(B + '/forms', { waitUntil: 'domcontentloaded' })
  await A.waitForTimeout(1500)
  봐((await A.evaluate(() => document.querySelectorAll('a[href="/tools/joint-split"]').length)) >= 1, `${기기} 서식 탭에 카드(① 계약 · ⑧ 기성)`)
  /* ⑧ 넘침 · 오류 */
  await 열기()
  봐(!(await A.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)), `${기기} 가로 넘침 없음(표는 틀 안에서 밀림)`)
  봐(!오류.length, `${기기} 화면 오류 0`, 오류.slice(0, 2).join(' | '))
  await A.evaluate(() => { try { for (const k of Object.keys(localStorage)) if (/joint-split/.test(k)) localStorage.removeItem(k) } catch (e) { /* 없음 */ } })
  await 판.close()
}
await 브.close()

/* ⑥ 구운 장 */
{
  const r = await fetch(`${B}/tools/joint-split.html`).then((x) => x.text()).catch(() => '')
  봐(/<title>공동도급 기성 · 준공금 나누기 — 구성원별 신청 금액 · 선금 정산 \| K-건설맵<\/title>/.test(r), '구운 장 제목(«무료» 꼬리 없음)')
  봐(r.includes('공동계약운용요령 제11조') && r.includes('제2조의2') && r.includes('집행기준 제37조'), '구운 장 근거')
  봐(!/무료|클로드/.test(r), '구운 장 «무료» · «클로드» 없음')
  const t = JSON.parse(fs.readFileSync(path.join(여기, '..', 'web', 'src', 'data', 'tools.json'), 'utf8')).tools.find((x) => x.slug === 'joint-split')
  봐(t && t.tail === '' && t.badge && !/무료/.test(JSON.stringify(t)), '도구 자료에 «무료» 없음 · 꼬리 · 미리보기 그림 글(badge)')
}
console.log(`\n${bad ? '✗' : '✓'} 시험_공동기성화면 ${ok}/${ok + bad}`)
process.exit(bad ? 1 : 0)
