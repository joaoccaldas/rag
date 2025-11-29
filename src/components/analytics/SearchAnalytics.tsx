import React from 'react';
import ChartWrapper from './ChartWrapper';
import type { SearchMetrics } from '../../types/analytics';

interface SearchAnalyticsProps {
  data: SearchMetrics;
  isLoading?: boolean;
}

export const SearchAnalytics: React.FC<SearchAnalyticsProps> = ({ 
  data, 
  isLoading = false 
}) => {
  return (
    <div className="space-y-6">
      {/* Top Queries */}
      <ChartWrapper
        title="Top Search Queries"
        description="Most frequently searched queries and their relevance scores"
        chartType="bar"
        isLoading={isLoading}
      >
        <div className="space-y-3">
          {data.topQueries.map((query, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{query.query}</p>
                <p className="text-xs text-gray-500">
                  {query.count} searches • {(query.avgRelevance * 100).toFixed(1)}% avg relevance
                </p>
              </div>
              <div className="w-16 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${query.avgRelevance * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </ChartWrapper>

      {/* Query Types Distribution */}
      <ChartWrapper
        title="Query Types Distribution"
        description="Breakdown of query types and their frequencies"
        chartType="pie"
        isLoading={isLoading}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {data.queryTypes.map((type, index) => (
            <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {type.percentage.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 mt-1">{type.type}</div>
              <div className="text-xs text-gray-500 mt-1">
                {type.count.toLocaleString()} queries
              </div>
            </div>
          ))}
        </div>
      </ChartWrapper>

      {/* Search Metrics Summary */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Summary</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {data.totalQueries.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Queries</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {data.avgResponseTime}ms
            </div>
            <div className="text-sm text-gray-600">Avg Response</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {data.topQueries.length}
            </div>
            <div className="text-sm text-gray-600">Top Queries</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {data.queryTypes.length}
            </div>
            <div className="text-sm text-gray-600">Query Types</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchAnalytics;
