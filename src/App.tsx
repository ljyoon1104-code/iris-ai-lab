import { useState, useEffect, useRef } from 'react';
import { useProgress } from './hooks/useProgress';
import { Header } from './components/common/Header';
import { BottomNavigation } from './components/common/BottomNavigation';
import { PageContainer } from './components/common/PageContainer';
import { Modal } from './components/common/Modal';
import { HomePage } from './pages/HomePage';
import { ModuleDetailPage } from './pages/ModuleDetailPage';
import { ML_STEPS } from './data/modules';
import { BookOpen, ShieldCheck, Cpu } from 'lucide-react';

const parseModuleFromHash = (): number | null => {
  if (typeof window === 'undefined') return null;
  const match = window.location.hash.match(/#module-(\d+)/);
  if (match) {
    const id = parseInt(match[1], 10);
    if (id >= 1 && id <= 8) return id;
  }
  return null;
};

export function App() {
  const { progress, setModuleCompleted, setCurrentModule, resetAllProgress, calculatePercentage } =
    useProgress();

  const [activeModuleId, setActiveModuleId] = useState<number | null>(() => parseModuleFromHash());
  const [previousModuleId, setPreviousModuleId] = useState<number | null>(null);
  const activeModuleIdRef = useRef<number | null>(activeModuleId);
  activeModuleIdRef.current = activeModuleId;

  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isWorkflowOpen, setIsWorkflowOpen] = useState(false);

  const progressPercent = calculatePercentage(8);

  // Sync with browser history popstate (Back / Forward)
  useEffect(() => {
    const initialId = parseModuleFromHash();
    const initialUrl = initialId
      ? `${window.location.pathname}${window.location.search}#module-${initialId}`
      : window.location.href;
    window.history.replaceState({ moduleId: initialId, prevId: null }, '', initialUrl);

    const handlePopState = (e: PopStateEvent) => {
      let targetId: number | null = null;
      if (e.state && e.state.moduleId !== undefined) {
        targetId = e.state.moduleId;
      } else {
        targetId = parseModuleFromHash();
      }

      setPreviousModuleId(activeModuleIdRef.current);
      setActiveModuleId(targetId);
      if (targetId !== null) {
        setCurrentModule(targetId);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setCurrentModule]);

  const handleSelectModule = (id: number) => {
    if (id === activeModuleId) return;
    setPreviousModuleId(activeModuleId);
    setActiveModuleId(id);
    setCurrentModule(id);

    const hash = `#module-${id}`;
    const newUrl = `${window.location.pathname}${window.location.search}${hash}`;
    window.history.pushState({ moduleId: id, prevId: activeModuleId }, '', newUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoHome = () => {
    if (activeModuleId === null) return;
    setPreviousModuleId(activeModuleId);
    setActiveModuleId(null);

    const newUrl = `${window.location.pathname}${window.location.search}`;
    window.history.pushState({ moduleId: null, prevId: activeModuleId }, '', newUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    if (window.history.state && window.history.state.moduleId !== undefined) {
      window.history.back();
    } else if (previousModuleId !== null) {
      handleSelectModule(previousModuleId);
    } else {
      handleGoHome();
    }
  };

  const handleStartOrContinue = () => {
    const targetId = progress.currentModuleId || 1;
    handleSelectModule(targetId);
  };

  const handleToggleComplete = (id: number) => {
    setModuleCompleted(id);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-200 selection:text-emerald-900">
      {/* Global Common Header */}
      <Header
        progressPercent={progressPercent}
        completedModuleIds={progress.completedModuleIds}
        onSelectModule={handleSelectModule}
        onGoHome={handleGoHome}
        onResetProgress={resetAllProgress}
      />

      {/* Main Responsive Page Content */}
      <PageContainer>
        {activeModuleId === null ? (
          <HomePage
            progressPercent={progressPercent}
            completedModuleIds={progress.completedModuleIds}
            onSelectModule={handleSelectModule}
            onStartOrContinue={handleStartOrContinue}
            onResetProgress={resetAllProgress}
          />
        ) : (
          <ModuleDetailPage
            moduleId={activeModuleId}
            completedModuleIds={progress.completedModuleIds}
            onSelectModule={handleSelectModule}
            onGoHome={handleGoHome}
            onBack={handleBack}
            previousModuleId={previousModuleId}
            onToggleComplete={handleToggleComplete}
          />
        )}
      </PageContainer>

      {/* Global Common Bottom Navigation */}
      <BottomNavigation
        currentModuleId={activeModuleId}
        onGoHome={handleGoHome}
        onGoCurrentModule={() => handleSelectModule(progress.currentModuleId || 1)}
        onOpenWorkflow={() => setIsWorkflowOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* ML 6-Step Workflow Guide Modal */}
      <Modal
        isOpen={isWorkflowOpen}
        onClose={() => setIsWorkflowOpen(false)}
        title="기계학습 문제 해결 6단계 과정"
      >
        <div className="space-y-4 text-slate-700 text-sm">
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            인공지능 기초 수업에서 붓꽃 데이터를 이용해 기계학습 모델을 구축하는 6단계 흐름입니다.
          </p>
          <div className="space-y-3">
            {ML_STEPS.map(step => (
              <div key={step.stepNumber} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-600 text-white">
                    {step.stepNumber}단계
                  </span>
                  <h4 className="font-bold text-slate-900">{step.title}</h4>
                </div>
                <p className="text-xs text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Help / Guide Modal */}
      <Modal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} title="Iris AI Lab 이용 안내">
        <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
            <ShieldCheck size={22} className="text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-emerald-900 text-xs">서버리스 및 개인정보 보호</h4>
              <p className="text-xs text-emerald-800">
                모든 기계학습 연산은 브라우저 내부에서 진행됩니다. 외부 서버 전송이나 회원가입이 전혀 필요하지 않습니다.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <Cpu size={16} className="text-emerald-600" />
              <span>학생 학습 안내</span>
            </h4>
            <ul className="text-xs space-y-1 text-slate-600 list-disc list-inside">
              <li>코딩 없이 직접 데이터를 관찰하고 조작합니다.</li>
              <li>k-NN, 의사결정트리, 선형회귀, k-means, 강화학습을 체험합니다.</li>
              <li>학습 결과를 정확도와 3x3 혼동행렬 카드로 비교합니다.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <BookOpen size={16} className="text-emerald-600" />
              <span>권장 기기</span>
            </h4>
            <p className="text-xs text-slate-600">
              스마트폰 세로 화면, 태블릿, PC 및 교사 시연용 프로젝터 화면에 최적화되어 있습니다.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default App;
