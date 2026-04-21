import streamlit as st
import pandas as pd
import requests
import pyrebase
import urllib3
import urllib.parse
from datetime import datetime, timedelta, timezone

# ==========================================
# 1. 보안 및 페이지 설정
# ==========================================
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
st.set_page_config(page_title="K-건설맵 Master", layout="wide", initial_sidebar_state="expanded")

# [디자인 수술] 명환이가 원한 아담한 글씨 크기(17px)와 깔끔한 카드 레이아웃 복구
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
        .stat-card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; text-align: center; } 
        .stat-val { font-size: 17px; font-weight: 700; color: #1e3a8a; } /* 글자 크기 17px로 최적화 */
        .info-box { background-color: #eff6ff; border-left: 4px solid #2563eb; border-radius: 6px; padding: 14px 18px; margin: 10px 0; }
    </style>
""", unsafe_allow_html=True)

KST = timezone(timedelta(hours=9))

# ==========================================
# 2. 파이어베이스 및 API 설정 (명환이 고유 키)
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

if 'logged_in' not in st.session_state: st.session_state['logged_in'] = False
if 'user_name' not in st.session_state: st.session_state['user_name'] = ""
if 'user_license' not in st.session_state: st.session_state['user_license'] = ""


# ==========================================
# 3. 유틸리티 함수 (NameError 방지를 위해 상단 배치)
# ==========================================
def safe_fmt_amt(raw):
    r = str(raw).strip()
    if not r or r in ('0', 'None', 'nan', 'NaN', ''): return "미발표"
    try:
        return f"{int(float(r)):,}원"
    except:
        return r


def safe_str(raw, default="정보없음"):
    r = str(raw).strip()
    return r if r and r not in ('None', 'nan', 'NaN', '') else default


# [픽스] 지역 필터링 함수를 상단에 두어 NameError 원천 차단
def filter_by_region(df, selected_region):
    if selected_region == "전국(전체)": return df
    region_keywords = {"서울": ["서울"], "부산": ["부산"], "대구": ["대구"], "인천": ["인천"], "광주": ["광주"], "대전": ["대전"], "울산": ["울산"],
                       "세종": ["세종"], "경기": ["경기", "경기도"], "강원": ["강원", "강원도"], "충북": ["충북", "충청북도"],
                       "충남": ["충남", "충청남도"], "전북": ["전북", "전라북도"], "전남": ["전남", "전라남도"], "경북": ["경북", "경상북도"],
                       "경남": ["경남", "경상남도"], "제주": ["제주"]}
    pattern = '|'.join(region_keywords.get(selected_region, [selected_region]))
    return df[df['발주기관'].str.contains(pattern, na=False) | df['공고명'].str.contains(pattern, na=False)]


# 면허 매칭 키워드 로직
def get_match_keywords(license_str):
    k = []
    if "토목" in license_str: k.extend(["토목", "도로", "포장", "하천", "교량", "정비", "관로", "상수도", "하수도"])
    if "건축" in license_str: k.extend(["건축", "신축", "증축", "보수", "인테리어", "방수", "도장"])
    if "조경" in license_str: k.extend(["조경", "식재", "공원", "수목", "놀이터"])
    if "전기" in license_str: k.extend(["전기", "배전", "가로등", "CCTV"])
    if "통신" in license_str: k.extend(["통신", "네트워크", "방송", "선로"])
    if "소방" in license_str: k.extend(["소방", "화재", "스프링클러"])
    if "철근" in license_str or "콘크리트" in license_str: k.extend(["철콘", "구조물", "옹벽", "배수", "기초"])
    return list(set(k))


# ==========================================
# 4. 통계 및 데이터 엔진 (보물 데이터 복구)
# ==========================================
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


@st.cache_data(ttl=180, show_spinner=False)
def get_hybrid_1st_bids():
    now = datetime.now(KST)
    s_dt = (now - timedelta(days=2)).strftime('%Y%m%d')
    url = 'http://apis.data.go.kr/1230000/as/ScsbidInfoService/getOpengResultListInfoCnstwk'
    try:
        params = {'serviceKey': SAFE_API_KEY, 'numOfRows': '999', 'pageNo': '1', 'inqryDiv': '1',
                  'inqryBgnDt': s_dt + '0000', 'type': 'json'}
        res = requests.get(url, params=params, verify=False, timeout=20)
        api_items = res.json().get('response', {}).get('body', {}).get('items', []) if res.status_code == 200 else []
    except:
        api_items = []

    # [15일 확장] 최근 4000개 데이터를 가져와서 풍성하게 보여줌
    db_data = db.child("archive_1st").order_by_key().limit_to_last(4000).get().val() or {}
    db_items = list(db_data.values()) if isinstance(db_data, dict) else []

    new_rows = {}
    if isinstance(api_items, dict): api_items = api_items.get('item', [api_items])
    for item in (api_items if isinstance(api_items, list) else []):
        try:
            bid_no = item.get('bidNtceNo', '')
            info = str(item.get('opengCorpInfo', '')).split('|')[0].split('^')
            if len(info) > 1 and info[0].strip():
                new_rows[bid_no] = {
                    '1순위업체': info[0].strip(), '공고번호': bid_no, '공고차수': item.get('bidNtceOrd', '00'),
                    '날짜': item.get('opengDt', ''), '공고명': item.get('bidNtceNm', ''),
                    '발주기관': item.get('ntceInsttNm', ''),
                    '투찰금액': f"{int(float(info[3])):,}원" if len(info) > 3 else '-',
                    '투찰률': f"{info[4]}%" if len(info) > 4 else '-', '전체업체': item.get('opengCorpInfo', '')
                }
        except:
            continue
    if new_rows: db.child("archive_1st").update(new_rows)
    df = pd.DataFrame(list(new_rows.values()) + db_items)
    if not df.empty:
        df = df.drop_duplicates(subset=['공고번호']).copy()
        df['dt'] = pd.to_datetime(df['날짜'], errors='coerce')
        df = df.sort_values(by='dt', ascending=False)
        df['날짜'] = df['dt'].dt.strftime('%m-%d %H:%M')
    return df


@st.cache_data(ttl=300, show_spinner=False)
def get_hybrid_live_bids():
    now = datetime.now(KST)
    url = 'http://apis.data.go.kr/1230000/ad/BidPublicInfoService/getBidPblancListInfoCnstwk'
    try:
        res = requests.get(url, params={'serviceKey': SAFE_API_KEY, 'numOfRows': '999', 'pageNo': '1', 'inqryDiv': '1',
                                        'inqryBgnDt': now.strftime('%Y%m%d') + '0000', 'type': 'json'}, verify=False,
                           timeout=15)
        api_items = res.json().get('response', {}).get('body', {}).get('items', []) if res.status_code == 200 else []
    except:
        api_items = []

    db_data = db.child("archive_live").order_by_key().limit_to_last(4000).get().val() or {}
    db_items = list(db_data.values()) if isinstance(db_data, dict) else []

    new_rows = {
        it.get('bidNtceNo'): {'공고번호': it.get('bidNtceNo'), '공고일자': it.get('bidNtceDt'), '공고명': it.get('bidNtceNm'),
                              '발주기관': it.get('ntceInsttNm'), '예산금액': int(float(it.get('bdgtAmt', 0) or 0)),
                              '상세보기': it.get('bidNtceDtlUrl', "https://www.g2b.go.kr/index.jsp")} for it in
        (api_items if isinstance(api_items, list) else [api_items]) if it.get('bidNtceNo')}
    if new_rows: db.child("archive_live").update(new_rows)

    df = pd.DataFrame(list(new_rows.values()) + db_items)
    if not df.empty:
        df = df.drop_duplicates(subset=['공고번호']).copy()
        df['dt'] = pd.to_datetime(df['공고일자'], errors='coerce')
        df = df.sort_values(by='dt', ascending=False)
        df['공고일자'] = df['dt'].dt.strftime('%m-%d %H:%M')
    return df


# ==========================================
# 5. ★ 상세 분석 엔진 (추정가격 복구) ★
# ==========================================
def fetch_bid_full_detail(bid_no, base_ord, row):
    headers = {"User-Agent": "Mozilla/5.0"}
    res_data = {"bss_amt": "미발표", "est_price": "미발표", "pre_amt": "미발표", "suc_amt": safe_str(row.get('투찰금액'), "미발표"),
                "corps": [], "has_detail": False}

    # [픽스] 추정가격(est_price) 수집 경로 재설정
    try:
        notice_url = 'http://apis.data.go.kr/1230000/ad/BidPublicInfoService/getBidPblancListInfoCnstwk'
        n_res = requests.get(notice_url,
                             params={'serviceKey': SAFE_API_KEY, 'numOfRows': '1', 'pageNo': '1', 'bidNtceNo': bid_no,
                                     'type': 'json'}, verify=False, timeout=8, headers=headers)
        if n_res.status_code == 200:
            n_data = n_res.json().get('response', {}).get('body', {}).get('items', {}).get('item', [])
            n_items = n_data if isinstance(n_data, list) else [n_data]
            if n_items and n_items[0]:
                ep_raw = str(n_items[0].get('presmptPrce', '')).strip()
                if ep_raw and ep_raw != '0': res_data["est_price"] = safe_fmt_amt(ep_raw)
    except:
        pass

    try:
        detail_url = 'http://apis.data.go.kr/1230000/as/ScsbidInfoService/getOpengResultListInfoCnstwkDtl'
        d_res = requests.get(detail_url,
                             params={'serviceKey': SAFE_API_KEY, 'numOfRows': '1', 'pageNo': '1', 'bidNtceNo': bid_no,
                                     'bidNtceOrd': base_ord, 'type': 'json'}, verify=False, timeout=8, headers=headers)
        if d_res.status_code == 200:
            d_data = d_res.json().get('response', {}).get('body', {}).get('items', {}).get('item', [])
            items = d_data if isinstance(d_data, list) else [d_data]
            if items and items[0]:
                d = items[0]
                bss_raw = str(d.get('bssAmt', '')).strip()
                if bss_raw and bss_raw != '0': res_data["bss_amt"] = safe_fmt_amt(bss_raw)
                pre_raw = str(d.get('exptPrce', '')).strip()
                if pre_raw and pre_raw != '0': res_data["pre_amt"] = safe_fmt_amt(pre_raw)
                suc_raw = str(d.get('sucsfbidAmt', '')).strip()
                if suc_raw and suc_raw != '0': res_data["suc_amt"] = safe_fmt_amt(suc_raw)
                res_data["has_detail"] = True
    except:
        pass

    corp_raw = row.get('전체업체', '')
    if corp_raw and isinstance(corp_raw, str):
        for idx, c in enumerate(corp_raw.split('|')[:10]):
            p = c.split('^')
            if len(p) >= 4: res_data['corps'].append(
                {'순위': f"{idx + 1}위", '업체명': p[0].strip(), '투찰금액': f"{int(float(p[3])):,}원", '투찰률': f"{p[4].strip()}%"})
    return res_data


# ==========================================
# 6. 메인 UI 대시보드
# ==========================================
update_stats()
t_visit, t_user = get_stats()

st.markdown('<div class="main-title">🏛️ K-건설맵</div>', unsafe_allow_html=True)
c1, c2, c3, c4 = st.columns(4)
with c1: st.markdown(
    f'<div class="stat-card">📅 오늘 날짜<br><span class="stat-val">{datetime.now(KST).strftime("%Y-%m-%d")}</span></div>',
    unsafe_allow_html=True)
with c2: st.markdown(f'<div class="stat-card">📈 누적 방문<br><span class="stat-val">{t_visit:,}명</span></div>',
                     unsafe_allow_html=True)
with c3: st.markdown(f'<div class="stat-card">👥 전체 회원수<br><span class="stat-val">{t_user:,}명</span></div>',
                     unsafe_allow_html=True)
with c4: st.markdown(
    f'<div class="stat-card">🔔 가동 상태<br><span class="stat-val" style="color:green;">정상 가동 중</span></div>',
    unsafe_allow_html=True)

with st.sidebar:
    st.write(f"### 👷 {'👋 ' + st.session_state['user_name'] + ' 소장님' if st.session_state['logged_in'] else 'K-건설맵 메뉴'}")

    # [해결] 로그인 시 로그인 탭 숨기기
    if st.session_state['logged_in']:
        menu_list = ["🏆 1순위 현황판", "📊 실시간 공고 (홈)", "📁 K-건설 자료실", "💬 K건설챗"]
    else:
        menu_list = ["🏆 1순위 현황판", "📊 실시간 공고 (홈)", "📁 K-건설 자료실", "💬 K건설챗", "👤 로그인 / 회원가입"]

    menu = st.radio("업무 선택", menu_list)
    st.write("---")
    if st.button("🔄 만능 데이터 새로고침"): st.cache_data.clear(); st.rerun()
    if st.session_state['logged_in'] and st.button("🚪 로그아웃"): st.session_state['logged_in'] = False; st.rerun()

# --- 메뉴별 작동 로직 ---

if menu == "🏆 1순위 현황판":
    st.subheader("🏆 실시간 1순위 현황판")
    selected_region_1st = st.selectbox("🌍 지역 필터링", REGION_LIST)
    df_w = get_hybrid_1st_bids()
    if not df_w.empty:
        df_f = filter_by_region(df_w, selected_region_1st)
        event = st.dataframe(df_f[['1순위업체', '날짜', '공고명', '발주기관', '투찰금액', '투찰률']], use_container_width=True,
                             hide_index=True, height=400, selection_mode="single-row", on_select="rerun")
        if len(event.selection.rows) > 0:
            row = df_f.iloc[event.selection.rows[0]]
            det = fetch_bid_full_detail(str(row['공고번호']).strip(), row.get('공고차수', '00'), row)

            # [디자인 복구] 17px 깔끔한 폰트 디자인
            st.markdown(f"#### ✅ [나노 VIP 분석 리포트] {row['공고명'][:35]}...")
            m1, m2, m3, m4 = st.columns(4)
            with m1:
                st.markdown(
                    f'<div class="stat-card"><div style="font-size:12px;color:#6b7280;font-weight:600;">💰 기초금액</div><div class="stat-val">{det["bss_amt"]}</div></div>',
                    unsafe_allow_html=True)
            with m2:
                st.markdown(
                    f'<div class="stat-card"><div style="font-size:12px;color:#6b7280;font-weight:600;">📐 추정가격</div><div class="stat-val">{det["est_price"]}</div></div>',
                    unsafe_allow_html=True)
            with m3:
                st.markdown(
                    f'<div class="stat-card"><div style="font-size:12px;color:#6b7280;font-weight:600;">🎯 예정가격</div><div class="stat-val">{det["pre_amt"]}</div></div>',
                    unsafe_allow_html=True)
            with m4:
                st.markdown(
                    f'<div class="stat-card"><div style="font-size:12px;color:#6b7280;font-weight:600;">🏆 낙찰금액</div><div class="stat-val" style="color:#dc2626;">{det["suc_amt"]}</div></div>',
                    unsafe_allow_html=True)

            st.write("")
            if det['corps']:
                st.dataframe(pd.DataFrame(det['corps']), use_container_width=True, hide_index=True)
            else:
                st.warning("💡 조달청 상세 성적표 딜레이 중입니다.")
            st.code(row['공고번호'], language=None)
    else:
        st.warning("데이터 로딩 중...")

elif menu == "📊 실시간 공고 (홈)":
    st.subheader("📊 실시간 입찰 공고")
    df_l = get_hybrid_live_bids()
    if not df_l.empty:
        selected_region_live = st.selectbox("🌍 지역 필터링", REGION_LIST)
        df_f = filter_by_region(df_l, selected_region_live)

        # [복구] 공고보기 링크 설정
        col_cfg = {"상세보기": st.column_config.LinkColumn("상세보기", display_text="공고보기"),
                   "예산금액": st.column_config.NumberColumn("예산(원)", format="%,d")}

        if st.session_state['logged_in'] and st.session_state['user_license']:
            t1, t2 = st.tabs(["🌐 전체 공고", "✨ 내 면허 맞춤매칭"])
            with t1:
                st.dataframe(df_f[['공고번호', '공고일자', '공고명', '발주기관', '예산금액', '상세보기']], use_container_width=True,
                             hide_index=True, height=600, column_config=col_cfg)
            with t2:
                kw = get_match_keywords(st.session_state['user_license'])
                matched = df_f[df_f['공고명'].str.contains('|'.join(kw), na=False)] if kw else df_f
                st.dataframe(matched[['공고번호', '공고일자', '공고명', '발주기관', '예산금액', '상세보기']], use_container_width=True,
                             hide_index=True, height=600, column_config=col_cfg)
        else:
            st.dataframe(df_f[['공고번호', '공고일자', '공고명', '발주기관', '예산금액', '상세보기']], use_container_width=True,
                         hide_index=True, height=600, column_config=col_cfg)

elif menu == "📁 K-건설 자료실":
    st.subheader("📁 K-건설 자료실")
    if st.session_state['logged_in']:
        with st.expander("✏️ 새 자료 등록"):
            t, c = st.text_input("제목"), st.text_area("내용")
            if st.button("등록") and t and c:
                db.child("posts").push({"author": st.session_state['user_name'], "title": t, "content": c,
                                        "time": datetime.now(KST).strftime("%Y-%m-%d %H:%M")})
                st.success("등록 완료!");
                st.rerun()
    posts = db.child("posts").get().val()
    if posts:
        for k, p in reversed(list(posts.items())):
            with st.expander(f"📢 {p['title']} (작성자: {p['author']})"):
                st.write(p['content'])
                if st.session_state['user_name'] in [p['author'], "명환"]:
                    if st.button("🗑️ 삭제", key=k): db.child("posts").child(k).remove(); st.rerun()

elif menu == "💬 K건설챗":
    st.subheader("💬 실시간 현장 소통")
    if not st.session_state['logged_in']:
        st.info("로그인 후 이용 가능합니다.")
    else:
        chat_box = st.container(height=450)
        try:
            # [인덱스 에러 우회] 파이썬 슬라이싱으로 안전하게 최신 대화만 노출
            all_c = db.child("k_chat").get().val()
            if all_c:
                for v in list(all_c.values())[-30:]: chat_box.write(f"**{v['author']}**: {v['message']}")
        except:
            chat_box.info("대화 로딩 중...")
        if msg := st.chat_input("메시지 입력"):
            db.child("k_chat").push(
                {"author": st.session_state['user_name'], "message": msg, "time": datetime.now(KST).strftime("%H:%M")})
            st.rerun()

elif menu == "👤 로그인 / 회원가입":
    st.subheader("👤 회원 정보 관리")
    t1, t2 = st.tabs(["🔑 로그인", "📝 회원가입"])
    with t1:
        le, lp = st.text_input("이메일", key="l_e"), st.text_input("비밀번호", type="password", key="l_p")
        if st.button("로그인"):
            try:
                user = auth.sign_in_with_email_and_password(le.strip().lower(), lp)
                info = db.child("users").child(user['localId']).get().val() or {}
                st.session_state.update(
                    {'logged_in': True, 'user_name': info.get('name', '소장님'), 'user_license': info.get('license', '')})
                st.rerun()  # [해결] 성공 시 딜레이 없이 즉시 현황판 이동
            except:
                st.error("로그인 실패! 정보를 확인해주세요.")
    with t2:
        # [픽스] st.text_input 오타 완벽 수정
        re = st.text_input("가입용 이메일", key="r_e")
        rp = st.text_input("비번 (6자 이상)", type="password", key="r_p")
        rn = st.text_input("성함", key="r_n")
        rl = st.multiselect("보유 면허", ALL_LICENSES, key="r_l")
        if st.button("가입하기"):
            try:
                u = auth.create_user_with_email_and_password(re.strip().lower(), rp)
                db.child("users").child(u['localId']).set(
                    {"name": rn, "license": ", ".join(rl), "email": re.strip().lower()})
                st.success("🎉 가입 성공! 로그인 해주세요.")
            except:
                st.error("가입 실패! 형식을 확인하세요.")