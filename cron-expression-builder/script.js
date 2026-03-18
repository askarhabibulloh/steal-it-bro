document.addEventListener("DOMContentLoaded", () => {
  const minute = document.getElementById("minute");
  const hour = document.getElementById("hour");
  const day = document.getElementById("day");
  const month = document.getElementById("month");
  const weekday = document.getElementById("weekday");
  const command = document.getElementById("command");
  const dateTrigger = document.getElementById("date-trigger");
  const datePanel = document.getElementById("date-panel");
  const dateMonthSelect = document.getElementById("date-month-select");
  const dateDaySelect = document.getElementById("date-day-select");
  const dateApply = document.getElementById("date-apply");
  const dateClear = document.getElementById("date-clear");
  const outputBox = document.getElementById("output-box");
  const copyBtn = document.getElementById("copy-btn");
  const statusChip = document.getElementById("status-chip");

  function buildCron() {
    const parts = [
      minute.value || "*",
      hour.value || "*",
      day.value || "*",
      month.value || "*",
      weekday.value || "*",
    ];
    return parts.join(" ");
  }

  function updateOutput() {
    const expr = buildCron();
    outputBox.textContent = expr + (command.value ? "  " + command.value : "");
  }

  // wire inputs
  [minute, hour, day, month, weekday, command].forEach(
    (el) => el && el.addEventListener("input", updateOutput),
  );

  // build selects for month/day
  function populateMonthOptions() {
    dateMonthSelect.innerHTML = "";
    for (let m = 1; m <= 12; m++) {
      const opt = document.createElement("option");
      opt.value = String(m);
      opt.textContent = String(m);
      dateMonthSelect.appendChild(opt);
    }
  }

  function populateDayOptions(max = 31) {
    dateDaySelect.innerHTML = "";
    for (let d = 1; d <= max; d++) {
      const opt = document.createElement("option");
      opt.value = String(d);
      opt.textContent = String(d);
      dateDaySelect.appendChild(opt);
    }
  }

  function daysInMonth(month, year = 2000) {
    return new Date(year, month, 0).getDate();
  }

  populateMonthOptions();
  populateDayOptions();

  // when month changes, adjust days count
  dateMonthSelect.addEventListener("change", () => {
    const m = parseInt(dateMonthSelect.value, 10) || 1;
    const max = daysInMonth(m);
    const cur = parseInt(dateDaySelect.value, 10) || 1;
    populateDayOptions(max);
    dateDaySelect.value = Math.min(cur, max);
  });

  // panel open/close
  function showDatePanel() {
    if (!datePanel) return;
    datePanel.style.display = "block";
  }
  function hideDatePanel() {
    if (!datePanel) return;
    datePanel.style.display = "none";
  }

  if (dateTrigger) {
    dateTrigger.addEventListener("click", () => {
      showDatePanel();
    });
    dateTrigger.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        showDatePanel();
      }
    });
  }

  // apply / clear
  if (dateApply)
    dateApply.addEventListener("click", () => {
      const m = dateMonthSelect.value;
      const d = dateDaySelect.value;
      if (m) month.value = m;
      if (d) day.value = d;
      updateOutput();
      hideDatePanel();
    });
  if (dateClear)
    dateClear.addEventListener("click", () => {
      month.value = "*";
      day.value = "*";
      updateOutput();
      hideDatePanel();
    });

  // close panel when clicking outside or pressing Escape
  document.addEventListener("click", (ev) => {
    if (!datePanel) return;
    const path = ev.composedPath ? ev.composedPath() : ev.path || [];
    if (datePanel.style.display === "block") {
      if (!path.includes(datePanel) && ev.target !== dateTrigger)
        hideDatePanel();
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideDatePanel();
  });

  // open custom date panel when user clicks/focuses day or month fields
  [day, month].forEach((el) => {
    if (!el) return;
    el.addEventListener("focus", showDatePanel);
    el.addEventListener("click", showDatePanel);
  });

  const presets = {
    "every-minute": ["*", "*", "*", "*", "*"],
    "every-5-minutes": ["*/5", "*", "*", "*", "*"],
    "every-15-minutes": ["*/15", "*", "*", "*", "*"],
    "every-30-minutes": ["*/30", "*", "*", "*", "*"],
    hourly: ["0", "*", "*", "*", "*"],
    "every-2-hours": ["0", "*/2", "*", "*", "*"],
    "every-6-hours": ["0", "*/6", "*", "*", "*"],
    "twice-daily": ["0", "8,20", "*", "*", "*"],
    midnight: ["0", "0", "*", "*", "*"],
    "sunday-midnight": ["0", "0", "*", "*", "0"],
    "every-monday": ["0", "0", "*", "*", "1"],
    weekdays: ["0", "9", "*", "*", "1-5"],
    monthly: ["0", "0", "1", "*", "*"],
    "every-hour-at-15": ["15", "*", "*", "*", "*"],
  };

  document.querySelectorAll(".preset-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const p = btn.dataset.preset;
      const v = presets[p];
      if (v) {
        minute.value = v[0];
        hour.value = v[1];
        day.value = v[2];
        month.value = v[3];
        weekday.value = v[4];
        document
          .querySelectorAll(".preset-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        updateOutput();
      }
    });
  });

  if (copyBtn)
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(outputBox.textContent || "");
        statusChip.style.visibility = "visible";
        setTimeout(() => {
          statusChip.style.visibility = "hidden";
        }, 1400);
      } catch (e) {
        console.warn("copy failed", e);
      }
    });

  // initial render
  updateOutput();
});
