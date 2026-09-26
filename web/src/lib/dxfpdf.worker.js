/* 📄 도면 PDF — 읽기·만들기 일꾼 (2026-09-26)
   100MB 도면을 화면 줄기에서 읽으면 몇 초 동안 화면이 굳습니다. 그래서 따로 읽고, PDF 도 여기서 만듭니다.
   파일은 이 브라우저 안에서만 읽습니다 — 어디로도 보내지 않습니다.
   읽은 도면(model)은 여기에 그대로 두고, 화면에는 미리보기용 사본을 보냅니다. */
import { parsePlot, guessScale } from './dxfplot.js'
import { decodeBytes, sniff } from './dxf3d.js'
import { buildPdf } from './plotpdf.js'

let model = null
let fontBytes = null
const post = (m, tr) => self.postMessage(m, tr || [])

self.onmessage = async (ev) => {
  const d = ev.data || {}
  try {
    if (d.type === 'parse') {
      model = null
      const kind = sniff(d.buf)
      if (kind !== 'dxf') { post({ type: 'err', kind }); return }
      post({ type: 'prog', p: 0.02, msg: '파일 여는 중' })
      const text = decodeBytes(d.buf)
      d.buf = null
      if (!/(^|\n)\s*0\s*\r?\n\s*SECTION/.test(text.slice(0, 20000))) { post({ type: 'err', kind: 'notdxf' }); return }
      model = parsePlot(text, (p) => post({ type: 'prog', p: 0.05 + p * 0.9, msg: '선·글자 읽는 중' }))
      for (const f of model.frames) f.g = guessScale(f.x1 - f.x0, f.y1 - f.y0, model.units)
      if (!model.paths.st.length && !model.texts.length && !model.fills.l0.length) { post({ type: 'err', kind: 'empty' }); return }
      post({ type: 'model', model })
    } else if (d.type === 'pdf') {
      if (!model) { post({ type: 'err', kind: 'nomodel' }); return }
      if (!fontBytes) {
        post({ type: 'pprog', p: 0.01, msg: '글꼴 받는 중' })
        const r = await fetch('/fonts/KCMGothic.ttf')
        if (!r.ok) throw new Error('글꼴을 받지 못했습니다')
        fontBytes = new Uint8Array(await r.arrayBuffer())
      }
      const res = await buildPdf(model, d.pages, d.opt, fontBytes, (p) => post({ type: 'pprog', p, msg: 'PDF 만드는 중' }), d.title)
      post({ type: 'pdf', bytes: res.bytes, nPath: res.nPath, nText: res.nText }, [res.bytes.buffer])
    }
  } catch (e) {
    post({ type: 'err', kind: d.type === 'pdf' ? 'pdffail' : 'fail', msg: String((e && e.message) || e) })
  }
}
