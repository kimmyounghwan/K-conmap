/* ══════════════════════════════════════════════════════════════
   장비장부.js — 🚜 장비 임대료·수금 장부의 «셈» (2026-09-29)

   소장님: 「(장비관리 프로그램 엑셀이) 좀 이상해 봐줘 … 되도록 사이트내에서 사용 할 수 있는 프로그램으로 만들어 줘」
           → (고름) 장비 임대업자용 · 코드+비밀번호로 여러 기기

   ■ 받은 엑셀(착공·공무 › 장비관리 프로그램)의 «방식만» 따왔습니다 — 칸·수식·글은 쓰지 않았습니다.
       기사·장비 등록(시간당 단가) → 날마다 사용 내역(시간 × 단가 = 금액, 유류대) → 수금 적기 →
       거래처별 임대료·수금·미수금 · 기사(장비)별 현황 → 거래처별 청구서 인쇄
   ■ 유류대는 두 가지입니다(받은 엑셀은 ① 한 가지 — «기수금(유류 포함)»).
       ① 원청이 기름을 대 준 것(G) — 받은 돈으로 셉니다(미수금에서 뺌)
       ② 내가 넣고 청구하는 것(C) — 임대료에 더합니다
   ■ 엑셀 받기는 없습니다 — 소장님(2026-09-26): 「프로그램으로 해서 만든 거는 … 프린트만 가능하게 … 입력은 건설맵에서」
   ⚠️ 셈은 여기 한 곳에만. 화면(EquipBook.jsx)에서 다시 셈하지 않습니다.
   ══════════════════════════════════════════════════════════════ */

export const 단위들 = ['시간', '일', '회', '대']
export const 받는법 = ['계좌이체', '현금', '어음', '카드', '상계']

const 쉼 = new Intl.NumberFormat('ko-KR')
export const 원 = (n) => 쉼.format(Math.round(n || 0))
export const 수 = (v) => { const n = Number(String(v ?? '').replace(/[^0-9.-]/g, '')); return Number.isFinite(n) ? n : 0 }
const 두 = (n) => String(n).padStart(2, '0')
export const 날글 = (d) => `${d.getFullYear()}-${두(d.getMonth() + 1)}-${두(d.getDate())}`
export const 오늘 = () => 날글(new Date())
export const 달첫날 = (ym) => `${ym}-01`
export const 달끝날 = (ym) => { const [y, m] = ym.split('-').map(Number); return 날글(new Date(y, m, 0)) }
export const 이번달 = () => 오늘().slice(0, 7)

/** 한 줄의 금액 — 수량 × 단가 (반올림) */
export const 줄금액 = (q, u) => Math.round(수(q) * 수(u))
/** 한 줄이 «청구» 에 들어가는 돈 — 금액 + 청구하는 유류대(C) */
export const 청구액 = (r) => (r.amt || 0) + (r.ok === 'C' ? (r.oil || 0) : 0)
/** 한 줄이 «받은 것» 으로 치는 돈 — 원청이 대 준 유류대(G) */
export const 유류받음 = (r) => (r.ok === 'C' ? 0 : (r.oil || 0))

const 사이 = (d, from, to) => (!from || d >= from) && (!to || d <= to)
const 배열 = (o) => Object.entries(o || {}).map(([id, v]) => ({ id, ...v }))

/**
 * 거래처별 현황 — 받은 엑셀의 «업체별 현황» 과 같은 뜻
 *   돌려주는 것: [{id, 이름, 현장, 임대, 유류, 수금, 받음(수금+유류G), 미수, 비율(임대/전체), 수금률}], 합계
 */
export function 거래처현황(자료, { from, to } = {}) {
  const cl = 자료.clients || {}
  const m = new Map()
  const 칸 = (id, 이름) => {
    if (!m.has(id)) m.set(id, { id, 이름: (cl[id] && cl[id].n) || 이름 || '(지운 거래처)', 현장: (cl[id] && cl[id].s) || '', 임대: 0, 유류: 0, 수금: 0, 건: 0 })
    return m.get(id)
  }
  for (const r of 배열(자료.rows)) {
    if (!사이(r.d, from, to)) continue
    const e = 칸(r.cl || '-', r.cn)
    e.임대 += 청구액(r); e.유류 += 유류받음(r); e.건 += 1
  }
  for (const p of 배열(자료.pay)) {
    if (!사이(p.d, from, to)) continue
    칸(p.cl || '-', p.cn).수금 += p.amt || 0
  }
  for (const id of Object.keys(cl)) 칸(id)
  const 줄 = [...m.values()]
  const 전체 = 줄.reduce((s, e) => s + e.임대, 0)
  for (const e of 줄) {
    e.받음 = e.수금 + e.유류
    e.미수 = e.임대 - e.받음
    e.비율 = 전체 ? e.임대 / 전체 : 0
    e.수금률 = e.임대 ? e.받음 / e.임대 : 0
  }
  줄.sort((a, b) => (b.미수 - a.미수) || (b.임대 - a.임대) || a.이름.localeCompare(b.이름))
  const 합 = 줄.reduce((s, e) => ({ 임대: s.임대 + e.임대, 유류: s.유류 + e.유류, 수금: s.수금 + e.수금, 받음: s.받음 + e.받음, 미수: s.미수 + e.미수, 건: s.건 + e.건 }),
    { 임대: 0, 유류: 0, 수금: 0, 받음: 0, 미수: 0, 건: 0 })
  return { 줄, 합 }
}

