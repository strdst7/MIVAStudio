/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { AtSymbolIcon, DocumentDuplicateIcon, SparklesIcon, LightBulbIcon, EyeIcon, ChevronDownIcon } from './icons';
import Tooltip from './Tooltip';
import { generateThreadsContent, generateEditorialCritique, EditorialCritique } from '../services/geminiService';

interface ThreadsGeneratorPanelProps {
  isLoading: boolean;
}

const ThreadsGeneratorPanel: React.FC<ThreadsGeneratorPanelProps> = ({ isLoading: externalLoading }) => {
  const [localLoading, setLocalLoading] = useState(false);
  const [critiqueLoading, setCritiqueLoading] = useState(false);
  const [goal, setGoal] = useState('Build Personal Brand');
  const [postType, setPostType] = useState('Promotional Post');
  const [brandVoice, setBrandVoice] = useState('Sophisticated & Elegant');
  const [notes, setNotes] = useState('Focus on ROI, automation, and financial freedom. Use magnetic hooks and premium emojis (✨, 🚀, 💸).');
  
  const [useProModel, setUseProModel] = useState(true);
  const [useGoogleSearch, setUseGoogleSearch] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [critique, setCritique] = useState<EditorialCritique | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isLoading = externalLoading || localLoading || critiqueLoading;

  const handleGenerate = async () => {
    setLocalLoading(true);
    setError(null);
    setGeneratedContent(null);
    setCritique(null);

    try {
        const content = await generateThreadsContent({
            goal,
            postType,
            brandVoice,
            topic: 'Content Strategy',
            product: 'Selected Offer',
            notes,
            usePro: useProModel,
            useSearch: useGoogleSearch
        });
        setGeneratedContent(content);
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate content.');
    } finally {
        setLocalLoading(false);
    }
  };

  const handleCritique = async () => {
      if (!generatedContent) return;
      setCritiqueLoading(true);
      setError(null);
      try {
          const res = await generateEditorialCritique(generatedContent);
          setCritique(res);
      } catch (err) {
          setError("Critique engine failed.");
      } finally {
          setCritiqueLoading(false);
      }
  };

  const handleCopy = () => {
      if (generatedContent) {
          navigator.clipboard.writeText(generatedContent);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
      }
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-studio-in pb-10">
        <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-[2rem] p-6 space-y-6">
             <div className="flex flex-col items-center text-center">
                <div className="bg-[var(--bg-input)] p-3 rounded-xl mb-4">
                    <AtSymbolIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-[11px] font-black tracking-[0.2em] uppercase">Threads Architect</h3>
                <p className="text-[10px] text-[var(--text-muted)] mt-2 font-medium leading-relaxed opacity-60">
                    Engaging, persuasive written content with a clear narrative flow.
                </p>
            </div>

            <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Goal</label>
                        <select value={goal} onChange={(e) => setGoal(e.target.value)} className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-white rounded-xl p-3 text-[11px] font-medium transition-studio outline-none appearance-none">
                            <option>Drive Sales</option><option>Grow Followers</option><option>Build Community</option><option>Build Personal Brand</option>
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Format</label>
                        <select value={postType} onChange={(e) => setPostType(e.target.value)} className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-white rounded-xl p-3 text-[11px] font-medium transition-studio outline-none appearance-none">
                            <option>Single Thread Post</option><option>Morning Affirmation</option><option>Promotional Post</option><option>Mindset Memo</option>
                        </select>
                    </div>
                </div>
                
                <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Brand Voice</label>
                    <select value={brandVoice} onChange={(e) => setBrandVoice(e.target.value)} className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-white rounded-xl p-3 text-[11px] font-medium transition-studio outline-none appearance-none">
                        <option>Sophisticated & Elegant</option><option>Ambitious</option><option>Quiet Luxury</option><option>Direct & Persuasive</option>
                    </select>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Context / Narrative Flow</label>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Topic, ROI, automation details..." className="w-full h-24 bg-[var(--bg-input)] border border-[var(--border-color)] text-white rounded-xl p-4 text-[11px] font-medium focus:border-white transition-studio outline-none resize-none" />
                </div>

                <button onClick={handleGenerate} disabled={isLoading} className="w-full bg-white text-black font-black py-4 px-6 rounded-2xl transition-studio text-[11px] uppercase tracking-widest shadow-lg active:scale-[0.98] disabled:opacity-20 flex items-center justify-center gap-3">
                    {isLoading ? 'Architecting...' : <><AtSymbolIcon className="w-4 h-4" /> Build Narrative</>}
                </button>
            </div>
        </div>

        {generatedContent && (
            <div className="space-y-4 animate-slide-up">
                <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-[2rem] overflow-hidden shadow-premium">
                    <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                        <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Synthesized Output</h4>
                        <button onClick={handleCopy} className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all ${copied ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/10 text-white'}`}>{copied ? 'Copied' : 'Copy'}</button>
                    </div>
                    
                    <div className="p-6 space-y-4">
                        <div className="text-[12px] leading-relaxed text-[var(--text-main)] font-medium whitespace-pre-wrap opacity-90">{generatedContent}</div>
                        
                        <div className="pt-4 border-t border-white/5">
                             <button 
                                onClick={handleCritique} 
                                disabled={isLoading} 
                                className="w-full bg-white/5 hover:bg-white/10 text-white text-[9px] font-black uppercase tracking-widest py-3 rounded-xl flex items-center justify-center gap-2 border border-white/5 transition-all"
                            >
                                <EyeIcon className="w-3.5 h-3.5" /> Perform Deep Analysis
                            </button>
                        </div>
                    </div>
                </div>

                {critique && (
                    <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-[2rem] p-6 space-y-6 animate-slide-up shadow-premium">
                        <div className="flex items-center gap-2 text-emerald-400">
                            <LightBulbIcon className="w-4 h-4" />
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Deep Analysis Lens</h4>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest border-b border-emerald-400/20 pb-1 block">Strengths</span>
                                    <ul className="text-[10px] text-white/70 space-y-1.5 list-disc pl-3">
                                        {critique.strengths.map((s,i)=><li key={i}>{s}</li>)}
                                    </ul>
                                </div>
                                <div className="space-y-2">
                                    <span className="text-[9px] font-black text-red-400 uppercase tracking-widest border-b border-red-400/20 pb-1 block">Weaknesses</span>
                                    <ul className="text-[10px] text-white/70 space-y-1.5 list-disc pl-3">
                                        {critique.weaknesses.map((s,i)=><li key={i}>{s}</li>)}
                                    </ul>
                                </div>
                            </div>
                            
                            <div className="space-y-2 pt-2">
                                <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Style Alternatives</span>
                                <div className="flex flex-wrap gap-2">
                                    {critique.alternatives.map((a,i)=>(
                                        <span key={i} className="px-2 py-1 bg-purple-400/5 border border-purple-400/10 rounded text-[9px] text-purple-200">{a}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2 pt-2">
                                <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest block">Actionable Suggestions</span>
                                <ul className="text-[10px] text-blue-100/70 space-y-1.5 list-disc pl-3">
                                    {critique.suggestions.map((s,i)=><li key={i}>{s}</li>)}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}

        {error && <p className="text-red-400 text-[10px] font-black uppercase text-center">{error}</p>}
    </div>
  );
};

export default ThreadsGeneratorPanel;
