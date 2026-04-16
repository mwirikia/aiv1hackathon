# User Journeys — Workforce & Operational Intelligence

## Users and views

The challenge brief defines four users. Each maps to one or more views in the tool:

| User | Primary view | Also uses |
|------|-------------|-----------|
| Director / senior leader | Director's Dashboard (`dashboard.html`) | Chat assistant (any page) |
| Head of operations / resource manager | Operations View (`operations.html`) | Ticket View, Staff Finder |
| Team leader | Team Leader View (`team-leader.html`) | Staff Finder, Director's Dashboard |
| Operational team member | Ticket View (`tickets.html`) | Operations View (automation candidates) |

All users can also use the **Staff Finder** (`index.html`) to search people, teams, skills, and tickets.

All five pages share a consistent navigation bar with the active page highlighted, and a floating chat assistant (💬) available in the bottom-right corner.

---

## Journey 1: Director answers a minister's question

**Scenario:** A minister asks "How many of your people are working on the new priority programme, and do you have the capacity to absorb more?"

**Before this tool:** The director emails four team leaders. Two respond by end of day. One sends a spreadsheet with different categories. The director pieces together an approximate answer two days later.

**With this tool:**

1. Director opens **Director's Dashboard** (`dashboard.html`)
2. The summary banner immediately shows total staff, average allocation, over-allocated count, and available capacity
3. The KPI cards show the headline numbers — each card is clickable and links to the relevant detail view:
   - **Total Staff** → Staff Finder
   - **Over-allocated** → Operations View pressure rankings
   - **Available** → Operations View redeployment planner
   - **Open Tickets** → Ticket View
   - **High Priority Open** → Ticket View at-risk tickets
4. The team allocation chart shows which teams are stretched and which have room
5. The **Single Points of Failure** section flags over-allocated staff with skills no one else holds, grouped by team
6. If they need a specific answer, they click the **💬 chat button** and ask: *"Do we have capacity for a new programme?"*
7. The chat responds with the number of staff with spare capacity, their combined FTE availability, and a table of names and teams — with deep links to the Staff Finder and Operations View
8. They ask a follow-up: *"Show me project staffing"* — the chat lists every project with headcount and FTE
9. The director has a clear, data-backed answer in under two minutes

**Key features used:** Summary banner, clickable KPI cards, team allocation chart, single points of failure table, recommendations, chat Q&A with deep links

---

## Journey 2: Head of operations prepares for quarterly review

**Scenario:** The head of operations needs to understand where her teams are under pressure, which ticket categories are taking longest, and whether she can move two people onto a new project.

**Before this tool:** She asks the IT service desk manager for a spreadsheet export. She spends an afternoon manipulating it. She checks the HR system for headcount and the project tracker for allocations — neither links to the other, and neither is up to date.

**With this tool:**

1. She opens **Operations View** (`operations.html`)
2. The summary panel shows teams under pressure, over-allocated staff, and available redeployment candidates
3. She clicks the **Teams Under Pressure** KPI card — it scrolls to the pressure rankings table showing each team's combined score from allocation, over-commitment, and ticket load
4. She clicks **Available for Redeployment** — it scrolls to the redeployment planner showing all staff with spare capacity, their skills, and current projects
5. Below the full list, she sees **skills-matched suggestions** for pressured teams — each with a recommendation panel explaining who to move, why, and what to check before acting
6. She scrolls to **Automation Candidates** to see which ticket categories could be automated based on volume and resolution patterns
7. She checks **Operational Workload by Team** for ticket volume and resolution performance
8. The **Total Staff** KPI links to the Staff Finder for the full directory
9. The **Open Tickets** KPI links directly to the Ticket View for detail
10. For ticket triage, she navigates to **Ticket View** via the nav bar

**Key features used:** Pressure rankings, redeployment planner with recommendations, automation candidates, workload analysis, clickable KPI cards linking across views

---

## Journey 3: Head of operations triages tickets

**Scenario:** The head of operations wants to see which tickets are at risk of breaching their service level and which teams are handling them.

**With this tool:**

1. She opens **Ticket View** (`tickets.html`)
2. The summary shows open tickets, overdue count, expiring count, and on-track count
3. The KPI cards are clickable — **Overdue** and **Expiring Soon** scroll to the at-risk section, **On Track** scrolls to the full table
4. She sees **At-Risk Tickets** — cards for each overdue or expiring ticket with:
   - TTL countdown bar showing time used vs limit
   - Priority and category
   - The assigned team's pressure level, average allocation, and over-allocated count
5. She scrolls to **All Open Tickets** — a table sorted by urgency with TTL remaining, elapsed days, and team pressure status
6. She checks **Resolution Performance by Team** to see which teams have overdue tickets and how their average resolution compares
7. She uses the **💬 chat** to ask: *"Which categories take longest to resolve?"* — the chat responds with resolution times and a link back to the Ticket View

**Key features used:** TTL tracking, at-risk ticket cards with team pressure overlay, clickable KPIs, resolution performance table

---

## Journey 4: Team leader makes the case for more resource

**Scenario:** A team leader knows his team is at capacity but cannot easily show it. His evidence is qualitative — his team tells him they are busy. He needs data to support the conversation with his director.

**Before this tool:** He has no way to demonstrate workload quantitatively. His case relies on anecdote.

**With this tool:**

1. He opens **Team Leader View** (`team-leader.html`)
2. He selects his team from the dropdown
3. The **health summary KPIs** show team size, average allocation, over-allocated count, at-capacity count, spare capacity, and open tickets
4. The **Director Briefing** panel provides a ready-made evidence summary:
   - Capacity assessment — automatically categorises the team as over-stretched, under pressure, near capacity, or has capacity
   - Operational load — open ticket count including high-priority
   - Skills risk — skills held by only one person in the team, with names
   - Recommendation — specific, actionable advice (e.g. "needs additional resource", "rebalance allocations", "monitor closely")
   - Links to the Operations View redeployment planner for cross-team support
