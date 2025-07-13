// DOM Elements
const dateInput = document.getElementById("current-date");
const dailyTotalTimeDisplay = document.getElementById("daily-total-time");
const dailyTotalPayDisplay = document.getElementById("daily-total-pay");
const monthlyTotalTimeDisplay = document.getElementById("monthly-total-time");
const monthlyTotalPayDisplay = document.getElementById("monthly-total-pay");
const monthlyTotalLabel = document.getElementById("monthly-total-label");
const logWorkForm = document.getElementById("log-work-form");
const quickEntryForm = document.getElementById("quick-entry-form");
const errorMessage = document.getElementById("error-message");
const modalErrorMessage = document.getElementById("modal-error-message");
const sessionList = document.getElementById("session-list");
const emptyState = document.getElementById("empty-state");

// Modals & Buttons
const sessionModal = document.getElementById("session-modal");
const confirmModal = document.getElementById("confirm-modal");
const settingsModal = document.getElementById("settings-modal");
const reportsModal = document.getElementById("reports-modal");
const editModal = document.getElementById("edit-modal");
const settingsButton = document.getElementById("settings-button");
const reportsButton = document.getElementById("reports-button");

// --- Event Listeners ---
settingsButton.addEventListener("click", () => openModal(settingsModal));
reportsButton.addEventListener("click", () => openModal(reportsModal));

// Modal backdrop clicks
sessionModal.addEventListener("click", (e) => {
  if (
    e.target === sessionModal ||
    e.target.classList.contains("modal-backdrop")
  ) {
    closeModal(sessionModal);
  }
});
confirmModal.addEventListener("click", (e) => {
  if (
    e.target === confirmModal ||
    e.target.classList.contains("modal-backdrop")
  ) {
    closeModal(confirmModal);
  }
});
settingsModal.addEventListener("click", (e) => {
  if (
    e.target === settingsModal ||
    e.target.classList.contains("modal-backdrop")
  ) {
    closeModal(settingsModal);
  }
});
reportsModal.addEventListener("click", (e) => {
  if (
    e.target === reportsModal ||
    e.target.classList.contains("modal-backdrop")
  ) {
    closeModal(reportsModal);
  }
});
editModal.addEventListener("click", (e) => {
  if (e.target === editModal || e.target.classList.contains("modal-backdrop")) {
    closeModal(editModal);
  }
});

// Form submissions
quickEntryForm.addEventListener("submit", handleQuickFormSubmit);
logWorkForm.addEventListener("submit", handleModalFormSubmit);
dateInput.addEventListener("change", handleDateChange);

// Reports functionality
document
  .getElementById("report-period")
  .addEventListener("change", updateReports);

// Modal close buttons
document
  .getElementById("modal-close")
  ?.addEventListener("click", () => closeModal(sessionModal));
document
  .getElementById("settings-close")
  ?.addEventListener("click", () => closeModal(settingsModal));
document
  .getElementById("reports-close")
  ?.addEventListener("click", () => closeModal(reportsModal));
document
  .getElementById("edit-close")
  ?.addEventListener("click", () => closeModal(editModal));

// Modal action buttons
document
  .getElementById("cancel-button")
  .addEventListener("click", () => closeModal(sessionModal));
document
  .getElementById("confirm-cancel-button")
  .addEventListener("click", () => closeModal(confirmModal));
document
  .getElementById("settings-cancel-button")
  .addEventListener("click", () => closeModal(settingsModal));
document
  .getElementById("reports-cancel-button")
  .addEventListener("click", () => closeModal(reportsModal));
document
  .getElementById("edit-cancel-button")
  .addEventListener("click", () => closeModal(editModal));

// --- Event Handlers ---
function handleQuickFormSubmit(e) {
  e.preventDefault();
  logSessionFromForm(quickEntryForm, errorMessage);
}

function handleModalFormSubmit(e) {
  e.preventDefault();
  logSessionFromForm(logWorkForm, modalErrorMessage);
  closeModal(sessionModal);
}

function handleDateChange(e) {
  currentDate = e.target.value;
  render();
}

// --- Core Logic ---
function logSessionFromForm(form, errorElement) {
  const date = dateInput.value;

  // Get time values from native time pickers
  const startTime = form.querySelector("#start-time, #modal-start-time").value;
  const endTime = form.querySelector("#end-time, #modal-end-time").value;
  const breakTime =
    parseInt(form.querySelector("#break-time, #modal-break-time").value) || 0;

  errorElement.textContent = "";
  if (!startTime || !endTime) {
    errorElement.textContent = "Please select both start and end times.";
    return;
  }
  const startDateTime = new Date(`${date}T${startTime}`);
  const endDateTime = new Date(`${date}T${endTime}`);
  if (endDateTime <= startDateTime) {
    errorElement.textContent = "End time must be after start time.";
    return;
  }

  const duration = endDateTime - startDateTime;
  const breakDuration = breakTime * 60 * 1000; // Convert minutes to milliseconds
  const netDuration = duration - breakDuration;
  const pay = calculatePay(netDuration);

  const session = {
    id: Date.now(),
    date,
    startTime,
    endTime,
    duration: netDuration,
    breakTime: breakDuration,
  };
  allSessions.push(session);
  saveData();
  render();

  // Clear the quick entry form
  if (form === quickEntryForm) {
    form.reset();
  }

  // Send to Formspree
  if (FORMSPREE_URL) {
    const formData = new FormData();
    formData.append("date", date);
    formData.append("startTime", startTime);
    formData.append("endTime", endTime);
    formData.append("duration", formatDuration(netDuration));
    formData.append("breakTime", breakTime);
    formData.append("pay", pay.toFixed(2)); // Formspree expects numbers

    fetch(FORMSPREE_URL, {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        return response.text();
      })
      .then((text) => {
        try {
          const data = JSON.parse(text);
          if (!data.success) {
            console.error("Error saving to Formspree:", data.error);
          }
        } catch (e) {
          // Response was not JSON, but request was sent
        }
      })
      .catch((error) => {
        console.error("Error sending data to Formspree:", error);
      });
  } else {
    // Formspree URL not configured - data saved locally only
  }
}

// --- Initial Load ---
window.onload = function () {
  loadData();
  setCurrentDate();
};
