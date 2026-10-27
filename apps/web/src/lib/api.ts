import {
  ListPostsQuery,
  UpdatePostInput,
  ManualGenerationInput,
  PostCategory,
  PostStatus,
} from '@threads-engine/contracts';

export interface PostItem {
  id: string;
  category: PostCategory;
  text: string;
  hook: string | null;
  question: string | null;
  status: PostStatus;
  needsFactCheck: boolean;
  factualClaims: string[] | null;
  scheduledAt: string | null;
  publishedAt: string | null;
  externalPostId: string | null;
  generationBatchId: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  generations?: Array<{
    id: string;
    model: string;
    promptVersion: string;
    createdAt: string;
  }>;
  publishAttempts?: Array<{
    id: string;
    status: string;
    containerId: string | null;
    externalPostId: string | null;
    errorMessage: string | null;
    createdAt: string;
  }>;
  revisions?: Array<{
    id: string;
    previousText: string;
    newText: string;
    changedBy: string | null;
    invalidatedApproval: boolean;
    createdAt: string;
  }>;
}

export interface DashboardSummaryResponse {
  stats: {
    total: number;
    pendingReview: number;
    approved: number;
    scheduled: number;
    published: number;
    rejected: number;
    failed: number;
  };
  todayBatch: {
    batchId: string;
    generatedCount: number;
    isCompleted: boolean;
  };
  recentPosts: PostItem[];
}

export interface ListPostsResponse {
  posts: PostItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const api = {
  async getSummary(): Promise<DashboardSummaryResponse> {
    const res = await fetch('/api/dashboard/summary');
    if (!res.ok) throw new Error('Error al cargar el resumen del dashboard');
    return res.json();
  },

  async getPosts(query?: Partial<ListPostsQuery>): Promise<ListPostsResponse> {
    const params = new URLSearchParams();
    if (query?.status) params.set('status', query.status);
    if (query?.category) params.set('category', query.category);
    if (query?.search) params.set('search', query.search);
    if (query?.page) params.set('page', String(query.page));
    if (query?.limit) params.set('limit', String(query.limit));

    const res = await fetch(`/api/posts?${params.toString()}`);
    if (!res.ok) throw new Error('Error al consultar publicaciones');
    return res.json();
  },

  async updatePost(id: string, input: UpdatePostInput): Promise<PostItem> {
    const res = await fetch(`/api/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error al actualizar borrador');
    }
    return res.json();
  },

  async approvePost(id: string, notes?: string): Promise<PostItem> {
    const res = await fetch(`/api/posts/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error al aprobar borrador');
    }
    return res.json();
  },

  async rejectPost(id: string, reason: string): Promise<PostItem> {
    const res = await fetch(`/api/posts/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error al rechazar borrador');
    }
    return res.json();
  },

  async schedulePost(id: string, scheduledAt: string): Promise<PostItem> {
    const res = await fetch(`/api/posts/${id}/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheduledAt }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error al programar borrador');
    }
    return res.json();
  },

  async publishPost(id: string): Promise<PostItem> {
    const res = await fetch(`/api/posts/${id}/publish`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error al publicar en Threads');
    }
    return res.json();
  },

  async generateDailyBatch(): Promise<{ batchId: string; posts: PostItem[]; isNew: boolean }> {
    const res = await fetch('/api/generations/daily', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error al generar lote diario');
    }
    return res.json();
  },

  async generateManual(input: ManualGenerationInput): Promise<PostItem> {
    const res = await fetch('/api/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error al generar borrador');
    }
    return res.json();
  },
};
