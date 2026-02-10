
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface SpinnerProps {
  message?: string;
  subMessage?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ message, subMessage }) => {
  return (
    <div className="flex flex-col justify-center items-center p-8 gap-8 backdrop-blur-xl bg-black/40 rounded-[2rem] border border-white/5 shadow-2xl animate-fade-in">
        <div className="relative w-24 h-24">
            {/* Outer rotating ring */}
            <div className="absolute inset-0 rounded-full border-[3px] border-[var(--border-color)] opacity-30"></div>
            <div className="absolute inset-0 rounded-full border-[3px] border-t-[var(--text-main)] border-r-transparent border-b-transparent border-l-transparent animate-[spin_1.5s_cubic-bezier(0.4,0,0.2,1)_infinite]"></div>
            
            {/* Inner pulsing core */}
            <div className="absolute inset-6 rounded-full bg-[var(--text-main)] opacity-10 animate-pulse"></div>
            <div className="absolute inset-8 rounded-full border border-[var(--text-main)] opacity-40 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
            
            {/* Center dot */}
            <div className="absolute inset-[42%] bg-[var(--text-main)] rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]"></div>
        </div>
        
        <div className="flex flex-col items-center gap-2 text-center max-w-[200px]">
            {message && (
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[var(--text-main)] animate-pulse">
                    {message}
                </p>
            )}
            {subMessage && (
                <p className="text-[9px] font-mono text-[var(--text-muted)] opacity-80 leading-relaxed">
                    {subMessage}
                </p>
            )}
        </div>
    </div>
  );
};

export default Spinner;
