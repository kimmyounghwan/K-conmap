/* ══════════════════════════════════════════════════════════════
   성적표.js — 「업체 입찰 성적표」의 **계산**만 모아 둔 곳 (2026-09-18)

   소장님: 「분석에서 성적표 신청하기만 있고, 내가 업체검색해서 업체 성적표가
            나오게 해서 다운 받을 수 있어야 하는데, 그런게 없어.
            이용자는 사용을 막돼, 난 사용할 수 있어야 하잖아」

   ■ 무엇인가
     tools/report_data.py 를 **그대로 브라우저로 옮긴 것**입니다.
     소장님이 당신 컴퓨터의 data/store/first.json 을 골라 주시면, 그 자리에서
     업체를 찾아 성적표를 만들고 PDF 로 내려받습니다. 자료는 사이트로 올라가지 않습니다.

   ⚠️ 계산은 **web/src/lib/bidmath.js 하나만** 씁니다. 여기에 같은 식을 다시 적지 마세요.
      (바로투찰 화면·원클릭·채점이 어긋났던 사고가 세 번 있었습니다)
   ⚠️ 이 파일을 고치면 `node web/시험/성적표_시험.mjs` 로
      **파이썬(tools/report_data.py) 이 낸 답과 한 줄씩 맞춰 보십시오.**
      두 벌이 같은 답을 내야 «맞다» 고 말할 수 있습니다.
   ⚠️ 업체는 **사업자번호**로 찾습니다. 이름으로 찾으면 동명 업체와 섞입니다
      (실측: 같은 이름에 사업자번호가 다른 업체 1,846가지).
   ══════════════════════════════════════════════════════════════ */
import * as B from './bidmath.js'

export const P50_FALLBACK = B.P50_FALLBACK

/* ── 잔셈 — 파이썬 statistics 와 같은 답을 내야 합니다 ───────────── */
export const 평균 = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null)
export const 중앙 = (a) => {
  const s = [...a].sort((x, y) => x - y)
  const n = s.length
  if (!n) return null
  const h = n >> 1
  return n % 2 ? s[h] : (s[h - 1] + s[h]) / 2
}
export const 흩어짐 = (a) => {          // statistics.pstdev
  if (!a.length) return null
  const m = 평균(a)
  return Math.sqrt(a.reduce((s, x) => s + (x - m) * (x - m), 0) / a.length)
}
/* 파이썬 round(x, n) 은 «반올림해서 짝수로» 입니다(round-half-even).
   자바스크립트 Math.round 는 늘 위로 올립니다. 0.05·2.25 같은 «딱 절반» 에서만
   갈라지지만, 갈라지면 파이썬과 대조가 어긋납니다. 그래서 흉내 냅니다. */
export function 파이썬반올림(x, n = 0) {
  if (x == null || !isFinite(x)) return x
  const f = Math.pow(10, n)
  const y = x * f
  const fl = Math.floor(y)
  if (Math.abs(y - fl - 0.5) < 1e-9) {          // 딱 절반 → 짝수 쪽으로
    return ((fl % 2 === 0) ? fl : fl + 1) / f
  }
  return Math.round(y) / f
}
const r1 = (x) => (x == null ? null : 파이썬반올림(x, 1))
const r3 = (x) => (x == null ? null : 파이썬반올림(x, 3))

/* 세기 — 파이썬 collections.Counter.most_common 과 같은 차례(같은 수면 먼저 나온 것) */
export function 세기(list) {
  const m = new Map()
  for (const v of list) m.set(v, (m.get(v) || 0) + 1)
  return m
}
export function 많은순(m, n) {
  const a = [...m.entries()]
  a.sort((x, y) => y[1] - x[1])            // Array.prototype.sort 는 안정 정렬입니다
  return n == null ? a : a.slice(0, n)
}

