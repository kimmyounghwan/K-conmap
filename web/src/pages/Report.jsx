/**
 * /report — 「업체 입찰 성적표」 (2026-09-15)
 *
 * 소장님: 「입찰성적표를 사이트에 올려야 하잖아. 설명도 붙여야 하지 않아?」
 *         「기여도에 따라 성적표 제공, 업체 선정은 건설맵이」
 *
 * ■ 자가진단과 무엇이 다른가 — 이게 이 화면이 있는 이유입니다
 *     자가진단(/corp/{업체})은 «1순위 기록» 만 봅니다. 딴 것만 보입니다.
 *     성적표는 3년치 개찰에서 그 업체가 «넣은 것 전부» 를 찾아 봅니다 —
 *     떨어진 것, 실격된 것, 아깝게 밀린 것까지. 그게 고칠 거리입니다.
 *
 * ■ 값은 안 받습니다. 다만 한 번에 여러 곳을 못 만듭니다.
 *    그래서 «건설맵에 한 줄이라도 보태 주신 분» 부터 만들어 드립니다.
 *    ⚠️ 여기에 «언제까지 만들어 드린다» 는 말을 적지 않습니다 — 지킬 수 없는 약속입니다.
 */
import { Link } from 'react-router-dom'

export default function Report() {
  return (
    <>
      <div className="card lead-card">
        <h1 style={{ margin: 0, fontSize: 20 }}>📊 업체 입찰 성적표</h1>
        <p className="why2" style={{ marginBottom: 6 }}>
          3년치 개찰 기록에서 <b>그 업체가 넣은 것을 전부 찾아</b> A4 한 벌로 만들어 드립니다.
        </p>
        <p className="muted" style={{ margin: 0 }}>
          자가진단은 <b>딴 것만</b> 보입니다. 성적표는 <b>떨어진 것까지</b> 봅니다 —
          고칠 거리는 거기 있습니다.
        </p>
      </div>

      {/* ── 무엇이 다른가 ── */}
      <div className="card">
        <div className="sec-title">자가진단과 무엇이 다른가</div>
        <table className="tbl left reptbl">
          <tbody>
            <tr>
              <td className="w"><b>업체 자가진단</b><span className="d">사이트에서 바로</span></td>
              <td>3년치 개찰의 <b>1순위(낙찰) 기록만</b>. 어느 지역·기관에서 땄는지, 평균 투찰률이 얼마인지.
                <b> 낙찰이 없으면 볼 것이 없습니다.</b></td>
            </tr>
            <tr>
              <td className="w"><b>입찰 성적표</b><span className="d">만들어 드립니다</span></td>
              <td><b>넣은 것 전부</b>를 찾습니다. 떨어진 것 · 실격된 것 · 아깝게 밀린 것.
                <b> 낙찰이 한 건도 없어도 나옵니다.</b></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── 무엇이 들어가나 ── */}
      <div className="card">
        <div className="sec-title">성적표에 들어가는 것</div>
        <ul className="flist">
          <li><b>왜 떨어졌나</b> — 낙찰하한 미달로 <b>실격</b>이었는지, 하한은 넘겼는데 밀렸는지.
            둘은 고치는 방법이 완전히 다릅니다</li>
          <li><b>투찰 버릇</b> — 늘 같은 자리를 겨누는지, 회차마다 흔들리는지</li>
          <li><b>다음 자리</b> — 그 기관 · 그 금액대에서 <b>실제로 어느 자리가 낙찰선</b>이었는지</li>
          <li><b>놓친 자리</b> — 넣었으면 땄을 공고</li>
          <li><b>금액대별 성적</b> — 어느 규모에서 강하고 어느 규모에서 밀리는지</li>
          <li><b>기관별 낙찰선</b> — 자주 들어가는 기관이 어떤 자리인지</li>
          <li><b>「바로투찰 금액이었다면」</b> — 그때 우리 권장금액을 썼다면 <b>몇 위였을지</b> 되짚어 봅니다</li>
        </ul>
        <div className="btn-row" style={{ marginTop: 10 }}>
          <a className="btn primary" href="/report-sample.pdf" target="_blank" rel="noopener"
             download="K-건설맵_입찰성적표_견본.pdf">📄 견본 보기 (PDF)</a>
        </div>
        <p className="muted" style={{ marginBottom: 0, marginTop: 8 }}>
          견본은 실제 개찰 기록으로 만든 것입니다. 업체 이름만 가렸습니다.
        </p>
      </div>

      {/* ── 값과 차례 ── */}
      <div className="card">
        <div className="sec-title">값은 어떻게 되나</div>
        <p><b>받지 않습니다.</b></p>
        <p>
          다만 한 번에 여러 곳을 만들지는 못합니다. 숫자는 기계가 뽑지만 <b>읽고 정리하는 것은 사람 손</b>입니다.
          그래서 <b>건설맵에 한 줄이라도 보태 주신 분부터</b> 만들어 드립니다.
        </p>
        <ul className="flist">
          <li><Link to="/qna"><b>묻고 답하기</b></Link>에 답을 달아 주신 것</li>
          <li>서식 · 엑셀에서 <b>틀린 데를 알려 주신 것</b></li>
          <li>바로투찰을 써 보고 <b>어땠는지 한 줄</b> 남겨 주신 것</li>
        </ul>
        <p className="muted" style={{ marginBottom: 0 }}>
          누가 얼마나 보탰는지는 <b>자동으로 붙는 별명</b>으로 셉니다. 따로 적으실 것이 없습니다.
        </p>
      </div>

      {/* ── 신청 ── */}
      <div className="card">
        <div className="sec-title">신청하는 법</div>
        <p>
          <Link to="/qna"><b>묻고 답하기</b></Link>에 <b>「성적표 신청」</b>과 <b>업체명</b>을 한 줄 남겨 주십시오.
          회원가입도 로그인도 필요 없습니다.
        </p>
        <p className="muted">
          만들어지면 그 글에 답을 달아 드립니다. <b>언제까지라고는 못 적겠습니다</b> —
          지킬 수 없는 약속은 안 하는 편이 낫습니다.
        </p>
        <div className="btn-row">
          <Link className="btn primary" to="/qna">💬 성적표 신청하기</Link>
          <Link className="btn ghost" to="/analysis?m=corp">🔍 먼저 자가진단 해보기</Link>
        </div>
      </div>

      {/* ── 알아 두실 것 ── */}
      <div className="card">
        <div className="sec-title">알아 두실 것</div>
        <ul className="flist">
          <li>자료는 <b>조달청 나라장터가 공개한 개찰 결과</b>입니다. 공개되지 않은 것은 담기지 않습니다.</li>
          <li>성적표는 <b>지나간 기록을 정리한 것</b>입니다. 다음 입찰을 맞히는 것이 아닙니다.</li>
          <li>업체는 <b>사업자번호로 가립니다.</b> 같은 이름 다른 법인이 섞이지 않습니다.</li>
          <li>성적표에 사업자번호는 <b>적지 않습니다.</b></li>
        </ul>
      </div>
    </>
  )
}

/* ── 다른 화면에 붙이는 짧은 띠 ──────────────────────────
   /corp/{업체} 와 /analysis 자가진단에서 씁니다. 여기 한 곳만 고칩니다. */
export function ReportStrip({ name }) {
  return (
    <Link className="card fbook" to="/report">
      <span className="fic">📊</span>
      <div className="grow">
        <div className="t">
          {name ? <>{name} — <em>떨어진 건은 안 보입니다</em></> : <>업체 입찰 성적표 <em>· 만들어 드립니다</em></>}
        </div>
        <div className="d">
          위 자료는 <b>딴 것만</b> 보입니다. 3년치에서 <b>넣은 것 전부</b>를 찾아
          — 왜 떨어졌는지, 다음엔 어느 자리를 겨눠야 하는지,
          <b> 그때 바로투찰 금액이었다면 몇 위였을지</b>까지 A4 한 벌로 만들어 드립니다. <b>값은 받지 않습니다.</b>
        </div>
      </div>
      <span className="go">›</span>
    </Link>
  )
}
