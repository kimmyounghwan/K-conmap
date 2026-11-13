// 📄 G668 엑셀을 주지 않는 새 서식(forms.json noxlsx) 지킴 — 소장님 11-13 「그냥 pdf 만 제공하고 빈액셀 제공은 없기」 · 「빈엑셀 주면 다운 받아서 사용하면 땡 이잖아」
//   ① 파일(인터넷 없이): xlsx 를 사이트에 안 올림 · 인쇄용 PDF 는 그림(글꼴 0) · 격자 JSON 있음 · 서식 탭 칸 · 찾기 목록(forms-min) · 미리보기 그림
//   ② 화면(B=주소 가 있을 때 · PC 1280 · 폰 390): «⬇ 빈 틀 엑셀» 없음 · 쓰는 법에 «엑셀이 꼭 필요하면» 없음 · 한줄도 엑셀 말 없음 · 🖨 빈 서식 PDF 고리 ·
//      미리보기 아래 새서식말 · 페이지 글에 «엑셀» 0(머리 · 바닥 · 쿠팡 · 광고 칸 밖) · 화면 오류 0
//      + 엑셀을 주는 서식 하나는 전처럼(«⬇ 빈 틀 엑셀» · «엑셀이 꼭 필요하면» 있음) — 바꾼 것이 다른 서식을 건드리지 않았나
//   돌리기: node tools/시험_엑셀없는서식.mjs [주소]   (주소 없으면 ① 만)
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const 주소 = process.argv[2] || process.env.B || ''
const 읽기 = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'))
const D = 읽기('web/src/data/forms.json').forms
const TAB = 읽기('web/src/data/forms_tab.json')
const MINI = 읽기('web/src/data/forms-min.json')
const 안내 = 읽기('web/src/data/서식쓰기안내.json')
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else { bad++; console.log('✗', m, 더) } }

