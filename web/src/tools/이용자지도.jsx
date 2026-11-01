/**
 * 🗺 지금 K-건설맵을 쓰는 곳 — 바로투찰 맨 위 지도 (2026-10-02 · G114 · G144 2026-10-05 사랑방 → 바로투찰)
 *
 * 소장님: 「건설맵 이용자 지도 만들 수 있어? 실시간으로」 「건설맵 사이트에 띄우는 거지 · 다 볼 수 있게」
 *         「어디에 띄우면 좋을까? 사랑방??」 「숫자는 나중에 하는게 좋을 것 같기도 하고, 지도만 띄우고,,,표시가 나오게..」
 *   → (클로드 의견 · 그대로 하심) 사랑방 맨 위 · 숫자 없이 점만 · 지금(30분 안)은 진한 점(사람이 많으면 조금 크게) · 오늘 다녀간 곳은 옅은 점
 *
 * ■ 자료: fresh/map (tools/이용자지도.py · 깃허브 24시간 10분마다) — 한 번 받고, 화면을 보고 있으면 5분마다 다시(작음 · 1KB 남짓)
 *   바탕 그림: data/한국지도.json (열 때만 받음 · 37KB)
 * ■ 아직 자료가 없으면(애널리틱스 연결 전) 칸을 아예 안 띄웁니다.
 * ■ 점을 누르면(폰) · 올리면(PC) 도시 이름. 사람 수는 보이지 않습니다.
 * ■ (2026-10-02) 소장님 「지도를 조금 더 크게 하고 파란색 점도 더 크게 … 애널리틱스처럼」
 *   → PC 에서 지도 폭 480 → 760px(화면 높이의 78% 안) · 점은 «화면 픽셀» 로 크기를 정함(지도가 작아져도 점이 같이 작아지지 않게)
 *     지금 점 반지름 = 9 · 12 · 15px × 배율(폰 0.75 ~ PC 1.15) · 오늘 점 5px × 배율 · 애널리틱스처럼 반투명 파랑 + 진한 테두리
 * ■ G144 (2026-10-05) 소장님: 「실시간 지도를 바로입찰 상단에 … 조회수가 가장 많으니까 · 지역별 누적도」 「사랑방에 있는 지도는 제거하고」
 *   「사랑방 크기와 같게 지도는 줄이지 말고」 「개설일 8월 30일, 누적은 9월 15일 부터」 「애널리틱스 처럼 누적으로 서울 몇명, 부산 몇명, 실시간으로 올라가게」
 *   「오늘도 카운트 할까?」 → 제목 아래 «2026. 8. 30. 문을 열었습니다 · 오늘 N일째» · 지금(30분 안) 전국 N명 ·
 *   시·도별 «누적 N명 · 오늘 +N» (fresh/reg — 10분마다) · 숫자가 바뀌면 올라가는 모습(카운트업) · 지도 크기는 그대로(PC 760px).
 *   누르면(점 · 시도 줄) 누적 카운트 «|지도|누름» 한 번(화면엔 안 보임).
 * ■ G160 (2026-10-06) 소장님 「공고에서 바로투찰을 하면 … 지도가 사라져」 → 「공간을 너무 많이 차지하지 않고 공간 활용을 잘 해서 배치 해줘」
 *   작게(공고를 골라 온 바로투찰 화면) — 한 줄 상자: 왼쪽 작은 지도(폰 120px · PC 160px 폭) + 오른쪽 «지금 N명 · 누적 · 오늘 +N · 많은 시·도 셋»
 *   · «지도 크게 보기 ▾» 를 누르면 원래 지도로 펼침(📊 |지도|크게). 맨 위에 두어도 금액을 거의 밀어내지 않습니다(폰 약 170px).
 *   · 소장님 「그래, 그렇게 해줘」(Claude 의견: 한 번 «크게» 를 누른 분은 다음부터 계속 큰 지도) → 브라우저가 기억(localStorage kcm.map.big)
 *     · 큰 지도 머리에 «▴ 작게 보기» — 누르면 다시 작은 상자 · 기억도 지움(📊 |지도|작게).
 * ■ 👥 G494 (2026-11-01) 소장님 「지도 제거하고, 이것만 띄우는 걸로 하자」 「어차피 맵톡에 지도 있는데, 또 있는 건 아닌 것 같아」
 *   → 지도(점 · 바탕 그림 · 시·도 막대 · 크게/작게)는 뺌. 남는 것 = «지금(30분 안) N명» + 표(방문자 · 세션 — 누적 · 오늘 · 어제) + 개설일 줄.
 *     공고를 골라 온 화면(작게)은 한 줄(지금 · 누적 · 오늘). 숫자 셈 · 받는 길(lib/방문세기.js · fresh/map · fresh/reg · fresh/ses)은 그대로.
 *     이름은 그대로 이용자지도.jsx(App · BaroBid 가 쓰는 이름 · 지도는 맵톡(맵톡지도.jsx)에 있음).
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { 지도주소, 지역주소, 세션주소, 지역줄들, 날째, 날글, 개설일, 오늘글, 기준글 } from '../lib/이용자지도.js'
import { 세기 } from '../lib/받은수.jsx'
import { 직접인가, 직접받기, 직접줄들, 셈듣기, 한국날, 방문인가, 세션줄, 직접합치기 } from '../lib/방문세기.js'   /* 👥 G315 10/19 0시부터 방문자는 건설맵이 직접 셈 */

