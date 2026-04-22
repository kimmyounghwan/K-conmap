import streamlit as st
import pandas as pd
import requests
import pyrebase
import urllib3
import urllib.parse
from datetime import datetime, timedelta, timezone
import time
import re

# ==========================================
# 1. 보안 및 페이지 설정
# ==========================================
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
st.set_page_config(page_title="K-건설맵 Master", layout="wide", initial_sidebar_state="expanded")

st.markdown("""
    <head>
        <meta name="naver-site-verification" content="bfb3f10bce2983b4dd5974ba39d05e3ce5225e73" />
        <meta name="description" content="K-건설맵: 전국 건설 공사 입찰 및 실시간 1순위 개찰 결과를 즉시 확인하세요.">
    </head>
    <style>
        .stApp[data-teststate="running"] .stAppViewBlockContainer { filter: none !important; opacity: 1 !important; }
        [data-testid="stStatusWidget"] { visibility: hidden !important; display: none !important; }
        .stApp { transition: none !important; }
        .main-title { background-color: #1e3a8a; color: white; border-radius: 10px; font-weight: 900; font-size: 28px; text-align: center; padding: 20px; margin-bottom: 25px; }
        .stat-card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center; margin-bottom: 10px; }
        .stat-label { font-size: 13px; color: #64748b; font-weight: 600; margin-bottom: 4px; }
        .stat-val { font-size: 17px; font-weight: 800; color: #1e3a8a; }
        .calc-badge { font-size: 10px; color: #ea580c; font-weight: 700; margin-top: 3px; }
    </style>
""", unsafe_allow_html=True)

KST = timezone(timedelta(hours=9))

# ==========================================
# 2. 파이어베이스
# ==========================================
firebaseConfig = {
    "apiKey": "AIzaSyB5uvAzUIbEDTTbxwflTQk3wdzOufc4SE0",
    "authDomain": "k-conmap.firebaseapp.com",
    "databaseURL": "https://k-conmap-default-rtdb.firebaseio.com",
    "projectId": "k-conmap",
    "storageBucket": "k-conmap.firebasestorage.app",
    "messagingSenderId": "230642116525",
    "appId": "1:230642116525:web:f6f3765cf9a7273ba92324"
}
G2B_API_KEY = "13610863df3680cc4e7c70a64d752b37485535929bfa514f4ad4d71ea56e4ccb"
SAFE_API_KEY = urllib.parse.unquote(G2B_API_KEY)


@st.cache_resource
def init_firebase():
    firebase = pyrebase.initialize_app(firebaseConfig)
    return firebase.auth(), firebase.database()


auth, db = init_firebase()

for k, v in [('logged_in', False), ('user_name', ""), ('user_license', ""), ('user_phone', ""), ('localId', ""),
             ('idToken', "")]:
    if k not in st.session_state: st.session_state[k] = v

# ==========================================
# 3. 유틸리티 함수 (에러 났던 함수 완벽 복구!)
# ==========================================
REGION_LIST = ["전국(전체)", "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종", "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남",
               "제주"]
ALL_LICENSES = ["[종합] 건축공사업", "[종합] 토목공사업", "[종합] 토목건축공사업", "[종합] 조경공사업", "[전문] 지반조성·포장공사업", "[전문] 실내건축공사업",
                "[전문] 철근·콘크리트공사업", "[기타] 전기공사업", "[기타] 정보통신공사업", "[기타] 소방시설공사업"]
BASE = 'http://apis.data.go.kr/1230000'

API_TABLE = {
    'cnstwk': {'notice': f'{BASE}/ad/BidPublicInfoService/getBidPblancListInfoCnstwk',
               'result': f'{BASE}/as/ScsbidInfoService/getOpengResultListInfoCnstwk',
               'detail': f'{BASE}/as/ScsbidInfoService/getOpengResultListInfoCnstwkDtl'},
    'etcwk': {'notice': f'{BASE}/ad/BidPublicInfoService/getBidPblancListInfoEtcwk',
              'result': f'{BASE}/as/ScsbidInfoService/getOpengResultListInfoEtcwk',
              'detail': f'{BASE}/as/ScsbidInfoService/getOpengResultListInfoEtcwkDtl'},
    'servc': {'notice': f'{BASE}/ad/BidPublicInfoService/getBidPblancListInfoServc',
              'result': f'{BASE}/as/ScsbidInfoService/getOpengResultListInfoServc',
              'detail': f'{BASE}/as/ScsbidInfoService/getOpengResultListInfoServcDtl'},
    'goods': {'notice': f'{BASE}/ad/BidPublicInfoService/getBidPblancListInfoThng',
              'result': f'{BASE}/as/ScsbidInfoService/getOpengResultListInfoThng',
              'detail': f'{BASE}/as/ScsbidInfoService/getOpengResultListInfoThngDtl'},
}


