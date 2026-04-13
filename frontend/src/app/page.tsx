"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const [eventSlug, setEventSlug] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!eventSlug) {
      setError("Please enter an event code");
      setLoading(false);
      return;
    }

    try {
      // Direct call to port 5000 for local development
      const res = await fetch("http://localhost:5000/api/auth/event-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventSlug, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Save token and event info
      localStorage.setItem("token", data.token);
      localStorage.setItem("currentEvent", JSON.stringify(data.event));

      // Redirect to gallery
      router.push(`/gallery/${data.event.slug}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex flex-col items-center justify-center min-h-[80vh] px-4 space-y-12">
      
      <div className="text-center space-y-6 max-w-2xl mx-auto">
        <h1 className="font-serif tracking-tight text-5xl md:text-7xl font-light text-zinc-50">
          Capture Life’s <br/>
          <span className="font-serif italic text-gradient-gold font-medium">Golden Moments</span>
        </h1>
        <p className="text-zinc-400 text-lg md:text-xl font-light leading-relaxed max-w-xl mx-auto">
          Welcome to WeddingsByPK Smart Gallery. Advanced face-recognition powered experience to find your memories instantly.
        </p>
      </div>

      <div className="glass px-8 py-10 rounded-2xl w-full max-w-sm space-y-8 flex flex-col shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gold-500/5 transition-opacity duration-500 opacity-0 group-hover:opacity-100" />
        
        <div className="space-y-2 text-center relative z-10">
          <h2 className="text-2xl font-serif text-gold-200">Access Event</h2>
          <p className="text-sm text-zinc-400">Enter your event code to continue</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 relative z-10">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-2 px-3 rounded text-center">
              {error}
            </div>
          )}
          
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider pl-1">Event Code</label>
            <input 
              type="text" 
              value={eventSlug}
              onChange={(e) => setEventSlug(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-gold-500/50 focus:border-gold-500/50 transition-all text-center tracking-widest placeholder:text-zinc-700"
              placeholder="e.g. PK-RITUALS" 
              required
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider pl-1">PIN / Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-gold-500/50 focus:border-gold-500/50 transition-all text-center tracking-widest placeholder:text-zinc-700" 
              placeholder="••••"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-gold-500 hover:bg-gold-400 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-medium rounded-lg px-4 py-3 transition-colors shadow-lg shadow-gold-500/20 active:scale-[0.98]"
          >
            {loading ? "Checking..." : "Enter Gallery"}
          </button>
        </form>
        
        <div className="text-center relative z-10 pt-2">
           <Link href="/admin" className="text-xs text-zinc-600 hover:text-gold-400 transition-colors">Admin Login</Link>
        </div>
      </div>

    </div>
  );
}
