;;; ==========================================================================
;;;  K-건설맵 캐드 유틸        원본 파일 이름:  k-conmap.lsp
;;;  버전 2.5   2026-09-14     https://k-conmap.com      무료로 쓰셔도 됩니다
;;;
;;;  ------------------------ 만든 곳 · 이용 조건 ------------------------
;;;   만든 곳 : K-건설맵  https://k-conmap.com
;;;   값      : 무료입니다. 현장 동료·협력업체에 마음껏 나눠 주십시오.
;;;   조건    : 만든 곳 표시와 이 머리말은 지우지 마십시오.
;;;             내용을 고쳐서 배포하실 때에도 출처를 남겨 주십시오.
;;;   원본 파일 이름 : k-conmap.lsp   (최신판은 늘 위 주소에 있습니다)
;;;   유효기간       : 받으신 날부터 30일입니다 (아래 kcm*exp 날짜).
;;;                    지나면 k-conmap.com/cad 에서 새로 받아 덮어쓰시면 됩니다.
;;;                    무료이고 10초면 끝납니다. 설정은 그대로 남습니다.
;;;   새 버전 확인   : 명령창에  KUPDATE
;;;   자동 등록      : 명령창에  KINSTALL  (캐드 켤 때마다 저절로 올라옵니다)
;;;  ---------------------------------------------------------------------
;;;
;;;  ------------------------------------------------------------------------
;;;   쓰는 법은 하나입니다.   명령창에   K   -> 창이 뜨면 단추를 누르십시오.
;;;  ------------------------------------------------------------------------
;;;
;;;  2.0 에서 바뀐 것
;;;   . 명령을 외우지 않습니다. K 를 치면 「단추 창」이 뜹니다
;;;   . 도면 단위를 「자동」으로 알아냅니다 (INSUNITS). 틀리면 창에서 바꾸십시오
;;;   . 결과도 창으로 나옵니다. [엑셀로 저장] [도면에 적기] [다른 계산] 단추
;;;   . 쓸데없이 묻던 질문을 없앴습니다
;;;   . 창이 안 뜨는 캐드에서는 저절로 「글자 메뉴」로 바뀝니다 (안 멈춥니다)
;;;
;;;  명령 이름으로 바로 쓰셔도 됩니다:
;;;   KL 길이합 · KA 면적합 · KN 숫자합 · KC 개수세기 · KD 거리재기 · KI 정보
;;;   KXY 좌표뽑기 · KXYT 좌표적기 · KIN 좌표넣기
;;;   KAT 면적적기 · KTH 문자높이 · KLAY 레이어 · KDUP 중복제거 · KBG 배경색
;;;   KUNIT 단위 · KHELP 도움말 · KCONMAP · KSARASA
;;;
;;;  순수 AutoLISP + DCL 만 씁니다. ActiveX(vla-) 는 안 씁니다.
;;;  AutoCAD / AutoCAD LT 2024 이상 / 캐디안 / ZWCAD / GstarCAD 에서 돕니다.
;;; ==========================================================================


;;; ================================================================ 공통 도구

(defun kcm:posdot ( s / i n p )
  (setq i 1 n (strlen s) p 0)
  (while (and (<= i n) (= p 0))
    (if (= (substr s i 1) ".") (setq p i))
    (setq i (1+ i)))
  p
)

(defun kcm:comma ( s / p head tail sign n i out )
  (setq p (kcm:posdot s))
  (if (> p 0)
    (setq head (substr s 1 (1- p)) tail (substr s p))
    (setq head s tail ""))
  (setq sign "")
  (if (= (substr head 1 1) "-") (setq sign "-" head (substr head 2)))
  (if (= (substr head 1 1) "+") (setq head (substr head 2)))
  (setq n (strlen head) out "" i 0)
  (while (> n 0)
    (setq out (strcat (substr head n 1) out) i (1+ i) n (1- n))
    (if (and (= 0 (rem i 3)) (> n 0)) (setq out (strcat "," out))))
  (strcat sign out tail)
)

(defun kcm:num ( x prec ) (kcm:comma (rtos x 2 prec)))
(defun kcm:raw ( x prec ) (rtos x 2 prec))
(defun kcm:digit ( c ) (and (= 1 (strlen c)) (>= (ascii c) 48) (<= (ascii c) 57)))
(defun kcm:say ( s ) (princ (strcat "\n" s)))
(setq kcm*ver "2.5")
(setq kcm*exp  20261017)   ; [배포때찍음] 이 판을 쓸 수 있는 마지막 날
(setq kcm*warn 20261010)   ; [배포때찍음] 이 날부터 미리 알려 줍니다
;; 위 두 줄은 사이트에 올릴 때 「받는 날 + 30일」 로 자동으로 다시 찍힙니다.
;; 직접 받으신 판은 늘 30일이 남아 있습니다. k-conmap.com/cad 에서 받으십시오.

;; 20270331 -> "2027-03-31"
(defun kcm:dstr ( n / s )
  (setq s (itoa n))
  (strcat (substr s 1 4) "-" (substr s 5 2) "-" (substr s 7 2))
)

(defun kcm:today () (fix (getvar "CDATE")))

;; 컴퓨터 날짜가 엉뚱하면(2020년 이전) 그냥 통과시킵니다
(defun kcm:expired ()
  (and (>= (kcm:today) 20200101) (> (kcm:today) kcm*exp))
)

(defun kcm:expalert ()
  (alert (strcat "K-건설맵 캐드 유틸 " kcm*ver "\n\n"
                 "이 판은 " (kcm:dstr kcm*exp) " 까지 쓸 수 있습니다.\n"
                 "기간이 지났습니다.\n\n"
                 "최신판을 받으시면 됩니다.  무료이고 10초면 끝납니다.\n\n"
                 "        https://k-conmap.com/cad\n\n"
                 "받은 파일을 쓰시던 자리에 그대로 덮어쓰십시오.\n"
                 "설정(도면 단위·좌표 표기)도, 자동 등록(KINSTALL)도 그대로입니다."))
  (startapp "explorer" "https://k-conmap.com/cad")
  (princ)
)

