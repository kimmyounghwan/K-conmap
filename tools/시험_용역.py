# -*- coding: utf-8 -*-
"""📐 svc.py 시험 (G194) — 조달청을 부르지 않고 가짜 응답으로 돌립니다.

  python tools/시험_용역.py
확인하는 것
  ① 개찰 · 공고 · 기초금액 세 오퍼레이션이 «용역» 주소로만 불린다(공사 주소 0번)
  ② 화면 파일(svc-first · svc-live) 이름이 공사(first · live)와 겹치지 않는다
  ③ 색인 n번째 = 묶음을 이어붙인 n번째 (검색이 엉뚱한 공고를 가리키지 않게)
  ④ 기초금액이 공고 · 개찰 둘 다에 붙고, 공고 → 개찰 이어붙임(하한율 · 지역)
  ⑤ 2시간 안에 다시 돌리면 조달청 0번 · --days 를 주면 바로 받음
  ⑥ «하루 몫 끝» 이면 그 회차는 멈추고, 못 받은 날은 다음 회차가 다시 받음
  ⑦ 7주 안의 빈 날을 회차마다 --catchup 개씩 메움
  ⑧ 500건이 넘으면 묶음이 둘 이상 · 지난번보다 줄면 남는 옛 묶음을 지움
"""
import json, os, shutil, sys, tempfile
from datetime import datetime, timedelta

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import collect as C   # noqa: E402
import svc as S       # noqa: E402

ok = fail = 0
def check(cond, msg):
    global ok, fail
    if cond:
        ok += 1; print('  ✓', msg)
    else:
        fail += 1; print('  ✗', msg)

calls = []
PER_DAY = {"first": 3, "live": 4}
BIG = {"n": 0}            # 0 이 아니면 하루 공고를 그만큼(묶음 나눔 시험)
QUOTA_AFTER = {"n": None}  # 이만큼 부르면 «하루 몫 끝»
BSIS_FAIL = {"on": False}  # 기초금액만 실패

def fake_fetch(url, key, day=None, extra=None, label="", why=None):
    if C.QUOTA_OUT or C.NET_DOWN:          # 진짜 collect.fetch 처럼 — 차단기가 내려가면 부르지 않음
        return []
    calls.append(url)
    if QUOTA_AFTER["n"] is not None and len(calls) > QUOTA_AFTER["n"]:
        C.QUOTA_OUT = True
        if why is not None:
            why.update({"quota": 1})
        return []
    d = day.strftime("%Y%m%d")
    if url.endswith(("getOpengResultListInfoServc", "getOpengResultListInfoThng")):
        return [{"bidNtceNo": f"R26BK{d}{i:03d}", "bidNtceOrd": "000", "bidNtceNm": f"광양시 하천 기본설계 용역 {d}-{i}",
                 "ntceInsttNm": "전라남도 광양시", "opengDt": f"{d[:4]}-{d[4:6]}-{d[6:]} 1{i}:00:00", "prtcptCnum": str(5 + i),
                 "opengCorpInfo": f"(주)가나엔지니어링^1234567890^홍길동^{98000000 + i}^87.{745 + i}"}
                for i in range(PER_DAY["first"])]
    if url.endswith(("getBidPblancListInfoServc", "getBidPblancListInfoThng")):
        n = BIG["n"] or PER_DAY["live"]
        return [{"bidNtceNo": (f"R26BK{d}{i:03d}" if i < PER_DAY["first"] else f"R26BL{d}{i:04d}"), "bidNtceOrd": "000",
                 "bidNtceNm": f"순천시 도로 실시설계 용역 {d}-{i}", "ntceInsttNm": "전라남도 순천시" if i % 2 else "경상남도 진주시",
                 "bidNtceDt": f"{d[:4]}-{d[4:6]}-{d[6:]} 09:{i % 60:02d}:00", "bidClseDt": "2026-10-20 10:00:00",
                 "presmptPrce": str(100000000 + i), "sucsfbidLwltRate": "87.745", "prtcptPsblRgnNm": "전라남도",
                 "bidprcPsblIndstrytyNm": "엔지니어링사업(토목)", "cntrctCnclsMthdNm": "제한경쟁", "bidNtceDtlUrl": "https://www.g2b.go.kr/x",
                 # 💰 G194d — 0 · 1 번은 복수예가 적격심사(셀 수 있음) · 2 번은 비예가 · 3 번은 협상(기초금액도 없음)
                 "prearngPrceDcsnMthdNm": "비예가" if i % 4 == 2 else "복수예가",
                 "sucsfbidMthdNm": "협상에의한계약-협상에 의한 낙찰자 결정" if i % 4 == 3 else "적격심사제-추정가격이 2억원 미만 1억원 이상인"}
                for i in range(n)]
    if url.endswith(("getBidPblancListInfoServcBsisAmount", "getBidPblancListInfoThngBsisAmount")):
        if BSIS_FAIL['on']:
            if why is not None:
                why.update({'http': 500})
            return []
        return [{"bidNtceNo": f"R26BK{d}{i:03d}", "bssamt": str(110000000 + i), "rsrvtnPrceRngBgnRate": "-2",
                 "rsrvtnPrceRngEndRate": "2"} for i in range(2)]
    return []

