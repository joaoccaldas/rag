"use client"

import { useState, useEffect, useCallback } from 'react';
import type { AnalyticsDashboardData, MetricType } from '../types/analytics';
import { mockAnalyticsData } from '../utils/analytics';

export interface UseAnalyticsReturn {
  data: AnalyticsDashboardData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateInterval: number;
  setUpdateInterval: (interval: number) => void;
}

export const useAnalytics = (autoRefresh = true, initialInterval = 30000): UseAnalyticsReturn => {
  const [data, setData] = useState<AnalyticsDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateInterval, setUpdateInterval] = useState(initialInterval);

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In real implementation, this would be an API call
      const analyticsData = mockAnalyticsData();
      
      setData(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
      console.error('Error fetching analytics data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    await fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Initial data load
  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh || updateInterval <= 0) return;

    const intervalId = setInterval(() => {
      fetchAnalyticsData();
    }, updateInterval);

    return () => clearInterval(intervalId);
  }, [autoRefresh, updateInterval, fetchAnalyticsData]);

  return {
    data,
    isLoading,
    error,
    refetch,
    updateInterval,
    setUpdateInterval
  };
};

export const useMetricFilters = () => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('search');
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [refreshRate, setRefreshRate] = useState<number>(30000);

  const resetFilters = useCallback(() => {
    setSelectedMetric('search');
    setTimeRange('24h');
    setRefreshRate(30000);
  }, []);

  return {
    selectedMetric,
    setSelectedMetric,
    timeRange,
    setTimeRange,
    refreshRate,
    setRefreshRate,
    resetFilters
  };
};

export default useAnalytics;
