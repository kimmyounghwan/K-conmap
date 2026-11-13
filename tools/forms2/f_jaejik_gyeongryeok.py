# -*- coding: utf-8 -*-
"""재직증명서 · 경력증명서 — 새로 만든 서식 (2026-11-13 G674 · 소장님 «회사원» 서식 묶음 넷째 — 법제처 점검 동안 법령 원문이 필요 없는 것부터)
   → 첫 장(재직증명서)에 사람 · 회사 · 입사일만 적으면 재직 기간(○년 ○개월 ○일)이 저절로, 둘째 장(경력증명서)은 사람 · 회사를 이어받고
     근무 줄 5(시작 · 끝 · 부서 · 직위 · 담당 업무 — 첫 줄은 첫 장 값이 기본)마다 기간 · 총 기간 · «근무하고 있음 / 근무하였음» 문장이 저절로.
   📄 엑셀을 주지 않음(XLSX = False) · 사이트 작성 → 그림 PDF 만.

근거(국회법률정보시스템 — 법제처 점검 11-13 21:00 ~ 11-14 21:00 · 세 번 · 메모 /home/claude/g10/notes/G674_증명서_사직서_임금명세서_근거.md):
  · 근로기준법 [시행 2026.10.8] 제39조(사용증명서) ① 퇴직한 후라도 사용 기간 · 업무 종류 · 지위와 임금 · 그 밖에 필요한 사항에 관한 증명서를 청구하면
    사실대로 적은 증명서를 즉시 내주어야 · ② 근로자가 요구한 사항만 적어야 · 제116조②2 위반 500만원 이하 과태료
  · 시행령 [시행 2025.10.23] 제19조 계속하여 30일 이상 근무한 근로자 · 퇴직 후 3년 이내
■ 기간 셈: 시작일부터 끝날(그날 포함)까지 — 끝날 다음 날까지 꽉 찬 달 수와 남은 날 수(29 ~ 31일 시작은 민법 제160조 — 그 달 말일에 한 달이 끝남) · 끝날이 비면 «현재»(발급일 · 비면 오늘).
■ 짐작 안 함: 주민등록번호 칸은 두지 않음(생년월일만 — 근로자가 요구한 사항만 · 개인정보) · 임금 칸은 두지 않음(요구하면 «그 밖에 적을 것» 칸에)."""
import datetime

import sgw as g
from fb import F, I
from sgw import FR, L

SLUG = "jaejik-gyeongryeok"
TITLE = "재직증명서 · 경력증명서"
WHERE = "forms"
XLSX = False          # 📄 G668 — 빈 틀 엑셀을 주지 않음(사이트 작성 → 그림 PDF 만)
# 쪽: 빈 1 재직 · 2 경력 / 예시 3 · 4
PREV = [(1, "재직증명서 — 빈 서식 (입사일만 적으면 재직 기간 저절로)"),
        (3, "재직증명서 — 작성 예시 (가상의 회사 · 사람 · 재직 3년 8개월 12일)"),
        (4, "경력증명서 — 작성 예시 (근무 줄 둘 · 줄마다 기간 · 총 기간 · «근무하고 있음»)")]
MULTI = True
SHORT = ("재직증명서 · 경력증명서(근로기준법 제39조 사용증명서) — 사람 · 회사 · 입사일만 적으면 재직 기간(○년 ○개월 ○일)이 저절로 나오고, "
         "경력증명서는 근무 줄마다 기간 · 총 기간 · «근무하고 있음 / 근무하였음» 문장이 채워집니다. 근로자가 요구한 사항만 적습니다.")
NOTE_REPLACE = None

D = datetime.date
DT = 'yyyy". "m". "d"."'
NR = 5                 # 경력 줄
USE = ["금융기관 제출용", "관공서 제출용", "입찰 · 실적 제출용", "학교 · 보육시설 제출용", "이직 · 취업용", "기타"]

