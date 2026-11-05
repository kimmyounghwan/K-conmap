/**
 * 📣 G549 «광고 · 제휴 안내» 쪽(/ad) — 2026-11-05
 *   소장님 「광고, 제휴 받는다는 걸 이용자에게 알릴려면 어떻게 해야 하지? 이제 돈 좀 벌어 보자」
 *          「모든 페이지에 띄워져 있어야 하지 않아?」 「건설맵 광고 제휴 문의 어떻게 할 건지 아이디어 주고 캡쳐 줘」
 *   ■ 들어오는 길: 모든 쪽 맨 아래 «📣 광고 · 제휴 문의» · PC 머리 줄 «📣 광고 · 제휴» · 광고 카드 띠 «광고 문의 →» · 빈 자리 «광고 모집» 카드
 *   ■ 보이는 것: 광고 자리 · 방문 숫자(바로투찰 지도와 같은 셈) · 견본 카드(가상 업체) · 신청 세 걸음 · 제휴 분야 · 값은 «문의»
 *   ■ 문의 보내기 = 지금 있는 비공개 문의(/contact?k=ad — 운영자 메일로만 · 남에게 안 보임) · 셈 |광고문의|보내러
 *   ■ 광고 · 제휴 둘 다 같은 무게로 — 소장님 「광고나 제휴잖아. 지금 광고만 받는다고 잇는데」 「근데, 제휴도 받잖아. 카페나 사이트 보면, 뭘 제휴 받는다는 거지?」
 *   ■ 유료 광고(광고주 모집)로 — 소장님 「광고 — 명함 한 장이면 광고 카드로 만들어 드립니다 … 이게 뭐지. 건설맵이 돈을 벌어야 하는데...내가 광고비를 받으려고 하는 거야」 「이해를 못한 거야?」
 *     → «명함 한 장이면» 뺌(공짜처럼 읽힘) · 광고주 · 제휴 모집 · 광고비 · 기간 문의 → 견본 → 게재 · 매달 효과 보고(보인 수 · 전화 누른 수)
 *   ■ 방문 숫자 뺌 · 맨 위 두 칸이 바로 «문의» — 소장님 「누적방문...오늘 방문자 이게 왜 있지? 그리고, 최대한 편하게 만들어 줘」(G552)
 *     → 📣 광고 문의(/contact?k=ad&w=a) · 🤝 제휴 문의(?k=ad&w=p) 한 번에 · 문의 칸은 연락처만 적으면 됨
 *     → 맨 위 두 칸(📣 광고 · 🤝 제휴) · 제휴 칸에 네 가지(이용자 할인 · 서로 알리기 · 설명회 · 교육 · 자료 · 상담 연결) · 🤝 제휴 문의(/contact?k=ad&w=p · |광고문의|보내러:제휴)
 */
import { Link } from 'react-router-dom'
import { 광고카드 } from '../광고칸.jsx'
import { 세기 } from '../lib/받은수.jsx'

/* 견본 — 지어낸 틀(실제 업체 · 번호 아님). 어떤 업체가 올지 모르니 업종을 짐작하는 말은 안 씀(«중기» 금지)
 *   소장님 「중기 라는 말은 빼줘. 무슨 업체인지 모르는데,,」 「중기라는 말을 넣으면 안돼지」 (2026-11-05) */
const 견본 = {
  id: 'demo', 아이콘: '🏢', 이름: '○○○ (업체 이름)', 대표: '홍길동', 한줄: '하시는 일을 한 줄로 소개합니다',
  칩: ['주요 업무', '면허 · 자격', '가능 지역'],
  전화: '010-0000-0000',
  정보: [['사무실', '000-000-0000'], ['메일', 'example@example.com'], ['주소', '○○시 ○○구 ○○로 00']],
}
const 자리들 = [
  ['🏆', '1순위 목록', '셋째 · 열째 · 열일곱째 카드 다음 — 개찰 결과를 보러 매일 들어오는 곳'],
  ['📋', '공고 목록', '셋째 카드 다음 — 입찰할 공사를 고르는 곳'],
  ['🧮', '보험료 계산기 · 4대보험 판단기', '결과 바로 아래 — 보험 · 노무를 챙기는 분'],
  ['👷', '노무비 계산기 · 산재 휴업급여', '결과 바로 아래 — 현장 노무를 맡은 분'],
]
/* 🤝 제휴 네 가지 — 카페 · 사이트가 흔히 받는 제휴를 K-건설맵에 맞게(약속하는 값 · 조건은 안 적음 — 문의 주시면 함께 정함) */
const 제휴들 = [
  ['🎁', '이용자 할인', '«K-건설맵 보고 왔어요» 하면 할인 · 덤 — 교육원 · 장비 · 프로그램'],
  ['🔗', '서로 알리기', '건설 카페 · 사이트 · 단체와 서로 소개'],
  ['🎓', '설명회 · 교육 · 자료', '건설 교육 · 설명회 · 쓸모 있는 자료를 함께 알림'],
  ['🤝', '상담 연결', '노무 · 세무 · 보증 전문가와 이용자를 이어 드림'],
]

