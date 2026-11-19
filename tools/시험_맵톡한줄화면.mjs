/**
 * 🗂 G779 맵톡 «지난 글은 한 줄로» 화면 시험 (2026-11-19)
 *   소장님 「당일에는 이런식으로 하고 하루가 지나면 공간을 덜 차지하는 걸로 해서 가로 한 줄로 하면 어때?」 → 「1,2,3,4 먼저 해줘」
 *   준비: 가짜 파이어베이스로 구운 판(굽기.sh → 정적 서버) · node tools/시험_맵톡한줄화면.mjs [주소=http://127.0.0.1:5780] · CAPTURE=폴더 면 화면 사진
 *   PC 1440 · 폰 390 · 360 · 320 마다:
 *   ① 24시간 안 글(6장)은 카드 · 24시간 지난 글은 모두 한 줄 · 한 줄은 «.mt-card» 가 아님(벽돌 칸에 안 섞임)
 *   ② 한 줄 = 방 이름 · 제목 · 💬 ♥ 👁 · 날짜(MM.DD · 지난해는 YYYY.MM.DD) · ✅ K-건설맵(PC 글씨 · 폰 ✅ 만) · 사진 글 📷 · 줄 높이 한 줄(56px 안) · 줄 안에 다 들어감 · 옆 넘침 0
 *   ③ 날짜 띠(어제 · 이번 주 · 지난 주 · 그 전) — 시험이 따로 센 한국 날짜와 같은 띠 · 띠 차례
 *   ④ 답 없는 질문 한 줄 «답하기» → 글 창이 열리고 답글 칸에 커서 · 답 있는 질문은 «답하기» 없음
 *   ⑤ 줄을 누르면(제목 · 날짜 자리) 그 글이 열림 · ♥ 는 그 자리에서 공감(창이 안 열림)
 *   ⑥ 💬 고마워요 · 한마디 띠 = 24시간 안 한마디만 · 지난 한마디는 한 줄로(겹치지 않음) · 공지 글은 한 줄에 없음
 *   ⑦ 내 지난 글 한 줄을 누르면 카드로 맨 앞에 올라오고(빛남) 창이 열림(G148 그대로)
 *   ⑧ 지역방(경기·인천 — 글 둘) = 카드 6장이 안 되니 지난 글도 카드(한 줄 없음) ⑨ 어두운 화면 — 제목 글씨가 바탕과 다름 ⑩ 오류 0
 * 가상 자료만 씀(별명 · 글 지어냄) · 진짜 맵톡 자료는 건드리지 않음.
 */
import { createRequire } from 'module'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')

const 주소 = process.argv[2] || 'http://127.0.0.1:5780'
const 캡처 = process.env.CAPTURE || ''
let 통과 = 0, 실패 = 0
const 봄 = (이름, 참, 더 = '') => { if (참) { 통과++; console.log('  ✓', 이름) } else { 실패++; console.log('  ✗', 이름, 더) } }

