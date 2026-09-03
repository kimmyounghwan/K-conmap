/* 화면 숫자를 읽어 오는 도구 — tools/selfcheck.py 가 부릅니다.
   ⚠️ 여기서는 «읽기»만 합니다. 맞는지 판단은 파이썬(bidmath.py)이 합니다. */
import { chromium } from 'playwright'
import fs from 'fs'

const cases = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const base = process.argv[3] || 'http://127.0.0.1:8899'
const out = []
const errs = []

const b = await chromium.launch({
  executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})
const p = await b.newPage({ viewport: { width: 430, height: 1400 } })
p.on('pageerror', (e) => errs.push(String(e)))

const digits = (s) => Number(String(s || '').replace(/[^0-9]/g, '')) || 0

for (const c of cases) {
  await p.goto(`${base}/?no=${c.no}`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(1800)
  const r = await p.evaluate(() => {
    const txt = (sel) => document.querySelector(sel)?.innerText || ''
    const all = document.body.innerText
    /* ⚠️ 칸 전체를 읽으면 부제의 숫자까지 섞입니다. 금액은 .nm 만 읽습니다. */
    const s1 = Array.from(document.querySelectorAll('.scored .s1'))
      .map((n) => n.querySelector('.nm')?.innerText || '')
    return {
      heroAmt: txt('.hero .amt'),
      heroSub: txt('.hero .sub') || '',
      nogo: !!document.querySelector('.nogobox'),
      stop: all.includes('이 공고는 계산기를 쓰면 안 됩니다'),
      rateLine: (all.match(/투찰률\s*[\d.]+%\s*·\s*예정가격\s*[\d,]+원/) || [''])[0],
      sjLine: (all.match(/분석 사정률\s*[\d.]+%/) || [''])[0],
      scored: document.querySelector('.scored')?.className || '',
      s1,
      myrank: txt('.scored .myrank').replace(/\s+/g, ' '),
      /* 계산기 화면이 밝히는 «어느 사정률까지 버티게 잡았는지» + A값을 아는지 */
      whyLine: (all.match(/사정률\s*[\d.]+%\s*에서도 낙찰하한을 넘도록[^·]*·[^\n]*/) || [''])[0],
    }
  })
  out.push({ no: c.no, ...r,
    heroAmtNum: digits(r.heroAmt),
    s1Nums: r.s1.map(digits) })
}
await b.close()
fs.writeFileSync(process.argv[4], JSON.stringify({ out, errs }, null, 1))
console.log(`읽음 ${out.length}건 · 자바스크립트 오류 ${errs.length}건`)
