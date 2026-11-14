import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { 공제칸 } from '../lib/gongje.js'
import { 칸바꿈, 줄채움, 달값, 달값고침, 공수차례, 달날수, 요일, 달더하기, 보임, 명단빼기, 명단넣기, 완전히지우기, 일한날있음, 일한달, 새번호, 원 } from '../lib/nomubi.js'
import { 빈것, 읽기, 쓰기, 열쇠 as 저장열쇠, 셈, 쪽나누기, 날합, 기간, 주민꼴, 주민앞, 전화꼴, 계좌꼴, 숫자만, 돈, 공수꼴, 합꼴,
  기기열쇠, 잠그기, 풀기, 주민찍기, 직종들, 은행들, 예시, 예시비밀, 한쪽사람 } from '../lib/노무비명세.js'
import { 세기 } from '../lib/받은수.jsx'
import { use잠깐말 } from '../lib/잠깐말.js'
import { use그림인쇄 } from '../tools/그림인쇄훅.js'

/**
 * 🧾 /tools/nomubi-myeongse — 일용노무비 지급명세서 «한 장 표» (G681 · 2026-11-14)
 *   소장님 「도구로 해서 캡쳐랑 똑같이 만들어」 · 「4대보험은 이미 만들어 놨으니 연결만 하면 되잖아」 · 「출력할때 다 나와야 해 주민 폰 등」 · 「코드만 만들어. 이용자 편하게」
 *   ■ 종이: 상호 · 월 · 기간 · 공사명 / 순번 · 직종 · 성명 · 주민등록번호/전화번호 · 주소 · 근로일수(1~15 · 16~31 두 줄) · 총공수 · 노무비 단가 · 노무비 총액 ·
 *     공제 총액 · 차감 지급액 · 공제 내역(소득세/주민세 · 고용보험/국민연금 · 건강보험/요양보험) · 은행 · 계좌번호 · 합계 — A4 가로 · 한 장에 12명(빈 줄까지)
 *   ■ 셈: lib/노무비명세.js 셈 = lib/nomubi.js 달셈(노무비 계산기와 같은 셈 · 생년월일만 주민번호 앞자리에서)
 *   ■ 저장: 이 기기(localStorage 'kcm_nomubi_ms1') — 주민번호 · 계좌는 이 기기 열쇠로 잠근 글만(비밀번호 안 물음 · 서버로 안 보냄)
 *   ■ PDF · 인쇄: 그림(글자 층 없음 · 그림인쇄훅 조각 — 쪽마다 .ms-쪽) · 엑셀 받기 없음(11-13 새 서식 규칙)
 *   ■ 숨은 셈: |노무비명세|예시 · 사람더함 · 다음달 · 처음부터 · PDF · 인쇄
 */

const 두자 = (n) => String(n).padStart(2, '0')
const 날16 = Array.from({ length: 16 }, (_, i) => i)
const 달글 = (ym) => `${ym.slice(0, 4)}년 ${Number(ym.slice(5, 7))}월`

