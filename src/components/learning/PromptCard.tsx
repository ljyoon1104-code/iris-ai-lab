import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface PromptCardProps {
  promptText: string;
  title?: string;
}

export const PromptCard: React.FC<PromptCardProps> = ({ promptText, title = '추천 AI 프롬프트' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Clipboard copy failed:', e);
    }
  };

  return (
    <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 sm:p-5 shadow-md relative overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 border-b border-slate-800 pb-2.5">
        <span className="text-xs font-bold text-emerald-400 tracking-wide uppercase flex items-center gap-1.5 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{title}</span>
        </span>
        <button
          onClick={handleCopy}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[40px] shrink-0 ${
            copied
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
          }`}
          aria-label="프롬프트 복사"
        >
          {copied ? (
            <>
              <Check size={14} />
              <span>복사 완료!</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>프롬프트 복사</span>
            </>
          )}
        </button>
      </div>

      <p className="text-xs sm:text-sm font-mono leading-relaxed text-slate-200 whitespace-pre-wrap break-words [word-break:break-all]">
        "{promptText}"
      </p>

      {copied && (
        <div className="mt-3 p-2.5 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 flex items-center justify-between animate-fadeIn break-words [word-break:keep-all]">
          <span>✓ 프롬프트를 클립보드에 복사했습니다. 원하는 AI 서비스(ChatGPT 등)에 붙여넣어 활용하세요!</span>
        </div>
      )}
    </div>
  );
};
