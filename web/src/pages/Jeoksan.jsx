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
/* 🧮🧰 2026-09-29 — 소장님: 「적산에 필요한 자료는 받고 있지? 그리고 적산탭도 한 번 바꿔보자..의견 줘」 → (A · B · C 가운데) 「A로 해줘」
   점검: 글이 사용설명서처럼 길었습니다(도구 단추 넷 뒤로 설명 아홉 덩이). 도면 다루기 도구(DWG→DXF · 도면 PDF · 3D)는 안 걸려 있었고,
         단가 자료가 얼마나 쌓였는지도 안 보였습니다.
   → 내역서 탭(Naeyeok.jsx 작업대)과 같은 «무엇을 가지고 계십니까?» 작업대 다섯: ① 도면만 ② 도면 + 내역서 ③ 공내역서만 ④ 도면에 표가 없음 ⑤ 도면 다루기.
     «어디까지 되나» 표는 그대로 두고, 단가 자료 칸을 더하고, 긴 설명(도구마다 · 다른 점 · 검산 · 엑셀 다섯 장 · 시험판 · 알아 둘 것)은 접어 둡니다(글은 그대로).
   ⚠️ 단가표 숫자는 «사이트의 단가 채우기가 지금 쓰는 표» 입니다(PC K-적산웹\functions\core_목록.json «만든때» · 같은품목표 _갱신기록.md).
      PC 는 저녁마다 더 쌓지만 G1 함수 올리기를 해야 사이트에 들어갑니다 — 함수를 다시 올리면 아래 단가표 도 같이 고치십시오.
   ⚠️ «🧪 예시 있음» 은 그 화면에 «예시로 해 보기» 단추가 실제로 있는 것만(도면 물량 자동 · 골조 · 마감). */
import { Link } from 'react-router-dom'
import { 받은수, 화면열쇠 } from '../lib/받은수.jsx'   /* ⬇ 2026-10-01 (G109) 소장님 「내역서 및 적산 탭 안에 … 받기 숫자가 하나도 없는데?」 — 도구 탭과 같은 숫자 */
import { PriceStance } from '../components.jsx'

const 단가표 = { 품목: '63,665', 공고: '4,555', 반영: '2026-09-27' }

