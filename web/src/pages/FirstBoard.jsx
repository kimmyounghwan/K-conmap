import { useEffect, useMemo, useState } from 'react'
import { getOverview } from '../lib/data.js'
import NoticeDetail from '../NoticeDetail.jsx'
import { useBoard } from '../lib/useBoard.js'
import { Skeleton, Empty, Tile } from '../components.jsx'
import { ConvertedPrice } from '../BasePrice.jsx'
import { won, wonShort, pct, num, dateTime, dateShort, REGIONS, inRegion } from '../lib/fmt.js'

const PAGE = 20
const KIND = 'con'   // 공사만 다룹니다 (용역 제외)

export default function FirstBoard() {
  const { info, rows: all, loading, busy, done, loadMore, loadAll } = useBoard('first', KIND)
  const [ov, setOv] = useState(null)
  const [region, setRegion] = useState('전국')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(null)

  useEffect(() => { getOverview().then(setOv) }, [])
  useEffect(() => { setPage(1) }, [region, q])

  // 검색하거나 지역을 고르면 7주 전체를 뒤에서 받아온다
  useEffect(() => {
    if (!done && (q.trim().length > 0 || region !== '전국')) loadAll()
  }, [q, region, done, loadAll])


  const rows = useMemo(() => {
    const s = q.trim()
    return all.filter((r) =>
      inRegion(r, region) &&
      (!s || (r.name || '').includes(s) || (r.inst || '').includes(s) || (r.win || '').includes(s))
    )
  }, [all, region, q])

  const pages = Math.max(1, Math.ceil(rows.length / PAGE))
  const view = rows.slice((page - 1) * PAGE, page * PAGE)

  // 마지막 쪽 근처까지 넘겨보면 알아서 더 받아온다 (7주 끝까지 이어짐)
  //  ⚠️ rows / pages 가 만들어진 뒤에 와야 합니다. 위에 두면 참조 오류가 납니다.
  useEffect(() => {
    if (!done && page >= pages - 1) loadMore()
  }, [page, pages, done, loadMore])

  return (
    <>
      <div className="sec-title" style={{ marginTop: 14 }}>
        🏆 1순위 현황판
        <span className="count">· 공사 개찰 결과 · 카드를 누르면 기초금액·낙찰가</span>
      </div>

      {ov && (
        <div className="tiles c4" style={{ marginBottom: 10 }}>
          <Tile k="누적 데이터" v={num(ov.rows)} small />
          <Tile k="발주기관" v={num(ov.agencies)} small />
          <Tile k="업체" v={num(ov.corps)} small />
          <Tile k="최근 개찰" v={num(info?.n)} small />
        </div>
      )}

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="공고명 · 발주기관 · 낙찰업체 검색"
        style={{ marginBottom: 10 }}
      />

      <div className="chips">
        {REGIONS.map((r) => (
          <button key={r} className={'chip' + (region === r ? ' on' : '')} onClick={() => setRegion(r)}>{r}</button>
        ))}
      </div>

      <RangeBar info={info} loaded={all.length} done={done} busy={busy} />

      {loading ? <Skeleton /> : rows.length === 0 ? (
        <Empty icon="🔎">
          조건에 맞는 개찰 결과가 없습니다.<br />지역을 넓히거나 검색어를 지워보세요.
        </Empty>
      ) : (
        <>
          <div className="sec-title">
            결과 <span className="count">{num(rows.length)}건</span>
          </div>

          {view.map((r, i) => {
            const id = `${r.no}-${i}`
            const isOpen = open === id
            const winAmt = r.sAmt || r.amt
            return (
              <div className="notice" key={id} onClick={() => setOpen(isOpen ? null : id)}>
                <h3>{r.name}</h3>
                <div className="meta">
                  <span className="inst">{r.inst}</span>
                  <span>·</span>
                  <span>{dateTime(r.dt)}</span>
                  {r.rate != null && <span className="badge b">{pct(r.rate, 3)}</span>}
                  {r.base > 0 && <span className="badge n">기초 {wonShort(r.base)}</span>}
                  {r.rate != null && <ConvertedPrice rate={r.rate} />}
                </div>
                <div className="foot">
                  <span className="badge g">1순위</span>
                  <span className="win">{r.win}</span>
                  <span className="spacer" style={{ flex: 1 }} />
                  <span className="amt">{wonShort(winAmt)}</span>
                  <span className="caret">{isOpen ? '▲' : '▼'}</span>
                </div>

                {isOpen && <NoticeDetail r={r} />}
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
    </>
  )
}

/** 지금 몇 건을 보고 있는지 + 7주 전체 불러오기 */
export function RangeBar({ info, loaded, done, busy }) {
  if (!info) return null
  const range = info.from && info.to
    ? `${dateShort(info.from)} ~ ${dateShort(info.to)}` : ''
  return (
    <div className="rangebar">
      <span className="rb-t">
        {done
          ? <>7주 전체 <b>{num(info.n)}건</b>{range && <> · {range}</>}</>
          : <>불러오는 중 <b>{num(loaded)}</b> / {num(info.n)}건{range && <> · {range}</>}</>}
      </span>
    </div>
  )
}
