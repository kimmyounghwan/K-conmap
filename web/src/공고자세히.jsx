/* 📋 공고 자세히 — 공고 카드(펼친 칸 · /live) 와 공고 한 건 화면(/notice/번호)이 «같은 칸» 을 쓰게 (2026-09-30)
   소장님: 입찰나라에서 가져올 것 «공고 화면에 투찰제한 · 입찰 일정» · 「편리성, 기능성 유지하면서」 · 「핸드폰에서도 편리하게」

   전에는 이 칸들이 공고 카드(LiveBoard.jsx) 안에만 있었습니다. 검색으로 /notice/번호 에 바로 들어온 사람은
   계약방법 · 낙찰방법 · 참가지역 · 담당 · 첨부를 못 봤습니다. → 한 벌로 떼어 두 화면이 같이 씁니다.
   ⚠️ 숫자 · 글은 모두 조달청이 준 칸 그대로입니다(collect.py row_live). 공고문 글에서 뽑지 않습니다 —
      입찰나라가 A값 · 순공사비를 공고문에서 잘못 뽑아 보여 준 것을 직접 봤습니다(2026-09-30). */
import { useMemo, useRef, useState } from 'react'
import { dateTime, dday } from './lib/fmt.js'
import { getJSON } from './lib/data.js'

/* 붙임 파일 정렬 · 뱃지용 갈래.
   ⚠️ collect.py 의 NAEYEOK_KIND 와 같은 낱말을 씁니다. 한쪽만 고치면
      목록(/change/naeyeok)과 카드가 다른 말을 하게 됩니다. */
export function docRank(nm) {
  const n = String(nm || '')
  if (/설계내역|단가산출|일위대가/.test(n)) return 0   // 단가가 들어 있습니다
  if (/내역|수량산출/.test(n)) return 1
  return 2
}

/* 📅 입찰 일정 — 있는 날짜만. 지난 것은 흐리게, 남은 것은 D-날.
   뺄칸: 이미 다른 곳에 보이는 날짜(공고 카드는 위 표에 입찰마감 · 개찰일시가 있습니다) */
const 일정칸 = [
  ['dt', '공고'],
  ['qreg', '참가자격 등록 마감'],
  ['bbgn', '입찰서 제출 시작'],
  ['close', '입찰 마감'],
  ['openg', '개찰'],
]
export function 입찰일정({ r, 뺄칸 = [] }) {
  const rows = 일정칸.filter(([k]) => !뺄칸.includes(k) && r && r[k] && dateTime(r[k]) !== '-')
  if (!rows.length) return null
  return (
    <div className="ilj">
      <div className="ilj-h">📅 입찰 일정</div>
      {rows.map(([k, nm]) => {
        const dd = k === 'dt' ? null : dday(r[k])
        const 지남 = dd && dd.text === '마감'
        return (
          <div key={k} className={'ilj-r' + (지남 ? ' past' : '')}>
            <span>{nm}</span>
            <b>{dateTime(r[k])}</b>
            {dd && !지남 && <em className={'badge ' + dd.tone}>{dd.text}</em>}
            {지남 && <em className="badge n">지남</em>}
          </div>
        )
      })}
    </div>
  )
}

/* 🧾 투찰 조건 — 누가 · 어떻게 넣나 */
export function 투찰조건({ r, 번호없이 = false }) {
  if (!r) return null
  return (
    <div className="kv2">
      {r.main && <div><span>주공종</span><b>{r.main}</b></div>}
      {r.site && <div><span>공사지역</span><b>{r.site}</b></div>}
      {r.pmth && <div><span>예정가격</span>
        <b>{r.pmth}{r.ptot ? ` · ${r.ptot}개 중 ${r.pdrw}개 추첨` : ''}</b></div>}
      {r.kind && <div><span>공고종류</span><b>{r.kind}</b></div>}
      {r.mthd && <div><span>계약방법</span><b>{r.mthd}</b></div>}
      {r.swin && <div><span>낙찰방법</span><b>{r.swin}</b></div>}
      {r.rgn && <div><span>참가지역</span><b>{r.rgn}</b></div>}
      {r.rgnb && <div><span>지역 판단</span><b>{r.rgnb}</b></div>}
      {r.ind && <div><span>참가업종</span><b>{r.ind}</b></div>}
      {r.joint && <div><span>공동수급</span><b>{r.joint}</b></div>}
      {r.rebid && <div><span>재입찰</span><b>{r.rebid === 'Y' ? '허용' : '불허'}</b></div>}
      {r.dmnd && <div><span>수요기관</span><b>{r.dmnd}</b></div>}
      {(r.ofcl || r.tel) && (
        <div><span>담당</span><b>{[r.ofcl, r.tel].filter(Boolean).join(' · ')}</b></div>
      )}
      {!번호없이 && <div><span>공고번호</span><b>{r.no}{r.ord ? `-${r.ord}` : ''}</b></div>}
    </div>
  )
}

