
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface SpinnerProps {
  message?: string;
  subMessage?: string;
  log?: string[];
}

const Spinner: React.FC<SpinnerProps> = ({ message, subMessage, log = [] }) => {
  return (
    <div className="flex flex-col justify-center items-center p-10 gap-8 backdrop-blur-2xl bg-black/40 rounded-[2.5rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-fade-in max-w-sm w-full mx-6">
        <div className="relative w-28 h-28">
            {/* Outer rotating ring */}
            <div className="absolute inset-0 rounded-full border-[2px] border-[var(--border-color)] opacity-20"></div>
            <div className="absolute inset-0 rounded-full border-[2px] border-t-[var(--text-main)] border-r-transparent border-b-transparent border-l-transparent animate-[spin_1.2s_cubic-bezier(0.4,0,0.2,1)_infinite]"></div>
            
            {/* Inner pulsing core */}
            <div className="absolute inset-8 rounded-full bg-[var(--text-main)] opacity-10 animate-pulse"></div>
            <div className="absolute inset-10 rounded-full border border-[var(--text-main)] opacity-40 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
            
            {/* Center dot */}
            <div className="absolute inset-[44%] bg-[var(--text-main)] rounded-full shadow-[0_0_20px_rgba(255,255,255,0.6)]"></div>
        </div>
        
        <div className="flex flex-col items-center gap-4 text-center w-full">
            <div className="space-y-1">
                {message && (
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--text-main)]">
                        {message}
                    </p>
                )}
                {subMessage && (
                    <p className="text-[9px] font-mono text-emerald-400 opacity-90 leading-relaxed uppercase tracking-widest h-4 overflow-hidden">
                        {subMessage}
                    </p>
                )}
            </div>

            {/* Granular Operation Log */}
            {log.length > 0 && (
                <div className="w-full bg-black/30 rounded-xl p-4 border border-white/5 space-y-2 mt-2">
                    <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest text-left mb-2 opacity-50">Operation Log</p>
                    <div className="space-y-1.5">
                        {log.map((entry, idx) => (
                            <div key={idx} className={`flex items-start gap-2 text-left animate-slide-up ${idx === 0 ? 'opacity-100' : 'opacity-40 scale-95'}`}>
                                <div className={`w-1 h-1 rounded-full mt-1.5 shrink-0 ${idx === 0 ? 'bg-emerald-400' : 'bg-[var(--text-muted)]'}`}></div>
                                <p className="text-[9px] font-mono text-[var(--text-main)] leading-tight">{entry}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default Spinner;
