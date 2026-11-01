// 🧮 G490 (2026-11-01) 같은 층을 «확대평면도» 로 한 번 더 그린 도면을 같이 넣어도 — 골조 수량산출 · 도면 물량 자동(골조) · BIM 물량 세 화면의 콘크리트가 같고,
//   도면 한 장만 넣었을 때와도 같아야 함(두 번 세지 않음). 소장님 «적산 탭 모두 점검» 2차 — 실제 구조 도면 6장(확대평면도 S-201 포함)이
//   골조 수량산출에서 2,969 ㎥(BIM 1,414)로 나왔던 것: 골조자동은 «겹친 것은 BIM 이 뺀다» 로 두고 있는데 그 두 화면은 빼기를 안 거쳤음.
//   화면 빌드를 얹은 뒤  B=http://127.0.0.1:4467 node tools/시험_확대평면화면.mjs [PC|폰|모두]
//   가상 예시(web/public/jeoksan/골조자동_예시.dxf)를 그대로 한 장 + 제목만 «2층 구조 확대평면도» · «지붕층 구조 확대평면도» 로 바꾼 사본 한 장.
import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'
const require = createRequire(process.env.PW || '/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 주소 = process.env.B || 'http://127.0.0.1:4467'
const 기기들 = (process.argv[2] || '모두') === '모두' ? ['PC', '폰'] : [process.argv[2]]
const 예 = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'web', 'public', 'jeoksan', '골조자동_예시.dxf')
const 글 = fs.readFileSync(decodeURIComponent(예), 'utf8')
const 확대 = 글.replace(/\n2층 구조평면도\r?\n/, '\n2층 구조 확대평면도\n').replace(/\n지붕층 구조평면도\r?\n/, '\n지붕층 구조 확대평면도\n')
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log(c ? '  ✓' : '  ✗', m, c ? '' : String(typeof 더 === 'string' ? 더 : JSON.stringify(더)).slice(0, 600)) }
봐(확대 !== 글 && /2층 구조 확대평면도/.test(확대) && /지붕층 구조 확대평면도/.test(확대), '가상 도면 사본 — 제목 둘만 «확대평면도» 로')
const 수 = (t) => parseFloat(String(t || '').replace(/,/g, ''))
const 콘 = (t) => 수((t.match(/콘크리트[^\n\d]*\n?\s*([\d,]+\.?\d*)\s*(?:㎥|m³)/) || [])[1])
const 브 = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] })
for (const 기기 of 기기들) {
  console.log('■ ' + 기기)
  const 폰 = 기기 === '폰'
  const c = await 브.newContext({ viewport: 폰 ? { width: 390, height: 844 } : { width: 1280, height: 860 }, locale: 'ko-KR', isMobile: 폰, hasTouch: 폰 })
  await c.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs|firebaseio/, (r) => r.fulfill({ status: 200, body: '' }))
  await c.addInitScript(() => { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); try { sessionStorage.setItem('kcm_notice_seen', '2026-10-업체') } catch (e) {} })
  const 오류 = []
  const 열기 = async (길, 파일들, 탭re) => {
    const p = await c.newPage(); p.on('pageerror', (e) => 오류.push(길 + ' ' + String(e).slice(0, 300))); p.on('dialog', (d) => d.accept())
    await p.goto(주소 + 길, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500)
    await p.evaluate(([파일들]) => { const dt = new DataTransfer(); for (const [이름, t] of 파일들) dt.items.add(new File([t], 이름)); const 들 = [...document.querySelectorAll('input[type=file]')].filter((i) => /dxf/i.test(i.accept)); const inp = 들.find((i) => i.multiple) || 들[0]; inp.files = dt.files; inp.dispatchEvent(new Event('change', { bubbles: true })) }, [파일들])
    let 앞 = '', 같 = 0
    for (let i = 0; i < 120; i++) { await p.waitForTimeout(1500); await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /^예, 불러오기$|^예, 넣기$/.test(x.textContent.trim()) && x.offsetParent !== null); if (b) b.click() }); const g = await p.evaluate(() => document.body.innerText); if (!/읽는 중|여는 중|세우는 중|셈하는 중/.test(g)) { if (g === 앞) 같++; else 같 = 0; if (같 >= 1) break } 앞 = g }
    if (탭re) { await p.evaluate((s) => { const b = [...document.querySelectorAll('button')].find((x) => new RegExp(s).test(x.textContent.trim()) && x.offsetParent !== null); if (b) b.click() }, 탭re); await p.waitForTimeout(1200) }
    const 글 = await p.evaluate(() => document.body.innerText)
    await p.close()
    return 콘(글)
  }
  const 한장 = [['골조자동_예시.dxf', 글]], 두장 = [['골조자동_예시.dxf', 글], ['골조자동_예시_확대.dxf', 확대]]
  const 값 = {}
  for (const [이름, 길, 탭re] of [['골조 수량산출', '/jeoksan/golgo', '^④ 결과'], ['도면 물량 자동(골조)', '/jeoksan/auto', '^② 골조'], ['BIM 물량', '/jeoksan/bim', '']]) {
    const a = await 열기(길, 한장, 탭re), b = await 열기(길, 두장, 탭re)
    값[이름] = { 한장: a, 두장: b }
    봐(a > 50 && Math.abs(a - b) / a < 0.005, `${기기} ${이름} — 확대평면도 사본을 같이 넣어도 콘크리트 같음(한 장 ${a} · 두 장 ${b} ㎥)`, 값[이름])
  }
  const 들 = Object.values(값).map((v) => v.두장)
  봐(들.every((v) => v > 50 && Math.abs(v - 들[0]) / 들[0] < 0.02), `${기기} 세 화면 콘크리트 같음(2 % 안): ${Object.entries(값).map(([k, v]) => k + ' ' + v.두장).join(' · ')}`, 값)
  봐(!오류.length, 기기 + ' 화면 오류 없음', 오류.join(' | '))
  await c.close()
}
await 브.close()
console.log(bad ? `✗ ${bad} 틀림 · ${ok} 맞음` : `✓ 모두 맞음(${ok})`)
process.exit(bad ? 1 : 0)
