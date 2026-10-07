import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 공제칸, 요율 } from '../lib/gongje.js'
import { 빈것, 새번호, 달셈, 칸바꿈, 줄채움, 달값, 예시, 공수차례, 달날수, 요일, 달더하기, 원, 공수글,
  보임, 명단빼기, 명단넣기, 완전히지우기, 남은기록, 되살리기, 일한날있음, 일한달, 그달일당, 그달빼기, 달값고침, 다른달값 } from '../lib/nomubi.js'   /* 🗓 G162 */
import { 읽기현장, 쓰기현장, 현장목록, 현장목록쓰기, 현장목록열쇠, 현장자료열쇠, 현장연결자리, 현장백업열쇠, 현장이름, 현장더하기, 현장지우기, 현장되살리기 } from '../lib/nomubi.js'   /* 🏗 G178 현장별로 나눠 쓰기 */
import { 세기 } from '../lib/받은수.jsx'
/* 🛡 2026-10-01 (G107) 연금 · 건강 «대상» 은 lib/ilyong4.js 판단(여러 달) — 사람마다 «판단 자세히» 로 가입 판단기에 출역을 넘깁니다 */
import { 생일풀기, 만나이, 나이날 } from '../lib/ilyong4.js'   /* 🎂 G109 생년월일 → 만 나이 · 60세 연금 · 65세 고용 */
import 이어쓰기 from '../tools/이어쓰기.jsx'
const 넘김열쇠 = 'kcm_ilyong_from'
/* 🗓 G162 «처음부터 (모두 지우기)» 직전 자료 — 새로고침해도 되살릴 수 있게 · 🏗 G178 현장마다 따로(lib/nomubi.js 현장백업열쇠) */

/**
 * 👷 /tools/nomubi — 일용 노무비 계산기 · 지급명세서 (G104 · 2026-10-01)
 *
 * 소장님: 「인터넷 싹 다 뒤져서. 관련 기관 다 보고, 서식 검색량이 많은 것 사이트에 올리자. 프로그램화 해서」
 *   → 수요 조사(예스폼 «일용노무비·급여(소득세·4대보험)» 누적 조회 103만 — 2등) → 고르심 «일용 노무비 계산·지급명세서»
 *
 * ■ 하는 일: 명단(이름 · 직종 · 일당) + 출역(날짜 칸을 누를 때마다 1 → 0.5 → 1.5 → 빈칸)
 *   → 소득세 · 지방소득세 · 고용 · 국민연금 · 건강 · 장기요양 공제와 실지급액 → 지급명세서(A4 가로 인쇄) · 신고용 집계.
 * ■ 공제 셈은 lib/gongje.js 하나(투입비 도구와 같음). 화면 모양도 투입비 청구서(tp-*)를 그대로 씁니다.
 * ■ 저장은 이 브라우저(localStorage) + 🔗 코드 + 비밀번호로 서버에 잠가 두면 폰·PC 어디서든 이어 씀(tools/이어쓰기.jsx · G113) — 명단까지 통째로 잠가서 올림(서버·운영자 못 읽음) · 주민번호 뒷자리 · 계좌는 받지 않음.
 * ■ 🎂 (2026-10-01 G109) 명단에 생년월일(앞 6자리) — 소장님 「나이를 넣게 하고, 4대 보험은 자동으로」 · 「미포함 및 포함 나이로 판별해서 자동으로 금액이 나오게」
 *   만 60세(60세가 된 날의 다음 날)부터 국민연금 대상 아님 · 만 65세부터 일한 날은 고용보험 실업급여 몫 없음 → 공제 · 실지급액이 저절로 바뀜
 * ■ (2026-10-01 G109 부터 «📗 값만 엑셀» — 셈한 값만, 수식 없음) 처음엔 엑셀 받기 없음 · 인쇄만 — 소장님(2026-09-26): 「프로그램으로 해서 만든 거는 … 다운 받을 수 없게 … 프린트만 가능하게 … 수정이나 입력은 건설맵에서」
 * ■ 신고 기한(원문 확인 2026-10-01 · 국가법령정보센터):
 *   · 근로내용 확인신고서 — 다음 달 15일까지 (고용보험법 시행령 제7조제1항 후단)
 *   · 이것을 내면 일용근로소득 지급명세서를 낸 것으로 봄 (소득세법 시행령 제213조제4항)
 *   · 따로 낼 때 지급명세서 — 지급일이 속하는 달의 다음 달 말일까지 (소득세법 제164조제1항 단서)
 */

function 한글금액(n) {
  const 숫 = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구']
  const 작 = ['', '십', '백', '천']
  const 큰 = ['', '만', '억', '조']
  let v = Math.round(Math.abs(n || 0))
  if (!v) return '영'
  const 조각 = []
  let i = 0
  while (v > 0) {
    const 네 = v % 10000
    if (네) {
      let s = ''
      String(네).padStart(4, '0').split('').forEach((c, j) => { const d = Number(c); if (d) s += 숫[d] + 작[3 - j] })
      조각.unshift(s + 큰[i])
    }
    v = Math.floor(v / 10000); i++
  }
  return (n < 0 ? '마이너스 ' : '') + 조각.join('')
}

const 숫자만 = (s) => { const v = Number(String(s ?? '').replace(/[^\d]/g, '')); return Number.isFinite(v) ? v : 0 }
const 빼기들 = [['P', '연금'], ['H', '건강'], ['E', '고용'], ['T', '소득세']]
const 두자 = (n) => String(n).padStart(2, '0')
const 달글 = (ym) => `${ym.slice(0, 4)}년 ${Number(ym.slice(5, 7))}월`

