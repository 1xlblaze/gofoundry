# GoFoundry

Interactive Go learning platform covering:

- **DSA** — arrays/slices through DP, graphs, tries
- **Concepts** — interfaces, concurrency, context, generics, performance
- **Internals** — scheduler (G/M/P), GC, maps/slices, channels, escape analysis
- **LLD** — SOLID, patterns, rate limiter, LRU, URL shortener, parking lot, notifications
- **HLD** — foundations, CAP, caching, DBs, messaging, case studies, resilience

Features: detailed lessons with Go code, quizzes, search, and browser-local progress.

## Develop

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm start
```

## Deploy (GitHub Pages)

Repo: https://github.com/1xlblaze/gofoundry

Pushes to `main` build the static site and publish the `gh-pages` branch.

**One-time setup:** open [Pages settings](https://github.com/1xlblaze/gofoundry/settings/pages) → Source: **Deploy from a branch** → Branch: **gh-pages** / **/ (root)** → Save.

Live URL after that: https://1xlblaze.github.io/gofoundry/