/* 📎 공고문 첨부 — 조달청이 준 이름 · 주소 그대로입니다.
   2026-09-05: 내역서를 갈래로 갈라 앞으로 올리고 뱃지를 붙였습니다.
   «설계내역서» 에는 발주처 설계 단가가 들어 있어 가장 값어치가 큽니다. */
export function 공고첨부({ r }) {
  const docs = (r && r.docs) || []
  if (!docs.length) return null
  return (
    <div className="docs">
      <div className="h">
        공고문 첨부 <em>{docs.length}개 · 나라장터에서 바로 받습니다</em>
      </div>
      {[...docs]
        .map((d, i) => [d, docRank(d[0]), i])
        .sort((a, b) => a[1] - b[1] || a[2] - b[2])
        .map(([[nm, u], rk]) => (
          <a key={u} href={u} target="_blank" rel="noreferrer"
            className={'doc' + (rk === 0 ? ' hot' : '')}>
            <span className="di">{rk === 0 ? '💰' : rk === 1 ? '📑' : '📄'}</span>
            <span className="dn">{nm}</span>
            {rk === 0 && <b className="dtag">단가 있음</b>}
          </a>
        ))}
    </div>
  )
}

/* 📄 공고문 전문 — 누를 때만 받습니다(한 건 몇 KB · /data/ntext/{공고번호}.json · ntext.py 가 만듦)
   ■ 편리함을 지키려고
     · 접어 둡니다 — 카드 길이가 늘지 않게. 펼치면 상자 안에서만 스크롤(폰 화면의 70%).
     · «자격 · 보증금 · 낙찰 · 개찰 …» 제목 알약 — 누르면 그 줄로 바로 갑니다(긴 공고문을 폰에서 손가락으로 안 내려도 되게).
     · 글 찾기 — 폰에서는 브라우저 «찾기» 가 불편합니다. 찾은 곳을 칠하고 ▼ 로 다음.
   ⚠️ 첨부 공고문에서 «글만» 옮긴 것입니다. 금액 · 하한율 · 일정은 위 칸(조달청 자료)이 기준 — 여기서 숫자를 뽑지 않습니다. */

const 제목말 = [
  ['자격', /입찰\s*참가\s*자격|참가\s*자격/],
  ['공동수급', /공동\s*수급|공동\s*도급/],
  ['보증금', /입찰\s*보증금/],
  ['예정가격', /예정\s*가격/],
  ['낙찰', /낙찰자\s*결정|낙찰\s*방법|적격\s*심사/],
  ['입찰서 제출', /입찰서\s*(의\s*)?제출|전자\s*입찰/],
  ['개찰', /개\s*찰/],
  ['무효', /입찰\s*무효|무효\s*입찰/],
  ['계약', /계약\s*(체결|조건|이행)/],
  ['문의', /문의|담당/],
]

