const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { readDirectory, cleanupDirectory } = require('./fileParser');

const CLONE_BASE_DIR = path.join(__dirname, '../uploads/repos');

/**
 * Validate GitHub URL format
 */
function validateGitHubUrl(url) {
  const githubPattern = /^https?:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+(\.git)?(\/?)?$/i;
  return githubPattern.test(url.trim());
}

/**
 * Extract repo name from GitHub URL
 */
function extractRepoName(url) {
  const parts = url.replace(/\.git$/, '').split('/');
  return parts[parts.length - 1] || 'unknown-repo';
}

/**
 * Clone a GitHub repository and return its files
 */
async function cloneAndReadRepo(githubUrl, options = {}) {
  const { maxFiles = 30, timeout = 60000 } = options;

  if (!validateGitHubUrl(githubUrl)) {
    throw new Error('Invalid GitHub URL. Please provide a valid public GitHub repository URL.');
  }

  // Ensure clone directory exists
  if (!fs.existsSync(CLONE_BASE_DIR)) {
    fs.mkdirSync(CLONE_BASE_DIR, { recursive: true });
  }

  const repoName = extractRepoName(githubUrl);
  const cloneDir = path.join(CLONE_BASE_DIR, `${uuidv4()}-${repoName}`);

  try {
    console.log(`Cloning repository: ${githubUrl}`);

    const git = simpleGit();
    await Promise.race([
      git.clone(githubUrl, cloneDir, ['--depth', '1', '--single-branch']),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Repository clone timed out after 60 seconds')), timeout)
      ),
    ]);

    console.log(`Repository cloned to: ${cloneDir}`);

    // Read files from cloned repo
    let files = readDirectory(cloneDir);

    // Limit number of files
    if (files.length > maxFiles) {
      console.warn(`Repository has ${files.length} files, limiting to ${maxFiles}`);
      files = files.slice(0, maxFiles);
    }

    if (files.length === 0) {
      throw new Error('No supported code files found in repository');
    }

    return { files, repoName, cloneDir };
  } catch (err) {
    // Clean up on error
    cleanupDirectory(cloneDir);
    throw err;
  }
}

module.exports = { cloneAndReadRepo, validateGitHubUrl, extractRepoName };
