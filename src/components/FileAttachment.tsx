import React, { useState } from 'react';
import { FileIcon, Image as ImageIcon, FileText, Download, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface Attachment {
  id: number;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
}

interface FileAttachmentProps {
  attachment: Attachment;
  onDownload?: (attachment: Attachment) => void;
  className?: string;
}

const FileAttachment: React.FC<FileAttachmentProps> = ({
  attachment,
  onDownload,
  className,
}) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const isImage = attachment.file_type.startsWith('image/');
  const isPDF = attachment.file_type.includes('pdf');

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = () => {
    if (isImage) return <ImageIcon className="h-4 w-4" />;
    if (isPDF) return <FileText className="h-4 w-4" />;
    return <FileIcon className="h-4 w-4" />;
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDownload) {
      onDownload(attachment);
    }
  };

  const handlePreview = () => {
    if (isImage && !imageError) {
      setIsPreviewOpen(true);
    } else if (onDownload) {
      onDownload(attachment);
    }
  };

  // For now, we'll use a placeholder for S3 URLs
  // In production, you'd need to generate presigned URLs or serve through your backend
  const getDisplayUrl = (url: string) => {
    // If it's an S3 URL, we need to convert it to a downloadable URL through our API
    if (url.startsWith('s3://')) {
      const key = url.replace('s3://', '').split('/').slice(1).join('/');
      return `/api/v1/chat/download/${key}`;
    }
    return url;
  };

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-500 transition-colors cursor-pointer group',
          className
        )}
        onClick={handlePreview}
      >
        {/* File preview thumbnail */}
        {isImage && !imageError ? (
          <div className="relative w-12 h-12 rounded overflow-hidden bg-slate-100 dark:bg-slate-700 flex-shrink-0">
            <img
              src={getDisplayUrl(attachment.file_url)}
              alt={attachment.file_name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          <div className="w-12 h-12 rounded bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
            <div className="text-slate-600 dark:text-slate-400">
              {getFileIcon()}
            </div>
          </div>
        )}

        {/* File info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
            {attachment.file_name}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {formatFileSize(attachment.file_size)}
          </p>
        </div>

        {/* Download button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDownload}
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>

      {/* Image preview dialog */}
      {isImage && (
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0">
            <div className="relative w-full h-full">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsPreviewOpen(false)}
                className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white"
              >
                <X className="h-4 w-4" />
              </Button>
              <img
                src={getDisplayUrl(attachment.file_url)}
                alt={attachment.file_name}
                className="w-full h-full object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default FileAttachment;
