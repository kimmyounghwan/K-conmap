# -*- coding: utf-8 -*-
"""chk.py — 건설기계 점검표(체크리스트) 공통 틀.
원본 틀(번호 · 구분 · 예시사진 · 점검기준 · 점검항목 · 결과 · 조치사항 + 위쪽 점검자 칸)을 그대로 두고,
결과를 목록(양호·불량·해당없음)에서 고르면 맨 위 «판정» 과 아래 «점검 결과» 가 저절로 셈하게 만듭니다.

■ 예시 사진은 원본 그대로 씁니다(소장님: 「설명에 필요한 사진은 그대로 쓸 것」). 사진 파일: img/{slug}/NN[_k].jpg|png
■ 쪽 나눔: 한 항목이 두 쪽에 걸치지 않게, 인쇄 배율(가로 맞춤)을 셈해 항목 사이에 쪽 나눔을 넣습니다.

모듈이 정할 것: SLUG · NAME(«덤프트럭») · NO_LABEL(«차량 번호»/«장비 번호») · RENTAL(대여하는 자 칸) · ITEMS · EX_BAD · EX_NA · EX_NO
"""
import datetime
import glob
import os

from fb import F, I, text_lines

W = [5, 11, 13, 13, 17, 30, 9, 16]
HERE = os.path.dirname(os.path.abspath(__file__))
L = {"kind": "label"}
H = {"kind": "head"}
MARG = (0.4, 0.3, 0.45, 0.45)


def _imgs(slug, n):
    fs = sorted(glob.glob(os.path.join(HERE, "img", slug, f"{n:02d}.*")) + glob.glob(os.path.join(HERE, "img", slug, f"{n:02d}_*.*")))
    out = []
    for f in fs:
        with open(f, "rb") as fh:
            out.append(fh.read())
    return out


def _scale():
    px = sum(int(w * 7 + 5) for w in W)
    avail = (595 - 72 * (MARG[0] + MARG[1])) * 96 / 72
    return min(1.0, avail / px)