const 쉼 = (n) => Math.round(n || 0).toLocaleString('ko-KR')

/* ⏱ 2026-10-21 소장님 「새로고침을 하면 반응이 느려. 왜이러지???」 → 「계속 진행 해줘」
   새로고침하면 지도 상자가 «애널리틱스 옛 숫자(2,042 · 오늘 +0)» 를 먼저 보였다가, 건설맵이 센 숫자(데이터베이스 요청 6개)가 «모두» 와야
   2,579 · +200 으로 바뀌었습니다(한꺼번에 보내면 몇 개가 1.5 ~ 7초).
   → ① 마지막에 받은 숫자를 이 브라우저에 적어 두고(6시간 안 · 숫자뿐) 새로고침하면 그 숫자부터 바로 · 새 숫자가 오면 올라감
     ② 건설맵 숫자가 오기 전에는 옛 숫자 대신 «…» (못 받으면 그때 애널리틱스 숫자)
     ③ 곁 숫자(지금 30분 · 어제 · 세션)는 4초 넘으면 기다리지 않음 — 못 받은 칸은 앞 값 그대로(합치기) */
const 지도기억 = 'kcm.umap.v1'
const 기억틈 = 6 * 3600000
function 기억읽기() {
  try {
    const x = JSON.parse(localStorage.getItem(지도기억) || 'null')
    if (!x || typeof x !== 'object') return {}
    const 나 = {}
    for (const k of ['자료', '지역', '세션', '직접']) if (x[k] && typeof x[k].t === 'number' && Date.now() - x[k].t < 기억틈 && x[k].v) 나[k] = x[k]
    return 나
  } catch (e) { return {} }
}
function 기억쓰기(k, v) {
  if (!v) return
  try { const x = JSON.parse(localStorage.getItem(지도기억) || 'null') || {}; x[k] = { v, t: Date.now() }; localStorage.setItem(지도기억, JSON.stringify(x)) } catch (e) { /* 사생활 창 · 가득 참 — 적지 않음 */ }
}
/** 적어 둔 건설맵 숫자 — 오늘(한국) 것만 · 10분 넘은 «지금(30분 안)» 은 버림(새로 올 때까지 «—») */
function 기억직접(x) {
  if (!x || !x.v || x.v.날 !== 한국날(Date.now())) return null
  const v = { ...x.v }
  if (Date.now() - x.t > 10 * 60000) { v.지금 = null; v.지금곳 = {} }
  return v
}


