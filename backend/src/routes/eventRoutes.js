const express = require('express');
const router = express.Router();
const { getEvents, createEvent, findEventBySlug, deleteEvent, getEventStats } = require('../mockStore');

// Get all events (Admin)
router.get('/', (req, res) => {
  res.json(getEvents());
});

// Create event (Admin)
router.post('/', (req, res) => {
  const { name, slug, password, coverImage, date } = req.body;
  if (!name || !slug) return res.status(400).json({ error: 'name and slug are required' });
  try {
    const newEvent = createEvent({ name, slug, password, coverImage, date });
    res.json(newEvent);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Get event by slug (Public/Client) — reads from mock store
router.get('/:slug', (req, res) => {
  const event = findEventBySlug(req.params.slug);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  
  const stats = getEventStats(event.id);
  // Return without exposing password, but include stats
  const { password, ...safe } = event;
  res.json({ ...safe, stats });
});

// Delete event (Admin)
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const success = deleteEvent(id);
  if (success) {
    res.json({ message: 'Event deleted successfully' });
  } else {
    res.status(404).json({ error: 'Event not found' });
  }
});

module.exports = router;

