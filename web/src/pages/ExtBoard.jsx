/* 🏗 나라장터 밖 공고 — /ext (2026-09-30)
   소장님: 입찰나라에서 가져올 것 4번 «나라장터 밖 공고» · 「편리성, 기능성 유지하면서」 ·
           「핸드폰에서도 편리하게 사용가능해야 해. 건설맵은」
           고른 곳: LH · 수자원 · 방위사업청 + 아파트 공사(K-apt) + 민간 공사(누리장터)

   ■ 자료: /data/ext/list.json 한 파일 (extbids.py — 정기 수집 회차마다 다시 굽습니다)
   ■ 편리함을 지키려고
     · 나라장터 공고판(/live)은 그대로 둡니다. 여기는 따로 한 장 — 공고판에는 «🏗 나라장터 밖 공고 N건 →» 한 줄만.
     · 지역은 공고판 · 바로투찰과 «같은 값» 을 씁니다(kcm_region). 한 번 고르면 여기서도 그 지역.
     · 기관 알약(LH · 수자원 · 국방 · 아파트 · 민간)은 여러 개 고를 수 있습니다. 아무것도 안 고르면 전부.
     · 카드를 누르면 일정 · 조건 · 첨부 · «공고번호 복사» · «원문 사이트» — 폰에서 번호를 손으로 옮겨 적지 않게.
     · 40건씩 보여 주고 «더 보기». 폰에서 한 번에 수백 장을 그리지 않게.
   ⚠️ 금액 · 일정은 기관이 공공데이터포털에 낸 값 그대로입니다(이름도 기관이 쓴 그대로 — 추정가격 · 기초금액 · 기준금액 · 배정예산).
      여기서 셈하지 않습니다. 원문 공고로 가는 길을 늘 곁에 둡니다.
   ■ 🏆 1순위(낙찰) 탭 (2026-09-30 소장님 「lh나 국방 등 이런 데는 낙찰된 것은 왜 없어? 공고만 있는 거잖아.」)
     /ext?t=first — ExtFirst.jsx. 주소에 탭을 적어 두어 /first 화면의 한 줄 · 공유 · 뒤로 가기가 그 탭으로 옵니다.
     공고 탭의 list.json 은 공고 탭을 볼 때만 받습니다(1순위만 보러 온 폰이 공고 목록까지 받지 않게). */
