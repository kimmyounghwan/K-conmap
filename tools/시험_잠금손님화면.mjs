/**
 * 🔒 잠근 도구 11가지 «손님 화면» 시험 · G690 (2026-11-15) · G784b(11-19) 공무 올인원 더함
 *   소장님 11-15: 「공사서류 원클릭 엑셀 받기 되는데???」 · 「문의로 하라고 했잖아」 · 「막아 놓은거 다시 점검해. 제발 확실히 해줘」 ·
 *   「내가 확인안하고 믿을 수 있게 해주면 안돼???」 · 「예시도 2페이지에서 3페이지만 볼 수 있게 해줘」 · 「내 폰 화면」(운영자 폰 = 열린 화면)
 *   빌드한 화면을 띄운 뒤  B=http://127.0.0.1:4690 node tools/시험_잠금손님화면.mjs   (CAP=<폴더> 면 캡처)
 *
 * ① 손님(운영자 표식 · 열쇠말 없음) × PC 1280 · 폰 390 × 10가지:
 *    🧪 예시를 열고 본문(main.shell)의 단추를 세 바퀴 «모두» 누름 → 받은 파일 0 · 인쇄 0 · 새 창 0 · 파일 고르기 창 0 · 복사 0 · Ctrl+P 인쇄 0 · 다른 쪽으로 안 감 · 오류 0
 *    · 예시 쪽 · 장 · 탭은 3까지(넘기기 고르기 3 · 엑셀 화면 장 3 · ESC 탭 3 · 경리 원장 거래처 2) · «🔒 예시는 … 까지» 알림
 *    · «받기 모양» 단추(⬇ · 📗 · 받기 · 🔒 PDF · 🔒 엑셀 …) 0 · 문의 단추(/contact?k=cn) 있음 · 🔑 열림띠 없음
 * ② 소장님 기기(kcm_op=1) × 폰 390: 🔑 열림띠 · 잠금 상자 없음 · «👀 손님 화면으로 보기» → 손님 화면(잠금 상자 · 👀 보는 중) → «↩ 원래대로» → 다시 열림
 *    · 시공계획서 예시는 소장님 기기에선 다 보임(넘기기 고르기 3 넘음)
 */
import { createRequire } from 'module'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const BASE = process.env.B || 'http://127.0.0.1:4690'
const 찍기 = process.env.CAP || ''
const 만 = (process.env.ONLY || '').split(',').filter(Boolean)
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log((c ? '  ✓ ' : '  ✗ ') + m + (c ? '' : ' — ' + String(typeof 더 === 'string' ? 더 : JSON.stringify(더)).slice(0, 500))) }
const 쉬어 = (ms) => new Promise((r) => setTimeout(r, ms))

/* 길 · 예시 단추 · 예시 뒤 «쪽 한도» 를 재는 곳 */
/* 뒤 = 다 누른 뒤 «예시 쪽» 을 다시 띄우는 단추(글에 이것이 든 첫 단추) · 기대 = 그때 꼭 있어야 하는 한도(빈 채로 «3 이하» 통과하지 않게) */
const 도구들 = [
  { 길: '/tools/wonclick', 이름: '원클릭', 예시끝: true, 뒤: ['예시 서류 3가지 화면에서 보기'], 기대: { 엑셀장: 3 } },
  { 길: '/tools/sigong', 이름: '시공계획서', 예시끝: true, 기대: { 고르기: 3 } },
  { 길: '/tools/anjeon', 이름: '안전관리계획서', 예시끝: true, 기대: { 고르기: 3 } },
  { 길: '/tools/yuhae', 이름: '유해위험방지계획서', 예시끝: true, 기대: { 고르기: 3 } },
  { 길: '/tools/jungcheo', 이름: '중처법', 예시끝: true, 뒤: ['③ 서류 한 벌'], 기대: { 고르기: 3 } },
  { 길: '/tools/colorplan', 이름: '컬러 평면도', 예시끝: false, 뒤: ['3층 학원', '피난 안내도'], 기대: { 고르기최소: 1 } },
  { 길: '/tools/cadfix', 이름: '캐드 고치기', 예시끝: false },
  { 길: '/tools/esc', 이름: '물가변동 ESC', 예시끝: true, 기대: { ESC탭: 3 } },
  { 길: '/tools/hado-docs', 이름: '하도급 서류', 예시끝: true, 기대: { 엑셀장: 3 } },
  { 길: '/tools/gyeongri', 이름: '경리컨맵', 예시끝: true, 뒤: ['거래처 원장'], 기대: { 원장곳: 2 } },
  { 길: '/tools/gongmu', 이름: '공무 올인원', 예시끝: true, 기대: { 공무단계: 3 } },   // 🧰 G784b — 예시 = 지어낸 현장 · 단계 셋(도구 고리 · ✓ 단추 없음)
].filter((t) => !만.length || 만.some((x) => t.길.includes(x)))

