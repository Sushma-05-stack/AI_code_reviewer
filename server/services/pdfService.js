const PDFDocument = require('pdfkit');

/**
 * Generate a professional PDF audit report
 */
function generatePDFReport(report, res) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  // Pipe to response
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="audit-report-${report._id}.pdf"`);
  doc.pipe(res);

  const colors = {
    primary: '#6366f1',
    dark: '#1e1b4b',
    Critical: '#ef4444',
    High: '#f97316',
    Medium: '#eab308',
    Low: '#22c55e',
    text: '#374151',
    light: '#f3f4f6',
  };

  // ── Header ──────────────────────────────────────────────────────────────
  doc.rect(0, 0, doc.page.width, 120).fill(colors.dark);

  doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold')
    .text('AI CODE AUDIT REPORT', 50, 35);

  doc.fontSize(11).font('Helvetica')
    .text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 50, 68)
    .text(`Repository: ${report.repositoryName}`, 50, 85)
    .text(`Review Type: ${report.reviewType}`, 50, 102);

  // Score badge
  const scoreColor = report.overallScore >= 80 ? '#22c55e' : report.overallScore >= 60 ? '#eab308' : '#ef4444';
  doc.rect(doc.page.width - 130, 25, 80, 80).fill(scoreColor);
  doc.fillColor('#ffffff').fontSize(32).font('Helvetica-Bold')
    .text(`${report.overallScore}`, doc.page.width - 120, 42, { width: 60, align: 'center' });
  doc.fontSize(10).text('SCORE', doc.page.width - 120, 78, { width: 60, align: 'center' });

  doc.moveDown(4);

  // ── Executive Summary ────────────────────────────────────────────────────
  doc.fillColor(colors.dark).fontSize(16).font('Helvetica-Bold').text('Executive Summary');
  doc.moveTo(50, doc.y + 4).lineTo(doc.page.width - 50, doc.y + 4).stroke(colors.primary);
  doc.moveDown(0.5);

  doc.fillColor(colors.text).fontSize(11).font('Helvetica')
    .text(report.summary || 'No summary available.', { lineGap: 4 });
  doc.moveDown(1);

  // ── Metrics Grid ─────────────────────────────────────────────────────────
  doc.fillColor(colors.dark).fontSize(16).font('Helvetica-Bold').text('Issue Breakdown');
  doc.moveTo(50, doc.y + 4).lineTo(doc.page.width - 50, doc.y + 4).stroke(colors.primary);
  doc.moveDown(0.8);

  const metrics = [
    { label: 'Critical', value: report.metrics?.critical || 0, color: colors.Critical },
    { label: 'High', value: report.metrics?.high || 0, color: colors.High },
    { label: 'Medium', value: report.metrics?.medium || 0, color: colors.Medium },
    { label: 'Low', value: report.metrics?.low || 0, color: colors.Low },
  ];

  const boxW = 100, boxH = 60, startX = 50, gap = 15;
  metrics.forEach((m, i) => {
    const x = startX + i * (boxW + gap);
    const y = doc.y;
    doc.rect(x, y, boxW, boxH).fill(m.color);
    doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold')
      .text(String(m.value), x, y + 10, { width: boxW, align: 'center' });
    doc.fontSize(10).font('Helvetica')
      .text(m.label, x, y + 38, { width: boxW, align: 'center' });
  });

  doc.moveDown(5);

  // ── Issues ───────────────────────────────────────────────────────────────
  if (report.issues && report.issues.length > 0) {
    doc.fillColor(colors.dark).fontSize(16).font('Helvetica-Bold').text('Detailed Findings');
    doc.moveTo(50, doc.y + 4).lineTo(doc.page.width - 50, doc.y + 4).stroke(colors.primary);
    doc.moveDown(0.8);

    report.issues.forEach((issue, idx) => {
      if (doc.y > doc.page.height - 200) doc.addPage();

      const badgeColor = colors[issue.severity] || colors.Medium;

      // Issue header
      doc.rect(50, doc.y, doc.page.width - 100, 24).fill(badgeColor);
      doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold')
        .text(`#${idx + 1}  [${issue.severity}]  ${issue.issue}`, 58, doc.y - 18, {
          width: doc.page.width - 116,
        });
      doc.moveDown(0.3);

      // Issue details
      const detailY = doc.y;
      doc.rect(50, detailY, doc.page.width - 100, 1).fill('#e5e7eb');
      doc.moveDown(0.3);

      doc.fillColor(colors.text).fontSize(10).font('Helvetica-Bold').text('File: ', 58, doc.y, { continued: true });
      doc.font('Helvetica').text(`${issue.file}  (Line ${issue.line})`);

      doc.font('Helvetica-Bold').text('Impact: ', 58, doc.y, { continued: true });
      doc.font('Helvetica').text(issue.impact || 'N/A');

      doc.font('Helvetica-Bold').text('Fix: ', 58, doc.y, { continued: true });
      doc.font('Helvetica').text(issue.fix || 'N/A', { lineGap: 2 });

      doc.moveDown(0.8);
    });
  }

  // ── Recommendations ───────────────────────────────────────────────────────
  if (report.recommendations && report.recommendations.length > 0) {
    if (doc.y > doc.page.height - 200) doc.addPage();

    doc.fillColor(colors.dark).fontSize(16).font('Helvetica-Bold').text('Recommendations');
    doc.moveTo(50, doc.y + 4).lineTo(doc.page.width - 50, doc.y + 4).stroke(colors.primary);
    doc.moveDown(0.8);

    report.recommendations.forEach((rec, i) => {
      doc.fillColor(colors.text).fontSize(11).font('Helvetica')
        .text(`${i + 1}. ${rec}`, 58, doc.y, { lineGap: 4 });
    });
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  doc.rect(0, doc.page.height - 40, doc.page.width, 40).fill(colors.dark);
  doc.fillColor('#9ca3af').fontSize(9).font('Helvetica')
    .text(
      'Generated by AI Automated Code Reviewer  •  Confidential Audit Report',
      50,
      doc.page.height - 25,
      { align: 'center', width: doc.page.width - 100 }
    );

  doc.end();
}

module.exports = { generatePDFReport };
