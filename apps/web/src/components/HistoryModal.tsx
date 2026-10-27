import React from 'react';
import { X, History, AlertTriangle, Send } from 'lucide-react';
import { PostItem } from '../lib/api';

interface HistoryModalProps {
  post: PostItem;
  isOpen: boolean;
  onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ post, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#181818] border border-[#2e2e2e] rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2a2a2a] flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-neutral-400" />
            Historial de Revisiones y Auditoría
          </h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Revisions list */}
          <div>
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">
              Ediciones y Cambios de Texto ({post.revisions?.length || 0})
            </h3>
            {(!post.revisions || post.revisions.length === 0) ? (
              <p className="text-xs text-neutral-400 italic">No hay revisiones manuales registradas en este borrador.</p>
            ) : (
              <div className="space-y-3">
                {post.revisions.map((rev) => (
                  <div key={rev.id} className="bg-[#121212] border border-[#262626] rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-xs text-neutral-400">
                      <span>Autor: <strong className="text-neutral-300">{rev.changedBy || 'Usuario'}</strong></span>
                      <span>{new Date(rev.createdAt).toLocaleString()}</span>
                    </div>

                    {rev.invalidatedApproval && (
                      <div className="text-[11px] text-amber-400 bg-amber-950/30 border border-amber-600/30 rounded px-2 py-1 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Esta edición invalidó la aprobación previa del contenido.</span>
                      </div>
                    )}

                    <div className="text-xs space-y-1">
                      <div className="text-neutral-400">
                        <span className="font-semibold text-rose-400">- Anterior:</span> {rev.previousText}
                      </div>
                      <div className="text-neutral-200">
                        <span className="font-semibold text-emerald-400">+ Nuevo:</span> {rev.newText}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Publish attempts list */}
          <div>
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">
              Intentos de Publicación en Threads ({post.publishAttempts?.length || 0})
            </h3>
            {(!post.publishAttempts || post.publishAttempts.length === 0) ? (
              <p className="text-xs text-neutral-400 italic">Aún no se ha intentado publicar este contenido.</p>
            ) : (
              <div className="space-y-2">
                {post.publishAttempts.map((attempt) => (
                  <div key={attempt.id} className="bg-[#121212] border border-[#262626] rounded-xl p-3 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Send className="w-3.5 h-3.5 text-blue-400" />
                        <span className="font-semibold text-neutral-200">Estado: {attempt.status}</span>
                      </div>
                      {attempt.externalPostId && (
                        <div className="text-neutral-400 font-mono text-[11px]">
                          Threads ID: {attempt.externalPostId}
                        </div>
                      )}
                      {attempt.errorMessage && (
                        <div className="text-rose-400 text-[11px]">Error: {attempt.errorMessage}</div>
                      )}
                    </div>
                    <span className="text-neutral-400 text-[11px]">{new Date(attempt.createdAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#2a2a2a] flex justify-end">
          <button
            onClick={onClose}
            className="text-xs px-4 py-2 border border-[#333333] hover:bg-[#222222] text-neutral-300 rounded-xl font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
