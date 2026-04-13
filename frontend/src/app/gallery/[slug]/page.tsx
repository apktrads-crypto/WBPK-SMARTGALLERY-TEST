import { Suspense } from 'react';
import GalleryView from './GalleryView';

async function fetchEvent(slug: string) {
  try {
    const res = await fetch(`http://localhost:5000/api/events/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function GalleryPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const resolvedParams = await params;
  const event = await fetchEvent(resolvedParams.slug);

  if (!event) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-gold-400 tracking-widest uppercase text-xs">Gallery Not Found</p>
          <h1 className="text-4xl font-serif text-white">This event doesn&apos;t exist yet.</h1>
          <p className="text-zinc-500 text-sm">Ask your photographer to share the correct gallery link.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Hero Section */}
      <div className="relative h-[40vh] md:h-[50vh] w-full bg-zinc-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent z-10" />
        <div className="absolute bottom-8 left-8 z-20 space-y-2">
          <p className="text-gold-400 font-medium tracking-widest uppercase text-xs">Client Gallery</p>
          <h1 className="text-4xl md:text-6xl font-serif text-white">{event.name}</h1>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-12">
        <Suspense fallback={<div className="text-gold-500 animate-pulse">Loading gallery...</div>}>
           <GalleryView categories={event.categories} />
        </Suspense>
      </div>
    </div>
  );
}
