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

export default function Jeoksan() {
  return (
    <>
      <div className="card lead-card">
        <h1 style={{ margin: 0, fontSize: 20 }}>🧮 K-적산</h1>
        <p className="why2" style={{ marginBottom: 6 }}>
          도면에서 물량을 뽑아 <b>수량산출서 엑셀</b>을 만듭니다.
          캐드에서 찍고, PC 에서 셉니다.
        </p>
        <p className="muted" style={{ margin: 0 }}>
          토목·건축 <b>둘 다</b> 됩니다. 산출식이 프로그램 안이 아니라{' '}
          <b>엑셀 표에 있어서</b> 그렇습니다.
        </p>
      </div>

      {/* ── 사이트에서 바로 ── */}
      {/* 🔒 2026-09-17 — 소장님: 「이용자 들이 사용하게 하면 안돼」
          쓰는 화면(/jeoksan/run)은 잠갔습니다. 여기서도 링크하지 않습니다. */}
      <div className="card">
        <div className="sec-title">아직 열지 않았습니다</div>
        <p style={{ marginTop: 0 }}>
          <b>「잰 치수 → 수량산출서 엑셀」 은 이미 돌아갑니다.</b>{' '}
          다만 아직 <b>시험 중</b>이라 열지 않았습니다 — 수량은 한 번 틀리면
          그대로 돈이 되는 자리라, 제 손으로 충분히 돌려 본 뒤에 엽니다.
        </p>
        <p className="muted">
          열리면 <b>재료표</b>와 <b>치수표</b> 두 장을 올리시면 산출서·집계·태그별·검산·쓴표{' '}
          다섯 장짜리 엑셀이 나옵니다. 파일은 <b>브라우저 안에서만</b> 다룹니다 —
          올라가는 것이 없습니다.
        </p>
      </div>

      {/* ── 네 걸음 ── */}
      <div className="card">
        <div className="sec-title">어떻게 쓰나 — 네 걸음</div>
        <table className="tbl left reptbl">
          <tbody>
            <tr>
              <td className="w"><b>1. 재료표</b><span className="d">엑셀 · 처음 한 번</span></td>
              <td>부재 하나가 어떤 재료를 얼마나 먹는지 <b>한 줄씩</b> 적습니다.
                <br /><span className="muted">구조물 · 콘크리트 · m3 · <b>A*H</b> 같은 식입니다. 여기가 이 물건의 머리입니다.</span></td>
            </tr>
            <tr>
              <td className="w"><b>2. 설정 만들기</b><span className="d">단추 하나</span></td>
              <td>재료표를 읽어 <b>캐드가 읽을 설정</b>을 냅니다.
                <br /><span className="muted">「구조물을 찍을 땐 A 와 H 를 물어라」 를 <b>표에서 저절로</b> 알아냅니다. 따로 적지 않습니다.</span></td>
            </tr>
            <tr>
              <td className="w"><b>3. 도면에서 찍기</b><span className="d">캐드</span></td>
              <td>부재를 고르고, 도면의 선을 <b>한 번 클릭</b>하면 길이·넓이를 잽니다.
                <br /><span className="muted">잰 객체는 <b>빨갛게</b> 바뀝니다. 어디까지 했는지 한눈에 보입니다.</span></td>
            </tr>
            <tr>
              <td className="w"><b>4. 산출서 만들기</b><span className="d">단추 하나</span></td>
              <td>캐드에서 낸 파일을 창에 <b>끌어다 놓으면</b> 엑셀이 나옵니다.
                <br /><span className="muted">산출서 · 집계 · 태그별 · 검산 · 쓴표, 다섯 장입니다.</span></td>
            </tr>
          </tbody>
        </table>
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
              <td className="w"><b>캐드</b><span className="d">어디서 도나</span></td>
              <td>순수 AutoLISP 만 씁니다. ActiveX 를 안 써서{' '}
                <b>AutoCAD LT 2024 이상 · 캐디안 · ZWCAD</b> 에서도 같은 파일 하나로 돕니다.</td>
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
        <div className="sec-title">나오는 엑셀 — 다섯 장</div>
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
        <p><b>이것은 값을 받습니다.</b></p>
        <p>
          건설맵의 나머지는 앞으로도 무료입니다. 자료를 모아 두면 몇 명이 보든 품이 같기 때문입니다.
          그런데 적산은 다릅니다. <b>현장마다 재료표를 맞춰 드려야 하고</b>, 도면을 같이 봐야 하고,
          안 되는 부재가 나오면 그때그때 고쳐야 합니다.{' '}
          <b>건건이 사람 손이 들어갑니다.</b> 그래서 값을 받습니다.
        </p>
        <p className="muted" style={{ marginBottom: 0 }}>
          <b>얼마인지는 아직 못 적겠습니다.</b> 몇 현장에서 실제로 돌려 보고 품이 얼마나 드는지 안 뒤에 적겠습니다.
          근거 없이 적으면 나중에 못 지킵니다.{' '}
          <Link to="/naeyeok">내역서 작성</Link>도 같은 이유로 값을 안 적어 두었습니다.
        </p>
      </div>

      {/* ── 준비 중 ── */}
      <div className="card">
        <div className="sec-title">아직 열지 않은 것 — 「도면에서 찍기」</div>
        <p>
          <b>사이트에서 도는 것</b>(잰 치수 → 산출서)은 위에서 지금 쓰실 수 있습니다.{' '}
          아직 안 연 것은 <b>캐드에서 도면을 찍는 리습</b>과 그것을 돌리는 PC 프로그램입니다.{' '}
          지금은 <b>제 현장에서만 돌리고 있습니다.</b> 내려받는 단추가 없는 것은 감춘 것이 아니라{' '}
          <b>아직 올리지 않았기 때문</b>입니다.
        </p>
        <p>
          캐드가 판이 여러 가지입니다. 제 자리에서 되는 것이 남의 자리에서 된다는 뜻은 아닙니다.{' '}
          <b>그 확인이 끝나기 전에는 열지 않겠습니다.</b>{' '}
          되는 척하는 도구를 쥐여 드리면 그 물량으로 낸 서류가 틀립니다.
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
          <li><b>표준품셈 · 물가정보 · 노임단가는 싣지 않습니다.</b> 유료 자료입니다.
            그 자리는 <b>조달청이 공개한 공고 첨부 내역서</b>로 대신합니다 —
            실제 설계에 쓰인 규격·수량·단가입니다.
            재료표의 환산·할증 칸은 <b>쓰시는 기준으로 고쳐 쓰는 자리</b>입니다</li>
          <li>철근 단위중량(<b>KS D 3504</b>)만 들어 있습니다. 표준 규격이라 그렇습니다</li>
          <li><b>단가는 내지 않습니다.</b> 수량과 산출근거까지입니다</li>
          <li>도면을 <b>스스로 읽어 주지 않습니다.</b> 사람이 클릭해야 합니다 —
            도면의 선이 무엇을 뜻하는지는 도면마다 달라서, 자동으로 하면 반드시 틀립니다</li>
        </ul>
      </div>

      {/* ── 그동안 쓸 것 ── */}
      <div className="card">
        <div className="sec-title">그동안 쓰실 것</div>
        <p className="muted" style={{ marginTop: 0 }}>
          적산이 열릴 때까지, 지금 바로 쓰실 수 있는 것들입니다. <b>전부 무료입니다.</b>
        </p>
        <div className="btn-row">
          <Link className="btn primary" to="/cad">📐 캐드 유틸 — 길이·면적·개수 재기</Link>
          <Link className="btn ghost" to="/change/twoline">🔁 설계변경 2줄 변환</Link>
          <Link className="btn ghost" to="/tools">🧰 건설 도구</Link>
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
          <b>잰 치수를 올리면 수량산출서 엑셀</b>이 바로 나옵니다. 깔 것도 가입도 없습니다.
          산출근거가 <b>살아 있는 엑셀 수식</b>이라 감리가 칸을 눌러 봅니다.{' '}
          도면에서 찍는 캐드 리습은 아직 준비 중입니다.
        </div>
      </div>
      <span className="go">›</span>
    </Link>
  )
}
