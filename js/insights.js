// Insights engine — matches natural language questions to data-backed answers with deep links

function linkTeam(name) { return '<a href="index.html#/team/' + encodeURIComponent(name) + '">' + name + '</a>'; }
function linkPerson(p) { return '<a href="index.html#/person/' + p.employee_id + '">' + p.name + '</a>'; }
function linkTickets() { return '<a href="tickets.html">Ticket View</a>'; }
function linkOps(anchor) { return '<a href="operations.html' + (anchor || '') + '">Operations View</a>'; }
function linkDash() { return '<a href="dashboard.html">Director\'s Dashboard</a>'; }
function fmtCat(c) { return c.replace(/_/g, ' ').replace(/\b\w/g, function(ch) { return ch.toUpperCase(); }); }

function getInsight(query) {
  var q = query.toLowerCase().trim();
  for (var i = 0; i < insightRules.length; i++) {
    if (insightRules[i].match(q)) return insightRules[i].answer();
  }
  return {
    text: 'I don\'t have a specific answer for that yet. Try asking about capacity, team pressure, over-allocation, skills risk, tickets, projects, or redeployment.',
    suggestions: ['Do we have capacity for a new programme?', 'Which teams are under pressure?', 'Who could I redeploy?'],
  };
}

var insightRules = [

  // Capacity
  {
    match: function(q) { return /capac|absorb|new (programme|project|priority|work)|take on more|spare|available/.test(q); },
    answer: function() {
      var under = Store.underAllocated;
      var free = Store.fullyFree;
      var totalSpare = under.reduce(function(s, p) { return s + (100 - p.total_allocation); }, 0);
      var text = 'You have <b>' + under.length + ' staff at or below 80% allocation</b>, with a combined <b>' + totalSpare + '% spare capacity</b> (equivalent to ' + (totalSpare / 100).toFixed(1) + ' FTE).\n\n';
      if (free.length > 0) {
        text += 'Of these, <b>' + free.length + ' have significant availability (≤60%)</b> and could take on substantial new work:\n';
      }
      text += '\nSee the full list in the ' + linkOps('#redeployment-planner') + '.';
      var table = under.sort(function(a, b) { return a.total_allocation - b.total_allocation; }).map(function(p) {
        return { Name: linkPerson(p), Team: p.team, Allocation: p.total_allocation + '%', Spare: (100 - p.total_allocation) + '%' };
      });
      return { text: text, table: table, suggestions: ['Who could I redeploy?', 'Which teams are over-committed?', 'Show me project staffing'] };
    },
  },

  // Over-allocation
  {
    match: function(q) { return /over.?alloc|stretch|overcommit|over.?commit|too (much|many)|burn|unsustainable/.test(q); },
    answer: function() {
      var oa = Store.overAllocated.sort(function(a, b) { return b.total_allocation - a.total_allocation; });
      var text = '<b>' + oa.length + ' staff are allocated above 100%</b> — committed to more work than one person can deliver.\n\n';
      if (oa.length > 0) {
        text += 'The most over-committed is ' + linkPerson(oa[0]) + ' at ' + oa[0].total_allocation + '%. ';
        var teams = []; oa.forEach(function(p) { if (teams.indexOf(p.team) === -1) teams.push(p.team); });
        text += 'This affects ' + teams.length + ' team' + (teams.length > 1 ? 's' : '') + ': ' + teams.map(linkTeam).join(', ') + '.\n\n';
        text += 'This is a delivery risk. See ' + linkOps('#team-pressure') + ' for team pressure rankings.';
      }
      var table = oa.map(function(p) {
        return { Name: linkPerson(p), Team: p.team, Allocation: p.total_allocation + '%', Projects: p.allocations.map(function(a) { return a.project + ' (' + a.percentage + '%)'; }).join(', ') };
      });
      return { text: text, table: table, suggestions: ['Who has spare capacity?', 'Which teams are under pressure?', 'What are the skills risks?'] };
    },
  },

  // Team pressure
  {
    match: function(q) { return /team.*(pressure|stress|struggle|busy|load|worst|problem)|pressure|which team|under pressure/.test(q); },
    answer: function() {
      var sorted = Store.teams.slice().sort(function(a, b) { return b.avgAlloc - a.avgAlloc; });
      var pressured = sorted.filter(function(t) { return t.avgAlloc > 90 || t.open.length > 0; });
      var text = '';
      if (pressured.length > 0) {
        text += '<b>' + pressured.length + ' teams show signs of pressure</b>:\n\n';
        pressured.forEach(function(t) {
          text += '• ' + linkTeam(t.team) + ' — avg allocation ' + t.avgAlloc + '%, ' + t.overCount + ' over-allocated, ' + t.open.length + ' open tickets\n';
        });
        text += '\nSee detailed pressure scores in the ' + linkOps('#team-pressure') + '.';
      } else {
        text += 'No teams are showing critical pressure right now.';
      }
      var table = sorted.map(function(t) {
        return { Team: linkTeam(t.team), People: t.headcount, 'Avg Allocation': t.avgAlloc + '%', 'Over-allocated': t.overCount, 'Open Tickets': t.open.length };
      });
      return { text: text, table: table, suggestions: ['Tell me about IT Service Desk', 'Who is over-allocated?', 'Show open tickets'] };
    },
  },

  // Redeploy
  {
    match: function(q) { return /redeploy|move (people|staff|someone)|reassign|transfer|shift (people|staff)/.test(q); },
    answer: function() {
      var candidates = Store.underAllocated.filter(function(p) { return p.total_allocation <= 70; }).sort(function(a, b) { return a.total_allocation - b.total_allocation; });
      var text = '';
      if (candidates.length > 0) {
        text += '<b>' + candidates.length + ' staff could be redeployed</b> without major disruption (≤70% allocation):\n\n';
        candidates.forEach(function(p) {
          text += '• ' + linkPerson(p) + ' (' + linkTeam(p.team) + ', ' + p.grade + ') — ' + p.total_allocation + '% allocated, ' + (100 - p.total_allocation) + '% available\n';
        });
        text += '\nSee skills-matched suggestions in the ' + linkOps('#redeployment-planner') + '.';
      } else {
        text += 'No staff are below 70% allocation. See the ' + linkOps('#redeployment-planner') + ' for all available staff.';
      }
      return { text: text, suggestions: ['Do we have capacity for a new programme?', 'What skills do we have available?', 'Which teams are under pressure?'] };
    },
  },

  // Skills risk
  {
    match: function(q) { return /skill|single point|dependency|bus factor|specialist|expertise|knowledge risk/.test(q); },
    answer: function() {
      var sps = Store.singlePointSkills;
      var text = '<b>' + sps.length + ' skills are held by only one person</b>. If they leave, the capability is lost.\n\n';
      var critical = sps.filter(function(s) { return s.person.total_allocation > 100; });
      if (critical.length > 0) {
        text += '<b>' + critical.length + ' of these are also over-allocated</b> — highest risk.\n';
      }
      var table = sps.sort(function(a, b) { return b.person.total_allocation - a.person.total_allocation; }).map(function(s) {
        return { Skill: s.skill, 'Held by': linkPerson(s.person), Team: s.person.team, Allocation: s.person.total_allocation + '%' };
      });
      return { text: text, table: table, suggestions: ['Who is over-allocated?', 'Which teams are under pressure?', 'Who could I redeploy?'] };
    },
  },

  // Tickets
  {
    match: function(q) { return /ticket|backlog|open (issue|request)|unresolved|service desk|resolution/.test(q); },
    answer: function() {
      var open = Store.openTickets;
      var high = Store.highOpen;
      var text = 'There are <b>' + open.length + ' open tickets</b>';
      if (high.length > 0) text += ', of which <b>' + high.length + ' are high priority</b>';
      text += '.\n\n';
      var byTeam = new Map();
      open.forEach(function(tk) { if (!byTeam.has(tk.assigned_team)) byTeam.set(tk.assigned_team, []); byTeam.get(tk.assigned_team).push(tk); });
      byTeam.forEach(function(tix, team) {
        text += '• ' + linkTeam(team) + ': ' + tix.length + ' open (' + tix.filter(function(t) { return t.priority === 'high'; }).length + ' high)\n';
      });
      text += '\nSee TTL tracking and at-risk tickets in the ' + linkTickets() + '.';
      var table = open.sort(function(a, b) { return ({ high: 0, medium: 1, low: 2 }[a.priority] || 9) - ({ high: 0, medium: 1, low: 2 }[b.priority] || 9); }).map(function(tk) {
        return { ID: tk.ticket_id, Priority: tk.priority, Category: fmtCat(tk.category), Team: linkTeam(tk.assigned_team), Opened: tk.created_date };
      });
      return { text: text, table: table, suggestions: ['Which categories take longest?', 'Which teams are under pressure?', 'What could be automated?'] };
    },
  },

  // Resolution times
  {
    match: function(q) { return /resolution time|how long|slow|longest|categor/.test(q); },
    answer: function() {
      var text = 'Average resolution times by ticket category:\n\n';
      Store.catStats.forEach(function(c) {
        text += '• <b>' + fmtCat(c.cat) + '</b>: ' + c.avg + ' days (' + c.count + ' resolved)' + (c.avg > 20 ? ' ⚠️ slow' : '') + '\n';
      });
      text += '\nSee full ticket data in the ' + linkTickets() + '.';
      return { text: text, suggestions: ['Show open tickets', 'What could be automated?', 'Which teams are under pressure?'] };
    },
  },

  // Projects
  {
    match: function(q) { return /project|programme|staffing|who.*(work|assign)|how many.*(people|staff)/.test(q); },
    answer: function() {
      var projs = Store.projects;
      var text = 'There are <b>' + projs.length + ' active projects</b>:\n\n';
      projs.slice(0, 8).forEach(function(p) { text += '• <b>' + p.name + '</b>: ' + p.people.length + ' people, ' + p.totalFTE.toFixed(1) + ' FTE\n'; });
      text += '\n<b>' + projs[0].name + '</b> has the largest commitment at ' + projs[0].totalFTE.toFixed(1) + ' FTE.';
      var table = projs.map(function(p) {
        return { Project: p.name, People: p.people.length, 'Total FTE': p.totalFTE.toFixed(1), Staff: p.people.map(function(s) { return linkPerson(s) + ' (' + s.pct + '%)'; }).join(', ') };
      });
      return { text: text, table: table, suggestions: ['Do we have capacity?', 'Who is over-allocated?', 'Which projects could release people?'] };
    },
  },

  // Automation
  {
    match: function(q) { return /automat|repetit|efficien|streamline|pattern|same (type|kind)/.test(q); },
    answer: function() {
      var resolved = Store.raw.tickets.filter(function(t) { return t.status === 'resolved'; });
      var catCounts = new Map();
      resolved.forEach(function(tk) {
        if (!catCounts.has(tk.category)) catCounts.set(tk.category, { count: 0, totalDays: 0 });
        var c = catCounts.get(tk.category); c.count++; c.totalDays += (new Date(tk.resolved_date) - new Date(tk.created_date)) / 86400000;
      });
      var candidates = [];
      catCounts.forEach(function(s, cat) { candidates.push({ cat: cat, count: s.count, avg: Math.round(s.totalDays / s.count) }); });
      candidates.sort(function(a, b) { return b.count - a.count; });
      var text = 'Best candidates for automation:\n\n';
      candidates.forEach(function(c) {
        text += '• <b>' + fmtCat(c.cat) + '</b>: ' + c.count + ' tickets, avg ' + c.avg + 'd — ' + (c.count >= 8 ? '🟢 high potential' : c.count >= 4 ? '🟡 moderate' : '⚪ low volume') + '\n';
      });
      text += '\nSee full analysis in the ' + linkOps('#automation-candidates') + '.';
      return { text: text, suggestions: ['Show open tickets', 'Which teams are under pressure?', 'Do we have capacity?'] };
    },
  },

  // Headcount
  {
    match: function(q) { return /headcount|how many (people|staff|employee)|total (people|staff)|size/.test(q); },
    answer: function() {
      var text = 'The directorate has <b>' + Store.raw.people.length + ' staff</b> across ' + Store.teams.length + ' teams:\n\n';
      Store.teams.forEach(function(t) {
        var lead = t.members.find(function(m) { return m.employee_id === t.team_lead; });
        text += '• ' + linkTeam(t.team) + ': ' + t.headcount + ' people (led by ' + (lead ? linkPerson(lead) : 'unknown') + ')\n';
      });
      return { text: text, suggestions: ['Do we have capacity?', 'Which teams are under pressure?', 'Show project staffing'] };
    },
  },

  // Summary
  {
    match: function(q) { return /summary|overview|brief|snapshot|state of|how are we|status|tell me everything|what should i know/.test(q); },
    answer: function() {
      var oa = Store.overAllocated;
      var text = '<b>Directorate overview — ' + Store.raw.people.length + ' staff, ' + Store.teams.length + ' teams</b>\n\n' +
        '• Average allocation: <b>' + Store.avgAllocOrg + '%</b>\n' +
        '• Over-allocated (>100%): <b>' + oa.length + ' staff</b> — delivery risk\n' +
        '• Available capacity (≤80%): <b>' + Store.underAllocated.length + ' staff</b>\n' +
        '• Open tickets: <b>' + Store.openTickets.length + '</b> (' + Store.highOpen.length + ' high priority)\n' +
        '• Skills held by only one person: <b>' + Store.singlePointSkills.length + '</b>\n' +
        '• Active projects: <b>' + Store.projects.length + '</b>\n\n' +
        '<b>Top concerns:</b>\n' +
        '1. ' + oa.length + ' staff over-committed — see ' + linkDash() + '\n' +
        '2. ' + Store.highOpen.length + ' high-priority tickets open — see ' + linkTickets() + '\n' +
        '3. ' + Store.singlePointSkills.length + ' single-person skill dependencies\n\n' +
        '<b>Positive:</b> ' + Store.fullyFree.length + ' staff have spare capacity — see ' + linkOps('#redeployment-planner') + '.';
      return { text: text, suggestions: ['Who is over-allocated?', 'Do we have capacity for a new programme?', 'Which teams are under pressure?'] };
    },
  },
];

