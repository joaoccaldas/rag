import React from 'react';
import { FileText, CheckCircle, Clock, XCircle } from 'lucide-react';
import ChartWrapper from './ChartWrapper';
import type { DocumentMetrics } from '../../types/analytics';
import { formatFileSize } from '../../utils/upload';

interface DocumentAnalyticsProps {
  data: DocumentMetrics;
  isLoading?: boolean;
}

export const DocumentAnalytics: React.FC<DocumentAnalyticsProps> = ({ 
  data, 
  isLoading = false 
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatUploadTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Processing Status Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-green-900">
                {data.processingStatus.processed.toLocaleString()}
              </div>
              <div className="text-sm text-green-700">Processed</div>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-blue-900">
                {data.processingStatus.processing.toLocaleString()}
              </div>
              <div className="text-sm text-blue-700">Processing</div>
            </div>
          </div>
        </div>
        
        <div className="bg-red-50 p-6 rounded-lg border border-red-200">
          <div className="flex items-center">
            <XCircle className="w-8 h-8 text-red-600" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-red-900">
                {data.processingStatus.failed.toLocaleString()}
              </div>
              <div className="text-sm text-red-700">Failed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Types */}
      <ChartWrapper
        title="Document Types"
        description="Distribution of document types and their storage usage"
        chartType="bar"
        isLoading={isLoading}
      >
        <div className="space-y-3">
          {data.documentTypes.map((type, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{type.type}</p>
                  <p className="text-xs text-gray-500">
                    {type.count.toLocaleString()} files
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {formatFileSize(type.size)}
                </p>
                <p className="text-xs text-gray-500">
                  {((type.count / data.totalDocuments) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </ChartWrapper>

      {/* Recent Uploads */}
      <ChartWrapper
        title="Recent Uploads"
        description="Latest document uploads and their processing status"
        chartType="line"
        isLoading={isLoading}
      >
        <div className="space-y-3">
          {data.recentUploads.map((upload, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(upload.status)}
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {upload.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(upload.size)} • {formatUploadTime(upload.uploadedAt)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  upload.status === 'processed' 
                    ? 'bg-green-100 text-green-800'
                    : upload.status === 'processing'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {upload.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </ChartWrapper>
    </div>
  );
};

export default DocumentAnalytics;
