import { useState } from 'react';
import { useAppSelector } from './redux';
import { ExportService } from '../utils/exportHelpers';

export const useExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { user } = useAppSelector((state) => state.auth);
  const { currentCompany } = useAppSelector((state) => state.company);

  const exportItem = async (
    item: any, 
    type: 'permit' | 'incident' | 'audit' | 'hazop' | 'hira' | 'bbs',
    format: 'pdf' | 'excel' | 'word'
  ) => {
    setIsExporting(true);
    
    try {
      const title = `${type.toUpperCase()}_${item.number || item.id}_${new Date().toISOString().split('T')[0]}`;
      
      // Add company context
      const exportData = {
        ...item,
        company: currentCompany,
        exportedBy: user?.name,
        exportDate: new Date().toISOString()
      };

      switch (format) {
        case 'pdf':
          ExportService.exportToPDF(exportData, title, type);
          break;
        case 'excel':
          ExportService.exportToExcel([exportData], title, type);
          break;
        case 'word':
          ExportService.exportToWord(exportData, title);
          break;
      }
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  const exportBulk = async (
    items: any[], 
    type: string,
    format: 'excel' | 'pdf'
  ) => {
    setIsExporting(true);
    
    try {
      const title = `${type.toUpperCase()}_Bulk_Export_${new Date().toISOString().split('T')[0]}`;
      
      if (format === 'excel') {
        ExportService.exportBulkToExcel(items, type, currentCompany?.name || 'Company');
      } else {
        // For PDF bulk export, create a summary document
        const summaryData = {
          title: `${type.toUpperCase()} Summary Report`,
          company: currentCompany,
          totalItems: items.length,
          items: items.slice(0, 50) // Limit for PDF
        };
        ExportService.exportToPDF(summaryData, title, type as any);
      }
    } catch (error) {
      console.error('Bulk export error:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportItem,
    exportBulk,
    isExporting
  };
};