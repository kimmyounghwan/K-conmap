// 📥 예정공정표 «내역서 넣기» 화면 시험 (2026-11-16 소장님 「간단하게 하는 방법없을까? 내역서만 넣으면 되게」 → 「해줘.」 · 「실제로 내역서 직접 넣어 보고, 점검해줘」)
//   빌드를 띄운 뒤  B=http://127.0.0.1:4735 node tools/시험_내역넣기화면.mjs [PC|폰|모두]      (PLAYWRIGHT: /tmp/g10/pw · PC bat 에서는 안 돌림)
//   REAL=목록.txt 를 주면 실제 내역서(목록의 경로 · 저장소에 안 넣음)마다 두 양식에 넣어 lib 셈과 화면이 같은지 봄
//   ① 금액형 · 서식 공통 칸(kcm.서식공통) 착공 · 준공 → 넣자마자 공종 · 세부 · 금액(천원) · 공사명 · 도급액 · 기간까지 · 알림(뺀 것) · 저장 꼴(손으로 적은 것과 같은 열쇠)
//   ② 막대형 · 날 없음 → 그 자리 날짜 칸 → 두 날을 적으면 바로 기간 · 저장 꼴 · 공사일보가 읽는 계획률(lib 계획률) 셈 됨
//   ③ 적어 둔 공종이 있으면 먼저 물음 — 취소면 그대로 · 확인이면 바뀜
//   ④ 🧪 예시 중에 넣으면 예시가 꺼지고 넣은 값으로 열림(저장도 됨 · 알림 그대로)
//   ⑤ 공종 줄이 없는 엑셀 → «⚠️ … 못 찾았습니다» · 적어 둔 것 그대로 ⑥ .xls 도 같음 ⑦ 폭 320 · 390 · 1280 넘침 없음 · 단추 하나 · 화면 오류 없음
import { createRequire } from 'module'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const require = createRequire(process.env.PW || '/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 주소 = process.env.B || 'http://127.0.0.1:4735'
const 기기들 = (process.argv[2] || '모두') === '모두' ? ['PC', '폰'] : [process.argv[2]]
const 자료 = (이름) => fileURLToPath(new URL('./시험자료/' + 이름, import.meta.url))
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log(c ? '  ✓' : '  ✗', m, c ? '' : String(typeof 더 === 'string' ? 더 : JSON.stringify(더)).slice(0, 500)) }
const { 계획률, 공정셈 } = await import('../web/src/lib/공정.js')
const 브 = await chromium.launch()

