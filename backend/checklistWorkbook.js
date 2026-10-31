const ExcelJS = require("exceljs");

async function buildChecklistWorkbook(template, values = {}, evidence = {}) {
  const workbook = new ExcelJS.Workbook();
  if (template.source === "builtin") await workbook.xlsx.readFile(template.filePath);
  else await workbook.xlsx.load(template.workbook);
  if (template.source === "uploaded") {
    for (const sheet of workbook.worksheets) {
      for (let row = 2; row <= sheet.rowCount; row += 1) {
        const serial = sheet.getCell(row, 1).value;
        const description = sheet.getCell(row, 3).value;
        const numberedChecklistRow = serial != null && /^[0-9]+$/.test(String(serial)) && description != null;
        for (let col = 1; col <= sheet.columnCount; col += 1) {
          const cell = sheet.getCell(row, col);
          if (cell.value == null || cell.formula || cell.sharedFormula) continue;
          if (numberedChecklistRow && col <= 3) continue;
          if (typeof cell.value === "string" && cell.value.trim().endsWith(":")) continue;
          cell.value = null;
        }
      }
    }
  }
  const fields = template.mapping || template.fields || [];
  for (const field of fields) {
    const sheet = workbook.getWorksheet(field.sheet);
    if (sheet && field.row && field.col) sheet.getCell(field.row, field.col).value = null;
  }
  for (const sheet of workbook.worksheets) sheet._media = [];
  if (template.source === "uploaded") workbook.media = [];
  for (const [sheetName, files] of Object.entries(evidence || {})) {
    const sheet = workbook.getWorksheet(sheetName);
    if (!sheet || !(template.evidenceSheets || []).includes(sheetName)) continue;
    for (const [index, file] of files.entries()) {
      const extension = file.type === "image/png" ? "png" : file.type === "image/jpeg" ? "jpeg" : null;
      if (!extension) continue;
      const imageId = workbook.addImage({ buffer: Buffer.from(file.data, "base64"), extension });
      const top = index * 27;
      sheet.addImage(imageId, { tl: { col: 0, row: top }, br: { col: 8, row: top + 25 }, editAs: "oneCell" });
    }
  }
  for (const field of fields) {
    const value = values[field.id];
    const sheet = workbook.getWorksheet(field.sheet);
    if (sheet && field.row && field.col && value !== undefined && value !== "") {
      sheet.getCell(field.row, field.col).value = (field.prefix || "") + value;
    }
  }
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

module.exports = { buildChecklistWorkbook };
