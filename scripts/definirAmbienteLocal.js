const path = require('node:path');

process.env.CRM_DATA_DIR = process.env.CRM_DATA_DIR || path.resolve(__dirname, '..', 'data');
process.env.PORT = process.env.PORT || '3101';
process.env.PUBLIC_API_BASE_URL = process.env.PUBLIC_API_BASE_URL || `http://127.0.0.1:${process.env.PORT}`;
