// Reports & Analytics Functions

function updateReports() {
  const period = document.getElementById("report-period")?.value || "month";
  const filteredSessions = filterSessionsByPeriod(allSessions, period);
  const stats = calculateStatistics(filteredSessions);

  updateReportDisplay(stats);
}

function updateReportDisplay(stats) {
  const totalHoursElement = document.getElementById("report-total-hours");
  const totalPayElement = document.getElementById("report-total-pay");
  const sessionsCountElement = document.getElementById("report-sessions-count");
  const avgSessionElement = document.getElementById("report-avg-session");

  if (totalHoursElement) {
    totalHoursElement.textContent = stats.totalHours.toFixed(2);
  }

  if (totalPayElement) {
    totalPayElement.textContent = `$${stats.totalPay.toFixed(2)}`;
  }

  if (sessionsCountElement) {
    sessionsCountElement.textContent = stats.sessionCount.toString();
  }

  if (avgSessionElement) {
    avgSessionElement.textContent = stats.averageSession.toFixed(2);
  }
}

// Enhanced reporting functions
function generateWeeklyReport() {
  const weekSessions = filterSessionsByPeriod(allSessions, "week");
  return generateDetailedReport(weekSessions, "This Week");
}

function generateMonthlyReport() {
  const monthSessions = filterSessionsByPeriod(allSessions, "month");
  return generateDetailedReport(monthSessions, "This Month");
}

function generateQuarterlyReport() {
  const quarterSessions = filterSessionsByPeriod(allSessions, "quarter");
  return generateDetailedReport(quarterSessions, "This Quarter");
}

function generateYearlyReport() {
  const yearSessions = filterSessionsByPeriod(allSessions, "year");
  return generateDetailedReport(yearSessions, "This Year");
}

function generateDetailedReport(sessions, periodName) {
  if (sessions.length === 0) {
    return {
      period: periodName,
      totalHours: 0,
      totalPay: 0,
      sessionCount: 0,
      averageSession: 0,
      dailyBreakdown: [],
      hourlyBreakdown: [],
      topDays: [],
      message: `No sessions found for ${periodName.toLowerCase()}`,
    };
  }

  const stats = calculateStatistics(sessions);

  // Daily breakdown
  const dailyBreakdown = generateDailyBreakdown(sessions);

  // Hourly breakdown
  const hourlyBreakdown = generateHourlyBreakdown(sessions);

  // Top working days
  const topDays = generateTopDays(sessions);

  return {
    period: periodName,
    totalHours: stats.totalHours,
    totalPay: stats.totalPay,
    sessionCount: stats.sessionCount,
    averageSession: stats.averageSession,
    dailyBreakdown,
    hourlyBreakdown,
    topDays,
    message: `${
      stats.sessionCount
    } sessions totaling ${stats.totalHours.toFixed(2)} hours`,
  };
}

function generateDailyBreakdown(sessions) {
  const dailyTotals = {};

  sessions.forEach((session) => {
    const date = session.date;
    if (!dailyTotals[date]) {
      dailyTotals[date] = {
        hours: 0,
        pay: 0,
        sessions: 0,
      };
    }

    dailyTotals[date].hours += session.duration / (1000 * 60 * 60);
    dailyTotals[date].pay += calculatePay(session.duration);
    dailyTotals[date].sessions += 1;
  });

  return Object.entries(dailyTotals)
    .map(([date, data]) => ({
      date,
      hours: data.hours,
      pay: data.pay,
      sessions: data.sessions,
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

function generateHourlyBreakdown(sessions) {
  const hourlyTotals = {};

  // Initialize hours 0-23
  for (let i = 0; i < 24; i++) {
    hourlyTotals[i] = {
      hours: 0,
      sessions: 0,
    };
  }

  sessions.forEach((session) => {
    const startHour = parseInt(session.startTime.split(":")[0]);
    const endHour = parseInt(session.endTime.split(":")[0]);

    // Handle sessions that span multiple hours
    for (let hour = startHour; hour <= endHour; hour++) {
      if (hourlyTotals[hour]) {
        hourlyTotals[hour].sessions += 1;
        // Approximate hours worked in this hour
        const hourFraction = hour === startHour || hour === endHour ? 0.5 : 1;
        hourlyTotals[hour].hours += hourFraction;
      }
    }
  });

  return Object.entries(hourlyTotals)
    .map(([hour, data]) => ({
      hour: parseInt(hour),
      hours: data.hours,
      sessions: data.sessions,
    }))
    .filter((data) => data.hours > 0)
    .sort((a, b) => a.hour - b.hour);
}

function generateTopDays(sessions) {
  const dailyTotals = {};

  sessions.forEach((session) => {
    const date = session.date;
    if (!dailyTotals[date]) {
      dailyTotals[date] = 0;
    }
    dailyTotals[date] += session.duration / (1000 * 60 * 60);
  });

  return Object.entries(dailyTotals)
    .map(([date, hours]) => ({ date, hours }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 5);
}

// Export functions for reports
function exportReportAsCSV(period = "month") {
  const sessions = filterSessionsByPeriod(allSessions, period);
  const csv = generateCSV(sessions);

  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `work-time-report-${period}-${
    new Date().toISOString().split("T")[0]
  }.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// Performance insights
function generatePerformanceInsights(sessions) {
  if (sessions.length === 0) {
    return {
      insights: ["No data available for insights"],
      recommendations: ["Start logging your work sessions to get insights"],
    };
  }

  const stats = calculateStatistics(sessions);
  const insights = [];
  const recommendations = [];

  // Average session length insights
  if (stats.averageSession < 2) {
    insights.push("Short average session length");
    recommendations.push("Consider longer focused work sessions");
  } else if (stats.averageSession > 8) {
    insights.push("Long average session length");
    recommendations.push("Consider taking more breaks during long sessions");
  }

  // Daily consistency insights
  const dailyBreakdown = generateDailyBreakdown(sessions);
  const workingDays = dailyBreakdown.length;
  const totalDays = getDaysInPeriod(sessions);

  if (workingDays / totalDays < 0.5) {
    insights.push("Inconsistent daily work pattern");
    recommendations.push("Try to maintain a more consistent daily schedule");
  }

  // Productivity insights
  const totalHours = stats.totalHours;
  if (totalHours < 20) {
    insights.push("Low total hours this period");
    recommendations.push("Consider increasing your work hours");
  } else if (totalHours > 160) {
    insights.push("High total hours this period");
    recommendations.push("Ensure you're maintaining work-life balance");
  }

  return { insights, recommendations };
}

function getDaysInPeriod(sessions) {
  if (sessions.length === 0) return 0;

  const dates = sessions.map((s) => s.date);
  const uniqueDates = [...new Set(dates)];
  return uniqueDates.length;
}

// Initialize reports when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Set up report period change listener
  const reportPeriodSelect = document.getElementById("report-period");
  if (reportPeriodSelect) {
    reportPeriodSelect.addEventListener("change", updateReports);
  }

  // Initial report update
  updateReports();
});

// Export functions for global use
window.updateReports = updateReports;
window.generateWeeklyReport = generateWeeklyReport;
window.generateMonthlyReport = generateMonthlyReport;
window.generateQuarterlyReport = generateQuarterlyReport;
window.generateYearlyReport = generateYearlyReport;
window.exportReportAsCSV = exportReportAsCSV;
window.generatePerformanceInsights = generatePerformanceInsights;
