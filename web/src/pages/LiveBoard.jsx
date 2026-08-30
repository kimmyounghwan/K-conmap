import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getLive } from '../lib/data.js'
import { Skeleton, Empty } from '../components.jsx'
import { wonShort, num, dateTime, dday, REGIONS, inRegion, LICENSES, licenseKeywords } from '../lib/fmt.js'

const PAGE = 20
const LS_KEY = 'kcm_licenses'

/** 회원가입 없이도 '내 면허 맞춤매칭'이 되도록 브라우저에만 저장한다 */
function loadLicenses() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] }
}
function saveLicenses(v) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(v)) } catch { /* 사파리 시크릿 모드 등 */ }
}

export default function LiveBoard() {
  const [data, setData] = useState(null)
  const [kind, setKind] = useState('con')
  const [region, setRegion] = useState('전국')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [mine, setMine] = useState(false)
  const [lics, setLics] = useState(loadLicenses)
  const [editLic, setEditLic] = useState(false)

  useEffect(() => { getLive().then((d) => setData(d || { built: '', con: [], serv: [] })) }, [])
  useEffect(() => { setPage(1) }, [kind, region, q, mine, lics])
  useEffect(() => { saveLicenses(lics) }, [lics])

  const keywords = useMemo(
    () => [...new Set(lics.flatMap(licenseKeywords))], [lics])

  const rows = useMemo(() => {
    const src = (data && data[kind]) || []
    const s = q.trim()
    return src.filter((r) => {
      if (!inRegion(r, region)) return false
      if (s && !((r.name || '').includes(s) || (r.inst || '').includes(s))) return false
      if (mine && keywords.length) {
        const blob = r.name || ''
        if (!keywords.some((k) => blob.includes(k))) return false
      }
      return true
    })
  }, [data, kind, region, q, mine, keywords])

  const pages = Math.max(1, Math.ceil(rows.length / PAGE))
  const view = rows.slice((page - 1) * PAGE, page * PAGE)

  const toggleLic = (l) =>
    setLics((v) => (v.includes(l) ? v.filter((x) => x !== l) : [...v, l]))

  return (
    <>
      <div className="sec-title" style={{ marginTop: 14 }}>
        📋 실시간 공고 <span className="count">· 나라장터 입찰공고</span>
      </div>

      <div className="seg">
        <button className={kind === 'con' ? 'on' : ''} onClick={() => setKind('con')}>공사</button>
        <button className={kind === 'serv' ? 'on' : ''} onClick={() => setKind('serv')}>용역</button>
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

      {!data ? <Skeleton /> : rows.length === 0 ? (
        <Empty icon="📭">
          조건에 맞는 공고가 없습니다.<br />
          {mine ? '면허 맞춤을 끄거나 면허를 추가해보세요.' : '지역을 넓히거나 검색어를 지워보세요.'}
        </Empty>
      ) : (
        <>
          <div className="sec-title">공고 <span className="count">{num(rows.length)}건</span></div>
          {view.map((r, i) => {
            const dd = dday(r.close)
            return (
              <a className="notice" key={`${r.no}-${i}`}
                href={r.url || 'https://www.g2b.go.kr'} target="_blank" rel="noreferrer">
                <h3>{r.name}</h3>
                <div className="meta">
                  <span className="inst">{r.inst}</span>
                  <span>·</span>
                  <span>{dateTime(r.dt)}</span>
                  {dd && <span className={'badge ' + dd.tone}>{dd.text}</span>}
                </div>
                <div className="foot">
                  <span className="badge n">추정가격</span>
                  <span className="amt">{wonShort(r.budget)}</span>
                  <span style={{ flex: 1 }} />
                  <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>나라장터 열기 →</span>
                </div>
              </a>
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
        {data?.built && <> · 마지막 수집 {data.built}</>}
      </div>
    </>
  )
}
