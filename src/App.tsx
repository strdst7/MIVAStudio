/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  generateFilteredImage, 
  generateAdjustedImage, 
  generateEnhancedDetailImage, 
  generateBackgroundRemovedImage, 
  generatePromptFromImage, 
  generateBackgroundReplacedImage, 
  generateUpscaledImage, 
  ImageAnalysisResult 
} from './services/geminiService';
import Header from './components/Header';
import Spinner from './components/Spinner';
import RemoveBackgroundPanel from './components/RemoveBackgroundPanel';
import FilterPanel from './components/FilterPanel';
import AdjustmentPanel from './components/AdjustmentPanel';
import DetailEnhancementPanel from './components/DetailEnhancementPanel';
import PromptClonerPanel from './components/PromptClonerPanel';
import GenerateImagePanel from './components/GenerateImagePanel';
import BatchPanel from './components/BatchPanel';
import ThreadsGeneratorPanel from './components/ThreadsGeneratorPanel';
import UpscalePanel from './components/UpscalePanel';
import PromptEnhancerPanel from './components/PromptEnhancerPanel';
import VideoGenerationPanel from './components/VideoGenerationPanel';
import UGCPanel from './components/UGCPanel';
import AvatarTwinPanel from './components/AvatarTwinPanel';
import IdentityVaultPanel from './components/IdentityVaultPanel';
import PromptBankPanel from './components/PromptBankPanel';
import AccountPanel from './components/AccountPanel';
import ActionToolbar from './components/ActionToolbar';
import LibraryPanel from './components/LibraryPanel';
import AssetDetailsPanel from './components/AssetDetailsPanel';
import { 
  XMarkIcon, UserIcon, PhotoIcon, VideoCameraIcon, PaletteIcon, 
  ScissorsIcon, StackIcon, MagicWandIcon, GridIcon, AtSymbolIcon,
  BookOpenIcon, ArrowLeftIcon, SparklesIcon, CubeIcon
} from './components/icons';
import StartScreen from './components/StartScreen';
import Tooltip from './components/Tooltip';
import { BatchItem, Asset, Collection, SavedPrompt } from './types';

const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, {type:mime});
}

export interface PreviewFilters {
  brightness: number; contrast: number; saturate: number; sepia: number; blur: number; hueRotate: number;
}

type Tab = 'identity' | 'avatar-twin' | 'generate' | 'video' | 'filter' | 'adjust' | 'detail' | 'remove-bg' | 'upscale' | 'batch' | 'prompt-cloner' | 'prompt-studio' | 'prompt-bank' | 'ugc' | 'threads' | 'account' | 'none';

const FeatureCard: React.FC<{ icon: React.ReactNode, name: string, desc: string, onClick: () => void, accent?: boolean }> = ({ icon, name, desc, onClick, accent }) => (
    <Tooltip text={desc} position="top" className="w-full h-full">
        <button 
            onClick={onClick}
            className={`group flex flex-col p-4 rounded-[var(--radius-xl)] border transition-studio text-left w-full relative overflow-hidden active:scale-95 min-h-[100px] ${accent ? 'bg-[var(--text-main)] text-[var(--bg-app)] border-[var(--text-main)] shadow-premium' : 'bg-[var(--bg-panel)] text-[var(--text-main)] border-[var(--border-color)] hover:border-[var(--text-muted)] shadow-sm hover:shadow-premium'}`}
        >
            <div className={`p-2 rounded-xl mb-auto transition-all w-fit ${accent ? 'bg-[var(--bg-app)] text-[var(--text-main)]' : 'bg-[var(--bg-input)] text-[var(--text-muted)] group-hover:text-[var(--text-main)]'}`}>
                {React.cloneElement(icon as React.ReactElement<any>, { className: "w-4 h-4" })}
            </div>
            <div className="z-10 mt-2">
                <h3 className="text-[10px] font-black tracking-[0.15em] uppercase mb-0.5">{name}</h3>
                <p className={`text-[9px] leading-relaxed opacity-50 group-hover:opacity-100 transition-opacity truncate w-full ${accent ? 'text-[var(--bg-app)]' : 'text-[var(--text-muted)]'}`}>{desc}</p>
            </div>
            <div className={`absolute -bottom-8 -right-8 w-24 h-24 blur-3xl rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-700 ${accent ? 'bg-[var(--text-main)]' : 'bg-[var(--text-muted)]'}`}></div>
        </button>
    </Tooltip>
);

