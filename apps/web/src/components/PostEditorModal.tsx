import React, { useState } from 'react';
import { X, AlertTriangle, Save } from 'lucide-react';
import { PostItem } from '../lib/api';

interface PostEditorModalProps {
  post: PostItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: { text: string; hook?: string; question?: string }) => Promise<void>;
}

export const PostEditorModal: React.FC<PostEditorModalProps> = ({
  post,
  isOpen,
  onClose,
  onSave,
}) => {
  const [text, setText] = useState(post.text);
  const [hook, setHook] = useState(post.hook || '');
  const [question, setQuestion] = useState(post.question || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const charCount = text.length;
  const isOverLimit = charCount > 500;
  const wasApproved = post.status === 'APPROVED';
  const hasTextModified = text !== post.text;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOverLimit) {
      setError('El texto no puede superar los 500 caracteres.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await onSave(post.id, { text, hook, question });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#181818] border border-[#2e2e2e] rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#2a2a2a] flex items-center justify-between">
          <h2 className="text-base font-bold text-white">Editar Borrador de Threads</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-200">
              {error}
            </div>
          )}

          {/* Warning: Invalidation of approval */}
          {wasApproved && hasTextModified && (
            <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl text-xs text-amber-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Atención:</strong> Este post ya estaba APROBADO. Si modificás el texto, la
                aprobación se invalidará automáticamente y volverá al estado <em>Para revisión</em>.
              </span>
            </div>
          )}

          {/* Hook */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5 uppercase">
              Gancho / Apertura
            </label>
            <input
              type="text"
              value={hook}
              onChange={(e) => setHook(e.target.value)}
              className="w-full bg-[#121212] border border-[#2a2a2a] focus:border-neutral-400 focus:outline-none rounded-xl px-3.5 py-2 text-sm text-neutral-100"
              placeholder="Ej: El bajo que cambió la historia del rock..."
            />
          </div>

          {/* Main Text */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-neutral-300 uppercase">
                Texto de la publicación (Threads)
              </label>
              <span
                className={`text-xs font-mono font-medium ${
                  isOverLimit ? 'text-rose-400 font-bold' : 'text-neutral-400'
                }`}
              >
                {charCount}/500
              </span>
            </div>
            <textarea
              rows={6}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className={`w-full bg-[#121212] border focus:outline-none rounded-xl p-3.5 text-sm text-neutral-100 font-normal leading-relaxed ${
                isOverLimit ? 'border-rose-500 focus:border-rose-400' : 'border-[#2a2a2a] focus:border-neutral-400'
              }`}
              placeholder="Escribí el contenido..."
              required
            />
          </div>

          {/* Question / Call to Action */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5 uppercase">
              Pregunta de cierre para debate (opcional)
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full bg-[#121212] border border-[#2a2a2a] focus:border-neutral-400 focus:outline-none rounded-xl px-3.5 py-2 text-sm text-neutral-100"
              placeholder="Ej: ¿Vos qué opinás? Dejá tu comentario abajo."
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-[#2a2a2a] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="text-xs px-4 py-2 border border-[#333333] hover:bg-[#222222] text-neutral-300 rounded-xl transition font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || isOverLimit}
              className="text-xs px-5 py-2 bg-white text-black hover:bg-neutral-200 disabled:opacity-50 font-bold rounded-xl transition flex items-center gap-1.5 shadow"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Guardando...' : 'Guardar cambios'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
