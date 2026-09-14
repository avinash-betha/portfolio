# Portfolio with a built-in admin panel

An Angular portfolio site hosted free on GitHub Pages. All content — profile, experience,
projects, certificates, skills, education, blog links, and your resume PDF — is edited from
`/admin` in the browser. Saving commits the changes back to your own repository, so you never
touch the code to update the site.

## How it works

```
You edit at /admin
        │
        ▼
GitHub Contents API commits public/content/portfolio.json to your repo
        │
        ▼
The push triggers .github/workflows/deploy.yml
        │
        ▼
Angular builds and deploys to GitHub Pages (about a minute)
```

The public page fetches `content/portfolio.json` at runtime, so the content file stays plain,
readable JSON you can also hand-edit on GitHub if you ever want to.

## Setup

### 1. Create the repository

Create a new GitHub repository (public — Pages is free for public repos), then push these files
to the `main` branch.

```bash
npm install
git init
git add .
git commit -m "Portfolio site"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/portfolio.git
git push -u origin main
```

### 2. Point the app at your repo

Open `src/app/core/config.ts` and set:

```ts
export const REPO_DEFAULTS = {
  owner: 'YOUR-USERNAME',
  repo: 'portfolio',
  branch: 'main',
};
```

This only pre-fills the admin sign-in form, so it is a convenience rather than a requirement.

### 3. Turn on GitHub Pages

In the repository, go to **Settings → Pages** and set **Source** to **GitHub Actions**. Push once
more (or run the workflow manually from the Actions tab) and your site appears at
`https://YOUR-USERNAME.github.io/portfolio/`.

The workflow works out the base href automatically. If you name the repo
`YOUR-USERNAME.github.io`, the site is served from the root instead.

### 4. Create an access token

The admin panel writes to your repo using a GitHub token.

1. Go to **github.com → Settings → Developer settings → Personal access tokens → Fine-grained tokens**
2. **Generate new token**
3. Repository access: **Only select repositories** → pick your portfolio repo
4. Permissions → Repository permissions → **Contents: Read and write**
5. Set an expiry you are comfortable with and generate it

Copy the token. Visit `https://YOUR-USERNAME.github.io/portfolio/admin`, paste it in, and sign in.

**About token safety.** The token lives in `sessionStorage` in your browser tab and is wiped when
you close the tab. It is never written into the repository or the built site. Keep it scoped to
this one repository with only Contents write access — then even if it leaks, the worst case is
edits to your portfolio content. Never paste a classic token with broad scopes into a browser.

## Using the admin panel

| Tab | What it controls |
| --- | --- |
| Profile | Name, role, intro line, location, email, social links |
| About | The paragraphs at the top of the page |
| Experience | Jobs, with highlights and tech used |
| Projects | Name, description, GitHub repo, live link, tech, pin to top |
| Certificates | Title, issuer, date, credential ID, verification link, image upload |
| Skills | Grouped skill lists |
| Education | Degrees and programmes |
| Writing | Blog posts and articles anywhere on the web |
| Resume | Upload the PDF the download button links to |
| Visibility | Hide a whole section without deleting its contents |

Every list supports add, delete, and reorder with the arrow buttons. Nothing goes live until you
press **Publish changes**, which makes one commit. Images and PDFs upload immediately when picked,
so publish afterwards to link them in.

Fields marked "One per line" — highlights, tech, skills — take one entry per line in the textarea.

### Adding a new field later

Open `src/app/admin/schema.ts`, add an entry to the relevant collection's `fields` array, then
render it in `src/app/site/site.html`. The admin form builds itself from the schema.

## Running it locally

```bash
npm install
npm start
```

Then open `http://localhost:4200`. The admin panel at `http://localhost:4200/admin` talks to the
real GitHub API, so local edits publish to your live site just the same.

## Deploying somewhere other than GitHub Pages

The build output in `dist/` is static files. Netlify, Vercel, and Cloudflare Pages all host it
free — point them at the repo, set the build command to `npm run build` and the output directory
to `dist`. On those hosts you can drop the `--base-href` flag and the 404.html copy step, since
they handle SPA routing themselves.

## Notes

- The site is responsive down to small phones, respects `prefers-reduced-motion`, and keeps
  visible keyboard focus.
- Fonts load from Google Fonts. To self-host them instead, download Bricolage Grotesque and
  Source Serif 4 into `public/fonts` and replace the `<link>` in `src/index.html` with `@font-face`
  rules in `src/styles.css`.
- Colours and type scale are CSS custom properties at the top of `src/styles.css`, so retheming
  the whole site is a handful of edits in one place.
