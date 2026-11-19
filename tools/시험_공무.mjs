/**
 * 🧰 G784 공무 올인원 셈 시험 (2026-11-19) — lib/공무차례.js · lib/내현장.js(바뀜 사건 · «했음» 지킴) · 등록(길 · 도구 목록 · 설명 · 굽기 · 사이트맵 · 빠른찾기 · 쓴수판)
 *   소장님 「하나로 연결시켜서 도구화 가능해」 → 「우리가 할 수 있는 것만 하고, 못하는 거는 제외해」 「못한다고는 하지 말고」
 *   node tools/시험_공무.mjs   (PC 올리기에서도 돌림 — 기본 모듈만)
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const 뿌리 = fileURLToPath(new URL('..', import.meta.url))
const 읽기 = (p) => readFileSync(뿌리 + p, 'utf8').replace(/\r\n/g, '\n')
let ok = 0, bad = 0
const 참 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log(c ? '  ✓' : '  ✗', m, c ? '' : 더) }

/* 가짜 저장소 — 내현장 시험용 */
const 칸 = new Map()
const S = { getItem: (k) => (칸.has(k) ? 칸.get(k) : null), setItem: (k, v) => { 칸.set(k, String(v)) }, removeItem: (k) => { 칸.delete(k) } }
globalThis.localStorage = S
const G = await import('../web/src/lib/공무차례.js')
const H = await import('../web/src/lib/내현장.js')

