
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { UploadIcon, MagicWandIcon, ShieldCheckIcon, LockClosedIcon, FingerPrintIcon } from './icons';
import Tooltip from './Tooltip';

interface StartScreenProps {
  onFileSelect: (files: FileList | null) => void;
  onGenerateClick: () => void;
  identityImage?: File | null;
  onManageIdentity?: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onFileSelect, onGenerateClick, identityImage, onManageIdentity }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFileSelect(e.target.files);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center select-none animate-studio-in bg-[var(--bg-app)] relative overflow-hidden">
      <div className="absolute inset-0 drafting-grid"></div>
      
      <div className="relative max-w-xl w-full text-center space-y-10 z-10 p-6">
        <div className="space-y-4">
            <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-[var(--text-main)] leading-none uppercase opacity-90">
                MIVA Studio
            </h2>
            <div className="flex items-center justify-center gap-3">
                <div className="h-px w-8 bg-[var(--border-color)]"></div>
                <p className="text-[var(--text-muted)] text-[9px] font-bold tracking-[0.3em] uppercase opacity-80">
                    Editorial Intelligence Engine
                </p>
                <div className="h-px w-8 bg-[var(--border-color)]"></div>
            </div>
        </div>

        {/* Central Identity Vault Card - Displays Active Lock even after Workspace Clear */}
        <Tooltip text={identityImage ? "Vault is active and biometric lock is applied" : "Initialize vault for facial architecture consistency"}>
            <div 
                onClick={onManageIdentity}
                className={`cursor-pointer w-full max-w-md mx-auto p-1 rounded-2xl transition-all duration-500 group ${
                    identityImage 
                    ? 'bg-gradient-to-r from-emerald-500/20 via-transparent to-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]' 
                    : 'bg-transparent border border-dashed border-[var(--border-color)] hover:border-[var(--text-muted)]'
                }`}
            >
                <div className={`rounded-xl p-5 flex items-center gap-5 transition-colors ${identityImage ? 'bg-[var(--bg-panel)] border border-emerald-500/20' : 'bg-transparent'}`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${identityImage ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[var(--bg-input)] text-[var(--text-muted)]'}`}>
                        {identityImage ? <ShieldCheckIcon className="w-6 h-6" /> : <LockClosedIcon className="w-6 h-6" />}
                    </div>
                    
                    <div className="text-left flex-1">
                        <h3 className={`text-[11px] font-black uppercase tracking-widest mb-1 ${identityImage ? 'text-emerald-400' : 'text-[var(--text-main)]'}`}>
                            {identityImage ? 'Identity Vault Active' : 'Identity Vault Empty'}
                        </h3>
                        <p className="text-[10px] text-[var(--text-muted)] leading-tight">
                            {identityImage 
                                ? 'Biometric architecture is securely locked. Generations will reference this identity.' 
                                : 'Initialize vault to ensure consistent facial structure across all studio outputs.'}
                        </p>
                    </div>

                    <div className={`p-2 rounded-lg transition-colors ${identityImage ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[var(--bg-input)] text-[var(--text-muted)] group-hover:text-[var(--text-main)]'}`}>
                        <FingerPrintIcon className="w-5 h-5" />
                    </div>
                </div>
            </div>
        </Tooltip>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Tooltip text="Create new assets from text descriptions">
                <button 
                    onClick={onGenerateClick}
                    className="w-full sm:w-auto min-w-[200px] px-8 py-4 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] rounded-xl font-black text-[10px] tracking-[0.2em] uppercase hover:shadow-hover transition-all duration-300 shadow-premium active:scale-95 flex items-center justify-center gap-3 border border-transparent"
                >
                    <MagicWandIcon className="w-4 h-4" />
                    Synthesize New
                </button>
            </Tooltip>

            <Tooltip text="Upload existing images for editing">
                <label className="w-full sm:w-auto min-w-[200px] cursor-pointer flex items-center justify-center gap-3 px-8 py-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] transition-all duration-300 hover:bg-[var(--bg-input)] active:scale-95 hover:border-[var(--text-muted)] shadow-sm">
                    <UploadIcon className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors" />
                    <span className="text-[10px] font-black text-[var(--text-muted)] group-hover:text-[var(--text-main)] uppercase tracking-[0.2em] transition-colors">Load Archive</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
            </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default StartScreen;
