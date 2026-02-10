
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { ArrowsPointingOutIcon, GridIcon } from './icons';
import Tooltip from './Tooltip';

interface UpscalePanelProps {
  onUpscale: (resolution: '2K' | '4K') => void;
  isLoading: boolean;
}

const UpscalePanel: React.FC<UpscalePanelProps> = ({ onUpscale, isLoading }) => {
  const [resolution, setResolution] = useState<'2K' | '4K'>('2K');

  const handleUpscaleClick = () => {
    onUpscale(resolution);
  };

  return (
    <div className="w-full flex flex-col gap-10 animate-studio-in">
        <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-[2rem] p-8 flex flex-col items-center gap-6 shadow-premium">
            <div className="bg-[var(--bg-input)] p-5 rounded-[1.5rem] border border-white/5">
                <GridIcon className="w-8 h-8 text-[var(--text-main)]" />
            </div>
            <div className="text-center space-y-2">
                <h3 className="text-[11px] font-black tracking-[0.3em] uppercase text-[var(--text-main)]">AI Upscale Engine</h3>
                <p className="text-[10px] text-[var(--text-muted)] font-medium leading-relaxed opacity-60">
                    Increase asset resolution with intelligent texture reconstruction.
                </p>
            </div>

            <div className="w-full space-y-3">
                <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Target Fidelity</label>
                <div className="flex gap-2 bg-[var(--bg-input)] p-1.5 rounded-2xl border border-[var(--border-color)]">
                    <button
                        onClick={() => setResolution('2K')}
                        disabled={isLoading}
                        className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            resolution === '2K'
                            ? 'bg-white text-black shadow-premium'
                            : 'text-[var(--text-muted)] hover:text-white'
                        }`}
                    >
                        2K QHD
                    </button>
                    <button
                        onClick={() => setResolution('4K')}
                        disabled={isLoading}
                        className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            resolution === '4K'
                            ? 'bg-white text-black shadow-premium'
                            : 'text-[var(--text-muted)] hover:text-white'
                        }`}
                    >
                        4K UHD
                    </button>
                </div>
            </div>

            <button
                onClick={handleUpscaleClick}
                disabled={isLoading}
                className="w-full bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-black py-5 px-8 rounded-2xl transition-all text-[11px] uppercase tracking-[0.2em] shadow-premium hover:shadow-hover hover:-translate-y-0.5 disabled:opacity-20 active:scale-95 flex items-center justify-center gap-3"
            >
                {isLoading ? (
                    'Processing...'
                ) : (
                    <>
                        <ArrowsPointingOutIcon className="w-4 h-4" />
                        Enhance Resolution
                    </>
                )}
            </button>
        </div>
    </div>
  );
};

export default UpscalePanel;
