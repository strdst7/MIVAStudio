
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { 
    UserIcon, 
    LightBulbIcon, 
    StarIcon, 
    HandIcon, 
    EyeIcon, 
    CubeIcon, 
    FaceSmileIcon, 
    TagIcon,
    GridIcon,
    VideoCameraIcon,
    PhotoIcon,
    DocumentDuplicateIcon,
    PlusIcon,
    ArrowDownTrayIcon,
    CheckCircleIcon
} from './icons';
import Tooltip from './Tooltip';
import { generateUGCPrompts, UGCBrief } from '../services/geminiService';

interface UGCPanelProps {
  currentImage: File | null;
  onNavigateToGenerate: (prompt: string) => void;
  isLoading: boolean;
}

const UGCPanel: React.FC<UGCPanelProps> = ({ currentImage, onNavigateToGenerate, isLoading: parentLoading }) => {
  const [platform, setPlatform] = useState('Instagram');
  const [theme, setTheme] = useState('Minimalist Clean');
  const [persona, setPersona] = useState('Sophisticated professional, mid-20s, neutral styling');
  const [selectedShotType, setSelectedShotType] = useState<string | null>(null);
  const [isGridMode, setIsGridMode] = useState(false);
  const [generatedBrief, setGeneratedBrief] = useState<UGCBrief | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isLoading = parentLoading || localLoading;

  const platforms = ['Instagram', 'TikTok', 'YouTube Shorts', 'LinkedIn'];

  const themes = [
      'Minimalist Clean', 'Vibrant Pop', 'Luxury Dark', 'Eco/Natural', 
      'Tech Futuristic', 'Soft Pastel', 'Urban Street', 'Cozy Home', 'Morning Routine'
  ];

  const shotTypes = [
      { id: 'hook', label: 'Hook Shot', icon: <LightBulbIcon className="w-5 h-5" />, desc: 'Stops scrolling instantly' },
      { id: 'pov', label: 'POV Shot', icon: <VideoCameraIcon className="w-5 h-5" />, desc: 'First-person perspective' },
      { id: 'hero', label: 'Product Hero', icon: <StarIcon className="w-5 h-5" />, desc: 'Pristine product display' },
      { id: 'hands', label: 'Hands-On Use', icon: <HandIcon className="w-5 h-5" />, desc: 'Demonstration in action' },
      { id: 'detail', label: 'Detail Close-up', icon: <EyeIcon className="w-5 h-5" />, desc: 'Texture & quality focus' },
      { id: 'texture', label: 'Texture Focus', icon: <CubeIcon className="w-5 h-5" />, desc: 'Ingredients or materials' },
      { id: 'result', label: 'Result Moment', icon: <CheckCircleIcon className="w-5 h-5" />, desc: 'Benefit visualization' }, 
      { id: 'emotion', label: 'Emotional', icon: <FaceSmileIcon className="w-5 h-5" />, desc: 'Joy & satisfaction' },
  ];

  const handleShotClick = async (typeId: string) => {
      if (!currentImage) {
          setError("Please upload a product image first.");
          return;
      }
      
      setSelectedShotType(typeId);
      setLocalLoading(true);
      setError(null);
      setGeneratedBrief(null);

      try {
          const shotInfo = shotTypes.find(s => s.id === typeId);
          const typeLabel = shotInfo?.label || typeId;
          const typeDesc = shotInfo?.desc || '';
          
          const brief = await generateUGCPrompts(
              currentImage,
              theme,
              typeLabel,
              typeDesc,
              persona,
              isGridMode,
              platform
          );
          setGeneratedBrief(brief);
      } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to generate brief");
      } finally {
          setLocalLoading(false);
      }
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-studio-in pb-10">
        <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-[2rem] p-6 space-y-6 shadow-premium">
            <div className="flex flex-col items-center text-center gap-4">
                <div className="bg-[var(--bg-input)] p-4 rounded-[1.2rem] border border-white/5">
                    <UserIcon className="w-6 h-6 text-white" />
                </div>
                <div className="space-y-1">
                    <h3 className="text-[11px] font-black tracking-[0.2em] uppercase">UGC Creative Director</h3>
                    <p className="text-[10px] text-[var(--text-muted)] font-medium leading-relaxed opacity-60">
                        Conversion-oriented production briefs. Platform-native tone and intent.
                    </p>
                </div>
            </div>

            <div className="space-y-5 pt-2">
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Target Platform</label>
                    <div className="flex gap-2 p-1 bg-[var(--bg-input)] rounded-xl border border-white/5">
                        {platforms.map(p => (
                            <Tooltip key={p} text={`Optimize brief for ${p}`} className="flex-1">
                                <button 
                                    onClick={() => setPlatform(p)}
                                    className={`w-full py-2.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all duration-300 ${platform === p ? 'bg-white text-black shadow-md' : 'text-[var(--text-muted)] hover:text-white hover:bg-white/5'}`}
                                >
                                    {p}
                                </button>
                            </Tooltip>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Visual Theme</label>
                        <Tooltip text="Select the overall aesthetic direction" className="w-full">
                            <div className="relative w-full">
                                <select 
                                    value={theme}
                                    onChange={(e) => setTheme(e.target.value)}
                                    className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-white rounded-xl p-3.5 text-[11px] font-medium outline-none appearance-none hover:border-white/20 transition-colors cursor-pointer"
                                >
                                    {themes.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </div>
                            </div>
                        </Tooltip>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Brand Persona</label>
                        <Tooltip text="Describe the personality being portrayed" className="w-full">
                            <input 
                                type="text" 
                                value={persona} 
                                onChange={(e) => setPersona(e.target.value)}
                                className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-white rounded-xl p-3.5 text-[11px] font-medium outline-none focus:border-white/40 transition-all placeholder:text-[var(--text-muted)]/50"
                                placeholder="e.g. Sophisticated professional..."
                            />
                        </Tooltip>
                    </div>
                </div>
            </div>
        </div>

        <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-[2rem] p-6 shadow-premium">
            <h4 className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-4 ml-1">Select Target Shot</h4>
            <div className="grid grid-cols-2 gap-3">
                {shotTypes.map((shot) => (
                    <Tooltip key={shot.id} text={shot.desc}>
                        <button
                            onClick={() => handleShotClick(shot.id)}
                            disabled={isLoading}
                            className={`w-full flex flex-col items-start p-4 rounded-xl border transition-all duration-300 group ${
                                selectedShotType === shot.id 
                                ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.15)] scale-[1.02]' 
                                : 'bg-[var(--bg-input)] border-white/5 text-[var(--text-muted)] hover:border-white/20 hover:bg-white/[0.02]'
                            }`}
                        >
                            <div className={`mb-3 ${selectedShotType === shot.id ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>{shot.icon}</div>
                            <span className="text-[10px] font-black uppercase tracking-widest leading-tight">{shot.label}</span>
                            <span className={`text-[9px] mt-1 leading-tight ${selectedShotType === shot.id ? 'opacity-70' : 'opacity-40'}`}>{shot.desc}</span>
                        </button>
                    </Tooltip>
                ))}
            </div>
            {error && <p className="text-red-400 text-[10px] mt-4 font-black uppercase text-center bg-red-500/10 p-3 rounded-lg border border-red-500/20">{error}</p>}
        </div>

        {generatedBrief && (
            <div className="space-y-4 animate-slide-up">
                <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-[2rem] overflow-hidden shadow-2xl">
                    <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center backdrop-blur-sm">
                        <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                             <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Production Brief</h4>
                        </div>
                        <Tooltip text="Transfer this logic to the synthesis engine">
                            <button onClick={() => onNavigateToGenerate(generatedBrief.imagePrompt)} className="bg-white text-black text-[9px] font-black uppercase px-4 py-2 rounded-lg hover:scale-105 transition-transform shadow-lg">Generate Asset</button>
                        </Tooltip>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Shot Intent</label>
                            <div className="p-4 rounded-xl bg-[var(--bg-input)] border border-white/5">
                                <p className="text-[11px] text-white leading-relaxed italic opacity-90">"{generatedBrief.shotDescription}"</p>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-[var(--accent-color)] uppercase tracking-widest">Visual Logic (AI Prompt)</label>
                            <Tooltip text="Click to select all logic text">
                                <div className="bg-[var(--bg-input)] p-4 rounded-xl border border-white/5 text-[10px] font-mono leading-relaxed text-white/80 select-all hover:bg-white/[0.02] transition-colors cursor-text">
                                    {generatedBrief.imagePrompt}
                                </div>
                            </Tooltip>
                        </div>

                        {generatedBrief.videoPrompt && (
                             <div className="space-y-2">
                                <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Motion Logic (Veo Prompt)</label>
                                <Tooltip text="Optimized for cinematic synthesis">
                                    <div className="bg-[var(--bg-input)] p-4 rounded-xl border border-purple-500/20 text-[10px] font-mono leading-relaxed text-purple-100/90 select-all">
                                        {generatedBrief.videoPrompt}
                                    </div>
                                </Tooltip>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Camera & Lighting</label>
                                <p className="text-[10px] text-white/80 font-medium">{generatedBrief.cameraSettings} • {generatedBrief.lightingConfig}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Headline / Hook</label>
                                <p className="text-[11px] text-white/90 font-bold leading-tight bg-white/5 p-2 rounded-lg">{generatedBrief.captionOrHook}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 gap-4 animate-pulse">
                <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Creative Director is synthesizing...</p>
            </div>
        )}
    </div>
  );
};

export default UGCPanel;
