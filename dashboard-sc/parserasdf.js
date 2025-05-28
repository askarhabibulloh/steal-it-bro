function parseCSV(csvText) {
  const rows = csvText.split(/\r?\n/);

  return rows.map((row) => {
    let fields = [];
    let currentField = "";
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const char = row[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        fields.push(currentField);
        currentField = "";
      } else {
        currentField += char;
      }
    }

    fields.push(currentField);

    return fields.map((field) => {
      if (field.startsWith('"') && field.endsWith('"')) {
        return field.slice(1, -1);
      }
      return field;
    });
  });
}