/* ── 종이 — 캡처와 같은 한 장 표(쪽마다 12명 · 빈 줄 채움 · 합계는 끝 쪽) ── */
function 쪽표({ 쪽, 쪽i, 쪽수, 처음번호, st, N, 비밀, 합들 }) {
  const 기 = 기간(N.ym)
  const 날수 = N.날수
  const 끝쪽 = 쪽i === 쪽수 - 1
  const 빈 = Math.max(0, 한쪽사람 - 쪽.length)
  const 윗날 = (i) => (i < 15 ? i + 1 : 0)                  // 위 줄: 1~15일 · 16째 칸은 비움
  const 아랫날 = (i) => (15 + i + 1 <= 날수 ? 16 + i : 0)    // 아래 줄: 16일~말일
  const 날칸 = (d, g, 키) => (d ? <td key={키} className="ms-날">{공수꼴(g)}</td> : <td key={키} className="ms-날 ms-없음" />)
  const 긴글 = (s, n) => (String(s || '').length > n ? ' ms-작게' : '')
  return (
    <section className="ms-쪽">
      <table className="ms-표">
        <colgroup>
          <col style={{ width: '6mm' }} /><col style={{ width: '12mm' }} /><col style={{ width: '13mm' }} /><col style={{ width: '21mm' }} /><col style={{ width: '22mm' }} />
          {날16.map((i) => <col key={i} style={{ width: '4.2mm' }} />)}
          <col style={{ width: '7.5mm' }} /><col style={{ width: '12mm' }} /><col style={{ width: '15.5mm' }} /><col style={{ width: '13.5mm' }} /><col style={{ width: '15.5mm' }} />
          <col style={{ width: '13mm' }} /><col style={{ width: '13mm' }} /><col style={{ width: '13mm' }} /><col style={{ width: '10mm' }} /><col style={{ width: '22mm' }} />
        </colgroup>
        <thead>
          <tr className="ms-첫줄">
            <th colSpan={2} className="ms-이름표">상 호</th>
            <td colSpan={2} className={'ms-값' + 긴글(st.co, 12)}>{st.co}</td>
            <th colSpan={10} className="ms-제목">일용노무비지급명세서 ( {기.달} 월)</th>
            <th className="ms-세로">기<br />간</th>
            <td colSpan={7} className="ms-기간">{기.처음}<br />{기.끝}</td>
            <td className="ms-날수">{기.날수} 일</td>
            <th className="ms-이름표">공 사 명</th>
            <td colSpan={7} className={'ms-값' + 긴글(st.site, 30)}>{st.site}</td>
          </tr>
          <tr className="ms-머리">
            <th rowSpan={3}>순번</th><th rowSpan={3}>직 종</th><th rowSpan={3}>성 명</th>
            <th rowSpan={3}>주민등록번호<br />전화번호</th><th rowSpan={3}>주 소</th>
            <th colSpan={16}>근 로 일 수</th>
            <th rowSpan={3} className="ms-세로글">총<br />공<br />수</th>
            <th rowSpan={3}>노무비<br />단 가</th><th rowSpan={3}>노무비<br />총 액</th><th rowSpan={3}>공 제<br />총 액</th><th rowSpan={3}>차 감<br />지급액</th>
            <th colSpan={3}>공 제 내 역</th>
            <th rowSpan={3}>은행</th><th rowSpan={3}>계좌번호</th>
          </tr>
          <tr className="ms-머리 ms-날머리">
            {날16.map((i) => (윗날(i) ? <th key={i}>{윗날(i)}</th> : <th key={i} className="ms-없음" />))}
            <th>소득세</th><th>고용보험</th><th>건강보험</th>
          </tr>
          <tr className="ms-머리 ms-날머리">
            {날16.map((i) => (아랫날(i) ? <th key={i}>{아랫날(i)}</th> : <th key={i} className="ms-없음" />))}
            <th>주민세</th><th>국민연금</th><th>요양보험</th>
          </tr>
        </thead>
        <tbody>
          {쪽.map((r, k) => {
            const 열린 = 비밀[r.id]
            const 주민 = 주민찍기(r.p, 열린)
            return [
              <tr key={r.id + 'a'} className="ms-윗">
                <td rowSpan={2}>{처음번호 + k}</td>
                <td rowSpan={2} className={긴글(r.p.j, 5).trim() || undefined}>{r.p.j}</td>
                <td rowSpan={2} className={긴글(r.p.n, 4).trim() || undefined}>{r.p.n}</td>
                <td className="ms-주민">{주민}</td>
                <td rowSpan={2} className={'ms-주소' + 긴글(r.p.a, 20)}>{r.p.a}</td>
                {날16.map((i) => 날칸(윗날(i), r.공수[i], i))}
                <td rowSpan={2}>{합꼴(r.공수합)}</td>
                <td rowSpan={2} className="ms-수">{돈(r.w)}</td>
                <td rowSpan={2} className="ms-수">{돈(r.보수)}</td>
                <td rowSpan={2} className="ms-수">{돈(r.최종.합)}</td>
                <td rowSpan={2} className="ms-수 ms-굵">{돈(r.최종.차인)}</td>
                <td className="ms-수">{돈(r.최종.it)}</td><td className="ms-수">{돈(r.최종.ei)}</td><td className="ms-수">{돈(r.최종.hi)}</td>
                <td rowSpan={2} className={긴글(r.p.k, 4).trim() || undefined}>{r.p.k}</td>
                <td rowSpan={2} className={'ms-계좌' + 긴글(열린 && 열린.c, 16)}>{(열린 && 열린.c) || ''}</td>
              </tr>,
              <tr key={r.id + 'b'} className="ms-아래">
                <td className="ms-주민">{r.p.t}</td>
                {날16.map((i) => 날칸(아랫날(i), r.공수[15 + i], i))}
                <td className="ms-수">{돈(r.최종.lt)}</td><td className="ms-수">{돈(r.최종.np)}</td><td className="ms-수">{돈(r.최종.lc)}</td>
              </tr>,
            ]
          })}
          {Array.from({ length: 빈 }, (_, k) => [
            <tr key={'e' + k + 'a'} className="ms-윗"><td rowSpan={2} /><td rowSpan={2} /><td rowSpan={2} /><td /><td rowSpan={2} />
              {날16.map((i) => (윗날(i) ? <td key={i} className="ms-날" /> : <td key={i} className="ms-날 ms-없음" />))}
              <td rowSpan={2} /><td rowSpan={2} /><td rowSpan={2} /><td rowSpan={2} /><td rowSpan={2} /><td /><td /><td /><td rowSpan={2} /><td rowSpan={2} /></tr>,
            <tr key={'e' + k + 'b'} className="ms-아래"><td />
              {날16.map((i) => (아랫날(i) ? <td key={i} className="ms-날" /> : <td key={i} className="ms-날 ms-없음" />))}
              <td /><td /><td /></tr>,
          ])}
          {끝쪽 && [
            <tr key="t1" className="ms-윗 ms-합">
              <td colSpan={2} rowSpan={2}>합 계</td><td rowSpan={2}>{N.합계.인원} 명</td><td rowSpan={2} /><td rowSpan={2} />
              {날16.map((i) => (윗날(i) ? <td key={i} className="ms-날">{합꼴(합들[i])}</td> : <td key={i} className="ms-날 ms-없음" />))}
              <td rowSpan={2}>{합꼴(N.합계.공수)}</td><td rowSpan={2} />
              <td rowSpan={2} className="ms-수">{돈(N.합계.보수)}</td><td rowSpan={2} className="ms-수">{돈(N.합계.합)}</td>
              <td rowSpan={2} className="ms-수 ms-굵 ms-노랑">{돈(N.합계.차인)}</td>
              <td className="ms-수">{돈(N.합계.it)}</td><td className="ms-수">{돈(N.합계.ei)}</td><td className="ms-수">{돈(N.합계.hi)}</td>
              <td rowSpan={2} /><td rowSpan={2} />
            </tr>,
            <tr key="t2" className="ms-아래 ms-합">
              {날16.map((i) => (아랫날(i) ? <td key={i} className="ms-날">{합꼴(합들[15 + i])}</td> : <td key={i} className="ms-날 ms-없음" />))}
              <td className="ms-수">{돈(N.합계.lt)}</td><td className="ms-수">{돈(N.합계.np)}</td><td className="ms-수">{돈(N.합계.lc)}</td>
            </tr>,
          ]}
        </tbody>
      </table>
      {쪽수 > 1 && <div className="ms-쪽번호">{쪽i + 1} / {쪽수}</div>}
    </section>
  )
}

