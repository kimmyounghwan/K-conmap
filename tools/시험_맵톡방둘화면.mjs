/**
 * ✂️ G547 맵톡 «방 둘» 화면 시험 — 🙋 전문가 방 · 🪪 명패 · 🏅 분야를 뺀 뒤 (2026-11-05)
 *   소장님 「전문가 빼자. 어때???」 → 「명패도 빼자」 (실측 11-05: 글 295 중 전문가 방 14 · 답 기다림 5)
 *   준비: 가짜 파이어베이스로 구운 판(web/vite.config.mock.js → dist 에 app.html 이 없으면 index.html 을 복사) 을 정적 서버로 띄움
 *   node tools/시험_맵톡방둘화면.mjs [주소=http://127.0.0.1:4975]  (PLAYWRIGHT: /tmp/g10/pw) · CAPTURE=폴더 면 화면 사진
 *   ① 방 줄 = 전체 · 💬 자유 · 📍 지역방(+ 내 글) — 🙋 전문가 방 없음 · 옛 기억(전문가 방 'x')은 전체로
 *   ② 옛 글의 분야(x) · 옛 명패 자료(qna_pro)가 있어도 화면에 «🙋 분야» · «✅ 명패» · «🪪 명패 신청» 이 안 보임
 *   ③ «🙋 답을 기다리는 질문» = 모든 방의 물음 글 중 답 없는 것(옛 전문가 글 · 자유 글 · 지역 글 모두) · 답 있는 글 · 물음 아닌 글은 없음
 *   ④ 글쓰기 — «🙋 전문가에게 묻기» 칩 없음 · 물음 글을 써도 «전문가 방에도» 줄 없음 · 📅 모임 글 칩은 그대로
 *   ⑤ 글 열기 — 분야 딱지 · 명패 없음 · 답글 칸 그대로 ⑥ PC 1440 · 폰 390 · 320 넘침 0 · 오류 0
 * 가상 자료만 씀(별명 · 글 지어냄) · 진짜 맵톡 자료는 건드리지 않음.
 */
import { createRequire } from 'module'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')

const 주소 = process.argv[2] || 'http://127.0.0.1:4975'
const 캡처 = process.env.CAPTURE || ''
let 통과 = 0, 실패 = 0
const 봄 = (이름, 참, 더 = '') => { if (참) { 통과++; console.log('  ✓', 이름) } else { 실패++; console.log('  ✗', 이름, 더) } }

const 지금 = Date.now()
const 키 = (n) => '-P9zz' + String(n).padStart(15, '0')
const 씨앗 = {
  qna: {
    [키(1)]: { t: '[후기·건의] 하도급 대금 직불 되나요?', b: '원청이 늦게 주는데 발주처 직불 신청 되는지 궁금합니다', nick: '부지런한 미장공1', uid: 'u1', at: 지금 - 5 * 3600e3 },
    [키(2)]: { t: '[후기·건의] 사정률 요즘 어떻게 보세요?', b: '옛 전문가 방 글(분야 입찰)', nick: '성실한 반장2', uid: 'u2', at: 지금 - 4 * 3600e3, x: 'bid' },
    [키(3)]: { t: '[후기·건의] 오늘 타설 끝났습니다', b: '현장 이야기 — 비가 그쳐서 다행입니다', nick: '침착한 소장3', uid: 'u3', at: 지금 - 3 * 3600e3 },
    [키(4)]: { t: '[후기·건의] 노무비 명세서 이렇게 맞나요?', b: '답 달린 질문', nick: '꼼꼼한 공무4', uid: 'u4', at: 지금 - 2 * 3600e3, x: 'safe' },
    [키(5)]: { t: '[후기·건의] 일용 4대보험 신고 언제까지인가요', b: '자유 방 질문 — 답 없음', nick: '든든한 기사5', uid: 'u5', at: 지금 - 3600e3, x: '-' },
    /* G547b — 운영자(K-건설맵)가 쓴 사례 · 알림 글은 «?» 가 있어도 «답을 기다리는 질문» 에 안 뜸(소장님 「답글이 안달린건...클로드가 쓴 알림글 비슷한거야」) */
    [키(6)]: { t: '[후기·건의] 💬 사례 · 일용직 국민연금 — 첫 달 5일만 일했는데 가입인가요?', b: '가상 사례 글', nick: 'K-건설맵', uid: 'ZglL1g3X5UZFBA2590LirDnEnil1', at: 지금 - 1800e3 },
  },
  qna_a: { [키(4)]: { a1: { b: '노무비 계산기로 맞춰 보시면 됩니다', nick: '친절한 반장6', uid: 'u6', at: 지금 - 1800e3 } } },
  qna_del: {}, qna_top: {},
  qna_pro: { u2: { f: 'bid', co: '가상건설', nm: '홍길동', at: 지금 - 86400e3 }, u6: { f: 'safe', nm: '임꺽정', at: 지금 - 86400e3 } },
}

