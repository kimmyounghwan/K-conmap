/**
 * 📏 G685 작업 화면 «📏 캐드» 탭 — 캐드에서 고른 것(KCMS) → 줄 · 3D · 수량 · 검사 · 엑셀
 *   소장님 2026-11-14 「적산컨맵 업그레이드 … 캐드로 작업할 수 있게」 · 「편하지만 정확하게」 · 「물론 3D 되어야 하고」
 *   🧪 G686 시험판 — 모든 이용자(화면에 이용권 · 값 말 없음) · 프로그램 없이: 리습만 받아 APPLOAD → «📂 캐드 폴더 잇기»(다운로드\K-conmap · 창을 열 때마다 한 번
 *      — 손잡이를 저장하지 않음: 시크릿 창에서 꺼내면 브라우저가 꺼짐 · lib/캐드폴더.js)
 *   ■ 흐름: 캐드에서 KCMS → 고름 → (적요) → 다운로드\K-conmap(이 화면이 직접 읽음 — lib/캐드폴더.js · 또는 K-적산컨맵 연결 프로그램) → 이 탭에 «묶음» 하나(레이어 · 블록마다 무리)
 *     → 무리 줄에서 갈래(길이 · 길이×높이 · 면적 · 면적×두께 · 개수) · 층 · 높이 · 두께를 한 번에 → 수량(빈칸은 ❓ — 짐작 안 함)
 *     → ⚠ 치수 글과 잰 길이가 다르면 사람이 고름 → 📊 엑셀(받기 전 검사) · 3D(누르면 그 줄로)
 *   ■ 셈 · 검사 · 엑셀 시트는 lib/캐드고름.js 한 곳(시험 tools/시험_캐드고름.mjs · 시험_캐드고름엑셀.mjs · 시험_캐드고름리습.py · 화면 시험_캐드고름화면.mjs)
 */
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { 캐드셈, 캐드3D, 캐드시트, 갈래들, 단위이름, 고를단위, 종류이름, 적요글, 치수남음, 단위바꾸기, 묶음빼기, 묶음더하기, 줄만들기, 고름읽기, 예시고름글, 예시이름, 부재종류, 부재넣기, 부재맞음, 레이어부재, 층고름글 } from './lib/캐드고름.js'
import { 부재보기 } from './lib/bim3d.js'

