
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { DocumentDuplicateIcon, SparklesIcon, AtSymbolIcon, PhotoIcon, SaveIcon } from './icons';
import Tooltip from './Tooltip';
import { ImageAnalysisResult } from '../services/geminiService';

interface PromptClonerPanelProps {
  onGeneratePrompt: () => void;
  result: ImageAnalysisResult | null;
  isLoading: boolean;
  onUsePrompt: (prompt: string) => void;
  onSavePrompt?: (name: string, content: string) => void;
}

const PromptClonerPanel: React.FC<PromptClonerPanelProps> = ({ onGeneratePrompt, result, isLoading, onUsePrompt, onSavePrompt }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSave = () => {
    if (result && onSavePrompt) {
        onSavePrompt("Cloned Asset Logic", result.prompt);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    }
  };

  return (
    <div className="w-full space-y-6 animate-studio-in">
      <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-[2rem] p-8 flex flex-col items-center gap-6">
          <div className="bg-[var(--bg-input)] p-5 rounded-[1.5rem] border border-white/5">
            <DocumentDuplicateIcon className="w-8 h-8 text-white" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-sm font-black tracking-widest uppercase">Prompt Cloner</h3>
            <p className="text-[11px] text-[var(--text-muted)] font-medium leading-relaxed opacity-70">
              Extract reusable AI prompts covering subject, style, lighting, and composition. Descriptions only.
            </p>
          </div>
          
          <button
              onClick={onGeneratePrompt}
              disabled={isLoading}
              className="w-full bg-white hover:bg-zinc-200 text-black font-black py-5 px-8 rounded-2xl transition-studio shadow-lg active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3 text-[11px] uppercase tracking-widest"
          >
              {isLoading ? "EXTRACTING..." : "Clone Asset Logic"}
          </button>
      </div>

      {result && (
        <div className="space-y-6 animate-studio-in">
            <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-[2rem] overflow-hidden">
                <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <SparklesIcon className="w-3 h-3 text-[var(--text-muted)]" />
                        <span className="text-[10px] font-black tracking-[0.2em] uppercase text-[var(--text-muted)]">Reusable Prompt</span>
                    </div>
                    <div className="flex gap-2">
                        {onSavePrompt && (
                            <button 
                                onClick={handleSave}
                                className={`text-[9px] font-black uppercase transition-studio px-2 py-1 rounded-md ${isSaved ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/10 text-white hover:bg-white/20'}`}
                            >
                                {isSaved ? 'Saved' : 'Save'}
                            </button>
                        )}
                        <button 
                            onClick={() => onUsePrompt(result.prompt)}
                            className="text-[9px] font-black uppercase text-white hover:text-white transition-studio px-2 py-1 rounded-md bg-white/10"
                        >
                            Use Cloned Logic
                        </button>
                    </div>
                </div>
                <div className="p-6">
                    <p className="text-[11px] leading-relaxed text-[var(--text-main)] font-mono opacity-80 select-all whitespace-pre-wrap">
                        {result.prompt}
                    </p>
                </div>
            </div>

            <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-[2rem] overflow-hidden">
                <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <AtSymbolIcon className="w-3 h-3 text-[var(--text-muted)]" />
                        <span className="text-[10px] font-black tracking-[0.2em] uppercase text-[var(--text-muted)]">Editorial Flow</span>
                    </div>
                    <button 
                        onClick={() => handleCopy(result.caption, 'caption')}
                        className={`text-[9px] font-black uppercase transition-studio px-3 py-1.5 rounded-md ${copiedField === 'caption' ? 'text-emerald-400 bg-emerald-400/10' : 'text-[var(--text-muted)] hover:text-white bg-white/5'}`}
                    >
                        {copiedField === 'caption' ? 'Copied' : 'Copy Flow'}
                    </button>
                </div>
                <div className="p-6 glass-morphism m-4 rounded-[1.5rem] border-white/5">
                    <p className="text-[12px] leading-relaxed text-[var(--text-main)] font-medium">
                        {result.caption}
                    </p>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default PromptClonerPanel;
