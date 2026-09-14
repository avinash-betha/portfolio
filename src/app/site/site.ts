import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  ElementRef,
} from '@angular/core';
import { ContentService } from '../core/content.service';
import { ASSET_PREFIX } from '../core/config';

interface NavItem {
  id: string;
  label: string;
  shown: boolean;
}

@Component({
  selector: 'app-site',
  standalone: true,
  templateUrl: './site.html',
  styleUrl: './site.css',
})
export class SiteComponent implements OnInit, OnDestroy {
  private readonly content = inject(ContentService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private observer?: IntersectionObserver;

  readonly data = this.content.data;
  readonly state = this.content.state;
  readonly active = signal('about');
  readonly revealed = signal(false);

  readonly nav = computed<NavItem[]>(() => {
    const v = this.data().visible;
    return [
      { id: 'about', label: 'About', shown: v.about },
      { id: 'experience', label: 'Experience', shown: v.experience },
      { id: 'projects', label: 'Projects', shown: v.projects },
      { id: 'certificates', label: 'Certificates', shown: v.certificates },
      { id: 'skills', label: 'Skills', shown: v.skills },
      { id: 'education', label: 'Education', shown: v.education },
      { id: 'blogs', label: 'Writing', shown: v.blogs },
    ].filter((i) => i.shown);
  });

  readonly featuredProjects = computed(() =>
    [...this.data().projects].sort(
      (a, b) => Number(b.featured ?? false) - Number(a.featured ?? false),
    ),
  );

  readonly resumeHref = computed(() => {
    const file = this.data().profile.resumeFile;
    return file ? this.asset(file) : '';
  });

  async ngOnInit(): Promise<void> {
    await this.content.load();
    document.title = this.pageTitle();
    requestAnimationFrame(() => this.revealed.set(true));
    setTimeout(() => this.watchSections(), 0);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private pageTitle(): string {
    const p = this.data().profile;
    return p.name ? `${p.name} — ${p.role || 'Portfolio'}` : 'Portfolio';
  }

  /** Highlights the nav entry for whichever section is nearest the top. */
  private watchSections(): void {
    const sections = Array.from(
      (this.host.nativeElement as HTMLElement).querySelectorAll('section[id]'),
    );
    if (!sections.length) return;
    this.observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible?.target.id) this.active.set(visible.target.id);
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: 0 },
    );
    sections.forEach((s) => this.observer!.observe(s));
  }

  asset(path: string): string {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    return ASSET_PREFIX + path.replace(/^\/+/, '');
  }

  /** "Jan 2023" + "Present" reads better than a raw range with an empty end. */
  period(start: string, end: string): string {
    const to = end?.trim() ? end : 'Present';
    if (!start?.trim()) return to;
    return `${start} — ${to}`;
  }

  hostname(url: string): string {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  }

  paragraphs(text: string): string[] {
    return (text ?? '').split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
  }
}