/* 손님 흉내 + 받기 · 인쇄 · 새 창 · 복사 · 파일 창을 «막고 적기만» */
const 덫 = () => {
  window.__적 = { 받기: [], 인쇄: 0, 새창: [], 파일창: 0, 복사: 0, 덩이: 0 }
  const 적 = window.__적
  window.print = () => { 적.인쇄++ }
  window.open = (u) => { 적.새창.push(String(u).slice(0, 60)); return null }
  try { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { 적.복사++ }, write: async () => { 적.복사++ }, readText: async () => '' } }) } catch (e) { /* */ }
  const oc = HTMLAnchorElement.prototype.click
  HTMLAnchorElement.prototype.click = function () { if (this.download || /^blob:|^data:/.test(this.href)) { 적.받기.push('a ' + (this.download || '').slice(0, 40)); return } return oc.apply(this, arguments) }
  const ic = HTMLInputElement.prototype.click
  HTMLInputElement.prototype.click = function () { if (this.type === 'file') { 적.파일창++; return } return ic.apply(this, arguments) }
  document.addEventListener('click', (e) => {
    const a = e.target && e.target.closest && e.target.closest('a')
    if (a && (a.download || /^blob:|^data:/.test(a.href || ''))) { e.preventDefault(); 적.받기.push('d ' + (a.download || '')) }
    else if (a && a.target === '_blank') { e.preventDefault(); 적.새창.push(String(a.href).slice(0, 60)) }
  }, true)
  const ou = URL.createObjectURL.bind(URL)
  URL.createObjectURL = (b) => { 적.덩이++; return ou(b) }
  window.showOpenFilePicker = async () => { 적.파일창++; throw new Error('막음') }
  window.showSaveFilePicker = async () => { 적.받기.push('저장창'); throw new Error('막음') }
  window.showDirectoryPicker = async () => { 적.파일창++; throw new Error('막음') }
  window.alert = () => {}; window.confirm = () => false; window.prompt = () => null
}

/** 본문 단추를 세 바퀴 모두 누름(다른 쪽 고리 · 열쇠말 «열기» 는 안 누름) — 옮겨 가면 적고 돌아옴 */
async function 다누르기(p, 길) {
  const 누름 = new Set()
  let 누른수 = 0
  const 이동 = []
  for (let 바퀴 = 0; 바퀴 < 3; 바퀴++) {
    const 목록 = await p.evaluate(() => {
      const 판 = document.querySelector('main.shell') || document.body
      const 밖 = (el) => !!el.closest('.topbar, .tabbar, .railnav, .crumbs, footer, .noti-band, .cn-mini, aside')
      const 보임 = (el) => { const r = el.getBoundingClientRect(); return el.offsetParent !== null && r.width > 0 && r.height > 0 }
      const 다 = [...판.querySelectorAll('button, [role=button], a.btn, summary')].filter((el) => 보임(el) && !밖(el))
      return 다.map((el, i) => { el.setAttribute('data-누름', String(i)); return { i, 꼴: el.tagName, 글: (el.innerText || el.getAttribute('aria-label') || el.title || '').replace(/\s+/g, ' ').trim().slice(0, 40), 고리: el.tagName === 'A' ? (el.getAttribute('href') || '') : '', 받기: el.tagName === 'A' && (!!el.download || /^blob:|^data:/.test(el.href || '')) } })
    })
    let 새 = 0
    for (const b of 목록) {
      const 키 = b.꼴 + '|' + b.글
      if (누름.has(키)) continue
      누름.add(키); 새++
      if (b.꼴 === 'A' && !b.받기) continue
      if (/열기$/.test(b.글) && await p.$('input[type=password]')) continue
      const 앞 = await p.evaluate(() => location.pathname)
      await p.evaluate((i) => { const el = document.querySelector(`[data-누름="${i}"]`); if (el) el.click() }, b.i).catch(() => {})
      누른수++
      await 쉬어(300)
      const 뒤 = await p.evaluate(() => location.pathname).catch(() => 앞)
      if (뒤 !== 앞) { 이동.push(b.글 + ' → ' + 뒤); await p.goto(BASE + 길, { waitUntil: 'domcontentloaded' }); await p.waitForSelector('h1', { timeout: 20000 }).catch(() => {}); await 쉬어(800); break }
      if (누른수 > 160) break
    }
    if (!새 || 누른수 > 160) break
    await 쉬어(500)
  }
  return { 누른수, 이동 }
}

