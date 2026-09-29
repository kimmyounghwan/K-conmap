# -*- coding: utf-8 -*-
"""서식 찾기 — f_{슬러그}.py(따로 그린 것)가 있으면 그것, 없으면 b_*.py 의 SPECS(틀 그대로 + 내용·수식)."""
import importlib
import json
import os
import types

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
BATCHES = sorted(f[:-3] for f in os.listdir(HERE) if f.startswith("b_") and f.endswith(".py"))
_forms = None


def forms():
    global _forms
    if _forms is None:
        _forms = {f["slug"]: f for f in json.loads(open(os.path.join(ROOT, "web", "src", "data", "forms.json"), "rb").read().decode("utf-8"))["forms"]}
    return _forms


def get(slug):
    try:
        return importlib.import_module("f_" + slug.replace("-", "_"))
    except ModuleNotFoundError:
        pass
    import gen
    for b in BATCHES:
        mod = importlib.import_module(b)
        if slug in mod.SPECS:
            spec = mod.SPECS[slug]
            form = forms()[slug]
            m = types.SimpleNamespace(SLUG=slug, TITLE=form["title"], WHERE="forms", MULTI=False, PREV=None,
                                      SHORT=spec.get("short"), NOTE_REPLACE=spec.get("note_replace"), SPEC=spec)
            m.draw = lambda bk, ex, _f=form, _s=spec: gen.draw_form(bk, ex, _f, _s)
            m.expect = spec.get("expect") or (lambda inp: {})
            return m
    raise KeyError(slug)


def all_specs():
    out = []
    for b in BATCHES:
        out += list(importlib.import_module(b).SPECS)
    return out
