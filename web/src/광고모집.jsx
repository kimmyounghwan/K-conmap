/**
 * 📣 G549 광고 · 제휴 모집 카드 — 광고가 없는 쪽(도구 목록 · 서식 목록 …)에 한 장 (2026-11-05)
 *   소장님 「건설맵에서 광고, 제휴 문의 한다는 걸 알려야 문의가 들어 오잖아. 모든 페이지에 뒀으면 하는데??」
 *   ■ 광고와 같은 꼴(크림 바탕 · «광고» 딱지) — 누르면 /ad 안내 쪽 · 셈 |광고문의|모집:<자리>
 *   ■ 광고가 있는 쪽에는 안 둠(한 쪽에 한 번) · 첫 결과 위에는 안 둠 · 띄우는 창 없음 · 인쇄 안 나옴
 *   ■ 광고 · 제휴 둘 다 — 소장님 「광고나 제휴잖아. 지금 광고만 받는다고 잇는데」
 *   ■ 📐 G651 소장님 「현재 광고 다 크기 줄이고」 — 광고 칸과 같이 작게(글 · 단추 · 여백) · 이름 줄의 «— 광고주 · 제휴 모집»(위 띠와 같은 말) 뺌
 *   ■ 유료 광고(광고주 모집) — 소장님 「건설맵이 돈을 벌어야 하는데...내가 광고비를 받으려고 하는 거야」 → «명함 한 장이면» 뺌 · «광고비 · 기간은 문의»
 */
import { Link } from 'react-router-dom'
import { 세기 } from './lib/받은수.jsx'

export default function 광고모집({ 자리 = '' }) {
  return (
    <aside className="adc adc-recruit no-print" aria-label="광고 · 제휴 모집">
      <div className="adc-h"><span className="adc-tag">광고</span><span className="adc-hs">광고주 · 제휴 모집</span></div>
      <div className="adc-b">
        <div className="adc-nm"><span className="adc-ic" aria-hidden="true">📣</span>이 자리에 광고하세요</div>   {/* 📐 G651 «— 광고주 · 제휴 모집» 은 위 띠와 같아 뺌(한 줄 아낌) */}
        <p className="adc-one">공공 공사 입찰하는 업체, 현장 공무 · 소장님들이 매일 보는 자리입니다. 광고비 · 기간은 문의 주시면 안내드리고, 제휴(이용자 할인 · 서로 알리기 · 교육 · 상담 연결) 제안도 받습니다.</p>
        <div className="adc-btns adc-btns1">
          <Link className="adc-call" to="/ad" onClick={() => { try { 세기('|광고문의|모집' + (자리 ? ':' + 자리 : '')) } catch (e) { /* 없음 */ } }}>📣 광고 · 제휴 안내 보기</Link>
        </div>
      </div>
    </aside>
  )
}
