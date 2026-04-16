// App bootstrap
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  renderDashboard();
  initChat();
});
