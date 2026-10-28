/**
 * 📋 받기 전 검사 창 — 엑셀을 받기 전에 한 번 더 셈해 본 결과 (G442 · 2026-10-28)
 *   통과 → 이미 받았고 아래에 작은 알림 «✓ n가지 모두 통과 · 받았습니다»(화면을 막지 않음 · 누르면 무엇을 봤는지)
 *   못 통과 → 화면 가운데 창: 어느 것이 왜인지 · «⬇ 알고 받기» 를 눌러야 받음
 *   소장님 2026-10-25 «도면 물량이 나와서 바로 다운 받는 게 아니라 한 번 더 시험을 거치고 다운받게» · «못 통과하면 … 알려주고 받게 해야지»
 */
/** 📋 G444 엑셀 바이트 → 내려받기(골조 수량산출 · 마감 · 도면 물량 자동 · BIM 물량이 같이 씀) */
export function 엑셀내려주기(바이트, 이름) {
  if (!바이트) return
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([바이트], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
  a.download = 이름
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 60000)
}

export default function 받기검사판({ 검사, 닫기, 받기 }) {
  if (!검사) return null
  const 틀린 = 검사.줄.filter((x) => !x.됨)
  const 목록 = <ul className="gmd-xlchk-list">{(틀린.length ? [...틀린, ...검사.줄.filter((x) => x.됨)] : 검사.줄).map((x, i) => <li key={i} className={x.됨 ? 'ok' : 'bad'}><span>{x.됨 ? '✓' : '✗'}</span> {x.글}</li>)}</ul>
  if (검사.통과) {
    return (
      <div className="gmd-xlchk-toast" role="status">
        <details>
          <summary><b>📋 받기 전 검사 {검사.줄.length}가지 모두 통과 · 받았습니다</b></summary>
          <small className="muted">{검사.이름}</small>
          {목록}
        </details>
        <button type="button" className="gmd-x" onClick={닫기} aria-label="닫기">✕</button>
      </div>
    )
  }
  return (
    <div className="gmd-xlchk" role="dialog" aria-label="엑셀 받기 전 검사" onClick={(e) => { if (e.target === e.currentTarget) 닫기() }}>
      <div className="gmd-xlchk-box">
        <b className="gmd-xlchk-h bad">📋 받기 전 검사 — {검사.알고 ? `못 통과 ${틀린.length}가지를 알고 받았습니다` : `${검사.줄.length}가지 중 ${틀린.length}가지 못 통과`}</b>
        <small className="muted">{검사.이름}</small>
        {목록}
        <small className="gmd-warn">못 통과한 것은 엑셀 맨 앞 «검사 결과» 시트에도 적힙니다.{검사.알고 ? '' : ' 확인하신 뒤 받으십시오.'}</small>
        <div className="gmd-xlchk-btns">
          {!검사.알고 && 검사.바이트 && <button type="button" className="btn" onClick={받기}>⬇ 알고 받기</button>}
          <button type="button" className="btn line" onClick={닫기}>{검사.알고 ? '닫기' : '받지 않기'}</button>
        </div>
      </div>
    </div>
  )
}