C.fetch = fake_fetch
C.load_env = lambda: None
C.api_key = lambda: "TEST"
C.time.sleep = lambda s: None

tmp = tempfile.mkdtemp(prefix='svc_')
C.STORE = os.path.join(tmp, 'store'); C.OUT = os.path.join(tmp, 'out')
os.makedirs(os.path.join(C.OUT, 'board'))
# 공사 파일이 이미 있다고 치고 — 안 건드리는지 봅니다
con = os.path.join(C.OUT, 'board', 'first.json'); open(con, 'w').write('{"keep":1}')

print('① 처음 — --days 3')
os.makedirs(os.path.join(C.OUT, 'board'), exist_ok=True); open(os.path.join(C.OUT, 'board', 'svc-first-serv-rank-0.json'), 'w').write('[]')   # 옛 순위 파일이 남아 있어도 지우는지
S.main(['--days', '3', '--kind', 'serv'])
B = os.path.join(C.OUT, 'board')
check(all('Servc' in u for u in calls), f'용역 주소만 불림 ({len(calls)}번)')
check(len(calls) == 9, f'3일 × 3 오퍼레이션 = 9번 (실제 {len(calls)})')
check(open(con).read() == '{"keep":1}', '공사 first.json 안 건드림')
names = sorted(os.listdir(B))
check(all(n.startswith(('svc-', 'first.json')) for n in names), f'화면 파일 이름이 svc- 로 시작 ({len(names)}개)')
mf = json.load(open(os.path.join(B, 'svc-first.json'))); ml = json.load(open(os.path.join(B, 'svc-live.json')))
check(mf['serv']['n'] == 9 and ml['serv']['n'] == 12, f"1순위 9 · 공고 12 (실제 {mf['serv']['n']} · {ml['serv']['n']})")
p0 = json.load(open(os.path.join(B, 'svc-first-serv-0.json')))
check(all('corps' not in r for r in p0), '묶음에서 순위(corps)는 뺌')
check(not any(n.startswith('svc-first-serv-rank') for n in os.listdir(B)), '순위 파일은 안 구움(화면이 안 씀)')
check(all('ceo' not in r for r in p0) and p0[0].get('win') == '(주)가나엔지니어링', '묶음에 대표자 이름 없음 · 1순위 업체는 있음')
withbase = [r for r in p0 if r.get('base')]
check(len(withbase) == 6, f'기초금액이 개찰 줄에 붙음 (하루 2건 × 3일 = 6 · 실제 {len(withbase)})')
check(all(r.get('llr') == 87.745 for r in p0), '공고 → 개찰 이어붙임: 하한율')
ixf = json.load(open(os.path.join(B, 'svc-first-serv-idx.json')))
check(ixf['f'] == ['name', 'inst', 'win', 'sido', 'np'] and [a[4] for a in ixf['r']] == [int(r.get('np') or 0) for r in p0], '1순위 색인 칸(+ np 참가업체 수 · 묶음과 같은 차례)')
ix = json.load(open(os.path.join(B, 'svc-live-serv-idx.json')))
l0 = json.load(open(os.path.join(B, 'svc-live-serv-0.json')))
check(ix['f'] == ['name', 'inst', 'sido', 'est', 'close', 'c'], '공고 색인 칸(+ c 바로투찰)')
print('💰 G194d 바로투찰 판정 · 사정률 실측')
l0c = [r for r in l0]
want = [0 if S.calc_why(r) else 1 for r in l0c]
check([a[5] for a in ix['r']] == want, f"색인 c = calc_why 와 같음 (셀 수 있는 공고 {sum(want)}건)")
check(sum(want) == 6 and ml['serv'].get('calc') == 6, f"셀 수 있는 공고 = 기초금액 있고 복수예가 · 적격 6건 (실제 {sum(want)} · meta {ml['serv'].get('calc')})")
check(S.calc_why({'swin': '협상에의한계약', 'pmth': '복수예가', 'llr': 88, 'base': 1, 'lo': -2, 'hi': 2}) == '협상', 'calc_why 협상')
check(S.calc_why({'swin': '수의시담-수의시담', 'pmth': '복수예가', 'llr': 88, 'base': 1, 'lo': -2, 'hi': 2}) == '시담', 'calc_why 수의시담')
check(S.calc_why({'swin': '소액수의견적', 'pmth': '단일예가', 'llr': 88, 'base': 1, 'lo': -2, 'hi': 2}) == '예가', 'calc_why 단일예가')
check(S.calc_why({'swin': '규격가격동시입찰', 'pmth': '복수예가', 'llr': None, 'base': 1, 'lo': -2, 'hi': 2}) == '하한율', 'calc_why 하한율 없음')
check(S.calc_why({'swin': '적격심사제', 'pmth': '복수예가', 'llr': 87.745, 'base': 0, 'lo': -2, 'hi': 2}) == '기초', 'calc_why 기초금액 공개 전')
check(S.calc_why({'swin': '적격심사제', 'pmth': '복수예가', 'llr': 87.745, 'base': 5, 'lo': None, 'hi': 2}) == '범위', 'calc_why 예가 범위 없음')
check(S.calc_why({'swin': '소액수의견적', 'pmth': '복수예가', 'llr': 88, 'base': 5, 'lo': -3, 'hi': 3}) == '', 'calc_why 소액수의견적(복수예가 · 하한율 · 기초) = 셀 수 있음')
sj = mf['serv'].get('sj') or {}
exp = 98000000 / 0.87745 / 110000000 * 100
check(sj.get('n') == 6 and abs(sj.get('p50', 0) - exp) < 0.01, f"사정률 실측: 복수예가 · 2곳+ 개찰 6건 · 가운데 {sj.get('p50')} ≈ {exp:.3f}")
check(S.sj_stats([{'base': 100, 'amt': 88, 'rate': 88, 'np': 1, 'pmth': '복수예가'}]) is None, '사정률 실측: 단독 1곳은 뺌')
check(S.sj_stats([{'base': 100, 'amt': 88, 'rate': 88, 'np': 3, 'pmth': '단일예가'}]) is None, '사정률 실측: 단일예가는 뺌')
check(S.sj_stats([{'base': 100, 'amt': 88, 'rate': 80, 'np': 3, 'pmth': '복수예가'}]) is None, '사정률 실측: 94~106 밖(110%)은 뺌')
check([a[0] for a in ix['r']] == [r['name'] for r in l0], '③ 색인 차례 = 묶음 차례')
check({a[2] for a in ix['r']} == {'전남', '경남'}, f"지역: {sorted({a[2] for a in ix['r']})}")
check(ml['serv']['rgns'].get('전남') == 6, f"목록표 지역 건수 전남 6 (실제 {ml['serv']['rgns'].get('전남')})")