# 에러 원인 1: 삭제됐던 get_bid_type 복구
def get_bid_type(bid_no: str) -> str:
    code = bid_no.strip().upper()
    if len(code) < 5: return 'cnstwk'
    return {'CW': 'cnstwk', 'BK': 'etcwk', 'EW': 'etcwk', 'SV': 'servc', 'GD': 'goods'}.get(code[3:5], 'cnstwk')


# 에러 원인 2: 삭제됐던 filter_by_region 복구
def filter_by_region(df, sel):
    if sel == "전국(전체)": return df
    rk = {"서울": ["서울"], "부산": ["부산"], "대구": ["대구"], "인천": ["인천"], "광주": ["광주"], "대전": ["대전"], "울산": ["울산"],
          "세종": ["세종"], "경기": ["경기", "경기도"], "강원": ["강원", "강원도"], "충북": ["충북", "충청북도"], "충남": ["충남", "충청남도"],
          "전북": ["전북", "전라북도"], "전남": ["전남", "전라남도"], "경북": ["경북", "경상북도"], "경남": ["경남", "경상남도"], "제주": ["제주"]}
    pat = '|'.join(rk.get(sel, [sel]))
    return df[df['발주기관'].str.contains(pat, na=False) | df['공고명'].str.contains(pat, na=False)]


def raw_to_int(raw) -> int:
    if raw is None: return 0
    r = str(raw).strip().replace(',', '').replace('원', '').replace('%', '')
    try:
        return int(float(r))
    except:
        return 0


def fmt_amt(v: int) -> str:
    return f"{v:,}원" if v > 0 else ''


def get_match_keywords(lic):
    k = []
    if "토목" in lic: k.extend(["토목", "도로", "포장", "하천", "교량", "정비", "관로", "상수도", "하수도"])
    if "건축" in lic: k.extend(["건축", "신축", "증축", "보수", "인테리어", "방수", "도장"])
    if "조경" in lic: k.extend(["조경", "식재", "공원", "수목"])
    if "전기" in lic: k.extend(["전기", "배전", "가로등", "CCTV"])
    if "통신" in lic: k.extend(["통신", "네트워크", "방송"])
    if "소방" in lic: k.extend(["소방", "화재", "스프링클러"])
    if "철근" in lic or "콘크리트" in lic: k.extend(["철콘", "구조물", "옹벽", "배수", "기초"])
    return list(set(k))


def _safe_list(obj):
    if not obj: return []
    if isinstance(obj, list): return obj
    if isinstance(obj, dict):
        item = obj.get('item')
        return item if isinstance(item, list) else [item] if isinstance(item, dict) else [obj]
    return []


def _api_get(url: str, params: dict, timeout: int = 3) -> list:
    try:
        r = requests.get(url, params={**params, 'serviceKey': SAFE_API_KEY, 'type': 'json'}, verify=False,
                         timeout=timeout)
        if r.status_code == 200:
            body = r.json().get('response', {}).get('body', {}).get('items', [])
            if isinstance(body, dict): return [body.get('item', {})]
            return body if isinstance(body, list) else []
    except:
        pass
    return []


def get_stats():
    try:
        t_v = db.child("stats").child("total_visits").get().val() or 1828
        u_v = db.child("users").get().val()
        return t_v, len(u_v) if u_v else 0
    except:
        return 1828, 0


def update_stats():
    try:
        if 'visited' not in st.session_state:
            t_v = (db.child("stats").child("total_visits").get().val() or 1828) + 1
            db.child("stats").update({"total_visits": t_v})
            st.session_state['visited'] = True
    except:
        pass


