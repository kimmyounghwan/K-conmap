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
 * ■ 🏛 (G123 · 2026-10-03) 소장님 「관급자재는 그대로 둬야지. 내역서만 비율에 맞게」 —
 *    관급 줄(관급자재대 묶음 · 이름 · 비고의 «관급»)은 그대로 · 화면에 잡힌 줄 목록 · 줄마다 끄기 · 맞출 금액은 관급 뺀 금액
 *    (G124) «지급자재»(발주자 지급자재 · LH 지급자재 · 지급자재대 …) · 【관급자재】 · 관급(지급)자재 꼴도 관급으로 잡음
 *    (G124) 🧮 합계 · 소계 · 공종 머리 · 원가계산 줄은 품목에서 뺌(목록으로 보여 줌) · «공종 | 품명» 두 칸 꼴은 품명 칸으로 읽음
 * ■ 🏷 (G169 · 2026-10-06) 소장님 「비율 맞추기면 내역서를 주는 거잖아. 그럼 내역서 틀을 유지 해줘야지 … 올린 내역서에서 비율만」
 *    → 「낙찰금액 맞추기」 → 「해줘」 — lib/낙찰맞추기.js 틀그대로():
 *    올린 엑셀의 시트 · 칸 · 서식 · 병합을 그대로 두고 «숫자만 값으로» 갈아 끼움(시트를 붙이지 않음) ·
 *    원가계산서 · 총괄표까지 원본의 요율 · 산출근거로 다시 셈 · 낙찰금액이면 도급액 = 낙찰금액(끝전은 이윤) · A값 · 관급 그대로
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { askAfter } from '../AskComment'
import { 세기 } from '../lib/받은수.jsx'   /* 🏷 G169 */

