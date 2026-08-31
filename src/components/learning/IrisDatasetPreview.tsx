import React, { useState } from 'react';
import { ORIGINAL_IRIS_DATASET, IRIS_METADATA } from '../../data/irisDataset';
import { SpeciesBadge } from '../common/SpeciesBadge';
import { SPECIES_CONFIG, ALL_SPECIES_LIST } from '../../constants/species';
import { Database, Filter, Layers, Info } from 'lucide-react';

export const IrisDatasetPreview: React.FC = () => {
  const [selectedSpecies, setSelectedSpecies] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  const filteredDataset = ORIGINAL_IRIS_DATASET.filter(item => {
    if (selectedSpecies === 'all') return true;
    return item.species === selectedSpecies;
  });

  const totalPages = Math.ceil(filteredDataset.length / pageSize);
  const paginatedData = filteredDataset.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      {/* Dataset Summary & Metadata */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Database size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-emerald-950">{IRIS_METADATA.name}</h3>
              <p className="text-xs text-emerald-800">{IRIS_METADATA.description}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-semibold border border-emerald-300">
              출처: {IRIS_METADATA.source}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white text-slate-700 font-semibold border border-slate-200">
              라이선스: {IRIS_METADATA.license}
            </span>
          </div>
        </div>

        {/* CSS-based Species Distribution Bar */}
        <div className="bg-white rounded-xl p-4 border border-emerald-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span>품종별 데이터 분포 (총 {IRIS_METADATA.totalRows}개 행)</span>
            <span className="text-emerald-700">균등 분포 (각 50개)</span>
          </div>

          <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            <div className="w-1/3 bg-emerald-500 h-full border-r border-white/40" title="● 세토사 50개" />
            <div className="w-1/3 bg-amber-500 h-full border-r border-white/40" title="▲ 버시컬러 50개" />
            <div className="w-1/3 bg-purple-500 h-full" title="■ 버지니카 50개" />
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            {ALL_SPECIES_LIST.map(spKey => {
              const conf = SPECIES_CONFIG[spKey];
              return (
                <div key={spKey} className={`p-2 rounded-lg border ${conf.bgClass} ${conf.borderClass}`}>
                  <span className={`font-extrabold ${conf.textClass} block flex items-center justify-center gap-1`}>
                    <span style={{ color: conf.hexColor }} className="font-black shrink-0">{conf.symbol}</span>
                    <span>{conf.koreanName}</span>
                    <span className="opacity-75 text-[10px] hidden sm:inline">({conf.englishName})</span>
                  </span>
                  <span className="text-slate-600 text-[11px]">50개 (33.3%)</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Feature Column Mapping Table Guide */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Layers size={16} className="text-emerald-600" />
          <span>데이터속성(Feature & Label) 구조</span>
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <th className="p-2.5 font-bold">한국어 속성명</th>
                <th className="p-2.5 font-bold">CSV 컬럼명</th>
                <th className="p-2.5 font-bold">데이터 타입</th>
                <th className="p-2.5 font-bold">기계학습 역할</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              <tr>
                <td className="p-2.5 font-bold text-slate-900">꽃받침 길이 (cm)</td>
                <td className="p-2.5 font-mono text-slate-500">SepalLengthCm</td>
                <td className="p-2.5">수치형 (number)</td>
                <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">독립변수 (Feature X1)</span></td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-slate-900">꽃받침 너비 (cm)</td>
                <td className="p-2.5 font-mono text-slate-500">SepalWidthCm</td>
                <td className="p-2.5">수치형 (number)</td>
                <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">독립변수 (Feature X2)</span></td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-slate-900">꽃잎 길이 (cm)</td>
                <td className="p-2.5 font-mono text-slate-500">PetalLengthCm</td>
                <td className="p-2.5">수치형 (number)</td>
                <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">독립변수 (Feature X3)</span></td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-slate-900">꽃잎 너비 (cm)</td>
                <td className="p-2.5 font-mono text-slate-500">PetalWidthCm</td>
                <td className="p-2.5">수치형 (number)</td>
                <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">독립변수 (Feature X4)</span></td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-emerald-900">품종</td>
                <td className="p-2.5 font-mono text-slate-500">Species</td>
                <td className="p-2.5">범주형 (string)</td>
                <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">종속변수 (Label y)</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Filter & Data Preview Section */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h4 className="text-base font-bold text-slate-900">Iris 데이터 미리보기</h4>
            <p className="text-xs text-slate-500">전체 150개 원본 샘플 탐색</p>
          </div>

          {/* Filter Dropdown */}
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            <select
              value={selectedSpecies}
              onChange={e => {
                setSelectedSpecies(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
            >
              <option value="all">전체 품종 보기 (150개)</option>
              <option value="Iris-setosa">세토사 (Iris-setosa, 50개)</option>
              <option value="Iris-versicolor">버시컬러 (Iris-versicolor, 50개)</option>
              <option value="Iris-virginica">버지니카 (Iris-virginica, 50개)</option>
            </select>
          </div>
        </div>

        {/* Mobile View: Cards Layout (< 640px) */}
        <div className="block sm:hidden space-y-3">
          {paginatedData.map(item => {
            return (
              <div key={item.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">데이터 #{item.id}</span>
                  <SpeciesBadge species={item.species} showEnglish={true} size="xs" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-slate-500 block">꽃받침 길이</span>
                    <span className="font-bold text-slate-800">{item.sepalLength} cm</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">꽃받침 너비</span>
                    <span className="font-bold text-slate-800">{item.sepalWidth} cm</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">꽃잎 길이</span>
                    <span className="font-bold text-slate-800">{item.petalLength} cm</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">꽃잎 너비</span>
                    <span className="font-bold text-slate-800">{item.petalWidth} cm</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tablet & Desktop View: Table Layout (>= 640px) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <th className="p-3 font-bold">ID</th>
                <th className="p-3 font-bold">꽃받침 길이(cm)</th>
                <th className="p-3 font-bold">꽃받침 너비(cm)</th>
                <th className="p-3 font-bold">꽃잎 길이(cm)</th>
                <th className="p-3 font-bold">꽃잎 너비(cm)</th>
                <th className="p-3 font-bold">품종 (Species)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {paginatedData.map(item => {
                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono font-semibold text-slate-400">#{item.id}</td>
                    <td className="p-3 font-bold">{item.sepalLength} cm</td>
                    <td className="p-3 font-bold">{item.sepalWidth} cm</td>
                    <td className="p-3 font-bold">{item.petalLength} cm</td>
                    <td className="p-3 font-bold">{item.petalWidth} cm</td>
                    <td className="p-3">
                      <SpeciesBadge species={item.species} showEnglish={true} size="sm" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
          <span className="text-slate-500 font-medium">
            전체 {filteredDataset.length}개 중 {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filteredDataset.length)}개 표시
          </span>

          <div className="flex items-center gap-1">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 min-h-[44px] cursor-pointer"
            >
              이전
            </button>
            <span className="px-3 font-bold text-slate-700">{page} / {totalPages || 1}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 min-h-[44px] cursor-pointer"
            >
              다음
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs leading-relaxed flex items-start gap-2.5">
        <Info size={16} className="text-slate-500 shrink-0 mt-0.5" />
        <span>
          이 데이터셋은 150개의 정상 데이터 외에도 교육용 <strong>오류 데이터셋(20개)</strong> 및 <strong>편향 데이터셋(50개)</strong>이 프로젝트 내부에 별도로 구축되어 있어, 데이터 전처리 및 모델 평가 실험에서 안전하게 활용할 수 있습니다.
        </span>
      </div>
    </div>
  );
};
