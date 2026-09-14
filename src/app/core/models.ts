export interface Social {
  id: string;
  label: string;
  url: string;
}

export interface Profile {
  name: string;
  role: string;
  tagline: string;
  location: string;
  email: string;
  resumeFile: string;
  socials: Social[];
}

export interface About {
  heading: string;
  body: string;
}

export interface Experience {
  id: string;
  role: string;
  company: string;
  companyUrl: string;
  start: string;
  end: string;
  location: string;
  summary: string;
  highlights: string[];
  tech: string[];
}

export interface Education {
  id: string;
  school: string;
  qualification: string;
  start: string;
  end: string;
  detail: string;
}

export interface SkillGroup {
  id: string;
  group: string;
  items: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  repo: string;
  demo: string;
  tech: string[];
  featured: boolean;
}

export interface Certificate {
  id: string;
  title: string;
  issuer: string;
  issued: string;
  credentialId: string;
  url: string;
  image: string;
}

export interface Blog {
  id: string;
  title: string;
  url: string;
  source: string;
  date: string;
  excerpt: string;
}

export interface SectionVisibility {
  about: boolean;
  experience: boolean;
  projects: boolean;
  certificates: boolean;
  skills: boolean;
  education: boolean;
  blogs: boolean;
}

export interface Portfolio {
  profile: Profile;
  about: About;
  experience: Experience[];
  projects: Project[];
  certificates: Certificate[];
  skills: SkillGroup[];
  education: Education[];
  blogs: Blog[];
  visible: SectionVisibility;
}

/** Shape used when the content file is missing or unreadable. */
export const EMPTY_PORTFOLIO: Portfolio = {
  profile: {
    name: '',
    role: '',
    tagline: '',
    location: '',
    email: '',
    resumeFile: '',
    socials: [],
  },
  about: { heading: '', body: '' },
  experience: [],
  projects: [],
  certificates: [],
  skills: [],
  education: [],
  blogs: [],
  visible: {
    about: true,
    experience: true,
    projects: true,
    certificates: true,
    skills: true,
    education: true,
    blogs: true,
  },
};

/** Fills in anything a hand-edited or older content file is missing. */
export function normalise(raw: Partial<Portfolio> | null): Portfolio {
  const base = structuredClone(EMPTY_PORTFOLIO);
  if (!raw) return base;
  return {
    profile: { ...base.profile, ...(raw.profile ?? {}) },
    about: { ...base.about, ...(raw.about ?? {}) },
    experience: raw.experience ?? [],
    projects: raw.projects ?? [],
    certificates: raw.certificates ?? [],
    skills: raw.skills ?? [],
    education: raw.education ?? [],
    blogs: raw.blogs ?? [],
    visible: { ...base.visible, ...(raw.visible ?? {}) },
  };
}