/** 숫자가 바뀌면 옛 값에서 새 값까지 올라가는 모습(0.9초) — 움직임 줄이기 설정이면 바로 */
function useCountUp(값) {
  const [보임, set보임] = useState(값)
  const 옛 = useRef(값)
  useEffect(() => {
    const from = 옛.current, to = 값
    옛.current = 값
    if (from === to || typeof window === 'undefined') { set보임(to); return undefined }
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) { set보임(to); return undefined }
    const t0 = performance.now()
    let id = 0
    const 걸음 = (t) => {
      const k = Math.min(1, (t - t0) / 900)
      set보임(Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3))))
      if (k < 1) id = requestAnimationFrame(걸음)
    }
    id = requestAnimationFrame(걸음)
    return () => cancelAnimationFrame(id)
  }, [값])
  return 보임
}

function 수({ v }) { return <>{쉼(useCountUp(v))}</> }

export default function 이용자지도({ 작게 = false }) {
  const [기억] = useState(기억읽기)              // ⏱ 마지막에 받은 숫자(새로고침 때 바로 보이게)
  const [자료, set자료] = useState(() => (기억.자료 ? 기억.자료.v : null))
  const [지역, set지역] = useState(() => (기억.지역 ? 기억.지역.v : null))
  const [세션, set세션] = useState(() => (기억.세션 ? 기억.세션.v : null))          // 🔁 fresh/ses — 애널리틱스 세션 9/15~10/21 · 어제 세션 (10/22 0시부터 세션 줄의 바탕)
  const [때, set때] = useState(Date.now())
  const [직접, set직접] = useState(() => 기억직접(기억.직접))          // 👥 G315 {a: vis/a, d: vis/d/오늘, 날, at} — 10/19 0시부터
  const [직접못받음, set직접못받음] = useState(false)   // ⏱ 건설맵 숫자를 못 받음(인터넷 · 막힘) → 그때는 애널리틱스 숫자
  const [비교, set비교] = useState(null)          // 📋 G315 소장님만 — 어제 건설맵이 센 수 · 애널리틱스 (fresh/vcmp/{어제})

  useEffect(() => {
    let 살 = true
    const 받기 = async () => {
      try {
        const [r, g, ss] = await Promise.all([fetch(지도주소, { cache: 'no-store' }), fetch(지역주소, { cache: 'no-store' }).catch(() => null),
          방문인가(Date.now() + 3 * 3600000) ? fetch(세션주소, { cache: 'no-store' }).catch(() => null) : null])   /* 0시 세 시간 전부터 미리 받아 둠 */
        const j = r.ok ? await r.json() : null
        const k = g && g.ok ? await g.json().catch(() => null) : null
        const se = ss && ss.ok ? await ss.json().catch(() => null) : null
        if (살) { set자료(j); set지역(k); if (se) set세션(se); set때(Date.now()); 기억쓰기('자료', j); 기억쓰기('지역', k); 기억쓰기('세션', se) }
      } catch (e) { /* 인터넷 · 막힘 — 숫자 없이 */ }
    }
    받기()
    const 틈 = setInterval(() => { if (document.visibilityState === 'visible') 받기() }, 3 * 60000)    /* G144 3분마다(자료는 10분마다 바뀜) */
    return () => { 살 = false; clearInterval(틈) }
  }, [])

  /* 👥 G315 (2026-10-18) 소장님 「사이트 접속만 하면 세는 걸로 … 동일인은 한 번만」 「12시에 바뀌는 걸로」 「누적도 올라가는 걸로」
     10/19 0시부터 누적 · 오늘 · 해외는 건설맵이 직접 센 수(lib/방문세기.js) — 1분마다 · 이 브라우저가 세어지면 바로 다시 읽음.
     «지금(30분 안)» 도 건설맵이 셈(소장님 「30분 안 숫자. 지역 숫자. 오늘 숫자. 누적 모두」). */
  useEffect(() => {
    let 살 = true
    const 받기 = async () => {
      if (!직접인가(Date.now())) return
      const v = await 직접받기(Date.now())
      if (!살) return
      if (v) { set직접((옛) => { const 합 = 직접합치기(옛, v); 기억쓰기('직접', 합); return 합 }); set직접못받음(false); set때(Date.now()) }
      else set직접못받음(true)
    }
    받기()
    const 틈 = setInterval(() => { if (document.visibilityState === 'visible') 받기() }, 60000)
    const 끄기 = 셈듣기(받기)
    // ⏱ 8초 넘게 안 오면(아주 느린 인터넷) «…» 대신 애널리틱스 숫자라도 — 건설맵 숫자가 오면 그때 바뀜
    const 늦은 = setTimeout(() => { if (살) set직접못받음(true) }, 8000)
    return () => { 살 = false; clearInterval(틈); clearTimeout(늦은); 끄기() }
  }, [])

  /* 📋 G315 소장님만 — 「리셋할 때는 애널리틱스랑 비교해서」 → 어제 건설맵이 센 수와 애널리틱스 수(깃허브 tools/이용자지도.py 가 fresh/vcmp 에 적음) */
  useEffect(() => {
    let 살 = true
    if (!직접인가(Date.now() - 86400000)) return undefined
    import('../lib/운영자.js').then((m) => m.나운영자()).then((op) => {
      if (!op || !살) return
      const 어제 = 한국날(Date.now() - 86400000)
      fetch(`https://k-conmap-default-rtdb.firebaseio.com/fresh/vcmp/${어제}.json`, { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null)).then((v) => { if (살 && v) set비교({ ...v, 날: 어제 }) }).catch(() => {})
    }).catch(() => {})
    return () => { 살 = false }
  }, [])

  /* ⏱ 건설맵 숫자를 기다리는 중(적어 둔 것도 없음) — 애널리틱스 옛 숫자를 잠깐 보였다 바꾸지 않고 «…» */
  const 기다림 = 직접인가(때) && !직접 && !직접못받음
  const 줄들 = useMemo(() => (기다림 ? null : 직접인가(때) ? 직접줄들(지역, 직접, 때) : 지역줄들(지역, 때)), [기다림, 지역, 직접, 때])
  if (!자료) return null
  const 새것 = typeof 자료.at === 'number' && 때 - 자료.at < 45 * 60000
  /* 👥 G315 0시부터 «지금(30분 안)» 도 건설맵이 셈(최근 30분 안에 «여기 있음» 을 남긴 브라우저) — 못 받으면 전처럼 애널리틱스 */
  const 직접지금 = 직접인가(때) && 직접 && typeof 직접.지금 === 'number' ? 직접.지금 : null
  const 지금사람 = 기다림 ? null : 직접지금 != null ? 직접지금 : (새것 && typeof 자료.n === 'number' ? 자료.n : null)
  const 늦음 = !기다림 && !새것 && 직접지금 == null      /* 자료가 늦다는 글은 숫자가 애널리틱스일 때만 */
  const 빈칸 = 기다림 ? '…' : '—'
  const 전국 = 줄들 && 줄들.전국

  /* 👥 G160 · G494 작은 상자 — 공고를 골라 온 화면(금액이 먼저): 한 줄 */
  if (작게) {
    return (
      <div className="card umap umap-mini umap-line">
        <div className="umap-mini-r">
          <span className="umap-mini-n"><b className="umap-mini-t">👥 K-건설맵 방문자</b> · <i className="umap-dot now" /> 지금 <b>{지금사람 != null ? <><수 v={지금사람} />명</> : 빈칸}</b>
            {전국 && <> · 누적 <b><수 v={전국.a} />명</b> · 오늘 <b>+<수 v={전국.t} /></b></>}
            {늦음 && 기준글(자료.at) && <span className="umap-late"> · 자료 {기준글(자료.at)} 기준</span>}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="card umap umap-only">
      <div className="umap-head">
        <div className="umap-title">
          <b>👥 K-건설맵 방문자</b>
          {/* 📅 G151 소장님 「여기에 날짜가 없어」 — 오늘(한국) 날짜 · 요일 */}
          <span className="umap-open">{날글(개설일)} 문을 열었습니다 · 오늘 <b>{오늘글(때)}</b> · <b>{날째(때)}일째</b></span>
        </div>
      </div>
      {기다림 && (
        <div className="umap-reg umap-wait" aria-busy="true">
          <div className="umap-now-n"><i className="umap-dot now" /> 지금(30분 안) <b>…</b></div>
          <div className="umap-tot"><span>전체 누적 <b>…</b></span><span className="umap-today">오늘 {오늘글(때, false)} <b>…</b></span></div>
        </div>
      )}
      {!기다림 && 전국 && (
        <div className="umap-reg">
          <div className="umap-now-n">
            <i className="umap-dot now" /> 지금(30분 안) <b>{지금사람 != null ? <><수 v={지금사람} />명</> : '—'}</b>
            {/* 🩹 G153 — 자료가 45분 넘게 멈추면 «아무것도 안 뜬다» 로 보였습니다(10/6 아침). 늦어진 것을 그대로 알립니다 */}
            {늦음 && 기준글(자료.at) && <span className="umap-late">자료가 늦어지고 있습니다 · {기준글(자료.at)} 기준</span>}
          </div>
          {/* 🔁 2026-10-21 소장님 「세션 누적 세션 당일 이렇게 추가하자」 · 고르심 «표 꼴» — 두 줄 표(방문자 = 사람 셈 그대로 · 세션 = 누적 · 오늘 · 어제) */}
          {(() => {
            const 어제 = 직접인가(때) && 직접 && 직접.어제 && 직접.어제.날 === 한국날(때 - 86400000) ? 직접.어제 : null
            const 세 = 세션줄(직접, 세션, 때)
            if (!세) {
              return (
                <div className="umap-tot">
                  <span>{줄들.합계 ? '전체' : '전국'} 누적 <b><수 v={전국.a} />명</b></span>
                  <span className="umap-today">오늘 {오늘글(때, false)} <b>+<수 v={전국.t} /></b></span>
                  {어제 && <span className="umap-yday">어제 {오늘글(때 - 86400000, false)} <b><수 v={어제.n} />명</b></span>}
                </div>
              )
            }
            const 칸 = (n, 단위, 앞 = '') => (n == null ? <b className="umap-no">—</b> : <b>{앞}<수 v={n} />{단위}</b>)
            return (
              <div className="umap-tbl" role="table" aria-label="방문자 · 세션 — 누적 · 오늘 · 어제">
                <div className="umap-tbl-h" role="row"><span role="columnheader" /><span role="columnheader">누적</span>
                  <span role="columnheader">오늘 {오늘글(때, false)}</span><span role="columnheader">어제 {오늘글(때 - 86400000, false)}</span></div>
                <div className="umap-tbl-r" role="row"><span role="rowheader">방문자</span>{칸(전국.a, '명')}
                  <span className="up">{칸(전국.t, '', '+')}</span>{칸(어제 ? 어제.n : null, '명')}</div>
                <div className="umap-tbl-r" role="row"><span role="rowheader">세션</span>{칸(세.누적, '회')}
                  <span className="up">{칸(세.오늘, '회')}</span>{칸(세.어제, '회')}</div>
              </div>
            )
          })()}
        </div>
      )}
      {비교 && (
        <div className="umap-foot">
          {/* 🩹 G315 소장님 「«구글 애널리틱스» 에서 «건설맵이 직접 셈 · 같은 브라우저 하루 한 번» ---- 삭제」 → 어디서 센 것인지 적은 글을 뺌 */}
          <span className="muted umap-src">📋 소장님만 · 어제({날글(비교.날).slice(6)}) 건설맵 {쉼(비교.me)}명 · 애널리틱스 {쉼(비교.ga)}명{typeof 비교.gs === 'number' && typeof 비교.ms === 'number' && 비교.ms > 0 && <> · 세션 건설맵 {쉼(비교.ms)}회 · 애널리틱스 {쉼(비교.gs)}회</>}</span>
        </div>
      )}
    </div>
  )
}
