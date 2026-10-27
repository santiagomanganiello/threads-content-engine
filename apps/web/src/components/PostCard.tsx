import React from 'react';
import {
  Check,
  X,
  Edit3,
  Send,
  Calendar,
  AlertCircle,
  History,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import { PostItem } from '../lib/api';

interface PostCardProps {
  post: PostItem;
  onEdit: (post: PostItem) => void;
  onApprove: (post: PostItem) => void;
  onReject: (post: PostItem) => void;
  onSchedule: (post: PostItem) => void;
  onPublish: (post: PostItem) => void;
  onViewHistory: (post: PostItem) => void;
  isActionLoading?: boolean;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  BASS_HISTORY: { label: 'Bajos que cambiaron el mundo', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  COMMUNITY: { label: 'Bajista, si tuvieras que…', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  EDUCATION: { label: 'La cocina del bajo', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  CULTURE: { label: 'Cultura del bajo', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  HUMOR: { label: 'Humor bajístico', color: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
  GROWTH: { label: 'Imán de seguidores (Growth)', color: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30' },
};

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  IDEA: { label: 'Idea', color: 'bg-neutral-800 text-neutral-400 border-neutral-700' },
  GENERATING: { label: 'Generando...', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  PENDING_REVIEW: { label: 'Para revisión', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  APPROVED: { label: 'Aprobado', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  SCHEDULED: { label: 'Programado', color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
  PUBLISHING: { label: 'Publicando...', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  PUBLISHED: { label: 'Publicado', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  REJECTED: { label: 'Rechazado', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  FAILED: { label: 'Fallido', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
};

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onEdit,
  onApprove,
  onReject,
  onSchedule,
  onPublish,
  onViewHistory,
  isActionLoading,
}) => {
  const categoryMeta = CATEGORY_LABELS[post.category] || {
    label: post.category,
    color: 'bg-neutral-800 text-neutral-300 border-neutral-700',
  };

  const statusMeta = STATUS_BADGES[post.status] || {
    label: post.status,
    color: 'bg-neutral-800 text-neutral-300 border-neutral-700',
  };

  const charCount = post.text.length;
  const isOverLimit = charCount > 500;
  const isApproved = post.status === 'APPROVED';
  const isScheduled = post.status === 'SCHEDULED';
  const isPublished = post.status === 'PUBLISHED';

  return (
    <div className="bg-[#161616] border border-[#262626] hover:border-[#383838] transition rounded-2xl p-5 flex flex-col justify-between shadow-sm">
      <div>
        {/* Top bar: Category + Status */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${categoryMeta.color}`}>
            {categoryMeta.label}
          </span>
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${statusMeta.color}`}>
            {statusMeta.label}
          </span>
        </div>

        {/* Hook */}
        {post.hook && (
          <div className="text-xs font-semibold text-neutral-400 mb-2 uppercase tracking-wider">
            Gancho: <span className="text-neutral-200 normal-case">{post.hook}</span>
          </div>
        )}

        {/* Post Text */}
        <p className="text-neutral-100 text-[15px] leading-relaxed whitespace-pre-line mb-3 font-normal">
          {post.text}
        </p>

        {/* Question (engagement) */}
        {post.question && (
          <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg p-2.5 text-xs text-neutral-300 mb-3 flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-sky-400">Pregunta de cierre:</span> {post.question}
            </div>
          </div>
        )}

        {/* Fact check warning */}
        {post.needsFactCheck && (
          <div className="bg-amber-950/30 border border-amber-600/30 rounded-lg p-2.5 text-xs text-amber-200 mb-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Requiere verificación de datos:</span>
              <ul className="list-disc list-inside mt-1 text-[11px] text-amber-300/80 space-y-0.5">
                {(post.factualClaims || []).map((claim, idx) => (
                  <li key={idx}>{claim}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Rejection notice */}
        {post.status === 'REJECTED' && post.rejectionReason && (
          <div className="bg-rose-950/30 border border-rose-600/30 rounded-lg p-2.5 text-xs text-rose-200 mb-3">
            <span className="font-semibold">Motivo del rechazo:</span> {post.rejectionReason}
          </div>
        )}

        {/* Published External ID badge */}
        {isPublished && post.externalPostId && (
          <div className="flex items-center gap-1.5 text-xs text-blue-400 mb-3 font-mono bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20 w-fit">
            <span>Threads ID: {post.externalPostId}</span>
            <ExternalLink className="w-3 h-3" />
          </div>
        )}

        {/* Scheduled Info */}
        {isScheduled && post.scheduledAt && (
          <div className="flex items-center gap-1.5 text-xs text-sky-400 mb-3 bg-sky-500/10 px-2.5 py-1 rounded-md border border-sky-500/20 w-fit">
            <Calendar className="w-3.5 h-3.5" />
            <span>Programado para: {new Date(post.scheduledAt).toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Footer bar: Character count + actions */}
      <div className="pt-4 border-t border-[#242424] mt-2">
        <div className="flex items-center justify-between mb-3 text-xs text-neutral-400">
          <span className={`font-mono ${isOverLimit ? 'text-red-400 font-bold' : 'text-neutral-400'}`}>
            {charCount}/500 caracteres
          </span>

          <div className="flex items-center gap-3">
            {post.revisions && post.revisions.length > 0 && (
              <button
                onClick={() => onViewHistory(post)}
                className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-neutral-200 hover:underline"
              >
                <History className="w-3 h-3" />
                <span>{post.revisions.length} revisiones</span>
              </button>
            )}

            <button
              onClick={() => onEdit(post)}
              className="flex items-center gap-1 text-xs text-neutral-300 hover:text-white font-medium bg-[#222222] hover:bg-[#2c2c2c] px-2.5 py-1 rounded-md border border-[#333333] transition"
            >
              <Edit3 className="w-3 h-3" />
              <span>Editar</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 flex-wrap">
          {!isPublished && (
            <>
              {/* Reject button */}
              {post.status !== 'REJECTED' && (
                <button
                  onClick={() => onReject(post)}
                  disabled={isActionLoading}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition font-medium flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Rechazar</span>
                </button>
              )}

              {/* Approve button */}
              {!isApproved && (
                <button
                  onClick={() => onApprove(post)}
                  disabled={isActionLoading}
                  className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition flex items-center gap-1.5 shadow"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Aprobar</span>
                </button>
              )}

              {/* Schedule button (only when approved or already scheduled) */}
              {(isApproved || isScheduled) && (
                <button
                  onClick={() => onSchedule(post)}
                  disabled={isActionLoading}
                  className="text-xs px-3 py-1.5 rounded-lg border border-sky-500/30 text-sky-300 hover:bg-sky-500/10 font-medium transition flex items-center gap-1"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Programar</span>
                </button>
              )}

              {/* Publish button (only allowed when approved or scheduled) */}
              {(isApproved || isScheduled) && (
                <button
                  onClick={() => onPublish(post)}
                  disabled={isActionLoading}
                  className="text-xs px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition flex items-center gap-1.5 shadow"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publicar en Threads</span>
                </button>
              )}
            </>
          )}

          {isPublished && (
            <div className="text-xs text-neutral-400 italic">
              Publicado el {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ''}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