console.log('■ 차례')
참(G.단계들.length === 3 && G.단계들.map((s) => s.k).join() === '착공,공사,준공', '단계 셋 — 착공 전 · 공사 중 · 준공')
const ids = G.모든도구.map((t) => t.id)
참(ids.length === 13 && new Set(ids).size === ids.length, `도구 ${ids.length}개 · 번호 겹침 없음`, ids.join())
참(G.모든도구.every((t) => t.아이콘 && t.이름 && t.한줄 && /^\//.test(t.주소)), '도구마다 아이콘 · 이름 · 한 줄 · 주소')
참(G.모든도구.every((t) => G.했음열쇠(t.id).length <= 30), '✓ 열쇠는 내 현장 «했음» 칸 길이(30) 안')

/* 주소가 사이트에 있는가 — 길(main.jsx) · 계산 도구(tools.json tools) · 서식(forms.json) */
const 메인 = 읽기('web/src/main.jsx')
const 도구표 = JSON.parse(읽기('web/src/data/tools.json'))
const 계산 = new Set((도구표.tools || []).map((x) => '/tools/' + x.slug))
const 서식글 = 읽기('web/src/data/forms.json')
const 있나 = (주소) => {
  if (메인.includes(`path="${주소}"`)) return true
  if (계산.has(주소)) return true
  const m = 주소.match(/^\/forms\/([a-z0-9-]+)$/)
  return !!(m && 서식글.includes(`"slug": "${m[1]}"`))
}
const 없는 = G.모든도구.filter((t) => !있나(t.주소)).map((t) => t.주소)
참(!없는.length, '주소 13 모두 사이트에 있음(길 · 계산 도구 · 서식)', 없는.join())
참(G.모든도구.filter((t) => t.현장값).map((t) => t.id).join() === 'schedule,daejang,jungong', '«이 현장 값» 표는 서식 공통 칸을 읽는 것만(예정공정표 · 공사안전보건대장 · 준공계)')

console.log('■ 진행 · 지금 단계')
참(G.진행(null).한 === 0 && G.진행(null).다 === 13, '현장 없음 → 0 / 13')
const 진 = G.진행({ 했음: ['gm:sigong', 'gm:schedule', 'gm:esc', '착공', 'gm:없는것'] })
참(진.한 === 3 && 진.단계.map((x) => `${x.한}/${x.다}`).join() === '2/5,1/6,0/2', '✓ — 착공 전 2/5 · 공사 중 1/6 · 준공 0/2(다른 «했음» 열쇠는 안 셈)', JSON.stringify(진))
const 현 = { 착공: '2026-12-01', 준공: '2027-06-30' }
참(G.지금단계(현, '2026-11-19') === '착공' && G.지금단계(현, '2026-12-01') === '공사' && G.지금단계(현, '2027-05-31') === '준공' && G.지금단계(현, '2027-05-30') === '공사' && G.지금단계(null, '2026-11-19') === '착공',
  '지금 단계 — 착공 전 · 착공일부터 공사 중 · 준공 30일 안부터 준공')

console.log('■ 내 현장(같은 장부)')
const 사건 = []
globalThis.window = { dispatchEvent: (e) => { 사건.push(e.type); return true } }
globalThis.Event = class { constructor(t) { this.type = t } }
const r = H.저장({ 현장: '○○지구 가상 공사', 착공: '2026-12-01', 준공: '2027-06-30' }, S)
참(r.현장 && 사건.includes(H.바뀜사건) && H.바뀜사건 === 'kcm-내현장', '현장을 적으면 «kcm-내현장» 사건(공무 올인원 · 내 현장 칸이 다시 읽음)')
const id = r.현장.id
H.했음바꿈(id, G.했음열쇠('sigong'), true, S)
const 옛 = { ...H.지금현장(H.읽기(S)), 했음: ['착공'] }   /* 고치기 창을 연 뒤(옛 값) 다른 칸에서 ✓ 가 늘어난 셈 */
H.했음바꿈(id, G.했음열쇠('schedule'), true, S)
H.저장({ ...옛, 발주: '가상시청' }, S)
const 뒤 = H.지금현장(H.읽기(S))
참(뒤.발주 === '가상시청' && 뒤.했음.includes('gm:sigong') && 뒤.했음.includes('gm:schedule'), '고쳐 저장해도 저장된 ✓ 그대로(옛 «했음» 으로 덮지 않음)', JSON.stringify(뒤.했음))
H.했음바꿈(id, G.했음열쇠('sigong'), false, S)
참(!H.지금현장(H.읽기(S)).했음.includes('gm:sigong'), '✓ 다시 누르면 되돌림')
const 옛2 = { ...H.지금현장(H.읽기(S)) }   /* 고치기 창을 연 뒤(옛 값 ✓ 있음) 다른 칸에서 ✓ 를 다 지운 셈 */
for (const k of [...옛2.했음]) H.했음바꿈(id, k, false, S)
H.저장({ ...옛2, 발주: '가상구청' }, S)
const 뒤2 = H.지금현장(H.읽기(S))
참(뒤2.발주 === '가상구청' && 뒤2.했음.length === 0 && 옛2.했음.length > 0, '✓ 를 다 지운 뒤 고쳐 저장해도 옛 ✓ 가 되살아나지 않음', JSON.stringify([옛2.했음, 뒤2.했음]))
delete globalThis.window

console.log('■ 등록 · 글')
참(/const Gongmu = lazyPage\(\(\) => import\('\.\/pages\/Gongmu\.jsx'\)\)/.test(메인) && 메인.includes('<Route path="/tools/gongmu"'), '길 /tools/gongmu')
const 목록 = (도구표.pages || []).flatMap((c) => c.items || [])
const 줄 = 목록.find((x) => x.to === '/tools/gongmu')
참(!!줄 && 줄.new === true && 줄.w === 'site' && (도구표.pages.find((c) => c.key === 'file').items[0].to === '/tools/gongmu'), '도구 목록 «문서·파일» 맨 앞 · new')
const 설명 = JSON.parse(읽기('web/src/data/tools_guide.json')).gongmu
참(!!설명 && 설명.what && 설명.how.length >= 3 && 설명.at === '2026-11-19', '설명(tools_guide «gongmu»)')
const 굽기 = 읽기('prerender.py'), 지도 = 읽기('sitemap.py')
참(/def gongmu_page\(/.test(굽기) && 굽기.includes('write("tools/gongmu.html"') && 지도.includes('"/tools/gongmu"'), '구운 쪽(prerender) · 사이트맵')
참(읽기('web/src/lib/빠른찾기.js').includes("'/tools/gongmu':") && 읽기('web/src/lib/쓴수판.jsx').includes("['/tools/gongmu', ['|공무']]"), '빠른찾기 · 쓴수판 |공무')
const 화면 = 읽기('web/src/pages/Gongmu.jsx').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
const 새글 = [화면, JSON.stringify(설명), JSON.stringify(줄), 굽기.slice(굽기.indexOf('def gongmu_page'), 굽기.indexOf('def jeongsan_page'))].join('\n')
참(!/무료|클로드|유료|이용권/.test(새글), '새 글에 «무료 · 클로드 · 유료 · 이용권» 없음')
참(!/못 ?합니다|하지 않습니다|할 수 없|토목설계|구조 검토|수리수문|도로대장|기술사/.test(새글), '「못한다고는 하지 말고」 — 못 하는 일 · 하지 않는 일을 적지 않음')
참(!/firebase|fetch\(/.test(화면), '현장 · ✓ 는 이 기기에만(서버로 보내는 코드 없음)')

console.log(`\n${bad ? '❌' : '✅'} 시험_공무 ${ok}/${ok + bad}`)
process.exit(bad ? 1 : 0)
