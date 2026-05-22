const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const LANGUAGE_MAP = {
  '.py': 'Python',
  '.js': 'JavaScript',
  '.jsx': 'JavaScript',
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript',
  '.java': 'Java',
  '.cpp': 'C++',
  '.c': 'C',
  '.h': 'C',
  '.hpp': 'C++',
  '.go': 'Go',
  '.php': 'PHP',
  '.rs': 'Rust',
  '.rb': 'Ruby',
  '.cs': 'C#',
  '.html': 'HTML',
  '.css': 'CSS',
  '.json': 'JSON',
  '.yaml': 'YAML',
  '.yml': 'YAML',
};

const SKIP_DIRS = ['node_modules', '.git', 'dist', 'build', '__pycache__', '.next', 'vendor'];
const SKIP_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.pdf', '.lock', '.map'];

/**
 * Detect language from file extension
 */
function detectLanguage(filename) {
  const ext = path.extname(filename).toLowerCase();
  return LANGUAGE_MAP[ext] || 'Unknown';
}

/**
 * Read a single code file
 */
function readCodeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath);
    const language = detectLanguage(fileName);
    return { fileName, content, language, filePath };
  } catch (err) {
    console.error(`Error reading file ${filePath}:`, err.message);
    return null;
  }
}

/**
 * Extract and parse a ZIP file
 */
function parseZipFile(zipPath) {
  const files = [];
  try {
    const zip = new AdmZip(zipPath);
    const entries = zip.getEntries();

    for (const entry of entries) {
      if (entry.isDirectory) continue;

      const entryName = entry.entryName;
      const ext = path.extname(entryName).toLowerCase();

      // Skip unwanted files
      if (SKIP_EXTENSIONS.includes(ext)) continue;
      if (SKIP_DIRS.some((dir) => entryName.includes(`/${dir}/`) || entryName.startsWith(`${dir}/`))) continue;
      if (!LANGUAGE_MAP[ext]) continue;

      try {
        const content = entry.getData().toString('utf-8');
        if (content.trim().length === 0) continue;

        files.push({
          fileName: path.basename(entryName),
          filePath: entryName,
          content,
          language: detectLanguage(entryName),
        });
      } catch (e) {
        console.warn(`Skipping binary/unreadable file: ${entryName}`);
      }
    }
  } catch (err) {
    throw new Error(`Failed to parse ZIP: ${err.message}`);
  }

  return files;
}

/**
 * Recursively read files from a directory
 */
function readDirectory(dirPath, baseDir = dirPath) {
  const files = [];

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        if (!SKIP_DIRS.includes(entry.name)) {
          files.push(...readDirectory(fullPath, baseDir));
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (LANGUAGE_MAP[ext] && !SKIP_EXTENSIONS.includes(ext)) {
          const file = readCodeFile(fullPath);
          if (file) {
            file.filePath = path.relative(baseDir, fullPath);
            files.push(file);
          }
        }
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dirPath}:`, err.message);
  }

  return files;
}

/**
 * Combine multiple files into a single reviewable string
 */
function combineFiles(files, maxChars = 20000) {
  let combined = '';
  let totalChars = 0;

  for (const file of files) {
    const header = `\n// ===== FILE: ${file.filePath || file.fileName} =====\n`;
    const content = file.content;

    if (totalChars + header.length + content.length > maxChars) {
      combined += `\n// ... (${files.length - files.indexOf(file)} more files truncated)`;
      break;
    }

    combined += header + content;
    totalChars += header.length + content.length;
  }

  return combined;
}

/**
 * Clean up uploaded files
 */
function cleanupFiles(filePaths) {
  for (const filePath of filePaths) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.warn(`Could not delete file ${filePath}:`, err.message);
    }
  }
}

/**
 * Clean up a directory
 */
function cleanupDirectory(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  } catch (err) {
    console.warn(`Could not delete directory ${dirPath}:`, err.message);
  }
}

module.exports = {
  detectLanguage,
  readCodeFile,
  parseZipFile,
  readDirectory,
  combineFiles,
  cleanupFiles,
  cleanupDirectory,
  LANGUAGE_MAP,
};
