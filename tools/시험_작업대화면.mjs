// 🧪 설계변경 작업대(/change/work) 화면 시험 — G379 (2026-10-23) · PC · 폰
//   가상 파일 세 벌을 lib 로 지어(공사명 모두 가상) 올리고 → 화면 숫자 = lib 셈 · 엑셀 만들기 · 내려받기 · 쓴 횟수(|작업대|…)
//     A 2줄 변경내역서 하나(.xlsx) → 순공사비 당초 · 변경 · 신규 · 없어진 품목 · 엑셀 6장
//     B 당초 1줄 + 변경 1줄 두 파일 → 짝지은 결과 = A 와 같은 합 · |작업대|짝짓기
//     C 조달수수료(% 줄) 변경 줄 금액 칸이 빈 2줄(G379 — 전엔 새 엑셀이 열릴 때 2억 원 넘게 부풂) → 화면 변경 합 0 · 받은 엑셀에 수식이 아닌 값
//   + 👁 이 화면 조회 · 폰 가로 넘침 없음 · 화면 오류 없음
//   REAL=폴더 를 주면 그 폴더의 실제 내역서(.xls · .xlsx)도 올려 화면 순공사비 = lib 셈인지 봅니다(캡처는 남기지 않음 — 공사명).
//   돌리기: 4998 에 화면 빌드를 얹은 뒤  node tools/시험_작업대화면.mjs [PC|폰|모두]
import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const { unzipSync, strFromU8 } = require('/tmp/g10/fm55/web/node_modules/fflate')
const V = await import('../web/src/lib/변경내역.js')
const { readWorkbook } = await import('../web/src/lib/qtoxlsx.js')
const { 격자로읽기: 비율읽기 } = await import('../web/src/lib/비율.js')
const { 원가표찾기 } = await import('../web/src/lib/낙찰맞추기.js')
const 주소 = process.env.B || 'http://127.0.0.1:4998'
const 기기들 = (process.argv[2] || '모두') === '모두' ? ['PC', '폰'] : [process.argv[2]]
const 폴더 = process.env.CAP || '/tmp/g10/g379/ui'
fs.mkdirSync(폴더, { recursive: true })
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log(c ? '✓' : '✗', m, c ? '' : 더) }
const 원 = (n) => Math.round(n).toLocaleString('ko-KR')

/* ── 가상 파일 짓기 ── */
const 머리 = [['', '가상 내역서'], [],
  ['공종', '품    명', '규   격', '수 량', '단위', '합    계', '', '노무비', '', '재료비', '', '경    비', '', '비    고'],
  ['', '', '', '', '', '단  가', '금   액', '단  가', '금   액', '단  가', '금   액', '단  가', '금   액', '']]
const 줄 = (이름, 규격, q, 단위, 노, 재, 경) => { const a = (u) => Math.floor(u * q + 1e-7); return ['', 이름, 규격, q, 단위, 노 + 재 + 경, a(노) + a(재) + a(경), 노, a(노), 재, a(재), 경, a(경), ''] }
const 변 = (q, 노, 재, 경, 이름 = '') => { const r = 줄(이름, '', q, '', 노, 재, 경); r[1] = 이름; return r }
const 공종 = (번호, 이름) => ['' + 번호, 이름, '', '', '', '', null, '', '', '', '', '', '', '']
const 표A = [...머리, 공종('●', '가상 마을안길 정비'), ['', ''], 공종('1.', '토 공'), ['', ''],
  줄('터파기', '백호0.7㎥', 100, '㎥', 643, 391, 322), 변(120, 643, 391, 322),
  줄('되메우기', '백호0.4㎥', 80, '㎥', 500, 100, 50), 변(0, 500, 100, 50),
  줄('성토다짐', '롤러', 0, '㎥', 0, 0, 0), 변(40, 211, 100, 96),
  공종('2.', '포장공'), ['', ''],
  줄('아스콘 표층', '#78 t=5cm', 400, '㎡', 2100, 9800, 800), 변(450, 2100, 9800, 800)]
