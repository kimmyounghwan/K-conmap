import { Link } from 'react-router-dom'
import { askAfter } from '../AskComment'

/**
 * /shareone — 「쉐어원」 사무실 공유폴더 (2026-09-16)
 *
 * 소장님: 「도구에 공유폴더 만든 거 다운받을 수 있게 만들어 줘」
 *         「홍보목적으로 카페에 올릴려고 하는 거야」
 *
 * 왜 사이트에 두나
 *   ① 카페 글에서 이 화면으로 데려옵니다. 프로그램만 돌면 K-건설맵을 모르고 끝납니다.
 *   ② 「사무실 공유폴더」·「무료 파일공유 프로그램」은 검색 경쟁이 약한 말입니다.
 *   ③ 프로그램 자체는 변하지 않습니다 — 한 번 구워 두면 계속 일합니다.
 *
 * ⚠️ 파일(25.2MB)은 **GitHub Releases** 에 둡니다. Firebase Hosting 이 아닙니다.
 *    전송량 한도가 10GB/월인데 25.2MB 짜리를 400번 받으면 그것만으로 다 씁니다
 *    (지금 사이트 전체가 하루 8.3MB 입니다). GitHub 은 전송이 공짜이고
 *    받은 횟수도 세어 줍니다 — 카페 홍보가 먹혔는지 볼 수 있는 유일한 숫자입니다.
 *
 * ⚠️ 아직 **실제로 확인하지 못한 것**이 둘 있습니다. 화면에 그대로 적었습니다.
 *    · 사무실 PC 두 대로 서로 찾아가는 것 (한 대에서만 돌려 봤습니다)
 *    · 진짜 복합기로 스캔이 폴더에 떨어지는 것 (가짜 복합기로만 시험했습니다)
 *    되는 것처럼 적으면 카페에서 바로 들통납니다. 확인되면 이 주석과 아래 칸을 고칩니다.
 */

/* 받기 단추가 눌린 횟수 — GitHub 쪽 숫자와 대조할 우리 쪽 숫자입니다. */
const ZIP = 'https://github.com/kimmyounghwan/K-conmap/releases/download/shareone-2.0/ShareOne-2.0.zip'

function dl(what) {
  try {
    if (window.gtag) window.gtag('event', 'shareone_download', { what })
    askAfter('shareone')
  } catch (e) { /* 광고차단기 — 세는 것 때문에 받기가 막히면 안 됩니다 */ }
}

