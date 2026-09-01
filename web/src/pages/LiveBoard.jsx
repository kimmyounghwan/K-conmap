import { useEffect, useMemo, useState } from 'react'
import { useBoard } from '../lib/useBoard.js'
import { Skeleton, Empty } from '../components.jsx'
import { useBasePrice } from '../BasePrice.jsx'
import { RangeBar } from './FirstBoard.jsx'
import { won, wonShort, num, dateTime, dday, REGIONS, inRegion, LICENSES, licenseKeywords } from '../lib/fmt.js'

const PAGE = 20
const KIND = 'con'   // 공사만 다룹니다 (용역 제외)
const LS_KEY = 'kcm_licenses'

/** 회원가입 없이도 '내 면허 맞춤매칭'이 되도록 브라우저에만 저장한다 */
function loadLicenses() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] }
}
function saveLicenses(v) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(v)) } catch { /* 사파리 시크릿 모드 등 */ }
}

export default function LiveBoard() {
  const { info, rows: all, loading, busy, done, loadMore, loadAll } = useBoard('live', KIND)
  const [region, setRegion] = useState('전국')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [mine, setMine] = useState(false)
  const [lics, setLics] = useState(loadLicenses)
  const [editLic, setEditLic] = useState(false)
  const [open, setOpen] = useState(null)
  const { setBase } = useBasePrice()

  useEffect(() => { setPage(1) }, [region, q, mine, lics])
  useEffect(() => { saveLicenses(lics) }, [lics])

  const keywords = useMemo(
    () => [...new Set(lics.flatMap(licenseKeywords))], [lics])

  // 검색·지역·면허 맞춤을 쓰면 7주 전체를 뒤에서 받아온다
  useEffect(() => {
    if (!done && (q.trim().length > 0 || region !== '전국' || mine)) loadAll()
  }, [q, region, mine, done, loadAll])


  const rows = useMemo(() => {
    const s = q.trim()
    return all.filter((r) => {
      if (!inRegion(r, region)) return false
      if (s && !((r.name || '').includes(s) || (r.inst || '').includes(s))) return false
      if (mine && keywords.length) {
        if (!keywords.some((k) => (r.name || '').includes(k))) return false
      }
      return true
    })
  }, [all, region, q, mine, keywords])

  const pages = Math.max(1, Math.ceil(rows.length / PAGE))
  const view = rows.slice((page - 1) * PAGE, page * PAGE)

  // 마지막 쪽 근처까지 넘겨보면 알아서 더 받아온다 (7주 끝까지 이어짐)
  //  ⚠️ rows / pages 가 만들어진 뒤에 와야 합니다. 위에 두면 참조 오류가 납니다.
  useEffect(() => {
    if (!done && page >= pages - 1) loadMore()
  }, [page, pages, done, loadMore])

  const toggleLic = (l) =>
    setLics((v) => (v.includes(l) ? v.filter((x) => x !== l) : [...v, l]))

  return (
    <>
      <div className="sec-title" style={{ marginTop: 14 }}>
        📋 공사 입찰공고 <span className="count">· 나라장터 · 카드를 누르면 기초금액</span>
      </div>

      <input value={q} onChange={(e) => setQ(e.target.value)}
        placeholder="공고명 · 발주기관 검색" style={{ marginBottom: 10 }} />

      <div className="chips">
        <button className={'chip' + (mine ? ' on' : '')}
          onClick={() => (lics.length ? setMine(!mine) : setEditLic(true))}>
          ✨ 내 면허 맞춤{lics.length ? ` (${lics.length})` : ''}
        </button>
        {REGIONS.map((r) => (
          <button key={r} className={'chip' + (region === r ? ' on' : '')} onClick={() => setRegion(r)}>{r}</button>
        ))}
      </div>

      {(editLic || (mine && !lics.length)) && (
        <div className="card">
          <div className="sec-title" style={{ margin: '0 0 8px' }}>보유 면허 선택</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {LICENSES.map((l) => (
              <button key={l} className={'chip' + (lics.includes(l) ? ' on' : '')}
                onClick={() => toggleLic(l)}>{l}</button>
            ))}
          </div>
          <div className="note" style={{ marginTop: 10 }}>
            선택한 면허는 이 브라우저에만 저장됩니다. 서버로 보내지 않고, 회원가입도 필요 없습니다.
          </div>
          <button className="btn" style={{ marginTop: 10 }}
            onClick={() => { setEditLic(false); if (lics.length) setMine(true) }}>
            완료
          </button>
        </div>
      )}

      {!editLic && lics.length > 0 && (
        <button className="btn ghost sm" style={{ marginBottom: 8 }} onClick={() => setEditLic(true)}>
          면허 다시 고르기
        </button>
      )}

      <RangeBar info={info} loaded={all.length} done={done} busy={busy} />

      {loading ? <Skeleton /> : rows.length === 0 ? (
        <Empty icon="📭">
          조건에 맞는 공고가 없습니다.<br />
          {mine ? '면허 맞춤을 끄거나 면허를 추가해보세요.' : '지역을 넓히거나 검색어를 지워보세요.'}
        </Empty>
      ) : (
        <>
          <div className="sec-title">공고 <span className="count">{num(rows.length)}건</span></div>
          {view.map((r, i) => {
            const id = `${r.no}-${i}`
            const isOpen = open === id
            const dd = dday(r.close)
            return (
              <div className="notice" key={id} onClick={() => setOpen(isOpen ? null : id)}>
                <h3>{r.name}</h3>
                <div className="meta">
                  <span className="inst">{r.inst}</span>
                  <span>·</span>
                  <span>{dateTime(r.dt)}</span>
                  {dd && <span className={'badge ' + dd.tone}>{dd.text}</span>}
                  {r.base > 0 && <span className="badge n">기초 {wonShort(r.base)}</span>}
                </div>
                <div className="foot">
                  <span className="badge n">추정가격</span>
                  <span className="amt">{wonShort(r.budget)}</span>
                  <span style={{ flex: 1 }} />
                  <span className="caret">{isOpen ? '▲' : '▼'}</span>
                </div>

                {isOpen && (
                  <div className="detail">
                    <div className="kv">
                      <div>
                        <span>기초금액</span>
                        <b className="hi">{r.base > 0 ? won(r.base) : '아직 공개 안 됨'}</b>
                      </div>
                      <div>
                        <span>추정가격</span>
                        <b>{won(r.budget)}</b>
                      </div>
                      <div>
                        <span>예가범위</span>
                        <b>{r.lo != null && r.hi != null ? `${r.lo}% ~ ${r.hi}%` : '-'}</b>
                      </div>
                      <div>
                        <span>입찰마감</span>
                        <b>{dateTime(r.close)}</b>
                      </div>
                    </div>

                    {r.base > 0 && (
                      <button className="btn sm" style={{ width: '100%', marginBottom: 10 }}
                        onClick={(e) => { e.stopPropagation(); setBase(r.base) }}>
                        이 공고의 기초금액({wonShort(r.base)})으로 사이트 전체 계산하기
                      </button>
                    )}

                    <div className="btn-row">
                      <a className="btn ghost sm" style={{ flex: 1 }}
                        href={r.url || 'https://www.g2b.go.kr'} target="_blank" rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}>
                        나라장터 원문 열기
                      </a>
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

      <div className="note" style={{ marginTop: 14 }}>
        공고 상세는 나라장터 원문으로 연결됩니다. 투찰 전 반드시 원문 공고서를 확인하세요.
        기초금액은 발주기관이 공개한 뒤부터 표시됩니다.
      </div>
    </>
  )
}
