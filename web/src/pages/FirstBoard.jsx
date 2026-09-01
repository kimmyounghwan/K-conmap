import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getOverview } from '../lib/data.js'
import { useBoard } from '../lib/useBoard.js'
import { Skeleton, Empty, Tile } from '../components.jsx'
import { ConvertedPrice, useBasePrice } from '../BasePrice.jsx'
import { won, wonShort, pct, num, dateTime, dateShort, REGIONS, inRegion } from '../lib/fmt.js'

const PAGE = 20
const KIND = 'con'   // 공사만 다룹니다 (용역 제외)

/** 기초금액 대비 몇 %인지 — 공고서에 기초금액이 실려 있을 때만 */
const rateOf = (amt, base) =>
  base > 0 && amt > 0 ? Math.round((amt / base) * 100000) / 1000 : null

export default function FirstBoard() {
  const { info, rows: all, loading, busy, done, loadMore, loadAll } = useBoard('first', KIND)
  const [ov, setOv] = useState(null)
  const [region, setRegion] = useState('전국')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(null)
  const { setBase } = useBasePrice()

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

                {isOpen && (
                  <div className="detail">
                    <div className="kv">
                      <div>
                        <span>기초금액</span>
                        <b>{r.base > 0 ? won(r.base) : '공개 안 됨'}</b>
                      </div>
                      <div>
                        <span>낙찰가 (1순위)</span>
                        <b className="hi">{won(winAmt)}</b>
                      </div>
                      <div>
                        <span>투찰률</span>
                        <b>{r.rate != null ? pct(r.rate, 3) : pct(rateOf(winAmt, r.base), 3)}</b>
                      </div>
                      <div>
                        <span>예가범위</span>
                        <b>{r.lo != null && r.hi != null ? `${r.lo}% ~ ${r.hi}%` : '-'}</b>
                      </div>
                    </div>

                    {r.base > 0 && (
                      <button
                        className="btn sm"
                        style={{ width: '100%', marginBottom: 10 }}
                        onClick={(e) => { e.stopPropagation(); setBase(r.base) }}>
                        이 공고의 기초금액({wonShort(r.base)})으로 사이트 전체 계산하기
                      </button>
                    )}

                    <div className="detail-h">참여업체 (상위 {(r.corps || []).length}곳)</div>
                    {(r.corps || []).map((c, j) => {
                      const cr = c[2] != null ? c[2] : rateOf(c[1], r.base)
                      return (
                        <div className="row" key={j}>
                          <span className={'badge ' + (j === 0 ? 'g' : 'n')}>{j + 1}위</span>
                          <div className="grow">
                            <div className="t">{c[0]}</div>
                            <div className="d">{won(c[1])}</div>
                          </div>
                          <span className="r">
                            {cr != null ? pct(cr, 3) : '-'}
                            {c[2] != null && <><br /><ConvertedPrice rate={c[2]} /></>}
                          </span>
                        </div>
                      )
                    })}

                    <div className="btn-row" style={{ marginTop: 10 }}>
                      <Link className="btn ghost sm" style={{ flex: 1 }}
                        to={`/agency/${encodeURIComponent(r.inst)}`}
                        onClick={(e) => e.stopPropagation()}>
                        이 기관 분석 보기
                      </Link>
                      <button className="btn ghost sm" style={{ flex: 1 }}
                        onClick={(e) => { e.stopPropagation(); navigator.clipboard?.writeText(r.no || '') }}>
                        공고번호 복사
                      </button>
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