print('⑤ 2시간 안에 다시 — 조달청 0번')
calls.clear(); S.main(['--kind', 'serv'])
check(len(calls) == 0, f'안 부름 (실제 {len(calls)}번)')
check(json.load(open(os.path.join(B, 'svc-first.json')))['serv']['n'] == 9, '화면 파일은 그대로 다시 구움')

print('⑦ 2시간 지난 정기 회차 — 최근 2일 + 빈 날 7일')
st = S.load('serv', 'first'); st['_lastrun'] = (datetime.utcnow() - timedelta(hours=3)).isoformat(timespec='seconds') + '+00:00'; S.save('serv', 'first', st)
calls.clear(); S.main(['--kind', 'serv'])
check(len(calls) == 27, f'(2 + 7)일 × 3 = 27번 (실제 {len(calls)})')
st = S.load('serv', 'first')
check(len(st['days']) == 10, f"받은 날 기록 10일 (3 + 7 · 실제 {len(st['days'])})")

print('⑥ 하루 몫 끝 — 멈추고 못 받은 날은 남김')
st['_lastrun'] = (datetime.utcnow() - timedelta(hours=3)).isoformat(timespec='seconds') + '+00:00'; S.save('serv', 'first', st)
calls.clear(); QUOTA_AFTER['n'] = 7; C.QUOTA_OUT = False      # 최근 2일(6번)은 받고, 메우는 첫 날 중간에 몫 끝
S.main(['--kind', 'serv'])
st2 = S.load('serv', 'first')
check(C.QUOTA_OUT and len(calls) == 8, f'몫 끝에서 멈춤 (부른 {len(calls)}번 — 6 + 메우는 날 2번째에서)')
check(len(st2['days']) == 10, f"반만 받은 날은 «받음» 으로 안 적음 (기록 {len(st2['days'])}일 그대로)")
QUOTA_AFTER['n'] = None; C.QUOTA_OUT = False
st2['_lastrun'] = (datetime.utcnow() - timedelta(hours=3)).isoformat(timespec='seconds') + '+00:00'; S.save('serv', 'first', st2)
calls.clear(); S.main(['--kind', 'serv'])
check(len(S.load('serv', 'first')['days']) == 17, f"다음 회차가 그날부터 다시 메움 (기록 {len(S.load('serv', 'first')['days'])}일 = 10 + 7)")

