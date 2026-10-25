/**
 * 🔎 빠른 찾기 화면 시험 · G404 (2026-10-25)
 *   4998 에 화면 빌드를 얹은 뒤  node tools/시험_빠른찾기화면.mjs   (B=주소 로 바꿀 수 있음)
 *   PC · 폰 390 · 360 · 320: 맨 위 줄 안 넘침 · 🔎 자리 · 🔎 · «/» · Ctrl+K 로 열림 · 노무비 · 초성 · 공고 번호 · ↑↓ · 엔터 · Esc · 바깥 · 다른 글칸의 «/» · 화면 오류 없음
 */
import { createRequire } from 'module'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const BASE = process.env.B || 'http://127.0.0.1:4998'
const 찍기 = process.env.CAP || ''
const b = await chromium.launch()
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log((c ? '  ✓ ' : '  ✗ ') + m + (c ? '' : ' — ' + String(더).slice(0, 400))) }
for (const [기기, vp] of [['PC', { width: 1280, height: 860 }], ['폰', { width: 390, height: 844 }], ['폰360', { width: 360, height: 740 }], ['폰320', { width: 320, height: 640 }]]) {
  const p = await b.newPage({ viewport: vp, deviceScaleFactor: 1 })
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e)))
  await p.goto(BASE + '/tools', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.qsbtn', { timeout: 20000 })
  const 넘침 = await p.evaluate(() => { const t = document.querySelector('.topbar-in'); const r = document.querySelector('.topbar-r'); const rr = r.getBoundingClientRect(); return { sw: t.scrollWidth, cw: t.clientWidth, right: Math.round(rr.right), vw: innerWidth } })
  봐(넘침.right <= 넘침.vw + 1, `${기기} 맨 위 줄 안 넘침(🔎 더해도) — 오른쪽 끝 ${넘침.right} / 화면 ${넘침.vw}`, JSON.stringify(넘침))
  /* 🔒 소장님 «배치 잘해줘. 이상하지 않게» — 넓으면 머리줄 가운데 찾는 칸(보는 방법 오른쪽 · 단추 줄 왼쪽) · 좁으면 단추 줄 맨 앞 🔎 */
  const 자리 = await p.evaluate(() => { const q = document.querySelector('.qsbtn').getBoundingClientRect(), s = document.querySelector('.brand-sub').getBoundingClientRect(), r = document.querySelector('.topbar-r').getBoundingClientRect(); return { 넓: q.width, 왼: q.left - s.right, 오: r.left - q.right, 글: getComputedStyle(document.querySelector('.qsbtn .qslong')).display } })
  봐(vp.width > 860 ? 자리.넓 >= 200 && 자리.왼 >= 10 && 자리.오 >= 20 && 자리.글 !== 'none' : 자리.넓 <= 40 && 자리.오 >= 2 && 자리.오 <= 8 && 자리.글 === 'none', `${기기} 🔎 자리 — ${vp.width > 860 ? '가운데 찾는 칸' : '단추 줄 맨 앞 알약'}(폭 ${Math.round(자리.넓)} · 오른쪽 틈 ${Math.round(자리.오)})`, JSON.stringify(자리))
  await p.click('.qsbtn')
  await p.waitForSelector('.qs-in', { timeout: 10000 })
  await p.fill('.qs-in', '노무비')
  await p.waitForFunction(() => document.querySelectorAll('.qs-row').length > 0, null, { timeout: 10000 })
  const 첫 = await p.$eval('.qs-row .qs-t', (e) => e.textContent)
  봐(/노무비 계산기/.test(첫), `${기기} 🔎 → «노무비» 맨 위 = ${첫}`)
  if (기기 === 'PC' || 기기 === '폰') { if (찍기) await p.screenshot({ path: `${찍기}/${기기}_노무비.png` }) }
  await p.keyboard.press('Escape')
  await p.waitForTimeout(300)
  봐(!(await p.$('.qs-back')), `${기기} Esc 로 닫힘`)
  if (기기 === 'PC') {
    await p.keyboard.press('/')
    await p.waitForSelector('.qs-in', { timeout: 5000 })
    await p.keyboard.type('ㄱㅍㅈ')
    await p.waitForTimeout(400)
    const 초 = await p.$eval('.qs-row .qs-t', (e) => e.textContent).catch(() => '')
    봐(/거푸집/.test(초), `PC «/» 로 열고 초성 «ㄱㅍㅈ» → ${초}`)
    await p.keyboard.press('Enter')
    await p.waitForTimeout(800)
    봐(/\/tools\/formwork-area$/.test(p.url()) && !(await p.$('.qs-back')), `PC 엔터 → ${p.url().replace(BASE, '')} 로 가고 창 닫힘`)
    await p.keyboard.press('Control+k')
    await p.waitForSelector('.qs-in', { timeout: 5000 })
    await p.fill('.qs-in', '')
    if (찍기) await p.screenshot({ path: `${찍기}/PC_처음.png` })
    await p.fill('.qs-in', 'r26bk01693749')
    await p.waitForTimeout(300)
    const 공 = await p.$eval('.qs-row .qs-t', (e) => e.textContent).catch(() => '')
    봐(/공고 R26BK01693749 열기/.test(공), `PC Ctrl+K 로 열고 공고 번호 → ${공}`)
    await p.fill('.qs-in', '설계변경')
    await p.waitForTimeout(300)
    await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowDown')
    const on = await p.$eval('.qs-row.on .qs-t', (e) => e.textContent).catch(() => '')
    const 셋째 = await p.$$eval('.qs-row .qs-t', (es) => es[2] && es[2].textContent)
    봐(on && on === 셋째, `PC ↓ ↓ → 셋째 줄 고름(${on})`)
    await p.mouse.click(5, 5)
    await p.waitForTimeout(300)
    봐(!(await p.$('.qs-back')), 'PC 바깥 누르면 닫힘')
    /* 글칸에서 «/» 는 그냥 글자 */
    const 글칸 = await p.$('input[type=text], input:not([type]), textarea')
    if (글칸) { await 글칸.click(); await p.keyboard.press('/'); await p.waitForTimeout(200); 봐(!(await p.$('.qs-back')), 'PC 다른 글칸에서 «/» 는 창을 안 엶') }
  }
  if (기기 === '폰') {
    await p.click('.qsbtn')
    await p.fill('.qs-in', '하도급')
    await p.waitForTimeout(400)
    await p.tap('.qs-row:nth-child(1)').catch(async () => { await p.click('.qs-row:nth-child(1)') })
    await p.waitForTimeout(800)
    봐(!(await p.$('.qs-back')) && p.url() !== BASE + '/tools', `폰 누르면 → ${p.url().replace(BASE, '')}`)
  }
  봐(!오류.length, `${기기} 화면 오류 없음`, 오류.join(' | '))
  await p.close()
}
await b.close()
console.log(`\n${ok + bad}개 중 맞음 ${ok} · 틀림 ${bad}`)
if (bad) { console.log('✗ 틀린 것이 있음'); process.exit(1) } else console.log('✓ 모두 맞음')
