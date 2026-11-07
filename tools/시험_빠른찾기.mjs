/**
 * 🔎 빠른 찾기 — lib/빠른찾기.js 시험 · G404 (2026-10-25)
 *   node tools/시험_빠른찾기.mjs
 *   사이트 자료(web/src/data/*.json)로 목록을 만들어 사람들이 칠 말로 찾아 봄 — 맨 위가 그 일을 하는 화면이어야
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
const 여기 = path.dirname(fileURLToPath(import.meta.url))
const L = await import(pathToFileURL(path.join(여기, '..', 'web', 'src', 'lib', '빠른찾기.js')).href)
const 읽 = (f) => JSON.parse(fs.readFileSync(path.join(여기, '..', 'web', 'src', 'data', f), 'utf8'))

let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log((c ? '  ✓ ' : '  ✗ ') + m + (c ? '' : ' — ' + String(더).slice(0, 600))) }

console.log('① 초성 · 고른말')
봐(L.초성('거푸집') === 'ㄱㅍㅈ' && L.초성('A값 계산') === 'Aㄱ ㄱㅅ', '초성 — 거푸집 → ㄱㅍㅈ · 한글 아닌 글자는 그대로', L.초성('A값 계산'))
봐(L.고른말(' 설계 변경 · 작업대 ') === '설계변경작업대' && L.고른말('BIM 물량') === 'bim물량', '고른말 — 띄어쓰기 · 꾸밈 글자 빼고 소문자')

console.log('② 목록 — 사이트 자료로')
const 탭 = [{ to: '/tools', ic: '🧰', label: '도구' }, { to: '/qna', ic: '🗺', label: '맵톡' }]
const 목 = L.목록만들기({ 탭, tools: 읽('tools.json'), forms: 읽('forms-min.json'), change: 읽('change.json'), guide: 읽('guide.json'), cad: 읽('cad.json') })
const 셈 = 목.reduce((a, x) => ((a[x.갈래] = (a[x.갈래] || 0) + 1), a), {})
봐(목.length >= 250 && 셈.서식 >= 150 && 셈.계산기 >= 20 && 셈.도구 >= 40 && 셈['캐드 명령'] >= 10 && 셈.설계변경 >= 5 && 셈['입찰 알아보기'] >= 10 && 셈.화면 >= 15, `목록 ${목.length}개 — ${JSON.stringify(셈)}`)
봐(new Set(목.map((x) => x.to)).size === 목.length, '같은 주소 두 번 없음')
const 관리 = 목.filter((x) => /^\/(admin|report)/.test(x.to))
봐(!관리.length, '관리자 · 소장님만 보는 화면(/admin · /report)은 목록에 없음', 관리.map((x) => x.to))

console.log('③ 사람들이 칠 말 → 맨 위')
const 맨위 = (q) => (L.찾기(목, q, 5)[0] || {}).to
const 표 = [
  ['노무비', '/tools/nomubi'], ['ㄴㅁㅂ 계산기', '/tools/nomubi'], ['거푸집', '/tools/formwork-area'], ['ㄱㅍㅈ', '/tools/formwork-area'],
  ['철근 무게', '/tools/rebar-weight'], ['기성', '/change/gisung'], ['위험성평가', '/tools/risk'], ['설계변경 작업대', '/change/work'],
  ['맵톡', '/qna'], ['A값', '/tools/a-value'], ['투찰', '/'], ['하도급 내역서', '/naeyeok/hado'], ['길이 합계', '/cad/kl'], ['bim', '/jeoksan/bim'],
  ['적격심사 서류', '/tools/qualify-docs'], ['실적인정기간', '/tools/qualify-docs'], ['광고 제휴', '/ad'], ['광고문의', '/ad'],   /* 🗂 G551 · 📣 G549 */
  ['덤프 대수', '/tools/soil-volume'], ['토량환산계수', '/tools/soil-volume'], ['사토 운반', '/tools/soil-volume'],   /* 🚚 G553 */
  ['유토곡선', '/tools/tojeok'], ['매스커브', '/tools/tojeok'], ['토적표', '/tools/tojeok'], ['평균운반거리', '/tools/tojeok'],   /* 🏔 G571 */
  ['장비별 운반', '/tools/tojeok'], ['경제 운반거리', '/tools/tojeok'],   /* 🚜 G574 */
  ['사토장 거리', '/tools/tojeok'], ['토취장', '/tools/tojeok'],   /* 🚛 G575 */
]
const 틀린 = 표.filter(([q, to]) => 맨위(q) !== to)
봐(!틀린.length, `${표.length}가지 말 — 맨 위가 그 화면(노무비 · 초성 · 같은 뜻 «무게 = 중량» · 낱말 둘)`, JSON.stringify(틀린.map(([q, to]) => [q, to, 맨위(q)])))
봐(L.찾기(목, '거푸집', 10).some((x) => x.to === '/jeoksan/model'), '«거푸집» 에 적산컨맵(골조 모델)도 나옴(더 붙인 말)')
봐(!L.찾기(목, '', 5).length && !L.찾기(목, '   ', 5).length && !L.찾기(목, '쀏쀍', 5).length, '빈칸 · 없는 말 → 없음')

