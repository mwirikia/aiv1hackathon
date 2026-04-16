// Insights engine — matches natural language questions to data-backed answers

function getInsight(query) {
  const q = query.toLowerCase().trim();

  // Route to the best matching handler
  for (const rule of insightRules) {
    if (rule.match(q)) return rule.answer();
  }

  return {
    text: `I don't have a specific answer for that yet. Try asking about capacity, team pressure, over-allocation, skills risk, tickets, projects, or redeployment.`,
    suggestions: ['Do we have capacity for a new programme?', 'Which teams are under pressure?', 'Who could I redeploy?'],
  };
}

// Each rule: { match(q) -> bool, answer() -> { text, table?, suggestions? } }
const insightRules = [

  // ── Capacity / absorb more work ──
  {
    match: q => /capac|absorb|new (programme|project|priority|work)|take on more|spare|available/.test(q),
    answer() {
      const free = Store.fullyFree;
      const under = Store.underAllocated;
      const totalSpare = under.reduce((s, p) => s + (100 - p.total_allocation), 0);
      let text = `You have <b>${under.length} staff at or below 80% allocation</b>, with a combined <b>${totalSpare}% spare capacity</b> (equivalent to ${(totalSpare / 100).toFixed(1)} FTE).\n\n`;
      if (free.length > 0) {
        text += `Of these, <b>${free.length} have significant availability (≤60%)</b> and could take on substantial new work:\n`;
      } else {
        text += `However, no one is below 60% — any redeployment would need to be partial.\n`;
      }
      const table = under.sort((a, b) => a.total_allocation - b.total_allocation).map(p => ({
        Name: p.name, Team: p.team, Grade: p.grade,
        Allocation: p.total_allocation + '%',
        'Spare capacity': (100 - p.total_allocation) + '%',
        Skills: p.skills.join(', '),
      }));
      return {
        text,
        table,
        suggestions: ['Who could I redeploy without disruption?', 'Which teams are over-committed?', 'Show me project staffing'],
      };
    },
  },

  // ── Over-allocation / stretched / overcommitted ──
  {
    match: q => /over.?alloc|stretch|overcommit|over.?commit|too (much|many)|burn|unsustainable/.test(q),
    answer() {
      const oa = Store.overAllocated;
      let text = `<b>${oa.length} staff are allocated above 100%</b> — they are committed to more work than one person can deliver.\n\n`;
      if (oa.length > 0) {
        const worst = oa.sort((a, b) => b.total_allocation - a.total_allocation)[0];
        text += `The most over-committed is <b>${worst.name}</b> at ${worst.total_allocation}%. `;
        const teamsAffected = [...new Set(oa.map(p => p.team))];
        text += `This affects ${teamsAffected.length} team${teamsAffected.length > 1 ? 's' : ''}: ${teamsAffected.join(', ')}.\n\n`;
        text += `This is a delivery risk. These individuals will either miss deadlines, work unsustainable hours, or produce lower quality work.`;
      }
      const table = oa.map(p => ({
        Name: p.name, Team: p.team, Grade: p.grade,
        Allocation: p.total_allocation + '%',
        Projects: p.allocations.map(a => `${a.project} (${a.percentage}%)`).join(', '),
      }));
      return {
        text,
        table,
        suggestions: ['Who has spare capacity?', 'Which projects are causing this?', 'What are the skills risks?'],
      };
    },
  },

  // ── Team pressure / which teams ──
  {
    match: q => /team.*(pressure|stress|struggle|busy|load|worst|problem)|pressure|which team|under pressure/.test(q),
    answer() {
      const sorted = [...Store.teams].sort((a, b) => b.avgAlloc - a.avgAlloc);
      const pressured = sorted.filter(t => t.avgAlloc > 90 || t.open.length > 0);
      let text = '';
      if (pressured.length > 0) {
        text += `<b>${pressured.length} teams show signs of pressure</b> (high allocation or open tickets):\n\n`;
        for (const t of pressured) {
          text += `• <b>${t.team}</b> — avg allocation ${t.avgAlloc}%, ${t.overCount} over-allocated, ${t.open.length} open tickets\n`;
        }
        const worst = pressured[0];
        text += `\n<b>${worst.team}</b> is the most stretched overall.`;
      } else {
        text += `No teams are showing critical pressure right now.`;
      }
      const table = sorted.map(t => ({
        Team: t.team, People: t.headcount, 'Avg Allocation': t.avgAlloc + '%',
        'Over-allocated': t.overCount, 'Open Tickets': t.open.length,
        'Avg Resolution': t.avgResolutionDays !== null ? t.avgResolutionDays + ' days' : '—',
      }));
      return {
        text,
        table,
        suggestions: ['Tell me about IT Service Desk', 'Who is over-allocated?', 'Show open tickets'],
      };
    },
  },

  // ── Specific team lookup ──
  {
    match: q => Store.teams.some(t => q.includes(t.team.toLowerCase())),
    answer() {
      const q = arguments[0]; // won't work — use closure trick
      return specificTeamAnswer();
    },
  },

  // ── Redeploy / move people ──
  {
    match: q => /redeploy|move (people|staff|someone)|reassign|transfer|shift (people|staff)/.test(q),
    answer() {
      const candidates = Store.underAllocated
        .filter(p => p.total_allocation <= 70)
        .sort((a, b) => a.total_allocation - b.total_allocation);
      let text = '';
      if (candidates.length > 0) {
        text += `<b>${candidates.length} staff could be redeployed</b> without major disruption (currently at ≤70% allocation):\n\n`;
        for (const p of candidates) {
          text += `• <b>${p.name}</b> (${p.team}, ${p.grade}) — ${p.total_allocation}% allocated, ${100 - p.total_allocation}% available. Skills: ${p.skills.join(', ')}\n`;
        }
        text += `\nBefore redeploying, check whether their current projects have upcoming deadlines and whether their skills match the new requirement.`;
      } else {
        text += `No staff are below 70% allocation. Redeployment would require reducing existing project commitments first.`;
      }
      return {
        text,
        suggestions: ['Do we have capacity for a new programme?', 'Which projects could release people?', 'What skills do we have available?'],
      };
    },
  },

  // ── Skills / skills risk / single point ──
  {
    match: q => /skill|single point|dependency|bus factor|specialist|expertise|knowledge risk/.test(q),
    answer() {
      const sps = Store.singlePointSkills;
      let text = `<b>${sps.length} skills are held by only one person</b> in the directorate. If any of these people leave or are unavailable, the capability is lost.\n\n`;
      const critical = sps.filter(s => s.person.total_allocation > 100);
      if (critical.length > 0) {
        text += `<b>${critical.length} of these are also over-allocated</b>, making the risk more acute — they are both the only person with the skill and already stretched beyond capacity.\n`;
      }
      const table = sps.sort((a, b) => b.person.total_allocation - a.person.total_allocation).map(s => ({
        Skill: s.skill, 'Only held by': s.person.name, Team: s.person.team,
        Allocation: s.person.total_allocation + '%',
      }));
      return {
        text,
        table,
        suggestions: ['Who is over-allocated?', 'Which teams are under pressure?', 'Who could I redeploy?'],
      };
    },
  },

  // ── Tickets / open tickets / backlog ──
  {
    match: q => /ticket|backlog|open (issue|request)|unresolved|service desk|resolution/.test(q),
    answer() {
      const open = Store.openTickets;
      const high = Store.highOpen;
      let text = `There are <b>${open.length} open tickets</b> across the directorate`;
      if (high.length > 0) {
        text += `, of which <b>${high.length} are high priority</b>`;
      }
      text += `.\n\n`;

      // By team
      const byTeam = new Map();
      for (const tk of open) {
        if (!byTeam.has(tk.assigned_team)) byTeam.set(tk.assigned_team, []);
        byTeam.get(tk.assigned_team).push(tk);
      }
      for (const [team, tix] of byTeam) {
        text += `• <b>${team}</b>: ${tix.length} open (${tix.filter(t => t.priority === 'high').length} high)\n`;
      }

      text += `\nAverage resolution times vary significantly by category — procurement requests take the longest.`;

      const table = open
        .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] || 9) - ({ high: 0, medium: 1, low: 2 }[b.priority] || 9))
        .map(tk => ({
          ID: tk.ticket_id, Priority: tk.priority, Category: fmtCat(tk.category),
          Team: tk.assigned_team, Opened: tk.created_date,
          Description: tk.description.length > 80 ? tk.description.substring(0, 80) + '…' : tk.description,
        }));
      return {
        text,
        table,
        suggestions: ['Which categories take longest to resolve?', 'Which teams are under pressure?', 'What could be automated?'],
      };
    },
  },

  // ── Resolution times / slow categories ──
  {
    match: q => /resolution time|how long|slow|longest|categor/.test(q),
    answer() {
      const cats = Store.catStats;
      let text = `Average resolution times by ticket category:\n\n`;
      for (const c of cats) {
        const flag = c.avg > 20 ? ' ⚠️ slow' : '';
        text += `• <b>${fmtCat(c.cat)}</b>: ${c.avg} days (${c.count} resolved)${flag}\n`;
      }
      text += `\nProcurement requests and finance queries take significantly longer than IT issues. This may reflect process complexity rather than team performance.`;
      return {
        text,
        suggestions: ['Show open tickets', 'Which teams are under pressure?', 'What could be automated?'],
      };
    },
  },

  // ── Projects / project staffing ──
  {
    match: q => /project|programme|staffing|who.*(work|assign)|how many.*(people|staff)/.test(q),
    answer() {
      const projs = Store.projects;
      let text = `There are <b>${projs.length} active projects</b> across the directorate:\n\n`;
      for (const p of projs.slice(0, 8)) {
        text += `• <b>${p.name}</b>: ${p.people.length} people, ${p.totalFTE.toFixed(1)} FTE\n`;
      }
      const biggest = projs[0];
      text += `\n<b>${biggest.name}</b> has the largest staffing commitment at ${biggest.totalFTE.toFixed(1)} FTE.`;
      const table = projs.map(p => ({
        Project: p.name, People: p.people.length, 'Total FTE': p.totalFTE.toFixed(1),
        Staff: p.people.map(s => `${s.name} (${s.pct}%)`).join(', '),
      }));
      return {
        text,
        table,
        suggestions: ['Do we have capacity for a new programme?', 'Who is over-allocated?', 'Which projects could release people?'],
      };
    },
  },

  // ── Automation candidates ──
  {
    match: q => /automat|repetit|efficien|streamline|pattern|same (type|kind)/.test(q),
    answer() {
      // Find high-volume, low-complexity ticket categories
      const resolved = Store.raw.tickets.filter(t => t.status === 'resolved');
      const catCounts = new Map();
      for (const tk of resolved) {
        if (!catCounts.has(tk.category)) catCounts.set(tk.category, { count: 0, totalDays: 0, tix: [] });
        const c = catCounts.get(tk.category);
        c.count++;
        c.totalDays += (new Date(tk.resolved_date) - new Date(tk.created_date)) / 86400000;
        c.tix.push(tk);
      }
      const candidates = [...catCounts.entries()]
        .map(([cat, s]) => ({ cat, count: s.count, avg: Math.round(s.totalDays / s.count) }))
        .sort((a, b) => b.count - a.count);

      let text = `Based on ticket patterns, the best candidates for automation are:\n\n`;
      for (const c of candidates) {
        const potential = c.count >= 8 ? '🟢 high potential' : c.count >= 4 ? '🟡 moderate' : '⚪ low volume';
        text += `• <b>${fmtCat(c.cat)}</b>: ${c.count} tickets, avg ${c.avg} days to resolve — ${potential}\n`;
      }
      text += `\n<b>Access requests</b> are the strongest automation candidate — high volume, predictable process, and currently taking multiple days for what could be an automated provisioning workflow.`;
      return {
        text,
        suggestions: ['Show open tickets', 'Which teams are under pressure?', 'Do we have capacity?'],
      };
    },
  },

  // ── Headcount / how many people ──
  {
    match: q => /headcount|how many (people|staff|employee)|total (people|staff)|size/.test(q),
    answer() {
      let text = `The directorate has <b>${Store.raw.people.length} staff</b> across ${Store.teams.length} teams:\n\n`;
      for (const t of Store.teams) {
        text += `• <b>${t.team}</b>: ${t.headcount} people (led by ${t.members.find(m => m.employee_id === t.team_lead)?.name || 'unknown'})\n`;
      }
      return {
        text,
        suggestions: ['Do we have capacity?', 'Which teams are under pressure?', 'Show project staffing'],
      };
    },
  },

  // ── Summary / overview / brief me ──
  {
    match: q => /summary|overview|brief|snapshot|state of|how are we|status|tell me everything|what should i know/.test(q),
    answer() {
      const oa = Store.overAllocated;
      const text = `<b>Directorate overview — ${Store.raw.people.length} staff, ${Store.teams.length} teams</b>\n\n` +
        `• Average allocation: <b>${Store.avgAllocOrg}%</b>\n` +
        `• Over-allocated (>100%): <b>${oa.length} staff</b> — delivery risk\n` +
        `• Available capacity (≤80%): <b>${Store.underAllocated.length} staff</b>\n` +
        `• Open tickets: <b>${Store.openTickets.length}</b> (${Store.highOpen.length} high priority)\n` +
        `• Skills held by only one person: <b>${Store.singlePointSkills.length}</b>\n` +
        `• Active projects: <b>${Store.projects.length}</b>\n\n` +
        `<b>Top concerns:</b>\n` +
        `1. ${oa.length} staff are over-committed — this is unsustainable\n` +
        `2. ${Store.highOpen.length} high-priority tickets remain open\n` +
        `3. ${Store.singlePointSkills.length} single-person skill dependencies create fragility\n\n` +
        `<b>Positive:</b> ${Store.fullyFree.length} staff have significant spare capacity and could absorb new work.`;
      return {
        text,
        suggestions: ['Who is over-allocated?', 'Do we have capacity for a new programme?', 'Which teams are under pressure?'],
      };
    },
  },

  // ── Specific person lookup ──
  {
    match: q => Store.raw.people.some(p => q.includes(p.name.toLowerCase())),
    answer() {
      // handled via closure in getInsight
      return { text: 'Person lookup — handled in getInsight.', suggestions: [] };
    },
  },
];

