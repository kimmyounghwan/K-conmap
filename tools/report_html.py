# -*- coding: utf-8 -*-
"""성적표 JSON → 인쇄용 HTML (A4). 견본이면 업체명·공고명을 가립니다."""
import argparse, io, json, statistics as S, re

BLUE, RUST, INK, DIM, LINE = "#1a56db", "#c2410c", "#1a1d24", "#6b7280", "#e5e7eb"


def won(n):
    if n is None: return "—"
    n = int(n)
    if n >= 10**8: return "%.2f억원" % (n / 10**8)
    if n >= 10**4: return "%s만원" % format(round(n / 10**4), ",")
    return format(n, ",") + "원"


def mask_name(s):
    return "○○건설 주식회사"


def mask_notice(s):
    """앞머리 한 낱말만 남기고 가립니다 — 낱말 가운데를 자르면 읽기 사납습니다."""
    t = str(s or "").split()
    if not t:
        return s
    head = t[0][:12]
    if len(head) <= 4 and len(t) > 1:
        head = head + " " + t[1][:10]
    return head + " ○○○ 공사"


def mask_inst(s):
    s = str(s or "")
    m = re.match(r"^(\S+?(?:도|시|특별시|광역시|자치도))\s", s + " ")
    return (m.group(1) + " ○○") if m else (s.split()[0] if s else "")


def n0(x):
    """13.0 → 13 · 12.5 → 12.5"""
    return int(x) if float(x) == int(x) else x


def track(rank, color, mx=30):
    """등수는 «자리»다 — 막대가 아니라 눈금 위의 점으로 찍습니다.
       막대로 그리면 «길수록 좋다» 로 잘못 읽힙니다(등수는 작을수록 좋습니다)."""
    pos = max(0.0, min(100.0, (float(rank) - 1) / (mx - 1) * 100))
    return ('<span class="track"><span class="dot" style="left:%.1f%%;background:%s"></span></span>'
            % (pos, color))


def bar(pct, color, h=9):
    pct = max(0.0, min(100.0, pct))
    return ('<span class="bar"><span style="width:%.1f%%;background:%s;height:%dpx"></span></span>'
            % (pct, color, h))


