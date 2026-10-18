// 👥 G315 방문자 — 건설맵이 직접 셈(web/src/lib/방문세기.js) 시험 · node tools/시험_방문세기.mjs (인터넷 없이)
//   ① 시·도 고르기(geojs) · 애널리틱스 쿠키 «처음 온 시각» · 직접줄들(바탕 + 직접 센 것)
//   ② 세어보기 — 가짜 데이터베이스(규칙 vis 와 같은 꼴 · 1씩만 · 열쇠 묶음)에 0시 전 · 0시 뒤 · 하루 한 번 · 처음 온 사람만 누적 · 옛사람 · 운영자 · 봇 · 숨은 탭
//   ③ 규칙 파일(web/database.rules.json vis)의 시·도 열쇠 = 방문세기.js 시도열쇠 + f · x
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const 여기 = path.dirname(fileURLToPath(import.meta.url))
let 통과 = 0, 실패 = 0
const 봄 = (n, ok, 더 = '') => { ok ? 통과++ : 실패++; console.log(ok ? '  ✓' : '  ✗', n, ok ? '' : 더) }

/* 브라우저 흉내 */
const 곳간 = new Map()
globalThis.window = globalThis
globalThis.localStorage = { getItem: (k) => (곳간.has(k) ? 곳간.get(k) : null), setItem: (k, v) => 곳간.set(k, String(v)), removeItem: (k) => 곳간.delete(k), key: () => null, length: 0 }
globalThis.document = { visibilityState: 'visible', cookie: '', addEventListener: () => {} }
let 막힌저장 = false, 지금고장 = false, 서버시각 = 0
if (!globalThis.crypto) globalThis.crypto = (await import('crypto')).webcrypto
const 원getItem = localStorage.getItem
/* 가짜 데이터베이스 — 규칙 vis 그대로(1씩만 · 날짜 · 시·도 열쇠) · ETag */
const 디비 = new Map(); let 쓴 = []; let 지오 = { country_code: 'KR', region: 'Jeollanam-do', city: 'Gwangyang' }
const 열쇠꼴 = /^(seoul|busan|incheon|daegu|daejeon|gwangju|ulsan|sejong|gyeonggi|gangwon|chungbuk|chungnam|jeonbuk|jeonnam|gyeongbuk|gyeongnam|jeju|f|x)$/
const 날꼴 = /^20[0-9][0-9]-[01][0-9]-[0-3][0-9]$/
function 규칙맞나(길) {
  const p = 길.split('/')
  if (p[0] === 'd' && p.length === 3 && p[2] === 'n') return 날꼴.test(p[1])
  if (p[0] === 'd' && p.length === 4 && p[2] === 'r') return 날꼴.test(p[1]) && 열쇠꼴.test(p[3])
  if (p[0] === 'd' && p.length === 4 && p[2] === 'c') return 날꼴.test(p[1]) && /^[0-9]{2,5}$/.test(p[3])
  if (p[0] === 'a' && p.length === 2 && p[1] === 'n') return true
  if (p[0] === 'a' && p.length === 3 && p[1] === 'r') return 열쇠꼴.test(p[2])
  return false
}
const 응답 = (status, body, h = {}) => ({ ok: status >= 200 && status < 300, status, headers: { get: (k) => h[k.toLowerCase()] ?? null }, json: async () => body })
globalThis.fetch = async (url, o = {}) => {
  if (url.startsWith('https://get.geojs.io/')) return 지오 ? 응답(200, 지오) : 응답(500, null)
  const [주소, 물음] = url.split('?')
  const m = /\/vis\/(.+)\.json$/.exec(주소)
  if (!m) return 응답(404, null)
  const 길 = m[1]
  if (길 === 'on' && (!o.method || o.method === 'GET')) {   // 지금(30분) — orderBy="$value"&startAt= (규칙 .indexOn 있어야 됨)
    if (지금고장) return 응답(400, { error: 'Index not defined' })
    const q = new URLSearchParams(물음 || '')
    if (q.get('orderBy') !== '"t"') return 응답(400, { error: 'orderBy' })
    const 앞 = Number(q.get('startAt')); const 묶 = {}
    for (const [k, v] of 디비) if (k.startsWith('on/') && v && v.t >= 앞) 묶[k.slice(3)] = v
    return 응답(200, Object.keys(묶).length ? 묶 : null)
  }
  if (o.method === 'PUT' && 길.startsWith('on/')) {         // 규칙: 번호 16자 · {t: 서버 시각만, k: 숫자 2~5자리(없어도 됨)} · 다른 칸 막힘
    let b = null; try { b = JSON.parse(o.body) } catch (e) { b = null }
    const 맞 = /^on\/[a-z0-9]{16}$/.test(길) && b && typeof b === 'object' && JSON.stringify(b.t) === '{".sv":"timestamp"}'
      && (b.k === undefined || (typeof b.k === 'string' && /^[0-9]{2,5}$/.test(b.k))) && Object.keys(b).every((x) => x === 't' || x === 'k')
    if (!맞) return 응답(401, { error: 'Permission denied' })
    디비.set(길, { t: 서버시각, ...(b.k ? { k: b.k } : {}) }); 쓴.push(길); return 응답(200, {})
  }
  if (!o.method || o.method === 'GET') {
    if (길 === 'a' || /^d\/[^/]+$/.test(길)) {        // 묶음 읽기
      const 앞 = 길 + '/'; const 묶 = {}
      for (const [k, v] of 디비) if (k.startsWith(앞)) { const 뒤 = k.slice(앞.length).split('/'); if (뒤.length === 1) 묶[뒤[0]] = v; else { 묶[뒤[0]] = 묶[뒤[0]] || {}; 묶[뒤[0]][뒤[1]] = v } }
      return 응답(200, Object.keys(묶).length ? 묶 : null)
    }
    const v = 디비.has(길) ? 디비.get(길) : null
    return 응답(200, v, { etag: 'e' + (v ?? 'null') })
  }
  if (o.method === 'PUT') {
    const v = 디비.has(길) ? 디비.get(길) : null
    if (o.headers['if-match'] !== 'e' + (v ?? 'null')) return 응답(412, null)
    const 새 = Number(o.body)
    if (!규칙맞나(길) || 새 !== (v ?? 0) + 1) return 응답(401, { error: 'Permission denied' })
    디비.set(길, 새); 쓴.push(길)
    return 응답(200, 새)
  }
  return 응답(405, null)
}

