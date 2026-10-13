/**
 * 📑 판 목록 칸 — 넣은 파일마다 «인쇄되는 판(쪽)» 목록: 판 번호 · 도면명 · 종류 · 글자 수 (🧭 G246 — 2026-10-12)
 * 소장님 「캐드를 완벽하게 읽는 도구를 먼저 개발해. 그게 먼저야」 · 「판 그대로 읽기부터」 · 「남은것 시작해」
 *   사람은 도면을 판 단위로 읽음(S-201 · 지하1층 구조평면도) — 프로그램도 판을 먼저 펼쳐, 무엇을 읽었는지 판마다 보여 드림.
 *   모형 공간 판은 lib/판펼치기.js 판목록(골조자동 준비의 도곽 · 판제목), 배치(종이) 공간 판은 배치판목록(배치 탭마다).
 * 🧭 G248 소장님 「읽는 도구 먼저 만들라고 했는데」 · 「다 있는데, 클로드가 못 읽는 거라고」
 *   → 판마다 «읽은 것»(부재 기호 · 일람 · 바닥 두께 · 철근 글) · «물량»(그 판 자리 부재의 콘크리트 · 철근) · 상태(물량 · 정의 · 못 셈 · 밖)
 *   셈은 lib/판쓰임.js — 공사(골조 줄)와 셈(S)을 넘기면 물량 칸이 나옴(없으면 읽은 것만).
 */
import { useMemo } from 'react'
import { 도면종류, 종류이름 } from './lib/도곽3d.js'
import { 판물량, 판상태 } from './lib/판쓰임.js'

const 쉼 = (n) => Number(n || 0).toLocaleString('ko-KR')
const 소 = (n, d = 1) => Number(n || 0).toLocaleString('ko-KR', { minimumFractionDigits: d, maximumFractionDigits: d })
const 종류말 = (이름) => { const k = 도면종류(이름 || ''); return (종류이름[k] || '').replace(/^\S+\s/, '') || '기타' }
const 차례 = (a, b) => String(a.번호 || '~').localeCompare(String(b.번호 || '~'), 'ko', { numeric: true })
const 상태글 = { 물량: '✅ 물량', 정의: '📐 크기 · 철근', 못셈: '⚠ 아직 못 셈', 밖: '— 이 셈 밖' }

/** @param 판 골조읽기(…).읽음.판 — [{파일, k, 판: [{p, 번호, 이름, r, 글수, 쓰임}], 배치판: [{배치, 번호, 이름, 글수, 화면수}], 덜읽음}]
 *  @param 공사 · S (있으면) 골조 공사 · 셈 결과 — 판마다 물량 */