export default function ShareOne() {
  return (
    <>
      <div className="card lead-card">
        <h1 style={{ margin: 0, fontSize: 20 }}>🗂️ 쉐어원 — 사무실 공유폴더</h1>
        <p className="why2" style={{ marginBottom: 6 }}>
          사무실 컴퓨터마다 깔아 두면 <b>폴더 하나가 모든 컴에서 똑같이 보입니다.</b>
        </p>
        <p className="muted" style={{ margin: 0 }}>
          서버도, 회원가입도, 월 이용료도 없습니다. <b>완전 무료</b>입니다.
        </p>
      </div>

      {/* ── 받기 ── */}
      <div className="card">
        <div className="sec-title" style={{ margin: '0 0 8px' }}>내려받기</div>
        <a className="btn primary" href={ZIP} onClick={() => dl('zip')}>
          ⬇ 쉐어원 2.0 받기 (무료 · 25.2MB)
        </a>
        <div className="navrow" style={{ marginTop: 10 }}>
          <a className="navi" href="/shareone/사용설명서.html" target="_blank" rel="noopener"
             onClick={() => dl('manual')}>📖 사용설명서 보기</a>
        </div>
        <div className="muted" style={{ fontSize: 12.5, marginTop: 10, lineHeight: 1.7 }}>
          윈도우 10 · 11 용입니다. 압축을 풀면 <b>ShareOne2.exe</b> 하나와 설명서가 나옵니다.
          설치 프로그램이 아니라 <b>그냥 실행 파일</b>이라, 마음에 안 드시면 지우면 끝입니다.
        </div>
      </div>

      {/* ── 세 단계 ── */}
      <div className="card" style={{ borderLeft: '5px solid var(--accent, #1a56db)' }}>
        <div className="sec-title" style={{ margin: '0 0 8px' }}>하실 일은 이 셋뿐입니다</div>
        <ul className="flist">
          <li><b>① 깝니다</b> — 사무실 컴퓨터 <b>각각</b>에 ShareOne2.exe 를 넣고 한 번 실행합니다.
            바탕화면에 <b>「ShareOne 공유」</b> 폴더가 생깁니다</li>
          <li><b>② 넣습니다</b> — 그 폴더에 파일을 끌어다 놓습니다. 평소 쓰던 폴더와 똑같습니다</li>
          <li><b>③ 더블클릭합니다</b> — 옆자리 컴에서 같은 폴더를 열면 그 파일이 있습니다.
            더블클릭하면 <b>엑셀·한글이 바로 열립니다</b></li>
        </ul>
        <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>
          인터넷 창이 뜨지 않습니다. 검은 창(cmd)도 안 뜹니다. <b>탐색기 폴더 하나</b>가 전부입니다.
        </div>
      </div>

      {/* ── 되는 것 ── */}
      <div className="card">
        <div className="sec-title">무엇이 되나</div>
        <ul className="flist">
          <li><b>고쳐도 안 잃어버립니다</b> — 덮어쓰기 전 판을 <b>「.이전판」</b> 폴더에 남깁니다.
            두 사람이 같은 파일을 동시에 고쳐도 먼저 것이 안 없어집니다</li>
          <li><b>폰에서 보기</b> — 같은 와이파이면 폰 브라우저로 사무실 폴더를 봅니다</li>
          <li><b>현장 사진 받는 자리</b> — 구글드라이브 같은 폴더를 하나 지정해 두면,
            현장에서 폰으로 올린 사진이 사무실 폴더로 따라 들어옵니다</li>
          <li><b>스캔 자리</b> — 복합기가 스캔을 떨어뜨릴 자리를 열어 둡니다</li>
        </ul>
      </div>

      {/* ── 못 하는 것 · 아직 확인 못 한 것 ── */}
      <div className="card fwarn">
        <b>⚠️ 미리 말씀드립니다</b>
        <ul className="flist" style={{ marginTop: 6 }}>
          <li><b>같은 사무실 안에서만 됩니다.</b> 인터넷 너머 다른 지점과는 안 됩니다 —
            사무실 랜(공유기) 안에서 서로 찾습니다</li>
          <li><b>아직 실제로 확인하지 못한 것이 둘 있습니다.</b> 되는 것처럼 적지 않겠습니다.
            <br /><span className="muted">
              · 사무실 PC <b>두 대</b>로 서로 찾아가는 것 — 한 대에서만 돌려 봤습니다<br />
              · <b>진짜 복합기</b>로 스캔이 폴더에 떨어지는 것 — 흉내 낸 복합기로만 시험했습니다
            </span>
            <br />써 보시고 안 되면 <Link to="/qna">사랑방</Link>에 적어 주십시오. 고치겠습니다</li>
          <li>백신이 처음 한 번 물어볼 수 있습니다. 파이썬으로 만들어 하나로 묶은 파일이라
            <b> 처음 보는 프로그램</b>으로 읽힙니다. 서명(코드사인)은 아직 안 붙였습니다</li>
          <li>중요한 서류는 <b>따로 백업</b>해 두십시오. 공짜 프로그램입니다 —
            제가 소장님 자료를 책임질 수는 없습니다</li>
        </ul>
      </div>

      {/* ── 왜 공짜인가 ── */}
      <div className="card">
        <div className="sec-title">왜 공짜입니까</div>
        <p style={{ marginTop: 0, lineHeight: 1.85 }}>
          <b>K-건설맵을 알리려고 만들었습니다.</b> 쉐어원을 쓰시다가 폴더 안의
          <b> K-건설맵 바로가기</b>를 한 번 눌러 보시면 그것으로 충분합니다.
          입찰 자료도, 서식도, 도구도 전부 무료입니다.
        </p>
        <div className="btn-row" style={{ justifyContent: 'flex-start' }}>
          <Link className="btn ghost" to="/">💰 바로투찰 — 얼마 넣을까</Link>
          <Link className="btn ghost" to="/forms">📄 건설 서식</Link>
          <Link className="btn ghost" to="/tools">🧰 건설 도구</Link>
        </div>
      </div>
    </>
  )
}

/* ── 다른 화면에 붙이는 짧은 띠 ──────────────────────────
   /tools 에서 씁니다. 여기 한 곳만 고칩니다. */
export function ShareOneStrip() {
  return (
    <Link className="card fbook" to="/shareone">
      <span className="fic">🗂️</span>
      <div className="grow">
        <div className="t">쉐어원 — 사무실 공유폴더 <em>· 무료</em></div>
        <div className="d">
          사무실 컴퓨터마다 깔면 <b>폴더 하나가 모든 컴에서 똑같이</b> 보입니다.
          서버도 월 이용료도 없습니다.
        </div>
      </div>
      <span className="go">→</span>
    </Link>
  )
}
