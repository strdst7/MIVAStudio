
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { MagicWandIcon, PhotoIcon, SparklesIcon, EyeIcon, ArrowDownTrayIcon, CheckCircleIcon, BookOpenIcon, SaveIcon } from './icons';
import Tooltip from './Tooltip';
import { enhanceUserPrompt, generateImageVariations, analyzePromptStructure, PromptAnalysisResult, StatusUpdate } from '../services/geminiService';
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
  handleOperation: (
    processName: string, 
    action: (onStatus: StatusUpdate) => Promise<any>, 
    successMessage?: string,
    initialSubMessage?: string
  ) => Promise<void>;
}

const GenerateImagePanel: React.FC<GenerateImagePanelProps> = ({
  onImageSelect,
  isLoading,
  initialPrompt,
  initialResolution,
  initialAspectRatio,
  identityImage,
  onOpenPromptBank,
  onSavePrompt,
  onSaveAssets,
  handleOperation
}) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [resolution, setResolution] = useState<'1K' | '2K' | '4K'>(initialResolution || '1K');
  const [aspectRatio, setAspectRatio] = useState(initialAspectRatio || '9:16');
  const [isCustomAspect, setIsCustomAspect] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [analysis, setAnalysis] = useState<PromptAnalysisResult | null>(null);
  const [generatedVariations, setGeneratedVariations] = useState<string[]>([]);

  useEffect(() => {
    setPrompt(initialPrompt);
  }, [initialPrompt]);

  const handleEnhance = () => {
    if (!prompt.trim()) return;
    handleOperation(
        'Refining Prompt Architecture...',
        async (onStatus) => {
            const enhanced = await enhanceUserPrompt(prompt, undefined, onStatus);
            setPrompt(enhanced);
            const result = await analyzePromptStructure(enhanced, undefined, onStatus);
            setAnalysis(result);
        }
    );
  };

  const handleAnalyze = () => {
    if (!prompt?.trim()) return;
    handleOperation(
        'Analyzing Prompt Logic...',
        async (onStatus) => {
            const result = await analyzePromptStructure(prompt, undefined, onStatus);
            setAnalysis(result);
        }
    );
  };

  const handleApplyOption = (optionPrompt: string) => {
      setPrompt(optionPrompt);
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

  const handleGenerate = () => {
      if (!prompt) return;
      handleOperation(
          'Synthesizing Assets...',
          async (onStatus) => {
              setGeneratedVariations([]);
              const results = await generateImageVariations(prompt, 3, identityImage, resolution, aspectRatio, onStatus);
              setGeneratedVariations(results);
          },
          'Variations generated successfully',
          'Accessing synthesis core...'
      );
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
                        Synthesize high-fidelity editorial assets with locked identity.
                    </p>
                </div>
            </div>

            <div className="space-y-3">
                <Tooltip text="Describe your visual concept in detail" position="top">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe your vision..."
                        className="w-full h-32 bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] rounded-2xl p-4 text-[12px] font-medium focus:border-white transition-studio outline-none resize-none placeholder:text-[var(--text-muted)]/30"
                        disabled={isLoading}
                    />
                </Tooltip>
                
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-1 bg-[var(--bg-input)] p-1 rounded-lg border border-[var(--border-color)]">
                            {['1K', '2K', '4K'].map(res => (
                                <Tooltip key={res} text={`Set target fidelity to ${res}`}>
                                    <button
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
                                </Tooltip>
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            <Tooltip text="Perform structural AI audit on prompt logic">
                                <button type="button" onClick={handleAnalyze} disabled={isLoading} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-color)] text-[10px] font-black text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all uppercase">
                                    <EyeIcon className="w-3.5 h-3.5 text-emerald-400" /> Analyze
                                </button>
                            </Tooltip>
                            <Tooltip text="Auto-refine for photorealistic editorial standards">
                                <button type="button" onClick={handleEnhance} disabled={isLoading} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-color)] text-[10px] font-black text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all uppercase">
                                    <MagicWandIcon className="w-3.5 h-3.5 text-purple-400" /> Enhance
                                </button>
                            </Tooltip>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Aspect Ratio</label>
                        <div className="flex flex-wrap gap-2">
                            {aspectRatios.map(ratio => (
                                <Tooltip key={ratio} text={`Set frame aspect to ${ratio}`}>
                                    <button
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
                                </Tooltip>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Insights Panel */}
            {analysis && (
                <div className="animate-slide-up bg-[var(--bg-input)] rounded-2xl border border-purple-500/20 p-4 space-y-4 shadow-xl">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                        <SparklesIcon className="w-4 h-4 text-purple-400" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-white">AI Studio Insights</h4>
                    </div>
                    
                    <div className="space-y-2">
                        <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Editorial Critique</p>
                        <p className="text-[10px] text-white/80 leading-relaxed italic border-l-2 border-purple-500/30 pl-3">
                            {analysis.critique}
                        </p>
                    </div>

                    {analysis.options.length > 0 && (
                        <div className="space-y-2 pt-2">
                            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Logic Variations</p>
                            <div className="grid gap-2">
                                {analysis.options.map((option, idx) => (
                                    <Tooltip key={idx} text="Click to apply this variation to main input">
                                        <button 
                                            onClick={() => handleApplyOption(option.prompt)}
                                            className="w-full text-left p-3 rounded-xl bg-[var(--bg-panel)] border border-white/5 hover:border-blue-400/30 transition-all group"
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[10px] font-black uppercase text-white group-hover:text-blue-400">{option.title}</span>
                                                <ArrowDownTrayIcon className="w-3 h-3 text-white/20 group-hover:text-blue-400" />
                                            </div>
                                            <p className="text-[9px] text-white/50 line-clamp-2 leading-relaxed">{option.prompt}</p>
                                        </button>
                                    </Tooltip>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {generatedVariations.length > 0 && (
                <div className="space-y-4 animate-fade-in">
                    <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest text-center">Select Variation</h4>
                    <div className="grid grid-cols-3 gap-3">
                        {generatedVariations.map((url, idx) => (
                            <Tooltip key={idx} text="Set as main workspace asset">
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
                            </Tooltip>
                        ))}
                    </div>
                    
                    <div className="flex gap-2">
                        <Tooltip text="Batch save all to library" className="flex-1">
                            <button 
                                onClick={handleSaveAll}
                                className="w-full py-3 bg-[var(--bg-input)] hover:bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--text-main)] transition-colors flex items-center justify-center gap-2"
                            >
                                <CheckCircleIcon className="w-4 h-4" /> Save All
                            </button>
                        </Tooltip>
                        <Tooltip text="Export all to disk" className="flex-1">
                            <button 
                                onClick={handleDownloadAll}
                                className="w-full py-3 bg-[var(--bg-input)] hover:bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--text-main)] transition-colors flex items-center justify-center gap-2"
                            >
                                <ArrowDownTrayIcon className="w-4 h-4" /> Export All
                            </button>
                        </Tooltip>
                    </div>
                </div>
            )}

            <Tooltip text="Initiate synthesis pipeline" position="top">
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !prompt}
                    className="w-full bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-black py-4 px-6 rounded-2xl transition-studio text-[11px] uppercase tracking-widest shadow-lg active:scale-[0.98] disabled:opacity-20 flex items-center justify-center gap-3"
                >
                    {isLoading ? 'Synthesizing...' : <><SparklesIcon className="w-4 h-4" /> Synthesize Asset</>}
                </button>
            </Tooltip>
        </div>

        <div className="flex gap-2">
             <Tooltip text="Open your logic repository" className="flex-1">
                 <button onClick={onOpenPromptBank} className="w-full py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-white transition-colors flex items-center justify-center gap-2">
                    <BookOpenIcon className="w-3.5 h-3.5" /> Open Bank
                 </button>
             </Tooltip>
             <Tooltip text="Archive current synthesis logic" className="flex-1">
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
