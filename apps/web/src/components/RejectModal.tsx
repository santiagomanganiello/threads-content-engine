import React, { useState } from 'react';
import { X, AlertOctagon } from 'lucide-react';

interface RejectModalProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (postId: string, reason: string) => Promise<void>;
}

export const RejectModal: React.FC<RejectModalProps> = ({
  postId,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    try {
      setIsSubmitting(true);
      await onConfirm(postId, reason);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#181818] border border-[#2e2e2e] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-[#2a2a2a] flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-500" />
            Rechazar Borrador
          </h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-neutral-400">
            Ingresá el motivo editorial del rechazo para mantener la trazabilidad del contenido:
          </p>

          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-[#121212] border border-[#2a2a2a] focus:border-rose-400 focus:outline-none rounded-xl p-3 text-sm text-neutral-100"
            placeholder="Ej: Afirmación histórica inexacta o tono poco natural..."
            required
          />

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
              disabled={isSubmitting || !reason.trim()}
              className="text-xs px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold rounded-xl transition"
            >
              {isSubmitting ? 'Rechazando...' : 'Confirmar rechazo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
