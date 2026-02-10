
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import Tooltip from './Tooltip';
import { StackIcon, PaletteIcon, UserIcon, UndoIcon, EyeIcon } from './icons';
import { PreviewFilters } from '../App';

interface FilterPanelProps {
  onApplyFilter: (prompt: string) => void;
  onCloneStyle: (prompt: string) => void;
  isLoading: boolean;
  previewFilters: PreviewFilters;
  onUpdatePreview: (filters: Partial<PreviewFilters>) => void;
  onApplyPreview: () => void;
  currentImageUrl?: string | null;
  setIsInteracting?: React.Dispatch<React.SetStateAction<boolean>>;
}

interface Preset {
    name: string;
    prompt: string;
    preview?: Partial<PreviewFilters>;
    category?: string;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ onApplyFilter, onCloneStyle, isLoading, previewFilters, onUpdatePreview, onApplyPreview, currentImageUrl, setIsInteracting }) => {
  const [selectedPresetPrompt, setSelectedPresetPrompt] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showPreviewControls, setShowPreviewControls] = useState(false);
  const [tempFilters, setTempFilters] = useState<PreviewFilters | null>(null);
  
  const defaultPresets: Preset[] = [
    { 
        name: 'Noir Luxe', 
        prompt: 'Deep obsidian black and white, high contrast cinematic film noir, sharp silver highlights, soft grain, dramatic volumetric shadows.',
        preview: { saturate: 0, contrast: 140, brightness: 90, sepia: 0, blur: 0, hueRotate: 0 }
    },
    { 
        name: 'Luxe Editorial', 
        prompt: 'Clean, minimalist aesthetic with soft, diffused studio daylight. Emphasizes natural skin texture and subtle tonal variations. Focuses on high-fidelity realism and editorial quality.',
        preview: { brightness: 105, contrast: 105, saturate: 95, sepia: 0, blur: 0, hueRotate: 0 }
    },
    { 
        name: 'Solarized', 
        prompt: 'Ultra-warm golden hour glow, volumetric sun flares, saturated ambers, editorial sunset lighting with soft diffused shadows.',
        preview: { sepia: 40, saturate: 130, brightness: 110, contrast: 100, blur: 0, hueRotate: 0 }
    },
    { 
        name: 'Hyper Real', 
        prompt: 'Maximum texture fidelity, 8k crisp details, neutral studio lighting with physically accurate shadow falloff and subsurface scattering on skin, flawless clarity.',
        preview: { contrast: 110, saturate: 105, brightness: 100, sepia: 0, blur: 0, hueRotate: 0 }
    },
    { 
        name: 'Analogue 35mm', 
        prompt: 'Vintage kodak film stock, soft grain, organic color shifts, nostalgic aesthetic with natural light leaks.',
        preview: { sepia: 20, contrast: 95, saturate: 110, brightness: 100, blur: 0.2, hueRotate: 0 }
    },
  ];
  
  const activePrompt = selectedPresetPrompt || customPrompt;

  const handlePresetClick = (preset: Preset) => {
    // Commit the selection: clear temporary hover state so we don't revert on mouse leave
    setTempFilters(null);
    setSelectedPresetPrompt(preset.prompt);
    setCustomPrompt('');
    
    // Apply full preset settings
    if (preset.preview) {
        onUpdatePreview({ 
            brightness: 100, contrast: 100, saturate: 100, 
            sepia: 0, blur: 0, hueRotate: 0, 
            ...preset.preview 
        });
    }
    
    // Ensure high-res is shown after selection
    setIsInteracting?.(false);
  };

  const handlePresetHover = (preset: Preset) => {
      if (!preset.preview) return;
      
      // Store current state before previewing if not already storing
      if (!tempFilters) {
          setTempFilters(previewFilters);
      }
      
      // Show proxy for performance during preview
      setIsInteracting?.(true);
      
      // Apply preset settings temporarily
      onUpdatePreview({ 
          brightness: 100, contrast: 100, saturate: 100, 
          sepia: 0, blur: 0, hueRotate: 0, 
          ...preset.preview 
      });
  };

  const handlePresetLeave = () => {
      // Revert to original settings if we haven't clicked/committed
      if (tempFilters) {
          onUpdatePreview(tempFilters);
          setTempFilters(null);
      }
      // Hide proxy
      setIsInteracting?.(false);
  };

  const handleResetPreview = () => {
      onUpdatePreview({ 
          brightness: 100, contrast: 100, saturate: 100, 
          sepia: 0, blur: 0, hueRotate: 0 
      });
  };
  
  const handleApply = () => { if (activePrompt) onApplyFilter(activePrompt); };
  const handleClone = () => { if (activePrompt) onCloneStyle(activePrompt); };

  const handlePointerDown = () => setIsInteracting && setIsInteracting(true);
  const handlePointerUp = () => setIsInteracting && setIsInteracting(false);

  const renderSlider = (label: string, key: keyof PreviewFilters, min: number, max: number, unit: string = '') => (
    <div className="space-y-1.5">
        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">
            <span>{label}</span>
            <span className="text-[var(--text-main)] font-mono">{Math.round(previewFilters[key])}{unit}</span>
        </div>
        <input 
            type="range" min={min} max={max} step={key === 'blur' ? 0.1 : 1}
            value={previewFilters[key]} 
            onChange={(e) => onUpdatePreview({ [key]: Number(e.target.value) })}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            className="w-full accent-[var(--text-main)] h-0.5 bg-[var(--border-color)] rounded-full appearance-none cursor-pointer hover:bg-[var(--text-muted)] transition-colors"
        />
    </div>
  );

  return (
    <div className="w-full space-y-6 animate-studio-in pb-10">
        <div className="glass-morphism rounded-[2rem] p-6 space-y-6 shadow-premium">
            <div className="flex flex-col items-center gap-4">
                <div className="bg-[var(--bg-input)] p-4 rounded-[1.2rem] border border-[var(--border-color)]">
                    <PaletteIcon className="w-6 h-6 text-[var(--text-main)]" />
                </div>
                <div className="text-center space-y-1">
                    <h3 className="text-[11px] font-black tracking-[0.2em] uppercase">Style Engine</h3>
                    <p className="text-[10px] text-[var(--text-muted)] font-medium leading-relaxed opacity-60">
                        Synthesize and apply uniform aesthetics while preserving core identity architecture.
                    </p>
                </div>
            </div>

            <div className="p-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl flex flex-col gap-1 text-center">
                 <div className="flex items-center justify-center gap-3">
                    <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Identity Protection: Active</span>
                 </div>
                 <p className="text-[9px] text-[var(--text-muted)] opacity-50 italic">Styles affect look, not who you are.</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
                {defaultPresets.map(preset => (
                    <button
                        key={preset.name}
                        onClick={() => handlePresetClick(preset)}
                        onPointerEnter={() => handlePresetHover(preset)}
                        onPointerLeave={handlePresetLeave}
                        className={`text-[10px] font-black tracking-widest uppercase py-3 px-2 rounded-xl transition-studio border ${
                            selectedPresetPrompt === preset.prompt 
                            ? 'bg-[var(--text-main)] text-[var(--bg-app)] border-[var(--text-main)] shadow-lg transform scale-[1.02]' 
                            : 'bg-[var(--bg-input)] text-[var(--text-muted)] border-[var(--border-color)] hover:border-[var(--text-muted)] hover:bg-[var(--bg-panel)]'
                        }`}
                    >
                        {preset.name}
                    </button>
                ))}
            </div>

            <div className="border-t border-[var(--border-color)] pt-4 space-y-4">
                <button 
                    onClick={() => setShowPreviewControls(!showPreviewControls)}
                    className="w-full flex items-center justify-between group"
                >
                    <div className="flex items-center gap-2">
                         <EyeIcon className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors" />
                         <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors">
                            Visual Preview Tuner
                         </span>
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)]">{showPreviewControls ? '−' : '+'}</span>
                </button>

                {showPreviewControls && (
                    <div className="space-y-4 animate-slide-up bg-[var(--bg-input)] p-4 rounded-xl border border-[var(--border-color)]">
                        <div className="flex justify-between items-center pb-2 border-b border-[var(--border-color)] mb-2">
                            <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase">Adjust Simulation</span>
                            <button onClick={handleResetPreview} className="text-[9px] text-[var(--text-main)] hover:text-red-400 flex items-center gap-1"><UndoIcon className="w-3 h-3" /> Reset</button>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                            {renderSlider('Brightness', 'brightness', 0, 200, '%')}
                            {renderSlider('Contrast', 'contrast', 0, 200, '%')}
                            {renderSlider('Saturation', 'saturate', 0, 200, '%')}
                            {renderSlider('Hue', 'hueRotate', 0, 360, '°')}
                            {renderSlider('Sepia', 'sepia', 0, 100, '%')}
                            {renderSlider('Blur', 'blur', 0, 10, 'px')}
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Synthesis Logic</label>
                <textarea
                    value={customPrompt}
                    onChange={(e) => {setCustomPrompt(e.target.value); setSelectedPresetPrompt(null);}}
                    placeholder="Describe specific aesthetic mood, color palette, or lighting..."
                    className="w-full h-24 bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] rounded-2xl p-4 text-[11px] font-medium focus:border-[var(--text-main)] transition-studio outline-none resize-none placeholder:text-[var(--text-muted)]/30"
                    disabled={isLoading}
                />
            </div>

            <div className="flex flex-col gap-3">
                <button
                    onClick={handleApply}
                    disabled={isLoading || !activePrompt}
                    className="w-full bg-[var(--btn-primary-bg)] hover:opacity-90 text-[var(--btn-primary-text)] font-black py-4 px-6 rounded-2xl transition-studio text-[11px] uppercase tracking-widest disabled:opacity-20 shadow-lg active:scale-[0.98]"
                >
                    {isLoading ? 'Synthesizing...' : 'Apply Aesthetic'}
                </button>
                
                <Tooltip text="Extract current style settings and apply to a new image" position="top">
                    <button
                        onClick={handleClone}
                        disabled={isLoading || !activePrompt}
                        className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] hover:border-[var(--text-muted)] text-[var(--text-main)] font-black py-4 px-6 rounded-2xl transition-studio text-[10px] uppercase tracking-[0.2em] disabled:opacity-20 flex items-center justify-center gap-3"
                    >
                        <StackIcon className="w-4 h-4" />
                        Clone Style
                    </button>
                </Tooltip>
            </div>
        </div>
    </div>
  );
};

export default FilterPanel;
