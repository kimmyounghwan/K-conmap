/* ==========================================================
   💸 미불금 받기 — 화면 (2026-09-28)
     💸 unpaid          미불금 받는 순서 — 종류별 길 · 지연손해금 · 시효
     ✉️ demand-letter   내용증명 쓰기
     ⚖️ payment-order   지급명령 신청서 쓰기 (인지액·송달료)
     📨 direct-payment  직접지급 요청서 (하도급대금 → 발주자 · 임금 → 원도급사)

   ⚠️ 숫자·조문·문장은 lib/미불셈.js 한 곳에. 여기서는 칸과 종이만 그립니다.
   ⚠️ 넷이 칸을 같이 씁니다(tools.json "store": "unpaid" → 'kcm.calc.unpaid').
      한 번 적은 당사자·금액이 다른 서류에도 그대로 들어갑니다. 이 기기에만 남고 서버로 가지 않습니다.
   ⚠️ 결과는 화면에서 보고 인쇄만 합니다(소장님 방침 2026-09-26 — 파일로 내려받지 않음).
   ========================================================== */
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { use칸, Row, Out } from './calcs.jsx'
import {
  종류들, 종류, 이율표, 이율, 종류별이율, 송달뒤율, 지연손해금, 시효, 받는길,
  송달회분, 송달1회기본, 미지급액,
  내용증명글, 지급명령글, 직접지급글, 하도급사유, 임금사유, 예시값,
} from '../lib/미불셈.js'
import { 날더하기, 날차 } from '../lib/계약셈.js'

const num = (v) => { const n = Number(String(v ?? '').replace(/[^0-9.]/g, '')); return isFinite(n) ? n : 0 }
const 원 = (n) => (n != null ? Math.round(n).toLocaleString('ko-KR') + '원' : '—')
function 억만(n) {
  const v = Math.round(+n || 0)
  if (!(v > 0)) return ''
  const 억 = Math.floor(v / 1e8), 만 = Math.floor((v % 1e8) / 1e4), 나머지 = v % 1e4
  return [억 ? `${억.toLocaleString('ko-KR')}억` : '', 만 ? `${만.toLocaleString('ko-KR')}만` : '', 나머지 ? `${나머지.toLocaleString('ko-KR')}` : ''].filter(Boolean).join(' ') + ' 원'
}
function 오늘() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const 판정칸 = ({ 종류: k = 'info', 머리 = '알림', children }) => <div className={'claudesay ' + k}><b>{머리}</b><span>{children}</span></div>
const 근거줄 = ({ children }) => <div className="kt-law">📜 {children}</div>
const 상담줄 = () => (
  <div className="mb-legal">
    ⚖️ 실무 안내이지 법률상담이 아닙니다. 금액이 크거나 다툼이 있는 사건은 변호사·법무사, 또는 대한법률구조공단(132)과 먼저 상의하십시오.
  </div>
)

/* ── 넷이 같이 쓰는 칸 ──────────────────────────────────────── */
const 칸들 = {
  종류: '공사', 이율: '', 약정율: '',
  나이름: '', 나대표: '', 나주소: '', 나연락: '',
  상대이름: '', 상대대표: '', 상대주소: '', 상대법인: false,
  공사명: '', 세부: '', 계약일: '', 시작일: '', 끝일: '', 계약금액: '',
  총액: '', 받은: '', 지급기일: '', 최고일: '', 계산일: '',
  기한: '', 쓴날: '', 계좌: '', 덧붙임: '',
  발주이름: '', 원이름: '', 법원: '', 당사자: '2', 한회: String(송달1회기본),
  사유: {}, 내역: [], 세통: true,
}
function use미불(ex = {}) {
  const d = {}, set = {}
  for (const f of Object.keys(칸들)) {
    const [v, s] = use칸(f, ex[f] ?? 칸들[f])   // eslint-disable-line react-hooks/rules-of-hooks
    d[f] = v; set[f] = s
  }
  const 율글 = d.이율 || 종류별이율[d.종류] || '상사'
  const 숫자 = {
    ...d, 이율: 율글,
    총액: num(d.총액), 받은: num(d.받은), 계약금액: num(d.계약금액), 약정율: parseFloat(d.약정율) || 0,
    쓴날: d.쓴날 || 오늘(), 기한: d.기한 || 날더하기(d.쓴날 || 오늘(), 7),
    내역: (d.내역 || []).map((x) => ({ ...x, 금액: num(x.금액) })),
  }
  return [d, set, 숫자]
}

