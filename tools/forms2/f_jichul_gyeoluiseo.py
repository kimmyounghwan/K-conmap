# -*- coding: utf-8 -*-
"""지출결의서 · 증빙 첨부지 — 새로 만든 서식 (2026-11-13 G673 · 소장님 «회사원» 서식 묶음 셋째 — 법제처 점검 동안 법령 원문이 필요 없는 것부터)
   → 결재란(이름 고쳐 씀) · 문서번호 · 작성일 · 부서 · 작성자 · 지출 예정일 · 지급 방법 · 지급처 · 계좌 · 건명 + 지출 내역 12줄(날짜 · 계정과목 · 적요 · 거래처 · 금액 · 증빙)
     → 합계(한글 · 숫자) · 건수 · 계정과목별 합계 · 증빙 갈래 셈 · 줄마다 «3만원 넘는데 적격증빙 아님» 표시 · 둘째 장 «증빙 첨부지»(영수증 붙이는 칸 8 · 줄 정보가 저절로).
   📄 엑셀을 주지 않음(XLSX = False) · 사이트 작성 → 그림 PDF 만.

근거(국회법률정보시스템 — 법제처 점검 11-13 21:00 ~ 11-14 21:00 · 세 번 · 메모 /home/claude/g10/notes/G673_지출결의서_근거.md):
  · 법인세법 [시행 2026.7.1] 제116조② 사업자로부터 재화 · 용역을 공급받고 대가를 지급하면 신용카드 매출전표 · 현금영수증 · 세금계산서 · 계산서를 받아 보관 · 단서 = 시행령 제158조②1
    «건당 거래금액(부가가치세 포함)이 3만원 이하» 등 · 제75조의5 안 받으면 100분의 2 가산세(기업업무추진비 손금불산입분 · 단서 해당분은 빼고)
  · 소득세법 [시행 2026.7.1] 제160조의2② · 시행령 제208조의2①1(3만원 이하) · 제81조의6(100분의 2 · 소규모사업자 · 추계는 빼고)
■ 짐작 안 함: 증빙 칸은 적은 대로 — «계산서 · 카드 · 현금영수증» 이 들어 있으면 적격, 아니면(간이영수증 · 증빙 없음 · 빈칸 · 그 밖의 말) 3만원 넘을 때 표시만.
  농어민 · 원천징수 사업소득자 등 시행령의 다른 예외는 셈하지 않고 «예외가 있음» 으로만 적음."""
import datetime

import sgw as g
from fb import F, I
from sgw import FR, H, L

SLUG = "jichul-gyeoluiseo"
TITLE = "지출결의서"
WHERE = "forms"
XLSX = False          # 📄 G668 — 빈 틀 엑셀을 주지 않음(사이트 작성 → 그림 PDF 만)
# 쪽: 빈 1 결의서 · 2 첨부지 / 예시 3 · 4
PREV = [(1, "지출결의서 — 빈 서식 (결재란 · 지출 내역 12줄 · 합계 저절로)"),
        (3, "지출결의서 — 작성 예시 (현장 경비 6건 · 합계 206,300원 · 계정과목별 합계 · 3만원 넘는 간이영수증 1건 표시)"),
        (4, "증빙 첨부지 — 작성 예시 (줄마다 날짜 · 적요 · 금액 · 증빙이 저절로 · 영수증 붙이는 칸)")]
MULTI = True
SHORT = ("지출결의서 — 지출 내역(날짜 · 계정과목 · 적요 · 거래처 · 금액 · 증빙)만 적으면 합계(한글 · 숫자) · 건수 · 계정과목별 합계가 저절로 나오고, "
         "3만원 넘는 지출이 간이영수증 · 증빙 없음이면 줄마다 표시합니다(세금계산서 · 계산서 · 카드 매출전표 · 현금영수증 — 법인세법 · 소득세법). 영수증 붙이는 «증빙 첨부지» 가 함께 나옵니다.")