export default function AdInfo() {
  const 보내러 = (곳 = '') => { try { 세기('|광고문의|보내러' + (곳 ? ':' + 곳 : '')) } catch (e) { /* 없음 */ } }
  return (
    <div className="adinfo">
      <div className="card adinfo-hero">
        <h1 className="adinfo-h1">📣 K-건설맵 광고주 · 제휴 모집</h1>
        <p className="adinfo-lead">공공 공사 입찰하는 업체, 현장 공무 · 소장님들이 매일 보는 K-건설맵 — 광고주와 제휴를 모십니다.</p>
        <div className="adinfo-two">
          <a className="adinfo-pick" href="/contact?k=ad&w=a" onClick={() => 보내러('광고')}><b>📣 광고 문의</b><span>{'1순위\u00a0· 공고\u00a0· 계산기 결과 아래 자리 — 광고비\u00a0· 기간 안내'}</span><em>문의하기 →</em></a>
          <a className="adinfo-pick" href="/contact?k=ad&w=p" onClick={() => 보내러('제휴')}><b>🤝 제휴 문의</b><span>{'이용자\u00a0할인\u00a0· 서로\u00a0알리기\u00a0· 교육\u00a0· 상담\u00a0연결'}</span><em>문의하기 →</em></a>
        </div>
        <p className="adinfo-small">연락처만 남기시면 운영자가 연락드립니다 — 문의는 운영자 메일로만 가고, 다른 사람에게 보이지 않습니다. 자세한 안내는 아래에 있습니다.</p>
      </div>

      <div className="card adinfo-sec" id="ad-guide">
        <div className="sec-title" style={{ marginTop: 0 }}>📣 광고가 나오는 자리</div>
        <ul className="adinfo-spots">
          {자리들.map(([i, n, d]) => <li key={n}><span aria-hidden="true">{i}</span><b>{n}</b><em>{d}</em></li>)}
        </ul>
        <p className="adinfo-small">쪽마다 업체 한 번 · 띄우는 창 없음 — 이용자가 불편하지 않게 넣습니다.</p>
      </div>

      <div className="card">
        <div className="sec-title" style={{ marginTop: 0 }}>견본 — 이렇게 나옵니다</div>
        <광고카드 a={견본} 견본 />
      </div>

      <div className="card">
        <div className="sec-title" style={{ marginTop: 0 }}>📣 광고 진행 순서</div>
        <ol className="adinfo-steps">
          <li><b>문의</b> — 원하시는 자리 · 기간을 «문의 보내기» 로 남겨 주세요.</li>
          <li><b>광고비 · 기간 안내</b> — 자리 · 기간에 맞춰 답장으로 알려 드립니다.</li>
          <li><b>광고 카드 · 견본</b> — 업체 정보로 광고 카드를 만들어 먼저 보여 드립니다.</li>
          <li><b>게재 · 효과 보고</b> — 실은 뒤 매달 «보인 수 · 전화 누른 수» 를 알려 드립니다.</li>
        </ol>
        <p className="adinfo-small"><b>광고 단가는 최저로 하겠습니다.</b> 보험 · 금융 광고는 회사 심의를 마친 글만 싣습니다.</p>
        <a className="btn adinfo-go" href="/contact?k=ad&w=a" onClick={() => 보내러('광고')}>📣 광고 문의 보내기</a>
      </div>

      <div className="card adinfo-sec" id="ad-partner">
        <div className="sec-title" style={{ marginTop: 0 }}>🤝 제휴 — 이런 일을 함께합니다</div>
        <ul className="adinfo-spots adinfo-kinds">
          {제휴들.map(([i, n, d]) => <li key={n}><span aria-hidden="true">{i}</span><b>{n}</b><em>{d}</em></li>)}
        </ul>
        <div className="adinfo-sub">이런 분야와 함께합니다</div>
        <div className="adc-chips adinfo-chips">
          {['건설 장비', '자재 · 철물', '보험', '노무 · 세무', '교육 · 자격증', '건설 소프트웨어'].map((t) => <span key={t} className="adc-chip">{t}</span>)}
        </div>
        <p className="adinfo-small">«제휴 문의 보내기» 에 회사 이름 · 하시는 일 · 함께하고 싶은 일을 적어 주세요. 방식은 문의 주시면 함께 정합니다.</p>
        <a className="btn line adinfo-go" href="/contact?k=ad&w=p" onClick={() => 보내러('제휴')}>🤝 제휴 문의 보내기</a>
      </div>
      <p className="adinfo-small" style={{ textAlign: 'center' }}><Link to="/">← K-건설맵 첫 화면</Link></p>
    </div>
  )
}