/** 기사(장비)별 현황 — 가동 수량 · 임대료 · 그 기사 이름으로 받은 수금 · 경비 */
export function 기사현황(자료, { from, to } = {}) {
  const dr = 자료.drivers || {}
  const m = new Map()
  const 칸 = (id, 이름, 장비) => {
    if (!m.has(id)) m.set(id, { id, 이름: (dr[id] && dr[id].n) || 이름 || '(기사 없음)', 장비: (dr[id] && dr[id].e) || 장비 || '', 시간: 0, 일: 0, 임대: 0, 수금: 0, 경비: 0, 건: 0 })
    return m.get(id)
  }
  for (const r of 배열(자료.rows)) {
    if (!사이(r.d, from, to)) continue
    const e = 칸(r.dr || '-', r.dn, r.e)
    e.임대 += 청구액(r); e.건 += 1
    if (r.un === '일') e.일 += r.q || 0; else if (r.un === '시간' || !r.un) e.시간 += r.q || 0
  }
  for (const p of 배열(자료.pay)) if (p.dr && 사이(p.d, from, to)) 칸(p.dr).수금 += p.amt || 0
  for (const c of 배열(자료.cost)) if (사이(c.d, from, to)) 칸(c.dr || '-', '', '').경비 += c.amt || 0
  for (const id of Object.keys(dr)) 칸(id)
  return [...m.values()].sort((a, b) => b.임대 - a.임대 || a.이름.localeCompare(b.이름))
}

/** 달마다 — [{ym, 임대, 받음, 경비}] (오래된 달부터) */
export function 달마다(자료) {
  const m = new Map()
  const 칸 = (ym) => { if (!m.has(ym)) m.set(ym, { ym, 임대: 0, 수금: 0, 유류: 0, 경비: 0 }); return m.get(ym) }
  for (const r of 배열(자료.rows)) if (r.d) { const e = 칸(r.d.slice(0, 7)); e.임대 += 청구액(r); e.유류 += 유류받음(r) }
  for (const p of 배열(자료.pay)) if (p.d) 칸(p.d.slice(0, 7)).수금 += p.amt || 0
  for (const c of 배열(자료.cost)) if (c.d) 칸(c.d.slice(0, 7)).경비 += c.amt || 0
  return [...m.values()].sort((a, b) => a.ym.localeCompare(b.ym)).map((e) => ({ ...e, 받음: e.수금 + e.유류, 남음: e.임대 - e.경비 }))
}

/**
 * 청구서 — 거래처 하나 · 기간
 *   전기미수: 기간 «앞» 까지의 미수 · 이번청구: 기간 안 임대료 · 이번받음: 기간 안 수금+유류(G)
 *   누계미수 = 전기미수 + 이번청구 − 이번받음
 */
export function 청구서(자료, cl, from, to) {
  const rows = 배열(자료.rows).filter((r) => (r.cl || '-') === cl)
  const pays = 배열(자료.pay).filter((p) => (p.cl || '-') === cl)
  const 앞 = (d) => from && d < from
  const 전기 = rows.filter((r) => 앞(r.d)).reduce((s, r) => s + 청구액(r) - 유류받음(r), 0)
    - pays.filter((p) => 앞(p.d)).reduce((s, p) => s + (p.amt || 0), 0)
  const 줄 = rows.filter((r) => 사이(r.d, from, to)).sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : (a.at || 0) - (b.at || 0)))
  const 이번청구 = 줄.reduce((s, r) => s + 청구액(r), 0)
  const 이번유류 = 줄.reduce((s, r) => s + 유류받음(r), 0)
  const 받은줄 = pays.filter((p) => 사이(p.d, from, to)).sort((a, b) => (a.d < b.d ? -1 : 1))
  const 이번수금 = 받은줄.reduce((s, p) => s + (p.amt || 0), 0)
  return {
    줄, 받은줄, 전기미수: 전기, 이번청구, 이번유류, 이번수금,
    누계미수: 전기 + 이번청구 - 이번유류 - 이번수금,
    시간합: 줄.filter((r) => r.un === '시간' || !r.un).reduce((s, r) => s + (r.q || 0), 0),
    일합: 줄.filter((r) => r.un === '일').reduce((s, r) => s + (r.q || 0), 0),
  }
}