NOTE_REPLACE = None

D = datetime.date
DT = 'yyyy". "m". "d"."'
MD = 'm"/"d'
WON = '#,##0;[Red]-#,##0;""'
NL = 12                # 지출 내역 줄
NB = 8                 # 첨부지 붙이는 칸
W = [4.2, 6.2, 5.8, 5.8, 7.4, 7.4, 7.4, 7.6, 7.6, 11.6, 10.6, 9.6]     # 번호 · 날짜 · 계정(2) · 적요(3) · 거래처(2) · 금액 · 증빙 · 확인 = 91.2
ACC = ["복리후생비", "여비교통비", "기업업무추진비(접대비)", "통신비", "수도광열비", "세금과공과", "소모품비", "차량유지비",
       "지급수수료", "도서인쇄비", "교육훈련비", "운반비", "수선비", "외주용역비", "기타"]
EV = ["세금계산서", "계산서", "카드 매출전표", "현금영수증", "간이영수증", "증빙 없음"]
PAY = ["계좌이체", "법인카드", "개인카드(정산)", "현금", "기타"]
GOOD = ("계산서", "카드", "현금영수증")       # 이 말이 들어 있으면 적격증빙(세금계산서 · 계산서 · 신용카드 매출전표 · 현금영수증)
SEP = " · "
OKG, BADG, SMALL = "✓ 적격", "⚠ 적격증빙", "3만원 이하"     # 확인 칸 글 셋

EX = {"결재1": "담 당", "결재2": "검 토", "결재3": "승 인", "문서번호": "2026-11-07", "작성일": D(2026, 11, 13), "부서": "공무팀", "작성자": "김가나",
      "지출일": D(2026, 11, 16), "지급방법": "계좌이체", "지급처": "김가나(경비 정산)", "은행": "가나은행 · 김가나", "계좌": "000-0000-0000-00",
      "지급처번호": None, "건명": "11월 현장 경비 정산(안전용품 · 교통비 · 간식 · 주유 · 출력)", "비고": "영수증 · 전표 6매 붙임(증빙 첨부지)"}
EX_ROWS = [(D(2026, 11, 2), "소모품비", "안전장갑 · 방진마스크", "가나안전상사", 48000, "카드 매출전표"),
           (D(2026, 11, 3), "여비교통비", "현장 출장 택시", "택시", 18500, "카드 매출전표"),
           (D(2026, 11, 5), "복리후생비", "현장 간식(작업자)", "다라마트", 32000, "간이영수증"),
           (D(2026, 11, 6), "차량유지비", "현장 차량 주유", "마바주유소", 70000, "카드 매출전표"),
           (D(2026, 11, 9), "도서인쇄비", "도면 출력 A1 20매", "사아인쇄", 25000, "현금영수증"),
           (D(2026, 11, 10), "소모품비", "작업일보 용지", "자차문구", 12800, "간이영수증")]
BLANK_ROLE = {"결재1": "담 당", "결재2": "검 토", "결재3": "승 인"}


def _k(i, name):
    return f"{i} {name}"


def _good(ref):
    """적격증빙 말이 들어 있나(엑셀 식)"""
    return "OR(" + ",".join(f'ISNUMBER(SEARCH("{w}",{ref}))' for w in GOOD) + ")"


def _won(ref):
    return f'TEXT({ref},"#,##0")'


