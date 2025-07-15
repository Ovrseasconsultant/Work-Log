// UI Management Functions

function render() {
  renderSessions();
  updateTotals();
  updateReports();
}

function renderSessions() {
  const currentSessions = allSessions.filter(
    (session) => session.date === currentDate
  );

  if (currentSessions.length === 0) {
    sessionList.innerHTML = "";
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  // Sort sessions by start time
  currentSessions.sort((a, b) => a.startTime.localeCompare(b.startTime));

  sessionList.innerHTML = currentSessions
    .map((session, index) => {
      const startTime = session.startTime;
      const endTime = session.endTime;
      const duration = formatDuration(session.duration);
      const sessionPayRate = session.payRate || hourlyRate;
      const pay = (session.duration / (1000 * 60 * 60)) * sessionPayRate;
      const breakMinutes = Math.round(session.breakTime / 60000);

      // Format date for display
      const sessionDate = new Date(session.date);
      const dayName = sessionDate.toLocaleDateString("en-US", {
        weekday: "short",
      });
      const monthDay = sessionDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const year = sessionDate.getFullYear();

      return `
        <li class="session-card-modern" data-session-id="${
          session.id
        }" style="animation-delay: ${index * 50}ms">
          <div class="card-content">
            <div class="card-main">
              <div class="date-section">
                <div class="date-icon">
                  <svg class="calendar-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div class="date-info">
                  <p class="date-day">${dayName}, ${monthDay}</p>
                  <p class="date-year">${year}</p>
                </div>
              </div>

              <div class="time-grid">
                <div class="time-item">
                  <p class="time-label">Start</p>
                  <p class="time-value">${startTime}</p>
                </div>
                <div class="time-item">
                  <p class="time-label">End</p>
                  <p class="time-value">${endTime}</p>
                </div>
              </div>

              <div class="stats-grid">
                <div class="stat-item">
                  <p class="stat-label">Hours</p>
                  <p class="stat-value hours">${duration}h</p>
                </div>
                <div class="stat-item">
                  <p class="stat-label">Rate</p>
                  <p class="stat-value rate">$${sessionPayRate.toFixed(2)}</p>
                </div>
                <div class="stat-item">
                  <p class="stat-label">Pay</p>
                  <p class="stat-value pay">$${pay.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div class="card-actions">
              <button class="action-button-modern edit" data-session-id="${
                session.id
              }" aria-label="Edit session">
                <svg class="action-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button class="action-button-modern delete" data-session-id="${
                session.id
              }" aria-label="Delete session">
                <svg class="action-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </li>
      `;
    })
    .join("");
}

function updateTotals() {
  // Daily totals
  const currentSessions = allSessions.filter(
    (session) => session.date === currentDate
  );
  const dailyTotalDuration = currentSessions.reduce(
    (total, session) => total + session.duration,
    0
  );
  const dailyTotalPay = currentSessions.reduce((total, session) => {
    const sessionPayRate = session.payRate || hourlyRate;
    const sessionPay = (session.duration / (1000 * 60 * 60)) * sessionPayRate;
    return total + sessionPay;
  }, 0);

  dailyTotalTimeDisplay.textContent = formatDuration(dailyTotalDuration) + "h";
  dailyTotalPayDisplay.textContent = `$${dailyTotalPay.toFixed(2)}`;

  // Monthly totals
  const currentMonth = currentDate.substring(0, 7); // YYYY-MM
  const monthlySessions = allSessions.filter((session) =>
    session.date.startsWith(currentMonth)
  );
  const monthlyTotalDuration = monthlySessions.reduce(
    (total, session) => total + session.duration,
    0
  );
  const monthlyTotalPay = monthlySessions.reduce((total, session) => {
    const sessionPayRate = session.payRate || hourlyRate;
    const sessionPay = (session.duration / (1000 * 60 * 60)) * sessionPayRate;
    return total + sessionPay;
  }, 0);

  monthlyTotalTimeDisplay.textContent = formatDuration(monthlyTotalDuration);
  monthlyTotalPayDisplay.textContent = `$${monthlyTotalPay.toFixed(2)}`;
}

function setCurrentDate() {
  const today = new Date().toISOString().split("T")[0];
  dateInput.value = today;
  currentDate = today;
}

function openModal(modal) {
  modal.style.display = "flex";
  setTimeout(() => {
    modal.classList.add("active");
  }, 10);

  // Focus management
  const firstInput = modal.querySelector("input, select, button");
  if (firstInput) {
    firstInput.focus();
  }
}

function closeModal(modal) {
  modal.classList.remove("active");
  setTimeout(() => {
    modal.style.display = "none";
  }, 250);
}

// Initialize settings form with current hourly rate
function initializeSettings() {
  const hourlyRateInput = document.getElementById("hourly-rate");
  if (hourlyRateInput) {
    hourlyRateInput.value = hourlyRate.toFixed(2);
  }
}

// Call initialize settings when the page loads
document.addEventListener("DOMContentLoaded", initializeSettings);
