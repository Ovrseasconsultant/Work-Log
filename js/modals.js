// Modal Management Functions

// Modal open/close functions
function openModal(modal) {
  if (!modal) return;

  modal.style.display = "flex";
  document.body.style.overflow = "hidden";

  // Trigger animation
  setTimeout(() => {
    modal.classList.add("active");
  }, 10);

  // Focus management
  const firstInput = modal.querySelector("input, select, button");
  if (firstInput) {
    firstInput.focus();
  }

  // Add escape key listener
  document.addEventListener("keydown", handleEscapeKey);
}

function closeModal(modal) {
  if (!modal) return;

  modal.classList.remove("active");
  document.body.style.overflow = "";

  setTimeout(() => {
    modal.style.display = "none";
  }, 250);

  // Remove escape key listener
  document.removeEventListener("keydown", handleEscapeKey);

  // Clear any error messages
  const errorElements = modal.querySelectorAll(".error-message");
  errorElements.forEach((el) => (el.textContent = ""));
}

function handleEscapeKey(e) {
  if (e.key === "Escape") {
    const openModal = document.querySelector(".mobile-modal.active");
    if (openModal) {
      closeModal(openModal);
    }
  }
}

// Session management functions
function editSession(sessionId) {
  const session = allSessions.find((s) => s.id === sessionId);
  if (!session) {
    console.error("Session not found:", sessionId);
    return;
  }

  // Populate edit form
  const editForm = document.getElementById("edit-work-form");
  if (editForm) {
    const startTimeInput = editForm.querySelector("#edit-start-time");
    const endTimeInput = editForm.querySelector("#edit-end-time");
    const breakTimeInput = editForm.querySelector("#edit-break-time");
    const payRateInput = editForm.querySelector("#edit-pay-rate");

    if (startTimeInput) startTimeInput.value = session.startTime;
    if (endTimeInput) endTimeInput.value = session.endTime;
    if (breakTimeInput)
      breakTimeInput.value = Math.round(session.breakTime / 60000);
    if (payRateInput) payRateInput.value = session.payRate || hourlyRate;
  }

  sessionToEdit = sessionId;
  openModal(document.getElementById("edit-modal"));
}

function deleteSession(sessionId) {
  sessionToDelete = sessionId;
  openModal(document.getElementById("confirm-modal"));
}

// Form submission handlers
function handleEditFormSubmit(e) {
  e.preventDefault();

  if (sessionToEdit === null) {
    console.error("No session to edit");
    return;
  }

  const sessionIndex = allSessions.findIndex((s) => s.id === sessionToEdit);
  if (sessionIndex === -1) {
    console.error("Session not found for editing");
    return;
  }

  const form = e.target;
  const date = currentDate;
  const startTime = form.querySelector("#edit-start-time").value;
  const endTime = form.querySelector("#edit-end-time").value;
  const breakTime = parseInt(form.querySelector("#edit-break-time").value) || 0;
  const payRate =
    parseFloat(form.querySelector("#edit-pay-rate").value) || hourlyRate;

  const errorElement = form.querySelector("#edit-error-message");
  errorElement.textContent = "";

  // Validation
  const validation = validateSession(startTime, endTime, breakTime);
  if (!validation.isValid) {
    errorElement.textContent = validation.errors[0];
    return;
  }

  const startDateTime = new Date(`${date}T${startTime}`);
  const endDateTime = new Date(`${date}T${endTime}`);

  if (endDateTime <= startDateTime) {
    errorElement.textContent = "End time must be after start time.";
    return;
  }

  const duration = endDateTime - startDateTime;
  const breakDuration = breakTime * 60 * 1000;
  const netDuration = duration - breakDuration;

  // Update session
  const updatedSession = {
    ...allSessions[sessionIndex],
    startTime,
    endTime,
    duration: netDuration,
    breakTime: breakDuration,
    payRate: payRate,
  };

  allSessions[sessionIndex] = updatedSession;
  saveData();
  render();

  // Send update to Formspree
  if (FORMSPREE_URL) {
    const formData = new FormData();
    formData.append("action", "update");
    formData.append("sessionId", updatedSession.id);
    formData.append("date", date);
    formData.append("startTime", startTime);
    formData.append("endTime", endTime);
    formData.append("duration", formatDuration(netDuration));
    formData.append("breakTime", breakTime);
    const sessionPay = (netDuration / (1000 * 60 * 60)) * payRate;
    formData.append("pay", sessionPay.toFixed(2));

    fetch(FORMSPREE_URL, {
      method: "POST",
      body: formData,
      mode: "no-cors",
    })
      .then((response) => {
        // Formspree submission successful
      })
      .catch((error) => {
        // Silently handle errors - Formspree is optional
      });
  }

  sessionToEdit = null;
  closeModal(document.getElementById("edit-modal"));
}