import { 끌어놓기 as 끌어놓기판 } from '../끌어놓기.jsx'
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

  const [모드, set모드] = useState('비율')     /* '비율' | '금액' | '낙찰' (G169 — 도급액을 낙찰금액에) */
  const [낙찰글, set낙찰글] = useState('')
  const [A값그대로, setA값그대로] = useState(true)
  const [틀, set틀] = useState(null)          /* G169 틀그대로 결과 {url, name, 말, 원가줄, 낙} */
  const [비율글, set비율글] = useState('80')
  const [목표글, set목표글] = useState('')
  const [단수꼴, set단수꼴] = useState('버림')
  const [노무고정, set노무고정] = useState(false)
  const [관급그대로, set관급그대로] = useState(true)
  const [관급끔, set관급끔] = useState(() => new Set())
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
    setErr(''); setOut(null); set틀(null); set온것(null); set고른시트([]); setFile(null); set관급끔(new Set())
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
    if (!읽은 || !lib || 모드 === '낙찰') return null
    try {
      return {
        값: lib.맞추기(읽은, {
          비율: 모드 === '비율' ? Number(String(비율글).replace(/[^\d.]/g, '')) : 0,
          목표: 모드 === '금액' ? Number(String(목표글).replace(/[^\d.]/g, '')) : 0,
          단수꼴, 노무고정, 관급그대로, 관급끔,
        }),
        탈: '',
      }
    } catch (e) { return { 값: null, 탈: (e && e.message) || '셈하지 못했습니다.' } }
  }, [읽은, lib, 모드, 비율글, 목표글, 단수꼴, 노무고정, 관급그대로, 관급끔])

  /* 🧮 품목에서 뺀 합계 · 소계 · 머리 · 원가 줄 (G124) */
  const 모음들 = useMemo(() => (읽은 && 읽은.모음들 ? 읽은.모음들 : []), [읽은])
  const 모음셈 = useMemo(() => 모음들.reduce((a, x) => { a[x.모음꼴] = (a[x.모음꼴] || 0) + 1; return a }, {}), [모음들])
  const 모음말 = (x) => (x.모음꼴 === '합계' ? '합계 · 소계 줄'
    : x.모음꼴 === '머리' ? '공종 머리 — 아래 ' + fmt((x.아이줄 || []).length) + '줄의 합' + (x.근사 ? '(원본 숫자가 조금 다름)' : '')
    : x.모음꼴 === '원가' ? '원가계산 줄'
    : x.모음꼴 === '중복' ? '위 요약에 한 번 더 적힌 줄'
    : x.모음꼴 === '총괄' ? '공사명 총괄(전체 총액) 줄' : x.모음꼴)
  /* 🏛 관급으로 잡힌 줄 — 화면에서 줄마다 끌 수 있습니다 */
  const 관급들 = useMemo(() => (읽은 ? 읽은.rows.filter((x) => x.관급) : []), [읽은])
  const 관급말 = { 묶음: '관급 · 지급자재 묶음 안', 이름: '이름에 «관급 · 지급자재»', 비고: '비고 «관급 · 지급»', 시트: '관급 · 지급자재 시트', 칸: '관급여부 칸' }
  const 관급켬수 = 관급그대로 ? 관급들.filter((x) => !관급끔.has(x.시트 + '#' + x.줄)).length : 0
  const 관급켬합 = 관급그대로 ? 관급들.filter((x) => !관급끔.has(x.시트 + '#' + x.줄)).reduce((a, x) => a + (x.총금액 || 0), 0) : 0

  const R = 결과 && 결과.값
  /* 설정이 바뀌면 전에 만든 파일(틀 그대로 · 수식 · 새 엑셀)은 내립니다 — 옛 비율 파일을 받지 않게 */
  useEffect(() => { set틀(null); setOut(null) }, [모드, 비율글, 목표글, 낙찰글, 단수꼴, 노무고정, 관급그대로, 관급끔, 고른시트, A값그대로])

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
          ['⭐ 「' + got.비율시트 + '」 시트가 붙었습니다',
            '그 시트의 노란 칸(B2)에 숫자만 고치시면 — 80 이면 80% — 내역서가 «그 자리에서» 다시 셈됩니다. ' +
            '당초 단가는 그 시트에 남겨 두었습니다(지우지 마십시오).'],
          ['수식으로 바꾼 칸', fmt(got.칸) + '칸 — 값이 아니라 «비율 칸을 보는 수식» 입니다'],
          ['살려 둔 원본 수식', fmt(got.지킨수식) + '칸' +
            (got.단수씌움 ? ' (그 가운데 ' + fmt(got.단수씌움) + '칸은 반올림이 없어 단수를 씌웠습니다)' : '')],
          ...(got.관급둔 ? [['🏛 관급자재', fmt(got.관급둔) + '줄은 손대지 않았습니다 — 단가 · 금액 그대로']] : []),
          ...(got.모음고침 ? [['🧮 합계 · 소계 · 머리 줄', fmt(got.모음고침) + '칸 — 아래 품목을 더하는 수식(SUM)으로 · 원가계산 줄은 비율을 곱하는 수식으로']] : []),
        ].concat(got.경고.map((x) => ['⚠️ ' + x[0], x[1]]))
        if (got.원본셈) {
          말.push(['⚠️ 원본 셈법', fmt(got.원본셈) + '칸은 원본이 제 반올림을 갖고 있어 그대로 두었습니다 ' +
            '(예: =ROUND(수량×단가,1)). 그래서 엑셀에서 나오는 합계가 위에 보여 드린 합계와 ' +
            '«원 단위로 몇 원» 다를 수 있습니다 — 딱 맞아야 하면 「새 엑셀 한 벌」 을 쓰십시오.'])
        }
        if (단수조정 && R.목표 && R.차액 !== 0) {
          말.push(['⚠️ 단수조정', '원본을 그대로 고치는 쪽은 «줄을 새로 넣지» 못합니다. ' +
            '차액 ' + fmt(R.차액) + '원은 그대로 남습니다 — 새 엑셀 쪽에는 「단수조정」 줄이 들어갑니다.'])
        }
      } else {
        bytes = lib.toBiyulXlsx(읽은, R, { 단수조정, 원본이름: file.name, 일감 })
        name = '내역서_' + (Math.round(R.비율 * 10000) / 100) + '%_원가계산서.xlsx'
        말 = [
          ['⭐ 「비율」 시트가 맨 앞에 있습니다',
            '그 시트의 노란 칸(B2)에 숫자만 고치시면 — 80 이면 80% — 내역서 · 대비표 · 원가계산서 · ' +
            '시트별 집계가 «전부» 다시 셈됩니다. 다시 올리실 것 없습니다.'],
          ['시트 여섯 장', '비율 · 내역서 · 대비표 · 원가계산서 · 시트별 집계 · 쓴표'],
          ['원가계산서', 읽은.셋있나
            ? '재료비·노무비·경비를 내역서에서 «수식으로» 받습니다 — 비율을 바꾸면 같이 바뀝니다. 요율(노란 칸)은 맞춰 보십시오.'
            : '재료비·노무비·경비 갈래가 없어 «0» 으로 두었습니다 — 손으로 넣으십시오.'],
          ['맞출 금액', '「비율」 시트 B3 에 금액을 넣으시면 「단수조정」 줄이 차액을 먹어 총액이 딱 맞습니다.' +
            (R.관급줄 ? ' — 관급을 뺀 금액입니다.' : '')],
          ...(R.관급줄 ? [['🏛 관급자재', fmt(R.관급줄) + '줄 · ' + fmt(R.관급합) + '원은 그대로 — 내역서 «관급» 칸 · 원가계산서 «관급자재비»(도급액 밖)']] : []),
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

  /* 🏷 G169 — 올린 엑셀 «틀 그대로» (값으로 · 원가계산서 · 총괄표까지) */
  const 틀만들기 = async () => {
    if (!file || !읽은) return
    const 낙찰 = 모드 === '낙찰' ? Number(String(낙찰글).replace(/[^\d]/g, '')) : 0
    if (모드 === '낙찰' && !(낙찰 > 0)) { setErr('낙찰금액(도급액 · 부가세 포함)을 넣어 주십시오.'); return }
    if (모드 !== '낙찰' && !R) return
    setBusy(모드 === '낙찰' ? '낙찰금액에 맞는 비율을 찾는 중입니다 — 내역 · 원가계산서를 여러 번 다시 셉니다…' : '올린 엑셀에 새 값을 넣는 중입니다…'); setErr('')
    if (틀 && 틀.url) { try { URL.revokeObjectURL(틀.url) } catch (e) { /* 지나갑니다 */ } }
    set틀(null)
    await new Promise((r) => setTimeout(r, 40))
    try {
      let n
      try { n = await import('../lib/낙찰맞추기.js') } catch (e) { throw new Error('도구를 불러오지 못했습니다 — 화면을 한 번 새로고침해 주십시오.') }
      const got = n.틀그대로(file.buf, 읽은, {
        단수꼴, 노무고정, 관급그대로, 관급끔,
        A값그대로: 모드 === '낙찰' ? A값그대로 : false,
        낙찰금액: 낙찰, 비율: 모드 === '낙찰' ? 0 : R.비율 * 100,
      })
      const 밑 = file.name.replace(/\.(xlsx|xlsm)$/i, '')
      const name = 모드 === '낙찰' ? 밑 + '_낙찰' + 낙찰 + '원.xlsx' : 밑 + '_' + (Math.round(got.비율 * 10000) / 100) + '%_그대로.xlsx'
      const 말 = []
      if (got.낙) {
        말.push(['도급액', fmt(got.낙.당초도급액) + '원 → ' + fmt(got.낙.도급액) + '원' + (got.낙.도급액 === 낙찰 ? ' — 낙찰금액과 딱 맞습니다' : ' — 낙찰금액과 ' + fmt(낙찰 - got.낙.도급액) + '원 다릅니다')])
        말.push(['비율', pct(got.비율) + ' — 품목 단가(재료비 · 노무비 · 경비)에 곱했습니다'])
        if (got.낙.이윤덧 || got.낙.부가덧) 말.push(['끝전', (got.낙.이윤덧 ? '이윤 +' + fmt(got.낙.이윤덧) + '원' : '') + (got.낙.부가덧 ? (got.낙.이윤덧 ? ' · ' : '') + '부가세 ' + (got.낙.부가덧 > 0 ? '+' : '') + fmt(got.낙.부가덧) + '원' : '') + '으로 맞췄습니다'])
      } else 말.push(['비율', pct(got.비율)])
      말.push(['바꾼 칸', fmt(got.바꾼칸) + '칸 — 품목 ' + fmt(got.품목칸) + ' · 공종 머리 ' + fmt(got.머리칸) + ' · 원가 ' + fmt(got.원가칸) + (got.짝칸 ? ' · 총괄표 등 ' + fmt(got.짝칸) : '') + ' · 모두 «값» 으로'])
      말.push(['그대로 둔 것', '시트 · 칸 · 서식 · 병합 · 인쇄영역 · 글자 칸' + (got.A값줄 ? ' · A값 묶음 품목 ' + fmt(got.A값줄) + '줄' : '') + (got.관급줄 ? ' · 관급 ' + fmt(got.관급줄) + '줄' : '')])
      if (!got.원가시트) 말.push(['⚠️ 원가계산서', '원가계산서 시트(비목 · 금액)를 못 찾아 내역서만 고쳤습니다'])
      for (const w of got.경고.slice(0, 12)) 말.push(['⚠️ ' + w[0], w[1]])
      if (got.경고.length > 12) 말.push(['⚠️ 그 밖', fmt(got.경고.length - 12) + '건'])
      const url = URL.createObjectURL(new Blob([got.bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
      set틀({ url, name, 말, 원가줄: got.원가줄, 원가시트: got.원가시트 })
      try { 세기(모드 === '낙찰' ? '|비율|낙찰틀' : '|비율|틀그대로') } catch (e) { /* 지나갑니다 */ }
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
          나온 엑셀에서 <b>퍼센트만 고치면 전부 다시 셈됩니다</b> — 여기 다시 오실 필요가 없습니다.
        </p>
        <p className="muted" style={{ margin: 0 }}>
          <b>하도급 내역서</b>(도급 × 하도급률) · <b>실행 내역서</b>(도급 × 실행률) ·
          <b> 계약 내역서</b>(설계 × 낙찰률) — 셈이 같아 한 도구로 만들었습니다.
          <b> 🏷 낙찰금액</b>을 넣으시면 도급액이 그 금액에 딱 맞는 계약내역서를 <b>올리신 엑셀 틀 그대로</b> 드립니다.
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
          <끌어놓기판 글="내역서(엑셀)를 놓으면 엽니다" 길들={[{ 꼴: /\.(xlsx|xlsm)$/i, 받기: (fs) => openFile(fs[0]) }]} />
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
              내역 <b>{fmt(읽은.rows.length)}줄</b> · 당초 합계 <b>{fmt(읽은.합)}원</b>{관급들.length > 0 && <span className="muted"> (관급 포함)</span>}
              {읽은.셋있나
                ? <span> · <b>재료비·노무비·경비</b>가 갈려 있습니다 — 원가계산서까지 자동으로 채웁니다</span>
                : <span className="muted"> · 재료비·노무비·경비 갈래가 없습니다 — 원가계산서는 «0» 으로 둡니다</span>}
            </p>
            ) : <p className="cwarn" style={{ margin: '0 0 6px' }}>⚠️ 쓸 시트를 하나 이상 켜 주십시오.
              {온것.시트들.every((x) => /일위|단가|중기|기계경비|노임|자재|총괄|품셈|산출근거|수량산출|공정|목차|안내|표지|원가계산|예산서|집계/.test(x.시트)) &&
                <> 내역서 시트에 단가가 없어(공내역서) 일위대가 · 총괄 같은 시트만 읽혔습니다 — 그 시트로 맞추실 때만 켜 주십시오.</>}</p>}
            {(온것.시트들.length > 1 || !고른시트.length) && (
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
            {읽은 && (관급들.length > 0 ? (
              <div className="note" style={{ margin: '0 0 8px' }}>
                🏛 <b>관급자재 {fmt(관급들.length)}줄 · {fmt(관급들.reduce((a, x) => a + (x.총금액 || 0), 0))}원</b> —
                관급자재대는 <b>도급액 밖</b>이라 비율을 곱하지 않고 <b>그대로</b> 둡니다. 맞출 금액도 관급을 뺀 금액으로 셉니다.
                <div style={{ marginTop: 6 }}>
                  <label className="tlchk" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                    <input type="checkbox" checked={관급그대로} onChange={(e) => set관급그대로(e.target.checked)} />
                    관급자재는 <b>그대로</b> 두기
                  </label>
                </div>
                {관급그대로 && (
                  <details style={{ marginTop: 6 }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 700 }}>잡힌 줄 보기 · 관급이 아닌 줄은 끄십시오</summary>
                    <div style={{ overflowX: 'auto', marginTop: 6 }}>
                      <table className="tbl left rt-kg">
                        <thead><tr><th>그대로</th><th>시트 · 줄</th><th>공종</th><th>규격</th><th>당초 금액</th><th>왜 관급으로</th></tr></thead>
                        <tbody>
                          {관급들.map((x) => {
                            const k = x.시트 + '#' + x.줄
                            const 켬 = !관급끔.has(k)
                            return (
                              <tr key={k} className={켬 ? '' : 'off'}>
                                <td><input type="checkbox" checked={켬} aria-label={`${x.줄}행 관급 그대로`}
                                  onChange={(e) => set관급끔((v) => { const n = new Set(v); if (e.target.checked) n.delete(k); else n.add(k); return n })} /></td>
                                <td className="nw">{x.시트} · {x.줄}행</td>
                                <td>{String(x.공종).slice(0, 26)}</td>
                                <td>{String(x.규격).slice(0, 18)}</td>
                                <td className="r">{x.총금액 === null ? '' : fmt(x.총금액)}</td>
                                <td className="muted">{관급말[x.관급] || x.관급}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                      «관급자재대 · 관급자재비 · 도급자/관급자 관급자재 · 지급자재(발주자 지급자재 등)» 묶음 아래 줄(이름에 관급이 없는 보도블록 · 조달수수료도)과
                      품명 · 비고에 «관급» · «지급자재» 가 적힌 줄을 잡습니다(사급자재는 도급 몫이라 안 잡습니다). 관급자재관리비 같은 경비 · 노무비가 든 줄(설치 · 타설 등 도급자 일)은 잡지 않습니다.
                    </div>
                  </details>
                )}
              </div>
            ) : (
              <p className="muted" style={{ margin: '0 0 6px', fontSize: 12.5 }}>
                🏛 관급자재로 보이는 줄은 없습니다 — 관급 줄이 있다면 «관급자재대 · 지급자재» 묶음 아래에 있거나 품명 · 비고에 «관급» · «지급자재» 가 적혀 있어야 잡힙니다.
              </p>
            ))}
            {읽은 && 모음들.length > 0 && (
              <div className="note" style={{ margin: '0 0 8px' }}>
                🧮 <b>합계 · 소계 · 공종 머리 줄 {fmt(모음들.length)}줄</b>은 품목으로 세지 않았습니다 —
                아래 품목을 더한 값이라 같이 더하면 <b>두 번</b> 셉니다.
                {모음셈.원가 ? <> 원가계산 줄 {fmt(모음셈.원가)}줄(간접노무비 · 보험료 · 이윤 · 부가세 · 도급액 …)도 뺐습니다.</> : null}
                <details style={{ marginTop: 6 }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 700 }}>뺀 줄 보기</summary>
                  <div style={{ overflowX: 'auto', marginTop: 6 }}>
                    <table className="tbl left rt-kg">
                      <thead><tr><th>시트 · 줄</th><th>이름</th><th>당초 금액</th><th>왜 뺐나</th></tr></thead>
                      <tbody>
                        {모음들.slice(0, 300).map((x) => (
                          <tr key={x.시트 + '#' + x.줄}>
                            <td className="nw">{x.시트} · {x.줄}행</td>
                            <td>{String(x.공종).replace(/\s+/g, ' ').slice(0, 26)}</td>
                            <td className="r">{x.총금액 === null ? '' : fmt(x.총금액)}</td>
                            <td className="muted">{모음말(x)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {모음들.length > 300 && <div className="muted" style={{ fontSize: 12 }}>… 그 밖 {fmt(모음들.length - 300)}줄</div>}
                  <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                    공종 머리는 «아래 품목을 더한 값이 그 금액과 같을 때만» 머리로 봅니다. 셈이 안 맞는 머리 줄은 품목으로 남겨 둡니다.
                  </div>
                </details>
              </div>
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
              <label><input type="radio" checked={모드 === '낙찰'} onChange={() => set모드('낙찰')} /> 🏷 낙찰금액으로</label>
            </div>
            <div>
              <b>{모드 === '비율' ? '비율' : 모드 === '낙찰' ? '낙찰금액' : '맞출 금액'}</b>
              {모드 === '낙찰' ? (
                <label>
                  <input type="text" inputMode="numeric" style={칸꼴(158)}
                    value={낙찰글 ? fmt(Number(String(낙찰글).replace(/[^\d]/g, ''))) : ''}
                    placeholder="예) 25,123,456"
                    onChange={(e) => { set낙찰글(e.target.value.replace(/[^\d]/g, '')); set틀(null) }} /> 원
                  <span className="muted" style={{ fontSize: 12 }}> (도급액 · 부가세 포함 · 관급 뺀 것)</span>
                </label>
              ) : 모드 === '비율' ? (
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
                  {관급켬수 > 0 && <span className="muted" style={{ fontSize: 12 }}> (관급 뺀 금액)</span>}
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
          {모드 === '낙찰' && (
            <div className="note" style={{ marginTop: 10, lineHeight: 1.8 }}>
              🏷 <b>도급액(부가세 포함)이 낙찰금액이 되게</b> 품목 단가에 같은 비율을 곱하고, 원가계산서는 <b>올리신 파일의 요율 · 산출근거 그대로</b> 다시 셉니다.
              원 단위 끝전은 <b>이윤</b>에서 맞춥니다.
              <div style={{ marginTop: 6 }}>
                <label className="tlchk" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                  <input type="checkbox" checked={A값그대로} onChange={(e) => { setA값그대로(e.target.checked); set틀(null) }} />
                  <span><b>A값</b>(국민연금 · 건강 · 노인장기요양 · 퇴직공제부금 · 산업안전보건관리비 · 안전관리비 · 품질관리비)은 <b>설계금액 그대로</b></span>
                </label>
              </div>
            </div>
          )}
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
                <tr><th style={{ width: 140 }}>당초 합계</th><td><b>{fmt(R.원합)}</b> 원{R.관급줄 > 0 && <span className="muted"> — 관급자재를 뺀 것</span>}</td></tr>
                {R.관급줄 > 0 && <tr><th>🏛 관급자재</th><td><b>{fmt(R.관급합)}</b> 원 <span className="muted">— {fmt(R.관급줄)}줄 · 비율 안 곱함 · 그대로</span></td></tr>}
                <tr><th>넣은 비율</th><td><b>{pct(R.비율)}</b>{노무고정 && <span className="muted"> — 노무비를 뺀 나머지에만</span>}</td></tr>
                <tr><th>비율 합계</th><td><b style={{ fontSize: 17 }}>{fmt(R.합)}</b> 원{R.관급줄 > 0 && <span className="muted"> — 관급 뺀 것</span>}</td></tr>
                {R.관급줄 > 0 && <tr><th>관급 포함 총액</th><td>{fmt(R.새전합)} 원 <span className="muted">— 비율 합계 + 관급자재</span></td></tr>}
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
                  <tr key={i} className={x.관급고정 ? 'rt-kgrow' : ''}>
                    <td>{x.관급고정 ? '🏛 ' : ''}{String(x.공종).slice(0, 22)}</td>
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
            {R.관급줄 > 0 && <> 🏛 관급 {fmt(R.관급줄)}줄은 엑셀에서 «관급» 칸에 표시되고 단가 · 금액이 그대로입니다.</>}
          </p>
        </div>
      )}

      {/* ── ③ 내려받기 ── */}
      {읽은 && (R || 모드 === '낙찰') && (
        <div className="card">
          <div className="sec-title">③ 내려받기</div>
          {/* 🏷 G169 — 올린 엑셀 틀 그대로 · 값으로 (먼저) */}
          <div className="btn-row" style={{ justifyContent: 'flex-start', flexWrap: 'wrap' }}>
            <button className="btn primary" disabled={!!busy} onClick={틀만들기}>
              📄 올린 엑셀 그대로 (원가계산서까지 · 값으로)
            </button>
          </div>
          <div className="muted" style={{ fontSize: 12.5, marginTop: 6, lineHeight: 1.8 }}>
            올리신 엑셀과 <b>같은 시트 · 같은 칸 · 같은 서식</b>에 <b>숫자만</b> 새 값으로 넣습니다. 시트를 덧붙이지 않습니다.
            원가계산서 · 총괄표도 <b>원본의 요율 · 산출근거</b>로 다시 셉니다.
          </div>
          {틀 && (
            <div style={{ marginTop: 12 }}>
              <a className="btn primary" href={틀.url} download={틀.name}>⬇ {틀.name}</a>
              <ul className="flist" style={{ marginTop: 10 }}>
                {틀.말.map((x, i) => <li key={i}><b>{x[0]}</b> · {x[1]}</li>)}
              </ul>
              {틀.원가줄 && 틀.원가줄.length > 0 && (
                <details style={{ marginTop: 6 }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 700 }}>원가계산서 «{틀.원가시트}» — 당초 ↔ 새 값 보기</summary>
                  <div style={{ overflowX: 'auto', marginTop: 6 }}>
                    <table className="tbl left rt-kg">
                      <thead><tr><th>비목</th><th>당초</th><th>새 값</th><th>어떻게</th></tr></thead>
                      <tbody>
                        {틀.원가줄.map((x, i) => (
                          <tr key={i}>
                            <td>{(x.구분 ? x.구분 + ' ' : '') + String(x.이름 || '').slice(0, 20)}</td>
                            <td className="r">{fmt(x.옛)}</td>
                            <td className="r"><b>{fmt(x.새)}</b></td>
                            <td className="muted" style={{ fontSize: 12 }}>{String(x.어떻게 || '').slice(0, 60)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              )}
            </div>
          )}
          {모드 !== '낙찰' && R && (<>
          <div className="sec-title" style={{ marginTop: 16, fontSize: 14 }}>다른 꼴로 받기</div>
          <div className="btn-row" style={{ justifyContent: 'flex-start', flexWrap: 'wrap' }}>
            <button className="btn ghost" disabled={!!busy} onClick={() => 만들기('원본')}>
              📄 올린 엑셀에 «비율» 시트 붙여 수식으로
            </button>
            <button className="btn ghost" disabled={!!busy} onClick={() => 만들기('새것')}>
              📊 새 엑셀 한 벌 (내역서 · 대비표 · 원가계산서)
            </button>
          </div>
          <div className="note" style={{ marginTop: 10 }}>
            ⭐ <b>이 두 파일에는 「비율」 시트가 들어 있습니다.</b> 그 시트의 <b>노란 칸에 숫자만 고치시면</b>
            — 80 이라고 적으면 80% — <b>단가·금액·원가계산서가 그 자리에서 전부 다시 셈됩니다.</b>
            비율을 바꾸려고 여기 다시 오실 필요가 없습니다.
          </div>
          <div className="muted" style={{ fontSize: 12.5, marginTop: 8, lineHeight: 1.85 }}>
            <b>비율 시트 붙여 수식으로</b> — 서식·인쇄영역·병합·매크로가 남습니다. 비율을 엑셀에서 바꿔 가며 보실 때.
            단가 칸이 <b>「비율」 시트를 보는 수식</b>으로 바뀌고, 당초 단가는 그 시트에 남습니다.
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
          </>)}
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
          <li><b>🧮 합계 · 소계 · 공종 머리 줄은 품목으로 세지 않습니다.</b> 「[ 합 계 ]」 「소계」 줄과,
            금액이 적힌 공종 머리(「1. 토공 981,210」)는 <b>아래 품목을 더한 값이 그 금액과 같을 때만</b> 머리로 봅니다 —
            같이 더하면 두 번 세어 당초 합계가 부풀고, 맞출 금액으로 맞추면 비율이 틀어집니다.
            내역서 위쪽에 붙은 <b>원가계산 줄</b>(간접노무비 · 보험료 · 일반관리비 · 이윤 · 부가세 · 도급액 …)도 품목이 아닙니다.
            «원본 그대로 고치기» 에서는 이 줄들을 <b>아래 품목을 더하는 수식</b>으로 바꿔 드리고(원가 줄은 비율을 곱하는 수식),
            총공사비 · 총사업비처럼 관급까지 든 총액은 손대지 않고 <b>몇 행인지 알려 드립니다.</b></li>
          <li><b>«공종 | 품명» 두 칸</b>으로 된 내역서는 번호가 아닌 글이 많은 칸을 품명으로 읽습니다.</li>
          <li><b>비율은 «박아 넣지» 않습니다.</b> 엑셀에 <b>「비율」 시트</b>를 붙이고, 단가·금액을
            그 칸을 보는 <b>살아 있는 수식</b>으로 넣습니다. 당초 단가는 그 시트(원본 쪽)나
            숨긴 칸(새 엑셀 쪽)에 남겨 둡니다 — 그게 있어야 다시 곱합니다. <b>지우지 마십시오.</b></li>
          <li><b>🏛 관급자재는 그대로 둡니다.</b> 관급자재대는 <b>도급액 밖</b>(총공사비 = 도급액 + 관급자재대)이라
            하도급 · 실행 비율의 대상이 아닙니다(건설공사 하도급 심사기준 제2조도 하도급 금액 셈에서 «직접 지급하는 자재의 비용» 을 뺍니다).
            «관급자재대 · 관급자재비 · 도급자/관급자 관급자재 · 지급자재» 묶음 아래 줄과
            품명 · 비고에 «관급» · «지급자재» 가 적힌 줄은 <b>단가 · 금액을 손대지 않고</b>, 맞출 금액도 <b>관급을 뺀 금액</b>으로 셉니다.
            원가계산서에는 <b>«관급자재비»</b> 로 따로 들어갑니다. 잘못 잡힌 줄은 올린 뒤 목록에서 끄십시오.</li>
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
          <Link className="btn ghost" to="/naeyeok">📋 내역서 — 다른 도구 · 서식</Link>
          <Link className="btn ghost" to="/change/twoline">🔁 설계변경 2줄 자동변환</Link>
          <Link className="btn ghost" to="/tools">🧰 건설 도구</Link>
        </div>
      </div>
    </div>
  )
}
