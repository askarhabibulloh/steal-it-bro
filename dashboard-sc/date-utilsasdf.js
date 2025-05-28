function normalizeDate(input) {
  if (!input) return null;

  let parsed = Date.parse(input);
  if (!isNaN(parsed)) {
    return new Date(parsed).toISOString().split("T")[0];
  }

  const parts = input.split("/");
  if (parts.length === 3) {
    const [month, day, year] = parts.map((p) => parseInt(p));
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      const date = new Date(year, month - 1, day);
      return date.toISOString().split("T")[0];
    }
  }

  return null;
}

function isFutureOrToday(dateStr) {
  const normalized = normalizeDate(dateStr);
  if (!normalized) return false;

  const input = new Date(normalized);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return input >= now;
}

function getIndonesianDayName(dateStr) {
  const date = new Date(dateStr);

  const utc7Date = new Date(date.getTime() + 7 * 60 * 60 * 1000);

  const dayNames = [
    "Minggu",
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
  ];

  return dayNames[utc7Date.getDay()];
}

function formatDateUTC7(dateStr) {
  const date = new Date(dateStr);

  const utc7Date = new Date(date.getTime() + 7 * 60 * 60 * 1000);

  const day = utc7Date.getDate().toString().padStart(2, "0");
  const month = (utc7Date.getMonth() + 1).toString().padStart(2, "0");
  const year = utc7Date.getFullYear();

  return `${year}-${month}-${day}`;
}

function getCurrentDateUTC7() {
  const now = new Date();
  const utc7Date = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return utc7Date.toISOString().split("T")[0];
}
