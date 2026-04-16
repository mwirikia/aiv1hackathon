// Dashboard KPI and chart rendering — ONS Design System

function renderDashboard() {
  const el = document.getElementById('dashboard-panel');
  const { overAllocated, underAllocated, fullyFree, avgAllocOrg, openTickets, highOpen, teams, catStats, singlePointSkills, projects } = Store;
  const totalPeople = Store.raw.people.length;

  function allocColor(pct) { return pct > 100 ? 'red' : pct > 80 ? 'amber' : 'green'; }
  function colorHex(c) { return c === 'red' ? '#d0021b' : c === 'amber' ? '#fe781f' : '#0f8243'; }
  function barInline(pct) {
    const c = allocColor(pct);
    const w = Math.min(Math.round(pct * 100 / 120), 100);
    const markerPos = Math.round(100 * 100 / 120);
    return '<span class="alloc-bar">' +
      '<span class="alloc-bar__track">' +
        '<span class="alloc-bar__fill alloc-bar__fill--' + c + '" style="width:' + w + '%"></span>' +
        '<span class="alloc-bar__marker" style="left:' + markerPos + '%" title="100% capacity"></span>' +
      '</span>' +
      '<span class="alloc-bar__label alloc-bar__label--' + c + '">' + pct + '%</span>' +
    '</span>';
  }
  function fmtCat(c) { return c.replace(/_/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase()); }

  let h = '';

  // Summary panel
  h += '<div class="ons-panel ons-panel--info ons-panel--no-title ons-u-mb-m">';
  h += '<span class="ons-panel__assistive-text ons-u-vh">Important information: </span>';
  h += '<div class="ons-panel__body">';
  h += '<p><strong>Directorate snapshot:</strong> ' + totalPeople + ' people across ' + teams.length + ' teams. ';
  h += 'Average allocation is <strong style="color:' + colorHex(allocColor(avgAllocOrg)) + '">' + avgAllocOrg + '%</strong>. ';
  h += '<span style="color:#d0021b"><strong>' + overAllocated.length + ' staff are over-allocated.</strong></span> ';
  h += '<span style="color:#0f8243">' + underAllocated.length + ' have capacity to absorb more work.</span> ';
  h += 'There are <strong style="color:#d0021b">' + openTickets.length + ' open tickets</strong> (' + highOpen.length + ' high priority).</p>';
  h += '</div></div>';

  // KPIs
  h += '<div class="kpi-grid ons-u-mb-l">';
  h += kpi(totalPeople, 'Total Staff', '');
  h += kpi(avgAllocOrg + '%', 'Avg Allocation', allocColor(avgAllocOrg));
  h += kpi(overAllocated.length, 'Over-allocated', 'red');
  h += kpi(fullyFree.length, 'Available (≤60%)', 'green');
  h += kpi(openTickets.length, 'Open Tickets', 'amber');
  h += kpi(highOpen.length, 'High Priority Open', 'red');
  h += '</div>';

  // Recommendations
  const recs = buildRecommendations();
  if (recs.length) {
    h += '<h2 class="ons-u-fs-m ons-u-mb-s">Key Findings &amp; Recommendations</h2>';
    recs.forEach(r => {
      h += '<div class="rec ' + (r.urgent ? 'rec--urgent' : '') + '">';
      h += '<div class="rec__title">' + r.title + '</div>';
      h += '<div class="rec__body">' + r.body + '</div></div>';
    });
    h += '<div class="ons-u-mb-l"></div>';
  }

  // Open brief feedback panel
  h += '<h2 class="ons-u-fs-m ons-u-mb-s">Open Brief Feedback (Current Prototype)</h2>';
  h += '<div class="ons-panel ons-panel--info ons-panel--no-title ons-u-mb-l">';
  h += '<span class="ons-panel__assistive-text ons-u-vh">Important information: </span>';
  h += '<div class="ons-panel__body">';
  h += '<p><strong>What is strong already:</strong> clear user focus (directors and operations leads), joined-up workforce + ticket data, and fast answers to real leadership questions in one screen.</p>';
  h += '<p><strong>What the data says today:</strong> ' + overAllocated.length + ' over-allocated staff, ' + highOpen.length + ' high-priority open tickets, and ' + singlePointSkills.length + ' single-person skill dependencies.</p>';
  h += '<p><strong>Gaps to call out honestly:</strong> data freshness assumptions, no explicit confidence indicator per recommendation, and limited scenario testing for “what if we move 2 people?”.</p>';
  h += '<p><strong>Best next step (still one-day scope):</strong> add a simple redeployment simulator for moving named staff between projects/teams and show the before/after impact on allocation and risk.</p>';
  h += '</div></div>';

  // Charts row
  h += '<div class="chart-row ons-u-mb-l">';

  // Team avg allocation
  h += '<div class="chart-box"><h3>Team Average Allocation</h3>';
  [...teams].sort((a, b) => b.avgAlloc - a.avgAlloc).forEach(t => {
    const c = allocColor(t.avgAlloc);
    const w = Math.min(t.avgAlloc, 130);
    h += '<div class="h-bar"><span class="h-bar__label">' + t.team + '</span>';
    h += '<span class="h-bar__track"><span class="h-bar__fill" style="width:' + (w * 100 / 130) + '%;background:' + colorHex(c) + '">' + t.avgAlloc + '%</span></span></div>';
  });
  h += '</div>';

  // Ticket resolution by category
  h += '<div class="chart-box"><h3>Avg Resolution Time by Category</h3>';
  const maxDays = Math.max(...catStats.map(c => c.avg), 1);
  catStats.forEach(c => {
    const col = c.avg > 20 ? '#d0021b' : c.avg > 10 ? '#fe781f' : '#0f8243';
    h += '<div class="h-bar"><span class="h-bar__label">' + fmtCat(c.cat) + '</span>';
    h += '<span class="h-bar__track"><span class="h-bar__fill" style="width:' + (c.avg * 100 / maxDays) + '%;background:' + col + '">' + c.avg + 'd</span></span>';
    h += '<span class="h-bar__val" style="color:#707071">(' + c.count + ')</span></div>';
  });
  h += '</div></div>';

  // Team breakdown table
  h += '<h2 class="ons-u-fs-m ons-u-mb-s">Team Breakdown</h2>';
  h += '<div class="ons-table-scrollable__content ons-u-mb-l"><table class="ons-table">';
  h += '<thead class="ons-table__head"><tr class="ons-table__row">';
  ['Team', 'People', 'Avg Alloc', 'Over-alloc', 'Spare (≤80%)', 'Open Tix', 'Avg Resolution'].forEach(th => {
    h += '<th class="ons-table__header" scope="col">' + th + '</th>';
  });
  h += '</tr></thead><tbody class="ons-table__body">';
  teams.forEach(t => {
    const warn = t.overCount > 0 || t.open.length > 0;
    h += '<tr class="ons-table__row' + (warn ? ' ons-table__row--warn' : '') + '">';
    h += '<td class="ons-table__cell"><strong>' + t.team + '</strong></td>';
    h += '<td class="ons-table__cell">' + t.headcount + '</td>';
    h += '<td class="ons-table__cell">' + barInline(t.avgAlloc) + '</td>';
    h += '<td class="ons-table__cell"><span class="ons-status ons-status--' + (t.overCount > 0 ? 'error' : 'success') + '">' + t.overCount + '</span></td>';
    h += '<td class="ons-table__cell"><span class="ons-status ons-status--success">' + t.spareCapacity.length + '</span></td>';
    h += '<td class="ons-table__cell"><span class="ons-status ons-status--' + (t.open.length > 0 ? 'pending' : 'success') + '">' + t.open.length + '</span></td>';
    h += '<td class="ons-table__cell">' + (t.avgResolutionDays !== null ? t.avgResolutionDays + ' days' : '—') + '</td>';
    h += '</tr>';
  });
  h += '</tbody></table></div>';

  el.innerHTML = h;
}

