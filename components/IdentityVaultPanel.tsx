
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef } from 'react';
import { UserIcon, UploadIcon, XMarkIcon, ShieldCheckIcon, FingerPrintIcon, LockClosedIcon } from './icons';

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

  return (
    <div className="w-full space-y-8 animate-studio-in">
      <div className="flex flex-col items-center gap-4">
        <div className={`p-5 rounded-[1.5rem] border transition-colors ${currentIdentity ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-[var(--bg-input)] border-white/5'}`}>
          {currentIdentity ? <FingerPrintIcon className="w-8 h-8 text-emerald-400" /> : <LockClosedIcon className="w-8 h-8 text-white" />}
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-sm font-black tracking-widest uppercase">Identity Vault</h3>
          <p className="text-[11px] text-[var(--text-muted)] font-medium leading-relaxed opacity-70">
            Establish secure facial architecture. All future generations will prioritize this encrypted reference.
          </p>
        </div>
      </div>

      {!currentIdentity ? (
        <div className="bg-[var(--bg-panel)] border border-dashed border-[var(--border-color)] rounded-[2rem] p-10 flex flex-col items-center gap-6 text-center group hover:border-[var(--text-muted)] transition-colors">
            <div className="w-16 h-16 rounded-full bg-[var(--bg-input)] flex items-center justify-center border border-[var(--border-color)] group-hover:scale-110 transition-transform">
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
                className="bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-black py-4 px-8 rounded-2xl text-[11px] uppercase tracking-widest hover:scale-[1.02] transition-all flex items-center gap-3 shadow-lg"
            >
                <UploadIcon className="w-4 h-4" />
                Initialize Vault
            </button>
        </div>
      ) : (
        <div className="space-y-6">
            <div className="relative group rounded-[2rem] overflow-hidden border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.05)]">
                {/* Security Overlay */}
                <div className="absolute inset-0 z-20 bg-gradient-to-t from-emerald-900/40 via-transparent to-transparent pointer-events-none"></div>
                <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-emerald-500/30">
                    <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Encrypted</span>
                </div>

                <div className="aspect-[4/5] bg-black relative">
                    <img 
                        src={URL.createObjectURL(currentIdentity)} 
                        alt="Identity Reference" 
                        className="w-full h-full object-cover grayscale opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                    />
                    {/* Scanning Grid Effect */}
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIiBmaWxsLW9wYWNpdHk9IjAuNiIvPgo8cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSIjMTBCOTgxIiBmaWxsLW9wYWNpdHk9IjAuMiIvPgo8L3N2Zz4=')] opacity-30 pointer-events-none mix-blend-overlay"></div>
                </div>
            </div>
            
            <div className="p-4 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-2xl flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)]">Active Reference</p>
                            <p className="text-[9px] text-[var(--text-muted)] mt-0.5">Biometric data secured.</p>
                        </div>
                    </div>
                </div>
                
                <button 
                    onClick={() => onSaveIdentity(null)}
                    className="w-full py-3 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                >
                    <XMarkIcon className="w-4 h-4" />
                    Clear Vault
                </button>
            </div>
        </div>
      )}

      <div className="pt-8 border-t border-[var(--border-color)] space-y-4">
          <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] opacity-50 pl-1">Vault Protocols</h4>
          <ul className="space-y-3">
              {[
                  { label: 'Geometry Lock', val: 'Active', color: 'text-emerald-400' },
                  { label: 'Symmetry Preservation', val: 'High', color: 'text-[var(--text-main)]' },
                  { label: 'Feature Retention', val: '100%', color: 'text-[var(--text-main)]' }
              ].map(item => (
                  <li key={item.label} className="flex justify-between items-center text-[10px] font-mono opacity-80">
                      <span className="uppercase tracking-widest text-[var(--text-muted)]">{item.label}</span>
                      <span className={item.color}>{item.val}</span>
                  </li>
              ))}
          </ul>
      </div>
    </div>
  );
};

export default IdentityVaultPanel;