const App: React.FC = () => {
  // State Management
  const [assets, setAssets] = useState<Asset[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeAssetId, setActiveAssetId] = useState<string | null>(null);
  
  // Prompt Bank State
  const [prompts, setPrompts] = useState<SavedPrompt[]>(() => {
    const saved = localStorage.getItem('miva_saved_prompts');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('miva_saved_prompts', JSON.stringify(prompts));
  }, [prompts]);
  
  // Undo/Redo History State
  const [historyStack, setHistoryStack] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const [activeView, setActiveView] = useState<'workspace' | 'library'>('workspace');
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showAssetDetails, setShowAssetDetails] = useState(false);
  
  const [generationPrompt, setGenerationPrompt] = useState<string>(''); 
  const [batchPrompt, setBatchPrompt] = useState<string>(''); 
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInteracting, setIsInteracting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('none');
  const [analysisResult, setAnalysisResult] = useState<ImageAnalysisResult | null>(null);
  const [batchQueue, setBatchQueue] = useState<BatchItem[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [previewFilters, setPreviewFilters] = useState<PreviewFilters>({ brightness: 100, contrast: 100, saturate: 100, sepia: 0, blur: 0, hueRotate: 0 });
  const [proxyUrl, setProxyUrl] = useState<string | null>(null);
  const [identityVaultImage, setIdentityVaultImage] = useState<File | null>(null);

  // Derived State
  const activeAsset = assets.find(a => a.id === activeAssetId) || null;
  const currentImage = activeAsset ? activeAsset.file : null;
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (activeAsset) {
      const url = activeAsset.url || URL.createObjectURL(activeAsset.file);
      setCurrentImageUrl(url);
      generateProxy(activeAsset.file);
      // Reset filters when switching assets unless it's a new generation based on old one? 
      // For now, reset to default to avoid confusion
      setPreviewFilters({ brightness: 100, contrast: 100, saturate: 100, sepia: 0, blur: 0, hueRotate: 0 });
    } else {
        setCurrentImageUrl(null);
        setProxyUrl(null);
    }
  }, [activeAssetId, activeAsset]);

  // Asset Helpers
  const generateProxy = async (file: File) => {
      try {
          const bitmap = await createImageBitmap(file);
          const canvas = document.createElement('canvas');
          const maxDim = 512;
          let width = bitmap.width;
          let height = bitmap.height;
          
          if (width > height) {
              if (width > maxDim) {
                  height = height * (maxDim / width);
                  width = maxDim;
              }
          } else {
              if (height > maxDim) {
                  width = width * (maxDim / height);
                  height = maxDim;
              }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(bitmap, 0, 0, width, height);
          setProxyUrl(canvas.toDataURL('image/jpeg', 0.8));
      } catch (e) {
          console.error("Failed to generate proxy", e);
          setProxyUrl(null);
      }
  };

  const createAsset = (file: File, module: string, prompt: string, type: 'image' | 'video' = 'image'): Asset => {
      const id = Date.now().toString();
      const url = URL.createObjectURL(file);
      return {
          id, file, type, url,
          name: `${module} ${new Date().toLocaleTimeString()}`,
          timestamp: Date.now(),
          module, prompt,
          identityId: identityVaultImage ? 'Identity Active' : undefined,
          metadata: { engine: 'MIVA v2.5 Obsidian', refinementApplied: false }
      };
  };

  const addAsset = (asset: Asset) => {
      setAssets(prev => [asset, ...prev]);
      const newHistory = historyStack.slice(0, historyIndex + 1);
      newHistory.push(asset.id);
      setHistoryStack(newHistory);
      setHistoryIndex(newHistory.length - 1);
      setActiveAssetId(asset.id);
      setActiveView('workspace');
      setActiveTab('none'); // Return to menu
  };

  const handleCreateCollection = (name: string) => {
    const newCollection: Collection = {
      id: Date.now().toString(),
      name,
      assetIds: [],
      createdAt: Date.now()
    };
    setCollections(prev => [...prev, newCollection]);
  };

  const handleAddToCollection = (asset: Asset) => {
    // Placeholder for actual collection logic
    console.log(`Adding ${asset.name} to collection`);
    setError(`Collection indexing for ${asset.name} is in progress.`);
    setTimeout(() => setError(null), 3000);
  };

  const handleDeleteCollection = (id: string) => {
    setCollections(prev => prev.filter(c => c.id !== id));
  };

  const handleUndo = () => {
      if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          setActiveAssetId(historyStack[newIndex]);
      }
  };

  const handleRedo = () => {
      if (historyIndex < historyStack.length - 1) {
          const newIndex = historyIndex + 1;
          setHistoryIndex(newIndex);
          setActiveAssetId(historyStack[newIndex]);
      }
  };

  const handleHomeClick = useCallback(() => {
    setActiveTab('none');
    setActiveView('workspace');
  }, []);

  const handleImageUpload = (files: FileList | null) => {
    if (files && files.length > 0) {
        const file = files[0];
        const asset = createAsset(file, 'Upload', 'Imported Asset');
        addAsset(asset);
        setActiveTab('none');
    }
  };

  const handleFeatureClick = (tab: Tab) => {
      setActiveTab(tab);
      setActiveView('workspace');
  };

  // Prompt Bank Logic
  const handleAddPrompt = (name: string, content: string, category: string) => {
    const newPrompt: SavedPrompt = {
        id: Date.now().toString(),
        name, content, category,
        createdAt: Date.now()
    };
    setPrompts(prev => [...prev, newPrompt]);
  };

  const handleDeletePrompt = (id: string) => setPrompts(prev => prev.filter(p => p.id !== id));
  const handleUpdatePrompt = (id: string, updates: Partial<SavedPrompt>) => {
      setPrompts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const handleUsePrompt = (content: string) => {
      setGenerationPrompt(content);
      setActiveTab('generate');
  };

  // Generation Wrappers
  const handleProcessBatch = async (selectedIds: string[], prompt: string) => {
    if (isBatchProcessing) return;
    setIsBatchProcessing(true);
    const currentQueue = [...batchQueue];
    
    for (const id of selectedIds) {
        const index = currentQueue.findIndex(item => item.id === id);
        if (index === -1) continue;
        currentQueue[index].status = 'processing';
        setBatchQueue([...currentQueue]);
        
        try {
            const resultUrl = await generateFilteredImage(currentQueue[index].file, prompt, identityVaultImage || undefined, true);
            const file = dataURLtoFile(resultUrl, `batch-${id}.png`);
            addAsset(createAsset(file, 'Batch Studio', prompt));
            currentQueue[index].status = 'success';
            currentQueue[index].resultUrl = resultUrl;
        } catch (e: any) {
            currentQueue[index].status = 'error';
            currentQueue[index].error = e.message;
        }
        setBatchQueue([...currentQueue]);
    }
    setIsBatchProcessing(false);
  };

  const renderFeatureGrid = () => (
    <div className="w-full px-2 py-4 space-y-8 animate-studio-in">
        {/* Tier 1 - Primary Creation */}
        <section className="space-y-4">
            <h4 className="text-[9px] font-black tracking-[0.3em] uppercase text-[var(--text-muted)] flex items-center gap-4">
                Generation <span className="h-[1px] bg-[var(--border-color)] flex-1"></span>
            </h4>
            <div className="grid grid-cols-2 gap-2">
                <FeatureCard icon={<UserIcon />} name="Identity Vault" desc="Lock architecture" onClick={() => handleFeatureClick('identity')} />
                <FeatureCard icon={<PhotoIcon />} name="Text to Asset" desc="PRO Image Gen" onClick={() => handleFeatureClick('generate')} accent />
                <FeatureCard icon={<VideoCameraIcon />} name="Cinema Engine" desc="Motion synthesis" onClick={() => handleFeatureClick('video')} />
                <FeatureCard icon={<MagicWandIcon />} name="Avatar Twin" desc="Style overlay" onClick={() => handleFeatureClick('avatar-twin')} />
            </div>
        </section>

        {/* Tier 2 - Refinement & Style */}
        <section className="space-y-4">
            <h4 className="text-[9px] font-black tracking-[0.3em] uppercase text-[var(--text-muted)] flex items-center gap-4">
                Refine <span className="h-[1px] bg-[var(--border-color)] flex-1"></span>
            </h4>
            <div className="grid grid-cols-2 gap-2">
                <FeatureCard icon={<PaletteIcon />} name="Style Engine" desc="Apply aesthetics" onClick={() => handleFeatureClick('filter')} />
                <FeatureCard icon={<CubeIcon />} name="Refinement" desc="Tone & depth" onClick={() => handleFeatureClick('adjust')} />
                <FeatureCard icon={<SparklesIcon />} name="Detail Deck" desc="Texture fidelity" onClick={() => handleFeatureClick('detail')} />
                <FeatureCard icon={<ScissorsIcon />} name="Isolation" desc="Extract subject" onClick={() => handleFeatureClick('remove-bg')} />
            </div>
        </section>

        {/* Tier 3 - Production Tools */}
        <section className="space-y-4">
            <h4 className="text-[9px] font-black tracking-[0.3em] uppercase text-[var(--text-muted)] flex items-center gap-4">
                Production <span className="h-[1px] bg-[var(--border-color)] flex-1"></span>
            </h4>
            <div className="grid grid-cols-2 gap-2">
                <FeatureCard icon={<GridIcon />} name="AI Upscale" desc="4K rendering" onClick={() => handleFeatureClick('upscale')} />
                <FeatureCard icon={<StackIcon />} name="Batch Studio" desc="Bulk process" onClick={() => handleFeatureClick('batch')} />
                <FeatureCard icon={<BookOpenIcon />} name="Prompt Bank" desc="Reuse logic" onClick={() => handleFeatureClick('prompt-bank')} />
                <FeatureCard icon={<SparklesIcon />} name="Studio Optic" desc="Optimize prompts" onClick={() => handleFeatureClick('prompt-studio')} />
            </div>
        </section>
        
        {/* Tier 4 - Narrative & Growth */}
        <section className="space-y-4">
            <h4 className="text-[9px] font-black tracking-[0.3em] uppercase text-[var(--text-muted)] flex items-center gap-4">
                Growth <span className="h-[1px] bg-[var(--border-color)] flex-1"></span>
            </h4>
            <div className="grid grid-cols-2 gap-2">
                <FeatureCard icon={<UserIcon />} name="UGC Director" desc="Briefs" onClick={() => handleFeatureClick('ugc')} />
                <FeatureCard icon={<AtSymbolIcon />} name="Threads" desc="Narrative" onClick={() => handleFeatureClick('threads')} />
                <FeatureCard icon={<AtSymbolIcon />} name="Asset Cloner" desc="Extract logic" onClick={() => handleFeatureClick('prompt-cloner')} />
            </div>
        </section>
    </div>
  );

  const getPanelContent = () => {
    switch(activeTab) {
        case 'none': return renderFeatureGrid();
        case 'identity': return <IdentityVaultPanel currentIdentity={identityVaultImage} onSaveIdentity={setIdentityVaultImage} />;
        case 'filter': return <FilterPanel currentImageUrl={currentImageUrl} onApplyFilter={async (p) => { setIsLoading(true); try { const r = await generateFilteredImage(currentImage!, p, identityVaultImage || undefined); addAsset(createAsset(dataURLtoFile(r, 'filter.png'), 'Style Engine', p)); } catch (e:any) { setError(e.message); } finally { setIsLoading(false); } }} onCloneStyle={(p) => { setBatchPrompt(p); setActiveTab('batch'); }} isLoading={isLoading} setIsInteracting={setIsInteracting} previewFilters={previewFilters} onUpdatePreview={(f) => setPreviewFilters(prev => ({...prev, ...f}))} onApplyPreview={() => {}} />;
        case 'adjust': return <AdjustmentPanel currentImageUrl={currentImageUrl} onApplyAdjustment={async (p) => { setIsLoading(true); try { const r = await generateAdjustedImage(currentImage!, p); addAsset(createAsset(dataURLtoFile(r, 'adjust.png'), 'Refinement Deck', p)); } catch (e:any) { setError(e.message); } finally { setIsLoading(false); } }} onCloneStyle={(p) => { setBatchPrompt(p); setActiveTab('batch'); }} isLoading={isLoading} setIsInteracting={setIsInteracting} previewFilters={previewFilters} onUpdatePreview={(f) => setPreviewFilters(prev => ({...prev, ...f}))} onApplyPreview={() => {}} />;
        case 'detail': return <DetailEnhancementPanel onApplyDetail={async (p) => { setIsLoading(true); try { const r = await generateEnhancedDetailImage(currentImage!, p); addAsset(createAsset(dataURLtoFile(r, 'detail.png'), 'Detail Enhancement', p)); } catch (e:any) { setError(e.message); } finally { setIsLoading(false); } }} onCloneStyle={(p) => { setBatchPrompt(p); setActiveTab('batch'); }} isLoading={isLoading} />;
        case 'remove-bg': return <RemoveBackgroundPanel onRemoveBackground={async () => { setIsLoading(true); try { const r = await generateBackgroundRemovedImage(currentImage!); addAsset(createAsset(dataURLtoFile(r, 'remove-bg.png'), 'Subject Isolation', 'Remove Background')); } catch (e:any) { setError(e.message); } finally { setIsLoading(false); } }} onReplaceBackground={async (p) => { setIsLoading(true); try { const r = await generateBackgroundReplacedImage(currentImage!, p); addAsset(createAsset(dataURLtoFile(r, 'replace-bg.png'), 'Subject Isolation', p)); } catch (e:any) { setError(e.message); } finally { setIsLoading(false); } }} isLoading={isLoading} />;
        case 'generate': return <GenerateImagePanel onImageSelect={(file) => { const asset = createAsset(file, 'Text to Asset', 'Generated Image'); addAsset(asset); }} isLoading={isLoading} initialPrompt={generationPrompt} identityImage={identityVaultImage || undefined} onOpenPromptBank={() => setActiveTab('prompt-bank')} onSavePrompt={(name, content) => handleAddPrompt(name, content, 'Subject')} />;
        case 'batch': return <BatchPanel queue={batchQueue} initialPrompt={batchPrompt} onAddToQueue={(f) => setBatchQueue([...batchQueue, ...f.map(file => ({ id: Math.random().toString(), file, status: 'pending' as const }))])} onRemoveFromQueue={(id) => setBatchQueue(batchQueue.filter(q => q.id !== id))} onProcessBatch={handleProcessBatch} isProcessing={isBatchProcessing} />;
        case 'prompt-cloner': return <PromptClonerPanel onGeneratePrompt={async () => { setIsLoading(true); try { const r = await generatePromptFromImage(currentImage!); setAnalysisResult(r); } catch (e:any) { setError(e.message); } finally { setIsLoading(false); } }} result={analysisResult} isLoading={isLoading} onUsePrompt={(p) => { setGenerationPrompt(p); setActiveTab('generate'); }} onSavePrompt={(name, content) => handleAddPrompt(name, content, 'Editorial')} />;
        case 'threads': return <ThreadsGeneratorPanel isLoading={isLoading} />;
        case 'ugc': return <UGCPanel currentImage={currentImage} onNavigateToGenerate={(p) => { setGenerationPrompt(p); setActiveTab('generate'); }} isLoading={isLoading} />;
        case 'upscale': return <UpscalePanel onUpscale={async (r) => { setIsLoading(true); try { const res = await generateUpscaledImage(currentImage!, r); addAsset(createAsset(dataURLtoFile(res, 'upscale.png'), 'AI Upscale', r)); } catch (e:any) { setError(e.message); } finally { setIsLoading(false); } }} isLoading={isLoading} />;
        case 'avatar-twin': return <AvatarTwinPanel currentImage={currentImage} onAvatarGenerated={(f) => addAsset(createAsset(f, 'Avatar Twin', 'Custom Avatar'))} isLoading={isLoading} />;
        case 'video': return <VideoGenerationPanel currentImage={currentImage} isLoading={isLoading} setGlobalLoading={setIsLoading} onVideoGenerated={(file, prompt) => addAsset(createAsset(file, 'Video Engine', prompt, 'video'))} />;
        case 'prompt-studio': return <PromptEnhancerPanel onUsePrompt={(p) => { setGenerationPrompt(p); setActiveTab('generate'); }} isLoading={isLoading} onSavePrompt={(name, content) => handleAddPrompt(name, content, 'Editorial')} />;
        case 'prompt-bank': return <PromptBankPanel prompts={prompts} onAddPrompt={handleAddPrompt} onDeletePrompt={handleDeletePrompt} onUpdatePrompt={handleUpdatePrompt} onUsePrompt={handleUsePrompt} />;
        case 'account': return <AccountPanel />;
        default: return renderFeatureGrid();
    }
  };

  const viewportWidthClass = {
      'desktop': 'w-full',
      'tablet': 'w-[768px] border-x border-[var(--border-color)]',
      'mobile': 'w-[375px] border-x border-[var(--border-color)]'
  }[viewport];

  const filterString = `brightness(${previewFilters.brightness}%) contrast(${previewFilters.contrast}%) saturate(${previewFilters.saturate}%) sepia(${previewFilters.sepia}%) blur(${previewFilters.blur}px) hue-rotate(${previewFilters.hueRotate}deg)`;

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-app)] text-[var(--text-main)] overflow-hidden font-sans selection:bg-[var(--accent-color)] selection:text-white">
        <Header 
            activeView={activeView}
            onLibraryClick={() => setActiveView(activeView === 'workspace' ? 'library' : 'workspace')}
            onHomeClick={handleHomeClick}
            onAccountClick={() => setActiveTab('account')}
            currentViewport={viewport}
            onViewportChange={setViewport}
        />
        
        <main className="flex-1 overflow-hidden relative flex">
            {activeView === 'library' ? (
                <LibraryPanel 
                    assets={assets}
                    collections={collections}
                    onSelectAsset={(asset) => {
                        setActiveAssetId(asset.id);
                        setActiveView('workspace');
                    }}
                    onDownloadAsset={(asset) => {
                         const a = document.createElement('a');
                         a.href = asset.url;
                         a.download = asset.name;
                         a.click();
                    }}
                    onDeleteCollection={handleDeleteCollection}
                    onCreateCollection={handleCreateCollection}
                />
            ) : (
                <>
                    {!activeAsset ? (
                        <StartScreen onFileSelect={handleImageUpload} onGenerateClick={() => setActiveTab('generate')} />
                    ) : (
                        <div className="flex h-full w-full animate-studio-in">
                            <div className={`flex-1 relative flex flex-col items-center justify-center p-12 overflow-hidden bg-[var(--bg-app)] transition-all duration-300`}>
                                <div className="absolute inset-0 drafting-grid"></div>
                                
                                <div className={`relative flex-1 flex flex-col justify-center items-center h-full transition-all duration-500 ${viewportWidthClass} bg-[var(--bg-app)] shadow-2xl`}>
                                    {currentImageUrl ? (
                                        <>
                                            <div className="relative group p-1 bg-[var(--border-color)] rounded-[var(--radius-2xl)] shadow-premium transition-all duration-500 hover:shadow-hover max-w-full">
                                                <div className="bg-[var(--bg-panel)] rounded-[calc(var(--radius-2xl)-4px)] overflow-hidden relative">
                                                    {activeAsset?.type === 'video' ? (
                                                        <video src={currentImageUrl} controls autoPlay loop className={`max-h-[72vh] w-auto max-w-full transition-all`} />
                                                    ) : (
                                                        <>
                                                            {/* Low-res Proxy for real-time interaction */}
                                                            {isInteracting && proxyUrl && (
                                                                <img 
                                                                    src={proxyUrl} 
                                                                    alt="Preview Proxy" 
                                                                    className="max-h-[72vh] w-auto max-w-full absolute inset-0 z-20 pointer-events-none"
                                                                    style={{ filter: filterString }}
                                                                />
                                                            )}
                                                            
                                                            {/* High-res Main Image */}
                                                            <img 
                                                              src={currentImageUrl} 
                                                              alt="Asset" 
                                                              className={`max-h-[72vh] w-auto max-w-full transition-all ${isInteracting ? 'opacity-0' : 'opacity-100'}`} 
                                                              style={{ filter: filterString }} 
                                                            />
                                                        </>
                                                    )}
                                                </div>
                                                {isLoading && <div className="absolute inset-0 bg-black/50 backdrop-blur-md rounded-[var(--radius-2xl)] flex items-center justify-center z-20"><Spinner /></div>}
                                            </div>
                                            <ActionToolbar 
                                                currentImage={currentImage} 
                                                onToggleDetails={() => setShowAssetDetails(!showAssetDetails)} 
                                                onUndo={handleUndo} 
                                                onRedo={handleRedo} 
                                                canUndo={historyIndex > 0} 
                                                canRedo={historyIndex < historyStack.length - 1} 
                                            />
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center opacity-10 select-none">
                                            <PhotoIcon className="w-20 h-20 mb-6 text-[var(--text-main)]" />
                                            <p className="text-[11px] font-black uppercase tracking-[0.5em] text-[var(--text-main)]">Studio Ready</p>
                                        </div>
                                    )}
                                </div>
                                
                                {activeTab !== 'none' && (
                                    <button onClick={() => setActiveTab('none')} className="absolute top-10 left-10 p-3.5 rounded-full bg-[var(--bg-panel)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-studio border border-[var(--border-color)] shadow-premium z-40">
                                        <ArrowLeftIcon className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                            
                            <aside className="w-[440px] h-full bg-[var(--bg-sidebar)] border-l border-[var(--border-color)] overflow-y-auto custom-scrollbar p-8 shrink-0 relative z-30 shadow-[-20px_0_60px_rgba(0,0,0,0.1)]">
                                {getPanelContent()}
                            </aside>

                            {showAssetDetails && activeAsset && (
                                <AssetDetailsPanel 
                                    asset={activeAsset} 
                                    onClose={() => setShowAssetDetails(false)}
                                    onEdit={(asset) => {
                                        // Load asset into active editing flow
                                        setActiveAssetId(asset.id);
                                        setActiveTab('filter');
                                        setShowAssetDetails(false);
                                    }}
                                    onDuplicate={(asset) => {
                                        const newAsset = { ...asset, id: Date.now().toString(), name: `${asset.name} (Copy)` };
                                        addAsset(newAsset);
                                    }}
                                    onDownload={(asset) => {
                                         const a = document.createElement('a');
                                         a.href = asset.url;
                                         a.download = asset.name;
                                         a.click();
                                    }}
                                    onDelete={(id) => {
                                        setAssets(prev => prev.filter(a => a.id !== id));
                                        if (activeAssetId === id) setActiveAssetId(null);
                                        setShowAssetDetails(false);
                                    }}
                                    onAddToCollection={handleAddToCollection}
                                />
                            )}
                        </div>
                    )}
                </>
            )}
        </main>
        
        {error && (
            <div className="fixed bottom-10 right-10 z-[100] bg-red-500 text-white px-6 py-4 rounded-xl shadow-2xl animate-slide-up flex items-center gap-3">
                <XMarkIcon className="w-5 h-5" />
                <div>
                    <p className="text-[11px] font-black uppercase tracking-widest">System Error</p>
                    <p className="text-[10px] opacity-90">{error}</p>
                </div>
                <button onClick={() => setError(null)} className="ml-4 hover:opacity-50"><XMarkIcon className="w-4 h-4" /></button>
            </div>
        )}
    </div>
  );
};

export default App;