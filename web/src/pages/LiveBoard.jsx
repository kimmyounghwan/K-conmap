import { Link } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useBoard } from '../lib/useBoard.js'
import { Skeleton, Empty } from '../components.jsx'
import { RangeBar } from './FirstBoard.jsx'
import { isReady, missingOf } from './BaroBid.jsx'
import { NoticeLink } from '../NoticeDetail.jsx'
/* ⚠️ 2026-09-17 — 공고·1순위 카드 아래 «댓글» 칸을 뗐습니다.
   소장님: 「**공고나 1순위에 있는 댓글쓰기도 제거하자.**」
   왜: 글이 공고 수만큼 흩어졌습니다. 공고 하나에 한 줄씩 달리면
   그 줄은 그 공고를 연 사람 말고는 아무도 못 봅니다 — 대화가 안 됩니다.
   이제 한 줄은 «한 줄 남기기» 창(AskComment.jsx)이 받아 **사랑방 한 곳으로** 모읍니다.
   ⚠️ Comments.jsx / CommentsPanel.jsx 는 지우지 않았습니다 — 이미 달린 글이 DB(cmt)에 있고,
      다시 붙일 자리가 생길 수 있어서입니다. 지금은 어디서도 부르지 않습니다. */
import { quickBid, P50_FALLBACK, pickOdds, stamp14, nowStamp, canBid,
         atLeastOne, enpWhy } from '../lib/bidmath.js'
import { getOverview, getBidIndex, indexRows, getLicStat } from '../lib/data.js'
import { loadBasket, toggleBasket, clearBasket, BASKET_MAX } from '../lib/basket.js'
import FreshBar from '../Fresh.jsx'
import { winGrade } from '../lib/winodds.js'
import { noteLive } from '../lib/mentor.js'
import { won, wonShort, num, dateTime, dday, REGIONS, inRegion } from '../lib/fmt.js'
import { loadLicCodes, saveLicCodes, loadLicNone, saveLicNone,
         licList, licNoneCount, licHit, licShort, loadRegion, saveRegion } from '../lib/lic.js'

/* ══════════════════════════════════════════════════════════════
   «바로투찰» 버튼은 계산이 되는 공고에만 답니다.

   버튼을 눌렀는데 «아직 계산할 수 없습니다» 가 뜨면,
   그건 도와준 게 아니라 헛걸음을 시킨 겁니다.
   그래서 여기서 미리 거릅니다 —
     ① 아직 마감 전일 것 (마감된 공고는 투찰 자체가 안 됩니다)
     ② 기초금액·낙찰하한율·A값·예비가격 정보가 다 있을 것 (isReady)
   판정 기준은 바로투찰과 «같은 함수»를 씁니다. 따로 두면 반드시 어긋납니다.
   ══════════════════════════════════════════════════════════════ */
/* stamp14 · nowStamp · canBid 는 bidmath.js 로 옮겼습니다 (바로투찰 첫 화면과 공유) */

/* 붙임 파일 정렬·뱃지용 갈래.
   ⚠️ collect.py 의 NAEYEOK_KIND 와 같은 낱말을 씁니다. 한쪽만 고치면
      목록(/change/naeyeok)과 카드가 다른 말을 하게 됩니다. */
function docRank(nm) {
  const n = String(nm || '')
  if (/설계내역|단가산출|일위대가/.test(n)) return 0   // 단가가 들어 있습니다
  if (/내역|수량산출/.test(n)) return 1
  return 2
}

const PAGE = 20

/* ── 💰 금액 거르개 (2026-09-17) ────────────────────────────────
   억 단위로 주고받습니다. 화면에 「200000000」 을 치게 하면 0 을 세다 틀립니다.
   ⚠️ 경계는 «추정가격» 기준입니다 — 적격심사가 추정가격으로 갈리기 때문입니다.
      국가·조달청 2·3·10·50·100억 / 지자체 2·4·10억 → 겹치는 마디를 알약으로. */
const AMT_KEY = 'kcm_live_amt'
const 억 = 1e8
const AMT_CHIPS = [
  { t: '2억 미만', lo: null, hi: 2 },
  { t: '2~4억', lo: 2, hi: 4 },
  { t: '4~10억', lo: 4, hi: 10 },
  { t: '10~50억', lo: 10, hi: 50 },
  { t: '50~100억', lo: 50, hi: 100 },
  { t: '100억 이상', lo: 100, hi: null },
]
const loadAmt = () => {
  try {
    const v = JSON.parse(localStorage.getItem(AMT_KEY) || 'null')
    if (!v || (v.lo == null && v.hi == null)) return null
    return v
  } catch { return null }                      /* 사생활 모드 */
}
const saveAmt = (v) => {
  try {
    if (v && (v.lo != null || v.hi != null)) localStorage.setItem(AMT_KEY, JSON.stringify(v))
    else localStorage.removeItem(AMT_KEY)
  } catch { /* 사생활 모드 */ }
}
/* 「이 공고의 추정가격」 — 한 곳에서만 정합니다.
   ⚠️ 0 은 «0원» 이 아니라 «모름» 입니다. 부르는 쪽이 반드시 갈라서 다뤄야 합니다.
   ⚠️ 배정예산(budget)은 **쓰지 않습니다.** 총사업비라 추정가격보다 큽니다
      (실측 예: 기초 397,111,000 인데 예산 485,852,000 — 1.2억 차). */
export const estOf = (r) => {
  const e = Number(r && r.est) || 0
  if (e > 0) return e
  const b = Number(r && r.base) || 0
  return b > 0 ? Math.round(b / 1.1) : 0
}
/* 걸러도 되나 — 셋 다 답이 다릅니다: 통과 / 걸러짐 / **모름** */
const amtHit = (est, a) => {
  if (!a || (a.lo == null && a.hi == null)) return true
  if (!est) return null                        /* 모름 — 부르는 쪽이 따로 셉니다 */
  if (a.lo != null && est < a.lo * 억) return false
  if (a.hi != null && est >= a.hi * 억) return false
  return true
}
const amtLabel = (a) => {
  if (!a) return ''
  const f = (v) => `${v}억`
  if (a.lo != null && a.hi != null) return `${f(a.lo)}~${f(a.hi)}`
  if (a.hi != null) return `${f(a.hi)} 미만`
  return `${f(a.lo)} 이상`
}

