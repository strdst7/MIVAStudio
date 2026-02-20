
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import Tooltip from './Tooltip';
import { SparklesIcon, StackIcon } from './icons';

interface DetailEnhancementPanelProps {
  onApplyDetail: (prompt: string) => void;
  onCloneStyle: (prompt: string) => void;
  isLoading: boolean;
}

interface Preset {
    name: string;
    prompt: string;
}

const DetailEnhancementPanel: React.FC<DetailEnhancementPanelProps> = ({ onApplyDetail, onCloneStyle, isLoading }) => {
  const [selectedPresetPrompt, setSelectedPresetPrompt] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  
  const defaultPresets: Preset[] = [
    { 
        name: 'True RAW Realism', 
        prompt: 'Refine the image to achieve a heightened level of photographic realism and overall clarity. Improve image fidelity by eliminating any synthetic or generation-related artifacts while preserving the original composition and all existing details exactly as they are. Emphasize lifelike skin rendering with clearly visible pores, fine follicle structure, and soft vellus hairs, including delicate flyaways subtly caught by rim lighting. Introduce realistic light interaction such as subsurface scattering within the skin and anisotropic highlights on hair and naturally moisturized areas. Retain authentic skin characteristics, including minor imperfections and faint capillaries, with a gentle hydrated glow across high points like the nose. Finish with a subtle, natural film grain to evoke a true RAW photographic capture, enhancing realism without altering form, pose, or framing.'
    },
    { 
        name: 'Master Refinement', 
        prompt: 'Precision retouching of facial geometry. Refine iris patterns with wet catchlights and accurate tear duct reflections. Enhance the tactile fidelity of skin texture with visible pores and subsurface scattering. Match lighting falloff to high-end 85mm f/1.8 lens characteristics. RAW film grain finish.'
    },
    { 
        name: 'Texture Recovery', 
        prompt: 'Recover fine textures and material fidelity. Focus on fabric weaves, metal surfaces, and organic patterns without altering geometry. Add micro-contrast to surface details.'
    },
    { 
        name: 'Micro-Contrast', 
        prompt: 'Boost micro-contrast and edge definition. Sharpen small-scale details for a high-end editorial look while maintaining natural tonal rolloff.'
    }
  ];

  const activePrompt = selectedPresetPrompt || customPrompt;

  const handlePresetClick = (preset: Preset) => {
    setSelectedPresetPrompt(preset.prompt);
    setCustomPrompt('');
  };

  const handleApply = () => { if (activePrompt) onApplyDetail(activePrompt); };
  const handleClone = () => { if (activePrompt) onCloneStyle(activePrompt); };

  return (
    <div className="w-full space-y-6 animate-studio-in">
        <div className="glass-morphism rounded-[2rem] p-6 space-y-6">
            <div className="flex flex-col items-center gap-4">
                <div className="bg-[var(--bg-input)] p-4 rounded-[1.2rem] border border-[var(--border-color)]">
                    <SparklesIcon className="w-6 h-6 text-white" />
                </div>
                <div className="text-center space-y-1">
                    <h3 className="text-[11px] font-black tracking-[0.2em] uppercase">Detail Enhancement</h3>
                    <p className="text-[10px] text-[var(--text-muted)] font-medium leading-relaxed opacity-60">
                        Improve perceived resolution and clarity. Real textures, no hallucinated artifacts.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
                {defaultPresets.map(preset => (
                    <button
                        key={preset.name}
                        onClick={() => handlePresetClick(preset)}
                        className={`text-[9px] font-black tracking-widest uppercase py-3 px-1 rounded-xl transition-studio border ${
                            selectedPresetPrompt === preset.prompt 
                            ? 'bg-white text-black border-white shadow-premium' 
                            : 'bg-[var(--bg-input)] text-[var(--text-muted)] border-[var(--border-color)] hover:border-[var(--text-muted)]'
                        }`}
                    >
                        {preset.name}
                    </button>
                ))}
            </div>

            <div className="space-y-2">
                <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Enhancement Logic</label>
                <textarea
                    value={customPrompt}
                    onChange={(e) => {setCustomPrompt(e.target.value); setSelectedPresetPrompt(null);}}
                    placeholder="Specific detail refinements (e.g. 'bring out the fine grain of the leather', 'sharpen eye reflections')..."
                    className="w-full h-24 bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] rounded-2xl p-4 text-[11px] font-medium focus:border-white transition-studio outline-none resize-none placeholder:text-[var(--text-muted)]/30"
                    disabled={isLoading}
                />
            </div>

            <div className="flex flex-col gap-3">
                <button
                    onClick={handleApply}
                    disabled={isLoading || !activePrompt}
                    className="w-full bg-white hover:bg-zinc-200 text-black font-black py-4 px-6 rounded-2xl transition-studio text-[11px] uppercase tracking-widest shadow-lg active:scale-[0.98] disabled:opacity-20"
                >
                    {isLoading ? 'Enhancing...' : 'Commit Enhancement'}
                </button>
                
                <Tooltip text="Transfer these enhancement settings to the Batch Studio" position="top">
                    <button
                        onClick={handleClone}
                        disabled={isLoading || !activePrompt}
                        className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] hover:border-[var(--text-muted)] text-[var(--text-main)] font-black py-4 px-6 rounded-2xl transition-studio text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 disabled:opacity-20"
                    >
                        <StackIcon className="w-4 h-4" />
                        Clone Logic to Batch
                    </button>
                </Tooltip>
            </div>
        </div>
    </div>
  );
};

export default DetailEnhancementPanel;