(defun kcm:remove1 ( x l / out done )
  (setq out '() done nil)
  (foreach y l
    (if (and (not done) (equal y x)) (setq done T) (setq out (cons y out))))
  (reverse out)
)

(defun kcm:sortd ( al / out best )
  (setq out '())
  (while al
    (setq best (car al))
    (foreach x al (if (> (cdr x) (cdr best)) (setq best x)))
    (setq out (cons best out))
    (setq al (kcm:remove1 best al)))
  (reverse out)
)

(defun kcm:acc ( key val al / a )
  (setq a (assoc key al))
  (if a (subst (cons key (+ (cdr a) val)) a al) (cons (cons key val) al))
)

(defun kcm:has ( s sub / i n m )
  (setq n (strlen s) m (strlen sub) i 1)
  (while (and (<= i (- n m -1)) (/= (strcase (substr s i m)) (strcase sub)))
    (setq i (1+ i)))
  (<= i (- n m -1))
)

(defun kcm:slash ( s / i n c out )
  (setq i 1 n (strlen s) out "")
  (while (<= i n)
    (setq c (substr s i 1))
    (setq out (strcat out (if (= c "\\") "/" c)))
    (setq i (1+ i)))
  out
)

(defun kcm:pad ( s w / o )
  (setq o s)
  (while (< (strlen o) w) (setq o (strcat o " ")))
  o
)


;;; ============================================================== 도면 단위

;; kcm*u = 도면 1단위가 몇 m 인가.  INSUNITS 로 「자동」 판단합니다.
(defun kcm:setu ( v nm )
  (setq kcm*u v kcm*un nm)
  (kcm:say (strcat "  도면 단위: " nm))
  v
)

(defun kcm:autounit ( / iu )
  (setq iu (getvar "INSUNITS"))
  (cond
    ((= iu 4) (kcm:setu 0.001 "mm"))
    ((= iu 5) (kcm:setu 0.01  "cm"))
    ((= iu 6) (kcm:setu 1.0   "m"))
    ((= iu 1) (kcm:setu 0.0254 "inch"))
    (T        (kcm:setu 0.001 "mm"))
  )
)

(defun kcm:u () (if (null kcm*u) (kcm:autounit)) kcm*u)

(defun C:KUNIT ( / k )
  (initget "MM CM M")
  (setq k (getkword "\n도면 1단위 [MM/CM/M] <MM>: "))
  (cond ((= k "CM") (kcm:setu 0.01 "cm"))
        ((= k "M")  (kcm:setu 1.0 "m"))
        (T          (kcm:setu 0.001 "mm")))
  (princ)
)


;;; ===================================================== 색·선종류·선굵기 읽기

(defun kcm:colorname ( n )
  (cond
    ((null n) "레이어별") ((= n 0) "블록별")
    ((= n 1) "빨강(1)")  ((= n 2) "노랑(2)") ((= n 3) "초록(3)")
    ((= n 4) "하늘(4)")  ((= n 5) "파랑(5)") ((= n 6) "분홍(6)")
    ((= n 7) "흰검(7)")  ((= n 8) "진회색(8)") ((= n 9) "연회색(9)")
    ((= n 256) "레이어별")
    (T (strcat (itoa n) "번"))
  )
)

(defun kcm:objcol ( e / d c tb )
  (setq d (entget e) c (cdr (assoc 62 d)))
  (if (or (null c) (= c 256))
    (progn
      (setq tb (tblsearch "LAYER" (cdr (assoc 8 d))))
      (setq c (if tb (cdr (assoc 62 tb)) 7))
      (if (and c (< c 0)) (setq c (abs c)))))
  (if (null c) 7 c)
)

(defun kcm:objlt ( e / d lt tb )
  (setq d (entget e) lt (cdr (assoc 6 d)))
  (if (or (null lt) (= (strcase lt) "BYLAYER"))
    (progn
      (setq tb (tblsearch "LAYER" (cdr (assoc 8 d))))
      (setq lt (if tb (cdr (assoc 6 tb)) "CONTINUOUS"))))
  (if lt lt "CONTINUOUS")
)

(defun kcm:objlw ( e / d w tb )
  (setq d (entget e) w (cdr (assoc 370 d)))
  (if (or (null w) (< w 0))
    (progn
      (setq tb (tblsearch "LAYER" (cdr (assoc 8 d))))
      (setq w (if tb (cdr (assoc 370 tb)) nil))))
  (if (and w (>= w 0)) (strcat (rtos (/ w 100.0) 2 2) " mm") "기본값")
)


;;; ============================================================= 길이·넓이 계산

(defun kcm:arclen ( p1 p2 b / c th r )
  (setq c (distance p1 p2))
  (if (or (null b) (equal b 0.0 1e-12) (< c 1e-12))
    c
    (progn
      (setq th (* 4.0 (atan (abs b))))
      (setq r (/ c (* 2.0 (sin (/ th 2.0)))))
      (* r th)))
)

(defun kcm:segarea ( p1 p2 b / c th r )
  (if (or (null b) (equal b 0.0 1e-12))
    0.0
    (progn
      (setq c (distance p1 p2)
            th (* 4.0 (atan (abs b)))
            r (/ c (* 2.0 (sin (/ th 2.0)))))
      (* (if (< b 0) -1.0 1.0) 0.5 r r (- th (sin th)))))
)

(defun kcm:cross ( p1 p2 )
  (* 0.5 (- (* (car p1) (cadr p2)) (* (car p2) (cadr p1))))
)

(defun kcm:lwvs ( d / vs )
  (setq vs '())
  (foreach it d
    (cond
      ((= 10 (car it)) (setq vs (cons (list (cdr it) 0.0) vs)))
      ((= 42 (car it))
        (if vs (setq vs (cons (list (car (car vs)) (cdr it)) (cdr vs)))))))
  (reverse vs)
)

(defun kcm:pvs ( e / v vd vs f )
  (setq vs '() v (entnext e))
  (while (and v (setq vd (entget v)) (/= "SEQEND" (cdr (assoc 0 vd))))
    (if (= "VERTEX" (cdr (assoc 0 vd)))
      (progn
        (setq f (cond ((cdr (assoc 70 vd))) (0)))
        (if (and (= 0 (logand 16 f)) (= 0 (logand 1 f)))
          (setq vs (cons (list (cdr (assoc 10 vd))
                               (cond ((cdr (assoc 42 vd))) (0.0))) vs)))))
    (setq v (entnext v)))
  (reverse vs)
)

(defun kcm:vslen ( vs cl / tot prev fst )
  (if (< (length vs) 2)
    0.0
    (progn
      (setq fst (car vs) prev fst tot 0.0)
      (foreach v (cdr vs)
        (setq tot (+ tot (kcm:arclen (car prev) (car v) (cadr prev))) prev v))
      (if cl (setq tot (+ tot (kcm:arclen (car prev) (car fst) (cadr prev)))))
      tot))
)

(defun kcm:vsarea ( vs / tot prev fst )
  (if (< (length vs) 3)
    0.0
    (progn
      (setq fst (car vs) prev fst tot 0.0)
      (foreach v (cdr vs)
        (setq tot (+ tot (kcm:cross (car prev) (car v))
                       (kcm:segarea (car prev) (car v) (cadr prev))))
        (setq prev v))
      (setq tot (+ tot (kcm:cross (car prev) (car fst))
                     (kcm:segarea (car prev) (car fst) (cadr prev))))
      (abs tot)))
)

(defun kcm:len ( e / d ty a1 a2 da )
  (setq d (entget e) ty (cdr (assoc 0 d)))
  (cond
    ((= ty "LINE")   (distance (cdr (assoc 10 d)) (cdr (assoc 11 d))))
    ((= ty "CIRCLE") (* 2.0 pi (cdr (assoc 40 d))))
    ((= ty "ARC")
      (setq a1 (cdr (assoc 50 d)) a2 (cdr (assoc 51 d)) da (- a2 a1))
      (if (< da 0) (setq da (+ da (* 2.0 pi))))
      (* (cdr (assoc 40 d)) da))
    ((= ty "LWPOLYLINE")
      (kcm:vslen (kcm:lwvs d) (= 1 (logand 1 (cond ((cdr (assoc 70 d))) (0))))))
    ((= ty "POLYLINE")
      (kcm:vslen (kcm:pvs e) (= 1 (logand 1 (cond ((cdr (assoc 70 d))) (0))))))
    (T nil))
)

;; 열린 폴리선도 닫힌 것으로 봅니다 (캐드의 AREA 명령과 같은 방식)
(defun kcm:area ( e / d ty a b )
  (setq d (entget e) ty (cdr (assoc 0 d)))
  (cond
    ((= ty "CIRCLE") (* pi (expt (cdr (assoc 40 d)) 2)))
    ((= ty "ELLIPSE")
      (if (and (equal (cond ((cdr (assoc 41 d))) (0.0)) 0.0 1e-8)
               (equal (abs (cond ((cdr (assoc 42 d))) (0.0))) (* 2.0 pi) 1e-6))
        (progn
          (setq a (distance '(0.0 0.0 0.0) (cdr (assoc 11 d))))
          (setq b (* a (cdr (assoc 40 d))))
          (* pi a b))
        nil))
    ((= ty "LWPOLYLINE") (kcm:vsarea (kcm:lwvs d)))
    ((= ty "POLYLINE")   (kcm:vsarea (kcm:pvs e)))
    (T nil))
)

(defun kcm:center ( e / d ty vs sx sy n )
  (setq d (entget e) ty (cdr (assoc 0 d)))
  (cond
    ((member ty '("CIRCLE" "ARC" "ELLIPSE")) (cdr (assoc 10 d)))
    ((member ty '("LWPOLYLINE" "POLYLINE"))
      (setq vs (if (= ty "LWPOLYLINE") (kcm:lwvs d) (kcm:pvs e)))
      (setq sx 0.0 sy 0.0 n 0)
      (foreach v vs (setq sx (+ sx (car (car v))) sy (+ sy (cadr (car v))) n (1+ n)))
      (if (> n 0) (list (/ sx n) (/ sy n) 0.0) nil))
    (T nil))
)


;;; ================================================================ 문자 다루기

(defun kcm:strip ( s / out i n c nx )
  (setq out "" i 1 n (strlen s))
  (while (<= i n)
    (setq c (substr s i 1))
    (cond
      ((= c "\\")
        (setq nx (substr s (1+ i) 1))
        (cond
          ((member nx '("P" "p" "X" "x")) (setq out (strcat out " ") i (+ i 2)))
          ((member nx '("f" "F" "H" "h" "W" "w" "A" "a" "C" "c" "T" "t" "Q" "q" "S" "s" "L" "l" "O" "o" "K" "k"))
            (setq i (+ i 2))
            (while (and (<= i n) (/= (substr s i 1) ";")) (setq i (1+ i)))
            (setq i (1+ i)))
          (T (setq out (strcat out nx) i (+ i 2)))))
      ((or (= c "{") (= c "}")) (setq i (1+ i)))
      (T (setq out (strcat out c) i (1+ i)))))
  out
)

(defun kcm:nocomma ( s / i n out c )
  (setq i 1 n (strlen s) out "")
  (while (<= i n)
    (setq c (substr s i 1))
    (if (/= c ",") (setq out (strcat out c)))
    (setq i (1+ i)))
  out
)

(defun kcm:validnum ( t2 / i n c d dot ok )
  (setq n (strlen t2) i 1 d 0 dot 0 ok T)
  (if (= n 0) (setq ok nil))
  (while (and ok (<= i n))
    (setq c (substr t2 i 1))
    (cond
      ((kcm:digit c) (setq d (1+ d)))
      ((= c ".") (setq dot (1+ dot)))
      ((and (or (= c "-") (= c "+")) (= i 1)) nil)
      (T (setq ok nil)))
    (setq i (1+ i)))
  (and ok (> d 0) (< dot 2))
)

(defun kcm:tok2num ( tok / t2 )
  (setq t2 (kcm:nocomma tok))
  (while (and (> (strlen t2) 0) (member (substr t2 (strlen t2) 1) '("." "-" "+")))
    (setq t2 (substr t2 1 (1- (strlen t2)))))
  (if (kcm:validnum t2) (atof t2) nil)
)

(defun kcm:firstnum ( s / i n c tok res )
  (setq s (kcm:strip s) i 1 n (strlen s) tok "" res nil)
  (while (and (<= i n) (null res))
    (setq c (substr s i 1))
    (if (or (kcm:digit c) (= c ".") (= c ",") (= c "-") (= c "+"))
      (setq tok (strcat tok c))
      (if (/= tok "") (setq res (kcm:tok2num tok) tok "")))
    (setq i (1+ i)))
  (if (and (null res) (/= tok "")) (setq res (kcm:tok2num tok)))
  res
)

(defun kcm:txt ( e / d ty )
  (setq d (entget e) ty (cdr (assoc 0 d)))
  (if (member ty '("TEXT" "MTEXT" "ATTDEF" "ATTRIB"))
    (kcm:strip (cond ((cdr (assoc 1 d))) ("")))
    nil)
)

(defun kcm:cq ( s / i n c out q )
  (if (null s) (setq s ""))
  (setq n (strlen s) i 1 out "" q nil)
  (while (<= i n)
    (setq c (substr s i 1))
    (cond
      ((= c "\"") (setq out (strcat out "\"\"") q T))
      ((= c ",")  (setq out (strcat out c) q T))
      (T (setq out (strcat out c))))
    (setq i (1+ i)))
  (if q (strcat "\"" out "\"") out)
)

(defun kcm:split ( s / i n c out fld q )
  (setq i 1 n (strlen s) out '() fld "" q nil)
  (while (<= i n)
    (setq c (substr s i 1))
    (cond
      ((= c "\"") (setq q (not q)))
      ((and (= c ",") (not q)) (setq out (cons fld out) fld ""))
      (T (setq fld (strcat fld c))))
    (setq i (1+ i)))
  (reverse (cons fld out))
)

(defun kcm:nth ( l i ) (if (and (> i 0) (<= i (length l))) (nth (1- i) l) nil))

(defun kcm:height ( / h v )
  ;; 화면에 보이는 크기를 기준으로 잡습니다.
  ;; TEXTSIZE 가 도면 크기에 비해 너무 작으면 글자가 찍혀도 「안 보입니다」.
  (setq v (/ (getvar "VIEWSIZE") 45.0))
  (setq h (getvar "TEXTSIZE"))
  (if (or (null h) (<= h 0.0) (< h (/ v 15.0)) (> h (* v 15.0))) (setq h v))
  h
)

;; 글자 높이를 물어봅니다. 그냥 Enter 면 화면에 맞는 크기.
(defun kcm:askheight ( / h a )
  (setq h (kcm:height))
  (setq a (getreal (strcat "\n글자 높이 - 그냥 Enter 면 " (kcm:num h 2) " : ")))
  (if (and a (> a 0.0)) a h)
)

(defun kcm:mktext ( p h s )
  (entmake (list '(0 . "TEXT") (cons 10 p) (cons 40 h) (cons 1 s)))
)


;;; =============================================================== 대화상자(DCL)

;; DCL 파일을 임시 폴더에 「스스로」 만들어 씁니다. 따로 파일을 받을 필요가 없습니다.
(defun kcm:dcltext ()
  (list
"kcm_menu : dialog { label = \"K-건설맵 캐드 유틸 2.5        k-conmap.com\";"
"  : text { key = \"unit\"; label = \"\"; width = 56; }"
"  : row {"
"    : boxed_column { label = \" 재 기 \";"
"      : button { key = \"kl\";   label = \"길이 합계\";        width = 20; }"
"      : button { key = \"ka\";   label = \"면적 합계\";        width = 20; }"
"      : button { key = \"kn\";   label = \"숫자 합계\";        width = 20; }"
"      : button { key = \"kc\";   label = \"개수 세기\";        width = 20; }"
"      : button { key = \"kd\";   label = \"거리 재기\";        width = 20; }"
"      : button { key = \"ki\";   label = \"선 정보 보기\";     width = 20; }"
"    }"
"    : boxed_column { label = \" 좌 표 \";"
"      : button { key = \"kxy\";  label = \"좌표 뽑기 -> 엑셀\"; width = 20; }"
"      : button { key = \"kxyt\"; label = \"좌표 적기 -> 도면\"; width = 20; }"
"      : button { key = \"kin\";  label = \"좌표 넣기 <- 엑셀\"; width = 20; }"
"      : spacer { height = 1; }"
"      : button { key = \"kbg\";  label = \"검은 배경 없애기\";  width = 20; }"
"      : button { key = \"khelp\";label = \"도움말\";            width = 20; }"
"    }"
"    : boxed_column { label = \" 정 리 \";"
"      : button { key = \"kat\";  label = \"면적 적기\";         width = 20; }"
"      : button { key = \"kth\";  label = \"문자 높이 바꾸기\";  width = 20; }"
"      : button { key = \"klay\"; label = \"레이어 살펴보기\";   width = 20; }"
"      : button { key = \"kdup\"; label = \"겹친 것 지우기\";    width = 20; }"
"      : spacer { height = 1; }"
"      : button { key = \"ksite\";label = \"K-건설맵 열기\";     width = 20; }"
"    }"
"  }"
"  : boxed_radio_row { label = \"도면 1단위 (자동으로 잡았습니다. 틀리면 바꾸십시오)\";"
"    : radio_button { key = \"umm\"; label = \"밀리미터 mm\"; }"
"    : radio_button { key = \"ucm\"; label = \"센티 cm\"; }"
"    : radio_button { key = \"um\";  label = \"미터 m\"; }"
"  }"
"  : text { label = \"쓰는 법: 단추 누르기 -> 마우스로 고르기 -> Enter -> 결과\"; }"
"  : button { key = \"cancel\"; label = \"닫 기\"; is_cancel = true; width = 14;"
"             alignment = centered; }"
"}"
""
"kcm_res : dialog { label = \"K-건설맵 결과\";"
"  : text { key = \"ttl\"; label = \"\"; width = 58; }"
"  : list_box { key = \"lst\"; width = 58; height = 17; multiple_select = false; }"
"  : row {"
"    : button { key = \"csv\";   label = \"엑셀(CSV)로 저장\"; width = 18; }"
"    : button { key = \"txt\";   label = \"도면에 적기\";       width = 14; }"
"    : button { key = \"again\"; label = \"다른 계산\";         width = 12; }"
"    : button { key = \"accept\";label = \"닫 기\";             width = 10;"
"               is_default = true; is_cancel = true; }"
"  }"
"  : text { label = \"K-건설맵 캐드 유틸 (k-conmap.lsp)   k-conmap.com\"; }"
"}"
  )
)

(defun kcm:dclfile ( / p f )
  (if (and kcm*dcl (findfile kcm*dcl))
    kcm*dcl
    (progn
      (setq p (strcat (cond ((getvar "TEMPPREFIX")) ("")) "kcm_dlg.dcl"))
      (setq f (open p "w"))
      (if f
        (progn
          (foreach l (kcm:dcltext) (write-line l f))
          (close f)
          (setq kcm*dcl p))
        (setq kcm*dcl nil))
      kcm*dcl))
)

;; 메뉴 창.  누른 단추 이름을 돌려줍니다.  창을 못 띄우면 nil
(defun kcm:menudlg ( / dcl id ok )
  (setq kcm*pick nil dcl (kcm:dclfile))
  (if dcl
    (progn
      (setq id (load_dialog dcl))
      (if (and id (>= id 0))
        (progn
          (if (new_dialog "kcm_menu" id)
            (progn
              (setq ok T)
              (set_tile "unit"
                (strcat "지금 도면 단위는  "  kcm*un
                        "  로 잡혀 있습니다.   (숫자가 이상하면 아래에서 바꾸십시오)"))
              (set_tile (cond ((= kcm*un "cm") "ucm") ((= kcm*un "m") "um") ("umm")) "1")
              (action_tile "umm" "(kcm:setu 0.001 \"mm\")")
              (action_tile "ucm" "(kcm:setu 0.01 \"cm\")")
              (action_tile "um"  "(kcm:setu 1.0 \"m\")")
              (foreach k '("kl" "ka" "kn" "kc" "kd" "ki" "kxy" "kxyt" "kin"
                           "kat" "kth" "klay" "kdup" "kbg" "khelp" "ksite")
                (action_tile k "(setq kcm*pick $key)(done_dialog 1)"))
              (action_tile "cancel" "(setq kcm*pick nil)(done_dialog 0)")
              (start_dialog)))
          (unload_dialog id)))))
  (if ok kcm*pick nil)
)

;; 결과 창.  누른 단추("csv" "txt" "again" "close")를 돌려줍니다.
;; 창을 못 띄우면 nil (그러면 알림창으로 대신 보여 줍니다)
(defun kcm:resdlg ( title lines cancsv cantxt / dcl id ok )
  (setq kcm*act "close" dcl (kcm:dclfile) ok nil)
  (if dcl
    (progn
      (setq id (load_dialog dcl))
      (if (and id (>= id 0))
        (progn
          (if (new_dialog "kcm_res" id)
            (progn
              (setq ok T)
              (set_tile "ttl" title)
              (start_list "lst")
              (foreach l lines (add_list l))
              (end_list)
              (if (null cancsv) (mode_tile "csv" 1))
              (if (null cantxt) (mode_tile "txt" 1))
              (action_tile "csv"    "(setq kcm*act \"csv\")(done_dialog 1)")
              (action_tile "txt"    "(setq kcm*act \"txt\")(done_dialog 1)")
              (action_tile "again"  "(setq kcm*act \"again\")(done_dialog 1)")
              (action_tile "accept" "(setq kcm*act \"close\")(done_dialog 0)")
              (start_dialog)))
          (unload_dialog id)))))
  (if ok kcm*act nil)
)


;;; ======================================================== 결과 처리 (공통 한 곳)

(defun kcm:savecsv ( hdr rows / p f )
  (setq p (getfiled "엑셀(CSV)로 저장" "" "csv" 1))
  (if p
    (progn
      (setq f (open p "w"))
      (if f
        (progn
          (write-line hdr f)
          (foreach r rows (write-line r f))
          (write-line "" f)
          (write-line "# K-건설맵 캐드 유틸(k-conmap.lsp) 로 뽑았습니다 . k-conmap.com" f)
          (close f)
          (kcm:say (strcat "  저장했습니다 -> " p))
          (alert (strcat "저장했습니다.\n\n" p)))
        (alert "파일을 만들지 못했습니다.\n바탕화면 같은 다른 자리에 저장해 보십시오."))))
  (princ)
)

(defun kcm:drawtext ( s / p )
  (setq p (getpoint "\n글자를 놓을 자리를 찍으십시오: "))
  (if p (progn (kcm:mktext p (kcm:height) s) (kcm:say "  적었습니다.")))
  (princ)
)

;; 모든 명령이 이 한 곳으로 끝납니다.
;;  title  창 제목 / sum 한 줄 요약 / lines 결과 줄들
;;  hdr·rows  CSV (없으면 nil) / txt  도면에 적을 글 (없으면 nil)
;;  돌려주는 값이 "again" 이면 메뉴를 다시 엽니다.
(defun kcm:result ( title sum lines hdr rows txt / act s )
  (if (kcm:expired) (progn (kcm:expalert) (setq lines nil)))
  (if (null lines) (setq lines (list "이 판은 기간이 지났습니다."
                                     "최신판을 받아 주십시오 (무료)."
                                     "" "   https://k-conmap.com/cad")
                         hdr nil rows nil txt nil))
  (kcm:say (strcat "--- " title " ---"))
  (foreach l lines (kcm:say (strcat " " l)))
  (setq act (kcm:resdlg title lines (if rows T nil) (if txt T nil)))
  (if (null act)
    (progn   ;; 창을 못 띄우는 캐드 -> 알림창으로
      (setq s title)
      (foreach l lines (setq s (strcat s "\n" l)))
      (alert (strcat s "\n\n----------------------------------------"
                       "\n K-건설맵 캐드 유틸 (k-conmap.lsp)  k-conmap.com"))
      (setq act "close")))
  (while (member act '("csv" "txt"))
    (cond
      ((= act "csv") (if rows (kcm:savecsv hdr rows)))
      ((= act "txt") (if txt (kcm:drawtext txt))))
    (setq act (kcm:resdlg title lines (if rows T nil) (if txt T nil)))
    (if (null act) (setq act "close")))
  act
)

;; 고르라고 안내하는 한 줄 (매번 같은 말을 합니다)
(defun kcm:pickmsg ( what )
  (kcm:say (strcat "[" what "] 마우스로 고르십시오.  다 고르면 「Enter」 를 치십시오."))
)


;;; ================================================================== KL 길이합

(defun C:KL ( / ss n i e L tot lays cols skip u lines rows sum )
  (kcm:u)
  (kcm:pickmsg "길이 합계")
  (setq ss (ssget))
  (if (null ss)
    (progn (kcm:say "고른 것이 없습니다.") "close")
    (progn
      (setq n (sslength ss) i 0 tot 0.0 lays '() cols '() skip 0 u (kcm:u))
      (while (< i n)
        (setq e (ssname ss i) L (kcm:len e))
        (if L
          (setq tot (+ tot L)
                lays (kcm:acc (cdr (assoc 8 (entget e))) L lays)
                cols (kcm:acc (kcm:colorname (kcm:objcol e)) L cols))
          (setq skip (1+ skip)))
        (setq i (1+ i)))
      (setq lays (kcm:sortd lays) cols (kcm:sortd cols))
      (setq sum (strcat "길이합 " (kcm:num (* tot u) 3) " m"))
      (setq lines (list (strcat "합계        " (kcm:num (* tot u) 3) " m")
                        (strcat "도면 값      " (kcm:num tot 2) " " kcm*un)
                        (strcat "센 것        " (itoa (- n skip)) " / " (itoa n) " 개")))
      (if (> skip 0)
        (setq lines (append lines
          (list (strcat "못 센 것      " (itoa skip) " 개 (스플라인·타원·문자 등)")))))
      (setq lines (append lines (list "" "[ 레이어별 ]")))
      (foreach a lays
        (setq lines (append lines (list (strcat "  " (kcm:pad (car a) 22) " "
                                                (kcm:num (* (cdr a) u) 3) " m")))))
      (setq lines (append lines (list "" "[ 색깔별 ]")))
      (foreach a cols
        (setq lines (append lines (list (strcat "  " (kcm:pad (car a) 22) " "
                                                (kcm:num (* (cdr a) u) 3) " m")))))
      (setq rows '())
      (foreach a lays
        (setq rows (cons (strcat "레이어," (kcm:cq (car a)) ","
                                 (kcm:raw (* (cdr a) u) 3)) rows)))
      (foreach a cols
        (setq rows (cons (strcat "색깔," (kcm:cq (car a)) ","
                                 (kcm:raw (* (cdr a) u) 3)) rows)))
      (setq rows (append (reverse rows) (list (strcat "합계,," (kcm:raw (* tot u) 3)))))
      (kcm:result "길이 합계" sum lines "구분,이름,길이(m)" rows sum)))
)


;;; ================================================================== KA 면적합

(defun C:KA ( / ss n i e A tot lays cols skip u lines rows sum py )
  (kcm:u)
  (kcm:pickmsg "면적 합계")
  (setq ss (ssget))
  (if (null ss)
    (progn (kcm:say "고른 것이 없습니다.") "close")
    (progn
      (setq n (sslength ss) i 0 tot 0.0 lays '() cols '() skip 0 u (kcm:u))
      (while (< i n)
        (setq e (ssname ss i) A (kcm:area e))
        (if A
          (setq tot (+ tot A)
                lays (kcm:acc (cdr (assoc 8 (entget e))) A lays)
                cols (kcm:acc (kcm:colorname (kcm:objcol e)) A cols))
          (setq skip (1+ skip)))
        (setq i (1+ i)))
      (setq lays (kcm:sortd lays) cols (kcm:sortd cols))
      (setq tot (* tot u u) py (/ tot 3.305785))
      (setq sum (strcat "면적합 " (kcm:num tot 3) " m2"))
      (setq lines (list (strcat "합계        " (kcm:num tot 3) " m2")
                        (strcat "            " (kcm:num py 2) " 평")
                        (strcat "센 것        " (itoa (- n skip)) " / " (itoa n) " 개")))
      (if (> skip 0)
        (setq lines (append lines
          (list (strcat "못 센 것      " (itoa skip) " 개 (해치·선·문자 등)")))))
      (setq lines (append lines (list "" "[ 레이어별 ]")))
      (foreach a lays
        (setq lines (append lines (list (strcat "  " (kcm:pad (car a) 22) " "
                                                (kcm:num (* (cdr a) u u) 3) " m2")))))
      (setq lines (append lines (list "" "[ 색깔별 ]")))
      (foreach a cols
        (setq lines (append lines (list (strcat "  " (kcm:pad (car a) 22) " "
                                                (kcm:num (* (cdr a) u u) 3) " m2")))))
      (setq rows '())
      (foreach a lays
        (setq rows (cons (strcat "레이어," (kcm:cq (car a)) ","
                                 (kcm:raw (* (cdr a) u u) 3) ","
                                 (kcm:raw (/ (* (cdr a) u u) 3.305785) 2)) rows)))
      (foreach a cols
        (setq rows (cons (strcat "색깔," (kcm:cq (car a)) ","
                                 (kcm:raw (* (cdr a) u u) 3) ","
                                 (kcm:raw (/ (* (cdr a) u u) 3.305785) 2)) rows)))
      (setq rows (append (reverse rows)
                         (list (strcat "합계,," (kcm:raw tot 3) "," (kcm:raw py 2)))))
      (kcm:result "면적 합계" sum lines "구분,이름,면적(m2),면적(평)" rows
                  (strcat (kcm:num tot 3) " m2"))))
)


;;; ================================================================== KN 숫자합

(defun C:KN ( / ss n i e s v tot cnt skip ex lines rows sum )
  (kcm:pickmsg "숫자 합계 - 문자를 창으로 감싸십시오")
  (setq ss (ssget '((0 . "TEXT,MTEXT"))))
  (if (null ss)
    (progn (kcm:say "고른 문자가 없습니다.") "close")
    (progn
      (setq n (sslength ss) i 0 tot 0.0 cnt 0 skip 0 ex '() rows '())
      (while (< i n)
        (setq e (ssname ss i) s (kcm:txt e))
        (setq v (if s (kcm:firstnum s) nil))
        (if v
          (progn (setq tot (+ tot v) cnt (1+ cnt))
                 (setq rows (cons (strcat (kcm:cq s) "," (kcm:raw v 4)) rows)))
          (progn (setq skip (1+ skip))
                 (if (and s (/= s "") (< (length ex) 8)) (setq ex (cons s ex)))))
        (setq i (1+ i)))
      (setq sum (kcm:num tot 4))
      (setq lines (list (strcat "합계        " (kcm:num tot 4))))
      (if (> cnt 0)
        (setq lines (append lines (list (strcat "평균        " (kcm:num (/ tot cnt) 4))))))
      (setq lines (append lines
        (list (strcat "찾은 것      " (itoa cnt) " / " (itoa n) " 개"))))
      (if (> skip 0)
        (progn
          (setq lines (append lines
            (list (strcat "숫자 없어 뺌  " (itoa skip) " 개") "" "[ 뺀 것 ]")))
          (foreach x (reverse ex) (setq lines (append lines (list (strcat "  " x)))))))
      (setq rows (append (reverse rows) (list (strcat "합계," (kcm:raw tot 4)))))
      (kcm:result "숫자 합계" sum lines "문자,숫자" rows (kcm:num tot 4))))
)


;;; ================================================================ KC 개수세기

(defun C:KC ( / ss n i e d ty key tab lines rows )
  (kcm:pickmsg "개수 세기")
  (setq ss (ssget))
  (if (null ss)
    (progn (kcm:say "고른 것이 없습니다.") "close")
    (progn
      (setq n (sslength ss) i 0 tab '())
      (while (< i n)
        (setq e (ssname ss i) d (entget e) ty (cdr (assoc 0 d)))
        (setq key (if (= ty "INSERT")
                    (strcat "블록: " (cond ((cdr (assoc 2 d))) ("?"))) ty))
        (setq tab (kcm:acc key 1.0 tab))
        (setq i (1+ i)))
      (setq tab (kcm:sortd tab))
      (setq lines (list (strcat "모두        " (itoa n) " 개") ""))
      (foreach a tab
        (setq lines (append lines (list (strcat "  " (kcm:pad (car a) 26) " "
                                                (itoa (fix (cdr a))) " 개")))))
      (setq rows '())
      (foreach a tab
        (setq rows (cons (strcat (kcm:cq (car a)) "," (itoa (fix (cdr a)))) rows)))
      (setq rows (append (reverse rows) (list (strcat "합계," (itoa n)))))
      (kcm:result "개수 세기" (strcat "모두 " (itoa n) "개") lines "이름,개수" rows nil)))
)


;;; ================================================================ KI 정보보기

(defun C:KI ( / e d ty lines L A u )
  (kcm:u)
  (kcm:say "[선 정보 보기] 알고 싶은 것을 하나 클릭하십시오.")
  (setq e (car (entsel "\n하나 고르십시오: ")))
  (if (null e)
    (progn (kcm:say "고른 것이 없습니다.") "close")
    (progn
      (setq d (entget e) ty (cdr (assoc 0 d)) u (kcm:u))
      (setq lines (list (strcat "종류        " ty)
                        (strcat "레이어      " (cdr (assoc 8 d)))
                        (strcat "색깔        " (kcm:colorname (kcm:objcol e))
                                (if (assoc 62 d) "   (객체에 직접 준 색)" "   (레이어 색)"))
                        (strcat "선종류      " (kcm:objlt e))
                        (strcat "선굵기      " (kcm:objlw e))))
      (setq L (kcm:len e) A (kcm:area e))
      (if L (setq lines (append lines
              (list (strcat "길이        " (kcm:num (* L u) 3) " m")))))
      (if A (setq lines (append lines
              (list (strcat "면적        " (kcm:num (* A u u) 3) " m2  ("
                            (kcm:num (/ (* A u u) 3.305785) 2) " 평)")))))
      (if (assoc 10 d)
        (setq lines (append lines
          (list "" (strcat "X 좌표      " (kcm:num (car (cdr (assoc 10 d))) 3))
                   (strcat "Y 좌표      " (kcm:num (cadr (cdr (assoc 10 d))) 3))))))
      (if (member ty '("TEXT" "MTEXT"))
        (setq lines (append lines
          (list "" (strcat "글자        " (kcm:txt e))
                   (strcat "글자 높이    " (kcm:num (cond ((cdr (assoc 40 d))) (0.0)) 2))))))
      (if (= ty "INSERT")
        (setq lines (append lines
          (list (strcat "블록 이름    " (cond ((cdr (assoc 2 d))) ("?")))))))
      (kcm:result "선 정보 보기" "" lines nil nil nil)))
)


;;; ================================================================ KD 거리재기

(defun C:KD ( / p0 p1 tot u lines k n )
  (kcm:u)
  (setq u (kcm:u))
  (kcm:say "[거리 재기] 점을 이어 찍으십시오.  끝내려면 Enter.")
  (setq p0 (getpoint "\n첫 점: ") tot 0.0 n 0 lines '())
  (if (null p0)
    (progn (kcm:say "취소했습니다.") "close")
    (progn
      (setq k T)
      (while k
        (setq p1 (getpoint p0 "\n다음 점 (끝내려면 Enter): "))
        (if p1
          (progn
            (setq n (1+ n) tot (+ tot (distance p0 p1)))
            (setq lines (append lines
              (list (strcat "  " (kcm:pad (strcat (itoa n) "구간") 10)
                            (kcm:pad (strcat (kcm:num (* (distance p0 p1) u) 3) " m") 16)
                            "누적 " (kcm:num (* tot u) 3) " m"))))
            (kcm:say (strcat "   누적 " (kcm:num (* tot u) 3) " m"))
            (setq p0 p1))
          (setq k nil)))
      (if (= n 0)
        (progn (kcm:say "점을 하나만 찍으셨습니다.") "close")
        (kcm:result "거리 재기" (strcat "거리 " (kcm:num (* tot u) 3) " m")
          (append (list (strcat "전체 거리    " (kcm:num (* tot u) 3) " m")
                        (strcat "구간        " (itoa n) " 개") "") lines)
          nil nil (strcat "L=" (kcm:num (* tot u) 3) " m")))))
)


;;; =============================================================== KXY 좌표뽑기

(defun kcm:xy1 ( e / d ty p nm )
  (setq d (entget e) ty (cdr (assoc 0 d)) nm "")
  (cond
    ((= ty "POINT")  (setq p (cdr (assoc 10 d)) nm "점"))
    ((= ty "INSERT") (setq p (cdr (assoc 10 d)) nm (cdr (assoc 2 d))))
    ((= ty "CIRCLE") (setq p (cdr (assoc 10 d)) nm "원중심"))
    ((= ty "ARC")    (setq p (cdr (assoc 10 d)) nm "호중심"))
    ((= ty "TEXT")
      (setq nm (kcm:strip (cond ((cdr (assoc 1 d))) (""))))
      (setq p (if (and (cdr (assoc 11 d))
                       (or (/= 0 (cond ((cdr (assoc 72 d))) (0)))
                           (/= 0 (cond ((cdr (assoc 73 d))) (0)))))
                (cdr (assoc 11 d)) (cdr (assoc 10 d)))))
    ((= ty "MTEXT")
      (setq p (cdr (assoc 10 d)) nm (kcm:strip (cond ((cdr (assoc 1 d))) ("")))))
    (T (setq p nil)))
  (if p (list p ty nm) nil)
)

(defun C:KXY ( / ss n i e r pts p k rows z lines )
  (kcm:say "[좌표 뽑기] 점·블록·문자·원을 고르십시오.  다 고르면 Enter.")
  (kcm:say "            아무것도 안 고르고 Enter 를 치면 「화면에서 찍기」가 됩니다.")
  (setq ss (ssget '((0 . "POINT,INSERT,TEXT,MTEXT,CIRCLE,ARC"))) pts '())
  (if ss
    (progn
      (setq n (sslength ss) i 0)
      (while (< i n)
        (setq e (ssname ss i) r (kcm:xy1 e))
        (if r (setq pts (cons r pts)))
        (setq i (1+ i)))
      (setq pts (reverse pts)))
    (progn
      (setq k T)
      (while k
        (setq p (getpoint "\n점을 찍으십시오 (끝내려면 Enter): "))
        (if p (setq pts (append pts (list (list p "PICK" "")))) (setq k nil)))))
  (if (null pts)
    (progn (kcm:say "좌표가 없습니다.") "close")
    (progn
      (setq rows '() lines '() i 0)
      (foreach r pts
        (setq i (1+ i) p (car r) z (if (caddr p) (caddr p) 0.0))
        (setq rows (cons (strcat (itoa i) "," (kcm:raw (car p) 4) ","
                                 (kcm:raw (cadr p) 4) "," (kcm:raw z 4) ","
                                 (kcm:cq (cadr r)) "," (kcm:cq (caddr r))) rows))
        (setq lines (append lines
          (list (strcat "  " (kcm:pad (itoa i) 5)
                        "X " (kcm:pad (kcm:num (car p) 3) 16)
                        "Y " (kcm:num (cadr p) 3))))))
      (kcm:result "좌표 뽑기" ""
        (append (list (strcat "좌표        " (itoa i) " 개")
                      "[엑셀(CSV)로 저장] 을 누르십시오." "") lines)
        "번호,X,Y,Z,종류,내용" (reverse rows) nil)))
)


;;; ============================================================== KXYT 좌표적기

;; 측점에서 글자까지 「지시선」을 긋고 그 위에 X·Y 를 적습니다.
;;   p1 = 측점 / p2 = 꺾이는 자리(사용자가 찍음) / p3 = 수평 꼬리 끝
(defun kcm:leader ( p1 p2 h t1 t2 / dirx w tail p3 x1 y1 )
  (setq dirx (if (>= (car p2) (car p1)) 1.0 -1.0))
  (setq w (* h 0.62 (max (strlen t1) (strlen t2))))
  (setq tail (max w (* h 3.0)))
  (setq p3 (list (+ (car p2) (* dirx tail)) (cadr p2) 0.0))
  (entmake (list '(0 . "LINE") (cons 10 p1) (cons 11 p2)))          ; 비스듬한 선
  (entmake (list '(0 . "LINE") (cons 10 p2) (cons 11 p3)))          ; 수평 꼬리
  (entmake (list '(0 . "CIRCLE") (cons 10 p1) (cons 40 (* h 0.3)))) ; 측점 표시
  (setq x1 (+ (min (car p2) (car p3)) (* h 0.25)))
  (setq y1 (cadr p2))
  (kcm:mktext (list x1 (+ y1 (* h 1.75)) 0.0) h t1)                 ; X=
  (kcm:mktext (list x1 (+ y1 (* h 0.35)) 0.0) h t2)                 ; Y=
  (princ)
)

(defun C:KXYT ( / h mode p1 p2 k n tx ty t1 t2 dec done )
  (kcm:say "[좌표 적기]  측점을 찍고 -> 글자 놓을 자리를 찍으면")
  (kcm:say "             그 사이에 지시선을 긋고 X·Y 를 적습니다.")
  (if (null kcm*xymode)
    (progn
      (initget "S D")
      (kcm:say "")
      (kcm:say "  측량식 = X 는 북(세로), Y 는 동(가로)   <- 측량 성과표와 같은 방식")
      (kcm:say "  도면식 = X 는 가로, Y 는 세로           <- 캐드 좌표 그대로")
      (setq mode (getkword "\n좌표 표기 [측량식S/도면식D] <S>: "))
      (setq kcm*xymode (if (null mode) "S" mode))))
  (setq mode kcm*xymode)
  (kcm:say (strcat "  -> " (if (= mode "S") "측량식 (X=북, Y=동)" "도면식 (X=가로, Y=세로)")
                   "  . 바꾸려면 KXYMODE"))
  (setq h (kcm:askheight) dec 3 n 0 k T)
  (while k
    (setq p1 (getpoint "\n측점을 찍으십시오 (끝내려면 Enter): "))
    (if (null p1)
      (setq k nil)
      (progn
        (setq p2 (getpoint p1 "\n글자를 놓을 자리를 찍으십시오 (건너뛰려면 Enter): "))
        (if p2
          (progn
            (if (= mode "S")
              (setq tx (cadr p1) ty (car p1))
              (setq tx (car p1)  ty (cadr p1)))
            (setq t1 (strcat "X=" (kcm:raw tx dec))
                  t2 (strcat "Y=" (kcm:raw ty dec)))
            (kcm:leader p1 p2 h t1 t2)
            (setq n (1+ n))
            (kcm:say (strcat "   " (itoa n) "개째   " t1 "   " t2)))))))
  (if (> n 0)
    (kcm:result "좌표 적기" ""
      (list (strcat "측점 " (itoa n) " 개에 지시선과 좌표를 적었습니다.")
            (strcat "표기 방식    " (if (= mode "S") "측량식 (X=북, Y=동)"
                                                    "도면식 (X=가로, Y=세로)"))
            (strcat "글자 높이    " (kcm:num h 2))
            ""
            "표기 방식을 바꾸려면  KXYMODE"
            "글자만 따로 키우려면  [문자 높이 바꾸기]"
            ""
            "지우려면 되돌리기 (U 또는 Ctrl+Z).")
      nil nil nil)
    (progn (kcm:say "적은 것이 없습니다.") "close"))
)

;; 측량식 / 도면식 바꾸기
(defun C:KXYMODE ( / mode )
  (initget "S D")
  (setq mode (getkword "\n좌표 표기 [측량식S (X=북,Y=동)/도면식D (X=가로,Y=세로)] <S>: "))
  (setq kcm*xymode (if (null mode) "S" mode))
  (kcm:say (strcat "  -> " (if (= kcm*xymode "S") "측량식 (X=북, Y=동)"
                                                  "도면식 (X=가로, Y=세로)")))
  (princ)
)


;;; =============================================================== KIN 좌표넣기

(defun C:KIN ( / p f ln flds cx cy cn a h hh n bad lines x y )
  (kcm:say "[좌표 넣기] 엑셀에서 저장한 CSV 파일을 고르십시오.")
  (alert (strcat "엑셀 좌표를 도면에 점으로 찍습니다.\n\n"
                 "CSV 파일은 이런 모양이면 됩니다 (첫 줄은 제목이어도 됩니다)\n\n"
                 "    측점,X,Y\n"
                 "    No.1,214500.000,382900.000\n"
                 "    No.2,214540.000,382900.000\n\n"
                 "엑셀에서 [다른 이름으로 저장] -> [CSV(쉼표로 분리)] 로 저장하십시오.\n"
                 "다음 창에서 그 파일을 고르시면 됩니다."))
  (setq p (getfiled "좌표가 든 CSV 파일 고르기" "" "csv" 4))
  (if (null p)
    (progn (kcm:say "취소했습니다.") "close")
    (progn
      (setq a (getint "\nX 가 몇 번째 칸입니까? <2>: ") cx (if a a 2))
      (setq a (getint "\nY 가 몇 번째 칸입니까? <3>: ") cy (if a a 3))
      (setq a (getint "\n이름(측점) 칸은? 없으면 0 <1>: ") cn (if a a 1))
      (setq hh (kcm:askheight))
      (setq f (open p "r") n 0 bad 0 lines '())
      (if (null f)
        (progn (alert "파일을 열지 못했습니다.") "close")
        (progn
          (while (setq ln (read-line f))
            (setq flds (kcm:split ln))
            (setq x (kcm:tok2num (cond ((kcm:nth flds cx)) (""))))
            (setq y (kcm:tok2num (cond ((kcm:nth flds cy)) (""))))
            (if (and x y)
              (progn
                (setq n (1+ n))
                (entmake (list '(0 . "POINT") (cons 10 (list x y 0.0))))
                (setq h (if (> cn 0) (kcm:nth flds cn) nil))
                (entmake (list '(0 . "CIRCLE") (cons 10 (list x y 0.0))
                               (cons 40 (* hh 0.35))))
                (if (and h (/= h ""))
                  (kcm:mktext (list (+ x (* hh 0.8)) (+ y (* hh 0.8)) 0.0) hh h))
                (setq lines (append lines
                  (list (strcat "  " (kcm:pad (itoa n) 5)
                                (kcm:pad (cond (h) ("")) 12)
                                "X " (kcm:pad (kcm:num x 3) 16)
                                "Y " (kcm:num y 3))))))
              (setq bad (1+ bad))))
          (close f)
          (kcm:result "좌표 넣기" ""
            (append (list (strcat "찍은 점      " (itoa n) " 개")
                          (strcat "건너뛴 줄    " (itoa bad) " 개 (제목줄 포함)")
                          ""
                          "점이 안 보이면 -> 명령창에 ZOOM 치고 E"
                          "점이 너무 작으면 -> PDMODE 를 34 로"
                          "") lines)
            nil nil nil)))))
)


;;; =============================================================== KAT 면적적기

(defun C:KAT ( / ss n i e A c h u done skip )
  (kcm:u)
  (setq u (kcm:u))
  (kcm:pickmsg "면적 적기 - 폴리선·원을 고르십시오")
  (setq ss (ssget))
  (if (null ss)
    (progn (kcm:say "고른 것이 없습니다.") "close")
    (progn
      (setq h (kcm:askheight) n (sslength ss) i 0 done 0 skip 0)
      (while (< i n)
        (setq e (ssname ss i) A (kcm:area e) c (kcm:center e))
        (if (and A c)
          (progn (kcm:mktext c h (strcat (kcm:num (* A u u) 2) " m2"))
                 (setq done (1+ done)))
          (setq skip (1+ skip)))
        (setq i (1+ i)))
      (kcm:result "면적 적기" ""
        (list (strcat "적은 것      " (itoa done) " 개")
              (strcat "건너뛴 것    " (itoa skip) " 개 (넓이를 못 재는 것)")
              "" "지우려면 되돌리기 (U 또는 Ctrl+Z).")
        nil nil nil)))
)


;;; =============================================================== KTH 문자높이

(defun C:KTH ( / ss n i e d h cur )
  (kcm:pickmsg "문자 높이 바꾸기 - 문자를 고르십시오")
  (setq ss (ssget '((0 . "TEXT,MTEXT"))))
  (if (null ss)
    (progn (kcm:say "고른 문자가 없습니다.") "close")
    (progn
      (setq cur (cdr (assoc 40 (entget (ssname ss 0)))))
      (setq h (getreal (strcat "\n새 글자 높이 (지금 "
                               (kcm:num (cond (cur) (0.0)) 2) ") : ")))
      (if (or (null h) (<= h 0.0))
        (progn (kcm:say "취소했습니다.") "close")
        (progn
          (setq n (sslength ss) i 0)
          (while (< i n)
            (setq d (entget (ssname ss i)))
            (if (assoc 40 d) (entmod (subst (cons 40 h) (assoc 40 d) d)))
            (setq i (1+ i)))
          (kcm:result "문자 높이 바꾸기" ""
            (list (strcat "문자 " (itoa n) " 개의 높이를 " (kcm:num h 2) " 로 바꿨습니다.")
                  "" "되돌리려면 U 또는 Ctrl+Z.")
            nil nil nil)))))
)


;;; ================================================================= KLAY 레이어

(defun C:KLAY ( / ss n i ly tab tb all empt lines rows cnt )
  (kcm:say "[레이어] 도면 전체를 훑는 중입니다...")
  (setq ss (ssget "_X") tab '() n 0)
  (if ss
    (progn
      (setq n (sslength ss) i 0)
      (while (< i n)
        (setq tab (kcm:acc (cdr (assoc 8 (entget (ssname ss i)))) 1.0 tab))
        (setq i (1+ i)))))
  (setq all '() empt '() tb (tblnext "LAYER" T))
  (while tb
    (setq ly (cdr (assoc 2 tb)) all (cons ly all))
    (if (null (assoc ly tab)) (setq empt (cons ly empt)))
    (setq tb (tblnext "LAYER")))
  (setq tab (kcm:sortd tab))
  (setq lines (list (strcat "레이어      " (itoa (length all)) " 개")
                    (strcat "객체        " (itoa n) " 개")
                    (strcat "빈 레이어    " (itoa (length empt)) " 개")
                    "" "[ 객체가 많은 레이어 ]"))
  (setq cnt 0)
  (foreach a tab
    (setq cnt (1+ cnt))
    (if (<= cnt 20)
      (setq lines (append lines (list (strcat "  " (kcm:pad (car a) 26) " "
                                              (itoa (fix (cdr a))) " 개"))))))
  (if (> cnt 20) (setq lines (append lines (list "  ..."))))
  (if empt
    (progn
      (setq lines (append lines (list "" "[ 비어 있는 레이어 ]")) cnt 0)
      (foreach x (reverse empt)
        (setq cnt (1+ cnt))
        (if (<= cnt 20) (setq lines (append lines (list (strcat "  " x))))))
      (if (> cnt 20) (setq lines (append lines (list "  ..."))))
      (setq lines (append lines
        (list "" "지우려면 명령창에 PURGE 치고 「레이어」 를 고르십시오."
                 "(안전을 위해 이 유틸은 지우지 않습니다)")))))
  (setq rows '())
  (foreach a tab (setq rows (cons (strcat (kcm:cq (car a)) "," (itoa (fix (cdr a)))) rows)))
  (foreach x (reverse empt) (setq rows (cons (strcat (kcm:cq x) ",0") rows)))
  (kcm:result "레이어 살펴보기" "" lines "레이어,객체수" (reverse rows) nil)
)


;;; =============================================================== KDUP 중복제거

(defun kcm:ps ( p ) (strcat (rtos (car p) 2 6) "_" (rtos (cadr p) 2 6)))

(defun kcm:ptless ( a b )
  (or (< (car a) (car b))
      (and (equal (car a) (car b) 1e-9) (< (cadr a) (cadr b))))
)

(defun kcm:sig ( e / d ty p1 p2 s )
  (setq d (entget e) ty (cdr (assoc 0 d)))
  (setq s
    (cond
      ((= ty "LINE")
        (setq p1 (cdr (assoc 10 d)) p2 (cdr (assoc 11 d)))
        (if (kcm:ptless p2 p1) (strcat "L|" (kcm:ps p2) "|" (kcm:ps p1))
                               (strcat "L|" (kcm:ps p1) "|" (kcm:ps p2))))
      ((= ty "CIRCLE")
        (strcat "C|" (kcm:ps (cdr (assoc 10 d))) "|" (rtos (cdr (assoc 40 d)) 2 6)))
      ((= ty "ARC")
        (strcat "A|" (kcm:ps (cdr (assoc 10 d))) "|" (rtos (cdr (assoc 40 d)) 2 6)
                "|" (rtos (cdr (assoc 50 d)) 2 6) "|" (rtos (cdr (assoc 51 d)) 2 6)))
      ((= ty "POINT") (strcat "P|" (kcm:ps (cdr (assoc 10 d)))))
      ((= ty "TEXT")
        (strcat "T|" (kcm:ps (cdr (assoc 10 d))) "|" (cond ((cdr (assoc 1 d))) (""))))
      ((= ty "INSERT")
        (strcat "I|" (kcm:ps (cdr (assoc 10 d))) "|" (cond ((cdr (assoc 2 d))) (""))))
      ((= ty "LWPOLYLINE")
        (setq s "W|")
        (foreach v (kcm:lwvs d) (setq s (strcat s (kcm:ps (car v)) ";")))
        s)
      (T nil)))
  (if s (strcat (cdr (assoc 8 d)) "|" s) nil)
)

(defun C:KDUP ( / ss n i e s seen dups tab lines act )
  (kcm:pickmsg "겹친 것 지우기 - 검사할 것을 고르십시오 (전체는 Ctrl+A)")
  (setq ss (ssget))
  (if (null ss)
    (progn (kcm:say "고른 것이 없습니다.") "close")
    (progn
      (setq n (sslength ss) i 0 seen '() dups '() tab '())
      (while (< i n)
        (setq e (ssname ss i) s (kcm:sig e))
        (if s
          (if (member s seen)
            (progn (setq dups (cons e dups))
                   (setq tab (kcm:acc (cdr (assoc 0 (entget e))) 1.0 tab)))
            (setq seen (cons s seen))))
        (setq i (1+ i)))
      (if (null dups)
        (kcm:result "겹친 것 지우기" ""
          (list (strcat "고른 것      " (itoa n) " 개") ""
                "똑같이 겹친 것이 없습니다.  깨끗합니다.") nil nil nil)
        (progn
          (setq lines (list (strcat "고른 것      " (itoa n) " 개")
                            (strcat "겹친 것      " (itoa (length dups)) " 개") ""))
          (foreach a (kcm:sortd tab)
            (setq lines (append lines (list (strcat "  " (kcm:pad (car a) 20) " "
                                                    (itoa (fix (cdr a))) " 개")))))
          (setq lines (append lines
            (list "" "겹친 선이 있으면 수량이 두 배로 나옵니다."
                     "이어서 지울지 물어봅니다. 지워도 U 로 되돌아갑니다.")))
          (kcm:result "겹친 것 지우기" "" lines nil nil nil)
          (initget "Y N")
          (if (= "Y" (cond ((getkword (strcat "\n겹친 " (itoa (length dups))
                                              "개를 지울까요? [Y/N] <N>: "))) ("N")))
            (progn
              (foreach x dups (entdel x))
              (kcm:result "겹친 것 지우기" ""
                (list (strcat (itoa (length dups)) " 개를 지웠습니다.")
                      "" "되돌리려면 U 또는 Ctrl+Z.") nil nil nil))
            (progn (kcm:say "  안 지웠습니다.") "close"))))))
)


;;; ================================================================== KBG 배경색

(defun C:KBG ( / k now )
  (initget "W B")
  (setq k (getkword "\n배경을 어떻게 할까요? [흰색W/검정B] <B 검정>: "))
  (if (null k) (setq k "B"))
  (if (= k "W")
    (progn (setenv "Background" "16777215") (setq now "흰색"))
    (progn (setenv "Background" "0")        (setq now "검정")))
  (kcm:result "배경색" ""
    (list (strcat "배경을 " now " 으로 바꿔 봤습니다.")
          ""
          "화면이 안 바뀌면 캐드를 껐다 켜 보십시오."
          "그래도 안 되면 아래가 확실합니다."
          ""
          "   옵션(OPTIONS) -> 화면표시 -> 색상"
          "   -> 2D 모형 공간 -> 균일한 배경 -> 흰색 또는 검정"
          ""
          "[ 흰색으로 두면 ]"
          "   . 복사해서 엑셀·워드에 붙일 때 검은 바탕이 안 딸려옵니다"
          "   . 선 색이 「흰검(7)」 인 것은 캐드가 알아서 검게 보여 줍니다"
          "   . 도면 내용은 하나도 안 바뀝니다"
          ""
          "[ 되돌리려면 ]"
          "   KBG 를 다시 치고  B  를 고르십시오."
          "   또는 명령창에 이 한 줄을 붙여넣으십시오"
          "      (setenv \"Background\" \"0\")"
          ""
          "* 오토캐드 기준입니다. 캐디안·ZWCAD 는 위 옵션 경로로 하십시오.")
    nil nil nil)
)


;;; ================================================ KINSTALL  자동으로 올라오게

;; 캐드를 켤 때마다 저절로 불러오게 등록합니다 (acaddoc.lsp 에 한 줄 추가)
(defun kcm:acaddoc () (strcat (getvar "ROAMABLEROOTPREFIX") "Support\\acaddoc.lsp"))

(defun kcm:mypath ( / me )
  (setq me (findfile "k-conmap.lsp"))
  (if (null me) (setq me (findfile "k-conmap_utf8.lsp")))
  (if (null me)
    (progn
      (alert (strcat "지금 쓰고 계신  k-conmap.lsp  파일을 골라 주십시오.\n\n"
                     "캐드를 켤 때마다 저절로 올라오게 등록합니다."))
      (setq me (getfiled "k-conmap.lsp 고르기" "" "lsp" 4))))
  me
)

(defun C:KINSTALL ( / me tgt f ln have )
  (setq me (kcm:mypath))
  (if (null me)
    (progn (kcm:say "취소했습니다.") (princ))
    (progn
      (setq tgt (kcm:acaddoc) have nil)
      (setq f (open tgt "r"))
      (if f
        (progn
          (while (setq ln (read-line f))
            (if (kcm:has ln "k-conmap") (setq have T)))
          (close f)))
      (if have
        (kcm:result "자동 등록" ""
          (list "이미 등록돼 있습니다." ""
                "캐드를 켤 때마다 저절로 올라옵니다."
                "" (strcat "등록 파일 : " tgt)
                "" "빼려면  KUNINSTALL") nil nil nil)
        (progn
          (setq f (open tgt "a"))
          (if f
            (progn
              (write-line "" f)
              (write-line ";;; --- K-건설맵 캐드 유틸 자동 불러오기 (KUNINSTALL 로 뺍니다) ---" f)
              (write-line (strcat "(if (findfile \"" (kcm:slash me) "\") (load \""
                                  (kcm:slash me) "\"))") f)
              (close f)
              (kcm:result "자동 등록" ""
                (list "등록했습니다."
                      "이제 캐드를 켤 때마다 저절로 올라옵니다." ""
                      (strcat "유틸 파일 : " me)
                      (strcat "등록 파일 : " tgt)
                      ""
                      "* 유틸 파일을 지우거나 다른 폴더로 옮기면 못 찾습니다."
                      "  C:/CAD유틸/ 처럼 안 건드릴 자리에 두십시오."
                      ""
                      "빼려면  KUNINSTALL") nil nil nil))
            (alert (strcat "등록 파일을 쓰지 못했습니다.\n\n" tgt
                           "\n\nAPPLOAD 의 [시작 도구 모음] 으로 등록해 주십시오.")))))))
)

(defun C:KUNINSTALL ( / tgt f ln keep n )
  (setq tgt (kcm:acaddoc) keep (list) n 0)
  (setq f (open tgt "r"))
  (if (null f)
    (progn (alert "등록된 것이 없습니다.") (princ))
    (progn
      (while (setq ln (read-line f))
        (if (kcm:has ln "k-conmap") (setq n (1+ n)) (setq keep (append keep (list ln)))))
      (close f)
      (if (= n 0)
        (kcm:result "자동 등록 빼기" "" (list "등록된 것이 없습니다.") nil nil nil)
        (progn
          (setq f (open tgt "w"))
          (if f
            (progn
              (foreach l keep (write-line l f))
              (close f)
              (kcm:result "자동 등록 빼기" ""
                (list (strcat "등록을 뺐습니다. (" (itoa n) "줄)") ""
                      "다음부터는 APPLOAD 로 직접 올리셔야 합니다."
                      "" "다시 넣으려면  KINSTALL") nil nil nil))
            (alert "파일을 고치지 못했습니다."))))))
)


;;; ================================================== KUPDATE  새 버전 확인

(defun C:KUPDATE ()
  (startapp "explorer" "https://k-conmap.com/cad")
  (kcm:result "새 버전 확인" ""
    (list (strcat "지금 쓰시는 것은  " kcm*ver "  입니다.") ""
          "다운로드 쪽을 브라우저로 열었습니다."
          "사이트의 버전이 더 높으면 받아서"
          "지금 쓰시는 파일에 그대로 덮어쓰십시오." ""
          "설정(도면 단위·좌표 표기)은 그대로 남습니다."
          "KINSTALL 로 등록해 두셨으면 다시 등록할 필요도 없습니다." ""
          "  https://k-conmap.com/cad") nil nil nil)
)


;;; ============================================================ 사이트·도움말

(defun C:KCONMAP () (startapp "explorer" "https://k-conmap.com") (princ))
(defun C:KSARASA () (startapp "explorer" "https://sarasa.kr") (princ))

(defun C:KHELP ()
  (kcm:result "도움말" ""
    (list "쓰는 법은 하나입니다."
          ""
          "   명령창에  K  ->  단추 누르기  ->  마우스로 고르기  ->  Enter"
          ""
          "고르고 나서 Enter 를 안 치면 계속 기다립니다. 여기서 제일 많이 막힙니다."
          ""
          "[ 재기 ]"
          "  길이 합계     선·폴리선·호·원 (레이어별·색깔별로 갈라 줍니다)"
          "  면적 합계     닫힌 폴리선·원 (m2 와 평)"
          "  숫자 합계     도면 문자 속 숫자 더하기"
          "  개수 세기     블록·객체를 이름별로"
          "  거리 재기     점을 이어 찍으며 누적"
          "  선 정보 보기   색·레이어·선종류·선굵기·길이"
          ""
          "[ 좌표 ]"
          "  좌표 뽑기     도면 -> 엑셀(CSV)"
          "  좌표 적기     측점 -> 글자 자리 두 번 찍으면 지시선과 X·Y"
          "  좌표 넣기     엑셀(CSV) -> 도면에 점으로"
          "  KXYMODE      좌표 표기를 측량식/도면식으로 바꾸기"
          ""
          "[ 정리 ]"
          "  면적 적기     폴리선 안에 면적을 글자로"
          "  문자 높이     고른 문자 크기를 한 번에"
          "  레이어       레이어별 객체 수·빈 레이어"
          "  겹친 것 지우기  똑같이 겹친 선 (수량 두 배 사고 방지)"
          "  검은 배경     엑셀에 붙일 때 검은 바탕 없애기"
          ""
          "도면 단위는 자동으로 잡습니다. 숫자가 1,000배 이상하면"
          "메뉴 창 아래에서 mm / cm / m 을 바꾸십시오."
          ""
          "[ 한 번만 해 두면 좋은 것 ]"
          "  KINSTALL     캐드 켤 때마다 저절로 올라오게 등록"
          "  KUNINSTALL   그 등록을 빼기"
          "  KUPDATE      새 버전 나왔는지 보기"
          ""
          "만든 곳: K-건설맵  k-conmap.com   무료입니다."
          "자유롭게 나눠 주십시오. 만든 곳 표시만 지우지 말아 주십시오.")
    nil nil nil)
)


;;; ============================================================= K  (메인 메뉴)

(defun kcm:textmenu ( / k )
  ;; 창이 안 뜨는 캐드에서 쓰는 「글자 메뉴」
  (initget "L A N C D I XY XYT IN AT TH LAY DUP BG HELP SITE")
  (setq k (getkword
    (strcat "\n무엇을 할까요?"
            "\n [길이L/면적A/숫자N/개수C/거리D/정보I]"
            "\n [좌표뽑기XY/좌표적기XYT/좌표넣기IN]"
            "\n [면적적기AT/문자높이TH/레이어LAY/중복DUP/배경BG]"
            "\n [도움말HELP/사이트SITE]  <L>: ")))
  (cond
    ((null k) "kl")
    ((= k "L") "kl")   ((= k "A") "ka")   ((= k "N") "kn")  ((= k "C") "kc")
    ((= k "D") "kd")   ((= k "I") "ki")   ((= k "XY") "kxy")((= k "XYT") "kxyt")
    ((= k "IN") "kin") ((= k "AT") "kat") ((= k "TH") "kth")((= k "LAY") "klay")
    ((= k "DUP") "kdup")((= k "BG") "kbg")((= k "HELP") "khelp")((= k "SITE") "ksite")
    (T nil))
)

(defun C:K ( / go pick act )
  (if (kcm:expired)
    (progn (kcm:expalert) (exit)))
  (kcm:u)
  (setq go T)
  (while go
    (setq pick (kcm:menudlg))
    (if (null pick) (setq pick (if kcm*dcl nil (kcm:textmenu))))
    (if (null pick)
      (setq go nil)
      (progn
        (setq act
          (cond
            ((= pick "kl")   (C:KL))   ((= pick "ka")   (C:KA))
            ((= pick "kn")   (C:KN))   ((= pick "kc")   (C:KC))
            ((= pick "kd")   (C:KD))   ((= pick "ki")   (C:KI))
            ((= pick "kxy")  (C:KXY))  ((= pick "kxyt") (C:KXYT))
            ((= pick "kin")  (C:KIN))  ((= pick "kat")  (C:KAT))
            ((= pick "kth")  (C:KTH))  ((= pick "klay") (C:KLAY))
            ((= pick "kdup") (C:KDUP)) ((= pick "kbg")  (C:KBG))
            ((= pick "khelp")(C:KHELP))
            ((= pick "ksite")(progn (startapp "explorer" "https://k-conmap.com") "again"))
            (T "close")))
        (if (/= act "again") (setq go nil)))))
  (princ)
)


;;; ============================================================== 불러올 때 인사

(kcm:autounit)
(princ "\n=================================================================")
(cond
  ((kcm:expired)
    (princ (strcat "\n [기간 지남] 이 판은 " (kcm:dstr kcm*exp) " 까지였습니다."))
    (princ "\n             최신판을 받아 주십시오 -> k-conmap.com/cad"))
  ((>= (kcm:today) kcm*warn)
    (princ (strcat "\n [알림] 이 판은 " (kcm:dstr kcm*exp) " 까지입니다. 곧 끝납니다."))
    (princ "\n        k-conmap.com/cad 에서 새로 받아 덮어쓰십시오. 10초면 됩니다. (KUPDATE)"))
)
(princ "\n K-건설맵 캐드 유틸 2.5  (k-conmap.lsp)   k-conmap.com")
(princ "\n")
(princ "\n     명령창에  K  만 치십시오.  단추 창이 뜹니다.")
(princ "\n")
(princ "\n=================================================================\n")
(princ)
