/* 📐 용역 · 📦 물품 — 공고 · 1순위 (한 화면 틀로 둘 다) — G194 (2026-10-07)
   소장님: 「용역, 물품 다 한다면 무료 가능해. 지금 공사 어느 정도 해 놨으니, 그 방식 그대로 하면 되고」
           「그럼, 용역 먼저 설계 해 보고 가상 인터넷에 띄어줘」 · 「용역, 물품도 똑같은 맵톡을 사용하게」
   설계: docs/용역_설계_261007.md

   ■ 자료 = svc.py 가 굽는 board/svc-first · svc-live(용역 · serv) · goods-first · goods-live(물품 · thng) — 공사와 같은 묶음 500 · 색인 · useBoard 그대로
   ■ 맨 위 = 종류띠.jsx(머리줄 아래 [공사 | 용역 | 물품] · G194c) · 공고 ↔ 1순위는 아래 탭(지금 방을 따라감)
   ■ 공사 화면(FirstBoard · LiveBoard)은 건드리지 않고 따로 둡니다 — 공사 쪽 셈(바로투찰 · 채점 · 공동도급 …)이
     용역 자료에 잘못 걸리지 않게. 바로투찰은 G194d 부터 따로(pages/SvcCalc.jsx · lib/용역셈.js — 하한율은 공고에 적힌 값만).
   ■ 숨은 누적(사이트 어디에도 안 보임): |용역|공고 · |용역|1순위 (열기) · |용역|펼침 · |용역|원문 — 물품은 |물품|… */
import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useBoard } from '../lib/useBoard.js'
import { Skeleton, Empty } from '../components.jsx'
import { RangeBar } from './FirstBoard.jsx'
import { won, wonShort, pct, num, dateTime, dday, REGIONS, inRegion, dateShort } from '../lib/fmt.js'
import { loadRegion, saveRegion } from '../lib/lic.js'
import { 입찰일정, 공고첨부 } from '../공고자세히.jsx'
import { 세기 } from '../lib/받은수.jsx'
import { use남김 } from '../lib/길기록.js'
import { 셈까닭, 까닭말, 계산주소 } from '../lib/용역셈.js'   /* 💰 G194d 용역 · 물품 바로투찰 */

const PAGE = 20
/* 종류마다 다른 것은 여기 한 곳에만 */
const 종류표 = {
  svc: { 이름: '용역', ic: '📐', slug: 'svc', kind: 'serv', 셈: '|용역|',
         설명: <>설계 · 감리 · 측량 · 안전진단 같은 <b>용역</b> 공고입니다. 용역은 낙찰하한율이 공고마다 달라 <b>조달청이 그 공고에 적어 준 하한율 · 예가 범위로</b> 셉니다 —
           셀 수 있는 공고(복수예가 · 하한율 · 기초금액)에 <b>💰 바로투찰</b> 단추가 붙습니다. 협상 계약은 제안서 점수로 정해져 단추가 없습니다.</>,
         설명1: <>나라장터 <b>용역 개찰 결과</b>입니다 — 공고마다 <b>1순위 업체 · 투찰금액 · 투찰률 · 참가업체 수</b>를 조달청 자료 그대로 보여 드립니다.
           «단독 1곳» 은 한 곳만 참가한 공고입니다 — «🏅 2곳 이상 경쟁만» 을 누르면 빠집니다. 마감 전 공고와 💰 바로투찰은 아래 탭 «공고» 에 있습니다.</> },
  goods: { 이름: '물품', ic: '📦', slug: 'goods', kind: 'thng', 셈: '|물품|',
         설명: <>자재 · 장비 · 기기 같은 <b>물품</b> 공고입니다. 물품은 낙찰 방식 · 하한율이 공고마다 달라 <b>조달청이 그 공고에 적어 준 하한율 · 예가 범위로</b> 셉니다 —
           셀 수 있는 공고(복수예가 · 하한율 · 기초금액)에 <b>💰 바로투찰</b> 단추가 붙습니다. 규격 · 가격 동시입찰처럼 하한율이 없는 공고는 단추가 없습니다.</>,
         설명1: <>나라장터 <b>물품 개찰 결과</b>입니다 — 공고마다 <b>1순위 업체 · 투찰금액 · 투찰률 · 참가업체 수</b>를 조달청 자료 그대로 보여 드립니다.
           «단독 1곳» 은 한 곳만 참가한 공고입니다 — «🏅 2곳 이상 경쟁만» 을 누르면 빠집니다. 교복처럼 한 벌 · 한 개 값(단가)으로 넣는 입찰은 투찰률이 뜻이 없어 «단가 입찰» 로 표시합니다.</> },
}

