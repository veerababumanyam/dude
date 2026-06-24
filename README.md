<div align="center">

<img src="DudeLogo.png" alt="Dude" width="140" />

<h1>Dude</h1>

<p><strong>The effortless way to survey sites, scope manpower, and close commercial proposals.</strong></p>

<p>A fast, offline-first workspace for facilities-management teams — from the first site walk-through to the signed quotation.</p>

<p>
  <img alt="React" src="https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white&style=for-the-badge" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white&style=for-the-badge" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white&style=for-the-badge" />
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white&style=for-the-badge" />
</p>

<p>
  <a href="#-features">Features</a>
  &nbsp;·&nbsp;
  <a href="#-quick-start">Quick Start</a>
  &nbsp;·&nbsp;
  <a href="#-tech-stack">Tech Stack</a>
  &nbsp;·&nbsp;
  <a href="#-project-structure">Structure</a>
</p>

</div>

<hr />

## ✨ Overview

**Dude** turns the messy, multi-step process of site surveying and commercial quoting into a single guided flow. Capture site details, build a service-and-manpower matrix, track every deal through your pipeline, and visualize the whole book of business — all in one responsive app that works happily offline.

<div align="center">

| 🗂️ Pipeline | 📝 Guided Forms | 📊 Live Analytics |
|:---:|:---:|:---:|
| Track every proposal end-to-end | Four-step survey & quotation flow | Status, value & geography at a glance |

</div>

<hr />

## 🚀 Features

### 🧭 Proposal Pipeline
- **Dashboard at a glance** — every active proposal with status, quotation value, and a deadline countdown.
- **Customizable statuses** — from *Need to Survey* → *Survey Done* → *Quotation Sent*, color-coded and fully editable.
- **Priorities & deadlines** — flag deals **High / Medium / Low** and never miss a *days remaining* window.
- **Bulk actions** — multi-select to archive or export in one click.
- **Duplicate & archive** — clone a proposal as a starting point, or tuck completed ones away.

### 📝 Guided Survey & Quotation Form
A clean four-section flow that mirrors how a real site survey happens:

1. **General Site Details** — name, location, unit type (Apartment, Villa, Commercial, Hospital, School…), and square footage.
2. **Services Matrix** — Housekeeping, Security, MEP, Horticulture, Coaches, and Pest Control, each with granular **role-level manpower** (quantity, gender, shift).
3. **Handover & Contact** — point of contact, handover party, tenure, schedule, and notes.
4. **Commercials & Status** — per-role **salaries**, ESI & PF, operating timings, and the final **quotation value**.

### 💾 Offline-First & Installable
- **Installable PWA** — add Dude to your home screen or desktop and launch it like a native app.
- **Works offline** — a service worker caches the app shell; your data lives in IndexedDB.
- **Auto-saving drafts** — your work is persisted as you type, so nothing is ever lost.
- **Safe archive** — archiving is a recoverable soft-delete with one-tap **Undo**; restore or permanently remove from the Archive view.
- **Robust validation** — schema-driven validation with clear, friendly messages.

### 🗺️ Real Maps & Geocoding
- **Search any address** powered by OpenStreetMap, or **tap the map** to drop a pin.
- Locations carry real coordinates, powering the **site map** and **distance-from-base** filtering.

### 📊 Analytics & Insights
- **Pipeline by Status** — a donut chart of where every deal sits.
- **Pipeline Value** — a bar chart of revenue potential across stages.
- **Site Map** — an interactive map plotting every site by location.

### 📤 Export & Share
- **PDF generation** — produce a polished proposal document in a click.
- **CSV export** — export the whole pipeline (or a selection), safely escaped against spreadsheet formula injection.
- **Smart search** — instant filtering with recent-search memory.

### ✨ Optional Assist
- With an API key configured, generate a crisp **proposal summary** or a ready-to-send **client email** draft. Entirely optional — the app is fully functional without it.

### 🎨 Crafted Experience
- **Responsive by design** — purpose-built layouts for both desktop and mobile.
- **Fluid motion** — subtle, tasteful animations throughout.
- **Elegant notifications** — non-intrusive toasts for every action.

<hr />

## ⚡ Quick Start

> **Prerequisites:** [Node.js](https://nodejs.org/) 18+

```bash
# 1. Install dependencies
npm install

# 2. (Optional) configure environment
cp .env.example .env.local   # then add your keys

# 3. Run the dev server
npm run dev
```

Then open **http://localhost:3000** 🎉

### 📜 Available Scripts

| Command | What it does |
|:--|:--|
| `npm run dev` | Start the Vite dev server on port `3000` |
| `npm run build` | Build an optimized, installable PWA production bundle |
| `npm run preview` | Preview the production build locally |
| `npm run typecheck` | Type-check the project with `tsc` |
| `npm run lint` | Lint the codebase with ESLint |
| `npm run format` | Format the source with Prettier |
| `npm run test` | Run the unit test suite (Vitest) |
| `npm run clean` | Remove build artifacts |

<hr />

## 🛠️ Tech Stack

<div align="center">

| Layer | Tools |
|:--|:--|
| **Framework** | React 19 · TypeScript |
| **Build** | Vite 6 · vite-plugin-pwa |
| **Styling** | Tailwind CSS 4 |
| **Forms** | React Hook Form · Zod |
| **Data Viz** | Recharts |
| **Maps & Geocoding** | React Leaflet · Leaflet · OpenStreetMap |
| **Motion** | Motion |
| **Storage** | idb-keyval (IndexedDB) |
| **Docs/Export** | html2pdf.js |
| **Icons & UI** | Lucide · Sonner |
| **Quality** | ESLint · Prettier · Vitest |

</div>

<hr />

## 📁 Project Structure

```
dude/
├── src/
│   ├── App.tsx                  # App shell & orchestration
│   ├── schema.ts                # Zod validation schema for the survey form
│   ├── types.ts                 # Shared domain types (Proposal, settings…)
│   ├── constants.ts             # Services, roles, statuses & options
│   ├── hooks/
│   │   └── useProposals.ts      # Proposal state, persistence & CRUD
│   ├── lib/
│   │   ├── storage.ts           # Versioned IndexedDB layer + migrations
│   │   ├── proposals.ts         # IDs, deadlines, CSV, distance helpers
│   │   ├── geocode.ts           # OpenStreetMap forward/reverse geocoding
│   │   └── ai.ts                # Optional assist (env-gated)
│   ├── components/
│   │   ├── dashboard/           # Dashboard, ProposalCard, Analytics
│   │   ├── modals/              # Details, History, Settings, Assist
│   │   ├── FormSectionA–D.tsx   # The four-step survey form
│   │   ├── LocationPickerModal.tsx
│   │   └── ui/                  # Reusable UI primitives (+ accessible Modal)
│   ├── utils.ts                 # Formatting helpers
│   └── index.css                # Theme & global styles
├── index.html
└── vite.config.ts
```

<hr />

<div align="center">

<sub>Built with ❤️ and a lot of coffee. <strong>Dude</strong> — get it done.</sub>

</div>

<div align="center">
  <sub>This app is Powered by <a href="https://erup.ai/">CoBolt</a></sub>
</div>