const B = await import('../web/src/lib/방문세기.js')
const 지도바탕 = JSON.parse(fs.readFileSync(path.join(여기, '..', 'web', 'src', 'data', '한국지도.json'), 'utf8'))
B.시험바탕(지도바탕)
const KST = (s) => Date.parse(s + '+09:00')

/* ── ① ── */
봄('시도고르기 — 전남 · 서울 · 경기 · 새 이름(Gangwon State) · 해외 f · 모름 x',
  B.시도고르기({ country_code: 'KR', region: 'Jeollanam-do' }) === 'jeonnam' && B.시도고르기({ country_code: 'KR', region: 'Seoul' }) === 'seoul'
  && B.시도고르기({ country_code: 'kr', region: 'Gyeonggi-do' }) === 'gyeonggi' && B.시도고르기({ country_code: 'KR', region: 'Gangwon State' }) === 'gangwon'
  && B.시도고르기({ country_code: 'KR', region: 'Chungcheongbuk-do' }) === 'chungbuk' && B.시도고르기({ country_code: 'KR', region: 'North Gyeongsang' }) === 'gyeongbuk'
  && B.시도고르기({ country_code: 'KR', region: '', city: 'Busan' }) === 'busan' && B.시도고르기({ country_code: 'VN', region: 'Hanoi' }) === 'f'
  && B.시도고르기({ country_code: 'KR', region: '' }) === 'x' && B.시도고르기(null) === 'x' && B.시도고르기({}) === 'x')