async function 새쪽(기기, 미리 = {}) {
  const 폰 = 기기 === '폰'
  const c = await 브.newContext({ viewport: 폰 ? { width: 390, height: 844 } : { width: 1280, height: 900 }, isMobile: 폰, hasTouch: 폰, locale: 'ko-KR' })
  await c.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs|firebaseio|coupang|kakaocdn/, (r) => r.fulfill({ status: 200, body: '' }))
  await c.addInitScript((m) => {
    if (sessionStorage.getItem('__미리')) return
    sessionStorage.setItem('__미리', '1')
    localStorage.setItem('kcm_notice_seen', '2026-10-필독'); try { sessionStorage.setItem('kcm_notice_seen', '2026-10-업체') } catch (e) {}
    for (const [k, v] of Object.entries(m)) localStorage.setItem(k, JSON.stringify(v))
  }, 미리)
  const p = await c.newPage(); const 오류 = []; p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  await p.goto(주소 + '/tools/schedule', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(3000)
  return { c, p, 오류 }
}
const 누름 = (p, re) => p.evaluate((s) => { const r = new RegExp(s); const b = [...document.querySelectorAll('button')].find((x) => r.test(x.textContent.trim()) && x.offsetParent !== null); if (b) { b.click(); return true } return false }, re.source)
const 알림 = (p) => p.evaluate(() => { const e = document.querySelector('.gp-in-say'); return e ? e.textContent : '' })
/* ⚠️ playwright 는 한글 경로 파일을 넣으면 아무 일도 안 일어남(input · change 없음 — 11-16 실측) → 영문 이름 사본으로 넣음 */
let 사본번 = 0
const 영문사본 = (파일) => { const q = path.join(os.tmpdir(), `kcm_in_${process.pid}_${사본번++}${path.extname(파일).toLowerCase()}`); fs.copyFileSync(파일, q); return q }
const 넣기 = async (p, 파일) => { const 전 = await 알림(p); await p.setInputFiles('.gp-in input[type=file]', 영문사본(파일)); for (let k = 0; k < 40; k++) { await p.waitForTimeout(150); const t = await 알림(p); if (t && t !== 전) break } await p.waitForTimeout(400) }
const 금줄들 = (p) => p.evaluate(() => [...document.querySelectorAll('.gc-edit tbody tr')].map((tr) => { const i = tr.querySelectorAll('input'); return { 단: tr.querySelector('select').value, 이름: i[0].value, 금: i[3].value, 시작: i[4].value, 끝: i[5].value } }))
const 막줄들 = (p) => p.evaluate(() => [...document.querySelectorAll('.gp-edit:not(.gc-edit) tbody tr')].map((tr) => { const i = tr.querySelectorAll('input'); return { 이름: i[0].value, 금: i[1].value, 기간: i[i.length - 3] ? i[i.length - 3].value : '', 끝: (tr.querySelectorAll('td.n')[2] || {}).textContent || '' } }))
const 저장 = (p) => p.evaluate(() => { try { return JSON.parse(localStorage.getItem('kcm.calc.schedule') || '{}') } catch (e) { return {} } })
const 금열쇠 = ['깊이', '이름', '수량', '단위', '금액', '시작', '끝', '변금액', '변시작', '변끝'].join()
const 막열쇠 = ['이름', '금액', '시작', '기간', '선행', '간격'].join()