const H = 3600e3, D = 24 * H
const 지금 = Date.now()
const 나 = 'mockuser779'
const OP = 'ZglL1g3X5UZFBA2590LirDnEnil1'
const 키 = (n) => '-P9zz' + String(n).padStart(15, '0')
const 사진 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
/* [번호, 제목, 몇 시간 전, 더] — 번호가 클수록 새 글(열쇠 차례 = 시각 차례) */
const 글들 = [
  [1, '가상 지난해 글입니다', 330 * 24, {}],
  [2, '가상 한 달 넘은 글', 40 * 24, {}],
  [3, '가상 이십오일 된 글', 25 * 24, {}],
  [4, '가상 보름 된 글', 15 * 24, {}],
  [5, '가상 열흘 된 글', 10 * 24, {}],
  [6, '가상 여드레 된 글', 8 * 24, {}],
  [7, '가상 감사합니다 덕분에 편해요', 130, {}],                       /* 지난 한마디 → 한 줄 */
  [8, '가상 현장 사진 올립니다', 120, { p: 사진 }],
  [9, '가상 내가 쓴 지난 글입니다', 100, { uid: 나, nick: '가상 별명1' }],
  [10, '가상 도면보고 물량산출 해 봤습니다', 75, { g: '41480' }],     /* 답 1 · 지역방(경기·인천 — 방 이름이 긴 줄) */
  [11, '가상 기성 청구 서류 뭐가 필요한가요?', 60, {}],               /* 답 없는 질문 → «답하기» */
  [12, '가상 위험성평가 5×4 기준으로도 되나요?', 50, {}],             /* K-건설맵 답 → ✅ */
  [13, '가상 신기해요', 30, {}],
  [14, '가상 좋다', 26, {}],
  [15, '가상 공지 — 새 서식을 올렸습니다', 28, { c: 'K-건설맵', uid: OP, nick: 'K-건설맵' }],   /* 공지 → 맨 위 공지 줄 */
  [16, '가상 파주 현장 장비 구합니다', 23, { g: '41480' }],           /* 지역방(경기·인천) 카드 */
  [17, '가상 오늘 철근 들어왔습니다', 18, {}],
  [18, '가상 오늘 거푸집 끝', 14, {}],
  [19, '가상 반갑습니다 ㅎㅎ', 8, {}],                               /* 24시간 안 한마디 셋 → 띠 */
  [20, '가상 오늘 비가 와서 쉽니다', 10, {}],
  [21, '가상 수고하셨습니다 화이팅', 6, {}],
  [22, '가상 노무비 계산 어디서 하나요?', 5, {}],                      /* 24시간 안 질문 카드 «답하기» */
  [23, '가상 감사합니다 잘 쓰고 있어요', 3, {}],
  [24, '가상 오늘 타설 끝났습니다', 2, {}],
]
const 씨앗 = { qna: {}, qna_a: {}, qna_del: {}, qna_top: {}, qna_like: {}, qna_view: {} }
for (const [n, t, h, 더] of 글들) {
  const c = 더.c || '후기·건의'
  씨앗.qna[키(n)] = { t: `[${c}] ${t}`, b: '가상 내용입니다', nick: 더.nick || `가상 별명${n + 10}`, uid: 더.uid || 'u' + n, at: 지금 - h * H, ...(더.p ? { p: 더.p } : {}), ...(더.g ? { g: 더.g } : {}) }
}
씨앗.qna_a[키(10)] = { a1: { b: '가상 답글 — 잘 하셨습니다', nick: '가상 별명30', uid: 'u30', at: 지금 - 70 * H } }
씨앗.qna_a[키(12)] = { a1: { b: '가상 답 — 5×4 도 됩니다', nick: 'K-건설맵', uid: OP, op: true, at: 지금 - 48 * H } }
const 이름 = Object.fromEntries(글들.map(([n, t]) => [키(n), t]))

/* 시험이 따로 세는 한국 날짜 띠(lib 셈을 부르지 않음) */
const 날번호 = (ms) => Math.floor((ms + 9 * H) / D)
const 띠셈 = (at) => {
  const d = 날번호(at), t = 날번호(지금)
  if (d >= t) return '오늘'
  if (d === t - 1) return '어제'
  const 요일 = new Date(t * D).getUTCDay()          /* 0 일요일 */
  const 월 = t - ((요일 + 6) % 7)
  return d >= 월 ? '이번 주' : d >= 월 - 7 ? '지난 주' : '그 전'
}
const 날글 = (at) => { const a = new Date(at + 9 * H), n = new Date(지금 + 9 * H); const p = (v) => String(v).padStart(2, '0'); return (a.getUTCFullYear() !== n.getUTCFullYear() ? a.getUTCFullYear() + '.' : '') + p(a.getUTCMonth() + 1) + '.' + p(a.getUTCDate()) }