봄('시도열쇠 열일곱 시·도 · 거꾸로(열쇠시도)', Object.keys(B.시도열쇠).length === 17 && B.열쇠시도.jeonnam === '전남' && B.열쇠시도.seoul === '서울')
const 옛쿠키 = '_gid=GA1.2.1.2; _ga=GA1.1.123456789.' + Math.floor(KST('2026-09-20T10:00:00') / 1000) + '; x=1'
const 새쿠키 = '_ga=GA1.1.987654321.' + Math.floor(KST('2026-10-19T08:00:00') / 1000)
봄('처음온때 · 옛사람 — 쿠키의 처음 온 시각이 10/19 0시 전이면 옛사람', B.처음온때(옛쿠키) === KST('2026-09-20T10:00:00') && B.옛사람(옛쿠키) && !B.옛사람(새쿠키) && !B.옛사람('') && B.처음온때('_ga_ABC=GS1.1.x') === null)
봄('직접인가 — 10/18 23:59:59 아님 · 10/19 0시부터', !B.직접인가(KST('2026-10-18T23:59:59')) && B.직접인가(KST('2026-10-19T00:00:00')))
const 바탕 = { r: { Seoul: { a: 612, t: 9 }, 'Jeollanam-do': { a: 19 }, notset: { a: 4 } }, f: { a: 7, t: 1 }, kr: { a: 1884 }, w: { a: 1891, t: 23 } }
const 직 = { a: { n: 5, r: { seoul: 2, jeonnam: 2, f: 1 } }, d: { n: 9, r: { seoul: 3, jeonnam: 4, busan: 1, f: 1 } }, 날: '2026-10-19', at: 1 }
const 줄 = B.직접줄들(바탕, 직, KST('2026-10-19T09:00:00'))
const 찾 = (n) => 줄.줄.find((x) => x.n === n) || {}
봄('직접줄들 — 누적 = 애널리틱스(10/18 까지) + 직접 누적 · 오늘 = 직접 오늘 · 해외 맨 끝 · 기타',
  줄.전국.a === 1896 && 줄.전국.t === 9 && 찾('서울').a === 614 && 찾('서울').t === 3 && 찾('전남').a === 21 && 찾('전남').t === 4
  && 찾('부산').a === 0 && 찾('부산').t === 1 && 찾('기타').a === 4 && 줄.줄[줄.줄.length - 1].n === '해외' && 찾('해외').a === 8 && 찾('해외').t === 1 && 줄.합계 && 줄.직접, JSON.stringify(줄))
const 밤 = B.직접줄들(바탕, 직, KST('2026-10-20T00:01:00'))
봄('직접줄들 — 자정 지나 아직 새로 안 받았으면 오늘 0 · 누적은 그대로', 밤.전국.t === 0 && 밤.전국.a === 1896 && 밤.줄.every((x) => x.t === 0), JSON.stringify(밤.전국))
봄('직접줄들 — 바탕(애널리틱스)을 못 받아도 직접 센 것으로', B.직접줄들(null, 직, KST('2026-10-19T09:00:00')).전국.a === 5 && B.직접줄들(null, null) === null)

