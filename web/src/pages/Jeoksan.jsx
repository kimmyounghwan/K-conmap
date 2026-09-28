/**
 * /jeoksan — 「K-적산」 소개 (2026-09-16)
 *
 * 소장님: 「우선 올리되, 나만 쓸 수 있게. 소개 글도 쓰고, 유료라는 것도, 사용방법도.」
 *         문의 창구는 「열지 않음 — 준비 중」 으로 정하셨습니다.
 *
 * ⚠️ 이 화면에는 «내려받기 단추가 없습니다». 프로그램 파일도 저장소에 안 올렸습니다.
 *    리습·파이썬·재료표는 전부 소장님 PC 안에만 있습니다.
 *    → 「나만 쓸 수 있게」 는 이걸로 됩니다. 단추를 감추는 것이 아니라 «파일이 없는» 것입니다.
 *    나중에 여실 때 이 주석부터 지우십시오.
 *
 * ⚠️ 값은 숫자로 적지 않습니다. /naeyeok 과 같은 방침입니다 —
 *    «값을 감추면 문의가 줄지만, 근거 없이 적으면 나중에 못 지킵니다.»
 *    몇 현장에서 실제로 돌려 보고 품을 안 뒤에 적습니다.
 *
 * ⚠️ 남의 프로그램을 이름 들어 깎지 않습니다. 「흔한 방식」 으로만 적습니다.
 */
import { Link } from 'react-router-dom'
import { PriceStance } from '../components.jsx'

