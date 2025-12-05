import React, { useState } from 'react';
import { Download, FileText, Table, File } from 'lucide-react';
import Button from './Button';

interface DownloadButtonProps {
  handleExport: (format: 'pdf' | 'excel' | 'word') => Promise<void>;
  isLoading?: boolean;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ handleExport, isLoading }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState<string | null>(null);

  const handleDownload = async (format: 'pdf' | 'excel' | 'word') => {
    setExportLoading(format);
    try {
      await handleExport(format);
    } finally {
      setExportLoading(null);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="secondary"
        icon={Download}
        onClick={() => setIsOpen(!isOpen)}
        loading={isLoading}
      >
        Download
      </Button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="py-1">
            <button
              onClick={() => handleDownload('pdf')}
              disabled={exportLoading !== null}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              <FileText className="h-4 w-4 mr-2" />
              {exportLoading === 'pdf' ? 'Generating...' : 'Download PDF'}
            </button>
            <button
              onClick={() => handleDownload('excel')}
              disabled={exportLoading !== null}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              <Table className="h-4 w-4 mr-2" />
              {exportLoading === 'excel' ? 'Generating...' : 'Download Excel'}
            </button>
            <button
              onClick={() => handleDownload('word')}
              disabled={exportLoading !== null}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              <File className="h-4 w-4 mr-2" />
              {exportLoading === 'word' ? 'Generating...' : 'Download Word'}
            </button>
          </div>
        </div>
      )}
      
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default DownloadButton;