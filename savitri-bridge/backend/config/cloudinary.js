'use strict';
const { v2: cloudinary } = require('cloudinary');
const config = require('./env');

if (config.cloudinary.configured) {
  cloudinary.config({ cloud_name: config.cloudinary.cloudName, api_key: config.cloudinary.apiKey, api_secret: config.cloudinary.apiSecret, secure: true });
}
module.exports = cloudinary;
