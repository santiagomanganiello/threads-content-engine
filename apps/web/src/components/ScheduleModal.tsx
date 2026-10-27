import React, { useState } from 'react';
import { X, Calendar } from 'lucide-react';

interface ScheduleModalProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (postId: string, isoDate: string) => Promise<void>;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  postId,
  isOpen,
  onClose,
  onConfirm,
}) => {
  // Default to tomorrow at 14:00
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 1);
  defaultDate.setHours(14, 0, 0, 0);

  const localDatetime = new Date(defaultDate.getTime() - defaultDate.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  const [dateTime, setDateTime] = useState(localDatetime);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const isoDate = new Date(dateTime).toISOString();
      await onConfirm(postId, isoDate);
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
            <Calendar className="w-4 h-4 text-sky-400" />
            Programar Publicación en Threads
          </h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-neutral-400">
            Elegí la fecha y hora en la que querés que el worker publique este contenido en Threads:
          </p>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5 uppercase">
              Fecha y Hora
            </label>
            <input
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="w-full bg-[#121212] border border-[#2a2a2a] focus:border-sky-400 focus:outline-none rounded-xl p-3 text-sm text-neutral-100"
              required
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
              disabled={isSubmitting}
              className="text-xs px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-semibold rounded-xl transition"
            >
              {isSubmitting ? 'Programando...' : 'Confirmar programación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
