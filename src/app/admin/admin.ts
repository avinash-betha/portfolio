import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GithubService, RepoTarget } from '../core/github.service';
import { CONTENT_PATH, UPLOAD_DIR, RESUME_DIR, REPO_DEFAULTS } from '../core/config';
import { Portfolio, normalise } from '../core/models';
import {
  COLLECTIONS,
  Collection,
  Field,
  PROFILE_FIELDS,
  SOCIAL_FIELDS,
  ABOUT_FIELDS,
  SECTION_TOGGLES,
  blankItem,
  newId,
} from './schema';

type Tab = 'profile' | 'about' | 'sections' | 'resume' | Collection['key'];
type Row = Record<string, any>;

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class AdminComponent implements OnInit {
  readonly gh = inject(GithubService);

  readonly collections = COLLECTIONS;
  readonly profileFields = PROFILE_FIELDS;
  readonly socialFields = SOCIAL_FIELDS;
  readonly aboutFields = ABOUT_FIELDS;
  readonly toggles = SECTION_TOGGLES;

  // sign-in form
  token = '';
  repoForm: RepoTarget = { ...REPO_DEFAULTS };
  readonly signingIn = signal(false);
  readonly signInError = signal('');

  // editing state
  readonly model = signal<Portfolio | null>(null);
  readonly sha = signal<string | null>(null);
  readonly loading = signal(false);
  readonly dirty = signal(false);
  readonly publishing = signal(false);
  readonly message = signal('');
  readonly error = signal('');
  readonly tab = signal<Tab>('profile');
  readonly openRow = signal<string>('');
  readonly uploading = signal('');

  readonly tabs = computed(() => [
    { key: 'profile' as Tab, label: 'Profile' },
    { key: 'about' as Tab, label: 'About' },
    ...this.collections.map((c) => ({ key: c.key as Tab, label: c.label })),
    { key: 'resume' as Tab, label: 'Resume' },
    { key: 'sections' as Tab, label: 'Visibility' },
  ]);

  async ngOnInit(): Promise<void> {
    if (this.gh.signedIn()) await this.loadContent();
  }

  // ---------- auth ----------

  async submitSignIn(): Promise<void> {
    this.signInError.set('');
    if (!this.token.trim()) {
      this.signInError.set('Paste your access token to continue.');
      return;
    }
    this.signingIn.set(true);
    try {
      await this.gh.signIn(this.token.trim(), { ...this.repoForm });
      this.token = '';
      await this.loadContent();
    } catch (e) {
      this.signInError.set((e as Error).message);
    } finally {
      this.signingIn.set(false);
    }
  }

  signOut(): void {
    this.gh.signOut();
    this.model.set(null);
    this.dirty.set(false);
  }

  // ---------- load and publish ----------

  async loadContent(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const file = await this.gh.readFile(CONTENT_PATH);
      if (file) {
        this.model.set(normalise(JSON.parse(file.text)));
        this.sha.set(file.sha);
      } else {
        this.model.set(normalise(null));
        this.sha.set(null);
        this.message.set('No content file yet. Publishing will create one.');
      }
      this.dirty.set(false);
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  async publish(): Promise<void> {
    const model = this.model();
    if (!model) return;
    this.publishing.set(true);
    this.error.set('');
    this.message.set('');
    try {
      const json = JSON.stringify(model, null, 2) + '\n';
      const sha = await this.gh.writeFile(
        CONTENT_PATH,
        json,
        this.sha(),
        'Update portfolio content',
      );
      this.sha.set(sha);
      this.dirty.set(false);
      this.message.set('Published. Your site rebuilds in about a minute.');
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.publishing.set(false);
    }
  }

  touch(): void {
    this.dirty.set(true);
    this.message.set('');
  }

  // ---------- collection editing ----------

  rows(key: Collection['key']): Row[] {
    const m = this.model();
    return m ? ((m[key] as unknown as Row[]) ?? []) : [];
  }

  collection(key: Tab): Collection | undefined {
    return this.collections.find((c) => c.key === key);
  }

  add(c: Collection): void {
    const item = blankItem(c);
    this.rows(c.key).push(item);
    this.openRow.set(String(item['id']));
    this.touch();
  }

  remove(c: Collection, index: number): void {
    const list = this.rows(c.key);
    const label = list[index]?.[c.titleKey] || `this ${c.itemLabel}`;
    if (!confirm(`Delete ${label}? This cannot be undone once you publish.`)) return;
    list.splice(index, 1);
    this.touch();
  }

  move(c: Collection, index: number, delta: number): void {
    const list = this.rows(c.key);
    const to = index + delta;
    if (to < 0 || to >= list.length) return;
    const [item] = list.splice(index, 1);
    list.splice(to, 0, item);
    this.touch();
  }

  toggleRow(id: string): void {
    this.openRow.set(this.openRow() === id ? '' : id);
  }

  rowTitle(c: Collection, row: Row): string {
    return row[c.titleKey] || `Untitled ${c.itemLabel}`;
  }

  rowSubtitle(c: Collection, row: Row): string {
    return c.subtitleKey ? row[c.subtitleKey] || '' : '';
  }

  // ---------- field helpers ----------

  linesValue(row: Row, key: string): string {
    const v = row[key];
    return Array.isArray(v) ? v.join('\n') : '';
  }

  setLines(row: Row, key: string, raw: string): void {
    row[key] = raw.split('\n').map((s) => s.trim()).filter(Boolean);
    this.touch();
  }

  setValue(row: Row, key: string, value: unknown): void {
    row[key] = value;
    this.touch();
  }

  inputType(f: Field): string {
    return f.type === 'email' ? 'email' : f.type === 'url' ? 'url' : 'text';
  }

  // ---------- socials ----------

  addSocial(): void {
    this.model()?.profile.socials.push({ id: newId(), label: '', url: '' });
    this.touch();
  }

  removeSocial(index: number): void {
    this.model()?.profile.socials.splice(index, 1);
    this.touch();
  }

  // ---------- uploads ----------

  async uploadImage(event: Event, row: Row, key: string): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const name = safeName(file.name);
    this.uploading.set(String(row['id'] ?? '') + key);
    this.error.set('');
    try {
      const path = `${UPLOAD_DIR}/${name}`;
      const existing = await this.gh.shaOf(path);
      await this.gh.writeBinary(path, file, existing, `Upload ${name}`);
      row[key] = `uploads/${name}`;
      this.touch();
      this.message.set(`${name} uploaded. Publish to show it on the site.`);
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.uploading.set('');
      input.value = '';
    }
  }

  async uploadResume(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const model = this.model();
    if (!file || !model) return;
    this.uploading.set('resume');
    this.error.set('');
    try {
      const name = safeName(file.name);
      const path = `${RESUME_DIR}/${name}`;
      const existing = await this.gh.shaOf(path);
      await this.gh.writeBinary(path, file, existing, `Upload ${name}`);
      model.profile.resumeFile = name;
      this.touch();
      this.message.set(`${name} uploaded. Publish to link it from your site.`);
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.uploading.set('');
      input.value = '';
    }
  }

  clearResume(): void {
    const model = this.model();
    if (!model) return;
    model.profile.resumeFile = '';
    this.touch();
  }

  // ---------- visibility ----------

  visible(key: string): boolean {
    const v = this.model()?.visible as unknown as Record<string, boolean> | undefined;
    return v ? !!v[key] : false;
  }

  setVisible(key: string, value: boolean): void {
    const v = this.model()?.visible as unknown as Record<string, boolean> | undefined;
    if (!v) return;
    v[key] = value;
    this.touch();
  }
}

function safeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