/* 🩹 G198 단추가 없는 카드에는 까닭을 짧게 늘 붙임 — 전에는 협상 · 시담 · 기초금액 공개 전만 붙어서
   «기초금액은 보이는데 단추도 까닭도 없는» 카드가 있었음(단일예가 · 하한율 없음 · 예가 범위 없음) */
const 까닭짧게 = (k, r) => (까닭말[k] || {}).짧게 || (k === '예가' ? (r.pmth || '예가 방식 없음')
  : k === '하한율' ? '하한율 없음' : k === '범위' ? '예가 범위 없음' : '')

/* 💰 G194d — 셀 수 있는 공고면 «바로투찰» 단추(그 공고 값을 주소에 실어 계산기로) */
function 바로단추({ kind, r, 셈, 큰 }) {
  return (
    <Link className={'btn sm sv-baro' + (큰 ? '' : ' mini')} to={계산주소(kind, r)}
      onClick={(e) => { e.stopPropagation(); 세기(셈 + '바로투찰단추') }}>💰 바로투찰</Link>
  )
}

/* 나라장터 원문 — 공고에 실려 온 주소(url)가 있으면 그것, 없으면 나라장터 첫 화면 */
function 원문({ r, 셈 }) {
  const u = (r && r.url && /^https?:\/\//.test(r.url)) ? r.url : 'https://www.g2b.go.kr/'
  return (
    <a className="btn ghost sm" href={u} target="_blank" rel="noreferrer"
       onClick={(e) => { e.stopPropagation(); 세기(셈 + '원문') }}>나라장터 원문 →</a>
  )
}

/* 용역 공고의 조건 — 조달청이 준 칸 그대로(공사 쪽 «주공종 · 공사지역» 칸은 안 씀) */
function 용역조건({ r }) {
  const 칸 = [
    ['계약방법', r.mthd], ['낙찰방법', r.swin], ['참가지역', r.rgn], ['지역 판단', r.rgnb],
    ['참가업종', r.ind], ['공동수급', r.joint], ['수요기관', r.dmnd],
    ['예정가격', r.pmth ? r.pmth + (r.ptot ? ` · ${r.ptot}개 중 ${r.pdrw}개 추첨` : '') : ''],
    ['담당', [r.ofcl, r.tel].filter(Boolean).join(' · ')],
    ['공고번호', r.no ? r.no + (r.ord ? `-${r.ord}` : '') : ''],
  ].filter(([, v]) => v)
  if (!칸.length) return null
  return <div className="kv2">{칸.map(([k, v]) => <div key={k}><span>{k}</span><b>{v}</b></div>)}</div>
}

/* 🩹 G198 물품 1순위에 «0.495%» 같은 투찰률 — 교복처럼 단가(한 벌 값)로 넣은 입찰이라 총액 대비 비율이 뜻이 없음 → 20% 밑은 안 보임 */
const 율 = (r) => (r && r.rate != null && Number(r.rate) >= 20 ? Number(r.rate) : null)
const 단가같음 = (r) => r && r.rate != null && Number(r.rate) > 0 && Number(r.rate) < 20

const 금액칸 = (r) => {
  const out = []
  if (r.base > 0) out.push(['기초금액', won(r.base)])
  if (r.est > 0) out.push(['추정가격', won(r.est)])
  if (r.lo != null && r.hi != null && r.base > 0) out.push(['예가 범위', `${r.lo}% ~ +${r.hi}%`.replace('+-', '-')])
  if (r.llr) out.push(['낙찰하한율', pct(r.llr, 3)])
  return out
}

export default function SvcBoard({ kind = 'svc', which = 'live' }) {
  const T = 종류표[kind] || 종류표.svc
  const KIND = T.kind
  const isFirst = which === 'first'
  const name = T.slug + (isFirst ? '-first' : '-live')
  const [region, setRegionRaw] = useState(loadRegion)
  const setRegion = (v) => { setRegionRaw(v); saveRegion(v) }
  const [q, setQ] = use남김('kcm.' + T.slug + '.' + which + '.q', '', 'session')
  const [page, setPage] = use남김('kcm.' + T.slug + '.' + which + '.page', 1, 'session')
  const [open, setOpen] = use남김('kcm.' + T.slug + '.' + which + '.open', null, 'session')
  const [열림만, set열림만] = useState(false)      // 공고: 마감 전만
  const [셈만, set셈만] = useState(false)          // 💰 G194d 공고: 바로투찰 되는 것만(색인 6번째 칸 c)
  /* 🏅 G198c 소장님 「1번, 2번 다 하면?」 → 「응 만들어 줘」 — 1순위: 처음엔 전부(단독 1곳 표시 그대로) · 단추를 누르면 2곳 이상 경쟁만(색인 5번째 칸 np) */
  const [경쟁만, set경쟁만] = useState(false)

  useEffect(() => { 세기(T.셈 + (isFirst ? '1순위' : '공고')) }, [isFirst, T.셈])

  const filtering = q.trim().length > 0 || region !== '전국' || (!isFirst && (열림만 || 셈만)) || (isFirst && 경쟁만)
  const match = useMemo(() => {
    if (!filtering) return null
    const s = q.trim()
    const 지금 = new Date()
    const p2 = (n) => String(n).padStart(2, '0')
    const nowKey = `${지금.getFullYear()}${p2(지금.getMonth() + 1)}${p2(지금.getDate())}${p2(지금.getHours())}${p2(지금.getMinutes())}`
    return (a) => {
      /* 색인 칸 차례 — svc.py export 와 같게: 1순위 [공고명, 기관, 1순위 업체, 시도, 참가업체 수] · 공고 [공고명, 기관, 시도, 추정가격, 마감, 바로투찰] */
      const [nm, inst] = a
      const sido = isFirst ? a[3] : a[2]
      if (!inRegion({ name: nm, inst, sido }, region)) return false
      if (!isFirst && 열림만 && !(a[4] && a[4] >= nowKey)) return false
      if (!isFirst && 셈만 && a[5] !== 1) return false
      if (isFirst && 경쟁만 && a[4] != null && !(a[4] >= 2)) return false   /* 옛 색인(np 칸 없음)이면 거르지 않음 */
      if (!s) return true
      return (nm || '').includes(s) || (inst || '').includes(s) || (isFirst && (a[2] || '').includes(s))
    }
  }, [filtering, q, region, 열림만, 셈만, 경쟁만, isFirst])

  const { info, rows: all, pageRows, pageReady, total, indexReady, loading, busy } =
    useBoard(name, KIND, { match, page, perPage: PAGE })
  const 첫 = useMemo(() => ({ v: true }), [])
  useEffect(() => { if (첫.v) { 첫.v = false; return } setPage(1) }, [region, q, 열림만, 셈만, 경쟁만])   // eslint-disable-line react-hooks/exhaustive-deps

  const count = total != null ? total : all.length
  const pages = Math.max(1, Math.ceil(count / PAGE))
  const view = pageRows != null ? pageRows : all.slice((page - 1) * PAGE, page * PAGE)
  const done = filtering ? indexReady : true
  const 없음 = !loading && info && !info.n

  return (
    <>

      <div className="sec-title" style={{ marginTop: 6 }}>
        {T.ic} {T.이름} {isFirst ? '1순위' : '공고'}
        <span className="count">· 나라장터 {T.이름} {isFirst ? '개찰 결과' : '입찰 공고'} · 7주</span>
      </div>
      {/* 🩹 G198 1순위 화면은 1순위 설명(전에는 공고 설명 «바로투찰 단추가 붙습니다» 가 그대로 나옴) */}
      <div className="note sm" style={{ marginTop: 0, marginBottom: 10 }}>{isFirst ? T.설명1 : T.설명}</div>

      <input value={q} onChange={(e) => setQ(e.target.value)}
        placeholder={isFirst ? '공고명 · 발주기관 · 1순위 업체 검색' : '공고명 · 발주기관 검색'}
        style={{ marginBottom: 10 }} />
      <div className="fline">
        <div className="chips" data-cond="1">
          {!isFirst && (
            <button className={'chip' + (열림만 ? ' on' : '')} onClick={() => set열림만(!열림만)}>⏳ 마감 전만</button>
          )}
          {!isFirst && (
            <button className={'chip' + (셈만 ? ' on' : '')} onClick={() => { if (!셈만) 세기(T.셈 + '바로투찰만'); set셈만(!셈만) }}>💰 바로투찰 되는 것만</button>
          )}
          {isFirst && (
            <button className={'chip' + (경쟁만 ? ' on' : '')} onClick={() => { if (!경쟁만) 세기(T.셈 + '경쟁만'); set경쟁만(!경쟁만) }}>🏅 2곳 이상 경쟁만</button>
          )}
          {REGIONS.map((g) => (
            <button key={g} className={'chip' + (region === g ? ' on' : '')} onClick={() => setRegion(g)}>{g}</button>
          ))}
        </div>
      </div>

      <RangeBar info={info} loaded={all.length} done={done} busy={busy} filtering={filtering} count={count} />

      {없음 ? (
        <Empty icon={T.ic}>{T.이름} 자료를 모으는 중입니다 — 정기 수집 한 번이 지나면 여기 채워집니다.</Empty>
      ) : loading || (filtering && !done) || !pageReady ? <Skeleton /> : view.length === 0 ? (
        <Empty icon="🔎">조건에 맞는 {T.이름} {isFirst ? '개찰' : '공고'}이 없습니다.<br />지역을 넓히거나 검색어를 지워보세요.</Empty>
      ) : (
        <>
          <div className="sec-title">결과 <span className="count">{num(count)}건{filtering && ' (7주 전체)'}</span></div>
          {view.map((r, i) => {
            const id = `${r.no}-${i}`
            const isOpen = open === id
            const 마감 = !isFirst ? dday(r.close) : null
            const 금액 = 금액칸(r)
            const 까닭 = isFirst ? null : 셈까닭(r)       /* 💰 G194d '' 이면 셀 수 있음 */
            return (
              <div className={'notice tap' + (isOpen ? ' open' : '')} key={id}
                onClick={() => { if (!isOpen) 세기(T.셈 + '펼침'); setOpen(isOpen ? null : id) }}>
                <h3><span className={'badge kd-' + kind}>{T.이름}</span> {r.name}</h3>
                <div className="meta">
                  <span className="inst">{r.inst}</span>
                  <span>·</span>
                  <span>{isFirst ? dateTime(r.dt) : `공고 ${dateTime(r.dt)}`}</span>{/* 🩹 G198 소장님 「공고 부분에 공고시간이 없어. 1순위에는 있는데」 — 날짜만 → 날짜 · 시각(공사 공고 카드와 같게) */}
                  {isFirst && 율(r) != null && <span className="badge b">{pct(율(r), 3)}</span>}
                  {isFirst && 단가같음(r) && <span className="badge n" title="한 벌 · 한 개 값(단가)으로 넣은 입찰로 보여 투찰률을 보지 않습니다">단가 입찰</span>}
                  {r.base > 0 && <span className="badge n">기초 {wonShort(r.base)}</span>}
                  {!r.base && r.est > 0 && <span className="badge n">추정 {wonShort(r.est)}</span>}
                  {isFirst && r.np > 1 && <span className="badge c">🏅 {num(r.np)}곳 경쟁</span>}
                  {isFirst && r.np === 1 && <span className="badge n">단독 1곳</span>}
                  {마감 && <span className={'badge ' + 마감.tone}>{마감.text === '마감' ? '마감' : `마감 ${마감.text}`}</span>}
                </div>
                {isFirst ? (
                  <div className="foot">
                    <span className="badge g">1순위</span>
                    <span className="win">{r.win}</span>
                    <span className="spacer" style={{ flex: 1 }} />
                    <span className="amt">{wonShort(r.sAmt || r.amt)}</span>
                    <span className="caret">{isOpen ? '▲' : '▼'}</span>
                  </div>
                ) : (
                  <div className="foot">
                    {r.mthd && <span className="badge n">{r.mthd}</span>}
                    {r.rgn && <span className="badge n">📍 {r.rgn}</span>}
                    {까닭 && <span className="badge n sv-why" title={(까닭말[까닭] || {}).길게}>{까닭짧게(까닭, r)}</span>}
                    <span className="spacer" style={{ flex: 1 }} />
                    {까닭 === '' && <바로단추 kind={kind} r={r} 셈={T.셈} />}
                    {r.close && <span className="amt" style={{ fontSize: 13 }}>마감 {dateTime(r.close)}</span>}
                    <span className="caret">{isOpen ? '▲' : '▼'}</span>
                  </div>
                )}

                {isOpen && (
                  <div className="detail" onClick={(e) => e.stopPropagation()}>
                    {금액.length > 0 && (
                      <div className="kv2">{금액.map(([k, v]) => <div key={k}><span>{k}</span><b>{v}</b></div>)}</div>
                    )}
                    {isFirst ? (
                      <div className="kv2">
                        <div><span>1순위 업체</span><b>{r.win}</b></div>
                        <div><span>투찰금액</span><b>{won(r.amt)}</b></div>
                        {r.sAmt > 0 && r.sAmt !== r.amt && <div><span>낙찰금액</span><b>{won(r.sAmt)}</b></div>}
                        {r.rate != null && <div><span>투찰률</span><b>{율(r) != null ? pct(율(r), 3) : '— (단가 입찰로 보임)'}</b></div>}
                        {r.base > 0 && r.amt > 0 && !단가같음(r) && <div><span>기초금액 대비</span><b>{pct((r.amt / r.base) * 100, 3)}</b></div>}
                        {r.np > 0 && <div><span>참가업체</span><b>{num(r.np)}곳</b></div>}
                        <div><span>개찰</span><b>{dateTime(r.dt)}</b></div>
                      </div>
                    ) : (
                      <>
                        {까닭 === ''
                          ? <div className="sv-baroline"><바로단추 kind={kind} r={r} 셈={T.셈} 큰 /><span className="note sm">이 공고의 기초금액 · 하한율 {pct(r.llr, 3)} · 예가 범위로 셉니다</span></div>
                          : <div className="note sm sv-noline">💰 바로투찰 — {(까닭말[까닭] || {}).길게}</div>}
                        <입찰일정 r={r} />
                        <용역조건 r={r} />
                        <공고첨부 r={r} />
                      </>
                    )}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                      <원문 r={r} 셈={T.셈} />
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

      {/* 💬 맵톡은 하나 — 공사 · 용역 · 물품 글이 한 곳에 쌓이게 (소장님 「그래야 글이 쌓이니까」) */}
      <div className="card" style={{ marginTop: 14 }}>
        <b>💬 {T.이름} 이야기도 맵톡에</b>
        <div className="note sm" style={{ margin: '4px 0 8px' }}>
          공사 · 용역 · 물품 구분 없이 한 곳에 모입니다 — 질문 · 현장 · 건의 무엇이든.
        </div>
        <Link className="btn sm" to="/qna">맵톡 열기 →</Link>
      </div>
      {info && info.from && <div className="note sm" style={{ marginTop: 8 }}>자료 {dateShort(info.from)} ~ {dateShort(info.to)}</div>}
    </>
  )
}