# ── ① 지출결의서 ────────────────────────────────────────────────────────
def gyeoluiseo(bk, ex):
    p = g.pg(bk, ex, "결의서", fit=1, widths=W)
    e = lambda k: EX.get(k)
    lab = dict(L, size=9.5)
    p.row([(8, "지  출  결  의  서", {"kind": "title", "rs": 2, "size": 20}), (1, "결\n재", {"kind": "label", "rs": 2}),
           (1, I("결재1", ex=e("결재1"), blank=BLANK_ROLE["결재1"], align="center", size=9), {"kind": "head"}),
           (1, I("결재2", ex=e("결재2"), blank=BLANK_ROLE["결재2"], align="center", size=9), {"kind": "head"}),
           (1, I("결재3", ex=e("결재3"), blank=BLANK_ROLE["결재3"], align="center", size=9), {"kind": "head"})], h=20)
    p.row([(1, "", {"kind": "text"}) for _ in range(3)], h=36, start=10)
    p.gap(6)
    p.row([(2, "문서번호", lab), (3, I("문서번호", ex=e("문서번호"), align="center", size=9.5)),
           (2, "작 성 일", lab), (2, I("작성일", ex=e("작성일"), fmt=DT, align="center", size=9.5)),
           (1, "부  서", lab), (2, I("부서", ex=e("부서"), align="center", size=9.5))], h=23)
    p.row([(2, "작 성 자", lab), (3, I("작성자", ex=e("작성자"), align="center", size=9.5)),
           (2, "지출 예정일", lab), (2, I("지출일", ex=e("지출일"), fmt=DT, align="center", size=9.5)),
           (1, "지급 방법", dict(L, size=8)), (2, I("지급방법", ex=e("지급방법"), dv=",".join(PAY), align="center", size=9))], h=23)
    p.row([(2, "지 급 처", lab), (3, I("지급처", ex=e("지급처"), size=9)),
           (2, "은행 · 예금주", dict(L, size=9)), (5, I("은행", ex=e("은행"), size=9))], h=23)
    p.row([(2, "계좌번호", lab), (3, I("계좌", ex=e("계좌"), align="center", size=9)),
           (2, "지급처 사업자번호", dict(L, size=8)), (5, I("지급처번호", ex=e("지급처번호"), size=9))], h=23)
    p.row([(2, "건    명", lab), (10, I("건명", ex=e("건명"), size=9.5))], h=25)
    p.row([(2, "합계 금액", lab), (6, F("합계한글", '={총액}', fmt="hangul", align="center", size=11.5, bold=True)),
           (4, F("합계숫자", '={총액}', fmt='"₩ "#,##0;[Red]"₩ "-#,##0;""', align="center", size=11.5, bold=True))], h=27)
    p.gap(6)
    p.row([(1, "번호", H), (1, "날 짜", H), (2, "계정과목", H), (3, "적요(내용)", H), (2, "거 래 처", H), (1, "금 액", H), (1, "증 빙", H), (1, "확 인", H)], h=21)
    for i in range(1, NL + 1):
        r = EX_ROWS[i - 1] if i <= len(EX_ROWS) else (None,) * 6
        amt, ev = "{" + _k(i, "금액") + "}", "{" + _k(i, "증빙") + "}"
        p.row([(1, str(i), {"kind": "ctext", "size": 8.5}),
               (1, I(_k(i, "날짜"), ex=r[0], fmt=MD, align="center", size=8.5)),
               (2, I(_k(i, "계정"), ex=r[1], dv=",".join(ACC), align="center", size=8.5)),
               (3, I(_k(i, "적요"), ex=r[2], size=8.5)),
               (2, I(_k(i, "거래처"), ex=r[3], size=8)),
               (1, I(_k(i, "금액"), ex=r[4], fmt=WON, size=8.5)),
               (1, I(_k(i, "증빙"), ex=r[5], dv=",".join(EV), align="center", size=7.5)),
               (1, F(_k(i, "확인"), f'=IF(N({amt})=0,"",IF({_good(ev)},"{OKG}",IF(N({amt})>30000,"{BADG}","{SMALL}")))', align="center", size=7.5))], h=20)
    amts = ",".join("{" + _k(i, "금액") + "}" for i in range(1, NL + 1))
    p.row([(9, "합        계", {"kind": "sum", "size": 10}),
           (1, F("총액", f'=SUM({amts})', fmt=WON, align="right", size=9.5, bold=True)),
           (2, F("건수", f'=IF(COUNT({amts})=0,"",COUNT({amts})&"건")', align="center", size=9))], h=22)
    # 계정과목별 합계 — 목록에 있는 것만 차례대로 · 목록에 없는 말은 «그 밖»
    rng_acc = "{" + _k(1, "계정") + "}:{" + _k(NL, "계정") + "}"
    rng_amt = "{" + _k(1, "금액") + "}:{" + _k(NL, "금액") + "}"
    parts = [f'IF(SUMIF({rng_acc},"{a}",{rng_amt})<>0,"{SEP}{a} "&{_won(f"SUMIF({rng_acc},\"{a}\",{rng_amt})")},"")' for a in ACC]
    listed = "+".join(f'SUMIF({rng_acc},"{a}",{rng_amt})' for a in ACC)
    parts.append(f'IF(SUM({amts})-({listed})<>0,"{SEP}그 밖 "&{_won(f"SUM({amts})-({listed})")},"")')
    p.row([(2, "계정과목별", lab), (10, F("계정별", '=MID(' + "&".join(parts) + f',{len(SEP) + 1},999)', align="left", size=8.5))], h=23)
    # 증빙 갈래 · 3만원 넘는 적격증빙 아님 — 줄마다 «확인» 칸 글을 셈(COUNTIF 는 같은 글만 · 와일드카드 없음)
    rng_ok = "{" + _k(1, "확인") + "}:{" + _k(NL, "확인") + "}"
    c1, c2, c3 = (f'COUNTIF({rng_ok},"{t}")' for t in (OKG, SMALL, BADG))
    p.row([(2, "증    빙", lab),
           (10, F("증빙요약", f'=MID(IF({c1}>0,"{SEP}적격증빙 "&{c1}&"건","")&IF({c2}>0,"{SEP}3만원 이하(간이영수증 등) "&{c2}&"건","")'
                             f'&IF({c3}>0,"{SEP}⚠ 3만원 넘는데 적격증빙 아님 "&{c3}&"건",""),{len(SEP) + 1},999)', align="left", size=8.5))], h=22)
    rows_bad = "&".join(f'IF({{{_k(i, "확인")}}}="{BADG}","{i} ","")' for i in range(1, NL + 1))
    p.row([(12, F("경고", f'=IF(COUNT({amts})=0,"",IF({c3}=0,"✓ 3만원 넘는 지출은 모두 적격증빙(세금계산서 · 계산서 · 카드 매출전표 · 현금영수증)입니다",'
                         f'"⚠ 3만원 넘는 지출 "&{c3}&"건("&SUBSTITUTE(TRIM({rows_bad})," "," · ")&"번 줄)이 적격증빙이 아닙니다 — 세금계산서 · 계산서 · 카드 매출전표 · 현금영수증을 받으세요(안 받으면 가산세 2%)"))',
                   align="left", size=8.5, bold=True), {"border": False})], h=30)
    p.row([(2, "비    고", lab), (10, I("비고", ex=e("비고"), size=9))], h=23)
    p.gap(8)
    p.row([(12, "위와 같이 지출하고자 하오니 결재하여 주시기 바랍니다.", {"kind": "cfree", "size": 11})], h=24)
    p.row([(12, F("날짜줄", '=IF(N({작성일})=0,"",{작성일})', fmt='yyyy"년" m"월" d"일";;""', align="center", size=10.5), {"border": False})], h=22)
    p.row([(6, "", FR), (2, "작 성 자", {"kind": "free", "align": "distributed", "size": 10}),
           (3, F("서명", '=IF({작성자}="","",{작성자})', align="center", size=10)), (1, "(인)", {"kind": "free", "align": "center", "size": 9.5})], h=24)
    g.note(p, "※ 건당 3만원(부가가치세 포함)이 넘는 지출은 세금계산서 · 계산서 · 신용카드 매출전표 · 현금영수증(적격증빙)을 받아 보관해야 합니다 — 안 받으면 그 금액의 2% 가산세"
              "(법인세법 제116조 · 제75조의5 · 시행령 제158조 / 소득세법 제160조의2 · 제81조의6 · 시행령 제208조의2). 농어민 · 원천징수한 사업소득자 등 예외가 있습니다. "
              "증빙 칸에 «계산서 · 카드 · 현금영수증» 이 들어 있으면 적격으로 봅니다.")
    p.end_print()
    p.after_note(["지출 내역만 적으면 합계 · 계정과목별 합계 · 증빙 확인이 저절로 바뀝니다. 결재란 이름(담당 · 검토 · 승인)은 눌러서 고칩니다."] if not ex else
                 ["이 시트는 작성 예시입니다(가상의 회사 · 사람 · 거래처)."])
    return p