function 금액칸({ label, hint, value, set, placeholder }) {
  return (
    <Row label={label} hint={hint}>
      <input inputMode="numeric" value={value} onChange={(e) => set(e.target.value)} placeholder={placeholder} />
      {num(value) > 0 && <span className="kt-won">{억만(num(value))}</span>}
    </Row>
  )
}
const 글칸 = ({ label, hint, value, set, placeholder }) => (
  <Row label={label} hint={hint}><input value={value} onChange={(e) => set(e.target.value)} placeholder={placeholder} /></Row>
)
const 날칸 = ({ label, hint, value, set }) => (
  <Row label={label} hint={hint}><input type="date" value={value} onChange={(e) => set(e.target.value)} /></Row>
)
const 세부이름 = { 공사: ['하도급 공종', '예: 철근콘크리트'], 장비: ['장비', '예: 굴착기 06W'], 노무: ['직종', '예: 형틀목공'], 자재: ['자재', '예: 레미콘'] }
const 끝이름 = { 공사: '시공을 마친(멈춘) 날', 장비: '대여가 끝난 날', 노무: '마지막으로 일한 날', 자재: '마지막 납품일' }
const 상대라벨 = { 공사: '원도급사(원사업자)', 장비: '장비를 빌려 간 곳', 노무: '고용한 사업주', 자재: '자재를 받아 간 곳' }

/* 무엇을 못 받았나 — 알약 */
function 종류고르기({ d, set }) {
  return (
    <div className="mb-kinds">
      {종류들.map((x) => (
        <button type="button" key={x.k} className={'chip' + (d.종류 === x.k ? ' on' : '')}
          onClick={() => { set.종류(x.k); set.이율('') }}>{x.n}</button>
      ))}
    </div>
  )
}

/* 당사자 · 일한 내용 · 금액 — 서류 셋이 같이 씁니다 */
function 공통칸({ d, set, n, 누구 = '내용증명', 이율도 = true }) {
  const k = d.종류
  const [세부l, 세부p] = 세부이름[k] || 세부이름.공사
  const 남 = 미지급액(n)
  const 나말 = 누구 === '지급명령' ? '채권자(나)' : 누구 === '직접지급' ? '보내는 사람(나)' : '발신인(나)'
  const 너말 = 누구 === '지급명령' ? '채무자(상대)' : `${상대라벨[k] || '상대'}`
  return (
    <>
      <div className="kt-h">① 무엇을 못 받았나</div>
      <종류고르기 d={d} set={set} />

      <div className="kt-h">② {나말}</div>
      <div className="tl-grid">
        <글칸 label="이름·상호" value={d.나이름} set={set.나이름} placeholder="○○건설(주) / 홍길동" />
        {k !== '노무' && <글칸 label="대표자" hint="개인이면 비움" value={d.나대표} set={set.나대표} placeholder="" />}
        <글칸 label="주소" value={d.나주소} set={set.나주소} placeholder="○○시 ○○로 00" />
        <글칸 label="연락처" value={d.나연락} set={set.나연락} placeholder="010-0000-0000" />
      </div>

      <div className="kt-h">③ {너말}</div>
      <div className="tl-grid">
        <글칸 label="이름·상호" value={d.상대이름} set={set.상대이름} placeholder="○○종합건설(주)" />
        <글칸 label="대표자" hint="개인이면 비움" value={d.상대대표} set={set.상대대표} placeholder="" />
        <글칸 label="주소" hint={누구 === '지급명령' ? '회사면 본점 — 법원이 여기로 보냅니다' : '회사면 본점'} value={d.상대주소} set={set.상대주소} placeholder="△△시 △△로 00" />
      </div>
      <label className="mb-chk"><input type="checkbox" checked={!!d.상대법인} onChange={(e) => set.상대법인(e.target.checked)} /> 상대가 회사(법인)입니다</label>

      <div className="kt-h">④ 일한 내용</div>
      <div className="tl-grid">
        <글칸 label="공사명(현장)" value={d.공사명} set={set.공사명} placeholder="○○동 ○○공사" />
        <글칸 label={세부l} value={d.세부} set={set.세부} placeholder={세부p} />
        {k !== '노무' && <날칸 label="계약한 날" value={d.계약일} set={set.계약일} />}
        {(k === '장비' || k === '노무') && <날칸 label={k === '노무' ? '일을 시작한 날' : '대여를 시작한 날'} value={d.시작일} set={set.시작일} />}
        <날칸 label={끝이름[k]} value={d.끝일} set={set.끝일} />
        {k === '공사' && 누구 === '직접지급' && <금액칸 label="하도급계약금액" hint="원" value={d.계약금액} set={set.계약금액} placeholder="150,000,000" />}
      </div>

      <div className="kt-h">⑤ 금액</div>
      <div className="tl-grid">
        <금액칸 label={k === '노무' ? '받을 임금 합계' : '받을 금액 합계(기성 등)'} hint="원" value={d.총액} set={set.총액} placeholder="150,000,000" />
        <금액칸 label="그중 받은 금액" hint="원 · 없으면 비움" value={d.받은} set={set.받은} placeholder="100,000,000" />
        <날칸 label="받기로 한 날(지급기일)" hint="이 다음 날부터 지연손해금" value={d.지급기일} set={set.지급기일} />
        {이율도 && (
          <Row label="지연손해금 이율">
            <select value={n.이율} onChange={(e) => set.이율(e.target.value)}>
              {이율표.map((x) => <option key={x.k} value={x.k}>{x.n}</option>)}
            </select>
          </Row>
        )}
        {이율도 && n.이율 === '약정' && (
          <Row label="계약서의 이율" hint="연 %"><input inputMode="decimal" value={d.약정율} onChange={(e) => set.약정율(e.target.value)} placeholder="12" /></Row>
        )}
      </div>
      <Out items={[{ k: '받지 못한 돈', v: 남 > 0 ? 원(남) : '—', big: true }]} />
    </>
  )
}

