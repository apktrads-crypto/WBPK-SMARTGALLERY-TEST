"use client";

import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [stage, setStage] = useState<"hidden" | "entering" | "exiting">("hidden");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Only show splash screen once per session
    const hasSeenSplash = sessionStorage.getItem("hasSeenSplash");
    
    if (!hasSeenSplash) {
      setStage("entering");
      
      // Start exit animation after 2.5 seconds
      const exitTimer = setTimeout(() => {
        setStage("exiting");
        sessionStorage.setItem("hasSeenSplash", "true");
      }, 2500);

      // Hide completely after exit animation finishes
      const hideTimer = setTimeout(() => {
        setStage("hidden");
      }, 3300);

      return () => {
        clearTimeout(exitTimer);
        clearTimeout(hideTimer);
      };
    }
  }, []);

  // Prevent hydration mismatch by not rendering anything until mounted
  if (!isMounted || stage === "hidden") return null;

  return (
    <div
      className={`fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-zinc-950 px-4 ${
        stage === "exiting" ? "splash-exit" : "splash-enter"
      }`}
    >
      <div className="relative flex flex-col items-center text-center">
        {/* Subtle gold glow behind text */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[100px] bg-gold-500/20 blur-[60px] rounded-full pointer-events-none splash-fade-in"></div>
        
        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl !leading-tight text-gradient-gold splash-text mb-4">
          Weddings by PK
        </h1>
        
        <div className="h-[2px] w-0 bg-gradient-to-r from-transparent via-gold-500 to-transparent splash-line mb-6"></div>
        
        <p className="text-zinc-300 font-sans tracking-[0.3em] uppercase text-xs sm:text-sm splash-fade-in-late">
          Smart Gallery
        </p>
      </div>
    </div>
  );
}
