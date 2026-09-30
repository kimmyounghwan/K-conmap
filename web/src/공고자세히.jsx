/* 📋 공고 자세히 — 공고 카드(펼친 칸 · /live) 와 공고 한 건 화면(/notice/번호)이 «같은 칸» 을 쓰게 (2026-09-30)
   소장님: 입찰나라에서 가져올 것 «공고 화면에 투찰제한 · 입찰 일정» · 「편리성, 기능성 유지하면서」 · 「핸드폰에서도 편리하게」

   전에는 이 칸들이 공고 카드(LiveBoard.jsx) 안에만 있었습니다. 검색으로 /notice/번호 에 바로 들어온 사람은
   계약방법 · 낙찰방법 · 참가지역 · 담당 · 첨부를 못 봤습니다. → 한 벌로 떼어 두 화면이 같이 씁니다.
   ⚠️ 숫자 · 글은 모두 조달청이 준 칸 그대로입니다(collect.py row_live). 공고문 글에서 뽑지 않습니다 —
      입찰나라가 A값 · 순공사비를 공고문에서 잘못 뽑아 보여 준 것을 직접 봤습니다(2026-09-30). */
import { dateTime, dday } from './lib/fmt.js'

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
