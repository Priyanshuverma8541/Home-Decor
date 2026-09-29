'use strict';
function parsePage(query, sortable = [], defaultSort = '-createdAt') {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  let sort = String(query.sort || defaultSort);
  const field = sort.replace(/^-/, '');
  if (sortable.length && !sortable.includes(field)) sort = defaultSort;
  return { page, limit, skip: (page - 1) * limit, sort };
}
const pageMeta = (p, total) => ({ page: p.page, limit: p.limit, total, pages: Math.max(1, Math.ceil(total / p.limit)) });
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 100);
module.exports = { parsePage, pageMeta, escapeRegex };
