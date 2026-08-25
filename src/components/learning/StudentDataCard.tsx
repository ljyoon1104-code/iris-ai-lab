import React from 'react';
import type { ErrorIrisRecord, IrisRecord } from '../../types/iris';

interface StudentDataCardProps {
  record: ErrorIrisRecord | IrisRecord;
  title?: string;
}

interface FieldDisplay {
  label: string;
  valueText: string;
  note?: string;
  isMissing?: boolean;
  isStringData?: boolean;
  isInconsistent?: boolean;
}

export function formatIrisFieldForStudent(
  field: keyof Omit<IrisRecord, 'id'>,
  val: any
): FieldDisplay {
  const fieldLabels: Record<string, string> = {
    sepalLength: '꽃받침 길이',
    sepalWidth: '꽃받침 너비',
    petalLength: '꽃잎 길이',
    petalWidth: '꽃잎 너비',
    species: '품종',
  };

  const label = fieldLabels[field] || field;

  // 1. Missing Value (null / undefined / empty string)
  if (val === null || val === undefined || val === '') {
    return {
      label,
      valueText: '값 없음',
      isMissing: true,
    };
  }

  // 2. Species Field
  if (field === 'species') {
    if (val === 'Iris-setosa') return { label, valueText: '세토사' };
    if (val === 'Iris-versicolor') return { label, valueText: '버시컬러' };
    if (val === 'Iris-virginica') return { label, valueText: '버지니카' };
    // Inconsistent representation (e.g. setosa, Setosa, versicolor, virginica)
    return {
      label,
      valueText: `"${val}"`,
      note: '※ 표준 표기와 다름',
      isInconsistent: true,
    };
  }

  // 3. Invalid Type Error (e.g. "5.1cm" string instead of number 5.1)
  if (typeof val === 'string') {
    return {
      label,
      valueText: `"${val}"`,
      note: '※ 숫자가 아닌 문자로 저장됨',
      isStringData: true,
    };
  }

  // 4. Normal or Outlier Number
  if (typeof val === 'number') {
    return {
      label,
      valueText: `${val} cm`,
    };
  }

  return {
    label,
    valueText: String(val),
  };
}

export const StudentDataCard: React.FC<StudentDataCardProps> = ({ record, title }) => {
  const fields: (keyof Omit<IrisRecord, 'id'>)[] = [
    'sepalLength',
    'sepalWidth',
    'petalLength',
    'petalWidth',
    'species',
  ];

  return (
    <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2 text-xs">
      {title && (
        <div className="font-extrabold text-slate-900 pb-1.5 border-b border-slate-100 flex justify-between items-center">
          <span>{title}</span>
          <span className="text-[10px] text-slate-500 font-mono">ID: #{record.id}</span>
        </div>
      )}

      <div className="space-y-1.5 pt-0.5">
        {fields.map(field => {
          const formatted = formatIrisFieldForStudent(field, (record as any)[field]);

          return (
            <div
              key={field}
              className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 font-medium"
            >
              <span className="text-slate-600 font-bold">{formatted.label}</span>

              <div className="text-right">
                <span
                  className={`font-bold ${
                    formatted.isMissing
                      ? 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200'
                      : formatted.isStringData
                      ? 'text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-mono'
                      : formatted.isInconsistent
                      ? 'text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200'
                      : 'text-slate-900 font-mono'
                  }`}
                >
                  {formatted.valueText}
                </span>

                {formatted.note && (
                  <span className="block text-[10px] text-slate-500 pt-0.5 font-sans">
                    {formatted.note}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
