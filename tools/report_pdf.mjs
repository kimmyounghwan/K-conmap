import pw from '/home/claude/.npm-global/lib/node_modules/playwright/index.js'
const { chromium } = pw
const b = await chromium.launch()
const p = await b.newPage()
const errs=[]; p.on('pageerror',e=>errs.push(e.message))
await p.goto('file:///home/claude/work/report/report.html', {waitUntil:'load'})
await p.pdf({path:'입찰성적표_견본.pdf', format:'A4', printBackground:true})
// 화면으로도 한 장 찍어 눈으로 봅니다
await p.setViewportSize({width:820, height:1160})
await p.screenshot({path:'/tmp/rep_p1.png', clip:{x:0,y:0,width:820,height:1160}})
console.log('pageerror', errs)
await b.close()