function handleDeleteConfirm() {
  if (sessionToDelete === null) {
    console.error("No session to delete");
    return;
  }

  const sessionToRemove = allSessions.find((s) => s.id === sessionToDelete);
  if (!sessionToRemove) {
    console.error("Session not found for deletion");
    return;
  }

  // Remove from local storage
  allSessions = allSessions.filter((s) => s.id !== sessionToDelete);
  saveData();
  render();

  // Send delete notification to Formspree
  if (FORMSPREE_URL && sessionToRemove) {
    const formData = new FormData();
    formData.append("action", "delete");
    formData.append("sessionId", sessionToRemove.id);
    formData.append("date", sessionToRemove.date);
    formData.append("startTime", sessionToRemove.startTime);
    formData.append("endTime", sessionToRemove.endTime);
    formData.append("duration", formatDuration(sessionToRemove.duration));
    formData.append(
      "breakTime",
      Math.round(sessionToRemove.breakTime / 60000) || 0
    );
    formData.append("pay", calculatePay(sessionToRemove.duration).toFixed(2));

    fetch(FORMSPREE_URL, {
      method: "POST",
      body: formData,
      mode: "no-cors",
    })
      .then((response) => {
        // Formspree submission successful
      })
      .catch((error) => {
        // Silently handle errors - Formspree is optional
      });
  }

  sessionToDelete = null;
  closeModal(document.getElementById("confirm-modal"));
}

// Settings management
function handleSettingsSubmit(e) {
  e.preventDefault();

  const newRate = parseFloat(e.target.querySelector("#hourly-rate").value);
  if (!isNaN(newRate) && newRate >= 0) {
    hourlyRate = newRate;
    saveData();
    render();
    closeModal(document.getElementById("settings-modal"));
  }
}

// Initialize modal event listeners
function initializeModals() {
  // Modal backdrop clicks
  const modals = document.querySelectorAll(".mobile-modal");
  modals.forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal || e.target.classList.contains("modal-backdrop")) {
        closeModal(modal);
      }
    });
  });

  // Close button clicks
  const closeButtons = document.querySelectorAll(".modal-close");
  closeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const modal = button.closest(".mobile-modal");
      if (modal) closeModal(modal);
    });
  });

  // Form submissions
  const editForm = document.getElementById("edit-work-form");
  if (editForm) {
    editForm.addEventListener("submit", handleEditFormSubmit);
  }

  const settingsForm = document.getElementById("settings-form");
  if (settingsForm) {
    settingsForm.addEventListener("submit", handleSettingsSubmit);
  }

  // Action buttons
  const confirmDeleteButton = document.getElementById("confirm-delete-button");
  if (confirmDeleteButton) {
    confirmDeleteButton.addEventListener("click", handleDeleteConfirm);
  }

  const cancelButtons = document.querySelectorAll(
    "#cancel-button, #confirm-cancel-button, #settings-cancel-button, #reports-cancel-button, #edit-cancel-button"
  );
  cancelButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const modal = button.closest(".mobile-modal");
      if (modal) closeModal(modal);
    });
  });

  // Add event listeners for edit and delete buttons
  addSessionButtonListeners();
}

// Add event listeners for session action buttons
function addSessionButtonListeners() {
  // Use event delegation for dynamically created buttons
  document.addEventListener("click", function (e) {
    // Edit button
    if (e.target.closest(".action-button-modern.edit")) {
      const button = e.target.closest(".action-button-modern.edit");
      const sessionId = parseInt(button.getAttribute("data-session-id"), 10);
      editSession(sessionId);
    }

    // Delete button
    if (e.target.closest(".action-button-modern.delete")) {
      const button = e.target.closest(".action-button-modern.delete");
      const sessionId = parseInt(button.getAttribute("data-session-id"), 10);
      deleteSession(sessionId);
    }
  });
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", initializeModals);

// Export functions for global use
window.editSession = editSession;
window.deleteSession = deleteSession;
window.openModal = openModal;
window.closeModal = closeModal;
