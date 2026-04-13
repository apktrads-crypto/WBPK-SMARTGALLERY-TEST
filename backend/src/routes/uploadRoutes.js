const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const prisma = require('../prismaClient');
const { imageQueue } = require('../services/queue');
const { addPhotosToCategory, findEventById } = require('../mockStore');

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    // Expected to receive eventId and categoryId in req.body
    const { eventId, categoryName } = req.body;
    if (!eventId || !categoryName) return cb(new Error('Missing eventId or categoryName'));

    const uploadPath = path.join(__dirname, '../../../uploads', eventId, categoryName);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { eventId, categoryName } = req.body;

    // Find or create category
    let category = await prisma.category.findUnique({
      where: { eventId_name: { eventId, name: categoryName } }
    });
    if (!category) {
      category = await prisma.category.create({
        data: { eventId, name: categoryName }
      });
    }

    const relativeUrl = `/uploads/${eventId}/${categoryName}/${req.file.filename}`;

    // Create Photo Record
    const photo = await prisma.photo.create({
      data: {
        categoryId: category.id,
        originalUrl: relativeUrl,
      }
    });

    // Add to BullMQ for thumbnail generation & face extraction
    imageQueue.add('process-image', { photoId: photo.id, filePath: req.file.path, eventId, categoryName });

    res.json(photo);
  } catch (error) {
    console.warn("Database or Queue error, falling back to in-memory mock store:", error.message);
    
    const { eventId, categoryName } = req.body;
    const relativeUrl = `/uploads/${eventId}/${categoryName}/${req.file.filename}`;
    
    // Add to mock store so gallery sees it immediately
    const result = addPhotosToCategory(eventId, categoryName, [{ 
      url: relativeUrl, 
      source: 'local_upload' 
    }]);

    if (result) {
      res.json(result[0]);
    } else {
      res.status(500).json({ error: 'Upload failed both DB and Mock modes.' });
    }
  }
});

module.exports = router;
