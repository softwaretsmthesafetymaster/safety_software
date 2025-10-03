import ExcelJS from 'exceljs';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, AlignmentType } from 'docx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';
export class DownloadService {
  static async downloadExcel(assessment) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('HIRA Assessment');

    worksheet.columns = [
      { header: 'Task Name', key: 'taskName', width: 20 },
      { header: 'Activity/Service', key: 'activityService', width: 20 },
      { header: 'R/NR', key: 'routineNonRoutine', width: 8 },
      { header: 'Hazard/Concern', key: 'hazardConcern', width: 20 },
      { header: 'Hazard Description', key: 'hazardDescription', width: 30 },
      { header: 'Likelihood', key: 'likelihood', width: 12 },
      { header: 'Consequence', key: 'consequence', width: 12 },
      { header: 'Risk Score', key: 'riskScore', width: 12 },
      { header: 'Existing Risk Control', key: 'existingRiskControl', width: 25 },
      { header: 'S/NS', key: 'significantNotSignificant', width: 8 },
      { header: 'Risk Category', key: 'riskCategory', width: 15 },
      { header: 'Recommendation', key: 'recommendation', width: 30 }
    ];

    worksheet.addRow([]);
    worksheet.addRow(['HIRA Assessment Report']);
    worksheet.addRow(['Assessment Number:', assessment.assessmentNumber]);
    worksheet.addRow(['Title:', assessment.title]);
    worksheet.addRow(['Plant:', assessment.plantId?.name]);
    worksheet.addRow(['Process:', assessment.process]);
    worksheet.addRow(['Assessment Date:', new Date(assessment.assessmentDate).toLocaleDateString()]);
    worksheet.addRow(['Assessor:', assessment.assessor?.name]);
    worksheet.addRow([]);

    worksheet.getRow(2).font = { bold: true, size: 16 };
    worksheet.getRow(2).alignment = { horizontal: 'center' };

