
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { SparklesIcon, CheckCircleIcon, CubeIcon, PaletteIcon, LightBulbIcon, EyeIcon, ArrowDownTrayIcon, BookOpenIcon, SaveIcon, UserIcon, VideoCameraIcon, GridIcon, FaceSmileIcon, MagicWandIcon, SettingsIcon } from './icons';
import Tooltip from './Tooltip';
import { analyzePromptStructure, enhanceUserPrompt, PromptAnalysisResult } from '../services/geminiService';

interface PromptEnhancerPanelProps {
  onUsePrompt: (prompt: string) => void;
  isLoading: boolean;
  onSavePrompt?: (name: string, content: string) => void;
  initialPrompt?: string;
}

const PromptEnhancerPanel: React.FC<PromptEnhancerPanelProps> = ({ onUsePrompt, isLoading: parentLoading, onSavePrompt, initialPrompt = '' }) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [analysis, setAnalysis] = useState<PromptAnalysisResult | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Context State
  const [platform, setPlatform] = useState('Instagram');
  const [theme, setTheme] = useState('Editorial');
  const [shotType, setShotType] = useState('Portrait');
  const [showContext, setShowContext] = useState(false);

  const platforms = ['Instagram', 'LinkedIn', 'Website', 'TikTok', 'Pinterest'];
  const themes = ['Editorial', 'Minimalist Clean', 'Luxury Dark', 'Eco/Natural', 'Urban Street', 'Cinematic', 'Soft Pastel'];
  const shotTypes = ['Portrait', 'Product Hero', 'Detail Close-up', 'Lifestyle', 'Wide Angle', 'Texture Focus'];

  const isLoading = parentLoading || localLoading;

  useEffect(() => {
    if (initialPrompt) setPrompt(initialPrompt);
  }, [initialPrompt]);

  const handleAnalyze = async () => {
    if (!prompt.trim()) return;
    setLocalLoading(true);
    setError(null);
    setAnalysis(null);
    
    try {
        const result = await analyzePromptStructure(prompt, { platform, theme, shotType });
        setAnalysis(result);
    } catch (err) {
        console.error(err);
        setError("Analysis engine unavailable. Check connectivity.");
    } finally {
        setLocalLoading(false);
    }
  };

  const handleAutoEnhance = async () => {
      if (!prompt.trim()) return;
      setLocalLoading(true);
      setError(null);
      setAnalysis(null);

      try {
          const refined = await enhanceUserPrompt(prompt, { platform, theme, shotType });
          setPrompt(refined);
          // Automatically analyze the refined prompt with the same context
          const result = await analyzePromptStructure(refined, { platform, theme, shotType });
          setAnalysis(result);
      } catch (err) {
          console.error(err);
          setError("Enhancement engine unavailable.");
      } finally {
          setLocalLoading(false);
      }
  };

  const handleSave = (title: string, content: string) => {
      if (onSavePrompt) {
          onSavePrompt(title, content);
      }
  };

  const getCategoryColor = (cat: string) => {
      switch(cat) {
          case 'Subject': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
          case 'Lighting': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
          case 'Camera': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
          case 'Texture': return 'text-pink-400 bg-pink-400/10 border-pink-400/20';
          default: return 'text-[var(--text-muted)] bg-[var(--bg-input)] border-white/5';
      }
  };

  const getCategoryIcon = (cat: string) => {
      switch(cat) {
          case 'Subject': return <UserIcon className="w-3 h-3" />;
          case 'Lighting': return <LightBulbIcon className="w-3 h-3" />;
          case 'Camera': return <VideoCameraIcon className="w-3 h-3" />;
          case 'Texture': return <GridIcon className="w-3 h-3" />;
          default: return <SparklesIcon className="w-3 h-3" />;
      }
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-studio-in pb-10">
        
        {/* Input Section */}
        <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-[2rem] p-6 space-y-6 shadow-premium">
             <div className="flex flex-col items-center text-center">
                <div className="bg-[var(--bg-input)] p-4 rounded-xl mb-3 border border-white/5">
                    <SparklesIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-[11px] font-black tracking-[0.2em] uppercase">Prompt Studio</h3>
                <p className="text-[10px] text-[var(--text-muted)] mt-2 font-medium leading-relaxed opacity-60">
                    Deep structural analysis and enhancement. Refines lighting, texture, and subject details.
                </p>
            </div>

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
                                className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-white text-[10px] rounded-lg p-2 outline-none"
                            >
                                {themes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Shot Type</label>
                            <select 
                                value={shotType} 
                                onChange={(e) => setShotType(e.target.value)}
                                className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-white text-[10px] rounded-lg p-2 outline-none"
                            >
                                {shotTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>
                )}

                <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Original Vision</label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Paste your prompt or brief here..."
                        className="w-full h-28 bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] rounded-2xl p-4 text-[11px] font-medium focus:border-white transition-studio outline-none resize-none placeholder:text-[var(--text-muted)]/30"
                        disabled={isLoading}
                    />
                </div>
                
                <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                        <button
                            onClick={handleAnalyze}
                            disabled={isLoading || !prompt.trim()}
                            className="flex-1 bg-[var(--bg-input)] text-[var(--text-main)] font-black py-4 px-4 rounded-2xl transition-studio text-[10px] uppercase tracking-widest shadow-sm border border-[var(--border-color)] hover:border-[var(--text-muted)] active:scale-[0.98] disabled:opacity-20 flex items-center justify-center gap-2"
                        >
                            {isLoading ? 'Running...' : (
                                <>
                                    <EyeIcon className="w-4 h-4" />
                                    Critique
                                </>
                            )}
                        </button>
                        <button
                            onClick={handleAutoEnhance}
                            disabled={isLoading || !prompt.trim()}
                            className="flex-1 bg-white text-black font-black py-4 px-4 rounded-2xl transition-studio text-[10px] uppercase tracking-widest shadow-lg active:scale-[0.98] disabled:opacity-20 flex items-center justify-center gap-2 hover:shadow-hover"
                        >
                            {isLoading ? 'Refining...' : (
                                <>
                                    <MagicWandIcon className="w-4 h-4" />
                                    Auto-Refine
                                </>
                            )}
                        </button>
                    </div>
                    
                    <button
                        onClick={() => onUsePrompt(prompt)}
                        disabled={isLoading || !prompt.trim()}
                        className="w-full bg-[var(--text-main)] text-[var(--bg-app)] font-black py-3 px-4 rounded-2xl transition-studio text-[10px] uppercase tracking-widest shadow-premium active:scale-[0.98] disabled:opacity-20 flex items-center justify-center gap-2 hover:opacity-90"
                    >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        Use / Apply Refined Prompt
                    </button>
                </div>
            </div>
        </div>

        {/* Results Section */}
        {analysis && (
            <div className="flex flex-col gap-6 animate-slide-up">
                
                {/* 1. Critique */}
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-[1.5rem] p-6 relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-3">
                        <LightBulbIcon className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-emerald-400 font-black text-[10px] uppercase tracking-[0.2em]">Studio Critique</h4>
                    </div>
                    <p className="text-[11px] text-[var(--text-main)] leading-relaxed font-medium relative z-10">
                        {analysis.critique}
                    </p>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] rounded-full pointer-events-none"></div>
                </div>

                {/* 2. Face Analysis (Optional) */}
                {analysis.faceAnalysis && (
                    <div className="bg-purple-500/5 border border-purple-500/20 rounded-[1.5rem] p-6 relative overflow-hidden">
                        <div className="flex items-center gap-2 mb-3">
                            <FaceSmileIcon className="w-4 h-4 text-purple-400" />
                            <h4 className="text-purple-400 font-black text-[10px] uppercase tracking-[0.2em]">Facial Logic & Identity</h4>
                        </div>
                        <p className="text-[11px] text-[var(--text-main)] leading-relaxed font-medium relative z-10">
                            {analysis.faceAnalysis}
                        </p>
                    </div>
                )}

                {/* 3. Impact Matrix (Key Terms) */}
                <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-[2rem] p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-5">
                        <CubeIcon className="w-4 h-4 text-blue-400" />
                        <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Visual Impact Matrix</h4>
                    </div>
                    
                    <div className="space-y-3">
                        {analysis.keyTerms.map((term, idx) => (
                            <div key={idx} className="flex flex-col sm:flex-row gap-3 p-3 rounded-xl bg-[var(--bg-input)] border border-white/5 hover:border-white/10 transition-colors">
                                <div className="sm:min-w-[140px] flex-shrink-0">
                                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1.5 rounded-lg inline-flex items-center gap-2 border ${getCategoryColor(term.category)}`}>
                                        {getCategoryIcon(term.category)}
                                        {term.term}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] text-[var(--text-muted)] font-medium leading-tight pt-1">
                                        <span className="text-[var(--text-main)] font-bold opacity-60 mr-2">IMPACT:</span>
                                        {term.effect}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. Architecture Options (Alternatives) */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Optimized Variations</h4>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                        {analysis.options.map((option, idx) => (
                            <div key={idx} className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-[2rem] p-6 hover:border-[var(--text-main)] transition-all group relative overflow-hidden shadow-sm">
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 rounded-lg bg-[var(--bg-input)] border border-white/5">
                                            {idx === 0 ? <SparklesIcon className="w-3.5 h-3.5 text-amber-400" /> : <PaletteIcon className="w-3.5 h-3.5 text-blue-400" />}
                                        </div>
                                        <div>
                                            <h5 className="font-black text-[var(--text-main)] text-[11px] uppercase tracking-widest">{option.title}</h5>
                                            <p className="text-[9px] text-[var(--text-muted)] font-mono mt-0.5">{option.reasoning}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-[var(--bg-input)] p-4 rounded-xl border border-white/5 relative z-10 mb-4 group-hover:bg-white/[0.02] transition-colors">
                                    <p className="text-[11px] text-[var(--text-main)] leading-relaxed font-medium select-all">
                                        {option.prompt}
                                    </p>
                                </div>

                                <div className="flex gap-2 relative z-10">
                                    <button 
                                        onClick={() => onUsePrompt(option.prompt)}
                                        className="flex-1 bg-white text-black py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2"
                                    >
                                        <ArrowDownTrayIcon className="w-3.5 h-3.5" /> Use Logic
                                    </button>
                                    {onSavePrompt && (
                                        <button 
                                            onClick={() => handleSave(option.title, option.prompt)}
                                            className="px-4 bg-white/5 text-white border border-white/10 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center"
                                        >
                                            <SaveIcon className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/5 blur-[60px] rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {error && <p className="text-red-400 text-[10px] font-black uppercase tracking-widest text-center bg-red-500/10 p-4 rounded-xl border border-red-500/20">{error}</p>}
    </div>
  );
};

export default PromptEnhancerPanel;
