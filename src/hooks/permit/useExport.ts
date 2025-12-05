import { useState } from 'react';
import downloadService from '../../services/permit/downloadService';

export const useExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  const exportItem = async (item: any, type: string, format: 'pdf' | 'excel' | 'word') => {
    setIsExporting(true);
    try {
      if (type === 'permit') {
        switch (format) {
          case 'pdf':
            await downloadService.downloadPermitPDF(item);
            break;
          case 'excel':
            await downloadService.downloadPermitExcel(item);
            break;
          case 'word':
            await downloadService.downloadPermitWord(item);
            break;
          default:
            throw new Error('Unsupported format');
        }
      }
      return true;
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  const exportList = async (items: any[], filters: any, format: 'excel') => {
    setIsExporting(true);
    try {
      if (format === 'excel') {
        await downloadService.downloadPermitList(items, filters);
      }
      return true;
    } catch (error) {
      console.error('Export list error:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportItem,
    exportList,
    isExporting
  };
};