    const headerRow = worksheet.addRow([
      'Task Name', 'Activity/Service', 'R/NR', 'Hazard/Concern',
      'Hazard Description', 'Likelihood', 'Consequence', 'Risk Score',
      'Existing Risk Control', 'S/NS', 'Risk Category', 'Recommendation'
    ]);

    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    assessment.worksheetRows.forEach(row => {
      const dataRow = worksheet.addRow([
        row.taskName,
        row.activityService,
        row.routineNonRoutine === 'Routine' ? 'R' : 'NR',
        row.hazardConcern,
        row.hazardDescription,
        row.likelihood,
        row.consequence,
        row.riskScore,
        row.existingRiskControl,
        row.significantNotSignificant === 'Significant' ? 'S' : 'NS',
        row.riskCategory,
        row.recommendation
      ]);

      dataRow.eachCell((cell) => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });

      const riskCell = dataRow.getCell(11);
      switch (row.riskCategory) {
        case 'Very High': riskCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } }; riskCell.font = { color: { argb: 'FFFFFFFF' } }; break;
        case 'High': riskCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF6B6B' } }; break;
        case 'Moderate': riskCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } }; break;
        case 'Low': riskCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF90EE90' } }; break;
        case 'Very Low': riskCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00FF00' } }; break;
      }
    });

    worksheet.addRow([]);
    worksheet.addRow(['Risk Summary']);
    worksheet.addRow(['Total Tasks:', assessment.riskSummary?.totalTasks || 0]);
    worksheet.addRow(['High Risk Items:', assessment.riskSummary?.highRiskCount || 0]);
    worksheet.addRow(['Moderate Risk Items:', assessment.riskSummary?.moderateRiskCount || 0]);
    worksheet.addRow(['Low Risk Items:', assessment.riskSummary?.lowRiskCount || 0]);
    worksheet.addRow(['Significant Risks:', assessment.riskSummary?.significantRisks || 0]);

    return await workbook.xlsx.writeBuffer();
  }

  static async downloadWord(assessment) {
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ text: 'HIRA Assessment Report', heading: 'Title', alignment: AlignmentType.CENTER }),
          new Paragraph({ text: `Assessment Number: ${assessment.assessmentNumber}` }),
          new Paragraph({ text: `Title: ${assessment.title}` }),
          new Paragraph({ text: `Plant: ${assessment.plantId?.name}` }),
          new Paragraph({ text: `Process: ${assessment.process}` }),
          new Paragraph({ text: `Assessment Date: ${new Date(assessment.assessmentDate).toLocaleDateString()}` }),
          new Paragraph({ text: `Assessor: ${assessment.assessor?.name}` }),
          new Paragraph({ text: '' }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: ['Task Name','Activity/Service','R/NR','Hazard/Concern','Hazard Description','Likelihood','Consequence','Risk Score','Existing Risk Control','S/NS','Risk Category','Recommendation']
                  .map(h => new TableCell({ children: [new Paragraph(h)] }))
              }),
              ...assessment.worksheetRows.map(row => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph(row.taskName)] }),
                  new TableCell({ children: [new Paragraph(row.activityService)] }),
                  new TableCell({ children: [new Paragraph(row.routineNonRoutine === 'Routine' ? 'R' : 'NR')] }),
                  new TableCell({ children: [new Paragraph(row.hazardConcern)] }),
                  new TableCell({ children: [new Paragraph(row.hazardDescription)] }),
                  new TableCell({ children: [new Paragraph(String(row.likelihood))] }),
                  new TableCell({ children: [new Paragraph(String(row.consequence))] }),
                  new TableCell({ children: [new Paragraph(String(row.riskScore))] }),
                  new TableCell({ children: [new Paragraph(row.existingRiskControl)] }),
                  new TableCell({ children: [new Paragraph(row.significantNotSignificant === 'Significant' ? 'S' : 'NS')] }),
                  new TableCell({ children: [new Paragraph(row.riskCategory)] }),
                  new TableCell({ children: [new Paragraph(row.recommendation)] })
                ]
              }))
            ]
          }),
          new Paragraph({ text: 'Risk Summary', heading: 'Heading1' }),
          new Paragraph({ text: `Total Tasks: ${assessment.riskSummary?.totalTasks || 0}` }),
          new Paragraph({ text: `High Risk Items: ${assessment.riskSummary?.highRiskCount || 0}` }),
          new Paragraph({ text: `Moderate Risk Items: ${assessment.riskSummary?.moderateRiskCount || 0}` }),
          new Paragraph({ text: `Low Risk Items: ${assessment.riskSummary?.lowRiskCount || 0}` }),
          new Paragraph({ text: `Significant Risks: ${assessment.riskSummary?.significantRisks || 0}` })
        ]
      }]
    });

    return await Packer.toBlob(doc);
  }

  static async downloadPDF(assessment) {
    const doc = new jsPDF('landscape');
    doc.setFontSize(20);
    doc.text('HIRA Assessment Report', 20, 20);
    doc.setFontSize(12);
    doc.text(`Assessment Number: ${assessment.assessmentNumber}`, 20, 35);
    doc.text(`Title: ${assessment.title}`, 20, 45);
    doc.text(`Plant: ${assessment.plantId?.name}`, 20, 55);
    doc.text(`Process: ${assessment.process}`, 20, 65);
    doc.text(`Assessment Date: ${new Date(assessment.assessmentDate).toLocaleDateString()}`, 20, 75);
    doc.text(`Assessor: ${assessment.assessor?.name}`, 20, 85);

    const tableData = assessment.worksheetRows.map(row => [
      row.taskName,
      row.activityService,
      row.routineNonRoutine === 'Routine' ? 'R' : 'NR',
      row.hazardConcern,
      row.hazardDescription,
      String(row.likelihood),
      String(row.consequence),
      String(row.riskScore),
      row.existingRiskControl,
      row.significantNotSignificant === 'Significant' ? 'S' : 'NS',
      row.riskCategory,
      row.recommendation
    ]);

    autoTable(doc, {
      head: [[
        'Task Name','Activity/Service','R/NR','Hazard/Concern',
        'Hazard Description','Likelihood','Consequence','Risk Score',
        'Existing Risk Control','S/NS','Risk Category','Recommendation'
      ]],
      body: tableData,
      startY: 95,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [200,200,200] },
      didParseCell: (data) => {
        if (data.column.index === 10 && data.section === 'body') {
          const riskCategory = data.cell.text[0];
          switch (riskCategory) {
            case 'Very High': data.cell.styles.fillColor = [255,0,0]; data.cell.styles.textColor = [255,255,255]; break;
            case 'High': data.cell.styles.fillColor = [255,107,107]; break;
            case 'Moderate': data.cell.styles.fillColor = [255,255,0]; break;
            case 'Low': data.cell.styles.fillColor = [144,238,144]; break;
            case 'Very Low': data.cell.styles.fillColor = [0,255,0]; break;
          }
        }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(14);
    doc.text('Risk Summary', 20, finalY);
    doc.setFontSize(12);
    doc.text(`Total Tasks: ${assessment.riskSummary?.totalTasks || 0}`, 20, finalY + 15);
    doc.text(`High Risk Items: ${assessment.riskSummary?.highRiskCount || 0}`, 20, finalY + 25);
    doc.text(`Moderate Risk Items: ${assessment.riskSummary?.moderateRiskCount || 0}`, 20, finalY + 35);
    doc.text(`Low Risk Items: ${assessment.riskSummary?.lowRiskCount || 0}`, 20, finalY + 45);
    doc.text(`Significant Risks: ${assessment.riskSummary?.significantRisks || 0}`, 20, finalY + 55);

    return doc.output('arraybuffer');
  }

  // 🔥 Wrapper
  static async download(format: 'pdf' | 'excel' | 'word', assessment) {
    let buffer: ArrayBuffer;
    let blob: Blob;
    let fileName: string;

    if (format === 'excel') {
      buffer = await this.downloadExcel(assessment);
      blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fileName = 'hira_assessment.xlsx';
    } else if (format === 'word') {
      blob = await this.downloadWord(assessment);
      // blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      fileName = 'hira_assessment.docx';
    } else {
      buffer = await this.downloadPDF(assessment);
      blob = new Blob([buffer], { type: 'application/pdf' });
      fileName = 'hira_assessment.pdf';
    }

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
}
