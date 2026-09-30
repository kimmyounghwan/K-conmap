/* 🏷 공고 유형 태그 — 거르개 · 카드 딱지 (2026-09-30)
   소장님: 입찰나라에서 가져올 것 «공고유형 태그 거르개» · 「편리성, 기능성 유지하면서」 · 「핸드폰에서도 편리하게」

   ■ 태그 이름 · 비트 · 무리는 data/공고유형.json 한 곳 — collect.py(tag_of) · fast.py 가 같은 파일로 비트를 매깁니다.
     화면은 색인 한 줄의 tg(비트 합)만 봅니다. 공고명으로 짐작하지 않습니다(«긴급» 한 가지만 이름에서 — 조달청 칸이 없음).
   ■ 고르는 법
     · 같은 무리 안(공고 종류 · 계약 방법 · 낙찰 방법)은 «또는» — 수의계약 + 제한경쟁 = 둘 중 하나
     · 무리끼리는 «그리고» — 제한경쟁 + 적격심사 = 둘 다
     · «조건» 무리(지역제한 · A값 · 단일예가)는 무리 안에서도 «그리고»
     · «취소공고 빼기» 하나만 «빼기» 알약입니다(음수로 적어 둡니다)
   ■ 편리함을 지키려고
     · 금액 · 공동도급과 같은 줄(.fbar)에 알약 하나로 접어 둡니다 — 펼치기 전엔 자리를 안 차지합니다.
     · 알약 옆에 7주 전체 건수를 적고, 0건인 알약은 숨깁니다(눌러도 빈 목록이 되지 않게).
     · 걸어 둔 것은 접은 채로도 알약 글에 보입니다.
   ■ ▦ 표 모양(2026-09-30 소장님 「이걸 좀 더 깔끔하게 할 수 없을까?」 → «표 모양 한 줄씩»)
     · 무리 한 줄: 왼쪽 이름 · 오른쪽 알약. «고른 것 중 하나/모두» 글은 이름에 대면 뜨는 풀이로, 긴 설명은 맨 아래 한 줄로.
     · 알약 글: 넓은 화면은 원래 이름 그대로 · 📱 손전화(520px 아래)만 줄 이름이 말해 주는 만큼 줄임(변경공고 → 변경 · 수의계약 → 수의).
       (소장님 «PC 원래 이름 · 폰 짧게» — 두 글을 다 그리고 CSS 로 하나만 보입니다: .tgl 원래 · .tgs 짧게)
       접은 알약의 글(유형글)은 어디서나 원래 이름 — 어느 줄 것인지 안 보이는 자리라서.
     · 📱 손전화: 이름 아래 알약 한 줄을 옆으로 밉니다(공고판 지역 알약과 같은 .chips).
     · «취소공고 빼기» 는 점선 알약 «⊘ 취소 빼기» — 거르는 알약과 모양으로 가릅니다. */
import { useState } from 'react'
import 표 from './data/공고유형.json'
import { 유형맞나 as 맞나, 유형글 as 글로 } from './lib/유형.js'

export const 유형무리 = 표.무리
const 취소 = 4

/** tg(비트 합) 가 고른 것에 맞나 — 판정은 lib/유형.js 한 곳 */
export const 유형맞나 = (tg, 고른) => 맞나(tg, 고른, 표.무리)
export const 유형글 = (고른) => 글로(고른, 표.무리)

/* 📱 손전화 표 안에서만 쓰는 짧은 이름 — 줄 이름(공고 종류 · 계약 방법 …)이 앞에 있어 뜻이 그대로입니다 */
const 짧게 = { 2: '변경', 4: '취소', 16: '수의', 32: '제한', 64: '일반', 128: '지명',
  512: '최저가·하한율', 1024: '수의시담·견적', 4096: 'A값' }

export function 유형거르개({ 값, set값, 건수 }) {
  const [열림, set열림] = useState(false)
  const 고른 = Array.isArray(값) ? 값 : []
  const cnt = 건수 || null
  const 누름 = (b) => {
    let v = 고른.includes(b) ? 고른.filter((x) => x !== b) : [...고른, b]
    if (b === 취소) v = v.filter((x) => x !== -취소)          // 취소공고만 ↔ 취소공고 빼기는 함께 못 겁니다
    if (b === -취소) v = v.filter((x) => x !== 취소)
    set값(v)
  }
  const 글 = 유형글(고른)
  return (
    <div className="amtbar">
      <button className={'chip' + (고른.length ? ' on' : '')} onClick={() => set열림((v) => !v)}>
        🏷 유형{글 ? ` · ${글}` : ''} {열림 ? '▲' : '▼'}
      </button>
      {고른.length > 0 && <button className="chip" onClick={() => set값([])}>지우기 ✕</button>}
      {열림 && (
        <div className="amtbox tagbox">
          {표.무리.map((g) => {
            const 보일 = g.태그.filter((t) => !cnt || (cnt[String(t.b)] || 0) > 0 || 고른.includes(t.b))
            if (!보일.length) return null
            return (
              <div key={g.이름} className="tagg">
                <div className="tagh" title={g.합 === 'and' ? '이 줄은 고른 것 모두' : '이 줄은 고른 것 중 하나'}>{g.이름}</div>
                <div className="chips">
                  {보일.map((t) => (
                    <button key={t.b} type="button" className={'chip' + (고른.includes(t.b) ? ' on' : '')}
                      title={t.n} onClick={() => 누름(t.b)}>
                      {짧게[t.b] ? <><span className="tgl">{t.n}</span><span className="tgs">{짧게[t.b]}</span></> : t.n}{cnt && cnt[String(t.b)] ? <em className="licn"> {cnt[String(t.b)].toLocaleString('ko-KR')}</em> : null}
                    </button>
                  ))}
                  {g.태그.some((t) => t.b === 취소) && (
                    <button type="button" className={'chip neg' + (고른.includes(-취소) ? ' on' : '')}
                      title="취소공고 빼기" onClick={() => 누름(-취소)}>⊘ <span className="tgl">취소공고 빼기</span><span className="tgs">취소 빼기</span></button>
                  )}
                </div>
              </div>
            )
          })}
          <div className="tagfoot">
            숫자는 7주 건수 · 같은 줄은 «또는», 줄끼리는 «그리고»(조건 줄은 «모두») ·
            조달청이 공고에 적어 준 값으로 거릅니다(«긴급» 만 공고명에서)
          </div>
        </div>
      )}
    </div>
  )
}

/** 카드 딱지 — 재공고 · 변경 · 취소 · 긴급 (눈에 띄어야 할 넷만) */
const 딱지 = [[취소, '취소', 'r'], [2, '변경', 'w'], [1, '재공고', 'b'], [8, '긴급', 'r']]
export function 유형딱지({ r }) {
  const t = Number(r && r.tg) || 0
  if (!(t & 15)) return null
  return 딱지.filter(([b]) => t & b).map(([b, n, tone]) => (
    <span key={b} className={'badge ' + tone}>{n}</span>
  ))
}
