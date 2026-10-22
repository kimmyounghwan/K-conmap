// 🧮 G371 설계변경(/change · /change/calc) 화면 시험 — 도구 하나씩 · 다른 예시 세 벌 · PC · 폰
//   계산기: 사람처럼 계약금액 · 예정가격 · 항목(증가 · 감소 · 신규비목 · 발주기관 요구)을 쳐서 → 적용 단가 · 조정액 · 합계 = 손셈(파이썬 따로)
//     A 국가 87% — 증가(계약 < 예가) 30 × 45,000 · 감소 −20 × 23,456 · 신규 12.5 × 13,050 → 1,044,005
//     B 84.5% — 발주기관 요구 증가 (200,000 + 169,000) ÷ 2 = 184,500 × 30 · 신규 300 × 211,250 · 증가(계약 52,000 > 예가 50,000) 400 × 50,000 → 88,910,000
//        → 86% 미만 · 직접공사비 증액만 10.52% → «심의 · 승인» 알림(국가 제65조② · 지방 제74조③)
//     C 91.2345678% — 신규 7.25 × 30,411 · 발주기관 요구 신규 3 × 956,173 · 감소 −7.5 × 99,999(음수 버림 −749,992) → 2,339,006 · 86% 넘어 알림 없음
//   주제 8쪽(/change/{주제}) 열림 · 오류 0 · 단가 · 품셈 쪽 «2026년 5월 8일» 하반기 표준시장단가 · 폰 넘침 0
//   돌리기: 4998 에 화면 빌드를 얹은 뒤 node tools/시험_설계변경화면.mjs [PC|폰|모두]
import { createRequire } from 'module'
import fs from 'fs'
import { execFileSync } from 'child_process'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 주소 = process.env.B || 'http://127.0.0.1:4998'
const 기기들 = (process.argv[2] || '모두') === '모두' ? ['PC', '폰'] : [process.argv[2]]
const 폴더 = process.env.CAP || '/tmp/g10/g371/ui'
fs.mkdirSync(폴더, { recursive: true })
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log(c ? '✓' : '✗', m, c ? '' : 더) }
const 수 = (s) => Number(String(s).replace(/[^\d-]/g, '')) || 0
const 벌들 = {
  A: { ctr: '870000000', est: '1000000000', 율: '87.000%', 줄: [
    { 이름: '가상 L형측구', kind: '증가', q0: '120', q1: '150', upCtr: '45000', upEst: '47500', 단가: 45000, 액: 1350000 },
    { 이름: '가상 보도블록 철거', kind: '감소', q0: '80', q1: '60', upCtr: '23456', 단가: 23456, 액: -469120 },
    { 이름: '가상 배수판', kind: '신규비목', q1: '12.5', upNow: '15000', 단가: 13050, 액: 163125 }], 합: 1044005, 알림86: false },
  B: { ctr: '845000000', est: '1000000000', 율: '84.500%', 줄: [
    { 이름: '가상 흄관 D600', kind: '증가', 요구: true, q0: '50', q1: '80', upNow: '200000', 단가: 184500, 액: 5535000 },
    { 이름: '가상 옹벽 추가', kind: '신규비목', q1: '300', upNow: '250000', 단가: 211250, 액: 63375000 },
    { 이름: '가상 아스콘 포장', kind: '증가', q0: '1000', q1: '1400', upCtr: '52000', upEst: '50000', 단가: 50000, 액: 20000000 }], 합: 88910000, 알림86: '10.52%' },
  C: { ctr: '912345678', est: '1000000000', 율: '91.235%', 줄: [
    { 이름: '가상 투수블록', kind: '신규비목', q1: '7.25', upNow: '33333', 단가: 30411, 액: 220479 },
    { 이름: '가상 맨홀 인상', kind: '신규비목', 요구: true, q1: '3', upNow: '1000001', 단가: 956173, 액: 2868519 },
    { 이름: '가상 잔디 감소', kind: '감소', q0: '10', q1: '2.5', upCtr: '99999', 단가: 99999, 액: -749992 }], 합: 2339006, 알림86: false },
}
const 주제 = ['flow', 'price', 'unit', 'esc', 'period', 'mistake', 'case', 'docs']
const 브 = await chromium.launch()
for (const 기기 of 기기들) {
  const 판 = await 브.newContext({ viewport: { width: 기기 === '폰' ? 390 : 1280, height: 900 }, locale: 'ko-KR', acceptDownloads: true })
  await 판.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  await 판.route(/firebaseio\.com/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await 판.addInitScript(() => { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); try { sessionStorage.setItem('kcm_notice_seen', '2026-10-업체') } catch (e) {} })
  const A = await 판.newPage()
  const 오류 = []
  A.on('pageerror', (e) => 오류.push(String(e).slice(0, 160)))
  // ⓪ 처음 화면 — «예시 채우기» 한 번에 A 와 같은 가상 세 줄
  await A.goto(주소 + '/change/calc', { waitUntil: 'domcontentloaded' })
  await A.evaluate(() => localStorage.removeItem('kcm_chgcalc'))
  await A.reload({ waitUntil: 'domcontentloaded' })
  await A.waitForSelector('[aria-label="계약금액"]', { timeout: 20000 })
  await A.locator('button', { hasText: '예시 채우기' }).click()
  await A.waitForTimeout(200)
  봐(수(await A.locator('.ctotal b').first().innerText()) === 1044005 && (await A.locator('.cres').count()) === 3, `${기기} ⓪ 예시 채우기 → 가상 세 줄 · 합계 1,044,005`)
  await A.locator('button', { hasText: '처음부터' }).click()
  for (const [벌, S] of Object.entries(벌들)) {
    await A.goto(주소 + '/change/calc', { waitUntil: 'domcontentloaded' })
    await A.evaluate(() => localStorage.removeItem('kcm_chgcalc'))
    await A.reload({ waitUntil: 'domcontentloaded' })
    await A.waitForSelector('[aria-label="계약금액"]', { timeout: 20000 })
    await A.locator('[aria-label="계약금액"]').pressSequentially(S.ctr)
    if (벌 === 'C') {   // 🧮 낙찰률을 바로 넣기
      await A.locator('button', { hasText: '낙찰률을 바로 넣기' }).click()
      await A.locator('[aria-label="낙찰률"]').pressSequentially('91.2345678')
    } else await A.locator('[aria-label="예정가격"]').pressSequentially(S.est)
    if (벌 === 'A') 봐((await A.locator('[aria-label="계약금액"]').inputValue()) === '870,000,000' && (await A.locator('[aria-label="예정가격"]').inputValue()) === '1,000,000,000', `${기기} A 돈 칸 — 쉼표 없이 쳐도 «870,000,000» · «1,000,000,000»`)
    if (벌 === 'B') {   // 📋 엑셀에서 붙여넣기(가상 증감대비표 세 줄 · 머리줄 포함)
      await A.locator('button', { hasText: '엑셀에서 붙여넣기' }).click()
      const 글 = ['품명\t단위\t당초\t변경\t계약단가\t예정가격단가\t당시단가\t요구', ...S.줄.map((r) => [r.이름, 'm', r.kind === '신규비목' ? '' : r.q0, r.q1, r.upCtr || '', r.upEst || '', r.upNow || '', r.요구 ? 'O' : ''].join('\t'))].join('\n')
      await A.locator('[aria-label="엑셀에서 복사한 줄"]').fill(글)
      await A.locator('button', { hasText: '이 줄들 넣기' }).click()
      await A.waitForTimeout(200)
      const 말 = await A.locator('[role="status"]').first().innerText().catch(() => '')
      봐(/3줄을 넣었습니다 — 증가 2 · 감소 0 · 신규 1/.test(말), `${기기} B 엑셀에서 붙여넣기 — 머리줄 건너뛰고 3줄(증가 2 · 신규 1) · 발주기관 요구 O 읽음`, 말)
    } else {
      for (let i = 0; i < S.줄.length; i++) {
        if (i > 0) await A.locator('button', { hasText: '+ 항목 추가' }).click()
        const 카 = A.locator('.card', { has: A.locator(`input[placeholder^="항목 ${i + 1} ·"]`) }).first()
        const r = S.줄[i]
        await 카.locator(`input[placeholder^="항목 ${i + 1} ·"]`).fill(r.이름)
        await 카.locator('.chips button', { hasText: new RegExp('^' + r.kind + '$') }).click()
        if (r.요구) await 카.locator('.chips button', { hasText: '발주기관 요구' }).click()
        const 칸 = async (글, v) => { if (v === undefined) return; const l = 카.locator('.cgrid label', { has: A.locator('span', { hasText: new RegExp('^' + 글 + '$') }) }).locator('input'); await l.fill(''); await l.pressSequentially(v) }
        await 칸('당초 수량', r.q0); await 칸(r.kind === '신규비목' ? '수량' : '변경 수량', r.q1); await 칸('계약단가', r.upCtr); await 칸('예정가격단가', r.upEst); await 칸('변경 당시 단가', r.upNow)
      }
    }
    await A.waitForTimeout(250)
    const 율 = (await A.locator('.kv b.hi').first().innerText()).trim()
    봐(율 === S.율, `${기기} ${벌} 낙찰률 ${S.율}${벌 === 'C' ? '(바로 넣음 91.2345678)' : ''}`, 율)
    const 결과 = await A.$$eval('.cres', (els) => els.map((e) => [...e.querySelectorAll('b')].map((b) => b.innerText)))
    S.줄.forEach((r, i) => {
      const g = 결과[i] || []
      봐(수(g[0]) === r.단가 && 수(g[2]) === r.액, `${기기} ${벌} ${r.이름}(${r.kind}${r.요구 ? ' · 발주기관 요구' : ''}) 단가 ${r.단가.toLocaleString()} · 조정액 ${r.액.toLocaleString()} = 손셈`, JSON.stringify(g))
    })
    const 합 = 수(await A.locator('.ctotal b').first().innerText())
    봐(합 === S.합, `${기기} ${벌} 조정 합계 ${S.합.toLocaleString()} = 손셈`, String(합))
    const 알림 = A.locator('[data-k="86"]')
    if (S.알림86) {
      const t = (await 알림.count()) ? await 알림.innerText() : ''
      봐(/86% 미만/.test(t) && t.includes(S.알림86) && /제65조②/.test(t) && /제74조③/.test(t), `${기기} ${벌} 86% 미만 · 직접공사비 증액 ${S.알림86} → 심의 · 승인 알림(국가 제65조② · 지방 제74조③)`, t.slice(0, 200))
    } else 봐(!(await 알림.count()), `${기기} ${벌} 86% 알림 없음(낙찰률 86% 이상)`)
    if (벌 === 'B') {   // 제경비 · 부가세 승율 — 원가계산서 두 숫자로 셈 → 총 증감 · 변경 후 계약금액 · 86% 알림이 그 값으로
      await A.locator('button', { hasText: '원가계산서 두 숫자로 셈하기' }).click()
      await A.locator('[aria-label="총공사비"]').pressSequentially('1000000000')
      await A.locator('[aria-label="직접공사비"]').pressSequentially('700000000')
      await A.locator('button', { hasText: '승율 42.86% 넣기' }).click()
      await A.waitForTimeout(200)
      const 총 = await A.locator('.ctotal').innerText()
      봐((await A.locator('[aria-label="제경비 부가세 승율"]').inputValue()) === '42.86' && /127,016,826/.test(총) && /972,016,826/.test(총), `${기기} B 승율 42.86%(10억 ÷ 7억 − 1) → 총 증감 127,016,826 · 변경 후 계약금액 972,016,826`, 총.replace(/\n/g, ' ').slice(0, 300))
      const t2 = await 알림.innerText()
      봐(/총 증감 어림\(승율 42\.86%\)이 당초 계약금액의 15\.03%/.test(t2) && /10% 이상입니다/.test(t2), `${기기} B 86% 알림 — 총 증감 15.03% · «10% 이상입니다»`, t2.slice(0, 260))
      if (기기 === 'PC') { await A.locator('.ctotal').screenshot({ path: `${폴더}/G371_PC_B_승율.png` }); await 알림.screenshot({ path: `${폴더}/G371_PC_B_86알림.png` }) }
      // 📗 값만 엑셀
      const [dl] = await Promise.all([A.waitForEvent('download', { timeout: 20000 }), A.locator('button', { hasText: '값만 엑셀 받기' }).click()])
      const 파일 = `${폴더}/${기기}_B.xlsx`; await dl.saveAs(파일)
      const X = JSON.parse(execFileSync('python3', ['-c', `
import json,sys,zipfile,re
z=zipfile.ZipFile(sys.argv[1]);x=z.read('xl/worksheets/sheet1.xml').decode()
print(json.dumps({'수식':len(re.findall(r'<f>',x)),'수':[float(v) for v in re.findall(r'<v>([-0-9.]+)</v>',x)]}))`, 파일], { encoding: 'utf8' }))
      봐(X.수식 === 0 && [5535000, 63375000, 20000000, 88910000, 127016826, 972016826].every((n) => X.수.includes(n)), `${기기} B 값만 엑셀 — 수식 0 · 조정액 셋 · 합계 · 총 증감 · 변경 후 계약금액`, JSON.stringify(X).slice(0, 300))
    }
    if (기기 === '폰') 봐((await A.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1, `${기기} ${벌} 폰 가로 넘침 없음`)
  }
  // 주제 8쪽
  const 안열림 = []
  for (const s of 주제) {
    await A.goto(주소 + '/change/' + s, { waitUntil: 'domcontentloaded' })
    try { await A.waitForFunction(() => document.querySelectorAll('.card').length > 1 && document.body.innerText.length > 800, null, { timeout: 15000 }) } catch (e) { 안열림.push(s) }
    if (기기 === '폰' && (await A.evaluate(() => document.documentElement.scrollWidth - innerWidth)) > 1) 안열림.push(s + '(넘침)')
    if (s === 'unit') {
      const t = await A.locator('body').innerText()
      봐(/하반기 5월 8일/.test(t) && /반기 개정일\(2026년은 1월 1일 · 5월 8일\)/.test(t) && !/1월·7월 무렵/.test(t), `${기기} 단가 · 품셈 — 2026 하반기 표준시장단가 «5월 8일» (전엔 «1월·7월 무렵»)`)
    }
  }
  봐(!안열림.length, `${기기} 설계변경 주제 8쪽 모두 열림`, 안열림.join(','))
  await A.goto(주소 + '/change', { waitUntil: 'domcontentloaded' })
  await A.waitForFunction(() => document.body.innerText.length > 800, null, { timeout: 15000 }).catch(() => {})
  봐(/설계변경/.test(await A.locator('body').innerText()), `${기기} /change 첫 쪽 열림`)
  봐(!오류.length, `${기기} 화면 오류 0`, 오류.join(' | '))
  await 판.close()
}
await 브.close()
console.log(`\n${ok} 통과 · ${bad} 실패`)
process.exit(bad ? 1 : 0)
