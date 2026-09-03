import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useBoard } from '../lib/useBoard.js'
import { Skeleton, Empty } from '../components.jsx'
import { RangeBar } from './FirstBoard.jsx'
import { isReady, missingOf } from './BaroBid.jsx'
import { winGrade } from '../lib/winodds.js'
import { won, wonShort, num, dateTime, dday, REGIONS, inRegion, LICENSES, licenseKeywords } from '../lib/fmt.js'

/* ══════════════════════════════════════════════════════════════
   «바로투찰» 버튼은 계산이 되는 공고에만 답니다.

   버튼을 눌렀는데 «아직 계산할 수 없습니다» 가 뜨면,
   그건 도와준 게 아니라 헛걸음을 시킨 겁니다.
   그래서 여기서 미리 거릅니다 —
     ① 아직 마감 전일 것 (마감된 공고는 투찰 자체가 안 됩니다)
     ② 기초금액·낙찰하한율·A값·예비가격 정보가 다 있을 것 (isReady)
   판정 기준은 바로투찰과 «같은 함수»를 씁니다. 따로 두면 반드시 어긋납니다.
   ══════════════════════════════════════════════════════════════ */
const stamp14 = (v) => String(v || '').replace(/[^0-9]/g, '').padEnd(14, '0')
function nowStamp() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}` +
         `${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
}
const canBid = (r, now) => !!r && stamp14(r.close) >= now && isReady(r)

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
  const [onlyGood, setOnlyGood] = useState(false)   // A·B 등급만 보기
  const [lics, setLics] = useState(loadLicenses)
  const [editLic, setEditLic] = useState(false)
  const [open, setOpen] = useState(null)
  const now = useMemo(() => nowStamp(), [])

  useEffect(() => { setPage(1) }, [region, q, mine, lics, onlyGood])
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
      if (onlyGood) {
        const g = winGrade(r)
        if (!g || (g.key !== 'A' && g.key !== 'B')) return false
      }
      return true
    })
  }, [all, region, q, mine, keywords, onlyGood])

  const pages = Math.max(1, Math.ceil(rows.length / PAGE))
  const view = rows.slice((page - 1) * PAGE, page * PAGE)

  // 마지막 쪽 근처까지 넘겨보면 알아서 더 받아온다 (7주 끝까지 이어짐)
  //  ⚠️ rows / pages 가 만들어진 뒤에 와야 합니다. 위에 두면 참조 오류가 납니다.
  //  ⚠️ 2026-09-03 — 조건에 `!loading && page > 1` 을 넣었습니다.
  //     page 는 1에서 시작하는데 자료가 오기 전에는 pages 도 1 입니다.
  //     그래서 «page(1) >= pages-1(0)» 이 **화면이 뜨자마자 참**이 되어,
  //     아무도 넘겨보지 않았는데 다섯 묶음(약 400KB)을 더 받고 있었습니다.
  //     실제로 브라우저로 재서 잡았습니다 (board 7묶음 → 2묶음).
  useEffect(() => {
    if (!loading && !done && page > 1 && page >= pages - 1) loadMore()
  }, [loading, page, pages, done, loadMore])

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

      {/* 실측: C·D 등급 156건에서 한 건도 못 땄습니다. 걸러 볼 수 있게 합니다. */}
      <button className={'goodonly' + (onlyGood ? ' on' : '')}
        onClick={() => { setOnlyGood(!onlyGood); if (!done) loadAll() }}>
        {onlyGood ? '✓ 해볼 만한 공고만 보는 중 (A·B)' : '🎯 해볼 만한 공고만 보기 (A·B)'}
        <i>승률을 가르는 건 금액이 아니라 공고의 성격입니다 — 실측 45배 차이</i>
      </button>

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
                  <span className="badge n">추정가격</span>
                  <span className="amt">{wonShort(r.budget)}</span>
                  <span style={{ flex: 1 }} />
                  <span className="caret">{isOpen ? '▲' : '▼'}</span>
                </div>

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
                            30분마다 다시 받아오니 조금 뒤에 열어보세요.</>
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

                    {(r.docs || []).length > 0 && (
                      <div className="docs">
                        <div className="h">공고문 첨부</div>
                        {r.docs.map(([nm, u]) => (
                          <a key={u} href={u} target="_blank" rel="noreferrer" className="doc">
                            📄 {nm}
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
