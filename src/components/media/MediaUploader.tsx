
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, Upload, FileUp, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { MediaItem } from '@/hooks/useMediaLibrary';

interface MediaUploaderProps {
  onUploadComplete: (file: File, onProgress?: (progress: number) => void) => Promise<MediaItem>;
  maxFiles?: number;
  allowedTypes?: string[];
  maxSize?: number;
}

const MediaUploader: React.FC<MediaUploaderProps> = ({
  onUploadComplete,
  maxFiles = 10,
  allowedTypes = ['image/jpeg', 'image/png', 'video/mp4', 'video/quicktime'],
  maxSize = 104857600, // 100MB in bytes
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDropActive, setIsDropActive] = useState(false);
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    setIsUploading(true);
    setUploadError(null);
    
    // Initialize progress tracking for each file
    const initialProgress = acceptedFiles.reduce((acc, file) => {
      acc[file.name] = 0;
      return acc;
    }, {} as {[key: string]: number});
    
    setUploadProgress(initialProgress);
    
    try {
      for (const file of acceptedFiles) {
        await onUploadComplete(file, (progress) => {
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: progress
          }));
        });
      }
      
      toast.success(`${acceptedFiles.length > 1 ? 'Files' : 'File'} uploaded successfully`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      setUploadError(message);
      toast.error(message);
    } finally {
      setIsUploading(false);
      // Reset progress after a delay
      setTimeout(() => {
        setUploadProgress({});
      }, 1500);
    }
  }, [onUploadComplete]);
  
  const { 
    getRootProps, 
    getInputProps, 
    isDragActive,
    open,
    fileRejections
  } = useDropzone({
    onDrop,
    maxFiles,
    accept: allowedTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as {[key: string]: string[]}),
    maxSize,
    disabled: isUploading,
    onDragEnter: () => setIsDropActive(true),
    onDragLeave: () => setIsDropActive(false),
    onDropAccepted: () => setIsDropActive(false),
    onDropRejected: () => {
      setIsDropActive(false);
      fileRejections.forEach(({ file, errors }) => {
        const errorMessages = errors.map(e => e.message).join(', ');
        toast.error(`${file.name}: ${errorMessages}`);
      });
    }
  });
  
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 transition-all duration-200 text-center
          ${isDragActive || isDropActive ? 'border-primary bg-primary/5' : 'border-border'}
          ${isUploading ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50 hover:bg-secondary/30'}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-3">
          <div className={`rounded-full p-3 ${isDragActive || isDropActive ? 'bg-primary/10 text-primary' : 'bg-secondary'}`}>
            <Upload className="h-8 w-8" />
          </div>
          
          {isUploading ? (
            <div className="text-lg font-medium">Uploading...</div>
          ) : isDragActive || isDropActive ? (
            <div className="text-lg font-medium">Drop files here</div>
          ) : (
            <div className="text-lg font-medium">Drag & drop files here</div>
          )}
          
          <p className="text-muted-foreground max-w-md mx-auto">
            Drop your image or video files here, or click to browse. 
            Supported formats: JPG, PNG, MP4, MOV. Max file size: 100MB.
          </p>
          
          {!isUploading && (
            <Button 
              type="button" 
              onClick={(e) => {
                e.stopPropagation();
                open();
              }}
              className="mt-2"
            >
              <FileUp className="mr-2 h-4 w-4" />
              Browse Files
            </Button>
          )}
        </div>
        
        {/* Upload Progress */}
        {isUploading && Object.keys(uploadProgress).length > 0 && (
          <div className="mt-6 space-y-4 max-w-md mx-auto">
            {Object.entries(uploadProgress).map(([fileName, progress]) => (
              <div key={fileName} className="bg-secondary/30 rounded p-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium truncate max-w-[200px]">{fileName}</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            ))}
          </div>
        )}
        
        {/* Upload Error */}
        {uploadError && (
          <div className="mt-4 bg-red-50 text-red-500 p-3 rounded-md flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            <span className="text-sm">{uploadError}</span>
          </div>
        )}
      </div>
      
      <div className="mt-2 text-xs text-muted-foreground">
        <span className="font-medium">Note:</span> By uploading, you confirm these files don't violate our Terms of Service.
      </div>
    </div>
  );
};

export default MediaUploader;
