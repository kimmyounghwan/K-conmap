/* 📣 곧 나올 공사 — /pre (2026-10-05 · G135)
   소장님: 「설계부터 보여줘 최대한 사용자 편의성 기준으로 설계해줘」 → 「클로드 의견대로 해줘」

   ■ 편하게 하려고
     · 지역은 공고판 · 바로투찰과 «같은 값»(kcm_region) — 한 번 고른 지역으로 바로 열립니다.
     · 금액대 · 공종 · 탭은 이 폰이 기억합니다(kcm.pre.v1). 다시 열면 그대로.
     · «나올 차례» 로 늘어놓습니다 — 📝 공고 직전(사전규격 · 의견 마감 빠른 순) → 이번 달 → 다음 달 → 그 뒤.
     · 카드는 다섯 가지만(사업명 · 기관 · 시기 · 금액 · 계약방법) — 나머지는 눌러서.
     · 공고가 이미 나왔으면 «✅ 공고 나옴 → 바로투찰» 한 번에.
     · ⭐ 담기(이 폰에만) — 공고로 나오면 공고판 · 바로투찰 맨 위에 «담은 공사가 공고로 나왔습니다».
     · 30건씩 · «더 보기». 폰에서 수백 장을 한 번에 그리지 않게.
   ■ 정직하게
     · 발주계획은 기관의 «계획» — 시기 · 금액이 바뀌거나 취소될 수 있습니다(맨 위 · 펼친 칸에 늘 적음).
     · 담당자 이름은 싣지 않습니다(부서 · 전화만 · 펼친 칸에서만) — 소장님 고름.
     · 구분 칩은 조달청이 준 값만(사업명 낱말로 짐작하지 않음) — 실제로는 «종합 / 전문». 값이 없으면 칩을 안 그립니다.
     · 발주계획 «나라장터에서 이 계획 보기» — 조달청이 계획마다 준 상세 주소(orderPlanDtlUrl). (2026-10-05 G135b 다듬기) */
import { Link, useSearchParams } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Skeleton, Empty } from '../components.jsx'
import { REGIONS, num } from '../lib/fmt.js'
import { loadRegion, saveRegion } from '../lib/lic.js'
import 기관사정률 from '../기관사정률.jsx'
import {
  받기목록, 받기, 거르기, 탭건수, 공종목록, 시기, 억, 담은것, 담기바꿈, 나온담은것, 조건읽기, 조건쓰기, 탭들, 금액대,
} from '../lib/곧나올.js'

const 한쪽 = 30

