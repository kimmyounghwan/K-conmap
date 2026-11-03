/**
 * /first/hado-gyeonjeok — 🤝 하도급 견적틀 (G518 · 2026-11-03)
 *
 * 소장님(11-02 밤): 「내역서에서 공종별로 모두 견적틀을 만들어서 다운 받게 하면 어때? 그럼 빠지는 공정이 없을거 아니야.」
 *   「1순위가 되면 회사 정보가 있잖아. 제출업체만 적게 표지를 만들어 주면 되는 거고…」 「1순위에 …」
 *   「하도급내역서는 도구로 있으니까? 공종별 견적서만 우선 만들어 봐」 「하도급 견적틀로 하자 …의견대로」
 * ■ 공고 내역서(공내역서 · 설계내역서 엑셀)를 놓으면 공종마다 견적틀(표지 + 내역 · 단가 빈칸) — 나누기 · 엑셀은 lib/견적틀.js
 * ■ 1순위 카드(🤝 하도급 견적틀)에서 오면 주소에 실린 공사명 · 발주처 · 1순위 업체가 표지에 들어갑니다(수신 «○○ 귀중»).
 *   주소에 싣는 것은 공고번호 · 공사명 · 발주처 · 1순위 업체 이름 · 개찰일뿐(전화 · 주소 · 대표 · 사업자번호는 안 실음).
 * ■ 파일은 브라우저 안에서만 다룹니다. 단가는 읽지도 쓰지도 않습니다. 받는 엑셀은 값만(수식 없음) — 화면 글에는 적지 않음(소장님 「값만 다운 — 이건 기재하지마」).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 세기 } from '../lib/받은수.jsx'
import { 끌어놓기 as 끌어놓기판 } from '../끌어놓기.jsx'
import { 바이트받기 } from '../lib/값엑셀.js'
import { 견적틀값 } from '../lib/견적틀주소.js'

const fmt = (n) => new Intl.NumberFormat('ko-KR').format(Math.round(n || 0))
const kb = (n) => new Intl.NumberFormat('ko-KR').format(Math.max(1, Math.round(n / 1024)))
const 수량글 = (v) => new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 4 }).format(v)
const 예시파일 = '/tools/files/ex-hado-gyeonjeok.xlsx'
const g2bUrl = (no, ord) => `https://www.g2b.go.kr/link/PNPE027_01/single/?bidPbancNo=${encodeURIComponent(no)}&bidPbancOrd=${ord || '000'}`
const 오늘 = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }

function zip받기(이름, 바이트) {
  const url = URL.createObjectURL(new Blob([바이트], { type: 'application/zip' }))
  const a = document.createElement('a')
  a.href = url
  a.download = String(이름).replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 60) + '.zip'
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 30000)
  return a.download
}

export default function HadoGyeonjeok() {
  const loc = useLocation()
  const 처음 = useMemo(() => 견적틀값(loc.search), [])   // eslint-disable-line react-hooks/exhaustive-deps
  const [수신, set수신] = useState(처음.원청)
  const [공사명, set공사명] = useState(처음.공사명)
  const [발주처, set발주처] = useState(처음.발주)
  const [공고번호, set공고번호] = useState(처음.no)
  const [L, setL] = useState(null)              /* { g: 견적틀.js, q: qtoxlsx.js } */
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const [file, setFile] = useState(null)
  const [결과, set결과] = useState(null)
  const [단위, set단위] = useState([])           /* 지금 보이는 공종(마디) */
  const [끔, set끔] = useState(() => new Set())  /* 끈 공종 id */
  const [펼침, set펼침] = useState(null)          /* 미리보기 연 공종 id */
  const [관급도, set관급도] = useState(false)
  const [받음, set받음] = useState('')
  const [다른공사, set다른공사] = useState(null)   /* 🔎 G518d — 올린 내역서가 1순위 공고와 다른 공사 같을 때 { 내역, 번호 } */
  const inputRef = useRef(null)
  useEffect(() => { 세기('|견적틀|열기'); if (처음.no) 세기('|견적틀|1순위') }, [])   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { document.title = '하도급 견적틀 — 내역서를 공종별 견적서로(공내역서도 됨 · 표지 + 단가 빈칸) | K-건설맵' }, [])

  const libs = useCallback(async () => {
    if (L) return L
    try {
      const [g, q] = await Promise.all([import('../lib/견적틀.js'), import('../lib/qtoxlsx.js')])
      const o = { g, q }; setL(o); return o
    } catch (e) { throw new Error('도구를 불러오지 못했습니다 — 화면을 한 번 새로고침해 주십시오.') }
  }, [L])

  const 읽기 = useCallback(async (bytes, 이름, 크기) => {
    setErr(''); set결과(null); set단위([]); set끔(new Set()); set펼침(null); set받음(''); set다른공사(null)
    setBusy('내역서를 읽고 공종을 나누는 중입니다…')
    try {
      const o = await libs()
      let 책
      try { 책 = o.q.readWorkbook(bytes) } catch (e) { throw new Error((e && e.message) || '엑셀을 열지 못했습니다.') }
      const R = o.g.견적틀읽기(책, 이름)
      setFile({ name: 이름, size: 크기 })
      if (!R.품목수) {
        setErr('공종 · 품목 표를 못 찾았습니다 — «품명 · 규격 · 단위 · 수량» 칸이 있는 내역서(공내역서 · 설계내역서) 엑셀이어야 합니다. ' +
          '원가계산서 · 총괄표만 있는 파일은 나눌 품목이 없습니다.' + (R.못읽음.length ? `  (시트: ${R.못읽음.slice(0, 4).map((x) => x[0] + ' — ' + x[1]).join(' / ')})` : ''))
        return
      }
      const u = o.g.기본단위(R)
      /* 🔎 G518d — 이 내역서가 어느 공사 것인가(머리글 위 «공사명 :» · 파일 이름 · 맨 위 공사 머리)
         · 1순위 공고에서 왔는데 다른 공사 같으면 알림(표지 · 받는 파일 이름이 1순위 공고 이름으로 나가므로)
         · 1순위 없이 왔고 공사명 칸이 비었으면 내역서의 공사명을 채움(손으로 안 적게) */
      const 내 = o.g.내역공사명(책, 이름, R)
      const 깨끗 = 내.후보.find((h) => !/내역서|입찰용|공고용|게시용|^\(공\)/.test(h)) || ''
      if ((처음.no || 처음.공사명) && !/^예시_/.test(이름) && o.g.같은공사(내, { 공고번호: 처음.no, 공사명: 처음.공사명 }) === 'diff') {
        set다른공사({ 내역: 깨끗 || 내.후보[0] || '', 번호: 내.번호 && 내.번호 !== 처음.no ? 내.번호 : '', 고칠: 깨끗 })
        세기('|견적틀|다른공사')
      } else if (!처음.공사명 && 깨끗 && !/^예시_/.test(이름)) set공사명((v) => (v.trim() ? v : 깨끗.slice(0, 80)))
      set결과(R)
      set단위(u)
      set끔(new Set(u.filter((m) => o.g.꺼둘까(m) || !o.g.품목셈(m)).map((m) => m.id)))
      세기('|견적틀|읽기')
    } catch (e) {
      setErr((e && e.message) || '읽지 못했습니다.')
    } finally { setBusy('') }
  }, [libs])

  const openFile = useCallback(async (f) => {
    if (!f) return
    if (!/\.(xlsx|xlsm|xls)$/i.test(f.name)) { setErr('엑셀 파일(.xlsx · .xlsm · .xls)만 됩니다. 나라장터에서 받은 내역서가 zip 이면 풀어서 엑셀을 놓아 주십시오.'); return }
    읽기(new Uint8Array(await f.arrayBuffer()), f.name, f.size)
  }, [읽기])

  const 예시 = useCallback(async () => {
    setErr(''); setBusy('예시 내역서를 받는 중입니다…')
    try {
      const r = await fetch(예시파일)
      if (!r.ok) throw new Error('예시 파일을 받지 못했습니다.')
      const b = new Uint8Array(await r.arrayBuffer())
      if (!공사명) set공사명('(예시) 가상 소하천 정비공사')
      if (!발주처) set발주처('(예시) 가상군')
      if (!수신) set수신('(예시) 가상건설(주)')
      세기('|견적틀|예시')
      await 읽기(b, '예시_공내역서.xlsx', b.length)
    } catch (e) { setErr((e && e.message) || '예시를 열지 못했습니다.'); setBusy('') }
  }, [읽기, 공사명, 발주처, 수신])

  const 나눠보기 = (m) => {
    set단위((u) => { const i = u.findIndex((x) => x.id === m.id); return i < 0 ? u : [...u.slice(0, i), ...m.아이, ...u.slice(i + 1)] })
    if (L) set끔((s) => { const n = new Set(s); n.delete(m.id); for (const c of m.아이) if (L.g.꺼둘까(c) || !L.g.품목셈(c)) n.add(c.id); return n })
  }
  const 고른 = 단위.filter((m) => !끔.has(m.id))
  const 표지 = { 수신: 수신.trim(), 공사명: 공사명.trim(), 발주처: 발주처.trim(), 공고번호: 공고번호.trim(), 파일: file ? file.name : '', 날: 오늘() }
  const 파일이름 = `하도급견적틀_${(공사명.trim() || (file ? file.name.replace(/\.[^.]+$/, '') : '공사')).slice(0, 30)}`
  const 한파일 = () => {
    if (!L || !고른.length) return
    const n = 바이트받기(파일이름, L.g.견적틀책(고른, 표지, { 관급도 }))
    set받음(`«${n}» 을(를) 받았습니다 — 공종 ${고른.length}개 · 시트마다 견적서 표지 + 내역`)
    세기('|견적틀|받기')
  }
  const 따로 = () => {
    if (!L || !고른.length) return
    const n = zip받기(파일이름, L.g.견적틀묶음(고른, 표지, { 관급도 }))
    set받음(`«${n}» 을(를) 받았습니다 — 공종마다 엑셀 한 개(${고른.length}개)`)
    세기('|견적틀|묶음')
  }
  const 품목합 = 고른.reduce((a, m) => a + (L ? L.g.모든품목(m, 관급도).length : 0), 0)

  return (
    <div className="wrap hgj">
      <div className="card lead-card">
        <h1 style={{ margin: 0, fontSize: 20 }}>🤝 하도급 견적틀 — 내역서를 공종별 견적서로</h1>
        <p className="why2" style={{ marginBottom: 6 }}>
          공고 <b>내역서(공내역서 · 설계내역서 엑셀)</b>를 놓으면 <b>공종마다 견적틀</b>이 나옵니다 — 견적서 표지(받는 곳 · 공사명 · 공종은 채움,
          <b> 제출 업체 칸만 빈칸</b>) + 그 공종의 품명 · 규격 · 단위 · 수량, <b>단가 · 금액은 빈칸</b>.
        </p>
        <p className="muted" style={{ margin: 0 }}>
          내역서의 공종을 <b>전부</b> 나누므로 빠지는 공정이 없습니다(관급자재 · 원가계산 줄만 뺌). 압입 · 항타 · 포장 · 씨드스프레이 같은 전문 공정은 🧱 로 표시합니다.
          파일은 <b>브라우저 안에서만</b> 다룹니다.
        </p>
      </div>

      {처음.no && (
        <div className="card hgj-from">
          <div className="sec-title" style={{ marginTop: 0 }}>🏆 1순위 공고에서 왔습니다</div>
          <div className="hgj-kv">
            <div><span>공사명</span><b>{처음.공사명 || '-'}</b></div>
            <div><span>발주처</span><b>{처음.발주 || '-'}</b></div>
            <div><span>1순위</span><b>{처음.원청 || '-'}</b>{처음.날 ? <i className="muted"> · 개찰 {처음.날}</i> : null}</div>
          </div>
          <p className="muted" style={{ margin: '8px 0 0', fontSize: 13 }}>
            ① 나라장터 공고 원문의 첨부파일에서 <b>공내역서(또는 설계내역서) 엑셀</b>을 받고 ② 아래 칸에 놓으십시오.
            <br />첨부에 내역서가 없는 공고도 있습니다(«물량내역서 해당없음» · 수의시담 등) — 그때는 발주처에서 받은 내역서 엑셀을 놓으시면 됩니다.
          </p>
          <a className="btn ghost sm" style={{ marginTop: 8 }} href={g2bUrl(처음.no, 처음.ord)} target="_blank" rel="noreferrer">나라장터 공고 원문 열기 — 내역서 받기 →</a>
        </div>
      )}

      {/* ① 파일 */}
      <div className="card">
        <div className="sec-title">① 공고 내역서 올리기</div>
        <div className={`tldrop${file ? ' on' : ''}`} onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); openFile(e.dataTransfer?.files?.[0]) }}>
          <input ref={inputRef} type="file" accept=".xlsx,.xlsm,.xls" hidden onChange={(e) => { openFile(e.target.files?.[0]); e.target.value = '' }} />
          <끌어놓기판 글="공고 내역서(엑셀)를 놓으면 공종별로 나눕니다" 길들={[{ 꼴: /\.(xlsx|xlsm|xls)$/i, 받기: (fs) => openFile(fs[0]) }]} />
          {file
            ? <><b>{file.name}</b><span>{kb(file.size)} KB · 다른 파일을 올리려면 누르십시오</span></>
            : <><b>＋ 공내역서 · 설계내역서를 끌어 놓거나 누르십시오</b><span>.xlsx · .xls · .xlsm — 나라장터 공고 첨부의 «내역서» 그대로(단가가 비어 있어도 됩니다)</span></>}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 8 }}>
          <button type="button" className="btn ghost sm hgj-ex" onClick={예시}>🧪 예시 내역서로 해 보기</button>
          <span className="muted" style={{ fontSize: 12.5 }}>지어낸 공사 · 지어낸 수량입니다.</span>
        </div>
        {busy && <div className="muted" style={{ marginTop: 8 }}>{busy}</div>}
        {err && <div className="cwarn" style={{ marginTop: 8 }}>⚠️ {err}</div>}
        {다른공사 && (
          <div className="cwarn hgj-diff" style={{ marginTop: 8 }}>
            ⚠️ <b>이 내역서는 1순위 공고와 다른 공사 같습니다.</b>
            {다른공사.내역 ? <> 내역서: «{다른공사.내역.slice(0, 60)}»</> : null}
            {다른공사.번호 ? <> · 파일 이름의 공고번호 {다른공사.번호}</> : null}
            {' '}· 1순위 공고: «{(처음.공사명 || 처음.no || '').slice(0, 60)}». 맞는 파일인지 확인하십시오(발주처가 옛 내역서 틀을 그대로 쓴 경우도 있습니다).
            {다른공사.고칠 && 공사명.trim() !== 다른공사.고칠.slice(0, 80) ? (
              <div style={{ marginTop: 6 }}>
                <button type="button" className="btn ghost sm" onClick={() => { set공사명(다른공사.고칠.slice(0, 80)); 세기('|견적틀|공사명고침') }}>② 표지 공사명을 내역서 것으로 바꾸기</button>
              </div>
            ) : null}
          </div>
        )}
        {결과 && (
          <p className="hgj-sum" style={{ margin: '10px 0 0' }}>
            공종 <b>{fmt(단위.length)}개</b> · 품목 <b>{fmt(결과.품목수)}줄</b>
            {결과.시트들.length > 1 ? <span className="muted"> · 시트 {결과.시트들.map((s) => s.이름).join(' · ')}</span> : null}
            {결과.단가있음 ? <span className="muted"> · 단가가 든 내역서지만 견적틀에는 <b>단가를 넣지 않습니다</b></span> : null}
          </p>
        )}
      </div>

      {/* ② 표지 */}
      {결과 && (
        <div className="card">
          <div className="sec-title">② 표지에 들어갈 것 <span className="count">· 제출 업체 칸은 빈칸으로 둡니다</span></div>
          <div className="hgj-form">
            <label><span>수신(원청)</span><input value={수신} onChange={(e) => set수신(e.target.value)} placeholder="예) ○○건설(주) — 1순위 업체" maxLength={40} /></label>
            <label><span>공사명</span><input value={공사명} onChange={(e) => set공사명(e.target.value)} placeholder="공고의 공사명" maxLength={80} /></label>
            <label><span>발주처</span><input value={발주처} onChange={(e) => set발주처(e.target.value)} placeholder="예) ○○시" maxLength={40} /></label>
            <label><span>공고번호</span><input value={공고번호} onChange={(e) => set공고번호(e.target.value)} placeholder="R26BK…" maxLength={30} /></label>
          </div>
        </div>
      )}

      {/* ③ 공종 고르기 */}
      {결과 && (
        <div className="card">
          <div className="sec-title">③ 견적 받을 공종 <span className="count">· {fmt(고른.length)}개 고름 · 품목 {fmt(품목합)}줄</span></div>
          <div className="hgj-list">
            {단위.map((m) => {
              const 켬 = !끔.has(m.id)
              const n = L ? L.g.모든품목(m, 관급도 || !!m.관급).length : 0
              const 공정 = L ? L.g.공정표시(m) : ''
              const 열림 = 펼침 === m.id
              return (
                <div className={`tlrow hgj-row${켬 ? ' on' : ''}${m.관급 ? ' gwan' : ''}`} key={m.id}>
                  <label className="tlchk">
                    <input type="checkbox" checked={켬} onChange={(e) => set끔((s) => { const x = new Set(s); if (e.target.checked) x.delete(m.id); else x.add(m.id); return x })} />
                    {' '}<b>{L ? L.g.붙여쓰기(m.글 || m.이름) : (m.글 || m.이름)}</b>
                  </label>
                  <span className="hgj-meta">
                    {m.관급 ? <em className="hgj-tag g">관급 — 견적 대상 아님</em> : null}
                    {공정 ? <em className="hgj-tag">🧱 {공정}</em> : null}
                    <span className="muted">품목 {fmt(n)}</span>
                    {m.아이.length > 1 ? <button type="button" className="hgj-mini" onClick={() => 나눠보기(m)}>▸ {m.아이.length}개로 나누기</button> : null}
                    <button type="button" className="hgj-mini" onClick={() => set펼침(열림 ? null : m.id)}>{열림 ? '▴ 닫기' : '▾ 미리보기'}</button>
                  </span>
                  {열림 && L && (
                    <div className="hgj-pre">
                      <table>
                        <thead><tr><th>품명</th><th>규격</th><th>단위</th><th>수량</th><th>단가</th></tr></thead>
                        <tbody>
                          {L.g.모든품목(m, 관급도 || !!m.관급).slice(0, 12).map((p, i) => (
                            <tr key={p.시트 + p.줄 + '-' + i}><td>{p.이름}</td><td>{p.규격}</td><td>{p.단위}</td><td className="r">{p.수량 === null ? '' : 수량글(p.수량)}</td><td className="blank" /></tr>
                          ))}
                        </tbody>
                      </table>
                      {n > 12 ? <div className="muted" style={{ fontSize: 12 }}>… 모두 {fmt(n)}줄은 엑셀에 있습니다</div> : null}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <label className="licnone" style={{ marginTop: 8 }}>
            <input type="checkbox" checked={관급도} onChange={(e) => set관급도(e.target.checked)} />
            <span>관급자재 줄도 넣기(보통은 견적 대상이 아니라 뺍니다)</span>
          </label>
          <div className="hgj-btns">
            <button type="button" className="btn primary" disabled={!고른.length} onClick={한파일}>📑 한 파일로 받기 — 공종 {fmt(고른.length)}개 · 시트마다</button>
            <button type="button" className="btn ghost" disabled={!고른.length} onClick={따로}>🗂 공종마다 따로 받기(zip) — 업체마다 보내기</button>
          </div>
          {받음 && <div className="note" style={{ marginTop: 8 }}>✅ {받음}</div>}
          <p className="muted" style={{ fontSize: 12.5, margin: '10px 0 0' }}>
            공종이 너무 크게 묶였으면 <b>▸ 나누기</b>로 그 아래 공종을 따로 고르십시오. 단가를 넣어 금액 · 한글 금액까지 셈하려면
            <Link to="/tools/gyeonjeok"> 공사 견적서 도구</Link>에 품목을 붙여 넣으면 됩니다.
          </p>
        </div>
      )}

      <div className="card">
        <div className="sec-title">이렇게 나눕니다</div>
        <ul className="hgj-how">
          <li>단가가 비어 있는 <b>공내역서</b>도 됩니다 — 금액이 아니라 내역서의 <b>꼴</b>(들여쓰기 · 번호 Ⅰ. 1. 1) 가. · 단위 빈칸 · 합계 줄)로 공종 머리를 찾습니다.</li>
          <li>원가계산 줄(간접노무비 · 보험료 · 일반관리비 · 이윤 · 부가세)과 위쪽 총괄(«1. 토공 1 식» 같은 요약)은 품목이 아니라 뺍니다.</li>
          <li>관급자재(도급자설치관급 · 지급자재)는 견적 대상이 아니라 기본으로 뺍니다. 고재 · 작업설(되파는 고철)도 꺼 둡니다.</li>
          <li>나눈 결과는 꼭 한 번 보십시오 — 미리보기로 공종마다 품목을 확인할 수 있습니다.</li>
        </ul>
        <p className="muted" style={{ margin: '6px 0 0', fontSize: 12.5 }}>
          하도급 계약용 내역서(원 · 하도급 대비 6장)는 <Link to="/naeyeok/hado">하도급 내역서 만들기</Link>에 있습니다.
        </p>
      </div>
    </div>
  )
}
