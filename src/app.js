import express from 'express';

const app = express();

app.get('/', (req, res) => {
  res.send('Acquisitions Service is running');
});

export default app;