/* ── ② 세어보기 ── */
const 처음 = async (때, 이름) => { const r = await B.세어보기(때); return r }
let r = await 처음(KST('2026-10-18T23:59:00'))
봄('0시 전 — 아무것도 안 셈 · 기억도 안 남김', r === null && 쓴.length === 0 && !곳간.has('kcm.vis'))
r = await 처음(KST('2026-10-19T00:00:05'))
봄('0시 뒤 처음 온 사람(광양) — 오늘 n · 오늘 전남 · 오늘 다녀간 곳 광양(46230) · 누적 n · 누적 전남 (5곳 +1)', JSON.stringify([...쓴].sort()) === JSON.stringify(['a/n', 'a/r/jeonnam', 'd/2026-10-19/c/46230', 'd/2026-10-19/n', 'd/2026-10-19/r/jeonnam']) && 디비.get('a/n') === 1, JSON.stringify(쓴))
봄('자리 기억 = {d, s 전남, k 광양} — 하루 한 번만 물음', 곳간.get('kcm.vis.loc') === JSON.stringify({ d: '2026-10-19', s: 'jeonnam', k: '46230' }), 곳간.get('kcm.vis.loc'))
봄('기억 = {d: 10/19, a: 1} (보내기 전에 적음)', 곳간.get('kcm.vis') === JSON.stringify({ d: '2026-10-19', a: 1 }), 곳간.get('kcm.vis'))
쓴 = []; r = await 처음(KST('2026-10-19T15:00:00'))
봄('같은 날 다시 와도 안 셈', r === null && 쓴.length === 0)
쓴 = []; r = await 처음(KST('2026-10-20T07:00:00'))
봄('다음 날 — 오늘만 +1 · 누적은 안 더함(처음 온 사람만)', JSON.stringify([...쓴].sort()) === JSON.stringify(['d/2026-10-20/c/46230', 'd/2026-10-20/n', 'd/2026-10-20/r/jeonnam']) && 디비.get('a/n') === 1, JSON.stringify(쓴))
곳간.clear(); 쓴 = []; document.cookie = 옛쿠키; 지오 = { country_code: 'KR', region: 'Seoul' }
r = await 처음(KST('2026-10-20T08:00:00'))
봄('10/18 전에 왔던 사람(쿠키 처음 온 때 9/20) — 오늘만 · 누적 안 더함(애널리틱스 누적에 이미 있음)', JSON.stringify([...쓴].sort()) === JSON.stringify(['d/2026-10-20/n', 'd/2026-10-20/r/seoul']) && 디비.get('a/n') === 1, JSON.stringify(쓴))
곳간.clear(); 쓴 = []; document.cookie = 새쿠키; 지오 = null
r = await 처음(KST('2026-10-20T09:00:00'))
봄('위치를 못 받으면 x(모름) · 새 사람이면 누적도', JSON.stringify([...쓴].sort()) === JSON.stringify(['a/n', 'a/r/x', 'd/2026-10-20/n', 'd/2026-10-20/r/x']) && 디비.get('d/2026-10-20/n') === 3, JSON.stringify(쓴))
곳간.clear(); 쓴 = []; document.cookie = ''; 지오 = { country_code: 'JP', region: 'Tokyo' }
r = await 처음(KST('2026-10-20T10:00:00'))
봄('해외 — f', JSON.stringify([...쓴].sort()) === JSON.stringify(['a/n', 'a/r/f', 'd/2026-10-20/n', 'd/2026-10-20/r/f']), JSON.stringify(쓴))
곳간.clear(); 쓴 = []; document.visibilityState = 'hidden'
r = await 처음(KST('2026-10-20T11:00:00'))
봄('숨은 탭은 안 셈(기억도 안 남김 — 화면을 보면 그때)', r === null && 쓴.length === 0 && !곳간.has('kcm.vis'))
document.visibilityState = 'visible'
곳간.clear(); 쓴 = []; localStorage.getItem = () => { throw new Error('막힘') }
r = await 처음(KST('2026-10-20T11:30:00'))
봄('저장소가 막힌 창은 안 셈(새로 고칠 때마다 또 세지 않게)', r === null && 쓴.length === 0)
localStorage.getItem = 원getItem
const 진봇 = B.봇('Mozilla/5.0 HeadlessChrome/120', false) && B.봇('Googlebot/2.1', false) && B.봇('Mozilla/5.0', true) && !B.봇('Mozilla/5.0 (iPhone)', false)
봄('봇 — headless · bot · webdriver 는 봇 · 보통 폰은 아님', 진봇)
곳간.clear(); 쓴 = []; 곳간.set('kcm_op', '1')
const 운 = await import('../web/src/lib/운영자.js')
봄('운영자 표식(kcm_op) — 나운영자', await 운.나운영자())
/* 운영자는 모듈 안에서 한 번만 물어 기억함 — 새로 불러 시험 */
const B2 = await import('../web/src/lib/방문세기.js?운영자')
r = await B2.세어보기(KST('2026-10-20T12:00:00'))
봄('운영자(소장님) 브라우저는 안 셈', r === null && 쓴.length === 0, JSON.stringify(쓴))
곳간.delete('kcm_op')
/* 두 탭이 같이 — 기억을 먼저 적으므로 한 번만 */
곳간.clear(); 쓴 = []; 지오 = { country_code: 'KR', region: 'Busan' }
const B3 = await import('../web/src/lib/방문세기.js?탭')
const [p1, p2] = await Promise.all([B3.세어보기(KST('2026-10-21T00:00:01')), B3.세어보기(KST('2026-10-21T00:00:01'))])
봄('같은 브라우저 탭 둘이 동시에 — 한 번만', 쓴.filter((x) => x === 'd/2026-10-21/n').length === 1, JSON.stringify(쓴))
/* 규칙 — 아무 숫자 · 다른 열쇠 막힘 (가짜 디비가 규칙 그대로인지) */
const 막 = await fetch('https://k-conmap-default-rtdb.firebaseio.com/vis/a/r/tokyo.json', { method: 'PUT', headers: { 'if-match': 'enull' }, body: '1' })
const 막2 = await fetch('https://k-conmap-default-rtdb.firebaseio.com/vis/a/n.json', { method: 'PUT', headers: { 'if-match': 'e' + 디비.get('a/n') }, body: '999' })
봄('가짜 디비 규칙 — 모르는 열쇠 · 1 넘게 올리기 막힘', 막.status === 401 && 막2.status === 401)
/* 직접받기 */
const 받 = await B.직접받기(KST('2026-10-20T13:00:00'))
봄('직접받기 — vis/a · vis/d/오늘', 받 && 받.날 === '2026-10-20' && 받.a.n === 디비.get('a/n') && 받.d.n === 디비.get('d/2026-10-20/n') && 받.d.r.seoul === 1, JSON.stringify(받))

