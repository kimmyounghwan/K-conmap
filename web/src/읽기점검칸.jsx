/**
 * 🔎 읽기 점검 칸 — 넣은 파일마다 «도형 종류별 개수 · 읽음 · 못 읽음(까닭)» (🧭 G245 — 2026-10-11)
 * 소장님 「캐드만 확실히 읽으면 돼」 · 「1번 부터 시작해」 — 무엇을 몇 개 못 읽었는지 숨기지 않고 보여 드림. 셈은 lib/읽기점검.js
 */
import { useMemo } from 'react'
import { 점검표 } from './lib/읽기점검.js'

const 쉼 = (n) => Number(n || 0).toLocaleString('ko-KR')

/** @param 들 [{모델, 이름}] — 골조도면 도면읽기 결과(모델.stats · 모델.원본) */
export default function 읽기점검칸({ 들 }) {
  const 표들 = useMemo(() => (들 || []).filter((d) => d && d.모델 && d.모델.stats).map((d) => ({ 이름: d.이름, ...점검표(d.모델.stats, d.모델.원본 || null) })), [들])
  if (!표들.length) return null
  const 전체 = 표들.reduce((a, t) => a + t.합.전체, 0), 못 = 표들.reduce((a, t) => a + t.합.못, 0), 빠짐 = 표들.reduce((a, t) => a + t.빠짐.length, 0)
  return (
    <details className="bim-how rd-chk">
      <summary>🔎 읽기 점검 — 파일 {표들.length}장 · 도형 {쉼(전체)}개 중 {못 ? <b className="rd-bad">못 읽음 {쉼(못)}개</b> : '못 읽은 것 없음'}{빠짐 ? <b className="rd-bad"> · DWG 바꾸며 빠진 종류 {빠짐}</b> : ''}</summary>
      {표들.map((t, i) => (
        <div key={i} className="rd-file">
          <div><b>{t.이름}</b> <span className="muted">— {t.글}</span></div>
          {t.줄.filter((z) => z.상태 !== '읽음').length > 0 && (
            <ul>
              {t.줄.filter((z) => z.상태 !== '읽음').sort((a, b) => (a.상태 === '못 읽음' ? -1 : 1) - (b.상태 === '못 읽음' ? -1 : 1)).map((z) => (
                <li key={z.종류}><span className={z.상태 === '못 읽음' ? 'rd-bad' : 'muted'}>{z.상태 === '못 읽음' ? '✗' : '·'} {z.이름} {쉼(z.수)}개 — {z.상태}</span><span className="muted"> · {z.까닭}</span></li>
              ))}
            </ul>
          )}
          {t.뺌.length > 0 && <ul>{t.뺌.map((w, j) => <li key={j} className="muted">{w}</li>)}</ul>}
          <details className="rd-all"><summary className="muted">종류별 전부 보기</summary>
            <table className="rd-tbl"><thead><tr><th>종류</th><th>개수</th><th>읽기</th></tr></thead>
              <tbody>{t.줄.map((z) => <tr key={z.종류}><td>{z.이름}</td><td>{쉼(z.수)}</td><td className={z.상태 === '못 읽음' ? 'rd-bad' : ''}>{z.상태}</td></tr>)}</tbody>
            </table>
          </details>
        </div>
      ))}
      <div className="muted rd-foot">개수는 파일 속(블록 정의 안까지) 도형 수입니다. «셀 것 없음» 은 읽었지만 길이 · 넓이 · 글자가 없는 것(가림막 · 화면틀)입니다.</div>
    </details>
  )
}
