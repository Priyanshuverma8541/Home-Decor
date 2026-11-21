const test = require("node:test");
const assert = require("node:assert/strict");
const ExplorerHRContact = require("../models/ExplorerHRContact");
const ExplorerHRActivity = require("../models/ExplorerHRActivity");
const { adminOnly } = require("../middleware/auth");

function response() {
  return { code: 200, body: null, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
}

test("HR contact requires source and contact basis provenance", () => {
  const contact = new ExplorerHRContact({ fullName: "Example Professional", createdBy: "507f1f77bcf86cd799439011", updatedBy: "507f1f77bcf86cd799439011" });
  const error = contact.validateSync();
  assert.ok(error.errors.source);
  assert.ok(error.errors.contactBasis);
  assert.ok(error.errors.contactBasisDetails);
});

test("HR contact rejects unsupported relationship states", () => {
  const contact = new ExplorerHRContact({ fullName: "Example Professional", source: "Public work profile", contactBasis: "public_professional_info", contactBasisDetails: "Publicly listed professional information", relationshipStatus: "hired", createdBy: "507f1f77bcf86cd799439011", updatedBy: "507f1f77bcf86cd799439011" });
  assert.match(contact.validateSync().errors.relationshipStatus.message, /is not a valid enum value/);
});

test("HR CRM private notes are excluded from default model selections", () => {
  assert.equal(ExplorerHRContact.schema.path("privateNotes").options.select, false);
});

test("HR contact activity requires an actor and summary and has no mutable status field", () => {
  const activity = new ExplorerHRActivity({ contactId: "507f1f77bcf86cd799439011", type: "note" });
  const error = activity.validateSync();
  assert.ok(error.errors.actorId);
  assert.ok(error.errors.summary);
  assert.equal(ExplorerHRActivity.schema.path("status"), undefined);
});

test("non-admin Savitri accounts cannot access the HR CRM guard", () => {
  let advanced = false;
  const res = response();
  adminOnly({ user: { role: "customer" } }, res, () => { advanced = true; });
  assert.equal(res.code, 403);
  assert.equal(res.body.message, "Admin access required");
  assert.equal(advanced, false);
});
