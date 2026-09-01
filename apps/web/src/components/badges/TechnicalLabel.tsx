import React from 'react';

export const TechnicalLabel = ({ children }: { children: React.ReactNode }) => (
  <div className=\inline-flex items-center space-x-2 font-technical text-[10px] sm:text-xs tracking-widest uppercase text-primary-purple border border-primary-purple/20 px-2 py-1 bg-white/50 backdrop-blur-sm\>
    <span className=\w-1.5 h-1.5 rounded-full bg-accent-orange inline-block\.></span>
    <span>{children}</span>
  </div>
);
