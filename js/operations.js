// Operations Manager View — pressure scoring, redeployment planner, automation, workload

function computeTeamPressure(teams) {
  return teams.map(t => {
    const allocScore = Math.max(0, t.avgAlloc - 80) / 40;
    const overScore = t.overCount / Math.max(t.members.length, 1);
    const ticketScore = t.open.length / Math.max(t.tix.length, 1);
    const raw = (allocScore * 0.4) + (overScore * 0.3) + (ticketScore * 0.3);
    const pressure = Math.min(Math.round(raw * 100), 100);
    let level = 'low';
    if (pressure >= 60) level = 'critical';
    else if (pressure >= 35) level = 'high';
    else if (pressure >= 15) level = 'moderate';
    return { ...t, pressure, pressureLevel: level };
  }).sort((a, b) => b.pressure - a.pressure);
}

function findRedeploymentCandidates() {
  return Store.raw.people
    .filter(p => p.total_allocation <= 80)
    .sort((a, b) => a.total_allocation - b.total_allocation)
    .map(p => ({ ...p, spare: 100 - p.total_allocation, skillSet: new Set(p.skills.map(s => s.toLowerCase())) }));
}

function matchCandidatesToTeams(candidates, pressuredTeams) {
  const matches = [];
  for (const team of pressuredTeams) {
    const teamSkills = new Set();
    team.members.forEach(m => m.skills.forEach(s => teamSkills.add(s.toLowerCase())));
    const teamMatches = candidates
      .filter(c => c.team !== team.team)
      .map(c => {
        const overlap = [...c.skillSet].filter(s => teamSkills.has(s));
        return { candidate: c, team: team.team, matchingSkills: overlap, matchScore: overlap.length };
      })
      .filter(m => m.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore);
    if (teamMatches.length) matches.push({ team: team.team, pressure: team.pressure, pressureLevel: team.pressureLevel, candidates: teamMatches.slice(0, 5) });
  }
  return matches;
}

function findAutomationCandidates() {
  const catMap = new Map();
  for (const tk of Store.raw.tickets) {
    if (!catMap.has(tk.category)) catMap.set(tk.category, { total: 0, resolved: 0, totalDays: 0 });
    const c = catMap.get(tk.category);
    c.total++;
    if (tk.status === 'resolved') {
      c.resolved++;
      c.totalDays += (new Date(tk.resolved_date) - new Date(tk.created_date)) / 86400000;
    }
  }
  return [...catMap.entries()].map(([cat, s]) => {
    const avgDays = s.resolved > 0 ? Math.round(s.totalDays / s.resolved) : null;
    let potential = 'low';
    if (s.total >= 8) potential = 'high';
    else if (s.total >= 4) potential = 'moderate';
    return { cat, total: s.total, resolved: s.resolved, avgDays, potential };
  }).sort((a, b) => b.total - a.total);
}

