import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { PostCategory } from '@threads-engine/contracts';

interface ManualGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (data: { category: PostCategory; customPrompt?: string }) => Promise<void>;
}

export const ManualGenerateModal: React.FC<ManualGenerateModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
}) => {
  const [category, setCategory] = useState<PostCategory>('BASS_HISTORY');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsGenerating(true);
      await onGenerate({ category, customPrompt: customPrompt || undefined });
      onClose();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#181818] border border-[#2e2e2e] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-[#2a2a2a] flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            Generación Manual con IA
          </h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5 uppercase">
              Categoría Editorial
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as PostCategory)}
              className="w-full bg-[#121212] border border-[#2a2a2a] focus:border-purple-400 focus:outline-none rounded-xl p-3 text-sm text-neutral-100"
            >
              <option value="BASS_HISTORY">Bajos que cambiaron el mundo (Historia)</option>
              <option value="COMMUNITY">Bajista, si tuvieras que… (Comunidad & Debate)</option>
              <option value="EDUCATION">La cocina del bajo (Técnica & Tips)</option>
              <option value="GROWTH">Imán de seguidores (Crecimiento & Viralidad)</option>
              <option value="CULTURE">Cultura musical</option>
              <option value="HUMOR">Humor bajístico</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5 uppercase">
              Instrucción o Tema específico (opcional)
            </label>
            <textarea
              rows={3}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="w-full bg-[#121212] border border-[#2a2a2a] focus:border-purple-400 focus:outline-none rounded-xl p-3 text-sm text-neutral-100"
              placeholder="Ej: Hablar sobre el sonido de Jaco Pastorius sin trastes..."
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="text-xs px-3.5 py-2 border border-[#333333] hover:bg-[#222222] text-neutral-300 rounded-xl font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isGenerating}
              className="text-xs px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold rounded-xl transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGenerating ? 'Generando...' : 'Generar borrador'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