if (!process.env.REAL) {
  for (const 기기 of 기기들) {
    console.log('■ ' + 기기)
    /* ① 금액형 · 공통 칸 날 */
    {
      const { c, p, 오류 } = await 새쪽(기기, { 'kcm.서식공통': { 현장: '가상 현장', 착공: '2026. 12. 1.', 준공: '2027-11-30' } })
      봐(await 누름(p, /금액형/), '💰 금액형'); await p.waitForTimeout(800)
      봐(await p.evaluate(() => document.querySelectorAll('.gp-in button').length === 1 && ![...document.querySelectorAll('button')].some((b) => /내역서\(엑셀\)/.test(b.textContent))), '① 맨 위 «📥 내역서 넣기» 단추 하나(옛 작은 단추 없음)')
      await 넣기(p, 자료('공종읽기_내역서.xlsx'))
      const L = await 금줄들(p)
      봐(L.map((x) => x.단 + x.이름).join(' ') === '1배수장공사 2토공 2구조물공 1배수로 2토공 2구조물공 1부대공 2가설공사 2안전관리비 1사급자재대', '① 공종 · 세부 차례', L.map((x) => x.단 + x.이름))
      봐(L.map((x) => x.금).join() === ',200000,400000,,50000,200000,,30000,20000,100000', '① 금액(천원) · 세부가 있는 공종은 비움(아래 합)', L.map((x) => x.금))
      const 안 = (t) => t >= '2026-12-01' && t <= '2027-11-30'
      봐(L.every((x) => (x.단 === '1' && !x.금) ? (!x.시작 && !x.끝) : (안(x.시작) && 안(x.끝) && x.시작 <= x.끝)), '① 기간: 잎 줄은 서식 공통 칸 착공 ~ 준공 안 · 세부가 있는 공종은 비움', L.map((x) => [x.시작, x.끝]))
      const S = await 저장(p)
      봐(S['금_착공'] === '2026-12-01' && S['금_준공'] === '2027-11-30' && S['금_공사명'] === '가상지구 배수개선사업' && S['금_도급'] === '1620000', '① 착공 · 준공(서식 공통) · 공사명 · 도급액(천원) 채움', [S['금_착공'], S['금_준공'], S['금_공사명'], S['금_도급']])
      봐(Array.isArray(S['금_공종']) && S['금_공종'].every((r) => Object.keys(r).join() === 금열쇠), '① 저장 꼴 = 손으로 적은 줄과 같은 열쇠', S['금_공종'] && Object.keys(S['금_공종'][0]))
      const t = await 알림(p)
      봐(/«내역서» 시트에서 공종 4가지 · 세부 6가지/.test(t) && /순공사비 1,000,000천원/.test(t) && /도급액 1,620,000천원/.test(t) && /뺀 것: 도급자 관급자재 · 기타공사비/.test(t) && /서식에 적어 둔 착공 ~ 준공/.test(t), '① 알림(시트 · 몇 가지 · 순공사비 · 도급액 · 뺀 것 · 기간)', t)
      const 그림 = await p.evaluate(() => ({ svg: !!document.querySelector('.gc-screen svg.gc-svg'), 글: (document.querySelector('.calc-out, .out') || document.body).textContent }))
      봐(그림.svg && /1,000,000 · 620,000 · 1,620,000 천원/.test(그림.글), '① 공정표 그림 · 순공사비 · 제경비 · 도급액(천원)', 그림.글.match(/순공사비[^천]*천원/))
      봐(!(await p.$('.gp-ask')), '① 날이 있으니 날짜 칸(기다림) 없음')
      /* ⑥ .xls 도 같음(이미 공종이 있으니 묻고 → 확인) */
      p.once('dialog', (d) => d.accept())
      await 넣기(p, 자료('공종읽기_내역서.xls'))
      const L2 = await 금줄들(p)
      봐(L2.map((x) => x.단 + x.이름 + x.금).join() === L.map((x) => x.단 + x.이름 + x.금).join(), '⑥ .xls 도 같은 공종 · 금액', L2.map((x) => x.이름))
      봐(!오류.length, 기기 + ' ① 화면 오류 없음', 오류.join(' | '))
      await c.close()
    }
    /* ② 막대형 · 날 없음 → 그 자리 날짜 칸 */
    {
      const { c, p, 오류 } = await 새쪽(기기)
      await 넣기(p, 자료('공종읽기_겹침.xlsx'))
      let L = await 막줄들(p)
      봐(L.map((x) => x.이름 + '=' + x.금).join() === '철거공=28000000,복구=6000000,운반비=1500000,폐기물처리비=1700000', '② 막대형 공종 · 금액(원) — 위 집계 · 아래 내역 겹침 합침 · 관급 · 고재 뺌', L.map((x) => x.이름 + '=' + x.금))
      봐(!!(await p.$('.gp-ask')) && /📅 착공 · 준공을 적으면/.test(await 알림(p)), '② 날이 없어 그 자리 날짜 칸 · 알림')
      봐(L.every((x) => !x.기간), '② 아직 기간 없음', L.map((x) => x.기간))
      await p.fill('.gp-ask input[aria-label="착공일"]', '2027-03-02'); await p.waitForTimeout(300)
      봐(!!(await p.$('.gp-ask')), '② 착공만 적으면 아직 기다림')
      await p.fill('.gp-ask input[aria-label="준공일"]', '2027-09-30'); await p.waitForTimeout(900)
      L = await 막줄들(p)
      봐(!(await p.$('.gp-ask')) && L.every((x) => +x.기간 > 0) && /🪄 착공 ~ 준공에 기간을/.test(await 알림(p)) && !/📅/.test(await 알림(p)), '② 두 날을 적자마자 기간을 놓음 · 날짜 칸 걷힘 · 알림 바뀜', L.map((x) => x.기간))
      const S = await 저장(p)
      봐(S.착공 === '2027-03-02' && S.준공 === '2027-09-30' && S.공사명 === '가상 공원 정비공사', '② 착공 · 준공 · 공사명 저장', [S.착공, S.준공, S.공사명])
      봐(Array.isArray(S.공종) && S.공종.every((r) => Object.keys(r).join() === 막열쇠) && S.공종.every((r) => r.시작 >= '2027-03-02' && +r.기간 > 0), '② 저장 꼴 = 손으로 적은 줄과 같은 열쇠(공사일보 · 기성이 그대로 읽음)', S.공종)
      const 률 = 계획률({ 착공: S.착공, 준공: S.준공, 간격: S.간격 || '월', 공종: S.공종 }, '2027-06-30')
      const 끝 = 계획률({ 착공: S.착공, 준공: S.준공, 간격: S.간격 || '월', 공종: S.공종 }, '2027-09-30')
      봐(률 !== null && 률 > 0 && 률 < 1 && Math.abs(끝 - 1) < 1e-9, '② 공사일보 계획률(lib 계획률) — 6월 말 0~100% 사이 · 준공일 100%', [률, 끝])
      const R = 공정셈({ 착공: S.착공, 준공: S.준공, 간격: '월', 공종: S.공종 })
      봐(R.합계 === 37200000 && !R.경고.length, '② 막대형 셈 — 총 37,200,000원 · 경고 없음', [R.합계, R.경고])
      봐(!오류.length, 기기 + ' ② 화면 오류 없음', 오류.join(' | '))
      await c.close()
    }
    /* ③ 적어 둔 공종 — 먼저 물음 */
    {
      const { c, p, 오류 } = await 새쪽(기기, { 'kcm.calc.schedule': { 양식: '막대', 공사명: '내 공사', 착공: '2027-01-04', 준공: '2027-06-30', 간격: '월', 공종: [{ 이름: '기존공종', 금액: '100', 시작: '2027-01-04', 기간: '30', 선행: '', 간격: '' }] } })
      let 물음 = ''
      p.once('dialog', (d) => { 물음 = d.message(); d.dismiss() })
      await p.setInputFiles('.gp-in input[type=file]', 영문사본(자료('공종읽기_집계표.xlsx'))); await p.waitForTimeout(2000)
      let L = await 막줄들(p)
      봐(/적어 둔 공종 1줄을 내역서의 공종으로 바꿉니다/.test(물음) && L.length === 1 && L[0].이름 === '기존공종', '③ 먼저 물음 · 취소면 그대로', [물음, L])
      p.once('dialog', (d) => d.accept())
      await 넣기(p, 자료('공종읽기_집계표.xlsx'))
      L = await 막줄들(p)
      const S = await 저장(p)
      봐(L.map((x) => x.이름).join() === '토공,구조물공,포장공,안전관리비' && S.공사명 === '내 공사' && S.착공 === '2027-01-04', '③ 확인이면 바뀜 · 공사명 · 날은 적어 둔 것 그대로', [L.map((x) => x.이름), S.공사명])
      봐(L.every((x) => +x.기간 > 0), '③ 적어 둔 착공 ~ 준공으로 기간 놓음', L.map((x) => x.기간))
      봐(!오류.length, 기기 + ' ③ 화면 오류 없음', 오류.join(' | '))
      await c.close()
    }
    /* ④ 🧪 예시 중에 넣기 → 예시 꺼짐 · 넣은 값 · 저장 */
    {
      const { c, p, 오류 } = await 새쪽(기기)
      봐(await 누름(p, /예시로 해 보기/), '④ 예시로 해 보기'); await p.waitForTimeout(1200)
      await 넣기(p, 자료('공종읽기_총괄표.xlsx')); await p.waitForTimeout(800)
      const L = await 막줄들(p)
      const 예시끔 = await p.evaluate(() => ![...document.querySelectorAll('button')].some((b) => /예시 끄기/.test(b.textContent) && b.offsetParent !== null))
      const S = await 저장(p)
      봐(예시끔 && L.map((x) => x.이름).join() === '가상A등대,가상B등대,가상C등표,가상D등대,가상 시설물 보수', '④ 예시가 꺼지고 넣은 공종으로 열림', [예시끔, L.map((x) => x.이름)])
      봐(Array.isArray(S.공종) && S.공종.length === 5 && /«내역서총괄표» 시트에서 공종 5가지/.test(await 알림(p)), '④ 저장됨 · 알림 그대로', [S.공종 && S.공종.length, await 알림(p)])
      봐(!오류.length, 기기 + ' ④ 화면 오류 없음', 오류.join(' | '))
      await c.close()
    }
    /* ⑤ 공종 줄 없는 엑셀 · ⑦ 폭 */
    {
      const { c, p, 오류 } = await 새쪽(기기, { 'kcm.calc.schedule': { 양식: '금액', 금_공종: [{ 깊이: 1, 이름: '그대로', 수량: '1', 단위: '식', 금액: '5', 시작: '', 끝: '', 변금액: '', 변시작: '', 변끝: '' }] } })
      await 넣기(p, 자료('공종읽기_공종없음.xlsx'))
      const t = await 알림(p); const L = await 금줄들(p)
      봐(/⚠️/.test(t) && /못 찾았습니다/.test(t) && L.length === 1 && L[0].이름 === '그대로', '⑤ 공종 줄이 없으면 «⚠️ … 못 찾았습니다» · 적어 둔 것 그대로', [t, L.map((x) => x.이름)])
      for (const w of (기기 === '폰' ? [320, 390] : [1280])) {
        await p.setViewportSize({ width: w, height: 800 }); await p.waitForTimeout(300)
        const n = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
        const 단추 = await p.evaluate(() => { const b = document.querySelector('.gp-in button'); const r = b.getBoundingClientRect(); return { w: Math.round(r.width), 안: r.right <= document.documentElement.clientWidth + 1 } })
        봐(n <= 1 && 단추.안 && 단추.w >= 100, `${기기} ⑦ ${w}px 넘침 없음 · 단추 보임`, [n, 단추])
      }
      봐(!오류.length, 기기 + ' ⑤ 화면 오류 없음', 오류.join(' | '))
      await c.close()
    }
  }
} else {
  /* 실제 내역서 — 두 양식에 넣어 lib(공종나무읽기 · 금액형내역줄 · 막대형줄)와 화면이 같은지 */
  const { 공종나무읽기, 막대형줄 } = await import('../web/src/lib/공종읽기.js')
  const { 금액형내역줄 } = await import('../web/src/lib/공정.js')
  const 목록 = fs.readFileSync(process.env.REAL, 'utf8').split('\n').map((x) => x.trim()).filter(Boolean)
  const { c, p, 오류 } = await 새쪽('PC', { 'kcm.서식공통': { 착공: '2026-12-01', 준공: '2027-11-30' } })
  for (let k = 0; k < 목록.length; k++) {
    const f = 목록[k]
    const b = fs.readFileSync(f)
    let R = null
    try { R = 공종나무읽기(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), path.basename(f)) } catch (e) { R = null }
    const 확장 = path.extname(f).toLowerCase()
    const 사본 = f        /* 넣기() 가 영문 이름 사본으로 넣음 */
    for (const 양식 of ['막대', '금액']) {
      await 누름(p, 양식 === '막대' ? /막대형/ : /금액형/); await p.waitForTimeout(300)
      p.removeAllListeners('dialog'); p.on('dialog', (d) => d.accept())
      await 넣기(p, 사본)
      const t = await 알림(p)
      if (!R) { 봐(/⚠️/.test(t), `${k + 1} ${양식}형 — 못 읽는 파일은 «⚠️» 알림`, t); continue }
      if (양식 === '막대') {
        const L = await 막줄들(p), 기대 = 막대형줄(R)
        봐(L.length === 기대.length && L.every((x, i) => x.이름 === 기대[i].이름 && (+x.금 || 0) === (기대[i].금액 > 0 ? Math.round(기대[i].금액) : 0)) && (!R.금있음 || L.every((x) => +x.기간 > 0)), `${k + 1} 막대형 ${L.length}줄 = lib · 기간 놓음`, [L.slice(0, 3), 기대.slice(0, 3)])
      } else {
        const L = await 금줄들(p), 기대 = 금액형내역줄(R, '천원').줄
        봐(L.length === 기대.length && L.every((x, i) => x.이름 === 기대[i].이름 && x.금 === 기대[i].금액 && String(기대[i].깊이) === x.단), `${k + 1} 금액형 ${L.length}줄 = lib`, [L.slice(0, 3), 기대.slice(0, 3)])
      }
    }
  }
  봐(!오류.length, '실제 내역서 화면 오류 없음', 오류.join(' | '))
  await c.close()
}
await 브.close()
console.log(bad ? `✗ ${bad} 틀림 · ${ok} 맞음` : `✓ 모두 맞음(${ok})`)
process.exit(bad ? 1 : 0)
