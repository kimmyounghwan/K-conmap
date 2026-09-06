import { useEffect, useMemo, useState } from 'react'
import { getBoardMeta } from './lib/data.js'
import { won, num, dateTime, dday, REGIONS, inRegion } from './lib/fmt.js'
import { quickBid, pickOdds, canBid, nowStamp, stamp14 } from './lib/bidmath.js'
import { loadLicCodes, saveLicCodes, loadLicNone, saveLicNone, loadRegion, saveRegion,
         licList, licHit, licShort } from './lib/lic.js'

/* ══════════════════════════════════════════════════════════════
   ⚡ 오늘 넣을 것 — 바로투찰 첫 화면 (2026-09-06)

   소장님: 「원 클릭처럼… 화면을 봤을 때 다른 페이지랑 구별이 없는듯 해서」
   → 열어 보니 원인은 색이 아니라 **열면 빈 입력 폼** 이었습니다.
   → 처음엔 «전국에서 확률 높은 3건» 을 띄웠는데, 소장님이 바로 짚었습니다:
     「공고에서 투찰할 공사를 찾잖아. 바로투찰에 이걸 또 띄워준다는 거야?」
     맞습니다. 그건 공고 탭 자리 찾기의 복사본이었고, 「봉선저수지(충남)」 는 광양 업체와
     아무 상관이 없었습니다. **누구의 것도 아닌 목록**이었습니다.

   그래서 «내 것» 만 띄웁니다.
     · 면허·지역은 **브라우저에만** 저장합니다 (공고 탭의 「내 면허 맞춤」 과 같은 값).
       서버 저장 0 · 로그인 없음 · 사람이 늘어도 비용 0. 100명이 100가지 화면을 봅니다.
     · 한 번도 안 고른 사람에게는 카드 대신 «고르세요» 한 줄과 칩만 보여줍니다.
     · 정렬은 **마감 임박 순**. 아침 루틴은 「오늘 마감이 뭐지」 이지 「전국 확률 1등이 뭐지」 가 아닙니다.

   ⚠️ 자료를 새로 받지 않습니다 — bidindex 는 바로투찰이 검색 상자용으로 이미 받아 둔 것입니다.
      면허 칩 목록만 board/live.json(2KB) 에서 읽습니다 — 공고 탭과 같은 파일입니다.
   ⚠️ 거르는 규칙(canBid · inRegion · licHit)과 금액(quickBid) · 확률(pickOdds)은
      전부 공고 탭과 **같은 함수**입니다. 여기서 따로 적으면 같은 공고가 한쪽엔 뜨고 한쪽엔 안 뜹니다.
   ⚠️ 없는 숫자는 만들지 않습니다. 확률을 모르는 공고(기관 표본 6건 미만)는 뱃지를 안 답니다.
   ══════════════════════════════════════════════════════════════ */

const MAX = 5

