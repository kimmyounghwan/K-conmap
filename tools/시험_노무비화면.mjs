// 👷 G367 일용 노무비 계산기(/tools/nomubi) «다른 예시 세 벌» 화면 시험 — PC · 폰
//   사람처럼: «＋ 사람 더하기» → 이름 · 직종 · 생년월일 · 일당을 치고 · 출역 칸을 누름(1번 1 · 2번 0.5 · 3번 1.5) · «일요일 빼고 모두» · ◀ ▶ 로 달 옮김
//   → 지급 명세 표 · 4대보험 단추 · 신고용 집계 · 일금 …원정 · 값만 엑셀 = tools/시험자료/노무비_세벌.json(손셈)
//   + 인쇄(출역 대장 · 지급 명세 · 신고용 집계) · 폰 가로 넘침 0 · 화면 오류 0
//   돌리기: 4998 에 화면 빌드를 얹은 뒤 node tools/시험_노무비화면.mjs [PC|폰|모두]  (데이터베이스는 가짜 — 진짜 사이트에 세지 않음)
import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execFileSync } from 'child_process'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 여기 = path.dirname(fileURLToPath(import.meta.url))
const S = JSON.parse(fs.readFileSync(path.join(여기, '시험자료', '노무비_세벌.json'), 'utf8'))
const 주소 = process.env.B || 'http://127.0.0.1:4998'
const 기기들 = (process.argv[2] || '모두') === '모두' ? ['PC', '폰'] : [process.argv[2]]
const 폴더 = process.env.CAP || '/tmp/g10/g367/ui'
fs.mkdirSync(폴더, { recursive: true })
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log(c ? '✓' : '✗', m, c ? '' : 더) }
const 사람 = { 가갑: ['보통인부', '170000', ''], 가을: ['형틀목공', '260000', ''], 가병: ['철근공', '400000', '610920'], 나갑: ['특수인부', '350000', '750303'], 나을: ['보통인부', '180000', ''], 다갑: ['보통인부', '160000', ''], 다을: ['형틀목공', '200000', '670115'] }
const 수 = (s) => Number(String(s).replace(/[^\d-]/g, '')) || 0
/* 벌마다 할 일 — [달 옮김(◀ 음수 · ▶ 양수), 더할 사람, 칸 누를 사람{이름: {날: 공수} | '모두'}] · 처음 화면 = 이번 달(2026-10) */
const 차례 = {
  A: [['2026-09', ['가갑', '가을', '가병'], { 가갑: '모두', 가을: S.출역.A.가을, 가병: S.출역.A.가병 }]],
  B: [['2026-05', ['나을'], { 나을: S.출역.B.나을['2026-05'] }], ['2026-06', ['나갑'], { 나갑: '모두', 나을: S.출역.B.나을['2026-06'] }], ['2026-07', [], { 나갑: '모두' }]],
  C: [['2026-12', ['다을'], { 다을: '모두' }], ['2027-01', ['다갑'], { 다을: S.출역.C.다을['2027-01'], 다갑: S.출역.C.다갑['2027-01'] }]],
}
const 일금 = { A: { '2026-09': '칠백칠십일만이천칠백삼십' }, B: { '2026-06': '구백팔십팔만삼백육십' }, C: { '2027-01': '삼백이십일만사천삼백구십' } }
const 달수 = (ym) => Number(ym.slice(0, 4)) * 12 + Number(ym.slice(5, 7))
/** 받은 값만 엑셀 → [[칸…]…] 첫 시트(지급명세) */
const 엑셀줄 = (p) => JSON.parse(execFileSync('python3', ['-c', `
import json,sys,zipfile
import xml.etree.ElementTree as ET
ns={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
z=zipfile.ZipFile(sys.argv[1]);ss=[]
if 'xl/sharedStrings.xml' in z.namelist():
  for si in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si',ns): ss.append(''.join(t.text or '' for t in si.iter('{%s}t'%ns['m'])))
nf=0;out=[]
for c in ET.fromstring(z.read('xl/worksheets/sheet1.xml')).iter('{%s}row'%ns['m']):
  r=[]
  for x in c.findall('m:c',ns):
    col=0
    for ch in ''.join(k for k in x.get('r') if k.isalpha()): col=col*26+ord(ch)-64
    while len(r)<col-1: r.append('')
    if x.find('m:f',ns) is not None: nf+=1
    v=x.find('m:v',ns);t=x.get('t')
    if t=='inlineStr': r.append(''.join(y.text or '' for y in x.iter('{%s}t'%ns['m'])))
    elif v is None: r.append('')
    elif t=='s': r.append(ss[int(v.text)])
    else: r.append(v.text)
  out.append(r)
print(json.dumps({'줄':out,'수식':nf},ensure_ascii=False))`, p], { encoding: 'utf8' }))

