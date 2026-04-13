/**
 * In-memory mock store shared across routes (used when DB/Docker is offline).
 * Replace these arrays with real Prisma calls once Docker/Postgres is running.
 */

const mockEvents = [
  {
    id: "test-event-id",
    name: "Test Wedding",
    slug: "PK-TEST",
    password: "1234",
    coverImage: null,
    date: new Date(),
    categories: []
  }
];

function getEvents() {
  return mockEvents;
}

function createEvent({ name, slug, password, coverImage, date }) {
  const newEvent = {
    id: Math.random().toString(36).substr(2, 9),
    name,
    slug,
    password,
    coverImage: coverImage || null,
    date: date ? new Date(date) : null,
    categories: [],
  };
  mockEvents.push(newEvent);
  return newEvent;
}

function findEventBySlug(slug) {
  return mockEvents.find((e) => e.slug === slug) || null;
}

function deleteEvent(id) {
  const index = mockEvents.findIndex((e) => e.id === id);
  if (index !== -1) {
    mockEvents.splice(index, 1);
    return true;
  }
  return false;
}

function findEventById(id) {
  return mockEvents.find((e) => e.id === id) || null;
}

function addCategoryToEvent(eventId, categoryName) {
  const event = findEventById(eventId);
  if (!event) return null;

  let category = event.categories.find((c) => c.name === categoryName);
  if (!category) {
    category = {
      id: Math.random().toString(36).substr(2, 9),
      name: categoryName,
      photos: [],
    };
    event.categories.push(category);
  }
  return category;
}

function addPhotosToCategory(eventId, categoryName, photos) {
  const category = addCategoryToEvent(eventId, categoryName);
  if (!category) return null;
  const newPhotos = photos.map((p) => ({
    id: Math.random().toString(36).substr(2, 9),
    originalUrl: p.url,
    thumbnailUrl: p.url, // Drive images serve directly
    source: p.source || 'google_drive',
    driveFileId: p.fileId || null,
  }));
  category.photos.push(...newPhotos);
  return newPhotos;
}

function getEventStats(id) {
  const event = findEventById(id);
  if (!event) return { categories: 0, photos: 0 };
  const categoriesCount = event.categories.length;
  const photosCount = event.categories.reduce((acc, cat) => acc + cat.photos.length, 0);
  return { categories: categoriesCount, photos: photosCount };
}

module.exports = {
  getEvents,
  createEvent,
  findEventBySlug,
  findEventById,
  deleteEvent,
  addPhotosToCategory,
  addCategoryToEvent,
  getEventStats,
};