export default function Jeoksan() {
  return (
    <>
      <div className="card lead-card">
        <h1 style={{ margin: 0, fontSize: 20 }}>🧮 K-적산</h1>
        {/* ⏸ 2026-09-25 — 소장님: 「그럼 작성대행도 안돼고, 적산도 안되는 거잖아. 근데, 사이트에는 된다고 해놓서」
            «산출내역서와 원가계산서까지 만듭니다» 는 아직 사실이 아닙니다. 되는 것과 안 되는 것을 그대로 적습니다. */}
        {/* 🔓 2026-09-26 — 소장님: 「적산 물량 산출도...우선은 무료로...개방」 · 「사이트 내에서 사용하도록」 */}
        {/* 📥 2026-09-28 — 소장님 「물량, 내역채우는 거 다 자동이 목표야」 · 마감도 G44 부터 «도면 넣으면 자동» → 문구를 맞춤 */}
        {/* 🔄 2026-09-27 — 소장님: 「지금 도구들은 알아서 물량을 채워주는 거잖아. 근데 여기는 이용자가 치수를 알려 줘야 … 되어 있는 거 아니야?」
            설명이 9/16~17(캐드 리습 · 치수를 표에 적기) 그대로였습니다. 지금 도구에 맞게 고쳐 씁니다. */}
        <p className="why2" style={{ marginBottom: 6 }}>
          <b>도면을 넣으면 물량이 나옵니다 — 골조(보·기둥·슬래브·벽·기초)·마감(방마다 바닥·벽·천장)까지 저절로, 엑셀로.</b> 치수를 손으로 적지 않습니다.
          내역서를 같이 넣으면 <b>빈 수량 칸까지 도면 물량으로 채워</b> 그 파일 그대로 돌려 드립니다.
          고칠 곳만 표 칸을 누르고 도면을 누르면 값이 바뀝니다. 수량산출서까지 <b>무료</b>, 가입도 설치도 없습니다.
        </p>
        <p className="muted" style={{ margin: 0 }}>
          단가를 채워 금액·원가계산서까지 가는 길은 아직 시험 중입니다 — 아래 표에 그대로 적었습니다.
        </p>
        <div className="btn-row" style={{ marginTop: 10, flexWrap: 'wrap' }}>
          {/* ⚡🧱 2026-09-27 — 소장님: 「골조 말고 다른 것도 있지 않았어??? 도면을 주면 수량산출서가 나오게 안돼? 건축이든, 토목이든」
              🎨 같은 날 저녁 — 소장님: 「파란색으로 채우는 거 없애주고」 → 넷 다 테두리 단추 */}
          {/* 🏗⚡ 2026-09-27 밤 — 소장님: 「적산에서 왜 골조 물량을 찍어야 된다고 했지?. 도면만 주면 스스로 물량을 내는 거잖아」
              「이거에 맞춰. 내역서 및 적산도 다시 수정해 주고」 → 골조도 «도면 넣으면 자동» (lib/골조자동.js) */}
          <Link className="btn line" style={{ width: 'auto' }} to="/jeoksan/auto">⚡ 도면 물량 자동 — 도면만 넣으면 물량 전부 · 엑셀 · 내역서 수량 칸까지 (무료)</Link>
          <Link className="btn line" style={{ width: 'auto' }} to="/jeoksan/golgo">🏗 골조 수량산출 — 도면 넣으면 자동 · 고칠 때만 찍기 (무료)</Link>
          <Link className="btn line" style={{ width: 'auto' }} to="/jeoksan/magam">🧱 마감 수량산출 — 도면 넣으면 방마다 바닥·벽·천장 자동 (무료)</Link>
          <Link className="btn line" style={{ width: 'auto' }} to="/jeoksan/run">🧮 수량산출서 만들기 — 재료표 + 도면 눌러 채우기 (무료)</Link>
        </div>
      </div>

      {/* ── 도구마다 무엇을 하나 ── (2026-09-27 — 옛 «네 걸음»(엑셀 재료표 → 캐드 리습으로 찍기 → 파일 끌어다 놓기)을 바꿈) */}
      <div className="card">
        <div className="sec-title">도구마다 무엇을 하나</div>
        <table className="tbl left reptbl">
          <tbody>
            <tr>
              <td className="w"><b>⚡ 도면 물량 자동</b><span className="d">누를 것 없음</span></td>
              <td>도면(DXF·DWG)을 넣으면 <b>바로 셉니다.</b> 도면에 적힌 표(철근 재료표 → 직경별 무게 · 수량표),
                횡단면 토공(측점마다 깎기·쌓기 → 평균단면법), 레이어별 선 길이·면적 · 블록·기호 개수,
                <b>골조</b>(구조평면도 + 부재 일람표 → 보·기둥·슬래브·벽·기초의 콘크리트·거푸집·철근)까지 한꺼번에 — <b>엑셀 한 파일</b>로 받습니다.
                <br /><span className="muted">빼고 싶은 줄만 체크를 풉니다. <b>내역서(엑셀)</b>를 같이 넣으면 줄마다 짝을 지어 <b>물량 차이</b>를 보여 주고,
                  짝이 확실한 줄은 <b>빈 수량 칸에 도면 물량을 넣어</b> 그 파일 그대로 돌려 드립니다(바꾼 칸은 노란 바탕 · 근거 시트). 이어서 단가 채우기까지 한 번에.</span></td>
            </tr>
            <tr>
              <td className="w"><b>🏗 골조</b><span className="d">도면 넣으면 자동</span></td>
              <td><b>구조평면도 + 부재 일람표</b>를 넣으면 골조 산출 양식 그대로(개요 · 배근표 · 주자료)를 <b>저절로 채워</b>
                콘크리트·거푸집·철근을 층별·부재별로 셉니다 — 보는 기호 옆 두 선을 기둥·걸친 보에서 끊어 한 칸씩, 슬래브는 보 가운데까지, 기둥·기초는 기호 개수.
                고칠 곳만 표의 칸을 누르고 <b>도면의 선·치수·글자</b>를 누르면 값이 바뀝니다.
                <br /><span className="muted">층고는 도면의 «FL+3,600» 글자로(없으면 짐작 — 고쳐 쓰기) · 동·층 복사 · 산출서 · 집계(층·동·공구) · 검산 · 당초 대비 · 엑셀 · 인쇄 · 철골 부재는 빼고 알림</span></td>
            </tr>
            <tr>
              <td className="w"><b>🧱 마감</b><span className="d">도면 넣으면 자동</span></td>
              <td>평면도를 넣으면 <b>방(실 이름을 품은 닫힌 선)을 스스로 찾아 면적과 둘레</b>를 넣고, 도면의 <b>실내재료마감표·창호일람표</b>로 바닥·걸레받이·벽·천장을 방마다 채웁니다.
                <br /><span className="muted">고칠 곳만 방 안·창호 글자를 누릅니다 · 산출서 · 집계 · 동별 · 창호 집계 · 면적 검산 · 엑셀</span></td>
            </tr>
            <tr>
              <td className="w"><b>🧮 수량산출서 만들기</b><span className="d">토목·건축 어디든</span></td>
              <td>재료표(토목·건축 견본을 그대로 써도 됨) + 치수표. 치수표 칸을 누르고 <b>도면을 누르면</b> 값이 들어갑니다(직접 적어도 됩니다).
                <br /><span className="muted">엑셀 다섯 장 — 산출서 · 집계 · 태그별 · 검산 · 쓴표</span></td>
            </tr>
          </tbody>
        </table>
        <p className="muted" style={{ marginBottom: 0 }}>
          도면은 <b>이 브라우저 안에서만</b> 읽습니다 — 서버로 가지 않습니다. 캐드가 없어도 되고, DWG 도 바로 엽니다.
          자동은 도면을 «해석» 하지 않고 <b>도면에 적힌 표·글자·선을 자리대로 옮깁니다</b> — 어디서 읽었는지 도면 위에 네모로 보여 드리니, 검산은 꼭 한 번 보십시오.
        </p>
      </div>

      {/* ── 적산의 차례 ──
          2026-09-17 — 소장님: 「적산은 원가계산서 부터. 내역서 등등이 들어가는 거야.
          지금 설명해 놓은 거 보면 이런게 하나도 없어」
          맞습니다. 수량산출 얘기만 적어 두었습니다. 차례를 통째로 적습니다.
          ⚠️ 되는 것과 안 되는 것을 섞어 적지 않습니다. 표에 그대로 나눠 둡니다. */}
      <div className="card">
        <div className="sec-title">적산은 어디까지인가 — 수량만이 아닙니다</div>
        <p style={{ marginTop: 0 }}>
          「적산」은 <b>물량을 세는 것에서 끝나지 않습니다.</b> 물량에 단가를 붙여
          내역서를 만들고, 거기에 법으로 정해진 비용을 얹어 <b>원가계산서</b>까지
          가야 «공사비»가 됩니다. K-적산이 어디까지 와 있는지 그대로 적습니다.
        </p>
        <table className="tbl left reptbl">
          <tbody>
            <tr>
              <td><b>① 물량</b><br /><span className="muted">수량산출서</span></td>
              <td>무엇이 얼마나 들어가나. <b>도면 물량 자동</b>·<b>골조</b>·<b>마감</b>은 도면만 넣으면 저절로(골조는 구조평면도 + 일람표, 마감은 평면도 + 마감표),
                수량산출서는 도면을 눌러 채웁니다. 산출근거가 살아 있는 수식으로 남습니다</td>
              <td style={{ whiteSpace: 'nowrap' }}><b>됩니다</b><br /><span className="muted">무료</span></td>
            </tr>
            <tr>
              <td><b>② 단가</b><br /><span className="muted">공내역서 채우기</span></td>
              <td>빈 공내역서에 품명·규격으로 단가를 찾아 넣습니다. <b>«확실히 붙음»</b> 줄은 그대로 두고,
                애매한 줄은 후보(1~5)에서 고르고, 못 찾은 줄은 직접 채웁니다.
                <br /><span className="muted">실제 설계 내역서 4,171줄로 잰 것 — 칸이 채워지는 줄 <b>약 85%</b> · 품목이 맞는 줄 <b>66.7%</b> ·
                단가가 설계값 ±10% 안 <b>39.5%</b> · «확실히 붙음» 으로 표시된 줄(전체의 절반)은 <b>98.8%</b> 맞음</span></td>
              <td style={{ whiteSpace: 'nowrap' }}><b>시험판</b><br /><Link to="/jeoksan/fill">열기 ›</Link></td>
            </tr>
            <tr>
              <td><b>③ 내역서</b><br /><span className="muted">산출내역서</span></td>
              <td>품목 × 단가 = 금액. <b>수량</b>은 도면 물량 자동이 내역서의 빈 수량 칸에 넣어 드리고(짝이 확실한 줄만),
                이어서 <b>단가</b>를 ② 시험판으로 채우면 금액은 엑셀의 식이 셉니다.
                <br /><span className="muted">단가가 ② 의 정확도를 따라가므로, 제출용으로는 한 줄씩 확인이 필요합니다</span></td>
              <td style={{ whiteSpace: 'nowrap' }}><b>시험판</b><br /><span className="muted">수량은 됨 · 단가는 ②</span></td>
            </tr>
            <tr>
              <td><b>④ 원가계산서</b></td>
              <td>
                직접재료비·직접노무비·직접경비 위에 <b>간접노무비 · 산재 · 고용 · 건강 ·
                연금 · 노인장기요양 · 퇴직공제 · 안전관리비 · 보증 · 환경 · 석면 ·
                임금채권 · 기타경비 · 일반관리비 · 이윤 · 부가세</b> 를 차례로 얹어
                총액을 냅니다
              </td>
              <td style={{ whiteSpace: 'nowrap' }}><b>안 됩니다</b><br /><span className="muted">② 가 먼저</span></td>
            </tr>
            <tr>
              <td><b>⑤ 일위대가</b></td>
              <td>한 품목을 재료비·노무비·경비로 쪼개는 자리. 이것이 있어야
                원가계산서의 «직접재료비 / 직접노무비» 가 저절로 갈립니다</td>
              <td style={{ whiteSpace: 'nowrap' }}>아직</td>
            </tr>
          </tbody>
        </table>
        <p className="muted" style={{ marginBottom: 0 }}>
          ④ 의 «요율을 차례로 얹는 셈» 자체는 실제 조달청 내역서로 맞춰 보고 손셈과 한 원도 안 틀리는 것까지
          확인했습니다. 하지만 그 앞의 <b>② 단가가 아직 설계값과 10줄 중 4줄만 맞아</b>,
          내역서 전체로는 믿고 내실 수 없습니다. 그래서 ②·③ 은 «시험판», ④ 는 «안 됩니다» 로 적습니다.
          단가 자료가 더 쌓이고 맞는 줄이 늘면 이 표부터 고치겠습니다.
        </p>
      </div>

      {/* ── 무엇이 다른가 ── */}
      <div className="card">
        <div className="sec-title">흔한 방식과 무엇이 다른가</div>
        <table className="tbl left reptbl">
          <tbody>
            <tr>
              <td className="w"><b>산출식</b><span className="d">어디 있나</span></td>
              <td>수십 가지가 프로그램 안에 박혀 있으면 <b>쓰는 사람이 못 고칩니다.</b>{' '}
                현장마다 이음 길이도, 할증도, 부재 이름도 다릅니다.{' '}
                <b>여기서는 엑셀 표 한 줄을 고칩니다.</b></td>
            </tr>
            <tr>
              <td className="w"><b>공종</b><span className="d">토목·건축</span></td>
              <td>표만 갈아 끼우면 <b>토목이든 건축이든</b> 같은 프로그램으로 돕니다.
                토공 · 포장 · 관로 · 구조물, 기둥 · 보 · 옹벽 · 슬래브 · 개구부.</td>
            </tr>
            <tr>
              <td className="w"><b>산출근거</b><span className="d">감리용</span></td>
              <td>엑셀에서 <b>살아 있는 수식</b>입니다. 감리가 칸을 눌러 그 자리에서 봅니다.
                <br /><span className="muted">예) <code>0.6*0.6*(3-0.2)</code> — 기둥 단면 × (층고 − 슬래브두께)</span></td>
            </tr>
            <tr>
              <td className="w"><b>검산</b><span className="d">언제 하나</span></td>
              <td>다 하고 나서 눈으로 보는 것이 아니라 <b>처음부터 같이 나옵니다.</b>{' '}
                산출서와 같은 파일 안에 한 장으로.</td>
            </tr>
            <tr>
              <td className="w"><b>캐드</b><span className="d">없어도 됨</span></td>
              <td>도면을 <b>사이트에서 바로</b> 엽니다(DXF·DWG). 캐드를 깔지 않아도 됩니다.</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── 검산 ── */}
      <div className="card">
        <div className="sec-title">검산이 잡아 주는 것</div>
        <p className="muted" style={{ marginTop: 0 }}>
          물량을 틀리는 자리는 늘 같습니다. 그 자리를 미리 지켜 둔 것입니다.
        </p>
        <ul className="flist">
          <li><b>적힌 산출근거로 다시 세어 값이 같은지</b> — 감리가 보는 것은 «글»입니다.
            글과 값이 어긋나면 아무도 못 알아챕니다</li>
          <li><b>밀리미터를 그대로 넣은 것</b> — 층고를 3000 으로 넣으면 체적이 1000배가 됩니다</li>
          <li><b>단위가 섞인 것</b> — 같은 칸이 어떤 줄은 0.6, 어떤 줄은 600</li>
          <li><b>유난히 크거나 작은 줄</b> — 같은 자리 가운데값의 30배·30분의 1</li>
          <li><b>공제가 본체보다 큰 것</b> — 빼는 것이 더하는 것보다 많을 수 없습니다</li>
          <li><b>번호가 겹치는 것 · 개소가 0 인 것 · 셈하지 못한 줄</b></li>
          <li><b>일람표에 없는 부호 · 재료표에 없는 부재</b></li>
          <li><b>태그가 빠진 것</b> — 공구·측점을 안 적으면 기성 청구 때 다시 헤맵니다</li>
        </ul>
      </div>

      {/* ── 나오는 것 ── */}
      <div className="card">
        <div className="sec-title">수량산출서 만들기의 엑셀 — 다섯 장</div>
        <table className="tbl left reptbl">
          <tbody>
            <tr><td className="w"><b>산출서</b><span className="d">한 줄씩</span></td>
              <td>한 줄 한 줄. 부재 · 부호 · 재료 · 단위 · <b>산출근거</b> · 수량</td></tr>
            <tr><td className="w"><b>집계</b><span className="d">재료별</span></td>
              <td>재료·규격·단위별 합계. <b>더한 것</b>과 <b>뺀 것(공제)</b>을 갈라서 보여 줍니다</td></tr>
            <tr><td className="w"><b>태그별</b><span className="d">기성 청구</span></td>
              <td>공구별·측점별, 동별·층별 합계. <b>기성 청구서를 만들 때</b> 이 장을 씁니다</td></tr>
            <tr><td className="w"><b>검산</b><span className="d">틀린 자리</span></td>
              <td>위에 적은 것들</td></tr>
            <tr><td className="w"><b>쓴표</b><span className="d">근거 보존</span></td>
              <td>이번에 쓴 설정·재료표·일람표를 <b>그대로 박아 둡니다.</b>{' '}
                석 달 뒤 「무슨 계수로 뽑았지?」 할 때 이 장 하나면 끝납니다</td></tr>
          </tbody>
        </table>
      </div>

      {/* ── 값 ── */}
      <div className="card">
        <div className="sec-title">값은 어떻게 되나</div>
        <p><b>물량 도구 넷(도면 물량 자동 · 골조 · 마감 · 수량산출서)은 모두 무료입니다.</b></p>
        <p className="muted" style={{ marginBottom: 0 }}>
          현장마다 재료표를 맞춰 드리거나 도면을 같이 보는 일처럼 <b>사람 손이 들어가는 일</b>은 따로입니다.
          그런 일은 아직 받지 않고, 받게 되면 값을 이 화면에 먼저 적겠습니다.{' '}
          <Link to="/naeyeok">내역서 작성 대행</Link>도 지금은 받지 않습니다.
        </p>
      </div>

      <PriceStance />

      {/* ── 준비 중 ── (2026-09-27 — «도면에서 찍기» 는 사이트 안에서 됩니다. 남은 것은 단가 · 캐드 안 리습) */}
      <div className="card">
        <div className="sec-title">시험판 · 아직 열지 않은 것</div>
        <ul className="flist">
          <li><b>단가 채우기 — 시험판으로 열었습니다</b>(2026-09-27). 품목은 3줄 중 2줄이 맞지만 단가가 설계값 ±10% 안에 드는 줄이 39.5% 라,
            <b>채운 값을 한 줄씩 확인</b>하셔야 합니다. 고르신 짝이 쌓이면 맞는 줄이 늘어납니다. <Link to="/jeoksan/fill">📑 단가 채우기 열기 ›</Link></li>
          <li><b>캐드 안에서 찍는 리습</b> — 캐드 판이 여러 가지라 확인이 끝나기 전에는 열지 않습니다.
            그동안은 <b>사이트에서 도면을 넣으십시오</b> — 골조·마감·도면 물량 자동은 저절로 채우고, 고칠 곳만 누릅니다(수량산출서는 눌러 채움).</li>
        </ul>
      </div>

      {/* ── 알아 두실 것 ── */}
      <div className="card">
        <div className="sec-title">알아 두실 것</div>
        <ul className="flist">
          <li><b>표준품셈 · 물가정보 · 노임단가는 싣지 않습니다.</b> 유료 자료입니다.
            그 자리는 <b>조달청이 공개한 공고 첨부 내역서</b>로 대신합니다 —
            실제 설계에 쓰인 규격·수량·단가입니다.
            재료표의 환산·할증 칸은 <b>쓰시는 기준으로 고쳐 쓰는 자리</b>입니다</li>
          <li>철근 단위중량(<b>KS D 3504</b>)만 들어 있습니다. 표준 규격이라 그렇습니다</li>
          <li>물량 도구는 <b>단가를 내지 않습니다.</b> 수량과 산출근거까지입니다</li>
          <li><b>자동은 도면에 적힌 것만 셉니다.</b> 표·글자·레이어가 없는 도면, 선의 뜻이 레이어로 갈리지 않은 도면은
            덜 나옵니다. 골조는 <b>부재 일람표</b>(크기·철근)와 평면의 <b>부재 기호</b>(G1·C1·S1…)가 있어야 셉니다 —
            없으면 골조·마감·수량산출서에서 도면을 눌러 채우십시오. 개구부·계단·헌치처럼 평면에 기호로 없는 것도 골조 화면에서 더합니다</li>
        </ul>
      </div>

      {/* ── 그동안 쓸 것 ── */}
      <div className="card">
        <div className="sec-title">같이 쓰면 좋은 것</div>
        <p className="muted" style={{ marginTop: 0 }}>
          물량과 함께 자주 쓰시는 것들입니다. <b>전부 무료입니다.</b>
        </p>
        <div className="btn-grid">
          <Link className="btn ghost" to="/naeyeok/ratio">📉 내역서 비율 맞추기</Link>
          <Link className="btn ghost" to="/cad">📐 캐드 유틸 — 길이·면적·개수 재기</Link>
          <Link className="btn ghost" to="/change/twoline">🔁 설계변경 2줄 변환</Link>
          <Link className="btn ghost" to="/change/excel">📊 설계변경 통합 엑셀</Link>
          <Link className="btn ghost" to="/tools">🧰 건설 도구 — A값·투찰률·철근중량</Link>
        </div>
      </div>
    </>
  )
}

/* ── 다른 화면에 붙이는 짧은 띠 ──────────────────────────
   /cad 와 /naeyeok 에서 씁니다. 여기 한 곳만 고칩니다. */
export function JeoksanStrip() {
  return (
    <Link className="card fbook" to="/jeoksan">
      <span className="fic">🧮</span>
      <div className="grow">
        <div className="t">K-적산 <em>· 도면에서 물량을 뽑습니다</em></div>
        <div className="d">
          <b>도면을 넣으면 물량</b>이 나옵니다 — 골조·마감까지 저절로, 엑셀로. 내역서를 넣으면 수량 칸까지 채웁니다. 고칠 곳만 도면을 눌러 바꿉니다. 무료 · 깔 것도 가입도 없습니다.
          산출근거가 <b>살아 있는 엑셀 수식</b>이라 감리가 칸을 눌러 봅니다.
        </div>
      </div>
      <span className="go">›</span>
    </Link>
  )
}