console.log('③-2 서식 탭의 모든 서식이 찾기에 — G500 소장님 「검색하는데 Tbm 회의록은 안나와」')
{
  /* forms.json(서식 탭) 의 서식이 forms-min.json(찾기 목록)에 빠지면 찾기에 안 나옴 — 사이트 작성 서식 36가지가 빠져 있었음 */
  const 서식 = 읽('forms.json').forms
  const 빠짐 = 서식.filter((f) => !목.some((x) => x.to === '/forms/' + f.slug && x.t === f.title))
  봐(!빠짐.length, `서식 탭 ${서식.length}가지가 모두 찾기 목록에 같은 제목으로`, 빠짐.map((f) => f.slug).join(' · '))
  const tbm = L.찾기(목, 'TBm', 10).map((x) => x.to)
  봐(tbm.includes('/forms/tbm-hoeui') && tbm.includes('/forms/tbm'), '«TBm»(대소문자 섞어) → TBM 회의록 · TBM 일지 둘 다', tbm.join(' · '))
  봐((L.찾기(목, 'tbm 회의록', 3)[0] || {}).to === '/forms/tbm-hoeui', '«tbm 회의록» → 맨 위 TBM 회의록', JSON.stringify(L.찾기(목, 'tbm 회의록', 3).map((x) => x.to)))
  봐((L.찾기(목, '화기작업', 3)[0] || {}).to === '/forms/hg-hwagi' && (L.찾기(목, '굴착 작업계획서', 3)[0] || {}).to === '/forms/jg-gulchak', '«화기작업» → 화기작업 허가서 · «굴착 작업계획서» → 굴착 작업계획서(사이트 작성 서식)', JSON.stringify([L.찾기(목, '화기작업', 3).map((x) => x.to), L.찾기(목, '굴착 작업계획서', 3).map((x) => x.to)]))
}

