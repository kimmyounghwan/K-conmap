// 🧪 G516 — 판단기 다섯 «🔗 링크 보내기» 가 클립보드가 멈춰도 링크를 보여 줌 (B=http://127.0.0.1:4997 node tools/시험_링크복사화면.mjs)
//   G515 사이트 점검에서 찾음: 클립보드 쓰기가 끝나지 않으면 링크가 안 나왔음 → lib/링크복사.js(1.5초)
//   ① 멈춤 → 2.5초 안에 링크 + «복사하십시오» ② 됨 → «복사했습니다» — 퇴직금 · 주휴 · 실업 · 휴업 · 4대보험
import { createRequire } from 'module'
const require = createRequire(process.env.PW || '/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const B = process.env.B || 'http://127.0.0.1:4997'
let 통과 = 0, 틀림 = 0
const 봄 = (v, 이름, 덧 = '') => { if (v) 통과++; else { 틀림++; console.log(`  ✗ ${이름} ${덧}`) } }

const b = await chromium.launch()
const 쪽들 = [['/tools/ilyong-toejikgeum', 'kcm_toejikgeum'], ['/tools/juhyu', 'kcm_juhyu'], ['/tools/ilyong-silup', 'kcm_silup'], ['/tools/sanjae-hyueop', 'kcm_hyueop'], ['/tools/ilyong-boheom', 'kcm_ilyong4']]
for (const 꼴 of ['멈춤', '됨']) {
  console.log(`■ 클립보드 ${꼴}`)
  for (const [길] of 쪽들) {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } })
    await p.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs|firebaseio|firebasedatabase|identitytoolkit|securetoken/, (r) => r.fulfill({ status: 200, body: 'null' }))
    await p.addInitScript((m) => {
      const c = { writeText: m === '멈춤' ? () => new Promise(() => {}) : () => Promise.resolve() }
      Object.defineProperty(Navigator.prototype, 'clipboard', { get: () => c, configurable: true })
    }, 꼴)
    const 오류 = []
    p.on('pageerror', (e) => 오류.push(String(e.message || e)))
    await p.goto(`${B}${길}`, { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('details.iy-exd', { timeout: 20000 })
    await p.locator('details.iy-exd > summary').click()
    await p.locator('details.iy-exd button').first().click()
    await p.waitForTimeout(300)
    const t0 = Date.now()
    await p.getByRole('button', { name: '🔗 링크 보내기' }).click()
    const 칸 = await p.waitForSelector('.note a[href*="?c="], input[aria-label="결과 링크"]', { timeout: 4000 }).catch(() => null)
    const 걸린 = Date.now() - t0
    const 주소 = 칸 ? await 칸.evaluate((e) => e.getAttribute('href') || e.value) : ''
    const 글 = 칸 ? await 칸.evaluate((e) => e.closest('.note').textContent) : ''
    봄(!!칸 && new RegExp(`${길.replace(/[/-]/g, (x) => '\\' + x)}\\?c=[A-Za-z0-9_-]+$`).test(주소), `${꼴} ${길} — 링크 보임`, 주소)
    if (꼴 === '멈춤') 봄(걸린 < 2600 && /복사하십시오/.test(글), `${꼴} ${길} — 1.5초 뒤 «복사하십시오»`, `${걸린}ms ${글.slice(0, 30)}`)
    else 봄(걸린 < 1200 && /복사했습니다/.test(글), `${꼴} ${길} — 바로 «복사했습니다»`, `${걸린}ms ${글.slice(0, 30)}`)
    봄(!오류.length, `${꼴} ${길} — 오류 없음`, 오류.join(' | '))
    await p.close()
  }
}
await b.close()
console.log(`\n링크 보내기 화면 ${통과}/${통과 + 틀림}`)
if (틀림) process.exit(1)