// Specific team lookup
function specificTeamAnswer(query) {
  var q = query.toLowerCase();
  var team = Store.teams.find(function(t) { return q.includes(t.team.toLowerCase()); });
  if (!team) return { text: 'Team not found.', suggestions: [] };
  var lead = team.members.find(function(m) { return m.employee_id === team.team_lead; });
  var text = '<b>' + linkTeam(team.team) + '</b> — ' + team.headcount + ' people, led by ' + (lead ? linkPerson(lead) : 'unknown') + '\n\n';
  text += '• Average allocation: <b>' + team.avgAlloc + '%</b>\n';
  text += '• Over-allocated: <b>' + team.overCount + '</b>\n';
  text += '• Spare capacity (≤80%): <b>' + team.spareCapacity.length + '</b>\n';
  text += '• Open tickets: <b>' + team.open.length + '</b>\n';
  text += '• Avg resolution: <b>' + (team.avgResolutionDays !== null ? team.avgResolutionDays + ' days' : 'N/A') + '</b>\n';
  if (team.overCount > 0) {
    var over = team.members.filter(function(m) { return m.total_allocation > 100; });
    text += '\n⚠️ Over-allocated: ' + over.map(function(m) { return linkPerson(m) + ' (' + m.total_allocation + '%)'; }).join(', ');
  }
  var table = team.members.map(function(m) {
    return { Name: linkPerson(m), Role: m.role, Grade: m.grade, Allocation: m.total_allocation + '%', Projects: m.allocations.map(function(a) { return a.project + ' (' + a.percentage + '%)'; }).join(', ') };
  });
  return { text: text, table: table, suggestions: ['Who is over-allocated?', 'Do we have capacity?', 'Show open tickets'] };
}

