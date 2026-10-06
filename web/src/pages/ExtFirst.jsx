/* 🏆 나라장터 밖 1순위(낙찰) — /ext?t=first (2026-09-30)
   소장님: 「lh나 국방 등 이런 데는 낙찰된 것은 왜 없어? 공고만 있는 거잖아. 지금」 → «다섯 곳 다 만들어»
           폰에서 1순위 화면처럼.

   ■ 자료: /data/ext/first.json 한 파일 (extres.py publish_first — 정기 수집 회차마다 다시 굽습니다)
     최근 30일 개찰 · 기관마다 400건까지. 탭을 눌렀을 때만 받습니다(공고 탭 첫 화면 전송량에 안 얹습니다).
   ■ 기관마다 주는 값이 다릅니다 — 없는 칸은 비워 둡니다(만들어 채우지 않습니다)
     LH    개찰 업체 줄 → 1순위(«낙찰하한율 미만 · 예가초과» 가 아닌 가장 낮은 투찰률) · 참가 수 · 기초 · 예정가격 · 사정률
     국방  시설 경쟁입찰 결과 → 낙찰업체(없으면 참가 1순위) · 낙찰률 · 사정률 · 낙찰하한율 · 유찰
     수자원 입찰 결과현황 → 낙찰자 · 낙찰금액 · 상태(참가 수 · 투찰률은 안 줍니다)
     아파트 K-apt 마감 지난 공고의 «낙찰/유찰 사유» 글 그대로(업체 · 금액 칸이 따로 없습니다)
     민간  누리장터 낙찰된 목록(최종 낙찰) · 개찰결과(1순위 · 유찰 · 재입찰)
   ⚠️ 기관이 공공데이터포털에 낸 값 그대로입니다. 원문 사이트로 가는 길을 늘 곁에 둡니다. */
import { useEffect, useMemo, useState } from 'react'
import { getJSON } from '../lib/data.js'
import { Skeleton, Empty } from '../components.jsx'
import { won, wonShort, num, parseDate, REGIONS, inRegion } from '../lib/fmt.js'
import { use남김 } from '../lib/길기록.js'

const 한쪽 = 40
const p2 = (n) => String(n).padStart(2, '0')
function 날짜(v) {
  const d = parseDate(v)
  if (!d) return '-'
  const s = `${p2(d.getMonth() + 1)}.${p2(d.getDate())}`
  return String(v).length === 10 ? s : `${s} ${p2(d.getHours())}:${p2(d.getMinutes())}`
}
const 률 = (v) => (v > 0 ? `${Number(v).toFixed(3)}%` : '')

/* 한 줄의 결과 — 낙찰 · 1순위 · 유찰 · 그 밖(기관이 적은 상태 그대로) */
export function 결과(r) {
  const st = String(r.st || '')
  if (/유찰|유효 투찰 없음/.test(st)) return { k: 'fail', nm: st.includes('유찰') ? '유찰' : st, tone: 'r' }
  if (/재입찰|재공고/.test(st)) return { k: 'etc', nm: st, tone: 'w' }
  if (/취소/.test(st)) return { k: 'etc', nm: st, tone: 'r' }
  if (/낙찰|계약/.test(st)) return { k: 'win', nm: '낙찰', tone: 'g' }
  if (r.w) return { k: 'win', nm: '1순위', tone: 'g' }
  return { k: 'etc', nm: st || '결과', tone: 'n' }
}

/* 투찰률이 무엇에 대한 비율인지 — 기관마다 다릅니다 */
const 률이름 = { lh: '예가대비 투찰률', dapa: '낙찰률', nuri: '투찰률' }

