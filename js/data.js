// Data Persistence Functions
function saveData() {
  const data = {
    sessions: allSessions,
    hourlyRate: hourlyRate,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadData() {
  const savedData = localStorage.getItem(STORAGE_KEY);
  if (savedData) {
    const data = JSON.parse(savedData);
    allSessions = data.sessions || [];
    hourlyRate = data.hourlyRate || 0;
    document.getElementById("hourly-rate").value =
      hourlyRate > 0 ? hourlyRate.toFixed(2) : "";
  }
  dateInput.value = currentDate;
  render();
  updateReports();
}