/* 지금(30분 안) — «여기 있음» */
곳간.clear(); 쓴 = []
서버시각 = KST('2026-10-20T14:00:00')
지오 = { country_code: 'KR', region: 'Gyeonggi-do', city: 'Suwon-si' }
const 번1 = await B.숨쉬기(KST('2026-10-20T14:00:00'))
const 수원 = (지도바탕.곳.find((p) => p.e === 'suwon') || {}).k
봄('숨쉬기 — vis/on/{번호 16자} = {t 서버 시각, k 곳 번호(수원)} · 번호는 이 브라우저에 기억', /^[a-z0-9]{16}$/.test(번1 || '') && JSON.stringify(디비.get('on/' + 번1)) === JSON.stringify({ t: 서버시각, k: 수원 }) && 곳간.get('kcm.vis.id') === 번1, JSON.stringify([번1, 디비.get('on/' + 번1), 수원]))
쓴 = []
봄('숨쉬기 — 5분 안에는 다시 안 남김', (await B.숨쉬기(KST('2026-10-20T14:02:00'))) === null && 쓴.length === 0)
서버시각 = KST('2026-10-20T14:05:10')
봄('숨쉬기 — 5분 지나면 다시(같은 번호)', (await B.숨쉬기(KST('2026-10-20T14:05:10'))) === 번1 && 디비.get('on/' + 번1).t === 서버시각)
document.visibilityState = 'hidden'
봄('숨쉬기 — 숨은 탭은 안 남김', (await B.숨쉬기(KST('2026-10-20T14:30:00'))) === null)
document.visibilityState = 'visible'
디비.set('on/' + 'p'.repeat(16), { t: KST('2026-10-20T14:20:00'), k: 수원 }); 디비.set('on/' + 'q'.repeat(16), { t: KST('2026-10-20T13:30:00'), k: '11' }); 디비.set('on/' + 'r'.repeat(16), { t: KST('2026-10-20T14:21:00') })
const 지 = await B.직접받기(KST('2026-10-20T14:25:00'))
봄('직접받기 — 지금 = 최근 30분 안 브라우저 수(14:05 · 14:20 · 14:21 → 3 · 13:30 뺌) · 지금곳 {수원: 2}', 지 && 지.지금 === 3 && JSON.stringify(지.지금곳) === JSON.stringify({ [수원]: 2 }), JSON.stringify(지 && [지.지금, 지.지금곳]))
const 점 = B.직접점들(지, 지도바탕, KST('2026-10-20T14:25:00'))
const 점수원 = 점.find((x) => x.p.k === 수원), 점광양 = 점.find((x) => x.p.k === '46230'), 점서울 = 점.find((x) => x.p.k === '11')
봄('직접점들 — 지금 수원(2명 → 크기 2) · 오늘 다녀간 곳 광양(옅은 점) · 30분 지난 서울은 지금 점 아님', 점수원 && 점수원.지금 === 2 && 점광양 && 점광양.지금 === 0 && 점광양.오늘 && !점서울 && 점[점.length - 1] === 점수원, JSON.stringify(점.map((x) => [x.p.k, x.지금])))
봄('직접점들 — 자정 지나 아직 새로 안 받았으면 오늘 점 없음(지금 점은 그대로)', B.직접점들(지, 지도바탕, KST('2026-10-21T00:01:00')).every((x) => x.지금 > 0))
지금고장 = true
const 지2 = await B.직접받기(KST('2026-10-20T14:25:00'))
봄('직접받기 — 지금을 못 받아도 누적 · 오늘은 받고 지금 = null(화면은 애널리틱스로)', 지2 && 지2.지금 === null && 지2.a.n === 디비.get('a/n'), JSON.stringify(지2))
지금고장 = false
const 막3 = await fetch('https://k-conmap-default-rtdb.firebaseio.com/vis/on/' + 'x'.repeat(16) + '.json', { method: 'PUT', body: '{"t":123}' })
const 막4 = await fetch('https://k-conmap-default-rtdb.firebaseio.com/vis/on/' + 'x'.repeat(16) + '.json', { method: 'PUT', body: '{"t":{".sv":"timestamp"},"k":"서울","x":1}' })
봄('가짜 디비 규칙 — 지금 표시에 아무 숫자 · 이상한 곳 번호 · 다른 칸 막힘', 막3.status === 401 && 막4.status === 401)
봄('자리풀기 — 지역 이름 없이 도시만(광양) → 전남 · 46230 / 해외는 곳 없음', JSON.stringify(await B.자리풀기({ country_code: 'KR', region: '', city: 'Gwangyang' }, 지도바탕)) === JSON.stringify({ s: 'jeonnam', k: '46230' })
  && JSON.stringify(await B.자리풀기({ country_code: 'US', city: 'Ashburn' }, 지도바탕)) === JSON.stringify({ s: 'f', k: null }))

