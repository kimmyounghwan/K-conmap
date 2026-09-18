/**
 * /naeyeok/ratio — 「내역서 비율 맞추기」 (2026-09-18)
 *
 * 소장님: 「내역서를 올리면 이 내역서를 80%에 맞춰서 하면 내역서가 자동으로 80%로
 *          맞춰지는 도구. 원가계산서, 내역서 등이 자동으로 되는 것. 만들어줘」
 *
 * ■ 셋이 «같은 셈» 입니다 — 그래서 한 도구로 만들었습니다
 *      하도급 내역서   도급 내역서 × 하도급률
 *      실행 내역서     도급 내역서 × 실행률
 *      계약 내역서     설계 내역서 × 낙찰률
 *
 * ■ 두 가지로 내드립니다
 *    ① 올리신 엑셀 «그대로» — 서식·인쇄영역·수식을 살린 채 단가만 갈아 끼웁니다
 *    ② 새 엑셀 한 벌 — 내역서 · 대비표 · 원가계산서 · 시트별 집계 · 쓴표
 *
 * ■ 파일은 브라우저 안에서만 다룹니다. 아무것도 올라가지 않습니다.
 * ■ 셈은 lib/비율.js 에 있습니다 — 화면은 값을 받아 보여 주기만 합니다.
 */