export default function ExtFirst({ 기관, 차례, region, setRegion }) {
  const [d, setD] = useState(undefined)
  const [고른, set고른] = use남김('kcm.extf.src', [], 'session')
  const [q, setQ] = use남김('kcm.extf.q', '', 'session')
  const [결, set결] = use남김('kcm.extf.res', 'all', 'session')
  const [open, setOpen] = use남김('kcm.extf.open', null, 'session')
  const [몇, set몇] = useState(한쪽)
  const [복사, set복사] = useState('')

  useEffect(() => {
    getJSON('/data/ext/first.json').then((v) => setD(v || null)).catch(() => setD(null))
  }, [])

  const rows = (d && d.rows) || []
  const 곳건수 = useMemo(() => {
    const c = {}
    for (const r of rows) c[r.s] = (c[r.s] || 0) + 1
    return c
  }, [d])   // eslint-disable-line react-hooks/exhaustive-deps

  const 거른 = useMemo(() => {
    const qq = q.trim()
    return rows.filter((r) => (!고른.length || 고른.includes(r.s))
      && (결 === 'all' || 결과(r).k === 결)
      && (!qq || `${r.nm || ''} ${r.org || ''} ${r.w || ''} ${r.no || ''} ${r.why || ''}`.includes(qq)))
  }, [d, 고른, q, 결])   // eslint-disable-line react-hooks/exhaustive-deps

  const 전국 = !region || region === '전국'
  const 맞는 = 전국 ? 거른 : 거른.filter((r) => r.sido && inRegion(r, region))
  /* 지역을 못 정한 결과는 늘 아래에 붙여 보여 줍니다(G90) — 국방 · 민간은 개찰 결과에 지역을 안 줘서
     지역을 고르면 «0건» 만 보이던 문제(폰: 전남 → 0건 · «27건 보기» 단추). 소장님 「이렇게 나오는데…」 */
  const 모름 = 전국 ? [] : 거른.filter((r) => !r.sido)
  const 보일 = [...맞는, ...모름]
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

  if (d === undefined) return <Skeleton />
  if (!rows.length) {
    return (
      <Empty icon="🏆">
        아직 모으는 중입니다 — 정기 수집이 몇 번 지나면 여기 채워집니다.
        <div className="note sm">LH · 국방 · 수자원 · 아파트 · 민간의 최근 30일 개찰 결과를 모읍니다.</div>
      </Empty>
    )
  }

  return (
    <>
      <div className="note sm" style={{ marginTop: 0, marginBottom: 10 }}>
        나라장터 밖 <b>공사</b> 개찰 결과 · 최근 {d.days || 30}일
        {d.at ? <> · <b>{d.at.slice(5).replace('-', '.')}</b> 기준</> : null}
      </div>

      <input value={q} onChange={(e) => { setQ(e.target.value); set몇(한쪽) }}
        placeholder="공고명 · 기관 · 업체 · 공고번호 검색" style={{ marginBottom: 10 }} />

      <div className="chips xsrcs">
        <button className={'chip' + (!고른.length ? ' on' : '')} onClick={() => { set고른([]); set몇(한쪽) }}>
          전체 <em className="licn">{num(rows.length)}</em>
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
          <button key={r} className={'chip' + (region === r ? ' on' : '')} onClick={() => { setRegion(r); set몇(한쪽) }}>{r}</button>
        ))}
      </div>

      <div className="xsort">
        <div className="seg">
          <button className={결 === 'all' ? 'on' : ''} onClick={() => { set결('all'); set몇(한쪽) }}>전체</button>
          <button className={결 === 'win' ? 'on' : ''} onClick={() => { set결('win'); set몇(한쪽) }}>1순위 · 낙찰</button>
          <button className={결 === 'fail' ? 'on' : ''} onClick={() => { set결('fail'); set몇(한쪽) }}>유찰</button>
        </div>
        <span className="xmut">{전국 ? `${num(보일.length)}건` : `${region} ${num(맞는.length)}건`}</span>
      </div>

      {!보일.length ? (
        <Empty icon="🔍">
          고른 조건에 맞는 개찰 결과가 없습니다.
        </Empty>
      ) : 쪽.map((r, i) => {
        const 열림 = open === r.id
        const g = 결과(r)
        const 첫모름 = !전국 && i === 맞는.length && !r.sido
        const 곳 = 기관[r.s] || {}
        return (
          <div key={r.id}>
            {첫모름 && (
              <div className="xdiv">
                ▼ 지역 모름 {num(모름.length)}건 — 기관이 지역을 안 적어 준 결과
              </div>
            )}
            <div className={'notice xnotice tap' + (열림 ? ' open' : '')} onClick={() => setOpen(열림 ? null : r.id)}>
              <h3>
                <span className={'xsrc xs-' + r.s}>{곳.nm || r.s}</span>
                {r.nm}
              </h3>
              <div className="meta">
                {r.org ? <span className="inst">{r.org}</span> : null}
                {r.org ? <span>·</span> : null}
                <span>{날짜(r.d)} {r.s === 'kapt' ? '마감' : '개찰'}</span>
                {r.np > 1 && <span className="badge c">🏅 {num(r.np)}곳 경쟁</span>}
                {r.np === 1 && <span className="badge n">단독 1곳</span>}
                {r.sj > 0 && <span className="badge b">사정률 {Number(r.sj).toFixed(3)}%</span>}
                {r.sido ? <span className="badge n">{r.sido}</span> : null}
              </div>
              <div className="foot">
                <span className={'badge ' + g.tone}>{g.nm}</span>
                {r.w ? <span className="win xfw">{r.w}</span>
                  : r.why ? <span className="xmut xwhy">{r.why}</span> : null}
                <span style={{ flex: 1 }} />
                {r.a > 0 && <span className="amt">{wonShort(r.a)}</span>}
                {r.r > 0 && <span className="xmut">{률(r.r)}</span>}
                <span className="caret">{열림 ? '▲' : '▼'}</span>
              </div>

              {열림 && (
                <div className="detail" onClick={(e) => e.stopPropagation()}>
                  <div className="kv2">
                    {r.w && <div><span>{g.nm === '낙찰' ? '낙찰 업체' : '1순위 업체'}</span><b>{r.w}</b></div>}
                    {r.a > 0 && <div><span>{g.nm === '낙찰' ? '낙찰 금액' : '투찰 금액'}</span><b>{won(r.a)}</b></div>}
                    {r.r > 0 && <div><span>{률이름[r.s] || '투찰률'}</span><b>{률(r.r)}</b></div>}
                    {r.np > 0 && <div><span>참가</span><b>{num(r.np)}곳</b></div>}
                    {r.base > 0 && <div><span>기초금액</span><b>{won(r.base)}</b></div>}
                    {r.exp > 0 && <div><span>예정가격</span><b>{won(r.exp)}</b></div>}
                    {r.sj > 0 && <div><span>사정률</span><b>{Number(r.sj).toFixed(4)}%</b></div>}
                    {r.ll > 0 && <div><span>낙찰하한율</span><b>{Number(r.ll).toFixed(3)}%</b></div>}
                    {r.why && <div><span>낙찰/유찰 사유</span><b>{r.why}</b></div>}
                    {r.win && <div><span>낙찰방법</span><b>{r.win}</b></div>}
                    {r.mthd && <div><span>계약방법</span><b>{r.mthd}</b></div>}
                    {r.st && <div><span>상태</span><b>{r.st}</b></div>}
                    <div><span>{r.s === 'kapt' ? '입찰 마감' : '개찰'}</span><b>{날짜(r.d)}</b></div>
                    <div><span>공고번호</span><b>{r.no}{r.ord && !/^0+$/.test(r.ord) ? `-${r.ord}` : ''}</b></div>
                    <div><span>발주</span><b>{곳.full}{r.org ? ` · ${r.org}` : ''}</b></div>
                  </div>
                  {r.s === 'lh' && r.r > 0 && (
                    <div className="note sm">LH 적격심사 공사의 투찰률은 가격점수 제외금액(A값)을 뺀 셈입니다(LH가 준 값 그대로).</div>
                  )}
                  <div className="xact">
                    <button className="btn line sm" onClick={(e) => 번호복사(e, r)}>
                      {복사 === r.id ? '✓ 복사함' : '📋 공고번호 복사'}
                    </button>
                    {곳.site && (
                      <a className="btn sm" href={곳.site} target="_blank" rel="noreferrer">
                        {곳.siteNm}에서 보기 ↗
                      </a>
                    )}
                  </div>
                  <div className="note sm">
                    개찰 결과는 {곳.full || '기관'}이 공공데이터포털에 낸 값 그대로입니다.
                    낙찰자 결정(적격심사)은 뒤에 바뀔 수 있으니 <b>원문 사이트에서 꼭 확인</b>하세요.
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

      <div className="note" style={{ marginTop: 14 }}>
        <b>어디서 오나</b> — {차례.map((s) => `${기관[s].full} ${num(곳건수[s] || 0)}건`).join(' · ')}.
        기관마다 주는 칸이 다릅니다 — 수자원은 참가 수 · 투찰률을, 아파트(K-apt)는 업체 · 금액 칸을 따로 주지 않아
        «낙찰/유찰 사유» 글을 그대로 보여 드립니다. 없는 값은 만들어 채우지 않습니다.
      </div>
    </>
  )
}