const 갖고 = [
  {
    k: 'dwg', n: '①', ic: '📐', h: '도면만 있습니다', 짧게: '도면 → 물량 전부 · 엑셀',
    언제: '토목(철근 재료표 · 횡단면 토공 · 레이어별 길이·면적)이든 건축(골조 · 마감)이든 도면(DXF·DWG)을 넣으면 도면에 적힌 표·글자·선으로 물량을 셉니다. 고칠 곳만 누릅니다.',
    도구: [
      { to: '/jeoksan/auto', ic: '⚡', t: '도면 물량 자동 — 전부 한꺼번에', 예시: true, d: '철근 재료표 · 수량표 · 횡단면 토공 · 레이어별 길이·면적 · 기호 개수 · 골조까지 엑셀 한 파일로.' },
      { to: '/jeoksan/golgo', ic: '🏗', t: '골조 — 보 · 기둥 · 슬래브 · 벽 · 기초', 예시: true, d: '구조평면도와 부재 일람표로 콘크리트 · 거푸집 · 철근을 층별 · 부재별로. 산출서 · 집계 · 검산 · 인쇄.' },
      { to: '/jeoksan/magam', ic: '🧱', t: '마감 — 방마다 바닥 · 벽 · 천장', 예시: true, d: '평면도의 방을 스스로 찾아 면적·둘레를 넣고, 마감표·창호표로 재료별 수량을 셉니다.' },
    ],
  },
  {
    k: 'both', n: '②', ic: '📑', h: '도면과 내역서가 있습니다', 짧게: '대조 · 빈 수량 칸 채우기',
    언제: '내역서(엑셀)를 도면과 같이 넣으면 줄마다 짝을 지어 물량 차이를 보여 주고, 짝이 확실한 줄은 빈 수량 칸에 도면 물량을 넣어 그 파일 그대로 돌려 드립니다(바꾼 칸은 노란 바탕 · 근거 시트).',
    도구: [
      { to: '/jeoksan/auto', ic: '📑', t: '내역서 대조 · 수량 칸 채우기', 예시: true, d: '도면 물량 자동 화면에서 내역서를 같이 넣습니다. 이어서 단가 채우기까지 한 번에 갈 수 있습니다.' },
      { to: '/jeoksan/fill', ic: '💰', t: '이어서 단가 채우기', 딱지: '시험판', d: '수량이 찬 내역서에 품목마다 단가를 찾아 넣습니다. 채운 값은 한 줄씩 확인하십시오.' },
    ],
  },
  {
    k: 'empty', n: '③', ic: '💰', h: '공내역서만 있습니다', 짧게: '단가 채우기 · 낙찰금액에 맞추기',
    언제: '받은 공내역서에 품명·규격으로 단가를 찾아 넣고, 낙찰금액(또는 비율)에 맞춰 원가계산서까지 맞춥니다.',
    도구: [
      { to: '/jeoksan/fill', ic: '💰', t: '공내역서 단가 채우기', 딱지: '시험판', d: '«확실히 붙음» 줄은 그대로, 애매한 줄은 후보(1~5)에서 고르고, 못 찾은 줄은 직접 채웁니다.' },
      { to: '/naeyeok/ratio', ic: '📉', t: '낙찰금액에 맞추기', d: '단가가 든 내역서를 올리고 맞출 금액이나 비율만 넣으면 단가·금액과 원가계산서가 그대로 따라옵니다.' },
    ],
  },
  {
    k: 'hand', n: '④', ic: '✍️', h: '도면에 표가 없습니다', 짧게: '눌러 채우기 · 계산기',
    언제: '표·글자·레이어가 없는 도면이거나 몇 줄만 빨리 세고 싶을 때 — 재료표와 치수표로 수량산출서를 짜고, 치수는 도면을 눌러 넣습니다.',
    도구: [
      { to: '/jeoksan/run', ic: '🧮', t: '수량산출서 만들기', d: '재료표(토목·건축 견본) + 치수표. 칸을 누르고 도면을 누르면 값이 들어갑니다 — 산출서 · 집계 · 태그별 · 검산 · 쓴표.' },
      { to: '/tools/concrete-volume', ic: '🧱', t: '콘크리트 물량 계산기', d: '부재 치수와 개수를 넣으면 체적(㎥)이 나옵니다.' },
      { to: '/tools/formwork-area', ic: '🪵', t: '거푸집 면적 계산기', d: '부재 치수를 넣으면 거푸집이 닿는 면적(㎡)이 나옵니다.' },
      { to: '/tools/rebar-weight', ic: '🏗', t: '철근 중량 계산기', d: '규격(D10~D51)과 길이·개수를 넣으면 총 중량(kg·톤)이 나옵니다.' },
      { to: '/tools/soil-volume', ic: '⛰', t: '토량환산계수(L·C) 환산기', d: '자연상태 ↔ 흐트러진 상태 ↔ 다짐상태 토량을 서로 바꿉니다.' },
    ],
  },
  {
    k: 'file', n: '⑤', ic: '🗂', h: '도면부터 다뤄야 합니다', 짧게: 'DWG → DXF · PDF · 3D',
    언제: '도면을 바꾸거나 인쇄하거나 입체로 보고 싶을 때. 캐드가 없어도 사이트에서 바로 엽니다.',
    도구: [
      { to: '/tools/dwgdxf', ic: '🔁', t: 'DWG → DXF 바꾸기', d: 'DWG 를 끌어다 놓으면 DXF 로 바꿔 바로 받습니다. 여러 장 한 번에 · 한글·레이어 그대로.' },
      { to: '/tools/dxfpdf', ic: '📄', t: '도면 PDF 만들기', d: '도곽을 스스로 찾아 한 장씩 PDF 로 — 흑백(색마다 굵기) · 컬러 · 한글 글자까지.' },
      { to: '/tools/dxf3d', ic: '📦', t: '도면 3D 보기', d: '건물은 평면·입면으로 층을 쌓고, 토목은 횡단면도를 이어 세웁니다. DWG 도 바로.' },
      { to: '/cad', ic: '📏', t: '캐드 유틸 — 길이 · 면적 · 개수 리습', d: '받아서 캐드에 올려 씁니다. 오토캐드 LT · 캐디안 · ZWCAD 도 됩니다.' },
    ],
  },
]

