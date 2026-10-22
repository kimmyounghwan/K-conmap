// ⚡ G365 공사서류 원클릭(/tools/wonclick) «다른 예시 세 벌» 화면 시험 — PC · 폰
//   칸을 사람처럼 쳐서 채움(돈 칸은 쉼표 없이 · 날짜 · 고르기) → «화면에서 보기» → ⬇ 받기
//   받은 엑셀(값만) = 같은 입력을 틀에 바로 넣어 사이트 셈(엑셀수식.js)으로 센 값 — 573식 × 세 벌
//   (사이트 셈 = LibreOffice 다시 셈 · 손셈은 tools/시험_원클릭셈.mjs) · 받은 엑셀에 수식 0 · 화면 오류 0 · 폰 가로 넘침 0
//   돌리기: 4998 에 화면 빌드를 얹은 뒤 node tools/시험_원클릭.mjs [PC|폰|모두]  (데이터베이스는 가짜 — 진짜 사이트에 세지 않음)
import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { execFileSync } from 'child_process'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 여기 = path.dirname(fileURLToPath(import.meta.url))
const W = path.join(여기, '..', 'web')
const 가져 = (p) => import(pathToFileURL(path.join(W, p)).href)
const { 엑셀읽기 } = await 가져('src/lib/엑셀읽기.js')
const { 셈판 } = await 가져('src/lib/엑셀수식.js')
const { fillWorkbook } = await 가져('src/lib/wonclick.js')
const META = JSON.parse(fs.readFileSync(path.join(W, 'src/data/wonclick.json'), 'utf8'))
const tpl = new Uint8Array(fs.readFileSync(path.join(W, 'public/tools/files/k-conmap-wonclick.xlsx')))
const 세벌 = JSON.parse(fs.readFileSync(path.join(여기, '시험자료/원클릭_세벌.json'), 'utf8'))
const 주소 = process.env.B || 'http://127.0.0.1:4998'
const 기기들 = (process.argv[2] || '모두') === '모두' ? ['PC', '폰'] : [process.argv[2]]
const 폴더 = '/tmp/g10/g365/ui'
fs.mkdirSync(폴더, { recursive: true })
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log(c ? '✓' : '✗', m, 더) }

/** 받은 엑셀 → {시트!칸: 값} (날짜 꼴 칸도 일련번호 그대로 · XML 에서 바로) */
const 칸값들 = (p) => JSON.parse(execFileSync('python3', ['-c', `
import json,sys,zipfile
import xml.etree.ElementTree as ET
ns={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
z=zipfile.ZipFile(sys.argv[1]);ss=[]
if 'xl/sharedStrings.xml' in z.namelist():
  for si in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si',ns): ss.append(''.join(t.text or '' for t in si.iter('{%s}t'%ns['m'])))
wb=ET.fromstring(z.read('xl/workbook.xml'));rel=ET.fromstring(z.read('xl/_rels/workbook.xml.rels'));rid={r.get('Id'):r.get('Target') for r in rel}
out={};nf=0
for sh in wb.find('m:sheets',ns):
  t=rid[sh.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')].lstrip('/');t=t if t.startswith('xl/') else 'xl/'+t
  for c in ET.fromstring(z.read(t)).iter('{%s}c'%ns['m']):
    if c.find('m:f',ns) is not None: nf+=1
    v=c.find('m:v',ns);ty=c.get('t')
    if ty=='inlineStr': val=''.join(x.text or '' for x in c.iter('{%s}t'%ns['m']))
    elif v is None or v.text is None: val=''
    elif ty=='s': val=ss[int(v.text)]
    elif ty in ('str','e'): val=v.text
    elif ty=='b': val=v.text=='1'
    else: val=float(v.text)
    out[sh.get('name')+'!'+c.get('r')]=val
print(json.dumps({'칸':out,'수식':nf},ensure_ascii=False))`, p], { encoding: 'utf8', maxBuffer: 64 << 20 }))

/** 같은 입력을 틀에 바로 — 사이트 셈 값(수식 칸만) */
function 셈값(벌) {
  const v = {}
  for (const i of META.inputs) if (세벌[벌][i.key] !== undefined) v[i.key] = 세벌[벌][i.key]
  const 책 = 엑셀읽기(fillWorkbook(tpl, META, v, META.docs.map((d) => d.sheet)))
  const 셈 = 셈판(책)
  const o = {}
  for (const s of 책.시트들) for (const [ref, x] of s.칸) if (x.f && s.이름 !== '처음') { const r = 셈.칸값(s.이름, x.행, x.열); o[s.이름 + '!' + ref] = r && typeof r === 'object' && '오류' in r ? r.오류 : r }
  return o
}
const 같나 = (a, b) => {
  if (a === null || a === undefined) a = ''
  if (b === null || b === undefined) b = ''
  if (typeof a === 'boolean') a = a ? 1 : 0
  if (typeof b === 'boolean') b = b ? 1 : 0
  if (typeof a === 'number' || typeof b === 'number') return Number(a) === Number(b) || Math.abs(Number(a) - Number(b)) <= 1e-9 * Math.max(1, Math.abs(Number(b)))
  return String(a) === String(b)
}

