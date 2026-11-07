/**
 * ⚖ G583 토적컨맵 — 받은 엑셀을 다시 열어 이어서(화면 시험). 구운 사이트(dist)를 띄운 뒤:
 *   node tools/시험_토적다시열기화면.mjs [주소=http://127.0.0.1:4578]
 *   소장님 「지울 수 있게도 해 줘. 단, 다시 방문하게 해야 해」 —
 *   🧪 예시 → 📑 설계 양식 화면 맨 아래 짧은 출처 한 줄 · 버튼 아래 «받은 엑셀을 📥 엑셀 파일 열기로 다시» 글
 *   → 📑 설계 양식 엑셀 · 📗 엑셀을 받아 둠 → 표 한 칸을 바꿔 답이 달라짐 → 받은 엑셀을 «📥 엑셀 파일 열기» →
 *   칸 맞추기 창이 «측점 25줄 · 흙 칸 3개(토사 · 리핑암 · 성토)»(이름이 «성토» 면 «(성토)» 를 또 붙이지 않음) · 비고 칸 «운반 끊음» → «이대로 넣기» → 답이 처음과 같음
 *   폰 390 · PC 1280 넘침 0 · 오류 0. 가상 예시만 씀 · 인터넷 안 부름(받기는 시험 브라우저 안에서만).
 */
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4578'

let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 300))) }
const 쉬어 = (ms) => new Promise((r) => setTimeout(r, ms))
const b = await chromium.launch()
const UA폰 = 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'

for (const [이름, w, h, 폰] of [['폰 390', 390, 844, true], ['PC 1280', 1280, 900, false]]) {
  console.log(`■ ${이름}`)
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, acceptDownloads: true, ...(폰 ? { userAgent: UA폰 } : {}) })
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  await ctx.route(/firebaseio\.com|firebasedatabase\.app|identitytoolkit|securetoken/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await ctx.addInitScript(() => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) { /* 없음 */ } })
  const p = await ctx.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  await p.goto(BASE + '/tools/tojeok', { waitUntil: 'domcontentloaded' })
  await p.getByRole('button', { name: '🧪 예시로 해 보기' }).first().click()
  await p.waitForSelector('.tj-sum', { timeout: 20000 })
  await 쉬어(600)
  const 합 = () => p.evaluate(() => [...document.querySelectorAll('.tj-sum > div')].map((d) => d.innerText.replace(/\s+/g, ' ')).join(' | '))
  const 원 = await 합()
  ok('예시 — 결과 칸(종방향 유용 · 평균운반거리 …)이 나옴', /평균운반거리/.test(원), 원)
  const 글 = await p.evaluate(() => document.body.innerText)
  const 안내 = await p.evaluate(() => ([...document.querySelectorAll('p.gp-hint')].find((x) => /엑셀 파일 열기/.test(x.innerText)) || {}).innerText || '')
  ok('버튼 아래 «받은 엑셀을 고쳐 셀 때는 위 «📥 엑셀 파일 열기»로 다시 불러오면 이어서 · «K-건설맵» 줄은 지워도 됩니다» · «값만 · 수식 없음» 은 안 적음(G520)',
    /받은 엑셀을 고쳐 셀 때는 위 «📥 엑셀 파일 열기»로 다시 불러오면/.test(안내) && /«K-건설맵» 줄은 지워도 됩니다/.test(안내) && !/값만|수식\s*없/.test(안내) && !/값만\s*(담|들어)|수식\s*없/.test(글), 안내)
  await p.getByRole('tab', { name: '📑 설계 양식' }).click()
  await 쉬어(500)
  /* 양식 표 아래 작은 글(설명 · 출처)은 표 밖 글 줄(p.gp-hint)로 그려짐 — 마지막 줄이 출처 · 그 앞 설명 줄엔 «K-건설맵» 없음 */
  const 양식끝 = await p.evaluate(() => [...document.querySelectorAll('.tj-yang-box')].map((bx) => { const ps = [...bx.querySelectorAll('p.gp-hint')].map((x) => x.innerText.trim()); return { 끝: ps[ps.length - 1] || '', 앞: ps.slice(0, -1) } }))
  ok('📑 설계 양식 화면 — 두 장 모두 맨 아래 짧은 출처 한 줄 «K-건설맵 토적컨맵 · k-conmap.com/tools/tojeok» · 설명 줄엔 출처 없음',
    양식끝.length === 2 && 양식끝.every((x) => x.끝 === 'K-건설맵 토적컨맵 · k-conmap.com/tools/tojeok' && x.앞.length >= 1 && x.앞.every((t) => !/K-건설맵/.test(t))), 양식끝)
  for (const [단추, 시트] of [['📑 설계 양식 엑셀', '토공집계표'], ['📗 엑셀로 받기', '토적표']]) {
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 20000 }), p.getByRole('button', { name: 단추 }).click()])
    const 파일 = await dl.path()
    const 머리 = 파일 ? (await import('node:fs')).readFileSync(파일).subarray(0, 2).toString('latin1') : ''
    ok(`${단추} — 받은 파일이 엑셀(.xlsx · zip «PK»)`, 머리 === 'PK', 머리)
    /* 표 한 칸을 바꿔 답이 달라지게(NO.5 토사) */
    await p.locator('input[data-r="5"]').nth(2).fill('99')   /* 측 · 거 다음 첫 흙 칸(다시 연 뒤엔 칸 id 가 바뀜) */
    await 쉬어(600)
    const 바뀜 = await 합()
    ok(`${단추} — 표를 고치면 답이 달라짐(다시 열기 전)`, 바뀜 !== 원, 바뀜)
    await p.setInputFiles('input[type=file][accept=".xlsx,.xls"]', 파일)
    await p.waitForSelector('.tj-box', { timeout: 20000 })
    await 쉬어(500)
    const 창 = await p.evaluate(() => { const bx = document.querySelector('.tj-box'); return { 글: bx ? bx.innerText : '', 시트: (bx && bx.querySelector('select') || {}).value || '', 끊: [...(bx ? bx.querySelectorAll('.tj-map select') : [])].some((s) => s.value === '끊') } })
    ok(`${단추} 다시 열기 — 시트 «${시트}» · «넣을 것: 측점 25줄 · 흙 칸 3개(토사 · 리핑암 · 성토)» · 운반 끊음 칸`,
      창.시트 === 시트 && /넣을 것: 측점 25줄 · 흙 칸 3개\(토사 · 리핑암 · 성토\)/.test(창.글) && 창.끊, [창.시트, (창.글.match(/넣을 것[^\n]*/) || [''])[0], 창.끊])
    await p.getByRole('button', { name: '이대로 넣기 (지금 표를 바꿈)' }).click()
    await 쉬어(800)
    const 다시 = await 합()
    ok(`${단추} 다시 열기 → «이대로 넣기» — 답이 처음과 같음(측점 · 거리 · 단면적 · C · 운반 끊음이 그대로)`, 다시 === 원, [다시, 원])
  }
  ok('넘침 0 · 오류 0', (await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0 && 오류.length === 0, 오류)
  await ctx.close()
}
await b.close()
console.log(`\n${n}개 중 틀림 ${bad}`)
process.exit(bad ? 1 : 0)
