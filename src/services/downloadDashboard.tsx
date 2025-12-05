import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Generate and download a full dashboard PDF
 * @param {object} dashboardData - Dashboard JSON data
 * @param {object} chartImages - Optional chart images { statusChart, riskChart, hazardChart } (base64)
 */
export async function downloadDashboardPDF(dashboardData, chartImages = {}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

  // ===== HEADER =====
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("HIRA Dashboard Report", 40, 50);

  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 40, 70);

  // ===== SUMMARY SECTION =====
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Dashboard Summary", 40, 100);

  const summaryData = [
    ["Total Assessments", dashboardData.totalAssessments],
    ["Completed Assessments", dashboardData.completedAssessments],
    ["Closed Assessments", dashboardData.closedAssessments],
    ["Approved Assessments", dashboardData.approvedAssessments],
    ["Total Actions", dashboardData.totalActions],
    ["Completed Actions", dashboardData.completedActions],
    ["Open Actions", dashboardData.openActions],
    ["Overdue Actions", dashboardData.overdueActions],
    ["Average Closure Time", dashboardData.avgClosureTime],
    ["High Risk Items", dashboardData.highRiskItems],
  ];

  autoTable(doc, {
    startY: 110,
    head: [["Metric", "Value"]],
    body: summaryData,
    theme: "grid",
    styles: { fontSize: 10, cellPadding: 5 },
    headStyles: { fillColor: [52, 152, 219], textColor: 255 },
  });

  let currentY = doc.lastAutoTable.finalY + 20;

  // ===== CHARTS SECTION =====
  if (chartImages.statusChart || chartImages.riskChart || chartImages.hazardChart) {
    doc.setFontSize(14);
    doc.text("Dashboard Charts", 40, currentY);

    currentY += 10;
    const chartWidth = 220;
    const chartHeight = 150;

    if (chartImages.statusChart) {
      doc.addImage(chartImages.statusChart, "PNG", 40, currentY, chartWidth, chartHeight);
    }
    if (chartImages.riskChart) {
      doc.addImage(chartImages.riskChart, "PNG", 310, currentY, chartWidth, chartHeight);
    }

    currentY += chartHeight + 20;

    if (chartImages.hazardChart) {
      doc.addImage(chartImages.hazardChart, "PNG", 120, currentY, chartWidth, chartHeight);
      currentY += chartHeight + 30;
    }
  }

  // ===== DISTRIBUTION TABLES =====
  const tables = [
    { key: "statusDistribution", title: "Status Distribution" },
    { key: "riskDistribution", title: "Risk Distribution" },
    { key: "hazardFrequency", title: "Hazard Frequency" },
    { key: "plantSummary", title: "Plant Summary" },
    { key: "significanceSummary", title: "Significance Summary" },
  ];

  for (const table of tables) {
    const data = dashboardData[table.key];
    if (Array.isArray(data) && data.length > 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text(table.title, 40, 50);

      const keys = Object.keys(data[0]);
      const body = data.map((item) => keys.map((k) => item[k]));

      autoTable(doc, {
        startY: 70,
        head: [keys.map((k) => k.toUpperCase())],
        body,
        theme: "grid",
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      });
    }
  }

  // ===== RECENT ASSESSMENTS =====
  if (Array.isArray(dashboardData.recentAssessments) && dashboardData.recentAssessments.length > 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.text("Recent Assessments", 40, 50);

    const head = ["Assessment No", "Created By", "Department", "Created At", "Status"];
    const body = dashboardData.recentAssessments.map((a) => [
      a.assessmentNumber,
      a.createdBy?.name || "N/A",
      a.department?.name || "N/A",
      new Date(a.createdAt).toLocaleDateString(),
      a.status || "N/A",
    ]);

    autoTable(doc, {
      startY: 70,
      head: [head],
      body,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [39, 174, 96], textColor: 255 },
    });
  }

  // ===== FOOTER =====
  doc.setFontSize(10);
  doc.setTextColor(120);
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() - 80, doc.internal.pageSize.getHeight() - 20);
  }

  // ===== SAVE FILE =====
  doc.save("HIRA_Dashboard_Report.pdf");
}