/** 금액을 한글로 — 청구서 «일금 … 원정» */
export function 한글돈(n) {
  n = Math.round(Math.abs(n || 0))
  if (!n) return '영'
  const 숫 = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구']
  const 작 = ['', '십', '백', '천']
  const 큰 = ['', '만', '억', '조']
  let out = ''
  let i = 0
  while (n > 0) {
    const 넷 = n % 10000
    if (넷) {
      let s = ''
      for (let j = 0; j < 4; j++) {
        const d = Math.floor(넷 / 10 ** j) % 10
        if (d) s = 숫[d] + 작[j] + s
      }
      out = s + 큰[i] + out
    }
    n = Math.floor(n / 10000); i += 1
  }
  return out
}

/* ── 예시 — 지어낸 이름입니다(실제 업체·사람 아님) ─────────────── */
export function 예시장부() {
  const d = new Date()
  const ym = 날글(d).slice(0, 7)
  const 전달 = 날글(new Date(d.getFullYear(), d.getMonth() - 1, 1)).slice(0, 7)
  const drivers = {
    d1: { n: '김기사', e: '굴삭기 06W', no: '12가3456', u: 90000, ud: 650000, at: 1 },
    d2: { n: '이기사', e: '굴삭기 03W', no: '34나5678', u: 70000, ud: 500000, at: 2 },
    d3: { n: '박기사', e: '덤프 15톤', no: '56다7890', u: 60000, ud: 450000, at: 3 },
  }
  const clients = {
    c1: { n: '가나건설(주)', s: '○○지구 배수로 정비공사', p: '공무 담당', t: '', at: 1 },
    c2: { n: '다라토건', s: '△△ 농로 포장공사', p: '현장소장', t: '', at: 2 },
  }
  const rows = {}
  let k = 0
  const 넣 = (날, dr, cl, q, un, oil = 0, ok = 'G', m = '') => {
    const r = drivers[dr]; const c = clients[cl]
    const u = un === '일' ? r.ud : r.u
    rows['r' + (++k)] = { d: 날, dr, dn: r.n, e: r.e, cl, cn: c.n, s: c.s, q, un, u, amt: 줄금액(q, u), oil, ok, m, at: k }
  }
  넣(`${전달}-05`, 'd1', 'c1', 8, '시간'); 넣(`${전달}-06`, 'd1', 'c1', 1, '일', 120000)
  넣(`${전달}-12`, 'd3', 'c2', 6, '시간'); 넣(`${전달}-20`, 'd2', 'c1', 4, '시간', 0, 'G', '오후만')
  넣(`${ym}-02`, 'd1', 'c1', 1, '일', 150000); 넣(`${ym}-03`, 'd1', 'c1', 7.5, '시간')
  넣(`${ym}-03`, 'd3', 'c2', 1, '일', 80000, 'C', '유류 청구'); 넣(`${ym}-05`, 'd2', 'c2', 5, '시간')
  const pay = {
    p1: { d: `${전달}-25`, cl: 'c1', cn: clients.c1.n, amt: 1000000, how: '계좌이체', m: '전달분 일부', at: 1 },
    p2: { d: `${ym}-04`, cl: 'c2', cn: clients.c2.n, amt: 360000, how: '계좌이체', at: 2 },
  }
  const cost = {
    k1: { d: `${전달}-15`, t: '엔진오일 교환', amt: 180000, dr: 'd1', at: 1 },
    k2: { d: `${ym}-01`, t: '타이어 수리', amt: 70000, dr: 'd3', at: 2 },
  }
  return {
    정보: { name: '예시중기', ceo: '홍길동', tel: '010-0000-0000', addr: '○○시 ○○로 00', at: 1 },
    풀린: { biz: '000-00-00000', bank: '○○은행', acct: '000-0000-0000-00', holder: '예시중기' },
    자료: { drivers, clients, rows, pay, cost },
  }
}