/* ══════════════════════════════════════════════════════════════
   순위 좁히기 — bidmath.js 의 rankBracket 을 그대로 씁니다.
   (같은 식을 여기 다시 적지 않습니다)
   ══════════════════════════════════════════════════════════════ */

/** 이 개찰에서 «우리 줄» 찾기 → [등수, 이름, 금액, 투찰률] · 없으면 null */
export function 내줄(row, bno) {
  const cs = row?.corps || []
  for (let i = 0; i < cs.length; i++) {
    const c = cs[i]
    if (c && c.length > 3 && c[3] && String(c[3]) === String(bno)) {
      return [i + 1, c[0], Number(c[1]) || 0, c[2] ? Number(c[2]) : null]
    }
  }
  return null
}

/** 개찰 한 건 채점 — tools/report_data.py 의 one() */
export function 한건(row, bno, p50) {
  const mine = 내줄(row, bno)
  if (!mine) return null
  const [rank, nm, amt, rate] = mine
  const cs = row.corps || []
  const win_amt = cs.length ? (Number(cs[0][1]) || 0) : 0
  const win_rate = cs.length && cs[0][2] ? Number(cs[0][2]) : null
  const out = {
    no: row.no, dt: row.dt, name: row.name, inst: row.inst,
    est: row.est, base: row.base, n: row.nrank || cs.length, rank, name_used: nm,
    amt, rate, win_amt, win_rate, baro: null,
  }
  const base = row.base || 0
  const llr = row.llr || 0
  const a = row.aval || 0
  const a_known = String(row.ayn || '').toUpperCase() === 'Y'
  if (base && llr && win_amt && win_rate) {
    const lo = row.lo != null ? Number(row.lo) : -3
    const hi = row.hi != null ? Number(row.hi) : 3
    const sd = B.sjSigma(lo, hi, row.ptot || 15, row.pdrw || 4)
    const ro = B.recommend({ base, llRate: llr, aVal: a, aKnown: a_known, p50, sd })
    if (ro) {
      /* ★ 채점의 «우리 금액» 은 화면이 실제로 띄우는 금액(shownBid)이어야 합니다.
         recommend 의 금액을 그대로 쓰면 바로투찰 화면과 어긋납니다. */
      const our = B.shownBid(base, p50, ro.amt)?.amt || 0
      const yeje = Math.round(win_amt / (win_rate / 100))
      const limit = Math.ceil((yeje - a) * (llr / 100) + a)
      const dq = our < limit
      const beat = our >= limit && our < win_amt
      const br = B.rankBracket(row.rq, our, limit, beat)
      out.limit = limit
      out.yeje = yeje
      out.llr = llr
      out.a_known = a_known
      out.aval = a
      if (yeje) {
        /* 조달청 투찰률과 같은 잣대 (A값을 빼지 않고 예정가격으로 나눕니다) */
        out.my_rate = r3(amt / yeje * 100)
        out.lim_rate = r3(limit / yeje * 100)
        out.win_gap_pp = r3((win_amt - limit) / yeje * 100)
        out.over_pp = r3((amt - limit) / yeje * 100)
        out.my_dq = amt < limit
      }
      /* ── 이 금액은 «몇 분위» 에 건 것인가 ──────────────────────
         낙찰하한금액 식을 사정률(sj)에 대해 거꾸로 풀면, 이 금액이 겨우 살아남는
         사정률 sj* 가 나옵니다. 사정률이 그보다 낮게 나오면 하한이 내려와 살고,
         높게 나오면 죽습니다. 그래서 «살아남을 확률» = Φ((sj*−p50)/σ) 이고,
         이것이 그대로 «분위» 입니다.
         ⚠️ bidmath 의 «75분위» 는 «사정률을 몇 분위로 가정하나» 이지 «살아남을 확률»
            이 아닙니다. 그래서 바로투찰 금액도 «같은 잣대로 되짚어» 나란히 둡니다. */
      if (sd && base && llr) {
        const _pct = (v) => {
          const sj = B.breakEvenSj(base, llr, a, v)
          return sj == null ? null : r1(B.normCdf((sj - p50) / sd) * 100)
        }
        out.my_pct = _pct(amt)
        out.baro_pct = _pct(our)
        if (win_amt) out.win_pct = _pct(win_amt)
      }
      out.baro = {
        amt: our, dq, beat,
        rank_lo: br ? br[0] : null,
        rank_hi: br ? br[1] : null,
      }
    }
  }
  return out
}

