# -*- coding: utf-8 -*-
"""거래명세서(거래명세표) — 새로 만든 서식 (2026-11-13 G671 · 소장님 «회사원» 서식 묶음 — 법제처 점검(11-13 21시 ~ 11-14 21시) 동안 법령 원문이 필요 없는 것부터)
   → 공급받는자 · 공급자 · 품목 줄(월일 · 품목 · 규격 · 단위 · 수량 · 단가)만 적으면 공급가액 · 세액(부가세 별도 · 포함 · 면세) · 합계금액(한글 · 숫자) ·
     전 잔금 · 받은 돈 · 남은 돈(미수)이 저절로 · 한 번 쓰면 «공급받는자 보관용» · «공급자 보관용» 두 장.
   📄 엑셀을 주지 않음(XLSX = False — 소장님 11-13 「빈엑셀 주면 다운 받아서 사용하면 땡 이잖아」) · 사이트 작성 → 그림 PDF 만.

근거: 법정 별지 서식이 아님 — 건설맵이 새로 짠 꼴(판매 사이트 서식은 보지도 베끼지도 않음 — 서식 확장 계획 «원칙» 3).
  · 부가가치세법 제30조(세율) «부가가치세의 세율은 10퍼센트로 한다.» — 국회법률정보시스템 현행 [시행 2026.1.2] 세 번(글 · 화면 · 글) · 메모 /home/claude/g10/notes/G671_거래명세서_근거.md
■ 끝수는 법 조문이 아니라 이 서식이 정한 셈(화면에 밝힘): 별도 = 세액 줄마다 공급가액 × 10% 원 미만 버림 · 포함 = 공급가액 = 줄 합계 ÷ 1.1 반올림, 세액 = 줄 합계 − 공급가액 · 면세 = 세액 0."""
import datetime

import sgw as g
from fb import F, I
from sgw import FR, H, L, S

SLUG = "georae-myeongseseo"
TITLE = "거래명세서(거래명세표)"
WHERE = "forms"
XLSX = False          # 📄 G668 — 빈 틀 엑셀을 주지 않음(사이트 작성 → 그림 PDF 만)
# 쪽: 빈 1 공급받는자 보관용 · 2 공급자 보관용 / 예시 3 · 4
PREV = [(1, "거래명세서 — 빈 서식 (공급받는자 보관용)"),
        (3, "거래명세서 — 작성 예시 (가상의 건재상 → 건설사 · 품목 5줄 · 부가세 별도 · 남은 돈 저절로)"),
        (4, "공급자 보관용 — 한 번 쓰면 똑같이 한 장 더 (작성 예시)")]
MULTI = True
SHORT = ("거래명세서(거래명세표) — 공급받는자 · 공급자와 품목 · 규격 · 수량 · 단가만 적으면 공급가액 · 세액(부가세 10% 별도 · 포함 · 면세) · "
         "합계금액(한글 · 숫자)과 전 잔금 · 받은 돈 · 남은 돈(미수)이 저절로 셈해지고, 공급받는자 보관용 · 공급자 보관용 두 장이 함께 나옵니다.")
NOTE_REPLACE = None

D = datetime.date
DT = 'yyyy". "m". "d"."'
MD = 'm"/"d'
N = 15                 # 품목 줄
TAX = ["별도(공급가액 × 10%)", "포함(단가에 부가세 포함)", "면세(세액 없음)"]
BYEOL, POHAM, MYEON = TAX

# ── 작성 예시(가상의 회사 · 사람 · 번호) ─────────────────────────────
EX_BUYER = {"받는상호": "예시건설(주)", "받는등록번호": "000-00-00000", "받는대표": "홍길동", "받는주소": "가나시 다라구 마바로 45",
            "받는전화": "000-0000-0000", "받는담당": "김가나 대리"}
EX_SELLER = {"공급등록번호": "000-00-00001", "공급상호": "가나건재", "공급성명": "이다라", "공급주소": "가나시 사아구 자차로 12",
             "업태": "도소매", "종목": "건축자재", "공급전화": "000-0000-0001"}
