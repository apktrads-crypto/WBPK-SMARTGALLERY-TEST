const { Queue } = require('bullmq');

// Initialize the queue to connect to Redis
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
};

const imageQueue = new Queue('image-processing', { connection });

module.exports = {
  imageQueue,
  connection
};