/* 카드마다 그 화면에서 받은 횟수(0 이면 안 보임) — 다른 카드 화면은 빼고 셈(도구 탭과 같게) */
const 카드열쇠 = () => new Set(갖고.flatMap((s) => s.도구).map((x) => 화면열쇠(x.to)))
let 카드열쇠캐시 = null
function 도구칸({ x }) {
  return (
    <Link className="tlx-card" to={x.to}>
      <span className="tlx-ic">{x.ic}</span>
      <span className="tlx-body">
        <span className="tlx-t">{x.t}{x.딱지 && <em className="tlx-new ny-tag">{x.딱지}</em>}{x.예시 && <em className="tlx-new js-ex">🧪 예시 있음</em>}</span>
        <span className="tlx-d">{x.d}</span>
        <받은수 쪽={x.to} 봄={x.to} 빼기={카드열쇠캐시 || (카드열쇠캐시 = 카드열쇠())} className="dlcount tlx-dl" />
      </span>
    </Link>
  )
}

function 작업대() {
  return (
    <>
      <div className="card ny-pick">
        <div className="sec-title" style={{ marginTop: 0 }}>무엇을 가지고 계십니까?</div>
        <div className="ny-pick-row">
          {갖고.map((s) => (
            <a className="ny-pick-b" href={'#js-' + s.k} key={s.k}>
              <span className="ny-pick-t"><span className="ny-n">{s.n}</span> {s.ic} {s.h}</span>
              <span className="ny-pick-d">{s.짧게}</span>
            </a>
          ))}
        </div>
      </div>
      {갖고.map((s) => (
        <div className="card ny-sit" id={'js-' + s.k} key={s.k}>
          <div className="ny-sit-h"><span className="ny-n">{s.n}</span> {s.ic} {s.h}</div>
          <div className="ny-sit-w">{s.언제}</div>
          <div className="tlx-grid">
            {s.도구.map((x, i) => <도구칸 x={x} key={x.to + i} />)}
          </div>
        </div>
      ))}
    </>
  )
}

