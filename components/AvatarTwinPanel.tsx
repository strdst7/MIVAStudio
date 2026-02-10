
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { UserIcon, MagicWandIcon, UploadIcon, CameraIcon, SparklesIcon, PaletteIcon, CheckCircleIcon, FaceSmileIcon, SettingsIcon } from './icons';
import { generateAvatarTwin, MIVA_ANCHOR_PROMPT, IDENTITY_BASE_PROMPT, STYLE_OVERLAYS } from '../services/geminiService';

interface AvatarTwinPanelProps {
  currentImage: File | null;
  onAvatarGenerated: (file: File) => void;
  isLoading: boolean;
}

const AvatarTwinPanel: React.FC<AvatarTwinPanelProps> = ({ currentImage, onAvatarGenerated, isLoading: parentLoading }) => {
  const [sourceMode, setSourceMode] = useState<'anchor' | 'custom'>('anchor');
  const [scenarioMode, setScenarioMode] = useState<'ANCHOR' | 'SKIN_REALISM' | 'IT_GIRL' | 'INFLUENCER' | 'MOOD'>('ANCHOR');
  const [customFile, setCustomFile] = useState<File | null>(currentImage);
  const [customPrompt, setCustomPrompt] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Context State
  const [platform, setPlatform] = useState('Instagram');
  const [theme, setTheme] = useState('Editorial');
  const [shotType, setShotType] = useState('Portrait');
  const [showContext, setShowContext] = useState(false);

  const platforms = ['Instagram', 'LinkedIn', 'Website', 'TikTok'];
  const themes = ['Editorial', 'Old Money', 'Minimalist', 'Corporate', 'Casual Luxury', 'Cinematic'];
  const shotTypes = ['Portrait', 'Lifestyle', 'Candid', 'Studio', 'Street', 'Close Up'];

  // Update local file if prop changes
  React.useEffect(() => {
      if (currentImage) {
          setCustomFile(currentImage);
          setSourceMode('custom');
      }
  }, [currentImage]);

  const isLoading = parentLoading || localLoading;

  const scenarios = [
      { id: 'ANCHOR', label: 'Anchor Base', icon: <UserIcon className="w-4 h-4" />, desc: 'Identity Lock Only. No styling.' },
      { id: 'SKIN_REALISM', label: 'Skin Fidelity', icon: <FaceSmileIcon className="w-4 h-4" />, desc: 'Hyper-texture, peach fuzz, pores.' },
      { id: 'IT_GIRL', label: 'It Girl', icon: <PaletteIcon className="w-4 h-4" />, desc: 'High-fashion editorial, flash photography.' },
      { id: 'INFLUENCER', label: 'Influencer', icon: <CameraIcon className="w-4 h-4" />, desc: 'Candid, lifestyle, handheld aesthetic.' },
      { id: 'MOOD', label: 'Mood', icon: <SparklesIcon className="w-4 h-4" />, desc: 'Cinematic lighting, golden hour atmosphere.' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setCustomFile(e.target.files[0]);
          setSourceMode('custom');
      }
  };

  const handleGenerate = async () => {
    if (sourceMode === 'custom' && !customFile) {
        setError('Identity reference required for Custom Mode.');
        return;
    }

    setLocalLoading(true);
    setError(null);

    try {
        const fileToUse = sourceMode === 'custom' ? customFile : null;
        
        // Construct final context prompt
        const contextString = `Context: ${platform}, ${theme}, ${shotType}.`;
        const finalPrompt = `${contextString} ${customPrompt}`.trim();

        // We pass the style key directly to the service to handle strict prompt concatenation
        const resultUrl = await generateAvatarTwin(fileToUse, scenarioMode, finalPrompt);
        
        const arr = resultUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while(n--){
            u8arr[n] = bstr.charCodeAt(n);
        }
        const file = new File([u8arr], `avatar-twin-${scenarioMode.toLowerCase()}-${Date.now()}.png`, {type:mime});
        onAvatarGenerated(file);
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Generation failed.');
    } finally {
        setLocalLoading(false);
    }
  };

  // Helper to show what prompt logic is active
  const activeBasePrompt = sourceMode === 'custom' ? IDENTITY_BASE_PROMPT : MIVA_ANCHOR_PROMPT;
  const activeOverlay = STYLE_OVERLAYS[scenarioMode];

  return (
    <div className="w-full flex flex-col gap-6 animate-studio-in pb-10">
        <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-[2rem] p-6 space-y-6 shadow-premium">
             <div className="flex flex-col items-center text-center gap-4">
                <div className="bg-[var(--bg-input)] p-4 rounded-[1.5rem] border border-white/5">
                    <MagicWandIcon className="w-7 h-7 text-[var(--text-main)]" />
                </div>
                <div className="space-y-1">
                    <h3 className="text-[11px] font-black tracking-[0.3em] uppercase text-[var(--text-main)]">Avatar Twin</h3>
                    <p className="text-[10px] text-[var(--text-muted)] font-medium opacity-50">Identity Lock & Style Overlay System</p>
                </div>
            </div>

            {/* Source Selection */}
            <div className="space-y-2">
                <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Identity Source</label>
                <div className="flex bg-[var(--bg-input)] p-1 rounded-xl border border-[var(--border-color)]">
                    <button 
                        onClick={() => setSourceMode('anchor')}
                        className={`flex-1 py-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${sourceMode === 'anchor' ? 'bg-[var(--bg-panel)] text-[var(--text-main)] shadow-sm' : 'text-[var(--text-muted)] hover:text-white'}`}
                    >
                        Miva Anchor
                    </button>
                    <button 
                        onClick={() => setSourceMode('custom')}
                        className={`flex-1 py-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${sourceMode === 'custom' ? 'bg-[var(--bg-panel)] text-[var(--text-main)] shadow-sm' : 'text-[var(--text-muted)] hover:text-white'}`}
                    >
                        Custom Photo
                    </button>
                </div>
            </div>

            {/* Source Display / Upload */}
            <div className="bg-[var(--bg-input)]/50 rounded-2xl border border-[var(--border-color)] p-6 flex flex-col items-center justify-center min-h-[160px] relative overflow-hidden group">
                {sourceMode === 'anchor' ? (
                    <div className="text-center space-y-2 max-w-[80%]">
                        <UserIcon className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                        <p className="text-[10px] font-bold text-white uppercase tracking-wider">Miva Standard Model</p>
                        <p className="text-[9px] text-[var(--text-muted)] leading-relaxed">
                            Ultra-Realistic Editorial Headshot • Vertical Beauty Crop • Hyper-Texture
                        </p>
                        <span className="inline-block px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-[9px] text-emerald-400 font-mono">ID: LOCKED</span>
                    </div>
                ) : customFile ? (
                    <>
                        <img src={URL.createObjectURL(customFile)} alt="Source" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                        <div className="relative z-10 flex flex-col items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white drop-shadow-md">Reference Active</span>
                            <label className="cursor-pointer px-4 py-2 bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-lg text-[9px] font-bold text-white uppercase tracking-wider border border-white/10 transition-colors">
                                Change Photo
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                            </label>
                        </div>
                    </>
                ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-3 text-[var(--text-muted)] hover:text-white transition-colors">
                        <UploadIcon className="w-8 h-8" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Upload Reference</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                )}
            </div>

            {/* Scenario Mode */}
            <div className="space-y-3">
                <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Style Overlay</label>
                <div className="grid grid-cols-2 gap-2">
                    {scenarios.map((s) => (
                        <button
                            key={s.id}
                            onClick={() => setScenarioMode(s.id as any)}
                            className={`p-3 rounded-xl border text-left transition-all group ${
                                scenarioMode === s.id
                                ? 'bg-white text-black border-white shadow-md'
                                : 'bg-[var(--bg-input)] border-transparent hover:border-[var(--border-color)] text-[var(--text-muted)]'
                            }`}
                        >
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className={scenarioMode === s.id ? 'text-black' : 'text-white'}>{s.icon}</span>
                                <span className={`text-[9px] font-black uppercase tracking-wider ${scenarioMode === s.id ? 'text-black' : 'text-white'}`}>{s.label}</span>
                            </div>
                            <div className="text-[9px] opacity-60 leading-tight">{s.desc}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Context Refinement */}
            <div className="space-y-4">
                <button 
                    onClick={() => setShowContext(!showContext)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-[10px] font-bold text-[var(--text-muted)] hover:text-white transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <SettingsIcon className="w-3.5 h-3.5" />
                        <span className="uppercase tracking-widest">Context: {platform} • {theme}</span>
                    </div>
                    <span>{showContext ? '−' : '+'}</span>
                </button>

                {showContext && (
                    <div className="grid grid-cols-1 gap-3 animate-slide-up bg-[var(--bg-input)]/50 p-4 rounded-xl border border-[var(--border-color)]">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Platform</label>
                            <div className="flex flex-wrap gap-2">
                                {platforms.map(p => (
                                    <button 
                                        key={p} 
                                        onClick={() => setPlatform(p)}
                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-all ${platform === p ? 'bg-white text-black border-white' : 'bg-transparent text-[var(--text-muted)] border-[var(--border-color)] hover:border-white/20'}`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Theme</label>
                            <select 
                                value={theme} 
                                onChange={(e) => setTheme(e.target.value)}
                                className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] text-[10px] rounded-lg p-2 outline-none"
                            >
                                {themes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Shot Type</label>
                            <select 
                                value={shotType} 
                                onChange={(e) => setShotType(e.target.value)}
                                className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] text-[10px] rounded-lg p-2 outline-none"
                            >
                                {shotTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Prompt Visualization (Read Only for Base, Editable for Context) */}
            <div className="space-y-3">
                 <div className="flex items-center justify-between">
                    <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Prompt Architecture</label>
                    <span className="text-[9px] text-[var(--text-muted)] bg-[var(--bg-input)] px-2 py-0.5 rounded border border-[var(--border-color)]">
                        Identity + {scenarioMode === 'ANCHOR' ? 'Base' : 'Overlay'}
                    </span>
                 </div>
                 
                 <div className="bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl overflow-hidden text-[10px] font-mono leading-relaxed">
                    {/* Locked Identity Block */}
                    <div className="p-3 bg-black/20 border-b border-[var(--border-color)] text-[var(--text-muted)] select-none flex items-start gap-2">
                        <CheckCircleIcon className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-500" />
                        <div>
                            <span className="block font-bold text-emerald-500 mb-1">LOCKED IDENTITY</span>
                            <p className="line-clamp-2 opacity-50">{activeBasePrompt}</p>
                        </div>
                    </div>

                    {/* Active Overlay Block */}
                    {activeOverlay && (
                        <div className="p-3 bg-purple-500/5 border-b border-[var(--border-color)] text-purple-200/80 flex items-start gap-2">
                            <SparklesIcon className="w-3.5 h-3.5 mt-0.5 shrink-0 text-purple-400" />
                            <div>
                                <span className="block font-bold text-purple-400 mb-1">STYLE OVERLAY</span>
                                <p className="line-clamp-3 opacity-80 whitespace-pre-wrap">{activeOverlay?.trim()}</p>
                            </div>
                        </div>
                    )}

                    {/* Context Block Visualization */}
                    <div className="p-2 bg-blue-500/5 border-b border-[var(--border-color)] text-blue-200/80 flex items-center gap-2">
                        <SettingsIcon className="w-3 h-3 shrink-0 text-blue-400" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">{platform} • {theme} • {shotType}</span>
                    </div>

                    {/* User Context Input */}
                    <textarea 
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="Add specific context (e.g. 'wearing a red silk dress', 'standing in a neon cafe')..."
                        className="w-full bg-transparent p-3 text-[var(--text-main)] focus:bg-[var(--bg-panel)] transition-colors outline-none resize-none h-20 placeholder:text-[var(--text-muted)]/30"
                        disabled={isLoading}
                    />
                 </div>
            </div>

            <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-black py-4.5 rounded-2xl transition-all shadow-premium active:scale-[0.98] text-[10px] uppercase tracking-[0.25em] flex items-center justify-center gap-3 disabled:opacity-20"
            >
                {isLoading ? (
                    'Constructing Identity...'
                ) : (
                    <>
                        <MagicWandIcon className="w-4 h-4" />
                        Generate Twin
                    </>
                )}
            </button>
            
            {error && <p className="text-red-400 text-[9px] font-black uppercase tracking-widest text-center mt-2 bg-red-500/10 p-2 rounded-lg border border-red-500/20">{error}</p>}
        </div>
    </div>
  );
};

export default AvatarTwinPanel;
