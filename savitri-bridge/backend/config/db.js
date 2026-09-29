'use strict';
const mongoose = require('mongoose');
const config = require('./env');

mongoose.set('strictQuery', true);
mongoose.set('sanitizeFilter', true); // neutralises $-operator injection in filters built from user input

async function connectDB() {
  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 15000 });
  console.log('[db] MongoDB connected');
}
module.exports = { connectDB };
