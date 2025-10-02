
const express = require('express');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 8000;
const VM_URL = process.env.VM_URL || "http://localhost:4000";

app.use((req, res, next) => {
  const start = Date.now();
  console.log(`[REQ] ${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  console.log(`  Headers: ${JSON.stringify(req.headers)}`);

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[RES] ${new Date().toISOString()} ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
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
    const response = await axios.get(`${VM_URL}/vmfast`);
    res.json({ fromVm: response.data });
  } catch (err) {
    next(err);
  }
});

app.get('/slow', async (req, res, next) => {
  try {
    const response = await axios.get(`${VM_URL}/vmslow`);
    res.json({ fromVm: response.data });
  } catch (err) {
    next(err);
  }
});

app.get('/start', async (req, res) => {
   try {
      console.log('***** Calling VM slow API...');
      const response = await axios.get(`${VM_URL}/vmslow`);
      console.log('***** Completed VM slow API call...');
      res.json({ fromVm: response.data });
    } catch (err) {
      console.error(`***** ${err.message}`);
    }

  res.json({ status: '***** Started slow VM call' });
});

app.use((err, req, res, next) => {
  console.error(`[ERR] ${new Date().toISOString()} ${req.method} ${req.originalUrl} -> ${err.message}`);
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

app.listen(port, () => {
  console.log(`Node app Service  running on port ${port}`);
});
