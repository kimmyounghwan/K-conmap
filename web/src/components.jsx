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
