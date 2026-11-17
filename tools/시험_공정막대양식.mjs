// 📈 예정공정표 «막대 색 · 양식 그대로» 화면 시험 (2026-11-17 G736 · 소장님 「예정공정표 고쳐서 올렸지? 하나하나 클릭해보고 점검해줘」)
//   빌드를 띄운 뒤  B=http://127.0.0.1:4998 node tools/시험_공정막대양식.mjs   (PLAYWRIGHT · PC bat 에서는 안 돌림)
//   실사이트 점검에서 찾은 두 가지 + 다시 안 생기게:
//   ① 막대형 🧪 예시 — 막대(b.gp-bar) 파랑 #2563eb · 주공정(.cp) 빨강 #dc2626 · 높이 9px · 떠 있음(absolute) · 폭 > 0 · 범례(.gp-lg1)와 같은 색
//      — 화면 · 인쇄 둘 다 (전엔 내 위치 좌표의 .gp-bar 가 뒤에서 덮어 옅은 회색 + 테두리 → 거의 안 보임)
//   ② 내 위치 좌표 «⏱ 평균 내기» 막대(.gps-bar) — 줄 안에 보임(폭 100px 넘음 · absolute 아님) · 채움 = --accent · 시간이 가면 늘어남
//   ③ 금액형 고른 뒤 🧪 예시 → 금액형 그대로(전엔 막대형으로 넘어감) · 적어 둔 칸(공사명 · 공종 · 금_)은 그대로
//   ④ 예시 중 📊 막대형 고름 → 저장 칸은 «양식» 한 칸만 바뀜 → 예시 끄기 → 막대형 그대로
//   ⑤ 금액형에서 칸 비우기 → 금액형 그대로
//   ⑥ 다시 열기(새로 고침) → 고른 양식 그대로 · ⑦ 도움말(.gp-hint) 모양 그대로(회색 · 위 8px) · ⑧ 화면 오류 0
//   ⑨ 금액형 🧪 예시 중 📥 내역서 넣기(가상 총괄표) → 예시 꺼짐 · 금액형 그대로 · 넣은 공종 · 저장(묻는 창 없음)
import { createRequire } from 'module'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const require = createRequire(process.env.PW || '/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 주소 = process.env.B || 'http://127.0.0.1:4998'
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log(c ? '  ✓' : '  ✗', m, c ? '' : String(typeof 더 === 'string' ? 더 : JSON.stringify(더)).slice(0, 400)) }
const 열쇠 = 'kcm.calc.schedule'
const 내칸 = { 공사명: '가상 현장 공사', 착공: '2026-12-01', 준공: '2027-03-31', 공종: [{ 이름: '토공', 금액: '1000000', 시작: '', 기간: '30', 선행: '', 간격: '' }], '금_공사명': '가상 금액형 공사' }
const 브 = await chromium.launch()
const 오류 = []
const 새판 = async (밑 = null, 더 = {}) => {
  const c = await 브.newContext({ viewport: { width: 1280, height: 900 }, locale: 'ko-KR', ...더 })
  await c.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs|firebaseio|coupang|daumcdn|kakao/, (r) => r.fulfill({ status: 200, body: '' }))
  await c.addInitScript(([k, v]) => {
    localStorage.setItem('kcm_notice_seen', '2026-10-필독'); try { sessionStorage.setItem('kcm_notice_seen', '2026-10-업체') } catch (e) {}
    if (v && !sessionStorage.getItem('kcm_t_seed')) { localStorage.setItem(k, v); sessionStorage.setItem('kcm_t_seed', '1') }
  }, [열쇠, 밑 ? JSON.stringify(밑) : null])
  const p = await c.newPage(); p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  return { c, p }
}
const 누름 = (p, re) => p.evaluate((s) => { const r = new RegExp(s); const b = [...document.querySelectorAll('button')].find((x) => r.test(x.textContent.trim()) && x.offsetParent !== null); if (b) { b.click(); return true } return false }, re.source)
const 양식 = (p) => p.evaluate(() => { const b = document.querySelector('.gp-pick-b.on b'); return b ? b.textContent.trim() : '' })
const 저장 = (p) => p.evaluate((k) => JSON.parse(localStorage.getItem(k) || '{}'), 열쇠)
const 빼고 = (m) => { const x = { ...m }; delete x.양식; return JSON.stringify(x) }