# ==========================================
# 4. 데이터 팝업창 (Modal Dialog) 함수
# ==========================================
@st.dialog("📋 K-건설맵 정밀 리포트", width="large")
def show_analysis_dialog(row, det, mode="1st"):
    if mode == "1st":
        st.markdown(f"### {row['공고명']}")
        m1, m2, m3, m4 = st.columns(4)

        def _card(col, icon, label, val, key, val_color="#1e3a8a"):
            badge = {'API': '✓ 공식', 'CALC': '🧮 추정'}.get(det['sources'].get(key, ''), '')
            col.markdown(
                f'<div class="stat-card"><div class="stat-label">{icon} {label}</div><div class="stat-val" style="color:{val_color};">{val if val else "-"}</div><div class="calc-badge">{badge}</div></div>',
                unsafe_allow_html=True)

        _card(m1, "💰", "기초금액", det['bss_amt'], 'bss')
        _card(m2, "📐", "추정가격", det['est_price'], 'est')
        _card(m3, "🎯", "예정가격", det['pre_amt'], 'pre')
        _card(m4, "🏆", "낙찰금액", det['suc_amt'], 'suc', "#dc2626")

        if 'CALC' in det['sources'].values():
            st.caption("* 🧮 표시는 수학 공식(기초금액≈추정가격×1.1 또는 예정가격 역산)에 의한 참고용 추정치입니다.")

        if det['corps']:
            st.write("**[개찰 결과 성적표]**")
            st.dataframe(pd.DataFrame(det['corps']), use_container_width=True, hide_index=True)

        sc1, sc2 = st.columns(2)
        with sc1:
            st.markdown("💡 **나라장터 정책상 번호 복사가 필요합니다.**")
            st.code(row['공고번호'], language=None)
        with sc2:
            st.write("")
            st.link_button("🚀 나라장터 홈페이지", "https://www.g2b.go.kr/index.jsp", use_container_width=True)
            # 업체 네이버 검색 완벽 부활!
            st.link_button("🏢 업체 네이버 검색", f"https://search.naver.com/search.naver?query={row['1순위업체']} 건설",
                           use_container_width=True)

    else:  # 실시간 공고 시뮬레이터
        st.markdown(f"### 🎯 입찰 시뮬레이터")
        st.write(f"**공고명:** {row['공고명']}")
        budget = int(row['예산금액'])

        sim_base_val = budget
        base_label = "예산금액"

        try:
            bid_no_live = str(row['공고번호']).split('-')[0].strip()
            r = requests.get(f'{BASE}/ad/BidPublicInfoService/getBidPblancListInfoCnstwk',
                             params={'serviceKey': SAFE_API_KEY, 'numOfRows': '1', 'pageNo': '1', 'inqryDiv': '2',
                                     'bidNtceNo': bid_no_live, 'type': 'json'}, verify=False, timeout=3)
            if r.status_code == 200:
                items = _safe_list(r.json().get('response', {}).get('body', {}).get('items', []))
                if items:
                    d = items[0]
                    b_val = raw_to_int(d.get('bssAmt', 0))
                    e_val = raw_to_int(d.get('presmptPrce', 0))
                    if b_val > 0:
                        sim_base_val, base_label = b_val, "기초금액 (조달청 발표)"
                    elif e_val > 0:
                        sim_base_val, base_label = int(e_val * 1.1), "기초금액 (추정가격×1.1 역산)"
        except:
            pass

        c1, c2 = st.columns(2)
        with c1:
            sim_base = st.number_input(base_label, value=sim_base_val, step=1000000)
        with c2:
            sim_rate = st.selectbox("투찰 하한율 (%)", ["87.745", "86.745", "87.995", "89.995"])

        st.write("---")
        st.write("💡 **나노 AI 추천 투찰금액 (사정률 5구간)**")
        tr_cols = st.columns(5)
        rates, labels = [99.0, 99.5, 100.0, 100.5, 101.0], ["❄️ 99.0%", "🌬️ 99.5%", "🌤️ 100.0%", "☀️ 100.5%",
                                                            "🔥 101.0%"]
        for i, r in enumerate(rates):
            with tr_cols[i]:
                price = int(sim_base * (r / 100.0) * (float(sim_rate) / 100.0))
                st.info(f"**{labels[i]}**\n\n**{price:,}원**")
        st.caption("⚠️ A값(공제비용) 미반영 순수 산술식입니다. 실제 투찰 시 공고문 확인 필수!")


