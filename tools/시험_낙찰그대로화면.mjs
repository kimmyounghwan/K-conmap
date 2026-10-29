// 🧪 G453 (2026-10-29) /naeyeok/ratio 🏷 낙찰금액 — «설계금액 그대로 둘 항목» 체크 칸 화면 시험 · PC · 폰
//   맵톡 「내역서를 낙찰가로 맞출때 A값의 적용을 선택할 수는 없는지요? 현장마다 퇴직공제, 환경보전비 등이 안들어 가는 경우도」
//   화면 빌드를 얹은 뒤  B=http://127.0.0.1:포트 node tools/시험_낙찰그대로화면.mjs [PC|폰|모두]
//   가상 tools/시험자료/원내역_예시.xlsx · REAL='파일1|파일2' 면 실제 설계내역서도(캡처 안 남김 · 이름 안 찍음)
import { createRequire } from 'module'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { readWorkbook } from '../web/src/lib/qtoxlsx.js'
import { 원가표찾기 } from '../web/src/lib/낙찰맞추기.js'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 주소 = process.env.B || 'http://127.0.0.1:4998'
const 기기들 = (process.argv[2] || '모두') === '모두' ? ['PC', '폰'] : [process.argv[2]]
const 캡 = process.env.CAP || ''
if (캡) fs.mkdirSync(캡, { recursive: true })
const 예시 = fileURLToPath(new URL('./시험자료/원내역_예시.xlsx', import.meta.url))
const 실제 = (process.env.REAL || '').split('|').filter(Boolean)
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log(c ? '✓' : '✗', m, c ? '' : String(더).slice(0, 400)) }
const 원 = (n) => Math.round(n).toLocaleString('ko-KR')
const 브 = await chromium.launch()
for (const 기기 of 기기들) {
  const 판 = await 브.newContext({ viewport: { width: 기기 === '폰' ? 390 : 1280, height: 900 }, locale: 'ko-KR', acceptDownloads: true, isMobile: 기기 === '폰', hasTouch: 기기 === '폰' })
  await 판.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  await 판.route(/firebaseio\.com/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await 판.addInitScript(() => { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); try { sessionStorage.setItem('kcm_notice_seen', '2026-10-업체') } catch (e) {} })
  const p = await 판.newPage()
  const 오류 = []; p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  const 올리기 = async (파일) => {
    await p.goto(주소 + '/naeyeok/ratio', { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('input[type=file]', { state: 'attached', timeout: 20000 })
    await p.locator('input[type=file]').first().setInputFiles({ name: '내역서.xlsx', mimeType: 'application/octet-stream', buffer: fs.readFileSync(파일) })
    await p.locator('.card', { hasText: '③ 내려받기' }).waitFor({ timeout: 60000 })
    await p.evaluate(() => { const r = [...document.querySelectorAll('label')].find((l) => /🏷 낙찰금액으로/.test(l.textContent)); r.querySelector('input').click() })
    await p.waitForTimeout(800)
  }
  const 칸들 = () => p.evaluate(() => [...document.querySelectorAll('.ratio-keep-item')].map((l) => ({ 이름: l.querySelector('span').childNodes[0].textContent.trim(), A: !!l.querySelector('.ratio-keep-a'), 켬: l.querySelector('input').checked })))
  const 누르기 = (이름) => p.evaluate((n) => { const l = [...document.querySelectorAll('.ratio-keep-item')].find((x) => x.querySelector('span').childNodes[0].textContent.trim() === n); l.querySelector('input').click() }, 이름)
  const 낙찰넣기 = async (v) => { const i = p.locator('input[placeholder="예) 25,123,456"]'); await i.fill(String(v)); await p.waitForTimeout(400) }
  const 만들기 = async () => {
    await p.evaluate(() => [...document.querySelectorAll('button')].find((b) => /올린 엑셀 그대로/.test(b.textContent)).click())
    for (let i = 0; i < 120; i++) { await p.waitForTimeout(1000); if (await p.evaluate(() => !!document.querySelector('a.btn.primary[download]'))) break }
    await p.evaluate(() => document.querySelectorAll('details').forEach((d) => (d.open = true)))
    return p.evaluate(() => ({ 말: [...document.querySelectorAll('.flist li')].map((x) => x.innerText), 원가: [...document.querySelectorAll('.rt-kg tbody tr')].map((r) => [...r.querySelectorAll('td')].map((td) => td.innerText)) }))
  }
  const 받기 = async () => { await p.waitForTimeout(1000); const x = p.locator('.askx'); if (await x.count()) await x.first().click().catch(() => {}); const [d] = await Promise.all([p.waitForEvent('download'), p.click('a.btn.primary[download]')]); const f = '/tmp/g10/g453/받음_' + 기기 + '.xlsx'; await d.saveAs(f); const b = fs.readFileSync(f); return 원가표찾기(readWorkbook(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)), []) }
  /* ① 가상 */
  await 올리기(예시)
  let k = await 칸들()
  봐(k.length === 9, `${기기} 체크 칸 9개(원가계산서 경비 항목)`, JSON.stringify(k))
  봐(k.filter((x) => x.켬).map((x) => x.이름).join('|') === '건강보험료|연금보험료|노인장기요양보험료|퇴직공제부금비|산업안전보건관리비', `${기기} 처음엔 A값 다섯만 켬`, JSON.stringify(k.filter((x) => x.켬)))
  봐(k.every((x) => x.A === x.켬), `${기기} A값 표시 = 켠 칸`)
  await 낙찰넣기(116500000)
  await 누르기('퇴직공제부금비'); await 누르기('환경보전비')
  k = await 칸들()
  봐(!k.find((x) => x.이름 === '퇴직공제부금비').켬 && k.find((x) => x.이름 === '환경보전비').켬, `${기기} 퇴직공제 끔 · 환경보전비 켬`)
  if (캡) await p.locator('.note', { has: p.locator('.ratio-keep') }).screenshot({ path: `${캡}/${기기}_1_고름.png` }).catch((e) => console.log('    캡처 못 함', String(e).slice(0, 120)))
  let 결 = await 만들기()
  const 도 = 결.말.find((t) => /^도급액/.test(t)) || ''
  봐(/116,500,000원 — 낙찰금액과 딱 맞습니다/.test(도), `${기기} 도급액 = 낙찰금액 116,500,000`, 도)
  const 그 = 결.말.find((t) => /^설계금액 그대로/.test(t)) || ''
  봐(/건강보험료 · 연금보험료 · 노인장기요양보험료 · 산업안전보건관리비 · 환경보전비/.test(그) && !/퇴직/.test(그), `${기기} 알림 «설계금액 그대로 · …환경보전비»(퇴직공제 없음)`, 그)
  const 줄 = (n) => 결.원가.find((r) => r[0].replace(/\s/g, '').endsWith(n)) || []
  봐(줄('환경보전비')[2] === '699,163' && /고른 항목/.test(줄('환경보전비')[3]), `${기기} 원가 표 — 환경보전비 699,163 그대로(고른 항목)`, JSON.stringify(줄('환경보전비')))
  봐(줄('퇴직공제부금비')[2] && +줄('퇴직공제부금비')[2].replace(/,/g, '') < 918393, `${기기} 원가 표 — 퇴직공제부금비 비율대로(${줄('퇴직공제부금비')[2]})`, JSON.stringify(줄('퇴직공제부금비')))
  const 표 = await 받기()
  const 값 = (n) => (표.rows.find((x) => x.꼴 === n) || {}).금액
  봐(값('환경보전비') === 699163 && 값('퇴직공제부금비') < 918393 && 값('건강보험료') === 1415523 && 값('도급액') === 116500000, `${기기} 받은 엑셀 — 환경 699,163 · 건강 1,415,523 · 퇴직 ${원(값('퇴직공제부금비'))} · 도급액 116,500,000`, JSON.stringify([값('환경보전비'), 값('퇴직공제부금비'), 값('건강보험료'), 값('도급액')]))
  await p.evaluate(() => [...document.querySelectorAll('.ratio-keep-btns button')].find((b) => b.textContent === '모두 끄기').click()); await p.waitForTimeout(300)
  k = await 칸들(); 봐(k.every((x) => !x.켬) && !(await p.$('a.btn.primary[download]')), `${기기} «모두 끄기» — 다 꺼짐 · 전에 만든 파일 내림`)
  await p.evaluate(() => [...document.querySelectorAll('.ratio-keep-btns button')].find((b) => b.textContent === 'A값만').click()); await p.waitForTimeout(300)
  k = await 칸들(); 봐(k.filter((x) => x.켬).length === 5 && k.every((x) => x.A === x.켬), `${기기} «A값만» — A값 다섯 다시 켬`)
  결 = await 만들기()
  봐(/딱 맞습니다/.test(결.말.find((t) => /^도급액/.test(t)) || '') && 결.원가.find((r) => /퇴직공제부금비/.test(r[0]))[2] === '918,393', `${기기} A값만으로 다시 — 퇴직공제 918,393 그대로 · 딱 맞음`)
  /* 비율 모드에선 체크 칸 안 보임 */
  await p.evaluate(() => { const r = [...document.querySelectorAll('label')].find((l) => /비율\(%\)로/.test(l.textContent)); r.querySelector('input').click() }); await p.waitForTimeout(500)
  봐(!(await p.$('.ratio-keep')), `${기기} 비율(%) 모드 — 체크 칸 없음`)
  const 넘침 = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  봐(넘침 <= 1, `${기기} 가로 넘침 없음`, 넘침)
  /* ② 실제 설계내역서 */
  for (const [i, f] of 실제.entries()) {
    await 올리기(f)
    const b = fs.readFileSync(f); const 원가 = 원가표찾기(readWorkbook(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)), [])
    const 도급 = 원가 && 원가.rows.find((x) => x.역 === '도급' && x.금액 > 0)
    k = await 칸들()
    봐(k.length >= 5 && k.filter((x) => x.켬).length >= 3 && k.every((x) => x.A === x.켬), `${기기} 실제${i + 1} — 체크 칸 ${k.length}개 · A값 ${k.filter((x) => x.켬).length}개 켬`, JSON.stringify(k))
    const 낙 = Math.floor(도급.금액 * 0.87)
    await 낙찰넣기(낙)
    const 끌 = k.find((x) => /퇴직/.test(x.이름) && x.켬) || k.find((x) => x.켬)
    const 켤 = k.find((x) => /환경보전비/.test(x.이름) && !x.켬) || k.find((x) => !x.켬)
    await 누르기(끌.이름); if (켤) await 누르기(켤.이름)
    결 = await 만들기()
    봐(new RegExp(원(낙) + '원 — 낙찰금액과 딱 맞습니다').test(결.말.find((t) => /^도급액/.test(t)) || ''), `${기기} 실제${i + 1} — 도급액 = 낙찰금액(설계의 87%)`, 결.말.slice(0, 3).join(' / '))
    const 켠줄 = 켤 && 결.원가.find((r) => r[0].replace(/\s/g, '').endsWith(켤.이름.replace(/\s/g, '')))
    봐(!켤 || (켠줄 && 켠줄[1] === 켠줄[2]), `${기기} 실제${i + 1} — 켠 «${켤 ? 켤.이름 : '-'}» 당초 = 새 값`, JSON.stringify(켠줄))
    const 끈줄 = 결.원가.find((r) => r[0].replace(/\s/g, '').endsWith(끌.이름.replace(/\s/g, '')))
    봐(끈줄 && 끈줄[1] !== 끈줄[2], `${기기} 실제${i + 1} — 끈 «${끌.이름}» 비율대로 바뀜`, JSON.stringify(끈줄))
  }
  봐(!오류.length, `${기기} 화면 오류 없음`, 오류.join(' | '))
  await 판.close()
}
await 브.close()
console.log(`\n${ok} 맞음 · ${bad} 틀림`)
process.exit(bad ? 1 : 0)
