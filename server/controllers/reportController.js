const Report = require('../models/Report');
const { generatePDFReport } = require('../services/pdfService');

/**
 * GET /api/reports/history
 */
const getHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      Report.find({ userId: req.user._id })
        .select('-rawCode -optimizedCode -issues')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Report.countDocuments({ userId: req.user._id }),
    ]);

    res.json({
      reports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/reports/stats
 */
const getStats = async (req, res, next) => {
  try {
    const reports = await Report.find({ userId: req.user._id }).select('overallScore metrics reviewType language createdAt');

    const totalReviews = reports.length;
    const avgScore = totalReviews > 0
      ? Math.round(reports.reduce((sum, r) => sum + r.overallScore, 0) / totalReviews)
      : 0;

    const totalIssues = reports.reduce((sum, r) => sum + (r.metrics?.totalIssues || 0), 0);
    const criticalIssues = reports.reduce((sum, r) => sum + (r.metrics?.critical || 0), 0);

    // Language distribution
    const langDist = {};
    reports.forEach((r) => {
      langDist[r.language] = (langDist[r.language] || 0) + 1;
    });

    // Review type distribution
    const typeDist = {};
    reports.forEach((r) => {
      typeDist[r.reviewType] = (typeDist[r.reviewType] || 0) + 1;
    });

    // Score trend (last 10 reviews)
    const scoreTrend = reports
      .slice(0, 10)
      .reverse()
      .map((r) => ({
        date: r.createdAt,
        score: r.overallScore,
      }));

    res.json({
      totalReviews,
      avgScore,
      totalIssues,
      criticalIssues,
      languageDistribution: langDist,
      reviewTypeDistribution: typeDist,
      scoreTrend,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/reports/:id/pdf
 */
const downloadPDF = async (req, res, next) => {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    generatePDFReport(report, res);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/reports/:id/json
 */
const downloadJSON = async (req, res, next) => {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="audit-report-${report._id}.json"`);
    res.json({
      reportId: report._id,
      generatedAt: new Date().toISOString(),
      repository: report.repositoryName,
      reviewType: report.reviewType,
      language: report.language,
      overallScore: report.overallScore,
      summary: report.summary,
      metrics: report.metrics,
      issues: report.issues,
      recommendations: report.recommendations,
      optimizedCode: report.optimizedCode,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/reports/:id
 */
const deleteReport = async (req, res, next) => {
  try {
    const report = await Report.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({ message: 'Report deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getHistory, getStats, downloadPDF, downloadJSON, deleteReport };
