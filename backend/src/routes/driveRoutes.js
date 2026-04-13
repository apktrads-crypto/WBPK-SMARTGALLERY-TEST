const express = require('express');
const router = express.Router();
const { findEventById, addPhotosToCategory } = require('../mockStore');

/**
 * Extracts Google Drive folder ID from various URL formats:
 *  - https://drive.google.com/drive/folders/FOLDER_ID
 *  - https://drive.google.com/drive/folders/FOLDER_ID?usp=sharing
 */
function extractFolderId(url) {
  const match = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * Builds a direct-view image URL from a Google Drive file ID.
 * Works for publicly shared files/folders.
 */
function driveImageUrl(fileId) {
  return `https://lh3.googleusercontent.com/d/${fileId}`;
}

/**
 * POST /api/drive/import
 * Body: { eventId, categoryName, driveUrl, apiKey }
 *
 * Calls the Google Drive API to list all image files in the specified folder,
 * then stores them in the mock event store so the gallery can render them.
 */
router.post('/import', async (req, res) => {
  const { eventId, categoryName, driveUrl, apiKey } = req.body;

  if (!eventId || !categoryName || !driveUrl) {
    return res.status(400).json({ error: 'eventId, categoryName and driveUrl are required.' });
  }

  const event = findEventById(eventId);
  if (!event) {
    return res.status(404).json({ error: 'Event not found.' });
  }

  const folderId = extractFolderId(driveUrl);
  if (!folderId) {
    return res.status(400).json({ error: 'Invalid Google Drive folder URL. Please paste a folder link like: https://drive.google.com/drive/folders/...' });
  }

  // Use provided API key, or fall back to env var
  const key = apiKey || process.env.GOOGLE_DRIVE_API_KEY;
  if (!key) {
    return res.status(400).json({ error: 'Google Drive API key is missing. Add GOOGLE_DRIVE_API_KEY to your .env file.' });
  }

  try {
    // Fetch file list from Google Drive API v3
    const query = encodeURIComponent(`'${folderId}' in parents and mimeType contains 'image/' and trashed = false`);
    const fields = encodeURIComponent('files(id,name,mimeType,thumbnailLink)');
    const apiUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&pageSize=100&key=${key}`;

    const driveRes = await fetch(apiUrl);
    const driveData = await driveRes.json();

    if (!driveRes.ok) {
      console.error('Drive API error:', driveData);
      return res.status(502).json({
        error: driveData.error?.message || 'Failed to fetch files from Google Drive.',
        hint: 'Make sure the folder is shared publicly ("Anyone with the link can view") and your API key has Drive API enabled.'
      });
    }

    const files = driveData.files || [];
    if (files.length === 0) {
      return res.status(200).json({ message: 'No images found in this Google Drive folder.', count: 0, photos: [] });
    }

    // Map each file to a photo object
    const photos = files.map((file) => ({
      fileId: file.id,
      url: driveImageUrl(file.id),
    }));

    const addedPhotos = addPhotosToCategory(eventId, categoryName, photos);

    return res.json({
      message: `Successfully imported ${addedPhotos.length} photos from Google Drive.`,
      count: addedPhotos.length,
      photos: addedPhotos,
    });
  } catch (err) {
    console.error('Drive import error:', err);
    return res.status(500).json({ error: 'Server error while importing from Google Drive.' });
  }
});

module.exports = router;
