import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getJSON, getOverview, getAgency, similarZone, getSim, getBidIndex, indexRows } from '../lib/data.js'
import { won, wonShort, pct, num, dateTime, dday } from '../lib/fmt.js'
import { winGrade } from '../lib/winodds.js'
/* 계산은 전부 여기 있습니다 — 화면과 채점이 같은 함수를 씁니다 */
import { bidAmount, limitAmount, limitRate, r3, c3,
         sjSigma, recommend, buildScen, missingOf, isReady,
         digits, toNum, P50_FALLBACK, shownBid, passProb, QTILES, QTILE_N, quantileBid,
         smartBid, autoRule } from '../lib/bidmath.js'
/* 공고 화면(LiveBoard)이 예전부터 여기서 가져다 썼습니다 — 그대로 이어 줍니다 */
export { missingOf, isReady }

/* ============================================================
   바로투찰 — 공고를 고르면 투찰금액이 바로 나오는 화면

   [숫자의 근거]  개찰 106,534건을 시간 순서를 지켜 되돌려 본 결과입니다.

   · 권장 투찰률 = 전국 최근 30일 최빈 낙찰률 − 0.20%p
       최빈값에 딱 맞추면 안 됩니다. 최빈값은 낙찰하한율보다 중앙값
       0.30%p 위에 있어서, 맞추면 낙찰자보다 높아 집니다.
       0.20%p 낮추면 역검증 승률이 50.7% → 67.0% 로 올라갔습니다.
   · 발주기관별 최다구간은 쓰지 않습니다.
       표본 80건이 쌓인 기관에서도 전국값이 4.6%p 이겼습니다.
   · 창은 30일. 90일은 제도가 바뀔 때 실격 추천이 43%까지 뜁니다.

   [금액 계산]
       예정가격 = 기초금액 × 사정률
       투찰금액 = (예정가격 − A값) × 투찰률 + A값        ← 원 단위 절상
   ============================================================ */

/* 도장은 getJSON 이 /data 전체에 알아서 붙입니다 */
const getIndex = () => getBidIndex()
/* 규모별 «참가업체수»와 «A값 비율» — 1KB 남짓입니다 */
const getBandStat = () => getJSON('/data/bandstat.json')
/* 최근 7일 개찰 결과 — 채점할 때만 받아옵니다 */
const getResults = () => getJSON('/data/bidresult.json')
/* A값 내역(법정경비 항목별) — 공고를 «고른 뒤»에만 받습니다.
   목록에 같이 실었더니 첫 화면 전송량의 29% 를 이것이 먹고 있었습니다
   (gzip 153.7 → 109.2KB). 고르기 전에는 볼 일이 없는 값입니다. */
const getAparts = () => getJSON('/data/aparts.json')

/** 일반공사 적격심사 낙찰하한율 (조달청 기준, 참고용) */
function lowerLimit(estimate) {
  if (!estimate) return null
  const eok = estimate / 1e8
  if (eok >= 100) return { rate: null, note: '100억 이상 — 종합심사(별도 기준)' }
  if (eok >= 50) return { rate: 87.495, note: '추정가격 50억~100억' }
  if (eok >= 10) return { rate: 88.745, note: '추정가격 10억~50억' }
  return { rate: 89.745, note: '추정가격 10억 미만' }
}

/* ⚠️ 2026-09-02 — 여기가 이 사이트에서 제일 중요한 두 줄입니다. 실제로 틀렸었습니다.

   조달청이 개찰결과에 주는 «투찰률»은  투찰금액 ÷ 예정가격  입니다. A값을 빼지 않습니다.
   실측으로 확인했습니다(A값이 실린 공고 30건):
     · 투찰금액 ÷ 예정가격 으로 되짚은 사정률  중앙 99.88 (실측 기준선 99.852와 일치)
     · A값을 뺀 식으로 되짚으면            중앙 99.55 (0.3%p 어긋남)
     · 낙찰하한과의 여유도 앞 식에서만 0.002~0.08% 로 «하한에 딱 붙어» 나옵니다.

   그런데 «낙찰하한금액»은 적격심사 규정대로 A값을 뺀 식입니다:
       낙찰하한금액 = (예정가격 − A) × 낙찰하한율 + A

   두 식을 섞으면 안 됩니다. 예전 코드는 우리 권장 투찰률(낙찰률 공간의 값)을
   A값 식에 넣어, A가 기초의 5%인 공고에서 실효 투찰률을 0.49%p 밀어 올렸습니다.
   권장 90.10% 로 알고 넣었는데 실제로는 90.59% 로 들어가 최빈값보다 위였습니다. */

/* ══════════════════════════════════════════════════════════════
   「사정률이 이 값이었다면」 표 — **바로투찰과 채점이 같은 표를 씁니다.**

   여기가 신뢰의 핵심입니다.
   앞으로 넣을 공고에서 보여주는 표와, 끝난 공고를 채점할 때 보여주는 표가
   같은 함수(buildScen)·같은 금액(recommend)으로 그려집니다.
   그래서 «채점에서 잘 나오던데 실제로는 다르더라» 가 생길 수 없습니다.
   ══════════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════════
   「왜 이 금액인가」 — 실제 개찰 958건으로 잰 성적표.

   표본: 2026-08~09 개찰 중 기초금액·A값이 실측으로 다 있고,
        낙찰자 금액에서 낙찰하한율을 되짚어 **확정된** 958건.
        (되짚은 값이 89.745 에 916건, 88.745 에 33건으로 또렷하게 뭉칩니다)

   ⚠️ 숫자를 손으로 고치지 마세요. 고치려면 다시 재고 나서 고치세요.
      재는 법은 docs/2026-09-02_완비공고만_검증.md §5 에 적어 두었습니다.
   ══════════════════════════════════════════════════════════════ */
const GRADE = [
  ['50분위', 48.0, 3.13, 0.42],
  ['69분위', 29.0, 3.13, 0.59],
  ['75분위', 23.8, 2.82, 0.67],
  ['75분위 + 0.3% 여유', 11.6, 4.07, 0.87],
  ['84분위', 14.6, 3.24, 0.83],
  ['90분위', 8.2, 2.51, 0.99],
  ['95분위', 3.7, 1.88, 1.19],
]
function GradeCard() {
  return (
    <div className="card c-grade">
      <div className="detail-h">
        왜 이 금액인가 <span className="count">· 실제 개찰 958건에 대본 성적</span>
      </div>
      <div className="note sm" style={{ marginTop: 0 }}>
        사정률을 어디에 맞출지는 <b>취향이 아니라 실측으로</b> 정했습니다.
        기초금액·A값·낙찰하한율이 전부 확인된 개찰 958건에 각 방식을 그대로 대봤습니다.
      </div>
      <div className="grow ghd">
        <span>사정률 기준</span><span>실격</span><span>1순위</span><span>낙찰가차이</span>
      </div>
      {GRADE.map((g) => (
        <div key={g[0]} className={'grow' + (g[0].includes('여유') ? ' on' : '')}>
          <span className="n">{g[0]}</span>
          <span className="d">{g[1].toFixed(1)}%</span>
          <span className="w">{g[2].toFixed(2)}%</span>
          <span className="g">{g[3].toFixed(2)}%</span>
        </div>
      ))}
      <div className="cav">
        <b>낙찰가와의 차이를 줄이는 것 자체는 목표가 아닙니다.</b>
        50분위로 내리면 차이는 0.42% 까지 줄지만 <b>둘에 하나가 실격</b>이고,
        1순위가 되는 비율은 오히려 떨어집니다(3.13% ↔ 4.07%).
        실격한 투찰은 «싸게 쓴 것»이 아니라 <b>버린 것</b>입니다.
        그래서 1순위가 되는 비율이 가장 높은 «75분위 + 0.3% 여유»에 맞춰 두었습니다.
        <br /><br />
        <b>한 가지 솔직히 말씀드립니다.</b> 1순위가 되는 비율은 어느 기준으로 잡아도
        2.5~4.1% 사이입니다(오차 ±0.5%p). 공사 하나에 보통 수십 곳이 붙기 때문에,
        누가 계산을 잘해서 이기는 게 아니라 <b>그날 추첨이 정합니다.</b>
        바로투찰이 하는 일은 «실격을 피하면서 가능한 한 낮게» 넣어 주는 것까지입니다.
        그 이상을 약속하는 곳이 있다면 믿지 마세요.
      </div>
      <div className="cav" style={{ marginTop: 6, opacity: .8 }}>
        표본 2026-08~09 개찰 958건(낙찰하한율까지 실측으로 확정한 건) ·
        낙찰가차이는 실격이 아닌 건의 중앙값 · 검증 방법은 저장소 docs 폴더에 있습니다.
        <br />아래 «가상 시뮬레이션»은 <b>같은 규칙을 최근 30일에 자동으로 다시 대본 것</b>입니다 —
        배치가 돌 때마다 갱신되므로, 이 표와 비슷하게 나오는지 직접 견줘 보실 수 있습니다.
      </div>
    </div>
  )
}

function ScenTable({ sc, amtLabel, pctile, realNote }) {
  if (!sc || !sc.rows?.length) return null
  return (
    <div className="scen">
      <div className="sch">
        사정률이 이 값이었다면
        <span className="cnt">
          10개 자리 중 <b>{sc.passN}개</b>에서 통과
          {sc.rows.some((x) => x.real) && (
            <> · {realNote || '이번 개찰'}은 <b>{sc.rows.find((x) => x.real).pass ? '통과' : '실격'}</b></>
          )}
        </span>
      </div>
      <div className="note sm" style={{ margin: '0 0 8px' }}>
        사정률은 투찰 <b>뒤에</b> 추첨됩니다. «{amtLabel}»은 그대로고 하한만 움직입니다 — 통과·실격은 그날 추첨이 정합니다.
      </div>
      <div className="scrow shd">
        <span>사정률</span><span>그때의 최저가</span><span>{amtLabel}과</span><span>결과</span>
      </div>
      {sc.rows.map((x, i) => (
        <div key={i} className={'scrow' + (x.pass ? ' ok' : ' no') + (x.real ? ' real' : '')}>
          <span className="sj">
            {x.sj.toFixed(3)}%
            {x.real ? <i className="tag">← {realNote || '이번 개찰'}</i>
                    : <i className="q">{x.q}분위</i>}
          </span>
          <span className="lo">{won(x.low)}</span>
          <span className={'gp ' + (x.gap >= 0 ? 'p' : 'm')}>
            {x.gap >= 0 ? `+${wonShort(x.gap)}` : `−${wonShort(-x.gap)}`}
          </span>
          <span className="rs">{x.pass ? '통과' : '실격'}</span>
        </div>
      ))}
      <div className="cav" style={{ marginTop: 8 }}>
        바로투찰은 <b>{pctile}분위</b> 기준입니다. 실측 958건에서 실격 11.6% — 더 낮추면 실격이 늘고, 더 올리면 낙찰가와 멀어집니다.
      </div>
    </div>
  )
}

