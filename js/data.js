// Data Persistence Functions
function saveData() {
  const data = {
    sessions: allSessions,
    hourlyRate: hourlyRate,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

  // Save to Formspree (if configured)
  if (FORMSPREE_URL) {
    const formData = new FormData();
    formData.append("sessions", JSON.stringify(allSessions));
    formData.append("hourlyRate", hourlyRate);
    formData.append("currentDate", currentDate);

    fetch(FORMSPREE_URL, {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        // Data saved to Formspree successfully
      })
      .catch((error) => {
        console.error("Error saving data to Formspree:", error);
      });
  } else {
    // Formspree URL not configured. Data will only be saved locally.
  }
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