console.log('③-3 G504 오늘(G499) 만든 것 · 화면마다 찾기에 — 소장님 「오늘 만든 것 모두 검색 되게 했지???」')
{
  const 기능 = [['품의서', '/how#baro-pum'], ['투찰 품의서', '/how#baro-pum'], ['관심도', '/how#baro-gwan'], ['복기', '/how#baro-bok'], ['넣은 금액', '/how#baro-bok'],
    ['낙찰 서류 한 벌', '/forms/hanbeol'], ['낙찰 서류', '/forms/hanbeol'], ['바로투찰 사용법', '/how#baro'], ['분석실', '/bunseok'], ['나라장터 밖', '/ext'], ['투찰', '/']]
  const 틀림 = 기능.filter(([q, to]) => 맨위(q) !== to)
  봐(!틀림.length, `오늘 만든 기능 · 없던 화면 ${기능.length}가지 말 → 맨 위가 그 자리(«투찰» 은 그대로 바로투찰)`, JSON.stringify(틀림.map(([q, to]) => [q, to, 맨위(q)])))
  /* #주소가 화면에 정말 있음 — 바로투찰사용법.jsx 단계주소표 · How.jsx id="baro" */
  const 사용법 = fs.readFileSync(path.join(여기, '..', 'web', 'src', '바로투찰사용법.jsx'), 'utf8')
  const how = fs.readFileSync(path.join(여기, '..', 'web', 'src', 'pages', 'How.jsx'), 'utf8')
  const 샵 = 목.filter((x) => x.to.includes('#')).map((x) => x.to)
  const 없는샵 = 샵.filter((to) => { const [p, h] = to.split('#'); return !(p === '/how' && (h === 'baro' ? /id="baro"/.test(how) : new RegExp(`'${h}'`).test(사용법))) })
  봐(샵.length >= 4 && !없는샵.length && /주소칸으로\(\)/.test(how), `#주소 ${샵.length}곳이 화면에 있음(보는 방법 단계 id) · 보는 방법이 #주소로 내려감`, 없는샵.join(' · '))
  /* main.jsx 의 길(:값 없는 것)은 모두 찾기에 — 아니면 «뺌» 에 까닭과 함께. 새 화면을 만들고 찾기에 안 넣으면 여기서 막힘(재발 막기) */
  const 뺌 = { '/calc': '바로투찰(/)과 같은 화면', '/svc': '/svc/live 와 같은 화면', '/goods': '/goods/live 와 같은 화면', '/report': '/ 로 넘김',
    '/report/make': '소장님만(성적표 만들기)', '/report/agency': '소장님만(기관 보고서)', '/admin': '관리자', '/jeoksan/lab': '소장님 실험실(열쇠말)', '/tools/tuipbi/v': '업체가 받은 링크로만 여는 입력 화면' }
  const main = fs.readFileSync(path.join(여기, '..', 'web', 'src', 'main.jsx'), 'utf8')
  const 길 = [...main.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1]).filter((p) => !p.includes(':') && p !== '*')
  const 있 = new Set(목.map((x) => x.to.split('#')[0]))
  const 빠 = 길.filter((p) => !있.has(p) && !뺌[p])
  봐(길.length >= 80 && !빠.length, `화면 길 ${길.length}곳 — 모두 찾기에 있거나 «뺌»(까닭 적음)`, 빠.join(' · '))
  const 남은뺌 = Object.keys(뺌).filter((p) => 있.has(p) || !길.includes(p))
  봐(!남은뺌.length, '«뺌» 목록에 찾기에 이미 있거나 없어진 길이 남지 않음', 남은뺌.join(' · '))
}

