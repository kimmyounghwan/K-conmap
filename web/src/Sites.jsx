import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useBoard } from './lib/useBoard.js'
import { Skeleton, Empty } from './components.jsx'
import { won, wonShort, num, dateFull, normCorp, REGIONS, inRegion } from './lib/fmt.js'
import { loadRegion, saveRegion, licList, licHit, licShort } from './lib/lic.js'

/* ══════════════════════════════════════════════════════════════
   🏗 곧 착공하는 현장 — 구인구직 탭 (2026-09-06)

   소장님: 「구인 구직 어떻게 하지? 아이디어 줘」 → ① 로 가기로 함.
   빈 게시판은 아무도 안 씁니다. 그런데 우리한테는 **아무도 글을 안 써도 채워지는 재료**가 있습니다 —
   낙찰 자료. 낙찰 = 곧 착공 = 곧 인력·장비가 필요한 현장. 하루 570건.
   굴착기 사장님이 아침에 열면 «우리 동네에 이번 주 뭐가 떨어졌나» 가 보입니다.

   ■ 자료 — 새 파일 없음, 비용 0
     1순위 목록(board/first-*)을 그대로 씁니다. useBoard 가 색인으로 거르고 «보는 쪽» 묶음만 받습니다
     (첫 화면 73KB). 지역·공종 거르기는 1순위 탭과 **같은 색인 칸**([공고명, 기관, 낙찰업체, 면허코드, 시도])을
     읽습니다 — 칸 순서는 collect.py 가 정하고 selfcheck 가 대조합니다.

   ■ 연락처 — 소장님 결정: 「낙찰업체 연락처까지 넣자」
     tel·adr·ceo 는 조달청 낙찰자 정보(bidwinnrTelNo·bidwinnrAdrs·bidwinnrCeoNm)로 **나라장터가 공개하는 값**입니다.
     그대로 보여줍니다. 다만 «전화 돌리기 명단» 이 되지 않도록 — 목록 내려받기·복사 버튼은 두지 않고,
     카드마다 출처(조달청 나라장터 낙찰자 정보)를 적습니다. 235/500 건에 있습니다(실측). 없으면 없다고 씁니다.

   ■ 연락처가 «아직» 없는 카드 — 실측(11,637건): 개찰 당일 44% → 2주 뒤 90%. 조달청 낙찰자 정보가
     며칠에 걸쳐 채워지기 때문입니다. 그래서 «미공개» 가 아니라 «아직 없음» 이라고 씁니다(재보고 정한 말).
     10% 쯤은 끝까지 안 옵니다 — 그건 조달청에 없는 것입니다.

   ■ 정렬 — 낙찰일 최신순(목록 순서 그대로). «최근 2주» 로 자르지 않습니다: 색인에 날짜가 없어서 자르려면
     묶음을 다 받아야 합니다. 대신 카드마다 낙찰일을 적어 «얼마나 지났나» 가 보이게 합니다.
   ══════════════════════════════════════════════════════════════ */

const PAGE = 20