print('⑧ 500건 넘는 날 — 묶음 둘 · 줄면 옛 묶음 지움')
shutil.rmtree(C.STORE); calls.clear(); BIG['n'] = 700
S.main(['--days', '1', '--kind', 'serv'])
ml = json.load(open(os.path.join(B, 'svc-live.json')))
check(ml['serv']['parts'] == 2 and os.path.exists(os.path.join(B, 'svc-live-serv-1.json')), f"공고 700건 → 묶음 {ml['serv']['parts']}")
ix = json.load(open(os.path.join(B, 'svc-live-serv-idx.json')))
p1 = json.load(open(os.path.join(B, 'svc-live-serv-1.json')))
check(ix['r'][500][0] == p1[0]['name'], '색인 500번째 = 1번 묶음 첫 줄')
shutil.rmtree(C.STORE); BIG['n'] = 0
S.main(['--days', '1', '--kind', 'serv'])
check(not os.path.exists(os.path.join(B, 'svc-live-serv-1.json')) or json.load(open(os.path.join(B, 'svc-live-serv-1.json'))) == [], '줄어든 뒤 1번 묶음 지움')

print('--exportonly — 조달청 0번 · 저장소 안 바꿈')
calls.clear(); S.main(['--exportonly', '--kind', 'serv'])
check(len(calls) == 0, '안 부름')

print('📦 물품 — --kind thng · goods- 파일 · Thng 주소만')
shutil.rmtree(C.STORE); calls.clear()
S.main(['--days', '2', '--kind', 'thng'])
check(len(calls) == 6 and all(u.endswith(('Thng', 'ThngBsisAmount')) for u in calls), f'물품 주소만 2일 × 3 = 6번 (실제 {len(calls)})')
check(os.path.exists(os.path.join(B, 'goods-first.json')) and os.path.exists(os.path.join(B, 'goods-live-thng-0.json')), '화면 파일 goods-first · goods-live-thng-0')
mg = json.load(open(os.path.join(B, 'goods-live.json')))
check('thng' in mg and mg['thng']['n'] == 8, f"물품 목록표 thng · 공고 8 (실제 {mg.get('thng', {}).get('n')})")
check(json.load(open(os.path.join(B, 'svc-live.json')))['serv']['n'] > 0, '물품을 받아도 용역 파일은 그대로')
print('both — --kind all 은 용역 · 물품 둘 다')
shutil.rmtree(C.STORE); calls.clear()
S.main(['--days', '1'])
check(sum(1 for u in calls if 'Servc' in u) == 3 and sum(1 for u in calls if 'Thng' in u) == 3, f'둘 다 1일 × 3 (실제 {len(calls)})')
print('기초금액만 실패해도 그날은 «받음»')
shutil.rmtree(C.STORE); calls.clear(); BSIS_FAIL['on'] = True
S.main(['--days', '2', '--kind', 'thng'])
check(len(S.load('thng', 'first')['days']) == 2, f"기초금액 실패해도 2일 기록 (실제 {len(S.load('thng', 'first')['days'])})")
BSIS_FAIL['on'] = False

shutil.rmtree(tmp)
print(f'\n시험 {ok + fail}개 — 통과 {ok} · 틀림 {fail}')
sys.exit(1 if fail else 0)
