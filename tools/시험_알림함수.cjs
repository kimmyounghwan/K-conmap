// 🧪 G222 (2026-10-09) 알림 함수를 하루 동안 끝까지 돌려 봅니다 — 파이어베이스 · 웹 푸시 · 사이트 파일을 흉내 냄(그물 없음)
//   소장님: 「현재 하던대로 하고, 알림 신청하지 않은 이용자만 하루 한 번 알림 가게 하자.」
//     → 내 조건 알림 신청(watch_cond) = 하던 대로 하루 두 번(8시 · 13시) · ☆ 담은 공고 1순위 = 바로 · 신청 안 한 폰 허용자만 오전 10시 한 통(watch_auto)
//   「업체 자가진단 알림은 삭제」 · 올리기 bat 이 올리기 전에 돌립니다(틀리면 멈춤)
//   돌리기: node tools/시험_알림함수.cjs
const Module = require('module')
const path = require('path')
const FN = path.join(__dirname, '..', 'web', 'functions')
const 나무 = { watch_cond: {}, watch_auto: {}, watch_last: {}, watch_day_last: {}, watch_meta: {}, push: {}, watch: {}, noti: {}, fresh: { rows: {} } }
const 길 = (p) => p.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean)
const 얻 = (p) => { let o = 나무; for (const k of 길(p)) { if (o == null || typeof o !== 'object') return undefined; o = o[k] } return o }
const 넣 = (p, v) => { const ks = 길(p); let o = 나무; for (const k of ks.slice(0, -1)) { if (typeof o[k] !== 'object' || o[k] == null) o[k] = {}; o = o[k] } if (v === null || v === undefined) delete o[ks[ks.length - 1]]; else o[ks[ks.length - 1]] = JSON.parse(JSON.stringify(v)) }
let 키 = 0
const ref = (p) => ({
  get: async () => ({ val: () => { const v = 얻(p); return v === undefined ? null : JSON.parse(JSON.stringify(v)) }, exists: () => 얻(p) !== undefined }),
  set: async (v) => 넣(p, v),
  update: async (o) => { for (const [k, v] of Object.entries(o)) 넣(p + '/' + k, v) },
  remove: async () => 넣(p, null),
  push: () => { const k = 'k' + String(++키).padStart(6, '0'); return ref(p + '/' + k) },
  orderByKey: () => ref(p),
  transaction: async (fn) => { const 지금 = 얻(p); const v = fn(지금 === undefined ? null : 지금); if (v === undefined) return { committed: false }; 넣(p, v); return { committed: true } },
})
const 보낸푸시 = []
const 가짜 = {
  'firebase-functions/v2/database': { onValueCreated: (o, f) => f, onValueWritten: (o, f) => f },
  'firebase-functions/v2/https': { onRequest: (o, f) => f },
  'firebase-functions/params': { defineSecret: () => ({ value: () => '' }) },
  'firebase-admin': { initializeApp: () => {}, database: () => ({ ref }) },
  'web-push': { setVapidDetails: () => {}, sendNotification: async (s, body) => { 보낸푸시.push([s.endpoint, JSON.parse(body)]) } },
  'nodemailer': {},
}
const 원load = Module._load
Module._load = function (req, parent, isMain) { if (가짜[req]) return 가짜[req]; return 원load.apply(this, arguments) }
const 사이트 = {
  '/data/board/live-con-0.json': [
    { no: 'A', name: '청사 현업근무자 샤워장 개선공사', inst: '전남광주통합특별시 여수시', dt: '' },
    { no: 'B', name: '삼향동 도로포장공사', inst: '전남광주통합특별시 목포시', dt: '' },
    { no: 'C', name: '경기 아스콘 포장 보수', inst: '경기도 안양시', dt: '' },
  ],
  '/data/board/live-con-idx.json': { f: ['sido', 'lic'], r: [['전남', ['건축공사업/0002', '토목건축공사업/0003']], ['전남', ['지반조성ㆍ포장공사업/4989']], ['경기', ['지반조성ㆍ포장공사업/4989']]] },
  '/data/bidindex.json': { f: ['no', 'name', 'inst', 'dt', 'lic', 'licg', 'rgs', 'mthd', 'rgnb', 'sido'], r: [
    ['A', '청사 현업근무자 샤워장 개선공사', '전남광주통합특별시 여수시', '', ['건축공사업/0002', '토목건축공사업/0003'], [1, 2], ['전남 여수시'], '수의계약', '본사또는참여지사소재지', '전남'],
    ['B', '삼향동 도로포장공사', '전남광주통합특별시 목포시', '', ['지반조성ㆍ포장공사업/4989'], [1], ['전남 목포시'], '수의계약', '본사또는참여지사소재지', '전남'],
    ['C', '경기 아스콘 포장 보수', '경기도 안양시', '', ['지반조성ㆍ포장공사업/4989'], [1], ['경기'], '제한경쟁', '', '경기']] },
  '/data/board/first-con-0.json': [{ no: 'F1', name: '어느 포장공사', dt: '', win: '갑' }],
  '/fixes.json': { r: [{ p: '/tools/nomubi', d: '', m: '노무비 명세서 합계' }] },
}
const 지금글 = new Date(Date.now() + 9 * 3600e3 - 60e3).toISOString().replace('T', ' ').slice(0, 19)
for (const r of 사이트['/data/board/live-con-0.json']) r.dt = 지금글
사이트['/data/board/first-con-0.json'][0].dt = 지금글
사이트['/fixes.json'].r[0].d = 지금글.slice(0, 16)
global.fetch = async (u) => { const p = new URL(u).pathname; const v = 사이트[decodeURIComponent(p)]; return { ok: v !== undefined, status: v === undefined ? 404 : 200, headers: { get: () => '' }, json: async () => v } }
// 사람: u1 내 조건 «신청»(전남 · 포장 면허) + ☆ 담은 공고 · u2 «신청»(제주 — 맞는 것 없음)
//       u3 신청 안 함 · 찾은 말 «샤워장» · u4 신청 안 함 · 폰만 허용(기억 없음) · u5 신청 안 함 · 끔
//       u6 신청 안 함 · ☆ 담은 공고만 · u7 신청 안 함 · 전남 + «포장» + 쓴 도구 · u8 기억은 있으나 폰 허용 없음 · u9 신청 안 함 · 제주(맞는 것 없음)
const fn = require(path.join(FN, 'index.js'))
const 깨움 = (name = 'live') => fn.freshNotify({ data: { after: { exists: () => true } }, params: { name } })
;(async () => {
  let 틀림 = 0, 셈 = 0
  const 봄 = (이름, 참, 덧 = '') => { 셈++; console.log((참 ? '✓ ' : '✗ ') + 이름 + (덧 ? ` — ${덧}` : '')); if (!참) 틀림++ }
  const 오늘 = '2026-10-14'          /* 수요일로 못 박음 — 🗓 G223 부터 토 · 일 · 공휴일엔 공고 · 1순위 알림이 쉬므로(시험 날짜가 주말이어도 같은 결과) */
  const 원now = Date.now
  const 시각 = (hm) => Date.parse(`${오늘}T${hm}:00+09:00`)
  for (const r of 사이트['/data/board/live-con-0.json']) r.dt = 오늘 + ' 07:00:00'
  for (const r of 사이트['/data/bidindex.json'].r) r[3] = 오늘 + ' 08:30:00'
  사이트['/data/board/first-con-0.json'][0].dt = 오늘 + ' 09:00:00'
  사이트['/fixes.json'].r[0].d = 오늘 + ' 08:50'
  나무.fresh.rows = { live: {}, first: {} }
  const 처음 = 시각('08:00') - 20 * 3600e3
  나무.watch_cond = {
    u1: { rg: '전남', lic: '4989', none: false, at: 처음 },
    u2: { rg: '제주', lic: '', at: 처음 },
  }
  나무.watch_auto = {
    u3: { rg: '전국', kw: '샤워장', at: 처음 },
    u5: { rg: '전남', off: true, at: 처음 },
    u7: { rg: '전남', lic: '', kw: '포장', tools: '/tools/nomubi', at: 처음 },
    u8: { rg: '전남', at: 처음 },
    u9: { rg: '제주', at: 처음 },
  }
  나무.watch = { W1: { u1: { at: 처음, t: '보호구역 정비공사' } }, W2: { u6: { at: 처음, t: '어느 교량 보수' } } }
  const 주소 = (r) => ({ d1: { s: { endpoint: 'https://push/' + r, keys: { p256dh: 'x', auth: 'y' } }, at: 1 } })
  나무.push = {}
  for (const r of ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u9']) 나무.push[r] = 주소(r)
  나무.push_keys = { pub: 'P', priv: 'Q' }
  const 받음 = (전) => 보낸푸시.slice(전).map((x) => x[0].replace('https://push/', '') + ' ' + x[1].title)
  const 누구 = (전) => [...new Set(보낸푸시.slice(전).map((x) => x[0].replace('https://push/', '')))].sort().join(',')

  // ① 07:30 — 아무것도 안 감(8시 전)
  Date.now = () => 시각('07:30')
  await 깨움('live')
  봄('① 7시 반 — 안 감', 보낸푸시.length === 0)
  // ② 08:10 — 내 조건 «신청» 하루 두 번 중 8시 칸(하던 대로) · 신청 안 한 분은 아직(10시)
  Date.now = () => 시각('08:10')
  let 전 = 보낸푸시.length
  await 깨움('live')
  const 팔시 = 받음(전)
  봄('② 8시 — 신청한 u1 만 «📢 내 조건 새 공고 1건»(하던 대로)', 팔시.length === 1 && 팔시[0] === 'u1 📢 내 조건 새 공고 1건', 팔시.join(' / '))
  봄('② 8시 — 하던 대로의 글(전남 · 면허 1개 — 「삼향동 도로포장공사」)', 보낸푸시[전] && 보낸푸시[전][1].body === '전남 · 면허 1개 — 「삼향동 도로포장공사」' && 보낸푸시[전][1].tag === 'kcm-cond', 보낸푸시[전] && 보낸푸시[전][1].body)
  // ③ 09:40 — ☆ 담은 공고(W1)의 1순위 → u1 에게 바로
  나무.fresh.rows.first = { a: JSON.stringify([{ no: 'W1', name: '보호구역 내 과속방지 및 보행안전시설 정비공사', win: '주식회사 ○○', rate: 90.128, np: 57, dt: 오늘 + ' 09:35:00' }]) }
  Date.now = () => 시각('09:40')
  전 = 보낸푸시.length
  await 깨움('first')
  const 담 = 받음(전)
  봄('③ ☆ 담은 공고 1순위 — 바로 u1 에게', 담.length === 1 && 담[0].startsWith('u1 🏆 담은 공고 1순위'), 담.join(' / '))
  전 = 보낸푸시.length
  Date.now = () => 시각('09:50')
  await 깨움('first')
  봄('③ 같은 1순위는 다시 안 감(담은 표에서 지움)', 보낸푸시.length === 전 && !나무.watch.W1)
  // ④ 10:00 — 신청 안 한 분께 하루 한 통
  Date.now = () => 시각('10:00')
  전 = 보낸푸시.length
  await 깨움('live')
  const 열시 = 받음(전)
  봄('④ 10시 — 받는 사람 = 신청 안 한 폰 허용자 u3 · u4 · u7 · u9 만', 누구(전) === 'u3,u4,u7,u9', 누구(전))
  봄('④ 10시 — 신청한 u1 · u2 는 안 받음(하루 두 번을 받으니)', !열시.some((x) => /^u[12] /.test(x)))
  봄('④ 10시 — 끈 u5 · ☆ 담은 공고가 걸린 u6 · 폰 허용 없는 u8 은 안 받음', !열시.some((x) => /^u[568] /.test(x)))
  const 한통 = (r) => (보낸푸시.slice(전).find((x) => x[0].endsWith('/' + r)) || [])[1] || {}
  봄('④ u7 — 기억하는 것으로 한 통(전남 · «포장» · 1순위 · 고친 화면)', 한통('u7').title === '📢 지난 하루 새 공고 3건 · 1순위 1건 · 고친 화면 1' && 한통('u7').body.startsWith('내 조건(전남) 2 · «포장» 1'), `${한통('u7').title} | ${한통('u7').body}`)
  봄('④ u3 — 찾은 말 «샤워장» 1', 한통('u3').title === '📢 지난 하루 새 공고 1건' && 한통('u3').body.startsWith('«샤워장» 1'), `${한통('u3').title} | ${한통('u3').body}`)
  봄('④ u4(기억 없음) · u9(맞는 것 없음) — 요약 «새 공고 3건 · 1순위 2건»', 한통('u4').title === '📢 지난 하루 새 공고 3건 · 1순위 2건' && 한통('u9').title === 한통('u4').title, `${한통('u4').title} / ${한통('u9').title}`)
  봄('④ 한 사람에게 10시에 한 통씩만', new Set(열시.map((x) => x.split(' ')[0])).size === 열시.length)
  봄('④ 사이트 🔔 한 줄도(u7)', Object.values(나무.noti.u7 || {}).some((x) => String(x.m).startsWith('📢 지난 하루')))
  const st = (나무.fresh.stat || {}).alert || {}
  봄('④ 숫자만 남김(fresh/stat/alert)', st.push === 8 && st.cond === 2 && st.day === 4 && st.auto === 4 && st.off === 1 && st.watchP === 1 && st.kw === 2 && st.sent && st.sent.n === 2 && st.sent.요약 === 2 && !('co' in st),
    JSON.stringify({ push: st.push, cond: st.cond, day: st.day, auto: st.auto, off: st.off, watchP: st.watchP, kw: st.kw, 보냄: st.sent }))
  // ⑤ 13:05 — 신청한 분 13시 칸(그 사이 새 공고만) · 하루 한 통은 다시 안 감
  나무.fresh.rows.live = { a: JSON.stringify([{ no: 'G', name: '광양 도로 포장', inst: '전남광주통합특별시 광양시', dt: 오늘 + ' 12:00:00', _ix: ['광양 도로 포장', '', 0, 0, 0, ['지반조성ㆍ포장공사업/4989'], '전남'] }]) }
  Date.now = () => 시각('13:05')
  전 = 보낸푸시.length
  await 깨움('live')
  const 한시 = 받음(전)
  봄('⑤ 13시 — 신청한 u1 만 그 사이 새 공고 1건(광양)', 한시.length === 1 && 한시[0] === 'u1 📢 내 조건 새 공고 1건' && 보낸푸시[전][1].body.includes('광양 도로 포장'), 한시.join(' / '))
  for (const hm of ['13:30', '18:00', '21:50']) { Date.now = () => 시각(hm); 전 = 보낸푸시.length; await 깨움('live'); 봄(`⑥ ${hm} — 다시 안 감(두 번 · 한 번 다 감)`, 보낸푸시.length === 전) }
  봄('⑥ 칸 표시 — 신청 13시 칸 · 하루 한 통 10시 칸', 나무.watch_meta.slot === 오늘 + '-13' && 나무.watch_meta.day === 오늘 + '-10', `${나무.watch_meta.slot} · ${나무.watch_meta.day}`)
  // ⑦ 밤 23시 — 아무것도 안 감
  Date.now = () => 시각('23:00'); 전 = 보낸푸시.length; await 깨움('live')
  봄('⑦ 밤 23시 — 안 감', 보낸푸시.length === 전)

  // 🗓 G223 쉬는 날 — 소장님 「휴일하고, 토, 일은 알림이 안가도 돼잖아 공고 나 1순위는…」 「맵톡 알림은 가야 하지만…」
  const 때2 = (날, hm) => Date.parse(`${날}T${hm}:00+09:00`)
  나무.watch_last.u1 = 때2('2026-10-16', '13:05'); 나무.watch_last.u2 = 때2('2026-10-16', '13:05')        /* 금요일까지 보낸 것으로 */
  for (const r of ['u3', 'u4', 'u7', 'u9']) 나무.watch_day_last[r] = 때2('2026-10-16', '10:00')
  나무.watch_meta.slot = '2026-10-16-13'; 나무.watch_meta.day = '2026-10-16-10'
  /* 금 오후 · 토요일 공고 — 마감 전 색인에만 있음(사이트 첫 묶음 · 방금 공고에는 없음) */
  사이트['/data/bidindex.json'].r.push(
    ['H', '광양 배수로 정비공사', '전남광주통합특별시 광양시', '2026-10-16 15:00:00', ['지반조성ㆍ포장공사업/4989'], [1], ['전남 광양시'], '제한경쟁', '', '전남'],
    ['S', '순천 도로 포장 보수', '전남광주통합특별시 순천시', '2026-10-17 11:00:00', ['지반조성ㆍ포장공사업/4989'], [1], ['전남 순천시'], '제한경쟁', '', '전남'])
  나무.fresh.rows.live = {}
  나무.fresh.rows.first = { b: JSON.stringify([{ no: 'W2', name: '어느 교량 보수공사', win: '○○', rate: 89.9, np: 12, dt: '2026-10-17 11:00:00' }]) }   /* 토요일에 나온 ☆ 담은 공고(u6) 1순위 */
  전 = 보낸푸시.length
  for (const [날, hms] of [['2026-10-17', ['08:10', '10:00', '11:30', '13:05', '18:00']], ['2026-10-18', ['08:10', '10:00', '13:05']]]) {
    for (const hm of hms) { Date.now = () => 때2(날, hm); await 깨움('live'); await 깨움('first') }
  }
  봄('⑧ 토 · 일 — 공고 · 1순위 알림 하나도 안 감(☆ 담은 공고도 지우지 않고 기다림)', 보낸푸시.length === 전 && !!나무.watch.W2, 받음(전).join(' / '))
  Date.now = () => 때2('2026-10-19', '07:30'); await 깨움('first'); await 깨움('live')
  봄('⑨ 월 7시 반 — 아직 안 감(평일 8시부터)', 보낸푸시.length === 전)
  Date.now = () => 때2('2026-10-19', '08:05'); await 깨움('first')
  const 월담 = 받음(전)
  봄('⑩ 월 8시 — 주말에 나온 ☆ 담은 공고 1순위가 u6 에게(바로 · 평일 아침)', 월담.length === 1 && 월담[0].startsWith('u6 🏆'), 월담.join(' / '))
  전 = 보낸푸시.length; Date.now = () => 때2('2026-10-19', '08:10'); await 깨움('live')
  const 월8 = 보낸푸시.slice(전)
  봄('⑩ 월 8시 칸 — 신청한 u1 에게 금 오후 · 토요일 공고 2건(색인에서 찾음)', 월8.length === 1 && 월8[0][0].endsWith('/u1') && 월8[0][1].title === '📢 내 조건 새 공고 2건', 월8.map((x) => x[0].replace('https://push/', '') + ' ' + x[1].title + ' ' + x[1].body).join(' / '))
  전 = 보낸푸시.length; Date.now = () => 때2('2026-10-19', '10:00'); await 깨움('live')
  const u4월 = (보낸푸시.slice(전).find((x) => x[0].endsWith('/u4')) || [])[1] || {}
  봄('⑪ 월 10시 — 신청 안 한 u4 «주말 사이 새 공고 2건 · 1순위 1건»', u4월.title === '📢 주말 사이 새 공고 2건 · 1순위 1건', u4월.title)
  전 = 보낸푸시.length
  for (const 날 of ['2026-12-25']) for (const hm of ['08:10', '10:00', '13:05']) { Date.now = () => 때2(날, hm); await 깨움('live'); await 깨움('first') }
  봄('⑫ 공휴일(성탄절 · 금) — 안 감', 보낸푸시.length === 전)
  Date.now = 원now
  console.log(`\n${셈}개 중 틀림 ${틀림}`)
  process.exit(틀림 ? 1 : 0)
})().catch((e) => { console.error('실패', e); process.exit(1) })
