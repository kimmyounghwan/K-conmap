import { createContext, useContext, useEffect, useState } from 'react'
import { won, wonShort } from './lib/fmt.js'

/* ============================================================
   기초금액 상시 입력 — 이 사이트의 핵심 차별점

   입찰 사이트들은 공통적으로 "투찰률"만 보여줍니다.
   하지만 소장님이 실제로 알고 싶은 건 "그래서 얼마 쓰냐" 입니다.
   그때마다 계산기를 열어 기초금액을 다시 넣는 게 기존 흐름이었습니다.

   여기서는 상단에 기초금액을 한 번 넣어두면
   1순위 목록·기관 분석·계산기까지 모든 화면의 투찰률이
   곧바로 "내 금액"으로 환산돼 보입니다.

   값은 브라우저에만 저장합니다. 서버로 보내지 않습니다.
   ============================================================ */

const KEY = 'kcm_base_price'
const Ctx = createContext({ base: 0, setBase: () => {} })

export function BasePriceProvider({ children }) {
  const [base, setBase] = useState(() => {
    try { return Number(localStorage.getItem(KEY)) || 0 } catch { return 0 }
  })
  useEffect(() => {
    try {
      if (base > 0) localStorage.setItem(KEY, String(base))
      else localStorage.removeItem(KEY)
    } catch { /* 시크릿 모드 등 */ }
  }, [base])
  return <Ctx.Provider value={{ base, setBase }}>{children}</Ctx.Provider>
}

export const useBasePrice = () => useContext(Ctx)

/** 투찰률 → 내 기초금액 기준 금액. 기초금액이 없으면 null */
export function priceAt(base, rate) {
  if (!base || rate === null || rate === undefined || Number.isNaN(rate)) return null
  return Math.floor((base * Number(rate)) / 100)
}

/** 목록에서 투찰률 옆에 조용히 붙는 환산 금액 */
export function ConvertedPrice({ rate, short = true }) {
  const { base } = useBasePrice()
  const v = priceAt(base, rate)
  if (v === null) return null
  return <span className="conv" title={`내 기초금액 기준 ${won(v)}`}>{short ? wonShort(v) : won(v)}</span>
}

/* ── 상단 바에 들어가는 입력칸 ───────────────── */
export function BasePriceField() {
  const { base, setBase } = useBasePrice()
  const [open, setOpen] = useState(false)
  const show = base ? base.toLocaleString('ko-KR') : ''

  if (!open && !base) {
    return (
      <button className="basebtn" onClick={() => setOpen(true)}>
        <span className="basebtn-ic">₩</span>
        기초금액 넣기
      </button>
    )
  }

  return (
    <div className="basefield">
      <label htmlFor="kcm-base">기초금액</label>
      <input
        id="kcm-base"
        inputMode="numeric"
        autoFocus={open && !base}
        value={show}
        placeholder="350,000,000"
        onChange={(e) => {
          const raw = e.target.value.replace(/[^0-9]/g, '')
          setBase(raw ? Number(raw) : 0)
        }}
        onBlur={() => { if (!base) setOpen(false) }}
      />
      {base > 0 && (
        <button className="baseclear" onClick={() => { setBase(0); setOpen(false) }} title="지우기">✕</button>
      )}
    </div>
  )
}