/** «충청남도 서천군» → «충청남도». 기관 이름 앞머리가 곧 시·도입니다. */
export const 시도 = (inst) => (String(inst || '').split(/\s+/)[0] || '')

/* 조달청 시각은 한국시간입니다. 브라우저가 어느 시간대에 있든 한국시간으로 잽니다. */
export function 지금한국() {
  const d = new Date(Date.now() + (new Date().getTimezoneOffset() * 60000) + 9 * 3600000)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ` +
         `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

/** 마감 전 공고에서 **이 업체가 넣을 만한 자리** 다섯 — report_data.py 의 next_five() */
export function 다음자리(recs, live, p50, n = 5) {
  if (!live || !live.length || !recs || !recs.length) return []
  const insts = 세기(recs.filter((x) => x.inst).map((x) => x.inst))
  const sidos = 세기(recs.filter((x) => x.inst).map((x) => 시도(x.inst)))
  const bases = recs.filter((x) => x.base).map((x) => x.base).sort((a, b) => a - b)
  if (!bases.length) return []
  const lo_b = bases[0] * 0.4
  const hi_b = bases[bases.length - 1] * 2.5
  const now = 지금한국()
  const out = []
  for (const r of live) {
    const base = r.base || 0
    const llr = r.llr || 0
    const close = String(r.close || '')
    if (!base || !llr || close <= now) continue
    if (!(lo_b <= base && base <= hi_b)) continue
    const inst = r.inst || ''
    let sc = 0
    if (insts.has(inst)) sc += 100 + insts.get(inst)
    else if (sidos.has(시도(inst))) sc += 40 + sidos.get(시도(inst))
    else continue                       // 연고 없는 자리는 권하지 않습니다
    const a = r.aval || 0
    const a_known = String(r.ayn || '').toUpperCase() === 'Y'
    const sd = B.sjSigma(r.lo != null ? Number(r.lo) : -3, r.hi != null ? Number(r.hi) : 3,
                         r.ptot || 15, r.pdrw || 4)
    const ro = B.recommend({ base, llRate: llr, aVal: a, aKnown: a_known, p50, sd })
    if (!ro) continue
    const sh = B.shownBid(base, p50, ro.amt)
    if (!sh) continue
    out.push({
      no: r.no, name: r.name, inst, close, base, est: r.est, llr, a, a_known,
      권장금액: sh.amt, 권장투찰률: sh.rate, url: r.url, 점수: sc,
      같은기관: insts.get(inst) || 0, 같은지역: sidos.get(시도(inst)) || 0,
    })
  }
  out.sort((x, y) => (y.점수 - x.점수) || (x.close < y.close ? -1 : x.close > y.close ? 1 : 0))
  return out.slice(0, n)
}

/** 성적표 한 벌 — tools/report_data.py 의 build() */
export function 성적표(bno, rows, p50, live) {
  const recs = []
  for (const r of rows) {
    const o = 한건(r, bno, p50)
    if (o) recs.push(o)
  }
  if (!recs.length) return null
  recs.sort((x, y) => String(y.dt || '').localeCompare(String(x.dt || '')))

  const name = 많은순(세기(recs.map((x) => x.name_used)), 1)[0][0]
  const ranks = recs.map((x) => x.rank)
  const wins = recs.filter((x) => x.rank === 1)
  const near = recs.filter((x) => x.rank >= 2 && x.rank <= 5)
  const over = recs.filter((x) => x.over_pp != null).map((x) => x.over_pp)
  const bb = recs.filter((x) => x.baro)
  const baro_win = bb.filter((x) => x.baro.beat)
  const baro_dq = bb.filter((x) => x.baro.dq)
  /* 등수를 견줄 수 있는 것만 (실격·범위밖 제외) */
  const cmp_ = bb.filter((x) => !x.baro.dq && x.baro.rank_lo)
  const better = cmp_.filter((x) => x.baro.rank_lo < x.rank).length
  const worse = cmp_.filter((x) => x.baro.rank_lo > x.rank).length
  const inst = 세기(recs.filter((x) => x.inst).map((x) => x.inst))

  /* ── 놓친 자리 ─────────────────────────────────────────────
     «조금만 낮췄으면 1순위였던» 자리. 하한선 아래로 쓴 건(실격)은 뺍니다 —
     그건 «더 낮게» 가 아니라 «더 높게» 썼어야 하는 자리라 뜻이 반대입니다. */
  const miss = []
  for (const x of recs) {
    if (x.rank === 1 || x.my_dq || !x.win_amt) continue
    const gap = x.amt - x.win_amt
    if (gap <= 0) continue
    const lim = x.limit || 0
    miss.push({
      dt: x.dt, name: x.name, inst: x.inst, rank: x.rank, n: x.n,
      amt: x.amt, win: x.win_amt, gap,
      gap_pp: x.yeje ? r3(gap / x.yeje * 100) : null,
      room: lim ? (x.amt - lim) : null,       // 하한선까지 남아 있던 여유
      enough: !!(lim && x.win_amt > lim),
    })
  }
  miss.sort((a, b) => a.gap - b.gap)

  /* ── 금액대별 ──────────────────────────────────────────────── */
  const 칸이름 = (v) => ((v || 0) < 3e8 ? '3억 미만' : ((v || 0) < 10e8 ? '3~10억' : '10억 이상'))
  const bd = new Map()
  for (const x of recs) {
    const k = 칸이름(x.base || x.amt)
    if (!bd.has(k)) bd.set(k, { 투찰: 0, 낙찰: 0, 등수합: 0 })
    const v = bd.get(k)
    v.투찰 += 1
    v.등수합 += x.rank
    if (x.rank === 1) v.낙찰 += 1
  }
  const band = [...bd.entries()].sort((a, b) => b[1].투찰 - a[1].투찰)
    .map(([k, v]) => ({ 칸: k, 투찰: v.투찰, 낙찰: v.낙찰, 평균등수: r1(v.등수합 / v.투찰) }))

  /* ── 기관별 «낙찰선이 어디였나» ──────────────────────────────
     1순위 금액이 하한선보다 몇 %p 위였는지. 그 기관에서 «얼마에 갈렸는가» 입니다. */
  const ib = new Map()
  for (const x of recs) {
    if (x.limit && x.yeje && x.win_amt) {
      if (!ib.has(x.inst)) ib.set(x.inst, [])
      ib.get(x.inst).push(r3((x.win_amt - x.limit) / x.yeje * 100))
    }
  }
  const inst_band = [...ib.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 8)
    .map(([k, vv]) => {
      const v = [...vv].sort((a, b) => a - b)
      return { 기관: k, 건: v.length, 최저: v[0], 중앙: v[Math.floor(v.length / 2)], 최고: v[v.length - 1] }
    })

  /* ── ① 실격 해부 ────────────────────────────────────────────
     화면은 «실격» 이라고만 씁니다. 여기서는 **왜** 인지를 짚습니다. */
  const dq = recs.filter((x) => x.my_dq)
  let dq_an = null
  if (dq.length) {
    const short = dq.filter((x) => x.yeje).map((x) => r3((x.limit - x.amt) / x.yeje * 100))
    dq_an = {
      건: dq.length, 전체: recs.length,
      모자란pp중앙: short.length ? 중앙(short) : null,
      모자란pp최대: short.length ? Math.max(...short) : null,
      A값있는자리: [dq.filter((x) => x.a_known).length, recs.filter((x) => x.a_known).length],
      기관쏠림: 많은순(세기(dq.map((x) => x.inst)), 3),
      버린돈: dq.reduce((s, x) => s + x.amt, 0),
      목록: dq.slice(0, 8).map((x) => ({
        dt: x.dt, name: x.name, inst: x.inst, amt: x.amt, limit: x.limit,
        short: x.limit ? (x.limit - x.amt) : null,
        short_pp: x.yeje ? r3((x.limit - x.amt) / x.yeje * 100) : null,
        n: x.n,
      })),
    }
  }

  /* ── ② 투찰 습관 역산 ───────────────────────────────────────
     «이 회사는 어떤 규칙으로 금액을 정하는가» 를 되짚습니다. */
  let hb2 = null
  const ov = recs.filter((x) => x.over_pp != null).map((x) => x.over_pp)
  const wg = recs.filter((x) => x.win_gap_pp != null).map((x) => x.win_gap_pp)
  const mr = recs.filter((x) => x.my_rate).map((x) => x.my_rate)
  if (ov.length >= 3) {
    hb2 = {
      잰개찰: ov.length,
      내자리중앙: r3(중앙(ov)),
      내자리평균: r3(평균(ov)),
      흔들림: r3(흩어짐(ov)),
      낙찰선중앙: wg.length ? r3(중앙(wg)) : null,
      내투찰률중앙: mr.length ? r3(중앙(mr)) : null,
      최저: r3(Math.min(...ov)), 최고: r3(Math.max(...ov)),
    }
    if (hb2.낙찰선중앙 != null) hb2.어긋남 = r3(hb2.내자리중앙 - hb2.낙찰선중앙)
  }

  /* ── ③ 분위 버릇 ────────────────────────────────────────────
     ⚠️ 여기서 «분위를 올리세요» 라고만 적으면 반쪽입니다. 3년치 실측(8,406건)은
        분위를 어떻게 잡아도 1순위율이 3.5~4.4% 에서 안 움직인다고 말합니다.
        움직이는 것은 실격률뿐입니다(14% → 84%). */
  const pcts = recs.filter((x) => x.my_pct != null).map((x) => x.my_pct)
  const 칸정의 = [['30분위 미만', 0, 30], ['30~50분위', 30, 50], ['50~70분위', 50, 70],
                 ['70~85분위', 70, 85], ['85분위 이상', 85, 101]]
  let qt = null
  if (pcts.length >= 3) {
    const haves = recs.filter((x) => x.my_pct != null)
    const rows_q = []
    for (const [nm_, lo_, hi_] of 칸정의) {
      const g = haves.filter((x) => lo_ <= x.my_pct && x.my_pct < hi_)
      if (!g.length) continue
      rows_q.push({
        칸: nm_, 투찰: g.length,
        실격: g.filter((x) => x.my_dq).length,
        낙찰: g.filter((x) => x.rank === 1).length,
        평균등수: r1(평균(g.map((x) => x.rank))),
      })
    }
    const dq_n = haves.filter((x) => x.my_dq).length
    const bp = haves.filter((x) => x.baro_pct != null).map((x) => x.baro_pct)
    const wp = haves.filter((x) => x.win_pct != null).map((x) => x.win_pct)
    qt = {
      잰개찰: pcts.length,
      중앙: r1(중앙(pcts)), 평균: r1(평균(pcts)),
      흔들림: pcts.length > 1 ? r1(흩어짐(pcts)) : 0.0,
      최저: r1(Math.min(...pcts)), 최고: r1(Math.max(...pcts)),
      /* 모형이 말하는 실격률(100−중앙분위)과 실제로 난 실격률을 나란히 둡니다.
         둘이 크게 어긋나면 그 자체가 읽을거리입니다(운이 좋았거나 나빴다는 뜻). */
      모형실격률: r1(100.0 - 중앙(pcts)),
      실제실격률: r1(dq_n / haves.length * 100.0),
      실격: dq_n,
      바로투찰중앙: bp.length ? r1(중앙(bp)) : null,
      낙찰자중앙: wp.length ? r1(중앙(wp)) : null,
      칸별: rows_q,
    }
  }

  const 만든날 = (() => {
    const d = new Date()
    const p = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
  })()

  return {
    업체: { 이름: name, 사업자번호: bno },
    요약: {
      투찰: recs.length, 낙찰: wins.length,
      낙찰률: r1(wins.length / recs.length * 100),
      아깝게진자리: near.length,
      기간: [recs[recs.length - 1].dt, recs[0].dt],
      평균참가: r1(평균(recs.map((x) => x.n))),
    },
    등수: {
      평균: r1(평균(ranks)), 중앙: 중앙(ranks),
      분포: (() => {
        const m = 세기(ranks.map((r) => (r === 1 ? 1 : r <= 5 ? 5 : r <= 10 ? 10 : 30)))
        const o = {}
        for (const k of [...m.keys()].sort((a, b) => a - b)) o[String(k)] = m.get(k)
        return o
      })(),
    },
    습관요약: {
      잰개찰: over.length,
      낙찰선위평균pp: over.length ? r3(평균(over)) : null,
      낙찰선위중앙pp: over.length ? r3(중앙(over)) : null,
      실격: recs.filter((x) => x.my_dq).length,
    },
    바로투찰이었다면: {
      잰개찰: bb.length, '1순위': baro_win.length, 실격: baro_dq.length,
      등수중앙: cmp_.length ? 중앙(cmp_.map((x) => x.baro.rank_lo)) : null,
      내등수중앙: cmp_.length ? 중앙(cmp_.map((x) => x.rank)) : null,
      내가나은건: worse, 바로투찰이나은건: better,
    },
    기관: 많은순(inst, 8),
    실격해부: dq_an,
    습관: hb2 || null,
    분위: qt,
    다음자리: 다음자리(recs, live, p50),
    놓친자리: miss.slice(0, 5),
    금액대: band,
    기관낙찰선: inst_band,
    기록: recs.slice(0, 60),
    기준: { 사정률중앙값: p50, 만든날 },
  }
}

/* ══════════════════════════════════════════════════════════════
   업체 찾기 — first.json 한 벌에서 «사업자번호별로 몇 건 넣었나» 를 셉니다.
   이름은 같은데 사업자번호가 다른 업체가 1,846가지 있습니다. 그래서 목록에
   사업자번호를 같이 보여 주고, 고르는 것은 **사업자번호**로 합니다.
   ══════════════════════════════════════════════════════════════ */
export function 업체목록(rows) {
  const m = new Map()
  for (const r of rows) {
    const cs = r.corps || []
    for (const c of cs) {
      if (!c || c.length <= 3 || !c[3]) continue
      const k = String(c[3])
      let v = m.get(k)
      if (!v) { v = { bno: k, 이름: c[0], 건: 0, 낙찰: 0, 마지막: '' }; m.set(k, v) }
      v.건 += 1
      if (c === cs[0]) v.낙찰 += 1
      const dt = String(r.dt || '')
      if (dt > v.마지막) { v.마지막 = dt; v.이름 = c[0] }
    }
  }
  return [...m.values()]
}

/** 검색 — 이름 조각이나 사업자번호 숫자로 찾습니다 */
export function 업체찾기(list, q) {
  const s = String(q || '').trim()
  if (!s) return []
  const d = s.replace(/[^0-9]/g, '')
  const out = list.filter((x) => (d.length >= 3 && x.bno.includes(d)) ||
                                 (s.length >= 2 && x.이름 && x.이름.includes(s)))
  out.sort((a, b) => b.건 - a.건)
  return out.slice(0, 60)
}
