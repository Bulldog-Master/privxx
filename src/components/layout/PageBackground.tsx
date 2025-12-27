/**
 * PageBackground Component
 * 
 * Shared gradient background used across pages (Index, Auth, Settings, Profile).
 * Provides consistent visual theming with teal blobs and colorful bottom glow.
 */

import React from "react";

interface PageBackgroundProps {
  children: React.ReactNode;
  /** Optional additional class names for the container */
  className?: string;
}

export function PageBackground({ children, className = "" }: PageBackgroundProps) {
  return (
    <div className={`min-h-screen relative overflow-hidden bg-[hsl(215_25%_27%)] ${className}`}>
      {/* Large teal blob - top right */}
      <div 
        className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-90"
        style={{ 
          background: 'radial-gradient(circle, hsl(172 60% 45%) 0%, hsl(172 50% 35%) 70%, transparent 100%)' 
        }}
        aria-hidden="true"
      />
      
      {/* Colorful gradient glow at bottom */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-64 opacity-60"
        style={{ 
          background: 'linear-gradient(90deg, hsl(340 70% 50%) 0%, hsl(45 80% 55%) 50%, hsl(172 60% 45%) 100%)',
          filter: 'blur(80px)'
        }}
        aria-hidden="true"
      />
      
      {/* Content layer */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

export default PageBackground;