/* ── 종이 · 인쇄 ─────────────────────────────────────────────
   인쇄할 때만 몸 바로 밑에 종이를 따로 그리고(엑셀화면.jsx 와 같은 방법), 끝나면 치웁니다. */
function use인쇄(제목) {
  const [인쇄중, set인쇄중] = useState(false)
  useEffect(() => {
    if (!인쇄중) return undefined
    const 옛 = document.title
    document.title = 제목 || 옛
    document.body.classList.add('mb-인쇄중'); document.documentElement.classList.add('mb-인쇄중')
    const 끝 = () => { document.body.classList.remove('mb-인쇄중'); document.documentElement.classList.remove('mb-인쇄중'); document.title = 옛; set인쇄중(false) }
    const t = setTimeout(() => {
      window.addEventListener('afterprint', 끝, { once: true })
      try { window.print() } catch (e) { 끝() }
      setTimeout(() => { if (document.body.classList.contains('mb-인쇄중')) 끝() }, 60000)
    }, 120)
    return () => { clearTimeout(t); window.removeEventListener('afterprint', 끝) }
  }, [인쇄중])   // eslint-disable-line react-hooks/exhaustive-deps
  return [인쇄중, () => set인쇄중(true)]
}
function 종이판({ 제목, 부수 = 1, children, 인쇄글 = '🖨 인쇄', 덧 = null }) {
  const [인쇄중, 인쇄] = use인쇄(제목)
  return (
    <div className="mb-out">
      <div className="kt-btns">
        <button type="button" className="btn" style={{ width: 'auto' }} onClick={인쇄}>{인쇄글}{부수 > 1 ? ` · ${부수}부` : ''}</button>
        {덧}
      </div>
      <div className="mb-판"><div className="mb-종이">{children}</div></div>
      {인쇄중 && createPortal(
        <div id="mb-인쇄">{Array.from({ length: 부수 }, (_, i) => <div className="mb-쪽" key={i}><div className="mb-종이">{children}</div></div>)}</div>,
        document.body,
      )}
    </div>
  )
}
const 사람줄 = ({ 머리, p, 대표말 = '대표' }) => (
  <div className="mb-who">
    <div className="mb-whoh">{머리}</div>
    <div className="mb-whob">
      <div><b>{p.이름}</b>{p.대표 ? <span> ({대표말} {p.대표})</span> : null}</div>
      {p.주소 ? <div>주소: {p.주소}</div> : null}
      {p.연락 ? <div>연락처: {p.연락}</div> : null}
    </div>
  </div>
)

/* ══════════════════════════════════════════════════════════
   💸 미불금 받는 순서
   ══════════════════════════════════════════════════════════ */