# ==========================================
# 5. 데이터 수집 엔진
# ==========================================
@st.cache_data(ttl=60, show_spinner=False)
def get_hybrid_1st_bids():
    now = datetime.now(KST)
    s_dt = (now - timedelta(days=5)).strftime('%Y%m%d')
    e_dt = now.strftime('%Y%m%d')
    api_items = _api_get(f'{BASE}/as/ScsbidInfoService/getOpengResultListInfoCnstwk',
                         {'numOfRows': '999', 'pageNo': '1', 'inqryDiv': '1', 'inqryBgnDt': s_dt + '0000',
                          'inqryEndDt': e_dt + '2359'})
    api_items.extend(_api_get(f'{BASE}/as/ScsbidInfoService/getOpengResultListInfoEtcwk',
                              {'numOfRows': '999', 'pageNo': '1', 'inqryDiv': '1', 'inqryBgnDt': s_dt + '0000',
                               'inqryEndDt': e_dt + '2359'}))

    db_data = db.child("archive_1st").order_by_key().limit_to_last(4000).get().val() or {}
    db_items = list(db_data.values()) if isinstance(db_data, dict) else []
    new_rows = {}
    for it in api_items:
        bid_no = it.get('bidNtceNo', '')
        info = str(it.get('opengCorpInfo', '')).split('|')[0].split('^')
        if len(info) > 1 and info[0].strip():
            new_rows[bid_no] = {'1순위업체': info[0].strip(), '공고번호': bid_no, '공고차수': it.get('bidNtceOrd', '00'),
                                '날짜': it.get('opengDt', ''), '공고명': it.get('bidNtceNm', ''),
                                '발주기관': it.get('ntceInsttNm', ''),
                                '투찰금액': f"{int(float(info[3])):,}원" if len(info) > 3 else '-',
                                '투찰률': f"{info[4]}%" if len(info) > 4 else '-', '전체업체': it.get('opengCorpInfo', '')}
    if new_rows: db.child("archive_1st").update(new_rows)
    df = pd.DataFrame(list(new_rows.values()) + db_items)
    if not df.empty:
        df = df.drop_duplicates(subset=['공고번호']).copy()
        df['dt'] = pd.to_datetime(df['날짜'], errors='coerce')
        df = df.sort_values(by='dt', ascending=False)
        df['날짜'] = df['dt'].dt.strftime('%m-%d %H:%M')
    return df


@st.cache_data(ttl=180, show_spinner=False)
def get_hybrid_live_bids():
    now = datetime.now(KST)
    s_dt = now.strftime('%Y%m%d')
    api_items = _api_get(f'{BASE}/ad/BidPublicInfoService/getBidPblancListInfoCnstwk',
                         {'numOfRows': '999', 'pageNo': '1', 'inqryDiv': '1', 'inqryBgnDt': s_dt + '0000',
                          'inqryEndDt': s_dt + '2359', 'bidNtceNm': '공사'})
    api_items.extend(_api_get(f'{BASE}/ad/BidPublicInfoService/getBidPblancListInfoEtcwk',
                              {'numOfRows': '999', 'pageNo': '1', 'inqryDiv': '1', 'inqryBgnDt': s_dt + '0000',
                               'inqryEndDt': s_dt + '2359', 'bidNtceNm': '공사'}))

    db_data = db.child("archive_live").order_by_key().limit_to_last(4000).get().val() or {}
    db_items = list(db_data.values()) if isinstance(db_data, dict) else []
    new_rows = {
        it.get('bidNtceNo'): {'공고번호': it.get('bidNtceNo'), '공고일자': it.get('bidNtceDt'), '공고명': it.get('bidNtceNm'),
                              '발주기관': it.get('ntceInsttNm'), '예산금액': int(float(it.get('bdgtAmt', 0))),
                              '상세보기': it.get('bidNtceDtlUrl', "https://www.g2b.go.kr/index.jsp")} for it in api_items if
        it.get('bidNtceNo')}
    if new_rows: db.child("archive_live").update(new_rows)
    df = pd.DataFrame(list(new_rows.values()) + db_items)
    if not df.empty:
        df = df.drop_duplicates(subset=['공고번호']).copy()
        df['dt'] = pd.to_datetime(df['공고일자'], errors='coerce')
        df = df.sort_values(by='dt', ascending=False)
        df['공고일자'] = df['dt'].dt.strftime('%m-%d %H:%M')
    return df


