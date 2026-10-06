/**
 * /naeyeok/hado — 「하도급 내역서 만들기」 (G171 · 2026-10-06)
 *
 * 소장님: 「하도급 내역서 만드는 것은 현재 건설맵에 하도급내역서 만들기 탭에 이런 방식으로 하도급 내역서 만들기 프로그램 만들어」
 *   본보기 = 송금지구_하도급완성본2(앞 채팅에서 Claude 가 만든 6장) — 셈은 lib/하도급내역.js
 *   원도급 내역서를 올리고 하도급율만 넣으면 6장 한 벌(율 칸 하나로 전부 다시 셈)
 * ■ 파일은 브라우저 안에서만 다룹니다.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { askAfter } from '../AskComment'
import { 세기 } from '../lib/받은수.jsx'
import { 끌어놓기 as 끌어놓기판 } from '../끌어놓기.jsx'

const fmt = (n) => new Intl.NumberFormat('ko-KR').format(Math.round(n || 0))
const kb = (n) => new Intl.NumberFormat('ko-KR').format(Math.round(n / 1024))
const 칸꼴 = (w) => ({ width: w, height: 'auto', padding: '5px 8px', fontSize: 13.5, textAlign: 'right', border: '1px solid var(--line)', borderRadius: 7, background: 'var(--surface)', color: 'var(--text)', flex: '0 0 auto' })
const 글칸 = (w) => ({ ...칸꼴(w), textAlign: 'left' })

export default function Hado() {
  const [libs, setLibs] = useState(null)        /* { m: 비율.js, h: 하도급내역.js, v: 변경내역.js, q: qtoxlsx.js } */
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const [file, setFile] = useState(null)
  const [온것, set온것] = useState(null)
  const [고른시트, set고른시트] = useState([])
  const [상태들, set상태들] = useState(null)    /* 당초 · 변경 여러 줄 내역서면 { 상태:[…], 꼴 } */
  const [상태번호, set상태번호] = useState(0)
  const [책, set책] = useState(null)            /* 고른 상태로 «편» 시트들 */
  const [율글, set율글] = useState('80')
  const [단수꼴, set단수꼴] = useState('버림')
  const [공사명, set공사명] = useState('')
  const [원사, set원사] = useState('')
  const [하사, set하사] = useState('')
  const [발주처, set발주처] = useState('')
  const [직접, set직접] = useState(() => new Set())
  const [관급끔, set관급끔] = useState(() => new Set())
  const [찾기, set찾기] = useState('')
  const [out, setOut] = useState(null)
  const inputRef = useRef(null)

  const loadLibs = useCallback(async () => {
    if (libs) return libs
    try {
      const [m, h, v, q] = await Promise.all([import('../lib/비율.js'), import('../lib/하도급내역.js'), import('../lib/변경내역.js'), import('../lib/qtoxlsx.js')])
      const o = { m, h, v, q }; setLibs(o); return o
    } catch (e) { throw new Error('도구를 불러오지 못했습니다 — 화면을 한 번 새로고침해 주십시오.') }
  }, [libs])

  const openFile = useCallback(async (f) => {
    if (!f) return
    setErr(''); setOut(null); set온것(null); set고른시트([]); setFile(null); set직접(new Set()); set관급끔(new Set()); set상태들(null); set책(null)
    if (!/\.(xlsx|xlsm|xls)$/i.test(f.name)) { setErr('엑셀 파일(.xlsx · .xlsm · .xls)만 됩니다.'); return }
    setBusy('내역서를 읽는 중입니다…')
    try {
      const L = await loadLibs()
      const buf = await f.arrayBuffer()
      const 책0 = L.q.readWorkbook(buf)
      const 알 = L.h.상태알기(책0, L.v)
      const 여럿 = 알.상태.length > 1
      const n = 여럿 ? 알.상태.length - 1 : 0          /* 처음엔 마지막 상태(보통 «변경») */
      setFile({ name: f.name, size: f.size, buf, 책0 })
      set상태들(여럿 ? 알 : null); set상태번호(n)
      펴서읽기(L, 책0, 여럿, n, f.name)
      set공사명((v) => v || f.name.replace(/\.(xlsx|xlsm|xls)$/i, '').replace(/^R\d{2}BK\d{8}_?/, '').replace(/[_]+/g, ' ').slice(0, 60))
    } catch (e) { setErr((e && e.message) || '읽지 못했습니다.') } finally { setBusy('') }
  }, [loadLibs])

  /* 고른 상태로 펴서 다시 읽기 — 시트 · 직접시공 줄도 새로 */
  function 펴서읽기(L, 책0, 여럿, n, 이름) {
    const 편 = 여럿 ? L.h.상태펴기(책0, L.v, n) : 책0
    const g = L.m.격자로읽기(편, 이름, { 원가품목: true })
    const 시트 = L.m.고를만한시트(g.시트들)
    set책(편); set온것(g); set고른시트(시트); set관급끔(new Set())
    const 읽은 = 시트.length ? L.m.시트고르기(g, 시트) : null
    set직접(new Set(읽은 ? L.h.직접후보(읽은) : []))
  }
  const 상태고르기 = (n) => {
    if (!libs || !file || !상태들) return
    set상태번호(n); setErr('')
    try { 펴서읽기(libs, file.책0, true, n, file.name) } catch (e) { setErr((e && e.message) || '읽지 못했습니다.') }
  }

  const 읽은 = useMemo(() => (온것 && libs && 고른시트.length ? libs.m.시트고르기(온것, 고른시트) : null), [온것, libs, 고른시트])
  const 율 = Number(String(율글).replace(/[^\d.]/g, '')) || 0
  const 옵션 = useMemo(() => ({ 율, 단수꼴, 관급그대로: true, 관급끔, 직접 }), [율, 단수꼴, 관급끔, 직접])
  const 셈 = useMemo(() => {
    if (!읽은 || !libs || !(율 > 0 && 율 <= 100)) return null
    try { return libs.h.하도급셈(읽은, 옵션) } catch (e) { return null }
  }, [읽은, libs, 옵션, 율])
  useEffect(() => { setOut(null) }, [율글, 단수꼴, 직접, 관급끔, 고른시트, 공사명, 발주처, 원사, 하사, 상태번호])

  const 관급들 = useMemo(() => (읽은 ? 읽은.rows.filter((x) => x.관급) : []), [읽은])
  const 열쇠 = (r) => r.시트 + '#' + r.줄
  const 원줄 = (r) => (책 && 책[r.시트] && 책[r.시트].원행 ? 책[r.시트].원행[r.줄 - 1] || r.줄 : r.줄)   /* 여러 줄 내역서는 원본 엑셀 줄 번호로 */
  const 직접들 = useMemo(() => (읽은 ? 읽은.rows.filter((r) => 직접.has(열쇠(r))) : []), [읽은, 직접])
  const 찾은 = useMemo(() => {
    const q = 찾기.replace(/\s+/g, '')
    if (!읽은 || q.length < 2) return []
    return 읽은.rows.filter((r) => String(r.공종 + r.규격).replace(/\s+/g, '').includes(q) && !직접.has(열쇠(r))).slice(0, 30)
  }, [읽은, 찾기, 직접])
  const 켜끄기 = (r, 켬) => set직접((v) => { const n = new Set(v); if (켬) n.add(열쇠(r)); else n.delete(열쇠(r)); return n })

  const 만들기 = async () => {
    if (!읽은 || !file || !libs) return
    if (!(율 > 0 && 율 <= 100)) { setErr('하도급율을 1 ~ 100 사이로 넣어 주십시오.'); return }
    setBusy('하도급 내역서 6장을 만드는 중입니다…'); setErr('')
    if (out && out.url) { try { URL.revokeObjectURL(out.url) } catch (e) { /* 지나갑니다 */ } }
    setOut(null)
    await new Promise((r) => setTimeout(r, 40))
    try {
      const got = libs.h.하도급한벌(file.buf, 읽은, { ...옵션, 책, 공사명: 공사명.trim(), 발주처: 발주처.trim(), 원도급사: 원사.trim(), 하도급사: 하사.trim() })
      const 상태말 = 상태들 ? '_' + String(상태들.상태[상태번호] || '').replace(/[①-⑳\s]/g, '') : ''
      const name = file.name.replace(/\.(xlsx|xlsm|xls)$/i, '') + 상태말 + '_하도급내역서(' + (Math.round(율 * 100) / 100) + '%).xlsx'
      const url = URL.createObjectURL(new Blob([got.bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
      const 말 = [
        ['여섯 장(송금지구 본보기 차례 · 틀)', got.시트.join(' · ')],
        ['만드는 차례', '내역서 → 하도급 대상내역서 → 하도급내역서 → 직접시공내역서 → 원가계산서 대비표 → 직접시공 원가계산서 — 앞 장 숫자를 다음 장이 받아 셈'],
        ...(상태들 ? [['쓴 줄', '«' + 상태들.상태[상태번호] + '» 금액으로 (' + 상태들.꼴 + ' 내역서 · 원가계산서도 같은 줄)']] : []),
        ['율 칸', '첫 장 «' + got.시트[0] + '» 의 노란 칸 C2 하나 — 고치면 여섯 장이 전부 다시 셈됩니다'],
        ['도급(내역) → 하도급', fmt(got.도급) + '원 → ' + fmt(got.하도급) + '원 (직접시공 ' + fmt(got.직접) + '원' + (got.관급 ? ' · 관급 ' + fmt(got.관급) + '원' : '') + ')'],
        ['원가계산서', got.원가시트 ? '«' + got.원가시트 + '» ' + got.원가줄 + '줄을 원 · 하도급 대비로' + (got.원가도급 !== null ? ' — 도급액 ' + fmt(got.원가도급) + '원 → 하도급 도급액 ' + fmt(got.원가하도급) + '원' : '') : '원가계산서 시트를 못 찾아 직접공사비만'],
        ['맨 윗줄', '«' + got.순라벨 + '»' + (got.순확인 === true ? ' — 원가계산서 직접공사비(재료비 + 직접노무비 + 산출경비)와 맞습니다' : got.순확인 === false ? ' — 원가계산서 직접공사비와 맞지 않습니다(아래 알림)' : ' — 원가계산서가 없어 관급을 뺀 품목 합입니다')],
        ...got.경고.map((w) => ['⚠️ ' + w[0], w[1]]),
      ]
      setOut({ url, name, 말 })
      try { 세기('|하도급|한벌') } catch (e) { /* 지나갑니다 */ }
      try { askAfter('biyul') } catch (e) { /* 사생활 보호 모드 */ }
    } catch (e) { setErr((e && e.message) || '만들지 못했습니다.') } finally { setBusy('') }
  }

  const 전 = 셈 && 셈.전체
  const 원가값 = useMemo(() => {
    if (!읽은 || !libs || !(율 > 0 && 율 <= 100)) return null
    try { return libs.h.원가미리(책, 읽은, 율) } catch (e) { return null }
  }, [읽은, libs, 책, 율])

  return (
    <div className="wrap">
      <div className="card lead-card">
        <h1 style={{ margin: 0, fontSize: 20 }}>🤝 하도급 내역서 만들기</h1>
        <p className="why2" style={{ marginBottom: 6 }}>
          <b>원도급 내역서</b>를 올리고 <b>하도급율</b>만 넣으시면, 하도급 계약에 쓰는 <b>여섯 장 한 벌</b>이 나옵니다 —
          원가계산서 원·하도급 대비표 · 직접시공 원가계산서 · 하도급내역서 · 하도급 대상내역서 · 내역서(원·하도급 나란히) · 직접시공내역서.
        </p>
        <p className="muted" style={{ margin: 0 }}>
          나온 엑셀은 <b>노란 칸(율) 하나만 고치면 여섯 장이 전부 다시 셈</b>됩니다. 단가에 율을 곱하고 금액은 수량 × 단가로 다시 셉니다.
          파일은 <b>브라우저 안에서만</b> 다룹니다.
        </p>
      </div>

      {/* ① 파일 */}
      <div className="card">
        <div className="sec-title">① 원도급 내역서 올리기</div>
        <div className={`tldrop${file ? ' on' : ''}`} onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); openFile(e.dataTransfer?.files?.[0]) }}>
          <input ref={inputRef} type="file" accept=".xlsx,.xlsm,.xls" hidden onChange={(e) => openFile(e.target.files?.[0])} />
          <끌어놓기판 글="원도급 내역서(엑셀)를 놓으면 엽니다" 길들={[{ 꼴: /\.(xlsx|xlsm|xls)$/i, 받기: (fs) => openFile(fs[0]) }]} />
          {file
            ? <><b>{file.name}</b><span>{kb(file.size)} KB · 다른 파일을 올리려면 누르십시오</span></>
            : <><b>＋ 원도급 내역서를 끌어 놓거나 누르십시오</b><span>단가가 «채워진» 도급 · 산출 · 변경내역서(.xlsx · .xls · 당초/변경 2줄도) — 원가계산서 시트가 같이 있으면 원 · 하도급 대비표까지 만듭니다</span></>}
        </div>
        {busy && <div className="muted" style={{ marginTop: 8 }}>{busy}</div>}
        {err && <div className="cwarn" style={{ marginTop: 8 }}>⚠️ {err}</div>}
        {온것 && (
          <div style={{ marginTop: 10 }}>
            {읽은 ? (
              <p style={{ margin: '0 0 6px' }}>
                내역 <b>{fmt(읽은.rows.length)}줄</b> · {상태들 ? <>«{상태들.상태[상태번호]}» </> : ''}합계 <b>{fmt(읽은.합)}원</b>
                {읽은.셋있나 ? <span> · <b>노무비 · 재료비 · 경비</b>가 갈려 있습니다</span> : <span className="muted"> · 갈래(노무 · 재료 · 경비)가 없어 합계로만 셉니다</span>}
              </p>
            ) : <p className="cwarn" style={{ margin: '0 0 6px' }}>⚠️ 쓸 시트를 하나 이상 켜 주십시오.</p>}
            {상태들 && (
              <div className="note" style={{ margin: '4px 0 10px' }}>
                <div style={{ marginBottom: 6 }}>📑 품목마다 <b>{상태들.상태.length}줄</b>({상태들.상태.join(' · ')})로 적힌 <b>{상태들.꼴}</b> 내역서입니다 — 하도급은 <b>어느 줄 금액</b>으로 만들까요?</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {상태들.상태.map((t, i) => (
                    <button key={t + i} type="button" className={`btn ${i === 상태번호 ? 'primary' : 'ghost'}`} style={{ padding: '4px 12px', fontSize: 13, width: 'auto', flex: '0 0 auto', minHeight: 0 }} aria-pressed={i === 상태번호} onClick={() => 상태고르기(i)}>{t}</button>
                  ))}
                </div>
                <div className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>고른 줄로 <b>한 줄씩</b> 펴서 만듭니다. 원가계산서도 같은 줄 금액으로 읽습니다.</div>
              </div>
            )}
            {온것.시트들.length > 1 && (
              <div className="tlsheets" style={{ marginBottom: 8 }}>
                {온것.시트들.map((x) => {
                  const 켬 = 고른시트.indexOf(x.시트) >= 0
                  return (
                    <div className={`tlrow${켬 ? ' on' : ''}`} key={x.시트}>
                      <label className="tlchk"><input type="checkbox" checked={켬} onChange={(e) => set고른시트((v) => (e.target.checked ? v.concat([x.시트]) : v.filter((y) => y !== x.시트)))} /> <b>{x.시트}</b></label>
                      <span className="muted" style={{ fontSize: 12.5 }}>{fmt(x.rows.length)}줄 · {fmt(x.합)}원</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ② 율 · 이름 */}
      {읽은 && (
        <div className="card">
          <div className="sec-title">② 하도급율 · 공사명 · 발주처</div>
          <div className="tlopts">
            <div><b>하도급율</b>
              <label><input type="text" inputMode="decimal" style={칸꼴(78)} value={율글} onChange={(e) => set율글(e.target.value.replace(/[^\d.]/g, ''))} /> %</label>
            </div>
            <div><b>단수</b>
              <label><select value={단수꼴} onChange={(e) => set단수꼴(e.target.value)}><option value="버림">원 미만 버림</option><option value="반올림">원 미만 반올림</option></select></label>
            </div>
            <div><b>공사명</b><label><input type="text" style={글칸(240)} value={공사명} onChange={(e) => set공사명(e.target.value)} placeholder="엑셀 위쪽에 적힙니다" /></label></div>
            <div><b>발주처</b><label><input type="text" style={글칸(200)} value={발주처} onChange={(e) => set발주처(e.target.value)} placeholder="엑셀 위쪽에 적힙니다(선택)" /></label></div>
            <div><b>원도급 → 하도급</b>
              <label><input type="text" style={글칸(130)} value={원사} onChange={(e) => set원사(e.target.value)} placeholder="원도급사(선택)" /></label>
              <label><input type="text" style={글칸(130)} value={하사} onChange={(e) => set하사(e.target.value)} placeholder="하도급사(선택)" /></label>
            </div>
          </div>
          {!(율 > 0 && 율 <= 100) && <div className="cwarn" style={{ marginTop: 8 }}>⚠️ 하도급율을 1 ~ 100 사이로 넣어 주십시오.</div>}
        </div>
      )}

      {/* ③ 하도급에서 뺄 줄 */}
      {읽은 && (
        <div className="card">
          <div className="sec-title">③ 하도급에서 뺄 줄 — 원도급 «직접시공» · 관급</div>
          <p className="muted" style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.8 }}>
            문화재지표조사비 · 폐기물처리비 · 지형도면고시 · 한전 및 통신납입금 · 설계안전성검토비 · 조달청계약요청비 · 공사안전보건대장작성비처럼
            원도급이 직접 내는 줄은 <b>하도급 0 · 직접시공 100%</b>로 둡니다. 이름으로 찾아 켜 두었습니다 — 틀리면 끄시고, 더 뺄 줄은 아래에서 찾아 켜십시오.
          </p>
          {직접들.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="tbl left rt-kg">
                <thead><tr><th>뺌</th><th>시트 · 줄</th><th>품명</th><th>규격</th><th>금액</th></tr></thead>
                <tbody>{직접들.map((r) => (
                  <tr key={열쇠(r)}>
                    <td><input type="checkbox" checked aria-label={`${원줄(r)}행 직접시공`} onChange={() => 켜끄기(r, false)} /></td>
                    <td className="nw">{r.시트} · {원줄(r)}행</td><td>{String(r.공종).slice(0, 26)}</td><td>{String(r.규격 || '').slice(0, 18)}</td>
                    <td className="r">{r.총금액 === null ? '' : fmt(r.총금액)}</td>
                  </tr>))}
                </tbody>
              </table>
            </div>
          ) : <p className="muted" style={{ margin: 0 }}>이름으로 찾은 직접시공 줄이 없습니다.</p>}
          <div style={{ marginTop: 10 }}>
            <label className="muted" style={{ fontSize: 13 }}>🔍 더 뺄 줄 찾기 <input type="text" style={글칸(200)} value={찾기} onChange={(e) => set찾기(e.target.value)} placeholder="품명 두 글자 이상" /></label>
            {찾은.length > 0 && (
              <ul className="flist" style={{ marginTop: 6 }}>
                {찾은.map((r) => <li key={열쇠(r)}><label><input type="checkbox" checked={false} onChange={() => 켜끄기(r, true)} /> {r.시트} · {원줄(r)}행 <b>{String(r.공종).slice(0, 30)}</b> {String(r.규격 || '').slice(0, 20)} <span className="muted">— {fmt(r.총금액)}원</span></label></li>)}
              </ul>
            )}
          </div>
          {관급들.length > 0 && (
            <details style={{ marginTop: 10 }}>
              <summary style={{ cursor: 'pointer', fontWeight: 700 }}>🏛 관급자재 {fmt(관급들.length)}줄 — «관급 지급분» 으로 표기만 (하도급 아님)</summary>
              <div style={{ overflowX: 'auto', marginTop: 6 }}>
                <table className="tbl left rt-kg">
                  <thead><tr><th>관급</th><th>시트 · 줄</th><th>품명</th><th>금액</th></tr></thead>
                  <tbody>{관급들.map((r) => {
                    const k = 열쇠(r), 켬 = !관급끔.has(k)
                    return <tr key={k} className={켬 ? '' : 'off'}><td><input type="checkbox" checked={켬} onChange={(e) => set관급끔((v) => { const n = new Set(v); if (e.target.checked) n.delete(k); else n.add(k); return n })} /></td>
                      <td className="nw">{r.시트} · {원줄(r)}행</td><td>{String(r.공종).slice(0, 26)}</td><td className="r">{r.총금액 === null ? '' : fmt(r.총금액)}</td></tr>
                  })}</tbody>
                </table>
              </div>
            </details>
          )}
        </div>
      )}

      {/* ④ 이렇게 됩니다 */}
      {셈 && (
        <div className="card">
          <div className="sec-title">이렇게 됩니다</div>
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl left">
              <tbody>
                {원가값 && 원가값.도급액 !== null && (
                  <tr><th style={{ width: 150 }}>원가계산서 도급액</th><td><b>{fmt(원가값.도급액)}</b> 원 → <b style={{ fontSize: 17 }}>하도급 도급액 {fmt(원가값.하도급액)}</b> 원 <span className="muted">— 도급액 × {Math.round(율 * 100) / 100}% (원 미만 반올림 · 첫 장 대비표 맨 아래 줄)</span></td></tr>
                )}
                <tr><th style={{ width: 150 }}>내역 합계(도급)</th><td><b>{fmt(전.원.합계)}</b> 원 <span className="muted">— 내역서 품목을 다 더한 것(관급 포함)</span></td></tr>
                <tr><th>하도급 대상</th><td>{fmt(전.대상)} 원 <span className="muted">— 직접시공 {셈.직접수}줄 · 관급 {셈.관급수}줄 뺀 것</span></td></tr>
                <tr><th>하도급 내역 금액</th><td><b>{fmt(전.하.합계)}</b> 원 <span className="muted">— 대상의 {전.대상 ? Math.round(전.하.합계 / 전.대상 * 10000) / 100 : 0}% (품목 단가마다 원 미만 {단수꼴 === '반올림' ? '반올림' : '버림'}) · 하도급내역서 맨 아래 합계</span></td></tr>
                <tr><th>직접시공(내역)</th><td>{fmt(전.직접.합계)} 원</td></tr>
                {전.관급 > 0 && <tr><th>🏛 관급 지급분</th><td>{fmt(전.관급)} 원 <span className="muted">— 어느 쪽에도 넣지 않음</span></td></tr>}
                {셈.셋 && <tr><th>하도급 갈래별</th><td className="muted">노무비 {fmt(전.하['노무비'])} · 재료비 {fmt(전.하['재료비'])} · 경비 {fmt(전.하['경비'])} 원</td></tr>}
              </tbody>
            </table>
          </div>
          {율 < 82 && (
            <div className="note" style={{ marginTop: 10 }}>
              하도급율이 낮으면 발주자의 <b>하도급 적정성 심사</b>(하도급부분 금액의 82% · 예정가격의 64%) 대상이 될 수 있습니다 —{' '}
              <Link to="/tools/subcontract-check">⚖️ 하도급 적정성 판정</Link>에서 확인하십시오.
            </div>
          )}
        </div>
      )}

      {/* ⑤ 내려받기 */}
      {셈 && (
        <div className="card">
          <div className="sec-title">④ 내려받기</div>
          <div className="btn-row" style={{ justifyContent: 'flex-start', flexWrap: 'wrap' }}>
            <button className="btn primary" disabled={!!busy} onClick={만들기}>📄 하도급 내역서 한 벌 (6장 · 율 칸 하나로 전부 다시 셈)</button>
          </div>
          {out && (
            <div style={{ marginTop: 12 }}>
              <a className="btn primary" href={out.url} download={out.name}>⬇ {out.name}</a>
              <ul className="flist" style={{ marginTop: 10 }}>{out.말.map((x, i) => <li key={i}><b>{x[0]}</b> · {x[1]}</li>)}</ul>
            </div>
          )}
          <div className="muted" style={{ fontSize: 12.5, marginTop: 8, lineHeight: 1.85 }}>
            올리신 엑셀 틀 그대로 비율만 바꾼 파일이 필요하시면 <Link to="/naeyeok/ratio">📉 비율 맞추기</Link>(«올린 엑셀 그대로»)를 쓰십시오.
          </div>
        </div>
      )}

      <div className="card">
        <div className="sec-title">어떻게 세나 — 적어 둡니다</div>
        <ul className="flist">
          <li><b>단가에 곱합니다.</b> 노무비 · 재료비 · 경비 단가 × 하도급율(원 미만 버림) → 금액 = 수량 × 단가. 합계는 셋을 더합니다.</li>
          <li><b>직접시공 줄 · 관급 줄은 하도급 0</b>입니다. 직접시공내역서에 원도급 직접(관급은 어느 쪽에도 넣지 않음)으로 남습니다.</li>
          <li><b>만드는 차례대로 이어 받습니다</b> — ⑤ 내역서(원도급) → ④ 하도급 대상내역서(뺄 줄은 비고에 «직접시공 · 관급») → ③ 하도급내역서(대상 줄의 갈래 단가 × 율) → ⑥ 직접시공내역서(도급 − 하도급) → ① 원가계산서 대비표 → ② 직접시공 원가계산서. 시트 차례 · 칸 차례는 송금지구 본보기 그대로입니다.</li>
          <li><b>원가계산서 대비표</b>는 원도급 원가계산서 금액 × 하도급율(원 미만 반올림), <b>직접시공 원가계산서</b>는 도급 × (1 − 하도급율)입니다(본보기 셈).</li>
          <li>내역서 쪽 <b>직접시공금액 = 도급 − 하도급</b>(줄마다)이라 두 금액을 더하면 늘 도급과 같습니다. 엑셀에서 대상내역서 «비고» 에 «직접시공» 이라 적으면 그 줄이 하도급에서 빠집니다.</li>
          <li>공종 머리 · 순공사비 · 합계 줄은 아래 품목을 더하는 수식(SUMIF)입니다 — 품목을 고쳐도 같이 바뀝니다.</li>
          <li><b>당초 · 변경 2줄(또는 차수별 여러 줄) 내역서</b>는 고르신 줄(처음엔 마지막 줄 · 보통 «변경»)의 금액으로 한 줄씩 펴서 만듭니다. 원가계산서도 같은 줄로 읽습니다.</li>
          <li>원본 머리 금액이 아래 품목 합과 다르면(천 원 정리 · 원본 오기) 내려받기 아래에 알려 드립니다 — 새 엑셀은 품목 합으로 셉니다.</li>
        </ul>
        <div className="btn-row" style={{ justifyContent: 'flex-start', marginTop: 12, flexWrap: 'wrap' }}>
          <Link className="btn ghost" to="/naeyeok">📋 내역서 — 다른 도구 · 서식</Link>
          <Link className="btn ghost" to="/tools/subcontract-check">⚖️ 하도급 적정성 판정</Link>
          <Link className="btn ghost" to="/forms/gy-hadogeup">🧾 공사 하도급계약서 서식</Link>
        </div>
      </div>
    </div>
  )
}