EX = {"발급번호": "제2026-031호", "성명": "김가나", "생년월일": D(1990, 5, 12), "주소": "가나시 다라구 마바로 45", "상호": "예시건설(주)",
      "사업자번호": "000-00-00000", "부서": "공무팀", "직위": "대리", "업무": "공사 서류 작성 · 공정 관리", "입사일": D(2023, 3, 2),
      "용도": "금융기관 제출용", "제출처": "가나은행", "발급일": D(2026, 11, 13), "회사주소": "가나시 사아구 자차로 12", "대표자": "홍길동",
      "전화": "000-0000-0000", "그밖": None,
      "발급번호2": "제2026-032호", "퇴사일": None, "퇴직사유": None}
EX_ROWS = [(D(2023, 3, 2), D(2024, 12, 31), "공무팀", "사원", "공사 서류 작성"),
           (D(2025, 1, 1), None, "공무팀", "대리", "공사 서류 작성 · 공정 관리")]


def _ymdf(ref):
    return f'YEAR({ref})&". "&MONTH({ref})&". "&DAY({ref})&"."'


def _dur(s, e):
    """s 부터 e(그날 포함)까지 «○년 ○개월 ○일» — 엑셀 식. k개월을 마친 다음 날 = EDATE(s,k)(그 달에 같은 날이 없으면 말일에 끝나 다음 날 — 민법 제160조 · G672 와 같음)"""
    E = f"({e}+1)"
    m0 = f"((YEAR({E})-YEAR({s}))*12+MONTH({E})-MONTH({s}))"
    A = lambda k: f"(EDATE({s},{k})+IF(DAY(EDATE({s},{k}))<DAY({s}),1,0))"
    m = f"({m0}-IF({A(m0)}>{E},1,0))"
    d = f"({E}-{A(m)})"
    return f'TRIM(IF(INT({m}/12)>0,INT({m}/12)&"년 ","")&IF(MOD({m},12)>0,MOD({m},12)&"개월 ","")&IF({d}>0,{d}&"일",""))'


def _base_day():
    return 'IF(N({발급일})=0,TODAY(),{발급일})'


# ── ① 재직증명서 ────────────────────────────────────────────────────────
def jaejik(bk, ex):
    p = g.pg(bk, ex, "재직", fit=1)
    e = lambda k: EX.get(k)
    lab = dict(L, size=10)
    p.row([(4, I("발급번호", ex=e("발급번호"), blank="제        호", align="left", size=9), {"border": False}), (8, "", FR)], h=18)
    p.gap(10)
    p.row([(12, "재  직  증  명  서", {"kind": "title", "size": 24})], h=52)
    p.gap(14)
    g.sec(p, "인 적 사 항", need=26 * 3 + 10)
    p.row([(2, "성    명", lab), (4, I("성명", ex=e("성명"), align="center", size=11)),
           (2, "생년월일", lab), (4, I("생년월일", ex=e("생년월일"), fmt=DT, align="center", size=11))], h=28)
    p.row([(2, "주    소", lab), (10, I("주소", ex=e("주소"), size=10))], h=28)
    p.gap(8)
    g.sec(p, "재 직 사 항", need=28 * 5 + 10)
    p.row([(2, "회 사 명", lab), (4, I("상호", ex=e("상호"), align="center", size=11)),
           (2, "사업자번호", dict(L, size=9.5)), (4, I("사업자번호", ex=e("사업자번호"), align="center", size=10.5))], h=28)
    p.row([(2, "부    서", lab), (4, I("부서", ex=e("부서"), align="center", size=11)),
           (2, "직    위", lab), (4, I("직위", ex=e("직위"), align="center", size=11))], h=28)
    p.row([(2, "담당 업무", lab), (10, I("업무", ex=e("업무"), size=10.5))], h=28)
    p.row([(2, "입 사 일", lab), (4, I("입사일", ex=e("입사일"), fmt=DT, align="center", size=11)),
           (2, "재직 기간", lab),
           (4, F("재직기간", f'=IF(N({{입사일}})=0,"",IF({_base_day()}<{{입사일}},"⚠ 발급일이 입사일보다 앞섬","현재까지 "&{_dur("{입사일}", _base_day())}))',
                 align="center", size=10))], h=28)
    p.row([(2, "용    도", lab), (4, I("용도", ex=e("용도"), dv=",".join(USE), align="center", size=10.5)),
           (2, "제 출 처", lab), (4, I("제출처", ex=e("제출처"), align="center", size=10.5))], h=28)
    p.row([(2, "그 밖에\n적을 것", dict(L, size=9)), (10, I("그밖", ex=e("그밖"), size=10))], h=30)
    p.gap(26)
    p.row([(12, "위 사람은 위와 같이 본 회사에 재직하고 있음을 증명합니다.", {"kind": "cfree", "size": 13})], h=30)
    p.gap(18)
    p.date_line("발급일", ex=e("발급일"), h=28)
    p.gap(18)
    sig = {"kind": "free", "align": "distributed", "size": 11}
    p.row([(3, "", FR), (2, "회 사 명", sig), (6, F("회사명줄", '=IF({상호}="","",{상호})', align="center", size=11.5, bold=True), {"border": False}), (1, "", FR)], h=26)
    p.row([(3, "", FR), (2, "주    소", sig), (6, I("회사주소", ex=e("회사주소"), align="center", size=10), {"border": False}), (1, "", FR)], h=26)
    p.row([(3, "", FR), (2, "전    화", sig), (6, I("전화", ex=e("전화"), align="center", size=10), {"border": False}), (1, "", FR)], h=26)
    p.row([(3, "", FR), (2, "대 표 자", sig), (6, I("대표자", ex=e("대표자"), align="center", size=12, bold=True), {"border": False}),
           (1, "(인)", {"kind": "free", "align": "center", "size": 11})], h=30)
    p.gap(16)
    g.note(p, "※ 근로자가 청구하면 사실대로 적어 바로 내줍니다(근로기준법 제39조① — 퇴직한 뒤에도). 근로자가 요구한 사항만 적습니다(같은 조②). "
              "계속하여 30일 이상 근무한 근로자가 퇴직 후 3년 안에 청구할 수 있습니다(시행령 제19조). 주민등록번호 대신 생년월일만 적었습니다.")
    p.end_print()
    p.after_note(["입사일과 발급일(비우면 오늘)을 적으면 재직 기간이 저절로 나옵니다. 둘째 장(경력증명서)은 이 장의 사람 · 회사를 이어받습니다."] if not ex else
                 ["이 시트는 작성 예시입니다(가상의 회사 · 사람)."])
    return p


