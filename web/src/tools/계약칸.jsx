/* ==========================================================
   📑 계약·공사 관리 도구 4가지 — 화면 (2026-09-28)
     ⚖️ subcontract-check  하도급 적정성 판정 (82% · 64%) + 직접시공 비율
     📅 after-award        낙찰 뒤 할 일 달력 (+ 담은 공고 마감) → .ics
     ⏱ delay-penalty       지체상금 계산기
     🛡 defect-period      하자담보책임기간 · 하자보수보증금 찾기

   ⚠️ 숫자·조문은 lib/계약셈.js 한 곳에만 있습니다. 여기서는 그리기만 합니다.
   ⚠️ 설명·근거 글은 web/src/data/tools.json 에 (prerender 가 같이 굽습니다).
   ⚠️ 넣은 값은 이 기기에만 남습니다(use칸). 달력 파일도 이 브라우저에서 만들어 바로 받습니다 — 서버로 가지 않습니다.
   ========================================================== */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { use칸, Row, Out } from './calcs.jsx'
import {
  발주갈래, 하도급선, 하도급판정, 직접시공판정, 직접시공표,
  낙찰뒤할일, ics만들기, 날읽기, 날차, 요일글, 해더하기, 날더하기,
  지체율표, 지체한도, 지체일수, 지체상금,
  하자표, 하자찾기, 보증금률표, 하자보증,
} from '../lib/계약셈.js'
import { loadBasket } from '../lib/basket.js'
import { getBidIndex, indexRows } from '../lib/data.js'

const num = (v) => { const n = Number(String(v ?? '').replace(/[^0-9.]/g, '')); return isFinite(n) ? n : 0 }
const won = (n) => (n != null && n > 0 ? Math.round(n).toLocaleString('ko-KR') + '원' : '—')
const 원 = (n) => (n != null ? Math.round(n).toLocaleString('ko-KR') + '원' : '—')
const 퍼 = (n, d = 2) => (n != null ? n.toFixed(d) + '%' : '—')
/* 「2억 5,000만 원」 — 긴 숫자를 한눈에 */
function 억만(n) {
  const v = Math.round(+n || 0)
  if (!(v > 0)) return ''
  const 억 = Math.floor(v / 1e8), 만 = Math.floor((v % 1e8) / 1e4), 나머지 = v % 1e4
  return [억 ? `${억.toLocaleString('ko-KR')}억` : '', 만 ? `${만.toLocaleString('ko-KR')}만` : '', 나머지 ? `${나머지.toLocaleString('ko-KR')}` : ''].filter(Boolean).join(' ') + ' 원'
}
function 금액칸({ label, hint, value, set, placeholder }) {
  return (
    <Row label={label} hint={hint}>
      <input inputMode="numeric" value={value} onChange={(e) => set(e.target.value)} placeholder={placeholder} />
      {num(value) > 0 && <span className="kt-won">{억만(num(value))}</span>}
    </Row>
  )
}
function 오늘() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function 디데이(날, 기준 = 오늘()) {
  const n = 날차(기준, 날)
  if (n == null) return ''
  return n === 0 ? 'D-DAY' : n > 0 ? `D-${n}` : `${-n}일 지남`
}
const 판정칸 = ({ 종류 = 'info', children }) => <div className={'claudesay ' + 종류}><b>판정</b><span>{children}</span></div>
const 근거줄 = ({ children }) => <div className="kt-law">📜 {children}</div>

/* ══════════════════════════════════════════════════════════
   ⚖️ 하도급 적정성 판정
   ══════════════════════════════════════════════════════════ */
