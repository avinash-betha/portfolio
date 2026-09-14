import { Injectable, signal } from '@angular/core';
import { CONTENT_URL } from './config';
import { Portfolio, normalise, EMPTY_PORTFOLIO } from './models';

type LoadState = 'loading' | 'ready' | 'error';

@Injectable({ providedIn: 'root' })
export class ContentService {
  readonly data = signal<Portfolio>(EMPTY_PORTFOLIO);
  readonly state = signal<LoadState>('loading');

  async load(): Promise<void> {
    this.state.set('loading');
    try {
      const res = await fetch(`${CONTENT_URL}?v=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(String(res.status));
      this.data.set(normalise(await res.json()));
      this.state.set('ready');
    } catch {
      this.state.set('error');
    }
  }
}
