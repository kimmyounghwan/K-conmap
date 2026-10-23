// 🧪 원 내역서로 설계변경(/change/won) — «실제» 설계내역서를 화면에 올려 보기 · G382 (2026-10-23)
//   소장님 「꼼꼼하게 해줘, 시험 가상으로 하지 말고…직접해」 · 「완벽하게 하되, 빨리 해줘」
//   4998 에 화면 빌드를 얹은 뒤  REAL=폴더1,폴더2 node tools/시험_원내역실제화면.mjs [PC|폰|모두]
//   파일마다: 화면 «순공사비» = lib(원읽기 · 1줄 보강) · 원가계산서 «줄 N개 읽음» = lib · 수량 하나를 바꿔 ⑤ «순공사비 변경» · «도급액(총공사비) 변경» = lib 빠른요약
//            · «재료비의 %» 줄이 있으면 % 줄 알림 + 그 바탕 자재 수량을 바꿔 수수료가 따라가는지(⑤ 값) · 화면 오류 없음 · 폰 가로 넘침 없음
//   실제 파일은 저장소에 넣지 않습니다(폴더만 받음). 올릴 때 이름은 «실제_설계내역서_예N.xlsx» 로 바꿔 올립니다. 만들기 · 내려받기는 누르지 않습니다(4998 도 세기 없음).
import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'
import { readWorkbook } from '../web/src/lib/qtoxlsx.js'
import * as W from '../web/src/lib/원내역변경.js'
import { 격자로읽기 } from '../web/src/lib/비율.js'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 주소 = process.env.B || 'http://127.0.0.1:4998'
const 기기들 = (process.argv[2] || '모두') === '모두' ? ['PC', '폰'] : [process.argv[2]]
if (!process.env.REAL) { console.log('REAL=폴더 를 주십시오'); process.exit(2) }
const 파일들 = []
for (const 폴 of process.env.REAL.split(',')) for (const n of fs.readdirSync(폴).filter((f) => /\.(xlsx|xlsm|xls)$/i.test(f)).sort()) 파일들.push(path.join(폴, n))
const 원 = (n) => Math.round(n).toLocaleString('ko-KR')
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log(c ? '✓' : '✗', m, c ? '' : String(더).slice(0, 300)) }
/* lib 가 기대하는 것 */
const 기대들 = 파일들.map((p, k) => {
  const b = fs.readFileSync(p)
  try {
    const 원읽은 = W.원읽기(readWorkbook(new Uint8Array(b)), path.basename(p), null, { 한줄보강: 격자로읽기 })
    const 줄 = 원읽은.모형.줄
    /* 바꿀 품목: % 줄이 있으면 그 바탕 자재 첫 줄 · 없으면 금액이 가장 큰 품목 */
    const 율줄 = 줄.find((x) => x.율 && x.율.바탕줄 && x.율.바탕줄.length)
    let 고른 = 율줄 ? 율줄.율.바탕줄.find((y) => y.값[0] && y.값[0].수량 > 0) : null
    if (!고른) 고른 = 줄.filter((x) => x.꼴 === '품목' && x.값[0] && x.값[0].수량 > 0).sort((a, c) => ((c.값[0].g.합계 || {}).금액 || 0) - ((a.값[0].g.합계 || {}).금액 || 0))[0]
    const i = 줄.indexOf(고른)
    const q = 고른 ? Math.round(고른.값[0].수량 * 1.2 * 1000) / 1000 : null
    const 편 = W.새편집(); if (고른) 편.차수[0].수량[i] = String(q)
    const 요 = W.빠른요약(원읽은, 편, 1)
    /* 같은 이름 · 규격 품목이 여럿이면 화면에서 첫째를 고르므로 — 앞에 같은 이름+규격이 없을 때만 «바꿔 보기» */
    const 같은앞 = 고른 ? 줄.slice(0, i).filter((x) => x.꼴 === '품목' && x.이름 === 고른.이름 && (x.규격 || '') === (고른.규격 || '')).length : 0
    return { p, k, b, 합: 원읽은.합, 원가: 원읽은.원가 ? { 시트: 원읽은.원가.시트, 줄: 원읽은.원가.줄.length } : null, 율: 율줄 ? 율줄.이름 : null, 고른: 고른 && !같은앞 ? { 이름: 고른.이름, 규격: 고른.규격 || '', q } : null, 요 }
  } catch (e) { return { p, k, 못읽음: String(e.message).slice(0, 80) } }
})
const 브 = await chromium.launch({ env: { ...process.env, LANG: 'C.UTF-8', LC_ALL: 'C.UTF-8' } })
for (const 기기 of 기기들) {
  const 판 = await 브.newContext({ viewport: { width: 기기 === '폰' ? 390 : 1280, height: 900 }, locale: 'ko-KR',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36' })
  await 판.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  await 판.route(/firebaseio\.com/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await 판.addInitScript(() => { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); try { sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1'); const d = new Date(), 두 = (n) => String(n).padStart(2, '0'), 날 = `${d.getFullYear()}-${두(d.getMonth() + 1)}-${두(d.getDate())}`, h = d.getHours(); localStorage.setItem('kcm_visit', JSON.stringify({ n: 5, first: 0, last: Date.now(), day: 날, slot: 날 + ' ' + (h < 12 ? '오전' : h < 18 ? '오후' : '저녁') })) } catch (e) {}; Object.defineProperty(navigator, 'webdriver', { get: () => false }) })
  const A = await 판.newPage()
  const 오류 = []
  A.on('pageerror', (e) => 오류.push(String(e).slice(0, 160)))
  console.log(`— ${기기} · 실제 ${파일들.length}부`)
  for (const e of 기대들) {
    if (e.못읽음) { console.log('  (lib 가 못 읽는 파일 — 건넘)', path.basename(e.p).slice(0, 13), e.못읽음); continue }
    const 이름 = `실제_설계내역서_예${e.k + 1}${path.extname(e.p).toLowerCase()}`
    await A.goto(주소 + '/change/won', { waitUntil: 'domcontentloaded' })
    await A.evaluate(() => { try { for (const k of Object.keys(localStorage)) if (/won|원내역|변경원/.test(k)) localStorage.removeItem(k) } catch (x) {} })
    await A.waitForSelector('input[type=file]', { state: 'attached', timeout: 20000 })
    await A.locator('input[type=file]').first().setInputFiles({ name: 이름, mimeType: 'application/octet-stream', buffer: e.b })
    try { await A.locator('.cw-fs').first().waitFor({ timeout: 120000 }) } catch (x) { 봐(false, `${기기} ${이름} 읽힘`, await A.locator('body').innerText()); continue }
    const 글 = await A.locator('.cw-fs').first().innerText()
    봐(글.includes('순공사비 ' + 원(e.합) + '원'), `${기기} ${이름} 화면 순공사비 = lib ${원(e.합)}`, 글.slice(0, 200))
    봐(e.원가 ? 글.includes(`원가계산서 «${e.원가.시트}» — 줄 ${e.원가.줄}개 읽음`) : 글.includes('원가계산서 시트가 없습니다'), `${기기} ${이름} 원가계산서 ${e.원가 ? '줄 ' + e.원가.줄 : '없음'}`, 글.slice(0, 300))
    if (e.율) {
      await A.locator('input[type=search]').first().fill(e.율)
      await A.waitForTimeout(300)
      const 목 = await A.locator('.wn-list').first().innerText()
      봐(목.includes('수량이 % 인 줄입니다'), `${기기} ${이름} «${e.율}» — % 줄 알림`, 목.slice(0, 300))
      봐(!목.includes('바꾸면 «수량 × 단가» 로 다시 셉니다'), `${기기} ${이름} «${e.율}» — «수량 × 단가» 알림 안 뜸`)
    }
    if (e.고른) {
      await A.locator('input[type=search]').first().fill(e.고른.이름)
      await A.waitForTimeout(300)
      /* 같은 품명 · 다른 규격 줄이 앞에 있을 수 있어 «품명 · 규격» 이 똑같은 첫 줄의 칸 */
      const 바랄 = (e.고른.이름 + (e.고른.규격 ? ' · ' + e.고른.규격 : '')).replace(/\s+/g, ' ').trim()
      const 줄들 = A.locator('.wn-item')
      let 칸 = null
      for (let j = 0, n = await 줄들.count(); j < n && !칸; j++) { const t = (await 줄들.nth(j).locator('.wn-name').innerText()).replace(/\s+/g, ' ').trim(); if (t === 바랄) 칸 = 줄들.nth(j).locator('input[inputmode=decimal]').first() }
      if (칸 && await 칸.count()) {
        await 칸.fill(String(e.고른.q))
        await A.waitForTimeout(500)
        const 판글 = await A.locator('.cw-tiles').first().innerText()
        const 기 = [원(e.요.순[1])]
        봐(판글.replace(/\s+/g, ' ').includes('순공사비 변경 ' + 원(e.요.순[1])), `${기기} ${이름} «${e.고른.이름}» 수량 × 1.2 — ⑤ 순공사비 변경 = lib ${원(e.요.순[1])}`, 판글.replace(/\s+/g, ' ').slice(0, 300))
        const 원가k = e.요.원가 && (e.요.원가.도급액 ? '도급액' : e.요.원가.총공사비 ? '총공사비' : null)
        if (원가k) 봐(판글.replace(/\s+/g, ' ').includes(`${원가k} 당초 → 변경 ${원(e.요.원가[원가k].변경)}`), `${기기} ${이름} ⑤ ${원가k} 변경 = lib ${원(e.요.원가[원가k].변경)}`, 판글.replace(/\s+/g, ' ').slice(0, 300))
      } else 봐(false, `${기기} ${이름} «${e.고른.이름}» 수량 칸 찾기`)
    }
    if (기기 === '폰') { const w = await A.evaluate(() => document.scrollingElement.scrollWidth - window.innerWidth); 봐(w <= 1, `${기기} ${이름} 가로 넘침 없음`, w) }
  }
  봐(오류.length === 0, `${기기} 화면 오류 없음`, 오류.join(' | '))
  await 판.close()
}
await 브.close()
console.log(`\n${bad ? '❌' : '✅'} 원 내역서 실제 화면 ${ok + bad}개 중 ${ok} 맞음 · ${bad} 틀림`)
process.exit(bad ? 1 : 0)
