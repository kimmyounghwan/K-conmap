// 📄 G669 잠근 도구 «문의» 시험 (2026-11-13 소장님 「준비중을 문의로 바꿔줘.. 막아 놓은 것 모두? 막아 놓고 문의해 달라고 해줘」)
//   ① 파일(인터넷 없이 — PC 올리기에도): 잠근 도구 9가지 jsx 에 «지금은 준비 중입니다» · «곧 엽니다» 가 남지 않음 · 잠금문의 단추를 씀 ·
//      잠금은 그대로(isOpen · 나운영자) · 잠금문의.jsx 문의갈래 = contact.html «서류 작성대행» 묶음(두 벌 대조) · contact.html 이 s · t 를 받음
//   ② 화면(주소를 주면 · PC 1280 · 폰 390): 손님 — 띠 «🔒 문의해 주세요» · 단추 고리(/contact?k=cn&s=…&t=…) · «준비 중» 없음 / 소장님(kcm_op) — 띠 없음 ·
//      문의 화면 — s 로 고른 갈래가 눌림(aria-pressed) · t 로 «자세히» 한 줄 · 엉뚱한 s 는 안 고름 · t 에 꺾쇠를 넣어도 글로만(꼬리표 안 생김) · 다른 문의(광고)는 그대로
//   돌리기: node tools/시험_잠금문의.mjs [주소]
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const 주소 = process.argv[2] || process.env.B || ''
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else { bad++; console.log('✗', m, 더) } }
const 읽기 = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8')