function 종이들({ st, N, 비밀 }) {
  const 쪽들 = 쪽나누기(N.줄)
  const 합들 = 날합(N)
  return 쪽들.map((쪽, i) => (
    <쪽표 key={i} 쪽={쪽} 쪽i={i} 쪽수={쪽들.length} 처음번호={i * 한쪽사람 + 1} st={st} N={N} 비밀={비밀} 합들={합들} />
  ))
}

const ms조각 = (판) => [...판.children].filter((x) => x.classList.contains('ms-쪽'))
  .map((el) => ({ el, z0: 1, 쪽: { 폭: 277, 높: 190 }, 여백: [10, 10], 종이: [297, 210], 판쪽: 'ms가로' }))

/* ── 미리 보기 — 종이(277mm)를 칸 폭에 맞춰 줄여 보임(찍는 판은 따로 · 줄이지 않음) ── */
function 미리보기({ st, N, 비밀 }) {
  const 틀 = useRef(null)
  const [줄, set줄] = useState(0.5)
  const [크게, set크게] = useState(false)
  useLayoutEffect(() => {
    const el = 틀.current
    if (!el) return undefined
    const 재기 = () => { const w = el.clientWidth; if (w > 0) set줄(Math.min(1, w / (277 * 96 / 25.4))) }
    재기()
    let ro = null
    try { ro = new ResizeObserver(재기); ro.observe(el) } catch (e) { window.addEventListener('resize', 재기) }
    return () => { if (ro) ro.disconnect(); else window.removeEventListener('resize', 재기) }
  }, [])
  const 쪽수 = 쪽나누기(N.줄).length
  const s = 크게 ? 1 : 줄
  return (
    <div>
      <div className="ms-미리머리">
        <b>📄 종이 미리 보기</b> <span className="muted">A4 가로 · {쪽수}쪽{쪽수 > 1 ? ` (한 쪽에 ${한쪽사람}명)` : ''}</span>
        {줄 < 0.9 && <button type="button" className="btn line sm ms-작은단추" onClick={() => set크게((v) => !v)}>{크게 ? '🔍 화면에 맞추기' : '🔍 크게 보기'}</button>}
      </div>
      <div ref={틀} className={'ms-미리' + (크게 ? ' 크게' : '')}>
        <div className="ms-미리안" style={{ width: 277 * 96 / 25.4 * s, height: 쪽수 * (190 * 96 / 25.4 + 12) * s }}>
          <div style={{ transform: `scale(${s})`, transformOrigin: '0 0', width: 277 * 96 / 25.4 }}>
            <종이들 st={st} N={N} 비밀={비밀} />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── 사람 한 명 — 적는 칸 · 출역 · 4대보험 ── */
function 사람칸({ p, 번, r, 열린, ym, 열쇠없음, on고침, on비밀, on칸, on줄, on대상, on빼기 }) {
  const 날수 = 달날수(ym)
  const 공수 = r ? r.공수 : Array(날수).fill(0)
  const 잃음 = !!p.x && !열린 && !열쇠없음
  return (
    <div className="ms-사람">
      <div className="ms-사람머리">
        <span className="ms-번">{번}</span>
        <input className="ms-in ms-이름" value={p.n || ''} placeholder="성명" aria-label={`${번}번 성명`} onChange={(e) => on고침('n', e.target.value)} />
        <input className="ms-in ms-직종" value={p.j || ''} placeholder="직종" list="ms-직종들" aria-label={`${번}번 직종`} onChange={(e) => on고침('j', e.target.value)} />
        <input className="ms-in ms-단가" value={p.w ? Number(p.w).toLocaleString('ko-KR') : ''} placeholder="일당(원)" inputMode="numeric" aria-label={`${번}번 노무비 단가(일당)`}
          onChange={(e) => on고침('w', Number(숫자만(e.target.value)) || 0)} />
        <button type="button" className="ms-빼기" title="이 사람 빼기" aria-label={`${번}번 빼기`} onClick={on빼기}>✕</button>
      </div>
      <div className="ms-칸들">
        <label className="ms-칸"><span>주민등록번호</span>
          <input className="ms-in" value={(열린 && 열린.r) || ''} placeholder={잃음 && p.rf ? `${p.rf}****** — 다시 적어 주세요` : '000000-0000000'} inputMode="numeric" autoComplete="off"
            aria-label={`${번}번 주민등록번호`} onChange={(e) => on비밀('r', 주민꼴(e.target.value))} /></label>
        <label className="ms-칸"><span>전화번호</span>
          <input className="ms-in" value={p.t || ''} placeholder="010-0000-0000" inputMode="tel" autoComplete="off" aria-label={`${번}번 전화번호`} onChange={(e) => on고침('t', 전화꼴(e.target.value))} /></label>
        <label className="ms-칸 ms-넓게"><span>주소</span>
          <input className="ms-in" value={p.a || ''} placeholder="시 · 군 · 동" autoComplete="off" aria-label={`${번}번 주소`} onChange={(e) => on고침('a', e.target.value)} /></label>
        <label className="ms-칸"><span>은행</span>
          <input className="ms-in" value={p.k || ''} placeholder="농협" list="ms-은행들" autoComplete="off" aria-label={`${번}번 은행`} onChange={(e) => on고침('k', e.target.value)} /></label>
        <label className="ms-칸"><span>계좌번호</span>
          <input className="ms-in" value={(열린 && 열린.c) || ''} placeholder={잃음 ? '다시 적어 주세요' : '숫자와 -'} inputMode="numeric" autoComplete="off"
            aria-label={`${번}번 계좌번호`} onChange={(e) => on비밀('c', 계좌꼴(e.target.value))} /></label>
      </div>
      {잃음 && <div className="ms-알림">🔑 이 기기에 둔 열쇠가 지워져 주민번호 뒷자리 · 계좌를 열 수 없습니다 — 두 칸만 다시 적어 주세요(다른 칸은 그대로).</div>}
      <div className="ms-출역머리">
        <b>근로일수</b> <span className="muted">날짜를 누를 때마다 1.0 → 0.5 → 1.5 → 빈칸</span>
        <span className="ms-출역단추">
          <button type="button" className="btn line sm ms-작은단추" onClick={() => on줄(true)}>일요일 빼고 모두</button>
          <button type="button" className="btn line sm ms-작은단추" onClick={() => on줄(false)} disabled={!공수.some((g) => g > 0)}>지우기</button>
        </span>
      </div>
      <div className="ms-날판" role="group" aria-label={`${번}번 근로일`}>
        {공수.map((g, i) => {
          const w = 요일(ym, i + 1)
          return (
            <button type="button" key={i} className={'ms-날단추' + (g > 0 ? ' on' : '') + (w === '일' ? ' 일' : w === '토' ? ' 토' : '') + (i === 15 ? ' d16' : '')}
              aria-label={`${i + 1}일 ${w} ${g > 0 ? 공수꼴(g) : '빈칸'}`} onClick={() => on칸(i)}>
              <small>{i + 1}</small><b>{공수꼴(g) || '·'}</b>
            </button>
          )
        })}
      </div>
      {r ? (
        <div className="ms-셈">
          <div className="ms-셈줄">총공수 <b>{합꼴(r.공수합)}</b> · 노무비 <b>{원(r.보수)}</b> · 공제 <b>{원(r.최종.합)}</b> · 차감 지급액 <b className="ms-차감">{원(r.최종.차인)}</b></div>
          <div className="ms-대상들">
            {[['P', '연금'], ['H', '건강'], ['E', '고용']].map(([c, 이름]) => {
              const d = r.대상[c]
              return (
                <button type="button" key={c} className={'ms-대상' + (d.대상 ? ' on' : '') + (d.손 ? ' 손' : '')} title={d.이유 + ' — 누르면 이 달만 ' + (d.대상 ? '뺌' : '넣음')}
                  onClick={() => on대상(c)}>{이름} {d.대상 ? '✓' : '✕'}</button>
              )
            })}
            <small className="muted ms-까닭">{[['P', '연금'], ['H', '건강'], ['E', '고용']].map(([c, 이름]) => `${이름}: ${r.대상[c].이유}`).join(' · ')}</small>
          </div>
        </div>
      ) : <div className="ms-셈 muted">일한 날을 누르면 노무비 · 공제 · 차감 지급액이 나옵니다.</div>}
    </div>
  )
}

export default function NomubiMyeongse() {
  const [st, setSt] = useState(() => 읽기() || 빈것())
  const [비밀, set비밀] = useState({})             // 사람 번호 → { r 주민번호, c 계좌 } — 화면 메모리에만(저장은 잠근 글 x)
  const [열쇠, set열쇠] = useState(null)           // 이 기기 열쇠(CryptoKey) · false = 못 씀(막힌 창) · null = 아직
  const [저장됨, set저장됨] = useState(true)
  const [되돌림, set되돌림] = useState(null)       // { 글, 전 st, 전비밀 }
  const [지움물음, set지움물음] = useState(false)
  const [말, set말] = use잠깐말(5000)
  const 판차례 = useRef({})                          // 사람마다 잠그기 차례(늦게 끝난 옛 잠금이 새 값을 덮지 않게)
  const 밖에서 = useRef(false)
  const ym = st.ym

  /* 이 기기 열쇠 → 잠근 글 열기 */
  const 열기 = async (key, P) => {
    const 열림 = {}
    for (const p of P || []) {
      if (!p.x) continue
      const v = await 풀기(key, p.x)
      if (v) 열림[p.id] = { r: v.r || '', c: v.c || '' }
    }
    return 열림
  }
  useEffect(() => {
    let 그만 = false
    ;(async () => {
      const key = await 기기열쇠()
      if (그만) return
      set열쇠(key || false)
      if (key) { const 열림 = await 열기(key, st.P); if (!그만) set비밀(열림) }
    })()
    return () => { 그만 = true }
  }, [])   // eslint-disable-line react-hooks/exhaustive-deps

  /* 저장 — 주민번호 전체 · 계좌는 st 에 없음(잠근 글 x 만) */
  useEffect(() => {
    if (밖에서.current) { 밖에서.current = false; return }
    set저장됨(쓰기(st))
  }, [st])
  /* 다른 창에서 바꾸면 받아 둠(두 창이 서로 옛 것으로 덮지 않게) — 보는 달은 이 창 것 */
  useEffect(() => {
    const 사건 = (e) => {
      if (e.key !== 저장열쇠 || !e.newValue) return
      try {
        const v = JSON.parse(e.newValue) || {}
        if (!Array.isArray(v.P) || !v.A) return
        밖에서.current = true
        setSt((s) => ({ ...빈것(), ...v, ym: s.ym }))
        if (열쇠) 열기(열쇠, v.P).then((열림) => set비밀(열림))
      } catch (x) { /* 깨진 값 */ }
    }
    window.addEventListener('storage', 사건)
    return () => window.removeEventListener('storage', 사건)
  }, [열쇠])   // eslint-disable-line react-hooks/exhaustive-deps

  const N = useMemo(() => 셈(st, ym), [st, ym])
  const 줄찾기 = (id) => N.줄.find((r) => r.id === id) || null
  const 명단 = st.P.filter((p) => 보임(st, p, ym))
  const 다른명단 = st.P.filter((p) => !보임(st, p, ym))

  const 되돌릴수 = (글, 새) => { set되돌림({ 글, 전: st, 전비밀: 비밀 }); setSt(새) }
  const 되돌리기 = () => {
    if (!되돌림) return
    setSt(되돌림.전); set비밀(되돌림.전비밀); set되돌림(null)
  }
  useEffect(() => { if (!되돌림) return undefined; const t = setTimeout(() => set되돌림(null), 20000); return () => clearTimeout(t) }, [되돌림])

  /* 💰 일당은 이 달(과 아직 안 적은 달)만 바뀜 — 일한 날이 있는 다른 달 명세서는 그대로(노무비 계산기 G162 달값고침 그대로) */
  const 고침 = (id, k, v) => setSt((s) => (k === 'w' ? 달값고침(s, s.ym, id, 'w', v) : { ...s, P: s.P.map((p) => (p.id === id ? { ...p, [k]: v } : p)) }))
  /* 주민번호 · 계좌 — 화면 메모리 + 이 기기 열쇠로 잠근 글(x)만 저장 · 앞 7자리(rf)는 나이 셈에 */
  const 비밀고침 = (id, k, v) => {
    const 새 = { r: '', c: '', ...(비밀[id] || {}), [k]: v }
    set비밀((b) => ({ ...b, [id]: 새 }))
    if (k === 'r') setSt((s) => ({ ...s, P: s.P.map((p) => (p.id === id ? { ...p, rf: 주민앞(v) } : p)) }))
    if (!열쇠) return
    const 차례 = (판차례.current[id] || 0) + 1
    판차례.current[id] = 차례
    ;(async () => {
      const x = 새.r || 새.c ? await 잠그기(열쇠, 새) : ''
      if (판차례.current[id] !== 차례) return
      setSt((s) => ({ ...s, P: s.P.map((p) => (p.id === id ? { ...p, x } : p)) }))
    })()
  }
  const 칸누름 = (id, i) => {
    const r = 줄찾기(id)
    const g = (r ? r.공수[i] : 0) || 0
    const 다음 = g === 0 ? 1 : 공수차례[(공수차례.indexOf(g) + 1) % 공수차례.length]
    setSt((s) => 칸바꿈(s, ym, id, 두자(i + 1), 다음))
  }
  const 줄누름 = (p, 채움) => {
    if (!채움) { 되돌릴수(`${p.n || '이 사람'} — ${달글(ym)} 근로일을 지웠습니다.`, 줄채움(st, ym, p.id, false)); return }
    if (일한날있음(st, ym, p.id)) 되돌릴수(`${p.n || '이 사람'} — ${달글(ym)} 근로일을 «일요일 빼고 모두» 로 바꿨습니다.`, 줄채움(st, ym, p.id, true))
    else setSt(줄채움(st, ym, p.id, true))
  }
  const 대상누름 = (id, c) => {
    const r = 줄찾기(id)
    if (!r) return
    const d = r.대상[c]
    let ap = (r.ap || '').replace(c, ''), ex = (r.ex || '').replace(c, '')
    if (!d.손) { if (d.대상) ex += c; else ap += c }
    setSt((s) => 달값(s, ym, id, { ap, ex }))
  }
  const 사람더함 = () => {
    const id = 새번호()
    setSt((s) => ({ ...s, P: [...s.P, { id, n: '', j: '', w: 0, nx: '', r: [[s.ym, null]], rf: '', t: '', a: '', k: '', x: '' }] }))
    세기('|노무비명세|사람더함')
    setTimeout(() => { const el = document.querySelector('.ms-사람:last-of-type .ms-이름'); if (el) el.focus() }, 60)
  }
  const 빼기 = (p) => {
    const 다른달 = 일한달(st, p.id).filter((m) => m !== ym)
    if (다른달.length) {
      const { st: 새, 부터 } = 명단빼기(st, ym, p.id)
      되돌릴수(`${p.n || '이 사람'} — ${달글(부터)}부터 명단에서 뺐습니다(지난달 명세서는 그대로).`, 새)
    } else 되돌릴수(`${p.n || '이 사람'} — 명단에서 지웠습니다.`, 완전히지우기(st, p.id))
  }
  const 다시넣기 = (p) => setSt(명단넣기(st, ym, p.id))
  const 달옮김 = (n) => { setSt((s) => ({ ...s, ym: 달더하기(s.ym, n) })); if (n > 0) 세기('|노무비명세|다음달') }
  const 예시넣기 = async () => {
    const 새 = 예시(ym)
    let P = 새.P
    if (열쇠) P = await Promise.all(새.P.map(async (p) => ({ ...p, x: 예시비밀[p.id] ? await 잠그기(열쇠, 예시비밀[p.id]) : '' })))
    setSt({ ...새, P })
    set비밀({ ...예시비밀 })
    세기('|노무비명세|예시')
  }
  const 처음부터 = () => {
    되돌릴수('명단 · 모든 달 근로일 · 상호 · 공사명을 지웠습니다.', 빈것(ym))
    set비밀({}); set지움물음(false); 세기('|노무비명세|처음부터')
  }

  /* 🖼 그림 PDF · 인쇄 — 쪽마다(.ms-쪽) A4 가로 277 × 190mm · 글자 층 없음 */
  const 파일이름 = ['일용노무비지급명세서', st.site, ym].filter(Boolean).join('_')
  const 그 = use그림인쇄(파일이름, { 셈: '노무비명세', 판: '#ms-인쇄', 몸표: ['ms-인쇄중'], 조각: ms조각, 홀로: true, 칸줄: true, 맞춤: false })
  const 찍기 = (꼴) => {
    if (!N.줄.length) { set말('일한 날이 있는 사람이 없습니다 — 근로일을 먼저 눌러 주세요'); return }
    if (꼴 === 'pdf') 그.PDF(); else 그.인쇄()
  }
  const 잃은사람 = 명단.filter((p) => p.x && !비밀[p.id]).length
  const 단추들 = (곳) => (
    <div className="ms-단추줄">
      <button type="button" className="btn sm ms-작은단추" onClick={() => 찍기('pdf')} disabled={!!그.찍기}>{그.찍기 === 'pdf' ? `PDF 만드는 중… ${그.진행 || ''}` : '📄 PDF 저장 (A4 가로)'}</button>
      <button type="button" className="btn line sm ms-작은단추" onClick={() => 찍기('인쇄')} disabled={!!그.찍기}>{그.찍기 === '인쇄' ? '준비 중…' : '🖨 인쇄'}</button>
      {곳 === '위' && 그.말 && <span className="ms-말" role="status">{그.말}</span>}
      {곳 === '위' && 말 && <span className="ms-말" role="status">{말}</span>}
    </div>
  )

  return (
    <>
      <div className="kcm-인쇄안내">🖨 지급명세서는 화면의 <b>«📄 PDF 저장»</b> 또는 <b>«🖨 인쇄»</b> 단추로 인쇄해 주세요.</div>
      <div className="wrap ms 그림만인쇄">
        <div className="card">
          <h1 className="tl-h1" style={{ marginTop: 0 }}>🧾 일용노무비 지급명세서</h1>
          <p className="cp" style={{ margin: '6px 0 0' }}>
            현장에서 쓰는 <b>한 장 표</b> 그대로입니다. 사람마다 직종 · 성명 · 주민번호 · 전화 · 주소 · 일당 · 은행 · 계좌를 적고 <b>일한 날만 누르면</b>{' '}
            총공수 · 노무비 · 소득세 · 주민세 · 고용보험 · 국민연금 · 건강보험 · 요양보험 · 차감 지급액이 저절로 나오고, <b>A4 가로 PDF · 인쇄</b>로 받습니다.
          </p>
          <div className="ms-띠">
            <span>🧮 공제는 <Link to="/tools/nomubi">노무비 계산기</Link>와 같은 셈 · 2026년 요율 · 4대보험 가입 기준 · 나이(주민번호로 저절로)</span>
            <span>💾 이 기기에만 저장 — 주민번호 · 계좌는 잠가 둡니다(서버로 안 보냄){저장됨 ? '' : <b className="ms-경고"> — 지금 저장이 막혀 있습니다(사생활 보호 창 등)</b>}</span>
          </div>
          {열쇠 === false && <div className="ms-알림">🔒 이 창에서는 기기 열쇠를 쓸 수 없어 주민번호 · 계좌를 저장하지 않습니다(사생활 보호 창 등) — 화면을 닫으면 그 두 칸은 다시 적어야 합니다.</div>}
          <div className="ms-위칸">
            <label className="ms-칸"><span>상호</span><input className="ms-in" value={st.co} placeholder="(주)○○건설" onChange={(e) => setSt((s) => ({ ...s, co: e.target.value }))} /></label>
            <label className="ms-칸 ms-넓게"><span>공사명</span><input className="ms-in" value={st.site} placeholder="○○ 정비공사" onChange={(e) => setSt((s) => ({ ...s, site: e.target.value }))} /></label>
          </div>
          <div className="ms-달줄">
            <button type="button" className="btn line sm ms-작은단추" aria-label="이전 달" onClick={() => 달옮김(-1)}>‹ 이전 달</button>
            <b className="ms-달">{달글(ym)}</b>
            <span className="muted">기간 {기간(ym).처음} ~ {기간(ym).끝} · {달날수(ym)}일</span>
            <button type="button" className="btn line sm ms-작은단추" aria-label="다음 달" onClick={() => 달옮김(1)}>다음 달 ›</button>
          </div>
          <div className="ms-단추줄" style={{ marginTop: 8 }}>
            {st.P.length === 0 && <button type="button" className="btn sm ms-작은단추" onClick={예시넣기}>✍ 예시 채우기</button>}
            {st.P.length > 0 && !지움물음 && <button type="button" className="btn line sm ms-작은단추" onClick={() => set지움물음(true)}>처음부터 (모두 지우기)</button>}
            {지움물음 && (
              <span className="ms-물음">명단 · 모든 달 근로일 · 상호 · 공사명을 지웁니다.
                <button type="button" className="btn sm ms-작은단추" onClick={처음부터}>지우기</button>
                <button type="button" className="btn line sm ms-작은단추" onClick={() => set지움물음(false)}>그대로 두기</button>
              </span>
            )}
          </div>
          {되돌림 && (
            <div className="ms-되돌림" role="status">{되돌림.글} <button type="button" className="btn sm ms-작은단추" onClick={되돌리기}>↩ 되돌리기</button></div>
          )}
        </div>

        <div className="card">
          <div className="ms-합줄">
            <span>{달글(ym)} · <b>{N.합계.인원}명</b> · 총공수 <b>{합꼴(N.합계.공수) === '-' ? '0' : 합꼴(N.합계.공수)}</b></span>
            <span>노무비 <b>{원(N.합계.보수)}</b> · 공제 <b>{원(N.합계.합)}</b> · 차감 지급액 <b className="ms-차감">{원(N.합계.차인)}</b></span>
          </div>
          {단추들('위')}
          {잃은사람 > 0 && <div className="ms-알림">🔑 {잃은사람}명은 주민번호 뒷자리 · 계좌를 다시 적어야 종이에 다 나옵니다.</div>}
        </div>

        <datalist id="ms-직종들">{직종들.map((x) => <option key={x} value={x} />)}</datalist>
        <datalist id="ms-은행들">{은행들.map((x) => <option key={x} value={x} />)}</datalist>
        <div className="ms-명단">
          {명단.map((p, i) => (
            <사람칸 key={p.id} p={p} 번={i + 1} r={줄찾기(p.id)} 열린={비밀[p.id]} ym={ym} 열쇠없음={열쇠 === false}
              on고침={(k, v) => 고침(p.id, k, v)} on비밀={(k, v) => 비밀고침(p.id, k, v)} on칸={(i2) => 칸누름(p.id, i2)}
              on줄={(채움) => 줄누름(p, 채움)} on대상={(c) => 대상누름(p.id, c)} on빼기={() => 빼기(p)} />
          ))}
        </div>
        <div className="card">
          <button type="button" className="btn sm ms-작은단추" onClick={사람더함}>＋ 사람 더하기</button>
          {명단.length === 0 && <span className="muted" style={{ marginLeft: 8, fontSize: 13 }}>«＋ 사람 더하기» 로 적거나, 위의 «✍ 예시 채우기» 로 먼저 둘러보십시오.</span>}
          {다른명단.length > 0 && (
            <div className="ms-다른명단">
              <span className="muted">다른 달 명단:</span>
              {다른명단.map((p) => <button type="button" key={p.id} className="btn line sm ms-작은단추" onClick={() => 다시넣기(p)}>＋ {p.n || '이름 없음'}</button>)}
            </div>
          )}
        </div>

        <div className="card">
          <미리보기 st={st} N={N} 비밀={비밀} />
          {단추들('아래')}
          <ul className="ms-설명">
            <li>공제 — 소득세는 날마다 (일당 − 15만원) × 2.7%(한 달 합 1천원 미만은 안 뗌) · 주민세(지방소득세) 10% · 고용보험 0.9% · 국민연금 4.75% · 건강보험 3.595% · 요양보험 건강보험료 × 13.14%(2026년). 국민연금 · 건강보험은 가입 기준(한 달 8일 · 첫 근로일부터 1개월 등)과 나이(만 60세 연금 · 만 65세 고용)를 저절로 봅니다 — 사람마다 «연금 · 건강 · 고용» 단추로 이 달만 넣고 뺄 수 있습니다.</li>
            <li>근로내용 확인신고는 일한 달의 다음 달 15일까지입니다 — 국세청 칸까지 적어 내면 일용근로소득 지급명세서를 낸 것으로 봅니다. 신고에 옮겨 적을 집계 · 퇴직공제 · 보험료는 <Link to="/tools/nomubi">노무비 계산기</Link>에서.</li>
            <li>주민번호 · 계좌는 이 기기 안에서 잠근 글로만 저장되고 서버로 가지 않습니다. 브라우저 기록(사이트 데이터)을 지우면 적은 것이 모두 사라집니다.</li>
          </ul>
        </div>
      </div>
      {그.판 && createPortal(<div id="ms-인쇄"><종이들 st={st} N={N} 비밀={비밀} /></div>, document.body)}
    </>
  )
}