EX_ROWS = [(D(2026, 11, 3), "레미콘", "25-24-150", "㎥", 6, 88000),
           (D(2026, 11, 3), "철근", "SD400 HD13", "톤", 1.2, 950000),
           (D(2026, 11, 5), "시멘트", "40 kg", "포", 50, 6500),
           (D(2026, 11, 5), "모래", "25 kg", "포", 40, 3800),
           (D(2026, 11, 7), "PE관", "φ50", "m", 30, 4200)]
EX_ETC = {"번호": "2026-1107", "작성일": D(2026, 11, 7), "세방식": BYEOL, "전잔금": 1000000, "입금": 1500000, "인수자": "김가나"}


def _k(i, nm):
    return f"{i}줄 {nm}"


def _v(cp, key, ex=None, fmt=None, align=None, size=None, dv=None, bold=False, date=False, blank=None):
    """첫 장은 쓰는 칸(I) · 공급자 보관용은 첫 장을 그대로 비춤(F)"""
    if not cp:
        return I(key, ex=ex, fmt=fmt, align=align, size=size, dv=dv, bold=bold, blank=blank)
    ref = f"{{명세서!{key}}}"
    f = f'=IF(N({ref})=0,"",{ref})' if date else f'=IF({ref}="","",{ref})'
    return F(key, f, fmt=fmt, align=align, size=size, bold=bold)


def _c(cp, key, f, fmt=None, align=None, size=None, bold=False):
    """셈 칸 — 공급자 보관용은 첫 장 셈 값을 비춤"""
    if cp:
        ref = f"{{명세서!{key}}}"
        f = f'=IF({ref}="","",{ref})'
    return F(key, f, fmt=fmt, align=align, size=size, bold=bold)


