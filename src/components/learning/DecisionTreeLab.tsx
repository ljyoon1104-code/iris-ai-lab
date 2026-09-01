import React, { useState } from 'react';
import { ORIGINAL_IRIS_DATASET } from '../../data/irisDataset';
import {
  trainDecisionTree,
  traceDecisionPath,
  type DecisionTreeNode,
  type FeatureKey,
} from '../../algorithms/decisionTree';
import { SpeciesBadge } from '../common/SpeciesBadge';
import { getSpeciesConfig } from '../../constants/species';
import { GitBranch, Sliders, Eye, HelpCircle, Sparkles } from 'lucide-react';

const FEATURE_LABELS: Record<FeatureKey, string> = {
  sepalLength: '꽃받침 길이',
  sepalWidth: '꽃받침 너비',
  petalLength: '꽃잎 길이',
  petalWidth: '꽃잎 너비',
};

const FEATURE_MIN_MAX: Record<FeatureKey, { min: number; max: number; step: number }> = {
  sepalLength: { min: 4.0, max: 8.0, step: 0.1 },
  sepalWidth: { min: 2.0, max: 4.5, step: 0.1 },
  petalLength: { min: 1.0, max: 7.0, step: 0.1 },
  petalWidth: { min: 0.1, max: 2.5, step: 0.1 },
};

interface LayoutNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  isLeaf: boolean;
  node: DecisionTreeNode;
  left?: LayoutNode;
  right?: LayoutNode;
}

interface LayoutEdge {
  parent: LayoutNode;
  child: LayoutNode;
  isLeft: boolean;
  threshold: number;
  onPath: boolean;
}

function computeTreeLayout(tree: DecisionTreeNode, newPoint: Record<FeatureKey, number>) {
  const levelHeight = 150;
  const topPadding = 35;
  const leafSpacing = 175;
  const paddingLeft = 35;

  let leafIndex = 0;
  const allNodes: LayoutNode[] = [];
  const allEdges: LayoutEdge[] = [];

  const isNodeOnPath = (node: DecisionTreeNode): boolean => {
    let curr: DecisionTreeNode | null | undefined = tree;
    while (curr) {
      if (curr === node) return true;
      if (curr.isLeaf) break;
      const val = newPoint[curr.feature!];
      if (val <= curr.threshold!) {
        curr = curr.left;
      } else {
        curr = curr.right;
      }
    }
    return false;
  };

  function buildLayout(node: DecisionTreeNode): LayoutNode {
    const width = node.isLeaf ? 150 : 180;
    const height = node.isLeaf ? 76 : 86;
    const y = topPadding + node.depth * levelHeight;

    if (node.isLeaf) {
      const x = leafIndex * leafSpacing + paddingLeft + width / 2;
      leafIndex++;
      const layoutNode: LayoutNode = {
        id: node.id,
        x,
        y,
        width,
        height,
        depth: node.depth,
        isLeaf: true,
        node,
      };
      allNodes.push(layoutNode);
      return layoutNode;
    }

    const leftLayout = node.left ? buildLayout(node.left) : undefined;
    const rightLayout = node.right ? buildLayout(node.right) : undefined;

    let x = 0;
    if (leftLayout && rightLayout) {
      x = (leftLayout.x + rightLayout.x) / 2;
    } else if (leftLayout) {
      x = leftLayout.x;
    } else if (rightLayout) {
      x = rightLayout.x;
    }

    const layoutNode: LayoutNode = {
      id: node.id,
      x,
      y,
      width,
      height,
      depth: node.depth,
      isLeaf: false,
      node,
      left: leftLayout,
      right: rightLayout,
    };
    allNodes.push(layoutNode);

    const parentOnPath = isNodeOnPath(node);
    const val = newPoint[node.feature!];
    const goesLeft = val <= node.threshold!;

    if (leftLayout) {
      allEdges.push({
        parent: layoutNode,
        child: leftLayout,
        isLeft: true,
        threshold: node.threshold!,
        onPath: parentOnPath && goesLeft,
      });
    }

    if (rightLayout) {
      allEdges.push({
        parent: layoutNode,
        child: rightLayout,
        isLeft: false,
        threshold: node.threshold!,
        onPath: parentOnPath && !goesLeft,
      });
    }

    return layoutNode;
  }

  const root = buildLayout(tree);
  const totalWidth = Math.max(520, leafIndex * leafSpacing + paddingLeft * 2);
  const maxDepthInTree = Math.max(...allNodes.map(n => n.depth));
  const totalHeight = topPadding + (maxDepthInTree + 1) * levelHeight + 35;

  return { root, allNodes, allEdges, totalWidth, totalHeight };
}

