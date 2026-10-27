import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, PostItem } from './lib/api';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { PostCard } from './components/PostCard';
import { PostEditorModal } from './components/PostEditorModal';
import { RejectModal } from './components/RejectModal';
import { ScheduleModal } from './components/ScheduleModal';
import { HistoryModal } from './components/HistoryModal';
import { ManualGenerateModal } from './components/ManualGenerateModal';
import { PostCategory, PostStatus } from '@threads-engine/contracts';
import { Filter, Search, Inbox } from 'lucide-react';

export const App: React.FC = () => {
  const queryClient = useQueryClient();

  // Filters state
  const [statusFilter, setStatusFilter] = useState<PostStatus | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState<PostCategory | undefined>(undefined);
  const [search, setSearch] = useState('');

  // Modals state
  const [editingPost, setEditingPost] = useState<PostItem | null>(null);
  const [rejectingPostId, setRejectingPostId] = useState<string | null>(null);
  const [schedulingPostId, setSchedulingPostId] = useState<string | null>(null);
  const [historyPost, setHistoryPost] = useState<PostItem | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // Queries
  const { data: summary } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: api.getSummary,
    refetchInterval: 10000,
  });

  const {
    data: postsData,
    isLoading: isLoadingPosts,
  } = useQuery({
    queryKey: ['posts', statusFilter, categoryFilter, search],
    queryFn: () =>
      api.getPosts({
        status: statusFilter,
        category: categoryFilter,
        search: search || undefined,
      }),
  });

  // Mutations
  const generateDailyMutation = useMutation({
    mutationFn: api.generateDailyBatch,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      if (!res.isNew) {
        alert('El lote diario de hoy ya estaba generado. Se muestran los 3 borradores existentes.');
      }
    },
  });

  const generateManualMutation = useMutation({
    mutationFn: api.generateManual,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  const updatePostMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updatePost(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  const approvePostMutation = useMutation({
    mutationFn: (id: string) => api.approvePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  const rejectPostMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => api.rejectPost(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  const schedulePostMutation = useMutation({
    mutationFn: ({ id, isoDate }: { id: string; isoDate: string }) => api.schedulePost(id, isoDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  const publishPostMutation = useMutation({
    mutationFn: (id: string) => api.publishPost(id),
    onSuccess: (post) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      alert(`¡Publicado con éxito en Threads! ID externo: ${post.externalPostId}`);
    },
    onError: (err) => {
      alert(`Error al publicar: ${err.message}`);
    },
  });

  const stats = summary?.stats || {
    total: 0,
    pendingReview: 0,
    approved: 0,
    scheduled: 0,
    published: 0,
    rejected: 0,
    failed: 0,
  };

  const todayBatchCount = summary?.todayBatch?.generatedCount || 0;

  return (
    <div className="min-h-screen bg-[#101010] text-[#f3f5f7]">
      <Header
        onGenerateDaily={() => generateDailyMutation.mutate()}
        onOpenManualModal={() => setIsManualModalOpen(true)}
        isGenerating={generateDailyMutation.isPending}
        todayBatchCount={todayBatchCount}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Stats Bar */}
        <StatsBar
          stats={stats}
          activeFilter={statusFilter}
          onFilterChange={(st) => setStatusFilter(st)}
        />

        {/* Filter & Search Bar */}
        <div className="bg-[#161616] border border-[#262626] rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-neutral-400 shrink-0" />
            <select
              value={categoryFilter || ''}
              onChange={(e) => setCategoryFilter((e.target.value as PostCategory) || undefined)}
              className="bg-[#121212] border border-[#2e2e2e] rounded-xl px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-neutral-400"
            >
              <option value="">Todas las categorías</option>
              <option value="BASS_HISTORY">Bajos que cambiaron el mundo</option>
              <option value="COMMUNITY">Bajista, si tuvieras que…</option>
              <option value="EDUCATION">La cocina del bajo</option>
              <option value="GROWTH">Imán de seguidores (Growth)</option>
              <option value="CULTURE">Cultura</option>
              <option value="HUMOR">Humor</option>
            </select>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar en ganchos o texto..."
              className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl pl-9 pr-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-neutral-400"
            />
          </div>
        </div>

        {/* Post Grid */}
        {isLoadingPosts ? (
          <div className="text-center py-20 text-neutral-500 text-sm animate-pulse">
            Cargando bandeja de publicaciones...
          </div>
        ) : !postsData?.posts || postsData.posts.length === 0 ? (
          <div className="text-center py-24 bg-[#141414] border border-[#222222] rounded-3xl p-8">
            <Inbox className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-neutral-300">No hay publicaciones con estos filtros</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
              Hacé clic en <strong>"Generar lote diario (4)"</strong> para producir los borradores del día asistidos por IA.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {postsData.posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onEdit={(p) => setEditingPost(p)}
                onApprove={(p) => approvePostMutation.mutate(p.id)}
                onReject={(p) => setRejectingPostId(p.id)}
                onSchedule={(p) => setSchedulingPostId(p.id)}
                onPublish={(p) => {
                  if (confirm('¿Confirmás la publicación inmediata de este contenido en Threads?')) {
                    publishPostMutation.mutate(p.id);
                  }
                }}
                onViewHistory={(p) => setHistoryPost(p)}
                isActionLoading={
                  approvePostMutation.isPending ||
                  publishPostMutation.isPending ||
                  schedulePostMutation.isPending
                }
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      {editingPost && (
        <PostEditorModal
          post={editingPost}
          isOpen={true}
          onClose={() => setEditingPost(null)}
          onSave={async (id, data) => {
            await updatePostMutation.mutateAsync({ id, data });
          }}
        />
      )}

      {rejectingPostId && (
        <RejectModal
          postId={rejectingPostId}
          isOpen={true}
          onClose={() => setRejectingPostId(null)}
          onConfirm={async (id, reason) => {
            await rejectPostMutation.mutateAsync({ id, reason });
          }}
        />
      )}

      {schedulingPostId && (
        <ScheduleModal
          postId={schedulingPostId}
          isOpen={true}
          onClose={() => setSchedulingPostId(null)}
          onConfirm={async (id, isoDate) => {
            await schedulePostMutation.mutateAsync({ id, isoDate });
          }}
        />
      )}

      {historyPost && (
        <HistoryModal
          post={historyPost}
          isOpen={true}
          onClose={() => setHistoryPost(null)}
        />
      )}

      {isManualModalOpen && (
        <ManualGenerateModal
          isOpen={true}
          onClose={() => setIsManualModalOpen(false)}
          onGenerate={async (data) => {
            await generateManualMutation.mutateAsync(data);
          }}
        />
      )}
    </div>
  );
};
