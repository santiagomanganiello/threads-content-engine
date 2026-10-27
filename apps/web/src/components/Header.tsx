import React from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';

interface HeaderProps {
  onGenerateDaily: () => void;
  onOpenManualModal: () => void;
  isGenerating: boolean;
  todayBatchCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onGenerateDaily,
  onOpenManualModal,
  isGenerating,
  todayBatchCount,
}) => {
  return (
    <header className="border-b border-[#262626] bg-[#141414] sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black font-extrabold text-xl shadow">
            @
          </div>
          <div>
            <h1 className="font-bold text-lg text-white leading-tight flex items-center gap-2">
              Threads Content Engine
              <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                MVP
              </span>
            </h1>
            <p className="text-xs text-neutral-400">
              Generación asistida, revisión editorial y publicación controlada
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-400 bg-[#1c1c1c] px-3 py-1.5 rounded-lg border border-[#2a2a2a]">
            <span>Lote de hoy:</span>
            <span
              className={`font-semibold ${
                todayBatchCount >= 4 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {todayBatchCount}/4 borradores
            </span>
          </div>

          <button
            onClick={onOpenManualModal}
            className="text-xs px-3 py-2 bg-[#222222] hover:bg-[#2c2c2c] text-neutral-200 border border-[#333333] rounded-lg transition flex items-center gap-1.5 font-medium"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Generar manual</span>
          </button>

          <button
            onClick={onGenerateDaily}
            disabled={isGenerating}
            className="text-xs px-4 py-2 bg-white text-black hover:bg-neutral-200 disabled:opacity-50 font-semibold rounded-lg transition flex items-center gap-2 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Generando...' : 'Generar lote diario (4)'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
