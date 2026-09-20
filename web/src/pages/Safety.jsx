/**
 * /safety — 「안전관리계획서 · 유해·위험방지계획서」 소개 (2026-09-16)
 *
 * 소장님: 「①②③ 다 하자. 안전관리계획서·유해위험방지계획서부터.」
 *         「소개페이지를 붙이는 거지? 현재 준비중으로」
 *
 * ✅ 2026-09-20 — **문의를 열었습니다.** 소장님: 「기술사는 아는 곳이 있으니까.
 *    자료만 주면 만들 수 있는 거잖아」 → 검토자 문제가 풀려서 「준비 중」을 내렸습니다.
 *    문의함은 /naeyeok 의 QuoteForm 을 그대로 씁니다 — 창구를 두 벌로 만들지 않습니다.
 *
 * ⚠️ 받을 자료 «전부» 를 이 화면에 깔지 않습니다 (2026-09-20 소장님).
 *    「모든 걸 의뢰 업체가 알아야 할 필요는 없잖아. 의뢰가 들어오면 필요한 자료를 메일로
 *     보내줄 수 있으면 되는 거고, 우린 사이트에 이런 형식으로 만든다는 걸 알려주면 되는 거고」
 *    → 화면에는 «갈래 일곱 가지»만. 자세한 목록은 의뢰가 들어온 뒤 메일로 보냅니다.
 *    → 전체 목록과 뼈대는 docs/안전서류_만드는_법.md 에 있습니다(안쪽 자료).
 *
 * ⚠️ 지하안전평가·재해영향평가·교통영향평가·정밀안전진단은 **등록업체만** 할 수 있습니다.
 *    이 화면에 「해 드립니다」 라고 적으면 무등록 영업이 됩니다.
 *    반드시 «대상인지 알려 드리고, 등록업체를 연결해 드립니다» 로만 적습니다.
 *
 * ⚠️ 대상 기준은 외워서 적지 않았습니다. 2026-09-16 에 아래에서 직접 읽어 왔습니다.
 *      · 안전관리계획서 : 국토안전관리원 CSI — 건설기술진흥법 시행령 제98조제1항
 *        https://www.csi.go.kr/por/about_smp_003.do
 *      · 유해·위험방지계획서 : 국가법령정보센터 — 산업안전보건법 시행령 제42조제3항
 *        [시행 2026. 8. 1.] [대통령령 제36540호, 2026. 7. 28., 일부개정]
 *    **법이 바뀝니다.** 고칠 때마다 위 두 곳을 다시 열어 보고 고치십시오.
 *    화면 맨 아래에 「언제 기준인지」 를 적어 두는 것은 그래서입니다.
 *
 * ⚠️ 값은 숫자로 적지 않습니다. /naeyeok · /jeoksan 과 같은 방침입니다.
 * ⚠️ 남의 제출본을 참고했지만 공사명·상호·사람 이름은 한 글자도 싣지 않습니다.
 */
import { Link } from 'react-router-dom'
import { QuoteForm } from './Naeyeok.jsx'

/* 기준을 읽어 온 날. 화면 아래에 그대로 적습니다 — 「언제 것인가」 가 제일 중요합니다. */
const 기준일 = '2026-09-16'