export default function BaroBid() {
  const [sp] = useSearchParams()
  const [idx, setIdx] = useState(undefined)
  const [ov, setOv] = useState(null)
  const [ag, setAg] = useState(null)
  const [sim, setSim] = useState(null)
  const [bt, setBt] = useState(null)      // 가상 시뮬레이션 결과
  const [btOpen, setBtOpen] = useState(false)
  const [bs, setBs] = useState(null)      // 규모별 참가업체수·A값 비율
  const [res, setRes] = useState(null)    // 개찰 결과 (채점용)
  /* «검증하러 온 화면»에서 계산기 입력칸까지 펼쳐 보이면
     검증하러 왔는데 또 뭘 쓰라는 화면이 됩니다. 기본은 접어 둡니다. */
  const [showCalc, setShowCalc] = useState(false)
  /* ⚠️ 2026-09-03 — «뭐가 많은데» 라는 말을 들었습니다. 세어 보니 결과 화면에
     블록이 14개였습니다. 답은 하나(권장 금액)인데 근거가 13개 붙어 있었습니다.
     근거를 없애면 «못 믿겠다» 가 되고, 다 펼쳐두면 «뭐가 많다» 가 됩니다.
     그래서 **답과 판정만 펼쳐 두고, 근거는 한 번 눌러서 보게** 합니다.
     지우는 게 아니라 접는 것입니다 — 한 번 누르면 예전 화면 그대로입니다. */
  const [showWhy, setShowWhy] = useState(false)
  /* 공고를 목록에서 고르면 기초금액·A값·예가범위가 전부 자동으로 채워집니다.
     그런데 그 입력 폼이 화면 위쪽 432px 를 먹고 있었습니다.
     자동으로 채워졌으면 접어 두고, 고치고 싶을 때만 펼칩니다. */
  const [editIn, setEditIn] = useState(false)
  /* 기본은 «계산할 수 있는 공고»만 보여줍니다. 덜 갖춰진 걸 섞으면 신뢰가 무너집니다. */
  const [onlyReady, setOnlyReady] = useState(true)

  const [q, setQ] = useState('')
  const [picked, setPicked] = useState(null)
  /* A값 내역 — 공고를 고르면 그때 한 번만 받아 옵니다 (한 화면에 한 번) */
  const [apMap, setApMap] = useState(null)
  const [inst, setInst] = useState('')

  const [base, setBase] = useState(0)
  const [budgetIn, setBudgetIn] = useState('')
  const [aIn, setAIn] = useState('')
  /* A값이 «우리가 추정해 넣은 값»인지 «진짜 아는 값»인지 구별합니다.
     추정값으로 «A값을 안다» 고 판단하면 안 됩니다 — 사정률 분위가 달라집니다. */
  const [aAuto, setAAuto] = useState(false)
  const [pickRate, setPickRate] = useState(() => {
    try { const q = localStorage.getItem('kcm_qtile'); return q ? `q${q}` : 'rec' } catch { return 'rec' }
  })   // rec | limit | safe | own | q50..q95
  /* 사용자가 직접 고른 뒤에는 자동으로 바꾸지 않습니다 */
  const rateTouched = useRef(false)
  const [ownRate, setOwnRate] = useState('')
  const [copied, setCopied] = useState(false)
  const [sjPick, setSjPick] = useState(null)   // 사정률 후보를 직접 고른 경우
  const seeded = useRef(false)

  useEffect(() => {
    getOverview().then(setOv)
    getIndex().then((v) => setIdx(v || null))
    getSim().then(setBt)
    getBandStat().then(setBs)
  }, [])

  /* 개찰 상세의 «바로투찰 열기» 로 넘어온 값 */
  useEffect(() => {
    if (seeded.current) return
    seeded.current = true
    const b = toNum(sp.get('base'))
    if (b) setBase(b)
    if (sp.get('inst')) setInst(sp.get('inst'))
    if (sp.get('name')) setQ(sp.get('name'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!inst) { setAg(null); return }
    let ok = true
    getAgency(inst).then((v) => { if (ok) setAg(v) })
    return () => { ok = false }
  }, [inst])

  /* 이 공고와 비슷한 과거 공고들이 실제로 몇 %에서 낙찰됐는지 */
  useEffect(() => {
    const nm = picked?.name || (sp.get('name') || '')
    if (!nm || nm.length < 3) { setSim(null); return }
    let ok = true
    similarZone(nm).then((v) => { if (ok) setSim(v) })
    return () => { ok = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picked])

  /* bidindex 는 이름표(f)로 읽습니다 — data.js 의 indexRows 하나를 세 화면이 같이 씁니다.
     (aparts 는 여기 없습니다 — 고른 뒤 aparts.json 에서 따로 받습니다) */
  const rows = useMemo(() => indexRows(idx), [idx])

  /* ══════════════════════════════════════════════════════════
     채점용 개찰결과 색인(bidresult.json)은 최근 7일치만 담습니다.
     그런데 1순위 목록은 7주치를 보여줍니다 —
     그대로 두면 6주치는 «채점»을 눌러도 아무 일이 안 일어납니다.

     그래서 1순위 카드가 채점에 필요한 값을 주소에 실어 보냅니다.
     자료를 더 받지 않고도 7주 전체가 채점됩니다.
     (연락처·대표자는 색인에만 있어, 지난 개찰에서는 안 보입니다)
     ══════════════════════════════════════════════════════════ */
  const fromUrl = useMemo(() => {
    if (sp.get('sc') !== '1') return null
    const n = (k) => { const v = Number(sp.get(k)); return Number.isFinite(v) ? v : 0 }
    const amt = n('amt'), rate = n('rate')
    if (!(amt > 0 && rate > 0)) return null
    return {
      no: (sp.get('no') || '').toUpperCase(),
      win: sp.get('win') || '', amt, rate, np: n('np'), base: n('base'),
      dt: sp.get('dt') || '', tel: '', ceo: '', bno: '', adr: '', tsrc: 0,
      name: sp.get('nm') || '', inst: sp.get('it') || '',
      aval: n('aval'), ayn: sp.get('ayn') || '',
      lo: sp.has('lo') ? n('lo') : null, hi: sp.has('hi') ? n('hi') : null,
      old: true,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp])

  /* 공고번호를 넣거나 공고를 고르면, 그 공고가 이미 개찰됐는지 찾아봅니다.
     첫 화면을 무겁게 하지 않으려고 «필요할 때만» 받아옵니다. */
  useEffect(() => {
    const raw = (picked?.no || sp.get('no') || q).trim().toUpperCase()
    const no = /^[A-Z]?\d{0,2}[A-Z]{0,4}\d{6,}$/.test(raw) ? raw : (picked?.no || '')
    if (!no || no.length < 8) { setRes(null); return }
    let ok = true
    getResults().then((m) => {
      if (!ok) return
      const a = m?.r?.[no]
      setRes(a ? {
        no, win: a[0], amt: a[1], rate: a[2], np: a[3], base: a[4], dt: a[5],
        tel: a[6] || '', ceo: a[7] || '', bno: a[8] || '', adr: a[9] || '',
        tsrc: a[10] || 0, name: a[11] || '', inst: a[12] || '',
        aval: a[13] || 0, ayn: a[14] || '',
        amts: Array.isArray(a[15]) ? a[15] : [],
        rq: Array.isArray(a[16]) ? a[16] : [],      // [[등수, 금액], ...] 순위 사다리
        nrank: a[17] || 0,
        lo: a[18] != null ? a[18] : null, hi: a[19] != null ? a[19] : null,
        lic: Array.isArray(a[20]) ? a[20] : [],
        /* ★ 2026-09-03 — 공고서의 낙찰하한율·추정가격. 채점이 이걸 안 쓰면
           바로투찰(공고 화면)과 다른 금액이 나옵니다. */
        llr: a[21] != null ? Number(a[21]) : 0, est: Number(a[22]) || 0,
        enp: Number(a[23]) || 0, enpn: Number(a[24]) || 0,
      } : fromUrl)
    })
    return () => { ok = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picked, q, fromUrl])

  /* 공고 화면에서 «💰 바로투찰» 로 넘어오면 공고번호 하나만 옵니다.
     그 번호로 목록에서 찾아 자동으로 골라 줍니다 —
     기초금액·A값·면허·지역·낙찰하한율이 전부 따라옵니다.
     (예전에는 사용자가 공고번호를 적어 와서 다시 검색해야 했습니다) */
  const autoPicked = useRef(false)
  useEffect(() => {
    if (autoPicked.current || picked) return
    const no = (sp.get('no') || '').trim().toUpperCase()
    if (!no || !rows.length) return
    const hit = rows.find((r) => String(r.no).toUpperCase() === no)
    if (!hit) { autoPicked.current = true; return }   // 마감된 공고면 채점만 합니다
    autoPicked.current = true
    pick(hit)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows])

  const qDigits = digits(q)
  const qIsAmount = q.trim().length > 0 && qDigits.length >= 7
    && q.trim().replace(/[,\s원]/g, '') === qDigits

  useEffect(() => {
    if (qIsAmount) { setPicked(null); setBase(Number(qDigits)) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qIsAmount, qDigits])

  const hits = useMemo(() => {
    const s = q.trim()
    if (qIsAmount || s.length < 2 || !rows.length) return []
    const up = s.toUpperCase()
    const out = []
    for (const r of rows) {
      if (onlyReady && !isReady(r)) continue      // 계산할 수 없는 공고는 감춥니다
      if ((r.name || '').includes(s) || (r.inst || '').includes(s)
        || (r.no || '').toUpperCase().includes(up)) {
        out.push(r)
        if (out.length >= 40) break
      }
    }
    return out
  }, [rows, q, qIsAmount, onlyReady])

  /* 감춘 게 몇 건인지 알려줘야 «왜 안 나오지» 가 안 됩니다 */
  const hiddenCount = useMemo(() => {
    const t = q.trim()
    if (!onlyReady || qIsAmount || t.length < 2 || !rows.length) return 0
    const up = t.toUpperCase()
    return rows.filter((r) => !isReady(r) &&
      ((r.name || '').includes(t) || (r.inst || '').includes(t)
       || (r.no || '').toUpperCase().includes(up))).length
  }, [rows, q, qIsAmount, onlyReady])

  const pick = (r) => {
    /* A값 내역은 고른 뒤에만 필요합니다. 한 화면에 한 번만 받고, 실패해도 그냥 넘어갑니다
       (내역은 «보여주는 것»일 뿐 계산에 쓰이지 않습니다 — 계산은 aval 합계로 합니다) */
    if (apMap === null) {
      setApMap({})
      getAparts().then((d) => setApMap((d && d.a) || {})).catch(() => {})
    }
    setPicked(r); setQ(r.name); setInst(r.inst)
    setBase(r.base || 0); setBudgetIn(''); setPickRate('rec'); setCopied(false)
    // 공고에 A값이 실려 오면 그대로 채웁니다 (손으로 옮겨 적을 일을 없애는 게 이 화면의 목적)
    /* ⚠️ bidPrceCalclAYn='N' 은 «이 공고는 A값을 적용하지 않는다» 는 뜻입니다.
       그런데 수집 쪽은 항목 합계를 그대로 담습니다. 화면에서 걸러야 합니다.
       안 거르면 하한을 실제보다 높게 잡아 «통과인데 실격» 이라고 겁을 줍니다. */
    setAIn(r.ayn === 'N' ? '' : (r.aval ? String(r.aval) : ''))
    setAAuto(false)
    setSjPick(null)
  }
  const clear = () => {
    setPicked(null); setQ(''); setInst(''); setBase(0)
    setBudgetIn(''); setAIn(''); setAAuto(false); setPickRate('rec'); setOwnRate('')
  }

  /* ── 계산 ─────────────────────────────── */
  /* ⚠️ 공고의 «예산» 칸(budget)을 추정가격으로 쓰면 안 됩니다.
     조달청이 주는 값은 배정예산·총사업비라서 기초금액보다 큽니다.
     (예: 기초 397,111,000 인데 예산 485,852,000)
     낙찰하한율은 추정가격으로 갈리므로 여기서 틀리면 하한율 구간이 어긋납니다.
     추정가격은 기초금액에서 부가세를 뺀 값(÷1.1)이 맞습니다. */
  const estimate = toNum(budgetIn) || picked?.est || res?.est || (base ? Math.round(base / 1.1) : 0)

  const hot = ov?.hot || null
  const regime = ov?.regime || null

  /* ⚠️ 공사 규모마다 낙찰하한율이 다르고, 최빈 낙찰률과의 간격도 다릅니다.
     모든 규모에 «전국 최빈 − 0.20» 을 쓰면 50억 공사에서 7%p 손해를 봅니다.
       10억 미만  최빈 90.30 · 하한 89.745 · 권장 90.10
       10~50억    최빈 89.40 · 하한 88.745 · 권장 89.10
       50~100억   최빈 88.70 · 하한 87.495 · 권장 88.15
       100억 이상 종합심사 — 이 계산기를 쓰면 안 됩니다
     경계는 실측으로 확인했습니다(추정가격 10.00억·50.00억에서 계단이 보임). */
  const band = (ov?.bands || []).find(
    (b) => estimate >= b.min && (b.max == null || estimate < b.max)) || null
  const rec = band ? band.rec : (hot?.rec ?? null)

  /* 낙찰하한율은 «추정» 보다 «공고가 알려준 값» 이 언제나 정확합니다.
     공고에 실려 있으면 그걸 쓰고, 없을 때만 규모로 추정합니다. */
  /* ⚠️ 공고가 준 낙찰하한율에 쓰레기값이 섞여 옵니다 — 실측: 1(4건), 90(2건).
     그대로 쓰면 금액이 통째로 틀립니다. 말이 되는 범위만 받습니다. */
  const rawLL = Number(picked?.llr || sp.get('llr') || res?.llr) || 0
  const givenLL = (rawLL >= 60 && rawLL <= 100) ? rawLL : 0
  const ll = givenLL > 0
    ? { rate: givenLL, note: '공고서에 적힌 낙찰하한율', given: true }
    : band
      ? { rate: band.llr, note: `추정가격 ${band.label}` }
      : lowerLimit(estimate)
  const a = toNum(aIn)
  const lo = picked?.lo ?? -3
  const hi = picked?.hi ?? 3


  const sjMid = sjPick ?? ov?.sjq?.p50 ?? P50_FALLBACK

  /* ══════════════════════════════════════════════════════════
     사정률 분포는 공고마다 다릅니다. 전국 하나로 쓰면 안 됩니다.

     예정가격은 예비가격 ptot개 중 pdrw개를 뽑아 평균 내어 정해지고,
     예비가격은 기초금액의 ±(예가범위)% 안에서 흩어집니다. 그래서

         사정률 표준편차 = √( (범위폭² ÷ 12) × (1 ÷ 뽑는개수)
                             × ((전체개수 − 뽑는개수) ÷ (전체개수 − 1)) )

     실측 대조: ±3%·15중4 → 계산 0.768 / 실측 0.732
                ±2%·15중4 → 계산 0.512 / 실측 0.584   (표본 33건)
     전국 실측으로 역산한 배수 (p95−p50)÷σ = (101.024−99.896)÷0.691 = 1.63

     ⚠️ 지금 공고의 14.5% 가 예가범위 ±2% 입니다.
        여기에 ±3% 분포를 쓰면 5억 공고 기준 약 200만원을 더 쓰게 됩니다.
     ══════════════════════════════════════════════════════════ */
  const sjSd = sjSigma(lo, hi, picked?.ptot, picked?.pdrw)
  /* ── 사정률을 어디로 잡을 것인가 (역검증 2,532건) ─────────────
     A값을 «아는» 공고와 «모르는» 공고는 답이 다릅니다.

     A값을 아는 공고 → 75분위 + 0.3%
        승률 13.23% (전 구간 최고) · 실격 13.0% · 5억 공고 기준 낙찰가와 368만원 차이
     A값을 모르는 공고 → 95분위
        승률 12.28% · 실격 5.3% · A값 가정이 3%든 7%든 승률이 가장 덜 흔들림

     왜 낮게 잡아도 되는가:
        승률은 «사정률을 맞히는 것»이 아니라 «낙찰 여유(창)의 폭»이 정합니다.
        그래서 사정률 분위수를 50~95 어디로 잡아도 승률이 12% 안팎으로 평평합니다.
        그렇다면 금액이 낮고 승률이 높은 쪽이 답입니다.

     ⚠️ 예전에는 95분위 하나로 고정했습니다. 그때 5억 공고 기준 차이가 561만원이었습니다.
     ⚠️ 2026-09-02 재검증(개찰 958건, 하한율·A값 모두 실측 확정):
          50분위 실격 48.0% 승률 3.13% 차이 0.42%
          75분위+0.3%여유 실격 11.6% 승률 4.07% 차이 0.87%  ← 지금
          95분위 실격 3.7% 승률 1.88% 차이 1.19%
        승률은 어디로 잡아도 2.5~4.1%(±0.5%p) 로 평평합니다. 지금 자리가 그중 최고입니다.
        예가범위별 P50 보정도 시험했으나 검증구간에서 승률이 4.47%→1.63% 로 **떨어져** 쓰지 않습니다. */
  /* ⚠️ 2026-09-03 바로잡음 — 예전에는 «공고를 목록에서 골랐을 때»만 A값을 안다고 봤습니다.
     그래서 ① 개찰이 끝난 공고를 채점할 때(개찰 자료엔 A값이 있는데도)
            ② 소장님이 공고서를 보고 A값을 손으로 넣었을 때
     둘 다 «A값 모름»으로 보고 95분위로 잡았습니다.
     같은 공고인데 채점은 621,509,664원, 직접 계산은 620,811,319원이 나온 원인입니다.
     이제 «어디서 왔든 진짜 A값이 있으면» 안다고 봅니다. 추정값(aAuto)만 빼고요. */
  const aKnown = (!!picked && (picked.ayn === 'N' || picked.aval > 0))
    || (!!res && (res.ayn === 'N' || res.aval > 0))
    || (!aAuto && toNum(aIn) > 0)
  const SJ_K = aKnown ? 0.674 : 1.63          // 75분위 : 95분위
  const SJ_MARGIN = aKnown ? 1.003 : 1.0      // 75분위에는 0.3% 여유를 붙입니다
  const sjLo = ov?.sjq?.p10 ?? sjMid
  const sjHi = ov?.sjq?.p90 ?? sjMid

  /* ══════════════════════════════════════════════════════════════
     권장 투찰금액 — 2026-09-02 전면 교체 (3년치 역검증 2,532건)

     예전: 전국 최빈 낙찰률 − 0.20%p  →  **2,532건 중 58%가 낙찰하한 미달(실격)**
     지금: 사정률을 «95분위로 높게» 잡고 그 예정가격에서의 낙찰하한금액

         권장금액 = ceil( (기초금액 × 사정률95 ÷ 100 − A) × 낙찰하한율 ÷ 100 + A )

     왜 사정률을 높게 잡나:
       투찰할 때는 예정가격을 모릅니다. 사정률이 높게 나오면 낙찰하한금액도 올라가는데,
       금액을 낮게 잡아 두면 바로 그때 실격합니다. 100번 중 95번은 이 금액이 하한을 넘습니다.

     역검증 성적 (10억 미만 2,479건, 2026-05~09):
       │ 방식            │ 1순위 획득 │ 실격   │
       │ 예전(최빈−0.20) │ 10.4%     │ 58.1% │
       │ 지금(사정률95)  │ 12.3%     │  5.3% │
     승률은 사정률을 어디로 잡든 12% 안팎으로 비슷합니다. 갈리는 건 실격률입니다.
     ══════════════════════════════════════════════════════════════ */
  /* 사정률을 어디까지 높게 잡을지는 «우리가» 정합니다. 물어보지 않습니다.
     3년치 역검증에서 1순위 획득률은 어디로 잡든 12% 안팎으로 같았고
     갈리는 건 실격률뿐이었습니다(50분위 48% ↔ 95분위 5.3%).
     승률이 같다면 실격이 적은 쪽이 답입니다. 그래서 95분위 하나로 고정합니다. */
  const recOut = recommend({
    base, llRate: ll?.rate, aVal: a, aKnown,
    p50: ov?.sjq?.p50 ?? P50_FALLBACK, sd: sjSd,
  })
  const sj95 = recOut ? recOut.sj
    : (aKnown ? (ov?.sjq?.p75 ?? null) : (ov?.sjq?.p95 ?? null))  // 없으면 전국값
  const recAmt = recOut ? recOut.amt
    : ((base > 0 && ll?.rate && sj95) ? Math.ceil(limitAmount(base, sj95, ll.rate, a) * SJ_MARGIN) : 0)
  const rec95 = recAmt ? shownBid(base, sjMid, recAmt).rate : null

  /* ★ 공고별 자동 분위 — 예상 참가(enp)를 알면 그 자리 실측에서 가장 많이 이긴 분위 (bidmath.autoRule) */
  const enpHere = Number(picked?.enp || res?.enp) || 0
  const enpN = Number(picked?.enpn || res?.enpn) || 0
  const aRule = autoRule(enpHere)
  const autoOut = (aRule && ll?.rate && base > 0 && sjSd > 0)
    ? smartBid({ base, llRate: ll.rate, aVal: a, aKnown, p50: sjMid, sd: sjSd, enp: enpHere }) : null
  const choices = []
  if (autoOut && autoOut.mode === 'auto') {
    choices.push({ k: 'auto', label: `자동 ${aRule.q}분위`, rate: autoOut.rate, why: '이 공고 자리 실측' })
  }
  if (rec95 != null) {
    choices.push({ k: 'rec', label: '권장', rate: rec95, why: '사정률이 높게 나와도 안전' })
  } else if (rec != null) {
    choices.push({ k: 'rec', label: '권장', rate: rec, why: `전국 최근 ${band?.win ?? hot?.win ?? 30}일` })
  }
  if (ll?.rate) {
    /* A값이 있으면 «명목 하한율»로 넣으면 실격입니다. 실효 하한으로 올려서 보여줍니다. */
    const lr = base > 0 ? c3(limitRate(base, sjMid, ll.rate, a)) : ll.rate
    /* 중앙 사정률 기준 하한입니다. 사정률이 그보다 높게 나오면 실격입니다.
       역검증에서 이 근처를 노리면 실격이 절반 가까이 났습니다. 이름으로 알려줍니다. */
    choices.push({ k: 'limit', label: '최저', rate: lr, why: '사정률 높으면 실격' })
    choices.push({ k: 'safe', label: '중간', rate: r3(lr + 0.3), why: '절충' })
  }
  /* ★ 분위 다이얼 — 소장님: 「분위를 고정하지 말고 공고마다 선택하게. 실격이다 아니다는 확률로.」
     50~95분위를 골라 넣을 수 있고, 판정 칸이 «이 금액이 살아남을 확률» 을 확률로 말합니다.
     고른 분위는 브라우저에 기억합니다(다음 공고에서도 그 분위로 시작). */
  const qchoices = (ll?.rate && base > 0 && sjSd > 0)
    ? QTILES.map((t) => {
        const qb = quantileBid({ base, llRate: ll.rate, aVal: a, p50: sjMid, sd: sjSd, q: t.q })
        return qb ? { k: `q${t.q}`, q: t.q, label: `${t.q}분위`, rate: qb.rate, dq: t.dq, win: t.win } : null
      }).filter(Boolean)
    : []
  const chosen = choices.find((c) => c.k === pickRate) || qchoices.find((c) => c.k === pickRate)
  const myRate = pickRate === 'own' ? (Number(ownRate) || 0) : (chosen?.rate ?? rec ?? 0)

  const main = bidAmount(base, sjMid, myRate)
  const bandLo = bidAmount(base, sjLo, myRate)
  const bandHi = bidAmount(base, sjHi, myRate)

  /* 하한 판정은 «명목 하한율»이 아니라 «A값을 반영한 실효 하한 투찰률»과 견줍니다.
     A값이 있는 공고에서 명목 하한율만 보면 통과인 줄 알고 실격합니다. */
  const llEff = ll?.rate ? c3(limitRate(base, sjMid, ll.rate, a)) : null
  /* 최종 판정은 «금액» 으로 합니다. 비율 비교만 하면 소수점에서 새어 나갑니다. */
  const pass = ll?.rate && base > 0
    ? main >= limitAmount(base, sjMid, ll.rate, a)
    : (llEff ? myRate >= llEff : null)
  const margin = llEff ? r3(myRate - llEff) : null
  /* ★ «실격» 은 사정률이 나와 봐야 압니다 — 이 금액이 하한을 넘길 확률과 그 경계 사정률 */
  const pp = (ll?.rate && base > 0 && main > 0)
    ? passProb({ base, llRate: ll.rate, aVal: a, amt: main, p50: sjMid, sd: sjSd }) : null

  /* ★ 앞으로 넣을 공고에도 «채점과 같은 표» 를 그립니다.
     내가 넣을 금액(main)이 사정률 추첨에 따라 어떻게 갈리는지 미리 봅니다.
     채점이 쓰는 buildScen 을 그대로 부릅니다 — 두 화면이 어긋날 수 없습니다. */
  const scLive = buildScen({
    base, llRate: ll?.rate, aVal: a,
    p50: ov?.sjq?.p50 ?? P50_FALLBACK, sd: sjSd, myAmt: main,
  })

  /* ⚠️ A값이 있는 공고에서는 전국 권장값이 실효 하한 아래일 수 있습니다.
     그때 «권장» 을 기본으로 띄우면 실격 금액을 기본값으로 내미는 셈입니다.
     그래서 자동으로 «하한» 으로 옮기고, 왜 옮겼는지 화면에 적습니다. */
  const recBelow = llEff != null && rec95 == null && rec != null && rec < llEff
  useEffect(() => {
    if (rateTouched.current) return
    if (recBelow) setPickRate('limit')
  }, [recBelow])
  /* 예상 참가를 아는 공고는 «자동 분위» 로 시작합니다 (손대지 않았고, 기억해 둔 분위도 없을 때) */
  const hasAuto = !!(autoOut && autoOut.mode === 'auto')
  useEffect(() => {
    if (rateTouched.current) return
    setPickRate(hasAuto ? 'auto' : 'rec')
  }, [hasAuto, picked?.no])

  const steps = []
  for (let s = 100 + lo; s <= 100 + hi + 0.001; s += 0.5) steps.push(Math.round(s * 100) / 100)
  const sjRow = Math.round(sjMid * 100) / 100
  if (!steps.includes(sjRow)) { steps.push(sjRow); steps.sort((x, y) => x - y) }

  const copy = () => {
    navigator.clipboard?.writeText(String(main))
    setCopied(true); setTimeout(() => setCopied(false), 1600)
  }
  /* 개찰이 끝난 공고면 «우리 권장으로 넣었으면 어땠나»를 채점합니다.
     순위는 투찰률로 갈립니다(예정가격 대비 비율이라 사정률과 무관).
     그래서 우리 권장 투찰률과 실제 1순위 투찰률을 그대로 견줍니다. */
  const bstatOf = (bd) => (bd && bs?.bands?.[bd.key]?.ar) ? bs.bands[bd.key] : null

  const scored = (() => {
    if (!res || !res.rate || !res.amt) return null
    /* ══════════════════════════════════════════════════════════
       «바로투찰을 썼다면 어땠나» 를 그대로 재현합니다.

       투찰 시점에 알 수 있던 것은 기초금액과 A값뿐입니다.
       그래서 바로투찰이 그날 내놨을 금액을 똑같이 다시 계산합니다:

           우리 금액 M = ceil( (기초 × 사정률95 ÷ 100 − A) × 하한율 ÷ 100 + A )

       그리고 개찰로 확정된 예정가격으로 채점합니다:

           실제 하한금액 L = ceil( (예정가격 − A) × 하한율 ÷ 100 + A )
           실격  = M < L
           1순위 = M ≥ L 이고 M < 실제 1순위 금액

       ⚠️ 예전에는 «옛 권장 투찰률(최빈−0.2)» 로 채점했습니다.
          그 값은 A값이 있는 공고에서 하한 미달이라, 채점이 온통 실격으로 나왔습니다.
          바로투찰이 실제로 내는 금액과 다른 것으로 채점하면 채점이 아닙니다.
       ══════════════════════════════════════════════════════════ */
    const yeje = Math.round(res.amt / (res.rate / 100))
    const sjmid = ov?.sjq?.p50 ?? P50_FALLBACK
    /* ⚠️ 채점은 «추천이 그날 실제로 냈을 금액» 을 그대로 다시 계산해야 합니다.
       예가범위도 그 공고의 것을 씁니다 — ±2% 공고에 ±3% 를 쓰면
       5억 공고 기준 115만원이 어긋납니다(실측 106건 중앙값). */
    const rLo = res.lo != null ? res.lo : -3
    const rHi = res.hi != null ? res.hi : 3
    const rSd = sjSigma(rLo, rHi, res.ptot, res.pdrw)
    // 기초금액: 실려 있으면 그걸, 없으면 예정가격에서 중앙 사정률로 되짚습니다
    /* ⚠️ 기초금액이 안 실려 온 공고에서는 사정률을 되짚을 수 없습니다.
       예전에는 중앙값으로 기초금액을 만들어 놓고 «사정률 99.896% 로 정해졌습니다» 라고
       화면에 단정했습니다. 그건 거짓입니다. 모르면 모른다고 해야 합니다. */
    const hasBase = res.base > 0
    const b = hasBase ? res.base : Math.round(yeje / (sjmid / 100))
    /* ★ 2026-09-03 소장님: 「바로투찰하고 1순위 채점에서 권장투찰가 금액이 달라.」
       원인 ①: 채점은 낙찰하한율을 «규모로 추정»만 했고, 공고서에 적힌 하한율을 안 봤습니다.
       공고 화면(바로투찰)은 공고서 값을 먼저 씁니다. 실측 6,212건 중 128건(2.1%)이
       규모 추정과 다르고(87.675 · 87.995 · 86.245 …), 최대 3.7% 어긋납니다.
       → 공고 화면과 같은 순서: 공고서 하한율(60~100 만 믿음) → 없으면 규모 추정.
       추정가격도 공고가 준 값이 있으면 그걸로 규모를 정합니다. */
    const est = res.est > 0 ? res.est : Math.round(b / 1.1)
    const bd = (ov?.bands || []).find(
      (x) => est >= x.min && (x.max == null || est < x.max)) || null
    const givenH = (res.llr >= 60 && res.llr <= 100) ? res.llr : 0
    const h = givenH || (bd ? bd.llr : null)
    if (h == null) return { yeje, est, band: bd, skip: true }

    const realA = res.ayn === 'N' ? 0 : (res.aval || 0)
    const guess = !realA && res.ayn !== 'N'
    const st = bstatOf(bd)
    const A = realA || (guess && st ? Math.round(b * st.ar) : 0)

    /* ★ 추천 화면과 «같은 함수» 로 금액을 만듭니다 */
    const ro = recommend({ base: b, llRate: h, aVal: A,
                           aKnown: res.ayn === 'N' || (res.aval || 0) > 0,
                           p50: ov?.sjq?.p50 ?? P50_FALLBACK, sd: rSd })
    if (!ro) return { yeje, est, band: bd, skip: true }
    const sj95v = ro.sj
    /* 원인 ②: 채점은 recommend() 의 금액을 그대로 썼는데, 바로투찰 화면은 그 금액을
       투찰률(소수 3자리 **올림**)로 바꿨다가 다시 금액으로 만듭니다 — 사용자가 복사해 가는
       금액은 뒤엣것입니다. 실측 9,646건 전부 달랐고(중앙 475원, 최대 96만원).
       원클릭(quickBid)에서 2,354원이 어긋났던 것과 같은 함정입니다.
       → 채점도 같은 길을 갑니다: 금액 → c3(투찰률) → bidAmount. */
    const pmid = ov?.sjq?.p50 ?? P50_FALLBACK
    /* 예상 참가를 알던 공고면 그날 화면도 자동 분위였다 — 채점도 같은 금액(smartBid)으로 (2026-09-03) */
    const sb = smartBid({ base: b, llRate: h, aVal: A, aKnown: res.ayn === 'N' || (res.aval || 0) > 0,
                          p50: pmid, sd: rSd, enp: Number(res.enp) || 0 }) || { amt: shownBid(b, pmid, ro.amt).amt, mode: 'rec', rule: null }
    const M = sb.amt                                              // 바로투찰이 준 금액
    const L = Math.ceil((yeje - A) * (h / 100) + A)                // 실제 낙찰하한금액
    const dq = M < L
    const beat = !dq && M < res.amt

    /* ★ 세 금액을 «이 개찰»에 같이 대봅니다 — 2026-09-03
       소장님: 「채점하면 항상 권장보다 최저가 낙찰가에 더 가까워. 그럼 최저가 맞는 거 아니야?」
       맞습니다, 가깝습니다. 그런데 실측 802건(A·B)에서:
           최저  실격 47.1% · 1순위 3.74% · 살아남으면 7.08% · 차이 0.423% · 딴 금액  29.7억
           중간  실격 31.3% · 1순위 3.49% ·             5.08% · 차이 0.576% ·         21.9억
           권장  실격 10.5% · 1순위 4.99% ·             5.57% · 차이 0.883% ·        101.8억
       사정률은 투찰 «뒤에» 추첨됩니다. 최저는 사정률이 중앙보다 높게 나온 날 하한 아래로 떨어집니다 —
       정확히 반반. 실격한 날 낙찰가와의 거리는 0.4% 가 아니라 «그 자리에 없음» 입니다.
       그런데 채점 화면은 실격한 날에도 «가까웠다» 고 보여줘서 최저를 좋게 보이게 했습니다.
       그래서 세 금액의 «이 개찰에서의 운명»을 나란히 적습니다. */
    const lrMid = c3(limitRate(b, pmid, h, A))
    const three = [
      { k: '최저', amt: bidAmount(b, pmid, lrMid),            dq: 47.1, won: 29.7 },
      { k: '중간', amt: bidAmount(b, pmid, r3(lrMid + 0.3)),  dq: 31.3, won: 21.9 },
      { k: sb.mode === 'auto' ? `자동 ${sb.rule.q}분위` : '권장', amt: M, dq: 10.5, won: 101.8 },
    ].map((t) => {
      const isDq = t.amt < L
      return { ...t, isDq, beat: !isDq && t.amt < res.amt,
               gap: (t.amt - res.amt) / res.amt * 100 }
    })

    /* ── 「사정률이 이 값이었다면」 ─────────────────────────────
       투찰금액은 **하나만** 넣고, 사정률은 그 뒤에 추첨됩니다.
       그래서 우리 금액은 모든 줄이 같고, 하한(=낼 수 있었던 최저가)만 움직입니다.

       ⚠️ 후보를 «전국 사정률 10분위»로 쓰면 안 됩니다.
          전국 값에는 ±2% 공고와 ±3% 공고가 섞여 있어, ±2% 공고에서는
          있지도 않은 넓은 흔들림을 보여주게 됩니다.
          그래서 **그 공고 자신의 분포**(P50 + z×σ)로 만듭니다 — 추천이 쓰는 것과 같은 분포입니다.

       실측 958건에서 이 표는 «75분위까지 통과 · 90분위에서 실격» 로 갈립니다 —
       통과·실격은 실력이 아니라 그날 추첨이 정합니다. 그걸 숨기지 않습니다. */
    /* 이번 개찰에서 실제로 나온 사정률도 같은 표에 끼워 넣습니다 —
       «비슷한 줄»을 가리키게 두면 숫자가 미묘하게 어긋나 사람을 헷갈리게 합니다. */
    /* ★ «우리 금액이면 몇 위였나» — 2026-09-02부터 조달청 개찰 순위를 받아옵니다.
       공고번호로 물어야 나오는 오퍼레이션이라(getOpengResultListInfoOpengCompt)
       그동안 1순위만 있었습니다. 이제 유효 투찰 중 우리보다 낮은 금액을 셉니다.
       ⚠️ 하한 미만으로 쓴 업체는 실격이라 순위 경쟁 상대가 아닙니다. 빼고 셉니다. */
    /* ⚠️ 2026-09-03 바로잡음 — «유효 투찰 12곳 중 13위» 라는 말이 안 되는 문장이 떴습니다.
       851곳이 붙은 공고에서 «가장 낮게 쓴 12곳»만 들고 있었으니,
       우리 금액이 그 12곳보다 높다는 것만 알 뿐 13위인지 300위인지는 몰랐습니다.

       고침: 수집할 때 **순위 사다리**를 담습니다 — [[1위,금액],[2위,금액],…,[851위,금액]]
       중 열한 칸. 우리 금액이 어느 칸 사이에 떨어지는지 보면 등수를 좁힐 수 있습니다.
       사다리 없이 옛 자료뿐이면 «최소 N위»로만 말합니다. */
    const rq = (Array.isArray(res.rq) ? res.rq : [])
      .filter((x) => Array.isArray(x) && x[0] > 0 && x[1] > 0)
      .sort((x, y) => x[0] - y[0])
    /* ⚠️ 2026-09-03 — 사다리가 없는 «1순위» 개찰에서 아래 등수 칸이 「1순위가 아니었습니다 · 등수는
       알 수 없습니다」 를 띄웠습니다. 위에는 🏆 1순위, 아래에는 «아니었습니다». 소장님이 잡았습니다.
       원인: 등수 칸이 사다리(rq)가 있을 때만 1위를 말했고, 사다리가 없으면 «모른다» 로 떨어졌습니다.
       그런데 1순위 판정(beat)은 사다리와 무관합니다 — 하한을 넘기고 실제 1순위보다 낮으면 정의상 1위입니다.
       → beat 면 사다리가 있든 없든 1위.
       ⚠️ 그리고 사다리에는 **실격(하한 미만) 투찰도 들어 있습니다.** 400M·400.1M… 이 하한 아래면
       그건 등수 상대가 아닙니다. 사다리로 등수를 좁힐 때 하한 아래 칸 수(dqKnown)만큼 빼야 합니다.
       (검사 304번이 정확히 이 모양입니다: 50위까지가 전부 하한 아래 → «50~100위» 가 아니라 «2~50위») */
    let rankLo = null, rankHi = null, rankNote = ''
    if (!dq) {
      if (beat) {
        rankLo = 1; rankHi = 1
      } else if (rq.length) {
        const dqKnown = rq.filter((x) => x[1] < L).reduce((m, x) => Math.max(m, x[0]), 0)
        let lo = null, hi = null
        for (let i = 0; i < rq.length; i++) {
          if (M >= rq[i][1]) { lo = rq[i][0]; hi = rq[i + 1] ? rq[i + 1][0] : null }
        }
        if (lo == null) lo = 1
        rankLo = Math.max(2, lo - dqKnown)
        rankHi = hi == null ? null : Math.max(rankLo, hi - dqKnown)
        if (hi == null) rankNote = 'last'        // 사다리 끝보다도 높음 = 꼴찌권
      }
    }
    /* 사다리가 없는 옛 자료용 — 가장 낮게 쓴 몇 곳만 들고 있을 때 */
    const amts = Array.isArray(res.amts) ? res.amts.filter((v) => v > 0) : []
    const valid = amts.filter((v) => v >= L).sort((x, y) => x - y)
    const minRank = (!dq && !rq.length && valid.length)
      ? valid.filter((v) => v < M).length + 1 : null

    const realSj = hasBase ? r3(yeje / b * 100) : null
    const sc = buildScen({ base: b, llRate: h, aVal: A, p50: ov?.sjq?.p50 ?? P50_FALLBACK,
                           sd: rSd, myAmt: M, realSj, realLimit: L })
    const scen = sc ? sc.rows : []
    const passN = sc ? sc.passN : 0

    return {
      yeje, est, band: bd, base: b, hasBase, A, guess: guess && A > 0, h, sj95: sj95v,
      ourAmt: M, limitAmt: L,
      our: c3(M / yeje * 100),            // 우리 금액을 투찰률로 환산
      lim: c3(L / yeje * 100),            // 실효 낙찰하한 투찰률
      gapWon: res.amt - M,                // 1순위와의 금액 차이
      // 1순위보다 몇 % 높게 썼나 — 등수를 «모른다» 고 말할 때 근거로 씁니다
      gapPct: res.amt > 0 ? Math.round((M - res.amt) / res.amt * 1000) / 10 : null,
      dq, beat, scen, realSj, passN, sd: rSd, lo: rLo, hi: rHi, three,
      rankLo, rankHi, rankNote, minRank,
      nBid: valid.length, nAll: amts.length,
      nTotal: res.nrank || res.np || 0,
      pctile: sb.mode === 'auto' ? sb.rule.q : ro.pctile, margin: sb.mode === 'auto' ? 1 : ro.margin, autoRule: sb.mode === 'auto' ? sb.rule : null,
    }
  })()

  /* ⚠️ 채점 코드를 다시 쓰면서 이 두 줄이 같이 지워져 화면이 통째로 죽었습니다.
     (verifyMode is not defined) — 지우지 마세요. */
  const bstat = bs && band ? (bs.bands?.[band.key] || null) : null
  /* 채점 결과가 있고 아직 직접 계산을 펼치지 않았으면 «검증 화면» 입니다 */
  const verifyMode = !!res && !showCalc

  /* A값을 모르는 공고에서 A=0 으로 계산하면 하한을 낮게 잡아 실격합니다.
     그래서 같은 규모의 중앙 비율로 «추정 A값» 을 미리 채워 넣고, 추정이라고 밝힙니다.
     소장님이 공고서의 실제 값을 넣으면 그 즉시 그 값으로 바뀝니다. */
  /* 화면에 «(추정)» 을 붙일지 판단합니다 — aAuto 하나로 통일했습니다 */
  const aGuessed = aAuto && toNum(aIn) > 0
  useEffect(() => {
    if (!picked || picked.aval || picked.ayn === 'N') return
    if (!bstat?.ar || !(base > 0)) return
    if (aIn) return
    setAIn(String(Math.round(base * bstat.ar)))
    setAAuto(true)                 // 이건 «추정»입니다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picked, bstat, base])

  /* ⚠️ 2026-09-03 — 같은 공고인데 «채점»과 «직접 계산»이 다른 금액을 냈습니다.
       채점은 개찰 자료에서 A값 32,621,122원을 알고 75분위로 잡았고,
       직접 계산은 A값 칸이 비어 있어 «A값을 모른다» 로 보고 95분위로 잡았습니다.
       금액이 620,811,319 ↔ 621,509,664 로 갈렸습니다.
       계산은 둘 다 맞지만 **입력이 달랐던 것**입니다.
       개찰 자료가 A값을 알고 있으면 계산기 칸에도 그 값을 채워 줍니다. */
  const baseFromRes = useRef(false)
  useEffect(() => {
    if (baseFromRes.current || base > 0) return
    if (!res || !(res.base > 0)) return
    baseFromRes.current = true
    setBase(res.base)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [res])

  const aFromRes = useRef(false)
  useEffect(() => {
    if (aFromRes.current || aIn) return
    if (!res || !(res.aval > 0)) return
    aFromRes.current = true
    setAIn(String(res.aval))
    setAAuto(false)                // 개찰 자료의 «실제» A값입니다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [res])

  /* ★ 「이 공고, 해볼 만한가」 — 금액은 그대로 두고 «어디에 넣을지»만 말합니다.
     실측: 창(1순위가 하한 위에 뜬 폭)이 승률을 45배 가릅니다. 우리 오차는 어디서나 같습니다. */
  const grade = useMemo(() => winGrade(
    picked || (res && res.base > 0
      ? { base: res.base, est: 0, lo: res.lo, hi: res.hi, inst: res.inst, name: res.name }
      : (base > 0 ? { base, est: estimate, lo, hi, inst, name: q } : null))
  ), [picked, res, base, estimate, lo, hi, inst, q])

  const dd = picked ? dday(picked.close) : null
  const topMax = hot?.top?.length ? Math.max(...hot.top.map((t) => t[1])) : 1

  return (
    <>
      {/* ── 오늘의 기준 ──
          검증 화면에서는 «그 공고의 규모»를 기준으로 보여줍니다.
          위에서는 10억 미만이라 하고 아래 채점표는 10억~50억이라 하면 서로 어긋납니다. */}
      {hot?.mode != null && !verifyMode && !picked && (
        <div className="todaybar">
          <div>
            <div className="k">
              오늘의 기준 · {band ? `추정가격 ${band.label}` : '전국'}
              {' '}최근 {band ? band.win : hot.win}일
            </div>
            <div className="v">
              최빈 낙찰률 {pct(band ? band.mode : hot.mode, 1)}
              {band && <span className="n"> · {num(band.n)}건</span>}
            </div>
          </div>
          <div className="r">
            <div className="k">권장 투찰률</div>
            <div className="v big">{rec != null ? pct(rec, 2) : '—'}</div>
          </div>
        </div>
      )}

      {/* 100억 이상은 종합심사라 이 계산기가 통하지 않습니다 */}
      {band && band.rec == null && (
        <div className="alertbar">
          ⛔ <b>이 공고는 추정가격 100억 이상 — 종합심사 대상입니다.</b><br />
          낙찰하한율이 아니라 가격·공사수행능력·사회적책임을 함께 점수로 매기는 방식이라
          이 계산기가 통하지 않습니다. 공고서의 심사기준을 직접 보셔야 합니다.
        </div>
      )}
      {band && band.thin && band.rec != null && (
        <div className="alertbar">
          ⚠️ 이 규모({band.label})는 최근 {band.win}일 표본이 <b>{num(band.n)}건</b>뿐입니다.
          10억 미만 공사(수천 건)보다 근거가 얇으니 참고만 하세요.
        </div>
      )}

      {regime?.confirmed && (
        <div className="alertbar">
          ⚠️ <b>낙찰하한율 제도가 바뀐 것으로 보입니다.</b> 최근 30일 최빈이 직전보다
          {' '}{pct(regime.shift30, 1)} 움직였습니다. 좁은 창({ov?.hot14?.win}일)으로 계산 중이며,
          당분간 평소보다 정확도가 떨어질 수 있습니다.
        </div>
      )}

      {/* 검증(채점)하러 들어온 화면에서는 입력칸을 접습니다.
          1순위에서 넘어온 값만으로 판정이 끝나기 때문입니다. */}
      {verifyMode && scored && !scored.skip && (
        <div className="todaybar verify">
          <div>
            <div className="k">
              검증 기준 · 추정가격 {scored.band ? scored.band.label : '—'}
            </div>
            <div className="v">
              이 공고의 확정 예정가격 {won(scored.yeje)}
            </div>
            {/* «확정 예정가격»이 무엇인지 묻는 분이 계셨습니다 — 띠에서 바로 밝힙니다 */}
            <div className="sub">개찰 때 추첨으로 정해진 예정가격입니다. 투찰률의 분모입니다.</div>
          </div>
          {/* ★ 2026-09-03 — 여기에 «그때 권장했을 값 89.36%» 를 띄웠는데, 그 값은 «확정 예정가격»으로
              나눈 사후 투찰률이라 «권장했을 값»이 아니었습니다(권장은 예정가격을 모를 때 냅니다).
              그리고 아래 카드는 «실격»인데 위 띠는 숫자만 보여줘 «①보다 쌈»과 함께 읽혀 헷갈렸습니다.
              소장님: 「옆에는 실격이라 쓰고 1순위라고 쓰고… 이상해」 → 띠에는 판정 하나만. */}
          <div className="r">
            <div className="k">바로투찰 채점</div>
            <div className="v big">
              {scored.dq ? '⛔ 실격' : scored.beat ? '🏆 1순위' : '📉 밀림'}
            </div>
            <div className="sub">
              우리 투찰률 {pct(scored.our, 3)} · 1순위 {res.rate != null ? pct(res.rate, 3) : '—'}
            </div>
          </div>
        </div>
      )}

      {verifyMode && (
        <button className="btn ghost sm calctoggle" onClick={() => setShowCalc(true)}>
          ✏️ 이 공고로 직접 계산해 보기 (기초금액·A값 넣기)
        </button>
      )}

      {!verifyMode && (
      <>
      {/* ── 1. 공고 찾기 ── */}
      <div className="card">
        <div className="field">
          <label>
            공고 찾기
            <span className="hint">— 공고명 · 발주기관 · 공고번호. 기초금액을 바로 넣어도 됩니다</span>
          </label>
          <div className="searchwrap">
            <span className="ico">🔍</span>
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPicked(null); setCopied(false) }}
              placeholder={idx === undefined ? '공고를 불러오는 중…' : '예: 도로포장 / 안동시 / 285000000'} />
            {q && <button className="x" onClick={clear} aria-label="지우기">×</button>}
          </div>
        </div>

        {!picked && !qIsAmount && hiddenCount > 0 && (
          <div className="hidenote">
            계산에 필요한 값이 빠진 공고 <b>{hiddenCount}건</b>은 감췄습니다.
            {' '}<button className="lnk" onClick={() => setOnlyReady(false)}>그래도 보기</button>
          </div>
        )}
        {!picked && !qIsAmount && !onlyReady && (
          <div className="hidenote">
            지금 <b>전부</b> 보고 있습니다.
            {' '}<button className="lnk" onClick={() => setOnlyReady(true)}>계산 가능한 것만 보기</button>
          </div>
        )}

        {!picked && !qIsAmount && hits.length > 0 && (
          <div className="picklist">
            {hits.map((r) => {
              const d = dday(r.close)
              return (
                <button key={r.no} className="pickrow" onClick={() => pick(r)}>
                  <div className="grow">
                    <div className="t">{r.name}</div>
                    <div className="d">
                      {r.inst} · 마감 {dateTime(r.close)}
                      {r.base > 0
                        ? <> · <b className="money">기초 {wonShort(r.base)}</b></>
                        : <> · <span className="muted">기초금액 미공개</span></>}
                      {!isReady(r) && (
                        <> · <span className="nogo">계산 불가 — {missingOf(r).join('·')} 없음</span></>
                      )}
                    </div>
                    {(r.lic || []).length > 0 && (
                      <div className="lics">
                        {r.lic.slice(0, 3).map((L) => <span key={L} className="lic">{L}</span>)}
                        {r.lic.length > 3 && <span className="lic more">+{r.lic.length - 3}</span>}
                      </div>
                    )}
                  </div>
                  {d && <span className={'badge ' + d.tone}>{d.text}</span>}
                </button>
              )
            })}
          </div>
        )}

        {!picked && !qIsAmount && q.trim().length >= 2 && hits.length === 0 && idx !== undefined && (
          <div className="hintbox">
            마감 전 공사 공고 중에는 없습니다. <b>공고서의 기초금액을 그대로 넣으면</b> 바로 계산됩니다.
          </div>
        )}

        {picked && (
          <div className="pickedbar">
            <div className="grow">
              <div className="t">{picked.name}</div>
              <div className="d">{picked.inst} · 마감 {dateTime(picked.close)}</div>
              {(picked.lic || []).length > 0 && (
                <div className="lics">
                  {picked.lic.map((L) => <span key={L} className="lic on">{L}</span>)}
                </div>
              )}
            </div>
            {dd && <span className={'badge ' + dd.tone}>{dd.text}</span>}
          </div>
        )}

        {/* 나라장터 링크는 기초금액이 없어도 늘 보이게 둡니다.
            결과 카드 안에만 넣었더니 «버튼이 없어졌다» 는 이야기가 나왔습니다.
            주소는 조달청이 준 것(bidNtceDtlUrl)을 그대로 씁니다 — 차수를 손으로
            만들면 001·002 공고에서 엉뚱한 곳으로 갑니다. */}
        {picked && (
          <div className="picklinks">
            <a className="btn ghost sm" target="_blank" rel="noreferrer"
              href={picked.url || 'https://www.g2b.go.kr'}>
              나라장터에서 이 공고 열기 ↗
            </a>
            <button className="btn ghost sm" onClick={clear}>지우기</button>
          </div>
        )}
      </div>

      {/* 완비가 아닌 공고를 (링크 등으로) 고른 경우 — 금액을 내지 않습니다.
          반쯤 아는 값으로 금액을 내미는 것보다 «모른다» 가 낫습니다. */}
      {picked && !isReady(picked) && (
        <div className="warnbox nogobox">
          <div className="h">⛔ 이 공고는 아직 계산할 수 없습니다</div>
          <p>
            금액을 내려면 아래가 다 있어야 하는데, <b>{missingOf(picked).join(' · ')}</b> 이(가)
            조달청 자료에 아직 안 실려 왔습니다. 없는 값을 추측해서 금액을 내면
            <b> 수천만원이 어긋납니다.</b> 그래서 답을 내지 않겠습니다.
          </p>
          <div className="needlist">
            {[['기초금액', picked.base > 0],
              ['낙찰하한율', Number(picked.llr) >= 60 && Number(picked.llr) <= 100],
              ['A값', picked.aval > 0 || picked.ayn === 'N'],
              ['예비가격 정보', picked.ptot > 0 && picked.pdrw > 0]].map(([nm, ok]) => (
              <span key={nm} className={ok ? 'yes' : 'no'}>{ok ? '✓' : '✕'} {nm}</span>
            ))}
          </div>
          <p className="last">
            보통 <b>기초금액이 공개되면</b> 나머지도 같이 들어옵니다. 30분마다 다시 받아오니
            조금 뒤에 열어보시거나, 아래 «나라장터 공고» 에서 직접 확인하세요.
          </p>
          {picked.url && (
            <a className="btn ghost sm" style={{ width: '100%', marginTop: 8 }}
              href={picked.url} target="_blank" rel="noreferrer">나라장터에서 이 공고 열기 ↗</a>
          )}
        </div>
      )}

      {/* ── 2. 숫자 ── */}
      {picked && !editIn ? (
        /* 자동으로 다 채워졌습니다 — 한 줄로 요약하고 접어 둡니다 */
        <button className="inbrief" onClick={() => setEditIn(true)}>
          <span className="k">공고에서 자동으로 가져왔습니다</span>
          <span className="v">
            기초 {wonShort(base)}
            {' · '}예가 {lo}%~{hi}%
            {a > 0 ? ` · A값 ${wonShort(a)}` : (picked.ayn === 'N' ? ' · A값 없음' : '')}
          </span>
          <span className="e">값 고치기 ▾</span>
        </button>
      ) : (
      <div className="card">
        <div className="detail-h">
          투찰 조건
          {picked ? <span className="count">· 공고에서 자동으로 가져왔습니다</span>
            : <span className="count">· 기초금액만 넣으면 나머지는 자동입니다</span>}
          {picked && (
            <button className="minish" onClick={() => setEditIn(false)}>접기 ▲</button>
          )}
        </div>

        <div className="field">
          <label>기초금액 (원)</label>
          <input inputMode="numeric" className="big"
            value={base ? base.toLocaleString('ko-KR') : ''}
            onChange={(e) => { setBase(toNum(e.target.value)); setCopied(false) }}
            placeholder="예: 285,000,000" />
        </div>

        <div className="two">
          <div className="field">
            <label>추정가격 (원) <span className="hint">— 비우면 자동</span></label>
            <input inputMode="numeric"
              value={budgetIn ? Number(budgetIn).toLocaleString('ko-KR') : ''}
              onChange={(e) => setBudgetIn(digits(e.target.value))}
              placeholder={estimate ? estimate.toLocaleString('ko-KR') : '자동'} />
          </div>
          <div className="field">
            <label>예가범위 <span className="hint">— 공고 기준</span></label>
            <input value={base ? `${lo}% ~ ${hi}%` : ''} readOnly placeholder="자동" />
          </div>
        </div>

        <div className="field">
          <label>A값 (원) <span className="hint">
            {aGuessed
              ? '— 같은 규모 중앙값으로 넣은 추정값입니다. 공고서 값으로 바꿔주세요'
              : '— 사회보험료 등 법정경비'}
          </span></label>
          <input inputMode="numeric"
            value={aIn ? Number(aIn).toLocaleString('ko-KR') : ''}
            onChange={(e) => { setAIn(digits(e.target.value)); setAAuto(false); setCopied(false) }}
            placeholder="0" />
          {((picked && apMap && apMap[picked.no]) || []).length > 0 ? (
            <div className="aparts">
              <div className="h">
                공고에서 자동으로 가져온 A값 내역
                {picked.ayn === 'N' && <span className="no"> · 이 공고는 A값 미적용</span>}
              </div>
              {apMap[picked.no].map(([nm, v]) => (
                <div className="ap" key={nm}><span>{nm}</span><b>{won(v)}</b></div>
              ))}
              <div className="ap sum"><span>합계</span><b>{won(picked.aval)}</b></div>
            </div>
          ) : (
            <div className="note sm">
              A값은 투찰률을 곱하지 않고 <b>그대로 더하는</b> 금액입니다.
              산업안전보건관리비 · 국민건강보험료 · 국민연금 · 노인장기요양보험료 ·
              퇴직공제부금 같은 법정경비가 여기 들어갑니다.<br />
              <b>공고에 A값이 실려 오면 자동으로 채워집니다.</b>
              아직 안 채워졌다면 기초금액이 공개되기 전이거나 A값이 없는 공고입니다.
              {bstat?.ar > 0 && base > 0 && (
                <div className="aguess">
                  <div className="g1">
                    같은 규모 공고 {num(bstat.arN)}건의 A값은 기초금액의
                    {' '}<b>{(bstat.ar * 100).toFixed(1)}%</b> 언저리였습니다.
                  </div>
                  <button className="btn ghost sm"
                    onClick={() => { setAIn(String(Math.round(base * bstat.ar))); setAAuto(true) }}>
                    추정 A값 {won(Math.round(base * bstat.ar))} 넣어보기
                  </button>
                  <div className="g2">
                    <b>추정치입니다.</b> 실제 투찰 전에는 공고서 산출내역서의 값을 꼭 확인하세요.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      )}

      </>
      )}

      {/* ── 개찰 결과 채점 — 우리 말이 맞았는지 그 자리에서 봅니다 ── */}
      {res && (
        <div className={'scored ' + (scored?.dq ? 'dq' : scored?.beat ? 'win' : 'lose')}>
          <div className="sh">
            <span className="ic">{scored?.dq ? '⛔' : scored?.beat ? '🏆' : '📉'}</span>
            <span>
              {scored?.dq ? '바로투찰 금액이었으면 실격이었을 자리'
                : scored?.beat ? '바로투찰 금액이었으면 1순위였을 자리'
                : scored ? '바로투찰 금액이었으면 밀렸을 자리 (실격은 아님)'
                : '개찰 끝난 공고입니다'}
            </span>
            <span className="dt">{String(res.dt).slice(0, 16)}</span>
          </div>
          {(res.name || res.inst) && (
            <div className="stitle">
              <b>{res.name}</b>
              <span>{res.inst}{res.no ? ` · ${res.no}` : ''}</span>
            </div>
          )}
          <div className="srow">
            <div className="s1">
              <span className="k">① 실제 1순위가 쓴 금액</span>
              <b className="nm">{won(res.amt)}</b>
              <span className="v">{res.win || '—'} · {res.rate != null ? pct(res.rate, 3) : '—'}</span>
            </div>
            <div className="s1">
              <span className="k">② 바로투찰이 냈을 금액</span>
              <b className="nm">{scored?.ourAmt ? won(scored.ourAmt) : '—'}</b>
              {/* ⚠️ 전에는 «②−① = −781만 (①보다 쌈)» 만 적어서, 실격인 개찰에서도 «우리가 더 쌌다 = 이겼다»
                  로 읽혔습니다. 싼 것과 이기는 것은 다릅니다 — 하한 아래면 싼 게 아니라 «없는 금액»입니다.
                  그래서 이 칸은 판정과 그 이유를 같이 적습니다. */}
              <span className="v">
                {!scored ? '' : scored.dq
                  ? `③보다 ${wonShort(scored.limitAmt - scored.ourAmt)} 모자람 → 실격`
                  : scored.beat
                    ? `③은 넘기고 ①보다 ${wonShort(scored.gapWon)} 낮음 → 1순위`
                    : `③은 넘겼지만 ①보다 ${wonShort(-scored.gapWon)} 높음 → 밀림`}
              </span>
            </div>
            <div className="s1">
              <span className="k">③ 실제 낙찰하한</span>
              <b className="nm">{scored?.limitAmt ? won(scored.limitAmt) : '—'}</b>
              <span className="v">이 밑이면 실격 · 사정률 {scored?.hasBase ? (scored.yeje / scored.base * 100).toFixed(3) + '%' : '—'}</span>
            </div>
          </div>

          {/* ★ 「최저가 더 가까운데 왜 권장이냐」 — 세 금액의 이 개찰에서의 운명 */}
          {scored?.three && (
            <div className="threebox">
              <div className="h">이 개찰에 세 금액을 넣었다면</div>
              <table className="threetbl">
                <thead><tr><th>금액</th><th>넣었을 금액</th><th>1순위와</th><th>결과</th></tr></thead>
                <tbody>
                  {scored.three.map((t) => (
                    <tr key={t.k} className={t.k !== '최저' && t.k !== '중간' ? 'rec' : ''}>
                      <td><b>{t.k}</b></td>
                      <td className="n">{won(t.amt)}</td>
                      <td className="n">{t.gap >= 0 ? '+' : ''}{t.gap.toFixed(3)}%</td>
                      <td className={t.isDq ? 'bad' : t.beat ? 'good' : 'mid'}>
                        {t.isDq ? '실격' : t.beat ? '1순위' : '밀림'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* 소장님: 「802건에서 딴 금액이 최저 29.7억… 이런 말이 필요해?」 — 뺐습니다.
                  실측 근거는 CLAUDE.md(⚖️ 절)에 있습니다. 화면엔 한 줄만. */}
              <div className="why">최저·중간은 사정률이 높게 나온 날 하한 아래로 떨어집니다(실측 절반). 그래서 권장을 씁니다.</div>
            </div>
          )}

          {/* ★ 실제 투찰 순위와 견줍니다 — 조달청 개찰 순위를 받아온 공고만 나옵니다 */}
          {/* ★ 실제 투찰 순위와 견줍니다 — 순위 사다리를 받아온 공고만 나옵니다 */}
          {/* 실격이 아니면 항상 그립니다 — 등수 자료가 없어도 «모른다» 는 말할 수 있고,
              그게 «최소 2위» 보다 정직합니다. */}
          {scored && !scored.dq && (
            <div className="myrank">
              {scored.rankLo === 1 && scored.rankHi === 1 ? (
                <>바로투찰 금액으로 넣었으면 <b>1위</b>였습니다
                  <span className="sub"> · 실제 1순위보다 낮게 들어갔습니다</span></>
              ) : scored.rankNote === 'last' ? (
                <>바로투찰 금액으로 넣었으면 <b>{num(scored.rankLo)}위 아래</b>였습니다
                  <span className="sub">
                    {' '}· 투찰한 {num(scored.nTotal)}곳 중 거의 꼴찌권입니다
                  </span></>
              ) : scored.rankHi != null ? (
                <>바로투찰 금액으로 넣었으면
                  {' '}<b>{num(scored.rankLo)}위 ~ {num(scored.rankHi)}위</b> 사이였습니다
                  <span className="sub">
                    {' '}· 투찰한 {num(scored.nTotal)}곳 중.
                    {' '}전송량 때문에 전 구간을 «사다리»로만 들고 있어 이만큼까지 좁혔습니다.
                  </span></>
              ) : (
                /* ★ 2026-09-03 — 소장님: 「바로투찰이라면 최소 2위라는 게 말이 돼?」
                   말이 안 됩니다. 여기 오는 건 **순위 자료가 1순위 한 곳뿐일 때** 입니다.
                   우리가 1순위보다 높으니 «낮게 쓴 곳이 1곳 이상» → 산술적으로 «최소 2위».
                   맞는 말이긴 한데, 92곳이 붙은 공고에서 이건 정보가 아니라 착시입니다.
                   화면은 «2위 했다» 로 읽힙니다. 「유효 12곳 중 13위」와 같은 종류의 잘못입니다.

                   → 등수를 말하지 않습니다. 아는 것만 말합니다.
                     대신 실측 하나를 붙입니다: 순위 사다리를 받아 둔 54건에서
                     **1순위보다 0.5%만 높게 써도 등수 중앙이 20위**였습니다(4분위 5~50위).
                     표본이 적다는 것도 같이 적습니다. */
                <>바로투찰 금액은 <b>1순위가 아니었습니다</b>
                  <span className="sub">
                    {' '}· 실격은 면했지만 이 자리는 못 가져갑니다.
                    {' '}<b>등수는 알 수 없습니다</b> — 조달청 순위 자료가 이 공고엔 아직 안 왔고,
                    {' '}우리가 가진 건 1순위 금액 하나뿐입니다.
                    {scored.gapPct != null && scored.gapPct > 0 && (
                      <> 참고로 순위를 받아 둔 54건에서는, 1순위보다 <b>0.5%</b>만 높게 써도
                        {' '}등수 중앙이 <b>20위</b>였습니다. 이 금액은 1순위보다
                        {' '}<b>{scored.gapPct}%</b> 높습니다. (표본이 아직 적습니다)</>
                    )}
                  </span></>
              )}
            </div>
          )}

          {(res.tel || res.ceo || res.bno || res.adr) ? (
            <div className="wcard">
              <div className="wh">🏢 1순위 업체</div>
              <div className="wn">{res.win}</div>
              <div className="wk">
                {res.ceo && <div><span>대표자</span><b>{res.ceo}</b></div>}
                {res.bno && (
                  <div><span>사업자</span>
                    <b>{res.bno.slice(0, 3)}-{res.bno.slice(3, 5)}-{res.bno.slice(5)}</b></div>
                )}
                {res.adr && (
                  <div className="wide"><span>주소</span>
                    <b>{res.adr}{res.tsrc ? <i className="tsrc">다른 공고에서 확인</i> : null}</b></div>
                )}
              </div>
              {res.tel ? (
                <a className="wtel" href={`tel:${res.tel.replace(/[^0-9+]/g, '')}`}>
                  <span className="ic">📞</span>
                  <span className="t">{res.tel}</span>
                  <span className="d">눌러서 바로 걸기</span>
                </a>
              ) : (
                <div className="wno">이 공고에는 전화번호가 실려 오지 않았습니다.</div>
              )}
            </div>
          ) : (
            <div className="wno solo">
              {res.old
                ? '7일이 지난 개찰이라 연락처·대표자는 들고 있지 않습니다. 채점은 그대로 됩니다.'
                : '이 공고는 조달청이 낙찰업체 연락처를 함께 주지 않았습니다. (연락처가 실려 오는 공고는 대략 셋 중 하나입니다)'}
            </div>
          )}

          {scored && !scored.skip && (
            <div className="sv">
              {/* 2026-09-03 «전체적으로 다시 검토» — 설명 문단 셋(«확정 예정가격이란», «바로투찰은 사정률…»,
                  «✅ 같은 함수로 계산») 을 한 줄로 줄였습니다. 같은 말이 위 띠와 아래 표에 또 있었고,
                  «같은 코드를 씁니다» 는 개발자 말이지 투찰하는 사람 말이 아닙니다. */}
              <div className="base">
                {scored.hasBase
                  ? <>기초금액 {won(scored.base)} × 사정률 <b>{(scored.yeje / scored.base * 100).toFixed(3)}%</b> = 확정 예정가격 {won(scored.yeje)}</>
                  : <>확정 예정가격 {won(scored.yeje)} · <span className="unk">기초금액이 안 실려 와 사정률은 알 수 없습니다</span></>}
                <br />
                규모 {scored.band ? scored.band.label : '—'} · 하한율 {pct(scored.h, 3)}
                {scored.A > 0 && <> · A값 {won(scored.A)}{scored.guess ? '(추정)' : ''}</>}
                {' '}· 바로투찰 기준 사정률 {scored.sj95.toFixed(2)}%({scored.pctile}분위) · 여유 {((scored.margin - 1) * 100).toFixed(1)}%
              </div>
              {scored.dq ? (
                /* ⚠️ 2026-09-03 — «실격이었습니다» 에 주어가 없어서 낙찰자가 실격된 것처럼 읽혔습니다.
                   소장님: 「바로투찰에 의하면 실격인데 왜 낙찰된 거지?」
                   실격은 «바로투찰 금액»이고, 낙찰자는 우리보다 높게 써서 살아남은 것입니다. 그걸 한 줄에 다 씁니다. */
                <>⛔ <b>바로투찰 금액이었으면 실격이었습니다.</b> 우리 금액 {won(scored.ourAmt)}은
                  실제 낙찰하한 {won(scored.limitAmt)}보다 {wonShort(scored.limitAmt - scored.ourAmt)} 모자랍니다.
                  {' '}낙찰자({res.win || '1순위'})는 우리보다 <b>{won(res.amt - scored.ourAmt)} 높게</b> 써서
                  {' '}하한을 {wonShort(res.amt - scored.limitAmt)} 차이로 넘겼습니다 — 이날은 낮게 쓴 쪽이 다 실격하고
                  {' '}높게 쓴 쪽 중 가장 낮은 곳이 이긴 날입니다.</>
              ) : scored.beat ? (
                <>🏆 <b>1순위였을 자리입니다.</b> 바로투찰 금액({won(scored.ourAmt)})이
                  {' '}낙찰하한({won(scored.limitAmt)})을 넘기면서 실제 1순위({won(res.amt)})보다
                  {' '}<b>{won(scored.gapWon)} 낮게</b> 들어갔습니다 — 그만큼 싸게 따는 자리였습니다.</>
              ) : (
                <>📉 바로투찰 금액({won(scored.ourAmt)})이 실제 1순위({won(res.amt)})보다
                  {' '}<b>{won(-scored.gapWon)} 비싸서</b> 밀렸을 자리입니다.
                  {' '}실격은 아니었습니다 — 하한({won(scored.limitAmt)})은 넘겼습니다.</>
              )}
              {/* ★ 소장님: 「몇 번을 찍어서 무슨 값이 나올지 모르는데… 바로투찰이었으면 이랬을 것이다도 틀린 거잖아」
                  맞습니다. 이 채점은 «그날 나온 예정가격이 그대로였다면» 의 가정입니다. 그걸 화면에 적습니다. */}
              <div className="cav">
                ⚠️ 이 채점은 <b>그날 나온 예정가격이 그대로였다면</b>의 가정입니다. 우리가 실제로 참가했다면 우리가 찍은
                추첨번호 2개가 집계에 더해져 «가장 많이 찍힌 4개»가 바뀌고, 예정가격·하한이 달라졌을 수 있습니다
                {scored.nTotal > 0 && <> (참가 {num(scored.nTotal)}곳이면 {num(scored.nTotal * 2)}표 중 2표)</>}.
                번호에 어떤 예비가격이 붙는지는 무작위라 유리했을지 불리했을지는 아무도 모릅니다 — 참가가 적을수록 그 흔들림이 큽니다.
              </div>
              {(!scored.hasBase || scored.guess) && (
                <div className="cav">
                  {!scored.hasBase && '기초금액이 안 실려 와 사정률을 되짚지 못했습니다. '}
                  {scored.guess && 'A값이 추정치라 하한 판정에 오차가 있을 수 있습니다.'}
                </div>
              )}

              {/* ── 「사정률이 이 값이었다면」 ────────────────────
                  하나의 금액만 실제 낙찰가와 대보면 «운»을 «실력»으로 오해합니다.
                  ★ 이 표는 앞으로 넣을 공고(추천 화면)에서 쓰는 것과 **같은 표**입니다. */}
              <ScenTable sc={{ rows: scored.scen, passN: scored.passN }}
                amtLabel="우리 금액" pctile={scored.pctile} realNote="이번 개찰" />

            </div>
          )}
        </div>
      )}

      {/* ── 가상 시뮬레이션 — 지난 개찰에 우리 방식을 대본 결과 ── */}
      {bt && base <= 0 && <SimBlock bt={bt} open={btOpen} setOpen={setBtOpen} />}

      {/* 종합심사 대상이면 계산을 아예 하지 않습니다. 0원을 보여주는 건 사고입니다. */}
      {picked && !isReady(picked) ? null : base > 0 && band && band.rec == null ? (
        <div className="card c-stop">
          <div className="detail-h">이 공고는 계산기를 쓰면 안 됩니다</div>
          <div className="kv2">
            <div><span>기초금액</span><b>{won(base)}</b></div>
            <div><span>추정가격</span><b>{won(estimate)}</b></div>
            <div><span>낙찰방법</span><b>종합심사낙찰제 (추정가격 100억 이상)</b></div>
          </div>
          <div className="note sm">
            종합심사는 가격만으로 낙찰자를 정하지 않습니다.
            공사수행능력·사회적책임·가격을 함께 점수로 매기고, 발주기관마다 세부 기준이 다릅니다.
            <b> 공고서의 심사기준을 직접 보셔야 합니다.</b>
            {picked?.url && (
              <>
                <br />
                <a href={picked.url} target="_blank" rel="noreferrer"
                  style={{ color: 'var(--accent)', fontWeight: 800 }}>
                  나라장터에서 공고서 열기 ↗
                </a>
              </>
            )}
          </div>
        </div>
      ) : base <= 0 ? (
        verifyMode ? null : (
        <div className="hintbox">
          {picked ? (
            <>
              <b>이 공고는 아직 기초금액이 공개되지 않았습니다.</b><br />
              발주기관이 공개하면 자동으로 채워집니다. 공고서에 이미 나와 있다면
              위 «기초금액» 칸에 넣어주세요 — 그 즉시 투찰금액이 나옵니다.
            </>
          ) : (
            <>위에서 공고를 고르거나 기초금액을 넣으면 <b>투찰금액이 바로 나옵니다.</b></>
          )}
        </div>
        )
      ) : (
        <>
          {/* ── 3. 결과 ── */}
          <div className={'hero ' + (pass === false ? 'bad' : '')}>
            <div className="sjline">
              <span className="lab">분석 사정률</span>
              <span className="val">{sjMid.toFixed(4)}%</span>
            </div>
            <div className="tag">{chosen?.label === '권장' ? '권장 투찰금액' : '투찰금액'}</div>
            <div className="amt">
              {String(main).replace(/\B(?=(\d{3})+(?!\d))/g, ',').split('').map((ch, i) => (
                <span key={i} className={ch === ',' ? 'sep' : 'dg'}>{ch}</span>
              ))}
              <span className="won">원</span>
            </div>
            <div className="sub">
              투찰률 {pct(myRate, 3)} · 예정가격 {won(Math.round(base * (sjMid / 100)))}
            </div>
            <div className="range">사정률에 따라 {wonShort(bandLo)} ~ {wonShort(bandHi)}</div>
            {pickRate === 'rec' && rec95 != null && (
              <div className="why95">
                사정률 {sj95?.toFixed(2)}% 에서도 낙찰하한을 넘도록 잡은 금액입니다
                {aKnown
                  ? ' · 이 공고는 A값이 확인돼 더 바짝 붙였습니다 (역검증 승률 13.2%)'
                  : ' · A값이 확인 안 돼 안전하게 잡았습니다'}
              </div>
            )}
            <div className="hbtns">
              <button className="cbtn" onClick={copy}>
                {copied ? '✓ 복사했습니다' : '금액 복사'}
              </button>
              {/* ⚠️ 주소를 손으로 만들지 않습니다.
                  차수(000/001/002)를 틀리면 엉뚱한 공고로 갑니다 — 실제로 틀렸었습니다.
                  조달청이 준 주소(bidNtceDtlUrl)를 그대로 씁니다.
                  그리고 이 링크는 «투찰» 화면이 아니라 «공고 상세» 입니다.
                  진짜 투찰은 나라장터 로그인과 보안토큰이 있어야 해서 링크로 못 갑니다. */}
              <a className="cbtn ghost" target="_blank" rel="noreferrer"
                href={picked?.url || 'https://www.g2b.go.kr'}>
                나라장터 공고 →
              </a>
            </div>
          </div>

          {/* 투찰 바로가기.
              나라장터는 화면이 바뀌어도 주소가 안 바뀌는 구조라 «투찰 화면» 딥링크가 없습니다.
              그래서 나라장터 입구로 보냅니다 — 로그인하면 거기가 곧 투찰 화면입니다.
              설명을 길게 늘어놓지 않습니다. 버튼 하나면 됩니다. */}
          <a className="gobid" href="https://www.g2b.go.kr" target="_blank" rel="noreferrer">
            <span className="t">🔐 나라장터 투찰 바로가기</span>
            <span className="d">로그인 후 이 공고에서 입찰서를 제출하세요</span>
          </a>

          {/* ── 분석 정보 ── */}
          
          {/* 투찰률 고르기 */}
          <div className="ratepick">
            {choices.map((c) => (
              <button key={c.k}
                className={(pickRate === c.k ? 'on' : '')
                  + (llEff && c.rate < llEff ? ' warn' : '')}
                onClick={() => { rateTouched.current = true; setPickRate(c.k); setCopied(false) }}>
                <b>{c.label}</b><span>{c.rate.toFixed(3)}%</span>
              </button>
            ))}
            <button className={pickRate === 'own' ? 'on' : ''}
              onClick={() => { rateTouched.current = true; setPickRate('own') }}>
              <b>직접</b><span>입력</span>
            </button>
          </div>
          {qchoices.length > 0 && (
            <div className="qdial">
              <div className="qh">
                사정률 분위를 직접 고르기
                <i>낮을수록 싸게 넣지만 실격이 잦고, 높을수록 안전하지만 낙찰가와 멀어집니다. 권장 = 75분위 + 여유 0.3%.</i>
              </div>
              <div className="ratepick q">
                {qchoices.map((c) => (
                  <button key={c.k}
                    className={(pickRate === c.k ? 'on' : '') + (llEff && c.rate < llEff ? ' warn' : '')}
                    onClick={() => {
                      rateTouched.current = true; setPickRate(c.k); setCopied(false)
                      try { localStorage.setItem('kcm_qtile', String(c.q)) } catch { /* noop */ }
                    }}>
                    <b>{c.label}</b><span>{c.rate.toFixed(3)}%</span>
                    <i>실격 {c.dq}% · 1순위 {c.win}%</i>
                  </button>
                ))}
              </div>
              <div className="note sm">
                칸 안의 실격·1순위는 실제 개찰 {num(QTILE_N)}건에 그 분위 금액을 넣어 본 실측입니다.
                어느 분위든 1순위율은 3.6~4.4% — 분위는 «얼마나 자주 살아남나»를 정하지 «얼마나 자주 이기나»는 못 바꿉니다.
                {pickRate.startsWith('q') && <> 고른 분위는 이 브라우저에 기억됩니다 · <a onClick={() => { try { localStorage.removeItem('kcm_qtile') } catch { /* noop */ } setPickRate('rec') }}>권장으로 되돌리기</a></>}
              </div>
            </div>
          )}
          {pickRate === 'own' && (
            <div className="card" style={{ marginTop: 0 }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>내 투찰률 (%)</label>
                <input inputMode="decimal" value={ownRate} autoFocus
                  onChange={(e) => { setOwnRate(e.target.value.replace(/[^0-9.]/g, '')); setCopied(false) }}
                  placeholder={rec ? String(rec) : '90.1'} />
              </div>
            </div>
          )}

          {pickRate === 'auto' && aRule && (
            <div className="autobox">
              <div className="h">🎯 이 공고는 <b>{aRule.q}분위</b>로 넣습니다 — 예상 참가 <b>{num(enpHere)}곳</b>
                <i>이 기관 최근 개찰 {num(enpN)}건의 참가업체수 중앙</i></div>
              <p>
                같은 자리(참가 {aRule.maxNp === 10 ? '2~9' : '10~29'}곳, 실측 {num(aRule.n)}건)에서 {aRule.q}분위 금액이
                <b> 1순위 {aRule.win}%</b>(실격 {aRule.dq}%)로, 권장 {aRule.recWin}%(실격 {aRule.recDq}%)보다 더 이겼습니다.
                {aRule.maxNp === 30 && <> 대신 실격이 네 번 중 한 번 더 납니다 — 한 건이 급하면 이쪽, 실격이 싫으면 권장.</>}
                {' '}차이는 오차 범위 안팎이라 «확실한 우위»가 아니라 «자료가 이쪽을 가리킨다» 정도입니다.
                참가가 30곳을 넘는 자리에서는 권장이 가장 좋았습니다.
              </p>
            </div>
          )}
          {recBelow && (
            <div className="warnbox">
              <div className="h">⚠️ 이 공고는 전국 권장값으로 넣으면 실격입니다</div>
              <p>
                A값이 있어 <b>실효 낙찰하한이 {pct(llEff, 3)}</b> 인데,
                전국 권장은 {pct(rec, 3)} 입니다. 그래서 기본값을 <b>«하한»</b> 으로 옮겨 뒀습니다.
                낙찰자들은 이런 공고에서 하한 바로 위에 붙입니다.
              </p>
            </div>
          )}

          {/* ⚠️ 낙찰하한율이 공고에 안 실려 온 경우 (실측 45%).
              같은 규모라도 국가·공공기관은 2%p 낮은 옛 기준이 아직 남아 있습니다.
              10~50억 구간은 28%가 86.745% 입니다. 이걸 88.745% 로 찍으면
              10억 공고는 2,283만원, 50억 공고는 1억 1,413만원을 더 쓰게 됩니다.
              그래서 «모르면 모른다»고 하고, 두 경우 금액을 나란히 보여줍니다. */}
          {ll?.rate && !ll.given && (
            <div className="warnbox llrbox">
              <div className="h">⚠️ 이 공고에 낙찰하한율이 안 실려 왔습니다</div>
              <p>
                규모로 추정한 값 <b>{pct(ll.rate, 3)}</b> 을 썼습니다.
                그런데 같은 규모라도 국가·공공기관 공고는 <b>2%p 낮은 옛 기준</b>이
                남아 있습니다(10~50억 구간의 28%). 어느 쪽인지에 따라 금액이 이만큼 달라집니다.
              </p>
              <div className="kv">
                <div>
                  <span>{pct(ll.rate, 3)} 이면</span>
                  <b>{won(bidAmount(base, sjMid, myRate))}</b>
                </div>
                <div>
                  <span>{pct(ll.rate - 2, 3)} 이면</span>
                  <b className="hi">
                    {won(Math.ceil(limitAmount(base, sj95 ?? sjMid, ll.rate - 2, a)))}
                  </b>
                </div>
              </div>
              <p className="last">
                <b>공고서의 «낙찰자 결정방법»에서 낙찰하한율을 꼭 확인하세요.</b>
                기관 이력으로 맞히려고 해봤지만 실제로 맞은 건 16%뿐이라, 추측하지 않겠습니다.
              </p>
            </div>
          )}

          {/* 판정 */}
          {ll && (
            <div className={'verdict ' + (pass === false ? 'no' : pass ? 'ok' : '')}>
              {ll.rate == null ? (
                <>ℹ️ <b>100억 이상 종합심사</b> — 별도 기준이라 낙찰하한율을 적용하지 않습니다.</>
              ) : pass ? (
                <>✅ <b>사정률 중앙({sjMid.toFixed(3)}%) 기준 하한 {pct(llEff ?? ll.rate, 3)} 통과</b> · 여유 {margin.toFixed(3)}%p
                  {pp && <><br />사정률이 <b>{pp.sj.toFixed(3)}%</b> 를 넘게 나오면 실격 → 이 금액이 살아남을 확률 <b>약 {Math.round(pp.p * 100)}%</b></>}
                  {margin < 0.1 && <><br />여유가 거의 없습니다. 사정률이 조금만 높게 나와도 미달이 됩니다.</>}</>
              ) : (
                /* ⚠️ 2026-09-03 — 「이대로 넣으면 실격입니다」 라고 단정했었습니다. 소장님: 「실제로 실격인지는
                   결과를 봐야 알지」 — 맞습니다. 사정률이 중앙보다 낮게 나오면 이 금액도 통과합니다. 확률로 말합니다. */
                <>⚠️ <b>사정률 중앙({sjMid.toFixed(3)}%) 기준으로는 하한 {pct(llEff ?? ll.rate, 3)} 아래</b> · {Math.abs(margin).toFixed(3)}%p 부족
                  {pp && <><br />사정률이 <b>{pp.sj.toFixed(3)}%</b> 아래로 나오면 통과 → 이 금액이 살아남을 확률 <b>약 {Math.round(pp.p * 100)}%</b>
                    {' '}(실격 확률 약 {100 - Math.round(pp.p * 100)}%). 결과는 개찰 때 추첨이 정합니다.</>}</>
              )}
              <div className="sub">
                {a > 0 && llEff && (
                  <>공고 하한율 {pct(ll.rate, 3)} + A값 {won(a)} → 실효 하한 {pct(llEff, 3)}.
                    {' '}A값이 있으면 명목 하한율보다 높아집니다. · </>
                )}
                {ll.note}
                {ll.given ? ' · 이 공고에 실제로 적힌 값입니다.'
                  : ' · 일반공사 적격심사 기준으로 추정한 값입니다. 공고서를 꼭 확인하세요.'}
              </div>
            </div>
          )}

          {grade && (
            <div className={'odds ' + grade.tone}>
              <div className="oh">
                <span className="g">{grade.key}</span>
                <span className="l">이 공고는 <b>{grade.label}</b></span>
                <span className="w">지난 {num(grade.n)}건 승률 <b>{grade.win}%</b></span>
              </div>
              <p>{grade.say}</p>
              <div className="ox">
                {/* 왜 이 등급인지 — 사람이 확인할 수 있게 근거를 그대로 적습니다 */}
                실제 개찰 958건에서 <b>1순위가 낙찰하한 위에 뜬 폭</b>이 승률을 갈랐습니다.
                {' '}0.02% 미만이면 승률 0.3%, 0.3% 이상이면 13.6% — <b>45배</b> 차이입니다.
                {' '}그런데 우리 금액이 하한 위에 뜬 폭은 어느 쪽이든 0.9% 안팎으로 같았습니다.
                {' '}<b>승률을 가르는 건 우리 계산이 아니라 그 공고의 성격</b>이었습니다.
                {grade.win === 0 && (
                  <><br /><b>C·D 등급 156건에서는 한 건도 못 땄습니다.</b>
                    {' '}전체 승률이었다면 0건일 확률은 0.08%입니다.</>
                )}
              </div>
            </div>
          )}

          {/* ── 여기부터는 «근거» 입니다. 기본은 접어 둡니다. ── */}
          <button className={'whytoggle' + (showWhy ? ' on' : '')}
            onClick={() => setShowWhy(!showWhy)}>
            {showWhy ? '근거 접기 ▲' : '이 금액이 나온 근거 보기 ▾'}
            <i>경쟁 강도 · 공고 조건 · 사정률 분포 · 성적표 · 시뮬레이션</i>
          </button>

          {showWhy && (<>

{picked && (
            <div className="card c-info">
              <div className="detail-h">분석 정보</div>
              <div className="kv2">
                <div><span>공고명</span><b>{picked.name}</b></div>
                <div><span>발주처</span><b>{picked.inst}</b></div>
                <div><span>기초금액</span><b>{won(base)}</b></div>
                <div><span>추정가격</span><b>{won(estimate)}</b></div>
                <div><span>예가범위</span><b>+{hi}% ~ {lo}%</b></div>
                <div><span>공사 규모</span>
                  <b>{band ? band.label : '-'}{band?.rec == null ? ' · 종합심사' : ''}</b></div>
                <div><span>낙찰하한율</span>
                  <b>{ll?.rate ? pct(ll.rate, 3) : '별도 기준'}
                    {a > 0 && llEff ? <span className="sub2"> · 실효 {pct(llEff, 3)}</span> : null}</b></div>
                {ll?.rate > 0 && (
                  <div><span>하한 금액</span><b>{won(limitAmount(base, sjMid, ll.rate, a))}</b></div>
                )}
                <div><span>A값</span>
                  <b>{a > 0 ? won(a) : (picked.aval ? won(picked.aval) : '공고서 확인')}</b></div>
                {picked.gmtrl > 0 && (
                  <div><span>관급자재</span><b>{won(picked.gmtrl)}</b></div>
                )}
                {picked.ptot > 0 && (
                  <div><span>예비가격</span>
                    <b>{picked.ptot}개 중 {picked.pdrw}개 추첨 (복수예가)</b></div>
                )}
                <div><span>입찰마감</span><b>{dateTime(picked.close)}</b></div>
                {ag && <div><span>이 발주처 3년</span><b>{num(ag.n)}건 · 평균 {pct(ag.s?.avg, 3)}</b></div>}
              </div>
            </div>
          )}

          {bstat?.npMed > 0 && bstat.n >= 30 && (
            <div className="compet">
              {/* ⚠️ «보통 92개사» 옆에 «실제 851개사» 가 나란히 떠서
                     계산이 틀린 것처럼 보였습니다. 실제값이 있으면 그걸 앞세웁니다.
                     참가업체수는 한쪽으로 심하게 쏠린 분포라(중앙 92, 최대 9,675)
                     «보통»이라는 말이 오해를 부릅니다. */}
              <div className="ch">
                {res?.np > 0 ? (
                  <>이 공고에는 <b>{num(res.np)}개사</b>가 들어왔습니다
                    <i className="cmed">같은 규모 중앙값 {num(bstat.npMed)}개사</i></>
                ) : (
                  <>이 규모는 중앙값이 <b>{num(bstat.npMed)}개사</b>입니다</>
                )}
              </div>
              <div className="cscale">
                <span>{num(bstat.npLo)}</span>
                <div className="ctrack">
                  <i style={{ left: '25%', width: '50%' }} />
                  <em style={{ left: '50%' }} />
                  {res?.np > 0 && (
                    <u style={{
                      left: `${Math.max(2, Math.min(98,
                        (res.np / Math.max(bstat.npHi * 1.6, res.np)) * 100))}%`,
                    }} />
                  )}
                </div>
                <span>{num(bstat.npHi)}</span>
              </div>
              <div className="csub">
                {band?.label} · 최근 60일 개찰 {num(bstat.n)}건 기준 · 가운데 절반이
                {' '}{num(bstat.npLo)}~{num(bstat.npHi)}개사
                {bstat.n < 100 && <> · <b>표본이 얇으니 참고만</b></>}
                {res?.np > 0 && (
                  res.np > bstat.npHi
                    ? <> · <b>이 공고는 그 절반보다 훨씬 많습니다</b> (넷 중 하나는 {num(bstat.npHi)}개사 이상)</>
                    : res.np < bstat.npLo
                      ? <> · <b>이 공고는 그 절반보다 적습니다</b></>
                      : <> · 이 공고는 가운데 절반 안에 있습니다</>
                )}
              </div>
            </div>
          )}

          {picked && (
            <div className="card c-cond">
              <div className="detail-h">이 공고에 넣으려면</div>
              <div className="cond">
                <div className={'c' + (picked.rgnb ? ' warn' : '')}>
                  <span>지역</span>
                  <b>{picked.site || '—'}</b>
                  <i>{picked.rgnb ? `지역제한 · ${picked.rgnb} 기준` : '지역제한 없음'}</i>
                </div>
                <div className="c">
                  <span>계약방법</span>
                  <b>{picked.mthd || '—'}</b>
                  <i>{picked.mthd === '제한경쟁' ? '자격을 갖춘 곳만' : ' '}</i>
                </div>
                <div className="c">
                  <span>공동수급</span>
                  <b>{(picked.joint || '—').replace(/^\(전자\)/, '').replace(/^\(없음\)/, '')}</b>
                  <i>{/불허/.test(picked.joint || '') ? '단독으로만' : ' '}</i>
                </div>
                <div className={'c' + (picked.rebid === 'Y' ? ' warn' : '')}>
                  <span>재입찰</span>
                  <b>{picked.rebid === 'Y' ? '재입찰 공고' : '아니오'}</b>
                  <i>{picked.rebid === 'Y' ? '앞 회차가 유찰됐습니다' : ' '}</i>
                </div>
                {picked.swin && (
                  <div className="c wide">
                    <span>낙찰방법</span>
                    <b>{picked.swin.split('-')[0]}</b>
                    <i>{picked.swin.split('-').slice(1).join('-')}</i>
                  </div>
                )}
              </div>
              {(picked.lic || []).length > 0 ? (
                <>
                  <div className="lics big">
                    {picked.lic.map((L) => <span key={L} className="lic on">{L}</span>)}
                  </div>
                  <div className="note sm">
                    위 면허·업종을 갖춰야 투찰할 수 있습니다.
                    공동수급으로 채우는 경우도 있으니 공고서를 확인하세요.
                  </div>
                </>
              ) : (
                <div className="note sm">
                  이 공고의 면허·업종 제한이 아직 수집되지 않았습니다.
                  나라장터 원문에서 «참가자격»을 꼭 확인하세요.
                </div>
              )}
            </div>
          )}

          {/* A값을 비워둔 채 하한 가까이 넣으면 실격합니다 — 가장 흔한 사고 */}
          {a === 0 && ll?.rate && margin != null && margin < 0.5 && (
            <div className="warnbox">
              <div className="h">⚠️ A값을 비워두셨습니다</div>
              <p>
                이 공고에 A값이 <b>있다면</b> 지금 금액은 <b>하한 미달로 실격</b>입니다.
                적격심사 하한은 <code>(예정가격 − A) × 하한율 + A</code> 로 판정하는데,
                A값이 커질수록 하한 금액이 올라가기 때문입니다.
              </p>
              <div className="kv">
                <div>
                  <span>A값 0원일 때 하한</span>
                  <b>{won(limitAmount(base, sjMid, ll.rate, 0))}</b>
                </div>
                <div>
                  <span>A값이 기초의 10%라면</span>
                  <b className="hi">{won(limitAmount(base, sjMid, ll.rate, Math.round(base * 0.1)))}</b>
                </div>
              </div>
              <p className="last">
                공고서 산출내역서의 «사회보험료 등» 합계를 위 A값 칸에 넣어주세요.
                A값이 없는 공고라면 지금 이대로가 맞습니다.
              </p>
            </div>
          )}

          {/* ── 사정률 후보 10개 ── */}
          {(ov?.sjc || []).length > 0 && (
            <div className="card c-sj">
              <div className="detail-h">
                사정률 후보 <span className="count">· 실제 개찰 {num(ov.sjn)}건에서 나온 자리</span>
              </div>
              <div className="note sm" style={{ marginTop: 0, marginBottom: 9 }}>
                사정률은 개찰 때 추첨으로 정해져 아무도 미리 알 수 없습니다.
                그래서 <b>실제로 이만큼 나왔다</b>는 열 지점을 그대로 드립니다.
                누르면 그 사정률로 다시 계산합니다.
              </div>
              <div className="sjgrid">
                {ov.sjc.map((v) => {
                  const on = Math.abs(v - sjMid) < 0.0005
                  return (
                    <button key={v} className={'sjc' + (on ? ' on' : '')}
                      onClick={() => { setSjPick(v); setCopied(false) }}>
                      <span className="r">{v.toFixed(4)}</span>
                      <span className="a">{wonShort(bidAmount(base, v, myRate))}</span>
                    </button>
                  )
                })}
              </div>
              {sjPick != null && (
                <button className="btn ghost sm" style={{ width: '100%', marginTop: 9 }}
                  onClick={() => setSjPick(null)}>가운데값으로 되돌리기</button>
              )}
            </div>
          )}

          {bt && <SimBlock bt={bt} open={btOpen} setOpen={setBtOpen} />}


          {/* ── 4. 사정률 시나리오 ── */}
          <div className="card c-step">
            <div className="detail-h">
              사정률이 이렇게 나오면 <span className="count">· 개찰 때 추첨으로 정해집니다</span>
            </div>
            {ov?.sjn ? (
              <div className="hintbox">
                실제 개찰 {num(ov.sjn)}건에서 사정률은 <b>{pct(sjLo, 2)} ~ {pct(sjHi, 2)}</b> 사이에
                열에 여덟이 들어왔습니다. 가운데값 {pct(ov?.sjq?.p50 ?? P50_FALLBACK, 3)}.
                {sjPick != null && <> 지금은 <b>{pct(sjPick, 3)}</b> 로 골라서 계산 중입니다.</>}
              </div>
            ) : null}
            {/* ★ 개찰 끝난 공고를 «채점»할 때 쓰는 표와 **같은 표**입니다.
                같은 함수(buildScen)로 그리니 두 화면이 어긋날 수 없습니다. */}
            {scLive ? (
              <ScenTable sc={scLive} amtLabel="내 금액"
                pctile={aKnown ? 75 : 95} />
            ) : (
              <table className="mini">
                <thead><tr><th>사정률</th><th>예정가격</th><th>내 투찰률</th></tr></thead>
                <tbody>
                  {steps.map((sv) => {
                    const yeje = base * (sv / 100)
                    const r2 = yeje > 0 ? (main / yeje) * 100 : 0
                    const ok = ll?.rate ? main >= limitAmount(base, sv, ll.rate, a) : true
                    return (
                      <tr key={sv} className={Math.abs(sv - sjMid) < 0.26 ? 'on' : ''}>
                        <td>{sv.toFixed(1)}%</td>
                        <td>{wonShort(yeje)}</td>
                        <td className={ok ? 'ok' : 'no'}>
                          {r2.toFixed(3)}% {ll?.rate ? (ok ? '통과' : '미달') : ''}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
            <div className="note sm">
              이 표는 <b>개찰이 끝난 공고를 «채점»할 때 보여드리는 표와 똑같습니다.</b>
              금액도 같은 함수로 냅니다. 그래서 «채점에서는 잘 나오던데 실제로는 다르더라»
              가 생기지 않습니다. 1순위 화면에서 아무 개찰이나 «📊 채점하기»를 눌러
              직접 맞춰 보세요.
            </div>
          </div>

          <GradeCard />

          {/* ── 5. 지금 시장 ── */}
          {hot?.top?.length > 0 && (
            <div className="card c-mkt">
              <div className="detail-h">
                지금 시장 <span className="count">· 전국 최근 {hot.win}일 낙찰률 {num(hot.n)}건</span>
              </div>
              <div className="hbars">
                {hot.top.map(([r, c]) => (
                  <div key={r} className={'hbar' + (Math.abs(r - myRate) < 0.05 ? ' me' : '')}>
                    <span className="l">{r.toFixed(1)}%</span>
                    <span className="t"><i style={{ width: `${(c / topMax) * 100}%` }} /></span>
                    <span className="c">{num(c)}</span>
                  </div>
                ))}
              </div>
              <div className="note sm">
                참고용 분포입니다. <b>권장 금액은 이 최빈값에서 뽑지 않습니다.</b>
                최빈값에서 빼는 방식은 3년치 역검증에서 2,532건 중 <b>58%가 낙찰하한 미달</b>이었습니다.
                지금은 그 공고의 사정률 분포에서 <b>75분위 + 0.3% 여유</b> 지점의 낙찰하한금액을
                씁니다 — 실측 958건 기준 실격 11.6%, 1순위 4.07%. 위 «왜 이 금액인가»를 보세요.
              </div>
            </div>
          )}

          {/* ── 6. 비슷한 공고 ── */}
          {sim && (
            <div className="card">
              <div className="detail-h">
                비슷한 공고 <span className="count">· 최근 {ov?.kwDays ?? 90}일</span>
              </div>
              <div className="kv">
                <div><span>키워드</span><b>{sim.word}</b></div>
                <div><span>표본</span><b>{num(sim.n)}건</b></div>
                <div><span>최다 낙찰률</span><b className="hi">{pct(sim.zone, 1)}</b></div>
                <div><span>평균</span><b>{pct(sim.avg, 2)}</b></div>
              </div>
            </div>
          )}

          </>)}

          {/* ── 7. 발주기관 (참고) ── */}
          {ag && (
            <div className="card">
              <div className="detail-h">
                {inst} <span className="count">· 최근 3년 · 참고용</span>
              </div>
              <div className="kv">
                <div><span>표본</span><b>{num(ag.n)}건</b></div>
                <div><span>평균 투찰률</span><b>{pct(ag.s?.avg, 3)}</b></div>
                <div><span>최다 구간</span><b>{(ag.h1 || [])[0] ? pct([...ag.h1].sort((x, y) => y[1] - x[1])[0][0], 1) : '-'}</b></div>
                <div><span>독식률</span><b>{pct(ag.mono, 0)}</b></div>
              </div>
              <div className="note sm">
                <b>이 숫자는 권장 투찰률에 쓰지 않습니다.</b> 개찰 106,534건을 되돌려 확인해 보니,
                표본이 80건 쌓인 기관에서도 전국 최근값이 기관별 값보다 4.6%p 더 잘 맞았습니다.
              </div>
            </div>
          )}

          <div className="note">
            금액은 <b>(기초금액 × 사정률 − A값) × 투찰률 + A값</b> 으로 계산하고 원 단위에서 올립니다.
            내림하면 하한에 딱 맞출 때 아래로 떨어져 실격되기 때문입니다.<br />
            권장 투찰률은 과거 개찰 106,534건을 되돌려 정한 값이며 낙찰을 보장하지 않습니다.
            경쟁업체 투찰 자료가 없어 실제 승률은 검증값보다 낮을 수 있습니다.
            나라장터에 넣기 전에 공고서의 기초금액 · A값 · 적격심사 기준을 반드시 확인하세요.
          </div>
        </>
      )}
    </>
  )
}

/* ============================================================
   가상 시뮬레이션

   «그때 우리 방식으로 넣었으면 어땠을까» 를 실제 개찰로 대봅니다.
   사정률 후보 10개를 각각 넣어 보고, 그 금액이 실제 1순위보다 낮으면서
   낙찰하한을 넘겼으면 «낙찰» 로 표시합니다.

   한계를 숨기지 않습니다 — 조달청이 1순위만 주기 때문에
   2위 이하와의 경쟁, 적격심사의 비가격 요소는 반영하지 못합니다.
   ============================================================ */
function SimBlock({ bt, open, setOpen }) {
  const cases = open ? bt.cases : bt.cases.slice(0, 3)
  const V = { dq: ['⛔', '실격'], win: ['🏆', '1순위'], lose: ['📉', '밀림'] }
  return (
    <div className="card c-sim">
      <div className="detail-h">
        가상 시뮬레이션
        {/* ⚠️ bt.n 은 «화면에 보여주는 사례 수»입니다.
            실제로 대본 건수는 bt.tested 입니다. */}
        <span className="count">
          · 최근 {bt.days}일 개찰 {num(bt.tested || bt.n)}건에 대봤습니다
        </span>
      </div>
      {bt.to && (
        <div className="simrange">
          {bt.from} ~ <b>{bt.to}</b> 개찰분 · 배치가 돌 때마다 다시 계산합니다
          {bt.aReal != null && (
            <><br />
              <b>{bt.aReal}% 는 그 공고의 실제 A값</b>
              {bt.aReal < 99 && <>, 나머지는 같은 규모 중앙값 {bt.aAssumed}% 로 가정합니다.
                {' '}실제 A값이 쌓일수록 이 숫자는 정확해집니다.</>}
            </>
          )}
        </div>
      )}

      {/* ★ 화면이 실제로 내는 금액 그대로 대봅니다 (2026-09-02 교체).
          예전에는 «최빈 투찰률 하나»를 사정률 후보 10개에 대보는 다른 방식이었습니다. */}
      <div className="simsum">
        <div>
          <span>실격</span>
          <b className="bad">{Number(bt.dq).toFixed(1)}%</b>
        </div>
        <div>
          <span>1순위였을 자리</span>
          <b className="hi">{Number(bt.win).toFixed(1)}%</b>
        </div>
        <div>
          <span>낙찰가와의 차이</span>
          <b>{Number(bt.gap).toFixed(2)}%</b>
        </div>
      </div>
      <div className="note sm" style={{ marginTop: 0 }}>
        바로투찰이 그날 내놨을 <b>바로 그 금액</b>으로 대본 것입니다 —
        채점 화면과 같은 함수를 씁니다.
      </div>

      {cases.map((c, i) => (
        <div className="simcase" key={i}>
          <div className="h">
            <span className="d">{c.dt}</span>
            <span className="t">{c.name}</span>
          </div>
          <div className="m">
            실제 낙찰 <b>{won(c.win)}</b> · 투찰률 {pct(c.rate, 3)} ·
            {' '}실제 사정률 <b>{c.sj.toFixed(4)}</b>
          </div>
          <div className={'simv ' + c.v}>
            <span className="ic">{(V[c.v] || ['', ''])[0]}</span>
            <span className="lb">{(V[c.v] || ['', ''])[1]}</span>
            <span className="am">우리 금액 <b>{won(c.our)}</b></span>
            <span className="am">하한 {won(c.limit)}</span>
          </div>
        </div>
      ))}

      <button className="btn ghost sm" style={{ width: '100%', marginTop: 8 }}
        onClick={() => setOpen(!open)}>
        {open ? '접기' : `나머지 ${bt.cases.length - 3}건 더 보기`}
      </button>

      <div className="note sm">
        <b>이 숫자를 그대로 믿지 마세요.</b> 조달청이 1순위(낙찰자)만 알려주기 때문에,
        «실제 1순위보다 낮았다»까지만 확인한 것입니다.
        2위 이하 업체와의 경쟁, 적격심사의 경영상태·시공경험 같은 비가격 요소는
        반영하지 못했습니다. <b>실제 승률은 위 숫자보다 낮습니다.</b>
      </div>
    </div>
  )
}