def sheet(bk, ex, cp=False):
    lg = "공급자용" if cp else "명세서"
    p = g.pg(bk, ex, lg, fit=1)
    lab = {"kind": "label", "size": 8.5}
    p.row([(12, "거  래  명  세  서", {"kind": "title", "size": 20})], h=36)
    p.row([(12, "(공급자 보관용)" if cp else "(공급받는자 보관용)", {"kind": "cfree", "size": 9.5})], h=16)
    p.gap(4)
    e = lambda d, k: (d[k] if ex else None)
    p.row([(2, "일련번호", lab), (3, _v(cp, "번호", ex=e(EX_ETC, "번호"), align="center", size=9)),
           (2, "작성일자", lab), (5, _v(cp, "작성일", ex=e(EX_ETC, "작성일"), fmt=DT, align="center", size=9.5, date=True))], h=24)
    p.gap(4)
    vb = {"kind": "label", "size": 9.5}
    rows = [("상    호", "받는상호", "등록번호", "공급등록번호"),
            ("등록번호", "받는등록번호", "상호(법인명)", "공급상호"),
            ("대 표 자", "받는대표", "성명(대표자)", "공급성명"),
            ("주    소", "받는주소", "사업장 주소", "공급주소"),
            ("전화번호", "받는전화", "업    태", "업태"),
            ("담 당 자", "받는담당", "종    목", "종목"),
            (None, None, "전화번호", "공급전화")]
    for j, (la, ka, lb, kb) in enumerate(rows):
        cells = []
        if j == 0:
            cells.append((1, "공\n급\n받\n는\n자", dict(vb, rs=len(rows))))
        if la:
            cells += [(1, la, dict(lab, size=7.5)), (3, _v(cp, ka, ex=e(EX_BUYER, ka), align="left", size=8.5))]
        else:
            cells += [(4, "아래와 같이 계산합니다.", {"kind": "ctext", "size": 8.5})]
        if j == 0:
            cells.append((1, "공\n\n급\n\n자", dict(vb, rs=len(rows))))
        cells += [(2, lb, dict(lab, size=8)), (4, _v(cp, kb, ex=e(EX_SELLER, kb), align="left", size=8.5))]
        p.row(cells, h=22)
    p.gap(4)
    p.row([(2, "합계금액\n(공급가액 + 세액)", dict(lab, size=8)),
           (6, _c(cp, "합계한글", "=IF({합계}=\"\",\"\",{합계})", fmt="hangul", align="left", size=10.5, bold=True)),
           (4, _c(cp, "합계숫자", "=IF({합계}=\"\",\"\",{합계})", fmt='"₩ "#,##0;;""', align="right", size=11, bold=True))], h=28)
    p.row([(2, "부 가 세", lab), (4, _v(cp, "세방식", ex=e(EX_ETC, "세방식"), dv=",".join(TAX), align="center", size=8.5, blank=None)),
           (6, "별도 = 공급가액의 10%(원 미만 버림) · 포함 = 단가에 부가세가 들어 있음 · 면세 = 세액 없음", {"kind": "text", "size": 7})], h=24)
    hd = dict(H, size=8.5)
    p.row([(1, "월 · 일", hd), (3, "품    목", hd), (1, "규 격", hd), (1, "단 위", hd), (1, "수 량", hd), (1, "단 가", hd),
           (2, "공 급 가 액", hd), (1, "세 액", hd), (1, "비 고", hd)], h=22)
    for i in range(1, N + 1):
        r = EX_ROWS[i - 1] if (ex and i <= len(EX_ROWS)) else (None,) * 6
        qty, price = f"{{{_k(i, '수량')}}}", f"{{{_k(i, '단가')}}}"
        줄합 = f"ROUND({qty}*{price},0)"
        공 = (f'=IF(OR(N({qty})=0,N({price})=0),"",IF({{세방식}}="{POHAM}",ROUND({줄합}/1.1,0),{줄합}))')
        세 = (f'=IF({{{_k(i, "공급가액")}}}="","",IF({{세방식}}="{POHAM}",{줄합}-{{{_k(i, "공급가액")}}},'
              f'IF({{세방식}}="{MYEON}",0,ROUNDDOWN({{{_k(i, "공급가액")}}}*10/100,0))))')
        p.row([(1, _v(cp, _k(i, "월일"), ex=r[0], fmt=MD, align="center", size=8.5, date=True)),
               (3, _v(cp, _k(i, "품목"), ex=r[1], align="left", size=8.5)),
               (1, _v(cp, _k(i, "규격"), ex=r[2], align="center", size=7.5)),
               (1, _v(cp, _k(i, "단위"), ex=r[3], align="center", size=8.5)),
               (1, _v(cp, _k(i, "수량"), ex=r[4], fmt='#,##0.###;;""', align="right", size=8.5)),
               (1, _v(cp, _k(i, "단가"), ex=r[5], fmt='#,##0;;""', align="right", size=8.5)),
               (2, _c(cp, _k(i, "공급가액"), 공, fmt='#,##0;;""', align="right", size=8.5)),
               (1, _c(cp, _k(i, "세액"), 세, fmt='#,##0;;""', align="right", size=8)),
               (1, _v(cp, _k(i, "비고"), align="left", size=7.5))], h=19)
    합 = lambda nm: "{" + "},{".join(_k(i, nm) for i in range(1, N + 1)) + "}"
    p.row([(8, "계", S), (2, _c(cp, "공급가액합", f'=IF(COUNT({합("공급가액")})=0,"",SUM({합("공급가액")}))', fmt='#,##0;;""', align="right", size=9, bold=True)),
           (1, _c(cp, "세액합", f'=IF(COUNT({합("세액")})=0,"",SUM({합("세액")}))', fmt='#,##0;;""', align="right", size=8.5, bold=True)),
           (1, "", S)], h=22)
    # 합계(숨은 셈 — 위 «합계금액» 줄이 부름) — 공급가액 + 세액
    p.row([(2, "공급가액 + 세액", dict(lab, size=8)),
           (4, _c(cp, "합계", '=IF({공급가액합}="","",{공급가액합}+N({세액합}))', fmt='#,##0"원";;""', align="right", size=9.5, bold=True)),
           (2, "전 잔 금", lab), (4, _v(cp, "전잔금", ex=e(EX_ETC, "전잔금"), fmt='#,##0"원";;""', align="right", size=9.5))], h=22)
    p.row([(2, "받 은 돈", lab), (4, _v(cp, "입금", ex=e(EX_ETC, "입금"), fmt='#,##0"원";;""', align="right", size=9.5)),
           (2, "남은 돈(미수)", dict(lab, size=8)),
           (4, _c(cp, "잔금", '=IF(AND({합계}="",N({전잔금})=0,N({입금})=0),"",N({합계})+N({전잔금})-N({입금}))', fmt='#,##0"원";[Red]-#,##0"원";"0원"',
                  align="right", size=10, bold=True))], h=24)
    p.gap(6)
    p.row([(6, "", FR), (2, "인 수 자", {"kind": "free", "align": "distributed", "size": 9.5}),
           (3, _v(cp, "인수자", ex=e(EX_ETC, "인수자"), align="center", size=9.5)), (1, "(인)", {"kind": "free", "align": "center", "size": 9})], h=24)
    g.note(p, "※ 세액은 줄마다 공급가액의 10%(부가가치세법 제30조 세율 10% · 원 미만 버림)입니다. «포함» 은 단가에 부가세가 들어 있는 값으로 보고 "
              "공급가액 = 줄 합계 ÷ 1.1(반올림) · 세액 = 줄 합계 − 공급가액으로 나눕니다. 남은 돈 = 전 잔금 + 이번 합계 − 받은 돈.")
    p.end_print()
    p.after_note((["첫 장(공급받는자 보관용)만 쓰면 이 장은 똑같이 채워집니다."] if cp else
                  ["품목 · 수량 · 단가를 적으면 공급가액 · 세액 · 합계 · 남은 돈이 저절로 셈해집니다. 쓴 내용은 이 기기에 남아 다음 거래에 이어 씁니다."])
                 if not ex else ["이 시트는 작성 예시입니다(가상의 건재상 · 건설사 · 사람 · 번호)."])
    return p