export function 공고문전문({ r }) {
  const [열림, set열림] = useState(false)
  const [d, setD] = useState(undefined)
  const [찾, set찾] = useState('')
  const [몇째, set몇째] = useState(0)
  const [복사, set복사] = useState(false)
  const 상자 = useRef(null)
  const no = r && r.no

  const 줄들 = useMemo(() => (d && d.t ? String(d.t).split('\n') : []), [d])
  const 알약 = useMemo(() => {
    const out = []
    for (const [이름, re] of 제목말) {
      /* 제목처럼 보이는 짧은 줄(번호 · 기호로 시작하거나 30자 안)에서 처음 나온 곳 */
      const i = 줄들.findIndex((ln) => ln.length <= 40 && re.test(ln))
      if (i >= 0) out.push([이름, i])
    }
    return out.sort((a, b) => a[1] - b[1])
  }, [줄들])
  const 맞은 = useMemo(() => {
    const q = 찾.trim()
    if (q.length < 2) return []
    const out = []
    줄들.forEach((ln, i) => { if (ln.includes(q)) out.push(i) })
    return out
  }, [찾, 줄들])

  if (!no || !r.nt) return null

  const 열기 = () => {
    set열림((v) => !v)
    if (d === undefined) {
      getJSON(`/data/ntext/${encodeURIComponent(no)}.json`).then((v) => setD(v || null)).catch(() => setD(null))
    }
  }
  const 가기 = (i) => {
    const box = 상자.current
    const el = box && box.querySelector(`[data-i="${i}"]`)
    if (box && el) box.scrollTop = Math.max(0, el.offsetTop - 8)   /* 상자가 position:relative — offsetTop 이 곧 상자 안 자리 */
  }
  const 다음 = () => {
    if (!맞은.length) return
    const k = (몇째 + 1) % 맞은.length
    set몇째(k); 가기(맞은[k])
  }
  const 칠 = (ln) => {
    const q = 찾.trim()
    if (q.length < 2 || !ln.includes(q)) return ln
    const ps = ln.split(q)
    return ps.flatMap((p, j) => (j ? [<mark key={j}>{q}</mark>, p] : [p]))
  }

  return (
    <div className="ntx" onClick={(e) => e.stopPropagation()}>
      <button type="button" className={'ntx-btn' + (열림 ? ' on' : '')} onClick={열기}>
        📄 공고문 전문 {열림 ? '접기 ▲' : '보기 ▼'}
        <i>나라장터에 안 가도 · 폰에서도 읽힘</i>
      </button>
      {열림 && d === undefined && <div className="skel" style={{ height: 120, marginTop: 8 }} />}
      {열림 && d === null && (
        <div className="note sm" style={{ marginTop: 8 }}>공고문 글을 받지 못했습니다 — 아래 첨부에서 원문을 받아 보세요.</div>
      )}
      {열림 && d && (
        <>
          <div className="ntx-tools">
            {알약.length > 0 && (
              <div className="chips">
                {알약.map(([이름, i]) => (
                  <button key={이름} type="button" className="chip" onClick={() => 가기(i)}>{이름}</button>
                ))}
              </div>
            )}
            <div className="ntx-find">
              <input className="inp" value={찾} placeholder="글 찾기 (두 글자 이상)"
                onChange={(e) => { set찾(e.target.value); set몇째(0) }}
                onKeyDown={(e) => { if (e.key === 'Enter') 다음() }} aria-label="공고문에서 찾기" />
              {찾.trim().length >= 2 && (
                <button type="button" className="chip" onClick={다음} disabled={!맞은.length}>
                  {맞은.length ? `${몇째 + 1}/${맞은.length} ▼` : '없음'}
                </button>
              )}
              <button type="button" className="chip" onClick={() => {
                try { navigator.clipboard?.writeText(d.t); set복사(true); setTimeout(() => set복사(false), 1500) } catch { /* 옛 브라우저 */ }
              }}>{복사 ? '✓ 복사함' : '글 복사'}</button>
            </div>
          </div>
          <div className="ntx-box" ref={상자}>
            {줄들.map((ln, i) => (
              ln ? <div key={i} data-i={i} className={ln.includes(' | ') ? 'tr' : ''}>{칠(ln)}</div>
                : <div key={i} data-i={i} className="gap" />
            ))}
            {d.cut ? <div className="note sm">— 뒷부분은 길어서 줄였습니다. 아래 첨부에서 원문을 보세요.</div> : null}
          </div>
          <div className="note sm" style={{ marginTop: 6 }}>
            첨부 «{d.f}» 에서 <b>글만</b> 옮겼습니다 — 표 · 그림은 줄이 흩어지거나 빠질 수 있습니다.
            금액 · 하한율 · 일정은 위 칸(조달청 자료)을 기준으로 보세요.
          </div>
        </>
      )}
    </div>
  )
}
