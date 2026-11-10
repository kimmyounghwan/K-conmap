/**
 * 🧪 G636 (2026-11-10) 내역서 비율 맞추기(/naeyeok/ratio) «예시로 해 보기» · 📖 쓰는 순서 — 화면 시험
 *   소장님: 「예시 만들어 주고 … 도구 사용방법도 자세히 기재해 주고」
 *   구운 사이트(dist)를 띄운 뒤:  node tools/시험_비율예시화면.mjs [주소=http://127.0.0.1:4636]
 *   ① «🧪 예시로 해 보기»(10줄 · 관급 2 · 당초 87,395,420) → 지어낸 내역서(/jeoksan/비율예시_내역서.xlsx · 가상 마을안길 정비공사 · 관급 레미콘 · 철근)가 올라간 것처럼 열림 · 파일 이름 · «지어낸 예시» 알림 · 줄 수 · 당초 합계
 *   ② 80% 그대로 → «📄 올린 엑셀 그대로» 받기(시험 브라우저 안) → 받은 엑셀의 «터파기» 줄: 합계 단가 2,350 → 1,880 · 금액 2,350,000 · 노무비 656 · 경비 1,224(원 미만 버림)
 *      · 받은 엑셀에 원가계산서 시트 그대로 · 화면 «원가계산서 … 당초 ↔ 새 값 보기»(사용 방법에 적은 것)
 *   ③ 📖 쓰는 순서 6(첫 줄 «처음이면 — 🧪 예시») · 자주 묻는 것 6
 *   ④ PC 1280 · 폰 390 넘침 0 · 오류 0
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BASE = process.argv[2] || 'http://127.0.0.1:4636'
let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 400))) }
const 숫 = (v) => Number(String(v ?? '').replace(/[^\d.-]/g, '')) || 0
const b = await chromium.launch()
const 받은곳 = fs.mkdtempSync('/tmp/g636dl-')
for (const [이름, w, h, 폰] of [['PC 1280', 1280, 900, false], ['폰 390', 390, 844, true]]) {
  console.log(`— ${이름}`)
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, acceptDownloads: true })
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs|firebaseio|googleapis/, (r) => r.fulfill({ status: 200, body: '' }))
  await ctx.addInitScript(() => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) { /* 없음 */ } })
  const p = await ctx.newPage()
  const 오류 = []; p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  await p.goto(BASE + '/naeyeok/ratio', { waitUntil: 'domcontentloaded' })
  const 단추 = p.locator('button', { hasText: '🧪 예시로 해 보기' })
  await 단추.waitFor({ timeout: 20000 })
  ok(`${이름} ① «🧪 예시로 해 보기» 단추(파일 올리기 전)`, (await 단추.count()) === 1)
  await 단추.click()
  await p.waitForFunction(() => /내역 [\d,]+줄 · 당초 합계/.test(document.body.innerText), null, { timeout: 30000 })   /* 사용 방법 글에도 «당초 합계» 가 있어 파일 읽은 줄로 기다림 */
  await p.waitForTimeout(500)
  const 글 = await p.evaluate(() => document.body.innerText)
  ok(`${이름} ① 파일 이름 «예시_내역서(가상 마을안길 정비공사).xlsx» · «지어낸 예시 내역서» 알림`, 글.includes('예시_내역서(가상 마을안길 정비공사).xlsx') && 글.includes('지어낸 예시 내역서'), 글.slice(0, 200))
  const m = 글.match(/내역 ([\d,]+)줄 · 당초 합계 ([\d,]+)원/)
  ok(`${이름} ① 읽은 줄 10(관급 2 포함) · 당초 합계 87,395,420원`, !!m && 숫(m[1]) === 10 && 숫(m[2]) === 87395420, m && m[0])
  ok(`${이름} ① 예시 단추는 파일이 열리면 사라짐`, (await 단추.count()) === 0)
  // ②
  const 틀단추 = p.locator('button', { hasText: '올린 엑셀 그대로' }).first()
  await 틀단추.click()
  const 받기 = p.locator('a[download]', { hasText: '⬇' }).first()
  await 받기.waitFor({ timeout: 30000 })
  /* 받기 단추가 가리키는 파일(blob) 내용을 그대로 읽음 — 시험 브라우저에서 받기 사건이 안 오는 때가 있어(헤드리스) 내용으로 봄 */
  const 이름글 = await 받기.getAttribute('download')
  const b64 = await p.evaluate(async () => { const a = document.querySelector('a[download]'); const u8 = new Uint8Array(await (await fetch(a.href)).arrayBuffer()); let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s) })
  const 파일 = path.join(받은곳, `${이름.replace(/\s/g, '')}.xlsx`)
  fs.writeFileSync(파일, Buffer.from(b64, 'base64'))
  ok(`${이름} ② 받기 이름 «…_80%_그대로.xlsx»`, /^예시_내역서\(가상 마을안길 정비공사\)_80%_그대로\.xlsx$/.test(이름글 || ''), 이름글)
  /* 사용 방법에 적은 «원가계산서 당초 ↔ 새 값 보기» 가 화면에 실제로 있음 */
  const 원가 = await p.evaluate(() => { const d = [...document.querySelectorAll('details')].find((x) => /당초 ↔ 새 값 보기/.test(x.querySelector('summary')?.innerText || '')); return d ? { 머리: d.querySelector('summary').innerText, 줄: d.querySelectorAll('tbody tr').length } : null })
  ok(`${이름} ② «원가계산서 … 당초 ↔ 새 값 보기» 줄 있음`, !!원가 && 원가.줄 >= 5, 원가)
  /* 원가계산서 도급액 · 관급 — 손셈(tools/만들기_비율예시내역.py 와 같은 요율 · 원 미만 버림, 80% 내역 합으로 따로 셈): 도급액 78,706,721 · 관급자재대 26,973,870 그대로 · 총공사비 105,680,591 */
  const 원가값 = await p.evaluate(() => { const d = [...document.querySelectorAll('details')].find((x) => /당초 ↔ 새 값 보기/.test(x.querySelector('summary')?.textContent || '')); return d ? [...d.querySelectorAll('tbody tr')].map((r) => [...r.cells].map((c) => c.textContent.trim())) : [] })
  const 값 = (머리) => { const r = 원가값.find((x) => x[0].startsWith(머리)); return r ? [숫(r[1]), 숫(r[2])] : null }
  ok(`${이름} ② 원가계산서 — 도급액 98,383,400 → 78,706,721 · 관급자재대 26,973,870 그대로 · 총공사비 105,680,591`,
    JSON.stringify(값('I ')) === '[98383400,78706721]' && JSON.stringify(값('J ')) === '[26973870,26973870]' && JSON.stringify(값('K ')) === '[125357270,105680591]', [값('I '), 값('J '), 값('K ')])
  /* 받은 엑셀을 파이썬 openpyxl 로 읽음(클라우드 시험 전용 — 사이트는 자체 엑셀 읽개) */
  const 읽은 = JSON.parse(execFileSync('python3', ['-c', `import json,sys,openpyxl
wb=openpyxl.load_workbook(sys.argv[1],data_only=True)
ws=wb['내역서']
row=next(([c for c in r] for r in ws.iter_rows(values_only=True) if any(str(c or '').strip()=='터파기' for c in r[:3])),None)
print(json.dumps({'시트':wb.sheetnames,'터':row},ensure_ascii=False,default=str))`, 파일], { encoding: 'utf8' }))
  /* 내역서 열: 공종 · 품명 · 규격 · 수량 · 단위 · 합계(단가 · 금액) · 노무비(단가 · 금액) · 재료비(단가 · 금액) · 경비(단가 · 금액) · 비고 */
  const 터 = 읽은.터
  ok(`${이름} ② 받은 엑셀 — 시트 그대로(원가계산서 · 내역서)`, 읽은.시트.includes('원가계산서') && 읽은.시트.includes('내역서'), 읽은.시트)
  ok(`${이름} ② «터파기» 80% — 합계 단가 1,880 · 금액 2,350,000 · 노무비 656 · 경비 1,224`, !!터 && 숫(터[3]) === 1250 && 숫(터[5]) === 1880 && 숫(터[6]) === 2350000 && 숫(터[7]) === 656 && 숫(터[11]) === 1224, 터)
  // ③
  const 순서 = await p.locator('.tguide dl.ghow').first().locator('dt').allInnerTexts()
  const 묻 = await p.locator('.tguide dl.ghow').nth(1).locator('dt').allInnerTexts()
  ok(`${이름} ③ 📖 쓰는 순서 6(첫 줄 «처음이면 — 🧪 예시») · 자주 묻는 것 6`, 순서.length === 6 && 순서[0].trim() === '처음이면 — 🧪 예시' && 묻.length === 6, [순서.length, 순서[0], 묻.length])
  ok(`${이름} ④ 넘침 0`, (await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1)
  ok(`${이름} ④ 오류 0`, 오류.length === 0, 오류)
  await ctx.close()
}
await b.close()
fs.rmSync(받은곳, { recursive: true, force: true })
console.log(`\n${bad ? '❌' : '✅'} 시험_비율예시화면 ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