export default function MyToday({ rows, idx, p50, onPick }) {
  const [lics, setLics] = useState(loadLicCodes)
  const [licNone, setLicNone] = useState(loadLicNone)
  const [region, setRegion] = useState(loadRegion)
  const [meta, setMeta] = useState(null)
  const [editing, setEditing] = useState(false)
  const [copied, setCopied] = useState('')
  const now = useMemo(() => nowStamp(), [])

  useEffect(() => { getBoardMeta('live').then((m) => setMeta(m || null)).catch(() => setMeta(null)) }, [])

  const configured = lics.length > 0 || region !== '전국'
  const licOptions = useMemo(() => licList(meta?.con), [meta])
  const licNames = useMemo(() => {
    const byCode = new Map(licOptions.map((x) => [String(x[0]), licShort(x[1])]))
    return lics.map((c) => byCode.get(String(c)) || c)
  }, [lics, licOptions])

  const list = useMemo(() => {
    if (!configured || !rows?.length) return []
    const out = []
    for (const r of rows) {
      if (!canBid(r, now)) continue
      if (!inRegion(r, region)) continue
      if (lics.length && !licHit(r.lic, lics, licNone)) continue
      const qb = quickBid(r, p50)
      if (!qb) continue
      const od = idx?.pick ? pickOdds(r, idx.pick, qb.amt) : null
      out.push({ r, qb, od })
    }
    out.sort((a, b) => stamp14(a.r.close).localeCompare(stamp14(b.r.close)))
    return out
  }, [configured, rows, region, lics, licNone, p50, idx, now])

  const toggleLic = (code) => {
    const c = String(code)
    const v = lics.includes(c) ? lics.filter((x) => x !== c) : [...lics, c]
    setLics(v); saveLicCodes(v)
  }
  const pickRegion = (r) => { setRegion(r); saveRegion(r) }
  const toggleNone = () => { const v = !licNone; setLicNone(v); saveLicNone(v) }
  const copy = (no, amt) => {
    navigator.clipboard?.writeText(String(amt))
    setCopied(no); setTimeout(() => setCopied(''), 1600)
  }
  /* «기회» 축의 색 — 아래쪽 riskTone(살아남을 확률)과는 다른 축이라 따로 둡니다. 이 함수 하나만 씁니다. */
  const tone = (p) => (p == null ? 'none' : p >= 15 ? 'hot' : p >= 5 ? 'warm' : 'cool')

  const showEditor = editing || !configured

  return (
    <div className="mytoday">
      <div className="mt-h">
        <span className="mt-t">⚡ 오늘 넣을 것</span>
        {configured && !editing && (
          <span className="mt-cond">
            {licNames.length ? licNames.join(' · ') : '면허 전체'} · {region}
            {' '}<button className="lnk" onClick={() => setEditing(true)}>조건 바꾸기</button>
          </span>
        )}
        {editing && <button className="lnk" onClick={() => setEditing(false)}>닫기</button>}
      </div>

      {showEditor && (
        <div className="mt-setup">
          {!configured && (
            <div className="mt-lead">
              <b>면허와 지역을 고르면</b> 여기에 <b>오늘 넣을 수 있는 공고</b>가 금액과 함께 뜹니다.
              {' '}이 브라우저에만 저장되고, 서버로는 아무것도 가지 않습니다.
            </div>
          )}
          <div className="mt-lab">내 면허 <span className="hint">— 여러 개 고를 수 있습니다</span></div>
          {licOptions.length ? (
            <div className="chips wrap">
              {licOptions.map(([code, name, n]) => (
                <button key={code} className={'chip' + (lics.includes(String(code)) ? ' on' : '')}
                  onClick={() => toggleLic(code)} title={`${name} · 최근 ${num(n)}건`}>
                  {licShort(name)}
                </button>
              ))}
              <button className={'chip' + (licNone ? ' on' : '')} onClick={toggleNone}
                title="조달청이 면허를 안 적은 공고">면허 미표기도</button>
            </div>
          ) : <div className="hint">면허 목록을 불러오는 중…</div>}
          <div className="mt-lab" style={{ marginTop: 10 }}>지역</div>
          <div className="chips wrap">
            {REGIONS.map((r) => (
              <button key={r} className={'chip' + (region === r ? ' on' : '')} onClick={() => pickRegion(r)}>{r}</button>
            ))}
          </div>
          {configured && (
            <button className="btn sm" style={{ marginTop: 10 }} onClick={() => setEditing(false)}>
              이 조건으로 보기
            </button>
          )}
        </div>
      )}

      {configured && !editing && (
        list.length === 0 ? (
          <div className="mt-empty">
            지금 조건에 맞는 <b>마감 전·계산 가능</b> 공고가 없습니다.
            {' '}<button className="lnk" onClick={() => setEditing(true)}>조건을 넓히거나</button>
            {' '}<a href="/live">공고 탭에서 전체 보기 →</a>
          </div>
        ) : (
          <>
            {list.slice(0, MAX).map(({ r, qb, od }) => {
              const dd = dday(r.close)
              const rate = od && od.rate != null ? od.rate : null
              return (
                <div className={'tp-card t-' + tone(rate)} key={r.no}>
                  <div className="tp-top">
                    {rate != null
                      ? <span className="tp-odds">이런 자리 1순위 {rate.toFixed(1)}%</span>
                      : <span className="tp-odds muted">확률 실측 부족</span>}
                    {/* 마감 색은 공고 탭과 같은 규칙(.badge + dday 의 tone): 24시간 안 빨강 · D-3 안 주황 · 그 밖 파랑 */}
                    <span className={'tp-dd badge ' + (dd?.tone || 'n')}>{dd?.text || dateTime(r.close)}</span>
                  </div>
                  <div className="tp-name">{r.name}</div>
                  <div className="tp-meta">
                    {r.inst}
                    {od && od.enp > 0
                      ? <> · 예상 참가 <b>{num(od.enp)}곳</b><span className="tp-src"> (기관 최근 {num(od.enpn)}건 중앙)</span></>
                      : <> · 예상 참가 <span className="tp-src">모름 (기관 표본 부족)</span></>}
                    {od && od.enp === 1 && (
                      <span className="tp-warn"> · 단독 입찰이 잦은 기관 — 참가 자격을 꼭 확인하세요</span>
                    )}
                  </div>
                  <div className="oneclick">
                    <div className="oc-l">
                      <span className="oc-tag">권장 투찰금액</span>
                      <span className="oc-amt">{won(qb.amt)}</span>
                      <span className="oc-sub">
                        투찰률 {qb.rate.toFixed(3)}% · 사정률 {qb.pctile}분위
                        {qb.mode === 'auto' ? ' (예상 참가로 자동)' : ''}
                      </span>
                    </div>
                    <div className="oc-r">
                      <button className="cbtn" onClick={() => copy(r.no, qb.amt)}>
                        {copied === r.no ? '✓ 복사했습니다' : '금액 복사'}
                      </button>
                      {/* 조달청이 준 주소 그대로 — 손으로 만들면 차수를 틀립니다(실제 사고) */}
                      {r.url && <a className="cbtn ghost" href={r.url} target="_blank" rel="noreferrer">나라장터 →</a>}
                      <button className="cbtn ghost" onClick={() => onPick(r)}>자세히</button>
                    </div>
                  </div>
                </div>
              )
            })}
            <div className="tp-foot">
              마감 임박 순 · 조건에 맞는 마감 전 공고 <b>{num(list.length)}건</b> 중 {Math.min(MAX, list.length)}건.
              {' '}«이런 자리 1순위 %» 는 같은 규모·같은 참가업체수 자리의 실측이지 이 공고의 예측이 아닙니다.
              {list.length > MAX && <> 나머지는 <a href="/live">공고 탭의 🎯 자리 찾기</a>에서.</>}
            </div>
          </>
        )
      )}
    </div>
  )
}