const 브 = await chromium.launch()
for (const 기기 of 기기들) {
  for (const 벌 of ['A', 'B', 'C']) {
    const 판 = await 브.newContext({ viewport: { width: 기기 === '폰' ? 390 : 1280, height: 860 }, acceptDownloads: true })
    await 판.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
    await 판.route(/firebaseio\.com/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
    await 판.addInitScript(() => { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); try { sessionStorage.setItem('kcm_notice_seen', '2026-10-업체') } catch (e) {} })
    const A = await 판.newPage()
    const 오류 = []
    A.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
    await A.goto(주소 + '/tools/wonclick', { waitUntil: 'domcontentloaded' })
    await A.waitForSelector('#wc-공사명', { timeout: 20000 })
    await A.evaluate(() => document.querySelectorAll('details.wc-sec').forEach((d) => { d.open = true }))
    // 사람처럼 — 돈은 쉼표 없이 치고(화면이 쉼표를 붙임) · 날짜는 달력 칸 · 고르기는 고름
    for (const i of META.inputs) {
      const 값 = 세벌[벌][i.key]
      if (값 === undefined || 값 === '') continue
      const 칸 = A.locator('#wc-' + i.key)
      if (i.type === 'list') await 칸.selectOption(String(값))
      else if (i.type === 'money') { await 칸.click(); await 칸.pressSequentially(String(값).replace(/,/g, ''), { delay: 0 }) }
      else await 칸.fill(String(값))
    }
    await A.waitForTimeout(300)
    const 돈 = await A.locator('#wc-계약금액').inputValue()
    봐(돈 === 세벌[벌].계약금액, `${기기} ${벌} 돈 칸 — 쉼표 없이 쳐도 «${세벌[벌].계약금액}»`, 돈)
    // 📄 화면에서 보기
    await A.locator('button', { hasText: '화면에서 보기' }).click()
    await A.waitForFunction((n) => document.body.innerText.split(n).length > 2 && /일금 .+원정/.test(document.body.innerText), 세벌[벌].공사명, { timeout: 30000 }).catch(() => {})
    const 글 = await A.evaluate(() => document.body.innerText)
    봐(글.split(세벌[벌].공사명).length > 2 && /일금 .+원정/.test(글) && !/틀 파일을 받지 못했습니다/.test(글), `${기기} ${벌} 서류 화면에서 보기 — 서류에 공사명 · 일금 …원정`)
    // ⬇ 받기
    const [dl] = await Promise.all([A.waitForEvent('download', { timeout: 30000 }), A.locator('button.btn.primary').first().click()])
    const 파일 = path.join(폴더, `${기기}_${벌}.xlsx`)
    await dl.saveAs(파일)
    const 받 = 칸값들(파일)
    봐(받.수식 === 0, `${기기} ${벌} 받은 엑셀에 수식 0 (값만 — 폰 미리보기에도 숫자가 보임)`, String(받.수식))
    const 기대 = 셈값(벌)
    let n = 0, 틀 = 0
    const 보기 = []
    for (const [k, v] of Object.entries(기대)) { n++; if (!같나(받.칸[k], v)) { 틀++; if (보기.length < 6) 보기.push(`${k} 받음 ${JSON.stringify(받.칸[k])} ≠ 셈 ${JSON.stringify(v)}`) } }
    봐(!틀 && n > 500, `${기기} ${벌} 받은 엑셀 = 사이트 셈 (${n}칸)`, 보기.join(' | '))
    // 이번에 고친 셈 — 받은 엑셀의 입력 시트 아래 자동 계산 칸
    const C = (r) => 받.칸['입력!C' + r]
    const 서 = (s) => Math.round((new Date(s + 'T00:00:00Z') - Date.UTC(1899, 11, 30)) / 86400000)
    if (벌 === 'A') {
      봐(C(131) === 18 && C(132) === 30611111, `${기기} A 관급 · 기한 넘겨 신고 → 지체 18일(1/11 ~ 합격일 1/28) · 30,611,111원`, `${C(131)}일 · ${C(132)}`)
      const 청 = Object.entries(받.칸).find(([k, v]) => k.startsWith('27 준공대가 청구서') && /지체 18일/.test(String(v)))
      봐(!!청, `${기기} A 준공대가 청구서 «지체상금 (공제) 30,611,111원 (지체 18일)»`, 청 ? String(청[1]) : '')
    }
    if (벌 === 'B') 봐(C(129) === 서('2033-02-28') && C(131) === 0, `${기기} B 하자 5년 2028-02-29 시작 → 2033-02-28(민법 제160조 ③) · 민간 기한 안 준공 지체 0`, `${C(129)} · ${C(131)}`)
    if (벌 === 'C') {
      봐(C(131) === 497 && C(132) === 300000000 && C(146) === 300000000, `${기기} C 지체 497일 · 지체상금 계약금액 30% 한도 300,000,000원(국가계약법 시행령 제74조 ③)`, `${C(131)}일 · ${C(132)} · 한도 ${C(146)}`)
      봐(C(138) === 300000000, `${기기} C 준공금 청구액 = 10억 − 기성 4억 − 지체 3억 = 3억`, String(C(138)))
    }
    if (기기 === '폰') 봐((await A.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1, `${기기} ${벌} 폰 가로 넘침 없음`)
    봐(!오류.length, `${기기} ${벌} 화면 오류 0`, 오류.join(' | '))
    await 판.close()
  }
}
await 브.close()
console.log(`\n${ok} 통과 · ${bad} 실패`)
process.exit(bad ? 1 : 0)
