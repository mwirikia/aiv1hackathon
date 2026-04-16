// Data loading and derived metrics
const Store = {
  raw: { people: [], tickets: [], orgChart: null },
  byId: new Map(),
  teams: [],
  overAllocated: [],
  underAllocated: [],
  fullyFree: [],
  avgAllocOrg: 0,
  openTickets: [],
  highOpen: [],
  projects: [],
  singlePointSkills: [],
  catStats: [],
  skillHolders: new Map(),
};

async function loadData() {
  const [people, tickets, orgChart] = await Promise.all([
    fetch('data/workforce.json', { cache: 'no-store' }).then(r => r.json()),
    fetch('data/tickets.json', { cache: 'no-store' }).then(r => r.json()),
    fetch('data/org-chart.json', { cache: 'no-store' }).then(r => r.json()),
  ]);

  Store.raw = { people, tickets, orgChart };
  Store.byId = new Map(people.map(p => [p.employee_id, p]));

  // Team-level metrics
  Store.teams = orgChart.teams.map(t => {
    const members = t.members.map(id => Store.byId.get(id)).filter(Boolean);
    const tix = tickets.filter(tk => tk.assigned_team === t.team);
    const open = tix.filter(tk => tk.status === 'open');
    const resolved = tix.filter(tk => tk.status === 'resolved');
    const avgAlloc = Math.round(members.reduce((s, m) => s + m.total_allocation, 0) / members.length);
    const overCount = members.filter(m => m.total_allocation > 100).length;
    const spareCapacity = members.filter(m => m.total_allocation <= 80);
    const avgResolutionDays = resolved.length
      ? Math.round(resolved.reduce((s, tk) => s + (new Date(tk.resolved_date) - new Date(tk.created_date)) / 86400000, 0) / resolved.length)
      : null;
    return { ...t, members, tix, open, resolved, avgAlloc, overCount, spareCapacity, avgResolutionDays };
  });

  // Org-wide
  Store.overAllocated = people.filter(p => p.total_allocation > 100);
  Store.underAllocated = people.filter(p => p.total_allocation <= 80);
  Store.fullyFree = people.filter(p => p.total_allocation <= 60);
  Store.avgAllocOrg = Math.round(people.reduce((s, p) => s + p.total_allocation, 0) / people.length);
  Store.openTickets = tickets.filter(t => t.status === 'open');
  Store.highOpen = Store.openTickets.filter(t => t.priority === 'high');

  // Projects
  const projectMap = new Map();
  for (const p of people) {
    for (const a of p.allocations) {
      if (!projectMap.has(a.project)) projectMap.set(a.project, { name: a.project, people: [], totalFTE: 0 });
      const proj = projectMap.get(a.project);
      proj.people.push({ ...p, pct: a.percentage });
      proj.totalFTE += a.percentage / 100;
    }
  }
  Store.projects = [...projectMap.values()].sort((a, b) => b.totalFTE - a.totalFTE);

  // Skills concentration
  Store.skillHolders = new Map();
  for (const p of people) {
    for (const s of p.skills) {
      const key = s.toLowerCase();
      if (!Store.skillHolders.has(key)) Store.skillHolders.set(key, []);
      Store.skillHolders.get(key).push(p);
    }
  }
  Store.singlePointSkills = [...Store.skillHolders.entries()]
    .filter(([, h]) => h.length === 1)
    .map(([skill, h]) => ({ skill, person: h[0] }));

  // Ticket category stats
  const catMap = new Map();
  for (const tk of tickets.filter(t => t.status === 'resolved')) {
    const days = (new Date(tk.resolved_date) - new Date(tk.created_date)) / 86400000;
    if (!catMap.has(tk.category)) catMap.set(tk.category, { count: 0, totalDays: 0 });
    const c = catMap.get(tk.category);
    c.count++; c.totalDays += days;
  }
  Store.catStats = [...catMap.entries()].map(([cat, s]) => ({ cat, avg: Math.round(s.totalDays / s.count), count: s.count })).sort((a, b) => b.avg - a.avg);
}
