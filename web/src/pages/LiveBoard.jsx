import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useBoard } from '../lib/useBoard.js'
import { Skeleton, Empty } from '../components.jsx'
import { RangeBar } from './FirstBoard.jsx'
import { isReady, missingOf } from './BaroBid.jsx'
import { quickBid, P50_FALLBACK } from '../lib/bidmath.js'
import { getOverview } from '../lib/data.js'
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
  const [region, setRegion] = useState('전국')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [mine, setMine] = useState(false)
  const [onlyGood, setOnlyGood] = useState(false)   // A·B 등급만 보기
  const [lics, setLics] = useState(loadLicenses)
  const [editLic, setEditLic] = useState(false)
  const [open, setOpen] = useState(null)
  const now = useMemo(() => nowStamp(), [])
  /* ★ 원클릭 — 2026-09-03. 소장님: 「입찰가를 원클릭으로 구해서 입찰할 때.」
     전국 사정률 중앙(p50)만 있으면 공고 한 줄로 권장 금액이 나옵니다(quickBid).
     overview.json 은 0.4KB — 이미 첫 화면이 받는 파일이라 추가 전송량이 없습니다. */
  const [ov, setOv] = useState(null)
  const [copiedNo, setCopiedNo] = useState(null)
  useEffect(() => { getOverview().then(setOv).catch(() => {}) }, [])
  const p50 = ov?.sjq?.p50 ?? P50_FALLBACK
  const copyAmt = (e, r, amt) => {
    e.stopPropagation()
    try { navigator.clipboard?.writeText(String(amt)) } catch { /* 옛 브라우저 */ }
    setCopiedNo(r.no)
    setTimeout(() => setCopiedNo((v) => (v === r.no ? null : v)), 1600)
  }

  useEffect(() => { setPage(1) }, [region, q, mine, lics, onlyGood])
  useEffect(() => { saveLicenses(lics) }, [lics])

  const keywords = useMemo(
    () => [...new Set(lics.flatMap(licenseKeywords))], [lics])

  /* ── 검색·지역·면허·등급은 «색인»으로 거릅니다 — 2026-09-03 ──────
     전에는 7주치 묶음을 전부 받았습니다(1,767KB). 이제 색인(352KB)만 받고,
     보고 있는 쪽에 나올 20건이 든 묶음만 받습니다.
     ⚠️ 색인 한 줄: [공고명, 기관, 기초금액, 예가하한, 예가상한]
        — collect.py 의 export_board 가 이 순서로 만듭니다.
        base/lo/hi 를 넣은 이유는 「해볼 만한 공고만」 등급이 이 셋을 쓰기 때문입니다. */
  const filtering = q.trim().length > 0 || region !== '전국' || mine || onlyGood
  const match = useMemo(() => {
    if (!filtering) return null
    const s = q.trim()
    return (a) => {
      const [name, inst, base, lo, hi] = a
      if (!inRegion({ name, inst }, region)) return false
      if (s && !((name || '').includes(s) || (inst || '').includes(s))) return false
      if (mine && keywords.length && !keywords.some((k) => (name || '').includes(k))) return false
      if (onlyGood) {
        const g = winGrade({ name, inst, base, lo, hi })
        if (!g || (g.key !== 'A' && g.key !== 'B')) return false
      }
      return true
    }
  }, [filtering, q, region, mine, keywords, onlyGood])

  const { info, rows: all, pageRows, pageReady, total, indexReady, loading, busy } =
    useBoard('live', KIND, { match, page, perPage: PAGE })

  /* 전체 건수는 useBoard 가 «7주 전체»로 셉니다 — 검색 중이면 색인에서, 아니면 목록표(meta)에서.
     ⚠️ 받아 둔 것(all.length)으로 세면 25쪽(500건 ≈ 개찰 이틀치)에서 끝납니다 — 2026-09-03 실제 사고. */
  const count = total != null ? total : all.length
  const pages = Math.max(1, Math.ceil(count / PAGE))
  const view = pageRows != null ? pageRows : all.slice((page - 1) * PAGE, page * PAGE)
  const rows = view
  const done = filtering ? indexReady : true     // 검색 중이면 색인이 와야 «다 셌다»

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
        onClick={() => setOnlyGood(!onlyGood)}>
        {onlyGood ? '✓ 해볼 만한 공고만 보는 중 (A·B)' : '🎯 해볼 만한 공고만 보기 (A·B)'}
        <i>승률을 가르는 건 금액이 아니라 공고의 성격입니다 — 실측 45배 차이</i>
      </button>

      <RangeBar info={info} loaded={all.length} done={done} busy={busy} filtering={filtering} count={count} />

      {loading || (filtering && !done) || !pageReady ? <Skeleton /> : rows.length === 0 ? (
        <Empty icon="📭">
          조건에 맞는 공고가 없습니다.<br />
          {mine ? '면허 맞춤을 끄거나 면허를 추가해보세요.' : '지역을 넓히거나 검색어를 지워보세요.'}
        </Empty>
      ) : (
        <>
          <div className="sec-title">공고 <span className="count">
            {num(count)}건{filtering && ' (7주 전체)'}</span></div>
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

                {/* ★ 원클릭 줄 — 완비 공고에만. 바로투찰 화면과 «같은 함수»(quickBid)로 낸 금액입니다.
                    여기서 복사하고 나라장터로 가면 끝입니다. 화면을 옮기지 않아도 됩니다.
                    더 알고 싶으면(시나리오·근거) 「💰 바로투찰」 알약으로 갑니다. */}
                {canBid(r, now) && (() => {
                  const qb = quickBid(r, p50)
                  if (!qb) return null
                  return (
                    <div className="oneclick" onClick={(e) => e.stopPropagation()}>
                      <div className="oc-l">
                        <span className="oc-tag">권장 투찰금액</span>
                        <span className="oc-amt">{won(qb.amt)}</span>
                        <span className="oc-sub">투찰률 {qb.rate.toFixed(3)}% · 사정률 {qb.pctile}분위{qb.aKnown ? '' : ' · A값 미확인'}</span>
                      </div>
                      <div className="oc-r">
                        <button className="cbtn" onClick={(e) => copyAmt(e, r, qb.amt)}>
                          {copiedNo === r.no ? '✓ 복사했습니다' : '금액 복사'}
                        </button>
                        {/* 조달청이 준 주소 그대로. 손으로 만들면 차수를 틀립니다(실제로 틀렸음). */}
                        {r.url && (
                          <a className="cbtn ghost" href={r.url} target="_blank" rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}>나라장터 →</a>
                        )}
                      </div>
                    </div>
                  )
                })()}

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
