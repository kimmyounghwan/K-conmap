/**
 * 🎨 두 줄 글자색 — 2줄 변경내역서 · 변경 원가계산서 · 총괄표의 «위 줄(당초)» · «아래 줄(변경)» 을 검정 / 빨강으로
 *   (G131 · 2026-10-05 — 소장님 「두 줄변경에서 검정색과 빨간색을 지정할 수 있도록 해줘 첫째 빨강, 검정, 둘째 빨강, 검정 클릭하면 변경 되게」
 *    → 고른 안: 칩 + 미리보기 · 줄 전체(품명 · 규격 · 단위 · 숫자) · 원 내역서 설계변경 + 설계변경 작업대 둘 다)
 * ■ 칩을 누르거나, 미리보기 줄을 누르면 검정 ↔ 빨강. 고른 색은 이 기기에 남고 두 쪽(/change/won · /change/work)이 같이 씁니다.
 * ■ 1줄 내역서는 늘 검정. 증(+) 파랑 · 확인(노랑) 칸은 그대로.
 * ■ 엑셀 쪽: lib/변경엑셀쓰기.js 색꼴 · 색맞춤 — 내역시트 · 총괄시트 · 원가시트가 { 색 } 을 받습니다.
 */
import { useState } from 'react'

const 키 = 'kcm.duline.v1'
export const 처음색 = { 위: '검', 아래: '빨' }

export function 색읽기() {
  try {
    const v = JSON.parse(localStorage.getItem(키) || 'null')
    if (v && (v.위 === '검' || v.위 === '빨') && (v.아래 === '검' || v.아래 === '빨')) return { 위: v.위, 아래: v.아래 }
  } catch { /* 지나감 */ }
  return { ...처음색 }
}
function 색쓰기(v) { try { localStorage.setItem(키, JSON.stringify(v)) } catch { /* 지나감 */ } }

/** 페이지에서: const [색, set색] = 두줄색상태() */
export function 두줄색상태() {
  const [색, set] = useState(색읽기)
  const set색 = (f) => set((v) => { const n = typeof f === 'function' ? f(v) : f; 색쓰기(n); return n })
  return [색, set색]
}

const 이름 = { 검: '검정', 빨: '빨강' }
const 뒤집 = (c) => (c === '빨' ? '검' : '빨')

export default function 두줄색({ 색, set색, 보기 = null }) {
  const 줄 = (자리, 글) => (
    <div className="dc-row">
      <span className="dc-lab">{글}</span>
      <div className="dc-chips" role="radiogroup" aria-label={글 + ' 글자색'}>
        {['검', '빨'].map((c) => (
          <button key={c} type="button" role="radio" aria-checked={색[자리] === c}
                  className={'dc-chip' + (색[자리] === c ? ' on' : '')} onClick={() => set색((v) => ({ ...v, [자리]: c }))}>
            <i className={'dc-dot dc-' + c} aria-hidden="true" />{이름[c]}
          </button>
        ))}
      </div>
    </div>
  )
  const 예 = 보기 || { 품명: '터파기', 규격: '토사', 단위: '㎥', 위: ['1,250', '2,350', '2,937,500'], 아래: ['1,400', '2,350', '3,290,000'] }
  return (
    <div className="dc">
      <div className="dc-title">두 줄 글자색 <span className="muted">— 위 줄 = 당초 · 아래 줄 = 변경</span></div>
      {줄('위', '위 줄(당초)')}
      {줄('아래', '아래 줄(변경)')}
      <div className="dc-paper" role="group" aria-label="미리보기 — 줄을 누르면 검정 ↔ 빨강">
        <button type="button" className={'dc-line dc-t-' + 색.위} onClick={() => set색((v) => ({ ...v, 위: 뒤집(v.위) }))}
                aria-label={'위 줄 ' + 이름[색.위] + ' — 누르면 ' + 이름[뒤집(색.위)]}>
          <span className="dc-n">{예.품명}</span><span className="dc-s">{예.규격}</span><span className="dc-u">{예.단위}</span>
          {예.위.map((x, k) => <span key={k} className="dc-v">{x}</span>)}
        </button>
        <button type="button" className={'dc-line dc-low dc-t-' + 색.아래} onClick={() => set색((v) => ({ ...v, 아래: 뒤집(v.아래) }))}
                aria-label={'아래 줄 ' + 이름[색.아래] + ' — 누르면 ' + 이름[뒤집(색.아래)]}>
          <span className="dc-n" /><span className="dc-s" /><span className="dc-u" />
          {예.아래.map((x, k) => <span key={k} className="dc-v">{x}</span>)}
        </button>
      </div>
      <div className="muted dc-tip">줄을 눌러도 바뀝니다 · 품명 · 규격 · 숫자까지 줄 전체 · 1줄 내역서는 늘 검정</div>
    </div>
  )
}
