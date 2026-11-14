#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
📏 G685 KCMS 리습 흉내 시험 — 캐드 없이 tools/pc연결/kcm.lsp 를 «작은 AutoLISP 해석기» 로 실제로 돌려 봄 (클라우드 전용)
  가짜 도면(오토캐드 entget 꼴 자료: LINE · LWPOLYLINE(볼록) · POLYLINE(VERTEX) · ARC · CIRCLE · ELLIPSE · INSERT/MINSERT · TEXT · MTEXT · DIMENSION · HATCH …)
  → c:KCMS → 보내기\\kcms_<번호>.csv · .txt → 건설맵 lib(web/src/lib/캐드고름.js — 글풀기 · 고름읽기 · 줄만들기 · 캐드셈)로 읽어 셈 → 손셈 답과 견줌
  ■ 해석기는 AutoLISP 처럼 깐깐하게: strcat 에 nil · itoa 에 실수 · 닫은 파일 다시 닫기 · 인수 수 틀림 → 오류(캐드에서 «bad argument type» 으로 멈출 것을 여기서 잡음)
    동적 범위(지역 *error*) · 글 이스케이프(\\n \\t \\" \\\\) · 점 짝 '(0 . "LINE") · nil = ()
  ■ 캐드가 쓰는 글자 꼴 셋(CP949 = 옛 판 · UTF-8 · UTF-16 머리말) × DIMZIN 0 · 12(뒤 0 · 앞 0 지움) 로 돌림
  ■ 이 해석기로 잡을 수 없는 것: 실제 캐드의 entget 이 다르게 주는 것(판마다) — 마지막에 소장님 캐드에서 한 번(기록에 적음)
  쓰는 법: python3 tools/시험_캐드고름리습.py   (node 필요 · web/node_modules 는 안 씀)
"""
import io
import json
import math
import os
import shutil
import subprocess
import sys
import tempfile

뿌리 = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
리습 = os.path.join(뿌리, 'tools', 'pc연결', 'kcm.lsp')
라이브 = os.path.join(뿌리, 'web', 'src', 'lib', '캐드고름.js')
됨 = []
틀 = []


def 봄(조건, 글):
    (됨 if 조건 else 틀).append(글)
    print(('  ✓ ' if 조건 else '  ✗ ') + 글)


# ───────────────────────── 작은 AutoLISP 해석기 ─────────────────────────
class LispError(Exception):
    def __init__(self, msg):
        super().__init__(msg)
        self.처리 = False


class Abort(Exception):
    pass


class Sym:
    표 = {}

    def __init__(self, n):
        self.n = n

    @classmethod
    def of(cls, n):
        n = n.upper()
        if n not in cls.표:
            cls.표[n] = Sym(n)
        return cls.표[n]

    def __repr__(self):
        return self.n


class Pair:
    def __init__(self, a, d):
        self.a, self.d = a, d

    def __repr__(self):
        return f'({글로(self.a)} . {글로(self.d)})'


class EName:
    def __init__(self, i):
        self.i = i

    def __repr__(self):
        return f'<Entity name: {self.i:x}>'


class PickSet:
    def __init__(self, l):
        self.l = l


class LFile:
    def __init__(self, path, fh):
        self.path, self.fh, self.열림 = path, fh, True


class UserFn:
    def __init__(self, 이름, 인수, 지역, 몸):
        self.이름, self.인수, self.지역, self.몸 = 이름, 인수, 지역, 몸


class Builtin:
    def __init__(self, 이름, f):
        self.이름, self.f = 이름, f


T = Sym.of('T')


def 글로(v):
    if v is None:
        return 'nil'
    if isinstance(v, str):
        return '"' + v + '"'
    if isinstance(v, list):
        return '(' + ' '.join(글로(x) for x in v) + ')'
    return repr(v)


def 읽기(글):
    """글 → 식들(리스트) · 주석 ;… · ;|…|;"""
    i, n = 0, len(글)
    toks = []
    while i < n:
        c = 글[i]
        if c in ' \t\r\n':
            i += 1
        elif c == ';':
            if 글.startswith(';|', i):
                j = 글.find('|;', i + 2)
                if j < 0:
                    raise SyntaxError('닫지 않은 ;| 주석')
                i = j + 2
            else:
                while i < n and 글[i] != '\n':
                    i += 1
        elif c in "()'":
            toks.append(c)
            i += 1
        elif c == '"':
            j = i + 1
            s = []
            while True:
                if j >= n:
                    raise SyntaxError('닫지 않은 글자 줄')
                d = 글[j]
                if d == '\\':
                    e = 글[j + 1]
                    if e in 'nN':
                        s.append('\n'); j += 2
                    elif e in 'rR':
                        s.append('\r'); j += 2
                    elif e in 'tT':
                        s.append('\t'); j += 2
                    elif e in 'eE':
                        s.append('\x1b'); j += 2
                    elif e == '"':
                        s.append('"'); j += 2
                    elif e == '\\':
                        s.append('\\'); j += 2
                    elif e.isdigit():
                        k = j + 1
                        while k < n and k < j + 4 and 글[k].isdigit():
                            k += 1
                        s.append(chr(int(글[j + 1:k], 8))); j = k
                    else:
                        s.append(e); j += 2
                elif d == '"':
                    break
                else:
                    s.append(d); j += 1
            toks.append(('STR', ''.join(s)))
            i = j + 1
        else:
            j = i
            while j < n and 글[j] not in ' \t\r\n();"\'':
                j += 1
            toks.append(('ATOM', 글[i:j]))
            i = j
    pos = 0

    def 원자(t):
        try:
            return int(t)
        except ValueError:
            pass
        try:
            return float(t)
        except ValueError:
            pass
        return Sym.of(t)

    def 식():
        nonlocal pos
        if pos >= len(toks):
            raise SyntaxError('식이 모자람(닫는 괄호가 더 많거나 끝이 잘림)')
        t = toks[pos]
        pos += 1
        if t == '(':
            l = []
            while True:
                if pos >= len(toks):
                    raise SyntaxError('닫지 않은 괄호')
                if toks[pos] == ')':
                    pos += 1
                    return l if l else None
                if toks[pos] == ('ATOM', '.'):
                    pos += 1
                    d = 식()
                    if toks[pos] != ')':
                        raise SyntaxError('점 짝 뒤에 ) 가 없음')
                    pos += 1
                    return Pair(l[0], d) if len(l) == 1 else l + [d]
                l.append(식())
        if t == ')':
            raise SyntaxError('여는 괄호 없는 )')
        if t == "'":
            return [Sym.of('QUOTE'), 식()]
        if t[0] == 'STR':
            return t[1]
        return 원자(t[1])

    out = []
    while pos < len(toks):
        out.append(식())
    return out


class 캐드:
    """가짜 캐드 — 도면(객체 alist) · 시스템 변수 · 파일(보내기 폴더) · 콘솔"""

    def __init__(self, 객체들, 변수, 앱데이터, 글꼴='cp949', 적요='', dimzin=0):
        self.db = []          # (alist, 맨위?) — POLYLINE 뒤 VERTEX · SEQEND 도 차례대로
        for o in 객체들:
            if isinstance(o, tuple) and o[0] == 'POLY':
                self.db.append((o[1], True))
                for v in o[2]:
                    self.db.append((v, False))
                self.db.append(([Pair(0, 'SEQEND'), Pair(5, 'FFF'), Pair(8, '0')], False))
            else:
                self.db.append((o, True))
        self.변수 = 변수
        self.앱데이터 = 앱데이터
        self.글꼴 = 글꼴
        self.적요 = 적요
        self.dimzin = dimzin
        self.콘솔 = []
        self.명령 = []
        self.열린 = []

    def 실제길(self, p):
        """윈도 경로(C:\\…\\AppData\\Roaming\\…) → 시험 폴더"""
        앞 = self.변수['__APPDATA']
        if not p.startswith(앞):
            return None
        return os.path.join(self.앱데이터, *[x for x in p[len(앞):].split('\\') if x])


def 타입(v):
    if v is None:
        return None
    if isinstance(v, bool):
        raise LispError('파이썬 bool 이 들어옴(해석기 버그)')
    if isinstance(v, int):
        return Sym.of('INT')
    if isinstance(v, float):
        return Sym.of('REAL')
    if isinstance(v, str):
        return Sym.of('STR')
    if isinstance(v, (list, Pair)):
        return Sym.of('LIST')
    if isinstance(v, EName):
        return Sym.of('ENAME')
    if isinstance(v, PickSet):
        return Sym.of('PICKSET')
    if isinstance(v, LFile):
        return Sym.of('FILE')
    if isinstance(v, Sym):
        return Sym.of('SYM')
    if isinstance(v, Builtin):
        return Sym.of('SUBR')
    if isinstance(v, UserFn):
        return Sym.of('USUBR')
    raise LispError('모르는 값 ' + repr(v))


def 수인가(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def 깐(조건, 이름, v):
    if not 조건:
        raise LispError(f'bad argument type: {이름} {글로(v)}')


def car(v):
    if v is None:
        return None
    if isinstance(v, list):
        return v[0]
    if isinstance(v, Pair):
        return v.a
    raise LispError('bad argument type: consp ' + 글로(v))


def cdr(v):
    if v is None:
        return None
    if isinstance(v, list):
        return v[1:] if len(v) > 1 else None
    if isinstance(v, Pair):
        return v.d
    raise LispError('bad argument type: consp ' + 글로(v))


def 같음(a, b, fuzz=0.0):
    if 수인가(a) and 수인가(b):
        return abs(a - b) <= fuzz
    if isinstance(a, list) and isinstance(b, list):
        return len(a) == len(b) and all(같음(x, y, fuzz) for x, y in zip(a, b))
    if isinstance(a, Pair) and isinstance(b, Pair):
        return 같음(a.a, b.a, fuzz) and 같음(a.d, b.d, fuzz)
    if isinstance(a, str) and isinstance(b, str):
        return a == b
    return a is b


class 해석기:
    def __init__(self, cad):
        self.cad = cad
        self.틀 = [{}]
        g = self.틀[0]
        b = self.내장()
        for k, f in b.items():
            g[Sym.of(k)] = Builtin(k, f)
        g[Sym.of('T')] = T
        g[Sym.of('PI')] = math.pi

    # 동적 범위
    def 찾기(self, s):
        for f in reversed(self.틀):
            if s in f:
                return f[s]
        return None

    def 놓기(self, s, v):
        for f in reversed(self.틀):
            if s in f:
                f[s] = v
                return
        self.틀[0][s] = v

    def 셈(self, x):
        if isinstance(x, Sym):
            if x is T:
                return T
            if x.n == 'NIL':
                return None
            return self.찾기(x)
        if not isinstance(x, list):
            return x
        머 = x[0]
        if isinstance(머, Sym):
            특 = getattr(self, '특_' + 머.n.replace('-', '_').replace('*', '').replace(':', '_'), None) if 머.n in 특별 else None
            if 특:
                return 특(x[1:])
            f = self.찾기(머)
        else:
            f = self.셈(머)
        인 = [self.셈(a) for a in x[1:]]
        return self.부름(f, 인, 머)

    def 부름(self, f, 인, 이름=None):
        if isinstance(f, Builtin):
            return f.f(*인)
        if isinstance(f, UserFn):
            if len(인) < len(f.인수):
                raise LispError('too few arguments')
            if len(인) > len(f.인수):
                raise LispError('too many arguments')
            틀 = {s: None for s in f.지역}
            for s, v in zip(f.인수, 인):
                틀[s] = v
            self.틀.append(틀)
            try:
                v = None
                for e in f.몸:
                    v = self.셈(e)
                return v
            except LispError as e:
                if not e.처리:
                    e.처리 = True
                    h = self.찾기(Sym.of('*ERROR*'))
                    if isinstance(h, UserFn):
                        self.부름(h, [str(e)])
                raise
            finally:
                self.틀.pop()
        raise LispError('no function definition: ' + (이름.n if isinstance(이름, Sym) else 글로(이름)))

    # 특별 꼴
    def 특_QUOTE(self, a):
        return a[0]

    def 특_SETQ(self, a):
        if len(a) % 2:
            raise LispError('too few arguments(setq)')
        v = None
        for i in range(0, len(a), 2):
            깐(isinstance(a[i], Sym), 'symbolp', a[i])
            v = self.셈(a[i + 1])
            self.놓기(a[i], v)
        return v

    def 특_DEFUN(self, a):
        이름, 목 = a[0], a[1] or []
        인수, 지역, 뒤 = [], [], False
        for s in 목:
            if isinstance(s, Sym) and s.n == '/':
                뒤 = True
            elif 뒤:
                지역.append(s)
            else:
                인수.append(s)
        self.놓기(이름, UserFn(이름.n, 인수, 지역, a[2:]))
        return 이름

    def 특_IF(self, a):
        if len(a) < 2 or len(a) > 3:
            raise LispError('if 인수 수 틀림')
        if self.셈(a[0]) is not None:
            return self.셈(a[1])
        return self.셈(a[2]) if len(a) == 3 else None

    def 특_COND(self, a):
        for c in a:
            v = self.셈(c[0])
            if v is not None:
                for e in c[1:]:
                    v = self.셈(e)
                return v
        return None

    def 특_WHILE(self, a):
        v = None
        n = 0
        while self.셈(a[0]) is not None:
            n += 1
            if n > 2_000_000:
                raise LispError('끝나지 않는 while(해석기 지킴)')
            for e in a[1:]:
                v = self.셈(e)
        return v

    def 특_REPEAT(self, a):
        n = self.셈(a[0])
        깐(isinstance(n, int), 'fixnump', n)
        v = None
        for _ in range(n):
            for e in a[1:]:
                v = self.셈(e)
        return v

    def 특_FOREACH(self, a):
        s, l = a[0], self.셈(a[1])
        깐(l is None or isinstance(l, list), 'listp', l)
        v = None
        self.틀.append({s: None})
        try:
            for x in l or []:
                self.틀[-1][s] = x
                for e in a[2:]:
                    v = self.셈(e)
        finally:
            self.틀.pop()
        return v

    def 특_PROGN(self, a):
        v = None
        for e in a:
            v = self.셈(e)
        return v

    def 특_AND(self, a):
        for e in a:
            if self.셈(e) is None:
                return None
        return T

    def 특_OR(self, a):
        for e in a:
            if self.셈(e) is not None:
                return T
        return None

    def 내장(self):
        cad = self.cad

        def 수들(이름, l):
            for v in l:
                깐(수인가(v), 'numberp', v)

        def 더(*l):
            수들('+', l); return sum(l) if l else 0

        def 빼(*l):
            수들('-', l)
            if not l:
                return 0
            return -l[0] if len(l) == 1 else l[0] - sum(l[1:])

        def 곱(*l):
            수들('*', l)
            r = 1
            for v in l:
                r = r * v
            return r

        def 나(*l):
            수들('/', l)
            r = l[0]
            for v in l[1:]:
                if v == 0:
                    raise LispError('divide by zero')
                r = int(r / v) if isinstance(r, int) and isinstance(v, int) else r / v
            return r

        def rem(a, b):
            수들('rem', [a, b])
            if b == 0:
                raise LispError('divide by zero')
            r = math.fmod(a, b)
            return int(r) if isinstance(a, int) and isinstance(b, int) else r

        def 비교(op):
            def f(*l):
                if len(l) < 1:
                    raise LispError('too few arguments')
                for x, y in zip(l, l[1:]):
                    if 수인가(x) and 수인가(y):
                        ok = op(x, y)
                    elif isinstance(x, str) and isinstance(y, str):
                        ok = op(x, y)
                    elif op is 같은값:
                        ok = x is y
                    else:
                        raise LispError('bad argument type: numberp ' + 글로(x if not 수인가(x) else y))
                    if not ok:
                        return None
                return T
            return f

        def 같은값(x, y):
            return x == y

        def 다른(a, b):
            if 수인가(a) and 수인가(b):
                return T if a != b else None
            if isinstance(a, str) and isinstance(b, str):
                return T if a != b else None
            return T if a is not b else None

        def strcat(*l):
            for v in l:
                깐(isinstance(v, str), 'stringp', v)
            return ''.join(l)

        def itoa(v):
            깐(isinstance(v, int) and not isinstance(v, bool), 'fixnump', v)
            return str(v)

        def rtos(v, mode=2, prec=4):
            깐(수인가(v), 'numberp', v)
            깐(mode == 2, 'rtos 꼴(2 만 흉내)', mode)
            s = f'{v:.{prec}f}'
            if cad.dimzin & 8 and '.' in s:
                s = s.rstrip('0').rstrip('.')
            if cad.dimzin & 4:
                if s.startswith('0.'):
                    s = s[1:]
                elif s.startswith('-0.'):
                    s = '-' + s[2:]
            return s

        def substr(s, a, n=None):
            깐(isinstance(s, str), 'stringp', s); 깐(isinstance(a, int) and a >= 1, 'fixnump', a)
            return s[a - 1:] if n is None else s[a - 1:a - 1 + n]

        def strlen(*l):
            for v in l:
                깐(isinstance(v, str), 'stringp', v)
            return sum(len(v) for v in l)

        def chr_(n):
            깐(isinstance(n, int), 'fixnump', n); return chr(n)

        def logand(*l):
            r = -1
            for v in l:
                깐(isinstance(v, int) and not isinstance(v, bool), 'fixnump', v)
                r &= v
            return r if l else 0

        def assoc(k, l):
            깐(l is None or isinstance(l, list), 'listp', l)
            for e in l or []:
                if isinstance(e, (list, Pair)) and 같음(car(e), k):
                    return e
            return None

        def member(x, l):
            깐(l is None or isinstance(l, list), 'listp', l)
            for i, e in enumerate(l or []):
                if 같음(e, x):
                    return l[i:]
            return None

        def cons(a, b):
            if b is None:
                return [a]
            if isinstance(b, list):
                return [a] + b
            return Pair(a, b)

        def list_(*l):
            return list(l) if l else None

        def nth(i, l):
            깐(isinstance(i, int), 'fixnump', i); 깐(l is None or isinstance(l, list), 'listp', l)
            return l[i] if l and 0 <= i < len(l) else None

        def length(l):
            깐(l is None or isinstance(l, list), 'listp', l); return len(l or [])

        def princ(v=None, f=None):
            if f is not None:
                깐(isinstance(f, LFile) and f.열림, 'streamp', f)
                f.fh.write(v if isinstance(v, str) else 글로(v))
            elif v is not None:
                cad.콘솔.append(v if isinstance(v, str) else 글로(v))
            return v

        def getvar(n):
            깐(isinstance(n, str), 'stringp', n)
            return cad.변수.get(n.upper())

        def getenv(n):
            깐(isinstance(n, str), 'stringp', n)
            return cad.변수.get('__ENV_' + n.upper())

        def open_(p, m):
            깐(isinstance(p, str), 'stringp', p); 깐(isinstance(m, str), 'stringp', m)
            real = cad.실제길(p)
            if not real or not os.path.isdir(os.path.dirname(real)):
                return None
            if m.lower() == 'w':
                fh = io.open(real, 'w', encoding='utf-16' if cad.글꼴 == 'utf-16' else cad.글꼴, newline='')
            elif m.lower() == 'a':
                fh = io.open(real, 'a', encoding='utf-16' if cad.글꼴 == 'utf-16' else cad.글꼴, newline='')
            else:
                fh = io.open(real, 'r', encoding=cad.글꼴, newline='')
            f = LFile(p, fh)
            cad.열린.append(f)
            return f

        def close(f):
            깐(isinstance(f, LFile) and f.열림, 'streamp', f)
            f.fh.close(); f.열림 = False
            return None

        def write_line(s, f=None):
            깐(isinstance(s, str), 'stringp', s)
            if f is None:
                cad.콘솔.append(s + '\n')
            else:
                깐(isinstance(f, LFile) and f.열림, 'streamp', f)
                f.fh.write(s + '\r\n')
            return s

        def ssget(*a):
            if a:
                raise LispError('ssget 꼴은 흉내 안 함 — KCMS 는 (ssget) 만')
            l = [EName(i) for i, (o, top) in enumerate(cad.db) if top]
            return PickSet(l) if l else None

        def sslength(ss):
            깐(isinstance(ss, PickSet), 'lselsetp', ss); return len(ss.l)

        def ssname(ss, i):
            깐(isinstance(ss, PickSet), 'lselsetp', ss); 깐(isinstance(i, int), 'fixnump', i)
            return ss.l[i] if 0 <= i < len(ss.l) else None

        def entget(e, *a):
            깐(isinstance(e, EName), 'lentityp', e)
            o = cad.db[e.i][0]
            import copy
            return [Pair(-1, e)] + copy.deepcopy(o)

        def entnext(e=None):
            if e is None:
                return EName(0) if cad.db else None
            깐(isinstance(e, EName), 'lentityp', e)
            return EName(e.i + 1) if e.i + 1 < len(cad.db) else None

        def getstring(*a):
            return cad.적요

        def command(*a):
            cad.명령.append(a); return None

        def typ(v):
            return 타입(v)

        def eq(a, b):
            if 수인가(a) and 수인가(b):
                return T if a == b and type(a) == type(b) else None
            return T if a is b else None

        def equal(a, b, fuzz=0.0):
            return T if 같음(a, b, fuzz) else None

        def null(v):
            return T if v is None else None

        def numberp(v):
            return T if 수인가(v) else None

        def listp(v):
            return T if v is None or isinstance(v, (list, Pair)) else None

        def fix(v):
            깐(수인가(v), 'numberp', v); return int(v)

        def float_(v):
            깐(수인가(v), 'numberp', v); return float(v)

        def 하나(n):
            def f(v):
                깐(수인가(v), 'numberp', v); return v + n
            return f

        def cxr(길):
            def f(v):
                for c in reversed(길):
                    v = car(v) if c == 'a' else cdr(v)
                return v
            return f

        b = {
            '+': 더, '-': 빼, '*': 곱, '/': 나, 'REM': rem, '1+': 하나(1), '1-': 하나(-1), 'FIX': fix, 'FLOAT': float_,
            'ABS': lambda v: abs(v), 'MAX': lambda *l: max(l), 'MIN': lambda *l: min(l), 'SQRT': math.sqrt,
            '=': 비교(같은값), '/=': 다른, '<': 비교(lambda x, y: x < y), '>': 비교(lambda x, y: x > y), '<=': 비교(lambda x, y: x <= y), '>=': 비교(lambda x, y: x >= y),
            'EQ': eq, 'EQUAL': equal, 'NULL': null, 'NOT': null, 'NUMBERP': numberp, 'LISTP': listp, 'TYPE': typ,
            'CAR': car, 'CDR': cdr, 'CADR': cxr('ad'), 'CADDR': cxr('add'), 'CDDR': cxr('dd'), 'CAAR': cxr('aa'), 'CDAR': cxr('da'),
            'CONS': cons, 'LIST': list_, 'ASSOC': assoc, 'MEMBER': member, 'NTH': nth, 'LENGTH': length,
            'STRCAT': strcat, 'ITOA': itoa, 'RTOS': rtos, 'SUBSTR': substr, 'STRLEN': strlen, 'CHR': chr_, 'LOGAND': logand,
            'PRINC': princ, 'PROMPT': lambda s: princ(s), 'TERPRI': lambda: princ('\n'), 'WRITE-LINE': write_line, 'OPEN': open_, 'CLOSE': close,
            'GETVAR': getvar, 'GETENV': getenv, 'SSGET': ssget, 'SSLENGTH': sslength, 'SSNAME': ssname, 'ENTGET': entget, 'ENTNEXT': entnext,
            'GETSTRING': getstring, 'COMMAND': command,
        }
        return b


특별 = {'QUOTE', 'SETQ', 'DEFUN', 'IF', 'COND', 'WHILE', 'REPEAT', 'FOREACH', 'PROGN', 'AND', 'OR'}


# ───────────────────────── 가짜 도면(오토캐드 entget 꼴) ─────────────────────────
P = Pair
Z = [210, 0.0, 0.0, 1.0]


def 머(종, h, la, 덧=None):
    return [P(0, 종), P(5, h), P(100, 'AcDbEntity'), P(67, 0), P(410, 'Model'), P(8, la)] + (덧 or [])


def 선(h, la, a, c):
    return 머('LINE', h, la, [P(100, 'AcDbLine'), [10, *map(float, a)], [11, *map(float, c)], list(Z)])


def 폴(h, la, 점, 닫=False, 높=0.0, 돌=None):
    o = 머('LWPOLYLINE', h, la, [P(100, 'AcDbPolyline'), P(90, len(점)), P(70, 1 if 닫 else 0), P(43, 0.0), P(38, float(높)), P(39, 0.0)])
    for p in 점:
        o += [[10, float(p[0]), float(p[1])], P(40, 0.0), P(41, 0.0), P(42, float(p[2]) if len(p) > 2 else 0.0), P(91, 0)]
    o.append([210, *(돌 or (0.0, 0.0, 1.0))])
    return o


def 옛폴(h, la, 점, 꼴=0, 틀점=()):
    머리 = 머('POLYLINE', h, la, [P(100, 'AcDb2dPolyline' if not 꼴 & 8 else 'AcDb3dPolyline'), P(66, 1), [10, 0.0, 0.0, 0.0], P(70, 꼴), P(40, 0.0), P(41, 0.0), list(Z)])
    vs = []
    for k, p in enumerate(점):
        vf = 32 if 꼴 & 8 else 0
        vs.append([P(0, 'VERTEX'), P(5, h + 'V' + str(k)), P(8, la), [10, float(p[0]), float(p[1]), float(p[3]) if len(p) > 3 else 0.0], P(40, 0.0), P(41, 0.0), P(42, float(p[2]) if len(p) > 2 else 0.0), P(70, vf), P(50, 0.0)])
        if k in 틀점:   # 스플라인 틀 점(꼴 16) — 그려지지 않음(빼야 함)
            vs.append([P(0, 'VERTEX'), P(5, h + 'S' + str(k)), P(8, la), [10, 99999.0, 99999.0, 0.0], P(40, 0.0), P(41, 0.0), P(42, 0.0), P(70, 16), P(50, 0.0)])
    return ('POLY', 머리, vs)


def 호(h, la, c, r, a0, a1, 돌=None):
    return 머('ARC', h, la, [P(100, 'AcDbCircle'), [10, float(c[0]), float(c[1]), 0.0], P(40, float(r)), [210, *(돌 or (0.0, 0.0, 1.0))], P(100, 'AcDbArc'), P(50, float(a0)), P(51, float(a1))])


def 원(h, la, c, r):
    return 머('CIRCLE', h, la, [P(100, 'AcDbCircle'), [10, float(c[0]), float(c[1]), 0.0], P(40, float(r)), list(Z)])


def 타(h, la, c, m, q, p0, p1):
    return 머('ELLIPSE', h, la, [P(100, 'AcDbEllipse'), [10, float(c[0]), float(c[1]), 0.0], [11, float(m[0]), float(m[1]), 0.0], list(Z), P(40, float(q)), P(41, float(p0)), P(42, float(p1))])


def 블(h, la, 이름, p, 열=0, 행=0):
    return 머('INSERT', h, la, [P(100, 'AcDbBlockReference'), P(2, 이름), [10, float(p[0]), float(p[1]), 0.0], P(41, 1.0), P(42, 1.0), P(43, 1.0), P(50, 0.0), P(70, 열), P(71, 행), P(44, 0.0), P(45, 0.0), list(Z)])


def 글(h, la, t, p):
    return 머('TEXT', h, la, [P(100, 'AcDbText'), [10, float(p[0]), float(p[1]), 0.0], P(40, 250.0), P(1, t), P(50, 0.0), P(41, 1.0), P(51, 0.0), P(7, 'Standard'), P(71, 0), P(72, 0), [11, 0.0, 0.0, 0.0], list(Z), P(100, 'AcDbText'), P(73, 0)])


def 여글(h, la, t, p):
    토 = [t[i:i + 250] for i in range(0, len(t), 250)] or ['']
    o = 머('MTEXT', h, la, [P(100, 'AcDbMText'), [10, float(p[0]), float(p[1]), 0.0], P(40, 250.0), P(41, 0.0), P(71, 1), P(72, 5)])
    o += [P(3, x) for x in 토[:-1]] + [P(1, 토[-1]), P(7, 'Standard'), list(Z), [11, 1.0, 0.0, 0.0], P(42, 100.0), P(43, 300.0), P(50, 0.0), P(73, 1), P(44, 1.0)]
    return o


def 치(h, la, a, c, 잰, 바꾼='', 꼴=1, 회전=None):
    o = 머('DIMENSION', h, la, [P(100, 'AcDbDimension'), P(2, '*D' + h), [10, float(c[0]), float(c[1]) + 500, 0.0], [11, 0.0, 0.0, 0.0], P(70, 꼴 | 32), P(1, 바꾼), P(71, 5), P(42, float(잰)), P(3, 'ISO-25'),
                                     P(100, 'AcDbAlignedDimension'), [13, float(a[0]), float(a[1]), 0.0], [14, float(c[0]), float(c[1]), 0.0]])
    if 회전 is not None:
        o += [P(50, float(회전)), P(100, 'AcDbRotatedDimension')]
    o.append(list(Z))
    return o


def 그밖(h, la, 종):
    return 머(종, h, la, [P(100, 'AcDb' + 종.title()), [10, 0.0, 0.0, 0.0], list(Z), P(2, 'ANSI31'), P(70, 0)])


π = math.pi
seg = lambda r, th: r * r / 2 * (th - math.sin(th))
th05 = 4 * math.atan(0.5)
r05 = 2000 / (2 * math.sin(th05 / 2))
def 둘레(a, b, t0=0.0, t1=2 * math.pi, n=200000):
    h = (t1 - t0) / n
    s = 0.0
    for i in range(n + 1):
        t = t0 + h * i
        f = math.sqrt(a * a * math.sin(t) ** 2 + b * b * math.cos(t) ** 2)
        s += f * (1 if i in (0, n) else 4 if i % 2 else 2)
    return s * h / 3


타원둘레 = 둘레(2000, 1000)

# (객체, 답) — 답: 갈래 · 길이(m) · 면적(㎡) · 개수 · 그 밖 표시
도면1 = [
    (선('A1', '외벽', (0, 0, 0), (10000, 0, 0)), {'갈래': '길이', '길이': 10.0, '치수': {'도면값': 9950, '다름': True}}),
    (선('A2', '외벽', (0, 0, 0), (3000, 4000, 500)), {'갈래': '길이', '길이': 5.0, '높이다름': True, '치수': None}),
    (선('A3', '외벽', (0, -500, 0), (5000, -500, 0)), {'갈래': '길이', '길이': 5.0, '치수': {'도면값': 5000, '다름': False}}),
    (폴('B1', '난간', [(0, 0, 1), (4000, 0, 0), (4000, 3000, 0)]), {'갈래': '길이', '길이': (π * 2000 + 3000) / 1000}),
    (폴('B2', '실', [(0, 0), (6000, 0), (6000, 4500), (0, 4500)], 닫=True), {'갈래': '면적', '면적': 27.0, '길이': 21.0, '글근거': '거실'}),
    (폴('B3', '실', [(20000, 0), (24000, 0), (24000, 2000, 1), (20000, 2000)], 닫=True), {'갈래': '면적', '면적': (8e6 + π * 2000 ** 2 / 2) / 1e6, '길이': (4000 + 2000 + π * 2000 + 2000) / 1000}),
    (폴('B4', '실', [(30000, 0), (30000, 2000), (32000, 2000), (32000, 0, 0.5)], 닫=True), {'갈래': '면적', '면적': (4e6 - seg(r05, th05)) / 1e6}),
    (호('C1', '호벽', (1000, 1000), 1000, math.radians(350), math.radians(10)), {'갈래': '길이', '길이': 1000 * math.radians(20) / 1000}),
    (원('C2', '기둥', (0, 0), 300), {'갈래': '면적', '면적': π * 0.09, '길이': 2 * π * 0.3}),
    (타('C3', '타원', (0, 0), (2000, 0), 0.5, 0, 2 * π), {'갈래': '면적', '면적': π * 2 * 1, '길이': 타원둘레 / 1000}),
    (타('C4', '타원', (0, 0), (2000, 0), 0.5, 0, π), {'갈래': '길이', '길이': 타원둘레 / 2000}),
    (블('D1', '문', 'D1', (1000, 0)), {'갈래': '개수', '개수': 1}),
    (블('D2', '창', 'W1', (0, 0), 2, 3), {'갈래': '개수', '개수': 6}),
    (블('D3', '가구', '*U12', (0, 0)), {'갈래': '개수', '개수': 1, '적요': '가구'}),
    (치('E1', '치수', (0, 0), (10000, 0), 10000, '9,950'), None),
    (치('E2', '치수', (0, -500), (5000, -500), 5000, '', 0, 0.0), None),
    (치('E3', '치수', (0, 0), (3000, 4000), 3000, '', 0, 0.0), None),
    (그밖('F1', '무늬', 'HATCH'), None),
    (그밖('F2', '곡선', 'SPLINE'), None),
    (폴('G1', '거울', [(1000, 0), (2000, 0), (2000, 1000), (1000, 1000)], 닫=True, 돌=(0.0, 0.0, -1.0)), {'갈래': '면적', '면적': 1.0, '첫점': (-1000, 0)}),
    (옛폴('H1', '옛선', [(0, 0), (1000, 0), (1000, 1000), (0, 1000)], 꼴=1, 틀점=(1,)), {'갈래': '면적', '면적': 1.0, '길이': 4.0}),
    (옛폴('H2', '3D선', [(0, 0, 0, 0), (3000, 0, 0, 0), (3000, 4000, 0, 1000)], 꼴=8), {'갈래': '길이', '길이': 7.0, '높이다름': True}),
    (옛폴('H3', '메시', [(0, 0), (1, 0), (1, 1)], 꼴=64), None),
    (호('H4', '기운호', (0, 0), 1000, 0, π / 2, 돌=(0.6, 0.0, 0.8)), None),
    (글('I1', '실이름', '거실', (3000, 2250)), None),
    (여글('I2', '실이름', '{\\fArial|b1;방1}\\P(18㎡)\t뒤' + '가' * 300, (-5000, -5000)), None),
]
셈못답 = 4   # HATCH · SPLINE · 메시 폴리선 · 기운 호


def 돌려(객체들, 글꼴='cp949', dimzin=0, 단위=4, 적요='', 날=2461359.73456, 앱=None, 미리=None, 도면이름=None):
    """kcm.lsp 를 불러 c:KCMS 를 돌림 → (csv 경로, txt 경로, 캐드)"""
    앱 = 앱 or tempfile.mkdtemp(prefix='kcms_app_')
    보내기 = os.path.join(앱, 'K-conmap', '연결', '보내기')
    os.makedirs(보내기, exist_ok=True)
    변수 = {'DATE': 날, 'DWGPREFIX': 'C:\\도면\\현장 가\\', 'DWGNAME': 도면이름 or '1층 평면도.dwg', 'INSUNITS': 단위, 'ACADVER': '24.3s (LMS Tech)', 'PRODUCT': 'AutoCAD', 'DWGTITLED': 1,
          '__APPDATA': 'C:\\Users\\시험\\AppData\\Roaming', '__ENV_APPDATA': 'C:\\Users\\시험\\AppData\\Roaming'}
    cad = 캐드([o for o, _ in 객체들] if 미리 is None else 미리, 변수, 앱, 글꼴, 적요, dimzin)
    lisp = 해석기(cad)
    원문 = io.open(리습, 'rb').read().decode('cp949')
    for e in 읽기(원문):
        lisp.셈(e)
    try:
        lisp.부름(lisp.찾기(Sym.of('C:KCMS')), [])
    except LispError as e:
        return None, None, cad, str(e)
    k = int(100000 * math.fmod(날, 1)) % 500
    return os.path.join(보내기, f'kcms_{k}.csv'), os.path.join(보내기, f'kcms_{k}.txt'), cad, None


풀기js = r'''
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
const [lib, 옵글, ...files] = process.argv.slice(2)
const m = await import(pathToFileURL(lib).href)
const 옵 = JSON.parse(옵글)
let 캐드 = { 묶음: [], 줄: [] }
const 알림 = []
for (const f of files) {
  const 글 = m.글풀기(readFileSync(f))
  const 읽 = m.고름읽기(글)
  if (!읽) { 알림.push(['머리 아님', f]); continue }
  const r = m.줄만들기(읽, { 이름: f.split('/').pop(), 있는핸들: m.있는핸들(캐드) })
  알림.push(r.알림)
  캐드 = m.묶음더하기(캐드, r).캐드
}
if (옵.단위) for (const b of 캐드.묶음) 캐드 = m.단위바꾸기(캐드, b.id, 옵.단위)
const C = m.캐드셈(캐드)
const 줄 = C.셈.map((x) => ({ 핸들: x.r.핸들, 종류: x.r.종류, 레이어: x.r.레이어, 갈래: x.r.갈래, 길이: x.길이, 면적: x.면적, 개수: x.개수, 수량: x.수량, 단위: x.단위, 빈칸: x.빈칸,
  글근거: x.r.글근거 || '', 적요: m.적요글(x.r, x.b), 치수: x.r.치수 || null, 높이다름: !!x.r.높이다름, 첫점: x.g && x.g.그림 ? x.g.그림[0] : null }))
console.log(JSON.stringify({ 줄, 묶음: 캐드.묶음, 알림, 합: C.합, 검사: C.검사, 머리: 캐드.묶음.map((b) => ({ 도면: b.도면, 캐드: b.캐드, 적요: b.적요 })) }))
'''


def 풀기(files, 옵=None):
    d = tempfile.mkdtemp(prefix='kcms_js_')
    p = os.path.join(d, '풀기.mjs')
    io.open(p, 'w', encoding='utf-8').write(풀기js)
    r = subprocess.run(['node', p, 라이브, json.dumps(옵 or {}), *files], capture_output=True, text=True, timeout=60)
    shutil.rmtree(d, ignore_errors=True)
    if r.returncode:
        print(r.stderr[:2000])
        raise SystemExit('node 풀기 실패')
    return json.loads(r.stdout)


def 견줌(결, 객체들, 꼬리=''):
    답표 = {}
    for o, 답 in 객체들:
        h = (o[1] if isinstance(o, tuple) else o)[1].d
        답표[h] = 답
    줄표 = {x['핸들']: x for x in 결['줄']}
    for h, 답 in 답표.items():
        x = 줄표.get(h)
        if 답 is None:
            봄(x is None, f'{h} 줄 없음(근거 · 셈 못 함){꼬리}')
            continue
        if not x:
            봄(False, f'{h} 줄이 있어야 함{꼬리}')
            continue
        ok = x['갈래'] == 답['갈래']
        글들 = [f"갈래 {x['갈래']}"]
        for 칸 in ('길이', '면적'):
            if 칸 in 답:
                ok = ok and x[칸] is not None and abs(x[칸] - 답[칸]) < 1e-6 * max(1, abs(답[칸])) + 1e-9
                글들.append(f'{칸} {x[칸]:.6f} = {답[칸]:.6f}' if x[칸] is not None else f'{칸} 없음')
        if '개수' in 답:
            ok = ok and x['개수'] == 답['개수']; 글들.append(f"개수 {x['개수']}")
        기 = {'길이': 답.get('길이'), '면적': 답.get('면적'), '개수': 답.get('개수')}[답['갈래'] if 답['갈래'] in ('길이', '면적', '개수') else '길이']
        if 기 is not None:
            ok = ok and x['수량'] is not None and abs(x['수량'] - round(기, 3)) < 0.0011
            글들.append(f"수량 {x['수량']}")
        if '높이다름' in 답:
            ok = ok and x['높이다름'] == 답['높이다름']; 글들.append('3D 선' if x['높이다름'] else '평면 선')
        if '글근거' in 답:
            ok = ok and x['글근거'] == 답['글근거']; 글들.append(f"안 글자 «{x['글근거']}»")
        if '적요' in 답:
            ok = ok and x['적요'] == 답['적요']; 글들.append(f"적요 «{x['적요']}»")
        if '치수' in 답:
            if 답['치수'] is None:
                ok = ok and x['치수'] is None; 글들.append('치수 안 견줌')
            else:
                ok = ok and x['치수'] is not None and abs(x['치수']['도면값'] - 답['치수']['도면값']) < 1e-6 and bool(x['치수'].get('다름')) == 답['치수']['다름']
                글들.append(f"치수 {x['치수'] and x['치수']['도면값']} {'다름' if x['치수'] and x['치수'].get('다름') else '같음'}")
        if '첫점' in 답:
            ok = ok and x['첫점'] and abs(x['첫점'][0] - 답['첫점'][0]) < 1e-6 and abs(x['첫점'][1] - 답['첫점'][1]) < 1e-6
            글들.append(f"첫 점 {x['첫점']}")
        봄(ok, f"{h} {x['종류']} — " + ' · '.join(글들) + 꼬리)


def main():
    print('📏 G685 KCMS 리습 흉내 시험 —', os.path.relpath(리습, 뿌리))
    원문b = io.open(리습, 'rb').read()
    try:
        원문 = 원문b.decode('cp949')
        봄(True, f'kcm.lsp 가 CP949 로 읽힘({len(원문b):,} 바이트)')
    except UnicodeDecodeError as e:
        봄(False, f'kcm.lsp CP949 아님 — {e}'); 원문 = 원문b.decode('cp949', 'replace')
    봄(원문b.count(b'\n') > 10 and (원문b.count(b'\r\n') in (0, 원문b.count(b'\n'))) and 원문b.count(b'\r') == 원문b.count(b'\r\n'), '줄바꿈 한 가지(CRLF 또는 LF — 캐드는 둘 다 읽음 · PC git 이 LF 로 둘 수 있음) · 섞이지 않음')
    봄('\ufffd' not in 원문 and not any(c in 원문 for c in '—«»→⇥'), 'CP949 에 없는 글자(— « » → ⇥) 없음')
    try:
        식들 = 읽기(원문)
        봄(True, f'괄호 · 글자 줄 짝 맞음 — 맨 위 식 {len(식들)}개')
    except SyntaxError as e:
        봄(False, f'읽기 실패 — {e}'); 식들 = []
    정의 = {e[1].n for e in 식들 if isinstance(e, list) and isinstance(e[0], Sym) and e[0].n == 'DEFUN'}
    봄({'C:KCM', 'C:KCMS'} <= 정의, '명령 KCM · KCMS 둘 다 정의됨')
    봄(not any(t in 원문.lower() for t in ('(vla-', '(vlax-', '(vl-', '(vlr-', 'load_dialog', 'new_dialog', '(dos_')), 'vla · vlax · vl- · DCL 안 씀(LT · ZWCAD · 캐디안)')
    # 쓰인 함수가 모두 흉내 해석기(= 순수 AutoLISP 몫)에 있나
    쓴 = set()

    def 훑(x):
        if not (isinstance(x, list) and x):
            return
        머리 = x[0].n if isinstance(x[0], Sym) else None
        if 머리 == 'QUOTE':
            return
        if 머리 == 'DEFUN':
            for y in x[3:]:
                훑(y)
            return
        if 머리 == 'COND':
            for 절 in x[1:]:
                for y in 절 or []:
                    훑(y)
            return
        if 머리 == 'SETQ':
            for y in x[2::2]:
                훑(y)
            return
        if 머리 == 'FOREACH':
            for y in x[2:]:
                훑(y)
            return
        if 머리:
            쓴.add(머리)
        else:
            훑(x[0])
        for y in x[1:]:
            훑(y)
    for e in 식들:
        훑(e)
    빈 = 해석기(캐드([], {}, '/tmp'))
    없음 = sorted(n for n in 쓴 if n not in 특별 and n not in 정의 and not isinstance(빈.찾기(Sym.of(n)), Builtin) and n not in ('/', 'QUOTE'))
    없음 = [n for n in 없음 if n != '*ERROR*']
    봄(not 없음, '쓰인 함수가 모두 알려진 AutoLISP 함수' + (f' — 모름: {없음}' if 없음 else ''))

    # ① 도면1 — CP949 · DIMZIN 0
    for 글꼴, dz in (('cp949', 0), ('utf-8', 12), ('utf-16', 0), ('cp949', 12)):
        꼬 = f' [{글꼴} · DIMZIN {dz}]'
        csv, txt, cad, 오 = 돌려(도면1, 글꼴=글꼴, dimzin=dz, 적요='')
        봄(오 is None, 'c:KCMS 가 멈추지 않고 끝남' + 꼬 + (f' — {오}' if 오 else ''))
        if 오:
            continue
        봄(os.path.isfile(csv) and os.path.isfile(txt), 'kcms_<번호>.csv · .txt 둘 다 씀' + 꼬)
        t = io.open(txt, encoding='utf-16' if 글꼴 == 'utf-16' else 글꼴).read().strip()
        봄(t.endswith('.csv') and t.split('\\')[-1] == os.path.basename(csv), 'txt 첫 줄 = csv 경로(프로그램 1.0 이 .csv 를 받음)' + 꼬)
        봄(all(not f.열림 for f in cad.열린), '연 파일을 모두 닫음' + 꼬)
        봄(any('적산컨맵으로 보냄' in s for s in cad.콘솔), '«적산컨맵으로 보냄» 알림' + 꼬)
        결 = 풀기([csv])
        b = 결['묶음'][0]
        봄(b['단위'] == 4 and b['도면'] == 'C:\\도면\\현장 가\\1층 평면도.dwg' and b['캐드'].startswith('AutoCAD'), f"머리 — 도면 «{b['도면']}» · 단위 mm · 캐드 «{b['캐드']}»" + 꼬)
        봄(b['받음'] == 26 and b['셈못'] == 셈못답, f"받음 {b['받음']} · 셈 못 함 {b['셈못']}(해치 · 스플라인 · 메시 · 기운 호)" + 꼬)
        견줌(결, 도면1, 꼬)
        if 글꼴 == 'cp949' and dz == 0:
            x = [y for y in 결['줄'] if y['핸들'] == 'B2'][0]
            봄(x['적요'] == '거실', '닫힌 선 안 글자 «거실» 이 적요(근거)')
            raw = io.open(csv, 'rb').read()
            줄들 = raw.decode('cp949').split('\r\n')[:-1]
            봄(len(줄들) == 27 and len(줄들[0].split('\t')) == 8 and all(len(z.split('\t')) == 9 for z in 줄들[1:]), f'csv = 머리 1(8칸) + 객체 26줄(9칸 — 글자 속 탭은 빈칸으로) · {len(줄들)}줄')
            i2 = [z for z in 줄들 if z.split('\t')[2] == 'I2'][0]
            봄('{\\fArial|b1;방1}\\P(18㎡) 뒤' + '가' * 300 in i2, 'MTEXT 250자 넘는 글 — (3 . 앞 토막) + (1 . 끝 토막) 이어 붙임 · 꾸밈은 그대로 보냄(건설맵이 뗌)')
            알 = ' '.join(결['알림'][0])
            봄('셈할 수 없는 객체 4개' in 알 and '해치 1' in 알 and '스플라인 1' in 알 and '그물(메시) 폴리선 1' in 알 and '기울어진(3D) 객체 1' in 알, '셈 못 한 것을 갈래별로 알림 — ' + 알[:120])
            봄('치수 글자와 그려진 길이가 다른 선 1줄' in 알, '치수 다름 1줄 알림')

    # ② 같은 것을 두 번 보내면 두 번째는 다 뺌
    csv1, _, _, _ = 돌려(도면1, 날=2461359.10001)
    csv2, _, _, _ = 돌려(도면1, 날=2461359.20002)
    결 = 풀기([csv1, csv2])
    봄(len(결['줄']) == len(풀기([csv1])['줄']) and 결['묶음'][1]['두번'] == len(풀기([csv1])['줄']), f"같은 도면 · 핸들 두 번 → 둘째 묶음 «이미 받은 객체 {결['묶음'][1]['두번']}개» 뺌")

    # ③ m 도면 · 단위 없음
    도면m = [(폴('M1', '실', [(0, 0), (6, 0), (6, 4.5), (0, 4.5)], 닫=True), {'갈래': '면적', '면적': 27.0, '길이': 21.0})]
    csv, _, _, _ = 돌려(도면m, 단위=6)
    견줌(풀기([csv]), 도면m, ' [m 도면]')
    csv, _, _, _ = 돌려(도면m[:0] + [(폴('N1', '실', [(0, 0), (6000, 0), (6000, 4500), (0, 4500)], 닫=True), None)], 단위=0)
    결 = 풀기([csv])
    봄(결['줄'][0]['수량'] is None and '도면 단위' in 결['줄'][0]['빈칸'] and 결['검사']['단위없음'] == 1, '단위(INSUNITS 0) 없으면 수량 ❓ · «도면 단위» 빈칸 · 짐작 안 함')
    결 = 풀기([csv], {'단위': 4})
    봄(abs(결['줄'][0]['수량'] - 27.0) < 1e-9, f"단위를 mm 로 고르면 27 ㎡ (다시 받지 않고 원에서 다시 셈) — {결['줄'][0]['수량']}")

    # ④ 적요 · 고른 것 없음 · 5,000개 넘음 · 프로그램 안 켬(보내기 폴더 없음)
    csv, _, _, _ = 돌려(도면m, 단위=6, 적요='2층 바닥\t미장')
    결 = 풀기([csv])
    봄(결['머리'][0]['적요'] == '2층 바닥 미장' and 결['줄'][0]['적요'] == '2층 바닥 미장', f"캐드에서 적은 적요 «{결['머리'][0]['적요']}» (탭 → 빈칸)")
    _, _, cad, 오 = 돌려([], 미리=[])
    봄(오 is None and any('고른 것이 없습니다' in s for s in cad.콘솔), '고른 것 없음 → «고른 것이 없습니다» · 파일 안 씀')
    많 = [선('Z' + format(i, 'X'), '선', (0, i, 0), (1, i, 0)) for i in range(5001)]
    csv, txt, cad, 오 = 돌려([], 미리=많)
    봄(오 is None and any('너무 많습니다(5001개)' in s for s in cad.콘솔) and not os.path.exists(txt), '5,001개 → «너무 많습니다» · 보내지 않음')
    앱 = tempfile.mkdtemp(prefix='kcms_noapp_')
    변 = 해석기(캐드([선('Q1', '선', (0, 0, 0), (1, 0, 0))], {'DATE': 2461359.5, 'DWGPREFIX': 'C:\\', 'DWGNAME': 'a.dwg', 'INSUNITS': 4, '__APPDATA': 'C:\\Users\\시험\\AppData\\Roaming', '__ENV_APPDATA': 'C:\\Users\\시험\\AppData\\Roaming'}, 앱))
    for e in 읽기(원문):
        변.셈(e)
    변.부름(변.찾기(Sym.of('C:KCMS')), [])
    봄(any('프로그램을 먼저 켜 주십시오' in s for s in 변.cad.콘솔), '보내기 폴더가 없으면(프로그램을 한 번도 안 켬) «프로그램을 먼저 켜 주십시오»')

    # ⑤ 리습이 틀리면 잡는지 — strcat 에 nil 이 들어가게 바꾼 리습
    틀린 = 원문.replace('(kcms-s (getvar "PRODUCT"))', '(getvar "PRODUCTX")')
    앱 = tempfile.mkdtemp(prefix='kcms_bad_')
    os.makedirs(os.path.join(앱, 'K-conmap', '연결', '보내기'))
    cad = 캐드([선('Q1', '선', (0, 0, 0), (1, 0, 0))], {'DATE': 2461359.5, 'DWGPREFIX': 'C:\\', 'DWGNAME': 'a.dwg', 'INSUNITS': 4, '__APPDATA': 'C:\\Users\\시험\\AppData\\Roaming', '__ENV_APPDATA': 'C:\\Users\\시험\\AppData\\Roaming'}, 앱)
    변 = 해석기(cad)
    for e in 읽기(틀린):
        변.셈(e)
    try:
        변.부름(변.찾기(Sym.of('C:KCMS')), [])
        잡음 = False
    except LispError as e:
        잡음 = 'stringp' in str(e)
    봄(잡음 and any('[KCMS] 멈춤' in s for s in cad.콘솔) and all(not f.열림 for f in cad.열린), '(시험의 시험) strcat 에 nil → 해석기가 «bad argument type: stringp» 로 잡고 지역 *error* 가 파일을 닫음')

    # ⑥ KCM(1.0 그대로) — 저장 뒤 도면 경로 한 줄
    앱 = tempfile.mkdtemp(prefix='kcm_')
    os.makedirs(os.path.join(앱, 'K-conmap', '연결', '보내기'))
    cad = 캐드([], {'DATE': 2461359.25, 'DWGPREFIX': 'C:\\도면\\', 'DWGNAME': '평면.dwg', 'DWGTITLED': 1, '__APPDATA': 'C:\\Users\\시험\\AppData\\Roaming', '__ENV_APPDATA': 'C:\\Users\\시험\\AppData\\Roaming'}, 앱)
    변 = 해석기(cad)
    for e in 읽기(원문):
        변.셈(e)
    변.부름(변.찾기(Sym.of('C:KCM')), [])
    낸 = os.listdir(os.path.join(앱, 'K-conmap', '연결', '보내기'))
    봄(cad.명령 == [('_.QSAVE',)] and len(낸) == 1 and 낸[0].startswith('kcm_') and io.open(os.path.join(앱, 'K-conmap', '연결', '보내기', 낸[0]), encoding='cp949').read().strip() == 'C:\\도면\\평면.dwg', 'KCM(1.0 그대로) — QSAVE 뒤 «kcm_<번호>.txt» 에 도면 경로')

    print(f'\n결과: {len(됨)} 통과 · {len(틀)} 틀림')
    if 틀:
        for t in 틀:
            print('  ✗', t)
        sys.exit(1)


if __name__ == '__main__':
    if '--csv' in sys.argv:
        # 화면 시험(tools/시험_캐드고름화면.mjs)이 씀 — 리습이 실제로 쓴 csv 를 그 자리에 둠: --csv <낼 곳> [--단위 4] [--글꼴 cp949] [--날 2461359.5]
        a = sys.argv
        낼 = a[a.index('--csv') + 1]
        단위 = int(a[a.index('--단위') + 1]) if '--단위' in a else 4
        글꼴 = a[a.index('--글꼴') + 1] if '--글꼴' in a else 'cp949'
        날 = float(a[a.index('--날') + 1]) if '--날' in a else 2461359.5
        도면이름 = a[a.index('--도면') + 1] if '--도면' in a else None
        csv, txt, cad, 오 = 돌려(도면1, 글꼴=글꼴, 단위=단위, 날=날, 도면이름=도면이름)
        if 오:
            raise SystemExit('리습 멈춤: ' + 오)
        shutil.copyfile(csv, 낼)
        print(낼)
    else:
        main()
