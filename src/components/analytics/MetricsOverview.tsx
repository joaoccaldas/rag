import React from 'react';
import { Search, FileText, Activity, Users } from 'lucide-react';
import MetricCard from './MetricCard';
import type { AnalyticsDashboardData } from '../../types/analytics';
import { formatMetricValue, calculateTrend } from '../../utils/analytics';

interface MetricsOverviewProps {
  data: AnalyticsDashboardData;
  previousData?: AnalyticsDashboardData;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({ 
  data, 
  previousData 
}) => {
  const getMetricChange = (current: number, previous?: number) => {
    if (!previous) return undefined;
    return calculateTrend(current, previous);
  };

  const metrics = [
    {
      title: 'Total Queries',
      value: formatMetricValue(data.searchMetrics.totalQueries, 'number'),
      change: getMetricChange(
        data.searchMetrics.totalQueries,
        previousData?.searchMetrics.totalQueries
      ),
      icon: Search,
      color: 'blue'
    },
    {
      title: 'Total Documents',
      value: formatMetricValue(data.documentMetrics.totalDocuments, 'number'),
      change: getMetricChange(
        data.documentMetrics.totalDocuments,
        previousData?.documentMetrics.totalDocuments
      ),
      icon: FileText,
      color: 'green'
    },
    {
      title: 'Avg Response Time',
      value: formatMetricValue(data.searchMetrics.avgResponseTime, 'duration'),
      change: getMetricChange(
        data.searchMetrics.avgResponseTime,
        previousData?.searchMetrics.avgResponseTime
      ),
      icon: Activity,
      color: 'purple'
    },
    {
      title: 'Active Users',
      value: formatMetricValue(data.userMetrics.activeUsers, 'number'),
      change: getMetricChange(
        data.userMetrics.activeUsers,
        previousData?.userMetrics.activeUsers
      ),
      icon: Users,
      color: 'orange'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );
};

export default MetricsOverview;
