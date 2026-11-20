# -*- coding: utf-8 -*-
"""yearvals.py — 🗓 G802 (2026-11-20) 해마다 바뀌는 값을 «화면과 같은 표» 에서 읽어 미리 굽는 쪽(prerender.py)에 줍니다.

소장님 11-20 「곧 27년 이잖아. 년도가 자동으로 바뀌게 해줘. 건설맵 전체 점검 후에」
  → 쪽 글에 «2026» · «27%» · «4.75%» 를 손으로 적지 않고, 화면이 쓰는 표(web/src/lib/해마다.js · gongje.js)를 글자로 읽어 씁니다.
  · 사이트는 자동 갱신 때마다 다시 구우므로, 해가 바뀌면(1월 1일) · 새 고시 값을 표에 넣으면 쪽 글도 저절로 바뀝니다.
  · 화면(React)은 같은 표를 그대로 import 합니다 — 둘이 어긋나지 않는지 tools/시험_해마다해.mjs 가 봅니다.
  ⚠️ 표의 꼴(한 해 한 줄 · «2026: { 일반: 0.27, …»)을 바꾸면 여기 정규식도 같이 — 시험이 잡습니다.
"""
import os
import re
from datetime import datetime, timedelta, timezone

ROOT = os.path.dirname(os.path.abspath(__file__))
LIB = os.path.join(ROOT, "web", "src", "lib")


def _read(name):
    with open(os.path.join(LIB, name), encoding="utf-8") as f:
        return f.read()


def _block(src, head):
    """«head = {» 부터 줄 첫머리 «}» 까지(표 한 덩이)"""
    i = src.find(head)
    if i < 0:
        return ""
    j = src.find("\n}", i)
    return src[i:j if j > 0 else len(src)]


def _rows(block, keys):
    """«  2026: { 일반: 0.27, 하도급: 0.29, … }» 꼴 줄 → {2026: {일반: 0.27, …}}"""
    out = {}
    for ln in block.split("\n"):
        m = re.match(r"\s*(\d{4})\s*:\s*\{(.*)", ln)
        if not m:
            continue
        vals = {}
        for k in keys:
            mm = re.search(r"(?<![가-힣\w])" + k + r"\s*:\s*([\d.]+)", m.group(2))
            if mm:
                vals[k] = float(mm.group(1))
        if len(vals) == len(keys):
            g = re.search(r"근거\s*:\s*'([^']*)'", m.group(2))
            if g:
                vals["근거"] = g.group(1)
            out[int(m.group(1))] = vals
    return out


def 고시번호(근거):
    """'고용노동부고시 제2025-119호(2025.12.30.) …' → '제2025-119호' (없으면 '')"""
    m = re.search(r"제\s?\d{4}-\d+호", 근거 or "")
    return m.group(0).replace(" ", "") if m else ""


def 한국오늘():
    return (datetime.now(timezone.utc) + timedelta(hours=9)).strftime("%Y-%m-%d")


def 쓸해(표, 해=None):
    """표에 든 해 가운데 해(기본 = 한국 올해)보다 늦지 않은 가장 늦은 해 — 없으면 가장 이른 해(화면 해값 · 쓸해 와 같은 셈)"""
    if not 표:
        return None
    들 = sorted(표)
    y = int(해) if 해 else int(한국오늘()[:4])
    쓸 = 들[0]
    for h in 들:
        if h <= y:
            쓸 = h
    return 쓸


def 해마다표():
    """lib/해마다.js 의 해마다 고시 표 다섯"""
    src = _read("해마다.js")
    return {
        "노무비율": _rows(_block(src, "export const 노무비율표 = {"), ("일반", "하도급")),
        "산재": _rows(_block(src, "export const 산재율표 = {"), ("건설", "출퇴근")),
        "고용": _rows(_block(src, "export const 고용율표 = {"), ("실업", "s", "l")),
        "임금채권": _rows(_block(src, "export const 임금채권표 = {"), ("율",)),
        "석면": _rows(_block(src, "export const 석면표 = {"), ("율",)),
    }


def 표해():
    """«해마다 바뀌는 값» 표의 해 = 노무비율표에 든 가장 늦은 해(12월 말 고시를 넣으면 그 해) — 화면 해마다.js 표해() 와 같음"""
    t = 해마다표()["노무비율"]
    return max(t) if t else None


