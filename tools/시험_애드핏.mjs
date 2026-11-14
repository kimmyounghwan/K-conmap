/**
 * 🧪 G666 카카오 애드핏 광고 칸(애드핏칸.jsx · lib/애드핏.js) 시험 — 2026-11-13
 *   규칙만(PC 올리기에도 넣음 · 인터넷 · playwright 없이):  LANG=C.UTF-8 node tools/시험_애드핏.mjs
 *   화면까지: 구운 사이트(dist)를 띄운 뒤  LANG=C.UTF-8 node tools/시험_애드핏.mjs http://127.0.0.1:4670
 *   소장님 11-13 「맞춰서 해줘. 승인되게 준비 해줘」 · 「빈틈없이 준비해줘」 · 「도구 사용시 노출되게 해야 하잖아」 · 「이용자가 불편하지 않으면서 난 최대한 광고 노출비용을 벌 수 있어야 해」
 *   애드핏 심사는 «한 번뿐»(반려되면 k-conmap.com 다시 등록 못 함) → 운영정책(5.2 · 5.3.1 · 5.4)을 시험으로 지킴:
 *   ① 규칙: 공식 스크립트 주소 그대로 · 광고단위 넷(자리마다 다름 · 크기) · 등록한 집(k-conmap.com)에서만 · 뺀 쪽(맵톡 · 비밀번호 장부 · 미불금 서류 · 소장님만 · 광고 문의)
 *          · 판(폭 728) · 목록 자리(다른 광고 줄과 세 장 넘게 · 끝 카드 앞) · 콜백 이름(자리마다 다름) · 코드(ins + 스크립트 그대로 · 누름 셈 없음) · 인쇄 · 꾸밈 없음
 *   ② 화면(가짜 애드핏 스크립트 — 인터넷 안 부름): 폰 390 · 320 · PC 1280 · 화면 돌림(가로 1100 → 세로 390 — PC 광고가 안 들어가면 폰 광고로 한 번) — 1순위 · 공고(목록 칸 + 끝 칸) · 여러 쪽(끝 칸 하나) · 자리 미리 잡음(덜컥임 0) · 넘침 0 ·
 *          버튼 · 카드와 띄움 · 숨은 셈(보임 · 채움 · 빔 — 누름은 안 셈) · 카드를 펴도 광고를 다시 안 부름 · 쪽을 옮기면 새로
 *          · 뺀 쪽 · 없는 쪽(noindex) · 비밀번호 칸이 보이는 쪽 · 틀(iframe) 안 · 등록 안 한 집 → 안 그림 · 스크립트도 안 부름 · 광고 없음 · 못 받음 → 칸 접힘 · 인쇄 · 오류 0
 */
import fs from 'node:fs'
import { createRequire } from 'node:module'
import { 애드핏스크립트, 애드핏단위, 애드핏집, 애드핏뺀쪽, 애드핏쉼, 애드핏판, 애드핏목록자리, 애드핏콜백이름 } from '../web/src/lib/애드핏.js'
import { 목록쿠팡자리 } from '../web/src/lib/쿠팡자료.js'
const require = createRequire(import.meta.url)
const BASE = process.argv[2] || ''
const OUT = process.env.OUT || ''
let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 600))) }
const 읽기 = (p) => fs.readFileSync(new URL(p, import.meta.url), 'utf8')
const 주석뺌 = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1')

