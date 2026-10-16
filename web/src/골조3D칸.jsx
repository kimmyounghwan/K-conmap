/**
 * 🧊 골조 수량산출 ④ 결과 안의 3D (2026-10-16)
 *
 * 소장님: 「골조는 왜 3D가 없지?」 · 「3d로 나오고 그 부분을 클릭하면 물량이 나오는 거 아니였어?」 · 「최대한 사용하기 편하게」
 *   → 고르심 (가) 「골조 물량 화면 안에 3D — 부재를 누르면 그 부재 물량, 표 줄을 누르면 3D 에서 그 부재가 파랗게」
 * ■ ⚡ 도면을 넣어 자동으로 읽은 때만(읽은 도면 · 골조 = BIM 물량 화면과 같은 lib/BIM모델.js 모델만들기 · 같은 3D lib/bim3d.js).
 * ■ 부재 물량 = 이 화면 ④ 결과의 셈(지금 적힌 공사) — 사람이 줄을 더하거나 빼서 줄 차례가 읽은 것과 다르면 «읽은 값» 으로 셈(말함).
 * ■ 산출서 줄을 누르면(짚음) 그 줄에서 나온 부재가 3D 에서 파랗게 · 다가감.
 * 📊 세기(안 보임): |골조|3D열기 · |골조|3D부재 · |골조|3D묶음
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { 모델만들기, 부재물량, 크기글, 높이글, 종류들, 종류색 } from './lib/BIM모델.js'
import { 플랜트모델 } from './lib/플랜트기초.js'
import { 셈 } from './lib/골조.js'
import { 부재보기 } from './lib/bim3d.js'
import { 세기 } from './lib/받은수.jsx'

const 쉼 = (n, d = 0) => (Number.isFinite(n) ? Number(n).toLocaleString('ko-KR', { maximumFractionDigits: d, minimumFractionDigits: d }) : '—')
const 층말 = (n) => (n === 'FT' ? '기초' : /^B\d+$/i.test(n) ? '지하' + n.slice(1) + '층' : n === 'R' ? '지붕' : n + '층')
const 층차례 = (n) => (n === 'FT' ? -100 : /^B(\d+)$/i.test(n) ? -Number(n.slice(1)) : n === 'R' ? 1000 : Number.isFinite(+n) ? +n : 500)
const 색글 = (c) => 'rgb(' + c.map((v) => Math.round(v * 255)).join(',') + ')'
const 종이름 = { 기초: '기초', 기둥: '기둥', 벽: '벽', 보: '보', 슬라브: '슬래브', 계단: '계단' }
const 어두움 = () => { try { return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches } catch (e) { return false } }
/** 줄 수가 같은가(표마다) — 사람이 줄을 더하거나 빼지 않았나 */
const 같은꼴 = (a, b) => {
  const A = a && a.동 && a.동[0] && a.동[0].주자료, B = b && b.동 && b.동[0] && b.동[0].주자료
  if (!A || !B) return false
  const ks = new Set([...Object.keys(A), ...Object.keys(B)])
  for (const k of ks) if ((Array.isArray(A[k]) ? A[k].length : 0) !== (Array.isArray(B[k]) ? B[k].length : 0)) return false
  return true
}

