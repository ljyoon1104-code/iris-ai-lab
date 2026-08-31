import React from 'react';
import { Target, GitBranch, LineChart, PieChart, Bot, Sparkles, BookOpen, Layers } from 'lucide-react';

interface AlgorithmSummaryItem {
  id: string;
  name: string;
  subName?: string;
  learningType: '지도학습' | '비지도학습' | '강화학습';
  problemType: string;
  coreIdea: string;
  memoryPhrase: string;
  colorScheme: {
    bg: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    iconColor: string;
    highlightBg: string;
    highlightText: string;
    highlightBorder: string;
  };
  icon: React.ReactNode;
}

const ALGORITHM_SUMMARIES: AlgorithmSummaryItem[] = [
  {
    id: 'knn',
    name: 'k-NN',
    subName: '(k-최근접 이웃)',
    learningType: '지도학습',
    problemType: '분류',
    coreIdea: '새로운 데이터와 가까운 k개의 데이터를 찾아 그 이웃들의 결과를 참고하여 예측합니다.',
    memoryPhrase: '가까운 이웃을 보고 판단한다.',
    colorScheme: {
      bg: 'bg-emerald-50/70',
      border: 'border-emerald-200',
      badgeBg: 'bg-emerald-100',
      badgeText: 'text-emerald-800',
      badgeBorder: 'border-emerald-300',
      iconColor: 'text-emerald-600',
      highlightBg: 'bg-emerald-100/90',
      highlightText: 'text-emerald-950',
      highlightBorder: 'border-emerald-300',
    },
    icon: <Target size={18} className="text-emerald-600 shrink-0" />,
  },
  {
    id: 'dt',
    name: '의사결정트리',
    learningType: '지도학습',
    problemType: '분류',
    coreIdea: '데이터의 특징에 대해 질문을 반복하면서 조건에 따라 가지를 나누어 결과를 예측합니다.',
    memoryPhrase: '질문을 따라가며 판단한다.',
    colorScheme: {
      bg: 'bg-teal-50/70',
      border: 'border-teal-200',
      badgeBg: 'bg-teal-100',
      badgeText: 'text-teal-800',
      badgeBorder: 'border-teal-300',
      iconColor: 'text-teal-600',
      highlightBg: 'bg-teal-100/90',
      highlightText: 'text-teal-950',
      highlightBorder: 'border-teal-300',
    },
    icon: <GitBranch size={18} className="text-teal-600 shrink-0" />,
  },
  {
    id: 'lr',
    name: '선형회귀',
    learningType: '지도학습',
    problemType: '회귀',
    coreIdea: '데이터의 관계를 가장 잘 나타내는 직선을 찾아 새로운 수치 값을 예측합니다.',
    memoryPhrase: '데이터의 관계를 직선으로 나타내 예측한다.',
    colorScheme: {
      bg: 'bg-emerald-50/70',
      border: 'border-emerald-200',
      badgeBg: 'bg-emerald-100',
      badgeText: 'text-emerald-800',
      badgeBorder: 'border-emerald-300',
      iconColor: 'text-emerald-600',
      highlightBg: 'bg-emerald-100/90',
      highlightText: 'text-emerald-950',
      highlightBorder: 'border-emerald-300',
    },
    icon: <LineChart size={18} className="text-emerald-600 shrink-0" />,
  },
  {
    id: 'kmeans',
    name: 'k-means',
    learningType: '비지도학습',
    problemType: '군집화',
    coreIdea: '서로 가까운 데이터들을 묶어 k개의 군집으로 나눕니다.',
    memoryPhrase: '비슷한 데이터끼리 스스로 묶는다.',
    colorScheme: {
      bg: 'bg-blue-50/70',
      border: 'border-blue-200',
      badgeBg: 'bg-blue-100',
      badgeText: 'text-blue-800',
      badgeBorder: 'border-blue-300',
      iconColor: 'text-blue-600',
      highlightBg: 'bg-blue-100/90',
      highlightText: 'text-blue-950',
      highlightBorder: 'border-blue-300',
    },
    icon: <PieChart size={18} className="text-blue-600 shrink-0" />,
  },
  {
    id: 'rl',
    name: '강화학습',
    learningType: '강화학습',
    problemType: '행동 선택 / 의사결정',
    coreIdea: '행동의 결과로 받은 보상을 이용하여 더 좋은 행동을 점차 학습합니다.',
    memoryPhrase: '행동하고 보상을 받으며 배운다.',
    colorScheme: {
      bg: 'bg-amber-50/70',
      border: 'border-amber-200',
      badgeBg: 'bg-amber-100',
      badgeText: 'text-amber-800',
      badgeBorder: 'border-amber-300',
      iconColor: 'text-amber-600',
      highlightBg: 'bg-amber-100/90',
      highlightText: 'text-amber-950',
      highlightBorder: 'border-amber-300',
    },
    icon: <Bot size={18} className="text-amber-600 shrink-0" />,
  },
];

