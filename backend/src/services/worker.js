const { Worker } = require('bullmq');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const prisma = require('../prismaClient');
const { connection } = require('./queue');
// axios or fetch used to send image to Python API
// const axios = require('axios');

const processImageWorker = new Worker('image-processing', async job => {
  const { photoId, filePath, eventId, categoryName } = job.data;
  
  console.log(`Processing job ${job.id} for photo ${photoId}`);

  try {
    const ext = path.extname(filePath);
    const basename = path.basename(filePath, ext);
    const directory = path.dirname(filePath);

    const mediumPath = path.join(directory, `${basename}-med${ext}`);
    const thumbPath = path.join(directory, `${basename}-thumb${ext}`);

    // Generate Medium format
    await sharp(filePath)
      .resize(1080)
      .jpeg({ quality: 80 })
      .toFile(mediumPath);

    // Generate Thumbnail format
    await sharp(filePath)
      .resize(400)
      .jpeg({ quality: 70 })
      .toFile(thumbPath);

    const mediumUrl = `/uploads/${eventId}/${categoryName}/${basename}-med${ext}`;
    const thumbnailUrl = `/uploads/${eventId}/${categoryName}/${basename}-thumb${ext}`;

    // Update the database with new URLs
    await prisma.photo.update({
      where: { id: photoId },
      data: { mediumUrl, thumbnailUrl }
    });

    const faceResponse = await fetch('http://localhost:8000/extract-faces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: filePath })
    });
    
    if (faceResponse.ok) {
      const data = await faceResponse.json();
      if (data && data.embeddings) {
        await prisma.photo.update({
           where: { id: photoId },
           data: { faceEmbeddings: data.embeddings }
        });
      }
    } else {
      console.error('Failed to extract faces:', await faceResponse.text());
    }

    console.log(`Job ${job.id} completed successfully`);
  } catch (err) {
    console.error(`Job ${job.id} failed:`, err);
    throw err; // BullMQ handles retries if configured
  }
}, { connection });

processImageWorker.on('completed', job => {
  console.log(`Job ${job.id} has completed!`);
});

processImageWorker.on('failed', (job, err) => {
  console.log(`Job ${job.id} has failed with ${err.message}`);
});