const 브 = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] })
const 새판 = async (크기, 폰 = false) => {
  const 판 = await 브.newContext({ viewport: 크기, isMobile: 폰, hasTouch: 폰, locale: 'ko-KR', timezoneId: 'Asia/Seoul', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36' })
  await 판.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  await 판.addInitScript((s) => {
    if (!sessionStorage.getItem('씨앗됨')) { localStorage.setItem('mockdb', JSON.stringify(s)); sessionStorage.setItem('씨앗됨', '1'); sessionStorage.setItem('kcm.qna.방', JSON.stringify('x:bid')) }
    try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체') } catch (e) { /* */ }
  }, 씨앗)
  const p = await 판.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 160)))
  p.on('dialog', (d) => d.dismiss())
  return { 판, p, 오류 }
}
const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - innerWidth)

for (const [이름, 크기, 폰] of [['PC 1440', { width: 1440, height: 1000 }, false], ['폰 390', { width: 390, height: 844 }, true]]) {
  console.log(`■ ${이름}`)
  const { 판, p, 오류 } = await 새판(크기, 폰)
  await p.goto(주소 + '/qna', { waitUntil: 'domcontentloaded' })
  await p.waitForFunction(() => document.body.innerText.includes('오늘 타설 끝났습니다'), null, { timeout: 20000 })
  await p.waitForTimeout(800)
  const 카드수 = await p.locator('article.mt-card').count()
  // ①
  const 방줄 = await p.evaluate(() => [...document.querySelectorAll('nav.mt-rooms .mt-room')].map((b) => ({ 글: b.innerText.replace(/\s+/g, ' ').trim(), 켬: b.classList.contains('on') })))
  봄('① 방 줄 = 전체 · 💬 자유 · 📍 지역방 — 🙋 전문가 방 없음', 방줄.some((b) => /^전체/.test(b.글)) && 방줄.some((b) => /자유/.test(b.글)) && 방줄.some((b) => /지역방/.test(b.글)) && !방줄.some((b) => /전문가/.test(b.글)), JSON.stringify(방줄))
  봄("① 옛 기억(전문가 방 'x:bid')은 «전체» 로 — 이용자 글 다섯 · 운영자 글 하나 모두 보임", (방줄.find((b) => /^전체/.test(b.글)) || {}).켬 === true && 카드수 === 6, `${JSON.stringify(방줄)} · 카드 ${카드수}`)
  봄('① 분야 줄(입찰·계약 · 적산·내역 …) 없음', (await p.locator('nav[aria-label="전문가 분야"]').count()) === 0)
  // ②
  const 온글 = await p.evaluate(() => document.querySelector('main').innerText)
  봄('② «🙋 입찰·계약» 같은 분야 딱지 · «✅ … 홍길동» 명패 · «명패 신청» 없음', !/🙋 입찰·계약|🙋 안전·품질·노무|✅ 입찰·계약|홍길동|임꺽정|명패 신청|🪪/.test(온글), (온글.match(/.{0,20}(🙋 입찰|홍길동|명패|🪪).{0,20}/) || [''])[0])
  봄('② 명패 · 분야 칸(.mt-pros · .mt-card-pro · .mt-ftag · .mt-fbadge) 0', (await p.locator('.mt-pros, .mt-card-pro, .mt-ftag, .mt-fbadge, .mt-pro').count()) === 0, String(await p.locator('.mt-pros, .mt-card-pro, .mt-ftag, .mt-fbadge, .mt-pro').count()))
  // ③
  const 기다림 = await p.evaluate(() => { const h = [...document.querySelectorAll('.mt-panel h3')].find((x) => /답을 기다리는 질문/.test(x.innerText)); if (!h) return null; return [...h.parentElement.querySelectorAll('li')].map((li) => li.innerText.replace(/\s+/g, ' ').trim()) })
  if (!폰 || 기다림) {
    봄('③ 답을 기다리는 질문 = 모든 방 «이용자» 물음 글 중 답 없는 셋(옛 전문가 글 · 자유 글 둘) · 답 있는 글 · 물음 아닌 글 · 운영자 사례 글 없음(G547b)',
      !!기다림 && 기다림.length === 3 && 기다림.some((t) => /사정률/.test(t)) && 기다림.some((t) => /직불/.test(t)) && 기다림.some((t) => /4대보험 신고/.test(t)) && !기다림.some((t) => /타설|노무비 명세서|사례/.test(t)), JSON.stringify(기다림))
  } else 봄('③ (폰) 답 기다림 판은 PC 오른쪽에만 — 폰은 셈 안 함', true)
  /* 캡처 — 인사 띠는 가리고 방 줄이 맨 위에 오게(방 줄 · 카드 · 오른쪽 답 기다림이 한 장에) */
  const 찍기 = async (이름) => { await p.addStyleTag({ content: '.insa{display:none!important}' }); await p.evaluate(() => { const n = document.querySelector('nav.mt-rooms'); n.scrollIntoView({ block: 'start' }); window.scrollBy(0, -70) }); await p.waitForTimeout(400); await p.screenshot({ path: `${캡처}/${이름}_${폰 ? '폰390' : 'PC1440'}.png` }) }
  if (캡처) {
    await 찍기('맵톡_안내')   // 처음 온 기기 — 안내(쓰는 법)가 펼쳐진 채: 🙋 전문가 방 · 🪪 명패 줄이 빠진 것
    await p.evaluate(() => localStorage.setItem('kcm.qna.공지판', '2026-10-19')); await p.reload({ waitUntil: 'domcontentloaded' })
    await p.waitForFunction(() => document.body.innerText.includes('오늘 타설 끝났습니다'), null, { timeout: 20000 }); await p.waitForTimeout(800)
    await 찍기('맵톡_방둘')   // 안내를 접은 뒤 — 방 줄 · 카드 · (PC) 오른쪽 답 기다림
  }
  // ④ 글쓰기
  /* 폰은 칩 글씨를 숨기고 그림만 보임 — 숨은 글까지 읽으려고 textContent */
  const 칩 = await p.evaluate(() => [...document.querySelectorAll('.mt-crow .mt-chip')].map((b) => b.textContent.replace(/\s+/g, ' ').trim()))
  봄('④ 글쓰기 칩 — «전문가에게 묻기» 없음 · «모임 글» 그대로', !칩.some((t) => /전문가/.test(t)) && 칩.some((t) => /모임 글/.test(t)), JSON.stringify(칩))
  const 제목칸 = p.locator('input[placeholder*="제목"], textarea[placeholder*="제목"]').first()
  if (await 제목칸.count()) {
    await 제목칸.fill('사정률 어떻게 넣으세요?')
    await p.waitForTimeout(400)
    봄('④ 물음 글을 써도 «🙋 … 전문가 방에도» 줄 없음', !/전문가 방에도|어느 분야 전문가/.test(await p.evaluate(() => document.querySelector('main').innerText)))
    await 제목칸.fill('')
  } else 봄('④ 제목 칸 찾기', false, '제목 칸 없음')
  // ⑤ 글 열기(옛 전문가 글)
  await p.locator('article.mt-card', { hasText: '사정률 요즘 어떻게' }).first().locator('button').first().click()
  await p.waitForTimeout(800)
  const 창 = await p.evaluate(() => { const w = document.querySelector('.mt-who'); return { 누구: w ? w.innerText : '', 딱지: [...document.querySelectorAll('.mt-meta .mt-ftag')].length, 답칸: !!document.querySelector('textarea') } })
  봄('⑤ 글 열기 — 분야 딱지 · 명패 없음 · 답글 칸 있음', 창.딱지 === 0 && !/홍길동|✅/.test(창.누구) && 창.답칸, JSON.stringify(창))
  if (캡처) await p.screenshot({ path: `${캡처}/맵톡_글열기_${폰 ? '폰390' : 'PC1440'}.png` })
  // ⑥
  봄(`⑥ ${이름} 넘침 0 · 오류 0`, (await 넘침(p)) <= 0 && !오류.length, JSON.stringify([await 넘침(p), 오류]))
  await 판.close()
}
console.log('■ 폰 320')
{
  const { 판, p, 오류 } = await 새판({ width: 320, height: 700 }, true)
  await p.goto(주소 + '/qna', { waitUntil: 'domcontentloaded' })
  await p.waitForFunction(() => document.body.innerText.includes('오늘 타설 끝났습니다'), null, { timeout: 20000 })
  await p.waitForTimeout(600)
  봄('⑥ 폰 320 넘침 0 · 오류 0', (await 넘침(p)) <= 0 && !오류.length, JSON.stringify([await 넘침(p), 오류]))
  await 판.close()
}
await 브.close()
console.log(`\n맵톡 방 둘 ${통과}/${통과 + 실패}`)
if (실패) process.exit(1)