export default function Jeoksan() {
  return (
    <>
      <div className="card lead-card">
        <h1 style={{ margin: 0, fontSize: 20 }}>🧮 K-적산 — 도면을 넣으면 물량, 내역서 수량 칸까지</h1>
        {/* ⏸ 2026-09-25 — 소장님: 「그럼 작성대행도 안돼고, 적산도 안되는 거잖아. 근데, 사이트에는 된다고 해놓서」
            «산출내역서와 원가계산서까지 만듭니다» 는 아직 사실이 아닙니다. 되는 것과 안 되는 것을 그대로 적습니다(아래 «어디까지» 표). */}
        <p className="why2" style={{ marginBottom: 0 }}>
          <b>무엇을 가지고 계신지 고르시면 쓸 도구가 나옵니다.</b> 골조 · 마감까지 도면만 넣으면 저절로, 엑셀로 — 치수를 손으로 적지 않습니다.
          물량 도구는 <b>무료</b>, 가입도 설치도 없습니다. 도면은 <b>이 브라우저 안에서만</b> 읽습니다.
        </p>
      </div>

      <작업대 />

      {/* ── 적산의 차례 ──
          2026-09-17 — 소장님: 「적산은 원가계산서 부터. 내역서 등등이 들어가는 거야.
          지금 설명해 놓은 거 보면 이런게 하나도 없어」
          맞습니다. 수량산출 얘기만 적어 두었습니다. 차례를 통째로 적습니다.
          ⚠️ 되는 것과 안 되는 것을 섞어 적지 않습니다. 표에 그대로 나눠 둡니다. */}
      <div className="card" id="js-scope">
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

      {/* 📚 2026-09-29 — 단가 자료가 어디서 오고 얼마나 쌓였나 (소장님 「적산에 필요한 자료는 받고 있지?」) */}
      <div className="card" id="js-price">
        <div className="sec-title">📚 단가 자료 — 어디서 오나</div>
        <p style={{ marginTop: 0, lineHeight: 1.8 }}>
          단가는 <b>조달청이 공고에 붙여 공개한 설계 내역서</b>에서 뽑습니다 — 실제 설계에 쓰인 규격 · 수량 · 단가입니다.
          지금 <b>단가 채우기</b>가 쓰는 표는 공고 <b>{단가표.공고}건</b>에서 뽑은 같은 품목 <b>{단가표.품목}가지</b>입니다({단가표.반영} 반영).
          새 공고 내역서는 날마다 저녁에 받아 쌓고, 모이면 이 표에 더합니다.
        </p>
        <ul className="flist" style={{ marginBottom: 0 }}>
          <li><b>표준품셈 · 물가정보 · 노임단가는 싣지 않습니다.</b> 유료 자료입니다.
            그 자리는 <b>조달청이 공개한 공고 첨부 내역서</b>로 대신합니다 —
            실제 설계에 쓰인 규격·수량·단가입니다.
            재료표의 환산·할증 칸은 <b>쓰시는 기준으로 고쳐 쓰는 자리</b>입니다</li>
        </ul>
        <div className="navrow" style={{ marginTop: 10 }}>
          <Link className="navi" to="/change/naeyeok">📑 공사 내역서 모음 — 발주처 설계 단가 보기</Link>
          <Link className="navi" to="/change/unit">📐 단가 · 품셈 기준 (2026년)</Link>
        </div>
      </div>

      {/* ── 긴 설명은 접어 둡니다 (2026-09-29) — 글은 그대로, 펼치면 보입니다 ── */}
      <details className="card js-more">
        <summary className="sec-title">도구마다 무엇을 하나</summary>
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
      </details>

      <details className="card js-more">
        <summary className="sec-title">흔한 방식과 무엇이 다른가</summary>
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
      </details>

      <details className="card js-more">
        <summary className="sec-title">검산이 잡아 주는 것</summary>
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
      </details>

      <details className="card js-more">
        <summary className="sec-title">수량산출서 만들기의 엑셀 — 다섯 장</summary>
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
      </details>

      <details className="card js-more">
        <summary className="sec-title">시험판 · 아직 열지 않은 것</summary>
        <ul className="flist">
          <li><b>단가 채우기 — 시험판으로 열었습니다</b>(2026-09-27). 품목은 3줄 중 2줄이 맞지만 단가가 설계값 ±10% 안에 드는 줄이 39.5% 라,
            <b>채운 값을 한 줄씩 확인</b>하셔야 합니다. 고르신 짝이 쌓이면 맞는 줄이 늘어납니다. <Link to="/jeoksan/fill">📑 단가 채우기 열기 ›</Link></li>
          <li><b>캐드 안에서 찍는 리습</b> — 캐드 판이 여러 가지라 확인이 끝나기 전에는 열지 않습니다.
            그동안은 <b>사이트에서 도면을 넣으십시오</b> — 골조·마감·도면 물량 자동은 저절로 채우고, 고칠 곳만 누릅니다(수량산출서는 눌러 채움).</li>
        </ul>
      </details>

      <details className="card js-more">
        <summary className="sec-title">알아 두실 것</summary>
        <ul className="flist">
          <li>철근 단위중량(<b>KS D 3504</b>)만 들어 있습니다. 표준 규격이라 그렇습니다</li>
          <li>물량 도구는 <b>단가를 내지 않습니다.</b> 수량과 산출근거까지입니다</li>
          <li><b>자동은 도면에 적힌 것만 셉니다.</b> 표·글자·레이어가 없는 도면, 선의 뜻이 레이어로 갈리지 않은 도면은
            덜 나옵니다. 골조는 <b>부재 일람표</b>(크기·철근)와 평면의 <b>부재 기호</b>(G1·C1·S1…)가 있어야 셉니다 —
            없으면 골조·마감·수량산출서에서 도면을 눌러 채우십시오. 개구부·계단·헌치처럼 평면에 기호로 없는 것도 골조 화면에서 더합니다</li>
        </ul>
      </details>

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

      <Link className="card fbook" to="/naeyeok">
        <span className="fic">📋</span>
        <div className="grow">
          <div className="t">내역서 일은 «내역서» 탭에 <em>· 산출내역서 · 하도급 · 설계변경</em></div>
          <div className="d">낙찰 뒤 산출내역서, 하도급 80%·실행내역, 설계변경·물가변동 — 쓸 도구와 서식이 차례대로 있습니다.</div>
        </div>
        <span className="go">›</span>
      </Link>
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