# ── ② 경력증명서 ────────────────────────────────────────────────────────
def gyeongryeok(bk, ex):
    p = g.pg(bk, ex, "경력", fit=1)
    e = lambda k: EX.get(k)
    lab = dict(L, size=10)
    mir = lambda key, src, fmt=None, size=11: F(key, f'=IF(N({{재직!{src}}})=0,IF({{재직!{src}}}="","",{{재직!{src}}}),{{재직!{src}}})' if fmt else
                                                f'=IF({{재직!{src}}}="","",{{재직!{src}}})', fmt=fmt, align="center", size=size)
    p.row([(4, I("발급번호2", ex=e("발급번호2"), blank="제        호", align="left", size=9), {"border": False}), (8, "", FR)], h=18)
    p.gap(10)
    p.row([(12, "경  력  증  명  서", {"kind": "title", "size": 24})], h=52)
    p.gap(14)
    g.sec(p, "인 적 사 항", need=26 * 3 + 10)
    p.row([(2, "성    명", lab), (4, mir("k성명", "성명")),
           (2, "생년월일", lab), (4, F("k생년월일", '=IF(N({재직!생년월일})=0,"",{재직!생년월일})', fmt=DT, align="center", size=11))], h=28)
    p.row([(2, "주    소", lab), (10, F("k주소", '=IF({재직!주소}="","",{재직!주소})', align="left", size=10))], h=28)
    p.gap(8)
    g.sec(p, "경 력 사 항", need=24 * (NR + 2) + 10)
    hd = dict(L, size=9.5)
    p.row([(2, "시 작 일", hd), (2, "끝 날", hd), (2, "부    서", hd), (2, "직    위", hd), (2, "담당 업무", hd), (2, "기    간", hd)], h=24)
    base = 'IF(N({발급일2})=0,TODAY(),{발급일2})'
    for i in range(1, NR + 1):
        r = EX_ROWS[i - 1] if i <= len(EX_ROWS) else (None,) * 5
        bl = (lambda f: f) if i == 1 else (lambda f: None)
        s, en = "{" + f"{i} 시작" + "}", "{" + f"{i} 끝" + "}"
        p.row([(2, I(f"{i} 시작", ex=r[0], blank=bl('=IF(N({재직!입사일})=0,"",{재직!입사일})'), fmt=DT, align="center", size=9.5)),
               (2, I(f"{i} 끝", ex=r[1], fmt=DT, align="center", size=9.5)),
               (2, I(f"{i} 부서", ex=r[2], blank=bl('=IF({재직!부서}="","",{재직!부서})'), align="center", size=9.5)),
               (2, I(f"{i} 직위", ex=r[3], blank=bl('=IF({재직!직위}="","",{재직!직위})'), align="center", size=9.5)),
               (2, I(f"{i} 업무", ex=r[4], blank=bl('=IF({재직!업무}="","",{재직!업무})'), size=8.5)),
               (2, F(f"{i} 기간", f'=IF(N({s})=0,"",IF(N({en})=0,IF({base}<{s},"⚠ 시작이 발급일 뒤","현재까지 "&{_dur(s, base)}),'
                                 f'IF({en}<{s},"⚠ 끝이 시작보다 앞섬",{_dur(s, en)})))', align="center", size=8.5))], h=26)
    p.row([(2, "퇴 사 일", lab), (2, I("퇴사일", ex=e("퇴사일"), fmt=DT, align="center", size=10)),
           (2, "총 기간", lab),
           (6, F("총기간", f'=IF(N({{1 시작}})=0,"",IF(N({{퇴사일}})=0,IF({base}<{{1 시작}},"","현재까지 "&{_dur("{1 시작}", base)}),'
                         f'IF({{퇴사일}}<{{1 시작}},"⚠ 퇴사일이 시작보다 앞섬",{_ymdf("{1 시작}")}&" ~ "&{_ymdf("{퇴사일}")}&" · "&{_dur("{1 시작}", "{퇴사일}")})))',
                 align="center", size=10, bold=True))], h=28)
    p.row([(2, "퇴직 사유", lab), (10, I("퇴직사유", ex=e("퇴직사유"), size=10))], h=28)
    p.row([(2, "회 사 명", lab), (4, mir("k상호", "상호")), (2, "용    도", lab), (4, F("k용도", '=IF({재직!용도}="","",{재직!용도})', align="center", size=10.5))], h=28)
    p.gap(22)
    p.row([(12, F("k문장", '=IF(N({퇴사일})=0,"위 사람은 위와 같이 본 회사에 근무하고 있음을 증명합니다.","위 사람은 위와 같이 본 회사에 근무하였음을 증명합니다.")',
                  align="center", size=13), {"border": False})], h=30)
    p.gap(14)
    p.row([(12, I("발급일2", ex=None, blank='=IF(N({재직!발급일})=0,"",{재직!발급일})', fmt="date", align="center", size=11), {"border": False})], h=28)
    p.gap(14)
    sig = {"kind": "free", "align": "distributed", "size": 11}
    p.row([(3, "", FR), (2, "회 사 명", sig), (6, F("k회사명줄", '=IF({재직!상호}="","",{재직!상호})', align="center", size=11.5, bold=True), {"border": False}), (1, "", FR)], h=26)
    p.row([(3, "", FR), (2, "주    소", sig), (6, F("k회사주소", '=IF({재직!회사주소}="","",{재직!회사주소})', align="center", size=10), {"border": False}), (1, "", FR)], h=26)
    p.row([(3, "", FR), (2, "대 표 자", sig), (6, F("k대표자", '=IF({재직!대표자}="","",{재직!대표자})', align="center", size=12, bold=True), {"border": False}),
           (1, "(인)", {"kind": "free", "align": "center", "size": 11})], h=30)
    p.gap(12)
    g.note(p, "※ 근무 줄의 끝날을 비우면 «현재까지»(발급일 · 비면 오늘)로 셉니다. 기간은 시작일부터 끝날(그날 포함)까지 꽉 찬 달과 남은 날입니다. "
              "퇴직 사유 등은 근로자가 요구한 사항만 적습니다(근로기준법 제39조②). 건설기술인 경력(협회 신고)과는 다른, 회사가 내주는 증명서입니다.")
    p.end_print()
    p.after_note(["사람 · 회사는 첫 장(재직증명서)에서 옵니다. 첫 근무 줄은 첫 장의 입사일 · 부서 · 직위 · 업무가 기본이고 눌러서 고칩니다."] if not ex else
                 ["이 시트는 작성 예시입니다(가상의 회사 · 사람)."])
    return p


