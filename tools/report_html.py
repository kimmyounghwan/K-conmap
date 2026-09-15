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
    co, su, rk, bo = d["업체"], d["요약"], d["등수"], d["바로투찰이었다면"]
    hb = d.get("습관요약") or {}
    hb2 = d.get("습관") or {}
    dqa = d.get("실격해부")
    nxt = d.get("다음자리") or []
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

    A('<h2 class="hi">투찰 습관 — 겨냥과 손</h2>')
    if hb2:
        A('<p>개찰 <b>%d건</b>에서 «내 금액이 낙찰하한선보다 몇 %%p 위였나»를 재고, '
          '같은 자리에서 «1순위 금액은 몇 %%p 위였나»와 견줬습니다.</p>' % hb2["잰개찰"])
        A('<table class="chart cmp2">')
        A('<tr><th>내가 겨눈 자리</th><td class="v2"><b>%+.3f%%p</b></td>'
          '<td class="d">하한선 위 (가운데값)</td></tr>' % hb2["내자리중앙"])
        if hb2.get("낙찰선중앙") is not None:
            A('<tr><th>실제 낙찰선</th><td class="v2"><b>%+.3f%%p</b></td>'
              '<td class="d">1순위가 있던 자리 (가운데값)</td></tr>' % hb2["낙찰선중앙"])
        A('<tr><th>손 떨림</th><td class="v2"><b>±%.3f%%p</b></td>'
          '<td class="d">회마다 얼마나 흩어지나 (%+0.3f ~ %+0.3f)</td></tr>'
          % (hb2["흔들림"], hb2["최저"], hb2["최고"]))
        A('</table>')
        gap = hb2.get("어긋남")
        if gap is not None and abs(gap) <= hb2["흔들림"] / 2:
            A('<p class="verdict"><b>겨냥은 맞습니다. 문제는 손입니다.</b> '
              '겨눈 자리와 실제 낙찰선의 차이는 <b>%+.3f%%p</b>로 사실상 같습니다. '
              '그런데 회마다 <b>±%.3f%%p</b>씩 흩어집니다 — 낙찰선이 하한 위 %+.3f%%p에 있는데 '
              '흔들림이 그보다 <b>%.0f배</b> 큽니다. 그래서 어떤 날은 1순위고, '
              '어떤 날은 하한선 아래로 떨어집니다.</p>'
              % (gap, hb2["흔들림"], hb2["낙찰선중앙"],
                 (hb2["흔들림"] / max(abs(hb2["낙찰선중앙"]), 0.001))))
        elif gap is not None and gap > 0:
            A('<p class="verdict">겨눈 자리가 낙찰선보다 <b>%+.3f%%p 높습니다.</b> '
              '그만큼 늘 한 발 위에서 쏘고 있다는 뜻입니다.</p>' % gap)
        elif gap is not None:
            A('<p class="verdict">겨눈 자리가 낙찰선보다 <b>%+.3f%%p 낮습니다.</b> '
              '이기면 크지만 하한선 아래로 떨어지는 날이 늘어납니다.</p>' % gap)
    A('</div>')

    # ── 분위 ────────────────────────────────────────────
    #  ⚠️ 여기서 «낙찰자가 앉았던 분위에 넣으라» 고 쓰면 안 됩니다.
    #     그 자리는 개찰이 끝난 뒤에야 알 수 있습니다 (생존 편향 · CLAUDE.md 8-9).
    #     사전에 고를 수 있는 것은 «실격을 얼마나 각오할 것인가» 하나뿐입니다.
    qt = d.get("분위")
    if qt:
        A('<div class="page">')
        A('<h2 class="hi">어느 «분위»에 걸고 있나</h2>')
        A('<p>분위는 <b>그 금액이 실격을 면할 확률</b>입니다. 40분위에 걸었다는 말은 '
          '«열 번 중 여섯 번은 하한선 아래로 떨어질 자리»에 냈다는 뜻입니다. '
          '금액을 낮출수록 분위가 내려갑니다. 개찰 <b>%d건</b>을 되짚었습니다.</p>'
          % qt["잰개찰"])
        A('<table class="chart cmp2">')
        A('<tr><th>귀사가 거는 자리</th><td class="v2"><b>%.0f분위</b></td>'
          '<td class="d">가운데값 (%.0f ~ %.0f 사이에서 움직입니다)</td></tr>'
          % (qt["중앙"], qt["최저"], qt["최고"]))
        if qt.get("바로투찰중앙") is not None:
            A('<tr><th>바로투찰 금액</th><td class="v2"><b>%.0f분위</b></td>'
              '<td class="d">같은 개찰에서 K-건설맵이 권한 금액</td></tr>'
              % qt["바로투찰중앙"])
        if qt.get("낙찰자중앙") is not None:
            A('<tr><th>그날 1순위</th><td class="v2"><b>%.0f분위</b></td>'
              '<td class="d">개찰이 끝난 «뒤에» 보이는 자리입니다</td></tr>'
              % qt["낙찰자중앙"])
        A('<tr><th>실격</th><td class="v2"><b>%d건 · %.0f%%</b></td>'
          '<td class="d">%.0f분위면 셈으로는 %.0f%% 입니다</td></tr>'
          % (qt["실격"], qt["실제실격률"], qt["중앙"], qt["모형실격률"]))
        A('</table>')

        if qt["칸별"]:
            A('<p class="lead">분위 칸마다 무슨 일이 있었나</p>')
            A('<table class="tbl2 wide"><tr><th>건 자리</th><th>투찰</th><th>실격</th>'
              '<th>낙찰</th><th>평균등수</th></tr>')
            for r in qt["칸별"]:
                A('<tr><td>%s</td><td>%d</td><td>%s</td><td>%s</td><td>%s</td></tr>'
                  % (r["칸"], r["투찰"],
                     ('<b class="q-bad">%d</b>' % r["실격"]) if r["실격"] else "0",
                     ('<b class="q-good">%d</b>' % r["낙찰"]) if r["낙찰"] else "0",
                     r["평균등수"]))
            A('</table>')
            low = [r for r in qt["칸별"] if r["칸"] in ("30분위 미만", "30~50분위")]
            lo_n = sum(r["투찰"] for r in low)
            lo_w = sum(r["낙찰"] for r in low)
            lo_d = sum(r["실격"] for r in low)
            if lo_n >= 3:
                A('<p class="verdict">50분위 아래로 <b>%d건</b>을 넣어 '
                  '<b class="q-bad">%d건이 실격</b>되고 <b>%d건 낙찰</b>했습니다. '
                  '낮게 쓴 만큼 더 딴 것이 아니라, 낮게 쓴 만큼 <b>버린 것</b>입니다.</p>'
                  % (lo_n, lo_d, lo_w))

        A('<p class="note">3년치 개찰 8,406건을 분위별로 갈라 본 결과입니다 — '
          '<b>분위를 어떻게 잡아도 1순위율은 3.5~4.4%에서 움직이지 않습니다.</b> '
          '움직이는 것은 실격률뿐입니다(14% → 84%). '
          '금액을 낮추는 것은 «딸 확률»을 사는 것이 아니라 «실격»을 사는 것입니다.</p>')
        A('<p class="note">⚠️ 그렇다고 «1순위가 앉았던 분위에 넣으십시오»라는 말은 '
          '아닙니다. 그 자리는 개찰이 끝난 뒤에야 보입니다. '
          '넣기 전에 고를 수 있는 것은 <b>실격을 얼마나 각오할 것인가</b> 하나뿐입니다. '
          '승부를 가르는 것은 금액이 아니라 <b>어느 공고에 넣느냐</b>입니다 — '
          '참가 2~9곳이면 1순위율 18.2%, 100곳이 넘으면 1.6%입니다.</p>')
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

    # ── 놓친 자리 ─────────────────────────────────────────
    miss = d.get("놓친자리") or []
    if miss:
        A('<h2 class="hi">놓친 자리 다섯</h2>')
        A('<p>1순위와 금액 차이가 가장 작았던 자리입니다. '
          '<b>«남은 여유»</b>는 하한선까지 더 낮출 수 있었던 금액입니다 — '
          '이보다 차이가 작으면 <b>그만큼만 낮췄어도 1순위</b>였습니다.</p>')
        A('<table class="rows miss"><thead><tr><th>개찰</th><th>공고</th><th>참가</th>'
          '<th>내 등수</th><th>1순위와 차이</th><th>남은 여유</th></tr></thead><tbody>')
        for m in miss:
            able = m.get("enough") and m.get("room") is not None and m["room"] >= m["gap"]
            A('<tr><td class="dt">%s</td><td class="nm">%s<span class="in">%s</span></td>'
              '<td class="r">%s</td><td class="r my">%d위</td>'
              '<td class="r gap">%s%s</td><td class="r %s">%s</td></tr>'
              % (str(m["dt"])[5:10], fn(m["name"]), fi(m["inst"]), format(m["n"], ","),
                 m["rank"], format(m["gap"], ","),
                 (" <span class=pp>(%.3f%%p)</span>" % m["gap_pp"]) if m.get("gap_pp") else "",
                 "ok" if able else "",
                 (format(m["room"], ",") + ("원 ✔" if able else "원")) if m.get("room") is not None else "—"))
        A('</tbody></table>')
        top = miss[0]
        if top.get("enough") and top.get("room", 0) >= top["gap"]:
            A('<p class="lead">가장 아까운 자리는 <b>%s</b>입니다. '
              '<b>%s원</b>만 낮췄으면 %s곳 가운데 1순위였고, '
              '하한선까지는 아직 <b>%s원</b>이 남아 있었습니다.</p>'
              % (fn(top["name"]), format(top["gap"], ","), format(top["n"], ","),
                 format(top["room"], ",")))

    # ── 금액대별 ─────────────────────────────────────────
    band = d.get("금액대") or []
    if band:
        A('<h2>금액대별 성적</h2>')
        A('<table class="tbl2 wide"><tr><th>공사 규모</th><th>투찰</th><th>낙찰</th><th>평균 등수</th></tr>')
        for b_ in band:
            A('<tr><td>%s</td><td>%d건</td><td>%d건</td><td>%s위</td></tr>'
              % (b_["칸"], b_["투찰"], b_["낙찰"], b_["평균등수"]))
        A('</table>')
    A('</div>')

    # ── 실격 해부 ─────────────────────────────────────────
    A('<div class="page">')
    if dqa:
        A('<h2 class="hi">하한선 아래 %d건 — 왜 떨어졌나</h2>' % dqa["건"])
        A('<p>등수에서 진 게 아닙니다. <b>심사에 올라가지도 못한</b> 자리입니다. '
          '개찰 %d건 가운데 <b>%d건</b>, 넣은 금액을 다 합치면 <b>%s</b>어치입니다.</p>'
          % (dqa["전체"], dqa["건"], won(dqa["버린돈"])))
        A('<table class="chart cmp2">')
        A('<tr><th>모자란 정도</th><td class="v2"><b>%.3f%%p</b></td>'
          '<td class="d">가운데값 · 가장 큰 것은 %.3f%%p</td></tr>'
          % (dqa["모자란pp중앙"], dqa["모자란pp최대"]))
        if dqa["기관쏠림"]:
            top = dqa["기관쏠림"][0]
            A('<tr><th>가장 잦은 곳</th><td class="v2"><b>%d건</b></td>'
              '<td class="d">%s</td></tr>' % (top[1], fi(top[0])))
        A('</table>')
        if dqa["기관쏠림"] and dqa["기관쏠림"][0][1] >= 2:
            A('<p class="verdict">실격 %d건 가운데 <b>%d건이 «%s» 한 곳</b>에서 나왔습니다. '
              '그 기관의 하한율이나 A값을 잘못 보고 계신 게 아닌지 확인해 보십시오 — '
              '우연이라기엔 한쪽으로 너무 쏠렸습니다.</p>'
              % (dqa["건"], dqa["기관쏠림"][0][1], fi(dqa["기관쏠림"][0][0])))
        A('<table class="rows"><thead><tr><th>개찰</th><th>공고</th><th>참가</th>'
          '<th>낸 금액</th><th>하한선</th><th>모자란 액</th></tr></thead><tbody>')
        for m in dqa["목록"]:
            A('<tr class="dq"><td class="dt">%s</td><td class="nm">%s<span class="in">%s</span></td>'
              '<td class="r">%s</td><td class="r">%s</td><td class="r">%s</td>'
              '<td class="r gap">%s원%s</td></tr>'
              % (str(m["dt"])[5:10], fn(m["name"]), fi(m["inst"]), format(m["n"], ","),
                 won(m["amt"]), won(m.get("limit")), format(m.get("short") or 0, ","),
                 (" <span class=pp>(%.3f%%p)</span>" % m["short_pp"]) if m.get("short_pp") else ""))
        A('</tbody></table>')
        small = [m for m in dqa["목록"] if (m.get("short") or 0) < 100000]
        if small:
            m = min(small, key=lambda z: z["short"])
            A('<p class="lead">이 중 <b>%s</b>는 <b>%s원</b> 모자라 떨어졌습니다. '
              '%s짜리 공사에서 말입니다.</p>'
              % (fn(m["name"]), format(m["short"], ","), won(m["amt"])))
    A('</div>')

    # ── 기관별 낙찰선 ──────────────────────────────────────
    A('<div class="page">')
    ib = d.get("기관낙찰선") or []
    if ib:
        A('<h2>이 기관들은 «얼마»에서 갈렸나</h2>')
        A('<p>1순위 금액이 낙찰하한선보다 몇 %p 위였는지를 기관마다 모은 것입니다. '
          '<b>다음에 그 기관에 넣을 때 겨눌 자리</b>입니다.</p>')
        A('<table class="tbl2 wide"><tr><th>발주기관</th><th>건</th><th>최저</th>'
          '<th>가운데</th><th>최고</th></tr>')
        for x in ib:
            A('<tr><td>%s</td><td>%d</td><td>%+.3f%%p</td><td><b>%+.3f%%p</b></td>'
              '<td>%+.3f%%p</td></tr>'
              % (fi(x["기관"]), x["건"], x["최저"], x["중앙"], x["최고"]))
        A('</table>')
        A('<p class="note">건수가 적은 기관은 참고만 하십시오 — 한두 건으로는 «그 기관의 버릇»이라 말하기 어렵습니다.</p>')

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

    # ── 다음에 넣을 자리 ───────────────────────────────────
    if nxt:
        A('<div class="page">')
        A('<h2 class="hi">다음에 넣을 자리 다섯</h2>')
        A('<p>지금 <b>마감 전</b>인 공고 가운데, 그동안 넣으셨던 기관·지역·금액대에 맞는 것을 '
          '골랐습니다. 금액은 <b>K-건설맵 권장 투찰금액</b>입니다 — 그대로 쓰시라는 게 아니라 '
          '<b>겨냥할 자리</b>로 보십시오.</p>')
        A('<table class="rows next"><thead><tr><th>마감</th><th>공고</th>'
          '<th>기초금액</th><th>권장 투찰금액</th><th>투찰률</th></tr></thead><tbody>')
        for x in nxt:
            A('<tr><td class="dt">%s<span class="in">%s</span></td>'
              '<td class="nm">%s<span class="in">%s%s</span></td>'
              '<td class="r">%s</td><td class="r bo big">%s</td>'
              '<td class="r">%.3f%%</td></tr>'
              % (str(x["close"])[5:10], str(x["close"])[11:16],
                 fn(x["name"]), fi(x["inst"]),
                 (' · <b>늘 넣으시던 곳</b>' if (x.get("같은기관") or 0) >= 2
                  else (' · 전에 한 번 넣으신 곳' if x.get("같은기관")
                        else ' · 같은 지역')),
                 won(x["base"]), format(x["권장금액"], ","), x["권장투찰률"]))
        A('</tbody></table>')
        A('<p class="note">낙찰하한율·A값은 공고서에 실린 값을 그대로 썼습니다. '
          '권장금액은 사정률 가운데값을 기준으로 잡은 것이라 그날 예정가격에 따라 달라집니다. '
          '마감 시각을 꼭 확인하십시오 — 이 종이를 받으신 뒤에 마감된 자리가 있을 수 있습니다.</p>')
        A('</div>')

    # ── 개찰 하나하나 ───────────────────────────────────────
    A('<div class="page">')
    A('<h2>개찰 하나하나</h2>')
    A('<table class="rows"><thead><tr><th>개찰</th><th>공고</th><th>참가</th>'
      '<th>내 금액</th><th>내 등수</th><th>바로투찰</th></tr></thead><tbody>')
    A("".join(rows))
    A('</tbody></table>')
    A('<div class="foot">'
      '<div class="big">이 성적표는 <b>K-건설맵</b>이 만들어 <b>무료로</b> 드린 것입니다. '
      '<b>k-conmap.com</b> 에서 우리 회사 것도 받아 보십시오 — 회원가입 없습니다.</div>'
      '조달청이 공개한 개찰 결과를 정리한 것입니다. 따로 캐낸 자료가 아니며, 낙찰을 보장하지 않습니다.<br>'
      '개찰 기록 · 권장 투찰금액 · 건설 서식 · 설계변경 엑셀 · 캐드 유틸은 모두 무료이고, '
      '<b>내역서·견적서 작성만 유료</b>입니다 (k-conmap.com/naeyeok).<br>'
      '만든 날 %s · 사정률 중앙값 %s 기준'
      '</div>' % (d["기준"]["만든날"], d["기준"]["사정률중앙값"]))
    A('</div>')
    return "\n".join(H)


