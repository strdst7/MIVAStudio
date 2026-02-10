
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { MagicWandIcon, LightBulbIcon, PhotoIcon, SparklesIcon, EyeIcon, ArrowDownTrayIcon, CheckCircleIcon, DocumentDuplicateIcon, SettingsIcon, BookOpenIcon, SaveIcon } from './icons';
import Tooltip from './Tooltip';
import { enhanceUserPrompt, generateImageVariations, analyzePromptStructure, PromptAnalysisResult } from '../services/geminiService';
import SavePromptDialog from './SavePromptDialog';

interface GenerateImagePanelProps {
  onImageSelect: (file: File) => void;
  isLoading: boolean;
  initialPrompt: string;
  initialResolution?: '1K' | '2K' | '4K';
  initialAspectRatio?: string;
  identityImage?: File;
  onOpenPromptBank: () => void;
  onSavePrompt: (name: string, content: string, category: string, settings?: any) => void;
  setGlobalLoading?: (loading: boolean) => void;
  setLoadingMessage?: (msg: string) => void;
  setLoadingSubMessage?: (msg: string) => void;
  onSaveAssets?: (files: File[]) => void;
}

const GenerateImagePanel: React.FC<GenerateImagePanelProps> = ({
  onImageSelect,
  isLoading: parentLoading,
  initialPrompt,
  initialResolution,
  initialAspectRatio,
  identityImage,
  onOpenPromptBank,
  onSavePrompt,
  setGlobalLoading,
  setLoadingMessage,
  setLoadingSubMessage,
  onSaveAssets
}) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolution, setResolution] = useState<'1K' | '2K' | '4K'>(initialResolution || '1K');
  const [aspectRatio, setAspectRatio] = useState(initialAspectRatio || '9:16');
  const [isCustomAspect, setIsCustomAspect] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  
  // Analysis State
  const [analysis, setAnalysis] = useState<PromptAnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  
  // Variations State
  const [generatedVariations, setGeneratedVariations] = useState<string[]>([]);

  const isLoading = parentLoading || localLoading || analyzing;

  useEffect(() => {
    setPrompt(initialPrompt);
  }, [initialPrompt]);

  useEffect(() => {
      if (initialResolution) setResolution(initialResolution);
      if (initialAspectRatio) {
          setAspectRatio(initialAspectRatio);
          // Check if aspect ratio is custom
          if (!['1:1', '16:9', '9:16', '4:3', '3:4'].includes(initialAspectRatio)) {
              setIsCustomAspect(true);
          } else {
              setIsCustomAspect(false);
          }
      }
  }, [initialResolution, initialAspectRatio]);

  const handleEnhance = async () => {
    if (!prompt) return;
    setLocalLoading(true);
    setAnalysis(null);
    try {
      const enhanced = await enhanceUserPrompt(prompt);
      setPrompt(enhanced);
      // Auto-analyze the enhanced prompt to provide style suggestions
      const result = await analyzePromptStructure(enhanced);
      setAnalysis(result);
    } catch (e) {
      console.error(e);
      setError("Failed to enhance prompt");
    } finally {
      setLocalLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!prompt?.trim()) return;
    setAnalyzing(true);
    setError(null);
    setAnalysis(null);
    
    try {
        const result = await analyzePromptStructure(prompt);
        setAnalysis(result);
    } catch (err) {
        console.error(err);
        setError("Analysis engine unavailable.");
    } finally {
        setAnalyzing(false);
    }
  };

  const handleSuggest = async () => {
     if (!prompt?.trim()) {
         const suggestions = [
             "Cinematic lighting, 8k resolution, photorealistic portrait of a woman in a neon-lit city street at night, rain reflections, 85mm lens.",
             "Minimalist architectural interior, soft natural light, concrete texture, indoor plants, wide angle.",
             "High fashion editorial shot, avant-garde makeup, studio lighting, bold colors, sharp focus."
         ];
         setPrompt(suggestions[Math.floor(Math.random() * suggestions.length)]);
     } else {
         handleAnalyze();
     }
  };

  const handleApplyOption = (optionPrompt: string) => {
      setPrompt(optionPrompt);
      setAnalysis(null); 
  };

  const dataURLtoFile = (dataurl: string, filename: string): File => {
        const arr = dataurl.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while(n--) u8arr[n] = bstr.charCodeAt(n);
        return new File([u8arr], filename, {type:mime});
  };

  const handleGenerate = async () => {
      if (!prompt) return;
      setError(null);
      setAnalysis(null); 
      setGeneratedVariations([]);
      
      if (setGlobalLoading) setGlobalLoading(true);
      else setLocalLoading(true);

      if (setLoadingMessage) setLoadingMessage('Initializing synthesis core...');
      if (setLoadingSubMessage) setLoadingSubMessage(`Generating 3 ${resolution} variations...`);

      try {
          // Pass aspectRatio to the service
          const results = await generateImageVariations(prompt, 3, identityImage, resolution, aspectRatio);
          setGeneratedVariations(results);
      } catch (e: any) {
          setError(e.message || "Generation failed");
      } finally {
          if (setGlobalLoading) setGlobalLoading(false);
          else setLocalLoading(false);
          if (setLoadingMessage) setLoadingMessage('Processing...');
          if (setLoadingSubMessage) setLoadingSubMessage('');
      }
  };

  const handleSelectVariation = (url: string, index: number) => {
      const file = dataURLtoFile(url, `generated-variation-${index}-${Date.now()}.png`);
      onImageSelect(file);
  };

  const handleSaveAll = () => {
      if (generatedVariations.length > 0 && onSaveAssets) {
          const files = generatedVariations.map((url, idx) => 
              dataURLtoFile(url, `variation-${idx}-${Date.now()}.png`)
          );
          onSaveAssets(files);
      }
  };

  const handleDownloadAll = () => {
      generatedVariations.forEach((url, idx) => {
          const a = document.createElement('a');
          a.href = url;
          a.download = `miva-variation-${idx}-${Date.now()}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
      });
  };

  const handleSavePrompt = (name: string, category: string) => {
      onSavePrompt(name, prompt, category, { resolution, aspectRatio });
  };

  const aspectRatios = ['1:1', '16:9', '9:16', '4:3', '3:4'];

  return (
    <div className="w-full flex flex-col gap-6 animate-studio-in pb-10">
        <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-[2rem] p-6 space-y-6 shadow-premium">
            <div className="flex flex-col items-center gap-4">
                <div className="bg-[var(--bg-input)] p-4 rounded-[1.2rem] border border-[var(--border-color)]">
                    <PhotoIcon className="w-6 h-6 text-[var(--text-main)]" />
                </div>
                <div className="text-center space-y-1">
                    <h3 className="text-[11px] font-black tracking-[0.2em] uppercase">Text to Asset</h3>
                    <p className="text-[10px] text-[var(--text-muted)] font-medium leading-relaxed opacity-60">
                        Generate high-fidelity assets with 3 variations.
                    </p>
                </div>
            </div>

            <div className="space-y-3">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your vision..."
                    className="w-full h-32 bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] rounded-2xl p-4 text-[12px] font-medium focus:border-white transition-studio outline-none resize-none placeholder:text-[var(--text-muted)]/30"
                    disabled={isLoading}
                />
                
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-1 bg-[var(--bg-input)] p-1 rounded-lg border border-[var(--border-color)]">
                            {['1K', '2K', '4K'].map(res => (
                                <button
                                    key={res}
                                    onClick={() => setResolution(res as any)}
                                    disabled={isLoading}
                                    className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${
                                        resolution === res 
                                        ? 'bg-[var(--text-main)] text-[var(--bg-app)] shadow-sm' 
                                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                                    }`}
                                >
                                    {res}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            <Tooltip text="Analyze prompt structure & get suggestions">
                                <button type="button" onClick={handleAnalyze} disabled={isLoading} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-color)] text-[10px] font-black text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all uppercase">
                                    <EyeIcon className="w-3.5 h-3.5 text-emerald-400" /> Analyze
                                </button>
                            </Tooltip>
                            <div className="w-px h-3 bg-[var(--border-color)]"></div>
                            <Tooltip text="Auto-enhance for clarity, detail, and effectiveness">
                                <button type="button" onClick={handleEnhance} disabled={isLoading} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-color)] text-[10px] font-black text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all uppercase">
                                    <MagicWandIcon className="w-3.5 h-3.5 text-blue-400" /> Enhance
                                </button>
                            </Tooltip>
                            <Tooltip text="Get photorealistic variations">
                                <button type="button" onClick={handleSuggest} disabled={isLoading} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-color)] text-[10px] font-black text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all uppercase">
                                    <LightBulbIcon className="w-3.5 h-3.5 text-amber-400" /> Inspire
                                </button>
                            </Tooltip>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Aspect Ratio</label>
                        <div className="flex flex-wrap gap-2">
                            {aspectRatios.map(ratio => (
                                <button
                                    key={ratio}
                                    onClick={() => { setAspectRatio(ratio); setIsCustomAspect(false); }}
                                    disabled={isLoading}
                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${
                                        aspectRatio === ratio && !isCustomAspect
                                        ? 'bg-[var(--text-main)] text-[var(--bg-app)] border-[var(--text-main)] shadow-sm'
                                        : 'bg-[var(--bg-input)] text-[var(--text-muted)] border-[var(--border-color)] hover:border-[var(--text-muted)]'
                                    }`}
                                >
                                    {ratio}
                                </button>
                            ))}
                            <button
                                onClick={() => setIsCustomAspect(true)}
                                disabled={isLoading}
                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border flex items-center gap-1 ${
                                    isCustomAspect
                                    ? 'bg-[var(--text-main)] text-[var(--bg-app)] border-[var(--text-main)] shadow-sm'
                                    : 'bg-[var(--bg-input)] text-[var(--text-muted)] border-[var(--border-color)] hover:border-[var(--text-muted)]'
                                }`}
                            >
                                <SettingsIcon className="w-3 h-3" /> Custom
                            </button>
                        </div>
                        {isCustomAspect && (
                            <div className="animate-slide-up mt-1">
                                <input 
                                    type="text" 
                                    value={aspectRatio} 
                                    onChange={(e) => setAspectRatio(e.target.value)} 
                                    placeholder="e.g. 2.35:1 or 5:4"
                                    className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl p-2.5 text-[11px] font-mono focus:border-white transition-studio outline-none"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {generatedVariations.length > 0 && (
                <div className="space-y-4 animate-fade-in">
                    <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest text-center">Select Variation</h4>
                    <div className="grid grid-cols-3 gap-3">
                        {generatedVariations.map((url, idx) => (
                            <button 
                                key={idx} 
                                onClick={() => handleSelectVariation(url, idx)}
                                className="relative aspect-square rounded-xl overflow-hidden border border-[var(--border-color)] hover:border-[var(--text-main)] transition-all group focus:outline-none focus:ring-2 focus:ring-[var(--text-main)]"
                            >
                                <img src={url} alt={`Variation ${idx+1}`} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-[9px] font-black text-white uppercase tracking-widest bg-black/50 px-2 py-1 rounded">Select</span>
                                </div>
                            </button>
                        ))}
                    </div>
                    
                    <div className="flex gap-2">
                        {onSaveAssets && (
                            <button 
                                onClick={handleSaveAll}
                                className="flex-1 py-3 bg-[var(--bg-input)] hover:bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--text-main)] transition-colors flex items-center justify-center gap-2"
                            >
                                <CheckCircleIcon className="w-4 h-4" /> Save All
                            </button>
                        )}
                        <button 
                            onClick={handleDownloadAll}
                            className="flex-1 py-3 bg-[var(--bg-input)] hover:bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--text-main)] transition-colors flex items-center justify-center gap-2"
                        >
                            <ArrowDownTrayIcon className="w-4 h-4" /> Download All
                        </button>
                    </div>
                </div>
            )}

            {/* Analysis Result Panel */}
            {analysis && (
                <div className="animate-slide-up bg-[var(--bg-input)] rounded-2xl border border-[var(--border-color)] p-4 space-y-4">
                    <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-2 mb-2">
                        <SparklesIcon className="w-4 h-4 text-purple-400" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)]">AI Enhancement Analysis</h4>
                    </div>
                    
                    <div className="space-y-2">
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wide">Studio Critique</p>
                        <p className="text-[10px] text-[var(--text-main)] leading-relaxed italic opacity-80 border-l-2 border-purple-400 pl-3 py-1">
                            "{analysis.critique}"
                        </p>
                    </div>

                    <div className="space-y-2 pt-2">
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wide">Style Variations</p>
                        <div className="grid gap-2">
                            {analysis.options.map((option, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => handleApplyOption(option.prompt)}
                                    className="text-left p-3 rounded-xl bg-[var(--bg-panel)] border border-[var(--border-color)] hover:border-purple-400/50 hover:bg-purple-500/5 transition-all group"
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] font-black uppercase text-[var(--text-main)]">{option.title}</span>
                                        <ArrowDownTrayIcon className="w-3 h-3 text-[var(--text-muted)] group-hover:text-purple-400" />
                                    </div>
                                    <p className="text-[9px] text-[var(--text-muted)] line-clamp-2 leading-relaxed">{option.prompt}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <Tooltip text="Generate 3 variations from prompt">
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !prompt}
                    className="w-full bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-black py-4 px-6 rounded-2xl transition-studio text-[11px] uppercase tracking-widest shadow-lg active:scale-[0.98] disabled:opacity-20 flex items-center justify-center gap-3"
                >
                    {isLoading ? 'Synthesizing...' : <><SparklesIcon className="w-4 h-4" /> Synthesize Asset</>}
                </button>
            </Tooltip>
            
            {error && <p className="text-red-400 text-[10px] text-center font-bold">{error}</p>}
        </div>

        <div className="flex gap-2">
             <Tooltip text="Browse saved prompts" className="flex-1">
                 <button onClick={onOpenPromptBank} className="w-full py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-white transition-colors flex items-center justify-center gap-2">
                    <BookOpenIcon className="w-3.5 h-3.5" /> Open Bank
                 </button>
             </Tooltip>
             <Tooltip text="Save prompt logic & settings" className="flex-1">
                 <button onClick={() => setShowSaveDialog(true)} className="w-full py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-white transition-colors flex items-center justify-center gap-2">
                    <SaveIcon className="w-3.5 h-3.5" /> Save Logic
                 </button>
             </Tooltip>
        </div>

        <SavePromptDialog 
            isOpen={showSaveDialog}
            onClose={() => setShowSaveDialog(false)}
            onSave={handleSavePrompt}
        />
    </div>
  );
};

export default GenerateImagePanel;