export default function Sites() {
  const [region, setRegionRaw] = useState(loadRegion)
  const setRegion = (v) => { setRegionRaw(v); saveRegion(v) }
  const [lics, setLics] = useState([])          // 공종 — 구직자 관점이라 저장하지 않습니다
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(null)

  const filtering = region !== '전국' || lics.length > 0
  const match = useMemo(() => {
    if (!filtering) return null
    return (a) => {
      /* ⚠️ 칸 순서는 collect.py export_board 와 같아야 합니다 — 1순위 탭과 동일 */
      const [name, inst, win, lic, sido] = a
      if (!inRegion({ name, inst, sido }, region)) return false
      if (lics.length && !licHit(lic, lics, false)) return false
      return true
    }
  }, [filtering, region, lics])

  const { info, rows: all, pageRows, pageReady, total, indexReady, loading, busy } =
    useBoard('first', 'con', { match, page, perPage: PAGE })
  useEffect(() => { setPage(1); setOpen(null) }, [region, lics])

  const count = total != null ? total : all.length
  const pages = Math.max(1, Math.ceil(count / PAGE))
  const view = pageRows != null ? pageRows : all.slice((page - 1) * PAGE, page * PAGE)
  const done = filtering ? indexReady : true
  const licOptions = useMemo(() => licList(info).slice(0, 16), [info])
  const toggleLic = (c) => setLics((v) => (v.includes(String(c)) ? v.filter((x) => x !== String(c)) : [...v, String(c)]))

  return (
    <div className="sites">
      <div className="sites-lead">
        <b>낙찰 = 곧 착공 = 곧 사람·장비가 필요한 현장.</b>
        {' '}최근 낙찰된 공사를 지역·공종으로 골라 보세요. 낙찰업체 연락처는 조달청 나라장터가 공개하는 낙찰자 정보이며, 개찰 뒤 며칠에 걸쳐 채워집니다(2주 지나면 약 90%).
      </div>

      <div className="chips">
        {REGIONS.map((r) => (
          <button key={r} className={'chip' + (region === r ? ' on' : '')} onClick={() => setRegion(r)}>{r}</button>
        ))}
      </div>
      {licOptions.length > 0 && (
        <div className="chips">
          <button className={'chip' + (lics.length === 0 ? ' on' : '')} onClick={() => setLics([])}>공종 전체</button>
          {licOptions.map(([code, name, n]) => (
            <button key={code} className={'chip' + (lics.includes(String(code)) ? ' on' : '')}
              onClick={() => toggleLic(code)} title={`${name} · 7주 ${num(n)}건`}>{licShort(name)}</button>
          ))}
        </div>
      )}

      <div className="sec-title">
        🏗 곧 착공하는 현장
        <span className="count">· {done ? `${num(count)}건` : '세는 중…'} · 낙찰 최신순</span>
      </div>

      {loading ? <Skeleton n={5} /> : view.length === 0 && done ? (
        <Empty icon="🏗">이 조건에 맞는 최근 낙찰이 없습니다.<br />지역이나 공종을 넓혀 보세요.</Empty>
      ) : !pageReady ? <Skeleton n={5} /> : (
        <>
          {view.map((r) => {
            const id = r.no || r.name
            const isOpen = open === id
            const corp = normCorp(r.win || '')
            return (
              <div className={'notice site' + (isOpen ? ' open' : '')} key={id} onClick={() => setOpen(isOpen ? null : id)}>
                <h3>{r.name}</h3>
                <div className="meta">
                  <span className="inst">{r.site || r.inst}</span>
                  <span>·</span>
                  <span>낙찰 {dateFull(r.dt)}</span>
                  {r.amt > 0 && <><span>·</span><b className="money">{wonShort(r.amt)}</b></>}
                </div>
                <div className="site-win">
                  <span className="lab">낙찰업체</span>
                  <b>{r.win || '—'}</b>
                  {r.ceo && <span className="muted"> · 대표 {r.ceo}</span>}
                </div>
                {/* ★ 연락처 — 소장님 결정으로 카드에 바로 보여줍니다. 없으면 «없음» 이라고 적습니다(조용히 비우지 않습니다) */}
                <div className="site-contact" onClick={(e) => e.stopPropagation()}>
                  {r.tel
                    ? <a className="tel" href={'tel:' + String(r.tel).replace(/[^0-9+]/g, '')}>📞 {r.tel}</a>
                    : <span className="muted" title="조달청 낙찰자 정보는 개찰 뒤 며칠에 걸쳐 채워집니다">📞 연락처 아직 없음</span>}
                  {r.adr && <span className="adr">📍 {r.adr}</span>}
                </div>
                {isOpen && (
                  <div className="site-more" onClick={(e) => e.stopPropagation()}>
                    <div className="row">
                      <span>발주기관</span><b>{r.inst}</b>
                    </div>
                    {r.base > 0 && <div className="row"><span>기초금액</span><b>{won(r.base)}</b></div>}
                    {r.amt > 0 && <div className="row"><span>낙찰금액</span><b>{won(r.amt)}{r.rate ? ` · ${Number(r.rate).toFixed(3)}%` : ''}</b></div>}
                    {r.np > 0 && <div className="row"><span>참가업체</span><b>{num(r.np)}곳</b></div>}
                    {Array.isArray(r.lic) && r.lic.length > 0 && (
                      <div className="row"><span>면허</span><b>{r.lic.map((x) => String(x).split('/')[0]).join(' · ')}</b></div>
                    )}
                    <div className="site-links">
                      {corp && <Link className="btn ghost sm" to={'/corp/' + encodeURIComponent(corp)}>이 업체 낙찰 실적 →</Link>}
                      {r.no && <a className="btn ghost sm" href={'/notice/' + encodeURIComponent(r.no)}>공고 상세 →</a>}
                    </div>
                    <div className="hint" style={{ marginTop: 8 }}>
                      출처: 조달청 나라장터 낙찰자 정보(업체명·대표자·전화·주소). 착공 시기는 공사마다 다릅니다 — 연락 전 확인하세요.
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
              <button className="btn ghost sm" disabled={page >= pages || busy} onClick={() => setPage(page + 1)}>다음</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