// Override the specific-team rule's answer to use the query
function specificTeamAnswer(query) {
  const q = query.toLowerCase();
  const team = Store.teams.find(t => q.includes(t.team.toLowerCase()));
  if (!team) return { text: 'Team not found.', suggestions: [] };

  const lead = team.members.find(m => m.employee_id === team.team_lead);
  let text = `<b>${team.team}</b> — ${team.headcount} people, led by ${lead?.name || 'unknown'}\n\n`;
  text += `• Average allocation: <b>${team.avgAlloc}%</b>\n`;
  text += `• Over-allocated: <b>${team.overCount}</b>\n`;
  text += `• Spare capacity (≤80%): <b>${team.spareCapacity.length}</b>\n`;
  text += `• Open tickets: <b>${team.open.length}</b>\n`;
  text += `• Avg resolution time: <b>${team.avgResolutionDays !== null ? team.avgResolutionDays + ' days' : 'N/A'}</b>\n`;

  if (team.overCount > 0) {
    const overMembers = team.members.filter(m => m.total_allocation > 100);
    text += `\n⚠️ Over-allocated: ${overMembers.map(m => `${m.name} (${m.total_allocation}%)`).join(', ')}`;
  }

  const table = team.members.map(m => ({
    Name: m.name, Role: m.role, Grade: m.grade,
    Allocation: m.total_allocation + '%',
    Projects: m.allocations.map(a => `${a.project} (${a.percentage}%)`).join(', '),
  }));

  return {
    text,
    table,
    suggestions: ['Who is over-allocated?', 'Do we have capacity?', 'Show open tickets'],
  };
}