export const DecisionTreeLab: React.FC = () => {
  const [maxDepth, setMaxDepth] = useState<number>(3);
  const [newPoint, setNewPoint] = useState<Record<FeatureKey, number>>({
    sepalLength: 6.0,
    sepalWidth: 3.0,
    petalLength: 4.8,
    petalWidth: 1.6,
  });

  const [rawInputs, setRawInputs] = useState<Record<FeatureKey, string>>({
    sepalLength: '6.0',
    sepalWidth: '3.0',
    petalLength: '4.8',
    petalWidth: '1.6',
  });

  const [userObservationChoice, setUserObservationChoice] = useState<string | null>(null);

  const features: FeatureKey[] = ['sepalLength', 'sepalWidth', 'petalLength', 'petalWidth'];
  const tree = trainDecisionTree(ORIGINAL_IRIS_DATASET, features, maxDepth);
  const trace = traceDecisionPath(tree, newPoint);
  const layout = computeTreeLayout(tree, newPoint);

  const handleAdjustValue = (feat: FeatureKey, delta: number) => {
    const spec = FEATURE_MIN_MAX[feat];
    setNewPoint(prev => {
      const nextVal = Math.round((prev[feat] + delta) * 10) / 10;
      const clamped = Math.min(spec.max, Math.max(spec.min, nextVal));
      setRawInputs(r => ({ ...r, [feat]: String(clamped) }));
      return { ...prev, [feat]: clamped };
    });
  };

  const handleDirectNumberInput = (feat: FeatureKey, rawVal: string) => {
    let cleaned = rawVal;
    if (/^0[0-9]/.test(cleaned)) {
      cleaned = cleaned.replace(/^0+(?=[1-9])/, '');
    }
    setRawInputs(prev => ({ ...prev, [feat]: cleaned }));

    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed)) {
      setNewPoint(prev => ({ ...prev, [feat]: Math.round(parsed * 10) / 10 }));
    }
  };

  const handleBlurInput = (feat: FeatureKey) => {
    const spec = FEATURE_MIN_MAX[feat];
    const str = (rawInputs[feat] || '').trim();
    if (str === '' || isNaN(Number(str))) {
      setRawInputs(prev => ({ ...prev, [feat]: String(newPoint[feat]) }));
    } else {
      const parsed = parseFloat(str);
      const clamped = Math.min(spec.max, Math.max(spec.min, Math.round(parsed * 10) / 10));
      setNewPoint(prev => ({ ...prev, [feat]: clamped }));
      setRawInputs(prev => ({ ...prev, [feat]: String(clamped) }));
    }
  };

  const handleApplySample = (sampleType: 'setosa' | 'versicolor' | 'virginica') => {
    let pt: Record<FeatureKey, number>;
    if (sampleType === 'setosa') {
      pt = { sepalLength: 5.1, sepalWidth: 3.5, petalLength: 1.4, petalWidth: 0.2 };
    } else if (sampleType === 'versicolor') {
      pt = { sepalLength: 5.7, sepalWidth: 2.8, petalLength: 4.1, petalWidth: 1.3 };
    } else {
      pt = { sepalLength: 6.3, sepalWidth: 3.3, petalLength: 6.0, petalWidth: 2.5 };
    }
    setNewPoint(pt);
    setRawInputs({
      sepalLength: String(pt.sepalLength),
      sepalWidth: String(pt.sepalWidth),
      petalLength: String(pt.petalLength),
      petalWidth: String(pt.petalWidth),
    });
  };

  const isNodeOnPath = (node: DecisionTreeNode): boolean => {
    let curr: DecisionTreeNode | null | undefined = tree;
    while (curr) {
      if (curr === node) return true;
      if (curr.isLeaf) break;
      const val = newPoint[curr.feature!];
      if (val <= curr.threshold!) {
        curr = curr.left;
      } else {
        curr = curr.right;
      }
    }
    return false;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="font-extrabold text-slate-900 block flex items-center gap-1.5">
            <Sliders size={16} className="text-teal-600" />
            <span>[무엇을 바꿀 수 있나요?]</span>
          </span>
          <p className="text-slate-600 leading-relaxed font-medium">
            트리의 <strong>최대 깊이 (maxDepth 2, 3, 4)</strong>와 붓꽃 측정 수치를 직접 조정하거나 대표 예시 샘플을 원클릭으로 적용할 수 있습니다.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="font-extrabold text-slate-900 block flex items-center gap-1.5">
            <Eye size={16} className="text-blue-600" />
            <span>[무엇을 관찰하면 되나요?]</span>
          </span>
          <p className="text-slate-600 leading-relaxed font-medium">
            질문 노드(A/B)를 거쳐 <strong>예/아니오 갈림길을 따라 초록색/장미색으로 강조되는 실시간 판단 경로</strong>와 최종 예측 결론을 관찰하세요.
          </p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        {/* Header & Quick Samples */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <GitBranch size={20} className="text-teal-600" />
            <span>의사결정트리 (Decision Tree) 시각적 탐색 & 판단 경로 추적</span>
          </h3>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
              <Sparkles size={13} className="text-amber-500" /> 빠른 예시:
            </span>
            <button
              onClick={() => handleApplySample('setosa')}
              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold rounded-lg text-[11px] cursor-pointer inline-flex items-center gap-1"
            >
              <span className="text-emerald-600 font-black">●</span>
              <span>세토사 예시</span>
            </button>
            <button
              onClick={() => handleApplySample('versicolor')}
              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-orange-800 font-bold rounded-lg text-[11px] cursor-pointer inline-flex items-center gap-1"
            >
              <span className="text-orange-600 font-black">▲</span>
              <span>버시컬러 예시</span>
            </button>
            <button
              onClick={() => handleApplySample('virginica')}
              className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 border border-purple-300 text-purple-800 font-bold rounded-lg text-[11px] cursor-pointer inline-flex items-center gap-1"
            >
              <span className="text-purple-600 font-black">■</span>
              <span>버지니카 예시</span>
            </button>
          </div>
        </div>

        {/* Max Depth Controls */}
        <div className="space-y-2 text-xs">
          <span className="font-bold text-slate-700 block">트리 최대 깊이 (maxDepth) 설정:</span>
          <div className="grid grid-cols-3 gap-2">
            {[2, 3, 4].map(d => (
              <button
                key={d}
                onClick={() => setMaxDepth(d)}
                className={`p-3 rounded-xl font-bold transition-all min-h-[44px] cursor-pointer ${
                  maxDepth === d
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                깊이 {d} ({d === 2 ? '단순한 규칙' : d === 3 ? '표준 규칙' : '정밀한 규칙'})
              </button>
            ))}
          </div>
        </div>

        {/* Feature Value Inputs */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="font-extrabold text-slate-900 block">
              새로운 붓꽃 측정 수치 조절:
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              💡 수치를 변경하면 트리의 질문을 통과하는 경로가 실시간으로 바뀝니다.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {features.map(feat => {
              const spec = FEATURE_MIN_MAX[feat];
              const val = newPoint[feat];

              return (
                <div key={feat} className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center font-bold text-slate-800">
                    <span>{FEATURE_LABELS[feat]}</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={rawInputs[feat] !== undefined ? rawInputs[feat] : String(val)}
                        onChange={e => handleDirectNumberInput(feat, e.target.value)}
                        onBlur={() => handleBlurInput(feat)}
                        placeholder={String(val)}
                        className="w-20 p-1.5 text-right font-mono font-black text-teal-700 border border-slate-300 rounded-lg bg-teal-50/50 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                      <span className="text-slate-600 font-mono">cm</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAdjustValue(feat, -0.2)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded font-mono font-bold text-xs cursor-pointer min-h-[36px]"
                    >
                      -0.2
                    </button>
                    <input
                      type="range"
                      min={spec.min}
                      max={spec.max}
                      step={spec.step}
                      value={val}
                      onChange={e => {
                        const nV = parseFloat(e.target.value);
                        setNewPoint(prev => ({ ...prev, [feat]: nV }));
                        setRawInputs(prev => ({ ...prev, [feat]: String(nV) }));
                      }}
                      className="w-full accent-teal-600 cursor-pointer"
                    />
                    <button
                      onClick={() => handleAdjustValue(feat, 0.2)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded font-mono font-bold text-xs cursor-pointer min-h-[36px]"
                    >
                      +0.2
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step-by-step Trace Explanation Banner */}
        <div className="p-4 bg-teal-700 text-white rounded-2xl space-y-3 text-xs shadow-xs">
          <div className="flex items-center justify-between border-b border-teal-600 pb-2 font-bold">
            <span className="text-sm font-black flex items-center gap-1.5">
              <span>🧭 [이 데이터는 이렇게 판단했습니다]</span>
            </span>
            <span className="text-teal-200 font-mono text-[11px]">깊이 {maxDepth}</span>
          </div>

          <div className="space-y-1.5">
            {trace.steps.map((s, idx) => (
              <div key={idx} className="bg-teal-800/80 p-2.5 rounded-xl border border-teal-600 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] flex items-center justify-center shrink-0">
                  {s.stepNumber}
                </span>
                <div className="flex-1 text-[11px]">
                  <span>
                    <strong>{s.featureLabel}</strong> 측정값({s.value}cm)이 기준({s.threshold}cm)보다{' '}
                    <strong className={s.conditionMet ? 'text-emerald-300' : 'text-rose-300'}>
                      {s.conditionMet ? '이하(YES)' : '초과(NO)'}
                    </strong>
                    이므로 ➔ <strong>{s.nextDescription}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-teal-600 flex items-center justify-between">
            <div>
              <span className="text-teal-200 text-[11px] block mb-1">최종 도달 예측 품종</span>
              <SpeciesBadge species={trace.predictedSpecies} showEnglish size="lg" variant="solid" />
            </div>
            <span className="text-xs bg-teal-800 px-3 py-1.5 rounded-lg border border-teal-500 font-mono font-bold">
              {trace.predictedSpecies}
            </span>
          </div>
        </div>

        {/* Tree Visualizer SVG (Subtree-based Layout with Zero Overlap) */}
        <div className="space-y-2 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="font-bold text-slate-800 block">
              위 ➔ 아래로 읽는 의사결정트리 질문 구조 (실시간 활성 경로 강조):
            </span>
            <span className="text-[11px] text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              💡 초록색/장미색 테두리가 켜진 노드가 현재 데이터가 지나가는 길입니다.
            </span>
          </div>

          <div className="p-3 sm:p-5 bg-slate-50 border border-slate-200 rounded-2xl overflow-x-auto min-h-[360px] touch-pan-x select-none">
            <div className="min-w-fit flex justify-center py-2">
              <svg
                width={layout.totalWidth}
                height={layout.totalHeight}
                viewBox={`0 0 ${layout.totalWidth} ${layout.totalHeight}`}
                className="max-w-none"
              >
                <defs>
                  <filter id="nodeShadow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.08" />
                  </filter>
                  <filter id="activeShadow" x="-15%" y="-15%" width="130%" height="130%">
                    <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#0d9488" floodOpacity="0.3" />
                  </filter>
                </defs>

                {/* 1. Connection Lines (Edges) */}
                {layout.allEdges.map((e, idx) => {
                  const p = e.parent;
                  const c = e.child;
                  const pBottom = p.y + p.height;
                  const cTop = c.y;
                  const midY = (pBottom + cTop) / 2;

                  const pathD = `M ${p.x} ${pBottom} C ${p.x} ${midY}, ${c.x} ${midY}, ${c.x} ${cTop}`;

                  return (
                    <g key={`edge-${idx}`}>
                      <path
                        d={pathD}
                        fill="none"
                        stroke={e.onPath ? (e.isLeft ? '#059669' : '#e11d48') : '#cbd5e1'}
                        strokeWidth={e.onPath ? '3.5' : '2'}
                        strokeDasharray={e.onPath ? undefined : '4 3'}
                        strokeLinecap="round"
                      />
                    </g>
                  );
                })}

                {/* 2. Branch Badges at Midpoint */}
                {layout.allEdges.map((e, idx) => {
                  const p = e.parent;
                  const c = e.child;
                  const pBottom = p.y + p.height;
                  const cTop = c.y;
                  const midX = (p.x + c.x) / 2;
                  const midY = (pBottom + cTop) / 2;

                  const badgeW = 94;
                  const badgeH = 20;

                  const isLeft = e.isLeft;
                  const badgeText = isLeft ? `예 (≤ ${e.threshold}cm)` : `아니오 (> ${e.threshold}cm)`;

                  return (
                    <g key={`branch-badge-${idx}`} transform={`translate(${midX - badgeW / 2}, ${midY - badgeH / 2})`}>
                      <rect
                        width={badgeW}
                        height={badgeH}
                        rx="10"
                        fill={e.onPath ? (isLeft ? '#059669' : '#e11d48') : '#ffffff'}
                        stroke={e.onPath ? (isLeft ? '#047857' : '#be123c') : isLeft ? '#10b981' : '#f43f5e'}
                        strokeWidth="1.5"
                        filter="url(#nodeShadow)"
                      />
                      <text
                        x={badgeW / 2}
                        y={badgeH / 2 + 3.5}
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="bold"
                        fill={e.onPath ? '#ffffff' : isLeft ? '#065f46' : '#9f1239'}
                        fontFamily="sans-serif"
                      >
                        {badgeText}
                      </text>
                    </g>
                  );
                })}

                {/* 3. Tree Nodes */}
                {layout.allNodes.map(n => {
                  const node = n.node;
                  const onPath = isNodeOnPath(node);
                  const isRoot = n.depth === 0;

                  if (n.isLeaf) {
                    const sp = node.predictedSpecies!;
                    const conf = getSpeciesConfig(sp);

                    const fill = conf.lightBgColor;
                    const stroke = conf.borderColor;
                    const textColor = conf.hexColor;

                    return (
                      <g
                        key={n.id}
                        transform={`translate(${n.x - n.width / 2}, ${n.y})`}
                        filter={onPath ? 'url(#activeShadow)' : 'url(#nodeShadow)'}
                      >
                        <rect
                          width={n.width}
                          height={n.height}
                          rx="14"
                          fill={fill}
                          stroke={onPath ? '#0d9488' : stroke}
                          strokeWidth={onPath ? '3' : '2'}
                        />

                        {/* Node Role Header */}
                        <text
                          x={n.width / 2}
                          y="18"
                          textAnchor="middle"
                          fontSize="9"
                          fontWeight="bold"
                          fill="#475569"
                          letterSpacing="0.05em"
                        >
                          C. 최종 예측 노드
                        </text>

                        {/* Species Symbol & Korean Name */}
                        <text
                          x={n.width / 2}
                          y="38"
                          textAnchor="middle"
                          fontSize="15"
                          fontWeight="900"
                          fill={textColor}
                        >
                          {conf.symbol} {conf.koreanName}
                        </text>

                        {/* Species English Subtitle */}
                        <text
                          x={n.width / 2}
                          y="50"
                          textAnchor="middle"
                          fontSize="9"
                          fill={textColor}
                          opacity="0.8"
                          fontFamily="monospace"
                        >
                          ({conf.englishName})
                        </text>

                        {/* Active Decision Conclusion Tag */}
                        {onPath && (
                          <g transform={`translate(${(n.width - 92) / 2}, 56)`}>
                            <rect width="92" height="15" rx="4" fill="#0d9488" />
                            <text x="46" y="11" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#ffffff">
                              ✓ 최종 예측 결론
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  }

                  // Question Node (Root or Mid)
                  const featLabel = FEATURE_LABELS[node.feature!];
                  const val = newPoint[node.feature!];
                  const goesLeft = val <= node.threshold!;

                  const rootFill = '#0f766e';
                  const midFill = '#f0fdfa';
                  const midStroke = '#5eead4';

                  return (
                    <g
                      key={n.id}
                      transform={`translate(${n.x - n.width / 2}, ${n.y})`}
                      filter={onPath ? 'url(#activeShadow)' : 'url(#nodeShadow)'}
                    >
                      <rect
                        width={n.width}
                        height={n.height}
                        rx="14"
                        fill={isRoot ? rootFill : midFill}
                        stroke={onPath ? (isRoot ? '#38bdf8' : '#0d9488') : isRoot ? '#115e59' : midStroke}
                        strokeWidth={onPath ? '3' : '2'}
                      />

                      {/* Node Role Header */}
                      <text
                        x={n.width / 2}
                        y="18"
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="bold"
                        fill={isRoot ? '#ccfbf1' : '#0f766e'}
                        letterSpacing="0.03em"
                      >
                        {isRoot ? 'A. 시작 질문 노드' : `B. 중간 판단 (깊이 ${node.depth})`}
                      </text>

                      {/* Question Line 1 */}
                      <text
                        x={n.width / 2}
                        y="34"
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="900"
                        fill={isRoot ? '#ffffff' : '#134e4a'}
                      >
                        "{featLabel}가"
                      </text>

                      {/* Question Line 2 */}
                      <text
                        x={n.width / 2}
                        y="48"
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="900"
                        fill={isRoot ? '#ffffff' : '#134e4a'}
                      >
                        "{node.threshold}cm 이하인가요?"
                      </text>

                      {/* Threshold Rule Chip */}
                      <g transform={`translate(${(n.width - 100) / 2}, 54)`}>
                        <rect
                          width="100"
                          height="14"
                          rx="4"
                          fill={isRoot ? '#115e59' : '#ccfbf1'}
                        />
                        <text
                          x="50"
                          y="10.5"
                          textAnchor="middle"
                          fontSize="8.5"
                          fontFamily="monospace"
                          fontWeight="bold"
                          fill={isRoot ? '#99f6e4' : '#0f766e'}
                        >
                          {node.feature} ≤ {node.threshold}
                        </text>
                      </g>

                      {/* Real-time Value & Direction Tag */}
                      {onPath && (
                        <g transform={`translate(${(n.width - 130) / 2}, 69)`}>
                          <rect
                            width="130"
                            height="13"
                            rx="3"
                            fill={goesLeft ? '#059669' : '#e11d48'}
                          />
                          <text
                            x="65"
                            y="9.5"
                            textAnchor="middle"
                            fontSize="7.5"
                            fontWeight="bold"
                            fill="#ffffff"
                          >
                            값: {val}cm ➔ {goesLeft ? 'YES 가지' : 'NO 가지'}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>

        {/* Observation Question Card (Section 5) */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
          <span className="font-extrabold text-slate-900 block text-sm flex items-center gap-1.5">
            <HelpCircle size={16} className="text-teal-600" />
            <span>[핵심 관찰 질문] 의사결정트리의 깊이와 규칙의 관계</span>
          </span>

          <p className="text-slate-700 font-medium leading-relaxed">
            질문: <strong>트리의 깊이가 깊어질수록 판단 규칙은 어떻게 변화할까요?</strong>
          </p>

          <div className="space-y-2">
            {[
              {
                key: 'ans1',
                label: '트리의 깊이가 깊어질수록 더 많은 판단 질문(분지 규칙)이 추가되어 모델이 정교해지고 복잡해집니다.',
              },
              {
                key: 'ans2',
                label: '트리의 깊이가 깊어질수록 조건 질문이 적어져 판단 규칙이 더 단순해집니다.',
              },
            ].map(opt => (
              <button
                key={opt.key}
                onClick={() => setUserObservationChoice(opt.key)}
                className={`w-full text-left p-3 rounded-xl border font-bold transition-all min-h-[44px] cursor-pointer ${
                  userObservationChoice === opt.key
                    ? opt.key === 'ans1'
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-rose-600 text-white border-rose-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {userObservationChoice && (
            <div
              className={`p-3 rounded-lg text-xs leading-relaxed animate-fadeIn ${
                userObservationChoice === 'ans1'
                  ? 'bg-teal-50 text-teal-950 border border-teal-200'
                  : 'bg-rose-50 text-rose-950 border border-rose-200'
              }`}
            >
              {userObservationChoice === 'ans1' ? (
                <span>
                  ✓ <strong>정답입니다!</strong> 트리의 깊이가 깊어질수록 더 많은 질문 노드가 생겨나 데이터를 더 세밀하게 쪼개지만, 지나치게 깊어지면 훈련 데이터에만 과도하게 맞추는 과대적합(Overfitting) 위험이 생깁니다.
                </span>
              ) : (
                <span>
                  X 다시 확인해보세요. 트리의 깊이가 깊어지면 아래로 가지가 더 많이 갈라져 질문 조건이 늘어나므로 모델이 더 복잡해집니다.
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
