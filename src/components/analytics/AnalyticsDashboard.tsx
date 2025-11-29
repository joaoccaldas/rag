"use client"

import React, { useState } from 'react';
import { RefreshCw, Calendar, Download } from 'lucide-react';
import useAnalytics, { useMetricFilters } from '../../hooks/useAnalytics';
import MetricsOverview from './MetricsOverview';
import SearchAnalytics from './SearchAnalytics';
import DocumentAnalytics from './DocumentAnalytics';
import type { MetricType } from '../../types/analytics';

export const AnalyticsDashboard: React.FC = () => {
  const { data, isLoading, error, refetch } = useAnalytics();
  const { selectedMetric, setSelectedMetric, timeRange, setTimeRange } = useMetricFilters();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const handleExport = () => {
    console.log('Exporting analytics data...');
    // Implementation for data export
  };

  const metricTabs: Array<{ key: MetricType; label: string }> = [
    { key: 'search', label: 'Search Analytics' },
    { key: 'documents', label: 'Document Analytics' },
    { key: 'performance', label: 'Performance' },
    { key: 'users', label: 'User Analytics' }
  ];

  const timeRangeOptions = [
    { value: '1h', label: 'Last Hour' },
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' }
  ];

  const renderMetricContent = () => {
    if (!data) return null;

    switch (selectedMetric) {
      case 'search':
        return <SearchAnalytics data={data.searchMetrics} isLoading={isLoading} />;
      case 'documents':
        return <DocumentAnalytics data={data.documentMetrics} isLoading={isLoading} />;
      case 'performance':
        return (
          <div className="text-center py-12 text-gray-500">
            Performance analytics implementation coming soon...
          </div>
        );
      case 'users':
        return (
          <div className="text-center py-12 text-gray-500">
            User analytics implementation coming soon...
          </div>
        );
      default:
        return null;
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Failed to Load Analytics
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
              <p className="text-sm text-gray-600">
                Monitor your RAG system performance and usage
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Time Range Selector */}
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {timeRangeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Export Button */}
              <button
                onClick={handleExport}
                className="flex items-center px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Metrics */}
        {data && (
          <div className="mb-8">
            <MetricsOverview data={data} />
          </div>
        )}

        {/* Metric Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {metricTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedMetric(tab.key)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    selectedMetric === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Metric Content */}
        <div className="space-y-6">
          {renderMetricContent()}
        </div>

        {/* Last Updated */}
        {data && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Last updated: {new Date(data.lastUpdated).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
