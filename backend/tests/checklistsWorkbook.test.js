const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const ExcelJS = require("exceljs");
const registry = require("../templates/sfmc/registry.json");
const { buildChecklistWorkbook } = require("../checklistWorkbook");

test("built-in mappings have unique IDs and point to existing workbook cells", async () => {
  assert.equal(registry.length, 3);
  for (const template of registry) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(path.join(__dirname, "../templates/sfmc", template.templateFile));
    assert.deepEqual(workbook.worksheets.map(s => s.name), template.worksheets);
    assert.equal(new Set(template.fields.map(f => f.id)).size, template.fields.length);
    for (const field of template.fields) {
      const sheet = workbook.getWorksheet(field.sheet);
      assert.ok(sheet, `${template.id}:${field.id} sheet exists`);
      assert.ok(sheet.getCell(field.row, field.col), `${template.id}:${field.id} cell exists`);
    }
    for (const sheet of workbook.worksheets) assert.equal(sheet.getImages().length, 0);
  }
});

test("exports preserve workbook structure and descriptions, and leave untouched fields blank", async () => {
  for (const template of registry) {
    const meta = { ...template, templateId: template.id, mapping: template.fields, source: "builtin", filePath: path.join(__dirname, "../templates/sfmc", template.templateFile) };
    const field = template.fields.find(f => f.sheet !== "Peer Review" && f.type === "textarea");
    assert.ok(field);
    const original = new ExcelJS.Workbook(); await original.xlsx.readFile(meta.filePath);
    const originalNames = original.worksheets.map(s => s.name);
    const originalDescription = original.getWorksheet(field.sheet).getCell(field.row, 3).value;
    const output = await buildChecklistWorkbook(meta, { [field.id]: "Manually entered QA note" });
    const exported = new ExcelJS.Workbook(); await exported.xlsx.load(output);
    assert.deepEqual(exported.worksheets.map(s => s.name), originalNames);
    for (let i = 0; i < original.worksheets.length; i += 1) {
      const before = original.worksheets[i], after = exported.worksheets[i];
      assert.deepEqual(after.model.merges, before.model.merges);
      assert.equal(after.getRow(1).height, before.getRow(1).height);
      const widths = sheet => Array.from({ length: sheet.columnCount }, (_v, col) => sheet.getColumn(col + 1).width);
      assert.deepEqual(widths(after), widths(before));
      assert.deepEqual(after.dataValidations.model || [], before.dataValidations.model || []);
    }
    assert.equal(exported.getWorksheet(field.sheet).getCell(field.row, 3).value, originalDescription);
    assert.equal(exported.getWorksheet(field.sheet).getCell(field.row, field.col).value, "Manually entered QA note");
    const blank = template.fields.find(f => f.sheet === field.sheet && f.id !== field.id);
    assert.equal(exported.getWorksheet(blank.sheet).getCell(blank.row, blank.col).value, null);
    assert.equal(exported.getWorksheet(field.sheet).getCell(field.row, field.col).styleId, original.getWorksheet(field.sheet).getCell(field.row, field.col).styleId);
  }
});

test("uploaded template exports strip sample inputs and screenshots but retain formulas and configured labels", async () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("QA");
  sheet.addRow(["No", "Section", "Description", "Status", "Developer Comments"]);
  sheet.addRow([1, "Email", "Check link", "Approved sample", "Private sample comment"]);
  sheet.getCell("F2").value = { formula: "1+1" };
  const image = workbook.addImage({ base64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/pWQAAAAASUVORK5CYII=", extension: "png" });
  sheet.addImage(image, "A4:B5");
  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
  const template = { source: "uploaded", workbook: buffer, mapping: [{ id: "status", sheet: "QA", row: 2, col: 4 }, { id: "note", sheet: "QA", row: 2, col: 5 }] };
  const bytes = await buildChecklistWorkbook(template, { status: "Yes" });
  const exported = new ExcelJS.Workbook(); await exported.xlsx.load(bytes);
  assert.equal(exported.getWorksheet("QA").getCell("D2").value, "Yes");
  assert.equal(exported.getWorksheet("QA").getCell("E2").value, null);
  assert.equal(exported.getWorksheet("QA").getCell("F2").formula, "1+1");
  assert.equal(exported.getWorksheet("QA").getCell("C2").value, "Check link");
  assert.equal(exported.getWorksheet("QA").getImages().length, 0);
});

test("a user screenshot is embedded in the configured workbook evidence sheet", async () => {
  const template = registry.find(t => t.id === "email-qa");
  const meta = { ...template, templateId: template.id, mapping: template.fields, source: "builtin", filePath: path.join(__dirname, "../templates/sfmc", template.templateFile) };
  const png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/pWQAAAAASUVORK5CYII=";
  const bytes = await buildChecklistWorkbook(meta, {}, { "Email Snap": [{ type: "image/png", data: png }] });
  const output = new ExcelJS.Workbook(); await output.xlsx.load(bytes);
  assert.equal(output.getWorksheet("Email Snap").getImages().length, 1);
  assert.equal(output.getWorksheet("Creative QA").getImages().length, 0);
});
