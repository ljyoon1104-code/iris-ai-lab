import React, { useState, useMemo } from 'react';
import { useActivityScrollTop } from '../../hooks/useActivityScrollTop';
import { ActivityProgress } from './ActivityProgress';
import { ChoiceCard } from './ChoiceCard';
import { PromptCard } from './PromptCard';
import { IrisDatasetPreview } from './IrisDatasetPreview';
import { PrimaryButton } from '../common/PrimaryButton';
import { SecondaryButton } from '../common/SecondaryButton';
import {
  ORIGINAL_IRIS_DATASET,
  BIASED_IRIS_DATASET,
  IRIS_METADATA,
} from '../../data/irisDataset';
import { getDatasetCounts } from '../../utils/irisHelpers';
import { SpeciesLabel } from '../common/SpeciesBadge';
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Database,
  Layers,
  ChevronDown,
  ChevronUp,
  Eye,
  Ruler,
  MessageSquare,
  Cpu,
  Code2,
  Landmark,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Check,
  Target,
  Scale,
} from 'lucide-react';

interface Module03ActivityProps {
  isCompleted: boolean;
  onComplete: () => void;
}

// ----------------------------------------------------
// Activity 3: Candidates Configuration
// ----------------------------------------------------
interface CandidateAttribute {
  key: string;
  label: string;
  sub: string;
  trueRole: 'X' | 'y' | 'unneeded';
  hint: string;
}

const ACT3_CANDIDATES: CandidateAttribute[] = [
  { key: 'sepalLength', label: '꽃받침 길이', sub: '측정 수치 (cm)', trueRole: 'X', hint: '꽃의 크기를 나타내는 수치 데이터' },
  { key: 'sepalWidth', label: '꽃받침 너비', sub: '측정 수치 (cm)', trueRole: 'X', hint: '꽃의 모양을 판별하는 수치 데이터' },
  { key: 'petalLength', label: '꽃잎 길이', sub: '측정 수치 (cm)', trueRole: 'X', hint: '품종 구별에 매우 유용한 핵심 수치' },
  { key: 'petalWidth', label: '꽃잎 너비', sub: '측정 수치 (cm)', trueRole: 'X', hint: '꽃잎의 폭을 나타내는 핵심 수치' },
  { key: 'species', label: '붓꽃 품종', sub: '세토사/버시컬러/버지니카', trueRole: 'y', hint: 'AI가 최종적으로 맞혀야 하는 품종 정답' },
  { key: 'measureDate', label: '측정한 날짜', sub: '예: 2024년 5월 12일', trueRole: 'unneeded', hint: '시기별 생육 연구 등에는 쓰일 수 있지만, 이번 붓꽃 품종 분류 문제에서는 사용하지 않는 정보' },
  { key: 'potNumber', label: '화분 식별 번호', sub: '예: 화분 #42', trueRole: 'unneeded', hint: '화분 위치 관리 등에는 쓰일 수 있지만, 이번 붓꽃 품종 분류 문제에서는 사용하지 않는 정보' },
  { key: 'observerName', label: '조사자 이름', sub: '예: 김철수 연구원', trueRole: 'unneeded', hint: '측정 기록 확인 등에는 쓰일 수 있지만, 이번 붓꽃 품종 분류 문제에서는 사용하지 않는 정보' },
];

// ----------------------------------------------------
// Activity 4: 7 Collection Methods & Scenarios
// ----------------------------------------------------
const COLLECTION_METHODS = [
  {
    id: 'observe',
    name: '관찰',
    tag: '직접 수집',
    icon: Eye,
    color: 'emerald',
    summary: '사람, 사물, 현상의 상태나 행동을 직접 보고 기록',
    details: '교통량 관찰, 식물의 개화 시기, 야생동물 행동 관찰 등 물리적 조작 없이 있는 그대로를 기록합니다.',
  },
  {
    id: 'measure',
    name: '측정',
    tag: '도구 활용',
    icon: Ruler,
    color: 'blue',
    summary: '도구를 이용해 길이, 무게, 온도 등의 수치를 정밀 기록',
    details: '자, 저울, 온도계, 버니어 캘리퍼스 등을 사용합니다. 🌸 붓꽃의 꽃받침·꽃잎 길이와 너비는 측정 데이터입니다.',
  },
  {
    id: 'survey',
    name: '설문·인터뷰',
    tag: '사람 대상',
    icon: MessageSquare,
    color: 'indigo',
    summary: '사람의 생각, 경험, 선호, 의견 등을 질문하여 수집',
    details: '생성형 AI 사용 경험, 만족도 조사, 진로 희망 등 주관적 인식·경험 데이터를 수집할 때 가장 적합한 공식 방법입니다.',
  },
  {
    id: 'sensor',
    name: '자동화 장치·센서',
    tag: '연속 자동화',
    icon: Cpu,
    color: 'amber',
    summary: '센서나 IoT 장치가 일정한 주기로 데이터를 사람 개입 없이 자동 수집',
    details: '실내외 온도 센서, 미세먼지 측정기, 스마트워치 심박수, GPS 등 지속적이고 균일한 수집에 필수적입니다.',
  },
  {
    id: 'code',
    name: '프로그램·코드를 통한 수집',
    tag: '웹 수집 / API',
    icon: Code2,
    color: 'purple',
    summary: '프로그램으로 웹 정보를 자동 수집(크롤링)하거나 공식 API로 데이터 연동',
    details: '뉴스 제목, 온라인 상품 가격 추적, 날씨/지도 API 연동 등. ⚠️ 웹 공개 데이터라도 사이트 이용정책(robots.txt), 저작권, 개인정보를 준수해야 합니다.',
  },
  {
    id: 'existing_public',
    name: '기존 공개 데이터 활용',
    tag: '공개 데이터셋',
    icon: Database,
    color: 'teal',
    summary: '기업, 연구기관, 데이터 플랫폼 등이 이미 수집하여 공개한 데이터를 활용하는 방법',
    details: 'Kaggle, UCI Machine Learning Repository, 연구기관 데이터 저장소, 기업 공개 데이터 등. 💡 데이터의 출처, 이용 조건, 라이선스를 확인해야 합니다.',
  },
  {
    id: 'public',
    name: '공공데이터 활용',
    tag: '정부·공공기관',
    icon: Landmark,
    color: 'rose',
    summary: '정부와 공공기관이 공개한 데이터를 활용하는 방법',
    details: '공공데이터포털(data.go.kr), 국가통계포털(KOSIS), 기상자료, 교통·환경·인구 데이터 등 공인된 신뢰도 높은 데이터를 제공합니다.',
  },
];

const ACT4_SITUATIONS = [
  {
    id: 1,
    title: '상황 1: 학교 화단의 붓꽃 100송이의 꽃잎 길이를 조사하려고 합니다.',
    targetMethod: 'measure',
    options: [
      { id: 'measure', label: '자 또는 버니어 캘리퍼스로 직접 측정' },
      { id: 'survey', label: '학생들에게 예상 길이 설문조사 진행' },
      { id: 'code', label: '온라인 쇼핑몰 꽃 사진 웹 크롤링' },
      { id: 'public', label: '기상청 공공데이터 포털 조회' },
    ],
    explanation: '꽃잎 길이는 실제 물리적 수치이므로 자나 버니어 캘리퍼스 같은 정밀 도구로 직접 측정하는 것이 가장 적합합니다.',
  },
  {
    id: 2,
    title: '상황 2: 우리 학교 학생들이 생성형 AI를 얼마나 자주 사용하는지 알고 싶습니다.',
    targetMethod: 'survey',
    options: [
      { id: 'survey', label: '학생 대상 설문조사 및 심층 인터뷰' },
      { id: 'sensor', label: '교실 천장에 모션 감지 센서 설치' },
      { id: 'measure', label: '학생들의 스마트폰 무게 측정' },
      { id: 'public', label: '통계청 전국 청소년 통계 데이터 다운로드' },
    ],
    explanation: '학생들의 실제 사용 습관과 주관적인 경험을 파악하려면 설문조사나 인터뷰로 직접 질문하는 것이 가장 효과적입니다.',
  },
  {
    id: 3,
    title: '상황 3: 교실 온도를 1분마다 30일 동안 쉬지 않고 계속 기록하려고 합니다.',
    targetMethod: 'sensor',
    options: [
      { id: 'sensor', label: '온습도 IoT 센서 장치로 자동 수집' },
      { id: 'observe', label: '사람이 1분마다 교실에 상주하며 눈으로 기록' },
      { id: 'survey', label: '학생들에게 매일 체감 온도 설문 진행' },
      { id: 'existing_public', label: 'Kaggle에서 해외 학교 온도 데이터 검색' },
    ],
    explanation: '1분 간격으로 밤낮없이 30일간 연속 기록하는 것은 사람이 할 수 없으므로 자동화 센서가 필수적입니다.',
  },
  {
    id: 4,
    title: '상황 4: 최근 5년간 서울시의 공식 미세먼지 농도 통계 자료가 필요합니다.',
    targetMethod: 'public',
    options: [
      { id: 'public', label: '공공데이터 활용 (공공데이터포털 등)' },
      { id: 'survey', label: '서울 시민 100명 대상 미세먼지 체감 설문' },
      { id: 'observe', label: '학교 옥상에서 하늘의 흐림 정도 직접 관찰' },
      { id: 'measure', label: '간이 측정기로 1회 측정 후 5년치 추정' },
    ],
    explanation: '과거 5년간의 광범위한 공인 환경 통계 자료는 정부와 공공기관이 공개한 공공데이터를 활용하는 것이 가장 적합합니다.',
  },
  {
    id: 5,
    title: '상황 5: 여러 온라인 쇼핑몰 상품의 가격 변동을 프로그램으로 정기 조사하려고 합니다.',
    targetMethod: 'code',
    options: [
      { id: 'code', label: '웹 크롤링/스크래핑 프로그램 또는 쇼핑몰 API 활용' },
      { id: 'measure', label: '각 쇼핑몰 택배 박스 무게 측정' },
      { id: 'survey', label: '소비자들에게 상품 가격 기억 설문' },
      { id: 'public', label: '정부 소비자물가 연간 보고서 열람' },
    ],
    explanation: '다수 웹사이트에 수시로 바뀌는 대량의 디지털 상품 가격은 웹 수집 프로그램이나 공식 API를 작성해 자동화하는 것이 가장 효과적입니다.',
  },
  {
    id: 6,
    title: '상황 6: 전 세계 연구자들이 검증한 150개의 표준 붓꽃 데이터셋을 즉시 활용하려고 합니다.',
    targetMethod: 'existing_public',
    options: [
      { id: 'existing_public', label: '기존 공개 데이터 활용 (Kaggle 또는 UCI 연구 저장소)' },
      { id: 'observe', label: '주말에 식물원에 가서 150송이 직접 관찰' },
      { id: 'survey', label: '생물 선생님께 붓꽃 품종 설문 질문' },
      { id: 'sensor', label: '화분에 조도 센서 설치하여 150일 측정' },
    ],
    explanation: '이미 학술적으로 검증되어 널리 표준으로 공개된 데이터는 Kaggle이나 UCI 같은 기존 공개 데이터셋을 활용하는 것이 가장 효과적입니다.',
  },
];

