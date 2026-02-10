
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import Tooltip from './Tooltip';
import { StackIcon, CubeIcon, UndoIcon } from './icons';
import { PreviewFilters } from '../App';

interface AdjustmentPanelProps {
  onApplyAdjustment: (prompt: string) => void;
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
}

const AdjustmentPanel: React.FC<AdjustmentPanelProps> = ({ onApplyAdjustment, onCloneStyle, isLoading, previewFilters, onUpdatePreview, onApplyPreview, currentImageUrl, setIsInteracting }) => {
  const [selectedPresetPrompt, setSelectedPresetPrompt] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  
  const defaultPresets: Preset[] = [
    { 
        name: 'Precision Depth', 
        prompt: 'Refine depth-of-field realism. Add subtle lens-accurate background falloff and bokeh while maintaining tack-sharp subject edges.',
        preview: { blur: 0.5, contrast: 105 }
    },
    { 
        name: 'Surface Fidelity', 
        prompt: 'Enhance micro-detail clarity and texture realism. Refine surface pores, subsurface scattering on skin, fabric weaves, and material depth without over-sharpening.',
        preview: { contrast: 110, brightness: 102, saturate: 95 }
    },
    { 
        name: 'Dynamic Balance', 
        prompt: 'Balance lighting direction and tonal range. Subtly refine highlights with soft rolloff and fill shadows for a professional studio exposure.',
        preview: { contrast: 105, brightness: 105 }
    },
    { 
        name: 'Soft Daylight', 
        prompt: 'Refine the lighting in the image to be soft diffused daylight, ensuring realistic shadow falloff and subsurface scattering, especially on skin.',
        preview: { brightness: 108, contrast: 95, saturate: 100 }
    },
    { 
        name: 'Subtle Retouch', 
        prompt: 'Apply a professional editorial retouch. Smooth tonal transitions, refine micro-contrast, and optimize overall visual architecture.',
        preview: { contrast: 102, saturate: 105, sepia: 10 }
    }
  ];

  const activePrompt = selectedPresetPrompt || customPrompt;

  const handlePresetClick = (preset: Preset) => {
    setSelectedPresetPrompt(preset.prompt);
    setCustomPrompt('');
    if (preset.preview) {
        onUpdatePreview({ 
            brightness: 100, contrast: 100, saturate: 100, 
            sepia: 0, blur: 0, hueRotate: 0, 
            ...preset.preview 
        });
    }
  };

  const handleApply = () => { if (activePrompt) onApplyAdjustment(activePrompt); };
  const handleClone = () => { if (activePrompt) onCloneStyle(activePrompt); };

  const handleResetPreview = () => {
      onUpdatePreview({ 
          brightness: 100, contrast: 100, saturate: 100, 
          sepia: 0, blur: 0, hueRotate: 0 
      });
  };

  const handlePointerDown = () => setIsInteracting && setIsInteracting(true);
  const handlePointerUp = () => setIsInteracting && setIsInteracting(false);

  const renderSlider = (label: string, key: keyof PreviewFilters, min: number, max: number, unit: string = '') => (
      <div className="space-y-1.5">
          <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">
              <span>{label}</span>
              <span className="text-white font-mono">{Math.round(previewFilters[key])}{unit}</span>
          </div>
          <input 
              type="range" min={min} max={max} step={key === 'blur' ? 0.1 : 1}
              value={previewFilters[key]} 
              onChange={(e) => onUpdatePreview({ [key]: Number(e.target.value) })}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              className="w-full accent-white h-0.5 bg-white/10 rounded-full appearance-none cursor-pointer hover:bg-white/20 transition-colors"
          />
      </div>
  );

  return (
    <div className="w-full space-y-6 animate-studio-in pb-10">
        <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-[2rem] p-6 space-y-6 shadow-premium">
            <div className="flex flex-col items-center gap-4">
                <div className="bg-[var(--bg-input)] p-4 rounded-[1.2rem] border border-white/5">
                    <CubeIcon className="w-6 h-6 text-white" />
                </div>
                <div className="text-center space-y-1">
                    <h3 className="text-[11px] font-black tracking-[0.2em] uppercase">Refinement Deck</h3>
                    <p className="text-[10px] text-[var(--text-muted)] font-medium leading-relaxed opacity-60">
                        Precision adjustments for depth, detail, and lighting. Retouched, not regenerated.
                    </p>
                </div>
            </div>

            {/* Quick Preview Sliders */}
            <div className="space-y-5 pt-4 border-t border-white/5">
                <div className="flex justify-between items-center px-1">
                     <h4 className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Real-time Preview</h4>
                     <button 
                        onClick={handleResetPreview}
                        className="text-[9px] font-bold text-[var(--text-muted)] hover:text-white transition-colors flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 hover:bg-white/10"
                        title="Reset all preview sliders"
                     >
                        <UndoIcon className="w-3 h-3" /> Reset
                     </button>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                        {renderSlider('Brightness', 'brightness', 0, 200, '%')}
                        {renderSlider('Contrast', 'contrast', 0, 200, '%')}
                        {renderSlider('Saturation', 'saturate', 0, 200, '%')}
                        {renderSlider('Hue Shift', 'hueRotate', 0, 360, '°')}
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4 pt-2 border-t border-white/5">
                        {renderSlider('Sepia', 'sepia', 0, 100, '%')}
                        {renderSlider('Blur', 'blur', 0, 20, 'px')}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
                {defaultPresets.map(preset => (
                    <button
                        key={preset.name}
                        onClick={() => handlePresetClick(preset)}
                        className={`text-[9px] font-black tracking-widest uppercase py-3 px-1 rounded-xl transition-studio border ${
                            selectedPresetPrompt === preset.prompt 
                            ? 'bg-white text-black border-white shadow-lg transform scale-[1.02]' 
                            : 'bg-[var(--bg-input)] text-[var(--text-muted)] border-white/5 hover:border-white/20 hover:bg-white/5'
                        }`}
                    >
                        {preset.name}
                    </button>
                ))}
            </div>

            <div className="space-y-2">
                <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Refinement Logic</label>
                <textarea
                    value={customPrompt}
                    onChange={(e) => {setCustomPrompt(e.target.value); setSelectedPresetPrompt(null);}}
                    placeholder="Specific precision adjustments (e.g. 'subtly lift black point', 'soften skin highlights')..."
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
                    {isLoading ? 'Retouching...' : 'Commit Adjustment'}
                </button>
                
                <Tooltip text="Transfer these adjustment settings to the Batch Studio" position="top">
                    <button
                        onClick={handleClone}
                        disabled={isLoading || !activePrompt}
                        className="w-full bg-[var(--bg-input)] border border-white/5 hover:border-white/20 text-white font-black py-4 px-6 rounded-2xl transition-studio text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 disabled:opacity-20"
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

export default AdjustmentPanel;