5. The **Team Members** table shows each person's allocation bar with 100% marker, their projects, and role — sorted by allocation so the most stretched are at the top
6. The **Single Points of Failure** table shows skills held by only one person in the team, flagging those who are also over-allocated
7. The **Open Tickets** table shows tickets assigned to the team sorted by priority
8. He shares the URL (`team-leader.html#TeamName`) with his director — the data and recommendation speak for themselves
9. The director can cross-reference with the **Operations View** pressure rankings to see how this team compares to others

**Key features used:** Team selector, health summary KPIs, director briefing panel with auto-generated recommendation, single points of failure, member table with allocation bars, open tickets

---

## Journey 5: Operational team member surfaces repetitive work

**Scenario:** A team member processing access requests knows the process is repetitive and predictable. She wants this knowledge to surface in a form someone can act on.

**With this tool:**

1. Her manager opens **Operations View** (`operations.html`)
2. The **Automation Candidates** section shows ticket categories ranked by volume and automation potential
3. Access requests are flagged as high potential — high volume, predictable process, currently taking multiple days for what could be automated
4. The manager can use this data to make a business case for automation investment
5. Via the **💬 chat**, anyone can ask *"What could be automated?"* — the response lists categories with volume, resolution time, and automation potential, with a link to the Operations View

**Key features used:** Automation candidates table, chat Q&A with deep links

---

## Journey 6: Director asks an ad-hoc question

**Scenario:** The director is in a meeting and gets asked an unexpected question about skills risk or a specific team.

**With this tool:**

1. From any page, the director clicks the **💬 button** in the bottom-right corner
2. They type: *"What are the skills risks?"*
3. The chat responds with the number of skills held by only one person, flags those who are also over-allocated, and provides a table with deep links to each person's profile in the Staff Finder
4. They ask: *"Tell me about IT Service Desk"*
5. The chat responds with the team's allocation, over-committed staff, open tickets, and resolution time — with links to the team view in Staff Finder and the pressure rankings in Operations View
6. They ask: *"Who could I redeploy?"*
7. The chat lists candidates with spare capacity and links to the Operations View redeployment planner for skills-matched suggestions
8. The director has the answer without leaving the meeting

**Key features used:** Floating chat widget available on all pages, deep links across all five views

---

## Coverage against the challenge brief

### Scenarios from the brief

| Scenario | Covered | Where |
|----------|---------|-------|
| "How many people on the programme, can we absorb more?" | ✅ | Dashboard KPIs + chat Q&A (capacity, project staffing) |
| "Where are teams under pressure before quarterly review?" | ✅ | Operations View — pressure rankings |
| "Which teams handle most volume, which categories take longest?" | ✅ | Operations View — workload by team, Dashboard — resolution chart |
| "Can I move two people without destabilising?" | ✅ | Operations View — redeployment planner with skills matching and recommendations |
| "Team leader making the case for more resource" | ✅ | Team Leader View — director briefing panel with auto-generated evidence and recommendation |
| "Operational member surfacing repetitive processes" | ✅ | Operations View — automation candidates |

### Directions from Hint 2

| Direction | Covered | Where |
|-----------|---------|-------|
| The workforce question (over-commitment, capacity, skills concentration) | ✅ | Dashboard, Operations View, Team Leader View, Staff Finder, chat |
| The operational question (ticket volume, resolution times, backlogs) | ✅ | Ticket View, Operations View, Dashboard |
| Joining them up (teams over-committed AND handling high ticket volume) | ✅ | Ticket View — team pressure overlay on tickets, Operations View — pressure score combines both |
| The automation question (high-volume predictable categories) | ✅ | Operations View — automation candidates |

### Users from the brief

| User | Covered | Primary view |
|------|---------|-------------|
| Director / senior leader | ✅ | Director's Dashboard + chat |
| Head of operations / resource manager | ✅ | Operations View + Ticket View |
| Team leader | ✅ | Team Leader View — dedicated view with director briefing panel |
| Operational team member | ✅ | Ticket View + Operations View (automation candidates) |

### Success criteria from the brief

> "By the end of the day, you should be able to show a clear answer to at least one specific question a director would actually ask — presented in a format they could read in under two minutes."

The Director's Dashboard answers multiple questions in under two minutes via the summary banner, clickable KPI cards, charts, and recommendations. The chat assistant can answer ad-hoc questions immediately with data-backed responses and deep links.

> "If you can also explain what the data reveals, what you would recommend based on it, and what you would need to go further, that is a strong and credible demo."

- **What the data reveals:** Dashboard recommendations and single points of failure, Operations pressure rankings, Ticket TTL tracking
- **What we recommend:** Operations redeployment planner with actionable recommendations per team, Team Leader director briefing with auto-generated advice, automation candidates
- **What we would need to go further:** Real-time data feeds from HR/project/ticketing systems, LLM-powered chat for more flexible Q&A, historical trend analysis

---

## What we would build next

- **LLM-powered chat** — replace pattern matching with a language model for more flexible, conversational Q&A
- **API layer** — serve the data and insights as REST endpoints so other tools can consume them
- **Historical trends** — track allocation and ticket data over time to show whether pressure is increasing or decreasing
- **Alerts** — notify managers when a team crosses a pressure threshold or a ticket breaches its TTL
- **Export** — allow directors to export a briefing summary as a PDF or email-ready format
- **Real-time data** — connect to live HR, project management, and ticketing systems instead of static JSON files
- **Team leader self-service** — allow team leaders to update their own allocation data and flag capacity changes

---
Version: 2.0
Last updated: April 2026
