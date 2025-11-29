"use client"

import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { validateFile } from '../../utils/upload';

interface FileDropZoneProps {
  onFilesAdded: (files: File[]) => void;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
}

export const FileDropZone: React.FC<FileDropZoneProps> = ({
  onFilesAdded,
  maxFiles = 10,
  disabled = false,
  className = ''
}) => {
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    fileRejections
  } = useDropzone({
    onDrop: (acceptedFiles) => {
      // Validate files before adding
      const validFiles = acceptedFiles.filter(file => {
        const validation = validateFile(file);
        return validation.isValid;
      });
      
      if (validFiles.length > 0) {
        onFilesAdded(validFiles);
      }
    },
    maxFiles,
    disabled,
    multiple: true,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'text/html': ['.html'],
      'application/json': ['.json'],
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    }
  });

  const getDropZoneClass = () => {
    const baseClass = `
      border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
      ${className}
    `;

    if (disabled) {
      return `${baseClass} border-gray-200 bg-gray-50 cursor-not-allowed`;
    }

    if (isDragReject) {
      return `${baseClass} border-red-300 bg-red-50`;
    }

    if (isDragActive) {
      return `${baseClass} border-blue-400 bg-blue-50`;
    }

    return `${baseClass} border-gray-300 hover:border-blue-400 hover:bg-blue-50`;
  };

  const getIconColor = () => {
    if (disabled) return 'text-gray-400';
    if (isDragReject) return 'text-red-500';
    if (isDragActive) return 'text-blue-500';
    return 'text-gray-600';
  };

  const getMessageText = () => {
    if (disabled) return 'File upload is currently disabled';
    if (isDragReject) return 'Some files are not supported';
    if (isDragActive) return 'Drop files here to upload';
    return 'Drag & drop files here, or click to browse';
  };

  return (
    <div className="space-y-4">
      <div {...getRootProps({ className: getDropZoneClass() })}>
        <input {...getInputProps()} />
        
        <div className="space-y-4">
          <Upload className={`w-12 h-12 mx-auto ${getIconColor()}`} />
          
          <div>
            <p className={`text-lg font-medium ${getIconColor()}`}>
              {getMessageText()}
            </p>
            
            {!disabled && (
              <p className="text-sm text-gray-500 mt-2">
                Supports PDF, DOCX, TXT, MD, HTML, JSON, CSV, XLSX files up to 50MB each
              </p>
            )}
          </div>

          {!disabled && (
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <FileText className="w-4 h-4" />
                <span>Max {maxFiles} files</span>
              </div>
              <div>•</div>
              <div>Up to 50MB each</div>
            </div>
          )}
        </div>
      </div>

      {/* Show rejected files */}
      {fileRejections.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <h3 className="text-sm font-medium text-red-800">
              Some files were rejected:
            </h3>
          </div>
          <ul className="text-sm text-red-700 space-y-1">
            {fileRejections.map((rejection, index) => (
              <li key={index}>
                {rejection.file.name} - {rejection.errors[0]?.message || 'Invalid file type or size'}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileDropZone;