export default function Pre() {
  const [sp, setSp] = useSearchParams()
  const 기억 = useMemo(() => 조건읽기(), [])
  const [idx, setIdx] = useState(undefined)
  const [region, setRegionS] = useState(loadRegion)
  const [줄, set줄] = useState(undefined)
  const [탭, set탭S] = useState(() => sp.get('t') || 기억.탭 || 'all')
  const [금액, set금액] = useState(기억.금액 || '')
  const [공종, set공종] = useState(기억.공종 || '')
  const [말, set말] = useState('')
  const [담은, set담은] = useState(담은것)
  const [열림, set열림] = useState(null)
  const [몇, set몇] = useState(한쪽)
  const [복사, set복사] = useState('')
  /* 고른 지역 칩이 줄 끝(예: 전남)에 있어도 보이게 — 처음 열 때 그 칩까지 옆으로 밀어 둡니다 */
  const 지역줄 = useRef(null)
  useEffect(() => {
    const el = 지역줄.current && 지역줄.current.querySelector('.chip.on')
    const box = 지역줄.current
    if (el && box) {
      const x = el.getBoundingClientRect().left - box.getBoundingClientRect().left + box.scrollLeft
      box.scrollLeft = Math.max(0, x - box.clientWidth / 2 + el.clientWidth / 2)
    }
  }, [region, idx])

  useEffect(() => { 받기목록().then((v) => setIdx(v || null)).catch(() => setIdx(null)) }, [])
  useEffect(() => {
    let 살아 = true
    set줄(undefined)
    받기(region).then((v) => { if (살아) set줄(v) }).catch(() => { if (살아) set줄([]) })
    return () => { 살아 = false }
  }, [region])
  useEffect(() => { 조건쓰기({ 탭, 금액, 공종 }) }, [탭, 금액, 공종])
  useEffect(() => { set몇(한쪽) }, [탭, 금액, 공종, 말, region])

  const set탭 = (t) => {
    set탭S(t)
    const n = new URLSearchParams(sp)
    if (t && t !== 'all') n.set('t', t); else n.delete('t')
    setSp(n, { replace: true })
  }
  const setRegion = (r) => { saveRegion(r); setRegionS(r) }

  const 조건 = { 탭, 금액, 공종, 말 }
  const 보일 = useMemo(() => (줄 ? 거르기(줄, 조건, 담은) : []), [줄, 탭, 금액, 공종, 말, 담은])   // eslint-disable-line react-hooks/exhaustive-deps
  const 건수 = useMemo(() => (줄 ? 탭건수(줄, { 금액, 공종, 말 }, 담은) : {}), [줄, 금액, 공종, 말, 담은])
  const 공종들 = useMemo(() => (줄 ? 공종목록(줄) : []), [줄])
  const 나온 = useMemo(() => 나온담은것(담은, idx), [담은, idx])
  const 쪽 = 보일.slice(0, 몇)

  const 담기 = (e, r) => { e.stopPropagation(); set담은(담기바꿈(r)) }
  const 복사하기 = (e, t, id) => {
    e.stopPropagation()
    try { navigator.clipboard?.writeText(t) } catch { /* 없음 */ }
    set복사(id); setTimeout(() => set복사(''), 1500)
  }
  const 기준 = idx && idx.src ? [idx.src.발주계획, idx.src.사전규격].filter(Boolean).sort().pop() : ''

  return (
    <div className="pre">
      <div className="sec-title" style={{ marginTop: 14 }}>
        📣 곧 나올 공사 <span className="count">· 발주계획 · 사전규격{기준 ? ` · ${기준.slice(5).replace('-', '.')} 기준` : ''}</span>
      </div>
      <div className="note sm" style={{ marginTop: 0, marginBottom: 10 }}>
        입찰공고가 뜨기 <b>전</b>에 기관이 미리 낸 계획 · 규격입니다. <b>계획은 시기 · 금액이 바뀌거나 취소될 수 있습니다</b> —
        공고가 나오면 «✅ 공고 나옴» 으로 바뀌고 바로투찰로 이어집니다.
      </div>

      {나온.length > 0 && (
        <div className="pre-got">
          ⭐ 담아 둔 공사 <b>{나온.length}건</b>이 공고로 나왔습니다
          {나온.slice(0, 3).map((x) => (
            <Link key={x.id} to={`/?no=${encodeURIComponent(x.no)}`} className="pre-gotl">💰 {x.nm} → 바로투찰</Link>
          ))}
        </div>
      )}

      <div className="chips" role="group" aria-label="지역" ref={지역줄}>
        {REGIONS.map((r) => (
          <button key={r} className={'chip' + (region === r ? ' on' : '')} onClick={() => setRegion(r)}>
            {r}{idx && idx.n && r !== '전국' && idx.n[r] ? <em className="licn">{num(idx.n[r][0])}</em> : null}
          </button>
        ))}
      </div>
      <div className="modetabs pre-tabs">
        {탭들.map((t) => (
          <button key={t.k} className={탭 === t.k ? 'on' : ''} onClick={() => set탭(t.k)}>
            {t.t}{줄 ? <em> {num(건수[t.k] || 0)}</em> : null}
          </button>
        ))}
      </div>
      <div className="chips pre-amt" role="group" aria-label="금액">
        {금액대.map((x) => (
          <button key={x.k} className={'chip' + (금액 === x.k ? ' on' : '')} onClick={() => set금액(x.k)}>{x.t}</button>
        ))}
      </div>
      {공종들.length > 1 && (
        <div className="chips pre-kind" role="group" aria-label="종합·전문">
          {/* 조달청 «공사 구분» 값 = 종합 / 전문 (2026-10-05 실제 응답 · 토목·건축 같은 공종이 아님) */}
          <button className={'chip' + (!공종 ? ' on' : '')} onClick={() => set공종('')}>종합·전문 전체</button>
          {공종들.map(([k, n]) => (
            <button key={k} className={'chip' + (공종 === k ? ' on' : '')} onClick={() => set공종(공종 === k ? '' : k)}>
              {k} <em className="licn">{num(n)}</em>
            </button>
          ))}
        </div>
      )}
      <input className="pre-q" type="search" inputMode="search" placeholder="기관 · 사업명으로 찾기 (예: 광양, 소하천)"
        value={말} onChange={(e) => set말(e.target.value)} />

      {줄 === undefined ? <Skeleton n={5} /> : !줄.length ? (
        <Empty icon="📭">
          {idx && idx.all && idx.all[0] === 0
            ? <>아직 모으는 중입니다 — 하루 두 번(아침 · 저녁) 쌓입니다.</>
            : <>{region} 지역에 곧 나올 공사가 아직 없습니다. 다른 지역이나 «전국» 을 눌러 보세요.</>}
        </Empty>
      ) : !보일.length ? (
        <Empty icon="🔍">
          {탭 === 'bag' ? <>담은 공사가 없습니다 — 카드의 ☆ 를 누르면 여기에 모입니다.</> : <>고른 조건에 맞는 공사가 없습니다.</>}
        </Empty>
      ) : 쪽.map((r) => {
        const 펼침 = 열림 === r.id
        const 때 = 시기(r)
        const 담음 = 담은.some((x) => x.id === r.id)
        return (
          <div key={r.id} className={'notice xnotice pre-card tap' + (r.st === 'o' ? ' got' : '') + (펼침 ? ' open' : '')} onClick={() => set열림(펼침 ? null : r.id)}>
            <h3>
              <span className={'pre-k ' + (r.k === 's' ? 's' : 'p')}>{r.k === 's' ? '📝 사전규격' : '📋 발주계획'}</span>
              {r.nm}
            </h3>
            <div className="meta">
              <span className="inst">{r.org}{r.dm ? ` · ${r.dm}` : ''}</span>
              <span className={'badge ' + 때.tone}>{때.t}</span>
              {r.sd ? <span className="badge n">{String(r.sd).split(',')[0]}</span> : null}
            </div>
            <div className="foot">
              <span className="amt">{억(r.amt) || <span className="xmut">금액 미정</span>}</span>
              {r.how ? <span className="badge n">{r.how}</span> : null}
              {r.kind ? <span className="badge n">{/^(종합|전문)$/.test(r.kind) ? `${r.kind}공사` : r.kind}</span> : null}
              <span style={{ flex: 1 }} />
              <button type="button" className={'pre-star' + (담음 ? ' on' : '')} onClick={(e) => 담기(e, r)}
                aria-label={담음 ? '담기 빼기' : '담기'}>{담음 ? '★' : '☆'}</button>
              <span className="caret">{펼침 ? '▲' : '▼'}</span>
            </div>
            {r.st === 'o' && (
              <Link className="pre-go" to={`/?no=${encodeURIComponent(r.stno)}`} onClick={(e) => e.stopPropagation()}>
                ✅ 공고 나옴 → 💰 바로투찰
              </Link>
            )}
            {r.st === 'c' && <div className="pre-done">공고가 이미 지나갔습니다 (공고번호 {r.stno})</div>}

            {펼침 && (
              <div className="detail" onClick={(e) => e.stopPropagation()}>
                <div className="kv2">
                  {r.k === 's'
                    ? <div><span>배정예산</span><b>{억(r.k === 's' ? r.amt /* 사전규격의 금액 = 배정예산(asignBdgtAmt · budget) */ : 0) || '—'}</b></div>
                    : <div><span>계획 금액</span><b>{억(r.amt) || '—'}</b></div>}
                  {r.ym ? <div><span>발주 예정</span><b>{r.ym.slice(0, 4)}년 {Number(r.ym.slice(4, 6))}월</b></div> : null}
                  {r.due ? <div><span>의견 마감</span><b>{r.due}</b></div> : null}
                  {r.rgn ? <div><span>공사 지역</span><b>{r.rgn}</b></div> : null}
                  {r.how ? <div><span>계약 방법</span><b>{r.how}</b></div> : null}
                  {r.kind ? <div><span>공사 구분</span><b>{/^(종합|전문)$/.test(r.kind) ? `${r.kind}공사` : r.kind}</b></div> : null}
                  {r.per ? <div><span>공사 기간</span><b>{r.per}</b></div> : null}
                  {r.see ? <div><span>설계서 열람</span><b>{r.see}</b></div> : null}
                  {(r.dept || r.tel) ? <div><span>문의</span><b>{[r.dept, r.tel].filter(Boolean).join(' · ')}</b></div> : null}
                  {r.reg ? <div><span>올린 날</span><b>{r.reg}</b></div> : null}
                  {r.nos && r.nos.length ? <div><span>공고번호</span><b>{r.nos.join(', ')}</b></div> : null}
                </div>
                {r.files && r.files.length > 0 && (
                  <div className="docs">
                    <div className="h">규격서 <em>{r.files.length}개 · 조달청이 준 주소 그대로</em></div>
                    {r.files.map((u, i) => (
                      <a key={u} className="doc" href={u} target="_blank" rel="noreferrer">
                        <span className="di">📄</span><span className="dn">규격서 {i + 1}</span>
                      </a>
                    ))}
                  </div>
                )}
                <기관사정률 inst={r.org} />
                <div className="xact">
                  <button className={'btn sm' + (담음 ? '' : ' line')} onClick={(e) => 담기(e, r)}>{담음 ? '★ 담음' : '☆ 담기'}</button>
                  <button className="btn line sm" onClick={(e) => 복사하기(e, r.nm, r.id)}>{복사 === r.id ? '✓ 복사함' : '📋 사업명 복사'}</button>
                  {/* 🔗 발주계획은 조달청이 준 «계획 상세» 주소로 바로(orderPlanDtlUrl) · 없으면 나라장터 첫 화면 */}
                  {r.url
                    ? <a className="btn sm" href={r.url} target="_blank" rel="noreferrer">나라장터에서 이 계획 보기 ↗</a>
                    : <a className="btn sm" href="https://www.g2b.go.kr" target="_blank" rel="noreferrer">나라장터 열기 ↗</a>}
                </div>
                <div className="note sm">
                  {r.k === 's'
                    ? <>사전규격은 입찰공고 «직전» 단계입니다. 의견 마감 뒤 대개 곧 공고가 나옵니다 — 나오면 이 카드가 «✅ 공고 나옴» 으로 바뀝니다.</>
                    : <>발주계획은 기관이 연초 · 분기마다 낸 «계획» 입니다. 시기 · 금액이 바뀌거나 취소될 수 있습니다.</>}
                  {r.url ? null : <>{' '}나라장터에서는 사업명으로 찾으세요.</>}
                </div>
              </div>
            )}
          </div>
        )
      })}

      {보일.length > 몇 && (
        <button className="btn ghost" style={{ marginTop: 6 }} onClick={() => set몇(몇 + 한쪽)}>
          더 보기 ({num(보일.length - 몇)}건 남음)
        </button>
      )}
      <div className="note sm" style={{ marginTop: 14 }}>
        자료: 조달청 나라장터 발주계획현황 · 사전규격정보(공공데이터포털) — 공사만, 하루 두 번 모읍니다. 담당자 이름은 싣지 않습니다.
      </div>
    </div>
  )
}
