import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  HeadingLevel,
  AlignmentType,
  WidthType,
  TextRun,
  VerticalAlign,
} from 'docx';

export const generateAuditReport = async (audit, format, company = null) => {
  switch (format) {
    case 'pdf':
      return generatePDFReport(audit, company);
    case 'excel':
      return generateExcelReport(audit, company);
    case 'word':
    return generateWordReport(audit, company);
    default:
      throw new Error('Unsupported format');
  }
};

/* -------------------- PDF -------------------- */
const generatePDFReport = async (audit, company) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Use a smaller margin of 30 to give more space for the table
      const doc = new PDFDocument({ margin: 30, bufferPages: true, autoFirstPage: false });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      
      // Load company logo if it exists
      let companyLogoBuffer = null;
      if (company?.logo) {
        try {
          // Check if the logo path is a URL
          const isUrl = URL.canParse(company.logo);
          if (isUrl) {
            // Fetch the image data from the URL
            const response = await fetch(company.logo);
            if (!response.ok) {
              throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
            }
            // Store the image data in a buffer
            companyLogoBuffer = Buffer.from(await response.arrayBuffer());
          }
        } catch (error) {
          console.error("Error loading company logo:", error);
        }
      }

      const addPageWithHeader = (isFirstPage = false) => {
        if (!isFirstPage) {
          doc.addPage();
        } else {
          doc.addPage();
          doc.switchToPage(0);
        }
        
        // Header
        const headerY = 30; // Adjust header Y to new margin
        if (companyLogoBuffer) {
          // Reduced logo width to 70 as requested
          doc.image(companyLogoBuffer, 30, headerY, { width: 70 });
        } else if (company?.logo) {
          // If a logo path is provided but it's not a URL, assume it's a local file path
          try {
            // Reduced logo width to 70 as requested
            doc.image(company.logo, 30, headerY, { width: 70 });
          } catch (error) {
            console.error("Error loading local company logo:", error);
          }
        }
        doc.fontSize(24).fillColor('#1f2937').text(company?.name || 'Safety Audit System', 140, headerY + 10);
        // Removed the address as requested
        
        doc.moveDown(2);
        doc.fontSize(20).fillColor('#1f2937').text('Safety Audit Report', { align: 'center' });
        doc.moveDown(0.5);
      };

      addPageWithHeader(true);

      // Audit Information
      let currentY = doc.y;
      doc.rect(30, currentY, doc.page.width - 60, 120).stroke('#e5e7eb');
      doc.fontSize(14).fillColor('#374151').text('Audit Information', 40, currentY + 10);
      doc.fontSize(11).fillColor('#000000');
      doc.text(`Audit Number: ${audit.auditNumber || ''}`, 40, currentY + 35);
      doc.text(`Title: ${audit.title || ''}`, 40, currentY + 50);
      doc.text(`Plant: ${audit.plantId?.name || 'N/A'}`, 40, currentY + 65);
      doc.text(`Standard: ${audit.standard || ''}`, 40, currentY + 80);
      doc.text(`Date: ${audit.scheduledDate ? new Date(audit.scheduledDate).toLocaleDateString() : ''}`, 300, currentY + 35);
      doc.text(`Status: ${(audit.status || '').toUpperCase()}`, 300, currentY + 50);
      doc.text(`Auditor: ${audit.auditor?.name || 'N/A'}`, 300, currentY + 65);
      doc.text(`Type: ${(audit.type || '').toUpperCase()}`, 300, currentY + 80);
      currentY += 140;
      doc.y = currentY;

      // Compliance Summary
      if (audit.summary) {
        if (currentY + 100 > doc.page.height - 100) {
          addPageWithHeader();
          currentY = doc.y;
        }
        doc.fontSize(16).fillColor('#1f2937').text('Compliance Summary', 30, currentY);
        doc.moveDown(0.5);
        currentY = doc.y;

        doc.rect(30, currentY, doc.page.width - 60, 80).stroke('#e5e7eb');

        const boxWidth = (doc.page.width - 60) / 4;
        const boxes = [
          { label: 'Total Questions', value: audit.summary.totalQuestions || 0, color: '#3b82f6' },
          { label: 'Compliance %', value: `${Math.round(audit.summary.compliancePercentage || 0)}%`, color: '#10b981' },
          { label: 'Yes Answers', value: audit.summary.yesAnswers || 0, color: '#10b981' },
          { label: 'No Answers', value: audit.summary.noAnswers || 0, color: '#ef4444' },
        ];

        boxes.forEach((box, index) => {
          const x = 30 + index * boxWidth;
          doc.fillColor(box.color).fontSize(18).text(box.value.toString(), x, currentY + 20, {
            width: boxWidth,
            align: 'center',
          });
          doc.fillColor('#000000').fontSize(10).text(box.label, x, currentY + 45, {
            width: boxWidth,
            align: 'center',
          });
        });
        currentY += 100;
        doc.y = currentY;
      }

      // Observations Table
      if (audit.observations?.length > 0) {
        if (currentY + 50 + 40 > doc.page.height - 100) {
          addPageWithHeader();
          currentY = doc.y;
        }

        doc.fontSize(16).fillColor('#1f2937').text('Observations & Actions', 30, currentY);
        doc.moveDown(0.5);
        currentY = doc.y;

        const tableTop = currentY;
        const headerRowHeight = 25;
        const cellPadding = 3;
        const availableWidth = doc.page.width - 60;

        // Adjusted column widths to sum to 1.0 (100%)
        const columns = [
          { header: 'S.No', width: availableWidth * 0.04, align: 'center' },
          { header: 'Observation', width: availableWidth * 0.17, align: 'left' },
          { header: 'Element', width: availableWidth * 0.1, align: 'left' },
          { header: 'Legal Standard', width: availableWidth * 0.1, align: 'left' },
          { header: 'Risk', width: availableWidth * 0.08, align: 'center' },
          { header: 'Score', width: availableWidth * 0.06, align: 'center' },
          { header: 'Recommendation', width: availableWidth * 0.15, align: 'left' },
          { header: 'Responsible', width: availableWidth * 0.11, align: 'left' },
          { header: 'Status', width: availableWidth * 0.07, align: 'center' },
          { header: 'Action', width: availableWidth * 0.12, align: 'left' },
        ];
        
        const startX = 30;
        const totalTableWidth = availableWidth;

        // Draw Header
        let currentHeaderX = startX;
        doc.rect(startX, tableTop, totalTableWidth, headerRowHeight).fillAndStroke('#f3f4f6', '#e5e7eb');
        doc.fillColor('#000000').fontSize(8);
        columns.forEach((col) => {
          doc.text(col.header, currentHeaderX + cellPadding, tableTop + (headerRowHeight / 2) - 4, {
            width: col.width - (2 * cellPadding),
            align: col.align,
          });
          currentHeaderX += col.width;
        });

        currentY = tableTop + headerRowHeight;

        for (let i = 0; i < audit.observations.length; i++) {
          const obs = audit.observations[i];
          const rowData = [
            (i + 1).toString(),
            obs.observation || '',
            obs.element || '',
            obs.legalStandard || '',
            (obs.riskLevel || '').replace('_', ' ').toUpperCase(),
            (obs.riskScore || '').toString(),
            obs.recommendation || '',
            obs.responsiblePerson?.name || 'Unassigned',
            (obs.status || '').replace('_', ' ').toUpperCase(),
            obs.actionTaken || '',
          ];

          let maxRowContentHeight = 0;
          const calculatedHeights = rowData.map((text, colIndex) => {
            const colWidth = columns[colIndex].width - (2 * cellPadding);
            const textHeight = doc.heightOfString(text, { width: colWidth, fontSize: 8 });
            maxRowContentHeight = Math.max(maxRowContentHeight, textHeight);
            return textHeight;
          });
          const actualRowHeight = maxRowContentHeight + (2 * cellPadding) + 5;

          if (currentY + actualRowHeight > doc.page.height - 50) {
            addPageWithHeader();
            doc.fontSize(16).fillColor('#1f2937').text('Observations & Actions (continued)', 30, doc.y);
            doc.moveDown(0.5);
            currentY = doc.y;

            currentHeaderX = startX;
            doc.rect(startX, currentY, totalTableWidth, headerRowHeight).fillAndStroke('#f3f4f6', '#e5e7eb');
            doc.fillColor('#000000').fontSize(8);
            columns.forEach((col) => {
              doc.text(col.header, currentHeaderX + cellPadding, currentY + (headerRowHeight / 2) - 4, {
                width: col.width - (2 * cellPadding),
                align: col.align,
              });
              currentHeaderX += col.width;
            });
            currentY += headerRowHeight;
          }

          let currentCellX = startX;
          const isEvenRow = i % 2 === 0;

          rowData.forEach((text, colIndex) => {
            const col = columns[colIndex];
            const colWidth = col.width;
            const textY = currentY + (actualRowHeight - calculatedHeights[colIndex]) / 2;

            if (col.header === 'Risk') {
              const riskColor = getRGBColorHex(obs.riskLevel);
              doc.fillColor(riskColor).rect(currentCellX, currentY, colWidth, actualRowHeight).fill();
              doc.fillColor('#ffffff'); // Set text to white for contrast
            } else {
              doc.fillColor(isEvenRow ? '#ffffff' : '#f9fafb').rect(currentCellX, currentY, colWidth, actualRowHeight).fill();
              doc.fillColor('#000000'); // Reset text to black for other cells
            }

            // Draw the border for the cell
            doc.strokeColor('#e5e7eb').rect(currentCellX, currentY, colWidth, actualRowHeight).stroke();

            // Render the text
            doc.text(text, currentCellX + cellPadding, textY, {
              width: col.width - (2 * cellPadding),
              align: col.align,
              fontSize: 8,
              lineGap: 2,
            });
            currentCellX += col.width;
          });

          currentY += actualRowHeight;
        }
      }

      // Footer
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).fillColor('#9ca3af').text(
          `Generated on ${new Date().toLocaleDateString()} | Page ${i + 1} of ${pageCount}`,
          30,
          doc.page.height - 30,
          { align: 'center' }
        );
      }
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

