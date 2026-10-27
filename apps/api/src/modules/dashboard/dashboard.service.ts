import { prisma } from '../../infrastructure/database.js';

export class DashboardService {
  async getSummary() {
    const [
      total,
      pendingReview,
      approved,
      scheduled,
      published,
      rejected,
      failed,
      recentPosts,
    ] = await Promise.all([
      prisma.contentPost.count(),
      prisma.contentPost.count({ where: { status: 'PENDING_REVIEW' } }),
      prisma.contentPost.count({ where: { status: 'APPROVED' } }),
      prisma.contentPost.count({ where: { status: 'SCHEDULED' } }),
      prisma.contentPost.count({ where: { status: 'PUBLISHED' } }),
      prisma.contentPost.count({ where: { status: 'REJECTED' } }),
      prisma.contentPost.count({ where: { status: 'FAILED' } }),
      prisma.contentPost.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          generations: { take: 1, orderBy: { createdAt: 'desc' } },
        },
      }),
    ]);

    const todayStr = new Date().toISOString().split('T')[0];
    const todayBatchId = `daily-generation:${todayStr}`;
    const todayBatchCount = await prisma.contentPost.count({
      where: { generationBatchId: todayBatchId },
    });

    return {
      stats: {
        total,
        pendingReview,
        approved,
        scheduled,
        published,
        rejected,
        failed,
      },
      todayBatch: {
        batchId: todayBatchId,
        generatedCount: todayBatchCount,
        isCompleted: todayBatchCount >= 3,
      },
      recentPosts,
    };
  }
}

export const dashboardService = new DashboardService();
