/**
 * /jeoksan/model — 🧱 골조 모델 · 세우면 물량 (G386 · 2026-10-23)
 *
 * 소장님: 「그럼 이제 아까 말했던 플러그인 만들고, 사이트에서 작업 가능하게 하자」 · 「지금 있는 것과 따로 만들고 싶어」 · 「도구 셋 끝낸 뒤」
 *   (카페 «스케치업으로 골조 물량산출» — 기둥 · 보 · 벽 · 슬라브를 세우면 거푸집 ㎡ · 철근 t · 콘크리트 ㎥ 이 층별 · 부호별 엑셀)
 * ■ 지금 있는 골조 수량산출(/jeoksan/golgo · 표에 적기) · BIM 물량(/jeoksan/bim · 도면 읽기)과 «따로» 인 화면 — 통심 위에 눌러 세움.
 *   셈은 같은 골조 셈(lib/골조.js) — 같은 건물이면 어느 화면으로 해도 같은 규칙. 모델 → 셈 줄은 lib/골조모델.js.
 * ■ 흐름: ① 통심 · 층 → ② 부호 일람(단면 · 배근) → ③ 세우기(평면에서 누름 · 3D) → ④ 물량(층별 · 부호별 · 엑셀 산출서)
 * ■ 모델은 이 브라우저에만(localStorage kcm.model.v1) · «모델 파일 저장» 으로 PC 에 받아 두고 다른 기기에서 «모델 파일 열기». 서버 없음 · 비용 0.
 * ■ 🔒 이용권 확인 자리 lib/이용권.js — 꺼 둠(모두 통과 · 화면에 말 없음 · 소장님 「이런 설명을 사이트에 넣지마」)
 * ■ 📊 숨은 누적: |골조모델|열기 · 예시 · 세움(그 판 첫 번) · 층복사 · 엑셀 · 저장 · 열기파일 · 3D고름
 * ■ 시험: node tools/시험_골조모델.mjs (lib) · tools/시험_골조모델화면.mjs (화면 PC · 폰)
 * ■ 🖥 G388 작업 화면(적산컨맵 첫걸음 · 2026-10-23) — 소장님 「지금 화면은 작잖아...크게 해주면 안돼?」 · 「잠가놓고 시험해줘. 그리고 내가 볼 수 있게」
 *   🔒 운영자(소장님 브라우저 · lib/운영자.js 나운영자)만 «🖥 작업 화면» 단추 · ?ws=1 로 열림 — 남에게는 단추 · 글 · 주소 모두 없음. 소장님 «열어» 뒤 잠금 풂.
 *   꼴: 위 막대(이름 · 탭 · 되돌리기 · 예시 · 저장 · 열기 · 엑셀 · ⛶ 전체 화면 · 나가기) / 왼쪽(층 단추 · 도구 · 부호 · 한꺼번에 · 층 복사) / 가운데(🧊 3D · 📐 평면 · ◫ 나란히) / 오른쪽(합 · 고른 부재 · 이 층 표).
 *   3D 바닥에 지금 층 통심을 깖(set배경) — 도면 위에 세우듯. 📊 숨은 누적 |골조모델|작업화면.
 */
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { 세기 } from '../lib/받은수.jsx'
import { 배근칸, 정착표, 기준값, 엑셀 as 골조엑셀 } from '../lib/골조.js'
import { 새모델, 예시모델, 정돈, 기둥넣기, 선넣기, 칸넣기, 부재빼기, 부재고치기, 층복사, 통심더하기, 통심빼기, 통심간격, 모델셈, 종류색, 부재글, 모델시트, FT층, 층높이 } from '../lib/골조모델.js'
import { 부재보기 } from '../lib/bim3d.js'
import { 확인 as 이용권확인 } from '../lib/이용권.js'
import { 나운영자 } from '../lib/운영자.js'

const 저장열쇠 = 'kcm.model.v1'
const 수글 = (n, k = 3) => (Number.isFinite(n) ? n.toLocaleString('ko-KR', { minimumFractionDigits: k, maximumFractionDigits: k }) : '')
const rgb = (c) => 'rgb(' + c.map((v) => Math.round(v * 255)).join(',') + ')'
const 어두움 = () => { try { return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches } catch (e) { return false } }
const 일람칸 = {
  기둥: ['기호', '가로', '세로', '지름', '주근', '대근단부', '대근중앙'],
  보: ['기호', '폭', '춤', '상부', '하부', '늑근단부', '늑근중앙', '부근'],
  슬라브: ['기호', '두께', '단변하부', '단변상부', '장변하부', '장변상부'],
  벽: ['기호', '두께', '수직', '수평', '배근'],
  기초: ['기호', '가로', '세로', '두께', '하부가로', '하부세로', '상부가로', '상부세로'],
}
const 칸이름 = (종, 속) => ((배근칸[종] || []).find((c) => c[1] === 속) || [속])[0]
const 칸보기 = (종, 속) => ((배근칸[종] || []).find((c) => c[1] === 속) || [])[2] || ''
const 도구들 = [['기둥', '▣ 기둥'], ['보', '━ 보'], ['벽', '▬ 벽'], ['슬라브', '▦ 슬라브'], ['기초', '⬚ 기초'], ['고르기', '👆 고르기'], ['지우기', '✕ 지우기']]
const 다음부호 = (목록, 머리) => { let n = 1; while (목록.some((r) => String(r.기호).toUpperCase() === 머리 + n)) n++; return 머리 + n }

function 읽기() {
  try { const t = localStorage.getItem(저장열쇠); if (t) return 정돈(JSON.parse(t)) } catch (e) { /* 사생활 보호 모드 · 깨진 저장 */ }
  return null
}

