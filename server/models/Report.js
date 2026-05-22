const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  severity: {
    type: String,
    enum: ['Critical', 'High', 'Medium', 'Low'],
    required: true,
  },
  file: { type: String, default: 'unknown' },
  line: { type: Number, default: 0 },
  issue: { type: String, required: true },
  impact: { type: String, default: '' },
  fix: { type: String, default: '' },
  optimizedCode: { type: String, default: '' },
  category: {
    type: String,
    enum: ['Security', 'Performance', 'Quality', 'Bug', 'Style'],
    default: 'Quality',
  },
});

const reportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    repositoryName: {
      type: String,
      required: true,
      trim: true,
    },
    reviewType: {
      type: String,
      enum: ['Security', 'Performance', 'Quality', 'Full Audit'],
      default: 'Full Audit',
    },
    sourceType: {
      type: String,
      enum: ['file', 'zip', 'github'],
      default: 'file',
    },
    language: {
      type: String,
      default: 'Unknown',
    },
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    summary: { type: String, default: '' },
    issues: [issueSchema],
    recommendations: [{ type: String }],
    optimizedCode: { type: String, default: '' },
    metrics: {
      critical: { type: Number, default: 0 },
      high: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      low: { type: Number, default: 0 },
      totalIssues: { type: Number, default: 0 },
      linesAnalyzed: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    rawCode: { type: String, default: '' },
    githubUrl: { type: String, default: '' },
    processingTime: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Update metrics before saving
reportSchema.pre('save', function (next) {
  if (this.issues && this.issues.length > 0) {
    this.metrics.critical = this.issues.filter((i) => i.severity === 'Critical').length;
    this.metrics.high = this.issues.filter((i) => i.severity === 'High').length;
    this.metrics.medium = this.issues.filter((i) => i.severity === 'Medium').length;
    this.metrics.low = this.issues.filter((i) => i.severity === 'Low').length;
    this.metrics.totalIssues = this.issues.length;
  }
  next();
});

module.exports = mongoose.model('Report', reportSchema);
