/**
 * /change/work — 🧰 설계변경 작업대 (2026-09-30, G72)
 *
 * 소장님(9/30): 설계박사(엑셀 추가기능) · 콘엑스(웹)에 있고 우리에게 빠진 것 「다 만들자」 — 1단계 «설계변경 묶음».
 *   · 2줄(당초 · 변경) 내역서 → 1줄 내역서(변경 · 당초 골라서)          「2칸짜리 변경내역을 1칸짜리로」
 *   · 당초 · 변경 1줄 내역서 두 개(또는 차수마다 여럿) → 짝을 지어 2줄 변경내역서  「당초 · 차수분 자동 매칭 · 신규 자동 행추가」
 *   · 공사비증감대비표 · 공사비물량대비표 · 내역서총괄표 · 차수(연차)별 대비표
 *   · 검산 — 금액 = 수량 × 단가(원 미만 버림) · 합계 = 노무 + 재료 + 경비 · 공종 합계 · 총액 / 값만 남은 내역서에 수식을 다시 넣음
 * ■ 셈은 lib/변경내역.js · 쓰기는 lib/변경엑셀쓰기.js · .xls 는 lib/xls읽기.js
 * ■ 파일은 브라우저 안에서만 다룹니다. 서버로 올라가지 않습니다.
 */
import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { askAfter } from '../AskComment'
import { 끌어놓기 as 끌어놓기판 } from '../끌어놓기.jsx'

const 원 = (n) => (typeof n === 'number' && Number.isFinite(n) ? Math.round(n).toLocaleString('ko-KR') : '—')
const 꼴맞음 = /\.(xlsx|xlsm|xls)$/i

