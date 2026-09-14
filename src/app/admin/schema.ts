export type FieldType = 'text' | 'textarea' | 'url' | 'email' | 'lines' | 'bool' | 'image';

export interface Field {
  key: string;
  label: string;
  type: FieldType;
  hint?: string;
  wide?: boolean;
}

export interface Collection {
  key: 'experience' | 'projects' | 'certificates' | 'skills' | 'education' | 'blogs';
  label: string;
  itemLabel: string;
  titleKey: string;
  subtitleKey?: string;
  fields: Field[];
}

export const PROFILE_FIELDS: Field[] = [
  { key: 'name', label: 'Full name', type: 'text' },
  { key: 'role', label: 'What you do', type: 'text', hint: 'Shown under your name, e.g. Backend engineer' },
  { key: 'tagline', label: 'One-line intro', type: 'textarea', wide: true },
  { key: 'location', label: 'Location', type: 'text' },
  { key: 'email', label: 'Email', type: 'email' },
];

export const SOCIAL_FIELDS: Field[] = [
  { key: 'label', label: 'Label', type: 'text', hint: 'GitHub, LinkedIn, X…' },
  { key: 'url', label: 'Link', type: 'url' },
];

export const ABOUT_FIELDS: Field[] = [
  { key: 'heading', label: 'Section heading', type: 'text', hint: 'Defaults to "About"' },
  { key: 'body', label: 'About you', type: 'textarea', wide: true, hint: 'Leave a blank line between paragraphs' },
];

export const COLLECTIONS: Collection[] = [
  {
    key: 'experience',
    label: 'Experience',
    itemLabel: 'role',
    titleKey: 'role',
    subtitleKey: 'company',
    fields: [
      { key: 'role', label: 'Job title', type: 'text' },
      { key: 'company', label: 'Company', type: 'text' },
      { key: 'companyUrl', label: 'Company website', type: 'url' },
      { key: 'start', label: 'Started', type: 'text', hint: 'e.g. Mar 2023' },
      { key: 'end', label: 'Ended', type: 'text', hint: 'Leave empty if this is your current role' },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'summary', label: 'Summary', type: 'textarea', wide: true },
      { key: 'highlights', label: 'Highlights', type: 'lines', wide: true, hint: 'One per line' },
      { key: 'tech', label: 'Tech used', type: 'lines', wide: true, hint: 'One per line' },
    ],
  },
  {
    key: 'projects',
    label: 'Projects',
    itemLabel: 'project',
    titleKey: 'name',
    subtitleKey: 'repo',
    fields: [
      { key: 'name', label: 'Project name', type: 'text' },
      { key: 'featured', label: 'Pin to the top', type: 'bool' },
      { key: 'description', label: 'Description', type: 'textarea', wide: true },
      { key: 'repo', label: 'GitHub repository', type: 'url' },
      { key: 'demo', label: 'Live site', type: 'url' },
      { key: 'tech', label: 'Built with', type: 'lines', wide: true, hint: 'One per line' },
    ],
  },
  {
    key: 'certificates',
    label: 'Certificates',
    itemLabel: 'certificate',
    titleKey: 'title',
    subtitleKey: 'issuer',
    fields: [
      { key: 'title', label: 'Certificate name', type: 'text' },
      { key: 'issuer', label: 'Issued by', type: 'text' },
      { key: 'issued', label: 'Date issued', type: 'text', hint: 'e.g. Aug 2025' },
      { key: 'credentialId', label: 'Credential ID', type: 'text' },
      { key: 'url', label: 'Verification link', type: 'url' },
      { key: 'image', label: 'Certificate image', type: 'image', wide: true },
    ],
  },
  {
    key: 'skills',
    label: 'Skills',
    itemLabel: 'group',
    titleKey: 'group',
    fields: [
      { key: 'group', label: 'Group name', type: 'text', hint: 'e.g. Languages, Cloud, Tools' },
      { key: 'items', label: 'Skills in this group', type: 'lines', wide: true, hint: 'One per line' },
    ],
  },
  {
    key: 'education',
    label: 'Education',
    itemLabel: 'entry',
    titleKey: 'qualification',
    subtitleKey: 'school',
    fields: [
      { key: 'qualification', label: 'Degree or programme', type: 'text' },
      { key: 'school', label: 'Institution', type: 'text' },
      { key: 'start', label: 'Started', type: 'text' },
      { key: 'end', label: 'Ended', type: 'text' },
      { key: 'detail', label: 'Detail', type: 'textarea', wide: true, hint: 'Grade, thesis, notable coursework' },
    ],
  },
  {
    key: 'blogs',
    label: 'Writing',
    itemLabel: 'post',
    titleKey: 'title',
    subtitleKey: 'source',
    fields: [
      { key: 'title', label: 'Post title', type: 'text' },
      { key: 'url', label: 'Link', type: 'url' },
      { key: 'source', label: 'Published on', type: 'text', hint: 'e.g. Medium, Dev.to, your blog' },
      { key: 'date', label: 'Date', type: 'text', hint: 'e.g. Jun 2026' },
      { key: 'excerpt', label: 'Excerpt', type: 'textarea', wide: true },
    ],
  },
];

export const SECTION_TOGGLES: { key: string; label: string }[] = [
  { key: 'about', label: 'About' },
  { key: 'experience', label: 'Experience' },
  { key: 'projects', label: 'Projects' },
  { key: 'certificates', label: 'Certificates' },
  { key: 'skills', label: 'Skills' },
  { key: 'education', label: 'Education' },
  { key: 'blogs', label: 'Writing' },
];

/** Builds a blank item so "Add" produces every key the site expects. */
export function blankItem(c: Collection): Record<string, unknown> {
  const item: Record<string, unknown> = { id: newId() };
  for (const f of c.fields) {
    item[f.key] = f.type === 'lines' ? [] : f.type === 'bool' ? false : '';
  }
  return item;
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}
