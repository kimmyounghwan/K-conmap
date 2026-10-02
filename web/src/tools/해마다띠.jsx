/**
 * 🗓 해마다 바뀌는 값 띠 — 프로그램 맨 위 한 줄 (G116 · 2026-10-02)
 *   소장님: 「해마다 바뀌는 건 잊지 않게 더 세심하게」
 *   · 이 화면이 쓰는 값이 «몇 년 고시» 인지 · 원문을 언제 열어 봤는지 · 모아 보기(/tools/haemada)
 *   · 셈하는 해의 고시가 아직 표에 없으면(잠정) 노란 띠 — 숨기지 않습니다
 *   · «다음 확인» 날이 지난 값이 있으면(새 고시가 나올 무렵) 알림 한 줄
 */
import { Link } from 'react-router-dom'
import { 점검표, 한국오늘, 긴날 } from '../lib/해마다.js'

export default function 해마다띠({ 키들 = [], 잠정 = '', 해, 글 }) {
  const 쓰는 = 점검표.filter((x) => 키들.includes(x.k))
  const 오늘 = 한국오늘()
  const 지남 = 쓰는.filter((x) => x.다음 <= 오늘)
  const 확인 = 쓰는.reduce((a, x) => (x.확인 < a ? x.확인 : a), '9999-12-31')
  const 경고 = !!잠정 || 지남.length > 0
  return (
    <div className={'hm-band' + (경고 ? ' warn' : '')} role={경고 ? 'status' : undefined}>
      <div>
        📅 {글 || <><b>{해 ? `${해}년` : '올해'} 고시 · 법령 값</b>으로 셉니다</>}
        {쓰는.length > 0 && <> · 원문 확인 {긴날(확인)}</>}
        {' · '}<Link to="/tools/haemada">해마다 바뀌는 값 모아 보기</Link>
      </div>
      {잠정 && <div className="hm-band-w">⚠️ {잠정}</div>}
      {!잠정 && 지남.length > 0 && (
        <div className="hm-band-w">⏰ 새 고시가 나올 무렵입니다 — {지남.map((x) => x.무엇).join(' · ')} 를 원문으로 다시 확인하고 있습니다. 바뀌면 바로 고칩니다.</div>
      )}
    </div>
  )
}
