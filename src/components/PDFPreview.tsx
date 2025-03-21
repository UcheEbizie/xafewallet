import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PDFPreviewProps {
  file: string | File;
  className?: string;
}

const PDFPreview = ({ file, className = '' }: PDFPreviewProps) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  return (
    <div className={`flex flex-col items-center bg-gray-50 rounded-lg ${className}`}>
      <div className="w-full max-h-[300px] overflow-y-auto scrollbar-thin">
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex items-center justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          }
          error={
            <div className="flex items-center justify-center p-4 text-red-500">
              Failed to load PDF
            </div>
          }
        >
          <Page
            pageNumber={pageNumber}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            scale={scale}
            loading={
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            }
          />
        </Document>
      </div>

      <div className="flex items-center gap-4 p-2 bg-white w-full border-t">
        {numPages && numPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
              disabled={pageNumber <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm min-w-[80px] text-center">
              {pageNumber} / {numPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageNumber(prev => Math.min(numPages, prev + 1))}
              disabled={pageNumber >= numPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setScale(prev => Math.max(0.5, prev - 0.1))}
            disabled={scale <= 0.5}
          >
            -
          </Button>
          <span className="text-sm min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setScale(prev => Math.min(2, prev + 0.1))}
            disabled={scale >= 2}
          >
            +
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PDFPreview;