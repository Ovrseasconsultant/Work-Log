// Utility Functions

function formatDuration(milliseconds) {
  if (milliseconds <= 0) return "0.00h";

  const hours = milliseconds / (1000 * 60 * 60);
  return hours.toFixed(2) + "h";
}

function formatDecimalHours(milliseconds) {
  if (milliseconds <= 0) return "0.00";

  const hours = milliseconds / (1000 * 60 * 60);
  return hours.toFixed(2);
}

function calculatePay(milliseconds) {
  const hours = milliseconds / (1000 * 60 * 60);
  return hours * hourlyRate;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function format12Hour(timeString) {
  const [hours, minutes] = timeString.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

function format24Hour(timeString) {
  return timeString; // Already in 24-hour format
}

// Date utilities
function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getCurrentYear() {
  return new Date().getFullYear();
}

function getCurrentQuarter() {
  const month = new Date().getMonth();
  return Math.floor(month / 3) + 1;
}

// Validation functions
function isValidTime(timeString) {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeString);
}

function isValidDate(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

function isValidBreakTime(minutes) {
  return Number.isInteger(minutes) && minutes >= 0 && minutes <= 480;
}

// Session validation
function validateSession(startTime, endTime, breakTime = 0) {
  const errors = [];

  if (!isValidTime(startTime)) {
    errors.push("Invalid start time format");
  }

  if (!isValidTime(endTime)) {
    errors.push("Invalid end time format");
  }

  if (!isValidBreakTime(breakTime)) {
    errors.push("Break time must be between 0 and 480 minutes");
  }

  if (startTime && endTime && startTime >= endTime) {
    errors.push("End time must be after start time");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Local storage utilities
function saveToLocalStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("Error saving to localStorage:", error);
    return false;
  }
}

function loadFromLocalStorage(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error("Error loading from localStorage:", error);
    return defaultValue;
  }
}

// Export utilities for CSV
function generateCSV(sessions) {
  const headers = [
    "Date",
    "Start Time",
    "End Time",
    "Duration (hours)",
    "Break (minutes)",
    "Pay ($)",
  ];
  const rows = sessions.map((session) => [
    session.date,
    session.startTime,
    session.endTime,
    formatDecimalHours(session.duration),
    Math.round(session.breakTime / 60000),
    calculatePay(session.duration).toFixed(2),
  ]);

  return [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");
}

// Time period filtering
function filterSessionsByPeriod(sessions, period) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentWeek = getWeekNumber(now);

  switch (period) {
    case "week":
      return sessions.filter((session) => {
        const sessionDate = new Date(session.date);
        return (
          sessionDate.getFullYear() === currentYear &&
          getWeekNumber(sessionDate) === currentWeek
        );
      });

    case "month":
      return sessions.filter((session) => {
        const sessionDate = new Date(session.date);
        return (
          sessionDate.getFullYear() === currentYear &&
          sessionDate.getMonth() === currentMonth
        );
      });

    case "quarter":
      const currentQuarter = Math.floor(currentMonth / 3);
      return sessions.filter((session) => {
        const sessionDate = new Date(session.date);
        return (
          sessionDate.getFullYear() === currentYear &&
          Math.floor(sessionDate.getMonth() / 3) === currentQuarter
        );
      });

    case "year":
      return sessions.filter((session) => {
        const sessionDate = new Date(session.date);
        return sessionDate.getFullYear() === currentYear;
      });

    case "all":
    default:
      return sessions;
  }
}

function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// Statistics calculations
function calculateStatistics(sessions) {
  if (sessions.length === 0) {
    return {
      totalHours: 0,
      totalPay: 0,
      sessionCount: 0,
      averageSession: 0,
    };
  }

  const totalDuration = sessions.reduce(
    (sum, session) => sum + session.duration,
    0
  );
  const totalHours = totalDuration / (1000 * 60 * 60);
  const totalPay = calculatePay(totalDuration);
  const sessionCount = sessions.length;
  const averageSession = totalHours / sessionCount;

  return {
    totalHours,
    totalPay,
    sessionCount,
    averageSession,
  };
}

// Mobile-specific utilities
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isAndroid() {
  return /Android/.test(navigator.userAgent);
}

// Touch-friendly utilities
function addTouchSupport(element, callback) {
  let startY = 0;
  let startX = 0;

  element.addEventListener("touchstart", (e) => {
    startY = e.touches[0].clientY;
    startX = e.touches[0].clientX;
  });

  element.addEventListener("touchend", (e) => {
    const endY = e.changedTouches[0].clientY;
    const endX = e.changedTouches[0].clientX;
    const deltaY = startY - endY;
    const deltaX = startX - endX;

    // Detect swipe gestures
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 50) {
      if (deltaY > 0) {
        // Swipe up
        callback("swipeUp");
      } else {
        // Swipe down
        callback("swipeDown");
      }
    }
  });
}

// Accessibility utilities
function announceToScreenReader(message) {
  const announcement = document.createElement("div");
  announcement.setAttribute("aria-live", "polite");
  announcement.setAttribute("aria-atomic", "true");
  announcement.style.position = "absolute";
  announcement.style.left = "-10000px";
  announcement.style.width = "1px";
  announcement.style.height = "1px";
  announcement.style.overflow = "hidden";

  announcement.textContent = message;
  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

// Performance utilities
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function throttle(func, limit) {
  let inThrottle;
  return function () {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