export function SubcontractCheck({ ex = {} }) {
  const [발주, set발주] = use칸('발주', ex.발주 ?? '국가')
  const [상당, set상당] = use칸('상당', ex.상당 ?? '')
  const [예가, set예가] = use칸('예가', ex.예가 ?? '')
  const [하도, set하도] = use칸('하도', ex.하도 ?? '')
  const [도급, set도급] = use칸('도급', ex.도급 ?? '')
  const [노무, set노무] = use칸('노무', ex.노무 ?? '')
  const [직접, set직접] = use칸('직접', ex.직접 ?? '')
  const r = 하도급판정({ 발주, 상당금액: num(상당), 예정가격: num(예가), 하도급금액: num(하도) })
  const j = 직접시공판정({ 도급금액: num(도급), 총노무비: num(노무), 직접노무비: num(직접) })
  const 미달글 = [r.미달82 ? `상당금액의 ${하도급선.상당}% 미달` : '', r.미달64 ? `예정가격의 ${하도급선.예가}% 미달` : ''].filter(Boolean).join(' · ')
  return (
    <div className="tool">
      <div className="kt-h">⚖️ 하도급 금액이 적정한가</div>
      <div className="tl-grid">
        <Row label="발주자">
          <select value={발주} onChange={(e) => set발주(e.target.value)}>
            {발주갈래.map((x) => <option key={x.k} value={x.k}>{x.n}</option>)}
          </select>
        </Row>
        <금액칸 label="하도급계약금액" hint="원" value={하도} set={set하도} placeholder="200,000,000" />
        <금액칸 label="도급금액 중 하도급부분 상당금액" hint="원 · 아래 설명" value={상당} set={set상당} placeholder="250,000,000" />
        <금액칸 label="하도급부분의 발주자 예정가격" hint="원 · 모르면 비움" value={예가} set={set예가} placeholder="260,000,000" />
      </div>
      <div className="hint kt-hint">
        <b>상당금액</b> = 하도급할 부분을 우리 <b>산출내역서 계약단가</b>(직접·간접 노무비, 재료비, 경비)로 셈한 금액 + 일반관리비·이윤·부가세.
        {' '}<b>빼는 것</b>: 우리가 하수급인에게 직접 대 주는 자재비, 하도급대금 지급보증서 발급 비용처럼 법령상 우리가 부담하는 금액.
      </div>
      <Out items={[
        { k: `상당금액의 ${하도급선.상당}% 선`, v: r.상당선 != null ? 원(Math.ceil(r.상당선)) : '—' },
        { k: `예정가격의 ${하도급선.예가}% 선`, v: r.예가선 != null ? 원(Math.ceil(r.예가선)) : '—' },
        { k: '하도급금액 ÷ 상당금액', v: 퍼(r.상당율) },
        { k: '하도급금액 ÷ 예정가격', v: 퍼(r.예가율) },
        { k: '적정성 심사', v: r.대상 == null ? '—' : r.대상 ? '심사 대상' : '대상 아님', big: true },
      ]} />
      {r.대상 != null && (
        r.대상
          ? <판정칸 종류="bad">
              {미달글} — 발주자가 하수급인의 시공능력·하도급계약 내용의 적정성을 심사하는 대상입니다.
              {' '}{r.갈.의무 ? <b>이 발주자(국가·지자체·공공기관)는 반드시 심사합니다.</b> : <>민간 발주자는 심사할 수 있습니다.</>}
              {' '}부적정하면 하수급인이나 계약 내용을 바꾸라고 요구받을 수 있습니다(하도급 통보를 받은 날부터 30일 안에 서면).
              {r.최소 ? <> 심사 대상에서 벗어나려면 하도급금액이 <b>{원(r.최소)}</b> 이상이어야 합니다.</> : null}
            </판정칸>
          : <판정칸 종류="good">넣으신 금액으로는 {하도급선.상당}% · {하도급선.예가}% 선을 모두 넘습니다 — 금액 때문에 심사 대상이 되지는 않습니다.</판정칸>
      )}
      <근거줄>건설산업기본법 제31조 · 시행령 제34조①(82% · 64%) · ②(공공기관) · ③(30일 서면) — 시행 2026.6.23. 현행</근거줄>

      <div className="kt-h" style={{ marginTop: 8 }}>🔨 직접시공 비율 (도급 70억 원 미만)</div>
      <div className="tl-grid">
        <금액칸 label="도급금액" hint="원" value={도급} set={set도급} placeholder="1,200,000,000" />
        <금액칸 label="산출내역서 총 노무비" hint="원" value={노무} set={set노무} placeholder="300,000,000" />
        <금액칸 label="우리가 직접 시공할 부분의 노무비" hint="원" value={직접} set={set직접} placeholder="70,000,000" />
      </div>
      <Out items={[
        { k: '도급금액 구간', v: j.칸 ? `${j.칸.글} → ${j.칸.율}%` : j.해당없음 ? '70억 원 이상 — 의무 없음' : '—' },
        { k: '직접 시공해야 할 노무비', v: j.기준 != null ? 원(j.기준) : '—' },
        { k: '지금 직접 시공 비율', v: 퍼(j.지금율, 1) },
        { k: '직접시공', v: j.충족 == null ? '—' : j.충족 ? '충족' : `${원(j.모자람)} 모자람`, big: true },
      ]} />
      <div className="hint kt-hint">
        비율: {직접시공표.map((x) => `${x.글} ${x.율}%`).join(' · ')}. 발주자가 품질·능률을 위해 서면으로 승낙했거나, 특허·신기술 부분을 그 기술을 가진 업체에 하도급하면 예외입니다.
        {' '}직접시공계획은 계약한 날부터 30일 안에 발주자에게 통보합니다(전문공사를 전문업종으로 받은 경우, 4천만 원 미만·30일 이내 공사는 제외).
      </div>
      <근거줄>건설산업기본법 제28조의2 · 시행령 제30조의2</근거줄>
      <div className="kt-next">하도급 통보(30일)·지급보증서(30일)·대금 지급(15일) 날짜는 <Link to="/tools/after-award">📅 낙찰 뒤 할 일 달력</Link>에서 한 번에 뽑습니다.</div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   📅 낙찰 뒤 할 일 달력
   ══════════════════════════════════════════════════════════ */
function 받기(이름, 글, 꼴) {
  try {
    const url = URL.createObjectURL(new Blob([글], { type: 꼴 }))
    const a = document.createElement('a')
    a.href = url; a.download = 이름
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 4000)
  } catch (e) { /* 막힌 브라우저 */ }
}
function use담은공고() {
  const [줄, set줄] = useState(null)
  useEffect(() => {
    let 살 = true
    const 담 = loadBasket()
    if (!담.length) { set줄([]); return }
    getBidIndex().then((idx) => {
      if (!살) return
      const rows = indexRows(idx)
      const by = new Map(rows.map((x) => [String(x.no), x]))
      set줄(담.map((no) => by.get(String(no))).filter(Boolean).map((x) => ({
        no: x.no, name: x.name, close: String(x.close || '').slice(0, 16),
        협정: Array.isArray(x.jnt) && x.jnt[5] ? String(x.jnt[5]).slice(0, 16) : '',
      })))
    }).catch(() => { if (살) set줄([]) })
    return () => { 살 = false }
  }, [])
  return 줄
}
export function AfterAward({ ex = {} }) {
  const [낙찰일, set낙찰일] = use칸('낙찰일', ex.낙찰일 ?? '')
  const [계약일, set계약일] = use칸('계약일', ex.계약일 ?? '')
  const [착공일, set착공일] = use칸('착공일', ex.착공일 ?? '')
  const [발주, set발주] = use칸('발주', ex.발주 ?? '국가')
  const [도급, set도급] = use칸('도급', ex.도급 ?? '')
  const [est, setEst] = use칸('추정', ex.추정 ?? '')   /* 이름 est — tools/checklabels.py 가 «추정가격» 이름표에 est 를 찾습니다 */
  const [공기, set공기] = use칸('공기', ex.공기 ?? '')
  const [전문, set전문] = use칸('전문', ex.전문 ?? false)
  const [유해, set유해] = use칸('유해', ex.유해 ?? false)
  const [안전, set안전] = use칸('안전', ex.안전 ?? false)
  const [전기, set전기] = use칸('전기', ex.전기 ?? false)
  const [하도일, set하도일] = use칸('하도일', ex.하도일 ?? '')
  const [하도금, set하도금] = use칸('하도금', ex.하도금 ?? '')
  const [담기, set담기] = use칸('담기', true)
  const 담은 = use담은공고()
  const 일 = useMemo(() => 낙찰뒤할일({
    낙찰일, 계약일, 착공일, 발주, 도급금액: num(도급), 추정가격: num(est), 공기: num(공기),
    전문, 유해, 안전, 전기, 하도급일: 하도일, 하도급금액: num(하도금),
  }), [낙찰일, 계약일, 착공일, 발주, 도급, est, 공기, 전문, 유해, 안전, 전기, 하도일, 하도금])
  const 담은일 = useMemo(() => {
    const out = []
    for (const x of 담은 || []) {
      const d = x.close.slice(0, 10)
      if (날읽기(d) != null) out.push({ 열쇠: 'bid' + x.no, 날: d, 제목: `⭐ 입찰 마감 ${x.close.slice(11)} — ${x.name}`, 글: `공고번호 ${x.no}`, 근거: '' })
      const h = x.협정.slice(0, 10)
      if (날읽기(h) != null) out.push({ 열쇠: 'jnt' + x.no, 날: h, 제목: `🤝 공동수급 협정서 마감 ${x.협정.slice(11)} — ${x.name}`, 글: `공고번호 ${x.no}`, 근거: '' })
    }
    return out.filter((x) => (날차(오늘(), x.날) ?? -1) >= 0)
  }, [담은])
  const 날있는 = 일.filter((x) => x.날)
  const 날없는 = 일.filter((x) => !x.날)
  const 달력용 = [...날있는, ...(담기 ? 담은일 : [])]
  const 받자 = () => 받기('K-건설맵_낙찰뒤할일.ics', ics만들기(달력용, { 이름: 'K-건설맵 낙찰 뒤 할 일' }), 'text/calendar;charset=utf-8')
  const 체크 = (v, set, 글, 곁 = null) => (
    <label className="kt-chk"><input type="checkbox" checked={!!v} onChange={(e) => set(e.target.checked)} /> <span>{글}{곁}</span></label>
  )
  return (
    <div className="tool">
      <div className="tl-grid">
        <Row label="낙찰 통지 받은 날"><input type="date" value={낙찰일} onChange={(e) => set낙찰일(e.target.value)} /></Row>
        <Row label="계약한 날" hint="아직이면 비움"><input type="date" value={계약일} onChange={(e) => set계약일(e.target.value)} /></Row>
        <Row label="착공(예정)일"><input type="date" value={착공일} onChange={(e) => set착공일(e.target.value)} /></Row>
        <Row label="발주자">
          <select value={발주} onChange={(e) => set발주(e.target.value)}>
            {발주갈래.map((x) => <option key={x.k} value={x.k}>{x.n}</option>)}
          </select>
        </Row>
        <금액칸 label="도급(계약)금액" hint="원" value={도급} set={set도급} placeholder="850,000,000" />
        <금액칸 label="추정가격" hint="원 · 모르면 비움" value={est} set={setEst} placeholder="" />
        <Row label="공사기간" hint="일"><input inputMode="numeric" value={공기} onChange={(e) => set공기(e.target.value)} placeholder="180" /></Row>
      </div>
      <div className="kt-chks">
        {체크(전문, set전문, '전문공사를 전문업종으로 받았음 (직접시공계획 통보 없음)')}
        {체크(유해, set유해, '유해·위험방지계획서 대상', <> — <Link to="/safety">대상인지 보기</Link></>)}
        {체크(안전, set안전, '안전관리계획서 대상', <> — <Link to="/safety">대상인지 보기</Link></>)}
        {체크(전기, set전기, '전기공사 (시공관리책임자 지정 통지)')}
      </div>
      <div className="tl-grid">
        <Row label="하도급계약 맺은 날" hint="하도급 없으면 비움"><input type="date" value={하도일} onChange={(e) => set하도일(e.target.value)} /></Row>
        <금액칸 label="하도급금액" hint="원" value={하도금} set={set하도금} placeholder="120,000,000" />
      </div>

      {!낙찰일 && !착공일 && !하도일
        ? <div className="note sm">낙찰 통지 받은 날부터 넣어 보십시오. 날짜가 정해지는 할 일만 달력에 올립니다.</div>
        : (
          <div className="kt-list">
            {날있는.map((x) => (
              <div className={'kt-it' + ((날차(오늘(), x.날) ?? 0) < 0 ? ' past' : '')} key={x.열쇠}>
                <div className="kt-d"><b>{x.날}</b> ({요일글(x.날)})<em>{디데이(x.날)}</em></div>
                <div className="kt-b"><div className="kt-t">{x.제목}</div><div className="kt-g">{x.글}</div><div className="kt-law">📜 {x.근거}</div></div>
              </div>
            ))}
            {날없는.map((x) => (
              <div className="kt-it rule" key={x.열쇠}>
                <div className="kt-d"><b>{x.종류 === '늘' ? '그때마다' : '날짜 넣으면'}</b></div>
                <div className="kt-b"><div className="kt-t">{x.제목}</div><div className="kt-g">{x.글}</div><div className="kt-law">📜 {x.근거}</div></div>
              </div>
            ))}
          </div>
        )}

      {담은 && 담은일.length > 0 && (
        <div className="kt-bag">
          <div className="kt-h">⭐ 담은 공고 {담은일.length}가지 마감</div>
          {담은일.slice(0, 12).map((x) => <div className="kt-bagit" key={x.열쇠}><b>{x.날}</b> {디데이(x.날)} · {x.제목}</div>)}
          {체크(담기, set담기, '달력 파일에 같이 넣기')}
        </div>
      )}

      <div className="kt-btns">
        <button type="button" className="btn" style={{ width: 'auto' }} disabled={!달력용.length} onClick={받자}>📅 달력 파일(.ics) 받기 · {달력용.length}가지</button>
        <button type="button" className="btn line" style={{ width: 'auto' }} onClick={() => window.print()}>🖨 인쇄</button>
      </div>
      <div className="hint kt-hint">
        달력 파일은 이 브라우저에서 만들어 바로 받습니다(어디로도 보내지 않음). 휴대폰·구글·아웃룩 달력에서 열면 일정이 들어가고 <b>하루 전 아침 9시</b>에 알려 줍니다.
        {' '}기한은 법령에 적힌 날 수로 셌습니다(첫날은 빼고 셈) — <b>공고문·계약서에 따로 정한 기한이 있으면 그것이 먼저입니다.</b>
        {' '}마지막 날이 주말·공휴일이면 그 앞 근무일에 끝내 두시는 것이 안전합니다.
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   ⏱ 지체상금 계산기
   ══════════════════════════════════════════════════════════ */
export function DelayPenalty({ ex = {} }) {
  const [곳, set곳] = use칸('곳', ex.곳 ?? '국가')
  const [종, set종] = use칸('종', ex.종 ?? '공사')
  const [율직접, set율직접] = use칸('율직접', ex.율직접 ?? '')
  const [계약, set계약] = use칸('계약', ex.계약 ?? '')
  const [인수, set인수] = use칸('인수', ex.인수 ?? '')
  const [기한, set기한] = use칸('기한', ex.기한 ?? '')
  const [합격, set합격] = use칸('합격', ex.합격 ?? '')
  const [기한안, set기한안] = use칸('기한안', ex.기한안 ?? false)
  const [공휴, set공휴] = use칸('공휴', ex.공휴 ?? false)
  const [뺄, set뺄] = use칸('뺄', ex.뺄 ?? '')
  const [직접일, set직접일] = use칸('직접일', ex.직접일 ?? '')
  const 표 = 지체율표[곳] || null
  const 줄 = 표 ? (표.줄.find((x) => x.k === 종) || 표.줄[0]) : null
  const 율 = 곳 === '직접' ? num(율직접) : 줄 ? 줄.율 : 0
  const 일 = 지체일수({ 준공기한: 기한, 합격일: 합격, 기한안신고: 기한안, 말일공휴: 공휴, 뺄날: num(뺄), 직접: 직접일 === '' ? null : num(직접일) })
  const r = 지체상금({ 계약금액: num(계약), 인수기성: num(인수), 율, 일수: 일.날 || 0 })
  return (
    <div className="tool">
      <div className="tl-grid">
        <Row label="계약 구분">
          <select value={곳} onChange={(e) => set곳(e.target.value)}>
            <option value="국가">국가 (국가계약법)</option>
            <option value="지방">지자체 (지방계약법 · 지연배상금)</option>
            <option value="직접">계약서에 적힌 율 직접</option>
          </select>
        </Row>
        {곳 === '직접'
          ? <Row label="지체상금률" hint="1000분의 몇 (예: 0.5)"><input inputMode="decimal" value={율직접} onChange={(e) => set율직접(e.target.value)} placeholder="0.5" /></Row>
          : (
            <Row label="계약 종류">
              <select value={줄 ? 줄.k : ''} onChange={(e) => set종(e.target.value)}>
                {표.줄.map((x) => <option key={x.k} value={x.k}>{x.n} — 1000분의 {x.율}</option>)}
              </select>
            </Row>
          )}
        <금액칸 label="계약금액" hint="원 · 장기계속은 그해 차수 금액" value={계약} set={set계약} placeholder="500,000,000" />
        <금액칸 label="검사 받고 인수한 기성부분" hint="원 · 없으면 비움" value={인수} set={set인수} placeholder="" />
        <Row label="준공기한" hint="계약서의 준공신고서 제출기일"><input type="date" value={기한} onChange={(e) => set기한(e.target.value)} /></Row>
        <Row label="준공검사 합격일" hint="아직이면 오늘로 셈">
          <input type="date" value={합격} onChange={(e) => set합격(e.target.value)} />
          <button type="button" className="btn ghost sm" style={{ width: 'auto', marginTop: 4 }} onClick={() => set합격(오늘())}>오늘까지로</button>
        </Row>
        <Row label="뺄 날" hint="일 · 우리 책임 아닌 사유·연장 승인"><input inputMode="numeric" value={뺄} onChange={(e) => set뺄(e.target.value)} placeholder="0" /></Row>
        <Row label="지체일수 직접" hint="일 · 셈이 다르면 여기에"><input inputMode="numeric" value={직접일} onChange={(e) => set직접일(e.target.value)} placeholder="비우면 날짜로 셈" /></Row>
      </div>
      <div className="kt-chks">
        <label className="kt-chk"><input type="checkbox" checked={!!기한안} onChange={(e) => set기한안(e.target.checked)} /> <span>준공기한 안에 준공신고서를 냈음 (검사 기간은 지체가 아님)</span></label>
        <label className="kt-chk"><input type="checkbox" checked={!!공휴} onChange={(e) => set공휴(e.target.checked)} /> <span>준공기한 마지막 날이 공휴일·발주기관 휴무일 (그 다음 다음 날부터 셈)</span></label>
      </div>
      <Out items={[
        { k: '지체일수', v: 일.날 != null ? `${일.날}일` : '—' },
        { k: '지체상금률', v: 율 > 0 ? `1000분의 ${율}` : '—' },
        { k: '셈 기준 금액 (계약 − 인수 기성)', v: won(r.기준) },
        { k: '하루치', v: won(r.하루치) },
        { k: '셈한 지체상금', v: 일.날 ? won(r.원금) : '—' },
        { k: `한도 (${지체한도}%)`, v: won(r.한도) },
        { k: '물어야 할 지체상금', v: 일.날 ? 원(r.적용) : '—', big: true },
      ]} />
      {일.글 && <div className="hint kt-hint">🧮 {일.글}{r.한도날 ? ` · 약 ${r.한도날.toLocaleString('ko-KR')}일 늦으면 한도(${지체한도}%)에 닿습니다` : ''}</div>}
      {r.한도걸림 && <판정칸 종류="bad">셈한 금액이 한도를 넘어 <b>한도 {원(r.한도)}</b>까지만 냅니다. 다만 지체가 길어지면 계약 해제·해지 사유가 될 수 있습니다.</판정칸>}
      <div className="hint kt-hint">
        지체일수는 <b>준공기한 다음 날부터 준공검사(시정했으면 최종 검사)에 합격한 날까지</b>입니다. 기한 안에 준공신고서를 냈다면 검사 기간은 넣지 않지만,
        {' '}기한 뒤에 시정조치를 했다면 시정한 날부터 최종 합격일까지는 들어갑니다 — 그 일수는 «지체일수 직접» 칸에 넣으십시오.
        {' '}불가항력, 관급자재 공급 지연, 발주기관 책임의 착공 지연·공사 중지, 우리 책임 아닌 설계변경 같은 날은 빼고, 연장 승인을 받은 기간에는 붙지 않습니다.
      </div>
      <근거줄>{곳 === '직접' ? '계약서' : 표.근거} · 공사계약일반조건(계약예규) 제25조·제26조③ · 원 미만 버림</근거줄>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   🛡 하자담보책임기간 · 하자보수보증금
   ══════════════════════════════════════════════════════════ */
export function DefectPeriod({ ex = {} }) {
  const [k, setK] = use칸('k', ex.k ?? 'd2')
  const [률, set률] = use칸('률', ex.률 ?? '')
  const [시작, set시작] = use칸('시작', ex.시작 ?? '')
  const [계약, set계약] = use칸('계약', ex.계약 ?? '')
  const x = 하자찾기(k) || 하자찾기('d2')
  const 쓸률 = 률 === '' ? x.률 : num(률)
  const 끝 = 날읽기(시작) != null ? 해더하기(시작, x.년) : ''
  const 보 = 하자보증({ 계약금액: num(계약), 률: 쓸률, 조경: k === 'c3' })
  return (
    <div className="tool">
      <Row label="공사 종류">
        <select value={k} onChange={(e) => { setK(e.target.value); set률('') }}>
          {하자표.map((g) => (
            <optgroup key={g.갈래} label={g.갈래}>
              {g.줄.map((y) => <option key={y.k} value={y.k}>{y.이름} — {y.년}년</option>)}
            </optgroup>
          ))}
        </select>
      </Row>
      <div className="tl-grid">
        <Row label="시작일" hint="인수한 날·준공검사 끝난 날 중 빠른 날"><input type="date" value={시작} onChange={(e) => set시작(e.target.value)} /></Row>
        <금액칸 label="계약금액" hint="원" value={계약} set={set계약} placeholder="300,000,000" />
        <Row label="하자보수보증금률" hint="공고·계약서가 우선">
          <select value={String(쓸률)} onChange={(e) => set률(e.target.value)}>
            {보증금률표.map((y) => <option key={y.율} value={String(y.율)}>{y.율}% — {y.글.length > 26 ? y.글.slice(0, 26) + '…' : y.글}</option>)}
          </select>
        </Row>
      </div>
      <Out items={[
        { k: '하자담보책임기간', v: `${x.년}년`, big: true },
        { k: '끝나는 무렵', v: 끝 ? `${날더하기(끝, 0)} (${요일글(끝)})` : '시작일을 넣으면' },
        { k: '하자보수보증금률', v: `계약금액의 ${쓸률}%` },
        { k: '하자보수보증금', v: 보.금액 != null ? 원(보.금액) : '—' },
      ]} />
      {보.면제될수 && <판정칸 종류="good">계약금액 3천만 원 이하 공사(조경 제외)는 하자보수보증금을 내지 않게 할 수 있습니다 — 공고·계약서를 보십시오.</판정칸>}
      <div className="hint kt-hint">
        <b>{x.갈래}</b> · {x.이름}. 여러 공종이 섞인 공사는 <b>세부 공종마다</b> 이 기간을 따로 씁니다(책임을 나눌 수 없으면 주된 공종).
        {' '}보증금률은 계약담당공무원이 공종에 따라 네 칸(5·4·3·2%) 가운데서 정합니다 — 위 값은 공종으로 짚어 본 것이니 <b>공고·계약서에 적힌 율을 쓰십시오.</b>
        {' '}끝나는 날은 보증서에 적힌 보증기간이 기준입니다. 해체공사·단순 암반 절취·모래자갈 채취처럼 하자보수가 필요 없는 공사는 보증금이 없습니다.
      </div>
      <근거줄>{x.법} · 국가계약법 시행령 제60조·제62조, 시행규칙 제70조·제72조 / 지방계약법 시행령 제69조·제71조, 시행규칙 제68조·제70조</근거줄>
      <details className="kt-all">
        <summary>📋 공종별 기간 표 전체 보기</summary>
        {하자표.map((g) => (
          <div key={g.갈래} className="kt-allg">
            <div className="kt-allh">{g.갈래} <i>{g.법}</i></div>
            {g.줄.map((y) => <div key={y.k} className="kt-allr"><span>{y.이름}</span><b>{y.년}년</b></div>)}
          </div>
        ))}
      </details>
    </div>
  )
}

/* 🧪 예시 — 가상의 숫자입니다 (남의 공사 금액을 옮기지 않습니다) */
export const 계약EXAMPLES = {
  'subcontract-check': { 글: '지자체 발주 · 상당금액 2억 5천만 원인 부분을 2억 원에 하도급 · 도급 12억 원', ex: { 발주: '지자체', 상당: '250,000,000', 예가: '260,000,000', 하도: '200,000,000', 도급: '1,200,000,000', 노무: '300,000,000', 직접: '70,000,000' } },
  'after-award': { 글: '국가 발주 8억 5천만 원 공사 · 10월 5일 낙찰 통지 · 10월 20일 착공 · 하도급 1억 2천만 원', ex: { 낙찰일: '2026-10-05', 착공일: '2026-10-20', 발주: '국가', 도급: '850,000,000', 공기: '180', 안전: true, 하도일: '2026-10-26', 하도금: '120,000,000' } },
  'delay-penalty': { 글: '국가 공사 5억 원 · 준공기한 11월 30일 · 12월 15일 준공검사 합격', ex: { 곳: '국가', 종: '공사', 계약: '500,000,000', 기한: '2026-11-30', 합격: '2026-12-15' } },
  'defect-period': { 글: '아스팔트 포장 도로 3억 원 · 12월 20일 준공검사', ex: { k: 'd2', 시작: '2026-12-20', 계약: '300,000,000' } },
}
export const 계약CALCS = {
  'subcontract-check': SubcontractCheck,
  'after-award': AfterAward,
  'delay-penalty': DelayPenalty,
  'defect-period': DefectPeriod,
}
