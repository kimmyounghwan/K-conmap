/**
 * 💰🛒 쪽 «가운데» 광고 화면 시험 (2026-11-16 소장님 「건설맵 페이지가 수천페이지 아니야?? 근데 광고가 별로 없어」 → 「다 넣어」 「페이지 마다」
 *     → 「페이지마다 다 넣어 쿠팡도 넣고, 상품은 겹치지 않게 다양하게 하고,,, 페이지 마다 다」)
 *   구운 사이트를 띄운 뒤  B=http://127.0.0.1:4737 AFIT_LIB=<그 판의 lib/애드핏.js> node tools/시험_애드핏가운데.mjs        (PLAYWRIGHT: /tmp/g10/pw · PC bat 에서는 안 돌림)
 *   ⚠️ lib/애드핏.js 애드핏단위.중 번호가 비어 있으면(애드핏에서 광고단위를 만들기 전) 애드핏 가운데 칸은 안 그려야 맞음 — 그것만 봄(쿠팡 가운데 줄은 봄)
 *   ⚠️ 공고 · 날짜 성적표 · 날짜 목록은 구운 판에 가상 자료 쪽(notice/TEST-0001.html 등 — 실제 공사명 · 상호 없음)을 넣어 봄(본보기.py)
 *   쪽마다: ① 애드핏 가운데 칸 수(넣은 쪽 1 · 안 넣는 쪽 0) · 한 쪽 애드핏 둘까지(가운데 + 끝 — 4개 넘음 금지 안)
 *   ② 애드핏 가운데 칸 위아래로 단추 · 링크 · 입력 칸과 24px 넘게 떨어짐(운영정책 5.3.1)
 *   ③ 쿠팡 가운데 줄 수 · 한 쪽 쿠팡 줄들(위 · 가운데 · 바닥)의 주제가 다 다름(상품이 겹치지 않음)
 *   ④ 애드핏 가운데 칸과 쿠팡 가운데 줄 사이에 글 덩이(100px 넘게) — 광고끼리 바로 붙지 않음
 *   ⑤ 폰 390 · PC 1280 쪽 가로 넘침 없음 · ⑥ 뺀 쪽(투입비 · 미불금 서류 · 맵톡)엔 애드핏 없음 · ⑦ 쪽을 옮기면 새로 · 인쇄에 안 나옴 · 화면 오류 없음
 *   가짜 애드핏 스크립트(인터넷 안 부름) · 쿠팡 그림은 막음(자료 cards.json 은 판 안 것)
 */
import { createRequire } from 'module'
import { pathToFileURL } from 'url'
/* AFIT_LIB = 구운 판과 같은 lib/애드핏.js(가운데 번호를 넣어 구운 시험 판을 볼 때) · 없으면 이 저장소 것 */
const { 애드핏단위 } = await import(process.env.AFIT_LIB ? pathToFileURL(process.env.AFIT_LIB).href : '../web/src/lib/애드핏.js')
const require = createRequire(process.env.PW || '/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const B = process.env.B || 'http://127.0.0.1:4737'
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log(c ? '  ✓' : '  ✗', m, c ? '' : String(typeof 더 === 'string' ? 더 : JSON.stringify(더)).slice(0, 400)) }
const 있음 = !!(애드핏단위.중.폰.id && 애드핏단위.중.PC.id)
const 가짜 = `(function(){document.querySelectorAll('ins.kakao_ad_area').forEach(function(ins){if(ins.getAttribute('data-t'))return;ins.setAttribute('data-t','1');var w=+ins.getAttribute('data-ad-width'),h=+ins.getAttribute('data-ad-height');ins.style.display='block';var d=document.createElement('div');d.style.cssText='width:'+w+'px;height:'+h+'px;background:#ddd';ins.appendChild(d);var l=window[ins.getAttribute('data-ad-onload')];if(l)l(ins)})})();`

/* [주소, 애드핏 가운데(1 · 0 · null = 세지 않음), 쿠팡 가운데(1 · 0 · null)]
   원클릭 · 캐드 고치기는 «열쇠말»(비밀번호 칸)이 보이는 동안 애드핏을 모두 접음(본인확인 · 5.3.1 — 끝 칸도) → 세지 않음 */
