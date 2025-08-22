import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export class ExportService {
  // PDF Export
  static exportToPDF(data: any, title: string, type: 'permit' | 'incident' | 'audit' | 'hazop' | 'hira' | 'bbs') {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text(title, 20, 20);
    
    // Company info (if available)
    if (data.company) {
      doc.setFontSize(12);
      doc.text(`Company: ${data.company.name}`, 20, 35);
      doc.text(`Plant: ${data.plant?.name || 'N/A'}`, 20, 45);
    }
    
    let yPosition = 60;
    
    switch (type) {
      case 'permit':
        yPosition = this.addPermitToPDF(doc, data, yPosition);
        break;
      case 'incident':
        yPosition = this.addIncidentToPDF(doc, data, yPosition);
        break;
      case 'audit':
        yPosition = this.addAuditToPDF(doc, data, yPosition);
        break;
      case 'hazop':
        yPosition = this.addHAZOPToPDF(doc, data, yPosition);
        break;
      case 'hira':
        yPosition = this.addHIRAToPDF(doc, data, yPosition);
        break;
      case 'bbs':
        yPosition = this.addBBSToPDF(doc, data, yPosition);
        break;
    }
    
    // Footer
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, doc.internal.pageSize.height - 20);
    
    doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
  }

  private static addPermitToPDF(doc: jsPDF, permit: any, yPosition: number): number {
    doc.setFontSize(14);
    doc.text('Permit Details', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(10);
    const details = [
      `Permit Number: ${permit.permitNumber}`,
      `Work Description: ${permit.workDescription}`,
      `Location: ${permit.location?.area}`,
      `Start Date: ${new Date(permit.schedule?.startDate).toLocaleDateString()}`,
      `End Date: ${new Date(permit.schedule?.endDate).toLocaleDateString()}`,
      `Status: ${permit.status}`,
      `Requested By: ${permit.requestedBy?.name}`
    ];
    
    details.forEach(detail => {
      doc.text(detail, 20, yPosition);
      yPosition += 10;
    });
    
    return yPosition + 10;
  }

  private static addIncidentToPDF(doc: jsPDF, incident: any, yPosition: number): number {
    doc.setFontSize(14);
    doc.text('Incident Details', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(10);
    const details = [
      `Incident Number: ${incident.incidentNumber}`,
      `Type: ${incident.type}`,
      `Severity: ${incident.severity}`,
      `Description: ${incident.description}`,
      `Date/Time: ${new Date(incident.dateTime).toLocaleString()}`,
      `Location: ${incident.location?.area}`,
      `Reported By: ${incident.reportedBy?.name}`,
      `Status: ${incident.status}`
    ];
    
    details.forEach(detail => {
      doc.text(detail, 20, yPosition);
      yPosition += 10;
    });
    
    return yPosition + 10;
  }

  private static addAuditToPDF(doc: jsPDF, audit: any, yPosition: number): number {
    doc.setFontSize(14);
    doc.text('Audit Details', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(10);
    const details = [
      `Audit Number: ${audit.auditNumber}`,
      `Title: ${audit.title}`,
      `Type: ${audit.type}`,
      `Standard: ${audit.standard}`,
      `Scope: ${audit.scope}`,
      `Scheduled Date: ${new Date(audit.scheduledDate).toLocaleDateString()}`,
      `Auditor: ${audit.auditor?.name}`,
      `Status: ${audit.status}`
    ];
    
    details.forEach(detail => {
      doc.text(detail, 20, yPosition);
      yPosition += 10;
    });
    
    return yPosition + 10;
  }

  private static addHAZOPToPDF(doc: jsPDF, hazop: any, yPosition: number): number {
    doc.setFontSize(14);
    doc.text('HAZOP Study Details', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(10);
    const details = [
      `Study Number: ${hazop.studyNumber}`,
      `Title: ${hazop.title}`,
      `Methodology: ${hazop.methodology}`,
      `Process: ${hazop.process?.name}`,
      `Facilitator: ${hazop.facilitator?.name}`,
      `Status: ${hazop.status}`
    ];
    
    details.forEach(detail => {
      doc.text(detail, 20, yPosition);
      yPosition += 10;
    });
    
    return yPosition + 10;
  }

  private static addHIRAToPDF(doc: jsPDF, hira: any, yPosition: number): number {
    doc.setFontSize(14);
    doc.text('HIRA Assessment Details', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(10);
    const details = [
      `Assessment Number: ${hira.assessmentNumber}`,
      `Title: ${hira.title}`,
      `Area: ${hira.area}`,
      `Process: ${hira.process}`,
      `Assessment Date: ${new Date(hira.assessmentDate).toLocaleDateString()}`,
      `Assessor: ${hira.assessor?.name}`,
      `Status: ${hira.status}`
    ];
    
    details.forEach(detail => {
      doc.text(detail, 20, yPosition);
      yPosition += 10;
    });
    
    return yPosition + 10;
  }

  private static addBBSToPDF(doc: jsPDF, bbs: any, yPosition: number): number {
    doc.setFontSize(14);
    doc.text('BBS Observation Details', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(10);
    const details = [
      `Report Number: ${bbs.reportNumber}`,
      `Observation Type: ${bbs.observationType}`,
      `Category: ${bbs.category}`,
      `Description: ${bbs.description}`,
      `Severity: ${bbs.severity}`,
      `Observation Date: ${new Date(bbs.observationDate).toLocaleDateString()}`,
      `Observer: ${bbs.observer?.name}`,
      `Status: ${bbs.status}`
    ];
    
    details.forEach(detail => {
      doc.text(detail, 20, yPosition);
      yPosition += 10;
    });
    
    return yPosition + 10;
  }

  // Excel Export
  static exportToExcel(data: any[], title: string, type: string) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    
    XLSX.utils.book_append_sheet(workbook, worksheet, title);
    
    // Auto-size columns
    const colWidths = Object.keys(data[0] || {}).map(key => ({
      wch: Math.max(key.length, 15)
    }));
    worksheet['!cols'] = colWidths;
    
    XLSX.writeFile(workbook, `${title.replace(/\s+/g, '_')}.xlsx`);
  }

  // Word Export (simplified)
  static exportToWord(data: any, title: string) {
    // Create a simple HTML document that can be opened in Word
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #333; border-bottom: 2px solid #333; }
            h2 { color: #666; margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .header { margin-bottom: 30px; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${title}</h1>
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>
          
          <div class="content">
            ${this.generateWordContent(data)}
          </div>
          
          <div class="footer">
            <p>This document was generated by SafetyPro Safety Management System</p>
          </div>
        </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g, '_')}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private static generateWordContent(data: any): string {
    if (Array.isArray(data)) {
      // Generate table for array data
      if (data.length === 0) return '<p>No data available</p>';
      
      const headers = Object.keys(data[0]);
      let html = '<table><thead><tr>';
      
      headers.forEach(header => {
        html += `<th>${header.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</th>`;
      });
      
      html += '</tr></thead><tbody>';
      
      data.forEach(row => {
        html += '<tr>';
        headers.forEach(header => {
          const value = row[header];
          html += `<td>${typeof value === 'object' ? JSON.stringify(value) : value || ''}</td>`;
        });
        html += '</tr>';
      });
      
      html += '</tbody></table>';
      return html;
    } else {
      // Generate key-value pairs for object data
      let html = '<table>';
      Object.entries(data).forEach(([key, value]) => {
        html += `<tr><th>${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</th><td>${typeof value === 'object' ? JSON.stringify(value) : value || ''}</td></tr>`;
      });
      html += '</table>';
      return html;
    }
  }

  // Bulk export for multiple items
  static exportBulkToExcel(items: any[], type: string, companyName: string) {
    const workbook = XLSX.utils.book_new();
    
    // Summary sheet
    const summaryData = [
      { Field: 'Total Records', Value: items.length },
      { Field: 'Export Date', Value: new Date().toLocaleDateString() },
      { Field: 'Company', Value: companyName },
      { Field: 'Type', Value: type.toUpperCase() }
    ];
    
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    
    // Data sheet
    if (items.length > 0) {
      const dataSheet = XLSX.utils.json_to_sheet(items);
      XLSX.utils.book_append_sheet(workbook, dataSheet, 'Data');
    }
    
    XLSX.writeFile(workbook, `${type}_export_${new Date().toISOString().split('T')[0]}.xlsx`);
  }
}