console.log('① 규칙')
ok('스크립트 — 애드핏이 준 주소 그대로(//t1.kakaocdn.net/kas/static/ba.min.js)', 애드핏스크립트 === '//t1.kakaocdn.net/kas/static/ba.min.js', 애드핏스크립트)
{
  const 단위들 = [애드핏단위.목록.폰, 애드핏단위.목록.PC, 애드핏단위.끝.폰, 애드핏단위.끝.PC]
  ok('광고단위 넷 — 코드 꼴(DAN- + 16자) · 넷 다 다름(한 쪽에 같은 단위 두 번 없음)', 단위들.every((u) => /^DAN-[A-Za-z0-9]{16}$/.test(u.id)) && new Set(단위들.map((u) => u.id)).size === 4, 단위들.map((u) => u.id))
  ok('크기 — 목록 폰 320×100 · 목록 PC 728×90 · 끝 폰 300×250 · 끝 PC 728×90 · 이름에 크기 · 자리 · 판', [[애드핏단위.목록.폰, 320, 100, '폰_목록'], [애드핏단위.목록.PC, 728, 90, 'PC_목록'], [애드핏단위.끝.폰, 300, 250, '폰_끝'], [애드핏단위.끝.PC, 728, 90, 'PC_끝']].every(([u, w, h, k]) => u.w === w && u.h === h && u.이름 === `건설맵_${k}_${w}x${h}`), 단위들)
  ok('애드핏이 준 코드 그대로(11-13 광고단위 만들기 끝 화면에서 읽은 값)', 애드핏단위.목록.폰.id === 'DAN-F1DW7yN8tc1zwJyO' && 애드핏단위.목록.PC.id === 'DAN-Ds6MpvnFZrrnM7zQ' && 애드핏단위.끝.폰.id === 'DAN-ZlYf9xVyuyHhkFZA' && 애드핏단위.끝.PC.id === 'DAN-0pyNgeQ8vp2cG3o2')
}
ok('집 — k-conmap.com · www 만 부름', 애드핏집('k-conmap.com') && 애드핏집('www.k-conmap.com'))
ok('집 — web.app · 미리보기 주소 · 내 컴퓨터 · 비슷한 이름은 안 부름(5.4 제3의 매체)', ['k-conmap.web.app', 'k-conmap--preview-ab12cd.web.app', 'k-conmap.firebaseapp.com', 'localhost', '127.0.0.1', 'evil-k-conmap.com', 'k-conmap.com.evil.com', 'xk-conmap.com', '', undefined].every((h) => !애드핏집(h)))
const 뺄 = ['/admin', '/admin/x', '/qna', '/qna/abc123', '/ad', '/my', '/tools/tuipbi', '/tools/tuipbi/v', '/tools/tuipbi/v/a/b', '/tools/risk', '/tools/equip', '/tools/unpaid', '/tools/demand-letter', '/tools/payment-order', '/tools/direct-payment', '/report/make', '/report/agency', '/jeoksan/lab']
const 달 = ['/', '/calc', '/first', '/live', '/svc/first', '/goods/live', '/analysis', '/tools', '/tools/juhyu', '/tools/ilyong-boheom', '/tools/schedule', '/tools/photo', '/forms', '/forms/hanbeol', '/forms/abc', '/guide', '/guide/x', '/cert', '/cert/a/quiz', '/how', '/naeyeok', '/report', '/jeoksan', '/jeoksan/golgo', '/change', '/notice/R26', '/corp/x', '/agency/x', '/daily', '/jobs', '/cad', '/pdf', '/adx', '/admins', '/mypage', '/qnax', '/tools/riskx', '/tools/unpaidx', '/reportx']
ok(`뺀 쪽 ${뺄.length}곳 — 맵톡 · 관리자 · 광고 문의 · 마이컨맵 · 투입비 · 장부 문 · 미불금 서류 넷 · 소장님만`, 뺄.every((p) => 애드핏쉼(p)), 뺄.filter((p) => !애드핏쉼(p)))
ok(`다는 쪽 ${달.length}곳 — 1순위 · 공고 · 도구 · 서식 · 알아보기 · 자격증 …(비슷한 이름에 속지 않음)`, 달.every((p) => !애드핏쉼(p)), 달.filter((p) => 애드핏쉼(p)))
ok('뺀 쪽 표 — 줄마다 까닭(운영정책 조 번호 또는 쓰임)', 애드핏뺀쪽.length >= 8 && 애드핏뺀쪽.every(([re, 왜]) => re instanceof RegExp && typeof 왜 === 'string' && 왜.length >= 8))
ok('판 — 칸 폭 728 넘으면 PC · 아니면 폰', 애드핏판(1180) === 'PC' && 애드핏판(728) === 'PC' && 애드핏판(727) === '폰' && 애드핏판(362) === '폰' && 애드핏판(0) === '폰' && 애드핏판(undefined) === '폰')
{
  /* 1순위(FirstBoard) · 공고(LiveBoard)와 같은 셈 — 업체 광고 칸 · 쿠팡 목록 줄 */
  const 일순위다른 = (k) => [Math.min(2, k - 1), ...(k >= 8 ? [Math.min(9, k - 1)] : []), ...(k >= 15 ? [Math.min(16, k - 1)] : []), ...목록쿠팡자리(k, [2, 9, 16])]
  const 공고다른 = (k) => [Math.min(2, k - 1), ...목록쿠팡자리(k, [Math.min(2, k - 1)])]
  ok('목록 자리 — 1순위 34장 → 열세째 카드 다음(12) · 공고 34장 → 열한째 카드 다음(10)', 애드핏목록자리(34, 일순위다른(34)) === 12 && 애드핏목록자리(34, 공고다른(34)) === 10, [애드핏목록자리(34, 일순위다른(34)), 애드핏목록자리(34, 공고다른(34))])
  const 다좋음 = Array.from({ length: 300 }, (_, k) => k + 1).every((k) => {
    for (const 다른 of [일순위다른(k), 공고다른(k)]) {
      const p = 애드핏목록자리(k, 다른)
      if (p === -1) continue
      if (!(p >= 10 && p < k - 1 && 다른.every((q) => Math.abs(p - q) >= 3))) return false
    }
    return true
  })
  ok('목록 자리 — 1 ~ 300장 어느 것이든: 열한째 카드 뒤 · 끝 카드 앞(쪽 넘김 단추와 떨어짐) · 다른 광고 줄과 세 장 넘게', 다좋음)
  ok('짧은 목록(11장 이하)은 목록 칸 없음(끝 칸만)', [0, 1, 5, 10, 11].every((k) => 애드핏목록자리(k, 일순위다른(k)) === -1 && 애드핏목록자리(k, 공고다른(k)) === -1))
}
ok('콜백 이름 — 자리마다 다름(한 쪽에 광고단위 둘 · 애드핏 Web SDK 가이드) · 영문 이름', new Set(['목록', '끝'].flatMap((z) => ['fail', 'load'].map((k) => 애드핏콜백이름(z, k)))).size === 4 && ['목록', '끝'].every((z) => /^[A-Za-z_]\w*$/.test(애드핏콜백이름(z, 'fail'))), ['목록', '끝'].map((z) => 애드핏콜백이름(z, 'fail')))
{
  const 칸 = 읽기('../web/src/애드핏칸.jsx'), 코 = 주석뺌(칸)
  ok('코드 — ins(kakao_ad_area · display none · data-ad-unit · width · height) + 스크립트(async · 공식 주소) 그대로 넣음', /ins\.className = 'kakao_ad_area'/.test(코) && /ins\.style\.display = 'none'/.test(코) && /'data-ad-unit', u\.id/.test(코) && /'data-ad-width', String\(u\.w\)/.test(코) && /'data-ad-height', String\(u\.h\)/.test(코) && /s\.async = true/.test(코) && /s\.src = 애드핏스크립트/.test(코))
  ok('코드 — NO-AD 콜백(data-ad-onfail) · 받음(data-ad-onload) · 스크립트 못 받음(onerror) → 접음', /'data-ad-onfail', 실패/.test(코) && /'data-ad-onload', 받음/.test(코) && /s\.onerror = 접기/.test(코))
  ok('코드 — 틀(iframe) 안 · 등록 안 한 집 · 뺀 쪽은 안 그림 · 비밀번호 칸 · noindex 쪽은 넣기 전에 접음', /window\.self !== window\.top/.test(코) && /애드핏집\(window\.location\.hostname\)/.test(코) && /애드핏쉼\(pathname\)/.test(코) && /비번칸\(\) \|\| 숨긴쪽\(\)/.test(코))
  ok('코드 — «누름» 은 세지 않음(5.4 클릭한 방문자 정보 수집 금지) · 창 blur 엿보기 없음', !/누름/.test(코) && !/'blur'/.test(코) && !/addEventListener\('click'/.test(코))
  ok('코드 — 숨은 셈 셋(|애드핏보임| · |애드핏채움| · |애드핏빔| — 마디 둘)', /'\|애드핏보임\|' \+ 셈이름/.test(코) && /'\|애드핏채움\|' \+ 셈이름/.test(코) && /'\|애드핏빔\|' \+ 셈이름/.test(코))
  ok('코드 — 인쇄에 안 찍힘(no-print) · «광고» 표시', /className=\{'afit no-print/.test(코) && />광고<\/div>/.test(코))
  const 앱 = 주석뺌(읽기('../web/src/App.jsx')), 일 = 주석뺌(읽기('../web/src/pages/FirstBoard.jsx')), 공 = 주석뺌(읽기('../web/src/pages/LiveBoard.jsx'))
  const 끝자리 = 앱.indexOf('<애드핏칸 key={pathname} 자리="끝" />')
  ok('자리 — App.jsx 끝 칸 하나(쪽마다 새로 key=주소) · 씀-뒤 다음 · 쿠팡 바닥 줄 · 바닥글 앞', (앱.match(/<애드핏칸 /g) || []).length === 1 && 끝자리 > 앱.indexOf('id="씀-뒤"') && 끝자리 < 앱.indexOf('<쿠팡카드줄 자리="바닥" />') && 끝자리 < 앱.indexOf('<footer'))
  ok('자리 — 1순위 · 공고 목록 칸 하나씩(카드 묶음 밖 · 따로 key — 목록을 걸러도 다시 안 부름)', [일, 공].every((s) => (s.match(/<애드핏칸 /g) || []).length === 1 && s.includes('줄들.splice(애자리 + 1, 0, <애드핏칸 key="afit-list" 자리="목록" />)')))
  const 그 = 읽기('../web/src/styles.css'), g0 = 그.slice(그.indexOf('G666 카카오 애드핏 광고 칸'))
  /* 🩹 G681(11-14) G666 덩이만 봄 — 전엔 «파일 끝까지» 잘라 봐서 뒤에 붙은 다른 G 덩이(G679 보기만 인쇄 안내 · G681 노무비 종이)의 테두리 · 바탕을 잡아 G679 부터 늘 틀렸음 */
  const 다음G = g0.search(/\n\/\*[^\n]*\bG(?!666\b)\d{3}/), g = 다음G > 0 ? g0.slice(0, 다음G) : g0
  ok('꾸밈 — 테두리 · 바탕 · 움직임 · 붙박이(fixed · sticky) 없음 · 인쇄 숨김(5.3.1 «색상 및 애니메이션 등으로 광고 영역을 부각» 금지)', g.length > 50 && !/border\s*:|background|animation|transition|position\s*:\s*(fixed|sticky)/.test(g.replace(/\/\*[\s\S]*?\*\//g, '')) && /@media print \{ \.afit \{ display: none !important; \} \}/.test(g))
  ok('화면 글 — «클로드» · «무료» 없음(애드핏칸.jsx 화면 글)', !/클로드|무료/.test(코))
  ok('광고 칸을 가린 채 두지 않음 — .afit · .afit-box 를 visibility · opacity 로 숨기는 규칙 없음(숨긴 광고 = 부정 노출 · 5.4) · 접을 땐 칸을 뺌', !/\.afit(-box|-h)?\s*\{[^}]*(visibility\s*:\s*hidden|opacity\s*:\s*0)/.test(그.replace(/\/\*[\s\S]*?\*\//g, '')) && !/afit[^'"\n]*\.style\.(visibility|opacity)/.test(코) && /if \(끔\) return null/.test(코))
  ok('광고가 보이는 동안 떠 있는 «+» 찍기 단추 · 인사 쪽지만 숨김(html.afit-in — 광고 칸이 아니라 그 둘)', /html\.afit-in :is\(\.cam-tab, \.insa\) \{ opacity: 0 !important; pointer-events: none !important; \}/.test(그))
}

if (BASE) {
  const { chromium } = require('playwright')
  const 공지판 = (읽기('../web/src/감사공지.jsx').match(/const 판 = '([^']+)'/) || [])[1] || ''
  const UA폰 = 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
  const UAPC = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
  const 오늘 = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10)
  const 마감 = (d) => new Date(Date.now() + d * 86400e3 + 9 * 3600e3).toISOString().slice(0, 10) + ' 10:00:00'
  const meta = (k) => ({ built: 오늘 + ' 06:00', chunk: 500, rankChunk: 50, con: { n: k, parts: 1, from: '2026-09-15', to: 오늘 }, serv: { n: 0, parts: 0 } })
  const 일순위 = (k) => Array.from({ length: k }, (_, i) => ({ no: `R00TEST8${String(i).padStart(4, '0')}`, ord: '000', name: `가상 새솔지구 정비공사 ${i + 1}차`, inst: '가상군', dt: 오늘 + ' 11:00:00', amt: 523456000, rate: 89.912, np: 37, nrank: 37,
    base: 583000000, sAmt: 0, lo: -3, hi: 3, llr: 89.745, aval: 0, ayn: 'N', win: '가상건설1(주)', bno: '1238112345', ceo: '홍길동' }))
  const 공고 = (k) => Array.from({ length: k }, (_, i) => ({ no: `R00TEST9${String(i).padStart(4, '0')}`, ord: '000', name: `가상 들말 배수로 정비공사 ${i + 1}`, inst: '가상시', dt: 오늘 + ' 09:00:00', close: 마감(i % 4 + 1), base: 244600000, est: 222363636, lo: -3, hi: 3, llr: 89.745, lic: ['토목공사업/0001'], aval: 0, ayn: 'N', ptot: 15, pdrw: 4, url: '' }))
  /* 가짜 애드핏 스크립트 — 아직 안 그린 ins 마다 크기만큼 회색 칸을 그리고 data-ad-onload 를 부름(모드 fail 이면 data-ad-onfail) · 부른 수를 셈 */
  const 가짜스크립트 = `(function(){var m=window.__afitMode||'ok';window.__afitRuns=(window.__afitRuns||0)+1;window.__afitIns=window.__afitIns||[];
document.querySelectorAll('ins.kakao_ad_area').forEach(function(ins){if(ins.getAttribute('data-test-done'))return;ins.setAttribute('data-test-done','1');window.__afitIns.push(ins.getAttribute('data-ad-unit'));
if(m==='fail'){var f=window[ins.getAttribute('data-ad-onfail')];if(f)f(ins);return}
var w=+ins.getAttribute('data-ad-width'),h=+ins.getAttribute('data-ad-height');ins.style.display='block';var d=document.createElement('div');d.className='test-ad';d.style.cssText='width:'+w+'px;height:'+h+'px;background:#e5e7eb;color:#374151;font:600 13px/1.4 sans-serif;display:flex;align-items:center;justify-content:center;text-align:center';
d.textContent='카카오 광고 자리 '+w+'×'+h+' (실제 광고는 올린 뒤 카카오가 채움)';ins.appendChild(d);var l=window[ins.getAttribute('data-ad-onload')];if(l)l(ins)})})();`
  const b = await chromium.launch()
  const 셈들 = []
  async function 새쪽(w, h, { 폰 = true, 몇장 = 34, 시험집 = true, 모드 = 'ok', 스크립트 = 'ok' } = {}) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, userAgent: 폰 ? UA폰 : UAPC, deviceScaleFactor: OUT ? 2 : 1 })
    const 부름 = []
    await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
    await ctx.route(/firebaseio\.com|firebasedatabase\.app/, (r) => { const u = decodeURIComponent(r.request().url()); if (/애드핏/.test(u) && r.request().method() !== 'GET') 셈들.push(u.replace(/^.*?\.(com|app)\//, '')); r.fulfill({ status: 200, contentType: 'application/json', body: r.request().method() === 'GET' ? 'null' : (r.request().postData() || 'null') }) })
    await ctx.route(/kakaocdn\.net|daumcdn\.net|kakao\.com/, (r) => { 부름.push(r.request().url()); if (스크립트 === '막힘') return r.fulfill({ status: 404, body: '' }); r.fulfill({ status: 200, contentType: 'text/javascript', body: 가짜스크립트 }) })
    await ctx.route(/coupangcdn\.com/, (r) => r.fulfill({ status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>' }))
    await ctx.route(/ads-partners\.coupang\.com|link\.coupang\.com/, (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '' }))
    await ctx.route('**/data/board/first.json*', (r) => r.fulfill({ json: meta(몇장) }))
    await ctx.route('**/data/board/first-con-0.json*', (r) => r.fulfill({ json: 일순위(몇장) }))
    await ctx.route('**/data/board/live.json*', (r) => r.fulfill({ json: { ...meta(몇장), con: { n: 몇장, parts: 1, from: 오늘, to: 오늘 } } }))
    await ctx.route('**/data/board/live-con-0.json*', (r) => r.fulfill({ json: 공고(몇장) }))
    await ctx.route('**/data/overview.json*', (r) => r.fulfill({ json: { rows: 168842, agencies: 5066, corps: 72494 } }))
    await ctx.route('**/data/ext/meta.json*', (r) => r.fulfill({ json: { n: 0, first: 0 } }))
    await ctx.addInitScript(() => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) { /* 없음 */ } })
    await ctx.addInitScript(() => { try { Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false }) } catch (e) { /* 없음 */ } })
    await ctx.addInitScript((판) => { try { sessionStorage.setItem('kcm_notice_seen', 판) } catch (e) { /* 없음 */ } }, 공지판)
    if (시험집) await ctx.addInitScript(() => { window.__KCM_AFIT_TEST = true })
    await ctx.addInitScript((m) => { window.__afitMode = m }, 모드)
    const p = await ctx.newPage()
    const 오류 = []
    p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
    p.on('dialog', (d) => d.dismiss())
    return { ctx, p, 오류, 부름 }
  }
  const 기다림 = async (f, ms = 6000) => { const t = Date.now(); while (Date.now() - t < ms) { if (await f()) return true; await new Promise((r) => setTimeout(r, 150)) } return false }
  const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  const 셈수 = (종류, 이름) => 셈들.filter((u) => u.includes(종류) && u.includes(이름)).length
  /* 칸 하나 재기 — 크기 · 단위 · ins 꼴 · 앞뒤와 띈 거리 · 앞 카드 번호 · 다른 광고 줄과 카드 수 */
  const 칸들 = (p) => p.evaluate(() => {
    const 카드들 = [...document.querySelectorAll('main .notice')]
    const 광고줄 = [...document.querySelectorAll('main aside.adc, main aside.cpc, main aside.cpg')]
    /* 정말 보이는 것만 — 접힌 칸(overflow 로 잘림) 안 · 떠 있는 것(fixed — 스크롤하며 지나감 · 찍기 단추는 광고가 보이면 숨김)은 뺌 */
    const 보임 = (e) => {
      const q = e.getBoundingClientRect()
      if (!(q.height > 0 && q.width > 0) || getComputedStyle(e).visibility === 'hidden') return false
      for (let y = e; y && y !== document.body; y = y.parentElement) {
        const cs = getComputedStyle(y)
        if (cs.position === 'fixed' || cs.display === 'none') return false
        if (y.tagName === 'DETAILS' && !y.open) { const sm = e.closest('summary'); if (!(sm && sm.parentElement === y)) return false }   /* 접힌 details 안(그려지지 않음 — 크롬은 자리만 셈) */
        if (y !== e && cs.overflow !== 'visible') { const w = y.getBoundingClientRect(); if (q.bottom <= w.top || q.top >= w.bottom || q.right <= w.left || q.left >= w.right) return false }
      }
      return true
    }
    const 누를것 = [...document.querySelectorAll('main a, main button, main input, main select, main textarea, main .notice.tap, main summary')]
      .filter((e) => !e.closest('aside.afit') && 보임(e))
    return [...document.querySelectorAll('aside.afit')].map((a) => {
      const 상 = a.querySelector('.afit-box'), r = 상.getBoundingClientRect(), ar = a.getBoundingClientRect()
      const ins = 상.querySelector('ins.kakao_ad_area'), s = 상.querySelector('script')
      let 앞 = a.previousElementSibling; while (앞 && !앞.matches('.notice')) 앞 = 앞.previousElementSibling
      const 앞카드 = 앞 ? 카드들.indexOf(앞) : -1
      const 줄거리 = 광고줄.map((x) => { const i = (() => { let y = x.previousElementSibling; while (y && !y.matches('.notice')) y = y.previousElementSibling; return y ? 카드들.indexOf(y) : -1 })(); return 앞카드 >= 0 && i >= 0 ? Math.abs(i - 앞카드) : 99 })
      const 가까움 = Math.min(999, ...누를것.map((e) => { const q = e.getBoundingClientRect(); if (q.right < r.left || q.left > r.right) return 999; return q.bottom <= r.top ? r.top - q.bottom : (q.top >= r.bottom ? q.top - r.bottom : -1) }))
      return { 자리: a.dataset.afit, 판: a.dataset.afitPan, 단위: a.dataset.afitUnit, 채움: a.classList.contains('on'), w: Math.round(r.width), h: Math.round(r.height), 왼: Math.round(r.left), 오: Math.round(r.right), 위: Math.round(r.top + scrollY), 칸높이: Math.round(ar.height),
        딱지: (a.querySelector('.afit-h') || {}).textContent, 딱지색: getComputedStyle(a.querySelector('.afit-h')).color, 테두리: getComputedStyle(a).borderTopWidth, 바탕: getComputedStyle(a).backgroundColor,
        ins: ins ? { 꼴: ins.className, unit: ins.getAttribute('data-ad-unit'), w: ins.getAttribute('data-ad-width'), h: ins.getAttribute('data-ad-height'), fail: ins.getAttribute('data-ad-onfail'), load: ins.getAttribute('data-ad-onload') } : null,
        스크립트: s ? { src: s.getAttribute('src'), async: s.async } : null, 앞카드, 줄거리: 줄거리.length ? Math.min(...줄거리) : 99, 가까움,
        씀밖: (() => { const t = document.getElementById('씀-뒤'); return !t || !!(t.compareDocumentPosition(a) & Node.DOCUMENT_POSITION_FOLLOWING) })(),
        바닥앞: (() => { const c = document.querySelector('aside.cpc[data-cpg-n="바닥"]') || document.querySelector('footer.footer'); return !!(a.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING) })() }
    })
  })
  const 꼴맞음 = (z, 단위) => z.단위 === 단위.id && z.w === 단위.w && z.h === 단위.h && z.ins && z.ins.꼴 === 'kakao_ad_area' && z.ins.unit === 단위.id && z.ins.w === String(단위.w) && z.ins.h === String(단위.h)
    && z.스크립트 && z.스크립트.src === 애드핏스크립트 && z.스크립트.async === true && z.ins.fail === 애드핏콜백이름(z.자리, 'fail') && z.ins.load === 애드핏콜백이름(z.자리, 'load')

  for (const [곳, 목록앞] of [['/first', 12], ['/live', 10]]) {
    console.log(`② 폰 390 — ${곳} 34장(목록 칸 + 끝 칸)`)
    const { ctx, p, 오류, 부름 } = await 새쪽(390, 844)
    const 셈앞 = 셈들.length
    const 이번셈 = (종류, 이름) => 셈들.slice(셈앞).filter((u) => u.includes(종류) && u.includes(이름)).length
    await p.goto(BASE + 곳, { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('main .notice', { timeout: 15000 })
    await 기다림(async () => (await p.evaluate(() => document.querySelectorAll('aside.afit.on').length)) === 2, 8000)
    const 둘 = await 칸들(p)
    const 목 = 둘.find((z) => z.자리 === '목록'), 끝 = 둘.find((z) => z.자리 === '끝')
    ok(`애드핏 칸 둘(목록 · 끝 — 한 쪽 4개 넘음 금지 안쪽) · 광고가 그려짐`, 둘.length === 2 && !!목 && !!끝 && 목.채움 && 끝.채움, 둘.map((z) => [z.자리, z.채움]))
    ok(`목록 칸 — ${목록앞 + 1}째 카드 다음 · 다른 광고 줄(업체 광고 칸 · 쿠팡 목록 줄)과 세 장 넘게`, 목 && 목.앞카드 === 목록앞 && 목.줄거리 >= 3, 목 && [목.앞카드, 목.줄거리])
    ok('목록 칸 — 폰 320×100 단위 · 애드핏 코드 그대로(ins + async 스크립트 · 콜백 이름)', 목 && 꼴맞음(목, 애드핏단위.목록.폰), 목)
    ok('끝 칸 — 폰 300×250 단위 · 씀-뒤 다음(도구 «써 본 횟수» 밖) · 쿠팡 바닥 줄 · 바닥글 앞', 끝 && 꼴맞음(끝, 애드핏단위.끝.폰) && 끝.씀밖 && 끝.바닥앞, 끝)
    ok('«광고» 작은 회색 글 · 테두리 · 바탕 없음(부각 금지)', 둘.every((z) => z.딱지 === '광고' && z.테두리 === '0px' && /rgba\(0, 0, 0, 0\)|transparent/.test(z.바탕)), 둘.map((z) => [z.딱지, z.딱지색, z.테두리, z.바탕]))
    ok('누를 것(카드 · 링크 · 단추)과 광고 사이 12px 넘게 띄움(5.3.1 실수로 누름 금지)', 둘.every((z) => z.가까움 >= 12), 둘.map((z) => z.가까움))
    ok('쪽 넘침 0 · 광고가 화면 안(왼 ≥ 0 · 오 ≤ 390)', await 넘침(p) <= 0 && 둘.every((z) => z.왼 >= 0 && z.오 <= 390), [await 넘침(p), 둘.map((z) => [z.왼, z.오])])
    ok('스크립트를 부른 것 = 칸 수(2) · 다른 집은 안 부름', 부름.length === 2 && 부름.every((u) => u.includes('t1.kakaocdn.net/kas/static/ba.min.js')), 부름)
    const 찍기 = () => p.evaluate(() => { const t = document.querySelector('.cam-tab'); return t ? { 투명: getComputedStyle(t).opacity, 누름: getComputedStyle(t).pointerEvents, 표: document.documentElement.classList.contains('afit-in') } : null })
    await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(400)
    const 찍기위 = await 찍기()
    await p.evaluate(() => document.querySelector('aside.afit[data-afit="목록"]').scrollIntoView({ block: 'center' }))
    await 기다림(() => 이번셈('|애드핏보임|', '목록-폰') > 0)
    const 찍기광고 = await 찍기()
    ok('떠 있는 «+» 찍기 단추 — 광고가 안 보일 땐 보임 · 광고가 화면에 들어오면 숨김(투명 · 못 누름)', 찍기위 && 찍기위.투명 === '1' && !찍기위.표 && 찍기광고 && 찍기광고.투명 === '0' && 찍기광고.누름 === 'none' && 찍기광고.표, [찍기위, 찍기광고])
    await p.evaluate(() => document.querySelector('aside.afit[data-afit="끝"]').scrollIntoView({ block: 'center' }))
    await 기다림(() => 이번셈('|애드핏보임|', '끝-폰') > 0)
    ok('숨은 셈 — 채움 한 번씩(목록-폰 · 끝-폰) · 보임 한 번씩', 이번셈('|애드핏채움|', '목록-폰') === 1 && 이번셈('|애드핏채움|', '끝-폰') === 1 && 이번셈('|애드핏보임|', '목록-폰') === 1 && 이번셈('|애드핏보임|', '끝-폰') === 1, 셈들.slice(셈앞))
    const 앞런 = await p.evaluate(() => window.__afitIns.length)
    await p.click('main .notice.tap >> nth=0'); await p.waitForTimeout(600)
    await p.click('main .notice.tap >> nth=0'); await p.waitForTimeout(600)
    const 칸2 = await 칸들(p)
    ok('카드를 펴고 접어도(목록이 다시 그려져도) 광고를 다시 부르지 않음 · 칸 그대로', await p.evaluate(() => window.__afitIns.length) === 앞런 && 칸2.length === 2 && 칸2.every((z) => z.채움), [앞런, await p.evaluate(() => window.__afitIns.length)])
    await p.click('aside.afit[data-afit="끝"] .test-ad'); await p.waitForTimeout(500)
    ok('광고를 눌러도 우리 쪽은 아무것도 안 셈(누름 셈 없음)', !셈들.some((u) => /애드핏누름|애드핏클릭/.test(u)), 셈들)
    if (OUT) {
      await p.addStyleTag({ content: '.insa{display:none!important} .footer-me{visibility:hidden}' })
      await p.evaluate(() => document.querySelector('aside.afit[data-afit="목록"]').scrollIntoView({ block: 'center' })); await p.waitForTimeout(400)
      await p.screenshot({ path: `${OUT}/애드핏_폰390${곳.replace('/', '_')}_목록.png` })
      await p.evaluate(() => document.querySelector('aside.afit[data-afit="끝"]').scrollIntoView({ block: 'center' })); await p.waitForTimeout(400)
      await p.screenshot({ path: `${OUT}/애드핏_폰390${곳.replace('/', '_')}_끝.png` })
    }
    ok('오류 0', !오류.length, 오류)
    await ctx.close()
  }

  console.log('② 폰 320 — /first (본문 292 · 광고 320 · 300 이 화면 안)')
  {
    const { ctx, p, 오류 } = await 새쪽(320, 640)
    await p.goto(BASE + '/first', { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('main .notice', { timeout: 15000 })
    await 기다림(async () => (await p.evaluate(() => document.querySelectorAll('aside.afit.on').length)) === 2, 8000)
    const 둘 = await 칸들(p)
    ok('목록 320 · 끝 300 — 화면 안(0 ~ 320) · 가운데 · 쪽 넘침 0', 둘.length === 2 && 둘.every((z) => z.왼 >= 0 && z.오 <= 320 && Math.abs((z.왼 + z.오) / 2 - 160) <= 1) && await 넘침(p) <= 0, [둘.map((z) => [z.자리, z.w, z.왼, z.오]), await 넘침(p)])
    ok('오류 0', !오류.length, 오류)
    await ctx.close()
  }

  console.log('② PC 1280 — /first · /live (728×90)')
  for (const 곳 of ['/first', '/live']) {
    const { ctx, p, 오류 } = await 새쪽(1280, 900, { 폰: false })
    await p.goto(BASE + 곳, { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('main .notice', { timeout: 15000 })
    await 기다림(async () => (await p.evaluate(() => document.querySelectorAll('aside.afit.on').length)) === 2, 8000)
    const 둘 = await 칸들(p)
    const 목 = 둘.find((z) => z.자리 === '목록'), 끝 = 둘.find((z) => z.자리 === '끝')
    ok(`${곳} PC — 목록 728×90(PC 목록 단위) · 끝 728×90(PC 끝 단위) · 넘침 0`, 목 && 끝 && 꼴맞음(목, 애드핏단위.목록.PC) && 꼴맞음(끝, 애드핏단위.끝.PC) && await 넘침(p) <= 0, 둘)
    ok(`${곳} PC — 누를 것과 12px 넘게`, 둘.every((z) => z.가까움 >= 12), 둘.map((z) => z.가까움))
    if (OUT && 곳 === '/first') {
      await p.addStyleTag({ content: '.insa{display:none!important} .footer-me{visibility:hidden}' })
      await p.evaluate(() => document.querySelector('aside.afit[data-afit="목록"]').scrollIntoView({ block: 'center' })); await p.waitForTimeout(400)
      await p.screenshot({ path: `${OUT}/애드핏_PC1280_first_목록.png` })
      await p.evaluate(() => document.querySelector('aside.afit[data-afit="끝"]').scrollIntoView({ block: 'center' })); await p.waitForTimeout(400)
      await p.screenshot({ path: `${OUT}/애드핏_PC1280_first_끝.png` })
    }
    ok('오류 0', !오류.length, 오류)
    await ctx.close()
  }

  console.log('② 화면을 돌림(가로 → 세로) — PC 광고(728)가 안 들어가면 폰 광고로 한 번 바꿈(화면 밖으로 안 넘침)')
  {
    const { ctx, p, 오류 } = await 새쪽(1100, 700)
    await p.goto(BASE + '/first', { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('main .notice', { timeout: 15000 })
    await 기다림(async () => (await p.evaluate(() => document.querySelectorAll('aside.afit.on').length)) === 2, 8000)
    const 전 = await p.evaluate(() => [...document.querySelectorAll('aside.afit')].map((a) => a.getAttribute('data-afit-pan')))
    ok('가로(1100) — PC 광고 둘(목록 · 끝)', 전.length === 2 && 전.every((x) => x === 'PC'), 전)
    await p.setViewportSize({ width: 390, height: 844 })
    await 기다림(async () => (await p.evaluate(() => [...document.querySelectorAll('aside.afit.on')].filter((a) => a.getAttribute('data-afit-pan') === '폰').length)) === 2, 8000)
    const 둘 = await 칸들(p)
    const 목 = 둘.find((z) => z.자리 === '목록'), 끝 = 둘.find((z) => z.자리 === '끝')
    ok('세로(390)로 돌림 — 폰 광고로 바뀜(목록 320×100 · 끝 300×250) · 넘침 0', 목 && 끝 && 꼴맞음(목, 애드핏단위.목록.폰) && 꼴맞음(끝, 애드핏단위.끝.폰) && await 넘침(p) <= 0, 둘)
    ok('돌린 뒤 칸마다 광고(ins) 하나 — 옛 PC 광고는 지움', await p.evaluate(() => [...document.querySelectorAll('aside.afit')].every((a) => a.querySelectorAll('ins.kakao_ad_area').length === 1)))
    await p.setViewportSize({ width: 1100, height: 700 }); await p.waitForTimeout(1200)
    ok('다시 가로로 — 폰 광고 그대로(다시 안 부름 · 폰 광고는 어디에나 들어감)', await p.evaluate(() => [...document.querySelectorAll('aside.afit')].every((a) => a.getAttribute('data-afit-pan') === '폰' && a.querySelectorAll('ins.kakao_ad_area').length === 1)))
    ok('오류 0', !오류.length, 오류)
    await ctx.close()
  }

  console.log('② 폰 390 — 여러 쪽(끝 칸 하나 · 자리 미리 잡음 · 쪽을 옮기면 새로)')
  {
    const { ctx, p, 오류, 부름 } = await 새쪽(390, 844)
    const 쪽들 = ['/', '/tools', '/tools/juhyu', '/tools/ilyong-boheom', '/forms', '/guide', '/cert', '/how', '/naeyeok', '/jeoksan']
    const 결과 = []
    for (const 쪽 of 쪽들) {
      await p.goto(BASE + 쪽, { waitUntil: 'domcontentloaded' })
      await p.waitForSelector('footer.footer', { timeout: 15000 })
      await p.waitForTimeout(150)
      const 먼저 = await 칸들(p)   /* 스크립트 넣기 전(0.4초 안) — 자리만 잡혀 있어야 */
      await 기다림(async () => (await p.evaluate(() => document.querySelectorAll('aside.afit.on').length)) >= 1, 6000)
      const 뒤 = await 칸들(p)
      결과.push({ 쪽, 수: 뒤.length, 꼴: 뒤[0] && 꼴맞음(뒤[0], 애드핏단위.끝.폰), 자리: 뒤[0] && 뒤[0].자리, 미리: 먼저.length === 1 ? [먼저[0].칸높이, 뒤[0] && 뒤[0].칸높이] : 먼저.length, 씀밖: 뒤[0] && 뒤[0].씀밖, 바닥앞: 뒤[0] && 뒤[0].바닥앞, 가까움: 뒤[0] && 뒤[0].가까움, 넘침: await 넘침(p) })
    }
    ok(`쪽 ${쪽들.length}곳 — 끝 칸 하나씩(폰 300×250 · 코드 그대로)`, 결과.every((x) => x.수 === 1 && x.꼴 && x.자리 === '끝'), 결과.map((x) => [x.쪽, x.수, x.꼴]))
    ok('자리 미리 잡음 — 광고가 오기 전과 뒤 칸 높이 같음(덜컥임 0 · 5.3.1 자리 고정 · 지연 로드)', 결과.every((x) => Array.isArray(x.미리) && x.미리[0] === x.미리[1] && x.미리[0] >= 250), 결과.map((x) => [x.쪽, x.미리]))
    ok('씀-뒤 다음 · 쿠팡 바닥 줄 · 바닥글 앞 · 누를 것과 12px 넘게 · 넘침 0', 결과.every((x) => x.씀밖 && x.바닥앞 && x.가까움 >= 12 && x.넘침 <= 0), 결과.map((x) => [x.쪽, x.가까움, x.넘침]))
    ok('쪽을 옮길 때마다 스크립트를 한 번씩(쪽마다 새 광고 · 겹쳐 부르지 않음)', 부름.length === 쪽들.length, 부름.length)
    /* 안에서 옮기기(Link) — 쪽마다 칸 하나 · 앞 쪽 광고는 사라짐 */
    await p.goto(BASE + '/how', { waitUntil: 'domcontentloaded' }); await p.waitForSelector('aside.afit.on', { timeout: 8000 })
    await p.click('footer a[href="/guide"]'); await p.waitForURL(/\/guide$/, { timeout: 10000 })
    await 기다림(async () => (await p.evaluate(() => document.querySelectorAll('aside.afit.on').length)) === 1, 6000)
    ok('사이트 안에서 쪽을 옮겨도 칸 하나(ins 하나) · 새로 그림', await p.evaluate(() => document.querySelectorAll('aside.afit').length === 1 && document.querySelectorAll('ins.kakao_ad_area').length === 1))
    if (OUT) {
      await p.goto(BASE + '/tools/juhyu', { waitUntil: 'domcontentloaded' }); await p.waitForSelector('aside.afit.on', { timeout: 8000 })
      await p.addStyleTag({ content: '.insa{display:none!important} .footer-me{visibility:hidden}' })
      await p.evaluate(() => document.querySelector('aside.afit').scrollIntoView({ block: 'center' })); await p.waitForTimeout(400)
      await p.screenshot({ path: `${OUT}/애드핏_폰390_도구_끝.png` })
    }
    ok('오류 0', !오류.length, 오류)
    await ctx.close()
  }

  console.log('② 안 그리는 곳 — 뺀 쪽 · 없는 쪽 · 비밀번호 칸 · 틀 안 · 등록 안 한 집')
  {
    const { ctx, p, 오류, 부름 } = await 새쪽(390, 844)
    const 안 = []
    for (const 쪽 of ['/qna', '/admin', '/ad', '/my', '/tools/tuipbi', '/tools/risk', '/tools/equip', '/tools/unpaid', '/tools/demand-letter', '/tools/payment-order', '/tools/direct-payment', '/report/make', '/jeoksan/lab', '/없는쪽-zz/qq']) {
      await p.goto(BASE + encodeURI(쪽), { waitUntil: 'domcontentloaded' })
      await p.waitForSelector('footer.footer', { timeout: 15000 }); await p.waitForTimeout(900)
      안.push([쪽, await p.evaluate(() => document.querySelectorAll('aside.afit, ins.kakao_ad_area').length)])
    }
    ok('뺀 쪽 13곳 + 없는 쪽(noindex) — 칸 · ins 없음', 안.every(([, k]) => k === 0), 안)
    ok('그 쪽들에선 애드핏 스크립트를 한 번도 안 부름', 부름.length === 0, 부름)
    /* 비밀번호 칸이 «보이는» 쪽 — 뺀 쪽 표에 없어도 접음(본인확인 · 입력 중) */
    const 비번쪽 = []
    for (const 쪽 of ['/tools/esc', '/tools/anjeon', '/tools/yuhae', '/tools/wonclick', '/tools/jungcheo', '/tools/colorplan', '/tools/cadfix', '/tools/hado-docs', '/tools/photo-live', '/tools/sigong', '/tools/nomubi', '/tools/ilbo', '/tools/sonik', '/tools/gyeonjeok', '/tools/jimyeong', '/tools/sanan', '/tools/boheom-jeongsan']) {
      await p.goto(BASE + 쪽, { waitUntil: 'domcontentloaded' })
      await p.waitForSelector('footer.footer', { timeout: 15000 }); await p.waitForTimeout(1300)
      비번쪽.push(await p.evaluate((쪽) => ({ 쪽, 비번: [...document.querySelectorAll('main input[type="password"]')].some((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 }), 칸: document.querySelectorAll('aside.afit').length, ins: document.querySelectorAll('ins.kakao_ad_area').length }), 쪽))
    }
    ok('비밀번호 칸이 보이는 쪽엔 칸 · ins 없음 · 안 보이는 쪽엔 끝 칸 하나', 비번쪽.every((x) => (x.비번 ? x.칸 === 0 && x.ins === 0 : x.칸 === 1 && x.ins === 1)), 비번쪽)
    console.log('    (비밀번호 칸이 보인 쪽: ' + (비번쪽.filter((x) => x.비번).map((x) => x.쪽).join(' · ') || '없음') + ')')
    /* 틀(iframe) 안 — 우리 확인 꾸러미처럼 같은 집 iframe 에 띄우면 안 그림(5.4 아이프레임 안 호출 금지) */
    await p.goto(BASE + '/how', { waitUntil: 'domcontentloaded' }); await p.waitForSelector('aside.afit.on', { timeout: 8000 })
    const 앞부름 = 부름.length
    await p.evaluate((u) => { const f = document.createElement('iframe'); f.id = 'tt'; f.style.cssText = 'width:390px;height:800px'; f.src = u; document.body.appendChild(f) }, BASE + '/first')
    await p.waitForTimeout(3500)
    const 틀안 = await p.evaluate(() => { const d = document.getElementById('tt').contentDocument; return { 카드: d.querySelectorAll('.notice').length, 칸: d.querySelectorAll('aside.afit, ins.kakao_ad_area').length } })
    ok('틀(iframe) 안 — 쪽은 뜨지만 애드핏 칸 · ins 없음 · 스크립트 안 부름', 틀안.카드 > 0 && 틀안.칸 === 0 && 부름.length === 앞부름, [틀안, 부름.length - 앞부름])
    /* 광고가 보이던 쪽에서 뺀 쪽(맵톡)으로 옮기면 — 칸이 사라지고 «+» 찍기 단추도 다시 보임 */
    await p.goto(BASE + '/how', { waitUntil: 'domcontentloaded' }); await p.waitForSelector('aside.afit.on', { timeout: 8000 })
    await p.evaluate(() => document.querySelector('aside.afit').scrollIntoView({ block: 'center' })); await p.waitForTimeout(500)
    const 전 = await p.evaluate(() => document.documentElement.classList.contains('afit-in'))
    await p.click('nav.tabbar a[href="/qna"]'); await p.waitForURL(/\/qna$/, { timeout: 10000 }); await p.waitForTimeout(900)
    const 후 = await p.evaluate(() => ({ 표: document.documentElement.classList.contains('afit-in'), 칸: document.querySelectorAll('aside.afit').length, 찍기: (() => { const t = document.querySelector('.cam-tab'); return t ? getComputedStyle(t).opacity : 'none' })() }))
    ok('광고가 보이던 쪽 → 맵톡(뺀 쪽)으로 옮기면 칸 없음 · «+» 찍기 단추 다시 보임', 전 === true && 후.표 === false && 후.칸 === 0 && 후.찍기 === '1', [전, 후])
    ok('오류 0', !오류.length, 오류)
    await ctx.close()
  }
  {
    const { ctx, p, 오류, 부름 } = await 새쪽(390, 844, { 시험집: false })
    for (const 쪽 of ['/first', '/', '/tools/juhyu']) { await p.goto(BASE + 쪽, { waitUntil: 'domcontentloaded' }); await p.waitForSelector('footer.footer', { timeout: 15000 }); await p.waitForTimeout(900) }
    ok('등록 안 한 집(여기 127.0.0.1 — 미리보기 주소 · 내 컴퓨터와 같음) — 칸 없음 · 스크립트 안 부름', (await p.evaluate(() => document.querySelectorAll('aside.afit').length)) === 0 && 부름.length === 0, 부름)
    ok('오류 0', !오류.length, 오류)
    await ctx.close()
  }

  console.log('② 광고 없음 · 못 받음 · 인쇄')
  {
    const { ctx, p, 오류 } = await 새쪽(390, 844, { 모드: 'fail' })
    const 앞 = 셈들.length
    await p.goto(BASE + '/first', { waitUntil: 'domcontentloaded' }); await p.waitForSelector('main .notice', { timeout: 15000 })
    await 기다림(async () => (await p.evaluate(() => (window.__afitIns || []).length)) === 2 && (await p.evaluate(() => document.querySelectorAll('aside.afit').length)) === 0, 8000)
    ok('광고 없음(NO-AD 콜백) — 두 칸 다 접힘(빈 자리 안 남김) · |애드핏빔| 한 번씩', (await p.evaluate(() => document.querySelectorAll('aside.afit').length)) === 0 && 셈들.slice(앞).filter((u) => u.includes('|애드핏빔|')).length === 2, 셈들.slice(앞))
    ok('오류 0', !오류.length, 오류)
    await ctx.close()
  }
  {
    const { ctx, p, 오류 } = await 새쪽(390, 844, { 스크립트: '막힘' })
    await p.goto(BASE + '/how', { waitUntil: 'domcontentloaded' }); await p.waitForSelector('footer.footer', { timeout: 15000 })
    await 기다림(async () => (await p.evaluate(() => document.querySelectorAll('aside.afit').length)) === 0, 6000)
    ok('스크립트를 못 받음(광고 막는 앱 · 끊김) — 칸 접힘', (await p.evaluate(() => document.querySelectorAll('aside.afit').length)) === 0)
    ok('오류 0', !오류.length, 오류)
    await ctx.close()
  }
  {
    const { ctx, p, 오류 } = await 새쪽(390, 844)
    await p.goto(BASE + '/how', { waitUntil: 'domcontentloaded' }); await p.waitForSelector('aside.afit.on', { timeout: 8000 })
    await p.emulateMedia({ media: 'print' })
    ok('인쇄 — 애드핏 칸 안 보임(5.4 전자문서에 광고 금지)', await p.evaluate(() => getComputedStyle(document.querySelector('aside.afit')).display === 'none'))
    ok('오류 0', !오류.length, 오류)
    await ctx.close()
  }
  await b.close()
}
console.log(`\n${bad ? '✗' : '✓'} 애드핏 시험 ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