export default function ChangeWork() {
  const [lib, setLib] = useState(null)
  const [파일들, set파일들] = useState([])     /* [{id, 이름, 크기, 읽은, 시트, 상태이름}] */
  const [바쁨, set바쁨] = useState('')
  const [오류, set오류] = useState('')
  const [할것, set할것] = useState({ 한줄: true, 여러줄: true, 대비: true, 총괄: true, 차수: true, 검산: true })
  const [한줄상태, set한줄상태] = useState(-1)       /* -1 = 마지막 상태 */
  const [대비a, set대비a] = useState(0)
  const [대비b, set대비b] = useState(-1)             /* -1 = 마지막 */
  const [빼기0, set빼기0] = useState(true)
  const [결과, set결과] = useState(null)             /* {url, 이름, 크기} */
  const 칸 = useRef(null)
  const 번호 = useRef(0)

  const 싣기 = async () => {
    if (lib) return lib
    const [q, v] = await Promise.all([import('../lib/qtoxlsx.js'), import('../lib/변경내역.js')])
    const m = { readWorkbook: q.readWorkbook, ...v }
    setLib(m)
    return m
  }

  const 열기 = async (fs) => {
    const 받을 = [...(fs || [])].filter((f) => 꼴맞음.test(f.name))
    if (!받을.length) { set오류('엑셀 파일(.xlsx · .xls)만 됩니다.'); return }
    set오류(''); set결과(null)
    set바쁨('파일을 읽는 중입니다…')
    await new Promise((r) => setTimeout(r, 30))
    try {
      const m = await 싣기()
      const 새 = []
      for (const f of 받을) {
        const buf = new Uint8Array(await f.arrayBuffer())
        try {
          const 읽은 = m.파일읽기(m.readWorkbook(buf), f.name)
          새.push({ id: ++번호.current, 이름: f.name, 크기: f.size, 읽은, 시트: 읽은.고른, 상태이름: '' })
        } catch (e) {
          set오류(`${f.name} — ${e?.message || '읽지 못했습니다.'}`)
        }
      }
      set파일들((old) => {
        const 모두 = [...old, ...새]
        /* 1줄 파일 두 개면 처음 이름을 «당초 · 변경» 으로 */
        return 모두.map((x, i) => ({ ...x, 상태이름: x.상태이름 || 기본이름(모두, i) }))
      })
    } finally { set바쁨('') }
  }

  const 빼기 = (id) => { set파일들((fs) => fs.filter((x) => x.id !== id)); set결과(null) }
  const 옮기기 = (i, d) => {
    set파일들((fs) => {
      const a = fs.slice()
      const j = i + d
      if (j < 0 || j >= a.length) return fs
      ;[a[i], a[j]] = [a[j], a[i]]
      return a
    })
    set결과(null)
  }
  const 고치기 = (id, 바꿀) => { set파일들((fs) => fs.map((x) => (x.id === id ? { ...x, ...바꿀 } : x))); set결과(null) }

  /* 합친 모형 — 파일 하나면 그 시트, 여럿이면 짝을 지어 */
  const 모형 = useMemo(() => {
    if (!lib || !파일들.length) return null
    const 시트들 = 파일들.map((f) => f.읽은.시트들.find((s) => s.시트 === f.시트) || f.읽은.시트들[0])
    try {
      if (시트들.length === 1) return 시트들[0]
      return lib.맞추기(시트들, 파일들.map((f) => f.상태이름))
    } catch (e) {
      return { 오류: e?.message || '맞추지 못했습니다.' }
    }
  }, [lib, 파일들])

  const S = 모형 && 모형.상태 ? 모형.상태.length : 0
  const 끝 = Math.max(0, S - 1)
  const 한줄s = 한줄상태 < 0 || 한줄상태 >= S ? 끝 : 한줄상태
  const 가 = Math.min(대비a, 끝), 나 = 대비b < 0 || 대비b >= S ? 끝 : 대비b
  const 요 = useMemo(() => (lib && 모형 && !모형.오류 ? lib.요약(모형, 가, 나) : null), [lib, 모형, 가, 나])
  const 검 = useMemo(() => {
    if (!lib || !파일들.length) return []
    const out = []
    for (const f of 파일들) {
      const s = f.읽은.시트들.find((x) => x.시트 === f.시트) || f.읽은.시트들[0]
      for (const m of lib.검산(s)) out.push({ ...m, 파일: f.이름 })
    }
    return out
  }, [lib, 파일들])
  const 확인수 = 검.filter((m) => m.무게 === '확인').length

  const 만들기 = async () => {
    if (!모형 || 모형.오류) return
    set바쁨('엑셀을 만드는 중입니다…'); set오류('')
    if (결과?.url) { try { URL.revokeObjectURL(결과.url) } catch { /* 지나갑니다 */ } }
    set결과(null)
    await new Promise((r) => setTimeout(r, 30))
    try {
      const m = await 싣기()
      const 줄할 = {
        한줄: 할것.한줄 ? 한줄s : null,
        여러줄: 할것.여러줄 && S > 1 ? Array.from({ length: S }, (_, i) => i) : null,
        대비: 할것.대비 && S > 1 ? [가, 나] : null,
        총괄: 할것.총괄 ? (S > 1 ? Array.from({ length: S }, (_, i) => i) : [0]) : null,
        차수: 할것.차수 && S > 2,
        검산: 할것.검산 ? 검 : null,
      }
      const 부 = `${파일들.map((f) => f.이름).join(' · ')} — K-건설맵 설계변경 작업대에서 만듦(${new Date().toLocaleDateString('ko-KR')})`
      const 쓸모형 = { ...모형, 부제: 부 }
      const bytes = m.만들기(쓸모형, { ...줄할, 빼기0: S > 1 ? 빼기0 : false })
      const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const base = 파일들.length === 1 ? 파일들[0].이름.replace(/\.(xlsx|xlsm|xls)$/i, '') : '설계변경'
      set결과({ url: URL.createObjectURL(blob), 이름: `${base}_작업대.xlsx`, 크기: bytes.length })
    } catch (e) {
      set오류(e?.message || '만들다가 멈췄습니다.')
    } finally { set바쁨('') }
  }

  const 받기 = () => {
    if (!결과) return
    const a = document.createElement('a')
    a.href = 결과.url; a.download = 결과.이름
    document.body.appendChild(a); a.click(); a.remove()
    try { askAfter('change') } catch { /* 사생활 보호 모드 */ }
  }

  return (
    <>
      <div className="card lead-card">
        <h1 style={{ margin: 0, fontSize: 20 }}>🧰 설계변경 작업대</h1>
        <p className="why2" style={{ marginBottom: 6 }}>
          내역서 엑셀(<b>.xlsx · .xls</b>)을 올리면 <b>2줄 → 1줄</b>, <b>당초 · 변경 짝짓기</b>,{' '}
          <b>증감 · 물량 대비표</b>, <b>차수별 대비표</b>, <b>검산</b>을 한 번에 만들어 드립니다.
        </p>
        <p className="muted" style={{ margin: 0 }}>
          <b>파일은 이 브라우저 안에서만 다룹니다.</b> 서버로 올라가지 않습니다. 새로 만든 엑셀에는 <b>살아 있는 수식</b>이 들어갑니다.
        </p>
      </div>

      <div className="card">
        <div className="sec-title">이렇게 씁니다</div>
        <ul className="flist">
          <li><b>2줄 변경내역서 하나</b>를 올리면 → 변경(또는 당초)만 남긴 <b>1줄 내역서</b> · 증감대비표 · 물량대비표 · 총괄표</li>
          <li><b>당초 내역서 + 변경 내역서</b>(1줄 두 개)를 올리면 → 품목을 짝지어 <b>2줄 변경내역서</b>(신규 품목은 제자리에 끼우고, 없어진 품목은 변경 0)</li>
          <li><b>차수(연차) 내역서</b>(①총괄당초 ②총괄변경 ③1차 … 처럼 «구분» 칸이 있는 것)나 파일 여럿 → <b>차수별 대비표</b></li>
          <li><b>값만 남은 내역서</b>(적산 프로그램이 내보낸 것) → 금액 · 합계에 <b>수식을 다시 넣은</b> 내역서 + 틀린 곳 검산</li>
        </ul>
      </div>

      {/* ── ① 파일 ── */}
      <div className="card">
        <div className="sec-title">① 내역서 올리기 <em className="muted" style={{ fontStyle: 'normal', fontWeight: 400 }}>· 여러 개를 한꺼번에 올려도 됩니다</em></div>
        <div className="tldrop" onClick={() => 칸.current?.click()}
             onDragOver={(e) => e.preventDefault()}
             onDrop={(e) => { e.preventDefault(); 열기(e.dataTransfer?.files) }}>
          <input ref={칸} type="file" accept=".xlsx,.xlsm,.xls" multiple hidden
                 onChange={(e) => { 열기(e.target.files); e.target.value = '' }} />
          <끌어놓기판 글="내역서(엑셀)를 놓으면 엽니다" 길들={[{ 꼴: 꼴맞음, 받기: (fs) => 열기(fs), 여럿: true }]} />
          <b>＋ 엑셀 파일을 끌어 놓거나 누르십시오</b>
          <span>.xlsx · .xls · .xlsm — 당초 · 변경 두 파일이면 둘 다 올리십시오</span>
        </div>
        {바쁨 && <div className="muted" style={{ marginTop: 8 }}>{바쁨}</div>}
        {오류 && <div className="cwarn" style={{ marginTop: 8 }}>⚠️ {오류}</div>}

        {파일들.length > 0 && (
          <div className="cw-files">
            {파일들.map((f, i) => {
              const s = f.읽은.시트들.find((x) => x.시트 === f.시트) || f.읽은.시트들[0]
              const 합 = lib ? lib.요약(s).합 : []
              return (
                <div className="cw-file" key={f.id}>
                  <div className="cw-fh">
                    <b>{파일들.length > 1 ? `${i + 1}. ` : ''}{f.이름}</b>
                    <span className="muted">{원(f.크기 / 1024)} KB</span>
                    <span className="grow" />
                    {파일들.length > 1 && <>
                      <button className="btn sm ghost" disabled={i === 0} onClick={() => 옮기기(i, -1)} aria-label="앞으로">↑</button>
                      <button className="btn sm ghost" disabled={i === 파일들.length - 1} onClick={() => 옮기기(i, 1)} aria-label="뒤로">↓</button>
                    </>}
                    <button className="btn sm ghost" onClick={() => 빼기(f.id)}>빼기</button>
                  </div>
                  <div className="cw-fr">
                    <label>시트{' '}
                      <select value={f.시트} onChange={(e) => 고치기(f.id, { 시트: e.target.value })}>
                        {f.읽은.시트들.map((x) => <option key={x.시트} value={x.시트}>{x.시트} · {x.꼴} · 품목 {x.품목수}</option>)}
                      </select>
                    </label>
                    {파일들.length > 1 && s.상태.length === 1 && (
                      <label>이름{' '}
                        <input type="text" value={f.상태이름} maxLength={20} size={10}
                               onChange={(e) => 고치기(f.id, { 상태이름: e.target.value })} />
                      </label>
                    )}
                  </div>
                  <div className="cw-fs muted">
                    <b>{s.꼴}</b> · 품목 {원(s.품목수)} · 공종 {원(s.줄.filter((x) => x.꼴 === '공종').length)}
                    {s.상태.length > 1 && <> · 상태 {s.상태.join(' / ')}</>}
                    <br />
                    순공사비 {s.상태.map((st, k) => <span key={k}>{k ? ' · ' : ''}{s.상태.length > 1 ? st + ' ' : ''}<b>{원(합[k])}</b>원</span>)}
                    {s.별도 && s.별도.length > 0 && <><br />순공사비 밖으로 뺀 공종(관급자재 등): {s.별도.join(' · ')}</>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── ② 한눈에 ── */}
      {모형 && 모형.오류 && <div className="card"><div className="cwarn">⚠️ {모형.오류}</div></div>}
      {모형 && !모형.오류 && 요 && (
        <div className="card">
          <div className="sec-title">② 한눈에{파일들.length > 1 ? ' — 파일끼리 짝지은 결과' : ''}</div>
          <div className="cw-tiles">
            <div><span>품목</span><b>{원(요.품목)}</b></div>
            <div><span>공종</span><b>{원(요.공종)}</b></div>
            {모형.상태.map((st, k) => (
              <div key={k}><span>{S > 1 ? st : '순공사비'}</span><b>{원(요.합[k])}</b></div>
            ))}
          </div>
          {S > 1 && (
            <>
              <div className="cw-pick">
                <label>견줄 두 상태{' '}
                  <select value={가} onChange={(e) => set대비a(+e.target.value)}>
                    {모형.상태.map((st, k) => <option key={k} value={k}>{st}</option>)}
                  </select>
                  {' → '}
                  <select value={나} onChange={(e) => set대비b(+e.target.value)}>
                    {모형.상태.map((st, k) => <option key={k} value={k}>{st}</option>)}
                  </select>
                </label>
              </div>
              <div className="cw-tiles">
                <div><span>증감</span><b className={요.합[나] - 요.합[가] >= 0 ? 'cw-up' : 'cw-dn'}>{요.합[나] - 요.합[가] >= 0 ? '+' : ''}{원(요.합[나] - 요.합[가])}</b></div>
                <div><span>신규 품목</span><b>{원(요.셈.신규)}</b></div>
                <div><span>없어진 품목</span><b>{원(요.셈.삭제)}</b></div>
                <div><span>수량 바뀜</span><b>{원(요.셈.수량)}</b></div>
                <div><span>단가 바뀜</span><b>{원(요.셈.단가)}</b></div>
              </div>
            </>
          )}
          <div className={확인수 ? 'cwarn' : 'cok'} style={{ marginTop: 10 }}>
            {확인수
              ? <>🔎 <b>손으로 확인하실 곳 {확인수}군데</b> — 금액이 수량 × 단가와 다르거나 공종 합계가 품목 합과 다릅니다(아래 목록 · 엑셀의 «검산» 시트).</>
              : <>✅ 모든 품목의 금액이 «수량 × 단가(원 미만 버림)» 와 맞고, 공종 합계도 맞습니다.</>}
          </div>
          {확인수 > 0 && (
            <ul className="flist" style={{ marginTop: 6 }}>
              {검.filter((m) => m.무게 === '확인').slice(0, 12).map((m, i) => (
                <li key={i}>{파일들.length > 1 ? <span className="muted">{m.파일} · </span> : null}
                  {m.r ? <span className="muted">{m.r}행 · </span> : null}<b>{m.이름}</b>{m.상태 && m.상태 !== '값' ? ` (${m.상태})` : ''} — {m.무엇}:
                  {' '}적힌 {원(m.올린값)} · 다시 셈 {원(m.셈값)}</li>
              ))}
              {확인수 > 12 && <li className="muted">… 나머지는 엑셀의 «검산» 시트에 있습니다.</li>}
            </ul>
          )}
        </div>
      )}

      {/* ── ③ 만들 것 ── */}
      {모형 && !모형.오류 && (
        <div className="card">
          <div className="sec-title">③ 무엇을 만들까요</div>
          <div className="cw-opts">
            <label><input type="checkbox" checked={할것.한줄} onChange={(e) => set할것({ ...할것, 한줄: e.target.checked })} />{' '}
              <b>1줄 내역서</b>{S > 1 && <>{' '}— <select value={한줄s} onChange={(e) => set한줄상태(+e.target.value)}>
                {모형.상태.map((st, k) => <option key={k} value={k}>{st}</option>)}</select> 만 남김</>}
              {S === 1 && ' — 금액 · 합계 · 공종 합에 수식을 다시 넣은 것'}
            </label>
            {S > 1 && 할것.한줄 && (
              <label className="cw-sub"><input type="checkbox" checked={빼기0} onChange={(e) => set빼기0(e.target.checked)} />{' '}
                그 상태에서 수량이 0 인 품목(없어진 것 · 아직 안 한 것)은 뺌</label>
            )}
            {S > 1 && <label><input type="checkbox" checked={할것.여러줄} onChange={(e) => set할것({ ...할것, 여러줄: e.target.checked })} />{' '}
              <b>{S === 2 ? '2줄 변경내역서' : `${S}줄 차수내역서`}</b> — 품목마다 {S === 2 ? '당초 · 변경' : '상태마다 한 줄'}(뒤 줄은 적색)</label>}
            {S > 1 && <label><input type="checkbox" checked={할것.대비} onChange={(e) => set할것({ ...할것, 대비: e.target.checked })} />{' '}
              <b>공사비증감대비표 · 공사비물량대비표</b> — {모형.상태[가]} → {모형.상태[나]}</label>}
            <label><input type="checkbox" checked={할것.총괄} onChange={(e) => set할것({ ...할것, 총괄: e.target.checked })} />{' '}
              <b>내역서총괄표</b> — 공종마다 합계 · 노무비 · 재료비 · 경비</label>
            {S > 2 && <label><input type="checkbox" checked={할것.차수} onChange={(e) => set할것({ ...할것, 차수: e.target.checked })} />{' '}
              <b>차수(연차)별 대비표</b> — 품목마다 모든 상태의 수량 · 금액을 옆으로</label>}
            <label><input type="checkbox" checked={할것.검산} onChange={(e) => set할것({ ...할것, 검산: e.target.checked })} />{' '}
              <b>검산</b> 시트</label>
          </div>
          <div className="btn-row" style={{ marginTop: 10 }}>
            <button className="btn primary" disabled={!!바쁨} onClick={만들기}>{바쁨 ? '만드는 중…' : '엑셀 만들기'}</button>
            {결과 && <button className="btn primary" onClick={받기}>⬇ {결과.이름} 내려받기</button>}
          </div>
          {결과 && <p className="muted" style={{ marginBottom: 0 }}>{원(결과.크기 / 1024)} KB · 엑셀에서 열면 수식을 한 번 다시 셈합니다.</p>}
        </div>
      )}

      <div className="card">
        <div className="sec-title">알아 두실 것</div>
        <ul className="flist">
          <li><b>셈 규칙</b> — 금액 = 수량 × 단가(<b>원 미만 버림</b>), 합계 = 노무비 + 재료비 + 경비. 실제 변경내역서 1,400여 칸으로 맞춰 봤습니다.</li>
          <li><b>조달수수료 · 공구손료</b>처럼 수량 칸이 비율인 줄은 셈이 달라 <b>적힌 값을 그대로</b> 둡니다(검산에 «참고» 로 적음).</li>
          <li><b>관급자재 · 기타공사비</b>처럼 순공사비 밖에 두는 공종은, 공종 줄에 적힌 합을 보고 찾아서 순공사비에서 뺍니다.</li>
          <li>2줄 내역서에서 <b>변경 줄에 품명 · 규격을 바꿔 적은 것</b>(예: 말뚝 종류를 바꾼 것)도 한 품목으로 읽습니다.</li>
          <li>파일 둘을 맞출 때는 <b>공종 이름 + 품명 · 규격 · 단위</b>가 같은 것끼리 짝짓습니다. 규격을 바꾼 품목은 «없어진 것 + 신규» 로 보입니다.</li>
          <li><b>.xls</b>(엑셀 97-2003)도 읽습니다 — 값만 읽으므로 새 엑셀은 우리 서식으로 만듭니다. <b>원래 서식 그대로</b> 줄만 벌리려면 <Link to="/change/twoline">2줄 자동변환</Link>을 쓰십시오.</li>
        </ul>
        <div className="btn-row">
          <Link className="btn ghost" to="/change">← 설계변경으로</Link>
          <Link className="btn ghost" to="/change/twoline">🔁 2줄 자동변환(서식 그대로)</Link>
          <Link className="btn ghost" to="/change/calc">🧮 증감 계산기</Link>
          <Link className="btn ghost" to="/qna">이상한 데가 있으면 한 줄</Link>
        </div>
      </div>
    </>
  )
}

function 기본이름(모두, i) {
  const 한줄 = 모두.filter((x) => (x.읽은.시트들.find((s) => s.시트 === x.시트) || x.읽은.시트들[0]).상태.length === 1)
  if (모두.length === 2 && 한줄.length === 2) return i === 0 ? '당초' : '변경'
  if (i === 0) return '당초'
  return `${i}회 변경`
}
