# -*- coding: utf-8 -*-
"""웹채움.py — 서식 «사이트에서 작성» 에도 엑셀과 같은 «미리 적힌 줄 · 고르는 말» 을 넣습니다 (2026-10-21)

소장님 「서식이 깔끔하게 잘 되어 있는지도 점검해줘」 → 점검 T4: 엑셀(인쇄용)에는 «구분» 줄(도급인 · 수급인 …)과
체크 항목이 미리 적혀 있는데, 사이트 작성 칸은 비어 있었습니다(사이트는 forms.json 만 읽고, 미리 적힌 말은 b_*.py 의 spec 에만 있음).

■ b_*.py SPECS 의 표 pre(칸 → 말 목록) · dv(칸 → 고르는 말) · kv dv 를 forms.json 의 그 블록에 넣습니다.
    표: wpre = [[줄1 칸들], [줄2 칸들] …] (미리 적힌 칸만 글자 · 나머지 '') · wdv = {칸 번호: [말 …]}
    kv: wdv = {줄 번호: [말 …]}
  gen.py(엑셀 그리기)는 b.rows 만 읽으므로 wpre · wdv 는 엑셀에 영향이 없습니다.
■ spec 을 고치면 이것을 다시 돌립니다:  python3 tools/forms2/웹채움.py
  시험(올리기 bat):                     python3 tools/forms2/웹채움.py --check  (forms.json 이 spec 과 다르면 멈춤)
■ 계산 칸(calc · first)은 넣지 않습니다(사이트는 계산하지 않음).
"""
import importlib
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import registry  # noqa: E402


def norm(t):
    """gen.py norm 과 똑같이(빈칸 빼기) — gen.py 는 openpyxl 을 불러 PC 시험에서 못 쓸 수 있어 한 줄 둠"""
    return re.sub(r"\s+", "", str(t or ""))

FORMS = os.path.join(registry.ROOT, "web", "src", "data", "forms.json")


def _말(v):
    if v is None:
        return ""
    if isinstance(v, float) and v.is_integer():
        v = int(v)
    return str(v)


def _고름(dv):
    xs = [x.strip() for x in str(dv).split(",") if x.strip()]
    return xs if len(xs) >= 2 else None


def 채움표():
    """{slug: {블록 번호: {'wpre': …, 'wdv': …}}}"""
    forms = registry.forms()
    out = {}
    for b in registry.BATCHES:
        mod = importlib.import_module(b)
        for slug, spec in mod.SPECS.items():
            f = forms.get(slug)
            if not f or not f.get("sheet"):
                continue
            blocks = f["sheet"]["blocks"]
            tabs = spec.get("tab") or []
            ti = 0
            seen = {}
            for bi, bl in enumerate(blocks):
                if bl["t"] == "table":
                    ts = tabs[ti] if ti < len(tabs) else (spec.get("tab_all") or {})
                    ti += 1
                    keys = ts.get("cols") or [norm(c) for c in bl["cols"]]
                    if len(keys) != len(bl["cols"]):
                        continue
                    계산 = set((ts.get("calc") or {}).keys()) | set((ts.get("first") or {}).keys())
                    pre = {k: v for k, v in (ts.get("pre") or {}).items() if k in keys and k not in 계산}
                    one = {}
                    if pre and not bl.get("rows"):
                        n = max(len(v) for v in pre.values())
                        one["wpre"] = [[_말(pre[k][i]) if (k in pre and i < len(pre[k])) else "" for k in keys] for i in range(n)]
                    wdv = {}
                    for k, dv in (ts.get("dv") or {}).items():
                        xs = _고름(dv)
                        if xs and k in keys and k not in 계산:
                            wdv[str(keys.index(k))] = xs
                    if wdv:
                        one["wdv"] = wdv
                    if one:
                        out.setdefault(slug, {})[bi] = one
                elif bl["t"] == "kv":
                    wdv = {}
                    for j, (label, _val) in enumerate(bl["rows"]):
                        seen[norm(label)] = seen.get(norm(label), 0) + 1
                        nth = seen[norm(label)]
                        kv = spec.get("kv") or {}
                        목표 = norm(f"{label}#{nth}") if nth > 1 else norm(label)     # gen.py _kv_spec 와 같은 맞춤
                        s = next((v for k, v in kv.items() if norm(k) == 목표), None)
                        xs = _고름((s or {}).get("dv")) if isinstance(s, dict) and (s or {}).get("dv") and not (s or {}).get("f") else None
                        if xs:
                            wdv[str(j)] = xs
                    if wdv:
                        out.setdefault(slug, {})[bi] = {"wdv": wdv}
    return out


def 넣기(d, 표):
    for f in d["forms"]:
        bl = (f.get("sheet") or {}).get("blocks") or []
        mine = 표.get(f["slug"], {})
        for bi, b in enumerate(bl):
            b.pop("wpre", None)
            b.pop("wdv", None)
            for k, v in (mine.get(bi) or {}).items():
                b[k] = v
    return d


def main():
    raw = open(FORMS, "rb").read()
    d = json.loads(raw)
    표 = 채움표()
    새 = json.dumps(넣기(d, 표), ensure_ascii=False, indent=1)
    if "--check" in sys.argv:
        same = 새.encode("utf-8") == raw.replace(b"\r\n", b"\n")
        print("웹채움 —", "forms.json 이 spec 과 같음" if same else "forms.json 이 spec 과 다름(python3 tools/forms2/웹채움.py 를 돌리세요)",
              f"· 서식 {len(표)} · 미리 적힌 표 {sum(1 for s in 표.values() for x in s.values() if 'wpre' in x)} · 고르는 말 {sum(1 for s in 표.values() for x in s.values() if 'wdv' in x)}")
        sys.exit(0 if same else 3)
    open(FORMS, "wb").write(새.encode("utf-8"))
    print("웹채움 — 넣음", len(표), "서식")


if __name__ == "__main__":
    main()
