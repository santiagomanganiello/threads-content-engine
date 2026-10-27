export interface ThreadsPublishResult {
  containerId: string;
  externalPostId: string;
  status: 'PUBLISHED' | 'FAILED' | 'UNKNOWN';
  errorCode?: string;
  errorMessage?: string;
}

export interface ThreadsPublisher {
  createMediaContainer(text: string, idempotencyKey: string): Promise<{ containerId: string }>;
  publishMediaContainer(containerId: string): Promise<{ externalPostId: string }>;
  checkPublishStatus(containerId: string): Promise<{ status: string; externalPostId?: string }>;
}
