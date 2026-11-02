// 🧪 G514 — 서식 화면 점검에서 고친 것 지키기 (B=http://127.0.0.1:4998 node tools/시험_서식찾기화면.mjs)
//   소장님 「서식 점검해 줘. 이용자 입장에서 클로드가 하나 하나 세심히 해 봐. 오류가 없는지. 어떤게 편한지 등등」(2026-11-02)
//   ① 서식 쪽 맨 위 단추 — 폰(390 · 320)에서 단추 글자가 한두 글자씩 세로로 접히지 않음(단추 높이 · 너비) · 받은 수는 아래 줄 · 가로 넘침 0
//   ② /forms «서식 찾기» — 붙여 쓴 말 · 다른 이름(출역부 · 장비일보 · 유류대장 · 실행예산 · 자재검수 · 월간보고 …)이 0가지가 아님 · 제목이 같은 서식이 맨 앞
import { createRequire } from 'module'
const require = createRequire(process.env.PW || '/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const B = process.env.B || 'http://127.0.0.1:4998'
let 통과 = 0, 틀림 = 0
const 봄 = (v, 이름, 덧 = '') => { if (v) 통과++; else { 틀림++; console.log(`  ✗ ${이름} ${덧}`) } }

const b = await chromium.launch()
async function 새쪽(w) {
  const p = await b.newPage({ viewport: { width: w, height: 844 } })
  await p.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs|firebaseio|firebasedatabase|identitytoolkit|securetoken/, (r) => r.fulfill({ status: 200, body: 'null' }))
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e.message || e)))
  return { p, 오류 }
}

console.log('① 서식 쪽 맨 위 단추 — 폰에서 글자가 세로로 접히지 않음')
/* 종이에 바로 쓰기(단추 셋) · 안전서류(둘) · 원본 틀(둘) · 위험성평가(긴 글 하나) · 엑셀(셋) */
for (const w of [390, 320]) {
  const { p, 오류 } = await 새쪽(w)
  for (const slug of ['chakgong', 'achasago', 'o-sajindaeji', 'wih-choego', 'gongnaeyeok-hanbeol', 'jg-tower']) {
    await p.goto(`${B}/forms/${slug}`, { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('.btn-row .btn.primary', { timeout: 20000 })
    await p.waitForTimeout(300)
    봄(!!(await p.$('.fp-acts .btn.primary')), `${w} ${slug} 맨 위 단추 줄이 fp-acts`)
    /* 큰 단추(.btn.primary)가 든 줄 = 맨 위 단추 줄(옛 판 · 새 판 모두) */
    const 단추 = await p.evaluate(() => { const 줄 = document.querySelector('.btn-row .btn.primary').closest('.btn-row'); return [...줄.querySelectorAll('.btn')].map((e) => { const r = e.getBoundingClientRect(); return { t: e.textContent.trim(), w: Math.round(r.width), h: Math.round(r.height) } }) })
    const 좁 = 단추.filter((x) => x.w < 90 || x.h > (x.t.length > 26 ? 80 : 56))
    봄(단추.length && !좁.length, `${w} ${slug} 단추 ${단추.length}개 — 좁거나(90px 미만) 글자가 세로로 접힌(높이) 단추 없음`, JSON.stringify(좁))
    const 수 = await p.evaluate(() => { const 줄 = document.querySelector('.btn-row .btn.primary').closest('.btn-row'); const c = 줄.querySelector('.dlcount'); const 첫 = 줄.querySelector('.btn'); return c && 첫 ? c.getBoundingClientRect().top >= 첫.getBoundingClientRect().bottom - 1 : true })
    봄(수, `${w} ${slug} «지금까지 N번 받았습니다» 는 단추 아래 줄`)
    const 넘 = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    봄(넘 <= 0, `${w} ${slug} 가로 넘침 없음`, String(넘))
  }
  봄(!오류.length, `${w} 화면 오류 없음`, 오류.join(' | '))
  await p.close()
}

console.log('② /forms «서식 찾기» — 0가지였던 말 · 제목 같은 것 먼저')
{
  const { p, 오류 } = await 새쪽(390)
  await p.goto(`${B}/forms`, { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('input[aria-label="서식 찾기"]', { timeout: 20000 })
  const 첫 = async (q) => {
    await p.fill('input[aria-label="서식 찾기"]', q)
    await p.waitForTimeout(350)
    return p.evaluate(() => {
      const 칸 = [...document.querySelectorAll('.card')].find((c) => /찾은 서식 \d+가지/.test(c.textContent))
      if (!칸) return { n: -1, 첫: '' }
      const n = Number((칸.textContent.match(/찾은 서식 (\d+)가지/) || [])[1])
      const a = 칸.querySelector('a[href^="/forms/"]')
      return { n, 첫: a ? a.getAttribute('href') : '' }
    })
  }
  const 표 = [['출역부', '/forms/chulyeok-ilbo'], ['출력부', '/forms/chulyeok-ilbo'], ['장비일보', '/forms/janggi-gadong'], ['유류대장', '/forms/yuryu'],
    ['실행예산', '/forms/silhaeng-daebipyo'], ['자재검수', '/forms/jajae-geomsu'], ['월간보고', '/forms/wolgan-bogoseo'], ['안전교육일지', '/forms/anjeon-gyoyuk'],
    ['기성청구서', '/forms/gisung-cheonggu'], ['청렴서약서', '/forms/cheongryeom'], ['착공계', '/forms/chakgong'], ['근로계약서', '/forms/gy-sangyong']]
  for (const [q, to] of 표) {
    const r = await 첫(q)
    봄(r.n > 0 && r.첫 === to, `«${q}» → 맨 앞 ${to}`, JSON.stringify(r))
  }
  const 없 = await 첫('쀏쀍쀏쀍')
  봄(없.n === 0, '없는 말 → 0가지', JSON.stringify(없))
  const 둘 = await 첫('위험성평가')
  봄(둘.n >= 5, '«위험성평가» → 여러 가지(전처럼)', JSON.stringify(둘))
  봄(!오류.length, '서식 목록 화면 오류 없음', 오류.join(' | '))
  await p.close()
}
await b.close()
console.log(`\n서식 찾기 · 단추 ${통과}/${통과 + 틀림}`)
if (틀림) process.exit(1)