const 도구들 = [
  ['WonClick', '/tools/wonclick', '공사서류 원클릭'], ['SigongPlan', '/tools/sigong', '시공계획서'], ['SafetyPlan', '/tools/anjeon', '안전관리계획서'],
  ['HazardPlan', '/tools/yuhae', '유해위험방지계획서'], ['Jungcheo', '/tools/jungcheo', '중대재해'], ['ColorPlan', '/tools/colorplan', '컬러 평면도'],
  ['CadFix', '/tools/cadfix', '캐드 도면 고치기'], ['Esc', '/tools/esc', '물가변동 ESC'], ['HadoDocs', '/tools/hado-docs', '하도급 서류'],
]
/* ① 파일 */
for (const [f, , 이름] of 도구들) {
  const s = 읽기(`web/src/pages/${f}.jsx`)
  const 코드 = s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')     // 주석 뺌
  봐(!/지금은 준비 중입니다|곧 엽니다|준비 중입니다 —|받기는 준비 중|넘기기는 준비 중|올리기는 준비 중/.test(코드), `${f} «준비 중» · «곧 엽니다» 없음`)
  봐(/import 잠금문의 from '\.\.\/잠금문의\.jsx'/.test(s) && /<잠금문의 도구="[^"]+" (갈래="[^"]+" )?셈="[^"]+" \/>/.test(s), `${f} 잠금문의 단추`)
  봐(s.includes(`도구="${이름}`) || new RegExp(`도구="[^"]*${이름.split(' ')[0]}`).test(s), `${f} 도구 이름(${이름})`)
  봐(/문의해 주세요/.test(코드), `${f} «문의해 주세요» 글`)
  봐(/isOpen|나운영자/.test(s), `${f} 잠금은 그대로(isOpen · 나운영자)`)
}
const 잠 = 읽기('web/src/잠금문의.jsx')
const 갈래 = JSON.parse((/export const 문의갈래 = (\[[^\]]*\])/.exec(잠) || [])[1].replace(/'/g, '"'))
const 문 = 읽기('web/public/contact.html')
const 묶 = (/\['서류 작성대행', (\[[^\]]*\])\]/.exec(문) || [])[1]
봐(!!묶 && JSON.stringify(JSON.parse(묶.replace(/'/g, '"'))) === JSON.stringify(갈래), '잠금문의.jsx 문의갈래 = contact.html «서류 작성대행» 묶음', `${JSON.stringify(갈래)} / ${묶}`)
봐(/get\('s'\)/.test(문) && /get\('t'\)/.test(문) && /cm\.value = /.test(문) && !/innerHTML[^\n]*미리t/.test(문), 'contact.html 이 s · t 를 받음(t 는 value 로만)')
/* ①-2 🔒 G677 (11-13 소장님 «공사서류 원클릭 안 막았잖아» 확인하다 찾음) — G669 는 화면만 바꿔 구운 쪽(prerender.py · 검색 · 첫 화면)에 «지금은 준비 중 · 곧 엽니다» ·
 *      원클릭 «회원가입 없이 무료» · 구조화 자료 «무료 · 0원» 이 남아 있었음 → 구운 쪽도 «🔒 문의해 주세요 + 작성대행 · 견적 문의» 꼴 · 화면 jsx 에 «무료» 없음 */
const 구 = 읽기('prerender.py')
const 함수 = { WonClick: 'wonclick_page', SigongPlan: 'sigong_page', SafetyPlan: 'anjeon_page', HazardPlan: 'yuhae_page', Jungcheo: 'jungcheo_page',
  ColorPlan: 'colorplan_page', CadFix: 'cadfix_page', Esc: 'esc_page', HadoDocs: 'hadodocs_page' }
for (const [f] of 도구들) {
  const 코드 = 읽기(`web/src/pages/${f}.jsx`).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
  봐(!/무료/.test(코드), `${f} 화면 글에 «무료» 없음(잠근 도구)`)
  const i = 구.indexOf(`\ndef ${함수[f]}(`), j = 구.indexOf('\ndef ', i + 5)
  const 몸 = i < 0 ? '' : 구.slice(i, j).replace(/"""[\s\S]*?"""/g, '').replace(/#.*$/gm, '')       // 함수 설명 · 주석 뺌
  봐(!!몸, `prerender ${함수[f]} 있음`)
  봐(!/준비 중|곧 엽니다|무료|isAccessibleForFree|"price"/.test(몸), `prerender ${함수[f]} — «준비 중 · 곧 엽니다 · 무료 · 0원» 없음`, (몸.match(/준비 중|곧 엽니다|무료|isAccessibleForFree|"price"/) || [''])[0])
  봐(/_잠금문의\(/.test(몸) && (f === 'WonClick' || /locked=True\)/.test(몸)), `prerender ${함수[f]} — 문의 글 · 단추(_잠금문의) · locked`)
}
/*    도구 목록 카드 설명(tools.json «d» — /tools 목록 · 구운 /tools 쪽)도 «준비 중» 이 남아 있었음(시공계획서 · 중처법 · 컬러 평면도 · 캐드 고치기) → «K-건설맵이 직접 …» */
const 도구표 = JSON.parse(읽기('web/src/data/tools.json'))
const 설명 = {}
for (const pg of 도구표.pages || []) for (const it of pg.items || []) if (it.to) 설명[it.to] = it.d || ''
for (const [f, 길] of 도구들) {
  const d = 설명[길]
  봐(typeof d === 'string' && !!d, `tools.json ${길} 설명 있음`)
  봐(!/준비 중|곧 엽니다|무료/.test(d || ''), `tools.json ${길} 설명 — «준비 중 · 곧 엽니다 · 무료» 없음`, (String(d).match(/준비 중|곧 엽니다|무료/) || [''])[0])
  봐(/K-건설맵이 직접/.test(d || '') && /예시/.test(d || ''), `tools.json ${길} 설명 — «K-건설맵이 직접» · 예시`)
}
const 구갈래 = (/^문의갈래 = (\[[^\]]*\])/m.exec(구) || [])[1]
봐(!!구갈래 && JSON.stringify(JSON.parse(구갈래)) === JSON.stringify(갈래), 'prerender.py 문의갈래 = 잠금문의.jsx 문의갈래', `${구갈래}`)

/* ② 화면 */
if (주소) {
  const require = createRequire(import.meta.url)
  let chromium
  try { ({ chromium } = require('playwright')) } catch (e) { ({ chromium } = createRequire('/tmp/g10/pw/package.json')('playwright')) }
  const 브 = await chromium.launch()
  for (const [기기, w] of [['PC', 1280], ['폰', 390]]) {
    for (const 누구 of ['손님', '소장님']) {
      const 판 = await 브.newContext({ viewport: { width: w, height: 900 } })
      await 판.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs|kakaocdn|coupang/, (r) => r.fulfill({ status: 200, body: '' }))
      await 판.route(/firebaseio\.com/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
      await 판.addInitScript((op) => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); if (op) localStorage.setItem('kcm_op', '1') } catch (e) {} }, 누구 === '소장님')
      const A = await 판.newPage()
      let 오류 = []
      A.on('pageerror', (e) => 오류.push(String(e).slice(0, 160)))
      for (const [f, 길] of 도구들) {
        오류 = []
        await A.goto(주소 + 길, { waitUntil: 'domcontentloaded' })
        await A.waitForTimeout(1600)
        const r = await A.evaluate(() => {
          const 띠 = document.querySelector('.sg-lock')
          const a = 띠 && 띠.querySelector('a[href^="/contact?k=cn"]')
          return { 띠: !!띠, 글: 띠 ? 띠.innerText : '', 고리: a ? a.getAttribute('href') : '', 단추글: a ? a.textContent : '', 본문준비: /지금은 준비 중입니다|곧 엽니다/.test(document.body.innerText), 넘침: document.documentElement.scrollWidth - innerWidth }
        })
        if (누구 === '손님') {
          봐(r.띠 && /🔒 문의해 주세요/.test(r.글), `${기기} ${f} 손님 — 띠 «🔒 문의해 주세요»`, r.글.slice(0, 60))
          봐(/^\/contact\?k=cn&s=[^&]+&t=.+/.test(r.고리) && /작성대행 · 견적 문의/.test(r.단추글), `${기기} ${f} 문의 단추 고리`, r.고리)
          봐(!r.본문준비, `${기기} ${f} «준비 중» 없음`)
        } else {
          봐(!r.띠, `${기기} ${f} 소장님 — 잠금 띠 없음(씀)`)
        }
        if (기기 === '폰') 봐(r.넘침 <= 1, `${기기} ${f} ${누구} 가로 넘침 0`, `${r.넘침}`)
        봐(오류.length === 0, `${기기} ${f} ${누구} 화면 오류 0`, 오류.join(' | '))
      }
      if (누구 === '손님') {
        /* 문의 화면 — 미리 고름 */
        const 열기 = async (q) => { await A.goto(`${주소}/contact${q}`, { waitUntil: 'domcontentloaded' }); await A.waitForTimeout(500) }
        await 열기('?k=cn&s=' + encodeURIComponent('안전관리계획서') + '&t=' + encodeURIComponent('안전관리계획서'))
        let c = await A.evaluate(() => ({ 눌림: [...document.querySelectorAll('.cn-pick button[aria-pressed="true"]')].map((b) => b.textContent), 자세히: (document.getElementById('memo') || {}).value || '', 무슨: (document.getElementById('work') || {}).value || '' }))
        봐(c.눌림.length === 1 && c.눌림[0] === '안전관리계획서', `${기기} 문의 — s 로 «안전관리계획서» 미리 고름`, JSON.stringify(c.눌림))
        봐(c.자세히 === '«안전관리계획서» 작성대행 · 견적 문의합니다.', `${기기} 문의 — t 로 «자세히» 한 줄`, c.자세히)
        봐(/공사 연결 · 📄 서류 작성대행/.test(c.무슨), `${기기} 문의 — 무슨 일 그대로`, c.무슨)
        await 열기('?k=cn&s=' + encodeURIComponent('없는갈래') + '&t=' + encodeURIComponent('<img src=x onerror=alert(1)>'))
        c = await A.evaluate(() => ({ 눌림: document.querySelectorAll('.cn-pick button[aria-pressed="true"]').length, 자세히: (document.getElementById('memo') || {}).value || '', 꼬리표: document.querySelectorAll('img[src="x"]').length }))
        봐(c.눌림 === 0, `${기기} 문의 — 엉뚱한 s 는 안 고름`)
        봐(c.꼬리표 === 0 && c.자세히.startsWith('«<img'), `${기기} 문의 — t 꺾쇠는 글로만(꼬리표 안 생김)`, c.자세히.slice(0, 30))
        await 열기('?k=cn')
        c = await A.evaluate(() => ({ 눌림: document.querySelectorAll('.cn-pick button[aria-pressed="true"]').length, 자세히: (document.getElementById('memo') || {}).value || '' }))
        봐(c.눌림 === 0 && c.자세히 === '', `${기기} 문의 — 꼬리 없으면 전처럼(안 고름 · 빈 자세히)`)
        await 열기('?k=ad')
        c = await A.evaluate(() => ({ 묶음: document.querySelectorAll('.cn-pick').length, 무슨: (document.getElementById('work') || {}).value || '' }))
        봐(c.묶음 === 0 && /광고/.test(c.무슨), `${기기} 광고 문의(?k=ad)는 그대로`, c.무슨)
      }
      await 판.close()
    }
  }
  await 브.close()
}
console.log(`\n시험_잠금문의 ${ok}/${ok + bad}${주소 ? '' : ' (화면 빼고 — 주소를 주면 화면까지)'}`)
process.exit(bad ? 1 : 0)