const mA = V.시트읽기('내역서', 표A)
const 짓기 = (m, 할것) => Buffer.from(V.만들기(m, 할것))
const 파일 = {
  'A_가상_2줄변경내역서.xlsx': 짓기(mA, { 여러줄: [0, 1] }),
  'B_가상_당초.xlsx': 짓기(mA, { 한줄: 0, 빼기0: true }),
  'B_가상_변경.xlsx': 짓기(mA, { 한줄: 1, 빼기0: true }),
}
/* C — 조달수수료 % 줄(변경 줄 경비 금액 칸이 빔 · 합계 금액 0) — 원본 꼴 그대로 짓기 위해 표를 엑셀로(값 그대로) */
const 표C = [...머리, 공종('8.3', '가상 호안자재'), ['', ''],
  줄('옹벽블록', '500×450', 14035, '개', 0, 6700, 0), 변(0, 0, 6700, 0),
  ['', '조달수수료', '', 0.54, '%', 371322280, 584180, null, null, null, null, 371322280, 584180], ['', '', '', 0.54, '', 371322280, 0, null, null, null, null, 371322280, null]]
{
  /* 값만 든 아주 작은 xlsx — 공유 문자열 없이 inlineStr */
  const { zipSync, strToU8 } = require('/tmp/g10/fm55/web/node_modules/fflate')
  const 열 = (j) => { let s = ''; j++; while (j > 0) { const r = (j - 1) % 26; s = String.fromCharCode(65 + r) + s; j = Math.floor((j - 1) / 26) } return s }
  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  const rows = 표C.map((row, i) => `<row r="${i + 1}">` + row.map((v, j) => (v === null || v === '' || v === undefined ? '' : typeof v === 'number'
    ? `<c r="${열(j)}${i + 1}"><v>${v}</v></c>` : `<c r="${열(j)}${i + 1}" t="inlineStr"><is><t>${esc(v)}</t></is></c>`)).join('') + '</row>').join('')
  const NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main', R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
  파일['C_가상_조달수수료.xlsx'] = Buffer.from(zipSync({
    '[Content_Types].xml': strToU8('<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>'),
    '_rels/.rels': strToU8(`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/officeDocument" Target="xl/workbook.xml"/></Relationships>`),
    'xl/workbook.xml': strToU8(`<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="${NS}" xmlns:r="${R}"><sheets><sheet name="내역서" sheetId="1" r:id="rId1"/></sheets></workbook>`),
    'xl/_rels/workbook.xml.rels': strToU8(`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`),
    'xl/worksheets/sheet1.xml': strToU8(`<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="${NS}"><sheetData>${rows}</sheetData></worksheet>`),
  }))
}
const lib합 = (bufs) => {
  const ms = bufs.map((b) => { const r = V.파일읽기(readWorkbook(new Uint8Array(b)), 'x', { 한줄보강: 비율읽기 }); return r.시트들.find((x) => x.시트 === r.고른) })
  return V.요약(ms.length === 1 ? ms[0] : V.맞추기(ms, ms.map((_, i) => (i ? '변경' : '당초')))).합
}

