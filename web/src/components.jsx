import { useEffect, useRef, useState } from 'react'
import { searchAgency, getAgencyTop } from './lib/data.js'
import { num, pct } from './lib/fmt.js'

/* ── 상태 표시 ────────────────────────── */
export const Skeleton = ({ n = 4 }) => (
  <div>{Array.from({ length: n }).map((_, i) => <div className="skel" key={i} />)}</div>
)

export const Empty = ({ icon = '📭', children }) => (
  <div className="empty"><div className="big">{icon}</div>{children}</div>
)

export const Tile = ({ k, v, small }) => (
  <div className="tile"><div className="k">{k}</div><div className={'v' + (small ? ' sm' : '')}>{v}</div></div>
)

/* ── 가로 막대 ────────────────────────── */
export function Bars({ rows, unit = '%', hotFirst = true, mark }) {
  if (!rows || !rows.length) return null
  const max = Math.max(...rows.map((r) => r[1])) || 1
  return (
    <div className="bars">
      {rows.map(([label, v], i) => (
        <div className="bar-row" key={label + i}>
          <span className="lab">{typeof label === 'number' ? label.toFixed(label % 1 ? 2 : 1) + unit : label}</span>
          <div className="bar-track">
            <div
              className={'bar-fill' + (mark !== undefined && label === mark ? ' mine' : (hotFirst && i === 0 ? ' hot' : ''))}
              style={{ width: Math.max(4, (v / max) * 100) + '%' }}
            />
          </div>
          <span className="val">{num(v)}건</span>
        </div>
      ))}
    </div>
  )
}

/* ── 월별 12칸 ────────────────────────── */
export function Months({ data }) {
  if (!data || !data.length) return null
  const max = Math.max(...data) || 1
  const peak = data.indexOf(max)
  return (
    <>
      <div className="months">
        {data.map((v, i) => (
          <div key={i} className={'m' + (i === peak ? ' peak' : '')}
            style={{ height: Math.max(3, (v / max) * 100) + '%' }} title={`${i + 1}월 ${v}건`} />
        ))}
      </div>
      <div className="month-labs">
        {data.map((_, i) => <span key={i}>{i + 1}</span>)}
      </div>
    </>
  )
}

/* ── 발주기관 검색 ────────────────────────
   한글 입력(IME)이 깨지지 않도록 입력값은 로컬 state 로만 관리하고
   검색은 250ms 디바운스 후에 돈다. (사라사에서 겪은 'ㄱ가강' 버그 방지)
   ------------------------------------------ */