const 브 = await chromium.launch()
for (const 기기 of 기기들) {
  for (const 벌 of ['A', 'B', 'C']) {
    const 판 = await 브.newContext({ viewport: { width: 기기 === '폰' ? 390 : 1280, height: 900 }, acceptDownloads: true, locale: 'ko-KR', timezoneId: 'Asia/Seoul' })
    await 판.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
    await 판.route(/firebaseio\.com/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
    await 판.addInitScript(() => { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); try { sessionStorage.setItem('kcm_notice_seen', '2026-10-업체') } catch (e) {} ; window.print = () => { window.__인쇄 = (window.__인쇄 || 0) + 1 } })
    const A = await 판.newPage()
    const 오류 = []
    A.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
    await A.goto(주소 + '/tools/nomubi', { waitUntil: 'domcontentloaded' })
    await A.waitForSelector('.nm-month', { timeout: 20000 })
    const 지금달 = async () => { const t = await A.locator('.nm-month b').innerText(); const m = t.match(/(\d{4})년 (\d+)월/); return `${m[1]}-${String(m[2]).padStart(2, '0')}` }
    const 옮김 = async (ym) => {
      for (let k = 0; k < 40; k++) {
        const 지금 = await 지금달()
        if (지금 === ym) return
        await A.locator(`.nm-month button[aria-label="${달수(ym) < 달수(지금) ? '지난달' : '다음 달'}"]`).click()
      }
    }
    await A.locator('input[placeholder^="예: ○○건설"]').fill('가상건설(주)')
    await A.locator('input[placeholder^="예: ○○지구"]').fill('가상지구 시험공사')
    for (const [ym, 더할, 칸들] of 차례[벌]) {
      await 옮김(ym)
      for (const 이름 of 더할) {
        await A.locator('button', { hasText: '＋ 사람 더하기' }).click()
        const i = await A.locator('table.nm-roster tbody tr').count()
        const [직, 일당, 생] = 사람[이름]
        await A.locator(`[aria-label="${i}번 이름"]`).pressSequentially(이름)
        await A.locator(`[aria-label="${i}번 직종"]`).fill(직)
        if (생) await A.locator(`[aria-label="${i}번 생년월일"]`).pressSequentially(생)
        await A.locator(`[aria-label="${i}번 일당"]`).click()
        await A.locator(`[aria-label="${i}번 일당"]`).pressSequentially(일당)
        await A.keyboard.press('Escape')
      }
      for (const [이름, 날들] of Object.entries(칸들)) {
        if (날들 === '모두') { await A.locator('table.tp-grid tr', { hasText: 이름 }).locator('button', { hasText: '일요일 빼고 모두' }).first().click(); continue }
        for (const [d, g] of Object.entries(날들)) {
          const 번 = g === 1 ? 1 : g === 0.5 ? 2 : 3
          for (let k = 0; k < 번; k++) await A.locator(`td[aria-label^="${이름} ${d}일 "]`).first().click()
        }
      }
    }
    for (const [ym, 답] of Object.entries(S.답[벌])) {
      await 옮김(ym)
      await A.waitForTimeout(150)
      const 줄 = await A.$$eval('table.tp-lb tbody tr:not(.sum)', (trs) => trs.map((tr) => [...tr.children].map((td) => td.innerText.trim())))
      for (const [이름, d] of Object.entries(답)) {
        const r = 줄.find((x) => x[1] === 이름)
        if (!r) { 봐(false, `${기기} ${벌} ${ym} ${이름} 줄`, '없음'); continue }
        const 받 = { 일수: 수(r[3]), 보수: 수(r[6]), it: 수(r[8]), lt: 수(r[9]), ei: 수(r[10]), np: 수(r[11]), hi: 수(r[12]), lc: 수(r[13]), 합: 수(r[14]), 차인: 수(r[15]), P: /연금✓/.test(r[7]), H: /건강✓/.test(r[7]) }
        const 다름 = Object.keys(받).filter((k) => 받[k] !== d[k])
        봐(!다름.length, `${기기} ${벌} ${ym} ${이름} 지급 명세 = 손셈 (실지급 ${d.차인.toLocaleString()})`, 다름.map((k) => `${k} 화면 ${받[k]} ≠ ${d[k]}`).join(' · '))
      }
      const 신 = await A.$$eval('table.nm-rep tbody tr:not(.sum)', (trs) => trs.map((tr) => [...tr.children].map((td) => td.innerText.trim())))
      const 출 = S.출역[벌]
      const 신다름 = Object.entries(답).filter(([이름, d]) => {
        const r = 신.find((x) => x[1] === 이름)
        const 날 = Object.keys(벌 === 'A' ? 출[이름] : 출[이름][ym]).map(Number).sort((a, b) => a - b).join(', ')
        return !r || r[3] !== 날 || 수(r[4]) !== d.일수 || 수(r[5]) !== d.보수 || 수(r[6]) !== d.it || 수(r[7]) !== d.lt
      }).map(([이름]) => 이름)
      봐(!신다름.length, `${기기} ${벌} ${ym} 신고용 집계(근로일 · 일수 · 지급액 · 소득세 · 지방소득세) = 손셈`, 신다름.join(','))
      if (일금[벌] && 일금[벌][ym]) {
        const 위 = await A.locator('table.tp-bill-top').innerText()
        const 합 = Object.values(답).reduce((s, d) => s + d.차인, 0)
        봐(위.includes(`일금 ${일금[벌][ym]} 원정 (₩${합.toLocaleString('ko-KR')})`), `${기기} ${벌} ${ym} 지급 총액 «일금 ${일금[벌][ym]} 원정»`, 위.slice(0, 200))
      }
    }
    // 이번에 고친 까닭 글 · 2027 잠정 알림
    if (벌 === 'B') {
      await 옮김('2026-06')
      const t = await A.locator('table.tp-lb').innerText()
      봐(/건강 1개월 미만\(5\.20\. 첫 근로 · 6\.19\. 전에 끝\)/.test(t) && !/건강 10일 — 대상 아님/.test(t), `${기기} B 6월 나을 건강 까닭 «1개월 미만(5.20. 첫 근로 · 6.19. 전에 끝)»`, t.match(/건강 [^·\n]*/g)?.join(' / '))
      await A.locator('#go-myeongse').scrollIntoViewIfNeeded()
      await A.screenshot({ path: path.join(폴더, `G367_${기기}_B_2026-06_건강까닭.png`), clip: await A.locator('table.tp-lb').evaluate((e) => { const r = e.closest('.tp-scroll').getBoundingClientRect(); return { x: Math.max(0, r.x), y: Math.max(0, r.y + scrollY - 70), width: Math.min(r.width, innerWidth), height: r.height + 70 } }), fullPage: true })
    }
    if (벌 === 'C') {
      await 옮김('2027-01')
      const t = await A.locator('.tp-note').first().innerText()
      봐(/2027년 요율/.test(t) && /장기요양·고용보험 요율은 아직 확정 전/.test(t), `${기기} C 2027년 요율 · 잠정 알림`, t.slice(0, 160))
    }
    // 📗 값만 엑셀 — 마지막 답 달
    const 끝달 = Object.keys(S.답[벌]).pop()
    await 옮김(끝달)
    const [dl] = await Promise.all([A.waitForEvent('download', { timeout: 30000 }), A.locator('button', { hasText: '값만 엑셀 받기' }).click()])
    const 파일 = path.join(폴더, `${기기}_${벌}.xlsx`)
    await dl.saveAs(파일)
    const X = 엑셀줄(파일)
    const 엑다름 = Object.entries(S.답[벌][끝달]).filter(([이름, d]) => {
      const r = X.줄.find((x) => x[1] === 이름)
      return !r || [d.일수, null, null, d.보수, d.it, d.lt, d.ei, d.np, d.hi, d.lc, d.합, d.차인].some((v, k) => v !== null && Number(r[3 + k]) !== v)   /* D 일수 · E 공수 · F 일당 · G 노무비 · H~M 공제 · N 공제계 · O 실지급 */
    }).map(([이름]) => 이름)
    봐(X.수식 === 0 && !엑다름.length, `${기기} ${벌} ${끝달} 값만 엑셀 = 손셈 · 수식 0`, `수식 ${X.수식} · ${엑다름}`)
    // 🖨 인쇄 — A4 가로 세 덩어리
    await A.locator('button', { hasText: '지급명세서 인쇄' }).click()
    await A.waitForTimeout(300)
    await A.emulateMedia({ media: 'print' })
    const 인 = await A.evaluate(() => ({ n: window.__인쇄 || 0, 몸: document.body.classList.contains('tp-print-bill'), 대장: [...document.querySelectorAll('.nm-printonly .tp-grid tbody tr')].filter((tr) => tr.offsetParent !== null).length, 줄: [...document.querySelectorAll('table.tp-lb tbody tr')].filter((tr) => tr.offsetParent !== null).length, 신고: [...document.querySelectorAll('table.nm-rep tbody tr')].filter((tr) => tr.offsetParent !== null).length }))
    const 사람수 = Object.keys(S.답[벌][끝달]).length
    봐(인.n === 1 && 인.몸 && 인.대장 >= 사람수 && 인.줄 === 사람수 + 1 && 인.신고 === 사람수 + 1, `${기기} ${벌} 인쇄 — 출역 대장 · 지급 명세 · 신고용 집계가 인쇄에 보임`, JSON.stringify(인))
    if (기기 === 'PC') await A.locator('.tp-bill').screenshot({ path: path.join(폴더, `G367_${벌}_${끝달}_인쇄.png`) })
    await A.emulateMedia({ media: 'screen' })
    await A.evaluate(() => document.body.classList.remove('tp-print-bill'))
    if (기기 === 'PC' || 벌 === 'B') await A.locator('.tp-bill').screenshot({ path: path.join(폴더, `G367_${기기}_${벌}_${끝달}.png`) })
    if (기기 === '폰') 봐((await A.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1, `${기기} ${벌} 폰 가로 넘침 없음`)
    봐(!오류.length, `${기기} ${벌} 화면 오류 0`, 오류.join(' | '))
    await 판.close()
  }
}
await 브.close()
console.log(`\n${ok} 통과 · ${bad} 실패`)
process.exit(bad ? 1 : 0)
