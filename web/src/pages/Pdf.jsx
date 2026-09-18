/* ==========================================================
   📄 /pdf — PDF 도구. «사이트 안에서» 그대로 합니다.

   소장님: 「건설맵 사이트 도구에 게시해 줘. 다운받게 말고
           사이트 내에서 작업할 수 있게 만들어 줘」 (2026-09-18)
           「브라우저에서 되는 것만 하고, 안되는 것은 제외 해
            그리고 설명까지 할 필요는 없어」

   ■ 파일은 «서버로 올라가지 않습니다»
     전부 보는 분 브라우저 안에서 처리합니다. 남의 설계도서·내역서를
     다루는 도구라 이것이 가장 중요합니다. 전송량이 0 이라 값도 안 듭니다.

   ⚠️ 안 되는 것(낱말 바꾸기·표→엑셀·PDF→워드·비밀번호)은 «넣지 않았습니다».
      화면에 적지도 않습니다 — 소장님 지시입니다. 사이트에서는 없는 기능입니다.
      (PC 판 K-PDF 에는 있습니다. 저장소 밖에 둡니다)

   ■ 실제 일은 src/lib/pdfwork.js 가 합니다. 이 파일은 «고르고 누르는 자리» 입니다.
      그래서 창 없이 시험할 수 있습니다 — tools/시험_pdfweb.mjs 가 node 로 돌립니다.
   ========================================================== */
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { askAfter } from '../AskComment'

/* 일감 — [코드, 이름, 도움말, 고르는 방식, 값칸] */
const 일감 = [
  ['① 쪽 다루기', [
    ['합치기', '여러 PDF 합치기', '고른 차례대로 하나로 붙입니다.', '여럿', []],
    ['골라내기', '고른 쪽만 남기기', '남길 쪽을 적으십시오.', '하나', [['범위', '1-5, 8, 20-']]],
    ['쪽지우기', '고른 쪽 빼기', '뺄 쪽을 적으십시오.', '하나', [['뺄 쪽', '2, 7-9']]],
    ['순서', '쪽 순서 바꾸기', '적으신 차례 그대로 다시 묶습니다. 적은 쪽만 남습니다.', '하나', [['새 차례', '3,1,2']]],
    ['회전', '쪽 돌리기(회전)', '눕거나 뒤집힌 쪽을 바로 세웁니다.', '하나', [['돌릴 쪽', '전부']]],
    ['나누기', '나누기', '한 파일을 여러 개로 쪼개 zip 으로 냅니다.', '하나', [['값', '10']]],
  ]],
  ['② 얹기', [
    ['도장', '도장·서명 얹기', 'png 그림을 고른 쪽 모서리에 얹습니다.', '하나', [['얹을 쪽', '전부']]],
    ['워터마크', '표시 얹기(대외비 등)', '쪽 한가운데에 흐리게 비스듬히 얹습니다.', '하나', [['얹을 글자', '대외비']]],
    ['쪽번호', '쪽 번호 넣기', '{n} 은 쪽 번호, {전체} 는 전체 쪽수입니다.', '하나', [['꼴', '- {n} -']]],
  ]],
  ['③ 뽑기', [
    ['글자', '글자를 txt 로', '쪽마다 나눠서 글자만 뽑습니다.', '하나', []],
    ['쪽그림', '쪽을 그림으로', '고른 쪽을 PNG 로 떠서 zip 으로 냅니다.', '하나', [['바꿀 쪽', '1-5']]],
  ]],
  ['④ 내기 전 점검·비교', [
    ['점검', '제출본 점검표 내기', '백지·스캔본·뒤집힌 쪽·크기 다른 쪽·겹친 쪽을 찾아 엑셀(csv)로 냅니다.', '하나', []],
    ['비교', '당초 ↔ 변경 비교', 'PDF 를 두 개 고르십시오 — 먼저 당초, 다음 변경.', '둘', []],
  ]],
  ['⑤ 여러 파일에서 찾기', [
    ['폴더찾기', '여러 PDF 에서 낱말 찾기', '폴더째 고르시거나 파일을 여러 개 고르십시오.', '폴더', [['찾을 말', '흄관, D=300, 레미콘']]],
  ]],
  ['⑥ 사진대지', [
    ['사진대지', '사진 → 사진대지 PDF', '머리에 공사명·위치·쪽, 칸마다 촬영일·설명 칸이 들어갑니다.', '사진폴더',
      [['공사명', '○○간선도로 확포장공사'], ['위치', '○○리 일원']]],
  ]],
  ['⑦ 그 밖', [
    ['찾기', '몇 군데 있나 세어 보기', '바꾸기 전에 «몇 군데인지» 부터 보십시오.', '하나', [['찾을 말', '○○건설(주)']]],
    ['살펴', '파일 살펴보기', '쪽수·크기·스캔본인지 봅니다.', '하나', []],
  ]],
]
const 찾기 = (코드) => {
  for (const [, 것들] of 일감) for (const t of 것들) if (t[0] === 코드) return t
  return null
}
const 숨돌리기 = () => new Promise((r) => setTimeout(r, 0))
const 자리들 = ['오른쪽 아래', '왼쪽 아래', '가운데 아래', '오른쪽 위', '왼쪽 위', '가운데 위', '한가운데']