def build(d, mock=True):
    f = (lambda s: mask_name(s)) if mock else (lambda s: s)
    fn = mask_notice if mock else (lambda s: s)
    fi = (lambda s: s)      # 발주기관은 가리지 않습니다 — 완전 공개 정보입니다
    co, su, rk, hb, bo = d["업체"], d["요약"], d["등수"], d["습관"], d["바로투찰이었다면"]
    R = d["기록"]
    bb = [r for r in R if r.get("baro")]
    cmp_ = [r for r in bb if not r["baro"]["dq"] and r["baro"]["rank_lo"]]
    better = sum(1 for r in cmp_ if r["baro"]["rank_lo"] < r["rank"])
    worse = sum(1 for r in cmp_ if r["baro"]["rank_lo"] > r["rank"])
    name = f(co["이름"])
    bno = co["사업자번호"]
    bno_s = ("%s-**-*****" % bno[:3]) if mock else "%s-%s-%s" % (bno[:3], bno[3:5], bno[5:])
    d0, d1 = su["기간"][0][:10], su["기간"][1][:10]

    dist = rk["분포"]
    lab = {"1": "1순위", "5": "2~5위", "10": "6~10위", "30": "11위 밖"}
    tot = sum(dist.values()) or 1

    rows = []
    for r in sorted(R, key=lambda x: str(x["dt"]), reverse=True):
        b = r.get("baro")
        btxt = "—"
        if b:
            btxt = "실격" if b["dq"] else ("1순위" if b["beat"]
                                        else ("%d위권" % b["rank_lo"] if b["rank_lo"] else "—"))
        myt = "실격" if r.get("my_dq") else "%d위" % r["rank"]
        cls = "win" if r["rank"] == 1 else ("dq" if r.get("my_dq") else "")
        rows.append(
            '<tr class="%s"><td class="dt">%s</td><td class="nm">%s<span class="in">%s</span></td>'
            '<td class="r">%s</td><td class="r">%s</td><td class="r my">%s</td>'
            '<td class="r bo">%s</td></tr>'
            % (cls, str(r["dt"])[5:10], fn(r["name"]), fi(r["inst"]),
               format(r["n"], ","), won(r["amt"]), myt, btxt))

    H = []
    A = H.append
    A('<div class="page">')
    A('<div class="brand">K-건설맵 <span>k-conmap.com</span></div>')
    A('<h1>입찰 성적표</h1>')
    A('<div class="to"><b>%s</b> 귀중 <span>사업자등록번호 %s</span></div>' % (name, bno_s))
    A('<div class="per">%s ~ %s 개찰 <b>%d건</b> 기준</div>' % (d0, d1, su["투찰"]))
    if mock:
        A('<div class="mockbar">견본입니다 — <b>숫자는 모두 실제 조달청 자료</b>이고, '
          '업체 이름과 공고명만 가렸습니다.</div>')

    A('<div class="tiles">')
    for k, v, s in (("투찰", "%d건" % su["투찰"], "평균 %s곳과 경쟁" % su["평균참가"]),
                    ("낙찰", "%d건" % su["낙찰"], "낙찰률 %s%%" % su["낙찰률"]),
                    ("등수 중앙", "%s위" % rk["중앙"], "평균 %s위" % rk["평균"]),
                    ("하한 미달", "%d건" % hb["실격"], "금액을 너무 낮게 씀")):
        A('<div class="t"><span class="k">%s</span><b>%s</b><span class="s">%s</span></div>' % (k, v, s))
    A('</div>')
    solo = [r for r in R if (r["n"] or 0) <= 1 and r["rank"] == 1]
    if solo:
        A('<p class="note" style="margin-top:7px">낙찰 %d건 가운데 <b>%d건</b>은 '
          '참가가 1곳뿐인 개찰이었습니다 — 경쟁이 있던 자리와 나눠 보셔야 합니다.</p>'
          % (su["낙찰"], len(solo)))

    A('<h2>등수는 어디에 몰려 있나</h2>')
    A('<table class="chart">')
    for k in ("1", "5", "10", "30"):
        n = dist.get(k, 0)
        A('<tr><th>%s</th><td>%s</td><td class="v">%d건</td></tr>'
          % (lab[k], bar(n / tot * 100, BLUE), n))
    A('</table>')
    A('<p class="note">참가업체가 %s곳까지 붙은 자리도 있었습니다. '
      '등수는 «낮은 금액 순 30곳» 안에서 매긴 것이고, 30위 밖은 «11위 밖»에 함께 넣었습니다.</p>'
      % format(max(r["n"] for r in R), ","))

    A('<h2>금액을 어떻게 쓰고 있나</h2>')
    A('<p>낙찰하한선과 내 금액의 거리를 잰 개찰이 <b>%d건</b>입니다. '
      '중앙값은 하한선보다 <b>%+.3f%%p</b>, 평균은 <b>%+.3f%%p</b>였습니다.</p>'
      % (hb["잰개찰"], hb["낙찰선위중앙pp"], hb["낙찰선위평균pp"]))
    A('<p class="warn">⚠ 그 중 <b>%d건은 하한선 아래</b>였습니다. '
      '아무리 낮게 써도 하한선 밑은 심사에서 떨어집니다 — 등수가 아니라 '
      '<b>자격</b>에서 걸린 자리입니다.</p>' % hb["실격"])
    A('</div>')

    # ── 2장 ─────────────────────────────────────────────
    A('<div class="page">')
    A('<h2 class="hi">바로투찰 금액이었다면</h2>')
    A('<p>그날 K-건설맵이 권한 금액을 그대로 냈다면 어땠을지, '
      '<b>개찰이 끝난 뒤 확정된 예정가격</b>으로 다시 세어 본 것입니다. '
      '기초금액·A값이 없는 개찰은 셈에서 뺐습니다(%d건 중 %d건을 쟀습니다).</p>'
      % (su["투찰"], bo["잰개찰"]))

    my_m = n0(S.median([r["rank"] for r in cmp_]))
    bo_m = n0(S.median([r["baro"]["rank_lo"] for r in cmp_]))
    A('<table class="chart cmp">')
    A('<tr><th>내가 낸 금액</th><td>%s</td><td class="v"><b>%s위</b></td></tr>'
      % (track(my_m, RUST), my_m))
    A('<tr><th>바로투찰 금액</th><td>%s</td><td class="v"><b>%s위</b></td></tr>'
      % (track(bo_m, BLUE), bo_m))
    A('<tr class="axis"><th></th><td><span class="ax"><i>1위</i><i>10위</i><i>20위</i><i>30위</i></span></td><td></td></tr>')
    A('</table>')
    A('<p class="note">등수 중앙값입니다. <b>왼쪽일수록 앞선 자리</b>입니다.</p>')
    A('<p class="lead">등수를 견줄 수 있는 <b>%d건</b> 가운데 '
      '<b>%d건에서 바로투찰 금액이 앞섰고</b>, 내 금액이 앞선 것은 %d건이었습니다.</p>'
      % (len(cmp_), better, worse))
    A('<table class="tbl2">')
    A('<tr><th>잰 %d건 안에서</th><th>내 금액</th><th>바로투찰</th></tr>' % bo["잰개찰"])
    A('<tr><td>1순위</td><td>%d건</td><td>%d건</td></tr>'
      % (sum(1 for r in bb if r["rank"] == 1), bo["1순위"]))
    A('<tr><td>하한 미달(실격)</td><td>%d건</td><td>%d건</td></tr>'
      % (sum(1 for r in bb if r.get("my_dq")), bo["실격"]))
    A('</table>')
    A('<p class="note">⚠ «몇 위»는 조달청이 준 순위 사다리로 좁힌 <b>최소 등수</b>입니다 — '
      '실제로는 그보다 뒤일 수 있습니다. 또 내가 금액을 바꿨다고 남들 금액까지 '
      '바뀌지는 않는다는 가정 위에서 센 값입니다.</p>')

    A('<h2>어느 기관에 많이 냈나</h2>')
    many = [(i, n) for i, n in d["기관"] if n >= 2][:6]
    ones = [i for i, n in d["기관"] if n < 2]
    if many:
        mx = max(n for _, n in many) or 1
        A('<table class="chart">')
        for inst, n in many:
            A('<tr><th class="w">%s</th><td>%s</td><td class="v">%d건</td></tr>'
              % (fi(inst), bar(n / mx * 100, BLUE), n))
        A('</table>')
    if ones:
        A('<p class="note">한 건씩 낸 곳 %d곳 — %s</p>'
          % (len(ones), " · ".join(fi(x) for x in ones[:8])))
    A('</div>')

    # ── 3장 ─────────────────────────────────────────────
    A('<div class="page">')
    A('<h2>개찰 하나하나</h2>')
    A('<table class="rows"><thead><tr><th>개찰</th><th>공고</th><th>참가</th>'
      '<th>내 금액</th><th>내 등수</th><th>바로투찰</th></tr></thead><tbody>')
    A("".join(rows))
    A('</tbody></table>')
    A('<div class="foot">'
      '이 성적표는 <b>조달청이 공개한 개찰 결과</b>를 정리한 것입니다. '
      '따로 캐낸 자료가 아니며, 낙찰을 보장하지 않습니다.<br>'
      '만든 날 %s · 사정률 중앙값 %s 기준 · K-건설맵 k-conmap.com'
      '</div>' % (d["기준"]["만든날"], d["기준"]["사정률중앙값"]))
    A('</div>')
    return "\n".join(H)