const 브 = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] })
const 새판 = async (크기, 폰 = false, 어둠 = false) => {
  const 판 = await 브.newContext({ viewport: 크기, isMobile: 폰, hasTouch: 폰, locale: 'ko-KR', timezoneId: 'Asia/Seoul', colorScheme: 어둠 ? 'dark' : 'light', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36' })
  await 판.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs|daumcdn|kakao/, (r) => r.fulfill({ status: 200, body: '' }))
  await 판.addInitScript(([s, u]) => {
    if (!sessionStorage.getItem('씨앗됨')) { localStorage.setItem('mockdb', JSON.stringify(s)); localStorage.setItem('mockuid', u); localStorage.setItem('kcm_qna_mine', JSON.stringify([])); sessionStorage.setItem('씨앗됨', '1') }
    try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체') } catch (e) { /* */ }
  }, [씨앗, 나])
  const p = await 판.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 160)))
  p.on('dialog', (d) => d.dismiss())
  return { 판, p, 오류 }
}
const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
const 열기 = async (p) => {
  await p.goto(주소 + '/qna', { waitUntil: 'domcontentloaded' })
  await p.waitForFunction(() => document.querySelectorAll('.mt-line').length > 0 && document.body.innerText.includes('가상 오늘 타설 끝났습니다'), null, { timeout: 25000 })
  await p.waitForTimeout(900)
}
const 줄들 = (p) => p.evaluate(() => [...document.querySelectorAll('.mt-lgroup')].flatMap((g) => {
  const 띠 = g.querySelector('.mt-lband').childNodes[0].textContent.trim()
  return [...g.querySelectorAll('.mt-line')].map((li) => {
    const r = li.getBoundingClientRect()
    const 안 = [...li.querySelectorAll('.mt-ltag, .mt-lt, .mt-lnums, .mt-ldate, .mt-lask, .mt-lok')].map((e) => e.getBoundingClientRect()).filter((b) => b.width > 0)
    const t = li.querySelector('.mt-lt')
    const ok = li.querySelector('.mt-lok-t')
    return { id: li.dataset.id, 띠, 글: li.innerText.replace(/\s+/g, ' '), 높이: Math.round(r.height), 왼: r.left, 오: r.right,
      밖: 안.some((b) => b.right > r.right + 0.5 || b.left < r.left - 0.5 || b.top < r.top - 0.5 || b.bottom > r.bottom + 0.5),
      제목폭: t ? Math.round(t.getBoundingClientRect().width) : 0, 날: (li.querySelector('.mt-ldate') || {}).textContent || '',
      답하기: !!li.querySelector('.mt-lask'), 확인: !!li.querySelector('.mt-lok'), 확인글: !!(ok && ok.getBoundingClientRect().width > 0),
      카드: li.classList.contains('mt-card') || !!li.closest('.mt-feed') }
  })
}))

