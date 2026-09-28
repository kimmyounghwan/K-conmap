/* 🤝 공동도급 칸 — 공고 카드 딱지 · 펼친 칸 · 거르개 (2026-09-27)
 *   판정은 lib/공동.js 한 곳에서만 합니다. 여기는 «그리기» 만 합니다.
 *   공고 탭(LiveBoard)과 바로투찰이 같이 씁니다.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { 공동판정, 협정남은, 구성원글, 면허키들, 회사합치기, 회사나누기 } from './lib/공동.js'
import { getJSON } from './lib/data.js'
import { REGIONS, num } from './lib/fmt.js'

/** 카드 딱지 — 공동이 안 되는 공고는 아무것도 안 그립니다 */
export function 공동딱지({ r, 나 }) {
  const 판 = 공동판정(r, 나)
  if (!판.허용) return null
  const 남 = 협정남은(판.재료.협정마감)
  let 글 = '🤝 공동 가능', 결 = ''
  if (판.참가불가) { 글 = '🤝 공동도 지역제한'; 결 = ' off' }
  else if (판.공동이면) { 글 = '🤝 공동이면 가능'; 결 = ' need' }
  else if (판.기회.length) { 글 = '🤝 우리 지역 의무'; 결 = ' opp' }
  else if (판.재료.의무) 글 = '🤝 지역의무 공동'
  return (
    <span className={'jbadge' + 결} title={판.방식}>
      {글}{남 && 남 !== '마감됨' ? <em> · 협정 {남}</em> : null}
    </span>
  )
}

