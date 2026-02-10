
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
  BookOpenIcon, ArrowLeftIcon, SparklesIcon, CubeIcon, CheckCircleIcon, InfoIcon
} from './components/icons';
import StartScreen from './components/StartScreen';
import Tooltip from './components/Tooltip';
import { BatchItem, Asset, Collection, SavedPrompt } from './types';

const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    // Check if match exists before accessing index 1
    const match = arr[0].match(/:(.*?);/);
    const mime = match ? match[1] : 'image/png';
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
            className={`group flex flex-col p-3 rounded-[var(--radius-xl)] border transition-studio text-left w-full relative overflow-hidden active:scale-95 min-h-[90px] ${accent ? 'bg-[var(--text-main)] text-[var(--bg-app)] border-[var(--text-main)] shadow-premium' : 'bg-[var(--bg-panel)] text-[var(--text-main)] border-[var(--border-color)] hover:border-[var(--text-muted)] shadow-sm hover:shadow-premium'}`}
        >
            <div className={`p-1.5 rounded-lg mb-auto transition-all w-fit ${accent ? 'bg-[var(--bg-app)] text-[var(--text-main)]' : 'bg-[var(--bg-input)] text-[var(--text-muted)] group-hover:text-[var(--text-main)]'}`}>
                {React.cloneElement(icon as React.ReactElement<any>, { className: "w-3.5 h-3.5" })}
            </div>
            <div className="z-10 mt-3">
                <h3 className="text-[9px] font-black tracking-[0.2em] uppercase mb-0.5 leading-none">{name}</h3>
                <p className={`text-[8px] leading-relaxed opacity-50 group-hover:opacity-100 transition-opacity truncate w-full ${accent ? 'text-[var(--bg-app)]' : 'text-[var(--text-muted)]'}`}>{desc}</p>
            </div>
            <div className={`absolute -bottom-6 -right-6 w-20 h-20 blur-2xl rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-700 ${accent ? 'bg-[var(--text-main)]' : 'bg-[var(--text-muted)]'}`}></div>
        </button>
    </Tooltip>
);

const IDENTITY_LOCK_BLOCK = `Use <<REFERENCE_FACE_IMAGE>> as the ONLY identity reference.
Lock facial structure, bone geometry, eye shape, nose, lips, skin tone, and proportions EXACTLY.
No face swapping, no beautification drift, no age change.
Maintain identical identity across all outputs.
Photorealistic skin texture, natural pores, real human realism.`;