const 쉼 = (v, n = 3) => (Number.isFinite(v) ? v.toLocaleString('ko-KR', { maximumFractionDigits: n }) : '')
const 어두움 = () => { try { return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches } catch (e) { return false } }
const 무리키 = (r) => r.묶음 + '|' + r.레이어 + '|' + (r.종류 === 'INSERT' ? 'B:' + r.블록 : '')
const 때글 = (t) => { const d = new Date(t); return (d.getMonth() + 1) + '.' + d.getDate() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') }
const 같은값 = (셈, 칸) => { const v = 셈.length ? 셈[0].r[칸] : ''; return 셈.every((x) => x.r[칸] === v) ? v : null }
const 단위차 = ['m', '㎡', '㎥', '개']
const 합글 = (합) => 단위차.filter((u) => 합[u] !== undefined).map((u) => 쉼(합[u]) + ' ' + u).join(' · ')
const 으로 = { 기둥: '기둥으로', 보: '보로', 벽: '벽으로', 슬라브: '슬라브로', 기초: '기초로' }

/* 📏 G686 리습 받기 · 캐드 폴더 잇기(시험판) — 비었을 때 · 줄이 있을 때 둘 다 */
const 리습주소 = '/tools/files/kcm.lsp'
function 폴더줄({ 폴더, 폴더잇기, 세기, 짧게 }) {
  const k = 폴더 ? 폴더.k : '…'
  return (
    <div className={'kcs-folder' + (k === '이어짐' ? ' on' : '')}>
      <a className="btn line sm" href={리습주소} download="kcm.lsp" onClick={() => 세기('|캐드고름|리습받기')}>📥 리습 받기(kcm.lsp)</a>
      {k === '안됨' && <span className="muted">📂 이 브라우저는 폴더를 못 읽습니다 — PC 크롬 · 엣지에서 여십시오</span>}
      {k === '없음' && <><button type="button" className="btn sm" onClick={폴더잇기}>📂 캐드 폴더 잇기</button>{!짧게 && <span className="muted">다운로드 → <b>K-conmap</b> 고르기(창을 열 때마다 한 번 · 다음엔 그 폴더에서 열림)</span>}</>}
      {k === '다시' && <button type="button" className="btn sm" onClick={폴더잇기}>📂 캐드 폴더 다시 잇기(한 번 누름)</button>}
      {k === '이어짐' && <span className="kcs-folder-on">📂 <b>{폴더.이름 || 'K-conmap'}</b> 이어짐{짧게 ? '' : ' — 캐드에서 KCMS 로 고르면 바로 들어옵니다'}</span>}
    </div>
  )
}

export default function 캐드고름판({ 캐드, set캐드, 되돌리기, 되돌림수, 층들, 바닥, 세기, 내려주기, 검사로, 파일이름, 폴더, 폴더잇기, 세운 = null, 세우기 = null, 일람 = null, 못 = null }) {
  /* 🧱 G686 세운 줄(골조 모델로 옮김 — Model.jsx 가 모델 부재의 근거에서 셈)은 이 표 합 · 집계 · 검사에서 빠짐 */
  const C = useMemo(() => 캐드셈(캐드, { 세운 }), [캐드, 세운])
  const [세우는중, set세우는중] = useState(false)
  const [보기, set보기] = useState('모두')              // 모두 · 빈칸(❓) · 치수(⚠)
  const [펼친, set펼친] = useState(() => new Set())
  const [고른, set고른] = useState(null)                // 3D · 표에서 고른 줄 id
  const [알림, set알림] = useState('')
  const [받는중, set받는중] = useState(false)
  const 맞출 = useRef(true)

  /* 무리(묶음 · 레이어 · 블록) */
  const 무리 = useMemo(() => {
    const m = new Map()
    for (const x of C.셈) {
      const 키 = 무리키(x.r)
      if (!m.has(키)) m.set(키, { 키, b: x.b, 레이어: x.r.레이어, 블록: x.r.종류 === 'INSERT' ? x.r.블록 : '', 셈: [] })
      m.get(키).셈.push(x)
    }
    return [...m.values()]
  }, [C])
  /* ⚠ 보기는 치수가 다른 줄을 모두(고른 뒤에도 남겨 무엇을 골랐는지 보고 바꾸게) · ❓ 보기는 아직 수량이 없는 줄 */
  const 맞음 = (x) => (보기 === '빈칸' ? x.수량 === null : 보기 === '치수' ? !!(x.r.치수 && x.r.치수.다름) : true)
  const 보일무리 = 무리.filter((g) => g.셈.some(맞음))

  /* 고침 */
  const 줄고침 = (id, 칸, v) => set캐드((P) => ({ ...P, 줄: P.줄.map((r) => (r.id === id ? { ...r, [칸]: v } : r)) }))
  const 무리고침 = (키, 칸, v) => set캐드((P) => ({ ...P, 줄: P.줄.map((r) => (무리키(r) === 키 ? { ...r, [칸]: v } : r)) }))
  /* 🧱 부재 고르기(lib 부재넣기 — 그 부재로 세울 수 있는 꼴의 줄만 · 부호가 비면 닫힌 선 안 글자(C1 · B1 …) · 기초 · 지중보는 층이 비면 FT) */
  const 부재고침 = (pick, v) => set캐드((P) => ({ ...P, 줄: 부재넣기(P.줄, pick, v, {}, 층들).줄 }))
  const 세우기누름 = async () => {
    if (!세우기 || 세우는중) return
    set세우는중(true)
    try { const 결 = await 세우기(); if (결 && !결.세움) set알림((결.못 && 결.못.length ? '🧱 못 세웠습니다 — ' + 결.못.slice(0, 3).map((x) => x.까닭).join(' / ') : '🧱 새로 세울 것이 없습니다(이미 세웠거나 같은 자리에 있음)')) } finally { set세우는중(false) }
  }
  const 부호들 = (종) => ((일람 && 일람[종]) || []).map((x) => String(x.기호 || '').trim()).filter(Boolean)
  const 줄빼기 = (id) => set캐드((P) => ({ ...P, 줄: P.줄.filter((r) => r.id !== id) }))
  const 무리빼기 = (키) => set캐드((P) => ({ ...P, 줄: P.줄.filter((r) => 무리키(r) !== 키) }))
  const 치수고름 = (id, 씀) => set캐드((P) => ({ ...P, 줄: P.줄.map((r) => (r.id === id ? { ...r, 치수씀: 씀 || undefined, 치수봄: 씀 ? undefined : true } : r)) }))
  const 펴기 = (키, 켬) => set펼친((s) => { const n = new Set(s); if (켬 === undefined ? !n.has(키) : 켬) n.add(키); else n.delete(키); return n })

  const 예시넣기 = () => {
    if (캐드.묶음.some((b) => b.예시)) { set알림('🧪 예시는 이미 들어 있습니다 — 위 묶음 «' + 예시이름 + '»'); return }
    const r = 줄만들기(고름읽기(예시고름글()), { 이름: 예시이름 })
    r.묶음.예시 = true
    set캐드((P) => 묶음더하기(P, r).캐드)
    set알림('🧪 가상 예시 평면(실제 현장 아님)을 넣었습니다 — ' + r.알림.join(' '))
    맞출.current = true
    세기('|캐드고름|예시')
  }

  const 엑셀 = async () => {
    if (!C.셈.length || 받는중) return
    set받는중(true)
    try {
      const [{ ST }, 검] = await Promise.all([import('./lib/qtoxlsx.js'), import('./lib/받기전검사.js')])
      await new Promise((ok) => setTimeout(ok, 20))
      const { sheets, 맞댈 } = 캐드시트(캐드, ST, C)
      const r = 검.받기전검사(sheets, 맞댈)
      const 이름 = '캐드고름_' + (파일이름 || '적산컨맵') + '.xlsx'
      검사로({ ...r, 이름, 셈: '|캐드고름|엑셀' })
      if (r.통과) { 내려주기(new Blob([r.바이트], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 이름); 세기('|캐드고름|엑셀') }
    } catch (e) { set알림('엑셀을 만들지 못했습니다 — ' + ((e && e.message) || e)) } finally { set받는중(false) }
  }

  /* 🧊 3D — 고른 것만 따로(도면 좌표 그대로 · 가운데 0) · 누르면 그 줄로 */
  const 판Ref = useRef(null)
  const 보기Ref = useRef(null)
  const [glErr, setGlErr] = useState('')
  const C늦 = useDeferredValue(C)
  const 덩 = useMemo(() => 캐드3D(C늦.셈, 바닥, { 고른 }), [C늦, 바닥, 고른])
  const 묶음수 = 캐드.묶음.length
  useEffect(() => { 맞출.current = true }, [묶음수])
  useEffect(() => {
    if (!판Ref.current || !C.셈.length) return
    if (!보기Ref.current) {
      try { 보기Ref.current = new 부재보기(판Ref.current) } catch (e) { setGlErr('이 브라우저는 3D(WebGL)를 그리지 못합니다 — 줄 · 수량 · 엑셀은 그대로 씁니다.'); return }
      if (어두움()) { const v0 = 보기Ref.current; v0.bg = [0.086, 0.102, 0.129]; v0.bgT = [0.15, 0.17, 0.21]; v0.bgB = [0.06, 0.07, 0.09]; v0.선색 = [0.03, 0.04, 0.05]; v0.선알 = 0.6 }
      보기Ref.current.hi = [0.98, 0.62, 0.10]
    }
    const v = 보기Ref.current
    v.set부재(덩.덩, { 바닥: true, 바닥색: 어두움() ? [0.16, 0.18, 0.22] : [0.86, 0.88, 0.90] })
    if (맞출.current && 덩.덩.length) { v.fit('tilt'); 맞출.current = false }
    v.onPick = (id) => {
      const 줄id = 덩.줄id.get(id)
      if (!줄id) { set고른(null); return }
      set고른(줄id)
      const r = 캐드.줄.find((z) => z.id === 줄id)
      if (r) { 펴기(무리키(r), true); setTimeout(() => { const el = document.getElementById('kcs-r-' + 줄id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }) }, 60) }
      세기('|캐드고름|3D고름')
    }
  }, [덩, C.셈.length])  // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { if (보기Ref.current) { 보기Ref.current.dispose(); 보기Ref.current = null } }, [])
  useEffect(() => { if (!C.셈.length && 보기Ref.current) { 보기Ref.current.dispose(); 보기Ref.current = null } }, [C.셈.length])

  /* 층 — 보 · 슬라브(바닥꼴)는 «2층 바닥 · 1층»(골조 모델 n층 = n층 기둥 · 벽 + 그 위 바닥 — 도면 «2층 구조평면도» 보는 1층에 듦) */
  const 층칸 = (값, 바꿈, 라벨, 바닥꼴 = false) => (
    <select className={'kcs-in kcs-floor' + (바닥꼴 ? ' kcs-floor-b' : '')} value={값 ?? ''} onChange={(e) => 바꿈(e.target.value)} aria-label={라벨}>
      {값 === null && <option value="">여러 층</option>}
      <option value="">층 —</option>
      {층들.map((f) => <option key={f.이름} value={f.이름}>{층고름글(층들, f.이름, 바닥꼴)}</option>)}
    </select>
  )
  const 바닥꼴 = (부) => 부 === '보' || 부 === '슬라브'
  const 갈래칸 = (값, 바꿈, 라벨) => (
    <select className="kcs-in kcs-kind" value={값 ?? ''} onChange={(e) => e.target.value && 바꿈(e.target.value)} aria-label={라벨}>
      {값 === null && <option value="">여러 갈래</option>}
      {갈래들.map((g) => <option key={g[0]} value={g[0]}>{g[1]}</option>)}
    </select>
  )
  const 글칸 = (값, 바꿈, 라벨, 빈글, 꼴 = '') => (
    <input className={'kcs-in ' + 꼴} value={값 ?? ''} placeholder={값 === null ? '여러 값' : 빈글} inputMode={꼴.includes('kcs-num') ? 'decimal' : undefined} onChange={(e) => 바꿈(e.target.value)} aria-label={라벨} />
  )

  if (!캐드.묶음.length) {
    return (
      <div className="card kcs kcs-empty">
        <h2 className="gmd-h">📏 캐드에서 고른 것 <span className="kcs-beta">시험판</span></h2>
        <p className="gmd-p">캐드에서 명령 <b>KCMS</b> 를 치고 선 · 폴리선 · 호 · 원 · 블록을 고르면 여기에 줄로 들어옵니다. 길이 · 면적 · 개수는 건설맵이 캐드 좌표로 셈하고, <b>높이 · 두께 · 공제 · 횟수</b>만 넣으면 수량이 나옵니다 — 빈칸은 ❓(짐작하지 않음).</p>
        <ol className="gmd-p kcs-steps">
          <li><b>📥 리습 받기</b> → 캐드 명령 <b>APPLOAD</b> → 받은 <b>kcm.lsp</b> → <b>로드</b>(보안 경고가 뜨면 로드) — 다운로드 안에 K-conmap 폴더가 생깁니다. 캐드를 켤 때마다 쓰려면 APPLOAD 창 «시작하기 세트» 에 넣기.</li>
          <li>이 화면 <b>📂 캐드 폴더 잇기</b> → <b>다운로드 → K-conmap</b> → 폴더 선택 → 허용. 창을 새로 열면 한 번 더(다음엔 그 폴더에서 바로 열림).</li>
          <li>도면에서 <b>KCMS</b> → 셀 것을 고르고 엔터 → 적요(예: «1층 벽 W1» · 엔터 = 건너뜀) → 2초쯤 뒤 이 탭에 들어옵니다.</li>
          <li>레이어 · 블록마다 묶인 줄에서 갈래 · 층 · 높이 · 두께를 한꺼번에 넣으면 수량 — 빈칸은 ❓ → <b>📊 엑셀</b>.</li>
          <li>🧱 적요를 «1층 기둥 C1» · «2층 보 G1» 처럼 적으면 부재가 채워지고 <b>🧱 골조 모델에 세우기</b> 한 번 → 3D · 콘크리트 · 거푸집 · 철근 · 물량 탭에서 원 내역과 대조.</li>
        </ol>
        <p className="gmd-p muted">자세한 쓰는 법(갈래 · 치수 다름 · 단위 · 안 될 때): 위 막대 <b>📘 설명서</b> → «📏 캐드에서 고르기».</p>
        <폴더줄 폴더={폴더} 폴더잇기={폴더잇기} 세기={세기} />
        <p className="gmd-p muted">PC 크롬 · 엣지에서 캐드와 같은 PC 로 씁니다. 도면 파일은 보내지 않습니다 — 고른 것의 좌표 · 레이어 · 핸들 · 글자만 이 PC 안에서 오가고, 읽은 파일은 지웁니다. 글자를 같이 고르면 닫힌 선 안 실 이름이 적요가 되고, 치수를 같이 고르면 그려진 길이와 견줍니다. «K-적산컨맵 연결» 프로그램을 쓰시던 분은 그대로 됩니다.</p>
        <div className="gmd-top"><button type="button" className="btn sm" onClick={예시넣기}>🧪 예시(가상 평면)로 해 보기</button></div>
        {알림 && <div className="gmd-note">{알림}</div>}
      </div>
    )
  }

  const 검 = C.검사
  return (
    <div className="kcs">
      <div className="card kcs-head">
        <div className="kcs-titlerow">
          <h2 className="gmd-h">📏 캐드에서 고른 것 <span className="kcs-beta">시험판</span> <span className="muted kcs-sum">{C.셈.length.toLocaleString('ko-KR')}줄 · {합글(C.합) || '수량 없음'}</span></h2>
          <span className="kcs-acts">
            <button type="button" className="btn line sm" onClick={되돌리기} disabled={!되돌림수} title="되돌리기 — 바로 앞으로">↶{되돌림수 ? ' ' + 되돌림수 : ''}</button>
            <button type="button" className="btn line sm" onClick={예시넣기}>🧪 예시</button>
            <button type="button" className="btn sm" onClick={엑셀} disabled={받는중 || !C.셈.length}>{받는중 ? '…' : '📊 엑셀'}</button>
            <button type="button" className="btn line sm" onClick={() => { set캐드(() => ({ 묶음: [], 줄: [] })); set알림('모두 비웠습니다 — ↶ 로 돌아옵니다'); 세기('|캐드고름|비움') }} title="받은 것을 모두 지움(↶ 로 돌아옴)">🗑</button>
          </span>
        </div>
        <폴더줄 폴더={폴더} 폴더잇기={폴더잇기} 세기={세기} 짧게 />
        <div className="kcs-bundles">
          {캐드.묶음.map((b) => {
            const n = 캐드.줄.filter((r) => r.묶음 === b.id).length
            return (
              <span key={b.id} className={'kcs-bundle' + (b.단위 || !n ? '' : ' warn')}>
                <span className="kcs-bname" title={b.도면}>📐 {b.이름 && !/^kcms_\d+\.csv$/i.test(b.이름) ? b.이름 : (b.도면.split(/[\\/]/).pop() || '도면')}{b.적요 ? ' — ' + b.적요 : ''}</span>
                <span className="muted">{n}줄 · {b.단위 ? 단위이름[b.단위] : n ? '단위 ❓' : '단위 없음'} · {때글(b.때)}{b.셈못 ? ' · 셈 못 함 ' + b.셈못 : ''}{b.두번 ? ' · 이미 받음 ' + b.두번 : ''}</span>
                {!b.단위 && n > 0 && (
                  <span className="kcs-units" role="group" aria-label="도면 단위 고르기">
                    ❓ 이 도면 단위: {고를단위.map((u) => <button key={u} type="button" className="btn line sm" onClick={() => { set캐드((P) => 단위바꾸기(P, b.id, u)); 세기('|캐드고름|단위') }}>{단위이름[u]}</button>)}
                  </span>
                )}
                <button type="button" className="gmd-x" onClick={() => set캐드((P) => 묶음빼기(P, b.id))} aria-label={'묶음 빼기 ' + (b.이름 || b.도면)}>✕</button>
              </span>
            )
          })}
        </div>
        <ul className="gmd-check kcs-check">
          {검.단위없음 > 0 && <li className="bad">❓ 도면 단위가 없는 묶음 {검.단위없음} — 위에서 단위를 골라 주십시오(짐작하지 않음).</li>}
          <li className={검.빈칸 ? 'bad' : 'ok'}>{검.빈칸 ? <>❓ 아직 넣을 값이 있는 줄 {검.빈칸} <button type="button" className="gmd-link" onClick={() => set보기(보기 === '빈칸' ? '모두' : '빈칸')}>{보기 === '빈칸' ? '모두 보기' : '❓ 줄만 보기'}</button></> : '✓ 빈칸 없음 — 모든 줄에 수량'}</li>
          {검.틀림 > 0 && <li className="bad">⚠ 숫자가 아닌 칸이 있는 줄 {검.틀림}</li>}
          {검.치수다름 > 0 && <li className="bad">⚠ 치수 글과 그려진 길이가 다른 줄 {검.치수다름} <button type="button" className="gmd-link" onClick={() => set보기(보기 === '치수' ? '모두' : '치수')}>{보기 === '치수' ? '모두 보기' : '⚠ 줄만 보기'}</button></li>}
          {검.높이다름 > 0 && <li className="ok">3D 로 그린 선 {검.높이다름}줄은 평면 길이로 셉니다.</li>}
          {세우기 && 검.세울 > 0 && <li className="kcs-build">🧱 부재를 고른 줄 {검.세울} <button type="button" className="btn sm" onClick={세우기누름} disabled={세우는중}>{세우는중 ? '세우는 중…' : '🧱 골조 모델에 세우기'}</button> <span className="muted">캐드 좌표 그대로 통심 위에 세움 → 세우기 탭 3D · 물량 탭(콘크리트 · 거푸집 · 철근)</span></li>}
          {검.세움 > 0 && <li className="ok">🧱 골조 모델로 세운 줄 {검.세움} — 이 표 합에서 빼고 골조 물량(물량 탭)에서 셉니다(세우기 탭에서 그 부재를 지우면 다시 여기서 셈).</li>}
          {세우기 && !검.세울 && !검.세움 && <li className="ok muted">🧱 스케치업처럼 세우려면 — 무리 줄 «부재» 에서 기둥 · 보 · 벽 · 슬라브 · 기초를 고르고 부호(C1 · B1 …)를 적으십시오.</li>}
        </ul>
        {알림 && <div className="gmd-note">{알림}<button type="button" className="gmd-x" onClick={() => set알림('')} aria-label="닫기">✕</button></div>}
      </div>

      <div className="kcs-main">
        <div className="kcs-3dbox card">
          {glErr ? <p className="gmd-warn">{glErr}</p> : <canvas ref={판Ref} className="kcs-3d" aria-label="고른 것 3D — 누르면 그 줄로" />}
          <p className="muted kcs-3dnote">🧊 고른 것 3D — 길이 줄 = 선 따라 세운 판(높이만큼 · 비면 얇은 띠) · 면적 줄 = 그 모양 판 · 개수 = 작은 기둥 · <b>그림만</b>(수량은 표) · 누르면 그 줄로{덩.넘침 ? ` · 3D 는 앞 ${덩.덩.length.toLocaleString('ko-KR')}개만` : ''}</p>
        </div>

        <div className="kcs-list">
          {보기 !== '모두' && <div className="gmd-note kcs-viewbar">{보기 === '빈칸' ? '❓ 아직 넣을 값이 있는 줄만 보는 중' : '⚠ 치수 글과 그려진 길이가 다른 줄만 보는 중'} <button type="button" className="gmd-link" onClick={() => set보기('모두')}>모두 보기</button></div>}
          {보일무리.map((g) => {
            const 셈 = g.셈.filter(맞음)
            const 펴 = 펼친.has(g.키) || 보기 !== '모두'
            const 종 = [...new Set(g.셈.map((x) => 종류이름[x.r.종류] || x.r.종류))].map((t) => t + ' ' + g.셈.filter((x) => (종류이름[x.r.종류] || x.r.종류) === t).length).join(' · ')
            const 합 = {}
            for (const x of g.셈) if (x.수량 !== null && !x.세움) 합[x.단위] = (합[x.단위] || 0) + x.수량        // 🧱 세운 줄은 무리 합에서도 뺌(골조 물량에서 셈)
            const 빈 = g.셈.filter((x) => x.수량 === null && !x.세움).length
            const 세운수 = g.셈.filter((x) => x.세움).length
            const 갈 = 같은값(g.셈, '갈래')
            const 적들 = [...new Set(g.셈.map((x) => 적요글(x.r, x.b)))]
            /* 🧱 부재 — 무리에 하나면 그것 · 섞였으면 null · 레이어 · 블록 이름이 부재를 말하면 🟨 제안(누르면 그 부재) */
            const 부 = 같은값(g.셈, '부재')
            const 부든 = g.셈.filter((x) => x.r.부재).length
            const 권 = 세우기 && !부든 ? 레이어부재(g.레이어, g.블록) : ''
            const 권수 = 권 ? g.셈.filter((x) => 부재맞음(권, x.r)).length : 0
            return (
              <div key={g.키} className={'kcs-group card' + (빈 ? ' has-q' : '')}>
                <div className="kcs-ghead">
                  <button type="button" className="kcs-fold" onClick={() => 펴기(g.키)} aria-expanded={펴} aria-label={(펴 ? '접기 ' : '펴기 ') + (g.블록 || g.레이어)}>{펴 ? '▾' : '▸'}</button>
                  <span className="kcs-gname"><b>{g.블록 ? '블록 ' + g.블록 : '레이어 ' + (g.레이어 || '—')}</b> <span className="muted">{g.블록 ? '레이어 ' + g.레이어 + ' · ' : ''}{종}</span></span>
                  <span className="kcs-gsum">{단위차.filter((u) => 합[u] !== undefined).map((u) => <b key={u}>{쉼(합[u])} {u}</b>)}{빈 ? <span className="kcs-q">❓ {빈}</span> : null}{세운수 ? <span className="kcs-built">🧱 골조 모델 {세운수}</span> : null}</span>
                  <button type="button" className="gmd-x" onClick={() => 무리빼기(g.키)} aria-label={'무리 빼기 ' + (g.블록 || g.레이어)}>✕</button>
                </div>
                <div className="kcs-gedit" role="group" aria-label="이 무리 한꺼번에">
                  <label data-l="적요">{글칸(같은값(g.셈, '적요'), (v) => 무리고침(g.키, '적요', v), '무리 적요', 적들.length === 1 ? 적들[0] : '줄마다 — ' + 적들.slice(0, 3).join(' · ') + (적들.length > 3 ? ' …' : ''), 'kcs-memo')}</label>
                  <label data-l="갈래">{갈래칸(갈, (v) => 무리고침(g.키, '갈래', v), '무리 갈래')}</label>
                  <label data-l="층">{층칸(같은값(g.셈, '층'), (v) => 무리고침(g.키, '층', v), '무리 층', 바닥꼴(부))}</label>
                  <label data-l="구간">{글칸(같은값(g.셈, '구간'), (v) => 무리고침(g.키, '구간', v), '무리 구간', '구간', 'kcs-zone')}</label>
                  {(갈 === '길이높이' || 갈 === null) && <label data-l="높이 m">{글칸(같은값(g.셈, '높이'), (v) => 무리고침(g.키, '높이', v), '무리 높이(m)', '높이 m', 'kcs-num')}</label>}
                  {(갈 === '면적두께' || 갈 === null) && <label data-l="두께 m">{글칸(같은값(g.셈, '두께'), (v) => 무리고침(g.키, '두께', v), '무리 두께(m)', '두께 m', 'kcs-num')}</label>}
                  {세우기 && <>
                    <label data-l="부재">
                      <select className="kcs-in kcs-member" value={부 ?? ''} onChange={(e) => 부재고침((r) => 무리키(r) === g.키, e.target.value)} aria-label="무리 부재(골조 모델로 세움)">
                        {부 === null && <option value="">여러 부재</option>}
                        <option value="">— 수량만</option>
                        {부재종류.map((k) => <option key={k} value={k}>🧱 {k}</option>)}
                      </select>
                    </label>
                    {부든 > 0 && <label data-l="부호">{글칸(같은값(g.셈.filter((x) => x.r.부재), '부호'), (v) => set캐드((P) => ({ ...P, 줄: P.줄.map((r) => (무리키(r) === g.키 && r.부재 ? { ...r, 부호: v.toUpperCase() } : r)) })), '무리 부호', 부호들(부 || '기둥').slice(0, 3).join(' · ') || 'C1', 'kcs-sign')}</label>}
                    {권 && 권수 > 0 && <button type="button" className="btn line sm kcs-suggest" onClick={() => { 부재고침((r) => 무리키(r) === g.키, 권); 세기('|캐드고름|부재제안') }} title={'레이어 · 블록 이름 «' + (g.블록 || g.레이어) + '» — 누르면 ' + 권 + '(꼴이 맞는 ' + 권수 + '줄)'}>🟨 {으로[권]} 세우기?</button>}
                  </>}
                </div>
                {세우기 && 부 === null && 부든 > 0 && <p className="muted kcs-gnote">🧱 {부든}줄은 부재 · {g.셈.length - 부든}줄은 수량만(그 부재로 못 세우는 꼴 — 블록 · 열린 선 · 원 …)</p>}
                {펴 && (
                  <div className="kcs-rows">
                    {셈.slice(0, 400).map((x, i) => {
                      const r = x.r
                      const 잰 = r.갈래 === '개수' ? x.개수 + ' 개' : r.갈래 === '면적' || r.갈래 === '면적두께' ? (x.면적 !== null ? 쉼(x.면적) + ' ㎡' : '—') : x.길이 !== null ? 쉼(x.길이) + ' m' : '—'
                      return (
                        <div key={r.id} id={'kcs-r-' + r.id} className={'kcs-row' + (고른 === r.id ? ' on' : '') + (x.수량 === null ? ' q' : '') + (치수남음(r) ? ' dim' : '')} onClick={() => set고른(r.id)}>
                          <span className="kcs-no" data-l="번호">{i + 1}</span>
                          <span className="kcs-what" data-l="객체">{종류이름[r.종류] || r.종류} <small className="muted">#{r.핸들}</small>{r.글근거 ? <small> «{r.글근거}»</small> : null}</span>
                          <label data-l="적요">{글칸(r.적요, (v) => 줄고침(r.id, '적요', v), '적요', 적요글(r, x.b), 'kcs-memo')}</label>
                          <label data-l="갈래">{갈래칸(r.갈래, (v) => 줄고침(r.id, '갈래', v), '갈래')}</label>
                          <label data-l="층">{층칸(r.층, (v) => 줄고침(r.id, '층', v), '층', 바닥꼴(r.부재))}</label>
                          {r.갈래 === '길이높이' && <label data-l="높이 m">{글칸(r.높이, (v) => 줄고침(r.id, '높이', v), '높이(m)', '높이 m', 'kcs-num')}</label>}
                          {r.갈래 === '면적두께' && <label data-l="두께 m">{글칸(r.두께, (v) => 줄고침(r.id, '두께', v), '두께(m)', '두께 m', 'kcs-num')}</label>}
                          {세우기 && r.부재 && (x.세움
                            ? <span className="kcs-built" data-l="부재">🧱 {r.부재} {r.부호 || ''} — 골조 모델</span>
                            : <label data-l={'부호(' + r.부재 + ')'}>{글칸(r.부호, (v) => 줄고침(r.id, '부호', v.toUpperCase()), '부호', 부호들(r.부재)[0] || 'C1', 'kcs-sign')}</label>)}
                          <label data-l="공제">{글칸(r.공제, (v) => 줄고침(r.id, '공제', v), '공제(' + x.단위 + ')', '공제', 'kcs-num kcs-sm')}</label>
                          <label data-l="횟수">{글칸(r.횟수, (v) => 줄고침(r.id, '횟수', v), '횟수', '1', 'kcs-num kcs-sm')}</label>
                          <span className="kcs-meas" data-l="잰 값">{잰}</span>
                          <span className="kcs-qty" data-l="수량">{x.세움 ? <span className="muted">골조 물량에서 셈</span> : x.수량 !== null ? <b>{쉼(x.수량)} {x.단위}</b> : <span className="kcs-q">❓ {[...x.빈칸, ...x.틀림].join(' · ')}</span>}{x.식 && x.수량 !== null && /[×−]/.test(x.식) ? <small className="muted kcs-f"> = {x.식}</small> : null}</span>
                          <button type="button" className="gmd-x kcs-del" onClick={(e) => { e.stopPropagation(); 줄빼기(r.id) }} aria-label={'줄 빼기 ' + r.핸들}>✕</button>
                          {세우기 && r.부재 && !x.세움 && 못 && 못.has(r.id) && <span className="kcs-fail" data-l="못 세움">⚠ {못.get(r.id)}</span>}
                          {r.치수 && r.치수.다름 && (
                            <span className="kcs-dim" data-l="치수">
                              ⚠ 치수 글 «{r.치수.글 || 쉼(r.치수.도면값)}» ≠ 그려진 길이 {쉼(r.치수.잰, 1)}
                              <button type="button" className={'btn line sm' + (r.치수씀 ? ' on' : '')} onClick={(e) => { e.stopPropagation(); 치수고름(r.id, true); 세기('|캐드고름|치수씀') }}>치수 값으로</button>
                              <button type="button" className={'btn line sm' + (r.치수봄 ? ' on' : '')} onClick={(e) => { e.stopPropagation(); 치수고름(r.id, false) }}>잰 길이 그대로</button>
                            </span>
                          )}
                        </div>
                      )
                    })}
                    {셈.length > 400 && <p className="muted gmd-p">앞 400줄만 보입니다(셈 · 엑셀은 {셈.length.toLocaleString('ko-KR')}줄 모두) — 무리 줄에서 한꺼번에 넣으십시오.</p>}
                  </div>
                )}
              </div>
            )
          })}
          {!보일무리.length && <p className="gmd-p muted">이 보기에 해당하는 줄이 없습니다. <button type="button" className="gmd-link" onClick={() => set보기('모두')}>모두 보기</button></p>}
        </div>
      </div>

      <div className="card">
        <h2 className="gmd-h">집계 <span className="muted kcs-sum">적요 · 층 · 구간마다</span></h2>
        <div className="gmd-tablewrap"><table className="gmd-table kcs-agg">
          <thead><tr><th>적요</th><th>층</th><th>구간</th><th className="num">줄</th><th className="num">수량</th><th>단위</th></tr></thead>
          <tbody>
            {C.집계.map((a, i) => <tr key={i}><td>{a.적요}</td><td>{a.층 ? (a.층 === 'FT' ? 'FT' : a.층 + '층') : '—'}</td><td>{a.구간 || '—'}</td><td className="num">{a.줄}</td><td className="num">{쉼(a.수량)}</td><td>{a.단위}</td></tr>)}
            {단위차.filter((u) => C.합[u] !== undefined).map((u) => <tr key={'t' + u} className="kcs-tot"><td><b>합계</b></td><td></td><td></td><td className="num">{C.집계.filter((a) => a.단위 === u).reduce((n, a) => n + a.줄, 0)}</td><td className="num"><b>{쉼(C.합[u])}</b></td><td>{u}</td></tr>)}
          </tbody>
        </table></div>
        <p className="muted gmd-p">수량 = (잰 값 [× 높이 · 두께] − 공제) × 횟수 · 잰 값은 캐드 좌표로 셈(볼록 호는 반지름 × 각도 · 닫힌 선은 신발끈 + 활꼴) · 근거(도면 · 레이어 · 핸들 · 좌표)는 엑셀 «캐드고름» 시트에 줄마다.</p>
      </div>
    </div>
  )
}
