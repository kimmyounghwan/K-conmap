/**
 * 🧪 G634 (2026-11-10) 고용 · 산재 보험료 계산기(/tools/boheomryo) «예시로 해 보기» — 화면 시험
 *   소장님: 「예시 만들어 주고 … 도구 사용방법도 자세히 기재해 주고」(점검: 예시 없는 16곳 중 하나)
 *   구운 사이트(dist)를 띄운 뒤:  node tools/시험_보험료예시화면.mjs [주소=http://127.0.0.1:4634]
 *   ① 내 칸(총공사금액 3억)을 적어 둠 → «🧪 예시로 해 보기» → 칸이 예시(12억 5천만 · 원수급인 · 3/2 ~ 12/18)로 · 보험료 합계 = lib 셈(보험료(예시입력))
 *   ② 예시 동안: 저장 안 함(노무비 자료 kcm_nomubi1 그대로) · 칸을 바꿔도 저장 안 함 · «✓ 냈음 기록» 숨김(«예시에서는 기록하지 않습니다») · 노무비에서 가져오기 줄 숨김 ·
 *      확정 신고 기한(다음 해 1월)이 «앞으로 할 일» 로 보임 · 분할 납부 표
 *   ③ «예시 닫기 — 내 칸으로» → 3억 그대로 · 새로고침해도 3억 · 예시 단추 다시 보임
 *   ④ 사용 방법 «쓰는 순서» 첫 줄이 «처음이면 — 🧪 예시»
 *   ⑤ PC 1280 · 폰 390 · 360 넘침 0 · 오류 0   ⑥ 폰은 «근거» 칸을 표 밖 목록으로(항목 글이 세로로 깨지지 않게) · PC 는 그대로
 *   ⑦ 다른 화면 칸 그대로 — 폰 숨김은 보험료 표(.bh-src)에만: 퇴직공제 «피공제자 셈 ✓» 칸 꼴(.tbl.hm-t 안 .no-print) · 해마다 «근거»(.hm-src-t) 보임 · /tools/haemada 실제 화면 «근거» 보임
 *      (처음 판은 .hm-t .no-print 를 숨겨 퇴직공제 셈 ✓ 단추가 폰에서 사라질 뻔 — 올리기 전 점검에서 잡음)
 * 인터넷 안 부름(파이어베이스 · 광고 · 애널리틱스 막음) · 이 시험 브라우저 안에서만 적음.
 */
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BASE = process.argv[2] || 'http://127.0.0.1:4634'
const { 보험료 } = await import(pathToFileURL(path.join(ROOT, 'web/src/lib/보험료셈.js')).href)
const { 한국오늘 } = await import(pathToFileURL(path.join(ROOT, 'web/src/lib/해마다.js')).href)

let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 400))) }
const b = await chromium.launch()
const 원 = (x) => Math.round(Number(x) || 0).toLocaleString('ko-KR')
const 해 = Number(한국오늘().slice(0, 4))
/* 화면과 같은 예시 값(Boheomryo.jsx 예시입력) — 빈입력 기본값 위에 */
const 예시값 = { 해, 방식: 'nomu', 금액: 1250000000, 하도급: false, 보수: 0, 실업제외: 0, 규모: 's', 임금: true, 석면: true, 성립: `${해}-03-02`, 끝: `${해}-12-18`, 낸개산: 0 }
const R = 보험료(예시값)

async function 새쪽(w, h, 폰) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰 })
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  await ctx.route(/firebaseio\.com|firebasedatabase\.app|googleapis\.com/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await ctx.addInitScript(() => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) { /* 없음 */ } })
  const p = await ctx.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  p.on('dialog', (d) => d.dismiss())
  return { ctx, p, 오류 }
}
const 라벨 = (p, 글) => p.locator('.hm-row > label', { hasText: 글 }).first()
const 칸 = (p, 글) => 라벨(p, 글).locator('input').first()
const 합 = (p) => p.evaluate(() => { const s = document.querySelector('.hm-sum'); return s ? s.innerText.replace(/\s+/g, ' ').trim() : '' })
const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
const 지우고친다 = async (p, c, 글) => { await c.click(); await c.press('Control+A'); await c.press('Backspace'); if (글) await p.keyboard.type(글, { delay: 15 }); await p.waitForTimeout(250) }
const 벗어남 = async (p) => { await p.evaluate(() => document.activeElement && document.activeElement.blur()); await p.waitForTimeout(200) }
const 저장본 = (p) => p.evaluate(() => { try { return localStorage.getItem('kcm_nomubi1') } catch (e) { return null } })
const 총 = '총공사금액 (부가세'