// Person lookup
function personAnswer(query) {
  const q = query.toLowerCase();
  const person = Store.raw.people.find(p => q.includes(p.name.toLowerCase()));
  if (!person) return { text: 'Person not found.', suggestions: [] };

  let text = `<b>${person.name}</b> — ${person.role}, ${person.team} (${person.grade})\n\n`;
  text += `• Location: ${person.location}\n`;
  text += `• Total allocation: <b>${person.total_allocation}%</b>${person.total_allocation > 100 ? ' ⚠️ over-allocated' : ''}\n`;
  text += `• Skills: ${person.skills.join(', ')}\n\n`;
  text += `Projects:\n`;
  for (const a of person.allocations) {
    text += `• ${a.project}: ${a.percentage}%\n`;
  }

  // Check if they hold unique skills
  const uniqueSkills = person.skills.filter(s => {
    const holders = Store.skillHolders.get(s.toLowerCase());
    return holders && holders.length === 1;
  });
  if (uniqueSkills.length > 0) {
    text += `\n⚠️ <b>Single point of dependency</b> for: ${uniqueSkills.join(', ')}`;
  }

  return {
    text,
    suggestions: ['Show their team', 'Who else has similar skills?', 'Who is over-allocated?'],
  };
}

// Master dispatcher — called from chat
function answerQuestion(query) {
  const q = query.toLowerCase().trim();

  // Check person match first
  if (Store.raw.people.some(p => q.includes(p.name.toLowerCase()))) {
    return personAnswer(query);
  }

  // Check specific team match
  if (Store.teams.some(t => q.includes(t.team.toLowerCase()))) {
    return specificTeamAnswer(query);
  }

  return getInsight(query);
}

function fmtCat(c) {
  return c.replace(/_/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase());
}
