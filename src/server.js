import app from './app.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Acquisitions Service listening at http://localhost:${PORT}`);
});