/* -------------------- Excel -------------------- */
const generateExcelReport = async (audit, company) => {
  const safe = (v) => (v !== null && v !== undefined ? v.toString() : '');

  const workbook = new ExcelJS.Workbook();
  workbook.creator = company?.name || 'Safety Audit System';
  workbook.created = new Date();
  const worksheet = workbook.addWorksheet('Audit Report');

  worksheet.mergeCells('A1:J2');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = company?.name || 'Safety Audit System';
  titleCell.font = { size: 18, bold: true, color: { argb: 'FF1f2937' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.addRow([]);
  worksheet.addRow(['AUDIT INFORMATION']).font = { bold: true, size: 14 };

  worksheet.addRow(['Audit Number:', safe(audit.auditNumber), '', 'Date:', audit.scheduledDate ? new Date(audit.scheduledDate).toLocaleDateString() : '']);
  worksheet.addRow(['Title:', safe(audit.title), '', 'Status:', safe(audit.status).toUpperCase()]);
  worksheet.addRow(['Plant:', audit.plantId?.name || 'N/A', '', 'Auditor:', audit.auditor?.name || 'N/A']);
  worksheet.addRow(['Standard:', safe(audit.standard), '', 'Type:', safe(audit.type).toUpperCase()]);

  if (audit.summary) {
    worksheet.addRow([]);
    worksheet.addRow(['COMPLIANCE SUMMARY']).font = { bold: true, size: 14 };

    worksheet.addRow(['Total Questions', 'Compliance %', 'Yes Answers', 'No Answers', 'N/A Answers']);
    worksheet.addRow([
      audit.summary.totalQuestions || 0,
      `${Math.round(audit.summary.compliancePercentage || 0)}%`,
      audit.summary.yesAnswers || 0,
      audit.summary.noAnswers || 0,
      audit.summary.naAnswers || 0,
    ]);
  }

  if (audit.observations?.length > 0) {
    worksheet.addRow([]);
    worksheet.addRow(['OBSERVATIONS & ACTIONS']).font = { bold: true, size: 14 };

    // Column headers
    const headerRow = worksheet.addRow([
      'S.No',
      'Observation',
      'Element',
      'Legal Standard',
      'Risk',
      'Risk Score',
      'Recommendation',
      'Responsible Person',
      'Status',
      'Action',
    ]);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.alignment = { horizontal: 'center' };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF3F4F6' },
      };
    });

    // Data rows with risk color
    audit.observations.forEach((obs, index) => {
      const row = worksheet.addRow([
        index + 1,
        safe(obs.observation),
        safe(obs.element),
        safe(obs.legalStandard),
        safe(obs.riskLevel).replace('_', ' ').toUpperCase(),
        safe(obs.riskScore),
        safe(obs.recommendation),
        obs.responsiblePerson?.name || 'Unassigned',
        safe(obs.status).replace('_', ' ').toUpperCase(),
        safe(obs.actionTaken),
      ]);

      const riskCell = row.getCell(5);
      const color = getRiskColorHex(obs.riskLevel);
      riskCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
      riskCell.font = { color: { argb: 'FFFFFFFF' } };
      riskCell.alignment = { horizontal: 'center' };

      row.eachCell((cell) => {
        cell.alignment = { wrapText: true, vertical: 'top' };
      });
    });
  }

  // Adjust column widths
  worksheet.columns = [
    { key: 'S.No', width: 8 },
    { key: 'Observation', width: 25 },
    { key: 'Element', width: 15 },
    { key: 'Legal Standard', width: 20 },
    { key: 'Risk', width: 15 },
    { key: 'Risk Score', width: 15 },
    { key: 'Recommendation', width: 25 },
    { key: 'Responsible Person', width: 25 },
    { key: 'Status', width: 15 },
    { key: 'Action', width: 25 },
  ];

  return await workbook.xlsx.writeBuffer();
};

