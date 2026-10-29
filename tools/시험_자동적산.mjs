// ⚡ G363 도면 물량 자동(/jeoksan/auto) «다른 예시 세 벌» 화면 시험 — PC · 폰
//   도면(가상 · tools/자동적산_시험도면.py) 을 넣으면 누르지 않고 나온 물량 = 손셈(자동적산_답.json · 도면을 다시 읽어 따로 잰 값과 같음 — 자동적산_답셈.py)
//   A 토목(두 장 한꺼번에 — 횡단면도 + 평면도): 철근(길이 mm · 총길이 m 섞임 — 검산 알림 0) · 수량표 · 고르지 않은 측점 토공 · 호 · 볼록 관로 · 현황 끔 · 위치도 뺌
//   B 건축: 실 6 · 마감 12 · 창호 대조(일람표 5 ≠ 평면 4)
//   C 조경: 원 · 반원 끝 면적 · 묶음 블록 · 부품 블록 · MINSERT · 범례 · 위치도 · 내역 대조 → 물량 넣은 내역서(빈 칸만)
//   + ⬇ 엑셀: 산출서 수량 칸(=ROUND 식)을 LibreOffice 로 다시 셈 = 화면 수량 · 화면 오류 0 · 폰 가로 넘침 0
//   돌리기: 4998 에 화면 빌드를 얹은 뒤 node tools/시험_자동적산.mjs [PC|폰|모두] (데이터베이스는 가짜 — 진짜 사이트에 세지 않음)
import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'
import { execFileSync } from 'child_process'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 주소 = process.env.B || 'http://127.0.0.1:4998'
const 기기들 = (process.argv[2] || '모두') === '모두' ? ['PC', '폰'] : [process.argv[2]]
import { fileURLToPath } from 'url'
const D = fileURLToPath(new URL('./시험자료/', import.meta.url))
const 답 = JSON.parse(fs.readFileSync(D + '자동적산_답.json', 'utf8'))
const 폴더 = '/tmp/g10/jauto/ui'
fs.mkdirSync(폴더, { recursive: true })
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log(c ? '✓' : '✗', m, 더) }
/** 한글 경로는 이 시험 기계의 Playwright 가 조용히 못 넣음(바뀜 사건이 안 일어남) → 바이트로 넣음 · 화면은 한글 파일 이름 그대로 받음 */
const 파일로 = (p) => ({ name: path.basename(p), mimeType: /xlsx$/.test(p) ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/dxf', buffer: fs.readFileSync(p) })
const 셋 = (v) => Math.round(v * 1000) / 1000
const 같나 = (a, b) => Math.abs(셋(a) - 셋(b)) < 0.0015

/** 엑셀 → LibreOffice 로 다시 셈 → 시트마다 {칸: 값} */
function 엑셀값(파일) {
  const rd = path.join(폴더, 're')
  fs.mkdirSync(rd, { recursive: true })
  execFileSync('soffice', ['--headless', '--calc', '--convert-to', 'xlsx', '--outdir', rd, 파일], { stdio: 'ignore', timeout: 120000 })
  const py = `
import json,sys,openpyxl
wb=openpyxl.load_workbook(sys.argv[1],data_only=True)
print(json.dumps({ws.title:[[c for c in r] for r in ws.iter_rows(values_only=True)] for ws in wb},ensure_ascii=False,default=str))`
  return JSON.parse(execFileSync('python3', ['-c', py, path.join(rd, path.basename(파일))], { encoding: 'utf8', maxBuffer: 64 << 20 }))
}
const 엑셀식 = (파일, 시트) => JSON.parse(execFileSync('python3', ['-c', `
import json,sys,openpyxl
ws=openpyxl.load_workbook(sys.argv[1])[sys.argv[2]]
print(json.dumps([[c for c in r] for r in ws.iter_rows(values_only=True)],ensure_ascii=False,default=str))`, 파일, 시트], { encoding: 'utf8' }))

/** 화면의 «물량 전부» 줄 */
const 줄읽기 = (A) => A.$$eval('table.gg-calc tbody tr', (trs) => trs.map((tr) => {
  const td = tr.querySelectorAll('td')
  return { 켬: td[0].querySelector('input').checked, 구분: td[2].innerText.trim(), 품명: td[3].querySelector('input').value, 규격: td[4].querySelector('input').value, 단위: td[5].innerText.trim(), 수량: Number(td[6].querySelector('b').innerText.replace(/,/g, '')), 근거: td[7].innerText }
}))

/** 기대: [구분 앞말, 품명(정규식), 단위, 값, 켬] */
const 기대 = {
  A: [
    ...Object.entries(답.A.철근).map(([d, v]) => ['철근', new RegExp('^철근$'), 'kg', v.kg, true, d]),
    ['도면 수량표', /^레미콘$/, 'm3', 답.A.수량['레미콘|m3'], true], ['도면 수량표', /^흄관$/, 'm', 답.A.수량['흄관|m'], true], ['도면 수량표', /^맨홀뚜껑$/, '개', 답.A.수량['맨홀뚜껑|개'], true],
    ...Object.entries(답.A.토공).map(([n, v]) => ['토공', new RegExp('^' + n.replace(/[()]/g, '\\$&') + '$'), n.includes('길이') ? 'm²' : 'm³', v, true]),
    ['레이어 면적', /^아스콘 포장$/, 'm²', 답.A.면적['아스콘포장'], true], ['레이어 길이', /^측구$/, 'm', 답.A.길이['L형측구'], true], ['레이어 길이', /^경계석$/, 'm', 답.A.길이['경계석'], true],
    ['레이어 길이', /^우수관로$/, 'm', 답.A.길이['우수관-계획'], true], ['레이어 길이', /^우수관로$/, 'm', 50, false],
    ['블록 개수', /빗물받이/, '개', 6, true], ['블록 개수', /맨홀/, '개', 5, true], ['블록 개수', /가로등/, '개', 3, true], ['블록 개수', /^위치도$/, '개', 1, false],
  ],
  B: [
    ...Object.entries(답.B.창호).map(([k, [, n]]) => ['창호', new RegExp('^창호 ' + k + '$'), '개소', n, true]),
    ['실 면적', /실 면적 합계/, 'm²', 답.B.실합, true],
    ...Object.entries(답.B.마감).map(([k, v]) => { const [품, 단] = k.split('|'); return ['마감', new RegExp('^' + 품 + '$'), 단 === 'm2' ? 'm²' : 'm', v, true] }),
  ],
  C: [
    ['레이어 면적', /^잔디$/, 'm²', 답.C.면적['L-잔디'], true], ['레이어 면적', /^블록 포장$/, 'm²', 답.C.면적['L-투수블록포장'], true],
    ['레이어 길이', /^경계석$/, 'm', 답.C.길이['L-경계석'], true], ['레이어 길이', /^울타리$/, 'm', 답.C.길이['L-울타리'], true],
    ['블록 개수', /\(소나무\)/, '개', 답.C.블록['소나무'], true], ['블록 개수', /\(이팝나무\)/, '개', 답.C.블록['이팝나무'], true], ['블록 개수', /^볼라드$/, '개', 답.C.블록['볼라드'], true],
    ['블록 개수', /\(벤치\)/, '개', 답.C.블록['벤치'], true], ['블록 개수', /\(보안등\)/, '개', 답.C.블록['보안등'], true], ['블록 개수', /\(수목군A\)/, '개', 2, false], ['블록 개수', /^KEYPLAN$/, '개', 1, false],
    ...Object.entries(답.C.수량).map(([k, v]) => { const [품, 단] = k.split('|'); return ['도면 수량표', new RegExp('^' + 품 + '$'), 단, v, true] }),
  ],
}
const 단위꼴 = (u) => String(u).replace(/\(.*?\)/g, '').replace(/\s/g, '').replace(/㎡|m2$/, 'm²').replace(/㎥|m3$/, 'm³')     // 화면은 ㎡(헤베) · ㎥(루베)
const 단위같나 = (화면, 기) => 단위꼴(화면) === 단위꼴(기)

const 브 = await chromium.launch()
for (const 기기 of 기기들) {
  const w = 기기 === '폰' ? 390 : 1280
  for (const 벌 of ['A', 'B', 'C']) {
    const 판 = await 브.newContext({ viewport: { width: w, height: 860 }, acceptDownloads: true, deviceScaleFactor: 기기 === '폰' ? 2 : 1 })
    await 판.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
    await 판.route(/firebaseio\.com/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
    await 판.addInitScript(() => { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); try { sessionStorage.setItem('kcm_notice_seen', '2026-10-업체') } catch (e) {} })
    const A = await 판.newPage()
    const 오류 = []
    A.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
    await A.goto(주소 + '/jeoksan/auto', { waitUntil: 'domcontentloaded' })
    await A.waitForSelector('input[type=file][accept*="dxf"]', { state: 'attached', timeout: 20000 })
    await A.waitForLoadState('networkidle').catch(() => {})
    await A.setInputFiles('input[type=file][accept*="dxf"]', (벌 === 'A' ? ['A_횡단', 'A_평면'] : [벌]).map((n) => 파일로(D + `자동적산_${n}.dxf`)))   // A 는 두 장 한꺼번에
    await A.waitForFunction(() => document.querySelectorAll('table.gg-calc tbody tr').length > 0, null, { timeout: 30000 })
    await A.waitForTimeout(500)
    const 줄 = await 줄읽기(A)
    const 쓴 = new Set()
    for (const [구, re, 단, v, 켬, 규] of 기대[벌]) {
      const i = 줄.findIndex((x, k) => !쓴.has(k) && x.구분.startsWith(구) && re.test(x.품명) && (!규 || x.규격.startsWith(규)) && 단위같나(x.단위, 단) && 같나(x.수량, v) && x.켬 === 켬)
      if (i >= 0) 쓴.add(i)
      봐(i >= 0, `${기기} ${벌} ${구} ${re.source}${규 ? ' ' + 규 : ''} = ${셋(v)} ${단}${켬 ? '' : ' (꺼 둠)'}`, i >= 0 ? '' : JSON.stringify(줄.filter((x) => re.test(x.품명)).map((x) => [x.구분, x.품명, x.규격, x.단위, x.수량, x.켬])))
    }
    const 남 = 줄.filter((x, k) => !쓴.has(k) && x.켬)
    봐(!남.length, `${기기} ${벌} 기대 밖 켠 줄 없음`, JSON.stringify(남.map((x) => [x.구분, x.품명, x.수량])))
    if (벌 === 'A') {
      const 검산 = await A.evaluate(() => document.body.innerText.match(/≠ 적힌 총길이[^\n]*/g) || [])
      봐(!검산.length, `${기기} A 철근 재료표 (길이 mm · 총길이 m) 검산 잘못 알림 없음`, 검산.slice(0, 2).join(' | '))
    }
    if (벌 === 'C') {
      const 근 = 줄.find((x) => /\(이팝나무\)/.test(x.품명))
      봐(근 && /바로 넣은 것 5 \+ 묶음 블록 안 «수목군A» 6/.test(근.근거), `${기기} C 이팝나무 근거 — 바로 5 + 수목군A 안 6`, 근 ? 근.근거 : '')
    }
    // ⬇ 엑셀 — 산출서 수량 칸 = 화면 수량 (LibreOffice 로 다시 셈)
    const [dl] = await Promise.all([A.waitForEvent('download', { timeout: 30000 }), A.locator('.gg-head button', { hasText: '엑셀 받기' }).first().click()])
    const 파일 = path.join(폴더, `${기기}_${벌}_산출서.xlsx`)      // 이 시험 기계의 headless 는 한글 받을 이름을 «download» 로 바꿈 → 이름은 여기서
    await dl.saveAs(파일)
    const 값 = 엑셀값(파일)
    const 식 = 엑셀식(파일, '산출서')
    const 켠 = 줄.filter((x) => x.켬)
    const 산 = (값['산출서'] || []).slice(1).filter((r) => r[0] !== null)
    봐(산.length === 켠.length, `${기기} ${벌} 엑셀 산출서 줄 = 화면 켠 줄`, `${산.length} / ${켠.length} (화면 모든 줄 ${줄.length})`)
    let 틀 = 0
    산.forEach((r, k) => { const x = 켠[k]; if (!x || r[2] !== x.품명 || !같나(+r[6], x.수량)) { 틀++; if (틀 < 4) console.log('   엑셀', JSON.stringify(r.slice(1, 7)), '화면', x && [x.품명, x.수량]) } })
    봐(!틀, `${기기} ${벌} 엑셀 수량(다시 셈) = 화면 수량`, 틀 ? 틀 + '줄 다름' : '')
    // 엑셀은 받기 전 검사를 거쳐 값만으로 받음(식 없음 — 소장님 원칙) · 철근 재료표 · 도면 수량표 · 토공 줄도 값(G449 때 옛 «=식» 기대를 고침)
    const 식행 = 식.slice(1).filter((r) => r[0] !== null)
    const 식틀 = 식행.filter((r) => typeof r[6] === 'string' && r[6].startsWith('='))
    봐(!식틀.length && 식행.length === 산.length, `${기기} ${벌} 엑셀 수량 칸 — 모든 줄 값(식 없음)`, 식틀.slice(0, 3).map((r) => r[1] + ' ' + r[2] + ' ' + r[6]).join(' | '))
    if (벌 === 'A') {
      const 토 = Object.keys(값).find((n) => n.startsWith('토공'))
      const 합 = 토 && 값[토].find((r) => r[0] === '합계')
      봐(!!합 && 같나(합[2], 80), `${기기} A 엑셀 토공 시트 — 구간 합 80 m (12.5 · 7.5 m 구간 포함)`, 합 ? String(합[2]) : '')
      const 철 = 값['철근 재료표']
      봐(!!철 && 같나(철.slice(1).reduce((s, r) => s + (+r[9] || 0), 0), Object.values(답.A.철근).reduce((s, v) => s + v.kg, 0)), `${기기} A 엑셀 철근 재료표 무게 합`, 철 ? String(셋(철.slice(1).reduce((s, r) => s + (+r[9] || 0), 0))) : '')
    }
    if (벌 === 'B') {
      const 창 = Object.entries(값).find(([n]) => n.includes('창호 대조'))
      const aw = 창 && 창[1].find((r) => r[0] === 'AW1')
      봐(!!aw && aw[4] === 5 && aw[5] === 4 && aw[6] === '다름', `${기기} B 엑셀 창호 대조 — AW1 일람표 5 · 평면 4 · 다름`, aw ? JSON.stringify(aw) : '')
      const 실 = Object.entries(값).find(([n]) => /실$/.test(n))
      봐(!!실 && 실[1].length - 1 === 6 && 같나(실[1].slice(1).reduce((s, r) => s + r[2], 0), 답.B.실합), `${기기} B 엑셀 실 시트 6실 · 면적 합 ${답.B.실합}`)
    }
    // C — 내역 대조 → 물량 넣은 내역서
    if (벌 === 'C') {
      await A.setInputFiles('input[type=file][accept*="xlsx"]', 파일로(D + '자동적산_C_내역.xlsx'))
      await A.waitForSelector('table.ja-cmp tbody tr', { timeout: 20000 })
      await A.waitForTimeout(300)
      const 대 = await A.$$eval('table.ja-cmp tbody tr', (trs) => trs.map((tr) => { const td = tr.querySelectorAll('td'); const s = td[5].querySelector('select'); return { 품명: td[1].innerText.trim(), 짝: s ? s.options[s.selectedIndex].text : '', 도면: td[6].innerText.trim(), 판정: td[9].innerText.trim() } }))
      const 판 = (n) => 대.find((r) => r.품명 === n) || {}
      봐(/내역 수량 없음/.test(판('잔디식재').판정) && /잔디/.test(판('잔디식재').짝), `${기기} C 대조 잔디식재 (빈 칸) ↔ 도면 잔디`, JSON.stringify(판('잔디식재')))
      봐(/내역 수량 없음/.test(판('이팝나무').판정) && /이팝나무/.test(판('이팝나무').짝) && /11/.test(판('이팝나무').도면), `${기기} C 대조 이팝나무 (빈 칸) ↔ 도면 11`, JSON.stringify(판('이팝나무')))
      봐(/도면이 적음/.test(판('경계석 설치').판정), `${기기} C 대조 경계석 30 ↔ 도면 29.425 → 도면이 적음`, JSON.stringify(판('경계석 설치')))
      for (const n of ['소나무', '볼라드', '울타리', '투수블록 포장']) 봐(/같음/.test(판(n).판정), `${기기} C 대조 ${n} 같음`, JSON.stringify(판(n)))
      const [dl2] = await Promise.all([A.waitForEvent('download', { timeout: 30000 }), A.locator('button', { hasText: '물량 넣은 내역서 받기' }).click()])
      const 파일2 = path.join(폴더, `${기기}_C_물량넣음.xlsx`)
      await dl2.saveAs(파일2)
      const 내 = 엑셀식(파일2, '내역서')
      const 줄2 = (n) => 내.find((r) => r[1] === n) || []
      봐(같나(+줄2('잔디식재')[4], 답.C.면적['L-잔디']) || 같나(+줄2('잔디식재')[4], 72.57), `${기기} C 넣은 내역서 잔디식재 수량 = 도면`, String(줄2('잔디식재')[4]))
      봐(+줄2('이팝나무')[4] === 11, `${기기} C 넣은 내역서 이팝나무 = 11`, String(줄2('이팝나무')[4]))
      봐(+줄2('경계석 설치')[4] === 30 && +줄2('소나무')[4] === 7, `${기기} C 넣은 내역서 — 수량 있던 칸은 그대로(경계석 30 · 소나무 7)`)
      봐(String(줄2('잔디식재')[6]).startsWith('='), `${기기} C 넣은 내역서 금액 식 그대로`, String(줄2('잔디식재')[6]))
    }
    // 탭 둘러보기 — ② ~ ⑦ 이 오류 없이 뜨나 · ⑥ 블록 개수 = ① 과 같은 셈
    for (const 탭 of ['② 골조', '④ 도면의 표', '⑤ 토공', '⑥ 레이어', '⑦ 실', '③ 내역 대조', '① 물량 전부']) {
      await A.locator('button', { hasText: 탭 }).first().click()
      await A.waitForTimeout(350)
      if (기기 === '폰') 봐((await A.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1, `${기기} ${벌} ${탭} 탭 폰 가로 넘침 없음`)
      if (탭 === '⑥ 레이어') {
        const 블 = await A.$$eval('.ja-tbl table tbody tr', (trs) => trs.map((tr) => [...tr.querySelectorAll('td')].map((td) => td.innerText.trim())).filter((r) => r.length === 4))
        const 수 = (n) => { const r = 블.find((x) => x[1].startsWith(n)); return r ? r[2] : '' }   // 이름 칸 = 이름 + 뜻 표시(띄어 씀 없이 붙어 읽힘)
        if (벌 === 'C') {
          봐(/^11\b/.test(수('이팝나무')) && /묶음 안 6/.test(수('이팝나무')), `${기기} C ⑥ 이팝나무 11 (묶음 안 6) — ① 과 같음`, 수('이팝나무'))
          봐(/^10\b/.test(수('볼라드')), `${기기} C ⑥ 볼라드 10 (MINSERT 2×3 포함)`, 수('볼라드'))
          봐(/^3\b/.test(수('보안등')) && !수('등기구'), `${기기} C ⑥ 보안등 3 · 등기구(부품)는 따로 안 셈`, 수('보안등') + ' / ' + 수('등기구'))
        }
        if (벌 === 'A') 봐(/^5\b/.test(수('맨홀(1호)')), `${기기} A ⑥ (평면도) 맨홀(1호) 5`, 수('맨홀(1호)'))
        if (기기 === '폰') {
          const 끝 = await A.evaluate(() => { const h = [...document.querySelectorAll('.detail-h')].find((d) => /^블록 \(/.test(d.innerText)); const t = h && h.nextElementSibling && h.nextElementSibling.querySelector('table'); const th = t && t.querySelectorAll('th')[2]; return th ? Math.round(th.getBoundingClientRect().right) : -1 })
          if (블.length) 봐(끝 > 0 && 끝 <= 390, `${기기} ${벌} ⑥ 블록 «개수» 칸이 폰 화면 안에`, String(끝))
        }
      }
      if (탭 === '⑦ 실' && 벌 === 'B') { const t = await A.evaluate(() => document.body.innerText); 봐(['사무실1', '회의실', '화장실(남)', '화장실(여)', '복도', '창고'].every((n) => t.includes(n)), `${기기} B ⑦ 실 6개 모두 보임`) }
    }
    if (기기 === '폰') 봐((await A.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1, `${기기} ${벌} 폰 가로 넘침 없음`)
    await A.screenshot({ path: path.join(폴더, `${기기}_${벌}.png`), fullPage: false })
    봐(!오류.length, `${기기} ${벌} 화면 오류 0`, 오류.join(' | '))
    await 판.close()
  }
}
await 브.close()
console.log(`\n${ok} 통과 · ${bad} 실패`)
process.exit(bad ? 1 : 0)