# ── ② 증빙 첨부지 ───────────────────────────────────────────────────────
def cheombu(bk, ex):
    p = g.pg(bk, ex, "첨부지", fit=1)          # 붙이는 칸 둘이 같은 폭(기본 12칸)
    lab = dict(L, size=9)
    p.row([(12, "증  빙  첨  부  지", {"kind": "title", "size": 18})], h=32)
    p.row([(12, "지출결의서의 영수증 · 카드 전표 · 세금계산서를 번호 차례로 붙입니다", {"kind": "cfree", "size": 8.5})], h=15)
    p.gap(4)
    p.row([(2, "건    명", lab), (10, F("c건명", '=IF({결의서!건명}="","",{결의서!건명})', align="left", size=9))], h=22)
    p.row([(2, "작 성 자", lab), (3, F("c작성자", '=IF({결의서!작성자}="","",{결의서!작성자})', align="center", size=9)),
           (2, "작 성 일", lab), (2, F("c작성일", '=IF(N({결의서!작성일})=0,"",{결의서!작성일})', fmt=DT, align="center", size=9)),
           (1, "합  계", lab), (2, F("c합계", '={결의서!총액}', fmt=WON, align="center", size=9.5, bold=True))], h=22)
    p.gap(6)
    for row in range(NB // 2):
        cells, body = [], []
        for col in range(2):
            k = row * 2 + col + 1
            amt, dt = "{결의서!" + _k(k, "금액") + "}", "{결의서!" + _k(k, "날짜") + "}"
            txt = (f'=IF(N({amt})=0,"{k}.","{k}.  "&IF(N({dt})=0,"",MONTH({dt})&"/"&DAY({dt})&"  ")&{{결의서!{_k(k, "적요")}}}&"  "&'
                   f'{_won(amt)}&"원"&IF({{결의서!{_k(k, "증빙")}}}="","","  "&{{결의서!{_k(k, "증빙")}}}))')
            cells.append((6, F(f"붙임{k}", txt, align="left", size=8), {"kind": "text"}))
            body.append((6, "영수증 · 전표를 여기에 붙이세요", {"kind": "ctext", "size": 8.5, "ink": "9CA3AF"}))
        p.row(cells, h=20)
        p.row(body, h=138)
    g.note(p, "※ 9번 줄부터는 이 장을 한 장 더 쓰거나 뒷면에 붙입니다. 붙인 증빙 수를 지출결의서 «비고» 에 적어 두면 찾기 쉽습니다.")
    p.end_print()
    p.after_note(["붙이는 칸 위 글(날짜 · 적요 · 금액 · 증빙)은 지출결의서에서 저절로 옵니다."] if not ex else ["이 시트는 작성 예시입니다(가상)."])
    return p


def draw(bk, ex):
    bk.brand = "  K-건설맵  |  k-conmap.com  건설 서식"      # ✂ 새로 만든 서식 — «무료» 안 씀(2026-10-24 소장님)
    gyeoluiseo(bk, ex)
    cheombu(bk, ex)


# ── 파이썬으로 따로 셈 ──────────────────────────────────────────────────
def _n(v):
    return v if isinstance(v, (int, float)) and not isinstance(v, bool) else 0


def _s(v):
    return "" if v is None else str(v)


def _isgood(v):
    v = _s(v)
    return any(w in v for w in GOOD)


def expect(pages):
    a, b = {}, {}
    pg = pages["결의서"]
    amts = [pg.get(_k(i, "금액")) for i in range(1, NL + 1)]
    nums = [x for x in amts if isinstance(x, (int, float)) and not isinstance(x, bool)]
    tot = sum(nums)
    a["총액"] = tot
    a["합계한글"] = tot
    a["합계숫자"] = tot
    a["건수"] = "" if not nums else f"{len(nums)}건"
    for i in range(1, NL + 1):
        amt, ev = _n(pg.get(_k(i, "금액"))), pg.get(_k(i, "증빙"))
        a[_k(i, "확인")] = "" if amt == 0 else (OKG if _isgood(ev) else BADG if amt > 30000 else SMALL)
    # 계정과목별
    sums = {}
    for i in range(1, NL + 1):
        acc = _s(pg.get(_k(i, "계정")))
        sums[acc] = sums.get(acc, 0) + _n(pg.get(_k(i, "금액")))
    out = ""
    listed = 0
    for acc in ACC:
        v = sums.get(acc, 0)
        listed += v
        if v != 0:
            out += f"{SEP}{acc} {v:,.0f}"
    rest = tot - listed
    if rest != 0:
        out += f"{SEP}그 밖 {rest:,.0f}"
    a["계정별"] = out[len(SEP):]
    c = {OKG: 0, SMALL: 0, BADG: 0}
    bad = []
    for i in range(1, NL + 1):
        v = a[_k(i, "확인")]
        if v:
            c[v] += 1
        if v == BADG:
            bad.append(str(i))
    s = ""
    if c[OKG]:
        s += f"{SEP}적격증빙 {c[OKG]}건"
    if c[SMALL]:
        s += f"{SEP}3만원 이하(간이영수증 등) {c[SMALL]}건"
    if c[BADG]:
        s += f"{SEP}⚠ 3만원 넘는데 적격증빙 아님 {c[BADG]}건"
    a["증빙요약"] = s[len(SEP):]
    if not nums:
        a["경고"] = ""
    elif not bad:
        a["경고"] = "✓ 3만원 넘는 지출은 모두 적격증빙(세금계산서 · 계산서 · 카드 매출전표 · 현금영수증)입니다"
    else:
        a["경고"] = (f"⚠ 3만원 넘는 지출 {len(bad)}건({' · '.join(bad)}번 줄)이 적격증빙이 아닙니다 — "
                    "세금계산서 · 계산서 · 카드 매출전표 · 현금영수증을 받으세요(안 받으면 가산세 2%)")
    wd = pg.get("작성일")
    a["날짜줄"] = wd if isinstance(wd, datetime.date) else ""
    a["서명"] = _s(pg.get("작성자"))
    # 첨부지
    b["c건명"] = _s(pg.get("건명"))
    b["c작성자"] = _s(pg.get("작성자"))
    b["c작성일"] = wd if isinstance(wd, datetime.date) else ""
    b["c합계"] = tot
    for k in range(1, NB + 1):
        amt, dt = _n(pg.get(_k(k, "금액"))), pg.get(_k(k, "날짜"))
        if amt == 0:
            b[f"붙임{k}"] = f"{k}."
            continue
        ev = _s(pg.get(_k(k, "증빙")))
        b[f"붙임{k}"] = (f"{k}.  " + (f"{dt.month}/{dt.day}  " if isinstance(dt, datetime.date) else "") + _s(pg.get(_k(k, "적요"))) +
                        f"  {amt:,.0f}원" + ("" if ev == "" else f"  {ev}"))
    return {"결의서": a, "첨부지": b}