export default function Safety() {
  return (
    <>
      <div className="card lead-card">
        <h1 style={{ margin: 0, fontSize: 20 }}>🦺 안전관리계획서 · 유해·위험방지계획서</h1>
        <p className="why2" style={{ marginBottom: 6 }}>
          착공 전에 내야 하는 <b>법정 계획서</b>입니다. 안 내면 착공이 막힙니다.
        </p>
        <p className="muted" style={{ margin: 0 }}>
          먼저 <b>우리 현장이 대상인지</b>부터 보십시오. 아래 표에서 한 줄이라도 걸리면 대상입니다.
        </p>
      </div>

      {/* ── 대상 판정 ① 안전관리계획서 ── */}
      <div className="card">
        <div className="sec-title">① 안전관리계획서 — 대상입니까</div>
        <p className="muted" style={{ marginTop: 0 }}>
          건설기술진흥법 시행령 제98조제1항. <b>한 줄이라도 걸리면 대상</b>입니다.
        </p>
        <ul className="flist">
          <li><b>1종·2종 시설물</b>의 건설공사</li>
          <li><b>지하 10m 이상</b>을 굴착하는 건설공사</li>
          <li><b>폭발물 사용</b>으로 주변에 영향이 예상되는 건설공사
            <br /><span className="muted">주변 — 20m 내 시설물 또는 100m 내 가축 사육</span></li>
          <li><b>10층 이상 16층 미만</b>인 건축물의 건설공사</li>
          <li><b>10층 이상</b>인 건축물의 리모델링 또는 해체공사</li>
          <li><b>수직증축형 리모델링</b> (주택법 제2조제25호다목)</li>
          <li><b>건설기계</b>가 사용되는 건설공사
            <br /><span className="muted">천공기(높이 10m 이상) · <b>항타 및 항발기</b> · 타워크레인
              (리프트카는 해당 없음)</span></li>
          <li><b>가설구조물</b>을 사용하는 건설공사 — 아래 표</li>
          <li><b>발주자</b> 또는 <b>인·허가기관의 장</b>이 특히 필요하다고 인정하는 건설공사
            <br /><span className="muted">지자체 조례로 정하는 공사도 여기에 들어갑니다</span></li>
        </ul>

        <div className="sec-title" style={{ marginTop: 16 }}>어떤 가설구조물이 걸리나</div>
        <table className="tbl left reptbl">
          <tbody>
            <tr>
              <td className="w"><b>비계</b></td>
              <td>높이 <b>31m 이상</b> · 브라켓(bracket) 비계</td>
            </tr>
            <tr>
              <td className="w"><b>거푸집 · 동바리</b></td>
              <td>작업발판 일체형 거푸집(갱폼 등) · 높이 <b>5m 이상</b>인 거푸집 ·
                높이 <b>5m 이상</b>인 동바리</td>
            </tr>
            <tr>
              <td className="w"><b>지보공</b></td>
              <td>터널 지보공 · 높이 <b>2m 이상</b> 흙막이 지보공</td>
            </tr>
            <tr>
              <td className="w"><b>그 밖의 가설구조물</b></td>
              <td>높이 10m 이상에서 외부작업을 하기 위해 작업발판과 안전시설물을 일체화한 것
                (SWC · RCS · ACS · WORKFLAT FORM 등)
                <br />현장에서 제작해 조립·설치하는 복합형(가설벤트 · 작업대차 · 라이닝폼 · 합벽지지대 등)
                <br />동력으로 움직이는 것(FCM · ILM · MSS 등)
                <br />발주자 또는 인·허가기관의 장이 필요하다고 인정하는 가설구조물</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── 대상 판정 ② 유해·위험방지계획서 ── */}
      <div className="card">
        <div className="sec-title">② 유해·위험방지계획서 — 대상입니까</div>
        <p className="muted" style={{ marginTop: 0 }}>
          산업안전보건법 시행령 제42조제3항. 건설공사 쪽만 옮겨 적었습니다.
        </p>
        <ul className="flist">
          <li><b>지상높이 31m 이상</b>인 건축물 또는 인공구조물</li>
          <li><b>연면적 3만㎡ 이상</b>인 건축물</li>
          <li><b>연면적 5천㎡ 이상</b>인 시설 — 문화·집회시설(전시장·동물원·식물원 제외) ·
            판매시설 · 운수시설(고속철도 역사, 집배송시설 제외) · 종교시설 ·
            의료시설 중 <b>종합병원</b> · 숙박시설 중 <b>관광숙박시설</b> · 지하도상가 · 냉동·냉장 창고시설</li>
          <li><b>연면적 5천㎡ 이상</b>인 냉동·냉장 창고시설의 <b>설비공사 및 단열공사</b></li>
          <li>최대 지간길이 <b>50m 이상</b>인 <b>다리</b>의 건설등 공사</li>
          <li><b>터널</b>의 건설등 공사</li>
          <li>다목적댐 · 발전용댐 · <b>저수용량 2천만톤 이상</b>의 용수 전용 댐 ·
            지방상수도 전용 댐의 건설등 공사</li>
          <li><b>깊이 10m 이상</b>인 굴착공사</li>
        </ul>
        <p className="muted" style={{ marginBottom: 0 }}>
          「건설등」은 <b>건설 · 개조 · 해체</b>를 말합니다. 새로 짓는 것만이 아닙니다.
        </p>
      </div>

      {/* ── 둘은 어떻게 다른가 ── */}
      <div className="card">
        <div className="sec-title">둘은 어떻게 다릅니까</div>
        <p className="muted" style={{ marginTop: 0 }}>
          <b>둘 다 대상인 현장이 흔합니다.</b> 하나를 냈다고 다른 하나가 면제되지 않습니다.
        </p>
        <table className="tbl left reptbl">
          <tbody>
            <tr>
              <td className="w"><b>근거법</b></td>
              <td><b>안전관리계획서</b> — 건설기술진흥법
                <br /><b>유해·위험방지계획서</b> — 산업안전보건법</td>
            </tr>
            <tr>
              <td className="w"><b>내는 곳</b></td>
              <td><b>안전관리계획서</b> — 발주자에게. 인·허가기관의 장이 확인합니다
                <br /><b>유해·위험방지계획서</b> — <b>한국산업안전보건공단</b>에</td>
            </tr>
            <tr>
              <td className="w"><b>도장</b><span className="d">누가 찍나</span></td>
              <td><b>유해·위험방지계획서</b>는 <b>검토자의 서명</b>이 문서 안에 들어갑니다.
                제출본에는 <b>건설안전기술사</b>가 검토자로 적히고, 현장에서 현장대리인과
                실제로 만나 회의한 <b>회의록과 사진</b>까지 들어갑니다.
                <br /><span className="muted">서류만 잘 써서 되는 것이 아니라는 뜻입니다. 일정을 미리 잡아야 합니다.</span></td>
            </tr>
            <tr>
              <td className="w"><b>처리기간</b></td>
              <td><b>유해·위험방지계획서</b>는 접수 서식에 <b>15일</b>로 적혀 있습니다.
                <br /><span className="muted">착공일에서 <b>거꾸로 세어</b> 일정을 잡으셔야 합니다.</span></td>
            </tr>
            <tr>
              <td className="w"><b>두께</b><span className="d">실제 제출본</span></td>
              <td>안전관리계획서 <b>446쪽</b>, 유해·위험방지계획서 <b>285쪽</b>.
                한 현장 실측입니다. 도면·계산서·점검표가 통째로 들어가서 이렇게 됩니다.</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── 주실 자료 (갈래만) ──
          ⚠️ 자세한 목록은 여기 깔지 않습니다 — 「이걸 다 줘야 해?」 하고 닫습니다.
             의뢰가 들어온 뒤 메일로 보냅니다 (docs/안전서류_만드는_법.md 3절). */}
      <div className="card">
        <div className="sec-title">주실 자료 — 일곱 갈래</div>
        <p className="muted" style={{ marginTop: 0 }}>
          다 갖추고 연락하실 필요 없습니다. <b>있는 것만 알려 주시면</b> 무엇이 더 필요한지
          저희가 목록으로 만들어 보내 드립니다.
        </p>
        <ul className="flist">
          <li><b>계약</b> — 공사명 · 소재지 · 공사기간 · 공사금액 · 발주처</li>
          <li><b>도면</b> — 설계도면 · 위치도 · 주변현황도 · <b>지하매설물 현황도</b></li>
          <li><b>지반</b> — 지반조사보고서(시추주상도)</li>
          <li><b>내역서</b> — 안전관리비 · 산업안전보건관리비 계상액이 여기서 나옵니다</li>
          <li><b>사람</b> — 현장 조직도 · 선임 서류</li>
          <li><b>장비</b> — 투입 장비와 제원(항타기 규격 · 크레인 톤수 등)</li>
          <li><b>공법</b> — 굴착 깊이 · 적용 공법 · 대상이 된 사유</li>
        </ul>
        <p className="muted" style={{ marginBottom: 0 }}>
          ★ <b>지하매설물 현황도</b>는 저희가 대신 조회할 수 없습니다 — 현장에서 조회하셔야 합니다.
          <b>지반조사보고서</b>가 없으면 안전성 검토를 못 합니다. 이 둘이 제일 자주 빠집니다.
        </p>
      </div>

      {/* ── 하는 일 · 안 하는 일 ── */}
      <div className="card">
        <div className="sec-title">하는 일 · 안 하는 일</div>
        <p className="muted" style={{ marginTop: 0 }}>
          <b>미리 못 박아 둡니다.</b> 나중에 「그것도 해 주는 줄 알았다」가 생기지 않도록.
        </p>
        <table className="tbl left reptbl">
          <tbody>
            <tr>
              <td className="w"><b>합니다</b></td>
              <td>목차와 서식 전부 · 대상 판정표 · 안전관리조직과 직무 · 협의체 ·
                공정별 안전점검계획과 공종별 점검표 · 안전교육계획과 교육일지 서식 ·{' '}
                <b>안전관리비 집행계획과 정산 서류</b> · 비상시 긴급조치계획 ·
                위험작업 허가서와 이행보고 · 공종별 세부 안전관리계획 · 위험성평가</td>
            </tr>
            <tr>
              <td className="w"><b>안 합니다</b><span className="d">별도 의뢰</span></td>
              <td><b>안전성 계산서</b> — 가설비계 구조검토, 시스템동바리 구조계산서,
                중량물 인양검토, 지내력·줄걸이·인양고리 검토.
                <br /><span className="muted">실제 제출본에도 「첨부」로 들어갑니다. 구조 검토 영역입니다.</span></td>
            </tr>
            <tr>
              <td className="w"><b>받아야 합니다</b></td>
              <td><b>설계안전성검토(DFS) 결과</b> — 발주처에서 나옵니다.
                이걸 받아야 「설계안전성검토 결과에 따른 위험요소」 칸을 채웁니다</td>
            </tr>
            <tr>
              <td className="w"><b>연결만 합니다</b><span className="d">등록업체만 가능</span></td>
              <td><b>지하안전평가 · 재해영향평가 · 교통영향평가 · 정밀안전점검 · 정밀안전진단</b>은
                법으로 <b>등록업체만</b> 할 수 있습니다. 저희가 하지 않습니다.
                <br />대상인지 <b>알려 드리고</b>, 등록업체를 <b>연결해 드립니다.</b></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── 값 ── */}
      <div className="card">
        <div className="sec-title">값은 어떻게 되나</div>
        <p><b>이것은 값을 받습니다.</b> 건설맵의 나머지는 앞으로도 무료입니다.</p>
        <p>
          현장마다 규모도 공법도 달라서 <b>정찰가를 붙일 수 없습니다.</b>{' '}
          같은 금액이어도 항타기가 들어가면 그만큼 늘고, 터널이 끼면 또 달라집니다.
        </p>
        <p className="muted" style={{ marginBottom: 0 }}>
          <b>얼마인지는 아직 못 적겠습니다.</b> 몇 건 실제로 해 보고 품을 안 뒤에 적겠습니다.
          근거 없이 적으면 나중에 못 지킵니다.{' '}
          <Link to="/naeyeok">내역서 작성</Link>·<Link to="/jeoksan">적산</Link>도 같은 이유로
          값을 안 적어 두었습니다.
        </p>
      </div>

      {/* ── 어떤 모양으로 만드나 (차례) ──
          실제 승인·제출본 두 벌을 열어 보고 옮긴 차례입니다. 지어낸 것이 아닙니다.
          «우리가 뭘 아는지» 를 보여 주는 자리라 값 이야기보다 먼저 둡니다. */}
      <div className="card">
        <div className="sec-title">어떤 모양으로 만듭니까</div>
        <p className="muted" style={{ marginTop: 0 }}>
          실제 승인·제출본을 그대로 따릅니다. <b>차례를 먼저 보십시오</b> —
          이 순서가 맞지 않으면 심사에서 돌아옵니다.
        </p>
        <table className="tbl left reptbl">
          <tbody>
            <tr>
              <td className="w"><b>안전관리계획서</b><span className="d">446쪽</span></td>
              <td>
                <b>제1장 총괄 안전관리계획</b><br />
                　가. 건설공사의 개요 — 공사개요서 · 위치도 · 전체공정표 · 설계도면 · 기계설비 배치<br />
                　나. 현장특성 분석 — 현장 여건 · <b>시공단계 위험요소와 저감대책</b> ·
                　　주변 안전관리 · 통행안전시설과 교통소통계획<br />
                　다. 현장운영계획 — 안전관리조직 · 공정별 안전점검 · 안전관리비 집행 ·
                　　안전교육 · 이행보고<br />
                　라. 비상시 긴급조치계획<br />
                <b>제2장 공종별 세부 안전관리계획</b><br />
                　가설 · 굴착 · 콘크리트 · 강구조물 · 성토절토 · 해체 · 건축설비 · 타워크레인
              </td>
            </tr>
            <tr>
              <td className="w"><b>유해·위험방지<br />계획서</b><span className="d">285쪽</span></td>
              <td>
                <b>1장 공사개요</b> — 변경이력 관리표 · 공사개요서 ·
                주변현황 도면(설계도면 · 위치도 · 주변현황도 · <b>지하매설물 현황도</b>) ·
                전체 공정표와 <b>주요 대형사고 위험작업 일정표</b><br />
                <b>2장 안전보건경영계획</b> — 경영방침과 조직표 · 회의 운영 · 안전점검 ·
                교육 · 복지시설 · 건강관리 · <b>산업안전보건관리비 사용계획서</b> ·
                재해 시 연락과 대피<br />
                <b>3장 공사 종류별 유해위험방지계획</b> — 그 현장의 공종마다
                (가설전기 · 이동식 크레인 · 굴착 · 특수공법 등)
              </td>
            </tr>
          </tbody>
        </table>
        <p className="muted" style={{ marginBottom: 0 }}>
          <b>알맹이는 「나. 현장특성 분석」입니다.</b> 나머지는 틀이고, 심사에서 실제로 보는 것은
          이 현장의 위험요소와 저감대책입니다. 여기에 품을 씁니다.
        </p>
      </div>

      {/* ── 문의 ── */}
      <div className="card lead-card">
        <div className="sec-title">의뢰하기</div>
        <p style={{ marginTop: 0 }}>
          <b>자료를 다 갖추고 연락하실 필요 없습니다.</b> 공사명과 연락처만 남겨 주시면,
          <b> 무엇이 필요한지 목록으로 만들어 보내 드립니다.</b>
        </p>
        <p className="muted" style={{ marginBottom: 0 }}>
          초안까지 저희가 만들고, <b>건설안전기술사 검토</b>까지 함께 진행합니다.
          값과 납기를 먼저 알려 드리고 맞으시면 시작합니다 — <b>여기까지는 돈이 들지 않습니다.</b>
        </p>
      </div>
      <QuoteForm
        쓰임="safety_ask"
        첫값="어느 쪽인지 모르겠음 — 대상인지부터"
        옵션={[
          ['계획서', ['안전관리계획서', '유해·위험방지계획서', '둘 다']],
          ['그 밖', ['어느 쪽인지 모르겠음 — 대상인지부터', '이미 쓴 것 검토만', '보완 요구를 받았음']],
        ]}
      />

      {/* ── 알아 두실 것 ── */}
      <div className="card">
        <div className="sec-title">알아 두실 것</div>
        <ul className="flist">
          <li><b>여기 적힌 대상 기준은 {기준일} 에 법령을 직접 읽어 옮긴 것입니다.</b>{' '}
            안전관리계획서는 <b>국토안전관리원</b>의 수립대상 안내에서,
            유해·위험방지계획서는 <b>국가법령정보센터</b>의 산업안전보건법 시행령에서 가져왔습니다.
            <br /><span className="muted">법은 바뀝니다. 실제로 내실 때는 <b>반드시 원문을 다시 확인</b>하십시오.</span></li>
          <li>이 표는 <b>길잡이</b>입니다. 발주처나 인·허가기관이 「필요하다고 인정」하면
            표에 없어도 대상이 됩니다</li>
          <li><b>도장은 사람이 찍습니다.</b> 서류를 아무리 잘 만들어도 자격자의 검토가 없으면
            제출이 안 됩니다</li>
          <li>남의 제출본을 참고해 만들었지만 <b>공사명·상호·사람 이름은 한 글자도 싣지 않았습니다</b></li>
        </ul>
      </div>

      {/* ── 그동안 쓸 것 ── */}
      <div className="card">
        <div className="sec-title">그동안 쓰실 것</div>
        <p className="muted" style={{ marginTop: 0 }}>
          착공 때 같이 내야 하는 것들입니다. <b>전부 무료입니다.</b>
        </p>
        <div className="btn-row">
          <Link className="btn primary" to="/forms">📄 건설 서식 — 착공계·안전점검표</Link>
          <Link className="btn ghost" to="/naeyeok">📋 내역서 작성</Link>
          <Link className="btn ghost" to="/qna">💬 사랑방</Link>
        </div>
      </div>
    </>
  )
}

/* ── 다른 화면에 붙이는 짧은 띠 ──────────────────────────
   /naeyeok 과 /forms 에서 씁니다. 여기 한 곳만 고칩니다. */
export function SafetyStrip() {
  return (
    <Link className="card fbook" to="/safety">
      <span className="fic">🦺</span>
      <div className="grow">
        <div className="t">안전관리계획서 · 유해·위험방지계획서 <em>· 착공 전에 내야 합니다</em></div>
        <div className="d">
          <b>우리 현장이 대상인지</b>부터 보십시오. 지하 10m 굴착, 항타기, 5m 거푸집,
          터널, 31m 건축물 — 걸리는 줄이 하나라도 있으면 대상입니다.{' '}
          초안부터 <b>기술사 검토</b>까지 해 드립니다. 값은 문의로.
        </div>
      </div>
      <span className="go">›</span>
    </Link>
  )
}