function renderOperations() {
  const el = document.getElementById('ops-panel');
  const pressuredTeams = computeTeamPressure(Store.teams);
  const candidates = findRedeploymentCandidates();
  const redeployMatches = matchCandidatesToTeams(candidates, pressuredTeams.filter(t => t.pressureLevel === 'critical' || t.pressureLevel === 'high'));
  const autoCandidates = findAutomationCandidates();
  const criticalTeams = pressuredTeams.filter(t => t.pressureLevel === 'critical' || t.pressureLevel === 'high');

  function fmtCat(c) { return c.replace(/_/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase()); }
  function pressureColor(l) { return l === 'critical' ? '#d0021b' : l === 'high' ? '#fe781f' : l === 'moderate' ? '#f0b800' : '#0f8243'; }
  function pressureOns(l) { return l === 'critical' ? 'error' : l === 'high' ? 'pending' : 'success'; }

  let h = '';

  // Summary
  h += '<div class="ons-panel ons-panel--info ons-panel--no-title ons-u-mb-m">';
  h += '<span class="ons-panel__assistive-text ons-u-vh">Important information: </span>';
  h += '<div class="ons-panel__body"><p><strong>Operations snapshot:</strong> ';
  h += criticalTeams.length + ' team' + (criticalTeams.length !== 1 ? 's' : '') + ' under significant pressure. ';
  h += '<strong style="color:#d0021b">' + Store.overAllocated.length + ' staff over-allocated.</strong> ';
  h += '<span style="color:#0f8243">' + candidates.length + ' staff available for redeployment.</span> ';
  h += Store.openTickets.length + ' open tickets across the directorate.</p>';
  h += '</div></div>';

  // KPIs
  h += '<div class="kpi-grid ons-u-mb-l">';
  h += opsKpi(criticalTeams.length, 'Teams Under Pressure', 'red', '#team-pressure');
  h += opsKpi(Store.overAllocated.length, 'Over-allocated Staff', 'red', '#team-pressure');
  h += opsKpi(candidates.length, 'Available for Redeployment', 'green', '#redeployment-planner');
  h += opsKpi(Store.openTickets.length, 'Open Tickets', 'amber', 'tickets.html');
  h += opsKpi(autoCandidates.filter(c => c.potential === 'high').length, 'High Automation Potential', 'green', '#automation-candidates');
  h += opsKpi(Store.raw.people.length, 'Total Staff', '', '#workload-by-team');
  h += '</div>';

  // Team Pressure Rankings
  h += '<h2 id="team-pressure" class="ons-u-fs-m ons-u-mb-s">Team Pressure Rankings <span style="font-weight:400;color:#707071;font-size:0.875rem">— combined allocation, over-commitment, and ticket load</span></h2>';
  h += '<div class="ons-table-scrollable__content ons-u-mb-l"><table class="ons-table">';
  h += '<thead class="ons-table__head"><tr class="ons-table__row">';
  ['Team', 'Pressure', 'Level', 'Avg Alloc', 'Over-allocated', 'Open Tickets', 'People', 'Spare Capacity'].forEach(th => {
    h += '<th class="ons-table__header" scope="col">' + th + '</th>';
  });
  h += '</tr></thead><tbody class="ons-table__body">';
  for (const t of pressuredTeams) {
    const warn = t.pressureLevel === 'critical' || t.pressureLevel === 'high';
    h += '<tr class="ons-table__row' + (warn ? ' ons-table__row--warn' : '') + '">';
    h += '<td class="ons-table__cell"><strong>' + t.team + '</strong></td>';
    h += '<td class="ons-table__cell"><span class="ops-pressure-bar"><span class="ops-pressure-fill" style="width:' + t.pressure + '%;background:' + pressureColor(t.pressureLevel) + '"></span></span> <strong style="color:' + pressureColor(t.pressureLevel) + '">' + t.pressure + '%</strong></td>';
    h += '<td class="ons-table__cell"><span class="ons-status ons-status--' + pressureOns(t.pressureLevel) + '">' + t.pressureLevel + '</span></td>';
    h += '<td class="ons-table__cell">' + t.avgAlloc + '%</td>';
    h += '<td class="ons-table__cell"><span class="ons-status ons-status--' + (t.overCount > 0 ? 'error' : 'success') + '">' + t.overCount + '</span></td>';
    h += '<td class="ons-table__cell"><span class="ons-status ons-status--' + (t.open.length > 0 ? 'pending' : 'success') + '">' + t.open.length + '</span></td>';
    h += '<td class="ons-table__cell">' + t.headcount + '</td>';
    h += '<td class="ons-table__cell">' + t.spareCapacity.length + '</td>';
    h += '</tr>';
  }
  h += '</tbody></table></div>';

  // Redeployment Planner
  h += '<h2 id="redeployment-planner" class="ons-u-fs-m ons-u-mb-s">Redeployment Planner <span style="font-weight:400;color:#707071;font-size:0.875rem">— ' + candidates.length + ' staff with spare capacity (≤80% allocated)</span></h2>';
  h += '<h3 class="ons-u-fs-r--b ons-u-mb-s">All available staff</h3>';
  h += '<div class="ons-table-scrollable__content ons-u-mb-l"><table class="ons-table">';
  h += '<thead class="ons-table__head"><tr class="ons-table__row">';
  ['Name', 'Team', 'Grade', 'Current Alloc', 'Spare Capacity', 'Skills', 'Current Projects'].forEach(th => {
    h += '<th class="ons-table__header" scope="col">' + th + '</th>';
  });
  h += '</tr></thead><tbody class="ons-table__body">';
  for (const c of candidates) {
    h += '<tr class="ons-table__row">';
    h += '<td class="ons-table__cell"><strong>' + c.name + '</strong></td>';
    h += '<td class="ons-table__cell">' + c.team + '</td>';
    h += '<td class="ons-table__cell">' + c.grade + '</td>';
    h += '<td class="ons-table__cell">' + c.total_allocation + '%</td>';
    h += '<td class="ons-table__cell"><strong style="color:#0f8243">' + c.spare + '%</strong></td>';
    h += '<td class="ons-table__cell">' + c.skills.map(s => '<span class="ops-skill-match">' + s + '</span>').join(' ') + '</td>';
    h += '<td class="ons-table__cell">' + c.allocations.map(a => a.project + ' (' + a.percentage + '%)').join(', ') + '</td>';
    h += '</tr>';
  }
  h += '</tbody></table></div>';

  if (redeployMatches.length > 0) {
    h += '<h3 class="ons-u-fs-r--b ons-u-mb-s">Skills-matched suggestions for pressured teams</h3>';
    for (const match of redeployMatches) {
      h += '<div class="ops-redeploy-card"><div class="ops-redeploy-card__header"><strong>' + match.team + '</strong> needs help ';
      h += '<span class="ons-status ons-status--' + pressureOns(match.pressureLevel) + '">' + match.pressureLevel + ' pressure (' + match.pressure + '%)</span></div>';
      h += '<div class="ons-table-scrollable__content"><table class="ons-table"><thead class="ons-table__head"><tr class="ons-table__row">';
      ['Candidate', 'Current Team', 'Grade', 'Current Alloc', 'Spare', 'Matching Skills', 'Current Projects'].forEach(th => {
        h += '<th class="ons-table__header" scope="col">' + th + '</th>';
      });
      h += '</tr></thead><tbody class="ons-table__body">';
      for (const m of match.candidates) {
        h += '<tr class="ons-table__row">';
        h += '<td class="ons-table__cell"><strong>' + m.candidate.name + '</strong></td>';
        h += '<td class="ons-table__cell">' + m.candidate.team + '</td>';
        h += '<td class="ons-table__cell">' + m.candidate.grade + '</td>';
        h += '<td class="ons-table__cell">' + m.candidate.total_allocation + '%</td>';
        h += '<td class="ons-table__cell"><strong style="color:#0f8243">' + m.candidate.spare + '%</strong></td>';
        h += '<td class="ons-table__cell">' + m.matchingSkills.map(s => '<span class="ops-skill-match">' + s + '</span>').join(' ') + '</td>';
        h += '<td class="ons-table__cell">' + m.candidate.allocations.map(a => a.project + ' (' + a.percentage + '%)').join(', ') + '</td>';
        h += '</tr>';
      }
      h += '</tbody></table></div></div>';
    }
  }
  h += '<div class="ons-u-mb-l"></div>';

  // Automation Candidates
  h += '<h2 id="automation-candidates" class="ons-u-fs-m ons-u-mb-s">Automation Candidates <span style="font-weight:400;color:#707071;font-size:0.875rem">— high-volume, predictable ticket categories</span></h2>';
  h += '<div class="ons-table-scrollable__content ons-u-mb-l"><table class="ons-table">';
  h += '<thead class="ons-table__head"><tr class="ons-table__row">';
  ['Category', 'Total Tickets', 'Resolved', 'Avg Resolution', 'Automation Potential'].forEach(th => {
    h += '<th class="ons-table__header" scope="col">' + th + '</th>';
  });
  h += '</tr></thead><tbody class="ons-table__body">';
  for (const c of autoCandidates) {
    h += '<tr class="ons-table__row">';
    h += '<td class="ons-table__cell"><strong>' + fmtCat(c.cat) + '</strong></td>';
    h += '<td class="ons-table__cell">' + c.total + '</td>';
    h += '<td class="ons-table__cell">' + c.resolved + '</td>';
    h += '<td class="ons-table__cell">' + (c.avgDays !== null ? c.avgDays + ' days' : '—') + '</td>';
    h += '<td class="ons-table__cell"><span class="ons-status ons-status--' + (c.potential === 'high' ? 'success' : c.potential === 'moderate' ? 'pending' : 'dead') + '">' + c.potential + '</span></td>';
    h += '</tr>';
  }
  h += '</tbody></table></div>';

  // Workload by Team
  h += '<h2 id="workload-by-team" class="ons-u-fs-m ons-u-mb-s">Operational Workload by Team <span style="font-weight:400;color:#707071;font-size:0.875rem">— ticket volume and resolution performance</span></h2>';
  h += '<div class="ons-table-scrollable__content ons-u-mb-l"><table class="ons-table">';
  h += '<thead class="ons-table__head"><tr class="ons-table__row">';
  ['Team', 'Total Tickets', 'Resolved', 'Open', 'Avg Resolution', 'Team Avg Alloc'].forEach(th => {
    h += '<th class="ons-table__header" scope="col">' + th + '</th>';
  });
  h += '</tr></thead><tbody class="ons-table__body">';
  for (const t of pressuredTeams) {
    h += '<tr class="ons-table__row">';
    h += '<td class="ons-table__cell"><strong>' + t.team + '</strong></td>';
    h += '<td class="ons-table__cell">' + t.tix.length + '</td>';
    h += '<td class="ons-table__cell">' + t.resolved.length + '</td>';
    h += '<td class="ons-table__cell"><span class="ons-status ons-status--' + (t.open.length > 0 ? 'pending' : 'success') + '">' + t.open.length + '</span></td>';
    h += '<td class="ons-table__cell">' + (t.avgResolutionDays !== null ? t.avgResolutionDays + ' days' : '—') + '</td>';
    h += '<td class="ons-table__cell">' + t.avgAlloc + '%</td>';
    h += '</tr>';
  }
  h += '</tbody></table></div>';

  el.innerHTML = h;
}

function opsKpi(value, label, color, href) {
  var cls = color ? ' kpi-value--' + color : '';
  if (href) return '<a class="kpi-card kpi-card--link" href="' + href + '"><div class="kpi-value' + cls + '">' + value + '</div><div class="kpi-label">' + label + '</div></a>';
  return '<div class="kpi-card"><div class="kpi-value' + cls + '">' + value + '</div><div class="kpi-label">' + label + '</div></div>';
}
