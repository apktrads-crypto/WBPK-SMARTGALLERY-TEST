require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Basic route
app.get('/', (req, res) => {
  res.send('WeddingsByPK Smart Gallery API Running');
});

// Import Routes
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const driveRoutes = require('./routes/driveRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/drive', driveRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
