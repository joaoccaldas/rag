import type { 
  AnalyticsDashboardData 
} from '../types/analytics';

export const formatMetricValue = (value: number, type: 'number' | 'percentage' | 'duration' | 'bytes'): string => {
  switch (type) {
    case 'number':
      return value.toLocaleString();
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'duration':
      if (value < 1000) return `${value}ms`;
      if (value < 60000) return `${(value / 1000).toFixed(1)}s`;
      return `${(value / 60000).toFixed(1)}m`;
    case 'bytes':
      const units = ['B', 'KB', 'MB', 'GB'];
      let size = value;
      let unitIndex = 0;
      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
      }
      return `${size.toFixed(1)} ${units[unitIndex]}`;
    default:
      return value.toString();
  }
};

export const calculateTrend = (current: number, previous: number): { value: number; trend: 'up' | 'down' | 'stable' } => {
  if (previous === 0) return { value: 0, trend: 'stable' };
  
  const change = ((current - previous) / previous) * 100;
  
  if (Math.abs(change) < 0.1) return { value: 0, trend: 'stable' };
  
  return {
    value: Math.abs(change),
    trend: change > 0 ? 'up' : 'down'
  };
};

export const getHealthStatus = (value: number, thresholds: { warning: number; critical: number }): 'healthy' | 'warning' | 'critical' => {
  if (value >= thresholds.critical) return 'critical';
  if (value >= thresholds.warning) return 'warning';
  return 'healthy';
};

export const generateTimeSeriesData = (
  data: number[], 
  labels: string[], 
  options?: { fillGaps?: boolean; smoothing?: boolean }
): Array<{ time: string; value: number }> => {
  const result = data.map((value, index) => ({
    time: labels[index] || `Point ${index + 1}`,
    value: options?.smoothing ? applySmoothing(data, index) : value
  }));

  if (options?.fillGaps) {
    return fillMissingDataPoints(result);
  }

  return result;
};

const applySmoothing = (data: number[], index: number, window = 3): number => {
  const start = Math.max(0, index - Math.floor(window / 2));
  const end = Math.min(data.length - 1, index + Math.floor(window / 2));
  const subset = data.slice(start, end + 1);
  return subset.reduce((sum, val) => sum + val, 0) / subset.length;
};

const fillMissingDataPoints = (data: Array<{ time: string; value: number }>): Array<{ time: string; value: number }> => {
  // Simple linear interpolation for missing points
  return data.map((point, index) => {
    if (point.value === null || point.value === undefined) {
      const prevIndex = data.findLastIndex((p, i) => i < index && p.value !== null);
      const nextIndex = data.findIndex((p, i) => i > index && p.value !== null);
      
      if (prevIndex !== -1 && nextIndex !== -1) {
        const prevValue = data[prevIndex].value;
        const nextValue = data[nextIndex].value;
        const ratio = (index - prevIndex) / (nextIndex - prevIndex);
        return { ...point, value: prevValue + (nextValue - prevValue) * ratio };
      }
    }
    return point;
  });
};

export const aggregateMetricsByTimeframe = (
  data: Array<{ timestamp: string; value: number }>,
  timeframe: 'hour' | 'day' | 'week' | 'month'
): Array<{ period: string; value: number; count: number }> => {
  const groups = new Map<string, { total: number; count: number }>();
  
  data.forEach(({ timestamp, value }) => {
    const date = new Date(timestamp);
    let key: string;
    
    switch (timeframe) {
      case 'hour':
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
        break;
      case 'day':
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = `${weekStart.getFullYear()}-W${Math.ceil(weekStart.getDate() / 7)}`;
        break;
      case 'month':
        key = `${date.getFullYear()}-${date.getMonth()}`;
        break;
    }
    
    const existing = groups.get(key) || { total: 0, count: 0 };
    groups.set(key, {
      total: existing.total + value,
      count: existing.count + 1
    });
  });
  
  return Array.from(groups.entries()).map(([period, { total, count }]) => ({
    period,
    value: total / count,
    count
  }));
};

export const mockAnalyticsData = (): AnalyticsDashboardData => ({
  searchMetrics: {
    totalQueries: 12547,
    avgResponseTime: 245,
    topQueries: [
      { query: "machine learning best practices", count: 156, avgRelevance: 0.92 },
      { query: "data preprocessing techniques", count: 134, avgRelevance: 0.88 },
      { query: "neural network architectures", count: 98, avgRelevance: 0.85 }
    ],
    queryTypes: [
      { type: "Technical", count: 8234, percentage: 65.6 },
      { type: "Conceptual", count: 2876, percentage: 22.9 },
      { type: "Procedural", count: 1437, percentage: 11.5 }
    ]
  },
  documentMetrics: {
    totalDocuments: 4567,
    processingStatus: {
      processed: 4234,
      processing: 12,
      failed: 23
    },
    documentTypes: [
      { type: "PDF", count: 2345, size: 1024 * 1024 * 850 },
      { type: "DOCX", count: 1234, size: 1024 * 1024 * 420 },
      { type: "TXT", count: 988, size: 1024 * 1024 * 85 }
    ],
    recentUploads: [
      { name: "ML_Research_2024.pdf", uploadedAt: "2024-01-15T10:30:00Z", size: 2.4 * 1024 * 1024, status: "processed" },
      { name: "Data_Analysis_Guide.docx", uploadedAt: "2024-01-15T09:15:00Z", size: 1.8 * 1024 * 1024, status: "processing" }
    ]
  },
  performanceMetrics: {
    systemHealth: { cpu: 45, memory: 67, storage: 23 },
    responseMetrics: { p50: 180, p95: 450, p99: 890 },
    errorRates: { searchErrors: 0.02, processingErrors: 0.15, systemErrors: 0.01 },
    throughput: { queriesPerHour: 1247, documentsPerHour: 23 }
  },
  userMetrics: {
    activeUsers: 234,
    totalSessions: 1876,
    avgSessionDuration: 1245,
    userActivity: [
      { hour: "09:00", users: 45, queries: 234 },
      { hour: "10:00", users: 78, queries: 456 }
    ],
    topUsers: [
      { userId: "user123", queries: 456, documents: 23 },
      { userId: "user456", queries: 234, documents: 45 }
    ]
  },
  lastUpdated: new Date().toISOString()
});
