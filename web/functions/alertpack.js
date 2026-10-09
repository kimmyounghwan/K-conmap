/* ══════════════════════════════════════════════════════════════════
   🔔 알림 셈 (G222 · 2026-10-09) — «알림을 신청하지 않은 분께만 하루 한 번 · 오전 10시 · 모아서 한 통»

   소장님: 「알림 해줘」 · 「이제까지 기억하고 있는 모든 정보이용해서 매일 알림」 · 「방문했던 이용자 모두에게 알림 가게 해야 해…」
           「너무 알림이 많이 가면 짜증이 날 수도 있어. 알지??」 · 「다른 곳은 어떻게 하지??」 · 「그냥, 하루에 한번으로 하면 어때???」
           → 「10시에 하자. 모아서 한 번 ..」 → 「현재 하던대로 하고, 알림 신청하지 않은 이용자만 하루 한 번 알림 가게 하자.」
           「업체 자가진단 알림은 삭제…」 「업체 자가진단 알림이 필요한 건 아니잖아..」 → 우리 회사(참여 가능 · 1순위) 알림은 뺌
   (다른 곳: 비드큐 = 맞춤공고 실시간 · 산군 = 하루 한 번 오전 10시 카톡 · 이메일 / 푸시 주 2~5회만 받아도 약 46% 가 끄거나 지운다는 자료)
   ■ 신청한 분은 하던 대로(index.js): 📍 내 조건 알림(watch_cond) = 하루 두 번 8시 · 13시 · ☆ 담은 공고 1순위 = 바로.
   ■ 🗓 쉬는 날(토 · 일 · 공휴일)에는 공고 · 1순위 알림을 안 보냄 — 다음 평일 첫 알림에 모아서(G223 · 아래 쉬나 · 보낼때 · 거슬러). 맵톡 답글은 보냄.
   ■ 신청 안 한 분(폰 알림만 허용) = 하루 한 통(오전 10시 — 10:00~21:59 의 첫 깨어남 · 한 번만 · index.js 하루한통):
       그 기기가 «기억하는 것»(watch_auto = lib/저절로알림.js) 전부를 한 통에
       ① 내 조건(rg · lic · none) ② 찾은 말(kw) 새 공고 · 새 1순위 ③ 쓰던 화면 고침(tools × public/fixes.json)
       기억하는 것이 없거나 맞는 것이 없으면 «새 공고 N건 · 1순위 N건» 요약 · 새 것이 0이면 안 보냄
   지역 · 면허 = 화면 lib/fmt.js inRegion · lib/lic.js licHit 과 같은 규칙(index.js 내 조건 알림도 이것을 씀).
   🔔 폰 알림창에는 늘 «🏗 건설맵 열기» · «✕ 닫기» 단추와 k-conmap.com 이 붙습니다(public/sw.js · 소장님 「알림이 가도 반드시 닫기, 건설맵 링크가 있어야 해」).
   이 파일은 «셈만» 합니다(파이어베이스 · 그물망 없음) — 시험: node tools/시험_알림묶음.mjs · node tools/시험_알림함수.cjs
   ══════════════════════════════════════════════════════════════════ */

const 한국 = (ms = Date.now()) => new Date(ms + 9 * 3600e3)
const 한국글 = (ms) => 한국(ms).toISOString().replace('T', ' ').slice(0, 19)      /* «YYYY-MM-DD HH:MM:SS» — 조달청 dt 와 같은 꼴 */
const 분 = (ms) => { const t = 한국(ms); return t.getUTCHours() * 60 + t.getUTCMinutes() }

/* 🗓 쉬는 날(토 · 일 · 공휴일 · 대체공휴일)에는 공고 · 1순위 알림을 안 보냅니다(맵톡 답글 알림은 보냄) — G223 (2026-10-10)
   소장님: 「휴일하고, 토, 일은 알림이 안가도 돼잖아 공고 나 1순위는…」 「맵톡 알림은 가야 하지만…」 → 고르심 «이대로 고치기»
   쉬는 날 올라온 공고(실측 토 45 · 일 31건)는 다음 평일 첫 알림에 모두 담깁니다(부터 = 지난번 알림 · 없으면 직전 평일 같은 시각 − 2시간).
   ⚠️ 공휴일 목록은 해마다 넣어야 합니다 — 시험_알림묶음.mjs 가 «오늘부터 60일 뒤» 가 목록 끝을 넘으면 멈춥니다(그때 다음 해를 넣을 것).
   출처: 한국천문연구원 월력 자료(astro.kasi.re.kr calendarData) · 2026 은 collect.py HOLIDAYS + 노동절(5/1) · 제헌절(7/17) 공휴일 지정 */