def 공제표():
    """lib/gongje.js 4대보험 요율표 · 장기요양 표 · 연금 상하한"""
    src = _read("gongje.js")
    율 = _rows(_block(src, "const 요율표 = {"), ("np", "hi", "ei"))
    m = re.search(r"const 요양율표 = \{([^}]*)\}", src)
    요양 = {}
    if m:
        for y, a, b in re.findall(r"(\d{4})\s*:\s*\[\s*([\d.]+)\s*,\s*([\d.]+)\s*\]", m.group(1)):
            요양[int(y)] = (float(a), float(b))
    상하 = []
    for ym, lo, hi in re.findall(r"if \(ym >= '(\d{4}-\d{2})'\) return \[(\d+), (\d+)\]", src):
        상하.append((ym, int(lo), int(hi)))
    m2 = re.search(r"return \[(\d+), (\d+)\]\s*\n\}", src[src.find("export function 연금상하한"):]) if "export function 연금상하한" in src else None
    끝 = (int(m2.group(1)), int(m2.group(2))) if m2 else None
    return {"율": 율, "요양": 요양, "상하한": 상하, "상하한끝": 끝}


def 공제값(ym=None):
    """그 달(기본 = 한국 이번 달)에 쓸 근로자 몫 요율 — 화면 gongje.js 요율(ym) · 요양비율(ym) · 연금상하한(ym) 과 같은 값"""
    ym = ym or 한국오늘()[:7]
    t = 공제표()
    해 = 쓸해(t["율"], ym[:4])
    r = t["율"][해]
    요해 = 쓸해(t["요양"], ym[:4])
    a, b = t["요양"][요해]
    lc = a / b
    if ym >= "2026-11":
        lc = round(lc * 1e4) / 1e4
    lo_hi = t["상하한끝"]
    for 부터, lo, hi in t["상하한"]:
        if ym >= 부터:
            lo_hi = (lo, hi)
            break
    return {"해": 해, "연금": r["np"], "건강": r["hi"], "고용": r["ei"], "요양비율": lc, "연금하한": lo_hi[0] if lo_hi else None, "연금상한": lo_hi[1] if lo_hi else None}


# ── 글 꼴 ───────────────────────────────────────────────
def 백(x, 자리=3):
    """0.0475 → '4.75%' · 0.03595 → '3.595%' (끝 0 은 뺌)"""
    s = ("%." + str(자리) + "f") % (x * 100)
    s = s.rstrip("0").rstrip(".")
    return s + "%"


def 천(x):
    """0.035 → '35/1,000' · 0.0006 → '0.6/1,000'"""
    v = x * 1000
    s = ("%.2f" % v).rstrip("0").rstrip(".")
    return s + "/1,000"


def 만원(n):
    """410000 → '41만' · 6590000 → '659만'"""
    return ("%g" % (n / 10000)) + "만"



def 해마다글(오늘=None):
    """미리 굽는 쪽에 넣을 글 조각 — 오늘(한국) 쓰는 값 · 그 해. 화면과 같은 셈(해값 · 요율 · 요양비율 · 연금상하한)"""
    오늘 = 오늘 or 한국오늘()
    t = 해마다표()
    g = 공제값(오늘[:7])
    해 = 쓸해(t["노무비율"], 오늘[:4])
    노 = t["노무비율"][해]
    산해 = 쓸해(t["산재"], 오늘[:4]); 산 = t["산재"][산해]
    고해 = 쓸해(t["고용"], 오늘[:4]); 고 = t["고용"][고해]
    임해 = 쓸해(t["임금채권"], 오늘[:4]); 임 = t["임금채권"][임해]
    석해 = 쓸해(t["석면"], 오늘[:4]); 석 = t["석면"][석해]
    return {
        "표해": 표해(), "해": 해, "공해": g["해"],
        "노일반": 백(노["일반"]), "노하도급": 백(노["하도급"]), "노고시": 고시번호(노.get("근거")),
        "산재합": 백(산["건설"] + 산["출퇴근"]), "산재건설": 백(산["건설"]), "산재출퇴근": 백(산["출퇴근"]),
        "산재건설천": 천(산["건설"]), "산재출퇴근천": 천(산["출퇴근"]), "산재고시": 고시번호(산.get("근거")),
        "실업": 백(고["실업"]), "고용안정": 백(고["s"]).rstrip("%") + "~" + 백(고["l"]), "고용사업주s": 백(고["실업"] / 2 + 고["s"]),
        "임금": 백(임["율"]), "임금천": 천(임["율"]), "임금고시": 고시번호(임.get("근거")),
        "석면": 백(석["율"]), "석면십만": ("%g" % round(석["율"] * 1e5, 4)), "석면고시": 고시번호(석.get("근거")),
        "연금": 백(g["연금"]), "건강": 백(g["건강"]), "고용근로자": 백(g["고용"]), "요양": 백(g["요양비율"], 2),
        "연금하한": 만원(g["연금하한"]) if g["연금하한"] else "", "연금상한": 만원(g["연금상한"]) if g["연금상한"] else "",
    }

if __name__ == "__main__":
    import json
    print(json.dumps({"글": 해마다글(), "글_2027_01_02": 해마다글("2027-01-02")}, ensure_ascii=False))
