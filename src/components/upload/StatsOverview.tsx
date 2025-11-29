import React from 'react';
import { Files, CheckCircle, XCircle, Clock, BarChart3 } from 'lucide-react';
import type { ProcessingStats } from '../../types/upload';
import { formatFileSize } from '../../utils/upload';

export interface StatsOverviewProps {
  stats: ProcessingStats;
  className?: string;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  stats,
  className = ''
}) => {
  const getSuccessRate = () => {
    if (stats.totalFiles === 0) return 0;
    return (stats.completedFiles / stats.totalFiles) * 100;
  };

  const getFailureRate = () => {
    if (stats.totalFiles === 0) return 0;
    return (stats.failedFiles / stats.totalFiles) * 100;
  };

  const formatProcessingTime = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`;
    return `${(seconds / 3600).toFixed(1)}h`;
  };

  const statItems = [
    {
      label: 'Total Files',
      value: stats.totalFiles.toLocaleString(),
      icon: Files,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Completed',
      value: stats.completedFiles.toLocaleString(),
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      subtext: `${getSuccessRate().toFixed(1)}% success rate`
    },
    {
      label: 'Failed',
      value: stats.failedFiles.toLocaleString(),
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      subtext: `${getFailureRate().toFixed(1)}% failure rate`
    },
    {
      label: 'Avg. Processing Time',
      value: formatProcessingTime(stats.avgProcessingTime),
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      label: 'Total Size',
      value: formatFileSize(stats.totalSize),
      icon: BarChart3,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      label: 'Total Chunks',
      value: stats.totalChunks.toLocaleString(),
      icon: BarChart3,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50'
    }
  ];

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 ${className}`}>
      {statItems.map((item, index) => (
        <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                {item.label}
              </p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {item.value}
              </p>
              {item.subtext && (
                <p className="text-xs text-gray-500 mt-1">
                  {item.subtext}
                </p>
              )}
            </div>
            <div className={`p-2 rounded-lg ${item.bgColor}`}>
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsOverview;