const DEFAULT_PROMPTS: SavedPrompt[] = [
  {
    id: 'default-1',
    name: 'Hijab: Old Money Signature',
    category: 'Hijab Lifestyle',
    content: `${IDENTITY_LOCK_BLOCK}

Appearance:
Hijab worn with old-money restraint — smooth drape, no excessive volume,
neutral silk or fine chiffon, timeless coverage style.

Outfit:
Tailored blazer or fluid long dress in ivory, stone, camel, or soft grey.
Natural fabrics: silk, wool, linen blend.
No logos, no prints, no trend silhouettes.

Setting:
Sunlit European-style café terrace or refined interior with stone, wood, linen.
Nothing flashy. Everything intentional.

Mood & Body Language:
Calm, self-possessed, unbothered confidence.
Soft gaze, relaxed posture, quiet authority.

Camera:
85mm lens, f1.8, natural light, shallow depth of field.
Editorial lifestyle realism, muted warm tones.`,
    createdAt: Date.now()
  },
  {
    id: 'default-2',
    name: 'UGC: The \'Essential\' Hero',
    category: 'UGC Product',
    content: `${IDENTITY_LOCK_BLOCK}

Action:
Subject holding a generic glass serum bottle against a textured travertine stone background.
Hand position is relaxed, fingers elongated, demonstrating the product with grace, not aggression.

Outfit:
Sleeve of a chunky cream knit sweater visible. Minimal gold ring.

Lighting & Mood:
Soft morning light casting gentle leaf shadows.
Quiet luxury aesthetic. The focus is on the ritual of skincare.
Facial expression is calm, looking at the product with quiet appreciation.
No direct eye contact with camera.

Tech Specs:
Macro focus on texture. 50mm lens. Depth of field blurs the background.`,
    createdAt: Date.now()
  },
  {
    id: 'default-3',
    name: 'Editorial Detail: Cashmere & Gold',
    category: 'Editorial Detail',
    content: `${IDENTITY_LOCK_BLOCK}

Composition:
Close-up shot focusing on the tactile quality of a beige cashmere coat.
Subject's hand is resting on the lapel, showcasing a sheer nude manicure and a thin gold bracelet.

Aesthetic:
Monochromatic beige/oatmeal palette.
High-fidelity texture rendering (fabric weave, skin pores, metal reflection).

Lighting:
Diffused studio daylight. Soft shadows.
Evokes a feeling of warmth and expensive comfort.`,
    createdAt: Date.now()
  },
  {
    id: 'default-4',
    name: 'UGC: The \'Quiet\' Reveal',
    category: 'UGC Lifestyle',
    content: `${IDENTITY_LOCK_BLOCK}

Action:
Subject seated at a white marble table, lifting the lid of a rigid matte white box.
No exaggerated "shock" face.
Expression is a subtle, knowing half-smile. A look of satisfaction and validation.

Setting:
Minimalist apartment background, blurred.
Vase with dry branches in the distance.

Style:
Wearing a charcoal silk blouse. Hair pulled back.
The vibe is "I expected quality, and I received it."`,
    createdAt: Date.now()
  },
  {
    id: 'default-5',
    name: 'Lifestyle: The Executive Flow',
    category: 'Business Lifestyle',
    content: `${IDENTITY_LOCK_BLOCK}

Scene:
Subject seated at a glass desk in a high-end home office. Profile view.
Typing on a laptop, gaze intense but calm.
A ceramic cup and a leather notebook on the desk. No clutter.

Outfit:
Structured black blazer, white t-shirt underneath.
Simple diamond stud earrings.

Atmosphere:
Cool, professional color grading.
Background is a blurred bookshelf or city view through a window.
Represents "Deep Work" and financial freedom.`,
    createdAt: Date.now()
  },
  {
    id: 'default-6',
    name: 'Wellness: Morning Clarity',
    category: 'Wellness',
    content: `${IDENTITY_LOCK_BLOCK}

Scene:
Subject standing by a floor-to-ceiling sheer curtain, holding a ceramic tea cup with both hands.
Looking out at a city skyline or garden (out of focus).
Soft rim lighting catching the edge of the hair and face.

Outfit:
White silk robe or high-end loungewear.

Mood:
Peaceful, grounded, unbothered.
Skin texture is dewy, hydrated, and natural.
The moment before the world wakes up.`,
    createdAt: Date.now()
  },
  // New UGC Prompts
  {
    id: 'ugc-7',
    name: 'UGC: Texture Fidelity',
    category: 'UGC Beauty',
    content: `${IDENTITY_LOCK_BLOCK}

Action:
Close-up macro shot of a finger swiping a rich cream texture on the back of a hand.
Focus is intense on the product viscocity and skin interaction.

Aesthetic:
Hyper-realistic skin texture, visible pores, no smoothing.
Background is a blurred beige stone surface.
Lighting emphasizes the sheen of the product and the hydration of the skin.
Quiet luxury vibes—clean, scientific, expensive.`,
    createdAt: Date.now()
  },
  {
    id: 'ugc-8',
    name: 'UGC: The Gold Standard',
    category: 'UGC Jewelry',
    content: `${IDENTITY_LOCK_BLOCK}

Action:
Subject's hands opening a small, matte neutral jewelry box.
Inside is a simple gold chain or ring.
Manicure is sheer nude/clean.

Lighting:
Soft window light from the side causing a glint on the gold.
Depth of field focuses sharply on the metal, soft falloff elsewhere.
Elegance and anticipation.`,
    createdAt: Date.now()
  },
  {
    id: 'ugc-9',
    name: 'UGC: Ritual Application',
    category: 'UGC Skincare',
    content: `${IDENTITY_LOCK_BLOCK}

Scene:
Side profile close-up. Subject holding a glass dropper near cheek.
Skin is fresh, no heavy makeup, just moisturizer.
Expression is serene, eyes slightly closed or looking down.

Setting:
Background is a clean, white marble bathroom wall, out of focus.
Feeling of self-care and daily routine.`,
    createdAt: Date.now()
  },
  {
    id: 'ugc-10',
    name: 'UGC: Morning Intent',
    category: 'UGC Lifestyle',
    content: `${IDENTITY_LOCK_BLOCK}

Action:
Hand holding a ceramic matcha bowl or coffee cup.
Steam rising (subtle).
Subject wearing a textured oatmeal knit sweater (sleeve visible).

Setting:
Sunlit breakfast nook. Linen tablecloth.
Shadows are crisp but airy (morning sun).
Ceramic texture is visible.`,
    createdAt: Date.now()
  },
  {
    id: 'ugc-11',
    name: 'UGC: Remote Elite',
    category: 'UGC Tech',
    content: `${IDENTITY_LOCK_BLOCK}

Composition:
Over-the-shoulder view of a laptop screen (content blurred) and a premium notebook.
Hand holding a pen, poised to write.
A glass of water with lemon nearby.

Atmosphere:
Productive, calm, focused.
Background suggests a high-end cafe or home office (blurred).
Neutral color palette: Greys, whites, blacks.`,
    createdAt: Date.now()
  },
  {
    id: 'ugc-12',
    name: 'UGC: Tactile Luxury',
    category: 'UGC Fashion',
    content: `${IDENTITY_LOCK_BLOCK}

Action:
Close crop of hand brushing against a high-quality wool coat or silk blouse.
Focus on the fabric weave and the interaction.

Aesthetic:
Sense of softness and quality.
Neutral/earthy tones (camel, beige, cream).
Slight movement blur to indicate touch.`,
    createdAt: Date.now()
  },
  {
    id: 'ugc-13',
    name: 'UGC: Transit Essentials',
    category: 'UGC Travel',
    content: `${IDENTITY_LOCK_BLOCK}

Scene:
A high-end leather tote bag resting on a designer chair.
A passport, sunglasses, and a leather notebook visible at the top.
Implies "ready to go" but without urgency.

Setting:
Blurred airport lounge or hotel lobby background.
Lighting is warm and inviting.`,
    createdAt: Date.now()
  },
  {
    id: 'ugc-14',
    name: 'UGC: Silent Approval',
    category: 'UGC Beauty',
    content: `${IDENTITY_LOCK_BLOCK}

Action:
Subject looking into a mirror, reflection visible.
Touching face gently.
Expression is one of quiet satisfaction with skin condition.

Aesthetic:
Soft, flattering bathroom lighting.
Clean lines, no product clutter.
Focus on the reflection's eyes and skin.`,
    createdAt: Date.now()
  },
  {
    id: 'ugc-15',
    name: 'UGC: Urban Flow',
    category: 'UGC Lifestyle',
    content: `${IDENTITY_LOCK_BLOCK}

Scene:
Waist-level shot of subject walking.
Holding a takeaway coffee cup (minimalist design) and a leather handbag.
Wearing tailored trousers.

Background:
City street with motion blur.
Sense of purpose and direction.
Cool urban tones.`,
    createdAt: Date.now()
  },
  {
    id: 'ugc-16',
    name: 'UGC: Evening Sanctuaries',
    category: 'UGC Home',
    content: `${IDENTITY_LOCK_BLOCK}

Action:
Hand lighting a candle on a bedside table.
Book lying open nearby.
Subject wearing silk sleeve.

Lighting:
Warm, dim lighting (golden/candlelight).
Atmosphere of peace and winding down.
Quiet luxury aesthetic.`,
    createdAt: Date.now()
  }
];