const 브 = await chromium.launch({ env: { ...process.env, LANG: 'C.UTF-8', LC_ALL: 'C.UTF-8' } })
for (const 기기 of 기기들) {
  const 판 = await 브.newContext({ viewport: { width: 기기 === '폰' ? 390 : 1280, height: 900 }, locale: 'ko-KR', acceptDownloads: true, timezoneId: 'Asia/Seoul',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36' })
  await 판.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  const 셈 = []
  await 판.route(/firebaseio\.com/, (r) => { const q = r.request(); if (q.method() !== 'GET') 셈.push(decodeURIComponent(q.url())); r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }) })
  await 판.addInitScript(() => { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); try { sessionStorage.setItem('kcm_notice_seen', '2026-10-업체') } catch (e) {}; Object.defineProperty(navigator, 'webdriver', { get: () => false }) })
  const A = await 판.newPage()
  const 오류 = []
  A.on('pageerror', (e) => 오류.push(String(e).slice(0, 160)))
  const 창닫기 = async () => { await A.waitForTimeout(900); const x = A.locator('.askx'); if (await x.count()) await x.first().click().catch(() => {}) }
  const 올리기 = async (이름들, bufs) => {
    await A.goto(주소 + '/change/work', { waitUntil: 'domcontentloaded' })
    await A.waitForSelector('input[type=file]', { state: 'attached', timeout: 20000 })
    await A.locator('input[type=file]').first().setInputFiles(이름들.map((n, i) => ({ name: n, mimeType: 'application/octet-stream', buffer: bufs[i] })))
    await A.locator('.sec-title', { hasText: '② 한눈에' }).waitFor({ timeout: 30000 })
  }
  const 받기 = async (표, 기대이름) => {
    셈.length = 0
    await A.locator('button', { hasText: '엑셀 만들기' }).click()
    const 단추 = A.locator('button', { hasText: '내려받기' })
    await 단추.waitFor({ timeout: 30000 })
    await 창닫기()
    const [dl] = await Promise.all([A.waitForEvent('download', { timeout: 20000 }), 단추.click()])
    봐(dl.suggestedFilename() === 기대이름, `${기기} ${표} 받은 이름 ${기대이름}`, dl.suggestedFilename())
    const 저장 = path.join(폴더, `${기기}_${표}_${dl.suggestedFilename()}`)
    await dl.saveAs(저장)
    await A.waitForTimeout(500)
    return unzipSync(new Uint8Array(fs.readFileSync(저장)))
  }
  const 화면합 = async () => {
    const 글 = await A.locator('.card', { hasText: '② 한눈에' }).innerText()
    return 글
  }
  console.log(`— ${기기}`)
  /* A */
  await 올리기(['A_가상_2줄변경내역서.xlsx'], [파일['A_가상_2줄변경내역서.xlsx']])
  let 합 = lib합([파일['A_가상_2줄변경내역서.xlsx']])
  let 글 = await 화면합()
  봐(합.every((v) => 글.includes(원(v))), `${기기} A 화면 순공사비 당초 · 변경 = lib 셈 (${합.map(원).join(' · ')})`, 글.slice(0, 200))
  봐(/신규 품목\s*1/.test(글) && /없어진 품목\s*1/.test(글), `${기기} A 신규 1 · 없어진 1`, 글.slice(0, 300))
  await A.locator('.card', { hasText: '② 한눈에' }).scrollIntoViewIfNeeded()
  await A.screenshot({ path: `${폴더}/A_${기기}_한눈에.png` })
  let z = await 받기('A', 'A_가상_2줄변경내역서_작업대.xlsx')
  const 시트 = [...strFromU8(z['xl/workbook.xml']).matchAll(/<sheet name="([^"]+)"/g)].map((x) => x[1])
  봐(시트.join(',') === '내역서(변경),변경내역서,내역서총괄표,공사비증감대비표,공사비물량대비표,검산', `${기기} A 엑셀 시트 여섯 장`, 시트.join(','))
  봐(셈.some((u) => u.includes('|작업대|만듦')), `${기기} A 셈 |작업대|만듦`, 셈.join(' '))
  await A.locator('button', { hasText: '내려받기' }).scrollIntoViewIfNeeded()
  await A.screenshot({ path: `${폴더}/A_${기기}_받기.png` })
  /* B */
  await 올리기(['B_가상_당초.xlsx', 'B_가상_변경.xlsx'], [파일['B_가상_당초.xlsx'], 파일['B_가상_변경.xlsx']])
  글 = await 화면합()
  봐(합.every((v) => 글.includes(원(v))) && /파일끼리 짝지은 결과/.test(글), `${기기} B 두 파일 짝지은 합 = A 와 같음`, 글.slice(0, 200))
  z = await 받기('B', '설계변경_작업대.xlsx')
  봐(셈.some((u) => u.includes('|작업대|짝짓기')), `${기기} B 셈 |작업대|짝짓기`, 셈.join(' '))
  /* C */
  await 올리기(['C_가상_조달수수료.xlsx'], [파일['C_가상_조달수수료.xlsx']])
  합 = lib합([파일['C_가상_조달수수료.xlsx']])
  글 = await 화면합()
  봐(합[1] === 0 && 글.includes(원(합[0])), `${기기} C 변경 합 0 (조달수수료 빈 칸을 채우지 않음)`, 글.slice(0, 200))
  z = await 받기('C', 'C_가상_조달수수료_작업대.xlsx')
  /* 내역서(변경) · 변경내역서 — 조달수수료 변경 금액이 «수량 × 단가» 수식(엑셀이 열면 200,514,031)이 아니어야 함 (검산 시트의 «참고 — 다시 셈한 값» 은 그대로 둠) */
  const x1 = strFromU8(z['xl/worksheets/sheet1.xml']), x2 = strFromU8(z['xl/worksheets/sheet2.xml'])
  봐(!/200514031/.test(x1) && !/200514031/.test(x2), `${기기} C 받은 엑셀 내역서 · 변경내역서에 2억(200,514,031)이 없음`)
  /* REAL */
  if (process.env.REAL && 기기 === 'PC') {
    for (const 폴 of process.env.REAL.split(',')) for (const n of fs.readdirSync(폴).filter((f) => /\.(xlsx|xls|xlsm)$/i.test(f)).sort()) {
      const b = fs.readFileSync(path.join(폴, n))
      let 기대, 대 = null
      try {
        기대 = lib합([b])
        const 책 = readWorkbook(new Uint8Array(b)); const r = V.파일읽기(책, 'x', { 한줄보강: 비율읽기 }); const s0 = r.시트들.find((x) => x.시트 === r.고른)
        대 = V.노무대조(s0, 원가표찾기(책, r.시트들.filter((x) => !/원가/.test(x.시트)).map((x) => x.시트)))
      } catch (e) { continue }
      await 올리기([n], [b])
      글 = await 화면합()
      봐(기대.every((v) => 글.includes(원(v))), `실제 ${n} 화면 순공사비 = lib 셈 (${기대.map(원).join(' · ')})`, 글.slice(0, 160))
      const 카드 = await A.locator('.cw-file').first().innerText()
      if (대) 봐(대.다름 ? /직접노무비 [\d,]+원의 [\d.]+(배입니다|%뿐입니다)/.test(카드) : /원가계산서 직접노무비 .*맞습니다/.test(카드), `실제 ${n} 노무비 ↔ 원가계산서 직노 ${대.다름 ? '«다름» 알림' : '«맞음»'} (${(대.비 * 100).toFixed(1)}%)`, 카드.slice(0, 300))
      await 받기('실제' + n, n.replace(/\.(xlsx|xls|xlsm)$/i, '') + '_작업대.xlsx')
    }
  }
  봐(await A.locator('text=이 화면 조회').count() > 0, `${기기} 👁 이 화면 조회 보임`)
  if (기기 === '폰') { const w = await A.evaluate(() => document.scrollingElement.scrollWidth - window.innerWidth); 봐(w <= 1, `${기기} 가로 넘침 없음`, w) }
  봐(오류.length === 0, `${기기} 화면 오류 없음`, 오류.join(' | '))
  await 판.close()
}
await 브.close()
console.log(`\n${bad ? '❌' : '✅'} 작업대 화면 ${ok + bad}개 중 ${ok} 맞음 · ${bad} 틀림`)
process.exit(bad ? 1 : 0)
