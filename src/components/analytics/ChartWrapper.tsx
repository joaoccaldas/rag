import React from 'react';
import { BarChart3, TrendingUp, PieChart, Activity } from 'lucide-react';

export interface ChartWrapperProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  chartType?: 'bar' | 'line' | 'pie' | 'area';
  isLoading?: boolean;
  error?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const ChartWrapper: React.FC<ChartWrapperProps> = ({
  title,
  description,
  children,
  chartType = 'bar',
  isLoading = false,
  error,
  actions,
  className = ''
}) => {
  const getChartIcon = () => {
    const iconMap = {
      bar: BarChart3,
      line: TrendingUp,
      pie: PieChart,
      area: Activity
    };
    
    const Icon = iconMap[chartType];
    return <Icon className="w-5 h-5 text-gray-500" />;
  };

  const renderContent = () => {
    if (error) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <div className="text-red-500 mb-2">⚠️</div>
            <p className="text-sm">Error loading chart: {error}</p>
          </div>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    return children;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getChartIcon()}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              {description && (
                <p className="text-sm text-gray-600 mt-1">{description}</p>
              )}
            </div>
          </div>
          
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
      </div>
      
      <div className="p-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default ChartWrapper;
