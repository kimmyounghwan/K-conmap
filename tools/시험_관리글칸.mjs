// 🧪 G800 관리 화면 글칸(문의함 «답» · 맵톡 답글) — 소장님 11-20 「글쓰는 칸이 너무 적어. 다른 게시판 처럼 넓게 해줘」
//   node tools/시험_관리글칸.mjs <흉내 판 주소>   (굽기.sh 로 구운 흉내 판 — mockfb · 운영자 번호로 /admin)
//   ① 글칸 = .adm-ta(문의함 · 맵톡 둘 다) ② 빈 칸도 200px 넘게 ③ 사이트 글꼴(고정폭 아님) · PC 15px · 폰 16px
//   ④ 적어 둔 긴 답이 칸 안에 다 보임(PC — 안에서 안 굴림 · 폰은 좁아 길어지면 640px 까지) ⑤ 글을 더 치면 칸이 따라 늘어남 · 640px 넘으면 칸 안에서 굴림
//   ⑥ 카드 폭 그대로(폰 390 도 옆으로 안 넘침) ⑦ 화면 오류 없음
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const 주소 = process.argv[2] || 'http://127.0.0.1:5814'
let 통과 = 0, 실패 = 0
const 봐 = (참, 무엇, 더 = '') => { if (참) { 통과++; console.log('  ✓', 무엇) } else { 실패++; console.log('  ✗', 무엇, 더) } }