import { Link, useSearchParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { getJSON } from '../lib/data.js'
import { Skeleton, Empty } from '../components.jsx'
import { won, wonShort, num, dday, parseDate, REGIONS, inRegion } from '../lib/fmt.js'
import { loadRegion, saveRegion } from '../lib/lic.js'
import { use남김 } from '../lib/길기록.js'
import { smartBid } from '../lib/bidmath.js'
import ExtFirst from './ExtFirst.jsx'

/* 원문 사이트 — 공고번호로 찾아 들어갑니다(기관마다 공고 한 건으로 바로 가는 주소를 주지 않습니다) */
export const 기관 = {
  lh: { nm: 'LH', full: '한국토지주택공사', site: 'https://ebid.lh.or.kr', siteNm: 'LH 전자조달' },
  kw: { nm: '수자원', full: '한국수자원공사', site: 'https://ebid.kwater.or.kr', siteNm: 'K-water 전자조달' },
  dapa: { nm: '국방', full: '방위사업청(시설)', site: 'https://www.d2b.go.kr', siteNm: '국방전자조달' },
  kapt: { nm: '아파트', full: '공동주택(K-apt)', site: 'https://www.k-apt.go.kr', siteNm: 'K-apt' },
  /* 누리장터 민간 공고는 지금 나라장터 안에 있습니다 — 첫 회차 표본의 공고번호(R26BK…) · 첨부 주소(www.g2b.go.kr)로 확인(2026-09-30) */
  nuri: { nm: '민간', full: '누리장터 민간', site: 'https://www.g2b.go.kr', siteNm: '나라장터(민간)' },
}
const 차례 = ['lh', 'kw', 'dapa', 'kapt', 'nuri']
const 한쪽 = 40

/* 💰 권장 투찰금액 — LH · 국방만 (2026-09-30, 소장님 「나라장터 밖 공고에는 바로 입찰 이런게 왜 없어?」 「한꺼번에 다 할 수 없어?」)
   수자원 · 아파트 · 민간은 공고에 기초금액 · 예정가격이 없어 셈할 수 없습니다(누가 해도).
   재료: 공고의 기초금액(r.base) · A값(r.A — LH 가격점수제외금액) + 그 기관 개찰에서 센 사정률 · 낙찰하한율(list.json «st» · extres.py).
   셈은 바로투찰과 «같은 함수» smartBid — 여기서 다시 적지 않습니다(같은 셈을 두 곳에 적으면 어긋납니다).
   ⚠️ 모자라면 셈하지 않고 «자료 모으는 중 (N건)» 만. 개찰 20건부터 · 그 규모의 하한율을 알 때만. */
const 최소건수 = 20
const 규모칸 = (base, edges) => { let i = 0; for (; i < (edges || []).length; i++) if (base < edges[i]) break; return i }
export function 권장셈(r, st) {
  if (!r || (r.s !== 'lh' && r.s !== 'dapa')) return null
  const s = st && st[r.s]
  if (!(r.base > 0)) return { 기초없음: true }
  if (!s || !(s.n >= 최소건수) || !(s.p50 > 0) || !(s.sd > 0)) return { 모음: (s && s.n) || 0 }
  const ll = s.ll && s.ll[String(규모칸(r.base, s.edges))]
  if (!ll) return { 하한모름: true, s }
  const qb = smartBid({ base: r.base, llRate: ll[0], aVal: Number(r.A) || 0, aKnown: r.s === 'lh' && !!r.Ak,
    p50: s.p50, sd: s.sd, enp: 0 })
  return qb && qb.amt > 0 ? { qb, ll: ll[0], lln: ll[1], s } : null
}

/* 날짜만 있는 마감(수자원 · K-apt)은 그날 끝까지로 봅니다 — 자정으로 보면 하루 일찍 «마감» 이 됩니다 */
const 끝까지 = (v) => (v && String(v).length === 10 ? `${v} 23:59` : v)
const p2 = (n) => String(n).padStart(2, '0')
function 날짜(v) {
  const d = parseDate(v)
  if (!d) return '-'
  const s = `${p2(d.getMonth() + 1)}.${p2(d.getDate())}`
  return String(v).length === 10 ? s : `${s} ${p2(d.getHours())}:${p2(d.getMinutes())}`
}

const 일정칸 = [
  ['dt', '공고'],
  ['spot', '현장설명'],
  ['qreg', '참가등록 마감'],
  ['jdoc', '공동수급협정서 마감'],
  ['ddoc', '서류 제출 마감'],
  ['bbgn', '입찰서 제출 시작'],
  ['close', '입찰 마감'],
  ['openg', '개찰'],
]

export default function ExtBoard() {
  const [sp, setSp] = useSearchParams()
  const 탭 = sp.get('t') === 'first' ? 'first' : 'list'
  const 탭바꿈 = (t) => { setSp(t === 'first' ? { t: 'first' } : {}, { replace: true }); window.scrollTo(0, 0) }
  const [d, setD] = useState(undefined)
  const [고른, set고른] = use남김('kcm.ext.src', [], 'session')
  const [q, setQ] = use남김('kcm.ext.q', '', 'session')
  const [순, set순] = use남김('kcm.ext.sort', 'new', 'session')
  const [open, setOpen] = use남김('kcm.ext.open', null, 'session')
  const [region, setRegion0] = useState(loadRegion)
  const [몇, set몇] = useState(한쪽)
  const [모름도, set모름도] = useState(false)
  const [복사, set복사] = useState('')

  useEffect(() => {
    if (탭 !== 'list' || d !== undefined) return
    getJSON('/data/ext/list.json').then((v) => setD(v || null)).catch(() => setD(null))
  }, [탭])   // eslint-disable-line react-hooks/exhaustive-deps
  const setRegion = (r) => { setRegion0(r); saveRegion(r); set몇(한쪽) }

  const rows = (d && d.rows) || []
  const 지금 = Date.now()
  const 열린 = useMemo(() => rows.filter((r) => {
    const c = parseDate(끝까지(r.close))
    return !c || c.getTime() >= 지금
  }), [d])   // eslint-disable-line react-hooks/exhaustive-deps

  const 곳건수 = useMemo(() => {
    const c = {}
    for (const r of 열린) c[r.s] = (c[r.s] || 0) + 1
    return c
  }, [열린])

  const 거른 = useMemo(() => {
    const qq = q.trim()
    let out = 열린.filter((r) => (!고른.length || 고른.includes(r.s))
      && (!qq || `${r.nm || ''} ${r.org || ''} ${r.apt || ''} ${r.no || ''}`.includes(qq)))
    if (순 === 'close') {
      out = [...out].sort((a, b) => String(끝까지(a.close) || '9999').localeCompare(String(끝까지(b.close) || '9999')))
    }
    return out
  }, [열린, 고른, q, 순])

  const 전국 = !region || region === '전국'
  const 맞는 = 전국 ? 거른 : 거른.filter((r) => r.sido && inRegion(r, region))
  const 모름 = 전국 ? [] : 거른.filter((r) => !r.sido)
  const 다보기 = 모름도 || !맞는.length     // 고른 지역이 0건이면 지역 모름을 바로 보여 줍니다(G90)
  const 보일 = 다보기 ? [...맞는, ...모름] : 맞는
  const 쪽 = 보일.slice(0, 몇)

  const 알약 = (s) => {
    set고른(고른.includes(s) ? 고른.filter((x) => x !== s) : [...고른, s])
    set몇(한쪽)
  }
  const 번호복사 = (e, r) => {
    e.stopPropagation()
    try {
      navigator.clipboard?.writeText(String(r.no || ''))
      set복사(r.id); setTimeout(() => set복사(''), 1500)
    } catch { /* 옛 브라우저 */ }
  }

  return (
    <>
      <div className="sec-title" style={{ marginTop: 14 }}>
        🏗 나라장터 밖 입찰 <span className="count">· LH · 수자원 · 국방 · 아파트 · 민간</span>
      </div>
      <div className="modetabs">
        <button className={탭 === 'list' ? 'on' : ''} onClick={() => 탭바꿈('list')}>📋 공고</button>
        <button className={탭 === 'first' ? 'on' : ''} onClick={() => 탭바꿈('first')}>🏆 1순위 · 낙찰</button>
      </div>
      {탭 === 'first' ? <ExtFirst 기관={기관} 차례={차례} region={region} setRegion={setRegion} /> : (<>
      <div className="note sm" style={{ marginTop: 0, marginBottom: 10 }}>
        나라장터(조달청)에 안 올라오는 <b>공사</b> 공고를 공공데이터포털에서 모았습니다
        {d && d.at ? <> · <b>{d.at.slice(5).replace('-', '.')}</b> 기준</> : null}
        {' '}· <Link to="/live">나라장터 공고 →</Link>
      </div>

      {d === undefined ? <Skeleton /> : !rows.length ? (
        <Empty icon="🏗">
          아직 모으는 중입니다 — 정기 수집 한 번이 지나면 여기 채워집니다.
          {d && d.src ? (
            <div className="note sm" style={{ textAlign: 'left' }}>
              {차례.map((s) => (
                <div key={s}>{기관[s].full}: {d.src[s] && d.src[s].ok ? `${d.src[s].ok} 받음` : '아직'}</div>
              ))}
            </div>
          ) : null}
        </Empty>
      ) : (
        <>
          <input value={q} onChange={(e) => { setQ(e.target.value); set몇(한쪽) }}
            placeholder="공고명 · 기관 · 단지명 · 공고번호 검색" style={{ marginBottom: 10 }} />

          <div className="chips xsrcs">
            <button className={'chip' + (!고른.length ? ' on' : '')} onClick={() => { set고른([]); set몇(한쪽) }}>
              전체 <em className="licn">{num(열린.length)}</em>
            </button>
            {차례.map((s) => (
              <button key={s} className={'chip xs-' + s + (고른.includes(s) ? ' on' : '')}
                disabled={!곳건수[s]} onClick={() => 알약(s)}>
                {기관[s].nm} <em className="licn">{num(곳건수[s] || 0)}</em>
              </button>
            ))}
          </div>

          <div className="chips">
            {REGIONS.map((r) => (
              <button key={r} className={'chip' + (region === r ? ' on' : '')} onClick={() => setRegion(r)}>{r}</button>
            ))}
          </div>

          <div className="xsort">
            <div className="seg">
              <button className={순 === 'new' ? 'on' : ''} onClick={() => set순('new')}>새 공고 순</button>
              <button className={순 === 'close' ? 'on' : ''} onClick={() => set순('close')}>마감 임박 순</button>
            </div>
            <span className="xmut">{전국 ? `${num(보일.length)}건` : `${region} ${num(맞는.length)}건`}</span>
          </div>

          {!보일.length ? (
            <Empty icon="🔍">
              고른 조건에 맞는 공고가 없습니다.
            </Empty>
          ) : 쪽.map((r, i) => {
            const 열림 = open === r.id
            const dd = dday(끝까지(r.close))
            /* «오늘» = 공고일이 오늘(기관이 적은 날짜). 우리가 처음 본 날로 하면 첫 수집 날 전부 «오늘» 이 됩니다 */
            const 새것 = r.dt && d.at && String(r.dt).slice(0, 10) === d.at.slice(0, 10)
            const 첫모름 = 다보기 && !전국 && i === 맞는.length && !r.sido
            const m0 = (r.m && r.m[0]) || null
            const 권 = 권장셈(r, d.st)
            const 취소 = /취소/.test(r.st || '')
            return (
              <div key={r.id}>
                {첫모름 && <div className="xdiv">▼ 지역 모름 {num(모름.length)}건 — 공고문에서 참가지역을 확인하세요</div>}
                <div className={'notice xnotice tap' + (취소 ? ' gone' : '') + (열림 ? ' open' : '')} onClick={() => setOpen(열림 ? null : r.id)}>
                  <h3>
                    <span className={'xsrc xs-' + r.s}>{기관[r.s]?.nm || r.s}</span>
                    {새것 ? <span className="badge new">🆕 오늘</span> : null}
                    {r.nm}
                  </h3>
                  <div className="meta">
                    <span className="inst">{r.org}{r.apt && r.apt !== r.org ? ` · ${r.apt}` : ''}</span>
                    <span>·</span>
                    <span>{날짜(r.dt)} 공고</span>
                    {dd && <span className={'badge ' + dd.tone}>{dd.text}</span>}
                    {r.emg ? <span className="badge r">긴급</span> : null}
                    {취소 ? <span className="badge r">취소</span> : /정정|변경|수정/.test(r.st || '') ? <span className="badge w">{r.st}</span> : null}
                    {r.sido ? <span className="badge n">{r.sido}</span> : null}
                  </div>
                  <div className="foot">
                    {m0 ? (
                      <>
                        <span className="badge n">{m0[0]}</span>
                        <span className="amt">{wonShort(m0[1])}</span>
                      </>
                    ) : <span className="xmut">금액은 공고문에</span>}
                    {권 && 권.qb ? <span className="xbid">💰 권장 {wonShort(권.qb.amt)}</span> : null}
                    <span style={{ flex: 1 }} />
                    {/* 카드 줄에는 날짜만(폰 한 줄에 들어가게) — 시각은 펼친 칸 «입찰 일정» 에 */}
                    {r.close ? <span className="xmut">마감 {날짜(r.close).split(' ')[0]}</span> : null}
                    <span className="caret">{열림 ? '▲' : '▼'}</span>
                  </div>

                  {열림 && (
                    <div className="detail" onClick={(e) => e.stopPropagation()}>
                      {권 && (
                        <div className="xqb">
                          <div className="xqb-h">💰 권장 투찰금액</div>
                          {권.qb ? (
                            <>
                              <div className="xqb-v">
                                <b>{won(권.qb.amt)}</b>
                                <span>투찰률 {Number(권.qb.rate).toFixed(3)}%</span>
                                <button type="button" className="chip" onClick={(e) => {
                                  e.stopPropagation()
                                  try { navigator.clipboard?.writeText(String(권.qb.amt)); set복사('a' + r.id); setTimeout(() => set복사(''), 1500) } catch { /* 옛 브라우저 */ }
                                }}>{복사 === 'a' + r.id ? '✓ 복사함' : '금액 복사'}</button>
                              </div>
                              <div className="note sm">
                                기초금액 {won(r.base)} · 사정률 가운데 {권.s.p50.toFixed(3)}%(±{권.s.sd.toFixed(3)}) ·
                                낙찰하한율 {권.ll.toFixed(3)}%{r.s === 'lh' ? ` · A값 ${won(r.A || 0)}` : ' · A값 모름(넉넉히 잡음)'} —
                                {기관[r.s].nm} 개찰 {num(권.s.n)}건에서 센 값입니다. 셈은 바로투찰과 같습니다.
                                <b> 공고서의 하한율 · A값이 다르면 공고서가 맞습니다.</b>
                              </div>
                            </>
                          ) : 권.기초없음 ? (
                            <div className="note sm">기초금액이 아직 공개되지 않았습니다 — 공개되면 여기 금액이 나옵니다.</div>
                          ) : 권.하한모름 ? (
                            <div className="note sm">이 규모의 낙찰하한율을 아직 모릅니다 — 개찰이 더 쌓이면 나옵니다.</div>
                          ) : (
                            <div className="note sm">자료 모으는 중 — {기관[r.s].nm} 개찰 {num(권.모음)}건 모임({최소건수}건부터 셈합니다).</div>
                          )}
                        </div>
                      )}
                      <div className="ilj">
                        <div className="ilj-h">📅 입찰 일정</div>
                        {일정칸.filter(([k]) => r[k]).map(([k, nm]) => {
                          const x = k === 'dt' ? null : dday(끝까지(r[k]))
                          const 지남 = x && x.text === '마감'
                          return (
                            <div key={k} className={'ilj-r' + (지남 ? ' past' : '')}>
                              <span>{nm}</span>
                              <b>{날짜(r[k])}{k === 'spot' && r.spotp ? ` · ${r.spotp}` : ''}</b>
                              {x && !지남 && <em className={'badge ' + x.tone}>{x.text}</em>}
                              {지남 && <em className="badge n">지남</em>}
                            </div>
                          )
                        })}
                      </div>

                      <div className="kv2">
                        {(r.m || []).map(([k, v]) => (
                          <div key={k}><span>{k}</span><b>{won(v)}</b></div>
                        ))}
                        {r.mthd && <div><span>계약방법</span><b>{r.mthd}</b></div>}
                        {r.win && <div><span>낙찰방법</span><b>{r.win}</b></div>}
                        {r.way && <div><span>입찰방식</span><b>{r.way}</b></div>}
                        {r.rgn && <div><span>참가지역</span><b>{r.rgn}</b></div>}
                        {r.rgnj && <div><span>지역의무 공동</span><b>{r.rgnj}</b></div>}
                        {r.joint && <div><span>공동수급</span><b>{r.joint}</b></div>}
                        {r.lic && r.lic.length > 0 && <div><span>면허</span><b>{r.lic.join(', ')}</b></div>}
                        {r.qual && <div><span>참가자격</span><b>{r.qual}</b></div>}
                        {r.req && <div><span>구비서류</span><b>{r.req}</b></div>}
                        {r.np ? <div><span>참가</span><b>{num(r.np)}곳</b></div> : null}
                        {r.st && <div><span>상태</span><b>{r.st}</b></div>}
                        {r.auth && <div><span>올린 곳</span><b>{r.auth}</b></div>}
                        {(r.ofcl || r.tel) && <div><span>담당</span><b>{[r.ofcl, r.tel].filter(Boolean).join(' · ')}</b></div>}
                        <div><span>공고번호</span><b>{r.no}{r.ord && r.ord !== '0' && r.ord !== '00' && r.ord !== '000' ? `-${r.ord}` : ''}</b></div>
                        <div><span>발주</span><b>{기관[r.s]?.full}{r.org ? ` · ${r.org}` : ''}</b></div>
                      </div>

                      {r.docs && r.docs.length > 0 && (
                        <div className="docs">
                          <div className="h">첨부 <em>{r.docs.length}개 · 기관이 준 주소 그대로</em></div>
                          {r.docs.map(([nm, u]) => (
                            <a key={u} className="doc" href={u} target="_blank" rel="noreferrer">
                              <span className="di">📄</span><span className="dn">{nm}</span>
                            </a>
                          ))}
                        </div>
                      )}

                      <div className="xact">
                        <button className="btn line sm" onClick={(e) => 번호복사(e, r)}>
                          {복사 === r.id ? '✓ 복사함' : '📋 공고번호 복사'}
                        </button>
                        {기관[r.s] && (
                          <a className="btn sm" href={기관[r.s].site} target="_blank" rel="noreferrer">
                            {기관[r.s].siteNm}에서 보기 ↗
                          </a>
                        )}
                      </div>
                      <div className="note sm">
                        금액 · 일정은 {기관[r.s]?.full || '기관'}이 공공데이터포털에 낸 값 그대로입니다.
                        원문 사이트에서 공고번호로 찾아 <b>공고문을 꼭 확인</b>하고 넣으세요.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {보일.length > 몇 && (
            <button className="btn ghost" style={{ marginTop: 6 }} onClick={() => set몇(몇 + 한쪽)}>
              더 보기 ({num(보일.length - 몇)}건 남음)
            </button>
          )}
          {보일.length > 0 && 모름.length > 0 && !다보기 && (
            <button className="btn ghost sm" style={{ marginTop: 8 }} onClick={() => set모름도(true)}>
              지역을 못 정한 공고 {num(모름.length)}건도 보기
            </button>
          )}

          <div className="note" style={{ marginTop: 14 }}>
            <b>어디서 오나</b> — {차례.map((s) => `${기관[s].full} ${num(곳건수[s] || 0)}건`).join(' · ')}.
            마감이 지난 공고는 빼고, 나라장터에도 올린 국방 공고는 나라장터 공고판에만 둡니다.
            지역은 참가지역 · 단지 주소 · 발주 이름으로 정했습니다 — 못 정한 공고는 «전국» 에서 보입니다.
          </div>
        </>
      )}
      </>)}
    </>
  )
}