function kpi(value, label, color) {
  const cls = color ? ' kpi-value--' + color : '';
  return '<div class="kpi-card"><div class="kpi-value' + cls + '">' + value + '</div><div class="kpi-label">' + label + '</div></div>';
}

function buildRecommendations() {
  const recs = [];
  const { overAllocated, highOpen, fullyFree, singlePointSkills } = Store;

  if (overAllocated.length > 0) {
    recs.push({
      urgent: true,
      title: overAllocated.length + ' staff over-allocated (>100%)',
      body: overAllocated.map(p => p.name).join(', ') + ' are committed beyond full capacity. This is unsustainable and risks delivery on their projects.',
    });
  }
  if (highOpen.length > 0) {
    recs.push({
      urgent: true,
      title: highOpen.length + ' high-priority ticket' + (highOpen.length > 1 ? 's' : '') + ' still open',
      body: highOpen.map(t => t.ticket_id + ': ' + t.description.substring(0, 80) + '…').join(' | '),
    });
  }
  if (fullyFree.length > 0) {
    recs.push({
      urgent: false,
      title: fullyFree.length + ' staff with significant spare capacity (≤60%)',
      body: fullyFree.map(p => p.name + ' (' + p.total_allocation + '%, ' + p.team + ')').join('; ') + ' could absorb new work or be redeployed.',
    });
  }
  if (singlePointSkills.length > 0) {
    recs.push({
      urgent: false,
      title: singlePointSkills.length + ' skills held by only one person',
      body: 'Single points of failure: ' + singlePointSkills.slice(0, 6).map(s => s.skill + ' (' + s.person.name + ')').join(', ') + (singlePointSkills.length > 6 ? '…' : ''),
    });
  }
  return recs;
}
