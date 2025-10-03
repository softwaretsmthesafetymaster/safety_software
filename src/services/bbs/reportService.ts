import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { BBSReport } from './bbsService';
import { format } from 'date-fns';

export const reportService = {
  generatePDF(report: BBSReport, companyInfo: any) {
    const doc = new jsPDF();
    
    // Company branding
    doc.setFontSize(20);
    doc.setTextColor(37, 99, 235); // Blue
    doc.text(companyInfo.name || 'Safety Management System', 20, 25);
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('BBS Observation Report', 20, 40);
    
    // Report header
    doc.setFontSize(12);
    doc.text(`Report Number: ${report.reportNumber}`, 20, 55);
    doc.text(`Date: ${format(new Date(report.observationDate), 'MMM dd, yyyy')}`, 20, 65);
    doc.text(`Plant: ${report.plantId?.name}`, 20, 75);
    doc.text(`Observer: ${report.observer?.name}`, 20, 85);
    
    // Status
    doc.setFontSize(10);
    doc.setFillColor(37, 99, 235);
    doc.rect(150, 50, 40, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(`Status: ${report.status.toUpperCase()}`, 152, 56);
    
    // Observation details table
    doc.setTextColor(0, 0, 0);
    autoTable(doc, {
      startY: 100,
      head: [['Field', 'Details']],
      body: [
        ['Type', report.observationType.replace('_', ' ').toUpperCase()],
        ['Category', report.category],
        ['Severity', report.severity.toUpperCase()],
        ['Location', `${report.location.area} ${report.location.specificLocation || ''}`.trim()],
        ['Description', report.description],
        ['Immediate Action', report.immediateAction || 'None'],
        ['Root Cause', report.rootCause || 'Not identified']
      ],
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] }
    });
    
    // Corrective actions if any
    if (report.correctiveActions && report.correctiveActions.length > 0) {
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Action', 'Assigned To', 'Due Date', 'Status']],
        body: report.correctiveActions.map(action => [
          action.action,
          action.assignedTo?.name || 'Unassigned',
          action.dueDate ? format(new Date(action.dueDate), 'MMM dd, yyyy') : '-',
          action.status.replace('_', ' ').toUpperCase()
        ]),
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235] }
      });
    }
    
    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Generated on ${format(new Date(), 'MMM dd, yyyy HH:mm')} - Page ${i} of ${pageCount}`,
        20,
        doc.internal.pageSize.height - 10
      );
    }
    
    return doc;
  },

  downloadPDF(report: BBSReport, companyInfo: any) {
    const doc = this.generatePDF(report, companyInfo);
    doc.save(`BBS_Report_${report.reportNumber}.pdf`);
  },

  generateExcel(reports: BBSReport[], companyInfo: any) {
    const workbook = XLSX.utils.book_new();
    
    // Reports sheet
    const reportsData = reports.map(report => ({
      'Report Number': report.reportNumber,
      'Date': format(new Date(report.observationDate), 'yyyy-MM-dd'),
      'Plant': report.plantId?.name,
      'Observer': report.observer?.name,
      'Type': report.observationType.replace('_', ' '),
      'Category': report.category,
      'Severity': report.severity,
      'Status': report.status,
      'Location': report.location.area,
      'Description': report.description,
      'Immediate Action': report.immediateAction || '',
      'Root Cause': report.rootCause || ''
    }));
    
    const reportsSheet = XLSX.utils.json_to_sheet(reportsData);
    XLSX.utils.book_append_sheet(workbook, reportsSheet, 'BBS Reports');
    
    // Summary sheet
    const summaryData = [
      ['Metric', 'Count'],
      ['Total Reports', reports.length],
      ['Open', reports.filter(r => r.status === 'open').length],
      ['Closed', reports.filter(r => r.status === 'closed').length],
      ['Unsafe Acts', reports.filter(r => r.observationType === 'unsafe_act').length],
      ['Unsafe Conditions', reports.filter(r => r.observationType === 'unsafe_condition').length],
      ['Safe Behaviors', reports.filter(r => r.observationType === 'safe_behavior').length]
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    
    return workbook;
  },

  downloadExcel(reports: BBSReport[], companyInfo: any) {
    const workbook = this.generateExcel(reports, companyInfo);
    XLSX.writeFile(workbook, `BBS_Reports_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  },

  generateWordDocument(report: BBSReport, companyInfo: any) {
    // Create HTML content for Word document
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>BBS Report - ${report.reportNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; border-bottom: 2px solid #2563EB; padding-bottom: 20px; margin-bottom: 30px; }
          .company-name { color: #2563EB; font-size: 24px; font-weight: bold; }
          .report-title { font-size: 18px; margin-top: 10px; }
          .section { margin-bottom: 25px; }
          .section-title { font-size: 16px; font-weight: bold; color: #2563EB; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 15px; }
          .field { margin-bottom: 10px; }
          .field-label { font-weight: bold; display: inline-block; width: 150px; }
          .status { padding: 4px 12px; border-radius: 20px; color: white; background-color: #2563EB; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #2563EB; color: white; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">${companyInfo.name || 'Safety Management System'}</div>
          <div class="report-title">Behavioral Based Safety (BBS) Observation Report</div>
        </div>
        
        <div class="section">
          <div class="section-title">Report Information</div>
          <div class="field"><span class="field-label">Report Number:</span> ${report.reportNumber}</div>
          <div class="field"><span class="field-label">Status:</span> <span class="status">${report.status.toUpperCase()}</span></div>
          <div class="field"><span class="field-label">Observation Date:</span> ${format(new Date(report.observationDate), 'MMMM dd, yyyy')}</div>
          <div class="field"><span class="field-label">Observer:</span> ${report.observer?.name}</div>
          <div class="field"><span class="field-label">Plant:</span> ${report.plantId?.name}</div>
          <div class="field"><span class="field-label">Location:</span> ${report.location.area} ${report.location.specificLocation || ''}</div>
        </div>
        
        <div class="section">
          <div class="section-title">Observation Details</div>
          <div class="field"><span class="field-label">Type:</span> ${report.observationType.replace('_', ' ').toUpperCase()}</div>
          <div class="field"><span class="field-label">Category:</span> ${report.category}</div>
          <div class="field"><span class="field-label">Severity:</span> ${report.severity.toUpperCase()}</div>
          <div class="field"><span class="field-label">Description:</span><br>${report.description}</div>
          ${report.immediateAction ? `<div class="field"><span class="field-label">Immediate Action:</span><br>${report.immediateAction}</div>` : ''}
          ${report.rootCause ? `<div class="field"><span class="field-label">Root Cause:</span><br>${report.rootCause}</div>` : ''}
        </div>
        
        ${report.correctiveActions && report.correctiveActions.length > 0 ? `
        <div class="section">
          <div class="section-title">Corrective Actions</div>
          <table>
            <thead>
              <tr>
                <th>Action</th>
                <th>Assigned To</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${report.correctiveActions.map(action => `
                <tr>
                  <td>${action.action}</td>
                  <td>${action.assignedTo?.name || 'Unassigned'}</td>
                  <td>${action.dueDate ? format(new Date(action.dueDate), 'MMM dd, yyyy') : '-'}</td>
                  <td>${action.status.replace('_', ' ').toUpperCase()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>` : ''}
        
        <div style="margin-top: 50px; text-align: center; font-size: 10px; color: #666;">
          Generated on ${format(new Date(), 'MMMM dd, yyyy HH:mm')}
        </div>
      </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    saveAs(blob, `BBS_Report_${report.reportNumber}.doc`);
  },

  downloadCombinedPDF(data: any, companyInfo: any) {
    const doc = new jsPDF();
    
    // Company branding
    doc.setFontSize(20);
    doc.setTextColor(37, 99, 235);
    doc.text(companyInfo?.name || 'Safety Management System', 20, 25);
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('BBS Observations Summary Report', 20, 40);
    
    // Report metadata
    doc.setFontSize(12);
    doc.text(`Generated: ${format(new Date(data.generatedAt), 'MMM dd, yyyy HH:mm')}`, 20, 55);
    doc.text(`Total Reports: ${data.reports.length}`, 20, 65);
    
    // Summary statistics
    if (data.stats) {
      autoTable(doc, {
        startY: 80,
        head: [['Metric', 'Count']],
        body: [
          ['Total Observations', data.stats.total],
          ['Open Items', data.stats.open],
          ['Closed Items', data.stats.closed],
          ['Unsafe Acts', data.stats.unsafeActs],
          ['Unsafe Conditions', data.stats.unsafeConditions],
          ['Safe Behaviors', data.stats.safeBehaviors]
        ],
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235] }
      });
    }
    
    // Reports summary
    if (data.reports.length > 0) {
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Report #', 'Type', 'Severity', 'Status', 'Plant', 'Date']],
        body: data.reports.map((report: any) => [
          report.reportNumber,
          report.observationType.replace('_', ' ').toUpperCase(),
          report.severity.toUpperCase(),
          report.status.replace('_', ' ').toUpperCase(),
          report.plantId?.name || 'N/A',
          format(new Date(report.createdAt), 'MMM dd, yyyy')
        ]),
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235] }
      });
    }
    
    doc.save(`BBS_Summary_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  }
};