import { useEffect, useMemo, useState } from 'react'
import { ref, get, set, push, update, query, orderByKey, limitToLast } from 'firebase/database'
import { db, ensureAnon } from './firebase.js'
import { pinHash } from './lib/pin.js'
import { Skeleton } from './components.jsx'

/* ══════════════════════════════════════════════════════════════
   📤 이용자가 올린 서식 (2026-09-06)
   소장님: 「이용자가 스스로 서식 올릴 수 있게. 서식탭하고 설계변경탭에서.」
          「블레이즈. 승인 없이 올릴 수 있게」 「용량이 크면 압축해서 저장공간을 절약」

   ■ 어디에 — 파일은 Firebase Storage(user_forms/{uid}/…), 목록은 RTDB(user_forms). 승인 단계 없음.
     그래서 «규칙» 이 문지기입니다 (storage.rules · database.rules.json):
       익명 로그인 필요 · 10MB 이하 · 확장자 허용 목록(매크로 xlsm·docm 은 안 됨) · 올린 뒤 덮어쓰기·삭제 불가
       · 목록의 url 은 우리 Storage 주소여야 함 · 신고 3건이면 화면에서 숨김.
   ■ 비용 — 목록은 이 갈래를 «열 때» get() 한 번(limitToLast 200). 실시간 구독 없음. 파일은 Storage 에서 바로 받음.
   ■ 압축 — 브라우저가 gzip(CompressionStream)으로 눌러서 올립니다. 10% 넘게 줄 때만.
       xlsx·docx·pdf 는 이미 압축 파일이라 거의 안 줄고, hwp·xls 는 절반쯤 줍니다(실측은 화면에 그대로 적습니다).
       Storage 에 contentEncoding=gzip 으로 올리면 **받을 때 브라우저가 알아서 풀어** 원래 파일로 저장됩니다.
   ■ 정직하게 — 승인이 없으니 «남의 유료 서식·이상한 파일» 이 올라올 수 있습니다.
       그래서 카드마다 「🚩 신고」 와 «올린 사람 책임» 문구를 두고, 확장자·크기로 걸러지지 않는 위험은 남는다고 적어 둡니다.
   ══════════════════════════════════════════════════════════════ */

export const UF_CATS = ['서식', '설계변경', '내역서', '계약', '안전', '기타']
const EXT_OK = ['xlsx', 'xls', 'docx', 'doc', 'hwp', 'hwpx', 'pdf', 'pptx']
const MAX_RAW = 20 * 1024 * 1024       // 올리기 전 원본 상한
const MAX_STORED = 10 * 1024 * 1024    // 저장 상한 (규칙과 같아야 합니다)
const LIMIT = 200
const MINE_KEY = 'kcm_my_forms'
const FLAG_HIDE = 3

const kb = (n) => (n >= 1048576 ? (n / 1048576).toFixed(1) + 'MB' : Math.max(1, Math.round(n / 1024)) + 'KB')
const ago = (t) => {
  const d = Math.floor((Date.now() - t) / 864e5)
  return d < 1 ? '오늘' : d < 30 ? `${d}일 전` : new Date(t).toLocaleDateString('ko-KR')
}
const extOf = (name) => String(name || '').toLowerCase().split('.').pop()
const loadMine = () => { try { return JSON.parse(localStorage.getItem(MINE_KEY) || '[]') } catch { return [] } }
const addMine = (id) => { try { localStorage.setItem(MINE_KEY, JSON.stringify([...loadMine(), id].slice(-50))) } catch { /* noop */ } }

/** gzip 으로 눌러 봅니다. 10% 넘게 줄 때만 씁니다 — 아니면 원본 그대로. */
async function maybeGzip(file) {
  if (typeof CompressionStream === 'undefined') return { blob: file, gz: false }
  try {
    const cs = new CompressionStream('gzip')
    const gzBlob = await new Response(file.stream().pipeThrough(cs)).blob()
    if (gzBlob.size < file.size * 0.9) return { blob: gzBlob, gz: true }
  } catch { /* 지원 안 하면 원본 */ }
  return { blob: file, gz: false }
}

