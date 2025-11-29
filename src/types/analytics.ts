export interface SearchMetrics {
  totalQueries: number;
  avgResponseTime: number;
  topQueries: Array<{
    query: string;
    count: number;
    avgRelevance: number;
  }>;
  queryTypes: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
}

export interface DocumentMetrics {
  totalDocuments: number;
  processingStatus: {
    processed: number;
    processing: number;
    failed: number;
  };
  documentTypes: Array<{
    type: string;
    count: number;
    size: number;
  }>;
  recentUploads: Array<{
    name: string;
    uploadedAt: string;
    size: number;
    status: 'processed' | 'processing' | 'failed';
  }>;
}

export interface PerformanceMetrics {
  systemHealth: {
    cpu: number;
    memory: number;
    storage: number;
  };
  responseMetrics: {
    p50: number;
    p95: number;
    p99: number;
  };
  errorRates: {
    searchErrors: number;
    processingErrors: number;
    systemErrors: number;
  };
  throughput: {
    queriesPerHour: number;
    documentsPerHour: number;
  };
}

export interface UserMetrics {
  activeUsers: number;
  totalSessions: number;
  avgSessionDuration: number;
  userActivity: Array<{
    hour: string;
    users: number;
    queries: number;
  }>;
  topUsers: Array<{
    userId: string;
    queries: number;
    documents: number;
  }>;
}

export interface AnalyticsDashboardData {
  searchMetrics: SearchMetrics;
  documentMetrics: DocumentMetrics;
  performanceMetrics: PerformanceMetrics;
  userMetrics: UserMetrics;
  lastUpdated: string;
}

export type MetricType = 'search' | 'documents' | 'performance' | 'users';

export interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    trend: 'up' | 'down' | 'stable';
  };
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color?: string;
}