export default function 판목록칸({ 판, 공사 = null, S = null }) {
  const 들 = useMemo(() => (판 || []).filter((f) => f && f.판), [판])
  const 물 = useMemo(() => { try { return 판물량(들, 공사, S) } catch (e) { return new Map() } }, [들, 공사, S])
  if (!들.length) return null
  const 모든 = 들.flatMap((f) => [...f.판, ...(f.배치판 || [])])
  const 번호 = 모든.filter((x) => x.번호).length, 이름 = 모든.filter((x) => x.이름).length
  const 배치수 = 들.reduce((a, f) => a + (f.배치판 || []).length, 0)
  const 판없음 = 들.filter((f) => !f.판.length && !(f.배치판 || []).length).length
  const 상태셈 = { 물량: 0, 정의: 0, 못셈: 0, 밖: 0 }
  const 상태들 = new Map()
  for (const f of 들) for (const x of f.판) { const st = 판상태(x, 물.get(f.파일 + '|' + x.p)); 상태들.set(f.파일 + '|' + x.p, st); 상태셈[st.종류]++ }
  const 물량있음 = 물.size > 0
  return (
    <details className="bim-how rd-chk pan-list">
      <summary>📑 판 목록 — 파일 {들.length}장 · 판 {쉼(모든.length)}장{배치수 ? ` (배치 공간 ${쉼(배치수)})` : ''} (도면번호 {쉼(번호)} · 도면명 {쉼(이름)}){판없음 ? ` · 판 테두리가 없는 파일 ${판없음}장(한 장짜리로 읽음)` : ''}
        {' '}— 물량 {상태셈.물량} · 크기 · 철근 {상태셈.정의}{상태셈.못셈 ? <b className="pan-bad"> · 아직 못 셈 {상태셈.못셈}</b> : null}</summary>
      <div className="muted rd-foot">캐드 파일을 PDF 처럼 판(쪽)마다 나눠 읽습니다. 판마다 도면번호 · 도면명을 표제란에서 찾고, 그 판 안의 글자만 그 판 것으로 봅니다. 배치(종이) 공간에 그린 판은 배치 탭마다 따로 보여 드립니다.
        <br />판마다 <b>읽은 것</b>(부재 기호 · 일람표 · 바닥 두께 · 단면 철근 글)과 <b>물량</b>(그 판에 놓인 부재의 콘크리트 · 철근)을 보여 드립니다. <b>⚠ 아직 못 셈</b> 은 철근 글 · 구조물 그림이 있는데 물량에 아직 안 들어간 판입니다.</div>
      {들.map((f, i) => {
        const 배 = f.배치판 || []
        return (
          <details key={i} className="rd-file rd-all">
            <summary><b>{f.파일}</b> <span className="muted">— 판 {쉼(f.판.length)}장{배.length ? ` · 배치 공간 판 ${쉼(배.length)}장` : ''}{f.덜읽음 ? ' · 도형이 아주 많아 뒤쪽 판은 구조 판만 모양까지 · 나머지는 글자 · 테두리로 읽음' : ''}</span></summary>
            {f.판.length > 0 && (
              <table className="rd-tbl">
                <thead><tr><th>도면번호</th><th>도면명</th><th>종류</th><th>글자</th><th>상태</th><th>읽은 것</th>{물량있음 && <th>콘크리트 ㎥</th>}{물량있음 && <th>철근 t</th>}</tr></thead>
                <tbody>
                  {f.판.slice().sort(차례).map((x) => {
                    const st = 상태들.get(f.파일 + '|' + x.p) || { 종류: '밖', 읽은: '' }
                    const q = 물.get(f.파일 + '|' + x.p)
                    return (
                      <tr key={x.p} className={'pan-' + st.종류}>
                        <td>{x.번호 || <span className="muted">—</span>}</td><td>{x.이름 || <span className="muted">(이름 못 찾음)</span>}</td><td>{종류말(x.이름)}</td><td>{쉼(x.글수)}</td>
                        <td>{상태글[st.종류]}</td><td>{st.읽은 || <span className="muted">—</span>}</td>
                        {물량있음 && <td className="num">{q && q.콘크리트 > 0.05 ? 소(q.콘크리트) : ''}{q && q.버림 > 0.05 ? <span className="muted"> (+버림 {소(q.버림)})</span> : ''}</td>}
                        {물량있음 && <td className="num">{q && q.철근 > 1 ? 소(q.철근 / 1000, 2) : ''}</td>}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
            {배.length > 0 && (
              <table className="rd-tbl pan-lay">
                <thead><tr><th>배치 탭</th><th>도면번호</th><th>도면명</th><th>종류</th><th>글자</th></tr></thead>
                <tbody>
                  {배.map((x, k) => (
                    <tr key={k}><td>{x.배치}</td><td>{x.번호 || <span className="muted">—</span>}</td><td>{x.이름 || <span className="muted">(이름 못 찾음)</span>}</td><td>{종류말(x.이름)}</td><td>{쉼(x.글수)}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
            {!f.판.length && !배.length && <div className="muted">판 테두리(도곽)가 없어 파일 전체를 한 장으로 읽었습니다.</div>}
          </details>
        )
      })}
    </details>
  )
}