// ----------------------------------------------------
// Activity 6: 5 Bias Types & Cases
// ----------------------------------------------------
const BIAS_TYPES = [
  {
    id: 'human',
    title: '인간의 편향 (Human Bias)',
    oneLine: '사람의 판단이나 선입견이 데이터에 들어온 편향',
    cause: '데이터를 수집·선택·분류하는 사람의 주관적 선입견이나 고정관념이 개입됨',
    problem: '평가자나 수집자의 편견이 데이터의 라벨과 점수에 그대로 반영되어 전파됨',
    example: '지원자를 평가하는 채용 면접관이 자신도 모르게 특정 배경의 사람에게 더 높은 점수를 부여함',
  },
  {
    id: 'hidden',
    title: '숨겨진 편향 (Hidden Bias)',
    oneLine: '겉으로는 보이지 않지만 다른 정보와의 관계 속에 숨어 있는 편향',
    cause: '모델은 소득 정보를 직접 쓰지 않았으나, 겉보기에 중립적인 지역 정보(우편번호)가 소득 수준이나 교육 환경과 강하게 연결되어 있음',
    problem: '직접 사용하지 않은 정보의 영향이 다른 특성과의 상관관계를 통해 결과에 은밀하게 숨어 들어옴',
    example: '거주 지역은 단순한 위치 정보처럼 보이지만 소득 수준과 연결되어 특정 집단에 대출 거절이 집중됨',
  },
  {
    id: 'sampling',
    title: '데이터 표본 편향 (Sampling Bias)',
    oneLine: '일부 대상만 너무 많이 또는 너무 적게 모은 편향',
    cause: '전체 모집단 중에서 수집하기 쉬운 특정 집단이나 특정 환경의 표본만 과도하게 수집함',
    problem: '수집한 표본이 전체 대상을 골고루 대표하지 못해 수집 과정의 대표성 문제가 발생함 (40/8/2 사례)',
    example: '온라인 설문만 진행하여 인터넷 사용이 어려운 노년층이나 디지털 취약계층의 응답이 거의 누락됨',
  },
  {
    id: 'longtail',
    title: '롱테일 편향 (Long-tail Bias)',
    oneLine: '흔한 사례는 많고 희귀한 사례는 매우 적은 편향',
    cause: '현실 세계에서 일상적인 사례는 발생 빈도가 높고, 특수한 희귀 사례는 자연적으로 드물게 발생함',
    problem: '흔한 다수 사례는 풍부하지만, 드물지만 꼭 대처해야 하는 긴 꼬리(Long Tail) 희귀 사례 데이터가 부족함',
    example: '자율주행용 도로 영상에서 일반 승용차 데이터는 수백만 건이지만, 특수 구급차나 공사 차량 데이터는 극소수임',
  },
  {
    id: 'intentional',
    title: '고의적 편향 (Intentional Bias)',
    oneLine: '원하는 결과를 만들려고 의도적으로 데이터를 치우치게 한 경우',
    cause: '특정 결론을 유도하거나 제품/정책을 유리하게 홍보하기 위해 고의로 데이터를 취사선택함',
    problem: '불리한 데이터를 일부러 누락하거나 조작하여 데이터 자체의 정직성과 공정성이 훼손됨',
    example: '제품 만족도 조사 결과에서 불만족 응답을 고의로 제외하고 만족한 응답만 골라 대외 홍보에 활용함',
  },
];

const ACT6_CASES = [
  {
    id: 1,
    text: '얼굴 인식 AI 모델을 개발하면서 20대 대학생 얼굴 사진만 대부분 수집했다.',
    targetType: 'sampling',
    hint: '전체 연령을 골고루 모으지 않고 특정 집단 표본만 과도하게 모은 경우입니다.',
  },
  {
    id: 2,
    text: '고양이와 강아지 사진은 수만 장 있지만, 멸종 위기 희귀 야생동물 사진은 몇 장밖에 없다.',
    targetType: 'longtail',
    hint: '자주 나타나는 흔한 사례는 많지만 발생 빈도가 낮은 드문 사례가 부족한 현상입니다.',
  },
  {
    id: 3,
    text: '신제품 만족도 조사 결과에서 불만족 응답을 의도적으로 빼고 만족한 응답만 모아 공개했다.',
    targetType: 'intentional',
    hint: '특정 목적이나 유리한 결과를 위해 고의로 데이터를 취사선택한 경우입니다.',
  },
  {
    id: 4,
    text: '채용 면접관이 지원자를 평가할 때 자신도 모르게 특정 배경을 가진 사람에게 높은 점수를 주었다.',
    targetType: 'human',
    hint: '데이터를 분류하고 채점하는 사람의 무의식적 선입견이 반영된 경우입니다.',
  },
  {
    id: 5,
    text: '겉보기에 중립적인 주소지 정보가 지역별 소득 수준과 연결되어 특정 집단에 불리한 결과가 나타났다.',
    targetType: 'hidden',
    hint: '직접 드러나지 않는 다른 환경적 요인과 연결되어 발생하는 보이지 않는 편향입니다.',
  },
];

