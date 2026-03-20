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

let roomUsageData = {};
let activeLoadToken = 0;

function setLoadStatus(message) {
  const status = document.getElementById("load-status");
  if (status) {
    status.textContent = message;
  }
}

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

function renderTableSection(section, ruang, rows, selectedDate = null) {
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

    if (selectedDate) {
      return normalized === selectedDate;
    }

    const todayStr = getCurrentDateUTC7();
    return normalized >= todayStr;
  });

  roomUsageData[ruang].data_penggunaan = filteredData;
  body.innerHTML = "";

  if (filteredData.length === 0) {
    body.className = "room-card__body room-empty";
    body.textContent = "Tidak ada data sesuai filter.";
    return;
  }

  body.className = "room-card__body";

  const table = document.createElement("table");
  const selectedIndexes = [2, 4, 6, 7, 9, 11];

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
      td.textContent = row[index]?.trim() || "";
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  body.appendChild(table);
}

function getRoomUsageData() {
  return roomUsageData;
}

async function loadAllRuang(selectedDate = null) {
  const container = document.getElementById("table-container");
  container.innerHTML = "";
  roomUsageData = {};

  const loadToken = ++activeLoadToken;
  setLoadStatus("Memuat CSV ruang secara paralel...");

  if (selectedDate) {
    const displayDate = new Date(selectedDate);
    displayDate.setDate(displayDate.getDate() + 1);
    document.getElementById("dayName").textContent =
      getIndonesianDayName(displayDate);
  }

  const tasks = sources.map(({ ruang, csv, link }) => {
    const section = createRoomSectionSkeleton(ruang, link);
    container.appendChild(section);

    return fetchWithTimeout(csv)
      .then((csvText) => parseCSV(csvText))
      .then((rows) => {
        if (loadToken !== activeLoadToken) return null;
        renderTableSection(section, ruang, rows, selectedDate);
        return null;
      })
      .catch((error) => {
        if (loadToken !== activeLoadToken) return null;
        renderRoomError(section, ruang, `Gagal memuat data ruang ${ruang}.`);
        console.error(error);
        return null;
      });
  });

  await Promise.allSettled(tasks);

  if (loadToken === activeLoadToken) {
    setLoadStatus("Semua ruang sudah dimuat.");
  }
}

function navigateDate(direction) {
  const currentDateStr = document.getElementById("dateFilter").value;
  const currentDate = new Date(currentDateStr);

  if (direction === "prev") {
    currentDate.setDate(currentDate.getDate() - 1);
  } else if (direction === "next") {
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const newDateStr = currentDate.toISOString().split("T")[0];
  document.getElementById("dateFilter").value = newDateStr;

  const adjustedDate = new Date(newDateStr);
  adjustedDate.setDate(adjustedDate.getDate() - 1);
  const adjustedDateStr = adjustedDate.toISOString().split("T")[0];

  loadAllRuang(adjustedDateStr);
}

document.getElementById("dateFilter").addEventListener("change", (event) => {
  const selectedDate = new Date(event.target.value);
  selectedDate.setDate(selectedDate.getDate() - 1);

  const adjustedDateStr = selectedDate.toISOString().split("T")[0];
  loadAllRuang(adjustedDateStr);
});

document.getElementById("prevDate").addEventListener("click", () => {
  navigateDate("prev");
});

document.getElementById("nextDate").addEventListener("click", () => {
  navigateDate("next");
});

window.addEventListener("DOMContentLoaded", () => {
  const today = getCurrentDateUTC7();
  document.getElementById("dateFilter").value = today;

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  document.getElementById("dayName").textContent = getIndonesianDayName(today);

  loadAllRuang(yesterdayStr);
});
