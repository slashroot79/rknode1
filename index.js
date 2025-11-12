
const express = require('express');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 8000;
const VM_URL = process.env.VM_URL || "http://localhost:4000";

app.use((req, res, next) => {
  const start = Date.now();
  console.log(`[REQ] ${new Date().toISOString()} ${req.method} to ${req.originalUrl}`);

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[res] ${new Date().toISOString()} from ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
    console.log("****************************************************************")
  });

  next();
});

app.get('/', async (req, res, next) => {
  try {
    res.json({ message: 'App Service root url' });
  } catch (err) {
    next(err);
  }
});

app.get('/fast', async (req, res, next) => {
  try {
    console.log('Upstream URL: /vmfast');
    const response = await axios.get(`${VM_URL}/vmfast`);
    res.json({ fromVm: response.data });
  } catch (err) {
    next(err);
  }
});

app.get('/slow', async (req, res, next) => {
  try {
    console.log('Upstream URL: /vmslow');
    const response = await axios.get(`${VM_URL}/vmslow`);
    console.log(`***** Completed VM slow API call. Response: ${JSON.stringify(response.data)}`);
    res.json({ fromVm: response.data });
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  console.error(`[ERR] ${new Date().toISOString()} ${req.method} ${req.originalUrl} -> ${err.message}`);
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

app.listen(port, () => {
  console.log(`Node app Service  running on port ${port}`);
});