export default function Pdf() {
  const [코드, 코드놓기] = useState('')
  const [파일들, 파일놓기] = useState([])
  const [그림, 그림놓기] = useState(null)
  const [값, 값놓기] = useState({ a: '', b: '' })
  const [옵, 옵놓기] = useState({ 자리: '오른쪽 아래', 각도: '90', 나눔: '몇쪽씩', 한쪽에: '2' })
  const [기록, 기록놓기] = useState([])
  const [결과, 결과놓기] = useState([])
  const [바쁨, 바쁨놓기] = useState(false)
  const 파일칸 = useRef(null), 폴더칸 = useRef(null), 그림칸 = useRef(null)

  const 지금 = 찾기(코드)
  const 방식 = 지금 ? 지금[3] : '하나'
  const 적기 = (s) => 기록놓기((old) => [...old, s])

  function 고르기(c) {
    코드놓기(c)
    파일놓기([]); 그림놓기(null); 결과놓기([]); 기록놓기([])
    const t = 찾기(c)
    값놓기({ a: '', b: '' })
    if (t && t[4][0] && ['골라내기', '회전', '쪽그림'].includes(c)) 값놓기({ a: '전부', b: '' })
    if (c === '쪽번호') 값놓기({ a: '- {n} -', b: '' })
    if (c === '워터마크') 값놓기({ a: '대외비', b: '' })
    if (c === '도장') 값놓기({ a: '전부', b: '' })
    if (c === '나누기') 값놓기({ a: '10', b: '' })
  }

  function 파일받기(e, 여럿) {
    const 목록 = [...(e.target.files || [])]
    e.target.value = ''
    if (!목록.length) return
    if (방식 === '둘') {
      const 새 = [...파일들, ...목록].filter((f) => /\.pdf$/i.test(f.name)).slice(0, 2)
      파일놓기(새)
      적기(새.length < 2 ? `· 당초 : ${새[0].name} — 이제 «변경» 을 고르십시오`
        : `· 당초 : ${새[0].name}\n· 변경 : ${새[1].name}`)
      return
    }
    파일놓기(여럿 ? 목록 : [목록[0]])
    if (!여럿) 적기(`· 고른 파일 : ${목록[0].name}`)
    else {
      const pdf = 목록.filter((f) => /\.pdf$/i.test(f.name)).length
      const 사진 = 목록.filter((f) => /\.(jpe?g|png|bmp|gif|webp)$/i.test(f.name)).length
      적기(`· ${목록.length}개 고름 — PDF ${pdf}개 · 사진 ${사진}장`)
    }
  }

  async function 하기() {
    if (바쁨) return
    바쁨놓기(true); 결과놓기([])
    적기(`\n▶ ${지금[1]}`)
    try {
      const P = await import('../lib/pdfwork.js')
      const 진도 = (말) => async (i, n) => {
        const 몫 = Math.max(1, Math.floor(n / 10))
        if (i === n || i % 몫 === 0) { 적기(`   … ${말} ${i}/${n}`); await 숨돌리기() }
      }
      const f = 파일들[0]
      const 냄 = (r, 말) => { 결과놓기((o) => [...o, r]); if (말) 적기(말) }

      if (코드 === '합치기') {
        const r = await P.합치기(파일들)
        r.쪽수.forEach(([이름, c]) => 적기(`   · ${이름} — ${c}쪽`))
        냄(r, `✔ ${r.이름} (모두 ${r.쪽수.reduce((a, b) => a + b[1], 0)}쪽)`)
      } else if (코드 === '골라내기') {
        const r = await P.쪽골라내기(f, 값.a || '전부'); 냄(r, `✔ ${r.남김}쪽 남겼습니다`)
      } else if (코드 === '쪽지우기') {
        const r = await P.쪽지우기(f, 값.a); 냄(r, `✔ ${r.뺌}쪽 빼고 ${r.남}쪽 남겼습니다`)
      } else if (코드 === '순서') {
        const r = await P.순서바꾸기(f, 값.a); 냄(r, `✔ ${r.쪽수}쪽`)
      } else if (코드 === '회전') {
        const r = await P.회전(f, 값.a || '전부', 옵.각도); 냄(r, `✔ ${r.쪽수}쪽을 ${옵.각도}도 돌렸습니다`)
      } else if (코드 === '나누기') {
        const r = await P.나누기(f, 옵.나눔, 값.a); 냄(r, `✔ ${r.개수}개로 나눴습니다 (zip)`)
      } else if (코드 === '도장') {
        const r = await P.도장얹기(f, 그림, 값.a || '전부', 옵.자리); 냄(r, `✔ ${r.쪽수}쪽에 얹었습니다`)
      } else if (코드 === '워터마크') {
        const r = await P.워터마크(f, 값.a || '대외비'); 냄(r, `✔ ${r.쪽수}쪽에 얹었습니다`)
      } else if (코드 === '쪽번호') {
        const r = await P.쪽번호(f, 값.a || '- {n} -', 1, 옵.자리); 냄(r, `✔ ${r.쪽수}쪽`)
      } else if (코드 === '글자') {
        const r = await P.글자뽑기(f)
        냄(r, `✔ ${r.이름}` + (r.빈 ? `  ⚠️ 글자 없는 쪽 ${r.빈}개 — 스캔본일 수 있습니다` : ''))
      } else if (코드 === '쪽그림') {
        적기('   … 쪽을 그림으로 뜨는 중입니다.')
        const r = await P.쪽을그림으로(f, 값.a || '전부', 2, 진도('뜨는 중')); 냄(r, `✔ ${r.장수}장 (zip)`)
      } else if (코드 === '점검') {
        적기('   … 쪽마다 살피는 중입니다.')
        const r = await P.점검표내기(f, 진도('살피는 중'))
        Object.entries(r.요약).forEach(([k, v]) => 적기(`   ${k} : ${v}`))
        if (!r.탈.length) 적기('✔ 눈에 걸리는 곳이 없습니다.')
        else {
          적기(`✔ 봐야 할 곳 ${r.탈.length}군데`)
          r.탈.slice(0, 10).forEach(([쪽, 무엇, 왜]) => 적기(`   · ${쪽}쪽 — ${무엇} : ${왜}`))
          if (r.탈.length > 10) 적기(`   … 그 밖 ${r.탈.length - 10}군데 — 표에 다 적었습니다`)
        }
        적기('   ⚠️ 이것은 «의심» 입니다. 마지막은 사람이 봐야 합니다.')
        냄(r)
      } else if (코드 === '비교') {
        if (파일들.length !== 2) throw new Error('당초와 변경, PDF 를 두 개 고르십시오.')
        적기('   … 쪽을 그림으로 떠서 견주는 중입니다. 쪽이 많으면 오래 걸립니다.')
        const r = await P.비교(파일들[0], 파일들[1], {}, 진도('견주는 중'))
        적기(`✔ 바뀐 쪽 ${r.바뀐쪽.length}개 (변경본 위에 빨간 칸)`)
        r.바뀐쪽.slice(0, 12).forEach(([쪽, 무엇]) => 적기(`   · ${쪽}쪽 — ${무엇}`))
        if (r.바뀐쪽.length > 12) 적기(`   … 그 밖 ${r.바뀐쪽.length - 12}쪽`)
        적기(`✔ 글자로 본 바뀜 ${r.말바뀜.length}쪽`)
        if (!r.바뀐쪽.length && !r.말바뀜.length) 적기('   ○ 달라진 곳을 찾지 못했습니다.')
        적기('   ⚠️ «보이는 차이» 를 찾습니다. 마지막은 사람이 봐야 합니다.')
        냄(r.표시); 냄(r.글)
      } else if (코드 === '폴더찾기') {
        적기('   … PDF 를 훑는 중입니다.')
        const r = await P.여러파일에서찾기(파일들, 값.a, 진도('훑는 중'))
        냄(r, `✔ PDF ${r.파일수}개에서 ${r.찾은수}군데 찾았습니다`)
        if (!r.찾은수) 적기('   ○ 찾지 못했습니다. 띄어쓰기나 글자를 달리 해 보십시오.')
        if (r.못읽음) 적기(`   ⚠️ 글자가 없어 못 읽은 파일 ${r.못읽음}개 — 스캔본입니다(표 아래에 적었습니다).`)
      } else if (코드 === '사진대지') {
        적기('   … 사진을 붙이는 중입니다.')
        const r = await P.사진대지(파일들, {
          공사명: 값.a, 위치: 값.b, 한쪽에: parseInt(옵.한쪽에, 10),
        }, 진도('붙이는 중'))
        냄(r, `✔ 사진 ${r.장수}장 → ${r.쪽수}쪽`)
        적기('   · 촬영일은 사진 안(EXIF)에서 꺼냅니다. 없으면 파일 만든 날입니다.')
        적기('   · 사진 차례는 «파일 이름 차례» 입니다.')
      } else if (코드 === '찾기') {
        const r = await P.낱말찾기(f, 값.a)
        적기(`✔ ${r.모두}군데` + (r.자리.length ? ' — ' + r.자리.slice(0, 12).map((x) => `${x.쪽}쪽`).join(', ')
          + (r.자리.length > 12 ? ' …' : '') : ''))
        if (!r.글있나) 적기('   ⚠️ 이 파일에는 «글자가 없습니다»(스캔본). 찾기가 되지 않습니다.')
      } else if (코드 === '살펴') {
        const r = await P.살펴보기(f)
        Object.entries(r).forEach(([k, v]) => 적기(`   ${k} : ${v}`))
      } else {
        throw new Error('할 일을 먼저 고르십시오.')
      }
      try { askAfter('pdf') } catch { /* 사생활 보호 모드 */ }
    } catch (e) {
      적기(`✕ ${String(e && e.message || e)}`)
    } finally { 바쁨놓기(false) }
  }

  async function 받기(r) {
    const P = await import('../lib/pdfwork.js')
    P.저장(r.이름, r.바이트, r.타입 || 'application/pdf')
  }

  const 준비됐나 = 지금 && (방식 === '둘' ? 파일들.length === 2 : 파일들.length > 0)
    && !(코드 === '도장' && !그림)

  return (
    <div className="wrap">
      <div className="card">
        <div className="detail-h">📄 PDF 도구 <span className="count">· 17가지</span></div>
        <div className="note sm">
          제출본을 합치고 · 쪽을 빼고 · 도장을 얹고 · 내기 전에 훑어보고 · 당초와 변경을 견주고 ·
          사진대지를 만듭니다. 회원가입도 설치도 없습니다.
        </div>
        <div className="pdfsafe">
          🔒 <b>고르신 파일은 저희 쪽으로 올라가지 않습니다.</b> 전부 이 브라우저 안에서 처리하고
          결과도 여기서 바로 만들어 드립니다. 설계도서·내역서를 올리셔도 됩니다.
        </div>
        <div className="navrow" style={{ marginTop: 10 }}>
          <Link className="navi" to="/tools">🧰 건설 도구</Link>
          <Link className="navi" to="/forms">📄 건설 서식</Link>
          <Link className="navi" to="/cad">📐 캐드 유틸</Link>
        </div>
      </div>

      <div className="card">
        <div className="sec-title">무슨 일을 할까요</div>
        {일감.map(([묶음, 것들]) => (
          <div key={묶음} className="pdfgrp">
            <div className="pdfgrp-h">{묶음}</div>
            <div className="chips pdfjobs">
              {것들.map(([c, 이름]) => (
                <button key={c} type="button"
                  className={'chip' + (코드 === c ? ' on' : '')}
                  onClick={() => 고르기(c)}>{이름}</button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {지금 && (
        <div className="card pdfwork">
          <div className="detail-h">{지금[1]}</div>
          <div className="note sm">{지금[2]}</div>

          <div className="field" style={{ marginTop: 12 }}>
            <label>{방식 === '둘' ? 'PDF 두 개 — 당초, 그다음 변경'
              : 방식 === '여럿' ? 'PDF 여러 개'
                : 방식 === '폴더' ? 'PDF 가 든 폴더 (또는 파일 여러 개)'
                  : 방식 === '사진폴더' ? '사진이 든 폴더 (또는 사진 여러 장)' : 'PDF 파일'}</label>
            <div className="btn-row">
              <button type="button" className="btn line" onClick={() => 파일칸.current?.click()}>
                {방식 === '둘' ? (파일들.length === 0 ? '① 당초 고르기' : 파일들.length === 1 ? '② 변경 고르기' : '다시 고르기')
                  : 방식 === '하나' ? '파일 고르기' : '파일 고르기'}
              </button>
              {(방식 === '폴더' || 방식 === '사진폴더') && (
                <button type="button" className="btn line" onClick={() => 폴더칸.current?.click()}>폴더 고르기</button>
              )}
            </div>
            <input ref={파일칸} type="file" className="sr-only" tabIndex={-1}
              accept={방식 === '사진폴더' ? 'image/*' : 'application/pdf,.pdf'}
              multiple={방식 !== '하나'}
              onChange={(e) => 파일받기(e, 방식 !== '하나')} />
            <input ref={폴더칸} type="file" className="sr-only" tabIndex={-1} multiple
              webkitdirectory="" directory=""
              onChange={(e) => 파일받기(e, true)} />
            <div className="note sm" style={{ marginTop: 6 }}>
              {파일들.length === 0 ? '(아직 안 고르셨습니다)'
                : 방식 === '둘' ? (파일들.length === 1
                  ? `당초 : ${파일들[0].name} — 이제 변경본을 고르십시오`
                  : `당초 : ${파일들[0].name}  →  변경 : ${파일들[1].name}`)
                  : 파일들.length === 1 ? 파일들[0].name
                    : `${파일들.length}개 골랐습니다`}
            </div>
          </div>

          {코드 === '도장' && (
            <div className="field">
              <label>도장·서명 그림 (png 를 권합니다)</label>
              <button type="button" className="btn line" onClick={() => 그림칸.current?.click()}>
                {그림 ? `바꾸기 — ${그림.name}` : '도장 그림 고르기'}
              </button>
              <input ref={그림칸} type="file" accept="image/*" className="sr-only" tabIndex={-1}
                onChange={(e) => { const g = e.target.files?.[0]; e.target.value = ''; if (g) { 그림놓기(g); 적기(`· 도장 그림 : ${g.name}`) } }} />
            </div>
          )}

          {지금[4].map(([이름, 보기], i) => (
            <div className="field" key={이름}>
              <label>{이름} <span className="hint">예: {보기}</span></label>
              <input type="text" value={i === 0 ? 값.a : 값.b} placeholder={보기}
                onChange={(e) => 값놓기((v) => (i === 0 ? { ...v, a: e.target.value } : { ...v, b: e.target.value }))} />
            </div>
          ))}

          {코드 === '회전' && (
            <div className="field"><label>몇 도</label>
              <select value={옵.각도} onChange={(e) => 옵놓기((o) => ({ ...o, 각도: e.target.value }))}>
                <option value="90">90도 (오른쪽으로)</option><option value="180">180도 (뒤집기)</option>
                <option value="270">270도 (왼쪽으로)</option>
              </select></div>
          )}
          {코드 === '나누기' && (
            <div className="field"><label>어떻게 나눌까요</label>
              <select value={옵.나눔} onChange={(e) => 옵놓기((o) => ({ ...o, 나눔: e.target.value }))}>
                <option value="낱장">낱장으로 (한 쪽씩)</option>
                <option value="몇쪽씩">몇 쪽씩</option>
                <option value="여기서자르기">여기서 자르기 (예: 5,12)</option>
              </select></div>
          )}
          {(코드 === '도장' || 코드 === '쪽번호') && (
            <div className="field"><label>어디에</label>
              <select value={옵.자리} onChange={(e) => 옵놓기((o) => ({ ...o, 자리: e.target.value }))}>
                {자리들.map((z) => <option key={z} value={z}>{z}</option>)}
              </select></div>
          )}
          {코드 === '사진대지' && (
            <div className="field"><label>한 쪽에 몇 장</label>
              <select value={옵.한쪽에} onChange={(e) => 옵놓기((o) => ({ ...o, 한쪽에: e.target.value }))}>
                <option value="2">2장 (가장 흔합니다)</option><option value="4">4장</option><option value="6">6장</option>
              </select></div>
          )}

          <button type="button" className="btn" disabled={!준비됐나 || 바쁨} onClick={하기}>
            {바쁨 ? '하는 중입니다…' : '하기'}
          </button>
        </div>
      )}

      {(기록.length > 0 || 결과.length > 0) && (
        <div className="card">
          {결과.length > 0 && (
            <>
              <div className="sec-title">나온 것</div>
              {결과.map((r, i) => (
                <div className="row" key={i}>
                  <span className="fic">📎</span>
                  <div className="grow">
                    <div className="t">{r.이름}</div>
                    <div className="d">{(r.바이트.length / 1024).toFixed(0)} KB</div>
                  </div>
                  <button type="button" className="btn sm" onClick={() => 받기(r)}>내려받기</button>
                </div>
              ))}
            </>
          )}
          <div className="sec-title" style={{ marginTop: 12 }}>기록</div>
          <pre className="pdflog">{기록.join('\n')}</pre>
        </div>
      )}
    </div>
  )
}