export default function UserFormsPanel({ cat, compact }) {
  const [list, setList] = useState(null)
  const [flags, setFlags] = useState({})
  const [dels, setDels] = useState({})
  const [writing, setWriting] = useState(false)
  const [err, setErr] = useState('')
  const [mine, setMine] = useState(loadMine)

  const load = async () => {
    setList(null); setErr('')
    try {
      const [snap, flagSnap, delSnap] = await Promise.all([
        get(query(ref(db, 'user_forms'), orderByKey(), limitToLast(LIMIT))),
        get(query(ref(db, 'uf_flag'), orderByKey(), limitToLast(LIMIT))),
        get(query(ref(db, 'uf_del'), orderByKey(), limitToLast(LIMIT))),
      ])
      const fl = {}
      for (const [id, v] of Object.entries(flagSnap.val() || {})) fl[id] = Object.keys(v || {}).length
      setFlags(fl); setDels(delSnap.val() || {})
      setList(Object.entries(snap.val() || {}).map(([id, v]) => ({ id, ...v })).sort((a, b) => (b.at || 0) - (a.at || 0)))
    } catch {
      setErr('목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
      setList([])
    }
  }
  useEffect(() => { load() }, [])  // eslint-disable-line

  const view = useMemo(() => (list || []).filter((f) =>
    !f.deleted && !dels[f.id] && (flags[f.id] || 0) < FLAG_HIDE && (!cat || f.cat === cat)), [list, dels, flags, cat])

  const flag = async (id) => {
    try {
      const u = await ensureAnon()
      await set(ref(db, `uf_flag/${id}/${u.uid}`), true)
      setFlags((f) => ({ ...f, [id]: (f[id] || 0) + 1 }))
    } catch { setErr('신고를 보내지 못했습니다.') }
  }
  const remove = async (f) => {
    const pin = window.prompt('올릴 때 정한 4자리 숫자를 넣으세요')
    if (!pin) return
    try {
      await ensureAnon()
      await set(ref(db, `uf_del/${f.id}`), await pinHash(f.id, pin))
      setDels((d) => ({ ...d, [f.id]: true }))
    } catch { setErr('숫자가 다르거나 지울 수 없습니다.') }
  }

  return (
    <div className="uf-body">
        <>
          <div className="hint" style={{ margin: '6px 2px 8px' }}>
            누구나 올리고 누구나 받습니다(승인 절차 없음). 올린 사람이 내용에 책임집니다 —
            남의 유료 서식·개인정보가 든 파일은 올리지 마세요. 이상한 파일은 🚩 신고 3건이면 목록에서 사라집니다.
          </div>
          {!writing && (
            <button className="btn" style={{ marginBottom: 10 }} onClick={() => setWriting(true)}>📤 내 서식 올리기</button>
          )}
          {writing && (
            <UploadForm defaultCat={cat} onClose={() => setWriting(false)}
              onDone={(id) => { addMine(id); setMine(loadMine()); setWriting(false); load() }} />
          )}
          {err && <div className="note" style={{ color: 'var(--bad)', marginBottom: 8 }}>{err}</div>}
          {list === null ? <Skeleton n={2} /> : view.length === 0 ? (
            <div className="mt-empty">아직 올라온 서식이 없습니다. 첫 서식을 올려 보세요.</div>
          ) : view.slice(0, compact ? 8 : 200).map((f) => (
            <div className="uf-card" key={f.id}>
              <div className="uf-top">
                <span className={'fx fx-' + f.ext}>{f.ext}</span>
                <div className="grow">
                  <div className="t">{f.title}</div>
                  <div className="d">
                    {f.cat} · {kb(f.size)}{f.gz && f.stored ? ` (저장 ${kb(f.stored)})` : ''} · {f.by ? `${f.by} · ` : ''}{ago(f.at)}
                  </div>
                  {f.desc && <div className="d2">{f.desc}</div>}
                </div>
              </div>
              <div className="uf-act">
                <a className="btn sm" href={f.url} download={f.name}>⬇ 받기</a>
                <button className="lnk" onClick={() => flag(f.id)}>🚩 신고{flags[f.id] ? ` ${flags[f.id]}` : ''}</button>
                {mine.includes(f.id) && <button className="lnk" onClick={() => remove(f)}>내가 올린 것 지우기</button>}
              </div>
            </div>
          ))}
        </>
    </div>
  )
}

function UploadForm({ defaultCat, onClose, onDone }) {
  const [f, setF] = useState({ title: '', desc: '', cat: defaultCat || UF_CATS[0], by: '', pin: '' })
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const up = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = async () => {
    setErr('')
    if (f.title.trim().length < 2) return setErr('제목을 2자 이상 적어 주세요.')
    if (!/^\d{4}$/.test(f.pin)) return setErr('지울 때 쓸 4자리 숫자를 정해 주세요.')
    if (!file) return setErr('파일을 고르세요.')
    const ext = extOf(file.name)
    if (!EXT_OK.includes(ext)) return setErr(`이 형식은 받지 않습니다(${ext}). 되는 것: ${EXT_OK.join(' ')} — 매크로 파일(xlsm·docm)은 안 됩니다.`)
    if (file.size > MAX_RAW) return setErr(`파일이 너무 큽니다(${kb(file.size)}). 20MB 이하만.`)
    try {
      setBusy('압축하는 중…')
      const { blob, gz } = await maybeGzip(file)
      if (blob.size > MAX_STORED) return setErr(`압축해도 ${kb(blob.size)} 입니다. 저장 상한은 10MB 입니다.`)
      setBusy(gz ? `올리는 중… (${kb(file.size)} → ${kb(blob.size)} 압축)` : `올리는 중… (${kb(file.size)})`)
      const user = await ensureAnon()
      /* Storage SDK 는 여기서만 씁니다 — 목록만 보는 사람은 이 덩어리(약 30KB)를 안 받습니다 */
      const { getStorage, ref: sref, uploadBytes, getDownloadURL } = await import('firebase/storage')
      const st = getStorage()
      const safe = file.name.replace(/[\\/:*?"<>|]/g, '_').slice(-100)
      const key = `${Date.now().toString(36)}_${safe}`
      const r = sref(st, `user_forms/${user.uid}/${key}`)
      await uploadBytes(r, blob, {
        contentType: file.type || 'application/octet-stream',
        ...(gz ? { contentEncoding: 'gzip' } : {}),
        contentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`,
      })
      const url = await getDownloadURL(r)
      setBusy('목록에 적는 중…')
      const id = push(ref(db, 'user_forms')).key
      await set(ref(db, `uf_pins/${id}`), await pinHash(id, f.pin))
      await set(ref(db, `user_forms/${id}`), {
        title: f.title.trim().slice(0, 60), desc: f.desc.trim().slice(0, 300), cat: f.cat,
        by: f.by.trim().slice(0, 20), uid: user.uid, at: Date.now(),
        url, name: file.name.slice(0, 120), size: file.size, stored: blob.size, ext, gz,
      })
      onDone(id)
    } catch (e) {
      const m = String(e && e.code || e || '')
      setErr(m.includes('storage/unauthorized') || m.includes('PERMISSION')
        ? '올릴 수 없습니다 — 형식·크기 규칙에 걸렸거나 아직 저장소가 준비되지 않았습니다.'
        : '올리지 못했습니다. 잠시 후 다시 시도해주세요.')
    } finally { setBusy('') }
  }

  return (
    <div className="card" style={{ marginBottom: 10 }}>
      <div className="sec-title" style={{ margin: '0 0 8px' }}>📤 내 서식 올리기</div>
      <div className="field"><label>제목</label>
        <input value={f.title} onChange={up('title')} placeholder="예: 공사일보 양식(2026)" maxLength={60} /></div>
      <div className="field"><label>갈래</label>
        <div className="chips wrap">{UF_CATS.map((c) => (
          <button key={c} className={'chip' + (f.cat === c ? ' on' : '')} onClick={() => setF({ ...f, cat: c })}>{c}</button>))}</div></div>
      <div className="field"><label>설명 <span className="hint">— 선택</span></label>
        <textarea value={f.desc} onChange={up('desc')} rows={2} maxLength={300} placeholder="어디에 쓰는 서식인지 한 줄" /></div>
      <div className="field"><label>올린 사람 <span className="hint">— 선택, 회사명이나 별명</span></label>
        <input value={f.by} onChange={up('by')} maxLength={20} /></div>
      <div className="field"><label>파일 <span className="hint">— xlsx·xls·docx·doc·hwp·hwpx·pdf·pptx, 20MB 이하 · 큰 파일은 자동으로 압축해 저장합니다</span></label>
        <input type="file" accept=".xlsx,.xls,.docx,.doc,.hwp,.hwpx,.pdf,.pptx" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        {file && <div className="hint" style={{ marginTop: 4 }}>{file.name} · {kb(file.size)}</div>}</div>
      <div className="field"><label>지울 때 쓸 4자리 숫자</label>
        <input value={f.pin} onChange={up('pin')} inputMode="numeric" maxLength={4} placeholder="예: 1234" /></div>
      {err && <div className="note" style={{ color: 'var(--bad)' }}>{err}</div>}
      <div className="btn-row">
        <button className="btn" disabled={!!busy} onClick={submit}>{busy || '올리기'}</button>
        <button className="btn ghost" disabled={!!busy} onClick={onClose}>취소</button>
      </div>
      <div className="hint" style={{ marginTop: 6 }}>
        올리는 순간 누구나 받을 수 있게 됩니다(승인 절차 없음). 저작권·개인정보는 올린 사람 책임입니다.
      </div>
    </div>
  )
}
