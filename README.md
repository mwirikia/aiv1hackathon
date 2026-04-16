# Director's Dashboard — Workforce & Operational Intelligence

AI Hackathon V1 April 2026 · Challenge 4: Knowing your own organisation

## What this is

A suite of four views that give directors, operations managers, and team leaders an instant, data-backed picture of their organisation — without emailing four team leaders and waiting two days for a spreadsheet.

It combines workforce allocation data, operational ticket data, and org structure into purpose-built views for different users:

- **Director's Dashboard** — KPI cards, team allocation charts, resolution time breakdowns, and flagged recommendations
- **Operations View** — team pressure rankings, redeployment planner with skills matching, automation candidates, and workload analysis
- **Ticket View** — time-to-live tracking for open tickets, at-risk ticket cards, and resolution performance by team
- **Staff Finder** — searchable directory of people, teams, skills, and tickets with individual profiles

A **floating chat assistant** is available on every page, allowing users to ask natural language questions and get data-backed answers with deep links to the relevant view.

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

## Pages

| URL | User | Description |
|-----|------|-------------|
| `/dashboard.html` | Director / senior leader | KPI overview, team allocation charts, resolution times, recommendations, chat Q&A |
| `/operations.html` | Head of operations / resource manager | Team pressure rankings, redeployment planner with skills matching and recommendations, automation candidates, workload by team |
| `/tickets.html` | Operations team / ticket triage | Time-to-live tracking, at-risk ticket cards with TTL countdown bars, open ticket table with team pressure overlay, resolution performance |
| `/index.html` | All users | Searchable directory of people, teams, skills, and tickets with individual profiles and team overviews |

All pages share a consistent ONS Design System navigation bar with the active page highlighted. The floating chat assistant (💬 button, bottom-right) is available on every page.

## Project structure

```
aiv1hackathon/
├── css/
│   └── chat-widget.css       # Floating chat widget styles
├── data/
│   ├── workforce.json        # Employee records with roles, grades, skills, allocations
│   ├── tickets.json          # Operational tickets with categories, priorities, dates
│   └── org-chart.json        # Organisation structure and team membership
├── js/
│   ├── data.js               # Data loading and derived metrics (shared across all pages)
│   ├── insights.js           # Q&A engine — pattern matching with deep links to views
│   ├── chat-widget.js        # Floating chat widget — self-injecting, works on any page
│   ├── dashboard.js          # Director's Dashboard — KPI cards, charts, recommendations
│   ├── operations.js         # Operations View — pressure scoring, redeployment, automation
│   ├── tickets.js            # Ticket View — TTL calculations, at-risk rendering
│   └── app.js                # Dashboard bootstrap
├── dashboard.html            # Director's Dashboard
├── operations.html           # Operations Manager View
├── tickets.html              # Ticket Triage View
├── index.html                # Staff & Services Finder
└── README.md
```

## Key features

### Director's Dashboard
- Summary banner with headline metrics
- KPI cards: total staff, average allocation, over-allocated count, available capacity, open tickets, high-priority tickets
- Team average allocation bar chart
- Average resolution time by ticket category chart
- Team breakdown table with allocation bars (including 100% capacity marker), over-allocation counts, spare capacity, and open tickets
- Flagged recommendations: over-allocation risks, open high-priority tickets, spare capacity opportunities, skills concentration risks

### Operations View
- Team pressure rankings — combined score from allocation load, over-commitment, and ticket volume
- Redeployment planner — full list of staff with spare capacity, plus skills-matched suggestions for pressured teams with actionable recommendations
- Automation candidates — ticket categories ranked by volume and automation potential
- Operational workload by team — ticket volume and resolution performance
- Clickable KPI cards that scroll to the relevant section

### Ticket View
- Time-to-live (TTL) tracking — each open ticket gets a TTL based on priority (High: 3 working days, Medium: 10, Low: 20)
- At-risk ticket cards — overdue and expiring tickets with TTL countdown bars and team pressure overlay
- All open tickets table sorted by urgency with TTL remaining, elapsed days, and team pressure status
- Resolution performance by team with overdue counts

### Staff Finder
- Live search across people, skills, teams, and ticket descriptions
- Team overview pages with member tables, allocation bars with 100% marker, and open tickets
- Individual profiles with project allocation breakdowns, skills, tenure, and team lead information

### Floating Chat Assistant
- Available on every page via a 💬 button in the bottom-right corner
- Handles ~12 question types including capacity, pressure, over-allocation, skills risk, tickets, projects, redeployment, automation, headcount, and summaries
- Answers include deep links to relevant pages and sections (e.g. team names link to Staff Finder, ticket references link to Ticket View, pressure data links to Operations View)
- Suggestion chips for follow-up questions
- Typing indicator for natural feel

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

## Design system

All pages use the [ONS Design System](https://service-manual.ons.gov.uk/design-system) (v73.3.0) loaded via CDN. Components used include:

- Navigation: `ons-navigation--main`, `ons-navigation__item`, `ons-navigation__item--active`
- Layout: `ons-container--wide`, `ons-grid`, `ons-grid__col`
- Header/Footer: `ons-header--internal`, `ons-footer`
- Panels: `ons-panel--info`, `ons-panel--bare`
- Tables: `ons-table`, `ons-table__head`, `ons-table__body`, `ons-table__row`, `ons-table__header`, `ons-table__cell`
- Buttons: `ons-btn`, `ons-btn__inner`, `ons-btn__text`
- Inputs: `ons-input`, `ons-input--text`
- Status badges: `ons-status--error`, `ons-status--success`, `ons-status--pending`, `ons-status--dead`
- Typography and spacing: `ons-u-fs-m`, `ons-u-fs-r--b`, `ons-u-mt-l`, `ons-u-mb-l`, etc.

## Tech stack

- Vanilla HTML, CSS, JavaScript — no frameworks, no build tools
- ONS Design System v73.3.0 (CDN)
- Client-side pattern-matching Q&A with deep links (no LLM API required)
- Reads JSON data files directly via `fetch()`

## Data format

The app reads three JSON files from the `data/` directory. You can replace these with your own data as long as the schema is maintained:

- `workforce.json` — array of employee records with `employee_id`, `name`, `grade`, `role`, `team`, `team_lead`, `skills`, `allocations` (project + percentage), `total_allocation`, `location`, `start_date`
- `tickets.json` — array of tickets with `ticket_id`, `category`, `priority`, `assigned_team`, `created_date`, `resolved_date`, `status`, `description`
- `org-chart.json` — object with `organisation`, `director`, and `teams` array (each with `team`, `team_lead`, `parent_team`, `headcount`, `members`)

---

## Challenge brief

### Challenge 4: Knowing your own organisation

A minister asks a director a question: how many of your people are working on the new priority programme, and do you have the capacity to absorb more? The director does not know the answer. They send an email to four team leaders. Two respond by end of day. One sends a spreadsheet that uses different categories to another. The director pieces together an approximate answer and sends it back two days later.

This is not unusual. Departments hold significant information about their people, their projects, and their operational workload — but it is distributed across systems that were not designed to work together, and it is rarely accessible in a form that allows leaders to act on it quickly.

### Useful references

- [Civil Service statistics](https://www.gov.uk/government/collections/civil-service-statistics)
- [ONS public sector employment](https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/publicsectorpersonnel)
- [ONS Design System](https://service-manual.ons.gov.uk/design-system)

---
Version: 3.0
Last updated: April 2026
