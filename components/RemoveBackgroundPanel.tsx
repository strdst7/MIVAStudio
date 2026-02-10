/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { ScissorsIcon } from './icons';
import Tooltip from './Tooltip';

interface RemoveBackgroundPanelProps {
  onRemoveBackground: () => void;
  onReplaceBackground: (prompt: string) => void;
  isLoading: boolean;
}

const RemoveBackgroundPanel: React.FC<RemoveBackgroundPanelProps> = ({ onRemoveBackground, onReplaceBackground, isLoading }) => {
  const [prompt, setPrompt] = useState('');

  const handleReplace = () => {
    if (prompt.trim()) {
        onReplaceBackground(prompt);
    }
  }

  return (
    <div className="w-full space-y-6 animate-studio-in">
      <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-[2rem] p-8 flex flex-col items-center gap-6">
          <div className="bg-[var(--bg-input)] p-5 rounded-[1.5rem] border border-white/5">
            <ScissorsIcon className="w-8 h-8 text-white" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-sm font-black tracking-widest uppercase">Subject Isolation</h3>
            <p className="text-[11px] text-[var(--text-muted)] font-medium leading-relaxed opacity-70">
              Extract main subjects from their environment with clean, natural edges for professional compositing.
            </p>
          </div>
          
          <button
              onClick={onRemoveBackground}
              disabled={isLoading}
              className="w-full bg-white hover:bg-zinc-200 text-black font-black py-5 px-8 rounded-2xl transition-studio shadow-lg active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3 text-[11px] uppercase tracking-widest"
          >
              {isLoading ? "PROCESSSING..." : "Isolate Subject"}
          </button>
      </div>

      <div className="relative py-2 flex items-center gap-4">
         <div className="h-px bg-[var(--border-color)] flex-1"></div>
         <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Context Replacement</span>
         <div className="h-px bg-[var(--border-color)] flex-1"></div>
      </div>

      <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-[2rem] p-6 space-y-4">
         <div className="space-y-2">
             <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Atmosphere Prompt</label>
             <textarea
                 value={prompt}
                 onChange={(e) => setPrompt(e.target.value)}
                 placeholder="e.g. 'A high-end minimal concrete showroom with soft volumetric top lighting'"
                 className="w-full h-28 bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] rounded-2xl p-4 text-xs font-medium focus:border-white transition-studio outline-none resize-none"
                 disabled={isLoading}
             />
         </div>
         <button
             onClick={handleReplace}
             disabled={isLoading || !prompt.trim()}
             className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] hover:border-white text-white font-black py-4 px-6 rounded-2xl transition-studio text-[11px] uppercase tracking-widest disabled:opacity-20"
         >
             {isLoading ? 'Synthesizing...' : 'Replace Background'}
         </button>
      </div>
    </div>
  );
};

export default RemoveBackgroundPanel;