/** 펼친 칸 — 방식 · 판정 · 협정서 마감 · 의무 지역 · 구성원 후보 · 사랑방 */
export function 공동칸({ r, 나 }) {
  const 판 = 공동판정(r, 나)
  if (!판.허용) return null
  const 재 = 판.재료
  const 남 = 협정남은(재.협정마감)
  const 곳 = (재.의무원문 && 재.의무원문.length ? 재.의무원문 : 재.의무시도).join('·')
  const 초안 = 구성원글(r, 판)
  return (
    <div className="jointbox">
      <div className="jh">🤝 공동도급 — <b>{판.방식}</b>{재.제출 ? <em> · 협정서 {재.제출} 제출</em> : null}</div>
      {판.참가불가 && <div className="jl off">⛔ {판.참가불가}</div>}
      {판.단독불가.map((x, i) => <div key={'n' + i} className="jl need">🟠 {x.글}</div>)}
      {판.기회.map((x, i) => <div key={'o' + i} className="jl opp">🟢 {x.글}</div>)}
      {판.확인.map((x, i) => <div key={'c' + i} className="jl chk">ℹ️ {x}</div>)}
      {!판.참가불가 && !판.단독불가.length && !판.기회.length && !판.확인.length && (
        <div className="jl">단독으로도, 다른 업체와 공동으로도 넣을 수 있는 공고입니다(공고서의 자격 요건은 따로 확인).</div>
      )}
      <div className="jkv">
        {재.협정마감 && <div><span>협정서 마감</span><b>{재.협정마감}{남 ? ` (${남})` : ''}</b></div>}
        {재.의무 && <div><span>지역의무 공동도급</span><b>{곳 || '공고서 확인'}{재.지분 > 0 ? ` · 지분 ${재.지분}% 이상` : ''}</b></div>}
        {재.공동도지역제한 && <div><span>공동수급 업체</span><b>지역제한 적용</b></div>}
      </div>

      <구성원찾기 r={r} 판={판} 나={나} />

      <div className="jbtns">
        <Link className="btn sm" to="/qna" state={{ 새글: { c: '후기·건의', t: 초안.t, b: 초안.b } }}>✏️ 사랑방에 구성원 구하는 글 쓰기</Link>
        {/* 🩹 2026-09-28 소장님 「이 공고글 보기 클릭하면 사랑방으로 가는데」 — «공고문 보기» 로 읽혔습니다. 사랑방 글이라는 것을 이름에 밝히고,
            가서 글이 없으면 «이 공고로 첫 글 쓰기» 를 바로 보여 줍니다(초안을 같이 넘김). */}
        <Link className="btn ghost sm" to="/qna"
          state={{ 찾기: String(r.no || ''), 찾기이름: String(r.name || ''), 초안: { c: '후기·건의', t: 초안.t, b: 초안.b } }}>
          💬 사랑방에 올라온 이 공고 구성원 글</Link>
      </div>
      <div className="note sm" style={{ marginBottom: 0 }}>
        실적·시공능력(시평액) 제한 공고면 <b>공동이행</b>으로 구성원 것을 합산할 수 있고, 적격심사 점수도 지분대로 합산합니다 —
        기준은 공고서와 계약예규(공동계약운용요령)로 확인하세요. <b>투찰 금액은 구성원 밖 업체와 이야기하지 마십시오</b> — 입찰담합입니다.
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   👥 같이 넣을 수 있는 회사 — 누르면 받습니다(면허 파일 1~4개, 첫 화면 전송량에 안 얹습니다)
   ══════════════════════════════════════════════════════════════ */
function 구성원찾기({ r, 판, 나 }) {
  const [상태, set상태] = useState('아직')      // 아직 · 받는중 · 끝 · 실패
  const [나눔, set나눔] = useState(null)
  const 키 = 면허키들(r.lic)
  const 받기 = async () => {
    set상태('받는중')
    try {
      const ix = await getJSON('/data/partners/_idx.json')
      const 있는 = 키.filter((k) => ix && ix.r && ix.r[k])
      const 파일들 = await Promise.all(있는.map((k) => getJSON(`/data/partners/${k}.json`)))
      set나눔(회사나누기(회사합치기(파일들.filter(Boolean)), 판))
      set상태(ix ? '끝' : '실패')
    } catch (e) { set상태('실패') }
  }
  if (!키.length) return <div className="jcand muted sm">이 공고는 면허 제한이 적혀 있지 않아 같이 넣을 회사를 가려내지 못합니다.</div>
  if (상태 === '아직') return (
    <div className="jcand"><button className="btn ghost sm" onClick={받기}>👥 같이 넣을 수 있는 회사 찾기</button></div>
  )
  if (상태 === '받는중') return <div className="jcand muted sm">회사를 찾는 중…</div>
  if (상태 === '실패' || !나눔) return <div className="jcand muted sm">회사 목록을 받지 못했습니다. 잠시 뒤 다시 열어 주세요.</div>
  const 재 = 판.재료
  const 곳 = (재.의무시도 || []).join('·')
  const 내쪽 = 나.지역 ? ((재.의무시도 || []).includes(나.지역) ? '현지' : '외지') : ''
  return (
    <div className="jcand">
      {나눔.종류 === '의무' && (
        <>
          <div className="jpair">🤝 <b>①에서 한 곳 + ②에서 한 곳</b>이면 이 공고에 공동으로 넣을 수 있는 짝입니다
            {재.지분 > 0 ? <> — ① 몫이 지분 <b>{재.지분}% 이상</b></> : null}.
            {내쪽 === '현지' && <> 우리 회사({나.지역})는 <b>①</b> 쪽입니다 — ② 회사들이 짝을 찾습니다.</>}
            {내쪽 === '외지' && <> 우리 회사({나.지역})는 <b>②</b> 쪽입니다 — ①에서 짝을 찾으세요.</>}
          </div>
          <회사목록 제목={`① ${곳} 회사 — 의무 지역 구성원 몫`} 회사={나눔.현지} />
          <회사목록 제목="② 그 밖 회사 — 이 공고 면허로 투찰한 적 있음" 회사={나눔.외지} 접기 />
        </>
      )}
      {나눔.종류 === '제한' && (
        <>
          <div className="jpair">지역제한 공고({(재.제한시도 || []).join('·')}) — 그 지역 근거가 있는 회사만 보여 드립니다. 두 곳 이상이 모이면 공동으로 넣을 수 있습니다.</div>
          <회사목록 제목="이 지역 · 이 면허 회사" 회사={나눔.가능} />
          {나눔.모름수 > 0 && <div className="muted sm">지역 근거가 아직 없는 회사 {num(나눔.모름수)}곳은 뺐습니다(그 지역 회사일 수도 있습니다).</div>}
        </>
      )}
      {나눔.종류 === '면허' && (
        <>
          <div className="jpair">이 공고 면허로 투찰한 적이 있는 회사입니다 — <b>두 곳 이상이 모이면</b> 공동으로 넣을 수 있습니다{/[SM]/.test(재.코드) ? ' (분담이행이면 면허를 나눠 가질 수 있습니다)' : ' (공동이행은 구성원 모두 면허가 있어야 합니다)'}.</div>
          <회사목록 제목="같이 넣을 수 있는 회사" 회사={나눔.전부} />
        </>
      )}
      <div className="muted sm" style={{ marginTop: 6 }}>
        근거: 이 면허 공고에 <b>실제로 투찰한 기록</b>(면허가 없으면 투찰이 막힙니다) · 지역은 지역제한 공고 투찰·낙찰자 주소.
        시공능력(시평액)·실적·지분 여력은 모릅니다 — 업체 화면과 공고서로 확인하세요. 연락처는 싣지 않습니다.
      </div>
    </div>
  )
}

function 회사목록({ 제목, 회사, 접기 }) {
  const [열림, set열림] = useState(!접기)
  const [q, setQ] = useState('')
  const [쪽, set쪽] = useState(1)
  const 한쪽 = 20
  const 걸러 = q.trim() ? 회사.filter((c) => (c.n || '').includes(q.trim())) : 회사
  const 쪽수 = Math.max(1, Math.ceil(걸러.length / 한쪽))
  const 보일 = 걸러.slice((쪽 - 1) * 한쪽, 쪽 * 한쪽)
  const 날 = (d) => (d && d.length === 8 ? `${d.slice(4, 6)}.${d.slice(6, 8)}` : '')
  return (
    <div className="jlist">
      <button className="jlh" onClick={() => set열림((v) => !v)}>
        <b>{제목}</b> <em>{num(회사.length)}곳</em> <span>{열림 ? '▲' : '▼'}</span>
      </button>
      {열림 && (회사.length === 0 ? (
        <div className="muted sm">아직 근거가 쌓인 회사가 없습니다 — 개찰이 쌓이면 늘어납니다.</div>
      ) : (
        <>
          {회사.length > 한쪽 && (
            <input className="inp jq" value={q} placeholder="회사 이름으로 찾기"
              onChange={(e) => { setQ(e.target.value); set쪽(1) }} />
          )}
          <div className="jrows">
            {보일.map((c) => (
              <div key={c.b} className="jrow">
                <Link to={'/corp/' + encodeURIComponent(c.n || '')}>{c.n || '(이름 없음)'}</Link>
                <span className="js">{c.s.length ? c.s.join('·') : '지역 모름'}</span>
                <span className="jn">최근 참가 {num(c.p)}{c.w ? ` · 1순위 ${num(c.w)}` : ''}{날(c.d) ? ` · ${날(c.d)}` : ''}</span>
              </div>
            ))}
          </div>
          {쪽수 > 1 && (
            <div className="pager">
              <button className="btn ghost sm" disabled={쪽 <= 1} onClick={() => set쪽(쪽 - 1)}>이전</button>
              <span>{쪽} / {쪽수}</span>
              <button className="btn ghost sm" disabled={쪽 >= 쪽수} onClick={() => set쪽(쪽 + 1)}>다음</button>
            </div>
          )}
        </>
      ))}
    </div>
  )
}

/** 거르개 — «공동 되는 공고만» · «단독은 안 되고 공동이면 되는 공고만» · 🏢 우리 회사 지역 */
export function 공동거르개({ 값, set값, 우리지역, set우리지역 }) {
  const [열림, set열림] = useState(false)
  const 글 = 값 === 'need' ? ' · 공동이면 되는 공고' : 값 === 'all' ? ' · 공동 되는 공고' : ''
  return (
    <div className="amtbar">
      <button className={'chip' + (값 ? ' on' : '')} onClick={() => set열림((v) => !v)}>
        🤝 공동도급{글} {열림 ? '▲' : '▼'}
      </button>
      {값 && <button className="chip" onClick={() => set값('')}>지우기 ✕</button>}
      {열림 && (
        <div className="amtbox">
          <div className="chips wrap">
            <button className={'chip' + (값 === 'all' ? ' on' : '')} onClick={() => set값(값 === 'all' ? '' : 'all')}>공동도급 되는 공고만</button>
            <button className={'chip' + (값 === 'need' ? ' on' : '')} onClick={() => set값(값 === 'need' ? '' : 'need')}>단독은 안 되고 공동이면 되는 공고만</button>
          </div>
          <div className="muted sm" style={{ margin: '8px 0 4px' }}>🏢 우리 회사 지역 <span>(이 브라우저에만 저장)</span></div>
          <div className="chips wrap">
            {REGIONS.filter((x) => x !== '전국').map((x) => (
              <button key={x} className={'chip' + (우리지역 === x ? ' on' : '')}
                onClick={() => set우리지역(우리지역 === x ? '' : x)}>{x}</button>
            ))}
          </div>
          <div className="note sm">
            조달청이 공고에 적어 준 <b>공동수급 방식 · 지역의무 공동도급(지역·지분) · 협정서 마감</b>으로 거릅니다.
            «단독은 안 되고 공동이면 되는» 것은 지금 <b>지역의무 공동도급</b>으로 가립니다 — 우리 회사 지역이 의무 지역 밖이면 그 지역 업체와 공동으로만 넣을 수 있습니다.
            {!우리지역 && <b> 우리 회사 지역을 먼저 골라 주세요.</b>}
            {' '}면허·실적·시공능력(시평액)으로 단독이 안 되는 경우는 아직 자료가 없어 가리지 않습니다.
          </div>
        </div>
      )}
    </div>
  )
}