const 없는 = D.filter((f) => f.noxlsx)
const 있는 = D.find((f) => f.gen === 'forms2' && !f.noxlsx && f.slug === 'chulyeok-ilbo') || D.find((f) => f.gen === 'forms2' && !f.noxlsx)
봐(없는.length > 0, '엑셀 없는 서식이 하나 이상 있음', `${없는.length}`)
const 탭칸 = new Set(TAB.stages.flatMap((s) => s.slugs))
for (const f of 없는) {
  const pub = (p) => path.join(ROOT, 'web/public', p)
  봐(!fs.existsSync(pub(`forms/${f.slug}.xlsx`)), `${f.slug} 사이트에 xlsx 없음`)
  봐(f.gen === 'forms2', `${f.slug} gen forms2`, f.gen)
  봐(fs.existsSync(pub(`forms/g/${f.slug}.json`)), `${f.slug} 종이 JSON 있음`)
  const pdf = pub(`forms/v2/${f.slug}.pdf`)
  if (fs.existsSync(pdf)) {
    const 글 = fs.readFileSync(pdf).toString('latin1')
    봐(글.startsWith('%PDF') && !/\/Font/.test(글) && /\/Image/.test(글), `${f.slug} 인쇄용 PDF 는 그림(글꼴 0)`)
  } else 봐(false, `${f.slug} 인쇄용 PDF 있음`)
  봐(f.pdf === `/forms/v2/${f.slug}.pdf`, `${f.slug} forms.json pdf 고리`, f.pdf)
  봐(Array.isArray(f.prev) && f.prev.length > 0 && f.prev.every((p) => fs.existsSync(pub(p.replace(/^\//, '')))), `${f.slug} 미리보기 그림 다 있음`)
  봐(탭칸.has(f.slug), `${f.slug} 서식 탭(forms_tab stages) 칸에 있음`)
  봐(!!MINI[f.slug] && MINI[f.slug][0] === f.title, `${f.slug} 찾기 목록(forms-min) 에 같은 제목`)
  봐(!JSON.stringify(f).includes('무료'), `${f.slug} 글에 «무료» 없음`)
  봐(!/xlsx|엑셀/.test(JSON.stringify({ s: f.short, w: f.when, n: f.notes, g: f.guide })), `${f.slug} 설명 · 안내 글에 엑셀 말 없음`)
  // 🩹 G671 — «이렇게도 부릅니다»(also) · 제목 · 부제 · 첨부 · 차례 글도 화면에 나옴(거래명세서 also «거래명세서 엑셀» 을 화면 시험만 잡았음 → PC 올리기에도)
  봐(!/xlsx|엑셀/.test(JSON.stringify({ a: f.also, t: f.title, u: f.sub, at: f.attach, sh: f.sheet })), `${f.slug} 다른 이름 · 제목 · 첨부 · 차례 글에 엑셀 말 없음`,
    JSON.stringify((f.also || []).filter((x) => /엑셀/.test(x))))
}
/* 쓰는 법 안내 JSON — 셋째 칸(엑셀 없는 서식 글) 꼴 */
const 엑셀줄 = 안내.차례.filter((x) => /엑셀/.test(x[1]))
봐(엑셀줄.every((x) => x.length > 2), '쓰는 법에서 «엑셀» 이 든 줄은 모두 셋째 칸(엑셀 없을 때 글 또는 null)이 있음', 엑셀줄.filter((x) => x.length < 3).map((x) => x[0]).join(' · '))
봐(엑셀줄.every((x) => x[2] === null || !/엑셀/.test(x[2])), '셋째 칸 글엔 엑셀 말 없음')
봐(!!안내.한줄엑셀없음 && !/엑셀/.test(안내.한줄엑셀없음), '한줄엑셀없음 있음 · 엑셀 말 없음')

if (주소) {
  const require = createRequire(import.meta.url)
  let chromium
  try { ({ chromium } = require('playwright')) } catch (e) { ({ chromium } = createRequire('/tmp/g10/pw/package.json')('playwright')) }
  const 브 = await chromium.launch()
  for (const [기기, w] of [['PC', 1280], ['폰', 390]]) {
    const 판 = await 브.newContext({ viewport: { width: w, height: 900 } })
    await 판.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs|kakaocdn|coupang/, (r) => r.fulfill({ status: 200, body: '' }))
    await 판.route(/firebaseio\.com/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
    await 판.addInitScript(() => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체') } catch (e) {} })
    const A = await 판.newPage()
    let 오류 = []
    A.on('pageerror', (e) => 오류.push(String(e).slice(0, 160)))
    for (const f of 없는) {
      오류 = []
      await A.goto(`${주소}/forms/${f.slug}`, { waitUntil: 'domcontentloaded' })
      try { await A.waitForFunction(() => document.querySelectorAll('canvas.gx-page').length && document.querySelector('.gx-how'), null, { timeout: 25000 }) } catch (e) { 봐(false, `${기기} ${f.slug} 종이가 안 뜸`); continue }
      const r = await A.evaluate(() => {
        const 글 = (el) => (el ? el.textContent || '' : '')      // 접힌 «쓰는 법» 안 글까지(textContent)
        const 본 = document.querySelector('main') || document.body
        const 밖 = [...본.querySelectorAll('header, footer, nav, aside, .adc, .afit, .cpg, .cpc, .noti-band')]
        const 클론 = 본.cloneNode(true)
        클론.querySelectorAll('header, footer, nav, aside, .adc, .afit, .cpg, .cpc, .noti-band, script, style').forEach((e) => e.remove())
        const 단추 = [...document.querySelectorAll('a, button')].map((e) => e.textContent.trim())
        const 빈PDF = [...document.querySelectorAll('a')].find((a) => /빈 서식 PDF/.test(a.textContent))
        return {
          엑셀단추: 단추.filter((t) => /빈 틀 엑셀|엑셀 받기/.test(t)).length,
          안내: 글(document.querySelector('.gx-how')),
          본문엑셀: (클론.textContent.replace(/엑셀 변환 프로그램/g, '').match(/엑셀/g) || []).length,      // «그림 PDF — 엑셀 변환 프로그램으로 바뀌지 않음» 안내는 괜찮음(G584)
          본문엑셀곁: ((클론.textContent.replace(/엑셀 변환 프로그램/g, '').match(/.{0,30}엑셀.{0,30}/g)) || []).slice(0, 3),
          빈PDF: 빈PDF ? 빈PDF.getAttribute('href') : '',
          미리말: [...document.querySelectorAll('.flist li')].map((li) => li.textContent).join(' | '),
          넘침: document.documentElement.scrollWidth - innerWidth,
          xlsx고리: [...document.querySelectorAll('a[href$=".xlsx"]')].length,
          밖수: 밖.length,
        }
      })
      봐(r.엑셀단추 === 0, `${기기} ${f.slug} «빈 틀 엑셀» 단추 없음`, `${r.엑셀단추}`)
      봐(r.xlsx고리 === 0, `${기기} ${f.slug} .xlsx 고리 없음`, `${r.xlsx고리}`)
      봐(!/엑셀이 꼭 필요하면/.test(r.안내) && !/엑셀/.test(r.안내), `${기기} ${f.slug} 쓰는 법에 엑셀 말 없음`, r.안내.slice(0, 80))
      봐(r.안내.includes(안내.한줄엑셀없음.slice(0, 20)), `${기기} ${f.slug} 쓰는 법 한줄 = 엑셀 없을 때 글`)
      봐(r.본문엑셀 === 0, `${기기} ${f.slug} 본문 글에 «엑셀» 0`, JSON.stringify(r.본문엑셀곁))
      봐(r.빈PDF === `/forms/v2/${f.slug}.pdf`, `${기기} ${f.slug} 🖨 빈 서식 PDF 고리`, r.빈PDF)
      봐(/PDF 저장 · 🖨 인쇄로 그대로 받습니다/.test(r.미리말) && !/1행을 지우면/.test(r.미리말), `${기기} ${f.slug} 미리보기 아래 새서식말`, r.미리말.slice(0, 90))
      if (기기 === '폰') 봐(r.넘침 <= 1, `${기기} ${f.slug} 가로 넘침 0`, `${r.넘침}`)
      봐(오류.length === 0, `${기기} ${f.slug} 화면 오류 0`, 오류.join(' | '))
    }
    if (있는) {
      오류 = []
      await A.goto(`${주소}/forms/${있는.slug}`, { waitUntil: 'domcontentloaded' })
      try { await A.waitForFunction(() => document.querySelectorAll('canvas.gx-page').length && document.querySelector('.gx-how'), null, { timeout: 25000 }) } catch (e) { 봐(false, `${기기} ${있는.slug} 종이가 안 뜸`) }
      const r = await A.evaluate(() => ({
        엑셀단추: [...document.querySelectorAll('a, button')].filter((e) => /빈 틀 엑셀/.test(e.textContent)).length,
        안내: (document.querySelector('.gx-how') || {}).textContent || '',
      }))
      봐(r.엑셀단추 > 0, `${기기} (엑셀 주는 서식 ${있는.slug}) «빈 틀 엑셀» 그대로`)
      봐(/엑셀이 꼭 필요하면/.test(r.안내) && r.안내.includes(안내.한줄.slice(0, 15)), `${기기} (엑셀 주는 서식) 쓰는 법 그대로`)
      봐(오류.length === 0, `${기기} (엑셀 주는 서식) 화면 오류 0`, 오류.join(' | '))
    }
    await 판.close()
  }
  await 브.close()
}
console.log(`\n시험_엑셀없는서식 ${ok}/${ok + bad}${주소 ? '' : ' (화면 빼고 — 주소를 주면 화면까지)'}`)
process.exit(bad ? 1 : 0)
