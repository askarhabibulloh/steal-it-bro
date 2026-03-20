const sources = [
  {
    ruang: "A",
    csv: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTC0Cr6p3JES-Bwv52W-fpZ_EVhtr3oIUc9o-uJd1BOa9UR8j3NQox1N7uvjirRhHkFH8FaS8pqv1ME/pub?output=csv",
    link: "https://docs.google.com/forms/d/e/1FAIpQLScnzJyrGRuozmMHE_PaxNQNgBVobwIu5Y8rv5jprDsaikwt3A/viewform",
  },
  {
    ruang: "B",
    csv: "https://docs.google.com/spreadsheets/d/1QNjKm-qY_jrqCj3A-QCRAM4dpIQdm-uCnGH0wYKFXeo/export?format=csv",
    link: "https://docs.google.com/forms/d/e/1FAIpQLSdBc3ixtxkyTNu382wSQA_kt-sTG25RUYU8Tpx2rDcNuEi78Q/viewform",
  },
  {
    ruang: "C",
    csv: "https://docs.google.com/spreadsheets/d/1Hi9G2YkanyiMj3ZXAIZiboEnnaCCKN6eLyl1-6oTVsk/export?format=csv",
    link: "https://docs.google.com/forms/d/e/1FAIpQLSfgecRSyfne9GBcwYUhfLCL_OWKQD-43dC4Up_IYe3ZSZE_OQ/viewform",
  },
  {
    ruang: "D",
    csv: "https://docs.google.com/spreadsheets/d/1ewvdJU8Jch7F-_X1SJxBf7_dlXBkTBjM-mScFhdVipQ/export?format=csv",
    link: "https://docs.google.com/forms/d/e/1FAIpQLSdcgbOIr4H7-OFr0l18I4mZACDEfT7Ar8H971i2KlYMhmmSxw/viewform",
  },
  {
    ruang: "E",
    csv: "https://docs.google.com/spreadsheets/d/1Nho5_f6nRnyjeIawx36nWga5I8qzUw3edRqfPSSMvug/export?format=csv",
    link: "https://docs.google.com/forms/d/e/1FAIpQLSe1avYrbayXert9WQIdAqu1PmrBnl44ZIP3b54phznGxg11Ag/viewform",
  },
  {
    ruang: "F",
    csv: "https://docs.google.com/spreadsheets/d/1RSEtasdLe3w_04QKKAThYFu9TF-WspqmtpSdmRePWJw/export?format=csv",
    link: "https://docs.google.com/forms/d/e/1FAIpQLSeB8cSY0Xdd9TMLJqofsXrZHAQYaFP8jy_hUV_wwJzNtEGL2Q/viewform",
  },
  {
    ruang: "LT3 Timur",
    csv: "https://docs.google.com/spreadsheets/d/1BG8w-CNg3LOqhgSmHL7Ualxh-c7gooMRbywunNbtUrk/export?format=csv",
    link: "https://docs.google.com/forms/d/e/1FAIpQLSdDa2fzvVL7j0wy1A7ZcegzXP8qB9JHMOoXpS_bwVECqeMvCg/viewform",
  },
];

const FILTER_MODE = {
  DATE: "date",
  ROOM: "room",
  ADVANCED: "advanced",
};

const ROOM_MODE_DEBOUNCE_MS = 3000;

let roomUsageData = {};
let activeLoadToken = 0;
let roomModeDebounceTimer = null;
let uiState = {
  mode: FILTER_MODE.DATE,
  selectedRooms: new Set(),
};

function fetchWithTimeout(url, timeoutMs = 20000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, { signal: controller.signal })
    .then((response) => {
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.text();
    })
    .catch((error) => {
      clearTimeout(timeoutId);
      throw error;
    });
}