const 지금 = Date.now()
const 긴답 = Array.from({ length: 16 }, (_, i) => `${i + 1}째 줄 — 가상 문의에 적어 둔 답입니다. 칸 안에서 굴리지 않고 다 보여야 합니다.`).join('\n')
const 씨앗 = {
  quotes: {
    q1: { at: 지금 - 3600e3, work: '공사 연결 · 도면 · 서류 작성대행 상담', want: '서류 작성대행 — 내역서', phone: '01000000000', memo: '가상 문의 — 낙찰률 적용 내역서가 필요합니다.' },
    q2: { at: 지금 - 7200e3, work: '제휴 문의', want: '제휴', phone: 'test@example.com', memo: '가상 제휴 문의입니다.' },
  },
  quote_a: { q1: { b: 긴답, at: 지금 - 1800e3 } },
  qna: { p1: { at: 지금 - 5000e3, t: '가상 맵톡 글', b: '가상 본문입니다', nick: '가상 소장1', uid: 'u_x' } },
}
const 브 = await chromium.launch()
for (const [이름, w, h] of [['PC 1280', 1280, 900], ['폰 390', 390, 844]]) {
  console.log(`■ ${이름}`)
  const 판 = await 브.newContext({ viewport: { width: w, height: h }, isMobile: w < 500, hasTouch: w < 500 })
  await 판.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs|coupang/, (r) => r.fulfill({ status: 200, body: '' }))
  await 판.route(/firebaseio\.com/, (r) => r.fulfill({ status: 503, body: 'down' }))
  await 판.addInitScript(([s]) => {
    if (!sessionStorage.getItem('씨앗됨')) { localStorage.setItem('mockdb', JSON.stringify(s)); localStorage.setItem('mockuid', 'ZglL1g3X5UZFBA2590LirDnEnil1'); sessionStorage.setItem('씨앗됨', '1') }
    localStorage.setItem('mock지연', '0')
    try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) { /* 없음 */ }
  }, [씨앗])
  const A = await 판.newPage()
  const 오류 = []; A.on('pageerror', (e) => 오류.push(String(e).slice(0, 150)))
  await A.goto(주소 + '/admin', { waitUntil: 'domcontentloaded' })
  await A.waitForFunction(() => document.body.innerText.includes('📝 문의함'), null, { timeout: 20000 })
  await A.waitForTimeout(800)
  const 칸들 = await A.evaluate(() => [...document.querySelectorAll('textarea')].filter((t) => t.closest('.card')).map((t) => {
    const cs = getComputedStyle(t), r = t.getBoundingClientRect(), c = t.closest('.card').getBoundingClientRect()
    return { cls: t.className, h: Math.round(r.height), sh: t.scrollHeight, ch: t.clientHeight, ff: cs.fontFamily, fs: cs.fontSize, w: Math.round(r.width), cw: Math.round(c.width), right: Math.round(r.right), 값: t.value.length }
  }))
  const 몸글꼴 = await A.evaluate(() => getComputedStyle(document.body).fontFamily)
  const 큰칸 = 칸들.filter((x) => /\badm-ta\b/.test(x.cls))
  봐(칸들.length >= 3 && 큰칸.length === 칸들.length, `① 관리 화면 글칸 ${칸들.length}개 모두 .adm-ta(문의함 둘 · 맵톡 하나)`, JSON.stringify(칸들.map((x) => x.cls)))
  봐(큰칸.every((x) => x.h >= 199), '② 모든 글칸 높이 200px 넘게(예전 70 · 80)', JSON.stringify(큰칸.map((x) => x.h)))
  봐(큰칸.every((x) => x.ff === 몸글꼴 && !/mono/i.test(x.ff)), '③ 사이트 글꼴 그대로(고정폭 아님)', `${큰칸[0] && 큰칸[0].ff} / 몸 ${몸글꼴}`)
  봐(큰칸.every((x) => x.fs === (w < 500 ? '16px' : '15px')), `③ 글자 크기 ${w < 500 ? '16px(폰 — 아이폰 확대 막기)' : '15px'}`, JSON.stringify(큰칸.map((x) => x.fs)))
  const 답칸 = 큰칸.find((x) => x.값 > 500)
  if (w >= 500) 봐(!!답칸 && 답칸.sh <= 답칸.ch + 2 && 답칸.h > 200 && 답칸.h <= 642, '④ 적어 둔 긴 답(16줄)이 칸 안에 다 보임 — 칸이 늘어남 · 안에서 안 굴림', JSON.stringify(답칸))
  else 봐(!!답칸 && 답칸.h >= 630 && 답칸.h <= 642 && 답칸.sh > 답칸.ch, '④ 폰 — 좁아서 길어진 답은 640px 까지 늘고 그 뒤는 칸 안에서 굴림(화면을 다 가리지 않게)', JSON.stringify(답칸))
  봐(큰칸.every((x) => x.w >= x.cw * 0.85 && x.right <= w), '⑥ 카드 폭 그대로 · 화면 밖으로 안 넘침', JSON.stringify(큰칸.map((x) => [x.w, x.cw, x.right])))
  /* ⑤ 빈 칸에 글을 치면 따라 늘어나고, 아주 길면 640px 에서 멈추고 칸 안에서 굴림 */
  const 빈 = A.locator('textarea.adm-ta').nth(큰칸.findIndex((x) => x.값 === 0) >= 0 ? 큰칸.findIndex((x) => x.값 === 0) : 0)
  await 빈.click()
  await 빈.fill(Array.from({ length: 9 }, (_, i) => `${i + 1}줄`).join('\n'))
  await A.waitForTimeout(200)
  const 아홉 = await 빈.evaluate((t) => ({ h: Math.round(t.getBoundingClientRect().height), sh: t.scrollHeight, ch: t.clientHeight }))
  await 빈.fill(Array.from({ length: 40 }, (_, i) => `${i + 1}줄`).join('\n'))
  await A.waitForTimeout(200)
  const 사십 = await 빈.evaluate((t) => ({ h: Math.round(t.getBoundingClientRect().height), sh: t.scrollHeight, ch: t.clientHeight }))
  봐(아홉.h >= 200 && 아홉.sh <= 아홉.ch + 2, '⑤ 9줄 — 칸 안에 다 보임', JSON.stringify(아홉))
  봐(사십.h >= 630 && 사십.h <= 642 && 사십.sh > 사십.ch, '⑤ 40줄 — 640px 에서 멈추고 칸 안에서 굴림', JSON.stringify(사십))
  await 빈.fill('')
  await A.waitForTimeout(200)
  const 비움 = await 빈.evaluate((t) => Math.round(t.getBoundingClientRect().height))
  봐(비움 >= 199 && 비움 <= 230, '⑤ 다시 비우면 200px 로 돌아옴', String(비움))
  봐(!오류.length, '⑦ 화면 오류 없음', 오류.join(' | '))
  await 판.close()
}
await 브.close()
console.log(`\n${실패 ? '❌' : '✅'} 관리 글칸 ${통과}/${통과 + 실패}`)
process.exit(실패 ? 1 : 0)
