import React from 'react';
import { File, FileText, FileImage, Archive, Database, Code, X, Download, Eye } from 'lucide-react';
import type { FileUploadItem } from '../../types/upload';
import { formatFileSize } from '../../utils/upload';
import ProgressBar from './ProgressBar';

export interface FileCardProps {
  file: FileUploadItem;
  onRemove?: (fileId: string) => void;
  onPreview?: (fileId: string) => void;
  onDownload?: (fileId: string) => void;
  showActions?: boolean;
  compact?: boolean;
  className?: string;
}

export const FileCard: React.FC<FileCardProps> = ({
  file,
  onRemove,
  onPreview,
  onDownload,
  showActions = true,
  compact = false,
  className = ''
}) => {
  const getFileIcon = () => {
    const extension = file.file.name.split('.').pop()?.toLowerCase();
    const iconClass = compact ? 'w-5 h-5' : 'w-8 h-8';
    
    switch (extension) {
      case 'pdf':
        return <File className={`${iconClass} text-red-500`} />;
      case 'doc':
      case 'docx':
        return <FileText className={`${iconClass} text-blue-500`} />;
      case 'txt':
      case 'md':
        return <FileText className={`${iconClass} text-gray-500`} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileImage className={`${iconClass} text-green-500`} />;
      case 'zip':
      case 'rar':
        return <Archive className={`${iconClass} text-orange-500`} />;
      case 'csv':
      case 'xlsx':
        return <Database className={`${iconClass} text-emerald-500`} />;
      case 'json':
      case 'html':
        return <Code className={`${iconClass} text-purple-500`} />;
      default:
        return <File className={`${iconClass} text-gray-400`} />;
    }
  };

  const getStatusBadge = () => {
    const badgeClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    
    switch (file.status) {
      case 'completed':
        return <span className={`${badgeClasses} bg-green-100 text-green-800`}>Completed</span>;
      case 'error':
        return <span className={`${badgeClasses} bg-red-100 text-red-800`}>Error</span>;
      case 'processing':
        return <span className={`${badgeClasses} bg-blue-100 text-blue-800`}>Processing</span>;
      case 'uploading':
        return <span className={`${badgeClasses} bg-yellow-100 text-yellow-800`}>Uploading</span>;
      case 'pending':
        return <span className={`${badgeClasses} bg-gray-100 text-gray-800`}>Pending</span>;
      default:
        return null;
    }
  };

  const truncateFileName = (name: string, maxLength: number) => {
    if (name.length <= maxLength) return name;
    
    const extension = name.split('.').pop();
    const nameWithoutExt = name.substring(0, name.lastIndexOf('.'));
    const truncatedName = nameWithoutExt.substring(0, maxLength - extension!.length - 4);
    
    return `${truncatedName}...${extension}`;
  };

  const formatUploadTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    
    return date.toLocaleDateString();
  };

  if (compact) {
    return (
      <div className={`flex items-center p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow ${className}`}>
        <div className="flex items-center flex-1 min-w-0">
          {getFileIcon()}
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {truncateFileName(file.file.name, 30)}
            </p>
            <p className="text-xs text-gray-500">
              {formatFileSize(file.file.size)} • {formatUploadTime(file.uploadedAt)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          {getStatusBadge()}
          
          {showActions && (
            <div className="flex items-center space-x-1">
              {file.status === 'completed' && onPreview && (
                <button
                  onClick={() => onPreview(file.id)}
                  className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                  title="Preview"
                >
                  <Eye className="w-4 h-4" />
                </button>
              )}
              
              {file.status === 'completed' && onDownload && (
                <button
                  onClick={() => onDownload(file.id)}
                  className="p-1 text-gray-400 hover:text-green-500 transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
              )}
              
              {onRemove && (
                <button
                  onClick={() => onRemove(file.id)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  title="Remove"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white p-6 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getFileIcon()}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {truncateFileName(file.file.name, 40)}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {formatFileSize(file.file.size)} • Uploaded {formatUploadTime(file.uploadedAt)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {getStatusBadge()}
          
          {showActions && onRemove && (
            <button
              onClick={() => onRemove(file.id)}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      {(file.status === 'uploading' || file.status === 'processing') && (
        <div className="mb-4">
          <ProgressBar
            progress={file.progress}
            status={file.status}
            size="sm"
            showPercentage={true}
            showStatus={false}
          />
        </div>
      )}
      
      {file.error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{file.error}</p>
        </div>
      )}
      
      {file.result && file.status === 'completed' && (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-gray-500">Chunks:</span>
              <span className="ml-2 font-medium">{file.result.chunks.length}</span>
            </div>
            <div>
              <span className="text-gray-500">Processing time:</span>
              <span className="ml-2 font-medium">{file.result.processingTime}s</span>
            </div>
            {file.result.metadata.wordCount && (
              <div>
                <span className="text-gray-500">Words:</span>
                <span className="ml-2 font-medium">{file.result.metadata.wordCount.toLocaleString()}</span>
              </div>
            )}
            {file.result.metadata.pageCount && (
              <div>
                <span className="text-gray-500">Pages:</span>
                <span className="ml-2 font-medium">{file.result.metadata.pageCount}</span>
              </div>
            )}
          </div>
          
          {showActions && (
            <div className="flex items-center space-x-2 pt-2 border-t border-gray-100">
              {onPreview && (
                <button
                  onClick={() => onPreview(file.id)}
                  className="flex items-center px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Preview
                </button>
              )}
              
              {onDownload && (
                <button
                  onClick={() => onDownload(file.id)}
                  className="flex items-center px-3 py-1.5 text-xs bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Download
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileCard;