def fetch_detail(row):
    bid_no = str(row['공고번호']).strip()
    res = {'bss_amt': '', 'est_price': '', 'pre_amt': '', 'sources': {}}

    bid_type = get_bid_type(bid_no)
    urls = API_TABLE.get(bid_type, API_TABLE['cnstwk'])

    items = _api_get(urls['notice'], {'numOfRows': '5', 'pageNo': '1', 'inqryDiv': '2', 'bidNtceNo': bid_no})
    if items:
        d = items[0]
        res['bss_amt'] = fmt_amt(raw_to_int(d.get('bssAmt')))
        res['est_price'] = fmt_amt(raw_to_int(d.get('presmptPrce')))
        if res['bss_amt']: res['sources']['bss'] = 'API'
        if res['est_price']: res['sources']['est'] = 'API'

    suc_v = raw_to_int(row.get('투찰금액', ''))
    rate_s = str(row.get('투찰률', '')).replace('%', '').strip()
    rate_v = float(rate_s) if rate_s and rate_s != '-' else 0

    if suc_v > 0 and rate_v > 0:
        res['pre_amt'] = fmt_amt(int(round(suc_v / (rate_v / 100.0))))
        res['sources']['pre'] = 'CALC'
        if not res['bss_amt']:
            if raw_to_int(res['est_price']) > 0:
                res['bss_amt'] = fmt_amt(int(round(raw_to_int(res['est_price']) * 1.1)))
            else:
                res['bss_amt'] = res['pre_amt']
            res['sources']['bss'] = 'CALC'

    if not res['est_price'] and res['bss_amt']:
        res['est_price'] = fmt_amt(int(round(raw_to_int(res['bss_amt']) / 1.1)))
        res['sources']['est'] = 'CALC'

    res['suc_amt'] = row.get('투찰금액', '-')

    corps = []
    corp_raw = row.get('전체업체', '')
    if not corp_raw:
        result_items = _api_get(urls['result'], {'numOfRows': '1', 'pageNo': '1', 'inqryDiv': '1', 'bidNtceNo': bid_no})
        if result_items:
            corp_raw = result_items[0].get('opengCorpInfo', '')

    if corp_raw:
        for idx, c in enumerate(str(corp_raw).split('|')[:10]):
            p = c.split('^')
            if len(p) >= 5: corps.append(
                {'순위': f"{idx + 1}위", '업체명': p[0].strip(), '투찰금액': f"{int(float(p[3])):,}원", '투찰률': f"{p[4].strip()}%"})
    res['corps'] = corps
    return res


# ==========================================
# 6. UI 대시보드
# ==========================================
try:
    t_v = db.child("stats").child("total_visits").get().val() or 1828
except:
    t_v = 1828
try:
    u_v = len(db.child("users").get().val() or {})
except:
    u_v = 0
st.markdown('<div class="main-title">🏛️ K-건설맵 Master</div>', unsafe_allow_html=True)

c1, c2, c3, c4 = st.columns(4)
with c1: st.markdown(
    f'<div class="stat-card"><div class="stat-label">📅 오늘 날짜</div><div class="stat-val">{datetime.now(KST).strftime("%Y-%m-%d")}</div></div>',
    unsafe_allow_html=True)
with c2: st.markdown(
    f'<div class="stat-card"><div class="stat-label">📈 누적 방문</div><div class="stat-val">{t_v:,}명</div></div>',
    unsafe_allow_html=True)
with c3: st.markdown(
    f'<div class="stat-card"><div class="stat-label">👥 전체 회원수</div><div class="stat-val">{u_v:,}명</div></div>',
    unsafe_allow_html=True)
with c4: st.markdown(
    f'<div class="stat-card"><div class="stat-label">🔔 가동 상태</div><div class="stat-val" style="color:green;">정상 가동 중</div></div>',
    unsafe_allow_html=True)

