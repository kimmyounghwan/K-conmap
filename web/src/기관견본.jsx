/* ── 📄 발주기관 분석 견본 — «이용자 모두»에게 보입니다 (2026-09-28) ─────────
   소장님: 「발주기관 분석도 좀 더 세세하게 할 수 없을까? 업체 자가 진단 처럼
            PDF 견본을 보여주고 신청하게 하는 거지」 · 「자가진단하고 같은 형태로 가자」
   업체 견본줄(pages/Analysis.jsx)과 «같은 모양» 입니다 — 견본을 먼저 보여 주고, 옆에 신청 단추.
   만드는 화면(/report/agency)은 소장님 것입니다. 여기에는 그 길을 적지 않습니다.
   쓰는 곳: 분석 › 발주기관 탭 · 기관 화면(/agency/{기관}) 맨 아래. */
import { Link } from 'react-router-dom'

export default function 기관견본줄({ name }) {
  return (
    <div className="card" style={{ marginTop: 12 }}>
      <div className="detail-h" style={{ marginBottom: 8 }}>
        📄 발주기관 분석 견본 <span className="count">· 정밀 보고서</span>
      </div>
      <div className="muted" style={{ fontSize: 13, lineHeight: 1.65, marginBottom: 10 }}>
        {name ? <><b>{name}</b> 공고에 </> : <>한 기관 공고에 </>}
        3년 동안 몇 곳이 들어왔고 낙찰이 몇 %에서 났는지, 1·2위가 몇 %p 차이로 갈렸는지,
        사정률은 어디서 뽑혔는지, 누가 자주 들어오는지까지 A4 한 벌로 묶은 종이입니다.
        견본을 먼저 보시고, 받아 보고 싶으시면 사랑방에 <b>기관 이름</b>만 한 줄 남겨 주세요.
      </div>
      <div className="btn-row" style={{ justifyContent: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
        <a className="btn primary" href="/agency-sample.pdf" target="_blank" rel="noopener">📄 견본 PDF 열기</a>
        <Link className="btn line" to="/qna">💬 사랑방에 신청하기</Link>
      </div>
    </div>
  )
}