/* ① 막대 색 */
{
  console.log('① 막대형 막대 색')
  const { c, p } = await 새판()
  await p.goto(주소 + '/tools/schedule', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(3000)
  봐(await 누름(p, /예시로 해 보기/), '🧪 예시로 해 보기'); await p.waitForTimeout(1500)
  봐(await 양식(p) === '📊 막대형', '처음은 막대형', await 양식(p))
  const 막대 = async () => p.evaluate(() => [...document.querySelectorAll('b.gp-bar')].map((b) => { const s = getComputedStyle(b); const r = b.getBoundingClientRect(); return { cp: b.classList.contains('cp'), bg: s.backgroundColor, h: s.height, pos: s.position, bd: s.borderTopWidth, w: Math.round(r.width) } }))
  const L = await 막대()
  봐(L.length >= 5, '막대 5개 넘음', L.length)
  봐(L.some((x) => x.cp) && L.some((x) => !x.cp), '주공정(빨강) · 보통(파랑) 둘 다 있음', L.map((x) => x.cp))
  봐(L.filter((x) => !x.cp).every((x) => x.bg === 'rgb(37, 99, 235)'), '보통 막대 파랑 #2563eb(전엔 옅은 회색)', [...new Set(L.filter((x) => !x.cp).map((x) => x.bg))])
  봐(L.filter((x) => x.cp).every((x) => x.bg === 'rgb(220, 38, 38)'), '주공정 막대 빨강 #dc2626', [...new Set(L.filter((x) => x.cp).map((x) => x.bg))])
  봐(L.every((x) => x.h === '9px' && x.pos === 'absolute' && x.bd === '0px'), '높이 9px · 떠 있음 · 테두리 없음(전엔 10px · 1px 테두리)', L.slice(0, 3))
  봐(L.every((x) => x.w > 0), '막대 폭 > 0', L.map((x) => x.w))
  const 범례 = await p.evaluate(() => { const a = document.querySelector('.gp-lg1'), b = document.querySelector('.gp-lg2'); return [a && getComputedStyle(a).backgroundColor, b && getComputedStyle(b).backgroundColor] })
  봐(범례[0] === 'rgb(37, 99, 235)' && 범례[1] === 'rgb(220, 38, 38)', '범례 색 = 막대 색', 범례)
  const 힌트 = await p.evaluate(() => { const h = document.querySelector('p.gp-hint'); if (!h) return null; const s = getComputedStyle(h); return { c: s.color, mt: s.marginTop, fs: s.fontSize, lh: s.lineHeight } })
  봐(힌트 && 힌트.c === 'rgb(107, 114, 128)' && 힌트.mt === '8px' && 힌트.fs === '12.5px', '⑦ 도움말(.gp-hint) 모양 그대로 — 회색 · 위 8px · 12.5px', 힌트)
  await p.emulateMedia({ media: 'print' }); await p.waitForTimeout(300)
  const P = await 막대()
  봐(P.length === L.length && P.every((x) => x.bg === (x.cp ? 'rgb(220, 38, 38)' : 'rgb(37, 99, 235)')), '인쇄(print)에서도 파랑 · 빨강', [...new Set(P.map((x) => x.bg))])
  await c.close()
}

/* ② 내 위치 좌표 평균 내기 막대 */
{
  console.log('② 내 위치 좌표 «평균 내기» 막대')
  const { c, p } = await 새판(null, { permissions: ['geolocation'], geolocation: { latitude: 37.5665, longitude: 126.978, accuracy: 6 } })
  await p.goto(주소 + '/tools/gps', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(3000)
  봐(await 누름(p, /^30초$/), '⏱ 30초 누름'); await p.waitForTimeout(1200)
  const 첫 = await p.evaluate(() => { const b = document.querySelector('.gp-avg .gps-bar'); if (!b) return null; const s = getComputedStyle(b); const r = b.getBoundingClientRect(); const i = b.querySelector('i'); const t = document.createElement('i'); t.style.background = 'var(--accent)'; document.body.appendChild(t); const acc = getComputedStyle(t).backgroundColor; t.remove(); return { w: Math.round(r.width), h: Math.round(r.height), pos: s.position, bg: s.backgroundColor, ibg: i && getComputedStyle(i).backgroundColor, acc, iw: i ? i.getBoundingClientRect().width : -1 } })
  봐(!!첫, '평균 내기 줄에 .gps-bar 있음', 첫)
  봐(첫 && 첫.w > 100 && 첫.h >= 10 && 첫.pos === 'static', '막대가 줄 안에 보임(폭 100px 넘음 · absolute 아님 — 전엔 폭 0)', 첫)
  봐(첫 && 첫.acc && 첫.ibg === 첫.acc, '채움 = 사이트 파랑(--accent)', 첫 && [첫.ibg, 첫.acc])
  await p.waitForTimeout(3500)
  const 뒤 = await p.evaluate(() => { const i = document.querySelector('.gp-avg .gps-bar i'); return i ? i.getBoundingClientRect().width : -1 })
  봐(뒤 > (첫 ? 첫.iw : 0), '시간이 가면 채움이 늘어남', [첫 && 첫.iw, 뒤])
  const 옛 = await p.evaluate(() => document.querySelectorAll('.gp-bar').length)
  봐(옛 === 0, '내 위치 좌표에는 .gp-bar(예정공정표 이름) 없음', 옛)
  const 힌트 = await p.evaluate(() => [...document.querySelectorAll('.gps-hint')].map((h) => { const s = getComputedStyle(h); return s.color + ' ' + s.marginTop + ' ' + s.lineHeight }))
  봐(힌트.every((x) => x.startsWith('rgb(107, 114, 128) 8px')), '내 위치 좌표 도움말(.gps-hint) 모양 그대로', 힌트)
  await c.close()
}

/* ⑨ 금액형 예시 중 내역서 넣기 */
{
  console.log('⑨ 금액형 예시 중 📥 내역서 넣기')
  const { c, p } = await 새판()
  const 창 = []; p.on('dialog', (d) => { 창.push(d.message().slice(0, 80)); d.dismiss() })
  await p.goto(주소 + '/tools/schedule', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(3000)
  봐(await 누름(p, /금액형/), '⑨ 💰 금액형'); await p.waitForTimeout(800)
  봐(await 누름(p, /예시로 해 보기/), '⑨ 🧪 예시로 해 보기'); await p.waitForTimeout(1500)
  봐(await 양식(p) === '💰 금액형', '⑨ 금액형 예시', await 양식(p))
  /* playwright 는 한글 경로 파일을 넣으면 아무 일도 안 일어남(11-16 실측) → 영문 이름 사본 */
  const 원 = fileURLToPath(new URL('./시험자료/공종읽기_총괄표.xlsx', import.meta.url))
  const 사본 = path.join(os.tmpdir(), `kcm_in_${process.pid}_g736.xlsx`); fs.copyFileSync(원, 사본)
  await p.setInputFiles('.gp-in input[type=file]', 사본)
  for (let k = 0; k < 40; k++) { await p.waitForTimeout(150); if (await p.evaluate(() => !!(document.querySelector('.gp-in-say') || {}).textContent)) break }
  await p.waitForTimeout(1500)
  const 예시끔 = await p.evaluate(() => ![...document.querySelectorAll('button')].some((b) => /예시 끄기/.test(b.textContent) && b.offsetParent !== null))
  const 이름들 = await p.evaluate(() => [...document.querySelectorAll('.gc-edit tbody tr')].map((tr) => tr.querySelectorAll('input')[0].value))
  const m = await 저장(p)
  봐(예시끔 && await 양식(p) === '💰 금액형', '⑨ 예시 꺼짐 · 금액형 그대로(전엔 넣은 뒤 막대형으로 갈 수 있었음)', [예시끔, await 양식(p)])
  봐(이름들.includes('가상A등대') && Array.isArray(m.금_공종) && m.금_공종.length === 이름들.length && m.양식 === '금액', '⑨ 넣은 공종이 금액형에 · 저장됨', [이름들.slice(0, 6), m.양식, m.금_공종 && m.금_공종.length])
  봐(창.length === 0, '⑨ 묻는 창 없음(적어 둔 금액형 공종 없음)', 창)
  try { fs.unlinkSync(사본) } catch (e) { /* 없음 */ }
  await c.close()
}

/* ③ ~ ⑥ 양식 그대로 */
{
  console.log('③ ~ ⑥ 양식(막대형 · 금액형) 그대로')
  const { c, p } = await 새판(내칸)
  await p.goto(주소 + '/tools/schedule', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(3000)
  봐(await 양식(p) === '📊 막대형', '적어 둔 칸 · 처음 막대형', await 양식(p))
  봐(await 누름(p, /금액형/), '💰 금액형 고름'); await p.waitForTimeout(1000)
  let m = await 저장(p)
  봐(m.양식 === '금액' && m.공사명 === '가상 현장 공사', '저장 칸 양식 = 금액 · 공사명 그대로', { 양식: m.양식, 공사명: m.공사명 })
  const 앞 = 빼고(m)
  봐(await 누름(p, /예시로 해 보기/), '🧪 예시로 해 보기'); await p.waitForTimeout(1500)
  봐(await 양식(p) === '💰 금액형', '③ 금액형에서 예시 → 금액형 그대로(전엔 막대형)', await 양식(p))
  const 금칸 = await p.evaluate(() => document.querySelectorAll('.gc-edit tbody tr').length)
  봐(금칸 >= 5, '③ 금액형 예시 칸이 채워짐', 금칸)
  m = await 저장(p)
  봐(빼고(m) === 앞 && m.양식 === '금액', '③ 예시 중 — 적어 둔 칸 그대로(예시 값 안 남김)', [빼고(m).slice(0, 120), 앞.slice(0, 120)])
  봐(await 누름(p, /막대형/), '④ 예시 중 📊 막대형 고름'); await p.waitForTimeout(1000)
  봐(await 양식(p) === '📊 막대형', '④ 막대형 예시가 보임', await 양식(p))
  const 막대수 = await p.evaluate(() => document.querySelectorAll('b.gp-bar').length)
  봐(막대수 >= 5, '④ 막대형 예시 막대 보임', 막대수)
  m = await 저장(p)
  봐(m.양식 === '막대' && 빼고(m) === 앞, '④ 저장 칸은 «양식» 한 칸만 바뀜', { 양식: m.양식, 같음: 빼고(m) === 앞 })
  봐(await 누름(p, /^예시 끄기$/), '④ 예시 끄기'); await p.waitForTimeout(1500)
  봐(await 양식(p) === '📊 막대형', '④ 예시 끄기 → 막대형 그대로', await 양식(p))
  const 공사명칸 = await p.evaluate(() => { const i = [...document.querySelectorAll('input')].find((x) => x.value === '가상 현장 공사'); return !!i })
  봐(공사명칸, '④ 예시 끈 뒤 적어 둔 공사명 다시 보임', 공사명칸)
  봐(await 누름(p, /금액형/), '⑤ 💰 금액형 고름'); await p.waitForTimeout(800)
  봐(await 누름(p, /^칸 비우기$/), '⑤ 칸 비우기'); await p.waitForTimeout(1500)
  봐(await 양식(p) === '💰 금액형', '⑤ 칸 비우기 → 금액형 그대로(전엔 막대형)', await 양식(p))
  m = await 저장(p)
  봐(m.양식 === '금액' && !m.공사명, '⑤ 칸은 비고 양식만 남음', { 양식: m.양식, 공사명: m.공사명 })
  await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(3000)
  봐(await 양식(p) === '💰 금액형', '⑥ 다시 열기 → 금액형 그대로', await 양식(p))
  봐(await 누름(p, /막대형/), '⑥ 📊 막대형 고름'); await p.waitForTimeout(800)
  await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(3000)
  봐(await 양식(p) === '📊 막대형', '⑥ 다시 열기 → 막대형 그대로', await 양식(p))
  await c.close()
}
봐(오류.length === 0, '⑧ 화면 오류 0', 오류)
await 브.close()
console.log(bad ? `❌ 시험_공정막대양식 ${ok}/${ok + bad}` : `✓ 시험_공정막대양식 ${ok}/${ok}`)
process.exit(bad ? 1 : 0)