with st.sidebar:
    st.write(f"### 👷 {'👋 ' + st.session_state['user_name'] + ' 소장님' if st.session_state['logged_in'] else 'K-건설맵 메뉴'}")
    menu = st.radio("업무 선택", ["🏆 1순위 현황판", "📊 실시간 공고 (홈)", "📁 K-건설 자료실", "💬 K건설챗", "👤 내 정보/로그인"])
    st.write("---")
    if st.button("🔄 만능 데이터 새로고침"): st.cache_data.clear(); st.rerun()
    if st.session_state['logged_in'] and st.button("🚪 로그아웃"):
        for k in ['logged_in', 'user_name', 'user_license', 'user_phone', 'localId', 'idToken']: st.session_state[
            k] = ""
        st.session_state['logged_in'] = False;
        st.rerun()

# ==========================================
# 7. 메인 라우팅
# ==========================================
ROWS_PER_PAGE = 20

if menu == "🏆 1순위 현황판":
    st.markdown("#### 🏆 실시간 1순위 현황판")
    st.markdown(
        "<div style='color:#475569; font-size:13px; margin-bottom:12px;'>💡 <b>이용 안내:</b> 리스트 왼쪽의 사각형을 클릭하면 상세 리포트가 <b>팝업창</b>으로 열립니다.</div>",
        unsafe_allow_html=True)

    df_w = get_hybrid_1st_bids()
    if not df_w.empty:
        # 업체 검색 부활!
        col_filter1, col_filter2 = st.columns([1, 2])
        with col_filter1:
            selected_region_1st = st.selectbox("🌍 지역 필터링", REGION_LIST, key="reg1")
        with col_filter2:
            search_co = st.text_input("🏢 업체명 검색", placeholder="낙찰된 업체명을 입력하세요 (예: 신광건설)")

        df_f = filter_by_region(df_w, selected_region_1st)
        if search_co: df_f = df_f[df_f['1순위업체'].str.contains(search_co, na=False)]

        num_pages = max(1, (len(df_f) // ROWS_PER_PAGE) + (1 if len(df_f) % ROWS_PER_PAGE > 0 else 0))
        if "p1" not in st.session_state: st.session_state["p1"] = 1
        if st.session_state["p1"] > num_pages: st.session_state["p1"] = 1

        start_idx = (st.session_state["p1"] - 1) * ROWS_PER_PAGE
        df_page = df_f.iloc[start_idx: start_idx + ROWS_PER_PAGE]

        event = st.dataframe(df_page[['1순위업체', '날짜', '공고명', '발주기관', '투찰금액', '투찰률']], use_container_width=True,
                             hide_index=True, height=750, selection_mode="single-row", on_select="rerun")

        st.write("")
        c_p1, c_p2, c_p3 = st.columns([3, 4, 3])
        with c_p2:
            in1, in2 = st.columns([1.5, 1])
            with in1: st.markdown(
                f"<div style='text-align:right; font-size:14px; color:#475569; padding-top:5px;'>페이지 이동 (총 {num_pages}쪽)</div>",
                unsafe_allow_html=True)
            with in2: st.selectbox("p1", range(1, num_pages + 1), key="p1", label_visibility="collapsed")

        if len(event.selection.rows) > 0:
            selected_row = df_page.iloc[event.selection.rows[0]]
            with st.spinner("📡 분석 중..."):
                det = fetch_detail(selected_row)
            show_analysis_dialog(selected_row, det, mode="1st")

elif menu == "📊 실시간 공고 (홈)":
    st.markdown("#### 📊 실시간 입찰 공고")
    st.markdown(
        "<div style='color:#475569; font-size:13px; margin-bottom:12px;'>💡 <b>이용 안내:</b> 리스트 왼쪽의 사각형을 클릭하면 입찰 시뮬레이터가 <b>팝업창</b>으로 열립니다.</div>",
        unsafe_allow_html=True)

    df_live = get_hybrid_live_bids()
    if not df_live.empty:
        df_f = filter_by_region(df_live, st.selectbox("🌍 지역 필터링", REGION_LIST, key="reg2"))
        col_cfg = {"상세보기": st.column_config.LinkColumn("상세보기", display_text="공고보기"),
                   "예산금액": st.column_config.NumberColumn("예산(원)", format="%,d")}

        if st.session_state['logged_in']:
            t1, t2 = st.tabs(["🌐 전체 공고", "✨ 내 면허 맞춤매칭"])
            with t1:
                num_pages_all = max(1, (len(df_f) // ROWS_PER_PAGE) + (1 if len(df_f) % ROWS_PER_PAGE > 0 else 0))
                if "p_live_all" not in st.session_state: st.session_state["p_live_all"] = 1
                if st.session_state["p_live_all"] > num_pages_all: st.session_state["p_live_all"] = 1

                start_idx_all = (st.session_state["p_live_all"] - 1) * ROWS_PER_PAGE
                df_page_all = df_f.iloc[start_idx_all: start_idx_all + ROWS_PER_PAGE]

                event_all = st.dataframe(df_page_all[['공고번호', '공고일자', '공고명', '발주기관', '예산금액', '상세보기']],
                                         use_container_width=True, hide_index=True, height=750, column_config=col_cfg,
                                         selection_mode="single-row", on_select="rerun", key="live_all")

                st.write("")
                c_p1, c_p2, c_p3 = st.columns([3, 4, 3])
                with c_p2:
                    in1, in2 = st.columns([1.5, 1])
                    with in1: st.markdown(
                        f"<div style='text-align:right; font-size:14px; color:#475569; padding-top:5px;'>페이지 이동 (총 {num_pages_all}쪽)</div>",
                        unsafe_allow_html=True)
                    with in2: st.selectbox("p_live_all", range(1, num_pages_all + 1), key="p_live_all",
                                           label_visibility="collapsed")

            with t2:
                kw = get_match_keywords(st.session_state.get('user_license', ''))
                matched_full = df_f[df_f['공고명'].str.contains('|'.join(kw), na=False)] if kw else df_f

                num_pages_m = max(1, (len(matched_full) // ROWS_PER_PAGE) + (
                    1 if len(matched_full) % ROWS_PER_PAGE > 0 else 0))
                if "p_live_m" not in st.session_state: st.session_state["p_live_m"] = 1
                if st.session_state["p_live_m"] > num_pages_m: st.session_state["p_live_m"] = 1

                start_idx_m = (st.session_state["p_live_m"] - 1) * ROWS_PER_PAGE
                df_page_m = matched_full.iloc[start_idx_m: start_idx_m + ROWS_PER_PAGE]

                event_m = st.dataframe(df_page_m[['공고번호', '공고일자', '공고명', '발주기관', '예산금액', '상세보기']],
                                       use_container_width=True, hide_index=True, height=750, column_config=col_cfg,
                                       selection_mode="single-row", on_select="rerun", key="live_match")

                st.write("")
                c_p1, c_p2, c_p3 = st.columns([3, 4, 3])
                with c_p2:
                    in1, in2 = st.columns([1.5, 1])
                    with in1: st.markdown(
                        f"<div style='text-align:right; font-size:14px; color:#475569; padding-top:5px;'>페이지 이동 (총 {num_pages_m}쪽)</div>",
                        unsafe_allow_html=True)
                    with in2: st.selectbox("p_live_m", range(1, num_pages_m + 1), key="p_live_m",
                                           label_visibility="collapsed")

            if len(event_m.selection.rows) > 0:
                selected_row_l = df_page_m.iloc[event_m.selection.rows[0]]
                show_analysis_dialog(selected_row_l, None, mode="live")
            elif len(event_all.selection.rows) > 0:
                selected_row_l = df_page_all.iloc[event_all.selection.rows[0]]
                show_analysis_dialog(selected_row_l, None, mode="live")

        else:
            num_pages_g = max(1, (len(df_f) // ROWS_PER_PAGE) + (1 if len(df_f) % ROWS_PER_PAGE > 0 else 0))
            if "p_live_g" not in st.session_state: st.session_state["p_live_g"] = 1
            if st.session_state["p_live_g"] > num_pages_g: st.session_state["p_live_g"] = 1

            start_idx_g = (st.session_state["p_live_g"] - 1) * ROWS_PER_PAGE
            df_page_g = df_f.iloc[start_idx_g: start_idx_g + ROWS_PER_PAGE]

            selected_event = st.dataframe(df_page_g[['공고번호', '공고일자', '공고명', '발주기관', '예산금액', '상세보기']],
                                          use_container_width=True, hide_index=True, height=750, column_config=col_cfg,
                                          selection_mode="single-row", on_select="rerun", key="live_guest")

            st.write("")
            c_p1, c_p2, c_p3 = st.columns([3, 4, 3])
            with c_p2:
                in1, in2 = st.columns([1.5, 1])
                with in1: st.markdown(
                    f"<div style='text-align:right; font-size:14px; color:#475569; padding-top:5px;'>페이지 이동 (총 {num_pages_g}쪽)</div>",
                    unsafe_allow_html=True)
                with in2: st.selectbox("p_live_g", range(1, num_pages_g + 1), key="p_live_g",
                                       label_visibility="collapsed")

            if len(selected_event.selection.rows) > 0:
                selected_row_l = df_page_g.iloc[selected_event.selection.rows[0]]
                show_analysis_dialog(selected_row_l, None, mode="live")

elif menu == "👤 내 정보/로그인":
    st.subheader("👤 회원 정보 관리")
    if not st.session_state['logged_in']:
        t1, t2 = st.tabs(["🔑 로그인", "📝 회원가입"])
        with t1:
            le = st.text_input("이메일", key="log_e")
            lp = st.text_input("비밀번호", type="password", key="log_p")
            if st.button("로그인"):
                try:
                    user = auth.sign_in_with_email_and_password(le.strip().lower(), lp)
                    info = db.child("users").child(user['localId']).get().val() or {}
                    st.session_state.update({'logged_in': True, 'user_name': info.get('name', '소장님'),
                                             'user_license': info.get('license', ''),
                                             'user_phone': info.get('phone', ''), 'localId': user['localId'],
                                             'idToken': user['idToken']})
                    st.rerun()
                except:
                    pass
        with t2:
            re = st.text_input("가입용 이메일", key="reg_e")
            rp = st.text_input("비번 (6자 이상)", type="password", key="reg_p")
            rn = st.text_input("성함", key="reg_n")
            rph = st.text_input("전화번호", key="reg_ph")
            rl = st.multiselect("보유 면허 (매칭용)", ALL_LICENSES, key="reg_l")
            if st.button("가입하기"):
                try:
                    u = auth.create_user_with_email_and_password(re.strip().lower(), rp)
                    db.child("users").child(u['localId']).set(
                        {"name": rn, "phone": rph, "license": ", ".join(rl), "email": re.strip().lower()})
                    st.success("🎉 가입 성공! 로그인해 주세요.")
                except:
                    st.error("가입 실패! 형식을 확인하세요.")
    else:
        st.write(f"### {st.session_state['user_name']} 소장님, 반갑습니다!")
        if st.button("🚪 로그아웃"):
            for k in ['logged_in', 'user_name', 'user_license', 'user_phone', 'localId', 'idToken']: st.session_state[
                k] = ""
            st.session_state['logged_in'] = False;
            st.rerun()
        if st.button("⚠️ 회원 탈퇴"):
            db.child("users").child(st.session_state['localId']).remove()
            auth.delete_user_account(st.session_state['idToken'])
            st.session_state.clear();
            st.rerun()

elif menu == "📁 K-건설 자료실":
    st.subheader("📁 K-건설 자료실")
    if st.session_state['logged_in']:
        with st.expander("✏️ 새 자료 등록"):
            t, c = st.text_input("제목"), st.text_area("내용")
            if st.button("등록") and t and c:
                db.child("posts").push({"author": st.session_state['user_name'], "title": t, "content": c,
                                        "time": datetime.now(KST).strftime("%Y-%m-%d %H:%M")})
                st.rerun()
    posts = db.child("posts").get().val()
    if posts:
        for k, p in reversed(list(posts.items())):
            with st.expander(f"📢 {p['title']} (작성자: {p['author']})"): st.write(p['content'])

elif menu == "💬 K건설챗":
    st.subheader("💬 실시간 현장 소통")
    if st.session_state['logged_in']:
        chat_box = st.container(height=400)
        chats_data = db.child("k_chat").get().val()
        if chats_data:
            for v in list(chats_data.values())[-20:]: chat_box.write(f"**{v['author']}**: {v['message']}")
        if msg := st.chat_input("메시지 입력"):
            db.child("k_chat").push(
                {"author": st.session_state['user_name'], "message": msg, "time": datetime.now(KST).strftime("%H:%M")})
            st.rerun()
    else:
        st.info("로그인 후 이용 가능합니다.")