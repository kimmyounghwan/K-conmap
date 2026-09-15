# -*- coding: utf-8 -*-
"""naeyeok_pdf.py — 내역서모음 안의 **PDF** 에서 단가 줄을 뽑습니다.

  쓰는 법:  python tools\\naeyeok_pdf.py
  나오는 것: <내역서모음>/_뽑은단가_pdf.json  (품명·규격·단위·단가·발주처·공고일·파일)

  ⚠️ pdfplumber 가 있어야 합니다.  pip install pdfplumber
  ⚠️ «사진으로 된» PDF(글자층이 없는 것)는 못 읽습니다. 그건 눈으로 보셔야 합니다.
     OCR 로 읽어 봤더니 숫자가 자주 틀렸습니다 — 틀린 단가는 없느니만 못해서 넣지 않습니다.
"""
import io, json, os, sys
import re, warnings, logging
warnings.filterwarnings("ignore"); logging.disable(logging.WARNING)
import pdfplumber

NUM = re.compile(r'^-?[\d,]+(?:\.\d+)?$')
SKIP_NAME = ('소계', '소 계', '합계', '합 계', '계', '총계', '총 계', '순공사원가',
             '이윤', '일반관리비', '부가가치세', '도급액', '계약금액')

def _is(t, names):  return t in names
def NAME(t):  return _is(t, ('품명','공종','명칭','품목','자재명','규격및품명','공정','품명및규격'))
def SPEC(t):  return _is(t, ('규격','형식','규격및단위'))
def UNIT(t):  return _is(t, ('단위','수량단위'))
def QTY(t):   return _is(t, ('수량','단위수량'))
def AMT(t):   return _is(t, ('금액','금 액'))
def PRICE(t): return '단가' in t and '산출' not in t and '단가표' not in t


def lines(page, tol=3.0):
    ws = page.extract_words(keep_blank_chars=False, use_text_flow=False)
    rows = {}
    for w in ws:
        rows.setdefault(round(w['top'] / tol), []).append(w)
    return [sorted(rows[k], key=lambda w: w['x0']) for k in sorted(rows)]


def merge(ln, gap=14):
    """«품 명» 처럼 사이를 벌려 놓은 머리글을 한 낱말로 붙입니다."""
    out = []
    for w in ln:
        if out and w['x0'] - out[-1]['x1'] <= gap:
            out[-1] = {'text': out[-1]['text'] + w['text'],
                       'x0': out[-1]['x0'], 'x1': w['x1']}
        else:
            out.append({'text': w['text'], 'x0': w['x0'], 'x1': w['x1']})
    return out


def scan(ln):
    """한 줄에서 머리글 낱말을 찾아 {이름: [(x0,x1)…]} 로 돌려줍니다."""
    got = {}
    for w in merge(ln):
        t = w['text'].replace(' ', '')
        for key, test in (('name', NAME), ('spec', SPEC), ('unit', UNIT),
                          ('qty', QTY), ('price', PRICE), ('amt', AMT)):
            if test(t):
                got.setdefault(key, []).append((w['x0'], w['x1']))
                break
    return got


def find_header(ls):
    """머리글을 찾습니다. 한 줄로 안 되면 다음 줄까지 합쳐 봅니다."""
    for i, ln in enumerate(ls):
        a = scan(ln)
        if 'name' in a and 'price' in a:
            return i, a
        if 'name' in a and i + 1 < len(ls):
            b = scan(ls[i + 1])
            if 'price' in b:
                out = {k: list(v) for k, v in a.items()}
                for k, v in b.items():
                    out.setdefault(k, []).extend(v)
                return i + 1, out
    return None, None


# ⚠️ 「21.제어케이블신설」 처럼 **호표 번호가 앞에 붙은 품명**이 일위대가에는 흔합니다.
#    번호로 거르면 알짜가 통째로 날아갑니다. 번호만 떼고 낱말로 거릅니다.
NUMPFX = re.compile(r'^\s*\d+\s*[.)\-]\s*')
BAD_NAME = re.compile(
    r'간접노무비|산재보험|고용보험|건강보험|연금보험|퇴직공제|환경보전|안전관리비|'
    r'기타경비|일반관리비|이\s*윤|부가가치세|산업안전|노인장기|하도급|공사손해|도급액|원가계산|'
    r'^재\s*료\s*비$|^노\s*무\s*비$|^경\s*비$|^합\s*계|^소\s*계|^총\s*계|^계$')