CSS = """
@page { size: A4; margin: 14mm 13mm; }
* { box-sizing: border-box; }
body { margin:0; font-family:'Noto Sans CJK KR','Noto Sans KR',sans-serif;
       color:%(INK)s; font-size:10.5pt; line-height:1.55; }
.page { page-break-after: always; position: relative; padding-bottom: 15px; }
/* 📣 쪽마다 사이트 이름을 답니다 — 이 종이는 사무실을 돌아다닙니다.
   받은 사람이 아니라 «옆에서 본 사람» 이 찾아오게 하는 것이 목적입니다. */
.page::after { content: "K-건설맵  ·  k-conmap.com  —  공공입찰 개찰 기록 · 권장 투찰금액 · 건설 서식 · 내역서 작성";
  position: absolute; bottom: 0; left: 0; right: 0;
  font-size: 7.5pt; color: %(DIM)s; border-top: 1px solid %(LINE)s; padding-top: 4px; }
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
.tbl2.wide { width:100%%; }
.rows .gap { font-weight:700; }
.rows .pp { font-weight:400; color:%(DIM)s; font-size:7.5pt; }
.rows .ok { color:%(BLUE)s; font-weight:700; }
.rows .big { font-size:10pt; }
.cmp2 th { width:118px; color:%(INK)s; font-weight:700; }
.cmp2 .v2 { width:96px; text-align:right; font-size:13pt; padding-right:12px; }
.cmp2 .d { color:%(DIM)s; font-size:9pt; }
.q-bad { color:%(RUST)s; }
.q-good { color:%(BLUE)s; }
.verdict { background:#eff4ff; border-left:3px solid %(BLUE)s; padding:9px 11px;
           font-size:10.5pt; line-height:1.6; margin-top:10px; }
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
.foot { margin-top:18px; padding-top:9px; border-top:1.5px solid %(BLUE)s;
        font-size:8pt; color:%(DIM)s; line-height:1.6; }
.foot .big { font-size:10pt; color:%(INK)s; margin-bottom:5px; line-height:1.55; }
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
