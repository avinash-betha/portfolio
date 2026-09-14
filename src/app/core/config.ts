/**
 * Edit these three values once, after you create your repository.
 * The admin sign-in screen lets you override them without rebuilding,
 * but setting them here saves typing every time.
 */
export const REPO_DEFAULTS = {
  owner: 'your-github-username',
  repo: 'portfolio',
  branch: 'main',
};

/** Where content lives inside the repo. Paths are relative to the repo root. */
export const CONTENT_PATH = 'public/content/portfolio.json';
export const UPLOAD_DIR = 'public/content/uploads';
export const RESUME_DIR = 'public/content';

/** Where the built site reads content from at runtime (relative to <base href>). */
export const CONTENT_URL = 'content/portfolio.json';
export const ASSET_PREFIX = 'content/';
