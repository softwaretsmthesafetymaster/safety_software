    import jsPDF from 'jspdf';
    import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';
    import * as XLSX from 'xlsx';

    interface HAZOPExportData {
    study: any;
    format: 'pdf' | 'excel' | 'word';
    }

    class ExportService {
    async exportHAZOPStudy({ study, format }: HAZOPExportData) {
        switch (format) {
        case 'pdf':
            return this.exportToPDF(study);
        case 'excel':
            return this.exportToExcel(study);
        case 'word':
            return this.exportToWord(study);
        default:
            throw new Error('Unsupported export format');
        }
    }

    private async exportToPDF(study: any) {
        const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
        
        // Title Page
        doc.setFontSize(20);
        doc.text('HAZOP Study Report', 20, 30);
        
        doc.setFontSize(12);
        doc.text(`Study: ${study.title}`, 20, 45);
        doc.text(`Study Number: ${study.studyNumber}`, 20, 55);
        doc.text(`Plant: ${study.plantId?.name}`, 20, 65);
        doc.text(`Methodology: ${study.methodology}`, 20, 75);
        doc.text(`Status: ${study.status.toUpperCase()}`, 20, 85);
        doc.text(`Created: ${new Date(study.createdAt).toLocaleDateString()}`, 20, 95);

        // Team Information
        doc.text('Study Team:', 20, 115);
        doc.text(`Chairman: ${study.chairman?.name}`, 25, 125);
        doc.text(`Scribe: ${study.scribe?.name}`, 25, 135);
        doc.text(`Facilitator: ${study.facilitator?.name}`, 25, 145);

        // Team Members
        if (study.team?.length > 0) {
        doc.text('Team Members:', 25, 160);
        study.team.forEach((member: any, index: number) => {
            doc.text(`• ${member.member?.name} (${member.role})`, 30, 170 + (index * 8));
        });
        }

        // Worksheet Data
        if (study.nodes?.length > 0) {
        doc.addPage();
        doc.setFontSize(16);
        doc.text('HAZOP Worksheet Analysis', 20, 30);

        study.nodes.forEach((node: any, nodeIndex: number) => {
            if (nodeIndex > 0) doc.addPage();
            
            doc.setFontSize(14);
            doc.text(`Node ${node.nodeNumber}: ${node.description}`, 20, 50);
            doc.setFontSize(10);
            doc.text(`Design Intention: ${node.intention}`, 20, 60);

            if (node.worksheets?.length > 0) {
            const tableData = node.worksheets.map((ws: any) => [
                ws.parameter || '',
                ws.guideWord || '',
                ws.deviation || '',
                (ws.causes || []).join('; '),
                (ws.consequences || []).join('; '),
                ws.severity || '',
                ws.likelihood || '',
                ws.riskScore || '',
                (ws.safeguards || []).join('; '),
                (ws.recommendations || []).map((r: any) => r.action).join('; ')
            ]);

            autoTable(doc, {
                head: [['Parameter', 'Guide Word', 'Deviation', 'Causes', 'Consequences', 'Severity', 'Likelihood', 'Risk', 'Safeguards', 'Recommendations']],
                body: tableData,
                startY: 70,
                styles: { fontSize: 7, cellPadding: 2 },
                columnStyles: {
                0: { cellWidth: 20 },
                1: { cellWidth: 20 },
                2: { cellWidth: 25 },
                3: { cellWidth: 35 },
                4: { cellWidth: 35 },
                5: { cellWidth: 15 },
                6: { cellWidth: 15 },
                7: { cellWidth: 15 },
                8: { cellWidth: 30 },
                9: { cellWidth: 40 }
                }
            });
            }
        });
        }

        doc.save(`HAZOP_Study_${study.studyNumber}.pdf`);
    }

    private async exportToExcel(study: any) {
        const workbook = XLSX.utils.book_new();

        // Study Information Sheet
        const studyInfo = [
        ['HAZOP Study Report'],
        [''],
        ['Study Number', study.studyNumber],
        ['Title', study.title],
        ['Plant', study.plantId?.name],
        ['Methodology', study.methodology],
        ['Status', study.status],
        ['Created', new Date(study.createdAt).toLocaleDateString()],
        [''],
        ['Team Information'],
        ['Chairman', study.chairman?.name],
        ['Scribe', study.scribe?.name],
        ['Facilitator', study.facilitator?.name],
        [''],
        ['Team Members']
        ];

        if (study.team?.length > 0) {
        study.team.forEach((member: any) => {
            studyInfo.push([member.member?.name, member.role, member.expertise]);
        });
        }

        const studyInfoSheet = XLSX.utils.aoa_to_sheet(studyInfo);
        XLSX.utils.book_append_sheet(workbook, studyInfoSheet, 'Study Information');

        // Worksheet Data Sheet
        if (study.nodes?.length > 0) {
        const worksheetData = [
            ['Node', 'Parameter', 'Guide Word', 'Deviation', 'Causes', 'Consequences', 'Severity', 'Likelihood', 'Risk Score', 'Risk Level', 'Safeguards', 'Recommendations']
        ];

        study.nodes.forEach((node: any) => {
            if (node.worksheets?.length > 0) {
            node.worksheets.forEach((ws: any) => {
                worksheetData.push([
                node.nodeNumber,
                ws.parameter || '',
                ws.guideWord || '',
                ws.deviation || '',
                (ws.causes || []).join('; '),
                (ws.consequences || []).join('; '),
                ws.severity || '',
                ws.likelihood || '',
                ws.riskScore || '',
                ws.risk || '',
                (ws.safeguards || []).join('; '),
                (ws.recommendations || []).map((r: any) => r.action).join('; ')
                ]);
            });
            }
        });

        const worksheetSheet = XLSX.utils.aoa_to_sheet(worksheetData);
        XLSX.utils.book_append_sheet(workbook, worksheetSheet, 'HAZOP Worksheet');
        }

        // Risk Summary Sheet
        const riskSummary = this.generateRiskSummary(study);
        const riskSummarySheet = XLSX.utils.aoa_to_sheet(riskSummary);
        XLSX.utils.book_append_sheet(workbook, riskSummarySheet, 'Risk Summary');

        XLSX.writeFile(workbook, `HAZOP_Study_${study.studyNumber}.xlsx`);
    }

    private async exportToWord(study: any) {
        // Create a simple HTML document for Word export
        const htmlContent = this.generateWordHTML(study);
        
        const blob = new Blob([htmlContent], { type: 'application/msword' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `HAZOP_Study_${study.studyNumber}.doc`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    }

    private generateRiskSummary(study: any) {
        const riskCounts = { very_low: 0, low: 0, medium: 0, high: 0, very_high: 0 };
        
        study.nodes?.forEach((node: any) => {
        node.worksheets?.forEach((worksheet: any) => {
            riskCounts[worksheet.risk as keyof typeof riskCounts]++;
        });
        });

        return [
        ['Risk Summary'],
        [''],
        ['Risk Level', 'Count'],
        ['Very Low', riskCounts.very_low],
        ['Low', riskCounts.low],
        ['Medium', riskCounts.medium],
        ['High', riskCounts.high],
        ['Very High', riskCounts.very_high],
        [''],
        ['Total Risks', Object.values(riskCounts).reduce((a, b) => a + b, 0)]
        ];
    }

    private generateWordHTML(study: any) {
        return `
        <html>
            <head>
            <meta charset="utf-8">
            <title>HAZOP Study Report</title>
            <style>
                body { font-family: Arial, sans-serif; }
                table { border-collapse: collapse; width: 100%; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; font-weight: bold; }
                .header { text-align: center; margin-bottom: 30px; }
                .section { margin: 20px 0; }
                .risk-high { background-color: #ffebee; }
                .risk-medium { background-color: #fff3e0; }
                .risk-low { background-color: #e8f5e8; }
            </style>
            </head>
            <body>
            <div class="header">
                <h1>HAZOP Study Report</h1>
                <h2>${study.title}</h2>
                <p>Study Number: ${study.studyNumber}</p>
                <p>Plant: ${study.plantId?.name}</p>
                <p>Status: ${study.status.toUpperCase()}</p>
            </div>

            <div class="section">
                <h3>Study Team</h3>
                <p><strong>Chairman:</strong> ${study.chairman?.name}</p>
                <p><strong>Scribe:</strong> ${study.scribe?.name}</p>
                <p><strong>Facilitator:</strong> ${study.facilitator?.name}</p>
                
                ${study.team?.length > 0 ? `
                <h4>Team Members</h4>
                <ul>
                    ${study.team.map((member: any) => `
                    <li>${member.member?.name} (${member.role}) - ${member.expertise}</li>
                    `).join('')}
                </ul>
                ` : ''}
            </div>

            ${study.nodes?.map((node: any) => `
                <div class="section">
                <h3>Node ${node.nodeNumber}: ${node.description}</h3>
                <p><strong>Design Intention:</strong> ${node.intention}</p>
                
                ${node.worksheets?.length > 0 ? `
                    <table>
                    <thead>
                        <tr>
                        <th>Parameter</th>
                        <th>Guide Word</th>
                        <th>Deviation</th>
                        <th>Causes</th>
                        <th>Consequences</th>
                        <th>Severity</th>
                        <th>Likelihood</th>
                        <th>Risk</th>
                        <th>Safeguards</th>
                        <th>Recommendations</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${node.worksheets.map((ws: any) => `
                        <tr class="${ws.risk === 'high' || ws.risk === 'very_high' ? 'risk-high' : 
                                    ws.risk === 'medium' ? 'risk-medium' : 'risk-low'}">
                            <td>${ws.parameter || ''}</td>
                            <td>${ws.guideWord || ''}</td>
                            <td>${ws.deviation || ''}</td>
                            <td>${(ws.causes || []).join('; ')}</td>
                            <td>${(ws.consequences || []).join('; ')}</td>
                            <td>${ws.severity || ''}</td>
                            <td>${ws.likelihood || ''}</td>
                            <td>${ws.riskScore || ''}</td>
                            <td>${(ws.safeguards || []).join('; ')}</td>
                            <td>${(ws.recommendations || []).map((r: any) => r.action).join('; ')}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                    </table>
                ` : ''}
                </div>
            `).join('')}
            </body>
        </html>
        `;
    }
    }

    export default new ExportService();