export default function Model() {
  const [M, setM0] = useState(() => 읽기() || 새모델())
  const [되돌림, set되돌림] = useState([])
  const [탭, set탭] = useState(() => (읽기() && 읽기().부재.length ? '세우기' : '통심'))
  const [층, set층] = useState(() => { const m = 읽기() || 새모델(); return (m.층.find((f) => !FT층(f)) || m.층[0]).이름 })
  const [도구, set도구] = useState('기둥')
  const [부호, set부호] = useState({ 기둥: 'C1', 보: 'G1', 벽: 'W1', 슬라브: 'S1', 기초: 'F1' })
  const [첫점, set첫점] = useState(null)
  const [고른, set고른] = useState(null)
  const [보일층, set보일층] = useState('모두')
  const [알림, set알림] = useState('')
  const [받는중, set받는중] = useState('')
  const [glErr, setGlErr] = useState('')
  const [크게, set크게] = useState(false)
  /* 🖥 G388 작업 화면(크게 · 왼쪽 도구 · 가운데 3D · 오른쪽 물량) — 🔒 지금은 소장님 브라우저(운영자)에서만 보임 · 소장님이 «열어» 하시면 잠금을 풂 */
  const [운영자, set운영자] = useState(false)
  const [작업, set작업0] = useState(false)
  const 작업Ref = useRef(null)
  useEffect(() => {
    let 살 = true
    나운영자().then((v) => { if (!살 || !v) return; set운영자(true); try { if (new URLSearchParams(window.location.search).get('ws') === '1') set작업0(true) } catch (e) { /* 주소 못 읽음 */ } }).catch(() => {})
    return () => { 살 = false }
  }, [])
  const set작업 = (v) => {
    set작업0(v)
    try { const u = new URL(window.location.href); if (v) u.searchParams.set('ws', '1'); else u.searchParams.delete('ws'); window.history.replaceState(window.history.state, '', u.pathname + u.search + u.hash) } catch (e) { /* 주소 못 바꿈 */ }
    if (!v && document.fullscreenElement) { try { document.exitFullscreen() } catch (e) { /* 무시 */ } }
  }
  useEffect(() => {
    if (!작업) return
    세기('|골조모델|작업화면')
    const 전 = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    if (탭 === '통심' && M.부재.length) set탭('세우기')
    return () => { document.body.style.overflow = 전 }
  }, [작업])  // eslint-disable-line react-hooks/exhaustive-deps
  const 전체화면 = () => { const el = 작업Ref.current; try { if (document.fullscreenElement) document.exitFullscreen(); else if (el && el.requestFullscreen) el.requestFullscreen() } catch (e) { /* 막힘 */ } }
  const 센것 = useRef(new Set())
  const 한번세기 = (k) => { if (센것.current.has(k)) return; 센것.current.add(k); 세기(k) }
  useEffect(() => { 세기('|골조모델|열기'); 이용권확인('골조모델').catch(() => {}) }, [])

  /* 고침 — 되돌리기 30번 */
  const setM = useCallback((f) => {
    setM0((P) => {
      const N = typeof f === 'function' ? f(P) : f
      if (N !== P) set되돌림((u) => [...u.slice(-29), P])
      return N
    })
  }, [])
  const 되돌리기 = () => set되돌림((u) => { if (!u.length) return u; setM0(u[u.length - 1]); return u.slice(0, -1) })
  /* 저장(0.4초 모아서) */
  useEffect(() => {
    const t = setTimeout(() => { try { localStorage.setItem(저장열쇠, JSON.stringify(M)) } catch (e) { /* 꽉 참 · 사생활 보호 */ } }, 400)
    return () => clearTimeout(t)
  }, [M])
  /* 층 이름이 없어지면 첫 층으로 */
  useEffect(() => { if (!M.층.some((f) => f.이름 === 층)) set층((M.층.find((f) => !FT층(f)) || M.층[0]).이름) }, [M.층, 층])
  useEffect(() => { set첫점(null) }, [도구, 층])

  /* 셈은 누름을 막지 않게 한 박자 늦게(큰 모델: 부재 3,600개에 0.4초쯤) */
  const M늦 = useDeferredValue(M)
  const S = useMemo(() => { try { return 모델셈(M늦) } catch (e) { return { 오류: String(e && e.message || e) } } }, [M늦])
  const 고른것 = 고른 !== null ? M.부재.find((o) => o.id === 고른) || null : null
  const 층FT = FT층(M.층.find((f) => f.이름 === 층))
  const 쓸도구 = 층FT ? ['기초', '보', '슬라브', '고르기', '지우기'] : ['기둥', '보', '벽', '슬라브', '고르기', '지우기']
  useEffect(() => { if (!쓸도구.includes(도구)) set도구(층FT ? '기초' : '기둥') }, [층FT])  // eslint-disable-line react-hooks/exhaustive-deps

  const 예시열기 = () => {
    setM(예시모델()); set층('1'); set탭('세우기'); set고른(null); set알림('가상 예시(2층 라멘조)를 열었습니다 — 실제 현장이 아닙니다. 눌러서 고쳐 보십시오.')
    세기('|골조모델|예시')
  }
  const 새로 = () => {
    if (M.부재.length && !window.confirm('지금 모델을 비우고 새로 시작할까요? (되돌리기로 돌아올 수 있습니다)')) return
    setM(새모델()); set층('1'); set탭('통심'); set고른(null); set알림('')
  }

  /* ── 모델 파일 저장 · 열기 ── */
  const 파일이름 = (M.이름 || '골조모델').replace(/[\\/:*?"<>|]/g, '_').slice(0, 40)
  const 내려주기 = (blob, 이름) => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = 이름
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 60000)
  }
  const 모델저장 = () => { 내려주기(new Blob([JSON.stringify(M)], { type: 'application/json' }), '골조모델_' + 파일이름 + '.json'); 세기('|골조모델|저장') }
  const 파일Ref = useRef(null)
  const 모델열기 = async (f) => {
    if (!f) return
    try {
      const j = JSON.parse(await f.text())
      if (!j || !Array.isArray(j.부재) || !j.통심) throw new Error('골조 모델 파일이 아닙니다')
      setM(정돈(j)); set고른(null); set탭('세우기'); set알림('«' + f.name + '» 를 열었습니다.')
      세기('|골조모델|열기파일')
    } catch (e) { set알림('열지 못했습니다 — ' + (e.message || e)) }
  }

  /* ── 엑셀 ── */
  const 엑셀받기 = async () => {
    if (!S || S.오류 || !M.부재.length) return
    set받는중('엑셀')
    try {
      const { writeWorkbook, ST } = await import('../lib/qtoxlsx.js')
      const sheets = [...골조엑셀(S.공사, S.R, (s) => s, ST), ...모델시트(M, S, ST)]
      내려주기(new Blob([writeWorkbook(sheets)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), '골조모델_' + 파일이름 + '.xlsx')
      세기('|골조모델|엑셀')
    } catch (e) { set알림('엑셀을 만들지 못했습니다 — ' + (e.message || e)) } finally { set받는중('') }
  }

  const 세움칸 = (작업판) => (
    <세우기칸 M={M} setM={setM} S={S} 층={층} set층={set층} 도구={도구} set도구={set도구} 쓸도구={쓸도구} 부호={부호} set부호={set부호}
      첫점={첫점} set첫점={set첫점} 고른={고른} set고른={set고른} 고른것={고른것} 보일층={보일층} set보일층={set보일층}
      glErr={glErr} setGlErr={setGlErr} 크게={크게} set크게={set크게} 한번세기={한번세기} 작업={작업판} />
  )
  if (작업 && 운영자) {
    return (
      <div className="page gmd">
        <div className="gmd-ws" ref={작업Ref} role="dialog" aria-label="골조 모델 작업 화면">
          <div className="gmd-ws-top">
            <b className="gmd-ws-name">🧱 {M.이름 || '골조 모델'}</b>
            <span className="gmd-ws-tabs" role="tablist">
              {[['세우기', '세우기 · 3D'], ['통심', '통심 · 층'], ['일람', '부호 일람'], ['물량', '물량 · 엑셀']].map(([k, t]) => (
                <button key={k} type="button" role="tab" aria-selected={탭 === k} className={'gmd-tab' + (탭 === k ? ' on' : '')} onClick={() => set탭(k)}>{t}</button>
              ))}
            </span>
            <span className="gmd-ws-acts">
              <button type="button" className="btn line sm" onClick={되돌리기} disabled={!되돌림.length} title="되돌리기">↶</button>
              <button type="button" className="btn line sm" onClick={예시열기}>🧪 예시</button>
              <button type="button" className="btn line sm" onClick={모델저장} title="모델 파일 저장">💾</button>
              <button type="button" className="btn line sm" onClick={() => 파일Ref.current && 파일Ref.current.click()} title="모델 파일 열기">📂</button>
              <button type="button" className="btn line sm" onClick={엑셀받기} disabled={!!받는중 || !M.부재.length}>{받는중 ? '…' : '📊 엑셀'}</button>
              <button type="button" className="btn line sm" onClick={전체화면} title="전체 화면">⛶</button>
              <button type="button" className="btn sm" onClick={() => set작업(false)}>✕ 나가기</button>
            </span>
            <input ref={파일Ref} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={(e) => { 모델열기(e.target.files && e.target.files[0]); e.target.value = '' }} />
          </div>
          {알림 && <div className="gmd-note gmd-ws-note">{알림}<button type="button" className="gmd-x" onClick={() => set알림('')} aria-label="닫기">✕</button></div>}
          {탭 === '세우기' ? 세움칸(true) : (
            <div className="gmd-ws-page">
              {탭 === '통심' && <통심칸 M={M} setM={setM} />}
              {탭 === '일람' && <일람칸들 M={M} setM={setM} />}
              {탭 === '물량' && <물량칸 M={M} S={S} 엑셀받기={엑셀받기} 받는중={받는중} set탭={set탭} set고른={set고른} set층={set층} />}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="page gmd">
      <div className="card">
        <h1 style={{ margin: 0, fontSize: 20 }}>🧱 골조 모델 — 세우면 물량</h1>
        <p className="muted" style={{ margin: '6px 0 0', lineHeight: 1.7 }}>
          통심 위에 <b>기둥 · 보 · 벽 · 슬라브 · 기초</b>를 눌러 세우면 <b>콘크리트 ㎥ · 거푸집 ㎡ · 철근 ton</b> 이 층별 · 부호별로 나오고, 산출식이 붙은 엑셀 산출서로 받습니다.
          셈 규칙은 <Link to="/jeoksan/golgo">골조 수량산출</Link>과 같습니다. 모델은 이 브라우저에만 남습니다 — 다른 기기로 옮길 때는 «모델 파일 저장».
        </p>
        <div className="gmd-top">
          <button type="button" className="btn sm" onClick={예시열기}>🧪 가상 예시(2층 라멘조)로 해 보기</button>
          {운영자 && <button type="button" className="btn sm gmd-ws-open" onClick={() => set작업(true)}>🖥 작업 화면</button>}
          <button type="button" className="btn line sm" onClick={새로}>새로</button>
          <button type="button" className="btn line sm" onClick={되돌리기} disabled={!되돌림.length}>↶ 되돌리기</button>
          <button type="button" className="btn line sm" onClick={모델저장}>💾 모델 파일 저장</button>
          <button type="button" className="btn line sm" onClick={() => 파일Ref.current && 파일Ref.current.click()}>📂 모델 파일 열기</button>
          <input ref={파일Ref} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={(e) => { 모델열기(e.target.files && e.target.files[0]); e.target.value = '' }} />
        </div>
        <label className="gmd-name">공사 이름 <input value={M.이름} placeholder="예: ○○ 근린생활시설 신축" onChange={(e) => { const v = e.target.value; setM0((P) => ({ ...P, 이름: v })) }} /></label>
        {알림 && <div className="gmd-note">{알림}</div>}
      </div>

      <div className="gmd-tabs" role="tablist">
        {[['통심', '① 통심 · 층'], ['일람', '② 부호 일람'], ['세우기', '③ 세우기 · 3D'], ['물량', '④ 물량 · 엑셀']].map(([k, t]) => (
          <button key={k} type="button" role="tab" aria-selected={탭 === k} className={'gmd-tab' + (탭 === k ? ' on' : '')} onClick={() => set탭(k)}>{t}</button>
        ))}
      </div>

      {탭 === '통심' && <통심칸 M={M} setM={setM} />}
      {탭 === '일람' && <일람칸들 M={M} setM={setM} />}
      {탭 === '세우기' && 세움칸(false)}
      {탭 === '물량' && <물량칸 M={M} S={S} 엑셀받기={엑셀받기} 받는중={받는중} set탭={set탭} set고른={set고른} set층={set층} />}
    </div>
  )
}

/* ───────────────────────── ① 통심 · 층 */
function 간격글(줄) { return 줄.slice(1).map((g, k) => Math.round(g.자리 - 줄[k].자리)).join(', ') }
function 통심칸({ M, setM }) {
  const [x글, setX글] = useState(() => 간격글(M.통심.x))
  const [y글, setY글] = useState(() => 간격글(M.통심.y))
  useEffect(() => { setX글(간격글(M.통심.x)) }, [M.통심.x])
  useEffect(() => { setY글(간격글(M.통심.y)) }, [M.통심.y])
  const [더축, set더축] = useState('x')
  const [더자리, set더자리] = useState('')
  const 간격넣기 = (축, 글) => {
    const 간 = String(글).split(/[,\s·]+/).map((v) => Number(v.replace(/[^\d.]/g, ''))).filter((v) => v > 0)
    if (!간.length) return
    const 줄어듦 = 간.length + 1 < M.통심[축].length
    if (줄어듦 && M.부재.length && !window.confirm('통심 줄이 줄어듭니다 — 없어지는 줄 위의 부재도 지워집니다. 할까요?')) return
    setM((P) => 통심간격(P, 축, 간))
  }
  const ft = M.층.find(FT층)
  const 위층 = M.층.filter((f) => !FT층(f))
  const 층고침 = (이름, 칸, v) => setM((P) => ({ ...P, 층: P.층.map((f) => (f.이름 === 이름 ? { ...f, [칸]: 칸 === '이름' ? v : v } : f)) }))
  const 층이름바꿈 = (옛, 새) => {
    새 = 새.trim()
    if (!새 || M.층.some((f) => f.이름 === 새)) return
    setM((P) => ({ ...P, 층: P.층.map((f) => (f.이름 === 옛 ? { ...f, 이름: 새 } : f)), 부재: P.부재.map((o) => (o.층 === 옛 ? { ...o, 층: 새 } : o)) }))
  }
  const 층더 = () => setM((P) => {
    const 끝 = P.층[P.층.length - 1]
    const n = P.층.filter((f) => !FT층(f)).length + 1
    let 이름 = String(n); while (P.층.some((f) => f.이름 === 이름)) 이름 += "'"
    return { ...P, 층: [...P.층, { 이름, 층고: FT층(끝) ? 3300 : 끝.층고, 슬라브: FT층(끝) ? 150 : 끝.슬라브 }] }
  })
  const 층빼기 = (이름) => {
    const n = M.부재.filter((o) => o.층 === 이름).length
    if (n && !window.confirm(이름 + '층 부재 ' + n + '개도 지워집니다. 할까요?')) return
    setM((P) => ({ ...P, 층: P.층.filter((f) => f.이름 !== 이름), 부재: P.부재.filter((o) => o.층 !== 이름) }))
  }
  const 지하더 = () => setM((P) => {
    let 이름 = 'B1'; let k = 1; while (P.층.some((f) => f.이름 === 이름)) { k++; 이름 = 'B' + k }
    const i = P.층.findIndex((f) => !FT층(f))
    const 새 = { 이름, 층고: 3600, 슬라브: 150 }
    const 층 = [...P.층]; 층.splice(i < 0 ? 1 : i, 0, 새)
    return { ...P, 층 }
  })
  const 맨 = (g) => g.자리
  return (
    <div className="card gmd-grid">
      <h2 className="gmd-h">통심(그리드)</h2>
      <p className="muted gmd-p">앞 줄에서 다음 줄까지 거리(mm)를 쉼표로 적습니다. 줄 수가 같으면 세운 부재는 그대로 따라 옮겨집니다.</p>
      {[['x', 'X 방향(가로로 늘어선 세로 줄 X1, X2 …)', x글, setX글], ['y', 'Y 방향(세로로 늘어선 가로 줄 Y1, Y2 …)', y글, setY글]].map(([축, 말, 값, 바꿈]) => (
        <div key={축} className="gmd-row">
          <label className="gmd-lab">{말}</label>
          <input className="gmd-in wide" inputMode="numeric" value={값} onChange={(e) => 바꿈(e.target.value)} onBlur={() => 간격넣기(축, 값)} onKeyDown={(e) => { if (e.key === 'Enter') 간격넣기(축, 값) }} placeholder="예: 7000, 7000, 7000" />
          <span className="gmd-lines">{M.통심[축].map((g) => (
            <span key={g.id} className="gmd-chip">
              <input className="gmd-in name" value={g.이름} aria-label="통심 이름" onChange={(e) => { const v = e.target.value; setM((P) => ({ ...P, 통심: { ...P.통심, [축]: P.통심[축].map((u) => (u.id === g.id ? { ...u, 이름: v } : u)) } })) }} />
              <small>{Math.round(맨(g)).toLocaleString('ko-KR')}</small>
              {M.통심[축].length > 2 && <button type="button" className="gmd-x" title="이 줄 빼기" onClick={() => { const n = M.부재.filter((o) => JSON.stringify([o.점, o.끝, o.칸]).includes('"' + g.id + '"')).length; if (n && !window.confirm(g.이름 + ' 줄 위 부재 ' + n + '개도 지워집니다. 뺄까요?')) return; setM((P) => 통심빼기(P, 축, g.id)) }}>✕</button>}
            </span>
          ))}</span>
        </div>
      ))}
      <div className="gmd-row">
        <label className="gmd-lab">보조 통심 더하기(작은보 · 벽 자리)</label>
        <select className="gmd-in" value={더축} onChange={(e) => set더축(e.target.value)}><option value="x">X 방향 줄</option><option value="y">Y 방향 줄</option></select>
        <input className="gmd-in" inputMode="numeric" value={더자리} placeholder="첫 줄에서 거리 mm" onChange={(e) => set더자리(e.target.value)} />
        <button type="button" className="btn line sm" onClick={() => { const v = Number(더자리); if (!(v >= 0) || 더자리 === '') return; setM((P) => 통심더하기(P, 더축, v)); set더자리('') }}>더하기</button>
      </div>

      <h2 className="gmd-h">층</h2>
      <p className="muted gmd-p">n층 = n층 기둥 · 벽 + 그 위 바닥(보 · 슬라브). 맨 위층의 보 · 슬라브가 지붕입니다. FT 는 기초 · 지중보 · 맨 아래 바닥.</p>
      <div className="gmd-tablewrap">
        <table className="gmd-table">
          <thead><tr><th>층</th><th>층고(mm)</th><th>슬라브 두께(mm)</th><th>부재</th><th /></tr></thead>
          <tbody>
            {[...위층].reverse().map((f) => (
              <tr key={f.이름}>
                <td><input className="gmd-in name" defaultValue={f.이름} onBlur={(e) => 층이름바꿈(f.이름, e.target.value)} aria-label="층 이름" /></td>
                <td><input className="gmd-in num" inputMode="numeric" value={f.층고} onChange={(e) => 층고침(f.이름, '층고', Number(e.target.value) || 0)} /></td>
                <td><input className="gmd-in num" inputMode="numeric" value={f.슬라브} onChange={(e) => 층고침(f.이름, '슬라브', Number(e.target.value) || 0)} /></td>
                <td className="num">{M.부재.filter((o) => o.층 === f.이름).length}</td>
                <td>{위층.length > 1 && <button type="button" className="gmd-x" title="이 층 빼기" onClick={() => 층빼기(f.이름)}>✕</button>}</td>
              </tr>
            ))}
            {ft && (
              <tr className="gmd-ft">
                <td>FT</td>
                <td colSpan={2}>기초 윗면 깊이(맨 아래 바닥에서) <input className="gmd-in num" inputMode="numeric" value={ft.내림 || 0} onChange={(e) => 층고침(ft.이름, '내림', Number(e.target.value) || 0)} /> mm</td>
                <td className="num">{M.부재.filter((o) => o.층 === ft.이름).length}</td>
                <td />
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="gmd-top">
        <button type="button" className="btn line sm" onClick={층더}>＋ 위로 층 더하기</button>
        <button type="button" className="btn line sm" onClick={지하더}>＋ 지하층 더하기</button>
      </div>
    </div>
  )
}

/* ───────────────────────── ② 부호 일람 */
function 일람칸들({ M, setM }) {
  const 기 = M.기준 || 기준값()
  const 기준고침 = (k, v) => setM((P) => {
    const 새 = { ...P.기준, [k]: v }
    if (k === 'fck' || k === 'fy') { const fck = Number(새.fck) || 24, fy = Number(새.fy) || 400; 새.정착 = 정착표(fck, fy) }
    return { ...P, 기준: 새 }
  })
  const 줄고침 = (종, i, 칸, v) => setM((P) => {
    const 줄 = P.배근[종].slice()
    const 옛 = 줄[i]
    줄[i] = { ...옛, [칸]: v }
    let 부재 = P.부재
    if (칸 === '기호' && 옛.기호 && v && !줄.some((r, k) => k !== i && r.기호 === 옛.기호)) 부재 = 부재.map((o) => (o.종류 === 종 && o.부호 === 옛.기호 ? { ...o, 부호: v } : o))
    return { ...P, 배근: { ...P.배근, [종]: 줄 }, 부재 }
  })
  const 줄더 = (종) => setM((P) => {
    const 머리 = { 기둥: 'C', 보: 'G', 슬라브: 'S', 벽: 'W', 기초: 'F' }[종]
    const 끝 = P.배근[종][P.배근[종].length - 1]
    const 새 = { ...(끝 || {}), 기호: 다음부호(P.배근[종], 머리) }
    if (종 === '기초') 새.종류 = '독립'
    return { ...P, 배근: { ...P.배근, [종]: [...P.배근[종], 새] } }
  })
  const 줄빼기 = (종, i) => {
    const r = M.배근[종][i]
    const n = M.부재.filter((o) => o.종류 === 종 && o.부호 === r.기호).length
    if (n && !window.confirm(r.기호 + ' 을 쓰는 부재가 ' + n + '개 있습니다 — 일람에서 빼면 그 부재는 셈에서 빠집니다(경고로 보임). 뺄까요?')) return
    setM((P) => ({ ...P, 배근: { ...P.배근, [종]: P.배근[종].filter((_, k) => k !== i) } }))
  }
  return (
    <div className="card">
      <h2 className="gmd-h">기준</h2>
      <div className="gmd-row gmd-wrap">
        <label className="gmd-kv">fck(MPa) <input className="gmd-in num" inputMode="numeric" value={기.fck} onChange={(e) => 기준고침('fck', Number(e.target.value) || 0)} /></label>
        <label className="gmd-kv">fy(MPa) <input className="gmd-in num" inputMode="numeric" value={기.fy} onChange={(e) => 기준고침('fy', Number(e.target.value) || 0)} /></label>
        <label className="gmd-kv">레미콘 <input className="gmd-in" value={기.콘크리트} onChange={(e) => 기준고침('콘크리트', e.target.value)} /></label>
        <label className="gmd-kv">거푸집 <input className="gmd-in" value={기.거푸집} onChange={(e) => 기준고침('거푸집', e.target.value)} /></label>
      </div>
      <p className="muted gmd-p">정착 · 이음 길이는 fck · fy 로 KDS 14 20 52 기본식(골조 수량산출과 같음). 설계도면 일반사항 표가 있으면 골조 수량산출에서 그 값으로 고쳐 쓰십시오.</p>
      {['기둥', '보', '슬라브', '벽', '기초'].map((종) => (
        <div key={종} className="gmd-ilam">
          <h2 className="gmd-h"><span className="gmd-dot" style={{ background: rgb(종류색[종]) }} />{종} 일람 <small className="muted">({M.부재.filter((o) => o.종류 === 종).length}개 세움)</small></h2>
          <div className="gmd-tablewrap">
            <table className="gmd-table">
              <thead><tr>{일람칸[종].map((k) => <th key={k}>{칸이름(종, k)}</th>)}<th>쓴 수</th><th /></tr></thead>
              <tbody>
                {M.배근[종].map((r, i) => (
                  <tr key={i}>
                    {일람칸[종].map((k) => (
                      <td key={k}><input className={'gmd-in ' + (/^(가로|세로|지름|폭|춤|두께)$/.test(k) ? 'num' : k === '기호' ? 'name' : 'bar')} value={r[k] ?? ''} placeholder={칸보기(종, k)} onChange={(e) => 줄고침(종, i, k, e.target.value)} aria-label={종 + ' ' + 칸이름(종, k)} /></td>
                    ))}
                    <td className="num">{M.부재.filter((o) => o.종류 === 종 && o.부호 === r.기호).length}</td>
                    <td><button type="button" className="gmd-x" title="이 줄 빼기" onClick={() => 줄빼기(종, i)}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 줄더(종)}>＋ {종} 부호 더하기</button>
          {종 === '기초' && <span className="muted gmd-p"> 모델의 기초는 독립기초(기둥 밑)입니다.</span>}
        </div>
      ))}
    </div>
  )
}

/* ───────────────────────── ③ 세우기 · 평면 + 3D */
function 세우기칸(p) {
  const { M, setM, S, 층, set층, 도구, set도구, 쓸도구, 부호, set부호, 첫점, set첫점, 고른, set고른, 고른것, 보일층, set보일층, glErr, setGlErr, 크게, set크게, 한번세기, 작업 = false } = p
  const [보기, set보기] = useState('3D')                // 🖥 G388 작업 화면 가운데: 3D · 평면 · 나란히
  const 위층 = M.층.filter((f) => !FT층(f)).map((f) => f.이름)
  const 맨아래 = 위층[0]
  const 이층 = M.부재.filter((o) => o.층 === 층)
  const 종 = ['기둥', '보', '벽', '슬라브', '기초'].includes(도구) ? 도구 : null
  const 부호목록 = 종 ? M.배근[종].map((r) => r.기호).filter(Boolean) : []
  const 지금부호 = 종 ? (부호목록.includes(부호[종]) ? 부호[종] : 부호목록[0] || '') : ''
  const 세움 = (N) => { setM(N); 한번세기('|골조모델|세움') }
  const xs = M.통심.x, ys = M.통심.y

  /* 누르기 */
  const 점누름 = (xid, yid) => {
    if (도구 === '기둥' || 도구 === '기초') { if (!지금부호) return; 세움((P) => 기둥넣기(P, 층, 지금부호, xid, yid, 도구)); return }
    if (도구 === '보' || 도구 === '벽') {
      if (!지금부호) return
      if (!첫점) { set첫점([xid, yid]); return }
      if (첫점[0] === xid && 첫점[1] === yid) { set첫점(null); return }
      if (첫점[0] !== xid && 첫점[1] !== yid) { set첫점([xid, yid]); return }
      const a = 첫점
      세움((P) => 선넣기(P, 도구, 층, 지금부호, a, [xid, yid]))
      set첫점([xid, yid])            // 이어 그리기
    }
  }
  const 칸누름 = (x0, y0, x1, y1) => { if (도구 === '슬라브' && 지금부호) 세움((P) => 칸넣기(P, 층, 지금부호, x0, y0, x1, y1)) }
  const 부재누름 = (o, e) => {
    if (도구 === '지우기') { e.stopPropagation(); setM((P) => 부재빼기(P, o.id)); if (고른 === o.id) set고른(null); return }
    if (도구 === '고르기') { e.stopPropagation(); set고른(o.id) }
  }
  /* 한꺼번에 */
  const 모두 = (무엇) => {
    if (!지금부호 && 무엇 !== '지움') return
    setM((P) => {
      let N = P
      const X = P.통심.x.map((g) => g.id), Y = P.통심.y.map((g) => g.id)
      if (무엇 === '교점') for (const x of X) for (const y of Y) N = 기둥넣기(N, 층, 지금부호, x, y, 도구)
      if (무엇 === '기둥밑') for (const o of P.부재.filter((u) => u.종류 === '기둥' && u.층 === 맨아래)) N = 기둥넣기(N, 층, 지금부호, o.점[0], o.점[1], '기초')
      if (무엇 === '둘레') { for (const y of [Y[0], Y[Y.length - 1]]) N = 선넣기(N, 도구, 층, 지금부호, [X[0], y], [X[X.length - 1], y]); for (const x of [X[0], X[X.length - 1]]) N = 선넣기(N, 도구, 층, 지금부호, [x, Y[0]], [x, Y[Y.length - 1]]) }
      if (무엇 === '모든줄') { for (const y of Y) N = 선넣기(N, 도구, 층, 지금부호, [X[0], y], [X[X.length - 1], y]); for (const x of X) N = 선넣기(N, 도구, 층, 지금부호, [x, Y[0]], [x, Y[Y.length - 1]]) }
      if (무엇 === '칸') N = 칸넣기(N, 층, 지금부호, X[0], Y[0], X[X.length - 1], Y[Y.length - 1])
      if (무엇 === '지움') N = { ...N, 부재: N.부재.filter((o) => o.층 !== 층) }
      return N
    })
    if (무엇 !== '지움') 한번세기('|골조모델|세움')
  }
  const [복사받을, set복사받을] = useState([])
  const 복사하기 = () => {
    const 받을 = 복사받을.filter((f) => f !== 층)
    if (!받을.length) return
    const n = M.부재.filter((o) => 받을.includes(o.층) && o.종류 !== '기초').length
    if (n && !window.confirm(받을.join(' · ') + '층에 있던 기둥 · 보 · 벽 · 슬라브 ' + n + '개는 지우고 ' + 층 + '층 것으로 바꿉니다. 할까요?')) return
    setM((P) => 층복사(P, 층, 받을))
    set복사받을([])
    세기('|골조모델|층복사')
  }

  /* 평면 크기(mm) */
  const X0 = xs[0] ? xs[0].자리 : 0, X1 = xs.length ? xs[xs.length - 1].자리 : 1000
  const Y0 = ys[0] ? ys[0].자리 : 0, Y1 = ys.length ? ys[ys.length - 1].자리 : 1000
  const 폭 = Math.max(X1 - X0, 1000), 높 = Math.max(Y1 - Y0, 1000)
  const 큰 = Math.max(폭, 높)
  const 여 = 큰 * 0.12 + 800
  const r점 = 큰 / 90 + 60, 글크기 = 큰 / 38 + 120
  /* 📱 누르는 자리 — 화면에서 손가락 크기(반지름 14px)는 되게(폰에서 평면이 작아져도) */
  const svgRef = useRef(null)
  const [판px, set판px] = useState(600)
  useEffect(() => {
    const el = svgRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => { const w = el.getBoundingClientRect().width; if (w > 0) set판px(w) })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const r누름 = Math.max(r점, 14 * (폭 + 2 * 여) / Math.max(판px, 1))
  const vb = [X0 - 여, -(Y1 + 여), 폭 + 2 * 여, 높 + 2 * 여].join(' ')
  const 자리X = (id) => (xs.find((g) => g.id === id) || {}).자리, 자리Y = (id) => (ys.find((g) => g.id === id) || {}).자리
  const G = S && S.G ? S.G.기 : new Map()
  const 일 = (종류, 기호) => (M.배근[종류] || []).find((r) => String(r.기호) === String(기호)) || {}
  const 아래기둥 = 층 === M.층[0].이름 ? M.부재.filter((o) => o.종류 === '기둥' && o.층 === 맨아래) : M.부재.filter((o) => o.종류 === '기둥' && o.층 === 위층[위층.indexOf(층) - 1])
  const 그림 = (o, 흐림) => {
    const g = G.get(o.id)
    const 색 = rgb(종류색[o.종류])
    const on = o.id === 고른
    const cls = 'gmd-m' + (on ? ' on' : '') + (흐림 ? ' ghost' : '')
    const 손 = 흐림 ? undefined : (e) => 부재누름(o, e)
    const 집기 = 도구 === '고르기' || 도구 === '지우기'
    if (o.종류 === '기둥' || o.종류 === '기초') {
      const x = 자리X(o.점[0]), y = 자리Y(o.점[1])
      if (x === undefined || y === undefined) return null
      const r = 일(o.종류, o.부호)
      let a = Number(r.가로) || Number(r.지름) || 500, b = Number(r.세로) || a
      if (o.돌림) [a, b] = [b, a]
      if (o.종류 === '기둥' && Number(r.지름) > 0) return <circle key={o.id} className={cls} cx={x} cy={-y} r={Number(r.지름) / 2} fill={색} onClick={손} />
      return <rect key={o.id} className={cls + (o.종류 === '기초' ? ' ft' : '')} x={x - a / 2} y={-y - b / 2} width={a} height={b} fill={o.종류 === '기초' ? 'none' : 색} stroke={색} onClick={손} />
    }
    if (o.종류 === '보' || o.종류 === '벽') {
      const ax = 자리X(o.점[0]), ay = 자리Y(o.점[1]), bx = 자리X(o.끝[0]), by = 자리Y(o.끝[1])
      if ([ax, ay, bx, by].some((v) => v === undefined)) return null
      const r = 일(o.종류, o.부호)
      const w = Number(o.종류 === '보' ? r.폭 : r.두께) || 300
      const s0 = g && g.좌 ? g.좌.값 : 0, s1 = g && g.우 ? g.우.값 : 0
      /* 📱 가는 보 · 벽도 손가락으로 집히게 — 가운데 줄을 따라 보이지 않는 굵은 선(화면 18px) */
      if (ay === by) {
        const x0 = Math.min(ax, bx) + s0, x1 = Math.max(ax, bx) - s1
        return <g key={o.id} className={cls} onClick={손} data-k={o.종류 + o.id}><rect x={x0} y={-ay - w / 2} width={Math.max(x1 - x0, 1)} height={w} fill={색} />{!흐림 && 집기 && <line className="gmd-hitl" x1={x0} y1={-ay} x2={x1} y2={-ay} />}</g>
      }
      const y0 = Math.min(ay, by) + s0, y1 = Math.max(ay, by) - s1
      return <g key={o.id} className={cls} onClick={손} data-k={o.종류 + o.id}><rect x={ax - w / 2} y={-y1} width={w} height={Math.max(y1 - y0, 1)} fill={색} />{!흐림 && 집기 && <line className="gmd-hitl" x1={ax} y1={-y0} x2={ax} y2={-y1} />}</g>
    }
    if (o.종류 === '슬라브') {
      const x0 = g ? g.X0 : Math.min(자리X(o.칸[0]), 자리X(o.칸[2])), x1 = g ? g.X1 : Math.max(자리X(o.칸[0]), 자리X(o.칸[2]))
      const y0 = g ? g.Y0 : Math.min(자리Y(o.칸[1]), 자리Y(o.칸[3])), y1 = g ? g.Y1 : Math.max(자리Y(o.칸[1]), 자리Y(o.칸[3]))
      if ([x0, x1, y0, y1].some((v) => v === undefined || Number.isNaN(v))) return null
      return (
        <g key={o.id} onClick={손} className={cls + ' slab'}>
          <rect x={x0} y={-y1} width={x1 - x0} height={y1 - y0} fill={색} />
          <text x={(x0 + x1) / 2} y={-(y0 + y1) / 2} fontSize={글크기 * 0.8} textAnchor="middle" dominantBaseline="middle">{o.부호}</text>
        </g>
      )
    }
    return null
  }
  const 차례 = { 슬라브: 0, 기초: 1, 보: 2, 벽: 3, 기둥: 4 }   /* 벽은 보 밑에 있어도 보이게 보 위에 그림 */
  const 판부재 = [...이층].sort((a, b) => 차례[a.종류] - 차례[b.종류])
  const 첫xy = 첫점 ? [자리X(첫점[0]), 자리Y(첫점[1])] : null

  /* ── 3D ── */
  const 판Ref = useRef(null), 보기Ref = useRef(null), 맞춤 = useRef(false)
  const 덩 = S && S.덩어리 ? S.덩어리 : []
  const 보일 = useMemo(() => {
    if (보일층 === '모두') return 덩
    if (보일층 === '이층') return 덩.filter((d) => d.층 === 층)
    const k = M.층.findIndex((f) => f.이름 === 층)
    const 들 = new Set(M.층.slice(0, k + 1).map((f) => f.이름))
    return 덩.filter((d) => 들.has(d.층))
  }, [덩, 보일층, 층, M.층])
  useEffect(() => {
    if (!판Ref.current) return
    if (!보기Ref.current) {
      try { 보기Ref.current = new 부재보기(판Ref.current) } catch (e) { setGlErr('이 브라우저는 3D(WebGL)를 그리지 못합니다 — 평면 세우기와 물량 · 엑셀은 그대로 쓸 수 있습니다.'); return }
      if (어두움()) { const v0 = 보기Ref.current; v0.bg = [0.086, 0.102, 0.129]; v0.bgT = [0.15, 0.17, 0.21]; v0.bgB = [0.06, 0.07, 0.09]; v0.선색 = [0.03, 0.04, 0.05]; v0.선알 = 0.6 }
      보기Ref.current.hi = [0.98, 0.62, 0.10]     /* 고른 부재 = 주황(보가 파래서 파란 칠이 안 보임 · 평면 고름과 같은 색) */
    }
    const v = 보기Ref.current
    /* 보 · 기둥 · 벽 윗면이 슬라브 밑면과 같은 높이라 겹친 면이 깜빡임 → 그림에서만 3 mm 낮춤(물량은 그대로) */
    v.set부재(보일.map((d) => ({ id: d.id, 판: d.판, z0: d.z0, z1: d.종류 === '슬라브' || d.종류 === '기초' ? d.z1 : d.z1 - 3, 색: d.색 })), { 바닥: true, 바닥색: 어두움() ? [0.16, 0.18, 0.22] : [0.86, 0.88, 0.90] })
    if (!맞춤.current && 보일.length) { v.fit('tilt'); 맞춤.current = true }
    v.set고름(고른 !== null ? [고른] : [])
    v.onPick = (id) => { if (id >= 0) { set고른(id); 한번세기('|골조모델|3D고름') } else set고른(null) }
  }, [보일])  // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (보기Ref.current) 보기Ref.current.set고름(고른 !== null ? [고른] : []) }, [고른])
  /* 🖥 G388 바닥에 이 층 통심을 깖(3D 에서 지금 세우는 층 높이) — 도면 위에 세우듯 */
  const 바닥선 = useMemo(() => {
    if (!xs.length || !ys.length) return []
    let z = 0
    try { const h = 층높이(M).표.get(층); z = h ? (h.FT ? h.z0 : h.z0) : 0 } catch (e) { z = 0 }
    const 넉 = 큰 * 0.08 + 600, a = []
    for (const g of xs) a.push(g.자리, Y0 - 넉, z, g.자리, Y1 + 넉, z)
    for (const g of ys) a.push(X0 - 넉, g.자리, z, X1 + 넉, g.자리, z)
    return a
  }, [xs, ys, 층, M.층, X0, X1, Y0, Y1, 큰])  // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (보기Ref.current) 보기Ref.current.set배경(바닥선, 어두움() ? [0.55, 0.6, 0.68] : [0.3, 0.36, 0.45], 0.55) }, [바닥선, 보일])
  useEffect(() => () => { if (보기Ref.current) { 보기Ref.current.dispose(); 보기Ref.current = null } }, [])
  useEffect(() => { if (보기Ref.current) setTimeout(() => 보기Ref.current && 보기Ref.current.dirty(), 50) }, [크게])

  const 고른물량 = 고른것 && S && S.부재별 ? S.부재별.get(고른것.id) : null
  const 고른기하 = 고른것 ? G.get(고른것.id) : null
  const 도움말 = { 기둥: '통심 교점을 누르면 기둥', 기초: '통심 교점을 누르면 기초(기둥 밑)', 보: 첫점 ? '같은 줄의 다른 교점을 누르면 그 사이 칸마다 보 — 이어서 누르면 계속' : '교점 하나를 누르고, 같은 줄의 다른 교점을 누릅니다', 벽: 첫점 ? '같은 줄의 다른 교점을 누르면 그 사이 칸마다 벽' : '교점 하나를 누르고, 같은 줄의 다른 교점을 누릅니다', 슬라브: '통심 사이 칸을 누르면 슬라브', 고르기: '부재를 누르면 크기 · 물량', 지우기: '누른 부재를 지웁니다' }[도구]

  /* 🖥 G388 작업 화면 — 같은 조각을 왼쪽 도구 · 가운데 3D(크게) · 오른쪽 정보로 놓음(작업 = true) · 아니면 예전 차례 그대로 */
  const 도구판 = (
      <div className={'gmd-bar' + (작업 ? ' gmd-ws-tools' : '')}>
        <label className="gmd-kv">층 <select className="gmd-in" value={층} onChange={(e) => { set층(e.target.value); set고른(null) }}>
          {[...M.층].reverse().map((f) => <option key={f.이름} value={f.이름}>{FT층(f) ? 'FT (기초 · 지중보)' : f.이름 + '층'} · {M.부재.filter((o) => o.층 === f.이름).length}</option>)}
        </select></label>
        <span className="gmd-tools" role="group" aria-label="도구">
          {도구들.filter(([k]) => 쓸도구.includes(k)).map(([k, t]) => <button key={k} type="button" className={'gmd-tool' + (도구 === k ? ' on' : '')} aria-pressed={도구 === k} onClick={() => set도구(k)}>{t}</button>)}
        </span>
        {종 && (
          <label className="gmd-kv">부호 <select className="gmd-in" value={지금부호} onChange={(e) => set부호((P) => ({ ...P, [종]: e.target.value }))}>
            {부호목록.map((k) => <option key={k} value={k}>{k}</option>)}
          </select></label>
        )}
        {종 && !부호목록.length && <span className="gmd-warn">② 부호 일람에 {종} 부호를 먼저 적으십시오</span>}
      </div>
  )
  const 도움판 = (
      <div className="gmd-hint">{도움말}{첫점 && <button type="button" className="gmd-link" onClick={() => set첫점(null)}>그만</button>}</div>
  )
  const 한꺼번에판 = (<>
      {종 && 지금부호 && (
        <div className="gmd-bar small">
          <span className="muted">이 층 한꺼번에:</span>
          {(도구 === '기둥' || 도구 === '기초') && <button type="button" className="btn line sm" onClick={() => 모두('교점')}>모든 교점에 {지금부호}</button>}
          {도구 === '기초' && <button type="button" className="btn line sm" onClick={() => 모두('기둥밑')}>{맨아래}층 기둥 밑마다 {지금부호}</button>}
          {(도구 === '보' || 도구 === '벽') && <><button type="button" className="btn line sm" onClick={() => 모두('둘레')}>바깥 둘레에 {지금부호}</button><button type="button" className="btn line sm" onClick={() => 모두('모든줄')}>모든 통심에 {지금부호}</button></>}
          {도구 === '슬라브' && <button type="button" className="btn line sm" onClick={() => 모두('칸')}>모든 칸에 {지금부호}</button>}
        </div>
      )}
  </>)
  const 평면판 = (
        <div className="gmd-plan">
          <svg ref={svgRef} viewBox={vb} className={'gmd-svg tool-' + 도구} role="img" aria-label={층 + '층 평면'}>
            {/* 칸(슬라브 누르기) */}
            {도구 === '슬라브' && xs.slice(0, -1).map((gx, i) => ys.slice(0, -1).map((gy, j) => (
              <rect key={gx.id + gy.id} className="gmd-cell" x={gx.자리} y={-ys[j + 1].자리} width={xs[i + 1].자리 - gx.자리} height={ys[j + 1].자리 - gy.자리} onClick={() => 칸누름(gx.id, gy.id, xs[i + 1].id, ys[j + 1].id)} />
            )))}
            {/* 통심 */}
            {xs.map((g) => <g key={g.id}><line className="gmd-gl" x1={g.자리} y1={-(Y1 + 여 * 0.55)} x2={g.자리} y2={-(Y0 - 여 * 0.55)} /><circle className="gmd-gb" cx={g.자리} cy={-(Y1 + 여 * 0.7)} r={글크기 * 0.9} /><text className="gmd-gt" x={g.자리} y={-(Y1 + 여 * 0.7)} fontSize={글크기} textAnchor="middle" dominantBaseline="central">{g.이름}</text></g>)}
            {ys.map((g) => <g key={g.id}><line className="gmd-gl" x1={X0 - 여 * 0.55} y1={-g.자리} x2={X1 + 여 * 0.55} y2={-g.자리} /><circle className="gmd-gb" cx={X0 - 여 * 0.7} cy={-g.자리} r={글크기 * 0.9} /><text className="gmd-gt" x={X0 - 여 * 0.7} y={-g.자리} fontSize={글크기} textAnchor="middle" dominantBaseline="central">{g.이름}</text></g>)}
            {/* 아래층 기둥(흐리게) */}
            {아래기둥.map((o) => 그림(o, true))}
            {판부재.map((o) => 그림(o, false))}
            {/* 교점 */}
            {(도구 === '기둥' || 도구 === '기초' || 도구 === '보' || 도구 === '벽') && xs.map((gx) => ys.map((gy) => (
              <g key={gx.id + gy.id} className="gmd-nodeg" onClick={() => 점누름(gx.id, gy.id)} data-node={gx.이름 + '-' + gy.이름}>
                <circle className="gmd-hit" cx={gx.자리} cy={-gy.자리} r={r누름} />
                <circle className={'gmd-node' + (첫점 && 첫점[0] === gx.id && 첫점[1] === gy.id ? ' first' : '')} cx={gx.자리} cy={-gy.자리} r={r점} />
              </g>
            )))}
            {첫xy && <circle className="gmd-first" cx={첫xy[0]} cy={-첫xy[1]} r={r점 * 1.8} />}
          </svg>
          <div className="gmd-legend">{['기둥', '보', '벽', '슬라브', '기초'].map((k) => <span key={k}><i style={{ background: rgb(종류색[k]) }} />{k} {이층.filter((o) => o.종류 === k).length}</span>)}</div>
        </div>
  )
  const 삼차원판 = (
        <div className="gmd-3d">
          <div className="gmd-bar small">
            <select className="gmd-in" value={보일층} onChange={(e) => set보일층(e.target.value)} aria-label="3D 에 보일 층">
              <option value="모두">3D: 모든 층</option><option value="까지">3D: 이 층까지</option><option value="이층">3D: 이 층만</option>
            </select>
            <button type="button" className="btn line sm" onClick={() => 보기Ref.current && 보기Ref.current.fit('tilt')}>↗</button>
            <button type="button" className="btn line sm" onClick={() => 보기Ref.current && 보기Ref.current.fit('top')}>⬇ 위</button>
            <button type="button" className={'btn line sm gmd-bigbtn' + (크게 ? ' on' : '')} onClick={() => set크게((v) => !v)}>{크게 ? '⊟ 작게' : '⛶ 크게'}</button>
          </div>
          <div className="bim-canvas gmd-canvas">
            {glErr ? <div className="dx3-warn" style={{ margin: 12 }}>{glErr}</div> : <canvas ref={판Ref} />}
            <div className="bim-hint">끌기 = 돌리기 · 오른쪽 끌기(두 손가락) = 옮기기 · 휠(벌리기) = 확대 · <b>누르기 = 물량</b></div>
          </div>
        </div>
  )
  const 고름판 = (<>
      {고른것 && (
        <div className="gmd-pick">
          <div className="gmd-pick-h">
            <b>{고른것.층 === 'FT' ? 'FT' : 고른것.층 + '층'} {고른것.종류} {고른것.부호}</b> <span className="muted">{부재글(M, 고른것)}</span>
            <button type="button" className="gmd-x" onClick={() => set고른(null)} aria-label="닫기">✕</button>
          </div>
          {고른물량 && (
            <div className="gmd-q">
              <span>콘크리트 <b>{수글(고른물량.콘크리트)}</b> ㎥</span>
              <span>거푸집 <b>{수글(고른물량.거푸집, 2)}</b> ㎡</span>
              <span>철근 <b>{수글(고른물량.철근 / 1000, 4)}</b> ton</span>
            </div>
          )}
          {고른기하 && (
            <div className="muted gmd-p">
              {고른것.종류 === '보' && <>폭 {고른기하.W} × 춤 {고른기하.H} · 길이 {Math.round(고른기하.L)} − 왼쪽 {Math.round(고른기하.좌.값)}({고른기하.좌.무엇}) − 오른쪽 {Math.round(고른기하.우.값)}({고른기하.우.무엇}) = 안목 {Math.round(고른기하.안)} · 슬라브 {고른기하.S}</>}
              {고른것.종류 === '벽' && <>두께 {고른기하.T} · 길이 {Math.round(고른기하.L)} → {Math.round(고른기하.안)}(왼쪽 {고른기하.좌.무엇} · 오른쪽 {고른기하.우.무엇}) · 위 {고른기하.상부}({고른기하.상부까닭})</>}
              {고른것.종류 === '기둥' && <>{고른기하.원 ? '지름 ' + 고른기하.원 : 고른기하.a + ' × ' + 고른기하.b} · 슬라브 {고른기하.S}{고른기하.내림 ? ' · 내림 ' + 고른기하.내림 : ''} · 위층 {고른기하.연결 === 'R' ? '없음(최상층 정착)' : 고른기하.연결 + ' 와 이음'}{고른기하.기초 ? ' · 기초 ' + 고른기하.기초.o.부호 : ''}</>}
              {고른것.종류 === '슬라브' && <>{Math.round(고른기하.X1 - 고른기하.X0)} × {Math.round(고른기하.Y1 - 고른기하.Y0)} · 두께 {고른기하.t}{Object.values(고른기하.넓).some((v) => v > 0) ? ' · 옆 슬라브 없는 변은 보 · 벽 바깥 면까지' : ''}</>}
              {고른것.종류 === '기초' && <>{고른기하.a} × {고른기하.b} × {고른기하.t}</>}
            </div>
          )}
          <div className="gmd-row gmd-wrap">
            <label className="gmd-kv">부호 <select className="gmd-in" value={고른것.부호} onChange={(e) => setM((P) => 부재고치기(P, 고른것.id, { 부호: e.target.value }))}>
              {M.배근[고른것.종류].map((r) => <option key={r.기호} value={r.기호}>{r.기호}</option>)}
            </select></label>
            {고른것.종류 === '기둥' && <label className="gmd-kv"><input type="checkbox" checked={!!고른것.돌림} onChange={(e) => setM((P) => 부재고치기(P, 고른것.id, { 돌림: e.target.checked }))} /> 가로 · 세로 바꿈</label>}
            {고른것.종류 === '벽' && <label className="gmd-kv">문 · 창(폭x높이) <input className="gmd-in" value={고른것.구멍 || ''} placeholder="900x2100" onChange={(e) => setM((P) => 부재고치기(P, 고른것.id, { 구멍: e.target.value }))} /></label>}
            {고른것.종류 === '벽' && <label className="gmd-kv"><input type="checkbox" checked={!!고른것.한면} onChange={(e) => setM((P) => 부재고치기(P, 고른것.id, { 한면: e.target.checked }))} /> 거푸집 한 면만(합벽)</label>}
            {고른것.종류 === '슬라브' && <label className="gmd-kv">구멍 넓이(㎡) <input className="gmd-in num" inputMode="decimal" value={고른것.구멍 || ''} onChange={(e) => setM((P) => 부재고치기(P, 고른것.id, { 구멍: e.target.value }))} /></label>}
            <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => { setM((P) => 부재빼기(P, 고른것.id)); set고른(null) }}>✕ 이 부재 지우기</button>
          </div>
          {고른물량 && 고른물량.줄.length > 0 && (
            <details className="gmd-lines-d">
              <summary>산출 줄 {고른물량.줄.length}개(이 부재 몫)</summary>
              <div className="gmd-tablewrap">
                <table className="gmd-table small">
                  <thead><tr><th>항목</th><th>규격</th><th>산출근거</th><th>몫</th><th>수량</th><th>비고</th></tr></thead>
                  <tbody>{고른물량.줄.map((x, i) => <tr key={i}><td>{x.항목}</td><td>{x.규격}</td><td className="mono">{x.식}</td><td className="num">{x.몫 < 1 ? '1/' + Math.round(1 / x.몫) : ''}</td><td className="num">{수글(x.수량몫, 3)}</td><td className="muted">{x.비고}</td></tr>)}</tbody>
                </table>
              </div>
            </details>
          )}
        </div>
      )}

  </>)
  const 층복사판 = (
      <div className="gmd-bar small">
        <span className="muted">층 복사:</span>
        <span>{층 === M.층[0].이름 ? 'FT 는 복사하지 않습니다' : <>{층}층의 기둥 · 보 · 벽 · 슬라브를 →</>}</span>
        {층 !== M.층[0].이름 && 위층.filter((f) => f !== 층).map((f) => (
          <label key={f} className="gmd-kv"><input type="checkbox" checked={복사받을.includes(f)} onChange={(e) => set복사받을((P) => (e.target.checked ? [...P, f] : P.filter((x) => x !== f)))} /> {f}층</label>
        ))}
        {층 !== M.층[0].이름 && <button type="button" className="btn line sm" disabled={!복사받을.length} onClick={복사하기}>복사</button>}
        <button type="button" className="btn line sm" onClick={() => { if (이층.length && window.confirm((층FT(M, 층) ? 'FT' : 층 + '층') + ' 부재 ' + 이층.length + '개를 지울까요?')) 모두('지움') }}>이 층 비우기</button>
        <span className="muted">· 층 더하기는 ① 통심 · 층에서</span>
      </div>
  )
  if (작업) {
    return (
      <div className={'gmd-ws-body view-' + 보기}>
        <aside className="gmd-ws-left" aria-label="도구">
          <div className="gmd-ws-floors" role="group" aria-label="층">
            {[...M.층].reverse().map((f) => <button key={f.이름} type="button" className={'gmd-ws-floor' + (f.이름 === 층 ? ' on' : '')} aria-pressed={f.이름 === 층} onClick={() => { set층(f.이름); set고른(null) }}>{FT층(f) ? 'FT' : f.이름 + '층'}<small>{M.부재.filter((o) => o.층 === f.이름).length}</small></button>)}
          </div>
          {도구판}
          {도움판}
          {한꺼번에판}
          {층복사판}
        </aside>
        <section className="gmd-ws-center">
          <div className="gmd-ws-views" role="group" aria-label="보기">
            {[['3D', '🧊 3D'], ['평면', '📐 평면'], ['나란히', '◫ 나란히']].map(([k, t]) => <button key={k} type="button" className={'gmd-tool' + (보기 === k ? ' on' : '')} aria-pressed={보기 === k} onClick={() => set보기(k)}>{t}</button>)}
          </div>
          <div className="gmd-work">
            {평면판}
            {삼차원판}
          </div>
        </section>
        <aside className="gmd-ws-right" aria-label="물량">
          {S && !S.오류 && <요약줄 S={S} />}
          {고른것 ? 고름판 : <p className="muted gmd-p">👆 «고르기» 로 부재를 누르면 크기 · 물량 · 산출 줄이 여기에 나옵니다.</p>}
          {S && !S.오류 && S.층별 && S.층별.length > 0 && (
            <div className="gmd-tablewrap"><table className="gmd-table small">
              <thead><tr><th>층</th><th>부재</th><th>개수</th><th>콘크리트 ㎥</th></tr></thead>
              <tbody>{S.층별.filter((r) => r.층 === 층).map((r, i) => <tr key={i}><td>{r.층 === 'FT' ? 'FT' : r.층 + '층'}</td><td>{r.종류}</td><td className="num">{r.개수}</td><td className="num">{수글(r.콘크리트)}</td></tr>)}</tbody>
            </table></div>
          )}
        </aside>
      </div>
    )
  }

  return (
    <div className="card gmd-build">
      {도구판}
      {도움판}
      {한꺼번에판}
      <div className={'gmd-work' + (크게 ? ' big' : '')}>
        {평면판}
        {삼차원판}
      </div>

      {고름판}

      {층복사판}
      {S && !S.오류 && <요약줄 S={S} />}
    </div>
  )
}
const 층FT = (M, 층) => FT층(M.층.find((f) => f.이름 === 층))

function 요약줄({ S }) {
  return (
    <div className="gmd-sum">
      <span>콘크리트 <b>{수글(S.합.콘크리트)}</b> ㎥</span>
      <span>거푸집 <b>{수글(S.합.거푸집, 2)}</b> ㎡</span>
      <span>철근 <b>{수글(S.합.철근 / 1000, 3)}</b> ton</span>
      {S.경고.length > 0 && <span className="gmd-warn">⚠ 경고 {S.경고.length}</span>}
      {S.검사.some((z) => !z.좋음) && <span className="gmd-warn">⚠ 검사</span>}
    </div>
  )
}

/* ───────────────────────── ④ 물량 */
function 물량칸({ M, S, 엑셀받기, 받는중, set탭, set고른, set층 }) {
  if (!M.부재.length) return <div className="card"><p>아직 세운 부재가 없습니다. <button type="button" className="gmd-link" onClick={() => set탭('세우기')}>③ 세우기</button>에서 세우거나, 위의 «가상 예시» 로 해 보십시오.</p></div>
  if (!S || S.오류) return <div className="card"><p className="gmd-warn">셈을 하지 못했습니다 — {S && S.오류}</p></div>
  const 합표 = (S.R.집계 && S.R.집계.합) || []
  const 줄 = (r, i, 앞) => (
    <tr key={i}>{앞}<td className="num">{r.개수}</td><td className="num">{수글(r.콘크리트)}</td><td className="num">{수글(r.거푸집, 2)}</td><td className="num">{수글(r.철근 / 1000, 4)}</td></tr>
  )
  const 겹친 = (S.검사.find((z) => z.겹친) || {}).겹친 || []
  return (
    <div className="card">
      <요약줄 S={S} />
      <div className="gmd-top">
        <button type="button" className="btn" style={{ width: 'auto' }} onClick={엑셀받기} disabled={!!받는중}>{받는중 ? '만드는 중…' : '📊 엑셀 산출서 받기'}</button>
        <span className="muted gmd-p">산출서(산출식 · =ROUND(식,3)) · 집계 · 부재별 · 모델 시트 — 엑셀에서 다시 셉니다.</span>
      </div>
      <h2 className="gmd-h">층별</h2>
      <div className="gmd-tablewrap"><table className="gmd-table">
        <thead><tr><th>층</th><th>부재</th><th>개수</th><th>콘크리트 ㎥</th><th>거푸집 ㎡</th><th>철근 ton</th></tr></thead>
        <tbody>{S.층별.map((r, i) => 줄(r, i, <><td>{r.층 === 'FT' ? 'FT' : r.층 + '층'}</td><td>{r.종류}</td></>))}</tbody>
      </table></div>
      <h2 className="gmd-h">부호별</h2>
      <div className="gmd-tablewrap"><table className="gmd-table">
        <thead><tr><th>부재</th><th>부호</th><th>개수</th><th>콘크리트 ㎥</th><th>거푸집 ㎡</th><th>철근 ton</th></tr></thead>
        <tbody>{S.부호별.map((r, i) => 줄(r, i, <><td>{r.종류}</td><td>{r.부호}</td></>))}</tbody>
      </table></div>
      <h2 className="gmd-h">규격별(할증 넣은 내역 수량)</h2>
      <div className="gmd-tablewrap"><table className="gmd-table">
        <thead><tr><th>항목</th><th>규격</th><th>단위</th><th>산출</th><th>할증 %</th><th>내역</th></tr></thead>
        <tbody>{합표.map((r, i) => <tr key={i}><td>{r.항목}</td><td>{r.규격}</td><td>{r.단위}</td><td className="num">{수글(r.산출)}</td><td className="num">{r.할증}</td><td className="num">{수글(r.내역)}</td></tr>)}</tbody>
      </table></div>
      <h2 className="gmd-h">검사</h2>
      <ul className="gmd-check">
        {S.검사.map((z, i) => <li key={i} className={z.좋음 ? 'ok' : 'bad'}>{z.좋음 ? '✓' : '⚠'} {z.글}</li>)}
        {겹친.slice(0, 30).map((x, i) => <li key={'k' + i} className="bad sub"><button type="button" className="gmd-link" onClick={() => { const o = M.부재.find((u) => u.id === x.ids[0]); if (o) { set층(o.층); set고른(o.id); set탭('세우기') } }}>{x.글}</button></li>)}
      </ul>
      {S.경고.length > 0 && (<>
        <h2 className="gmd-h">경고 {S.경고.length}</h2>
        <ul className="gmd-check">{S.경고.slice(0, 80).map((w, i) => <li key={i} className="bad">⚠ {w}</li>)}</ul>
      </>)}
      <details className="gmd-lines-d">
        <summary>산출서 미리 보기({S.R.줄.length}줄)</summary>
        <div className="gmd-tablewrap"><table className="gmd-table small">
          <thead><tr><th>층</th><th>부재</th><th>기호</th><th>항목</th><th>규격</th><th>산출근거</th><th>수량</th><th>비고</th></tr></thead>
          <tbody>{S.R.줄.slice(0, 400).map((x, i) => <tr key={i}><td>{x.층}</td><td>{x.부재}</td><td>{x.기호}</td><td>{x.항목}</td><td>{x.규격}</td><td className="mono">{x.식}</td><td className="num">{수글(x.수량)}</td><td className="muted">{x.비고}</td></tr>)}</tbody>
        </table></div>
      </details>
      <p className="muted gmd-p">셈 규칙: 보 = 폭×(춤−슬라브)×안목(받침 면 사이) · 기둥 = 단면×(층고−슬라브) · 슬라브 = 보 가운데까지(옆 슬라브 없는 변은 보 · 벽 바깥 면까지)×두께 · 벽 = (길이−단부)×(높이−위 보 춤 또는 슬라브) · 거푸집은 골조 수량산출과 같음 · 철근은 KDS 정착 · 이음.</p>
    </div>
  )
}
