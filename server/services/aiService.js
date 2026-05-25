const axios = require('axios');
require('dotenv').config();

// ── LangSmith setup ──────────────────────────────────────────────────────────
let traceable = null;
let langsmithEnabled = false;

try {
  if (process.env.LANGSMITH_API_KEY && process.env.LANGSMITH_TRACING === 'true') {
    process.env.LANGCHAIN_TRACING_V2 = 'true';
    process.env.LANGCHAIN_ENDPOINT = process.env.LANGSMITH_ENDPOINT || 'https://api.smith.langchain.com';
    process.env.LANGCHAIN_API_KEY = process.env.LANGSMITH_API_KEY;
    process.env.LANGCHAIN_PROJECT = process.env.LANGSMITH_PROJECT || 'genai';

    const ls = require('langsmith/traceable');
    traceable = ls.traceable;
    langsmithEnabled = true;
    console.log(`✅ LangSmith tracing enabled — project: ${process.env.LANGCHAIN_PROJECT}`);
  }
} catch (e) {
  console.warn('LangSmith not available, tracing disabled:', e.message);
}

/**
 * Wrap a function with LangSmith tracing if enabled
 */
function withTrace(fn, name, metadata = {}) {
  if (!langsmithEnabled || !traceable) return fn;
  return traceable(fn, {
    name,
    run_type: 'llm',
    metadata,
  });
}

// ── Prompt builder ───────────────────────────────────────────────────────────
function buildReviewPrompt(code, reviewType, language, fileName) {
  const reviewFocus = {
    Security: 'Focus heavily on security vulnerabilities: SQL injection, XSS, hardcoded secrets, insecure dependencies, authentication flaws, CSRF, path traversal, and OWASP Top 10.',
    Performance: 'Focus on performance bottlenecks: inefficient loops, memory leaks, N+1 queries, blocking operations, unnecessary re-renders, unoptimized algorithms, and resource waste.',
    Quality: 'Focus on code quality: naming conventions, code smells, duplicate logic, complexity, missing error handling, poor documentation, SOLID violations, and anti-patterns.',
    'Full Audit': 'Perform a comprehensive review covering security vulnerabilities, performance issues, code quality, bugs, and best practices.',
  };

  return `You are an expert code reviewer and security auditor. Analyze the following ${language} code and provide a detailed review.

${reviewFocus[reviewType] || reviewFocus['Full Audit']}

File: ${fileName}
Language: ${language}
Review Type: ${reviewType}

CODE TO REVIEW:
\`\`\`${language.toLowerCase()}
${code}
\`\`\`

Respond ONLY with a valid JSON object in this exact format (no markdown, no extra text):
{
  "overallScore": <number 0-100>,
  "summary": "<2-3 sentence executive summary>",
  "issues": [
    {
      "severity": "<Critical|High|Medium|Low>",
      "file": "${fileName}",
      "line": <line number or 0>,
      "issue": "<clear description of the issue>",
      "impact": "<what could go wrong>",
      "fix": "<how to fix it>",
      "optimizedCode": "<corrected code snippet if applicable>",
      "category": "<Security|Performance|Quality|Bug|Style>"
    }
  ],
  "optimizedCode": "<full refactored version of the code>",
  "recommendations": [
    "<actionable recommendation 1>",
    "<actionable recommendation 2>",
    "<actionable recommendation 3>"
  ],
  "metrics": {
    "linesAnalyzed": <number>,
    "complexity": "<Low|Medium|High>",
    "maintainability": "<Poor|Fair|Good|Excellent>"
  }
}

Rules:
- overallScore: 100 = perfect code, 0 = critically broken
- Be specific with line numbers when possible
- Provide actual corrected code in optimizedCode fields
- Include at least 3 recommendations
- If no issues found, return empty issues array with high score`;
}

// ── Gemini review ────────────────────────────────────────────────────────────
async function _reviewWithGemini(code, reviewType, language, fileName) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key') {
    throw new Error('Gemini API key not configured');
  }

  const prompt = buildReviewPrompt(code, reviewType, language, fileName);

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 8192 },
    },
    { timeout: 60000 }
  );

  const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini');

  return parseAIResponse(text);
}

// ── OpenAI review ────────────────────────────────────────────────────────────
async function _reviewWithOpenAI(code, reviewType, language, fileName) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your_openai_api_key') {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = buildReviewPrompt(code, reviewType, language, fileName);

  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert code reviewer. Always respond with valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 8192,
    },
    {
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      timeout: 60000,
    }
  );

  const text = response.data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response from OpenAI');

  return parseAIResponse(text);
}

// Wrap with LangSmith tracing
const reviewWithGemini = withTrace(_reviewWithGemini, 'gemini-code-review', { provider: 'gemini', model: 'gemini-1.5-flash' });
const reviewWithOpenAI = withTrace(_reviewWithOpenAI, 'openai-code-review', { provider: 'openai', model: 'gpt-4o-mini' });

