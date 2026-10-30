// 🅿 G470 마감 수량산출 — 실내재료마감표에만 있고 평면에 그 이름이 없는 실(현장 Y «지하주차장» ↔ 평면 «총 주차대수 16대») 화면 시험 · 가상 예시 도면만
//   화면 빌드를 얹은 뒤  B=http://127.0.0.1:4467 node tools/시험_마감표에만화면.mjs [PC|폰|모두]
//   가상 예시(web/public/jeoksan/마감_예시.dxf — 평면 방 3 + 실내재료마감표 3줄)에서 평면의 «사무실» 글 하나를 «총 주차대수 16대» 로 바꿔 넣음
//   ① ⚡ 자동 → 표의 «사무실» 은 평면 방과 짐작해 잇지 않고 «📋 평면에 이름이 없는 표의 실 1줄» 목록으로 · «총 주차대수 16대» 방은 기호 빈칸
//   ② 안 고르면 «＋ 고른 0줄 더하기» 꺼짐 → 골라 더하면 ③ 실 끝에 줄(면적 빈칸 · 바닥 F1 · 벽 W1 · 천장 C1 · 천장고 2.7 · 비고) · ① 마감표 기호 그대로
//   ③ 목록 · 화면 가로 넘침 없음(320 · 360 · 390 · 860 · 1280 — 목록 열린 채) · 다 더하면 목록 내려감 · 알림 · 화면 오류 없음
//   (더한 줄의 면적은 기존 «면적 칸 누르고 평면의 방 안 누르기» 로 — 이 시험 밖)
import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'
const require = createRequire(process.env.PW || '/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 주소 = process.env.B || 'http://127.0.0.1:4467'
const 기기들 = (process.argv[2] || '모두') === '모두' ? ['PC', '폰'] : [process.argv[2]]
const 예 = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'web', 'public', 'jeoksan', '마감_예시.dxf')
/* 평면의 «사무실» 글(첫 것 — 표의 «사무실» 은 그대로) → «총 주차대수 16대» */
const 글 = fs.readFileSync(decodeURIComponent(예), 'utf8')
const 자리 = 글.search(/\n사무실\r?\n/)
const 바꾼 = 글.slice(0, 자리) + '\n총 주차대수 16대' + 글.slice(자리 + '\n사무실'.length)
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log(c ? '  ✓' : '  ✗', m, c ? '' : String(typeof 더 === 'string' ? 더 : JSON.stringify(더)).slice(0, 600)) }
봐(자리 > 0 && 바꾼.split('\n사무실').length === 글.split('\n사무실').length - 1, '가상 도면 — 평면 «사무실» 글 하나만 바꿈')
const 브 = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] })
for (const 기기 of 기기들) {
  console.log('■ ' + 기기)
  const 폰 = 기기 === '폰'
  const c = await 브.newContext({ viewport: 폰 ? { width: 390, height: 844 } : { width: 1280, height: 860 }, locale: 'ko-KR', isMobile: 폰, hasTouch: 폰 })
  await c.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs|firebaseio/, (r) => r.fulfill({ status: 200, body: '' }))
  await c.addInitScript(() => { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); try { sessionStorage.setItem('kcm_notice_seen', '2026-10-업체') } catch (e) {} })
  const p = await c.newPage(); const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 300))); p.on('dialog', (d) => d.accept())
  const 누름 = (re, 안 = '') => p.evaluate(([s, 안]) => { const r = new RegExp(s); const b = [...document.querySelectorAll((안 ? 안 + ' ' : '') + 'button')].find((x) => r.test(x.textContent.trim()) && !x.disabled && x.offsetParent !== null); if (b) { b.click(); return true } return false }, [re.source, 안])
  const 판 = () => p.evaluate(() => JSON.parse(localStorage.getItem('kcm.magam.v1') || 'null'))
  await p.goto(주소 + '/jeoksan/magam?ws=1', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500)
  await p.evaluate(([t]) => { const dt = new DataTransfer(); dt.items.add(new File([t], '마감_주차예시.dxf')); const 들 = [...document.querySelectorAll('input[type=file]')].filter((i) => /dxf/i.test(i.accept)); const inp = 들[1] || 들[0]; inp.files = dt.files; inp.dispatchEvent(new Event('change', { bubbles: true })) }, [바꾼])
  for (let i = 0; i < 60; i++) { await p.waitForTimeout(1000); if (await 누름(/^예, 넣기$/)) break; if (await p.evaluate(() => /자동으로 채웠습니다/.test(document.body.innerText))) break }
  await p.waitForTimeout(1500)
  const 알 = await p.evaluate(() => [...document.querySelectorAll('.gg-auto')].map((x) => x.innerText).join(' / '))
  봐(/방 3개/.test(알) && /맞춘 방 2/.test(알), 기기 + ' ⚡ 자동 — 방 3 · 마감표 맞춘 방 2', 알)
  const 상 = await p.evaluate(() => { const b = document.querySelector('.mg-tblonly'); return b ? { 글: b.innerText, 줄: [...b.querySelectorAll('.mg-tblonly-row')].map((x) => x.innerText.trim()), 더: [...b.querySelectorAll('button')].map((x) => [x.textContent.trim(), x.disabled]) } : null })
  봐(상 && /표의 실\s*1줄/.test(상.글) && 상.줄.length === 1 && /^사무실 · 바닥 F1/.test(상.줄[0]) && /천장고 2\.7/.test(상.줄[0]), 기기 + ' 📋 «평면에 이름이 없는 표의 실 1줄» — 사무실 · 바닥 F1 … 천장고 2.7', 상)
  봐(상 && 상.더.some(([t, d]) => /고른 0줄/.test(t) && d), 기기 + ' 안 고르면 «＋ 고른 0줄 더하기» 꺼짐', 상 && 상.더)
  const P0 = await 판()
  const 주 = P0 && P0.실.find((r) => /주차/.test(r.실명 || ''))
  봐(주 && !주.바닥 && !주.벽 && !주.천장 && +주.면적 > 40, 기기 + ' «총 주차대수 16대» 방 — 면적은 재고 마감 기호는 빈칸(짐작해 잇지 않음)', 주)
  /* 넘침 — 목록이 열린 채 */
  for (const w of [320, 360, 390, 860, 1280]) {
    await p.setViewportSize({ width: w, height: 860 }); await p.waitForTimeout(400)
    const n = await p.evaluate(() => { const b = document.querySelector('.mg-tblonly'); return { 쪽: document.documentElement.scrollWidth - document.documentElement.clientWidth, 상자: b ? b.scrollWidth - b.clientWidth : -1, 단추: b ? Math.max(...[...b.querySelectorAll('button')].map((x) => x.getBoundingClientRect().right - b.getBoundingClientRect().right)) : 99 } })
    봐(n.쪽 <= 0 && n.상자 <= 0 && n.단추 <= 0, `${기기} ${w}px 가로 넘침 없음(쪽 · 목록 · 단추)`, n)
  }
  await p.setViewportSize(폰 ? { width: 390, height: 844 } : { width: 1280, height: 860 }); await p.waitForTimeout(400)
  const 앞 = P0.실.length, 앞마감 = P0.마감.length
  await p.evaluate(() => document.querySelector('.mg-tblonly-row input').click()); await p.waitForTimeout(300)
  봐(await 누름(/^＋ 고른 1줄 더하기$/, '.mg-tblonly'), 기기 + ' 골라 «＋ 고른 1줄 더하기»')
  await p.waitForTimeout(1500)
  const P1 = await 판()
  const 새 = P1.실[P1.실.length - 1]
  봐(P1.실.length === 앞 + 1 && 새.실명 === '사무실' && 새.면적 === '' && 새.바닥 === 'F1' && 새.걸레받이 === 'B1' && 새.벽 === 'W1' && 새.천장 === 'C1' && String(새.천장고) === '2.7' && /마감표에만 있음/.test(새.비고 || ''), 기기 + ' ③ 실 끝에 «사무실» 줄 — 면적 빈칸 · F1 · B1 · W1 · C1 · 2.7 · 비고', 새)
  봐(P1.마감.length === 앞마감, 기기 + ' ① 마감표 — 기호 이미 있어 그대로(' + 앞마감 + ')', [앞마감, P1.마감.length])
  봐(!(await p.$('.mg-tblonly')), 기기 + ' 다 더하면 목록 내려감')
  const 말 = await p.evaluate(() => [...document.querySelectorAll('.gg-say')].map((x) => x.innerText).join(' / '))
  봐(/표의 실 1개\(사무실\)를 ③ 실 끝에 줄로 더했습니다/.test(말), 기기 + ' 알림 «… 1개(사무실)를 ③ 실 끝에 줄로 더했습니다»', 말)
  봐(!오류.length, 기기 + ' 화면 오류 없음', 오류)
  await p.screenshot({ path: path.join(process.env.CAP || '/tmp', 'G470_' + 기기 + '.png') })
  await c.close()
}
await 브.close()
console.log(`\n${ok} 통과 · ${bad} 실패`)
process.exit(bad ? 1 : 0)