for (const [이름, w, h, 폰] of [['PC 1280', 1280, 900, false], ['폰 390', 390, 844, true], ['폰 360', 360, 760, true]]) {
  console.log(`— ${이름}`)
  const { ctx, p, 오류 } = await 새쪽(w, h, 폰)
  await p.goto(BASE + '/tools/boheomryo', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.hm-sum', { timeout: 15000 })
  await 지우고친다(p, 칸(p, 총), '300000000'); await 벗어남(p)
  const 내합 = await 합(p)
  const 앞저장 = await 저장본(p)
  ok(`${이름} ① 내 칸 3억 적어 둠(저장됨)`, (await 칸(p, 총).inputValue()) === '300,000,000' && !!앞저장 && 앞저장.includes('300000000'), [await 칸(p, 총).inputValue(), (앞저장 || '').slice(0, 80)])
  const 단추 = p.locator('button', { hasText: '🧪 예시로 해 보기' })
  ok(`${이름} ① «🧪 예시로 해 보기» 단추`, (await 단추.count()) === 1)
  await 단추.click(); await p.waitForTimeout(400)
  const 띠 = await p.locator('.bh-ex').innerText().catch(() => '')
  ok(`${이름} ① 예시 띠 — 지어낸 공사 · 12억 5천만 · 저장 안 됨 안내 · 닫기 단추`, /예시를 보는 중/.test(띠) && /지어낸 공사/.test(띠) && /12억 5천만/.test(띠) && /저장되지 않습니다/.test(띠) && /예시 닫기/.test(띠), 띠)
  ok(`${이름} ① 칸 = 예시(1,250,000,000 · 시작 ${해}-03-02 · 끝 ${해}-12-18)`, (await 칸(p, 총).inputValue()) === '1,250,000,000'
    && (await 라벨(p, '공사 시작일').locator('input').inputValue()) === `${해}-03-02` && (await 라벨(p, '공사 끝나는 날').locator('input').inputValue()) === `${해}-12-18`,
    [await 칸(p, 총).inputValue()])
  const 예합 = await 합(p)
  ok(`${이름} ① 보험료 합계 = lib 셈 ${원(R.합)} · 보수총액 ${원(R.보수)}`, 예합.includes(`보험료 합계 ${원(R.합)}`) && 예합.includes(`보수총액 ${원(R.보수)}`), 예합)
  ok(`${이름} ② 예시를 띄워도 저장 그대로(노무비 자료)`, (await 저장본(p)) === 앞저장)
  await 지우고친다(p, 칸(p, 총), '1000000000'); await 벗어남(p)
  ok(`${이름} ② 예시에서 칸을 바꿔도(10억) 저장 그대로 · 화면 셈은 바뀜`, (await 저장본(p)) === 앞저장 && (await 합(p)) !== 예합, await 합(p))
  const 낸 = await p.locator('.hm-paid').innerText()
  ok(`${이름} ② «✓ 냈음 기록» 숨김 · «예시에서는 기록하지 않습니다»`, !/냈음 기록/.test(낸) && /예시에서는 기록하지 않습니다/.test(낸), 낸.slice(0, 200))
  ok(`${이름} ② 노무비에서 가져오기 줄 숨김`, (await p.locator('.hm-pull').count()) === 0)
  const 할일 = await p.locator('.hm-todo').innerText()
  ok(`${이름} ② 기한 — 확정 신고(${해 + 1}년 1월)가 보임 · 분할 납부 표`, new RegExp(`${해 + 1}\\.1\\.\\d+\\.`).test(할일) && /확정/.test(할일) && (await p.locator('.hm-t').count()) >= 2, 할일.slice(0, 300))
  await p.locator('button', { hasText: '예시 닫기' }).click(); await p.waitForTimeout(400)
  ok(`${이름} ③ 예시 닫기 → 내 칸 3억 · 같은 보험료 · 예시 단추 다시`, (await 칸(p, 총).inputValue()) === '300,000,000' && (await 합(p)) === 내합 && (await 단추.count()) === 1 && (await p.locator('.bh-ex').count()) === 0)
  await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForSelector('.hm-sum', { timeout: 15000 }); await p.waitForTimeout(400)
  ok(`${이름} ③ 새로고침해도 3억(예시는 안 남음)`, (await 칸(p, 총).inputValue()) === '300,000,000' && (await 합(p)) === 내합)
  const 순서 = await p.locator('.tguide .ghow dt').first().innerText().catch(() => '')
  ok(`${이름} ④ 사용 방법 «쓰는 순서» 첫 줄 «처음이면 — 🧪 예시»`, 순서.trim() === '처음이면 — 🧪 예시', 순서)
  const 표 = await p.evaluate(() => { const t = document.querySelector('.hm-out .hm-t'); const td = t.querySelector('tbody tr td'); const 근 = t.querySelector('th.no-print'); const m = document.querySelector('.hm-src-m')
    return { 항목폭: td.getBoundingClientRect().width, 근거칸: !!근 && getComputedStyle(근).display !== 'none', 목록: !!m && getComputedStyle(m).display !== 'none', 목록줄: m ? m.querySelectorAll('li').length : 0 } })
  ok(`${이름} ⑥ ${폰 ? '폰: 근거는 표 밖 목록 넷 · 항목 칸이 넉넉함(120px 넘게)' : 'PC: 근거 칸 그대로 · 표 밖 목록 없음'}`, 폰 ? (!표.근거칸 && 표.목록 && 표.목록줄 === 4 && 표.항목폭 > 120) : (표.근거칸 && !표.목록), 표)
  ok(`${이름} ⑤ 넘침 0`, (await 넘침(p)) <= 1, await 넘침(p))
  /* ⑦ 다른 화면 칸 그대로 — 같은 이름(.hm-t · .no-print · .hm-src-t)을 쓰는 퇴직공제 · 해마다 칸은 폰에서도 보여야 함 */
  const 꼴 = await p.evaluate(() => {
    const d = document.createElement('div')
    d.innerHTML = '<table class="tbl hm-t"><tbody><tr><td>1</td><td class="nw no-print"><button type="button">셈 ✓</button></td><td class="hm-src-t">근거</td></tr></tbody></table>'
    document.body.appendChild(d)
    const r = { 피공제자: getComputedStyle(d.querySelector('td.no-print')).display, 단추: d.querySelector('button').getBoundingClientRect().width, 근거: getComputedStyle(d.querySelector('td.hm-src-t')).display }
    d.remove(); return r
  })
  ok(`${이름} ⑦ 퇴직공제 «피공제자 셈 ✓» 칸 꼴(.hm-t .no-print) · 해마다 «근거»(.hm-src-t) — 보임`, 꼴.피공제자 !== 'none' && 꼴.단추 > 0 && 꼴.근거 !== 'none', 꼴)
  await p.goto(BASE + '/tools/haemada', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('td.hm-src-t', { timeout: 15000 }).catch(() => {})
  const 해근 = await p.evaluate(() => [...document.querySelectorAll('td.hm-src-t')].map((e) => [getComputedStyle(e).display, e.getBoundingClientRect().height > 0]))
  ok(`${이름} ⑦ /tools/haemada «근거» 칸 보임(${해근.length})`, 해근.length > 0 && 해근.every(([d, h]) => d !== 'none' && h), 해근.slice(0, 4))
  ok(`${이름} ⑤ 오류 0`, 오류.length === 0, 오류)
  await ctx.close()
}
await b.close()
console.log(`\n${bad ? '❌' : '✅'} 시험_보험료예시화면 ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
