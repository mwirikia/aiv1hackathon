// Ticket View — TTL tracking, at-risk tickets, team pressure overlay

var TTL_LIMITS = { high: 3, medium: 10, low: 20 };

function workingDaysBetween(start, end) {
  var count = 0, d = new Date(start), e = new Date(end);
  while (d <= e) {
    var day = d.getDay();
    if (day !== 0 && day !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

function computeTicketTTL(tickets) {
  var today = new Date();
  return tickets.map(function(tk) {
    var limit = TTL_LIMITS[tk.priority] || 20;
    var elapsed = workingDaysBetween(new Date(tk.created_date), today);
    var remaining = limit - elapsed;
    var pctUsed = Math.min(Math.round((elapsed / limit) * 100), 100);
    var status = 'on-track';
    if (remaining <= 0) status = 'overdue';
    else if (remaining <= Math.ceil(limit * 0.3)) status = 'expiring';
    return Object.assign({}, tk, { limit: limit, elapsed: elapsed, remaining: remaining, pctUsed: pctUsed, ttlStatus: status });
  });
}

function computeTeamPressureForTickets(teams) {
  return teams.map(function(t) {
    var allocScore = Math.max(0, t.avgAlloc - 80) / 40;
    var overScore = t.overCount / Math.max(t.members.length, 1);
    var ticketScore = t.open.length / Math.max(t.tix.length, 1);
    var raw = (allocScore * 0.4) + (overScore * 0.3) + (ticketScore * 0.3);
    var pressure = Math.min(Math.round(raw * 100), 100);
    var level = 'low';
    if (pressure >= 60) level = 'critical';
    else if (pressure >= 35) level = 'high';
    else if (pressure >= 15) level = 'moderate';
    return Object.assign({}, t, { pressure: pressure, pressureLevel: level });
  }).sort(function(a, b) { return b.pressure - a.pressure; });
}

function renderTickets() {
  var el = document.getElementById('tickets-panel');
  var openWithTTL = computeTicketTTL(Store.openTickets);
  var pressuredTeams = computeTeamPressureForTickets(Store.teams);

  var overdue = openWithTTL.filter(function(t) { return t.ttlStatus === 'overdue'; });
  var expiring = openWithTTL.filter(function(t) { return t.ttlStatus === 'expiring'; });
  var onTrack = openWithTTL.filter(function(t) { return t.ttlStatus === 'on-track'; });

  function fmtCat(c) { return c.replace(/_/g, ' ').replace(/\b\w/g, function(ch) { return ch.toUpperCase(); }); }
  function ttlColor(s) { return s === 'overdue' ? '#d0021b' : s === 'expiring' ? '#fe781f' : '#0f8243'; }
  function ttlOnsStatus(s) { return s === 'overdue' ? 'error' : s === 'expiring' ? 'pending' : 'success'; }
  function pressureOns(l) { return l === 'critical' ? 'error' : l === 'high' ? 'pending' : 'success'; }

  var h = '';

  // Summary
  h += '<div class="ons-panel ons-panel--info ons-panel--no-title ons-u-mb-m">';
  h += '<span class="ons-panel__assistive-text ons-u-vh">Important information: </span>';
  h += '<div class="ons-panel__body"><p><strong>Ticket snapshot:</strong> ';
  h += Store.openTickets.length + ' open tickets. ';
  h += '<strong style="color:#d0021b">' + overdue.length + ' overdue</strong>, ';
  h += '<strong style="color:#fe781f">' + expiring.length + ' expiring soon</strong>, ';
  h += '<span style="color:#0f8243">' + onTrack.length + ' on track</span>. ';
  h += 'TTL limits: High ' + TTL_LIMITS.high + 'd, Medium ' + TTL_LIMITS.medium + 'd, Low ' + TTL_LIMITS.low + 'd.</p>';
  h += '</div></div>';

  // KPIs
  h += '<div class="kpi-grid ons-u-mb-l">';
  h += ticketKpi(Store.openTickets.length, 'Open Tickets', 'amber', '#all-open-tickets');
  h += ticketKpi(overdue.length, 'Overdue', 'red', '#at-risk-tickets');
  h += ticketKpi(expiring.length, 'Expiring Soon', 'amber', '#at-risk-tickets');
  h += ticketKpi(onTrack.length, 'On Track', 'green', '#all-open-tickets');
  h += ticketKpi(Store.raw.tickets.filter(function(t) { return t.status === 'resolved'; }).length, 'Resolved (Total)', '', '#resolved-tickets');
  h += ticketKpi(Store.raw.tickets.length, 'All Tickets (Total)', '', '#resolved-tickets');
  h += '</div>';

  // At-Risk Tickets
  h += '<h2 id="at-risk-tickets" class="ons-u-fs-m ons-u-mb-s">At-Risk Tickets <span style="font-weight:400;color:#707071;font-size:0.875rem">— overdue or expiring, with team pressure</span></h2>';

  var atRisk = openWithTTL
    .filter(function(tk) { return tk.ttlStatus === 'overdue' || tk.ttlStatus === 'expiring'; })
    .map(function(tk) {
      var team = pressuredTeams.find(function(t) { return t.team === tk.assigned_team; });
      return Object.assign({}, tk, {
        teamPressure: team ? team.pressure : 0,
        teamPressureLevel: team ? team.pressureLevel : 'low',
        teamAvgAlloc: team ? team.avgAlloc : 0,
        teamOverCount: team ? team.overCount : 0
      });
    })
    .sort(function(a, b) {
      if (a.ttlStatus === 'overdue' && b.ttlStatus !== 'overdue') return -1;
      if (b.ttlStatus === 'overdue' && a.ttlStatus !== 'overdue') return 1;
      return a.remaining - b.remaining;
    });

  if (atRisk.length === 0) {
    h += '<div class="ons-panel ons-panel--bare ons-u-mb-l"><div class="ons-panel__body"><p style="color:#0f8243">No at-risk tickets. All open tickets are within their TTL.</p></div></div>';
  } else {
    for (var i = 0; i < atRisk.length; i++) {
      var tk = atRisk[i];
      var borderCol = tk.ttlStatus === 'overdue' ? '#d0021b' : '#fe781f';
      h += '<div class="ops-ticket-card" style="border-left-color:' + borderCol + '">';
      h += '<div class="ops-ticket-card__header">';
      h += '<span class="ons-status ons-status--' + ttlOnsStatus(tk.ttlStatus) + '">' + (tk.ttlStatus === 'overdue' ? 'OVERDUE' : 'EXPIRING') + '</span> ';
      h += '<span class="ons-status ons-status--' + (tk.priority === 'high' ? 'error' : tk.priority === 'medium' ? 'pending' : 'info') + '">' + tk.priority + '</span> ';
      h += '<span class="ops-ticket-card__cat">' + fmtCat(tk.category) + '</span>';
      h += '<span class="ops-ticket-card__id">' + tk.ticket_id + '</span>';
      h += '</div>';
      h += '<div class="ops-ticket-card__desc">' + tk.description + '</div>';
      h += '<div class="ops-ticket-card__meta">';
      h += '<span class="ops-ttl-badge" style="background:' + ttlColor(tk.ttlStatus) + '">';
      if (tk.remaining <= 0) h += Math.abs(tk.remaining) + 'd overdue';
      else h += tk.remaining + 'd remaining';
      h += '</span>';
      h += ' of ' + tk.limit + 'd limit · Opened ' + tk.created_date + ' · ' + tk.elapsed + ' working days elapsed';
      h += '</div>';
      h += '<div class="ops-ticket-card__ttl-bar"><div class="ops-ttl-track"><div class="ops-ttl-fill" style="width:' + tk.pctUsed + '%;background:' + ttlColor(tk.ttlStatus) + '"></div><span class="ops-ttl-marker" title="TTL limit"></span></div></div>';
      h += '<div class="ops-ticket-card__team">';
      h += 'Assigned: <strong>' + tk.assigned_team + '</strong> · ';
      h += 'Team pressure: <span class="ons-status ons-status--' + pressureOns(tk.teamPressureLevel) + '">' + tk.teamPressureLevel + ' (' + tk.teamPressure + '%)</span> · ';
      h += 'Avg alloc: ' + tk.teamAvgAlloc + '% · Over-allocated: ' + tk.teamOverCount;
      h += '</div></div>';
    }
    h += '<div class="ons-u-mb-l"></div>';
  }

  // All Open Tickets table
  h += '<h2 id="all-open-tickets" class="ons-u-fs-m ons-u-mb-s">All Open Tickets <span style="font-weight:400;color:#707071;font-size:0.875rem">— time to live by priority</span></h2>';
  h += '<div class="ons-table-scrollable__content ons-u-mb-l"><table class="ons-table">';
  h += '<thead class="ons-table__head"><tr class="ons-table__row">';
  ['Ticket', 'Priority', 'Category', 'Team', 'Opened', 'Elapsed', 'TTL Limit', 'Remaining', 'Status', 'Team Pressure'].forEach(function(th) {
    h += '<th class="ons-table__header" scope="col">' + th + '</th>';
  });
  h += '</tr></thead><tbody class="ons-table__body">';
  var allSorted = openWithTTL.slice().sort(function(a, b) { return a.remaining - b.remaining; });
  for (var j = 0; j < allSorted.length; j++) {
    var t = allSorted[j];
    var team = pressuredTeams.find(function(tm) { return tm.team === t.assigned_team; });
    var warn = t.ttlStatus === 'overdue' || (team && (team.pressureLevel === 'critical' || team.pressureLevel === 'high'));
    h += '<tr class="ons-table__row' + (warn ? ' ons-table__row--warn' : '') + '">';
    h += '<td class="ons-table__cell"><strong>' + t.ticket_id + '</strong></td>';
    h += '<td class="ons-table__cell"><span class="ons-status ons-status--' + (t.priority === 'high' ? 'error' : t.priority === 'medium' ? 'pending' : 'info') + '">' + t.priority + '</span></td>';
    h += '<td class="ons-table__cell">' + fmtCat(t.category) + '</td>';
    h += '<td class="ons-table__cell">' + t.assigned_team + '</td>';
    h += '<td class="ons-table__cell">' + t.created_date + '</td>';
    h += '<td class="ons-table__cell">' + t.elapsed + 'd</td>';
    h += '<td class="ons-table__cell">' + t.limit + 'd</td>';
    h += '<td class="ons-table__cell"><strong style="color:' + ttlColor(t.ttlStatus) + '">' + (t.remaining <= 0 ? Math.abs(t.remaining) + 'd over' : t.remaining + 'd') + '</strong></td>';
    h += '<td class="ons-table__cell"><span class="ons-status ons-status--' + ttlOnsStatus(t.ttlStatus) + '">' + t.ttlStatus.replace('-', ' ') + '</span></td>';
    h += '<td class="ons-table__cell">';
    if (team) h += '<span class="ons-status ons-status--' + pressureOns(team.pressureLevel) + '">' + team.pressureLevel + '</span>';
    else h += '—';
    h += '</td></tr>';
  }
  h += '</tbody></table></div>';

  // Resolved tickets summary
  h += '<h2 id="resolved-tickets" class="ons-u-fs-m ons-u-mb-s">Resolved Tickets <span style="font-weight:400;color:#707071;font-size:0.875rem">— resolution performance by team</span></h2>';
  h += '<div class="ons-table-scrollable__content ons-u-mb-l"><table class="ons-table">';
  h += '<thead class="ons-table__head"><tr class="ons-table__row">';
  ['Team', 'Total', 'Resolved', 'Open', 'Overdue', 'Avg Resolution'].forEach(function(th) {
    h += '<th class="ons-table__header" scope="col">' + th + '</th>';
  });
  h += '</tr></thead><tbody class="ons-table__body">';
  for (var k = 0; k < pressuredTeams.length; k++) {
    var pt = pressuredTeams[k];
    var teamOpenTTL = openWithTTL.filter(function(tk) { return tk.assigned_team === pt.team; });
    var teamOverdue = teamOpenTTL.filter(function(tk) { return tk.ttlStatus === 'overdue'; });
    h += '<tr class="ons-table__row' + (teamOverdue.length > 0 ? ' ons-table__row--warn' : '') + '">';
    h += '<td class="ons-table__cell"><strong>' + pt.team + '</strong></td>';
    h += '<td class="ons-table__cell">' + pt.tix.length + '</td>';
    h += '<td class="ons-table__cell">' + pt.resolved.length + '</td>';
    h += '<td class="ons-table__cell"><span class="ons-status ons-status--' + (pt.open.length > 0 ? 'pending' : 'success') + '">' + pt.open.length + '</span></td>';
    h += '<td class="ons-table__cell"><span class="ons-status ons-status--' + (teamOverdue.length > 0 ? 'error' : 'success') + '">' + teamOverdue.length + '</span></td>';
    h += '<td class="ons-table__cell">' + (pt.avgResolutionDays !== null ? pt.avgResolutionDays + ' days' : '—') + '</td>';
    h += '</tr>';
  }
  h += '</tbody></table></div>';

  el.innerHTML = h;
}

function ticketKpi(value, label, color, href) {
  var cls = color ? ' kpi-value--' + color : '';
  if (href) return '<a class="kpi-card kpi-card--link" href="' + href + '"><div class="kpi-value' + cls + '">' + value + '</div><div class="kpi-label">' + label + '</div></a>';
  return '<div class="kpi-card"><div class="kpi-value' + cls + '">' + value + '</div><div class="kpi-label">' + label + '</div></div>';
}
