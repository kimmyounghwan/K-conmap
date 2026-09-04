import { useEffect, useMemo, useState } from 'react'
import { getOverview } from '../lib/data.js'
import NoticeDetail, { scoreState, NoticeLink } from '../NoticeDetail.jsx'
import { useBoard } from '../lib/useBoard.js'
import { Skeleton, Empty, Tile } from '../components.jsx'
import { won, wonShort, pct, num, dateTime, dateShort, REGIONS, inRegion } from '../lib/fmt.js'

const PAGE = 20
const KIND = 'con'   // 공사만 다룹니다 (용역 제외)

export default function FirstBoard() {
  const [ov, setOv] = useState(null)
  const [region, setRegion] = useState('전국')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(null)

  /* ── 검색·지역선택은 «색인»으로 합니다 — 2026-09-03 ──────────────
     전에는 걸러내려고 7주치 묶음을 전부 받았습니다(1,528KB).
     이제 걸러내기에 필요한 칸만 담은 색인(358KB)을 받아 정확히 세고,
     **그 쪽에 나올 20건이 든 묶음만** 받습니다.
     ⚠️ 색인 한 줄의 순서는 collect.py 가 정합니다: [공고명, 기관, 낙찰업체].
        바꾸려면 두 곳을 같이 고치세요 — selfcheck 가 대조합니다. */
  const filtering = q.trim().length > 0 || region !== '전국'
  const match = useMemo(() => {
    if (!filtering) return null
    const s = q.trim()
    return (a) => {
      const [name, inst, win] = a
      if (!inRegion({ name, inst }, region)) return false
      if (!s) return true
      return (name || '').includes(s) || (inst || '').includes(s) || (win || '').includes(s)
    }
  }, [filtering, q, region])

  const { info, rows: all, pageRows, pageReady, total, indexReady, loading, busy } =
    useBoard('first', KIND, { match, page, perPage: PAGE })

  useEffect(() => { getOverview().then(setOv) }, [])
  useEffect(() => { setPage(1) }, [region, q])

  /* 검색 중이면 색인이 센 «전체 건수»가 정확합니다.
     검색이 아니면 받아 둔 것에서 셉니다(첫 묶음 500건). */
  /* 전체 건수는 useBoard 가 «7주 전체»로 셉니다 — 검색 중이면 색인에서, 아니면 목록표(meta)에서.
     ⚠️ 받아 둔 것(all.length)으로 세면 25쪽(500건 ≈ 개찰 이틀치)에서 끝납니다 — 2026-09-03 실제 사고. */
  const count = total != null ? total : all.length
  const pages = Math.max(1, Math.ceil(count / PAGE))
  const view = pageRows != null ? pageRows : all.slice((page - 1) * PAGE, page * PAGE)
  const rows = view
  const done = filtering ? indexReady : true     // 검색 중이면 색인이 와야 «다 셌다»
  const newest = all.length ? String(all[0].dt || '').slice(0, 10) : ''

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

      {newest && (
        <div className="freshbar">
          <b>최근 개찰 {newest}</b>
          <span>개찰의 69%는 오전 11시에 열립니다 · 결과는 조달청에 올라오는 대로 30분마다 받아옵니다{ov?.built ? ` · 마지막 집계 ${ov.built}` : ''}</span>
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

      <RangeBar info={info} loaded={all.length} done={done} busy={busy} filtering={filtering} count={count} />

      {loading || (filtering && !done) || !pageReady ? <Skeleton /> : rows.length === 0 ? (
        <Empty icon="🔎">
          조건에 맞는 개찰 결과가 없습니다.<br />지역을 넓히거나 검색어를 지워보세요.
        </Empty>
      ) : (
        <>
          <div className="sec-title">
            {/* 검색 중엔 색인이 «7주 전체»에서 센 건수입니다 — 화면에 20건만 보여도 정확합니다.
                (전에는 받아 둔 것만 세어서 «500건 중 몇 건» 이 되곤 했습니다) */}
            결과 <span className="count">{num(count)}건{filtering && ' (7주 전체)'}</span>
            {/* ★ 날짜별 성적표로 가는 길 — <a href> 여야 정적 HTML 의 ddata 가 옵니다 */}
            <a className="daylink" href="/daily">📅 날짜별 성적표 →</a>
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
                  {/* 몇 곳이 붙었는지 목록에서 바로 보이게 합니다 —
                      «펼쳤더니 1곳뿐» 을 미리 알 수 있습니다. */}
                  {(r.np > 1 || r.nrank > 1) && (
                    <span className="badge c">
                      🏅 {num(Math.max(r.np || 0, r.nrank || 0))}곳 경쟁
                    </span>
                  )}
                  {(r.np === 1 || r.nrank === 1) && (
                    <span className="badge n">단독 1곳</span>
                  )}
                  {/* ★ 채점이 되는 자리인지 «펼치기 전에» 보여줍니다 — 2026-09-03.
                      판단은 NoticeDetail 의 scoreState 하나만 씁니다(규칙을 두 번 안 적습니다). */}
                  {(() => {
                    const st = scoreState(r)
                    if (st.ok) return <span className="badge b">📊 채점 가능</span>
                    if (st.why === 'grade') {
                      return (
                        <span className="badge n"
                          title={`${st.grade.key}등급(${st.grade.label}) — 실측 958건에서 이 등급은 한 건도 못 땄습니다. 누가 계산해도 같은 자리라 채점이 성립하지 않습니다.`}>
                          채점 안 함 · {st.grade.key}등급
                        </span>
                      )
                    }
                    return (
                      <span className="badge n"
                        title={`조달청 자료에 «${(st.miss || []).join(' · ')}» 이 안 실려 왔습니다. 반쯤 아는 값으로 채점하면 «가져갔을 자리»가 남발됩니다.`}>
                        채점 불가 · 값 부족
                      </span>
                    )
                  })()}
                </div>
                <div className="foot">
                  <span className="badge g">1순위</span>
                  <span className="win">{r.win}</span>
                  <span className="spacer" style={{ flex: 1 }} />
                  <span className="amt">{wonShort(winAmt)}</span>
                  <NoticeLink no={r.no} compact />
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
export function RangeBar({ info, loaded, done, busy, filtering, count }) {
  if (!info) return null
  const range = info.from && info.to
    ? `${dateShort(info.from)} ~ ${dateShort(info.to)}` : ''
  /* 2026-09-03 — 이제 목록을 «전부» 받지 않습니다.
     그래서 「불러오는 중 500 / 11,271건」 같은 문구는 사실과 다릅니다
     (덜 받은 게 아니라, 안 받아도 되는 것을 안 받은 것입니다).
     검색 중이면 색인이 7주 전체에서 센 건수를, 아니면 최근 몇 건인지를 보여줍니다. */
  return (
    <div className="rangebar">
      <span className="rb-t">
        {filtering
          ? (done
              ? <>7주 전체 <b>{num(info.n)}건</b>에서 찾음{range && <> · {range}</>}</>
              : <>7주 전체를 뒤지는 중…{range && <> · {range}</>}</>)
          : <>7주 전체 <b>{num(info.n)}건</b>{range && <> · {range}</>} · 쪽을 넘기면 이어서 받습니다
              {busy && ' · 받는 중'}</>}
      </span>
    </div>
  )
}