const KIND = 'con'   // 공사만 다룹니다 (용역 제외)
export default function LiveBoard() {
  /* 지역도 기억합니다 — 바로투찰 첫 화면(«오늘 내 것»)과 같은 값을 씁니다 (2026-09-06) */
  const [region, setRegionRaw] = useState(loadRegion)
  const setRegion = (v) => { setRegionRaw(v); saveRegion(v) }
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [mine, setMine] = useState(false)
  const [onlyGood, setOnlyGood] = useState(false)   // A·B 등급만 보기
  const [lics, setLics] = useState(loadLicCodes)
  const [licNone, setLicNone] = useState(loadLicNone)
  const [docOnly, setDocOnly] = useState(false)   // 단가 든 내역서가 붙은 공고만
  const [editLic, setEditLic] = useState(false)
  const [open, setOpen] = useState(null)
  const now = useMemo(() => nowStamp(), [])
  /* ★ 원클릭 — 2026-09-03. 소장님: 「입찰가를 원클릭으로 구해서 입찰할 때.」
     전국 사정률 중앙(p50)만 있으면 공고 한 줄로 권장 금액이 나옵니다(quickBid).
     overview.json 은 0.4KB — 이미 첫 화면이 받는 파일이라 추가 전송량이 없습니다. */
  const [ov, setOv] = useState(null)
  const [copiedNo, setCopiedNo] = useState(null)
  useEffect(() => { getOverview().then(setOv).catch(() => {}) }, [])
  const p50 = ov?.sjq?.p50 ?? P50_FALLBACK

  /* ══════════════════════════════════════════════════════════════
     🎯 자리 찾기 — 2026-09-03. 소장님: 「공고 도구 만들어 줘」
     금액은 실측으로 꼭대기다(사정률 분위를 어떻게 잡아도 1순위율 3.5~4.4%). 움직이는 건 «참가업체수»
     (2~9곳 18% · 100곳+ 1.6%). 그래서 «어느 공고에 넣느냐» 를 돕는다.
     - 재료: bidindex.json (마감 전 공고 · 기관별 예상 참가 enp · 규모×참가 1순위율 표 pick)
     - 이 모드에서는 7주치 묶음 대신 bidindex 로 목록을 만든다(마감 전 · 계산 가능 공고만).
       검색·지역·면허·A·B 거르기는 그대로 적용된다.
     - 없는 숫자는 만들지 않는다: 기관 개찰 6건 미만이면 «예상 참가 모름», 표 칸 15건 미만이면 «실측 부족».
     ══════════════════════════════════════════════════════════════ */
  /* 모드 — 「탭 잘 만들고」(소장님, 2026-09-14). 셋 다 같은 카드를 그리고, 목록을 만드는 법만 다릅니다.
       list   7주치 공고 묶음 (검색·지역·면허)
       pick   마감 전·계산 가능 공고를 확률·기대액 순으로
       basket ⭐ 담은 공고 — 여기서만 «적어도 한 건» 합산 확률을 냅니다 */
  const [mode, setMode] = useState('list')
  const pick = mode === 'pick'
  const bagMode = mode === 'basket'
  const [sortBy, setSortBy] = useState('prob')      // 'prob' 확률 순 · 'ev' 기대액 순 · 'close' 마감 순
  const [fewOnly, setFewOnly] = useState(false)     // 참가 적은(10곳 미만) 공고만
  /* 금액대 거르기 (2026-09-14) — 실측: 1억 미만은 참가 중앙 32곳(10곳 미만 29.9%),
     3~10억은 404곳(3.2%). 붐비지 않는 자리를 찾는 가장 굵은 손잡이입니다.
     칸 경계는 손으로 적지 않고 bidindex 의 pick.sz 를 씁니다 — 표와 어긋날 자리를 안 만듭니다. */
    /* 💰 금액 거르개 (2026-09-17) — 이용자 의견:
   *   「공고 페이지에서 금액에 맞추어 얼마부터 얼마 사이, 얼마 이상, 얼마 이하」
   *
   * ■ 왜 이 경계인가 — 취향이 아니라 «법» 입니다.
   *   적격심사 기준이 추정가격으로 갈립니다 (2026-09-17 생활법령정보 원문 확인).
   *     국가·조달청  2억 · 3억 · 10억 · 50억 · 100억(넘으면 종합심사낙찰제)
   *     지자체        2억 · 4억 · 10억
   *   소장님: 「**지자체, 국가 둘 다 가자**」
   *   → 둘의 경계를 **합쳐서** 넣습니다. 알약은 겹치는 큰 마디(2·4·10·50·100)를 쓰고,
   *     3억처럼 한쪽에만 있는 마디는 «직접 넣기» 로 갑니다.
   *   ⚠️ 거르개는 «이 공고가 국가냐 지자체냐» 를 **알 필요가 없습니다.**
   *      경계만 다 있으면 쓰는 사람이 자기 구간을 고릅니다. 판정은 나중 일(이름표 붙이기)입니다.
   *
   * ■ 무엇으로 거르나 — **추정가격** 입니다. 이게 전부입니다.
   *   공고 하나에 금액이 셋이고(추정가격 < 기초금액 < 배정예산), 법정 경계는 추정가격에 걸립니다.
   *   실측 예: 기초 397,111,000 인데 예산 485,852,000 — 1.2억이 벌어집니다.
   *   배정예산으로 거르면 «추정가격 기준 대상» 공고가 소리 없이 사라집니다.
   *
   * ■ 모르는 것은 «모른다» 고 합니다
   *   추정가격도 기초금액도 없는 공고가 6.1% 있습니다(실측 16,280건 중 986건).
   *   조용히 빼면 「내 공고가 사라졌다」 가 됩니다 → 아래 «금액 모르는 공고 N건» 으로 셉니다.
   */
  const [amt, setAmt] = useState(loadAmt)        // {lo,hi} — 억 단위. null = 안 씀
  const [bag, setBag] = useState(loadBasket)
  const [idx, setIdx] = useState(undefined)         // undefined=아직 · null=실패 · {f,r,pick}
  useEffect(() => {
    if ((pick || bagMode) && idx === undefined) getBidIndex().then((d) => setIdx(d || null))
  }, [pick, bagMode, idx])
  /* 면허 경쟁도 — 면허를 고를 때만 받습니다(첫 화면 전송량에 안 얹습니다) */
  const [licst, setLicst] = useState(null)
  useEffect(() => { if (editLic && !licst) getLicStat().then((d) => setLicst(d || null)) }, [editLic, licst])
  const toggleBag = (e, no) => { e.stopPropagation(); setBag(toggleBasket(no)) }
  const copyAmt = (e, r, amt) => {
    e.stopPropagation()
    try { navigator.clipboard?.writeText(String(amt)) } catch { /* 옛 브라우저 */ }
    setCopiedNo(r.no)
    setTimeout(() => setCopiedNo((v) => (v === r.no ? null : v)), 1600)
  }

  useEffect(() => { setPage(1) }, [region, q, mine, lics, licNone, onlyGood, docOnly, mode, sortBy, fewOnly, amt])
  useEffect(() => { saveLicCodes(lics) }, [lics])
  useEffect(() => { saveLicNone(licNone) }, [licNone])



  /* ── 검색·지역·면허·등급은 «색인»으로 거릅니다 — 2026-09-03 ──────
     전에는 7주치 묶음을 전부 받았습니다(1,767KB). 이제 색인(352KB)만 받고,
     보고 있는 쪽에 나올 20건이 든 묶음만 받습니다.
     ⚠️ 색인 한 줄: [공고명, 기관, 기초금액, 예가하한, 예가상한, 면허코드, 시도(sido), 내역서(dsn)]
        — collect.py 의 export_board 가 이 순서로 만듭니다. selfcheck 가 대조합니다.
        base/lo/hi 는 「해볼 만한 공고만」 등급이 쓰고, lic 은 면허 거르기가 씁니다
        (2026-09-05 — 전에는 공고명 낱말로 «추측» 해서 정확도가 15.7% 였습니다). */
  const filtering = q.trim().length > 0 || region !== '전국' || mine || onlyGood || docOnly || !!amt
  /* 💰 금액을 몰라서 못 거른 공고를 «셉니다». 화면이 정직하게 적습니다.
     ⚠️ ref 인 까닭: match 는 useBoard 가 색인을 훑을 때 불립니다. 여기서 setState 를 하면
        훑는 중에 다시 그리기가 돌아 무한히 돕니다. 세기만 하고, 다 센 뒤에 한 번 읽습니다. */
  const 모름수 = useRef(0)
  const match = useMemo(() => {
    if (!filtering) return null
    const s = q.trim()
    모름수.current = 0
    return (a) => {
      const [name, inst, base, lo, hi, lic, sido, dsn, est] = a
      if (!inRegion({ name, inst, sido }, region)) return false
      if (s && !((name || '').includes(s) || (inst || '').includes(s))) return false
      if (mine && lics.length && !licHit(lic, lics, licNone)) return false
      if (docOnly && !(dsn >= 2)) return false
      if (onlyGood) {
        const g = winGrade({ name, inst, base, lo, hi })
        if (!g || (g.key !== 'A' && g.key !== 'B')) return false
      }
      /* 금액은 «맨 마지막에» 봅니다 — 지역·면허까지 맞은 공고 중 몇 건이
         금액을 몰라서 빠졌는지 세야 그 숫자가 뜻이 있습니다. */
      const ok = amtHit(estOf({ est, base }), amt)
      if (ok === null) { 모름수.current += 1; return false }
      return ok
    }
  }, [filtering, q, region, mine, lics, licNone, onlyGood, docOnly, amt])

  const { info, rows: all, pageRows, pageReady, total, indexReady, loading, busy } =
    useBoard('live', KIND, { match: pick ? null : match, page, perPage: PAGE })

  /* 면허 칩 목록은 «자료에서» 옵니다 — collect.py 가 board meta 에 구워 둡니다.
     화면에 손으로 적어 두면 조달청이 이름을 바꿨을 때 조용히 안 맞습니다. */
  const licOptions = useMemo(() => licList(info), [info])
  const noLic = useMemo(() => licNoneCount(info), [info])

  /* 금액대 칸 — bidindex 의 pick.sz 를 그대로 씁니다 (표·화면이 같은 경계를 보게) */
  /* ⚠️ 2026-09-17 — 여기에 «자리 찾기» 전용 금액 알약(szPick)이 따로 있었습니다.
     1억·3억·10억 세 마디였는데, 그건 **참가업체 수 통계**로 나눈 칸이라
     법정 경계(2·3·4·10·50·100억)와 안 맞았고, 무엇보다 **기초금액**으로 걸렀습니다.
     한 화면에 금액 거르개가 둘이면 어느 쪽이 먹은 건지 아무도 모릅니다.
     → 없앴습니다. 위의 amt 하나가 두 모드를 다 거릅니다(추정가격 기준). */

  /* 🎯 자리 찾기 목록 — 마감 전·계산 가능 공고에 예상 참가·1순위율·기대액을 붙여 정렬합니다 */
  const pickRows = useMemo(() => {
    if (!pick || !idx) return null
    const s = q.trim()
    const out = []
    for (const r of indexRows(idx)) {
      if (!canBid(r, now)) continue
      if (!inRegion(r, region)) continue
      if (s && !((r.name || '').includes(s) || (r.inst || '').includes(s))) continue
      if (mine && lics.length && !licHit(r.lic, lics, licNone)) continue
      if (docOnly && !((r.dsn || 0) >= 2)) continue
      if (onlyGood) {
        const g = winGrade(r)
        if (!g || (g.key !== 'A' && g.key !== 'B')) continue
      }
      const qb = quickBid(r, p50)
      if (!qb) continue
      const od = pickOdds(r, idx.pick, qb.amt)
      if (fewOnly && !(od && od.enp > 0 && od.enp < 10)) continue
      /* 💰 금액 — 목록 모드와 «같은» 거르개입니다. 여기 rows 는 bidindex 라
         est 가 비어 있을 수 있어 estOf 가 기초금액에서 메웁니다. */
      if (amtHit(estOf(r), amt) !== true) continue
      out.push({ ...r, qb, od })
    }
    const rateOf = (x) => (x.od && x.od.rate != null ? x.od.rate : -1)
    const evOf = (x) => (x.od && x.od.ev != null ? x.od.ev : -1)
    if (sortBy === 'prob') out.sort((a, b) => rateOf(b) - rateOf(a) || evOf(b) - evOf(a))
    else if (sortBy === 'ev') out.sort((a, b) => evOf(b) - evOf(a) || rateOf(b) - rateOf(a))
    else out.sort((a, b) => stamp14(a.close).localeCompare(stamp14(b.close)))
    return out
  }, [pick, idx, q, region, mine, lics, licNone, onlyGood, docOnly, fewOnly, amt, sortBy, p50, now])

  /* ⭐ 담은 공고 — 담은 것은 공고번호뿐이라 여기서 bidindex 로 다시 찾습니다.
     마감이 지난 것은 지우지 않고 «마감됨» 으로 남겨 둡니다 — 조용히 사라지면 사용자가 알 수 없습니다. */
  const bagRows = useMemo(() => {
    if (!bagMode || !idx) return null
    const byNo = new Map()
    for (const r of indexRows(idx)) byNo.set(String(r.no), r)
    const out = []
    for (const no of bag) {
      const r = byNo.get(String(no))
      if (!r) { out.push({ no, gone: true }); continue }
      const open = canBid(r, now)
      const qb = open ? quickBid(r, p50) : null
      const od = qb ? pickOdds(r, idx.pick, qb.amt) : null
      out.push({ ...r, qb, od, open })
    }
    out.sort((a, b) => (a.gone ? 1 : 0) - (b.gone ? 1 : 0)
      || (b.open ? 1 : 0) - (a.open ? 1 : 0)
      || stamp14(a.close).localeCompare(stamp14(b.close)))
    return out
  }, [bagMode, idx, bag, p50, now])

  /* «적어도 한 건» — 마감 전이고 1순위율을 아는 것만 셈에 넣습니다. 모르는 것은 0으로 치지 않고 «뺍니다». */
  const bagOdds = useMemo(() => {
    if (!bagRows) return null
    const usable = bagRows.filter((x) => x.open && x.od && x.od.rate != null)
    return { ...(atLeastOne(usable.map((x) => x.od.rate)) || { n: 0, p: 0 }),
             open: bagRows.filter((x) => x.open).length,
             unknown: bagRows.filter((x) => x.open && !(x.od && x.od.rate != null)).length,
             closed: bagRows.filter((x) => !x.open).length,
             ev: usable.reduce((t, x) => t + (x.od.ev || 0), 0) }
  }, [bagRows])

  /* 전체 건수는 useBoard 가 «7주 전체»로 셉니다 — 검색 중이면 색인에서, 아니면 목록표(meta)에서.
     ⚠️ 받아 둔 것(all.length)으로 세면 25쪽(500건 ≈ 개찰 이틀치)에서 끝납니다 — 2026-09-03 실제 사고. */
  const listOf = pick ? pickRows : (bagMode ? bagRows : null)
  const count = listOf ? listOf.length : (total != null ? total : all.length)
  const pages = Math.max(1, Math.ceil(count / PAGE))
  const view = listOf
    ? listOf.slice((page - 1) * PAGE, page * PAGE)
    : (pageRows != null ? pageRows : all.slice((page - 1) * PAGE, page * PAGE))
  const rows = view
  const done = listOf ? true : (filtering ? indexReady : true)     // 검색 중이면 색인이 와야 «다 셌다»
  const pickBusy = (pick || bagMode) && idx === undefined

  const toggleLic = (l) =>
    setLics((v) => (v.includes(l) ? v.filter((x) => x !== l) : [...v, l]))

  return (
    <>
      <div className="sec-title" style={{ marginTop: 14 }}>
        📋 공사 입찰공고 <span className="count">· 나라장터 · 카드를 누르면 기초금액</span>
      </div>

      <FreshBar kind="live" />

      {/* ── 모드 탭 (2026-09-14) — 셋 다 같은 카드를 그립니다. 목록을 만드는 법만 다릅니다. ── */}
      <div className="modetabs">
        <button className={mode === 'list' ? 'on' : ''} onClick={() => setMode('list')}>📋 공고 목록</button>
        <button className={mode === 'pick' ? 'on' : ''} onClick={() => setMode('pick')}>🎯 자리 찾기</button>
        <button className={mode === 'basket' ? 'on' : ''} onClick={() => setMode('basket')}>
          ⭐ 담은 공고{bag.length ? <em className="bagn"> {bag.length}</em> : null}
        </button>
      </div>

      {!bagMode && (
        <input value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="공고명 · 발주기관 검색" style={{ marginBottom: 10 }} />
      )}

      <div className="chips" hidden={bagMode}>
        <button className={'chip' + (mine ? ' on' : '')}
          onClick={() => (lics.length ? setMine(!mine) : setEditLic(true))}>
          ✨ 내 면허 맞춤{lics.length ? ` (${lics.length})` : ''}
        </button>
        {REGIONS.map((r) => (
          <button key={r} className={'chip' + (region === r ? ' on' : '')} onClick={() => setRegion(r)}>{r}</button>
        ))}
      </div>

      {/* 💰 금액 (2026-09-17) — 지역·면허 바로 아래. 이 셋이 «내 조건» 입니다.
          지역·면허처럼 브라우저가 기억합니다 — 매번 다시 넣게 하면 아무도 안 씁니다. */}
      {!bagMode && <AmtBar amt={amt} setAmt={(v) => { setAmt(v); saveAmt(v) }} />}

      {!bagMode && (editLic || (mine && !lics.length)) && (
        <div className="card">
          <div className="sec-title" style={{ margin: '0 0 4px' }}>
            보유 면허 선택
            <span className="count">· 조달청이 공고에 적은 면허 그대로입니다</span>
          </div>
          {licOptions.length === 0 ? (
            <div className="note">면허 목록을 불러오는 중입니다…</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
              {licOptions.map(([code, nm, n]) => {
                /* ② 면허별 경쟁도 (2026-09-14) — 면허가 «걸려 있느냐»가 아니라 «어느 면허냐»가 지렛대입니다.
                   실측: 산림사업법인(산림토목) 참가 중앙 7곳 vs 토목공사업 361곳 — 52배. */
                const st = licst?.r?.[code]
                return (
                  <button key={code} className={'chip' + (lics.includes(code) ? ' on' : '')}
                    onClick={() => toggleLic(code)}>{licShort(nm)}<em className="licn"> {n}</em>
                    {st ? <em className={'licnp' + (st[2] < 10 ? ' few' : st[2] < 30 ? ' mid' : '')}> 참가 {st[2]}곳</em> : null}
                  </button>
                )
              })}
            </div>
          )}
          <label className="licnone">
            <input type="checkbox" checked={licNone}
              onChange={(e) => setLicNone(e.target.checked)} />
            <span>면허가 안 적힌 공고도 보기{noLic != null ? ` (${num(noLic)}건)` : ''}</span>
          </label>
          <div className="note" style={{ marginTop: 8 }}>
            조달청이 공고마다 적어 준 <b>면허 제한</b>으로 거릅니다 — 공고명으로 짐작하지 않습니다.
            선택한 면허는 이 브라우저에만 저장됩니다. 회원가입은 없습니다.
            {licst?.r ? (
              <> <b>「참가 N곳」</b>은 그 면허 공고의 실제 개찰 참가업체수 중앙입니다 —
                면허마다 <b>50배 넘게</b> 다릅니다. <Link to="/lic">면허별 경쟁도 전부 보기 →</Link></>
            ) : null}
          </div>
          {/* ⚠️ 2026-09-10 — 여기서 «면허를 하나도 안 골랐을 때» mine 을 그대로 두고 있었습니다.
              패널이 보이는 조건이 (editLic || (mine && !lics.length)) 이라,
              mine=true 인 채로 면허를 전부 해제하고 완료를 누르면 **패널이 안 접혔습니다.**
              (핸드폰에서 이미 고른 칩을 다시 누르면 해제됩니다 — 잘못 눌러 0개가 되기 쉽습니다.)
              면허가 없으면 «맞춤»은 꺼야 맞습니다 — filtering 조건도 mine && lics.length 입니다.
              ⚠️ 이 줄은 LiveBoard.jsx 에도 똑같이 있습니다. 한쪽만 고치지 마세요. */}
          <button className="btn" style={{ marginTop: 10 }}
            onClick={() => { setEditLic(false); setMine(lics.length > 0) }}>
            완료
          </button>
        </div>
      )}

      {!bagMode && !editLic && lics.length > 0 && (
        <button className="btn ghost sm" style={{ marginBottom: 8 }} onClick={() => setEditLic(true)}>
          면허 다시 고르기
        </button>
      )}

      {/* 실측: C·D 등급 156건에서 한 건도 못 땄습니다. 걸러 볼 수 있게 합니다. */}
      <button className={'goodonly' + (onlyGood ? ' on' : '')} hidden={bagMode}
        onClick={() => setOnlyGood(!onlyGood)}>
        {onlyGood ? '✓ 해볼 만한 공고만 보는 중 (A·B)' : '🎯 해볼 만한 공고만 보기 (A·B)'}
        <i>승률을 가르는 건 금액이 아니라 공고의 성격입니다 — 실측 45배 차이</i>
      </button>

      {/* 🎯 자리 찾기 — 마감 전 공고를 «예상 참가·1순위율·기대액» 으로 골라 줍니다 */}
      <button className={'goodonly docbtn' + (docOnly ? ' on' : '')} hidden={bagMode} onClick={() => setDocOnly(!docOnly)}>
        <b>📑 설계내역서가 붙은 공고만</b>
        <span>발주처가 잡은 <b>설계 단가</b>를 그대로 볼 수 있는 공고입니다 — 내 단가와 견줘 보세요.</span>
      </button>

      {pick && (
        <div className="pickctl">
          <div className="seg">
            <button className={sortBy === 'prob' ? 'on' : ''} onClick={() => setSortBy('prob')}>확률 순</button>
            <button className={sortBy === 'ev' ? 'on' : ''} onClick={() => setSortBy('ev')}>기대액 순</button>
            <button className={sortBy === 'close' ? 'on' : ''} onClick={() => setSortBy('close')}>마감 순</button>
          </div>
          <button className={'chip' + (fewOnly ? ' on' : '')} onClick={() => setFewOnly(!fewOnly)}>
            참가 적은 공고만 (예상 10곳 미만)
          </button>
          <div className="note sm">
            <b>확률 순</b>은 «한 건이라도 빨리», <b>기대액 순</b>은 «금액×확률이 큰 것부터». 기대액 = 1순위율 × 권장 투찰금액 —
            높을수록 좋습니다.
            <br />
            승률을 가르는 건 금액이 아니라 <b>참가업체수</b>입니다 — 실측 2~9곳 18% · 100곳 넘으면 1.6%.
            예상 참가는 <b>같은 면허·같은 금액대</b>의 과거 개찰에서 짐작합니다(없으면 기관으로 내려갑니다) —
            <Link to="/lic">면허별 경쟁도 보기 →</Link>.
            1순위율은 같은 규모·같은 참가 수 자리에 권장 금액을 넣었을 때의 실측입니다
            {idx?.pick?.n ? <> (개찰 {num(idx.pick.n)}건)</> : null}.
          </div>
        </div>
      )}

      {/* ⭐ 담은 공고 — «적어도 한 건» 합산 확률. 소장님: 「한 건이라도 돼야 소문이 나지.」 */}
      {bagMode && (
        <div className="pickctl bagctl">
          {bag.length === 0 ? (
            <div className="note">
              아직 담은 공고가 없습니다. <b>🎯 자리 찾기</b>나 공고 카드에서 <b>⭐</b> 를 누르면 여기 모입니다.
              <br />한 공고의 1순위율은 몇 %뿐이지만, 여러 건에 넣으면 «적어도 한 건» 확률은 올라갑니다.
            </div>
          ) : bagOdds && bagOdds.n > 0 ? (
            <>
              <div className="bagbig">
                <span className="bl">담은 {bag.length}건 중 계산 가능한 {bagOdds.n}건에 넣으면</span>
                <b className={'bp ' + (bagOdds.p >= 40 ? 'r-safe' : bagOdds.p >= 15 ? 'r-warm' : 'r-hot')}>
                  적어도 한 건 1순위 확률 약 {bagOdds.p.toFixed(0)}%
                </b>
                <span className="bl">기대액 합계 {wonShort(bagOdds.ev)}</span>
              </div>
              <div className="note sm">
                1 − (모두 떨어질 확률) 로 셈합니다. <b>공고끼리 서로 영향이 없다고 보고</b> 곱한 값이라,
                같은 기관·같은 날 공고가 섞이면 실제는 이보다 조금 낮을 수 있습니다.
                {bagOdds.unknown > 0 && <> 1순위율을 모르는 {bagOdds.unknown}건은 셈에서 <b>뺐습니다</b> — 0으로 치지 않습니다.</>}
                {bagOdds.closed > 0 && <> 마감된 {bagOdds.closed}건도 뺐습니다.</>}
              </div>
              <button className="btn ghost sm" onClick={() => { clearBasket(); setBag([]) }}>전부 비우기</button>
            </>
          ) : (
            <div className="note">
              담은 {bag.length}건 중 <b>확률을 셈할 수 있는 공고가 없습니다</b> — 마감됐거나, 예상 참가·실측이 모자랍니다.
              <button className="btn ghost sm" style={{ marginTop: 8 }} onClick={() => { clearBasket(); setBag([]) }}>전부 비우기</button>
            </div>
          )}
        </div>
      )}

      {mode === 'list' && <RangeBar info={info} loaded={all.length} done={done} busy={busy} filtering={filtering} count={count} />}
      {pick && idx === null && <div className="note">마감 전 공고 목록(bidindex.json)을 받지 못했습니다. 잠시 후 다시 열어보세요.</div>}

      {(pick ? (pickBusy || !done) : (loading || (filtering && !done) || !pageReady)) ? <Skeleton /> : rows.length === 0 ? (
        <Empty icon={bagMode ? '⭐' : '📭'}>
          {bagMode ? '담은 공고가 없습니다.' : '조건에 맞는 공고가 없습니다.'}<br />
          {bagMode ? '공고 카드의 ⭐ 를 누르면 여기 모입니다.'
            : (mine ? '면허 맞춤을 끄거나 면허를 추가해보세요.' : '지역을 넓히거나 검색어를 지워보세요.')}
        </Empty>
      ) : (
        <>
          <div className="sec-title">{pick ? '넣을 만한 공고' : (bagMode ? '담은 공고' : '공고')} <span className="count">
            {num(count)}건{pick ? ' (마감 전 · 계산 가능)' : (bagMode ? ` (최대 ${BASKET_MAX}건까지)` : (filtering ? ' (7주 전체)' : ''))}</span></div>
          {/* 💰 2026-09-17 — 금액을 «몰라서» 빠진 공고를 정직하게 적습니다.
              조달청이 추정가격도 기초금액도 안 준 공고가 실측 6.1% 있습니다.
              ⚠️ 조용히 빼면 「내가 아는 그 공고가 왜 없지」 가 되고, 그때 사람은
                 고장이라 생각하고 나갑니다. 숫자를 보여 주면 그냥 «아직 모르는 것» 이 됩니다. */}
          {!pick && !bagMode && amt && 모름수.current > 0 && (
            <div className="note sm" style={{ marginTop: -4, marginBottom: 8 }}>
              금액을 아직 모르는 공고 <b>{num(모름수.current)}건</b>은 세지 않았습니다 —
              조달청이 추정가격·기초금액을 아직 안 준 공고입니다.{' '}
              <button className="lnk" onClick={() => { setAmt(null); saveAmt(null) }}>금액 조건 지우고 보기</button>
            </div>
          )}
          {view.map((r, i) => {
            const id = `${r.no}-${i}`
            const isOpen = open === id
            const dd = dday(r.close)
            if (r.gone) return (
              <div className="notice gone" key={id}>
                <h3>공고번호 {r.no}</h3>
                <div className="meta">
                  <span>마감 전 목록에 없습니다 — 마감됐거나 취소된 공고입니다</span>
                  <button className="cbtn ghost" onClick={(e) => toggleBag(e, r.no)}>⭐ 빼기</button>
                </div>
              </div>
            )
            return (
              <div className="notice" key={id} onClick={() => setOpen(isOpen ? null : id)}>
                <h3>{r.name}</h3>
                <div className="meta">
                  <span className="inst">{r.inst}</span>
                  <span>·</span>
                  <span>{dateTime(r.dt)}</span>
                  {dd && <span className={'badge ' + dd.tone}>{dd.text}</span>}
                  {/* ★ 「해볼 만한가」 등급 — 목록에서 바로 보이게.
                      승률을 가르는 건 우리 계산이 아니라 그 공고의 성격입니다(실측 45배 차이).
                      아침에 A 등급만 훑어보실 수 있게 하려는 것입니다. */}
                  {(() => {
                    const g = winGrade(r)
                    return g ? <span className={'gbadge ' + g.tone}>{g.key} {g.label}</span> : null
                  })()}
                  {canBid(r, now) && (
                    <Link className="gocalc" onClick={(e) => e.stopPropagation()}
                      to={`/?no=${encodeURIComponent(r.no || '')}`}>💰 바로투찰</Link>
                  )}
                  {r.base > 0 && <span className="badge n">기초 {wonShort(r.base)}</span>}
                </div>
                <div className="foot">
                  {/* 🚨 2026-09-17 — 여기가 **「추정가격」 이라 적고 배정예산(r.budget)을 찍고** 있었습니다.
                      배정예산은 총사업비라 추정가격보다 큽니다. 실측 예로 기초 397,111,000 ·
                      예산 485,852,000 인 공고면 진짜 추정가격은 3.6억인데 화면에는 4.8억이 찍혔습니다.
                      **1.2억이 틀립니다.** 적격심사 구간이 갈리는 숫자라 그냥 둘 수 없었습니다.
                      → 알면 추정가격을, 모르면 «배정예산» 이라고 **이름을 바꿔서** 보여 줍니다.
                         이름과 숫자가 어긋나는 것보다 「모른다」 가 낫습니다. */}
                  {(() => {
                    const e = estOf(r)
                    return e > 0
                      ? (<><span className="badge n">추정가격</span><span className="amt">{wonShort(e)}</span></>)
                      : (<><span className="badge n">배정예산</span><span className="amt">{wonShort(r.budget)}</span></>)
                  })()}
                  <span style={{ flex: 1 }} />
                  <NoticeLink no={r.no} compact />
                  <span className="caret">{isOpen ? '▲' : '▼'}</span>
                </div>

                {/* 🤖 클로드 한마디 — 「그래서 넣을까 말까」 한 줄. 숫자는 이미 계산된 것만 씁니다. */}
                {(() => {
                  const qb = quickBid(r, p50)
                  const nt = noteLive(r, {
                    ready: !!qb,
                    grade: winGrade(r),
                    odds: qb && idx ? pickOdds(r, idx.pick, qb.amt) : null,
                  })
                  if (!nt) return null
                  return <div className={'claudesay ' + nt.tone}><b>🤖 한마디</b><span>{nt.text}</span></div>
                })()}

                {/* ★ 원클릭 줄 — 완비 공고에만. 바로투찰 화면과 «같은 함수»(quickBid)로 낸 금액입니다.
                    여기서 복사하고 나라장터로 가면 끝입니다. 화면을 옮기지 않아도 됩니다.
                    더 알고 싶으면(시나리오·근거) 「💰 바로투찰」 알약으로 갑니다. */}
                {canBid(r, now) && (() => {
                  const qb = quickBid(r, p50)
                  if (!qb) return null
                  return (
                    <div className="oneclick" onClick={(e) => e.stopPropagation()}>
                      <div className="oc-l">
                        <span className="oc-tag">권장 투찰금액</span>
                        <span className="oc-amt">{won(qb.amt)}</span>
                        <span className="oc-sub">투찰률 {qb.rate.toFixed(3)}% · 사정률 {qb.pctile}분위{qb.mode === 'auto' ? ' (예상 참가로 자동)' : ''}{qb.aKnown ? '' : ' · A값 미확인'}</span>
                      </div>
                      <div className="oc-r">
                        <button className="cbtn" onClick={(e) => copyAmt(e, r, qb.amt)}>
                          {copiedNo === r.no ? '✓ 복사했습니다' : '금액 복사'}
                        </button>
                        {/* 조달청이 준 주소 그대로. 손으로 만들면 차수를 틀립니다(실제로 틀렸음). */}
                        {r.url && (
                          <a className="cbtn ghost" href={r.url} target="_blank" rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}>나라장터 →</a>
                        )}
                        {/* ④ 담기 — 담은 공고 탭에서 «적어도 한 건» 확률을 합산합니다 */}
                        <button className={'cbtn star' + (bag.includes(String(r.no)) ? ' on' : '')}
                          title="담은 공고에 넣기" onClick={(e) => toggleBag(e, r.no)}>
                          {bag.includes(String(r.no)) ? '★ 담음' : '☆ 담기'}
                        </button>
                      </div>
                    </div>
                  )
                })()}

                {/* 🎯 자리 정보 — 자리 찾기 모드에서만. 없는 숫자는 «모름»·«실측 부족» 으로 적습니다. */}
                {(pick || bagMode) && r.od && (
                  <div className="pickline" onClick={(e) => e.stopPropagation()}>
                    {r.od.enp > 0 ? (
                      <>
                        <span className="pk"><b>예상 참가 {num(r.od.enp)}곳</b>
                          <i>{enpWhy(r) || `개찰 ${num(r.od.enpn)}건의 중앙`}</i></span>
                        {r.od.rate != null ? (
                          <>
                            <span className="pk"><b>이런 자리 1순위 {r.od.rate}%</b>
                              <i>같은 규모·참가 수 실측 {num(r.od.n)}건</i></span>
                            <span className="pk ev"><b>기대 {wonShort(r.od.ev)}</b>
                              <i>1순위율 × 권장 금액 · 높을수록 좋음</i></span>
                          </>
                        ) : (
                          <span className="pk"><b>이런 자리 실측 부족</b><i>같은 규모·참가 수 개찰이 15건 미만</i></span>
                        )}
                      </>
                    ) : (
                      <span className="pk"><b>예상 참가 모름</b><i>이 면허·이 기관의 과거 개찰이 모자라 짐작하지 않습니다</i></span>
                    )}
                  </div>
                )}

                {isOpen && (
                  <div className="detail" onClick={(e) => e.stopPropagation()}>
                    {/* 면허·업종 제한이 입찰 가능 여부를 가장 먼저 가릅니다 — 맨 위에 둡니다 */}
                    {(r.lic || []).length > 0 && (
                      <div className="licbox">
                        <div className="h">참가 가능 면허 · 업종</div>
                        <div className="lics big">
                          {r.lic.map((L) => <span key={L} className="lic on">{L}</span>)}
                        </div>
                      </div>
                    )}
                    {/* 공고서에 있는 내용을 되도록 여기서 다 보이게 합니다 */}
                    <div className="kv">
                      <div>
                        <span>기초금액</span>
                        <b className="hi">{r.base > 0 ? won(r.base) : '아직 공개 안 됨'}</b>
                      </div>
                      <div>
                        <span>추정가격</span>
                        <b>{won(r.est || r.budget)}</b>
                      </div>
                      <div>
                        <span>예가범위</span>
                        <b>{r.lo != null && r.hi != null ? `${r.lo}% ~ ${r.hi}%` : '-'}</b>
                      </div>
                      <div>
                        <span>낙찰하한율</span>
                        <b className={r.llr ? 'hi' : ''}>{r.llr ? `${r.llr}%` : '공고서 확인'}</b>
                      </div>
                      <div>
                        <span>입찰마감</span>
                        <b>{dateTime(r.close)}</b>
                      </div>
                      <div>
                        <span>개찰일시</span>
                        <b>{r.openg ? dateTime(r.openg) : '-'}</b>
                      </div>
                    </div>

                    {/* 공고번호만 넘깁니다. 바로투찰이 그 번호로 공고를 찾아
                        기초금액·A값·면허·지역·낙찰하한율을 «스스로» 채웁니다.
                        예전에는 기초금액이 있는 공고에만 버튼이 떠서,
                        기초금액이 아직 안 나온 공고는 손으로 옮겨 적어야 했습니다. */}
                    {canBid(r, now) ? (
                      <Link className="btn" style={{ width: '100%', margin: '10px 0' }}
                        to={`/?no=${encodeURIComponent(r.no || '')}`}>
                        💰 이 공고로 바로투찰 계산하기 (기초 {wonShort(r.base)})
                      </Link>
                    ) : (
                      <div className="nocalc">
                        {stamp14(r.close) < now ? (
                          <>이미 <b>마감된 공고</b>라 투찰 계산은 하지 않습니다.</>
                        ) : (
                          <>아직 <b>바로투찰 계산이 안 됩니다</b> — 조달청 자료에
                            «{missingOf(r).join(' · ')}» 이 아직 안 실려 왔습니다.
                            자동 갱신 때마다 다시 받아오니 조금 뒤에 열어보세요.</>
                        )}
                      </div>
                    )}

                    <div className="kv2">
                      {r.main && <div><span>주공종</span><b>{r.main}</b></div>}
                      {r.site && <div><span>공사지역</span><b>{r.site}</b></div>}
                      {r.pmth && <div><span>예정가격</span>
                        <b>{r.pmth}{r.ptot ? ` · ${r.ptot}개 중 ${r.pdrw}개 추첨` : ''}</b></div>}
                      {r.kind && <div><span>공고종류</span><b>{r.kind}</b></div>}
                      {r.mthd && <div><span>계약방법</span><b>{r.mthd}</b></div>}
                      {r.swin && <div><span>낙찰방법</span><b>{r.swin}</b></div>}
                      {r.rgn && <div><span>참가지역</span><b>{r.rgn}</b></div>}
                      {r.ind && <div><span>참가업종</span><b>{r.ind}</b></div>}
                      {r.joint && <div><span>공동수급</span><b>{r.joint}</b></div>}
                      {r.rebid && <div><span>재입찰</span><b>{r.rebid === 'Y' ? '허용' : '불허'}</b></div>}
                      {r.dmnd && <div><span>수요기관</span><b>{r.dmnd}</b></div>}
                      {(r.ofcl || r.tel) && (
                        <div><span>담당</span><b>{[r.ofcl, r.tel].filter(Boolean).join(' · ')}</b></div>
                      )}

                      <div><span>공고번호</span><b>{r.no}{r.ord ? `-${r.ord}` : ''}</b></div>
                    </div>

                    {/* 공고문 첨부 — 조달청이 준 이름·주소 그대로입니다.
                        2026-09-05: 내역서를 갈래로 갈라 앞으로 올리고 뱃지를 붙였습니다.
                        «설계내역서» 에는 발주처 설계 단가가 들어 있어 가장 값어치가 큽니다. */}
                    {(r.docs || []).length > 0 && (
                      <div className="docs">
                        <div className="h">
                          공고문 첨부 <em>{r.docs.length}개 · 나라장터에서 바로 받습니다</em>
                        </div>
                        {[...r.docs]
                          .map((d, i) => [d, docRank(d[0]), i])
                          .sort((a, b) => a[1] - b[1] || a[2] - b[2])
                          .map(([[nm, u], rk]) => (
                            <a key={u} href={u} target="_blank" rel="noreferrer"
                              className={'doc' + (rk === 0 ? ' hot' : '')}>
                              <span className="di">{rk === 0 ? '💰' : rk === 1 ? '📑' : '📄'}</span>
                              <span className="dn">{nm}</span>
                              {rk === 0 && <b className="dtag">단가 있음</b>}
                            </a>
                          ))}
                      </div>
                    )}

                    <a className="btn ghost sm" style={{ width: '100%', marginTop: 10 }}
                      href={r.url || 'https://www.g2b.go.kr'} target="_blank" rel="noreferrer">
                      나라장터 원문 열기 ↗
                    </a>

                    <div className="note sm">
                      산출내역서·설계도서 같은 첨부파일은 나라장터에서만 받을 수 있습니다.
                      A값은 그 내역서에 있습니다.
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          {pages > 1 && (
            <div className="pager">
              <button className="btn ghost sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>이전</button>
              <span>{page} / {pages}</span>
              <button className="btn ghost sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>다음</button>
            </div>
          )}
        </>
      )}

      <div className="note" style={{ marginTop: 14 }}>
        공고 상세는 나라장터 원문으로 연결됩니다. 투찰 전 반드시 원문 공고서를 확인하세요.
        기초금액은 발주기관이 공개한 뒤부터 표시됩니다.
      </div>
    </>
  )
}

/* ── 💰 금액 거르개 한 줄 ────────────────────────────────────────
   알약은 «지름길» 이고, 진짜 답은 «직접 넣기» 입니다.
   알약만 두면 3억(국가 별표3/4 경계)처럼 한쪽에만 있는 마디를 못 고릅니다.
   ⚠️ 접어 둡니다 — 지역·면허 알약 아래 또 여섯 개를 늘어놓으면 화면이 무너집니다.
      단, 걸어 둔 것이 있으면 «펼치지 않아도» 무엇이 걸렸는지 보입니다. */
function AmtBar({ amt, setAmt }) {
  const [open, setOpen] = useState(false)
  const [lo, setLo] = useState(amt && amt.lo != null ? String(amt.lo) : '')
  const [hi, setHi] = useState(amt && amt.hi != null ? String(amt.hi) : '')

  const 넣기 = () => {
    const a = lo.trim() === '' ? null : Number(lo)
    const b = hi.trim() === '' ? null : Number(hi)
    if (a == null && b == null) { setAmt(null); return }
    if ((a != null && !(a >= 0)) || (b != null && !(b >= 0))) return
    /* 거꾸로 넣으셨으면 바로잡습니다 — 「10억부터 2억까지」 는 0건이 나옵니다 */
    if (a != null && b != null && a > b) { setLo(String(b)); setHi(String(a)); setAmt({ lo: b, hi: a }); return }
    setAmt({ lo: a, hi: b })
  }
  const 알약 = (c) => {
    const 같나 = amt && amt.lo === c.lo && amt.hi === c.hi
    if (같나) { setAmt(null); setLo(''); setHi(''); return }
    setAmt({ lo: c.lo, hi: c.hi })
    setLo(c.lo == null ? '' : String(c.lo)); setHi(c.hi == null ? '' : String(c.hi))
  }

  return (
    <div className="amtbar">
      <button className={'chip' + (amt ? ' on' : '')} onClick={() => setOpen((v) => !v)}>
        💰 금액{amt ? ` · ${amtLabel(amt)}` : ''} {open ? '▲' : '▼'}
      </button>
      {amt && (
        <button className="chip" onClick={() => { setAmt(null); setLo(''); setHi('') }}>지우기 ✕</button>
      )}
      {open && (
        <div className="amtbox">
          <div className="chips wrap">
            {AMT_CHIPS.map((c) => (
              <button key={c.t} type="button"
                className={'chip' + (amt && amt.lo === c.lo && amt.hi === c.hi ? ' on' : '')}
                onClick={() => 알약(c)}>{c.t}</button>
            ))}
          </div>
          <div className="amtin">
            <input className="inp" inputMode="decimal" value={lo} placeholder="얼마부터"
              onChange={(e) => setLo(e.target.value.replace(/[^0-9.]/g, ''))}
              onKeyDown={(e) => { if (e.key === 'Enter') 넣기() }} aria-label="얼마부터 (억)" />
            <span>억 ~</span>
            <input className="inp" inputMode="decimal" value={hi} placeholder="얼마까지"
              onChange={(e) => setHi(e.target.value.replace(/[^0-9.]/g, ''))}
              onKeyDown={(e) => { if (e.key === 'Enter') 넣기() }} aria-label="얼마까지 (억)" />
            <span>억</span>
            <button className="btn sm primary" onClick={넣기}>걸기</button>
          </div>
          <div className="note sm">
            <b>추정가격</b> 기준입니다 — 적격심사가 이 금액으로 갈립니다.
            한쪽만 적으시면 「얼마 이상」·「얼마 미만」이 됩니다.<br />
            법으로 갈리는 마디: 국가·조달청 <b>2 · 3 · 10 · 50 · 100억</b> ·
            지자체 <b>2 · 4 · 10억</b> (100억을 넘으면 적격심사가 아니라 종합심사입니다).
          </div>
        </div>
      )}
    </div>
  )
}
