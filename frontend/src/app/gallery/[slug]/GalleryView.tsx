"use client";

import { useState } from 'react';

export default function GalleryView({ categories }: { categories: any[] }) {
  const [activeTab, setActiveTab] = useState(categories[0]?.id);
  const [showFaceMatch, setShowFaceMatch] = useState(false);

  const activeCategory = categories.find(c => c.id === activeTab);

  return (
    <div className="space-y-8">
      {/* Utility Bar (Tabs & Face Match) */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 sticky top-0 bg-zinc-950/80 backdrop-blur-md py-4 z-30 border-b border-zinc-800/50 block">
        <div className="flex gap-4 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`px-6 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
                activeTab === cat.id 
                  ? 'bg-gold-500 text-zinc-950 shadow-[0_0_15px_rgba(212,175,55,0.4)]' 
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <button 
          onClick={() => setShowFaceMatch(true)}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-zinc-900 border border-gold-500/30 hover:border-gold-500 text-gold-200 px-6 py-2.5 rounded-full transition-all text-sm font-medium"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Find My Photos
        </button>
      </div>

      {/* Masonry Grid Placeholder */}
      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        {activeCategory?.photos?.map((photo: any, index: number) => (
          <div key={photo.id} className="relative group overflow-hidden rounded-lg bg-zinc-900 break-inside-avoid">
             {/* Using a solid color for mock until real images exist */}
             <div 
                className="w-full bg-zinc-800"
                style={{ height: `${Math.floor(Math.random() * 200) + 200}px` }} 
             />
             <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                <button className="p-2 bg-white/10 hover:bg-gold-500 hover:text-black rounded-full backdrop-blur-md text-white transition-all">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                </button>
                <button className="p-2 bg-white/10 hover:bg-gold-500 hover:text-black rounded-full backdrop-blur-md text-white transition-all">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </button>
             </div>
          </div>
        ))}
      </div>

      {/* Face Match Modal overlay */}
      {showFaceMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
           <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-serif text-gold-200">AI Face Search</h3>
                  <button onClick={() => setShowFaceMatch(false)} className="text-zinc-500 hover:text-white">✕</button>
                </div>
                
                <div className="border-2 border-dashed border-zinc-800 hover:border-gold-500/50 transition-colors rounded-xl p-8 text-center cursor-pointer group bg-zinc-900/50">
                   <div className="w-16 h-16 rounded-full bg-zinc-800 group-hover:bg-gold-500/20 mx-auto flex items-center justify-center mb-4 transition-colors">
                     <svg className="w-8 h-8 text-zinc-400 group-hover:text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                   </div>
                   <p className="text-zinc-300 font-medium">Take a Selfie or Upload</p>
                   <p className="text-zinc-500 text-sm mt-2">We will scan the gallery for matching faces.</p>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