const App: React.FC = () => {
  // State Management
  const [assets, setAssets] = useState<Asset[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeAssetId, setActiveAssetId] = useState<string | null>(null);
  
  // Prompt Bank State
  const [prompts, setPrompts] = useState<SavedPrompt[]>(() => {
    try {
      const saved = localStorage.getItem('miva_saved_prompts');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PROMPTS;
      }
      return DEFAULT_PROMPTS;
    } catch (e) {
      console.warn("Failed to load prompts from storage (corrupted data), resetting to defaults.", e);
      localStorage.removeItem('miva_saved_prompts');
      return DEFAULT_PROMPTS;
    }
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
  const [generationSettings, setGenerationSettings] = useState<{resolution: '1K'|'2K'|'4K', aspectRatio: string}>({ resolution: '1K', aspectRatio: '9:16' });
  const [batchPrompt, setBatchPrompt] = useState<string>(''); 
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('Processing...');
  const [loadingSubMessage, setLoadingSubMessage] = useState<string>('');
  const [isInteracting, setIsInteracting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info'} | null>(null);
  
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

  // Global Notification Helper
  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
      setNotification({ message, type });
      setTimeout(() => setNotification(null), 3000);
  };

  const handleOperation = async (
      processName: string, 
      action: () => Promise<any>, 
      successMessage?: string,
      subMessage: string = 'Please wait while we process your request...'
  ) => {
      setIsLoading(true);
      setLoadingMessage(processName);
      setLoadingSubMessage(subMessage);
      try {
          await action();
          if (successMessage) showToast(successMessage, 'success');
      } catch (e: any) {
          console.error(e);
          setError(e.message || "Operation failed");
      } finally {
          setIsLoading(false);
          setLoadingMessage('Processing...');
          setLoadingSubMessage('');
      }
  };

  useEffect(() => {
    if (activeAsset) {
      const url = activeAsset.url || URL.createObjectURL(activeAsset.file);
      setCurrentImageUrl(url);
      generateProxy(activeAsset.file);
      setPreviewFilters({ brightness: 100, contrast: 100, saturate: 100, sepia: 0, blur: 0, hueRotate: 0 });
    } else {
        setCurrentImageUrl(null);
        setProxyUrl(null);
    }
  }, [activeAssetId, activeAsset]);

  // Asset Helpers
  const generateProxy = async (file: File) => {
      try {
          // Attempt to create a bitmap. If this fails (e.g. invalid format or corrupt data),
          // we catch the error and skip the proxy to avoid crashing.
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
          console.warn("Failed to generate proxy for visual preview", e);
          // Fallback: No proxy. The main image will still load via currentImageUrl
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
      setActiveTab('none'); 
  };

  const addAssets = (newAssets: Asset[]) => {
      setAssets(prev => [...newAssets, ...prev]);
      if (newAssets.length > 0) {
          const lastAsset = newAssets[0];
          const newHistory = historyStack.slice(0, historyIndex + 1);
          newHistory.push(lastAsset.id);
          setHistoryStack(newHistory);
          setHistoryIndex(newHistory.length - 1);
          setActiveAssetId(lastAsset.id);
          setActiveView('workspace');
      }
  };

  const handleCreateCollection = (name: string) => {
    const newCollection: Collection = {
      id: Date.now().toString(),
      name,
      assetIds: [],
      createdAt: Date.now()
    };
    setCollections(prev => [...prev, newCollection]);
    showToast(`Collection "${name}" created`);
  };

  const handleAddToCollection = (asset: Asset) => {
    showToast(`Asset "${asset.name}" bookmarked`);
  };

  const handleDeleteCollection = (id: string) => {
    setCollections(prev => prev.filter(c => c.id !== id));
    showToast('Collection deleted', 'info');
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

  const handleNewProject = useCallback(() => {
    setActiveAssetId(null);
    setActiveTab('none');
    setActiveView('workspace');
    setGenerationPrompt('');
    setBatchPrompt('');
    setBatchQueue([]);
    setAnalysisResult(null);
    setError(null);
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
  const handleAddPrompt = (name: string, content: string, category: string, settings?: SavedPrompt['settings']) => {
    const newPrompt: SavedPrompt = {
        id: Date.now().toString(),
        name, content, category,
        createdAt: Date.now(),
        settings
    };
    setPrompts(prev => [...prev, newPrompt]);
    showToast('Logic saved to Prompt Bank');
  };

  const handleDeletePrompt = (id: string) => {
      setPrompts(prev => prev.filter(p => p.id !== id));
      showToast('Prompt removed', 'info');
  };

  const handleUpdatePrompt = (id: string, updates: Partial<SavedPrompt>) => {
      setPrompts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const handleUsePrompt = (prompt: SavedPrompt) => {
      setGenerationPrompt(prompt.content);
      if (prompt.settings) {
          setGenerationSettings({
              resolution: prompt.settings.resolution || '1K',
              aspectRatio: prompt.settings.aspectRatio || '1:1'
          });
      }
      setActiveTab('generate');
  };

  // Generation Wrappers
  const handleProcessBatch = async (selectedIds: string[], prompt: string) => {
    if (isBatchProcessing) return;
    setIsBatchProcessing(true);
    const currentQueue = [...batchQueue];
    
    // We don't use handleOperation here because batch has its own progress UI
    
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
    showToast('Batch processing complete');
  };

  const handleSaveAssets = (files: File[]) => {
      const newAssets = files.map(file => createAsset(file, 'Text to Asset', 'Batch Saved Variation'));
      addAssets(newAssets);
      showToast(`${files.length} assets saved to library`);
  };

  // Optimized Render Feature Grid
  const renderFeatureGrid = () => (
    <div className="w-full space-y-6 animate-studio-in pb-6">
        <section className="space-y-3">
            <h4 className="text-[9px] font-black tracking-[0.2em] uppercase text-[var(--text-muted)] flex items-center gap-3 opacity-60">
                Synthesis <span className="h-px bg-[var(--border-color)] flex-1"></span>
            </h4>
            <div className="grid grid-cols-2 gap-2">
                <FeatureCard icon={<UserIcon />} name="Identity Vault" desc="Lock architecture" onClick={() => handleFeatureClick('identity')} />
                <FeatureCard icon={<PhotoIcon />} name="Text to Asset" desc="PRO Image Gen" onClick={() => handleFeatureClick('generate')} accent />
                <FeatureCard icon={<VideoCameraIcon />} name="Cinema Engine" desc="Motion synthesis" onClick={() => handleFeatureClick('video')} />
                <FeatureCard icon={<MagicWandIcon />} name="Avatar Twin" desc="Style overlay" onClick={() => handleFeatureClick('avatar-twin')} />
            </div>
        </section>

        <section className="space-y-3">
            <h4 className="text-[9px] font-black tracking-[0.2em] uppercase text-[var(--text-muted)] flex items-center gap-3 opacity-60">
                Refinement <span className="h-px bg-[var(--border-color)] flex-1"></span>
            </h4>
            <div className="grid grid-cols-2 gap-2">
                <FeatureCard icon={<PaletteIcon />} name="Style Engine" desc="Apply aesthetics" onClick={() => handleFeatureClick('filter')} />
                <FeatureCard icon={<CubeIcon />} name="Adjustment" desc="Tone & depth" onClick={() => handleFeatureClick('adjust')} />
                <FeatureCard icon={<SparklesIcon />} name="Detail Deck" desc="Texture fidelity" onClick={() => handleFeatureClick('detail')} />
                <FeatureCard icon={<ScissorsIcon />} name="Isolation" desc="Extract subject" onClick={() => handleFeatureClick('remove-bg')} />
            </div>
        </section>

        <section className="space-y-3">
            <h4 className="text-[9px] font-black tracking-[0.2em] uppercase text-[var(--text-muted)] flex items-center gap-3 opacity-60">
                Production <span className="h-px bg-[var(--border-color)] flex-1"></span>
            </h4>
            <div className="grid grid-cols-2 gap-2">
                <FeatureCard icon={<GridIcon />} name="AI Upscale" desc="4K rendering" onClick={() => handleFeatureClick('upscale')} />
                <FeatureCard icon={<StackIcon />} name="Batch Studio" desc="Bulk process" onClick={() => handleFeatureClick('batch')} />
                <FeatureCard icon={<BookOpenIcon />} name="Prompt Bank" desc="Reuse logic" onClick={() => handleFeatureClick('prompt-bank')} />
                <FeatureCard icon={<SparklesIcon />} name="Studio Optic" desc="Optimize prompts" onClick={() => handleFeatureClick('prompt-studio')} />
            </div>
        </section>
        
        <section className="space-y-3">
            <h4 className="text-[9px] font-black tracking-[0.2em] uppercase text-[var(--text-muted)] flex items-center gap-3 opacity-60">
                Growth <span className="h-px bg-[var(--border-color)] flex-1"></span>
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
        
        case 'filter': return <FilterPanel 
            currentImageUrl={currentImageUrl} 
            onApplyFilter={(p) => handleOperation('Applying Aesthetic...', async () => {
                const r = await generateFilteredImage(currentImage!, p, identityVaultImage || undefined); 
                addAsset(createAsset(dataURLtoFile(r, 'filter.png'), 'Style Engine', p)); 
            }, 'Style applied successfully')} 
            onCloneStyle={(p) => { setBatchPrompt(p); setActiveTab('batch'); }} 
            isLoading={isLoading} 
            setIsInteracting={setIsInteracting} 
            previewFilters={previewFilters} 
            onUpdatePreview={(f) => setPreviewFilters(prev => ({...prev, ...f}))} 
            onApplyPreview={() => {}} 
        />;
        
        case 'adjust': return <AdjustmentPanel 
            currentImageUrl={currentImageUrl} 
            onApplyAdjustment={(p) => handleOperation('Refining Asset...', async () => {
                const r = await generateAdjustedImage(currentImage!, p); 
                addAsset(createAsset(dataURLtoFile(r, 'adjust.png'), 'Refinement Deck', p)); 
            }, 'Adjustments committed')} 
            onCloneStyle={(p) => { setBatchPrompt(p); setActiveTab('batch'); }} 
            isLoading={isLoading} 
            setIsInteracting={setIsInteracting} 
            previewFilters={previewFilters} 
            onUpdatePreview={(f) => setPreviewFilters(prev => ({...prev, ...f}))} 
            onApplyPreview={() => {}} 
        />;
        
        case 'detail': return <DetailEnhancementPanel 
            onApplyDetail={(p) => handleOperation('Enhancing Details...', async () => {
                const r = await generateEnhancedDetailImage(currentImage!, p); 
                addAsset(createAsset(dataURLtoFile(r, 'detail.png'), 'Detail Enhancement', p)); 
            }, 'Detail enhancement complete')} 
            onCloneStyle={(p) => { setBatchPrompt(p); setActiveTab('batch'); }} 
            isLoading={isLoading} 
        />;
        
        case 'remove-bg': return <RemoveBackgroundPanel 
            onRemoveBackground={() => handleOperation('Isolating Subject...', async () => {
                const r = await generateBackgroundRemovedImage(currentImage!); 
                addAsset(createAsset(dataURLtoFile(r, 'remove-bg.png'), 'Subject Isolation', 'Remove Background')); 
            }, 'Background removed successfully')} 
            onReplaceBackground={(p) => handleOperation('Replacing Background...', async () => {
                const r = await generateBackgroundReplacedImage(currentImage!, p); 
                addAsset(createAsset(dataURLtoFile(r, 'replace-bg.png'), 'Subject Isolation', p)); 
            }, 'Background replaced successfully')} 
            isLoading={isLoading} 
        />;
        
        case 'generate': return <GenerateImagePanel 
            onImageSelect={(file) => { const asset = createAsset(file, 'Text to Asset', 'Generated Image'); addAsset(asset); }} 
            isLoading={isLoading} 
            initialPrompt={generationPrompt} 
            initialResolution={generationSettings.resolution}
            initialAspectRatio={generationSettings.aspectRatio}
            identityImage={identityVaultImage || undefined} 
            onOpenPromptBank={() => setActiveTab('prompt-bank')} 
            onSavePrompt={(name, content, category, settings) => handleAddPrompt(name, content, category, settings)} 
            setGlobalLoading={(l) => { setIsLoading(l); }} 
            setLoadingMessage={setLoadingMessage} 
            setLoadingSubMessage={setLoadingSubMessage} 
            onSaveAssets={handleSaveAssets} 
        />;
        
        case 'batch': return <BatchPanel queue={batchQueue} initialPrompt={batchPrompt} onAddToQueue={(f) => setBatchQueue([...batchQueue, ...f.map(file => ({ id: Math.random().toString(), file, status: 'pending' as const }))])} onRemoveFromQueue={(id) => setBatchQueue(batchQueue.filter(q => q.id !== id))} onProcessBatch={handleProcessBatch} isProcessing={isBatchProcessing} />;
        
        case 'prompt-cloner': return <PromptClonerPanel 
            onGeneratePrompt={() => handleOperation('Analyzing Asset...', async () => {
                const r = await generatePromptFromImage(currentImage!); 
                setAnalysisResult(r); 
            }, 'Analysis complete')} 
            result={analysisResult} 
            isLoading={isLoading} 
            onUsePrompt={(p) => { setGenerationPrompt(p); setActiveTab('generate'); }} 
            onSavePrompt={(name, content) => handleAddPrompt(name, content, 'Editorial')} 
        />;
        
        case 'threads': return <ThreadsGeneratorPanel isLoading={isLoading} />;
        
        case 'ugc': return <UGCPanel currentImage={currentImage} onNavigateToGenerate={(p) => { setGenerationPrompt(p); setActiveTab('generate'); }} isLoading={isLoading} />;
        
        case 'upscale': return <UpscalePanel 
            onUpscale={(r) => handleOperation(`Upscaling to ${r}...`, async () => {
                const res = await generateUpscaledImage(currentImage!, r); 
                addAsset(createAsset(dataURLtoFile(res, 'upscale.png'), 'AI Upscale', r)); 
            }, 'Upscale complete')} 
            isLoading={isLoading} 
        />;
        
        case 'avatar-twin': return <AvatarTwinPanel 
            currentImage={currentImage} 
            onAvatarGenerated={(f) => addAsset(createAsset(f, 'Avatar Twin', 'Custom Avatar'))} 
            isLoading={isLoading} 
        />;
        
        case 'video': return <VideoGenerationPanel 
            currentImage={currentImage} 
            isLoading={isLoading} 
            setGlobalLoading={(l) => { setIsLoading(l); }} 
            setLoadingMessage={setLoadingMessage} 
            setLoadingSubMessage={setLoadingSubMessage} 
            onVideoGenerated={(file, prompt) => addAsset(createAsset(file, 'Video Engine', prompt, 'video'))} 
        />;
        
        case 'prompt-studio': return <PromptEnhancerPanel 
            onUsePrompt={(p) => { setGenerationPrompt(p); setActiveTab('generate'); }} 
            isLoading={isLoading} 
            onSavePrompt={(name, content) => handleAddPrompt(name, content, 'Editorial')} 
            initialPrompt={generationPrompt} 
        />;
        
        case 'prompt-bank': return <PromptBankPanel prompts={prompts} onAddPrompt={handleAddPrompt} onDeletePrompt={handleDeletePrompt} onUpdatePrompt={handleUpdatePrompt} onUsePrompt={handleUsePrompt} />;
        case 'account': return <AccountPanel />;
        default: return renderFeatureGrid();
    }
  };

  const viewportWidthClass = {
      'desktop': 'w-full',
      'tablet': 'w-[768px] border-x border-[var(--border-color)] shadow-2xl',
      'mobile': 'w-[375px] border-x border-[var(--border-color)] shadow-2xl'
  }[viewport];

  const filterString = `brightness(${previewFilters.brightness}%) contrast(${previewFilters.contrast}%) saturate(${previewFilters.saturate}%) sepia(${previewFilters.sepia}%) blur(${previewFilters.blur}px) hue-rotate(${previewFilters.hueRotate}deg)`;

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-app)] text-[var(--text-main)] overflow-hidden font-sans selection:bg-[var(--accent-color)] selection:text-[var(--bg-app)] transition-colors duration-500">
        <Header 
            activeView={activeView}
            onLibraryClick={() => setActiveView(activeView === 'workspace' ? 'library' : 'workspace')}
            onHomeClick={handleHomeClick}
            onAccountClick={() => setActiveTab('account')}
            onNewProject={handleNewProject}
            currentViewport={viewport}
            onViewportChange={setViewport}
        />
        
        {/* Global Progress Bar */}
        {isLoading && (
            <div className="absolute top-0 left-0 w-full h-1 z-[1000] overflow-hidden bg-[var(--bg-input)]">
                <div className="h-full bg-[var(--text-main)] animate-[progress_2s_ease-in-out_infinite] origin-left"></div>
            </div>
        )}
        
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
                    {!activeAsset && activeTab === 'none' ? (
                        <StartScreen 
                            onFileSelect={handleImageUpload} 
                            onGenerateClick={() => setActiveTab('generate')}
                            identityImage={identityVaultImage}
                            onManageIdentity={() => setActiveTab('identity')}
                        />
                    ) : (
                        <div className="flex h-full w-full animate-studio-in">
                            <div className={`flex-1 relative flex flex-col items-center justify-center p-8 lg:p-12 overflow-hidden bg-[var(--bg-app)] transition-all duration-300`}>
                                <div className="absolute inset-0 drafting-grid"></div>
                                
                                <div className={`relative flex-1 flex flex-col justify-center items-center h-full transition-all duration-500 ${viewportWidthClass}`}>
                                    {currentImageUrl ? (
                                        <>
                                            <div className="relative group p-1.5 bg-[var(--border-color)] rounded-[var(--radius-2xl)] shadow-premium transition-all duration-500 max-w-full w-fit">
                                                <div className="bg-[var(--bg-panel)] rounded-[1.2rem] overflow-hidden relative shadow-inner">
                                                    {activeAsset?.type === 'video' ? (
                                                        <video src={currentImageUrl} controls autoPlay loop className={`max-h-[70vh] w-auto max-w-full transition-all`} />
                                                    ) : (
                                                        <>
                                                            {/* Low-res Proxy for real-time interaction */}
                                                            {isInteracting && proxyUrl && (
                                                                <img 
                                                                    src={proxyUrl} 
                                                                    alt="Preview Proxy" 
                                                                    className="max-h-[70vh] w-auto max-w-full absolute inset-0 z-20 pointer-events-none"
                                                                    style={{ filter: filterString }}
                                                                />
                                                            )}
                                                            
                                                            {/* High-res Main Image */}
                                                            <img 
                                                              src={currentImageUrl} 
                                                              alt="Asset" 
                                                              className={`max-h-[70vh] w-auto max-w-full ${isInteracting ? 'opacity-0' : 'opacity-100'}`} 
                                                              style={{ 
                                                                  filter: filterString,
                                                                  transition: 'opacity 0.15s ease-out'
                                                              }} 
                                                            />
                                                        </>
                                                    )}
                                                </div>
                                                {isLoading && <div className="absolute inset-0 bg-[var(--bg-app)]/60 backdrop-blur-md rounded-[var(--radius-2xl)] flex items-center justify-center z-20"><Spinner message={loadingMessage} subMessage={loadingSubMessage} /></div>}
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
                                    <button onClick={() => setActiveTab('none')} className="absolute top-8 left-8 p-4 rounded-full bg-[var(--bg-panel)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-studio border border-[var(--border-color)] shadow-premium z-40 hover:scale-105 active:scale-95">
                                        <ArrowLeftIcon className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                            
                            <aside className="w-[420px] h-full bg-[var(--bg-sidebar)] border-l border-[var(--border-color)] overflow-y-auto custom-scrollbar p-6 shrink-0 relative z-30 shadow-sidebar transition-colors duration-300">
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
        
        <footer className="w-full py-3 bg-[var(--bg-app)] border-t border-[var(--border-color)] text-center shrink-0 z-50 transition-colors duration-300">
            <p className="text-[9px] font-black tracking-[0.2em] text-[var(--text-muted)] uppercase opacity-40 hover:opacity-100 transition-opacity">
                NUR AMIRAH MOHD KAMIL 2026 COPYRIGHT
            </p>
        </footer>

        {/* Global Notifications */}
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-[100] items-center pointer-events-none">
            {notification && (
                <div className={`animate-slide-up px-6 py-3 rounded-xl shadow-2xl backdrop-blur-md border flex items-center gap-3 pointer-events-auto ${
                    notification.type === 'success' 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                        : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                }`}>
                    {notification.type === 'success' ? <CheckCircleIcon className="w-5 h-5" /> : <InfoIcon className="w-5 h-5" />}
                    <p className="text-[11px] font-black uppercase tracking-widest text-[var(--text-main)]">{notification.message}</p>
                </div>
            )}
            
            {error && (
                <div className="bg-red-500/10 text-red-400 px-6 py-4 rounded-xl shadow-2xl animate-slide-up flex items-center gap-3 border border-red-500/20 pointer-events-auto">
                    <XMarkIcon className="w-5 h-5 shrink-0" />
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-widest text-white">System Error</p>
                        <p className="text-[10px] opacity-90">{error}</p>
                    </div>
                    <button onClick={() => setError(null)} className="ml-4 hover:opacity-50"><XMarkIcon className="w-4 h-4" /></button>
                </div>
            )}
        </div>
    </div>
  );
};

export default App;
