/**
 * /tools/gps — 📍 내 위치 좌표 · 폰 GPS 로 측량 좌표 X · Y (G644 · 2026-11-10)
 *
 * 소장님: 「핸드폰으로 gps 좌표 xy 나오게 할 수 있어?」 · 「다운 받는거 없이 건설맵 들어가서 가능해?」 · 「응 만들어 보자. 오차는 설명해 주고..」
 *
 * ■ «📍 내 위치 재기» 를 눌러야 위치를 묻습니다(브라우저 «위치 허용» 한 번) — 쪽을 열기만 해서는 안 물음.
 * ■ 위도 · 경도 → X(북) · Y(동) — 원점은 경도로 저절로([별표 2] 적용 구역) · 바꿀 수 있음. 셈 lib/내위치.js(시험 tools/시험_내위치.mjs — pyproj 와 0.1 mm 안).
 * ■ ⏱ 평균 내기(30초 · 1분 · 2분) — 오차 작은 값을 더 믿는 무게 평균 · 흩어짐 · 오차 50 m 넘는 값은 뺌.
 * ■ 💾 점 저장(이 브라우저에만) · 📋 모두 복사(엑셀 · 한글 표에 붙여 넣기) · 📗 엑셀 받기 · 🗺 지도(카카오맵) · 🎯 찾아가기(도면 좌표까지 거리 · 방향).
 * ■ 위치는 이 기기 안에서만 셈 — 서버 · 통계로 보내지 않음. 📊 숨은 누적(세기)은 «눌렀다» 만: |내위치|재기 · 평균 · 저장 · 복사 · 엑셀 · 찾아가기
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import * as W from '../lib/내위치.js'
import { 세기 } from '../lib/받은수.jsx'
import { 링크복사 } from '../lib/링크복사.js'

const 원점칸 = W.원점들.map((o) => o.키)
function 점읽기() {
  try { const a = JSON.parse(localStorage.getItem(W.열쇠) || '[]'); return Array.isArray(a) ? a.filter((p) => p && Number.isFinite(p.X) && Number.isFinite(p.Y)) : [] } catch (e) { return [] }
}
function 점쓰기(a) { try { localStorage.setItem(W.열쇠, JSON.stringify(a)); return true } catch (e) { return false } }
const 원키읽기 = () => { try { const k = localStorage.getItem('kcm.내위치.원점'); return 원점칸.includes(k) ? k : '' } catch (e) { return '' } }
const 소수만 = (v) => String(v ?? '').replace(/[^\d.\-]/g, '').replace(/(?!^)-/g, '').replace(/(\..*)\./g, '$1').slice(0, 14)

export default function GpsPoint() {
  const [상태, set상태] = useState('처음')       /* 처음 · 찾는중 · 잼 · 멈춤 · 거부 · 안됨 · 오류 */
  const [오류글, set오류글] = useState('')
  const [지금, set지금] = useState(null)         /* {위도, 경도, 오차, 높이, 높이오차, 때} */
  const [횟수, set횟수] = useState(0)
  const [원키, set원키] = useState(원키읽기)       /* '' = 저절로 */
  const [평, set평] = useState(null)             /* {길이, 끝, 표본: [], 결과} */
  const [남은, set남은] = useState(0)
  const [점들, set점들] = useState(점읽기)
  const [이름, set이름] = useState('')
  const [메모, set메모] = useState('')
  const [알림, set알림] = useState('')
  const [지움, set지움] = useState(-1)
  const [목표, set목표] = useState({ X: '', Y: '' })
  const 감시 = useRef(null)
  const 평표본 = useRef(null)       /* 평균 중 모은 값 — 위도 · 경도 · 오차만(X · Y 는 끝날 때 그때 원점으로 셈) */
  const 원점틀 = useRef(W.원점들[1])

  const 원점 = useMemo(() => (원키 ? W.원점키(원키) : (지금 ? W.원점찾기(지금.경도) : W.원점들[1])), [원키, 지금])
  원점틀.current = 원점
  const 저절로 = 지금 ? W.원점찾기(지금.경도) : null
  const 좌 = useMemo(() => (지금 ? W.좌표(지금.위도, 지금.경도, 원점) : null), [지금, 원점])
  const 등급 = W.오차등급(지금 ? 지금.오차 : NaN)

  /* 위치 받기 — 누를 때만 */
  const 멈추기 = () => {
    if (감시.current !== null && navigator.geolocation) navigator.geolocation.clearWatch(감시.current)
    감시.current = null
  }
  const 재기 = () => {
    set오류글('')
    if (typeof navigator === 'undefined' || !navigator.geolocation) { set상태('안됨'); return }
    if (typeof window !== 'undefined' && window.isSecureContext === false) { set상태('안됨'); return }
    멈추기()
    set상태((s) => (s === '잼' ? s : '찾는중'))
    세기('|내위치|재기')
    감시.current = navigator.geolocation.watchPosition((pos) => {
      const c = pos.coords
      const p = { 위도: c.latitude, 경도: c.longitude, 오차: c.accuracy, 높이: c.altitude, 높이오차: c.altitudeAccuracy, 때: pos.timestamp || Date.now() }
      set지금(p)
      set횟수((n) => n + 1)
      set상태('잼')
      if (평표본.current) 평표본.current.push(p)
    }, (e) => {
      if (e && e.code === 1) { set상태('거부'); 멈추기() } else { set상태((s) => (s === '잼' ? s : '오류')); set오류글(e && e.code === 3 ? '시간 안에 위치를 못 받았습니다 — 하늘이 트인 곳에서 다시 눌러 보세요.' : '위치를 못 받았습니다 — 폰의 위치(GPS)가 켜져 있는지 보세요.') }
    }, { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 })
  }
  useEffect(() => () => 멈추기(), [])
  useEffect(() => { try { if (원키) localStorage.setItem('kcm.내위치.원점', 원키); else localStorage.removeItem('kcm.내위치.원점') } catch (e) { /* 막힘 */ } }, [원키])
  /* 원점을 바꾸면 평균 중인 표본은 버림(다른 원점 X · Y 가 섞이지 않게) */
  useEffect(() => { if (평표본.current) { 평표본.current = null; set평(null); set알림('원점을 바꿔 평균을 멈췄습니다 — 다시 눌러 주세요.') } }, [원키])

  /* ⏱ 평균 */
  const 평시작 = (초) => {
    if (상태 !== '잼') 재기()
    평표본.current = []
    set평({ 길이: 초, 끝: Date.now() + 초 * 1000, 결과: null })
    set남은(초)
    set알림('')
  }
  useEffect(() => {
    if (!평 || 평.결과) return undefined
    const t = setInterval(() => {
      const r = Math.max(0, Math.ceil((평.끝 - Date.now()) / 1000))
      set남은(r)
      if (r <= 0) {
        clearInterval(t)
        const 원 = 원점틀.current
        const 결과 = W.평균((평표본.current || []).map((s) => ({ ...s, ...W.좌표(s.위도, s.경도, 원) })))
        평표본.current = null
        set평((x) => (x ? { ...x, 결과: 결과 || { 빈: true } } : x))
        if (결과) 세기('|내위치|평균')
      }
    }, 250)
    return () => clearInterval(t)
  }, [평])
  const 평취소 = () => { 평표본.current = null; set평(null) }

  /* 💾 점 */
  const 다음이름 = () => `P${점들.length + 1}`
  const 저장 = (평결) => {
    const 쓸 = 평결 && !평결.빈 ? 평결 : null
    if (!쓸 && !지금) return
    const 원 = 원점
    const 위도 = 쓸 ? 쓸.위도 : 지금.위도, 경도 = 쓸 ? 쓸.경도 : 지금.경도
    const q = W.좌표(위도, 경도, 원)
    const p = { 이름: (이름 || 다음이름()).slice(0, 40), X: q.X, Y: q.Y, 원점: 원.이름, 위도, 경도, 오차: 쓸 ? 쓸.중앙오차 : 지금.오차,
      높이: !쓸 && Number.isFinite(지금.높이) ? 지금.높이 : null, 평균: 쓸 ? 쓸.수 : 0, 때: W.때글(Date.now()), 메모: 메모.slice(0, 80) }
    const a = [...점들, p]
    set점들(a)
    const 됨 = 점쓰기(a)
    set이름(''); set메모('')
    set알림(됨 ? `💾 «${p.이름}» 저장 — 이 브라우저에만 남습니다.` : '⚠️ 이 브라우저는 저장이 막혀 있습니다 — 엑셀 받기나 복사로 옮겨 두세요.')
    세기('|내위치|저장')
  }
  const 지우기 = (i) => { const a = 점들.filter((_, k) => k !== i); set점들(a); 점쓰기(a); set지움(-1) }
  const 모두복사 = async () => {
    const 됨 = await 링크복사(W.점TSV(점들))
    set알림(됨 ? `📋 ${점들.length}점 복사 — 엑셀 · 한글 표에 붙여 넣으세요.` : '복사가 막혀 있습니다 — 엑셀 받기를 써 주세요.')
    세기('|내위치|복사')
  }
  const 한점복사 = async () => {
    if (!좌) return
    const 됨 = await 링크복사(W.한줄({ X: 좌.X, Y: 좌.Y, 원점: 원점.이름 }))
    set알림(됨 ? '📋 X · Y 복사했습니다.' : '복사가 막혀 있습니다 — 길게 눌러 골라 주세요.')
    세기('|내위치|복사')
  }
  const 엑셀 = async () => {
    const { 값엑셀받기, 소수칸 } = await import('../lib/값엑셀.js')
    const d = new Date()
    const 날 = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
    const rows = 점들.map((p) => { const r = W.표줄(p); return [r[0], 소수칸(p.X), 소수칸(p.Y), ...r.slice(3)] })
    값엑셀받기(`내위치_좌표_${날}`, [{ name: '좌표', head: W.표머리, rows, widths: [12, 14, 14, 10, 13, 13, 9, 9, 10, 16, 20] }],
      { 주소: '/tools/gps', 글: '폰 GPS 로 잰 대략 위치입니다(오차 ±m 참고) — 측량 · 먹매김 · 경계에는 쓰지 마세요.' })
    세기('|내위치|엑셀')
  }

  /* 🎯 찾아가기 */
  const 목X = parseFloat(목표.X), 목Y = parseFloat(목표.Y)
  const 목있음 = Number.isFinite(목X) && Number.isFinite(목Y) && 목X > 0 && 목Y > 0
  const 길 = 목있음 && 좌 ? W.거리방향(좌, { X: 목X, Y: 목Y }) : null
  const 목먼 = 길 && 길.거리 > 50000
  useEffect(() => { if (목있음) 세기('|내위치|찾아가기') }, [목있음])

  const 지도 = 지금 ? W.지도주소('내 위치', 지금.위도, 지금.경도) : ''

  return (
    <div className="wrap gp">
      <div className="card">
        <h1 className="tl-h1" style={{ marginTop: 0 }}>📍 내 위치 좌표 — 폰 GPS 로 X · Y</h1>
        <p className="cp" style={{ margin: '6px 0 0' }}>
          폰으로 지금 선 자리의 <b>측량 좌표 X(북) · Y(동)</b>와 위도 · 경도를 바로 봅니다 — 앱 설치 없이 이 쪽에서.
          원점(서부 · 중부 · 동부 · 동해)은 경도로 저절로 고릅니다. <b>폰 GPS 라 몇 m 는 틀립니다</b> — 대략 위치 · 메모 · 찾아가기용이고 측량에는 쓰지 않습니다.
        </p>
        <div className="iy-small">🔒 위치는 이 기기 안에서만 셈 — 서버로 보내지 않습니다 · 저장한 점은 이 브라우저에만</div>
      </div>

      <div className="card gp-main">
        {(상태 === '처음' || 상태 === '거부' || 상태 === '안됨' || 상태 === '오류' || 상태 === '멈춤') && (
          <button type="button" className="btn gp-go" onClick={재기}>📍 내 위치 재기</button>
        )}
        {상태 === '처음' && <div className="gp-hint">누르면 브라우저가 <b>«위치 허용»</b> 을 한 번 묻습니다 — «허용» 을 눌러 주세요.</div>}
        {상태 === '찾는중' && <div className="gp-wait" role="status">🛰 위치 찾는 중… 처음엔 10초 ~ 1분 걸릴 수 있습니다(하늘이 트인 곳이 빠름).</div>}
        {상태 === '거부' && <div className="gp-bad" role="alert">🚫 위치를 막아 두셨습니다. 주소창 왼쪽 자물쇠(사이트 설정)에서 <b>위치 → 허용</b> 으로 바꾼 뒤 다시 눌러 주세요.
          아이폰은 설정 → 개인정보 보호 및 보안 → 위치 서비스 → 사파리 웹 사이트도 «앱을 사용하는 동안» 이어야 합니다.</div>}
        {상태 === '안됨' && <div className="gp-bad" role="alert">이 브라우저에서는 위치를 받을 수 없습니다 — 폰의 크롬 · 사파리 · 삼성 인터넷으로 k-conmap.com 을 열어 주세요.</div>}
        {상태 === '오류' && <div className="gp-bad" role="alert">{오류글}</div>}

        {지금 && 좌 && <>
          <div className="gp-xy">
            <div><span>X(북) · m</span><b>{W.수(좌.X)}</b></div>
            <div><span>Y(동) · m</span><b>{W.수(좌.Y)}</b></div>
          </div>
          <div className={'gp-acc ' + 등급.키}>
            <b>오차 ± {Number.isFinite(지금.오차) ? (지금.오차 < 10 ? 지금.오차.toFixed(1) : Math.round(지금.오차)) : '—'} m</b>
            <span>{등급.글}</span>
          </div>
          <div className="gp-org">
            <span>원점</span>
            {원점칸.map((k) => {
              const o = W.원점키(k)
              const 켜짐 = 원점.키 === k
              return <button key={k} type="button" className={'chip' + (켜짐 ? ' on' : '')} aria-pressed={켜짐}
                onClick={() => set원키(저절로 && 저절로.키 === k ? '' : k)}>{o.이름}{저절로 && 저절로.키 === k ? ' (저절로)' : ''}</button>
            })}
          </div>
          {저절로 && 저절로.밖 && <div className="gp-bad">경도 {지금.경도.toFixed(3)}° — 네 원점의 적용 구역(동경 124° ~ 132°) 밖입니다.</div>}
          {원키 && 저절로 && 원키 !== 저절로.키 && <div className="gp-note">⚠️ 이 자리의 적용 원점은 <b>{저절로.이름}</b>입니다 — 도면이 {원점.이름} 기준일 때만 바꿔 두세요.</div>}
          <div className="gp-facts">
            <div><span>위도</span><b>{지금.위도.toFixed(7)}°</b><small>{W.도분초(지금.위도)}</small></div>
            <div><span>경도</span><b>{지금.경도.toFixed(7)}°</b><small>{W.도분초(지금.경도)}</small></div>
            <div><span>높이(참고)</span><b>{Number.isFinite(지금.높이) ? `${지금.높이.toFixed(1)} m` : '—'}</b>
              <small>{Number.isFinite(지금.높이오차) ? `± ${Math.round(지금.높이오차)} m · ` : ''}표고 아님(아래 설명)</small></div>
            <div><span>받은 때</span><b>{W.때글(지금.때)}</b><small>{횟수}번 받음 · 움직이면 따라 바뀜</small></div>
          </div>
          <div className="btn-row gp-btns">
            <button type="button" className="btn sm" onClick={한점복사}>📋 X · Y 복사</button>
            <a className="btn line sm" href={지도} target="_blank" rel="noopener nofollow">🗺 지도에서 보기 ↗</a>
            {상태 === '잼' ? <button type="button" className="btn line sm" onClick={() => { 멈추기(); 평취소(); set상태('멈춤') }}>⏹ 멈추기(배터리)</button> : null}
          </div>
        </>}
      </div>

      <div className="card">
        <div className="detail-h" style={{ margin: 0 }}>⏱ 평균 내기 — 서서 기다리면 흔들림이 줄어듦</div>
        <p className="cp gp-p">폰을 한자리에 두고(손에 들면 위로) 기다리면 그동안 받은 값을 평균합니다 — 오차가 작은 값을 더 믿고, 오차 50 m 넘는 값은 뺍니다.</p>
        {!평 && <div className="btn-row">
          {[30, 60, 120].map((s) => <button key={s} type="button" className="btn line sm" onClick={() => 평시작(s)}>{s < 60 ? `${s}초` : `${s / 60}분`}</button>)}
        </div>}
        {평 && !평.결과 && <div className="gp-avg" role="status">
          <div className="gp-bar"><i style={{ width: `${Math.round(100 * (1 - 남은 / 평.길이))}%` }} /></div>
          <span>남은 {남은}초 · 모은 값 {(평표본.current || []).length}개</span>
          <button type="button" className="tp-x" onClick={평취소}>그만</button>
        </div>}
        {평 && 평.결과 && (평.결과.빈 ? <div className="gp-bad">쓸 만한 값이 없었습니다(오차 50 m 넘음 · 또는 위치가 안 들어옴) — 하늘이 트인 곳에서 다시 해 보세요.
          <button type="button" className="tp-x" onClick={평취소}>닫기</button></div> : <div className="gp-avgres">
          <div className="gp-xy sm">
            <div><span>평균 X(북) · m</span><b>{W.수(평.결과.X)}</b></div>
            <div><span>평균 Y(동) · m</span><b>{W.수(평.결과.Y)}</b></div>
          </div>
          <small>{평.결과.수}개 평균{평.결과.뺀 ? ` · 오차 큰 ${평.결과.뺀}개 뺌` : ''} · 흩어짐 {평.결과.흩어짐.toFixed(1)} m · 받은 오차 가운데값 ± {평.결과.중앙오차.toFixed(1)} m · {원점.이름}</small>
          <small className="gp-warn">평균은 흔들림만 줄입니다 — 건물에 막혀 한쪽으로 치우친 값은 평균해도 그대로입니다.</small>
          <div className="btn-row">
            <button type="button" className="btn sm" onClick={() => { 저장(평.결과); set평(null) }}>💾 이 평균을 점으로 저장</button>
            <button type="button" className="btn line sm" onClick={평취소}>닫기</button>
          </div>
        </div>)}
      </div>

      <div className="card">
        <div className="detail-h" style={{ margin: 0 }}>💾 점 저장 — 맨홀 · 시추공 · 표지 위치 메모</div>
        <div className="gp-save">
          <input className="inp" value={이름} onChange={(e) => set이름(e.target.value)} placeholder={`이름 (${다음이름()})`} aria-label="점 이름" maxLength={40} />
          <input className="inp" value={메모} onChange={(e) => set메모(e.target.value)} placeholder="메모 (예: 우수맨홀 뚜껑 가운데)" aria-label="메모" maxLength={80} />
          <button type="button" className="btn sm" disabled={!지금} onClick={() => 저장(null)}>💾 지금 값 저장</button>
        </div>
        {!지금 && <div className="gp-hint">먼저 «📍 내 위치 재기» 를 눌러 주세요.</div>}
        {알림 && <div className="note sm" role="status" style={{ marginTop: 8 }}>{알림}</div>}
        {점들.length > 0 && <>
          <ul className="gp-list">{점들.map((p, i) => {
            const 앞 = i > 0 ? W.거리방향(점들[i - 1], p) : null
            return <li key={i}>
              <div className="gp-li-h"><b>{p.이름}</b><span className="gp-li-acc">± {p.오차 < 10 ? p.오차.toFixed(1) : Math.round(p.오차)} m</span>
                {지움 === i ? <span className="gp-del"><button type="button" className="tp-x" onClick={() => 지우기(i)}>지움</button><button type="button" className="tp-x" onClick={() => set지움(-1)}>둠</button></span>
                  : <button type="button" className="tp-x gp-x" aria-label={`${p.이름} 지우기`} onClick={() => set지움(i)}>✕</button>}</div>
              <div className="gp-li-xy">X {W.수(p.X)} · Y {W.수(p.Y)}</div>
              <small>{p.메모 ? `${p.메모} · ` : ''}{p.때}{p.평균 ? ` · ${p.평균}개 평균` : ''} · {p.원점}{앞 ? ` · 앞 점에서 ${앞.거리.toFixed(1)} m ${W.방위글(앞.방위)}` : ''}</small>
            </li>
          })}</ul>
          <div className="btn-row">
            <button type="button" className="btn sm" onClick={모두복사}>📋 모두 복사(엑셀 · 한글에 붙여 넣기)</button>
            <button type="button" className="btn line sm" onClick={엑셀}>📗 엑셀 받기</button>
          </div>
        </>}
      </div>

      <div className="card">
        <div className="detail-h" style={{ margin: 0 }}>🎯 찾아가기 — 도면 좌표까지 거리 · 방향</div>
        <p className="cp gp-p">도면에 적힌 X · Y 를 넣으면 지금 자리에서 그 점까지 <b>거리와 방향</b>이 나옵니다(같은 원점 기준). 폰 오차만큼은 늘 틀리니 «근처까지» 용입니다.</p>
        <div className="gp-save">
          <input className="inp" inputMode="decimal" value={목표.X} onChange={(e) => set목표((t) => ({ ...t, X: 소수만(e.target.value) }))} placeholder="X(북) 예: 551885.03" aria-label="찾아갈 X" />
          <input className="inp" inputMode="decimal" value={목표.Y} onChange={(e) => set목표((t) => ({ ...t, Y: 소수만(e.target.value) }))} placeholder="Y(동) 예: 198056.37" aria-label="찾아갈 Y" />
          {점들.length > 0 && <select className="inp" aria-label="저장한 점 고르기" value="" onChange={(e) => { const p = 점들[Number(e.target.value)]; if (p) set목표({ X: W.수(p.X), Y: W.수(p.Y) }) }}>
            <option value="">저장한 점에서 고르기</option>
            {점들.map((p, i) => <option key={i} value={i}>{p.이름}</option>)}
          </select>}
        </div>
        {목있음 && !좌 && <div className="gp-hint">«📍 내 위치 재기» 를 누르면 거리 · 방향이 나옵니다.</div>}
        {길 && (목먼 ? <div className="gp-bad">{(길.거리 / 1000).toFixed(1)} km 떨어져 있습니다 — 원점이 다르거나(지금 {원점.이름}) X · Y 를 바꿔 적었는지 보세요.</div> : <div className="gp-way">
          <svg className="gp-arrow" viewBox="0 0 40 40" style={{ transform: `rotate(${길.방위}deg)` }} aria-hidden="true"><path d="M20 3 L33 35 L20 27 L7 35 Z" fill="currentColor" /></svg>
          <div>
            <b>{길.거리 < 1000 ? `${길.거리.toFixed(1)} m` : `${(길.거리 / 1000).toFixed(2)} km`} · {W.방위글(길.방위)}({Math.round(길.방위)}°)</b>
            <small>북으로 {길.dX >= 0 ? '+' : ''}{길.dX.toFixed(1)} m · 동으로 {길.dY >= 0 ? '+' : ''}{길.dY.toFixed(1)} m — 화살표는 «북이 위» 기준(폰 나침반 아님)</small>
            {Number.isFinite(지금 && 지금.오차) && 길.거리 <= 지금.오차 && <small className="gp-warn">🎯 폰 오차(± {Math.round(지금.오차)} m) 안까지 왔습니다 — 정확한 자리는 측량기로 잡으세요.</small>}
          </div>
        </div>)}
      </div>

      <div className="card gp-why">
        <div className="detail-h" style={{ margin: 0 }}>⚠️ 오차 — 꼭 읽어 주세요</div>
        <ul className="flist">
          <li><b>폰 GPS 는 하늘이 트인 곳에서도 몇 m 는 틀립니다.</b> 건물 옆 · 실내 · 숲 · 차 안 · 지하에서는 수십 m 까지 커집니다.</li>
          <li>화면의 <b>«오차 ± m»</b> 는 폰이 알려 준 반경 — «대개 이 안» 이라는 뜻(웹 표준 W3C: 68%)이라 <b>3번에 1번쯤은 이보다 더 틀립니다.</b></li>
          <li><b>측량 · 먹매김 · 규준틀 · 경계 · 기성 검측에는 쓰지 마세요</b> — 그건 토털스테이션 · 측량용 GNSS(RTK)로 합니다.</li>
          <li>쓰기 좋은 곳 — 현장 대략 위치 · 맨홀 · 시추공 · 표지 위치 메모 · 사진 찍은 자리 · 처음 가는 현장 찾기 · 도면 좌표 근처로 찾아가기.</li>
          <li>잘 받는 법 — 하늘이 트인 곳 · 폰을 위로 · 1 ~ 2분 켜 두기(처음 값은 크게 틀릴 때가 많음) · 와이파이 켜기 · ⏱ 평균 내기.
            아이폰은 위치 서비스에서 사파리의 <b>«정확한 위치»</b> 가 켜져 있어야 합니다(꺼져 있으면 km 단위로 뭉개짐).</li>
          <li><b>높이는 표고(해발)가 아닙니다.</b> 웹 표준은 «타원체(WGS84) 위 높이» 이고 기종마다 다르게 줄 수 있어, 해발과 수십 m 까지 다를 수 있습니다.</li>
          <li><b>원점</b> — 경도로 저절로 고릅니다(서부 동경 124° ~ 126° · 중부 126° ~ 128° · 동부 128° ~ 130° · 동해 130° ~ 132°). 도면과 원점이 다르면 X · Y 가 수십 ~ 수백 km 다르게 나옵니다.
            옛 지적도처럼 세계측지계가 아닌 좌표와는 맞지 않습니다.</li>
        </ul>
        <div className="csrc">
          <span className="csrc-h">근거 조문 (법제처)</span>
          <a href="https://www.law.go.kr/법령/공간정보의구축및관리등에관한법률시행령" target="_blank" rel="noopener nofollow">공간정보의 구축 및 관리 등에 관한 법률 시행령 제7조 · [별표 2] 직각좌표의 기준 ↗</a>
        </div>
        <div className="iy-small">셈: 위도 · 경도(GRS80) → TM(원점 위도 38° · 가산 X 600,000 m · Y 200,000 m · 축척 1.0000) · 폰 GPS(WGS84)와 GRS80 차이는 몇 cm 라 그대로 씁니다.
          도면 3D 보기의 <Link to="/tools/dxf3d">사진 위치</Link>와 같은 셈입니다.</div>
      </div>
    </div>
  )
}
