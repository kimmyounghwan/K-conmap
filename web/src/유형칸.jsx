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
     · 걸어 둔 것은 접은 채로도 알약 글에 보입니다. */
import { useState } from 'react'
import 표 from './data/공고유형.json'
import { 유형맞나 as 맞나, 유형글 as 글로 } from './lib/유형.js'

export const 유형무리 = 표.무리
const 취소 = 4

/** tg(비트 합) 가 고른 것에 맞나 — 판정은 lib/유형.js 한 곳 */
export const 유형맞나 = (tg, 고른) => 맞나(tg, 고른, 표.무리)
export const 유형글 = (고른) => 글로(고른, 표.무리)

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
                <div className="muted sm tagh">{g.이름}<span>{g.합 === 'and' ? ' · 고른 것 모두' : ' · 고른 것 중 하나'}</span></div>
                <div className="chips wrap">
                  {보일.map((t) => (
                    <button key={t.b} type="button" className={'chip' + (고른.includes(t.b) ? ' on' : '')}
                      onClick={() => 누름(t.b)}>
                      {t.n}{cnt && cnt[String(t.b)] ? <em className="licn"> {cnt[String(t.b)].toLocaleString('ko-KR')}</em> : null}
                    </button>
                  ))}
                  {g.태그.some((t) => t.b === 취소) && (
                    <button type="button" className={'chip' + (고른.includes(-취소) ? ' on' : '')}
                      onClick={() => 누름(-취소)}>취소공고 빼기</button>
                  )}
                </div>
              </div>
            )
          })}
          <div className="note sm">
            조달청이 공고에 적어 준 <b>공고 종류 · 계약 방법 · 낙찰 방법 · 지역제한 · A값 · 예정가격 방식</b>으로 거릅니다
            («긴급» 만 공고명에서 봅니다). 옆 숫자는 7주 전체 건수입니다.
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