function shiftDateString(dateStr, days) {
  if (!dateStr) return null;

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return null;

  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

function getDateModeLoadDate() {
  return shiftDateString(document.getElementById("dateFilter").value, -1);
}

function createRoomSectionSkeleton(ruang, linkPublik) {
  const section = document.createElement("section");
  section.className = "room-card neo-card";

  const header = document.createElement("div");
  header.className = "room-card__header";

  const headingWrap = document.createElement("div");

  const chip = document.createElement("span");
  chip.className = "room-chip";
  chip.textContent = `Ruang ${ruang}`;

  const title = document.createElement("h3");
  title.textContent = `Ruang ${ruang}`;

  headingWrap.appendChild(chip);
  headingWrap.appendChild(title);

  const link = document.createElement("a");
  link.href = linkPublik;
  link.target = "_blank";
  link.rel = "noreferrer noopener";
  link.className = "room-link";
  link.textContent = "[Link Form]";

  header.appendChild(headingWrap);
  header.appendChild(link);

  const body = document.createElement("div");
  body.className = "room-card__body room-card__body--loading";
  body.dataset.roomBody = "true";
  body.textContent = "Memuat data CSV...";

  section.appendChild(header);
  section.appendChild(body);

  return section;
}

function renderRoomError(section, ruang, message) {
  roomUsageData[ruang] = {
    data_penggunaan: null,
  };

  const body = section.querySelector("[data-room-body]");
  if (!body) return;

  body.className = "room-card__body room-card__body--error";
  body.textContent = message;
}

function renderEmptyState(container, message) {
  container.innerHTML = "";
  const section = document.createElement("section");
  section.className = "room-card neo-card";

  const body = document.createElement("div");
  body.className = "room-card__body room-empty";
  body.textContent = message;

  section.appendChild(body);
  container.appendChild(section);
}

function renderTableSection(section, ruang, rows, filters) {
  const body = section.querySelector("[data-room-body]");
  if (!body) return;

  roomUsageData[ruang] = {
    data_penggunaan: null,
  };

  const [headers = [], ...data] = rows;
  const filteredData = data.filter((row) => {
    if (!row || row.length === 0) return false;

    const normalized = normalizeDate(row[8]);
    if (!normalized) return false;

    const notes = row[11]?.toLowerCase() || "";
    const isRejected =
      notes && notes.includes("perhatikan") && !notes.includes("disetujui");
    if (isRejected) return false;

    if (filters.mode === FILTER_MODE.DATE) {
      return normalized === filters.selectedDate;
    }

    if (filters.mode === FILTER_MODE.ROOM) {
      return isFutureOrToday(normalized);
    }

    if (filters.mode === FILTER_MODE.ADVANCED) {
      if (filters.dateFrom && normalized < filters.dateFrom) return false;
      if (filters.dateTo && normalized > filters.dateTo) return false;
      return true;
    }

    return isFutureOrToday(normalized);
  });

  roomUsageData[ruang].data_penggunaan = filteredData;
  body.innerHTML = "";

  if (filteredData.length === 0) {
    body.className = "room-card__body room-empty";
    body.textContent = "Tidak ada data penggunaan.";
    return;
  }

  // Sort by date (row[8]) for ROOM and ADVANCED modes
  if (
    filters.mode === FILTER_MODE.ROOM ||
    filters.mode === FILTER_MODE.ADVANCED
  ) {
    filteredData.sort((a, b) => {
      const dateA = parseDateForSort(a[8]);
      const dateB = parseDateForSort(b[8]);
      return dateA - dateB;
    });
  }

  body.className = "room-card__body";

  const table = document.createElement("table");
  const selectedIndexes =
    filters.mode === FILTER_MODE.DATE
      ? [2, 4, 6, 7, 9, 11]
      : [2, 4, 6, 7, 8, 9, 11];

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  selectedIndexes.forEach((index) => {
    const th = document.createElement("th");
    th.textContent = headers[index]?.trim() || "";
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  filteredData.forEach((row) => {
    const tr = document.createElement("tr");
    selectedIndexes.forEach((index) => {
      const td = document.createElement("td");
      // Strip day name from date column (index 8) for ROOM and ADVANCED modes
      if (
        index === 8 &&
        (filters.mode === FILTER_MODE.ROOM ||
          filters.mode === FILTER_MODE.ADVANCED)
      ) {
        td.textContent = stripDayName(row[index]?.trim()) || "";
      } else {
        td.textContent = row[index]?.trim() || "";
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  body.appendChild(table);
}

function renderRoomCheckboxList(containerId, prefix) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  sources.forEach(({ ruang }, index) => {
    const label = document.createElement("label");
    label.className = "checkbox-option";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = ruang;
    input.dataset.roomValue = ruang;
    input.id = `${prefix}-${index}`;

    const text = document.createElement("span");
    text.textContent = `Ruang ${ruang}`;

    label.appendChild(input);
    label.appendChild(text);
    container.appendChild(label);
  });
}

function syncAllRoomCheckboxes() {
  const selectedRooms = uiState.selectedRooms;
  document.querySelectorAll("input[data-room-value]").forEach((input) => {
    input.checked = selectedRooms.has(input.dataset.roomValue);
  });
}

function readSelectedRoomsFromContainer(container) {
  const selectedRooms = new Set();
  if (!container) return selectedRooms;

  container
    .querySelectorAll("input[data-room-value]:checked")
    .forEach((input) => selectedRooms.add(input.dataset.roomValue));
  return selectedRooms;
}

function setMode(mode) {
  uiState.mode = mode;

  if (mode !== FILTER_MODE.ROOM) {
    clearRoomModeTimer();
  }

  const datePanel = document.getElementById("datePanel");
  const roomPanel = document.getElementById("roomPanel");
  const advancedPanel = document.getElementById("advancedPanel");

  if (datePanel) datePanel.hidden = mode !== FILTER_MODE.DATE;
  if (roomPanel) roomPanel.hidden = mode !== FILTER_MODE.ROOM;
  if (advancedPanel) advancedPanel.hidden = mode !== FILTER_MODE.ADVANCED;

  syncAllRoomCheckboxes();

  document.querySelectorAll(".mode-option").forEach((label) => {
    const input = label.querySelector('input[type="radio"]');
    label.classList.toggle(
      "mode-option--active",
      Boolean(input && input.checked),
    );
  });
}

function getSelectedRoomsArray() {
  return sources
    .filter(({ ruang }) => uiState.selectedRooms.has(ruang))
    .map(({ ruang }) => ruang);
}

function getSelectedRoomSources() {
  const selectedRooms = uiState.selectedRooms;
  return sources.filter(({ ruang }) => selectedRooms.has(ruang));
}

function clearRoomModeTimer() {
  if (roomModeDebounceTimer) {
    clearTimeout(roomModeDebounceTimer);
    roomModeDebounceTimer = null;
  }
}

function scheduleRoomModeLoad() {
  clearRoomModeTimer();
  roomModeDebounceTimer = setTimeout(() => {
    roomModeDebounceTimer = null;
    loadRoomModeData();
  }, ROOM_MODE_DEBOUNCE_MS);
}

function loadDateModeData() {
  clearRoomModeTimer();
  const dateInput = document.getElementById("dateFilter");
  const displayDate = dateInput.value;

  if (!displayDate) {
    return;
  }

  document.getElementById("dayName").textContent =
    getIndonesianDayName(displayDate);

  const selectedDate = getDateModeLoadDate();
  if (!selectedDate) {
    return;
  }

  loadAllRuang({
    mode: FILTER_MODE.DATE,
    selectedDate,
  });
}

function loadRoomModeData() {
  const selectedRooms = getSelectedRoomsArray();

  if (selectedRooms.length === 0) {
    renderEmptyState(
      document.getElementById("table-container"),
      "Pilih minimal satu ruang untuk menampilkan jadwal hari ini dan yang akan datang.",
    );
    return;
  }

  loadAllRuang({
    mode: FILTER_MODE.ROOM,
    selectedRooms,
  });
}

function loadAdvancedModeData() {
  const selectedRooms = getSelectedRoomsArray();
  const dateFrom = document.getElementById("dateFrom").value;
  const dateTo = document.getElementById("dateTo").value;

  if (selectedRooms.length === 0) {
    return;
  }

  if (!dateFrom || !dateTo) {
    return;
  }

  const normalizedFrom = dateFrom <= dateTo ? dateFrom : dateTo;
  const normalizedTo = dateFrom <= dateTo ? dateTo : dateFrom;

  loadAllRuang({
    mode: FILTER_MODE.ADVANCED,
    selectedRooms,
    dateFrom: normalizedFrom,
    dateTo: normalizedTo,
  });
}

function loadAllRuang(filters = {}) {
  const container = document.getElementById("table-container");
  const loadToken = ++activeLoadToken;
  roomUsageData = {};

  const mode = filters.mode || FILTER_MODE.DATE;
  const selectedRooms = Array.isArray(filters.selectedRooms)
    ? filters.selectedRooms
    : [];

  let roomsToLoad = sources;

  if (mode === FILTER_MODE.ROOM || mode === FILTER_MODE.ADVANCED) {
    const selectedRoomSet = new Set(selectedRooms);
    roomsToLoad = sources.filter(({ ruang }) => selectedRoomSet.has(ruang));
  }

  container.innerHTML = "";

  if (roomsToLoad.length === 0) {
    renderEmptyState(
      container,
      mode === FILTER_MODE.ADVANCED
        ? "Pilih ruang dan rentang tanggal untuk menampilkan data."
        : "Pilih minimal satu ruang untuk menampilkan data.",
    );
    return;
  }

  const tasks = roomsToLoad.map(({ ruang, csv, link }) => {
    const section = createRoomSectionSkeleton(ruang, link);
    container.appendChild(section);

    return fetchWithTimeout(csv)
      .then((csvText) => parseCSV(csvText))
      .then((rows) => {
        if (loadToken !== activeLoadToken) return null;
        renderTableSection(section, ruang, rows, filters);
        return null;
      })
      .catch((error) => {
        if (loadToken !== activeLoadToken) return null;
        renderRoomError(section, ruang, `Gagal memuat data ruang ${ruang}.`);
        console.error(error);
        return null;
      });
  });

  Promise.allSettled(tasks);
}

function navigateDate(direction) {
  const currentDateStr = document.getElementById("dateFilter").value;
  const currentDate = new Date(currentDateStr);

  if (direction === "prev") {
    currentDate.setDate(currentDate.getDate() - 1);
  } else if (direction === "next") {
    currentDate.setDate(currentDate.getDate() + 1);
  }

  document.getElementById("dateFilter").value = currentDate
    .toISOString()
    .split("T")[0];
  loadDateModeData();
}

function initModeSwitching() {
  document.querySelectorAll('input[name="filterMode"]').forEach((input) => {
    input.addEventListener("change", (event) => {
      const mode = event.target.value;
      setMode(mode);

      if (mode === FILTER_MODE.DATE) {
        loadDateModeData();
      } else if (mode === FILTER_MODE.ROOM) {
        loadRoomModeData();
      }
    });
  });
}

function initCheckboxListeners() {
  const checkboxHandler = (event) => {
    const panel = event.target.closest(".filter-panel");
    uiState.selectedRooms = readSelectedRoomsFromContainer(panel);
    syncAllRoomCheckboxes();

    if (uiState.mode === FILTER_MODE.ROOM) {
      scheduleRoomModeLoad();
    }
  };

  document.querySelectorAll("input[data-room-value]").forEach((input) => {
    input.addEventListener("change", checkboxHandler);
  });
}

function initDateListeners() {
  document.getElementById("dateFilter").addEventListener("change", () => {
    if (uiState.mode === FILTER_MODE.DATE) {
      loadDateModeData();
    }
  });

  document.getElementById("prevDate").addEventListener("click", () => {
    navigateDate("prev");
  });

  document.getElementById("nextDate").addEventListener("click", () => {
    navigateDate("next");
  });

  document
    .getElementById("applyAdvancedFilters")
    .addEventListener("click", () => {
      loadAdvancedModeData();
    });
}

window.addEventListener("DOMContentLoaded", () => {
  renderRoomCheckboxList("roomCheckboxList", "room-checkbox");
  renderRoomCheckboxList("advancedRoomCheckboxList", "advanced-room-checkbox");
  syncAllRoomCheckboxes();

  initModeSwitching();
  initCheckboxListeners();
  initDateListeners();

  const today = getCurrentDateUTC7();
  document.getElementById("dateFilter").value = today;
  document.getElementById("dayName").textContent = getIndonesianDayName(today);

  setMode(FILTER_MODE.DATE);
  loadDateModeData();
});
