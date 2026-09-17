/**
 * /safety — 「안전관리계획서 · 유해·위험방지계획서」 소개 (2026-09-16)
 *
 * 소장님: 「①②③ 다 하자. 안전관리계획서·유해위험방지계획서부터.」
 *         「소개페이지를 붙이는 거지? 현재 준비중으로」
 *
 * ⚠️ 「준비 중」 입니다. 문의 창구를 열지 않습니다 — /jeoksan 과 같은 방침입니다.
 *    유해·위험방지계획서는 «검토자 서명» 이 문서 안에 들어갑니다.
 *    검토해 줄 분이 정해지기 전에 문의를 받으면 못 지킬 약속이 됩니다.
 *    → 정해지면 이 주석과 아래 「아직 열지 않았습니다」 칸을 지우고 문의를 엽니다.
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

      {/* ── 주실 자료 ── */}
      <div className="card">
        <div className="sec-title">주실 자료 — 일곱 가지</div>
        <p className="muted" style={{ marginTop: 0 }}>
          이것만 주시면 시작할 수 있습니다. <b>지반조사보고서가 없으면 안전성 검토를 못 합니다</b> —
          이게 제일 자주 빠집니다.
        </p>
        <table className="tbl left reptbl">
          <tbody>
            <tr><td className="w"><b>1. 계약</b></td>
              <td>공사명 · 현장 소재지 · 공사기간(착공예정일 · <b>실착공일</b> · 준공예정일) ·
                공사금액 · 발주처 · 설계사 · 건설사업관리단 연락처</td></tr>
            <tr><td className="w"><b>2. 도면</b></td>
              <td>설계도면 전체와 <b>도면목록표</b> · 위치도 · 주변현황도 · 인접구조물 현황도 ·{' '}
                <b>지하매설물 현황도</b></td></tr>
            <tr><td className="w"><b>3. 지반</b></td>
              <td><b>지반조사보고서</b> — 시추주상도 · 시추위치도 · 지층 구분 · 지반정수</td></tr>
            <tr><td className="w"><b>4. 내역서</b></td>
              <td>설계내역서. <b>안전관리비 · 산업안전보건관리비</b> 계상액을 여기서 뽑습니다</td></tr>
            <tr><td className="w"><b>5. 사람</b></td>
              <td>현장대리인 선임계 · 재직증명서 · <b>건설기술인 경력증명서</b> ·
                안전총괄책임자 선임서 · 협력업체 수와 근로자 수</td></tr>
            <tr><td className="w"><b>6. 사진</b></td>
              <td>현장 주변 · 장비 진입로 · 인접 건물.
                유해·위험방지계획서는 <b>작성 회의 사진과 회의록</b>도 들어갑니다</td></tr>
            <tr><td className="w"><b>7. 장비</b></td>
              <td><b>투입 장비 목록과 제원</b> — 항타기·천공기 규격, 크레인 톤수, 펌프카 붐 길이.
                <br /><span className="muted">문서의 절반이 여기에 매달려 있습니다. 장비가 바뀌면 그만큼 다시 씁니다.</span></td></tr>
          </tbody>
        </table>
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

      {/* ── 준비 중 ── */}
      <div className="card">
        <div className="sec-title">아직 열지 않았습니다</div>
        <p>
          유해·위험방지계획서는 <b>검토자 서명</b>이 문서 안에 들어갑니다.
          검토해 주실 분이 정해지기 전에 문의를 받으면{' '}
          <b>못 지킬 약속</b>이 됩니다. 그래서 아직 문의 창구를 열지 않았습니다.
        </p>
        <p className="muted" style={{ marginBottom: 0 }}>
          열리면 <b>이 화면에 적겠습니다.</b> 언제라고는 못 적겠습니다 —
          지킬 수 없는 약속은 안 하는 편이 낫습니다.
        </p>
      </div>

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
          <b>준비 중입니다</b> — 무엇을 드리는지, 무슨 자료가 필요한지 먼저 보십시오.
        </div>
      </div>
      <span className="go">›</span>
    </Link>
  )
}