def draw(m, bk, ex):
    p = bk.page(f"{m.NAME} 점검표" if not ex else "작성 예시", W, ex=ex, fit_height=0, margins=MARG)
    p.gap(4)
    rental = getattr(m, "RENTAL", False)
    p.row([(4, f"■ {m.NAME} 체크리스트", {"kind": "h2", "size": 15, "border": True}), (4, "점  검  자", H)], h=30)
    D = datetime.date(2026, 5, 13)
    p.row([(2, "점검 일자", L), (2, I("일자", ex=D, fmt="date", align="center")),
           (1, m.NO_LABEL, L), (1, I("장비번호", ex=m.EX_NO, align="center", size=9.5)),
           (1, "운 전 원", L), (1, I("운전원", ex="김운전  (인)", blank="(인)", align="right"))], h=24)
    if rental:
        p.row([(2, "대여하는 자", L), (2, I("대여자", ex="예시장비(주)  (인)", blank="(인)", align="right")),
               (1, "관리감독자", L), (1, I("관리감독자", ex="이감독  (인)", blank="(인)", align="right")),
               (1, "안전관리자", L), (1, I("안전관리자", ex="박안전  (인)", blank="(인)", align="right"))], h=24)
        p.row([(6, "", {"kind": "free"}), (1, "판    정", L), (1, F("판정", "", align="center", bold=True))], h=24)
    else:
        p.row([(2, "관리감독자", L), (2, I("관리감독자", ex="이감독  (인)", blank="(인)", align="right")),
               (1, "안전관리자", L), (1, I("안전관리자", ex="박안전  (인)", blank="(인)", align="right")),
               (1, "판    정", L), (1, F("판정", "", align="center", bold=True))], h=24)
    p.gap(6)
    hdr = p.row([(1, "번호", H), (1, "구 분", H), (2, "예 시 사 진", H), (1, "점 검 기 준", H), (1, "점 검 항 목", H),
                 (1, "결 과", H), (1, "조 치 사 항", H)], h=24)
    sc = _scale()
    cap = (842 - 72 * (MARG[2] + MARG[3]) - 10) / sc          # 한 쪽에 들어가는 높이(배율 전 pt)
    used = sum((p.ws.row_dimensions[r].height or 15) for r in range(1, p.r))
    head_h = p.ws.row_dimensions[hdr].height or 24
    from openpyxl.worksheet.pagebreak import Break
    for n, (gu, std, subs) in enumerate(m.ITEMS, 1):
        k = len(subs)
        imgs = _imgs(m.SLUG, n)
        need = [max(17, text_lines(t, W[5] * 10 / 9) * 12.5 + 5) for t in subs]
        std_need = text_lines(std, W[4] * 10 / 9) * 13 + 8
        gu_need = (gu.count("\n") + 1) * 12.5 + 8
        total = max(88 if imgs else 34, sum(need), std_need, gu_need)
        extra = (total - sum(need)) / k
        if used + total > cap:                                 # 이 항목은 다음 쪽으로
            p.ws.row_breaks.append(Break(id=p.r - 1))
            used = head_h
        used += total
        r0 = p.r
        for j, t in enumerate(subs, 1):
            cells = []
            if j == 1:
                cells = [(1, str(n), {"kind": "ctext", "rs": k}), (1, gu, {"kind": "ctext", "rs": k, "size": 9}),
                         (2, "", {"rs": k}), (1, std, {"kind": "text", "rs": k, "size": 9})]
            key = (n, j)
            rv, act = (m.EX_BAD.get(key) or m.EX_NA.get(key) or ("양호", None))
            cells += [(1, "- " + t, {"kind": "text", "size": 9}),
                      (1, I(f"결과#{n}-{j}", ex=rv, dv="양호,불량,해당없음", align="center")),
                      (1, I(f"조치#{n}-{j}", ex=act, size=8.5))]
            p.row(cells, h=need[j - 1] + extra)
        if len(imgs) == 1:
            p.place_image(imgs[0], 3, 4, r0, p.r - 1)
        elif len(imgs) >= 2:
            p.place_image(imgs[0], 3, 3, r0, p.r - 1, pad=3)
            p.place_image(imgs[1], 4, 4, r0, p.r - 1, pad=3)
    rng = f"G{hdr + 1}:G{p.r - 1}"
    p.gap(6)
    p.row([(2, "점 검 결 과", L),
           (6, F("요약", f'=IF(COUNTA({rng})=0,"","양호 "&COUNTIF({rng},"양호")&" · 불량 "&COUNTIF({rng},"불량")'
                        f'&" · 해당없음 "&COUNTIF({rng},"해당없음")&" · 빈칸 "&COUNTBLANK({rng})&"  (모두 "&ROWS({rng})&"칸)")', align="left"))], h=24)
    for i, (cell, t) in enumerate(p.formulas):
        if cell.coordinate == p.k["판정"]:
            p.formulas[i] = (cell, f'=IF(COUNTA({rng})=0,"",IF(COUNTIF({rng},"불량")>0,"사용 중지","사용 가능"))')
    p.ws.print_title_rows = f"{hdr}:{hdr}"
    p.end_print()
    p.after_note([
        "결과 칸을 누르면 목록(양호·불량·해당없음)이 나옵니다. 하나라도 «불량» 이면 맨 위 판정이 «사용 중지» 로 바뀝니다.",
        "불량은 조치사항에 무엇을 언제 고쳤는지 적고, 고친 뒤 다시 점검하세요.",
        "예시 사진은 점검 부위를 알려 주는 참고 사진입니다(원본 그대로). 발주기관·원청이 정한 점검표가 있으면 그것을 쓰세요.",
    ] + list(getattr(m, "EXTRA_NOTE", [])) if not ex else ["이 시트는 작성 예시입니다(가상의 장비·회사·이름)."])
    return p


def expect(inp):
    vals = [v for k, v in inp.items() if k.startswith("결과#")]
    good = sum(1 for v in vals if v == "양호")
    bad = sum(1 for v in vals if v == "불량")
    na = sum(1 for v in vals if v == "해당없음")
    blank = sum(1 for v in vals if not v)
    return {"판정": "사용 중지" if bad else "사용 가능",
            "요약": f"양호 {good} · 불량 {bad} · 해당없음 {na} · 빈칸 {blank}  (모두 {len(vals)}칸)"}
