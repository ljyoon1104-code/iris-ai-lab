# Iris AI Lab 최종 검증 보고서 (FINAL VERIFICATION REPORT)

본 문서는 **Iris AI Lab** 웹 플랫폼의 10단계 전체 통합 검증 결과를 기록한 보고서입니다.

---

## 1. 데이터셋 통합 검증 결과

- **ORIGINAL_IRIS_DATASET**: 총 **150개** (Iris-setosa 50개, Iris-versicolor 50개, Iris-virginica 50개) - 불변성(Immutability) 100% 보존 검증 완료.
- **ERROR_IRIS_DATASET**: 총 **20개** 탐정 데이터 (오류 행 12개, 비교 정상 행 8개) - 정답 해설 12개 100% 일치.
- **BIASED_IRIS_DATASET**: 총 **50개** 편향 데이터 (Setosa 40개 [80%], Versicolor 8개, Virginica 2개) - 편향 분석용 정상 작동.

---

## 2. 알고리즘 엔진 & 훈련 정확도 검증

### (1) 의사결정트리 훈련 데이터 정확도 (150개 원본 기준)
- `maxDepth = 2`: **96.0%** (144 / 150)
- `maxDepth = 3`: **97.3%** (146 / 150)
- `maxDepth = 4`: **99.3%** (149 / 150)
- **분기 용어**: Gini Impurity (Gini 불순도 감소) 용어로 통일.

### (2) 층화 분할 (Stratified Split, seed 42) & 테스트 정확도 (80:20 분할)
- **80:20 분할**: 훈련 120개 (40/40/40), 테스트 30개 (10/10/10)
- **k-NN 테스트 정확도**:
  - $k=1$: **93.3%** (28/30)
  - $k=3, 5, 7$: **96.7%** (29/30)
- **의사결정트리 테스트 정확도**:
  - $depth=2, 3, 4$: **90.0%** (27/30)
- **테스트 데이터 누출 방지**: Test 데이터를 훈련 시에 절대 전달하지 않는 엄격한 분리 구조 검증 완료.

### (3) 기타 알고리즘
- **선형 회귀 (OLS)**: $y = 0.42 \times X - 0.37$ ($R^2 = 0.93$)
- **k-means 비지도 군집화**: 품종 레이블 100% 미사용, 4단계 내 수렴 및 시드(42) 재현성 검증.
- **강화학습 (Q-Learning)**: $5 \times 5$ 격자판 100 에피소드 학습 후 최적 정책 경로 도출.
- **3×3 혼동행렬 (Confusion Matrix)**: 행(실제 품종 $\downarrow$) vs 열(예측 품종 $\rightarrow$) 3x3 구조 100% 매핑.

---

## 3. 디바이스 반응형 & 접근성 검수

- **375px 스마트폰**: 세로 1열 카드 배치, 44px+ 터치 타겟, 하단 내비게이션 바 padding 확보로 콘텐츠 가림 없음, 가로 스크롤 0건.
- **768px 태블릿**: 2열 그리드 배치 및 인터랙티브 그래프 컨트롤 정상.
- **1280px+ PC**: 교사 시연용 대형 대시보드 및 3회 실험 한눈에 비교 가능.
- **접근성**: `focus-visible`, 버튼 aria-label, 정답/오답 아이콘+문자+색상 다중 전달 적용.

---

## 4. 정적 빌드 및 배포 상태

- `npm run build` (`tsc -b && vite build`): **오류 0건 (Build Clean Success)**
- `npm run verify` (`npx tsx src/utils/verifyProject.ts`): **ALL TESTS PASSED**
- `npm run preview`: 프로덕션 배포 런타임 오류 0건.

---

## 5. 의도된 기술적 제한사항 (Known Limitations)

1. 외부 백엔드 서버나 AI API 연결 없이 100% 웹 브라우저 로컬 연산으로 동작함.
2. 선형 회귀는 Iris의 두 수치형 속성 관계 교육용 2D 회귀 체험으로 한정함.
3. 강화학습은 Iris 데이터와 분리된 $5 \times 5$ 격자 로봇 탐사 환경으로 구성됨.

---

## 6. GitHub Pages 정적웹 공개 배포 (GitHub Pages Deployment)

- **Repository**: [https://github.com/ljyoon1104/iris-ai-lab](https://github.com/ljyoon1104/iris-ai-lab)
- **Public URL**: [https://ljyoon1104.github.io/iris-ai-lab/](https://ljyoon1104.github.io/iris-ai-lab/)
- **Vite Base Path**: `/iris-ai-lab/`
- **Build & CI/CD**: GitHub Actions Workflow (`.github/workflows/deploy.yml`) - `npm ci` ➔ `npm run verify` ➔ `npm run build` ➔ GitHub Pages Deploy.

---

## 7. 최종 평가 결과

**[ 최종 판정: A. 수업 사용 가능 ]**
학생 참여형 인공지능 기초 및 정보 교과 수업에 즉시 활용 가능합니다.