const 공휴일 = new Set([
  '2026-01-01', '2026-02-16', '2026-02-17', '2026-02-18', '2026-03-01', '2026-03-02', '2026-05-01', '2026-05-05', '2026-05-24', '2026-05-25',
  '2026-06-03', '2026-06-06', '2026-07-17', '2026-08-15', '2026-08-17', '2026-09-24', '2026-09-25', '2026-09-26', '2026-10-03', '2026-10-05',
  '2026-10-09', '2026-12-25',
  '2027-01-01', '2027-02-06', '2027-02-07', '2027-02-08', '2027-02-09', '2027-03-01', '2027-05-01', '2027-05-03', '2027-05-05', '2027-05-13',
  '2027-06-06', '2027-07-17', '2027-07-19', '2027-08-15', '2027-08-16', '2027-09-14', '2027-09-15', '2027-09-16', '2027-10-03', '2027-10-04',
  '2027-10-09', '2027-10-11', '2027-12-25', '2027-12-27',
])
const 공휴일끝 = '2027-12-31'
/** 쉬는 날인가(한국 날짜 기준 토 · 일 · 공휴일) */
function 쉬나(ms = Date.now()) {
  const t = 한국(ms)
  const 요 = t.getUTCDay()
  return 요 === 0 || 요 === 6 || 공휴일.has(t.toISOString().slice(0, 10))
}
/** 공고 · 1순위 알림을 보내도 되는 때 — 평일 08:00~21:59 (쉬는 날 · 밤 · 새벽은 다음 평일 아침으로 미룸) */
function 보낼때(ms = Date.now()) {
  const m = 분(ms)
  return !쉬나(ms) && m >= 8 * 60 && m < 22 * 60
}
/** 이만큼 거슬러 봄 — 직전 평일의 같은 시각 − 2시간(평일이면 26시간 전 · 월요일 아침이면 금요일 아침 · 연휴도 넘어감) */
function 거슬러(ms = Date.now()) {
  let t = ms - 86400e3
  for (let i = 0; i < 14 && 쉬나(t); i++) t -= 86400e3
  return t - 2 * 3600e3
}

/** 한 통 제목 앞말 — 하루 안이면 «지난 하루» · 주말을 건넜으면 «주말 사이» · 공휴일이 끼었으면 «연휴 사이» */
function 사이말(부터, ms = Date.now()) {
  if (ms - 부터 <= 30 * 3600e3) return '지난 하루'
  let 공 = false
  for (let t = 부터; t < ms; t += 86400e3) if (공휴일.has(한국(t).toISOString().slice(0, 10))) 공 = true
  return 공 ? '연휴 사이' : '주말 사이'
}

/** 하루 한 통 칸 — 평일 10:00~21:59 = 그날 칸(빠른 수집이 10시에 멈췄어도 다음 깨어남에) · 그 밖 · 쉬는 날은 '' · 같은 칸은 한 번만(index.js 가 표시) */
function 칸(ms = Date.now()) {
  const m = 분(ms)
  if (쉬나(ms)) return ''
  return m >= 10 * 60 && m < 22 * 60 ? 한국(ms).toISOString().slice(0, 10) + '-10' : ''
}

const 별칭 = { 경기: ['경기'], 강원: ['강원'], 충북: ['충북', '충청북도'], 충남: ['충남', '충청남도'], 전북: ['전북', '전라북도'], 전남: ['전남', '전라남도'], 경북: ['경북', '경상북도'], 경남: ['경남', '경상남도'] }
/** = web/src/lib/fmt.js inRegion */
function 지역맞나(x, rg) {
  if (!rg || rg === '전국') return true
  if (x.sido != null && x.sido !== '') return String(x.sido).split(',').includes(rg)
  if (x.sido === '') return false
  const pats = 별칭[rg] || [rg]
  const blob = `${x.inst || ''} ${x.name || ''}`
  return pats.some((p) => blob.includes(p))
}
/** = web/src/lib/lic.js licHit */
function 면허맞나(codes, 원함, 없음도) {
  if (!원함.length) return true
  const list = Array.isArray(codes) ? codes : (codes ? [codes] : [])
  if (!list.length) return !!없음도
  const w = new Set(원함)
  return list.some((v) => { const t = String(v); return w.has(t) || w.has(t.slice(t.lastIndexOf('/') + 1)) })
}
/** 찾은 말 — 공고 이름에 들어 있는 첫 말. 여러 낱말(«포장공사 보수»)이면 낱말이 «모두» 들어 있어야(띄어쓰기 · 차례 무시) · 한 글자 낱말은 안 봄 */
function 말맞나(name, 말들) {
  const n = String(name || '').replace(/\s+/g, '')
  return (말들 || []).find((w) => {
    const 낱 = String(w || '').split(/\s+/).filter((x) => x.length >= 2)
    return 낱.length > 0 && 낱.every((x) => n.includes(x))
  }) || ''
}

const 자르기 = (s, n) => { const t = String(s || '').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t }
const 목록 = (s, 한 = ',') => String(s || '').split(한).map((x) => x.trim()).filter(Boolean)
const 최신 = (a) => a.sort((p, q) => (String(p.dt) < String(q.dt) ? 1 : -1))
const 조건있나 = (c) => (c.rg && c.rg !== '전국') || 목록(c.lic).length > 0
const 조건맞나 = (c, x) => 조건있나(c) && 지역맞나(x, c.rg) && 면허맞나(x.codes, 목록(c.lic), c.none)

