
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef } from 'react';
import { VideoCameraIcon, PencilIcon, FilmIcon, UploadIcon, PhotoIcon, XMarkIcon, ChevronDownIcon } from './icons';
import Tooltip from './Tooltip';
import { generateVideo, generateVideoFromImage } from '../services/geminiService';
import VideoEditor from './VideoEditor';

interface VideoGenerationPanelProps {
  currentImage: File | null;
  isLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
  setLoadingMessage?: (msg: string) => void;
  setLoadingSubMessage?: (msg: string) => void;
  onVideoGenerated?: (file: File, prompt: string) => void;
}

interface GeneratedVideo {
    id: string;
    url: string; // Blob URL
    prompt: string;
    date: number;
}

const REASSURING_MESSAGES = [
    "Synthesizing cinematic frames...",
    "Ensuring temporal consistency...",
    "Refining identity stability...",
    "Polishing motion dynamics...",
    "Applying professional lighting...",
    "Optimizing production quality...",
    "Finalizing visual architecture..."
];

const VideoGenerationPanel: React.FC<VideoGenerationPanelProps> = ({ 
    currentImage, 
    isLoading, 
    setGlobalLoading, 
    setLoadingMessage,
    setLoadingSubMessage,
    onVideoGenerated 
}) => {
  const [prompt, setPrompt] = useState('');
  const [useImage, setUseImage] = useState(!!currentImage);
  const [localImage, setLocalImage] = useState<File | null>(null);
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [checkingKey, setCheckingKey] = useState<boolean>(true);
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [videoToEdit, setVideoToEdit] = useState<string | null>(null);

  const activeImage = localImage || currentImage;

  useEffect(() => {
      if (localImage) {
          setUseImage(true);
      }
  }, [localImage]);

  useEffect(() => {
    checkApiKey();
  }, []);

  // Sync internal reassuring messages with global spinner
  useEffect(() => {
    let interval: number;
    let messageIndex = 0;

    if (isLoading) {
        if (setLoadingMessage) setLoadingMessage(REASSURING_MESSAGES[0]);
        if (setLoadingSubMessage) setLoadingSubMessage("Motion Engine Active");

        interval = window.setInterval(() => {
            messageIndex = (messageIndex + 1) % REASSURING_MESSAGES.length;
            if (setLoadingMessage) setLoadingMessage(REASSURING_MESSAGES[messageIndex]);
        }, 5000);
    } else {
        if (setLoadingMessage) setLoadingMessage('Processing...');
        if (setLoadingSubMessage) setLoadingSubMessage('');
    }
    return () => window.clearInterval(interval);
  }, [isLoading, setLoadingMessage, setLoadingSubMessage]);

  const checkApiKey = async () => {
    setCheckingKey(true);
    try {
        const win = window as any;
        if (win.aistudio) {
            const hasKey = await win.aistudio.hasSelectedApiKey();
            setHasApiKey(hasKey);
        } else {
            setHasApiKey(true);
        }
    } catch (e) {
        console.error("Error checking API key:", e);
    } finally {
        setCheckingKey(false);
    }
  };

  const handleSelectKey = async () => {
      const win = window as any;
      if (win.aistudio) {
          await win.aistudio.openSelectKey();
          setHasApiKey(true);
      }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setLocalImage(e.target.files[0]);
      }
  };

  const handleGenerate = async () => {
    if (!prompt?.trim() && (!useImage || !activeImage)) return;
    
    setError(null);
    setGlobalLoading(true);

    try {
        let uri: string;
        if (useImage && activeImage) {
            uri = await generateVideoFromImage(activeImage, prompt, { resolution, aspectRatio });
        } else {
            uri = await generateVideo(prompt, { resolution, aspectRatio });
        }
        
        const res = await fetch(uri);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);

        // Notify parent to add asset
        if (onVideoGenerated) {
            const file = new File([blob], `video-${Date.now()}.mp4`, { type: 'video/mp4' });
            onVideoGenerated(file, prompt || (activeImage ? `Animate: ${activeImage.name}` : 'Generated Video'));
        }
        
        const newVideo: GeneratedVideo = {
            id: Date.now().toString(),
            url: blobUrl,
            prompt: prompt || (activeImage ? `Animate: ${activeImage.name}` : 'Generated Video'),
            date: Date.now()
        };

        setGeneratedVideos(prev => [newVideo, ...prev]);

    } catch (err: any) {
        console.error("Video generation error:", err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        
        if (errorMessage.includes("Requested entity was not found") || errorMessage.includes("404")) {
            setError("API Key session expired or invalid. Please select your key again.");
            setHasApiKey(false);
        } else {
            setError(errorMessage);
        }
    } finally {
        setGlobalLoading(false);
    }
  };

  const handleOpenEditor = (videoUrl: string) => {
      setVideoToEdit(videoUrl);
      setIsEditing(true);
  };

  const handleSaveEdit = (newBlob: Blob) => {
      const blobUrl = URL.createObjectURL(newBlob);
      const newVideo: GeneratedVideo = {
          id: Date.now().toString(),
          url: blobUrl,
          prompt: `Edited Video ${new Date().toLocaleTimeString()}`,
          date: Date.now()
      };
      setGeneratedVideos(prev => [newVideo, ...prev]);
      setIsEditing(false);
      setVideoToEdit(null);
      
      if (onVideoGenerated) {
          const file = new File([newBlob], `edited-video-${Date.now()}.mp4`, { type: 'video/mp4' });
          onVideoGenerated(file, newVideo.prompt);
      }
  };

  if (checkingKey) {
      return (
          <div className="w-full h-40 flex items-center justify-center">
              <span className="text-[var(--text-muted)] text-[10px] uppercase font-black tracking-widest animate-pulse">Authenticating Access...</span>
          </div>
      );
  }

  if (!hasApiKey) {
      return (
        <div className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-[2rem] p-10 flex flex-col items-center gap-6 animate-studio-in text-center">
            <div className="bg-[var(--bg-input)] p-5 rounded-full">
                <VideoCameraIcon className="w-8 h-8 text-[var(--text-main)]" />
            </div>
            <h3 className="text-xs font-black uppercase tracking-widest">PRO Motion Access</h3>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed font-medium">
                Veo Video generation requires a paid API key from a Google Cloud Project.
            </p>
            <button
                onClick={handleSelectKey}
                className="w-full bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-black py-4 rounded-2xl transition-all shadow-premium active:scale-95 text-[10px] uppercase tracking-widest mt-2"
            >
                Connect Video Key
            </button>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-[9px] text-[var(--text-muted)] underline uppercase tracking-[0.2em] opacity-40">
                Billing Documentation
            </a>
        </div>
      );
  }

  return (
    <>
        <div className="w-full flex flex-col gap-6 animate-studio-in pb-12">
            <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-[2rem] p-6 space-y-6">
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="p-4 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-color)]">
                        <VideoCameraIcon className="w-7 h-7 text-[var(--text-main)]" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-[11px] font-black tracking-[0.3em] uppercase text-[var(--text-main)]">Motion Engine</h3>
                        <p className="text-[10px] text-[var(--text-muted)] font-medium opacity-50">Veo Cinematic Synthesis</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={useImage && activeImage ? "Describe motion flow (e.g. 'cinematic orbit')..." : "Describe the cinematic scene..."}
                        className="w-full h-32 bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] rounded-2xl p-4 text-[12px] font-medium focus:border-white transition-studio outline-none resize-none placeholder:text-[var(--text-muted)]/30"
                        disabled={isLoading}
                    />

                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileChange}
                    />

                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Reference Frame</label>
                        
                        {activeImage ? (
                            <div className="flex items-center gap-3 p-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-input)]">
                                <input 
                                    type="checkbox" 
                                    checked={useImage} 
                                    onChange={(e) => setUseImage(e.target.checked)}
                                    className="w-4 h-4 rounded border-white/10 bg-black text-white focus:ring-white cursor-pointer"
                                    disabled={isLoading}
                                    id="use-image-checkbox"
                                />
                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-[var(--bg-panel)] border border-[var(--border-color)]">
                                    <img src={URL.createObjectURL(activeImage)} alt="Reference" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-grow min-w-0 flex flex-col justify-center">
                                    <label htmlFor="use-image-checkbox" className="text-[10px] font-bold text-[var(--text-main)] truncate cursor-pointer select-none">
                                        Animate Frame
                                    </label>
                                </div>
                                <Tooltip text="Replace Frame">
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-2 text-[var(--text-muted)] hover:text-white transition-colors"
                                    >
                                        <UploadIcon className="w-4 h-4" />
                                    </button>
                                </Tooltip>
                            </div>
                        ) : (
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full border border-dashed border-[var(--border-color)] rounded-2xl p-6 flex flex-col items-center justify-center gap-2 hover:bg-[var(--bg-input)] transition-studio text-[var(--text-muted)] hover:text-[var(--text-main)]"
                            >
                                <PhotoIcon className="w-5 h-5" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Upload Keyframe</span>
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Resolution</label>
                            <div className="flex gap-1 bg-[var(--bg-input)] p-1 rounded-xl border border-[var(--border-color)]">
                                {['720p', '1080p'].map((res) => (
                                    <button
                                        key={res}
                                        onClick={() => setResolution(res as any)}
                                        className={`flex-1 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                                            resolution === res ? 'bg-white text-black shadow-premium' : 'text-[var(--text-muted)] hover:text-white'
                                        }`}
                                    >
                                        {res}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Aspect</label>
                            <div className="flex gap-1 bg-[var(--bg-input)] p-1 rounded-xl border border-[var(--border-color)]">
                                {['16:9', '9:16'].map((asp) => (
                                    <button
                                        key={asp}
                                        onClick={() => setAspectRatio(asp as any)}
                                        className={`flex-1 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                                            aspectRatio === asp ? 'bg-white text-black shadow-premium' : 'text-[var(--text-muted)] hover:text-white'
                                        }`}
                                    >
                                        {asp}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || (!prompt?.trim() && (!useImage || !activeImage))}
                        className="w-full bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-black py-4.5 rounded-2xl transition-all shadow-premium active:scale-[0.98] flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.25em] hover:shadow-hover hover:-translate-y-0.5 disabled:opacity-20"
                    >
                        {isLoading ? 'Synthesizing...' : 'Synthesize Motion'}
                    </button>
                </div>
            </div>

            {error && <p className="text-red-400 text-[10px] font-black uppercase tracking-widest text-center bg-red-900/10 p-4 rounded-xl border border-red-900/20">{error}</p>}
            
            <div className="border-t border-[var(--border-color)] pt-6 space-y-4">
                <div className="flex justify-between items-center px-1">
                    <h4 className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Motion Archive</h4>
                    <span className="text-[9px] bg-[var(--bg-input)] py-1 px-2 rounded-lg font-mono text-[var(--text-muted)]">{generatedVideos.length}</span>
                </div>
                
                {generatedVideos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-[var(--text-muted)] opacity-20 border border-dashed border-[var(--border-color)] rounded-2xl">
                        <FilmIcon className="w-8 h-8 mb-2" />
                        <p className="text-[9px] font-black uppercase tracking-widest">No synthesis data</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {generatedVideos.map((video) => (
                            <div key={video.id} className="bg-[var(--bg-input)] border border-[var(--border-color)] rounded-2xl overflow-hidden flex flex-col shadow-sm group">
                                <div className="aspect-video bg-black relative">
                                    <video controls className="w-full h-full object-contain">
                                        <source src={video.url} type="video/mp4" />
                                    </video>
                                    
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Tooltip text="Open Edit Suite">
                                            <button 
                                                onClick={() => handleOpenEditor(video.url)}
                                                className="bg-white text-black p-2.5 rounded-full shadow-premium hover:scale-110 transition-transform"
                                            >
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                        </Tooltip>
                                    </div>
                                </div>
                                <div className="p-4 flex justify-between items-center bg-[var(--bg-panel)]">
                                    <p className="text-[9px] text-[var(--text-muted)] truncate max-w-[150px] font-bold uppercase tracking-wide" title={video.prompt}>{video.prompt}</p>
                                    <a 
                                        href={video.url} 
                                        download={`miva-synthesis-${video.id}.mp4`}
                                        className="text-[9px] font-black text-[var(--text-main)] hover:text-[var(--text-muted)] uppercase tracking-widest transition-colors"
                                    >
                                        Download
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

        {isEditing && videoToEdit && (
            <VideoEditor 
                initialVideoUrl={videoToEdit}
                library={generatedVideos.filter(v => v.url !== videoToEdit)}
                onSave={handleSaveEdit}
                onCancel={() => {
                    setIsEditing(false);
                    setVideoToEdit(null);
                }}
            />
        )}
    </>
  );
};

export default VideoGenerationPanel;