export default function 골조3D칸({ 들, R, 공사, 짚음 = null }) {
  const [열림, set열림] = useState(true)
  const 판Ref = useRef(null)
  const 보기Ref = useRef(null)
  const [glErr, setGlErr] = useState('')
  const [끔, set끔] = useState(() => new Set())
  const [층만, set층만] = useState('')
  const [선택, set선택] = useState(null)
  const [묶음, set묶음] = useState(null)     // {글, ids:Set}
  const 처음 = useRef(true)

  const 모델 = useMemo(() => {
    if (!들 || !R || !R.있음) return null
    try { return 플랜트모델(모델만들기(들, R, {}), R) } catch (e) { return { 부재: [], 층: [], 경고: ['3D 로 세우다 멈췄습니다: ' + e.message] } }
  }, [들, R])
  const 지금공사 = 같은꼴(공사, R && R.공사)
  const 쓸공사 = 지금공사 ? 공사 : R && R.공사
  const S = useMemo(() => { if (!쓸공사) return null; try { return 셈(쓸공사) } catch (e) { return null } }, [쓸공사])
  const Q = useMemo(() => (모델 && S ? 부재물량(모델, S, 쓸공사) : null), [모델, S, 쓸공사])
  const 부재표 = useMemo(() => new Map((모델 ? 모델.부재 : []).map((o) => [o.id, o])), [모델])
  const 있는종류 = useMemo(() => 종류들.filter((k) => 모델 && 모델.부재.some((o) => o.종류 === k)), [모델])
  const 층들 = useMemo(() => [...new Set((모델 ? 모델.부재 : []).map((o) => o.층))].sort((a, b) => 층차례(a) - 층차례(b)), [모델])
  const 보이는 = useMemo(() => (모델 ? 모델.부재.filter((o) => !끔.has(o.종류) && (!층만 || o.층 === 층만) && !o.자리짐작) : []), [모델, 끔, 층만])

  useEffect(() => {
    if (!열림 || !판Ref.current || !모델 || !모델.부재.length) return
    if (!보기Ref.current) {
      try { 보기Ref.current = new 부재보기(판Ref.current) } catch (e) { setGlErr('이 브라우저는 3D(WebGL)를 그리지 못합니다 — 산출서 · 엑셀은 그대로 쓸 수 있습니다.'); return }
      if (어두움()) { const v0 = 보기Ref.current; v0.bg = [0.086, 0.102, 0.129]; v0.bgT = [0.15, 0.17, 0.21]; v0.bgB = [0.06, 0.07, 0.09]; v0.선색 = [0.03, 0.04, 0.05]; v0.선알 = 0.6 }
      처음.current = true
    }
    const v = 보기Ref.current
    /* 보 · 기둥 · 벽 윗면은 슬래브 윗면과 같은 높이라 겹친 면이 깜빡임 → 그림에서만 3 mm 낮춤(물량은 그대로) — BIM 물량 화면과 같음 */
    v.set부재(보이는.map((o) => ({ id: o.id, 판: o.판, z0: o.z0, z1: o.종류 === '슬라브' || o.종류 === '기초' ? o.z1 : o.z1 - 3, 색: 종류색[o.종류] })), { 바닥: true, 바닥색: 어두움() ? [0.16, 0.18, 0.22] : [0.86, 0.88, 0.90] })
    if (처음.current) { v.fit('tilt'); 처음.current = false }
    v.set고름(선택 !== null ? [선택] : 묶음 ? [...묶음.ids] : [])
    v.onPick = (id) => { if (id >= 0) { set선택(id); set묶음(null); 세기('|골조|3D부재') } else set선택(null) }
  }, [열림, 모델, 보이는])   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (보기Ref.current) 보기Ref.current.set고름(선택 !== null ? [선택] : 묶음 ? [...묶음.ids] : []) }, [선택, 묶음])
  useEffect(() => { if (!열림 && 보기Ref.current) { 보기Ref.current.dispose(); 보기Ref.current = null } }, [열림])
  useEffect(() => () => { if (보기Ref.current) { 보기Ref.current.dispose(); 보기Ref.current = null } }, [])
  /* ④ 결과의 산출서 줄을 누르면 — 그 줄에서 나온 부재를 파랗게 · 다가감 */
  useEffect(() => {
    if (!짚음 || !모델 || 짚음.동 > 0) return
    const ids = 모델.부재.filter((o) => o.표 === 짚음.표 && o.i === 짚음.i).map((o) => o.id)
    if (!ids.length) return
    const o = 부재표.get(ids[0])
    set선택(ids.length === 1 ? ids[0] : null)
    set묶음(ids.length > 1 ? { 글: (o ? 층말(o.층) + ' ' + 종이름[o.종류] + ' ' + (o.몸 || o.기호 || '') : '') + ' — 산출서 ' + (짚음.i + 1) + '번 줄', ids: new Set(ids) } : null)
    if (o && 층만 && o.층 !== 층만) set층만('')
    setTimeout(() => { if (보기Ref.current) 보기Ref.current.보기로(ids, 8) }, 60)
  }, [짚음, 모델])   // eslint-disable-line react-hooks/exhaustive-deps

  if (!모델) return null
  if (!모델.부재.length) return <div className="card no-print"><div className="dx3-warn" style={{ marginTop: 0 }}>🧊 3D — 읽은 골조를 3D 로 세우지 못했습니다{모델.경고 && 모델.경고.length ? ' (' + 모델.경고[0] + ')' : ''}.</div></div>

  const 묶음고르기 = (글, 맞음) => {
    const ids = new Set(모델.부재.filter(맞음).map((o) => o.id))
    set선택(null); set묶음(ids.size ? { 글, ids } : null); 세기('|골조|3D묶음')
    if (보기Ref.current && ids.size) 보기Ref.current.보기로([...ids])
  }
  const 고른 = 선택 !== null ? 부재표.get(선택) : null
  const 고른물량 = 고른 && Q ? Q.부재.get(고른.id) : null
  const 묶음합 = 묶음 && Q ? [...묶음.ids].reduce((a, id) => { const q = Q.부재.get(id); if (q) { a.콘크리트 += q.콘크리트; a.거푸집 += q.거푸집; a.철근 += q.철근 } return a }, { 콘크리트: 0, 거푸집: 0, 철근: 0 }) : null

  return (
    <div className="card no-print gz3-card">
      <button type="button" className="mb-head" onClick={() => { set열림((v) => !v); if (!열림) 세기('|골조|3D열기') }} aria-expanded={열림}>
        <span className="mb-title">🧊 3D 로 보기 — 부재 <b>{모델.부재.length}</b>개</span>
        <span className="mb-sum">부재를 누르면 그 부재 물량 · 아래 산출서 줄을 누르면 3D 에서 파랗게</span>
        <span className="mb-open">{열림 ? '접기 ▲' : '펼치기 ▼'}</span>
      </button>
      {열림 && (
        <>
          {!지금공사 && <div className="mb-warn" style={{ marginTop: 6 }}>ℹ️ ③ 주자료에 줄을 더하거나 빼서 도면에서 읽은 줄과 차례가 달라졌습니다 — 3D 의 부재 물량은 <b>도면에서 읽은 값</b>으로 셉니다.</div>}
          <div className="bim-tool">
            <span className="bim-chips">
              {있는종류.map((k) => (
                <button key={k} type="button" className={'bim-chip' + (끔.has(k) ? ' off' : '')} onClick={() => set끔((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n })}>
                  <i style={{ background: 색글(종류색[k]) }} />{종이름[k]}
                </button>
              ))}
            </span>
            {층들.length > 1 && (
              <select value={층만} onChange={(e) => set층만(e.target.value)} aria-label="층 고르기">
                <option value="">모든 층</option>
                {층들.map((n) => <option key={n} value={n}>{층말(n)}만</option>)}
              </select>
            )}
            <span className="bim-views">
              <button type="button" className="btn line sm" onClick={() => 보기Ref.current && 보기Ref.current.fit('tilt')}>↗ 기울여</button>
              <button type="button" className="btn line sm" onClick={() => 보기Ref.current && 보기Ref.current.fit('top')}>⬇ 위</button>
              <button type="button" className="btn line sm" onClick={() => 보기Ref.current && 보기Ref.current.fit('front')}>▭ 앞</button>
            </span>
          </div>
          <div className="bim-view">
            <div className="bim-canvas gz3-canvas">
              {glErr ? <div className="dx3-warn" style={{ margin: 12 }}>{glErr}</div> : <canvas ref={판Ref} />}
              <div className="bim-hint">끌기 = 돌리기 · 오른쪽 끌기(두 손가락) = 옮기기 · 휠(벌리기) = 확대 · <b>누르기 = 물량</b></div>
            </div>
            <div className="bim-side">
              {고른 ? (
                <div>
                  <div className="bim-title"><i style={{ background: 색글(종류색[고른.종류]) }} />{층말(고른.층)} {종이름[고른.종류]} <b>{고른.몸 || 고른.기호}</b></div>
                  <table className="bim-kv"><tbody>
                    <tr><th>크기(mm)</th><td>{크기글(고른)}</td></tr>
                    <tr><th>높이</th><td>{높이글(고른.z0)} ~ {높이글(고른.z1)} mm</td></tr>
                    <tr><th>3D 부피</th><td>{쉼(고른.부피, 3)} ㎥</td></tr>
                  </tbody></table>
                  {고른물량 && (
                    <>
                      <div className="bim-sub">산출서 물량 (이 부재 몫)</div>
                      <table className="bim-kv"><tbody>
                        <tr><th>콘크리트</th><td><b>{쉼(고른물량.콘크리트, 3)}</b> ㎥</td></tr>
                        <tr><th>거푸집</th><td><b>{쉼(고른물량.거푸집, 2)}</b> ㎡</td></tr>
                        <tr><th>철근</th><td><b>{쉼(고른물량.철근, 1)}</b> kg <span className="muted">{Object.entries(고른물량.규격).map(([g, v]) => g + ' ' + 쉼(v, 1)).join(' · ')}</span></td></tr>
                      </tbody></table>
                    </>
                  )}
                  {(고른.짐작 || []).map((w, i) => <div key={i} className="bim-guess">💭 {w}</div>)}
                  <div className="bim-btns">
                    <button type="button" className="btn line sm" onClick={() => 묶음고르기('같은 기호 ' + (고른.몸 || 고른.기호), (o) => o.종류 === 고른.종류 && (o.몸 || o.기호) === (고른.몸 || 고른.기호))}>같은 기호 모두</button>
                    <button type="button" className="btn line sm" onClick={() => 묶음고르기(층말(고른.층) + ' ' + 종이름[고른.종류] + ' 모두', (o) => o.층 === 고른.층 && o.종류 === 고른.종류)}>이 층 {종이름[고른.종류]} 모두</button>
                    <button type="button" className="btn line sm" onClick={() => 보기Ref.current && 보기Ref.current.보기로([고른.id])}>🔍 다가가기</button>
                  </div>
                </div>
              ) : 묶음 ? (
                <div>
                  <div className="bim-title">🔵 {묶음.글}</div>
                  <table className="bim-kv"><tbody>
                    <tr><th>부재</th><td><b>{묶음.ids.size}</b>개</td></tr>
                    {묶음합 && <tr><th>콘크리트</th><td><b>{쉼(묶음합.콘크리트, 3)}</b> ㎥</td></tr>}
                    {묶음합 && <tr><th>거푸집</th><td><b>{쉼(묶음합.거푸집, 2)}</b> ㎡</td></tr>}
                    {묶음합 && <tr><th>철근</th><td><b>{쉼(묶음합.철근, 1)}</b> kg</td></tr>}
                  </tbody></table>
                  <div className="bim-btns"><button type="button" className="btn line sm" onClick={() => set묶음(null)}>고름 풀기</button></div>
                </div>
              ) : (
                <div className="muted" style={{ fontSize: 12.5, lineHeight: 1.7 }}>
                  👆 3D 에서 <b>부재를 누르면</b> 크기 · 콘크리트 · 거푸집 · 철근이 여기에 나옵니다.<br />
                  아래 표의 칸을 누르면 그 층 · 그 종류가 3D 에서 파랗게 됩니다. ④ 결과의 <b>산출서 줄</b>을 눌러도 됩니다.
                </div>
              )}
            </div>
          </div>
          {Q && (
            <div className="gg-wrap" style={{ marginTop: 10 }}><table className="gg-r gz3-t">
              <thead><tr><th>층</th>{있는종류.map((k) => <th key={k} className="r">{종이름[k]} ㎥</th>)}</tr></thead>
              <tbody>{층들.map((n) => (
                <tr key={n}><th>{층말(n)}</th>{있는종류.map((k) => {
                  const t = Q.층종.get(n + '|' + k)
                  return <td key={k} className={'r' + (t ? ' bim-cell' : '')} onClick={() => t && 묶음고르기(층말(n) + ' ' + 종이름[k], (o) => o.층 === n && o.종류 === k)}>{t ? 쉼(t.콘크리트, 2) : '—'}</td>
                })}</tr>
              ))}</tbody>
            </table></div>
          )}
          <div className="btn-row" style={{ marginTop: 8, flexWrap: 'wrap' }}>
            <Link className="btn ghost sm" to="/jeoksan/bim">🧊 BIM 물량에서 크게 · 토목까지 · 검수</Link>
          </div>
        </>
      )}
    </div>
  )
}
