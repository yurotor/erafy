require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const generateRouter = require('./routes/generate');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve generated output files (images + video)
app.use('/output', express.static(path.join(__dirname, 'output')));

// Routes
app.use('/api', generateRouter);

app.listen(PORT, () => {
  console.log(`Erafy backend running on http://localhost:${PORT}`);
});