/* -------------------- Word -------------------- */
const generateWordReport = async (audit, company) => {
  const safe = (v) => (v !== null && v !== undefined ? v.toString() : '');

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: safe(company?.name || 'Safety Audit System'), heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
          // new Paragraph({ text: safe(company?.address || 'Professional Audit Management'), alignment: AlignmentType.CENTER }),
          new Paragraph({ text: 'Safety Audit Report', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
          new Paragraph({ text: 'Audit Information', heading: HeadingLevel.HEADING_2 }),
          new Table({
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Audit Number')] }),
                  new TableCell({ children: [new Paragraph(safe(audit.auditNumber))] }),
                  new TableCell({ children: [new Paragraph('Date')] }),
                  new TableCell({ children: [new Paragraph(audit.scheduledDate ? new Date(audit.scheduledDate).toLocaleDateString() : '')] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Title')] }),
                  new TableCell({ children: [new Paragraph(safe(audit.title))] }),
                  new TableCell({ children: [new Paragraph('Status')] }),
                  new TableCell({ children: [new Paragraph(safe(audit.status).toUpperCase())] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Plant')] }),
                  new TableCell({ children: [new Paragraph(safe(audit.plantId?.name))] }),
                  new TableCell({ children: [new Paragraph('Auditor')] }),
                  new TableCell({ children: [new Paragraph(safe(audit.auditor?.name))] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Standard')] }),
                  new TableCell({ children: [new Paragraph(safe(audit.standard))] }),
                  new TableCell({ children: [new Paragraph('Type')] }),
                  new TableCell({ children: [new Paragraph(safe(audit.type).toUpperCase())] }),
                ],
              }),
            ],
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
          ...(audit.observations?.length > 0
            ? [
              new Paragraph({ text: '', spacing: { after: 200 } }),
              new Paragraph({ text: 'Observations & Actions', heading: HeadingLevel.HEADING_2 }),
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    tableHeader: true,
                    children: [
                      new TableCell({ children: [new Paragraph({ text: 'S.No', alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER }),
                      new TableCell({ children: [new Paragraph({ text: 'Observation', alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER }),
                      new TableCell({ children: [new Paragraph({ text: 'Element', alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER }),
                      new TableCell({ children: [new Paragraph({ text: 'Legal Standard', alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER }),
                      new TableCell({ children: [new Paragraph({ text: 'Risk', alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER }),
                      new TableCell({ children: [new Paragraph({ text: 'Risk Score', alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER }),
                      new TableCell({ children: [new Paragraph({ text: 'Recommendation', alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER }),
                      new TableCell({ children: [new Paragraph({ text: 'Responsible Person', alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER }),
                      new TableCell({ children: [new Paragraph({ text: 'Status', alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER }),
                      new TableCell({ children: [new Paragraph({ text: 'Action', alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER }),
                    ],
                    tableHeader: true,
                    shading: { fill: 'F3F4F6' }
                  }),
                  ...audit.observations.map(
                    (obs, index) =>
                      new TableRow({
                        children: [
                          new TableCell({ children: [new Paragraph({ text: (index + 1).toString(), alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER }),
                          new TableCell({ children: [new Paragraph(safe(obs.observation))] }),
                          new TableCell({ children: [new Paragraph(safe(obs.element))] }),
                          new TableCell({ children: [new Paragraph(safe(obs.legalStandard))] }),
                          new TableCell({
                            children: [new Paragraph({
                              children: [
                                new TextRun({
                                  text: safe(obs.riskLevel).replace('_', ' ').toUpperCase(),
                                  color: 'FFFFFF',
                                  bold: true,
                                }),
                              ],
                              alignment: AlignmentType.CENTER
                            })],
                            shading: { fill: getRiskColorHex(obs.riskLevel).substring(2) },
                            verticalAlign: VerticalAlign.CENTER,
                          }),
                          new TableCell({ children: [new Paragraph({ text: safe(obs.riskScore), alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER }),
                          new TableCell({ children: [new Paragraph(safe(obs.recommendation))] }),
                          new TableCell({ children: [new Paragraph(safe(obs.responsiblePerson?.name || 'Unassigned'))] }),
                          new TableCell({ children: [new Paragraph({ text: safe(obs.status).replace('_', ' ').toUpperCase(), alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER }),
                          new TableCell({ children: [new Paragraph(safe(obs.actionTaken))] }),
                        ],
                      })
                  ),
                ],
                columnWidths: [5, 20, 10, 15, 10, 10, 20, 15, 10, 15],
              }),
            ]
            : []),
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
};

/* -------------------- Helpers -------------------- */
const getRiskColorHex = (riskLevel) => {
  switch ((riskLevel || '').toLowerCase()) {
    case 'low':
      return 'FF90EE90';
    case 'medium':
      return 'FFFFA500';
    case 'high':
      return 'FFFF6B6B';
    case 'very_high':
      return 'FF8B0000';
    case 'very_low':
      return 'FFADD8E6';
    default:
      return 'FFFFFFFF';
  }
};

const getRGBColorHex = (riskLevel) => {
  const argb = getRiskColorHex(riskLevel);
  return `#${argb.substring(2)}`;
};
