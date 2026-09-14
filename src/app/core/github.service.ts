import { Injectable, signal } from '@angular/core';
import { REPO_DEFAULTS } from './config';

export interface RepoTarget {
  owner: string;
  repo: string;
  branch: string;
}

export interface FileRead {
  text: string;
  sha: string;
}

const SESSION_KEY = 'portfolio.session';
const API = 'https://api.github.com';

interface StoredSession extends RepoTarget {
  token: string;
}

@Injectable({ providedIn: 'root' })
export class GithubService {
  readonly signedIn = signal(false);
  readonly target = signal<RepoTarget>({ ...REPO_DEFAULTS });
  private token = '';

  constructor() {
    this.restore();
  }

  private restore(): void {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return;
    try {
      const s = JSON.parse(raw) as StoredSession;
      if (!s.token) return;
      this.token = s.token;
      this.target.set({ owner: s.owner, repo: s.repo, branch: s.branch });
      this.signedIn.set(true);
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }

  /** Verifies the token can reach the repo, then keeps it for this browser tab. */
  async signIn(token: string, target: RepoTarget): Promise<void> {
    const res = await fetch(`${API}/repos/${target.owner}/${target.repo}`, {
      headers: this.headers(token),
    });
    if (res.status === 401) {
      throw new Error('That token was rejected. Check it was copied in full and has not expired.');
    }
    if (res.status === 404) {
      throw new Error(
        `Cannot see ${target.owner}/${target.repo}. Check the owner and repository names, and that the token grants access to this repository.`,
      );
    }
    if (!res.ok) {
      throw new Error(`GitHub returned ${res.status}. Try again in a moment.`);
    }
    this.token = token;
    this.target.set(target);
    this.signedIn.set(true);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token, ...target } as StoredSession));
  }

  signOut(): void {
    this.token = '';
    this.signedIn.set(false);
    sessionStorage.removeItem(SESSION_KEY);
  }

  private headers(token = this.token): Record<string, string> {
    return {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
  }

  private contentsUrl(path: string): string {
    const t = this.target();
    return `${API}/repos/${t.owner}/${t.repo}/contents/${path}`;
  }

  /** Reads a UTF-8 file. Returns null when the file does not exist yet. */
  async readFile(path: string): Promise<FileRead | null> {
    const t = this.target();
    const res = await fetch(`${this.contentsUrl(path)}?ref=${t.branch}&cachebust=${Date.now()}`, {
      headers: this.headers(),
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Could not read ${path} (${res.status}).`);
    const body = await res.json();
    return { text: decodeBase64(body.content ?? ''), sha: body.sha };
  }

  /** Commits a UTF-8 file. Pass the sha you read, or null to create a new file. */
  async writeFile(path: string, text: string, sha: string | null, message: string): Promise<string> {
    return this.put(path, encodeBase64(text), sha, message);
  }

  /** Commits a binary file (images, PDFs) read from a file input. */
  async writeBinary(path: string, file: File, sha: string | null, message: string): Promise<string> {
    const buffer = await file.arrayBuffer();
    return this.put(path, bytesToBase64(new Uint8Array(buffer)), sha, message);
  }

  private async put(
    path: string,
    base64: string,
    sha: string | null,
    message: string,
  ): Promise<string> {
    const t = this.target();
    const res = await fetch(this.contentsUrl(path), {
      method: 'PUT',
      headers: { ...this.headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        content: base64,
        branch: t.branch,
        ...(sha ? { sha } : {}),
      }),
    });
    if (res.status === 409) {
      throw new Error(
        'This file changed on GitHub since you loaded it. Reload the admin panel, then make your edits again.',
      );
    }
    if (res.status === 403) {
      throw new Error('The token is missing write access to repository contents.');
    }
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Commit failed (${res.status}). ${detail.slice(0, 160)}`);
    }
    const body = await res.json();
    return body.content?.sha ?? '';
  }

  /** Looks up the sha of an existing path so overwrites succeed. */
  async shaOf(path: string): Promise<string | null> {
    const existing = await this.readMeta(path);
    return existing;
  }

  private async readMeta(path: string): Promise<string | null> {
    const t = this.target();
    const res = await fetch(`${this.contentsUrl(path)}?ref=${t.branch}`, {
      headers: this.headers(),
    });
    if (!res.ok) return null;
    const body = await res.json();
    return body.sha ?? null;
  }
}

function decodeBase64(b64: string): string {
  const clean = b64.replace(/\s/g, '');
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function encodeBase64(text: string): string {
  return bytesToBase64(new TextEncoder().encode(text));
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