CSS = """
@page { size: A4; margin: 14mm 13mm; }
* { box-sizing: border-box; }
body { margin:0; font-family:'Noto Sans CJK KR','Noto Sans KR',sans-serif;
       color:%(INK)s; font-size:10.5pt; line-height:1.55; }
.page { page-break-after: always; }
.page:last-child { page-break-after: auto; }
.brand { font-size:9pt; font-weight:800; color:%(BLUE)s; letter-spacing:-.2px; }
.brand span { color:%(DIM)s; font-weight:600; margin-left:5px; }
h1 { font-size:21pt; margin:4px 0 10px; letter-spacing:-.6px; }
h2 { font-size:12.5pt; margin:20px 0 8px; padding-bottom:5px;
     border-bottom:1.5px solid %(INK)s; letter-spacing:-.3px; }
h2.hi { color:%(BLUE)s; border-color:%(BLUE)s; }
.to { font-size:12pt; } .to b { font-size:13pt; }
.to span { color:%(DIM)s; font-size:9.5pt; margin-left:8px; }
.per { color:%(DIM)s; font-size:9.5pt; margin-top:2px; }
.mockbar { margin:10px 0 0; padding:7px 10px; background:#fff7ed;
           border-left:3px solid %(RUST)s; font-size:9.5pt; }
.tiles { display:flex; gap:8px; margin:16px 0 0; }
.tiles .t { flex:1; border:1px solid %(LINE)s; border-radius:7px; padding:9px 10px; }
.tiles .k { display:block; font-size:8.5pt; color:%(DIM)s; }
.tiles b { display:block; font-size:17pt; letter-spacing:-.5px; margin:1px 0; }
.tiles .s { display:block; font-size:8pt; color:%(DIM)s; }
table { width:100%%; border-collapse:collapse; }
.chart th { width:74px; text-align:left; font-weight:600; font-size:9.5pt;
            color:%(DIM)s; padding:3px 8px 3px 0; white-space:nowrap; }
.chart th.w { width:150px; white-space:normal; }
.chart td { padding:3px 0; }
.chart .v { width:80px; text-align:right; font-size:9.5pt; color:%(DIM)s; padding-left:8px; }
.chart .v b { color:%(INK)s; font-size:11pt; }
.bar { display:block; background:#f1f3f7; border-radius:4px; overflow:hidden; }
.bar > span { display:block; border-radius:4px; }
.cmp th { width:104px; color:%(INK)s; font-weight:700; }
.chart .v { }
.track { display:block; position:relative; height:16px;
         background:linear-gradient(to bottom,transparent 7px,#e9edf4 7px,#e9edf4 9px,transparent 9px); }
.track .dot { position:absolute; top:3px; width:10px; height:10px; margin-left:-5px;
              border-radius:50%%; box-shadow:0 0 0 2px #fff; }
.ax { display:block; position:relative; height:12px; }
.ax i { position:absolute; font-size:7.5pt; color:%(DIM)s; font-style:normal; }
.ax i:nth-child(1){left:0} .ax i:nth-child(2){left:31%%}
.ax i:nth-child(3){left:65%%} .ax i:nth-child(4){right:0}
.lead { font-size:11.5pt; margin:12px 0 0; }
.tbl2 { width:auto; margin-top:10px; font-size:10pt; }
.tbl2 th, .tbl2 td { border:1px solid %(LINE)s; padding:4px 14px; text-align:right; }
.tbl2 tr td:first-child, .tbl2 tr th:first-child { text-align:left; color:%(DIM)s; }
p { margin:8px 0; }
.note { font-size:8.5pt; color:%(DIM)s; line-height:1.5; }
.warn { background:#fef2f2; border-left:3px solid %(RUST)s; padding:7px 10px; font-size:10pt; }
.rows { font-size:8.5pt; margin-top:4px; }
.rows th { background:#f7f8fa; border-bottom:1.5px solid %(INK)s;
           padding:5px 4px; text-align:left; font-size:8.5pt; }
.rows td { border-bottom:1px solid %(LINE)s; padding:4px; vertical-align:top; }
.rows .dt { white-space:nowrap; color:%(DIM)s; }
.rows .nm { max-width:230px; }
.rows .in { display:block; color:%(DIM)s; font-size:7.5pt; }
.rows .r { text-align:right; white-space:nowrap; }
.rows .my { font-weight:700; }
.rows .bo { color:%(BLUE)s; font-weight:700; }
.rows tr.win .my { color:%(BLUE)s; }
.rows tr.dq .my { color:%(RUST)s; }
.foot { margin-top:18px; padding-top:9px; border-top:1px solid %(LINE)s;
        font-size:8pt; color:%(DIM)s; line-height:1.6; }
""" % dict(INK=INK, DIM=DIM, LINE=LINE, BLUE=BLUE, RUST=RUST)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--in", dest="src", default="data.json")
    ap.add_argument("--out", default="report.html")
    ap.add_argument("--real", action="store_true", help="가리지 않고 진짜 이름으로")
    a = ap.parse_args()
    d = json.load(io.open(a.src, encoding="utf-8"))
    html = ("<!doctype html><html lang=ko><head><meta charset=utf-8>"
            "<title>입찰 성적표</title><style>%s</style></head><body>%s</body></html>"
            % (CSS, build(d, mock=not a.real)))
    io.open(a.out, "w", encoding="utf-8").write(html)
    print("썼습니다:", a.out, len(html), "자")
