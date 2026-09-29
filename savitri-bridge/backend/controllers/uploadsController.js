'use strict';
const asyncHandler = require('../utils/asyncHandler');
const { uploadImage } = require('../services/uploadService');
const { audit } = require('../services/auditService');

exports.image = asyncHandler(async (req, res) => {
  const kind = ['icons', 'badges', 'images'].includes(req.query.kind) ? req.query.kind : 'images';
  const r = await uploadImage(req.file, kind);
  await audit(req, 'MEDIA_UPLOADED', 'Media', r.url, { kind, bytes: r.bytes });
  res.status(201).json({ success: true, data: r });
});
