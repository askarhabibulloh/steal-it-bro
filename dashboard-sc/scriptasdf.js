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

let roomUsageData = {}; // Global variable to store all room data

function renderTableSection(ruang, linkPublik, rows, selectedDate = null) {
  const container = document.getElementById("table-container");

  roomUsageData[ruang] = {
    data_penggunaan: null,
  };

  const section = document.createElement("section");

  const heading = document.createElement("h3");
  heading.innerHTML = `Ruang ${ruang} <small><a href="${linkPublik}" target="_blank">[Link Form]</a></small>`;
  section.appendChild(heading);

  const table = document.createElement("table");
  const [headers, ...data] = rows;

  // const filteredData = data.filter((row) => {
  //   const normalized = normalizeDate(row[8]);
  //   if (!normalized) return false;

  //   if (selectedDate) {
  //     return normalized === selectedDate;
  //   } else {
  //     const todayStr = getCurrentDateUTC7();
  //     return normalized >= todayStr;
  //   }
  // });

  const filteredData = data.filter((row) => {
    const normalized = normalizeDate(row[8]);
    if (!normalized) return false;

    const notes = row[11]?.toLowerCase() || "";

    // Filter jika deskripsi tidak kosong dan mengandung "perhatikan"
    const isRejected =
      notes && notes.includes("perhatikan") && !notes.includes("disetujui");

    if (isRejected) return false;

    if (selectedDate) {
      return normalized === selectedDate;
    } else {
      const todayStr = getCurrentDateUTC7();
      return normalized >= todayStr;
    }
  });

  roomUsageData[ruang].data_penggunaan = filteredData;
  // roomUsageData[ruang].lastFilteredDate = selectedDate;

  if (filteredData.length === 0) {
    const info = document.createElement("p");
    info.textContent = "Tidak ada data sesuai filter.";
    section.appendChild(info);
    container.appendChild(section);
    return;
  }

  const selectedIndexes = [2, 4, 6, 7, 9, 11];
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  selectedIndexes.forEach((i) => {
    const th = document.createElement("th");
    th.textContent = headers[i]?.trim() || "";
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  filteredData.forEach((row) => {
    const tr = document.createElement("tr");
    selectedIndexes.forEach((i) => {
      const td = document.createElement("td");
      td.textContent = row[i]?.trim() || "";
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  section.appendChild(table);
  container.appendChild(section);
}

function getRoomUsageData() {
  return roomUsageData;
}

// function loadAllRuang(selectedDate = null) {
//   document.getElementById("table-container").innerHTML = "";

//   if (selectedDate) {
//     const displayDate = new Date(selectedDate);
//     displayDate.setDate(displayDate.getDate() + 1);
//     const dayName = getIndonesianDayName(displayDate);
//     document.getElementById("dayName").textContent = dayName;
//   }

//   sources.forEach(({ ruang, csv, link }) => {
//     fetch(csv)
//       .then((res) => res.text())
//       .then((csvText) => {
//         const rows = parseCSV(csvText);
//         renderTableSection(ruang, link, rows, selectedDate);
//       })
//       .catch((err) => {
//         const errorMsg = document.createElement("p");
//         errorMsg.innerHTML = `Gagal memuat data ruang ${ruang}.`;
//         document.getElementById("table-container").appendChild(errorMsg);
//         console.error(err);
//       });
//   });
// }

async function loadAllRuang(selectedDate = null) {
  document.getElementById("table-container").innerHTML = "";

  if (selectedDate) {
    const displayDate = new Date(selectedDate);
    displayDate.setDate(displayDate.getDate() + 1);
    const dayName = getIndonesianDayName(displayDate);
    document.getElementById("dayName").textContent = dayName;
  }

  for (const { ruang, csv, link } of sources) {
    try {
      const res = await fetch(csv);
      const csvText = await res.text();
      const rows = parseCSV(csvText);
      renderTableSection(ruang, link, rows, selectedDate);
    } catch (err) {
      const errorMsg = document.createElement("p");
      errorMsg.innerHTML = `Gagal memuat data ruang ${ruang}.`;
      document.getElementById("table-container").appendChild(errorMsg);
      console.error(err);
    }
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

document.getElementById("dateFilter").addEventListener("change", (e) => {
  const selectedDate = new Date(e.target.value);
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

  const dayName = getIndonesianDayName(today);
  document.getElementById("dayName").textContent = dayName;

  loadAllRuang(yesterdayStr);
});