/* ── ③ 규칙 파일 ── */
const 규 = fs.readFileSync(path.join(여기, '..', 'web', 'database.rules.json'), 'utf8')
const 규쓴 = JSON.parse(규.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n')).rules.vis
const 묶음글 = JSON.stringify(규쓴)
const 규열쇠 = (/\$k\.matches\(\/\^\(([a-z|]+)\)\$\/\)/.exec(묶음글) || [])[1] || ''
봄('규칙 vis — 시·도 열쇠 = 방문세기.js 시도열쇠 + f · x (같은 차례 상관없이)', 규열쇠.split('|').sort().join() === [...Object.values(B.시도열쇠), 'f', 'x'].sort().join(), 규열쇠)
봄('규칙 vis — 누구나 읽기 · 다섯 칸 모두 «1씩만» · 지우기 막음(newData.exists) · 지금(on) = 서버 시각만 · 번호 16자 · 곳 번호 꼴 · .indexOn t',
  규쓴['.read'] === true && 규쓴.on['.indexOn'] === 't' && 규쓴.on.$id.t['.validate'] === 'newData.isNumber() && newData.val() === now' && /\{16\}/.test(규쓴.on.$id['.write'])
  && 규쓴.on.$id.$other['.validate'] === false && /\[0-9\]\{2,5\}/.test(규쓴.on.$id.k['.validate']) && /\[0-9\]\{2,5\}/.test(규쓴.d.$day.c.$k['.write'])
  && [규쓴.d.$day.n, 규쓴.d.$day.r.$k, 규쓴.d.$day.c.$k, 규쓴.a.n, 규쓴.a.r.$k].every((x) => /newData\.exists\(\)/.test(x['.write']) && x['.validate'] === "newData.isNumber() && newData.val() === (data.exists() ? data.val() : 0) + 1"))

console.log(`\n방문세기 ${통과}/${통과 + 실패}`)
process.exit(실패 ? 1 : 0)