def draw(bk, ex):
    bk.brand = "  K-건설맵  |  k-conmap.com  건설 서식"      # ✂ 새로 만든 서식 — «무료» 안 씀(2026-10-24 소장님)
    jaejik(bk, ex)
    gyeongryeok(bk, ex)


# ── 파이썬으로 따로 셈 ──────────────────────────────────────────────────
def _ed(d, m):
    import calendar
    y = d.year + (d.month - 1 + m) // 12
    mo = (d.month - 1 + m) % 12 + 1
    return D(y, mo, min(d.day, calendar.monthrange(y, mo)[1]))


def _d(v):
    return v if isinstance(v, datetime.date) else None


def _s(v):
    return "" if v is None else str(v)


def _ymd(d):
    return f"{d.year}. {d.month}. {d.day}."


def _arise(s, k):
    x = _ed(s, k)
    return x + datetime.timedelta(days=1) if x.day < s.day else x


def dur(s, e):
    E = e + datetime.timedelta(days=1)
    m0 = (E.year - s.year) * 12 + E.month - s.month
    m = m0 - (1 if _arise(s, m0) > E else 0)
    dd = (E - _arise(s, m)).days
    out = (f"{m // 12}년 " if m // 12 > 0 else "") + (f"{m % 12}개월 " if m % 12 > 0 else "") + (f"{dd}일" if dd > 0 else "")
    return out.strip()


def expect(pages):
    a, b = {}, {}
    j, k = pages["재직"], dict(pages["경력"])
    # 수식 기본 칸(빈 서식 · 작성 예시에 값이 없을 때) — 첫 장 값을 그대로 받음
    for key, src in (("1 시작", "입사일"), ("1 부서", "부서"), ("1 직위", "직위"), ("1 업무", "업무"), ("발급일2", "발급일")):
        v = k.get(key)
        if isinstance(v, str) and v.startswith("="):
            k[key] = j.get(src)
    s = _d(j.get("입사일"))
    base = _d(j.get("발급일")) or datetime.date.today()
    if not s:
        a["재직기간"] = ""
    elif base < s:
        a["재직기간"] = "⚠ 발급일이 입사일보다 앞섬"
    else:
        a["재직기간"] = "현재까지 " + dur(s, base)
    a["회사명줄"] = _s(j.get("상호"))
    b["k성명"] = _s(j.get("성명"))
    b["k생년월일"] = _d(j.get("생년월일")) or ""
    b["k주소"] = _s(j.get("주소"))
    base2 = _d(k.get("발급일2")) or datetime.date.today()
    for i in range(1, NR + 1):
        st, en = _d(k.get(f"{i} 시작")), _d(k.get(f"{i} 끝"))
        if not st:
            b[f"{i} 기간"] = ""
        elif not en:
            b[f"{i} 기간"] = "⚠ 시작이 발급일 뒤" if base2 < st else "현재까지 " + dur(st, base2)
        else:
            b[f"{i} 기간"] = "⚠ 끝이 시작보다 앞섬" if en < st else dur(st, en)
    s1, q = _d(k.get("1 시작")), _d(k.get("퇴사일"))
    if not s1:
        b["총기간"] = ""
    elif not q:
        b["총기간"] = "" if base2 < s1 else "현재까지 " + dur(s1, base2)
    else:
        b["총기간"] = "⚠ 퇴사일이 시작보다 앞섬" if q < s1 else f"{_ymd(s1)} ~ {_ymd(q)} · {dur(s1, q)}"
    b["k상호"] = _s(j.get("상호"))
    b["k용도"] = _s(j.get("용도"))
    b["k문장"] = "위 사람은 위와 같이 본 회사에 근무하였음을 증명합니다." if q else "위 사람은 위와 같이 본 회사에 근무하고 있음을 증명합니다."
    b["k회사명줄"] = _s(j.get("상호"))
    b["k회사주소"] = _s(j.get("회사주소"))
    b["k대표자"] = _s(j.get("대표자"))
    return {"재직": a, "경력": b}
