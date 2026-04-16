// Team Leader View — team health, evidence panel, skills risks

function renderTeamLeader() {
  var el = document.getElementById('team-leader-panel');
  var teams = Store.teams;

  // Build team selector
  var h = '<div class="ons-field ons-u-mb-l">';
  h += '<label class="ons-label" for="team-select">Select your team</label>';
  h += '<select class="ons-input ons-input--select" id="team-select">';
  h += '<option value="">— Choose a team —</option>';
  teams.forEach(function(t) {
    h += '<option value="' + t.team + '">' + t.team + '</option>';
  });
  h += '</select></div>';
  h += '<div id="team-leader-content"></div>';

  el.innerHTML = h;

  document.getElementById('team-select').addEventListener('change', function() {
    var name = this.value;
    if (name) renderTeamDetail(name);
    else document.getElementById('team-leader-content').innerHTML = '';
  });

  // Auto-select if hash has team name
  var hash = location.hash.replace('#', '');
  if (hash) {
    var decoded = decodeURIComponent(hash);
    var match = teams.find(function(t) { return t.team === decoded; });
    if (match) {
      document.getElementById('team-select').value = match.team;
      renderTeamDetail(match.team);
    }
  }
}

function renderTeamDetail(teamName) {
  var el = document.getElementById('team-leader-content');
  var team = Store.teams.find(function(t) { return t.team === teamName; });
  if (!team) { el.innerHTML = '<p>Team not found.</p>'; return; }

  // Update hash for sharing
  location.hash = encodeURIComponent(teamName);

  var lead = team.members.find(function(m) { return m.employee_id === team.team_lead; });
  var overMembers = team.members.filter(function(m) { return m.total_allocation > 100; });
  var atCapacity = team.members.filter(function(m) { return m.total_allocation >= 90 && m.total_allocation <= 100; });
  var spareMembers = team.spareCapacity;
  var totalAlloc = team.members.reduce(function(s, m) { return s + m.total_allocation; }, 0);
  var avgAlloc = team.avgAlloc;

  // Skills concentration — skills held by only one person in this team
  var teamSkillMap = new Map();
  team.members.forEach(function(m) {
    m.skills.forEach(function(s) {
      var key = s.toLowerCase();
      if (!teamSkillMap.has(key)) teamSkillMap.set(key, []);
      teamSkillMap.get(key).push(m);
    });
  });
  var singleSkills = [];
  teamSkillMap.forEach(function(holders, skill) {
    if (holders.length === 1) singleSkills.push({ skill: skill, person: holders[0] });
  });

  // Open tickets
  var openTickets = team.open.slice().sort(function(a, b) {
    var order = { high: 0, medium: 1, low: 2 };
    return (order[a.priority] || 9) - (order[b.priority] || 9);
  });

  function allocColor(pct) { return pct > 100 ? 'red' : pct > 80 ? 'amber' : 'green'; }
  function colorHex(c) { return c === 'red' ? '#d0021b' : c === 'amber' ? '#fe781f' : '#0f8243'; }
  function barInline(pct) {
    var c = allocColor(pct);
    var w = Math.min(Math.round(pct * 100 / 120), 100);
    var marker = Math.round(100 * 100 / 120);
    return '<span class="tl-alloc-bar"><span class="tl-alloc-bar__track"><span class="tl-alloc-bar__fill tl-alloc-bar__fill--' + c + '" style="width:' + w + '%"></span><span class="tl-alloc-bar__marker" style="left:' + marker + '%"></span></span><span class="tl-alloc-bar__label tl-alloc-bar__label--' + c + '">' + pct + '%</span></span>';
  }
  function fmtCat(c) { return c.replace(/_/g, ' ').replace(/\b\w/g, function(ch) { return ch.toUpperCase(); }); }

  var h = '';

  // Team header
  h += '<h2 class="ons-u-fs-l ons-u-mb-s">' + team.team + '</h2>';
  h += '<p class="ons-u-mb-m" style="color:#707071">Led by ' + (lead ? lead.name : 'Unknown') + ' · ' + team.headcount + ' people</p>';

  // Health summary KPIs
  h += '<div class="kpi-grid ons-u-mb-l">';
  h += tlKpi(team.headcount, 'Team Size', '');
  h += tlKpi(avgAlloc + '%', 'Avg Allocation', allocColor(avgAlloc));
  h += tlKpi(overMembers.length, 'Over-allocated', overMembers.length > 0 ? 'red' : 'green');
  h += tlKpi(atCapacity.length, 'At Capacity (90-100%)', atCapacity.length > 0 ? 'amber' : 'green');
  h += tlKpi(spareMembers.length, 'Spare Capacity (≤80%)', 'green');
  h += tlKpi(openTickets.length, 'Open Tickets', openTickets.length > 0 ? 'amber' : 'green');
  h += '</div>';

  // Director briefing panel — the "make the case" evidence
  h += '<h2 id="evidence" class="ons-u-fs-m ons-u-mb-s">Director Briefing <span style="font-weight:400;color:#707071;font-size:0.875rem">— evidence to support resource conversations</span></h2>';
  h += '<div class="ons-panel ons-panel--info ons-panel--no-title ons-u-mb-m">';
  h += '<span class="ons-panel__assistive-text ons-u-vh">Important information: </span>';
  h += '<div class="ons-panel__body">';

  // Build the briefing text dynamically
  h += '<p><strong>Team: ' + team.team + '</strong> — ' + team.headcount + ' staff</p>';

  // Capacity assessment
  h += '<p style="margin-top:8px"><strong>Capacity assessment:</strong> ';
  if (overMembers.length > 0 && spareMembers.length === 0) {
    h += '<span style="color:#d0021b">This team is over-stretched.</span> ';
    h += overMembers.length + ' of ' + team.headcount + ' staff are allocated above 100%. ';
    h += 'Average allocation is ' + avgAlloc + '%. ';
    h += 'There is no spare capacity to absorb additional work without reducing existing commitments.';
  } else if (overMembers.length > 0) {
    h += '<span style="color:#fe781f">This team is under pressure.</span> ';
    h += overMembers.length + ' of ' + team.headcount + ' staff are over-allocated, though ';
    h += spareMembers.length + ' have some spare capacity. ';
    h += 'Average allocation is ' + avgAlloc + '%. ';
    h += 'Limited ability to take on new work without rebalancing.';
  } else if (avgAlloc >= 90) {
    h += '<span style="color:#fe781f">This team is near capacity.</span> ';
    h += 'Average allocation is ' + avgAlloc + '%. ';
    h += 'No one is over-allocated, but there is little room for additional commitments.';
  } else {
    h += '<span style="color:#0f8243">This team has capacity.</span> ';
    h += 'Average allocation is ' + avgAlloc + '%. ';
    h += spareMembers.length + ' staff have spare capacity that could be directed to new work.';
  }
  h += '</p>';

  // Ticket load
  if (openTickets.length > 0) {
    var highCount = openTickets.filter(function(t) { return t.priority === 'high'; }).length;
    h += '<p style="margin-top:8px"><strong>Operational load:</strong> ';
    h += openTickets.length + ' open ticket' + (openTickets.length !== 1 ? 's' : '');
    if (highCount > 0) h += ' (' + highCount + ' high priority)';
    h += '. This adds to the team\'s workload beyond project allocations.</p>';
  }

  // Skills risk
  if (singleSkills.length > 0) {
    h += '<p style="margin-top:8px"><strong>Skills risk:</strong> ';
    h += singleSkills.length + ' skill' + (singleSkills.length !== 1 ? 's are' : ' is') + ' held by only one person in this team. ';
    h += 'If ' + (singleSkills.length === 1 ? 'that person is' : 'any of them are') + ' unavailable, the capability is lost. ';
    h += 'Skills at risk: ' + singleSkills.map(function(s) { return s.skill + ' (' + s.person.name + ')'; }).join(', ') + '.</p>';
  }

  // Recommendation
  h += '<p style="margin-top:12px;border-top:1px solid #e2e2e3;padding-top:12px"><strong>Recommendation:</strong> ';
  if (overMembers.length > 0 && spareMembers.length === 0) {
    h += 'This team needs additional resource or a reduction in commitments. ';
    h += 'Consider deprioritising lower-value projects or requesting temporary support from teams with spare capacity. ';
    h += 'See the <a href="operations.html#redeployment-planner">Redeployment Planner</a> for skills-matched candidates.';
  } else if (overMembers.length > 0) {
    h += 'Rebalance allocations within the team to bring over-allocated staff below 100%. ';
    h += 'If this is not possible, escalate to the <a href="operations.html#redeployment-planner">Redeployment Planner</a> for cross-team support.';
  } else if (avgAlloc >= 90) {
    h += 'Monitor closely. The team is near capacity and any new commitment risks tipping into over-allocation. ';
    h += 'Consider whether any current projects can be wound down before taking on new work.';
  } else {
    h += 'This team has capacity to absorb additional work. ';
    h += 'Consider whether their skills match any current organisational priorities.';
  }
  h += '</p>';

  h += '</div></div>';

  // Team members table
  h += '<h2 id="members" class="ons-u-fs-m ons-u-mb-s">Team Members</h2>';
  h += '<div class="ons-table-scrollable__content ons-u-mb-l"><table class="ons-table">';
  h += '<thead class="ons-table__head"><tr class="ons-table__row">';
  ['Name', 'Role', 'Grade', 'Allocation', 'Projects', 'Location'].forEach(function(th) {
    h += '<th class="ons-table__header" scope="col">' + th + '</th>';
  });
  h += '</tr></thead><tbody class="ons-table__body">';
  team.members.sort(function(a, b) { return b.total_allocation - a.total_allocation; }).forEach(function(m) {
    var over = m.total_allocation > 100;
    h += '<tr class="ons-table__row' + (over ? ' ons-table__row--warn' : '') + '">';
    h += '<td class="ons-table__cell"><strong><a href="index.html#/person/' + m.employee_id + '" style="color:#206095">' + m.name + '</a></strong></td>';
    h += '<td class="ons-table__cell">' + m.role + '</td>';
    h += '<td class="ons-table__cell">' + m.grade + '</td>';
    h += '<td class="ons-table__cell">' + barInline(m.total_allocation) + '</td>';
    h += '<td class="ons-table__cell">' + m.allocations.map(function(a) { return a.project + ' (' + a.percentage + '%)'; }).join(', ') + '</td>';
    h += '<td class="ons-table__cell">' + m.location + '</td>';
    h += '</tr>';
  });
  h += '</tbody></table></div>';

  // Skills concentration risk
  if (singleSkills.length > 0) {
    h += '<h2 id="skills-risk" class="ons-u-fs-m ons-u-mb-s">Skills Concentration Risk <span style="font-weight:400;color:#707071;font-size:0.875rem">— single points of dependency in this team</span></h2>';
    h += '<div class="ons-table-scrollable__content ons-u-mb-l"><table class="ons-table">';
    h += '<thead class="ons-table__head"><tr class="ons-table__row">';
    ['Skill', 'Only Held By', 'Their Allocation', 'Also Over-allocated?'].forEach(function(th) {
      h += '<th class="ons-table__header" scope="col">' + th + '</th>';
    });
    h += '</tr></thead><tbody class="ons-table__body">';
    singleSkills.sort(function(a, b) { return b.person.total_allocation - a.person.total_allocation; }).forEach(function(s) {
      var over = s.person.total_allocation > 100;
      h += '<tr class="ons-table__row' + (over ? ' ons-table__row--warn' : '') + '">';
      h += '<td class="ons-table__cell"><strong>' + s.skill + '</strong></td>';
      h += '<td class="ons-table__cell"><a href="index.html#/person/' + s.person.employee_id + '" style="color:#206095">' + s.person.name + '</a></td>';
      h += '<td class="ons-table__cell">' + barInline(s.person.total_allocation) + '</td>';
      h += '<td class="ons-table__cell"><span class="ons-status ons-status--' + (over ? 'error' : 'success') + '">' + (over ? 'Yes' : 'No') + '</span></td>';
      h += '</tr>';
    });
    h += '</tbody></table></div>';
  }

  // Open tickets
  h += '<h2 id="tickets" class="ons-u-fs-m ons-u-mb-s">Open Tickets <span style="font-weight:400;color:#707071;font-size:0.875rem">— ' + openTickets.length + ' assigned to this team</span></h2>';
  if (openTickets.length === 0) {
    h += '<div class="ons-panel ons-panel--bare ons-u-mb-l"><div class="ons-panel__body"><p style="color:#0f8243">No open tickets assigned to this team.</p></div></div>';
  } else {
    h += '<div class="ons-table-scrollable__content ons-u-mb-l"><table class="ons-table">';
    h += '<thead class="ons-table__head"><tr class="ons-table__row">';
    ['Ticket', 'Priority', 'Category', 'Opened', 'Description'].forEach(function(th) {
      h += '<th class="ons-table__header" scope="col">' + th + '</th>';
    });
    h += '</tr></thead><tbody class="ons-table__body">';
    openTickets.forEach(function(tk) {
      h += '<tr class="ons-table__row">';
      h += '<td class="ons-table__cell"><strong>' + tk.ticket_id + '</strong></td>';
      h += '<td class="ons-table__cell"><span class="ons-status ons-status--' + (tk.priority === 'high' ? 'error' : tk.priority === 'medium' ? 'pending' : 'info') + '">' + tk.priority + '</span></td>';
      h += '<td class="ons-table__cell">' + fmtCat(tk.category) + '</td>';
      h += '<td class="ons-table__cell">' + tk.created_date + '</td>';
      h += '<td class="ons-table__cell">' + tk.description + '</td>';
      h += '</tr>';
    });
    h += '</tbody></table></div>';
  }

  el.innerHTML = h;
}

function tlKpi(value, label, color) {
  var cls = color ? ' kpi-value--' + color : '';
  return '<div class="kpi-card"><div class="kpi-value' + cls + '">' + value + '</div><div class="kpi-label">' + label + '</div></div>';
}
