// 👥 G315 방문자 — 건설맵이 직접 셈(web/src/lib/방문세기.js) 시험 · node tools/시험_방문세기.mjs (인터넷 없이)
//   ① 시·도 고르기(geojs) · 애널리틱스 쿠키 «처음 온 시각» · 직접줄들(바탕 + 직접 센 것)
//   ② 세어보기 — 가짜 데이터베이스(규칙 vis 와 같은 꼴 · 1씩만 · 열쇠 묶음)에 0시 전 · 0시 뒤 · 하루 한 번 · 처음 온 사람만 누적 · 옛사람 · 운영자 · 봇 · 숨은 탭
//   ③ 규칙 파일(web/database.rules.json vis)의 시·도 열쇠 = 방문세기.js 시도열쇠 + f · x
//   ④ 🔁 세션(10/22 0시부터 · vis/d/{날}/s · vis/sa/n) — 30분 쉼 · 날 바뀜 · 숨은 탭 · 저장소 막힘 · 운영자 · 탭 둘 · 사람 셈 그대로 · 세션 줄(누적 · 오늘 · 어제)
//   ⑤ 📮 G474 못 보낸 것 마저 — 보내는 중에 닫힘 · 끊김 · 반만 감 · 다음 날 · 규칙이 막음 · 사흘 넘음 · 운영자 · 엉뚱한 길 · 세션 · 5분 안에는 안 겹침
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
let 막힌저장 = false, 지금고장 = false, 어제고장 = false, 서버시각 = 0, 지금느림 = false
let 끊김 = null, 걸림 = false     // 📮 G474 끊김: 이 길 꼴(정규식)의 데이터베이스 요청은 연결 끊김 · 걸림: 데이터베이스 요청이 끝나지 않음(화면을 닫은 것처럼)
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
  if (p[0] === 'd' && p.length === 3 && p[2] === 's') return 날꼴.test(p[1])                       // 🔁 오늘 세션
  if (p[0] === 'sa' && p.length === 2 && p[1] === 'n') return true                                  // 🔁 세션 누적(건설맵 몫)
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
  if (끊김 && 끊김.test(길)) throw new TypeError('Failed to fetch')
  if (걸림) return new Promise(() => {})
  if (길 === 'on' && (!o.method || o.method === 'GET')) {   // 지금(30분) — orderBy="$value"&startAt= (규칙 .indexOn 있어야 됨)
    if (지금고장) return 응답(400, { error: 'Index not defined' })
    if (지금느림) return new Promise((res, rej) => { const 시 = setTimeout(() => res(응답(200, null)), 10000); if (o.signal) o.signal.addEventListener('abort', () => { clearTimeout(시); rej(new Error('abort')) }) })   // ⏱ 아주 늦는 연결
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
    if (어제고장 && /^d\/[^/]+\/n$/.test(길)) return 응답(500, null)
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
/* ⏱ 2026-10-21 새로고침 느림 — 곁 숫자(지금 30분)가 아주 늦으면 기다리지 않고 끊음 · 누적 · 오늘은 그대로 · 못 받은 칸은 앞 값 그대로(직접합치기) */
지금느림 = true
const 느t0 = Date.now()
const 느 = await B.직접받기(KST('2026-10-20T14:25:00'), { 곁기다림: 300 })
const 느걸림 = Date.now() - 느t0
지금느림 = false
봄(`직접받기 — 지금(30분)이 10초 걸려도 ${느걸림}ms 만에 끊고 누적 · 오늘은 받음 · 지금 = null`, 느 && 느.지금 === null && 느.a.n === 디비.get('a/n') && 느걸림 < 2000, JSON.stringify(느 && [느.지금, 느.a.n]))
봄('직접받기 — 기본 곁 기다림 4초', B.곁기다림 === 4000)
const 옛직 = { 날: '2026-10-20', a: { n: 1 }, d: { n: 2 }, 지금: 3, 지금곳: { 11: 3 }, at: KST('2026-10-20T14:20:00'), 어제: { 날: '2026-10-19', n: 7 }, sa: 9, 어제s: { 날: '2026-10-19', n: 11 } }
const 새직 = { 날: '2026-10-20', a: { n: 5 }, d: { n: 6 }, 지금: null, 지금곳: {}, at: KST('2026-10-20T14:21:00'), 어제: null, sa: undefined, 어제s: null }
const 합직 = B.직접합치기(옛직, 새직)
봄('직접합치기 — 못 받은 곁 칸(지금 · 어제 · 세션)은 앞 값 · 누적 · 오늘은 새 값', 합직.a.n === 5 && 합직.d.n === 6 && 합직.지금 === 3 && 합직.지금곳[11] === 3 && 합직.어제.n === 7 && 합직.sa === 9 && 합직.어제s.n === 11, JSON.stringify(합직))
봄('직접합치기 — 앞 «지금» 이 10분 넘었으면 안 씀 · 날이 바뀌면 새 것 그대로 · 새 «지금» 이 오면 새 값',
  B.직접합치기(옛직, { ...새직, at: KST('2026-10-20T14:31:00') }).지금 === null && B.직접합치기(옛직, { ...새직, 날: '2026-10-21' }).어제 === null && B.직접합치기(옛직, { ...새직, 지금: 8 }).지금 === 8)
const 막3 = await fetch('https://k-conmap-default-rtdb.firebaseio.com/vis/on/' + 'x'.repeat(16) + '.json', { method: 'PUT', body: '{"t":123}' })
const 막4 = await fetch('https://k-conmap-default-rtdb.firebaseio.com/vis/on/' + 'x'.repeat(16) + '.json', { method: 'PUT', body: '{"t":{".sv":"timestamp"},"k":"서울","x":1}' })
봄('가짜 디비 규칙 — 지금 표시에 아무 숫자 · 이상한 곳 번호 · 다른 칸 막힘', 막3.status === 401 && 막4.status === 401)
봄('자리풀기 — 지역 이름 없이 도시만(광양) → 전남 · 46230 / 해외는 곳 없음', JSON.stringify(await B.자리풀기({ country_code: 'KR', region: '', city: 'Gwangyang' }, 지도바탕)) === JSON.stringify({ s: 'jeonnam', k: '46230' })
  && JSON.stringify(await B.자리풀기({ country_code: 'US', city: 'Ashburn' }, 지도바탕)) === JSON.stringify({ s: 'f', k: null }))

/* 📅 G343 어제 방문 — 큰 지도 «전체 누적 · 오늘» 상자 아래 «어제 N명» (vis/d/{어제}/n) */
const 어1 = await B.직접받기(KST('2026-10-19T10:00:00'))
봄('어제 — 직접 세기 전 날(10/18)은 없음(null)', 어1 && 어1.어제 === null, JSON.stringify(어1 && 어1.어제))
디비.set('d/2026-10-21/n', 42)
const 어2 = await B.직접받기(KST('2026-10-22T09:00:00'))
봄('어제 — 10/22 에 보면 vis/d/2026-10-21/n = 42', 어2 && 어2.어제 && 어2.어제.날 === '2026-10-21' && 어2.어제.n === 42, JSON.stringify(어2 && 어2.어제))
디비.set('d/2026-10-21/n', 50)
const 어3 = await B.직접받기(KST('2026-10-22T09:01:00'))
봄('어제 — 30분 안에는 다시 안 받음(42 그대로 · 읽기 줄임)', 어3 && 어3.어제 && 어3.어제.n === 42, JSON.stringify(어3 && 어3.어제))
const 어4 = await B.직접받기(KST('2026-10-23T09:00:00'))
봄('어제 — 어제가 바뀌면 새로 받음 · 숫자 없으면 0명', 어4 && 어4.어제 && 어4.어제.날 === '2026-10-22' && 어4.어제.n === 0, JSON.stringify(어4 && 어4.어제))
어제고장 = true
const 어5 = await B.직접받기(KST('2026-10-25T09:00:00'))
봄('어제 — 못 받으면 어제만 null(누적 · 오늘은 그대로)', 어5 && 어5.어제 === null && 어5.a && 어5.a.n === 디비.get('a/n'), JSON.stringify(어5 && [어5.어제, 어5.a]))
어제고장 = false

/* ── ④ 🔁 오늘 방문(세션) — 10/22 0시부터 · 누적 · 시·도 · 어제 방문은 없음 ── */
봄('방문시작 — 10/21 23:59:59 아님 · 10/22 0시부터', !B.방문인가(KST('2026-10-21T23:59:59')) && B.방문인가(KST('2026-10-22T00:00:00')))
봄('새방문 — 처음 · 29분 쉼은 같은 방문 · 30분 쉼은 새 방문 · 날 바뀌면 새 방문 · 이상한 기억은 새 방문',
  B.새방문(null, KST('2026-10-22T10:00:00')) && !B.새방문({ t: KST('2026-10-22T10:00:00'), d: '2026-10-22' }, KST('2026-10-22T10:29:00'))
  && B.새방문({ t: KST('2026-10-22T10:00:00'), d: '2026-10-22' }, KST('2026-10-22T10:30:00')) && B.새방문({ t: KST('2026-10-21T23:59:00'), d: '2026-10-21' }, KST('2026-10-22T00:00:30'))
  && B.새방문({ t: 'x', d: '2026-10-22' }, KST('2026-10-22T10:00:00')))
곳간.clear(); 쓴 = []; 지오 = { country_code: 'KR', region: 'Seoul' }
const B4 = await import('../web/src/lib/방문세기.js?방문')
r = await B4.방문보기(KST('2026-10-21T23:59:00'))
봄('방문 — 0시 전에는 안 셈 · 마지막으로 본 때만 적음', r === null && 쓴.length === 0 && 곳간.get('kcm.vis.s') === JSON.stringify({ t: KST('2026-10-21T23:59:00'), d: '2026-10-21' }), 곳간.get('kcm.vis.s'))
r = await B4.방문보기(KST('2026-10-22T00:00:30'))
봄('방문 — 0시 지나 보고 있던 사람은 새 날 세션 1 · 오늘 s · 누적 sa/n (시·도 · 자리 묻기 없음)', JSON.stringify([...쓴].sort()) === JSON.stringify(['d/2026-10-22/s', 'sa/n']) && 디비.get('d/2026-10-22/s') === 1 && 디비.get('sa/n') === 1, JSON.stringify(쓴))
쓴 = []
for (const m of [1, 2, 3, 10, 20, 39]) await B4.방문보기(KST('2026-10-22T00:00:30') + m * 60000)
봄('방문 — 화면을 보는 동안(1분마다) 같은 방문 · 안 셈', 쓴.length === 0 && 디비.get('d/2026-10-22/s') === 1, JSON.stringify(쓴))
document.visibilityState = 'hidden'
r = await B4.방문보기(KST('2026-10-22T01:00:00'))
봄('방문 — 숨은 탭은 안 셈 · 마지막으로 본 때도 안 고침', r === null && JSON.parse(곳간.get('kcm.vis.s')).t === KST('2026-10-22T00:39:30'))
document.visibilityState = 'visible'
r = await B4.방문보기(KST('2026-10-22T01:09:29'))
봄('방문 — 29분 59초 쉬고 다시 봄 = 같은 방문', r === null && 쓴.length === 0)
r = await B4.방문보기(KST('2026-10-22T01:40:00'))
봄('방문 — 30분 넘게 쉬고 다시 봄 = 새 세션(오늘 2 · 누적 2)', 디비.get('d/2026-10-22/s') === 2 && 디비.get('sa/n') === 2, JSON.stringify(쓴))
봄('방문 — 사람 셈(n · r · c · a)은 건드리지 않음', 쓴.every((x) => x === 'd/2026-10-22/s' || x === 'sa/n'), JSON.stringify(쓴))
쓴 = []; localStorage.getItem = () => { throw new Error('막힘') }
r = await B4.방문보기(KST('2026-10-22T05:00:00'))
봄('방문 — 저장소가 막힌 창은 안 셈(1분마다 또 세지 않게)', r === null && 쓴.length === 0)
localStorage.getItem = 원getItem
const 원set = localStorage.setItem; localStorage.setItem = () => {}
r = await B4.방문보기(KST('2026-10-22T06:00:00'))
봄('방문 — 저장이 안 남는 창도 안 셈', r === null && 쓴.length === 0)
localStorage.setItem = 원set
곳간.clear(); 쓴 = []
await Promise.all([B4.방문보기(KST('2026-10-22T09:00:00')), B4.방문보기(KST('2026-10-22T09:00:00'))])
봄('방문 — 같은 브라우저 탭 둘이 동시에 — 한 번만', 쓴.filter((x) => x === 'd/2026-10-22/s').length === 1 && 쓴.filter((x) => x === 'sa/n').length === 1, JSON.stringify(쓴))
곳간.set('kcm_op', '1'); 쓴 = []
const B5 = await import('../web/src/lib/방문세기.js?방문운영자')
곳간.delete('kcm.vis.s')
r = await B5.방문보기(KST('2026-10-22T12:00:00'))
봄('방문 — 운영자(소장님) 브라우저는 안 셈', r === null && 쓴.length === 0, JSON.stringify(쓴))
곳간.delete('kcm_op')
const 받방 = await B.직접받기(KST('2026-10-22T13:00:00'))
봄('직접받기 — 오늘 묶음에 방문 s 도 들어옴(지도가 읽음)', 받방 && 받방.d && 받방.d.s === 디비.get('d/2026-10-22/s'), JSON.stringify(받방 && 받방.d))
봄('직접받기 — 10/22 부터 세션 누적(건설맵 몫 vis/sa/n)도 받음 · 10/21 까지는 null', 받방.sa === 디비.get('sa/n') && (await B.직접받기(KST('2026-10-21T13:00:00'))).sa === null, JSON.stringify([받방.sa, 디비.get('sa/n')]))
const 세바 = { kr: 5540, f: 48, y: { kr: 405, f: 2 }, yd: '2026-10-21' }
const 세1 = B.세션줄({ 날: '2026-10-22', d: { s: 187 }, sa: 260, 어제s: null }, 세바, KST('2026-10-22T13:00:00'))
봄('세션줄 — 10/22: 누적 = 애널리틱스 5,588 + 건설맵 260 · 오늘 187 · 어제(10/21) = 애널리틱스 어제 세션 407', 세1 && 세1.누적 === 5848 && 세1.오늘 === 187 && 세1.어제 === 407, JSON.stringify(세1))
const 세2 = B.세션줄({ 날: '2026-10-23', d: { s: 50 }, sa: 700, 어제s: { 날: '2026-10-22', n: 412 } }, { ...세바, yd: '2026-10-22', y: { kr: 999, f: 0 } }, KST('2026-10-23T09:00:00'))
봄('세션줄 — 10/23: 어제(10/22) = 건설맵이 센 세션 412(애널리틱스보다 먼저)', 세2 && 세2.어제 === 412 && 세2.누적 === 5588 + 700, JSON.stringify(세2))
const 세3 = B.세션줄({ 날: '2026-10-22', d: {}, sa: undefined }, null, KST('2026-10-22T00:01:00'))
봄('세션줄 — 바탕(fresh/ses) · vis/sa 를 못 받으면 누적 · 어제는 모름(null — 화면은 «—») · 오늘 0', 세3 && 세3.누적 === null && 세3.어제 === null && 세3.오늘 === 0, JSON.stringify(세3))
봄('세션줄 — 10/21 까지는 null(줄 없음 · 전과 같은 상자) · 자정 지나 아직 새로 안 받은 자료도 null', B.세션줄({ 날: '2026-10-21', d: { s: 3 }, sa: 1 }, 세바, KST('2026-10-21T22:00:00')) === null
  && B.세션줄({ 날: '2026-10-21', d: { s: 3 }, sa: 1 }, 세바, KST('2026-10-22T00:00:30')) === null)
디비.set('d/2026-10-22/s', 412)
const B7 = await import('../web/src/lib/방문세기.js?어제세션')
const 어s = await B7.직접받기(KST('2026-10-23T10:00:00'))
봄('직접받기 — 10/23 에 보면 어제(10/22) 세션 vis/d/2026-10-22/s = 412 · 10/22 에 보면 어제(10/21)는 null', 어s && 어s.어제s && 어s.어제s.날 === '2026-10-22' && 어s.어제s.n === 412 && (await B7.직접받기(KST('2026-10-22T10:00:00'))).어제s === null, JSON.stringify(어s && 어s.어제s))
const 줄방 = B.직접줄들(바탕, { ...직, d: { ...직.d, s: 99 }, 날: '2026-10-22' }, KST('2026-10-22T09:00:00'))
봄('직접줄들 — 방문을 세도 누적 · 오늘(사람) · 시·도는 그대로', 줄방.전국.a === 1896 && 줄방.전국.t === 9, JSON.stringify(줄방.전국))

/* ── ⑤ 📮 G474 못 보낸 것 마저 보내기 ── */
const 큐 = () => JSON.parse(곳간.get('kcm.vis.q') || 'null')
const 몇 = (p) => 쓴.filter((x) => x === p).length
봄('다시보낼틈 = 5분', B.다시보낼틈 === 5 * 60000)
/* 1) 보내는 중에 화면을 닫음 — 데이터베이스 요청이 안 끝남 */
곳간.clear(); 쓴 = []; document.cookie = ''; 지오 = { country_code: 'KR', region: 'Seoul' }
const C1 = await import('../web/src/lib/방문세기.js?닫힘1')
걸림 = true
C1.세어보기(KST('2026-10-31T09:00:00')); C1.방문보기(KST('2026-10-31T09:00:00'))
await new Promise((res) => setTimeout(res, 50))
걸림 = false
봄('닫힘 — 셌다(kcm.vis)는 적었고 보낼 것(kcm.vis.q)에 사람 n · 누적 n · 시·도 둘(자리는 알았음) · 세션 s · sa 가 남음 · 아무것도 안 감',
  JSON.parse(곳간.get('kcm.vis')).d === '2026-10-31' && 쓴.length === 0 && JSON.stringify([...큐().남].sort()) === JSON.stringify(['a/n', 'a/r/seoul', 'd/2026-10-31/n', 'd/2026-10-31/r/seoul', 'd/2026-10-31/s', 'sa/n']), JSON.stringify(큐()))
const C2 = await import('../web/src/lib/방문세기.js?닫힘2')     // 다시 들어옴(새 화면)
r = await C2.세어보기(KST('2026-10-31T09:03:00'))
const r2 = await C2.밀린것보내기(KST('2026-10-31T09:03:00'))
봄('닫힘 → 3분 뒤 다시 들어옴 — 오늘은 이미 셌고 · 보낼 것은 5분 안이라 아직 안 보냄(보내는 중인 다른 탭과 안 겹치게)', r === null && r2 === null && 쓴.length === 0 && 큐().남.length === 6)
const r3 = await C2.밀린것보내기(KST('2026-10-31T09:06:00'))
봄('닫힘 → 6분 뒤 — 마저 보냄: 오늘 n · 서울 · 누적 n · 누적 서울 · 세션 s · sa 한 번씩(6) · 보낼 것 비움',
  쓴.length === 6 && 몇('d/2026-10-31/n') === 1 && 몇('d/2026-10-31/r/seoul') === 1 && 몇('a/n') === 1 && 몇('a/r/seoul') === 1 && 몇('d/2026-10-31/s') === 1 && 몇('sa/n') === 1 && !곳간.has('kcm.vis.q') && Array.isArray(r3), JSON.stringify([쓴, 큐()]))
/* 1-2) 자리(geojs)를 알기 전에 닫힘 — «@날+» 표가 남았다가 다음에 자리를 알아 시·도로 */
곳간.clear(); 쓴 = []; 지오 = { country_code: 'KR', region: 'Gyeonggi-do', city: 'Suwon-si' }
const C1b = await import('../web/src/lib/방문세기.js?닫힘3')
const 원fetch = globalThis.fetch
globalThis.fetch = (u, o) => (/geojs|\/vis\//.test(u) ? new Promise(() => {}) : 원fetch(u, o))
C1b.세어보기(KST('2026-10-31T11:00:00'))
await new Promise((res) => setTimeout(res, 50))
globalThis.fetch = 원fetch
const 표큐 = 큐().남.slice().sort()
const C1c = await import('../web/src/lib/방문세기.js?닫힘4'); C1c.시험바탕(지도바탕)     // 새 화면(지도 바탕은 사이트에선 처음 쓸 때 받음)
await C1c.밀린것보내기(KST('2026-10-31T11:07:00'))
봄('자리 전에 닫힘 — 보낼 것 «@2026-10-31+» 표 · 7분 뒤 자리를 알아 오늘 경기 · 수원 곳 · 누적 경기까지 한 번씩',
  JSON.stringify(표큐) === JSON.stringify(['@2026-10-31+', 'a/n', 'd/2026-10-31/n']) && JSON.stringify([...쓴].sort()) === JSON.stringify(['a/n', 'a/r/gyeonggi', 'd/2026-10-31/c/' + 수원, 'd/2026-10-31/n', 'd/2026-10-31/r/gyeonggi'].sort()) && !곳간.has('kcm.vis.q'), JSON.stringify([표큐, 쓴]))
쓴 = []
봄('다 보낸 뒤 — 또 안 보냄 · 같은 날 다시 와도 안 셈', (await C2.밀린것보내기(KST('2026-10-31T10:00:00'))) === null && (await C2.세어보기(KST('2026-10-31T10:00:00'))) === null && 쓴.length === 0)
/* 2) 반만 감 — 사람 n 은 갔는데 시·도 칸은 끊김 */
곳간.clear(); 쓴 = []; 지오 = { country_code: 'KR', region: 'Busan' }
const C3 = await import('../web/src/lib/방문세기.js?반')
끊김 = /\/r\//
await C3.세어보기(KST('2026-11-01T08:00:00'))
끊김 = null
봄('반만 감 — 오늘 n · 누적 n · 곳은 가고, 끊긴 시·도 두 칸만 보낼 것에 남음', 몇('d/2026-11-01/n') === 1 && 몇('a/n') === 1 && JSON.stringify([...큐().남].sort()) === JSON.stringify(['a/r/busan', 'd/2026-11-01/r/busan']), JSON.stringify([쓴, 큐()]))
쓴 = []
await C3.밀린것보내기(KST('2026-11-01T08:10:00'))
봄('반만 감 → 마저 — 시·도 두 칸만(오늘 n · 누적 n 은 두 번 안 셈)', JSON.stringify([...쓴].sort()) === JSON.stringify(['a/r/busan', 'd/2026-11-01/r/busan']) && !곳간.has('kcm.vis.q'), JSON.stringify(쓴))
/* 3) 연결이 끊긴 채 하루가 지남 — 어제 것은 어제 숫자로 · 오늘 것도 따로 */
곳간.clear(); 쓴 = []; 지오 = { country_code: 'KR', region: 'Seoul' }
const C4 = await import('../web/src/lib/방문세기.js?다음날')
끊김 = /./
await C4.세어보기(KST('2026-11-02T23:50:00'))
끊김 = null
const 앞큐 = 큐().남.slice()
await C4.세어보기(KST('2026-11-03T09:00:00'))
const 중간 = (await C4.밀린것보내기(KST('2026-11-03T09:01:00'))) === null
await C4.밀린것보내기(KST('2026-11-03T09:06:00'))
봄('다음 날 — 어제(11/2) 못 보낸 n · 서울이 11/2 숫자로 들어가고 · 오늘(11/3)도 1 · 누적은 처음 한 번만 · 오늘 것을 넣은 뒤 5분은 기다림',
  중간 && JSON.stringify(앞큐.sort()) === JSON.stringify(['a/n', 'a/r/seoul', 'd/2026-11-02/n', 'd/2026-11-02/r/seoul']) && 몇('d/2026-11-02/n') === 1 && 몇('d/2026-11-02/r/seoul') === 1 && 몇('d/2026-11-03/n') === 1 && 몇('a/n') === 1 && !곳간.has('kcm.vis.q'), JSON.stringify([앞큐, 쓴, 큐()]))
/* 4) 규칙이 막은 길은 버림(다시 보내도 안 됨) · 엉뚱한 길은 안 보냄 · 사흘 넘은 것은 버림 */
곳간.clear(); 쓴 = []
곳간.set('kcm.vis', JSON.stringify({ d: '2026-11-04', a: 1 }))
곳간.set('kcm.vis.q', JSON.stringify({ 남: ['d/2026-11-04/r/tokyo', '../../users/x', 'fresh/map', 'd/2026-11-04/n'], t: KST('2026-11-04T08:00:00'), f: KST('2026-11-04T08:00:00') }))
const C5 = await import('../web/src/lib/방문세기.js?막힘')
await C5.밀린것보내기(KST('2026-11-04T08:10:00'))
봄('규칙이 막은 칸(tokyo)은 버리고 · 엉뚱한 길(../ · fresh)은 안 보냄 · 맞는 것(n)만 감 · 보낼 것 비움', JSON.stringify(쓴) === JSON.stringify(['d/2026-11-04/n']) && !곳간.has('kcm.vis.q'), JSON.stringify([쓴, 큐()]))
쓴 = []
곳간.set('kcm.vis.q', JSON.stringify({ 남: ['d/2026-11-01/n'], t: KST('2026-11-01T08:00:00'), f: KST('2026-11-01T08:00:00') }))
r = await C5.밀린것보내기(KST('2026-11-04T09:00:00'))
봄('사흘 넘은 것은 안 보내고 버림', r === null && 쓴.length === 0 && !곳간.has('kcm.vis.q'))
/* 5) 운영자 — 보낼 것이 있어도 안 보내고 비움 */
곳간.set('kcm.vis.q', JSON.stringify({ 남: ['d/2026-11-04/n'], t: KST('2026-11-04T08:00:00'), f: KST('2026-11-04T08:00:00') }))
곳간.set('kcm_op', '1'); 쓴 = []
const C6 = await import('../web/src/lib/방문세기.js?운영자큐')
r = await C6.밀린것보내기(KST('2026-11-04T09:00:00'))
봄('운영자 — 보낼 것이 있어도 안 보내고 비움', r === null && 쓴.length === 0 && !곳간.has('kcm.vis.q'))
곳간.delete('kcm_op')
/* 6) 숨은 탭은 마저 보내기도 안 함 · 보내는 중(같은 탭)에는 안 겹침 */
곳간.set('kcm.vis.q', JSON.stringify({ 남: ['d/2026-11-04/n'], t: KST('2026-11-04T08:00:00'), f: KST('2026-11-04T08:00:00') }))
document.visibilityState = 'hidden'; 쓴 = []
r = await C5.밀린것보내기(KST('2026-11-04T09:00:00'))
document.visibilityState = 'visible'
봄('숨은 탭은 마저 보내기도 안 함', r === null && 쓴.length === 0 && 큐().남.length === 1)
곳간.clear(); 쓴 = []
const C7 = await import('../web/src/lib/방문세기.js?겹침')
걸림 = true
C7.세어보기(KST('2026-11-05T09:00:00'))
await new Promise((res) => setTimeout(res, 30))
걸림 = false
r = await C7.밀린것보내기(KST('2026-11-05T09:30:00'))
봄('같은 탭에서 보내는 중이면 30분이 지나도 마저 보내기를 안 겹침', r === null && 쓴.length === 0)
/* 7) 세션도 — 끊겼다 마저 */
곳간.clear(); 쓴 = []
const C8 = await import('../web/src/lib/방문세기.js?세션큐')
끊김 = /^(d\/[^/]+\/s|sa\/n)$/
await C8.방문보기(KST('2026-11-06T10:00:00'))
끊김 = null
const 세큐 = 큐() && 큐().남.slice().sort()
await C8.방문보기(KST('2026-11-06T10:06:00'))
await C8.밀린것보내기(KST('2026-11-06T10:06:00'))
봄('세션 — 끊긴 s · sa 가 남았다가 6분 뒤 한 번씩 감(같은 방문이라 더 안 셈)', JSON.stringify(세큐) === JSON.stringify(['d/2026-11-06/s', 'sa/n']) && 몇('d/2026-11-06/s') === 1 && 몇('sa/n') === 1 && !곳간.has('kcm.vis.q'), JSON.stringify([세큐, 쓴]))
/* 8) 방문켜기 — 화면이 보이면 바로 셈(5초 안 기다림) */
곳간.clear(); 쓴 = []; 지오 = { country_code: 'KR', region: 'Seoul' }
const 듣 = []; document.addEventListener = (n, f) => 듣.push([n, f])
const 원si = globalThis.setInterval; const 틱들 = []; globalThis.setInterval = (f, ms) => { 틱들.push(ms); return 0 }
delete globalThis.__방문
const C9 = await import('../web/src/lib/방문세기.js?켜기')
C9.방문켜기()
await new Promise((res) => setTimeout(res, 80))
globalThis.setInterval = 원si; document.addEventListener = () => {}
const 오늘날 = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10)
봄('방문켜기 — 열자마자(기다림 없이) 오늘 n · 세션 s 를 보냄 · 1분마다 다시 · 화면이 다시 보일 때 다시', 몇('d/' + 오늘날 + '/n') === 1 && 몇('d/' + 오늘날 + '/s') === 1 && 틱들.join() === '60000' && 듣.some(([n]) => n === 'visibilitychange'), JSON.stringify([쓴, 틱들, 듣.map((x) => x[0])]))

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
봄('규칙 vis — 🔁 오늘 세션 s · 세션 누적 sa/n 도 «1씩만» · 지우기 막음 · 날짜 꼴 · 시·도 세션 칸은 없음',
  /newData\.exists\(\)/.test(규쓴.d.$day.s['.write']) && /\$day\.matches/.test(규쓴.d.$day.s['.write']) && 규쓴.d.$day.s['.validate'] === "newData.isNumber() && newData.val() === (data.exists() ? data.val() : 0) + 1"
  && /newData\.exists\(\)/.test(규쓴.sa.n['.write']) && 규쓴.sa.n['.validate'] === 규쓴.d.$day.s['.validate'] && Object.keys(규쓴.sa).join() === 'n' && !규쓴.d.$day.sr)

console.log(`\n방문세기 ${통과}/${통과 + 실패}`)
process.exit(실패 ? 1 : 0)