export function AgencyPicker({ value, onPick, label = '발주기관', autoFocus }) {
  const [q, setQ] = useState(value || '')
  const [list, setList] = useState([])
  const [top, setTop] = useState([])
  const [open, setOpen] = useState(false)
  const timer = useRef(null)

  useEffect(() => { getAgencyTop().then((t) => setTop(t || [])) }, [])
  useEffect(() => { setQ(value || '') }, [value])

  useEffect(() => {
    clearTimeout(timer.current)
    const s = q.trim()
    if (s.length < 1 || s === value) { setList([]); return }
    timer.current = setTimeout(() => {
      searchAgency(s).then((r) => { setList(r); setOpen(true) })
    }, 250)
    return () => clearTimeout(timer.current)
  }, [q, value])

  const pick = (name, chunk) => {
    setQ(name); setOpen(false); setList([])
    onPick({ name, chunk })
  }

  return (
    <div className="field">
      <label>{label} <span className="hint">— 이름 일부만 입력해도 됩니다</span></label>
      <input
        value={q}
        autoFocus={autoFocus}
        placeholder="예: 여수시, 한국도로공사, ○○교육청"
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setOpen(true)}
      />
      {open && list.length > 0 && (
        <div className="suggest">
          {list.map((a) => (
            <button key={a.name} onClick={() => pick(a.name, a.chunk)}>
              <span className="c">{num(a.n)}건</span>{a.name}
            </button>
          ))}
        </div>
      )}
      {open && !q.trim() && top.length > 0 && (
        <div className="suggest">
          {top.slice(0, 20).map(([name, n, chunk]) => (
            <button key={name} onClick={() => pick(name, chunk)}>
              <span className="c">{num(n)}건</span>{name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── 금액 입력 (천단위 콤마) ──────────── */
export function MoneyInput({ value, onChange, placeholder = '예: 350,000,000' }) {
  const show = value ? Number(value).toLocaleString('ko-KR') : ''
  return (
    <input
      inputMode="numeric"
      value={show}
      placeholder={placeholder}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^0-9]/g, '')
        onChange(raw ? Number(raw) : 0)
      }}
    />
  )
}

export const RateText = ({ v }) => <span className="amt">{pct(v, 3)}</span>

/* 📋 2026-09-15 — 「내역서 작성」 띠 (소장님: 「이게 메인이니까. 눈에 잘 띄게」)
 *
 * 유료 화면은 이것 하나뿐입니다. 그런데 사람들은 /naeyeok 을 찾아 들어오지 않습니다 —
 * 공고를 보러, 투찰금액을 보러 옵니다. 그 길목에 한 줄 놓습니다.
 *
 * ⚠️ 광고처럼 만들면 눈이 알아서 건너뜁니다. 그래서 색을 튀기지 않고
 *    «지금 화면에서 하던 일과 이어지는 한 문장»으로 씁니다.
 *    바로투찰 → 「투찰금액을 정하셨습니까? 다음은 내역서입니다」
 *    1순위·구인구직 → 「낙찰되셨습니까? 착공신고 때 산출내역서를 내셔야 합니다」
 */
export function NaeyeokStrip({ tone = 'win' }) {
  const line = tone === 'bid'
    ? <><b>투찰금액을 정하셨습니까?</b> 낙찰되면 <b>산출내역서</b>를 내셔야 합니다.</>
    : <><b>낙찰되셨습니까?</b> 착공신고 때 <b>산출내역서</b>를 내셔야 합니다.</>
  return (
    <a href="/naeyeok" className="naeyeok-strip">
      <span className="ns-ic">📋</span>
      <span className="ns-txt">{line}</span>
      <span className="ns-go">작성해 드립니다 →</span>
    </a>
  )
}

/* ── 💰 값 방침 — 값을 받는 화면 셋(/naeyeok · /jeoksan · /safety)에 같이 붙입니다 ──
   2026-09-20 소장님: 「건설맵은 타 업체에 비해 최대한 저렴한 비용으로 모든 작업을 할 예정이다.
   이걸 강조해줘. 유료로 하겠다는 데는… 왜냐하면, 같은 현장을 알기 때문에…
   최대한 현장에 보탬이 될 수 있도록 운영할 예정」

   ⚠️ 「제일 싸다」 처럼 재 볼 수 없는 말은 쓰지 않습니다 — 근거 없는 광고가 됩니다.
      대신 «우리가 어떻게 하겠다» 는 약속과 «왜» 를 적습니다. 지킬 수 있는 말만 씁니다.
   ⚠️ 세 화면이 다른 말을 하면 안 됩니다. 그래서 여기 한 곳에만 둡니다. */
export function PriceStance() {
  return (
    <div className="card" style={{ borderColor: 'var(--accent-line)', background: 'var(--accent-soft)' }}>
      <div className="detail-h" style={{ marginBottom: 8 }}>💰 값은 최대한 낮게 잡습니다</div>
      <p style={{ margin: '0 0 10px', lineHeight: 1.85 }}>
        <b>저도 현장에 있습니다.</b> 서류 하나 맡기는 데 얼마가 드는지,
        그게 현장에 얼마나 부담인지 압니다.
      </p>
      <p style={{ margin: '0 0 10px', lineHeight: 1.85 }}>
        그래서 이 일로 크게 남길 생각이 없습니다.{' '}
        <b>현장에 보탬이 되는 쪽으로 운영하겠습니다.</b>{' '}
        건설맵의 나머지를 계속 무료로 두는 것도 같은 까닭입니다.
      </p>
      <p className="muted" style={{ margin: 0, lineHeight: 1.85 }}>
        맡기시던 곳이 있으시면 <b>그 값을 말씀해 주십시오.</b> 맞춰 드리겠습니다.
      </p>
    </div>
  )
}