for (const [이름판, 크기, 폰] of [['PC 1440', { width: 1440, height: 1000 }, false], ['폰 390', { width: 390, height: 844 }, true], ['폰 360', { width: 360, height: 780 }, true], ['폰 320', { width: 320, height: 640 }, true]]) {
  console.log(`■ ${이름판}`)
  const { 판, p, 오류 } = await 새판(크기, 폰)
  await 열기(p)
  /* ① 카드 · 한 줄 */
  const 카드들 = await p.evaluate(() => [...document.querySelectorAll('.mt-feed .mt-card')].map((e) => e.dataset.id))
  const 기대카드 = [24, 22, 20, 18, 17, 16].map(키)   /* 24시간 안 · 한마디(19 · 21 · 23) 빼고 · 새것부터 */
  봄('① 카드 = 24시간 안 글 여섯(새것부터)', JSON.stringify(카드들) === JSON.stringify(기대카드), JSON.stringify(카드들.map((k) => 이름[k])))
  const 줄 = await 줄들(p)
  const 기대줄 = [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(키)   /* 24시간 지난 글 모두(공지 15 빼고) */
  봄('① 24시간 지난 글은 모두 한 줄(새것부터 · 공지 빼고)', JSON.stringify(줄.map((x) => x.id)) === JSON.stringify(기대줄), JSON.stringify(줄.map((x) => 이름[x.id])))
  봄('① 한 줄은 카드 칸(.mt-feed)에 안 섞임 · .mt-card 아님', 줄.every((x) => !x.카드))
  /* ③ 날짜 띠 */
  const 띠틀림 = 줄.filter((x) => x.띠 !== 띠셈(씨앗.qna[x.id].at))
  봄('③ 띠 = 한국 날짜(어제 · 이번 주 · 지난 주 · 그 전)', 띠틀림.length === 0, JSON.stringify(띠틀림.map((x) => [이름[x.id], x.띠, 띠셈(씨앗.qna[x.id].at)])))
  const 띠차례 = await p.evaluate(() => [...document.querySelectorAll('.mt-lband')].map((e) => [e.childNodes[0].textContent.trim(), e.querySelector('em').textContent]))
  const 차례 = ['오늘', '어제', '이번 주', '지난 주', '그 전']
  봄('③ 띠 차례 · 띠마다 글 수', 띠차례.every((v, i) => i === 0 || 차례.indexOf(띠차례[i - 1][0]) < 차례.indexOf(v[0])) && 띠차례.every(([k, n]) => 줄.filter((x) => x.띠 === k).length === Number(n)), JSON.stringify(띠차례))
  /* ② 한 줄 모양 */
  봄('② 줄마다 한 줄 높이(56px 안)', 줄.every((x) => x.높이 <= 56 && x.높이 >= 40), JSON.stringify(줄.map((x) => x.높이)))
  봄('② 줄 안에 다 들어감(방 · 제목 · 숫자 · 날짜 · 답하기)', 줄.every((x) => !x.밖), JSON.stringify(줄.filter((x) => x.밖).map((x) => 이름[x.id])))
  봄('② 제목 칸이 보임(폭 40px 넘음)', 줄.every((x) => x.제목폭 > 40), JSON.stringify(줄.map((x) => x.제목폭)))
  봄('② 날짜 MM.DD · 지난해 YYYY.MM.DD', 줄.every((x) => x.날 === 날글(씨앗.qna[x.id].at)), JSON.stringify(줄.map((x) => x.날)))
  const 줄글 = Object.fromEntries(줄.map((x) => [x.id, x]))
  /* 좁은 폰(400px 안)의 «답하기» 줄은 답이 0 이라 «💬 0» 을 뺌(제목 자리) — 그 밖엔 💬 ♥ 👁 다 */
  const 좁음 = 크기.width <= 400
  const 다있음 = 줄.every((x) => (x.답하기 && 좁음 ? !/💬/.test(x.글) : /💬\s*\d/.test(x.글)) && /♥\s*\d/.test(x.글) && /👁\s*\d/.test(x.글) && /(자유|경기·인천)/.test(x.글))
  봄(좁음 ? '② 방 이름 · 💬 ♥ 👁 숫자(«답하기» 줄은 💬 0 뺌)' : '② 방 이름 · 💬 ♥ 👁 숫자 다 있음', 다있음, 줄.filter((x) => !/👁\s*\d/.test(x.글) || !/💬/.test(x.글)).map((x) => x.글).join(' / '))
  봄('② 지역방 글 줄 — «경기·인천»' + (폰 ? '' : ' · 📍파주시'), 줄글[키(10)].글.includes('경기·인천') && (폰 ? !줄글[키(10)].글.includes('파주시') : 줄글[키(10)].글.includes('파주시')), 줄글[키(10)].글)
  봄('② 답 1 → «💬 1»', /💬\s*1/.test(줄글[키(10)].글))
  봄('② K-건설맵 답 → ✅(PC «✅ K-건설맵» · 폰 ✅ 만)', 줄글[키(12)].확인 && 줄글[키(12)].확인글 === !폰 && 줄.filter((x) => x.확인).length === 1)
  봄('② 사진 글 📷', 줄글[키(8)].글.includes('📷'))
  /* ④ 답하기 */
  봄('④ 답 없는 질문 한 줄에 «답하기» · 답 있는 질문(✅) · 질문 아닌 글엔 없음', 줄글[키(11)].답하기 && !줄글[키(12)].답하기 && 줄.filter((x) => x.답하기).length === 1)
  /* ⑥ 한마디 · 공지 */
  const 띠글 = await p.evaluate(() => [...document.querySelectorAll('.mt-hanmadi .mt-hm-t')].map((e) => e.textContent))
  봄('⑥ 한마디 띠 = 24시간 안 셋만', 띠글.length === 3 && ['가상 반갑습니다', '가상 수고하셨습니다', '가상 감사합니다 잘 쓰고'].every((t) => 띠글.some((x) => x.includes(t))), JSON.stringify(띠글))
  봄('⑥ 지난 한마디는 한 줄로(띠에 없음)', !!줄글[키(7)] && !띠글.some((x) => x.includes('덕분에 편해요')))
  봄('⑥ 공지 글은 한 줄에 없음(맨 위 공지 줄)', !줄글[키(15)] && (await p.locator('.mt-nrow', { hasText: '가상 공지' }).count()) > 0)
  봄('⑩ 옆 넘침 0', (await 넘침(p)) <= 0, String(await 넘침(p)))
  if (캡처) {
    const fs = await import('node:fs'); fs.mkdirSync(캡처, { recursive: true })
    await p.evaluate(() => { document.querySelectorAll('footer, .site-foot, .foot, [class*="footer"]').forEach((e) => { e.style.visibility = 'hidden' }); document.querySelectorAll('.insa-x, .noti-x').forEach((b) => b.click()) })
    const 위 = await p.evaluate(() => { const f = document.querySelector('.mt-feed'); const l = document.querySelector('.mt-lines'); const a = f.getBoundingClientRect(); window.scrollTo(0, a.top + scrollY - 70); return 0 })
    await p.waitForTimeout(400)
    await p.screenshot({ path: `${캡처}/G779_${이름판.replace(/\s/g, '')}_카드끝.png` })
    await p.evaluate(() => { const l = document.querySelector('.mt-lines'); window.scrollTo(0, l.getBoundingClientRect().top + scrollY - (innerWidth < 700 ? 230 : 260)) })
    await p.waitForTimeout(400)
    await p.screenshot({ path: `${캡처}/G779_${이름판.replace(/\s/g, '')}_한줄.png` })
    void 위
  }
  /* ⑤ 줄 누르기 — 제목 · 날짜 자리 */
  await p.locator('.mt-line', { hasText: '가상 신기해요' }).locator('.mt-lt').click()
  await p.waitForSelector('.mt-sheet h2.mt-full', { timeout: 8000 })
  봄('⑤ 제목을 누르면 그 글이 열림', (await p.locator('.mt-sheet h2.mt-full').innerText()).includes('가상 신기해요'))
  await p.locator('.mt-x').click(); await p.waitForTimeout(500)
  await p.locator('.mt-line', { hasText: '가상 보름 된 글' }).locator('.mt-ldate').click()
  await p.waitForSelector('.mt-sheet h2.mt-full', { timeout: 8000 })
  봄('⑤ 날짜 자리를 눌러도 열림', (await p.locator('.mt-sheet h2.mt-full').innerText()).includes('가상 보름 된 글'))
  await p.locator('.mt-x').click(); await p.waitForTimeout(500)
  /* ⑤ ♥ — 그 자리에서 공감 */
  const 하트 = p.locator('.mt-line', { hasText: '가상 좋다' }).locator('.mt-lh')
  await 하트.click(); await p.waitForTimeout(900)
  봄('⑤ ♥ 누르면 공감 1 · 창은 안 열림', /♥\s*1/.test(await 하트.innerText()) && (await p.locator('.mt-sheet').count()) === 0, await 하트.innerText())
  /* ④ 답하기 → 창 + 답글 칸 커서 */
  await p.locator('.mt-line', { hasText: '기성 청구 서류' }).locator('.mt-lask').click()
  await p.waitForSelector('.mt-sheet h2.mt-full', { timeout: 8000 })
  await p.waitForTimeout(1600)
  봄('④ «답하기» → 그 글 창 · 답글 칸에 커서', (await p.locator('.mt-sheet h2.mt-full').innerText()).includes('기성 청구 서류') && await p.evaluate(() => !!(document.activeElement && document.activeElement.tagName === 'TEXTAREA' && document.activeElement.closest('.mt-sheet'))))
  await p.locator('.mt-x').click(); await p.waitForTimeout(500)
  /* ⑦ 내 지난 글 → 카드로 맨 앞 */
  await p.locator('.mt-line', { hasText: '가상 내가 쓴 지난 글' }).locator('.mt-lt').click()
  await p.waitForTimeout(500)
  const 첫카드 = await p.evaluate(() => { const c = document.querySelector('.mt-feed .mt-card'); return c ? [c.dataset.id, c.classList.contains('lifted')] : [] })
  봄('⑦ 내 지난 글을 누르면 카드로 맨 앞 · 빛남', 첫카드[0] === 키(9) && 첫카드[1] === true, JSON.stringify(첫카드))
  봄('⑦ 올린 글은 한 줄 목록에서 빠짐', (await p.locator('.mt-line', { hasText: '가상 내가 쓴 지난 글' }).count()) === 0)
  await p.waitForSelector('.mt-sheet h2.mt-full', { timeout: 8000 })
  봄('⑦ 그리고 창이 열림', (await p.locator('.mt-sheet h2.mt-full').innerText()).includes('가상 내가 쓴 지난 글'))
  await p.locator('.mt-x').click(); await p.waitForTimeout(500)
  봄('⑩ 오류 0', 오류.length === 0, 오류.join(' | '))
  await 판.close()
}

console.log('■ ⑧ 지역방(경기·인천 — 글 둘)')
{
  const { 판, p, 오류 } = await 새판({ width: 390, height: 844 }, true)
  await p.addInitScript(() => { try { sessionStorage.setItem('kcm.qna.방', JSON.stringify('r:gyeonggi')) } catch (e) { /* */ } })
  씨앗.qna[키(30)] = { t: '[후기·건의] 가상 파주 지난 글', b: '가상', nick: '가상 별명40', uid: 'u40', at: 지금 - 90 * H, g: '41480' }
  await p.evaluate(() => 0).catch(() => 0)
  await p.goto(주소 + '/qna', { waitUntil: 'domcontentloaded' })
  await p.evaluate((s) => { localStorage.setItem('mockdb', JSON.stringify(s)) }, 씨앗)
  await p.reload({ waitUntil: 'domcontentloaded' })
  await p.waitForFunction(() => document.body.innerText.includes('가상 오늘 타설 끝났습니다') || document.body.innerText.includes('가상 파주 현장'), null, { timeout: 25000 })
  await p.waitForTimeout(900)
  /* 지역방은 이 창 기억(sessionStorage kcm.qna.방 = 'r:gyeonggi')으로 엶 */
  const [카드수, 줄수, 카드글] = await p.evaluate(() => [document.querySelectorAll('.mt-feed .mt-card').length, document.querySelectorAll('.mt-line').length, [...document.querySelectorAll('.mt-feed .mt-card .mt-say')].map((e) => e.textContent)])
  봄('⑧ 글 셋(23 · 75 · 90시간) = 모두 카드 · 한 줄 없음(6장 안 되면 카드로 채움)', 카드수 === 3 && 줄수 === 0 && 카드글.some((t) => t.includes('파주 지난 글')) && 카드글.some((t) => t.includes('도면보고')), JSON.stringify([카드수, 줄수, 카드글]))
  봄('⑩ 오류 0', 오류.length === 0, 오류.join(' | '))
  await 판.close()
}

console.log('■ ⑨ 어두운 화면(폰 390)')
{
  const { 판, p, 오류 } = await 새판({ width: 390, height: 844 }, true, true)
  await 열기(p)
  const [글색, 바탕] = await p.evaluate(() => { const t = document.querySelector('.mt-line .mt-lt'); const l = document.querySelector('.mt-llist'); return [getComputedStyle(t).color, getComputedStyle(l).backgroundColor] })
  봄('⑨ 제목 글씨 ≠ 바탕(어두운 화면)', 글색 !== 바탕 && !/^rgba?\(0, 0, 0(, 0)?\)$/.test(바탕), `${글색} / ${바탕}`)
  if (캡처) {
    await p.evaluate(() => { document.querySelectorAll('.insa-x, .noti-x').forEach((b) => b.click()); const l = document.querySelector('.mt-lines'); window.scrollTo(0, l.getBoundingClientRect().top + scrollY - 230) })
    await p.waitForTimeout(400)
    await p.screenshot({ path: `${캡처}/G779_폰390_어두운화면.png` })
  }
  봄('⑩ 오류 0', 오류.length === 0, 오류.join(' | '))
  await 판.close()
}

await 브.close()
console.log(`\n${실패 ? '❌' : '✅'} 시험_맵톡한줄화면 ${통과}/${통과 + 실패}`)
process.exit(실패 ? 1 : 0)
