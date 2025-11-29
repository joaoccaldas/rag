import React from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

export interface ProgressBarProps {
  progress: number;
  status?: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  showStatus?: boolean;
  label?: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  status = 'pending',
  size = 'md',
  showPercentage = true,
  showStatus = true,
  label,
  className = ''
}) => {
  const getStatusIcon = () => {
    const iconClass = 'w-4 h-4';
    
    switch (status) {
      case 'completed':
        return <CheckCircle className={`${iconClass} text-green-500`} />;
      case 'error':
        return <XCircle className={`${iconClass} text-red-500`} />;
      case 'processing':
      case 'uploading':
        return <Clock className={`${iconClass} text-blue-500 animate-pulse`} />;
      case 'pending':
        return <AlertCircle className={`${iconClass} text-gray-400`} />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'processing':
      case 'uploading':
        return 'bg-blue-500';
      case 'pending':
        return 'bg-gray-300';
      default:
        return 'bg-gray-300';
    }
  };

  const getStatusLabel = () => {
    const labels = {
      pending: 'Pending',
      uploading: 'Uploading',
      processing: 'Processing',
      completed: 'Completed',
      error: 'Error'
    };
    
    return labels[status];
  };

  const getSizeClasses = () => {
    const sizeMap = {
      sm: 'h-2',
      md: 'h-3',
      lg: 'h-4'
    };
    
    return sizeMap[size];
  };

  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={`w-full ${className}`}>
      {(label || showStatus) && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {showStatus && getStatusIcon()}
            {label && (
              <span className="text-sm font-medium text-gray-700">{label}</span>
            )}
            {showStatus && !label && (
              <span className="text-sm font-medium text-gray-700">
                {getStatusLabel()}
              </span>
            )}
          </div>
          
          {showPercentage && (
            <span className="text-sm text-gray-600">
              {clampedProgress.toFixed(0)}%
            </span>
          )}
        </div>
      )}
      
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${getSizeClasses()}`}>
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${getStatusColor()}`}
          style={{ 
            width: `${clampedProgress}%`,
            transform: status === 'processing' || status === 'uploading' ? 'translateX(-100%)' : 'none',
            animation: status === 'processing' || status === 'uploading' ? 'progress-shimmer 2s infinite' : 'none'
          }}
        />
      </div>
      
      <style jsx>{`
        @keyframes progress-shimmer {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default ProgressBar;