import { useCallback, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { askAfter } from '../AskComment'

const fmt = (n) => new Intl.NumberFormat('ko-KR').format(Math.round(n || 0))
const pct = (r) => (Math.round(r * 1000000) / 10000).toLocaleString('ko-KR') + '%'
const kb = (n) => new Intl.NumberFormat('ko-KR').format(Math.round(n / 1024))

/* ⚠️ styles.css 의 «.tlopts label input { width:15px }» 는 라디오·체크상자용입니다.
   글자 칸까지 15px 로 눌러 버려서 «44,000,000» 이 «44» 로 보였습니다 — 여기서 되돌립니다. */
const 칸꼴 = (w) => ({
  width: w, height: 'auto', padding: '5px 8px', fontSize: 13.5, textAlign: 'right',
  border: '1px solid var(--line)', borderRadius: 7,
  background: 'var(--surface)', color: 'var(--text)', flex: '0 0 auto',
})

export default function Ratio() {
  const [lib, setLib] = useState(null)
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const [file, setFile] = useState(null)      /* {name, size, buf} */
  const [온것, set온것] = useState(null)       /* 파일에서 읽은 것 전부 */
  const [고른시트, set고른시트] = useState([]) /* 그 가운데 «쓸» 시트 */

  const [모드, set모드] = useState('비율')     /* '비율' | '금액' */
  const [비율글, set비율글] = useState('80')
  const [목표글, set목표글] = useState('')
  const [단수꼴, set단수꼴] = useState('버림')
  const [노무고정, set노무고정] = useState(false)
  const [단수조정, set단수조정] = useState(true)
  const [일감, set일감] = useState('하도급 내역서')

  const [out, setOut] = useState(null)        /* {url, name, 말} */
  const inputRef = useRef(null)

  const loadLib = useCallback(async () => {
    if (lib) return lib
    const m = await import('../lib/비율.js')
    setLib(m)
    return m
  }, [lib])

  const openFile = useCallback(async (f) => {
    if (!f) return
    setErr(''); setOut(null); set온것(null); set고른시트([]); setFile(null)
    if (!/\.(xlsx|xlsm)$/i.test(f.name)) {
      setErr(/\.xls$/i.test(f.name)
        ? '구형 엑셀(.xls)은 아직 못 읽습니다. 엑셀에서 «다른 이름으로 저장 → Excel 통합 문서(.xlsx)» 한 뒤 올려 주십시오.'
        : '엑셀 파일(.xlsx / .xlsm)만 됩니다.')
      return
    }
    setBusy('내역서를 읽는 중입니다…')
    try {
      const m = await loadLib()
      const buf = await f.arrayBuffer()
      const g = m.readNaeyeok(buf, f.name)
      setFile({ name: f.name, size: f.size, buf })
      set온것(g)
      set고른시트(m.고를만한시트(g.시트들))
    } catch (e) {
      setErr((e && e.message) || '읽지 못했습니다.')
    } finally { setBusy('') }
  }, [loadLib])

  /* 고른 시트만으로 다시 모읍니다 — 파일을 다시 읽지는 않습니다 */
  const 읽은 = useMemo(() => {
    if (!온것 || !lib) return null
    if (!고른시트.length) return null
    return lib.시트고르기(온것, 고른시트)
  }, [온것, lib, 고른시트])

  /* 설정이 바뀔 때마다 다시 셉니다 */
  const 결과 = useMemo(() => {
    if (!읽은 || !lib) return null
    try {
      return {
        값: lib.맞추기(읽은, {
          비율: 모드 === '비율' ? Number(String(비율글).replace(/[^\d.]/g, '')) : 0,
          목표: 모드 === '금액' ? Number(String(목표글).replace(/[^\d.]/g, '')) : 0,
          단수꼴, 노무고정,
        }),
        탈: '',
      }
    } catch (e) { return { 값: null, 탈: (e && e.message) || '셈하지 못했습니다.' } }
  }, [읽은, lib, 모드, 비율글, 목표글, 단수꼴, 노무고정])

  const R = 결과 && 결과.값

  const 만들기 = async (어느) => {
    if (!R || !file || !lib) return
    setBusy('엑셀을 만드는 중입니다…'); setErr('')
    if (out && out.url) { try { URL.revokeObjectURL(out.url) } catch (e) { /* 지나갑니다 */ } }
    setOut(null)
    await new Promise((r) => setTimeout(r, 40))
    try {
      let bytes, name, 말 = []
      if (어느 === '원본') {
        const got = lib.원본고치기(file.buf, 읽은, R)
        bytes = got.bytes
        name = file.name.replace(/\.(xlsx|xlsm)$/i, '') + '_' + (Math.round(R.비율 * 10000) / 100) + '%.xlsx'
        말 = [
          ['갈아 끼운 칸', fmt(got.칸) + '칸'],
          ['그대로 둔 수식', fmt(got.지킨수식) + '칸 — 단가를 가리키는 금액 수식이라 저절로 다시 셈됩니다'],
          ['값으로 바꾼 수식', fmt(got.지운수식) + '칸 — 단가를 가리키지 않는 수식이라 값을 넣었습니다'],
        ].concat(got.경고.map((x) => ['⚠️ ' + x[0], x[1]]))
        if (단수조정 && R.목표 && R.차액 !== 0) {
          말.push(['⚠️ 단수조정', '원본을 그대로 고치는 쪽은 «줄을 새로 넣지» 못합니다. ' +
            '차액 ' + fmt(R.차액) + '원은 그대로 남습니다 — 새 엑셀 쪽에는 「단수조정」 줄이 들어갑니다.'])
        }
      } else {
        bytes = lib.toBiyulXlsx(읽은, R, { 단수조정, 원본이름: file.name, 일감 })
        name = '내역서_' + (Math.round(R.비율 * 10000) / 100) + '%_원가계산서.xlsx'
        말 = [
          ['시트', '내역서 · 대비표 · 원가계산서 · 시트별 집계 · 쓴표'],
          ['원가계산서', 읽은.셋있나
            ? '재료비·노무비·경비를 내역서에서 그대로 받았습니다. 요율(노란 칸)은 맞춰 보십시오.'
            : '재료비·노무비·경비 갈래가 없어 «0» 으로 두었습니다 — 손으로 넣으십시오.'],
        ]
      }
      const url = URL.createObjectURL(new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }))
      setOut({ url, name, 말 })
      try { askAfter('biyul') } catch (e) { /* 사생활 보호 모드 */ }
    } catch (e) {
      setErr((e && e.message) || '만들지 못했습니다.')
    } finally { setBusy('') }
  }

  const 미리 = R ? R.rows.slice(0, 12) : []

  return (
    <div className="wrap">
      <div className="card lead-card">
        <h1 style={{ margin: 0, fontSize: 20 }}>📉 내역서 비율 맞추기</h1>
        <p className="why2" style={{ marginBottom: 6 }}>
          내역서를 올리고 <b>비율(예 80%)</b> 이나 <b>맞출 금액</b>만 넣으시면,
          단가가 그 비율로 바뀐 <b>내역서</b>와 <b>원가계산서</b>가 나옵니다.
        </p>
        <p className="muted" style={{ margin: 0 }}>
          <b>하도급 내역서</b>(도급 × 하도급률) · <b>실행 내역서</b>(도급 × 실행률) ·
          <b> 계약 내역서</b>(설계 × 낙찰률) — 셈이 같아 한 도구로 만들었습니다.
          파일은 <b>브라우저 안에서만</b> 다룹니다. 저희 쪽으로 올라가지 않습니다.
        </p>
      </div>

      {/* ── ① 파일 ── */}
      <div className="card">
        <div className="sec-title">① 내역서 올리기</div>
        <div className={`tldrop${file ? ' on' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); openFile(e.dataTransfer?.files?.[0]) }}>
          <input ref={inputRef} type="file" accept=".xlsx,.xlsm" hidden
            onChange={(e) => openFile(e.target.files?.[0])} />
          {file
            ? <><b>{file.name}</b><span>{kb(file.size)} KB · 다른 파일을 올리려면 누르십시오</span></>
            : <><b>＋ 내역서를 끌어 놓거나 누르십시오</b>
              <span>.xlsx · .xlsm — 단가가 «채워진» 내역서라야 합니다 (공내역서는 곱할 것이 없습니다)</span></>}
        </div>
        {busy && <div className="muted" style={{ marginTop: 8 }}>{busy}</div>}
        {err && <div className="cwarn" style={{ marginTop: 8 }}>⚠️ {err}</div>}
        {온것 && (
          <div style={{ marginTop: 10 }}>
            {읽은 ? (
            <p style={{ margin: '0 0 6px' }}>
              내역 <b>{fmt(읽은.rows.length)}줄</b> · 당초 합계 <b>{fmt(읽은.합)}원</b>
              {읽은.셋있나
                ? <span> · <b>재료비·노무비·경비</b>가 갈려 있습니다 — 원가계산서까지 자동으로 채웁니다</span>
                : <span className="muted"> · 재료비·노무비·경비 갈래가 없습니다 — 원가계산서는 «0» 으로 둡니다</span>}
            </p>
            ) : <p className="cwarn" style={{ margin: '0 0 6px' }}>⚠️ 쓸 시트를 하나 이상 켜 주십시오.</p>}
            {온것.시트들.length > 1 && (
              <div className="tlsheets" style={{ marginBottom: 10 }}>
                {온것.시트들.map((x) => {
                  const 켬 = 고른시트.indexOf(x.시트) >= 0
                  return (
                    <div className={`tlrow${켬 ? ' on' : ''}`} key={x.시트}>
                      <label className="tlchk">
                        <input type="checkbox" checked={켬}
                          onChange={(e) => set고른시트((v) => (e.target.checked
                            ? v.concat([x.시트]) : v.filter((y) => y !== x.시트)))} />
                        <b>{x.시트}</b>
                      </label>
                      <span className="muted" style={{ fontSize: 12.5 }}>
                        {fmt(x.rows.length)}줄 · {fmt(x.합)}원
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
            {온것.시트들.length > 1 && (
              <p className="muted" style={{ margin: '0 0 8px', fontSize: 12.5, lineHeight: 1.8 }}>
                ⚠️ 산출내역서 한 벌에는 <b>일위대가 · 단가산출 · 중기단가</b>가 같이 들어 있습니다.
                전부 켜면 <b>일위대가가 내역서 단가 속에 또 들어가 두 번 세어집니다.</b>
                그래서 <b>내역서다운 시트만</b> 켜 두었습니다 — 틀렸으면 고쳐 주십시오.
              </p>
            )}
            {읽은 && 읽은.특수줄 > 0 && (
              <p className="muted" style={{ margin: '0 0 6px', fontSize: 12.5, lineHeight: 1.8 }}>
                <b>수량 × 단가 ≠ 금액</b>인 줄이 {fmt(읽은.특수줄)}줄 있습니다 —
                「공구손료 및 경장비의 기계경비」처럼 <b>수량 칸이 요율(%)</b>인 줄이거나 금액만 적힌 줄입니다.
                그 줄은 다시 곱하지 않고 <b>금액에 바로</b> 비율을 곱했습니다.
              </p>
            )}
            <div className="muted" style={{ fontSize: 12.5, lineHeight: 1.8 }}>
              {온것.시트말.slice(0, 10).join(' / ')}
            </div>
          </div>
        )}
      </div>

      {/* ── ② 얼마로 ── */}
      {읽은 && (
        <div className="card">
          <div className="sec-title">② 얼마로 맞출까요</div>
          <div className="tlopts">
            <div>
              <b>어떻게</b>
              <label><input type="radio" checked={모드 === '비율'} onChange={() => set모드('비율')} /> 비율(%)로</label>
              <label><input type="radio" checked={모드 === '금액'} onChange={() => set모드('금액')} /> 맞출 금액으로</label>
            </div>
            <div>
              <b>{모드 === '비율' ? '비율' : '맞출 금액'}</b>
              {모드 === '비율' ? (
                <label>
                  <input type="text" inputMode="decimal" style={칸꼴(78)} value={비율글}
                    onChange={(e) => set비율글(e.target.value.replace(/[^\d.]/g, ''))} /> %
                </label>
              ) : (
                <label>
                  <input type="text" inputMode="numeric" style={칸꼴(158)}
                    value={목표글 ? fmt(Number(String(목표글).replace(/[^\d.]/g, ''))) : ''}
                    placeholder="예) 480,000,000"
                    onChange={(e) => set목표글(e.target.value.replace(/[^\d.]/g, ''))} /> 원
                </label>
              )}
            </div>
            <div>
              <b>단수</b>
              <label>
                <select value={단수꼴} onChange={(e) => set단수꼴(e.target.value)}>
                  <option value="버림">원 미만 버림</option>
                  <option value="반올림">원 미만 반올림</option>
                  <option value="10원버림">10원 미만 버림</option>
                  <option value="100원버림">100원 미만 버림</option>
                </select>
              </label>
            </div>
            <div>
              <b>노무비</b>
              <label><input type="checkbox" checked={노무고정}
                onChange={(e) => set노무고정(e.target.checked)} /> 노무비는 <b>그대로</b> 두기</label>
              {모드 === '금액' && (
                <label><input type="checkbox" checked={단수조정}
                  onChange={(e) => set단수조정(e.target.checked)} /> 「단수조정」 줄로 정확히 맞추기</label>
              )}
            </div>
            <div>
              <b>쓰임</b>
              <label>
                <select value={일감} onChange={(e) => set일감(e.target.value)}>
                  <option>하도급 내역서</option>
                  <option>실행 내역서</option>
                  <option>계약 내역서(낙찰률)</option>
                  <option>견적 조정</option>
                  <option>(안 적음)</option>
                </select>
              </label>
            </div>
          </div>
          {노무고정 && (
            <div className="note" style={{ marginTop: 10 }}>
              노무비 합계 <b>{fmt(R ? R.노무합 : 0)}원</b>에는 비율을 곱하지 않고,
              <b> 나머지로만</b> 맞춥니다. 노무비를 깎는 것은 뒤에 다툼이 되기 쉬운 자리입니다.
            </div>
          )}
          {결과 && 결과.탈 && <div className="cwarn" style={{ marginTop: 10 }}>⚠️ {결과.탈}</div>}
        </div>
      )}

      {/* ── 셈 ── */}
      {R && (
        <div className="card">
          <div className="sec-title">이렇게 됩니다</div>
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl left">
              <tbody>
                <tr><th style={{ width: 140 }}>당초 합계</th><td><b>{fmt(R.원합)}</b> 원</td></tr>
                <tr><th>넣은 비율</th><td><b>{pct(R.비율)}</b>{노무고정 && <span className="muted"> — 노무비를 뺀 나머지에만</span>}</td></tr>
                <tr><th>비율 합계</th><td><b style={{ fontSize: 17 }}>{fmt(R.합)}</b> 원</td></tr>
                <tr><th>실제 비율</th><td>{pct(R.실비율)} <span className="muted">— 줄마다 단수를 깎아 넣은 비율과 조금 다릅니다</span></td></tr>
                {R.목표 !== null && (
                  <tr>
                    <th>차액</th>
                    <td>
                      <b style={{ color: R.차액 === 0 ? undefined : '#c00000' }}>{fmt(R.차액)}</b> 원
                      {R.차액 !== 0 && (단수조정
                        ? <span className="muted"> — 새 엑셀에 「단수조정」 줄로 넣어 정확히 맞춥니다</span>
                        : <span className="muted"> — 줄마다 단수를 깎아 생긴 것입니다</span>)}
                    </td>
                  </tr>
                )}
                {읽은.셋있나 && (
                  <tr>
                    <th>갈래별</th>
                    <td className="muted">
                      재료비 {fmt(R.갈래합['재료비'])} · 노무비 {fmt(R.갈래합['노무비'])} · 경비 {fmt(R.갈래합['경비'])} 원
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {R.비율 > 1 && (
            <div className="note" style={{ marginTop: 10 }}>
              비율이 <b>100%를 넘습니다</b> ({pct(R.비율)}). 올리는 것이 맞습니까?
            </div>
          )}
          <div className="tlprev" style={{ marginTop: 12 }}>
            <table className="tbl left">
              <thead>
                <tr>
                  <th>공종</th><th>규격</th><th>단위</th><th>수량</th>
                  <th>당초 단가</th><th>당초 금액</th><th>바뀐 단가</th><th>바뀐 금액</th>
                </tr>
              </thead>
              <tbody>
                {미리.map((x, i) => (
                  <tr key={i}>
                    <td>{String(x.공종).slice(0, 22)}</td>
                    <td>{String(x.규격).slice(0, 16)}</td>
                    <td>{x.단위}</td>
                    <td>{x.수량 === null ? '' : x.수량}</td>
                    <td>{x.총단가 === null ? '' : fmt(x.총단가)}</td>
                    <td>{x.총금액 === null ? '' : fmt(x.총금액)}</td>
                    <td><b>{x.새단가 === null ? '' : fmt(x.새단가)}</b></td>
                    <td><b>{fmt(x.새금액)}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted" style={{ marginBottom: 0 }}>
            앞 {미리.length}줄만 보여 드립니다. 엑셀에는 {fmt(R.rows.length)}줄이 모두 들어갑니다.
          </p>
        </div>
      )}

      {/* ── ③ 내려받기 ── */}
      {R && (
        <div className="card">
          <div className="sec-title">③ 내려받기 — 두 가지로 드립니다</div>
          <div className="btn-row" style={{ justifyContent: 'flex-start', flexWrap: 'wrap' }}>
            <button className="btn primary" disabled={!!busy} onClick={() => 만들기('원본')}>
              📄 올린 엑셀 «그대로» 고치기
            </button>
            <button className="btn ghost" disabled={!!busy} onClick={() => 만들기('새것')}>
              📊 새 엑셀 한 벌 (내역서 · 대비표 · 원가계산서)
            </button>
          </div>
          <div className="muted" style={{ fontSize: 12.5, marginTop: 8, lineHeight: 1.85 }}>
            <b>그대로 고치기</b> — 서식·인쇄영역·병합·매크로가 남습니다. 발주처 서식 그대로 내실 때.
            금액이 <code>=수량×단가</code> 수식이면 손대지 않고 단가만 갈아 끼웁니다.
            <br />
            <b>새 엑셀 한 벌</b> — 우리 서식입니다. <b>원가계산서</b>와 <b>당초↔비율 대비표</b>가 같이 나옵니다.
            검산하실 때, 그리고 원가계산서가 필요하실 때.
          </div>
          {out && (
            <div style={{ marginTop: 12 }}>
              <a className="btn primary" href={out.url} download={out.name}>⬇ {out.name}</a>
              <ul className="flist" style={{ marginTop: 10 }}>
                {out.말.map((x, i) => <li key={i}><b>{x[0]}</b> · {x[1]}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── 어떻게 세나 ── */}
      <div className="card">
        <div className="sec-title">어떻게 세나 — 적어 둡니다</div>
        <ul className="flist">
          <li><b>«단가»에 곱합니다.</b> 금액에만 곱하면 <b>단가 × 수량 ≠ 금액</b>이 되어 서류가 반려됩니다.
            단가에 곱해 단수를 맞추고, 금액은 그 단가로 다시 셉니다.</li>
          <li><b>재료비·노무비·경비는 갈래마다</b> 곱하고, <b>합계는 셋을 더해</b> 만듭니다.
            합계에 따로 곱하면 재료+노무+경비 ≠ 합계 가 됩니다.</li>
          <li><b>맞출 금액을 넣으시면</b> 비율을 거꾸로 셉니다(맞출 금액 ÷ 당초 합계).
            줄마다 단수를 깎으므로 조금 모자랍니다 — 그 차액을 숨기지 않고 보여 드리고,
            원하시면 「단수조정」 한 줄로 정확히 맞춥니다.</li>
          <li><b>소계·합계 줄은 우리가 다시 더합니다.</b> 원본을 그대로 고칠 때
            그 줄이 «수식이 아니라 숫자»로 박혀 있으면 손대지 못합니다 —
            그때는 <b>몇 행인지 알려 드립니다.</b></li>
          <li><b>관급자재·지급자재는 비율 대상이 아닌 경우가 많습니다.</b>
            내역서에서 빼고 올리시거나, 나온 뒤에 그 줄만 되돌리십시오.</li>
        </ul>
      </div>

      {/* ── 미리 말씀드립니다 ── */}
      <div className="card">
        <div className="sec-title">미리 말씀드립니다</div>
        <ul className="muted" style={{ margin: 0, paddingLeft: 20, lineHeight: 2, fontSize: 13 }}>
          <li>비율이 낮으면 발주자의 <b>하도급계약 적정성 심사</b> 대상이 될 수 있습니다
            (건설산업기본법 제31조 · 같은 법 시행령 제34조).
            기준 비율은 <b>원문과 발주처 지침</b>을 확인하십시오 — 여기에 숫자를 적어 두지 않습니다.</li>
          <li><b>노무비를 깎는 것</b>은 뒤에 다툼이 되기 쉽습니다. 「노무비는 그대로」 를 켜면
            노무비에는 곱하지 않고 나머지로만 맞춥니다.</li>
          <li>원가계산서의 <b>요율은 2026년 조달청 공고 내역서에서 옮긴 값</b>입니다.
            해마다·공사 종류마다 다릅니다. <b>노란 칸</b>에서 고쳐 쓰십시오.</li>
          <li>이 도구는 <b>비율을 곱해 줄 뿐</b> 무엇이 맞는 비율인지는 정해 드리지 않습니다.</li>
        </ul>
        <div className="btn-row" style={{ justifyContent: 'flex-start', marginTop: 12, flexWrap: 'wrap' }}>
          <Link className="btn ghost" to="/naeyeok">📋 내역서 작성 대행</Link>
          <Link className="btn ghost" to="/change/twoline">🔁 설계변경 2줄 자동변환</Link>
          <Link className="btn ghost" to="/tools">🧰 건설 도구</Link>
        </div>
      </div>
    </div>
  )
}