console.log('③-4 G510 — 소장님 「만든 도구들 모두 사이트에서 검색했을때 나오게 하고, 구글이나 네이버에서도 검색 되게 해줘」')
{
  /* 판단기 · 노무 도구 — 사람들이 칠 말이면 맨 위가 그 도구 */
  const 말 = [['실업급여', '/tools/ilyong-silup'], ['구직급여', '/tools/ilyong-silup'], ['일용직 실업급여', '/tools/ilyong-silup'],
    ['휴업급여', '/tools/sanjae-hyueop'], ['산재 휴업급여', '/tools/sanjae-hyueop'], ['주휴수당', '/tools/juhyu'], ['주휴', '/tools/juhyu'], ['일용직 주휴수당', '/tools/juhyu'],
    ['퇴직공제', '/tools/toejik'], ['노무비', '/tools/nomubi'],
    /* 아무것도 안 나오던 말(흔한 말 90개 점검) */ ['산안비', '/tools/sanan'], ['개산보험료', '/tools/boheomryo'], ['확정보험료', '/tools/boheomryo'],
    /* 💼 G515 일용직 퇴직금 판단기 — «퇴직금» 은 이제 판단기 · 퇴직공제는 그대로 */ ['퇴직금', '/tools/ilyong-toejikgeum'], ['일용직 퇴직금', '/tools/ilyong-toejikgeum'], ['퇴직금 계산', '/tools/ilyong-toejikgeum'], ['퇴직금계산기', '/tools/ilyong-toejikgeum']]
  const 틀림 = 말.filter(([q, to]) => 맨위(q) !== to)
  봐(!틀림.length, `판단기 · 노무 도구 ${말.length}가지 말 → 맨 위가 그 도구`, JSON.stringify(틀림.map(([q, to]) => [q, to, 맨위(q)])))
  /* 뜻이 넓은 말은 위 3 안에(«4대보험» 은 설명(ilyong-guide)이 맨 위 · 판단기는 둘째) */
  const 넓 = [['4대보험', '/tools/ilyong-boheom'], ['4대보험', '/tools/ilyong-guide'], ['산재', '/tools/sanjae-hyueop'], ['일용직', '/tools/ilyong-silup'], ['최저임금', '/tools/juhyu']]
  const 넓틀 = 넓.filter(([q, to]) => !L.찾기(목, q, 3).some((x) => x.to === to))
  봐(!넓틀.length, `뜻이 넓은 말 ${넓.length}가지 → 위 3 안에`, JSON.stringify(넓틀.map(([q, to]) => [q, to, L.찾기(목, q, 3).map((x) => x.to)])))
  /* 도구 · 계산기 · 화면 하나하나 — 제 이름(— 앞)으로 찾으면 위 3 안에(새 도구를 만들면 저절로 시험에 들어감) */
  const 도구들 = 목.filter((x) => ['도구', '계산기', '화면'].includes(x.갈래))
  const 못 = 도구들.filter((x) => { const q = x.t.split(/ — | · |\(|,/)[0].replace(/[^\p{L}\p{N}\s]/gu, ' ').trim(); return !L.찾기(목, q, 3).some((y) => y.to === x.to) })
  봐(도구들.length >= 100 && !못.length, `도구 · 계산기 · 화면 ${도구들.length}곳 — 제 이름으로 찾으면 모두 위 3 안에`, 못.map((x) => x.to + ' ' + x.t).join(' · '))
  /* 도구 탭 카드 · 계산기 주소가 사이트맵(sitemap.py)에 — 구글 · 네이버가 찾아오는 길. /lic 는 licstat.json 이 있을 때만 굽고 내서(조건부) 뺌 */
  const sm = fs.readFileSync(path.join(여기, '..', 'sitemap.py'), 'utf8')
  const 글자 = new Set([...sm.matchAll(/"(\/[^"\s{}]*)"/g)].map((m) => m[1]))
  const T = 읽('tools.json')
  const 슬 = new Set((T.tools || []).map((t) => '/tools/' + t.slug))
  const 바 = new Set((읽('change.json').topics || []).map((t) => '/change/' + t.slug))
  const 카드 = (T.pages || []).flatMap((p) => (p.items || []).map((it) => it.to)).filter((to) => to && to.startsWith('/'))
  const 맵빠짐 = 카드.filter((to) => to !== '/' && to !== '/lic' && !글자.has(to) && !슬.has(to) && !바.has(to))
  봐(카드.length >= 50 && !맵빠짐.length && /\/tools\/\{t\["slug"\]\}/.test(sm), `도구 탭 카드 ${카드.length}곳 · 계산기 ${슬.size}곳이 모두 사이트맵에(sitemap.py)`, 맵빠짐.join(' · '))
  /* IndexNow(네이버 · 빙) — prerender.py 가 도구 카드 · 계산기 주소를 tools.json 에서 바로 뽑아 «한 번씩» 알림 */
  const pr = fs.readFileSync(path.join(여기, '..', 'prerender.py'), 'utf8')
  봐(/def tool_urls_for_indexnow\(\)/.test(pr) && /_static = STATIC_NEW \+ .*tool_urls_for_indexnow\(\)/.test(pr), 'IndexNow 알릴 주소에 도구 카드 · 계산기 전부(prerender.py tool_urls_for_indexnow)')
}

console.log('③-5 G513 — 소장님 「오늘 올린 거 점검 다시 해줘 … 이용자 입장에서」 · 흔한 말 120개 중 아무것도 안 나오던 말')
{
  봐(JSON.stringify(L.둘씩('장비일보')) === '["장비","일보"]' && JSON.stringify(L.둘씩('기성청구서')) === '["기성","청구","구서"]', '두 글자씩 — 장비일보 → 장비 · 일보 · 기성청구서 → 기성 · 청구 · 구서(홀수 끝 겹침)')
  const 말 = [['기성청구서', '/forms/gisung-cheonggu'], ['출력부', '/tools/nomubi'], ['안전교육일지', '/forms/anjeon-gyoyuk'], ['안전교육', '/forms/anjeon-gyoyuk'],
    ['하자보증', '/tools/defect-period'], ['월간보고', '/forms/wolgan-bogoseo'], ['장비일보', '/forms/janggi-gadong'], ['유류대장', '/forms/yuryu'], ['안전모', '/forms/bohogu'],
    ['신규채용교육', '/forms/anjeon-gyoyuk'], ['청렴서약서', '/forms/cheongryeom'], ['실행예산', '/forms/silhaeng-daebipyo'], ['자재검수', '/forms/jajae-geomsu'], ['재해보고', '/forms/sago-bogo']]
  const 틀림 = 말.filter(([q, to]) => 맨위(q) !== to)
  봐(!틀림.length, `아무것도 안 나오던 말 ${말.length}가지 → 맨 위가 그 서식 · 도구`, JSON.stringify(틀림.map(([q, to]) => [q, to, 맨위(q)])))
  봐(L.찾기(목, '출역부', 5).some((x) => x.to === '/forms/chulyeok-ilbo') && L.찾기(목, '환경관리', 5).some((x) => x.to === '/forms/bisan'), '«출역부» 에 출역일보(서식) · «환경관리» 에 비산먼지 점검표도')
  /* 두 글자씩은 «다 들었을 때만» — 엉뚱한 것이 끼지 않게 */
  봐(!L.찾기(목, '쀏쀍쀏쀍', 5).length && !L.찾기(목, '가나다라', 5).length, '없는 말(두 글자씩도 없음) → 없음')
  const 창 = fs.readFileSync(path.join(여기, '..', 'web', 'src', '빠른찾기창.jsx'), 'utf8')
  봐(/const 앞섬 = \(x\) => 고른말\(x\.t\)\.startsWith\(친\)/.test(창) && /\.\.\.나머지, \.\.\.기\.filter\(\(x\) => !앞섬\(x\)\)/.test(창), '기관 · 업체는 이름이 친 말로 시작할 때만 도구 · 서식 위(«안전교육» → 기관이 서식보다 먼저 나오던 것)')
}

console.log('④ 공고 번호')
const 공 = L.찾기(목, 'r26bk01693749-000', 5)
봐(공[0] && 공[0].갈래 === '공고' && 공[0].to === '/notice/R26BK01693749', '«r26bk01693749-000» → 맨 위 «공고 R26BK01693749 열기»(대문자 · 차수 뺌)', JSON.stringify(공[0]))
봐(L.공고번호('20261024123-00') === '20261024123-00' && L.공고번호('2026') === null && L.공고번호('노무비') === null, '옛 번호(20261024123-00) · 숫자 몇 개 · 낱말은 공고 아님')

console.log(`\n${ok + bad}개 중 맞음 ${ok} · 틀림 ${bad}`)
if (bad) { console.log('✗ 틀린 것이 있음'); process.exit(1) } else console.log('✓ 모두 맞음')
