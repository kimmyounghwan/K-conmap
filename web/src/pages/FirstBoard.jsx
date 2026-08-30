import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getFirst, getOverview } from '../lib/data.js'
import { Skeleton, Empty, Tile } from '../components.jsx'
import { won, wonShort, pct, num, dateTime, REGIONS, inRegion } from '../lib/fmt.js'

const PAGE = 20

export default function FirstBoard() {
  const [data, setData] = useState(null)
  const [ov, setOv] = useState(null)
  const [kind, setKind] = useState('con')
  const [region, setRegion] = useState('전국')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(null)

  useEffect(() => {
    getFirst().then((d) => setData(d || { built: '', con: [], serv: [] }))
    getOverview().then(setOv)
  }, [])
  useEffect(() => { setPage(1) }, [kind, region, q])

  const rows = useMemo(() => {
    const src = (data && data[kind]) || []
    const s = q.trim()
    return src.filter((r) =>
      inRegion(r, region) &&
      (!s || (r.name || '').includes(s) || (r.inst || '').includes(s) || (r.win || '').includes(s))
    )
  }, [data, kind, region, q])

  const pages = Math.max(1, Math.ceil(rows.length / PAGE))
  const view = rows.slice((page - 1) * PAGE, page * PAGE)

  return (
    <>
      <div className="sec-title" style={{ marginTop: 14 }}>
        🏆 1순위 현황판
        <span className="count">· 최근 개찰 결과</span>
      </div>

      {ov && (
        <div className="tiles c4" style={{ marginBottom: 10 }}>
          <Tile k="누적 데이터" v={num(ov.rows)} small />
          <Tile k="발주기관" v={num(ov.agencies)} small />
          <Tile k="업체" v={num(ov.corps)} small />
          <Tile k="최근 개찰" v={num((data?.con?.length || 0) + (data?.serv?.length || 0))} small />
        </div>
      )}

      <div className="seg">
        <button className={kind === 'con' ? 'on' : ''} onClick={() => setKind('con')}>공사</button>
        <button className={kind === 'serv' ? 'on' : ''} onClick={() => setKind('serv')}>용역</button>
      </div>

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

      {!data ? <Skeleton /> : rows.length === 0 ? (
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
            return (
              <div className="notice" key={id} onClick={() => setOpen(isOpen ? null : id)}>
                <h3>{r.name}</h3>
                <div className="meta">
                  <span className="inst">{r.inst}</span>
                  <span>·</span>
                  <span>{dateTime(r.dt)}</span>
                  {r.rate != null && <span className="badge b">{pct(r.rate, 3)}</span>}
                </div>
                <div className="foot">
                  <span className="badge g">1순위</span>
                  <span className="win">{r.win}</span>
                  <span className="spacer" style={{ flex: 1 }} />
                  <span className="amt">{wonShort(r.amt)}</span>
                </div>

                {isOpen && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--line)' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 6 }}>
                      참여업체 (상위 {(r.corps || []).length}곳)
                    </div>
                    {(r.corps || []).map((c, j) => (
                      <div className="row" key={j}>
                        <span className="badge n">{j + 1}위</span>
                        <div className="grow">
                          <div className="t">{c[0]}</div>
                          <div className="d">{won(c[1])}</div>
                        </div>
                        <span className="r">{c[2] != null ? pct(c[2], 3) : '-'}</span>
                      </div>
                    ))}
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

      {data?.built && (
        <div className="note" style={{ marginTop: 14 }}>
          마지막 수집: {data.built} · 조달청 나라장터 개찰 결과를 하루 여러 차례 모아 정리합니다.
        </div>
      )}
    </>
  )
}
