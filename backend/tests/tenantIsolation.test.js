const test = require("node:test");
const assert = require("node:assert/strict");
const Product = require("../models/Product");
const Tenant = require("../models/Tenant");
const productController = require("../controllers/productController");
const tenantController = require("../controllers/tenantController");
const tenantAuth = require("../middleware/tenantAuth");
const ClientAdmin = require("../models/ClientAdmin");
const jwt = require("jsonwebtoken");

function response() {
  return { code: 200, body: null, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
}
function chain(rows) { return { sort() { return this; }, skip() { return this; }, limit() { return Promise.resolve(rows); }, populate() { return this; } }; }

test("Savitri public catalogue remains restricted to the legacy tenant", async () => {
  const oldFind = Product.find, oldCount = Product.countDocuments;
  let query;
  Product.find = (filter) => { query = filter; return chain([]); };
  Product.countDocuments = async () => 0;
  try {
    const res = response(); await productController.getAll({ query: {} }, res);
    assert.equal(query.tenantId, null);
    assert.equal(res.code, 200);
  } finally { Product.find = oldFind; Product.countDocuments = oldCount; }
});

test("Maa public catalogue can see its own and only explicitly shared legacy products", async () => {
  const oldTenantFind = Tenant.findOne, oldProductFind = Product.find, oldCount = Product.countDocuments;
  let query;
  Tenant.findOne = () => ({ select: async () => ({ _id: "tenant-a", sharedProductIds: ["legacy-1"] }) });
  Product.find = (filter) => { query = filter; return chain([]); };
  Product.countDocuments = async () => 0;
  try {
    const res = response(); await tenantController.publicProducts({ params: { slug: "maa" }, query: {} }, res);
    assert.deepEqual(query.$or, [{ tenantId: "tenant-a" }, { tenantId: null, _id: { $in: ["legacy-1"] } }]);
    assert.equal(query.isActive, true);
    assert.equal(res.code, 200);
  } finally { Tenant.findOne = oldTenantFind; Product.find = oldProductFind; Product.countDocuments = oldCount; }
});

test("Maa admin product listing is scoped to the authenticated tenant", async () => {
  const oldFind = Product.find; let query;
  Product.find = (filter) => { query = filter; return { sort: async () => [] }; };
  try {
    const res = response(); await tenantController.adminProducts({ tenant: { _id: "tenant-a" } }, res);
    assert.deepEqual(query, { tenantId: "tenant-a" });
  } finally { Product.find = oldFind; }
});

test("a client session cannot be replayed against another store slug", async () => {
  const oldAdminFind = ClientAdmin.findById, oldTenantFind = Tenant.findById, oldSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "tenant-isolation-test-secret";
  const account = { _id: "admin-a", tenantId: "tenant-a", sessionVersion: 4, modules: ["products"], isActive: true };
  ClientAdmin.findById = async () => account;
  Tenant.findById = async () => ({ _id: "tenant-a", slug: "store-a", status: "active" });
  const token = jwt.sign({ kind: "tenant-admin", clientAdminId: "admin-a", tenantId: "tenant-a", sessionVersion: 4 }, process.env.JWT_SECRET);
  try {
    let advanced = false;
    const res = response();
    await tenantAuth.tenantAdmin({ headers: { cookie: `maa_session=${token}` }, params: { slug: "store-b" } }, res, () => { advanced = true; });
    assert.equal(res.code, 403);
    assert.equal(advanced, false);
  } finally {
    ClientAdmin.findById = oldAdminFind; Tenant.findById = oldTenantFind;
    if (oldSecret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = oldSecret;
  }
});

test("disabled client modules are rejected by the server guard", () => {
  let advanced = false;
  const res = response();
  tenantAuth.module("orders")({ clientAdmin: { modules: ["products"] }, tenant: { modules: { orders: true } } }, res, () => { advanced = true; });
  assert.equal(res.code, 403);
  assert.equal(advanced, false);
});