// Person lookup
function personAnswer(query) {
  var q = query.toLowerCase();
  var person = Store.raw.people.find(function(p) { return q.includes(p.name.toLowerCase()); });
  if (!person) return { text: 'Person not found.', suggestions: [] };
  var text = '<b>' + linkPerson(person) + '</b> — ' + person.role + ', ' + linkTeam(person.team) + ' (' + person.grade + ')\n\n';
  text += '• Location: ' + person.location + '\n';
  text += '• Total allocation: <b>' + person.total_allocation + '%</b>' + (person.total_allocation > 100 ? ' ⚠️ over-allocated' : '') + '\n';
  text += '• Skills: ' + person.skills.join(', ') + '\n\nProjects:\n';
  person.allocations.forEach(function(a) { text += '• ' + a.project + ': ' + a.percentage + '%\n'; });
  var uniqueSkills = person.skills.filter(function(s) { var h = Store.skillHolders.get(s.toLowerCase()); return h && h.length === 1; });
  if (uniqueSkills.length > 0) text += '\n⚠️ <b>Single point of dependency</b> for: ' + uniqueSkills.join(', ');
  return { text: text, suggestions: ['Show their team', 'Who is over-allocated?', 'Who could I redeploy?'] };
}

// Master dispatcher
function answerQuestion(query) {
  var q = query.toLowerCase().trim();
  if (Store.raw.people.some(function(p) { return q.includes(p.name.toLowerCase()); })) return personAnswer(query);
  if (Store.teams.some(function(t) { return q.includes(t.team.toLowerCase()); })) return specificTeamAnswer(query);
  return getInsight(query);
}