export const Module03Activity: React.FC<Module03ActivityProps> = ({ isCompleted, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 7; // 6 activities + summary
  const topRef = useActivityScrollTop<HTMLDivElement>(currentStep);

  // Activity 2 State (Problem Type)
  const [act2A, setAct2A] = useState<'class' | 'reg' | 'clust' | null>(null);
  const [act2B, setAct2B] = useState<'class' | 'reg' | 'clust' | null>(null);
  const [act2C, setAct2C] = useState<'class' | 'reg' | 'clust' | null>(null);

  // ----------------------------------------------------
  // Revamped Activity 3 State: Candidate Roles
  // ----------------------------------------------------
  const [act3Roles, setAct3Roles] = useState<Record<string, 'X' | 'y' | 'unneeded' | null>>({
    sepalLength: null,
    sepalWidth: null,
    petalLength: null,
    petalWidth: null,
    species: null,
    measureDate: null,
    potNumber: null,
    observerName: null,
  });
  const [isAct3Checked, setIsAct3Checked] = useState(false);
  const [act3HintOpen, setAct3HintOpen] = useState(false);

  // ----------------------------------------------------
  // Revamped Activity 4 State: 6 Situations
  // ----------------------------------------------------
  const [act4Answers, setAct4Answers] = useState<Record<number, string | null>>({
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
    6: null,
  });
  const [isAct4Checked, setIsAct4Checked] = useState(false);
  const [act4HintOpen, setAct4HintOpen] = useState(false);
  const [expandedMethodKey, setExpandedMethodKey] = useState<string | null>(null);

  // ----------------------------------------------------
  // Revamped Activity 5 State: Data Credibility & Criteria
  // ----------------------------------------------------
  const [act5Q1, setAct5Q1] = useState<'yes' | 'no' | null>(null);
  const [act5Criteria, setAct5Criteria] = useState<Record<string, boolean>>({
    source: false,
    method: false,
    time: false,
    relevance: false,
    represent: false,
    creation: false,
    fileSize: false,
  });
  const [isAct5Checked, setIsAct5Checked] = useState(false);

  // ----------------------------------------------------
  // Revamped Activity 6 State: Data Bias Detective
  // ----------------------------------------------------
  const [act6Discovery, setAct6Discovery] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [showAct6Cases, setShowAct6Cases] = useState(false);
  const [act6CaseAnswers, setAct6CaseAnswers] = useState<Record<number, string | null>>({
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
  });
  const [isAct6CasesChecked, setIsAct6CasesChecked] = useState(false);
  const [act6Impact, setAct6Impact] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [act6Strategies, setAct6Strategies] = useState<Record<string, boolean>>({
    collectMore: false,
    diverseCondition: false,
    checkDistribution: false,
    documentProcess: false,
    copyRows: false,
    majorityOnly: false,
  });
  const [isAct6StrategiesChecked, setIsAct6StrategiesChecked] = useState(false);

  // Collapsible Iris Full Dataset Preview State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Dynamic Dataset Counts
  const normalCounts = getDatasetCounts(ORIGINAL_IRIS_DATASET);
  const biasedCounts = getDatasetCounts(BIASED_IRIS_DATASET);

  const syntheticPrompt =
    "붓꽃 데이터와 비슷한 형식의 가상 데이터 5개를 만들어줘. 실제 측정 데이터가 아니라 합성 데이터임을 표시해줘.";

  const [act1Confirmed, setAct1Confirmed] = useState(false);
  const [act7Confirmed, setAct7Confirmed] = useState(false);

  // Minimum completion requirement before proceeding to next activity
  const isStepActionCompleted = useMemo(() => {
    switch (currentStep) {
      case 1:
        return act1Confirmed;
      case 2:
        return act2A !== null && act2B !== null && act2C !== null;
      case 3:
        return isAct3Checked;
      case 4:
        return isAct4Checked;
      case 5:
        return isAct5Checked;
      case 6:
        return act6Discovery !== null && isAct6CasesChecked;
      case 7:
        return act7Confirmed;
      default:
        return true;
    }
  }, [currentStep, act1Confirmed, act2A, act2B, act2C, isAct3Checked, isAct4Checked, isAct5Checked, act6Discovery, isAct6CasesChecked, act7Confirmed]);

  return (
    <div className="space-y-6 scroll-mt-24" ref={topRef}>
      {/* Official 6-stage badge banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
          [공식 6단계 과정] ② 데이터 수집
        </span>
        <span className="text-xs text-slate-500 font-medium">03 데이터 수집 및 구성</span>
      </div>

      {/* Activity Progress */}
      <ActivityProgress
        currentStep={currentStep}
        totalSteps={totalSteps}
        title={
          currentStep === 1
            ? '1. 문제 정의'
            : currentStep === 2
            ? '2. 분류/회귀/군집'
            : currentStep === 3
            ? '3. 어떤 데이터가 필요한가?'
            : currentStep === 4
            ? '4. 데이터 수집 방법 7가지'
            : currentStep === 5
            ? '5. 데이터 신뢰성과 출처'
            : currentStep === 6
            ? '6. 데이터 편향 탐정'
            : '전체 정리 및 완료'
        }
      />

      {/* STEP 1: 무엇을 알아내고 싶은가? (문제 정의) */}
      {currentStep === 1 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Database size={20} className="text-emerald-600" />
              <span>활동 1: 무엇을 알아내고 싶은가? (문제 정의)</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Iris 데이터로 달성할 수 있는 세 가지 학습 목표 카드를 읽어보세요. 각 목표에서 최종적으로 발견하고자 하는 결과를 확인합니다.
            </p>

            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full inline-block">
                  목표 A (품종 분류)
                </span>
                <p className="text-sm font-bold text-slate-900">
                  "꽃받침과 꽃잎의 길이·너비를 이용해 붓꽃의 품종을 알아내고 싶다."
                </p>
                <div className="text-xs text-slate-600 pt-1 flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-emerald-700">🎯 최종 얻고 싶은 결과:</span>
                  <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 inline-flex items-center gap-1">
                    <span>붓꽃 품종 (</span>
                    <SpeciesLabel species="Iris-setosa" size="xs" />
                    <span>/</span>
                    <SpeciesLabel species="Iris-versicolor" size="xs" />
                    <span>/</span>
                    <SpeciesLabel species="Iris-virginica" size="xs" />
                    <span>)</span>
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-teal-800 bg-teal-100 px-2.5 py-0.5 rounded-full inline-block">
                  목표 B (수치 회귀)
                </span>
                <p className="text-sm font-bold text-slate-900">
                  "꽃잎 길이를 이용해 꽃잎 너비를 숫자로 예상하고 싶다."
                </p>
                <div className="text-xs text-slate-600 pt-1 flex items-center gap-1.5">
                  <span className="font-bold text-teal-800">🎯 최종 얻고 싶은 결과:</span>
                  <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    꽃잎 너비의 수치 (예: 1.4 cm)
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-cyan-900 bg-cyan-100 px-2.5 py-0.5 rounded-full inline-block">
                  목표 C (비지도 군집)
                </span>
                <p className="text-sm font-bold text-slate-900">
                  "품종 이름을 보지 않고 비슷한 붓꽃끼리 묶고 싶다."
                </p>
                <div className="text-xs text-slate-600 pt-1 flex items-center gap-1.5">
                  <span className="font-bold text-cyan-900">🎯 최종 얻고 싶은 결과:</span>
                  <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    비슷한 데이터끼리의 그룹 (Cluster)
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-600 text-white text-xs leading-relaxed space-y-1 shadow-xs">
              <span className="font-bold text-emerald-200 uppercase tracking-wide block">💡 정리 가이드</span>
              <p className="font-extrabold text-sm">
                "기계학습을 시작하기 전에 무엇을 예측하거나 발견하려는지 먼저 문제를 명확히 정의해야 합니다."
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-600 font-medium">💡 문제 정의의 3가지 목표 카드를 확인한 뒤 버튼을 눌러주세요.</span>
              <SecondaryButton
                size="sm"
                onClick={() => setAct1Confirmed(true)}
                className={act1Confirmed ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : ''}
              >
                {act1Confirmed ? '✓ 내용 확인 완료' : '내용 확인 완료'}
              </SecondaryButton>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: 이 문제는 어떤 종류일까? (분류 / 회귀 / 군집) */}
      {currentStep === 2 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Layers size={20} className="text-emerald-600" />
              <span>활동 2: 이 문제는 어떤 종류일까? (분류 / 회귀 / 군집)</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              세 문제 상황이 각각 분류, 회귀, 군집 중 어떤 기계학습 문제 유형에 해당하는지 고르세요.
            </p>

            {/* Problem A */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1 flex-wrap">
                <span>문제 A: "새로운 붓꽃의 측정값을 보고</span>
                <SpeciesLabel species="Iris-setosa" size="xs" />
                <span>,</span>
                <SpeciesLabel species="Iris-versicolor" size="xs" />
                <span>,</span>
                <SpeciesLabel species="Iris-virginica" size="xs" />
                <span>중 하나를 맞힌다."</span>
              </span>
              <div className="grid grid-cols-3 gap-2">
                <ChoiceCard
                  optionKey="1"
                  label="분류"
                  subText="범주 중 선택"
                  isSelected={act2A === 'class'}
                  status={act2A === 'class' ? 'correct' : 'default'}
                  onClick={() => setAct2A('class')}
                />
                <ChoiceCard
                  optionKey="2"
                  label="회귀"
                  isSelected={act2A === 'reg'}
                  status={act2A === 'reg' ? 'incorrect' : 'default'}
                  onClick={() => setAct2A('reg')}
                />
                <ChoiceCard
                  optionKey="3"
                  label="군집"
                  isSelected={act2A === 'clust'}
                  status={act2A === 'clust' ? 'incorrect' : 'default'}
                  onClick={() => setAct2A('clust')}
                />
              </div>
            </div>

            {/* Problem B */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-900 block">
                문제 B: "꽃잎 길이를 이용해 꽃잎 너비를 숫자로 예측한다."
              </span>
              <div className="grid grid-cols-3 gap-2">
                <ChoiceCard
                  optionKey="1"
                  label="분류"
                  isSelected={act2B === 'class'}
                  status={act2B === 'class' ? 'incorrect' : 'default'}
                  onClick={() => setAct2B('class')}
                />
                <ChoiceCard
                  optionKey="2"
                  label="회귀"
                  subText="연속적인 숫자 예측"
                  isSelected={act2B === 'reg'}
                  status={act2B === 'reg' ? 'correct' : 'default'}
                  onClick={() => setAct2B('reg')}
                />
                <ChoiceCard
                  optionKey="3"
                  label="군집"
                  isSelected={act2B === 'clust'}
                  status={act2B === 'clust' ? 'incorrect' : 'default'}
                  onClick={() => setAct2B('clust')}
                />
              </div>
            </div>

            {/* Problem C */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-900 block">
                문제 C: "품종 레이블 없이 비슷한 붓꽃끼리 그룹(클러스터)을 만든다."
              </span>
              <div className="grid grid-cols-3 gap-2">
                <ChoiceCard
                  optionKey="1"
                  label="분류"
                  isSelected={act2C === 'class'}
                  status={act2C === 'class' ? 'incorrect' : 'default'}
                  onClick={() => setAct2C('class')}
                />
                <ChoiceCard
                  optionKey="2"
                  label="회귀"
                  isSelected={act2C === 'reg'}
                  status={act2C === 'reg' ? 'incorrect' : 'default'}
                  onClick={() => setAct2C('reg')}
                />
                <ChoiceCard
                  optionKey="3"
                  label="군집 (클러스터링)"
                  subText="정답 없이 그룹화"
                  isSelected={act2C === 'clust'}
                  status={act2C === 'clust' ? 'correct' : 'default'}
                  onClick={() => setAct2C('clust')}
                />
              </div>
            </div>

            {/* Summary Box */}
            {act2A === 'class' && act2B === 'reg' && act2C === 'clust' && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-2 animate-fadeIn">
                <span className="font-bold text-emerald-900 text-sm block">✓ 모두 정확하게 분류하셨습니다!</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <div className="p-2.5 bg-white rounded-xl border border-emerald-200">
                    <span className="font-bold text-emerald-900 block">분류 (Classification)</span>
                    정해진 몇 개의 범주(Class) 중 하나를 예측하는 문제.
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-emerald-200">
                    <span className="font-bold text-teal-900 block">회귀 (Regression)</span>
                    연속적인 숫자 형태의 값(Numeric Value)을 예측하는 문제.
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-emerald-200">
                    <span className="font-bold text-cyan-900 block">군집 (Clustering)</span>
                    정답(Label) 없이 유사한 특징을 가진 데이터끼리 묶는 문제.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* STEP 3: 활동 3 - 어떤 데이터를 모아야 할까? (X vs y)  */}
      {/* ==================================================== */}
      {currentStep === 3 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div>
              <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 inline-block mb-1">
                데이터 탐구 & 속성 역할 분류
              </span>
              <h3 className="text-lg font-extrabold text-slate-900">
                활동 3: 어떤 데이터를 모아야 할까? (입력 X vs 목표 y)
              </h3>
            </div>

            {/* Problem Statement Card */}
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-950 space-y-1.5">
              <div className="flex items-center gap-1.5 font-extrabold text-sm text-blue-900">
                <Target size={18} className="text-blue-600" />
                <span>우리의 기계학습 목표</span>
              </div>
              <p className="leading-relaxed font-medium">
                "붓꽃의 정보를 보고 품종을 예측하는 기계학습 모델을 만들려고 합니다. 모델을 학습시키려면 어떤 데이터를 모아야 할까요?"
              </p>
              <p className="text-[11px] text-blue-800">
                아래 8가지 데이터 후보를 살펴보고, 각 항목이 이번 기계학습 문제에서 <strong>어떤 역할</strong>을 하는지 직접 분류해 보세요.
              </p>
            </div>

            {/* 3 Role Legends */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-bold">
              <div className="p-2.5 rounded-xl border-2 border-blue-400 bg-blue-50/80 text-blue-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">X</span>
                <span>입력 데이터 X</span>
              </div>
              <div className="p-2.5 rounded-xl border-2 border-emerald-400 bg-emerald-50/80 text-emerald-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">y</span>
                <span>예측 목표 y</span>
              </div>
              <div className="p-2.5 rounded-xl border-2 border-slate-300 bg-slate-100 text-slate-700 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-500 text-white flex items-center justify-center text-[10px]">-</span>
                <span>이번 문제에서 사용하지 않는 정보</span>
              </div>
            </div>

            {/* Candidate Cards Grid */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>데이터 후보 8가지 분류하기:</span>
                <span className="text-slate-500 font-mono">
                  {Object.values(act3Roles).filter(v => v !== null).length} / 8 선택 완료
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ACT3_CANDIDATES.map(item => {
                  const currentRole = act3Roles[item.key];
                  const isCorrect = isAct3Checked && currentRole === item.trueRole;
                  const isWrong = isAct3Checked && currentRole !== item.trueRole;

                  return (
                    <div
                      key={item.key}
                      className={`p-3.5 rounded-xl border-2 transition-all space-y-2.5 ${
                        isCorrect
                          ? 'border-emerald-500 bg-emerald-50/30'
                          : isWrong
                          ? 'border-rose-400 bg-rose-50/30'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-extrabold text-sm text-slate-900 block">{item.label}</span>
                          <span className="text-[11px] text-slate-500">{item.sub}</span>
                        </div>
                        {isAct3Checked && (
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                            isCorrect ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'
                          }`}>
                            {isCorrect ? '✓ 일치' : '재확인 필요'}
                          </span>
                        )}
                      </div>

                      {/* 3-segment role selector */}
                      <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
                        <button
                          onClick={() => setAct3Roles(prev => ({ ...prev, [item.key]: 'X' }))}
                          className={`py-2 px-1 rounded-lg border text-center transition-all cursor-pointer ${
                            currentRole === 'X'
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'
                          }`}
                        >
                          입력 X
                        </button>
                        <button
                          onClick={() => setAct3Roles(prev => ({ ...prev, [item.key]: 'y' }))}
                          className={`py-2 px-1 rounded-lg border text-center transition-all cursor-pointer ${
                            currentRole === 'y'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400'
                          }`}
                        >
                          목표 y
                        </button>
                        <button
                          onClick={() => setAct3Roles(prev => ({ ...prev, [item.key]: 'unneeded' }))}
                          className={`py-2 px-1 rounded-lg border text-center transition-all cursor-pointer ${
                            currentRole === 'unneeded'
                              ? 'bg-slate-700 text-white border-slate-700 shadow-xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                          }`}
                        >
                          사용 안 함
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hint Accordion */}
            <div className="pt-1">
              <button
                onClick={() => setAct3HintOpen(!act3HintOpen)}
                className="text-xs font-bold text-slate-600 hover:text-blue-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <HelpCircle size={15} />
                <span>💡 사고 힌트: 입력(X), 목표(y), 불필요 정보를 어떻게 구분할까?</span>
                {act3HintOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {act3HintOpen && (
                <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed animate-fadeIn">
                  AI 모델이 관찰할 <strong>수치적 특징</strong>과, 최종적으로 맞혀야 하는 <strong>정답 레이블</strong>, 그리고 꽃의 생물학적 고유 특징과 무관한 주변 관리 번호나 기록자 정보를 구분해보세요.
                </div>
              )}
            </div>

            {/* Check Button */}
            <div className="pt-2">
              <PrimaryButton
                size="md"
                onClick={() => setIsAct3Checked(true)}
                icon={<Check size={18} />}
                fullWidth
              >
                {isAct3Checked ? '분류 결과 다시 확인하기' : '분류 결과 확인하기'}
              </PrimaryButton>
            </div>

            {/* Feedback & Revealed Concept Card */}
            {isAct3Checked && (
              <div className="space-y-4 pt-2 animate-fadeIn">
                {ACT3_CANDIDATES.every(item => act3Roles[item.key] === item.trueRole) ? (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-950 font-bold flex items-center gap-2">
                    <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                    <span>✓ 완벽합니다! 8가지 데이터 후보의 역할을 정확하게 분류하셨습니다.</span>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                      <span>
                        8개 중 <strong>{ACT3_CANDIDATES.filter(i => act3Roles[i.key] === i.trueRole).length}개</strong>가 일치합니다. 잘못 분류된 카드의 [재확인 필요]를 수정해보세요.
                      </span>
                    </div>
                  </div>
                )}

                {/* Concept Reveal Card */}
                <div className="p-5 rounded-2xl bg-blue-50/90 border border-blue-200 text-xs text-blue-950 space-y-3">
                  <span className="font-extrabold text-blue-900 text-sm block">
                    💡 개념 정리: 입력 데이터(X)와 예측 목표(y)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="p-3 bg-white rounded-xl border border-blue-200 space-y-1">
                      <span className="font-extrabold text-blue-900 block">입력 데이터 (Feature X)</span>
                      <p className="text-slate-700 leading-relaxed">
                        모델이 패턴을 학습하고 예측할 때 사용하는 정보입니다.<br />
                        꽃받침 길이·너비, 꽃잎 길이·너비 (4가지 특성)
                      </p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-1">
                      <span className="font-extrabold text-emerald-900 block">예측 목표 (Label y / 종속변수)</span>
                      <p className="text-slate-700 leading-relaxed">
                        모델이 최종적으로 맞히려고 하는 정답 값입니다.<br />
                        붓꽃 품종 (세토사, 버시컬러, 버지니카)
                      </p>
                    </div>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    * <strong>측정한 날짜, 화분 번호, 조사자 이름</strong>은 다른 연구나 관리 목적에서는 유용할 수 있지만, 이번 붓꽃 품종 분류 문제에서는 생물학적 품종 판별에 사용하지 않는 정보입니다.
                  </p>

                  <div className="p-3 bg-blue-600 text-white rounded-xl font-bold text-center text-xs shadow-xs">
                    "데이터를 무작정 많이 모으기 전에, 문제를 해결하는 데 어떤 데이터가 필요한지 먼저 정하는 것이 중요합니다."
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* STEP 4: 활동 4 - 데이터는 어디서, 어떻게 모을까?       */}
      {/* ==================================================== */}
      {currentStep === 4 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div>
              <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block mb-1">
                실전 수집 방법 & 상황별 선택
              </span>
              <h3 className="text-lg font-extrabold text-slate-900">
                활동 4: 데이터는 어디서, 어떻게 모을까? (7가지 수집 방법)
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              데이터를 수집하는 방법은 하나가 아닙니다. 수집하려는 데이터의 성격, 주기, 목적에 따라 적절한 방법을 선택해야 합니다.
            </p>

            {/* 7 Compact Method Cards */}
            <div className="space-y-2">
              <span className="text-xs font-extrabold text-slate-800 block">
                대표적인 데이터 수집 방법 7가지:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {COLLECTION_METHODS.map(method => {
                  const Icon = method.icon;
                  const isExpanded = expandedMethodKey === method.id;

                  return (
                    <div
                      key={method.id}
                      onClick={() => setExpandedMethodKey(isExpanded ? null : method.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer text-xs space-y-1.5 ${
                        isExpanded
                          ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                          : 'border-slate-200 bg-slate-50/70 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                            <Icon size={16} />
                          </div>
                          <span className="font-extrabold text-slate-900">{method.name}</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                          {method.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-tight">{method.summary}</p>
                      {isExpanded && (
                        <p className="text-[11px] text-emerald-950 font-medium pt-1.5 border-t border-emerald-200 leading-relaxed animate-fadeIn">
                          {method.details}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 6 Situation-Based Decision Scenarios */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 block">
                  실제 상황별 최적의 수집 방법 판단하기 (6개 상황):
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {Object.values(act4Answers).filter(v => v !== null).length} / 6 완료
                </span>
              </div>

              <div className="space-y-3">
                {ACT4_SITUATIONS.map(sit => {
                  const selectedOpt = act4Answers[sit.id];
                  const isCorrect = isAct4Checked && selectedOpt === sit.targetMethod;

                  return (
                    <div
                      key={sit.id}
                      className={`p-4 rounded-xl border space-y-3 transition-all ${
                        isAct4Checked
                          ? isCorrect
                            ? 'border-emerald-300 bg-emerald-50/40'
                            : 'border-rose-300 bg-rose-50/30'
                          : 'border-slate-200 bg-slate-50/60'
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-900 block">{sit.title}</span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {sit.options.map(opt => (
                          <button
                            key={opt.id}
                            onClick={() =>
                              setAct4Answers(prev => ({ ...prev, [sit.id]: opt.id }))
                            }
                            className={`p-3 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer flex items-center justify-between gap-2 min-h-[44px] ${
                              selectedOpt === opt.id
                                ? 'border-emerald-600 bg-emerald-100/90 text-emerald-950 font-bold'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300'
                            }`}
                          >
                            <span>{opt.label}</span>
                            {selectedOpt === opt.id && (
                              <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>

                      {isAct4Checked && (
                        <div className="pt-2 text-[11px] leading-relaxed">
                          {isCorrect ? (
                            <span className="text-emerald-800 font-bold block">✓ 정답입니다: {sit.explanation}</span>
                          ) : (
                            <span className="text-rose-800 font-bold block">💡 다시 생각해보세요: {sit.explanation}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hint Accordion */}
            <div className="pt-1">
              <button
                onClick={() => setAct4HintOpen(!act4HintOpen)}
                className="text-xs font-bold text-slate-600 hover:text-emerald-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <HelpCircle size={15} />
                <span>💡 사고 힌트: 수집 방법을 고를 때 무엇을 고려해야 할까?</span>
                {act4HintOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {act4HintOpen && (
                <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed animate-fadeIn">
                  어떤 종류의 데이터(물리적 수치, 사람의 생각, 환경 통계)인지, 그리고 얼마나 자주(일회성, 1분 주기), 어떤 대상에게서 모아야 하는지 생각해보세요.
                </div>
              )}
            </div>

            {/* Check Button */}
            <div className="pt-2">
              <PrimaryButton
                size="md"
                onClick={() => setIsAct4Checked(true)}
                icon={<Check size={18} />}
                fullWidth
              >
                {isAct4Checked ? '수집 방법 판단 다시 확인하기' : '수집 방법 판단 확인하기'}
              </PrimaryButton>
            </div>

            {/* Summary Box */}
            {isAct4Checked && (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-2 animate-fadeIn">
                <span className="font-extrabold text-emerald-900 text-sm block">
                  ✓ 활동 4 핵심 정리
                </span>
                <p className="leading-relaxed text-slate-700">
                  데이터를 수집하는 방법은 하나가 아닙니다. 수집하려는 데이터의 <strong>종류, 양, 수집 주기, 비용, 그리고 문제 해결 목적</strong>에 따라 가장 적합한 방법을 선택해야 합니다.
                </p>
                <div className="p-3 bg-emerald-600 text-white rounded-xl font-bold text-center text-xs shadow-xs">
                  "Iris AI Lab에서는 전 세계 연구자들이 검증하고 공개한 Kaggle의 기존 공개 Iris 데이터셋을 활용합니다."
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* STEP 5: 활동 5 - 수집한 데이터, 바로 믿고 써도 될까?  */}
      {/* ==================================================== */}
      {currentStep === 5 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div>
              <span className="text-xs font-extrabold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 inline-block mb-1">
                데이터 신뢰성 & 합성 데이터
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <ShieldCheck size={20} className="text-amber-600" />
                <span>활동 5: 수집한 데이터, 바로 믿고 써도 될까? (신뢰성과 출처)</span>
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              인터넷이나 AI로부터 구한 데이터라고 해서 무조건 믿을 수 있는 것은 아닙니다. 데이터의 출처와 품질을 점검하는 기준을 알아봅니다.
            </p>

            {/* 3 Data Cards Comparison */}
            <div className="space-y-2">
              <span className="text-xs font-extrabold text-slate-800 block">
                출처가 다른 3가지 데이터 비교:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Data A */}
                <div className="p-4 rounded-xl border-2 border-blue-300 bg-blue-50/50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-blue-950">데이터 A</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                      검증된 공공·연구
                    </span>
                  </div>
                  <ul className="text-xs text-slate-700 space-y-1">
                    <li>• <strong>출처:</strong> 공공기관(기상청) 공인 연구소</li>
                    <li>• <strong>수집 방법:</strong> 공인된 정밀 센서 측정</li>
                    <li>• <strong>수집 시기:</strong> 2024년 1월~12월 (명확)</li>
                  </ul>
                  <p className="text-[11px] text-blue-900 font-bold pt-1 border-t border-blue-200">
                    신뢰성이 높고 분석 목적에 적합함
                  </p>
                </div>

                {/* Data B */}
                <div className="p-4 rounded-xl border-2 border-amber-300 bg-amber-50/50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-amber-950">데이터 B</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-600 text-white">
                      AI 합성 데이터
                    </span>
                  </div>
                  <ul className="text-xs text-slate-700 space-y-1">
                    <li>• <strong>출처:</strong> 생성형 AI 프롬프트 생성</li>
                    <li>• <strong>수집 방법:</strong> 확률 기반 수치 생성 알고리즘</li>
                    <li>• <strong>수집 시기:</strong> 프로그램 실행 시점 (인위적)</li>
                  </ul>
                  <p className="text-[11px] text-amber-900 font-bold pt-1 border-t border-amber-200">
                    부족한 데이터 보완용으로 유용하나 실제 관측과 다를 수 있음
                  </p>
                </div>

                {/* Data C */}
                <div className="p-4 rounded-xl border-2 border-rose-300 bg-rose-50/50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-rose-950">데이터 C</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white">
                      출처 불명 파일
                    </span>
                  </div>
                  <ul className="text-xs text-slate-700 space-y-1">
                    <li>• <strong>출처:</strong> 알 수 없음 (익명 커뮤니티)</li>
                    <li>• <strong>수집 방법:</strong> 측정 방식 불명</li>
                    <li>• <strong>수집 시기:</strong> 언제 작성되었는지 불명</li>
                  </ul>
                  <p className="text-[11px] text-rose-900 font-bold pt-1 border-t border-rose-200">
                    조작, 오류, 편향 위험이 높아 그대로 사용 불가
                  </p>
                </div>
              </div>
            </div>

            {/* Student Judgment Question 1 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-900 block">
                질문 1: 세 종류의 데이터를 아무 확인 없이 똑같이 AI 학습에 사용해도 될까요?
              </span>
              <div className="space-y-2">
                <ChoiceCard
                  optionKey="1"
                  label="아니다. 출처와 수집 과정이 불분명한 데이터는 잘못된 모델을 만들 수 있으므로 반드시 검증해야 한다."
                  isSelected={act5Q1 === 'no'}
                  status={act5Q1 === 'no' ? 'correct' : 'default'}
                  onClick={() => setAct5Q1('no')}
                />
                <ChoiceCard
                  optionKey="2"
                  label="그렇다. 엑셀이나 표 형태로 숫자만 채워져 있다면 출처와 무관하게 학습 결과는 동일하다."
                  isSelected={act5Q1 === 'yes'}
                  status={act5Q1 === 'yes' ? 'incorrect' : 'default'}
                  onClick={() => setAct5Q1('yes')}
                />
              </div>
            </div>

            {/* Student Judgment Question 2: Criteria Check */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-900 block">
                질문 2: 수집한 데이터를 AI 학습에 사용하기 전에 확인해야 할 기준을 모두 골라보세요.
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  { key: 'source', label: '데이터 출처 (공인된 출처인가?)', isCorrect: true },
                  { key: 'method', label: '수집 방법 (어떤 도구와 방법으로 모았는가?)', isCorrect: true },
                  { key: 'time', label: '수집 시기 (언제 수집되었으며 시의성이 맞는가?)', isCorrect: true },
                  { key: 'relevance', label: '문제 해결 목적과의 관련성 (풀려는 문제에 적합한가?)', isCorrect: true },
                  { key: 'represent', label: '대표성 (필요한 전체 대상을 골고루 대표하는가?)', isCorrect: true },
                  { key: 'creation', label: '데이터가 만들어진 방법과 검증 여부 (실제/합성 여부 및 과정 검증)', isCorrect: true },
                  { key: 'fileSize', label: '파일 용량이 1기가바이트를 넘는 초대용량인가?', isCorrect: false },
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() =>
                      setAct5Criteria(prev => ({ ...prev, [item.key]: !prev[item.key] }))
                    }
                    className={`p-3 rounded-xl border text-left font-medium transition-all cursor-pointer flex items-center justify-between gap-2 min-h-[44px] ${
                      act5Criteria[item.key]
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span>{item.label}</span>
                    {act5Criteria[item.key] ? (
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    ) : (
                      <span className="w-4 h-4 rounded border border-slate-300 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Check Button */}
            <div className="pt-1">
              <PrimaryButton
                size="md"
                onClick={() => setIsAct5Checked(true)}
                icon={<Check size={18} />}
                fullWidth
              >
                {isAct5Checked ? '데이터 신뢰성 판단 다시 확인하기' : '데이터 신뢰성 판단 확인하기'}
              </PrimaryButton>
            </div>

            {/* Revealed Explanation & Synthetic Prompt Demo */}
            {isAct5Checked && (
              <div className="space-y-4 pt-2 animate-fadeIn">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-2">
                  <span className="font-extrabold text-emerald-900 block text-sm">
                    ✓ 실제 데이터와 합성 데이터의 올바른 이해
                  </span>
                  <p className="leading-relaxed font-semibold text-emerald-950">
                    실제 데이터라고 해서 항상 좋은 데이터인 것은 아니며, 합성 데이터라고 해서 항상 나쁜 데이터인 것도 아닙니다.
                  </p>
                  <p className="leading-relaxed text-slate-700">
                    중요한 것은 데이터가 어떻게 수집·생성되었고, 현재 문제에 적합하며 신뢰할 수 있는지 확인하는 것입니다.
                  </p>
                  <p className="text-[11px] text-slate-600 pt-1 border-t border-emerald-200">
                    💡 실제 관측 데이터인지, 합성 데이터인지뿐 아니라 어떻게 만들어졌고 그 과정과 품질을 확인할 수 있는지 살펴봅니다. (파일 용량이 크다고 해서 무조건 좋은 데이터인 것은 아닙니다.)
                  </p>
                </div>

                {/* Practical Prompt Copy Demo */}
                <div className="pt-1">
                  <PromptCard promptText={syntheticPrompt} title="합성 데이터 생성 프롬프트 예시" />
                </div>

                <div className="p-3.5 bg-amber-600 text-white rounded-xl font-bold text-center text-xs shadow-xs">
                  "좋은 데이터는 단순히 데이터 개수가 많은 것이 아니라, 출처와 수집 과정이 확인되고, 문제 해결 목적에 적합하며, 필요한 대상을 충분히 대표해야 합니다."
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* STEP 6: 활동 6 - 데이터 편향 탐정 (Data Bias)        */}
      {/* ==================================================== */}
      {currentStep === 6 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div>
              <span className="text-xs font-extrabold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 inline-block mb-1">
                데이터 편향 탐정 & 5대 편향 유형
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Scale size={20} className="text-rose-600" />
                <span>활동 6: 데이터 편향(Data Bias) 발견하기</span>
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              두 데이터셋의 품종별 분포를 관찰하고, 데이터 편향이 왜 발생하며 어떤 위험을 초래하는지 탐구합니다.
            </p>

            {/* Neutral Dataset A vs Dataset B Comparison */}
            <div className="space-y-2">
              <span className="text-xs font-extrabold text-slate-800 block">
                1단계: 두 데이터셋의 품종 분포 비교 관찰
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Dataset A */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between text-xs font-extrabold text-slate-900">
                    <span>데이터셋 A</span>
                    <span className="text-slate-600">총 {normalCounts.total}개</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-0.5">
                        <SpeciesLabel species="Iris-setosa" showEnglish size="xs" />
                        <span>50개 (33.3%)</span>
                      </div>
                      <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full w-1/3" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-0.5">
                        <SpeciesLabel species="Iris-versicolor" showEnglish size="xs" />
                        <span>50개 (33.3%)</span>
                      </div>
                      <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full w-1/3" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-0.5">
                        <SpeciesLabel species="Iris-virginica" showEnglish size="xs" />
                        <span>50개 (33.3%)</span>
                      </div>
                      <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full w-1/3" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dataset B */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between text-xs font-extrabold text-slate-900">
                    <span>데이터셋 B</span>
                    <span className="text-slate-600">총 {biasedCounts.total}개</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-0.5">
                        <SpeciesLabel species="Iris-setosa" showEnglish size="xs" />
                        <span className="font-bold text-slate-800">
                          {biasedCounts.bySpecies['Iris-setosa']}개 (80%)
                        </span>
                      </div>
                      <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full w-[80%]" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-0.5">
                        <SpeciesLabel species="Iris-versicolor" showEnglish size="xs" />
                        <span>{biasedCounts.bySpecies['Iris-versicolor']}개 (16%)</span>
                      </div>
                      <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full w-[16%]" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-0.5">
                        <SpeciesLabel species="Iris-virginica" showEnglish size="xs" />
                        <span>{biasedCounts.bySpecies['Iris-virginica']}개 (4%)</span>
                      </div>
                      <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full w-[4%]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bias Discovery Question */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-900 block">
                2단계: 학생 판단 - 질문 1: 두 데이터셋의 구성에서 가장 눈에 띄는 차이는 무엇인가요?
              </span>
              <div className="space-y-2">
                <ChoiceCard
                  optionKey="A"
                  label="특정 품종(세토사)의 비율이 크게 높고 나머지 품종이 매우 적다."
                  isSelected={act6Discovery === 'A'}
                  status={act6Discovery === 'A' ? 'correct' : 'default'}
                  onClick={() => setAct6Discovery('A')}
                />
                <ChoiceCard
                  optionKey="B"
                  label="세 품종의 개수와 비율이 완벽하게 동일하게 유지된다."
                  isSelected={act6Discovery === 'B'}
                  status={act6Discovery === 'B' ? 'incorrect' : 'default'}
                  onClick={() => setAct6Discovery('B')}
                />
                <ChoiceCard
                  optionKey="C"
                  label="꽃받침과 꽃잎의 수치 데이터가 모두 사라져 있다."
                  isSelected={act6Discovery === 'C'}
                  status={act6Discovery === 'C' ? 'incorrect' : 'default'}
                  onClick={() => setAct6Discovery('C')}
                />
              </div>
            </div>

            {/* Step 3: Concept Reveal: Data Bias Definition */}
            {act6Discovery === 'A' && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-950 space-y-1.5 animate-fadeIn">
                <span className="font-extrabold text-rose-900 block text-sm">
                  3단계: 개념 공개 - 💡 데이터 편향(Data Bias)이란?
                </span>
                <p className="leading-relaxed">
                  <strong>"데이터가 특정 대상이나 방향으로 치우쳐 전체를 충분히 대표하지 못하는 현상"</strong>을 뜻합니다.
                </p>
                <p className="text-[11px] text-slate-600">
                  * 품종별 데이터 개수가 꼭 같아야만 편향이 없는 것은 아닙니다. 중요한 것은 수집한 데이터가 실제 문제의 대상을 충분히 대표하는가입니다. 데이터셋 B(40/8/2)는 특정 품종이 지나치게 많이 포함된 명확한 표본 불균형 사례입니다.
                </p>
              </div>
            )}

            {/* Step 4: 6 Causes of Bias Compact Cards */}
            {act6Discovery === 'A' && (
              <div className="space-y-2.5 pt-2 border-t border-slate-100 animate-fadeIn">
                <div>
                  <span className="text-xs font-extrabold text-slate-900 block">
                    4단계: 편향은 왜 생길까? (발생 원인 6가지)
                  </span>
                  <p className="text-[11px] text-slate-500">
                    * 발생 원인과 편향 유형은 1:1 고정 공식이 아니며, 한 원인에서 여러 유형의 편향이 생길 수도 있습니다.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                  {[
                    { title: '1. 수집 대상의 편중', desc: '특정 지역, 연령, 품종만 편중되어 수집' },
                    { title: '2. 수집 방법의 한계', desc: '온라인 설문만 실시하여 인터넷 취약계층 누락 등 도구의 제약' },
                    { title: '3. 기존 데이터의 영향', desc: '과거의 사회적 판단이나 환경적 불평등이 이미 누적 반영됨' },
                    { title: '4. 희귀 사례 부족', desc: '자주 일어나는 사례는 많고 드문 사례는 극히 적음' },
                    { title: '5. 사람의 판단 개입', desc: '데이터 선택이나 라벨링에 사람의 주관적 선입견이 들어감' },
                    { title: '6. 의도적 선택·제외', desc: '특정 결과를 만들기 위해 유리한 데이터만 남기고 배제' },
                  ].map((cause, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg border border-slate-200 bg-white">
                      <span className="font-bold text-slate-900 block mb-0.5">{cause.title}</span>
                      <span className="text-[11px] text-slate-600">{cause.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: 5 Bias Types Detailed Section */}
            {act6Discovery === 'A' && (
              <div className="space-y-3 pt-2 border-t border-slate-100 animate-fadeIn">
                <div>
                  <span className="text-xs font-extrabold text-slate-900 block">
                    5단계: 편향은 어떤 모습으로 나타날까? (5가지 편향 유형)
                  </span>
                  <p className="text-[11px] text-slate-500 font-medium">
                    💡 핵심 질문: <strong>"이 데이터는 왜 이렇게 치우쳤을까?"</strong> 사고 흐름을 따라가 보세요.
                  </p>
                </div>

                <div className="space-y-3">
                  {BIAS_TYPES.map(bt => (
                    <div key={bt.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="font-extrabold text-sm text-slate-900">{bt.title}</span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                          "{bt.oneLine}"
                        </span>
                      </div>

                      {/* Structured thought flow: Cause -> Problem */}
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1.5">
                        <div className="flex items-start gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px] shrink-0">상황 / 원인</span>
                          <span className="text-slate-700 text-[11px] leading-tight">{bt.cause}</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-900 font-bold text-[10px] shrink-0">어떤 문제?</span>
                          <span className="text-slate-700 text-[11px] leading-tight">{bt.problem}</span>
                        </div>
                      </div>

                      {/* Step-by-step for Hidden Bias */}
                      {bt.id === 'hidden' && (
                        <div className="p-2.5 bg-amber-50/70 rounded-lg border border-amber-200 text-[11px] space-y-1 text-slate-700">
                          <span className="font-bold text-amber-900 block">🔍 숨겨진 편향 단계별 이해:</span>
                          <p>1. 모델은 소득 정보를 직접 사용하지 않았습니다.</p>
                          <p>2. 그런데 지역 정보(우편번호)가 소득 수준이나 교육 환경과 강하게 연결되어 있다면?</p>
                          <p>3. 직접 사용하지 않은 정보의 영향이 다른 특성을 통해 결과에 숨어 들어올 수 있습니다.</p>
                          <p className="font-bold text-amber-950 pt-0.5">→ 겉으로는 보이지 않지만 다른 정보와의 관계 속에 숨어 있는 편향</p>
                        </div>
                      )}

                      {/* Mini visual for Long-tail */}
                      {bt.id === 'longtail' && (
                        <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                              <span>📊</span>
                              <span>롱테일(Long-tail) 데이터 분포 한눈에 보기</span>
                            </span>
                            <span className="text-[10px] font-medium text-slate-500">
                              (막대 높이 = 데이터 개수)
                            </span>
                          </div>

                          {/* 6-Bar Mini Chart */}
                          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                            <div className="h-20 flex items-end justify-between gap-1.5 sm:gap-3 px-2 border-b-2 border-slate-200 pb-1">
                              {/* 1: 매우 많음 */}
                              <div className="flex-1 flex flex-col items-center justify-end h-full">
                                <div className="w-full h-16 bg-indigo-600 rounded-t-md" title="사례 A: 매우 많음" />
                              </div>
                              {/* 2: 많음 */}
                              <div className="flex-1 flex flex-col items-center justify-end h-full">
                                <div className="w-full h-10 bg-indigo-500 rounded-t-md" title="사례 B: 많음" />
                              </div>
                              {/* 3: 보통 */}
                              <div className="flex-1 flex flex-col items-center justify-end h-full">
                                <div className="w-full h-4 bg-indigo-400 rounded-t-sm" title="사례 C: 보통" />
                              </div>
                              {/* 4: 적음 */}
                              <div className="flex-1 flex flex-col items-center justify-end h-full">
                                <div className="w-full h-2.5 bg-slate-300 rounded-t-sm" title="사례 D: 적음" />
                              </div>
                              {/* 5: 매우 적음 */}
                              <div className="flex-1 flex flex-col items-center justify-end h-full">
                                <div className="w-full h-1.5 bg-slate-300 rounded-t-xs" title="사례 E: 매우 적음" />
                              </div>
                              {/* 6: 거의 없음 */}
                              <div className="flex-1 flex flex-col items-center justify-end h-full">
                                <div className="w-full h-1 bg-slate-300 rounded-t-xs" title="사례 F: 거의 없음" />
                              </div>
                            </div>

                            {/* Label Row: 자주 나오는 사례 / 데이터 많음 vs 드문 사례 / 데이터 적음 */}
                            <div className="flex items-start justify-between text-xs font-bold pt-0.5 px-0.5">
                              <div className="text-left text-indigo-900">
                                <span className="block">자주 나오는 사례</span>
                                <span className="text-[11px] text-indigo-600 font-extrabold">데이터 많음</span>
                              </div>
                              <div className="text-right text-slate-700">
                                <span className="block">드문 사례</span>
                                <span className="text-[11px] text-slate-500 font-extrabold">데이터 적음</span>
                              </div>
                            </div>
                          </div>

                          {/* Student-friendly explanation */}
                          <div className="p-2.5 bg-indigo-50/70 rounded-lg border border-indigo-100 text-[11px] text-slate-700 leading-relaxed space-y-1">
                            <p>
                              • <strong>일부 자주 나오는 사례</strong>에는 데이터가 많이 모이고, <strong>드문 사례</strong>에는 데이터가 적게 모일 수 있습니다.
                            </p>
                            <p>
                              • 이처럼 <strong>희귀한 사례의 데이터가 부족한 현상</strong>을 <strong>롱테일 편향</strong>이라고 볼 수 있습니다.
                            </p>
                          </div>
                        </div>
                      )}

                      <p className="text-[11px] text-slate-500 font-medium">💡 실제 예시: {bt.example}</p>
                    </div>
                  ))}
                </div>

                {/* Sampling Bias vs Long-tail Bias Comparison Box */}
                <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs space-y-2">
                  <span className="font-extrabold text-amber-900 block text-xs">
                    🔍 헷갈리기 쉬운 두 개념 비교: 데이터 표본 편향 vs 롱테일 편향
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="p-2.5 bg-white rounded-lg border border-amber-200 space-y-0.5">
                      <span className="font-bold text-slate-900 block">[데이터 표본 편향]</span>
                      <p className="text-slate-600 text-[11px]">
                        수집한 표본이 전체 대상을 제대로 대표하지 못함<br />
                        <span className="text-amber-800 font-bold">→ 수집 과정의 대표성 문제</span>
                      </p>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-amber-200 space-y-0.5">
                      <span className="font-bold text-slate-900 block">[롱테일 편향]</span>
                      <p className="text-slate-600 text-[11px]">
                        흔한 사례는 많고 실제로 드문 사례는 데이터가 매우 적음<br />
                        <span className="text-amber-800 font-bold">→ 현실의 희귀 사례 부족 문제</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Next Stage Button */}
                {!showAct6Cases && !isAct6CasesChecked && (
                  <div className="pt-1">
                    <PrimaryButton
                      size="md"
                      onClick={() => setShowAct6Cases(true)}
                      icon={<ChevronDown size={18} />}
                      fullWidth
                    >
                      다음 단계: 편향 탐정 (5개 실전 사례 판정하기) ↓
                    </PrimaryButton>
                  </div>
                )}
              </div>
            )}

            {/* Step 6: 5 Case Matching Activity */}
            {act6Discovery === 'A' && (showAct6Cases || isAct6CasesChecked) && (
              <div className="space-y-3 pt-2 border-t border-slate-100 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900 block">
                    6단계: 편향 탐정 - 5개 실전 사례 분류:
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    {Object.values(act6CaseAnswers).filter(v => v !== null).length} / 5 완료
                  </span>
                </div>

                <div className="space-y-3">
                  {ACT6_CASES.map(c => {
                    const chosen = act6CaseAnswers[c.id];
                    const isCorrect = isAct6CasesChecked && chosen === c.targetType;

                    return (
                      <div
                        key={c.id}
                        className={`p-4 rounded-xl border space-y-2.5 transition-all ${
                          isAct6CasesChecked
                            ? isCorrect
                              ? 'border-emerald-300 bg-emerald-50/40'
                              : 'border-rose-300 bg-rose-50/30'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <span className="text-xs font-bold text-slate-900 block">사례 {c.id}: "{c.text}"</span>

                        {/* 5 buttons selector */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-[11px] font-bold">
                          {[
                            { id: 'human', label: '인간의 편향' },
                            { id: 'hidden', label: '숨겨진 편향' },
                            { id: 'sampling', label: '표본 편향' },
                            { id: 'longtail', label: '롱테일 편향' },
                            { id: 'intentional', label: '고의적 편향' },
                          ].map(t => (
                            <button
                              key={t.id}
                              onClick={() =>
                                setAct6CaseAnswers(prev => ({ ...prev, [c.id]: t.id }))
                              }
                              className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                                chosen === t.id
                                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-rose-300'
                              }`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>

                        {isAct6CasesChecked && (
                          <div className="pt-1 text-[11px]">
                            {isCorrect ? (
                              <span className="text-emerald-800 font-bold block">✓ 정확합니다!</span>
                            ) : (
                              <span className="text-rose-800 font-bold block">💡 힌트: {c.hint}</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <PrimaryButton
                  size="md"
                  onClick={() => setIsAct6CasesChecked(true)}
                  icon={<Check size={18} />}
                  fullWidth
                >
                  {isAct6CasesChecked ? '사례 판정 결과 다시 확인하기' : '사례 판정 결과 확인하기'}
                </PrimaryButton>
              </div>
            )}

            {/* Step 7 & 8: Model Impact & Mitigation Question */}
            {isAct6CasesChecked && (
              <div className="space-y-4 pt-2 border-t border-slate-100 animate-fadeIn">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <span className="text-xs font-bold text-slate-900 block">
                    생각해보기: 어떤 문제가 생길까? - 질문 2: 데이터셋 B(세토사 80%, 버시컬러 16%, 버지니카 4%)로 모델을 학습시키면 어떤 문제가 생길 가능성이 있을까요?
                  </span>
                  <div className="space-y-2">
                    <ChoiceCard
                      optionKey="A"
                      label="데이터가 적은 품종의 고유 패턴을 충분히 학습하기 어려워 오분류 위험이 높아질 수 있다."
                      isSelected={act6Impact === 'A'}
                      status={act6Impact === 'A' ? 'correct' : 'default'}
                      onClick={() => setAct6Impact('A')}
                    />
                    <ChoiceCard
                      optionKey="B"
                      label="모든 품종의 예측 정확도가 자동으로 100%에 도달한다."
                      isSelected={act6Impact === 'B'}
                      status={act6Impact === 'B' ? 'incorrect' : 'default'}
                      onClick={() => setAct6Impact('B')}
                    />
                    <ChoiceCard
                      optionKey="C"
                      label="품종별 데이터 개수는 기계학습 모델의 패턴 인식과 아무런 관련이 없다."
                      isSelected={act6Impact === 'C'}
                      status={act6Impact === 'C' ? 'incorrect' : 'default'}
                      onClick={() => setAct6Impact('C')}
                    />
                  </div>
                </div>

                {/* Mitigation Checklist */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <span className="text-xs font-bold text-slate-900 block">
                    8단계: 어떻게 줄일까? - 질문 3: 데이터 편향을 줄이고 공정한 모델을 만들기 위한 올바른 대처 방법을 모두 골라보세요.
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {[
                      { key: 'collectMore', label: '부족한 품종(버시컬러, 버지니카) 데이터를 추가 수집한다.', isCorrect: true },
                      { key: 'diverseCondition', label: '다양한 환경, 조건, 대상을 고르게 포괄하도록 수집 계획을 세운다.', isCorrect: true },
                      { key: 'checkDistribution', label: '학습 전 품종별 데이터 분포와 비율을 시각화하여 사전 점검한다.', isCorrect: true },
                      { key: 'documentProcess', label: '데이터 출처, 수집 방법, 라벨링 기준을 투명하게 문서화한다.', isCorrect: true },
                      { key: 'majorityOnly', label: '이미 많은 세토사 데이터만 1,000개 더 집중 수집한다.', isCorrect: false },
                      { key: 'copyRows', label: '단순히 개수만 맞추기 위해 같은 데이터를 50번씩 복사해 채운다.', isCorrect: false },
                    ].map(st => (
                      <button
                        key={st.key}
                        onClick={() =>
                          setAct6Strategies(prev => ({ ...prev, [st.key]: !prev[st.key] }))
                        }
                        className={`p-3 rounded-xl border text-left font-medium transition-all cursor-pointer flex items-center justify-between gap-2 min-h-[44px] ${
                          act6Strategies[st.key]
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <span>{st.label}</span>
                        {act6Strategies[st.key] ? (
                          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        ) : (
                          <span className="w-4 h-4 rounded border border-slate-300 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>

                  <PrimaryButton
                    size="md"
                    onClick={() => setIsAct6StrategiesChecked(true)}
                    icon={<Check size={18} />}
                    fullWidth
                  >
                    대처 방법 점검하기
                  </PrimaryButton>
                </div>

                {isAct6StrategiesChecked && (
                  <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-950 space-y-2 animate-fadeIn">
                    <span className="font-extrabold text-rose-900 text-sm block">
                      ✓ 활동 6 핵심 정리
                    </span>
                    <p className="leading-relaxed text-slate-700">
                      품종별 데이터 개수가 꼭 같아야 하는 것은 아닙니다. 중요한 것은 수집한 데이터가 실제 문제의 대상을 충분히 대표하는가입니다. 데이터셋 B(40/8/2)는 이번 활동에서 특정 품종이 지나치게 많이 포함된 명확한 표본 불균형 사례입니다.
                    </p>
                    <p className="leading-relaxed text-slate-700">
                      데이터 편향은 단순히 데이터 개수가 다른 문제만을 뜻하지 않습니다. 누구의 데이터를, 어떤 방법으로, 얼마나 다양하고 투명하게 수집했는지에 따라 인간의 편향, 표본 편향, 숨겨진 편향 등 여러 형태가 생길 수 있습니다.
                    </p>
                    <div className="p-3 bg-rose-600 text-white rounded-xl font-bold text-center text-xs shadow-xs">
                      "기계학습 모델을 만들기 전에는 데이터가 해결하려는 대상을 충분히 대표하고 공정한지 반드시 점검해야 합니다."
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 7: 전체 정리 및 학습 완료 */}
      {currentStep === 7 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-900">03 데이터 준비 점검 체크리스트</h3>
              <p className="text-xs text-slate-500">기계학습 데이터 준비 6대 수칙</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-medium flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>해결하려는 문제를 명확히 정의했는가?</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-medium flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>문제 유형(분류 / 회귀 / 군집)을 확인했는가?</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-medium flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>입력 데이터 X와 예측 목표 y를 설정했는가?</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-medium flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>올바른 데이터 수집 방식을 선택했는가?</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-medium flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>실제 측정 데이터와 합성 데이터를 구별했는가?</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-medium flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>데이터 편향(불균형) 가능성을 점검했는가?</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-600 text-white text-center font-extrabold text-sm shadow-sm">
              "좋은 기계학습은 좋은 데이터 준비에서 시작합니다."
            </div>

            <div className="pt-2 text-center space-y-2">
              {isCompleted && (
                <div className="text-xs font-bold text-emerald-700 bg-emerald-100 p-2 rounded-xl inline-block">
                  ✓ 이미 완료된 영역입니다. 언제든 자유롭게 복습 및 다시 학습이 가능합니다.
                </div>
              )}
              {!act7Confirmed && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
                  <p className="text-xs text-slate-600 font-medium">체크리스트를 확인한 뒤 아래 완료 버튼을 눌러주세요.</p>
                  <SecondaryButton size="sm" onClick={() => setAct7Confirmed(true)}>
                    내용 확인 완료
                  </SecondaryButton>
                </div>
              )}
              <PrimaryButton
                size="lg"
                fullWidth
                disabled={!act7Confirmed}
                onClick={onComplete}
                icon={<CheckCircle2 size={20} />}
              >
                03 데이터 준비 학습 완료하기
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {/* Standalone Collapsible Section: Full Iris Dataset Explorer */}
      <div className="pt-4 border-t border-slate-200">
        <button
          onClick={() => setIsPreviewOpen(!isPreviewOpen)}
          className="w-full p-4 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-sm flex items-center justify-between transition-colors cursor-pointer min-h-[48px]"
        >
          <div className="flex items-center gap-2">
            <Database size={18} className="text-emerald-600" />
            <span>Iris 원본 데이터 150개 레코드 미리보기 ({IRIS_METADATA.name})</span>
          </div>
          {isPreviewOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {isPreviewOpen && (
          <div className="mt-4 animate-fadeIn">
            <IrisDatasetPreview />
          </div>
        )}
      </div>

      {/* Internal Step Control Navigation */}
      <div className="space-y-2 pt-3 border-t border-slate-200">
        {!isStepActionCompleted && currentStep < totalSteps && (
          <p className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-center font-medium animate-fadeIn">
            {currentStep === 1 && '💡 3가지 목표 카드를 확인한 뒤 [내용 확인 완료]를 눌러주세요.'}
            {currentStep === 2 && '💡 세 문제의 기계학습 유형(분류/회귀/군집)을 모두 선택하면 다음 활동으로 이동할 수 있습니다.'}
            {currentStep === 3 && '💡 후보 속성 8개를 모두 분류하면 다음 활동으로 이동할 수 있습니다.'}
            {currentStep === 4 && '💡 3가지 상황의 수집 방법을 모두 판단하면 다음 활동으로 이동할 수 있습니다.'}
            {currentStep === 5 && '💡 데이터 신뢰도 기준을 확인하고 [선택 완료]를 눌러주세요.'}
            {currentStep === 6 && '💡 편향 탐색을 시도하고 5가지 상황을 판단하면 다음 활동으로 이동할 수 있습니다.'}
          </p>
        )}

        <div className="flex items-center justify-between gap-3">
          <SecondaryButton
            size="md"
            disabled={currentStep === 1}
            onClick={() => setCurrentStep(s => Math.max(1, s - 1))}
            icon={<ChevronLeft size={16} />}
          >
            이전 활동
          </SecondaryButton>

          {currentStep < totalSteps ? (
            <PrimaryButton
              size="md"
              disabled={!isStepActionCompleted}
              onClick={() => setCurrentStep(s => Math.min(totalSteps, s + 1))}
              icon={<ChevronRight size={16} />}
              className="flex-row-reverse"
            >
              다음 활동
            </PrimaryButton>
          ) : (
            <span className="text-xs text-emerald-700 font-bold">마지막 활동</span>
          )}
        </div>
      </div>
    </div>
  );
};