def parse_page(page):
    ls = lines(page)
    hi, cols = find_header(ls)
    if hi is None:
        return []
    # 칸 하나하나를 따로 둡니다. 같은 칸 안의 글자는 «붙이고», 다른 단가 칸끼리는 «더합니다».
    slots = []                      # [(종류, 가운데x, 칸번호)]
    pn = 0
    for k, spans in cols.items():
        for x0, x1 in spans:
            idx = None
            if k in ('price', 'amt'):
                idx = pn; pn += 1
            slots.append((k, (x0 + x1) / 2, idx))
    got = []
    for ln in ls[hi + 1:]:
        buck = {}
        for w in ln:
            c = (w['x0'] + w['x1']) / 2
            best, d = None, 1e9
            for sl in slots:
                if abs(sl[1] - c) < d:
                    best, d = sl, abs(sl[1] - c)
            if d > 90:
                continue
            key = (best[0], best[2])
            buck.setdefault(key, []).append(w)
        # ⚠️ 한 칸 안에 다른 칸 글자가 끌려 들어오는 일이 잦습니다(머리글 없는 «금액» 칸 등).
        #    그래서 칸마다 «붙어 있는 덩어리» 로 나누고, 칸 가운데에 가장 가까운 덩어리만 씁니다.
        cx = {(sl[0], sl[2]): sl[1] for sl in slots}
        for key, ws in list(buck.items()):
            ws = sorted(ws, key=lambda w: w['x0'])
            groups, cur = [], [ws[0]]
            for w in ws[1:]:
                if w['x0'] - cur[-1]['x1'] <= 2.5:
                    cur.append(w)
                else:
                    groups.append(cur); cur = [w]
            groups.append(cur)
            if len(groups) > 1 and key[0] in ('price', 'amt', 'qty'):
                c = cx[key]
                groups = [min(groups, key=lambda g:
                              abs((g[0]['x0'] + g[-1]['x1']) / 2 - c))]
                buck[key] = groups[0]
            else:
                buck[key] = ws
        buck = {k: [w['text'] for w in v] for k, v in buck.items()}

        nm = ' '.join(buck.get(('name', None), [])).strip()
        nm = NUMPFX.sub('', nm).strip()
        if not nm or len(nm) > 60 or BAD_NAME.search(nm):
            continue
        # 단가 칸 값을 왼쪽부터 차례로 모읍니다
        vals = []
        for (k, idx), ws in sorted((kk, vv) for kk, vv in buck.items()):
            if k != 'price':
                continue
            t = ''.join(ws).replace(',', '').strip()      # 같은 칸 안이면 붙입니다
            if NUM.match(t or 'x'):
                try:
                    vals.append(float(t))
                except ValueError:
                    pass
        if not vals:
            continue
        # ⚠️ 「재료비 노무비 경비 «계»」 꼴이면 맨 끝이 합계단가입니다 — 다 더하면 두 번 셉니다.
        #    끝 값이 앞의 것들의 합과 거의 같으면 «계» 칸으로 보고 그것만 씁니다.
        if len(vals) >= 2:
            head = sum(vals[:-1])
            tot = vals[-1] if head > 0 and abs(vals[-1] - head) <= max(1.0, 0.02 * vals[-1]) else sum(vals)
        else:
            tot = vals[0]
        if tot <= 0 or tot > 5e9:
            continue
        got.append([nm, ' '.join(buck.get(('spec', None), [])).strip()[:40],
                    ''.join(buck.get(('unit', None), [])).strip()[:10], tot])
    return got


def pull(path, maxpage=80):
    out = []
    with pdfplumber.open(path) as d:
        for p in d.pages[:maxpage]:
            try:
                out += parse_page(p)
            except Exception:
                pass
    return out


# ── 여기부터 실행부 ──────────────────────────────────────────────────
def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    box = os.path.join(os.path.dirname(root), "내역서모음")
    log = os.path.join(box, "_수집기록.json")
    if not os.path.exists(log):
        print("[멈춤] 수집기록이 없습니다: %s" % log); return 1
    rec = json.load(io.open(log, encoding="utf-8"))
    todo = [v for v in rec.values()
            if v.get("ok") and str(v.get("path", "")).lower().endswith(".pdf")]
    print("PDF %d개를 봅니다." % len(todo))
    rows, hit = [], 0
    for i, v in enumerate(todo, 1):
        p = os.path.join(box, v["path"].replace("\\", os.sep))
        if not os.path.exists(p):
            continue
        try:
            got = pull(p)
        except Exception as e:
            print("  [%3d/%d] %-44s 못 읽음 %s"
                  % (i, len(todo), os.path.basename(p)[:44], type(e).__name__))
            continue
        if got:
            hit += 1
        print("  [%3d/%d] %-44s %d줄" % (i, len(todo), os.path.basename(p)[:44], len(got)))
        for g in got:
            rows.append(g + [v.get("inst", ""), v.get("dt", ""), v["path"], v.get("name", "")])
    # 글자가 없는 «사진 PDF» 는 따로 목록으로 남깁니다 — 눈으로 보셔야 하는 것들입니다.
    shots = []
    for v in todo:
        p2 = os.path.join(box, v["path"].replace("\\", os.sep))
        if not os.path.exists(p2):
            continue
        try:
            import pdfplumber as _pp
            with _pp.open(p2) as d:
                pages = len(d.pages)
                txt = "".join((pg.extract_text() or "") for pg in d.pages[:3])
        except Exception:
            continue
        if len(txt) < 50:
            shots.append({"path": v["path"], "name": v.get("name"), "inst": v.get("inst"),
                          "dt": v.get("dt"), "pages": pages})
    json.dump(shots, io.open(os.path.join(box, "_사진PDF.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    print("사진으로 된 PDF %d개 — _사진PDF.json 에 목록을 남겼습니다." % len(shots))

    out = os.path.join(box, "_뽑은단가_pdf.json")
    json.dump(rows, io.open(out, "w", encoding="utf-8"), ensure_ascii=False)
    print()
    print("PDF %d개 중 %d개에서 단가 %d줄. → %s" % (len(todo), hit, len(rows), out))
    return 0


if __name__ == "__main__":
    sys.exit(main())