const 쪽들 = [
  ['/', 1, 0], ['/tools', 1, 1], ['/tools/schedule', 1, 1], ['/tools/juhyu', 1, 1], ['/tools/sanjae-hyueop', 0, 1], ['/tools/nomubi', 0, 1],
  ['/tools/ilyong-boheom', 0, 1], ['/tools/ilyong-guide', 1, 1], ['/tools/boheomryo', 1, 1], ['/tools/wonclick', null, 1], ['/tools/dxf3d', 1, 1],
  ['/tools/gps', 1, 1], ['/tools/cadfix', null, 1], ['/forms', 1, 1], ['/forms/chakgong', 1, 1], ['/forms/geonchuk-heoga-sincheong', 1, 1],
  ['/forms/o-chakgong-moeum', 1, 1], ['/guide', 1, 1], ['/guide/bid-price', 1, 1], ['/change', 1, 1], ['/change/case', 1, 1], ['/change/excel', 1, 1],
  ['/change/won', 1, 1], ['/cert', 1, 0], ['/cert/tomok-sigong-gisulsa', 1, 1], ['/cert/grade', 1, 1], ['/cad', 1, 1], ['/cad/kl', 1, 1],
  ['/how', 1, 1], ['/safety', 1, 1], ['/shareone', 1, 1], ['/naeyeok', null, 0], ['/jeoksan', 1, 1], ['/naeyeok/hado', 1, 1], ['/analysis', 1, 0],
  ['/svc/calc', 1, 0], ['/news', 1, null], ['/notice/TEST-0001', 1, 1], ['/notice/TEST-0002', 1, 0], ['/daily/2026-11-15', 1, 1], ['/daily', 1, 0],
  ['/first', 0, 0], ['/live', 0, 0],
]
const b = await chromium.launch()
for (const 기기 of ['PC', '폰']) {
  const 폰 = 기기 === '폰'
  const c = await b.newContext({ viewport: 폰 ? { width: 390, height: 844 } : { width: 1280, height: 900 }, isMobile: 폰, hasTouch: 폰, locale: 'ko-KR' })
  await c.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs|firebaseio|coupangcdn|ads-partners\.coupang|link\.coupang|example\.invalid/, (r) => r.fulfill({ status: 200, body: '' }))
  await c.route(/kakaocdn\.net|daumcdn\.net/, (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: 가짜 }))
  await c.addInitScript(() => { window.__KCM_AFIT_TEST = true; localStorage.setItem('kcm_notice_seen', '2026-10-필독'); try { sessionStorage.setItem('kcm_notice_seen', '2026-10-업체') } catch (e) {} })
  const p = await c.newPage(); let 오류 = []; p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  const 보기 = async (주소) => {
    await p.goto(B + 주소, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2600)
    /* 늦게 그리는 칸(쿠팡 큰 카드 · 애드핏)까지 — 끝까지 내렸다 올림 */
    await p.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)) } window.scrollTo(0, 0) })
    await p.waitForTimeout(900)
  }
  const 읽기 = () => p.evaluate(() => {
    const 애 = [...document.querySelectorAll('aside.afit')].map((a) => a.getAttribute('data-afit'))
    const 쿠 = [...document.querySelectorAll('aside.cpc:not(.cpc-wait)')].map((a) => ({ 자리: a.getAttribute('data-cpg-at'), 주제: a.getAttribute('data-cpc') }))
    const 중 = document.querySelector('aside.afit-mid')
    let 거리 = null, 사이 = null
    if (중) {
      const r = 중.querySelector('.afit-box').getBoundingClientRect()
      let 위 = 1e9, 아래 = 1e9
      for (const el of document.querySelectorAll('button, a, input, select, textarea, summary')) {
        if (중.contains(el)) continue
        const q = el.getBoundingClientRect(); if (!q.width || !q.height) continue
        if (getComputedStyle(el).visibility === 'hidden') continue
        if (q.right < r.left - 50 || q.left > r.right + 50) continue
        if (q.bottom <= r.top) 위 = Math.min(위, r.top - q.bottom)
        if (q.top >= r.bottom) 아래 = Math.min(아래, q.top - r.bottom)
      }
      거리 = { 위: Math.round(위), 아래: Math.round(아래) }
      const 쿠중 = document.querySelector('aside.cpc[data-cpg-at="중"]')
      if (쿠중) { const k = 쿠중.getBoundingClientRect(); 사이 = Math.round(k.top >= r.bottom ? k.top - r.bottom : r.top - k.bottom) }
    }
    return { 애, 쿠, 거리, 사이, 넘침: document.documentElement.scrollWidth - document.documentElement.clientWidth }
  })
  console.log('■ ' + 기기 + (있음 ? '' : ' — 애드핏 가운데 광고단위 번호가 아직 없음(애드핏 가운데는 안 그려야 맞음)'))
  for (const [주소, 애기대, 쿠기대] of 쪽들) {
    오류 = []
    await 보기(주소)
    const d = await 읽기()
    const 애중 = d.애.filter((x) => x === '중').length
    if (!있음) 봐(애중 === 0, `${주소} 애드핏 가운데 없음(번호 없음)`, d.애)
    else if (애기대 !== null) 봐(애중 === 애기대 && d.애.length <= 2, `${주소} 애드핏 가운데 ${애기대} · 쪽 애드핏 둘까지`, d.애)
    else 봐(애중 <= 1 && d.애.length <= 2, `${주소} 애드핏 가운데 하나 넘지 않음 · 둘까지`, d.애)
    if (애중) 봐(d.거리 && d.거리.위 >= 24 && d.거리.아래 >= 24, `${주소} 애드핏 가운데 위아래 누를 것과 24px 넘게(5.3.1)`, d.거리)
    const 쿠중 = d.쿠.filter((x) => x.자리 === '중').length
    if (쿠기대 !== null) 봐(쿠중 === 쿠기대, `${주소} 쿠팡 가운데 ${쿠기대}`, d.쿠)
    봐(new Set(d.쿠.map((x) => x.주제)).size === d.쿠.length, `${주소} 쿠팡 줄 ${d.쿠.length}개 주제가 다 다름(상품 안 겹침)`, d.쿠)
    if (애중 && 쿠중) 봐(d.사이 >= 100, `${주소} 애드핏 가운데 ↔ 쿠팡 가운데 사이 글 덩이(100px 넘게)`, d.사이)
    봐(d.넘침 <= 1, `${주소} 가로 넘침 없음`, d.넘침)
    봐(!오류.length, `${주소} 화면 오류 없음`, 오류.join(' | '))
  }
  for (const 주소 of ['/tools/tuipbi', '/tools/unpaid', '/qna']) {
    await 보기(주소)
    const d = await 읽기()
    봐(!d.애.length && !d.쿠.some((x) => x.자리 === '중'), `뺀 쪽 ${주소} — 애드핏 없음 · 쿠팡 가운데 없음`, d)
  }
  if (있음) {
    await 보기('/tools/schedule')
    await p.evaluate(() => { const a = [...document.querySelectorAll('a[href^="/tools/"]')].find((x) => /\/tools\/(?!schedule)/.test(x.getAttribute('href')) && x.offsetParent !== null && !x.closest('aside')); if (a) a.click() })
    await p.waitForTimeout(2500)
    const d = await 읽기()
    봐(d.애.filter((x) => x === '중').length <= 1 && d.쿠.filter((x) => x.자리 === '중').length <= 1, '⑦ 다른 도구로 가도 가운데 칸 · 줄 하나씩(쌓이지 않음)', d)
    await p.emulateMedia({ media: 'print' })
    const 보임 = await p.evaluate(() => [...document.querySelectorAll('aside.afit, aside.cpc')].some((a) => getComputedStyle(a).display !== 'none'))
    봐(!보임, '⑦ 인쇄에 광고(애드핏 · 쿠팡) 안 나옴')
    await p.emulateMedia({ media: 'screen' })
  }
  await c.close()
}
await b.close()
console.log(bad ? `✗ ${bad} 틀림 · ${ok} 맞음` : `✓ 모두 맞음(${ok})`)
process.exit(bad ? 1 : 0)