// ── Response parser ──────────────────────────────────────────────────────────
function parseAIResponse(text) {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
  cleaned = cleaned.replace(/^```\s*/i, '').replace(/\s*```$/i, '');

  try {
    const parsed = JSON.parse(cleaned);
    return {
      overallScore: Math.min(100, Math.max(0, Number(parsed.overallScore) || 70)),
      summary: parsed.summary || 'Code review completed.',
      issues: Array.isArray(parsed.issues)
        ? parsed.issues.map((issue) => ({
            severity: ['Critical', 'High', 'Medium', 'Low'].includes(issue.severity) ? issue.severity : 'Medium',
            file: issue.file || 'unknown',
            line: Number(issue.line) || 0,
            issue: issue.issue || '',
            impact: issue.impact || '',
            fix: issue.fix || '',
            optimizedCode: issue.optimizedCode || '',
            category: ['Security', 'Performance', 'Quality', 'Bug', 'Style'].includes(issue.category) ? issue.category : 'Quality',
          }))
        : [],
      optimizedCode: parsed.optimizedCode || '',
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      metrics: parsed.metrics || {},
    };
  } catch (e) {
    console.error('Failed to parse AI response:', e.message);
    return {
      overallScore: 50,
      summary: 'AI analysis completed. Manual review recommended for detailed findings.',
      issues: [],
      optimizedCode: '',
      recommendations: [
        'Review code manually for security vulnerabilities',
        'Ensure proper error handling throughout',
        'Add comprehensive test coverage',
      ],
      metrics: {},
    };
  }
}

// ── Demo/mock review ─────────────────────────────────────────────────────────
function generateMockReview(code, reviewType, language, fileName) {
  const lines = code.split('\n').length;
  const hasHardcodedSecrets = /password\s*=\s*['"][^'"]+['"]|secret\s*=\s*['"][^'"]+['"]/i.test(code);
  const hasConsoleLog = /console\.log/i.test(code);
  const hasEval = /\beval\s*\(/i.test(code);
  const hasSQLConcat = /query\s*\+|sql\s*\+/i.test(code);

  const issues = [];

  if (hasHardcodedSecrets) {
    issues.push({
      severity: 'Critical', file: fileName, line: 1,
      issue: 'Hardcoded credentials detected in source code',
      impact: 'Credentials exposed in version control, major security risk',
      fix: 'Move all secrets to environment variables using process.env',
      optimizedCode: 'const password = process.env.DB_PASSWORD;',
      category: 'Security',
    });
  }
  if (hasEval) {
    issues.push({
      severity: 'High', file: fileName, line: 1,
      issue: 'Use of eval() detected — dangerous code execution',
      impact: 'Allows arbitrary code execution, XSS vulnerability',
      fix: 'Replace eval() with safer alternatives like JSON.parse()',
      optimizedCode: '',
      category: 'Security',
    });
  }
  if (hasSQLConcat) {
    issues.push({
      severity: 'Critical', file: fileName, line: 1,
      issue: 'Potential SQL injection via string concatenation',
      impact: 'Database could be compromised by malicious input',
      fix: 'Use parameterized queries or prepared statements',
      optimizedCode: 'db.query("SELECT * FROM users WHERE id = ?", [userId])',
      category: 'Security',
    });
  }
  if (hasConsoleLog) {
    issues.push({
      severity: 'Low', file: fileName, line: 1,
      issue: 'console.log statements found in production code',
      impact: 'Performance overhead and potential information leakage',
      fix: 'Remove console.log or use a proper logging library',
      optimizedCode: '',
      category: 'Quality',
    });
  }

  const score = Math.max(40, 100 - issues.reduce((acc, i) => {
    const weights = { Critical: 25, High: 15, Medium: 8, Low: 3 };
    return acc + (weights[i.severity] || 5);
  }, 0));

  return {
    overallScore: score,
    summary: `Analyzed ${lines} lines of ${language} code. Found ${issues.length} issue(s) requiring attention. ${issues.length === 0 ? 'Code appears clean.' : 'Review the issues below for details.'}`,
    issues,
    optimizedCode: code,
    recommendations: [
      'Use environment variables for all sensitive configuration',
      'Implement input validation and sanitization',
      'Add comprehensive error handling',
      'Write unit tests for critical functions',
      'Use a linter (ESLint/Pylint) for automated style checks',
    ],
    metrics: {
      linesAnalyzed: lines,
      complexity: lines > 200 ? 'High' : lines > 50 ? 'Medium' : 'Low',
      maintainability: score > 80 ? 'Good' : score > 60 ? 'Fair' : 'Poor',
    },
  };
}

// ── Main review function ─────────────────────────────────────────────────────
async function _reviewCode(code, reviewType = 'Full Audit', language = 'JavaScript', fileName = 'code.js') {
  const maxChars = 15000;
  const truncated = code.length > maxChars;
  const codeToReview = truncated ? code.substring(0, maxChars) + '\n// ... (truncated for analysis)' : code;

  let result;
  let provider = 'none';

  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (geminiKey && geminiKey !== 'your_gemini_api_key') {
    try {
      result = await reviewWithGemini(codeToReview, reviewType, language, fileName);
      provider = 'gemini';
    } catch (err) {
      console.warn('Gemini failed, trying OpenAI:', err.message);
    }
  }

  if (!result && openaiKey && openaiKey !== 'your_openai_api_key') {
    try {
      result = await reviewWithOpenAI(codeToReview, reviewType, language, fileName);
      provider = 'openai';
    } catch (err) {
      console.warn('OpenAI failed:', err.message);
    }
  }

  if (!result) {
    result = generateMockReview(code, reviewType, language, fileName);
    provider = 'demo';
  }

  console.log(`✅ Review complete — provider: ${provider}, score: ${result.overallScore}, issues: ${result.issues.length}`);
  return { ...result, provider, truncated };
}

// Wrap main review function with LangSmith tracing
const reviewCode = withTrace(_reviewCode, 'ai-code-review', { service: 'ai-code-reviewer' });

module.exports = { reviewCode };