export function UnpaidGuide({ ex = {} }) {
  const [d, set, n] = use미불(ex)
  const 남 = 미지급액(n)
  const r = 이율(n.이율)
  const 율 = r.율 ?? n.약정율
  const 계산일 = d.계산일 || 오늘()
  const 이자 = 지연손해금({ 원금: 남, 지급기일: n.지급기일, 계산일, 율 })
  const 시 = 시효({ 종류: n.종류, 지급기일: n.지급기일, 최고일: n.최고일 })
  const 남은날 = 시.끝 ? 날차(오늘(), 시.끝) : null
  const 길 = 받는길(n.종류)
  const 도구이름 = { 'demand-letter': '✉️ 내용증명 쓰기', 'payment-order': '⚖️ 지급명령 신청서 쓰기', 'direct-payment': '📨 직접지급 요청서 쓰기' }
  return (
    <div className="tool">
      <div className="kt-h">① 무엇을 못 받았나</div>
      <종류고르기 d={d} set={set} />
      <div className="tl-grid">
        <금액칸 label={n.종류 === '노무' ? '받을 임금 합계' : '받을 금액 합계'} hint="원" value={d.총액} set={set.총액} placeholder="150,000,000" />
        <금액칸 label="그중 받은 금액" hint="원" value={d.받은} set={set.받은} placeholder="100,000,000" />
        <Row label="받기로 한 날(지급기일)"><input type="date" value={d.지급기일} onChange={(e) => set.지급기일(e.target.value)} /></Row>
        <Row label="지연손해금 이율">
          <select value={n.이율} onChange={(e) => set.이율(e.target.value)}>
            {이율표.map((x) => <option key={x.k} value={x.k}>{x.n}</option>)}
          </select>
        </Row>
        {n.이율 === '약정' && <Row label="계약서의 이율" hint="연 %"><input inputMode="decimal" value={d.약정율} onChange={(e) => set.약정율(e.target.value)} placeholder="12" /></Row>}
        <Row label="내용증명 보낸 날" hint="아직이면 비움"><input type="date" value={d.최고일} onChange={(e) => set.최고일(e.target.value)} /></Row>
        <Row label="셈하는 날" hint="비우면 오늘"><input type="date" value={d.계산일} onChange={(e) => set.계산일(e.target.value)} /></Row>
      </div>
      <Out items={[
        { k: '받지 못한 돈', v: 남 > 0 ? 원(남) : '—' },
        { k: `지연손해금 (연 ${율 || 0}% · ${이자.날}일)`, v: 이자.금액 > 0 ? 원(이자.금액) : '—' },
        { k: '합계 (셈하는 날 기준)', v: 남 > 0 ? 원(남 + 이자.금액) : '—', big: true },
        { k: `시효가 끝날 수 있는 날 (${시.년}년)`, v: 시.끝 ? `${시.끝}${남은날 != null ? (남은날 >= 0 ? ` · ${남은날}일 남음` : ` · ${-남은날}일 지남`) : ''}` : '지급기일을 넣으십시오' },
        ...(시.최고끝 ? [{ k: '내용증명 뒤 이 날까지 지급명령·소송·가압류', v: 시.최고끝 }] : []),
      ]} />
      {남은날 != null && 남은날 < 90 && (
        <판정칸 종류="bad" 머리="서두르십시오">
          {남은날 >= 0 ? `시효가 ${남은날}일 남았을 수 있습니다.` : '시효가 이미 지났을 수 있습니다.'} 시효는 지급명령·소송·가압류로 멈춥니다(내용증명은 6개월만 붙잡아 둡니다). 날짜는 짐작이니 전문가에게 바로 확인하십시오.
        </판정칸>
      )}
      <근거줄>지연손해금 {r.근거} · 소장·지급명령 송달 다음 날부터 연 {송달뒤율}%(소송촉진 등에 관한 특례법 제3조) · 시효 {시.근거}</근거줄>
      {시.주의 && <div className="hint kt-hint">⚠️ 장비 대여료의 시효를 1년으로 볼지 3년으로 볼지는 사안마다 다를 수 있어 가장 짧은 1년으로 보여 드립니다.</div>}

      <div className="kt-h" style={{ marginTop: 10 }}>② {종류(n.종류).짧} — 받는 순서</div>
      <ol className="mb-steps">
        {길.map((x, i) => (
          <li key={i}>
            <div className="mb-st">{x.제목}</div>
            <div className="mb-sg">{x.글}</div>
            {x.근거 ? <div className="kt-law">📜 {x.근거}</div> : null}
            {x.도구 ? <Link className="btn line sm mb-go" to={`/tools/${x.도구}`}>{도구이름[x.도구]} →</Link> : null}
          </li>
        ))}
      </ol>
      <div className="hint kt-hint">여기 적은 금액·당사자는 <b>내용증명·지급명령·직접지급 요청서</b>에 그대로 이어집니다. 이 기기에만 남고 서버로 가지 않습니다.</div>
      <상담줄 />
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   ✉️ 내용증명
   ══════════════════════════════════════════════════════════ */
export function DemandLetter({ ex = {} }) {
  const [d, set, n] = use미불(ex)
  const 글 = useMemo(() => 내용증명글(n), [JSON.stringify(n)])   // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="tool">
      <공통칸 d={d} set={set} n={n} 누구="내용증명" />
      <div className="kt-h">⑥ 무엇을 요구하나</div>
      <div className="tl-grid">
        <날칸 label="이 날까지 달라" hint="비우면 쓴 날 + 7일" value={d.기한} set={set.기한} />
        <글칸 label="받을 계좌" hint="은행 · 계좌 · 예금주" value={d.계좌} set={set.계좌} placeholder="○○은행 000-00-000000 (예금주 ○○○)" />
        <날칸 label="쓴 날" hint="비우면 오늘" value={d.쓴날} set={set.쓴날} />
      </div>
      <Row label="한 줄 더 (고칠 수 있음)" hint="예: 기성 확인을 받은 날 · 약속한 문자">
        <textarea className="mb-ta" rows={2} value={d.덧붙임} onChange={(e) => set.덧붙임(e.target.value)} placeholder="수신인의 현장소장은 2026. 7. 10. 문자로 7월 말까지 지급하겠다고 약속하였습니다." />
      </Row>
      <label className="mb-chk"><input type="checkbox" checked={!!d.세통} onChange={(e) => set.세통(e.target.checked)} /> 3부 인쇄 (보내는 것 · 우체국 보관 · 내 보관)</label>

      <종이판 제목={`내용증명_${글.제목}`} 부수={d.세통 ? 3 : 1}>
        <div className="mb-t1">{글.부제}</div>
        <div className="mb-t2">제목: {글.제목}</div>
        <사람줄 머리="발 신 인" p={글.발신} />
        <사람줄 머리="수 신 인" p={글.수신} />
        <ol className="mb-ol">{글.줄.map((x, i) => <li key={i}>{x}</li>)}</ol>
        {글.계좌 && <div className="mb-acct">입금 계좌: {글.계좌}</div>}
        <div className="mb-date">{글.날}</div>
        <div className="mb-sign">발신인 &nbsp;{글.서명} &nbsp;(인)</div>
      </종이판>
      <div className="hint kt-hint">
        <b>보내는 법</b> — A4로 뽑은 같은 것 3부(원본 1 + 등본 2)와 봉투(수신인 주소)를 우체국에 가져가 «내용증명»으로 보내 달라고 하시면 됩니다. 한 부는 우체국이 3년 보관하고 한 부는 돌려받습니다.
        {' '}인터넷우체국(e-그린우편)에서 온라인으로도 보낼 수 있습니다. <b>배달증명</b>을 같이 신청하면 상대가 받은 날까지 증명됩니다.
      </div>
      <근거줄>우편법 시행규칙 제46조·제48조(원본과 등본 2통 · 우체국 3년 보관)·제49조(A4) · 민법 제174조(최고 — 6개월 안에 지급명령·소송·가압류)</근거줄>
      <상담줄 />
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   ⚖️ 지급명령 신청서
   ══════════════════════════════════════════════════════════ */
export function PaymentOrder({ ex = {} }) {
  const [d, set, n] = use미불(ex)
  const 글 = useMemo(() => 지급명령글(n), [JSON.stringify(n)])   // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="tool">
      <공통칸 d={d} set={set} n={n} 누구="지급명령" />
      <div className="kt-h">⑥ 법원 · 비용</div>
      <div className="tl-grid">
        <글칸 label="낼 법원" hint="상대 주소지(본점) 또는 내 주소지(영업소) 관할" value={d.법원} set={set.법원} placeholder="○○지방법원 ○○지원" />
        <날칸 label="내용증명 보낸 날" hint="보냈으면 · 이유에 한 줄 들어감" value={d.최고일} set={set.최고일} />
        <Row label="당사자 수" hint="채권자+채무자"><input inputMode="numeric" value={d.당사자} onChange={(e) => set.당사자(e.target.value)} placeholder="2" /></Row>
        <금액칸 label="송달료 1회분" hint={`원 · 법원 안내 금액으로 고치십시오`} value={d.한회} set={set.한회} placeholder={String(송달1회기본)} />
        <날칸 label="쓴 날" hint="비우면 오늘" value={d.쓴날} set={set.쓴날} />
      </div>
      <Row label="이유에 한 줄 더 (고칠 수 있음)" hint="예: 기성 확인·약속 문자">
        <textarea className="mb-ta" rows={2} value={d.덧붙임} onChange={(e) => set.덧붙임(e.target.value)} placeholder="채무자의 현장소장은 2026. 7. 10. 문자로 7월 말까지 지급하겠다고 약속하였습니다." />
      </Row>
      <Out items={[
        { k: '청구금액(소가)', v: 글.청구금액 > 0 ? 원(글.청구금액) : '—' },
        { k: '인지액 (소장의 10분의 1)', v: 글.인지 ? 원(글.인지) : '—' },
        { k: `송달료 (당사자 ${Math.max(2, num(d.당사자) || 2)} × ${송달회분}회분)`, v: 원(글.송달) },
        { k: '독촉절차비용 합계', v: 글.청구금액 > 0 ? 원(글.비용) : '—', big: true },
      ]} />

      <종이판 제목="지급명령신청서">
        <div className="mb-t1">지 급 명 령 신 청 서</div>
        <사람줄 머리="채 권 자" p={글.채권자} 대표말="대표자" />
        <사람줄 머리="채 무 자" p={글.채무자} 대표말="대표자" />
        <div className="mb-case">{글.사건}</div>
        <div className="mb-case">청구금액: {글.청구금액 > 0 ? `금 ${글.청구금액.toLocaleString('ko-KR')}원` : '금 ○○○원'}</div>
        <div className="mb-h">신 청 취 지</div>
        <p className="mb-p">채무자는 채권자에게 아래 청구금액 및 독촉절차비용을 지급하라는 명령을 구합니다.</p>
        <ol className="mb-ol">{글.취지.map((x, i) => <li key={i}>{x}</li>)}</ol>
        <div className="mb-h">독 촉 절 차 비 용</div>
        <p className="mb-p">금 {글.비용.toLocaleString('ko-KR')}원 (인지대 {글.인지.toLocaleString('ko-KR')}원, 송달료 {글.송달.toLocaleString('ko-KR')}원)</p>
        <div className="mb-h">신 청 이 유</div>
        <ol className="mb-ol">{글.이유.map((x, i) => <li key={i}>{x}</li>)}</ol>
        <div className="mb-h">첨 부 서 류</div>
        <ol className="mb-ol mb-att">{글.첨부.map((x) => <li key={x.k}>{x.t} <span>{x.n}통</span></li>)}</ol>
        <div className="mb-date">{글.날}</div>
        <div className="mb-sign">채권자 &nbsp;{글.서명} &nbsp;(서명 또는 날인)</div>
        <div className="mb-court">{글.법원} 귀중</div>
      </종이판>
      <div className="hint kt-hint">
        <b>내는 법</b> — 인쇄해 법원 민원실에 내거나, <b>대한민국 법원 전자소송</b>에서 온라인으로 낼 수 있습니다. 인지액·송달료는 법원 안에 있는 은행에서 냅니다(전자소송은 온라인 납부).
        {' '}채무자가 받은 날부터 <b>2주 안에 이의하지 않으면</b> 확정되어 강제집행할 수 있고, 이의하면 소송으로 넘어갑니다.
        {' '}낼 곳은 <b>채무자 주소지(회사면 본점·주된 영업소) 법원</b>이나, 돈을 받을 곳(따로 정하지 않았으면 <b>채권자의 주소·영업소</b>) 법원입니다(민사소송법 제463조·제8조, 민법 제467조).
      </div>
      <근거줄>민사소송법 제462조·제463조·제470조·제474조 · 민사소송 등 인지법 제2조·제7조②④ · 소송촉진 등에 관한 특례법 제3조 · 같은 조 법정이율 규정(연 {송달뒤율}%) · 송달료 당사자 수 × {송달회분}회분(송달료규칙 업무처리요령 별표 1)</근거줄>
      <상담줄 />
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   📨 직접지급 요청서
   ══════════════════════════════════════════════════════════ */
export function DirectPayment({ ex = {} }) {
  const [d, set, n] = use미불(ex)
  const 모드 = n.종류 === '노무' ? '임금' : n.종류 === '공사' ? '하도급' : null
  const 글 = useMemo(() => (모드 ? 직접지급글({ ...n, 모드 }) : null), [JSON.stringify(n), 모드])   // eslint-disable-line react-hooks/exhaustive-deps
  const 사유목록 = 모드 === '임금' ? 임금사유 : 하도급사유
  const 행 = d.내역 && d.내역.length ? d.내역 : []
  const 행고침 = (i, f, v) => set.내역(행.map((x, j) => (j === i ? { ...x, [f]: v } : x)))
  return (
    <div className="tool">
      <공통칸 d={d} set={set} n={n} 누구="직접지급" 이율도={false} />
      {!모드 ? (
        <판정칸 종류="mid" 머리="안내">
          장비대금·자재대금은 법에 «직접 달라고 청구하는 서류» 가 따로 없습니다. <b>내용증명</b>으로 청구하고, 공공공사면 발주처 감독에게 미지급 사실을 알리십시오.
          장비대금은 <b>대여대금 지급보증서</b>가 있으면 보증기관에 청구합니다(건설산업기본법 제68조의3).
          {' '}<Link to="/tools/demand-letter">✉️ 내용증명 쓰기 →</Link>
        </판정칸>
      ) : (
        <>
          <div className="kt-h">⑥ {모드 === '임금' ? '누구에게 — 원도급사(직상 수급인)' : '누구에게 — 발주자'}</div>
          <div className="tl-grid">
            {모드 === '임금'
              ? <글칸 label="직상 수급인(원도급사) 이름" value={d.원이름} set={set.원이름} placeholder="○○종합건설(주)" />
              : <글칸 label="발주자" hint="기관·부서" value={d.발주이름} set={set.발주이름} placeholder="○○시 (○○과)" />}
            <글칸 label="받을 계좌" hint="은행 · 계좌 · 예금주" value={d.계좌} set={set.계좌} placeholder="○○은행 000-00-000000 (예금주 ○○○)" />
            <날칸 label="쓴 날" hint="비우면 오늘" value={d.쓴날} set={set.쓴날} />
          </div>
          <div className="kt-h">⑦ 요청하는 까닭 (해당하는 것에 표시)</div>
          <div className="kt-chks">
            {사유목록.map((x) => (
              <label className="mb-chk" key={x.k}>
                <input type="checkbox" checked={!!(d.사유 && d.사유[x.k])} onChange={(e) => set.사유({ ...(d.사유 || {}), [x.k]: e.target.checked })} />
                {' '}{x.t} <i className="mb-lawi">{x.근거}</i>
              </label>
            ))}
          </div>
          <div className="kt-h">⑧ 못 받은 내역 (회차별 · 비워도 됨)</div>
          <div className="mb-rows">
            {행.map((x, i) => (
              <div className="mb-rowin" key={i}>
                <input value={x.회차 || ''} onChange={(e) => 행고침(i, '회차', e.target.value)} placeholder={모드 === '임금' ? '2026년 7월분' : '3회 기성 (7월분)'} />
                <input inputMode="numeric" value={x.금액 || ''} onChange={(e) => 행고침(i, '금액', e.target.value)} placeholder="금액(원)" />
                <input type="date" value={x.기일 || ''} onChange={(e) => 행고침(i, '기일', e.target.value)} aria-label="지급기일" />
                <button type="button" className="btn ghost sm" style={{ width: 'auto' }} onClick={() => set.내역(행.filter((_, j) => j !== i))}>✕</button>
              </div>
            ))}
            {행.length < 12 && <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => set.내역([...행, { 회차: '', 금액: '', 기일: '' }])}>＋ 한 줄 더</button>}
          </div>
          {글 && !글.사유.length && <div className="hint kt-hint">⚠️ 까닭을 하나 이상 표시하십시오 — 법에 정한 까닭이 있어야 직접지급을 요청할 수 있습니다.</div>}

          {글 && (
            <종이판 제목={글.제목}>
              <div className="mb-t1">{글.제목}</div>
              <div className="mb-to">수신: {글.수신}</div>
              {글.참조 ? <div className="mb-to">참조: {글.참조}</div> : null}
              <사람줄 머리="보내는 사람" p={글.발신} />
              <table className="mb-tb"><tbody>{글.표.map(([k, v]) => <tr key={k}><th>{k}</th><td>{v}</td></tr>)}</tbody></table>
              {글.사유.length > 0 && (
                <>
                  <div className="mb-h2">요청 사유</div>
                  <ul className="mb-ul">{글.사유.map((x) => <li key={x.k}>{x.t} <span className="mb-lawi">({x.근거})</span></li>)}</ul>
                </>
              )}
              {글.행.length > 0 && (
                <>
                  <div className="mb-h2">못 받은 내역</div>
                  <table className="mb-tb mb-tb2">
                    <thead><tr><th>회차·기간</th><th>금액</th><th>지급기일</th></tr></thead>
                    <tbody>
                      {글.행.map((x, i) => <tr key={i}><td>{x.회차 || ''}</td><td className="r">{x.금액 ? `${Number(x.금액).toLocaleString('ko-KR')}원` : ''}</td><td>{x.기일 || ''}</td></tr>)}
                      <tr className="sum"><td>합계</td><td className="r">{글.행.reduce((a, x) => a + (+x.금액 || 0), 0).toLocaleString('ko-KR')}원</td><td /></tr>
                    </tbody>
                  </table>
                </>
              )}
              <p className="mb-p">{글.본문}</p>
              {글.계좌 && <div className="mb-acct">입금 계좌: {글.계좌}</div>}
              <div className="mb-h2">붙임</div>
              <ol className="mb-ol mb-att">{글.붙임.map((x, i) => <li key={i}>{x} 1부</li>)}</ol>
              <div className="mb-date">{글.날}</div>
              <div className="mb-sign">{글.서명} &nbsp;(인)</div>
            </종이판>
          )}
          <div className="hint kt-hint">
            {모드 === '임금'
              ? <><b>임금 직접지급</b>은 위 수급인이 하수급인에게 줄 <b>하도급대금 범위 안에서</b>, 이 공사에서 생긴 임금만 받을 수 있습니다. 확정된 지급명령이 있으면 가장 확실합니다 — <Link to="/tools/payment-order">⚖️ 지급명령 신청서 쓰기</Link>. 노동청 진정(1350)을 같이 하십시오.</>
              : <><b>발주자는 원도급사에게 줄 대금 범위 안에서</b> 직접 줍니다 — 발주자가 이미 원도급사에게 다 줬으면 어려울 수 있으니 빨리 내십시오. 원도급사에도 사본을 보내 두는 것이 좋습니다(참조). 공공공사는 발주기관 대금지급시스템(하도급지킴이 등)도 확인하십시오.</>}
          </div>
          <근거줄>{모드 === '임금' ? '근로기준법 제44조의2(건설업 임금 연대책임) · 제44조의3(직접 지급)' : '하도급법 제14조(하도급대금의 직접 지급 — ④ 이미 원사업자에게 준 하도급금액은 빼고) · 건설산업기본법 제35조'}</근거줄>
        </>
      )}
      <상담줄 />
    </div>
  )
}

/* 🧪 예시 — 전부 지어낸 것 (lib/미불셈.js 예시값) */
const 노무예시 = { ...예시값, 종류: '노무', 이율: '임금', 나이름: '홍길동', 나대표: '', 상대이름: '마바건설', 상대대표: '임꺽정', 상대법인: false, 세부: '형틀목공', 시작일: '2026-05-04', 끝일: '2026-07-31', 총액: '9,600,000', 받은: '3,200,000', 지급기일: '2026-08-14', 원이름: '다라종합건설(주)', 계좌: '○○은행 000-00-000000 (예금주 홍길동)', 사유: { w2: true }, 내역: [{ 회차: '2026년 6월분', 금액: '3,200,000', 기일: '2026-07-10' }, { 회차: '2026년 7월분', 금액: '3,200,000', 기일: '2026-08-10' }] }
export const 미불EXAMPLES = {
  unpaid: { 글: '하도급 공사대금 1억 5천만 원 중 1억 원만 받음 · 7월 31일이 지급기일', ex: { ...예시값 } },
  'demand-letter': { 글: '하도급 공사대금 5천만 원 미지급 · 지어낸 회사·주소', ex: { ...예시값, 쓴날: '2026-09-28', 기한: '2026-10-08' } },
  'payment-order': { 글: '하도급 공사대금 5천만 원 · 내용증명 뒤 지급명령 · 지어낸 회사', ex: { ...예시값, 쓴날: '2026-09-28', 법원: '△△지방법원' } },
  'direct-payment': { 글: '형틀목공 임금 640만 원 — 원도급사에 직접 청구 · 지어낸 이름', ex: { ...노무예시, 쓴날: '2026-09-28' } },
}
export const 미불CALCS = {
  unpaid: UnpaidGuide,
  'demand-letter': DemandLetter,
  'payment-order': PaymentOrder,
  'direct-payment': DirectPayment,
}
