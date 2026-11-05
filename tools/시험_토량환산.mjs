/**
 * 🧪 G553 토량환산계수(L·C) 환산기 — 🚚 덤프 대수 · 설명 글 바로잡음 (2026-11-05)
 *   lib 모드(주소 없이):  LANG=C.UTF-8 node tools/시험_토량환산.mjs          — tools.json 글 · 빠른찾기 낱말 · 셈 규칙
 *   화면 모드(구운 사이트): LANG=C.UTF-8 node tools/시험_토량환산.mjs http://127.0.0.1:4986   · OUT=폴더 면 화면 사진
 *   소장님 「사이트 토량환산계수 도구도 이상없는지 봐주고」 · 「토량환산계수도 봐줘. 질문자 요청이 토량환산계수 인것 같은데」
 *     (카페 «설계는 일반 토사 · 실제는 뻘 · 사토 운반 계수 — 감리단 계수 변경 불가»)
 *   ① 글: 옛 «암은 L 1.50~1.80 정도» 없앰(표준품셈 적용기준: 풍화암 1.30~1.35 · 연암 1.30~1.50 · 보통암 1.55~1.70 · 경암 1.70~2.00)
 *        «토질시험을 해서 적용하는 것이 원칙»(적용기준 «체적환산계수» (1)) · 덤프 대수 · 설계와 토질이 다르면(제19조의3) · 꼬리(«무료 계산기» 안 붙게)
 *   ② 셈: 자연 1,000 · L 1.25 · C 0.90 → 흐트러진 1250.0 · 다짐 900.0 / 흐트러진 1,250 넣으면 자연 1000.0 / 다짐 900 넣으면 자연 1000.0
 *   ③ 덤프: 15톤 · 단위중량 1.8 → 한 대 자연 8.33 · 흐트러진 10.42 · 120 대 / 1,001㎥ → 121 대(올림) / 단위중량 비우면 «—»
 *   ④ «🧪 예시로 해 보기» → 120 대 · «지우기» → 덤프 칸 비움
 *   ⑤ 폭 320 · 390 · 1280 넘침 0 · 오류 0 · «무료» · «클로드» 없음(공지 띠 · 창 빼고)
 * 가상 자료만 씀 · 인터넷 안 부름.
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const require = createRequire(import.meta.url)
const 여기 = path.dirname(fileURLToPath(import.meta.url))
const 뿌리 = path.join(여기, '..')
const BASE = process.argv[2] || ''
const OUT = process.env.OUT || ''
let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 500))) }

console.log('① 글(tools.json) · 빠른찾기 낱말')
const 자료 = JSON.parse(fs.readFileSync(path.join(뿌리, 'web/src/data/tools.json'), 'utf8'))
const 도구들 = Array.isArray(자료) ? 자료 : (자료.tools || [])
const t = 도구들.find((x) => x.slug === 'soil-volume')
const 글 = JSON.stringify(t || {})
ok('soil-volume 있음 · 설명 4덩이(세 가지 상태 · 값 · 덤프 대수 · 설계와 토질이 다르면)', !!t && (t.secs || []).map((s) => s.h).join('|') === '세 가지 상태|값은 흙 종류마다 다릅니다|덤프 대수|설계와 토질이 다르면', t && t.secs.map((s) => s.h))
ok('옛 «암은 L 1.50~1.80 정도» 없음 · 풍화암 1.30~1.35 · 경암 1.70~2.00', !/1\.50~1\.80/.test(글) && /풍화암 L 1\.30~1\.35/.test(글) && /경암 L 1\.70~2\.00/.test(글))
ok('모래 L 1.10~1.20 · C 0.85~0.95 · 점성토(점질토 · 점토) L 1.20~1.45 · C 0.85~0.95', /모래는 L 1\.10~1\.20 · C 0\.85~0\.95/.test(글) && /점성토\(점질토 · 점토\)는 L 1\.20~1\.45 · C 0\.85~0\.95/.test(글))
ok('«토질시험을 해서 적용하는 것이 원칙» · 소량일 때만 표 값 · 뻘은 시험 값', /토질시험을 해서 적용하는 것이 원칙/.test(글) && /소량의 토량일 때만/.test(글) && /뻘처럼 표에 따로 없는 흙은 시험 값/.test(글))
ok('덤프: 적재중량 ÷ 단위중량 × L · 무게로 싣는 것이 기준 · 단위중량은 시험이 원칙', /적재중량 ÷ 단위중량 × L/.test(글) && /무게로 싣는 것이 기준/.test(글) && /시험으로 정하는 것이 원칙/.test(글))
ok('설계와 토질이 다르면 — 제19조의3 · 감독관(감리 현장은 감리원) · 동시에 바로', /제19조의3/.test(글) && /감리 현장은 감리원/.test(글) && /동시에 바로 알리고/.test(글))
ok('꼬리(tail) 있음 — 구운 제목에 «무료 계산기» 안 붙음 · 글에 «무료» · «클로드» 없음', !!(t && t.tail) && !/무료|클로드/.test(글), t && t.tail)
ok('표준품셈 표를 통째로 싣지 않음(값은 설명에 든 몇 개뿐 — CLAUDE.md «표준품셈 · 물가정보 · 노임단가 표는 안 싣는다»)', (글.match(/\d\.\d\d~\d\.\d\d/g) || []).length <= 8, (글.match(/\d\.\d\d~\d\.\d\d/g) || []).length)
const 찾 = fs.readFileSync(path.join(뿌리, 'web/src/lib/빠른찾기.js'), 'utf8')
ok('빠른찾기 낱말 — 덤프 대수 · 사토 운반 · 토량환산계수 · 뻘', /'\/tools\/soil-volume': '[^']*덤프대수[^']*'/.test(찾) && /'\/tools\/soil-volume': '[^']*사토운반[^']*뻘/.test(찾))
const 셈 = fs.readFileSync(path.join(뿌리, 'web/src/tools/calcs.jsx'), 'utf8')
ok('셈 규칙 — 대수 = ceil(자연 × 단위중량 ÷ 적재중량) · 한 대 흐트러진 = (T÷γt) × L', /Math\.ceil\(nat \* g \/ t - 1e-9\)/.test(셈) && /\(한대 \* l\)\.toFixed\(2\)/.test(셈))

if (BASE) {
  const { chromium } = require('playwright')
  const b = await chromium.launch()
  async function 새쪽(w, h, 폰 = true) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, deviceScaleFactor: 2,
      userAgent: 폰 ? 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36' : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36' })
    await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
    await ctx.route(/firebaseio\.com|firebasedatabase\.app/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
    const p = await ctx.newPage()
    const 오류 = []
    p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
    await p.goto(BASE + '/tools/soil-volume', { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('.tool input', { timeout: 15000 })
    await p.waitForTimeout(600)
    return { ctx, p, 오류 }
  }
  const 칸 = (p, i) => p.locator('.tool input').nth(i)        /* 0 토량 · 1 L · 2 C · 3 적재중량 · 4 단위중량 */
  const 값들 = (p) => p.evaluate(() => [...document.querySelectorAll('.tool .tl-o')].map((x) => [x.querySelector('span').textContent.trim(), x.querySelector('b').textContent.trim()]))
  const 값 = async (p, k) => { const r = (await 값들(p)).find((x) => x[0] === k); return r ? r[1] : null }
  const 넣기 = async (p, i, v) => { await 칸(p, i).fill(String(v)); await p.waitForTimeout(80) }
  const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)

  console.log('② ③ 셈 · 덤프 — 폰 390')
  {
    const { ctx, p, 오류 } = await 새쪽(390, 844)
    ok('칸 다섯(토량 · L · C · 덤프 적재중량 · 흙 단위중량) · 작은 제목 «🚚 덤프 대수»', (await p.locator('.tool input').count()) === 5 && /🚚 덤프 대수/.test(await p.locator('.tl-sub').innerText()), await p.locator('.tool input').count())
    await p.selectOption('.tool select', 'nat')
    await 넣기(p, 0, '1000'); await 넣기(p, 1, '1.25'); await 넣기(p, 2, '0.90')
    ok('자연 1,000 · L 1.25 · C 0.90 → 흐트러진 1250.0 · 다짐 900.0', (await 값(p, '흐트러진 상태 (운반)')) === '1250.0 ㎥' && (await 값(p, '다짐상태 (성토)')) === '900.0 ㎥', await 값들(p))
    ok('덤프 칸 비우면 «—»', (await 값(p, '덤프 대수 (올림)')) === '—' && (await 값(p, '한 대 — 자연상태로')) === '—')
    await 넣기(p, 3, '15'); await 넣기(p, 4, '1.8')
    ok('15톤 · 1.8 → 한 대 자연 8.33 · 흐트러진 10.42 · 120 대', (await 값(p, '한 대 — 자연상태로')) === '8.33 ㎥' && (await 값(p, '한 대 — 흐트러진 상태로')) === '10.42 ㎥' && (await 값(p, '덤프 대수 (올림)')) === '120 대', await 값들(p))
    await 넣기(p, 0, '1001')
    ok('1,001㎥ → 121 대(올림)', (await 값(p, '덤프 대수 (올림)')) === '121 대', await 값(p, '덤프 대수 (올림)'))
    await 넣기(p, 0, '12,000')
    ok('쉼표 든 12,000 → 1,440 대', (await 값(p, '덤프 대수 (올림)')) === '1,440 대', await 값(p, '덤프 대수 (올림)'))
    await p.selectOption('.tool select', 'loose'); await 넣기(p, 0, '1250')
    ok('흐트러진 1,250 넣으면 자연 1000.0 · 대수 120(자연 기준)', (await 값(p, '자연상태')) === '1000.0 ㎥' && (await 값(p, '덤프 대수 (올림)')) === '120 대', await 값들(p))
    await p.selectOption('.tool select', 'comp'); await 넣기(p, 0, '900')
    ok('다짐 900 넣으면 자연 1000.0', (await 값(p, '자연상태')) === '1000.0 ㎥', await 값(p, '자연상태'))
    await 넣기(p, 4, '')
    ok('단위중량 지우면 대수 «—»', (await 값(p, '덤프 대수 (올림)')) === '—')
    if (OUT) { await p.locator('.tl-sub').scrollIntoViewIfNeeded(); await p.waitForTimeout(200) }
    ok('폰 390 넘침 0 · 오류 0', (await 넘침(p)) <= 0 && !오류.length, [await 넘침(p), 오류])
    await ctx.close()
  }
  console.log('④ 예시로 해 보기 · 지우기')
  {
    const { ctx, p, 오류 } = await 새쪽(390, 844)
    await p.locator('button', { hasText: '예시로 해 보기' }).first().click(); await p.waitForTimeout(700)
    ok('예시 → 1,000㎥ · 15톤 · 1.8 → 120 대 · 흐트러진 1250.0', (await 값(p, '덤프 대수 (올림)')) === '120 대' && (await 값(p, '흐트러진 상태 (운반)')) === '1250.0 ㎥', await 값들(p))
    if (OUT) {
      const 상자 = await p.locator('.tool').boundingBox()
      await p.screenshot({ path: OUT + '/토량_예시_폰390.png', clip: { x: 0, y: Math.max(0, 상자.y - 10), width: 390, height: Math.min(상자.height + 20, 1500) }, fullPage: true })
    }
    const 본문 = await p.evaluate(() => { const c = document.body.cloneNode(true); c.querySelectorAll('.noticebar, .noticepop, footer, .foot').forEach((x) => x.remove()); return c.innerText })
    ok('화면에 «무료» · «클로드» · NaN · undefined 없음(공지 띠 · 창 · 바닥글 빼고)', !/무료|클로드|NaN|undefined|Infinity/.test(본문), (본문.match(/.{0,20}(무료|클로드|NaN|undefined|Infinity).{0,20}/) || [''])[0])
    ok('화면 설명 — «토질시험을 해서 적용하는 것이 원칙» · «설계와 토질이 다르면»', /토질시험을 해서 적용하는 것이 원칙/.test(본문) && /설계와 토질이 다르면/.test(본문))
    const 지 = p.locator('button', { hasText: /^지우기$/ }).first()
    if (await 지.count()) { await 지.click(); await p.waitForTimeout(500) }
    ok('«지우기» → 덤프 칸 비움 · 대수 «—»', (await 칸(p, 3).inputValue()) === '' && (await 값(p, '덤프 대수 (올림)')) === '—', [await 칸(p, 3).inputValue(), await 값(p, '덤프 대수 (올림)')])
    ok('오류 0', !오류.length, 오류)
    await ctx.close()
  }
  console.log('⑤ 폭 320 · 1280')
  for (const [w, h, 폰] of [[320, 640, true], [1280, 860, false]]) {
    const { ctx, p, 오류 } = await 새쪽(w, h, 폰)
    await 넣기(p, 0, '1000'); await 넣기(p, 3, '25.5'); await 넣기(p, 4, '1.85')
    const 대 = await 값(p, '덤프 대수 (올림)')
    ok(`${w} — 25.5톤 · 1.85 → ${대} (73 대) · 넘침 0 · 오류 0`, 대 === '73 대' && (await 넘침(p)) <= 0 && !오류.length, [대, await 넘침(p), 오류])
    if (OUT && !폰) { const 상자 = await p.locator('.tool').boundingBox(); await p.screenshot({ path: OUT + '/토량_PC1280.png', clip: { x: Math.max(0, 상자.x - 10), y: Math.max(0, 상자.y - 10), width: Math.min(상자.width + 20, 1280), height: Math.min(상자.height + 20, 1400) }, fullPage: true }) }
    await ctx.close()
  }
  await b.close()
}
console.log(`\n${bad ? '✗' : '✓'} 시험_토량환산 ${n - bad}/${n}`)
if (bad) process.exit(1)