export const MasterAlgorithmComparison: React.FC = () => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-xs text-purple-950 space-y-1 shadow-xs">
        <span className="font-extrabold text-sm text-purple-900 block flex items-center gap-1.5">
          <BookOpen size={18} className="text-purple-600" />
          <span>5대 머신러닝 알고리즘 핵심 요약 총정리</span>
        </span>
        <p className="leading-relaxed text-purple-900 font-medium">
          앞선 실험에서 직접 다뤄본 5개 알고리즘의 <strong>학습 유형, 핵심 아이디어, 해결 문제</strong>를 한눈에 비교하고 차이점을 정리해 보세요.
        </p>
      </div>

      {/* 5 Algorithm Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {ALGORITHM_SUMMARIES.map(item => (
          <div
            key={item.id}
            className={`p-4 rounded-2xl border ${item.colorScheme.bg} ${item.colorScheme.border} shadow-2xs flex flex-col justify-between space-y-3 transition-all`}
          >
            {/* 1. Header: Name & Learning Type Badge */}
            <div className="flex items-start justify-between gap-2 border-b border-slate-200/60 pb-2.5">
              <div className="flex items-center gap-1.5 font-black text-slate-900 text-sm">
                {item.icon}
                <span>{item.name}</span>
                {item.subName && <span className="text-[11px] font-normal text-slate-500">{item.subName}</span>}
              </div>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${item.colorScheme.badgeBg} ${item.colorScheme.badgeText} ${item.colorScheme.badgeBorder} shrink-0`}
              >
                {item.learningType}
              </span>
            </div>

            {/* 2. Body: Core Idea & Problem Type */}
            <div className="space-y-2 text-xs flex-1">
              <div>
                <span className="text-[10px] font-bold text-slate-500 block mb-0.5">핵심 아이디어:</span>
                <p className="text-slate-800 leading-relaxed font-medium">
                  {item.coreIdea}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-500 block mb-0.5">주로 해결하는 문제:</span>
                <span className="inline-block font-extrabold text-slate-800 bg-white/80 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                  {item.problemType}
                </span>
              </div>
            </div>

            {/* 3. Footer: Memory Phrase Highlight Card */}
            <div
              className={`p-2.5 rounded-xl border ${item.colorScheme.highlightBg} ${item.colorScheme.highlightBorder} text-xs space-y-0.5`}
            >
              <span className="text-[10px] font-bold text-slate-600 block flex items-center gap-1">
                <Sparkles size={12} className={item.colorScheme.iconColor} />
                <span>한 줄 기억하기:</span>
              </span>
              <p className={`font-black text-[11px] leading-snug ${item.colorScheme.highlightText}`}>
                "{item.memoryPhrase}"
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 5 Algorithms Comparison Table */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-1.5 font-extrabold text-slate-900 text-xs">
          <Layers size={16} className="text-purple-600" />
          <span>[5대 알고리즘 한눈에 비교표]</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[480px]">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                <th className="p-2.5 rounded-l-lg">알고리즘</th>
                <th className="p-2.5">학습 방식</th>
                <th className="p-2.5">대표 문제</th>
                <th className="p-2.5 rounded-r-lg">한 줄 요약</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {ALGORITHM_SUMMARIES.map(row => (
                <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-2.5 font-bold text-slate-900 flex items-center gap-1.5">
                    {row.icon}
                    <span>{row.name}</span>
                  </td>
                  <td className="p-2.5">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${row.colorScheme.badgeBg} ${row.colorScheme.badgeText} ${row.colorScheme.badgeBorder}`}
                    >
                      {row.learningType}
                    </span>
                  </td>
                  <td className="p-2.5">
                    <span className="font-bold text-slate-800">{row.problemType}</span>
                  </td>
                  <td className="p-2.5 text-slate-600 text-[11px]">
                    "{row.memoryPhrase}"
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

