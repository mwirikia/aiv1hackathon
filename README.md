# Director's Dashboard — Workforce & Operational Intelligence

AI Hackathon V1 April 2026 · Challenge 4: Knowing your own organisation

## What this is

A hybrid dashboard that gives directors and heads of operations an instant, data-backed picture of their organisation — without emailing four team leaders and waiting two days for a spreadsheet.

It combines workforce allocation data, operational ticket data, and org structure into a single view with:

- **Executive dashboard** — KPI cards, team allocation charts, resolution time breakdowns, and flagged recommendations
- **Natural language Q&A** — ask questions like *"Do we have capacity for a new programme?"* and get immediate answers with supporting tables

## How to run

The app is pure client-side HTML/JS with no build step. It just needs a local web server because it loads JSON data via `fetch()`.

### Option 1: Python (quickest)

```bash
cd aiv1hackathon
python3 -m http.server 8080
```

Open [http://localhost:8080/dashboard.html](http://localhost:8080/dashboard.html)

### Option 2: Node.js

```bash
cd aiv1hackathon
npx serve .
```

Open the URL shown in the terminal (usually [http://localhost:3000/dashboard.html](http://localhost:3000/dashboard.html))

### Option 3: PHP

```bash
cd aiv1hackathon
php -S localhost:8080
```

Open [http://localhost:8080/dashboard.html](http://localhost:8080/dashboard.html)

### Option 4: VS Code Live Server

1. Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension
2. Right-click `dashboard.html` → **Open with Live Server**

### Pages

| URL | Description |
|-----|-------------|
| `/dashboard.html` | Director's Dashboard — hybrid KPI + chat interface |
| `/index.html` | Staff & Services Finder — search people, teams, skills, tickets |

## Project structure

```
aiv1hackathon/
├── data/
│   ├── workforce.json      # 25 employee records across 6 teams
│   ├── tickets.json        # 50 operational tickets
│   └── org-chart.json      # Organisation structure
├── js/
│   ├── data.js             # Data loading and derived metrics
│   ├── insights.js         # Q&A engine — pattern matching for natural language questions
│   ├── dashboard.js        # KPI and chart rendering (ONS Design System)
│   ├── chat.js             # Chat interface with typing indicator and suggestion chips
│   └── app.js              # Bootstrap
├── dashboard.html          # Hybrid dashboard + chat (ONS Design System)
├── index.html              # Staff & Services Finder
└── README.md
```

## Design system

The dashboard uses the [ONS Design System](https://service-manual.ons.gov.uk/design-system) (v73.3.0) loaded via CDN. Components used include:

- Layout: `ons-container`, `ons-grid`, `ons-grid__col`
- Header/Footer: `ons-header--internal`, `ons-footer`
- Panels: `ons-panel--info`
- Tables: `ons-table`, `ons-table__head`, `ons-table__body`, `ons-table__row`
- Buttons: `ons-btn`
- Inputs: `ons-input`
- Status badges: `ons-status--error`, `ons-status--success`, `ons-status--pending`
- Typography and spacing utilities: `ons-u-fs-m`, `ons-u-mt-l`, etc.

## What the data reveals

- **8 of 25 staff** are allocated above 100% — this is spread across nearly every team
- **Every team lead** is over-allocated (20% team management on top of full project loads)
- **2 staff** have significant spare capacity (≤60%) and could absorb new work
- **7 tickets** remain open, including high-priority infrastructure and HR issues
- **Procurement requests** take ~28 days avg to resolve — the slowest category
- **Multiple skills** are held by only one person, creating single points of failure
- **IT Service Desk** is simultaneously over-committed on project work and handling the highest ticket volume — the biggest pressure point

## Example questions for the chat

- "Give me a summary"
- "Do we have capacity for a new programme?"
- "Which teams are under pressure?"
- "Who is over-allocated?"
- "Who could I redeploy?"
- "What are the skills risks?"
- "Show open tickets"
- "Tell me about Digital Services"
- "What could be automated?"
- "How many people work here?"
- "Show me project staffing"
- "Which categories take longest to resolve?"

## Tech stack

- Vanilla HTML, CSS, JavaScript — no frameworks, no build tools
- ONS Design System v73.3.0 (CDN)
- Client-side pattern-matching Q&A (no LLM API required)
- Reads JSON data files directly via `fetch()`

---

## Challenge brief

### Challenge 4: Knowing your own organisation

A minister asks a director a question: how many of your people are working on the new priority programme, and do you have the capacity to absorb more? The director does not know the answer. They send an email to four team leaders. Two respond by end of day. One sends a spreadsheet that uses different categories to another. The director pieces together an approximate answer and sends it back two days later.

This is not unusual. Departments hold significant information about their people, their projects, and their operational workload — but it is distributed across systems that were not designed to work together, and it is rarely accessible in a form that allows leaders to act on it quickly.

### Data provided

| File | Description |
|------|-------------|
| `workforce.json` | 25 synthetic employee records across 6 teams, with roles, grades, skills, and project allocations |
| `tickets.json` | 50 synthetic operational tickets across IT, Finance, HR, and Commercial |
| `org-chart.json` | Organisation structure for a fictional corporate services directorate with 6 teams |

### Useful references

- [Civil Service statistics](https://www.gov.uk/government/collections/civil-service-statistics)
- [ONS public sector employment](https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/publicsectorpersonnel)
- [ONS Design System](https://service-manual.ons.gov.uk/design-system)

---
Version: 2.0
Last updated: April 2026