const 받기모양 = /⬇|📥|📗|받기|엑셀로|^🔒\s*(PDF|한글|워드|엑셀|PNG|DXF|ZIP|ESC)|내 (평면도|도면) 넣기/

const b = await chromium.launch()
try {
  /* ══ ① 손님 ══ */
  for (const [기기, vp] of [['PC', { width: 1280, height: 900 }], ['폰', { width: 390, height: 844 }]]) {
    for (const t of 도구들) {
      console.log(`① ${기기} 손님 — ${t.이름} ${t.길}`)
      const ctx = await b.newContext({ viewport: vp, acceptDownloads: true })
      await ctx.route((u) => !u.href.startsWith(BASE), (r) => r.abort())
      await ctx.addInitScript(덫)
      const p = await ctx.newPage()
      const 오류 = []
      p.on('pageerror', (e) => 오류.push(String(e).slice(0, 160)))
      let 받음 = 0, 파일창 = 0
      p.on('download', () => { 받음++ })
      p.on('filechooser', () => { 파일창++ })
      await p.goto(BASE + t.길, { waitUntil: 'domcontentloaded' })
      await p.waitForSelector('h1', { timeout: 30000 }).catch(() => {})
      await 쉬어(1500)
      const 처음 = await p.evaluate(() => ({ 잠금: !!document.querySelector('.sg-lock'), 문의: document.querySelectorAll('main a[href^="/contact?k=cn"]').length, 열림띠: !!document.querySelector('.kcm-열림띠') }))
      봐(처음.잠금 && 처음.문의 >= 1 && !처음.열림띠, `${기기} ${t.이름} — 🔒 잠금 상자 · 문의 단추 ${처음.문의} · 🔑 열림띠 없음`, 처음)
      /* 🧪 예시 먼저(단추 글에 «예시») */
      await p.evaluate(() => {
        const 판 = document.querySelector('main.shell') || document.body
        const e = [...판.querySelectorAll('button')].find((x) => x.offsetParent && /예시/.test(x.innerText) && !/보기만/.test(x.innerText))
        if (e) e.click()
      })
      await 쉬어(3500)
      const 누른 = await 다누르기(p, t.길)
      for (const 글 of t.뒤 || []) {
        await p.evaluate((g) => {
          const 판 = document.querySelector('main.shell') || document.body
          const e = [...판.querySelectorAll('button, [role=tab]')].find((x) => x.offsetParent && x.innerText.replace(/\s+/g, ' ').includes(g))
          if (e) e.click()
        }, 글)
        await 쉬어(2500)
      }
      /* Ctrl+P */
      const 전 = await p.evaluate(() => window.__적.인쇄)
      await p.keyboard.press('Control+p').catch(() => {})
      await 쉬어(400)
      const 적 = await p.evaluate(() => window.__적)
      봐(받음 === 0 && 적.받기.length === 0 && 적.인쇄 === 0 && 적.새창.length === 0 && 적.파일창 === 0 && 파일창 === 0 && 적.복사 === 0 && 적.인쇄 === 전,
        `${기기} ${t.이름} — 단추 ${누른.누른수}개 눌러도 받은 파일 0 · 인쇄 0 · 새 창 0 · 파일 창 0 · 복사 0 · Ctrl+P 막힘`, { 받음, 적, 파일창 })
      봐(누른.이동.length === 0, `${기기} ${t.이름} — 다른 쪽으로 안 감`, 누른.이동)
      /* 쪽 한도 */
      const 쪽 = await p.evaluate(() => {
        const 판 = document.querySelector('main.shell') || document.body
        const 수 = (q) => [...판.querySelectorAll(q)].filter((e) => e.offsetParent !== null).length
        const 고르기 = [...판.querySelectorAll('.sg-pager select')].map((s) => s.options.length)
        const 차례열림 = [...판.querySelectorAll('.sp-toc select option')].filter((o) => o.value !== '' && !o.disabled).length
        return { 고르기, 차례열림, 엑셀장: 수('.xv-장들 button'), ESC탭: 수('.esc-tab'), 원장곳: 수('.gr-chips .chip'), 예시끝: 수('.kcm-예시끝'), 쪽그림: 판.querySelectorAll('svg.sg-page').length, 공무단계: 수('.gmu-steps.gmu-ro .gmu-step'), 공무고리: 판.querySelectorAll('.gmu-steps a, .gmu-steps button').length }
      })
      봐(쪽.고르기.every((n) => n <= 3) && 쪽.차례열림 <= 3 && 쪽.엑셀장 <= 3 && 쪽.ESC탭 <= 3 && 쪽.원장곳 <= 2 && 쪽.쪽그림 <= 1,
        `${기기} ${t.이름} — 예시는 3까지(넘기기 ${JSON.stringify(쪽.고르기)} · 차례 ${쪽.차례열림} · 엑셀 장 ${쪽.엑셀장} · ESC 탭 ${쪽.ESC탭} · 원장 ${쪽.원장곳})`, 쪽)
      if (t.예시끝) 봐(쪽.예시끝 >= 1, `${기기} ${t.이름} — «🔒 예시는 … 까지» 알림 보임`, 쪽)
      if (t.기대) {
        const g = t.기대
        const 맞 = (g.고르기 === undefined || (쪽.고르기.length >= 1 && 쪽.고르기.every((n) => n === g.고르기))) &&
          (g.고르기최소 === undefined || (쪽.고르기.length >= 1 && 쪽.고르기.every((n) => n >= g.고르기최소))) &&
          (g.엑셀장 === undefined || 쪽.엑셀장 === g.엑셀장) && (g.ESC탭 === undefined || 쪽.ESC탭 === g.ESC탭) && (g.원장곳 === undefined || 쪽.원장곳 === g.원장곳) &&
          (g.공무단계 === undefined || (쪽.공무단계 === g.공무단계 && 쪽.공무고리 === 0))
        봐(맞, `${기기} ${t.이름} — 예시 쪽이 실제로 그려짐(빈 채 통과 아님 · 기대 ${JSON.stringify(g)})`, 쪽)
      }
      /* 받기 모양 단추 0 · 문의 단추 · 열림띠 없음 */
      const 끝 = await p.evaluate((re) => {
        const r = new RegExp(re)
        const 판 = document.querySelector('main.shell') || document.body
        const 밖 = (el) => !!el.closest('.topbar, .tabbar, .railnav, .crumbs, footer, .noti-band, .cn-mini, aside')
        const 단추 = [...판.querySelectorAll('button, a.btn')].filter((e) => e.offsetParent !== null && !밖(e) && !/^\/contact\?k=cn/.test(e.getAttribute('href') || ''))
        return { 받기단추: 단추.map((e) => e.innerText.replace(/\s+/g, ' ').trim()).filter((x) => r.test(x)), 문의: 판.querySelectorAll('a[href^="/contact?k=cn"]').length, 열림띠: !!document.querySelector('.kcm-열림띠') }
      }, 받기모양.source)
      봐(끝.받기단추.length === 0 && 끝.문의 >= 1 && !끝.열림띠, `${기기} ${t.이름} — «받기 모양» 단추 0 · 문의 단추 ${끝.문의}`, 끝)
      봐(!오류.length, `${기기} ${t.이름} — 화면 오류 없음`, 오류)
      if (찍기 && 기기 === '폰') await p.screenshot({ path: `${찍기}/손님_${t.길.split('/').pop()}.png`, fullPage: false }).catch(() => {})
      await ctx.close()
    }
  }

  /* ══ ② 소장님 기기(kcm_op) ══ */
  for (const t of 도구들) {
    console.log(`② 폰 소장님 기기 — ${t.이름}`)
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
    await ctx.route((u) => !u.href.startsWith(BASE), (r) => r.abort())
    await ctx.addInitScript(() => { try { localStorage.setItem('kcm_op', '1') } catch (e) { /* */ } })
    const p = await ctx.newPage()
    const 오류 = []
    p.on('pageerror', (e) => 오류.push(String(e).slice(0, 160)))
    await p.goto(BASE + t.길, { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('.kcm-열림띠', { timeout: 30000 }).catch(() => {})
    const 열림 = await p.evaluate(() => ({ 띠: (document.querySelector('.kcm-열림띠') || {}).innerText || '', 잠금: !!document.querySelector('.sg-lock') }))
    봐(/이 기기는 열려 있습니다/.test(열림.띠) && /손님 화면으로 보기/.test(열림.띠) && !열림.잠금, `폰 소장님 ${t.이름} — 🔑 열림띠 · «👀 손님 화면으로 보기» · 잠금 상자 없음`, 열림)
    if (t.길 === '/tools/wonclick' || t.길 === '/tools/sigong' || t.길 === '/tools/esc') {
      await p.click('.kcm-열림띠 button')
      await p.waitForSelector('.sg-lock', { timeout: 30000 }).catch(() => {})
      await 쉬어(800)
      const 손 = await p.evaluate(() => ({ 잠금: !!document.querySelector('.sg-lock'), 띠: (document.querySelector('.kcm-열림띠') || {}).innerText || '', 표: sessionStorage.getItem('kcm.손님보기'), op: localStorage.getItem('kcm_op') }))
      봐(손.잠금 && /손님 화면.*보는 중/.test(손.띠) && 손.표 === '1' && 손.op === '1', `폰 소장님 ${t.이름} — 👀 누르면 손님 화면(잠금 상자 · «보는 중») · 운영자 표식은 그대로`, 손)
      if (찍기) await p.screenshot({ path: `${찍기}/소장님_손님보기_${t.길.split('/').pop()}.png`, fullPage: false }).catch(() => {})
      await p.click('.kcm-열림띠 button')
      await p.waitForFunction(() => !document.querySelector('.sg-lock'), null, { timeout: 30000 }).catch(() => {})
      await 쉬어(800)
      const 돌 = await p.evaluate(() => ({ 잠금: !!document.querySelector('.sg-lock'), 띠: (document.querySelector('.kcm-열림띠') || {}).innerText || '', 표: sessionStorage.getItem('kcm.손님보기') }))
      봐(!돌.잠금 && /이 기기는 열려 있습니다/.test(돌.띠) && !돌.표, `폰 소장님 ${t.이름} — «↩ 원래대로» → 다시 열림`, 돌)
    }
    if (t.길 === '/tools/sigong') {
      await p.click('button:has-text("예시 내역서로 보기")').catch(() => {})
      await p.waitForSelector('.sg-pager select', { timeout: 60000 }).catch(() => {})
      await 쉬어(1500)
      const n = await p.evaluate(() => { const s = document.querySelector('.sg-pager select'); return s ? s.options.length : 0 })
      봐(n > 3, `폰 소장님 시공계획서 — 예시도 다 보임(넘기기 ${n}쪽)`, n)
    }
    if (찍기 && t.길 === '/tools/wonclick') await p.screenshot({ path: `${찍기}/소장님_원클릭.png`, fullPage: false }).catch(() => {})
    봐(!오류.length, `폰 소장님 ${t.이름} — 화면 오류 없음`, 오류)
    await ctx.close()
  }
} finally {
  await b.close()
}
console.log(`\n${ok + bad}개 중 맞음 ${ok} · 틀림 ${bad}`)
if (bad) { console.log('✗ 틀린 것이 있음'); process.exit(1) } else console.log('✓ 모두 맞음')