/* 🏗 G178 계산기 한 벌 = 현장 하나. 현장을 바꾸면 key 로 통째로 새로 그립니다(되돌리기 · 묻기 · 이어 쓰기 상태가 다른 현장에 섞이지 않게). */
function 계산기({ 현장id, 현장칸, on현장명 }) {
  const 백업열쇠 = 현장백업열쇠(현장id)
  const [st, setSt] = useState(() => 읽기현장(현장id))
  const [저장됨, set저장됨] = useState(true)
  const [편집, set편집] = useState(null)        // { id, k } 공제 칸 고치기
  const [알림, set알림] = useState('')
  const [지움물음, set지움물음] = useState(false)
  /* 🗓 G162 — 되돌리기(빼기 · 지우기 · 출역 지움 · 모두 지우기 바로 뒤 한 번) · 완전히 지우기 묻기 · 접은 칸 */
  const [되돌림, set되돌림] = useState(null)       // { 글, 전 }
  const [지울사람, set지울사람] = useState(null)   // 완전히 지우기 묻는 사람 번호
  const [버릴기록, set버릴기록] = useState(null)   // 지운 사람 남은 출역 버리기 묻기
  const [없는펼침, set없는펼침] = useState(false)
  const [새줄, set새줄] = useState(null)           // 방금 되살린 사람 — 잠깐 빛남
  const [백업, set백업] = useState(() => { try { return JSON.parse(localStorage.getItem(백업열쇠) || 'null') } catch (e) { return null } })
  const 밖에서 = useRef(false)
  /* 되돌리기 줄은 20초 뒤 저절로 닫힘(처음부터 지운 것은 아래 «되살리기» 줄이 남음) */
  useEffect(() => { if (!되돌림) return undefined; const t = setTimeout(() => set되돌림(null), 20000); return () => clearTimeout(t) }, [되돌림])
  useEffect(() => {
    if (밖에서.current) { 밖에서.current = false; return }   /* 다른 창에서 받은 것은 다시 쓰지 않음(두 창이 서로 덮어쓰며 맴돌지 않게) */
    set저장됨(쓰기현장(현장id, st))
  }, [st])
  /* 🏗 현장명을 고치면 위 현장 목록 이름도 따라 바뀜 */
  useEffect(() => { if (on현장명) on현장명(현장id, st.site) }, [st.site])  // eslint-disable-line react-hooks/exhaustive-deps
  /* 🔁 G116 → G162 — 다른 창(이 계산기 · 신고 정리 · 퇴직공제 · 보험료)에서 자료를 바꾸면 «통째로» 받아 둡니다.
     전에는 sg · tj · bh 만 받아서, 계산기를 두 창으로 열어 두면 한 창이 다른 창의 명단 · 출역을 옛 것으로 덮을 수 있었음.
     보고 있는 달(ym)은 이 창 것을 그대로 둠. */
  useEffect(() => {
    const 사건 = (e) => {
      if (e.key !== 현장자료열쇠(현장id) || !e.newValue) return
      try {
        const v = JSON.parse(e.newValue) || {}
        if (!Array.isArray(v.P) || !v.A || typeof v.A !== 'object') return
        밖에서.current = true
        setSt((s) => ({ ...빈것(), ...v, ym: s.ym }))
      } catch (x) { /* 깨진 값 */ }
    }
    window.addEventListener('storage', 사건)
    return () => window.removeEventListener('storage', 사건)
  }, [])
  useEffect(() => {
    const 끝 = () => document.body.classList.remove('tp-print-bill')
    window.addEventListener('afterprint', 끝)
    return () => { window.removeEventListener('afterprint', 끝); 끝() }
  }, [])
  const ym = st.ym
  const N = useMemo(() => 달셈(st, ym), [st, ym])
  const R = 요율(ym)
  const 날수 = 달날수(ym)
  const 날들 = Array.from({ length: 날수 }, (_, i) => i + 1)
  const 바꿈 = (f) => setSt((s) => f(s))
  /* 💰 G162 일당(w) · 늘 빼기(nx)는 «이 달(과 아직 안 적은 달)» 만 — 일한 날이 있는 다른 달 명세서는 그대로(lib/nomubi.js 달값고침) */
  const 사람고침 = (id, k, v) => 바꿈((s) => (k === 'w' || k === 'nx' ? 달값고침(s, s.ym, id, k, v) : { ...s, P: s.P.map((p) => (p.id === id ? { ...p, [k]: v } : p)) }))
  /* 🗓 G162 새로 더한 사람은 이 달부터 명단에(지난달 화면을 어지럽히지 않게) */
  const 사람더함 = () => 바꿈((s) => ({ ...s, P: [...s.P, { id: 새번호(), n: '', j: '', b: '', w: 0, nx: '', r: [[s.ym, null]] }] }))
  const 되돌릴수 = (글, 새) => { set되돌림({ 글, 전: st }); setSt(새) }
  const 되돌리기 = () => { if (!되돌림) return; setSt(되돌림.전); set되돌림(null); 세기('|노무비|되돌리기') }
  const 이름글 = (p) => (p.n && p.n.trim()) || '이름 없는 사람'
  /* 🎂 명단 생년월일 옆 — 그 달 1일 만 나이 · 이 달에 걸리는 것 */
  const 나이글 = (b) => {
    if (!b) return null
    const 생 = 생일풀기(b)
    if (!생) return <small className="nm-age bad">날짜 확인 (예: 610315)</small>
    const 끝날 = `${ym}-${두자(달날수(ym))}`
    const 처음 = 만나이(생, ym + '-01'), 끝 = 만나이(생, 끝날)
    const L60 = 나이날(생, 60), L65 = 나이날(생, 65)
    const 붙 = []
    if (L60 <= 끝날) 붙.push(L60 > ym + '-01' ? `${Number(L60.slice(8))}일부터 연금 ✕` : '연금 ✕')
    if (L65 <= 끝날) 붙.push(L65 > ym + '-01' ? `${Number(L65.slice(8))}일부터 고용(실업급여) ✕` : '고용(실업급여) ✕')
    return <small className={'nm-age' + (붙.length ? ' on' : '')} title="민법 제158조 만 나이 · 국민연금 60세 미만 · 고용보험 65세 이후 새로 고용은 실업급여 없음">만 {처음 === 끝 ? 처음 : `${처음}→${끝}`}세{붙.length ? ' · ' + 붙.join(' · ') : ''}</small>
  }
  /* 🗓 G162 이용자 건의 「필요없는 명단을 지웠더니 그 전달 지급명세서까지 지워져요」 — «지우기» 는 «빼기» 로:
     이 달(이 달에 일한 날이 있으면 다음 달)부터 명단에서만 빠지고, 지난달 명세서 · 신고 · 퇴직공제는 그대로 */
  const 짧달 = (m) => (m.slice(0, 4) === ym.slice(0, 4) ? `${Number(m.slice(5, 7))}월` : `${m.slice(2, 4)}년 ${Number(m.slice(5, 7))}월`)
  const 빼기 = (p) => {
    const { st: 새, 부터 } = 명단빼기(st, ym, p.id)
    되돌릴수(`${이름글(p)} — ${짧달(부터)}부터 명단에서 뺐습니다.${부터 !== ym ? ` ${짧달(ym)}에 일한 날이 있어 ${짧달(ym)} 명세서에는 남습니다.` : ''} 지난달까지 명세서는 그대로입니다.`, 새)
    세기('|노무비|빼기')
  }
  const 다시넣기 = (p) => { setSt(명단넣기(st, ym, p.id)); set되돌림(null); 세기('|노무비|다시넣기') }
  const 정말지우기 = (p) => {
    되돌릴수(`${이름글(p)} — 명단과 모든 달 출역을 지웠습니다.`, 완전히지우기(st, p.id))
    set지울사람(null); 세기('|노무비|완전지움')
  }
  const 줄지움 = (p) => {
    if (!일한날있음(st, ym, p.id)) return
    되돌릴수(`${이름글(p)} — ${짧달(ym)} 출역을 지웠습니다.`, 줄채움(st, ym, p.id, false))
  }
  const 줄모두 = (p) => {
    const 있던 = 일한날있음(st, ym, p.id)
    const 새 = 줄채움(st, ym, p.id, true)
    if (있던) 되돌릴수(`${이름글(p)} — ${짧달(ym)} 출역을 «일요일 빼고 모두» 로 바꿨습니다.`, 새)
    else setSt(새)
  }
  const 처음부터 = () => {
    const 지금 = { at: Date.now(), st }
    try { localStorage.setItem(백업열쇠, JSON.stringify(지금)) } catch (e) { /* 막힘 — 되돌리기만 */ }
    set백업(지금)
    되돌릴수('명단과 모든 달의 출역을 지웠습니다.', { ...빈것(), ym })
    set지움물음(false)
  }
  const 백업되살림 = () => {
    if (!백업 || !백업.st) return
    setSt({ ...빈것(), ...백업.st }); 백업버림(); 세기('|노무비|백업되살림')
  }
  const 백업버림 = () => { try { localStorage.removeItem(백업열쇠) } catch (e) { /* 막힘 */ } set백업(null) }
  /* 🗓 G162 이 달 명단 · 명단에 없는 사람 · 지운 사람의 남은 출역 */
  const 이달명단 = st.P.filter((p) => 보임(st, p, ym))
  const 없는사람 = st.P.filter((p) => !보임(st, p, ym))
  const 앞달 = 달더하기(ym, -1)
  const 이달새로 = (p) => !!(p.r && p.r.some(([a]) => a === ym))
  const 일하는현장 = st.P.some((p) => 일한날있음(st, ym, p.id) || 일한날있음(st, 앞달, p.id))
  const 쉬는후보 = 일하는현장 ? 이달명단.filter((p) => !일한날있음(st, ym, p.id) && !일한날있음(st, 앞달, p.id) && !이달새로(p)) : []
  const 한꺼번빼기 = () => {
    let 새 = st
    for (const p of 쉬는후보) 새 = 명단빼기(새, ym, p.id).st
    되돌릴수(`${쉬는후보.length}명을 ${짧달(ym)}부터 명단에서 뺐습니다. 지난달까지 명세서는 그대로입니다.`, 새)
    세기('|노무비|한꺼번빼기')
  }
  const 남은 = useMemo(() => 남은기록(st), [st])
  const 되살림 = (x) => {
    const 끝 = x.달들[x.달들.length - 1]
    setSt({ ...되살리기(st, x), ym: 끝 })
    set새줄(x.id); setTimeout(() => set새줄((v) => (v === x.id ? null : v)), 4000)
    set되돌림(null); 세기('|노무비|되살리기')
  }
  const 기록버림 = (x) => { 되돌릴수(`지운 사람의 남은 출역(${x.달들.map(짧달).join(' · ')})을 버렸습니다.`, 완전히지우기(st, x.id)); set버릴기록(null); 세기('|노무비|기록버림') }
  const 이름없음 = 이달명단.filter((p) => !(p.n || '').trim()).length
  const 같은이름 = [...new Set(이달명단.map((p) => (p.n || '').trim()).filter((n, i, a) => n && a.indexOf(n) !== i))]
  const 칸누름 = (id, i) => {
    const g = (N.줄.find((r) => r.id === id) || { 공수: [] }).공수[i] || 0
    const 다음 = g === 0 ? 1 : 공수차례[(공수차례.indexOf(g) + 1) % 공수차례.length]
    바꿈((s) => 칸바꿈(s, ym, id, 두자(i + 1), 다음))
  }
  const 공수표 = (id) => {
    const r = N.줄.find((x) => x.id === id)
    if (r) return r.공수
    const d = ((st.A[ym] || {})[id] || {}).d || {}
    return 날들.map((i) => Number(d[두자(i)]) || 0)
  }
  const navigate = useNavigate()
  const 판단보기 = (r) => {
    try { sessionStorage.setItem(넘김열쇠, JSON.stringify({ 이름: r.p.n || '', 일당: r.w, 날: r.모음.날, 달돈: r.모음.달돈, 생일: r.p.b || '' })) } catch (e) { /* 막힘 — 그냥 이동 */ }
    navigate('/tools/ilyong-boheom')
  }
  const 대상누름 = (r, c) => {
    const d = r.대상[c]
    if (d.이유 === '명부에서 뺌') { set알림(`${r.p.n || '이 사람'} 은(는) 명부에서 이 공제를 늘 빼 두었습니다 — 위 명부의 «늘 빼기» 를 끄십시오.`); return }
    set알림('')
    let ap = r.ap.replace(c, ''), ex = r.ex.replace(c, '')
    if (!d.손) { if (d.대상) ex += c; else ap += c }
    바꿈((s) => 달값(s, ym, r.id, { ap, ex }))
  }
  const 공제저장 = (id, k, s) => {
    set편집(null)
    const r = N.줄.find((x) => x.id === id)
    const o = { ...((r && r.고침) || {}) }
    if (s === null) delete o[k]
    else o[k] = 숫자만(s)
    바꿈((x) => 달값(x, ym, id, { o }))
  }
  const 인쇄 = () => { document.body.classList.add('tp-print-bill'); setTimeout(() => window.print(), 80) }
  /* 📗 G109 값만 엑셀 — 소장님 「엑셀로 값만 주는 걸로 하자. 프로그램 원칙으로 하고」(셈은 이 화면, 엑셀은 보관용 값) */
  const 엑셀받기 = async () => {
    const { 값엑셀받기, 수칸, 굵은칸 } = await import('../lib/값엑셀.js')
    const 이유 = (r) => `연금 ${r.대상.P.대상 ? '✓' : '✕'} ${r.대상.P.이유} · 건강 ${r.대상.H.대상 ? '✓' : '✕'} ${r.대상.H.이유} · 고용 ${r.대상.E.대상 ? '✓' : '✕'}${r.대상.E.이유 !== '일용 모두' ? ' ' + r.대상.E.이유 : ''}${생일풀기(r.p.b || '') ? ` · 만 ${만나이(생일풀기(r.p.b), ym + '-01')}세` : ''}`
    const 명세 = N.줄.map((r, i) => [i + 1, r.p.n, r.p.j, r.일수, r.공수합, 수칸(r.w), 수칸(r.보수), ...공제칸.map((c) => 수칸(r.최종[c.k])), 수칸(r.최종.합), 수칸(r.최종.차인), 이유(r)])
    명세.push(['', 굵은칸('합계'), `${N.합계.인원}명`, N.합계.일수, N.합계.공수, '', 수칸(N.합계.보수), ...공제칸.map((c) => 수칸(N.합계[c.k])), 수칸(N.합계.합), 수칸(N.합계.차인), ''])
    const 날 = Array.from({ length: N.날수 }, (_, i) => String(i + 1))
    const 출역 = N.줄.map((r) => [r.p.n, r.p.j, ...r.공수.map((g) => (g > 0 ? g : '')), r.공수합, r.일수])
    const 신고 = N.줄.map((r, i) => [i + 1, r.p.n, r.p.j, r.날들.join(', '), r.일수, 수칸(r.보수), 수칸(r.최종.it), 수칸(r.최종.lt)])
    값엑셀받기(`일용노무비_${st.site || st.co || '현장'}_${ym}`, [
      { name: `지급명세 ${달글(ym)}`, head: ['No', '성명', '직종', '일수', '공수', '일당', '노무비', ...공제칸.map((c) => c.이름), '공제계', '실지급액', '4대보험 대상(까닭)'], rows: 명세,
        widths: [5, 10, 10, 6, 6, 10, 12, 10, 10, 10, 10, 10, 10, 11, 12, 60] },
      { name: '출역', head: ['성명', '직종', ...날, '공수', '일수'], rows: 출역, widths: [10, 10, ...날.map(() => 4), 6, 6] },
      { name: '신고용 집계', head: ['No', '성명', '직종', `근로일 (${달글(ym)})`, '근로일수', '지급액(보수 총액)', '소득세', '지방소득세'], rows: 신고, widths: [5, 10, 10, 40, 8, 14, 10, 10] },
    ], { 주소: '/tools/nomubi', 글: `${st.co || ''} ${st.site || ''} · ${ym} 귀속 — K-건설맵 일용 노무비 계산기에서 셈한 값입니다(수식 없음). 다시 셀 때는 k-conmap.com/tools/nomubi 에서 — 적은 내용이 그 브라우저에 남아 있습니다.`.trim() })
  }
  const 안됨 = N.줄.filter((r) => !r.대상.P.대상 || !r.대상.H.대상 || !r.대상.E.대상)

  return (
    <div className="wrap tp nm">
      <div className="card">
        <h1 className="tl-h1" style={{ marginTop: 0 }}>👷 일용 노무비 계산기 · 지급명세서</h1>
        <p className="cp" style={{ margin: '6px 0 0' }}>
          이름 · 직종 · 일당을 적고 <b>일한 날을 누르면</b> 소득세 · 지방소득세 · 고용보험 · 국민연금 · 건강보험 · 장기요양 공제와
          <b> 실지급액</b>이 저절로 나옵니다. <b>생년월일</b>을 넣으면 만 60세(국민연금) · 만 65세(고용보험)도 나이로 가려 금액에 넣고 뺍니다. 지급명세서를 <b>A4 가로로 인쇄</b>하고, 근로내용 확인신고에 옮겨 적을 집계도 함께 나옵니다.
        </p>
        <div className="nm-badges">
          <span>회원가입 없음 · 무료</span>
          <span>💾 이 브라우저에 저장 · 🔗 코드로 폰·PC 이어 쓰기 {저장됨 ? '' : <b className="nm-warn">— 지금 저장이 막혀 있습니다(사생활 보호 창 등)</b>}</span>
          <span>🔒 생년월일만 · 주민번호 뒷자리 · 계좌는 받지 않습니다</span>
        </div>
        {현장칸}
        <이어쓰기 ns="nm" 자리={현장연결자리(현장id)} 이름="일용 노무비" 파일="노무비" st={st} setSt={setSt}
          읽기={() => 읽기현장(현장id)} 쓰기={(x) => 쓰기현장(현장id, x)} />
        <div className="btn-row" style={{ justifyContent: 'flex-start', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          {st.P.length === 0 && <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={() => setSt(예시(ym))}>예시로 채워 보기</button>}
          {st.P.length > 0 && !지움물음 && <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => set지움물음(true)}>처음부터 (모두 지우기)</button>}
          {지움물음 && (
            <span className="nm-ask">명단과 모든 달의 출역을 지웁니다.
              <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={처음부터}>지우기</button>
              <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => set지움물음(false)}>그대로 두기</button>
            </span>
          )}
        </div>
        {/* 🗓 G162 «처음부터» 로 지운 자료 — 새로고침해도 한 번은 되살릴 수 있게 */}
        {백업 && 백업.st && st.P.length === 0 && (
          <div className="nm-strip nm-strip-warn">
            <span>↩ <b>처음부터 지우기 전 자료</b>가 남아 있습니다 — {new Date(백업.at).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })} 지움 · 명단 {(백업.st.P || []).length}명</span>
            <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={백업되살림}>되살리기</button>
            <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={백업버림}>버리기</button>
          </div>
        )}
      </div>

      {/* 🗓 G162 되돌리기 — 빼기 · 지우기 · 출역 지움 · 모두 지우기 바로 뒤 */}
      {되돌림 && (
        <div className="nm-undo no-print" role="status">
          <span>✓ {되돌림.글}</span>
          <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={되돌리기}>↩ 되돌리기</button>
          <button type="button" className="nm-undo-x" onClick={() => set되돌림(null)} aria-label="닫기">✕</button>
        </div>
      )}

      <div className="card">
        <div className="nm-month">
          <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 바꿈((s) => ({ ...s, ym: 달더하기(s.ym, -1) }))} aria-label="지난달">◀</button>
          <b>{달글(ym)}</b> <span className="muted">귀속</span>
          <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 바꿈((s) => ({ ...s, ym: 달더하기(s.ym, 1) }))} aria-label="다음 달">▶</button>
        </div>
        <div className="nm-two">
          <label>회사명<input className="inp" value={st.co} maxLength={40} onChange={(e) => 바꿈((s) => ({ ...s, co: e.target.value }))} placeholder="예: ○○건설(주)" /></label>
          <label>현장명<input className="inp" value={st.site} maxLength={60} onChange={(e) => 바꿈((s) => ({ ...s, site: e.target.value }))} placeholder="예: ○○지구 배수로 정비공사" /></label>
        </div>
      </div>

      <div className="card">
        <div className="detail-h" style={{ margin: 0 }}>👥 {달글(ym)} 명단 <span className="nm-cnt">{이달명단.length}명</span> <span className="muted" style={{ fontWeight: 400, fontSize: 12.5 }}>— 다음 달에도 이어집니다 · 안 나오는 사람은 «빼기»(지난달 명세서는 그대로)</span></div>
        <div className="tp-scroll">
          <table className="tbl nm-roster">
            <thead><tr><th>No</th><th>이름</th><th>직종</th><th>생년월일 <small className="muted">(앞 6자리 · 넣으면 나이로 자동)</small></th><th>일당(원)</th><th>늘 빼기 <small className="muted">(그 사람은 늘 안 뗌)</small></th><th /></tr></thead>
            <tbody>
              {이달명단.map((p, i) => (
                <tr key={p.id} className={새줄 === p.id ? 'nm-newrow' : ''}>
                  <td className="r">{i + 1}</td>
                  <td><input className="inp nm-in" value={p.n} maxLength={20} onChange={(e) => 사람고침(p.id, 'n', e.target.value)} placeholder="이름" aria-label={`${i + 1}번 이름`} /></td>
                  <td><input className="inp nm-in" value={p.j} maxLength={20} onChange={(e) => 사람고침(p.id, 'j', e.target.value)} placeholder="직종" aria-label={`${i + 1}번 직종`} /></td>
                  <td className="nm-bd"><input className="inp nm-in nm-birth" value={p.b || ''} maxLength={10} inputMode="numeric" onChange={(e) => 사람고침(p.id, 'b', e.target.value.replace(/[^\d.\-/ ]/g, ''))} placeholder="예: 610315" aria-label={`${i + 1}번 생년월일`} />{나이글(p.b)}</td>
                  <td>{(() => {
                    const w = 그달일당(st, ym, p)
                    const 딴 = 다른달값(st, ym, p, 'w')
                    return (<>
                      <input className="inp nm-in nm-num" value={w ? 원(w) : ''} inputMode="numeric" onChange={(e) => 사람고침(p.id, 'w', 숫자만(e.target.value))} placeholder="0" aria-label={`${i + 1}번 일당`} />
                      {딴.length > 0 && (() => {
                        const 묶 = new Map()
                        for (const x of 딴) 묶.set(x.v, [...(묶.get(x.v) || []), x.ym])
                        const 글 = [...묶.entries()].map(([v, 달들]) => `${달들.map((m) => 짧달(m).replace(/월$/, '')).join(' · ')}월 ${원(v)}`)
                        return <small className="nm-wh" title="일한 날이 있는 다른 달은 그 달 일당 그대로입니다(그 달로 가서 고치면 그 달만 바뀝니다)">{글.slice(0, 2).join(' / ')}{글.length > 2 ? ` 외 ${글.length - 2}` : ''}</small>
                      })()}
                    </>)
                  })()}</td>
                  <td className="nw">
                    {빼기들.map(([c, 이름]) => {
                      const nx = 그달빼기(st, ym, p)
                      const on = nx.includes(c)
                      return (
                        <button key={c} type="button" className={'tp-ins ' + (on ? 'n' : 'y')} aria-pressed={on}
                          title={on ? `${이름} — 늘 뺌 (누르면 다시 셈 · 이 달부터)` : `${이름} — 셈함 (누르면 늘 뺌 · 이 달부터 — 지난달 명세서는 그대로)`}
                          onClick={() => 사람고침(p.id, 'nx', on ? nx.replace(c, '') : nx + c)}>{이름}{on ? '✕' : '✓'}</button>
                      )
                    })}
                  </td>
                  <td className="nw"><button type="button" className="tp-x" onClick={() => 빼기(p)} aria-label={`${p.n || i + 1 + '번'} 명단에서 빼기`}
                    title={일한날있음(st, ym, p.id) ? `${짧달(달더하기(ym, 1))}부터 명단에서 뺍니다(${짧달(ym)}에 일한 날이 있어 이 달 명세서에는 남음)` : `${짧달(ym)}부터 명단에서 뺍니다 — 지난달 명세서는 그대로`}>빼기</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="btn-row" style={{ justifyContent: 'flex-start', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={사람더함}>＋ 사람 더하기</button>
        </div>
        {st.P.length === 0 && <div className="note sm" style={{ marginTop: 8 }}>«＋ 사람 더하기» 로 이름 · 직종 · 일당을 적거나, 위의 «예시로 채워 보기» 로 먼저 둘러보십시오.</div>}
        {(이름없음 > 0 || 같은이름.length > 0) && (
          <div className="note sm" style={{ marginTop: 8 }}>⚠️ {이름없음 > 0 ? `이름이 빈 사람 ${이름없음}명` : ''}{이름없음 > 0 && 같은이름.length ? ' · ' : ''}{같은이름.length ? `같은 이름 ${같은이름.slice(0, 3).join(' · ')}` : ''}
            {' '}— 지급명세서 · 신고에서 헷갈리지 않게 이름을 적거나 «홍길동A» 처럼 구분해 두십시오.</div>
        )}
        {/* 💡 G162 지난달 · 이 달 모두 일한 날이 없는 사람 — 한꺼번에 빼기 */}
        {쉬는후보.length > 0 && (
          <div className="nm-strip">
            <span>💡 <b>{짧달(앞달)} · {짧달(ym)}</b> 모두 일한 날이 없는 <b>{쉬는후보.length}명</b>{쉬는후보.length <= 4 ? ` (${쉬는후보.map(이름글).join(' · ')})` : ` (${쉬는후보.slice(0, 3).map(이름글).join(' · ')} 외 ${쉬는후보.length - 3}명)`}</span>
            <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={한꺼번빼기}>{짧달(ym)}부터 한꺼번에 빼기</button>
          </div>
        )}
        {/* 🗓 G162 이 달 명단에 없는 사람 — 다시 오면 «이 달 명단에 넣기» */}
        {없는사람.length > 0 && (
          <div className="nm-gone">
            <button type="button" className="nm-gone-h" onClick={() => set없는펼침((v) => !v)} aria-expanded={없는펼침}>
              {없는펼침 ? '▾' : '▸'} 이 달 명단에 없는 사람 <b>{없는사람.length}명</b> <span className="muted">— 다시 오면 «이 달 명단에 넣기» · 지난달 명세서에는 그대로 있습니다</span>
            </button>
            {없는펼침 && (
              <ul className="nm-gone-l">
                {없는사람.map((p) => {
                  const 달들 = 일한달(st, p.id)
                  const 마지막 = 달들[달들.length - 1]
                  const 앞으로 = (p.r || []).map(([a]) => a).filter((a) => a && a > ym).sort()[0]
                  return (
                    <li key={p.id}>
                      <span className="nm-gone-n"><b>{이름글(p)}</b> <small className="muted">{p.j}</small></span>
                      <span className="nm-gone-m muted">{마지막 ? `마지막 출역 ${짧달(마지막)}` : 앞으로 ? `${짧달(앞으로)}부터 명단` : '출역 없음'}</span>
                      <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 다시넣기(p)}>이 달 명단에 넣기</button>
                      {지울사람 === p.id ? (
                        <span className="nm-ask">{달들.length ? `${달들.map(짧달).join(' · ')} 출역도 지웁니다 — 그 달 지급명세서 · 신고 정리에서도 빠집니다.` : '명단에서 지웁니다.'}
                          <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={() => 정말지우기(p)}>지우기</button>
                          <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => set지울사람(null)}>그대로</button>
                        </span>
                      ) : <button type="button" className="tp-x" onClick={() => set지울사람(p.id)}>완전히 지우기</button>}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}
        {/* 🩹 G162 전에 «지우기» 로 지운 사람 — 출역은 남아 있음(이름 · 일당만 없어짐) → 되살리면 그 달 명세서가 돌아옵니다 */}
        {남은.length > 0 && (
          <div className="nm-strip nm-strip-warn nm-orphan">
            <div>🩹 <b>전에 지운 사람의 출역 {남은.length}명분</b>이 남아 있습니다 — 되살리고 이름 · 일당을 다시 적으면 그 달 지급명세서가 돌아옵니다.</div>
            <ul>
              {남은.slice(0, 12).map((x) => (
                <li key={x.id}>
                  <span>{x.달들.map(짧달).join(' · ')} · {x.일수}일 · {공수글(x.공수)}공수{x.w ? ` · 일당 ${원(x.w)}` : ''}</span>
                  <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={() => 되살림(x)}>되살리기</button>
                  {버릴기록 === x.id ? (
                    <span className="nm-ask">정말 버릴까요?
                      <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 기록버림(x)}>버리기</button>
                      <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => set버릴기록(null)}>그대로</button>
                    </span>
                  ) : <button type="button" className="tp-x" onClick={() => set버릴기록(x.id)}>버리기</button>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {st.P.length > 0 && 이달명단.length === 0 && (
        <div className="card"><div className="note sm" style={{ margin: 0 }}>📅 {달글(ym)} 명단이 비어 있습니다 — 위 «＋ 사람 더하기» 나 «이 달 명단에 없는 사람» 에서 넣으십시오.</div></div>
      )}
      {이달명단.length > 0 && (
        <div className="card">
          <div className="detail-h" style={{ margin: 0 }}>📅 {달글(ym)} 출역 <span className="muted" style={{ fontWeight: 400, fontSize: 12.5 }}>— 칸을 누를 때마다 1 → 0.5 → 1.5 → 빈칸</span></div>
          <div className="tp-scroll">
            <table className="tbl tp-grid">
              <thead>
                <tr>
                  <th className="stk">이름</th>
                  {날들.map((i) => { const w = 요일(ym, i); return <th key={i} className={w === '일' ? 'sun' : w === '토' ? 'sat' : ''}>{i}<br /><small>{w}</small></th> })}
                  <th>공수</th><th>일수</th><th className="nw">한 번에</th>
                </tr>
              </thead>
              <tbody>
                {이달명단.map((p) => {
                  const g = 공수표(p.id)
                  const 합 = g.reduce((s, x) => s + x, 0)
                  return (
                    <tr key={p.id}>
                      <td className="stk nw"><b>{p.n || '(이름)'}</b> <small className="muted">{p.j}</small></td>
                      {g.map((x, i) => (
                        <td key={i} className={'tp-gc' + (x > 0 ? ' on' : '') + (x > 0 && x !== 1 ? ' part' : '')} onClick={() => 칸누름(p.id, i)}
                          role="button" aria-label={`${p.n} ${i + 1}일 ${x > 0 ? 공수글(x) + '공수' : '빈칸'}`}>{x > 0 ? 공수글(x) : ''}</td>
                      ))}
                      <td className="r">{공수글(합)}</td><td className="r">{g.filter((x) => x > 0).length}</td>
                      <td className="nw">
                        <button type="button" className="tp-x" onClick={() => 줄모두(p)}>일요일 빼고 모두</button>
                        <button type="button" className="tp-x" onClick={() => 줄지움(p)} disabled={!일한날있음(st, ym, p.id)}>지움</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {이달명단.some((p) => !그달일당(st, ym, p)) && <div className="note sm" style={{ marginTop: 6 }}>⚠️ 일당이 0원인 사람이 있습니다 — 명단에서 일당을 적어야 금액과 공제가 나옵니다.</div>}
        </div>
      )}

      {N.줄.length > 0 && (
        <div className="card tp-bill">
          <div className="btn-row no-print" style={{ justifyContent: 'flex-start', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={인쇄}>🖨 지급명세서 인쇄 (A4 가로)</button>
            <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={엑셀받기}>📗 값만 엑셀 받기</button>
            <span className="muted" style={{ fontSize: 12.5, alignSelf: 'center' }}>인쇄하면 출역 대장 · 지급 명세 · 신고용 집계가 함께 나옵니다. 엑셀은 보관용 값만(수식 없음) — 셈은 이 화면에서.</span>
          </div>
          {/* 📮👷🧾 G116 (2026-10-02) 경리 셋 — 같은 출역을 그대로 읽음 · 소장님 「현재 사이트에 있는 것과 연계해서」 */}
          <div className="btn-row no-print nm-next" style={{ justifyContent: 'flex-start', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <span className="muted" style={{ fontSize: 12.5, alignSelf: 'center' }}>이 출역 그대로 —</span>
            <Link className="btn line sm" style={{ width: 'auto' }} to="/tools/singo">📮 신고 정리 (원천세 · 근로내용 · 기한)</Link>
            <Link className="btn line sm" style={{ width: 'auto' }} to="/tools/toejik">👷 퇴직공제 근로일수 · 부금</Link>
            <Link className="btn line sm" style={{ width: 'auto' }} to="/tools/boheomryo">🧾 고용 · 산재 보험료</Link>
          </div>
          <div className="tp-bill-hd">
            <h2 className="tp-bill-h">일용노무비 지급명세서 ({달글(ym)})</h2>
            <table className="tbl tp-sign"><tbody><tr><th>작성</th><th>검토</th><th>현장소장</th></tr><tr><td /><td /><td /></tr></tbody></table>
          </div>
          <table className="tbl tp-bill-top">
            <tbody>
              <tr><th>회사명</th><td>{st.co || <span className="muted no-print">위에 회사명을 넣으십시오</span>}</td><th>현장명</th><td>{st.site}</td>
                <th>귀속 기간</th><td className="nw">{ym}-01 ~ {ym}-{두자(날수)}</td></tr>
              <tr><th>지급 총액</th><td colSpan={5}><b>일금 {한글금액(N.합계.차인)} 원정 (₩{원(N.합계.차인)})</b> <span className="muted">— 노무비 {원(N.합계.보수)}원에서 공제 {원(N.합계.합)}원을 뺀 실지급액</span></td></tr>
            </tbody>
          </table>

          <div className="nm-printonly">
            <div className="tp-bill-sub">① 출역 대장</div>
            <table className="tbl tp-grid">
              <thead>
                <tr><th className="stk">성명</th>{날들.map((i) => <th key={i}>{i}</th>)}<th>공수</th><th>일수</th></tr>
              </thead>
              <tbody>
                {N.줄.map((r) => (
                  <tr key={r.id}><td className="stk nw">{r.p.n}</td>{r.공수.map((g, i) => <td key={i}>{g > 0 ? 공수글(g) : ''}</td>)}
                    <td className="r">{공수글(r.공수합)}</td><td className="r">{r.일수}</td></tr>
                ))}
                <tr className="sum"><td className="stk">합계 {N.합계.인원}명</td>{N.날합.map((n, i) => <td key={i}>{n || ''}</td>)}
                  <td className="r">{공수글(N.합계.공수)}</td><td className="r">{N.합계.일수}</td></tr>
              </tbody>
            </table>
          </div>

          <div className="tp-bill-sub"><span className="nm-printonly-inline">② </span>지급 명세 <span className="muted no-print">— 보험 단추를 누르면 이 달만 넣고 빼며, 공제 칸을 누르면 금액을 고쳐 씁니다 (🟨 = 손으로 고친 칸)</span></div>
          <div className="tp-billsum">
            <div><span>노무비 (보수 총액)</span><b>{원(N.합계.보수)}</b></div>
            <div className="minus"><span>공제 합계</span><b>− {원(N.합계.합)}</b><i>{공제칸.map((c) => `${c.이름} ${원(N.합계[c.k])}`).join(' · ')}</i></div>
            <div className="pay"><span>실지급액 (차인지급액)</span><b>{원(N.합계.차인)}</b><i>공제를 뺀, 근로자에게 줄 돈</i></div>
          </div>
          <div className="tp-inssum">
            <b>4대보험 대상</b> — 국민연금 <b>{N.합계.대상수.P}명</b> · 건강·요양 <b>{N.합계.대상수.H}명</b> · 고용 <b>{N.합계.대상수.E}명</b> / 전체 {N.합계.인원}명
            {안됨.length > 0 && <> · <span className="muted">대상 아님: {안됨.map((r) => `${r.p.n}(${[!r.대상.P.대상 && '연금', !r.대상.H.대상 && '건강', !r.대상.E.대상 && '고용'].filter(Boolean).join('·')} — ${!r.대상.P.대상 ? r.대상.P.이유 : !r.대상.H.대상 ? r.대상.H.이유 : r.대상.E.이유})`).join(', ')}</span></>}
          </div>
          {알림 && <div className="note sm no-print" role="status">{알림}</div>}
          <div className="tp-scroll">
            <table className="tbl tp-lb">
              <thead>
                <tr>
                  <th>No</th><th>성명</th><th>직종</th><th>일수</th><th>공수</th><th>일당</th><th>노무비</th><th>4대보험 대상</th>
                  {공제칸.map((c) => <th key={c.k}>{c.이름}</th>)}
                  <th>공제계</th><th>실지급액<br /><small>(차인지급액)</small></th><th className="nm-sigh">영수 (서명)</th>
                </tr>
              </thead>
              <tbody>
                {N.줄.map((r, i) => (
                  <tr key={r.id}>
                    <td>{i + 1}</td>
                    <td className="nw"><b>{r.p.n}</b></td>
                    <td className="nw">{r.p.j}</td>
                    <td className="r">{r.일수}</td>
                    <td className="r">{공수글(r.공수합)}</td>
                    <td className="r">{원(r.w)}</td>
                    <td className="r"><b>{원(r.보수)}</b></td>
                    <td className="nw tp-insc">
                      {[['P', '연금'], ['H', '건강'], ['E', '고용']].map(([c, 이름]) => {
                        const d = r.대상[c]
                        return (
                          <button key={c} type="button" className={'tp-ins ' + (d.대상 ? 'y' : 'n') + (d.손 ? ' hand' : '')}
                            title={`${이름}: ${d.대상 ? '대상' : '대상 아님'} — ${d.이유}${d.이유 === '명부에서 뺌' ? '' : d.손 ? ' (누르면 자동으로)' : d.대상 ? ' (누르면 이 달만 빼기)' : ' (누르면 이 달만 넣기)'}`}
                            onClick={() => 대상누름(r, c)}>{이름}{d.대상 ? '✓' : '✕'}{d.손 ? '✎' : ''}</button>
                        )
                      })}
                      <small className="tp-insr">연금 {r.대상.P.이유} · 건강 {r.대상.H.이유}{r.대상.E.이유 !== '일용 모두' ? ` · 고용 ${r.대상.E.이유}` : ''}</small>
                      <button type="button" className="tp-x no-print" onClick={() => 판단보기(r)} title="이 사람 출역(이 브라우저에 적은 모든 달)으로 4대보험 가입 판단기를 엽니다">🛡 판단 자세히</button>
                    </td>
                    {공제칸.map((c) => {
                      const 고침 = r.고침[c.k] != null
                      if (편집 && 편집.id === r.id && 편집.k === c.k) {
                        return (
                          <td key={c.k} className="r tp-ded">
                            <input className="tp-dedin" autoFocus defaultValue={원(r.최종[c.k])} inputMode="numeric" aria-label={`${r.p.n} ${c.이름}`}
                              onKeyDown={(e) => { if (e.key === 'Enter') 공제저장(r.id, c.k, e.currentTarget.value); if (e.key === 'Escape') set편집(null) }}
                              onBlur={(e) => 공제저장(r.id, c.k, e.currentTarget.value)} />
                            {고침 && <button type="button" className="tp-x" onMouseDown={(e) => { e.preventDefault(); 공제저장(r.id, c.k, null) }}>자동</button>}
                          </td>
                        )
                      }
                      return (
                        <td key={c.k} className={'r tp-ded' + (고침 ? ' fix' : '')} title={고침 ? `자동 값 ${원(r.자동[c.k])}` : '누르면 고쳐 씁니다'}
                          onClick={() => set편집({ id: r.id, k: c.k })}>{원(r.최종[c.k])}</td>
                      )
                    })}
                    <td className="r">{원(r.최종.합)}</td>
                    <td className="r"><b>{원(r.최종.차인)}</b></td>
                    <td className="nm-sig" />
                  </tr>
                ))}
                <tr className="sum">
                  <td /><td>합계</td><td>{N.합계.인원}명</td><td className="r">{N.합계.일수}</td><td className="r">{공수글(N.합계.공수)}</td><td />
                  <td className="r"><b>{원(N.합계.보수)}</b></td>
                  <td className="nw">연금 {N.합계.대상수.P} · 건강 {N.합계.대상수.H} · 고용 {N.합계.대상수.E}</td>
                  {공제칸.map((c) => <td key={c.k} className="r">{원(N.합계[c.k])}</td>)}
                  <td className="r">{원(N.합계.합)}</td><td className="r"><b>{원(N.합계.차인)}</b></td><td />
                </tr>
              </tbody>
            </table>
          </div>
          <div className="tp-note">
            공제 — {R.해}년 요율: 소득세 (일급 − 15만원) × 2.7%(한 달 합 1천원 미만 안 뗌) · 지방소득세 10% · 고용 {(R.ei * 100).toFixed(1)}% ·
            국민연금 {(R.np * 100).toFixed(2).replace(/0$/, '')}%(이 현장 한 달 8일↑ 또는 220만원↑) · 건강 {(R.hi * 100).toFixed(3)}% ·
            장기요양 건강보험료 × {(R.lc * 100).toFixed(2)}%(8일↑) · 10원 미만 버림.
            {N.잠정 && N.잠정.length > 0 && <b> ⚠️ {N.잠정.join('·')} 요율은 아직 확정 전이라 앞해 값으로 셈했습니다.</b>}
            {N.요율없음 && <b> ⚠️ 이 해의 요율은 아직 없어 {N.요율해}년 요율로 셈했습니다.</b>}
            {' '}생년월일을 넣은 사람은 만 60세가 된 다음 날부터 국민연금을, 만 65세부터 일한 날은 고용보험 실업급여 몫(0.9%)을 저절로 뺍니다(65세 전부터 끊김 없이 계속 고용된 분은 «고용» 단추로 넣기).
            {' '}다른 현장 근무(국민연금은 회사 합산) · 외국인 등은 모르니 보험 단추로 넣고 빼고, 신고 전 한 번 더 확인하십시오.
          </div>

          <div className="tp-pb" />
          <div className="tp-bill-sub"><span className="nm-printonly-inline">③ </span>신고용 집계 — 근로내용 확인신고 · 일용근로소득 지급명세서</div>
          <div className="tp-scroll">
            <table className="tbl nm-rep">
              <thead>
                <tr><th>No</th><th>성명</th><th>직종</th><th>근로일 ({Number(ym.slice(5, 7))}월)</th><th>근로일수</th><th>지급액(보수 총액)</th><th>소득세</th><th>지방소득세</th></tr>
              </thead>
              <tbody>
                {N.줄.map((r, i) => (
                  <tr key={r.id}>
                    <td>{i + 1}</td><td className="nw">{r.p.n}</td><td className="nw">{r.p.j}</td>
                    <td className="nm-days">{r.날들.join(', ')}</td>
                    <td className="r">{r.일수}</td><td className="r">{원(r.보수)}</td><td className="r">{원(r.최종.it)}</td><td className="r">{원(r.최종.lt)}</td>
                  </tr>
                ))}
                <tr className="sum"><td /><td>합계</td><td>{N.합계.인원}명</td><td /><td className="r">{N.합계.일수}</td>
                  <td className="r">{원(N.합계.보수)}</td><td className="r">{원(N.합계.it)}</td><td className="r">{원(N.합계.lt)}</td></tr>
              </tbody>
            </table>
          </div>
          <ul className="tp-note nm-due">
            <li><b>근로내용 확인신고서</b>(근로복지공단 · 고용·산재 토탈서비스) — 일한 달의 <b>다음 달 15일까지</b> (고용보험법 시행령 제7조제1항 후단).
              {' '}<span className="nm-due-d">{달글(ym)} 분 → {달글(달더하기(ym, 1))} 15일까지</span></li>
            <li>근로내용 확인신고서에 국세청 칸(지급액 · 소득세 · 지방소득세)까지 적어 내면 <b>일용근로소득 지급명세서를 낸 것으로 봅니다</b> (소득세법 시행령 제213조제4항).</li>
            <li>지급명세서를 따로 낼 때는 <b>지급한 달의 다음 달 말일까지</b> (소득세법 제164조제1항 단서) — 홈택스.</li>
            <li>주민등록번호 · 직종 부호 · 근로시간 같은 칸은 신고 화면에서 넣으십시오. 이 화면은 그 숫자를 옮겨 적기 위한 집계입니다.</li>
            <li>기관마다 넣을 숫자와 기한(휴일이면 다음 날)을 한 장으로 — <Link to="/tools/singo">📮 매달 신고 정리</Link> · 퇴직공제 가입 현장은 <Link to="/tools/toejik">👷 퇴직공제 집계</Link>.</li>
          </ul>
        </div>
      )}

      <details className="card js-more">
        <summary className="sec-title">쓰는 방법 · 알아 두실 것</summary>
        <ul className="flist" style={{ marginBottom: 0 }}>
          <li><b>명단</b>에 이름 · 직종 · 일당을 적습니다. 다음 달에도 명단은 그대로 이어집니다.
            안 나오는 사람은 <b>«빼기»</b> — 그 달부터 명단 · 출역표에서 빠지고 <b>지난달 지급명세서 · 신고는 그대로</b>입니다(이 달에 일한 날이 있으면 다음 달부터).
            다시 오면 <b>«이 달 명단에 없는 사람»</b> 에서 «이 달 명단에 넣기». 새로 더한 사람은 더한 달부터 보입니다.</li>
          <li><b>일당 · 늘 빼기</b>를 고치면 <b>그 달(과 아직 안 적은 달)만</b> 바뀝니다 — 일한 날이 있는 다른 달은 그 달 값 그대로(일당 칸 아래 «9월 170,000» 처럼 보임). 지난달 것을 고치려면 그 달로 가서 고치십시오.</li>
          <li>빼기 · 지우기 · 출역 «지움» · «처음부터» 는 바로 뒤에 <b>«↩ 되돌리기»</b> 가 있습니다.</li>
          <li><b>출역</b> 칸을 누를 때마다 <b>1공수 → 0.5 → 1.5 → 빈칸</b>. 날마다 같이 나오면 «일요일 빼고 모두» 를 누른 뒤 안 나온 날만 지우십시오.</li>
          <li><b>소득세</b>는 날마다 따로 셉니다 — 그날 받은 돈에서 15만원을 빼고 6% 의 45%(근로소득세액공제 55% 뺌), 한 달 합이 1천원 미만이면 떼지 않습니다(소액부징수).
            하루 15만원 이하면 소득세가 없습니다.</li>
          <li><b>국민연금</b>은 달 단위(일 시작한 달은 시작일~말일)로 8일 이상 또는 220만원 이상, <b>건강보험 · 장기요양</b>은 첫 근로일부터 1개월 되는 날까지 8일 이상(그다음은 달마다 8일)일 때
            가입하고, <b>보험료는 취득한 달의 다음 달부터</b>(1일 취득은 그 달부터) 뗍니다 — 이 브라우저에 적은 모든 달을 보고 셉니다.
            사람마다 <b>«🛡 판단 자세히»</b> 를 누르면 <Link to="/tools/ilyong-boheom">4대보험 가입 판단기</Link>에서 취득 · 상실일과 까닭을 봅니다.
            다른 현장에서 일한 날을 합쳐야 하는 경우 · 나이(연금 60세 이상 등) · 외국인처럼 이 화면이 모르는 것은 «4대보험 대상» 단추로 그 달만 넣고 빼거나, 명단의 «늘 빼기» 를 켜십시오.</li>
          <li>공제 칸을 누르면 금액을 고쳐 쓸 수 있습니다(🟨). «자동» 을 누르면 다시 셈한 값으로 돌아갑니다.</li>
          <li><b>🏗 현장</b> — 맨 위 «＋ 새 현장» 으로 현장을 더하면 현장마다 회사명 · 현장명 · 명단 · 출역이 <b>따로</b> 저장됩니다. 목록에서 고르면 그 현장으로 바뀝니다. 새 현장을 만들 때 «이 달 명단 가져오기» 를 고르면 이름 · 직종 · 생년월일 · 일당만 옮겨 오고 출역은 비어서 시작합니다. «이 현장 빼기» 는 목록에서만 빼고 자료는 남겨 «뺀 현장» 에서 되살립니다. 🔗 이어 쓰기 코드도 현장마다 따로 겁니다. 신고 정리 · 퇴직공제 · 보험료 계산기는 여기서 고른 현장으로 셉니다.</li>
          <li>적은 것은 <b>이 브라우저에</b> 남습니다. 폰·PC 어디서든 이어 쓰려면 위 <b>«🔗 코드 만들기»</b> — 명단 · 출역 전부를 비밀번호로 잠가 서버에 두고(저희도 못 읽음), 다른 기기에서 «코드로 열기». 청구서까지 여럿이 같이 쓰려면 <Link to="/tools/tuipbi">현장 투입비 · 공사일보</Link>(노무비 청구내역서 포함).</li>
          <li>엑셀로 쓰실 분은 서식 <Link to="/forms/nomubi">노무비 지급확인서</Link> · <Link to="/forms/imgeum-daejang">임금대장</Link> 이 있습니다.</li>
        </ul>
      </details>
    </div>
  )
}

/**
 * 🏗 G178 (2026-10-07) 현장별로 나눠 쓰기 — 맵톡 이용자 건의 「현장별로 나눠서 저장이 가능해야 되는데 그 기능은 없는 것 같아요」
 *   → 소장님 「현장별로 나눠서 쓸 수 있게 해줘」 「고쳐줘」
 *   · 현장 목록(lib/nomubi.js 현장목록) — 고르기 · ＋ 새 현장(이 달 명단 가져오기 고를 수 있음) · 이 현장 빼기(자료는 남김) · 뺀 현장 되살리기
 *   · 지금 쓰던 자료 = 첫 현장(예전 자리 그대로) · 창(alert · confirm)은 띄우지 않음 — «한 번 더 누르기»
 *   · 숨은 누적: |노무비|현장추가 · |노무비|명단가져옴 · |노무비|현장바꿈 · |노무비|현장뺌 · |노무비|현장되살림
 */
export default function Nomubi() {
  const [목록, set목록] = useState(() => 현장목록())
  const [, set판] = useState(0)                  // 현장명을 고치면 목록 이름을 다시 읽음
  const [새칸, set새칸] = useState(null)          // { 이름, 가져옴 }
  const [뺌물음, set뺌물음] = useState(false)
  const [되살릴, set되살릴] = useState('')
  const [알림, set알림] = useState('')
  const cur = 목록.cur
  const 산 = 목록.L.filter((x) => !x.del)
  const 뺀 = 목록.L.filter((x) => x.del)
  const 이름 = (x) => (x ? 현장이름(x, 목록.L.indexOf(x)) : '')
  const 지금 = 목록.L.find((x) => x.id === cur)
  /* 다른 창(이 계산기 · 신고 정리 등)에서 현장을 더하거나 빼면 목록만 따라감 — 이 창이 보고 있는 현장은 그대로 */
  useEffect(() => {
    const f = (e) => {
      if (e.key !== 현장목록열쇠) return
      set목록((m) => { const n = 현장목록(); return n.L.some((x) => x.id === m.cur && !x.del) ? { ...n, cur: m.cur } : n })
    }
    window.addEventListener('storage', f)
    return () => window.removeEventListener('storage', f)
  }, [])
  useEffect(() => { if (!알림) return undefined; const t = setTimeout(() => set알림(''), 12000); return () => clearTimeout(t) }, [알림])
  const 바꿈 = (m, 글) => { 현장목록쓰기(m); set목록(m); set새칸(null); set뺌물음(false); set알림(글 || '') }
  const 고르기 = (id) => {
    if (!id || id === cur) return
    바꿈({ ...목록, cur: id }, '')
    세기('|노무비|현장바꿈')
  }
  const 만들기 = () => {
    if (!새칸) return
    const 이름글 = 새칸.이름.trim()
    const { m } = 현장더하기(목록, 이름글, 읽기현장(cur), 새칸.가져옴)
    바꿈(m, `새 현장 «${이름글 || `현장 ${m.L.length}`}» 을 만들었습니다${새칸.가져옴 ? ' — 명단(이름 · 직종 · 생년월일 · 일당)을 가져왔고 출역은 비어 있습니다' : ''}.`)
    세기('|노무비|현장추가')
    if (새칸.가져옴) 세기('|노무비|명단가져옴')
  }
  const 빼기 = () => {
    const 글 = 이름(지금)
    바꿈(현장지우기(목록, cur), `«${글}» 현장을 목록에서 뺐습니다 — 자료는 남아 있어 아래 «뺀 현장» 에서 되살릴 수 있습니다.`)
    세기('|노무비|현장뺌')
  }
  const 되살리기 = () => {
    const x = 목록.L.find((y) => y.id === 되살릴)
    if (!x) return
    바꿈(현장되살리기(목록, x.id), `«${이름(x)}» 현장을 되살렸습니다.`)
    set되살릴('')
    세기('|노무비|현장되살림')
  }
  const 현장칸 = (
    <div className="nm-sites no-print">
      <div className="nm-sites-row">
        <b className="nm-sites-h">🏗 현장</b>
        <select className="inp nm-site-sel" value={cur} onChange={(e) => 고르기(e.target.value)} aria-label="현장 고르기">
          {산.map((x) => <option key={x.id} value={x.id}>{이름(x)}</option>)}
        </select>
        <span className="muted nm-sites-n">{산.length}곳</span>
        {!새칸 && <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => { set새칸({ 이름: '', 가져옴: false }); set뺌물음(false) }}>＋ 새 현장</button>}
        {산.length > 1 && !새칸 && !뺌물음 && <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => set뺌물음(true)}>이 현장 빼기</button>}
      </div>
      {새칸 && (
        <div className="nm-sites-new">
          <input className="inp" value={새칸.이름} maxLength={60} autoFocus placeholder="새 현장 이름 (예: ○○지구 배수로 정비공사)"
            onChange={(e) => set새칸({ ...새칸, 이름: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') 만들기() }} aria-label="새 현장 이름" />
          <label className="nm-chk"><input type="checkbox" checked={새칸.가져옴} onChange={(e) => set새칸({ ...새칸, 가져옴: e.target.checked })} />
            <span>«{이름(지금)}» 의 이 달 명단(이름 · 직종 · 생년월일 · 일당) 가져오기 <span className="muted">— 출역은 비어서 시작</span></span></label>
          <div className="nm-sites-btns">
            <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={만들기}>만들기</button>
            <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => set새칸(null)}>그만두기</button>
          </div>
        </div>
      )}
      {뺌물음 && (
        <div className="nm-ask nm-sites-ask">«{이름(지금)}» 현장을 목록에서 뺍니다. 자료는 지우지 않고 남겨 두어 되살릴 수 있습니다.
          <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={빼기}>빼기</button>
          <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => set뺌물음(false)}>그대로 두기</button>
        </div>
      )}
      {뺀.length > 0 && (
        <div className="nm-sites-del">
          <span className="muted">🗑 뺀 현장 {뺀.length}곳</span>
          <select className="inp nm-site-sel" value={되살릴} onChange={(e) => set되살릴(e.target.value)} aria-label="되살릴 현장">
            <option value="">고르기</option>
            {뺀.map((x) => <option key={x.id} value={x.id}>{이름(x)}</option>)}
          </select>
          <button type="button" className="btn line sm" style={{ width: 'auto' }} disabled={!되살릴} onClick={되살리기}>되살리기</button>
        </div>
      )}
      {알림 && <div className="nm-sites-msg" role="status">✓ {알림}</div>}
      <div className="nm-sites-note muted">현장마다 회사명 · 현장명 · 명단 · 출역이 따로 저장됩니다. 🔗 이어 쓰기 코드도 현장마다 따로 겁니다.</div>
    </div>
  )
  return <계산기 key={cur} 현장id={cur} 현장칸={현장칸} on현장명={() => set판((n) => n + 1)} />
}