/**
 * 하루 한 통 — 한 사람 몫.
 * @param c     watch_auto/{번호} = {rg, lic, none, kw, tools, at}
 * @param 부터  이 시각(ms) 뒤로 올라온 것만(지난번 한 통 뒤)
 * @param 재료  {공고: [{no,name,inst,dt,sido,codes}], 일순위: [{no,name,dt,win}], 고침: [{p,d,m}]}
 */
function 한사람(c, 부터, 재료) {
  const 부터글 = 한국글(부터)
  const 말들 = 목록(c.kw).slice(0, 5)
  const 새공고 = (재료.공고 || []).filter((x) => String(x.dt || '') > 부터글)
  const 조건 = [], 말공고 = []
  for (const x of 새공고) {
    if (조건맞나(c, x)) { 조건.push(x); continue }
    const w = 말맞나(x.name, 말들)
    if (w) 말공고.push({ ...x, w })
  }
  const 말일순위 = []
  for (const y of (재료.일순위 || [])) {
    if (String(y.dt || '') <= 부터글) continue
    const w = 말맞나(y.name, 말들)
    if (w) 말일순위.push({ ...y, w })
  }
  const 쓴곳 = new Set(목록(c.tools))
  /* d = 올린 시각 «YYYY-MM-DD HH:MM» — 지난번 한 통 뒤 것만(같은 고침이 두 번 안 가게) */
  const 고침 = (재료.고침 || []).filter((f) => f && 쓴곳.has(String(f.p)) && String(f.d || '') > 부터글)
  return { 조건: 최신(조건), 말공고: 최신(말공고), 말일순위: 최신(말일순위), 고침 }
}

/** 하루 한 통의 글 — 아무것도 없으면 null · 머리 = 사이말(«지난 하루» · «주말 사이» · «연휴 사이») */
function 글(셈, c = {}, 머리말 = '지난 하루') {
  const { 조건, 말공고, 말일순위, 고침 } = 셈
  const 공고수 = 조건.length + 말공고.length
  if (!공고수 && !말일순위.length && !고침.length) return null
  const 조각 = []
  if (조건.length) 조각.push(`내 조건${c.rg && c.rg !== '전국' ? `(${c.rg})` : ''} ${조건.length}`)
  if (말공고.length) 조각.push(`«${말공고[0].w}» ${말공고.length}`)
  const 머리 = []
  if (공고수) 머리.push(`새 공고 ${공고수}건`)
  if (말일순위.length) 머리.push(`1순위 ${말일순위.length}건`)
  if (고침.length) 머리.push(`고친 화면 ${고침.length}`)
  const 첫 = (조건[0] || 말공고[0] || 말일순위[0])
  let 본문 = 조각.join(' · ')
  if (첫) 본문 += `${본문 ? ' — ' : ''}「${자르기(첫.name, 30)}」${공고수 + 말일순위.length > 1 ? ' 외' : ''}`
  if (!공고수 && 말일순위.length) 본문 = `«${말일순위[0].w}» 1순위 — ${본문.replace(/^ — /, '')}`
  if (고침.length) 본문 += `${본문 ? ' · ' : ''}🛠 쓰시던 화면을 고쳤습니다: ${자르기(고침[0].m, 40)}`
  /* 누르면 갈 곳 — 공고(1순위만이면 1순위 · 고침만이면 그 화면) */
  const url = 공고수 ? '/live' : 말일순위.length ? `/first?q=${encodeURIComponent(말일순위[0].w)}` : String(고침[0].p || '/')
  return { title: `📢 ${머리말} ${머리.join(' · ')}`, body: 본문, url, tag: 'kcm-day' }
}

/** 기억하는 조건이 없거나 맞는 것이 없는 «폰 알림 허용» 사람 — 하루 한 통 요약(새 공고 · 새 1순위 수 + 가장 최근 공고 하나) · 둘 다 0 이면 null */
function 요약(공고, 일순위, 부터, 머리말 = '지난 하루') {
  const 부터글 = 한국글(부터)
  const 새 = 최신((공고 || []).filter((x) => String(x.dt || '') > 부터글))
  const 새1 = (일순위 || []).filter((y) => String(y.dt || '') > 부터글)
  if (!새.length && !새1.length) return null
  const 머리 = [새.length ? `새 공고 ${새.length}건` : '', 새1.length ? `1순위 ${새1.length}건` : ''].filter(Boolean).join(' · ')
  return {
    title: `📢 ${머리말} ${머리}`,
    body: (새.length ? `「${자르기(새[0].name, 30)}」${새.length > 1 ? ' 외' : ''} — ` : '') + '지역 · 면허를 고르시면 맞는 공고만 골라 알려 드립니다',
    url: '/live', tag: 'kcm-day',
  }
}

module.exports = { 칸, 쉬나, 보낼때, 거슬러, 사이말, 공휴일, 공휴일끝, 한국글, 지역맞나, 면허맞나, 말맞나, 한사람, 글, 요약, 자르기 }
