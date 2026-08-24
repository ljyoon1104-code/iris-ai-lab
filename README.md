# Iris AI Lab - 붓꽃 데이터로 배우는 기계학습

인공지능(AI) 기초 및 정보 교과 수업을 위해 개발된 **학생 참여형 웹 기반 머신러닝 실습 플랫폼**입니다.
백엔드 서버나 외부 AI API 호출 없이 **학생 브라우저 내부(Serverless / Client-only)**에서 100% 실행되며, 코딩 없이도 기계학습 문제 해결 6단계 전 과정을 시각적으로 경험할 수 있습니다.

- 🌐 **학생용 무료 공개 웹 사이트**: [https://ljyoon1104-code.github.io/iris-ai-lab/](https://ljyoon1104-code.github.io/iris-ai-lab/)

---

## 🌟 주요 특징

- **100% 서버리스 & 개인정보 보호**: 학생 로그인, 회원가입, 개인정보 수집, 외부 AI API 호출이 일절 없으며, 모든 연산은 웹 브라우저 내에서 즉시 처리됩니다.
- **학생 학습 기록 보존**: 별도의 서버 DB나 계정 없이 브라우저의 `localStorage`에만 학습 진행 상태가 안전하게 저장됩니다 (다른 기기나 브라우저 접속 시에는 독립된 진행 상태 유지).
- **머신러닝 문제 해결 공식 6단계 통합**:
  1. 문제 정의
  2. 데이터 수집
  3. 데이터 전처리
  4. 기계학습 유형과 알고리즘 선정
  5. 모델 학습
  6. 성능 평가 및 수정
- **5대 머신러닝 알고리즘 인터랙티브 시뮬레이터**:
  - **k-NN (최근접 이웃)**: 2D SVG 산점도, $k$선택, 유클리드 거리 및 다수결 투표
  - **의사결정트리 (Decision Tree)**: Gini 불순도 기반 분기, 최대 깊이 조절 및 조건 가지 추적
  - **선형 회귀 (Linear Regression)**: 최소제곱법(OLS) 최적 직선($y = ax + b$), 수치 예측 및 수동 직관 조절
  - **k-means (k-평균 군집화)**: 품종 레이블 100% 무시 비지도 학습, 중심점 이동 및 수렴 시뮬레이션
  - **강화학습 (Q-Learning)**: $5 \times 5$ 온실 탐사 로봇 보상(+10)/벌점(-5) 경로 학습
- **모델 평가 & 실험 비교**: 층화 분할(80:20, 70:30, 60:40), 3×3 혼동행렬(Confusion Matrix) 및 최대 3회 실험 비교 대시보드
- **반응형 멀티 디바이스 지원**: 모바일(375px), 태블릿(768px), PC(1280px+) 및 교사 시연용 대형 프로젝터 화면 최적화

---

## 🚀 교사 및 개발자 실행 방법

### 방법 1: 원클릭 배치 파일 실행 (추천)
프로젝트 폴더의 `Iris AI Lab 실행.bat` 파일을 더블 클릭하면 자동으로 환경을 검사하고 개발 서버를 시작하여 웹 브라우저를 엽니다.

### 방법 2: 터미널 명령어 실행
```bash
# 1. 의존성 패키지 설치
npm install

# 2. 검증 테스트 스위트 실행
npm run verify

# 3. 개발 서버 실행 (http://localhost:5173/iris-ai-lab/)
npm run dev

# 4. 프로덕션 배포용 빌드
npm run build

# 5. 정적 빌드 프로덕션 프리뷰
npm run preview
```

---

## 📂 주요 폴더 구조

```text
src/
├── algorithms/           # 5대 알고리즘 순수 계산 엔진 (UI 독립)
│   ├── knn.ts
│   ├── decisionTree.ts
│   ├── linearRegression.ts
│   ├── kmeans.ts
│   ├── reinforcementLearning.ts
│   └── evaluation.ts     # 층화 분할, 정확도 및 3x3 혼동행렬
├── components/
│   ├── common/           # Header, BottomNavigation, Buttons, Modal
│   └── learning/         # 01~08 학습 활동 모듈 및 시뮬레이터
├── data/
│   ├── irisDataset.ts    # ORIGINAL(150개), ERROR(20개), BIASED(50개)
│   └── modules.ts        # 8개 영역 학습 커리큘럼 및 6단계 정의
├── pages/                # HomePage, ModuleDetailPage
└── utils/
    ├── storage.ts        # localStorage 진행률 안전 관리
    └── verifyProject.ts  # 자동화 검증 스위트
```

---

## 🌐 정적 웹 배포 (GitHub Pages)

main 브랜치에 코드를 push하면 `.github/workflows/deploy.yml`의 GitHub Actions 워크플로가 자동으로 `npm run verify` ➔ `npm run build`를 거쳐 GitHub Pages에 배포됩니다.

- **GitHub Repository**: [https://github.com/ljyoon1104-code/iris-ai-lab](https://github.com/ljyoon1104-code/iris-ai-lab)
- **GitHub Pages Public URL**: [https://ljyoon1104-code.github.io/iris-ai-lab/](https://ljyoon1104-code.github.io/iris-ai-lab/)

---

## 📊 데이터셋 출처 & 라이선스

- **Iris Species Dataset**: Edgar Anderson 및 Ronald Fisher의 클래식 붓꽃 데이터셋 (150 레코드: Setosa 50, Versicolor 50, Virginica 50).
- 본 학습용 자료는 수업용 교육 목적으로 가공·정제되어 포함되어 있습니다.
