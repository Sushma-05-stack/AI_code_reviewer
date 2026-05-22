const path = require('path');
const { reviewCode } = require('../services/aiService');
const { parseZipFile, readCodeFile, combineFiles, cleanupFiles, cleanupDirectory, detectLanguage } = require('../services/fileParser');
const { cloneAndReadRepo } = require('../services/githubService');
const Report = require('../models/Report');
const User = require('../models/User');

/**
 * POST /api/review/upload
 * Handles single file, multiple files, and ZIP uploads
 */
const uploadReview = async (req, res, next) => {
  const uploadedPaths = [];

  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const { reviewType = 'Full Audit' } = req.body;
    const startTime = Date.now();

    let files = [];
    let repoName = '';

    for (const file of req.files) {
      uploadedPaths.push(file.path);
      const ext = path.extname(file.originalname).toLowerCase();

      if (ext === '.zip') {
        // Parse ZIP
        const zipFiles = parseZipFile(file.path);
        files.push(...zipFiles);
        repoName = file.originalname.replace('.zip', '');
      } else {
        // Single code file
        const codeFile = readCodeFile(file.path);
        if (codeFile) {
          codeFile.fileName = file.originalname;
          files.push(codeFile);
        }
      }
    }

    if (files.length === 0) {
      return res.status(400).json({ error: 'No valid code files found in upload' });
    }

    if (!repoName) {
      repoName = files.length === 1 ? files[0].fileName : `${files.length} files`;
    }

    // Determine primary language
    const langCounts = {};
    files.forEach((f) => {
      langCounts[f.language] = (langCounts[f.language] || 0) + 1;
    });
    const primaryLanguage = Object.entries(langCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

    // Combine files for review
    const combinedCode = combineFiles(files);
    const primaryFile = files[0];

    // Run AI review
    const aiResult = await reviewCode(
      combinedCode,
      reviewType,
      primaryLanguage,
      files.length === 1 ? primaryFile.fileName : 'multiple files'
    );

    // Save report
    const report = await Report.create({
      userId: req.user._id,
      repositoryName: repoName,
      reviewType,
      sourceType: req.files.some((f) => path.extname(f.originalname) === '.zip') ? 'zip' : 'file',
      language: primaryLanguage,
      overallScore: aiResult.overallScore,
      summary: aiResult.summary,
      issues: aiResult.issues,
      recommendations: aiResult.recommendations,
      optimizedCode: aiResult.optimizedCode,
      rawCode: combinedCode.substring(0, 50000),
      status: 'completed',
      processingTime: Date.now() - startTime,
    });

    // Update user review count
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalReviews: 1 } });

    res.status(201).json({
      message: 'Review completed successfully',
      reportId: report._id,
      report: {
        id: report._id,
        repositoryName: report.repositoryName,
        reviewType: report.reviewType,
        language: report.language,
        overallScore: report.overallScore,
        summary: report.summary,
        issues: report.issues,
        recommendations: report.recommendations,
        optimizedCode: report.optimizedCode,
        metrics: report.metrics,
        provider: aiResult.provider,
        processingTime: report.processingTime,
        createdAt: report.createdAt,
      },
    });
  } catch (err) {
    next(err);
  } finally {
    // Clean up uploaded files
    cleanupFiles(uploadedPaths);
  }
};

/**
 * POST /api/review/github
 * Handles GitHub repository URL scanning
 */
const githubReview = async (req, res, next) => {
  let cloneDir = null;

  try {
    const { githubUrl, reviewType = 'Full Audit' } = req.body;

    if (!githubUrl) {
      return res.status(400).json({ error: 'GitHub URL is required' });
    }

    const startTime = Date.now();

    // Clone and read repository
    const { files, repoName, cloneDir: dir } = await cloneAndReadRepo(githubUrl, {
      maxFiles: 25,
      timeout: 60000,
    });
    cloneDir = dir;

    // Determine primary language
    const langCounts = {};
    files.forEach((f) => {
      langCounts[f.language] = (langCounts[f.language] || 0) + 1;
    });
    const primaryLanguage = Object.entries(langCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

    // Combine files for review
    const combinedCode = combineFiles(files, 20000);

    // Run AI review
    const aiResult = await reviewCode(combinedCode, reviewType, primaryLanguage, repoName);

    // Save report
    const report = await Report.create({
      userId: req.user._id,
      repositoryName: repoName,
      reviewType,
      sourceType: 'github',
      language: primaryLanguage,
      githubUrl,
      overallScore: aiResult.overallScore,
      summary: aiResult.summary,
      issues: aiResult.issues,
      recommendations: aiResult.recommendations,
      optimizedCode: aiResult.optimizedCode,
      rawCode: combinedCode.substring(0, 50000),
      status: 'completed',
      processingTime: Date.now() - startTime,
    });

    await User.findByIdAndUpdate(req.user._id, { $inc: { totalReviews: 1 } });

    res.status(201).json({
      message: 'GitHub repository review completed',
      reportId: report._id,
      report: {
        id: report._id,
        repositoryName: report.repositoryName,
        reviewType: report.reviewType,
        language: report.language,
        overallScore: report.overallScore,
        summary: report.summary,
        issues: report.issues,
        recommendations: report.recommendations,
        optimizedCode: report.optimizedCode,
        metrics: report.metrics,
        provider: aiResult.provider,
        processingTime: report.processingTime,
        createdAt: report.createdAt,
      },
    });
  } catch (err) {
    next(err);
  } finally {
    if (cloneDir) {
      const { cleanupDirectory } = require('../services/fileParser');
      cleanupDirectory(cloneDir);
    }
  }
};

/**
 * GET /api/review/:id
 */
const getReport = async (req, res, next) => {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({ report });
  } catch (err) {
    next(err);
  }
};

module.exports = { uploadReview, githubReview, getReport };
