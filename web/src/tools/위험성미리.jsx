/* ══════════════════════════════════════════════════════════════
   위험성미리.jsx — 서식 페이지(/forms/wih-*)의 미리보기 · 빈 서식 인쇄 (2026-09-29)

   🐛 소장님: 「좀 이상해 봐줘. 위험성평가도 이상해」 — 서식 wih-* 의 미리보기 자리에
      «이 서식은 tools/wihgen.py 가 굽습니다.» 라는 «만든 사람 메모» 가 그대로 나왔고,
      🖨 인쇄를 누르면 그 메모가 찍힌 화면이 인쇄됐습니다.
   → 미리보기 = 서식과 같은 칸의 «예문 종이»(tools/위험성종이.jsx) · 인쇄 = «빈 서식» A4 (손으로 쓸 것)
     · 프로그램(/tools/risk)으로 바로 쓰는 길. Forms.jsx 가 wih-* 일 때만 늦게 불러옵니다(lazy).
   🖼 G604(11-08) 빈 서식도 PDF · 인쇄는 그림 — 위험성평가 도구(G587 pages/RiskBook.jsx)와 같은 쪽(가로 rk가로 281 × 194 · 세로 rk세로 186 × 273 · 칸줄).
   ══════════════════════════════════════════════════════════════ */
import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { use그림인쇄 } from './그림인쇄훅.js'   /* 🖼 G604 빈 서식 PDF · 인쇄는 그림(글자 층 없음) */
import { 종이 } from './위험성종이.jsx'
import { 종류, 빈서류, 풀기, 예시책 } from '../lib/위험성.js'

export const 서식종류 = { 'wih-choego': ['1'], 'wih-susi': ['2m', '2w', '2d'], 'wih-hoeui': ['3'], 'wih-gyoyuk': ['4'], 'wih-seonggwa': ['5'] }

function 빈종이(k) {
  const j = { ...빈서류(k), d: '', who: '' }
  if (k === '1') j.rows = []
  if (k.startsWith('2')) { j.p1 = ''; j.p2 = ''; j.site = ''; j.rows = [] }
  if (k === '3' || k === '4') { j.people = []; j.place = '' }
  if (k === '5') { j.site = ''; j.ym = ''; j.rows = [] }
  return j
}

export default function 위험성미리({ slug }) {
  const 종류들 = 서식종류[slug] || []
  const [k, setK] = useState(종류들[0])
  const 예 = useMemo(() => {
    const x = 예시책()
    const o = {}
    for (const v of Object.values(x.자료.docs)) o[v.k] = 풀기(v.k, v.j)
    return o
  }, [])
  /* 🖼 G604 (2026-11-08) 소장님 «엑셀은 그대로 · PDF 는 모두 그림» — 빈 서식 판(#gp-인쇄 .rk-쪽)을 그림으로 찍어 📄 PDF 바로 받기 · 🖨 그림만 인쇄 · 숨은 누적 |위험성빈서식|PDF · 인쇄 */
  const K0 = 종류[k] || {}
  const 그 = use그림인쇄(`${K0.별지 || ''}_${K0.짧게 || ''}_빈서식`, K0.가로
    ? { 셈: '위험성빈서식', 쪽: { 폭: 281, 높: 194 }, 여백: [8, 8], 종이: [297, 210], 판쪽: 'rk가로', 칸줄: true }
    : { 셈: '위험성빈서식', 쪽: { 폭: 186, 높: 273 }, 여백: [12, 12], 종이: [210, 297], 판쪽: 'rk세로', 칸줄: true })
  if (!k) return null
  const K = 종류[k]
  return (
    <div className="card">
      <div className="eq-bar" style={{ marginBottom: 6 }}>
        <span className="sec-title" style={{ margin: 0 }}>미리보기 <span className="count">· ✍ 작성 예시(지어낸 현장)</span></span>
        {종류들.length > 1 && 종류들.map((x) => (
          <button key={x} className={'btn sm ' + (x === k ? '' : 'ghost')} onClick={() => setK(x)}>{종류[x].짧게}</button>
        ))}
      </div>
      <div className="rk-preview"><종이 k={k} j={예[k]} /></div>
      <div className="btn-row" style={{ marginTop: 10, flexWrap: 'wrap' }}>
        <Link className="btn primary" to="/tools/risk">✍️ 프로그램으로 쓰기</Link>
        <button className="btn ghost" disabled={!!그.찍기} onClick={() => 그.PDF()}>{그.찍기 === 'pdf' ? 'PDF 만드는 중…' : `📄 빈 서식 PDF (${K.가로 ? 'A4 가로' : 'A4 세로'})`}</button>
        <button className="btn ghost" disabled={!!그.찍기} onClick={() => 그.인쇄()}>{그.찍기 === '인쇄' ? '준비 중…' : '🖨 인쇄'}</button>
      </div>
      {그.말 && <div className="note sm wih-찍말" role="status" style={{ marginTop: 8 }}>{그.말}</div>}
      <div className="note sm" style={{ marginTop: 8 }}>
        위 작성 예시는 지어낸 현장 · 사람입니다(위험성평가 프로그램의 «👀 예시로 해 보기» 와 같은 예시). <b>빈 서식 PDF · 인쇄</b>는 칸만 있는 종이 — 손으로 쓸 때. 내려받은 엑셀의 맨 윗줄 K-건설맵 표시는
        <b> 1행을 지우면 없어집니다</b> (마우스 오른쪽 → 행 삭제).
      </div>
      {그.판 && createPortal(<div id="gp-인쇄"><div className={'rk-쪽 ' + (K.가로 ? 'land' : 'port')}><종이 k={k} j={빈종이(k)} /></div></div>, document.body)}
    </div>
  )
}
