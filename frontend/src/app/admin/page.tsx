"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminUploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [adminUser, setAdminUser] = useState('');
  const [activeTab, setActiveTab] = useState<'events' | 'uploads'>('events');
  const [events, setEvents] = useState<any[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<{success: number; failed: number} | null>(null);

  // New Event Form State
  const [newEventName, setNewEventName] = useState('');
  const [newEventSlug, setNewEventSlug] = useState('');
  const [newEventPasskey, setNewEventPasskey] = useState('');

  // Upload State
  const [selectedEventId, setSelectedEventId] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [googleDriveLink, setGoogleDriveLink] = useState('');
  const [driveApiKey, setDriveApiKey] = useState('');
  const [driveImporting, setDriveImporting] = useState(false);
  const [driveResult, setDriveResult] = useState<{count?: number; error?: string} | null>(null);
  
  useEffect(() => {
    const token = localStorage.getItem('wbpk_admin_token');
    if (!token) {
      router.replace('/admin/login');
    } else {
      setAdminUser(localStorage.getItem('wbpk_admin_user') || 'WBPK');
      setAuthChecked(true);
      fetchEvents();
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('wbpk_admin_token');
    localStorage.removeItem('wbpk_admin_user');
    router.replace('/admin/login');
  };

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/events`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
        if (data.length > 0) {
          setSelectedEventId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch events", err);
    }
    setIsLoading(false);
  };

  const activeEvent = events.find(e => e.id === selectedEventId);

  const handleDriveImport = async () => {
    if (!selectedEventId || !newCategoryName || !googleDriveLink || googleDriveLink === 'pending') return;
    setDriveImporting(true);
    setDriveResult(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/drive/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: selectedEventId,
          categoryName: newCategoryName,
          driveUrl: googleDriveLink,
          apiKey: driveApiKey || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setDriveResult({ count: data.count });
        setGoogleDriveLink('');
        setNewCategoryName('');
      } else {
        setDriveResult({ error: data.error || data.hint || 'Import failed.' });
      }
    } catch {
      setDriveResult({ error: 'Could not reach the backend server.' });
    }
    setDriveImporting(false);
  };

  const handleUpload = async () => {
    if (!selectedEventId || !newCategoryName || files.length === 0) return;
    setUploading(true);
    setUploadProgress(0);
    setUploadResult(null);
    let success = 0;
    let failed = 0;
    for (let i = 0; i < files.length; i++) {
      const formData = new FormData();
      formData.append('file', files[i]);
      formData.append('eventId', selectedEventId);
      formData.append('categoryName', newCategoryName);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/upload`, {
          method: 'POST',
          body: formData,
        });
        if (res.ok) success++; else failed++;
      } catch { failed++; }
      setUploadProgress(Math.round(((i + 1) / files.length) * 100));
    }
    setUploadResult({ success, failed });
    setFiles([]);
    setUploading(false);
  };

  const handleDeleteEvent = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/events/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchEvents();
      } else {
        alert("Failed to delete event");
      }
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newEventName,
          slug: newEventSlug,
          password: newEventPasskey
        })
      });
      if (res.ok) {
        setNewEventName('');
        setNewEventSlug('');
        setNewEventPasskey('');
        fetchEvents();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to create event");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFiles([...files, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const copyShareLink = (slug: string, passkey: string) => {
    const url = `${window.location.origin}/gallery/${slug}`;
    const text = `Here is your private gallery link:\n${url}\nPasskey: ${passkey}`;
    navigator.clipboard.writeText(text);
    alert('Share text copied to clipboard!');
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <svg className="animate-spin w-8 h-8 text-gold-500 mx-auto" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <p className="text-zinc-600 text-sm">Verifying session…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-8 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-gold-500 tracking-widest uppercase font-medium">WeddingsByPK Admin</p>
            <h1 className="text-3xl font-serif text-white">Dashboard</h1>
            <p className="text-zinc-500 text-sm">Welcome back, <span className="text-zinc-300 font-medium">{adminUser}</span></p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white border border-zinc-800 hover:border-zinc-700 rounded-lg px-4 py-2 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Logout
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-6 border-b border-zinc-800/80">
          <button 
            onClick={() => setActiveTab('events')} 
            className={`pb-3 text-sm font-medium tracking-wide transition-all ${
              activeTab === 'events' ? 'text-gold-400 border-b-2 border-gold-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Manage Events
          </button>
          <button 
            onClick={() => setActiveTab('uploads')} 
            className={`pb-3 text-sm font-medium tracking-wide transition-all ${
              activeTab === 'uploads' ? 'text-gold-400 border-b-2 border-gold-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Bulk Upload
          </button>
        </div>

        {activeTab === 'events' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Create Event Form */}
            <div className="lg:col-span-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl h-fit">
              <h2 className="text-xl font-medium text-white mb-6">Create New Event</h2>
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider pl-1">Couple / Event Name</label>
                  <input 
                    required
                    value={newEventName}
                    onChange={(e) => {
                       setNewEventName(e.target.value);
                       if(!newEventSlug) {
                          setNewEventSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
                       }
                    }}
                    placeholder="e.g. Rajesh & Priya"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-gold-500/50" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider pl-1">Event Code (Slug)</label>
                  <input 
                    required
                    value={newEventSlug}
                    onChange={(e) => setNewEventSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="e.g. rajesh-priya"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-gold-500/50" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider pl-1">Private Passkey</label>
                  <div className="relative">
                    <input 
                      required
                      value={newEventPasskey}
                      onChange={(e) => setNewEventPasskey(e.target.value)}
                      placeholder="e.g. 54321"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-gold-500/50" 
                    />
                    <button 
                      type="button"
                      onClick={() => setNewEventPasskey(Math.floor(10000 + Math.random() * 90000).toString())}
                      className="absolute right-3 top-3 text-xs text-gold-500 hover:text-gold-400 font-medium"
                    >
                      Generate
                    </button>
                  </div>
                </div>
                <button type="submit" className="w-full bg-zinc-100 hover:bg-white text-zinc-950 font-medium rounded-lg px-4 py-3 mt-4 transition-colors">
                  Create Event
                </button>
              </form>
            </div>

            {/* Event List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center px-1">
                <h2 className="text-xl font-medium text-white">Active Events</h2>
                <button onClick={fetchEvents} className="text-xs text-gold-500 hover:text-gold-400 uppercase tracking-widest font-medium">Refresh</button>
              </div>
              
              {isLoading ? (
                <div className="text-zinc-500 text-sm animate-pulse px-1">Loading events...</div>
              ) : events.length === 0 ? (
                <div className="border border-dashed border-zinc-800 rounded-xl p-12 text-center text-zinc-500">
                  No events created yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {events.map((event) => (
                    <div key={event.id} className="bg-zinc-900 border border-zinc-800 hover:border-gold-500/30 transition-colors rounded-xl p-5 space-y-4 group">
                      <div className="flex justify-between items-start">
                        <div className="overflow-hidden">
                          <h3 className="text-white font-medium truncate">{event.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-zinc-500 text-xs truncate">/gallery/{event.slug}</span>
                            {event.stats && (
                               <span className="text-[10px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded uppercase tracking-tighter shadow-sm border border-zinc-700/50">
                                 {event.stats.categories} CATS • {event.stats.photos} IMG
                               </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                           <span className="bg-zinc-800 text-zinc-300 px-2 py-1 rounded text-xs font-mono shrink-0">{event.password || 'Open'}</span>
                           <button 
                             onClick={() => handleDeleteEvent(event.id, event.name)}
                             className="text-zinc-700 hover:text-red-500 transition-colors p-1"
                             title="Delete Event"
                           >
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                           </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 pt-2 border-t border-zinc-800/80">
                        <button 
                          onClick={() => copyShareLink(event.slug, event.password)}
                          className="flex-1 text-gold-500 hover:text-gold-400 text-xs py-1 transition-colors flex items-center gap-2 mt-1 font-medium pb-0"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                          Share Link & Passkey
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'uploads' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-8 shadow-xl text-zinc-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider pl-1">Target Event</label>
                <select 
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100 focus:outline-none focus:border-gold-500/50"
                  disabled={events.length === 0}
                >
                  <option value="" disabled>Select an Event</option>
                  {events.map(event => (
                    <option key={event.id} value={event.id}>{event.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider pl-1 font-sans">Category Name</label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Wedding"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-gold-500/50" 
                />
              </div>
            </div>

            <div className="flex justify-between items-center px-1">
              <label className="text-sm font-medium text-zinc-300 transition-all font-sans">Upload Source</label>
              <div className="flex bg-zinc-950 border border-zinc-800 rounded-lg p-1">
                 <button 
                   onClick={() => setGoogleDriveLink('')}
                   className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${googleDriveLink === '' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                 >Local Computer</button>
                 <button 
                   onClick={() => setGoogleDriveLink('pending')}
                   className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${googleDriveLink !== '' ? 'bg-gold-500/20 text-gold-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                 >Google Drive</button>
              </div>
            </div>

            {googleDriveLink !== '' ? (
              <div className="space-y-4 pt-4 border-t border-zinc-800/80">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider pl-1">Drive Folder Link</label>
                  <div className="relative">
                    <input
                      type="url"
                      value={googleDriveLink === 'pending' ? '' : googleDriveLink}
                      onChange={(e) => setGoogleDriveLink(e.target.value)}
                      placeholder="https://drive.google.com/drive/folders/..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 pr-10 text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-gold-500/50"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider pl-1">
                    Custom API Key <span className="text-zinc-700 normal-case">(optional)</span>
                  </label>
                  <input
                    type="password"
                    value={driveApiKey}
                    onChange={(e) => setDriveApiKey(e.target.value)}
                    placeholder="AIza..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-gold-500/50"
                  />
                </div>

                {driveResult && (
                  <div className={`rounded-lg px-4 py-3 text-sm flex items-center gap-3 ${driveResult.error ? 'bg-red-950/40 text-red-400 border border-red-900/40' : 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40'}`}>
                    <span>{driveResult.error ? '❌' : '✅'}</span>
                    <span>{driveResult.error || `Import complete! ${driveResult.count} photos added.`}</span>
                  </div>
                )}

                <button
                  onClick={handleDriveImport}
                  disabled={driveImporting || !selectedEventId || !newCategoryName || !googleDriveLink || googleDriveLink === 'pending'}
                  className="w-full bg-gold-500 hover:bg-gold-400 text-zinc-950 font-semibold rounded-lg px-4 py-3 transition-all disabled:opacity-50"
                >
                  {driveImporting ? "Importing Photos…" : "Start Google Drive Import"}
                </button>
              </div>
            ) : (
              <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
                  uploading ? 'opacity-50 cursor-not-allowed' :
                  isDragActive ? 'border-gold-500 bg-gold-500/5' : 'border-zinc-800 bg-zinc-950/50 hover:border-gold-500/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                      e.target.value = '';
                    }
                  }}
                />
                <div className="flex flex-col items-center space-y-3">
                   <svg className="w-10 h-10 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                   <p className="text-zinc-400 text-sm">Drag images here or <span className="text-gold-500">browse</span></p>
                </div>
              </div>
            )}

            {files.length > 0 && googleDriveLink === '' && (
              <div className="space-y-4 pt-4 border-t border-zinc-800/80">
                <div className="flex justify-between items-center text-xs px-1">
                   <span className="text-zinc-500">{files.length} files selected</span>
                   <button onClick={() => setFiles([])} className="text-zinc-600 hover:text-white">Clear</button>
                </div>

                {uploading && (
                  <div className="space-y-2">
                    <div className="w-full bg-zinc-800 rounded-full h-1">
                      <div className="bg-gold-500 h-1 rounded-full" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}

                {uploadResult && (
                  <div className="bg-emerald-950/30 border border-emerald-900/40 text-emerald-400 px-4 py-2 rounded text-xs text-center font-medium">
                    Successfully uploaded {uploadResult.success} photos!
                  </div>
                )}

                <button
                  onClick={handleUpload}
                  disabled={uploading || !selectedEventId || !newCategoryName}
                  className="w-full bg-zinc-100 hover:bg-white text-zinc-950 font-semibold rounded-lg px-4 py-3.5 transition-all disabled:opacity-50"
                >
                  {uploading ? `Uploading ${uploadProgress}%` : `Upload ${files.length} Photos`}
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
