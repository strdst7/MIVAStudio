
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef, useMemo } from 'react';
import { UserIcon, UploadIcon, XMarkIcon, ShieldCheckIcon, FingerPrintIcon, LockClosedIcon, InfoIcon } from './icons';

interface IdentityVaultPanelProps {
  currentIdentity: File | null;
  onSaveIdentity: (file: File | null) => void;
}

const IdentityVaultPanel: React.FC<IdentityVaultPanelProps> = ({ currentIdentity, onSaveIdentity }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onSaveIdentity(e.target.files[0]);
    }
  };

  const identityMetadata = useMemo(() => {
    if (!currentIdentity) return null;
    return {
      name: currentIdentity.name,
      size: (currentIdentity.size / 1024).toFixed(1) + ' KB',
      type: currentIdentity.type,
      hash: Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase(),
      timestamp: new Date().toLocaleTimeString()
    };
  }, [currentIdentity]);

  return (
    <div className="w-full space-y-8 animate-studio-in">
      <div className="flex flex-col items-center gap-4">
        <div className={`p-5 rounded-[1.5rem] border transition-all duration-500 relative overflow-hidden ${currentIdentity ? 'bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.15)]' : 'bg-[var(--bg-input)] border-white/5'}`}>
          {currentIdentity && <div className="absolute inset-0 bg-emerald-500/20 animate-pulse mix-blend-overlay"></div>}
          {currentIdentity ? <FingerPrintIcon className="w-8 h-8 text-emerald-400 relative z-10" /> : <LockClosedIcon className="w-8 h-8 text-white relative z-10" />}
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-sm font-black tracking-widest uppercase">Identity Vault</h3>
          <p className="text-[11px] text-[var(--text-muted)] font-medium leading-relaxed opacity-70 max-w-[280px]">
            Establish secure facial architecture. All future generations will prioritize this encrypted reference.
          </p>
        </div>
      </div>

      {!currentIdentity ? (
        <div className="bg-[var(--bg-panel)] border border-dashed border-[var(--border-color)] rounded-[2rem] p-10 flex flex-col items-center gap-6 text-center group hover:border-[var(--text-muted)] transition-all duration-300">
            <div className="w-16 h-16 rounded-full bg-[var(--bg-input)] flex items-center justify-center border border-[var(--border-color)] group-hover:scale-110 group-hover:border-[var(--text-muted)] transition-all">
                <UserIcon className="w-6 h-6 text-[var(--text-muted)]" />
            </div>
            <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)]">
                    Vault Empty
                </p>
                <p className="text-[9px] text-[var(--text-muted)]">Upload a clear portrait to initialize biometric lock.</p>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-black py-4 px-8 rounded-2xl text-[11px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 shadow-lg"
            >
                <UploadIcon className="w-4 h-4" />
                Initialize Vault
            </button>
        </div>
      ) : (
        <div className="space-y-6">
            <div className="relative group rounded-[2.5rem] overflow-hidden border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                {/* Security Overlays */}
                <div className="absolute inset-0 z-20 bg-gradient-to-t from-emerald-900/60 via-transparent to-transparent pointer-events-none"></div>
                
                <div className="absolute top-5 left-5 z-30 flex flex-col gap-2">
                    <div className="flex items-center gap-2 bg-black/80 backdrop-blur-xl px-3 py-1.5 rounded-xl border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                        <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">E2E Encrypted</span>
                    </div>
                    <div className="bg-black/80 backdrop-blur-xl px-3 py-1.5 rounded-xl border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.3)] w-fit">
                        <span className="text-[8px] font-mono text-emerald-400/80 uppercase tracking-widest">ID: {identityMetadata?.hash.slice(0, 12)}</span>
                    </div>
                </div>

                <div className="aspect-[4/5] bg-black relative overflow-hidden">
                    <img 
                        src={URL.createObjectURL(currentIdentity)} 
                        alt="Identity Reference" 
                        className="w-full h-full object-cover grayscale opacity-80 group-hover:opacity-100 transition-all duration-700 scale-100 group-hover:scale-105"
                    />
                    {/* Scanning Grid Effect */}
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIiBmaWxsLW9wYWNpdHk9IjAuNiIvPgo8cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSIjMTBCOTgxIiBmaWxsLW9wYWNpdHk9IjAuMiIvPgo8L3N2Zz4=')] opacity-40 pointer-events-none mix-blend-overlay"></div>
                    
                    {/* Animated Scanline */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none z-40">
                        <div className="w-full h-[2px] bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,1)] animate-scanline absolute top-0 left-0"></div>
                    </div>
                </div>
            </div>
            
            <div className="p-5 bg-[var(--bg-input)] border border-emerald-500/20 rounded-[2rem] flex flex-col gap-5 relative overflow-hidden shadow-inner">
                <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none"></div>
                
                <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="relative flex items-center justify-center w-4 h-4">
                            <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)]">Active Reference</p>
                            <p className="text-[8px] font-mono text-emerald-400/80 mt-1 uppercase tracking-widest">Biometric data secured</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[8px] font-mono text-[var(--text-muted)] uppercase tracking-widest">Status</p>
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Locked</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 relative z-10">
                    <div className="p-3 rounded-xl bg-black/20 border border-white/5 space-y-1">
                        <p className="text-[8px] font-mono text-[var(--text-muted)] uppercase tracking-widest">File Name</p>
                        <p className="text-[9px] font-bold truncate text-[var(--text-main)]">{identityMetadata?.name}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-black/20 border border-white/5 space-y-1">
                        <p className="text-[8px] font-mono text-[var(--text-muted)] uppercase tracking-widest">File Size</p>
                        <p className="text-[9px] font-bold text-[var(--text-main)]">{identityMetadata?.size}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-black/20 border border-white/5 space-y-1">
                        <p className="text-[8px] font-mono text-[var(--text-muted)] uppercase tracking-widest">MIME Type</p>
                        <p className="text-[9px] font-bold text-[var(--text-main)]">{identityMetadata?.type}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-black/20 border border-white/5 space-y-1">
                        <p className="text-[8px] font-mono text-[var(--text-muted)] uppercase tracking-widest">Vaulted At</p>
                        <p className="text-[9px] font-bold text-[var(--text-main)]">{identityMetadata?.timestamp}</p>
                    </div>
                </div>
                
                <button 
                    onClick={() => onSaveIdentity(null)}
                    className="w-full py-4 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 relative z-10"
                >
                    <XMarkIcon className="w-4 h-4" />
                    Clear Vault
                </button>
            </div>
        </div>
      )}

      <div className="pt-8 border-t border-[var(--border-color)] space-y-5">
          <div className="flex items-center justify-between pl-1">
            <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] opacity-50">Vault Protocols</h4>
            <InfoIcon className="w-3 h-3 text-[var(--text-muted)] opacity-30 cursor-help" />
          </div>
          <ul className="space-y-4">
              {[
                  { label: 'Geometry Lock', val: 'Active', color: 'text-emerald-400', status: 'verified' },
                  { label: 'Symmetry Preservation', val: 'High', color: 'text-[var(--text-main)]', status: 'active' },
                  { label: 'Feature Retention', val: '100%', color: 'text-[var(--text-main)]', status: 'active' },
                  { label: 'Encryption Layer', val: 'AES-256', color: 'text-emerald-400', status: 'verified' }
              ].map(item => (
                  <li key={item.label} className="flex justify-between items-center text-[10px] font-mono group">
                      <div className="flex items-center gap-2">
                        <div className={`w-1 h-1 rounded-full ${item.status === 'verified' ? 'bg-emerald-500' : 'bg-[var(--text-muted)]'}`}></div>
                        <span className="uppercase tracking-widest text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors">{item.label}</span>
                      </div>
                      <span className={`${item.color} font-bold`}>{item.val}</span>
                  </li>
              ))}
          </ul>
      </div>
    </div>
  );
};

export default IdentityVaultPanel;