def draw(bk, ex):
    bk.brand = "  K-건설맵  |  k-conmap.com  건설 서식"      # ✂ 새로 만든 서식 — «무료» 안 씀(2026-10-24 소장님)
    sheet(bk, ex, cp=False)
    sheet(bk, ex, cp=True)


# ── 파이썬으로 따로 셈 ──────────────────────────────────────────────────
def _n(v):
    return v if isinstance(v, (int, float)) and not isinstance(v, bool) else 0


def _xround(x, d=0):
    """엑셀 ROUND — 0 에서 먼 쪽 반올림"""
    from decimal import Decimal, ROUND_HALF_UP
    q = Decimal(1).scaleb(-d)
    return float(Decimal(repr(x)).quantize(q, rounding=ROUND_HALF_UP)) if x >= 0 else -float(Decimal(repr(-x)).quantize(q, rounding=ROUND_HALF_UP))


def _rdown(x):
    import math
    return math.floor(x + 1e-9) if x >= 0 else -math.floor(-x + 1e-9)


def expect(pages):
    sm = pages["명세서"]
    a = {}
    mode = sm.get("세방식")
    gs, ts = [], []
    for i in range(1, N + 1):
        q, pr = _n(sm.get(_k(i, "수량"))), _n(sm.get(_k(i, "단가")))
        if q == 0 or pr == 0:
            a[_k(i, "공급가액")] = a[_k(i, "세액")] = ""
            continue
        tot = _xround(q * pr)
        gv = _xround(tot / 1.1) if mode == POHAM else tot
        tv = (tot - gv) if mode == POHAM else (0 if mode == MYEON else _rdown(gv * 10 / 100))
        a[_k(i, "공급가액")], a[_k(i, "세액")] = gv, tv
        gs.append(gv)
        ts.append(tv)
    a["공급가액합"] = "" if not gs else sum(gs)
    a["세액합"] = "" if not ts else sum(ts)
    a["합계"] = "" if a["공급가액합"] == "" else a["공급가액합"] + _n(a["세액합"])
    a["합계한글"] = a["합계숫자"] = a["합계"]
    jj, ip = _n(sm.get("전잔금")), _n(sm.get("입금"))
    a["잔금"] = "" if (a["합계"] == "" and jj == 0 and ip == 0) else _n(a["합계"]) + jj - ip
    # 공급자 보관용 = 첫 장 비춤
    b = {}
    for k, v in sm.items():
        b[k] = "" if v is None else v
    for k, v in a.items():
        b[k] = v
    return {"명세서": a, "공급자용": b}
